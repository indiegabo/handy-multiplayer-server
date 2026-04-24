import { CrowdActionsFacade } from '@src/modules/sg/modules/games/modules/backoffice/facades/crowd-actions.facade';

/**
 * Factory function to create a mock CrowdActionsFacade instance.
 * Provides default jest.fn() implementations for all methods.
 * Can be configured per test by overriding specific methods.
 *
 * @returns {jest.Mocked<CrowdActionsFacade>} Mocked CrowdActionsFacade.
 */
export function createMockCrowdActionsFacade(): jest.Mocked<CrowdActionsFacade> {
    return {
        getVersionCrowdActions: jest.fn(),
        updateVersionCrowdActions: jest.fn(),
        updateVersionCrowdMappings: jest.fn(),
        updateVersionCrowd: jest.fn(),
    } as unknown as jest.Mocked<CrowdActionsFacade>;
}

/**
 * Type alias for mocked CrowdActionsFacade for convenience in tests.
 */
export type MockCrowdActionsFacade = jest.Mocked<CrowdActionsFacade>;
