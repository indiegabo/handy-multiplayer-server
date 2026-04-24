import { HMS_FILESYSTEM_CONFIG } from './filesystem.config';

export const HMS_I18N_CONFIG_TOKEN = 'HMS_I18N_CONFIG_TOKEN';

export type HmsI18nConfig = {
    rootPathCandidates: string[];
    manifestFileName: string;
    cache: {
        manifestMaxAgeSeconds: number;
        bundleMaxAgeSeconds: number;
    };
};

export const HMS_I18N_CONFIG: HmsI18nConfig = {
    rootPathCandidates: HMS_FILESYSTEM_CONFIG.i18n.rootPathCandidates,
    manifestFileName: 'manifest.json',
    cache: {
        manifestMaxAgeSeconds: 30,
        bundleMaxAgeSeconds: 300,
    },
};
