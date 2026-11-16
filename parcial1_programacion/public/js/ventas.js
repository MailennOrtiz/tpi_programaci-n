"use strict";

const LIMITE_HISTORIAL = 20;
let offsetHistorial = 0;
let clienteVenta = null; // { id, nombre }
const renglonesVenta = []; // { libro_id, titulo, cantidad, precioUnitario }
let librosApi = []; // catálogo cargado desde la API
let cargandoHistorial = false;

function formatearImporte(valor) {
  const n = Number(valor);
  if (Number.isNaN(n)) return valor;
  return n.toFixed(2);
}

async function cargarLibrosApi() {
  try {
    const recibidos = await apiFetch("/libros/?limit=100&offset=0");
    librosApi = Array.isArray(recibidos) ? recibidos : [];
  } catch (error) {
    librosApi = [];
  }
  poblarSelectorLibros();
}

function poblarSelectorLibros() {
  const selector = document.getElementById("renglon-libro");
  if (!selector) return;
  const seleccionado = selector.value;
  const opciones = [crearOpcion("", "Seleccioná un libro")];
  librosApi.forEach((libro) => {
    const opcion = crearOpcion(libro.id, `${libro.titulo} (${formatearImporte(libro.precio)})`);
    opciones.push(opcion);
  });
  selector.replaceChildren(...opciones);
  if (seleccionado) selector.value = seleccionado;
}

function crearOpcion(valor, texto) {
  const opcion = document.createElement("option");
  opcion.value = valor;
  opcion.textContent = texto;
  return opcion;
}

async function buscarClienteVenta() {
  const input = document.getElementById("venta-cliente-id");
  const mensaje = document.getElementById("cliente-seleccionado");
  const id = Number(input.value);
  if (!Number.isInteger(id) || id <= 0) {
    mensaje.replaceChildren();
    mensaje.classList.add("mensaje-error");
    mensaje.textContent = "Ingresá un ID de cliente válido.";
    clienteVenta = null;
    return;
  }
  try {
    const cliente = await apiFetch(`/clientes/${id}`);
    clienteVenta = { id: cliente.id, nombre: cliente.nombre };
    mensaje.classList.remove("mensaje-error");
    mensaje.classList.add("mensaje-exito");
    mensaje.textContent = `Cliente: ${cliente.nombre} (${cliente.email})`;
  } catch (error) {
    clienteVenta = null;
    mensaje.classList.remove("mensaje-exito");
    mensaje.classList.add("mensaje-error");
    mensaje.textContent = mensajeErrorApi(error) || "Cliente no encontrado.";
  }
}

function agregarRenglon() {
  const selector = document.getElementById("renglon-libro");
  const inputCantidad = document.getElementById("renglon-cantidad");
  const resultado = document.getElementById("resultado-venta");
  resultado.replaceChildren();
  resultado.classList.remove("mensaje-error", "mensaje-exito");

  const libroId = Number(selector.value);
  const cantidad = Number(inputCantidad.value);

  if (!Number.isInteger(libroId) || libroId <= 0) {
    mostrarMensajeVenta("Seleccioná un libro.", true);
    return;
  }
  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    mostrarMensajeVenta("La cantidad debe ser un entero positivo.", true);
    return;
  }
  if (renglonesVenta.some((r) => r.libro_id === libroId)) {
    mostrarMensajeVenta("Ese libro ya está en la venta.", true);
    return;
  }
  const libro = librosApi.find((l) => Number(l.id) === libroId);
  if (!libro) {
    mostrarMensajeVenta("Libro no encontrado en el catálogo.", true);
    return;
  }
  renglonesVenta.push({
    libro_id: libroId,
    titulo: libro.titulo,
    cantidad: cantidad,
    precioUnitario: libro.precio
  });
  renderizarRenglones();
  inputCantidad.value = "1";
}

function mostrarMensajeVenta(texto, esError) {
  const resultado = document.getElementById("resultado-venta");
  resultado.replaceChildren();
  resultado.classList.remove("mensaje-error", "mensaje-exito");
  if (esError) resultado.classList.add("mensaje-error");
  else resultado.classList.add("mensaje-exito");
  const p = document.createElement("p");
  p.textContent = texto;
  resultado.append(p);
}

