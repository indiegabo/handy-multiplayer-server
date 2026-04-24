import { GamesFacade } from '@src/modules/sg/modules/games/modules/backoffice/facades/games.facade';

/**
 * Factory function to create a mock GamesFacade instance.
 * Provides default jest.fn() implementations for all methods.
 * Can be configured per test by overriding specific methods.
 *
 * @returns {jest.Mocked<GamesFacade>} Mocked GamesFacade with jest functions.
 */
export function createMockGamesFacade(): jest.Mocked<GamesFacade> {
    return {
        listGames: jest.fn(),
        createGame: jest.fn(),
        updateGame: jest.fn(),
        getGameById: jest.fn(),
    } as unknown as jest.Mocked<GamesFacade>;
}

/**
 * Type alias for mocked GamesFacade for convenience in tests.
 */
export type MockGamesFacade = jest.Mocked<GamesFacade>;
