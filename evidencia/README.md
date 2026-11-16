# Verificación del Global

Ejecutado el 16/11/2026 sobre [Librería Nya](https://app-grupo1-libreria-frontend.ldb9fn.easypanel.host/) (revisión `234acba`). Las comprobaciones de códigos HTTP de rechazo y el cambio temporal de precio se hicieron desde el Swagger del backend público del mismo despliegue.

| Caso | Pasos y resultado esperado | Resultado observado |
| --- | --- | --- |
| G-01 · Catálogo | Buscar, paginar y abrir el detalle. | La búsqueda «Rayuela» encontró el libro de prueba. El detalle abrió y mostró «Sin autores» para ese registro. Una búsqueda sin coincidencias mostró el aviso. Con `limit=1`, los offsets 0 y 1 devolvieron los libros 1 y 4, respectivamente. |
| G-02 · Alta de libro | Crear, consultar y repetir el ISBN. | Libro 6, stock 8, género nulo y autoría de Autor Global G02 (ID 1). El detalle confirmó esos datos. El ISBN repetido devolvió HTTP 409. |
| G-03 · Alta de cliente | Crear, consultar y repetir el email. | Cliente ficticio 6, recuperado por ID en la pantalla de ventas. El email repetido devolvió HTTP 409. |
| G-04 · Venta | Registrar dos renglones y abrir el detalle tras recargar. | La interfaz confirmó la venta 5 y, tras recargar, mostró sus dos renglones y total de 27500.00. Una segunda venta ficticia (ID 6, dos renglones, total 26250.00) confirmó el [HTTP 201 del alta](G-04-venta-6-http-201.jpg) en Swagger. |
| G-05 · Precio histórico | Cambiar el precio de un libro y volver a consultar la venta. | `PATCH /libros/1` devolvió HTTP 200 y cambió el precio de 2500.00 a 2600.00. En la venta 5 siguió figurando 2500.00 y el total siguió en 27500.00. Se restauró el precio original con otro PATCH 200. |
| G-06 · Rechazo | Enviar un ID inexistente y renglones repetidos. | La API devolvió HTTP 409 y HTTP 422, respectivamente. El historial final conservó los IDs 1 a 5. |
| G-07 · Despliegue | Revisar el build y consultar salud y venta tras el redespliegue. | El build del frontend tuvo éxito y la web abrió por HTTPS. Salud devolvió estado listo y base disponible. Easypanel marcó exitoso el redespliegue del backend a las 13:57:59 (Argentina). La respuesta JSON de la venta 5 fue idéntica antes y después. |

## Venta 5 antes y después

La [captura del historial público después del redespliegue](G-07-venta-5-despues.jpg) muestra la venta 5, sus dos renglones y el total de 27500.00.

La [captura de salud pública](G-07-salud-publica-http-200.png) muestra `HTTP/2 200` para `/api/health/ready` del frontend, observado el 16/11/2026 a las 14:29:58 (Argentina).

Consulta pública: `GET /api/ventas/5`. Comparación del JSON completo, incluidos ID, fecha, cliente, renglones e importes: idéntico antes y después del redespliegue. Cliente ficticio 6. Fecha registrada: `2026-11-16T16:55:03.088431Z`.

| Libro | Cantidad | Precio unitario | Subtotal |
| --- | ---: | ---: | ---: |
| 1 · Libro Prueba D03 | 1 | 2500.00 | 2500.00 |
| 4 · Rayuela (Prueba D03) | 1 | 25000.00 | 25000.00 |
| **Total** | | | **27500.00** |
