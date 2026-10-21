import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const s = { routes: new Map(), poolQueries: [], queries: [], mode: 'normal', failAt: null, commits: 0, rollbacks: 0, releases: 0 }
const noop = (_req, _res, next) => next()
const pool = {
  async query(sql, params = []) { s.poolQueries.push({ sql, params }); return { rows: [], rowCount: 0 } },
  async connect() { return { async query(sql, params = []) {
    s.queries.push({ sql, params })
    if (sql.trim() === 'BEGIN') return { rows: [] }
    if (sql.trim() === 'COMMIT') { s.commits++; return { rows: [] } }
    if (sql.trim() === 'ROLLBACK') { s.rollbacks++; return { rows: [] } }
    if (s.failAt && sql.includes(s.failAt)) { s.failAt = null; throw Object.assign(new Error('mock SQL error'), { code: 'XX000' }) }
    if (s.mode === '23503' && sql.includes('INSERT INTO orden_operario')) throw Object.assign(new Error('fk detail'), { code: '23503' })
    if (sql.includes('SELECT * FROM orden_operario WHERE "Id_Orden_Operario"')) return { rows: s.mode === 'foreign' ? [] : [{ Id_Orden: 5, Id_Operario: 6, Numero_Fase: 1 }] }
    if (sql.includes('INSERT INTO orden_operario')) return { rows: [{ Id_Orden_Operario: 10 }] }
    if (sql.includes('SELECT "Cantidad"')) return { rows: [{ Cantidad: 10, Vencida: false }] }
    if (sql.includes('WITH fases AS')) return { rows: [{ Total_Fases: 1, Progreso: 0, Avance_Min: 0 }] }
    if (sql.includes('SELECT "Id_Orden_Operario"')) return { rows: [{ Id_Orden_Operario: 10 }] }
    if (sql.includes('RETURNING "Id_Orden"')) return { rows: s.mode === 'foreign' ? [] : [{ Id_Orden: 5 }] }
    if (sql.includes('UPDATE orden_operario') && sql.includes('RETURNING')) return { rows: [{ Id_Orden_Operario: 10 }] }
    if (sql.includes('SELECT oo.*, op."Cantidad"')) return { rows: s.mode === 'foreign' ? [] : [{ Id_Orden: 5, Id_Operario: 6, Numero_Fase: 1, Cantidad: 10 }] }
    if (sql.includes('SELECT "Estado" FROM orden_produccion')) return { rows: [{ Estado: 'En Proceso' }] }
    return { rows: [], rowCount: 1 }
  }, release() { s.releases++ } } },
}
const mocks = { pool, hasRole: () => true, requireRoles: () => noop, requireSelfParamOrRoles: () => noop,
  express: { Router: () => Object.fromEntries(['get','post','put','delete','patch'].map(m => [m, (p,...h) => s.routes.set(`${m.toUpperCase()} ${p}`, h.at(-1))])) },
  email: { notificarCambioEstado: async () => {} } }
let source = await readFile(new URL('../routes/orden_operario.js', import.meta.url), 'utf8')
for (const [a,b] of [["import { Router } from 'express'",'const { Router } = globalThis.__ooMocks.express'],["import pool from '../db.js'",'const pool = globalThis.__ooMocks.pool'],["import { notificarCambioEstado } from '../services/emailService.js'",'const { notificarCambioEstado } = globalThis.__ooMocks.email'],["import { hasRole, requireRoles, requireSelfParamOrRoles } from '../middleware/roles.js'",'const { hasRole, requireRoles, requireSelfParamOrRoles } = globalThis.__ooMocks']]) { assert.ok(source.includes(a)); source=source.replace(a,b) }
globalThis.__ooMocks=mocks
await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}#${Math.random()}`)
function reset(mode='normal'){ Object.assign(s,{poolQueries:[],queries:[],mode,failAt:null,commits:0,rollbacks:0,releases:0}) }
const res=()=>({statusCode:200,body:null,status(n){this.statusCode=n;return this},json(x){this.body=x;return this}})
async function call(key, req={}) { const r=res(); await s.routes.get(key)({auth:{id:6,rol:1,empresaId:42},body:{},params:{},query:{},...req},r); return r }

