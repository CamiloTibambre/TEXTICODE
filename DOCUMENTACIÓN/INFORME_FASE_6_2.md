# Informe — Fase 6.2: superadmin y gestión de empresas

## Hechos observados

### Diseño y cambios

Se eligió el nombre exacto `superadmin`, en minúsculas, para `rol."Nombre_Rol"`. El esquema inicial define los roles y el rol global del usuario (`Id_Rol`); la migración define `empresa` con `Nombre_Empresa`, `Slug`, `Estado`, `Fecha_Creacion` y `Updated_At`; `Estado` acepta `activa` e `inactiva`. `empresa_config` tiene valores por defecto y `usuario_empresa` relaciona empresa, usuario, rol y estado. Evidencia: `DATABASE/ESQUEMA_INICIAL_REPRODUCIBLE.sql:12-28`, `DATABASE/MIGRACION_FASE_3_DEFINITIVA.sql:79-115`.

- `BACKEND/middleware/auth.js`: `requireAuth` devuelve 403 al rol actual `superadmin`; la nueva `requireSuperadmin` comprueba token, rol y estado actuales en BD y ausencia de filas de membresía en cada petición. El claim no basta. Evidencia: líneas 110-111 y 146-194.
- `BACKEND/services/auth.service.js`: login global solo sin membresía; el token conserva rol e identidad y omite empresa. Para los otros roles sigue vigente el comportamiento de Fase 6.1. Evidencia: líneas 116-134.
- `BACKEND/routes/auth.route.js`: password login y Google móvil permiten sesión global sin agregar campos distintos a la respuesta existente. Se devuelve `token` y `usuario`, sin `empresaActiva`. `/api/auth/validar-token` valida un token de recuperación de contraseña, no una sesión autenticada; no requería excepción.
- `BACKEND/routes/empresas.js` (nuevo): toda la ruta usa `requireSuperadmin`. Incluye GET lista/detalle, POST transaccional de empresa/configuración/admin/membresía, PUT empresa, desactivación empresa, y lista/edición/desactivación de administradores. Se usa la validación fuerte de contraseña existente y bcrypt costo 10; las respuestas no exponen hash.
- El esquema tiene estado en empresa, por eso DELETE HTTP de la API desactiva (`inactiva`) empresa y membresías, sin borrado físico. Nombre duplicado se comprueba y slug duplicado (`23505`) se convierte a 409.
- `BACKEND/routes/usuarios.js`: bloquea asignar rol superadmin y modificar, inactivar o borrar un usuario superadmin.
- `BACKEND/routes/roles.js`: bloquea crear, renombrar o borrar el rol superadmin.
- `BACKEND/index.js`: añade únicamente el montaje `/api/empresas`; no cambia los demás.
- `DATABASE/SEED_SUPERADMIN.sql` (nuevo): INSERT idempotente del rol y plantilla comentada de usuario con marcadores. No incluye contraseña/hash real, metacomandos, `TRUNCATE` ni `DROP`.

El login superadmin no necesita un campo de respuesta nuevo: lleva `rolNombre: superadmin` en el token, sin claim de empresa, y mantiene la forma existente `token`/`usuario`.

### Pruebas unitarias S1–S12

Comando único ejecutado: `node --test BACKEND/test/fase-6-2-superadmin.test.js BACKEND/test/fase-6-contexto-empresa.test.js` (código de salida 0). Los tests nuevos transforman las importaciones de BD/configuración a dobles en memoria; solo usan `node:test`, `node:assert` y `node:fs/promises`. No cargan dotenv, no leen `.env`, no conectan a BD/red ni ejecutan procesos externos.

| ID | Esperado | Veredicto |
|---|---|---|
| S1 | Login superadmin sin membresía; token con rol y sin empresa | APROBADA |
| S2 | `requireAuth` operativo rechaza superadmin con 403 | APROBADA |
| S3 | Admin de empresa en guarda superadmin: 403 | APROBADA |
| S4 | Sin token en empresas: 401 | APROBADA |
| S5 | Claim superadmin pero rol BD distinto: 403 | APROBADA |
| S6 | Empresa, config, admin y membresía en una transacción; sin hash en respuesta | APROBADA |
| S7 | Fallo intermedio revierte y no deja filas en mock | APROBADA |
| S8 | Nombre o slug duplicado: 409 | APROBADA |
| S9 | Baja con datos: desactivación, HTTP 200 | APROBADA |
| S10 | Admin no puede asignar rol superadmin por usuarios | APROBADA |
| S11 | No superadmin no puede crear/editar/borrar rol ni modificar usuario superadmin | APROBADA |
| S12 | Regresión Fase 6.1, P1–P8 | APROBADA |

Salida literal de Node:

