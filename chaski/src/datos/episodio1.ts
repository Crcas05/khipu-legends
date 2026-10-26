// Temporada 1 · Misión 1 · Episodio 1: "El Ojo del Khipukamayuq"
// Aprende: variables, True/False (bool), textos (str), números (int) y print().
// Las palabras en quechua van entre [[ ]] y se guardan en el Simi Qillqa.
// (Pendiente: validar cada palabra con hablantes nativos antes de publicar.)

import type { Reto } from "../ui/taller";
import type { RetoBloques } from "../ui/bloques";

export type Quien = "chaski" | "mama" | "tuki" | "amaru" | "killa" | "yaru" | "narrador";
export interface Linea {
  quien: Quien;
  texto: string;
}

export const NOMBRES: Record<Quien, string> = {
  chaski: "Chaski",
  mama: "Mama Khipu",
  tuki: "Tuki",
  amaru: "Amaru",
  killa: "Killa",
  yaru: "Yaru",
  narrador: "",
};

export const PALABRAS: Record<string, string> = {
  allillanchu: "¿estás bien? (saludo)",
  yaku: "agua",
  wasi: "casa",
  kallpa: "fuerza",
  yachay: "saber, conocimiento",
  sulpayki: "gracias",
  sacha: "monte, árbol",
  rumi: "piedra",
  punku: "puerta",
  atipay: "vencer",
  yanapay: "ayudar",
  mayu: "río",
  kuntur: "cóndor",
  kamisaraki: "¿cómo estás? (saludo aymara)",
  killa: "luna",
  qucha: "lago, laguna",
  jallalla: "¡que viva! (aymara)",
  ayni: "ayuda mutua",
};

export const OBJETIVOS: Record<string, string> = {
  hablar1: "Habla con Mama Khipu: sigue la flecha dorada ➜",
  fuente: "Ve a la fuente, toca 👁 OJO y luego su código",
  techo: "Sigue la flecha a la casa y toca su código con el 👁 OJO",
  hablar2: "Vuelve con Mama Khipu",
  taller: "Escribe tu primera runa en el Taller",
  final: "Habla con Mama Khipu",
  completo: "Episodio 1 completado ✓",
};

export const INTRO: Linea[] = [
  { quien: "tuki", texto: "¡Lo espantaste, {nombre}! Pero el Bug Ch'aqwa ya desordenó el pueblo: la fuente se secó y las casas perdieron su color." },
  { quien: "tuki", texto: "Mama Khipu sabe cómo arreglarlo. ¡Sigue la flecha dorada del suelo! Kraa!" },
];

export const MAMA_1: Linea[] = [
  { quien: "mama", texto: "[[Allillanchu]], {nombre}. Tuki me contó que ya usaste tus primeras runas. ¡Qué bueno que llegaste!" },
  { quien: "mama", texto: "El Bug Ch'aqwa desordenó las cuerdas de nuestro pueblo. Mira la fuente: el [[yaku]] ya no corre." },
  { quien: "mama", texto: "Te entrego el Ojo del Khipukamayuq. Ábrelo y mira la fuente." },
  { quien: "tuki", texto: "Toca el botón 👁 OJO y después toca el código que brilla sobre la fuente. ¡Kraa!" },
];

export const FUENTE_LISTA: Linea[] = [
  { quien: "tuki", texto: "¡Volvió el [[yaku]]! Cambiaste el valor de una variable: fuente.agua pasó de False a True." },
  { quien: "mama", texto: "Una variable es como una cuerda del khipu: tiene un nombre y guarda un valor. Si cambias el valor, cambia el mundo." },
  { quien: "mama", texto: "Ahora mira las casas. Con el Ojo abierto, toca el código de una de ellas." },
];

export const TECHO_LISTO: Linea[] = [
  { quien: "mama", texto: "[[Wasi]] por [[wasi]], el pueblo recupera su color." },
  { quien: "tuki", texto: "Los textos en Python van entre comillas: \"rojo\". Se llaman str. ¡Kraa!" },
  { quien: "mama", texto: "Ven conmigo, Chaski. Ya sabes leer el código. Ahora aprenderás a escribirlo." },
];

export const MAMA_2: Linea[] = [
  { quien: "mama", texto: "Ahora aprenderás a crear runas. Primero ármala con bloques; después la escribirás tú solo." },
];

export const MAMA_TALLER: Linea[] = [
  { quien: "mama", texto: "¡Bien armada! Ahora escríbela tú en el Taller: guarda tu nombre y tu [[kallpa]], y muéstralos con print." },
];

