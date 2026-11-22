// Configuración de Jest para el FRONTEND (Vue 3 + Vite)
module.exports = {
  testEnvironment: 'jsdom',                      // simula el navegador (window, document, localStorage)
  testEnvironmentOptions: { customExportConditions: ['node', 'node-addons'] },
  testMatch: ['<rootDir>/tests/**/*.spec.js'],
  moduleFileExtensions: ['js', 'json', 'vue'],
  transform: {
    '^.+\\.vue$': '@vue/vue3-jest',              // compila los componentes .vue
    '^.+\\.js$': 'babel-jest',                   // convierte import/export para Jest
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|png|jpg|svg)$': '<rootDir>/tests/helpers/archivoVacio.cjs',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/helpers/entorno.js'],
  verbose: true,
  clearMocks: true,                              // reinicia el historial de llamadas entre pruebas
  silent: true,                                  // oculta avisos de consola para una salida limpia
}
