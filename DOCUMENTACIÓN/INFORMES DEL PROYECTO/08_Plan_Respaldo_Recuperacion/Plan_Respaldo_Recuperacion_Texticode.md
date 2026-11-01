# PLAN DE RESPALDO Y RECUPERACIÓN DE DATOS
## Sistema TEXTICODE — Gestión de producción para talleres de confección

| Campo | Valor |
|---|---|
| **Programa** | Tecnólogo en Análisis y Desarrollo de Software (ADSO) — SENA CEET |
| **Ficha** | 3278639 |
| **Integrantes** | Kevin Stevan Wagner Montenegro · Andrés Felipe Lancheros · Camilo Andrés Tibambre · Kevin Andrés Castro |
| **Responsable técnico** | Kevin Wagner |
| **Docente** | Ing. Edwin Marín |
| **Fecha de preparación** | 29 de octubre de 2026 |
| **Versión** | 1.0 |
| **Estado** | En revisión (pendiente: evidencias del Laboratorio 1, Laboratorio 2 y simulacro) |
| **Documento de referencia** | Guía de aprendizaje "Plan de Respaldo y Recuperación de Datos" (modelo `02.6_Plan_Respaldo_Datos.md`, sistema EBS) |

> **Cómo leer este documento.** Los datos de la base (tablas, filas, tamaño, versión, políticas, triggers) son **reales**, consultados en modo solo lectura el 29/10/2026 sobre el proyecto Supabase de Texticode. Los campos marcados **[COMPLETAR]** son evidencias que el equipo debe llenar al ejecutar los laboratorios y el simulacro (tiempos medidos, capturas, huellas SHA-256). No se publican aquí la referencia del proyecto, la URL, contraseñas ni datos personales.

---

## 0. Contexto del sistema

Texticode es una aplicación **multiempresa** para talleres de confección: un superadministrador crea empresas (talleres) y cada empresa gestiona sus usuarios (administrador, operario, cliente), inventario de materiales, órdenes de producción por fases, comprobantes de entrega y observaciones a operarios.

| Componente | Tecnología | Dónde vive | Qué contiene |
|---|---|---|---|
| Base de datos | PostgreSQL **17.6** (Supabase, región us-west-1) | Nube Supabase (plan Free) | **Todos los datos del negocio** |
| Backend | Node.js + Express, conexión directa con `pg.Pool` (`DATABASE_URL`) | Docker en el equipo del responsable técnico | Lógica, JWT, integraciones (SendGrid, Google Calendar) |
| Frontend web | Vue 3 + Vite | Vercel (despliegue oficial) | Sin datos propios |
| App móvil | Flutter (`texticode_mobile`) | Dispositivos de prueba | Solo el JWT en `flutter_secure_storage` |
| Código fuente | Git | GitHub (`CamiloTibambre/TEXTICODE`) | Código, scripts SQL de migración en `DATABASE/` |

**Inventario real de la base de datos (esquema `public`, 29/10/2026):**

| # | Tabla | Filas | Tamaño en disco | RLS |
|---|---|---:|---:|:---:|
| 1 | `orden_material` | 103 | 64 kB | No |
| 2 | `material_movimiento` | 60 | 104 kB | Sí |
| 3 | `orden_operario` | 52 | 152 kB | Sí |
| 4 | `orden_produccion` | 51 | 136 kB | No |
| 5 | `comprobantes` | 37 | 72 kB | No |
| 6 | `usuario` | 32 | 96 kB | Sí |
| 7 | `usuario_empresa` | 31 | 88 kB | Sí |
| 8 | `material` | 26 | 120 kB | No |
| 9 | `google_calendar_tokens` | 11 | 72 kB | No |
| 10 | `tokens_recuperacion` | 6 | 56 kB | No |
| 11 | `empresa` | 5 | 40 kB | Sí |
| 12 | `empresa_config` | 5 | 32 kB | Sí |
| 13 | `rol` | 4 | 40 kB | Sí |
| 14 | `observacion_operario` | 4 | 32 kB | No |
| 15 | `usuario_orden` | 0 | 8 kB | Sí |
| | **Total** | **427** | **≈ 1,07 MB** | |

Otros objetos que el respaldo debe conservar: **5 tipos ENUM** (`estado_usuario`, `estado_orden`, `prioridad_orden`, `dificultad_orden`, `estado_comprobante`), **10 secuencias**, **41 índices**, **2 funciones** (`actualizar_ordenes_retrasadas`, `set_orden_operario_updated_at`), **1 trigger** (`trg_orden_operario_updated_at`), **1 política RLS** (lectura en `rol`), llaves foráneas simples y **compuestas por empresa** (`Id_X`, `Id_Empresa`), y restricciones `CHECK`.

Tamaño total de la base (`pg_database_size`): **12 MB** (incluye los esquemas internos de Supabase; los datos propios ocupan ≈ 1,07 MB).

Hallazgos que condicionan el plan:

- **`auth.users` tiene 0 filas y no hay buckets de Storage.** Texticode no usa Supabase Auth: los usuarios y sus contraseñas (hash bcrypt) están en `public.usuario`. Por eso **el esquema `public` es todo el sistema**, y respaldarlo completo es suficiente y obligatorio.
- **El backend se conecta con `pg` directo** (no con la API REST ni con la anon key). Las políticas RLS no lo afectan, y cualquier medida de "solo lectura" debe hacerse con permisos (`REVOKE`) o con modo mantenimiento en el backend, no con políticas.
- **7 tablas tienen RLS desactivado** (`material`, `orden_produccion`, `comprobantes`, `google_calendar_tokens`, `observacion_operario`, `orden_material`, `tokens_recuperacion`). Con la anon key pública cualquiera podría leer o modificar esas filas vía REST. Es un riesgo de pérdida/alteración de datos que este plan registra en la Sección 8 (ver recomendación en el Anexo D).

---

## 1. Objetivo y Alcance

### 1.1 Objetivo general

Garantizar que la información de producción, inventario, entregas y usuarios de cada taller registrado en Texticode pueda **recuperarse completa e íntegra** ante errores humanos, migraciones fallidas, pérdida del proyecto en la nube o ataques, perdiendo como máximo **24 horas** de datos y volviendo a operar en máximo **4 horas**.

### 1.2 RPO y RTO justificados con el negocio

| Indicador | Valor | Justificación |
|---|---|---|
| **RPO** (pérdida máxima) | **24 horas** (objetivo típico: < media jornada) | Un taller registra pocas órdenes por día (en los últimos 30 días hubo 1 orden nueva y 9 movimientos de inventario). Perder un día obliga a redigitar órdenes y movimientos desde las remisiones en papel: molesto pero recuperable. Perder **una hora** casi no tiene impacto. Hacemos **2 respaldos diarios** (12:30 y 19:30); si el equipo del responsable estuvo apagado y se salta una ejecución, el peor caso sigue siendo ≤ 24 h. Un RPO de 1 hora **no es alcanzable** con el plan Free (ver 1.4). |
| **RTO** (caída máxima) | **4 horas** | El taller puede trabajar media jornada con órdenes impresas. La restauración técnica de una base de ~1 MB toma minutos; las 4 horas cubren detección, aviso al equipo, cambio de `DATABASE_URL`, reinicio del backend y validación, incluso si el responsable principal no está y actúa el suplente. RTO medido en el Laboratorio 2: **[COMPLETAR] min**. |
| **Disponibilidad objetivo** | 99 % mensual (≈ 7 h de caída al mes) | Coherente con un servicio académico en plan gratuito sin réplicas. |
| **Integridad** | Huella SHA-256 de cada respaldo + conteo de filas por tabla + consultas de validación (Anexo B) | Un respaldo que no se verifica no cuenta. |

### 1.3 Alcance

**Incluye:**

- Base de datos PostgreSQL completa del esquema `public`: estructura (tablas, tipos, secuencias, índices, funciones, triggers, políticas, restricciones) y datos de las 15 tablas.
- Configuración necesaria para volver a operar: plantilla `.env.example` del backend (sin valores), `docker-compose.yml` y la lista de variables de entorno de Vercel (solo nombres).
- Código fuente y scripts SQL de migración (protegidos por GitHub, Nivel 5).

**No incluye:**

- Esquemas internos de Supabase (`auth`, `storage`, `realtime`, etc.): Texticode no los usa.
- Archivos en Supabase Storage: no existen buckets.
- Los valores secretos del `.env` (contraseña de BD, `JWT_SECRET`, `SENDGRID_API_KEY`, credenciales de Google): se guardan en el gestor de contraseñas del equipo, **nunca** dentro de un respaldo ni en GitHub.
- Equipos y celulares de los usuarios del taller, y las bandejas de correo de SendGrid / eventos de Google Calendar (son servicios externos con su propio respaldo).

### 1.4 Respuesta a la pregunta del ejemplo EBS (RPO de 1 h con backups cada 6 h)

Con un respaldo propio cada 6 horas, el RPO de 1 hora **solo** se cumple si existe otra capa más fina. Según la documentación de Supabase, los proyectos **Pro, Team y Enterprise** reciben respaldos diarios automáticos (Pro: últimos 7 días), y el plan **Free no incluye respaldos**; Supabase recomienda a los proyectos gratuitos exportar con `db dump` y guardar copias fuera del sitio. Para llegar a pérdidas de segundos hace falta **PITR (Point-in-Time Recovery)**, que es un **complemento de pago** (≈ USD 100/mes para 7 días de retención) y exige además un cómputo mínimo *Small*. Conclusión: el plan EBS promete un RPO que no cumple con un backup de 6 h a menos que pague Pro + PITR. Texticode, en plan Free, declara un RPO de 24 h que **sí** puede cumplir.

---

## 2. Política de Respaldos

### 2.1 Reglas generales

1. **Nada se cambia en producción sin un respaldo manual previo verificado** (migraciones, `UPDATE`/`DELETE` masivos, cambios de esquema).
2. **Todo respaldo lleva huella SHA-256** y se registra en la tabla de control (Sección 13).
3. **Nunca se practica una restauración sobre producción.** Siempre primero en Docker local o en el proyecto Supabase de prueba.
4. **Los respaldos son datos sensibles:** contienen hashes de contraseñas, correos, teléfonos y tokens OAuth. Fuera del equipo del responsable viajan **cifrados (AES-256)** y nunca entran a GitHub (`*.dump`, `*.sql`, `*.gpg`, `.env` en `.gitignore`).
5. **Lo automático no depende de la memoria de nadie:** los respaldos diarios los ejecuta el Programador de tareas de Windows.

### 2.2 Regla 3-2-1 (más una copia desconectada)

