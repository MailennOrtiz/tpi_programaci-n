const LIMITE_CATALOGO = 20;
let offsetCatalogo = 0;
let tituloBusquedaCatalogo = "";
let cargandoCatalogo = false;
let temporizadorBusquedaCatalogo = null;

function obtenerLibros() {
  // Se mantiene para los módulos que aún usan los datos locales.
  return libros;
}

function construirIndiceEditoriales() {
  const indice = {};
  editoriales.forEach((editorial) => {
    indice[editorial.idEditorial] = editorial.nombre;
  });
  return indice;
}

function construirIndiceGeneros() {
  const indice = {};
  generos.forEach((genero) => {
    indice[genero.idGenero] = genero.nombre;
  });
  return indice;
}

function construirIndiceAutores() {
  const indice = {};
  autores.forEach((autor) => {
    indice[autor.idAutor] = autor.nombre;
  });
  return indice;
}

const indiceEditoriales = construirIndiceEditoriales();
const indiceGeneros = construirIndiceGeneros();
const indiceAutores = construirIndiceAutores();

function resolverNombreEditorial(libro) {
  if (libro.editorial && libro.editorial.nombre) return libro.editorial.nombre;
  return indiceEditoriales[libro.idEditorial] || "Editorial no encontrada";
}

function resolverGenero(libro) {
  if (libro.genero && libro.genero.nombre) return libro.genero.nombre;
  if (libro.idGenero === null || libro.genero === null) return "Sin clasificar";
  return indiceGeneros[libro.idGenero] || "Sin clasificar";
}

function resolverNombresAutores(libro) {
  if (Array.isArray(libro.autores)) {
    return libro.autores
      .slice()
      .sort((a, b) => (a.orden || 0) - (b.orden || 0))
      .map((item) => {
        const nombre = item.autor && item.autor.nombre ? item.autor.nombre : "";
        return item.rol ? `${nombre} (${item.rol})` : nombre;
      })
      .filter(Boolean)
      .join(", ");
  }
  const nombres = [];
  (libro.idsAutores || []).forEach((idAutor) => {
    const nombre = indiceAutores[idAutor];
    if (nombre) nombres.push(nombre);
  });
  return nombres.join(", ");
}

function normalizarTexto(texto) {
  return (texto || "").trim().toLowerCase();
}

function formatearPrecio(valor) {
  const numero = Number(valor);
  if (Number.isNaN(numero)) return valor;
  return numero.toFixed(2);
}

function crearTarjetaLibro(libro) {
  const tarjeta = document.createElement("article");
  tarjeta.className = "tarjeta-libro";

  const encabezado = document.createElement("h3");
  encabezado.textContent = libro.titulo;
  tarjeta.appendChild(encabezado);

  const campos = [
    { etiqueta: "Título", valor: libro.titulo },
    { etiqueta: "ISBN", valor: libro.isbn },
    { etiqueta: "Editorial", valor: resolverNombreEditorial(libro) },
    { etiqueta: "Género", valor: resolverGenero(libro) },
    { etiqueta: "Precio", valor: formatearPrecio(libro.precio) }
  ];

  campos.forEach((campo) => {
    const parrafo = document.createElement("p");
    parrafo.textContent = campo.etiqueta + ": ";
    const valor = document.createElement("span");
    valor.textContent = campo.valor;
    parrafo.appendChild(valor);
    tarjeta.appendChild(parrafo);
  });

  const botonDetalle = document.createElement("button");
  botonDetalle.type = "button";
  botonDetalle.className = "boton boton-secundario";
  botonDetalle.textContent = "Ver detalle y autores";

  const detalleTarjeta = document.createElement("div");
  detalleTarjeta.className = "detalle-libro-tarjeta";
  detalleTarjeta.hidden = true;

  botonDetalle.addEventListener("click", async () => {
    if (typeof verDetalleLibro === "function") {
      verDetalleLibro(libro.id);
    }

    if (!detalleTarjeta.hidden) {
      detalleTarjeta.hidden = true;
      botonDetalle.textContent = "Ver detalle y autores";
      return;
    }

    detalleTarjeta.hidden = false;
    detalleTarjeta.textContent = "Cargando detalle y autores...";
    botonDetalle.textContent = "Ocultar detalle y autores";

    try {
      const libroCompleto = await apiFetch(`/libros/${libro.id}`);
      const autores = resolverNombresAutores(libroCompleto) || "Sin autores";
      detalleTarjeta.replaceChildren();

      const lineas = [
        `Editorial: ${resolverNombreEditorial(libroCompleto)}`,
        `Género: ${resolverGenero(libroCompleto)}`,
        `Autores: ${autores}`,
        `Stock: ${libroCompleto.stock}`,
        `Precio: $${formatearPrecio(libroCompleto.precio)}`
      ];

      lineas.forEach((texto) => {
        const p = document.createElement("p");
        p.textContent = texto;
        detalleTarjeta.appendChild(p);
      });
    } catch (e) {
      detalleTarjeta.textContent = mensajeErrorApi(e) || "No se pudo cargar el detalle.";
    }
  });

  tarjeta.appendChild(botonDetalle);
  tarjeta.appendChild(detalleTarjeta);

  return tarjeta;
}

