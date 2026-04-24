// src/types/express.d.ts
import { User as HMSUser } from "@hms-module/modules/users/entities/user.entity";
import { AdminUser } from "@hms-module/modules/users/entities/admin-user.entity";
import { DeviceInfo } from "@hms-module/modules/auth/types/device-info.type";

/**
 * Extends Express Request with authenticated and deviceInfo fields.
 * Make sure this file is included in tsconfig (include/typeRoots).
 */
declare global {
    namespace Express {
        interface Request {
            authenticated?: HMSUser | AdminUser;
            deviceInfo?: DeviceInfo;
        }
    }
}

export { };
