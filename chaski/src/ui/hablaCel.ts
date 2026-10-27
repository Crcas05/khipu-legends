// Voz del celular (speechSynthesis): lee los diálogos en español. Gratis y sin internet.
import { estado } from "../estado";

const TONO: Record<string, [number, number]> = {
  // [tono, velocidad]
  tuki: [1.6, 1.12],
  mama: [0.75, 0.9],
  amaru: [1.05, 1],
  killa: [1.3, 1.02],
  yaru: [0.9, 0.95],
  sisa: [1.15, 1.02],
  waman: [1.0, 1.15],
  yachaq: [0.7, 0.86],
  chaski: [1.15, 1.05],
  narrador: [1, 0.95],
};

export const hayVoz = () => typeof window !== "undefined" && "speechSynthesis" in window;

let vozEs: SpeechSynthesisVoice | null = null;
function elegirVoz() {
  if (!hayVoz()) return;
  const voces = speechSynthesis.getVoices();
  vozEs =
    voces.find((v) => /es[-_](PE|419|MX|US)/i.test(v.lang)) ??
    voces.find((v) => v.lang.toLowerCase().startsWith("es")) ??
    null;
}
if (hayVoz()) {
  elegirVoz();
  speechSynthesis.addEventListener?.("voiceschanged", elegirVoz);
}

/** Quita marcas del juego y emojis para que suene natural. */
export function limpiarParaVoz(t: string) {
  return t
    .replace(/\{nombre\}/g, estado.nombre || "Chaski")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[\p{Extended_Pictographic}️‍]/gu, "")
    .replace(/Kraa!?/gi, "")
    .replace(/[_`#]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function decir(texto: string, quien = "narrador") {
  if (!hayVoz()) return;
  callar();
  const limpio = limpiarParaVoz(texto);
  if (!limpio) return;
  const u = new SpeechSynthesisUtterance(limpio);
  u.lang = vozEs?.lang ?? "es-PE";
  if (vozEs) u.voice = vozEs;
  const [tono, vel] = TONO[quien] ?? [1, 1];
  u.pitch = tono;
  u.rate = vel;
  speechSynthesis.speak(u);
}

export function callar() {
  if (hayVoz()) speechSynthesis.cancel();
}
