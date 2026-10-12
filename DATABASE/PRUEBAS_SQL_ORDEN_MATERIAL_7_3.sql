-- Fase 7.3. Ejecutar en cada clon independiente de texticode_migrada.
-- Cada bloque Q se activa solo si el nombre de la base contiene _qN_.
-- Fixture sintético persistente solo dentro del clon desechable.
DO $fixture$
DECLARE
  db_name text := current_database();
  company_a integer; company_b integer; role_id integer;
  client_a integer; client_b integer; material_a integer; material_b integer;
  order_a integer; order_b integer;
BEGIN
  IF db_name !~* '(^|_)q[1-7](_|$)' THEN
    RAISE EXCEPTION 'Base no identificada como clon Q1..Q7: %', db_name;
  END IF;
  SELECT min("Id_Rol") INTO role_id FROM public.rol;
  IF role_id IS NULL THEN RAISE EXCEPTION 'Fixture requiere al menos un rol'; END IF;

  INSERT INTO public.empresa ("Nombre_Empresa", "Slug")
  VALUES ('OM73 A ' || db_name, 'om73-a-' || db_name) RETURNING "Id_Empresa" INTO company_a;
  INSERT INTO public.empresa ("Nombre_Empresa", "Slug")
  VALUES ('OM73 B ' || db_name, 'om73-b-' || db_name) RETURNING "Id_Empresa" INTO company_b;
  INSERT INTO public.usuario ("Nombre_Completo", "Nombre_Usuario", "Correo", "Contrasena", "Id_Rol")
  VALUES ('OM73 cliente A', 'om73-ca-' || db_name, 'om73-ca-' || db_name || '@example.invalid', 'synthetic', role_id)
  RETURNING "Id_Usuario" INTO client_a;
  INSERT INTO public.usuario ("Nombre_Completo", "Nombre_Usuario", "Correo", "Contrasena", "Id_Rol")
  VALUES ('OM73 cliente B', 'om73-cb-' || db_name, 'om73-cb-' || db_name || '@example.invalid', 'synthetic', role_id)
  RETURNING "Id_Usuario" INTO client_b;
  INSERT INTO public.usuario_empresa ("Id_Usuario", "Id_Empresa", "Id_Rol", "Estado", "Es_Principal")
  VALUES (client_a, company_a, role_id, 'activo', true), (client_b, company_b, role_id, 'activo', true);
  INSERT INTO public.material ("Nombre_Material", "Categoria", "Stock_Actual", "Unidad", "Id_Empresa")
  VALUES ('OM73 material A ' || db_name, 'Fixture', 10, 'u', company_a) RETURNING "Id_Material" INTO material_a;
  INSERT INTO public.material ("Nombre_Material", "Categoria", "Stock_Actual", "Unidad", "Id_Empresa")
  VALUES ('OM73 material B ' || db_name, 'Fixture', 20, 'u', company_b) RETURNING "Id_Material" INTO material_b;
  INSERT INTO public.orden_produccion ("Id_Cliente", "Id_Material", "Descripcion", "Cantidad", "Fecha_Limite", "Id_Empresa")
  VALUES (client_a, material_a, 'OM73 orden A', 1, DATE '2099-01-01', company_a) RETURNING "Id_Orden" INTO order_a;
  INSERT INTO public.orden_produccion ("Id_Cliente", "Id_Material", "Descripcion", "Cantidad", "Fecha_Limite", "Id_Empresa")
  VALUES (client_b, material_b, 'OM73 orden B', 1, DATE '2099-01-01', company_b) RETURNING "Id_Orden" INTO order_b;
END
$fixture$;

