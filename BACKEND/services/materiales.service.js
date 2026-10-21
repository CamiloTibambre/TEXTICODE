import { hasRole } from '../middleware/roles.js'

/**
 * Valida que el contexto de autenticación contenga una empresa activa.
 * 
 * @param {object} auth Contexto req.auth
 * @returns {number} ID de la empresa activa
 */
export function assertEmpresaActiva(auth) {
  if (!auth || !auth.empresaId) {
    const error = new Error('Se requiere una empresa activa para acceder a este recurso.')
    error.statusCode = 403
    error.code = 'TENANT_REQUIRED'
    throw error
  }
  return Number(auth.empresaId)
}

/**
 * Valida si un usuario pertenece a una empresa específica con estado activo.
 *
 * @param {object} dbClient
 * @param {number} idUsuario
 * @param {number} idEmpresa
 * @returns {Promise<boolean>}
 */
export async function assertUsuarioEnEmpresa(dbClient, idUsuario, idEmpresa) {
  if (!idUsuario) return true
  const { rows } = await dbClient.query(
    `SELECT 1 FROM usuario_empresa
     WHERE "Id_Usuario" = $1 AND "Id_Empresa" = $2 AND "Estado" = 'activo'
     LIMIT 1`,
    [idUsuario, idEmpresa]
  )
  return rows.length > 0
}

/**
 * Obtiene todos los materiales activos de la empresa activa.
 */
export async function listarMateriales(dbClient, { auth }) {
  const empresaId = assertEmpresaActiva(auth)

  const { rows } = await dbClient.query(`
    SELECT m.*,
           u."Nombre_Completo" AS "Nombre_Cliente"
    FROM material m
    LEFT JOIN usuario u ON m."Id_Cliente" = u."Id_Usuario"
    WHERE m."Activo" = true
      AND m."Id_Empresa" = $1
    ORDER BY m."Nombre_Material"
  `, [empresaId])

  return rows
}

/**
 * Obtiene los materiales visibles para un cliente dentro de la empresa activa.
 */
export async function listarMaterialesCliente(dbClient, { idCliente, auth }) {
  const empresaId = assertEmpresaActiva(auth)

  const { rows } = await dbClient.query(`
    SELECT m.*,
           u."Nombre_Completo" AS "Nombre_Cliente"
    FROM material m
    LEFT JOIN usuario u ON m."Id_Cliente" = u."Id_Usuario"
    WHERE m."Activo" = true
      AND m."Id_Cliente" = $1
      AND m."Id_Empresa" = $2
    ORDER BY m."Nombre_Material"
  `, [idCliente, empresaId])

  return rows
}

/**
 * Consulta un material puntual validando pertenencia a la empresa activa.
 * Si pertenece a otra empresa o no existe, retorna 404 sin revelar su existencia.
 */
export async function obtenerMaterialPorId(dbClient, { idMaterial, auth }) {
  const empresaId = assertEmpresaActiva(auth)

  const { rows } = await dbClient.query(`
    SELECT m.*,
           u."Nombre_Completo" AS "Nombre_Cliente"
    FROM material m
    LEFT JOIN usuario u ON m."Id_Cliente" = u."Id_Usuario"
    WHERE m."Id_Material" = $1
      AND m."Id_Empresa" = $2
    LIMIT 1
  `, [idMaterial, empresaId])

  if (rows.length === 0) {
    const error = new Error('Material no encontrado')
    error.statusCode = 404
    throw error
  }

  const material = rows[0]

  if (!hasRole(auth, ['admin']) && String(material.Id_Cliente) !== String(auth.id)) {
    const error = new Error('No tienes permisos para este material.')
    error.statusCode = 403
    throw error
  }

  return material
}

/**
 * Obtiene materiales con stock bajo filtrados por empresa activa.
 */
