// discord.service.mock.ts
import { jest } from '@jest/globals';
import { DiscordService } from '@src/core/modules/discord/services/discord.service';

export type MockDiscordService = Partial<Record<keyof DiscordService, jest.Mock>> & {
    getInternalLogs?: () => string[]; // Optional for test introspection
};

export const createMockDiscordService = (): MockDiscordService => {
    const logs: string[] = [];

    const mockService: MockDiscordService = {
        sendStatusNotification: jest.fn().mockImplementation(async (message: string) => {
            logs.push(`[Status] ${message}`);
        }),

        sendMaintenanceNotification: jest.fn().mockImplementation(async (title: string, details: string) => {
            logs.push(`[Maintenance] ${title}: ${details}`);
        }),

        // Optionally stub init if your tests call onModuleInit
        onModuleInit: jest.fn<() => Promise<void>>().mockResolvedValue(),


        // Optional helper to inspect what was "sent"
        getInternalLogs: () => logs,
    };

    return mockService;
};
