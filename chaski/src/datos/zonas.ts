// El viaje por el Perú: 10 zonas, cada una con su cultura, su guía y sus lecciones.
// Las fichas culturales y de naturaleza son breves y generales; deben revisarse con
// especialistas y con las comunidades antes de publicar (ver condiciones del proyecto).

import type { Linea, Quien } from "./episodio1";
import type { Leccion } from "../ui/leccion";
import * as P from "./leccionesPython";
import * as S from "./leccionesSql";

export interface FichaSitio {
  nombre: string;
  icono: string;
  dato: string;
}

export interface SitioZona {
  id: string;
  nombre: string;
  icono: string;
  x: number;
  z: number;
  leccion: Leccion;
  ficha: FichaSitio;
}

export type Ambiente = "altiplano" | "selva" | "nubes" | "piedra" | "ayllu" | "desierto" | "barro" | "feria" | "cumbre";

export interface Zona {
  id: string;
  numero: number;
  nombre: string;
  lugar: string;
  region: "Costa" | "Sierra" | "Selva" | "Altiplano";
  cultura: string;
  temas: string;
  guia: Quien;
  ambiente: Ambiente;
  mapa: [number, number]; // posición en el mapa del Perú (%)
  intro: Linea[];
  fin: Linea[];
  sitios: SitioZona[];
}

/** La zona 1 (Valle Sagrado) tiene su propio motor; aquí solo aparece en el mapa. */
export const ZONA_VALLE = {
  id: "valle",
  numero: 1,
  nombre: "Valle Sagrado",
  lugar: "Cusco",
  region: "Sierra" as const,
  cultura: "Quechua · andenes, vicuñas y cóndores",
  temas: "if / else · listas · for",
  mapa: [66, 69] as [number, number],
};

