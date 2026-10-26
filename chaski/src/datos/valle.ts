// Temporada 1 · Misión 2 · Zona 1: "El Valle Sagrado"
// Mundo abierto: el jugador decide el orden de los rescates. Cada rescate es código.
// Repasa: bool y for. Nuevo: if/else, comparaciones, listas, = frente a ==.
// (Pendiente: validar las palabras quechua y las fichas de fauna con especialistas.)

import type { Linea } from "./episodio1";
import type { RetoBloques } from "../ui/bloques";
import type { Reto } from "../ui/taller";
import type { Sitio } from "../valle";

export const INTRO_VALLE: Linea[] = [
  { quien: "narrador", texto: "El Valle Sagrado. El Bug Ch'aqwa huyó por aquí y dejó todo desordenado." },
  { quien: "amaru", texto: "Mira, {nombre}: la vicuña atrapada, el [[mayu]] seco, el nido del [[kuntur]] congelado…" },
  { quien: "amaru", texto: "Tú decides por dónde empezar. El mapa te muestra los 6 lugares. ¡Y cuidado: los mini-Bugs los vigilan!" },
  { quien: "tuki", texto: "¡Kraa! Usa tu 🎯 huaraca para espantarlos y te soltarán materiales. ¡Al rescate!" },
];

export const FIN_VALLE: Linea[] = [
  { quien: "amaru", texto: "¡El Valle Sagrado volvió a la vida! Mira el pasto, el agua, el [[kuntur]] volando…" },
  { quien: "tuki", texto: "¡Y todo con tus runas, {nombre}! Variables, for, if y listas. ¡Eres un verdadero Chaski!" },
  { quien: "amaru", texto: "Más allá de la puerta nos espera Killa, la guerrera de la luna. Pero esa es otra historia…" },
];

export const APRENDIDO_VALLE = ["if / else", "Comparaciones < > ==", "Listas [ ]", "= guarda, == compara", "Repaso de for y bool"];

export interface Ficha {
  nombre: string;
  icono: string;
  quechua: string;
  dato: string;
}

/** Fichas del Santuario (lo que el jugador "colecciona" al rescatar). */
export const FICHAS: Record<Sitio, Ficha> = {
  vicuna: { nombre: "Vicuña", icono: "🦙", quechua: "wik'uña", dato: "Aparece en el escudo del Perú. Vive en la puna, a más de 3 500 metros, y su fibra es de las más finas del mundo." },
  rio: { nombre: "Río andino", icono: "🌊", quechua: "mayu", dato: "Los ríos de los Andes nacen del deshielo de los nevados y llevan agua a los valles y a la Amazonía." },
  quenua: { nombre: "Queñua", icono: "🌳", quechua: "qiwña", dato: "Es uno de los árboles que crecen a mayor altura en el mundo y ayuda a guardar el agua de las montañas." },
  condor: { nombre: "Cóndor andino", icono: "🦅", quechua: "kuntur", dato: "Una de las aves voladoras más grandes del mundo: sus alas abiertas pueden medir más de 3 metros." },
  colibri: { nombre: "Colibrí", icono: "🐦", quechua: "q'inti", dato: "Bate sus alas decenas de veces por segundo y puede volar hacia atrás. En el Perú viven más de 100 especies." },
  puerta: { nombre: "Punku del valle", icono: "🚪", quechua: "punku", dato: "Las puertas incas tienen forma de trapecio: más angostas arriba, para resistir los terremotos." },
};

export const NOMBRE_SITIO: Record<Sitio, string> = {
  vicuna: "la vicuña",
  rio: "el río",
  quenua: "las queñuas",
  condor: "el nido del cóndor",
  colibri: "el colibrí",
  puerta: "la puerta",
};

/** Lo que muestra el Ojo sobre cada lugar (antes / después). */
export function codigoSitio(s: Sitio, hecho: boolean, rescatados: number): string {
  switch (s) {
    case "vicuna":
      return `jaula.cerrada = ${hecho ? "False" : "True"}`;
    case "rio":
      return `rocas_en_el_rio = ${hecho ? 0 : 5}`;
    case "quenua":
      return `queñuas = ${hecho ? 8 : 0}`;
    case "condor":
      return `nido.temperatura = ${hecho ? 18 : 3}`;
    case "colibri":
      return `flores = ${hecho ? '["kantu", "amancay"]' : "[]"}`;
    case "puerta":
      return `rescatados = ${rescatados}`;
  }
}

// ---------- Retos ----------

export const BLOQUES_RIO: RetoBloques = {
  quien: "amaru",
  titulo: "Libera el río",
  mision: "Cinco rocas bloquean el [[mayu]]. Arma una runa que las quite una por una con un bucle.".replace(/\[\[|\]\]/g, ""),
  preludio: 'roca=[0,1,2,3,4];quitar=lambda r: print("Roca", r, "fuera")',
  correctas: ["for i in range(5):", "    quitar(roca[i])"],
  trampas: ["for i in range(4):", "quitar(roca[i])", "    quitar(roca)"],
  salidaEsperada: ["Roca 0 fuera", "Roca 1 fuera", "Roca 2 fuera", "Roca 3 fuera", "Roca 4 fuera"],
  teoria: "Con <code>for</code> no escribes 5 veces la misma línea: la escribes una vez y Python la repite. <code>roca[i]</code> usa el número de cada vuelta.",
};

export const RETO_QUENUAS: Reto = {
  id: "quenuas",
  titulo: "Reforesta las queñuas",
  enunciado: [
    "El bosque necesita <b>8 queñuas</b>.",
    "Completa el número dentro de <code>range( )</code> para que el bucle plante 8 árboles.",
    "La línea <code>plantar(\"queñua\")</code> va con 4 espacios: está DENTRO del bucle.",
  ],
  plantilla: '# Planta 8 queñuas con un bucle\nfor i in range( ):\n    plantar("queñua")\n',
  pistas: ["Escribe 8 dentro de range: range(8)", 'La segunda línea empieza con 4 espacios: plantar("queñua")', "range(8) repite 8 veces: 0, 1, 2… 7."],
  preludio: '_n=[0];plantar=lambda especie: (_n.__setitem__(0,_n[0]+1), print("Plantaste una", especie))[1]',
  variables: ["plantar"],
  revision: "\nprint('§REVISION§', _n[0])",
  validar: ([n]) => {
    const plantadas = Number(n);
    if (!plantadas) return "Tu runa no plantó nada. Revisa que <code>plantar(\"queñua\")</code> esté dentro del bucle (con 4 espacios).";
    if (plantadas !== 8) return `Plantaste <b>${plantadas}</b> queñuas, pero el bosque necesita <b>8</b>. ¿Qué número va en <code>range( )</code>?`;
    return null;
  },
  exito: "¡8 queñuas plantadas con 2 líneas de código! Eso es el poder del <code>for</code>. 🌳",
};

export const BLOQUES_PUERTA: RetoBloques = {
  quien: "amaru",
  titulo: "La prueba de la punku",
  mision: "La puerta solo se abre si comprueba que rescataste todo. Arma la runa con un <b>if</b>.",
  preludio: "rescatados = 5",
  correctas: ["if rescatados == 5:", '    print("¡Valle restaurado!")'],
  trampas: ["if rescatados = 5:", 'print("¡Valle restaurado!")', "if rescatados == 5"],
  salidaEsperada: ["¡Valle restaurado!"],
  teoria: "Un solo <code>=</code> <b>guarda</b> un valor (<code>x = 5</code>). Dos <code>==</code> <b>comparan</b> (¿x es igual a 5?). En un <code>if</code> siempre se compara con <code>==</code>.",
};