| Copia | Dónde | Tipo de almacenamiento | Proveedor / sitio |
|---|---|---|---|
| **1 — Producción** | Supabase (us-west-1) | Disco administrado en la nube | Supabase |
| **2 — Respaldo local** | `C:\texticode-backups\diarios\` en el equipo del responsable técnico | Disco local (SSD) | Bogotá, equipo físico |
| **3 — Respaldo off-site** | Google Drive del equipo, carpeta `Texticode_Respaldos/` (archivos `.gpg` cifrados) | Almacenamiento de objetos en la nube | Google (otro proveedor, otra infraestructura) |
| **+1 — Copia desconectada** | Memoria USB dedicada, mensual, guardada por el suplente | Medio extraíble **offline** | Fuera del alcance de quien tiene acceso a producción (protección contra ransomware) |

Cumplimiento: **3 copias** (producción + local + Drive), **2 tipos** de almacenamiento (nube administrada + disco local), **1 fuera del sitio** (Drive, otro proveedor). La USB añade una copia que un atacante con las credenciales de producción o del PC no puede cifrar ni borrar.

### 2.3 Clasificación de todas las tablas por criticidad

| Nivel | Tablas | Qué pasa si se pierden | RPO | RTO | Retención |
|---|---|---|---|---|---|
| **Crítico** | `empresa`, `usuario`, `usuario_empresa`, `orden_produccion`, `orden_material`, `orden_operario`, `comprobantes`, `material_movimiento` | Sin empresas y membresías nadie puede iniciar sesión ni se aíslan los datos por taller; sin órdenes, fases y comprobantes se pierde el registro de lo producido y entregado (soporte ante el cliente); sin movimientos se pierde la trazabilidad del inventario | 24 h | 4 h | Diarios 14 días · semanales 8 semanas · mensuales 12 meses · **anual 10 años** |
| **Importante** | `material`, `empresa_config`, `observacion_operario`, `rol`, `usuario_orden` | Se reconstruyen con esfuerzo: stock actual recalculable desde `material_movimiento`, configuración por empresa reingresable, `rol` reproducible desde el script de semillas | 24 h | 8 h | Diarios 14 días · semanales 8 semanas · mensuales 12 meses |
| **Normal (y sensible)** | `tokens_recuperacion`, `google_calendar_tokens` | Molesto, no grave: los tokens de recuperación caducan y el usuario vuelve a vincular Google Calendar. Son **secretos**: conviene guardarlos el menor tiempo posible | 48 h | 24 h | Solo en diarios y semanales; **excluidos del archivo anual** (`--exclude-table-data`) |

> Nota: el respaldo es **completo** (todas las tablas en un solo archivo). La clasificación decide el orden de verificación, la prioridad de restauración parcial y qué se excluye del archivo de largo plazo.

### 2.4 Responsabilidad compartida

| Componente | Quién protege la infraestructura | Quién hace el respaldo | Frecuencia del respaldo | Verificación |
|---|---|---|---|---|
| Base de datos (datos + estructura) | Supabase (disco, red, hardware) | **Equipo Texticode** (plan Free = Supabase **no** hace respaldos) | 2 veces al día + manual antes de cambios | Semanal (huella + conteos) y mensual (restauración) |
| Código fuente y migraciones SQL | GitHub | GitHub (historial Git) + clones de cada integrante | Cada `push` | En cada PR |
| Frontend desplegado | Vercel | Vercel (historial de despliegues) | Cada despliegue | Al desplegar |
| Backend (imagen Docker / configuración) | Equipo Texticode | Repo GitHub (`docker-compose.yml`, `Dockerfile`) | Cada `push` | Mensual (levantar desde cero) |
| Secretos (`.env`) | Equipo Texticode | Gestor de contraseñas compartido del equipo | Cada rotación | Trimestral |
| Copias en Google Drive | Google | Equipo Texticode | Semanal / mensual / anual | Mensual (descarga real y comparación de huella) |

---

## 3. Estrategia de Respaldo

Defensa en profundidad con 5 niveles. Si un nivel falla, el siguiente protege.

```
 NIVEL 1  Respaldo manual PRE-CAMBIO ........ antes de migraciones / cambios riesgosos
             |   (pg_dump completo, se guarda junto al cambio)
 NIVEL 2  Respaldo AUTOMÁTICO LOCAL ......... 2 veces al día, PC del responsable
             |   (Programador de tareas -> backup.sh -> .dump + .sha256 + log)
 NIVEL 3  Copia OFF-SITE CIFRADA ............ semanal (domingo) + mensual + anual
             |   (gpg AES-256 -> Google Drive)
 NIVEL 4  Copia DESCONECTADA ................. mensual, memoria USB offline
             |
 NIVEL 5  CÓDIGO y ESQUEMA versionados ....... GitHub (no contiene datos)
```

| Nivel | Qué respalda | Frecuencia | Retención | Dónde se guarda | Tiempo estimado de recuperación |
|---|---|---|---|---|---|
| 1. Manual pre-cambio | BD completa (`public`) | Antes de cada cambio riesgoso | Hasta 30 días después del cambio exitoso | `C:\texticode-backups\precambio\` | 10–20 min (rollback inmediato) |
| 2. Automático local | BD completa (`public`) | 12:30 y 19:30 todos los días | 14 días | `C:\texticode-backups\diarios\` | 15–30 min |
| 3. Off-site cifrada | BD completa, cifrada | Domingo 19:45 (semanal); día 1 (mensual); 31-dic (anual) | 8 semanas / 12 meses / 10 años | Google Drive `Texticode_Respaldos/` | 30–60 min (descarga + descifrado + restauración) |
| 4. Desconectada | Último mensual cifrado | Día 1 de cada mes | 12 meses | USB guardada por el suplente | 1–2 h (requiere a la persona que la custodia) |
| 5. Código y esquema | Código, `docker-compose`, scripts SQL | Cada `push` | Permanente | GitHub | 15 min (clonar y construir) |

**Respuesta a "no necesito backups porque mi proyecto está en GitHub":** GitHub guarda el **código** y, a lo sumo, los scripts que **crean** las tablas; no guarda las **filas** que los usuarios registran todos los días (órdenes, inventario, entregas, usuarios). Si se borra la base, con GitHub se recrean tablas vacías. Además, subir un volcado de datos a GitHub sería una fuga de información personal.

---

## 4. Tipos de Respaldo

### 4.1 Tipos elegidos

| Tipo | ¿Lo usamos? | Justificación |
|---|---|---|
| **Completo** | **Sí, siempre** | La base pesa ≈ 1 MB; un completo tarda segundos y se restaura solo, sin depender de otros archivos. |
| **Lógico** (`pg_dump -Fc`) | **Sí** | Portátil entre Supabase, Docker local (PostgreSQL 17) y otra cuenta de Supabase. Permite restaurar una sola tabla (`pg_restore -t`). Incluye estructura + datos. |
| Incremental | No (por ahora) | El ahorro sería de kilobytes y complica la restauración. Además el esquema no permite detectar cambios de forma confiable (ver 4.3). |
| Diferencial | No | Mismo motivo. |
| Snapshot / físico | No disponible | Supabase toma respaldos físicos solo en planes pagos; en Free no hay snapshots accesibles. Queda como **(Futuro)** si se pasa a Pro. |

### 4.2 Contenido exacto del respaldo completo

Comando base: `pg_dump --schema=public --no-owner --no-privileges -Fc`

- **Las 15 tablas** con sus datos: `empresa`, `empresa_config`, `rol`, `usuario` (incluye hashes bcrypt), `usuario_empresa`, `material`, `material_movimiento`, `orden_produccion`, `orden_material`, `orden_operario`, `usuario_orden`, `comprobantes`, `observacion_operario`, `google_calendar_tokens`, `tokens_recuperacion`.
- **Estructura:** 5 tipos ENUM, 10 secuencias (con su valor actual), 41 índices, llaves primarias, foráneas simples y compuestas, `CHECK`, funciones `actualizar_ordenes_retrasadas` y `set_orden_operario_updated_at`, trigger `trg_orden_operario_updated_at`, la política RLS de `rol` y el estado `ENABLE ROW LEVEL SECURITY` de cada tabla.
- **No incluye** `auth.users` (vacío, no se usa) ni Storage (sin buckets).

### 4.3 Respuesta a la pregunta del incremental EBS

`SELECT * FROM facturas WHERE created_at > [ULTIMO_BACKUP]` solo captura **filas nuevas**. Una factura vieja anulada (modificada) tiene `created_at` antiguo y no aparece; una factura **eliminada** no aparece nunca porque ya no existe. Se necesitaría:

- una columna **`updated_at`** mantenida por trigger en cada tabla, para capturar modificaciones (`WHERE updated_at > último_backup`);
- **borrado lógico** (`deleted_at` / `activo = false`) o una **tabla de auditoría** (trigger `AFTER DELETE` que registre id y fecha) para capturar eliminaciones.

En Texticode solo `orden_operario` tiene `updated_at` con trigger, y `material` usa borrado lógico (`Activo`). Las demás tablas **no** permiten un incremental confiable, otra razón para usar solo completos.

---

## 5. Frecuencia y Retención

### 5.1 Ventana de respaldo

El taller trabaja aproximadamente de 8:00 a 18:00 y la base es muy pequeña (`pg_dump` toma segundos y no bloquea escrituras). Como el respaldo corre en el equipo del responsable (que no está encendido de madrugada), se eligen dos ventanas de bajo uso: **12:30 (almuerzo)** y **19:30 (cierre de jornada)**. En el Programador de tareas se activa *"Ejecutar la tarea lo antes posible si se omitió un inicio programado"*.

### 5.2 Calendario semanal

| Hora | Lun | Mar | Mié | Jue | Vie | Sáb | Dom |
|---|---|---|---|---|---|---|---|
| 12:30 | Diario | Diario | Diario | Diario | Diario | Diario | Diario |
| 19:30 | Diario | Diario | Diario | Diario | Diario | Diario | Diario |
| 19:45 | — | — | — | — | — | — | **Semanal** cifrado a Drive |
| Lun 8:30 | **Monitoreo semanal** (huella + antigüedad + tamaño) | | | | | | |

Además: **día 1 de cada mes** → mensual cifrado a Drive + copia a USB + prueba de restauración; **31 de diciembre** → archivo anual (sin tablas de tokens) a Drive por 10 años.

### 5.3 Retención (esquema abuelo-padre-hijo)

| Tipo | Se conservan | Rotación | Niveles de criticidad cubiertos |
|---|---|---|---|
| Diario (hijo) | 14 días (28 archivos) | `backup.sh` borra los `.dump` de más de 14 días | Todos |
| Semanal (padre) | 8 semanas | Se borra manualmente el más antiguo en el monitoreo semanal | Todos |
| Mensual (abuelo) | 12 meses | Ídem en la revisión mensual | Todos |
| Anual | **10 años** | Revisión anual | Crítico e importante (sin `tokens_recuperacion` ni `google_calendar_tokens`) |
| Pre-cambio | 30 días tras el cambio | Manual | Todos |

### 5.4 Retención legal en Colombia

El artículo 28 de la **Ley 962 de 2005** establece que los libros y papeles del comerciante se conservan por **diez (10) años** contados desde el último asiento, documento o comprobante, en papel o en cualquier medio técnico, magnético o electrónico que garantice su reproducción exacta. Las órdenes de producción, los comprobantes de entrega y los movimientos de inventario de un taller son soportes de su operación comercial; por eso el plan guarda **un archivo anual durante 10 años** (no los 28 diarios). Texticode no emite facturas electrónicas DIAN (eso lo hace el software contable del taller), pero si en el futuro lo hiciera, aplicaría el mismo plazo.

### 5.5 Cálculo de espacio para el primer año (con tamaño real)

Datos reales: base total 12 MB; datos propios ≈ **1,07 MB** en disco (tablas + índices). Un `pg_dump -Fc` comprimido normalmente pesa menos que eso; por prudencia usamos **1,1 MB** como cota superior inicial. Tamaño real del primer `.dump`: **[COMPLETAR] KB** (Laboratorio 1).

Supuesto de crecimiento (taller en operación real): **+0,5 MB/mes** → mes 12 ≈ **7,1 MB** por respaldo.

| Concepto | Cálculo (peor caso, mes 12) | Espacio |
|---|---|---:|
| Diarios | 28 archivos (14 días × 2) × 7,1 MB | 198,8 MB |
| Semanales | 8 × 7,1 MB | 56,8 MB |
| Mensuales | 12 archivos de 1,6 a 7,1 MB → 12 × promedio 4,35 MB | 52,2 MB |
| Anual | 1 × 7,1 MB | 7,1 MB |
| Pre-cambio | ≈ 6 al mes × 7,1 MB | 42,6 MB |
| **Total por ubicación** | | **≈ 357,5 MB** |

- Equipo local (diarios + pre-cambio + copia de semanales/mensuales): ≈ 360 MB.
- Google Drive (semanales + mensuales + anual): ≈ 116 MB.
- USB (12 mensuales): ≈ 52 MB.

Todo cabe en los 15 GB gratuitos de Google Drive y en cualquier memoria USB.

### 5.6 Revisión de la cuenta del ejemplo EBS

- Si los semanales se guardan **90 días**, al mismo tiempo hay unos **13** semanales (90 / 7 ≈ 12,9), no 52. La cifra "12" del ejemplo es casi correcta.
- El tamaño **no** se queda en 60 MB: si la base pesa 50 MB y crece 10 MB/mes, al mes 12 pesa **170 MB**. Recalculado al final del año: diarios 30 × 170 = 5.100 MB; semanales 13 × 170 = 2.210 MB; mensuales de 60 a 170 MB → 12 × 115 = 1.380 MB. Total ≈ **8,7 GB**, casi el triple de los 3 GB estimados.

---

## 6. Procedimientos de Respaldo — Laboratorio 1

### 6.1 Preparación (una sola vez)

1. Instalar el cliente de PostgreSQL **17** (debe ser ≥ 17.6, la versión del servidor):
   - Windows: instalador oficial de PostgreSQL 17, marcar solo *Command Line Tools*, y agregar `C:\Program Files\PostgreSQL\17\bin` al `PATH`.
   - Alternativa sin instalar nada (ya usamos Docker): `docker run --rm postgres:17 pg_dump --version`.
2. Abrir **Git Bash** (trae `bash`, `sha256sum`, `gpg` y `date` de GNU) y crear las carpetas:

   ```bash
   mkdir -p /c/texticode-backups/{diarios,semanales,mensuales,anual,precambio,logs}
   ```

3. Crear `C:\texticode-backups\.env.backup` (fuera de cualquier repositorio) con permisos solo para el usuario:

   ```bash
   # .env.backup  — NO subir a GitHub, NO compartir
   DB_URL="postgresql://postgres.[ref]:[CONTRASEÑA]@[host-session-pooler]:5432/postgres"
   BACKUP_PASSPHRASE="[frase larga guardada en el gestor de contraseñas]"
   DRIVE_DIR="/g/Mi unidad/Texticode_Respaldos"
   ```

   La cadena se copia de Supabase → botón **Connect** → *Session pooler* (la red del equipo no tiene IPv6).

4. Agregar al `.gitignore` del repositorio:

   ```gitignore
   *.dump
   *.sql.gz
   *.gpg
   *.sha256
   .env
   .env.*
   !.env.example
   ```

### 6.2 Laboratorio 1: primer backup real (pasos ejecutados)

```bash
set -a; source /c/texticode-backups/.env.backup; set +a
cd /c/texticode-backups/diarios

