/* File: src/core/modules/system/services/system.service.ts */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SystemGateway } from '../system.gateway';
import { StartMaintenancePayloadDTO }
    from '../dto/start-maintenance.payload';
import { CancellablePromise, Delay } from '@src/utils/delay';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DockerService } from '../../docker/docker.service';
import { DiscordService } from '../../discord/services/discord.service';
import { formatInTimeZone } from 'date-fns-tz';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';
import { SystemStatus, SystemStatusData } from '@hms/shared-types/hms';
import { randomUUID } from 'crypto';

/* ─────────────────────────────────────────────────────────────────────
 * Types
 * ──────────────────────────────────────────────────────────────────── */

/**
 * Extends the base system status with maintenance-related fields used
 * by the admin panel and Discord notifications.
 */
export interface ExtendedSystemStatusData extends SystemStatusData {
    lastDownReason?: string;
    maintenanceError?: string;
    requiresAttention?: boolean;
    preparationTimeInSeconds?: number;
    maintenanceDurationInSeconds?: number;
    maintenanceStartTime?: string;
    maintenanceId?: string;
}

/** Status buckets for API init report emitted by the API app. */
export type InitStatus = 'success' | 'partial' | 'failed';

/** Single step result in the initialization report. */
export interface StepResult {
    status: InitStatus;
    message?: string;
}

/** Initialization report contract mirrored from the API app. */
export interface InitReport {
    overallStatus: InitStatus;
    steps: {
        name: string;
        status: InitStatus;
        message?: string;
        /** Duration in milliseconds. */
        duration: number;
        service: string;
    }[];
    /** ISO string timestamp (UTC) emitted by the API. */
    timestamp: string;
    /** Total duration in milliseconds. */
    duration: number;
    /** Optional maintenance scope identifier. */
    maintenanceId?: string;
}

/**
 * Redis payload used to persist a maintenance-scoped initialization
 * report. It keeps metadata so we can track incremental merges.
 */
interface MaintenanceInitReportState {
    maintenanceId: string;
    report: InitReport;
    updatedAt: string;
    updates: number;
}

/* ─────────────────────────────────────────────────────────────────────
 * SystemService
 * ──────────────────────────────────────────────────────────────────── */

/**
 * @class SystemService
 *
 * @description
 * Central orchestration service for platform status and maintenance.
 * Responsibilities:
 *  - Store/emit status updates (Redis + WebSocket).
 *  - Coordinate maintenance scheduling with countdown.
 *  - Start/stop API container and supervise API initialization phase.
 *  - Produce Discord notifications with concise, actionable text.
 *
 * @design
 *  - Status source of truth is Redis key `system:status`.
 *  - API readiness is tracked by Redis key `api:ready` (string 'true'/'false').
 *  - During maintenance end, a timeout guards API init completion, with
 *    partial/failed outcomes handled via dedicated channels.
 *
 * @safety
 *  - If `startMaintenance` fails at any point, the system remains `Up`.
 *    A rollback sets `api:ready` back to 'true' and notifies Discord.
 *  - Time formatting uses IANA `Etc/UTC` with a robust fallback to avoid
 *    "Invalid time zone specified: UTC" on runtimes lacking ICU data.
 */
@Injectable()
export class SystemService implements OnModuleInit {
    readonly logger = new Logger(SystemService.name);

    /* ── Redis keys and pub/sub channels ─────────────────────────────── */

    static readonly API_READY_KEY = 'api:ready';
    static readonly API_ERROR_CHANNEL = 'api:error';
    static readonly API_READY_CHANNEL = 'api:ready';
    static readonly API_INIT_SUCCESS = 'api:init-success';
    static readonly API_INIT_PARTIAL = 'api:init-partial';
    static readonly API_INIT_FAILED = 'api:init-failed';
    static readonly API_INIT_TIMEOUT_MS = 1000 * 60 * 5; // 5 minutes
    static readonly REDIS_SYSTEM_STATUS_KEY = 'system:status';
    static readonly MAINTENANCE_ACTIVE_KEY = 'maintenance:active';
    static readonly MAINTENANCE_CURRENT_ID_KEY = 'maintenance:current:id';
    static readonly MAINTENANCE_INIT_REPORT_PREFIX =
        'maintenance:init-report:';
    static readonly MAINTENANCE_RELEASE_REQUESTED_KEY =
        'maintenance:release:requested';

    /* ── Discord messages (centralized constants) ────────────────────── */

