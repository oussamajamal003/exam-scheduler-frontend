module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  rootDir: '.',
  roots: ['<rootDir>/tests', '<rootDir>/src'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.ts'],
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.jest.json'
    }
  },
  moduleNameMapper: {
    '^@\\/config\\/env$': '<rootDir>/tests/mocks/env.ts',
    '^@\\/(.*)$': '<rootDir>/src/$1',
    // Map UI primitives to lightweight HTML mocks for tests to avoid Radix/jsdom issues
    '^@/components/ui/(.*)$': '<rootDir>/tests/mocks/components-ui/$1.tsx',
    '^(?:\\.{1,2}/)*components/ui/(.*)$': '<rootDir>/tests/mocks/components-ui/$1.tsx',
  },
  testRegex: '(/tests/.*|(\\.|/)(test|spec))\\.(ts|tsx)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
