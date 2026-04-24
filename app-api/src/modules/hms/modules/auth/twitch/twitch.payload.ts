import { TwitchProfile } from "./twitch-profile";

export type TwitchPayload = {
    access_token: string;
    refresh_token: string;
    profile: TwitchProfile;
}