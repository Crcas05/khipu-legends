// Animales corrompidos por el Bug Ch'aqwa (morados, con ojos brillantes). Atacan a Chaski,
// pero al vencerlos se PURIFICAN: recuperan su color y vuelven tranquilos a su hogar.
// (El juego no enseña a odiar animales: son víctimas del Bug, y muchos están protegidos.)

import { esquivoElGolpe, invulnerable } from "./movimiento";
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
  /** Ataque con aviso: acecha → avisa (se agacha, marca roja) → ataca → se recupera. */
  fase: "acecho" | "aviso" | "ataque" | "recupera";
  faseT: number;
  objetivo: Vector3;
  origen: Vector3;
  marca: Mesh | null;
}

export interface ContextoFieras {
  escena: Scene;
  jugador: () => Vector3;
  /** El jugador recibe daño. */
  dano: (n: number) => void;
  aviso: (t: string, ms?: number) => void;
  alPurificar?: (f: Fiera) => void;
  /** Premio por esquivar un ataque en el momento justo. */
  premio?: (kallpa: number) => void;
  limite?: number;
}

/** Cómo avisa y ataca cada animal (lo que haría en la naturaleza al cazar). */
const ATAQUE: Record<Especie, { tipo: "salto" | "mordida" | "barrido" | "picada"; alcance: number; aviso: number; radio: number; consejo: string }> = {
  // El puma y el otorongo acechan, se agachan y saltan sobre su presa
  puma: { tipo: "salto", alcance: 6, aviso: 0.9, radio: 1.7, consejo: "🐆 ¡El puma se agacha para saltar! RUEDA 💨 a un lado" },
  otorongo: { tipo: "salto", alcance: 6.5, aviso: 0.85, radio: 1.8, consejo: "🐆 ¡El otorongo va a saltar! RUEDA 💨 a un lado" },
  zorro: { tipo: "mordida", alcance: 2.2, aviso: 0.45, radio: 1.7, consejo: "🦊 El zorro muerde rápido: SALTA ⤴ o RUEDA 💨 cuando gruña" },
  // La anaconda no muerde de frente: se enrolla y barre el suelo con su cuerpo
  anaconda: { tipo: "barrido", alcance: 3.4, aviso: 1.0, radio: 3.3, consejo: "🐍 ¡La anaconda barre el suelo! SALTA ⤴ por encima" },
  condor: { tipo: "picada", alcance: 99, aviso: 1.1, radio: 1.7, consejo: "🦅 ¡Mira la sombra en el suelo! Sal de ella RODANDO 💨" },
  murcielago: { tipo: "picada", alcance: 99, aviso: 0.6, radio: 1.4, consejo: "🦇 Los murciélagos bajan rápido: mira su sombra" },
};
const consejosDados = new Set<Especie>();

const MORADO = Color3.FromHexString("#7a2fd6");

export class Fieras {
  lista: Fiera[] = [];
  private tiempo = 0;
  constructor(private c: ContextoFieras) {}

  get vivas() {
    return this.lista.filter((f) => !f.purificada);
  }

