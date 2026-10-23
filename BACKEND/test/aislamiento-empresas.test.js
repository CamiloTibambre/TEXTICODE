// Prueba de aislamiento entre empresas (multi-tenant).
//
// Qué hace: crea dos empresas DESECHABLES (A y B) con datos propios directamente en la BD,
// inicia sesión por HTTP como admin de B y comprueba que NO puede ver, modificar ni borrar
// los datos de A. Al final borra todo lo que creó.
//
// Cómo correrla (backend corriendo en Docker, puerto 3001):
//   cd BACKEND
//   node --test test/aislamiento-empresas.test.js
//
// Seguridad: se niega a correr si DATABASE_URL no apunta a una BD local.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import bcrypt from 'bcryptjs'
import pool from '../db.js'

const API = process.env.TEST_API_URL || 'http://localhost:3001'
const SFX = Date.now().toString(36)
const PASS = 'Aislamiento#2026x'
const ctx = { A: {}, B: {}, empresas: [], usuarios: [] }

function hostDeLaBD() {
  const url = process.env.DATABASE_URL || pool.options?.connectionString || ''
  try { return new URL(url).hostname } catch { return pool.options?.host || '' }
}

async function http(method, path, token, body) {
  const res = await fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const texto = await res.text()
  let json = null
  try { json = JSON.parse(texto) } catch { /* no es JSON */ }
  return { status: res.status, json, texto }
}
const ok = (s) => s >= 200 && s < 300

async function crearEmpresa(letra) {
  const t = ctx[letra]
  const e = await pool.query(
    `INSERT INTO empresa ("Nombre_Empresa","Slug","Estado") VALUES ($1,$2,'activa') RETURNING "Id_Empresa"`,
    [`Aislamiento ${letra} ${SFX}`, `aisl-${letra.toLowerCase()}-${SFX}`])
  t.empresa = e.rows[0].Id_Empresa
  ctx.empresas.push(t.empresa)
  await pool.query(`INSERT INTO empresa_config ("Id_Empresa") VALUES ($1)`, [t.empresa])

  const hash = await bcrypt.hash(PASS, 10)
  const rolAdmin = (await pool.query(`SELECT "Id_Rol" FROM rol WHERE lower(trim("Nombre_Rol")) IN ('admin','administrador') LIMIT 1`)).rows[0].Id_Rol
  const rolCliente = (await pool.query(`SELECT "Id_Rol" FROM rol WHERE lower(trim("Nombre_Rol")) = 'cliente' LIMIT 1`)).rows[0].Id_Rol

  async function usuario(nombreUsuario, nombreCompleto, rol) {
    const u = await pool.query(
      `INSERT INTO usuario ("Id_Rol","Nombre_Completo","Nombre_Usuario","Correo","Contrasena","Estado")
       VALUES ($1,$2,$3,$4,$5,'activo') RETURNING "Id_Usuario"`,
      [rol, nombreCompleto, nombreUsuario, `${nombreUsuario}@aislamiento.test`, hash])
    const id = u.rows[0].Id_Usuario
    ctx.usuarios.push(id)
    await pool.query(
      `INSERT INTO usuario_empresa ("Id_Usuario","Id_Empresa","Id_Rol","Estado","Es_Principal")
       VALUES ($1,$2,$3,'activo',true)`, [id, t.empresa, rol])
    return id
  }

  t.adminUser = `aisl_admin_${letra}_${SFX}`
  t.adminId = await usuario(t.adminUser, `Admin ${letra} ${SFX}`, rolAdmin)
  t.clienteMarca = `Cliente${letra}${SFX}`
  t.clienteUser = `aisl_cli_${letra}_${SFX}`
  t.clienteId = await usuario(t.clienteUser, t.clienteMarca, rolCliente)

  t.materialMarca = `MAT_${letra}_${SFX}`
  const m = await pool.query(
    `INSERT INTO material ("Id_Empresa","Nombre_Material","Categoria","Unidad","Stock_Actual","Stock_Maximo","Stock_Minimo")
     VALUES ($1,$2,'Prueba','kg',100,200,1) RETURNING "Id_Material"`, [t.empresa, t.materialMarca])
  t.materialId = m.rows[0].Id_Material

  t.ordenMarca = `ORD_${letra}_${SFX}`
  const o = await pool.query(
    `INSERT INTO orden_produccion ("Id_Empresa","Id_Cliente","Id_Material","Producto","Descripcion","Cantidad","Fecha_Limite")
     VALUES ($1,$2,$3,$4,$4,10,CURRENT_DATE + 30) RETURNING "Id_Orden"`,
    [t.empresa, t.clienteId, t.materialId, t.ordenMarca])
  t.ordenId = o.rows[0].Id_Orden

  const c = await pool.query(
    `INSERT INTO comprobantes ("Id_Empresa","Id_Orden","Id_Usuario") VALUES ($1,$2,$3) RETURNING "Id_Comprobante"`,
    [t.empresa, t.ordenId, t.clienteId])
  t.comprobanteId = c.rows[0].Id_Comprobante

  const login = await http('POST', '/api/usuarios/login', null, { correo: `${t.adminUser}@aislamiento.test`, contrasena: PASS })
  assert.equal(login.status, 200, `login admin ${letra} falló: ${login.texto}`)
  t.token = login.json.token
  assert.ok(t.token, `login admin ${letra} sin token`)
}

