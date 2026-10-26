// Programa de SQL (DQL, DDL, DML, JOIN, TCL, DCL) y Python + SQL (sqlite3 y SQLAlchemy).
// El SQL corre en SQLite real dentro del dispositivo. GRANT/REVOKE se simulan
// (SQLite no tiene usuarios) y TRUNCATE se traduce a DELETE.

import type { Leccion } from "../ui/leccion";

const tablasCaral = `_db.executescript("""
CREATE TABLE reliquias (id INTEGER PRIMARY KEY, nombre TEXT, material TEXT, sector TEXT, antiguedad INTEGER);
INSERT INTO reliquias VALUES
 (1, 'Flauta de hueso', 'hueso', 'Anfiteatro', 4500),
 (2, 'Quipu antiguo', 'algodón', 'Pirámide Mayor', 4200),
 (3, 'Piedra del altar', 'piedra', 'Pirámide Mayor', 4800),
 (4, 'Figura de arcilla', 'arcilla', 'Residencial', 4000),
 (5, 'Huanca', 'piedra', 'Plaza Circular', 4700),
 (6, 'Red de pesca', 'algodón', 'Residencial', 3900),
 (7, 'Mortero', 'piedra', 'Residencial', 4100);
CREATE TABLE ofrendas (id INTEGER PRIMARY KEY, sector TEXT, tipo TEXT, cantidad INTEGER);
INSERT INTO ofrendas VALUES
 (1, 'Pirámide Mayor', 'conchas', 12), (2, 'Pirámide Mayor', 'algodón', 15),
 (3, 'Anfiteatro', 'conchas', 6), (4, 'Anfiteatro', 'flores', 9),
 (5, 'Residencial', 'pescado', 25), (6, 'Plaza Circular', 'flores', 4);
""")`;

// =============================================================================
// ZONA 7 · CARAL (Yaru) — DQL
// =============================================================================

export const SQL_SELECT: Leccion = {
  id: "Q1",
  modulo: "DQL Consultar (SELECT)",
  titulo: "El archivo de Caral",
  pasos: [
    { tipo: "voz", quien: "yaru", texto: "¡Mee! Caral es la ciudad más antigua de América. Sus hallazgos están en una base de datos: una QULLQA de información. ¡Consultémosla con SQL!" },
    {
      tipo: "teoria",
      texto:
        "Una <b>base de datos</b> guarda la información en <b>tablas</b> (filas y columnas). <b>SQL</b> es el idioma para hablarle. <code>SELECT</code> elige columnas, <code>FROM</code> dice de qué tabla y <code>WHERE</code> filtra filas. <code>*</code> significa «todas las columnas». Los textos van entre comillas simples: <code>'piedra'</code>.",
      codigo: "SELECT nombre, sector\nFROM reliquias\nWHERE antiguedad > 4500;",
    },
    {
      tipo: "elegir",
      quien: "yaru",
      texto: "¿Qué consulta trae TODAS las columnas de la tabla reliquias?",
      opciones: [
        ["SELECT * FROM reliquias;", true, "¡Sí! El asterisco significa todas las columnas."],
        ["SELECT reliquias;", false, "Falta decir qué columnas (*) y FROM."],
        ["GET ALL reliquias;", false, "SQL usa SELECT, no GET."],
      ],
    },
    {
      tipo: "taller",
      reto: {
        id: "Q1",
        lenguaje: "sql",
        titulo: "Consulta Q1 · Reliquias de piedra",
        enunciado: [
          "La tabla <code>reliquias</code> tiene: id, nombre, material, sector, antiguedad.",
          "Muestra el <b>nombre</b> y el <b>sector</b> de las reliquias cuyo <b>material</b> es <code>'piedra'</code>.",
        ],
        plantilla: "-- Escribe tu consulta\nSELECT * FROM reliquias;\n",
        preludio: tablasCaral,
        pistas: ["SELECT nombre, sector FROM reliquias", "Agrega: WHERE material = 'piedra';"],
        comprobar: `
if "WHERE" not in _codigo.upper(): _falla("Filtra las filas con WHERE material = 'piedra'.")
elif not _igual("SELECT nombre, sector FROM reliquias WHERE material='piedra'"): _falla("El resultado debe tener solo las columnas nombre y sector de las 3 reliquias de piedra.")`,
        solucion: "SELECT nombre, sector\nFROM reliquias\nWHERE material = 'piedra';\n",
        exito: "¡Encontraste las 3 reliquias de piedra! Tu primera consulta SQL. 🗿",
      },
    },
    {
      tipo: "bug",
      codigo: "SELECT nombre FROM reliquias WHERE material = piedra;",
      opciones: [
        ["Faltan comillas: 'piedra'. Sin ellas SQL busca una columna llamada piedra", true, "¡Exacto! «no such column: piedra»."],
        ["Falta el asterisco", false, "Puedes elegir columnas específicas."],
        ["WHERE va antes de FROM", false, "El orden es SELECT, FROM, WHERE."],
      ],
    },
  ],
};

