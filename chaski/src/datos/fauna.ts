// KHIPU DE LA FAUNA: cada animal que Chaski purifica se LIBERA con Python (un objeto y su atributo)
// y se REGISTRA con SQL (INSERT INTO fauna). Luego se consulta con SELECT y con SQLAlchemy.
// Datos verificados: estado de conservación según la Lista Roja de la UICN (global).

import type { Especie } from "../fieras";
import type { Reto } from "../ui/taller";

export interface FichaFauna {
  id: Especie;
  /** Nombre como texto para Python/SQL (sin tildes raras para escribirlo fácil). */
  nombre: string;
  titulo: string;
  icono: string;
  cientifico: string;
  region: "sierra" | "selva";
  /** Estado de conservación global (UICN). */
  conservacion: string;
  come: string;
  hogar: string;
  dato: string;
}

export const FAUNA: FichaFauna[] = [
  {
    id: "puma",
    nombre: "puma",
    titulo: "Puma",
    icono: "🐆",
    cientifico: "Puma concolor",
    region: "sierra",
    conservacion: "Preocupación menor",
    come: "venados, vizcachas y otros mamíferos",
    hogar: "Desde la costa hasta la selva, pero se le ve mucho en los Andes",
    dato: "Para los incas era un animal sagrado: representaba el mundo de aquí (Kay Pacha). Dicen que el Cusco fue trazado con forma de puma.",
  },
  {
    id: "zorro",
    nombre: "zorro andino",
    titulo: "Zorro andino",
    icono: "🦊",
    cientifico: "Lycalopex culpaeus",
    region: "sierra",
    conservacion: "Preocupación menor",
    come: "roedores, conejos, aves y lagartijas",
    hogar: "Punas y quebradas de los Andes",
    dato: "Aunque se llama zorro, es pariente más cercano de los lobos. Al comer roedores ayuda a que no se vuelvan plaga en las chacras.",
  },
  {
    id: "condor",
    nombre: "condor",
    titulo: "Cóndor andino",
    icono: "🦅",
    cientifico: "Vultur gryphus",
    region: "sierra",
    conservacion: "Vulnerable",
    come: "animales que ya murieron (es carroñero)",
    hogar: "Cumbres y cañones de los Andes, y la costa del Pacífico",
    dato: "Sus alas abiertas pueden medir más de 3 metros. Limpia el campo comiendo animales muertos. Hoy está amenazado, sobre todo por envenenamiento.",
  },
  {
    id: "otorongo",
    nombre: "otorongo",
    titulo: "Otorongo (jaguar)",
    icono: "🐆",
    cientifico: "Panthera onca",
    region: "selva",
    conservacion: "Casi amenazado",
    come: "sajinos, capibaras, tortugas y peces",
    hogar: "Bosques y ríos de la Amazonía",
    dato: "Es el felino más grande de América. Nada muy bien y caza también en el agua. Pierde su hogar cuando se tala el bosque.",
  },
  {
    id: "anaconda",
    nombre: "anaconda",
    titulo: "Anaconda verde",
    icono: "🐍",
    cientifico: "Eunectes murinus",
    region: "selva",
    conservacion: "Preocupación menor",
    come: "peces, aves, roedores y caimanes pequeños",
    hogar: "Ríos, cochas y pantanos de la Amazonía",
    dato: "Es la serpiente más pesada del mundo. No tiene veneno: atrapa a su presa enrollándose. Pasa casi todo el tiempo en el agua.",
  },
  {
    id: "murcielago",
    nombre: "murcielago",
    titulo: "Murciélago",
    icono: "🦇",
    cientifico: "Chiroptera (más de 160 especies en el Perú)",
    region: "selva",
    conservacion: "Depende de la especie",
    come: "insectos, frutas o néctar (según la especie)",
    hogar: "Cuevas y bosques de todo el Perú",
    dato: "Son los únicos mamíferos que vuelan. Muchos comen mosquitos, otros reparten semillas y polinizan flores de noche: ¡ayudan a que el bosque vuelva a crecer!",
  },
];

