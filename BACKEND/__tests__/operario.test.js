import { beforeEach, describe, test, expect } from '@jest/globals'
import { db, sesion, preparar } from './helpers/app.js'

const fase = { Id_Orden_Operario: 10, Id_Operario: 2, Id_Orden: 20, Numero_Fase: 1, Estado_Fase: 'Pendiente', Cantidad: 10, Cantidad_Realizada: 0, Producto: 'Camisas', Descripcion_Fase: 'Coser mangas', Cliente: 'Cliente prueba', NombreMaterial: 'Algodón', Fecha_Limite: '2026-12-31', Prioridad: 'Alta' }
beforeEach(() => preparar(() => ({ rows: [fase] })))
describe('RF-055 Ver tareas asignadas', () => {
  test('consulta las fases propias con filtro por usuario y empresa', async () => {
    const r = await sesion('get', '/api/orden-operario/operario/2')
    expect(r.status).toBe(200)
    expect(r.body[0].Id_Orden_Operario).toBe(10)
    expect(db.query.mock.calls.at(-1)[1]).toEqual(['2', 7])
  })
  test('un operario no consulta las fases de otro', async () => {
    expect((await sesion('get', '/api/orden-operario/operario/99')).status).toBe(403)
  })
})
test('RF-056 devuelve producto, descripción, material y cliente', async () => {
  expect((await sesion('get', '/api/orden-operario/operario/2')).body[0]).toMatchObject({ Producto: 'Camisas', Descripcion_Fase: 'Coser mangas', Cliente: 'Cliente prueba', NombreMaterial: 'Algodón' })
})
test('RF-057 entrega la fecha límite y prioridad', async () => {
  expect((await sesion('get', '/api/orden-operario/operario/2')).body[0]).toMatchObject({ Fecha_Limite: '2026-12-31', Prioridad: 'Alta' })
})
function avanceDB(actual = fase) {
  preparar((sql, p) => {
    if (['BEGIN', 'COMMIT', 'ROLLBACK'].includes(sql)) return { rows: [] }
    if (sql.includes('SELECT oo.*, op."Cantidad"')) return { rows: actual ? [actual] : [] }
    if (sql.includes('SELECT "Id_Orden_Operario"')) return { rows: [{ Id_Orden_Operario: 10 }, { Id_Orden_Operario: 11 }] }
    if (sql.includes('UPDATE orden_operario')) return { rows: [{ ...actual, Cantidad_Realizada: p[0], Estado_Fase: p[1] ? 'Completada' : 'Pendiente', Nota_Operario: p[2] }] }
    if (sql.includes('SELECT "Estado"')) return { rows: [{ Estado: 'En Proceso' }] }
    if (sql.includes('SELECT "Cantidad",')) return { rows: [{ Cantidad: 10, Vencida: false }] }
    if (sql.includes('WITH base AS')) return { rows: [{ Total_Fases: 1, Progreso: 0.5, Avance_Min: 0.5 }] }
    if (sql.includes('UPDATE orden_produccion')) return { rows: [] }
    throw new Error(`Consulta sin simular: ${sql}`)
  })
}
describe('RF-060 Registrar avance', () => {
  test.each([0, 3, 5])('guarda %i prendas y completa solo al alcanzar la cuota', async cantidad => {
    avanceDB()
    const r = await sesion('patch', '/api/orden-operario/10/avance').send({ Cantidad_Realizada: cantidad })
    expect(r.status).toBe(200)
    expect(r.body.cuota).toBe(5)
    expect(r.body.fase.Estado_Fase).toBe(cantidad === 5 ? 'Completada' : 'Pendiente')
    expect(r.body.fase.Cantidad_Realizada).toBe(cantidad)
    expect(r.body.orden.progreso).toBe(0.5)
    expect(db.query.mock.calls.some(([sql]) => sql === 'COMMIT')).toBe(true)
  })
  test.each([-1, 1.5, 'abc', 6])('rechaza cantidad inválida o superior a la cuota %s', async cantidad => {
    avanceDB()
    expect((await sesion('patch', '/api/orden-operario/10/avance').send({ Cantidad_Realizada: cantidad })).status).toBe(400)
    expect(db.query.mock.calls.some(([sql]) => sql.includes('UPDATE orden_operario'))).toBe(false)
  })
  test('no permite modificar la fase de otro operario', async () => {
    avanceDB({ ...fase, Id_Operario: 99 })
    expect((await sesion('patch', '/api/orden-operario/10/avance').send({ Cantidad_Realizada: 2 })).status).toBe(403)
    expect(db.query.mock.calls.some(([sql]) => sql === 'ROLLBACK')).toBe(true)
  })
  test('no permite modificar una fase ya completada', async () => {
    avanceDB({ ...fase, Estado_Fase: 'Completada' })
    expect((await sesion('patch', '/api/orden-operario/10/avance').send({ Cantidad_Realizada: 2 })).status).toBe(409)
  })
})
describe('RF-061 Agregar nota opcional', () => {
  test.each([{ nota: '  Costura revisada  ', esperada: 'Costura revisada' }, { nota: '', esperada: null }, { nota: undefined, esperada: null }])('guarda nota opcional $nota', async ({ nota, esperada }) => {
    avanceDB()
    const r = await sesion('patch', '/api/orden-operario/10/avance').send({ Cantidad_Realizada: 2, Nota_Operario: nota })
    expect(r.status).toBe(200)
    expect(r.body.fase.Nota_Operario).toBe(esperada)
  })
})
describe('RF-062 Consultar historial', () => {
  test('consulta fases completadas propias con fecha y nota', async () => {
    preparar(() => ({ rows: [{ ...fase, Estado_Fase: 'Completada', Fecha_Completada: '2026-11-08', Nota_Operario: 'Revisado' }] }))
    const r = await sesion('get', '/api/orden-operario/operario/2/historial')
    expect(r.status).toBe(200)
    expect(r.body[0]).toMatchObject({ Estado_Fase: 'Completada', Nota_Operario: 'Revisado', Fecha_Completada: '2026-11-08' })
    const [sql, p] = db.query.mock.calls.at(-1)
    expect(sql).toContain('AND oo."Estado_Fase" = \'Completada\'')
    expect(p).toEqual(['2', 7])
  })
  test('impide consultar historial de otro operario', async () => {
    expect((await sesion('get', '/api/orden-operario/operario/99/historial')).status).toBe(403)
  })
})
