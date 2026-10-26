// Puente entre el juego y el Python que corre en el Web Worker.

export interface ErrorPython {
  tipo: string;
  mensaje: string;
  linea: number | null;
  original?: string;
}
export interface Resultado {
  ok: boolean;
  salida: string[];
  error?: ErrorPython;
}

const TIEMPO_MAXIMO_MS = 5000;
type EstadoPython = "apagado" | "cargando" | "listo" | "error";

class PythonRunner {
  estado: EstadoPython = "apagado";
  private worker: Worker | null = null;
  private listo: Promise<void> | null = null;
  private pendientes = new Map<number, { resolver: (r: Resultado) => void; temporizador: number }>();
  private siguienteId = 1;
  private oyentes: ((e: EstadoPython) => void)[] = [];

  alCambiar(f: (e: EstadoPython) => void) {
    this.oyentes.push(f);
    f(this.estado);
  }

  private cambiar(e: EstadoPython) {
    this.estado = e;
    this.oyentes.forEach((f) => f(e));
  }

  iniciar(): Promise<void> {
    if (this.listo) return this.listo;
    this.cambiar("cargando");
    const worker = new Worker(new URL("./pythonWorker.ts", import.meta.url), { type: "module" });
    this.worker = worker;
    this.listo = new Promise((resolver, rechazar) => {
      worker.onmessage = (e: MessageEvent) => {
        const m = e.data;
        if (m.tipo === "listo") {
          this.cambiar("listo");
          resolver();
        } else if (m.tipo === "error-carga") {
          this.cambiar("error");
          worker.terminate();
          this.worker = null;
          this.listo = null;
          rechazar(new Error(m.mensaje));
        } else if (m.tipo === "resultado") {
          const p = this.pendientes.get(m.id);
          if (p) {
            clearTimeout(p.temporizador);
            this.pendientes.delete(m.id);
            p.resolver(m as Resultado);
          }
        }
      };
    });
    return this.listo;
  }

  async ejecutar(codigo: string, tiempoMaximo = TIEMPO_MAXIMO_MS): Promise<Resultado> {
    await this.iniciar();
    const id = this.siguienteId++;
    return new Promise((resolver) => {
      const temporizador = window.setTimeout(() => {
        this.pendientes.delete(id);
        this.worker?.terminate();
        this.worker = null;
        this.listo = null;
        this.iniciar().catch(() => {});
        resolver({ ok: false, salida: [], error: { tipo: "Timeout", mensaje: "", linea: null } });
      }, /sqlalchemy/.test(codigo) ? Math.max(tiempoMaximo, 90000) : tiempoMaximo);
      this.pendientes.set(id, { resolver, temporizador });
      this.worker!.postMessage({ id, codigo });
    });
  }
}

export const python = new PythonRunner();
