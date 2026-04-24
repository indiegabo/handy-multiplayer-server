// maintenance-exempt.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const MAINTENANCE_EXEMPT = 'maintenanceExempt';
export const MaintenanceExempt = () => SetMetadata(MAINTENANCE_EXEMPT, true);