// El mapa del viaje por el Perú: 10 zonas unidas por el Qhapaq Ñan.
// Fondo provisional dibujado (costa, sierra, selva); si existe arte/mapa-peru.jpg, se usa.

import { ZONAS, ZONA_VALLE } from "../datos/zonas";
import { estado, yaPaso } from "../estado";
import { sonido } from "../sonido";
import { MISIONES } from "../datos/misiones";

/** Dónde está cada misión en el mapa (%), según su lugar real. */
const POS_MISION: Record<string, [number, number]> = { mullu: [16, 17], oro: [62, 74], vicuna: [52, 77], chullachaqui: [74, 46] };
const misionAbierta = (numero: number) => {
  const anterior = MISIONES.find((x) => x.numero === numero - 1);
  return !anterior || !!estado.misiones[anterior.id];
};

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
  <path d="M4 20 q1.5 -1.5 3 0 q1.5 1.5 3 0" stroke="#bfe3ff" stroke-width=".5" fill="none" opacity=".8"/>
  <path d="M6 45 q1.5 -1.5 3 0 q1.5 1.5 3 0" stroke="#bfe3ff" stroke-width=".5" fill="none" opacity=".8"/>
  <path d="M10 70 q1.5 -1.5 3 0 q1.5 1.5 3 0" stroke="#bfe3ff" stroke-width=".5" fill="none" opacity=".8"/>
  <path d="M18 88 q1.5 -1.5 3 0 q1.5 1.5 3 0" stroke="#bfe3ff" stroke-width=".5" fill="none" opacity=".8"/>
  <path d="M3 90 q1.5 -1.5 3 0 q1.5 1.5 3 0" stroke="#bfe3ff" stroke-width=".5" fill="none" opacity=".8"/>
  <path d="M12 30 q1.5 -1.5 3 0 q1.5 1.5 3 0" stroke="#bfe3ff" stroke-width=".5" fill="none" opacity=".8"/>
  <path d="M26 95 q1.5 -1.5 3 0 q1.5 1.5 3 0" stroke="#bfe3ff" stroke-width=".5" fill="none" opacity=".8"/>
  <path d="M23.7 9.5 L26.7 4.0 L29.7 9.5 Z" fill="#8a7a5a" stroke="#5e5238" stroke-width=".3"/><path d="M25.7 5.8 L26.7 4.0 L27.7 5.8 Z" fill="#fff"/>
  <path d="M27.2 15.6 L30.2 10.1 L33.2 15.6 Z" fill="#8a7a5a" stroke="#5e5238" stroke-width=".3"/><path d="M29.2 11.9 L30.2 10.1 L31.2 11.9 Z" fill="#fff"/>
  <path d="M29.2 20.9 L32.2 15.4 L35.2 20.9 Z" fill="#8a7a5a" stroke="#5e5238" stroke-width=".3"/><path d="M31.2 17.2 L32.2 15.4 L33.2 17.2 Z" fill="#fff"/>
  <path d="M27.4 24.4 L30.4 18.9 L33.4 24.4 Z" fill="#8a7a5a" stroke="#5e5238" stroke-width=".3"/><path d="M29.4 20.7 L30.4 18.9 L31.4 20.7 Z" fill="#fff"/>
  <path d="M35.3 30.4 L38.3 24.9 L41.3 30.4 Z" fill="#8a7a5a" stroke="#5e5238" stroke-width=".3"/><path d="M37.3 26.7 L38.3 24.9 L39.3 26.7 Z" fill="#fff"/>
  <path d="M37.4 33.6 L40.4 28.1 L43.4 33.6 Z" fill="#8a7a5a" stroke="#5e5238" stroke-width=".3"/><path d="M39.4 29.9 L40.4 28.1 L41.4 29.9 Z" fill="#fff"/>
  <path d="M37.2 39.5 L40.2 34.0 L43.2 39.5 Z" fill="#8a7a5a" stroke="#5e5238" stroke-width=".3"/><path d="M39.2 35.8 L40.2 34.0 L41.2 35.8 Z" fill="#fff"/>
  <path d="M40.1 46.1 L43.1 40.6 L46.1 46.1 Z" fill="#8a7a5a" stroke="#5e5238" stroke-width=".3"/><path d="M42.1 42.4 L43.1 40.6 L44.1 42.4 Z" fill="#fff"/>
  <path d="M39.3 50.0 L42.3 44.5 L45.3 50.0 Z" fill="#8a7a5a" stroke="#5e5238" stroke-width=".3"/><path d="M41.3 46.3 L42.3 44.5 L43.3 46.3 Z" fill="#fff"/>
  <path d="M43.3 58.2 L46.3 52.7 L49.3 58.2 Z" fill="#8a7a5a" stroke="#5e5238" stroke-width=".3"/><path d="M45.3 54.5 L46.3 52.7 L47.3 54.5 Z" fill="#fff"/>
  <path d="M48.6 60.5 L51.6 55.0 L54.6 60.5 Z" fill="#8a7a5a" stroke="#5e5238" stroke-width=".3"/><path d="M50.6 56.8 L51.6 55.0 L52.6 56.8 Z" fill="#fff"/>
  <path d="M51.2 65.7 L54.2 60.2 L57.2 65.7 Z" fill="#8a7a5a" stroke="#5e5238" stroke-width=".3"/><path d="M53.2 62.0 L54.2 60.2 L55.2 62.0 Z" fill="#fff"/>
  <path d="M52.5 71.0 L55.5 65.5 L58.5 71.0 Z" fill="#8a7a5a" stroke="#5e5238" stroke-width=".3"/><path d="M54.5 67.3 L55.5 65.5 L56.5 67.3 Z" fill="#fff"/>
  <path d="M51.2 79.3 L54.2 73.8 L57.2 79.3 Z" fill="#8a7a5a" stroke="#5e5238" stroke-width=".3"/><path d="M53.2 75.6 L54.2 73.8 L55.2 75.6 Z" fill="#fff"/>
  <path d="M54.9 82.0 L57.9 76.5 L60.9 82.0 Z" fill="#8a7a5a" stroke="#5e5238" stroke-width=".3"/><path d="M56.9 78.3 L57.9 76.5 L58.9 78.3 Z" fill="#fff"/>
  <path d="M61.9 90.0 L64.9 84.5 L67.9 90.0 Z" fill="#8a7a5a" stroke="#5e5238" stroke-width=".3"/><path d="M63.9 86.3 L64.9 84.5 L65.9 86.3 Z" fill="#fff"/>
  <circle cx="79.0" cy="55.5" r="1.6" fill="#2f6e33"/><circle cx="78.5" cy="54.9" r=".8" fill="#4f9a4a"/>
  <circle cx="94.7" cy="56.5" r="2.2" fill="#2f6e33"/><circle cx="94.2" cy="55.9" r=".8" fill="#4f9a4a"/>
  <circle cx="92.9" cy="26.7" r="1.7" fill="#2f6e33"/><circle cx="92.4" cy="26.1" r=".8" fill="#4f9a4a"/>
  <circle cx="64.5" cy="15.1" r="1.5" fill="#2f6e33"/><circle cx="64.0" cy="14.5" r=".8" fill="#4f9a4a"/>
  <circle cx="69.8" cy="49.8" r="1.4" fill="#2f6e33"/><circle cx="69.3" cy="49.2" r=".8" fill="#4f9a4a"/>
  <circle cx="84.4" cy="29.7" r="1.6" fill="#2f6e33"/><circle cx="83.9" cy="29.1" r=".8" fill="#4f9a4a"/>
  <circle cx="89.9" cy="40.5" r="1.7" fill="#2f6e33"/><circle cx="89.4" cy="39.9" r=".8" fill="#4f9a4a"/>
  <circle cx="76.8" cy="57.6" r="1.4" fill="#2f6e33"/><circle cx="76.3" cy="57.0" r=".8" fill="#4f9a4a"/>
  <circle cx="96.0" cy="5.7" r="2.0" fill="#2f6e33"/><circle cx="95.5" cy="5.1" r=".8" fill="#4f9a4a"/>
  <circle cx="91.0" cy="5.4" r="2.0" fill="#2f6e33"/><circle cx="90.5" cy="4.8" r=".8" fill="#4f9a4a"/>
  <circle cx="72.3" cy="48.0" r="1.4" fill="#2f6e33"/><circle cx="71.8" cy="47.4" r=".8" fill="#4f9a4a"/>
  <circle cx="59.8" cy="17.7" r="2.2" fill="#2f6e33"/><circle cx="59.3" cy="17.1" r=".8" fill="#4f9a4a"/>
  <circle cx="94.3" cy="75.6" r="1.7" fill="#2f6e33"/><circle cx="93.8" cy="75.0" r=".8" fill="#4f9a4a"/>
  <circle cx="71.8" cy="43.9" r="2.0" fill="#2f6e33"/><circle cx="71.3" cy="43.3" r=".8" fill="#4f9a4a"/>
  <circle cx="89.1" cy="69.3" r="1.4" fill="#2f6e33"/><circle cx="88.6" cy="68.7" r=".8" fill="#4f9a4a"/>
  <circle cx="94.9" cy="10.9" r="1.7" fill="#2f6e33"/><circle cx="94.4" cy="10.3" r=".8" fill="#4f9a4a"/>
  <circle cx="81.8" cy="73.8" r="1.7" fill="#2f6e33"/><circle cx="81.3" cy="73.2" r=".8" fill="#4f9a4a"/>
  <circle cx="94.0" cy="45.4" r="1.6" fill="#2f6e33"/><circle cx="93.5" cy="44.8" r=".8" fill="#4f9a4a"/>
  <circle cx="70.4" cy="17.5" r="1.5" fill="#2f6e33"/><circle cx="69.9" cy="16.9" r=".8" fill="#4f9a4a"/>
  <circle cx="96.9" cy="16.3" r="1.4" fill="#2f6e33"/><circle cx="96.4" cy="15.7" r=".8" fill="#4f9a4a"/>
  <circle cx="96.5" cy="44.5" r="1.7" fill="#2f6e33"/><circle cx="96.0" cy="43.9" r=".8" fill="#4f9a4a"/>
  <circle cx="67.3" cy="49.1" r="2.1" fill="#2f6e33"/><circle cx="66.8" cy="48.5" r=".8" fill="#4f9a4a"/>
  <path d="M16 30 q2 -2 4 0" stroke="#c9a96a" stroke-width=".6" fill="none"/>
  <path d="M22 55 q2 -2 4 0" stroke="#c9a96a" stroke-width=".6" fill="none"/>
  <path d="M30 75 q2 -2 4 0" stroke="#c9a96a" stroke-width=".6" fill="none"/>
  <path d="M13 12 q2 -2 4 0" stroke="#c9a96a" stroke-width=".6" fill="none"/>
  <g transform="translate(92 8)"><circle r="3.2" fill="#ffd166" stroke="#c98a12" stroke-width=".5"/></g>
  <text x="14" y="94" class="region">COSTA</text>
  <text x="44" y="94" class="region">SIERRA</text>
  <text x="80" y="20" class="region">SELVA</text>