before(async () => {
  const host = hostDeLaBD()
  if (!['localhost', '127.0.0.1', 'texticode-db', 'db', '::1'].includes(host)) {
    throw new Error(`Se niega a correr: la BD "${host}" no parece local. Esta prueba crea y borra datos.`)
  }
  await crearEmpresa('A')
  await crearEmpresa('B')
})

after(async () => {
  const e = ctx.empresas, u = ctx.usuarios
  try {
    if (e.length) {
      for (const t of ['comprobantes', 'orden_operario', 'usuario_orden', 'orden_material', 'material_movimiento', 'observacion_operario', 'orden_produccion', 'material', 'google_calendar_tokens'])
        await pool.query(`DELETE FROM ${t} WHERE "Id_Empresa" = ANY($1::int[])`, [e])
      await pool.query(`DELETE FROM usuario_empresa WHERE "Id_Empresa" = ANY($1::int[])`, [e])
    }
    if (u.length) await pool.query(`DELETE FROM usuario WHERE "Id_Usuario" = ANY($1::int[])`, [u])
    if (e.length) {
      await pool.query(`DELETE FROM empresa_config WHERE "Id_Empresa" = ANY($1::int[])`, [e])
      await pool.query(`DELETE FROM empresa WHERE "Id_Empresa" = ANY($1::int[])`, [e])
    }
  } finally {
    await pool.end()
  }
})

const A = () => ctx.A
const B = () => ctx.B

// ── Control positivo: la prueba no es vacía ──────────────────────────────
test('control: admin A ve sus propios datos', async () => {
  const u = await http('GET', '/api/usuarios', A().token)
  assert.equal(u.status, 200)
  assert.ok(u.texto.includes(A().clienteUser), 'admin A no ve a su propio cliente')
  const o = await http('GET', '/api/ordenes', A().token)
  assert.equal(o.status, 200)
  assert.ok(o.texto.includes(A().ordenMarca), 'admin A no ve su propia orden')
  const m = await http('GET', '/api/materiales', A().token)
  assert.equal(m.status, 200)
  assert.ok(m.texto.includes(A().materialMarca), 'admin A no ve su propio material')
})

// ── Listados ─────────────────────────────────────────────────────────────
test('listados de B no contienen datos de A', async () => {
  for (const [ruta, marca] of [
    ['/api/usuarios', A().clienteUser],
    ['/api/ordenes', A().ordenMarca],
    ['/api/materiales', A().materialMarca],
    ['/api/comprobantes', A().ordenMarca],
    ['/api/comprobantes', A().clienteMarca],
  ]) {
    const r = await http('GET', ruta, B().token)
    assert.ok(!r.texto.includes(marca), `${ruta} (admin B) filtró "${marca}" de la empresa A`)
  }
})

// ── Lectura por id ───────────────────────────────────────────────────────
test('B no puede leer por id registros de A', async () => {
  for (const ruta of [
    `/api/usuarios/${A().clienteId}`,
    `/api/ordenes/${A().ordenId}`,
    `/api/materiales/${A().materialId}`,
    `/api/comprobantes/${A().comprobanteId}`,
  ]) {
    const r = await http('GET', ruta, B().token)
    assert.ok(!ok(r.status), `GET ${ruta} con token de B devolvió ${r.status}`)
    assert.ok(!r.texto.includes(A().ordenMarca) && !r.texto.includes(A().clienteUser) && !r.texto.includes(A().materialMarca),
      `GET ${ruta} con token de B filtró datos de A`)
  }
})

// ── Modificación y borrado ───────────────────────────────────────────────
test('B no puede modificar registros de A', async () => {
  const intentos = [
    ['PUT', `/api/usuarios/${A().clienteId}`, { Nombre_Completo: 'HACK B' }],
    ['PUT', `/api/ordenes/${A().ordenId}`, { Descripcion: 'HACK B', Cantidad: 1 }],
    ['PUT', `/api/materiales/${A().materialId}`, { Nombre_Material: 'HACK B' }],
    ['PUT', `/api/comprobantes/${A().comprobanteId}`, { Estado: 'Pagado' }],
  ]
  for (const [m, ruta, body] of intentos) {
    const r = await http(m, ruta, B().token, body)
    assert.ok(!ok(r.status), `${m} ${ruta} con token de B devolvió ${r.status}`)
  }
  const cli = (await pool.query(`SELECT "Nombre_Completo" FROM usuario WHERE "Id_Usuario"=$1`, [A().clienteId])).rows[0]
  const ord = (await pool.query(`SELECT "Descripcion","Cantidad" FROM orden_produccion WHERE "Id_Orden"=$1`, [A().ordenId])).rows[0]
  const mat = (await pool.query(`SELECT "Nombre_Material" FROM material WHERE "Id_Material"=$1`, [A().materialId])).rows[0]
  assert.equal(cli.Nombre_Completo, A().clienteMarca, 'usuario de A fue modificado por B')
  assert.equal(ord.Descripcion, A().ordenMarca, 'orden de A fue modificada por B')
  assert.equal(Number(ord.Cantidad), 10, 'cantidad de la orden de A fue modificada por B')
  assert.equal(mat.Nombre_Material, A().materialMarca, 'material de A fue modificado por B')
})

