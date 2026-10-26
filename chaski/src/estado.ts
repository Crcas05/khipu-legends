// Progreso del jugador. Se guarda solo en este dispositivo (sin cuentas ni datos personales).

export type Paso =
  | "prologo" | "intro" | "hablar1" | "fuente" | "techo" | "hablar2" | "taller" | "final" | "completo"
  | "selva" | "ecos" | "forja" | "batalla" | "victoria" | "completo2"
  | "valle" | "completo3";

export interface Estado {
  heroe: string;
  nombre: string;
  paso: Paso;
  kallpa: number;
  exp: number;
  nivel: number;
  palabras: string[];
  codigo: string;
  logros: string[];
  nudos: number[];
  runas: Record<string, string>;
  racha: number;
  ultimoDia: string;
  rescates: string[];
  inventario: Record<string, number>;
}

const CLAVE = "chaski-runes-v1";

function inicial(): Estado {
  return { heroe: "", nombre: "", paso: "prologo", kallpa: 0, exp: 0, nivel: 1, palabras: [], codigo: "", logros: [], nudos: [], runas: {}, racha: 0, ultimoDia: "", rescates: [], inventario: {} };
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
const ORDEN: Paso[] = ["prologo", "intro", "hablar1", "fuente", "techo", "hablar2", "taller", "final", "completo", "selva", "ecos", "forja", "batalla", "victoria", "completo2", "valle", "completo3"];
export const enValle = () => ORDEN.indexOf(estado.paso) >= ORDEN.indexOf("valle");
export const enSelva = () => ORDEN.indexOf(estado.paso) >= ORDEN.indexOf("selva") && ORDEN.indexOf(estado.paso) < ORDEN.indexOf("valle");
export const yaPaso = (p: Paso) => ORDEN.indexOf(estado.paso) > ORDEN.indexOf(p);
