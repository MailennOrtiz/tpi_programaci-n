# Librería web integrada — Global de Programación III

Frontend (`parcial1_programacion/`) y backend (`parcial2_programacion/`) integrados.

## Integrantes

- Maximiliano Mendez
- Leonel Fachinelli
- Román Avila
- Mailen Ortiz
- Gabriel D'Anna
- Gonzalo Sanchez

## Ejecución local

### Backend
```powershell
cd parcial2_programacion
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item env.example .env
# Editar .env con DATABASE_URL (postgresql+asyncpg) y CORS_ORIGINS
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Con Uvicorn en ejecución, abrí otra terminal en `parcial2_programacion/`. Si la base de prueba está vacía, cargá el catálogo, los autores y el cliente inicial:

```powershell
.\.venv\Scripts\python.exe -m app.datos_iniciales
```

### Frontend

Desde la raíz del repositorio, con Docker Desktop y la API en ejecución:

```powershell
docker info
docker build -t libreria-frontend ./parcial1_programacion
docker run --rm --name libreria-frontend -p 127.0.0.1:8080:80 -e API_UPSTREAM=host.docker.internal:8000 libreria-frontend
```

En Docker Engine sobre Linux, agregá `--add-host=host.docker.internal:host-gateway` antes del nombre de la imagen. Abrí `http://127.0.0.1:8080`, buscá un libro y consultá su detalle. Desde otra terminal verificá el proxy:

```powershell
curl.exe -i http://127.0.0.1:8080/api/health/ready
curl.exe -i 'http://127.0.0.1:8080/api/libros/?limit=20&offset=0'
```

## Consultas por ID (decisión de integración)

- Autores: se verifica cada ID con `GET /autores/{id}` y se muestra el nombre antes de agregarlo a la autoría.
- Clientes: se busca por ID con `GET /clientes/{id}` y se muestra el nombre antes de seleccionarlo para una venta (el backend no expone listado de clientes).

## Despliegue

Ver [DEPLOY.md](DEPLOY.md) y el [registro de verificación](evidencia/README.md).
