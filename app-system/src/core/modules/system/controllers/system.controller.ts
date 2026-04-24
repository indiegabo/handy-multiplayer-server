import { Body, Controller, Get, HttpCode, HttpException, HttpStatus, Logger, Post, UseGuards, ValidationPipe } from '@nestjs/common';
import { MaintenanceExempt } from '../decorators/maintenance-exempt.decorator';
import { SystemService } from '../services/system.service';
import { ConfigService } from '@nestjs/config';
import { StartMaintenancePayloadDTO } from '../dto/start-maintenance.payload';
import { SystemStatusResponseDTO } from '../dto/system-status.response.dto';
import { responser } from '@src/utils/response.util';
import { ApiResponse } from "@hms/shared-types/hms";
import { AccessPolicy, AuthSubject } from '@src/core/decorators/auth-subject.decorator';

@Controller('system')
export class SystemController {
    private readonly logger = new Logger(SystemController.name);

    constructor(
        private readonly systemService: SystemService,
        private readonly configService: ConfigService,
    ) {
    }

    @MaintenanceExempt()
    @Get('status')
    getStatus(): ApiResponse<SystemStatusResponseDTO> {
        return responser.data({
            status: this.systemService.status,
        });
    }

    /**
  * Starts the maintenance scheduling sequence.
  *
  * Validation strategy:
  *  - Uses a parameter-scoped ValidationPipe with:
  *    - whitelist: strips unknown properties
  *    - forbidNonWhitelisted: rejects unexpected properties (400)
  *    - transform: converts payload to DTO class instance (and types)
  *
  * Error policy:
  *  - Validation errors are handled by the pipe (400 Bad Request).
  *  - Service errors are caught and mapped to 500, with a concise log.
  *
  * @param payload Validated maintenance payload.
  * @returns ApiResponse<boolean> success envelope.
  */
    @MaintenanceExempt()
    @AuthSubject(AccessPolicy.AdminOnly)
    @Post('start-maintenance')
    @HttpCode(HttpStatus.OK)
    async startMaintenance(
        @Body(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        )
        payload: StartMaintenancePayloadDTO,
    ): Promise<ApiResponse<boolean>> {
        try {
            await this.systemService.startMaintenance(payload);
            return responser.data(true);
        } catch (error: any) {
            this.logger.error(error?.message, error?.stack);
            throw new HttpException(
                'Error starting maintenance',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @MaintenanceExempt()
    @AuthSubject(AccessPolicy.AdminOnly)
    @Post('cancel-maintenance-preparation')
    @HttpCode(HttpStatus.OK)
    async cancelMaintenancePreparation(): Promise<ApiResponse<boolean>> {

        try {
            await this.systemService.cancelMaintenancePreparation();
        }
        catch (error) {
            this.logger.error(error.message, error.stack);
            throw new HttpException('Error cancelling maintenance preparation', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        return responser.data(true);
    }

    @MaintenanceExempt()
    @AuthSubject(AccessPolicy.AdminOnly)
    @Post('end-maintenance')
    @HttpCode(HttpStatus.OK)
    async endMaintenance(): Promise<ApiResponse<boolean>> {
        try {
            await this.systemService.endMaintenance();
        }
        catch (error) {
            this.logger.error(error.message, error.stack);
            throw new HttpException('Error ending maintenance', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        return responser.data(true);
    }

    @MaintenanceExempt()
    @AuthSubject(AccessPolicy.AdminOnly)
    @Post('stop')
    @HttpCode(HttpStatus.OK)
    async stop(): Promise<ApiResponse<boolean>> {
        try {
            await this.systemService.stop();
        }
        catch (error) {
            this.logger.error(error.message, error.stack);
            throw new HttpException('Error resetting system', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        return responser.data(true);
    }

    @MaintenanceExempt()
    @AuthSubject(AccessPolicy.AdminOnly)
    @Post('start')
    @HttpCode(HttpStatus.OK)
    async start(): Promise<ApiResponse<boolean>> {
        try {
            await this.systemService.start();
        }
        catch (error) {
            this.logger.error(error.message, error.stack);
            throw new HttpException('Error resetting system', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        return responser.data(true);
    }
}