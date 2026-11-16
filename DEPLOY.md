# Despliegue — Librería web integrada (Global Programación III)

## Componentes

- **Frontend**: `parcial1_programacion/` (HTML/CSS/JS nativos + Nginx). Build path: `/frontend` (o raíz de la carpeta frontend).
- **Backend**: `parcial2_programacion/` (FastAPI + PostgreSQL). Build path: `/backend`.

## Variables de entorno

### Backend
- `DATABASE_URL=postgresql+asyncpg://usuario:password@host:5432/libreria`
- `SQL_ECHO=false`
- `CORS_ORIGINS=https://<dominio-frontend>` (sin barra final; incluir protocolo y puerto si aplica)

### Frontend (Nginx)
- `API_UPSTREAM=<nombre-interno-backend>:8000` (sin `http://` ni barra final)

## Pasos en Easypanel

1. Crear un proyecto (ej. `grupo`).
2. **Servicio backend** (App):
   - Source: repositorio, rama, Build Path `/backend` (o carpeta backend).
   - Build: Dockerfile, ruta `Dockerfile`.
   - Environment: `DATABASE_URL`, `SQL_ECHO`, `CORS_ORIGINS`.
   - Puerto interno: 8000. Mantener en red interna (quitar dominio automático).
   - Deploy; verificar logs y `alembic upgrade head`.
   - Shell: `python -c "from urllib.request import urlopen; print(urlopen('http://127.0.0.1:8000/health/ready').status)"` → 200.
   - Cargar datos: `python -m app.datos_iniciales` (solo base vacía).
3. **Servicio frontend** (App):
   - Source: repositorio, rama, Build Path `/frontend`.
   - Build: Dockerfile, ruta `Dockerfile`.
   - Environment: `API_UPSTREAM=<backend-interno>:8000`.
   - Domains: HTTPS, protocolo interno HTTP, puerto 80.
   - Deploy.
4. Verificar `https://<dominio>/api/health/ready` → 200. Probar catálogo y registrar una venta.

## Puertos y proxy

- Frontend (Nginx): 80 interno → 443 externo (HTTPS).
- Backend (Uvicorn): 8000 interno (no público).
- PostgreSQL: privado (sin publicar).
- Nginx reenvía `/api/` → backend (`proxy_pass http://${API_UPSTREAM}/`), por lo que `/api/libros/` llega como `/libros/`.

## Migraciones y carga inicial

- Backend aplica `alembic upgrade head` al arrancar (según Dockerfile).
- Carga inicial: `python -m app.datos_iniciales` (inserta editorial, género, 2 autores, 2 libros, 1 cliente; no borra datos).

## Casos de verificación (G-01 a G-07)

- G-01 Catálogo: búsqueda por título, paginación con limit/offset, búsqueda sin coincidencias, detalle de libro.
- G-02 Alta de libro: libro con stock, género opcional y autorías; repetir ISBN → 409.
- G-03 Alta de cliente: crear y recuperar por ID; repetir email → 409.
- G-04 Venta: venta válida de dos renglones; 201; detalle tras recargar.
- G-05 Precio histórico: `PATCH /libros/{id}` cambia precio; venta anterior conserva importes.
- G-06 Rechazo: ID inexistente → 409; renglones repetidos → 422; historial igual.
- G-07 Despliegue: imagen del frontend se construye; URL pública HTTPS; API salud 200; datos persisten tras redespliegue.

## Actualización

1. Commit y push de los cambios.
2. En Easypanel, pulsar Redeploy en frontend y/o backend.
3. Verificar salud y datos.