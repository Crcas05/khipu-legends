// DUELO DE RUNAS: tu código mueve a Chaski. El jefe tiene una barra de ataque que se llena
// (suspenso): si se llena, te golpea. Código correcto = daño; error = contraataque y Tuki explica.

import { python } from "../python/python";
import { traducirError } from "../python/tuki";
import { MOTOR_DUELO, type Mision, type Ronda } from "../datos/misiones";
import { sonido, musicaSuave } from "../sonido";
import { decir } from "./hablaCel";
import { estado } from "../estado";

export interface Accion {
  a: "atacar" | "rebota" | "esquivar" | "romper" | "recuperar" | "proteger" | "avanzar" | "esperar" | "sembrar" | "cuidar";
  vida?: number;
  p?: string;
  n?: number;
}

export interface EfectosDuelo {
  animar(a: Accion): Promise<void>;
  jefeGolpea(): Promise<void>;
  jefeVencido(): Promise<void>;
  /** Fracción de vida del jefe (1 = llena). */
  vidaJefe(f: number): void;
}

export interface ResultadoDuelo {
  ganado: boolean;
  errores: number;
  golpes: number;
}

const escapar = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const MODOS = { bloques: "🧩 Arma con bloques", completar: "✏ Completa el código", libre: "📜 Escribe tu runa" };