function renderizarRenglones() {
  const tbody = document.querySelector("#tabla-renglones tbody");
  const mensajeVacio = document.getElementById("mensaje-renglones-vacio");
  tbody.replaceChildren();
  renglonesVenta.forEach((renglon, indice) => {
    const fila = document.createElement("tr");

    const tdTitulo = document.createElement("td");
    tdTitulo.textContent = renglon.titulo;
    fila.append(tdTitulo);

    const tdCantidad = document.createElement("td");
    const inputCantidad = document.createElement("input");
    inputCantidad.type = "number";
    inputCantidad.min = "1";
    inputCantidad.step = "1";
    inputCantidad.value = renglon.cantidad;
    inputCantidad.className = "campo";
    inputCantidad.addEventListener("change", () => {
      const nueva = Number(inputCantidad.value);
      if (Number.isInteger(nueva) && nueva > 0) {
        renglon.cantidad = nueva;
        renderizarRenglones();
      } else {
        inputCantidad.value = renglon.cantidad;
      }
    });
    tdCantidad.append(inputCantidad);
    fila.append(tdCantidad);

    const tdPrecio = document.createElement("td");
    tdPrecio.textContent = formatearImporte(renglon.precioUnitario);
    fila.append(tdPrecio);

    const tdSubtotal = document.createElement("td");
    tdSubtotal.textContent = formatearImporte(Number(renglon.precioUnitario) * renglon.cantidad);
    fila.append(tdSubtotal);

    const tdQuitar = document.createElement("td");
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "boton boton-secundario";
    boton.textContent = "Quitar";
    boton.addEventListener("click", () => {
      renglonesVenta.splice(indice, 1);
      renderizarRenglones();
    });
    tdQuitar.append(boton);
    fila.append(tdQuitar);
    tbody.append(fila);
  });
  mensajeVacio.hidden = renglonesVenta.length > 0;
  actualizarTotal();
}

function actualizarTotal() {
  const total = renglonesVenta.reduce(
    (acc, r) => acc + Number(r.precioUnitario) * r.cantidad, 0
  );
  document.getElementById("venta-total").textContent = total.toFixed(2);
}

async function confirmarVenta() {
  const boton = document.getElementById("boton-confirmar-venta");
  const resultado = document.getElementById("resultado-venta");
  resultado.replaceChildren();
  resultado.classList.remove("mensaje-error", "mensaje-exito");

  if (!clienteVenta) {
    mostrarMensajeVenta("Buscá y seleccioná un cliente.", true);
    return;
  }
  if (renglonesVenta.length === 0) {
    mostrarMensajeVenta("Agregá al menos un renglón.", true);
    return;
  }

  const cuerpo = {
    cliente_id: clienteVenta.id,
    renglones: renglonesVenta.map((r) => ({ libro_id: r.libro_id, cantidad: r.cantidad }))
  };

  boton.disabled = true;
  try {
    const venta = await apiFetch("/ventas/", { method: "POST", body: JSON.stringify(cuerpo) });
    // Mostrar importes de la respuesta
    const detalle = document.createElement("div");
    const titulo = document.createElement("p");
    titulo.textContent = `Venta registrada (id ${venta.id}). Total: ${formatearImporte(venta.total)}`;
    detalle.append(titulo);
    (venta.renglones || []).forEach((r) => {
      const p = document.createElement("p");
      p.textContent = `${r.titulo}: ${r.cantidad} x ${formatearImporte(r.precio_unitario)} = ${formatearImporte(r.subtotal)}`;
      detalle.append(p);
    });
    resultado.classList.add("mensaje-exito");
    resultado.append(detalle);

    // Limpiar borrador
    renglonesVenta.length = 0;
    renderizarRenglones();
    clienteVenta = null;
    document.getElementById("venta-cliente-id").value = "";
    document.getElementById("cliente-seleccionado").textContent = "";

    await cargarHistorial();
  } catch (error) {
    mostrarMensajeVenta(mensajeErrorApi(error) || "No se pudo registrar la venta.", true);
  } finally {
    boton.disabled = false;
  }
}

async function cargarHistorial() {
  if (cargandoHistorial) return;
  cargandoHistorial = true;
  const params = new URLSearchParams();
  params.set("limit", String(LIMITE_HISTORIAL));
  params.set("offset", String(offsetHistorial));
  try {
    const ventas = await apiFetch(`/ventas/?${params.toString()}`);
    renderizarHistorial(Array.isArray(ventas) ? ventas : []);
    actualizarPaginacionHistorial(Array.isArray(ventas) ? ventas.length : 0);
  } catch (error) {
    mostrarMensajeVenta(mensajeErrorApi(error) || "No se pudo cargar el historial.", true);
  } finally {
    cargandoHistorial = false;
  }
}

