// src/redis/redis.service.spec.ts
import Redis from 'ioredis';
import { RedisService } from '../../../../../../src/modules/hms/modules/redis/redis.service';

jest.mock('ioredis');

type RedisMock = {
    // Core
    ping: jest.Mock;
    quit: jest.Mock;
    disconnect: jest.Mock;
    on: jest.Mock;
    // KV
    set: jest.Mock;
    setex: jest.Mock;
    get: jest.Mock;
    del: jest.Mock;
    exists: jest.Mock;
    keys: jest.Mock;
    incr: jest.Mock;
    decr: jest.Mock;
    // TTL
    expire: jest.Mock;
    pexpire: jest.Mock;
    ttl: jest.Mock;
    pttl: jest.Mock;
    persist: jest.Mock;
    // PubSub
    publish: jest.Mock;
    subscribe: jest.Mock;
    unsubscribe: jest.Mock;
    removeListener: jest.Mock;
    // Scripts
    eval: jest.Mock;
};

function makeRedisMock(): RedisMock {
    return {
        // Core
        ping: jest.fn(),
        quit: jest.fn(),
        disconnect: jest.fn(),
        on: jest.fn(),
        // KV
        set: jest.fn(),
        setex: jest.fn(),
        get: jest.fn(),
        del: jest.fn(),
        exists: jest.fn(),
        keys: jest.fn(),
        incr: jest.fn(),
        decr: jest.fn(),
        // TTL
        expire: jest.fn(),
        pexpire: jest.fn(),
        ttl: jest.fn(),
        pttl: jest.fn(),
        persist: jest.fn(),
        // PubSub
        publish: jest.fn(),
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
        removeListener: jest.fn(),
        // Scripts
        eval: jest.fn(),
    };
}

