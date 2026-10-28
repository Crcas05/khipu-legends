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
import { crearModelo, type Modelo } from "./modelos";
import { sonido, rugido } from "./sonido";

export type Especie = "puma" | "zorro" | "condor" | "otorongo" | "anaconda" | "murcielago" | "jarjacha";

export const NOMBRE_ESPECIE: Record<Especie, string> = {
  puma: "puma",
  zorro: "zorro andino",
  condor: "cóndor",
  otorongo: "otorongo",
  anaconda: "anaconda",
  murcielago: "murciélago",
  jarjacha: "Jarjacha",
};

const DATOS: Record<Especie, { vida: number; vel: number; vuela: boolean; dano: number; sonido: "felino" | "ave" | "serpiente" | "murcielago" | "zorro" | "jarjacha" }> = {
  // Ser de leyenda (no es un animal): se espanta y huye a la neblina
  jarjacha: { vida: 8, vel: 3.3, vuela: false, dano: 15, sonido: "jarjacha" },
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
  /** Modelo 3D animado (el zorro usa un modelo real con caminar y correr). */
  modelo?: Modelo | null;
  /** Patas del cuerpo armado (para animar la marcha). */
  patas?: { nodo: TransformNode; fase: number }[];
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
  jarjacha: { tipo: "salto", alcance: 7.5, aviso: 1.1, radio: 2.1, consejo: "🌫 ¡«Qar… qar…»! La Jarjacha embiste desde la neblina: ¡RUEDA 💨 a un lado!" },
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
    const patas: { nodo: TransformNode; fase: number }[] = [];
    /** Pata con muslo y canilla (el nodo gira en la cadera para caminar). */
    const pata = (x: number, y: number, z: number, largo: number, grosor: number, matP: StandardMaterial, fase: number) => {
      const nodo = new TransformNode("cadera", e);
      nodo.parent = raiz;
      nodo.position.set(x, y, z);
      const muslo = MeshBuilder.CreateCapsule("muslo", { height: largo * 0.6, radius: grosor, tessellation: 8 }, e);
      p(muslo, matP, 0, -largo * 0.25, 0).parent = nodo;
      const canilla = MeshBuilder.CreateCapsule("canilla", { height: largo * 0.6, radius: grosor * 0.7, tessellation: 8 }, e);
      p(canilla, matP, 0, -largo * 0.7, -0.04).parent = nodo;
      const pie = MeshBuilder.CreateSphere("pie", { diameter: grosor * 2.4, segments: 6 }, e);
      p(pie, matP, 0, -largo + grosor * 0.6, 0.05).parent = nodo;
      pie.scaling.set(1, 0.6, 1.3);
      patas.push({ nodo, fase });
    };
    if (especie === "puma" || especie === "otorongo" || especie === "zorro") {
      // Felino: cuerpo largo y flexible, cuello, cabeza redonda con hocico, cola larga en curva
      const piel = mat(especie === "puma" ? "#b98a52" : especie === "otorongo" ? "#d9a23a" : "#a5653a");
      const claro = mat(especie === "puma" ? "#e3cba5" : especie === "otorongo" ? "#f2e2b8" : "#e8d8c0");
      const esc = especie === "zorro" ? 0.7 : 1;
      raiz.scaling.setAll(esc);
      const torso = MeshBuilder.CreateCapsule("cuerpo", { height: 1.7, radius: 0.32, tessellation: 12 }, e);
      p(torso, piel, 0, 0.82, -0.05).rotation.x = Math.PI / 2;
      const vientre = MeshBuilder.CreateCapsule("vientre", { height: 1.2, radius: 0.24, tessellation: 10 }, e);
      p(vientre, claro, 0, 0.7, -0.05).rotation.x = Math.PI / 2;
      const hombros = MeshBuilder.CreateSphere("hombros", { diameter: 0.7, segments: 10 }, e);
      p(hombros, piel, 0, 0.92, 0.55);
      const cuello = MeshBuilder.CreateCapsule("cuello", { height: 0.55, radius: 0.18, tessellation: 8 }, e);
      p(cuello, piel, 0, 1.1, 0.78).rotation.x = 0.9;
      const cabeza = MeshBuilder.CreateSphere("cabeza", { diameter: 0.5, segments: 12 }, e);
      p(cabeza, piel, 0, 1.25, 1.02).scaling.set(1, 0.9, 1.05);
      const hocico = MeshBuilder.CreateSphere("hocico", { diameter: 0.28, segments: 8 }, e);
      p(hocico, claro, 0, 1.17, 1.24).scaling.set(1.1, 0.8, 0.9);
      p(MeshBuilder.CreateSphere("nariz", { diameter: 0.08, segments: 6 }, e), mat("#2a1a14"), 0, 1.22, 1.36);
      for (const l of [-1, 1]) {
        const oreja = MeshBuilder.CreateCylinder("oreja", { height: 0.16, diameterTop: 0.02, diameterBottom: 0.15, tessellation: 6 }, e);
        p(oreja, piel, 0.15 * l, 1.47, 0.98).rotation.z = -0.3 * l;
      }
      // Cola larga que cae y sube en la punta
      const cola: Vector3[] = [];
      for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        cola.push(new Vector3(0, 0.85 - Math.sin(t * Math.PI * 0.8) * 0.45 + t * t * 0.3, -0.85 - t * 1.0));
      }
      p(MeshBuilder.CreateTube("cola", { path: cola, radiusFunction: (i) => 0.08 - i * 0.004, tessellation: 8 }, e), piel, 0, 0, 0);
      if (especie === "otorongo") {
        // Rosetas del jaguar
        const manchas = mat("#2a1a0a");
        for (let i = 0; i < 22; i++) {
          const m = MeshBuilder.CreateTorus("roseta", { diameter: 0.13, thickness: 0.035, tessellation: 10 }, e);
          const a = i * 2.39;
          p(m, manchas, Math.sin(a) * 0.3, 0.86 + Math.cos(a * 1.7) * 0.18, -0.75 + (i / 22) * 1.4).rotation.z = Math.PI / 2 * Math.sign(Math.sin(a));
        }
      }
      ojosPar(1.33, 1.2, 0.11, 0.08);
      for (const l of [-1, 1]) {
        pata(0.2 * l, 0.75, 0.55, 0.78, 0.09, piel, l > 0 ? 0 : Math.PI);
        pata(0.2 * l, 0.75, -0.62, 0.8, 0.1, piel, l > 0 ? Math.PI : 0);
      }
    } else if (especie === "jarjacha") {
      // Jarjacha: figura de llama oscura, lana desgreñada, cuello largo y ojos rojos que brillan
      const lana = mat("#2b2630");
      const desgrenada = mat("#3b3440");
      const torso = MeshBuilder.CreateCapsule("cuerpo", { height: 1.5, radius: 0.42, tessellation: 12 }, e);
      p(torso, lana, 0, 1.25, 0).rotation.x = Math.PI / 2;
      for (let i = 0; i < 14; i++) {
        const mecha = MeshBuilder.CreateCylinder("mecha", { height: 0.45, diameterTop: 0.12, diameterBottom: 0.02, tessellation: 5 }, e);
        p(mecha, desgrenada, Math.sin(i * 2.4) * 0.38, 0.95 + Math.cos(i * 1.3) * 0.08, -0.6 + (i / 14) * 1.2).rotation.z = Math.sin(i) * 0.4;
      }
      const cuello = MeshBuilder.CreateCapsule("cuello", { height: 1.1, radius: 0.16, tessellation: 8 }, e);
      p(cuello, lana, 0, 1.9, 0.62).rotation.x = 0.25;
      const cabeza = MeshBuilder.CreateSphere("cabeza", { diameter: 0.42, segments: 10 }, e);
      p(cabeza, lana, 0, 2.45, 0.78).scaling.set(0.9, 0.85, 1.3);
      for (const l of [-1, 1]) {
        const oreja = MeshBuilder.CreateCylinder("oreja", { height: 0.3, diameterTop: 0.02, diameterBottom: 0.1, tessellation: 5 }, e);
        p(oreja, lana, 0.12 * l, 2.72, 0.7).rotation.z = -0.25 * l;
      }
      ojosPar(2.52, 0.98, 0.1, 0.09);
      for (const l of [-1, 1]) {
        pata(0.22 * l, 1.05, 0.5, 1.05, 0.08, lana, l > 0 ? 0 : Math.PI);
        pata(0.22 * l, 1.05, -0.55, 1.05, 0.09, lana, l > 0 ? Math.PI : 0);
      }
    } else if (especie === "condor") {
      // Cóndor andino: cuerpo negro, collar blanco, cabeza calva rojiza, alas enormes con "dedos" de plumas
      const negro = mat("#1f1f24");
      const blanco = mat("#f2f2f2");
      const cuerpo = p(MeshBuilder.CreateCapsule("cuerpo", { height: 1.5, radius: 0.36, tessellation: 12 }, e), negro, 0, 0, 0);
      cuerpo.rotation.x = Math.PI / 2;
      p(MeshBuilder.CreateTorus("collar", { diameter: 0.5, thickness: 0.18, tessellation: 16 }, e), blanco, 0, 0.12, 0.62).rotation.x = Math.PI / 2.3;
      const cuello = p(MeshBuilder.CreateCapsule("cuello", { height: 0.4, radius: 0.08, tessellation: 8 }, e), mat("#8a3a32"), 0, 0.2, 0.82);
      cuello.rotation.x = 1.2;
      p(MeshBuilder.CreateSphere("cabeza", { diameter: 0.3, segments: 10 }, e), mat("#b2564a"), 0, 0.28, 1.0);
      const pico = p(MeshBuilder.CreateCylinder("pico", { height: 0.2, diameterTop: 0.02, diameterBottom: 0.1, tessellation: 6 }, e), mat("#d9c9a0"), 0, 0.24, 1.17);
      pico.rotation.x = 1.9;
      ojosPar(0.34, 1.05, 0.09, 0.06);
      for (const l of [-1, 1]) {
        // Ala: dos tramos y plumas primarias separadas en la punta
        const ala = new TransformNode("ala", e);
        ala.parent = raiz;
        ala.position.set(0.3 * l, 0.12, 0);
        ala.metadata = { ala: l };
        const a1 = MeshBuilder.CreateBox("ala1", { width: 1.5, height: 0.06, depth: 0.85 }, e);
        p(a1, negro, 0.75 * l, 0, 0).parent = ala;
        const banda = MeshBuilder.CreateBox("ala-blanca", { width: 1.2, height: 0.065, depth: 0.3 }, e);
        p(banda, blanco, 0.85 * l, 0.005, -0.18).parent = ala;
        const a2 = MeshBuilder.CreateBox("ala2", { width: 1.1, height: 0.05, depth: 0.7 }, e);
        p(a2, negro, 2.0 * l, 0, -0.05).parent = ala;
        for (let k = 0; k < 5; k++) {
          const pl = MeshBuilder.CreateBox("primaria", { width: 0.6, height: 0.03, depth: 0.1 }, e);
          p(pl, negro, 2.75 * l, 0, 0.22 - k * 0.12).parent = ala;
          pl.rotation.y = (k - 2) * 0.12 * l;
        }
      }
      const cola = p(MeshBuilder.CreateBox("cola", { width: 0.5, height: 0.05, depth: 0.5 }, e), negro, 0, -0.02, -0.95);
      cola.rotation.x = -0.1;
    } else if (especie === "murcielago") {
      const piel = mat("#3a2a2a");
      const membrana = mat("#5a3e3e");
      p(MeshBuilder.CreateCapsule("cuerpo", { height: 0.42, radius: 0.13, tessellation: 8 }, e), piel, 0, 0, 0);
      p(MeshBuilder.CreateSphere("cabeza", { diameter: 0.2, segments: 8 }, e), piel, 0, 0.22, 0.05);
      for (const l of [-1, 1]) {
        p(MeshBuilder.CreateCylinder("oreja", { height: 0.12, diameterTop: 0, diameterBottom: 0.08, tessellation: 5 }, e), piel, 0.06 * l, 0.35, 0.04);
        const ala = MeshBuilder.CreateDisc("ala", { radius: 0.45, tessellation: 5 }, e);
        const ap = p(ala, membrana, 0.42 * l, 0.05, 0);
        ap.rotation.x = Math.PI / 2;
        ap.scaling.set(1.2, 0.7, 1);
        ap.metadata = { ala: l };
        (membrana as StandardMaterial).backFaceCulling = false;
      }
      ojosPar(0.24, 0.14, 0.05, 0.05);
    } else {
      // Anaconda: muchos segmentos pegados que ondulan (se ve como un cuerpo continuo)
      const verde = mat("#3f5a2a");
      const manchas = mat("#1a2412");
      const vientre = mat("#b8b07a");
      const n = 24;
      for (let i = 0; i < n; i++) {
        const d = 0.5 - Math.max(0, i - 4) * 0.016;
        const s = p(MeshBuilder.CreateSphere("segmento", { diameter: d, segments: 8 }, e), verde, 0, d * 0.4, -i * 0.2);
        s.scaling.set(1, 0.75, 1.2);
        s.metadata = { seg: i };
        if (i % 3 === 1) {
          const m = p(MeshBuilder.CreateSphere("mancha", { diameter: d * 0.45, segments: 6 }, e), manchas, 0, d * 0.62, -i * 0.2);
          m.scaling.set(1.2, 0.3, 1);
          m.metadata = { seg: i };
        }
        if (i % 2 === 0) {
          const v = p(MeshBuilder.CreateSphere("vientre", { diameter: d * 0.7, segments: 6 }, e), vientre, 0, d * 0.15, -i * 0.2);
          v.scaling.set(1, 0.3, 1.2);
          v.metadata = { seg: i };
        }
      }
      const cabeza = p(MeshBuilder.CreateSphere("cabeza", { diameter: 0.5, segments: 12 }, e), verde, 0, 0.26, 0.32);
      cabeza.scaling.set(1, 0.6, 1.4);
      ojosPar(0.38, 0.5, 0.15, 0.08);
    }
    if (patas.length) (raiz.metadata ??= {}).patas = patas;
    return { especie, raiz, colores, ojos };
  }

  aparecer(especie: Especie, donde: Vector3) {
    const base = especie === "zorro" ? this.armarZorro() : this.armar(especie);
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
      patas: (base.raiz.metadata as { patas?: { nodo: TransformNode; fase: number }[] } | null)?.patas,
    };
    this.lista.push(f);
    estallido(this.c.escena, donde.add(new Vector3(0, 1, 0)), ["#b388ff", "#8b3dff", "#2a0a5e"], 50, 6);
    rugido(DATOS[especie].sonido);
    return f;
  }

  /** Zorro andino: modelo 3D real (CC0 + rig CC BY, ver Créditos) con caminar, correr y husmear. */
  private armarZorro(): Omit<Fiera, "vida" | "t" | "golpeHasta" | "quietoHasta" | "purificada" | "huida" | "dir" | "picada" | "fase" | "faseT" | "objetivo" | "origen" | "marca"> {
    const e = this.c.escena;
    const raiz = new TransformNode("fiera-zorro", e);
    const colores: [StandardMaterial, Color3][] = [];
    const ojos = new StandardMaterial("m-zorro-ojos", e);
    ojos.emissiveColor = new Color3(1, 0.2, 0.9);
    ojos.disableLighting = true;
    const base = { especie: "zorro" as Especie, raiz, colores, ojos };
    // Ojos brillantes de corrupción (se apagan al purificarlo)
    for (const l of [-1, 1]) {
      const o = MeshBuilder.CreateSphere("ojo-fiera", { diameter: 0.07, segments: 6 }, e);
      o.material = ojos;
      o.parent = raiz;
      o.position.set(0.09 * l, 0.62, 0.62);
    }
    void crearModelo(e, "zorro.glb", raiz, 0.85)
      .then((m) => {
        if (raiz.isDisposed()) return;
        for (const malla of m.mallas) {
          const mat = malla.material as StandardMaterial | null;
          if (!mat) continue;
          const propio = mat.clone(`${mat.name}-${raiz.uniqueId}`);
          const normal = new Color3(1, 1, 1);
          const f = this.lista.find((x) => x.raiz === raiz);
          propio.diffuseColor = f?.purificada ? normal : Color3.Lerp(normal, MORADO, 0.6);
          propio.emissiveColor = f?.purificada ? new Color3(0.2, 0.2, 0.2) : MORADO.scale(0.3);
          malla.material = propio;
          colores.push([propio, normal]);
        }
        const f = this.lista.find((x) => x.raiz === raiz);
        if (f) f.modelo = m;
        (m as unknown as { tocar: (n: string) => void }).tocar("Walk");
      })
      .catch(() => {
        // Sin modelo: usa el zorro armado con formas
        const alt = this.armar("zorro");
        alt.raiz.parent = raiz;
        colores.push(...alt.colores);
      });
    return base;
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
    this.c.aviso(
      f.especie === "jarjacha" ? "🌫 La Jarjacha lanza un último «qar…» y se pierde en la neblina de la puna." : `✨ ¡Purificaste al ${NOMBRE_ESPECIE[f.especie]}! Vuelve tranquilo a su hogar.`,
      2600
    );
    this.c.alPurificar?.(f);
  }

  actualizar(dt: number, quieto: boolean) {
    this.tiempo += dt;
    const p = this.c.jugador();
    for (const f of [...this.lista]) {
      f.t += dt;
      const r = f.raiz;
      const d = DATOS[f.especie];
      // Marcha: patas que se mueven (más rápido al atacar) y el zorro con su animación real
      const corre = f.purificada || f.fase === "ataque";
      const quieta = f.fase === "aviso" || f.fase === "recupera";
      if (f.patas) for (const pt of f.patas) pt.nodo.rotation.x = quieta ? 0 : Math.sin(f.t * (corre ? 16 : 9) + pt.fase) * (corre ? 0.7 : 0.45);
      if (f.modelo) (f.modelo as unknown as { tocar: (n: string) => void }).tocar(corre ? "Run" : quieta ? "Survey" : "Walk");
      // Aleteo
      for (const m of r.getChildren() as TransformNode[]) {
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
  puna: ["condor", "zorro", "condor", "jarjacha"],
  selva: ["otorongo", "anaconda", "murcielago", "murcielago"],
  plaza: ["zorro", "puma"],
  costa: ["zorro", "condor", "zorro"],
};