```text
✔ preparación usa dobles en memoria y no importa env.js, db.js ni procesos externos (1.243ms)
✔ S1: superadmin global sin membresía obtiene token sin empresa (0.6898ms)
✔ S2: superadmin consultado en BD recibe 403 en requireAuth operativo (0.463ms)
✔ S3: admin de empresa recibe 403 en requireSuperadmin (0.6187ms)
✔ S4: falta de token recibe 401 en requireSuperadmin (0.3826ms)
✔ S5: claim superadmin con rol distinto en BD recibe 403 (0.2682ms)
✔ S6: crea empresa, configuración, admin y membresía en transacción; no devuelve hash (2.2112ms)
✔ S7: error a mitad de creación ejecuta rollback y no conserva filas simuladas (0.3269ms)
✔ S8: nombre duplicado y slug duplicado responden 409 (0.6268ms)
✔ S9: baja de empresa con datos es desactivación y no DELETE físico (0.4328ms)
✔ S10: admin no puede asignar rol superadmin por /api/usuarios (0.3859ms)
✔ S11: no superadmin no puede gestionar rol superadmin ni modificar ese usuario (0.844ms)
✔ prepara módulos con dobles: no importa env.js, db.js ni módulos externos de red (14.0445ms)
✔ P1: login deriva la empresa única e ignora la empresa del cliente; select-empresa queda deprecado e ignora su empresa (1.5251ms)
✔ P2: login sin membresía activa responde HTTP 403 (0.1411ms)
✔ P3: login con membresía inactiva responde HTTP 403 (0.1759ms)
✔ P4: requireAuth devuelve 403 si se desactiva la membresía después de emitir el token (0.3137ms)
✔ P5: requireAuth devuelve 403 si la empresa del token no coincide con la membresía (0.1282ms)
✔ P6: requireAuth conserva empresaId del token aunque body, query y params indiquen otra (0.1396ms)
✔ P7: token ausente, vencido e con firma inválida mantienen rechazo HTTP 401 (0.305ms)
✔ P8: usuario inactivo sigue en 403 y un rol distinto conserva el rol del token como antes (0.3189ms)
ℹ tests 21
ℹ suites 0
ℹ pass 21
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 231.3468
```

### Validación SQL del seed

La identidad consultada fue `current_database(), current_user, inet_server_addr(), inet_server_port()`. Base fuente: `texticode_migrada|texticode_test_20261009|127.0.0.1|5433`. Clon `f62seed_20261011` creado desde la fuente: `f62seed_20261011|texticode_test_20261009|127.0.0.1|5433` (PostgreSQL 17.10).

- El rol no existía en fuente ni clon antes de probar.
- Primera ejecución: `INSERT 0 1`, código 0. Segunda: `INSERT 0 0`, código 0. Después existe exactamente un `superadmin`; roles: 3 → 4.
- Se compararon conteos de las 15 tablas públicas. Solo `rol` aumentó en una fila; las otras 14, incluida `usuario`, quedaron iguales.
- Para recuperar conexión, se añadió temporalmente `trust` solo para `texticode_test_20261009` desde `127.0.0.1/32`. Se restauró en `finally`, sin cambiar contraseña. SHA-256 antes, respaldo y restaurado: `EF22BB9557EB84F3DBEDBB3219120EE95028FC7ADA5F1D2FCC16D7F05D41EABF`; `pg_ctl reload` de restauración salió 0.

### Rutas y límites observados

La guarda operativa bloquea a superadmin en `/api/materiales`, `/api/ordenes`, `/api/comprobantes`, `/api/roles`, `/api/orden-material`, `/api/orden-operario`, `/api/usuario-orden`, `/api/notificaciones`, `/api/practica`, `/api/eficiencia` y `/api/carga-trabajo` (`BACKEND/index.js:41-48,51-53`; decisión 403 en `BACKEND/middleware/auth.js:110-111`). Las operaciones protegidas de usuarios también aplican `requireAuth` (`BACKEND/routes/usuarios.js:57,73,149,179,214,229`). Empresas está bajo `requireSuperadmin` (`BACKEND/routes/empresas.js:7`).

**SUPOSICIÓN / pendiente:** los montajes `/api/google` y `/api/calendar` no tienen `requireAuth` global (`BACKEND/index.js:54-55`). Sus routers no se inspeccionaron porque no estaban entre los archivos autorizados; no puedo afirmar que bloqueen superadmin internamente. `/health`, `/` y los flujos públicos de autenticación tampoco exigen sesión global en el montaje. Esto impide afirmar que todo el backend cumple “solo gestión de empresas”.

No cubre las 75 rutas y los siete INSERT de Fase 7, UI web/móvil, rutas contra base real ni ejecución del backend. Las pruebas de rutas son con mocks; la BD solo se usó para validar el seed en el clon. **No se declara aprobada la autenticación ni la gestión de empresas.**

## Estado y confirmaciones

Rama: `codex/fase-6-contexto-empresa`. Hash del commit y estado Git final se dan en el resumen del chat, porque este informe pertenece al mismo commit.

No se ejecutó backend ni npm; no se leyó `.env`; no se usó 5432; no hubo push, fetch ni cambio de rama; no se tocó `MIGRACION_FASE_3_DEFINITIVA.sql` ni rollback; no se borró el clúster ni el clon `f62seed_20261011`.

Nota de alcance: se abrió accidentalmente `BACKEND/middleware/roles.js`, que no figuraba en la lista de lectura autorizada. No se modificó.
