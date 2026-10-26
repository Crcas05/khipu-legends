// Prólogo: "Los primeros 60 segundos". Antes de cualquier explicación larga, el jugador
// ya escribe y elige código que cambia el mundo: variable + str, int + operación, bool.
// Regla de diseño: primero haces y ves el efecto; después, una sola línea de teoría.

import { estado, guardar } from "../estado";
import { retrato } from "./retratos";
import { sonido, musicaSuave } from "../sonido";

export interface EfectosPrologo {
  festejar(): void;
  barra(valor: number): void;
  ataque(activo: boolean): void;
  escudo(activo: boolean): void;
  golpe(): void;
  chispas(): void;
}

const escapar = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const caja = () => document.getElementById("prologo")!;
export const cerrarTarjeta = () => (caja().hidden = true);

export function tarjeta(html: string) {
  const c = caja();
  c.innerHTML = `<div class="prologo-tarjeta">${html}</div>`;
  c.hidden = false;
  c.classList.remove("entra");
  void c.offsetWidth;
  c.classList.add("entra");
  return c;
}

export function voz(quien: string, texto: string) {
  return `<div class="prologo-tuki">${retrato(quien, 46)}<p>${texto}</p></div>`;
}
const tuki = (texto: string) => voz("tuki", texto);

export function teoria(texto: string) {
  return `<div class="teoria"><b>📘 TEORÍA</b><p>${texto}</p></div>`;
}

export function esperarBoton(c: HTMLElement, selector: string): Promise<void> {
  return new Promise((r) =>
    c.querySelector(selector)!.addEventListener("click", () => {
      sonido.toque();
      r();
    })
  );
}

/** Opciones de código: resuelve cuando elige la correcta. Las incorrectas explican por qué. */
export function elegir(c: HTMLElement, opciones: { codigo: string; ok: boolean; porque: string }[], alFallar?: () => void): Promise<void> {
  const zona = c.querySelector<HTMLElement>(".prologo-opciones")!;
  const nota = c.querySelector<HTMLElement>(".prologo-nota")!;
  zona.innerHTML = opciones.map((o, i) => `<button class="opcion" data-i="${i}"><code>${escapar(o.codigo)}</code></button>`).join("");
  return new Promise((r) =>
    zona.querySelectorAll<HTMLButtonElement>(".opcion").forEach((b) =>
      b.addEventListener("click", () => {
        const o = opciones[Number(b.dataset.i)];
        nota.hidden = false;
        nota.textContent = o.porque;
        nota.className = `prologo-nota ${o.ok ? "bien" : "mal"}`;
        if (!o.ok) {
          sonido.error();
          b.classList.add("fallo");
          b.disabled = true;
          alFallar?.();
          return;
        }
        sonido.acierto();
        b.classList.add("acierto");
        zona.querySelectorAll<HTMLButtonElement>(".opcion").forEach((x) => (x.disabled = true));
        window.setTimeout(r, 700);
      })
    )
  );
}