export const SQL_ORDEN: Leccion = {
  id: "Q2",
  modulo: "DQL Ordenar (ORDER BY, LIMIT)",
  titulo: "Las reliquias más antiguas",
  pasos: [
    { tipo: "voz", quien: "yaru", texto: "¡Mee! Los arqueólogos quieren ver primero las reliquias más antiguas." },
    {
      tipo: "elegir",
      quien: "yaru",
      texto: "¿Qué devuelve esta consulta?",
      codigo: "SELECT nombre FROM reliquias\nORDER BY antiguedad DESC\nLIMIT 1;",
      opciones: [
        ["La reliquia más antigua", true, "¡Sí! DESC ordena de mayor a menor y LIMIT 1 deja solo la primera."],
        ["La más reciente", false, "Eso sería ORDER BY antiguedad ASC (de menor a mayor)."],
        ["Todas las reliquias", false, "LIMIT 1 deja solo una fila."],
      ],
    },
    {
      tipo: "teoria",
      texto:
        "<code>ORDER BY columna</code> ordena: <code>ASC</code> de menor a mayor (por defecto) y <code>DESC</code> de mayor a menor. <code>LIMIT n</code> se queda con las primeras n filas. Orden de las partes: <code>SELECT → FROM → WHERE → ORDER BY → LIMIT</code>.",
    },
    {
      tipo: "taller",
      reto: {
        id: "Q2",
        lenguaje: "sql",
        titulo: "Consulta Q2 · Las 3 más antiguas",
        enunciado: ["Muestra <b>nombre</b> y <b>antiguedad</b> de las <b>3</b> reliquias más antiguas, de la más antigua a la menos antigua."],
        plantilla: "SELECT nombre, antiguedad\nFROM reliquias;\n",
        preludio: tablasCaral,
        pistas: ["ORDER BY antiguedad DESC", "LIMIT 3"],
        comprobar: `
if not _igual("SELECT nombre, antiguedad FROM reliquias ORDER BY antiguedad DESC LIMIT 3", orden=True): _falla("Deben salir 3 filas: Piedra del altar (4800), Huanca (4700) y Flauta de hueso (4500), en ese orden.")`,
        solucion: "SELECT nombre, antiguedad\nFROM reliquias\nORDER BY antiguedad DESC\nLIMIT 3;\n",
        exito: "¡Ranking de antigüedad listo! ORDER BY y LIMIT se usan en todas las apps. 🏛️",
      },
    },
    {
      tipo: "bug",
      codigo: "SELECT nombre FROM reliquias LIMIT 3 ORDER BY antiguedad;",
      opciones: [
        ["LIMIT va al final, después de ORDER BY", true, "¡Correcto! Primero se ordena, luego se recorta."],
        ["ORDER BY no existe", false, "Sí existe."],
        ["Falta WHERE", false, "WHERE es opcional."],
      ],
    },
  ],
};

export const SQL_GRUPOS: Leccion = {
  id: "Q3",
  modulo: "DQL Agrupar (GROUP BY)",
  titulo: "Las ofrendas de cada sector",
  pasos: [
    { tipo: "voz", quien: "yaru", texto: "¡Mee! En cada sector de Caral se dejaban ofrendas. ¿Qué sector recibió más? Hay que agruparlas." },
    {
      tipo: "elegir",
      quien: "yaru",
      texto: "¿Qué hace COUNT(*)?",
      codigo: "SELECT COUNT(*) FROM reliquias;",
      opciones: [
        ["Cuenta cuántas filas hay", true, "¡Sí! Aquí daría 7."],
        ["Suma todas las columnas", false, "Para sumar se usa SUM(columna)."],
        ["Muestra todas las filas", false, "Solo devuelve un número."],
      ],
    },
    {
      tipo: "teoria",
      texto:
        "Funciones de agregación: <code>COUNT</code> (cuántos), <code>SUM</code> (suma), <code>AVG</code> (promedio), <code>MIN</code> y <code>MAX</code>. <code>GROUP BY columna</code> calcula una por cada grupo. Para filtrar <b>grupos</b> se usa <code>HAVING</code>; <code>WHERE</code> filtra <b>filas</b> antes de agrupar.",
      codigo: "SELECT material, COUNT(*)\nFROM reliquias\nGROUP BY material;",
    },
    {
      tipo: "taller",
      reto: {
        id: "Q3",
        lenguaje: "sql",
        titulo: "Consulta Q3 · Sectores con más ofrendas",
        enunciado: [
          "La tabla <code>ofrendas</code> tiene: id, sector, tipo, cantidad.",
          "Muestra cada <b>sector</b> y la <b>suma de cantidad</b>, solo de los sectores cuya suma sea <b>mayor que 20</b>.",
        ],
        plantilla: "SELECT sector, SUM(cantidad)\nFROM ofrendas;\n",
        preludio: tablasCaral,
        pistas: ["GROUP BY sector", "HAVING SUM(cantidad) > 20"],
        comprobar: `
if "GROUP BY" not in _codigo.upper(): _falla("Agrupa por sector con GROUP BY sector.")
elif not _igual("SELECT sector, SUM(cantidad) FROM ofrendas GROUP BY sector HAVING SUM(cantidad) > 20"): _falla("Deben salir 2 sectores: Pirámide Mayor (27) y Residencial (25). Usa HAVING para filtrar los grupos.")`,
        solucion: "SELECT sector, SUM(cantidad)\nFROM ofrendas\nGROUP BY sector\nHAVING SUM(cantidad) > 20;\n",
        exito: "¡Análisis de datos real! GROUP BY y HAVING son la base de los reportes. 📊",
      },
    },
    {
      tipo: "bug",
      codigo: "SELECT sector, SUM(cantidad) FROM ofrendas\nWHERE SUM(cantidad) > 20\nGROUP BY sector;",
      opciones: [
        ["WHERE no puede usar SUM: para filtrar grupos se usa HAVING", true, "¡Exacto! WHERE filtra filas, HAVING filtra grupos."],
        ["Falta ORDER BY", false, "No es obligatorio."],
        ["SUM solo funciona con *", false, "SUM recibe una columna."],
      ],
    },
  ],
};

// =============================================================================
// ZONA 8 · CHAN CHAN (Yaru) — DDL y DML
// =============================================================================

