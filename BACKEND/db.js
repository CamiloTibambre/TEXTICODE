import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // requerido por Supabase
})

// Verificar conexión al iniciar
try {
  const client = await pool.connect()
  console.log('✅ Conectado a Supabase PostgreSQL')
  client.release()
} catch (err) {
  console.error('❌ Error conectando a Supabase:', err.message)
  process.exit(1)
}

export default pool