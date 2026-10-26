// Motor de lecciones: cada lugar del mapa es una lección con el formato fijo
// gancho → ejemplo/predicción → teoría → práctica guiada → práctica libre → error típico.
// Da sellos por módulo: 🥉 reconoce, 🥈 aplica (sin ver la solución), 🥇 domina.

import type { Quien } from "../datos/episodio1";
import type { RetoBloques } from "./bloques";
import type { Reto } from "./taller";
import { abrirBloques } from "./bloques";
import { abrirTaller } from "./taller";
import { tarjeta, voz, teoria, elegir, esperarBoton, cerrarTarjeta } from "./prologo";
import { estado, guardar } from "../estado";
import { sonido } from "../sonido";

const escapar = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const resaltar = (codigo: string) => `<pre class="codigo-mini">${escapar(codigo)}</pre>`;

export type Opcion = [codigo: string, ok: boolean, porque: string];

export type PasoLeccion =
  | { tipo: "voz"; quien: Quien; texto: string }
  | { tipo: "teoria"; texto: string; codigo?: string }
  | { tipo: "elegir"; quien: Quien; texto: string; codigo?: string; opciones: Opcion[] }
  | { tipo: "bloques"; reto: RetoBloques }
  | { tipo: "taller"; reto: Reto }
  | { tipo: "bug"; codigo: string; texto?: string; opciones: Opcion[] };

export interface Leccion {
  id: string;
  modulo: string;
  titulo: string;
  pasos: PasoLeccion[];
}

/** Ejecuta la lección desde donde quedó. Devuelve true si la terminó. */
export async function jugarLeccion(l: Leccion, guia: Quien): Promise<boolean> {
  let i = estado.leccionPaso[l.id] ?? 0;
  let ayuda = false;
  let bugAlPrimero = true;
  for (; i < l.pasos.length; i++) {
    estado.leccionPaso[l.id] = i;
    guardar();
    const p = l.pasos[i];
    switch (p.tipo) {
      case "voz": {
        const c = tarjeta(`${voz(p.quien, p.texto)}<button class="boton-oro" id="seguir">Siguiente ▸</button>`);
        await esperarBoton(c, "#seguir");
        break;
      }
      case "teoria": {
        const c = tarjeta(`
          <p class="leccion-modulo">${escapar(l.modulo)} · ${escapar(l.titulo)}</p>
          ${teoria(p.texto)}${p.codigo ? resaltar(p.codigo) : ""}
          <button class="boton-oro" id="seguir">Entendido ▸</button>`);
        await esperarBoton(c, "#seguir");
        break;
      }
      case "elegir": {
        const c = tarjeta(`${voz(p.quien, p.texto)}${p.codigo ? resaltar(p.codigo) : ""}<div class="prologo-opciones"></div><p class="prologo-nota" hidden></p>`);
        await elegir(c, p.opciones.map(([codigo, ok, porque]) => ({ codigo, ok, porque })));
        break;
      }
      case "bloques":
        cerrarTarjeta();
        await abrirBloques(p.reto);
        break;
      case "taller": {
        cerrarTarjeta();
        const r = await abrirTaller(p.reto);
        if (!r) return false; // lo cerró: retoma aquí la próxima vez
        if (r === "ayuda") ayuda = true;
        break;
      }
      case "bug": {
        const c = tarjeta(`
          <p class="enfoque-titulo">🐛 ¡UN BUG EN LA RUNA!</p>
          ${voz(guia, p.texto ?? "Esta runa tiene un error. ¿Cuál es?")}
          ${resaltar(p.codigo)}
          <div class="prologo-opciones"></div><p class="prologo-nota" hidden></p>`);
        await elegir(
          c,
          p.opciones.map(([codigo, ok, porque]) => ({ codigo, ok, porque })),
          () => (bugAlPrimero = false)
        );
        break;
      }
    }
  }
  cerrarTarjeta();
  estado.leccionPaso[l.id] = l.pasos.length;
  const sello = ayuda ? 1 : bugAlPrimero ? 3 : 2;
  estado.sellos[l.modulo] = Math.max(estado.sellos[l.modulo] ?? 0, sello);
  guardar();
  sonido.acierto();
  return true;
}

export const NOMBRE_SELLO = ["", "🥉 Reconoce", "🥈 Aplica", "🥇 Domina"];