export const SQL_CREATE: Leccion = {
  id: "D1",
  modulo: "DDL Crear tablas (CREATE)",
  titulo: "Los palacios de barro",
  pasos: [
    { tipo: "voz", quien: "yaru", texto: "¡Mee! Chan Chan, la gran ciudad de barro de los chimú. Para registrar sus palacios primero hay que CREAR la tabla." },
    {
      tipo: "teoria",
      texto:
        "<b>DDL</b> define la <b>estructura</b>. <code>CREATE TABLE</code> crea una tabla con sus columnas y <b>tipos</b>: <code>INTEGER</code> (enteros), <code>TEXT</code> (textos), <code>REAL</code> (decimales). <code>PRIMARY KEY</code> identifica cada fila de forma única y <code>NOT NULL</code> obliga a llenar el dato.",
      codigo: "CREATE TABLE murales (\n  id INTEGER PRIMARY KEY,\n  nombre TEXT NOT NULL\n);",
    },
    {
      tipo: "elegir",
      quien: "yaru",
      texto: "¿Qué tipo usarías para el área en metros cuadrados (sin decimales)?",
      opciones: [
        ["INTEGER", true, "¡Sí! Un número entero."],
        ["TEXT", false, "Con texto no podrías sumar ni comparar áreas."],
        ["PRIMARY KEY", false, "Eso no es un tipo: marca la columna que identifica cada fila."],
      ],
    },
    {
      tipo: "taller",
      reto: {
        id: "D1",
        lenguaje: "sql",
        titulo: "DDL D1 · Crear la tabla palacios",
        enunciado: [
          "Crea la tabla <code>palacios</code> con 3 columnas:",
          "<code>id</code> INTEGER PRIMARY KEY, <code>nombre</code> TEXT NOT NULL y <code>area</code> INTEGER.",
        ],
        plantilla: "CREATE TABLE palacios (\n  \n);\n",
        pistas: ["id INTEGER PRIMARY KEY,", "nombre TEXT NOT NULL,", "area INTEGER"],
        comprobar: `
if not _existe("palacios"): _falla("No existe la tabla palacios.")
elif _columnas("palacios") != ["id", "nombre", "area"]: _falla(f"Las columnas son {_columnas('palacios')}; deben ser id, nombre y area, en ese orden.")
else:
    _info = {c[1]: c for c in _db.execute("PRAGMA table_info(palacios)").fetchall()}
    if _info["id"][5] != 1: _falla("id debe ser PRIMARY KEY.")
    elif _info["nombre"][3] != 1: _falla("nombre debe ser NOT NULL.")`,
        solucion: "CREATE TABLE palacios (\n  id INTEGER PRIMARY KEY,\n  nombre TEXT NOT NULL,\n  area INTEGER\n);\n",
        exito: "¡Tabla creada! Acabas de diseñar la estructura de una base de datos. 🏗️",
      },
    },
    {
      tipo: "bug",
      codigo: "CREATE TABLE palacios (\n  id INTEGER PRIMARY KEY\n  nombre TEXT\n);",
      opciones: [
        ["Falta la coma entre las columnas", true, "¡Correcto! Cada columna se separa con una coma."],
        ["TEXT no es un tipo", false, "TEXT sí es un tipo."],
        ["Falta NOT NULL", false, "NOT NULL es opcional."],
      ],
    },
  ],
};

export const SQL_ALTER: Leccion = {
  id: "D2",
  modulo: "DDL Modificar (ALTER, DROP, TRUNCATE)",
  titulo: "Reorganizar el archivo chimú",
  pasos: [
    { tipo: "voz", quien: "yaru", texto: "¡Mee! El archivo de Chan Chan necesita cambios: una columna nueva, una tabla que sobra y otra que hay que vaciar." },
    {
      tipo: "elegir",
      quien: "yaru",
      texto: "Quieres VACIAR una tabla pero conservarla para seguir usándola. ¿Qué usas?",
      opciones: [
        ["TRUNCATE TABLE escombros;", true, "¡Sí! Borra todas las filas y deja la tabla."],
        ["DROP TABLE escombros;", false, "DROP elimina la tabla completa, estructura incluida."],
        ["ALTER TABLE escombros;", false, "ALTER cambia la estructura, no los datos."],
      ],
    },
    {
      tipo: "teoria",
      texto:
        "<code>ALTER TABLE t ADD COLUMN c TIPO</code> agrega una columna. <code>DROP TABLE t</code> <b>elimina</b> la tabla entera. <code>TRUNCATE TABLE t</code> la <b>vacía</b> pero la conserva. (SQLite, el motor del juego, no trae TRUNCATE: el juego lo traduce a <code>DELETE FROM t</code>, que hace lo mismo.)",
    },
    {
      tipo: "taller",
      reto: {
        id: "D2",
        lenguaje: "sql",
        titulo: "DDL D2 · Tres cambios",
        enunciado: [
          "1. Agrega la columna <code>color TEXT</code> a la tabla <code>adobes</code>.",
          "2. Elimina la tabla <code>temporal</code>.",
          "3. Vacía la tabla <code>escombros</code> (sin eliminarla).",
        ],
        plantilla: "-- 1.\n\n-- 2.\n\n-- 3.\n",
        preludio: `_db.executescript("""
CREATE TABLE adobes (id INTEGER PRIMARY KEY, tamano TEXT);
INSERT INTO adobes VALUES (1, 'grande'), (2, 'mediano');
CREATE TABLE temporal (x INTEGER);
CREATE TABLE escombros (id INTEGER PRIMARY KEY, zona TEXT);
INSERT INTO escombros VALUES (1, 'norte'), (2, 'sur'), (3, 'este');
""")`,
        pistas: ["ALTER TABLE adobes ADD COLUMN color TEXT;", "DROP TABLE temporal;", "TRUNCATE TABLE escombros;"],
        comprobar: `
if "color" not in _columnas("adobes"): _falla("Falta agregar la columna color a adobes (ALTER TABLE ... ADD COLUMN).")
elif _existe("temporal"): _falla("La tabla temporal todavía existe: elimínala con DROP TABLE.")
elif not _existe("escombros"): _falla("¡Eliminaste escombros! Debías VACIARLA, no borrarla.")
elif _cuenta("escombros") != 0: _falla("La tabla escombros todavía tiene filas: vacíala con TRUNCATE TABLE.")`,
        solucion: "-- 1.\nALTER TABLE adobes ADD COLUMN color TEXT;\n-- 2.\nDROP TABLE temporal;\n-- 3.\nTRUNCATE TABLE escombros;\n",
        exito: "¡Archivo reorganizado! Ya dominas las 4 órdenes de DDL. 🧱",
      },
    },
    {
      tipo: "bug",
      texto: "Alguien quería vaciar la tabla, pero ahora ninguna consulta funciona. ¿Qué pasó?",
      codigo: "DROP TABLE murales;\nSELECT * FROM murales;",
      opciones: [
        ["DROP eliminó la tabla entera: debía usar TRUNCATE o DELETE", true, "¡Exacto! «no such table: murales»."],
        ["SELECT * está mal escrito", false, "SELECT está bien."],
        ["Faltó un WHERE en DROP", false, "DROP no usa WHERE."],
      ],
    },
  ],
};

