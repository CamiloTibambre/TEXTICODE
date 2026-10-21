import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const state = {
  routes: new Map(), queries: [], rows: [], nextError: null, errorAt: null,
  id: 101, transactions: [], releaseCount: 0, mutationCount: 0,
}
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
        const command = sql.trim().toUpperCase()
        if (command === 'BEGIN' || command === 'COMMIT' || command === 'ROLLBACK') {
          state.transactions.push(command)
          return { rows: [], rowCount: 0 }
        }
        if (state.errorAt && sql.includes(state.errorAt)) {
          const err = state.nextError || new Error('mock exception')
          state.errorAt = null; state.nextError = null
          throw err
        }
        if (sql.includes('INSERT INTO material (')) return { rows: [{ Id_Material: state.id++ }], rowCount: 1 }
        if (sql.startsWith('SELECT "Stock_Actual"')) return { rows: state.rows, rowCount: state.rows.length }
        if (sql.startsWith('UPDATE material')) {
          state.mutationCount++
          return { rows: [], rowCount: state.rows.length || 1 }
        }
        return { rows: [], rowCount: 1 }
      },
      release() { state.releaseCount++ },
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

function reset({ rows = [], error = null, errorAt = null } = {}) {
  state.queries = []; state.rows = rows; state.nextError = error; state.errorAt = errorAt
  state.id = 101; state.transactions = []; state.releaseCount = 0; state.mutationCount = 0
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

  reset({ errorAt: 'INSERT INTO material (', error: Object.assign(new Error('unique'), { code: '23505' }) })
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
    const applicationQueries = state.queries.filter(entry => !['BEGIN', 'COMMIT', 'ROLLBACK'].includes(entry.sql.trim().toUpperCase()))
    assert.equal(applicationQueries.length, 1)
    assert.ok(applicationQueries[0].sql.includes('"Id_Empresa" = $2'))
    assert.equal(applicationQueries[0].params.at(-1), 42)
    assert.equal(state.mutationCount, 0)
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

const txRequests = {
  post: { key: 'POST /', params: {}, body: { Nombre_Material: 'M', Categoria: 'C', Unidad: 'u', Stock_Actual: 2 } },
  put: { key: 'PUT /:id', params: { id: '101' }, body: { Nombre_Material: 'M', Categoria: 'C', Unidad: 'u', Stock_Actual: 2, Stock_Minimo: 0, Stock_Maximo: 5 } },
  delete: { key: 'DELETE /:id', params: { id: '101' }, body: {} },
}

async function checkTransaction(route, scenario) {
  const setup = { rows: route === 'post' ? [] : [{ Stock_Actual: 1 }] }
  if (scenario === '404') setup.rows = []
  if (scenario === 'sql-error') {
    setup.errorAt = route === 'post' || route === 'put' || route === 'delete'
      ? 'INSERT INTO material_movimiento' : null
    setup.error = Object.assign(new Error('simulated database error'), { code: '23503' })
  }
  if (scenario === 'exception') {
    setup.errorAt = route === 'post' ? 'INSERT INTO material (' : 'UPDATE material'
    setup.error = new Error('simulated exception')
  }
  reset(setup)
  const item = txRequests[route]
  const response = await call(item.key, { params: item.params, body: item.body })
  const should404 = scenario === '404'
  assert.equal(response.statusCode, should404 ? 404 : scenario === 'success' ? (route === 'post' ? 201 : 200) : scenario === 'sql-error' ? 400 : 500)
  assert.equal(state.releaseCount, 1, `${route}/${scenario}: release una vez`)
  assert.deepEqual(state.transactions, ['BEGIN', should404 || scenario !== 'success' ? 'ROLLBACK' : 'COMMIT'])
}

for (const route of ['post', 'put', 'delete']) {
  test(`TX ${route.toUpperCase()} éxito: confirma transacción y libera una vez`, () => checkTransaction(route, 'success'))
  if (route !== 'post') test(`TX ${route.toUpperCase()} 404: revierte y libera una vez`, () => checkTransaction(route, '404'))
  test(`TX ${route.toUpperCase()} error SQL: revierte y libera una vez`, () => checkTransaction(route, 'sql-error'))
  test(`TX ${route.toUpperCase()} excepción: revierte y libera una vez`, () => checkTransaction(route, 'exception'))
}