DO $q1$
DECLARE db_name text := current_database(); a integer; b integer; ma integer; mb integer; oa integer; ob integer; n integer;
BEGIN
  IF db_name ~* '(^|_)q1(_|$)' THEN
    SELECT "Id_Empresa" INTO a FROM public.empresa WHERE "Slug" = 'om73-a-' || db_name;
    SELECT "Id_Empresa" INTO b FROM public.empresa WHERE "Slug" = 'om73-b-' || db_name;
    SELECT "Id_Material" INTO ma FROM public.material WHERE "Nombre_Material" = 'OM73 material A ' || db_name;
    SELECT "Id_Material" INTO mb FROM public.material WHERE "Nombre_Material" = 'OM73 material B ' || db_name;
    SELECT "Id_Orden" INTO oa FROM public.orden_produccion WHERE "Descripcion" = 'OM73 orden A' AND "Id_Empresa" = a;
    SELECT "Id_Orden" INTO ob FROM public.orden_produccion WHERE "Descripcion" = 'OM73 orden B' AND "Id_Empresa" = b;
    INSERT INTO public.orden_material ("Id_Orden", "Id_Producto", "Cantidad", "Id_Empresa") VALUES (oa, ma, 2, a), (ob, mb, 3, b);
    SELECT count(*) INTO n FROM orden_material om INNER JOIN material m ON om."Id_Producto" = m."Id_Material" AND m."Id_Empresa" = om."Id_Empresa" WHERE om."Id_Orden" = oa AND om."Id_Empresa" = a;
    IF n <> 1 THEN RAISE EXCEPTION 'Q1 A: esperado 1, obtenido %', n; END IF;
    SELECT count(*) INTO n FROM orden_material om INNER JOIN material m ON om."Id_Producto" = m."Id_Material" AND m."Id_Empresa" = om."Id_Empresa" WHERE om."Id_Orden" = ob AND om."Id_Empresa" = b;
    IF n <> 1 THEN RAISE EXCEPTION 'Q1 B: esperado 1, obtenido %', n; END IF;
    RAISE NOTICE 'Q1 OK';
  END IF;
END
$q1$;

DO $q2$
DECLARE db_name text := current_database(); a integer; b integer; mb integer; ob integer; stock_before numeric; stock_after numeric; n integer;
BEGIN
  IF db_name ~* '(^|_)q2(_|$)' THEN
    SELECT "Id_Empresa" INTO a FROM public.empresa WHERE "Slug" = 'om73-a-' || db_name;
    SELECT "Id_Empresa" INTO b FROM public.empresa WHERE "Slug" = 'om73-b-' || db_name;
    SELECT "Id_Material" INTO mb FROM public.material WHERE "Nombre_Material" = 'OM73 material B ' || db_name;
    SELECT "Id_Orden" INTO ob FROM public.orden_produccion WHERE "Descripcion" = 'OM73 orden B' AND "Id_Empresa" = b;
    INSERT INTO public.orden_material ("Id_Orden", "Id_Producto", "Cantidad", "Id_Empresa") VALUES (ob, mb, 3, b);
    SELECT "Stock_Actual" INTO stock_before FROM public.material WHERE "Id_Material" = mb AND "Id_Empresa" = b;
    UPDATE public.orden_material SET "Cantidad" = 9 WHERE "Id_Orden" = ob AND "Id_Producto" = mb AND "Id_Empresa" = a;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> 0 THEN RAISE EXCEPTION 'Q2 UPDATE cruzado afectó % filas', n; END IF;
    DELETE FROM public.orden_material WHERE "Id_Orden" = ob AND "Id_Producto" = mb AND "Id_Empresa" = a;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> 0 THEN RAISE EXCEPTION 'Q2 DELETE cruzado afectó % filas', n; END IF;
    SELECT "Stock_Actual" INTO stock_after FROM public.material WHERE "Id_Material" = mb AND "Id_Empresa" = b;
    IF stock_after <> stock_before THEN RAISE EXCEPTION 'Q2 stock B cambió: % a %', stock_before, stock_after; END IF;
    RAISE NOTICE 'Q2 OK';
  END IF;
END
$q2$;

DO $q3$
DECLARE db_name text := current_database(); a integer; ma integer; mb integer; oa integer; state text;
BEGIN
  IF db_name ~* '(^|_)q3(_|$)' THEN
    SELECT "Id_Empresa" INTO a FROM public.empresa WHERE "Slug" = 'om73-a-' || db_name;
    SELECT "Id_Material" INTO ma FROM public.material WHERE "Nombre_Material" = 'OM73 material A ' || db_name;
    SELECT "Id_Material" INTO mb FROM public.material WHERE "Nombre_Material" = 'OM73 material B ' || db_name;
    SELECT "Id_Orden" INTO oa FROM public.orden_produccion WHERE "Descripcion" = 'OM73 orden A' AND "Id_Empresa" = a;
    BEGIN
      INSERT INTO public.orden_material ("Id_Orden", "Id_Producto", "Cantidad", "Id_Empresa") VALUES (oa, mb, 1, a);
      RAISE EXCEPTION 'Q3: FK permitió material de B';
    EXCEPTION WHEN foreign_key_violation THEN GET STACKED DIAGNOSTICS state = RETURNED_SQLSTATE; IF state <> '23503' THEN RAISE; END IF;
    END;
    RAISE NOTICE 'Q3 OK';
  END IF;
