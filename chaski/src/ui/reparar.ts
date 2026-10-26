// Ventana del Ojo: el jugador elige el valor correcto de una variable del mundo.

import type { Reparacion } from "../datos/episodio1";
import { retrato } from "./retratos";
import { sonido, musicaSuave } from "../sonido";

const escapar = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");

/** Devuelve true cuando el jugador elige la opción correcta; false si cierra. */
export function abrirReparacion(r: Reparacion, valorActual: string): Promise<boolean> {
  const caja = document.getElementById("reparar")!;
  caja.innerHTML = `
    <div class="tarjeta reparar-tarjeta desplazable">
      <button class="cerrar" aria-label="Cerrar">✕</button>
      <p class="etiqueta-ojo">👁 Ojo del Khipukamayuq · ${escapar(r.titulo)}</p>
      <pre class="codigo-grande"><span class="var">${escapar(r.variable)}</span> = <span class="valor" id="reparar-valor">${escapar(valorActual)}</span></pre>
      <div class="consejo">${retrato("mama", 44)}<p>${escapar(r.pregunta)}</p></div>
      <div class="opciones">${r.opciones.map((o, i) => `<button class="opcion" data-i="${i}"><code>${escapar(o.valor)}</code></button>`).join("")}</div>
      <p class="explicacion" id="reparar-explicacion" hidden></p>
    </div>`;
  caja.hidden = false;
  musicaSuave(true);
  return new Promise((terminar) => {
    const cerrar = (ok: boolean) => {
      musicaSuave(false);
      caja.hidden = true;
      caja.innerHTML = "";
      terminar(ok);
    };
    caja.querySelector(".cerrar")!.addEventListener("click", () => cerrar(false));
    const explicacion = caja.querySelector<HTMLElement>("#reparar-explicacion")!;
    caja.querySelectorAll<HTMLButtonElement>(".opcion").forEach((b) =>
      b.addEventListener("click", () => {
        const o = r.opciones[Number(b.dataset.i)];
        explicacion.hidden = false;
        explicacion.textContent = o.explicacion;
        explicacion.className = `explicacion ${o.correcta ? "bien" : "mal"}`;
        if (!o.correcta) {
          sonido.error();
          b.classList.add("fallo");
          b.disabled = true;
          return;
        }
        sonido.acierto();
        b.classList.add("acierto");
        caja.querySelector("#reparar-valor")!.textContent = o.valor;
        caja.querySelectorAll<HTMLButtonElement>(".opcion").forEach((x) => (x.disabled = true));
        window.setTimeout(() => cerrar(true), 1300);
      })
    );
  });
}
