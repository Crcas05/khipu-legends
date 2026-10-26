// El Taller: el jugador escribe Python real, sin prisa. Se ejecuta en su propio
// dispositivo (Pyodide en un Web Worker); Tuki traduce los errores a español simple.

import { RETO_TALLER } from "../datos/episodio1";
import { python } from "../python/python";
import { traducirError } from "../python/tuki";
import { estado, guardar } from "../estado";
import { retrato } from "./retratos";
import { sonido, musicaSuave } from "../sonido";

const escapar = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const ATAJOS = ['"', "=", "(", ")", "print(", "#", "_"];

export function abrirTaller(): Promise<boolean> {
  const r = RETO_TALLER;
  const caja = document.getElementById("taller")!;
  caja.innerHTML = `
    <div class="tarjeta taller-tarjeta">
      <header class="taller-cabecera">
        <span>📜 Taller de Runas</span>
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
          <div class="atajos">${ATAJOS.map((a) => `<button data-a='${a}'>${escapar(a)}</button>`).join("")}</div>
          <button class="boton-oro boton-ejecutar" id="taller-ejecutar" disabled>▶ Ejecutar runa</button>
          <div class="tuki-dice" id="taller-tuki" hidden>${retrato("tuki", 40)}<p></p></div>
          <div class="consola" id="taller-consola"><span class="gris">La salida de tu runa aparecerá aquí.</span></div>
        </section>
      </div>
    </div>`;
  caja.hidden = false;
  const editor = caja.querySelector<HTMLTextAreaElement>("#taller-codigo")!;
  editor.value = estado.codigo || r.plantilla;
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
    p.textContent = r.pistas[Math.min(pista, r.pistas.length - 1)];
    pista++;
  });

  return new Promise((terminar) => {
    const cerrar = (ok: boolean) => {
      musicaSuave(false);
      estado.codigo = editor.value;
      guardar();
      caja.hidden = true;
      caja.innerHTML = "";
      terminar(ok);
    };
    caja.querySelector(".cerrar")!.addEventListener("click", () => cerrar(false));

    let completado = false;
    botonEjecutar.addEventListener("click", async () => {
      if (completado) return cerrar(true);
      botonEjecutar.disabled = true;
      consola.innerHTML = '<span class="gris">Ejecutando…</span>';
      const res = await python.ejecutar(editor.value + r.revision);
      botonEjecutar.disabled = false;
      const lineas = res.salida.join("\n").split("\n");
      const revision = lineas.find((l) => l.startsWith("§REVISION§"));
      const visibles = lineas.filter((l) => !l.startsWith("§REVISION§") && l !== "");
      consola.innerHTML = visibles.length ? visibles.map((l) => `<div>${escapar(l)}</div>`).join("") : '<span class="gris">(tu runa no mostró nada)</span>';

      if (!res.ok && res.error) {
        const falta = (res.error.mensaje.match(/name '(nombre|kallpa)' is not defined/) || [])[1];
        if (falta) return decir(`Falta crear la variable <b>${falta}</b>. Escribe <code>${falta} = …</code> antes de usarla.`, "mal");
        const t = traducirError(res.error);
        return decir(`<b>${t.bug}</b>: ${escapar(t.texto)}`, "mal");
      }
      const [, tipoNombre, tipoKallpa] = (revision ?? "").split(" ");
      if (tipoNombre !== "str") return decir("<b>nombre</b> debe ser un texto. Los textos van entre comillas: <code>nombre = \"Chaski\"</code>", "mal");
      if (tipoKallpa !== "int") return decir("<b>kallpa</b> debe ser un número entero, sin comillas: <code>kallpa = 10</code>", "mal");
      if (!visibles.length) return decir("Casi. Te falta mostrar tu nombre con <code>print(nombre)</code>.", "mal");

      decir("¡Kraa! ¡Runa completada! Guardaste un texto (str) y un número (int), y los mostraste con print. 🎉", "bien");
      completado = true;
      botonEjecutar.textContent = "✓ Continuar";
      botonEjecutar.classList.add("listo");
    });
  });
}