    static readonly DISCORD_MESSAGES = {
        STARTED: '🟢 System Started',
        STOPPED: '⚠️ System Stopped',
        MAINTENANCE_CANCELLED: '✅ Maintenance Cancelled',
        MAINTENANCE_SCHEDULED_TITLE: '🛠️ Maintenance Scheduled',
        MAINTENANCE_STARTED_TITLE: '🔧 Maintenance Started',
        MAINTENANCE_ENDING_TITLE: '🔄 Ending Maintenance',
        MAINTENANCE_FAILED_TITLE: '❌ Maintenance Failed',
        INIT_SUCCESS_TITLE: '✅ API Initialized Successfully',
        INIT_PARTIAL_TITLE: '⚠️ API Initialized with Warnings',
        INIT_FAILED_TITLE: '❌ API Initialization Failed',
        INIT_TIMEOUT_TITLE: '⏱️ API Initialization Timeout',
        INIT_WAITING: '⏳ API Initializing',
        MAINTENANCE_COMPLETED: '✅ Maintenance Completed',
    };

    /* ── Internal state ──────────────────────────────────────────────── */

    private _statusData: ExtendedSystemStatusData = {
        status: SystemStatus.Down,
    };

    private _preparationPromise?: CancellablePromise<void>;
    private _initTimeout?: NodeJS.Timeout;
    private readonly inProduction: boolean;

    constructor(
        private readonly redisService: RedisService,
        private readonly dockerService: DockerService,
        private readonly discordService: DiscordService,
        private readonly systemGateway: SystemGateway,
        private readonly eventEmitter: EventEmitter2,
        private readonly configService: ConfigService,
    ) {
        this.inProduction =
            this.configService.get('APP_ENVIRONMENT') === 'production';
    }

    /* ── Basic accessors ─────────────────────────────────────────────── */

    /** Current enum status. */
    get status(): SystemStatus {
        return this._statusData.status;
    }

    /** Current full status snapshot. */
    get statusData(): SystemStatusData {
        return this._statusData;
    }

    /** True when system is under maintenance window. */
    get isUnderMaintenance(): boolean {
        return this._statusData.status === SystemStatus.UnderMaintenance;
    }

    /** True when system is operational. */
    get isUp(): boolean {
        return this._statusData.status === SystemStatus.Up;
    }

    /** True when system is not operational. */
    get isDown(): boolean {
        return this._statusData.status === SystemStatus.Down;
    }

    /* ── Lifecycle ──────────────────────────────────────────────────── */

    /**
     * Initializes status and Redis listeners on module bootstrap.
     */
    async onModuleInit(): Promise<void> {
        await this.initializeStatus();
        await this.setupRedisListeners();
    }

    /* ── Maintenance API ─────────────────────────────────────────────── */

