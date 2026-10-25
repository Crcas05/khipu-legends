// Arte provisional en pixel art, dibujado con código.
// Cuando tengamos el paquete de pixel art (por ejemplo Ninja Adventure, CC0),
// solo se reemplaza este archivo por la carga de las imágenes: los nombres
// de las texturas y de los cuadros se mantienen y el resto del juego no cambia.

import Phaser from "phaser";
import { TILE } from "../config";

type Ctx = CanvasRenderingContext2D;

/** Índices de las baldosas del suelo (posición dentro de la textura "baldosas"). */
export const BALDOSA = {
  PASTO: 0,
  PASTO_2: 1,
  PASTO_FLORES: 2,
  TIERRA: 3,
  AGUA: 4,
  AGUA_2: 5,
  PUENTE: 6,
  ORILLA: 7,
} as const;
const TOTAL_BALDOSAS = 8;

// Generador pseudoaleatorio estable: el arte se ve igual en cada partida.
function azar(semilla: number): number {
  const x = Math.sin(semilla * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function px(c: Ctx, x: number, y: number, w: number, h: number, color: string) {
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), w, h);
}

function lienzo(escena: Phaser.Scene, clave: string, w: number, h: number) {
  const tex = escena.textures.createCanvas(clave, w, h);
  if (!tex) throw new Error(`No se pudo crear la textura ${clave}`);
  return { tex, c: tex.getContext() };
}

// ---------------------------------------------------------------------------
// Baldosas del suelo
// ---------------------------------------------------------------------------
function dibujarBaldosas(escena: Phaser.Scene) {
  const { tex, c } = lienzo(escena, "baldosas", TILE * TOTAL_BALDOSAS, TILE);
  const pasto = (ox: number, base: string, semilla: number, flores = false) => {
    px(c, ox, 0, TILE, TILE, base);
    for (let k = 0; k < 5; k++) px(c, ox + Math.floor(azar(semilla + k) * 15), Math.floor(azar(semilla * 3 + k) * 14), 1, 2, "#3f7f31");
    if (flores) {
      px(c, ox + 4, 5, 2, 2, "#f2b33d");
      px(c, ox + 11, 10, 2, 2, "#e76f51");
      px(c, ox + 8, 3, 1, 1, "#ffffff");
    }
  };
  pasto(BALDOSA.PASTO * TILE, "#4f9a3c", 1);
  pasto(BALDOSA.PASTO_2 * TILE, "#55a341", 7);
  pasto(BALDOSA.PASTO_FLORES * TILE, "#4f9a3c", 13, true);

  let ox = BALDOSA.TIERRA * TILE;
  px(c, ox, 0, TILE, TILE, "#c99a5b");
  for (let k = 0; k < 4; k++) px(c, ox + Math.floor(azar(30 + k) * 14), Math.floor(azar(40 + k) * 14), 2, 1, "#a87c44");

  for (const [indice, desfase] of [[BALDOSA.AGUA, 0], [BALDOSA.AGUA_2, 5]] as const) {
    ox = indice * TILE;
    px(c, ox, 0, TILE, TILE, "#2f7fb5");
    px(c, ox + ((2 + desfase) % 10), 4, 6, 1, "#7cc4e8");
    px(c, ox + ((8 + desfase) % 10), 11, 5, 1, "#5aa8d6");
  }

  ox = BALDOSA.PUENTE * TILE;
  px(c, ox, 0, TILE, TILE, "#8b5e3c");
  for (let k = 0; k < 4; k++) px(c, ox, k * 4, TILE, 1, "#6b4423");
  px(c, ox, 0, 1, TILE, "#5a3a1f");
  px(c, ox + 15, 0, 1, TILE, "#5a3a1f");

  ox = BALDOSA.ORILLA * TILE;
  px(c, ox, 0, TILE, TILE, "#2f7fb5");
  px(c, ox, 0, TILE, 4, "#c99a5b");
  px(c, ox, 4, TILE, 1, "#a87c44");

  tex.refresh();
}

// ---------------------------------------------------------------------------
// Chaski: 4 direcciones x 3 cuadros (quieto, paso 1, paso 2). Cuadros de 16x20.
// Orden de cuadros: abajo 0-2, arriba 3-5, lado (derecha) 6-8.
// ---------------------------------------------------------------------------
export const CUADRO_CHASKI = { ancho: 16, alto: 20 };

