import { Connection, ClientSession } from 'mongoose';
import { BetterLogger } from '@hms-module/modules/better-logger/better-logger.service';

export class MongoTransactioner {
    static for(connection: Connection): MongoTransactioner {
        return new MongoTransactioner(connection);
    }

    private readonly logger = new BetterLogger(MongoTransactioner.name);

    constructor(private connection: Connection) {

    }

    async perform<T>(
        operation: (session: ClientSession) => Promise<T>,
        options?: { enableLogging?: boolean }
    ): Promise<T> {
        const session = await this.connection.startSession();
        session.startTransaction();

        try {
            const result = await operation(session);
            await session.commitTransaction();

            if (options?.enableLogging) {
                this.logger.log('Transaction successfully committed');
            }

            return result as T;
        } catch (error) {
            await session.abortTransaction();
            if (options?.enableLogging) {
                this.logger.error(`Transaction aborted due to error: ${error.message}`);
            }
            throw error;
        } finally {
            await session.endSession();
        }
    }

    async performWithRetry<T>(
        operation: (session: ClientSession) => Promise<T>,
        options?: {
            maxRetries?: number;
            baseDelayMs?: number;
            enableLogging?: boolean;
            retryableCodes?: number[];
        }
    ): Promise<T> {
        const maxRetries = options?.maxRetries ?? 3;
        const baseDelayMs = options?.baseDelayMs ?? 100;
        const retryableCodes = options?.retryableCodes ?? [
            112,    // WriteConflict
            16500,  // TooManyRequests
            91,     // ShutdownInProgress
            6,      // HostUnreachable
            7,      // HostNotFound
            89,     // NetworkTimeout
            9001,   // SocketException
            262,    // ExceededTimeLimit
            133,    // CannotGrowDocumentInCappedNamespace
            134,    // CannotCreateIndex
            246     // NoSuchTransaction
        ];

        let lastError: Error & { code?: number };
        let attempt = 0;

        while (attempt < maxRetries) {
            const session = await this.connection.startSession();
            session.startTransaction();

            try {
                const result = await operation(session);
                await session.commitTransaction();

                if (options?.enableLogging) {
                    this.logger.log(`Transaction successfully committed (attempt ${attempt + 1})`);
                }

                return result;
            } catch (error) {
                await session.abortTransaction().catch(() => { });
                lastError = error;

                if (options?.enableLogging) {
                    this.logger.warn(`Transaction attempt ${attempt + 1} failed: ${error.message}`);
                }

                // Verifica se o erro é retryable
                const shouldRetry = retryableCodes.includes(error.code) ||
                    error.message.includes('Write conflict') ||
                    error.message.includes('Transaction too old');

                if (!shouldRetry || attempt >= maxRetries - 1) {
                    break;
                }

                // Backoff exponencial com jitter
                const delay = baseDelayMs * Math.pow(2, attempt) * (0.7 + Math.random() * 0.6);
                await new Promise(resolve => setTimeout(resolve, delay));

                attempt++;
            } finally {
                await session.endSession().catch(() => { });
            }
        }

        if (options?.enableLogging) {
            this.logger.error(`Transaction failed after ${maxRetries} attempts`);
            this.logger.error(lastError);
        }

        // Adiciona informações de retry ao erro original
        lastError.message = `[Retry ${attempt + 1}/${maxRetries}] ${lastError.message}`;
        throw lastError;
    }

    async performWithTimeout<T>(
        operation: (session: ClientSession) => Promise<T>,
        timeoutMs: number
    ): Promise<T> {
        return Promise.race([
            this.perform(operation),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Transaction timeout')), timeoutMs)
            )
        ]) as Promise<T>;
    }

    async performWithMetrics<T>(
        operation: (session: ClientSession) => Promise<T>
    ): Promise<{ result: T; duration: number }> {
        const start = Date.now();
        const result = await this.perform(operation);
        const duration = Date.now() - start;
        this.logger.log(`Transaction completed in ${duration}ms`);
        return { result, duration };
    }
}