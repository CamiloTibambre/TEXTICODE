// BD simulada: responde según un fragmento del SQL recibido.
// Así las pruebas no tocan Supabase y siempre dan el mismo resultado.
import { jest } from '@jest/globals'

export function crearDbFalsa() {
  let reglas = []
  const consultas = []

  async function query(sql, params = []) {
    consultas.push({ sql, params })
    for (const regla of reglas) {
      if (sql.includes(regla.patron)) {
        let r = typeof regla.respuesta === 'function' ? await regla.respuesta(sql, params) : regla.respuesta
        if (r instanceof Error) throw r
        if (Array.isArray(r)) r = { rows: r }
        return { rowCount: r.rows?.length ?? 0, rows: [], ...r }
      }
    }
    return { rows: [], rowCount: 0 }
  }

  const db = {
    query: jest.fn(query),
    connect: jest.fn(async () => ({ query: jest.fn(query), release: jest.fn() })),
    /** Registra una respuesta. La última registrada tiene prioridad. */
    cuando(patron, respuesta) { reglas.unshift({ patron, respuesta }); return db },
    reiniciar() { reglas = []; consultas.length = 0 },
    consultas,
    ejecuto(patron) { return consultas.some(c => c.sql.includes(patron)) },
    paramsDe(patron) { return consultas.find(c => c.sql.includes(patron))?.params },
  }
  return db
}

/** Error con código de PostgreSQL (23505 = duplicado, 23503 = llave foránea...) */
export function errorPg(code) {
  const e = new Error('error simulado ' + code)
  e.code = code
  return e
}
