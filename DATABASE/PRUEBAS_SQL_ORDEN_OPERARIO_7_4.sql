-- Fixtures sintéticos y casos Q1–Q8 de Fase 7.4.
-- Ejecutar exclusivamente en clones desechables texticode_migrada.
-- El llamador identifica cada caso y conserva el código de salida de psql.

DO $$
DECLARE
  suffix text := current_database();
  empresa_a integer;
  empresa_b integer;
  rol_id integer;
  op_a integer;
  op_b integer;
  user_a integer;
  user_b integer;
  material_a integer;
  material_b integer;
  orden_a integer;
  orden_b integer;
BEGIN
  SELECT "Id_Rol" INTO rol_id FROM public.rol ORDER BY "Id_Rol" LIMIT 1;
  IF rol_id IS NULL THEN RAISE EXCEPTION 'fixture: no hay roles'; END IF;
  INSERT INTO public.empresa ("Nombre_Empresa", "Slug") VALUES ('QA 7.4 A '||suffix, 'qa74-a-'||suffix) RETURNING "Id_Empresa" INTO empresa_a;
  INSERT INTO public.empresa ("Nombre_Empresa", "Slug") VALUES ('QA 7.4 B '||suffix, 'qa74-b-'||suffix) RETURNING "Id_Empresa" INTO empresa_b;
  INSERT INTO public.usuario ("Nombre_Completo","Nombre_Usuario","Correo","Contrasena","Id_Rol") VALUES ('QA OP A','qa74opa_'||suffix,'qa74opa_'||suffix||'@invalid.test','synthetic-only',rol_id) RETURNING "Id_Usuario" INTO op_a;
  INSERT INTO public.usuario ("Nombre_Completo","Nombre_Usuario","Correo","Contrasena","Id_Rol") VALUES ('QA OP B','qa74opb_'||suffix,'qa74opb_'||suffix||'@invalid.test','synthetic-only',rol_id) RETURNING "Id_Usuario" INTO op_b;
  INSERT INTO public.usuario ("Nombre_Completo","Nombre_Usuario","Correo","Contrasena","Id_Rol") VALUES ('QA U A','qa74ua_'||suffix,'qa74ua_'||suffix||'@invalid.test','synthetic-only',rol_id) RETURNING "Id_Usuario" INTO user_a;
  INSERT INTO public.usuario ("Nombre_Completo","Nombre_Usuario","Correo","Contrasena","Id_Rol") VALUES ('QA U B','qa74ub_'||suffix,'qa74ub_'||suffix||'@invalid.test','synthetic-only',rol_id) RETURNING "Id_Usuario" INTO user_b;
  INSERT INTO public.usuario_empresa ("Id_Usuario","Id_Empresa","Id_Rol","Estado") VALUES (op_a,empresa_a,rol_id,'activo'),(op_b,empresa_b,rol_id,'activo'),(user_a,empresa_a,rol_id,'activo'),(user_b,empresa_b,rol_id,'activo');
  INSERT INTO public.material ("Nombre_Material","Categoria","Unidad","Id_Cliente","Id_Empresa") VALUES ('QA material A '||suffix,'QA','u',user_a,empresa_a) RETURNING "Id_Material" INTO material_a;
  INSERT INTO public.material ("Nombre_Material","Categoria","Unidad","Id_Cliente","Id_Empresa") VALUES ('QA material B '||suffix,'QA','u',user_b,empresa_b) RETURNING "Id_Material" INTO material_b;
  INSERT INTO public.orden_produccion ("Id_Cliente","Id_Material","Descripcion","Cantidad","Fecha_Limite","Id_Empresa") VALUES (user_a,material_a,'QA 7.4 A',1,CURRENT_DATE,empresa_a) RETURNING "Id_Orden" INTO orden_a;
  INSERT INTO public.orden_produccion ("Id_Cliente","Id_Material","Descripcion","Cantidad","Fecha_Limite","Id_Empresa") VALUES (user_b,material_b,'QA 7.4 B',1,CURRENT_DATE,empresa_b) RETURNING "Id_Orden" INTO orden_b;
  INSERT INTO public.orden_operario ("Id_Orden","Id_Operario","Numero_Fase","Id_Empresa") VALUES (orden_a,op_a,1,empresa_a),(orden_b,op_b,1,empresa_b);
  INSERT INTO public.usuario_orden ("Id_Usuario","Id_Orden","Id_Empresa") VALUES (user_a,orden_a,empresa_a),(user_b,orden_b,empresa_b);
