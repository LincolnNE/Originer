/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  modulePathIgnorePatterns: ['<rootDir>/frontend/'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      { tsconfig: '<rootDir>/tsconfig.jest.json' },
    ],
  },
};
