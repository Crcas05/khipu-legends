// Pantallas del menú principal: HISTORIA (capítulos del viaje) y MI PROGRESO (nivel, habilidades y logros).

import { estado, yaPaso, type Paso } from "../estado";
import { sonido } from "../sonido";
import { retrato } from "./retratos";
import { LOGROS, abrirSimiQillqa } from "./logros";
import { ZONAS, PROGRAMA } from "../datos/zonas";
import { zonaCompleta } from "../zonaJuego";

const llego = (p: Paso) => estado.paso === p || yaPaso(p);

type Estado = "hecho" | "ahora" | "bloqueado";

function capitulos(): { icono: string; titulo: string; tema: string; texto: string; estado: Estado }[] {
  const lista: { icono: string; titulo: string; tema: string; texto: string; hecho: boolean }[] = [
    { icono: "🌅", titulo: "Prólogo: Primeras runas", tema: "Variables, textos, números y True/False", texto: "El Bug Ch'aqwa ataca y Chaski descubre que el mundo está hecho de código.", hecho: yaPaso("prologo") },
    { icono: "🏘", titulo: "Episodio 1: El pueblo de Qhapaq", tema: "Variables y print()", texto: "Defiendes la fuente de los mini-Bugs, liberas a Mama Khipu y vences al Ch'aqwa Wawa.", hecho: llego("completo") },
    { icono: "🌿", titulo: "Episodio 2: Ecos de la selva", tema: "Bucle for", texto: "Con Amaru cruzas el río y enfrentas al Bug Ch'aqwa en su guarida.", hecho: llego("completo2") },
    { icono: "🏔", titulo: "Zona 1: Valle Sagrado", tema: "Python básico en acción", texto: "Rescatas vicuñas, cóndores y queñuas del valle del Cusco.", hecho: llego("completo3") },
    ...ZONAS.map((z) => ({ icono: z.sitios[0]?.icono ?? "📍", titulo: `Zona ${z.numero}: ${z.nombre}`, tema: z.temas, texto: `${z.lugar} · ${z.cultura} · ${z.sitios.length} altares y un jefe.`, hecho: zonaCompleta(z) })),
  ];
  let actual = false;
  return lista.map((c) => {
    if (c.hecho) return { ...c, estado: "hecho" as Estado };
    if (!actual) {
      actual = true;
      return { ...c, estado: "ahora" as Estado };
    }
    return { ...c, estado: "bloqueado" as Estado };
  });
}

function mostrar(html: string): Promise<void> {
  const caja = document.getElementById("seleccion")!;
  caja.innerHTML = html;
  caja.hidden = false;
  return new Promise((r) => {
    caja.querySelector("#volver-menu")!.addEventListener("click", () => {
      sonido.toque();
      caja.hidden = true;
      r();
    });
  });
}

export function abrirHistoria(): Promise<void> {
  const caps = capitulos();
  return mostrar(`
    <div class="pantalla-menu">
      <header class="pantalla-cabeza"><h2>📜 HISTORIA</h2><button class="boton-secundario" id="volver-menu">◂ VOLVER</button></header>
      <p class="historia-intro">El Bug Ch'aqwa desordenó los khipus del Perú. Tú eres <b>Chaski</b>, el mensajero más veloz de los Andes, y tu poder es el <b>código</b>. Recorre el país, rescata a su gente y aprende Python y SQL en el camino.</p>
      <ol class="capitulos">
        ${caps
          .map(
            (c) => `<li class="capitulo ${c.estado}">
              <span class="cap-icono">${c.estado === "bloqueado" ? "🔒" : c.icono}</span>
              <div><b>${c.titulo}</b><small>${c.tema}</small>${c.estado !== "bloqueado" ? `<p>${c.texto}</p>` : ""}</div>
              <span class="cap-estado">${c.estado === "hecho" ? "✔ Completado" : c.estado === "ahora" ? "▶ En curso" : "Bloqueado"}</span>
            </li>`
          )
          .join("")}
      </ol>
    </div>`);
}

