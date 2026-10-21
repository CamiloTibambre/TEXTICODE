-- Fase 7.2: ejecutar una vez en cada clon desechable de texticode_migrada.
-- Se ejecutan seis bloques Q separados; el nombre de la base activa solo uno.
-- Todo el fixture y las consultas se revierten al final.
BEGIN;
CREATE TEMP TABLE f72_fixture (
  empresa_a integer, empresa_b integer, cliente_a integer, cliente_b integer,
  operario_a integer, operario_b integer, material_a integer, material_b integer,
  orden_a integer, orden_b integer
) ON COMMIT DROP;

DO $fixture$
DECLARE
  db_name text := current_database();
  empresa_a integer; empresa_b integer; rol_id integer;
  cliente_a integer; cliente_b integer; operario_a integer; operario_b integer;
  material_a integer; material_b integer; orden_a integer; orden_b integer;
BEGIN
  IF db_name !~* '(^|_)q[1-6](_|$)' THEN
    RAISE EXCEPTION 'Base no identificada como clon Q1..Q6: %', db_name;
  END IF;
  SELECT min("Id_Rol") INTO rol_id FROM public.rol;
  IF rol_id IS NULL THEN RAISE EXCEPTION 'Fixture requiere al menos un rol'; END IF;
  INSERT INTO public.empresa ("Nombre_Empresa", "Slug") VALUES ('Fixture orden A ' || db_name, 'fixture-orden-a-' || db_name) RETURNING "Id_Empresa" INTO empresa_a;
  INSERT INTO public.empresa ("Nombre_Empresa", "Slug") VALUES ('Fixture orden B ' || db_name, 'fixture-orden-b-' || db_name) RETURNING "Id_Empresa" INTO empresa_b;
  INSERT INTO public.usuario ("Nombre_Completo", "Nombre_Usuario", "Correo", "Contrasena", "Id_Rol") VALUES ('Fixture cliente A', 'f72_ca_' || db_name, 'f72_ca_' || db_name || '@example.invalid', 'synthetic', rol_id) RETURNING "Id_Usuario" INTO cliente_a;
  INSERT INTO public.usuario ("Nombre_Completo", "Nombre_Usuario", "Correo", "Contrasena", "Id_Rol") VALUES ('Fixture cliente B', 'f72_cb_' || db_name, 'f72_cb_' || db_name || '@example.invalid', 'synthetic', rol_id) RETURNING "Id_Usuario" INTO cliente_b;
  INSERT INTO public.usuario ("Nombre_Completo", "Nombre_Usuario", "Correo", "Contrasena", "Id_Rol") VALUES ('Fixture operario A', 'f72_oa_' || db_name, 'f72_oa_' || db_name || '@example.invalid', 'synthetic', rol_id) RETURNING "Id_Usuario" INTO operario_a;
  INSERT INTO public.usuario ("Nombre_Completo", "Nombre_Usuario", "Correo", "Contrasena", "Id_Rol") VALUES ('Fixture operario B', 'f72_ob_' || db_name, 'f72_ob_' || db_name || '@example.invalid', 'synthetic', rol_id) RETURNING "Id_Usuario" INTO operario_b;
  INSERT INTO public.usuario_empresa ("Id_Usuario", "Id_Empresa", "Id_Rol", "Es_Principal") VALUES
    (cliente_a, empresa_a, rol_id, true), (operario_a, empresa_a, rol_id, true),
    (cliente_b, empresa_b, rol_id, true), (operario_b, empresa_b, rol_id, true);
  INSERT INTO public.material ("Nombre_Material", "Categoria", "Unidad", "Id_Empresa") VALUES ('Material fixture A ' || db_name, 'Fixture', 'u', empresa_a) RETURNING "Id_Material" INTO material_a;
  INSERT INTO public.material ("Nombre_Material", "Categoria", "Unidad", "Id_Empresa") VALUES ('Material fixture B ' || db_name, 'Fixture', 'u', empresa_b) RETURNING "Id_Material" INTO material_b;
  INSERT INTO public.orden_produccion ("Id_Cliente", "Id_Material", "Id_Operario", "Descripcion", "Cantidad", "Fecha_Limite", "Id_Empresa")
    VALUES (cliente_a, material_a, operario_a, 'Orden fixture A', 1, DATE '2099-01-01', empresa_a) RETURNING "Id_Orden" INTO orden_a;
  INSERT INTO public.orden_produccion ("Id_Cliente", "Id_Material", "Id_Operario", "Descripcion", "Cantidad", "Fecha_Limite", "Id_Empresa")
    VALUES (cliente_b, material_b, operario_b, 'Orden fixture B', 1, DATE '2099-01-01', empresa_b) RETURNING "Id_Orden" INTO orden_b;
  INSERT INTO f72_fixture VALUES (empresa_a, empresa_b, cliente_a, cliente_b, operario_a, operario_b, material_a, material_b, orden_a, orden_b);
END
$fixture$;