const tablaPalacios = `_db.executescript("""
CREATE TABLE palacios (id INTEGER PRIMARY KEY, nombre TEXT NOT NULL, area INTEGER);
""")`;

export const SQL_INSERT: Leccion = {
  id: "M1",
  modulo: "DML Insertar (INSERT)",
  titulo: "Registrar los palacios",
  pasos: [
    { tipo: "voz", quien: "yaru", texto: "¡Mee! La tabla palacios está vacía. Ahora sí, a guardar datos." },
    {
      tipo: "teoria",
      texto:
        "<b>DML</b> cambia los <b>datos</b>. <code>INSERT INTO tabla (columnas) VALUES (valores);</code> agrega filas. Puedes agregar varias separando con comas: <code>VALUES (...), (...);</code>",
      codigo: "INSERT INTO palacios (nombre, area)\nVALUES ('Tschudi', 1000);",
    },
    {
      tipo: "taller",
      reto: {
        id: "M1",
        lenguaje: "sql",
        titulo: "DML M1 · Dos palacios",
        enunciado: [
          "Inserta en <code>palacios</code> dos filas:",
          "<code>'Tschudi'</code> con área <code>1000</code> y <code>'Rivero'</code> con área <code>800</code>.",
          "No escribas el id: se llena solo.",
        ],
        plantilla: "INSERT INTO palacios (nombre, area)\nVALUES ;\n",
        preludio: tablaPalacios,
        pistas: ["VALUES ('Tschudi', 1000), ('Rivero', 800);"],
        comprobar: `
_filas = sorted(_db.execute("SELECT nombre, area FROM palacios").fetchall())
if _filas != [("Rivero", 800), ("Tschudi", 1000)]: _falla(f"La tabla tiene {_filas}; debe tener Tschudi (1000) y Rivero (800).")`,
        solucion: "INSERT INTO palacios (nombre, area)\nVALUES ('Tschudi', 1000), ('Rivero', 800);\n",
        exito: "¡Datos guardados! Así guarda cada app lo que escribes. 📝",
      },
    },
  ],
};

export const SQL_UPDATE: Leccion = {
  id: "M2",
  modulo: "DML Cambiar y borrar (UPDATE, DELETE)",
  titulo: "Restaurar los murales",
  pasos: [
    { tipo: "voz", quien: "yaru", texto: "¡Mee! Los restauradores terminaron un mural y otros se perdieron. Hay que actualizar el registro." },
    {
      tipo: "elegir",
      quien: "yaru",
      texto: "¿Qué pasa con este UPDATE?",
      codigo: "UPDATE murales SET estado = 'restaurado';",
      opciones: [
        ["Cambia TODOS los murales, porque no tiene WHERE", true, "¡Cuidado! Sin WHERE afecta a todas las filas."],
        ["No cambia nada", false, "Cambia todas las filas."],
        ["Da error", false, "Es válido, pero peligroso."],
      ],
    },
    {
      tipo: "teoria",
      texto:
        "<code>UPDATE tabla SET columna = valor WHERE condición;</code> cambia datos. <code>DELETE FROM tabla WHERE condición;</code> borra filas. <b>Regla de oro:</b> escribe siempre el <code>WHERE</code>; sin él, cambias o borras todo.",
    },
    {
      tipo: "taller",
      reto: {
        id: "M2",
        lenguaje: "sql",
        titulo: "DML M2 · Actualizar el registro",
        enunciado: [
          "Cambia a <code>'restaurado'</code> el estado del mural <code>'Peces'</code>.",
          "Borra los murales cuyo estado sea <code>'destruido'</code>.",
        ],
        plantilla: "UPDATE murales\n\n;\nDELETE FROM murales\n\n;\n",
        preludio: `_db.executescript("""
CREATE TABLE murales (id INTEGER PRIMARY KEY, nombre TEXT, estado TEXT);
INSERT INTO murales VALUES (1, 'Peces', 'dañado'), (2, 'Aves', 'dañado'), (3, 'Olas', 'destruido'), (4, 'Redes', 'destruido'), (5, 'Luna', 'bueno');
""")`,
        pistas: ["UPDATE murales SET estado = 'restaurado' WHERE nombre = 'Peces';", "DELETE FROM murales WHERE estado = 'destruido';"],
        comprobar: `
_f = dict(_db.execute("SELECT nombre, estado FROM murales").fetchall())
if _f.get("Peces") != "restaurado": _falla("El mural Peces debe quedar 'restaurado'.")
elif _f.get("Aves") != "dañado" or _f.get("Luna") != "bueno": _falla("¡Cambiaste otros murales! Usa WHERE nombre = 'Peces'.")
elif "Olas" in _f or "Redes" in _f: _falla("Faltan borrar los murales destruidos.")
elif len(_f) != 3: _falla("Solo debías borrar los 2 murales destruidos.")`,
        solucion: "UPDATE murales\nSET estado = 'restaurado'\nWHERE nombre = 'Peces';\nDELETE FROM murales\nWHERE estado = 'destruido';\n",
        exito: "¡Registro al día! Con WHERE cambiaste solo lo que querías. 🎨",
      },
    },
    {
      tipo: "bug",
      codigo: "DELETE FROM murales;",
      opciones: [
        ["Sin WHERE borra TODOS los murales", true, "¡Exacto! Es uno de los errores más temidos en el trabajo real."],
        ["DELETE no existe", false, "Sí existe."],
        ["Falta el asterisco: DELETE * FROM", false, "DELETE no lleva asterisco."],
      ],
    },
  ],
};

