import { jest } from '@jest/globals';
import { GameBuildPlatform } from '@hms/shared-types';
import { PresignedURLDTO } from '@hms-module/modules/storage/dto/presigned-url.dto';
import { LAUNCHER_MESSAGES, LauncherService } from '@src/modules/sg/modules/launcher/services/launcher.service';
import { LauncherBuildMetadata } from '@src/modules/sg/modules/launcher/types/requests-dtos';

export type MockLauncherService = Partial<Record<keyof LauncherService, jest.Mock>> & {
    _setMockBuilds?: (builds: LauncherBuildMetadata[]) => void;
    _setMockPresignedUrl?: (url: string) => void;
    _getLastRequestedChannel?: () => string | null;
    _getLastRequestedPlatform?: () => GameBuildPlatform | null;
};

export const createMockLauncherService = (): MockLauncherService => {
    let mockBuilds: LauncherBuildMetadata[] = [];
    let mockPresignedUrl: string = 'https://mocked-presigned-url.com/file.exe';
    let lastRequestedChannel: string | null = null;
    let lastRequestedPlatform: GameBuildPlatform | null = null;

    const mockService: MockLauncherService = {
        generateLatestVersionDownload: jest.fn().mockImplementation(async (channel: string, platform: GameBuildPlatform): Promise<PresignedURLDTO> => {
            lastRequestedChannel = channel;
            lastRequestedPlatform = platform;

            if (!['alpha', 'beta', 'latest'].includes(channel)) {
                throw new Error(LAUNCHER_MESSAGES.INVALID_CHANNEL);
            }

            if (!Object.values(GameBuildPlatform).includes(platform)) {
                throw new Error(LAUNCHER_MESSAGES.INVALID_PLATFORM);
            }

            return { url: mockPresignedUrl };
        }),

        listBuilds: jest.fn().mockImplementation(async (
            channel: string,
            platform: GameBuildPlatform,
            limit: number = 5
        ): Promise<LauncherBuildMetadata[]> => {
            lastRequestedChannel = channel;
            lastRequestedPlatform = platform;

            if (!['alpha', 'beta', 'latest'].includes(channel)) {
                throw new Error(LAUNCHER_MESSAGES.INVALID_CHANNEL);
            }

            if (!Object.values(GameBuildPlatform).includes(platform)) {
                throw new Error(LAUNCHER_MESSAGES.INVALID_PLATFORM);
            }

            return mockBuilds.slice(0, limit);
        }),

        _setMockBuilds: (builds: LauncherBuildMetadata[]) => {
            mockBuilds = [...builds];
        },

        _setMockPresignedUrl: (url: string) => {
            mockPresignedUrl = url;
        },

        _getLastRequestedChannel: () => lastRequestedChannel,

        _getLastRequestedPlatform: () => lastRequestedPlatform,
    };

    return mockService;
};
