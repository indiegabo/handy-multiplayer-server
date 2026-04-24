import {
    CanActivate,
    ExecutionContext,
    Injectable,
    ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class TwitchOauthConfiguredGuard implements CanActivate {
    constructor(private readonly config: ConfigService) { }

    canActivate(_context: ExecutionContext): boolean {
        const clientId = (this.config.get<string>("TWITCH_APP_ID") ?? "").trim();
        const clientSecret =
            (this.config.get<string>("TWITCH_APP_SECRET") ?? "").trim();
        const callbackUrl =
            (this.config.get<string>("TWITCH_CALLBACK_URL") ?? "").trim();

        if (!clientId || !clientSecret || !callbackUrl) {
            throw new ServiceUnavailableException(
                "Twitch OAuth is not configured on this environment.",
            );
        }

        return true;
    }
}