FECHA=$(date +%Y-%m-%d_%H-%M)
time pg_dump "$DB_URL" --schema=public --no-owner --no-privileges -Fc \
     -f "texticode_$FECHA.dump"

sha256sum "texticode_$FECHA.dump" > "texticode_$FECHA.sha256"

ls -lh "texticode_$FECHA.dump"
pg_restore --list "texticode_$FECHA.dump" | grep -c "TABLE DATA"    # debe dar 15
pg_restore --list "texticode_$FECHA.dump" | head -40
```

**Evidencia del Laboratorio 1** *(llenar al ejecutar)*:

| Dato | Resultado |
|---|---|
| Fecha y hora | [COMPLETAR] |
| Ejecutado por / leído por | [COMPLETAR] / [COMPLETAR] |
| Versión de `pg_dump` (`pg_dump --version`) | [COMPLETAR] |
| Tamaño del `.dump` | [COMPLETAR] KB |
| Tiempo (`real` de `time`) | [COMPLETAR] s |
| Entradas `TABLE DATA` en `--list` | [COMPLETAR] (esperado: 15) |
| Huella SHA-256 (primeros 16 caracteres) | [COMPLETAR] |
| Captura de la terminal | [COMPLETAR: insertar imagen] |

### 6.3 Actividad "Encuentra el error" — script `curl` + JSON del plan EBS

| # | Pregunta | Respuesta |
|---|---|---|
| 1 | Anon key + RLS activado | La API devuelve **solo las filas que permiten las políticas para el rol `anon`**. Si la tabla tiene RLS y ninguna política de `SELECT` para `anon`, devuelve `[]` con código 200: **el backup queda vacío sin dar error**. En Texticode pasaría exactamente eso con `usuario`, `usuario_empresa`, `empresa` u `orden_operario` (RLS activo, sin políticas). Y al revés: las 7 tablas sin RLS se exportarían completas con una llave que es pública, lo que demuestra un hueco de seguridad. |
| 2 | Límite de filas | Supabase devuelve por defecto **máximo 1.000 filas** por consulta (configurable en los ajustes de la API). Con 5.000 productos el backup traería **solo 1.000**, otra vez sin error (el total real solo aparece en la cabecera `Content-Range`). Habría que paginar con `Range`/`offset`. |
| 3 | `wc -l` | La respuesta JSON de PostgREST suele venir en **una sola línea** sin salto final, así que `wc -l` muestra **0** (o 1). El log no cuenta registros. Lo correcto: `jq 'length' productos.json`. |
| 4 | Estructura | En ninguna parte: el JSON solo trae valores. Se pierden tablas, tipos ENUM, secuencias, índices, llaves foráneas, `CHECK`, funciones, triggers y políticas RLS. Para restaurar habría que recrear todo a mano y luego convertir el JSON a `INSERT` respetando el orden de las llaves foráneas. |
| 5 | `log` y `SUPABASE_URL` sin definir | `log` produce `log: command not found` (código 127). `SUPABASE_URL` vacía hace que `curl` llame a `"/rest/v1/productos"` y falle. Sin `set -euo pipefail` el script **sigue**, genera archivos vacíos o con un mensaje de error y termina "bien": una **falla silenciosa**. |
| 6 | URL del proyecto en el código | La URL identifica el proyecto; junto con la anon key (que va en el frontend y es pública) permite a cualquiera llamar la API, y si hay tablas sin RLS, leerlas o modificarlas. También facilita ataques dirigidos y queda para siempre en el historial de Git. Debe ir en variables de entorno y nunca en un documento compartido. |

**Conclusión:** usamos **`pg_dump`**. Se conecta como `postgres` (no le afecta RLS ni el límite de 1.000 filas), exporta estructura y datos de forma consistente (una sola transacción), genera un archivo comprimido que permite restaurar todo o una tabla, y falla con código de salida distinto de 0 si algo sale mal. El método `curl` + JSON solo serviría como exportación complementaria para análisis, nunca como respaldo.

### 6.4 Script automático `backup.sh`

Ubicación: `C:\texticode-backups\backup.sh` (fuera del repo). Probado de punta a punta en un entorno de preparación (9.4).

```bash
#!/usr/bin/env bash
# backup.sh — Respaldo completo de la BD de Texticode (esquema public)
# Uso:  ./backup.sh [diario|semanal|mensual|anual|precambio]
# Requiere: pg_dump 17 (o Docker), sha256sum, gpg (Git Bash ya los trae)
set -euo pipefail

TIPO="${1:-diario}"
BASE_DIR="${BASE_DIR:-/c/texticode-backups}"
ENV_FILE="$BASE_DIR/.env.backup"
LOG="$BASE_DIR/logs/backup.log"
RETENCION_DIARIOS=14
TAMANO_MINIMO=20000          # bytes; un dump real de Texticode pesa mucho más

log() { echo "$(date '+%Y-%m-%d %H:%M:%S') [$TIPO] $*" | tee -a "$LOG"; }
fallo() { log "ERROR: $*"; exit 1; }

mkdir -p "$BASE_DIR"/{diarios,semanales,mensuales,anual,precambio,logs}
[ -f "$ENV_FILE" ] || fallo "No existe $ENV_FILE"
set -a; source "$ENV_FILE"; set +a
[ -n "${DB_URL:-}" ] || fallo "DB_URL no está definida"

case "$TIPO" in
  diario)    DESTINO="$BASE_DIR/diarios" ;;
  semanal)   DESTINO="$BASE_DIR/semanales" ;;
  mensual)   DESTINO="$BASE_DIR/mensuales" ;;
  anual)     DESTINO="$BASE_DIR/anual" ;;
  precambio) DESTINO="$BASE_DIR/precambio" ;;
  *) fallo "Tipo no válido: $TIPO" ;;
esac

FECHA=$(date +%Y-%m-%d_%H-%M)
ARCHIVO="texticode_${TIPO}_${FECHA}.dump"
EXTRA=()
# El archivo anual (10 años) no guarda secretos de corta vida
if [ "$TIPO" = "anual" ]; then
  EXTRA=(--exclude-table-data=public.google_calendar_tokens
         --exclude-table-data=public.tokens_recuperacion)
fi

INICIO=$(date +%s)
if command -v pg_dump >/dev/null 2>&1; then
  pg_dump "$DB_URL" --schema=public --no-owner --no-privileges -Fc \
          "${EXTRA[@]}" -f "$DESTINO/$ARCHIVO"
else
  docker run --rm -v "$DESTINO":/backup postgres:17 \
    pg_dump "$DB_URL" --schema=public --no-owner --no-privileges -Fc \
            "${EXTRA[@]}" -f "/backup/$ARCHIVO"
fi
DURACION=$(( $(date +%s) - INICIO ))

