// Clima dramático: sol, nublado, lluvia, tormenta (con relámpagos y truenos) y granizo.
// Se activa en las escenas de acción (oleadas, jefes, emboscadas) y vuelve el sol al ganar.

import { Scene } from "@babylonjs/core/scene";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import "@babylonjs/core/Particles/particleSystemComponent";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import type { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import type { Camera } from "@babylonjs/core/Cameras/camera";
import { trueno, lluviaSonido } from "./sonido";

export type Tiempo = "sol" | "nublado" | "lluvia" | "tormenta" | "granizo";

function texturaGota(escena: Scene, granizo: boolean) {
  const t = new DynamicTexture(granizo ? "tx-granizo" : "tx-gota", { width: 32, height: 64 }, escena, false);
  const c = t.getContext() as CanvasRenderingContext2D;
  c.clearRect(0, 0, 32, 64);
  if (granizo) {
    const g = c.createRadialGradient(16, 32, 1, 16, 32, 12);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(1, "rgba(220,235,255,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 32, 64);
  } else {
    const g = c.createLinearGradient(0, 0, 0, 64);
    g.addColorStop(0, "rgba(200,225,255,0)");
    g.addColorStop(1, "rgba(220,235,255,.9)");
    c.fillStyle = g;
    c.fillRect(14, 0, 4, 64);
  }
  t.update();
  t.hasAlpha = true;
  return t;
}

export class Clima {
  actual: Tiempo = "sol";
  private lluvia: ParticleSystem;
  private granizo: ParticleSystem;
  private brillo = 1;
  private meta = 1;
  private proximoRayo = 0;
  private flash = 0;
  private base: { cielo: number; sol: number; niebla: Color3 | null } | null = null;
  private velo: HTMLElement;

  constructor(
    private escena: Scene,
    private camara: Camera,
    private cielo: HemisphericLight,
    private sol: DirectionalLight,
    private sacudir: (f: number) => void
  ) {
    const crear = (nombre: string, granizo: boolean) => {
      const p = new ParticleSystem(nombre, granizo ? 900 : 2200, escena);
      p.particleTexture = texturaGota(escena, granizo);
      p.emitter = Vector3.Zero();
      p.minEmitBox = new Vector3(-22, 14, -22);
      p.maxEmitBox = new Vector3(22, 16, 22);
      p.direction1 = new Vector3(granizo ? -0.5 : -1.5, -24, -0.5);
      p.direction2 = new Vector3(granizo ? 0.5 : -0.5, -30, 0.5);
      p.minEmitPower = 1;
      p.maxEmitPower = 1;
      p.minLifeTime = 0.55;
      p.maxLifeTime = 0.7;
      p.minSize = granizo ? 0.18 : 0.09;
      p.maxSize = granizo ? 0.3 : 0.14;
      p.minScaleY = granizo ? 1 : 6;
      p.maxScaleY = granizo ? 1 : 9;
      p.color1 = new Color4(0.9, 0.95, 1, 0.9);
      p.color2 = new Color4(0.8, 0.88, 1, 0.75);
      p.colorDead = new Color4(0.8, 0.9, 1, 0);
      p.blendMode = ParticleSystem.BLENDMODE_STANDARD;
      p.billboardMode = ParticleSystem.BILLBOARDMODE_STRETCHED;
      p.emitRate = 0;
      p.start();
      return p;
    };
    this.lluvia = crear("lluvia", false);
    this.granizo = crear("granizo", true);
    this.velo = document.createElement("div");
    this.velo.id = "relampago";
    document.body.appendChild(this.velo);
    escena.onBeforeRenderObservable.add(() => this.actualizar());
  }

  /** Cambia el tiempo (con transición suave). */
  poner(t: Tiempo) {
    if (t === this.actual) return;
    this.actual = t;
    if (!this.base) this.base = { cielo: this.cielo.intensity, sol: this.sol.intensity, niebla: this.escena.fogColor?.clone() ?? null };
    this.meta = t === "sol" ? 1 : t === "nublado" ? 0.78 : t === "lluvia" ? 0.62 : t === "granizo" ? 0.66 : 0.45;
    this.lluvia.emitRate = t === "lluvia" ? 900 : t === "tormenta" ? 1800 : 0;
    this.granizo.emitRate = t === "granizo" ? 520 : 0;
    lluviaSonido(t === "lluvia" ? 0.7 : t === "tormenta" ? 1 : t === "granizo" ? 0.9 : 0, t === "granizo");
    document.body.dataset.clima = t;
    this.proximoRayo = performance.now() + 1500;
    if (t === "tormenta") window.setTimeout(() => this.relampago(true), 600);
  }

  /** Un rayo: destello blanco, sacudida y trueno. */
  relampago(cerca = Math.random() < 0.5) {
    this.flash = 1;
    this.velo.classList.remove("on");
    void this.velo.offsetWidth;
    this.velo.classList.add("on");
    if (cerca) this.sacudir(0.35);
    trueno(cerca);
  }

  /** Vuelve el sol al instante (al cambiar de lugar). */
  forzarSol() {
    if (this.base) {
      this.cielo.intensity = this.base.cielo;
      this.sol.intensity = this.base.sol;
      if (this.base.niebla) this.escena.fogColor = this.base.niebla;
    }
    this.base = null;
    this.brillo = this.meta = 1;
    this.actual = "sol";
    this.lluvia.emitRate = 0;
    this.granizo.emitRate = 0;
    this.lluvia.reset();
    this.granizo.reset();
    lluviaSonido(0);
    document.body.dataset.clima = "sol";
  }

  /** Al salir de una región se recuerda la luz normal de la nueva. */
  reiniciarBase() {
    this.base = null;
  }

  private actualizar() {
    const dt = this.escena.getEngine().getDeltaTime() / 1000;
    const p = this.camara.position;
    (this.lluvia.emitter as Vector3).set(p.x, 0, p.z);
    (this.granizo.emitter as Vector3).set(p.x, 0, p.z);
    this.brillo += (this.meta - this.brillo) * Math.min(1, dt * 0.8);
    this.flash = Math.max(0, this.flash - dt * 3);
    if (this.base) {
      const k = this.brillo + this.flash * 1.5;
      this.cielo.intensity = this.base.cielo * k;
      this.sol.intensity = this.base.sol * Math.max(0.15, this.brillo * this.brillo) + this.flash;
      if (this.base.niebla) {
        const gris = new Color3(0.42, 0.45, 0.5);
        this.escena.fogColor = Color3.Lerp(gris, this.base.niebla, Math.min(1, (this.brillo - 0.45) / 0.55)).add(new Color3(this.flash, this.flash, this.flash).scale(0.4));
      }
      if (this.actual === "sol" && Math.abs(this.brillo - 1) < 0.01) {
        this.cielo.intensity = this.base.cielo;
        this.sol.intensity = this.base.sol;
        if (this.base.niebla) this.escena.fogColor = this.base.niebla;
        this.base = null;
      }
    }
    if (this.actual === "tormenta" && performance.now() > this.proximoRayo) {
      this.proximoRayo = performance.now() + 5000 + Math.random() * 7000;
      this.relampago();
    }
  }
}

/** Acceso global (lo crea main): cualquier escena puede pedir lluvia o tormenta. */
let global: Clima | null = null;
export function registrarClima(c: Clima) {
  global = c;
}
export function ponerClima(t: Tiempo) {
  global?.poner(t);
}
export function rayo() {
  global?.relampago(true);
}