function dibujarChaski(c: Ctx, ox: number, dir: "abajo" | "arriba" | "lado", paso: number) {
  const piel = "#b8794a", chullo = "#f2b33d", rojo = "#c8102e", turquesa = "#2a9d8f", oscuro = "#3d2b1f", negro = "#1b1b1b";
  // Piernas
  const sube = (lado: number) => (paso === 1 && lado === 0) || (paso === 2 && lado === 1) ? 1 : 0;
  if (dir === "lado") {
    px(c, ox + 6 + (paso === 1 ? -1 : paso === 2 ? 1 : 0), 16, 2, 4, oscuro);
    px(c, ox + 9 + (paso === 1 ? 1 : paso === 2 ? -1 : 0), 16, 2, 4, oscuro);
  } else {
    px(c, ox + 5, 16, 2, 4 - sube(0), oscuro);
    px(c, ox + 9, 16, 2, 4 - sube(1), oscuro);
  }
  // Poncho
  px(c, ox + 3, 10, 10, 7, rojo);
  px(c, ox + 3, 13, 10, 1, chullo);
  px(c, ox + 3, 16, 10, 1, turquesa);
  // Brazos
  if (dir === "lado") {
    px(c, ox + 8, 11 + (paso === 1 ? 1 : 0), 2, 3, piel);
    px(c, ox + 10, 12, 3, 2, "#f7f1e3"); // pututu en la mano
  } else {
    px(c, ox + 2, 11, 1, 4, piel);
    px(c, ox + 13, 11, 1, 4, piel);
  }
  // Cabeza
  const hx = dir === "lado" ? 5 : 4;
  px(c, ox + hx, 4, 8, 7, piel);
  if (dir === "arriba") px(c, ox + 4, 5, 8, 5, negro);
  // Chullo
  px(c, ox + 4, 1, 8, 4, chullo);
  px(c, ox + 6, 0, 4, 1, rojo);
  px(c, ox + 4, 3, 8, 1, turquesa);
  if (dir === "lado") {
    px(c, ox + 4, 5, 2, 4, chullo); // orejera de atrás
  } else {
    px(c, ox + 3, 5, 1, 4, chullo);
    px(c, ox + 12, 5, 1, 4, chullo);
  }
  // Cara
  if (dir === "abajo") {
    px(c, ox + 6, 7, 1, 1, negro);
    px(c, ox + 9, 7, 1, 1, negro);
    px(c, ox + 7, 9, 2, 1, "#8a4f2b");
  } else if (dir === "lado") {
    px(c, ox + 10, 7, 1, 1, negro);
    px(c, ox + 9, 9, 2, 1, "#8a4f2b");
  }
}

function dibujarChaskiHoja(escena: Phaser.Scene) {
  const { ancho, alto } = CUADRO_CHASKI;
  const { tex, c } = lienzo(escena, "chaski", ancho * 9, alto);
  const dirs = ["abajo", "arriba", "lado"] as const;
  dirs.forEach((dir, d) => {
    for (let p = 0; p < 3; p++) {
      const i = d * 3 + p;
      dibujarChaski(c, i * ancho, dir, p);
      tex.add(i, 0, i * ancho, 0, ancho, alto);
    }
  });
  tex.refresh();
}

// ---------------------------------------------------------------------------
// Tuki, el gallito de las rocas (2 cuadros de 12x12, alas arriba y abajo)
// ---------------------------------------------------------------------------
function dibujarTuki(escena: Phaser.Scene) {
  const { tex, c } = lienzo(escena, "tuki", 24, 12);
  for (let f = 0; f < 2; f++) {
    const ox = f * 12;
    px(c, ox + 3, 4, 6, 6, "#ff6b1a"); // cuerpo
    px(c, ox + 2, 1, 6, 4, "#ff8a3d"); // cresta
    px(c, ox + 1, 5, 2, 1, "#f2b33d"); // pico
    px(c, ox + 4, 4, 1, 1, "#1b1b1b"); // ojo
    px(c, ox + 7, f === 0 ? 3 : 6, 4, 3, "#1b1b1b"); // ala
    px(c, ox + 5, 10, 1, 2, "#f2b33d");
    px(c, ox + 7, 10, 1, 2, "#f2b33d");
    tex.add(f, 0, ox, 0, 12, 12);
  }
  tex.refresh();
}

