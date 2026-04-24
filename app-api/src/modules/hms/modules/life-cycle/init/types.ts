// src/hms/modules/init/types.ts
export type InitStatus = 'success' | 'partial' | 'failed';

export interface StepResult {
    status: InitStatus;
    message?: string;
}

export interface InitStepOptions {
    name: string;
    priority: number; // Higher numbers execute first
}

export interface InitReport {
    overallStatus: InitStatus;
    steps: {
        name: string;
        status: InitStatus;
        message?: string;
        duration: number;
        service: string;
    }[];
    timestamp: string;
    duration: number;
    maintenanceId?: string;
}