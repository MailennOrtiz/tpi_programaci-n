# Despliegue de la librería web integrada

URL pública actual: [Librería Nya](https://libreria-grupo1.devgonzalosanchez.me/). El dominio anterior se conserva en las evidencias históricas del Global.

## Servicios en Easypanel

Configurá ambos servicios App en el mismo proyecto y usá la instancia PostgreSQL asignada. Seleccioná el repositorio del Global y la misma revisión para los dos servicios.

| Servicio | Build Path | Builder | Puerto | Acceso |
| --- | --- | --- | --- | --- |
| Backend | `/parcial2_programacion` | `Dockerfile` | 8000 | Red interna |
| Frontend | `/parcial1_programacion` | `Dockerfile` | 80 | HTTPS público, HTTP al contenedor |
| PostgreSQL | Servicio asignado | — | 5432 o el puerto asignado | Red interna con almacenamiento persistente |

Las rutas anteriores corresponden al repositorio de GitHub. Si se publica el contenido del ZIP con sus nombres de carpeta, usá `/backend` y `/frontend` como rutas de compilación.

| Variable | Servicio | Valor |
| --- | --- | --- |
| `DATABASE_URL` | Backend | `postgresql+asyncpg://usuario:password@host:5432/libreria` con las credenciales y el host internos |
| `SQL_ECHO` | Backend | `false` |
| `CORS_ORIGINS` | Backend | Origen HTTPS exacto del frontend, con esquema y sin barra final |
| `API_UPSTREAM` | Frontend | Nombre interno del backend seguido por `:8000` |

Los valores de muestra están en [el ejemplo del frontend](parcial1_programacion/env.example) y [el del backend](parcial2_programacion/env.example).

1. Reservá el dominio HTTPS del frontend. Configurá PostgreSQL con almacenamiento persistente y cargá las variables del backend desde el panel.
2. Desplegá el backend, revisá los logs y quitá su dominio automático si se creó para este despliegue. La imagen inicia Uvicorn en `0.0.0.0:8000`. Al arrancar, la API usa `SQLModel.metadata.create_all` para crear tablas faltantes. Para reutilizar una base, su esquema debe ser compatible con los modelos. Los cambios de estructura sobre tablas existentes se aplican por separado.
3. Desde la Shell del backend, comprobá salud y, si la base de prueba está vacía, ejecutá la carga inicial:

   ```sh
   python -c "from urllib.request import urlopen; print(urlopen('http://127.0.0.1:8000/health/ready').status)"
   python -m app.datos_iniciales
   python -c "from urllib.request import urlopen; print(urlopen('http://127.0.0.1:8000/libros/').read().decode())"
   ```

4. Configurá y desplegá el frontend. Nginx recibe `API_UPSTREAM` sin esquema ni barra final. Su proxy quita el prefijo `/api/`, por lo que `/api/libros/` llega al backend como `/libros/`.
5. Desde la URL pública, comprobá que la web carga por HTTPS y que `/api/health/ready` devuelve 200. Ejecutá G-01 a G-07 y registrá los resultados y capturas en [evidencia/](evidencia/README.md).

## Actualización y persistencia

1. Publicá la revisión aprobada y redesplegá los servicios App que correspondan desde Easypanel.
2. Para G-07, guardá antes del redespliegue el ID y detalle de una venta ficticia creada durante G-04.
3. Recreá el contenedor del backend conservando el servicio PostgreSQL, su volumen y `DATABASE_URL`. Registrá el reemplazo del contenedor y esperá el 200 de salud.
4. Desde la URL pública, consultá otra vez el mismo ID sin repetir la carga inicial. Compará el cliente, los renglones, los precios unitarios y el total. Guardá las respuestas de antes y después.

## Registro histórico de ejecución

| Dato | Resultado |
| --- | --- |
| Revisión inspeccionada | `234acba` |
| Backend del Global | Easypanel marcó el despliegue como exitoso el 16/11/2026 a las 13:48 (Argentina). Servicio `app_grupo1/libreria_backend`, fuente `MailennOrtiz/tpi_programaci-n`, rama `main`, ruta `/parcial2_programacion`. |
| Salud y catálogo del backend en el VPS | El endpoint HTTPS `/health/ready` indicó que PostgreSQL estaba disponible. `/libros/?limit=2&offset=0` devolvió dos libros preexistentes. |
| Configuración activa del backend | Se aplicó `CORS_ORIGINS` con el origen HTTPS del frontend y se quitó el dominio directo. Tras el cambio, la web pública siguió mostrando el catálogo y `/api/health/ready` informó que PostgreSQL estaba disponible. |
| Alembic sobre PostgreSQL existente | Docker construyó la imagen `libreria-backend-alembic:latest` (`ade5e94ab14c`). Se ejecutó `alembic upgrade head` dos veces. Quedó registrada la revisión `20261116_01`; *Rayuela* (25000.00, stock 10) y *Respiración artificial* (27000.00, stock 8) conservaron sus IDs, precios y stock. |
| Alembic sobre PostgreSQL vacío | El contenedor inició con su comando habitual sobre `libreria_alembic_vacia`. Quedó registrada la revisión `20261116_01`, el catálogo tenía 0 libros y `/health/ready` respondió `{"estado":"listo","base_de_datos":"disponible"}`. |
| Frontend del Global | Easypanel marcó el despliegue como exitoso el 16/11/2026 a las 13:51 (Argentina). Servicio `app_grupo1/libreria_frontend`, rama `main`, ruta `/parcial1_programacion`, builder `Dockerfile` y `API_UPSTREAM=app_grupo1_libreria_backend:8000`. |
| URL pública usada para estas pruebas | [Dominio anterior](https://app-grupo1-libreria-frontend.ldb9fn.easypanel.host/). El navegador mostró el catálogo existente y `/api/health/ready` respondió `{"estado":"listo","base_de_datos":"disponible"}`. |
| Docker local del frontend | Build y ejecución verificados el 16/11/2026 en Ubuntu (WSL), con Docker 29.1.3. Imagen `libreria-frontend:latest` (`5f74e0129a39`), publicada en `127.0.0.1:8080`. |
| Salud y catálogo locales | Nginx devolvió HTTP 200 en `/api/health/ready` y `/api/libros/?limit=20&offset=0`. PostgreSQL reportó disponibilidad y el catálogo devolvió *Rayuela* y *Respiración artificial*. |
| Detalle en el navegador | Maximiliano confirmó que el detalle de *Rayuela* mostró a Julio Cortázar como autor el 16/11/2026. |
| Casos G-01 a G-07 | [Registro de verificación](evidencia/README.md) |
| Persistencia tras redespliegue | Easypanel informó éxito a las 13:57:59 del 16/11/2026 (Argentina). Desde el frontend público, la venta 5 devolvió el mismo JSON antes y después, con cliente 6, dos renglones y total 27500.00. Se conservó PostgreSQL y no se volvió a cargar la base. |
