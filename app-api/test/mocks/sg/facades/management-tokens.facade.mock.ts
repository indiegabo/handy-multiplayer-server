import { ManagementTokensFacade } from '@src/modules/sg/modules/games/modules/backoffice/facades/management-tokens.facade';

/**
 * Factory function to create a mock ManagementTokensFacade instance.
 * Provides default jest.fn() implementations for all methods.
 * Can be configured per test by overriding specific methods.
 *
 * @returns {jest.Mocked<ManagementTokensFacade>} Mocked ManagementTokensFacade.
 */
export function createMockManagementTokensFacade(): jest.Mocked<ManagementTokensFacade> {
    return {
        getManagementTokens: jest.fn(),
        createManagementToken: jest.fn(),
        revokeAllManagementTokens: jest.fn(),
        destroyAllManagementTokens: jest.fn(),
        revokeManagementToken: jest.fn(),
        destroyManagementToken: jest.fn(),
    } as unknown as jest.Mocked<ManagementTokensFacade>;
}

/**
 * Type alias for mocked ManagementTokensFacade for convenience in tests.
 */
export type MockManagementTokensFacade = jest.Mocked<ManagementTokensFacade>;
