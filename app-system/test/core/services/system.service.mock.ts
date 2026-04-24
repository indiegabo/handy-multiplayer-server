import { SystemStatus } from '@hms/shared-types/hms';
import { jest } from '@jest/globals';
import { StartMaintenancePayloadDTO } from '@src/core/modules/system/dto/start-maintenance.payload';
import { ExtendedSystemStatusData, SystemService } from '@src/core/modules/system/services/system.service';

// Helper types para separar métodos de propriedades
type MethodKeys = {
    [K in keyof SystemService]: SystemService[K] extends (...args: any[]) => any ? K : never;
}[keyof SystemService];

type PropertyKeys = Exclude<keyof SystemService, MethodKeys>;

export type MockSystemService = {
    [K in MethodKeys]?: jest.Mock;
} & {
    [K in PropertyKeys]?: SystemService[K];
} & {
    _statusData: ExtendedSystemStatusData;
    _reset: () => void;
};

export const createMockSystemService = (): MockSystemService => {
    let statusData: ExtendedSystemStatusData = { status: SystemStatus.Down };

    const mockService: MockSystemService = {
        startMaintenance: jest.fn().mockImplementation(async (payload: StartMaintenancePayloadDTO) => {
            statusData = {
                status: SystemStatus.PreparingMaintenance,
                preparationTimeInSeconds: payload.preparation_duration_in_seconds,
                maintenanceDurationInSeconds: payload.maintenance_duration_in_seconds,
            };
        }),

        cancelMaintenancePreparation: jest.fn().mockImplementation(async () => {
            statusData.status = SystemStatus.Up;
        }),

        endMaintenance: jest.fn().mockImplementation(async () => { }),

        stop: jest.fn().mockImplementation(async () => {
            statusData.status = SystemStatus.Down;
        }),

        start: jest.fn().mockImplementation(async () => {
            statusData.status = SystemStatus.Up;
        }),

        setSystemStatus: jest.fn().mockImplementation(async (data: ExtendedSystemStatusData) => {
            statusData = data;
        }),

        get status() {
            return statusData.status;
        },

        get statusData() {
            return statusData;
        },

        get isUnderMaintenance() {
            return statusData.status === SystemStatus.UnderMaintenance;
        },

        get isUp() {
            return statusData.status === SystemStatus.Up;
        },

        get isDown() {
            return statusData.status === SystemStatus.Down;
        },

        _reset: () => {
            statusData = { status: SystemStatus.Down };
        },

        // *** Adicione isso ***
        _statusData: statusData,
    };

    return mockService;
};