END $$;

DO $$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n FROM public.orden_operario WHERE "Id_Empresa"=(SELECT "Id_Empresa" FROM public.empresa WHERE "Slug"='qa74-a-'||current_database()) AND "Id_Empresa"<>(SELECT "Id_Empresa" FROM public.empresa WHERE "Slug"='qa74-b-'||current_database());
  IF n<>1 THEN RAISE EXCEPTION 'Q1 A list count %, expected 1',n; END IF;
  SELECT count(*) INTO n FROM public.orden_operario WHERE "Id_Empresa"=(SELECT "Id_Empresa" FROM public.empresa WHERE "Slug"='qa74-b-'||current_database()) AND "Id_Empresa"<>(SELECT "Id_Empresa" FROM public.empresa WHERE "Slug"='qa74-a-'||current_database());
  IF n<>1 THEN RAISE EXCEPTION 'Q1 B list count %, expected 1',n; END IF;
  RAISE NOTICE 'Q1 OK';
END $$;

DO $$
DECLARE ea integer; eb integer; idb integer; n integer;
BEGIN
  SELECT "Id_Empresa" INTO ea FROM public.empresa WHERE "Slug"='qa74-a-'||current_database();
  SELECT "Id_Empresa" INTO eb FROM public.empresa WHERE "Slug"='qa74-b-'||current_database();
  SELECT "Id_Orden_Operario" INTO idb FROM public.orden_operario WHERE "Id_Empresa"=eb;
  UPDATE public.orden_operario SET "Numero_Fase"=2 WHERE "Id_Orden_Operario"=idb AND "Id_Empresa"=ea;
  GET DIAGNOSTICS n=ROW_COUNT;
  IF n<>0 THEN RAISE EXCEPTION 'Q2 UPDATE affected %',n; END IF;
  DELETE FROM public.orden_operario WHERE "Id_Orden_Operario"=idb AND "Id_Empresa"=ea;
  GET DIAGNOSTICS n=ROW_COUNT;
  IF n<>0 THEN RAISE EXCEPTION 'Q2 DELETE affected %',n; END IF;
  RAISE NOTICE 'Q2 OK';
END $$;

DO $$
DECLARE ea integer; oa integer; ob integer; opb integer; caught text;
BEGIN
  SELECT "Id_Empresa" INTO ea FROM public.empresa WHERE "Slug"='qa74-a-'||current_database();
  SELECT "Id_Orden" INTO oa FROM public.orden_produccion WHERE "Id_Empresa"=ea;
  SELECT "Id_Orden" INTO ob FROM public.orden_produccion WHERE "Id_Empresa"<>ea;
  SELECT "Id_Operario" INTO opb FROM public.orden_operario WHERE "Id_Empresa"<>ea;
  BEGIN INSERT INTO public.orden_operario ("Id_Orden","Id_Operario","Numero_Fase","Id_Empresa") VALUES (oa,opb,77,ea); EXCEPTION WHEN foreign_key_violation THEN GET STACKED DIAGNOSTICS caught=RETURNED_SQLSTATE; END;
  IF caught IS DISTINCT FROM '23503' THEN RAISE EXCEPTION 'Q3 SQLSTATE %, expected 23503',caught; END IF;
  RAISE NOTICE 'Q3 OK';
END $$;

DO $$
DECLARE ea integer; oa integer; ob integer; opa integer; caught text;
BEGIN
  SELECT "Id_Empresa" INTO ea FROM public.empresa WHERE "Slug"='qa74-a-'||current_database();
  SELECT "Id_Orden" INTO oa FROM public.orden_produccion WHERE "Id_Empresa"=ea;
  SELECT "Id_Orden" INTO ob FROM public.orden_produccion WHERE "Id_Empresa"<>ea;
  SELECT "Id_Operario" INTO opa FROM public.orden_operario WHERE "Id_Empresa"=ea;
  BEGIN INSERT INTO public.orden_operario ("Id_Orden","Id_Operario","Numero_Fase","Id_Empresa") VALUES (ob,opa,78,ea); EXCEPTION WHEN foreign_key_violation THEN GET STACKED DIAGNOSTICS caught=RETURNED_SQLSTATE; END;
  IF caught IS DISTINCT FROM '23503' THEN RAISE EXCEPTION 'Q4 SQLSTATE %, expected 23503',caught; END IF;
  RAISE NOTICE 'Q4 OK';
