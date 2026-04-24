import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { HealthCheck, HealthCheckService, HttpHealthIndicator } from '@nestjs/terminus';

@Controller()
export class AppController {

    constructor(
        private health: HealthCheckService,
        private http: HttpHealthIndicator,
    ) { }

    @Get()
    getRoot() {
        return;
    }

    @Get('health')
    @HealthCheck()
    healthCheck() {
        return this.health.check([
            () => this.http.pingCheck('self', 'http://localhost:3000/v1'),
        ]);
    }
}

