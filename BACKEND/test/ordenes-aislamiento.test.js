import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const state = { routes: new Map(), queries: [], rows: [], rowCount: 0, error: null }
const next = (_req, _res, proceed) => proceed()
const pool = {
  async query(sql, params = []) {
    state.queries.push({ sql, params })
    if (state.error && sql.includes(state.error.match)) throw state.error.error
    if (sql.includes('RETURNING "Id_Orden"')) return { rows: [{ Id_Orden: 700 }], rowCount: 1 }
    if (sql.trimStart().startsWith('UPDATE orden_produccion')) return { rows: [], rowCount: state.rowCount }
    if (sql.trimStart().startsWith('DELETE FROM orden_produccion')) return { rows: [], rowCount: state.rowCount }
    if (sql.includes('SELECT op.*')) return { rows: state.rows, rowCount: state.rows.length }
    return { rows: [], rowCount: state.rowCount }
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
  requireRoles: () => next,
  requireSelfParamOrRoles: () => next,
}

let source = await readFile(new URL('../routes/ordenes.js', import.meta.url), 'utf8')
for (const [from, to] of [
  ["import { Router } from 'express'", 'const { Router } = globalThis.__ordenesMocks.express'],
  ["import pool from '../db.js'", 'const pool = globalThis.__ordenesMocks.pool'],
  ["import { hasRole, requireRoles, requireSelfParamOrRoles } from '../middleware/roles.js'", 'const { hasRole, requireRoles, requireSelfParamOrRoles } = globalThis.__ordenesMocks'],
]) {
  assert.ok(source.includes(from), `import a sustituir no encontrado: ${from}`)
  source = source.replace(from, to)
}
globalThis.__ordenesMocks = mocks
await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}#${Math.random()}`)

function reset({ rows = [], rowCount = 0, error = null } = {}) {
  state.queries = []; state.rows = rows; state.rowCount = rowCount; state.error = error
}
function response() {
  return { statusCode: 200, body: null, status(code) { this.statusCode = code; return this }, json(body) { this.body = body; return this } }
}
const auth = { id: 7, rol: 1, empresaId: 42 }
async function call(key, req = {}) {
  const res = response()
  await state.routes.get(key)({ auth, params: {}, query: {}, body: {}, ...req }, res)
  return res
}
const appQueries = () => state.queries.filter(q => q.sql.includes('orden_produccion') || q.sql.includes('orden_operario') || q.sql.includes('usuario_orden'))

test('preparación aislada: sustituye express/db/roles y registra las rutas sin importar env ni procesos', () => {
  for (const key of ['GET /', 'GET /:id', 'POST /', 'PUT /:id', 'DELETE /:id']) assert.ok(state.routes.has(key))
})

test('O1: los listados y la actualización de retrasadas usan empresa del token', async () => {
  for (const key of ['GET /', 'GET /operario/:idOperario', 'GET /cliente/:idCliente', 'GET /estado/:estado']) {
    reset()
    await call(key, { params: { idOperario: '11', idCliente: '12', estado: 'Completada', empresaId: 900 }, query: { Id_Empresa: 901 }, body: { Id_Empresa: 902 } })
    assert.deepEqual(state.queries[0].params, [42], `${key}: helper restringido`)
    const select = state.queries.find(q => q.sql.includes('SELECT op.*'))
    assert.ok(select.sql.includes('op."Id_Empresa"'), `${key}: filtro empresarial`)
    assert.equal(select.params.at(-1), 42)
    assert.match(select.sql, /m\."Id_Empresa"\s*=\s*op\."Id_Empresa"/)
  }
})

