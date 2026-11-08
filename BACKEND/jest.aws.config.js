// Configuración SOLO para la prueba de integración que se ejecuta en el servidor AWS
export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['<rootDir>/__tests__/aws/**/*.test.js'],
  verbose: true,
}