function renderizarHistorial(ventas) {
  const tbody = document.querySelector("#tabla-historial tbody");
  const mensajeVacio = document.getElementById("mensaje-historial-vacio");
  tbody.replaceChildren();
  ventas.forEach((venta) => {
    const fila = document.createElement("tr");
    const celdas = [
      venta.id,
      formatearFecha(venta.fecha),
      venta.cliente ? venta.cliente.nombre : "",
      formatearImporte(venta.total)
    ];
    celdas.forEach((texto) => {
      const td = document.createElement("td");
      td.textContent = texto;
      fila.append(td);
    });
    const tdDetalle = document.createElement("td");
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "boton boton-secundario";
    boton.textContent = "Ver detalle";
    boton.addEventListener("click", () => verDetalleVenta(venta.id));
    tdDetalle.append(boton);
    fila.append(tdDetalle);
    tbody.append(fila);
  });
  mensajeVacio.hidden = ventas.length > 0;
}

function formatearFecha(valor) {
  if (!valor) return "";
  try {
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return String(valor);
    return fecha.toLocaleString();
  } catch (e) {
    return String(valor);
  }
}

async function verDetalleVenta(id) {
  const contenedor = document.getElementById("detalle-venta");
  contenedor.hidden = false;
  contenedor.textContent = "Cargando detalle...";
  try {
    const venta = await apiFetch(`/ventas/${id}`);
    contenedor.replaceChildren();
    const titulo = document.createElement("h3");
    titulo.textContent = `Venta ${venta.id}`;
    contenedor.append(titulo);
    const lineas = [
      `Fecha: ${formatearFecha(venta.fecha)}`,
      `Cliente: ${venta.cliente ? venta.cliente.nombre : ""}`,
      `Total: ${formatearImporte(venta.total)}`
    ];
    lineas.forEach((linea) => {
      const p = document.createElement("p");
      p.textContent = linea;
      contenedor.append(p);
    });
    const tabla = document.createElement("table");
    tabla.className = "tabla";
    const thead = document.createElement("thead");
    const trh = document.createElement("tr");
    ["Libro", "Cantidad", "Precio unitario", "Subtotal"].forEach((t) => {
      const th = document.createElement("th");
      th.textContent = t;
      trh.append(th);
    });
    thead.append(trh);
    tabla.append(thead);
    const tbody = document.createElement("tbody");
    (venta.renglones || []).forEach((r) => {
      const tr = document.createElement("tr");
      [r.titulo, String(r.cantidad), formatearImporte(r.precio_unitario), formatearImporte(r.subtotal)].forEach((t) => {
        const td = document.createElement("td");
        td.textContent = t;
        tr.append(td);
      });
      tbody.append(tr);
    });
    tabla.append(tbody);
    contenedor.append(tabla);
  } catch (error) {
    contenedor.textContent = mensajeErrorApi(error) || "No se pudo cargar el detalle.";
  }
}

function actualizarPaginacionHistorial(cantidadRecibida) {
  const contenedor = document.getElementById("paginacion-historial");
  const anterior = document.getElementById("historial-anterior");
  const siguiente = document.getElementById("historial-siguiente");
  const info = document.getElementById("historial-pagina-info");
  if (!contenedor) return;
  const hayAnterior = offsetHistorial > 0;
  const haySiguiente = cantidadRecibida >= LIMITE_HISTORIAL;
  if (!hayAnterior && !haySiguiente) {
    contenedor.hidden = true;
    return;
  }
  contenedor.hidden = false;
  anterior.disabled = !hayAnterior;
  siguiente.disabled = !haySiguiente;
  const pagina = Math.floor(offsetHistorial / LIMITE_HISTORIAL) + 1;
  info.textContent = `Página ${pagina}`;
}

function iniciarVentas() {
  const formRenglon = document.getElementById("form-renglon");
  if (formRenglon) {
    formRenglon.addEventListener("submit", (evento) => {
      evento.preventDefault();
      agregarRenglon();
    });
  }
  const botonBuscarCliente = document.getElementById("boton-buscar-cliente");
  if (botonBuscarCliente) botonBuscarCliente.addEventListener("click", buscarClienteVenta);
  const botonConfirmar = document.getElementById("boton-confirmar-venta");
  if (botonConfirmar) botonConfirmar.addEventListener("click", confirmarVenta);

  const anterior = document.getElementById("historial-anterior");
  const siguiente = document.getElementById("historial-siguiente");
  if (anterior) anterior.addEventListener("click", () => {
    if (offsetHistorial >= LIMITE_HISTORIAL) {
      offsetHistorial -= LIMITE_HISTORIAL;
      cargarHistorial();
    }
  });
  if (siguiente) siguiente.addEventListener("click", () => {
    offsetHistorial += LIMITE_HISTORIAL;
    cargarHistorial();
  });

  cargarLibrosApi();
  cargarHistorial();
  renderizarRenglones();
}

document.addEventListener("DOMContentLoaded", iniciarVentas);