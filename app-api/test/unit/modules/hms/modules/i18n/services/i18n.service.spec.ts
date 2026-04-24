import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
    HMS_I18N_CONFIG_TOKEN,
    HmsI18nConfig,
} from '@src/config/hms/i18n.config';
import { FilesystemService }
    from '@hms-module/modules/filesystem/filesystem.service';
import { I18nService }
    from '@hms-module/modules/i18n/services/i18n.service';

describe('I18nService', () => {
    let service: I18nService;
    let tempRootPath: string;

    beforeEach(async () => {
        tempRootPath = await fs.mkdtemp(join(tmpdir(), 'hms-i18n-'));

        await fs.writeFile(
            join(tempRootPath, 'manifest.json'),
            JSON.stringify({
                version: 'alpha.0.1',
                defaultLocale: 'en',
                modules: {
                    sg: {
                        locales: {
                            en: {
                                universes: {
                                    launcher: {
                                        namespaces: ['auth'],
                                    },
                                },
                            },
                        },
                    },
                },
            }),
            'utf-8',
        );

        await writeBundle(
            tempRootPath,
            'sg',
            'pt-BR',
            'launcher',
            'auth',
            {
                auth: { title: 'Entrar' },
            },
        );

        await writeBundle(
            tempRootPath,
            'sg',
            'pt-BR',
            'launcher',
            'things',
            {
                things: { loading: 'Carregando...' },
            },
        );

        const config: HmsI18nConfig = {
            rootPathCandidates: [tempRootPath],
            manifestFileName: 'manifest.json',
            cache: {
                manifestMaxAgeSeconds: 30,
                bundleMaxAgeSeconds: 120,
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FilesystemService,
                I18nService,
                {
                    provide: HMS_I18N_CONFIG_TOKEN,
                    useValue: config,
                },
            ],
        }).compile();

        service = module.get<I18nService>(I18nService);
    });

    afterEach(async () => {
        await fs.rm(tempRootPath, {
            recursive: true,
            force: true,
        });
    });

    it('should return manifest from root i18n folder', async () => {
        const result = await service.getManifest();

        expect(result.manifest.version).toBe('alpha.0.1');
        expect(result.manifest.defaultLocale).toBe('en');
        expect(result.manifest.modules).toHaveProperty('sg');
        expect(result.etag).toMatch(/^".+"$/);
    });

    it('should resolve bundle from module folder in i18n root', async () => {
        const bundle = await service.getBundle(
            'pt-BR',
            'sg',
            'launcher',
            'auth',
        );

        expect(bundle.payload).toEqual({ title: 'Entrar' });
        expect(bundle.etag).toMatch(/^".+"$/);
        expect(bundle.hash.startsWith('sha256-')).toBe(true);
    });

    it('should throw when bundle does not exist', async () => {
        await expect(
            service.getBundle('pt-BR', 'sg', 'launcher', 'missing'),
        ).rejects.toThrow(NotFoundException);
    });

    it('should return all namespace bundles from a universe', async () => {
        const result = await service.getUniverseBundles(
            'pt-BR',
            'sg',
            'launcher',
        );

        expect(result.payload.locale).toBe('pt-BR');
        expect(result.payload.moduleName).toBe('sg');
        expect(result.payload.universe).toBe('launcher');
        expect(result.payload.namespaces).toEqual({
            auth: { title: 'Entrar' },
            things: { loading: 'Carregando...' },
        });
        expect(result.etag).toMatch(/^".+"$/);
        expect(result.hash.startsWith('sha256-')).toBe(true);
        expect(result.sizeBytes).toBeGreaterThan(0);
    });

    it('should compare If-None-Match header correctly', () => {
        const etag = '"abc123"';

        expect(service.matchesIfNoneMatch(etag, etag)).toBe(true);
        expect(
            service.matchesIfNoneMatch('"other", "abc123"', etag),
        ).toBe(true);
        expect(service.matchesIfNoneMatch('"other"', etag)).toBe(false);
    });
});

async function writeBundle(
    rootPath: string,
    moduleName: string,
    locale: string,
    universe: string,
    namespace: string,
    payload: Record<string, string>,
): Promise<void> {
    const universePath = join(rootPath, moduleName, locale, universe);

    await fs.mkdir(universePath, { recursive: true });
    await fs.writeFile(
        join(universePath, `${namespace}.json`),
        JSON.stringify(payload),
        'utf-8',
    );
}