// =============================================================================
// ZONA 9 · GRAN FERIA ANDINA (Killa) — JOIN, TCL, DCL
// =============================================================================

const tablasFeria = `_db.executescript("""
CREATE TABLE comerciantes (id INTEGER PRIMARY KEY, nombre TEXT, pueblo TEXT);
INSERT INTO comerciantes VALUES (1, 'Rosa', 'Huancayo'), (2, 'Julián', 'Puno'), (3, 'Elena', 'El Carmen');
CREATE TABLE productos (id INTEGER PRIMARY KEY, nombre TEXT, precio INTEGER,
  comerciante_id INTEGER REFERENCES comerciantes(id));
INSERT INTO productos VALUES (1, 'Papa nativa', 3, 1), (2, 'Chuño', 5, 2), (3, 'Cajón', 120, 3),
  (4, 'Quinua', 8, 2), (5, 'Mate burilado', 40, 1);
""")`;

export const SQL_JOIN: Leccion = {
  id: "Q4",
  modulo: "DQL Unir tablas (JOIN)",
  titulo: "¿Quién vende qué?",
  pasos: [
    { tipo: "voz", quien: "killa", texto: "La gran feria reúne comerciantes de todo el Perú. Los productos y los comerciantes están en tablas distintas: ¡hay que unirlas!" },
    {
      tipo: "teoria",
      texto:
        "La <b>clave primaria</b> (PRIMARY KEY) identifica cada fila. Una <b>clave foránea</b> guarda el id de otra tabla: <code>productos.comerciante_id</code> apunta a <code>comerciantes.id</code>. <code>JOIN ... ON</code> une las filas que coinciden. <code>LEFT JOIN</code> conserva también las que no tienen pareja.",
      codigo: "SELECT p.nombre, c.nombre\nFROM productos p\nJOIN comerciantes c ON p.comerciante_id = c.id;",
    },
    {
      tipo: "elegir",
      quien: "killa",
      texto: "En productos, ¿qué es comerciante_id?",
      opciones: [
        ["Una clave foránea: el id del comerciante que lo vende", true, "¡Sí! Conecta las dos tablas."],
        ["La clave primaria del producto", false, "La clave primaria del producto es id."],
        ["El precio en otra moneda", false, "Es la conexión con la tabla comerciantes."],
      ],
    },
    {
      tipo: "taller",
      reto: {
        id: "Q4",
        lenguaje: "sql",
        titulo: "Consulta Q4 · Productos de Rosa",
        enunciado: [
          "Une <code>productos</code> con <code>comerciantes</code>.",
          "Muestra el <b>nombre del producto</b> y el <b>precio</b> de todo lo que vende <code>'Rosa'</code>.",
        ],
        plantilla: "SELECT p.nombre, p.precio\nFROM productos p\n",
        preludio: tablasFeria,
        pistas: ["JOIN comerciantes c ON p.comerciante_id = c.id", "WHERE c.nombre = 'Rosa';"],
        comprobar: `
if "JOIN" not in _codigo.upper(): _falla("Une las tablas con JOIN ... ON.")
elif not _igual("SELECT p.nombre, p.precio FROM productos p JOIN comerciantes c ON p.comerciante_id = c.id WHERE c.nombre = 'Rosa'"): _falla("Deben salir 2 productos: Papa nativa (3) y Mate burilado (40).")`,
        solucion: "SELECT p.nombre, p.precio\nFROM productos p\nJOIN comerciantes c ON p.comerciante_id = c.id\nWHERE c.nombre = 'Rosa';\n",
        exito: "¡Tablas unidas! JOIN es la herramienta más poderosa de SQL. 🤝",
      },
    },
  ],
};

