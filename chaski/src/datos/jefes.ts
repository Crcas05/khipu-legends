// Jefes de cada zona: su escudo solo cae si respondes bien una runa de esa zona.
// Pregunta: [código ("" si no hay), pregunta, correcta, incorrectas, explicación]

export type PreguntaJefe = [string, string, string, string[], string];

export const JEFES: Record<string, { nombre: string; preguntas: PreguntaJefe[] }> = {
  titicaca: {
    nombre: "Ch'aqwa del Lago",
    preguntas: [
      ["print(23 // 5)", "¿Qué muestra?", "4", ["4.6", "3"], "// da la parte entera: 23 entre 5 es 4 y sobran 3."],
      ["print(23 % 5)", "¿Qué muestra?", "3", ["4", "0"], "% da el resto: 23 = 5 × 4 + 3."],
      ['print("killa"[0])', "¿Qué muestra?", "k", ["i", "killa"], "[0] es la primera letra."],
      ['x = 7\nif x > 5 and x < 10:\n    print("sí")\nelse:\n    print("no")', "¿Qué muestra?", "sí", ["no", "sí no"], "7 cumple las dos condiciones del and."],
      ['n = int("8") + 2\nprint(n)', "¿Qué muestra?", "10", ["82", "Error"], 'int("8") convierte el texto en el número 8.'],
      ['print(len("uros"))', "¿Qué muestra?", "4", ["3", "5"], "len cuenta las letras: u-r-o-s."],
    ],
  },
  ucayali: {
    nombre: "Bug de la Corriente",
    preguntas: [
      ["n = 0\nwhile n < 3:\n    n = n + 1\nprint(n)", "¿Qué muestra?", "3", ["2", "4"], "Se repite mientras n < 3: termina cuando n vale 3."],
      ["l = [4, 9, 2]\nprint(max(l) - min(l))", "¿Qué muestra?", "7", ["2", "5"], "max es 9 y min es 2: 9 - 2 = 7."],
      ['l = ["aguaje"]\nl.append("cocona")\nprint(len(l))', "¿Qué muestra?", "2", ["1", "3"], "append agregó un elemento: ahora hay 2."],
      ["t = 0\nfor x in [1, 2, 3]:\n    t = t + x\nprint(t)", "¿Qué muestra?", "6", ["3", "123"], "El acumulador suma 1 + 2 + 3."],
    ],
  },
  kuelap: {
    nombre: "Bug de las Nubes",
    preguntas: [
      ["def f(a, b=3):\n    return a * b\nprint(f(2))", "¿Qué muestra?", "6", ["5", "Error"], "b vale 3 por defecto: 2 × 3 = 6."],
      ['d = {"papa": 5}\nprint(d.get("oca", 0))', "¿Qué muestra?", "0", ["5", "Error"], "get devuelve 0 si la clave no existe."],
      ["print(len({1, 1, 2}))", "¿Qué muestra?", "2", ["3", "1"], "Un set elimina el 1 repetido."],
      ['print("a-b".replace("-", "+"))', "¿Qué muestra?", "a+b", ["a-b", "a+-b"], "replace cambia - por +."],
    ],
  },
  chavin: {
    nombre: "Bug de las Galerías",
    preguntas: [
      ["try:\n    x = 1 / 0\nexcept ZeroDivisionError:\n    x = -1\nprint(x)", "¿Qué muestra?", "-1", ["0", "Error"], "El error se atrapó y x tomó el plan B."],
      ["print([n for n in [1, 2, 3, 4] if n % 2 == 0])", "¿Qué muestra?", "[2, 4]", ["[1, 3]", "[1, 2, 3, 4]"], "La comprensión deja solo los pares."],
      ["class A:\n    def __init__(self):\n        self.v = 5\nprint(A().v)", "¿Qué muestra?", "5", ["A", "Error"], "__init__ guardó v = 5 en el objeto."],
      ["f = lambda x: x + 1\nprint(f(4))", "¿Qué muestra?", "5", ["4", "x + 1"], "La lambda devuelve x + 1."],
    ],
  },
  ayllu: {
    nombre: "Bug del Desorden",
    preguntas: [
      ["import math\nprint(math.floor(3.7))", "¿Qué muestra?", "3", ["4", "3.7"], "floor redondea hacia abajo."],
      ['assert 3 * 4 == 12\nprint("ok")', "¿Qué muestra?", "ok", ["AssertionError", "True"], "La prueba pasa en silencio y luego se imprime ok."],
      ["print(round(2.567, 1))", "¿Qué muestra?", "2.6", ["2.5", "3"], "round con 1 deja un decimal."],
      ['import json\nprint(json.loads("[1, 2]")[1])', "¿Qué muestra?", "2", ["1", "[1, 2]"], "json.loads convierte el texto en una lista; [1] es el segundo."],
    ],
  },
  caral: {
    nombre: "Bug del Archivo",
    preguntas: [
      ["SELECT COUNT(*) FROM reliquias;  -- tiene 7 filas", "¿Qué devuelve?", "7", ["1", "Todas las filas"], "COUNT(*) cuenta las filas."],
      ["SELECT nombre FROM t\nORDER BY edad DESC LIMIT 1;", "¿Qué devuelve?", "El de mayor edad", ["El de menor edad", "Todos"], "DESC ordena de mayor a menor y LIMIT 1 deja uno."],
      ["", "¿Qué filtra GRUPOS después de GROUP BY?", "HAVING", ["WHERE", "ORDER BY"], "WHERE filtra filas; HAVING filtra grupos."],
      ["WHERE material = 'piedra'", "¿Por qué piedra va entre comillas?", "Porque es un texto", ["Porque es una columna", "Es opcional"], "Sin comillas, SQL buscaría una columna llamada piedra."],
    ],
  },
  chanchan: {
    nombre: "Bug de Barro",
    preguntas: [
      ["", "¿Qué orden crea una tabla nueva?", "CREATE TABLE", ["INSERT INTO", "ALTER TABLE"], "CREATE TABLE define la estructura."],
      ["", "¿Cómo VACÍAS una tabla sin eliminarla?", "TRUNCATE TABLE", ["DROP TABLE", "ALTER TABLE"], "DROP la elimina entera; TRUNCATE solo la vacía."],
      ["UPDATE murales SET estado = 'ok';", "¿Qué pasa?", "Cambia todas las filas", ["Cambia una fila", "Da error"], "Sin WHERE afecta a todas las filas."],
      ["", "¿Cómo agregas una columna?", "ALTER TABLE ... ADD COLUMN", ["INSERT COLUMN", "CREATE COLUMN"], "ALTER cambia la estructura."],
    ],
  },
  feria: {
    nombre: "Bug del Mercado",
    preguntas: [
      ["", "¿Qué une filas de dos tablas?", "JOIN", ["UNION ALL", "GROUP BY"], "JOIN ... ON une filas relacionadas."],
      ["", "Algo falló a mitad del trueque. ¿Qué haces?", "ROLLBACK", ["COMMIT", "DROP"], "ROLLBACK deshace toda la transacción."],
      ["", "¿Qué orden DA un permiso?", "GRANT", ["REVOKE", "ALLOW"], "GRANT da y REVOKE quita."],
      ["", "¿Qué confirma una transacción?", "COMMIT", ["BEGIN", "SAVEPOINT"], "COMMIT guarda los cambios."],
    ],
  },
  machupicchu: {
    nombre: "Bug Ch'aqwa Original",
    preguntas: [
      ["", "En sqlite3, ¿cómo pasas datos de forma segura?", "Con ? (parámetros)", ["Con f-strings", "Con +"], "Los parámetros ? evitan la inyección SQL."],
      ['con.execute("SELECT 2 + 3").fetchone()[0]', "¿Qué devuelve?", "5", ["(5,)", '"2 + 3"'], "fetchone da la fila (5,) y [0] toma el 5."],
      ["", "En SQLAlchemy, ¿qué guarda los cambios?", "sesion.commit()", ["sesion.add()", "select()"], "add prepara; commit guarda."],
      ["", "¿Qué es un ORM?", "Une clases de Python con tablas", ["Un tipo de dato", "Un error de SQL"], "ORM: Object-Relational Mapping."],
    ],
  },
};
