import { DevelopmentVersionsFacade } from
    '@src/modules/sg/modules/games/modules/development/facades/development-versions.facade';

/**
 * Type representing a mocked DevelopmentVersionsFacade instance.
 * All methods are Jest mock functions for testing purposes.
 */
export type MockDevelopmentVersionsFacade = {
    [K in keyof DevelopmentVersionsFacade]: jest.MockedFunction<DevelopmentVersionsFacade[K]>;
};

/**
 * Factory function to create a mock DevelopmentVersionsFacade instance.
 * Provides default Jest mock implementations for all facade methods.
 *
 * Usage:
 * ```typescript
 * const mockFacade = createMockDevelopmentVersionsFacade();
 * mockFacade.getCurrentVersion.mockResolvedValue(versionDTO);
 * ```
 *
 * @returns {MockDevelopmentVersionsFacade} Mocked facade with Jest functions.
 */
export function createMockDevelopmentVersionsFacade(): MockDevelopmentVersionsFacade {
    return {
        getCurrentVersion: jest.fn(),
        getLatestVersion: jest.fn(),
        getVersionInPreparation: jest.fn(),
        getVersionUnderDevelopment: jest.fn(),
        getVersionMetadata: jest.fn(),
        acknowledgeVersion: jest.fn(),
        startNewVersion: jest.fn(),
        cancelVersionInPreparation: jest.fn(),
        sendToHomologation: jest.fn(),
    } as any;
}
