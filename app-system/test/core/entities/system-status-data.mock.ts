// src/system-status/system-status.mock.ts

import { SystemStatusData } from '@hms/shared-types/hms';
import { SystemStatus } from '@hms/shared-types/hms';

export const SYSTEM_STATUS_DATA_MOCK: SystemStatusData[] = [
    {
        status: SystemStatus.Up,
        message: 'System is fully operational',
    },
    {
        status: SystemStatus.Down,
        message: 'System is currently unavailable',
    },
    {
        status: SystemStatus.PreparingMaintenance,
        message: 'System preparing for maintenance',
        preparation_time_in_seconds: 3600, // 1 hour
    },
    {
        status: SystemStatus.UnderMaintenance,
        message: 'System undergoing scheduled maintenance',
        maintenance_duration_in_seconds: 7200, // 2 hours
    },
    // Caso adicional com todos os campos
    {
        status: SystemStatus.PreparingMaintenance,
        message: 'Emergency maintenance preparation',
        preparation_time_in_seconds: 1800, // 30 minutes
        maintenance_duration_in_seconds: 10800 // 3 hours
    }
];

// Versão simplificada para casos específicos
export const SYSTEM_STATUS_UP_MOCK: SystemStatusData = {
    status: SystemStatus.Up,
    message: 'All systems normal'
};

export const SYSTEM_STATUS_DOWN_MOCK: SystemStatusData = {
    status: SystemStatus.Down,
    message: 'Critical system failure'
};

export const SYSTEM_STATUS_PREP_MAINTENANCE_MOCK: SystemStatusData = {
    status: SystemStatus.PreparingMaintenance,
    message: 'Preparing for database migration',
    preparation_time_in_seconds: 2400 // 40 minutes
};

export const SYSTEM_STATUS_UNDER_MAINTENANCE_MOCK: SystemStatusData = {
    status: SystemStatus.UnderMaintenance,
    message: 'Database migration in progress',
    maintenance_duration_in_seconds: 14400 // 4 hours
};