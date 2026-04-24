export type I18nBundlePayload = Record<string, unknown>;

export type I18nUniverseBundlesPayload = {
    locale: string;
    moduleName: string;
    universe: string;
    namespaces: Record<string, I18nBundlePayload>;
};

export type I18nManifest = {
    version: string;
    defaultLocale: string;
    modules: Record<string, unknown>;
};

export type I18nManifestResponse = {
    manifest: I18nManifest;
    etag: string;
};

export type I18nBundleResponse = {
    payload: I18nBundlePayload;
    etag: string;
    hash: string;
    sizeBytes: number;
};

export type I18nUniverseBundlesResponse = {
    payload: I18nUniverseBundlesPayload;
    etag: string;
    hash: string;
    sizeBytes: number;
};