/** Las 8 habilidades del panel (como en la referencia): se iluminan con los sellos del programa. */
const HABILIDADES: { icono: string; nombre: string; modulos: (m: string) => boolean }[] = [
  { icono: "📦", nombre: "Variables", modulos: (m) => m.startsWith("B1") },
  { icono: "🔀", nombre: "Condicionales", modulos: (m) => m.startsWith("B5") },
  { icono: "🔁", nombre: "Bucles", modulos: (m) => m.startsWith("B6") || m.startsWith("B7") },
  { icono: "🧩", nombre: "Funciones", modulos: (m) => m.startsWith("I1") || m.startsWith("I6") },
  { icono: "📋", nombre: "Listas", modulos: (m) => m.startsWith("B8") },
  { icono: "🗂", nombre: "Diccionarios", modulos: (m) => m.startsWith("I2") },
  { icono: "🗄", nombre: "SQL", modulos: (m) => /^(DQL|DDL|DML|TCL|DCL)/.test(m) },
  { icono: "🏆", nombre: "Proyecto final", modulos: (m) => m.includes("Proyecto final") },
];

export function abrirProgreso(): Promise<void> {
  const todos = PROGRAMA.flatMap((n) => n.modulos);
  const hechos = todos.filter((m) => (estado.sellos[m] ?? 0) > 0).length;
  const pct = Math.round((hechos / todos.length) * 100);
  const habilidades = HABILIDADES.map((h) => {
    const mods = todos.filter(h.modulos);
    const max = Math.max(0, ...mods.map((m) => estado.sellos[m] ?? 0));
    const estadoH = max >= 2 ? "hecho" : max >= 1 ? "ahora" : "bloqueado";
    return `<div class="hab ${estadoH}" title="${mods.join(" · ")}"><span>${estadoH === "bloqueado" ? "🔒" : h.icono}</span><small>${h.nombre}</small></div>`;
  }).join("");
  const claves = Object.keys(LOGROS);
  const ordenados = [...claves.filter((k) => estado.logros.includes(k)).reverse(), ...claves.filter((k) => !estado.logros.includes(k))];
  const logros = ordenados
    .slice(0, 8)
    .map((k) => {
      const l = LOGROS[k];
      const ok = estado.logros.includes(k);
      return `<li class="logro-fila ${ok ? "hecho" : "bloqueado"}"><span class="medalla">${ok ? l.icono : "🔒"}</span><div><b>${l.nombre}</b><small>${ok ? "Completado" : "Bloqueado"}</small></div></li>`;
    })
    .join("");
  const p = mostrar(`
    <div class="pantalla-menu">
      <header class="pantalla-cabeza"><h2>🏆 MI PROGRESO</h2><button class="boton-secundario" id="volver-menu">◂ VOLVER</button></header>
      <div class="progreso-cuerpo">
        <section>
          <div class="progreso-perfil">
            ${retrato(estado.heroe || "chaski", 72)}
            <div>
              <b class="progreso-nivel">${estado.nombre || "Chaski"} · Nivel ${estado.nivel}</b>
              <div class="barra-xp"><i style="width:${pct}%"></i><span>${hechos} / ${todos.length} módulos</span></div>
              <small>⚡ ${estado.kallpa} kallpa · 📖 ${estado.palabras.length} palabras quechua · 🔥 racha ${estado.racha}</small>
            </div>
          </div>
          <h3>Habilidades</h3>
          <div class="hab-grilla">${habilidades}</div>
        </section>
        <section>
          <h3>Logros <small>${estado.logros.length}/${claves.length}</small></h3>
          <ul class="logros-lista">${logros}</ul>
          <button class="boton-secundario" id="ver-simi">📖 Ver todo (Simi Qillqa)</button>
        </section>
      </div>
    </div>`);
  document.getElementById("ver-simi")?.addEventListener("click", async () => {
    sonido.toque();
    document.getElementById("seleccion")!.hidden = true;
    await abrirSimiQillqa();
    document.getElementById("seleccion")!.hidden = false;
  });
  return p;
}
