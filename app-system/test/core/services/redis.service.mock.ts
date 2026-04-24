// src/redis/redis.service.mock.ts
import { jest } from '@jest/globals';
import { RedisService } from '@src/core/modules/redis/redis.service';

export type MockRedisService = Partial<Record<keyof RedisService, jest.Mock>> & {
    _store: Record<string, { value: string; ttl?: number }>;
    _subscribers: Record<string, ((message: string) => void)[]>;
    _clear: () => void;
    _simulateMessage: (channel: string, message: string) => void;
};

export const createMockRedisService = (): MockRedisService => {
    const store: Record<string, { value: string; ttl?: number }> = {};
    const subscribers: Record<string, ((message: string) => void)[]> = {};

    const mockService: MockRedisService = {
        onModuleInit: jest.fn(),

        set: jest.fn().mockImplementation(async (key: string, value: string, ttl?: number) => {
            store[key] = { value, ttl };
        }),

        get: jest.fn().mockImplementation(async (key: string) => {
            return store[key]?.value || null;
        }),

        publish: jest.fn().mockImplementation(async (channel: string, message: string) => {
            const callbacks = subscribers[channel] || [];
            callbacks.forEach(cb => cb(message));
            return callbacks.length;
        }),

        subscribe: jest.fn().mockImplementation(async (channel: string, callback: (message: string) => void) => {
            if (!subscribers[channel]) subscribers[channel] = [];
            subscribers[channel].push(callback);
        }),

        keys: jest.fn().mockImplementation(async (pattern: string) => {
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

        _simulateMessage: (channel: string, message: string) => {
            const callbacks = subscribers[channel] || [];
            callbacks.forEach(cb => cb(message));
        }
    };

    return mockService;
};