DO $q1$
DECLARE db_name text := current_database(); f record; n integer;
BEGIN
  IF db_name ~* '(^|_)q1(_|$)' THEN
    SELECT * INTO f FROM f72_fixture;
    SELECT count(*) INTO n FROM public.orden_produccion WHERE "Id_Empresa" = f.empresa_a;
    IF n <> 1 THEN RAISE EXCEPTION 'Q1: listado A devolvió % filas, esperado 1', n; END IF;
    SELECT count(*) INTO n FROM public.orden_produccion WHERE "Id_Empresa" = f.empresa_b;
    IF n <> 1 THEN RAISE EXCEPTION 'Q1: listado B devolvió % filas, esperado 1', n; END IF;
    RAISE NOTICE 'Q1 OK';
  END IF;
END
$q1$;

DO $q2$
DECLARE db_name text := current_database(); f record; n integer;
BEGIN
  IF db_name ~* '(^|_)q2(_|$)' THEN
    SELECT * INTO f FROM f72_fixture;
    SELECT count(*) INTO n FROM public.orden_produccion WHERE "Id_Orden" = f.orden_b AND "Id_Empresa" = f.empresa_a;
    IF n <> 0 THEN RAISE EXCEPTION 'Q2: lectura cruzada no quedó vacía'; END IF;
    UPDATE public.orden_produccion SET "Estado" = 'Completada' WHERE "Id_Orden" = f.orden_b AND "Id_Empresa" = f.empresa_a;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> 0 THEN RAISE EXCEPTION 'Q2: actualización cruzada afectó % filas', n; END IF;
    DELETE FROM public.orden_produccion WHERE "Id_Orden" = f.orden_b AND "Id_Empresa" = f.empresa_a;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> 0 THEN RAISE EXCEPTION 'Q2: borrado cruzado afectó % filas', n; END IF;
    RAISE NOTICE 'Q2 OK';
  END IF;
END
$q2$;

DO $q3$
DECLARE db_name text := current_database(); f record; sqlstate_captured text;
BEGIN
  IF db_name ~* '(^|_)q3(_|$)' THEN
    SELECT * INTO f FROM f72_fixture;
    BEGIN
      INSERT INTO public.orden_produccion ("Id_Cliente", "Id_Material", "Descripcion", "Cantidad", "Fecha_Limite", "Id_Empresa")
      VALUES (f.cliente_b, f.material_a, 'Q3 cliente cruzado', 1, DATE '2099-01-01', f.empresa_a);
      RAISE EXCEPTION 'Q3: se aceptó cliente de otra empresa';
    EXCEPTION WHEN foreign_key_violation THEN
      GET STACKED DIAGNOSTICS sqlstate_captured = RETURNED_SQLSTATE;
      IF sqlstate_captured <> '23503' THEN RAISE; END IF;
    END;
    RAISE NOTICE 'Q3 OK';
  END IF;
END
$q3$;

DO $q4$
DECLARE db_name text := current_database(); f record; sqlstate_captured text;
BEGIN
  IF db_name ~* '(^|_)q4(_|$)' THEN
    SELECT * INTO f FROM f72_fixture;
    BEGIN
      INSERT INTO public.orden_produccion ("Id_Cliente", "Id_Material", "Id_Operario", "Descripcion", "Cantidad", "Fecha_Limite", "Id_Empresa")
      VALUES (f.cliente_a, f.material_a, f.operario_b, 'Q4 operario cruzado', 1, DATE '2099-01-01', f.empresa_a);
      RAISE EXCEPTION 'Q4: se aceptó operario de otra empresa';
    EXCEPTION WHEN foreign_key_violation THEN
      GET STACKED DIAGNOSTICS sqlstate_captured = RETURNED_SQLSTATE;
      IF sqlstate_captured <> '23503' THEN RAISE; END IF;
    END;
    RAISE NOTICE 'Q4 OK';
  END IF;
END
$q4$;

DO $q5$
DECLARE db_name text := current_database(); f record; n integer;
BEGIN
  IF db_name ~* '(^|_)q5(_|$)' THEN
    SELECT * INTO f FROM f72_fixture;
    INSERT INTO public.orden_produccion ("Id_Cliente", "Id_Material", "Id_Operario", "Producto", "Descripcion", "Cantidad", "Prioridad", "Fecha_Limite", "Estado", "Dificultad", "Id_Empresa")
    VALUES (f.cliente_a, f.material_a, NULL, NULL, 'Q5 insert router', 1, 'Media', DATE '2099-01-01', 'En Proceso', 'Media', f.empresa_a);
    UPDATE public.orden_produccion SET "Estado" = 'Completada' WHERE "Id_Orden" = f.orden_a AND "Id_Empresa" = f.empresa_a;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> 1 THEN RAISE EXCEPTION 'Q5: actualización afectó % filas, esperado 1', n; END IF;
    RAISE NOTICE 'Q5 OK';
  END IF;
END
$q5$;

DO $q6$
DECLARE db_name text := current_database(); f record; n integer;
BEGIN
  IF db_name ~* '(^|_)q6(_|$)' THEN
    SELECT * INTO f FROM f72_fixture;
    -- Control sin predicado Id_Empresa, limitado a las dos filas sintéticas del caso.
    SELECT count(*) INTO n FROM public.orden_produccion WHERE "Id_Orden" IN (f.orden_a, f.orden_b);
    IF n <> 2 THEN RAISE EXCEPTION 'Q6: control global devolvió % filas, esperado 2', n; END IF;
    RAISE NOTICE 'Q6 OK';
  END IF;
END
$q6$;
ROLLBACK;
