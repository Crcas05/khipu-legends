// Texturas dibujadas en el momento (sin archivos): pasto, adobe, tejas, piedra inca, ichu.
import { Scene } from "@babylonjs/core/scene";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";

function azar(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

function nueva(escena: Scene, nombre: string, t: number, dibujar: (c: CanvasRenderingContext2D, t: number) => void, repetir = 1) {
  const tex = new DynamicTexture(`tx-${nombre}`, { width: t, height: t }, escena, true);
  const c = tex.getContext() as CanvasRenderingContext2D;
  dibujar(c, t);
  tex.update(true);
  tex.wrapU = tex.wrapV = Texture.WRAP_ADDRESSMODE;
  tex.uScale = tex.vScale = repetir;
  tex.anisotropicFilteringLevel = 4;
  return tex;
}

/** Pasto andino con manchas, briznas y florcitas. */
export function texturaPasto(escena: Scene, base = "#5c9a43", repetir = 18) {
  return nueva(
    escena,
    `pasto-${base}`,
    256,
    (c, t) => {
      const r = azar(7);
      c.fillStyle = base;
      c.fillRect(0, 0, t, t);
      for (let i = 0; i < 70; i++) {
        c.fillStyle = r() > 0.5 ? "rgba(255,255,200,.07)" : "rgba(0,40,0,.09)";
        c.beginPath();
        c.arc(r() * t, r() * t, 8 + r() * 26, 0, Math.PI * 2);
        c.fill();
      }
      for (let i = 0; i < 900; i++) {
        c.strokeStyle = r() > 0.5 ? "rgba(140,200,90,.55)" : "rgba(40,90,30,.45)";
        const x = r() * t;
        const y = r() * t;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x + (r() - 0.5) * 3, y - 3 - r() * 4);
        c.stroke();
      }
      for (let i = 0; i < 14; i++) {
        c.fillStyle = ["#f9d342", "#ffffff", "#e5397a"][i % 3];
        c.fillRect(r() * t, r() * t, 2, 2);
      }
    },
    repetir
  );
}

/** Muro de adobe: bloques de barro con juntas. */
export function texturaAdobe(escena: Scene) {
  return nueva(escena, "adobe", 256, (c, t) => {
    const r = azar(3);
    c.fillStyle = "#d9b98c";
    c.fillRect(0, 0, t, t);
    const alto = 32;
    for (let fila = 0; fila < t / alto; fila++) {
      const desfase = fila % 2 ? 32 : 0;
      for (let x = -desfase; x < t; x += 64) {
        const tono = 200 + Math.floor(r() * 30);
        c.fillStyle = `rgb(${tono},${tono - 30},${tono - 75})`;
        c.fillRect(x + 2, fila * alto + 2, 60, alto - 4);
        for (let k = 0; k < 6; k++) {
          c.fillStyle = "rgba(120,80,40,.18)";
          c.fillRect(x + 4 + r() * 52, fila * alto + 4 + r() * 22, 3, 2);
        }
      }
    }
  });
}

/** Tejas (o paja) en franjas; el color lo pone el material (techo gris/rojo/azul...). */
export function texturaTejas(escena: Scene) {
  return nueva(
    escena,
    "tejas",
    256,
    (c, t) => {
      c.fillStyle = "#ffffff";
      c.fillRect(0, 0, t, t);
      for (let y = 0; y < t; y += 24) {
        c.fillStyle = "rgba(0,0,0,.22)";
        c.fillRect(0, y + 18, t, 6);
        for (let x = (y / 24) % 2 ? 16 : 0; x < t; x += 32) {
          c.fillStyle = "rgba(0,0,0,.12)";
          c.fillRect(x, y, 3, 20);
        }
      }
    },
    2
  );
}

/** Piedra inca: bloques pulidos irregulares (para muros de templos y misiones). */
export function texturaPiedraInca(escena: Scene) {
  return nueva(escena, "piedra-inca", 256, (c, t) => {
    const r = azar(11);
    c.fillStyle = "#6f6a61";
    c.fillRect(0, 0, t, t);
    let y = 0;
    while (y < t) {
      const h = 34 + r() * 26;
      let x = -r() * 40;
      while (x < t) {
        const w = 44 + r() * 50;
        const tono = 150 + Math.floor(r() * 40);
        c.fillStyle = `rgb(${tono},${tono - 6},${tono - 16})`;
        c.beginPath();
        const rr = 9;
        c.roundRect(x + 2, y + 2, w - 4, h - 4, rr);
        c.fill();
        c.fillStyle = "rgba(255,255,255,.12)";
        c.fillRect(x + 6, y + 5, w - 16, 4);
        x += w;
      }
      y += h;
    }
  });
}

/** Ichu (paja de la puna). */
export function texturaIchu(escena: Scene, repetir = 14) {
  return nueva(
    escena,
    "ichu",
    256,
    (c, t) => {
      const r = azar(5);
      c.fillStyle = "#b99b55";
      c.fillRect(0, 0, t, t);
      for (let i = 0; i < 1400; i++) {
        c.strokeStyle = r() > 0.5 ? "rgba(235,210,140,.6)" : "rgba(120,95,40,.45)";
        const x = r() * t;
        const y = r() * t;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x + (r() - 0.5) * 6, y - 5 - r() * 7);
        c.stroke();
      }
    },
    repetir
  );
}

/** Suelo de selva: hojarasca. */
export function texturaHojarasca(escena: Scene, repetir = 14) {
  return nueva(
    escena,
    "hojarasca",
    256,
    (c, t) => {
      const r = azar(9);
      c.fillStyle = "#3e5a2a";
      c.fillRect(0, 0, t, t);
      for (let i = 0; i < 500; i++) {
        c.fillStyle = ["rgba(110,80,40,.55)", "rgba(60,100,40,.55)", "rgba(30,60,20,.6)", "rgba(150,120,60,.4)"][i % 4];
        c.beginPath();
        c.ellipse(r() * t, r() * t, 3 + r() * 5, 1.5 + r() * 2, r() * Math.PI, 0, Math.PI * 2);
        c.fill();
      }
    },
    repetir
  );
}