  private armar(especie: Especie): Omit<Fiera, "vida" | "t" | "golpeHasta" | "quietoHasta" | "purificada" | "huida" | "dir" | "picada" | "fase" | "faseT" | "objetivo" | "origen" | "marca"> {
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
    const f: Fiera = {
      ...base,
      vida: DATOS[especie].vida,
      t: Math.random() * 6,
      golpeHasta: 0,
      quietoHasta: 0,
      purificada: false,
      huida: 0,
      dir: 0,
      picada: 2 + Math.random() * 3,
      fase: "acecho",
      faseT: 1 + Math.random(),
      objetivo: donde.clone(),
      origen: donde.clone(),
      marca: null,
    };
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
    this.quitarMarca(f);
    f.raiz.scaling.setAll(1);
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
        if (this.tiempo < f.quietoHasta) {
          r.rotation.y += dt * 2;
          // Enredado por el liwi: se cancela su ataque
          if (f.fase === "aviso" || f.fase === "ataque") {
            this.quitarMarca(f);
            f.fase = "recupera";
            f.faseT = 0.6;
            r.scaling.y = 1;
          }
        }
        continue;
      }
      this.comportamiento(f, p, dt);
      const lim = this.c.limite ?? 40;
      const h = Math.hypot(r.position.x, r.position.z);
      if (h > lim) {
        r.position.x *= lim / h;
        r.position.z *= lim / h;
      }
    }
  }

  /** Marca roja en el suelo: "aquí va a caer el ataque". */
  private ponerMarca(f: Fiera, donde: Vector3, radio: number, color: string) {
    this.quitarMarca(f);
    const m = MeshBuilder.CreateDisc("marca-ataque", { radius: radio, tessellation: 32 }, this.c.escena);
    m.rotation.x = Math.PI / 2;
    m.position.set(donde.x, 0.06, donde.z);
    m.isPickable = false;
    const mat = new StandardMaterial("m-marca-ataque", this.c.escena);
    mat.diffuseColor = Color3.Black();
    mat.emissiveColor = Color3.FromHexString(color);
    mat.alpha = 0.25;
    mat.disableLighting = true;
    mat.backFaceCulling = false;
    m.material = mat;
    m.scaling.setAll(0.2);
    f.marca = m;
  }

  private quitarMarca(f: Fiera) {
    if (!f.marca) return;
    f.marca.material?.dispose();
    f.marca.dispose();
    f.marca = null;
  }

  /** Si el golpe le llega o Chaski lo esquivó a tiempo (¡premio!). */
  private impacto(f: Fiera, alcanza: boolean) {
    const d = DATOS[f.especie];
    if (!alcanza) {
      // Lo esquivó saliendo del área: ¡esquive perfecto!
      if (invulnerable() || Vector3.Distance(this.c.jugador(), f.objetivo) < ATAQUE[f.especie].radio + 2.5) this.perfecto();
      return;
    }
    if (esquivoElGolpe()) this.perfecto();
    else this.c.dano(d.dano);
  }

  private ultimoPerfecto = -9;
  private perfecto() {
    if (this.tiempo - this.ultimoPerfecto < 1) return;
    this.ultimoPerfecto = this.tiempo;
    this.c.premio?.(2);
    const t = document.createElement("div");
    t.className = "dano esquive perfecto";
    t.textContent = "¡ESQUIVE PERFECTO! +2 ⚡";
    document.body.appendChild(t);
    window.setTimeout(() => t.remove(), 1200);
  }

  private comportamiento(f: Fiera, p: Vector3, dt: number) {
    const r = f.raiz;
    const d = DATOS[f.especie];
    const at = ATAQUE[f.especie];
    const dx = p.x - r.position.x;
    const dz = p.z - r.position.z;
    const dist = Math.hypot(dx, dz);
    f.faseT -= dt;

    if (d.vuela) {
      if (f.fase === "acecho") {
        // Vuela en círculos sobre Chaski
        const alto = f.especie === "murcielago" ? 2.8 : 6;
        r.position.y += (alto - r.position.y) * Math.min(1, dt);
        const meta = p.add(new Vector3(Math.sin(f.t * 0.8) * 7, 0, Math.cos(f.t * 0.8) * 7));
        this.avanzar(r, meta, d.vel, dt);
        if (f.picada > 0) f.picada -= dt;
        else {
          // Elige dónde caer: su sombra aparece en el suelo
          f.fase = "aviso";
          f.faseT = at.aviso;
          f.objetivo = p.clone();
          f.origen = r.position.clone();
          this.ponerMarca(f, f.objetivo, at.radio, "#ff3355");
          rugido(d.sonido);
          this.consejo(f);
        }
      } else if (f.fase === "aviso") {
        const k = 1 - Math.max(0, f.faseT) / at.aviso;
        f.marca?.scaling.setAll(0.3 + k * 0.7);
        if (f.marca) (f.marca.material as StandardMaterial).alpha = 0.2 + k * 0.35;
        r.position.y += (r.position.y < 8 ? 2 : 0) * dt; // toma altura antes de bajar
        r.rotation.y = Math.atan2(f.objetivo.x - r.position.x, f.objetivo.z - r.position.z);
        if (f.faseT <= 0) {
          f.fase = "ataque";
          f.faseT = 0.45;
          f.origen = r.position.clone();
        }
      } else if (f.fase === "ataque") {
        const k = 1 - Math.max(0, f.faseT) / 0.45;
        const q = Vector3.Lerp(f.origen, f.objetivo.add(new Vector3(0, 1.1, 0)), k);
        r.position.copyFrom(q);
        if (f.faseT <= 0) {
          this.quitarMarca(f);
          this.impacto(f, Math.hypot(p.x - f.objetivo.x, p.z - f.objetivo.z) < at.radio);
          estallido(this.c.escena, f.objetivo.add(new Vector3(0, 0.2, 0)), ["#c9a77a", "#e8d5b0"], 20, 3);
          f.fase = "recupera";
          f.faseT = 1.4; // ¡momento para contraatacar! queda bajito
        }
      } else {
        r.position.y += (2 - r.position.y) * Math.min(1, dt * 2);
        if (f.faseT <= 0) {
          f.fase = "acecho";
          f.picada = 2.5 + Math.random() * 3;
        }
      }
    } else if (f.fase === "acecho") {
      r.rotation.y = Math.atan2(dx, dz);
      r.scaling.y = 1;
      // Se acerca hasta su distancia de ataque (el felino acecha a unos pasos, no pegado)
      const cerca = at.tipo === "salto" ? at.alcance - 1 : at.alcance - 0.6;
      if (dist > cerca) this.avanzar(r, p, d.vel, dt);
      r.position.y = f.especie === "anaconda" ? 0 : Math.abs(Math.sin(f.t * 8)) * 0.1;
      if (dist < at.alcance && f.faseT <= 0) {
        f.fase = "aviso";
        f.faseT = at.aviso;
        f.objetivo = at.tipo === "barrido" ? r.position.clone() : p.clone();
        f.origen = r.position.clone();
        // Marca donde va a caer el golpe
        this.ponerMarca(f, f.objetivo, at.radio, at.tipo === "barrido" ? "#ffb000" : "#ff3355");
        rugido(d.sonido);
        this.consejo(f);
      }
    } else if (f.fase === "aviso") {
      const k = 1 - Math.max(0, f.faseT) / at.aviso;
      f.marca?.scaling.setAll(0.3 + k * 0.7);
      if (f.marca) (f.marca.material as StandardMaterial).alpha = 0.2 + k * 0.35;
      r.rotation.y = Math.atan2(f.objetivo.x - r.position.x, f.objetivo.z - r.position.z) + (at.tipo === "barrido" ? Math.sin(f.t * 30) * 0.15 : 0);
      // Se agacha (felino), gruñe (zorro) o se levanta (anaconda)
      if (at.tipo === "barrido") r.position.y = k * 0.5;
      else r.scaling.y = 1 - k * 0.3;
      if (f.faseT <= 0) {
        f.fase = "ataque";
        f.faseT = at.tipo === "salto" ? 0.5 : at.tipo === "barrido" ? 0.35 : 0.2;
        r.scaling.y = 1;
      }
    } else if (f.fase === "ataque") {
      const largo = at.tipo === "salto" ? 0.5 : at.tipo === "barrido" ? 0.35 : 0.2;
      const k = 1 - Math.max(0, f.faseT) / largo;
      if (at.tipo === "salto") {
        // Salto en arco hacia donde estaba Chaski
        const q = Vector3.Lerp(f.origen, f.objetivo, k);
        r.position.set(q.x, Math.sin(k * Math.PI) * 2.2, q.z);
      } else if (at.tipo === "barrido") {
        r.rotation.y += dt * 18; // el cuerpo gira barriendo el suelo
        r.position.y = 0;
      } else {
        const q = Vector3.Lerp(f.origen, f.objetivo, k * 0.6);
        r.position.x = q.x;
        r.position.z = q.z;
      }
      if (f.faseT <= 0) {
        this.quitarMarca(f);
        const centro = f.objetivo;
        this.impacto(f, Math.hypot(p.x - centro.x, p.z - centro.z) < at.radio);
        if (at.tipo === "salto") estallido(this.c.escena, centro.add(new Vector3(0, 0.2, 0)), ["#c9a77a", "#e8d5b0"], 22, 3);
        r.position.y = 0;
        f.fase = "recupera";
        f.faseT = at.tipo === "mordida" ? 0.7 : 1.3; // queda cansado: ¡ataca ahora!
      }
    } else {
      r.position.y = 0;
      r.scaling.y = 1 - Math.sin(f.t * 5) * 0.03; // jadea
      if (f.faseT <= 0) {
        f.fase = "acecho";
        f.faseT = 0.8 + Math.random() * 1.2;
      }
    }
  }

  private avanzar(r: TransformNode, meta: Vector3, vel: number, dt: number) {
    const vx = meta.x - r.position.x;
    const vz = meta.z - r.position.z;
    const lv = Math.hypot(vx, vz) || 1;
    r.position.x += (vx / lv) * vel * dt;
    r.position.z += (vz / lv) * vel * dt;
  }

  private consejo(f: Fiera) {
    if (consejosDados.has(f.especie)) return;
    consejosDados.add(f.especie);
    this.c.aviso(ATAQUE[f.especie].consejo, 2600);
  }

  limpiar() {
    for (const f of this.lista) this.quitarMarca(f);
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