function renderizarCatalogo(librosAMostrar) {
  const listado = document.getElementById("listado-catalogo");
  listado.replaceChildren(...librosAMostrar.map((libro) => crearTarjetaLibro(libro)));
}

function mostrarCargandoCatalogo(mostrar) {
  const el = document.getElementById("mensaje-cargando-catalogo");
  if (el) el.hidden = !mostrar;
}

function ocultarMensajesCatalogo() {
  const sinResultados = document.getElementById("mensaje-sin-resultados");
  const vacio = document.getElementById("mensaje-catalogo-vacio");
  const error = document.getElementById("mensaje-error-catalogo");
  if (sinResultados) sinResultados.hidden = true;
  if (vacio) vacio.hidden = true;
  if (error) error.hidden = true;
}

function mostrarErrorCatalogo(mensaje) {
  const el = document.getElementById("mensaje-error-catalogo");
  if (el) {
    if (mensaje) el.textContent = mensaje;
    el.hidden = false;
  }
}

function actualizarPaginacionCatalogo(cantidadRecibida) {
  const contenedor = document.getElementById("paginacion-catalogo");
  const anterior = document.getElementById("catalogo-anterior");
  const siguiente = document.getElementById("catalogo-siguiente");
  const info = document.getElementById("catalogo-pagina-info");
  if (!contenedor || !anterior || !siguiente || !info) return;

  const hayAnterior = offsetCatalogo > 0;
  const haySiguiente = cantidadRecibida >= LIMITE_CATALOGO;
  if (!hayAnterior && !haySiguiente) {
    contenedor.hidden = true;
    return;
  }
  contenedor.hidden = false;
  anterior.disabled = !hayAnterior;
  siguiente.disabled = !haySiguiente;
  const pagina = Math.floor(offsetCatalogo / LIMITE_CATALOGO) + 1;
  info.textContent = `Página ${pagina}`;
}

function actualizarEstadoCatalogo(librosRecibidos) {
  const listado = document.getElementById("listado-catalogo");
  const sinResultados = document.getElementById("mensaje-sin-resultados");
  const vacio = document.getElementById("mensaje-catalogo-vacio");

  ocultarMensajesCatalogo();
  listado.hidden = false;

  if (!Array.isArray(librosRecibidos) || librosRecibidos.length === 0) {
    if (tituloBusquedaCatalogo.trim() !== "") {
      if (sinResultados) sinResultados.hidden = false;
    } else {
      if (vacio) vacio.hidden = false;
    }
    listado.hidden = true;
  }

  actualizarPaginacionCatalogo(Array.isArray(librosRecibidos) ? librosRecibidos.length : 0);
}