test('B no puede borrar registros de A', async () => {
  for (const ruta of [
    `/api/comprobantes/${A().comprobanteId}`,
    `/api/ordenes/${A().ordenId}`,
    `/api/materiales/${A().materialId}`,
    `/api/usuarios/${A().clienteId}`,
  ]) {
    const r = await http('DELETE', ruta, B().token)
    assert.ok(!ok(r.status), `DELETE ${ruta} con token de B devolvió ${r.status}`)
  }
  const q = async (sql, id) => (await pool.query(sql, [id])).rowCount
  assert.equal(await q(`SELECT 1 FROM comprobantes WHERE "Id_Comprobante"=$1`, A().comprobanteId), 1, 'comprobante de A borrado por B')
  assert.equal(await q(`SELECT 1 FROM orden_produccion WHERE "Id_Orden"=$1`, A().ordenId), 1, 'orden de A borrada por B')
  assert.equal(await q(`SELECT 1 FROM material WHERE "Id_Material"=$1`, A().materialId), 1, 'material de A borrado por B')
  assert.equal(await q(`SELECT 1 FROM usuario WHERE "Id_Usuario"=$1`, A().clienteId), 1, 'usuario de A borrado por B')
})

// ── Mezcla de empresas al crear ──────────────────────────────────────────
test('B no puede crear una orden con cliente y material de A', async () => {
  const r = await http('POST', '/api/ordenes', B().token, {
    Id_Cliente: A().clienteId,
    Id_Material: A().materialId,
    Descripcion: `CRUZADA_${SFX}`,
    Cantidad: 5,
    Fecha_Limite: '2030-01-01',
    Id_Empresa: A().empresa, // el servidor debe ignorarlo
  })
  assert.ok(!ok(r.status), `POST /api/ordenes cruzada devolvió ${r.status}`)
  const n = (await pool.query(`SELECT 1 FROM orden_produccion WHERE "Descripcion" = $1`, [`CRUZADA_${SFX}`])).rowCount
  assert.equal(n, 0, 'se creó una orden mezclando datos de dos empresas')
})

// ── Rutas globales solo para superadmin ──────────────────────────────────
test('un admin de empresa no accede a rutas de superadmin', async () => {
  for (const [m, ruta, body] of [
    ['GET', '/api/empresas'],
    ['GET', `/api/empresas/${A().empresa}`],
    ['PUT', `/api/empresas/${A().empresa}`, { Nombre_Empresa: 'HACK' }],
    ['DELETE', `/api/empresas/${A().empresa}`],
    ['GET', '/api/superadmin/roles'],
    ['POST', '/api/superadmin/roles', { Nombre_Rol: `hack${SFX}` }],
  ]) {
    const r = await http(m, ruta, B().token, body)
    assert.ok(!ok(r.status), `${m} ${ruta} con token de admin devolvió ${r.status}`)
  }
  const emp = (await pool.query(`SELECT "Nombre_Empresa","Estado" FROM empresa WHERE "Id_Empresa"=$1`, [A().empresa])).rows[0]
  assert.equal(emp.Estado, 'activa')
  assert.ok(emp.Nombre_Empresa.startsWith('Aislamiento A'))
})

test('sin token no se accede a rutas operativas', async () => {
  for (const ruta of ['/api/usuarios', '/api/ordenes', '/api/materiales', '/api/comprobantes']) {
    const r = await http('GET', ruta, null)
    assert.ok(r.status === 401 || r.status === 403, `GET ${ruta} sin token devolvió ${r.status}`)
  }
})

// ── Empresa inactiva ─────────────────────────────────────────────────────
test('si la empresa se desactiva, su admin pierde el acceso', async () => {
  await pool.query(`UPDATE empresa SET "Estado"='inactiva' WHERE "Id_Empresa"=$1`, [B().empresa])
  try {
    const r = await http('GET', '/api/ordenes', B().token)
    assert.ok(r.status === 401 || r.status === 403, `con la empresa inactiva devolvió ${r.status}`)
    const l = await http('POST', '/api/usuarios/login', null, { correo: `${B().adminUser}@aislamiento.test`, contrasena: PASS })
    assert.ok(!ok(l.status), `login con empresa inactiva devolvió ${l.status}`)
  } finally {
    await pool.query(`UPDATE empresa SET "Estado"='activa' WHERE "Id_Empresa"=$1`, [B().empresa])
  }
})
