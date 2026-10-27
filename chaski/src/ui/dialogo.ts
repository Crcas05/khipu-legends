// Diálogos con retrato, efecto de máquina de escribir y palabras en quechua.

import { NOMBRES, PALABRAS, type Linea } from "../datos/episodio1";
import { estado, guardar } from "../estado";
import { retrato } from "./retratos";
import { aviso, actualizarHud } from "./hud";
import { sonido, musicaSuave } from "../sonido";
import { decir, callar, hayVoz } from "./hablaCel";

let alHablarFn: ((quien: string) => void) | null = null;
/** El juego se entera de quién habla (para que ese personaje gire y haga gestos). */
export const alHablar = (fn: (quien: string) => void) => (alHablarFn = fn);

let abierto = false;
export const dialogoAbierto = () => abierto;

function aprender(palabra: string): boolean {
  const p = palabra.toLowerCase();
  if (!(p in PALABRAS) || estado.palabras.includes(p)) return false;
  estado.palabras.push(p);
  guardar();
  actualizarHud();
  return true;
}

function preparar(original: string) {
  const texto = original.replace(/\{nombre\}/g, estado.nombre || "Chaski");
  const nuevas: string[] = [];
  const seguro = texto.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const html = seguro.replace(/\[\[([^\]]+)\]\]/g, (_, p: string) => {
    if (aprender(p)) nuevas.push(p.toLowerCase());
    return `<b class="quechua" title="${PALABRAS[p.toLowerCase()] ?? ""}">${p}</b>`;
  });
  const plano = texto.replace(/\[\[([^\]]+)\]\]/g, "$1");
  return { html, plano, nuevas };
}

/** Muestra una secuencia de líneas. Termina cuando el jugador lee la última. */
export function hablar(lineas: Linea[]): Promise<void> {
  const caja = document.getElementById("dialogo")!;
  const marco = document.getElementById("dialogo-retrato")!;
  const nombre = document.getElementById("dialogo-nombre")!;
  const texto = document.getElementById("dialogo-texto")!;
  abierto = true;
  caja.hidden = false;
  document.body.classList.add("hablando");
  musicaSuave(true);

  return new Promise((terminar) => {
    let i = 0;
    let escribiendo: number | undefined;
    let htmlCompleto = "";

    const mostrar = () => {
      const l = lineas[i];
      const narrador = l.quien === "narrador";
      marco.innerHTML = narrador ? "" : retrato(l.quien, 64);
      marco.hidden = narrador;
      nombre.textContent = NOMBRES[l.quien];
      caja.classList.toggle("narrador", narrador);
      caja.dataset.quien = l.quien;
      const { html, plano, nuevas } = preparar(l.texto);
      htmlCompleto = html;
      let n = 0;
      texto.textContent = "";
      window.clearInterval(escribiendo);
      escribiendo = window.setInterval(() => {
        n += 2;
        if (n % 6 === 0) sonido.letra();
        texto.textContent = plano.slice(0, n);
        if (n >= plano.length) {
          window.clearInterval(escribiendo);
          escribiendo = undefined;
          texto.innerHTML = htmlCompleto;
        }
      }, 20);
      alHablarFn?.(l.quien);
      if (estado.voz) decir(l.texto, l.quien);
      if (nuevas.length) aviso(`📖 Nueva palabra quechua: ${nuevas.map((p) => `${p} = ${PALABRAS[p]}`).join(" · ")}`, 4500);
    };

    const avanzar = () => {
      sonido.toque();
      if (escribiendo !== undefined) {
        window.clearInterval(escribiendo);
        escribiendo = undefined;
        texto.innerHTML = htmlCompleto;
        return;
      }
      i++;
      if (i < lineas.length) return mostrar();
      caja.hidden = true;
      callar();
      abierto = false;
      document.body.classList.remove("hablando");
      musicaSuave(false);
      caja.removeEventListener("pointerdown", alTocar);
      window.removeEventListener("keydown", alTeclear);
      terminar();
    };
    const alTocar = (e: Event) => {
      e.preventDefault();
      if ((e.target as HTMLElement).closest("#dialogo-voz")) {
        decir(lineas[i].texto, lineas[i].quien);
        return;
      }
      avanzar();
    };
    const alTeclear = (e: KeyboardEvent) => {
      if ([" ", "Enter", "e", "E"].includes(e.key)) {
        e.preventDefault();
        avanzar();
      }
    };
    document.getElementById("dialogo-voz")!.hidden = !hayVoz();
    caja.addEventListener("pointerdown", alTocar);
    window.addEventListener("keydown", alTeclear);
    mostrar();
  });
}