export const SQL_TCL: Leccion = {
  id: "T1",
  modulo: "TCL Transacciones",
  titulo: "El trueque justo",
  pasos: [
    { tipo: "voz", quien: "killa", texto: "En la feria aún se hace trueque. Si Rosa entrega papas, Julián debe recibirlas: ¡no puede quedar a medias!" },
    {
      tipo: "teoria",
      texto:
        "Una <b>transacción</b> agrupa varios cambios: o se hacen <b>todos</b> o <b>ninguno</b>. <code>BEGIN</code> la inicia, <code>COMMIT</code> la confirma y <code>ROLLBACK</code> la deshace. <code>SAVEPOINT</code> marca un punto intermedio al que puedes volver con <code>ROLLBACK TO</code>.",
      codigo: "BEGIN;\nUPDATE cuentas SET papas = papas - 10 WHERE nombre = 'Rosa';\nUPDATE cuentas SET papas = papas + 10 WHERE nombre = 'Julián';\nCOMMIT;",
    },
    {
      tipo: "elegir",
      quien: "killa",
      texto: "A mitad del trueque se cae la conexión. ¿Qué haces para no perder papas?",
      opciones: [
        ["ROLLBACK: deshacer todo lo de la transacción", true, "¡Así es! Nadie pierde nada."],
        ["COMMIT: guardar lo que se alcanzó a hacer", false, "Rosa perdería papas sin que Julián las reciba."],
        ["DROP TABLE cuentas", false, "¡Eso borraría todo!"],
      ],
    },
    {
      tipo: "taller",
      reto: {
        id: "T1",
        lenguaje: "sql",
        titulo: "TCL T1 · Trueque seguro",
        enunciado: [
          "Dentro de una transacción (<code>BEGIN</code> … <code>COMMIT</code>):",
          "Rosa entrega <b>10 papas</b> y Julián las recibe.",
          "Julián entrega <b>4 chuños</b> y Rosa los recibe.",
        ],
        plantilla: "BEGIN;\n\nCOMMIT;\n",
        preludio: `_db.executescript("""
CREATE TABLE cuentas (nombre TEXT PRIMARY KEY, papas INTEGER, chunos INTEGER);
INSERT INTO cuentas VALUES ('Rosa', 30, 0), ('Julián', 0, 12);
""")`,
        pistas: ["UPDATE cuentas SET papas = papas - 10 WHERE nombre = 'Rosa';", "Haz 4 UPDATE en total (dos por persona)."],
        comprobar: `
_c = {n: (p, ch) for n, p, ch in _db.execute("SELECT * FROM cuentas").fetchall()}
if "BEGIN" not in _mensajes or "COMMIT" not in _mensajes: _falla("Usa BEGIN al inicio y COMMIT al final.")
elif _c["Rosa"] != (20, 4) or _c["Julián"] != (10, 8): _falla(f"Quedó Rosa = {_c['Rosa']} y Julián = {_c['Julián']} (papas, chuños). Deberían ser (20, 4) y (10, 8).")`,
        solucion:
          "BEGIN;\nUPDATE cuentas SET papas = papas - 10 WHERE nombre = 'Rosa';\nUPDATE cuentas SET papas = papas + 10 WHERE nombre = 'Julián';\nUPDATE cuentas SET chunos = chunos - 4 WHERE nombre = 'Julián';\nUPDATE cuentas SET chunos = chunos + 4 WHERE nombre = 'Rosa';\nCOMMIT;\n",
        exito: "¡Trueque justo y seguro! Así funcionan los bancos y las apps de pago. 🥔",
      },
    },
    {
      tipo: "bug",
      texto: "¿Cuántas papas tiene Rosa al final?",
      codigo: "-- Rosa empieza con 30\nBEGIN;\nUPDATE cuentas SET papas = 0 WHERE nombre = 'Rosa';\nROLLBACK;",
      opciones: [
        ["30: ROLLBACK deshizo el cambio", true, "¡Correcto! Es como si nada hubiera pasado."],
        ["0", false, "El cambio no se confirmó: ROLLBACK lo deshizo."],
        ["Error", false, "Es una transacción válida."],
      ],
    },
  ],
};

export const SQL_DCL: Leccion = {
  id: "C1",
  modulo: "DCL Permisos",
  titulo: "Los guardianes del archivo",
  pasos: [
    { tipo: "voz", quien: "killa", texto: "No todos pueden cambiar los precios de la feria. Los permisos deciden quién puede leer y quién puede escribir." },
    {
      tipo: "teoria",
      texto:
        "<b>DCL</b> controla el acceso. <code>GRANT permiso ON tabla TO usuario;</code> da un permiso y <code>REVOKE permiso ON tabla FROM usuario;</code> lo quita. Permisos comunes: <code>SELECT, INSERT, UPDATE, DELETE</code>. (MySQL y PostgreSQL tienen usuarios; SQLite no, así que el juego los <b>simula</b>.)",
      codigo: "GRANT SELECT ON productos TO visitante;\nREVOKE DELETE ON productos FROM aprendiz;",
    },
    {
      tipo: "elegir",
      quien: "killa",
      texto: "Un visitante solo debe poder MIRAR los productos. ¿Qué permiso le das?",
      opciones: [
        ["SELECT", true, "¡Sí! Solo lectura."],
        ["DELETE", false, "¡Podría borrar productos!"],
        ["UPDATE", false, "Podría cambiar los precios."],
      ],
    },
    {
      tipo: "taller",
      reto: {
        id: "C1",
        lenguaje: "sql",
        titulo: "DCL C1 · Permisos de la feria",
        enunciado: [
          "Da permiso de <code>SELECT</code> sobre <code>productos</code> al usuario <code>visitante</code>.",
          "Quita el permiso de <code>INSERT</code> sobre <code>productos</code> al usuario <code>aprendiz</code>.",
        ],
        plantilla: "-- GRANT ...\n\n-- REVOKE ...\n",
        preludio: tablasFeria + `\n_permisos[("aprendiz", "productos")] = {"SELECT", "INSERT"}`,
        pistas: ["GRANT SELECT ON productos TO visitante;", "REVOKE INSERT ON productos FROM aprendiz;"],
        comprobar: `
if _permisos.get(("visitante", "productos")) != {"SELECT"}: _falla("visitante debe tener solo SELECT sobre productos.")
elif _permisos.get(("aprendiz", "productos")) != {"SELECT"}: _falla("A aprendiz hay que quitarle INSERT (y dejarle SELECT).")`,
        solucion: "GRANT SELECT ON productos TO visitante;\nREVOKE INSERT ON productos FROM aprendiz;\n",
        exito: "¡Feria protegida! Los permisos son clave en la seguridad de los sistemas. 🔐",
      },
    },
  ],
};

// =============================================================================
// ZONA 10 · MACHU PICCHU (Amaru y Killa) — Python + SQL
// =============================================================================