describe('RedisService', () => {
    let service: RedisService;
    let clientMock: RedisMock;
    let subMock: RedisMock;

    beforeEach(() => {
        jest.clearAllMocks();

        clientMock = makeRedisMock();
        subMock = makeRedisMock();

        // First 'new Redis()' -> main client
        // Second 'new Redis()' -> createDedicatedClient() (subscriber)
        (Redis as unknown as jest.Mock).mockImplementationOnce(() => clientMock);
        (Redis as unknown as jest.Mock).mockImplementation(() => subMock);

        service = new RedisService();

        // Silence logs in tests (override instance field, no spyOn getter)
        (service as any).logger = {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            verbose: jest.fn(),
        };
    });

    describe('constructor & listeners', () => {
        it('should register error listener only', () => {
            expect(clientMock.on).toHaveBeenCalledWith(
                'error',
                expect.any(Function),
            );
            const onCalls = clientMock.on.mock.calls.map((c) => c[0]);
            expect(onCalls.includes('connect')).toBe(false);
            expect(onCalls.includes('ready')).toBe(false);
        });

        it('should log errors from error listener', () => {
            const [[, errHandler]] = clientMock.on.mock.calls;
            const logger = (service as any).logger;
            const err = new Error('boom');
            errHandler(err);
            expect(logger.error).toHaveBeenCalledTimes(1);
            expect((logger.error as jest.Mock).mock.calls[0][0])
                .toMatch(/Redis error:/);
        });
    });

    describe('onModuleInit', () => {
        it('should ping successfully and start heartbeat silently', async () => {
            clientMock.ping.mockResolvedValue('PONG');
            await service.onModuleInit();
            expect(clientMock.ping).toHaveBeenCalled();
        });

        it('should log error when ping fails', async () => {
            const err = new Error('fail');
            clientMock.ping.mockRejectedValue(err);
            const logger = (service as any).logger;

            await service.onModuleInit();

            expect(logger.error).toHaveBeenCalledWith(
                'Failed to connect to Redis',
                err,
            );
        });
    });

    describe('onModuleDestroy', () => {
        it('should quit successfully', async () => {
            clientMock.quit.mockResolvedValue('OK');
            await service.onModuleDestroy();
            expect(clientMock.quit).toHaveBeenCalled();
        });

        it('should disconnect if quit fails', async () => {
            clientMock.quit.mockRejectedValue(new Error('nope'));
            await service.onModuleDestroy();
            expect(clientMock.disconnect).toHaveBeenCalled();
        });
    });

    describe('connections/options', () => {
        it('getClient should return the main client', () => {
            const c = service.getClient();
            expect(c).toBe(clientMock as any);
        });

        it('getBullConnectionOptions should return a copy', () => {
            const opts = service.getBullConnectionOptions();
            expect(opts).toBeTruthy();
            (opts as any).host = 'x';
            const opts2 = service.getBullConnectionOptions();
            expect((opts2 as any).host).not.toBe('x');
        });

        it('createDedicatedClient should open another client with error handler', () => {
            const cli = service.createDedicatedClient();
            expect(Redis).toHaveBeenCalledTimes(2);
            expect((cli as any).on).toHaveBeenCalledWith(
                'error',
                expect.any(Function),
            );
        });
    });

    describe('KV operations', () => {
        it('set should call setex when ttl provided', async () => {
            clientMock.setex.mockResolvedValue('OK');
            await service.set('k', 'v', 10);
            expect(clientMock.setex).toHaveBeenCalledWith('k', 10, 'v');
            expect(clientMock.set).not.toHaveBeenCalled();
        });

        it('set should call set when no ttl', async () => {
            clientMock.set.mockResolvedValue('OK');
            await service.set('k', 'v');
            expect(clientMock.set).toHaveBeenCalledWith('k', 'v');
            expect(clientMock.setex).not.toHaveBeenCalled();
        });

        it('get should delegate to redis.get', async () => {
            clientMock.get.mockResolvedValue('val');
            const v = await service.get('k');
            expect(clientMock.get).toHaveBeenCalledWith('k');
            expect(v).toBe('val');
        });

        it('del should delegate to redis.del', async () => {
            clientMock.del.mockResolvedValue(1);
            await service.del('k');
            expect(clientMock.del).toHaveBeenCalledWith('k');
        });

        it('exists should return boolean', async () => {
            clientMock.exists.mockResolvedValue(1);
            await expect(service.exists('k')).resolves.toBe(true);
            clientMock.exists.mockResolvedValue(0);
            await expect(service.exists('k')).resolves.toBe(false);
        });

        it('keys/incr/decr should delegate', async () => {
            clientMock.keys.mockResolvedValue(['a', 'b']);
            clientMock.incr.mockResolvedValue(2);
            clientMock.decr.mockResolvedValue(1);

            expect(await service.keys('p*')).toEqual(['a', 'b']);
            expect(await service.incr('n')).toBe(2);
            expect(await service.decr('n')).toBe(1);

            expect(clientMock.keys).toHaveBeenCalledWith('p*');
            expect(clientMock.incr).toHaveBeenCalledWith('n');
            expect(clientMock.decr).toHaveBeenCalledWith('n');
        });
    });

    describe('TTL operations', () => {
        it('expire/pexpire should return true on 1', async () => {
            clientMock.expire.mockResolvedValue(1);
            clientMock.pexpire.mockResolvedValue(1);
            await expect(service.expire('k', 5)).resolves.toBe(true);
            await expect(service.pexpire('k', 500)).resolves.toBe(true);
        });

        it('ttl/pttl should delegate', async () => {
            clientMock.ttl.mockResolvedValue(42);
            clientMock.pttl.mockResolvedValue(1234);
            await expect(service.ttl('k')).resolves.toBe(42);
            await expect(service.pttl('k')).resolves.toBe(1234);
        });

        it('persist should return true on 1', async () => {
            clientMock.persist.mockResolvedValue(1);
            await expect(service.persist('k')).resolves.toBe(true);
        });
    });

    describe('JSON helpers', () => {
        it('setJson should stringify and call set', async () => {
            clientMock.set.mockResolvedValue('OK');
            const obj = { a: 1 };
            await service.setJson('k', obj);
            expect(clientMock.set).toHaveBeenCalledWith(
                'k',
                JSON.stringify(obj),
            );
        });

        it('getJson should parse JSON or return null', async () => {
            clientMock.get.mockResolvedValue(JSON.stringify({ a: 1 }));
            await expect(
                service.getJson<{ a: number }>('k'),
            ).resolves.toEqual({ a: 1 });

            clientMock.get.mockResolvedValue('not-json');
            await expect(service.getJson('k')).resolves.toBeNull();
        });

        it('updateJson should preserve TTL when present', async () => {
            clientMock.exists.mockResolvedValue(1);
            clientMock.ttl.mockResolvedValue(30);
            clientMock.get.mockResolvedValue(JSON.stringify({ n: 1 }));
            clientMock.setex.mockResolvedValue('OK');

            const ok = await service.updateJson<{ n: number }>(
                'k',
                (cur) => ({ n: cur.n + 1 }),
            );

            expect(ok).toBe(true);
            expect(clientMock.setex).toHaveBeenCalledWith(
                'k',
                30,
                JSON.stringify({ n: 2 }),
            );
        });

        it('updateJson should set without TTL when persistent', async () => {
            clientMock.exists.mockResolvedValue(1);
            clientMock.ttl.mockResolvedValue(-1);
            clientMock.get.mockResolvedValue(JSON.stringify({ n: 1 }));
            clientMock.set.mockResolvedValue('OK');

            const ok = await service.updateJson<{ n: number }>(
                'k',
                (cur) => ({ n: cur.n + 1 }),
            );

            expect(ok).toBe(true);
            expect(clientMock.set).toHaveBeenCalledWith(
                'k',
                JSON.stringify({ n: 2 }),
            );
        });

        it('updateJson should return false when key does not exist', async () => {
            clientMock.exists.mockResolvedValue(0);
            const ok = await service.updateJson('k', (x: any) => x);
            expect(ok).toBe(false);
        });
    });

    describe('Pub/Sub', () => {
        it('publish should delegate and return receivers', async () => {
            clientMock.publish.mockResolvedValue(3);
            await expect(service.publish('ch', 'msg')).resolves.toBe(3);
            expect(clientMock.publish).toHaveBeenCalledWith('ch', 'msg');
        });

        it('subscribe should create dedicated client and handle messages', async () => {
            const onSpy = subMock.on;
            subMock.subscribe.mockResolvedValue('OK');

            const cb = jest.fn();
            const cleanup = await service.subscribe('ch', cb);

            expect(subMock.subscribe).toHaveBeenCalledWith('ch');
            expect(onSpy).toHaveBeenCalledWith(
                'message',
                expect.any(Function),
            );

            const handler =
                onSpy.mock.calls.find((c) => c[0] === 'message')![1];

            handler('ch', 'hello');
            expect(cb).toHaveBeenCalledWith('hello');

            cb.mockClear();
            handler('other', 'nope');
            expect(cb).not.toHaveBeenCalled();

            subMock.unsubscribe.mockResolvedValue(1);
            subMock.quit.mockResolvedValue('OK');
            await cleanup();
            expect(subMock.removeListener)
                .toHaveBeenCalledWith('message', handler);
            expect(subMock.unsubscribe).toHaveBeenCalledWith('ch');
            expect(subMock.quit).toHaveBeenCalled();
        });
    });

    describe('Locks', () => {
        it('acquireLock should return token when set NX PX OK', async () => {
            clientMock.set.mockResolvedValue('OK');
            const token = await service.acquireLock('lk', 5000, 'tkn');
            expect(clientMock.set).toHaveBeenCalledWith(
                'lk',
                'tkn',
                'PX',
                5000,
                'NX',
            );
            expect(token).toBe('tkn');
        });

        it('acquireLock should return null when not acquired', async () => {
            clientMock.set.mockResolvedValue(null);
            const token = await service.acquireLock('lk', 5000);
            expect(token).toBeNull();
        });

        it('releaseLock should return true on 1', async () => {
            clientMock.eval.mockResolvedValue(1);
            await expect(
                service.releaseLock('lk', 't'),
            ).resolves.toBe(true);
            expect(clientMock.eval).toHaveBeenCalled();
        });

        it('extendLock should return true on 1', async () => {
            clientMock.eval.mockResolvedValue(1);
            await expect(
                service.extendLock('lk', 't', 1000),
            ).resolves.toBe(true);
            expect(clientMock.eval).toHaveBeenCalled();
        });
    });
});
