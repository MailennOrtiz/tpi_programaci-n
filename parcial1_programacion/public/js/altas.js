"use strict";

const autoriasLibro = [];

function normalizarISBN(isbn) {
  return String(isbn ?? "").replace(/[\s-]/g, "");
}

function normalizarEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

function mostrarResultadoAlta(resultado, mensaje, esError) {
  resultado.replaceChildren();
  resultado.classList.remove("mensaje-error", "mensaje-exito");
  if (esError) {
    resultado.classList.add("mensaje-error");
  } else {
    resultado.classList.add("mensaje-exito");
  }
  const p = document.createElement("p");
  p.textContent = mensaje;
  resultado.append(p);
}

function mostrarErroresAlta(resultado, errores) {
  resultado.replaceChildren();
  resultado.classList.remove("mensaje-error", "mensaje-exito");
  resultado.classList.add("mensaje-error");
  const resumen = document.createElement("p");
  resumen.textContent = "No se guardó el registro. Revisá estos datos:";
  const lista = document.createElement("ul");
  errores.forEach((error) => {
    const item = document.createElement("li");
    item.textContent = error;
    lista.append(item);
  });
  resultado.append(resumen, lista);
}

async function cargarOpcionesApi(idSelector, ruta, campoId, campoNombre, textoInicial, esOpcional) {
  const selector = document.getElementById(idSelector);
  const seleccionados = Array.from(selector.selectedOptions, (opcion) => opcion.value);
  const opciones = [];
  if (textoInicial !== null) {
    const opcion = document.createElement("option");
    opcion.value = "";
    opcion.textContent = textoInicial;
    opciones.push(opcion);
  }
  try {
    const registros = await apiFetch(ruta);
    (Array.isArray(registros) ? registros : []).forEach((registro) => {
      const opcion = document.createElement("option");
      opcion.value = registro[campoId];
      opcion.textContent = registro[campoNombre];
      opcion.selected = seleccionados.includes(String(registro[campoId]));
      opciones.push(opcion);
    });
  } catch (error) {
    // Se deja el selector con la opción inicial.
  }
  selector.replaceChildren(...opciones);
}

function renderizarAutorias() {
  const contenedor = document.getElementById("listado-autorias");
  if (!contenedor) return;
  contenedor.replaceChildren();
  autoriasLibro.forEach((autoria, indice) => {
    const linea = document.createElement("p");
    linea.textContent = `${autoria.nombre} — ${autoria.rol} (orden ${autoria.orden})`;
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "boton boton-secundario";
    boton.textContent = "Quitar";
    boton.addEventListener("click", () => {
      autoriasLibro.splice(indice, 1);
      renderizarAutorias();
    });
    const wrap = document.createElement("div");
    wrap.append(linea, boton);
    contenedor.append(wrap);
  });
}

async function verificarAutor() {
  const inputId = document.getElementById("autor-id-verificar");
  const selectRol = document.getElementById("autor-rol");
  const inputOrden = document.getElementById("autor-orden");
  const mensaje = document.getElementById("autor-verificado");
  const id = Number(inputId.value);
  if (!Number.isInteger(id) || id <= 0) {
    mostrarResultadoAlta(mensaje, "Ingresá un ID de autor válido.", true);
    return;
  }
  try {
    const autor = await apiFetch(`/autores/${id}`);
    const nombre = autor.nombre || `Autor ${id}`;
    // Evitar duplicados por autor_id
    if (autoriasLibro.some((a) => a.autor_id === id)) {
      mostrarResultadoAlta(mensaje, "Ese autor ya fue agregado.", true);
      return;
    }
    autoriasLibro.push({
      autor_id: id,
      rol: selectRol.value,
      orden: Number(inputOrden.value) || autoriasLibro.length + 1,
      nombre: nombre
    });
    renderizarAutorias();
    mostrarResultadoAlta(mensaje, `Autor verificado: ${nombre}`, false);
    inputId.value = "";
  } catch (error) {
    mostrarResultadoAlta(mensaje, mensajeErrorApi(error) || "Autor no encontrado.", true);
  }
}

async function actualizarVistasAltas() {
  await cargarOpcionesApi("libro-editorial", "/editoriales/", "id", "nombre", "Seleccioná una editorial", false);
  await cargarOpcionesApi("libro-genero", "/generos/", "id", "nombre", "Sin clasificar", true);

  // Actualizar listado de clientes
  const listadoClientes = document.getElementById("listado-clientes");
  if (listadoClientes) {
    listadoClientes.replaceChildren();
    clientes.forEach((cliente) => {
      const tarjeta = document.createElement("article");
      tarjeta.className = "tarjeta-libro";
      const nombre = document.createElement("h3");
      nombre.textContent = cliente.nombreCompleto || cliente.nombre;
      const email = document.createElement("p");
      email.textContent = "Email: " + cliente.email;
      tarjeta.append(nombre, email);
      listadoClientes.append(tarjeta);
    });
    const msgClientes = document.getElementById("mensaje-clientes-vacio");
    if (msgClientes) msgClientes.hidden = clientes.length > 0;
  }

  // Actualizar listado de libros desde la API
  try {
    const librosRecibidos = await apiFetch("/libros/?limit=100&offset=0");
    const listadoLibros = document.getElementById("listado-libros");
    if (listadoLibros && typeof crearTarjetaLibro === "function") {
      listadoLibros.replaceChildren(...(Array.isArray(librosRecibidos) ? librosRecibidos : []).map((l) => crearTarjetaLibro(l)));
    }
    const msgLibros = document.getElementById("mensaje-libros-vacio");
    if (msgLibros) msgLibros.hidden = (Array.isArray(librosRecibidos) ? librosRecibidos.length : 0) > 0;
  } catch (e) {
    // ignorar
  }

  if (typeof cargarCatalogo === "function") {
    cargarCatalogo();
  }
}

