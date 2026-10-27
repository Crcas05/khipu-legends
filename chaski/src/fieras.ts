// Animales corrompidos por el Bug Ch'aqwa (morados, con ojos brillantes). Atacan a Chaski,
// pero al vencerlos se PURIFICAN: recuperan su color y vuelven tranquilos a su hogar.
// (El juego no enseña a odiar animales: son víctimas del Bug, y muchos están protegidos.)

import { esquivoElGolpe } from "./movimiento";
import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { estallido } from "./efectos";
import { sonido, rugido } from "./sonido";

export type Especie = "puma" | "zorro" | "condor" | "otorongo" | "anaconda" | "murcielago";

export const NOMBRE_ESPECIE: Record<Especie, string> = {
  puma: "puma",
  zorro: "zorro andino",
  condor: "cóndor",
  otorongo: "otorongo",
  anaconda: "anaconda",
  murcielago: "murciélago",
};

const DATOS: Record<Especie, { vida: number; vel: number; vuela: boolean; dano: number; sonido: "felino" | "ave" | "serpiente" | "murcielago" | "zorro" }> = {
  puma: { vida: 4, vel: 3.6, vuela: false, dano: 12, sonido: "felino" },
  zorro: { vida: 2, vel: 4.2, vuela: false, dano: 7, sonido: "zorro" },
  condor: { vida: 3, vel: 5, vuela: true, dano: 10, sonido: "ave" },
  otorongo: { vida: 5, vel: 3.8, vuela: false, dano: 13, sonido: "felino" },
  anaconda: { vida: 6, vel: 1.6, vuela: false, dano: 15, sonido: "serpiente" },
  murcielago: { vida: 1, vel: 5.5, vuela: true, dano: 5, sonido: "murcielago" },
};

export interface Fiera {
  especie: Especie;
  raiz: TransformNode;
  vida: number;
  t: number;
  golpeHasta: number;
  quietoHasta: number;
  purificada: boolean;
  huida: number;
  dir: number;
  /** Materiales: [color normal, material] para volver a la normalidad al purificarla. */
  colores: [StandardMaterial, Color3][];
  ojos: StandardMaterial;
  picada: number;
}

export interface ContextoFieras {
  escena: Scene;
  jugador: () => Vector3;
  /** El jugador recibe daño. */
  dano: (n: number) => void;
  aviso: (t: string, ms?: number) => void;
  alPurificar?: (f: Fiera) => void;
  limite?: number;
}

const MORADO = Color3.FromHexString("#7a2fd6");

export class Fieras {
  lista: Fiera[] = [];
  private tiempo = 0;
  constructor(private c: ContextoFieras) {}

  get vivas() {
    return this.lista.filter((f) => !f.purificada);
  }

