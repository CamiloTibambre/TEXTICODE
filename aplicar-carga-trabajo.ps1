$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding($false)
$ruta = 'BACKEND\routes\carga_trabajo.js'
Copy-Item $ruta "$ruta.bak" -Force
$txt = [System.IO.File]::ReadAllText((Resolve-Path $ruta), $utf8)

function Contar($texto, $literal) { ([regex]::Matches($texto, [regex]::Escape($literal))).Count }

$ancla = 'const LIMITE_ORDENES_DISPONIBLE = 2'
if ((Contar $txt $ancla) -ne 1) { throw "No se encontró el ancla exactamente una vez." }
if ($txt.Contains('const SQL_ORDENES_OP')) { throw 'Ya tiene SQL_ORDENES_OP: ¿ya lo aplicaste?' }

$bloque = @"
const LIMITE_ORDENES_DISPONIBLE = 2

// Órdenes de cada operario: fases pendientes (orden_operario) + órdenes legacy.
const SQL_ORDENES_OP = ``(
  SELECT oo."Id_Operario", p."Id_Orden", p."Producto", p."Estado", p."Prioridad",
         p."Fecha_Limite", p."Unidades", p."Unidades_Realizadas"
  FROM orden_operario oo
  JOIN orden_produccion p ON p."Id_Orden" = oo."Id_Orden"
  WHERE oo."Estado_Fase" <> 'Completada'
  UNION
  SELECT p."Id_Operario", p."Id_Orden", p."Producto", p."Estado", p."Prioridad",
         p."Fecha_Limite", p."Unidades", p."Unidades_Realizadas"
  FROM orden_produccion p
  WHERE p."Id_Operario" IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM orden_operario x
      WHERE x."Id_Orden" = p."Id_Orden" AND x."Id_Operario" = p."Id_Operario"
    )
)``
"@.Replace('$', '$$')
$bloque = $bloque.Replace('$$', '$')
$txt = $txt.Replace($ancla, $bloque)

$joinViejo = 'LEFT JOIN orden_produccion op ON op."Id_Operario" = u."Id_Usuario"'
$joinNuevo = 'LEFT JOIN ${SQL_ORDENES_OP} op ON op."Id_Operario" = u."Id_Usuario"'
$n = Contar $txt $joinViejo
if ($n -ne 4) { throw "Se esperaban 4 LEFT JOIN y hay $n. No se modificó nada." }
$txt = $txt.Replace($joinViejo, $joinNuevo)

$patron = 'FROM orden_produccion(\s+)WHERE "Id_Operario" = \$1 AND "Estado" IN \(''En Proceso'', ''Retrasada''\)'
$m = [regex]::Matches($txt, $patron).Count
if ($m -ne 2) { throw "Se esperaban 2 consultas de detalle y hay $m. No se modificó nada." }
$txt = [regex]::Replace($txt, $patron, {
  param($mm)
  'FROM ${SQL_ORDENES_OP} t' + $mm.Groups[1].Value + 'WHERE "Id_Operario" = $1 AND "Estado" IN (''En Proceso'', ''Retrasada'')'
})

$txt = $txt.Replace("IN ('En Proceso', 'Pausado')", "IN ('En Proceso', 'Retrasada')")

[System.IO.File]::WriteAllText((Resolve-Path $ruta), $txt, $utf8)
Write-Host 'OK carga_trabajo.js actualizado' -ForegroundColor Green
