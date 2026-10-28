// Khipu de la fauna: liberar animales con Python, anotarlos con SQL y consultarlos (SELECT, WHERE,
// COUNT, ORDER BY y SQLAlchemy). Aprendes fauna real del Perú mientras practicas bases de datos.

import { FAUNA, ficha, retoLiberar, retoRegistrar, consultasFauna, type FichaFauna } from "../datos/fauna";
import { estado, guardar } from "../estado";
import { sonido } from "../sonido";
import { abrirTaller } from "./taller";
import { ganarKallpa } from "./hud";

function caja() {
  return document.getElementById("mision-ui")!;
}

const fichaHtml = (f: FichaFauna) => `
  <div class="ficha-fauna">
    <p><b>${f.icono} ${f.titulo}</b> <i>${f.cientifico}</i></p>
    <p>🏔 <b>Hogar:</b> ${f.hogar}</p>
    <p>🍃 <b>Come:</b> ${f.come}</p>
    <p>🛡 <b>Estado (UICN):</b> <span class="conservacion ${f.conservacion === "Vulnerable" || f.conservacion === "Casi amenazado" ? "alerta" : ""}">${f.conservacion}</span></p>
    <p>💡 ${f.dato}</p>
  </div>`;

/** Pregunta algo con botones en la tarjeta de misión. Devuelve el id del botón tocado. */
function tarjeta(html: string, botones: [string, string, string][]): Promise<string> {
  const c = caja();
  c.innerHTML = `<div class="mision-tarjeta fauna-tarjeta">${html}<div class="mision-botones">${botones
    .map(([id, texto, clase]) => `<button class="${clase}" data-b="${id}">${texto}</button>`)
    .join("")}</div></div>`;
  c.hidden = false;
  return new Promise((r) =>
    c.querySelectorAll<HTMLButtonElement>("[data-b]").forEach((b) =>
      b.addEventListener("click", () => {
        sonido.toque();
        c.hidden = true;
        r(b.dataset.b!);
      })
    )
  );
}

/** Animales purificados en una misión: se ofrecen para liberar y registrar con código. */
export async function liberarAnimales(ids: string[]) {
  const nuevos = [...new Set(ids)].filter((id) => !estado.fauna.includes(id) && FAUNA.some((f) => f.id === id));
  for (const id of nuevos) if (!estado.faunaPendiente.includes(id)) estado.faunaPendiente.push(id);
  guardar();
  for (const id of nuevos) {
    const sigue = await liberarUno(id, true);
    if (!sigue) break;
  }
}

/** Devuelve false si el jugador eligió "más tarde" (para no insistir con los demás). */
async function liberarUno(id: string, preguntar: boolean): Promise<boolean> {
  const f = ficha(id);
  if (preguntar) {
    const r = await tarjeta(
      `<div class="mision-cabeza"><span class="mision-icono">${f.icono}</span><div><small>KHIPU DE LA FAUNA</small><h2>¡El ${f.titulo.toLowerCase()} ya no está corrompido!</h2></div></div>
       <p class="mision-como">El Bug lo había atrapado en su código. Para devolverlo a su hogar: <b>1)</b> libéralo con <b>Python</b> y <b>2)</b> anótalo en el Khipu con <b>SQL</b>.</p>`,
      [
        ["mas-tarde", "Más tarde", "boton-secundario"],
        ["liberar", "🐍 Liberar con código", "boton-oro"],
      ]
    );
    if (r !== "liberar") return false;
  }
  const ok1 = await abrirTaller(retoLiberar(f));
  if (!ok1) return false;
  const ok2 = await abrirTaller(retoRegistrar(f, estado.fauna));
  if (!ok2) return false;
  if (!estado.fauna.includes(id)) estado.fauna.push(id);
  estado.faunaPendiente = estado.faunaPendiente.filter((x) => x !== id);
  guardar();
  ganarKallpa(10);
  sonido.tesoro();
  await tarjeta(
    `<div class="mision-cabeza"><span class="mision-icono">🧶</span><div><small>NUEVO EN TU KHIPU · ${estado.fauna.length}/${FAUNA.length}</small><h2>${f.titulo}</h2></div></div>${fichaHtml(f)}
     <p class="mision-como">Abre el Khipu (🧶 arriba) para consultar tus animales con SQL y SQLAlchemy.</p>`,
    [["ok", "¡Sigamos! ⚡ +10", "boton-oro"]]
  );
  return true;
}