async function cargarCatalogo() {
  if (cargandoCatalogo) return;
  cargandoCatalogo = true;
  mostrarCargandoCatalogo(true);
  ocultarMensajesCatalogo();
  const params = new URLSearchParams();
  params.set("limit", String(LIMITE_CATALOGO));
  params.set("offset", String(offsetCatalogo));
  if (tituloBusquedaCatalogo.trim() !== "") {
    params.set("titulo", tituloBusquedaCatalogo.trim());
  }
  try {
    const librosRecibidos = await apiFetch(`/libros/?${params.toString()}`);
    renderizarCatalogo(Array.isArray(librosRecibidos) ? librosRecibidos : []);
    actualizarEstadoCatalogo(Array.isArray(librosRecibidos) ? librosRecibidos : []);
  } catch (error) {
    renderizarCatalogo([]);
    mostrarErrorCatalogo(mensajeErrorApi(error) || "No se pudo conectar con el servidor.");
    const paginacion = document.getElementById("paginacion-catalogo");
    if (paginacion) paginacion.hidden = true;
  } finally {
    cargandoCatalogo = false;
    mostrarCargandoCatalogo(false);
  }
}

function actualizarCatalogo(textoBusqueda) {
  const nuevoTitulo = textoBusqueda == null ? "" : String(textoBusqueda);
  const cambio = nuevoTitulo.trim() !== tituloBusquedaCatalogo.trim();
  tituloBusquedaCatalogo = nuevoTitulo;
  if (cambio) offsetCatalogo = 0;
  cargarCatalogo();
}

function programarBusquedaCatalogo(texto) {
  if (temporizadorBusquedaCatalogo) clearTimeout(temporizadorBusquedaCatalogo);
  temporizadorBusquedaCatalogo = setTimeout(() => {
    actualizarCatalogo(texto);
  }, 300);
}

async function verDetalleLibro(id) {
  const contenedor = document.getElementById("detalle-libro");
  if (!contenedor) return;
  contenedor.hidden = false;
  contenedor.textContent = "Cargando detalle...";
  try {
    const libro = await apiFetch(`/libros/${id}`);
    const autores = resolverNombresAutores(libro) || "Sin autores";
    contenedor.replaceChildren();
    const titulo = document.createElement("h3");
    titulo.textContent = libro.titulo;
    contenedor.appendChild(titulo);
    const lineas = [
      `ISBN: ${libro.isbn}`,
      `Editorial: ${resolverNombreEditorial(libro)}`,
      `Género: ${resolverGenero(libro)}`,
      `Autores: ${autores}`,
      `Precio: ${formatearPrecio(libro.precio)}`,
      `Stock: ${libro.stock}`
    ];
    lineas.forEach((linea) => {
      const p = document.createElement("p");
      p.textContent = linea;
      contenedor.appendChild(p);
    });
  } catch (error) {
    contenedor.textContent = mensajeErrorApi(error) || "No se pudo cargar el detalle.";
  }
}

function registrarEventosCatalogo() {
  const buscador = document.getElementById("buscador-catalogo");
  const campoBusqueda = document.getElementById("busqueda-titulo");
  if (buscador) {
    buscador.addEventListener("submit", (evento) => {
      evento.preventDefault();
      if (temporizadorBusquedaCatalogo) clearTimeout(temporizadorBusquedaCatalogo);
      actualizarCatalogo(campoBusqueda.value);
    });
  }
  if (campoBusqueda) {
    campoBusqueda.addEventListener("input", (evento) => {
      programarBusquedaCatalogo(evento.target.value);
    });
  }
  const anterior = document.getElementById("catalogo-anterior");
  const siguiente = document.getElementById("catalogo-siguiente");
  if (anterior) {
    anterior.addEventListener("click", () => {
      if (offsetCatalogo >= LIMITE_CATALOGO) {
        offsetCatalogo -= LIMITE_CATALOGO;
        cargarCatalogo();
      }
    });
  }
  if (siguiente) {
    siguiente.addEventListener("click", () => {
      offsetCatalogo += LIMITE_CATALOGO;
      cargarCatalogo();
    });
  }
}

// Inicialización
cargarCatalogo();
registrarEventosCatalogo();