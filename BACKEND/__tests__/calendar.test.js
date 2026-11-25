import { jest, beforeEach, afterEach, describe, test, expect } from '@jest/globals'
import { db, sesion, preparar, usuario, google, respuestaGoogle } from './helpers/appCamilo.js'

const vinculacion = { Google_Email: 'calendar@example.test', Access_Token: 'falso', Refresh_Token: 'falso', Expiry_Date: Date.now() + 3600000, Sync_Enabled: true, Calendar_Id: 'primary' }
beforeEach(() => preparar(() => ({ rows: [vinculacion] })))
afterEach(() => jest.restoreAllMocks())

describe('RF-044 Vincular y desvincular Google Calendar', () => {
  test.each([1, 2, 3])('el rol %i consulta su propia vinculación', async rol => {
    const r = await sesion('get', '/api/google/status', rol)
    expect(r.status).toBe(200)
    expect(r.body).toMatchObject({ connected: true, profile: { email: vinculacion.Google_Email } })
    // La vinculación de Google es por usuario (una cuenta de Google por persona)
    expect(db.query.mock.calls.at(-1)[1]).toEqual([rol])
  })
  test('informa cuenta sin vincular', async () => {
    preparar(() => ({ rows: [] }))
    expect((await sesion('get', '/api/google/status')).body).toEqual({ connected: false, profile: null })
  })
  test.each([1, 2, 3])('el rol %i obtiene URL de vinculación y reautorización con consentimiento', async rol => {
    preparar(() => ({ rows: [{ Id_Empresa: 7 }] }))
    const r = await sesion('get', '/api/google/auth-url?action=link', rol)
    expect(r.status).toBe(200)
    expect(new URL(r.body.url).searchParams.get('prompt')).toBe('consent')
  })
  test.each([1, 2, 3])('el rol %i desvincula solo su propia cuenta', async rol => {
    const r = await sesion('delete', '/api/google/unlink', rol)
    expect(r.status).toBe(200)
    expect(db.query.mock.calls.at(-1)).toEqual([expect.stringContaining('DELETE FROM google_calendar_tokens'), [rol]])
  })
})
describe('RF-045 Sincronizar sin duplicar eventos', () => {
  test.each([{ existente: false, metodo: 'POST' }, { existente: true, metodo: 'PATCH' }])('$metodo según existencia previa del evento', async ({ existente, metodo }) => {
    const fetchMock = jest.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(respuestaGoogle({ items: existente ? [{ id: 'evento1' }] : [] }))
      .mockResolvedValueOnce(respuestaGoogle({ id: 'evento1', htmlLink: 'https://calendar.google.com/evento1' }))
    const result = await google.createOrUpdateCalendarEvent('simulado', 'primary', { Id_Orden: 12, Producto: 'Camisas', Fecha_Limite: '2026-12-31', Prioridad: 'Alta' })
    expect(result.status).toBe(existente ? 'updated' : 'created')
    expect(fetchMock.mock.calls[0][0]).toContain('texticodeOrderId%3D12')
    const options = fetchMock.mock.calls[1][1]
    expect(options.method).toBe(metodo)
    expect(JSON.parse(options.body)).toMatchObject({ start: { date: '2026-12-31' }, end: { date: '2027-01-01' }, colorId: '11' })
  })
  test.each([1, 2, 3])('el rol %i filtra las órdenes por su empresa y alcance', async rol => {
    preparar(sql => ({ rows: sql.includes('FROM usuario u') ? [usuario(rol)] : [{ Id_Orden: 12 }] }))
    expect(await google.getUserOrders({ id: rol, empresaId: 7 })).toEqual([{ Id_Orden: 12 }])
    const [sql, params] = db.query.mock.calls.at(-1)
    expect(params).toEqual(rol === 1 ? [7] : [rol, 7])
    expect(sql).toContain('op."Id_Empresa"')
    if (rol === 2) expect(sql).toContain('oo."Id_Operario" = $1')
    if (rol === 3) expect(sql).toContain('op."Id_Cliente" = $1')
  })
  test('rechaza sincronización sin cuenta vinculada', async () => {
    preparar(() => ({ rows: [] }))
    expect((await sesion('post', '/api/google/sync/delivery-events')).status).toBe(400)
  })
  test('sincronización con cuenta vinculada registra total y última fecha', async () => {
    preparar(sql => ({ rows: sql.includes('FROM google_calendar_tokens') ? [vinculacion] : sql.includes('FROM usuario u') ? [usuario()] : sql.includes('FROM orden_produccion op') ? [{ Id_Orden: 12, Fecha_Limite: '2026-12-31' }] : [] }))
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(respuestaGoogle({ items: [] })).mockResolvedValueOnce(respuestaGoogle({ id: 'e1' }))
    const r = await sesion('post', '/api/google/sync/delivery-events')
    expect(r.status).toBe(200)
    expect(r.body.total).toBe(1)
    expect(db.query.mock.calls.some(([sql]) => sql.includes('"Last_Sync_At" = now()'))).toBe(true)
  })
})
describe('RF-046 Consultar próximos eventos', () => {
  test.each([1, 2, 3])('el rol %i recibe eventos y enlaces de Google', async rol => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(respuestaGoogle({ items: [{ id: 'e1', summary: 'Texticode: entrega', start: { date: '2026-12-31' }, htmlLink: 'https://calendar.google.com/e1' }] }))
    const r = await sesion('get', '/api/google/events/upcoming', rol)
    expect(r.status).toBe(200)
    expect(r.body.events[0]).toMatchObject({ id: 'e1', htmlLink: 'https://calendar.google.com/e1' })
    const url = new URL(fetchMock.mock.calls[0][0])
    expect(url.searchParams.get('q')).toBe('Texticode')
    expect(url.searchParams.get('orderBy')).toBe('startTime')
  })
  test('devuelve lista vacía cuando no hay próximos eventos', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(respuestaGoogle({ items: [] }))
    expect((await sesion('get', '/api/google/events/upcoming')).body.events).toEqual([])
  })
})
describe('RF-047 Administrar vinculaciones de usuarios', () => {
  test('el administrador lista usuarios de su empresa', async () => {
    preparar(() => ({ rows: [{ Id_Usuario: 2, Google_Email: vinculacion.Google_Email }] }))
    const r = await sesion('get', '/api/google/connected-users', 1)
    expect(r.status).toBe(200)
    expect(r.body.users).toHaveLength(1)
    expect(db.query.mock.calls.at(-1)[1]).toEqual([7])
  })
  test('el administrador desvincula la cuenta seleccionada dentro de su empresa', async () => {
    expect((await sesion('delete', '/api/google/unlink-user/2', 1)).status).toBe(200)
    expect(db.query.mock.calls.at(-1)[1]).toEqual(['2', 7])
  })
  test.each([2, 3])('el rol %i no puede desvincular a otros usuarios', async rol => {
    expect((await sesion('delete', '/api/google/unlink-user/1', rol)).status).toBe(403)
  })
})