export function duelo(m: Mision, fx: EfectosDuelo): Promise<ResultadoDuelo> {
  const caja = document.getElementById("duelo")!;
  const respeto = m.jefe.tipo === "chullachaqui";
  let ronda = 0;
  let errores = 0;
  let golpes = 0;
  let fallosRonda = 0;
  let vidaChaski = 100;
  let ataque = 0;
  let ocupado = false;
  let terminado = false;
  void python.iniciar().catch(() => {});

  caja.innerHTML = `
    <div class="duelo-barras">
      <b class="duelo-jefe">${respeto ? "🌳" : "🐛"} ${escapar(m.jefe.nombre)}</b>
      <div class="barra roja"><i id="duelo-vida-jefe"></i></div>
      <small>${respeto ? "Desconfianza" : "Vida"}</small>
      <div class="duelo-ataque"><span>${respeto ? "🌫 Ilusión" : "⚔ Ataque"}</span><div class="barra"><i id="duelo-ataque"></i></div><b id="duelo-seg">0s</b></div>
    </div>
    <div class="duelo-chaski"><span>❤ Chaski</span><div class="barra verde"><i id="duelo-vida-chaski"></i></div></div>
    <section class="duelo-panel">
      <header>
        <p class="enfoque-titulo">DUELO DE RUNAS</p>
        <span class="duelo-ronda" id="duelo-ronda"></span>
        <button class="cerrar" id="duelo-salir" aria-label="Salir">✕</button>
      </header>
      <h3 id="duelo-titulo"></h3>
      <p id="duelo-enunciado"></p>
      <p class="duelo-teoria" id="duelo-teoria"></p>
      <textarea id="duelo-codigo" spellcheck="false" autocapitalize="off" autocomplete="off" rows="5"></textarea>
      <div class="duelo-lineas" id="duelo-lineas"></div>
      <div class="duelo-bloques" id="duelo-bloques"></div>
      <div class="duelo-tuki" id="duelo-tuki"><p>Despertando el intérprete de Python…</p></div>
      <div class="duelo-botones">
        <button class="boton-oro" id="duelo-ejecutar">▶ EJECUTAR</button>
        <button class="boton-secundario" id="duelo-borrar" title="Borrar la última línea">⌫</button>
        <button class="boton-secundario" id="duelo-reiniciar" title="Empezar de nuevo">↺</button>
        <button class="boton-secundario" id="duelo-pista" title="Pista">💡</button>
        <button class="boton-secundario" id="duelo-solucion" hidden>👀 Solución</button>
      </div>
    </section>`;
  caja.hidden = false;
  document.body.classList.add("en-duelo");
  const $ = <T extends HTMLElement>(id: string) => caja.querySelector<T>(`#${id}`)!;
  const editor = $<HTMLTextAreaElement>("duelo-codigo");
  const tuki = $("duelo-tuki");
  const ejecutar = $<HTMLButtonElement>("duelo-ejecutar");

  const mensaje = (html: string, tipo: "bien" | "mal" | "info" = "info") => {
    tuki.className = `duelo-tuki ${tipo}`;
    tuki.innerHTML = `<p>${html}</p>`;
    if (estado.voz) decir(html.replace(/<[^>]+>/g, " "), "tuki");
  };
  const pintar = () => {
    ($("duelo-vida-chaski") as HTMLElement).style.width = `${vidaChaski}%`;
    ($("duelo-ataque") as HTMLElement).style.width = `${Math.min(100, ataque * 100)}%`;
    $("duelo-seg").textContent = `${Math.ceil((1 - ataque) * m.jefe.tiempoAtaque)}s`;
    caja.classList.toggle("peligro", ataque > 0.75);
  };
  const vidaJefe = (f: number) => {
    ($("duelo-vida-jefe") as HTMLElement).style.width = `${Math.max(0, f * 100)}%`;
    fx.vidaJefe(f);
  };

  const r = () => m.rondas[ronda];
  /** Cuenta las órdenes (líneas) y avisa si sobran, antes de ejecutar. */
  const contar = () => {
    const x = r();
    const el = $("duelo-lineas");
    if (x.modo !== "bloques") {
      el.textContent = "";
      return;
    }
    const n = editor.value.split("\n").filter((l) => l.trim()).length;
    const pide = x.solucion.split("\n").filter((l) => l.trim()).length;
    el.textContent = n > pide ? `⚠ ${n} órdenes: te sobran algunas (toca ⌫ para borrar la última)` : `${n} ${n === 1 ? "orden" : "órdenes"}`;
    el.classList.toggle("demas", n > pide);
  };
  const ponerRonda = () => {
    const x = r();
    fallosRonda = 0;
    $("duelo-ronda").textContent = `Ronda ${ronda + 1}/${m.rondas.length} · ${MODOS[x.modo]}`;
    $("duelo-titulo").textContent = x.titulo;
    $("duelo-enunciado").innerHTML = x.enunciado;
    $("duelo-teoria").innerHTML = `💡 ${x.teoria}`;
    editor.value = x.plantilla;
    editor.readOnly = x.modo === "bloques";
    editor.placeholder = x.modo === "bloques" ? "Toca los bloques de abajo para armar tu runa…" : "";
    $("duelo-solucion").hidden = true;
    $("duelo-borrar").hidden = x.modo !== "bloques";
    $("duelo-bloques").innerHTML = x.bloques
      .map((b) => `<button class="bloque-duelo ${b.trim() === "" ? "sangria" : ""}" data-b="${escapar(b)}"><code>${b.trim() === "" ? "⇥ sangría" : escapar(b)}</code></button>`)
      .join("");
    $("duelo-bloques")
      .querySelectorAll<HTMLButtonElement>(".bloque-duelo")
      .forEach((bt) =>
        bt.addEventListener("click", () => {
          sonido.toque();
          const b = bt.dataset.b!;
          if (r().modo === "bloques") {
            editor.value = editor.value ? `${editor.value}\n${b}` : b;
            contar();
            editor.scrollTop = editor.scrollHeight;
          } else {
            const i = editor.selectionStart ?? editor.value.length;
            const j = editor.selectionEnd ?? i;
            const texto = b.trim() === "" ? "    " : b;
            editor.value = editor.value.slice(0, i) + texto + editor.value.slice(j);
            editor.focus();
            editor.selectionStart = editor.selectionEnd = i + texto.length;
          }
        })
      );
    vidaJefe(1 - ronda / m.rondas.length);
    contar();
  };

  editor.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const i = editor.selectionStart;
      editor.value = editor.value.slice(0, i) + "    " + editor.value.slice(editor.selectionEnd);
      editor.selectionStart = editor.selectionEnd = i + 4;
    }
  });

  return new Promise((resolver) => {
    const terminar = (ganado: boolean) => {
      terminado = true;
      window.clearInterval(reloj);
      caja.hidden = true;
      caja.innerHTML = "";
      document.body.classList.remove("en-duelo");
      musicaSuave(false);
      resolver({ ganado, errores, golpes });
    };

    // Suspenso: la barra de ataque del jefe se llena con el tiempo
    const reloj = window.setInterval(async () => {
      if (terminado || ocupado) return;
      ataque += 0.1 / m.jefe.tiempoAtaque;
      if (ataque >= 1) {
        ataque = 0;
        ocupado = true;
        golpes++;
        sonido.error();
        await fx.jefeGolpea();
        recibir(20, respeto ? "🌫 ¡La ilusión del Chullachaqui te confundió! Escribe tu runa antes de que se llene la barra." : "💥 ¡Te atacó! Ejecuta tu runa antes de que se llene la barra de ataque.");
        ocupado = false;
      }
      pintar();
    }, 100);

    const recibir = (n: number, texto: string) => {
      vidaChaski -= n;
      document.body.classList.remove("golpe");
      void document.body.offsetWidth;
      document.body.classList.add("golpe");
      if (vidaChaski <= 0) {
        vidaChaski = 100;
        errores++;
        mensaje(`${respeto ? "🌀 Te perdiste en la neblina…" : "💫 ¡Te desordenaron!"} Tuki te levanta: <b>¡inténtalo otra vez!</b>`, "mal");
      } else mensaje(texto, "mal");
      pintar();
    };

    $("duelo-salir").addEventListener("click", () => {
      if (ocupado) return;
      const b = $("duelo-salir");
      if (b.dataset.confirmar) return terminar(false);
      b.dataset.confirmar = "1";
      b.textContent = "¿Salir?";
      window.setTimeout(() => {
        delete b.dataset.confirmar;
        b.textContent = "✕";
      }, 2500);
    });
    $("duelo-borrar").addEventListener("click", () => {
      editor.value = editor.value.split("\n").slice(0, -1).join("\n");
      contar();
    });
    $("duelo-reiniciar").addEventListener("click", () => {
      editor.value = r().plantilla;
      contar();
    });
    $("duelo-pista").addEventListener("click", () => mensaje(`💡 ${r().teoria}<br>👉 ${r().pista}`, "info"));
    $("duelo-solucion").addEventListener("click", () => {
      editor.value = r().solucion;
      contar();
      mensaje("Esta es una forma de hacerlo. Léela con calma y luego toca ▶ EJECUTAR.", "info");
    });

    ejecutar.addEventListener("click", async () => {
      if (ocupado || terminado) return;
      const x: Ronda = r();
      const codigo = editor.value;
      if (!codigo.trim() || codigo.trim() === x.plantilla.trim()) {
        mensaje(x.modo === "bloques" ? "Toca los bloques para armar tu runa." : "Completa el código antes de ejecutar.", "info");
        return;
      }
      ocupado = true;
      ejecutar.disabled = true;
      mensaje("⚡ Ejecutando tu runa…");
      const antes = [MOTOR_DUELO, x.preludio, `_codigo = ${JSON.stringify(codigo)}`].join("\n");
      const desfase = antes.split("\n").length;
      const texto = [antes, codigo, "print('§ACCIONES ' + _json.dumps(_acciones))", x.comprobar].join("\n");
      const res = await python.ejecutar(texto);
      const lineas = res.salida.join("\n").split("\n");
      const accionesTxt = lineas.find((l) => l.startsWith("§ACCIONES "));
      const acciones: Accion[] = accionesTxt ? JSON.parse(accionesTxt.slice(10)) : [];
      const falla = lineas.find((l) => l.startsWith("§FALLA "));
      // Animar lo que hizo el código (aunque falle: así se ve el error)
      for (const a of acciones.slice(0, 24)) {
        if (terminado) return;
        await fx.animar(a);
        if (a.a === "atacar" && typeof a.vida === "number") {
          const base = 1 - ronda / m.rondas.length;
          vidaJefe(base - (1 / m.rondas.length) * 0.6 * (acciones.filter((y) => y.a === "atacar").indexOf(a) + 1) / Math.max(1, acciones.filter((y) => y.a === "atacar").length));
        }
      }
      ejecutar.disabled = false;
      if (res.error || falla) {
        errores++;
        fallosRonda++;
        if (fallosRonda >= 3) $("duelo-solucion").hidden = false;
        let explicacion = falla ? falla.slice(7) : "";
        if (res.error) {
          const e = { ...res.error, linea: res.error.linea ? res.error.linea - desfase : null };
          const t = traducirError(e);
          explicacion = `<b>${escapar(t.bug)}</b> ${t.texto}`;
          if (res.error.tipo === "Timeout") explicacion = "<b>Tu runa nunca termina.</b> ¿Un while que no se detiene? Revisa la condición.";
        }
        await fx.jefeGolpea();
        recibir(12, `❌ ${explicacion}`);
        ocupado = false;
        return;
      }
      // ¡Ronda ganada!
      sonido.acierto();
      ataque = Math.max(0, ataque - 0.35);
      ronda++;
      vidaJefe(1 - ronda / m.rondas.length);
      if (ronda >= m.rondas.length) {
        mensaje(respeto ? "🌳 ¡Ganaste su confianza!" : "🏆 ¡Lo venciste con tus runas!", "bien");
        await fx.jefeVencido();
        terminar(true);
        return;
      }
      mensaje(`✅ ¡Runa perfecta! ${respeto ? "El Chullachaqui te mira con respeto." : "¡Le diste duro!"} Siguiente ronda…`, "bien");
      window.setTimeout(() => {
        ponerRonda();
        ocupado = false;
      }, 1400);
    });

    ponerRonda();
    pintar();
    python
      .iniciar()
      .then(() => mensaje(`Tu runa mueve a Chaski. ${r().modo === "bloques" ? "Toca los bloques" : "Completa el código"} y toca <b>▶ EJECUTAR</b> antes de que se llene la barra de ${respeto ? "ilusión" : "ataque"}.`))
      .catch(() => mensaje("No se pudo cargar Python. Revisa tu conexión y vuelve a intentar.", "mal"));
  });
}
