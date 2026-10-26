// Tuki traduce los errores de Python a español simple.
// Cada error real tiene su "Bug" con nombre, para que equivocarse sea parte del juego.

import type { ErrorPython } from "./python";

export function traducirError(error: ErrorPython): { bug: string; texto: string } {
  const { tipo, mensaje, linea } = error;
  const enLinea = linea ? ` (línea ${linea})` : "";

  if (tipo === "Timeout") {
    return {
      bug: "LoopBug",
      texto: "¡Kraa! Tu código se quedó dando vueltas sin parar. Revisa si hay algo que se repite para siempre.",
    };
  }

  if (tipo === "SyntaxError") {
    if (/Maybe you meant '=='/i.test(mensaje)) {
      return {
        bug: "SyntaxBug",
        texto: `Para COMPARAR se usan dos signos: ==${enLinea}. Un solo = sirve para GUARDAR un valor.`,
      };
    }
    if (/expected ':'/i.test(mensaje)) {
      return { bug: "SyntaxBug", texto: `Falta el dos puntos (:) al final de la línea${enLinea}. Las líneas con if, for y def terminan en :` };
    }
    if (/expected an indented block/i.test(mensaje)) {
      return { bug: "IndentBug", texto: `La línea de adentro necesita 4 espacios de sangría${enLinea}.` };
    }
    if (/unterminated string/i.test(mensaje)) {
      return {
        bug: "SyntaxBug",
        texto: `¡Kraa! Tu cuerda tiene un solo nudo${enLinea}. El texto necesita comillas al inicio y al final.`,
      };
    }
    if (/was never closed/i.test(mensaje)) {
      return {
        bug: "SyntaxBug",
        texto: `Abriste un paréntesis y no lo cerraste${enLinea}. Cada ( necesita su ).`,
      };
    }
    if (/Missing parentheses in call to 'print'/i.test(mensaje)) {
      return {
        bug: "SyntaxBug",
        texto: `print necesita paréntesis${enLinea}. Se escribe así: print("texto").`,
      };
    }
    if (/unmatched '\)'/i.test(mensaje)) {
      return {
        bug: "SyntaxBug",
        texto: `Hay un ) de más${enLinea}. Cuenta cuántos abres y cuántos cierras.`,
      };
    }
    return {
      bug: "SyntaxBug",
      texto: `Algo está mal escrito${enLinea}. Revisa comillas, paréntesis y comas.`,
    };
  }

  if (tipo === "IndentationError") {
    if (/expected an indented block/i.test(mensaje)) {
      return { bug: "IndentBug", texto: `La línea de adentro (después de if, for o def) necesita 4 espacios al inicio${enLinea}.` };
    }
    return {
      bug: "IndentBug",
      texto: `Hay espacios de más al inicio${enLinea}. Solo las líneas que van DENTRO de un if, for o def llevan 4 espacios.`,
    };
  }

  if (tipo === "NameError") {
    const nombre = (mensaje.match(/name '([^']+)'/) || [])[1] || "";
    const sugerencia = (mensaje.match(/Did you mean: '([^']+)'/) || [])[1];
    if (nombre && nombre.toLowerCase() === "print") {
      return {
        bug: "NameBug",
        texto: `Para Python, ${nombre} y print son distintos${enLinea}. El idioma de las runas se escribe en minúsculas: print.`,
      };
    }
    if (sugerencia) {
      return {
        bug: "NameBug",
        texto: `Python no conoce «${nombre}»${enLinea}. ¿Quisiste decir ${sugerencia}?`,
      };
    }
    return {
      bug: "NameBug",
      texto: `Python cree que «${nombre}» es algo guardado${enLinea}. Si quieres decir un texto, ponlo entre comillas.`,
    };
  }

  // --- Errores de SQL (SQLite) ---
  if (tipo === "OperationalError" || tipo === "IntegrityError" || tipo === "ProgrammingError") {
    const columna = (mensaje.match(/no such column: ([\w.]+)/) || [])[1];
    if (columna) return { bug: "SqlBug", texto: `SQL no encuentra la columna «${columna}». Si es un texto, va entre comillas simples: '${columna}'. Si es una columna, revisa cómo se escribe.` };
    const tabla = (mensaje.match(/no such table: (\w+)/) || [])[1];
    if (tabla) return { bug: "SqlBug", texto: `La tabla «${tabla}» no existe. ¿Está bien escrita? ¿La borraste con DROP?` };
    const cerca = (mensaje.match(/near "([^"]*)"/) || [])[1];
    if (cerca !== undefined) return { bug: "SqlBug", texto: `Hay un error de escritura cerca de «${cerca}». Revisa comas, paréntesis, comillas y el orden SELECT → FROM → WHERE → GROUP BY → ORDER BY → LIMIT.` };
    if (/incomplete input/i.test(mensaje)) return { bug: "SqlBug", texto: "La sentencia quedó incompleta: ¿faltan los valores, un paréntesis o el punto y coma?" };
    if (/NOT NULL/i.test(mensaje)) return { bug: "SqlBug", texto: "Una columna NOT NULL quedó vacía: debes darle un valor." };
    if (/UNIQUE|PRIMARY KEY/i.test(mensaje)) return { bug: "SqlBug", texto: "Ese id ya existe: la clave primaria no se puede repetir." };
    if (/already exists/i.test(mensaje)) return { bug: "SqlBug", texto: "Esa tabla ya existe. Usa otro nombre o bórrala primero con DROP TABLE." };
    if (/duplicate column/i.test(mensaje)) return { bug: "SqlBug", texto: "Esa columna ya existe en la tabla." };
    return { bug: "SqlBug", texto: `SQL dice: ${mensaje}` };
  }
  if (tipo === "ModuleNotFoundError") {
    return { bug: "ImportBug", texto: `Ese módulo no existe${enLinea}. Revisa cómo se escribe (los módulos van en minúsculas).` };
  }
  if (tipo === "TypeError" && /can only concatenate str|unsupported operand type/i.test(mensaje)) {
    return { bug: "TypeBug", texto: `Estás mezclando texto con números${enLinea}. Convierte con int() o str(), o usa una f-string.` };
  }
  if (tipo === "TypeError" && /unexpected keyword argument|invalid keyword argument/i.test(mensaje)) {
    const p = (mensaje.match(/'(\w+)'/) || [])[1] ?? "";
    return { bug: "TypeBug", texto: `Le pasaste «${p}», pero esa función o clase no lo conoce${enLinea}. ¿Falta declararlo como parámetro o como columna?` };
  }
  if (tipo === "TypeError" && /missing \d+ required positional argument/i.test(mensaje)) {
    return { bug: "TypeBug", texto: `Faltan datos al llamar la función${enLinea}: ${mensaje}` };
  }
  if (tipo === "TypeError" && /takes \d+ positional argument/i.test(mensaje)) {
    return { bug: "TypeBug", texto: `Le diste más datos de los que recibe${enLinea}. Si es un método, ¿olvidaste self?` };
  }
  if (tipo === "IndexError") return { bug: "IndexBug", texto: `Pediste una posición que no existe${enLinea}. Recuerda: el primer elemento es [0] y el último es [len - 1].` };
  if (tipo === "KeyError") return { bug: "KeyBug", texto: `Esa clave no está en el diccionario${enLinea}: ${mensaje}. Usa .get(clave, valor_por_defecto) para evitar el error.` };
  if (tipo === "ZeroDivisionError") return { bug: "ZeroBug", texto: `Dividiste entre cero${enLinea}. Revisa el divisor o atrapa el error con try/except.` };
  if (tipo === "ValueError" && /invalid literal for int/i.test(mensaje)) return { bug: "ValueBug", texto: `int() solo convierte textos con dígitos, como "12"${enLinea}.` };
  if (tipo === "AttributeError") return { bug: "AttrBug", texto: `Ese objeto no tiene ese método o atributo${enLinea}: ${mensaje}` };
  if (tipo === "AssertionError") return { bug: "TestBug", texto: `Una prueba (assert) falló${enLinea}: el resultado no es el esperado.` };

  if (tipo === "OSError" || /stdin|input/i.test(mensaje)) {
    return { bug: "InputBug", texto: "En esta misión todavía no usamos input(). ¡Lo aprenderás pronto!" };
  }

  return {
    bug: `${tipo || "Error"}Bug`,
    texto: `Apareció un Bug que aún no conozco${enLinea}: ${error.original || mensaje}`,
  };
}
