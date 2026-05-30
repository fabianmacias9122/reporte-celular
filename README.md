# Reporte Celular

Proyecto aislado del visualizador original. Este directorio contiene una base nueva para migrar el reporte PDF a una app web con backend Python, frontend estatico y SQLite.

## Stack

- Flask
- SQLite
- HTML, CSS y JavaScript sin framework

## Estructura

```text
reporte-celular/
|-- README.md
|-- requirements.txt
|-- start-reporte-celular.ps1
|-- data/
|-- public/
|   |-- index.html
|   |-- app.css
|   `-- app.js
`-- server/
    `-- app.py
```

## Arranque local

1. Crea un entorno virtual si quieres aislar dependencias.
2. Instala dependencias con `pip install -r requirements.txt`.
3. Ejecuta `./start-reporte-celular.ps1`.
4. Abre `http://127.0.0.1:8090`.

## Base de datos

La app crea automaticamente `data/reporte-celular.db` en el primer arranque.

## Hosting gratuito

Para SQLite, conviene un hosting Python con disco persistente. La opcion mas practica para arrancar es PythonAnywhere. Si el proyecto crece, despues se puede migrar a Postgres sin rehacer el frontend.

## API inicial

- `GET /api/health`
- `GET /api/reports`
- `POST /api/reports`
- `GET /api/reports/<id>`
- `PUT /api/reports/<id>`
- `DELETE /api/reports/<id>`

## Produccion: backfill seguro de processEntry

El tracking de `Control del proceso` usa `processEntry` dentro de `reports.payload_json`.
No requiere cambio de esquema en `reports`, pero para historicos viejos puede hacer falta un backfill.

### Garantias

- No toca contrasenas ni tablas de autenticacion.
- No borra reportes.
- Solo completa `processEntry` donde falta y reconstruye tracking derivado.

### Orden recomendado

1. Congelar captura durante la ventana de mantenimiento.
2. Confirmar snapshot o backup de produccion.
3. Hacer deploy del backend compatible.
4. Ejecutar primero `dry-run` contra Turso.
5. Si los conteos son correctos, aplicar el backfill real.
6. Validar login, reportes y `Seguimiento -> Metas`.

### Variables de entorno

```powershell
$env:TURSO_DATABASE_URL="TU_URL"
$env:TURSO_AUTH_TOKEN="TU_TOKEN"
```

### Dry-run

```powershell
python scripts\backfill_legacy_process_entries.py --dry-run
```

Revisar los conteos de salida antes de continuar:

- `reports_changed`
- `visitors_changed`
- `inferred_noted`
- `inferred_late`
- `legacy_late_promoted`

### Aplicacion real

Solo correr esto despues de confirmar que ya existe backup remoto:

```powershell
python scripts\backfill_legacy_process_entries.py --confirmed-backup
```

### Rollback

Si algo falla:

1. Restaurar snapshot de produccion.
2. Volver al backend anterior.
3. Validar login y carga de reportes.
