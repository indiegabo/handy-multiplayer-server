import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, StrategyOptions } from "passport-oauth2";
import { ConfigService } from "@nestjs/config";
import { BetterLogger } from
    "@hms-module/modules/better-logger/better-logger.service";
import { TwitchProfile, TwitchProfileResponse } from "./twitch-profile";
import { TwitchPayload } from "./twitch.payload";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { AxiosError } from "axios";
import { ValidateOrCreateUserFromTwitchUseCase } from
    "../services/use-cases/twitch/validate-or-create-user-from-twitch.usecase";
import { User } from "@hms-module/modules/users/entities/user.entity";
import { AUTH_CONFIG } from "@src/config/hms/auth.config";

@Injectable()
export class TwitchStrategy extends PassportStrategy(Strategy, "twitch") {
    private readonly twitchAppId: string;

    // Cached configuration values.
    private readonly twitchClientId: string;
    private readonly twitchClientSecret: string;
    private readonly twitchCallbackUrl: string;
    private readonly twitchScopes: string[];

    constructor(
        private readonly httpService: HttpService,
        private readonly config: ConfigService,
        private readonly logger: BetterLogger,
        private readonly validateOrCreate: ValidateOrCreateUserFromTwitchUseCase,
    ) {
        // Read once from ConfigService and cache.
        const clientId = (config.get<string>("TWITCH_APP_ID") ?? "").trim();
        const clientSecret =
            (config.get<string>("TWITCH_APP_SECRET") ?? "").trim();
        const callbackUrl =
            (config.get<string>("TWITCH_CALLBACK_URL") ?? "").trim();

        // Read scopes from AUTH_CONFIG (single source of truth).
        const scopes = AUTH_CONFIG.oauth?.twitch?.scopes ?? [];

        super({
            authorizationURL: "https://id.twitch.tv/oauth2/authorize",
            tokenURL: "https://id.twitch.tv/oauth2/token",
            clientID: clientId,
            clientSecret: clientSecret,
            callbackURL: callbackUrl,
            scope: scopes,
        } as StrategyOptions);

        this.twitchClientId = clientId;
        this.twitchClientSecret = clientSecret;
        this.twitchCallbackUrl = callbackUrl;
        this.twitchScopes = scopes;

        this.twitchAppId = clientId;
        this.logger.setContext(TwitchStrategy.name);

        // OAuth2 tuning for Twitch API.
        this._oauth2.setAccessTokenName("access_token");
        this._oauth2.useAuthorizationHeaderforGET(true);
    }

    /**
     * Passport validate hook:
     * - Ensures Twitch OAuth is properly configured (cached values).
     * - Fetches Twitch profile using the access token.
     * - Creates or updates local user and links Twitch provider.
     * - Returns User instance to be assigned to req.user.
     */
    async validate(
        accessToken: string,
        refreshToken: string,
    ): Promise<User> {
        try {
            // Configuration sanity check (fail fast).
            if (!this.twitchClientId
                || !this.twitchClientSecret
                || !this.twitchCallbackUrl) {
                this.logger.error("Twitch OAuth missing required env values.");
                throw new Error("Twitch OAuth is not configured.");
            }

            // Basic URL validation for callback (expects http/https).
            try {
                const parsed = new URL(this.twitchCallbackUrl);
                if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
                    throw new Error("Callback must use http/https.");
                }
            } catch (e) {
                this.logger.error("Invalid TWITCH_CALLBACK_URL.", String(e));
                throw new Error("Twitch OAuth callback URL is invalid.");
            }

            const profile = await this.fetchTwitchProfile(accessToken);

            const payload: TwitchPayload = {
                access_token: accessToken,
                refresh_token: refreshToken,
                profile,
            };

            const user = await this.validateOrCreate.execute(payload);
            return user;
        } catch (error) {
            this.logger.error(
                "Twitch validate failed",
                (error as Error)?.stack ?? String(error),
            );
            throw error;
        }
    }

    /**
     * Queries Twitch Helix API for the authenticated user profile.
     */
    private async fetchTwitchProfile(
        accessToken: string,
    ): Promise<TwitchProfile> {
        try {
            const response = await firstValueFrom(
                this.httpService.get<TwitchProfileResponse>(
                    "https://api.twitch.tv/helix/users",
                    {
                        headers: {
                            "Client-ID": this.twitchAppId,
                            "Authorization": `Bearer ${accessToken}`,
                        },
                    },
                ),
            );

            const profile = response.data?.data?.[0];
            if (!profile) {
                throw new Error("No Twitch profile data found");
            }

            return profile;
        } catch (error) {
            if ((error as AxiosError).isAxiosError) {
                const axiosError = error as AxiosError;
                this.logger.error("Twitch API request failed");
                this.logger.debug(axiosError);
            } else {
                this.logger.error(
                    "Unexpected error fetching Twitch profile",
                    (error as Error)?.stack ?? String(error),
                );
            }
            throw new Error("Failed to fetch Twitch profile from Twitch API");
        }
    }
}
