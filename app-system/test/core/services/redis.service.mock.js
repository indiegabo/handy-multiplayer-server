"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockRedisService = void 0;
// src/redis/redis.service.mock.ts
const globals_1 = require("@jest/globals");
const createMockRedisService = () => {
    const store = {};
    const subscribers = {};
    const mockService = {
        onModuleInit: globals_1.jest.fn(),
        set: globals_1.jest.fn().mockImplementation(async (key, value, ttl) => {
            store[key] = { value, ttl };
        }),
        get: globals_1.jest.fn().mockImplementation(async (key) => {
            return store[key]?.value || null;
        }),
        publish: globals_1.jest.fn().mockImplementation(async (channel, message) => {
            const callbacks = subscribers[channel] || [];
            callbacks.forEach(cb => cb(message));
            return callbacks.length;
        }),
        subscribe: globals_1.jest.fn().mockImplementation(async (channel, callback) => {
            if (!subscribers[channel])
                subscribers[channel] = [];
            subscribers[channel].push(callback);
        }),
        keys: globals_1.jest.fn().mockImplementation(async (pattern) => {
            const regex = new RegExp(pattern.replace('*', '.*'));
            return Object.keys(store).filter(key => regex.test(key));
        }),
        // Propriedades internas para testes
        _store: store,
        _subscribers: subscribers,
        // Métodos auxiliares
        _clear: () => {
            Object.keys(store).forEach(key => delete store[key]);
            Object.keys(subscribers).forEach(key => delete subscribers[key]);
        },
        _simulateMessage: (channel, message) => {
            const callbacks = subscribers[channel] || [];
            callbacks.forEach(cb => cb(message));
        }
    };
    return mockService;
};
exports.createMockRedisService = createMockRedisService;
//# sourceMappingURL=redis.service.mock.js.map