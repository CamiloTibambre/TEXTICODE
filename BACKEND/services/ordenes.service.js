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
 * Valida si un material pertenece a la empresa activa y se encuentra activo.
 */
export async function assertMaterialEnEmpresa(dbClient, idMaterial, idEmpresa) {
  if (!idMaterial) return false
  const { rows } = await dbClient.query(
    `SELECT 1 FROM material
     WHERE "Id_Material" = $1 AND "Id_Empresa" = $2 AND "Activo" = true
     LIMIT 1`,
    [idMaterial, idEmpresa]
  )
  return rows.length > 0
}

/**
 * Sincroniza órdenes que hayan superado su fecha límite y sigan en 'En Proceso' dentro de la empresa activa.
 */
export async function actualizarOrdenesRetrasadasEmpresa(dbClient, empresaId) {
  try {
    await dbClient.query(`
      UPDATE orden_produccion
      SET "Estado" = 'Retrasada'
      WHERE "Estado" = 'En Proceso'
        AND "Fecha_Limite" < CURRENT_DATE
        AND "Id_Empresa" = $1
    `, [empresaId])
  } catch (err) {
    console.error('Error actualizando órdenes retrasadas por empresa:', err.message)
  }
}

/**
 * Lista todas las órdenes de producción pertenecientes a la empresa activa.
 */
export async function listarOrdenes(dbClient, { auth }) {
  const empresaId = assertEmpresaActiva(auth)
  await actualizarOrdenesRetrasadasEmpresa(dbClient, empresaId)

  const { rows } = await dbClient.query(`
    SELECT op.*,
           u."Nombre_Completo"   AS "Cliente",
           m."Nombre_Material"   AS "NombreMaterial",
           opr."Nombre_Completo" AS "Operario"
    FROM orden_produccion op
    INNER JOIN usuario u ON op."Id_Cliente" = u."Id_Usuario"
    INNER JOIN material m ON op."Id_Material" = m."Id_Material"
    LEFT JOIN usuario opr ON op."Id_Operario" = opr."Id_Usuario"
    WHERE op."Id_Empresa" = $1
    ORDER BY op."Fecha_Limite" ASC
  `, [empresaId])

  return rows
}

/**
 * Consulta una orden por ID validando que pertenezca a la empresa activa.
 * Si pertenece a otra empresa o no existe, retorna 404 para no revelar información.
 */
export async function obtenerOrdenPorId(dbClient, { idOrden, auth }) {
  const empresaId = assertEmpresaActiva(auth)
  await actualizarOrdenesRetrasadasEmpresa(dbClient, empresaId)

  const { rows } = await dbClient.query(`
    SELECT op.*,
           u."Nombre_Completo"   AS "Cliente",
           m."Nombre_Material"   AS "NombreMaterial",
           opr."Nombre_Completo" AS "Operario"
    FROM orden_produccion op
    INNER JOIN usuario u ON op."Id_Cliente" = u."Id_Usuario"
    INNER JOIN material m ON op."Id_Material" = m."Id_Material"
    LEFT JOIN usuario opr ON op."Id_Operario" = opr."Id_Usuario"
    WHERE op."Id_Orden" = $1
      AND op."Id_Empresa" = $2
    LIMIT 1
  `, [idOrden, empresaId])

  if (rows.length === 0) {
    const error = new Error('Orden no encontrada')
    error.statusCode = 404
    throw error
  }

  const orden = rows[0]

  if (!hasRole(auth, ['admin'])) {
    const asignacion = await dbClient.query(`
      SELECT 1 FROM orden_operario
      WHERE "Id_Orden" = $1 AND "Id_Operario" = $2
      UNION
      SELECT 1 FROM usuario_orden
      WHERE "Id_Orden" = $1 AND "Id_Usuario" = $2
      LIMIT 1
    `, [idOrden, auth.id])

    const autorizado =
      String(orden.Id_Cliente) === String(auth.id) ||
      String(orden.Id_Operario) === String(auth.id) ||
      asignacion.rows.length > 0

    if (!autorizado) {
      const error = new Error('No tienes permisos para esta orden.')
      error.statusCode = 403
      throw error
    }
  }

  return orden
}

/**
 * Lista órdenes asignadas a un operario dentro de la empresa activa.
 */
export async function listarOrdenesOperario(dbClient, { idOperario, auth }) {
  const empresaId = assertEmpresaActiva(auth)
  await actualizarOrdenesRetrasadasEmpresa(dbClient, empresaId)

  const { rows } = await dbClient.query(`
    SELECT op.*,
           u."Nombre_Completo"   AS "Cliente",
           m."Nombre_Material"   AS "NombreMaterial",
           opr."Nombre_Completo" AS "Operario"
    FROM orden_produccion op
    INNER JOIN usuario u ON op."Id_Cliente" = u."Id_Usuario"
    INNER JOIN material m ON op."Id_Material" = m."Id_Material"
    LEFT JOIN usuario opr ON op."Id_Operario" = opr."Id_Usuario"
    WHERE (
      op."Id_Operario" = $1
      OR EXISTS (
        SELECT 1 FROM orden_operario oo
        WHERE oo."Id_Orden" = op."Id_Orden" AND oo."Id_Operario" = $1
      )
    )
    AND op."Id_Empresa" = $2
    ORDER BY op."Fecha_Limite" ASC
  `, [idOperario, empresaId])

  return rows
}

