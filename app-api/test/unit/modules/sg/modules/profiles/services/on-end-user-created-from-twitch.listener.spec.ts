import sharp from 'sharp';
import { OnEndUserCreatedFromTwitchListener } from '@src/modules/sg/modules/profiles/services/on-end-user-created-from-twitch.listener';
import { ProfileRepository } from '@src/modules/sg/core/repositories/profile.repository';
import { UsersRepository } from '@src/modules/hms/modules/users/repositories/users.repository';
import { StorageService } from '@src/modules/hms/modules/storage/services/storage.service';
import { MediaService } from '@src/modules/hms/modules/media/services/media.service';
import { ProfileRealtimeService } from '@src/modules/sg/modules/profiles/services/profile-realtime.service';

jest.mock('sharp', () => {
    const mocked = jest.fn(() => ({
        png: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('png-image')),
    }));

    return {
        __esModule: true,
        default: mocked,
    };
});

describe('OnEndUserCreatedFromTwitchListener', () => {
    let listener: OnEndUserCreatedFromTwitchListener;

    let profiles: jest.Mocked<ProfileRepository>;
    let usersRepo: jest.Mocked<UsersRepository>;
    let storage: jest.Mocked<StorageService>;
    let mediaService: jest.Mocked<MediaService>;
    let realtime: jest.Mocked<ProfileRealtimeService>;

    function toArrayBuffer(buffer: Buffer): ArrayBuffer {
        return buffer.buffer.slice(
            buffer.byteOffset,
            buffer.byteOffset + buffer.byteLength,
        ) as ArrayBuffer;
    }

    beforeEach(() => {
        profiles = {
            findByUserId: jest.fn(),
            save: jest.fn(),
        } as unknown as jest.Mocked<ProfileRepository>;

        usersRepo = {
            findById: jest.fn(),
        } as unknown as jest.Mocked<UsersRepository>;

        storage = {
            uploadBuffer: jest.fn().mockResolvedValue(undefined),
        } as unknown as jest.Mocked<StorageService>;

        mediaService = {
            finalizeUploadAndAttach: jest.fn().mockResolvedValue(undefined),
        } as unknown as jest.Mocked<MediaService>;

        realtime = {
            emitProfileChanged: jest.fn(),
        } as unknown as jest.Mocked<ProfileRealtimeService>;

        listener = new OnEndUserCreatedFromTwitchListener(
            profiles,
            usersRepo,
            storage,
            mediaService,
            realtime,
        );

        (global.fetch as any) = jest.fn();
    });

    it('creates SG profile and stores Twitch image as png', async () => {
        profiles.findByUserId.mockResolvedValue(null);
        usersRepo.findById.mockResolvedValue({
            id: 'user-1',
            display_name: 'Dragon Name',
            username: 'dragon',
        } as any);
        profiles.save.mockResolvedValue({
            id: 'profile-1',
            user_id: 'user-1',
            name: 'Dragon Name',
        } as any);

        const rawImage = Buffer.from('raw-image');
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            status: 200,
            arrayBuffer: jest.fn().mockResolvedValue(toArrayBuffer(rawImage)),
        });

        await listener.handle({
            userId: 'user-1',
            twitchUsername: 'dragon',
            twitchDisplayName: 'Dragon Name',
            twitchProfileImageUrl: 'https://cdn.twitch.test/avatar.jpg',
        });

        expect(profiles.save).toHaveBeenCalledWith(
            expect.objectContaining({
                user_id: 'user-1',
                name: 'Dragon Name',
            }),
        );
        expect(sharp as unknown as jest.Mock).toHaveBeenCalledWith(rawImage);

        expect(storage.uploadBuffer).toHaveBeenCalledWith(
            expect.stringMatching(/^public\/sg\/profiles\/profile-1\/profile\/.+\.png$/),
            Buffer.from('png-image'),
            'image/png',
        );

        expect(mediaService.finalizeUploadAndAttach).toHaveBeenCalledWith(
            expect.stringMatching(/^public\/sg\/profiles\/profile-1\/profile\/.+\.png$/),
            expect.objectContaining({
                mimetype: 'image/png',
                entity: {
                    type: 'SgProfile',
                    id: 'profile-1',
                    collection: 'profile',
                    asSingleton: true,
                },
            }),
        );

        expect(realtime.emitProfileChanged).toHaveBeenNthCalledWith(1, {
            userId: 'user-1',
            profileId: 'profile-1',
            reason: 'profile-created',
        });
        expect(realtime.emitProfileChanged).toHaveBeenNthCalledWith(2, {
            userId: 'user-1',
            profileId: 'profile-1',
            reason: 'profile-image-updated',
        });
    });

    it('skips sync when user cannot be found', async () => {
        profiles.findByUserId.mockResolvedValue(null);
        usersRepo.findById.mockResolvedValue(null);

        await listener.handle({
            userId: 'missing-user',
            twitchUsername: 'dragon',
            twitchDisplayName: 'Dragon Name',
            twitchProfileImageUrl: 'https://cdn.twitch.test/avatar.jpg',
        });

        expect(global.fetch).not.toHaveBeenCalled();
        expect(storage.uploadBuffer).not.toHaveBeenCalled();
        expect(mediaService.finalizeUploadAndAttach).not.toHaveBeenCalled();
        expect(realtime.emitProfileChanged).not.toHaveBeenCalled();
    });
});