module.exports = {
  moduleNameMapper: {
    '@core/(.*)': '<rootDir>/src/app/core/$1',
  },
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/e2e/', 'abstract*'],
  transformIgnorePatterns: [`<rootDir>/node_modules/(?!.*\\.mjs$|lodash-es)`],
  moduleNameMapper: {
    '^src/(.*)': '<rootDir>/src/$1',
  },
}
