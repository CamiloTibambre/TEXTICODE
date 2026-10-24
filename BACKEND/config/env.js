import dotenv from 'dotenv'

dotenv.config()

const REQUIRED = ['DATABASE_URL', 'JWT_SECRET']

export function requireEnv(name) {
  const value = process.env[name]
  if (!value || !String(value).trim()) {
    throw new Error(`Falta configurar la variable de entorno requerida: ${name}`)
  }
  return value
}

export function validateEnv() {
  const missing = REQUIRED.filter(name => !process.env[name] || !String(process.env[name]).trim())
  if (missing.length) {
    throw new Error(`Variables de entorno requeridas no configuradas: ${missing.join(', ')}`)
  }
}

export const env = {
  databaseUrl: requireEnv('DATABASE_URL'),
  jwtSecret: requireEnv('JWT_SECRET'),
  jwtExpires: process.env.JWT_EXPIRES || '8h',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  // Client IDs aceptados como "aud" de un idToken de Google (el web + los móviles, separados por coma).
  googleAllowedAudiences: [process.env.GOOGLE_CLIENT_ID, ...(process.env.GOOGLE_MOBILE_CLIENT_IDS || '').split(',')]
    .map(v => String(v || '').trim())
    .filter(Boolean),
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/google/callback',
  sendgridApiKey: process.env.SENDGRID_API_KEY || '',
  sendgridFromEmail: process.env.SENDGRID_FROM_EMAIL || '',
}
