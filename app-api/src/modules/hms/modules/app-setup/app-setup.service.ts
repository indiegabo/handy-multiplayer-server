import {
    BadRequestException,
    Inject,
    Injectable,
    OnModuleInit,
    Optional,
} from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";

import { BetterLogger }
    from "../better-logger/better-logger.service";
import { AppSetup } from "./entities/app-setup.entity";
import { UsersService } from "../users/services/users.service";
import { RedisService } from "../redis/redis.service";
import { MailService } from "../mail/mail.service";
import { ConfigService } from "@nestjs/config";
import { AdminUser } from "../users/entities/admin-user.entity";
import {
    OwnerCheckUpDto,
    OwnerCreationStartResponseDto,
} from "./dto/create-owner-response.dto";
import { DeviceInfo } from "../auth/types/device-info.type";
import { StartOwnerCreationDto }
    from "./dto/create-owner-setup.dto";
import { AdminCreationBasePayload }
    from "../auth/payloads/admin-auth.payload";
import { SetupStatusDto } from "./dto/setup-status.dto";
import { AuthFacade } from "../auth/auth.facade";

@Injectable()
export class AppSetupService implements OnModuleInit {
    constructor(
        private readonly logger: BetterLogger,
        private readonly auth: AuthFacade,
        private readonly usersService: UsersService,
        private readonly redisService: RedisService,
        private readonly mailService: MailService,
        private readonly configService: ConfigService,
        @Inject(DataSource)
        private readonly dataSource: DataSource,
        @Optional()
        @InjectConnection()
        private readonly gamesDBConnection: Connection,
        @InjectRepository(AppSetup)
        private readonly appSetupRepo: Repository<AppSetup>,
    ) {
        this.logger.setContext(AppSetupService.name);
    }

    /* =======================================================================
     * ============================  CACHE STATE  =============================
     * =======================================================================
     */

    /**
     * In-memory cache for setup status.
     * null => not loaded yet.
     */
    private _setupCache: SetupStatusDto | null = null;

    /**
     * In-flight DB load promise to dedupe concurrent calls.
     */
    private _setupCacheLoader: Promise<SetupStatusDto> | null = null;

    /**
     * Optional TTL. If you prefer a single-load-per-process semantics,
     * keep it undefined to never expire automatically.
     */
    private readonly _setupCacheTTLms: number | undefined = undefined;

    /**
     * Timestamp for the current cache entry.
     */
    private _setupCacheAt: number | null = null;

    /**
     * Warm up the cache on boot for a faster first hit.
     */
    async onModuleInit(): Promise<void> {
        try {
            await this.refreshSetupCache();
        } catch (err) {
            // Do not crash app if warmup fails; it will lazy-load later.
            this.logger.warn(
                "Setup cache warmup failed; will lazy-load on demand.",
            );
            this.logger.warn(err);
        }
    }

    /**
     * Returns cached setup status, reloading from DB if empty/expired.
     */
    private async getSetupStatusCached(): Promise<SetupStatusDto> {
        // Serve from cache if present and not expired.
        if (this._setupCache && !this.isSetupCacheExpired()) {
            return this._setupCache;
        }
        // If a load is already running, await it.
        if (this._setupCacheLoader) {
            return this._setupCacheLoader;
        }
        // Start a new load.
        this._setupCacheLoader = (async () => {
            const setupRecord = await this.ensureSetupRecord();
            const dto: SetupStatusDto = {
                is_complete: setupRecord.is_complete,
                completed_at: setupRecord.completed_at,
                details: setupRecord.setup_details,
            };
            this._setupCache = dto;
            this._setupCacheAt = Date.now();
            this._setupCacheLoader = null;
            return dto;
        })();

        try {
            return await this._setupCacheLoader;
        } catch (err) {
            // Clear loader on failure to allow retry on next call.
            this._setupCacheLoader = null;
            throw err;
        }
    }

    /**
     * Forces reloading the setup cache from DB.
     */
    private async refreshSetupCache(): Promise<SetupStatusDto> {
        this._setupCacheLoader = (async () => {
            const setupRecord = await this.ensureSetupRecord();
            const dto: SetupStatusDto = {
                is_complete: setupRecord.is_complete,
                completed_at: setupRecord.completed_at,
                details: setupRecord.setup_details,
            };
            this._setupCache = dto;
            this._setupCacheAt = Date.now();
            this._setupCacheLoader = null;
            return dto;
        })();

        try {
            return await this._setupCacheLoader;
        } catch (err) {
            this._setupCacheLoader = null;
            throw err;
        }
    }

    /**
     * Invalidates in-memory cache immediately.
     */
    private invalidateSetupCache(): void {
        this._setupCache = null;
        this._setupCacheAt = null;
    }

    private isSetupCacheExpired(): boolean {
        if (!this._setupCache) return true;
        if (this._setupCacheTTLms == null) return false;
        if (this._setupCacheAt == null) return true;
        return Date.now() - this._setupCacheAt > this._setupCacheTTLms;
    }

    /* =======================================================================
     * ==========================  SETUP STATUS API  ==========================
     * =======================================================================
     */

    /**
     * Returns the current setup status (cached).
     * If the record does not exist, it will be created.
     */
    async checkSetupStatus(): Promise<SetupStatusDto> {
        return this.getSetupStatusCached();
    }

