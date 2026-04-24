import { Injectable, UnauthorizedException } from "@nestjs/common";
import { User } from "@hms-module/modules/users/entities/user.entity";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { InternalOAuthError } from "passport-oauth2";
import { AxiosError } from "axios";
import { ConfigService } from "@nestjs/config";
import { BetterLogger } from "@hms-module/modules/better-logger/better-logger.service";
import { UserAuthProviderRepository } from "@hms-module/modules/users/repositories/user-auth-provider.repository";
import { TwitchAuthProviderData } from "../../../twitch/twitch-auth-provider-data";

@Injectable()
export class GetTwitchAuthDataUseCase {
    constructor(
        private readonly providers: UserAuthProviderRepository,
        private readonly http: HttpService,
        private readonly config: ConfigService,
        private readonly logger: BetterLogger,
    ) { }

    async execute(user: User): Promise<TwitchAuthProviderData> {
        const twitchProvider = await this.providers
            .createQueryBuilder("provider")
            .leftJoinAndSelect("provider.user", "user")
            .where("provider.user_id = :userId", { userId: user.id })
            .andWhere("LOWER(provider.provider) = LOWER(:provider)", { provider: "twitch" })
            .getOne();

        if (!twitchProvider) {
            throw new UnauthorizedException("User must login with Twitch");
        }

        const providerData = twitchProvider.data as any;
        const { credentials, profile } = providerData || {};
        if (!credentials || !profile) {
            throw new Error("Twitch provider data missing required fields");
        }

        const tokenExpired = await this.isTwitchTokenExpired(credentials.access_token);
        if (!tokenExpired) {
            return { credentials, profile };
        }

        try {
            const { accessToken, refreshToken, expiresIn } =
                await this.refreshTwitchToken(credentials.refresh_token);

            const updatedCredentials = {
                ...credentials,
                access_token: accessToken,
                refresh_token: refreshToken || credentials.refresh_token,
                expires_in: expiresIn,
            };

            await this.providers.update(
                { id: twitchProvider.id },
                { data: { credentials: updatedCredentials, profile } }
            );

            return { credentials: updatedCredentials, profile };
        } catch (error) {
            this.logger.error("Error refreshing Twitch token", error);
            if (error instanceof InternalOAuthError) throw error;
            throw new Error("Error refreshing Twitch token. User must login again.");
        }
    }

    // ===== helpers (self-contained) =====

    private async isTwitchTokenExpired(accessToken: string): Promise<boolean> {
        try {
            const response = await firstValueFrom(
                this.http.get<{ expires_in: number }>(
                    "https://id.twitch.tv/oauth2/validate",
                    { headers: { Authorization: `OAuth ${accessToken}` } },
                )
            );
            const expiresIn = response.data.expires_in;
            return expiresIn < 300;
        } catch (error) {
            const axiosError = error as AxiosError;

            if (axiosError?.isAxiosError) {
                this.logger.warn("Failed to validate Twitch token. Assuming expired.", [
                    `Status: ${axiosError.response?.status}`,
                    `Data: ${JSON.stringify(axiosError.response?.data)}`,
                    `Headers: ${JSON.stringify(axiosError.response?.headers)}`,
                ]);
            } else {
                this.logger.warn(
                    "Failed to validate Twitch token. Assuming expired.",
                    String(error),
                );
            }

            return true;
        }
    }

    private async refreshTwitchToken(
        refreshToken: string
    ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number; }> {
        const twitchUrl = "https://id.twitch.tv/oauth2/token";
        const payload = new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: refreshToken,
            client_id: this.config.get("TWITCH_APP_ID"),
            client_secret: this.config.get("TWITCH_APP_SECRET"),
        });

        try {
            const response = await firstValueFrom(
                this.http.post(twitchUrl, payload, {
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                })
            );
            const { access_token, refresh_token, expires_in } = response.data;
            return {
                accessToken: access_token,
                refreshToken: refresh_token || refreshToken,
                expiresIn: expires_in,
            };
        } catch (error) {
            const axiosError = error as AxiosError;
            this.logger.error("Twitch refresh failed", [
                `Status: ${axiosError.response?.status}`,
                `Data: ${JSON.stringify(axiosError.response?.data)}`,
                `Headers: ${JSON.stringify(axiosError.response?.headers)}`,
            ]);
            throw new InternalOAuthError("Failed to refresh Twitch token", axiosError);
        }
    }
}