END
$q3$;

DO $q4$
DECLARE db_name text := current_database(); a integer; ma integer; ob integer; state text;
BEGIN
  IF db_name ~* '(^|_)q4(_|$)' THEN
    SELECT "Id_Empresa" INTO a FROM public.empresa WHERE "Slug" = 'om73-a-' || db_name;
    SELECT "Id_Material" INTO ma FROM public.material WHERE "Nombre_Material" = 'OM73 material A ' || db_name;
    SELECT "Id_Orden" INTO ob FROM public.orden_produccion WHERE "Descripcion" = 'OM73 orden B';
    BEGIN
      INSERT INTO public.orden_material ("Id_Orden", "Id_Producto", "Cantidad", "Id_Empresa") VALUES (ob, ma, 1, a);
      RAISE EXCEPTION 'Q4: FK permitió orden de B';
    EXCEPTION WHEN foreign_key_violation THEN GET STACKED DIAGNOSTICS state = RETURNED_SQLSTATE; IF state <> '23503' THEN RAISE; END IF;
    END;
    RAISE NOTICE 'Q4 OK';
  END IF;
END
$q4$;

DO $q5$
DECLARE db_name text := current_database(); a integer; ma integer; oa integer; old_qty numeric; new_qty numeric; n integer;
BEGIN
  IF db_name ~* '(^|_)q5(_|$)' THEN
    SELECT "Id_Empresa" INTO a FROM public.empresa WHERE "Slug" = 'om73-a-' || db_name;
    SELECT "Id_Material" INTO ma FROM public.material WHERE "Nombre_Material" = 'OM73 material A ' || db_name;
    SELECT "Id_Orden" INTO oa FROM public.orden_produccion WHERE "Descripcion" = 'OM73 orden A' AND "Id_Empresa" = a;
    -- PREPARE omitiendo tipos: PostgreSQL infiere cada parámetro desde columnas y predicados.
    EXECUTE 'PREPARE q5_list AS SELECT om.*, m."Nombre_Material", m."Unidad" FROM orden_material om INNER JOIN material m ON om."Id_Producto" = m."Id_Material" AND m."Id_Empresa" = om."Id_Empresa" WHERE om."Id_Orden" = $1 AND om."Id_Empresa" = $2';
    EXECUTE 'PREPARE q5_stock_lock AS SELECT "Stock_Actual" FROM material WHERE "Id_Material" = $1 AND "Id_Empresa" = $2 FOR UPDATE';
    EXECUTE 'PREPARE q5_insert AS INSERT INTO orden_material ("Id_Orden", "Id_Producto", "Cantidad", "Id_Empresa") VALUES ($1, $2, $3, $4)';
    EXECUTE 'PREPARE q5_stock_sub AS UPDATE material SET "Stock_Actual" = "Stock_Actual" - $1 WHERE "Id_Material" = $2 AND "Id_Empresa" = $3';
    EXECUTE 'PREPARE q5_move_post AS INSERT INTO material_movimiento ("Id_Material", "Tipo", "Cantidad", "Id_Orden", "Nota", "Id_Empresa") VALUES ($1, ''Salida'', $2, $3, ''Consumo al asignar material a la orden'', $4)';
    EXECUTE 'PREPARE q5_get AS SELECT "Cantidad" AS "Cantidad_Usada" FROM orden_material WHERE "Id_Orden" = $1 AND "Id_Producto" = $2 AND "Id_Empresa" = $3 FOR UPDATE';
    EXECUTE 'PREPARE q5_update AS UPDATE orden_material SET "Cantidad" = $1 WHERE "Id_Orden" = $2 AND "Id_Producto" = $3 AND "Id_Empresa" = $4';
    EXECUTE 'PREPARE q5_stock_adddelta AS UPDATE material SET "Stock_Actual" = "Stock_Actual" - $1 WHERE "Id_Material" = $2 AND "Id_Empresa" = $3';
    EXECUTE 'PREPARE q5_move_put AS INSERT INTO material_movimiento ("Id_Material", "Tipo", "Cantidad", "Id_Orden", "Nota", "Id_Empresa") VALUES ($1, $2, $3, $4, ''Ajuste de cantidad usada en la orden'', $5)';
    EXECUTE 'PREPARE q5_delete AS DELETE FROM orden_material WHERE "Id_Orden" = $1 AND "Id_Producto" = $2 AND "Id_Empresa" = $3 RETURNING "Cantidad" AS "Cantidad_Usada"';
    EXECUTE 'PREPARE q5_stock_refund AS UPDATE material SET "Stock_Actual" = "Stock_Actual" + $1 WHERE "Id_Material" = $2 AND "Id_Empresa" = $3';
    EXECUTE 'PREPARE q5_move_delete AS INSERT INTO material_movimiento ("Id_Material", "Tipo", "Cantidad", "Id_Orden", "Nota", "Id_Empresa") VALUES ($1, ''Entrada'', $2, $3, ''Devolución al quitar el material de la orden'', $4)';

    -- NULL en búsquedas/UPDATE sin coincidencia comprueba inferencia sin violar NOT NULL.
    EXECUTE format('EXECUTE q5_list(NULL,%s)', a);
    EXECUTE format('EXECUTE q5_stock_lock(NULL,%s)', a) INTO n;
    EXECUTE format('EXECUTE q5_get(NULL,%s,%s)', ma, a) INTO old_qty;
    EXECUTE format('EXECUTE q5_update(NULL,NULL,%s,%s)', ma, a);
    EXECUTE format('EXECUTE q5_delete(NULL,%s,%s)', ma, a) INTO old_qty;

    BEGIN
      EXECUTE format('EXECUTE q5_list(%s,%s)', oa, a);
      EXECUTE format('EXECUTE q5_stock_lock(%s,%s)', ma, a) INTO n;
      EXECUTE format('EXECUTE q5_insert(%s,%s,1,%s)', oa, ma, a);
      EXECUTE format('EXECUTE q5_stock_sub(1,%s,%s)', ma, a);
      EXECUTE format('EXECUTE q5_move_post(%s,-1,%s,%s)', ma, oa, a);
      EXECUTE format('EXECUTE q5_get(%s,%s,%s)', oa, ma, a) INTO old_qty;
      EXECUTE format('EXECUTE q5_stock_lock(%s,%s)', ma, a) INTO n;
      new_qty := old_qty + 1;
      EXECUTE format('EXECUTE q5_update(%s,%s,%s,%s)', new_qty, oa, ma, a);
      EXECUTE format('EXECUTE q5_stock_adddelta(1,%s,%s)', ma, a);
      EXECUTE format('EXECUTE q5_move_put(%s,%L,-1,%s,%s)', ma, 'Salida', oa, a);
      EXECUTE format('EXECUTE q5_delete(%s,%s,%s)', oa, ma, a) INTO old_qty;
      EXECUTE format('EXECUTE q5_stock_refund(%s,%s,%s)', old_qty, ma, a);
      EXECUTE format('EXECUTE q5_move_delete(%s,%s,%s,%s)', ma, old_qty, oa, a);
      RAISE EXCEPTION 'Q5 rollback fixtures';
    EXCEPTION WHEN raise_exception THEN
      IF SQLERRM <> 'Q5 rollback fixtures' THEN RAISE; END IF;
    END;
    RAISE NOTICE 'Q5 OK';
  END IF;