    /**
     * Ensures the setup record exists (id=1). Creates one if missing.
     */
    private async ensureSetupRecord(): Promise<AppSetup> {
        let record = await this.appSetupRepo.findOneBy({ id: 1 });

        if (!record) {
            record = this.appSetupRepo.create({
                id: 1,
                is_complete: false,
            });
            await this.appSetupRepo.save(record);
        }
        return record;
    }

    /**
     * Marks setup as complete and stores details.
     * Also updates the in-memory cache.
     */
    async markSetupAsComplete(details: any): Promise<void> {
        await this.appSetupRepo.update(1, {
            is_complete: true,
            completed_at: new Date(),
            setup_details: details,
        });

        // Update cache immediately so future reads are instant.
        this._setupCache = {
            is_complete: true,
            completed_at: new Date(),
            details,
        };
        this._setupCacheAt = Date.now();
    }

    /* =======================================================================
     * ===========================  OWNER WORKFLOW  ===========================
     * =======================================================================
     */

    /**
     * Checks whether a system owner exists and whether it has 2FA.
     */
    async checkOwnerExists(): Promise<OwnerCheckUpDto> {
        const owner = await this.usersService.findOwner();

        if (!owner) {
            return {
                owner: null,
                two_fa_enabled: false,
            };
        }
        return {
            owner: {
                id: owner.id,
                name: owner.name,
                email: owner.email,
                created_at: owner.created_at,
            },
            two_fa_enabled: owner.twoFactorMethods.length > 0,
        };
    }

    /**
     * Starts the owner creation process by preparing 2FA setup data.
     * Does not create the owner yet.
     */
    async startOwnerCreationProcess(
        payload: StartOwnerCreationDto,
    ): Promise<OwnerCreationStartResponseDto> {
        const setupData = await this.auth
            .generateAdmin2FASetupData(payload.email);

        return {
            email: payload.email,
            qrcode_url: setupData.qrCodeUrl,
            manual_entry_code: setupData.manualEntryCode,
            setup_token: setupData.setupToken,
        };
    }

    /**
     * Creates the owner administrator inside a single transaction and
     * completes the 2FA setup, returning the backup codes.
     */
    async createOwner(
        payload: AdminCreationBasePayload,
        deviceInfo: DeviceInfo, // kept for parity / future use
    ): Promise<{ owner: AdminUser; backup_codes: string[] }> {
        return this.dataSource.transaction(async (trx) => {
            try {
                // 1) Create owner (hashing inside UsersService).
                const owner = await this.usersService.createOwner(
                    {
                        email: payload.email,
                        name: payload.name,
                        password: payload.password,
                    },
                    trx,
                );

                // 2) Complete 2FA using the same transaction.
                const backupCodes = await this.auth.completeAdmin2FASetup(
                    owner,
                    payload.twofa_token,
                    payload.twofa_code,
                    trx,
                );

                return {
                    owner,
                    backup_codes: backupCodes,
                };
            } catch (error) {
                this.logger.error("Owner creation failed");
                this.logger.error(error);
                throw error;
            }
        });
    }

    /* =======================================================================
     * ============================  HEALTH CHECKS  ===========================
     * =======================================================================
     */

    /**
     * Verifies the main relational database by running a simple query.
     */
    async checkMainDb(): Promise<boolean> {
        await this.dataSource.query("SELECT 1");
        return true;
    }

    /**
     * Verifies the GameDB (Mongo) connection using admin().ping().
     */
    async checkGameDb(): Promise<boolean> {
        if (!this.gamesDBConnection) {
            this.logger.warn(
                "MongoDB connection not available (DB_GAME_ENABLED=no)"
            );
            return false;
        }
        const db = this.gamesDBConnection.db;
        await db.admin().ping();
        return true;
    }

    /**
     * Verifies Redis connectivity using a PING.
     */
    async checkRedis(): Promise<boolean> {
        await this.withTimeout(
            this.redisService.ping(),
            15000,
            "Redis ping",
        );
        return true;
    }

    private async withTimeout<T>(
        promise: Promise<T>,
        ms: number,
        label: string,
    ): Promise<T> {
        let timer: NodeJS.Timeout | undefined;

        try {
            const timeout = new Promise<never>((_, reject) => {
                timer = setTimeout(() => {
                    reject(new Error(`${label} timed out after ${ms}ms`));
                }, ms);
            });

            return await Promise.race([promise, timeout]);
        } finally {
            if (timer) {
                clearTimeout(timer);
            }
        }
    }

    /**
     * Verifies SMTP connectivity via MailService verification.
     */
    async checkSmtp(): Promise<boolean> {
        await this.mailService.verifyConnection();
        return true;
    }

    /* =======================================================================
     * ==============================  MAINTENANCE  ===========================
     * =======================================================================
     */

    /**
     * Resets the application setup record (dev only) and deletes all admins.
     * Also invalidates the in-memory cache.
     */
    async resetApp(): Promise<void> {
        const isDev = this.configService.get("APP_ENVIRONMENT") ===
            "development";

        if (!isDev) {
            throw new BadRequestException({
                message: "You can only reset the app in development mode",
            });
        }

        const record = await this.appSetupRepo.findOneBy({ id: 1 });
        if (!record) {
            // Also clear cache if nothing existed.
            this.invalidateSetupCache();
            return;
        }

        record.is_complete = false;
        record.completed_at = null;
        record.setup_details = null;

        await this.appSetupRepo.save(record);

        // Invalidate cache so next read reflects the reset.
        this.invalidateSetupCache();

        await this.usersService.deleteAllAdminUsers();
    }
}
