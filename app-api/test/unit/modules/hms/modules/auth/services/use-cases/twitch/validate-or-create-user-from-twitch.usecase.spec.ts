import { EventEmitter2 } from '@nestjs/event-emitter';
import { ValidateOrCreateUserFromTwitchUseCase } from '@src/modules/hms/modules/auth/services/use-cases/twitch/validate-or-create-user-from-twitch.usecase';
import { UsersService } from '@src/modules/hms/modules/users/services/users.service';
import { UserAuthProviderRepository } from '@src/modules/hms/modules/users/repositories/user-auth-provider.repository';
import { END_USER_CREATED_FROM_TWITCH_EVENT } from '@src/modules/hms/modules/auth/events/end-user-created-from-twitch.event';

describe('ValidateOrCreateUserFromTwitchUseCase', () => {
    let useCase: ValidateOrCreateUserFromTwitchUseCase;

    let users: jest.Mocked<UsersService>;
    let providers: jest.Mocked<UserAuthProviderRepository>;
    let emitter: jest.Mocked<EventEmitter2>;

    beforeEach(() => {
        users = {
            findEndUserByEmail: jest.fn(),
            createUser: jest.fn(),
            findByUsername: jest.fn(),
            claimUsername: jest.fn(),
        } as unknown as jest.Mocked<UsersService>;

        providers = {
            findOne: jest.fn(),
            remove: jest.fn(),
            save: jest.fn(),
        } as unknown as jest.Mocked<UserAuthProviderRepository>;

        emitter = {
            emit: jest.fn(),
        } as unknown as jest.Mocked<EventEmitter2>;

        useCase = new ValidateOrCreateUserFromTwitchUseCase(
            users,
            providers,
            emitter,
        );
    });

    it('emits event when a new user is created from Twitch', async () => {
        users.findEndUserByEmail.mockResolvedValue(null);
        providers.findOne.mockResolvedValue(null);
        users.createUser.mockResolvedValue({
            id: 'user-1',
            auth_providers: [],
        } as any);
        users.findByUsername.mockResolvedValue(null);
        providers.save.mockImplementation(async (provider: any) => provider);

        const payload = {
            access_token: 'access',
            refresh_token: 'refresh',
            profile: {
                provider: 'twitch',
                id: 'tw-1',
                login: 'dragon',
                display_name: 'Dragon User',
                broadcaster_type: '',
                description: '',
                profile_image_url: 'https://cdn.twitch.test/avatar.png',
                offline_image_url: 'https://cdn.twitch.test/offline.png',
                view_count: 10,
                email: 'dragon@example.com',
                created_at: '2026-01-01T00:00:00.000Z',
            },
        };

        const result = await useCase.execute(payload as any);

        expect(result.id).toBe('user-1');
        expect(users.createUser).toHaveBeenCalledWith({
            email: 'dragon@example.com',
        });
        expect(users.claimUsername).toHaveBeenCalledWith('user-1', 'dragon');

        expect(emitter.emit).toHaveBeenCalledWith(
            END_USER_CREATED_FROM_TWITCH_EVENT,
            {
                userId: 'user-1',
                twitchUsername: 'dragon',
                twitchDisplayName: 'Dragon User',
                twitchProfileImageUrl: 'https://cdn.twitch.test/avatar.png',
            },
        );
    });

    it('emits event when an existing user links Twitch for the first time', async () => {
        users.findEndUserByEmail.mockResolvedValue({
            id: 'user-1',
            auth_providers: [],
        } as any);
        providers.findOne.mockResolvedValue(null);
        providers.save.mockImplementation(async (provider: any) => provider);

        const payload = {
            access_token: 'access',
            refresh_token: 'refresh',
            profile: {
                provider: 'twitch',
                id: 'tw-1',
                login: 'dragon',
                display_name: 'Dragon User',
                broadcaster_type: '',
                description: '',
                profile_image_url: 'https://cdn.twitch.test/avatar.png',
                offline_image_url: 'https://cdn.twitch.test/offline.png',
                view_count: 10,
                email: 'dragon@example.com',
                created_at: '2026-01-01T00:00:00.000Z',
            },
        };

        await useCase.execute(payload as any);

        expect(users.createUser).not.toHaveBeenCalled();
        expect(emitter.emit).toHaveBeenCalledWith(
            END_USER_CREATED_FROM_TWITCH_EVENT,
            {
                userId: 'user-1',
                twitchUsername: 'dragon',
                twitchDisplayName: 'Dragon User',
                twitchProfileImageUrl: 'https://cdn.twitch.test/avatar.png',
            },
        );
    });

    it('does not emit event when user already has Twitch provider', async () => {
        users.findEndUserByEmail.mockResolvedValue({
            id: 'user-1',
            auth_providers: [],
        } as any);
        providers.findOne.mockResolvedValue({
            id: 'provider-1',
            provider: 'twitch',
            user_id: 'user-1',
            user_type: 'end_user',
        } as any);
        providers.save.mockImplementation(async (provider: any) => provider);

        const payload = {
            access_token: 'access',
            refresh_token: 'refresh',
            profile: {
                provider: 'twitch',
                id: 'tw-1',
                login: 'dragon',
                display_name: 'Dragon User',
                broadcaster_type: '',
                description: '',
                profile_image_url: 'https://cdn.twitch.test/avatar.png',
                offline_image_url: 'https://cdn.twitch.test/offline.png',
                view_count: 10,
                email: 'dragon@example.com',
                created_at: '2026-01-01T00:00:00.000Z',
            },
        };

        await useCase.execute(payload as any);

        expect(providers.remove).toHaveBeenCalledWith(
            expect.objectContaining({ id: 'provider-1' }),
        );
        expect(emitter.emit).not.toHaveBeenCalled();
    });
});