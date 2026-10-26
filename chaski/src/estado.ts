// Progreso del jugador. Se guarda solo en este dispositivo (sin cuentas ni datos personales).

export type Paso = "intro" | "hablar1" | "fuente" | "techo" | "hablar2" | "taller" | "final" | "completo";

export interface Estado {
  heroe: string;
  paso: Paso;
  kallpa: number;
  exp: number;
  nivel: number;
  palabras: string[];
  codigo: string;
  logros: string[];
  nudos: number[];
}

const CLAVE = "chaski-runes-v1";

function inicial(): Estado {
  return { heroe: "", paso: "intro", kallpa: 0, exp: 0, nivel: 1, palabras: [], codigo: "", logros: [], nudos: [] };
}

function cargar(): Estado {
  try {
    const texto = localStorage.getItem(CLAVE);
    if (texto) return { ...inicial(), ...JSON.parse(texto) };
  } catch {
    /* sin almacenamiento: se juega sin guardar */
  }
  return inicial();
}

export const estado: Estado = cargar();

export function guardar() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(estado));
  } catch {
    /* ignorar */
  }
}

export function hayPartida(): boolean {
  return estado.heroe !== "";
}

export function reiniciar() {
  Object.assign(estado, inicial());
  guardar();
}

/** Orden de los pasos, para saber si uno ya pasó. */
const ORDEN: Paso[] = ["intro", "hablar1", "fuente", "techo", "hablar2", "taller", "final", "completo"];
export const yaPaso = (p: Paso) => ORDEN.indexOf(estado.paso) > ORDEN.indexOf(p);
