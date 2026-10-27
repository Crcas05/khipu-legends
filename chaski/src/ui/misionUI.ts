// Tarjeta de misión (antes de aceptar) y pantalla de resultado (estrellas, recompensa y ficha cultural).
import type { Mision } from "../datos/misiones";
import { retrato } from "./retratos";
import { estado } from "../estado";
import { sonido } from "../sonido";

function caja() {
  return document.getElementById("mision-ui")!;
}

const estrellas = (n: number) => `${"⭐".repeat(n)}${"☆".repeat(3 - n)}`;

export function tarjetaMision(m: Mision): Promise<boolean> {
  const c = caja();
  const mejor = estado.misiones[m.id] ?? 0;
  c.innerHTML = `
    <div class="mision-tarjeta">
      <div class="mision-cabeza">
        <span class="mision-icono">${m.icono}</span>
        <div><small>MISIÓN ${m.numero} · ${m.lugar.toUpperCase()}</small><h2>${m.nombre}</h2></div>
        <span class="mision-quien">${retrato(m.quien, 54)}</span>
      </div>
      <div class="mision-datos">
        <p><b>⚠ Amenaza:</b> ${m.amenaza}</p>
        <p><b>📘 Aprendes:</b> ${m.aprendes}</p>
        <p><b>🎁 Recompensa:</b> ⚡ ${m.recompensa} kallpa + insignia</p>
        <p><b>Dificultad:</b> ${"🔥".repeat(m.dificultad)}${"·".repeat(3 - m.dificultad)} &nbsp; <b>Tu récord:</b> ${mejor ? estrellas(mejor) : "—"}</p>
      </div>
      <p class="mision-como">Explora, pelea con tu 🎯 huaraca y vence al jefe en un <b>Duelo de runas</b>: ¡tu código mueve a Chaski!</p>
      <div class="mision-botones">
        <button class="boton-secundario" id="mision-luego">Más tarde</button>
        <button class="boton-oro" id="mision-aceptar">⚔ ACEPTAR MISIÓN</button>
      </div>
    </div>`;
  c.hidden = false;
  sonido.pututu();
  return new Promise((r) => {
    c.querySelector("#mision-aceptar")!.addEventListener("click", () => {
      sonido.toque();
      c.hidden = true;
      r(true);
    });
    c.querySelector("#mision-luego")!.addEventListener("click", () => {
      sonido.toque();
      c.hidden = true;
      r(false);
    });
  });
}

export function resultadoMision(m: Mision, n: number, errores: number, golpes: number): Promise<"pueblo" | "repetir"> {
  const c = caja();
  c.innerHTML = `
    <div class="mision-tarjeta resultado">
      <div class="rayos"></div>
      <h2 class="nivel-titulo nivel-banda">¡MISIÓN CUMPLIDA!</h2>
      <p class="mision-estrellas">${estrellas(n)}</p>
      <p class="mision-detalle">${n === 3 ? "¡Runas perfectas: sin errores y sin recibir golpes!" : `Errores: ${errores} · Golpes recibidos: ${golpes}${n < 3 ? " — repítela para sacar ⭐⭐⭐" : ""}`}</p>
      <p class="mision-premio">⚡ +${m.recompensa} kallpa</p>
      <div class="ficha"><b>${m.ficha.icono} ${m.ficha.nombre}</b><p>${m.ficha.dato}</p></div>
      <div class="mision-botones">
        <button class="boton-secundario" id="mision-repetir">↺ Repetir</button>
        <button class="boton-oro" id="mision-volver">🏘 Volver al pueblo</button>
      </div>
    </div>`;
  c.hidden = false;
  sonido.nivel();
  return new Promise((r) => {
    c.querySelector("#mision-volver")!.addEventListener("click", () => {
      c.hidden = true;
      r("pueblo");
    });
    c.querySelector("#mision-repetir")!.addEventListener("click", () => {
      c.hidden = true;
      r("repetir");
    });
  });
}

/** Lista de misiones (las abiertas se pueden jugar o repetir). */
export function listaMisiones(lista: Mision[]): Promise<Mision | null> {
  const c = caja();
  const abierta = (m: Mision) => m.numero === 1 || !!estado.misiones[lista.find((x) => x.numero === m.numero - 1)?.id ?? ""];
  c.innerHTML = `
    <div class="mision-tarjeta">
      <div class="mision-cabeza"><span class="mision-icono">📜</span><div><small>EL VIAJE DEL CHASKI</small><h2>Misiones</h2></div></div>
      <div class="lista-misiones">
        ${lista
          .map((m) => {
            const ok = abierta(m);
            const n = estado.misiones[m.id] ?? 0;
            return `<button class="fila-mision ${ok ? "" : "bloqueada"}" data-id="${m.id}" ${ok ? "" : "disabled"}>
              <span class="mision-icono chico">${ok ? m.icono : "🔒"}</span>
              <span class="fila-texto"><b>${m.numero}. ${m.nombre}</b><small>${m.lugar} · ${m.aprendes}</small></span>
              <span class="fila-estrellas">${n ? estrellas(n) : ok ? "¡Nueva!" : ""}</span>
            </button>`;
          })
          .join("")}
      </div>
      <div class="mision-botones"><button class="boton-secundario" id="mision-cerrar">Cerrar</button></div>
    </div>`;
  c.hidden = false;
  return new Promise((r) => {
    c.querySelectorAll<HTMLButtonElement>(".fila-mision:not(.bloqueada)").forEach((b) =>
      b.addEventListener("click", () => {
        sonido.toque();
        c.hidden = true;
        r(lista.find((m) => m.id === b.dataset.id) ?? null);
      })
    );
    c.querySelector("#mision-cerrar")!.addEventListener("click", () => {
      c.hidden = true;
      r(null);
    });
  });
}
