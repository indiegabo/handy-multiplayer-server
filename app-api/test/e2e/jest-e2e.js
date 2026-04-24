// test/e2e/jest-e2e.js
// Purpose: Jest E2E configuration for the System app.
// Mirrors the API setup to prevent duplicated @nestjs/* types.
// Uses ts-jest with a dedicated e2e tsconfig to load jest types.

const path = require('path');
const { pathsToModuleNameMapper } = require('ts-jest');

// Resolves to the app root: <repo>/app-system
const appRoot = path.resolve(__dirname, '..', '..');
const { compilerOptions } = require(
  path.join(appRoot, 'tsconfig.json')
);

module.exports = {
  rootDir: appRoot,

  moduleFileExtensions: ['js', 'json', 'ts'],
  testRegex: '.e2e-spec.ts$',

  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: path.join(appRoot, 'tsconfig.e2e.json'),
        diagnostics: { warnOnly: false },
      },
    ],
  },

  testEnvironment: 'node',

  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths, {
      prefix: appRoot + path.sep,
    }),
    '^@nestjs/common$': path.join(
      __dirname, '../../../node_modules/@nestjs/common'
    ),
    '^@nestjs/core$': path.join(
      __dirname, '../../../node_modules/@nestjs/core'
    ),
    '^@nestjs/testing$': path.join(
      __dirname, '../../../node_modules/@nestjs/testing'
    ),
    '^@nestjs/platform-express$': path.join(
      __dirname,
      '../../../node_modules/@nestjs/platform-express'
    ),
  },

  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  detectOpenHandles: true,
  forceExit: true,
  verbose: true,
  passWithNoTests: true,
};
