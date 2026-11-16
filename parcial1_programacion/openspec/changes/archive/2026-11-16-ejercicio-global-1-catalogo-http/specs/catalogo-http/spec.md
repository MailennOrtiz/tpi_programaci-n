# Spec — catalogo-http

## ADDED Requirements

### Requirement: URL base centralizada y cliente HTTP

El frontend MUST centralizar la URL base de la API en un único módulo (`js/api.js`) y realizar todas las peticiones mediante `fetch`, usando `/api` como prefijo público.

#### Scenario: Petición al catálogo

- **WHEN** se carga el catálogo
- **THEN** se ejecuta `fetch("/api/libros/?limit=20&offset=0")` y se renderiza la lista devuelta.

### Requirement: Carga y filtro por título

El catálogo MUST cargar `GET /libros/` enviando `titulo` para la búsqueda parcial sin distinguir mayúsculas, con `limit` (1 a 100, por defecto 20) y `offset` (desde 0). Al cambiar el filtro, MUST reiniciar el desplazamiento a 0.

#### Scenario: Búsqueda sin coincidencias

- **WHEN** el filtro no coincide con ningún libro
- **THEN** se muestra el mensaje de sin coincidencias y se oculta el listado.

### Requirement: Visualización de campos y autores

Cada tarjeta MUST mostrar título, ISBN, precio, editorial y género («Sin clasificar» si es nulo). Los autores MUST obtenerse mediante `GET /libros/{id}`.

#### Scenario: Género nulo

- **WHEN** un libro tiene género nulo
- **THEN** se muestra «Sin clasificar».

### Requirement: Estados diferenciados

La interfaz MUST diferenciar carga, lista vacía, búsqueda sin coincidencias y error de conexión.

#### Scenario: Error de conexión

- **WHEN** la API no responde
- **THEN** se muestra un mensaje de error de conexión.

### Requirement: Paginación

El catálogo MUST soportar paginación con `limit` y `offset`, con controles Anterior/Siguiente.

#### Scenario: Página siguiente

- **WHEN** hay más resultados
- **THEN** se habilita el botón Siguiente y se avanza el offset.