    /**
     * Schedules a maintenance window with a preparation countdown.
     *
     * Behavior:
     *  - Marks `api:ready` as 'false' to inform dependents about upcoming
     *    unavailability.
     *  - Sets status to `PreparingMaintenance` and emits notifications.
     *  - After countdown, stops the API container and flips status to
     *    `UnderMaintenance`.
     *
     * Failure policy:
     *  - On ANY error, the system **remains Up**. We rollback `api:ready`
     *    to 'true', restore status to `Up`, notify Discord, and rethrow.
     *
     * @param payload Validated durations in seconds.
     */
    async startMaintenance(
        payload: StartMaintenancePayloadDTO,
    ): Promise<void> {
        // Keep the last known 'Up' status in memory for rollback purposes.
        const wasUpBefore = this.isUp;
        const maintenanceId = this.resolveMaintenanceId(payload.maintenance_id);

        try {
            await this.cancelMaintenancePreparation();
            await this.redisService.set(
                SystemService.MAINTENANCE_ACTIVE_KEY,
                'true',
            );
            await this.redisService.set(
                SystemService.MAINTENANCE_CURRENT_ID_KEY,
                maintenanceId,
            );
            await this.redisService.set(
                SystemService.MAINTENANCE_RELEASE_REQUESTED_KEY,
                'false',
            );
            await this.redisService.set(SystemService.API_READY_KEY, 'false');

            const startTime = new Date(
                Date.now() + payload.preparation_duration_in_seconds * 1000,
            );

            const formattedTime = this.safeFormatUtc(
                startTime,
                "yyyy-MM-dd HH:mm:ss 'UTC' (OOOO)",
            );

            await this.setSystemStatus({
                status: SystemStatus.PreparingMaintenance,
                preparationTimeInSeconds:
                    payload.preparation_duration_in_seconds,
                maintenanceStartTime: formattedTime,
                maintenanceDurationInSeconds:
                    payload.maintenance_duration_in_seconds,
                maintenanceId,
            });

            await this.discordService.sendMaintenanceNotification(
                SystemService.DISCORD_MESSAGES.MAINTENANCE_SCHEDULED_TITLE,
                // Maintenance IDs are sensitive and must never be sent
                // to public channels.
                `**Start Time:** ${formattedTime}\n` +
                `**Preparation:** ` +
                `${payload.preparation_duration_in_seconds}s\n` +
                `**Expected Duration:** ` +
                `${payload.maintenance_duration_in_seconds}s`,
            );

            const prepTimeMs = payload.preparation_duration_in_seconds * 1000;
            this._preparationPromise = Delay.for(prepTimeMs);

            this._preparationPromise.promise
                .then(async () => {
                    await this.dockerService.stopApiContainer();
                    await this.setSystemStatus({
                        status: SystemStatus.UnderMaintenance,
                        maintenanceDurationInSeconds:
                            payload.maintenance_duration_in_seconds,
                        maintenanceStartTime: formattedTime,
                        maintenanceId,
                    });

                    await this.discordService.sendMaintenanceNotification(
                        SystemService.DISCORD_MESSAGES.MAINTENANCE_STARTED_TITLE,
                        `System is now under maintenance\n` +
                        `**Started At:** ${formattedTime}\n` +
                        `**Expected Duration:** ` +
                        `${payload.maintenance_duration_in_seconds}s`,
                    );
                })
                .catch((error) => {
                    this.logger.error('Maintenance preparation failed', error);

                    // Keep service available if preparation countdown fails.
                    this.discordService.sendMaintenanceNotification(
                        SystemService.DISCORD_MESSAGES.MAINTENANCE_FAILED_TITLE,
                        `**Error:** ${error.message}\n` +
                        `System remains operational`,
                    );
                })
                .finally(() => {
                    this._preparationPromise = undefined;
                });

            this.logger.log(
                `Maintenance scheduled to start at ${formattedTime}`,
            );
        } catch (error) {
            // ── Failure policy: DO NOT set system Down ────────────────────
            this.logger.error('Error starting maintenance', error);

            // Rollback readiness: inform dependents system is still ready.
            await this.redisService.set(
                SystemService.MAINTENANCE_ACTIVE_KEY,
                'false',
            );
            await this.redisService.del(
                SystemService.MAINTENANCE_CURRENT_ID_KEY,
            );
            await this.redisService.set(SystemService.API_READY_KEY, 'true');

            // If we were Up, put the status back to Up (idempotent, safe).
            if (wasUpBefore) {
                await this.setSystemStatus({ status: SystemStatus.Up });
            }

            await this.discordService.sendMaintenanceNotification(
                SystemService.DISCORD_MESSAGES.MAINTENANCE_FAILED_TITLE,
                `**Error:** ${(error as any)?.message ?? 'Unknown'}\n` +
                'System remains operational',
            );

            // Re-throw to preserve controller semantics (HTTP 4xx/5xx).
            throw error;
        }
    }

    /**
     * Cancels a scheduled preparation countdown (if any) and restores
     * the system status to Up.
     */
    async cancelMaintenancePreparation(): Promise<void> {
        if (!this._preparationPromise) return;

        try {
            this._preparationPromise.cancel();
            await this.setSystemStatus({ status: SystemStatus.Up });
            await this.redisService.set(
                SystemService.MAINTENANCE_ACTIVE_KEY,
                'false',
            );
            await this.redisService.del(
                SystemService.MAINTENANCE_CURRENT_ID_KEY,
            );
            await this.redisService.set(
                SystemService.MAINTENANCE_RELEASE_REQUESTED_KEY,
                'false',
            );
            this._preparationPromise = undefined;

            await this.discordService.sendMaintenanceNotification(
                SystemService.DISCORD_MESSAGES.MAINTENANCE_CANCELLED,
                'Maintenance preparation was cancelled.\n' +
                'System remains operational.',
            );

            this.logger.log('Maintenance preparation cancelled');
        } catch (error) {
            this.logger.error(
                'Error cancelling maintenance preparation',
                error,
            );
            throw error;
        }
    }

    /**
     * Transitions from UnderMaintenance to the API init phase by
     * starting the API container and waiting for init signals or
     * timeout.
     */
    async endMaintenance(): Promise<void> {
        if (!this.isUnderMaintenance) return;

        try {
            this.clearInitTimeout();
            await this.redisService.set(
                SystemService.MAINTENANCE_RELEASE_REQUESTED_KEY,
                'true',
            );

            await this.discordService.sendMaintenanceNotification(
                SystemService.DISCORD_MESSAGES.MAINTENANCE_ENDING_TITLE,
                'Maintenance release was requested.\n' +
                'Verifying API readiness and starting startup checks.',
            );

            if (await this.checkApiReady()) {
                this.logger.log(
                    'API already reported as ready; finishing maintenance',
                );
                await this.completeMaintenance();
                return;
            }

            this.logger.log('Starting API container after maintenance');
            await this.dockerService.startApiContainer();

            this._initTimeout = setTimeout(
                () => this.handleInitTimeout(),
                SystemService.API_INIT_TIMEOUT_MS,
            );

            await this.discordService.sendMaintenanceNotification(
                SystemService.DISCORD_MESSAGES.INIT_WAITING,
                `Waiting for API to complete startup routine\n` +
                `**Timeout:** ` +
                `${SystemService.API_INIT_TIMEOUT_MS / 60000} minutes`,
            );
        } catch (error) {
            this.logger.error('Error ending maintenance', error);
            await this.handleMaintenanceFailure(
                `Failed to start API: ${(error as any).message}`,
            );
            throw error;
        }
    }

