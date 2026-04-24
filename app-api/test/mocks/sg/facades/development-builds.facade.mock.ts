import { DevelopmentBuildsFacade } from
    '@src/modules/sg/modules/games/modules/development/facades/development-builds.facade';

/**
 * Type representing a mocked DevelopmentBuildsFacade instance.
 * All methods are Jest mock functions for testing purposes.
 */
export type MockDevelopmentBuildsFacade = {
    [K in keyof DevelopmentBuildsFacade]: jest.MockedFunction<DevelopmentBuildsFacade[K]>;
};

/**
 * Factory function to create a mock DevelopmentBuildsFacade instance.
 * Provides default Jest mock implementations for all facade methods.
 *
 * Usage:
 * ```typescript
 * const mockFacade = createMockDevelopmentBuildsFacade();
 * mockFacade.startBuildUpload.mockResolvedValue(uploadResponse);
 * ```
 *
 * @returns {MockDevelopmentBuildsFacade} Mocked facade with Jest functions.
 */
export function createMockDevelopmentBuildsFacade(): MockDevelopmentBuildsFacade {
    return {
        startBuildUpload: jest.fn(),
        confirmBuildUpload: jest.fn(),
        generateInstallationMetadata: jest.fn(),
    } as any;
}