async function manejarAltaLibro(evento) {
  evento.preventDefault();
  const formulario = document.getElementById("form-alta-libro");
  const resultado = document.getElementById("resultado-alta-libro");
  resultado.replaceChildren();
  resultado.classList.remove("mensaje-error", "mensaje-exito");

  const titulo = String(document.getElementById("libro-titulo").value ?? "").trim();
  const isbn = normalizarISBN(document.getElementById("libro-isbn").value);
  const precio = document.getElementById("libro-precio").value;
  const stock = document.getElementById("libro-stock").value;
  const editorialId = document.getElementById("libro-editorial").value;
  const generoId = document.getElementById("libro-genero").value;

  const errores = [];
  if (titulo === "") errores.push("Ingresá el título.");
  if (isbn === "") errores.push("Ingresá el ISBN.");
  if (!Number.isFinite(Number(precio)) || Number(precio) <= 0) errores.push("El precio debe ser mayor que cero.");
  if (!Number.isInteger(Number(stock)) || Number(stock) < 0) errores.push("El stock debe ser un entero no negativo.");
  if (editorialId === "") errores.push("Seleccioná una editorial.");
  if (autoriasLibro.length === 0) errores.push("Agregá al menos un autor.");

  if (errores.length > 0) {
    mostrarErroresAlta(resultado, errores);
    return;
  }

  const cuerpo = {
    isbn: document.getElementById("libro-isbn").value.trim(),
    titulo: titulo,
    precio: precio,
    stock: Number(stock),
    editorial_id: Number(editorialId),
    autores: autoriasLibro.map((a) => ({ autor_id: a.autor_id, rol: a.rol, orden: a.orden }))
  };
  if (generoId !== "") cuerpo.genero_id = Number(generoId);

  // Deshabilitar botón mientras procesa
  const boton = formulario.querySelector('button[type="submit"]');
  if (boton) boton.disabled = true;
  try {
    const creado = await apiFetch("/libros/", { method: "POST", body: JSON.stringify(cuerpo) });
    mostrarResultadoAlta(resultado, `Libro registrado correctamente (id ${creado.id}).`, false);
    formulario.reset();
    autoriasLibro.length = 0;
    renderizarAutorias();
    await actualizarVistasAltas();
  } catch (error) {
    mostrarResultadoAlta(resultado, mensajeErrorApi(error) || "No se pudo registrar el libro.", true);
  } finally {
    if (boton) boton.disabled = false;
  }
}

async function manejarAltaCliente(evento) {
  evento.preventDefault();
  const formulario = document.getElementById("form-alta-cliente");
  const resultado = document.getElementById("resultado-alta-cliente");
  resultado.replaceChildren();
  resultado.classList.remove("mensaje-error", "mensaje-exito");

  const nombre = String(document.getElementById("cliente-nombre").value ?? "").trim();
  const email = normalizarEmail(document.getElementById("cliente-email").value);

  const errores = [];
  if (nombre === "") errores.push("Ingresá el nombre completo.");
  if (email === "") errores.push("Ingresá el email.");
  else if (!/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(email)) errores.push("Ingresá un email válido.");

  if (errores.length > 0) {
    mostrarErroresAlta(resultado, errores);
    return;
  }

  const boton = formulario.querySelector('button[type="submit"]');
  if (boton) boton.disabled = true;
  try {
    const creado = await apiFetch("/clientes/", { method: "POST", body: JSON.stringify({ nombre: nombre, email: email }) });
    mostrarResultadoAlta(resultado, `Cliente registrado correctamente (id ${creado.id}).`, false);
    formulario.reset();
    // Mantener lista local para ventas
    clientes.push({ idCliente: creado.id, nombreCompleto: creado.nombre, email: creado.email });
    await actualizarVistasAltas();
  } catch (error) {
    mostrarResultadoAlta(resultado, mensajeErrorApi(error) || "No se pudo registrar el cliente.", true);
  } finally {
    if (boton) boton.disabled = false;
  }
}

function iniciarAltas() {
  const formularioLibro = document.getElementById("form-alta-libro");
  const formularioCliente = document.getElementById("form-alta-cliente");

  formularioLibro.noValidate = true;
  formularioCliente.noValidate = true;

  const botonVerificar = document.getElementById("boton-verificar-autor");
  if (botonVerificar) botonVerificar.addEventListener("click", verificarAutor);

  formularioLibro.addEventListener("submit", manejarAltaLibro);
  formularioCliente.addEventListener("submit", manejarAltaCliente);

  actualizarVistasAltas();
}

document.addEventListener("DOMContentLoaded", iniciarAltas);