    /**
     * Sets system Down and emits a STOP notification.
     * Primarily used for explicit stop flows or fatal situations.
     */
    async stop(): Promise<void> {
        try {
            await this.setSystemStatus({ status: SystemStatus.Down });
            await this.discordService.sendStatusNotification(
                SystemService.DISCORD_MESSAGES.STOPPED,
            );
        } catch (error) {
            this.logger.error('Error stopping system', error);
            throw error;
        }
    }

    /**
     * Sets system Up and emits a START notification.
     */
    async start(): Promise<void> {
        try {
            await this.setSystemStatus({ status: SystemStatus.Up });
            await this.discordService.sendStatusNotification(
                SystemService.DISCORD_MESSAGES.STARTED,
            );
        } catch (error) {
            this.logger.error('Error starting system', error);
            throw error;
        }
    }

    /**
     * Persists the status to Redis, emits domain events and notifies
     * connected WebSocket clients.
     *
     * @param data Extended status snapshot to store/emit.
     */
    async setSystemStatus(data: ExtendedSystemStatusData): Promise<void> {
        try {
            if (this.isMaintenanceStatus(data.status)) {
                await this.redisService.set(
                    SystemService.MAINTENANCE_ACTIVE_KEY,
                    'true',
                );
            }

            this._statusData = data;

            await this.redisService.set(
                SystemService.REDIS_SYSTEM_STATUS_KEY,
                JSON.stringify(data),
            );

            this.eventEmitter.emit('system.status.changed', data);
            this.systemGateway.notifySystemStatus(data);
        } catch (error) {
            this.logger.error('Error setting system status', error);
            throw error;
        }
    }

    /* ── Utilities ──────────────────────────────────────────────────── */

    /**
     * Converts a SystemStatus enum to a concise human-readable label.
     */
    static toReadableStatus(status: SystemStatus): string {
        switch (status) {
            case SystemStatus.Up:
                return 'Up';
            case SystemStatus.Down:
                return 'Down';
            case SystemStatus.PreparingMaintenance:
                return 'Preparing Maintenance';
            case SystemStatus.UnderMaintenance:
                return 'Under Maintenance';
            default:
                return 'Unknown';
        }
    }

    /** Returns true when status belongs to maintenance flow. */
    private isMaintenanceStatus(status: SystemStatus): boolean {
        return [
            SystemStatus.PreparingMaintenance,
            SystemStatus.UnderMaintenance,
        ].includes(status);
    }

    /**
     * Reads bootstrap-related Redis keys with a short bounded retry window.
     * This avoids false `Down` initialization during service restarts when
     * Redis reads are momentarily inconsistent right after reconnect.
     */
    private async readBootstrapSnapshot(): Promise<{
        systemStatus: string | null;
        apiReady: string | null;
        maintenanceActiveRaw: string | null;
    }> {
        const maxAttempts = 5;
        const retryDelayMs = 150;

        let snapshot = {
            systemStatus: null as string | null,
            apiReady: null as string | null,
            maintenanceActiveRaw: null as string | null,
        };

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            const [systemStatus, apiReady, maintenanceActiveRaw] =
                await Promise.all([
                    this.redisService.get(SystemService.REDIS_SYSTEM_STATUS_KEY),
                    this.redisService.get(SystemService.API_READY_KEY),
                    this.redisService.get(SystemService.MAINTENANCE_ACTIVE_KEY),
                ]);

            snapshot = {
                systemStatus,
                apiReady,
                maintenanceActiveRaw,
            };

            if (
                systemStatus ||
                apiReady === 'true' ||
                maintenanceActiveRaw === 'true'
            ) {
                return snapshot;
            }

            if (attempt < maxAttempts) {
                await new Promise((resolve) =>
                    setTimeout(resolve, retryDelayMs)
                );
            }
        }

