# aplicar-correcciones.ps1
# Ejecutar desde la raíz del proyecto (donde está la carpeta BACKEND):
#   powershell -ExecutionPolicy Bypass -File .\aplicar-correcciones.ps1
# Hace copia .bak de cada archivo antes de modificarlo.

$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding($false)

function Leer($ruta)  { [System.IO.File]::ReadAllText((Resolve-Path $ruta), $utf8) }
function Guardar($ruta, $txt) { [System.IO.File]::WriteAllText((Resolve-Path $ruta), $txt, $utf8) }

# ------------------------------------------------------------
# 1) eficiencia.js — SQL_ORDENES_OP con cuota por operario
# ------------------------------------------------------------
$rutaEf = 'BACKEND\routes\eficiencia.js'
Copy-Item $rutaEf "$rutaEf.bak" -Force
$txt = Leer $rutaEf

$nuevoBloque = @'
const SQL_ORDENES_OP = `(
  SELECT oo."Id_Operario", p."Id_Orden", p."Producto", p."Estado", p."Prioridad",
         p."Dificultad",
         MAX(oo."Cantidad_Realizada")::int                  AS "Unidades_Realizadas",
         MAX(ROUND(p."Cantidad"::numeric / c.n))::int       AS "Unidades",
         p."Fecha_Limite", p."Fecha_Creacion"
  FROM orden_operario oo
  JOIN orden_produccion p ON p."Id_Orden" = oo."Id_Orden"
  JOIN (
    SELECT "Id_Orden", "Numero_Fase", COUNT(*) AS n
    FROM orden_operario
    GROUP BY "Id_Orden", "Numero_Fase"
  ) c ON c."Id_Orden" = oo."Id_Orden" AND c."Numero_Fase" = oo."Numero_Fase"
  GROUP BY oo."Id_Operario", p."Id_Orden", p."Producto", p."Estado", p."Prioridad",
           p."Dificultad", p."Fecha_Limite", p."Fecha_Creacion"
  UNION ALL
  SELECT p."Id_Operario", p."Id_Orden", p."Producto", p."Estado", p."Prioridad",
         p."Dificultad", p."Unidades_Realizadas"::int, p."Unidades"::int,
         p."Fecha_Limite", p."Fecha_Creacion"
  FROM orden_produccion p
  WHERE p."Id_Operario" IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM orden_operario x
      WHERE x."Id_Orden" = p."Id_Orden" AND x."Id_Operario" = p."Id_Operario"
    )
)`
'@.TrimEnd()

$patron = '(?s)const SQL_ORDENES_OP = `\(.*?\r?\n\)`'
if (-not [regex]::IsMatch($txt, $patron)) {
  Write-Host 'X eficiencia.js: no se encontró el bloque SQL_ORDENES_OP (¿ya lo cambiaste?)' -ForegroundColor Red
} else {
  $txt = [regex]::Replace($txt, $patron, { param($m) $nuevoBloque }, 1)
  Guardar $rutaEf $txt
  Write-Host 'OK eficiencia.js actualizado' -ForegroundColor Green
}

# ------------------------------------------------------------
# 2) ordenes.js — Cuenta Personal: incluir órdenes por fases
# ------------------------------------------------------------
$rutaOr = 'BACKEND\routes\ordenes.js'
Copy-Item $rutaOr "$rutaOr.bak" -Force
$txt = Leer $rutaOr

$viejo = '      WHERE op."Id_Operario" = $1'
$nuevo = @'
      WHERE op."Id_Operario" = $1
         OR EXISTS (
              SELECT 1 FROM orden_operario oo
              WHERE oo."Id_Orden" = op."Id_Orden" AND oo."Id_Operario" = $1
            )
'@.TrimEnd()

$cuenta = ([regex]::Matches($txt, [regex]::Escape($viejo))).Count
if ($cuenta -ne 1) {
  Write-Host "X ordenes.js: se esperaba 1 coincidencia y hay $cuenta. No se modificó." -ForegroundColor Red
} else {
  $txt = $txt.Replace($viejo, $nuevo)
  Guardar $rutaOr $txt
  Write-Host 'OK ordenes.js actualizado' -ForegroundColor Green
}

Write-Host ''
Write-Host 'Listo. Reinicia el backend (npm run dev) y revisa con: git diff --stat'