export async function obtenerAlertasStockBajo(dbClient, { auth }) {
  const empresaId = assertEmpresaActiva(auth)

  const { rows } = await dbClient.query(`
    SELECT m.*,
           u."Nombre_Completo" AS "Nombre_Cliente"
    FROM material m
    LEFT JOIN usuario u ON m."Id_Cliente" = u."Id_Usuario"
    WHERE m."Activo" = true
      AND m."Stock_Actual" <= m."Stock_Minimo"
      AND m."Id_Empresa" = $1
    ORDER BY m."Stock_Actual" ASC
  `, [empresaId])

  return rows
}

/**
 * Consulta el historial de stock para un período cerrado, aislado por empresa activa.
 */
export async function obtenerHistorialInventario(dbClient, { periodo, auth }) {
  const empresaId = assertEmpresaActiva(auth)

  if (!periodo || !/^\d{4}-\d{2}$/.test(periodo)) {
    const error = new Error('Parámetro periodo inválido, use el formato YYYY-MM')
    error.statusCode = 400
    throw error
  }

  const { rows } = await dbClient.query(`
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
    WHERE m."Id_Empresa" = $2
    GROUP BY m."Id_Material", u."Nombre_Completo"
    ORDER BY m."Nombre_Material"
  `, [`${periodo}-01`, empresaId])

  return rows
}

/**
 * Consulta los movimientos de un material asegurando que pertenezca a la empresa activa.
 */
export async function listarMovimientosMaterial(dbClient, { idMaterial, auth }) {
  const empresaId = assertEmpresaActiva(auth)

  // Primero valida que el material pertenezca a la empresa activa
  await obtenerMaterialPorId(dbClient, { idMaterial, auth })

  const { rows } = await dbClient.query(`
    SELECT * FROM material_movimiento
    WHERE "Id_Material" = $1
    ORDER BY "Fecha" DESC
  `, [idMaterial])

  return rows
}

/**
 * Crea un nuevo material asignando la empresa activa y validando que el cliente pertenezca a la misma.
 */
export async function crearMaterial(dbClient, { materialData, auth }) {
  const empresaId = assertEmpresaActiva(auth)
  const {
    Nombre_Material,
    Categoria,
    Stock_Actual,
    Unidad,
    Stock_Minimo,
    Stock_Maximo,
    Id_Cliente,
  } = materialData

  if (!Nombre_Material || !Categoria || !Unidad) {
    const error = new Error('Faltan campos obligatorios')
    error.statusCode = 400
    throw error
  }

  if (Id_Cliente) {
    const pertenece = await assertUsuarioEnEmpresa(dbClient, Id_Cliente, empresaId)
    if (!pertenece) {
      const error = new Error('El cliente especificado no pertenece a la empresa activa.')
      error.statusCode = 400
      error.code = 'CROSS_TENANT_RELATION'
      throw error
    }
  }

  const client = dbClient
  await client.query('BEGIN')
  try {
    const { rows } = await client.query(`
      INSERT INTO material (
        "Nombre_Material", "Categoria", "Stock_Actual", "Unidad",
        "Stock_Minimo", "Stock_Maximo", "Id_Cliente", "Id_Empresa", "Activo"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
      RETURNING "Id_Material"
    `, [
      Nombre_Material,
      Categoria,
      Stock_Actual ?? 0,
      Unidad,
      Stock_Minimo ?? 0,
      Stock_Maximo ?? 0,
      Id_Cliente || null,
      empresaId, // Asignado exclusivamente desde la sesión autenticada
    ])

    const idMaterial = rows[0].Id_Material
    const stockInicial = Number(Stock_Actual ?? 0)

    if (stockInicial !== 0) {
      await client.query(`
        INSERT INTO material_movimiento ("Id_Material", "Tipo", "Cantidad", "Nota")
        VALUES ($1, 'Creacion', $2, 'Saldo inicial al crear el material')
      `, [idMaterial, stockInicial])
    }

    await client.query('COMMIT')
    return { idMaterial }
  } catch (err) {
    await client.query('ROLLBACK')
    if (err.code === '23505') {
      const error = new Error('Ya existe un material con ese nombre en esta empresa')
      error.statusCode = 409
      throw error
    }
    throw err
  }
}

