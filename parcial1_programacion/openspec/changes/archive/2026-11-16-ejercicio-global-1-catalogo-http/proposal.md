# Proposal — ejercicio-global-1-catalogo-http

## Why

El frontend «Libreria Nya» (parcial 1) simula el catálogo con datos locales en memoria. La Evaluación Global exige conectar las pantallas con la API de FastAPI mediante JavaScript nativo, usando `/api` como prefijo público. El Ejercicio 1 (20 puntos) requiere centralizar la URL base y las peticiones con `fetch`, cargar `GET /libros/` con filtro parcial por título, paginación `limit`/`offset`, detalle por ID (incluyendo autores) y diferenciar los estados de carga, lista vacía, búsqueda sin coincidencias y error de conexión.

## What Changes

- Nuevo `js/api.js` con `API_BASE_URL = "/api"` y `apiFetch()` centralizado, con manejo de errores `{"detail": ...}` (cadena o lista).
- Reescritura de `js/catalogo.js` para consumir la API: `GET /libros/?limit=&offset=&titulo=`, reset de offset al cambiar el filtro, tarjetas con título, ISBN, precio, editorial y género (nulo → «Sin clasificar»), botón de detalle que consulta `GET /libros/{id}` para mostrar autores, paginación Anterior/Siguiente y estados de carga/vacío/sin coincidencias/error.
- `index.html`: mensajes de carga y error, contenedor de paginación y de detalle; enlace de `api.js`.

## Capabilities

### New Capabilities

- `catalogo-http`: catálogo cargado desde la API con filtro parcial por título, paginación y detalle de libro con autores.

### Modified Capabilities

- Ninguno. Los specs existentes del parcial 1 describen el catálogo local; este change agrega comportamiento de red sin modificar sus requisitos de estructura.

## Impact

- Archivos modificados: `index.html`, `js/catalogo.js`.
- Archivos nuevos: `js/api.js`.
- Dependencias: ninguna nueva (fetch nativo). Requiere backend FastAPI accesible bajo `/api` (Nginx en producción; directo en desarrollo).
- Los módulos de altas/ventas siguen usando datos locales hasta los Ejercicios 2 y 3.