TAMANO=$(stat -c %s "$DESTINO/$ARCHIVO")
[ "$TAMANO" -ge "$TAMANO_MINIMO" ] || fallo "Dump sospechosamente pequeño: $TAMANO bytes"

TABLAS=$(pg_restore --list "$DESTINO/$ARCHIVO" 2>/dev/null | grep -c "TABLE DATA" || true)
[ "$TABLAS" -ge 15 ] || [ "$TIPO" = "anual" ] || fallo "Solo $TABLAS tablas con datos (esperadas 15)"

( cd "$DESTINO" && sha256sum "$ARCHIVO" > "${ARCHIVO%.dump}.sha256" )
HUELLA=$(cut -c1-16 "$DESTINO/${ARCHIVO%.dump}.sha256")

# Semanal, mensual y anual: copia cifrada fuera del sitio (Google Drive)
if [[ "$TIPO" =~ ^(semanal|mensual|anual)$ ]]; then
  [ -n "${BACKUP_PASSPHRASE:-}" ] || fallo "BACKUP_PASSPHRASE no está definida"
  [ -d "${DRIVE_DIR:-}" ] || fallo "No se encuentra la carpeta de Drive: ${DRIVE_DIR:-}"
  printf '%s' "$BACKUP_PASSPHRASE" | gpg --batch --yes --pinentry-mode loopback \
      --passphrase-fd 0 --symmetric --cipher-algo AES256 \
      -o "$DRIVE_DIR/$ARCHIVO.gpg" "$DESTINO/$ARCHIVO"
  cp "$DESTINO/${ARCHIVO%.dump}.sha256" "$DRIVE_DIR/"
  log "Copia cifrada enviada a Drive: $ARCHIVO.gpg"
fi

# Rotación de diarios
if [ "$TIPO" = "diario" ]; then
  find "$BASE_DIR/diarios" -name 'texticode_diario_*' -mtime +"$RETENCION_DIARIOS" -delete
fi

log "OK $ARCHIVO | ${TAMANO} bytes | ${TABLAS} tablas | ${DURACION}s | sha256 ${HUELLA}..."
```

### 6.5 Programación automática

**Equivalente `cron`** (Linux / WSL):

```bash
# minuto hora día-mes mes día-semana  comando
30 12 * * *  /c/texticode-backups/backup.sh diario  >> /c/texticode-backups/logs/cron.log 2>&1
30 19 * * *  /c/texticode-backups/backup.sh diario  >> /c/texticode-backups/logs/cron.log 2>&1
45 19 * * 0  /c/texticode-backups/backup.sh semanal >> /c/texticode-backups/logs/cron.log 2>&1
0  13 1 * *  /c/texticode-backups/backup.sh mensual >> /c/texticode-backups/logs/cron.log 2>&1
0  20 31 12 * /c/texticode-backups/backup.sh anual  >> /c/texticode-backups/logs/cron.log 2>&1
```

**En Windows (equipo real del responsable)**, con el Programador de tareas desde una terminal de administrador:

```bat
schtasks /Create /TN "Texticode\Backup 1230" /SC DAILY /ST 12:30 ^
  /TR "\"C:\Program Files\Git\bin\bash.exe\" -lc '/c/texticode-backups/backup.sh diario'"
schtasks /Create /TN "Texticode\Backup 1930" /SC DAILY /ST 19:30 ^
  /TR "\"C:\Program Files\Git\bin\bash.exe\" -lc '/c/texticode-backups/backup.sh diario'"
schtasks /Create /TN "Texticode\Semanal" /SC WEEKLY /D SUN /ST 19:45 ^
  /TR "\"C:\Program Files\Git\bin\bash.exe\" -lc '/c/texticode-backups/backup.sh semanal'"
schtasks /Create /TN "Texticode\Mensual" /SC MONTHLY /D 1 /ST 13:00 ^
  /TR "\"C:\Program Files\Git\bin\bash.exe\" -lc '/c/texticode-backups/backup.sh mensual'"
```

Luego, en la pestaña *Configuración* de cada tarea, marcar **"Ejecutar la tarea lo antes posible si se omitió un inicio programado"**. Captura de las tareas creadas: **[COMPLETAR]**.

### 6.6 Procedimiento: respaldo manual antes de un cambio riesgoso

Aplica antes de: ejecutar un script de `DATABASE/` (migraciones), `ALTER TABLE`, `UPDATE`/`DELETE` sin la interfaz, importaciones masivas o cambios en funciones/triggers.

1. Avisar en el grupo del equipo: qué cambio, quién lo hace y a qué hora.
2. Ejecutar `./backup.sh precambio` y confirmar en el log la línea `OK` con tamaño y 15 tablas.
3. Verificar la huella: `cd /c/texticode-backups/precambio && sha256sum -c texticode_precambio_*.sha256`.
4. Guardar los conteos actuales (Anexo A) en `precambio/conteos_FECHA.txt`.
5. **Ensayar el cambio** primero en Docker local restaurando ese mismo dump (Escenario 2, pasos 3–4).
6. Ejecutar el cambio en producción **dentro de una transacción** cuando sea posible: `BEGIN; ... ; -- revisar --; COMMIT;` (o `ROLLBACK;`).
7. Repetir los conteos y las consultas del Anexo B. Si algo no cuadra → Escenario 4.
8. Registrar en la tabla de control (Sección 13) el respaldo, el cambio y el resultado.

---

## 7. Procedimientos de Restauración — Laboratorio 2

### 7.1 Ambientes de restauración

| Ambiente | Uso |
|---|---|
| **Docker local** — `postgres:17` en un contenedor desechable (`texticode-restore`) | Pruebas rápidas, extracción de filas para restauraciones parciales, ensayo de migraciones |
| **Proyecto Supabase de prueba** (copia en otra cuenta, vacío antes de cada prueba) | Laboratorio 2 y simulacro: restaurar en la nube y conectar el backend |
| **Producción** | Solo después de verificar en uno de los dos anteriores |

### 7.2 Conteo de referencia (producción, 29/10/2026)

| Tabla | Filas | | Tabla | Filas |
|---|---:|---|---|---:|
| orden_material | 103 | | google_calendar_tokens | 11 |
| material_movimiento | 60 | | tokens_recuperacion | 6 |
| orden_operario | 52 | | empresa | 5 |
| orden_produccion | 51 | | empresa_config | 5 |
| comprobantes | 37 | | rol | 4 |
| usuario | 32 | | observacion_operario | 4 |
| usuario_empresa | 31 | | usuario_orden | 0 |
| material | 26 | | **TOTAL** | **427** |

> Antes de cada prueba se vuelve a ejecutar el Anexo A en producción, porque los números cambian con el uso.

### 7.3 Laboratorio 2: restaurar el backup en el proyecto de prueba

1. En producción, ejecutar el **Anexo A** y guardar el resultado (captura).
2. Verificar la huella del respaldo:

   ```bash
   cd /c/texticode-backups/diarios
   sha256sum -c texticode_diario_FECHA.sha256     # debe decir: OK
   ```

3. **Iniciar el cronómetro.** Restaurar en el proyecto de prueba:

   ```bash
   export DB_PRUEBA="postgresql://postgres.[ref-prueba]:[CONTRASEÑA]@[host]:5432/postgres"
   # El dump hecho con --schema=public trae "CREATE SCHEMA public", que ya existe en
   # Supabase y detendría --exit-on-error. Se quita de la lista de restauración:
   pg_restore -l texticode_diario_FECHA.dump \
     | grep -vE " SCHEMA - public | COMMENT - SCHEMA public " > lista.toc
   time pg_restore -d "$DB_PRUEBA" --no-owner --no-privileges --exit-on-error \
        -L lista.toc texticode_diario_FECHA.dump
   ```

   Si el proyecto de prueba no está vacío: agregar `--clean --if-exists` (solo en prueba).

4. Ejecutar el **Anexo A** en el proyecto de prueba. Los 15 conteos deben coincidir con el paso 1.
5. Ejecutar el **Anexo B** (validación). Todas las consultas deben devolver 0, salvo `usuario_sin_empresa` = 1 (el superadministrador, que no pertenece a ninguna empresa por diseño).
6. Revisar en el panel que llegaron la política RLS de `rol` (*Authentication → Policies*), el trigger `trg_orden_operario_updated_at` (*Database → Triggers*) y las 2 funciones (*Database → Functions*).
7. Prueba funcional: cambiar `DATABASE_URL` del backend local al proyecto de prueba, `docker compose up -d --build backend`, iniciar sesión en la web con un usuario de prueba y abrir Producción e Inventario.
8. **Detener el cronómetro.** Ese es el RTO real del Escenario 3.

**Variante en Docker local** (ensayo de 2 minutos):

```bash
docker run -d --name texticode-restore -e POSTGRES_PASSWORD=prueba -p 5440:5432 postgres:17
sleep 5
pg_restore -l texticode_diario_FECHA.dump \
  | grep -vE " SCHEMA - public | COMMENT - SCHEMA public " > lista.toc
pg_restore -d "postgresql://postgres:prueba@localhost:5440/postgres" \
           --no-owner --no-privileges --exit-on-error -L lista.toc texticode_diario_FECHA.dump
