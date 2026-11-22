$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
Write-Host 'TEXTICODE - UN SOLO CASO JEST EN AWS' -ForegroundColor Cyan
Write-Host ('Equipo: ' + $env:COMPUTERNAME)
Write-Host ('Fecha: ' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz'))
Write-Host ('Fabricante: ' + (Get-CimInstance Win32_ComputerSystem).Manufacturer)
Write-Host 'Ejecuta este archivo dentro de la instancia EC2, con el backend encendido.'
if (-not (Test-Path -LiteralPath 'node_modules/jest/bin/jest.js')) {
    npm.cmd install --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo instalar Jest.' }
}
$env:API_URL = 'http://localhost:3001'
$env:TEST_USUARIO = Read-Host 'Nombre de usuario real de Texticode'
$claveSeguraJest = Read-Host 'Contraseña del usuario de prueba' -AsSecureString
$punteroJest = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($claveSeguraJest)
try {
    $env:TEST_CONTRASENA = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($punteroJest)
    # cmd combina stdout y stderr antes de la tubería para que PowerShell 5.1
    # no trate la salida normal de Jest como un error terminante.
    & cmd.exe /d /c 'node --experimental-vm-modules node_modules/jest/bin/jest.js --config jest.aws.config.js --runInBand --json --outputFile=resultados-aws.json 2>&1' | Tee-Object -FilePath ejecucion-aws.txt
    $codigoJest = $LASTEXITCODE
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($punteroJest)
    Remove-Item Env:TEST_CONTRASENA -ErrorAction SilentlyContinue
    Remove-Item Env:TEST_USUARIO -ErrorAction SilentlyContinue
}
Write-Host 'Guarda una captura de esta ventana con el resultado, el nombre del equipo y la sesión remota visible.'
if ($codigoJest -ne 0) { throw 'La prueba falló. Conserva la evidencia para revisar el motivo.' }
