import { Router } from 'express'
import pool from '../db.js'

const router = Router()

// GET todos los materiales (solo activos — un material "eliminado"
// queda desactivado, no borrado, para no perder su historial)
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT m.*,
             u."Nombre_Completo" AS "Nombre_Cliente"
      FROM material m
      LEFT JOIN usuario u ON m."Id_Cliente" = u."Id_Usuario"
      WHERE m."Activo" = true
      ORDER BY m."Nombre_Material"
    `)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET inventario reconstruido al final de un período (formato YYYY-MM).
// Suma los movimientos de cada material hasta el último instante de
// ese mes. Un material sin ningún movimiento antes de esa fecha
// significa que todavía no existía en ese período — no se puede (ni
// se debe) inventarle un stock, así que se excluye del resultado.
// Colocado ANTES de "/:id" a propósito: si fuera después, Express
// interpretaría "reportes" como si fuera un :id.
router.get('/reportes/historial', async (req, res) => {
  const { periodo } = req.query // 'YYYY-MM'
  if (!periodo || !/^\d{4}-\d{2}$/.test(periodo)) {
    return res.status(400).json({ error: 'Parámetro periodo inválido, use el formato YYYY-MM' })
  }
  try {
    const { rows } = await pool.query(`
      SELECT
        m."Id_Material", m."Nombre_Material", m."Categoria", m."Unidad",
        m."Stock_Minimo", m."Stock_Maximo",
        u."Nombre_Completo" AS "Nombre_Cliente",
        SUM(mv."Cantidad") AS "Stock_Actual"
      FROM material m
      INNER JOIN material_movimiento mv
        ON mv."Id_Material" = m."Id_Material"
       AND mv."Fecha" < (date_trunc('month', $1::date) + interval '1 month')
      LEFT JOIN usuario u ON m."Id_Cliente" = u."Id_Usuario"
      GROUP BY m."Id_Material", u."Nombre_Completo"
      ORDER BY m."Nombre_Material"
    `, [`${periodo}-01`])
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET material por ID
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT m.*,
             u."Nombre_Completo" AS "Nombre_Cliente"
      FROM material m
      LEFT JOIN usuario u ON m."Id_Cliente" = u."Id_Usuario"
      WHERE m."Id_Material" = $1
    `, [req.params.id])
    if (rows.length === 0) return res.status(404).json({ error: 'Material no encontrado' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET materiales con stock bajo
router.get('/alertas/stock-bajo', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT m.*,
             u."Nombre_Completo" AS "Nombre_Cliente"
      FROM material m
      LEFT JOIN usuario u ON m."Id_Cliente" = u."Id_Usuario"
      WHERE m."Activo" = true AND m."Stock_Actual" <= m."Stock_Minimo"
      ORDER BY m."Stock_Actual" ASC
    `)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET historial de movimientos de un material puntual (útil para una
// futura pantalla de "ver detalle" del material, no la usa el reporte
// de inventario pero queda lista).
router.get('/:id/movimientos', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM material_movimiento
      WHERE "Id_Material" = $1
      ORDER BY "Fecha" DESC
    `, [req.params.id])
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST crear material
router.post('/', async (req, res) => {
  const { Nombre_Material, Categoria, Stock_Actual, Unidad, Stock_Minimo, Stock_Maximo, Id_Cliente } = req.body
  if (!Nombre_Material || !Categoria || !Unidad)
    return res.status(400).json({ error: 'Faltan campos obligatorios' })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows } = await client.query(`
      INSERT INTO material ("Nombre_Material", "Categoria", "Stock_Actual", "Unidad", "Stock_Minimo", "Stock_Maximo", "Id_Cliente")
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING "Id_Material"
    `, [
      Nombre_Material,
      Categoria,
      Stock_Actual ?? 0,
      Unidad,
      Stock_Minimo  ?? 0,
      Stock_Maximo  ?? 0,
      Id_Cliente    || null,
    ])
    const idMaterial = rows[0].Id_Material

    // Bitácora: saldo inicial, para que el material se pueda ubicar
    // en el historial desde el momento en que se creó.
    const stockInicial = Number(Stock_Actual ?? 0)
    if (stockInicial !== 0) {
      await client.query(`
        INSERT INTO material_movimiento ("Id_Material", "Tipo", "Cantidad", "Nota")
        VALUES ($1, 'Creacion', $2, 'Saldo inicial al crear el material')
      `, [idMaterial, stockInicial])
    }

    await client.query('COMMIT')
    res.status(201).json({ mensaje: 'Material creado', Id_Material: idMaterial })
  } catch (err) {
    await client.query('ROLLBACK')
    if (err.code === '23505')
      return res.status(409).json({ error: 'Ya existe un material con ese nombre' })
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})

// PUT actualizar material
router.put('/:id', async (req, res) => {
  const { Nombre_Material, Categoria, Stock_Actual, Unidad, Stock_Minimo, Stock_Maximo, Id_Cliente } = req.body

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Bloqueamos la fila para leer el stock previo sin pisarnos con
    // otra petición concurrente (p. ej. dos asignaciones de material
    // casi al mismo tiempo desde la app móvil).
    const prev = await client.query(
      'SELECT "Stock_Actual" FROM material WHERE "Id_Material" = $1 FOR UPDATE',
      [req.params.id]
    )
    if (prev.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Material no encontrado' })
    }
    const stockAnterior = Number(prev.rows[0].Stock_Actual)

    const { rowCount } = await client.query(`
      UPDATE material
      SET "Nombre_Material" = $1,
          "Categoria"       = $2,
          "Stock_Actual"    = $3,
          "Unidad"          = $4,
          "Stock_Minimo"    = $5,
          "Stock_Maximo"    = $6,
          "Id_Cliente"      = $7
      WHERE "Id_Material" = $8
    `, [
      Nombre_Material,
      Categoria,
      Stock_Actual,
      Unidad,
      Stock_Minimo,
      Stock_Maximo,
      Id_Cliente || null,
      req.params.id,
    ])

    // Bitácora: registramos la diferencia real de stock, sin importar
    // si vino de una edición manual en Gestión de Inventario (web) o
    // de un descuento automático al asignar material a una orden
    // (móvil) — ambos casos llegan a este mismo PUT. Si Stock_Actual
    // no cambió (se editó solo el nombre, la categoría, etc.) no se
    // genera movimiento, para no ensuciar el historial con ruido.
    const stockNuevo = Number(Stock_Actual)
    const delta = stockNuevo - stockAnterior
    if (!Number.isNaN(delta) && delta !== 0) {
      await client.query(`
        INSERT INTO material_movimiento ("Id_Material", "Tipo", "Cantidad", "Nota")
        VALUES ($1, $2, $3, $4)
      `, [
        req.params.id,
        delta > 0 ? 'Entrada' : 'Salida',
        delta,
        'Ajuste de stock (edición manual o consumo en una orden)',
      ])
    }

    await client.query('COMMIT')
    if (rowCount === 0) return res.status(404).json({ error: 'Material no encontrado' })
    res.json({ mensaje: 'Material actualizado' })
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})

// DELETE material — borrado lógico: se marca "Activo = false" y su
// stock se lleva a 0 (con el movimiento correspondiente registrado),
// en vez de borrar la fila. Así deja de aparecer en Gestión de
// Inventario (igual que antes), pero un reporte de un mes anterior que
// lo incluía lo sigue mostrando tal como estaba en ese momento, y los
// meses posteriores a la baja lo muestran con 0 — que es lo real.
router.delete('/:id', async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const prev = await client.query(
      'SELECT "Stock_Actual" FROM material WHERE "Id_Material" = $1 AND "Activo" = true FOR UPDATE',
      [req.params.id]
    )
    if (prev.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Material no encontrado' })
    }
    const stockActual = Number(prev.rows[0].Stock_Actual)

    await client.query(
      'UPDATE material SET "Activo" = false, "Stock_Actual" = 0 WHERE "Id_Material" = $1',
      [req.params.id]
    )

    if (stockActual !== 0) {
      await client.query(`
        INSERT INTO material_movimiento ("Id_Material", "Tipo", "Cantidad", "Nota")
        VALUES ($1, 'Salida', $2, 'Baja del material (eliminado desde Gestión de Inventario)')
      `, [req.params.id, -stockActual])
    }

    await client.query('COMMIT')
    res.json({ mensaje: 'Material eliminado' })
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})

export default router