</svg>`;

export function abrirMapa(): Promise<string | null> {
  const caja = document.getElementById("mapa-peru")!;
  const hechas = NODOS.filter((n) => zonaHecha(n.id)).length;
  const misionesHechas = MISIONES.filter((m) => estado.misiones[m.id]).length;
  const camino = NODOS.map((n) => `${n.mapa[0]},${n.mapa[1]}`).join(" ");
  caja.innerHTML = `
    <div class="mapa-marco">
      <header class="mapa-cabecera">
        <div><h2>🗺 MAPA DEL VIAJE</h2><p>Recorre el Perú: costa, sierra y selva · <b>${hechas}/10</b> zonas · <b>${misionesHechas}/${MISIONES.length}</b> misiones</p></div>
        <button class="boton-secundario mapa-pueblo" id="mapa-pueblo">🏘 Pueblo · Misiones</button>
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
              <span class="num">${hecha ? "✓" : abierta ? n.numero : "🔒"}</span><span class="nombre">${n.numero}. ${n.nombre}<small>${n.temas.split("·").slice(0, 2).join("·").replace(/🏆/g, "").trim()}</small></span></button>`;
          }).join("")}
          ${MISIONES.map((m) => {
            const [x, y] = POS_MISION[m.id] ?? [50, 50];
            const hecha = !!estado.misiones[m.id];
            const abierta = misionAbierta(m.numero);
            return `<button class="mapa-mision ${hecha ? "hecha" : ""} ${abierta ? "" : "bloqueada"}" data-m="${m.id}" style="left:${x}%;top:${y}%" title="Misión ${m.numero}: ${m.nombre}"><span>${hecha ? "✓" : abierta ? m.icono : "🔒"}</span></button>`;
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
    caja.querySelector("#mapa-pueblo")!.addEventListener("click", () => {
      sonido.toque();
      cerrar("pueblo");
    });
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
    caja.querySelectorAll<HTMLButtonElement>(".mapa-mision").forEach((b) =>
      b.addEventListener("click", () => {
        sonido.toque();
        const m = MISIONES.find((x) => x.id === b.dataset.m)!;
        const abierta = misionAbierta(m.numero);
        const estrellas = estado.misiones[m.id] ?? 0;
        caja.querySelectorAll(".mapa-nodo, .mapa-mision").forEach((n) => n.classList.remove("elegida"));
        b.classList.add("elegida");
        detalle.innerHTML = `
          <p class="nota">MISIÓN ${m.numero} · ${m.lugar.toUpperCase()}</p>
          <h3>${m.icono} ${m.nombre}</h3>
          <p class="mapa-cultura">⚠ ${m.amenaza}</p>
          <p class="mapa-temas">📘 ${m.aprendes}</p>
          ${estrellas ? `<p class="mapa-cultura">${"⭐".repeat(estrellas)}${"☆".repeat(3 - estrellas)}</p>` : ""}
          ${
            abierta
              ? `<button class="boton-oro" id="mapa-ir">${estrellas ? "↺ Repetir misión" : "▶ Ir a la misión"}</button>`
              : `<p class="bloqueo">🔒 Primero termina la misión ${m.numero - 1}.</p>`
          }`;
        detalle.querySelector("#mapa-ir")?.addEventListener("click", () => {
          sonido.toque();
          cerrar(`mision:${m.id}`);
        });
      })
    );
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
