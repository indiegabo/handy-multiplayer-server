import { UserAuthProvider } from "@hms-module/modules/users/entities/user-auth-provider.entity";


/**
 * Fixed UUIDs for stable test data.
 */
export const MOCK_USER_ID_1 =
    "11111111-1111-4111-8111-111111111111";

export const MOCK_USER_AUTH_PROVIDER_ID_1 =
    "aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1";

/**
 * Helper to create a real class instance so prototype methods exist.
 */
function makeAuthProvider(init: {
    id: string;
    user_id: string;
    provider: string;
    data: Record<string, unknown>;
}): UserAuthProvider {
    const now = new Date();

    return Object.assign(new UserAuthProvider(), {
        id: init.id,
        user_id: init.user_id,
        provider: init.provider,
        data: init.data,
        created_at: now,
        updated_at: now,
        user: null,
    });
}

export const USER_AUTH_PROVIDERS_MOCK: UserAuthProvider[] = [
    makeAuthProvider({
        id: MOCK_USER_AUTH_PROVIDER_ID_1,
        user_id: MOCK_USER_ID_1,
        provider: "twitch",
        data: {
            credentials: {
                access_token: "mockAccessToken",
                refresh_token: "mockRefreshToken",
            },
            profile: {
                provider: "twitch",
                id: "mockTwitchUserId",
                login: "mockTwitchUsername",
                display_name: "Mock Twitch User",
                broadcaster_type: "",
                description: "",
                profile_image_url: "",
                offline_image_url: "",
                view_count: 0,
                email: "mockTwitchEmail@example.com",
                created_at: new Date().toISOString(),
            },
        },
    }),
];
