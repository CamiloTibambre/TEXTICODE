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

const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: ssl ? { rejectUnauthorized: false } : false
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