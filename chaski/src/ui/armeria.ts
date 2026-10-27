// La Armería (wasi de armas): cada arma andina se forja escribiendo su runa de Python.
import { ARMAS, armaActual, elegirArma, type Arma } from "../armas";
import { estado, guardar } from "../estado";
import { sonido } from "../sonido";
import { abrirTaller } from "./taller";
import { desbloquear } from "./logros";

function caja() {
  return document.getElementById("mision-ui")!;
}

/** Abre la armería. Devuelve el arma forjada en esta visita (o null). */
export async function abrirArmeria(): Promise<Arma | null> {
  for (;;) {
    const elegida = await mostrar();
    if (!elegida) return null;
    if (elegida.forjada) {
      elegirArma(elegida.arma.id);
      sonido.toque();
      continue;
    }
    const r = elegida.arma.reto;
    if (!r) continue;
    const ok = await abrirTaller(r);
    if (ok) {
      if (!estado.armas.includes(elegida.arma.id)) estado.armas.push(elegida.arma.id);
      elegirArma(elegida.arma.id);
      guardar();
      desbloquear(`arma-${elegida.arma.id}`);
      if (ARMAS.every((a) => a.id === "huaraca" || estado.armas.includes(a.id))) desbloquear("arsenal");
      return elegida.arma;
    }
  }
}

function mostrar(): Promise<{ arma: Arma; forjada: boolean } | null> {
  const c = caja();
  const actual = armaActual().id;
  c.innerHTML = `
    <div class="mision-tarjeta">
      <div class="mision-cabeza"><span class="mision-icono">⚔</span><div><small>WASI DE ARMAS</small><h2>Armería andina</h2></div></div>
      <p class="mision-como">Cada arma se <b>forja con una runa de Python</b>. Toca una forjada para usarla.</p>
      <div class="lista-misiones">
        ${ARMAS.map((a) => {
          const forjada = a.id === "huaraca" || estado.armas.includes(a.id);
          const puede = !forjada && a.disponible();
          return `<button class="fila-mision ${forjada || puede ? "" : "bloqueada"} ${a.id === actual ? "en-uso" : ""}" data-id="${a.id}" ${forjada || puede ? "" : "disabled"}>
            <span class="mision-icono chico">${forjada || puede ? a.icono : "🔒"}</span>
            <span class="fila-texto"><b>${a.nombre}</b><small>${a.como}</small><small class="arma-dato">${a.dato}</small></span>
            <span class="fila-estrellas">${a.id === actual ? "✔ En uso" : forjada ? "Usar" : puede ? "⚒ Forjar" : a.requisito}</span>
          </button>`;
        }).join("")}
      </div>
      <div class="mision-botones"><button class="boton-secundario" id="armeria-cerrar">Cerrar</button></div>
    </div>`;
  c.hidden = false;
  return new Promise((r) => {
    c.querySelectorAll<HTMLButtonElement>(".fila-mision:not(.bloqueada)").forEach((b) =>
      b.addEventListener("click", () => {
        const arma = ARMAS.find((a) => a.id === b.dataset.id)!;
        c.hidden = true;
        r({ arma, forjada: arma.id === "huaraca" || estado.armas.includes(arma.id) });
      })
    );
    c.querySelector("#armeria-cerrar")!.addEventListener("click", () => {
      c.hidden = true;
      r(null);
    });
  });
}
