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

  if (tipo === "OSError" || /stdin|input/i.test(mensaje)) {
    return { bug: "InputBug", texto: "En esta misión todavía no usamos input(). ¡Lo aprenderás pronto!" };
  }

  return {
    bug: `${tipo || "Error"}Bug`,
    texto: `Apareció un Bug que aún no conozco${enLinea}: ${error.original || mensaje}`,
  };
}