/**
 * Lista órdenes de un cliente dentro de la empresa activa.
 */
export async function listarOrdenesCliente(dbClient, { idCliente, auth }) {
  const empresaId = assertEmpresaActiva(auth)
  await actualizarOrdenesRetrasadasEmpresa(dbClient, empresaId)

  const { rows } = await dbClient.query(`
    SELECT op.*,
           u."Nombre_Completo"   AS "Cliente",
           m."Nombre_Material"   AS "NombreMaterial",
           opr."Nombre_Completo" AS "Operario"
    FROM orden_produccion op
    INNER JOIN usuario u ON op."Id_Cliente" = u."Id_Usuario"
    INNER JOIN material m ON op."Id_Material" = m."Id_Material"
    LEFT JOIN usuario opr ON op."Id_Operario" = opr."Id_Usuario"
    WHERE op."Id_Cliente" = $1
      AND op."Id_Empresa" = $2
    ORDER BY op."Fecha_Limite" ASC
  `, [idCliente, empresaId])

  return rows
}

/**
 * Lista órdenes por estado filtradas por la empresa activa.
 */
export async function listarOrdenesPorEstado(dbClient, { estado, auth }) {
  const empresaId = assertEmpresaActiva(auth)
  const estadosValidos = ['En Proceso', 'Completada', 'Retrasada']
  if (!estadosValidos.includes(estado)) {
    const error = new Error('Estado inválido')
    error.statusCode = 400
    throw error
  }

  await actualizarOrdenesRetrasadasEmpresa(dbClient, empresaId)

  const { rows } = await dbClient.query(`
    SELECT op.*,
           u."Nombre_Completo"   AS "Cliente",
           m."Nombre_Material"   AS "NombreMaterial",
           opr."Nombre_Completo" AS "Operario"
    FROM orden_produccion op
    INNER JOIN usuario u ON op."Id_Cliente" = u."Id_Usuario"
    INNER JOIN material m ON op."Id_Material" = m."Id_Material"
    LEFT JOIN usuario opr ON op."Id_Operario" = opr."Id_Usuario"
    WHERE op."Estado" = $1
      AND op."Id_Empresa" = $2
    ORDER BY op."Fecha_Limite" ASC
  `, [estado, empresaId])

  return rows
}

/**
 * Crea una orden de producción validando que material, cliente y operario
 * pertenezcan a la empresa activa. Asigna Id_Empresa de forma inmutable desde la sesión.
 */
export async function crearOrden(dbClient, { ordenData, auth }) {
  const empresaId = assertEmpresaActiva(auth)
  const {
    Id_Cliente, Id_Material, Id_Operario,
    Producto, Descripcion, Cantidad,
    Prioridad, Fecha_Limite, Estado,
    Dificultad,
  } = ordenData

  if (!Id_Cliente || !Id_Material || !Descripcion || !Cantidad || !Fecha_Limite) {
    const error = new Error('Faltan campos obligatorios')
    error.statusCode = 400
    throw error
  }

  // 1. Validar que el material pertenezca a la empresa activa
  const materialValido = await assertMaterialEnEmpresa(dbClient, Id_Material, empresaId)
  if (!materialValido) {
    const error = new Error('El material seleccionado no pertenece a la empresa activa o está inactivo.')
    error.statusCode = 400
    error.code = 'CROSS_TENANT_RELATION'
    throw error
  }

  // 2. Validar que el cliente pertenezca a la empresa activa
  const clienteValido = await assertUsuarioEnEmpresa(dbClient, Id_Cliente, empresaId)
  if (!clienteValido) {
    const error = new Error('El cliente seleccionado no pertenece a la empresa activa.')
    error.statusCode = 400
    error.code = 'CROSS_TENANT_RELATION'
    throw error
  }

  // 3. Validar que el operario (si fue enviado) pertenezca a la empresa activa
  if (Id_Operario) {
    const operarioValido = await assertUsuarioEnEmpresa(dbClient, Id_Operario, empresaId)
    if (!operarioValido) {
      const error = new Error('El operario seleccionado no pertenece a la empresa activa.')
      error.statusCode = 400
      error.code = 'CROSS_TENANT_RELATION'
      throw error
    }
  }

  let estadoFinal = Estado || 'En Proceso'
  if (estadoFinal === 'En Proceso' && Fecha_Limite) {
    const hoy = new Date().toISOString().split('T')[0]
    const fLim = typeof Fecha_Limite === 'string' ? Fecha_Limite.split('T')[0] : ''
    if (fLim && fLim < hoy) {
      estadoFinal = 'Retrasada'
    }
  }

  const { rows } = await dbClient.query(`
    INSERT INTO orden_produccion (
      "Id_Cliente", "Id_Material", "Id_Operario", "Producto", "Descripcion",
      "Cantidad", "Prioridad", "Fecha_Limite", "Estado", "Dificultad", "Id_Empresa"
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING "Id_Orden"
  `, [
    Id_Cliente,
    Id_Material,
    Id_Operario || null,
    Producto    || null,
    Descripcion,
    Cantidad,
    Prioridad   || 'Media',
    Fecha_Limite,
    estadoFinal,
    Dificultad  || 'Media',
    empresaId, // Inmutable: derivado exclusivamente de req.auth.empresaId
  ])

  return { idOrden: rows[0].Id_Orden }
}