psql "postgresql://postgres:prueba@localhost:5440/postgres" -f anexo_a_conteos.sql
docker rm -f texticode-restore        # al terminar
```

**Evidencia del Laboratorio 2** *(llenar)*:

| Dato | Resultado |
|---|---|
| Respaldo usado (nombre y huella) | [COMPLETAR] |
| Huella verificada (`OK`) | [COMPLETAR] |
| Conteo producción = conteo prueba (15/15) | [COMPLETAR] |
| Avisos de `pg_restore` y su explicación | [COMPLETAR] (ver nota) |
| Política, trigger y funciones presentes | [COMPLETAR] |
| Login funcional contra la BD restaurada | [COMPLETAR] |
| **RTO real medido** | **[COMPLETAR] min** (compromiso: 240 min) |
| Capturas | [COMPLETAR] |

> **Avisos de `pg_restore`:** el aviso *schema "public" already exists* es **inofensivo** (Supabase y PostgreSQL ya crean ese esquema), pero con `--exit-on-error` detiene la restauración; por eso se filtra con `-L lista.toc`. Este comportamiento se **comprobó** en la prueba de 9.4: sin el filtro, `pg_restore` se detuvo en `CREATE SCHEMA public` y no restauró ninguna tabla. Son **importantes** y obligan a repetir: errores en `CREATE TABLE`, `CREATE TYPE`, `COPY` o `ADD CONSTRAINT` (llaves foráneas), porque indican estructura o datos incompletos. Sin `--exit-on-error`, `pg_restore` termina con *"errors ignored on restore: N"*: si N es mayor que el número de avisos inofensivos, la restauración **no sirve**.

### 7.4 Actividad "Encuentra el error" — escenarios del plan EBS

| # | Pregunta | Respuesta |
|---|---|---|
| 1 | `CREATE POLICY "readonly" ... FOR ALL USING (false)` | Las políticas **permisivas se combinan con OR**: si ya existía una política que permite editar, `true OR false = true` y la nueva **no bloquea nada**. Para restringir habría que crearla `AS RESTRICTIVE` (las restrictivas se combinan con AND). Además `FOR ALL` incluye `SELECT`, así que una restrictiva con `USING (false)` dejaría la tabla **sin acceso**, no "solo lectura". Y en Texticode ni siquiera aplicaría: el backend entra con `pg` como `postgres`, que **ignora RLS**. Solo lectura correcto: `REVOKE INSERT, UPDATE, DELETE ON material FROM <rol_del_backend>;` (si el backend usa un rol dedicado) o activar el **modo mantenimiento** del backend. |
| 2 | `TRUNCATE TABLE productos CASCADE` | Vacía también **todas** las tablas con llave foránea hacia `productos` (`detalles_factura`, `movimientos_inventario`) y, en cadena, las que apunten a esas. En Texticode el equivalente `TRUNCATE material CASCADE` sería catastrófico: vaciaría `material_movimiento`, `orden_material` y `orden_produccion` (FK `fk_op_material`), y por cascada `orden_operario`, `comprobantes`, `observacion_operario` y `usuario_orden`. **Prohibido en este plan**: se restaura con `UPDATE ... FROM` (Escenario 2). |
| 3 | `systemctl restart` / `nginx` en Vercel | No tienen sentido: en Vercel no hay servidor propio ni acceso a la máquina. El rollback del frontend se hace en el panel: *Deployments* → elegir el despliegue anterior que funcionaba → **Instant Rollback** / *Promote to Production* (o `vercel rollback` desde la CLI). El backend de Texticode corre en Docker, así que allí el rollback es volver al commit anterior y `docker compose up -d --build`. |

### 7.5 Escenarios de recuperación de Texticode

#### Escenario 1 — Un administrador borró por error una orden de producción

| RPO | RTO | Complejidad | Probado |
|---|---|---|---|
| 24 h (último diario) | 1 h | Media | [COMPLETAR: sí/no] |

1. Identificar la orden: `Id_Orden`, empresa y hora aproximada del borrado (preguntar al usuario; revisar logs del backend).
2. Tomar un respaldo `precambio` del estado actual (no empeorar nada).
3. Elegir el último respaldo **anterior** al borrado y verificar su huella.
4. Restaurarlo en Docker local (variante de 7.3).
5. Exportar la orden y sus hijos desde Docker (en este orden por las llaves foráneas):

   ```bash
   R="postgresql://postgres:prueba@localhost:5440/postgres"; ID=123
   for T in orden_produccion orden_material orden_operario comprobantes \
            material_movimiento observacion_operario usuario_orden; do
     psql "$R" -c "\copy (SELECT * FROM public.$T WHERE \"Id_Orden\" = $ID) TO 'rec_$T.csv' CSV HEADER"
   done
   ```

6. Insertar en producción en una sola transacción, en el mismo orden:

   ```bash
   psql "$DB_URL" <<'SQL'
   BEGIN;
   \copy public.orden_produccion     FROM 'rec_orden_produccion.csv'     CSV HEADER
   \copy public.orden_material       FROM 'rec_orden_material.csv'       CSV HEADER
   \copy public.orden_operario       FROM 'rec_orden_operario.csv'       CSV HEADER
   \copy public.comprobantes         FROM 'rec_comprobantes.csv'         CSV HEADER
   \copy public.material_movimiento  FROM 'rec_material_movimiento.csv'  CSV HEADER
   \copy public.observacion_operario FROM 'rec_observacion_operario.csv' CSV HEADER
   \copy public.usuario_orden        FROM 'rec_usuario_orden.csv'        CSV HEADER
   -- revisar: SELECT * FROM orden_produccion WHERE "Id_Orden" = 123;
   COMMIT;
   SQL
   ```

7. Si hubo avances posteriores al respaldo (fases registradas hoy), el administrador los registra de nuevo desde la interfaz.
8. **Verificación:** la orden aparece en la vista de Producción de la empresa correcta, con sus fases y comprobantes; Anexo B sin errores; `docker rm -f texticode-restore`.

#### Escenario 2 — Una tabla quedó con datos dañados (ej.: `UPDATE material SET "Stock_Actual" = 0` sin `WHERE`)

| RPO | RTO | Complejidad | Probado |
|---|---|---|---|
| 24 h | 2 h | Media-alta | [COMPLETAR] |

1. **Contener:** activar el modo mantenimiento del backend (detener el contenedor: `docker compose stop backend`) para que nadie siga escribiendo sobre datos malos. Avisar al taller (plantilla 8.4).
2. Respaldo `precambio` del estado dañado (sirve para el análisis post-mortem).
3. Restaurar el último respaldo sano en Docker local.
4. Exportar la tabla sana: `psql "$R" -c "\copy (SELECT \"Id_Material\",\"Stock_Actual\" FROM public.material) TO 'material_sano.csv' CSV HEADER"`
5. Corregir en producción **sin borrar la tabla** (nunca `TRUNCATE ... CASCADE`):

   ```sql
   BEGIN;
   CREATE TEMP TABLE material_sano ("Id_Material" int PRIMARY KEY, "Stock_Actual" int);
   \copy material_sano FROM 'material_sano.csv' CSV HEADER
   UPDATE public.material m
      SET "Stock_Actual" = s."Stock_Actual"
     FROM material_sano s
    WHERE s."Id_Material" = m."Id_Material";
   -- comparar antes de confirmar:
   SELECT count(*) FROM public.material WHERE "Stock_Actual" < 0;
   COMMIT;
   ```

6. Aplicar los movimientos posteriores al respaldo: revisar `material_movimiento` con `"Fecha" > [hora del respaldo]` y ajustar el stock de esos materiales.
7. Reiniciar el backend: `docker compose start backend`.
8. **Verificación:** inventario por empresa coherente con los movimientos; Anexo B (stock negativo = 0); el administrador del taller confirma 3 materiales al azar contra el inventario físico.

#### Escenario 3 — Se perdió toda la base de datos (proyecto eliminado, pausado sin poder reactivar o cuenta comprometida)

| RPO | RTO | Complejidad | Probado |
|---|---|---|---|
| 24 h (≤ 7 días si solo queda el semanal de Drive) | 4 h | Alta | **Laboratorio 2 / simulacro** — [COMPLETAR] |

1. Confirmar la pérdida (panel de Supabase, estado del proyecto) y **activar el DRP** (Sección 8).
2. Crear un proyecto Supabase nuevo (o usar el de prueba), región cercana, **PostgreSQL 17**.
3. Obtener el respaldo más reciente disponible, en este orden: local diario → Drive semanal → USB mensual. Si viene de Drive o USB, descifrarlo:

   ```bash
   gpg --batch --pinentry-mode loopback --passphrase-fd 0 \
       -o texticode_semanal_FECHA.dump -d texticode_semanal_FECHA.dump.gpg <<< "$BACKUP_PASSPHRASE"
   sha256sum -c texticode_semanal_FECHA.sha256
   ```

4. Restaurar (con el mismo filtro de 7.3):

   ```bash
   pg_restore -l texticode_semanal_FECHA.dump \
     | grep -vE " SCHEMA - public | COMMENT - SCHEMA public " > lista.toc
   pg_restore -d "$DB_NUEVA" --no-owner --no-privileges --exit-on-error \
              -L lista.toc texticode_semanal_FECHA.dump
   ```
5. Validar con Anexo A (contra el último conteo registrado) y Anexo B.
6. Actualizar `DATABASE_URL` en el `.env` del backend con la nueva cadena (procedimiento de rotación de variables ya documentado por el equipo) y reiniciar: `docker compose up -d --build backend`.
7. El frontend en Vercel **no cambia** (apunta al backend, no a la BD). La app móvil tampoco.
8. Pedir a los usuarios que vuelvan a vincular Google Calendar si los tokens restaurados ya expiraron.
9. **Verificación:** login de un administrador de cada empresa activa, creación de una orden de prueba y su borrado, Anexo B sin errores. Registrar el RTO real.

#### Escenario 4 — Una actualización de la aplicación salió mal

| RPO | RTO | Complejidad | Probado |
|---|---|---|---|
| 0 (frontend/backend) · hasta el respaldo pre-cambio (BD) | 1 h | Media | [COMPLETAR] |

1. Identificar qué se actualizó: frontend, backend, base de datos o varios.
2. **Frontend (Vercel):** *Deployments* → último despliegue sano → **Instant Rollback**. Tarda segundos.
3. **Backend (Docker):**

   ```bash
   cd TEXTICODE
   git log --oneline -5                  # identificar el último commit sano
   git checkout <commit_sano> -- BACKEND
   docker compose up -d --build backend
   ```

   Luego revertir formalmente con un PR (`git revert`), nunca con push directo a `main`.
4. **Base de datos (migración fallida):** si existe script de rollback probado de esa fase, ejecutarlo dentro de una transacción. Si no existe o falla: restaurar el respaldo `precambio` tomado en el paso 2 de 6.6 con el procedimiento del Escenario 3 (sobre el mismo proyecto: `pg_restore --clean --if-exists`, **solo** tras confirmarlo dos integrantes).
5. **Verificación:** la versión anterior responde, login correcto, Anexo B sin errores; documentar la causa en el post-mortem.

---

## 8. Plan de Recuperación ante Desastres (DRP)

### 8.1 Definición de desastre

Para Texticode, es **desastre** cualquier evento que deje a uno o más talleres **sin poder registrar producción por más de 2 horas** en horario laboral, o que provoque **pérdida o alteración de datos de más de una empresa**. Por debajo de ese umbral es un **incidente** y se resuelve con el Escenario 1, 2 o 4 sin activar el DRP completo.

### 8.2 Causas posibles

| # | Causa | Probabilidad | Impacto | Mitigación en este plan |
|---|---|---|---|---|
| 1 | Error humano: borrado o `UPDATE` sin `WHERE`, migración mal aplicada | **Alta** | Medio-alto | Respaldo pre-cambio, ensayo en Docker, transacciones (Esc. 1, 2, 4) |
| 2 | Proyecto Supabase Free **pausado por inactividad** o eliminado por error / por la cuenta | Media | Alto | Respaldos propios diarios + Drive; restauración en proyecto nuevo (Esc. 3) |
| 3 | Acceso no autorizado: anon key pública + **7 tablas sin RLS**, o credencial de BD filtrada; ransomware en el PC | Media | **Crítico** | Copia cifrada en Drive + USB offline; activar RLS (Anexo D); rotar credenciales |
| 4 | Falla o robo del equipo del responsable (donde están los diarios) | Media | Medio | Copia semanal en Drive y mensual en USB; suplente con acceso |
| 5 | Caída regional de Supabase / proveedor | Baja | Alto | Restaurar en otra región o en Docker local temporal (Esc. 3) |

### 8.3 Fases del DRP

| Fase | Acciones concretas | Responsable | Tiempo objetivo |
|---|---|---|---|
| **1. Detección** | Alerta del monitoreo, error masivo en el backend o reporte de un taller. Confirmar en el panel de Supabase y con `psql "$DB_URL" -c "select 1"`. Anotar hora de inicio. | Andrés Lancheros (monitoreo) — cualquiera puede reportar | 0–15 min |
| **2. Activación y comunicación** | Declarar desastre, abrir el canal de incidente del equipo, asignar roles, enviar el primer mensaje al taller (8.4). Detener el backend si hay datos corruptos o acceso indebido. | Kevin Wagner (suplente: Camilo Tibambre) · Comunicación: Kevin Castro | 15–30 min |
| **3. Recuperación** | Elegir escenario (normalmente el 3), conseguir y verificar el respaldo, restaurar, rotar credenciales si la causa fue un acceso indebido, reconectar el backend. | Kevin Wagner ejecuta · Camilo Tibambre lee el procedimiento en voz alta | 30 min – 3 h |
| **4. Validación** | Anexo A y Anexo B, prueba funcional por rol (admin, operario, cliente), confirmación de un usuario del taller. Mensaje de cierre al cliente. | Andrés Lancheros valida · Kevin Castro confirma con el taller | 3 h – 3 h 45 min |
| **5. Post-mortem** | Reunión **sin culpables** en las 48 h siguientes: línea de tiempo, causa raíz, qué funcionó, qué faltó en el documento, acciones con responsable y fecha. Actualizar este plan (control de versiones). | Kevin Wagner facilita · todo el equipo | ≤ 48 h |

### 8.4 Mensaje al cliente durante un desastre

> **Asunto:** Texticode — interrupción temporal del servicio
>
> Hola, [nombre del administrador del taller]:
>
> Desde las **[hora]** de hoy Texticode no está disponible por **[causa breve, sin tecnicismos: "una falla en el servidor de la base de datos"]**. El equipo ya está restaurando el sistema.
>
> - **Tiempo estimado de recuperación:** antes de las **[hora + 4 h]**.
> - **Último respaldo disponible:** **[fecha y hora]**. La información registrada **después** de esa hora podría tener que volver a ingresarse; les indicaremos exactamente qué revisar.
> - **Mientras tanto:** sigan registrando las órdenes y entregas en papel (remisiones) para digitarlas después.
>
> Les enviaremos una nueva actualización a las **[hora + 1 h]**, aunque todavía no esté resuelto.
>
> Equipo Texticode — Contacto: [correo de soporte de ejemplo]

### 8.5 Consultas de validación propias

Ver **Anexo B**. Todas usan **llaves foráneas por id** (`Id_Cliente`, `Id_Orden`, `Id_Empresa`), nunca nombres.

**Respuesta a la actividad EBS (unir por nombre):** si dos clientes se llaman igual, una factura puede "encontrar" al cliente equivocado y la consulta no detecta que su cliente real se perdió; si un cliente cambia de nombre, todas sus facturas aparecen como huérfanas aunque estén bien. Lo correcto es una columna `cliente_id` con `FOREIGN KEY` y validar `LEFT JOIN clientes c ON c.id = f.cliente_id WHERE c.id IS NULL`.

---

## 9. Pruebas de Recuperación — Simulacro

### 9.1 Calendario de pruebas

| Prueba | Qué comprueba | Frecuencia | Quién | Duración |
|---|---|---|---|---|
| Verificación de integridad | Huella SHA-256, antigüedad y tamaño del último respaldo (`monitor_backup.sh`) | Semanal (lunes 8:30) | Andrés Lancheros | 10 min |
| Verificación off-site | Descargar desde la web de Drive el último `.gpg`, descifrar y comparar huella | Mensual | Kevin Castro | 20 min |
| Restauración en Docker | Restaurar el último diario, Anexo A y B | Mensual (día 1) | Camilo Tibambre | 30 min |
| Restauración de un registro | Escenario 1 con una orden de prueba | Trimestral | Kevin Castro + Kevin Wagner | 45 min |
| Simulacro completo | Escenario 3 + DRP con tiempos reales | Semestral (y en clase) | Todo el equipo | 2–4 h |

### 9.2 Procedimiento de la prueba mensual

1. Copiar el último respaldo diario a una carpeta temporal y verificar su huella.
2. Levantar `texticode-restore` (Docker, `postgres:17`) y restaurar con `--exit-on-error -L lista.toc` (7.3).
3. Ejecutar Anexo A en producción y en Docker; comparar (puede haber diferencias por uso posterior al respaldo: deben ser **iguales o menores** en Docker, nunca mayores).
4. Ejecutar Anexo B en Docker.
5. Restaurar **solo una tabla** para practicar: `pg_restore -d "$R" -t comprobantes --data-only ...` en una base vacía con estructura.
6. Registrar resultado en la tabla de control y borrar el contenedor.

### 9.3 Simulacro final (en clase)

Anuncio del docente: *"Su base de datos de producción desapareció. Recupérenla usando solo sus backups y su documento."*

- **Ejecuta:** [COMPLETAR, propuesto: Kevin Wagner] · **Lee el documento en voz alta:** [COMPLETAR, propuesto: Camilo Tibambre] · **Cronometra y registra:** [COMPLETAR, propuesto: Andrés Lancheros / Kevin Castro]
- Regla: si un paso no está escrito, se anota como **falla del documento**.

**Reporte del simulacro** *(llenar)*:

| Hora | Paso del documento | Resultado | Problema encontrado |
|---|---|---|---|
| [hh:mm] | Anuncio / inicio del cronómetro | — | — |
| [hh:mm] | 8.3 Fase 1–2: detección y activación | | |
| [hh:mm] | Esc. 3 paso 2: crear proyecto nuevo | | |
| [hh:mm] | Esc. 3 paso 3: obtener y verificar respaldo | | |
| [hh:mm] | Esc. 3 paso 4: `pg_restore` | | |
| [hh:mm] | Esc. 3 paso 5: Anexo A y B | | |
| [hh:mm] | Esc. 3 paso 6: reconectar backend | | |
| [hh:mm] | Esc. 3 paso 9: login y prueba funcional | | |
| [hh:mm] | Fin del cronómetro | | |

| Indicador | Valor |
|---|---|
| Tiempo total (RTO real) | [COMPLETAR] min |
| RTO prometido | 240 min |
| ¿Se cumplió? | [COMPLETAR] |
| Datos perdidos (RPO real) | [COMPLETAR] (antigüedad del respaldo usado) |
| Fallas del documento detectadas | [COMPLETAR] |
| Cambios hechos al documento después del simulacro | [COMPLETAR] → registrar como versión 1.1 |

### 9.4 Prueba técnica de los scripts (entorno de preparación)

Antes de usarlos sobre la base real, `backup.sh`, `monitor_backup.sh` y el procedimiento de restauración se probaron de punta a punta el 29/10/2026 en un PostgreSQL local desechable con **15 tablas con los mismos nombres de Texticode y datos sintéticos** (60 filas cada una, sin datos reales):

```text
$ BASE_DIR=/tmp/prueba ./backup.sh diario
2026-10-29 08:04:34 [diario] OK texticode_diario_2026-10-29_08-04.dump | 61598 bytes | 15 tablas | 0s | sha256 da7f60a15dfb3d22...