  private armar(especie: Especie): Omit<Fiera, "vida" | "t" | "golpeHasta" | "quietoHasta" | "purificada" | "huida" | "dir" | "picada"> {
    const e = this.c.escena;
    const raiz = new TransformNode(`fiera-${especie}`, e);
    const colores: [StandardMaterial, Color3][] = [];
    const mat = (hex: string) => {
      const m = new StandardMaterial(`m-${especie}-${hex}`, e);
      const normal = Color3.FromHexString(hex);
      m.diffuseColor = Color3.Lerp(normal, MORADO, 0.75);
      m.emissiveColor = MORADO.scale(0.35);
      m.specularColor = new Color3(0.05, 0.05, 0.05);
      colores.push([m, normal]);
      return m;
    };
    const ojos = new StandardMaterial(`m-${especie}-ojos`, e);
    ojos.emissiveColor = new Color3(1, 0.2, 0.9);
    ojos.disableLighting = true;
    const p = (m: Mesh, material: StandardMaterial, x: number, y: number, z: number) => {
      m.material = material;
      m.parent = raiz;
      m.position.set(x, y, z);
      m.isPickable = false;
      return m;
    };
    const ojosPar = (y: number, z: number, sep: number, d = 0.12) => {
      for (const l of [-1, 1]) p(MeshBuilder.CreateSphere("ojo-fiera", { diameter: d, segments: 6 }, e), ojos, sep * l, y, z);
    };
    if (especie === "puma" || especie === "otorongo" || especie === "zorro") {
      const piel = mat(especie === "puma" ? "#b98a52" : especie === "otorongo" ? "#d9a23a" : "#a5653a");
      const esc = especie === "zorro" ? 0.7 : 1;
      const cuerpo = p(MeshBuilder.CreateSphere("cuerpo", { diameter: 1 }, e), piel, 0, 0.75 * esc, 0);
      cuerpo.scaling.set(0.65 * esc, 0.6 * esc, 1.6 * esc);
      p(MeshBuilder.CreateSphere("cabeza", { diameter: 0.6 * esc }, e), piel, 0, 1.05 * esc, 0.85 * esc);
      if (especie === "zorro") {
        const hocico = p(MeshBuilder.CreateCylinder("hocico", { height: 0.4, diameterTop: 0.05, diameterBottom: 0.25 }, e), piel, 0, 0.95 * esc, 1.15 * esc);
        hocico.rotation.x = Math.PI / 2;
        for (const l of [-1, 1]) p(MeshBuilder.CreateCylinder("oreja", { height: 0.3, diameterTop: 0, diameterBottom: 0.16 }, e), piel, 0.14 * l, 1.32 * esc, 0.82 * esc);
        p(MeshBuilder.CreateSphere("cola", { diameter: 0.45 }, e), mat("#e8d8c0"), 0, 0.75 * esc, -1.05 * esc).scaling.set(0.7, 0.7, 1.6);
      } else {
        for (const l of [-1, 1]) p(MeshBuilder.CreateSphere("oreja", { diameter: 0.18 }, e), piel, 0.2 * l, 1.32, 0.8);
        const cola = p(MeshBuilder.CreateCylinder("cola", { height: 1.1, diameter: 0.12 }, e), piel, 0, 0.9, -1.25);
        cola.rotation.x = 1.0;
        if (especie === "otorongo") {
          const manchas = mat("#2a1a0a");
          for (let i = 0; i < 14; i++) p(MeshBuilder.CreateSphere("mancha", { diameter: 0.13 }, e), manchas, Math.sin(i * 2.3) * 0.3, 0.75 + Math.cos(i * 3.1) * 0.25, -0.6 + i * 0.09);
        }
      }
      ojosPar(1.12 * esc, 1.13 * esc, 0.13 * esc);
      for (const l of [-1, 1]) for (const f of [-1, 1]) p(MeshBuilder.CreateCylinder("pata", { height: 0.6 * esc, diameter: 0.17 * esc }, e), piel, 0.22 * l * esc, 0.3 * esc, 0.5 * f * esc);
    } else if (especie === "condor") {
      const negro = mat("#1f1f24");
      const blanco = mat("#f2f2f2");
      const cuerpo = p(MeshBuilder.CreateSphere("cuerpo", { diameter: 1 }, e), negro, 0, 0, 0);
      cuerpo.scaling.set(0.8, 0.6, 1.4);
      p(MeshBuilder.CreateTorus("collar", { diameter: 0.55, thickness: 0.15 }, e), blanco, 0, 0.2, 0.55).rotation.x = Math.PI / 2.4;
      p(MeshBuilder.CreateSphere("cabeza", { diameter: 0.45 }, e), mat("#c46a5a"), 0, 0.3, 0.8);
      ojosPar(0.38, 0.98, 0.1, 0.09);
      for (const l of [-1, 1]) {
        const ala = p(MeshBuilder.CreateBox("ala", { width: 2.6, height: 0.06, depth: 0.8 }, e), negro, 1.4 * l, 0.1, 0);
        ala.metadata = { ala: l };
        p(MeshBuilder.CreateBox("punta", { width: 0.6, height: 0.07, depth: 0.6 }, e), blanco, 2.7 * l, 0.1, -0.1).metadata = { ala: l };
      }
    } else if (especie === "murcielago") {
      const piel = mat("#3a2a2a");
      p(MeshBuilder.CreateSphere("cuerpo", { diameter: 0.45 }, e), piel, 0, 0, 0);
      ojosPar(0.08, 0.2, 0.08, 0.07);
      for (const l of [-1, 1]) p(MeshBuilder.CreateBox("ala", { width: 0.8, height: 0.03, depth: 0.4 }, e), piel, 0.5 * l, 0, 0).metadata = { ala: l };
    } else {
      // Anaconda: segmentos que ondulan
      const verde = mat("#3f5a2a");
      const manchas = mat("#1a2412");
      for (let i = 0; i < 9; i++) {
        const s = p(MeshBuilder.CreateSphere("segmento", { diameter: 0.55 - i * 0.03, segments: 8 }, e), i % 2 ? manchas : verde, 0, 0.28, -i * 0.42);
        s.metadata = { seg: i };
      }
      const cabeza = p(MeshBuilder.CreateSphere("cabeza", { diameter: 0.5 }, e), verde, 0, 0.32, 0.38);
      cabeza.scaling.set(1, 0.7, 1.3);
      ojosPar(0.45, 0.6, 0.13, 0.09);
    }
    return { especie, raiz, colores, ojos };
  }

