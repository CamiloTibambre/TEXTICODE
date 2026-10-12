# Informe de cierre — Fase 6.1

## Alcance y estado

Se implementó el contexto empresarial de autenticación en los tres archivos autorizados y se ejecutó la prueba nueva aislada. Esto **no declara aprobada la autenticación** ni cubre el backend completo.

## Cambios observados

- `BACKEND/services/auth.service.js`: `processLogin` ya no acepta empresa deseada del cliente; emite sesión solo con la membresía activa única. Cero membresías devuelve `no_memberships`; más de una produce `membership_invariant_violation`. `selectEmpresa` ignora el ID de empresa recibido y solo devuelve la empresa si la membresía es única.
- `BACKEND/routes/auth.route.js`: login ya no lee `idEmpresa`/`Id_Empresa`; `/select-empresa` permanece deprecado e ignora esos campos. Google móvil consulta membresías y usa la empresa y rol de la única membresía; sin tablas conserva compatibilidad anterior.
- `BACKEND/middleware/auth.js`: `requireAuth` hace una consulta unida a usuario, rol, membresía y empresa; comprueba membresía `activo` y empresa `activa`. Para un token empresarial sin coincidencia devuelve 403. `req.auth.empresaId` procede del token después de comprobarlo contra la membresía consultada, no de body/query/params.

## Compatibilidad administrativa / legado

En los archivos revisados no aparece una rama o rol denominado superadministrador (búsqueda `super.?admin|superadmin`: sin coincidencias). No se accedió a datos, así que no se puede afirmar si existe una cuenta especial en la base. Se conservó el camino legado: si las tablas de membresía no existen (`42P01`), el login emite token legado y `requireAuth` permite token sin empresa mediante la consulta anterior. En esquema multiempresa, la falta de empresa o membresía coincidente es 403. La política de una excepción administrativa con acceso sin empresa queda por definir; este cambio no introduce una.

## Prueba autorizada

Archivo nuevo: `BACKEND/test/fase-6-contexto-empresa.test.js`. La prueba transforma imports por dobles en memoria; no importa `config/env.js` ni `db.js`. Comando ejecutado únicamente sobre este archivo: `node --test BACKEND/test/fase-6-contexto-empresa.test.js`.

| Caso | Resultado observado |
|---|---|
| P1: login ignora empresa del cliente; `/select-empresa` deprecado; Google móvil toma membresía única | pasa |
| P2: sin membresía activa | pasa; HTTP 403 |
| P3: membresía inactiva | pasa; HTTP 403 |
| P4: membresía desactivada después de emitir token | pasa; HTTP 403 y una consulta |
| P5: empresa del token no coincide | pasa; HTTP 403 y una consulta |
| P6: body/query/params no sustituyen la empresa del token | pasa |
| P7: token ausente, vencido o firma inválida | pasa; HTTP 401 |
| P8: usuario inactivo, rol previo y compatibilidad de esquema legado | pasa; 403 para usuario inactivo; el rol del token se conserva como antes |

Salida literal final:

```text
✔ prepara módulos con dobles: no importa env.js, db.js ni módulos externos de red (31.0401ms)
✔ P1: login deriva la empresa única e ignora la empresa del cliente; select-empresa queda deprecado e ignora su empresa (3.6716ms)
✔ P2: login sin membresía activa responde HTTP 403 (0.1793ms)
✔ P3: login con membresía inactiva responde HTTP 403 (0.1988ms)
✔ P4: requireAuth devuelve 403 si se desactiva la membresía después de emitir el token (0.5823ms)
✔ P5: requireAuth devuelve 403 si la empresa del token no coincide con la membresía (0.1714ms)
✔ P6: requireAuth conserva empresaId del token aunque body, query y params indiquen otra (0.14ms)
✔ P7: token ausente, vencido e con firma inválida mantienen rechazo HTTP 401 (0.8653ms)
✔ P8: usuario inactivo sigue en 403 y un rol distinto conserva el rol del token como antes (0.6186ms)
ℹ tests 9
ℹ suites 0
ℹ pass 9
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 220.3442
```

Código de salida de Node: `0`.

## Límites

La prueba ejercita los módulos con dobles locales, no una base PostgreSQL, tokens externos, Google real, despliegue, todas las rutas del backend ni una excepción de superadministrador. Se preserva una vía de compatibilidad que emite/acepta token sin empresa cuando faltan las tablas multiempresa; por tanto, en una base con esquema legado no se puede afirmar aislamiento empresarial. La revisión y prueba de esta fase no aprueban autenticación para producción.
