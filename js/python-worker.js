// Ejecuta el código Python del jugador en un hilo aparte (Web Worker),
// para que un bucle infinito nunca congele el juego.
// Python corre dentro del navegador gracias a Pyodide: no hay servidor.

const VERSION_PYODIDE = "314.0.7";
const URL_PYODIDE = `https://cdn.jsdelivr.net/pyodide/v${VERSION_PYODIDE}/full/`;
const MAX_LINEAS = 200; // evita que un print dentro de un bucle llene la pantalla

let pyodide = null;

async function cargar() {
  try {
    const { loadPyodide } = await import(URL_PYODIDE + "pyodide.mjs");
    pyodide = await loadPyodide({ indexURL: URL_PYODIDE });
    // input() todavía no se usa en estas misiones: avisamos con un error claro.
    pyodide.setStdin({ error: true });
    postMessage({ tipo: "listo" });
  } catch (e) {
    postMessage({ tipo: "error-carga", mensaje: String(e) });
  }
}

// Saca el tipo de error, el mensaje y la línea del texto que devuelve Python.
function analizarError(texto) {
  const lineas = String(texto).trim().split("\n");
  const ultima = lineas[lineas.length - 1] || "";
  const coincide = ultima.match(/^(\w+(?:Error|Exception|Warning)?):\s*(.*)$/);
  let linea = null;
  for (const l of lineas) {
    const m = l.match(/File "<exec>", line (\d+)/);
    if (m) linea = Number(m[1]);
  }
  return {
    tipo: coincide ? coincide[1] : "Error",
    mensaje: coincide ? coincide[2] : ultima,
    linea,
    original: ultima,
  };
}

onmessage = async (evento) => {
  const { id, codigo } = evento.data;
  const salida = [];
  pyodide.setStdout({
    batched: (texto) => { if (salida.length < MAX_LINEAS) salida.push(texto); },
  });
  pyodide.setStderr({ batched: () => {} });
  // Cada ejecución empieza limpia, sin variables de intentos anteriores.
  const espacio = pyodide.globals.get("dict")();
  try {
    await pyodide.runPythonAsync(codigo, { globals: espacio });
    postMessage({ tipo: "resultado", id, ok: true, salida });
  } catch (e) {
    postMessage({ tipo: "resultado", id, ok: false, salida, error: analizarError(e.message) });
  } finally {
    espacio.destroy();
  }
};

cargar();