END $$;

DO $$
DECLARE ea integer; oa integer; ub integer; caught text;
BEGIN
  SELECT "Id_Empresa" INTO ea FROM public.empresa WHERE "Slug"='qa74-a-'||current_database();
  SELECT "Id_Orden" INTO oa FROM public.orden_produccion WHERE "Id_Empresa"=ea;
  SELECT "Id_Usuario" INTO ub FROM public.usuario_orden WHERE "Id_Empresa"<>ea;
  BEGIN INSERT INTO public.usuario_orden ("Id_Usuario","Id_Orden","Id_Empresa") VALUES (ub,oa,ea); EXCEPTION WHEN foreign_key_violation THEN GET STACKED DIAGNOSTICS caught=RETURNED_SQLSTATE; END;
  IF caught IS DISTINCT FROM '23503' THEN RAISE EXCEPTION 'Q5 SQLSTATE %, expected 23503',caught; END IF;
  RAISE NOTICE 'Q5 OK';
END $$;

DO $$
DECLARE eb integer; ub integer; ob integer; n integer;
BEGIN
  SELECT "Id_Empresa" INTO eb FROM public.empresa WHERE "Slug"='qa74-b-'||current_database();
  SELECT "Id_Usuario" INTO ub FROM public.usuario_orden WHERE "Id_Empresa"=eb;
  SELECT "Id_Orden" INTO ob FROM public.usuario_orden WHERE "Id_Empresa"=eb;
  UPDATE public.usuario_empresa SET "Estado"='inactivo' WHERE "Id_Usuario"=ub AND "Id_Empresa"=eb;
  INSERT INTO public.usuario_orden ("Id_Usuario","Id_Orden","Id_Empresa") VALUES (ub,ob,eb);
  GET DIAGNOSTICS n=ROW_COUNT;
  IF n<>1 THEN RAISE EXCEPTION 'Q6 insert count %, expected 1',n; END IF;
  RAISE NOTICE 'Q6 OK: membership inactive accepted';
END $$;

DO $$
BEGIN
  -- Q7: probar por PREPARE las sentencias SQL parametrizadas que emplean los routers.
  -- PostgreSQL resuelve el análisis al preparar; NULL queda con tipos inferidos por el esquema.
  EXECUTE 'PREPARE q74_oo_select AS SELECT oo.*, u."Nombre_Completo" AS "Nombre_Operario" FROM orden_operario oo INNER JOIN usuario u ON oo."Id_Operario"=u."Id_Usuario" INNER JOIN usuario_empresa ue ON ue."Id_Usuario"=u."Id_Usuario" AND ue."Id_Empresa"=oo."Id_Empresa" WHERE oo."Id_Orden"=$1 AND oo."Id_Empresa"=$2';
  EXECUTE 'DEALLOCATE q74_oo_select';
  EXECUTE 'PREPARE q74_oo_insert AS INSERT INTO orden_operario ("Id_Orden","Id_Operario","Numero_Fase","Descripcion_Fase","Id_Empresa") VALUES ($1,$2,$3,$4,$5)';
  EXECUTE 'DEALLOCATE q74_oo_insert';
  EXECUTE 'PREPARE q74_uo_insert AS INSERT INTO usuario_orden ("Id_Usuario","Id_Orden","Funcion","Id_Empresa") VALUES ($1,$2,$3,$4)';
  EXECUTE 'DEALLOCATE q74_uo_insert';
  RAISE NOTICE 'Q7 OK';
END $$;

DO $$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n FROM public.orden_operario oo JOIN public.orden_produccion op ON op."Id_Orden"=oo."Id_Orden" WHERE oo."Id_Empresa" IN (SELECT "Id_Empresa" FROM public.empresa WHERE "Slug" IN ('qa74-a-'||current_database(),'qa74-b-'||current_database()));
  IF n<2 THEN RAISE EXCEPTION 'Q8 unscoped control count %, expected >=2',n; END IF;
  RAISE NOTICE 'Q8 OK: count %',n;
END $$;
