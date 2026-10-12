-- Validación manual de las consultas exactas de BACKEND/routes/materiales.js.
-- Ejecutar este archivo una vez por clon (un clon exclusivo para cada Q1..Q5)
-- con -v q1=on -v q2=off -v q3=off -v q4=off -v q5=off (activar solo una).
-- Requiere psql conectado al clúster desechable 127.0.0.1:5433.
\set ON_ERROR_STOP on

INSERT INTO empresa ("Nombre_Empresa", "Slug") VALUES ('Fixture A', 'fixture-a-' || md5(random()::text)) RETURNING "Id_Empresa" AS empresa_a \gset
INSERT INTO empresa ("Nombre_Empresa", "Slug") VALUES ('Fixture B', 'fixture-b-' || md5(random()::text)) RETURNING "Id_Empresa" AS empresa_b \gset
INSERT INTO material ("Nombre_Material", "Categoria", "Unidad", "Id_Empresa") VALUES ('Fixture Q', 'Prueba', 'u', :empresa_a) RETURNING "Id_Material" AS material_a \gset
INSERT INTO material ("Nombre_Material", "Categoria", "Unidad", "Id_Empresa") VALUES ('Fixture Q', 'Prueba', 'u', :empresa_b) RETURNING "Id_Material" AS material_b \gset

\if :q1
-- Q1: cadena de GET / (respuesta con datos sintéticos A/B).
SELECT m.*,
       u."Nombre_Completo" AS "Nombre_Cliente"
FROM material m
LEFT JOIN usuario u ON m."Id_Cliente" = u."Id_Usuario"
WHERE m."Activo" = true AND m."Id_Empresa" = :empresa_a
ORDER BY m."Nombre_Material";
SELECT m.*,
       u."Nombre_Completo" AS "Nombre_Cliente"
FROM material m
LEFT JOIN usuario u ON m."Id_Cliente" = u."Id_Usuario"
WHERE m."Activo" = true AND m."Id_Empresa" = :empresa_b
ORDER BY m."Nombre_Material";
\endif

\if :q2
-- Q2: cadenas de GET, PUT y DELETE lógico bajo empresa A contra ID de B.
SELECT m.*, u."Nombre_Completo" AS "Nombre_Cliente"
FROM material m LEFT JOIN usuario u ON m."Id_Cliente" = u."Id_Usuario"
WHERE m."Id_Material" = :material_b AND m."Id_Empresa" = :empresa_a;
UPDATE material SET "Nombre_Material" = 'No debe cambiar', "Categoria" = 'Prueba', "Stock_Actual" = 0,
                    "Unidad" = 'u', "Stock_Minimo" = 0, "Stock_Maximo" = 0, "Id_Cliente" = NULL
WHERE "Id_Material" = :material_b AND "Id_Empresa" = :empresa_a;
\echo Q2 PUT row_count=:ROW_COUNT
UPDATE material SET "Activo" = false, "Stock_Actual" = 0
WHERE "Id_Material" = :material_b AND "Id_Empresa" = :empresa_a;
\echo Q2 DELETE row_count=:ROW_COUNT
\endif

\if :q3
-- Q3: misma sentencia del INSERT de movimientos. El DO captura el SQLSTATE esperado.
CREATE OR REPLACE FUNCTION pg_temp.test_movement(p_material integer, p_company integer) RETURNS text
LANGUAGE plpgsql AS $function$
DECLARE observed_state text;
BEGIN
  INSERT INTO material_movimiento ("Id_Material", "Tipo", "Cantidad", "Nota", "Id_Empresa")
  VALUES (p_material, 'Entrada', 1, 'Q3 cross-company', p_company);
  RETURN 'inserted';
EXCEPTION WHEN foreign_key_violation THEN
  GET STACKED DIAGNOSTICS observed_state = RETURNED_SQLSTATE;
  RETURN observed_state;
END
$function$;
SELECT pg_temp.test_movement(:material_b, :empresa_a) AS q3_result;
\endif

\if :q4
-- Q4: la sentencia exacta de POST; duplicate same tenant => 23505, other tenant => success.
CREATE OR REPLACE FUNCTION pg_temp.test_material(p_name text, p_company integer) RETURNS text
LANGUAGE plpgsql AS $function$
DECLARE observed_state text;
BEGIN
  INSERT INTO material ("Nombre_Material", "Categoria", "Stock_Actual", "Unidad", "Stock_Minimo", "Stock_Maximo", "Id_Cliente", "Id_Empresa")
  VALUES (p_name, 'Prueba', 0, 'u', 0, 0, NULL, p_company);
  RETURN 'inserted';