export const ficha = (id: string) => FAUNA.find((f) => f.id === id)!;

/** Nombre de variable de Python para el animal. */
const variable = (f: FichaFauna) => f.nombre.replace(/\s+/g, "_");

/** Reto de Python: el animal es un OBJETO; liberarlo es cambiar su atributo estado. */
export function retoLiberar(f: FichaFauna): Reto {
  const v = variable(f);
  return {
    id: `liberar-${f.id}`,
    titulo: `${f.icono} Libera al ${f.titulo.toLowerCase()}`,
    enunciado: [
      `El Bug dejó al <b>${f.titulo.toLowerCase()}</b> atrapado en el código. En Python, el animal es un <b>objeto</b> y tiene <b>atributos</b> (sus datos), como <code>${v}.estado</code>.`,
      `Cambia su atributo <code>estado</code> a <code>"libre"</code> y muéstralo con <code>print(${v}.estado)</code>.`,
    ],
    plantilla: `# ${v} es un objeto: tiene atributos con punto (.)\nprint(${v}.nombre)\nprint(${v}.estado)\n\n# Devuélvelo a su hogar:\n${v}.estado = ___\nprint(${v}.estado)\n`,
    pistas: [`Un texto en Python va entre comillas: "libre".`, `La línea queda así: ${v}.estado = "libre"`],
    preludio: [
      "class Animal:",
      "    def __init__(self, nombre, region):",
      "        self.nombre = nombre",
      "        self.region = region",
      '        self.estado = "atrapado por el Bug"',
      `${v} = Animal(${JSON.stringify(f.nombre)}, ${JSON.stringify(f.region)})`,
    ].join("\n"),
    comprobar: [
      "if '___' in _codigo:",
      "    _falla('Cambia ___ por el nuevo estado (entre comillas).')",
      `elif ${v}.estado != "libre":`,
      `    _falla(f'El estado del animal es {${v}.estado!r}, pero debe ser "libre". ¿Escribiste ${v}.estado = "libre"?')`,
      "elif 'libre' not in _salida:",
      `    _falla('Muestra el nuevo estado con print(${v}.estado).')`,
    ].join("\n"),
    solucion: `print(${v}.nombre)\nprint(${v}.estado)\n\n${v}.estado = "libre"\nprint(${v}.estado)\n`,
    exito: `¡${f.titulo} libre! 🌿 Cambiaste un ATRIBUTO de un OBJETO: así se guardan los datos en Python (y en SQLAlchemy cada fila es un objeto así).`,
  };
}

/** Reto de SQL: guardar el animal en la tabla fauna del khipu. */
export function retoRegistrar(f: FichaFauna, registrados: string[]): Reto {
  return {
    id: `registrar-${f.id}`,
    lenguaje: "sql",
    titulo: `🧶 Anota al ${f.titulo.toLowerCase()} en el Khipu`,
    enunciado: [
      "El <b>Khipu de la fauna</b> es una <b>tabla SQL</b> llamada <code>fauna</code> con columnas <code>nombre</code>, <code>region</code> y <code>estado</code>.",
      `Agrega una fila con <code>INSERT INTO</code>: nombre <code>'${f.nombre}'</code>, región <code>'${f.region}'</code> y estado <code>'libre'</code>.`,
    ],
    plantilla: `INSERT INTO fauna (nombre, region, estado)\nVALUES ('${f.nombre}', ___, ___);\n\nSELECT * FROM fauna;`,
    pistas: ["En SQL los textos van entre comillas simples: 'sierra'.", `Los VALUES van en el mismo orden que las columnas: ('${f.nombre}', '${f.region}', 'libre')`],
    preludio: preludioFauna(registrados),
    comprobar: [
      `_f = _db.execute("SELECT region, estado FROM fauna WHERE nombre = ?", (${JSON.stringify(f.nombre)},)).fetchall()`,
      "if not _f:",
      `    _falla("Todavía no hay una fila con nombre '${f.nombre}'. Usa INSERT INTO fauna ... VALUES (...).")`,
      `elif _f[-1][0] != ${JSON.stringify(f.region)}:`,
      `    _falla(f"La región quedó {_f[-1][0]!r}. El ${f.titulo.toLowerCase()} vive en la ${f.region}: escribe '${f.region}'.")`,
      "elif _f[-1][1] != 'libre':",
      `    _falla(f"El estado quedó {_f[-1][1]!r}: debe ser 'libre'.")`,
    ].join("\n"),
    solucion: `INSERT INTO fauna (nombre, region, estado)\nVALUES ('${f.nombre}', '${f.region}', 'libre');\n\nSELECT * FROM fauna;`,
    exito: `¡Anotado en el Khipu! 🧶 INSERT INTO agrega una fila nueva a una tabla. Los incas guardaban datos en nudos; tú los guardas en SQL.`,
  };
}

