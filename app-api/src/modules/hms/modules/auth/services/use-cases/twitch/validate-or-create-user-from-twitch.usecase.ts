import { Injectable } from '@nestjs/common';
import { UsersService } from
    '@hms-module/modules/users/services/users.service';
import { User } from
    '@hms-module/modules/users/entities/user.entity';
import { UserAuthProvider } from
    '@hms-module/modules/users/entities/user-auth-provider.entity';
import { UserAuthProviderRepository } from
    '@hms-module/modules/users/repositories/user-auth-provider.repository';
import { TwitchPayload } from '../../../twitch/twitch.payload';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
    END_USER_CREATED_FROM_TWITCH_EVENT,
    EndUserCreatedFromTwitchEvent,
} from '../../../events/end-user-created-from-twitch.event';

@Injectable()
export class ValidateOrCreateUserFromTwitchUseCase {
    constructor(
        private readonly users: UsersService,
        private readonly providers: UserAuthProviderRepository,
        private readonly emitter: EventEmitter2,
    ) { }

    /**
     * Ensures a local user exists for the Twitch account and
     * links the Twitch auth provider with fresh credentials.
     */
    async execute(payload: TwitchPayload): Promise<User> {
        const profile = payload.profile;
        const existing = await this.users.findEndUserByEmail(profile.email);

        const user = existing
            ? existing
            : await this.users.createUser({ email: profile.email });

        const existingProvider = await this.providers.findOne({
            where: {
                user_id: user.id,
                user_type: 'end_user',
                provider: 'twitch',
            },
        });

        // Attempts to claim Twitch login as username for new users.
        if (!existing) {
            const usernameTaken = await this.users.findByUsername(profile.login);
            if (!usernameTaken) {
                await this.users.claimUsername(user.id, profile.login);
            }
        }

        // Removes old Twitch provider for idempotency.
        if (existingProvider) {
            await this.providers.remove(existingProvider);
        }

        // Persists new provider with latest tokens and profile.
        const newProvider = new UserAuthProvider();
        newProvider.user = user;
        newProvider.provider = 'twitch';
        newProvider.data = {
            credentials: {
                access_token: payload.access_token,
                refresh_token: payload.refresh_token,
            },
            profile: payload.profile,
        };

        await this.providers.save(newProvider);

        if (!user.auth_providers) user.auth_providers = [];
        user.auth_providers.push(newProvider);

        if (!existingProvider && profile.profile_image_url) {
            const eventPayload: EndUserCreatedFromTwitchEvent = {
                userId: user.id,
                twitchUsername: profile.login,
                twitchDisplayName: profile.display_name,
                twitchProfileImageUrl: profile.profile_image_url,
            };

            this.emitter.emit(
                END_USER_CREATED_FROM_TWITCH_EVENT,
                eventPayload,
            );
        }

        return user;
    }
}
