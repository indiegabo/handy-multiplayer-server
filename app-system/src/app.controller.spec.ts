import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { ConfigService } from '@nestjs/config';
import {
  HealthCheckService,
  HttpHealthIndicator,
} from '@nestjs/terminus';

describe('AppController', () => {
  let appController: AppController;

  const configServiceMock: Partial<ConfigService> = {
    get: jest.fn(),
  };

  const httpHealthIndicatorMock: Partial<HttpHealthIndicator> = {
    pingCheck: jest.fn().mockResolvedValue({}),
  };

  const healthCheckServiceMock: Partial<HealthCheckService> = {
    // Simulates Terminus real behavior: executes each indicator callback.
    check: jest.fn().mockImplementation(async (indicators: Array<() => any>) => {
      for (const indicator of indicators) {
        await indicator();
      }
      return { status: 'ok' };
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        { provide: ConfigService, useValue: configServiceMock },
        { provide: HealthCheckService, useValue: healthCheckServiceMock },
        { provide: HttpHealthIndicator, useValue: httpHealthIndicatorMock },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('should be defined', () => {
    expect(appController).toBeDefined();
  });

  it('healthCheck should call health.check with pingCheck', async () => {
    await appController.healthCheck();

    expect(httpHealthIndicatorMock.pingCheck).toHaveBeenCalledWith(
      'self',
      'http://localhost:3000/v1',
    );
    expect(healthCheckServiceMock.check).toHaveBeenCalled();
  });
});
