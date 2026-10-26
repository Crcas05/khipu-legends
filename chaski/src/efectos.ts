// VFX: partículas livianas (agua, chispas, polvo, glitch) y sacudida de cámara.

import { Scene } from "@babylonjs/core/scene";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import "@babylonjs/core/Particles/particleSystemComponent";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

let textura: DynamicTexture | null = null;
function punto(escena: Scene): DynamicTexture {
  if (textura) return textura;
  textura = new DynamicTexture("tx-punto", { width: 64, height: 64 }, escena, false);
  textura.hasAlpha = true;
  const c = textura.getContext() as unknown as CanvasRenderingContext2D;
  const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.4, "rgba(255,255,255,.8)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  c.fillStyle = g;
  c.fillRect(0, 0, 64, 64);
  textura.update();
  return textura;
}

const hex = (h: string, a = 1) => {
  const n = parseInt(h.slice(1), 16);
  return new Color4(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, a);
};

/** Chorro de la fuente (se enciende cuando fuente.agua = True). */
export function crearChorro(escena: Scene, origen: Vector3) {
  const p = new ParticleSystem("chorro", 400, escena);
  p.particleTexture = punto(escena);
  p.emitter = origen;
  p.minEmitBox = new Vector3(-0.1, 0, -0.1);
  p.maxEmitBox = new Vector3(0.1, 0, 0.1);
  p.color1 = hex("#bff3ff", 0.95);
  p.color2 = hex("#4fc3f7", 0.9);
  p.colorDead = hex("#4fc3f7", 0);
  p.minSize = 0.12;
  p.maxSize = 0.28;
  p.minLifeTime = 0.6;
  p.maxLifeTime = 1.0;
  p.emitRate = 140;
  p.gravity = new Vector3(0, -9, 0);
  p.direction1 = new Vector3(-1.2, 6, -1.2);
  p.direction2 = new Vector3(1.2, 7, 1.2);
  p.minEmitPower = 0.6;
  p.maxEmitPower = 0.9;
  p.blendMode = ParticleSystem.BLENDMODE_STANDARD;
  return p;
}

/** Estallido de chispas (aciertos, tesoros, el Bug que huye). */
export function estallido(escena: Scene, donde: Vector3, colores: string[], cantidad = 80, fuerza = 6) {
  const p = new ParticleSystem("estallido", cantidad, escena);
  p.particleTexture = punto(escena);
  p.emitter = donde.clone();
  p.color1 = hex(colores[0]);
  p.color2 = hex(colores[1] ?? colores[0]);
  p.colorDead = hex(colores[colores.length - 1], 0);
  p.minSize = 0.12;
  p.maxSize = 0.4;
  p.minLifeTime = 0.5;
  p.maxLifeTime = 1.1;
  p.manualEmitCount = cantidad;
  p.createSphereEmitter(0.4);
  p.minEmitPower = fuerza * 0.5;
  p.maxEmitPower = fuerza;
  p.gravity = new Vector3(0, -6, 0);
  p.blendMode = ParticleSystem.BLENDMODE_ADD;
  p.targetStopDuration = 1.3;
  p.disposeOnStop = true;
  p.start();
}

/** Polvo bajo los pies al correr. */
export function crearPolvo(escena: Scene, pies: Vector3) {
  const p = new ParticleSystem("polvo", 120, escena);
  p.particleTexture = punto(escena);
  p.emitter = pies; // se mueve con el jugador (misma referencia)
  p.minEmitBox = new Vector3(-0.2, 0.05, -0.2);
  p.maxEmitBox = new Vector3(0.2, 0.1, 0.2);
  p.color1 = hex("#d8c39a", 0.55);
  p.color2 = hex("#bfa57a", 0.45);
  p.colorDead = hex("#bfa57a", 0);
  p.minSize = 0.25;
  p.maxSize = 0.55;
  p.minLifeTime = 0.35;
  p.maxLifeTime = 0.6;
  p.emitRate = 0;
  p.direction1 = new Vector3(-0.5, 0.6, -0.5);
  p.direction2 = new Vector3(0.5, 1, 0.5);
  p.minEmitPower = 0.5;
  p.maxEmitPower = 1;
  p.blendMode = ParticleSystem.BLENDMODE_STANDARD;
  p.start();
  return p;
}

/** Destellos permanentes que marcan un secreto (solo se ven con el Ojo). */
export function crearDestello(escena: Scene, donde: Vector3) {
  const p = new ParticleSystem("destello", 40, escena);
  p.particleTexture = punto(escena);
  p.emitter = donde.clone();
  p.createSphereEmitter(0.5);
  p.color1 = hex("#ffd166");
  p.color2 = hex("#4ff0dc");
  p.colorDead = hex("#ffd166", 0);
  p.minSize = 0.1;
  p.maxSize = 0.25;
  p.minLifeTime = 0.6;
  p.maxLifeTime = 1.2;
  p.emitRate = 18;
  p.minEmitPower = 0.2;
  p.maxEmitPower = 0.5;
  p.gravity = new Vector3(0, 0.6, 0);
  p.blendMode = ParticleSystem.BLENDMODE_ADD;
  return p;
}

/** Sacudida corta de cámara (impacto). */
export class Sacudida {
  private fuerza = 0;
  disparar(f = 0.35) {
    this.fuerza = Math.max(this.fuerza, f);
  }
  /** Devuelve el desplazamiento para este cuadro. */
  tomar(dt: number): Vector3 {
    if (this.fuerza <= 0.001) return Vector3.Zero();
    const v = new Vector3((Math.random() - 0.5) * this.fuerza, (Math.random() - 0.5) * this.fuerza, (Math.random() - 0.5) * this.fuerza);
    this.fuerza *= Math.pow(0.02, dt);
    return v;
  }
}