/**
 * Actualiza un material validando que pertenezca a la empresa activa.
 */
export async function actualizarMaterial(dbClient, { idMaterial, materialData, auth }) {
  const empresaId = assertEmpresaActiva(auth)
  const {
    Nombre_Material,
    Categoria,
    Stock_Actual,
    Unidad,
    Stock_Minimo,
    Stock_Maximo,
    Id_Cliente,
  } = materialData

  if (Id_Cliente) {
    const pertenece = await assertUsuarioEnEmpresa(dbClient, Id_Cliente, empresaId)
    if (!pertenece) {
      const error = new Error('El cliente especificado no pertenece a la empresa activa.')
      error.statusCode = 400
      error.code = 'CROSS_TENANT_RELATION'
      throw error
    }
  }

  const client = dbClient
  await client.query('BEGIN')
  try {
    const prev = await client.query(
      `SELECT "Stock_Actual" FROM material
       WHERE "Id_Material" = $1 AND "Id_Empresa" = $2 FOR UPDATE`,
      [idMaterial, empresaId]
    )

    if (prev.rows.length === 0) {
      await client.query('ROLLBACK')
      const error = new Error('Material no encontrado')
      error.statusCode = 404
      throw error
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
        AND "Id_Empresa"  = $9
    `, [
      Nombre_Material,
      Categoria,
      Stock_Actual,
      Unidad,
      Stock_Minimo,
      Stock_Maximo,
      Id_Cliente || null,
      idMaterial,
      empresaId,
    ])

    if (rowCount === 0) {
      await client.query('ROLLBACK')
      const error = new Error('Material no encontrado')
      error.statusCode = 404
      throw error
    }

    const stockNuevo = Number(Stock_Actual)
    const delta = stockNuevo - stockAnterior
    if (!Number.isNaN(delta) && delta !== 0) {
      await client.query(`
        INSERT INTO material_movimiento ("Id_Material", "Tipo", "Cantidad", "Nota")
        VALUES ($1, $2, $3, $4)
      `, [
        idMaterial,
        delta > 0 ? 'Entrada' : 'Salida',
        delta,
        'Ajuste de stock (edición manual o consumo en una orden)',
      ])
    }

    await client.query('COMMIT')
    return { ok: true }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  }
}

/**
 * Da de baja lógica un material asegurando aislamiento por empresa activa.
 */
export async function eliminarMaterial(dbClient, { idMaterial, auth }) {
  const empresaId = assertEmpresaActiva(auth)

  const client = dbClient
  await client.query('BEGIN')
  try {
    const prev = await client.query(
      `SELECT "Stock_Actual" FROM material
       WHERE "Id_Material" = $1 AND "Id_Empresa" = $2 AND "Activo" = true FOR UPDATE`,
      [idMaterial, empresaId]
    )

    if (prev.rows.length === 0) {
      await client.query('ROLLBACK')
      const error = new Error('Material no encontrado')
      error.statusCode = 404
      throw error
    }

    const stockActual = Number(prev.rows[0].Stock_Actual)

    await client.query(
      `UPDATE material SET "Activo" = false, "Stock_Actual" = 0
       WHERE "Id_Material" = $1 AND "Id_Empresa" = $2`,
      [idMaterial, empresaId]
    )

    if (stockActual !== 0) {
      await client.query(`
        INSERT INTO material_movimiento ("Id_Material", "Tipo", "Cantidad", "Nota")
        VALUES ($1, 'Salida', $2, 'Baja del material (eliminado desde Gestión de Inventario)')
      `, [idMaterial, -stockActual])
    }

    await client.query('COMMIT')
    return { ok: true }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  }
}
