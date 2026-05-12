param(
    [string]$TursoUrl = "https://reporte-celular-fabianmacias9122.aws-us-west-2.turso.io",
    [string]$TursoToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Nzg1MjQ4OTAsImlkIjoiMDE5ZTE4NTYtMTYwMS03NDljLTg4ZDYtNDg0YTJhZjc0YzA3IiwicmlkIjoiMzJmZDY0NmYtMWNhYy00ZDcxLThmNTMtNmM1MzRmNDk4ODIxIn0.rVwGj_A9qN6QJ7gbj5ipbqoSM6sG90bf96hQmslHAa2M0dgQxmUEA0CIlTJxldil_-9o0B1ZuKKXj_R8dtkIDg"
)

$headers = @{ Authorization = "Bearer $TursoToken" }
$apiUrl  = "$TursoUrl/v2/pipeline"

function Exec-SQL([string]$sql) {
    $body = @{
        requests = @(
            @{ type = "execute"; stmt = @{ sql = $sql } },
            @{ type = "close" }
        )
    } | ConvertTo-Json -Depth 5 -Compress
    $r = Invoke-RestMethod -Uri $apiUrl -Method Post -Body $body -ContentType "application/json" -Headers $headers
    $result = $r.results[0]
    if ($result.type -eq "error") {
        Write-Host "ERROR: $($result.error.message)" -ForegroundColor Red
    } else {
        Write-Host "OK: $sql" -ForegroundColor Green
    }
}

Write-Host "Inicializando tablas en Turso..." -ForegroundColor Cyan

Exec-SQL @"
CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_name TEXT NOT NULL,
    area TEXT NOT NULL,
    device_model TEXT NOT NULL,
    imei TEXT NOT NULL,
    phone_number TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'activo',
    notes TEXT NOT NULL DEFAULT '',
    payload_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
)
"@

Exec-SQL @"
CREATE TABLE IF NOT EXISTS people_catalog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    guardian_person_id INTEGER,
    guardian_name TEXT NOT NULL DEFAULT '',
    supervisor_sector TEXT NOT NULL DEFAULT '',
    is_coordinator INTEGER NOT NULL DEFAULT 0,
    rcm_progress TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
)
"@

Exec-SQL @"
CREATE TABLE IF NOT EXISTS cell_catalog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cell_number TEXT NOT NULL UNIQUE,
    network_name TEXT NOT NULL DEFAULT '',
    sector TEXT NOT NULL,
    zone_name TEXT NOT NULL DEFAULT '',
    district_name TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    leader_person_id INTEGER,
    assistant_person_id INTEGER,
    host_person_id INTEGER,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
)
"@

Exec-SQL @"
CREATE TABLE IF NOT EXISTS cell_membership (
    cell_id INTEGER NOT NULL,
    person_id INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (cell_id, person_id)
)
"@

Exec-SQL "CREATE UNIQUE INDEX IF NOT EXISTS idx_cell_membership_person_unique ON cell_membership (person_id)"

Exec-SQL @"
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL
)
"@

Write-Host ""
Write-Host "Tablas creadas en Turso!" -ForegroundColor Cyan
