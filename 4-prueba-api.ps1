param(
  [int]$IdCliente = 0,
  [string]$Base = 'http://localhost:3001/api',
  [string]$ApiKey = 'texticode-2026',
  [switch]$Confirmar
)
$ErrorActionPreference = 'Stop'
$script:fallos = 0
$script:creadas = @()

function Ok([bool]$cond, [string]$msg) {
  if ($cond) { Write-Host "  [OK]     $msg" -ForegroundColor Green }
  else { Write-Host "  [FALLA]  $msg" -ForegroundColor Red; $script:fallos++ }
}
function Aviso([string]$msg) { Write-Host "  [AVISO]  $msg" -ForegroundColor Yellow }
function Paso([string]$msg)  { Write-Host "`n== $msg" -ForegroundColor Cyan }
function Lista($x) { return @($x | ForEach-Object { $_ }) }

function Api([string]$Metodo, [string]$Ruta, $Cuerpo = $null, [switch]$Key) {
  $p = @{ Method = $Metodo; Uri = "$Base$Ruta"; ContentType = 'application/json; charset=utf-8' }
  if ($Key) { $p.Headers = @{ 'x-api-key' = $ApiKey } }
  if ($null -ne $Cuerpo) { $p.Body = [System.Text.Encoding]::UTF8.GetBytes(($Cuerpo | ConvertTo-Json -Depth 6)) }
  try { return Invoke-RestMethod @p }
  catch {
    $d = $_.ErrorDetails.Message
    if (-not $d -and $_.Exception.Response) {
      try { $d = (New-Object IO.StreamReader($_.Exception.Response.GetResponseStream())).ReadToEnd() } catch {}
    }
    throw "$Metodo $Ruta -> HTTP $([int]$_.Exception.Response.StatusCode) | $d | $($_.Exception.Message)"
  }
}
function Orden($id) { return @(Lista (Api 'GET' "/ordenes/$id"))[0] }
function Fases($id) { return @(Lista (Api 'GET' "/orden-operario/orden/$id")) }
function Prod($id) {
  try { $e = Api 'GET' "/eficiencia/operarios/$id" -Key; return [int]$e.data.total_unidades_producidas }
  catch { return $null }
}
function CuerpoOrden($cant, $fecha, $prio = 'Media') {
  return @{ Id_Cliente = $IdCliente; Id_Material = $mat.Id_Material; Producto = 'ZZ-PRUEBA'
            Descripcion = 'Prueba automatica - se borra sola'; Cantidad = $cant; Prioridad = $prio
            Dificultad = 'Media'; Estado = 'En Proceso'; Fecha_Limite = $fecha }
}

