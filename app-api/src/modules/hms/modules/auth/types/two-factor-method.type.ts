import { DeviceInfo } from "./device-info.type";

export enum TwoFactorMethod {
    EMAIL = 'email',
    AUTHENTICATOR = 'authenticator',
    SMS = 'sms'
}

export type StoredTwoFactorData = {
    user_id: string;
    user_type: 'end_user' | 'admin';
    device_info: DeviceInfo;
    provider: string;
    current_method: TwoFactorMethod;
    ott?: string;
}