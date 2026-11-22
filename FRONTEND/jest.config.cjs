module.exports = {
  testEnvironment: 'jsdom',
  testEnvironmentOptions: { customExportConditions: ['node', 'node-addons'] },
  testMatch: ['<rootDir>/tests/**/*.spec.js'],
  moduleFileExtensions: ['js', 'json', 'vue'],
  transform: { '^.+\\.vue$': '@vue/vue3-jest', '^.+\\.js$': 'babel-jest' },
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1', '\\.(css|png|jpg|svg)$': '<rootDir>/tests/helpers/archivoVacio.cjs' },
  setupFilesAfterEnv: ['<rootDir>/tests/helpers/entorno.js'],
  verbose: true, clearMocks: true,
}
