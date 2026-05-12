param(
    [string]$TursoUrl   = "https://reporte-celular-fabianmacias9122.aws-us-west-2.turso.io",
    [string]$TursoToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Nzg1MjQ4OTAsImlkIjoiMDE5ZTE4NTYtMTYwMS03NDljLTg4ZDYtNDg0YTJhZjc0YzA3IiwicmlkIjoiMzJmZDY0NmYtMWNhYy00ZDcxLThmNTMtNmM1MzRmNDk4ODIxIn0.rVwGj_A9qN6QJ7gbj5ipbqoSM6sG90bf96hQmslHAa2M0dgQxmUEA0CIlTJxldil_-9o0B1ZuKKXj_R8dtkIDg",
    [string]$DbPath     = "$PSScriptRoot\..\data\reporte-celular.db"
)

$headers = @{ Authorization = "Bearer $TursoToken" }
$apiUrl  = "$TursoUrl/v2/pipeline"

function Exec-Turso([string]$sql, [array]$args_list = @()) {
    $stmtArgs = $args_list | ForEach-Object {
        if ($_ -eq $null)         { @{ type = "null" } }
        elseif ($_ -is [int] -or $_ -is [long]) { @{ type = "integer"; value = "$_" } }
        elseif ($_ -is [double])  { @{ type = "float";   value = "$_" } }
        else                       { @{ type = "text";    value = "$_" } }
    }
    $stmt = @{ sql = $sql }
    if ($stmtArgs.Count -gt 0) { $stmt["args"] = $stmtArgs }

    $body = @{
        requests = @(
            @{ type = "execute"; stmt = $stmt },
            @{ type = "close" }
        )
    } | ConvertTo-Json -Depth 8 -Compress

    $r = Invoke-RestMethod -Uri $apiUrl -Method Post -Body $body -ContentType "application/json" -Headers $headers
    $result = $r.results[0]
    if ($result.type -eq "error") {
        $msg = $result.error.message
        if ($msg -match "UNIQUE") { return "SKIP" }
        Write-Host "  ERROR: $msg" -ForegroundColor Red
        return "ERROR"
    }
    return "OK"
}

function Query-SQLite([string]$sql) {
    $rows = @()
    $conn = New-Object System.Data.SQLite.SQLiteConnection("Data Source=$DbPath;Version=3;Read Only=True;")
    try {
        $conn.Open()
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = $sql
        $reader = $cmd.ExecuteReader()
        $cols = @()
        for ($i = 0; $i -lt $reader.FieldCount; $i++) { $cols += $reader.GetName($i) }
        while ($reader.Read()) {
            $row = @{}
            for ($i = 0; $i -lt $reader.FieldCount; $i++) {
                $val = $reader.GetValue($i)
                $row[$cols[$i]] = if ($val -is [System.DBNull]) { $null } else { $val }
            }
            $rows += $row
        }
        $reader.Close()
        $cmd.Dispose()
        $conn.Close()
    } catch {
        $conn.Close()
        throw $_
    }
    return $rows
}

# Check SQLite assembly
$sqliteAsm = Get-ChildItem "$env:USERPROFILE\AppData\Local\*\*\Python*\site-packages\*sqlite*\*.dll" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $sqliteAsm) {
    $sqliteAsm = Get-ChildItem "C:\Windows\System32\System.Data.SQLite.dll" -ErrorAction SilentlyContinue
}

# Use Python to dump SQLite data to JSON instead
Write-Host "Exportando datos de SQLite..." -ForegroundColor Cyan

$pyScript = @"
import sqlite3, json, sys
db = r'$($DbPath -replace '\\', '\\\\')'
conn = sqlite3.connect(db)
conn.row_factory = sqlite3.Row
tables = ['people_catalog','cell_catalog','cell_membership','reports','app_settings']
data = {}
for t in tables:
    try:
        rows = conn.execute(f'SELECT * FROM {t}').fetchall()
        data[t] = [dict(r) for r in rows]
    except: data[t] = []
print(json.dumps(data, ensure_ascii=False, default=str))
conn.close()
"@