EXCEPTION WHEN unique_violation THEN
  GET STACKED DIAGNOSTICS observed_state = RETURNED_SQLSTATE;
  RETURN observed_state;
END
$function$;
SELECT pg_temp.test_material('Fixture Q', :empresa_a) AS same_company_result;
SELECT pg_temp.test_material('Fixture Q', :empresa_b) AS other_company_result;
\endif

\if :q5
-- Q5: prepara las consultas restantes idénticas a las cadenas del router.
PREPARE q_report(date, integer) AS
SELECT m."Id_Material", m."Nombre_Material", m."Categoria", m."Unidad",
       m."Stock_Minimo", m."Stock_Maximo", u."Nombre_Completo" AS "Nombre_Cliente",
       SUM(mv."Cantidad") AS "Stock_Actual"
FROM material m
INNER JOIN material_movimiento mv
  ON mv."Id_Material" = m."Id_Material"
 AND mv."Fecha" < (date_trunc('month', $1::date) + interval '1 month')
 AND mv."Id_Empresa" = m."Id_Empresa"
LEFT JOIN usuario u ON m."Id_Cliente" = u."Id_Usuario"
WHERE m."Id_Empresa" = $2
GROUP BY m."Id_Material", u."Nombre_Completo"
ORDER BY m."Nombre_Material";
PREPARE q_cliente(integer, integer) AS
SELECT m.*, u."Nombre_Completo" AS "Nombre_Cliente"
FROM material m LEFT JOIN usuario u ON m."Id_Cliente" = u."Id_Usuario"
WHERE m."Activo" = true AND m."Id_Cliente" = $1 AND m."Id_Empresa" = $2
ORDER BY m."Nombre_Material";
PREPARE q_alert(integer) AS
SELECT m.*, u."Nombre_Completo" AS "Nombre_Cliente"
FROM material m LEFT JOIN usuario u ON m."Id_Cliente" = u."Id_Usuario"
WHERE m."Activo" = true AND m."Stock_Actual" <= m."Stock_Minimo" AND m."Id_Empresa" = $1
ORDER BY m."Stock_Actual" ASC;
PREPARE q_movements(integer, integer) AS
SELECT * FROM material_movimiento
WHERE "Id_Material" = $1 AND "Id_Empresa" = $2
ORDER BY "Fecha" DESC;
PREPARE q_get(integer, integer) AS
SELECT m.*, u."Nombre_Completo" AS "Nombre_Cliente"
FROM material m LEFT JOIN usuario u ON m."Id_Cliente" = u."Id_Usuario"
WHERE m."Id_Material" = $1 AND m."Id_Empresa" = $2;
PREPARE q_lock(integer, integer) AS
SELECT "Stock_Actual" FROM material
WHERE "Id_Material" = $1 AND "Id_Empresa" = $2 FOR UPDATE;
PREPARE q_delete(integer, integer) AS
SELECT "Stock_Actual" FROM material
WHERE "Id_Material" = $1 AND "Activo" = true AND "Id_Empresa" = $2 FOR UPDATE;
PREPARE q_material_insert(text, text, numeric, text, numeric, numeric, integer, integer) AS
INSERT INTO material ("Nombre_Material", "Categoria", "Stock_Actual", "Unidad", "Stock_Minimo", "Stock_Maximo", "Id_Cliente", "Id_Empresa")
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING "Id_Material";
PREPARE q_movement_insert(integer, text, numeric, text, integer) AS
INSERT INTO material_movimiento ("Id_Material", "Tipo", "Cantidad", "Nota", "Id_Empresa")
VALUES ($1, $2, $3, $4, $5);
PREPARE q_material_update(text, text, numeric, text, numeric, numeric, integer, integer, integer) AS
UPDATE material
SET "Nombre_Material" = $1, "Categoria" = $2, "Stock_Actual" = $3,
    "Unidad" = $4, "Stock_Minimo" = $5, "Stock_Maximo" = $6, "Id_Cliente" = $7
WHERE "Id_Material" = $8 AND "Id_Empresa" = $9;
\echo Q5 PREPARE statements completed
\endif