        return snapshot;
    }

    /**
     * Initializes status based on Redis keys. Defaults to Down when
     * there's no prior state or API is not ready yet.
     */
    private async initializeStatus(): Promise<void> {
        try {
            await this.redisService.ping();

            const {
                systemStatus,
                apiReady,
                maintenanceActiveRaw,
            } = await this.readBootstrapSnapshot();

            const maintenanceFlag = maintenanceActiveRaw === 'true';

            if (systemStatus) {
                this._statusData = JSON.parse(systemStatus);

                if (this.isMaintenanceStatus(this._statusData.status)) {
                    if (!maintenanceFlag) {
                        await this.redisService.set(
                            SystemService.MAINTENANCE_ACTIVE_KEY,
                            'true',
                        );
                        this.logger.warn(
                            'Persisted maintenance status found without lock. ' +
                            'Rehydrating maintenance lock key',
                        );
                    }

                    this.logger.log(
                        `System initialized in ` +
                        `${SystemService.toReadableStatus(
                            this._statusData.status,
                        )} state`,
                    );
                    return;
                }

                if (
                    maintenanceFlag &&
                    ![
                        SystemStatus.PreparingMaintenance,
                        SystemStatus.UnderMaintenance,
                    ].includes(this._statusData.status)
                ) {
                    await this.setSystemStatus({
                        ...this._statusData,
                        status: SystemStatus.UnderMaintenance,
                    });

                    this.logger.warn(
                        'Maintenance active lock found. ' +
                        'Forcing UnderMaintenance state',
                    );
                    return;
                }

                this.logger.log(
                    `System initialized in ` +
                    `${SystemService.toReadableStatus(this._statusData.status)} ` +
                    `state`,
                );
                return;
            }

            if (maintenanceFlag) {
                await this.setSystemStatus({
                    status: SystemStatus.UnderMaintenance,
                    maintenanceError: 'Restored maintenance lock from Redis',
                });

                this.logger.warn(
                    'Maintenance active lock found without status key. ' +
                    'Restoring UnderMaintenance state',
                );
                return;
            }

            if (apiReady === 'true') {
                await this.setSystemStatus({ status: SystemStatus.Up });
                this.logger.warn(
                    'System status key missing. Falling back to UP from api:ready',
                );
                return;
            }

            if (!systemStatus || !apiReady || apiReady !== 'true') {
                await this.setSystemStatus({
                    status: SystemStatus.Down,
                    lastDownReason: 'Initializing system',
                });
                this.logger.warn('System initialized in DOWN state');
            }
        } catch (error) {
            this.logger.error('Initialization error', error);

            try {
                if (
                    (
                        await this.redisService.get(
                            SystemService.MAINTENANCE_ACTIVE_KEY,
                        )
                    ) === 'true'
                ) {
                    await this.setSystemStatus({
                        status: SystemStatus.UnderMaintenance,
                        maintenanceError: 'Initialization error with active maintenance lock',
                    });

                    this.logger.warn(
                        'Initialization failed but maintenance lock is active. ' +
                        'Restoring UnderMaintenance state',
                    );
                    return;
                }
            } catch (lockError) {
                this.logger.error(
                    'Failed to verify maintenance lock during initialization recovery',
                    lockError,
                );
            }

            await this.setSystemStatus({
                status: SystemStatus.Down,
                lastDownReason: 'Initialization error',
            });
        }
    }

    /**
     * Subscribes to Redis channels to receive API error/ready and
     * init-report messages. Routes them to the appropriate handlers.
     */
    private async setupRedisListeners(): Promise<void> {
        try {
            await this.redisService.subscribe(
                SystemService.API_ERROR_CHANNEL,
                async (message: string) => {
                    this.logger.error(`API error reported: ${message}`);
                    if (this.isUnderMaintenance) {
                        await this.handleMaintenanceFailure(message);
                    } else {
                        await this.handleSystemFailure(message);
                    }
                },
            );

            await this.redisService.subscribe(
                SystemService.API_INIT_SUCCESS,
                async (message: string) =>
                    await this.handleInitSuccess(JSON.parse(message)),
            );

            await this.redisService.subscribe(
                SystemService.API_INIT_PARTIAL,
                async (message: string) =>
                    await this.handleInitPartial(JSON.parse(message)),
            );

            await this.redisService.subscribe(
                SystemService.API_INIT_FAILED,
                async (message: string) =>
                    await this.handleInitFailed(JSON.parse(message)),
            );

            await this.redisService.subscribe(
                SystemService.API_READY_CHANNEL,
                async (message: string) => {
                    if (message === 'true' && this.isUnderMaintenance) {
                        if (!(await this.isMaintenanceReleaseRequested())) {
                            this.logger.log(
                                'Ignoring api:ready while maintenance is active ' +
                                'without explicit release request',
                            );
                            return;
                        }

                        this.logger.log('API reported ready after maintenance');
                        await this.completeMaintenance();
                    }
                },
            );
        } catch (error) {
            this.logger.error('Error setting up Redis listeners', error);
            throw error;
        }
    }

    /**
     * Handles API init success:
     *  - Clears timeout, sets system Up.
     *  - Maintenance-scoped reports are deferred and published on
     *    maintenance completion through the internal report channel.
     */
    private async handleInitSuccess(report: InitReport): Promise<void> {
        try {
            if (
                this.isUnderMaintenance &&
                !(await this.isMaintenanceReleaseRequested())
            ) {
                this.logger.log(
                    'Ignoring init success while system remains under maintenance',
                );
                return;
            }

            this.clearInitTimeout();
            await this.setSystemStatus({ status: SystemStatus.Up });

            if (!report.maintenanceId) {
                this.logger.log(
                    'Ignoring non-maintenance init success report notification',
                );
                return;
            }

            this.logger.log(
                'Deferring maintenance-scoped init success report ' +
                `for ${report.maintenanceId} until maintenance completion`,
            );
            return;
        } catch (error) {
            this.logger.error('Error handling init success', error);
            throw error;
        }
    }

    /**
     * Handles API init partial:
     *  - Clears timeout, keeps system Up.
     *  - Maintenance-scoped reports are deferred and published on
     *    maintenance completion through the internal report channel.
     */
    private async handleInitPartial(report: InitReport): Promise<void> {
        try {
            if (
                this.isUnderMaintenance &&
                !(await this.isMaintenanceReleaseRequested())
            ) {
                this.logger.log(
                    'Ignoring init partial while system remains under maintenance',
                );
                return;
            }

            this.clearInitTimeout();
            await this.setSystemStatus({ status: SystemStatus.Up });

            if (!report.maintenanceId) {
                this.logger.log(
                    'Ignoring non-maintenance init partial report notification',
                );
                return;
            }

            this.logger.log(
                'Deferring maintenance-scoped init partial report ' +
                `for ${report.maintenanceId} until maintenance completion`,
            );
            return;
        } catch (error) {
            this.logger.error('Error handling partial initialization', error);
            throw error;
        }
    }

    /**
     * Handles API init failure:
     *  - Clears timeout, stops the API container, marks system as
     *    UnderMaintenance with attention required.
     *  - Sends detailed init report only for maintenance-scoped runs
     *    through the internal report channel.
     */
    private async handleInitFailed(report: InitReport): Promise<void> {
        try {
            this.clearInitTimeout();
            await this.dockerService.stopApiContainer();
            await this.redisService.set(
                SystemService.MAINTENANCE_RELEASE_REQUESTED_KEY,
                'false',
            );

            await this.setSystemStatus({
                status: SystemStatus.UnderMaintenance,
                maintenanceError:
                    report.overallStatus === 'failed'
                        ? report.steps.find((s) => s.status === 'failed')
                            ?.message || 'Unknown initialization error'
                        : 'Partial initialization with failure',
                requiresAttention: true,
            });

            if (!report.maintenanceId) {
                this.logger.log(
                    'Ignoring non-maintenance init failed report notification',
                );
                return;
            }

            const discordMessage = this.formatInitReportForDiscord(
                report,
                SystemService.DISCORD_MESSAGES.INIT_FAILED_TITLE,
            );

            await this.discordService.sendMaintenanceReportNotification(
                SystemService.DISCORD_MESSAGES.INIT_FAILED_TITLE,
                discordMessage,
            );
        } catch (err) {
            this.logger.error('Error handling init failed', err);
            throw err;
        }
    }

    /**
     * Handles the timeout of API init phase:
     *  - Notifies Discord, stops the container if still not ready,
     *    and marks status UnderMaintenance with attention required.
     */
    private async handleInitTimeout(): Promise<void> {
        try {
            const timeoutMessage =
                `API did not complete initialization within ` +
                `${SystemService.API_INIT_TIMEOUT_MS / 60000} minutes.`;

            if (this.inProduction || this.isUnderMaintenance) {
                await this.discordService.sendMaintenanceNotification(
                    SystemService.DISCORD_MESSAGES.INIT_TIMEOUT_TITLE,
                    timeoutMessage + '\nPlease check the system manually.',
                );
            }

            if (!(await this.checkApiReady())) {
                await this.dockerService.stopApiContainer();
                await this.redisService.set(
                    SystemService.MAINTENANCE_RELEASE_REQUESTED_KEY,
                    'false',
                );
                await this.setSystemStatus({
                    status: SystemStatus.UnderMaintenance,
                    maintenanceError: 'API initialization timeout',
                    requiresAttention: true,
                });
            }
        } catch (error) {
            this.logger.error('Error handling init timeout', error);
        } finally {
            this.clearInitTimeout();
        }
    }

    /**
     * Handles failures while already in maintenance:
     *  - Ensures container is stopped and marks status as
     *    UnderMaintenance with attention flag.
     */
    private async handleMaintenanceFailure(
        errorMessage: string,
    ): Promise<void> {
        try {
            await this.dockerService.stopApiContainer();
            await this.redisService.set(
                SystemService.MAINTENANCE_RELEASE_REQUESTED_KEY,
                'false',
            );
            await this.setSystemStatus({
                status: SystemStatus.UnderMaintenance,
                maintenanceError: errorMessage,
                requiresAttention: true,
            });

            await this.discordService.sendMaintenanceNotification(
                SystemService.DISCORD_MESSAGES.MAINTENANCE_FAILED_TITLE,
                `**Error:** ${errorMessage}\n` +
                `System remains in maintenance mode`,
            );
        } catch (error) {
            this.logger.error('Error handling maintenance failure', error);
            throw error;
        }
    }

    /**
     * Handles failures while not in maintenance:
     *  - Marks status as Down and emits a concise Discord status
     *    message. Used for runtime system errors outside maintenance.
     */
    private async handleSystemFailure(
        errorMessage: string,
    ): Promise<void> {
        try {
            await this.setSystemStatus({
                status: SystemStatus.Down,
                lastDownReason: errorMessage,
            });

            if (!this.inProduction) return;

            await this.discordService.sendStatusNotification(
                `❌ System Error: ${errorMessage}`,
            );
        } catch (error) {
            this.logger.error('Error handling system failure', error);
            throw error;
        }
    }

    /**
     * Finalizes maintenance if API is ready, setting system Up and
     * emitting a completion notification.
     */
    private async completeMaintenance(): Promise<void> {
        try {
            const apiReady = await this.redisService.get(
                SystemService.API_READY_KEY,
            );

            if (apiReady === 'true') {
                const maintenanceId = await this.redisService.get(
                    SystemService.MAINTENANCE_CURRENT_ID_KEY,
                );

                await this.publishStoredMaintenanceInitReport(maintenanceId);
                await this.setSystemStatus({ status: SystemStatus.Up });
                await this.redisService.set(
                    SystemService.MAINTENANCE_ACTIVE_KEY,
                    'false',
                );
                await this.redisService.set(
                    SystemService.MAINTENANCE_RELEASE_REQUESTED_KEY,
                    'false',
                );
                await this.redisService.del(
                    SystemService.MAINTENANCE_CURRENT_ID_KEY,
                );
                this.logger.log('Maintenance completed successfully');

                await this.discordService.sendMaintenanceNotification(
                    SystemService.DISCORD_MESSAGES.MAINTENANCE_COMPLETED,
                    'Maintenance has ended successfully.\n' +
                    'System is fully operational again.\n' +
                    '**API:** Running',
                );
            }
        } catch (error) {
            this.logger.error('Error completing maintenance', error);
            await this.handleMaintenanceFailure(
                'Verification failed after maintenance',
            );
        }
    }

    /** Clears the outstanding API init timeout, if any. */
    private clearInitTimeout(): void {
        if (this._initTimeout) {
            clearTimeout(this._initTimeout);
            this._initTimeout = undefined;
        }
    }

    /** Reads `api:ready` and returns a boolean value. */
    private async checkApiReady(): Promise<boolean> {
        const apiReady = await this.redisService.get(
            SystemService.API_READY_KEY,
        );
        return apiReady === 'true';
    }

    /** Reads whether maintenance release has been explicitly requested. */
    private async isMaintenanceReleaseRequested(): Promise<boolean> {
        const requested = await this.redisService.get(
            SystemService.MAINTENANCE_RELEASE_REQUESTED_KEY,
        );
        return requested === 'true';
    }

    /**
     * Converts maintenance init status to the corresponding Discord title.
     */
    private getInitTitleFromStatus(status: InitStatus): string {
        switch (status) {
            case 'failed':
                return SystemService.DISCORD_MESSAGES.INIT_FAILED_TITLE;
            case 'partial':
                return SystemService.DISCORD_MESSAGES.INIT_PARTIAL_TITLE;
            default:
                return SystemService.DISCORD_MESSAGES.INIT_SUCCESS_TITLE;
        }
    }

    /**
     * Builds the Redis key where the maintenance-scoped report is stored.
     */
    private buildMaintenanceInitReportKey(maintenanceId: string): string {
        return `${SystemService.MAINTENANCE_INIT_REPORT_PREFIX}` +
            `${maintenanceId}`;
    }

    /**
     * Resolves the maintenance identifier, preferring payload input and
     * falling back to an auto-generated id.
     */
    private resolveMaintenanceId(requestedId?: string): string {
        const trimmed = requestedId?.trim();
        if (trimmed) {
            return trimmed;
        }

        const timestamp = this.safeFormatUtc(
            new Date(),
            'yyyyMMddHHmmss',
        );

        return `mnt-${timestamp}-${randomUUID().slice(0, 8)}`;
    }

    /**
     * Reads and publishes the maintenance-scoped init report if present.
     * If no report is stored for the current maintenance, no notification
     * is emitted.
     */
    private async publishStoredMaintenanceInitReport(
        maintenanceId: string | null,
    ): Promise<void> {
        if (!maintenanceId) {
            return;
        }

        const reportKey = this.buildMaintenanceInitReportKey(maintenanceId);
        const stored = await this.redisService.getJson<
            MaintenanceInitReportState | InitReport
        >(reportKey);

        if (!stored) {
            this.logger.log(
                `No maintenance init report found for ${maintenanceId}`,
            );
            return;
        }

        const report = this.extractStoredInitReport(stored, maintenanceId);
        if (!report) {
            this.logger.warn(
                `Invalid maintenance init report payload for ${maintenanceId}`,
            );
            return;
        }

        const title = this.getInitTitleFromStatus(report.overallStatus);
        const message = this.formatInitReportForDiscord(report, title);

        await this.discordService.sendMaintenanceReportNotification(
            title,
            message,
        );
    }

    /**
     * Supports both legacy plain report payloads and wrapped report states.
     */
    private extractStoredInitReport(
        stored: MaintenanceInitReportState | InitReport,
        maintenanceId: string,
    ): InitReport | null {
        if ('overallStatus' in stored) {
            return {
                ...stored,
                maintenanceId: stored.maintenanceId ?? maintenanceId,
            };
        }

        if (!stored.report) {
            return null;
        }

        return {
            ...stored.report,
            maintenanceId: stored.report.maintenanceId ?? maintenanceId,
        };
    }

    /**
     * Formats initialization reports to a Discord-friendly message,
     * including a compact step breakdown and total duration.
     */
    private formatInitReportForDiscord(
        report: InitReport,
        titleOverride?: string,
    ): string {
        let message = '';
        const reportTimestamp = new Date(report.timestamp);

        const startAt = this.safeFormatUtc(
            reportTimestamp,
            "dd/MM/yyyy HH:mm:ss 'UTC'",
        );

        message += `**API Initialization Report**\n`;
        message += `**Overall Status:** \`` +
            `${report.overallStatus.toUpperCase()}\`\n`;
        message += `**Start Time:** ${startAt}\n`;
        message += `**Total Duration:** ${report.duration / 1000}s\n`;
        message += '---';

        report.steps.forEach((step) => {
            message += `\n**${step.name}** (${step.service}): \`` +
                `${step.status.toUpperCase()}\` (${step.duration}ms)`;
            if (step.message) {
                message += `\n  \`\`\`${step.message}\`\`\``;
            }
        });

        if (report.overallStatus === 'failed') {
            message +=
                '\n\n**Attention:** The API did not start completely. ' +
                'Please check logs and failed steps above.';
            message +=
                '\n`The API container has been stopped to prevent ' +
                'unexpected behavior.`';
        } else if (report.overallStatus === 'partial') {
            message +=
                '\n\n**Warning:** The API started with some warnings/failures. ' +
                'Please check logs and steps with `partial` or `failed` status.';
        } else {
            message += '\n\n`The API is operational and ready for use.`';
        }

        return message;
    }

    /**
     * Formats a date in UTC using IANA "Etc/UTC". If the runtime lacks
     * ICU data, falls back to an ISO-based manual formatter to avoid
     * throwing and keep messages human-readable and consistent.
     *
     * @param date Date instance to format.
     * @param pattern date-fns pattern string.
     * @returns Formatted UTC date/time string.
     */
    private safeFormatUtc(date: Date, pattern: string): string {
        try {
            return formatInTimeZone(date, 'Etc/UTC', pattern);
        } catch (err: any) {
            this.logger.warn(`safeFormatUtc fallback: ${err?.message}`);

            const iso = date.toISOString(); // 2025-10-09T19:30:21.123Z
            const [ymd, hmsFull] = iso.split('T');
            const hms = hmsFull.slice(0, 8);

            if (pattern.includes('dd/MM')) {
                const [y, m, d] = ymd.split('-');
                return `${d}/${m}/${y} ${hms} UTC`;
            }

            return `${ymd} ${hms} UTC`;
        }
    }
}