$ BASE_DIR=/tmp/prueba ./monitor_backup.sh
Último respaldo: texticode_diario_2026-10-29_08-04.dump
OK: respaldo de hace 0 h, 61598 bytes, huella válida

$ pg_restore -d prueba_restore --no-owner --no-privileges --exit-on-error backup.dump
pg_restore: error: could not execute query: ERROR:  schema "public" already exists
   -> 0 tablas restauradas  (hallazgo: se agregó el filtro -L lista.toc al plan)

$ pg_restore -d prueba_restore --no-owner --no-privileges --exit-on-error -L lista.toc backup.dump
real 0m0.123s   -> 15 tablas, conteos iguales al origen
```

Lección aplicada al documento: la restauración que estaba escrita inicialmente **habría fallado** el día del desastre. Esta prueba **no reemplaza** el Laboratorio 2 sobre la base real ni el simulacro; solo valida que los scripts y comandos funcionan.

---

## 10. Monitoreo y Alertas

### 10.1 Tabla de alertas

| Evento | Cómo se detecta | Severidad | Acción | Se avisa a |
|---|---|---|---|---|
| Último respaldo con más de 26 h | `monitor_backup.sh` (antigüedad) | **Alta** | Ejecutar `backup.sh diario` manual y revisar el Programador de tareas | Kevin Wagner; si no responde en 2 h, Camilo Tibambre |
| Respaldo vacío o < 20 KB | `backup.sh` falla / `monitor_backup.sh` (tamaño) | **Crítica** | No confiar en ese archivo; repetir respaldo; revisar `DB_URL` y versión de `pg_dump` | Kevin Wagner + Camilo Tibambre |
| Respaldo con menos de 15 tablas con datos | `backup.sh` (`pg_restore --list`) | **Crítica** | Igual que el anterior | Kevin Wagner + Camilo Tibambre |
| Huella SHA-256 no coincide | `monitor_backup.sh` (`sha256sum -c`) | **Crítica** | Archivo dañado: usar el anterior y revisar el disco | Kevin Wagner |
| Línea `ERROR` en `backup.log` | `monitor_backup.sh` | Media | Revisar el mensaje y corregir | Kevin Wagner |
| Semanal no llegó a Drive en 8 días | Revisión de la carpeta Drive en el monitoreo semanal | Media | Ejecutar `backup.sh semanal`; verificar sincronización de Drive | Kevin Castro |
| Espacio libre en disco < 2 GB | `monitor_backup.sh` (`df`) | Media | Liberar espacio / mover mensuales | Kevin Wagner |
| Proyecto Supabase pausado | Correo de Supabase / panel | Alta | Reactivarlo; si no es posible, Escenario 3 | Kevin Wagner |

### 10.2 Script `monitor_backup.sh` (Git Bash en Windows / Linux)

Probado con un caso que debe disparar alertas (archivo vacío y antiguo) y con un caso sano (9.4).

```bash
#!/usr/bin/env bash
# monitor_backup.sh — Revisa el último respaldo diario de Texticode
# Código de salida: 0 = todo bien, 1 = hay alertas
set -uo pipefail

BASE_DIR="${BASE_DIR:-/c/texticode-backups}"
DIR="$BASE_DIR/diarios"
MAX_HORAS=26
MIN_BYTES=20000
MIN_LIBRE_MB=2048
ALERTAS=0

alerta() { echo "ALERTA [$1] $2"; ALERTAS=$((ALERTAS+1)); }

ULTIMO=$(ls -1t "$DIR"/texticode_*.dump 2>/dev/null | head -n1 || true)
if [ -z "$ULTIMO" ]; then
  alerta CRITICA "No hay ningún respaldo en $DIR"
  exit 1
fi
echo "Último respaldo: $(basename "$ULTIMO")"

