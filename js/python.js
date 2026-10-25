// Puente entre el juego y el Python que corre en el Web Worker.
// Uso:  const r = await python.ejecutar('print("hola")')
//       r = { ok: true, salida: ["hola"] }  o  { ok: false, salida, error: {tipo, mensaje, linea} }

const TIEMPO_MAXIMO_MS = 5000;

export class PythonRunner {
  constructor(alCambiarEstado = () => {}) {
    this.alCambiarEstado = alCambiarEstado;
    this.worker = null;
    this.listo = null;
    this.pendientes = new Map();
    this.siguienteId = 1;
    this.estado = "apagado"; // apagado | cargando | listo | error
  }

  iniciar() {
    if (this.worker) return this.listo;
    this.cambiarEstado("cargando");
    this.worker = new Worker(new URL("./python-worker.js", import.meta.url), { type: "module" });
    this.listo = new Promise((resolver, rechazar) => {
      this.worker.onmessage = (e) => {
        const msg = e.data;
        if (msg.tipo === "listo") {
          this.cambiarEstado("listo");
          resolver();
        } else if (msg.tipo === "error-carga") {
          this.cambiarEstado("error");
          this.worker.terminate();
          this.worker = null;
          rechazar(new Error(msg.mensaje));
        } else if (msg.tipo === "resultado") {
          const pendiente = this.pendientes.get(msg.id);
          if (pendiente) {
            clearTimeout(pendiente.temporizador);
            this.pendientes.delete(msg.id);
            pendiente.resolver(msg);
          }
        }
      };
    });
    return this.listo;
  }

  async ejecutar(codigo) {
    await this.iniciar();
    const id = this.siguienteId++;
    return new Promise((resolver) => {
      const temporizador = setTimeout(() => {
        // El código tardó demasiado (por ejemplo, un bucle infinito):
        // se apaga el worker y se prepara uno nuevo.
        this.pendientes.delete(id);
        this.reiniciar();
        resolver({ ok: false, salida: [], error: { tipo: "Timeout", mensaje: "", linea: null } });
      }, TIEMPO_MAXIMO_MS);
      this.pendientes.set(id, { resolver, temporizador });
      this.worker.postMessage({ id, codigo });
    });
  }

  reiniciar() {
    if (this.worker) this.worker.terminate();
    this.worker = null;
    this.listo = null;
    this.iniciar().catch(() => {});
  }

  cambiarEstado(estado) {
    this.estado = estado;
    this.alCambiarEstado(estado);
  }
}
