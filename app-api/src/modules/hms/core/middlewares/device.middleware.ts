// device.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as UAParser from 'ua-parser-js';
import { DeviceInfo } from '@hms-module/modules/auth/types/device-info.type';

@Injectable()
export class DeviceMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        req.deviceInfo = this.extractDeviceInfo(req);
        next();
    }

    private extractDeviceInfo(request: Request): DeviceInfo {
        const userAgent = request.headers['user-agent'] || '';
        const parser = new UAParser.UAParser(userAgent);
        const result = parser.getResult();

        return {
            ip: this.getClientIp(request),
            userAgent,
            os: result.os.name || 'unknown',
            browser: result.browser.name || 'unknown',
            deviceType: result.device.type ?? 'unknown',
            origin: request.headers['origin'] || 'unknown',
        };
    }

    private getClientIp(request: Request): string {
        return request.ip ||
            request.headers['x-forwarded-for']?.toString() ||
            request.socket?.remoteAddress ||
            'unknown';
    }
}