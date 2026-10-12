import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const s={routes:new Map(),queries:[],mode:'normal'}
const noop=(_q,_r,n)=>n()
const pool={async query(sql,params=[]){s.queries.push({sql,params}); if(sql.includes('INSERT INTO usuario_orden')&&s.mode==='23503')throw Object.assign(new Error('fk'),{code:'23503'}); if(sql.includes('DELETE FROM usuario_orden'))return{rowCount:s.mode==='foreign'?0:1,rows:[]}; return{rows:[],rowCount:1}}}
const mocks={pool,requireRoles:()=>noop,requireSelfParamOrRoles:()=>noop,express:{Router:()=>Object.fromEntries(['get','post','delete'].map(m=>[m,(p,...h)=>s.routes.set(`${m.toUpperCase()} ${p}`,h.at(-1))]))}}
let source=await readFile(new URL('../routes/usuario_orden.js',import.meta.url),'utf8')
for(const[a,b]of[["import { Router } from 'express'",'const { Router } = globalThis.__uoMocks.express'],["import pool from '../db.js'",'const pool = globalThis.__uoMocks.pool'],["import { requireRoles, requireSelfParamOrRoles } from '../middleware/roles.js'",'const { requireRoles, requireSelfParamOrRoles } = globalThis.__uoMocks']]){assert.ok(source.includes(a));source=source.replace(a,b)}
globalThis.__uoMocks=mocks
await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}#${Math.random()}`)
function reset(mode='normal'){s.queries=[];s.mode=mode}
const response=()=>({statusCode:200,body:null,status(n){this.statusCode=n;return this},json(v){this.body=v;return this}})
async function call(k,req={}){const r=response();await s.routes.get(k)({auth:{id:3,rol:1,empresaId:42},body:{},params:{},query:{},...req},r);return r}
test('UO aislamiento: importa con mocks y registra rutas sin conectar ni ejecutar procesos',()=>{for(const k of ['GET /orden/:idOrden','GET /usuario/:idUsuario','POST /','DELETE /:idUsuario/:idOrden'])assert.ok(s.routes.has(k))})
test('UO1/UO5: listados filtran con empresa del token e ignoran empresa del cliente',async()=>{for(const k of ['GET /orden/:idOrden','GET /usuario/:idUsuario']){reset();await call(k,{params:{idOrden:1,idUsuario:3,empresaId:900},query:{empresaId:901},body:{Id_Empresa:902}});assert.equal(s.queries[0].params.at(-1),42);assert.match(s.queries[0].sql,/Id_Empresa/)}})
test('UO3/UO2: POST deriva empresa del token y asignación cruzada devuelve error claro',async()=>{reset();let r=await call('POST /',{body:{Id_Usuario:3,Id_Orden:8,Funcion:'x',Id_Empresa:999}});assert.equal(r.statusCode,201);let q=s.queries.find(x=>x.sql.includes('INSERT'));assert.match(q.sql,/"Id_Empresa"/);assert.equal(q.params.at(-1),42);reset('23503');r=await call('POST /',{body:{Id_Usuario:3,Id_Orden:8}});assert.equal(r.statusCode,400)})
test('UO4: DELETE ajeno usa tenant y devuelve 404 sin mutación',async()=>{reset('foreign');const r=await call('DELETE /:idUsuario/:idOrden',{params:{idUsuario:3,idOrden:8,empresaId:900}});assert.equal(r.statusCode,404);assert.equal(s.queries[0].params[2],42)})
