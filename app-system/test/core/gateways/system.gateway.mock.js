"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockSystemGateway = void 0;
// system.gateway.mock.ts
const globals_1 = require("@jest/globals");
const createMockSystemGateway = () => {
    const emitted = [];
    const mock = {
        notifySystemStatus: globals_1.jest.fn().mockImplementation((payload) => {
            emitted.push({ payload });
        }),
        notifySingleClient: globals_1.jest.fn().mockImplementation((clientId, payload) => {
            emitted.push({ to: clientId, payload });
        }),
        afterInit: globals_1.jest.fn(),
        handleConnection: globals_1.jest.fn(),
        handleDisconnect: globals_1.jest.fn(),
        getEmittedStatus: () => emitted,
    };
    return mock;
};
exports.createMockSystemGateway = createMockSystemGateway;
//# sourceMappingURL=system.gateway.mock.js.map