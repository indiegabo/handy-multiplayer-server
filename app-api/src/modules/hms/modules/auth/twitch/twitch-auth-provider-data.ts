import { TwitchCredentials } from "./twitch-credentials"
import { TwitchProfile } from "./twitch-profile"

export type TwitchAuthProviderData = {
    credentials: TwitchCredentials,
    profile: TwitchProfile,
}