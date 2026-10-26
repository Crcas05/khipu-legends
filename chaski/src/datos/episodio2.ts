// Temporada 1 · Misión 1 · Episodio 2: "La selva de Ch'aqwa"
// Mecánicas nuevas: Ecos del Chaski (bucle for crea clones) y Runas de batalla (def = tu ataque).
// Aprende: for, range(), índices desde 0, def, parámetros y return.

import type { Linea } from "./episodio1";
import type { Reto } from "../ui/taller";
import type { RetoBloques } from "../ui/bloques";

export const OBJETIVOS_2: Record<string, string> = {
  selva: "Habla con la chica junto a la punku (sigue la flecha)",
  ecos: "Usa la runa de ecos para pisar las 3 rumi a la vez",
  forja: "Forja tu runa de ataque en el 📜 Taller",
  batalla: "¡Derrota al Bug Ch'aqwa con tus runas!",
  victoria: "Habla con Amaru",
  completo2: "Habla con Amaru para seguir al Bug",
  valle: "Rescata el valle: sigue la flecha o mira el mapa 🗺",
  completo3: "¡Valle Sagrado restaurado! ✓",
};

export const LLEGADA: Linea[] = [
  { quien: "narrador", texto: "La selva de Ch'aqwa, donde los Andes bajan hacia la Amazonía." },
  { quien: "tuki", texto: "¡Kraa! Aquí se escondió el Bug. Mira esa [[punku]] de piedra al fondo: está sellada." },
  { quien: "tuki", texto: "Hay alguien junto a la puerta… ¡sigue la flecha, {nombre}!" },
];

export const AMARU_1: Linea[] = [
  { quien: "amaru", texto: "¡Alto! ¿Quién anda en mi [[sacha]]? … Ah, tú eres {nombre}, el Chaski de Mama Khipu." },
  { quien: "amaru", texto: "Soy Amaru, guardiana del río. La [[punku]] solo se abre si alguien pisa las tres [[rumi]] sagradas al mismo tiempo." },
  { quien: "tuki", texto: "¡Pero {nombre} es uno solo!" },
  { quien: "amaru", texto: "Con la runa for puedes repetirte. Elige cuántas veces… ¡y mira lo que pasa!" },
];

export const ECOS_LISTOS: Linea[] = [
  { quien: "amaru", texto: "¡Tres ecos, tres [[rumi]]! La [[punku]] se está abriendo…" },
  { quien: "tuki", texto: "¡KRAA! ¡Algo enorme sale de la puerta!" },
  { quien: "amaru", texto: "¡Es el Bug Ch'aqwa! Con escudos no basta: necesitas una runa de ataque. ¡Fórjala en el Taller, rápido!" },
];

export const ANTES_BATALLA: Linea[] = [
  { quien: "amaru", texto: "¡Tu runa rayo está lista! En la batalla tendrás 4 cartas: Q, W, E y R." },
  { quien: "amaru", texto: "Q lanza tu rayo, W activa tu escudo y E llama a tus ecos. Cuando el suelo se ponga rojo, ¡muévete!" },
  { quien: "tuki", texto: "¡A [[atipay]]! ¡Vamos a vencerlo, {nombre}!" },
];

export const VICTORIA: Linea[] = [
  { quien: "amaru", texto: "¡Lo lograste! El Bug se deshizo en mil pedazos de código." },
  { quien: "amaru", texto: "Tu runa rayo funcionó porque tú la escribiste. Cada vez que la usabas, Python calculaba el daño con tu código." },
  { quien: "amaru", texto: "Desde hoy viajaré contigo para [[yanapay]], para ayudarte. Pero esto no ha terminado: el Bug tiene hermanos…" },
];

/** Escalón "armar" del for: dos puntos y sangría. */
export const BLOQUES_2: RetoBloques = {
  quien: "amaru",
  titulo: "Arma la runa de los ecos",
  mision: "Ahora arma tú la runa: que cada eco diga su número. Debe mostrar Eco 0, Eco 1 y Eco 2.",
  correctas: ["for i in range(3):", '    print("Eco", i)'],
  trampas: ["for i in range(3)", 'print("Eco", i)', '    print("Eco", 3)'],
  salidaEsperada: ["Eco 0", "Eco 1", "Eco 2"],
  teoria: "La línea <code>for</code> termina en <b>dos puntos (:)</b>, y lo que se repite va con <b>4 espacios</b> de sangría. Así Python sabe qué está DENTRO del bucle.",
};

export const APRENDIDO_2 = ["Bucle for", "range() empieza en 0", "Funciones con def", "Parámetros", "return"];

/** Cuántas veces repetir: el jugador ve el efecto de cada opción antes de la teoría. */
export const OPCIONES_ECOS = [1, 2, 3];

export const RETO_RAYO: Reto = {
  id: "rayo",
  titulo: "Runa 2 · Forja tu rayo",
  enunciado: [
    "Una <b>función</b> es una runa con nombre que puedes usar muchas veces. Se crea con <code>def</code>.",
    "Haz que <code>rayo(fuerza)</code> devuelva el <b>doble</b> de la fuerza: <code>return fuerza * 2</code>.",
    "La línea de adentro va con <b>4 espacios</b> (usa el botón ⇥).",
  ],
  plantilla: "# Forja tu runa de ataque\ndef rayo(fuerza):\n    return \n\nprint(rayo(10))\n",
  pistas: [
    "Después de return escribe: fuerza * 2",
    "La línea return debe empezar con 4 espacios, debajo de def.",
    "print(rayo(10)) debería mostrar 20.",
  ],
  variables: ["rayo", "fuerza"],
  revision: "\nprint('§REVISION§', callable(rayo), rayo(5), rayo(10), rayo(7))",
  validar: ([esFuncion, a, b, c]) => {
    if (esFuncion !== "True") return "<b>rayo</b> debe ser una función: empieza con <code>def rayo(fuerza):</code>";
    if (a === "None") return "Tu runa no devuelve nada. Agrega <code>return fuerza * 2</code> dentro de la función.";
    if (a !== "10" || b !== "20" || c !== "14") return `Casi: rayo(5) dio <b>${a}</b>, pero debería dar <b>10</b> (el doble). Usa <code>return fuerza * 2</code>.`;
    return null;
  },
  exito: "¡Kraa! ¡Runa forjada! <code>rayo(10)</code> devuelve 20. En la batalla, Python usará TU función para calcular el daño. ⚡",
};
