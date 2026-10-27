// Episodio 1 con acción: el Bug Ch'aqwa ataca el pueblo desde el primer minuto.
// Las preguntas usan solo lo que el prólogo ya enseñó: variables, str, int, cuentas, bool y print.

import type { Linea } from "./episodio1";

/** [código (opcional), pregunta, correcta, incorrectas, explicación si falla] */
export type PreguntaRuna = [string, string, string, string[], string];

/** Runa de kallpa: responder bien lanza un disparo especial que borra a los mini-Bugs. */
export const RUNAS_PUEBLO: PreguntaRuna[] = [
  ['heroe = "Chaski"', "¿Qué tipo de dato guarda heroe?", "str (texto)", ["int (número)", "bool (sí/no)"], "Va entre comillas, así que es un texto: str."],
  ["kallpa = 10", "¿Qué tipo de dato guarda kallpa?", "int (número)", ["str (texto)", "bool (sí/no)"], "10 va sin comillas: es un número entero, int."],
  ["escudo = True", "¿Qué significa True?", "Sí, verdadero", ["No, falso", "Un texto"], "True es verdadero (sí). False es falso (no)."],
  ["print(3 + 4)", "¿Qué muestra este código?", "7", ["3 + 4", "34"], "Sin comillas, Python hace la cuenta: 3 + 4 = 7."],
  ['print("3 + 4")', "¿Qué muestra este código?", "3 + 4", ["7", "34"], "Entre comillas es un texto: Python lo muestra tal cual."],
  ["bugs = 5\nbugs = bugs - 2\nprint(bugs)", "¿Qué muestra?", "3", ["5", "bugs - 2"], "La variable bugs valía 5 y le restamos 2: queda 3."],
  ["", "¿Cuál crea bien una variable con un texto?", 'nombre = "Killa"', ['nombre = Killa', '"nombre" = Killa'], "El nombre de la variable va sin comillas y el texto, con comillas."],
  ["agua = False", "¿Hay agua en la fuente?", "No", ["Sí", "No se sabe"], "False significa no (falso)."],
];

/** Escudo del mini-jefe Ch'aqwa Wawa: lo que se aprendió en todo el Episodio 1. */
export const RUNAS_WAWA: PreguntaRuna[] = [
  ["fuente.agua = False", "¿Qué valor necesita la fuente para tener agua?", "True", ["False", '"agua"'], "Para sí o no, Python usa True o False. Sí = True."],
  ["", "¿Cómo se escribe bien un color en Python?", '"rojo"', ["rojo", "7"], "Los textos (str) siempre van entre comillas."],
  ['heroe = "Chaski"\nprint("Soy", heroe)', "¿Qué muestra?", "Soy Chaski", ["Soy heroe", "Soy, heroe"], "print muestra el valor de la variable heroe: Chaski."],
  ["", "¿Cuál funciona en Python?", 'print("Hola")', ['Print("Hola")', 'PRINT("Hola")'], "Python distingue mayúsculas: se escribe print, en minúsculas."],
  ["vida = 20\nvida = vida + 5", "¿Cuánto vale vida al final?", "25", ["20", "5"], "Primero vale 20 y luego le sumamos 5: 25."],
  ["", "Python lee el código…", "De arriba hacia abajo", ["De abajo hacia arriba", "En cualquier orden"], "Primero se crea la variable y después se usa: de arriba hacia abajo."],
];

export const ALARMA_INTRO: Linea[] = [
  { quien: "narrador", texto: "Se escucha un pututo a lo lejos: ¡uuuuuu! Un chaski llega corriendo por el camino…" },
  { quien: "waman", texto: "¡Allillanchu! Soy Waman, chaski del tambo del río. Corrí sin parar con este khipu." },
  { quien: "waman", texto: "Sus nudos dicen: ¡el Bug Ch'aqwa soltó mini-Bugs y viene una tormenta! ¡Van hacia la fuente!" },
  { quien: "tuki", texto: "¡Kraa! ¡A defender el pueblo, {nombre}!" },
  { quien: "tuki", texto: "¡Y atraparon a Mama Khipu en una burbuja! Toca 🎯 HUARACA para dispararles antes de que se acabe el tiempo." },
];

export const OLA_GANADA: Linea[] = [
  { quien: "tuki", texto: "¡Plaza despejada! ¡Eres veloz como un chaski de verdad! Ahora corre a liberar a Mama Khipu de la burbuja 🫧." },
];

export const MAMA_LIBRE: Linea[] = [
  { quien: "mama", texto: "¡[[Sulpayki]], {nombre}! Me salvaste de esa burbuja de código corrupto." },
];

export const WAWA_LLEGA: Linea[] = [
  { quien: "tuki", texto: "¡Kraa! ¡Algo grande se acerca a la fuente! Es el Ch'aqwa Wawa, la cría del Bug." },
  { quien: "mama", texto: "Su escudo está hecho de código, {nombre}. Busca la 🔮 runa, respóndela bien y el escudo caerá. ¡Entonces dispárale!" },
];

export const WAWA_VENCIDO: Linea[] = [
  { quien: "tuki", texto: "¡LO LOGRASTE! ¡El Ch'aqwa Wawa se deshizo en pedacitos de código! Kraa, kraa!" },
  { quien: "mama", texto: "Ven, {nombre}. Tengo algo que decirte." },
];
