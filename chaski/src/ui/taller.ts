// El Taller: el jugador escribe Python real, sin prisa. Se ejecuta en su propio
// dispositivo (Pyodide en un Web Worker); Tuki traduce los errores a español simple.

import { python } from "../python/python";
import { traducirError } from "../python/tuki";
import { estado, guardar } from "../estado";
import { retrato } from "./retratos";
import { sonido, musicaSuave } from "../sonido";
import { MOTOR_SQL, AYUDAS_PY } from "../python/motorSql";

const escapar = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const ATAJOS = ['"', "=", "(", ")", ":", "print(", "    ", "*", "#", "_"];
const ATAJOS_SQL = ["SELECT ", "FROM ", "WHERE ", "*", ",", "'", "=", "(", ")", ";"];

/** Un reto del Taller. La "revision" se agrega al final del código y debe imprimir una línea §REVISION§ ... */
export interface Reto {
  id: string;
  titulo: string;
  enunciado: string[];
  plantilla: string;
  pistas: string[];
  revision?: string;
  variables?: string[];
  /** Recibe las partes de la línea §REVISION§ y lo que mostró el jugador. Devuelve un consejo o null si está bien. */
  validar?: (partes: string[], visibles: string[]) => string | null;
  /** Código Python que revisa el resultado: imprime "§FALLA mensaje" con _falla() si algo está mal. */
  comprobar?: string;
  /** "sql": el jugador escribe SQL que corre en SQLite real. */
  lenguaje?: "python" | "sql";
  /** Una solución correcta (se ofrece tras 3 intentos fallidos y sirve para las pruebas automáticas). */
  solucion?: string;
  exito: string;
  /** Python oculto que prepara el mundo (en modo SQL: crea las tablas con correr_sql o _db). */
  preludio?: string;
}

/** Arma el programa completo que se ejecuta (también lo usan las pruebas automáticas). */
const TEE_PY = [
  "import sys as _sys, io as _io",
  "class _Tee:",
  "    def __init__(self, original):",
  "        self._original = getattr(original, '_original', original)",
  "        self.texto = _io.StringIO()",
  "    def write(self, s):",
  "        self.texto.write(s)",
  "        return self._original.write(s)",
  "    def flush(self):",
  "        self._original.flush()",
  "_tee = _Tee(_sys.stdout)",
  "_sys.stdout = _tee",
].join("\n");

export function programa(r: Reto, codigo: string): { texto: string; desfase: number } {
  const codigoJson = JSON.stringify(JSON.stringify(codigo));
  if (r.lenguaje === "sql") {
    const texto = [MOTOR_SQL, r.preludio ?? "", "_mensajes.clear()", "import json as _json", `_codigo = _json.loads(${codigoJson})`, "correr_sql(_codigo)", r.comprobar ?? ""].join("\n");
    return { texto, desfase: -1 };
  }
  // Copia lo que muestra el programa en _salida (para comprobarlo) sin dejar de mostrarlo
  const lineasPrevias = [r.comprobar ? TEE_PY : "", r.preludio ?? ""].filter(Boolean);
  const pre = lineasPrevias.length ? lineasPrevias.join("\n") + "\n" : "";
  const revisar = r.comprobar
    ? ["_sys.stdout = _tee._original", "_salida = _tee.texto.getvalue()", "import json as _json", `_codigo = _json.loads(${codigoJson})`, AYUDAS_PY, r.comprobar].join("\n")
    : "";
  const texto = `${pre}${codigo}\n${r.revision ?? ""}\n${revisar}`;
  return { texto, desfase: pre.split("\n").length - 1 };
}

