// Insignias (logros) y el Simi Qillqa: el cuaderno de palabras quechua, nudos y logros.
// Gamificación sana: todo se gana jugando y aprendiendo. Sin compras ni cajas de botín.

import { estado, guardar } from "../estado";
import { PALABRAS } from "../datos/episodio1";
import { sonido } from "../sonido";
import { FICHAS } from "../datos/valle";
import { PROGRAMA, ZONAS } from "../datos/zonas";

export const LOGROS: Record<string, { icono: string; nombre: string; texto: string }> = {
  prologo: { icono: "🌅", nombre: "Primeras runas", texto: "Aprendiste 4 conceptos en un minuto" },
  "mision-oro": { icono: "🌞", nombre: "El oro vuelve al Inti", texto: "Recuperaste el oro del Qorikancha con for y listas" },
  "mision-vicuna": { icono: "🦙", nombre: "Guardián de la vicuña", texto: "Protegiste a las vicuñas con if y while" },
  "mision-chullachaqui": { icono: "🌳", nombre: "Amigo del Chullachaqui", texto: "Cuidaste la selva con if/else y funciones" },
  "tres-estrellas": { icono: "⭐", nombre: "Runa perfecta", texto: "Ganaste una misión con 3 estrellas" },
  defensa: { icono: "🛡", nombre: "Defensor del yaku", texto: "Salvaste la fuente de la oleada de mini-Bugs" },
  vecinos: { icono: "🫧", nombre: "Rescatista", texto: "Liberaste a todas las llamas de sus burbujas" },
  wawa: { icono: "🐛", nombre: "Primer jefe", texto: "Venciste al Ch'aqwa Wawa con runas y huaraca" },
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
  // Si está la pantalla de ¡Nuevo nivel!, la insignia espera su turno (no tapa el título)
  if (!document.getElementById("nivel")!.hidden || !document.getElementById("mision-ui")!.hidden) {
    cola.unshift(clave);
    window.setTimeout(siguiente, 800);
    return;
  }
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
      <h3>🎓 Mi programa · ${Object.keys(estado.sellos).length}/${PROGRAMA.reduce((n, p) => n + p.modulos.length, 0)} módulos</h3>
      <p class="simi-pista">🥉 Reconoce · 🥈 Aplica (sin ver la solución) · 🥇 Domina (también resolvió el bug al primer intento)</p>
      ${PROGRAMA.map(
        (p) => `<div class="programa-nivel"><b>${p.nivel}</b>${p.modulos
          .map((m) => {
            const s = estado.sellos[m] ?? 0;
            return `<span class="modulo ${s ? "ganado" : ""}">${["⬜", "🥉", "🥈", "🥇"][s]} ${m}</span>`;
          })
          .join("")}</div>`
      ).join("")}
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
      <h3>🦙 Santuario · ${estado.rescates.length + ZONAS.reduce((n, z) => n + (estado.zonas[z.id]?.length ?? 0), 0)}/${Object.keys(FICHAS).length + ZONAS.reduce((n, z) => n + z.sitios.length, 0)}</h3>
      <div class="simi-palabras">
        ${Object.entries(FICHAS)
          .map(([k, f]) =>
            estado.rescates.includes(k)
              ? `<div class="palabra"><b>${f.icono} ${f.nombre}</b><span>${f.quechua} · ${f.dato}</span></div>`
              : `<div class="palabra oculta"><b>${f.icono} ? ? ?</b><span>Rescátalo en el Valle Sagrado</span></div>`
          )
          .join("")}
        ${ZONAS.flatMap((z) =>
          z.sitios.map((s) =>
            estado.zonas[z.id]?.includes(s.id)
              ? `<div class="palabra"><b>${s.ficha.icono} ${s.ficha.nombre}</b><span>${s.ficha.dato}</span></div>`
              : `<div class="palabra oculta"><b>${s.ficha.icono} ? ? ?</b><span>Zona ${z.numero}: ${z.nombre}</span></div>`
          )
        ).join("")}
      </div>
      <h3>📜 Libro de runas · ${Object.keys(estado.runas).length}</h3>
      ${
        Object.keys(estado.runas).length
          ? Object.entries(estado.runas)
              .map(([k, codigo]) => `<div class="runa-libro"><b>${k === "rayo" ? "⚡ Runa rayo (función)" : k === "variables" ? "📦 Primera runa (variables)" : `📜 Runa ${k}`}</b><pre>${codigo.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre></div>`)
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
