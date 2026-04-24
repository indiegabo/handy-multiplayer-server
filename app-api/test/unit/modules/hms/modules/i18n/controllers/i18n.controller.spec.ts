import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { I18nController }
    from '@hms-module/modules/i18n/controllers/i18n.controller';
import { I18nService }
    from '@hms-module/modules/i18n/services/i18n.service';

describe('I18nController', () => {
    let controller: I18nController;
    let service: jest.Mocked<I18nService>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [I18nController],
            providers: [
                {
                    provide: I18nService,
                    useValue: {
                        getManifest: jest.fn(),
                        getUniverseBundles: jest.fn(),
                        getBundle: jest.fn(),
                        matchesIfNoneMatch: jest.fn(),
                        getManifestCacheControl: jest.fn(),
                        getBundleCacheControl: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<I18nController>(I18nController);
        service = module.get(I18nService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return manifest payload when cache miss occurs', async () => {
        service.getManifest.mockResolvedValue({
            manifest: {
                version: 'alpha.0.1',
                defaultLocale: 'en',
                modules: {
                    sg: {},
                },
            },
            etag: '"manifest-etag"',
        });
        service.getManifestCacheControl.mockReturnValue('public, max-age=30');
        service.matchesIfNoneMatch.mockReturnValue(false);

        const response = createMockResponse();

        const result = await controller.getManifest(
            { headers: {} } as any,
            response as any,
        );

        expect(result).toEqual({
            data: {
                version: 'alpha.0.1',
                defaultLocale: 'en',
                modules: {
                    sg: {},
                },
            },
        });
        expect(response.setHeader).toHaveBeenCalledWith(
            'ETag',
            '"manifest-etag"',
        );
        expect(response.setHeader).toHaveBeenCalledWith(
            'Cache-Control',
            'public, max-age=30',
        );
    });

    it('should respond 304 when manifest etag matches', async () => {
        service.getManifest.mockResolvedValue({
            manifest: {
                version: 'alpha.0.1',
                defaultLocale: 'en',
                modules: {
                    sg: {},
                },
            },
            etag: '"manifest-etag"',
        });
        service.getManifestCacheControl.mockReturnValue('public, max-age=30');
        service.matchesIfNoneMatch.mockReturnValue(true);

        const response = createMockResponse();

        const result = await controller.getManifest(
            { headers: { 'if-none-match': '"manifest-etag"' } } as any,
            response as any,
        );

        expect(result).toBeUndefined();
        expect(response.status).toHaveBeenCalledWith(HttpStatus.NOT_MODIFIED);
    });

    it('should return bundle payload when cache miss occurs', async () => {
        service.getBundle.mockResolvedValue({
            payload: {
                title: 'Sign in',
            },
            etag: '"bundle-etag"',
            hash: 'sha256-123',
            sizeBytes: 42,
        });
        service.getBundleCacheControl.mockReturnValue('public, max-age=120');
        service.matchesIfNoneMatch.mockReturnValue(false);

        const response = createMockResponse();

        const result = await controller.getBundle(
            {
                locale: 'en',
                moduleName: 'sg',
                universe: 'launcher',
                namespace: 'auth',
            },
            { headers: {} } as any,
            response as any,
        );

        expect(result).toEqual({
            data: { title: 'Sign in' },
        });
        expect(service.getBundle).toHaveBeenCalledWith(
            'en',
            'sg',
            'launcher',
            'auth',
        );
        expect(response.setHeader).toHaveBeenCalledWith(
            'ETag',
            '"bundle-etag"',
        );
        expect(response.setHeader).toHaveBeenCalledWith(
            'Cache-Control',
            'public, max-age=120',
        );
    });

    it('should return aggregated universe payload when cache miss occurs', async () => {
        service.getUniverseBundles.mockResolvedValue({
            payload: {
                locale: 'en',
                moduleName: 'sg',
                universe: 'launcher',
                namespaces: {
                    auth: { title: 'Sign in' },
                    things: { loading: 'Loading...' },
                },
            },
            etag: '"universe-etag"',
            hash: 'sha256-universe-hash',
            sizeBytes: 110,
        });
        service.getBundleCacheControl.mockReturnValue('public, max-age=120');
        service.matchesIfNoneMatch.mockReturnValue(false);

        const response = createMockResponse();

        const result = await controller.getUniverseBundles(
            {
                locale: 'en',
                moduleName: 'sg',
                universe: 'launcher',
            },
            { headers: {} } as any,
            response as any,
        );

        expect(result).toEqual({
            data: {
                locale: 'en',
                moduleName: 'sg',
                universe: 'launcher',
                namespaces: {
                    auth: { title: 'Sign in' },
                    things: { loading: 'Loading...' },
                },
            },
        });
        expect(service.getUniverseBundles).toHaveBeenCalledWith(
            'en',
            'sg',
            'launcher',
        );
        expect(response.setHeader).toHaveBeenCalledWith(
            'ETag',
            '"universe-etag"',
        );
        expect(response.setHeader).toHaveBeenCalledWith(
            'Cache-Control',
            'public, max-age=120',
        );
    });

    it('should respond 304 when universe etag matches', async () => {
        service.getUniverseBundles.mockResolvedValue({
            payload: {
                locale: 'en',
                moduleName: 'sg',
                universe: 'launcher',
                namespaces: {},
            },
            etag: '"universe-etag"',
            hash: 'sha256-universe-hash',
            sizeBytes: 30,
        });
        service.getBundleCacheControl.mockReturnValue('public, max-age=120');
        service.matchesIfNoneMatch.mockReturnValue(true);

        const response = createMockResponse();

        const result = await controller.getUniverseBundles(
            {
                locale: 'en',
                moduleName: 'sg',
                universe: 'launcher',
            },
            { headers: { 'if-none-match': '"universe-etag"' } } as any,
            response as any,
        );

        expect(result).toBeUndefined();
        expect(response.status).toHaveBeenCalledWith(HttpStatus.NOT_MODIFIED);
    });
});

function createMockResponse() {
    return {
        setHeader: jest.fn(),
        status: jest.fn(),
    };
}
