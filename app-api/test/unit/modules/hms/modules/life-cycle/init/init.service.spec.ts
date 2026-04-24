import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DiscoveryService, MetadataScanner } from '@nestjs/core';
import { InitService } from '../../../../../../../src/modules/hms/modules/life-cycle/init/init.service';
import { BetterLogger } from '../../../../../../../src/modules/hms/modules/better-logger/better-logger.service';
import { RedisService } from '../../../../../../../src/modules/hms/modules/redis/redis.service';
import * as fs from 'fs';
import * as path from 'path';
import 'reflect-metadata'; // Required for Reflect.getMetadata

// Mock types for testing
type InitStatus = 'success' | 'failed' | 'partial';
interface StepResult {
    status: InitStatus;
    message?: string;
}
interface InitReport {
    overallStatus: InitStatus;
    steps: Array<{
        name: string;
        status: InitStatus;
        message?: string;
        duration: number;
        service: string;
    }>;
    timestamp: string;
    duration: number;
    maintenanceId?: string;
}

// Mock @InitStep decorator
const INIT_STEPS_METADATA_KEY = 'init:steps';

interface InitStepOptions {
    name: string;
    priority: number;
}

const InitStep = (options: InitStepOptions) => {
    return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
        const steps = Reflect.getMetadata(INIT_STEPS_METADATA_KEY, target.constructor) || [];
        steps.push({ methodName: propertyKey, name: options.name, priority: options.priority });
        Reflect.defineMetadata(INIT_STEPS_METADATA_KEY, steps, target.constructor);
    };
};

// Mock Services for testing - UPDATED TO USE NEW DECORATOR SYNTAX
class MockServiceA {
    constructor(private readonly logger: BetterLogger) { }

    @InitStep({ name: 'Step 1 from Service A (High Priority)', priority: 100 })
    async stepA1(): Promise<StepResult> {
        this.logger.debug('Executing Step A1');
        return { status: 'success', message: 'Service A Step 1 successful' };
    }

    @InitStep({ name: 'Step 2 from Service A (Medium Priority)', priority: 50 })
    async stepA2(): Promise<StepResult> {
        this.logger.debug('Executing Step A2');
        return { status: 'success', message: 'Service A Step 2 successful' };
    }
}

class MockServiceB {
    constructor(private readonly logger: BetterLogger) { }

    @InitStep({ name: 'Step 1 from Service B (Medium Priority)', priority: 50 })
    async stepB1(): Promise<StepResult> {
        this.logger.debug('Executing Step B1');
        return { status: 'success', message: 'Service B Step 1 successful' };
    }

    @InitStep({ name: 'Failing Step from Service B', priority: 60 })
    async stepB2Fails(): Promise<StepResult> {
        this.logger.debug('Executing Failing Step B2');
        return { status: 'failed', message: 'Service B Step 2 failed intentionally' };
    }

    @InitStep({ name: 'Partial Step from Service B', priority: 40 })
    async stepB3Partial(): Promise<StepResult> {
        this.logger.debug('Executing Partial Step B3');
        return { status: 'partial', message: 'Service B Step 3 partially successful' };
    }

    // Not decorated, should not be collected
    async regularMethod(): Promise<void> {
        this.logger.debug('This is a regular method');
    }
}

class MockServiceC {
    constructor(private readonly logger: BetterLogger) { }

    @InitStep({ name: 'Step from Service C (Lowest Priority)', priority: 10 })
    async stepC1(): Promise<StepResult> {
        this.logger.debug('Executing Step C1');
        return { status: 'success', message: 'Service C Step 1 successful' };
    }

    @InitStep({ name: 'Error Throwing Step from Service C', priority: 70 })
    async stepC2ThrowsError(): Promise<StepResult> {
        this.logger.debug('Executing Error Throwing Step C2');
        throw new Error('Intentional error during step C2');
    }
}

class MockServiceWithoutSteps {
    constructor(private readonly logger: BetterLogger) { }

    async someMethod(): Promise<void> {
        this.logger.debug('Service with no init steps');
    }
}

