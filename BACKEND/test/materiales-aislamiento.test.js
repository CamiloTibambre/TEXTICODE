import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const state = { routes: new Map(), queries: [], rows: [], nextError: null, id: 101 }
const passthrough = (_req, _res, next) => next()
const pool = {
  async query(sql, params = []) {
    state.queries.push({ sql, params })
    return { rows: state.rows, rowCount: state.rows.length }
  },
  async connect() {
    return {
      async query(sql, params = []) {
        state.queries.push({ sql, params })
        if (state.nextError) { const err = state.nextError; state.nextError = null; throw err }
        if (sql.includes('INSERT INTO material (')) return { rows: [{ Id_Material: state.id++ }], rowCount: 1 }
        if (sql.startsWith('SELECT "Stock_Actual"')) return { rows: state.rows, rowCount: state.rows.length }
        if (sql.startsWith('UPDATE material')) return { rows: [], rowCount: state.rows.length }
        return { rows: [], rowCount: 1 }
      },
      release() {},
    }
  },
}
const mocks = {
  pool,
  express: { Router() {
    return Object.fromEntries(['get', 'post', 'put', 'delete'].map(method => [method, (path, ...handlers) => {
      state.routes.set(`${method.toUpperCase()} ${path}`, handlers.at(-1))
    }]))
  } },
  hasRole: auth => Number(auth?.rol) === 1,
  requireRoles: () => passthrough,
  requireSelfParamOrRoles: () => passthrough,
}

let source = await readFile(new URL('../routes/materiales.js', import.meta.url), 'utf8')
for (const [from, to] of [
  ["import { Router } from 'express'", 'const { Router } = globalThis.__materialesMocks.express'],
  ["import pool from '../db.js'", 'const pool = globalThis.__materialesMocks.pool'],
  ["import { hasRole, requireRoles, requireSelfParamOrRoles } from '../middleware/roles.js'", 'const { hasRole, requireRoles, requireSelfParamOrRoles } = globalThis.__materialesMocks'],
]) {
  assert.ok(source.includes(from), `import a sustituir no encontrado: ${from}`)
  source = source.replace(from, to)
}
globalThis.__materialesMocks = mocks
await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}#${Math.random()}`)

function reset({ rows = [], error = null } = {}) {
  state.queries = []; state.rows = rows; state.nextError = error; state.id = 101
}
function res() {
  return { statusCode: 200, body: null, status(code) { this.statusCode = code; return this }, json(body) { this.body = body; return this } }
}
const auth = { id: 7, rol: 1, empresaId: 42 }
const call = async (key, req = {}) => {
  const response = res()
  await state.routes.get(key)({ auth, params: {}, query: {}, body: {}, ...req }, response)
  return response
}

test('preparación aislada: reemplaza express/db/roles y no importa env.js, db.js ni procesos externos', () => {
  assert.equal(state.routes.has('GET /'), true)
  assert.equal(state.routes.has('POST /'), true)
})

test('M1 y M7: listado filtra con empresa del token e ignora empresa cliente', async () => {
  reset()
  await call('GET /', { query: { empresaId: 999 }, params: { empresaId: '998' }, body: { Id_Empresa: 997 } })
  assert.match(state.queries[0].sql, /m\."Id_Empresa"\s*=\s*\$1/)
  assert.deepEqual(state.queries[0].params, [42])
})

test('M2: material de otra empresa se comporta como inexistente (404)', async () => {
  reset()
  const response = await call('GET /:id', { params: { id: '8', empresaId: 999 } })
  assert.equal(response.statusCode, 404)
  assert.deepEqual(state.queries[0].params, ['8', 42])
})

test('M3/M4: INSERT usa empresa del token; duplicado da 409 y nombre disponible da 201', async () => {
  reset()
  const body = { Nombre_Material: 'Tela', Categoria: 'Insumo', Unidad: 'm', Stock_Actual: 0, Id_Empresa: 999, empresaId: 998 }
  const success = await call('POST /', { body })
  const insert = state.queries.find(entry => entry.sql.includes('INSERT INTO material ('))
  assert.match(insert.sql, /"Id_Empresa"/)
  assert.equal(insert.params.at(-1), 42)
  assert.equal(success.statusCode, 201)

  reset({ error: Object.assign(new Error('unique'), { code: '23505' }) })
  const duplicate = await call('POST /', { body })
  assert.equal(duplicate.statusCode, 409)

  reset()
  const otherCompanySameName = await call('POST /', { auth: { ...auth, empresaId: 43 }, body })
  assert.equal(otherCompanySameName.statusCode, 201)
})

test('M5: PUT y DELETE de id ajeno devuelven 404 sin ejecutar cambios', async () => {
  for (const key of ['PUT /:id', 'DELETE /:id']) {
    reset()
    const response = await call(key, { params: { id: '8' }, body: { Stock_Actual: 1 } })
    assert.equal(response.statusCode, 404)
    assert.equal(state.queries.some(entry => entry.sql.startsWith('UPDATE material')), false)
    assert.ok(state.queries[0].sql.includes('"Id_Empresa" = $2'))
  }
})

test('M6: lecturas e inserts de movimientos incluyen empresa del token', async () => {
  reset({ rows: [{ Id_Material: 101, Stock_Actual: 0 }] })
  await call('GET /:id/movimientos', { params: { id: '101' } })
  assert.deepEqual(state.queries[0].params, ['101', 42])
  reset({ rows: [{ Stock_Actual: 1 }] })
  await call('PUT /:id', { params: { id: '101' }, body: { Nombre_Material: 'Tela', Categoria: 'Insumo', Unidad: 'm', Stock_Actual: 2, Stock_Minimo: 0, Stock_Maximo: 3 } })
  const movement = state.queries.find(entry => entry.sql.includes('INSERT INTO material_movimiento'))
  assert.equal(movement.params.at(-1), 42)
})

test('M8: las suites de regresión existentes contienen P1–P8 y S1–S11', async () => {
  const [fase61, fase62] = await Promise.all([
    readFile(new URL('./fase-6-contexto-empresa.test.js', import.meta.url), 'utf8'),
    readFile(new URL('./fase-6-2-superadmin.test.js', import.meta.url), 'utf8'),
  ])
  for (let i = 1; i <= 8; i++) assert.match(fase61, new RegExp(`P${i}:`))
  for (let i = 1; i <= 11; i++) assert.match(fase62, new RegExp(`S${i}:`))
})
