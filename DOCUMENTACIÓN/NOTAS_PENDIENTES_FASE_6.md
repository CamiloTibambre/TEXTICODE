# Notas pendientes para la Fase 6 (autenticación y contexto de empresa)

## Decisiones de producto ya tomadas
- Un usuario pertenece a UNA sola empresa (la BD lo exige: `usuario_empresa_un_usuario_unique`).
- Roles globales. Recuperación de contraseña global.
- Aislamiento: filtros en el backend primero; RLS queda para más adelante.

## Pendientes que salieron de las pruebas
1. Mover a un usuario de empresa (M-2): hoy se bloquea solo de rebote, por las FKs de sus datos (23503). No es una regla explícita. Si se necesita, hay que diseñarlo como operación propia. Mientras tanto, no ofrecerlo en la UI.
2. El flujo "elegir empresa" al iniciar sesión (select-empresa) ya no hace falta: la empresa sale de la única membresía del usuario.
3. El middleware `requireEmpresa` existe pero las rutas no lo usan. Hay que montarlo y tomar la empresa de `req.auth.empresaId`, nunca del body ni del query.
4. En cada petición se vuelve a consultar usuario y rol, pero no se verifica la membresía empresarial.
5. Siete INSERT omiten `Id_Empresa` (materiales, órdenes, orden-material, orden-operario, usuario-orden, comprobantes, eficiencia/observaciones). Con la BD migrada fallan: backend y migración deben salir juntos. No usar un DEFAULT que asigne todo a la empresa principal.
6. El upsert de Google Calendar usa `ON CONFLICT ("Id_Usuario")`, pero la PK nueva es `("Id_Usuario", "Id_Empresa")`.
7. Cuatro rutas de `/api/notificaciones` confían en datos del cliente (orden y destinatario del body) sin verificar pertenencia a la empresa.
8. Veinte rutas quedaron "indeterminadas" (usuarios, auth, roles, google): revisar con las decisiones de arriba.
9. `usuario_empresa_principal_unique` quedó redundante; evaluar eliminarlo en una próxima revisión del SQL.
10. Nada de esto está aprobado para Supabase ni producción. Antes: pg_dump de respaldo, confirmar versión de PostgreSQL del destino y autorización específica.
