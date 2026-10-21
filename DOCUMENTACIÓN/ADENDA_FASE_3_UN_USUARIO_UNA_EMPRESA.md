# Adenda — una membresía por usuario

## Decisión y cambio mínimo

**HECHO OBSERVADO.** `public.usuario_empresa` define `Estado` con valores `activo`/`inactivo` y `Es_Principal` (`DATABASE/MIGRACION_FASE_3_DEFINITIVA.sql:103-109`). El cambio aplica unicidad global por `Id_Usuario`, así que una membresía inactiva también ocupa la única fila del usuario. Es la opción más estricta y simple para la regla de producto de una sola empresa.

Se añadió un precheck condicional al inicio del bloque transaccional, antes del precheck de catálogo (`:10-21`). Si existe `public.usuario_empresa`, cuenta usuarios con más de una fila sin filtrar por Estado y aborta con el número de usuarios afectados. En la ruta limpia prevista, el precheck no encuentra esa tabla; la migración la crea más abajo y siembra una membresía principal por cada usuario (`:102-109,128-145`). Esto describe la ruta limpia del SQL; no presupone datos previos en `usuario_empresa`.

Se añadió `CONSTRAINT usuario_empresa_un_usuario_unique UNIQUE ("Id_Usuario")` en la definición de la tabla (`:113`). El índice parcial `usuario_empresa_principal_unique` (`:117-119`) queda redundante porque la nueva restricción cubre todas las filas, pero se conserva como se solicitó. **Propuesta futura, fuera de este cambio:** evaluar su eliminación en una revisión separada, verificando dependencias y cualquier contrato de esquema antes de tocarlo.

## Invariantes B-01..B-18 relacionadas con membresías

**HECHO OBSERVADO.** Siguen siendo válidas; la nueva unicidad añade una condición estructural más estricta, no reemplaza las validaciones de empresa, estado ni referencias compuestas:

- B-03 cliente de la orden pertenece a su empresa; B-04 operario de la orden tiene membresía activa; B-05 cliente de material pertenece a su empresa (`:254-283`).
- B-13 operario de fase tiene membresía activa; B-15 usuario de `usuario_orden` pertenece a la empresa de la orden (`:355-397`).
- B-16 usuario del comprobante pertenece a la empresa (`:403-408`).
- B-17 administrador/operario de observación tiene membresía activa compatible (`:411-444`).
- B-18 tokens Calendar alineados con la membresía principal activa de la misma empresa (`:447-458`).

B-01 y las demás invariantes sobre empresas/materiales/órdenes mantienen su propósito y no dependen de que una persona tenga varias membresías. La unicidad de `Id_Usuario` hace imposible la multiplicidad, pero no vuelve innecesarias las comprobaciones de que exista membresía y de que su estado/empresa concuerde.

## Pruebas en clones desechables

**HECHO OBSERVADO.** Se usaron clones nuevos de `texticode_baseline2` en el clúster temporal PostgreSQL 17.10, conectado a `127.0.0.1:5433`, con rol `texticode_test_20261009`. Antes de cada consulta o ejecución de archivo se comprobó base, rol, dirección loopback y puerto. Las pruebas se hicieron con datos sintéticos; no se ejecutó el backend.

