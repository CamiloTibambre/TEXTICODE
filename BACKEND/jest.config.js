export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['<rootDir>/__tests__/**/*.test.js'],
  testPathIgnorePatterns: ['/__tests__/aws/'],
  setupFiles: ['<rootDir>/__tests__/helpers/entorno.js'],
  verbose: true,
  clearMocks: true,
}
