/* File: src/core/modules/system/dto/start-maintenance.payload.ts */

import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

/* ─────────────────────────────────────────────────────────────────────
 * StartMaintenancePayloadDTO
 * ──────────────────────────────────────────────────────────────────── */

/**
 * Payload for maintenance scheduling.
 * Both fields are required and validated as positive integers.
 */
export class StartMaintenancePayloadDTO {
    /**
     * Optional external identifier for this maintenance window.
     * When omitted, SystemService generates one automatically.
     */
    @IsOptional()
    @IsString()
    @MaxLength(120)
    maintenance_id?: string;

    /**
     * Preparation countdown (in seconds) before maintenance starts.
     * Must be >= 1 to avoid immediate/invalid scheduling.
     */
    @IsInt()
    @Min(1)
    preparation_duration_in_seconds!: number;

    /**
     * Expected maintenance duration (in seconds).
     * Must be >= 1 to prevent zero-length maintenance windows.
     */
    @IsInt()
    @Min(1)
    maintenance_duration_in_seconds!: number;
}