# 1. Antigüedad (stat -c en GNU: Linux y Git Bash; en macOS sería stat -f %m)
MTIME=$(stat -c %Y "$ULTIMO")
HORAS=$(( ( $(date +%s) - MTIME ) / 3600 ))
[ "$HORAS" -le "$MAX_HORAS" ] || alerta ALTA "El último respaldo tiene $HORAS horas"

# 2. Tamaño (detecta la falla silenciosa: archivo creado pero vacío)
BYTES=$(stat -c %s "$ULTIMO")
[ "$BYTES" -ge "$MIN_BYTES" ] || alerta CRITICA "Respaldo sospechosamente pequeño: $BYTES bytes"

# 3. Huella
HUELLA="${ULTIMO%.dump}.sha256"
if [ -f "$HUELLA" ]; then
  ( cd "$DIR" && sha256sum -c --quiet "$(basename "$HUELLA")" ) \
    || alerta CRITICA "La huella SHA-256 no coincide"
else
  alerta ALTA "Falta el archivo de huella $(basename "$HUELLA")"
fi

# 4. Contenido: debe tener 15 tablas con datos
if command -v pg_restore >/dev/null 2>&1; then
  TABLAS=$(pg_restore --list "$ULTIMO" 2>/dev/null | grep -c "TABLE DATA" || true)
  [ "$TABLAS" -ge 15 ] || alerta CRITICA "Solo $TABLAS tablas con datos (esperadas 15)"
fi

# 5. Espacio LIBRE (columna Avail, no Use%)
LIBRE_MB=$(df -Pm "$DIR" | awk 'NR==2 {print $4}')
[ "$LIBRE_MB" -ge "$MIN_LIBRE_MB" ] || alerta MEDIA "Solo quedan ${LIBRE_MB} MB libres"

# 6. Errores recientes en el log
if [ -f "$BASE_DIR/logs/backup.log" ] && tail -n 20 "$BASE_DIR/logs/backup.log" | grep -q "ERROR"; then
  alerta MEDIA "Hay errores recientes en backup.log"
fi

if [ "$ALERTAS" -eq 0 ]; then
  echo "OK: respaldo de hace ${HORAS} h, ${BYTES} bytes, huella válida"
  exit 0
fi
echo "Total de alertas: $ALERTAS"
exit 1
```

**Prueba del disparo de alertas** (ejecutada en el entorno de preparación con un archivo simulado vacío y de hace 3 días):

```text
$ touch -d '3 days ago' diarios/texticode_diario_prueba.dump
$ ./monitor_backup.sh ; echo "exit=$?"
Último respaldo: texticode_diario_prueba.dump
ALERTA [ALTA] El último respaldo tiene 72 horas
ALERTA [CRITICA] Respaldo sospechosamente pequeño: 0 bytes
ALERTA [ALTA] Falta el archivo de huella texticode_diario_prueba.sha256
ALERTA [CRITICA] Solo 0 tablas con datos (esperadas 15)
Total de alertas: 4
exit=1
```

Con un respaldo real y sano el mismo script responde `OK` y `exit=0` (ver 9.4).

Captura de la prueba en el equipo real: **[COMPLETAR]**.

### 10.3 Actividad "Encuentra el error" — monitoreo del plan EBS

| # | Pregunta | Respuesta |
|---|---|---|
| 1 | `stat -f %m` / `stat -f %z` | Es sintaxis **BSD (macOS)**. En Linux (GNU coreutils) `-f` significa "estado del sistema de archivos" y el script falla o devuelve otra cosa. Equivalentes: `stat -c %Y` (fecha de modificación) y `stat -c %s` (tamaño). Git Bash en Windows usa la versión GNU, por eso nuestro script usa `-c`. |
| 2 | `ESPACIO_LIBRE` con la columna `Use%` | `Use%` es el porcentaje **usado**, no el libre. Si la alerta compara "mayor que 90", funciona por casualidad aunque el nombre engañe; si alguien la lee literal y escribe "libre menor que 10", la lógica queda **invertida** y alerta cuando el disco está vacío. Nuestro script lee la columna `Available` (`df -Pm`, campo 4) y la nombra `LIBRE_MB`. |
| 3 | Huella del archivo local comparada con un `.sha256` hecho del mismo archivo local | No demuestra nada sobre la nube: solo comprueba que el archivo local es igual a sí mismo. Para saber que la copia remota sirve hay que **descargarla de verdad** (desde la web de Drive, no desde la carpeta sincronizada), descifrarla, calcular su huella y compararla con la registrada al crear el respaldo; o usar una herramienta que lea el hash remoto (`rclone check`). Lo definitivo es **restaurar** esa copia descargada (prueba mensual). |

---

## 11. Roles y Responsabilidades

### 11.1 Equipo

| Integrante | Rol en el plan |
|---|---|
| **Kevin Wagner** | Responsable técnico del plan. Propietario del proyecto Supabase y del equipo donde corren los respaldos automáticos. Ejecuta restauraciones. |
| **Camilo Tibambre** | **Suplente técnico** (reemplaza al responsable). Dueño del repositorio GitHub. Lee el procedimiento durante restauraciones y simulacros; custodia la USB offline. |
| **Andrés Lancheros** | Monitoreo y validación: revisión semanal, consultas del Anexo B, registro de tiempos. |
| **Kevin Castro** | Comunicación con el taller, verificación de la copia en Drive y tabla de control de respaldos. |
| **Ing. Edwin Marín** | Docente: revisa y aprueba el documento; se le informa de simulacros y desastres. |

### 11.2 Matriz RACI

KW = Kevin Wagner · CT = Camilo Tibambre · AL = Andrés Lancheros · KC = Kevin Castro · EM = Ing. Edwin Marín

| Actividad | KW | CT | AL | KC | EM |
|---|:---:|:---:|:---:|:---:|:---:|
| Mantener `backup.sh` y la programación automática | **A**, R | C | I | I | — |
| Respaldo manual pre-cambio | **A**, R | R (si él hace el cambio) | I | I | — |
| Monitoreo semanal de respaldos | I | C | **A**, R | I | — |
| Copia off-site a Drive y su verificación mensual | C | I | I | **A**, R | — |
| Copia mensual a USB offline | R | **A** | I | I | — |
| Prueba mensual de restauración en Docker | C | **A**, R | C | I | — |
| Activar el DRP y dirigir la recuperación | **A**, R | R (suplente) | C | I | I |
| Comunicación con el taller durante un incidente | C | I | I | **A**, R | I |
| Validación posterior a la restauración | C | C | **A**, R | C | — |
| Simulacro semestral | R | R | R | R | **A** |
| Actualizar el plan tras simulacro o cambio del sistema | **A**, R | C | C | C | I |
| Rotación de credenciales de BD y frase de cifrado | **A**, R | C | — | I | — |

Cada actividad tiene **exactamente una A**.

### 11.3 Respuesta a la pregunta EBS (una sola persona "R, A" en todo)

Si esa persona se enferma o está de vacaciones el día del desastre, **nadie sabe ni puede** restaurar: es un punto único de falla ("factor bus = 1"), y el RTO real se vuelve "cuando vuelva". Se resuelve con un **suplente nombrado** que tenga acceso propio (miembro de la organización en Supabase, acceso a la carpeta de Drive y a la frase de cifrado en el gestor de contraseñas), con procedimientos escritos que cualquiera pueda seguir, y **rotando** quién ejecuta las pruebas mensuales. En Texticode el suplente es Camilo Tibambre y las pruebas mensuales las ejecuta él, no el responsable.

### 11.4 Contactos de emergencia (datos de ejemplo)

| Rol | Nombre | Teléfono (ejemplo) | Correo (ejemplo) | Disponibilidad |
|---|---|---|---|---|
| Responsable técnico | Kevin Wagner | +57 300 000 0001 | responsable@texticode.test | L–S 7:00–21:00 |
| Suplente técnico | Camilo Tibambre | +57 300 000 0002 | suplente@texticode.test | L–S 7:00–21:00 |
| Monitoreo y validación | Andrés Lancheros | +57 300 000 0003 | monitoreo@texticode.test | L–V 7:00–19:00 |
| Comunicación con el taller | Kevin Castro | +57 300 000 0004 | soporte@texticode.test | L–V 7:00–19:00 |
| Docente | Ing. Edwin Marín | +57 300 000 0005 | docente@sena.test | Horario de formación |
| Soporte Supabase | — | — | supabase.com/support | 24/7 (según plan) |

**Escalamiento:** si el responsable no contesta en **30 minutos**, el suplente asume la fase 2 del DRP.

---

## 12. Costos y Recursos

### 12.1 Costo de la estrategia actual (precios consultados el 29/10/2026)

| Recurso | Uso en el plan | Precio consultado | Costo mensual | Costo anual |
|---|---|---|---:|---:|
| Supabase plan **Free** | Producción (sin respaldos incluidos) | USD 0 | USD 0 | USD 0 |
| Google Drive (cuenta Google) | Copias cifradas (≈ 116 MB) | 15 GB gratuitos por cuenta | USD 0 | USD 0 |
| Disco del equipo del responsable | Diarios y pre-cambio (≈ 360 MB) | Ya existe | USD 0 | USD 0 |
| Memoria USB 32 GB dedicada | Copia offline mensual | Compra única, precio de mercado estimado ≈ COP 25.000 | — | ≈ COP 25.000 (una vez) |
| PostgreSQL client / Docker / Git Bash / gpg | Herramientas | Software libre | USD 0 | USD 0 |
| Tiempo del equipo | Monitoreo (10 min/sem), pruebas (≈ 1 h/mes) | — | ≈ 1 h 40 min | ≈ 20 h |
| **Total en dinero** | | | **USD 0** | **≈ COP 25.000** |

### 12.2 Alternativas evaluadas (si el sistema crece)

| Opción | Qué aporta | Precio consultado | Costo anual aprox. |
|---|---|---|---:|
| Supabase **Pro** | Respaldos diarios automáticos con 7 días de historial (restauración desde el panel) | USD 25/mes por organización | USD 300 |
| Pro + **PITR 7 días** | Recuperación a cualquier segundo (RPO ≈ 0); exige cómputo *Small* | ≈ USD 100/mes adicionales + cómputo | > USD 1.500 |
| Cloudflare R2 (en lugar de Drive) | Almacenamiento de objetos con API; 10 GB gratis y **sin cobro por descarga** | USD 0,015/GB-mes después de 10 GB | USD 0 para este tamaño |
| Google One 100 GB | Más espacio si Drive se llena | ≈ USD 1,99/mes (precio de referencia) | ≈ USD 24 |

Sobre el costo de **transferencia**: Google Drive y Cloudflare R2 no cobran por descargar (justo cuando se necesita restaurar); en AWS S3 la salida de datos se cobra después de la cuota gratuita, por eso no se eligió.

### 12.3 Costo para el negocio de perder un día de datos (taller representativo)

Supuestos (taller pequeño de Bogotá, valores estimados para el ejercicio): 3–5 órdenes nuevas y 10–20 avances de fase por día; el administrador tarda ≈ 2 horas en redigitar un día desde remisiones; costo de su hora ≈ COP 15.000.

- Redigitación: 2 h × COP 15.000 = **COP 30.000** por día perdido.
- Riesgo mayor (no siempre cuantificable): inventario desactualizado que lleva a comprar material de más o quedarse sin él, entregas sin comprobante ante un reclamo del cliente, y pérdida de confianza en el sistema.
- Sin ningún respaldo (pérdida total): reconstruir meses de órdenes, inventario y usuarios de **5 empresas** → decenas de horas por taller y probable abandono del sistema.

### 12.4 Comparación

Proteger los datos de Texticode cuesta hoy **USD 0 al mes** y una memoria USB, más unas 20 horas de trabajo del equipo al año. Un solo día perdido le cuesta a un taller al menos COP 30.000 en redigitación y muchísimo más en errores de inventario y entregas, y una pérdida total pondría en riesgo el producto. La relación costo-beneficio es claramente favorable. Si Texticode pasa a operar con talleres reales que paguen, el siguiente paso recomendado es **Supabase Pro (USD 25/mes)** para sumar los respaldos diarios del proveedor a los propios; PITR solo se justificaría si un RPO de 24 h deja de ser aceptable.

---

## 13. Cierre del documento

### 13.1 Registro de respaldos (`control_backups`)

Se lleva en una hoja compartida del equipo (no dentro de la BD de producción, porque si la base se pierde, el registro también). Estructura:

| Fecha y hora | Tipo | Archivo | Tamaño | SHA-256 (16 car.) | Tablas | Resultado | Verificó |
|---|---|---|---|---|---|---|---|
| [COMPLETAR] | Manual (Lab. 1) | texticode_diario_AAAA-MM-DD_HH-MM.dump | [ ] KB | [ ] | 15 | [OK/FALLO] | [ ] |
| [COMPLETAR] | Restauración (Lab. 2) | (mismo archivo) | — | [ ] | 15/15 | RTO [ ] min | [ ] |
| [COMPLETAR] | Simulacro | | | | | RTO [ ] min | [ ] |

### 13.2 Lista de verificación mensual

- [ ] Los 28 diarios de los últimos 14 días existen y el monitoreo dio OK las 4 semanas.
- [ ] El semanal de cada domingo está en Drive (`.gpg` + `.sha256`).
- [ ] Se descargó desde la web de Drive el último semanal, se descifró y la huella coincide.
- [ ] Se generó el mensual y se copió a la USB; la USB volvió a su custodio.
- [ ] Prueba de restauración en Docker: Anexo A y B correctos.
- [ ] Se borraron los semanales de más de 8 semanas y los mensuales de más de 12 meses.
- [ ] El proyecto Supabase está activo (no pausado) y la versión de `pg_dump` sigue siendo ≥ la del servidor.
- [ ] No hay respaldos, `.env` ni contraseñas en el repositorio (`git ls-files | grep -E "\.(dump|gpg|sha256)$|\.env$"` vacío).
- [ ] La tabla de control está al día.

### 13.3 Control de versiones

| Versión | Fecha | Autor | Cambios |
|---|---|---|---|
| 1.0 | 29/10/2026 | Equipo Texticode | Versión inicial: 12 secciones, datos reales de la BD, scripts de respaldo y monitoreo, 4 escenarios, DRP |
| 1.1 | [COMPLETAR] | [ ] | Correcciones después del simulacro |

### 13.4 Próxima revisión

**30 de abril de 2027** (semestral), o antes si cambia el esquema de la base (nueva migración), el proveedor, el plan de Supabase o el equipo.

### 13.5 Aprobación

| Rol | Nombre | Firma | Fecha |
|---|---|---|---|
| Responsable técnico | Kevin Wagner | ________________ | __/__/____ |
| Suplente técnico | Camilo Tibambre | ________________ | __/__/____ |
| Integrante (monitoreo y validación) | Andrés Lancheros | ________________ | __/__/____ |
| Integrante (comunicación y registro) | Kevin Castro | ________________ | __/__/____ |
| Compañero que ejecutó el simulacro | [COMPLETAR] | ________________ | __/__/____ |
| Docente | Ing. Edwin Marín | ________________ | __/__/____ |

---

## Anexo A — Conteo de registros (todas las tablas)

```sql
-- anexo_a_conteos.sql
SELECT 'empresa' AS tabla, COUNT(*) FROM public.empresa
UNION ALL SELECT 'empresa_config',         COUNT(*) FROM public.empresa_config
UNION ALL SELECT 'rol',                    COUNT(*) FROM public.rol
UNION ALL SELECT 'usuario',                COUNT(*) FROM public.usuario
UNION ALL SELECT 'usuario_empresa',        COUNT(*) FROM public.usuario_empresa
UNION ALL SELECT 'material',               COUNT(*) FROM public.material
UNION ALL SELECT 'material_movimiento',    COUNT(*) FROM public.material_movimiento
UNION ALL SELECT 'orden_produccion',       COUNT(*) FROM public.orden_produccion
UNION ALL SELECT 'orden_material',         COUNT(*) FROM public.orden_material
UNION ALL SELECT 'orden_operario',         COUNT(*) FROM public.orden_operario
UNION ALL SELECT 'usuario_orden',          COUNT(*) FROM public.usuario_orden
UNION ALL SELECT 'comprobantes',           COUNT(*) FROM public.comprobantes
UNION ALL SELECT 'observacion_operario',   COUNT(*) FROM public.observacion_operario
UNION ALL SELECT 'google_calendar_tokens', COUNT(*) FROM public.google_calendar_tokens
UNION ALL SELECT 'tokens_recuperacion',    COUNT(*) FROM public.tokens_recuperacion
ORDER BY 1;
```

## Anexo B — Consultas de validación de integridad

Ejecutadas en producción el 29/10/2026: todas en 0, excepto `usuario_sin_empresa` = 1 (el superadministrador, esperado).

```sql
-- anexo_b_validacion.sql — cada fila debe dar 0 (salvo la nota)
SELECT 'stock_negativo' AS chequeo, COUNT(*) FROM public.material
 WHERE "Stock_Actual" < 0
