import { ApiResponse } from "@hms/shared-types/hms";

export const responser = {
    data<T>(data: T, meta?: Record<string, any>): ApiResponse<T> {
        return {
            data,
            ...(meta !== undefined ? { meta } : {}),
        };
    },
    success(meta?: Record<string, any>): ApiResponse<boolean> {
        return {
            data: true,
            ...(meta !== undefined ? { meta } : {}),
        };
    },
    failure(message: string, meta?: Record<string, any>): ApiResponse<boolean> {
        return {
            data: false,
            ...(meta !== undefined ? { meta } : {}),
        };
    },
};
