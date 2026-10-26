// Insignias (logros) y el Simi Qillqa: el cuaderno de palabras quechua, nudos y logros.
// Gamificación sana: todo se gana jugando y aprendiendo. Sin compras ni cajas de botín.

import { estado, guardar } from "../estado";
import { PALABRAS } from "../datos/episodio1";
import { sonido } from "../sonido";
import { FICHAS } from "../datos/valle";

export const LOGROS: Record<string, { icono: string; nombre: string; texto: string }> = {
  prologo: { icono: "🌅", nombre: "Primeras runas", texto: "Aprendiste 4 conceptos en un minuto" },
  ojo: { icono: "👁", nombre: "Primer vistazo", texto: "Abriste el Ojo del Khipukamayuq" },
  fuente: { icono: "💧", nombre: "Guardián del yaku", texto: "Reparaste la fuente con True" },
  techo: { icono: "🏠", nombre: "Pintor de wasis", texto: "Usaste tu primer texto (str)" },
  runa: { icono: "📜", nombre: "Primera runa", texto: "Escribiste Python real en el Taller" },
  nudos: { icono: "✨", nombre: "Ojo atento", texto: "Encontraste los 3 nudos dorados" },
  simi: { icono: "📖", nombre: "Rimaq", texto: "Aprendiste 6 palabras en quechua" },
  episodio1: { icono: "⭐", nombre: "Despertar del Chaski", texto: "Completaste el Episodio 1" },
  ecos: { icono: "👣", nombre: "Eco triple", texto: "Usaste for para estar en 3 lugares" },
  forja: { icono: "⚡", nombre: "Forjador de runas", texto: "Escribiste tu primera función con def" },
  jefe: { icono: "🐛", nombre: "Cazador de Bugs", texto: "Venciste al Bug Ch'aqwa" },
  racha3: { icono: "🔥", nombre: "Constancia andina", texto: "Jugaste 3 días seguidos" },
  valle: { icono: "🏔", nombre: "Guardián del Valle", texto: "Restauraste el Valle Sagrado" },
  episodio2: { icono: "🌿", nombre: "Guardián de la selva", texto: "Completaste el Episodio 2" },
};
export const TOTAL_NUDOS = 3;

const cola: string[] = [];
let mostrando = false;

export function desbloquear(clave: string) {
  if (!LOGROS[clave] || estado.logros.includes(clave)) return;
  estado.logros.push(clave);
  guardar();
  cola.push(clave);
  if (!mostrando) siguiente();
}

function siguiente() {
  const clave = cola.shift();
  const caja = document.getElementById("logro")!;
  if (!clave) {
    mostrando = false;
    return;
  }
  mostrando = true;
  const l = LOGROS[clave];
  caja.innerHTML = `<span class="logro-icono">${l.icono}</span><div><small>¡INSIGNIA DESBLOQUEADA!</small><b>${l.nombre}</b><span>${l.texto}</span></div>`;
  caja.hidden = false;
  caja.classList.remove("entra");
  void caja.offsetWidth;
  caja.classList.add("entra");
  sonido.tesoro();
  window.setTimeout(() => {
    caja.hidden = true;
    siguiente();
  }, 3200);
}

export function abrirSimiQillqa(): Promise<void> {
  const caja = document.getElementById("simi")!;
  const palabras = Object.entries(PALABRAS);
  caja.innerHTML = `
    <div class="tarjeta simi-tarjeta desplazable">
      <button class="cerrar" aria-label="Cerrar">✕</button>
      <h2>📖 Simi Qillqa</h2>
      <p class="simi-sub">Tu cuaderno de viaje</p>
      <h3>Palabras quechua · ${estado.palabras.length}/${palabras.length}</h3>
      <div class="simi-palabras">
        ${palabras
          .map(([p, s]) =>
            estado.palabras.includes(p) ? `<div class="palabra"><b>${p}</b><span>${s}</span></div>` : `<div class="palabra oculta"><b>? ? ?</b><span>Sigue jugando</span></div>`
          )
          .join("")}
      </div>
      <h3>Nudos dorados · ${estado.nudos.length}/${TOTAL_NUDOS}</h3>
      <p class="simi-pista">${estado.nudos.length < TOTAL_NUDOS ? "Pista: solo se ven con el 👁 Ojo abierto. Busca detrás de las casas y cerca de los andenes." : "¡Los encontraste todos!"}</p>
      <h3>🦙 Santuario · ${estado.rescates.length}/${Object.keys(FICHAS).length}</h3>
      <div class="simi-palabras">
        ${Object.entries(FICHAS)
          .map(([k, f]) =>
            estado.rescates.includes(k)
              ? `<div class="palabra"><b>${f.icono} ${f.nombre}</b><span>${f.quechua} · ${f.dato}</span></div>`
              : `<div class="palabra oculta"><b>${f.icono} ? ? ?</b><span>Rescátalo en el Valle Sagrado</span></div>`
          )
          .join("")}
      </div>
      <h3>📜 Libro de runas · ${Object.keys(estado.runas).length}</h3>
      ${
        Object.keys(estado.runas).length
          ? Object.entries(estado.runas)
              .map(([k, codigo]) => `<div class="runa-libro"><b>${k === "rayo" ? "⚡ Runa rayo (función)" : k === "variables" ? "📦 Primera runa (variables)" : k}</b><pre>${codigo.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre></div>`)
              .join("")
          : '<p class="simi-pista">Aquí se guardarán las runas que escribas en el Taller.</p>'
      }
      <h3>Insignias · ${estado.logros.length}/${Object.keys(LOGROS).length}</h3>
      <div class="simi-logros">
        ${Object.entries(LOGROS)
          .map(([k, l]) => `<div class="insignia-item ${estado.logros.includes(k) ? "" : "bloqueada"}"><span>${l.icono}</span><b>${l.nombre}</b><small>${estado.logros.includes(k) ? l.texto : "🔒"}</small></div>`)
          .join("")}
      </div>
    </div>`;
  caja.hidden = false;
  return new Promise((r) =>
    caja.querySelector(".cerrar")!.addEventListener("click", () => {
      caja.hidden = true;
      r();
    })
  );
}