export const PY_SQLITE: Leccion = {
  id: "PS1",
  modulo: "Python + SQL (sqlite3)",
  titulo: "El registro de los caminos",
  pasos: [
    { tipo: "voz", quien: "amaru", texto: "Llegamos a Machu Picchu. Aquí se unen las dos runas: Python y SQL. Python puede hablar con la base de datos." },
    {
      tipo: "teoria",
      texto:
        "El módulo <code>sqlite3</code> conecta Python con una base de datos: <code>con = sqlite3.connect(...)</code>, <code>con.execute(sql)</code> y <code>.fetchall()</code> para leer. Los valores se pasan con <code>?</code>: <code>con.execute(\"... WHERE altura &gt; ?\", (2500,))</code>. <b>Nunca</b> metas datos con f-strings dentro del SQL: abre la puerta a ataques (inyección SQL).",
    },
    {
      tipo: "taller",
      reto: {
        id: "PS1",
        titulo: "Runa PS1 · Lugares altos",
        enunciado: [
          "Crea la tabla <code>lugares (nombre TEXT, altura INTEGER)</code> e inserta <code>datos</code> con <code>executemany</code>.",
          "En <b>altos</b> guarda, con <code>fetchall()</code>, los nombres de los lugares con altura <b>mayor que 2500</b>, usando <code>?</code>.",
        ],
        plantilla:
          'import sqlite3\n\ncon = sqlite3.connect(":memory:")\ncon.execute("CREATE TABLE lugares (nombre TEXT, altura INTEGER)")\ndatos = [("Machu Picchu", 2430), ("Cusco", 3399), ("Huayna Picchu", 2720), ("Aguas Calientes", 2040)]\n\naltos = \nprint(altos)\n',
        pistas: ['con.executemany("INSERT INTO lugares VALUES (?, ?)", datos)', 'altos = con.execute("SELECT nombre FROM lugares WHERE altura > ?", (2500,)).fetchall()'],
        comprobar: `
if sorted(altos) != [("Cusco",), ("Huayna Picchu",)]: _falla(f"altos es {altos}; deberían ser Cusco y Huayna Picchu.")
elif "?" not in _codigo.split("executemany")[-1]: _falla("Pasa el 2500 con ? en la consulta, no escrito dentro del texto.")`,
        solucion:
          'import sqlite3\n\ncon = sqlite3.connect(":memory:")\ncon.execute("CREATE TABLE lugares (nombre TEXT, altura INTEGER)")\ndatos = [("Machu Picchu", 2430), ("Cusco", 3399), ("Huayna Picchu", 2720), ("Aguas Calientes", 2040)]\ncon.executemany("INSERT INTO lugares VALUES (?, ?)", datos)\naltos = con.execute("SELECT nombre FROM lugares WHERE altura > ?", (2500,)).fetchall()\nprint(altos)\n',
        exito: "¡Python y SQL trabajando juntos! Así funcionan casi todas las apps. 🏔️",
      },
    },
    {
      tipo: "bug",
      texto: "Esta runa funciona, pero es peligrosa. ¿Por qué?",
      codigo: 'nombre = input("Nombre: ")\ncon.execute(f"SELECT * FROM usuarios WHERE nombre = \'{nombre}\'")',
      opciones: [
        ["Mete el dato del usuario en el SQL: permite inyección SQL. Usa ?", true, "¡Exacto! Siempre parámetros con ?."],
        ["input no se puede usar con SQL", false, "Sí se puede, pero con parámetros ?."],
        ["Falta fetchall()", false, "Ese no es el peligro."],
      ],
    },
  ],
};

export const PY_SQLALCHEMY: Leccion = {
  id: "PS2",
  modulo: "Python + SQL (SQLAlchemy)",
  titulo: "El quipu de objetos",
  pasos: [
    { tipo: "voz", quien: "killa", texto: "SQLAlchemy es la librería que usan los equipos profesionales: convierte tablas en clases de Python. ¡Tus clases y tu SQL en una sola runa!" },
    {
      tipo: "teoria",
      texto:
        "Un <b>ORM</b> conecta clases con tablas. En SQLAlchemy: <code>create_engine</code> abre la base de datos, una clase que hereda de <code>Base</code> define la tabla, <code>Session</code> guarda (<code>add</code>, <code>commit</code>) y <code>select</code> consulta. La primera vez descarga la librería: puede tardar unos segundos.",
      codigo: "class Llama(Base):\n    __tablename__ = \"llamas\"\n    id: Mapped[int] = mapped_column(primary_key=True)\n    nombre: Mapped[str]",
    },
    {
      tipo: "taller",
      reto: {
        id: "PS2",
        titulo: "Runa PS2 · Las llamas de Machu Picchu",
        enunciado: [
          "Completa la clase <code>Llama</code> con la columna <code>edad: Mapped[int]</code>.",
          "Guarda las tres llamas con <code>sesion.add_all(...)</code> y <code>sesion.commit()</code>.",
          "En <b>jovenes</b> guarda los nombres de las llamas con edad <b>menor que 5</b>.",
        ],
        plantilla:
          'from sqlalchemy import create_engine, select\nfrom sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, Session\n\nclass Base(DeclarativeBase):\n    pass\n\nclass Llama(Base):\n    __tablename__ = "llamas"\n    id: Mapped[int] = mapped_column(primary_key=True)\n    nombre: Mapped[str]\n    # agrega la columna edad\n\nmotor = create_engine("sqlite://")\nBase.metadata.create_all(motor)\n\nwith Session(motor) as sesion:\n    llamas = [Llama(nombre="Yaru", edad=3), Llama(nombre="Wari", edad=7), Llama(nombre="Inti", edad=2)]\n    # guarda las llamas\n\n    consulta = select(Llama.nombre).where(Llama.edad < 5)\n    jovenes = sesion.scalars(consulta).all()\n\nprint(jovenes)\n',
        pistas: ["edad: Mapped[int]", "sesion.add_all(llamas)\n    sesion.commit()"],
        comprobar: `
if sorted(jovenes) != ["Inti", "Yaru"]: _falla(f"jovenes es {jovenes}; deberían ser Yaru e Inti (menores de 5).")`,
        solucion:
          'from sqlalchemy import create_engine, select\nfrom sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, Session\n\nclass Base(DeclarativeBase):\n    pass\n\nclass Llama(Base):\n    __tablename__ = "llamas"\n    id: Mapped[int] = mapped_column(primary_key=True)\n    nombre: Mapped[str]\n    edad: Mapped[int]\n\nmotor = create_engine("sqlite://")\nBase.metadata.create_all(motor)\n\nwith Session(motor) as sesion:\n    llamas = [Llama(nombre="Yaru", edad=3), Llama(nombre="Wari", edad=7), Llama(nombre="Inti", edad=2)]\n    sesion.add_all(llamas)\n    sesion.commit()\n\n    consulta = select(Llama.nombre).where(Llama.edad < 5)\n    jovenes = sesion.scalars(consulta).all()\n\nprint(jovenes)\n',
        exito: "¡Usaste un ORM profesional! Clases de Python que viven en una base de datos. 🦙",
      },
    },
  ],
};