  aparecer(especie: Especie, donde: Vector3) {
    const base = this.armar(especie);
    base.raiz.position.copyFrom(donde);
    if (DATOS[especie].vuela) base.raiz.position.y = 7;
    const f: Fiera = { ...base, vida: DATOS[especie].vida, t: Math.random() * 6, golpeHasta: 0, quietoHasta: 0, purificada: false, huida: 0, dir: 0, picada: 2 + Math.random() * 3 };
    this.lista.push(f);
    estallido(this.c.escena, donde.add(new Vector3(0, 1, 0)), ["#b388ff", "#8b3dff", "#2a0a5e"], 50, 6);
    rugido(DATOS[especie].sonido);
    return f;
  }

  /** La más cercana al jugador (para apuntar). */
  masCercana(desde: Vector3, alcance: number): Fiera | null {
    let mejor: Fiera | null = null;
    let d = alcance;
    for (const f of this.vivas) {
      const dd = Vector3.Distance(desde, f.raiz.position);
      if (dd < d) [d, mejor] = [dd, f];
    }
    return mejor;
  }

  cercanas(desde: Vector3, radio: number) {
    return this.vivas.filter((f) => Math.hypot(f.raiz.position.x - desde.x, f.raiz.position.z - desde.z) < radio);
  }

  golpear(f: Fiera, n = 1, aturde = 0) {
    if (f.purificada) return;
    f.vida -= n;
    f.golpeHasta = this.tiempo + 0.2;
    if (aturde) {
      f.quietoHasta = this.tiempo + aturde;
      this.c.aviso(`🪢 ¡El liwi enredó al ${NOMBRE_ESPECIE[f.especie]}!`, 1400);
    }
    estallido(this.c.escena, f.raiz.position.add(new Vector3(0, 0.8, 0)), ["#b388ff", "#ffffff"], 30, 4);
    sonido.kallpa();
    if (f.vida <= 0) this.purificar(f);
  }

  private purificar(f: Fiera) {
    f.purificada = true;
    for (const [m, normal] of f.colores) {
      m.diffuseColor = normal;
      m.emissiveColor = normal.scale(0.08);
    }
    f.ojos.emissiveColor = new Color3(0.1, 0.1, 0.1);
    f.dir = Math.atan2(f.raiz.position.x - this.c.jugador().x, f.raiz.position.z - this.c.jugador().z);
    estallido(this.c.escena, f.raiz.position.add(new Vector3(0, 1, 0)), ["#7dffb0", "#ffffff", "#ffd166"], 90, 7);
    sonido.tesoro();
    this.c.aviso(`✨ ¡Purificaste al ${NOMBRE_ESPECIE[f.especie]}! Vuelve tranquilo a su hogar.`, 2200);
    this.c.alPurificar?.(f);
  }

