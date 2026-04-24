import {
    Inject,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import {
    HMS_I18N_CONFIG_TOKEN,
    HmsI18nConfig,
} from '@src/config/hms/i18n.config';
import { FilesystemService }
    from '@hms-module/modules/filesystem/filesystem.service';
import {
    extname,
    parse,
} from 'path';
import {
    I18nBundlePayload,
    I18nBundleResponse,
    I18nManifest,
    I18nManifestResponse,
    I18nUniverseBundlesPayload,
    I18nUniverseBundlesResponse,
} from '../types/i18n.types';

@Injectable()
export class I18nService {
    constructor(
        private readonly filesystemService: FilesystemService,
        @Inject(HMS_I18N_CONFIG_TOKEN)
        private readonly config: HmsI18nConfig,
    ) { }

    /**
     * Returns the manifest file located at /src/i18n/manifest.json
     * (or /dist/i18n/manifest.json in compiled runtime).
     */
    async getManifest(): Promise<I18nManifestResponse> {
        const rootPath = await this.resolveRootPath();
        const manifestPath = this.filesystemService.resolvePathWithinBase(
            rootPath,
            this.config.manifestFileName,
        );

        const manifestRaw = await this.filesystemService.readFileUtf8(manifestPath);
        const manifest = this.parseManifest(manifestRaw, manifestPath);

        return {
            manifest,
            etag: this.filesystemService.createEtagFromContent(manifestRaw),
        };
    }

    /**
     * Resolve one localization namespace bundle using route order:
     * /v1/i18n/:locale/:moduleName/:universe/:namespace
     */
    async getBundle(
        locale: string,
        moduleName: string,
        universe: string,
        namespace: string,
    ): Promise<I18nBundleResponse> {
        const rootPath = await this.resolveRootPath();

        const bundlePath = this.filesystemService.resolvePathWithinBase(
            rootPath,
            moduleName,
            locale,
            universe,
            `${namespace}.json`,
        );

        const bundleRaw = await this.filesystemService.readFileUtf8(bundlePath);
        const payload = this.parseBundle(bundleRaw, bundlePath, namespace);

        const hash = this.filesystemService.createContentHash(
            bundleRaw,
            'sha256',
        );

        return {
            payload,
            etag: this.filesystemService.createEtagFromContent(bundleRaw),
            hash: `sha256-${hash}`,
            sizeBytes: Buffer.byteLength(bundleRaw, 'utf-8'),
        };
    }

    /**
     * Resolve all namespace bundles under one universe.
     *
     * Route shape:
     * /v1/i18n/:locale/:moduleName/:universe
     */
    async getUniverseBundles(
        locale: string,
        moduleName: string,
        universe: string,
    ): Promise<I18nUniverseBundlesResponse> {
        const rootPath = await this.resolveRootPath();
        const universePath = this.filesystemService.resolvePathWithinBase(
            rootPath,
            moduleName,
            locale,
            universe,
        );

        const entries = await this.filesystemService.readDirectory(universePath);
        const namespaceFiles = entries
            .filter((entry) => {
                return entry.isFile() && extname(entry.name).toLowerCase() === '.json';
            })
            .map((entry) => entry.name)
            .sort((left, right) => left.localeCompare(right));

        const namespaces: Record<string, I18nBundlePayload> = {};

        for (const namespaceFileName of namespaceFiles) {
            const namespacePath = this.filesystemService.resolvePathWithinBase(
                universePath,
                namespaceFileName,
            );

            const namespaceRaw = await this.filesystemService.readFileUtf8(
                namespacePath,
            );

            const namespaceName = parse(namespaceFileName).name;
            namespaces[namespaceName] = this.parseBundle(
                namespaceRaw,
                namespacePath,
                namespaceName,
            );
        }

        const payload: I18nUniverseBundlesPayload = {
            locale,
            moduleName,
            universe,
            namespaces,
        };

        const serializedPayload = JSON.stringify(payload);
        const hash = this.filesystemService.createContentHash(
            serializedPayload,
            'sha256',
        );

        return {
            payload,
            etag: this.filesystemService.createEtagFromContent(serializedPayload),
            hash: `sha256-${hash}`,
            sizeBytes: Buffer.byteLength(serializedPayload, 'utf-8'),
        };
    }

    matchesIfNoneMatch(
        ifNoneMatchHeader: string | string[] | undefined,
        currentEtag: string,
    ): boolean {
        if (!ifNoneMatchHeader) {
            return false;
        }

        const normalizedHeader = Array.isArray(ifNoneMatchHeader)
            ? ifNoneMatchHeader.join(',')
            : ifNoneMatchHeader;

        const headerValues = normalizedHeader
            .split(',')
            .map((headerValue) => headerValue.trim());

        return headerValues.some((headerValue) => {
            return headerValue === '*' || headerValue === currentEtag;
        });
    }

    getManifestCacheControl(): string {
        return `public, max-age=${this.config.cache.manifestMaxAgeSeconds}`;
    }

    getBundleCacheControl(): string {
        return `public, max-age=${this.config.cache.bundleMaxAgeSeconds}`;
    }

    private async resolveRootPath(): Promise<string> {
        for (const rootPathCandidate of this.config.rootPathCandidates) {
            const isDirectory = await this.filesystemService.isDirectory(
                rootPathCandidate,
            );

            if (isDirectory) {
                return rootPathCandidate;
            }
        }

        throw new NotFoundException(
            'I18n root directory was not found in configured candidates.',
        );
    }

    private parseManifest(
        manifestRaw: string,
        sourcePath: string,
    ): I18nManifest {
        let parsedManifest: unknown;

        try {
            parsedManifest = JSON.parse(manifestRaw);
        } catch {
            throw new InternalServerErrorException(
                `Invalid JSON format in i18n manifest: ${sourcePath}`,
            );
        }

        if (
            parsedManifest === null ||
            typeof parsedManifest !== 'object' ||
            Array.isArray(parsedManifest)
        ) {
            throw new InternalServerErrorException(
                `Manifest must be an object: ${sourcePath}`,
            );
        }

        const candidate = parsedManifest as Record<string, unknown>;

        if (typeof candidate.version !== 'string') {
            throw new InternalServerErrorException(
                `Manifest field "version" must be string: ${sourcePath}`,
            );
        }

        if (typeof candidate.defaultLocale !== 'string') {
            throw new InternalServerErrorException(
                `Manifest field "defaultLocale" must be string: ${sourcePath}`,
            );
        }

        if (
            candidate.modules === null ||
            typeof candidate.modules !== 'object' ||
            Array.isArray(candidate.modules)
        ) {
            throw new InternalServerErrorException(
                `Manifest field "modules" must be object: ${sourcePath}`,
            );
        }

        return candidate as I18nManifest;
    }

    private parseBundle(
        bundleRaw: string,
        sourcePath: string,
        namespaceName?: string,
    ): I18nBundlePayload {
        let parsedBundle: unknown;

        try {
            parsedBundle = JSON.parse(bundleRaw);
        } catch {
            throw new InternalServerErrorException(
                `Invalid JSON format in i18n bundle: ${sourcePath}`,
            );
        }

        if (
            parsedBundle === null ||
            typeof parsedBundle !== 'object' ||
            Array.isArray(parsedBundle)
        ) {
            throw new InternalServerErrorException(
                `Bundle must be an object: ${sourcePath}`,
            );
        }

        const candidate = parsedBundle as Record<string, unknown>;

        // If the file was authored with a single top-level key matching the
        // namespace name (e.g. `{ "common": { ... } }` inside `common.json`),
        // unwrap it and return the inner object so consumers receive a clean
        // namespace object. Otherwise, return the parsed object as-is.
        if (
            namespaceName &&
            Object.keys(candidate).length === 1 &&
            Object.prototype.hasOwnProperty.call(candidate, namespaceName)
        ) {
            const inner = candidate[namespaceName];
            if (inner !== null && typeof inner === 'object' && !Array.isArray(inner)) {
                return inner as I18nBundlePayload;
            }
            // fallthrough: return the original candidate if inner is not an object
        }

        return candidate as I18nBundlePayload;
    }
}
