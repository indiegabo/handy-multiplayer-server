"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockDiscordService = void 0;
// discord.service.mock.ts
const globals_1 = require("@jest/globals");
const createMockDiscordService = () => {
    const logs = [];
    const mockService = {
        sendStatusNotification: globals_1.jest.fn().mockImplementation(async (message) => {
            logs.push(`[Status] ${message}`);
        }),
        sendMaintenanceNotification: globals_1.jest.fn().mockImplementation(async (title, details) => {
            logs.push(`[Maintenance] ${title}: ${details}`);
        }),
        // Optionally stub init if your tests call onModuleInit
        onModuleInit: globals_1.jest.fn().mockResolvedValue(),
        // Optional helper to inspect what was "sent"
        getInternalLogs: () => logs,
    };
    return mockService;
};
exports.createMockDiscordService = createMockDiscordService;
//# sourceMappingURL=discord.service.mock.js.map