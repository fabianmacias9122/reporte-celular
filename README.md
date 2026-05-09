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
