import { Router } from 'express'
import pool from '../db.js'

const router = Router()

// GET todos los materiales de una orden
router.get('/orden/:idOrden', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT om.*, m."Nombre_Material", m."Unidad"
      FROM orden_material om
      INNER JOIN material m ON om."Id_Producto" = m."Id_Material"
      WHERE om."Id_Orden" = $1
    `, [req.params.idOrden])
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST agregar material a una orden.
// Descuenta el stock automáticamente y registra el movimiento — mismo
// endpoint para web y móvil, así que ambos quedan cubiertos por igual.
// Si no hay stock suficiente, se bloquea (no se asigna ni se descuenta).
router.post('/', async (req, res) => {
  const { Id_Orden, Id_Producto, Cantidad_Usada } = req.body
  if (!Id_Orden || !Id_Producto || !Cantidad_Usada)
    return res.status(400).json({ error: 'Faltan campos obligatorios' })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const matRes = await client.query(
      'SELECT "Stock_Actual" FROM material WHERE "Id_Material" = $1 FOR UPDATE',
      [Id_Producto]
    )
    if (matRes.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Material no encontrado' })
    }
    const stockActual = Number(matRes.rows[0].Stock_Actual)
    if (stockActual < Cantidad_Usada) {
      await client.query('ROLLBACK')
      return res.status(400).json({
        error: `Stock insuficiente: hay ${stockActual} y se necesitan ${Cantidad_Usada}`,
      })
    }

    await client.query(`
      INSERT INTO orden_material ("Id_Orden", "Id_Producto", "Cantidad_Usada")
      VALUES ($1, $2, $3)
    `, [Id_Orden, Id_Producto, Cantidad_Usada])

    await client.query(`
      UPDATE material SET "Stock_Actual" = "Stock_Actual" - $1 WHERE "Id_Material" = $2
    `, [Cantidad_Usada, Id_Producto])

    await client.query(`
      INSERT INTO material_movimiento ("Id_Material", "Tipo", "Cantidad", "Id_Orden", "Nota")
      VALUES ($1, 'Salida', $2, $3, 'Consumo al asignar material a la orden')
    `, [Id_Producto, -Cantidad_Usada, Id_Orden])

    await client.query('COMMIT')
    res.status(201).json({ mensaje: 'Material agregado a la orden' })
  } catch (err) {
    await client.query('ROLLBACK')
    if (err.code === '23505')
      return res.status(409).json({ error: 'Ese material ya está en la orden' })
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})

// PUT actualizar cantidad usada.
// Ajusta el stock por la diferencia exacta (si se usa más, descuenta
// el excedente y valida que haya suficiente; si se usa menos, devuelve
// la diferencia).
router.put('/:idOrden/:idProducto', async (req, res) => {
  const { Cantidad_Usada } = req.body
  if (Cantidad_Usada == null) return res.status(400).json({ error: 'Falta Cantidad_Usada' })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const actual = await client.query(`
      SELECT "Cantidad_Usada" FROM orden_material
      WHERE "Id_Orden" = $1 AND "Id_Producto" = $2
      FOR UPDATE
    `, [req.params.idOrden, req.params.idProducto])
    if (actual.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Registro no encontrado' })
    }
    const cantidadAnterior = Number(actual.rows[0].Cantidad_Usada)
    const delta = Number(Cantidad_Usada) - cantidadAnterior // >0 usa más, <0 usa menos

    const matRes = await client.query(
      'SELECT "Stock_Actual" FROM material WHERE "Id_Material" = $1 FOR UPDATE',
      [req.params.idProducto]
    )
    if (matRes.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Material no encontrado' })
    }
    const stockActual = Number(matRes.rows[0].Stock_Actual)
    if (delta > 0 && stockActual < delta) {
      await client.query('ROLLBACK')
      return res.status(400).json({
        error: `Stock insuficiente para aumentar el uso: hay ${stockActual} y se necesitan ${delta} más`,
      })
    }

    const { rowCount } = await client.query(`
      UPDATE orden_material SET "Cantidad_Usada"=$1
      WHERE "Id_Orden"=$2 AND "Id_Producto"=$3
    `, [Cantidad_Usada, req.params.idOrden, req.params.idProducto])

    if (delta !== 0) {
      await client.query(`
        UPDATE material SET "Stock_Actual" = "Stock_Actual" - $1 WHERE "Id_Material" = $2
      `, [delta, req.params.idProducto])

      await client.query(`
        INSERT INTO material_movimiento ("Id_Material", "Tipo", "Cantidad", "Id_Orden", "Nota")
        VALUES ($1, $2, $3, $4, 'Ajuste de cantidad usada en la orden')
      `, [req.params.idProducto, delta > 0 ? 'Salida' : 'Entrada', -delta, req.params.idOrden])
    }

    await client.query('COMMIT')
    if (rowCount === 0) return res.status(404).json({ error: 'Registro no encontrado' })
    res.json({ mensaje: 'Cantidad actualizada' })
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})

// DELETE quitar material de una orden — devuelve el stock consumido.
router.delete('/:idOrden/:idProducto', async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const del = await client.query(`
      DELETE FROM orden_material WHERE "Id_Orden"=$1 AND "Id_Producto"=$2
      RETURNING "Cantidad_Usada"
    `, [req.params.idOrden, req.params.idProducto])

    if (del.rowCount === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Registro no encontrado' })
    }
    const cantidadUsada = Number(del.rows[0].Cantidad_Usada)

    await client.query(`
      UPDATE material SET "Stock_Actual" = "Stock_Actual" + $1 WHERE "Id_Material" = $2
    `, [cantidadUsada, req.params.idProducto])

    await client.query(`
      INSERT INTO material_movimiento ("Id_Material", "Tipo", "Cantidad", "Id_Orden", "Nota")
      VALUES ($1, 'Entrada', $2, $3, 'Devolución al quitar el material de la orden')
    `, [req.params.idProducto, cantidadUsada, req.params.idOrden])

    await client.query('COMMIT')
    res.json({ mensaje: 'Material eliminado de la orden' })
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})

export default router