test('O2: una orden de otra empresa devuelve 404 en GET/PUT/DELETE', async () => {
  reset()
  const get = await call('GET /:id', { params: { id: '88', Id_Empresa: 900 } })
  assert.equal(get.statusCode, 404)
  assert.deepEqual(state.queries[1].params, ['88', 42])

  for (const key of ['PUT /:id', 'DELETE /:id']) {
    reset()
    const res = await call(key, { params: { id: '88', Id_Empresa: 900 }, body: { Id_Empresa: 901, Estado: 'Completada' } })
    assert.equal(res.statusCode, 404)
    const mutation = appQueries().at(-1)
    assert.equal(mutation.params.at(-1), 42)
    assert.match(mutation.sql, /WHERE[\s\S]*"Id_Empresa"\s*=\s*\$\d+/)
  }
})

test('O3/O6: INSERT toma Id_Empresa del token e ignora valores falsificados del cliente', async () => {
  reset()
  const res = await call('POST /', { auth, body: { Id_Cliente: 3, Id_Material: 4, Descripcion: 'Lote', Cantidad: 1, Fecha_Limite: '2099-01-01', Id_Empresa: 999, empresaId: 998 }, params: { empresaId: 997 }, query: { empresaId: 996 } })
  assert.equal(res.statusCode, 201)
  const insert = state.queries.find(q => q.sql.includes('INSERT INTO orden_produccion'))
  assert.match(insert.sql, /"Id_Empresa"/)
  assert.equal(insert.params.at(-1), 42)
})

test('O4: violación de FK compuesta devuelve 400 sin exponer nombre de restricción', async () => {
  for (const key of ['POST /', 'PUT /:id']) {
    reset({ error: { match: key === 'POST /' ? 'INSERT INTO orden_produccion' : 'UPDATE orden_produccion', error: Object.assign(new Error('fk_op_cliente_empresa'), { code: '23503', constraint: 'fk_op_cliente_empresa' }) } })
    const body = { Id_Cliente: 3, Id_Material: 4, Descripcion: 'Lote', Cantidad: 1, Fecha_Limite: '2099-01-01' }
    const res = await call(key, { params: { id: '70' }, body })
    assert.equal(res.statusCode, 400)
    assert.equal(JSON.stringify(res.body).includes('fk_op_cliente_empresa'), false)
  }
})

test('O5: PUT incluye empresa en UPDATE, incluido el cambio de Estado', async () => {
  reset({ rowCount: 1 })
  const res = await call('PUT /:id', { params: { id: '70', empresaId: 999 }, body: { Id_Cliente: 3, Id_Material: 4, Descripcion: 'Lote', Cantidad: 1, Fecha_Limite: '2099-01-01', Estado: 'Completada', Id_Empresa: 998 } })
  assert.equal(res.statusCode, 200)
  const update = state.queries.find(q => q.sql.trimStart().startsWith('UPDATE orden_produccion'))
  assert.equal(update.params.at(-1), 42)
  assert.match(update.sql, /"Estado"\s*=\s*\$9/)
})

test('O7: el router órdenes no abre transacciones ni usa connect()', async () => {
  const router = await readFile(new URL('../routes/ordenes.js', import.meta.url), 'utf8')
  assert.doesNotMatch(router, /pool\.connect\s*\(|\bBEGIN\b|\bCOMMIT\b|\bROLLBACK\b/)
})

test('O8: suites previas cubren P1–P8, S1–S11 y M1–M8', async () => {
  const [fase61, fase62, materiales] = await Promise.all([
    readFile(new URL('./fase-6-contexto-empresa.test.js', import.meta.url), 'utf8'),
    readFile(new URL('./fase-6-2-superadmin.test.js', import.meta.url), 'utf8'),
    readFile(new URL('./materiales-aislamiento.test.js', import.meta.url), 'utf8'),
  ])
  for (let i = 1; i <= 8; i++) assert.match(fase61, new RegExp(`P${i}:`))
  for (let i = 1; i <= 11; i++) assert.match(fase62, new RegExp(`S${i}:`))
  for (let i = 1; i <= 8; i++) assert.match(materiales, new RegExp(`M${i}`))
})