try {
  Paso 'Preparacion'
  $usuarios = Lista (Api 'GET' '/usuarios')
  if ($IdCliente -gt 0) {
    $cliente = $usuarios | Where-Object { $_.Id_Usuario -eq $IdCliente } | Select-Object -First 1
  } else {
    $cliente = $usuarios | Where-Object { $_.Rol -eq 'cliente' -and $_.Estado -eq 'activo' } | Select-Object -First 1
  }
  if (-not $cliente) { throw "No encontre un cliente (usuarios leidos: $($usuarios.Count))." }
  $IdCliente = [int]$cliente.Id_Usuario
  Write-Host "Cliente de prueba: [$IdCliente] $($cliente.Nombre_Completo) <$($cliente.Correo)>"
  Write-Host 'Al completar la orden 1 se enviara UN correo real a esa direccion.' -ForegroundColor Yellow
  if (-not $Confirmar) { if ((Read-Host 'Escribe SI para continuar') -ne 'SI') { return } }

  $ops = @($usuarios | Where-Object { $_.Rol -match 'operario' -and $_.Estado -eq 'activo' } | Select-Object -First 3)
  if ($ops.Count -lt 3) { throw "Se necesitan al menos 3 operarios activos (hay $($ops.Count))." }
  $opA = $ops[0]; $opB = $ops[1]; $opC = $ops[2]
  $mats = Lista (Api 'GET' '/materiales')
  $mat = $mats | Where-Object { $_.Id_Cliente -eq $IdCliente } | Select-Object -First 1
  if (-not $mat) { $mat = $mats | Select-Object -First 1 }
  if (-not $mat) { throw 'No hay materiales registrados.' }
  $futuro = (Get-Date).AddDays(30).ToString('yyyy-MM-dd')
  $pasado = (Get-Date).AddDays(-2).ToString('yyyy-MM-dd')

  Paso 'Orden 1: 10 prendas, fase 1 compartida (A y B), fase 2 (C)'
  $o1 = Api 'POST' '/ordenes' (CuerpoOrden 10 $futuro)
  $id1 = $o1.Id_Orden; $script:creadas += $id1
  $faseA = Api 'POST' '/orden-operario' @{ Id_Orden = $id1; Id_Operario = $opA.Id_Usuario; Numero_Fase = 1; Descripcion_Fase = 'Corte' }
  $faseB = Api 'POST' '/orden-operario' @{ Id_Orden = $id1; Id_Operario = $opB.Id_Usuario; Numero_Fase = 1; Descripcion_Fase = 'Corte' }
  Ok $true 'Dos operarios en la misma fase (la migracion esta aplicada)'
  $faseC = Api 'POST' '/orden-operario' @{ Id_Orden = $id1; Id_Operario = $opC.Id_Usuario; Numero_Fase = 2; Descripcion_Fase = 'Costura' }
  $x = Orden $id1
  Ok (($x.Estado -eq 'En Proceso') -and ([int]$x.Unidades_Realizadas -eq 0)) "Recien creada: $($x.Estado), $($x.Unidades_Realizadas)/10"

  $mias = @(Lista (Api 'GET' "/orden-operario/operario/$($opA.Id_Usuario)") | Where-Object { $_.Id_Orden -eq $id1 -and $_.Numero_Fase -eq 1 })
  Ok (($mias.Count -eq 1) -and ([int]$mias[0].Cuota -eq 5)) "El GET del operario trae Cuota = 5 (llego: $($mias[0].Cuota))"

  try {
    $carga = Api 'GET' "/carga-trabajo/operarios/$($opA.Id_Usuario)" -Key
    $det = @(Lista $carga.data.ordenes_activas_detalle | Where-Object { $_.Id_Orden -eq $id1 })
    if ($det.Count -eq 1) { Ok $true 'carga-trabajo ve la orden una sola vez' }
    elseif ($det.Count -gt 1) { Ok $false "carga-trabajo cuenta la orden $($det.Count) veces" }
    else { Aviso 'carga-trabajo no lista la orden nueva (probable: usa orden_produccion.Id_Operario, que ahora queda vacio).' }
  } catch { Aviso "carga-trabajo fallo: $_" }

  try {
    $vista = @(Lista (Api 'GET' "/ordenes/operario/$($opA.Id_Usuario)") | Where-Object { $_.Id_Orden -eq $id1 })
    if ($vista.Count -ge 1) { Ok $true 'GET /ordenes/operario/:id incluye la orden (Cuenta Personal del operario)' }
    else { Aviso 'GET /ordenes/operario/:id NO devuelve la orden: la Cuenta Personal del operario no la veria.' }
  } catch { Aviso "GET /ordenes/operario fallo: $_" }

  $antes = Prod $opA.Id_Usuario

  Paso 'Completar fases'
  $null = Api 'PATCH' "/orden-operario/$($faseA.Id_Orden_Operario)/completar" @{ Nota_Operario = 'prueba' }
  $x = Orden $id1
  Ok (($x.Estado -eq 'En Proceso') -and ([int]$x.Unidades_Realizadas -eq 3)) "A completa su parte de la fase 1 -> $($x.Estado), $($x.Unidades_Realizadas)/10 (esperado 3)"
  $filaA = Fases $id1 | Where-Object { $_.Id_Operario -eq $opA.Id_Usuario } | Select-Object -First 1
  Ok ([int]$filaA.Cantidad_Realizada -eq 5) "A queda con Cantidad_Realizada = 5 (llego: $($filaA.Cantidad_Realizada))"

  Paso 'Editar la orden como lo hace el panel admin (mismo payload)'
  $null = Api 'PUT' "/ordenes/$id1" (CuerpoOrden 10 $futuro 'Alta')
  $x = Orden $id1
  Ok ([int]$x.Unidades_Realizadas -eq 3) "Editar NO borro el progreso ($($x.Unidades_Realizadas)/10)"
  Ok ($x.Prioridad -eq 'Alta') 'La edicion se guardo (prioridad Alta)'
  $completadas = @(Fases $id1 | Where-Object { $_.Estado_Fase -eq 'Completada' })
  Ok ($completadas.Count -eq 1) 'La fase completada sigue completada'

  $null = Api 'PATCH' "/orden-operario/$($faseB.Id_Orden_Operario)/completar" @{ Nota_Operario = 'prueba' }
  $x = Orden $id1
  Ok (($x.Estado -eq 'En Proceso') -and ([int]$x.Unidades_Realizadas -eq 5)) "B completa la fase 1 -> $($x.Estado), $($x.Unidades_Realizadas)/10 (esperado 5)"

  $null = Api 'PATCH' "/orden-operario/$($faseC.Id_Orden_Operario)/completar" @{ Nota_Operario = 'prueba' }
  $x = Orden $id1
  Ok (($x.Estado -eq 'Completada') -and ([int]$x.Unidades_Realizadas -eq 10)) "C completa la fase 2 -> $($x.Estado), $($x.Unidades_Realizadas)/10"

  $filas = Fases $id1
  $s1 = ($filas | Where-Object { $_.Numero_Fase -eq 1 } | Measure-Object Cantidad_Realizada -Sum).Sum
  $s2 = ($filas | Where-Object { $_.Numero_Fase -eq 2 } | Measure-Object Cantidad_Realizada -Sum).Sum
  Ok (($s1 -eq 10) -and ($s2 -eq 10)) "Cada fase suma 10 prendas (fase 1: $s1, fase 2: $s2)"

  $despues = Prod $opA.Id_Usuario
  if (($null -eq $antes) -or ($null -eq $despues)) { Aviso 'No se pudo leer la eficiencia (revisa la ruta o el x-api-key).' }
  else { Ok (($despues - $antes) -eq 5) "La eficiencia de A sube exactamente 5 (antes $antes, despues $despues)" }

  Paso 'Orden 2: fecha limite vencida -> Retrasada'
  $o2 = Api 'POST' '/ordenes' (CuerpoOrden 4 $pasado)
  $id2 = $o2.Id_Orden; $script:creadas += $id2
  $g1 = Api 'POST' '/orden-operario' @{ Id_Orden = $id2; Id_Operario = $opA.Id_Usuario; Numero_Fase = 1; Descripcion_Fase = 'Corte' }
  $null = Api 'POST' '/orden-operario' @{ Id_Orden = $id2; Id_Operario = $opB.Id_Usuario; Numero_Fase = 2; Descripcion_Fase = 'Costura' }
  $null = Api 'PATCH' "/orden-operario/$($g1.Id_Orden_Operario)/completar" @{ Nota_Operario = 'prueba' }
  $y = Orden $id2
  Ok ($y.Estado -eq 'Retrasada') "Orden vencida e incompleta -> $($y.Estado)"
}
catch { Write-Host "  [ERROR]  $_" -ForegroundColor Red; $script:fallos++ }
finally {
  Paso 'Limpieza'
  foreach ($id in $script:creadas) {
    try { $null = Api 'DELETE' "/ordenes/$id"; Write-Host "  Orden de prueba $id borrada" }
    catch { Aviso "No se pudo borrar la orden $id (borrala a mano): $_" }
  }
}

Write-Host ''
if ($script:fallos -eq 0) { Write-Host 'TODO OK' -ForegroundColor Green }
else { Write-Host "$($script:fallos) falla(s). Pegame esta salida completa." -ForegroundColor Red }

