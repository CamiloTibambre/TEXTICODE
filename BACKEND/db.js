import pg from 'pg'
import { env } from './config/env.js'

const { Pool } = pg

const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: { rejectUnauthorized: false } // requerido por Supabase
})

export async function checkDatabaseConnection() {
  const client = await pool.connect()
  try {
    console.log('✅ Conectado a Supabase PostgreSQL')
  } finally {
    client.release()
  }
}

export default pool