export const ZONAS: Zona[] = [
  {
    id: "titicaca",
    numero: 2,
    nombre: "Lago Titicaca",
    lugar: "Puno",
    region: "Altiplano",
    cultura: "Uros, Taquile y el pueblo aymara",
    temas: "Operadores · textos · input · if / elif / and / or",
    guia: "killa",
    ambiente: "altiplano",
    mapa: [79, 84],
    intro: [
      { quien: "narrador", texto: "El lago Titicaca, en el altiplano de Puno. El Bug Ch'aqwa enredó las cuentas y los mensajes del lago." },
      { quien: "killa", texto: "¡[[Kamisaraki]]! Así se saluda en aymara. Soy Killa, guerrera de la [[killa]], la luna. Te ayudaré a liberar la [[qucha]]." },
      { quien: "tuki", texto: "¡Kraa! Hay 4 lugares por rescatar. ¡Sigue la flecha o mira el mapa!" },
    ],
    fin: [
      { quien: "killa", texto: "¡[[Jallalla]]! El lago brilla otra vez. Ya calculas, manejas textos y tomas decisiones con if." },
      { quien: "killa", texto: "Desde ahora viajo contigo, {nombre}. Próximo destino: la selva del Ucayali." },
    ],
    sitios: [
      { id: "balsa", nombre: "La balsa de totora", icono: "🛶", x: -16, z: -6, leccion: P.B2_OPERADORES, ficha: { nombre: "Islas y balsas de totora", icono: "🛶", dato: "Los uros construyen sus islas flotantes y sus balsas con totora, una planta que crece en el lago." } },
      { id: "telar", nombre: "El telar de Taquile", icono: "🧶", x: 14, z: -4, leccion: P.B3_TEXTOS, ficha: { nombre: "Textiles de Taquile", icono: "🧶", dato: "El arte textil de la isla de Taquile está reconocido por la UNESCO como Patrimonio Cultural Inmaterial de la Humanidad." } },
      { id: "puerto", nombre: "El puerto", icono: "⚓", x: -8, z: 14, leccion: P.B4_INPUT, ficha: { nombre: "Lago Titicaca", icono: "🌊", dato: "Lo comparten el Perú y Bolivia, a más de 3 800 metros de altura. Se le considera el lago navegable más alto del mundo." } },
      { id: "luna", nombre: "El mirador de la luna", icono: "🌙", x: 16, z: 16, leccion: P.B5_CONDICIONALES, ficha: { nombre: "Mama Killa", icono: "🌙", dato: "En la cosmovisión andina, Mama Killa es la madre luna; su ciclo ayudaba a organizar el calendario agrícola." } },
    ],
  },
  {
    id: "ucayali",
    numero: 3,
    nombre: "Río Ucayali",
    lugar: "Ucayali",
    region: "Selva",
    cultura: "Pueblo shipibo-konibo y el arte kené",
    temas: "while · listas · 🏆 Proyecto básico",
    guia: "amaru",
    ambiente: "selva",
    mapa: [62, 42],
    intro: [
      { quien: "narrador", texto: "El río Ucayali, en la Amazonía. Aquí vive el pueblo shipibo-konibo, famoso por sus diseños kené." },
      { quien: "amaru", texto: "¡Volví a mi río, {nombre}! El Bug desordenó la cosecha y los diseños. Usaremos bucles y listas." },
    ],
    fin: [
      { quien: "amaru", texto: "¡Terminaste el nivel básico de Python! Ya puedes escribir programas completos." },
      { quien: "tuki", texto: "¡Kraa! Ahora, al nivel intermedio. ¡Rumbo a la fortaleza de las nubes!" },
    ],
    sitios: [
      { id: "canoa", nombre: "La canoa", icono: "🛶", x: 15, z: -10, leccion: P.B7_WHILE, ficha: { nombre: "Río Ucayali", icono: "🌊", dato: "Junto con el Marañón, el Ucayali forma el río Amazonas, uno de los ríos más caudalosos del mundo." } },
      { id: "cosecha", nombre: "La cosecha", icono: "🍇", x: -15, z: -4, leccion: P.B8_LISTAS, ficha: { nombre: "Aguaje y camu camu", icono: "🍇", dato: "El camu camu es un fruto amazónico muy rico en vitamina C. El aguaje crece en palmeras de zonas inundables." } },
      { id: "kene", nombre: "Los diseños kené", icono: "🎨", x: -10, z: 15, leccion: P.B8_RECORRER, ficha: { nombre: "Kené shipibo-konibo", icono: "🎨", dato: "Diseños geométricos que las mujeres shipibo-konibo pintan y bordan. Son Patrimonio Cultural de la Nación." } },
      { id: "censo", nombre: "El censo de la comunidad", icono: "🏆", x: 12, z: 16, leccion: P.PROYECTO_BASICO, ficha: { nombre: "Delfín rosado", icono: "🐬", dato: "Vive en los ríos de la Amazonía. Su color rosado se vuelve más intenso con los años." } },
    ],
  },
  {
    id: "kuelap",
    numero: 4,
    nombre: "Kuélap",
    lugar: "Amazonas",
    region: "Selva",
    cultura: "Cultura chachapoyas, el pueblo de las nubes",
    temas: "Funciones · diccionarios · tuplas y sets · métodos de texto",
    guia: "killa",
    ambiente: "nubes",
    mapa: [37, 21],
    intro: [
      { quien: "narrador", texto: "Kuélap, la fortaleza de los chachapoyas, en lo alto de las montañas de Amazonas, entre las nubes." },
      { quien: "killa", texto: "Nivel intermedio, {nombre}. Aquí tus runas serán más poderosas: funciones, diccionarios y más." },
    ],
    fin: [{ quien: "killa", texto: "¡La fortaleza es libre! Tus funciones y diccionarios ya son de nivel profesional." }],
    sitios: [
      { id: "muralla", nombre: "La gran muralla", icono: "🧱", x: -14, z: -8, leccion: P.I1_FUNCIONES, ficha: { nombre: "Fortaleza de Kuélap", icono: "🏰", dato: "La construyó la cultura chachapoyas en lo alto de una montaña. Sus murallas llegan a medir cerca de 19 metros." } },
      { id: "almacen", nombre: "El almacén", icono: "🌽", x: 14, z: -6, leccion: P.I2_DICCIONARIOS, ficha: { nombre: "Casas circulares", icono: "🛖", dato: "Kuélap tiene cientos de construcciones circulares; algunas llevan frisos con forma de rombos." } },
      { id: "karajia", nombre: "El mirador de Karajía", icono: "🗿", x: -12, z: 14, leccion: P.I3_TUPLAS_SETS, ficha: { nombre: "Sarcófagos de Karajía", icono: "🗿", dato: "Figuras funerarias chachapoyas colocadas en un acantilado, mirando el valle." } },
      { id: "mensaje", nombre: "La piedra del mensaje", icono: "📜", x: 14, z: 15, leccion: P.I4_METODOS_TEXTO, ficha: { nombre: "Gallito de las rocas", icono: "🐦", dato: "Es el ave nacional del Perú. Vive en los bosques nublados y el macho tiene un plumaje rojo anaranjado." } },
    ],
  },
  {
    id: "chavin",
    numero: 5,
    nombre: "Chavín de Huántar",
    lugar: "Áncash",
    region: "Sierra",
    cultura: "Cultura chavín y su templo",
    temas: "Errores · comprensiones y lambda · clases (POO)",
    guia: "amaru",
    ambiente: "piedra",
    mapa: [35, 38],
    intro: [
      { quien: "narrador", texto: "Chavín de Huántar, un templo de piedra con galerías bajo tierra, en Áncash." },
      { quien: "amaru", texto: "Aquí se esconde la magia más poderosa de Python: atrapar errores y crear tus propios objetos." },
    ],
    fin: [{ quien: "amaru", texto: "¡Ya creas clases y objetos, {nombre}! Así se construyen los videojuegos de verdad." }],
    sitios: [
      { id: "galerias", nombre: "Las galerías", icono: "🕳️", x: -14, z: -6, leccion: P.I5_ERRORES, ficha: { nombre: "Galerías de Chavín", icono: "🕳️", dato: "Pasadizos de piedra bajo el templo de Chavín de Huántar, declarado Patrimonio Mundial por la UNESCO." } },
      { id: "cabezas", nombre: "Las cabezas clavas", icono: "🗿", x: 14, z: -2, leccion: P.I6_COMPRENSIONES, ficha: { nombre: "Cabezas clavas", icono: "🗿", dato: "Esculturas de piedra que estaban empotradas en los muros exteriores del templo." } },
      { id: "lanzon", nombre: "El Lanzón", icono: "🪨", x: 0, z: 16, leccion: P.I7_CLASES, ficha: { nombre: "El Lanzón", icono: "🪨", dato: "Monolito tallado de más de 4 metros que se encuentra en el centro de las galerías." } },
    ],
  },
  {
    id: "ayllu",
    numero: 6,
    nombre: "Tu Ayllu",
    lugar: "Los Andes",
    region: "Sierra",
    cultura: "Ayni y minka: la comunidad andina",
    temas: "Módulos · pruebas · archivos · 🏆 Proyecto intermedio",
    guia: "yaru",
    ambiente: "ayllu",
    mapa: [51, 63],
    intro: [
      { quien: "yaru", texto: "¡Mee! Soy Yaru. Este será TU ayllu, tu comunidad. Aquí se trabaja con [[ayni]]: hoy te ayudo, mañana me ayudas." },
      { quien: "yaru", texto: "Para construirlo bien usaremos módulos, pruebas y archivos. ¡Como un equipo profesional!" },
    ],
    fin: [
      { quien: "yaru", texto: "¡Mee! ¡Completaste el nivel intermedio de Python! Tu ayllu está guardado y probado." },
      { quien: "tuki", texto: "Ahora viene el idioma de las bases de datos: SQL. ¡A la costa, a Caral!" },
    ],
    sitios: [
      { id: "calendario", nombre: "El calendario", icono: "🌱", x: -14, z: -6, leccion: P.I8_MODULOS, ficha: { nombre: "Ayni", icono: "🤝", dato: "Ayuda mutua andina: hoy trabajo en tu chacra y mañana tú en la mía." } },
      { id: "puente", nombre: "El puente de ichu", icono: "🌉", x: 14, z: -6, leccion: P.I9_PRUEBAS, ficha: { nombre: "Q'eswachaka", icono: "🌉", dato: "Puente colgante de fibra vegetal en Cusco que las comunidades renuevan cada año. Es Patrimonio Cultural Inmaterial de la Humanidad." } },
      { id: "archivo", nombre: "El archivo del ayllu", icono: "💾", x: -12, z: 14, leccion: P.I10_ARCHIVOS, ficha: { nombre: "Minka", icono: "👥", dato: "Trabajo colectivo de toda la comunidad para una obra común, como un canal o un camino." } },
      { id: "sistema", nombre: "El sistema del ayllu", icono: "🏆", x: 13, z: 15, leccion: P.PROYECTO_INTERMEDIO, ficha: { nombre: "Andenes", icono: "⛰️", dato: "Terrazas de cultivo que aprovechan el agua y evitan que la tierra de las laderas se pierda." } },
    ],
  },
  {
    id: "caral",
    numero: 7,
    nombre: "Caral",
    lugar: "Lima",
    region: "Costa",
    cultura: "La civilización más antigua de América",
    temas: "SQL · DQL: SELECT, WHERE, ORDER BY, GROUP BY",
    guia: "yaru",
    ambiente: "desierto",
    mapa: [29, 47],
    intro: [
      { quien: "narrador", texto: "Caral, en el valle de Supe. Una ciudad con unos 5 000 años de antigüedad." },
      { quien: "yaru", texto: "¡Mee! Aquí aprenderás SQL, el idioma de las bases de datos. Primero, a CONSULTAR: eso se llama DQL." },
    ],
    fin: [{ quien: "yaru", texto: "¡Ya consultas bases de datos como un analista! Siguiente: aprender a CONSTRUIRLAS en Chan Chan." }],
    sitios: [
      { id: "archivo", nombre: "El archivo de Caral", icono: "🗃️", x: -14, z: -6, leccion: S.SQL_SELECT, ficha: { nombre: "Caral", icono: "🏛️", dato: "Ciudad sagrada de unos 5 000 años, considerada la civilización más antigua de América. Es Patrimonio Mundial." } },
      { id: "piramide", nombre: "La Pirámide Mayor", icono: "🔺", x: 14, z: -2, leccion: S.SQL_ORDEN, ficha: { nombre: "Pirámide Mayor", icono: "🔺", dato: "El edificio más grande de Caral, construido con piedras y bolsas de fibra vegetal llenas de piedras (shicras)." } },
      { id: "anfiteatro", nombre: "El anfiteatro", icono: "🎶", x: 0, z: 16, leccion: S.SQL_GRUPOS, ficha: { nombre: "Flautas de Caral", icono: "🎶", dato: "En el anfiteatro se encontraron flautas hechas con huesos de aves: la música era parte de la vida en Caral." } },
    ],
  },
  {
    id: "chanchan",
    numero: 8,
    nombre: "Chan Chan",
    lugar: "La Libertad",
    region: "Costa",
    cultura: "Reino chimú, la gran ciudad de barro",
    temas: "SQL · DDL: CREATE, ALTER, DROP, TRUNCATE · DML: INSERT, UPDATE, DELETE",
    guia: "yaru",
    ambiente: "barro",
    mapa: [21, 30],
    intro: [
      { quien: "narrador", texto: "Chan Chan, capital del reino chimú, junto al mar en La Libertad." },
      { quien: "yaru", texto: "¡Mee! Aquí aprenderás a CREAR tablas (DDL) y a cambiar sus datos (DML). ¡A construir!" },
    ],
    fin: [{ quien: "yaru", texto: "¡Ya construyes bases de datos completas! Vamos a la gran feria a unirlo todo." }],
    sitios: [
      { id: "palacios", nombre: "Los palacios", icono: "🏗️", x: -14, z: -8, leccion: S.SQL_CREATE, ficha: { nombre: "Chan Chan", icono: "🏯", dato: "Capital del reino chimú, considerada la ciudad de barro más grande de la América prehispánica. Es Patrimonio Mundial." } },
      { id: "frisos", nombre: "Los frisos", icono: "🐟", x: 14, z: -6, leccion: S.SQL_ALTER, ficha: { nombre: "Frisos de Chan Chan", icono: "🐟", dato: "Sus muros de adobe están decorados con peces, aves y olas: el mar era central para los chimú." } },
      { id: "registro", nombre: "El registro", icono: "📝", x: -12, z: 14, leccion: S.SQL_INSERT, ficha: { nombre: "Ciudadelas", icono: "🧱", dato: "La ciudad tenía varias ciudadelas amuralladas con plazas, depósitos y pasadizos." } },
      { id: "murales", nombre: "Los murales", icono: "🎨", x: 13, z: 15, leccion: S.SQL_UPDATE, ficha: { nombre: "Caballitos de totora", icono: "🛶", dato: "En Huanchaco, cerca de Chan Chan, los pescadores aún navegan en caballitos de totora, una tradición muy antigua." } },
    ],
  },
  {
    id: "feria",
    numero: 9,
    nombre: "La gran feria",
    lugar: "Los Andes centrales",
    region: "Sierra",
    cultura: "Ferias andinas, trueque y cultura afroperuana",
    temas: "SQL · JOIN · TCL: transacciones · DCL: permisos",
    guia: "killa",
    ambiente: "feria",
    mapa: [45, 55],
    intro: [
      { quien: "narrador", texto: "Una gran feria donde llegan comerciantes de costa, sierra y selva." },
      { quien: "killa", texto: "Aquí aprenderás lo que usan los sistemas reales: unir tablas, transacciones seguras y permisos." },
    ],
    fin: [{ quien: "killa", texto: "¡Dominas SQL completo: DQL, DDL, DML, TCL y DCL! Solo falta la prueba final en Machu Picchu." }],
    sitios: [
      { id: "puestos", nombre: "Los puestos", icono: "🛍️", x: -14, z: -6, leccion: S.SQL_JOIN, ficha: { nombre: "Ferias andinas", icono: "🛍️", dato: "Mercados semanales donde las comunidades venden e intercambian productos de distintas regiones." } },
      { id: "trueque", nombre: "El trueque", icono: "🥔", x: 14, z: -2, leccion: S.SQL_TCL, ficha: { nombre: "Trueque", icono: "🥔", dato: "Intercambio de productos sin dinero que todavía se practica en algunas comunidades andinas." } },
      { id: "guardian", nombre: "El guardián del archivo", icono: "🔐", x: 0, z: 16, leccion: S.SQL_DCL, ficha: { nombre: "Cajón peruano", icono: "🥁", dato: "Instrumento de la música afroperuana, declarado Patrimonio Cultural de la Nación." } },
    ],
  },
  {
    id: "machupicchu",
    numero: 10,
    nombre: "Machu Picchu",
    lugar: "Cusco",
    region: "Sierra",
    cultura: "El Tawantinsuyu y el Qhapaq Ñan",
    temas: "Python + SQL: sqlite3 · SQLAlchemy · 🏆 Proyecto final",
    guia: "amaru",
    ambiente: "cumbre",
    mapa: [60, 66],
    intro: [
      { quien: "narrador", texto: "Machu Picchu. Aquí se esconde el Bug Ch'aqwa original." },
      { quien: "amaru", texto: "La prueba final, {nombre}: unir Python y SQL. Killa, Yaru y yo estamos contigo." },
    ],
    fin: [
      { quien: "amaru", texto: "¡El Bug Ch'aqwa fue derrotado para siempre! Los Andes, la costa y la selva vuelven a estar en orden." },
      { quien: "mama", texto: "[[Sulpayki]], {nombre}. Ya eres un Chaski del código: llevas el conocimiento a donde vayas." },
    ],
    sitios: [
      { id: "caminos", nombre: "Los caminos", icono: "🛤️", x: -14, z: -6, leccion: S.PY_SQLITE, ficha: { nombre: "Qhapaq Ñan", icono: "🛤️", dato: "Red de caminos incas de miles de kilómetros que unía el Tawantinsuyu. Es Patrimonio Mundial." } },
      { id: "terrazas", nombre: "Las terrazas", icono: "🦙", x: 14, z: -2, leccion: S.PY_SQLALCHEMY, ficha: { nombre: "Machu Picchu", icono: "⛰️", dato: "Ciudadela inca del siglo XV, Santuario Histórico y Patrimonio Mundial." } },
      { id: "intihuatana", nombre: "El Intihuatana", icono: "☀️", x: 0, z: 16, leccion: S.PROYECTO_FINAL, ficha: { nombre: "Intihuatana", icono: "☀️", dato: "Piedra tallada de Machu Picchu asociada a la observación del sol." } },
    ],
  },
];

