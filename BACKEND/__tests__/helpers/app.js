// Carga la app de Express con db.js y SendGrid reemplazados por dobles de prueba.
// En ESM hay que registrar los mocks ANTES de importar la app.
import { jest } from '@jest/globals'
import { crearDbFalsa } from './dbFalsa.js'

export async function cargarApp() {
  const db = crearDbFalsa()
  const sendgrid = { setApiKey: jest.fn(), send: jest.fn(async () => [{ statusCode: 202 }]) }

  jest.unstable_mockModule('../../db.js', () => ({ default: db, checkDatabaseConnection: jest.fn() }))
  jest.unstable_mockModule('@sendgrid/mail', () => ({ default: sendgrid }))

  const { app } = await import('../../index.js')
  return { app, db, sendgrid }
}
