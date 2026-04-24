/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: 'node',
    roots: ['<rootDir>/src', '<rootDir>/test'],

    moduleNameMapper: {
        // 1) Pacote do monorepo: mapear ANTES de ^@hms/(.*)$
        '^@hms/shared-types$': '<rootDir>/../app-shared-types/src/index.ts',
        '^@hms/shared-types/(.*)$': '<rootDir>/../app-shared-types/src/$1',

        // 2) Aliases internos do app
        '^@src/(.*)$': '<rootDir>/src/$1',
        '^@hms-module/(.*)$': '<rootDir>/src/modules/hms/$1',
        '^@sg-module/(.*)$': '<rootDir>/src/modules/sg/$1',

        // 3) Evita colidir com shared-types
        '^@hms/(?!shared-types)(.*)$': '<rootDir>/src/hms/$1',

        // 4) Alias para testes (precisa p/ 'test/mocks/...'):
        '^test/(.*)$': '<rootDir>/test/$1',

        // (Opcional) compat com imports antigos
        '^@shared-types$': [
            '<rootDir>/../app-shared-types/src/index.ts'
        ],
        '^@shared-types/(.*)$': [
            '<rootDir>/../app-shared-types/src/$1'
        ],
    },

    moduleDirectories: ['node_modules', '<rootDir>/src'],
    testMatch: ['**/*.spec.ts'],

    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                tsconfig: '<rootDir>/tsconfig.spec.json',
                diagnostics: { warnOnly: false },
            },
        ],
    },

    moduleFileExtensions: ['ts', 'js', 'json'],
    collectCoverageFrom: ['src/**/*.{ts,js}'],
    coverageDirectory: '<rootDir>/coverage',
    clearMocks: true,
    restoreMocks: true,
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
    detectOpenHandles: true,
    forceExit: true,
    testTimeout: 30000,
    passWithNoTests: true,
};
