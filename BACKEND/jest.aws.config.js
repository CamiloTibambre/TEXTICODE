// Configuración SOLO para la prueba de integración que se ejecuta en el servidor AWS
export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['<rootDir>/__tests__/aws/**/*.test.js'],
  testTimeout: 30000, // las llamadas son reales (AWS + Supabase), necesitan más margen que los 5 s por defecto
  verbose: true,
}