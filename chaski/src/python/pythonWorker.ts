// Ejecuta el Python del jugador en un hilo aparte (Web Worker), dentro del navegador.
// Así un bucle infinito nunca congela el juego. No hay servidor: todo corre en el dispositivo.

const VERSION_PYODIDE = "314.0.7";
const URL_PYODIDE = `https://cdn.jsdelivr.net/pyodide/v${VERSION_PYODIDE}/full/`;
const MAX_LINEAS = 200;

interface Pyodide {
  runPythonAsync(codigo: string, opciones?: { globals?: unknown }): Promise<unknown>;
  setStdout(o: { batched: (t: string) => void }): void;
  setStderr(o: { batched: (t: string) => void }): void;
  setStdin(o: { error: boolean }): void;
  globals: { get(nombre: string): () => { destroy(): void } };
}

let pyodide: Pyodide | null = null;
const enviar = (m: unknown) => (self as unknown as { postMessage(m: unknown): void }).postMessage(m);

async function cargar() {
  try {
    const modulo = await import(/* @vite-ignore */ URL_PYODIDE + "pyodide.mjs");
    pyodide = (await modulo.loadPyodide({ indexURL: URL_PYODIDE })) as Pyodide;
    pyodide.setStdin({ error: true });
    enviar({ tipo: "listo" });
  } catch (e) {
    enviar({ tipo: "error-carga", mensaje: String(e) });
  }
}

function analizarError(texto: string) {
  const lineas = String(texto).trim().split("\n");
  const ultima = lineas[lineas.length - 1] || "";
  const coincide = ultima.match(/^(\w+(?:Error|Exception|Warning)?):\s*(.*)$/);
  let linea: number | null = null;
  for (const l of lineas) {
    const m = l.match(/File "<exec>", line (\d+)/);
    if (m) linea = Number(m[1]);
  }
  return { tipo: coincide ? coincide[1] : "Error", mensaje: coincide ? coincide[2] : ultima, linea, original: ultima };
}

self.onmessage = async (evento: MessageEvent<{ id: number; codigo: string }>) => {
  const { id, codigo } = evento.data;
  if (!pyodide) return;
  const salida: string[] = [];
  pyodide.setStdout({ batched: (t) => { if (salida.length < MAX_LINEAS) salida.push(t); } });
  pyodide.setStderr({ batched: () => {} });
  const espacio = pyodide.globals.get("dict")();
  try {
    await pyodide.runPythonAsync(codigo, { globals: espacio });
    enviar({ tipo: "resultado", id, ok: true, salida });
  } catch (e) {
    enviar({ tipo: "resultado", id, ok: false, salida, error: analizarError((e as Error).message) });
  } finally {
    espacio.destroy();
  }
};

cargar();
