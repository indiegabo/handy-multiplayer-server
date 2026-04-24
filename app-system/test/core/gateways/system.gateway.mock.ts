// system.gateway.mock.ts
import { jest } from '@jest/globals';
import { SystemGateway } from '@src/core/modules/system/system.gateway';
import { SystemStatusData } from '@hms/shared-types/hms';

export type MockSystemGateway = Partial<Record<keyof SystemGateway, jest.Mock>> & {
    getEmittedStatus?: () => { to?: string; payload: SystemStatusData }[];
};

export const createMockSystemGateway = (): MockSystemGateway => {
    const emitted: { to?: string; payload: SystemStatusData }[] = [];

    const mock: MockSystemGateway = {
        notifySystemStatus: jest.fn().mockImplementation((payload: SystemStatusData) => {
            emitted.push({ payload });
        }),

        notifySingleClient: jest.fn().mockImplementation((clientId: string, payload: SystemStatusData) => {
            emitted.push({ to: clientId, payload });
        }),

        afterInit: jest.fn(),

        handleConnection: jest.fn(),

        handleDisconnect: jest.fn(),

        getEmittedStatus: () => emitted,
    };

    return mock;
};
