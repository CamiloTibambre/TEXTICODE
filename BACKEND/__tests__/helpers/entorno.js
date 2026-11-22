// Valores ficticios: las pruebas locales nunca cargan credenciales del .env.
// La base de datos real NO se usa: cada prueba reemplaza db.js por una BD simulada.
process.env.NODE_ENV = 'test'
process.env.DOTENV_CONFIG_QUIET = 'true'
process.env.DATABASE_URL = 'postgres://falso:falso@127.0.0.1:1/texticode_jest'
process.env.JWT_SECRET = 'solo-pruebas-locales-texticode-no-produccion'
process.env.FRONTEND_URL = 'http://localhost:5173'
process.env.GOOGLE_CLIENT_ID = 'cliente-jest.apps.googleusercontent.com'
process.env.GOOGLE_CLIENT_SECRET = 'secreto-ficticio'
process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3001/api/google/callback'
process.env.SENDGRID_API_KEY = ''
process.env.SENDGRID_FROM_EMAIL = 'no-reply@texticode.test'
