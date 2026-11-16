// Cliente HTTP centralizado para la API de la librería.
// En producción el prefijo público es /api (Nginx lo reenvía a FastAPI).
// La URL base se centraliza acá para no repetirla en cada módulo.
const API_BASE_URL = "/api";

async function apiFetch(ruta, opciones = {}) {
  const respuesta = await fetch(`${API_BASE_URL}${ruta}`, {
    ...opciones,
    headers: { "Content-Type": "application/json", ...(opciones.headers || {}) },
  });
  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    const error = new Error(`HTTP ${respuesta.status}`);
    error.status = respuesta.status;
    error.detail = datos && datos.detail !== undefined ? datos.detail : datos;
    throw error;
  }
  return datos;
}

function mensajeErrorApi(error) {
  if (!error) return "Error desconocido.";
  if (error.detail) {
    if (Array.isArray(error.detail)) {
      return error.detail.map((item) => item.msg || item.message || JSON.stringify(item)).join(" ");
    }
    if (typeof error.detail === "string") return error.detail;
  }
  return error.message || "Error desconocido.";
}