export function abrirTaller(r: Reto): Promise<boolean | "ayuda"> {
  const sql = r.lenguaje === "sql";
  const atajos = sql ? ATAJOS_SQL : ATAJOS;
  const caja = document.getElementById("taller")!;
  caja.innerHTML = `
    <div class="tarjeta taller-tarjeta">
      <header class="taller-cabecera">
        <span>${sql ? "🗃 Qullqa de datos · SQL" : "📜 Taller de Runas"}</span>
        <span id="taller-estado" class="estado-python">Despertando el intérprete…</span>
        <button class="cerrar" aria-label="Cerrar">✕</button>
      </header>
      <div class="taller-cuerpo desplazable">
        <section class="taller-reto">
          <h3>${escapar(r.titulo)}</h3>
          <ol>${r.enunciado.map((e) => `<li>${e}</li>`).join("")}</ol>
          <button class="pista" id="taller-pista">💡 Pista</button>
          <p class="pista-texto" id="taller-pista-texto" hidden></p>
        </section>
        <section class="taller-editor">
          <textarea id="taller-codigo" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off"></textarea>
          <div class="atajos">${atajos.map((a) => `<button data-a="${escapar(a)}">${a === "    " ? "⇥" : escapar(a.trim() || a)}</button>`).join("")}</div>
          <div class="fila-botones"><button class="boton-secundario" id="taller-solucion" hidden>👀 Ver una solución</button></div>
          <button class="boton-oro boton-ejecutar" id="taller-ejecutar" disabled>▶ Ejecutar runa</button>
          <div class="tuki-dice" id="taller-tuki" hidden>${retrato("tuki", 40)}<p></p></div>
          <div class="consola" id="taller-consola"><span class="gris">La salida de tu runa aparecerá aquí.</span></div>
        </section>
      </div>
    </div>`;
  caja.hidden = false;
  const editor = caja.querySelector<HTMLTextAreaElement>("#taller-codigo")!;
  editor.value = estado.runas[r.id] || (r.id === "variables" ? estado.codigo : "") || r.plantilla;
  let fallos = 0;
  let usoSolucion = false;
  const botonSolucion = caja.querySelector<HTMLButtonElement>("#taller-solucion")!;
  botonSolucion.addEventListener("click", () => {
    if (!r.solucion) return;
    editor.value = r.solucion;
    usoSolucion = true;
    decir("Aquí tienes una solución. Léela con calma, entiende cada línea y ejecútala. 🧠", "bien");
  });
  const consola = caja.querySelector<HTMLElement>("#taller-consola")!;
  const tuki = caja.querySelector<HTMLElement>("#taller-tuki")!;
  const botonEjecutar = caja.querySelector<HTMLButtonElement>("#taller-ejecutar")!;
  const estadoPy = caja.querySelector<HTMLElement>("#taller-estado")!;
  let pista = 0;

  python.alCambiar((e) => {
    estadoPy.textContent = e === "listo" ? "🟢 Python listo" : e === "cargando" ? "⏳ Despertando el intérprete…" : e === "error" ? "🔴 Sin conexión" : "";
    botonEjecutar.disabled = e !== "listo";
  });
  python.iniciar().catch(() => {
    decir("No pude despertar a Python. Revisa tu conexión a internet y vuelve a abrir el Taller.", "mal");
  });

  musicaSuave(true);
  function decir(texto: string, tipo: "bien" | "mal") {
    if (tipo === "mal") sonido.error();
    else sonido.acierto();
    tuki.hidden = false;
    tuki.className = `tuki-dice ${tipo}`;
    tuki.querySelector("p")!.innerHTML = texto;
  }

  // Atajos para escribir en el celular y tecla Tab
  caja.querySelectorAll<HTMLButtonElement>(".atajos button").forEach((b) =>
    b.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      insertar(b.dataset.a!);
    })
  );
  editor.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      insertar("    ");
    }
    e.stopPropagation();
  });
  function insertar(t: string) {
    const i = editor.selectionStart;
    editor.value = editor.value.slice(0, i) + t + editor.value.slice(editor.selectionEnd);
    editor.selectionStart = editor.selectionEnd = i + t.length;
    editor.focus();
  }

  caja.querySelector("#taller-pista")!.addEventListener("click", () => {
    const p = caja.querySelector<HTMLElement>("#taller-pista-texto")!;
    p.hidden = false;
    p.innerHTML = escapar(r.pistas[Math.min(pista, r.pistas.length - 1)]);
    pista++;
  });

  return new Promise((terminar) => {
    const cerrar = (ok: boolean | "ayuda") => {
      musicaSuave(false);
      estado.runas[r.id] = editor.value;
      if (r.id === "variables") estado.codigo = editor.value;
      guardar();
      caja.hidden = true;
      caja.innerHTML = "";
      terminar(ok);
    };
    caja.querySelector(".cerrar")!.addEventListener("click", () => cerrar(false));

    let completado = false;
    botonEjecutar.addEventListener("click", async () => {
      if (completado) return cerrar(usoSolucion ? "ayuda" : true);
      botonEjecutar.disabled = true;
      consola.innerHTML = '<span class="gris">Ejecutando…</span>';
      const { texto, desfase } = programa(r, editor.value);
      const res = await python.ejecutar(texto);
      if (res.error) res.error.linea = desfase < 0 ? null : res.error.linea ? res.error.linea - desfase : null;
      botonEjecutar.disabled = false;
      const lineas = res.salida.join("\n").split("\n");
      const revision = lineas.find((l) => l.startsWith("§REVISION§"));
      const falla = lineas.find((l) => l.startsWith("§FALLA "));
      const visibles = lineas.filter((l) => !l.startsWith("§") && l !== "");
      const fallar = (html: string) => {
        fallos++;
        if (fallos >= 3 && r.solucion) botonSolucion.hidden = false;
        return decir(html, "mal");
      };
      consola.innerHTML = visibles.length ? visibles.map((l) => `<div>${escapar(l)}</div>`).join("") : '<span class="gris">(tu runa no mostró nada)</span>';

      if (!res.ok && res.error) {
        const falta = (res.error.mensaje.match(/name '([^']+)' is not defined/) || [])[1];
        if (falta && r.variables?.includes(falta)) return fallar(`Falta crear <b>${falta}</b>. Escríbelo antes de usarlo.`);
        const t = traducirError(res.error);
        return fallar(`<b>${t.bug}</b>: ${escapar(t.texto)}`);
      }
      if (falla) return fallar(falla.slice(7));
      const consejo = r.validar ? r.validar((revision ?? "").split(" ").slice(1), visibles) : null;
      if (consejo) return fallar(consejo);
      decir(r.exito, "bien");
      completado = true;
      botonEjecutar.textContent = "✓ Continuar";
      botonEjecutar.classList.add("listo");
    });
  });
}