END
$q5$;

DO $q6$
DECLARE db_name text := current_database(); a integer; b integer; ma integer; mb integer; oa integer; ob integer; n integer;
BEGIN
  IF db_name ~* '(^|_)q6(_|$)' THEN
    SELECT "Id_Empresa" INTO a FROM public.empresa WHERE "Slug" = 'om73-a-' || db_name;
    SELECT "Id_Empresa" INTO b FROM public.empresa WHERE "Slug" = 'om73-b-' || db_name;
    SELECT "Id_Material" INTO ma FROM public.material WHERE "Nombre_Material" = 'OM73 material A ' || db_name;
    SELECT "Id_Material" INTO mb FROM public.material WHERE "Nombre_Material" = 'OM73 material B ' || db_name;
    SELECT "Id_Orden" INTO oa FROM public.orden_produccion WHERE "Descripcion" = 'OM73 orden A' AND "Id_Empresa" = a;
    SELECT "Id_Orden" INTO ob FROM public.orden_produccion WHERE "Descripcion" = 'OM73 orden B' AND "Id_Empresa" = b;
    INSERT INTO public.orden_material ("Id_Orden", "Id_Producto", "Cantidad", "Id_Empresa") VALUES (oa, ma, 1, a), (ob, mb, 1, b);
    SELECT count(*) INTO n FROM orden_material om INNER JOIN material m ON om."Id_Producto" = m."Id_Material" AND m."Id_Empresa" = om."Id_Empresa" WHERE om."Id_Orden" IN (oa, ob);
    IF n <> 2 THEN RAISE EXCEPTION 'Q6 control sin filtro devolvió %, esperado 2', n; END IF;
    RAISE NOTICE 'Q6 OK';
  END IF;
