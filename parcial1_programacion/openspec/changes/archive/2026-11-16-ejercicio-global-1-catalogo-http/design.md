# Design — ejercicio-global-1-catalogo-http

## Approach

- `js/api.js` define `API_BASE_URL = "/api"` y `apiFetch(ruta, opciones)` que agrega `Content-Type: application/json`, parsea JSON y lanza un `Error` con `status` y `detail` (cadena o lista) cuando `!respuesta.ok`.
- `js/catalogo.js` mantiene estado `offsetCatalogo`, `tituloBusquedaCatalogo`, `cargandoCatalogo` y un temporizador de debounce para la búsqueda en vivo.
- `cargarCatalogo()` construye `URLSearchParams` con `limit`, `offset` y `titulo` (si aplica), llama `apiFetch("/libros/?...")`, renderiza tarjetas y actualiza paginación.
- `actualizarCatalogo(texto)` actualiza el título y resetea `offset` si cambió, luego carga.
- `verDetalleLibro(id)` consulta `GET /libros/{id}` y renderiza autores con rol y orden.
- Estados: `mensaje-cargando-catalogo`, `mensaje-sin-resultados`, `mensaje-catalogo-vacio`, `mensaje-error-catalogo`.

## Decisions

- Se usa `/api` como base (sin host) para funcionar detrás de Nginx; en desarrollo se puede cambiar temporalmente a `http://127.0.0.1:8000`.
- Autores solo en el detalle (no en el listado) para evitar N+1 en la carga inicial.
- Paginación por tamaño de página (20) sin total del servidor (la API devuelve arrays, sin envoltorio).

## Risks

- Sin total de resultados, el botón "Siguiente" se habilita cuando la página viene completa (heurística).