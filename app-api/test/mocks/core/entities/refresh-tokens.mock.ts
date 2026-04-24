import { RefreshToken } from
    "@hms-module/modules/auth/entities/refresh-token.entity";
import { v4 as uuid } from "uuid";

export const REFRESH_TOKENS_MOCK: RefreshToken[] = (() => {
    const token1 = new RefreshToken();
    token1.id = uuid();
    token1.token = "valid-token-123";
    token1.user_id = uuid();
    token1.user_type = "end_user";
    token1.user = null;
    token1.admin = null;
    token1.device_info = { os: "Windows", browser: "Chrome" };
    token1.ip_address = "192.168.0.1";
    token1.is_revoked = false;
    token1.last_used_at = new Date("2025-05-30T10:00:00Z");
    token1.expires_at = new Date("2025-06-05T10:00:00Z");
    token1.refresh_count = 0;
    token1.created_at = new Date("2025-05-30T09:00:00Z");
    token1.updated_at = new Date("2025-05-30T09:00:00Z");

    const token2 = new RefreshToken();
    token2.id = uuid();
    token2.token = "expired-token-456";
    token2.user_id = uuid();
    token2.user_type = "end_user";
    token2.user = null;
    token2.admin = null;
    token2.device_info = { os: "Linux", browser: "Firefox" };
    token2.ip_address = "10.0.0.2";
    token2.is_revoked = false;
    token2.last_used_at = new Date("2025-05-20T12:00:00Z");
    token2.expires_at = new Date("2025-05-25T12:00:00Z"); // expired
    token2.refresh_count = 5;
    token2.created_at = new Date("2025-05-20T11:00:00Z");
    token2.updated_at = new Date("2025-05-20T11:00:00Z");

    const token3 = new RefreshToken();
    token3.id = uuid();
    token3.token = "another-valid-token-789";
    token3.user_id = uuid();
    token3.user_type = "admin";
    token3.user = null;
    token3.admin = null;
    token3.device_info = { os: "MacOS", browser: "Safari" };
    token3.ip_address = "172.16.0.3";
    token3.is_revoked = false;
    token3.last_used_at = new Date("2025-06-01T15:30:00Z");
    token3.expires_at = new Date("2025-06-10T15:30:00Z");
    token3.refresh_count = 1;
    token3.created_at = new Date("2025-06-01T14:30:00Z");
    token3.updated_at = new Date("2025-06-01T14:30:00Z");

    return [token1, token2, token3];
})();
