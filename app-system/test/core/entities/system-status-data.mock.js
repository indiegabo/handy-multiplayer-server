"use strict";
// src/system-status/system-status.mock.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.SYSTEM_STATUS_UNDER_MAINTENANCE_MOCK = exports.SYSTEM_STATUS_PREP_MAINTENANCE_MOCK = exports.SYSTEM_STATUS_DOWN_MOCK = exports.SYSTEM_STATUS_UP_MOCK = exports.SYSTEM_STATUS_DATA_MOCK = void 0;
const system_status_enum_1 = require("@src/hms/modules/system/types/system-status.enum");
exports.SYSTEM_STATUS_DATA_MOCK = [
    {
        status: system_status_enum_1.SystemStatus.Up,
        message: 'System is fully operational',
    },
    {
        status: system_status_enum_1.SystemStatus.Down,
        message: 'System is currently unavailable',
    },
    {
        status: system_status_enum_1.SystemStatus.PreparingMaintenance,
        message: 'System preparing for maintenance',
        preparation_time_in_seconds: 3600, // 1 hour
    },
    {
        status: system_status_enum_1.SystemStatus.UnderMaintenance,
        message: 'System undergoing scheduled maintenance',
        maintenance_duration_in_seconds: 7200, // 2 hours
    },
    // Caso adicional com todos os campos
    {
        status: system_status_enum_1.SystemStatus.PreparingMaintenance,
        message: 'Emergency maintenance preparation',
        preparation_time_in_seconds: 1800, // 30 minutes
        maintenance_duration_in_seconds: 10800 // 3 hours
    }
];
// Versão simplificada para casos específicos
exports.SYSTEM_STATUS_UP_MOCK = {
    status: system_status_enum_1.SystemStatus.Up,
    message: 'All systems normal'
};
exports.SYSTEM_STATUS_DOWN_MOCK = {
    status: system_status_enum_1.SystemStatus.Down,
    message: 'Critical system failure'
};
exports.SYSTEM_STATUS_PREP_MAINTENANCE_MOCK = {
    status: system_status_enum_1.SystemStatus.PreparingMaintenance,
    message: 'Preparing for database migration',
    preparation_time_in_seconds: 2400 // 40 minutes
};
exports.SYSTEM_STATUS_UNDER_MAINTENANCE_MOCK = {
    status: system_status_enum_1.SystemStatus.UnderMaintenance,
    message: 'Database migration in progress',
    maintenance_duration_in_seconds: 14400 // 4 hours
};
//# sourceMappingURL=system-status-data.mock.js.map