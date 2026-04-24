import { VersionsFacade } from '@src/modules/sg/modules/games/modules/backoffice/facades/versions.facade';

/**
 * Factory function to create a mock VersionsFacade instance.
 * Provides default jest.fn() implementations for all methods.
 * Can be configured per test by overriding specific methods.
 *
 * @returns {jest.Mocked<VersionsFacade>} Mocked VersionsFacade with jest functions.
 */
export function createMockVersionsFacade(): jest.Mocked<VersionsFacade> {
    return {
        getGameVersions: jest.fn(),
        getVersionMetadata: jest.fn(),
        setCurrentVersion: jest.fn(),
        setVersionAsReady: jest.fn(),
        setVersionAsRejected: jest.fn(),
        setVersionAsUnderDevelopment: jest.fn(),
        setVersionAsCanceled: jest.fn(),
        releaseVersion: jest.fn(),
        releaseReadyVersions: jest.fn(),
        createGameVersion: jest.fn(),
        setVersionRuntimePlatforms: jest.fn(),
        getVersionRuntimePlatforms: jest.fn(),
    } as unknown as jest.Mocked<VersionsFacade>;
}

/**
 * Type alias for mocked VersionsFacade for convenience in tests.
 */
export type MockVersionsFacade = jest.Mocked<VersionsFacade>;
