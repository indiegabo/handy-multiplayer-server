import { Injectable } from "@nestjs/common";
import { TokenService } from "../token.service";
import { RefreshTokenResponseDto } from "@hms/shared-types/hms";
import { DeviceInfo } from "../../types/device-info.type";

/**
 * Use case for refreshing an access token using a refresh token.
 * Thin orchestration over TokenService.
 */
@Injectable()
export class RefreshUseCase {
    constructor(
        private readonly tokens: TokenService,
    ) { }

    async execute(
        token: string,
        deviceInfo?: DeviceInfo,
    ): Promise<RefreshTokenResponseDto> {
        return this.tokens.refresh(token, deviceInfo);
    }
}