// ---------------------------------------------------------------------------
// Objetos del mundo
// ---------------------------------------------------------------------------
function dibujarObjetos(escena: Phaser.Scene) {
  // Árbol 32x36
  {
    const { tex, c } = lienzo(escena, "arbol", 32, 36);
    px(c, 13, 22, 6, 14, "#6b4423");
    c.fillStyle = "#2e6b2a"; c.beginPath(); c.arc(16, 14, 14, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#3f8a37"; c.beginPath(); c.arc(11, 9, 6, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#1f4d1d"; c.beginPath(); c.arc(21, 19, 4, 0, Math.PI * 2); c.fill();
    tex.refresh();
  }
  // Palmera 28x40
  {
    const { tex, c } = lienzo(escena, "palmera", 28, 40);
    px(c, 12, 12, 4, 28, "#8b6a3c");
    for (let k = 0; k < 7; k++) px(c, 12, 14 + k * 4, 4, 1, "#6b4f2a");
    c.fillStyle = "#3f8a37";
    for (const [dx, dy, ang] of [[-8, 2, -0.5], [8, 2, 0.5], [-6, 8, -1.1], [6, 8, 1.1], [0, -2, 0]]) {
      c.beginPath(); c.ellipse(14 + dx, 10 + dy, 9, 3, ang, 0, Math.PI * 2); c.fill();
    }
    tex.refresh();
  }
  // Roca 16x12
  {
    const { tex, c } = lienzo(escena, "roca", 16, 12);
    c.fillStyle = "#8d8d8d"; c.beginPath(); c.ellipse(8, 7, 8, 5, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#b3b3b3"; c.beginPath(); c.ellipse(6, 5, 4, 2, 0, 0, Math.PI * 2); c.fill();
    tex.refresh();
  }
  // Choza 48x44
  {
    const { tex, c } = lienzo(escena, "choza", 48, 44);
    px(c, 6, 22, 36, 20, "#b5835a");
    for (let k = 0; k < 6; k++) px(c, 6 + k * 6, 22, 1, 20, "#9a6c45");
    px(c, 20, 28, 8, 14, "#5a3a1f");
    c.fillStyle = "#c9a227";
    c.beginPath(); c.moveTo(0, 24); c.lineTo(24, 2); c.lineTo(48, 24); c.closePath(); c.fill();
    for (let k = 0; k < 9; k++) px(c, 3 + k * 5, 14 + (k % 2), 1, 9, "#a8861d");
    px(c, 0, 23, 48, 2, "#8f711a");
    tex.refresh();
  }
  // Gran Lupuna 72x84, con el Corazón apagado
  {
    const { tex, c } = lienzo(escena, "lupuna", 72, 84);
    c.fillStyle = "#1f5a24"; c.beginPath(); c.arc(36, 24, 24, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#2e6b2a"; c.beginPath(); c.arc(24, 18, 14, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#2e6b2a"; c.beginPath(); c.arc(50, 20, 13, 0, Math.PI * 2); c.fill();
    px(c, 24, 36, 24, 40, "#8a7a62");
    px(c, 14, 70, 44, 14, "#7a6a52");
    px(c, 8, 78, 12, 6, "#6f5f48");
    px(c, 52, 78, 12, 6, "#6f5f48");
    px(c, 31, 48, 10, 10, "#7d858f"); // corazón apagado
    px(c, 33, 50, 6, 6, "#a7aeb6");
    for (const dx of [-10, -5, 5, 10]) px(c, 36 + dx, 58, 1, 16, "#8d8d8d");
    tex.refresh();
  }
  // Wayruru (semilla) 6x6
  {
    const { tex, c } = lienzo(escena, "wayruru", 6, 6);
    c.fillStyle = "#c8102e"; c.beginPath(); c.arc(3, 3, 3, 0, Math.PI * 2); c.fill();
    px(c, 3, 0, 3, 6, "#111111");
    px(c, 1, 1, 1, 1, "#ff9a9a");
    tex.refresh();
  }
  // Sombra 14x5
  {
    const { tex, c } = lienzo(escena, "sombra", 14, 5);
    c.fillStyle = "rgba(0,0,0,0.28)"; c.beginPath(); c.ellipse(7, 2.5, 7, 2.5, 0, 0, Math.PI * 2); c.fill();
    tex.refresh();
  }
}

/** Crea todas las texturas y animaciones del juego. */
export function crearArte(escena: Phaser.Scene) {
  dibujarBaldosas(escena);
  dibujarChaskiHoja(escena);
  dibujarTuki(escena);
  dibujarObjetos(escena);

  const anim = (clave: string, cuadros: number[], fps: number) =>
    escena.anims.create({
      key: clave,
      frames: cuadros.map((f) => ({ key: "chaski", frame: f })),
      frameRate: fps,
      repeat: -1,
    });
  anim("caminar-abajo", [1, 0, 2, 0], 8);
  anim("caminar-arriba", [4, 3, 5, 3], 8);
  anim("caminar-lado", [7, 6, 8, 6], 8);
  escena.anims.create({
    key: "tuki-volar",
    frames: [{ key: "tuki", frame: 0 }, { key: "tuki", frame: 1 }],
    frameRate: 6,
    repeat: -1,
  });
}