/** Pantalla del Khipu de la fauna. */
export async function abrirKhipuFauna(): Promise<void> {
  for (;;) {
    const consultas = consultasFauna(estado.fauna);
    const c = caja();
    c.innerHTML = `
      <div class="mision-tarjeta fauna-tarjeta">
        <div class="mision-cabeza"><span class="mision-icono">🧶</span><div><small>BASE DE DATOS · TABLA fauna</small><h2>Khipu de la fauna</h2></div></div>
        <p class="mision-como">Purifica animales en las misiones, libéralos con Python y anótalos con SQL. Llevas <b>${estado.fauna.length}/${FAUNA.length}</b>.</p>
        <div class="lista-misiones">
          ${FAUNA.map((f) => {
            const reg = estado.fauna.includes(f.id);
            const pend = estado.faunaPendiente.includes(f.id);
            return `<button class="fila-mision ${reg || pend ? "" : "bloqueada"}" data-id="${f.id}" ${reg || pend ? "" : "disabled"}>
              <span class="mision-icono chico">${reg || pend ? f.icono : "❓"}</span>
              <span class="fila-texto"><b>${reg || pend ? f.titulo : "¿?"}</b><small>${reg ? `${f.region} · ${f.conservacion}` : pend ? "Purificado: ¡falta liberarlo con código!" : `Aparece en misiones de la ${f.region}`}</small></span>
              <span class="fila-estrellas">${reg ? "📖 Ver" : pend ? "🐍 Liberar" : "🔒"}</span>
            </button>`;
          }).join("")}
        </div>
        <p class="mision-como"><b>Consultas al Khipu</b> ${estado.fauna.length ? "(con TUS animales)" : "— primero anota un animal"}</p>
        <div class="consultas-fauna">
          ${consultas
            .map((q, i) => {
              const puede = estado.fauna.length >= (q.id === "fauna-orm" ? 2 : 1);
              const hecha = estado.consultasFauna.includes(q.id);
              return `<button class="boton-secundario consulta ${hecha ? "hecha" : ""}" data-q="${i}" ${puede ? "" : "disabled"}>${q.icono} ${q.corto}${hecha ? " ✓" : ""}</button>`;
            })
            .join("")}
        </div>
        <div class="mision-botones"><button class="boton-secundario" id="fauna-cerrar">Cerrar</button></div>
      </div>`;
    c.hidden = false;
    const eleccion = await new Promise<{ animal?: string; consulta?: number } | null>((r) => {
      c.querySelectorAll<HTMLButtonElement>(".fila-mision:not(.bloqueada)").forEach((b) =>
        b.addEventListener("click", () => {
          sonido.toque();
          c.hidden = true;
          r({ animal: b.dataset.id });
        })
      );
      c.querySelectorAll<HTMLButtonElement>("[data-q]").forEach((b) =>
        b.addEventListener("click", () => {
          sonido.toque();
          c.hidden = true;
          r({ consulta: Number(b.dataset.q) });
        })
      );
      c.querySelector("#fauna-cerrar")!.addEventListener("click", () => {
        c.hidden = true;
        r(null);
      });
    });
    if (!eleccion) return;
    if (eleccion.animal) {
      const id = eleccion.animal;
      if (estado.fauna.includes(id)) {
        const f = ficha(id);
        await tarjeta(`<div class="mision-cabeza"><span class="mision-icono">${f.icono}</span><div><small>KHIPU DE LA FAUNA</small><h2>${f.titulo}</h2></div></div>${fichaHtml(f)}`, [["ok", "Volver", "boton-oro"]]);
      } else await liberarUno(id, false);
      continue;
    }
    const q = consultas[eleccion.consulta!];
    const ok = await abrirTaller(q);
    if (ok && !estado.consultasFauna.includes(q.id)) {
      estado.consultasFauna.push(q.id);
      guardar();
      ganarKallpa(5);
    }
  }
}
