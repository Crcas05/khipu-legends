// Barra superior: objetivo de la misión, kallpa y avisos.

import { estado } from "../estado";
import { OBJETIVOS as OBJ1 } from "../datos/episodio1";
import { OBJETIVOS_2 } from "../datos/episodio2";
const OBJETIVOS: Record<string, string> = { ...OBJ1, ...OBJETIVOS_2 };
import { sonido } from "../sonido";

let temporizador = 0;
export function aviso(texto: string, ms = 3800) {
  const a = document.getElementById("aviso")!;
  a.textContent = texto;
  a.hidden = false;
  a.classList.remove("entra");
  void a.offsetWidth;
  a.classList.add("entra");
  window.clearTimeout(temporizador);
  temporizador = window.setTimeout(() => (a.hidden = true), ms);
}

let objetivoZona: string | null = null;
/** En las zonas del viaje, el objetivo lo pone la zona (null = el de la historia). */
export function fijarObjetivo(texto: string | null) {
  objetivoZona = texto;
  actualizarHud();
}

export function actualizarHud() {
  const objetivo = objetivoZona ?? OBJETIVOS[estado.paso] ?? "";
  document.getElementById("objetivo-texto")!.textContent = objetivo;
  document.getElementById("objetivo")!.hidden = !objetivo;
  document.getElementById("hud-kallpa")!.textContent = String(estado.kallpa);
  document.getElementById("hud-nivel")!.textContent = String(estado.nivel);
  document.getElementById("hud-palabras")!.textContent = String(estado.palabras.length);
  document.getElementById("hud-racha")!.textContent = String(estado.racha);
  document.getElementById("chip-racha")!.hidden = estado.racha < 1;
}

/** Muestra "+N" flotando sobre el contador de kallpa. */
export function ganarKallpa(n: number) {
  estado.kallpa += n;
  sonido.kallpa();
  actualizarHud();
  const chip = document.getElementById("chip-kallpa")!;
  const f = document.createElement("span");
  f.className = "flotante";
  f.textContent = `+${n} ⚡`;
  chip.appendChild(f);
  window.setTimeout(() => f.remove(), 1400);
}