/** El programa completo (para el registro de sellos del Simi Qillqa). */
export const PROGRAMA: { nivel: string; modulos: string[] }[] = [
  { nivel: "Python básico", modulos: ["B1 Variables y tipos", "B2 Operadores", "B3 Textos", "B4 Entrada y conversión", "B5 Condicionales", "B6 Bucle for", "B7 Bucle while", "B8 Listas", "🏆 Proyecto básico"] },
  {
    nivel: "Python intermedio",
    modulos: ["I1 Funciones a fondo", "I2 Diccionarios", "I3 Tuplas y sets", "I4 Métodos de texto", "I5 Errores y excepciones", "I6 Comprensiones y lambda", "I7 Clases y objetos", "I8 Módulos y buenas prácticas", "I9 Pruebas", "I10 Archivos y JSON", "🏆 Proyecto intermedio"],
  },
  {
    nivel: "SQL",
    modulos: ["DQL Consultar (SELECT)", "DQL Ordenar (ORDER BY, LIMIT)", "DQL Agrupar (GROUP BY)", "DQL Unir tablas (JOIN)", "DDL Crear tablas (CREATE)", "DDL Modificar (ALTER, DROP, TRUNCATE)", "DML Insertar (INSERT)", "DML Cambiar y borrar (UPDATE, DELETE)", "TCL Transacciones", "DCL Permisos"],
  },
  { nivel: "Python + SQL", modulos: ["Python + SQL (sqlite3)", "Python + SQL (SQLAlchemy)", "🏆 Proyecto final"] },
];