test('OP aislamiento: carga router con dependencias sustituidas y sin db/env/procesos',()=>{
  for(const k of ['POST /','GET /orden/:idOrden','GET /operario/:idOperario','GET /operario/:idOperario/historial','PUT /:id','DELETE /:id','PATCH /:id/completar']) assert.ok(s.routes.has(k))
})
test('OP1/OP5: listados toman empresa del token y parametrizan filtros',async()=>{
  for(const k of ['GET /orden/:idOrden','GET /operario/:idOperario','GET /operario/:idOperario/historial']) { reset(); await call(k,{params:{idOrden:'7',idOperario:'6',empresaId:'900'},query:{empresaId:'901'}}); const q=s.poolQueries[0]; assert.equal(q.params.at(-1),42); assert.match(q.sql,/Id_Empresa/) }
})
test('OP3: POST inserta Id_Empresa del token; OP2 mapea FK ajena a 400 sin escribir progreso',async()=>{
 reset(); let r=await call('POST /',{body:{Id_Orden:5,Id_Operario:6,Numero_Fase:1,Id_Empresa:999,empresaId:998}}); assert.equal(r.statusCode,201); const q=s.queries.find(x=>x.sql.includes('INSERT INTO orden_operario')); assert.match(q.sql,/"Id_Empresa"/); assert.equal(q.params.at(-1),42)
 reset('23503'); r=await call('POST /',{body:{Id_Orden:5,Id_Operario:6,Numero_Fase:1}}); assert.equal(r.statusCode,400); assert.equal(s.commits,0); assert.equal(s.queries.filter(x=>/^(INSERT|UPDATE)/i.test(x.sql.trim())).length,1)
})
test('OP4: editar y quitar ajeno devuelven 404 sin mutación',async()=>{
 for(const k of ['PUT /:id','DELETE /:id']) { reset('foreign'); const r=await call(k,{params:{id:'99'}}); assert.equal(r.statusCode,404); const writes=s.queries.filter(x=>/^(UPDATE|DELETE)/i.test(x.sql.trim())); assert.ok(writes.every(x=>x.sql.includes('"Id_Empresa"'))); assert.equal(s.rollbacks,1); assert.equal(s.releases,1) }
})
test('OP6: cada ruta transaccional confirma éxito y revierte 404/error, libera una vez',async()=>{
 reset(); await call('POST /',{body:{Id_Orden:5,Id_Operario:6,Numero_Fase:1}}); assert.equal(s.commits,1); assert.equal(s.releases,1)
 reset('23503'); await call('POST /',{body:{Id_Orden:5,Id_Operario:6,Numero_Fase:1}}); assert.equal(s.rollbacks,1); assert.equal(s.releases,1)
 for(const [key, req] of [['PUT /:id',{params:{id:'10'},body:{Numero_Fase:2}}],['DELETE /:id',{params:{id:'10'}}],['PATCH /:id/completar',{params:{id:'10'}}]]) { reset(); const r=await call(key,req); assert.equal(r.statusCode,200); assert.equal(s.commits,1); assert.equal(s.releases,1); reset('foreign'); const missing=await call(key,req); assert.equal(missing.statusCode,404); assert.equal(s.rollbacks,1); assert.equal(s.releases,1); reset(); s.failAt=key.startsWith('PUT')?'SELECT * FROM orden_operario':key.startsWith('DELETE')?'DELETE FROM orden_operario':'SELECT oo.*, op."Cantidad"'; const failed=await call(key,req); assert.equal(failed.statusCode,500); assert.equal(s.rollbacks,1); assert.equal(s.releases,1) }
})