describe('InitService', () => {
    let service: InitService;
    let logger: BetterLogger;
    let redisService: RedisService;
    let app: INestApplication;

    const logsDir = path.resolve(process.cwd(), 'logs/init');

    // Helper to clear the logs directory before each test
    beforeEach(() => {
        if (fs.existsSync(logsDir)) {
            try {
                fs.rmSync(logsDir, { recursive: true, force: true });
            } catch (err) {
                // If permission denied, attempt to relax permissions and retry, otherwise ignore
                try {
                    fs.chmodSync(logsDir, 0o755);
                    fs.rmSync(logsDir, { recursive: true, force: true });
                } catch (_) {
                    // ignore failures cleaning logs during tests to avoid permission issues
                }
            }
        }
    });

    afterEach(async () => {
        if (app) {
            await app.close();
        }
    });

    describe('Initialization with multiple services and steps', () => {
        let mockServiceAInstance: MockServiceA;
        let mockServiceBInstance: MockServiceB;
        let mockServiceCInstance: MockServiceC;

        beforeEach(async () => {
            jest.clearAllMocks(); // Clear mocks at the very beginning of beforeEach

            // Create mock instances of the services that InitService will discover
            const mockLogger = {
                setContext: jest.fn(),
                setMessagesColor: jest.fn(),
                debug: jest.fn(),
                warn: jest.fn(),
                error: jest.fn(),
            };

            mockServiceAInstance = new MockServiceA(mockLogger as any);
            mockServiceBInstance = new MockServiceB(mockLogger as any);
            mockServiceCInstance = new MockServiceC(mockLogger as any);

            const module: TestingModule = await Test.createTestingModule({
                providers: [
                    InitService,
                    {
                        provide: BetterLogger,
                        useValue: mockLogger,
                    },
                    {
                        provide: RedisService,
                        useValue: {
                            set: jest.fn(),
                            get: jest.fn().mockResolvedValue('false'),
                            getJson: jest.fn().mockResolvedValue(null),
                            setJson: jest.fn(),
                            publish: jest.fn(),
                        },
                    },
                    { // Provide DiscoveryService mock
                        provide: DiscoveryService,
                        useValue: {
                            getProviders: jest.fn(() => [
                                { instance: mockServiceAInstance, metatype: MockServiceA, wrapper: {} },
                                { instance: mockServiceBInstance, metatype: MockServiceB, wrapper: {} },
                                { instance: mockServiceCInstance, metatype: MockServiceC, wrapper: {} },
                            ] as any[]),
                            getControllers: jest.fn(() => []),
                            getModules: jest.fn(() => []),
                        },
                    },
                    { // Provide MetadataScanner mock
                        provide: MetadataScanner,
                        useValue: {
                            scan: jest.fn(), // InitService doesn't directly call scan, but it's a dependency
                        },
                    },
                ],
            }).compile();

            app = module.createNestApplication();
            // Removed app.init() from here. Each test will call service.init() after setting up mocks.

            service = module.get<InitService>(InitService);
            logger = module.get<BetterLogger>(BetterLogger);
            redisService = module.get<RedisService>(RedisService);
        });

        it('should be defined', () => {
            expect(service).toBeDefined();
        });

        it('should execute steps in priority order and report success', async () => {
            // Temporarily mock failing/error-throwing steps to succeed for this test
            jest.spyOn(mockServiceBInstance, 'stepB2Fails').mockImplementationOnce(async () => {
                return { status: 'success', message: 'Mocked to succeed for test' };
            });
            jest.spyOn(mockServiceCInstance, 'stepC2ThrowsError').mockImplementationOnce(async () => {
                return { status: 'success', message: 'Mocked to succeed for test' };
            });
            // Mock the partial step to also succeed for this specific test
            jest.spyOn(mockServiceBInstance, 'stepB3Partial').mockImplementationOnce(async () => {
                return { status: 'success', message: 'Mocked partial step to succeed for test' };
            });

            const success = await service.init(); // Call init AFTER mocks are set
            expect(success).toBe(true);

            // Verify logger calls for each step
            expect(logger.debug).toHaveBeenCalledWith('Starting application initialization');
            expect(logger.debug).toHaveBeenCalledWith('Executing step: Step 1 from Service A (High Priority)'); // Priority 100
            expect(logger.debug).toHaveBeenCalledWith('Executing step: Error Throwing Step from Service C'); // Priority 70 (now mocked to succeed)
            expect(logger.debug).toHaveBeenCalledWith('Executing step: Failing Step from Service B'); // Priority 60 (now mocked to succeed)
            expect(logger.debug).toHaveBeenCalledWith('Executing step: Step 2 from Service A (Medium Priority)'); // Priority 50
            expect(logger.debug).toHaveBeenCalledWith('Executing step: Step 1 from Service B (Medium Priority)'); // Priority 50
            expect(logger.debug).toHaveBeenCalledWith('Executing step: Partial Step from Service B'); // Priority 40 (now mocked to succeed)
            expect(logger.debug).toHaveBeenCalledWith('Executing step: Step from Service C (Lowest Priority)'); // Priority 10


            // Verify that the success channel was published
            expect(redisService.publish).toHaveBeenCalledWith(
                'api:init-success',
                expect.stringContaining('"overallStatus":"success"'),
            );

            // Verify report file creation
            const files = fs.readdirSync(logsDir);
            expect(files.length).toBe(1);
            const reportContent = JSON.parse(fs.readFileSync(path.join(logsDir, files[0]), 'utf8')) as InitReport;

            expect(reportContent.overallStatus).toBe('success');
            expect(reportContent.steps.length).toBe(7); // All 7 decorated methods

            // Check specific step statuses and messages (all should be success for this test)
            expect(reportContent.steps.find(s => s.name === 'Step 1 from Service A (High Priority)')?.status).toBe('success');
            expect(reportContent.steps.find(s => s.name === 'Error Throwing Step from Service C')?.status).toBe('success'); // Mocked
            expect(reportContent.steps.find(s => s.name === 'Failing Step from Service B')?.status).toBe('success'); // Mocked
            expect(reportContent.steps.find(s => s.name === 'Partial Step from Service B')?.status).toBe('success'); // Mocked
            expect(reportContent.steps.every(s => s.status === 'success')).toBe(true); // All steps should be success

            // Verify that all expected step names are present in the report
            expect(reportContent.steps.map(s => s.name)).toEqual(
                expect.arrayContaining([
                    'Step 1 from Service A (High Priority)',
                    'Error Throwing Step from Service C',
                    'Failing Step from Service B',
                    'Step 2 from Service A (Medium Priority)',
                    'Step 1 from Service B (Medium Priority)',
                    'Partial Step from Service B',
                    'Step from Service C (Lowest Priority)'
                ])
            );
        });

        it('should stop execution and report failure if a step returns "failed" status', async () => {
            // Explicitly mock all other relevant methods to ensure they don't interfere
            jest.spyOn(mockServiceAInstance, 'stepA1').mockImplementationOnce(async () => {
                return { status: 'success', message: 'Mocked to succeed for test' };
            });
            jest.spyOn(mockServiceAInstance, 'stepA2').mockImplementationOnce(async () => {
                return { status: 'success', message: 'Mocked to succeed for test' };
            });
            jest.spyOn(mockServiceBInstance, 'stepB1').mockImplementationOnce(async () => {
                return { status: 'success', message: 'Mocked to succeed for test' };
            });
            jest.spyOn(mockServiceBInstance, 'stepB3Partial').mockImplementationOnce(async () => {
                return { status: 'success', message: 'Mocked to succeed for test' };
            });
            jest.spyOn(mockServiceCInstance, 'stepC1').mockImplementationOnce(async () => {
                return { status: 'success', message: 'Mocked to succeed for test' };
            });
            jest.spyOn(mockServiceCInstance, 'stepC2ThrowsError').mockImplementationOnce(async () => {
                return { status: 'success', message: 'Mocked to succeed for test' };
            });

            // Mock the failing step to be the one that causes break
            jest.spyOn(mockServiceBInstance, 'stepB2Fails').mockImplementationOnce(async () => {
                return { status: 'failed', message: 'Forced failure for test' };
            });

            const success = await service.init(); // Call init AFTER mocks are set
            expect(success).toBe(false);

            // Check if subsequent steps with lower priority were NOT called (e.g., stepC1 which is lowest priority)
            expect(logger.debug).not.toHaveBeenCalledWith('Executing step: Step from Service C (Lowest Priority)'); // Priority 10
            expect(logger.debug).not.toHaveBeenCalledWith('Executing step: Step 2 from Service A (Medium Priority)'); // Priority 50
            expect(logger.debug).not.toHaveBeenCalledWith('Executing step: Step 1 from Service B (Medium Priority)'); // Priority 50
            expect(logger.debug).not.toHaveBeenCalledWith('Executing step: Partial Step from Service B'); // Priority 40


            // Verify that the failure channel was published
            expect(redisService.publish).toHaveBeenCalledWith(
                'api:init-failed',
                expect.stringContaining('"overallStatus":"failed"'),
            );

            // Verify report content
            const files = fs.readdirSync(logsDir);
            expect(files.length).toBe(1);
            const reportContent = JSON.parse(fs.readFileSync(path.join(logsDir, files[0]), 'utf8')) as InitReport;
            expect(reportContent.overallStatus).toBe('failed');
            // The failing step should be present and marked as failed
            expect(reportContent.steps.some(s => s.name === 'Failing Step from Service B' && s.status === 'failed')).toBe(true);
            // The number of steps executed will depend on the priority of 'Failing Step from Service B'
            // and the order of other steps with higher priority.
            // In this setup, 'Step 1 from Service A (High Priority)' (100) and 'Error Throwing Step from Service C' (70)
            // would execute before 'Failing Step from Service B' (60).
            // So, steps should be 3 (100, 70, 60)
            expect(reportContent.steps.length).toBe(3);
        });

        it('should stop execution and report failure if a step throws an error', async () => {
            // Mock the error throwing step to ensure it stops the process early
            jest.spyOn(mockServiceCInstance, 'stepC2ThrowsError').mockImplementationOnce(async () => {
                throw new Error('Forced error for test');
            });

            const success = await service.init(); // Call init AFTER mocks are set
            expect(success).toBe(false);

            // Check if subsequent steps with lower priority were NOT called
            expect(logger.debug).not.toHaveBeenCalledWith('Executing Step from Service C (Lowest Priority)'); // Priority 10

            // Verify that the failure channel was published
            expect(redisService.publish).toHaveBeenCalledWith(
                'api:init-failed',
                expect.stringContaining('"overallStatus":"failed"'),
            );

            // Verify report content
            const files = fs.readdirSync(logsDir);
            expect(files.length).toBe(1);
            const reportContent = JSON.parse(fs.readFileSync(path.join(logsDir, files[0]), 'utf8')) as InitReport;
            expect(reportContent.overallStatus).toBe('failed');
            expect(reportContent.steps.some(s => s.name === 'Error Throwing Step from Service C' && s.status === 'failed')).toBe(true);
            expect(reportContent.steps.some(s => s.name === 'Error Throwing Step from Service C' && s.message === 'Forced error for test')).toBe(true);
            // In this setup, 'Step 1 from Service A (High Priority)' (100) would execute before 'Error Throwing Step from Service C' (70).
            // So, steps should be 2 (100, 70)
            expect(reportContent.steps.length).toBe(2);
        });
    });

    describe('Edge cases and error handling', () => {
        beforeEach(async () => {
            jest.clearAllMocks(); // Clear mocks at the very beginning of beforeEach

            const module: TestingModule = await Test.createTestingModule({
                providers: [
                    InitService,
                    {
                        provide: BetterLogger,
                        useValue: {
                            setContext: jest.fn(),
                            setMessagesColor: jest.fn(),
                            debug: jest.fn(),
                            warn: jest.fn(),
                            error: jest.fn(),
                        },
                    },
                    {
                        provide: RedisService,
                        useValue: {
                            set: jest.fn(),
                            get: jest.fn().mockResolvedValue('false'),
                            getJson: jest.fn().mockResolvedValue(null),
                            setJson: jest.fn(),
                            publish: jest.fn(),
                        },
                    },
                    { // Provide DiscoveryService mock
                        provide: DiscoveryService,
                        useValue: {
                            getProviders: jest.fn(() => []), // Default to empty, specific tests will override
                            getControllers: jest.fn(() => []),
                            getModules: jest.fn(() => []),
                        },
                    },
                    { // Provide MetadataScanner mock
                        provide: MetadataScanner,
                        useValue: {
                            scan: jest.fn(),
                        },
                    },
                ],
            }).compile();

            app = module.createNestApplication();
            // Removed app.init() from here as well.
            // Each test will call service.init() after setting up mocks.

            service = module.get<InitService>(InitService);
            logger = module.get<BetterLogger>(BetterLogger);
            redisService = module.get<RedisService>(RedisService);
        });

        it('should handle no @InitStep methods found', async () => {
            // DiscoveryService already mocked to return empty in beforeEach
            const success = await service.init(); // Call init here
            expect(success).toBe(true);

            expect(logger.warn).toHaveBeenCalledWith('No @InitStep methods found to execute.');
            expect(redisService.publish).toHaveBeenCalledWith(
                'api:init-success',
                expect.stringContaining('"overallStatus":"success"')
            );

            // Verify an empty report is saved
            const files = fs.readdirSync(logsDir);
            expect(files.length).toBe(1);
            const reportContent = JSON.parse(fs.readFileSync(path.join(logsDir, files[0]), 'utf8')) as InitReport;
            expect(reportContent.overallStatus).toBe('success');
            expect(reportContent.steps).toEqual([]);
            expect(reportContent.duration).toBe(0);
        });

        it('should handle a single successful step', async () => {
            class SingleStepService {
                constructor(private readonly logger: BetterLogger) { }
                @InitStep({ name: 'My Single Step', priority: 1 }) // Updated syntax
                async singleStep(): Promise<StepResult> {
                    this.logger.debug('Executing single step');
                    return { status: 'success' };
                }
            }

            // Manually mock the providers to include only SingleStepService
            jest.spyOn(service['discoveryService'], 'getProviders').mockReturnValue([
                {
                    instance: new SingleStepService(logger),
                    metatype: SingleStepService,
                    wrapper: {}, // Mock only necessary properties
                } as any,
            ]);

            const success = await service.init(); // Call init here
            expect(success).toBe(true);
            expect(logger.debug).toHaveBeenCalledWith('Executing step: My Single Step');
            expect(redisService.publish).toHaveBeenCalledWith(
                'api:init-success',
                expect.stringContaining('"overallStatus":"success"')
            );

            const files = fs.readdirSync(logsDir);
            const reportContent = JSON.parse(fs.readFileSync(path.join(logsDir, files[0]), 'utf8')) as InitReport;
            expect(reportContent.overallStatus).toBe('success');
            expect(reportContent.steps.length).toBe(1);
            expect(reportContent.steps[0].name).toBe('My Single Step');
            expect(reportContent.steps[0].status).toBe('success');
        });

        it('should persist maintenance-scoped reports in Redis', async () => {
            class SingleStepService {
                @InitStep({ name: 'My Single Step', priority: 1 })
                async singleStep(): Promise<StepResult> {
                    return { status: 'success', message: 'ok' };
                }
            }

            jest.spyOn(service['discoveryService'], 'getProviders').mockReturnValue([
                {
                    instance: new SingleStepService(),
                    metatype: SingleStepService,
                    wrapper: {},
                } as any,
            ]);

            jest.spyOn(service['redisService'], 'get').mockImplementation(
                async (key: string) => {
                    if (key === 'maintenance:active') {
                        return 'true';
                    }

                    if (key === 'maintenance:current:id') {
                        return 'mnt-001';
                    }

                    return null;
                },
            );

            const success = await service.init();
            expect(success).toBe(true);

            expect(redisService.setJson).toHaveBeenCalledWith(
                'maintenance:init-report:mnt-001',
                expect.objectContaining({
                    maintenanceId: 'mnt-001',
                    updates: 1,
                    report: expect.objectContaining({
                        maintenanceId: 'mnt-001',
                        overallStatus: 'success',
                    }),
                }),
                60 * 60 * 24 * 7,
            );

            expect(redisService.publish).toHaveBeenCalledWith(
                'api:init-success',
                expect.stringContaining('"maintenanceId":"mnt-001"'),
            );
        });

        it('should merge game entries incrementally for same maintenance', () => {
            const previousReport: InitReport = {
                overallStatus: 'success',
                maintenanceId: 'mnt-001',
                timestamp: '2026-04-12T20:00:00.000Z',
                duration: 70,
                steps: [
                    {
                        name: 'Release games ready versions',
                        service: 'GamesBackofficeInit',
                        status: 'success',
                        duration: 40,
                        message:
                            'Successfully processed the following games:\n' +
                            '• Stream Survivors - No new versions to release',
                    },
                ],
            };

            const currentReport: InitReport = {
                overallStatus: 'success',
                maintenanceId: 'mnt-001',
                timestamp: '2026-04-12T20:05:00.000Z',
                duration: 50,
                steps: [
                    {
                        name: 'Release games ready versions',
                        service: 'GamesBackofficeInit',
                        status: 'success',
                        duration: 35,
                        message:
                            'Successfully processed the following games:\n' +
                            '• Testing - No new versions to release',
                    },
                ],
            };

            const merged = (service as any).mergeInitReports(
                previousReport,
                currentReport,
            ) as InitReport;

            expect(merged.steps).toHaveLength(1);
            expect(merged.steps[0].message)
                .toContain('Stream Survivors - No new versions to release');
            expect(merged.steps[0].message)
                .toContain('Testing - No new versions to release');
        });

        it('should log a warning if @InitStep metadata points to a non-function property', async () => {
            class BadlyConfiguredService {
                constructor(private readonly logger: BetterLogger) { }
                // This property is NOT decorated with @InitStep, but we'll manually add metadata
                myProperty = 'value';
            }

            // Manually define the metadata for a non-function property.
            // This simulates a scenario where the decorator's application *resulted* in
            // metadata being present for a non-function, which `InitService` must handle.
            Reflect.defineMetadata(INIT_STEPS_METADATA_KEY, [
                { methodName: 'myProperty', name: 'Bad Decorated Step', priority: 1 }
            ], BadlyConfiguredService);


            jest.spyOn(service['discoveryService'], 'getProviders').mockReturnValue([
                {
                    instance: new BadlyConfiguredService(logger),
                    metatype: BadlyConfiguredService,
                    wrapper: {},
                } as any,
            ]);

            const success = await service.init(); // Call init here
            expect(success).toBe(true); // Should still succeed as the non-function step is skipped
            expect(logger.warn).toHaveBeenCalledWith(
                `@InitStep applied to non-function property 'myProperty' in service 'BadlyConfiguredService'. Skipping.`,
            );
            expect(redisService.publish).toHaveBeenCalledWith(
                'api:init-success',
                expect.stringContaining('"overallStatus":"success"')
            );
            const files = fs.readdirSync(logsDir);
            const reportContent = JSON.parse(fs.readFileSync(path.join(logsDir, files[0]), 'utf8')) as InitReport;
            expect(reportContent.steps).toEqual([]); // No steps executed
        });

        it('should handle general error during init process (e.g., redis publish fails)', async () => {
            jest.spyOn(service['redisService'], 'publish').mockRejectedValueOnce(new Error('Redis connection lost'));

            // Provide a simple service to trigger the init logic
            class SimpleService {
                constructor(private readonly logger: BetterLogger) { }
                @InitStep({ name: 'Simple Step', priority: 1 }) // Updated syntax
                async simpleStep(): Promise<StepResult> {
                    return { status: 'success' };
                }
            }
            jest.spyOn(service['discoveryService'], 'getProviders').mockReturnValue([
                {
                    instance: new SimpleService(logger),
                    metatype: SimpleService,
                    wrapper: {},
                } as any,
            ]);

            const success = await service.init(); // Call init here
            expect(success).toBe(false); // Init should report failure due to internal error

            expect(logger.error).toHaveBeenCalledWith('Initialization process failed: Redis connection lost');
            // Even if publish fails, it should attempt to publish the 'failed' status due to the catch block
            expect(redisService.publish).toHaveBeenCalledWith(
                'api:init-failed',
                expect.any(String),
            );
        });

        it('should ensure logs directory is created', async () => {
            // Run init, directory should be created
            class SimpleService {
                constructor() { } // No logger dependency needed for this simple case
                @InitStep({ name: 'test step', priority: 1 }) // Updated syntax
                async testStep() { return { status: 'success' as const }; }
            }

            jest.spyOn(service['discoveryService'], 'getProviders').mockReturnValue([
                { instance: new SimpleService(), metatype: SimpleService, wrapper: {} } as any
            ]);

            expect(fs.existsSync(logsDir)).toBe(false); // Should not exist before init
            await service.init(); // Call init here
            expect(fs.existsSync(logsDir)).toBe(true);
            expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('Created logs directory at:'));
        });
    });
});
