# TEXTICODE — Guía de Validación en Entorno Aislado (Staging / Desechable)

> **Estado:** Documento de procedimiento técnico para validación en base de datos aislada.
> **Regla de oro:** No ejecutar contra Supabase sin confirmación explícita de entorno y respaldo restaurable verificado.

---

## 1. Requisitos Previos Obligatorios antes de Tocar la Base de Datos

Antes de ejecutar cualquier sentencia DDL o DML de migración:

1. **Identificador del Proyecto Supabase:**
   * Verificar en el Supabase Dashboard que el `Project Ref` y la URL del host correspondan de forma unívoca a un proyecto de prueba o staging (por ejemplo: `texticode-staging-xxxx`).
   * **ADVERTENCIA:** La variable de entorno `NODE_ENV=staging` no garantiza por sí sola que la base de datos sea de staging. Debe comprobarse el hostname y project ref en Supabase.
2. **Cero Datos de Producción:**
   * Confirmar por escrito con el responsable del proyecto que la base conectada no contiene pedidos, materiales o usuarios reales de clientes en producción.
3. **Copia de Seguridad Restaurable (Backup):**
   * Generar un dump lógico completo previo:
     ```bash
     pg_dump -h <host> -U <usuario> -d <database> -F c -b -v -f texticode_pre_migracion_$(date +%Y%m%d_%H%M%S).dump
     ```
   * Probar que el archivo de dump no esté vacío y pueda ser restaurado en una base local limpia.
4. **Cuentas y Datos de Prueba Autorizados (Dataset A/B):**
   * Definir y autorizar correos de QA controlados para pruebas:
     * `qa+admin-a@texticode.test` (Admin Empresa A)
     * `qa+operario-a@texticode.test` (Operario Empresa A)
     * `qa+cliente-a@texticode.test` (Cliente Empresa A)
     * `qa+admin-b@texticode.test` (Admin Empresa B)
     * `qa+operario-b@texticode.test` (Operario Empresa B)
     * `qa+cliente-b@texticode.test` (Cliente Empresa B)

---

## 2. Procedimiento de Validación en Entorno Desechable (Docker Local)

Para validar el script [BORRADOR_SQL_MULTIEMPRESA_REVISION_3.sql](file:///c:/Users/USER/Desktop/TEXTICODE/DOCUMENTACIÓN/BORRADOR_SQL_MULTIEMPRESA_REVISION_3.sql) en un contenedor PostgreSQL 15/16 100% aislado sin ningún riesgo de red:

### Paso 1: Levantar PostgreSQL local desechable
```bash
docker run --name texticode-test-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=texticode_test -p 5433:5432 -d postgres:15
```

### Paso 2: Cargar el esquema actual (pre-migración)
* Restaurar la estructura actual de las 12 tablas (`usuario`, `rol`, `material`, `orden_produccion`, etc.) con datos de prueba sintéticos.

### Paso 3: Ejecutar Fase 0 (Pre-checks de integridad)
* Ejecutar las consultas de la Fase 0 de `BORRADOR_SQL_MULTIEMPRESA_REVISION_3.sql`.
* Verificar que el conteo de huérfanos sea estrictamente **0**:
  * Materiales con cliente huérfano = 0.
  * Órdenes con cliente/material/operario huérfano = 0.
  * Movimientos y comprobantes huérfanos = 0.

### Paso 4: Ejecutar Fases 1 a 5 secuencialmente
* Ejecutar Fase 1: Creación de `empresa`, `empresa_config`, `usuario_empresa`.
* Ejecutar Fase 2: Sembrado de `Empresa Principal` y membresías.
* Ejecutar Fase 3: Adición de `Id_Empresa` y backfill.
* Ejecutar Fase 4: Validar que `COUNT(*) WHERE Id_Empresa IS NULL` sea **0**.
* Ejecutar Fase 5: Aplicación de `NOT NULL`, constraints compuestas e índices.

### Paso 5: Prueba de Fuego — Inyección de Violaciones Relacionales (Debe fallar)
Ejecutar intentos deliberados de cruce entre empresas para verificar que PostgreSQL rechaza:
1. Intentar insertar una orden con `Id_Empresa = 1` y `Id_Material` perteneciente a `Id_Empresa = 2`.
   * **Resultado esperado:** Error de PostgreSQL `23503 (fk_op_material_empresa)`.
2. Intentar registrar un usuario con dos empresas marcadas como `Es_Principal = true`.
   * **Resultado esperado:** Error de PostgreSQL `23505 (usuario_empresa_principal_unique)`.
3. Intentar registrar dos materiales con el mismo nombre en la misma empresa.
   * **Resultado esperado:** Error de PostgreSQL `23505 (material_empresa_nombre_unique)`.
4. Registrar un material con el mismo nombre en Empresa 1 y Empresa 2.
   * **Resultado esperado:** Éxito (aislamiento multiempresa concedido).

---

## 3. Plan de Integración en el Backend (Conexión de Rutas)

Una vez que la base de datos de staging confirme que las Fases 1 a 5 de `BORRADOR_SQL_MULTIEMPRESA_REVISION_3.sql` se aplicaron exitosamente:

1. **Conexión de `materiales.js`:**
   * Actualizar [BACKEND/routes/materiales.js](file:///c:/Users/USER/Desktop/TEXTICODE/BACKEND/routes/materiales.js) para delegar sus endpoints en las funciones de [BACKEND/services/materiales.service.js](file:///c:/Users/USER/Desktop/TEXTICODE/BACKEND/services/materiales.service.js).
   * Agregar [BACKEND/middleware/empresa.js](file:///c:/Users/USER/Desktop/TEXTICODE/BACKEND/middleware/empresa.js) (`requireEmpresa`) a nivel de router en `BACKEND/index.js`:
     ```js
     app.use('/api/materiales', requireAuth, requireEmpresa, materialesRouter)
     ```
2. **Conexión de `ordenes.js`:**
   * Actualizar [BACKEND/routes/ordenes.js](file:///c:/Users/USER/Desktop/TEXTICODE/BACKEND/routes/ordenes.js) para delegar en [BACKEND/services/ordenes.service.js](file:///c:/Users/USER/Desktop/TEXTICODE/BACKEND/services/ordenes.service.js).
   * Proteger el router con `requireEmpresa` en `BACKEND/index.js`:
     ```js
     app.use('/api/ordenes', requireAuth, requireEmpresa, ordenesRouter)
     ```
3. **No regresión y Cero Fallback Ciego:**
   * No capturar errores `42703` ni degradar a consultas sin empresa. Si un cliente solicita una ruta empresarial sin empresa en el JWT, el middleware responde `403 TENANT_REQUIRED`.