export const PROYECTO_FINAL: Leccion = {
  id: "PF",
  modulo: "🏆 Proyecto final",
  titulo: "La leyenda de Chaski Runes",
  pasos: [
    { tipo: "voz", quien: "amaru", texto: "Última prueba, Chaski: el registro del Qhapaq Ñan. Un sistema completo con clases, base de datos, funciones y manejo de errores." },
    {
      tipo: "teoria",
      texto:
        "Un sistema real separa responsabilidades: una <b>clase</b> (<code>Registro</code>) maneja la base de datos; cada <b>método</b> hace una sola cosa; los errores se <b>validan</b> con <code>raise</code> antes de tocar los datos.",
    },
    {
      tipo: "taller",
      reto: {
        id: "PF",
        titulo: "🏆 Proyecto final · El registro del Qhapaq Ñan",
        enunciado: [
          "<code>agregar(nombre, km)</code>: si <code>km &lt;= 0</code>, lanza <code>ValueError</code>; si no, inserta el tramo con <code>?</code>.",
          "<code>total()</code>: devuelve la suma de km con <code>SELECT SUM(km)</code> (0 si no hay tramos).",
          "<code>mas_largo()</code>: devuelve el nombre del tramo con más km (<code>ORDER BY km DESC LIMIT 1</code>).",
        ],
        plantilla:
          'import sqlite3\n\nclass Registro:\n    def __init__(self):\n        self.con = sqlite3.connect(":memory:")\n        self.con.execute("CREATE TABLE tramos (nombre TEXT, km INTEGER)")\n\n    def agregar(self, nombre, km):\n        pass\n\n    def total(self):\n        pass\n\n    def mas_largo(self):\n        pass\n\nr = Registro()\nr.agregar("Cusco - Machu Picchu", 75)\nr.agregar("Cusco - Puno", 390)\nprint(r.total(), r.mas_largo())\n',
        pistas: [
          'if km <= 0:\n            raise ValueError("km debe ser positivo")\n        self.con.execute("INSERT INTO tramos VALUES (?, ?)", (nombre, km))',
          'suma = self.con.execute("SELECT SUM(km) FROM tramos").fetchone()[0]\n        return suma or 0',
          'return self.con.execute("SELECT nombre FROM tramos ORDER BY km DESC LIMIT 1").fetchone()[0]',
        ],
        comprobar: `
try:
    _r = Registro()
    _vacio = _r.total()
    _r.agregar("A", 75)
    _r.agregar("B", 390)
    _r.agregar("C", 120)
    _datos = (_vacio, _r.total(), _r.mas_largo())
    _lanzo = False
    try:
        _r.agregar("Malo", -5)
    except ValueError:
        _lanzo = True
    _final = _r.total()
except Exception as _e:
    _falla(f"Tu sistema falló: {type(_e).__name__}: {_e}")
else:
    if _datos[0] != 0: _falla(f"Sin tramos, total() debe devolver 0 (devolvió {_datos[0]}).")
    elif _datos[1] != 585: _falla(f"total() devolvió {_datos[1]}; con 75 + 390 + 120 debe ser 585.")
    elif _datos[2] != "B": _falla(f"mas_largo() devolvió {_datos[2]!r}; debería ser el tramo de 390 km.")
    elif not _lanzo or _final != 585: _falla("agregar con km negativo debe lanzar ValueError sin guardar nada.")`,
        solucion:
          'import sqlite3\n\nclass Registro:\n    def __init__(self):\n        self.con = sqlite3.connect(":memory:")\n        self.con.execute("CREATE TABLE tramos (nombre TEXT, km INTEGER)")\n\n    def agregar(self, nombre, km):\n        if km <= 0:\n            raise ValueError("km debe ser positivo")\n        self.con.execute("INSERT INTO tramos VALUES (?, ?)", (nombre, km))\n\n    def total(self):\n        suma = self.con.execute("SELECT SUM(km) FROM tramos").fetchone()[0]\n        return suma or 0\n\n    def mas_largo(self):\n        return self.con.execute("SELECT nombre FROM tramos ORDER BY km DESC LIMIT 1").fetchone()[0]\n\nr = Registro()\nr.agregar("Cusco - Machu Picchu", 75)\nr.agregar("Cusco - Puno", 390)\nprint(r.total(), r.mas_largo())\n',
        exito: "🏆 ¡LEYENDA COMPLETADA! Clases, SQL, funciones y errores en un sistema real. Eres un verdadero Chaski del código.",
      },
    },
  ],
};