export async function prologo(fx: EfectosPrologo) {
  musicaSuave(true);
  document.body.classList.add("en-prologo");

  // --- 1. Tu nombre es una variable (str) ---
  let c = tarjeta(`
    ${tuki("¡Kraa! Despierta, Chaski. En este mundo <b>todo es código</b>… hasta tu nombre. ¡Escríbelo!")}
    <div class="linea-codigo">
      <span class="var">nombre</span> <span class="op">=</span> <span class="str">"</span><input id="prologo-nombre" maxlength="14" autocomplete="off" autocapitalize="words" spellcheck="false" placeholder="tu nombre"><span class="str">"</span>
    </div>
    <button class="boton-oro" id="prologo-ejecutar">▶ Ejecutar</button>
    <p class="prologo-nota" hidden></p>`);
  const entradaNombre = c.querySelector<HTMLInputElement>("#prologo-nombre")!;
  entradaNombre.addEventListener("keydown", (e) => {
    e.stopPropagation();
    if (e.key === "Enter") c.querySelector<HTMLButtonElement>("#prologo-ejecutar")!.click();
  });
  window.setTimeout(() => entradaNombre.focus(), 300);
  await new Promise<void>((r) => {
    c.querySelector("#prologo-ejecutar")!.addEventListener("click", () => {
      const limpio = entradaNombre.value.replace(/["'<>]/g, "").trim();
      const nota = c.querySelector<HTMLElement>(".prologo-nota")!;
      if (!limpio) {
        sonido.error();
        nota.hidden = false;
        nota.className = "prologo-nota mal";
        nota.textContent = "La caja está vacía. Escribe tu nombre entre las comillas.";
        return;
      }
      estado.nombre = limpio.slice(0, 14);
      guardar();
      entradaNombre.blur();
      r();
    });
  });
  sonido.acierto();
  fx.festejar();
  fx.chispas();
  c = tarjeta(`
    ${tuki(`¡Allillanchu, <b>${escapar(estado.nombre)}</b>! Acabas de escribir tu primera línea de Python.`)}
    <pre class="codigo-mini"><span class="var">nombre</span> = <span class="str">"${escapar(estado.nombre)}"</span></pre>
    ${teoria("Creaste una <b>variable</b>: una caja con nombre que guarda un valor. Lo que va entre comillas es un <b>texto</b>, en Python se llama <code>str</code>.")}
    <button class="boton-oro" id="seguir">Siguiente ▸</button>`);
  await esperarBoton(c, "#seguir");

  // --- 2. Kallpa: números (int) y una operación ---
  fx.barra(0);
  c = tarjeta(`
    ${tuki("Para correr necesitas <b>kallpa</b> (fuerza). ¡Mira tu barra: está en 0! Dale 10 de kallpa:")}
    <div class="prologo-opciones"></div>
    <p class="prologo-nota" hidden></p>`);
  await elegir(c, [
    { codigo: 'kallpa = "diez"', ok: false, porque: '"diez" es un texto. Con textos no se puede sumar ni llenar una barra.' },
    { codigo: "kallpa = 10", ok: true, porque: "¡Eso! 10 es un número." },
    { codigo: "kallpa = diez", ok: false, porque: "Sin comillas, Python busca una variable llamada diez… y no existe (NameError)." },
  ]);
  fx.barra(10);
  sonido.kallpa();
  c = tarjeta(`
    ${tuki("¡Siente la fuerza! Ahora una pregunta rápida de Chaski: ¿qué mostrará esta runa?")}
    <pre class="codigo-mini"><span class="fn">print</span>(<span class="var">kallpa</span> + <span class="num">5</span>)</pre>
    <div class="prologo-opciones"></div>
    <p class="prologo-nota" hidden></p>`);
  await elegir(c, [
    { codigo: "15", ok: true, porque: "¡Exacto! kallpa vale 10, y 10 + 5 = 15." },
    { codigo: "kallpa5", ok: false, porque: "kallpa no es un texto: es la caja que guarda 10. Python usa su valor." },
    { codigo: "105", ok: false, porque: "Eso pasaría si juntaras textos. Con números, + suma de verdad." },
  ]);
  fx.barra(15);
  c = tarjeta(`
    ${teoria("Los <b>números enteros</b> se llaman <code>int</code> y van <b>sin comillas</b>. Con ellos puedes hacer cuentas: <code>+  -  *  /</code>. <code>print()</code> muestra el resultado.")}
    <button class="boton-oro" id="seguir">Siguiente ▸</button>`);
  await esperarBoton(c, "#seguir");

  // --- 3. ¡Ataque del Bug! Escudo con True/False (bool) ---
  fx.ataque(true);
  sonido.error();
  document.body.classList.add("alarma");
  c = tarjeta(`
    ${tuki("¡KRAA! ¡El <b>Bug Ch'aqwa</b>! ¡Activa tu escudo, rápido!")}
    <pre class="codigo-mini"><span class="var">escudo</span> = <span class="valor">___</span></pre>
    <div class="prologo-opciones"></div>
    <p class="prologo-nota" hidden></p>`);
  let kallpaActual = 15;
  await elegir(
    c,
    [
      { codigo: "escudo = False", ok: false, porque: "False significa NO. ¡Sin escudo te golpea! Pierdes 3 de kallpa." },
      { codigo: "escudo = True", ok: true, porque: "True significa SÍ. ¡Escudo activado!" },
    ],
    () => {
      fx.golpe();
      kallpaActual = Math.max(0, kallpaActual - 3);
      fx.barra(kallpaActual);
    }
  );
  document.body.classList.remove("alarma");
  fx.escudo(true);
  fx.ataque(false);
  fx.chispas();
  sonido.reparar();
  fx.festejar();
  c = tarjeta(`
    ${tuki("¡Lo espantaste! El Bug huyó hacia la fuente.")}
    ${teoria("<code>True</code> (verdadero) y <code>False</code> (falso) son <b>booleanos</b> (<code>bool</code>). Sirven para preguntas de sí o no: ¿hay escudo? ¿hay agua?")}
    <button class="boton-oro" id="seguir">Siguiente ▸</button>`);
  await esperarBoton(c, "#seguir");
  fx.escudo(false);

  // --- 4. Resumen: ya sabes 4 cosas ---
  c = tarjeta(`
    <h3 class="prologo-titulo">🎓 ¡En un minuto ya aprendiste!</h3>
    <div class="prologo-resumen">
      <span>📦 Variables</span><span>🔤 Textos <code>str</code></span><span>🔢 Números <code>int</code> y cuentas</span><span>✅ <code>True</code> / <code>False</code></span>
    </div>
    <p class="explica">Todo lo que escribas en este juego es <b>Python de verdad</b>. Lo encontrarás en tu 📖 Simi Qillqa.</p>
    <button class="boton-oro" id="seguir">¡A la aventura! ▸</button>`);
  await esperarBoton(c, "#seguir");
  caja().hidden = true;
  document.body.classList.remove("en-prologo");
  fx.barra(-1);
  musicaSuave(false);
}
