import { AdminUserAuthInfoDto, UserAuthInfoDto } from "@hms/shared-types/hms";
import { DeviceInfo } from "../types/device-info.type"

export type AuthenticatedRequest = DeviceRequest & {
    authenticated?: UserAuthInfoDto | AdminUserAuthInfoDto;
}

export type DeviceRequest = {
    deviceInfo?: DeviceInfo
}

