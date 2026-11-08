// Variables de entorno mínimas para que config/env.js no falle al importarse.
// La base de datos real NO se usa: cada prueba reemplaza db.js por una BD simulada.
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = 'secreto-solo-para-pruebas-jest'
process.env.FRONTEND_URL = 'http://localhost:5173'
process.env.SENDGRID_FROM_EMAIL = 'no-reply@texticode.test'
process.env.GOOGLE_CLIENT_ID = 'cliente-web.apps.googleusercontent.com'
process.env.GOOGLE_CLIENT_SECRET = 'secreto-google-prueba'
