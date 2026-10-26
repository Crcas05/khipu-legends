// Temporada 1 · Misión 1 · Episodio 1: "El Ojo del Khipukamayuq"
// Aprende: variables, True/False (bool), textos (str), números (int) y print().
// Las palabras en quechua van entre [[ ]] y se guardan en el Simi Qillqa.
// (Pendiente: validar cada palabra con hablantes nativos antes de publicar.)

export type Quien = "chaski" | "mama" | "tuki" | "narrador";
export interface Linea {
  quien: Quien;
  texto: string;
}

export const NOMBRES: Record<Quien, string> = {
  chaski: "Chaski",
  mama: "Mama Khipu",
  tuki: "Tuki",
  narrador: "",
};

export const PALABRAS: Record<string, string> = {
  allillanchu: "¿estás bien? (saludo)",
  yaku: "agua",
  wasi: "casa",
  kallpa: "fuerza",
  yachay: "saber, conocimiento",
  sulpayki: "gracias",
};

export const OBJETIVOS: Record<string, string> = {
  hablar1: "Habla con Mama Khipu (sigue el ◆ amarillo)",
  fuente: "Toca 👁 OJO y luego el código de la fuente",
  techo: "Con el 👁 OJO, toca el código de una casa",
  hablar2: "Vuelve con Mama Khipu",
  taller: "Escribe tu primera runa en el Taller",
  final: "Habla con Mama Khipu",
  completo: "Episodio 1 completado ✓",
};

export const INTRO: Linea[] = [
  { quien: "narrador", texto: "Pueblo de Qhapaq, en lo alto de los Andes." },
  { quien: "narrador", texto: "Anoche, el Bug Ch'aqwa desordenó el código del mundo. La fuente se secó y las casas perdieron su color." },
  { quien: "tuki", texto: "¡Kraa! Despierta, Chaski. Mama Khipu te está buscando en la plaza. ¡Sigue el rombo amarillo!" },
];

export const MAMA_1: Linea[] = [
  { quien: "mama", texto: "[[Allillanchu]], Chaski. Qué bueno que llegaste." },
  { quien: "mama", texto: "El Bug Ch'aqwa desordenó las cuerdas de nuestro pueblo. Mira la fuente: el [[yaku]] ya no corre." },
  { quien: "mama", texto: "Pero tú eres un Chaski. Puedes ver el mundo como realmente es: código." },
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
  { quien: "mama", texto: "Los Chaski escriben sus runas en el Taller, con calma, antes de cada batalla." },
  { quien: "mama", texto: "Escribe tu primera runa: guarda tu nombre y tu [[kallpa]] en variables. Luego muéstralos con print." },
];

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
export const RETO_TALLER = {
  titulo: "Runa 1 · Tus primeras variables",
  enunciado: [
    "Crea la variable <b>nombre</b> con el texto <code>\"Chaski\"</code>.",
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
