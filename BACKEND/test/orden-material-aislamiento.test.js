import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const state = {
  routes: new Map(), queries: [], stockRows: [{ Stock_Actual: 10 }],
  allocationRows: [{ Cantidad_Usada: 2 }], deleteCount: 1,
  failAt: null, failError: null, pendingWrites: [], committedWrites: 0,
  commits: 0, rollbacks: 0, releases: 0,
}
const pass = (_req, _res, next) => next()
const pool = {
  async query(sql, params = []) {
    state.queries.push({ sql, params, connection: 'pool' })
    return { rows: [], rowCount: 0 }
  },
  async connect() {
    return {
      async query(sql, params = []) {
        state.queries.push({ sql, params, connection: 'client' })
        const normalized = sql.trim().toUpperCase()
        if (normalized === 'BEGIN') return { rows: [], rowCount: 0 }
        if (normalized === 'COMMIT') {
          state.commits++
          state.committedWrites += state.pendingWrites.length
          state.pendingWrites = []
          return { rows: [], rowCount: 0 }
        }
        if (normalized === 'ROLLBACK') {
          state.rollbacks++
          state.pendingWrites = []
          return { rows: [], rowCount: 0 }
        }
        if (state.failAt && sql.includes(state.failAt)) {
          state.failAt = null
          throw state.failError
        }
        if (/^(INSERT|UPDATE|DELETE)\b/i.test(sql.trim())) state.pendingWrites.push(sql.trim())
        if (sql.includes('SELECT "Stock_Actual"')) return { rows: state.stockRows, rowCount: state.stockRows.length }
        if (sql.includes('SELECT "Cantidad_Usada"')) return { rows: state.allocationRows, rowCount: state.allocationRows.length }
        if (sql.includes('DELETE FROM orden_material')) {
          return { rows: state.deleteCount ? [{ Cantidad_Usada: 2 }] : [], rowCount: state.deleteCount }
        }
        if (sql.includes('UPDATE orden_material')) return { rows: [], rowCount: state.allocationRows.length ? 1 : 0 }
        return { rows: [], rowCount: 1 }
      },
      release() { state.releases++ },
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
}

let source = await readFile(new URL('../routes/orden_material.js', import.meta.url), 'utf8')
for (const [from, to] of [
  ["import { Router } from 'express'", 'const { Router } = globalThis.__omMocks.express'],
  ["import pool from '../db.js'", 'const pool = globalThis.__omMocks.pool'],
]) {
  assert.ok(source.includes(from), `import a sustituir no encontrado: ${from}`)
  source = source.replace(from, to)
}
globalThis.__omMocks = mocks
await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}#${Math.random()}`)

function reset({ stockRows = [{ Stock_Actual: 10 }], allocationRows = [{ Cantidad_Usada: 2 }], deleteCount = 1, failAt = null, failError = null } = {}) {
  Object.assign(state, { queries: [], stockRows, allocationRows, deleteCount, failAt, failError,
    pendingWrites: [], committedWrites: 0, commits: 0, rollbacks: 0, releases: 0 })
}
function response() {
  return { statusCode: 200, body: null, status(code) { this.statusCode = code; return this }, json(body) { this.body = body; return this } }
}
const auth = { id: 9, empresaId: 42, rol: 1 }
async function call(key, req = {}) {
  const res = response()
  await state.routes.get(key)({ auth, body: {}, params: {}, query: {}, ...req }, res)
  return res
}
const postBody = { Id_Orden: 100, Id_Producto: 200, Cantidad_Usada: 2 }
const putBody = { Cantidad_Usada: 3 }

test('preparación aislada: router usa dobles y no importa db/env ni procesos externos', () => {
  for (const key of ['GET /orden/:idOrden', 'POST /', 'PUT /:idOrden/:idProducto', 'DELETE /:idOrden/:idProducto']) assert.ok(state.routes.has(key))
})

test('OM1/OM6: listado enlaza material por empresa e ignora empresa del cliente', async () => {
  reset()
  await call('GET /orden/:idOrden', {
    params: { idOrden: '100', empresaId: 901 }, query: { empresaId: 902 }, body: { Id_Empresa: 903 },
  })
  const query = state.queries[0]
  assert.match(query.sql, /om\."Id_Empresa"\s*=\s*\$2/)
  assert.match(query.sql, /m\."Id_Empresa"\s*=\s*om\."Id_Empresa"/)
  assert.deepEqual(query.params, ['100', 42])
})

test('OM2: material ajeno es 404; orden ajena falla con 400 y la transacción no confirma escrituras', async () => {
  reset({ stockRows: [] })
  const otherMaterial = await call('POST /', { body: postBody })
  assert.equal(otherMaterial.statusCode, 404)
  assert.equal(state.committedWrites, 0)
  assert.equal(state.releases, 1)

  reset({ failAt: 'INSERT INTO orden_material', failError: Object.assign(new Error('foreign key violation'), { code: '23503', constraint: 'fk_om_orden_empresa' }) })
  const otherOrder = await call('POST /', { body: postBody })
  assert.equal(otherOrder.statusCode, 400)
  assert.equal(state.committedWrites, 0)
  assert.equal(state.rollbacks, 1)
  assert.equal(state.queries.some(q => q.sql.includes('UPDATE material SET')), false)
  assert.equal(JSON.stringify(otherOrder.body).includes('fk_om_orden_empresa'), false)
})

test('OM3: POST incluye empresa del token en orden_material y material_movimiento', async () => {
  reset()
  const res = await call('POST /', {
    body: { ...postBody, Id_Empresa: 999, empresaId: 998 },
    query: { Id_Empresa: 997, empresaId: 996 },
    params: { Id_Empresa: 995, empresaId: 994 },
  })
  assert.equal(res.statusCode, 201)
  const allocation = state.queries.find(q => q.sql.includes('INSERT INTO orden_material'))
  const movement = state.queries.find(q => q.sql.includes('INSERT INTO material_movimiento'))
  assert.match(allocation.sql, /"Id_Empresa"/)
  assert.match(movement.sql, /"Id_Empresa"/)
  assert.equal(allocation.params.at(-1), 42)
  assert.equal(movement.params.at(-1), 42)
})

test('OM4: cada UPDATE de stock acota Id_Material e Id_Empresa', async () => {
  const requests = [
    ['POST /', { body: postBody }],
    ['PUT /:idOrden/:idProducto', { params: { idOrden: '100', idProducto: '200' }, body: putBody }],
    ['DELETE /:idOrden/:idProducto', { params: { idOrden: '100', idProducto: '200' } }],
  ]
  for (const [key, req] of requests) {
    reset()
    await call(key, { ...req, body: { ...(req.body || {}), Id_Empresa: 900, empresaId: 901 }, query: { empresaId: 902 }, params: { ...(req.params || {}), Id_Empresa: 903, empresaId: 904 } })
    const stockUpdates = state.queries.filter(q => q.sql.includes('UPDATE material SET "Stock_Actual"'))
    assert.ok(stockUpdates.length > 0, `${key}: no se registró UPDATE de stock`)
    for (const update of stockUpdates) {
      assert.match(update.sql, /WHERE[\s\S]*"Id_Empresa"\s*=\s*\$\d+/)
      assert.equal(update.params.at(-1), 42)
    }
  }
})

test('OM5: editar y quitar asignación ajena devuelven 404 sin mutar stock', async () => {
  reset({ allocationRows: [] })
  const put = await call('PUT /:idOrden/:idProducto', { params: { idOrden: '100', idProducto: '200' }, body: putBody })
  assert.equal(put.statusCode, 404)
  assert.equal(state.pendingWrites.length, 0)
  assert.equal(state.rollbacks, 1)

  reset({ deleteCount: 0 })
  const del = await call('DELETE /:idOrden/:idProducto', { params: { idOrden: '100', idProducto: '200' } })
  assert.equal(del.statusCode, 404)
  assert.equal(state.queries.some(q => q.sql.includes('UPDATE material SET')), false)
  assert.equal(state.rollbacks, 1)
})

test('OM8: error al insertar movimiento revierte asignación y descuento anteriores', async () => {
  reset({ failAt: 'INSERT INTO material_movimiento', failError: Object.assign(new Error('fallo simulado'), { code: '23503' }) })
  const res = await call('POST /', { body: postBody })
  assert.equal(res.statusCode, 400)
  assert.equal(state.queries.some(q => q.sql.includes('INSERT INTO orden_material')), true)
  assert.equal(state.queries.some(q => q.sql.includes('UPDATE material SET')), true)
  assert.equal(state.commits, 0)
  assert.equal(state.committedWrites, 0)
  assert.equal(state.pendingWrites.length, 0)
  assert.equal(state.rollbacks, 1)
  assert.equal(state.releases, 1)
})

test('OM7: cada ruta transaccional libera una vez y confirma/revierte según camino', async () => {
  const scenarios = [
    { route: 'POST /', req: { body: postBody }, status: 201 },
    { route: 'POST /', req: { body: postBody }, options: { stockRows: [] }, status: 404 },
    { route: 'POST /', req: { body: postBody }, options: { failAt: 'INSERT INTO orden_material', failError: Object.assign(new Error('SQL'), { code: '23505' }) }, status: 409 },
    { route: 'POST /', req: { body: postBody }, options: { failAt: 'UPDATE material SET', failError: new Error('exception') }, status: 500 },
    { route: 'PUT /:idOrden/:idProducto', req: { params: { idOrden: '1', idProducto: '2' }, body: putBody }, status: 200 },
    { route: 'PUT /:idOrden/:idProducto', req: { params: { idOrden: '1', idProducto: '2' }, body: putBody }, options: { allocationRows: [] }, status: 404 },
    { route: 'PUT /:idOrden/:idProducto', req: { params: { idOrden: '1', idProducto: '2' }, body: putBody }, options: { failAt: 'UPDATE orden_material', failError: Object.assign(new Error('SQL'), { code: '23503' }) }, status: 400 },
    { route: 'PUT /:idOrden/:idProducto', req: { params: { idOrden: '1', idProducto: '2' }, body: putBody }, options: { failAt: 'UPDATE material SET', failError: new Error('exception') }, status: 500 },
    { route: 'DELETE /:idOrden/:idProducto', req: { params: { idOrden: '1', idProducto: '2' } }, status: 200 },
    { route: 'DELETE /:idOrden/:idProducto', req: { params: { idOrden: '1', idProducto: '2' } }, options: { deleteCount: 0 }, status: 404 },
    { route: 'DELETE /:idOrden/:idProducto', req: { params: { idOrden: '1', idProducto: '2' } }, options: { failAt: 'UPDATE material SET', failError: Object.assign(new Error('SQL'), { code: '23503' }) }, status: 400 },
    { route: 'DELETE /:idOrden/:idProducto', req: { params: { idOrden: '1', idProducto: '2' } }, options: { failAt: 'INSERT INTO material_movimiento', failError: new Error('exception') }, status: 500 },
  ]
  for (const scenario of scenarios) {
    reset(scenario.options)
    const res = await call(scenario.route, scenario.req)
    assert.equal(res.statusCode, scenario.status, `${scenario.route} status`)
    assert.equal(state.releases, 1, `${scenario.route}: release una vez`)
    if (scenario.status === 201 || scenario.status === 200) {
      assert.equal(state.commits, 1, `${scenario.route}: COMMIT`)
      assert.equal(state.rollbacks, 0, `${scenario.route}: no ROLLBACK`)
    } else {
      assert.equal(state.commits, 0, `${scenario.route}: no COMMIT`)
      assert.equal(state.rollbacks, 1, `${scenario.route}: ROLLBACK`)
    }
  }
})

test('OM9: suites de regresión previas incluyen P, S, M, TX y O', async () => {
  const [phase61, phase62, materials, orders] = await Promise.all([
    readFile(new URL('./fase-6-contexto-empresa.test.js', import.meta.url), 'utf8'),
    readFile(new URL('./fase-6-2-superadmin.test.js', import.meta.url), 'utf8'),
    readFile(new URL('./materiales-aislamiento.test.js', import.meta.url), 'utf8'),
    readFile(new URL('./ordenes-aislamiento.test.js', import.meta.url), 'utf8'),
  ])
  for (let i = 1; i <= 8; i++) assert.match(phase61, new RegExp(`P${i}:`))
  for (let i = 1; i <= 11; i++) assert.match(phase62, new RegExp(`S${i}:`))
  assert.match(materials, /TX \$\{route\.toUpperCase\(\)\} éxito/)
  assert.match(materials, /M1/)
  assert.match(orders, /O1:/)
})
