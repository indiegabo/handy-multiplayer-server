"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockSystemService = void 0;
const globals_1 = require("@jest/globals");
const system_status_enum_1 = require("../../../src/core/modules/system/types/system-status.enum");
const createMockSystemService = () => {
    let statusData = { status: system_status_enum_1.SystemStatus.Down };
    const mockService = {
        startMaintenance: globals_1.jest.fn().mockImplementation(async (payload) => {
            statusData = {
                status: system_status_enum_1.SystemStatus.PreparingMaintenance,
                preparationTimeInSeconds: payload.preparation_duration_in_seconds,
                maintenanceDurationInSeconds: payload.maintenance_duration_in_seconds,
            };
        }),
        cancelMaintenancePreparation: globals_1.jest.fn().mockImplementation(async () => {
            statusData.status = system_status_enum_1.SystemStatus.Up;
        }),
        endMaintenance: globals_1.jest.fn().mockImplementation(async () => { }),
        stop: globals_1.jest.fn().mockImplementation(async () => {
            statusData.status = system_status_enum_1.SystemStatus.Down;
        }),
        start: globals_1.jest.fn().mockImplementation(async () => {
            statusData.status = system_status_enum_1.SystemStatus.Up;
        }),
        setSystemStatus: globals_1.jest.fn().mockImplementation(async (data) => {
            statusData = data;
        }),
        get status() {
            return statusData.status;
        },
        get statusData() {
            return statusData;
        },
        get isUnderMaintenance() {
            return statusData.status === system_status_enum_1.SystemStatus.UnderMaintenance;
        },
        get isUp() {
            return statusData.status === system_status_enum_1.SystemStatus.Up;
        },
        get isDown() {
            return statusData.status === system_status_enum_1.SystemStatus.Down;
        },
        _reset: () => {
            statusData = { status: system_status_enum_1.SystemStatus.Down };
        },
        // *** Adicione isso ***
        _statusData: statusData,
    };
    return mockService;
};
exports.createMockSystemService = createMockSystemService;
//# sourceMappingURL=system.service.mock.js.map