/** Crea la tabla con los animales ya registrados. */
function preludioFauna(registrados: string[]): string {
  const filas = registrados.map((id) => ficha(id)).filter(Boolean);
  return [
    "_db.execute('CREATE TABLE fauna (id INTEGER PRIMARY KEY, nombre TEXT, region TEXT, estado TEXT)')",
    ...filas.map((f) => `_db.execute("INSERT INTO fauna (nombre, region, estado) VALUES (?, ?, 'libre')", (${JSON.stringify(f.nombre)}, ${JSON.stringify(f.region)}))`),
  ].join("\n");
}

/** Consultas al khipu (SELECT, WHERE, COUNT, ORDER BY y SQLAlchemy) con TUS animales registrados. */
export function consultasFauna(registrados: string[]): (Reto & { icono: string; corto: string })[] {
  const pre = preludioFauna(registrados);
  const hay = (r: string) => registrados.some((id) => ficha(id).region === r);
  const region = hay("selva") ? "selva" : "sierra";
  return [
    {
      id: "fauna-todo",
      icono: "📜",
      corto: "Ver todo el khipu (SELECT *)",
      lenguaje: "sql",
      titulo: "📜 Lee todo el Khipu",
      enunciado: ["Muestra <b>todas las filas y columnas</b> de la tabla <code>fauna</code>."],
      plantilla: "SELECT ___ FROM fauna;",
      pistas: ["El asterisco * significa «todas las columnas»."],
      preludio: pre,
      comprobar: "if not _igual('SELECT * FROM fauna'):\n    _falla('Debe salir toda la tabla: SELECT * FROM fauna;')",
      solucion: "SELECT * FROM fauna;",
      exito: "¡Leíste todo el khipu! SELECT * trae todas las columnas.",
    },
    {
      id: "fauna-region",
      icono: "🔎",
      corto: `Solo los de la ${region} (WHERE)`,
      lenguaje: "sql",
      titulo: `🔎 ¿Quiénes viven en la ${region}?`,
      enunciado: [`Muestra solo el <code>nombre</code> de los animales cuya <code>region</code> sea <code>'${region}'</code>.`],
      plantilla: `SELECT nombre FROM fauna\nWHERE ___ = ___;`,
      pistas: ["WHERE filtra filas: WHERE columna = 'valor'", `Queda: WHERE region = '${region}'`],
      preludio: pre,
      comprobar: `if not _igual("SELECT nombre FROM fauna WHERE region = '${region}'"):\n    _falla("Deben salir solo los nombres de la ${region}. Revisa tu WHERE.")`,
      solucion: `SELECT nombre FROM fauna\nWHERE region = '${region}';`,
      exito: "¡Filtraste con WHERE! Así se buscan datos en tablas gigantes.",
    },
    {
      id: "fauna-contar",
      icono: "🔢",
      corto: "¿Cuántos liberaste? (COUNT)",
      lenguaje: "sql",
      titulo: "🔢 ¿Cuántos animales liberaste?",
      enunciado: ["Cuenta las filas de la tabla <code>fauna</code> con <code>COUNT(*)</code>."],
      plantilla: "SELECT ___ FROM fauna;",
      pistas: ["COUNT(*) cuenta filas."],
      preludio: pre,
      comprobar: "if not _igual('SELECT COUNT(*) FROM fauna'):\n    _falla('Usa SELECT COUNT(*) FROM fauna;')",
      solucion: "SELECT COUNT(*) FROM fauna;",
      exito: `¡Llevas ${registrados.length} animal${registrados.length === 1 ? "" : "es"} libre${registrados.length === 1 ? "" : "s"}! COUNT cuenta por ti.`,
    },
    {
      id: "fauna-orden",
      icono: "🔤",
      corto: "Ordenar por nombre (ORDER BY)",
      lenguaje: "sql",
      titulo: "🔤 Ordena el Khipu",
      enunciado: ["Muestra <code>nombre</code> y <code>region</code>, <b>ordenados por nombre</b> de la A a la Z."],
      plantilla: "SELECT nombre, region FROM fauna\nORDER BY ___;",
      pistas: ["ORDER BY columna ordena de menor a mayor (A → Z)."],
      preludio: pre,
      comprobar: "if not _igual('SELECT nombre, region FROM fauna ORDER BY nombre', orden=True):\n    _falla('Deben salir ordenados por nombre: ORDER BY nombre')",
      solucion: "SELECT nombre, region FROM fauna\nORDER BY nombre;",
      exito: "¡Ordenado! ORDER BY nombre DESC los ordenaría al revés (Z → A).",
    },
    {
      id: "fauna-orm",
      icono: "🐍",
      corto: "Lo mismo con SQLAlchemy (ORM)",
      lenguaje: "python",
      titulo: "🐍 El Khipu con SQLAlchemy",
      enunciado: [
        "<b>SQLAlchemy</b> te deja usar la base de datos desde Python: cada fila es un <b>objeto</b> <code>Fauna</code>.",
        `Completa la consulta para traer los animales de la <code>${region}</code> con <code>filter_by(region=...)</code>.`,
      ],
      plantilla: `# Ya está creada la clase Fauna y la sesión con tus animales\nanimales = sesion.query(Fauna).filter_by(region=___).all()\n\nfor a in animales:\n    print(a.nombre, "→", a.estado)\n`,
      pistas: [`El valor va entre comillas: region="${region}"`, "filter_by es como el WHERE de SQL."],
      preludio: [
        "from sqlalchemy import create_engine, Column, Integer, String",
        "from sqlalchemy.orm import declarative_base, Session",
        "Base = declarative_base()",
        "class Fauna(Base):",
        "    __tablename__ = 'fauna'",
        "    id = Column(Integer, primary_key=True)",
        "    nombre = Column(String)",
        "    region = Column(String)",
        "    estado = Column(String)",
        "_motor = create_engine('sqlite://')",
        "Base.metadata.create_all(_motor)",
        "sesion = Session(_motor)",
        `for _n, _r in ${JSON.stringify(registrados.map((id) => [ficha(id).nombre, ficha(id).region]))}:`,
        "    sesion.add(Fauna(nombre=_n, region=_r, estado='libre'))",
        "sesion.commit()",
      ].join("\n"),
      comprobar: [
        "if '___' in _codigo:",
        "    _falla('Cambia ___ por la región entre comillas.')",
        "elif 'filter_by' not in _codigo:",
        "    _falla('Usa filter_by(region=...) para filtrar.')",
        `elif sorted(a.nombre for a in animales) != sorted(f.nombre for f in sesion.query(Fauna).filter_by(region=${JSON.stringify(region)})):`,
        `    _falla('Deben salir solo los animales de la ${region}.')`,
      ].join("\n"),
      solucion: `animales = sesion.query(Fauna).filter_by(region="${region}").all()\n\nfor a in animales:\n    print(a.nombre, "→", a.estado)\n`,
      exito: "¡Usaste un ORM! sesion.query(Fauna).filter_by(...) hace por dentro un SELECT ... WHERE. Cada fila llegó como un objeto con atributos.",
    },
  ];
}
