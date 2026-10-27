// El mapa del viaje por el Perú: 10 zonas unidas por el Qhapaq Ñan.
// Fondo provisional dibujado (costa, sierra, selva); si existe arte/mapa-peru.jpg, se usa.

import { ZONAS, ZONA_VALLE } from "../datos/zonas";
import { estado, yaPaso } from "../estado";
import { sonido } from "../sonido";

type Nodo = { id: string; numero: number; nombre: string; lugar: string; region: string; cultura: string; temas: string; mapa: [number, number] };

const NODOS: Nodo[] = [ZONA_VALLE, ...ZONAS];

export function zonaHecha(id: string): boolean {
  if (id === "valle") return yaPaso("valle");
  const z = ZONAS.find((x) => x.id === id);
  if (!z) return false;
  const hechos = estado.zonas[id] ?? [];
  return z.sitios.every((s) => hechos.includes(s.id)) && estado.jefes.includes(id);
}

export function zonaAbierta(i: number): boolean {
  if (i === 0) return yaPaso("victoria");
  return zonaHecha(NODOS[i - 1].id);
}

const FONDO_SVG = `
<svg class="mapa-fondo" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
  <defs>
    <linearGradient id="g-costa" x1="0" x2="1"><stop offset="0" stop-color="#e9d3a2"/><stop offset="1" stop-color="#dcc08a"/></linearGradient>
    <linearGradient id="g-sierra" x1="0" x2="1"><stop offset="0" stop-color="#b9a47a"/><stop offset="1" stop-color="#8fa36a"/></linearGradient>
    <linearGradient id="g-selva" x1="0" x2="1"><stop offset="0" stop-color="#5f9a4a"/><stop offset="1" stop-color="#3f7f3a"/></linearGradient>
  </defs>
  <rect width="100" height="100" fill="#3a78b8"/>
  <path d="M8,0 L100,0 L100,100 L62,100 Q40,80 30,62 Q18,40 8,0 Z" fill="url(#g-costa)"/>
  <path d="M22,0 L100,0 L100,100 L74,100 Q56,82 46,64 Q34,40 22,0 Z" fill="url(#g-sierra)"/>
  <path d="M44,0 L100,0 L100,100 L88,100 Q72,70 62,50 Q52,26 44,0 Z" fill="url(#g-selva)"/>
  <ellipse cx="82" cy="88" rx="6" ry="3.4" fill="#3a8fd0"/>
  <path d="M70,10 Q66,30 64,44 Q62,60 70,74" stroke="#4a9ad6" stroke-width="1.2" fill="none" opacity=".8"/>
  <path d="M52,8 Q58,20 66,26" stroke="#4a9ad6" stroke-width="1" fill="none" opacity=".7"/>
  <text x="14" y="94" class="region">COSTA</text>
  <text x="44" y="94" class="region">SIERRA</text>
  <text x="80" y="20" class="region">SELVA</text>
</svg>`;

export function abrirMapa(): Promise<string | null> {
  const caja = document.getElementById("mapa-peru")!;
  const hechas = NODOS.filter((n) => zonaHecha(n.id)).length;
  const camino = NODOS.map((n) => `${n.mapa[0]},${n.mapa[1]}`).join(" ");
  caja.innerHTML = `
    <div class="mapa-marco">
      <header class="mapa-cabecera">
        <div><h2>🗺 El viaje del Chaski</h2><p>Recorre el Perú y aprende Python y SQL · <b>${hechas}/10</b> zonas</p></div>
        <button class="cerrar" aria-label="Cerrar">✕</button>
      </header>
      <div class="mapa-cuerpo">
        <div class="mapa-lienzo">
          ${FONDO_SVG}
          <img class="mapa-arte" src="${import.meta.env.BASE_URL}arte/mapa-peru.jpg" alt="" onerror="this.remove()">
          <svg class="mapa-camino" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points="${camino}" /></svg>
          ${NODOS.map((n, i) => {
            const abierta = zonaAbierta(i);
            const hecha = zonaHecha(n.id);
            const actual = abierta && !hecha;
            return `<button class="mapa-nodo ${hecha ? "hecha" : ""} ${actual ? "actual" : ""} ${abierta ? "" : "bloqueada"}" data-i="${i}" style="left:${n.mapa[0]}%;top:${n.mapa[1]}%">
              <span class="num">${hecha ? "✓" : abierta ? n.numero : "🔒"}</span><span class="nombre">${n.nombre}</span></button>`;
          }).join("")}
        </div>
        <aside class="mapa-detalle" id="mapa-detalle"><p class="gris">Toca una zona del mapa.</p></aside>
      </div>
    </div>`;
  caja.hidden = false;
  return new Promise((resolver) => {
    const cerrar = (v: string | null) => {
      caja.hidden = true;
      caja.innerHTML = "";
      resolver(v);
    };
    caja.querySelector(".cerrar")!.addEventListener("click", () => cerrar(null));
    const detalle = caja.querySelector<HTMLElement>("#mapa-detalle")!;
    const mostrar = (i: number) => {
      const n = NODOS[i];
      const abierta = zonaAbierta(i);
      caja.querySelectorAll(".mapa-nodo").forEach((b) => b.classList.toggle("elegida", (b as HTMLElement).dataset.i === String(i)));
      detalle.innerHTML = `
        <p class="nota">ZONA ${n.numero} · ${n.region.toUpperCase()} · ${n.lugar}</p>
        <h3>${n.nombre}</h3>
        <p class="mapa-cultura">🌄 ${n.cultura}</p>
        <p class="mapa-temas">📘 ${n.temas}</p>
        ${
          abierta
            ? `<button class="boton-oro" id="mapa-ir">${zonaHecha(n.id) ? "↺ Volver a visitar" : "▶ Viajar aquí"}</button>`
            : `<p class="bloqueo">🔒 Completa la zona ${n.numero - 1} para abrirla.</p>`
        }`;
      detalle.querySelector("#mapa-ir")?.addEventListener("click", () => {
        sonido.toque();
        cerrar(n.id);
      });
    };
    caja.querySelectorAll<HTMLButtonElement>(".mapa-nodo").forEach((b) =>
      b.addEventListener("click", () => {
        sonido.toque();
        mostrar(Number(b.dataset.i));
      })
    );
    const actual = NODOS.findIndex((_, i) => zonaAbierta(i) && !zonaHecha(NODOS[i].id));
    mostrar(actual >= 0 ? actual : 0);
  });
}
