"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CRITICAL_SYSTEM_STATUS_MOCK = exports.FAILED_INIT_REPORT_MOCK = exports.SUCCESSFUL_INIT_REPORT_MOCK = exports.INIT_REPORT_MOCK = exports.STEP_RESULT_MOCK = exports.EXTENDED_SYSTEM_STATUS_MOCK = void 0;
const system_status_enum_1 = require("@src/hms/modules/system/types/system-status.enum");
// ExtendedSystemStatusData Mocks
exports.EXTENDED_SYSTEM_STATUS_MOCK = [
    {
        status: system_status_enum_1.SystemStatus.Up,
        message: 'All systems operational',
        requiresAttention: false,
        lastDownReason: 'Scheduled maintenance',
        maintenanceStartTime: '2025-07-20T14:00:00Z'
    },
    {
        status: system_status_enum_1.SystemStatus.Down,
        message: 'Critical failure in database service',
        requiresAttention: true,
        lastDownReason: 'Database connection pool exhausted',
        maintenanceError: 'Failed to failover to replica',
        maintenanceStartTime: '2025-07-20T15:30:00Z'
    },
    {
        status: system_status_enum_1.SystemStatus.PreparingMaintenance,
        message: 'Preparing for database migration',
        preparationTimeInSeconds: 3600,
        maintenanceDurationInSeconds: 7200,
        requiresAttention: true,
        maintenanceStartTime: '2025-07-21T02:00:00Z'
    },
    {
        status: system_status_enum_1.SystemStatus.UnderMaintenance,
        message: 'Performing storage system upgrade',
        maintenanceDurationInSeconds: 10800,
        maintenanceError: 'Backup taking longer than expected',
        requiresAttention: true,
        maintenanceStartTime: '2025-07-21T10:00:00Z'
    }
];
// StepResult Mocks
exports.STEP_RESULT_MOCK = [
    {
        status: 'success',
        message: 'Database connection established'
    },
    {
        status: 'partial',
        message: 'Cache service connected but with warnings'
    },
    {
        status: 'failed',
        message: 'Message queue connection timeout'
    }
];
// InitReport Mocks
exports.INIT_REPORT_MOCK = [
    {
        overallStatus: 'success',
        duration: 1250,
        timestamp: '2025-07-20T12:00:00Z',
        steps: [
            {
                name: 'Database',
                status: 'success',
                message: 'Connected in 320ms',
                duration: 320,
                service: 'PostgreSQL'
            },
            {
                name: 'Cache',
                status: 'success',
                message: 'Redis cluster ready',
                duration: 150,
                service: 'Redis'
            }
        ]
    },
    {
        overallStatus: 'partial',
        duration: 4200,
        timestamp: '2025-07-20T12:05:00Z',
        steps: [
            {
                name: 'Database',
                status: 'success',
                message: 'Connected in 450ms',
                duration: 450,
                service: 'PostgreSQL'
            },
            {
                name: 'Search',
                status: 'partial',
                message: 'Primary node unavailable, using replica',
                duration: 2100,
                service: 'Elasticsearch'
            }
        ]
    },
    {
        overallStatus: 'failed',
        duration: 8000,
        timestamp: '2025-07-20T12:10:00Z',
        steps: [
            {
                name: 'Database',
                status: 'failed',
                message: 'Connection timeout',
                duration: 5000,
                service: 'PostgreSQL'
            },
            {
                name: 'Message Broker',
                status: 'partial',
                message: 'Connected to secondary node only',
                duration: 2500,
                service: 'RabbitMQ'
            }
        ]
    }
];
// Individual mocks for specific test cases
exports.SUCCESSFUL_INIT_REPORT_MOCK = {
    overallStatus: 'success',
    duration: 980,
    timestamp: '2025-07-21T09:00:00Z',
    steps: [
        {
            name: 'Database',
            status: 'success',
            duration: 250,
            service: 'MongoDB'
        },
        {
            name: 'Cache',
            status: 'success',
            duration: 120,
            service: 'Redis'
        }
    ]
};
exports.FAILED_INIT_REPORT_MOCK = {
    overallStatus: 'failed',
    duration: 15000,
    timestamp: '2025-07-21T09:05:00Z',
    steps: [
        {
            name: 'Database',
            status: 'failed',
            message: 'Authentication failed',
            duration: 5000,
            service: 'PostgreSQL'
        }
    ]
};
exports.CRITICAL_SYSTEM_STATUS_MOCK = {
    status: system_status_enum_1.SystemStatus.Down,
    message: 'Multiple service failures detected',
    requiresAttention: true,
    lastDownReason: 'Network partition between services',
    maintenanceError: 'Automatic recovery failed',
    maintenanceStartTime: '2025-07-21T12:00:00Z'
};
//# sourceMappingURL=system-operations-data.mock.js.map