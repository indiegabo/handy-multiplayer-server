// maintenance.interceptor.ts
import { Injectable, HttpException, HttpStatus, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { MAINTENANCE_EXEMPT } from '../modules/system/decorators/maintenance-exempt.decorator';
import { SystemService } from '../modules/system/services/system.service';
import { SystemStatus } from '@hms/shared-types/hms';

@Injectable()
export class SystemStatusInterceptor {
    constructor(
        private readonly systemService: SystemService,
        private readonly reflector: Reflector,
    ) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const status = this.systemService.status;

        if (status === SystemStatus.Up) return next.handle();
        if (status === SystemStatus.Down) {
            throw new HttpException('System is Down', HttpStatus.SERVICE_UNAVAILABLE);
        }

        const isExempt = this.reflector.get<boolean>(
            MAINTENANCE_EXEMPT,
            context.getHandler()
        );

        if (status === SystemStatus.UnderMaintenance && !isExempt) {
            throw new HttpException('System Under Maintenance', HttpStatus.SERVICE_UNAVAILABLE);
        }

        return next.handle();
    }
}