| Prueba | Esperado justificado | Resultado real | Veredicto |
|---|---|---|---|
| A-1 | Migración completa; conservar filas y valores legados de 12 tablas; nueve columnas empresariales `NOT NULL`; una membresía por usuario. | Exit 0; 12 tablas; huellas de datos iguales; 9 columnas `NOT NULL`; `usuario_empresa` `5 filas / 5 usuarios distintos`, `usuario` 5. | **APROBADA** |
| A-2 | FKs compuestas rechazan cliente/operario/material de otra empresa (`23503`). Usuarios distintos por empresa para evitar el escenario anterior de membresías múltiples. | Usuario sintético 900031 en empresa B y usuarios legados en empresa principal A; fallaron material-cliente `fk_material_cliente_empresa`, orden-cliente `fk_op_cliente_empresa` y orden-operario `fk_op_operario_empresa`; los tres `23503`. | **APROBADA** |
| A-3 | Mismo nombre en empresas diferentes permitido; duplicado dentro de una empresa rechazado por índice único. | Mismo nombre en B aceptado; repetición en B `23505`, `material_empresa_nombre_unique`. | **APROBADA** |
| A-4a — 11 prechecks existentes | Cada precheck aborta antes de mutar; SQLSTATE `P0001`, mensaje con una fila/objeto y huella pre/post idéntica. | Catálogo: 1 objeto; usuario/rol: 1 usuario; material: 1 fila; orden: 1; movimiento: 1; orden_material: 1; orden_operario: 1; usuario_orden: 1; comprobantes: 1; observación: 1; Google tokens: 1. Todos `P0001`; todas las huellas pre/post idénticas. | **APROBADA** |
| A-4b — nuevo precheck | Si la tabla existente tiene usuarios duplicados, contar usuarios, incluidos duplicados con fila inactiva, y abortar sin mutación. | Dos usuarios tenían dos filas cada uno (una activa y otra inactiva). Mensaje: `PRECHECK public.usuario_empresa: 2 usuarios tienen más de una membresía; se requiere una fila por usuario.` `P0001`; huella idéntica. | **APROBADA** |
| A-5 — segunda ejecución | La repetición se rechaza limpiamente antes de cambios. | `P0001`, `PRECHECK public.catalogo: 12 objetos de migración ya existen; se requiere esquema inicial limpio.` Huella pre/post idéntica. | **APROBADA** |
| A-6 | Secuencias predeterminadas asignan los IDs siguientes del fixture. | Material 6; orden 4. | **APROBADA** |
| B-1 | Seis relaciones compuestas de empresas cruzadas se rechazan (`23503`). Usar usuarios distintos por empresa. | Orden-material `fk_om_producto_empresa`; usuario-orden `fk_uo_usuario_empresa`; orden-operario `fk_oo_operario_empresa`; comprobante `fk_comp_usuario_empresa`; observación `fk_obs_admin_empresa`; movimiento `fk_material_movimiento_material_empresa`. Las seis dieron `23503`. | **APROBADA** |
| M-1 | Segunda membresía del mismo usuario en otra empresa rechazada por la restricción nueva. | `23505`, `usuario_empresa_un_usuario_unique`; la prueba marcó la segunda fila no principal. | **APROBADA** |
| M-2 | Observar si se permite cambiar la empresa de una membresía única. | Para un usuario con material que lo referencia en la empresa original, el UPDATE se rechazó con `23503`, `fk_material_cliente_empresa`. | **APROBADA** |
| M-3 | No poder construir el caso B7 de un usuario con material en dos empresas. | Segunda membresía rechazada con `23505`, `usuario_empresa_un_usuario_unique`; asignar ese usuario como cliente de material en B sin membresía B rechazado con `23503`, `fk_material_cliente_empresa`. | **APROBADA** |

**Aclaraciones de ejecución.** El comprobador auxiliar de A-1 terminó con una aserción defectuosa porque comparó la salida `5|5` (filas/membresías distintas) contra `5` (usuarios), aunque la consulta mostraba cinco filas y cinco usuarios distintos, la migración terminó con exit 0, las 12 huellas coincidieron y las nueve columnas quedaron `NOT NULL`. El veredicto A-1 se basa en esas salidas directas.

En B-1, un intento inicial del arnés incluyó la columna `Funcion` en `usuario_orden`; PostgreSQL respondió `42703` (`no existe la columna «Funcion» en la relación «usuario_orden»`). La tabla real del clon tenía `Id_Usuario_Orden`, `Id_Orden`, `Id_Usuario` e `Id_Empresa`. Se repitió esa sentencia con las columnas existentes y dio el resultado esperado: `23503`, `fk_uo_usuario_empresa`. No se cambió el SQL de migración como respuesta a ese intento. El uso de `Funcion` por el controlador de backend queda fuera de alcance y no se corrigió.

## Reasignación de membresía y alcance de los datos

**HECHO OBSERVADO.** M-2 rechazó reasignar la fila que tenía una FK hija en `material` (`fk_material_cliente_empresa`, `23503`). La migración define además FKs compuestas desde órdenes, fases, asignaciones de usuario, comprobantes, observaciones y tokens, sin `ON UPDATE CASCADE` (`:498-535`).

**Conclusión limitada.** Si una orden, comprobante u otro registro hijo sigue ligado a la empresa anterior, la actualización de la clave de membresía se rechazará hasta que esas referencias se migren/eliminaran conforme a una decisión de datos. No se probaron por separado todas esas tablas hijas en M-2. Si no hay filas dependientes, el UPDATE de la membresía puede reasignar al usuario; la nueva unicidad impide que conserve simultáneamente otra fila. La migración no crea por sí misma un proceso de transferencia de datos.

## Fuera de alcance y estado

No se corrigió backend, no se añadió RLS, no se cambiaron roles ni extensiones, no se usaron metacomandos y no se insertaron commits intermedios. No se probó PostgreSQL 15/16 ni datos reales; la migración **no queda aprobada** para entornos compartidos. No se modificó el índice parcial redundante.

El clúster y todos los clones quedan conservados. El procedimiento controlado de acceso restauró `pg_hba.conf`; SHA-256 restaurado: `EF22BB9557EB84F3DBEDBB3219120EE95028FC7ADA5F1D2FCC16D7F05D41EABF`. La regla temporal se limitó al rol autorizado y a `127.0.0.1/32`; no se guardó ni imprimió la contraseña nueva.

No se usó 5432 ni otro destino; no se leyó `.env`, no se ejecutó backend, `DATABASE/FASE_3.sql` ni rollback; no se borró clúster ni clones; no se hizo push, fetch ni checkout.
