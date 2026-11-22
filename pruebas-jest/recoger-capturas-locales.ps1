$ErrorActionPreference = 'Stop'
$raizInforme = Split-Path -Parent $PSScriptRoot
$carpetaCapturas = Join-Path $PSScriptRoot 'capturas-reales'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding
$Host.UI.RawUI.WindowTitle = 'TEXTICODE - Evidencias reales de Jest'
try {
    $tamano = $Host.UI.RawUI.WindowSize
    $tamano.Width = 130; $tamano.Height = 38
    $buffer = $Host.UI.RawUI.BufferSize
    $buffer.Width = 130; $buffer.Height = 3000
    $Host.UI.RawUI.BufferSize = $buffer
    $Host.UI.RawUI.WindowSize = $tamano
} catch {}
Set-Location -LiteralPath $raizInforme
$trabajos = Get-Content -LiteralPath (Join-Path $carpetaCapturas 'trabajos.json') -Raw -Encoding UTF8 | ConvertFrom-Json
foreach ($trabajo in $trabajos) {
    $inicioTrabajo = Get-Date
    Clear-Host
    Write-Host ('TEXTICODE | ' + $trabajo.titulo) -ForegroundColor Cyan
    Write-Host 'Camilo Andres Tibambre Montana | Ficha 3278639 | Entorno local'
    Write-Host ('Fecha: ' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz'))
    Write-Host ''
    $codigoSalida = 0
    foreach ($paso in $trabajo.pasos) {
        Set-Location -LiteralPath (Join-Path $raizInforme $paso.carpeta)
        Write-Host ('Carpeta: ' + (Get-Location).Path) -ForegroundColor DarkGray
        Write-Host ('Comando: ' + $paso.comando) -ForegroundColor Yellow
        $ErrorActionPreference = 'Continue'
        & cmd.exe /d /c ($paso.comando + ' 2>&1')
        if ($LASTEXITCODE -ne 0) { $codigoSalida = $LASTEXITCODE }
        $ErrorActionPreference = 'Stop'
        Write-Host ''
    }
    Write-Host ('Evidencia: ' + $trabajo.id + ' | Codigo de salida: ' + $codigoSalida) -ForegroundColor Green
    $estado = @{ id = $trabajo.id; salida = $codigoSalida; fecha = (Get-Date -Format o) } | ConvertTo-Json
    Set-Content -LiteralPath (Join-Path $carpetaCapturas 'lista.json') -Value $estado -Encoding UTF8
    $senal = Join-Path $carpetaCapturas ($trabajo.id + '.continuar')
    while (-not (Test-Path -LiteralPath $senal) -or (Get-Item -LiteralPath $senal).LastWriteTime -lt $inicioTrabajo) { Start-Sleep -Milliseconds 300 }
}
Set-Content -LiteralPath (Join-Path $carpetaCapturas 'terminado.txt') -Value 'Capturas locales completadas' -Encoding UTF8
Write-Host 'Capturas completadas. Los servicios del proyecto siguen en sus ventanas originales.' -ForegroundColor Cyan
