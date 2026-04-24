import { SystemController } from './system.controller';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { createMockSystemService, MockSystemService } from 'test/core/services/system.service.mock';
import { SystemService } from '../services/system.service';
import { StartMaintenancePayloadDTO } from '../dto/start-maintenance.payload';
import { SystemStatus } from '@hms/shared-types/hms';

/**
 * Validates SystemController wiring and behavior against a mock
 * implementation of SystemService. Uses explicit logger and
 * ConfigService stubs to avoid side effects.
 */
describe('SystemController', () => {
    let controller: SystemController;
    let mockSystemService: MockSystemService;

    beforeEach(async () => {
        jest.spyOn(console, 'error').mockImplementation(() => { });

        mockSystemService = createMockSystemService();

        const module: TestingModule = await Test.createTestingModule({
            controllers: [SystemController],
            providers: [
                { provide: SystemService, useValue: mockSystemService },
                { provide: ConfigService, useValue: {} },
                {
                    provide: Logger,
                    useValue: {
                        log: jest.fn(),
                        error: jest.fn(),
                        warn: jest.fn(),
                        debug: jest.fn(),
                        verbose: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<SystemController>(SystemController);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should return the current status', () => {
        mockSystemService._reset();
        const result = controller.getStatus();
        expect(result.data.status).toBe(SystemStatus.Down);
    });

    it('should start the system', async () => {
        await controller.start();
        expect(mockSystemService.start).toHaveBeenCalled();
        expect(mockSystemService.status).toBe(SystemStatus.Up);
    });

    it('should stop the system', async () => {
        mockSystemService._reset();
        await controller.stop();
        expect(mockSystemService.stop).toHaveBeenCalled();
        expect(mockSystemService.status).toBe(SystemStatus.Down);
    });

    it('should start maintenance', async () => {
        const payload: StartMaintenancePayloadDTO = {
            preparation_duration_in_seconds: 10,
            maintenance_duration_in_seconds: 20,
        };

        await controller.startMaintenance(payload);

        expect(mockSystemService.startMaintenance)
            .toHaveBeenCalledWith(payload);

        expect(mockSystemService.statusData.status)
            .toBe(SystemStatus.PreparingMaintenance);
    });

    it('should cancel maintenance preparation', async () => {
        await controller.cancelMaintenancePreparation();
        expect(mockSystemService.cancelMaintenancePreparation).toHaveBeenCalled();
        expect(mockSystemService.status).toBe(SystemStatus.Up);
    });

    it('should end maintenance', async () => {
        await controller.endMaintenance();
        expect(mockSystemService.endMaintenance).toHaveBeenCalled();
    });
});
