-- Se ejecuta una vez por clon cuyo nombre termine en _q1_<id> ... _q6_<id>.
-- Sin metacomandos psql. Cada bloque valida su propio caso y falla de forma explícita.
DO $fase71$
DECLARE
  db_name text := current_database();
  company_a integer;
  company_b integer;
  material_a integer;
  material_b integer;
  material_new integer;
  name_a text;
  name_b text;
  row_item record;
  previous_stock numeric;
  affected integer;
  count_a integer := 0;
  count_b integer := 0;
  observed_state text;
BEGIN
  INSERT INTO empresa ("Nombre_Empresa", "Slug")
  VALUES ('Fixture A', 'f71-a-' || md5(random()::text))
  RETURNING "Id_Empresa" INTO company_a;
  INSERT INTO empresa ("Nombre_Empresa", "Slug")
  VALUES ('Fixture B', 'f71-b-' || md5(random()::text))
  RETURNING "Id_Empresa" INTO company_b;

  name_a := 'Fixture A ' || db_name;
  name_b := 'Fixture B ' || db_name;
  INSERT INTO material ("Nombre_Material", "Categoria", "Stock_Actual", "Unidad", "Id_Empresa")
  VALUES (name_a, 'Prueba', 2, 'u', company_a)
  RETURNING "Id_Material" INTO material_a;
  INSERT INTO material ("Nombre_Material", "Categoria", "Stock_Actual", "Unidad", "Id_Empresa")
  VALUES (name_b, 'Prueba', 3, 'u', company_b)
  RETURNING "Id_Material" INTO material_b;
  INSERT INTO material_movimiento ("Id_Material", "Tipo", "Cantidad", "Nota", "Id_Empresa")
  VALUES (material_a, 'Creacion', 2, 'Fixture A', company_a);
  INSERT INTO material_movimiento ("Id_Material", "Tipo", "Cantidad", "Nota", "Id_Empresa")
  VALUES (material_b, 'Creacion', 3, 'Fixture B', company_b);

  IF db_name LIKE '%_q1_%' THEN
    FOR row_item IN EXECUTE 'SELECT m.*,
             u."Nombre_Completo" AS "Nombre_Cliente"
      FROM material m
      LEFT JOIN usuario u ON m."Id_Cliente" = u."Id_Usuario"
      WHERE m."Activo" = true AND m."Id_Empresa" = $1
      ORDER BY m."Nombre_Material"' USING company_a LOOP
      IF row_item."Id_Empresa" <> company_a THEN RAISE EXCEPTION 'Q1 devolvió fila de otra empresa en A'; END IF;
      count_a := count_a + 1;
    END LOOP;
    FOR row_item IN EXECUTE 'SELECT m.*,
             u."Nombre_Completo" AS "Nombre_Cliente"
      FROM material m
      LEFT JOIN usuario u ON m."Id_Cliente" = u."Id_Usuario"
      WHERE m."Activo" = true AND m."Id_Empresa" = $1
      ORDER BY m."Nombre_Material"' USING company_b LOOP
      IF row_item."Id_Empresa" <> company_b THEN RAISE EXCEPTION 'Q1 devolvió fila de otra empresa en B'; END IF;
      count_b := count_b + 1;
    END LOOP;
    IF count_a <> 1 OR count_b <> 1 THEN RAISE EXCEPTION 'Q1 conteos inesperados A=%, B=%', count_a, count_b; END IF;
    RAISE NOTICE 'Q1 OK A=% B=%', count_a, count_b;

  ELSIF db_name LIKE '%_q2_%' THEN
    EXECUTE 'SELECT m.*,
             u."Nombre_Completo" AS "Nombre_Cliente"
      FROM material m
      LEFT JOIN usuario u ON m."Id_Cliente" = u."Id_Usuario"
      WHERE m."Id_Material" = $1 AND m."Id_Empresa" = $2' INTO row_item USING material_b, company_a;
    GET DIAGNOSTICS affected = ROW_COUNT;
    IF affected <> 0 THEN RAISE EXCEPTION 'Q2 GET devolvió % filas de B a A', affected; END IF;
    EXECUTE 'SELECT "Stock_Actual" FROM material
      WHERE "Id_Material" = $1 AND "Id_Empresa" = $2 FOR UPDATE' INTO row_item USING material_b, company_a;
    EXECUTE 'UPDATE material
      SET "Nombre_Material" = $1,
          "Categoria" = $2,
          "Stock_Actual" = $3,
          "Unidad" = $4,
          "Stock_Minimo" = $5,
          "Stock_Maximo" = $6,
          "Id_Cliente" = $7
      WHERE "Id_Material" = $8 AND "Id_Empresa" = $9'
      USING 'No debe cambiar', 'Prueba', 0, 'u', 0, 0, NULL::integer, material_b, company_a;
    GET DIAGNOSTICS affected = ROW_COUNT;
    IF affected <> 0 THEN RAISE EXCEPTION 'Q2 PUT afectó % filas', affected; END IF;
    EXECUTE 'SELECT "Stock_Actual" FROM material
      WHERE "Id_Material" = $1 AND "Activo" = true AND "Id_Empresa" = $2 FOR UPDATE'
      INTO row_item USING material_b, company_a;
    GET DIAGNOSTICS affected = ROW_COUNT;
    IF affected <> 0 THEN RAISE EXCEPTION 'Q2 DELETE encontró % filas de otra empresa', affected; END IF;
    EXECUTE 'UPDATE material SET "Activo" = false, "Stock_Actual" = 0
      WHERE "Id_Material" = $1 AND "Id_Empresa" = $2' USING material_b, company_a;
    GET DIAGNOSTICS affected = ROW_COUNT;
    IF affected <> 0 THEN RAISE EXCEPTION 'Q2 DELETE afectó % filas', affected; END IF;
    RAISE NOTICE 'Q2 OK GET=0 PUT=0 DELETE=0';

  ELSIF db_name LIKE '%_q3_%' THEN
    BEGIN
      EXECUTE 'INSERT INTO material_movimiento ("Id_Material", "Tipo", "Cantidad", "Nota", "Id_Empresa")
        VALUES ($1, $2, $3, $4, $5)'
        USING material_b, 'Entrada', 1, 'Q3 movimiento cruzado', company_a;
      RAISE EXCEPTION 'Q3 INSERT cruzado fue aceptado';
    EXCEPTION WHEN foreign_key_violation THEN
      GET STACKED DIAGNOSTICS observed_state = RETURNED_SQLSTATE;
      IF observed_state <> '23503' THEN RAISE EXCEPTION 'Q3 SQLSTATE inesperado: %', observed_state; END IF;
    END;
    RAISE NOTICE 'Q3 OK SQLSTATE=23503';

  ELSIF db_name LIKE '%_q4_%' THEN
    BEGIN
      EXECUTE 'INSERT INTO material ("Nombre_Material", "Categoria", "Stock_Actual", "Unidad", "Stock_Minimo", "Stock_Maximo", "Id_Cliente", "Id_Empresa")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)'
        USING name_a, 'Prueba', 0, 'u', 0, 0, NULL::integer, company_a;
      RAISE EXCEPTION 'Q4 duplicate same-company was accepted';
    EXCEPTION WHEN unique_violation THEN
      GET STACKED DIAGNOSTICS observed_state = RETURNED_SQLSTATE;
      IF observed_state <> '23505' THEN RAISE EXCEPTION 'Q4 SQLSTATE inesperado: %', observed_state; END IF;
    END;
    EXECUTE 'INSERT INTO material ("Nombre_Material", "Categoria", "Stock_Actual", "Unidad", "Stock_Minimo", "Stock_Maximo", "Id_Cliente", "Id_Empresa")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)'
      USING name_a, 'Prueba', 0, 'u', 0, 0, NULL::integer, company_b;
    RAISE NOTICE 'Q4 OK same-company=23505 other-company=inserted';

  ELSIF db_name LIKE '%_q5_%' THEN
    FOR row_item IN EXECUTE 'SELECT m.*,
             u."Nombre_Completo" AS "Nombre_Cliente"
      FROM material m
      LEFT JOIN usuario u ON m."Id_Cliente" = u."Id_Usuario"
      WHERE m."Activo" = true AND m."Id_Empresa" = $1
      ORDER BY m."Nombre_Material"' USING company_a LOOP NULL; END LOOP;
    FOR row_item IN EXECUTE 'SELECT m."Id_Material", m."Nombre_Material", m."Categoria", m."Unidad",
        m."Stock_Minimo", m."Stock_Maximo",
        u."Nombre_Completo" AS "Nombre_Cliente",
        SUM(mv."Cantidad") AS "Stock_Actual"
      FROM material m
      INNER JOIN material_movimiento mv
        ON mv."Id_Material" = m."Id_Material"
       AND mv."Fecha" < (date_trunc(''month'', $1::date) + interval ''1 month'')
       AND mv."Id_Empresa" = m."Id_Empresa"
      LEFT JOIN usuario u ON m."Id_Cliente" = u."Id_Usuario"
      WHERE m."Id_Empresa" = $2
      GROUP BY m."Id_Material", u."Nombre_Completo"
      ORDER BY m."Nombre_Material"' USING DATE '2026-10-01', company_a LOOP NULL; END LOOP;
    FOR row_item IN EXECUTE 'SELECT m.*,
             u."Nombre_Completo" AS "Nombre_Cliente"
      FROM material m
      LEFT JOIN usuario u ON m."Id_Cliente" = u."Id_Usuario"
      WHERE m."Activo" = true AND m."Id_Cliente" = $1 AND m."Id_Empresa" = $2
      ORDER BY m."Nombre_Material"' USING 999999, company_a LOOP NULL; END LOOP;
    FOR row_item IN EXECUTE 'SELECT m.*,
             u."Nombre_Completo" AS "Nombre_Cliente"
      FROM material m
      LEFT JOIN usuario u ON m."Id_Cliente" = u."Id_Usuario"
      WHERE m."Activo" = true AND m."Stock_Actual" <= m."Stock_Minimo" AND m."Id_Empresa" = $1
      ORDER BY m."Stock_Actual" ASC' USING company_a LOOP NULL; END LOOP;
    EXECUTE 'SELECT m.*,
             u."Nombre_Completo" AS "Nombre_Cliente"
      FROM material m
      LEFT JOIN usuario u ON m."Id_Cliente" = u."Id_Usuario"
      WHERE m."Id_Material" = $1 AND m."Id_Empresa" = $2' INTO row_item USING material_a, company_a;
    GET DIAGNOSTICS affected = ROW_COUNT;
    IF affected <> 1 THEN RAISE EXCEPTION 'Q5 GET devolvió % filas, se esperaba una', affected; END IF;
    FOR row_item IN EXECUTE 'SELECT * FROM material_movimiento
      WHERE "Id_Material" = $1 AND "Id_Empresa" = $2
      ORDER BY "Fecha" DESC' USING material_a, company_a LOOP NULL; END LOOP;

    EXECUTE 'INSERT INTO material ("Nombre_Material", "Categoria", "Stock_Actual", "Unidad", "Stock_Minimo", "Stock_Maximo", "Id_Cliente", "Id_Empresa")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING "Id_Material"'
      INTO material_new USING 'Q5 Nuevo ' || db_name, 'Prueba', 1, 'u', 0, 5, NULL::integer, company_a;
    EXECUTE 'INSERT INTO material_movimiento ("Id_Material", "Tipo", "Cantidad", "Nota", "Id_Empresa")
      VALUES ($1, ''Creacion'', $2, ''Saldo inicial al crear el material'', $3)'
      USING material_new, 1, company_a;

    EXECUTE 'SELECT "Stock_Actual" FROM material WHERE "Id_Material" = $1 AND "Id_Empresa" = $2 FOR UPDATE'
      INTO previous_stock USING material_new, company_a;
    EXECUTE 'UPDATE material
      SET "Nombre_Material" = $1,
          "Categoria"       = $2,
          "Stock_Actual"    = $3,
          "Unidad"          = $4,
          "Stock_Minimo"    = $5,
          "Stock_Maximo"    = $6,
          "Id_Cliente"      = $7
      WHERE "Id_Material" = $8 AND "Id_Empresa" = $9'
      USING 'Q5 Editado ' || db_name, 'Prueba', 2, 'u', 0, 5, NULL::integer, material_new, company_a;
    EXECUTE 'INSERT INTO material_movimiento ("Id_Material", "Tipo", "Cantidad", "Nota", "Id_Empresa")
      VALUES ($1, $2, $3, $4, $5)'
      USING material_new, 'Entrada', 2 - previous_stock, 'Ajuste de stock (edición manual o consumo en una orden)', company_a;

    EXECUTE 'SELECT "Stock_Actual" FROM material WHERE "Id_Material" = $1 AND "Activo" = true AND "Id_Empresa" = $2 FOR UPDATE'
      INTO previous_stock USING material_new, company_a;
    EXECUTE 'UPDATE material SET "Activo" = false, "Stock_Actual" = 0 WHERE "Id_Material" = $1 AND "Id_Empresa" = $2'
      USING material_new, company_a;
    EXECUTE 'INSERT INTO material_movimiento ("Id_Material", "Tipo", "Cantidad", "Nota", "Id_Empresa")
      VALUES ($1, ''Salida'', $2, ''Baja del material (eliminado desde Gestión de Inventario)'', $3)'
      USING material_new, -previous_stock, company_a;
    RAISE NOTICE 'Q5 OK all router statements executed';

  ELSIF db_name LIKE '%_q6_%' THEN
    FOR row_item IN EXECUTE 'SELECT m.*,
             u."Nombre_Completo" AS "Nombre_Cliente"
      FROM material m
      LEFT JOIN usuario u ON m."Id_Cliente" = u."Id_Usuario"
      WHERE m."Activo" = true AND m."Nombre_Material" IN ($1, $2)
      ORDER BY m."Nombre_Material"' USING name_a, name_b LOOP
      count_a := count_a + 1;
    END LOOP;
    IF count_a <> 2 THEN RAISE EXCEPTION 'Q6 debía observar ambas empresas; conteo=%', count_a; END IF;
    RAISE NOTICE 'Q6 OK unfiltered_rows=%', count_a;

  ELSE
    RAISE EXCEPTION 'Nombre de clon no identifica exactamente un caso Q1–Q6: %', db_name;
  END IF;
END
$fase71$;