END
$q6$;

DO $q7$
DECLARE db_name text := current_database(); a integer; b integer; ma integer; oa integer; stock_before numeric; stock_after numeric; alloc_before integer; alloc_after integer; moves_before integer; moves_after integer; state text;
BEGIN
  IF db_name ~* '(^|_)q7(_|$)' THEN
    SELECT "Id_Empresa" INTO a FROM public.empresa WHERE "Slug" = 'om73-a-' || db_name;
    SELECT "Id_Empresa" INTO b FROM public.empresa WHERE "Slug" = 'om73-b-' || db_name;
    SELECT "Id_Material" INTO ma FROM public.material WHERE "Nombre_Material" = 'OM73 material A ' || db_name;
    SELECT "Id_Orden" INTO oa FROM public.orden_produccion WHERE "Descripcion" = 'OM73 orden A' AND "Id_Empresa" = a;

    -- Recorrido de éxito de POST: todos los pasos están dentro de la transacción DO.
    PERFORM 1 FROM public.material WHERE "Id_Material" = ma AND "Id_Empresa" = a FOR UPDATE;
    INSERT INTO public.orden_material ("Id_Orden", "Id_Producto", "Cantidad", "Id_Empresa") VALUES (oa, ma, 2, a);
    UPDATE public.material SET "Stock_Actual" = "Stock_Actual" - 2 WHERE "Id_Material" = ma AND "Id_Empresa" = a;
    INSERT INTO public.material_movimiento ("Id_Material", "Tipo", "Cantidad", "Id_Orden", "Nota", "Id_Empresa") VALUES (ma, 'Salida', -2, oa, 'Consumo al asignar material a la orden', a);
    SELECT "Stock_Actual" INTO stock_after FROM public.material WHERE "Id_Material" = ma AND "Id_Empresa" = a;
    SELECT count(*) INTO alloc_after FROM public.orden_material WHERE "Id_Orden" = oa AND "Id_Producto" = ma AND "Id_Empresa" = a;
    SELECT count(*) INTO moves_after FROM public.material_movimiento WHERE "Id_Orden" = oa AND "Id_Material" = ma AND "Id_Empresa" = a;
    IF stock_after <> 8 OR alloc_after <> 1 OR moves_after <> 1 THEN RAISE EXCEPTION 'Q7 éxito inconsistente: stock %, asignaciones %, movimientos %', stock_after, alloc_after, moves_after; END IF;

    stock_before := stock_after; alloc_before := alloc_after; moves_before := moves_after;
    BEGIN
      INSERT INTO public.orden_material ("Id_Orden", "Id_Producto", "Cantidad", "Id_Empresa") VALUES (oa, ma, 1, a);
      UPDATE public.material SET "Stock_Actual" = "Stock_Actual" - 1 WHERE "Id_Material" = ma AND "Id_Empresa" = a;
      -- Empresa B contradice las claves compuestas y fuerza un error tras los dos cambios previos.
      INSERT INTO public.material_movimiento ("Id_Material", "Tipo", "Cantidad", "Id_Orden", "Nota", "Id_Empresa") VALUES (ma, 'Salida', -1, oa, 'Fallo simulado a mitad', b);
      RAISE EXCEPTION 'Q7: se esperaba FK 23503';
    EXCEPTION WHEN foreign_key_violation THEN
      GET STACKED DIAGNOSTICS state = RETURNED_SQLSTATE;
      IF state <> '23503' THEN RAISE; END IF;
    END;
    SELECT "Stock_Actual" INTO stock_after FROM public.material WHERE "Id_Material" = ma AND "Id_Empresa" = a;
    SELECT count(*) INTO alloc_after FROM public.orden_material WHERE "Id_Orden" = oa AND "Id_Producto" = ma AND "Id_Empresa" = a;
    SELECT count(*) INTO moves_after FROM public.material_movimiento WHERE "Id_Orden" = oa AND "Id_Material" = ma AND "Id_Empresa" = a;
    IF stock_after <> stock_before OR alloc_after <> alloc_before OR moves_after <> moves_before THEN
      RAISE EXCEPTION 'Q7 error parcial no revirtió: stock %/%, asignaciones %/%, movimientos %/%', stock_before, stock_after, alloc_before, alloc_after, moves_before, moves_after;
    END IF;
    RAISE NOTICE 'Q7 OK';
  END IF;
END
$q7$;
