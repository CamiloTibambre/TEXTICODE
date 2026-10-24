import fs from 'fs'
import pg from 'pg'
import { env } from './config/env.js'

const { Pool } = pg

// Detecta si la base es local (Docker) o remota (Supabase)
function usarSSL(connectionString) {
  if (process.env.DB_SSL === 'true') return true
  if (process.env.DB_SSL === 'false') return false

  try {
    const host = new URL(connectionString).hostname
    return !['localhost', '127.0.0.1', 'db', 'texticode-db'].includes(host)
  } catch {
    return true
  }
}

const ssl = usarSSL(env.databaseUrl)

// CA del servidor (Supabase: Project Settings → Database → SSL certificate).
// DB_SSL_CA admite la ruta a un .crt/.pem o el PEM pegado directamente.
function leerCA() {
  const valor = process.env.DB_SSL_CA
  if (!valor || !valor.trim()) return undefined
  if (valor.includes('-----BEGIN')) return valor.replace(/\\n/g, '\n')
  return fs.readFileSync(valor, 'utf8')
}

// Por defecto se verifica el certificado del servidor (evita ataques de intermediario).
// DB_SSL_REJECT_UNAUTHORIZED=false lo desactiva de forma explícita, solo como medida temporal.
function configuracionSSL() {
  if (!ssl) return false
  const verificar = process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
  if (!verificar) {
    console.warn('⚠️  DB_SSL_REJECT_UNAUTHORIZED=false: la conexión a la base NO verifica el certificado del servidor.')
  }
  return { rejectUnauthorized: verificar, ca: leerCA() }
}

// Los parámetros ssl* de la URL pisan la configuración de arriba en pg; se quitan para que mande el código.
function urlSinParametrosSSL(connectionString) {
  if (!ssl) return connectionString
  try {
    const url = new URL(connectionString)
    for (const p of ['sslmode', 'ssl', 'sslrootcert', 'sslcert', 'sslkey', 'uselibpqcompat']) url.searchParams.delete(p)
    return url.toString()
  } catch {
    return connectionString
  }
}

const pool = new Pool({
  connectionString: urlSinParametrosSSL(env.databaseUrl),
  ssl: configuracionSSL(),
})

export async function checkDatabaseConnection() {
  const client = await pool.connect()
  try {
    const { rows } = await client.query('SELECT current_database() AS db, inet_server_port() AS puerto')
    const origen = ssl ? 'Supabase PostgreSQL' : 'PostgreSQL local (Docker)'
    console.log(`✅ Conectado a ${origen} → base "${rows[0].db}", puerto ${rows[0].puerto ?? 'local'}`)
  } finally {
    client.release()
  }
}

export default pool