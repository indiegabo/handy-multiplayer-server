/**
 * Factory function to create a mock GamesService instance.
 * Provides default implementations for all public methods that can be
 * overridden per test as needed.
 *
 * Used in public games controller E2E tests.
 */
export function createMockGamesService() {
    return {
        getAllGames: jest.fn(),
        getGameById: jest.fn(),
        getGameInstallationMetadata: jest.fn(),
        getCurrentVersion: jest.fn(),
        getWaitingForApprovalVersions: jest.fn(),
        getGameVersionBuildsByPlatform: jest.fn(),
    } as jest.Mocked<any>;
}

export type MockGamesService = ReturnType<typeof createMockGamesService>;
