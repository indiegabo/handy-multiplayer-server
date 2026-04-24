import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from "@nestjs/common";
import { ApiResponse, PaginatedApiResponse, PaginatedResult } from "@hms/shared-types/hms";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

/**
 * Type guard: checks if value looks like a PaginatedResult.
 */
function isPaginatedResult<T>(
    value: any,
): value is PaginatedResult<T> {
    return !!value
        && typeof value === "object"
        && Array.isArray(value.items)
        && value.meta
        && typeof value.meta === "object"
        && typeof value.meta.total === "number"
        && typeof value.meta.page === "number";
}

/**
 * Type guard: checks if value already is an ApiResponse.
 */
function isApiResponse<T>(
    value: any,
): value is ApiResponse<T> | PaginatedApiResponse<T> {
    return !!value
        && typeof value === "object"
        && "data" in value;
}

/**
 * Ensures every controller returns ApiResponse.
 * - If already ApiResponse: passthrough.
 * - If PaginatedResult: wrap as PaginatedApiResponse.
 * - Else: wrap as ApiResponse simple.
 */
@Injectable()
export class ApiResponseInterceptor
    implements NestInterceptor {
    intercept(
        _ctx: ExecutionContext,
        next: CallHandler,
    ): Observable<any> {
        return next.handle().pipe(
            map((body: any) => {
                if (isApiResponse(body)) {
                    return body;
                }
                if (isPaginatedResult(body)) {
                    return {
                        data: body.items,
                        meta: body.meta,
                    } as PaginatedApiResponse<any>;
                }
                return {
                    data: body,
                    meta: null,
                } as ApiResponse<any>;
            }),
        );
    }
}