UNION ALL
SELECT 'stock_min_mayor_max', COUNT(*) FROM public.material
 WHERE "Stock_Maximo" > 0 AND "Stock_Minimo" > "Stock_Maximo"
UNION ALL
SELECT 'orden_cantidad_invalida', COUNT(*) FROM public.orden_produccion
 WHERE "Cantidad" <= 0
UNION ALL
SELECT 'orden_realizadas_mayor_cantidad', COUNT(*) FROM public.orden_produccion
 WHERE "Unidades_Realizadas" > "Cantidad"
UNION ALL  -- huérfanos por llave foránea (posibles si se restauró con triggers desactivados)
SELECT 'comprobante_sin_orden', COUNT(*) FROM public.comprobantes c
  LEFT JOIN public.orden_produccion o ON o."Id_Orden" = c."Id_Orden"
 WHERE o."Id_Orden" IS NULL
UNION ALL
SELECT 'fase_sin_orden', COUNT(*) FROM public.orden_operario f
  LEFT JOIN public.orden_produccion o ON o."Id_Orden" = f."Id_Orden"
 WHERE o."Id_Orden" IS NULL
UNION ALL
SELECT 'orden_sin_cliente', COUNT(*) FROM public.orden_produccion o
  LEFT JOIN public.usuario u ON u."Id_Usuario" = o."Id_Cliente"
 WHERE u."Id_Usuario" IS NULL
UNION ALL
SELECT 'movimiento_sin_material', COUNT(*) FROM public.material_movimiento m
  LEFT JOIN public.material mt ON mt."Id_Material" = m."Id_Material"
 WHERE mt."Id_Material" IS NULL
UNION ALL  -- aislamiento multiempresa: el cliente de la orden debe ser de la misma empresa
SELECT 'orden_cliente_otra_empresa', COUNT(*) FROM public.orden_produccion o
  JOIN public.usuario_empresa ue ON ue."Id_Usuario" = o."Id_Cliente"
 WHERE ue."Id_Empresa" <> o."Id_Empresa"
UNION ALL
SELECT 'material_otra_empresa_en_orden', COUNT(*) FROM public.orden_material om
  JOIN public.material m ON m."Id_Material" = om."Id_Producto"
 WHERE m."Id_Empresa" <> om."Id_Empresa"
UNION ALL  -- NOTA: el valor esperado es 1 (superadministrador sin empresa)
SELECT 'usuario_sin_empresa', COUNT(*) FROM public.usuario u
 WHERE NOT EXISTS (SELECT 1 FROM public.usuario_empresa ue
                    WHERE ue."Id_Usuario" = u."Id_Usuario");

-- Secuencias: tras una restauración parcial, el siguiente id no debe chocar
SELECT 'orden_produccion' AS tabla,
       (SELECT last_value FROM public."orden_produccion_Id_Orden_seq") AS secuencia,
       (SELECT COALESCE(MAX("Id_Orden"),0) FROM public.orden_produccion) AS max_id;
-- Si secuencia < max_id:
-- SELECT setval('public."orden_produccion_Id_Orden_seq"', (SELECT MAX("Id_Orden") FROM public.orden_produccion));
```

## Anexo C — Fuentes consultadas (29/10/2026)

- Supabase Docs, *Database Backups* (planes con respaldo diario, recomendación para plan Free, precios de PITR): https://supabase.com/docs/guides/platform/backups
- Supabase, *Pricing* (Pro USD 25/mes): https://supabase.com/pricing
- Supabase Docs, referencia JS (límite por defecto de 1.000 filas por consulta): https://supabase.com/docs/reference/javascript/select
- PostgreSQL 17, `pg_dump`, `pg_restore`, `CREATE POLICY`: https://www.postgresql.org/docs/current/
- Ley 962 de 2005, artículo 28 (conservación de libros y papeles del comerciante, 10 años) — Normograma DIAN, Oficio 20796 de 2006: https://normograma.dian.gov.co/dian/compilacion/docs/oficio_dian_20796_2006.htm
- Cloudflare R2, *Pricing* (10 GB gratis, sin cobro de salida): https://developers.cloudflare.com/r2/pricing/
- Google One, planes (15 GB gratuitos; 100 GB desde ≈ USD 1,99/mes): https://one.google.com/about/plans

## Anexo D — Recomendación de seguridad pendiente (no aplicada)

El asesor de seguridad de Supabase marca como **crítico** que 7 tablas no tienen RLS. Como el backend usa `pg` directo con el rol propietario (que ignora RLS salvo `FORCE`), activar RLS **sin políticas** cierra el acceso por la API REST pública sin afectar al backend. **Antes de aplicarlo en producción**: respaldo pre-cambio (6.6), ensayo en Docker y prueba de login y Producción.

```sql
ALTER TABLE public.material               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orden_produccion       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comprobantes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_calendar_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observacion_operario   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orden_material         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tokens_recuperacion    ENABLE ROW LEVEL SECURITY;
```
