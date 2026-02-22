/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Mock Supabase client pour isoler les tests unitaires du backend Supabase
    '^.*/supabaseClient$': '<rootDir>/src/lib/__tests__/__mocks__/supabaseClient.ts',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        // Utilise le tsconfig du projet (strict, exactOptionalPropertyTypes, etc.)
        tsconfig: {
          strict: true,
          exactOptionalPropertyTypes: true,
          noUncheckedIndexedAccess: true,
          esModuleInterop: true,
          resolveJsonModule: true,
          module: 'commonjs',
          moduleResolution: 'node',
          target: 'ES2017',
          skipLibCheck: true,
          baseUrl: '.',
          paths: { '@/*': ['./src/*'] },
        },
      },
    ],
  },
  setupFiles: ['<rootDir>/src/lib/__tests__/jest.setup.ts'],
  collectCoverageFrom: [
    'src/lib/**/*.ts',
    '!src/lib/**/*.test.ts',
    '!src/lib/__tests__/**',
  ],
};

module.exports = config;
