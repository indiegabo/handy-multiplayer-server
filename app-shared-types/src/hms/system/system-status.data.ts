import { SystemStatus } from "./system-status.enum";

export type SystemStatusData = {
    status: SystemStatus;
    message?: string;
    maintenance_duration_in_seconds?: number;
    preparation_time_in_seconds?: number;
}