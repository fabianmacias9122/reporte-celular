$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

$pythonCommand = $null
$pythonArgs = @()

if (Get-Command python3.13.exe -ErrorAction SilentlyContinue) {
    $pythonCommand = "python3.13.exe"
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonCommand = "python"
} elseif (Get-Command py -ErrorAction SilentlyContinue) {
    $pythonCommand = "py"
    $pythonArgs = @("-3")
}

if (-not $pythonCommand) {
    Write-Host "Python no esta instalado o no esta en PATH." -ForegroundColor Red
    exit 1
}

Write-Host "Iniciando Reporte Celular en http://127.0.0.1:8090 ..." -ForegroundColor Green
Start-Process "http://127.0.0.1:8090"
& $pythonCommand @pythonArgs "server/app.py"