/** Escalón "armar": bloques con trampas (orden, comillas, mayúsculas). */
export const BLOQUES_1: RetoBloques = {
  quien: "mama",
  titulo: "Arma tu primera runa",
  mision: "Arma una runa que guarde el nombre del héroe y lo presente. ¡Cuidado con las líneas tramposas!",
  correctas: ['heroe = "Chaski"', 'print("Soy", heroe)'],
  trampas: ["heroe = Chaski", 'Print("Soy", heroe)', 'print("Soy", "heroe")'],
  salidaEsperada: ["Soy Chaski"],
  teoria: "Python lee <b>de arriba hacia abajo</b>: primero se crea la variable y después se usa. Y distingue mayúsculas: <code>print</code> funciona, <code>Print</code> no.",
};

export const FINAL: Linea[] = [
  { quien: "mama", texto: "[[Sulpayki]], Chaski. Hoy aprendiste tu primer [[yachay]]: las variables." },
  { quien: "tuki", texto: "¡Kraa! Mira a Yaru: ¡está feliz otra vez!" },
  { quien: "mama", texto: "Pero el Bug Ch'aqwa huyó hacia la selva. Allí te espera tu primera batalla." },
];

/** Reparaciones con el Ojo: elegir el valor correcto de una variable. */
export interface Opcion {
  valor: string;
  correcta: boolean;
  explicacion: string;
}
export interface Reparacion {
  titulo: string;
  variable: string;
  pregunta: string;
  opciones: Opcion[];
}

export const REPARAR_FUENTE: Reparacion = {
  titulo: "La fuente",
  variable: "fuente.agua",
  pregunta: "En Python, True significa sí (verdadero) y False significa no (falso). ¿Qué valor necesita la fuente para tener agua?",
  opciones: [
    { valor: "True", correcta: true, explicacion: "¡Exacto! True = sí, hay agua." },
    { valor: "False", correcta: false, explicacion: "Con False la fuente sigue seca. False significa no." },
    { valor: '"agua"', correcta: false, explicacion: "Casi. Aquí la pregunta es sí o no: ¿hay agua? Para sí o no, Python usa True o False." },
  ],
};

export const REPARAR_TECHO: Reparacion = {
  titulo: "Las casas",
  variable: "casa.techo",
  pregunta: "El techo guarda un color. Los colores son textos. ¿Cuál es la forma correcta de escribirlo?",
  opciones: [
    { valor: "rojo", correcta: false, explicacion: "Sin comillas, Python cree que rojo es el nombre de otra variable y no la encuentra (NameError)." },
    { valor: '"rojo"', correcta: true, explicacion: "¡Bien! Los textos (str) siempre van entre comillas." },
    { valor: "7", correcta: false, explicacion: "7 es un número (int). Un color es un texto." },
  ],
};

/** Reto del Taller: código Python real que se ejecuta en el dispositivo. */
export const RETO_TALLER: Reto = {
  id: "variables",
  variables: ["nombre", "kallpa"],
  validar: ([tipoNombre, tipoKallpa], visibles) => {
    if (tipoNombre !== "str") return '<b>nombre</b> debe ser un texto. Los textos van entre comillas: <code>nombre = "Chaski"</code>';
    if (tipoKallpa !== "int") return "<b>kallpa</b> debe ser un número entero, sin comillas: <code>kallpa = 10</code>";
    if (!visibles.length) return "Casi. Te falta mostrar tu nombre con <code>print(nombre)</code>.";
    return null;
  },
  exito: "¡Kraa! ¡Runa completada! Guardaste un texto (str) y un número (int), y los mostraste con print. 🎉",
  titulo: "Runa 1 · Tus primeras variables",
  enunciado: [
    "Crea la variable <b>nombre</b> con tu nombre entre comillas, por ejemplo <code>\"Chaski\"</code>.",
    "Crea la variable <b>kallpa</b> con el número <code>10</code>.",
    "Muestra tu nombre con <code>print(nombre)</code>.",
  ],
  plantilla: "# Escribe tu runa aquí\nnombre = \nkallpa = \nprint(nombre)\n",
  pistas: [
    "Los textos van entre comillas: nombre = \"Chaski\"",
    "Los números van sin comillas: kallpa = 10",
    "print(nombre) muestra lo que guarda la variable nombre.",
  ],
  // Se agrega al final del código del jugador para revisar el resultado.
  revision: "\nprint('§REVISION§', type(nombre).__name__, type(kallpa).__name__, kallpa)",
};

export const APRENDIDO = ["Variables", "True y False (bool)", "Textos entre comillas (str)", "Números (int)", "print()"];
