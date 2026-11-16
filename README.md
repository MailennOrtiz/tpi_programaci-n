# Librería web integrada — Global de Programación III

Frontend (`parcial1_programacion/`) y backend (`parcial2_programacion/`) integrados.

## Ejecución local

### Backend
```powershell
cd parcial2_programacion
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item env.example .env
# Editar .env con DATABASE_URL (postgresql+asyncpg) y CORS_ORIGINS
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
.\.venv\Scripts\python.exe -m app.datos_iniciales
```

### Frontend
Abrir `parcial1_programacion/public/index.html` en el navegador (o servir la carpeta). Para conectar a la API local, cambiar temporalmente `API_BASE_URL` en `public/js/api.js` a `http://127.0.0.1:8000` y configurar `CORS_ORIGINS`.

## Consultas por ID (decisión de integración)

- Autores: se verifica cada ID con `GET /autores/{id}` y se muestra el nombre antes de agregarlo a la autoría.
- Clientes: se busca por ID con `GET /clientes/{id}` y se muestra el nombre antes de seleccionarlo para una venta (el backend no expone listado de clientes).

## Despliegue

Ver `DEPLOY.md`.