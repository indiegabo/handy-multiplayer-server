import { join } from 'path';

export const HMS_FILESYSTEM_CONFIG = {
    i18n: {
        /**
         * Root candidates for i18n assets on local filesystem.
         *
         * - src/i18n is used in development with ts-node/watch mode.
         * - dist/i18n is used in compiled/runtime images.
         */
        rootPathCandidates: [
            join(process.cwd(), 'src', 'i18n'),
            join(process.cwd(), 'dist', 'i18n'),
        ],
    },
};
