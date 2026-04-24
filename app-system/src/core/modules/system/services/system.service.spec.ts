import { Test, TestingModule } from '@nestjs/testing';
import { expect } from '@jest/globals'; // Ensures Jest matchers types
import { DockerService }
    from '../../docker/docker.service';
import { DiscordService }
    from '../../discord/services/discord.service';
import { SystemGateway } from '../system.gateway';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { StartMaintenancePayloadDTO }
    from '../dto/start-maintenance.payload';
import { SystemService } from './system.service';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@src/core/modules/redis/redis.service';
import { AppService } from '@src/app.service';
import { SystemStatus } from '@hms/shared-types/hms';


jest.useFakeTimers();

/* ─────────────────────────────────────────────────────────────────────
 * SystemService Spec
 * ────────────────────────────────────────────────────────────────────
 */

describe('SystemService', () => {
    let service: SystemService;
    let redisService: jest.Mocked<RedisService>;
    let dockerService: jest.Mocked<DockerService>;
    let discordService: jest.Mocked<DiscordService>;
    let systemGateway: jest.Mocked<SystemGateway>;
    let eventEmitter: jest.Mocked<EventEmitter2>;
    let appService: jest.Mocked<AppService>;
    let configService: jest.Mocked<ConfigService>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SystemService,
                {
                    provide: RedisService,
                    useValue: {
                        ping: jest.fn().mockResolvedValue('PONG'),
                        set: jest.fn(),
                        get: jest.fn(),
                        del: jest.fn(),
                        getJson: jest.fn(),
                        subscribe: jest.fn(),
                    },
                },
                {
                    provide: DockerService,
                    useValue: {
                        stopApiContainer: jest.fn(),
                        startApiContainer: jest.fn(),
                    },
                },
                {
                    provide: DiscordService,
                    useValue: {
                        sendMaintenanceNotification: jest.fn(),
                        sendMaintenanceReportNotification: jest.fn(),
                        sendStatusNotification: jest.fn(),
                    },
                },
                {
                    provide: SystemGateway,
                    useValue: {
                        notifySystemStatus: jest.fn(),
                    },
                },
                { provide: EventEmitter2, useValue: { emit: jest.fn() } },
                { provide: AppService, useValue: { isProduction: true } },
                { provide: ConfigService, useValue: { get: jest.fn() } },
            ],
        }).compile();

        service = module.get<SystemService>(SystemService);
        redisService = module.get(RedisService);
        dockerService = module.get(DockerService);
        discordService = module.get(DiscordService);
        systemGateway = module.get(SystemGateway);
        eventEmitter = module.get(EventEmitter2);
        configService = module.get(ConfigService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('start', () => {
        it('sets status Up and notifies Discord', async () => {
            await service.start();
            expect(redisService.set).toHaveBeenCalled();
            expect(discordService.sendStatusNotification)
                .toHaveBeenCalledWith(SystemService.DISCORD_MESSAGES.STARTED);
            expect(systemGateway.notifySystemStatus).toHaveBeenCalled();
        });
    });

    describe('stop', () => {
        it('sets status Down and notifies Discord', async () => {
            await service.stop();
            expect(redisService.set).toHaveBeenCalled();
            expect(discordService.sendStatusNotification)
                .toHaveBeenCalledWith(SystemService.DISCORD_MESSAGES.STOPPED);
        });
    });

    describe('cancelMaintenancePreparation', () => {
        it('cancels preparation and notifies Discord', async () => {
            const cancelMock = jest.fn();
            (service as any)._preparationPromise = { cancel: cancelMock };

            await service.cancelMaintenancePreparation();

            expect(cancelMock).toHaveBeenCalled();
            expect(redisService.set).toHaveBeenCalled();
            expect(discordService.sendMaintenanceNotification)
                .toHaveBeenCalledWith(
                    SystemService.DISCORD_MESSAGES.MAINTENANCE_CANCELLED,
                    expect.stringContaining('Maintenance preparation was cancelled'),
                );
        });
    });

    describe('startMaintenance', () => {
        it('starts maintenance and schedules delay', async () => {
            const payload: StartMaintenancePayloadDTO = {
                preparation_duration_in_seconds: 1,
                maintenance_duration_in_seconds: 2,
            };

            await service.startMaintenance(payload);

            expect(redisService.set)
                .toHaveBeenCalledWith(SystemService.API_READY_KEY, 'false');
            expect(discordService.sendMaintenanceNotification).toHaveBeenCalled();
            expect(systemGateway.notifySystemStatus).toHaveBeenCalled();

            const call = discordService.sendMaintenanceNotification.mock.calls[0];
            expect(call[1]).not.toContain('Maintenance Id');
        });
    });

    describe('setSystemStatus', () => {
        it('persists status and notifies dependents', async () => {
            const status = { status: SystemStatus.Up } as const;

            await service.setSystemStatus(status as any);

            expect(redisService.set).toHaveBeenCalledWith(
                SystemService.REDIS_SYSTEM_STATUS_KEY,
                JSON.stringify(status),
            );
            expect(systemGateway.notifySystemStatus).toHaveBeenCalledWith(status);
            expect(eventEmitter.emit)
                .toHaveBeenCalledWith('system.status.changed', status);
        });
    });

    describe('toReadableStatus', () => {
        it('returns readable string', () => {
            expect(SystemService.toReadableStatus(SystemStatus.Up)).toBe('Up');
            expect(SystemService.toReadableStatus(SystemStatus.Down)).toBe('Down');
            expect(
                SystemService.toReadableStatus(SystemStatus.PreparingMaintenance),
            ).toBe('Preparing Maintenance');
        });
    });

    describe('maintenance release guard', () => {
        const initReportMock = {
            overallStatus: 'success',
            steps: [],
            timestamp: new Date().toISOString(),
            duration: 10,
        } as any;

        it('ignores init success while maintenance release was not requested', async () => {
            (service as any)._statusData.status = SystemStatus.UnderMaintenance;
            redisService.get.mockResolvedValue('false');

            const setStatusSpy = jest.spyOn(service, 'setSystemStatus');

            await (service as any).handleInitSuccess(initReportMock);

            expect(setStatusSpy).not.toHaveBeenCalledWith({
                status: SystemStatus.Up,
            });
        });

        it('allows init success while maintenance release was requested', async () => {
            (service as any)._statusData.status = SystemStatus.UnderMaintenance;
            redisService.get.mockResolvedValue('true');

            const setStatusSpy = jest.spyOn(service, 'setSystemStatus');

            await (service as any).handleInitSuccess(initReportMock);

            expect(setStatusSpy).toHaveBeenCalledWith({
                status: SystemStatus.Up,
            });
        });

        it('does not notify discord for non-maintenance init success report',
            async () => {
                await (service as any).handleInitSuccess(initReportMock);

                expect(discordService.sendMaintenanceNotification)
                    .not.toHaveBeenCalled();
                expect(discordService.sendMaintenanceReportNotification)
                    .not.toHaveBeenCalled();
            });

        it('defers Discord report when init is maintenance-scoped', async () => {
            (service as any)._statusData.status = SystemStatus.UnderMaintenance;
            redisService.get.mockResolvedValue('true');

            await (service as any).handleInitSuccess({
                ...initReportMock,
                maintenanceId: 'mnt-123',
            });

            expect(discordService.sendMaintenanceNotification)
                .not.toHaveBeenCalled();
        });

        it('routes maintenance-scoped init failure report to internal report channel',
            async () => {
                await (service as any).handleInitFailed({
                    overallStatus: 'failed',
                    maintenanceId: 'mnt-xyz',
                    steps: [
                        {
                            name: 'Game Instances Setup',
                            status: 'failed',
                            duration: 20,
                            service: 'GameInstancesService',
                            message: 'Failed to initialize game instances',
                        },
                    ],
                    timestamp: new Date().toISOString(),
                    duration: 30,
                });

                expect(discordService.sendMaintenanceReportNotification)
                    .toHaveBeenCalledWith(
                        SystemService.DISCORD_MESSAGES.INIT_FAILED_TITLE,
                        expect.stringContaining('API Initialization Report'),
                    );
                expect(discordService.sendMaintenanceNotification)
                    .not.toHaveBeenCalled();
            });

        it('restores UnderMaintenance on startup even when api:ready is false',
            async () => {
                const persisted = {
                    status: SystemStatus.UnderMaintenance,
                    maintenanceError: 'waiting manual release',
                };

                redisService.get.mockImplementation(async (key: string) => {
                    if (key === SystemService.REDIS_SYSTEM_STATUS_KEY) {
                        return JSON.stringify(persisted);
                    }

                    if (key === SystemService.API_READY_KEY) {
                        return 'false';
                    }

                    return null;
                });

                const setStatusSpy = jest.spyOn(service, 'setSystemStatus');

                await (service as any).initializeStatus();

                expect(service.status).toBe(SystemStatus.UnderMaintenance);
                expect(setStatusSpy).not.toHaveBeenCalledWith({
                    status: SystemStatus.Down,
                    lastDownReason: 'Initializing system',
                });
            });
    });

    describe('endMaintenance', () => {
        it('starts API container and notifies Discord', async () => {
            (service as any)._statusData.status = SystemStatus.UnderMaintenance;

            await service.endMaintenance();

            expect(dockerService.startApiContainer).toHaveBeenCalled();
            expect(discordService.sendMaintenanceNotification).toHaveBeenCalledWith(
                SystemService.DISCORD_MESSAGES.INIT_WAITING,
                expect.stringContaining(
                    'Waiting for API to complete startup routine',
                ),
            );
        });

        it('publishes stored init report when maintenance completes', async () => {
            redisService.get.mockImplementation(async (key: string) => {
                if (key === SystemService.API_READY_KEY) {
                    return 'true';
                }

                if (key === SystemService.MAINTENANCE_CURRENT_ID_KEY) {
                    return 'mnt-abc';
                }

                return null;
            });

            redisService.getJson.mockResolvedValue({
                maintenanceId: 'mnt-abc',
                updatedAt: new Date().toISOString(),
                updates: 1,
                report: {
                    overallStatus: 'success',
                    steps: [
                        {
                            name: 'Database migration',
                            service: 'MigrationService',
                            status: 'success',
                            duration: 10,
                            message: 'Executed 0 migrations.',
                        },
                    ],
                    timestamp: new Date().toISOString(),
                    duration: 20,
                },
            } as any);

            await (service as any).completeMaintenance();

            expect(discordService.sendMaintenanceReportNotification)
                .toHaveBeenCalledWith(
                    SystemService.DISCORD_MESSAGES.INIT_SUCCESS_TITLE,
                    expect.stringContaining('API Initialization Report'),
                );
            expect(redisService.del).toHaveBeenCalledWith(
                SystemService.MAINTENANCE_CURRENT_ID_KEY,
            );
            expect(discordService.sendMaintenanceNotification)
                .toHaveBeenCalledWith(
                    SystemService.DISCORD_MESSAGES.MAINTENANCE_COMPLETED,
                    expect.stringContaining('System is fully operational again'),
                );
        });

        it('does not publish init report when none is stored', async () => {
            redisService.get.mockImplementation(async (key: string) => {
                if (key === SystemService.API_READY_KEY) {
                    return 'true';
                }

                if (key === SystemService.MAINTENANCE_CURRENT_ID_KEY) {
                    return 'mnt-empty';
                }

                return null;
            });

            redisService.getJson.mockResolvedValue(null);

            await (service as any).completeMaintenance();

            expect(discordService.sendMaintenanceNotification)
                .toHaveBeenCalledWith(
                    SystemService.DISCORD_MESSAGES.MAINTENANCE_COMPLETED,
                    expect.stringContaining('System is fully operational again'),
                );
        });
    });
});