  actualizar(dt: number, quieto: boolean) {
    this.tiempo += dt;
    const p = this.c.jugador();
    for (const f of [...this.lista]) {
      f.t += dt;
      const r = f.raiz;
      const d = DATOS[f.especie];
      // Aleteo
      for (const m of r.getChildMeshes(true)) {
        const meta = m.metadata as { ala?: number; seg?: number } | null;
        if (meta?.ala) m.rotation.z = Math.sin(f.t * (f.especie === "murcielago" ? 22 : 6)) * 0.5 * meta.ala;
        if (meta?.seg !== undefined) m.position.x = Math.sin(f.t * 4 - meta.seg * 0.7) * 0.25;
      }
      r.scaling.setAll(this.tiempo < f.golpeHasta ? 1.2 : 1);
      if (f.purificada) {
        f.huida += dt;
        r.position.x += Math.sin(f.dir) * d.vel * 1.2 * dt;
        r.position.z += Math.cos(f.dir) * d.vel * 1.2 * dt;
        if (d.vuela) r.position.y += dt * 3;
        r.rotation.y = f.dir;
        if (f.huida > 5) {
          r.dispose();
          this.lista.splice(this.lista.indexOf(f), 1);
        }
        continue;
      }
      if (quieto || this.tiempo < f.quietoHasta) {
        if (this.tiempo < f.quietoHasta) r.rotation.y += dt * 2;
        continue;
      }
      const dx = p.x - r.position.x;
      const dz = p.z - r.position.z;
      const dist = Math.hypot(dx, dz);
      r.rotation.y = Math.atan2(dx, dz);
      if (d.vuela) {
        // Vuela en círculos y baja en picada
        f.picada -= dt;
        const enPicada = f.picada < 0;
        const alto = enPicada ? 1.4 : f.especie === "murcielago" ? 2.6 : 6;
        r.position.y += (alto - r.position.y) * Math.min(1, dt * (enPicada ? 3 : 1));
        const meta = enPicada ? p : p.add(new Vector3(Math.sin(f.t * 0.8) * 7, 0, Math.cos(f.t * 0.8) * 7));
        const vx = meta.x - r.position.x;
        const vz = meta.z - r.position.z;
        const lv = Math.hypot(vx, vz) || 1;
        r.position.x += (vx / lv) * d.vel * dt;
        r.position.z += (vz / lv) * d.vel * dt;
        if (enPicada && dist < 1.4 && r.position.y < 2.2) {
          if (!esquivoElGolpe()) this.c.dano(d.dano);
          f.picada = 3 + Math.random() * 3;
          rugido(d.sonido);
        }
        if (f.picada < -3) f.picada = 2 + Math.random() * 2;
      } else {
        if (dist > 1.3) {
          r.position.x += (dx / dist) * d.vel * dt;
          r.position.z += (dz / dist) * d.vel * dt;
        }
        r.position.y = f.especie === "anaconda" ? 0 : Math.abs(Math.sin(f.t * 8)) * 0.12;
        if (dist < 1.6 && Math.floor(f.t / 1.1) !== Math.floor((f.t - dt) / 1.1)) {
          if (!esquivoElGolpe()) this.c.dano(d.dano);
          rugido(d.sonido);
        }
      }
      const lim = this.c.limite ?? 40;
      const h = Math.hypot(r.position.x, r.position.z);
      if (h > lim) {
        r.position.x *= lim / h;
        r.position.z *= lim / h;
      }
    }
  }

  limpiar() {
    for (const f of this.lista) f.raiz.dispose();
    this.lista = [];
  }
}

/** Animales de cada ambiente. */
export const FIERAS_DE: Record<string, Especie[]> = {
  templo: ["puma", "zorro", "puma"],
  puna: ["condor", "zorro", "condor"],
  selva: ["otorongo", "anaconda", "murcielago", "murcielago"],
  plaza: ["zorro", "puma"],
};
