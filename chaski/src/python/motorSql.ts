// Motor SQL del juego: SQLite real (dentro de Python, en el dispositivo) con
// resultados en forma de tabla, TRUNCATE y permisos (GRANT/REVOKE) simulados,
// porque SQLite no los trae. Se antepone al código del jugador en modo SQL.

export const MOTOR_SQL = String.raw`
import sqlite3 as _sqlite3, re as _re
_db = _sqlite3.connect(":memory:", isolation_level=None)
_permisos = {}
_ultimo = []
_mensajes = []

def _tabla(cur):
    cols = [d[0] for d in cur.description]
    filas = [tuple(f) for f in cur.fetchall()]
    anchos = [max([len(str(c))] + [len(str(f[i])) for f in filas]) for i, c in enumerate(cols)]
    print(" | ".join(str(c).ljust(a) for c, a in zip(cols, anchos)))
    print("-+-".join("-" * a for a in anchos))
    for f in filas:
        print(" | ".join(str(v).ljust(a) for v, a in zip(f, anchos)))
    print(f"({len(filas)} fila{'s' if len(filas) != 1 else ''})")
    return filas

def _sentencias(texto):
    partes, actual = [], ""
    for linea in texto.splitlines():
        if linea.strip().startswith("--"):
            continue
        actual += linea + "\n"
        if _sqlite3.complete_statement(actual):
            partes.append(actual.strip())
            actual = ""
    if actual.strip():
        partes.append(actual.strip())
    return partes

def correr_sql(texto):
    global _ultimo
    if not texto.strip():
        raise SyntaxError("Tu consulta está vacía. Escribe una sentencia SQL.")
    for s in _sentencias(texto):
        limpia = s.strip().rstrip(";").strip()
        clave = limpia.split()[0].upper() if limpia else ""
        if clave in ("GRANT", "REVOKE"):
            m = _re.match(r"(GRANT|REVOKE)\s+([\w\s,]+?)\s+ON\s+(\w+)\s+(TO|FROM)\s+(\w+)$", limpia, _re.I)
            if not m:
                raise SyntaxError("Se escribe así: GRANT SELECT ON tabla TO usuario;  o  REVOKE SELECT ON tabla FROM usuario;")
            accion, privs, tabla, _, usuario = m.groups()
            privs = [p.strip().upper() for p in privs.split(",")]
            actual = _permisos.setdefault((usuario.lower(), tabla.lower()), set())
            if accion.upper() == "GRANT":
                actual.update(privs)
                print(f"✔ {usuario} ahora puede {', '.join(privs)} en {tabla}")
            else:
                actual.difference_update(privs)
                print(f"✔ {usuario} ya no puede {', '.join(privs)} en {tabla}")
            _mensajes.append(clave)
            continue
        m = _re.match(r"TRUNCATE\s+(TABLE\s+)?(\w+)$", limpia, _re.I)
        if m:
            cur = _db.execute(f"DELETE FROM {m.group(2)}")
            print(f"✔ Tabla {m.group(2)} vaciada ({cur.rowcount} filas borradas)")
            _mensajes.append("TRUNCATE")
            continue
        cur = _db.execute(limpia)
        _mensajes.append(clave)
        if cur.description:
            _ultimo = _tabla(cur)
        elif clave in ("INSERT", "UPDATE", "DELETE"):
            print(f"✔ {cur.rowcount} fila{'s' if cur.rowcount != 1 else ''} afectada{'s' if cur.rowcount != 1 else ''}")
        elif clave in ("CREATE", "ALTER", "DROP"):
            print("✔ Estructura actualizada")
        else:
            print(f"✔ {clave}")

def _falla(texto):
    print("§FALLA " + texto)

def _igual(consulta, orden=False):
    esperado = [tuple(f) for f in _db.execute(consulta).fetchall()]
    hecho = [tuple(f) for f in _ultimo]
    if not orden:
        esperado, hecho = sorted(esperado, key=repr), sorted(hecho, key=repr)
    return esperado == hecho

def _columnas(tabla):
    return [c[1] for c in _db.execute(f"PRAGMA table_info({tabla})").fetchall()]

def _existe(tabla):
    return _db.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=?", (tabla,)).fetchone()[0] == 1

def _cuenta(tabla):
    return _db.execute(f"SELECT COUNT(*) FROM {tabla}").fetchone()[0]
`;

/** Ayudas para comprobar retos de Python. */
export const AYUDAS_PY = String.raw`
def _falla(texto):
    print("§FALLA " + texto)
`;

/** input() simulado: el "guardián" escribe las respuestas por ti. */
export function entradas(valores: string[]): string {
  return `_entradas = iter(${JSON.stringify(valores)})
def input(mensaje=""):
    valor = next(_entradas, "")
    print(str(mensaje) + valor)
    return valor
`;
}
