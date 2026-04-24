import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { BetterLogger } from '@hms-module/modules/better-logger/better-logger.service';

interface ExceptionResponse {
    message?: string | string[];
    error?: string;
    code?: string;
    [key: string]: any;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    constructor(
        private readonly httpAdapterHost: HttpAdapterHost,
        private readonly logger: BetterLogger,
    ) {
        this.logger.setContext(GlobalExceptionFilter.name);
    }

    private getErrorMessage(exception: unknown): string {
        if (exception instanceof Error) {
            return exception.stack || exception.message;
        }
        return String(exception);
    }

    catch(exception: unknown, host: ArgumentsHost): void {
        const { httpAdapter } = this.httpAdapterHost;
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const messages: string[] = [];
        let errorCode: string | undefined;

        let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
        const path = httpAdapter.getRequestUrl(request);
        const timestamp = new Date().toISOString();

        if (exception instanceof HttpException) {
            httpStatus = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'string') {
                messages.push(exceptionResponse);
            } else {
                const response = exceptionResponse as ExceptionResponse;

                if (response.message) {
                    if (Array.isArray(response.message)) {
                        messages.push(...response.message.filter(m => typeof m === 'string'));
                    } else if (typeof response.message === 'string') {
                        messages.push(response.message);
                    }
                }

                if (messages.length === 0 && response.error && typeof response.error === 'string') {
                    messages.push(response.error);
                }

                if (typeof response.code === 'string' && response.code.length > 0) {
                    errorCode = response.code;
                }
            }
        } else if (exception instanceof Error) {
            messages.push(exception.message);
            this.logger.error(`Unhandled Error - Path: ${path} - ${this.getErrorMessage(exception)}`);
        } else {
            messages.push('Internal server error');
            const errorMessage = `Unknown Error Type - Path: ${path} - ${String(exception)}`;
            this.logger.error(errorMessage);
        }

        const errorResponse = {
            status_code: httpStatus,
            messages,
            timestamp,
            path,
            ...(errorCode ? { code: errorCode } : {}),
        };

        httpAdapter.reply(response, errorResponse, httpStatus);
    }
}