/**
 * Actualiza una orden validando pertenencia a la empresa activa y consistencia entre entidades.
 */
export async function actualizarOrden(dbClient, { idOrden, ordenData, auth }) {
  const empresaId = assertEmpresaActiva(auth)
  const {
    Id_Cliente, Id_Material, Id_Operario, Producto, Descripcion,
    Cantidad, Prioridad, Fecha_Limite, Estado,
    Unidades, Unidades_Realizadas,
    Dificultad,
  } = ordenData

  // 1. Validar que la orden pertenezca a la empresa activa
  const check = await dbClient.query(
    `SELECT "Id_Orden" FROM orden_produccion WHERE "Id_Orden" = $1 AND "Id_Empresa" = $2`,
    [idOrden, empresaId]
  )
  if (check.rows.length === 0) {
    const error = new Error('Orden no encontrada')
    error.statusCode = 404
    throw error
  }

  // 2. Si se actualiza material, validar pertenencia
  if (Id_Material) {
    const matValido = await assertMaterialEnEmpresa(dbClient, Id_Material, empresaId)
    if (!matValido) {
      const error = new Error('El material seleccionado no pertenece a la empresa activa.')
      error.statusCode = 400
      error.code = 'CROSS_TENANT_RELATION'
      throw error
    }
  }

  // 3. Si se actualiza cliente, validar pertenencia
  if (Id_Cliente) {
    const cliValido = await assertUsuarioEnEmpresa(dbClient, Id_Cliente, empresaId)
    if (!cliValido) {
      const error = new Error('El cliente seleccionado no pertenece a la empresa activa.')
      error.statusCode = 400
      error.code = 'CROSS_TENANT_RELATION'
      throw error
    }
  }

  // 4. Si se actualiza operario, validar pertenencia
  if (Id_Operario) {
    const opValido = await assertUsuarioEnEmpresa(dbClient, Id_Operario, empresaId)
    if (!opValido) {
      const error = new Error('El operario seleccionado no pertenece a la empresa activa.')
      error.statusCode = 400
      error.code = 'CROSS_TENANT_RELATION'
      throw error
    }
  }

  let estadoFinal = Estado || 'En Proceso'
  if (estadoFinal === 'En Proceso' && Fecha_Limite) {
    const hoy = new Date().toISOString().split('T')[0]
    const fLim = typeof Fecha_Limite === 'string' ? Fecha_Limite.split('T')[0] : ''
    if (fLim && fLim < hoy) {
      estadoFinal = 'Retrasada'
    }
  }

  const { rowCount } = await dbClient.query(`
    UPDATE orden_produccion
    SET "Id_Cliente"          = $1,
        "Id_Material"         = $2,
        "Id_Operario"         = $3,
        "Producto"            = $4,
        "Descripcion"         = $5,
        "Cantidad"            = $6,
        "Prioridad"           = $7,
        "Fecha_Limite"        = $8,
        "Estado"              = $9,
        "Unidades"            = COALESCE($10, "Unidades"),
        "Unidades_Realizadas" = COALESCE($11, "Unidades_Realizadas"),
        "Dificultad"          = $12
    WHERE "Id_Orden"   = $13
      AND "Id_Empresa" = $14
  `, [
    Id_Cliente,
    Id_Material,
    Id_Operario || null,
    Producto    || null,
    Descripcion,
    Cantidad,
    Prioridad,
    Fecha_Limite,
    estadoFinal,
    Unidades ?? null,
    Unidades_Realizadas ?? null,
    Dificultad || 'Media',
    idOrden,
    empresaId,
  ])

  if (rowCount === 0) {
    const error = new Error('Orden no encontrada')
    error.statusCode = 404
    throw error
  }

  return { ok: true }
}

/**
 * Elimina una orden asegurando que pertenezca a la empresa activa.
 */
export async function eliminarOrden(dbClient, { idOrden, auth }) {
  const empresaId = assertEmpresaActiva(auth)

  const { rowCount } = await dbClient.query(
    `DELETE FROM orden_produccion WHERE "Id_Orden" = $1 AND "Id_Empresa" = $2`,
    [idOrden, empresaId]
  )

  if (rowCount === 0) {
    const error = new Error('Orden no encontrada')
    error.statusCode = 404
    throw error
  }

  return { ok: true }
}
