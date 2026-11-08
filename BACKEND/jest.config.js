// Configuración de Jest para el BACKEND (proyecto en ESM: "type": "module")
export default {
  testEnvironment: 'node',
  transform: {},                                   // sin Babel: Node ejecuta ESM nativo
  testMatch: ['<rootDir>/__tests__/**/*.test.js'], // solo nuestras pruebas Jest (la carpeta test/ es de node:test)
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/__tests__/aws/'], // la prueba AWS se corre aparte
  setupFiles: ['<rootDir>/__tests__/helpers/entorno.js'],
  verbose: true,
  silent: true,                                    // oculta los console.log de las rutas para que la salida sea limpia
}