$jsonOut = python3 -c $pyScript 2>$null
if (-not $jsonOut) {
    $jsonOut = python -c $pyScript 2>$null
}
if (-not $jsonOut) {
    Write-Host "No se pudo leer SQLite con Python. Asegurate de que Python este instalado." -ForegroundColor Red
    exit 1
}

$data = $jsonOut | ConvertFrom-Json

# ── people_catalog ──────────────────────────────────────────────
Write-Host "`nMigrando people_catalog ($($data.people_catalog.Count) registros)..." -ForegroundColor Yellow
foreach ($r in $data.people_catalog) {
    $res = Exec-Turso `
        "INSERT OR IGNORE INTO people_catalog (id,name,role,phone,email,guardian_person_id,guardian_name,supervisor_sector,is_coordinator,rcm_progress,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)" `
        @($r.id, $r.name, $r.role, $r.phone, $r.email, $r.guardian_person_id, $r.guardian_name, $r.supervisor_sector, $r.is_coordinator, $r.rcm_progress, $r.created_at, $r.updated_at)
    if ($res -eq "SKIP") { Write-Host "  SKIP (ya existe): $($r.name)" -ForegroundColor DarkGray }
    else { Write-Host "  + $($r.name)" -ForegroundColor Green }
}

# ── cell_catalog ─────────────────────────────────────────────────
Write-Host "`nMigrando cell_catalog ($($data.cell_catalog.Count) registros)..." -ForegroundColor Yellow
foreach ($r in $data.cell_catalog) {
    $res = Exec-Turso `
        "INSERT OR IGNORE INTO cell_catalog (id,cell_number,network_name,sector,zone_name,district_name,address,leader_person_id,assistant_person_id,host_person_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)" `
        @($r.id, $r.cell_number, $r.network_name, $r.sector, $r.zone_name, $r.district_name, $r.address, $r.leader_person_id, $r.assistant_person_id, $r.host_person_id, $r.created_at, $r.updated_at)
    if ($res -eq "SKIP") { Write-Host "  SKIP: célula $($r.cell_number)" -ForegroundColor DarkGray }
    else { Write-Host "  + Célula $($r.cell_number)" -ForegroundColor Green }
}

# ── cell_membership ───────────────────────────────────────────────
Write-Host "`nMigrando cell_membership ($($data.cell_membership.Count) registros)..." -ForegroundColor Yellow
foreach ($r in $data.cell_membership) {
    $res = Exec-Turso `
        "INSERT OR IGNORE INTO cell_membership (cell_id,person_id,created_at) VALUES (?,?,?)" `
        @($r.cell_id, $r.person_id, $r.created_at)
    if ($res -ne "SKIP") { Write-Host "  + cell=$($r.cell_id) person=$($r.person_id)" -ForegroundColor Green }
}

# ── reports ────────────────────────────────────────────────────────
Write-Host "`nMigrando reports ($($data.reports.Count) registros)..." -ForegroundColor Yellow
foreach ($r in $data.reports) {
    $res = Exec-Turso `
        "INSERT OR IGNORE INTO reports (id,employee_name,area,device_model,imei,phone_number,status,notes,payload_json,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)" `
        @($r.id, $r.employee_name, $r.area, $r.device_model, $r.imei, $r.phone_number, $r.status, $r.notes, $r.payload_json, $r.created_at, $r.updated_at)
    if ($res -ne "SKIP") { Write-Host "  + Reporte ID=$($r.id)" -ForegroundColor Green }
}

# ── app_settings ───────────────────────────────────────────────────
Write-Host "`nMigrando app_settings ($($data.app_settings.Count) registros)..." -ForegroundColor Yellow
foreach ($r in $data.app_settings) {
    $res = Exec-Turso `
        "INSERT OR IGNORE INTO app_settings (key,value,updated_at) VALUES (?,?,?)" `
        @($r.key, $r.value, $r.updated_at)
    if ($res -ne "SKIP") { Write-Host "  + $($r.key)" -ForegroundColor Green }
}

Write-Host "`nMigracion completada!" -ForegroundColor Cyan
