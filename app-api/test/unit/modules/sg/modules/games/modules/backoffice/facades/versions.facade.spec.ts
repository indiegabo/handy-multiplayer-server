import { ConnectionPlatform } from '@hms/shared-types';
import { VersionsFacade } from '@src/modules/sg/modules/games/modules/backoffice/facades/versions.facade';

describe('VersionsFacade', () => {
    let facade: VersionsFacade;
    let updateVersionRuntimePlatformsUseCase: { execute: jest.Mock };
    let updateVersionRuntimeInitSettingsUseCase: { execute: jest.Mock };
    let getVersionInitSettingsUseCase: { execute: jest.Mock };
    let getVersionPlatformsUseCase: { execute: jest.Mock };

    beforeEach(() => {
        updateVersionRuntimePlatformsUseCase = {
            execute: jest.fn(),
        };

        updateVersionRuntimeInitSettingsUseCase = {
            execute: jest.fn(),
        };

        getVersionInitSettingsUseCase = {
            execute: jest.fn(),
        };

        getVersionPlatformsUseCase = {
            execute: jest.fn(),
        };

        facade = new VersionsFacade(
            { execute: jest.fn() } as any,
            { execute: jest.fn() } as any,
            { execute: jest.fn() } as any,
            { execute: jest.fn() } as any,
            { execute: jest.fn() } as any,
            { execute: jest.fn() } as any,
            { execute: jest.fn() } as any,
            { execute: jest.fn() } as any,
            { execute: jest.fn() } as any,
            { execute: jest.fn() } as any,
            { execute: jest.fn() } as any,
            updateVersionRuntimePlatformsUseCase as any,
            updateVersionRuntimeInitSettingsUseCase as any,
            getVersionInitSettingsUseCase as any,
            getVersionPlatformsUseCase as any,
        );
    });

    it('should forward platform update to use case', async () => {
        const gameId = '11111111-1111-4111-8111-111111111111';
        const versionId = '22222222-2222-4222-8222-222222222222';
        const platforms = [ConnectionPlatform.Twitch];

        updateVersionRuntimePlatformsUseCase.execute.mockResolvedValue({
            version_id: versionId,
            platforms,
        });

        const result = await facade.setVersionRuntimePlatforms(
            gameId,
            versionId,
            platforms,
        );

        expect(updateVersionRuntimePlatformsUseCase.execute).toHaveBeenCalledWith(
            gameId,
            versionId,
            platforms,
        );
        expect(result).toEqual({
            version_id: versionId,
            platforms,
        });
    });

    it('should forward init settings update to use case', async () => {
        const gameId = '11111111-1111-4111-8111-111111111111';
        const versionId = '22222222-2222-4222-8222-222222222222';
        const initSettings = [
            {
                metadata: {
                    id: 'default',
                    order: 1,
                    display_name: 'Default',
                },
                fields: {
                    enabled: true,
                },
            },
        ];

        updateVersionRuntimeInitSettingsUseCase.execute.mockResolvedValue({
            version_id: versionId,
            init_settings: initSettings,
        });

        const result = await facade.setVersionRuntimeInitSettings(
            gameId,
            versionId,
            initSettings,
        );

        expect(
            updateVersionRuntimeInitSettingsUseCase.execute,
        ).toHaveBeenCalledWith(
            gameId,
            versionId,
            initSettings,
        );
        expect(result).toEqual({
            version_id: versionId,
            init_settings: initSettings,
        });
    });

    it('should retrieve runtime init settings by version id', async () => {
        const versionId = '22222222-2222-4222-8222-222222222222';
        const initSettings = [
            {
                metadata: {
                    id: 'default',
                    order: 1,
                    display_name: 'Default',
                },
                fields: {
                    enabled: true,
                },
            },
        ];

        getVersionInitSettingsUseCase.execute.mockResolvedValue(initSettings);

        const result = await facade.getVersionRuntimeInitSettings(versionId);

        expect(getVersionInitSettingsUseCase.execute).toHaveBeenCalledWith(
            versionId,
        );
        expect(result).toEqual(initSettings);
    });

    it('should retrieve runtime platforms by version id', async () => {
        const versionId = '22222222-2222-4222-8222-222222222222';
        const platforms = [
            ConnectionPlatform.Twitch,
            ConnectionPlatform.Youtube,
        ];

        getVersionPlatformsUseCase.execute.mockResolvedValue(platforms);

        const result = await facade.getVersionRuntimePlatforms(versionId);

        expect(getVersionPlatformsUseCase.execute).toHaveBeenCalledWith(versionId);
        expect(result).toEqual(platforms);
    });
});
