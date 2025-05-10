import type { Config } from 'jest';

const config: Config = {
  testTimeout: 30000,
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.ts'],
};

export default config;
