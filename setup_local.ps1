$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoRoot

function Write-Step($message) {
    Write-Host ""
    Write-Host "==> $message" -ForegroundColor Cyan
}

function Ensure-Command($commandName, $label) {
    if (-not (Get-Command $commandName -ErrorAction SilentlyContinue)) {
        throw "$label is not installed or not available in PATH."
    }

    Write-Host "[OK] $label detected." -ForegroundColor Green
}

Write-Step "Checking required tools"
Ensure-Command "python" "Python"
Ensure-Command "node" "Node.js"
Ensure-Command "npm.cmd" "npm"

Write-Step "Creating Python virtual environment"
if (-not (Test-Path ".venv")) {
    python -m venv .venv
    Write-Host "[OK] .venv created." -ForegroundColor Green
}
else {
    Write-Host "[OK] .venv already exists." -ForegroundColor Green
}

$venvPython = Join-Path $repoRoot ".venv\Scripts\python.exe"

Write-Step "Installing backend dependencies"
& $venvPython -m pip install --upgrade pip
& $venvPython -m pip install -r requirements.txt

Write-Step "Installing mobile dependencies"
if (Test-Path "mobile\package.json") {
    Push-Location "mobile"
    npm.cmd install
    Pop-Location
    Write-Host "[OK] Mobile dependencies installed." -ForegroundColor Green
}
else {
    Write-Host "[INFO] mobile\package.json not found. Skipping mobile install." -ForegroundColor Yellow
}

Write-Step "Checking optional database CLI"
if (Get-Command "psql" -ErrorAction SilentlyContinue) {
    Write-Host "[OK] psql detected." -ForegroundColor Green
}
else {
    Write-Host "[INFO] psql is not in PATH. PostgreSQL may still be installed, but DDL commands may need manual setup." -ForegroundColor Yellow
}

Write-Step "Setup completed"
Write-Host "Next steps:" -ForegroundColor White
Write-Host "1. Activate backend venv with: .\.venv\Scripts\activate"
Write-Host "2. Run DDL with: psql -U postgres -d traffiq -f sql/ddl/create_all.sql"
Write-Host "3. Start API with: uvicorn src.api.main:app --reload"
Write-Host "4. Start mobile app with: cd mobile"
Write-Host "5. Then run: npm.cmd start"
