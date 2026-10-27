// Motor de las MISIONES: arma el escenario (templo, puna o selva), la exploración con enemigos,
// y el jefe final con el DUELO DE RUNAS (el código del jugador mueve a Chaski).

import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mision } from "./datos/misiones";
import type { Choque } from "./mundo";
import { estado, guardar } from "./estado";
import { estallido, Sacudida } from "./efectos";
import { sonido, cambiarMusica } from "./sonido";
import { hablar } from "./ui/dialogo";
import { Jefe } from "./batalla";
import { Chaski } from "./heroes";
import { crearLlama, material } from "./personajes";
import { crearModelo } from "./modelos";
import { poblar, type Colocacion } from "./paisaje";
import { texturaPiedraInca, texturaIchu, texturaHojarasca, texturaPasto } from "./texturas";
import { crearTerreno, crearPastizal, type OpcionesTerreno } from "./terreno";
import { duelo, type Accion, type ResultadoDuelo } from "./ui/duelo";

export const LIMITE_MISION = 21;
export const INICIO_MISION = new Vector3(0, 0, -16);

interface Contexto {
  escena: Scene;
  chaski: Chaski;
  jugador: () => Vector3;
  sacudida: Sacudida;
  aviso: (t: string, ms?: number) => void;
  objetivo: (t: string | null) => void;
  cambio: () => void;
  /** Termina la misión (ganada o abandonada). */
  terminar: (r: ResultadoDuelo | null) => void;
}

interface Bug {
  raiz: TransformNode;
  vida: number;
  t: number;
  golpeHasta: number;
  /** Lo que lleva (pieza de oro) o a qué vicuña persigue. */
  lleva?: Mesh;
  meta?: Vicuna;
  casa: Vector3;
}
interface Vicuna {
  raiz: TransformNode;
  asustada: number;
  dir: number;
}
interface Item {
  malla: Mesh;
  tomado: boolean;
}
interface Jaula {
  raiz: TransformNode;
  animal: TransformNode;
  nombre: string;
  vida: number;
  libre: boolean;
  huida: number;
  dir: number;
}
interface Ilusion {
  raiz: TransformNode;
  dicho: boolean;
}

function textura(escena: Scene, nombre: string, tex: StandardMaterial["diffuseTexture"], color: string) {
  const m = new StandardMaterial(nombre, escena);
  m.diffuseTexture = tex;
  m.diffuseColor = Color3.FromHexString(color);
  m.specularColor = new Color3(0.04, 0.04, 0.04);
  return m;
}

export class MisionJuego {
  mision: Mision | null = null;
  fase: "explorar" | "duelo" | "fin" = "explorar";
  raiz: TransformNode | null = null;
  choques: Choque[] = [];
  private mallas: Mesh[] = [];
  private bugs: Bug[] = [];
  private items: Item[] = [];
  private vicunas: Vicuna[] = [];
  private ilusiones: Ilusion[] = [];
  private jaulas: Jaula[] = [];
  private apariciones = 0;
  private chullaVisible = 0;
  private oleada = 0;
  progreso = 0;
  private tiempo = 0;
  private recarga = 0;
  private jefe: Jefe | null = null;
  private chulla: Chaski | null = null;
  private escudoJefe: Mesh | null = null;
  private disco: StandardMaterial | null = null;
  private bugMat: StandardMaterial;
  private ojoMat: StandardMaterial;
  private oroMat: StandardMaterial;
  private semillaMat: StandardMaterial;
  enDuelo = false;

  constructor(private c: Contexto) {
    const e = c.escena;
    this.bugMat = new StandardMaterial("m-bug-mision", e);
    this.bugMat.diffuseColor = Color3.FromHexString("#8b3dff");
    this.bugMat.emissiveColor = Color3.FromHexString("#4a14b0");
    this.ojoMat = new StandardMaterial("m-bug-mision-ojo", e);
    this.ojoMat.emissiveColor = new Color3(1, 1, 1);
    this.ojoMat.disableLighting = true;
    this.oroMat = new StandardMaterial("m-oro-mision", e);
    this.oroMat.diffuseColor = Color3.FromHexString("#ffcc33");
    this.oroMat.emissiveColor = Color3.FromHexString("#b8860b");
    this.oroMat.specularColor = new Color3(1, 0.9, 0.5);
    this.semillaMat = new StandardMaterial("m-semilla", e);
    this.semillaMat.emissiveColor = Color3.FromHexString("#7dffb0");
    this.semillaMat.disableLighting = true;
  }

  get activo() {
    return !!this.mision;
  }

  // ---------------------------------------------------------------------------
  // Entrar / salir
  // ---------------------------------------------------------------------------
  async entrar(m: Mision) {
    this.salir();
    this.mision = m;
    this.fase = "explorar";
    this.progreso = 0;
    this.oleada = 0;
    this.raiz = new TransformNode(`mision-${m.id}`, this.c.escena);
    this.choques = [];
    if (m.ambiente === "templo") await this.armarTemplo();
    else if (m.ambiente === "puna") await this.armarPuna();
    else await this.armarSelva();
    cambiarMusica(m.ambiente === "templo" ? "andes" : m.ambiente === "puna" ? "altiplano" : "misterio");
    this.pintarObjetivo();
  }

  salir() {
    for (const b of this.bugs) b.raiz.dispose();
    for (const v of this.vicunas) v.raiz.dispose();
    for (const i of this.items) i.malla.dispose();
    for (const i of this.ilusiones) i.raiz.dispose();
    for (const j of this.jaulas) j.raiz.dispose();
    this.jaulas = [];
    this.apariciones = 0;
    this.chullaVisible = 0;
    this.bugs = [];
    this.vicunas = [];
    this.items = [];
    this.ilusiones = [];
    this.jefe?.raiz.dispose();
    this.jefe = null;
    this.chulla?.raiz.dispose();
    this.chulla = null;
    this.escudoJefe?.dispose();
    this.escudoJefe = null;
    for (const m of this.mallas) m.dispose();
    this.mallas = [];
    this.raiz?.dispose();
    this.raiz = null;
    this.mision = null;
    this.enDuelo = false;
    document.getElementById("jefe-zona")!.hidden = true;
  }

  private malla<T extends Mesh>(m: T): T {
    m.parent = this.raiz;
    this.mallas.push(m);
    return m;
  }

  private async paisaje(col: Colocacion[]) {
    try {
      for (const m of await poblar(this.c.escena, col)) this.mallas.push(m);
    } catch {
      /* sin paisaje 3D: el escenario igual funciona */
    }
  }

  // ---------------------------------------------------------------------------
  // Escenarios
  // ---------------------------------------------------------------------------
  private async armarTemplo() {
    const e = this.c.escena;
    // Cerros verdes del Cusco alrededor del templo
    const opc: OpcionesTerreno = { tamano: 260, plano: 30, alto: 26, material: textura(e, "m-pasto-cusco", texturaPasto(e, "#5c9a43", 40), "#ffffff"), ladera: textura(e, "m-ichu-cusco", texturaIchu(e, 26), "#ffffff") };
    for (const t of crearTerreno(e, "terreno-templo", opc)) this.malla(t);
    this.malla(crearPastizal(e, "matas-cusco", opc, 1500, ["#6fae4a", "#3f7f2f"], (x, z) => Math.max(Math.abs(x), Math.abs(z)) > 25, 70));
    const piso = this.malla(MeshBuilder.CreateGround("piso-templo", { width: 48, height: 48 }, e));
    piso.position.y = 0.02;
    const tPiso = texturaPiedraInca(e);
    tPiso.uScale = tPiso.vScale = 9;
    piso.material = textura(e, "m-piso-templo", tPiso, "#e2d3b5");
    const tMuro = texturaPiedraInca(e).clone();
    tMuro.uScale = 10;
    tMuro.vScale = 1.6;
    const muroMat = textura(e, "m-muro-templo", tMuro, "#cbbfa8");
    // Recinto: cuatro muros incas con la banda de oro a media altura y hornacinas trapezoidales
    const L = 46;
    for (const [x, z, giro] of [[0, L / 2, 0], [0, -L / 2, 0], [L / 2, 0, Math.PI / 2], [-L / 2, 0, Math.PI / 2]] as [number, number, number][]) {
      const muro = this.malla(MeshBuilder.CreateBox("muro-templo", { width: L + 2, height: 6.5, depth: 1.6 }, e));
      muro.position.set(x, 3.25, z);
      muro.rotation.y = giro;
      muro.material = muroMat;
      const banda = this.malla(MeshBuilder.CreateBox("banda-oro", { width: L + 2.1, height: 0.5, depth: 1.7 }, e));
      banda.position.set(x, 3.4, z);
      banda.rotation.y = giro;
      banda.material = this.oroMat;
      for (let k = -3; k <= 3; k++) {
        if (z === -L / 2 && k === 0) continue; // entrada
        const nicho = this.malla(MeshBuilder.CreatePlane("hornacina", { width: 1.4, height: 2.2 }, e));
        const off = k * 6;
        nicho.position.set(x + (giro ? 0 : off) - Math.sign(x) * 0.82, 1.6, z + (giro ? off : 0) - Math.sign(z) * 0.82);
        nicho.rotation.y = giro ? (x > 0 ? Math.PI / 2 : -Math.PI / 2) : z > 0 ? 0 : Math.PI;
        nicho.material = material(e, "#3e352b");
        nicho.scaling.x = 1;
      }
    }
    // El gran disco del Inti en el muro norte (se ilumina con cada pieza recuperada)
    this.disco = new StandardMaterial("m-disco-inti", e);
    this.disco.diffuseColor = Color3.FromHexString("#6e5a2a");
    this.disco.emissiveColor = new Color3(0.08, 0.06, 0.02);
    const disco = this.malla(MeshBuilder.CreateDisc("disco-inti", { radius: 3.2, tessellation: 40 }, e));
    disco.position.set(0, 4.2, L / 2 - 0.85);
    disco.rotation.y = Math.PI;
    disco.material = this.disco;
    for (let i = 0; i < 16; i++) {
      const rayo = this.malla(MeshBuilder.CreateBox("rayo-inti", { width: 0.35, height: 1.6, depth: 0.1 }, e));
      const a = (i / 16) * Math.PI * 2;
      rayo.position.set(Math.sin(a) * 4.2, 4.2 + Math.cos(a) * 4.2, L / 2 - 0.9);
      rayo.rotation.z = -a;
      rayo.material = this.disco;
    }
    // Ushnu (plataforma ceremonial) y pilares
    const ushnu = this.malla(MeshBuilder.CreateCylinder("ushnu", { height: 0.8, diameter: 6, tessellation: 6 }, e));
    ushnu.position.set(0, 0.4, 8);
    ushnu.material = muroMat;
    this.choques.push({ x: 0, z: 8, r: 3.2 });
    for (const [x, z] of [[-12, -8], [12, -8], [-12, 10], [12, 10]]) {
      const p = this.malla(MeshBuilder.CreateBox("pilar", { width: 1.6, height: 3.4, depth: 1.6 }, e));
      p.position.set(x, 1.7, z);
      p.material = muroMat;
      this.choques.push({ x, z, r: 1.3 });
    }
    // Cerros del Cusco alrededor
    const col: Colocacion[] = [];
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      col.push({ modelo: ["mountain_A_grass_trees", "mountain_C_grass_trees", "hills_B_trees"][i % 3], x: Math.sin(a) * 58, z: Math.cos(a) * 58, escala: 14, alto: 1.3, giro: a * 3 });
    }
    await this.paisaje(col);
    // 5 huaqueros-Bug con piezas de oro
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.4;
      const b = this.ponerBug(new Vector3(Math.sin(a) * 13, 0, Math.cos(a) * 11 + 2), 2);
      const pieza = MeshBuilder.CreateCylinder("pieza-oro", { height: 0.12, diameter: 0.7, tessellation: 16 }, e);
      pieza.material = this.oroMat;
      pieza.parent = b.raiz;
      pieza.position.y = 0.75;
      pieza.rotation.x = Math.PI / 2;
      b.lleva = pieza;
    }
  }

  private async armarPuna() {
    const e = this.c.escena;
    const rocaMat = textura(e, "m-roca-puna", texturaPiedraInca(e), "#9a958a");
    (rocaMat.diffuseTexture as StandardMaterial["diffuseTexture"] & { uScale: number; vScale: number }).uScale = 30;
    (rocaMat.diffuseTexture as StandardMaterial["diffuseTexture"] & { uScale: number; vScale: number }).vScale = 30;
    const opc: OpcionesTerreno = { tamano: 300, plano: 26, alto: 30, material: textura(e, "m-piso-puna", texturaIchu(e, 40), "#ffffff"), ladera: rocaMat };
    for (const t of crearTerreno(e, "piso-puna", opc)) this.malla(t);
    this.malla(crearPastizal(e, "ichu-puna", opc, 2400, ["#e2c97e", "#a88a3e"], (x, z) => Math.hypot(x - 13, z - 12) > 6, 60));
    const laguna = this.malla(MeshBuilder.CreateDisc("laguna", { radius: 5, tessellation: 32 }, e));
    laguna.rotation.x = Math.PI / 2;
    laguna.position.set(13, 0.03, 12);
    laguna.material = material(e, "#4aa3d8", 0.5);
    this.choques.push({ x: 13, z: 12, r: 5 });
    // Apus nevados
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + 0.2;
      const d = 62 + (i % 3) * 8;
      const alto = 30 + (i % 4) * 8;
      const monte = this.malla(MeshBuilder.CreateCylinder("apu-puna", { height: alto, diameterTop: 0, diameterBottom: alto * 1.4, tessellation: 7 }, e));
      monte.position.set(Math.sin(a) * d, alto / 2 - 1, Math.cos(a) * d);
      monte.material = material(e, i % 2 ? "#8a8676" : "#7b7a70");
      const nieve = this.malla(MeshBuilder.CreateCylinder("nieve-puna", { height: alto * 0.32, diameterTop: 0, diameterBottom: alto * 0.45, tessellation: 7 }, e));
      nieve.position.set(monte.position.x, alto - 1 - alto * 0.16 + 0.05, monte.position.z);
      nieve.material = material(e, "#f4f7fb");
    }
    const col: Colocacion[] = [];
    for (let i = 0; i < 18; i++) {
      const a = i * 2.3;
      const d = 24 + (i % 5) * 4;
      col.push({ modelo: i % 2 ? "mountain_B" : "mountain_C", x: Math.sin(a) * d * 1.6, z: Math.cos(a) * d * 1.6, escala: 9, alto: 0.9, giro: a });
    }
    for (let i = 0; i < 16; i++) {
      const a = i * 1.7;
      const d = 6 + (i % 6) * 2.6;
      const x = Math.sin(a) * d;
      const z = Math.cos(a) * d;
      if (Math.hypot(x - INICIO_MISION.x, z - INICIO_MISION.z) < 4) continue;
      col.push({ modelo: i % 3 ? "rock_single_E" : "resource_stone", x, z, escala: 5, giro: a });
      this.choques.push({ x, z, r: 1 });
    }
    await this.paisaje(col);
    // Rebaño de vicuñas
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const v = crearLlama(e, Math.sin(a) * 6, Math.cos(a) * 6 + 2, "#c98b4a", false);
      v.raiz.scaling.setAll(0.8);
      v.raiz.parent = this.raiz;
      this.vicunas.push({ raiz: v.raiz, asustada: 0, dir: a });
    }
    this.oleadaCazadores();
  }

  private oleadaCazadores() {
    if (this.fase !== "explorar") return;
    this.oleada++;
    const entradas = [new Vector3(-20, 0, 14), new Vector3(20, 0, 10), new Vector3(0, 0, 21)];
    for (const p of entradas) {
      const b = this.ponerBug(p, 3);
      b.meta = this.vicunas[Math.floor(Math.random() * this.vicunas.length)];
      b.raiz.getChildMeshes().forEach((m) => {
        if (m.material === this.bugMat) m.material = material(this.c.escena, "#9a4a24", 0.2);
      });
    }
    this.c.aviso(this.oleada === 1 ? "🏹 ¡Cazadores-Bug van tras las vicuñas! Dispárales con 🎯" : "⚠ ¡Otra oleada de cazadores!", 3000);
    sonido.pututu();
  }

  private async armarSelva() {
    const e = this.c.escena;
    const opc: OpcionesTerreno = { tamano: 240, plano: 25, alto: 16, material: textura(e, "m-piso-selva", texturaHojarasca(e, 40), "#ffffff"), ladera: textura(e, "m-ladera-ucayali", texturaPasto(e, "#2d5f27", 26), "#ffffff") };
    for (const t of crearTerreno(e, "piso-selva", opc)) this.malla(t);
    this.malla(crearPastizal(e, "helechos-ucayali", opc, 1600, ["#4caf50", "#1f5e2a"], (x, z) => Math.hypot(x, z - 6) > 4 && Math.hypot(x - INICIO_MISION.x, z - INICIO_MISION.z) > 3, 30));
    // Selva amazónica: árboles de hoja ancha (tronco alto y copa ancha), helechos y lianas
    const troncoMat = material(e, "#6e5a44");
    const hojas = [material(e, "#2f6a2c"), material(e, "#3c7d34"), material(e, "#25552a")];
    const anillo: Mesh[] = [];
    const copas: Mesh[][] = [[], [], []];
    for (let i = 0; i < 46; i++) {
      const a = (i / 46) * Math.PI * 2 + (i % 3) * 0.05;
      const d = 25 + (i % 4) * 4.5;
      const x = Math.sin(a) * d;
      const z = Math.cos(a) * d;
      const alto = 9 + (i % 5) * 2;
      const t = MeshBuilder.CreateCylinder("tronco-lejos", { height: alto, diameterTop: 0.6, diameterBottom: 1.3, tessellation: 7 }, e);
      t.position.set(x, alto / 2, z);
      anillo.push(t);
      for (let k = 0; k < 3; k++) {
        const c = MeshBuilder.CreateSphere("copa-lejos", { diameter: 6 + (k % 2) * 2, segments: 6 }, e);
        c.position.set(x + Math.sin(k * 2.1) * 2.2, alto + (k % 2) * 1.2, z + Math.cos(k * 2.1) * 2.2);
        c.scaling.y = 0.55;
        copas[(i + k) % 3].push(c);
      }
    }
    const troncos = Mesh.MergeMeshes(anillo, true);
    if (troncos) {
      troncos.material = troncoMat;
      this.malla(troncos);
    }
    copas.forEach((g, i) => {
      const u = Mesh.MergeMeshes(g, true);
      if (u) {
        u.material = hojas[i];
        this.malla(u);
      }
    });
    // Árboles dentro del área (se vuelven transparentes si tapan a Chaski)
    for (let i = 0; i < 14; i++) {
      const a = i * 2.4;
      const d = 6 + (i % 6) * 2.4;
      const x = Math.sin(a) * d;
      const z = Math.cos(a) * d;
      if (Math.hypot(x - INICIO_MISION.x, z - INICIO_MISION.z) < 5 || Math.hypot(x, z - 6) < 5) continue;
      const alto = 7 + (i % 3) * 1.5;
      const t = this.malla(MeshBuilder.CreateCylinder("tronco", { height: alto, diameterTop: 0.35, diameterBottom: 0.8, tessellation: 7 }, e));
      t.position.set(x, alto / 2, z);
      t.material = troncoMat;
      const c = this.malla(MeshBuilder.CreateSphere("copa", { diameter: 4.5, segments: 7 }, e));
      c.position.set(x, alto + 0.6, z);
      c.scaling.y = 0.5;
      c.material = hojas[i % 3];
      const helecho = this.malla(MeshBuilder.CreateSphere("helecho", { diameter: 1.6, segments: 5 }, e));
      helecho.position.set(x + 1, 0.4, z + 0.6);
      helecho.scaling.y = 0.5;
      helecho.material = hojas[(i + 1) % 3];
      this.choques.push({ x, z, r: 0.8 });
    }
    const col: Colocacion[] = [];
    for (let i = 0; i < 12; i++) col.push({ modelo: i % 2 ? "rock_single_D" : "rock_single_B", x: Math.sin(i * 1.9) * 12, z: Math.cos(i * 1.9) * 12, escala: 5, giro: i });
    await this.paisaje(col);
    // La lupuna: el gran árbol sagrado del centro
    const tronco = this.malla(MeshBuilder.CreateCylinder("lupuna", { height: 10, diameterTop: 1.6, diameterBottom: 3.4, tessellation: 10 }, e));
    tronco.position.set(0, 5, 6);
    tronco.material = material(e, "#8a7a62");
    for (let i = 0; i < 6; i++) {
      const raiz = this.malla(MeshBuilder.CreateBox("aleta", { width: 0.4, height: 2.4, depth: 3 }, e));
      const a = (i / 6) * Math.PI * 2;
      raiz.position.set(Math.sin(a) * 1.8, 1.1, 6 + Math.cos(a) * 1.8);
      raiz.rotation.y = a;
      raiz.material = material(e, "#7a6a52");
    }
    for (let i = 0; i < 5; i++) {
      const copa = this.malla(MeshBuilder.CreateSphere("copa-lupuna", { diameter: 7 + (i % 2) * 2, segments: 8 }, e));
      copa.position.set(Math.sin(i * 1.3) * 3, 11 + (i % 2), 6 + Math.cos(i * 1.3) * 3);
      copa.scaling.y = 0.6;
      copa.material = material(e, i % 2 ? "#2e5f2a" : "#3a7032");
    }
    this.choques.push({ x: 0, z: 6, r: 2.6 });
    // Luciérnagas
    for (let i = 0; i < 24; i++) {
      const l = this.malla(MeshBuilder.CreateSphere("luciernaga", { diameter: 0.14, segments: 4 }, e));
      l.position.set(Math.sin(i * 7) * 16, 1 + (i % 5) * 0.6, Math.cos(i * 5) * 16);
      l.material = this.semillaMat;
    }
    // Animales atrapados en jaulas de los Bugs-taladores
    const animales: [string, number, number][] = [["otorongo", -14, -6], ["mono", 15, -9], ["perezoso", -12, 15], ["guacamayo", 14, 14]];
    for (const [nombre, x, z] of animales) this.ponerJaula(nombre, x, z);
    // El Chullachaqui ya ronda el bosque (aparece entre la neblina y desaparece)
    void this.crearChulla(new Vector3(0, 0, 20)).then((ch) => {
      if (this.chullaVisible <= 0 && !this.enDuelo) ch.raiz.setEnabled(false);
    });
    // Ilusiones: voces que imitan a tus amigos (si las sigues, te pierdes)
    for (const [x, z] of [[-18, 4], [18, 3], [2, 19]] as [number, number][]) {
      const r = new TransformNode("ilusion", e);
      r.parent = this.raiz;
      const mat = new StandardMaterial("m-ilusion", e);
      mat.emissiveColor = new Color3(0.6, 0.85, 1);
      mat.alpha = 0.35;
      mat.disableLighting = true;
      const cuerpo = MeshBuilder.CreateCapsule("ilusion-cuerpo", { height: 1.8, radius: 0.45 }, e);
      cuerpo.material = mat;
      cuerpo.parent = r;
      cuerpo.position.y = 0.9;
      const cabeza = MeshBuilder.CreateSphere("ilusion-cabeza", { diameter: 0.7 }, e);
      cabeza.material = mat;
      cabeza.parent = r;
      cabeza.position.y = 2.1;
      r.position.set(x, 0, z);
      this.ilusiones.push({ raiz: r, dicho: false });
    }
    // Sombras-Bug
    for (const [x, z] of [[-8, 2], [9, 0], [0, 14]] as [number, number][]) {
      const b = this.ponerBug(new Vector3(x, 0, z), 2);
      b.raiz.getChildMeshes().forEach((m) => {
        if (m.material === this.bugMat) m.material = material(this.c.escena, "#1e2a24", 0.2);
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Selva: animales en jaulas y el Chullachaqui
  // ---------------------------------------------------------------------------
  private armarAnimal(nombre: string): TransformNode {
    const e = this.c.escena;
    const r = new TransformNode(`animal-${nombre}`, e);
    const p = (mesh: Mesh, color: string, x: number, y: number, z: number) => {
      mesh.material = material(e, color);
      mesh.parent = r;
      mesh.position.set(x, y, z);
      return mesh;
    };
    if (nombre === "otorongo") {
      const c = p(MeshBuilder.CreateSphere("otorongo", { diameter: 1 }, e), "#d9a23a", 0, 0.6, 0);
      c.scaling.set(0.7, 0.6, 1.4);
      p(MeshBuilder.CreateSphere("otorongo-cabeza", { diameter: 0.6 }, e), "#d9a23a", 0, 0.85, 0.75);
      for (let i = 0; i < 10; i++) p(MeshBuilder.CreateSphere("mancha", { diameter: 0.14 }, e), "#2a1a0a", Math.sin(i * 2) * 0.32, 0.6 + Math.cos(i * 3) * 0.22, -0.5 + i * 0.1);
      for (const l of [-1, 1]) for (const f of [-1, 1]) p(MeshBuilder.CreateCylinder("pata", { height: 0.5, diameter: 0.16 }, e), "#c98f2a", 0.22 * l, 0.25, 0.45 * f);
      p(MeshBuilder.CreateCylinder("cola", { height: 0.9, diameter: 0.1 }, e), "#d9a23a", 0, 0.7, -0.95).rotation.x = 1.1;
    } else if (nombre === "mono") {
      p(MeshBuilder.CreateSphere("mono", { diameter: 0.8 }, e), "#5a3a22", 0, 0.7, 0);
      p(MeshBuilder.CreateSphere("mono-cabeza", { diameter: 0.55 }, e), "#5a3a22", 0, 1.25, 0.05);
      p(MeshBuilder.CreateSphere("mono-cara", { diameter: 0.38 }, e), "#d9b48a", 0, 1.22, 0.2);
      for (const l of [-1, 1]) p(MeshBuilder.CreateCylinder("brazo", { height: 0.7, diameter: 0.12 }, e), "#5a3a22", 0.42 * l, 0.75, 0).rotation.z = 0.5 * l;
      p(MeshBuilder.CreateTorus("cola-mono", { diameter: 0.7, thickness: 0.08 }, e), "#5a3a22", 0, 0.6, -0.5).rotation.x = Math.PI / 2;
    } else if (nombre === "perezoso") {
      const c = p(MeshBuilder.CreateSphere("perezoso", { diameter: 1 }, e), "#8b7b62", 0, 0.65, 0);
      c.scaling.set(0.75, 0.85, 0.7);
      p(MeshBuilder.CreateSphere("perezoso-cara", { diameter: 0.5 }, e), "#d9c9a8", 0, 1.05, 0.25);
      for (const l of [-1, 1]) p(MeshBuilder.CreateSphere("antifaz", { diameter: 0.14 }, e), "#2a2a2a", 0.1 * l, 1.1, 0.46);
      for (const l of [-1, 1]) p(MeshBuilder.CreateCylinder("brazo-largo", { height: 0.9, diameter: 0.14 }, e), "#8b7b62", 0.45 * l, 0.75, 0.1).rotation.z = 0.9 * l;
    } else {
      const c = p(MeshBuilder.CreateSphere("guacamayo", { diameter: 0.6 }, e), "#d7262e", 0, 0.9, 0);
      c.scaling.set(0.7, 1, 0.8);
      p(MeshBuilder.CreateSphere("guacamayo-cabeza", { diameter: 0.38 }, e), "#d7262e", 0, 1.3, 0.05);
      p(MeshBuilder.CreateCylinder("pico", { height: 0.2, diameterTop: 0, diameterBottom: 0.14 }, e), "#2a2a2a", 0, 1.27, 0.25).rotation.x = Math.PI / 2;
      for (const l of [-1, 1]) {
        const a = p(MeshBuilder.CreateBox("ala-g", { width: 0.1, height: 0.5, depth: 0.4 }, e), "#1f6fd1", 0.3 * l, 0.9, 0);
        a.rotation.z = 0.2 * l;
      }
      p(MeshBuilder.CreateBox("cola-g", { width: 0.12, height: 0.8, depth: 0.08 }, e), "#f5c518", 0, 0.5, -0.25).rotation.x = -0.4;
      const percha = p(MeshBuilder.CreateCylinder("percha", { height: 0.6, diameter: 0.08 }, e), "#6b4a2a", 0, 0.62, 0);
      percha.rotation.z = Math.PI / 2;
    }
    return r;
  }

  private ponerJaula(nombre: string, x: number, z: number) {
    const e = this.c.escena;
    const raiz = new TransformNode(`jaula-${nombre}`, e);
    raiz.parent = this.raiz;
    raiz.position.set(x, 0, z);
    const animal = this.armarAnimal(nombre);
    animal.parent = raiz;
    const barra = material(e, "#4a3a5a", 0.3);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const b = MeshBuilder.CreateCylinder("barra-jaula", { height: 2.2, diameter: 0.09, tessellation: 6 }, e);
      b.material = barra;
      b.parent = raiz;
      b.position.set(Math.sin(a) * 1.1, 1.1, Math.cos(a) * 1.1);
    }
    const tapa = MeshBuilder.CreateCylinder("tapa-jaula", { height: 0.15, diameter: 2.4, tessellation: 10 }, e);
    tapa.material = barra;
    tapa.parent = raiz;
    tapa.position.y = 2.25;
    const sello = MeshBuilder.CreateBox("sello-bug", { size: 0.5 }, e);
    sello.material = this.bugMat;
    sello.parent = raiz;
    sello.position.y = 2.6;
    this.choques.push({ x, z, r: 1.3 });
    this.jaulas.push({ raiz, animal, nombre, vida: 3, libre: false, huida: 0, dir: Math.atan2(x, z) });
  }

  private golpearJaula(j: Jaula) {
    if (j.libre) return;
    j.vida--;
    estallido(this.c.escena, j.raiz.position.add(new Vector3(0, 1.6, 0)), ["#b388ff", "#ffffff"], 30, 4);
    sonido.kallpa();
    if (j.vida > 0) {
      this.c.aviso(`🔓 ¡La jaula cruje! ${j.vida} golpe${j.vida > 1 ? "s" : ""} más.`, 1200);
      return;
    }
    j.libre = true;
    // Se rompen las barras y el animal escapa feliz hacia el bosque
    for (const hijo of j.raiz.getChildMeshes(true)) if (hijo.name !== "") hijo.dispose();
    j.animal.parent = this.raiz;
    j.animal.position.copyFrom(j.raiz.position);
    const ch = this.choques.find((c) => c.x === j.raiz.position.x && c.z === j.raiz.position.z);
    if (ch) this.choques.splice(this.choques.indexOf(ch), 1);
    estallido(this.c.escena, j.raiz.position.add(new Vector3(0, 1.5, 0)), ["#7dffb0", "#ffd166", "#ffffff"], 90, 7);
    sonido.tesoro();
    this.c.chaski.festejar();
    this.progreso++;
    const nombres: Record<string, string> = { otorongo: "¡el otorongo!", mono: "¡el mono!", perezoso: "¡el perezoso!", guacamayo: "¡el guacamayo!" };
    this.c.aviso(`🐾 Liberaste a ${nombres[j.nombre] ?? j.nombre} ${this.progreso}/${this.mision!.exploracion.total}`, 2200);
    this.pintarObjetivo();
    if (this.progreso === 2) void this.aparecerChulla("¿Liberas a mis animales, chaski? Je, je… Veremos si respetas mi bosque.");
    if (this.progreso >= this.mision!.exploracion.total) this.listoParaJefe();
  }

  /** Crea (una vez) al Chullachaqui: hombrecito de sombrero de paja, verde del monte. */
  private async crearChulla(donde: Vector3): Promise<Chaski> {
    if (this.chulla) {
      this.chulla.raiz.position.copyFrom(donde);
      return this.chulla;
    }
    const e = this.c.escena;
    const ch = new Chaski(e, true);
    ch.raiz.parent = this.raiz;
    ch.raiz.position.copyFrom(donde);
    ch.raiz.rotation.y = Math.PI;
    this.chulla = ch;
    try {
      const mod = await crearModelo(e, "killa.glb", ch.raiz, 2.2);
      ch.vestir(mod);
      for (const malla of mod.mallas) {
        if (malla.material instanceof StandardMaterial) {
          const verde = malla.material.clone(`${malla.material.name}-chulla`);
          verde.diffuseColor = new Color3(0.55, 0.85, 0.5);
          malla.material = verde;
        }
      }
      if (mod.cabeza) {
        const paja = material(e, "#c9a55a");
        const ala = MeshBuilder.CreateCylinder("sombrero-ala", { height: 0.06, diameter: 1.5, tessellation: 20 }, e);
        ala.material = paja;
        ala.parent = mod.cabeza;
        ala.position.y = 0.72;
        const copa = MeshBuilder.CreateCylinder("sombrero-copa", { height: 0.4, diameterTop: 0.55, diameterBottom: 0.7, tessellation: 16 }, e);
        copa.material = paja;
        copa.parent = mod.cabeza;
        copa.position.y = 0.92;
      }
    } catch {
      /* sin modelo: queda el personaje de formas */
    }
    return ch;
  }

  /** Aparición con suspenso: entre los árboles, dice algo y se desvanece en la neblina. */
  private async aparecerChulla(frase: string) {
    if (!this.mision || this.fase !== "explorar") return;
    this.apariciones++;
    const p = this.c.jugador();
    const a = Math.atan2(p.x, p.z) + (this.apariciones % 2 ? 0.8 : -0.8);
    const donde = new Vector3(Math.sin(a) * 15, 0, Math.cos(a) * 15);
    const ch = await this.crearChulla(donde);
    ch.raiz.setEnabled(true);
    ch.raiz.rotation.y = Math.atan2(p.x - donde.x, p.z - donde.z);
    estallido(this.c.escena, donde.add(new Vector3(0, 1.5, 0)), ["#bfe3ff", "#7dffb0", "#ffffff"], 60, 6);
    sonido.ojo(true);
    this.c.sacudida.disparar(0.3);
    this.c.aviso(`🌳 Chullachaqui: «${frase}»`, 4200);
    this.chullaVisible = 4;
  }

  // ---------------------------------------------------------------------------
  // Enemigos y huaraca
  // ---------------------------------------------------------------------------
  private ponerBug(donde: Vector3, vida: number): Bug {
    const e = this.c.escena;
    const raiz = new TransformNode("bug-mision", e);
    raiz.parent = this.raiz;
    const cuerpo = MeshBuilder.CreateBox("glitch", { size: 0.85 }, e);
    cuerpo.material = this.bugMat;
    cuerpo.parent = raiz;
    for (const lado of [-1, 1]) {
      const ojo = MeshBuilder.CreateSphere("glitch", { diameter: 0.22, segments: 6 }, e);
      ojo.material = this.ojoMat;
      ojo.parent = raiz;
      ojo.position.set(0.18 * lado, 0.12, 0.43);
    }
    raiz.position.copyFrom(donde);
    const b: Bug = { raiz, vida, t: Math.random() * 6, golpeHasta: 0, casa: donde.clone() };
    this.bugs.push(b);
    return b;
  }

  get bugsVivos() {
    return this.bugs.filter((b) => b.vida > 0).length;
  }

  disparar(adelante: Vector3) {
    if (!this.mision || this.recarga > 0 || this.fase !== "explorar") return;
    this.recarga = 0.4;
    const p = this.c.jugador();
    let objetivo: Bug | null = null;
    let mejor = 15;
    for (const b of this.bugs) {
      if (b.vida <= 0) continue;
      const d = Vector3.Distance(p, b.raiz.position);
      if (d < mejor) [mejor, objetivo] = [d, b];
    }
    let jaula: Jaula | null = null;
    if (!objetivo) {
      let mj = 15;
      for (const j of this.jaulas) {
        if (j.libre) continue;
        const d = Vector3.Distance(p, j.raiz.position);
        if (d < mj) [mj, jaula] = [d, j];
      }
    }
    this.c.chaski.lanzar();
    sonido.toque();
    const desde = p.add(new Vector3(0, 1.6, 0));
    const hasta = objetivo ? objetivo.raiz.position.add(new Vector3(0, 0.4, 0)) : jaula ? jaula.raiz.position.add(new Vector3(0, 1.4, 0)) : desde.add(adelante.scale(10));
    this.proyectil(desde, hasta, "#fff6d6").then(() => {
      if (objetivo && objetivo.vida > 0) this.golpearBug(objetivo);
      else if (jaula) this.golpearJaula(jaula);
    });
  }

  private proyectil(desde: Vector3, hasta: Vector3, color: string, arco = 1.2): Promise<void> {
    const e = this.c.escena;
    const piedra = MeshBuilder.CreateSphere("huaraca", { diameter: 0.32, segments: 6 }, e);
    const m = new StandardMaterial("m-proy", e);
    m.emissiveColor = Color3.FromHexString(color);
    m.disableLighting = true;
    piedra.material = m;
    let t = 0;
    const dur = Math.max(0.15, Vector3.Distance(desde, hasta) / 30);
    return new Promise((r) => {
      const obs = e.onBeforeRenderObservable.add(() => {
        t += e.getEngine().getDeltaTime() / 1000 / dur;
        const k = Math.min(1, t);
        piedra.position = Vector3.Lerp(desde, hasta, k).add(new Vector3(0, Math.sin(k * Math.PI) * arco, 0));
        if (k >= 1) {
          e.onBeforeRenderObservable.remove(obs);
          piedra.dispose();
          m.dispose();
          r();
        }
      });
    });
  }

  private golpearBug(b: Bug) {
    b.vida -= 1;
    b.golpeHasta = this.tiempo + 0.2;
    estallido(this.c.escena, b.raiz.position, ["#b388ff", "#ffffff"], 25, 4);
    sonido.kallpa();
    if (b.vida > 0) return;
    estallido(this.c.escena, b.raiz.position, ["#b388ff", "#8b3dff", "#ffd166"], 60, 6);
    const donde = b.raiz.position.clone();
    b.raiz.dispose();
    this.bugs.splice(this.bugs.indexOf(b), 1);
    const m = this.mision!;
    if (m.exploracion.tipo === "recoger") {
      // Suelta la pieza de oro
      const p = MeshBuilder.CreateCylinder("pieza-suelta", { height: 0.12, diameter: 0.9, tessellation: 16 }, this.c.escena);
      p.material = this.oroMat;
      p.rotation.x = Math.PI / 2;
      p.position.set(donde.x, 0.8, donde.z);
      p.parent = this.raiz;
      this.items.push({ malla: p, tomado: false });
      this.c.aviso("✨ ¡Soltó una pieza de oro! Recógela.", 2000);
    } else if (m.exploracion.tipo === "proteger") {
      this.progreso++;
      this.c.aviso(`🦙 Cazador espantado: ${this.progreso}/${m.exploracion.total}`, 1800);
      if (this.bugsVivos === 0 && this.oleada === 1) window.setTimeout(() => this.mision && this.oleadaCazadores(), 1500);
      if (this.progreso >= m.exploracion.total) this.listoParaJefe();
    }
    this.pintarObjetivo();
  }

  // ---------------------------------------------------------------------------
  // Cada cuadro
  // ---------------------------------------------------------------------------
  actualizar(dt: number, pausado: boolean) {
    const m = this.mision;
    if (!m) return;
    this.tiempo += dt;
    this.recarga = Math.max(0, this.recarga - dt);
    const p = this.c.jugador();
    const quieto = pausado || this.enDuelo;
    // Bugs
    for (const b of this.bugs) {
      if (b.vida <= 0) continue;
      b.t += dt;
      const r = b.raiz;
      const d = Vector3.Distance(p, r.position);
      if (!quieto) {
        let meta: Vector3;
        if (b.meta && m.exploracion.tipo === "proteger") meta = b.meta.raiz.position;
        else if (d < 7) meta = p;
        else meta = b.casa.add(new Vector3(Math.sin(b.t * 0.8) * 3, 0, Math.cos(b.t * 0.6) * 3));
        const dir = meta.subtract(r.position);
        dir.y = 0;
        const largo = dir.length();
        if (largo > 1) r.position.addInPlace(dir.normalize().scale(Math.min(largo, (b.meta ? 1.9 : 2.3) * dt)));
        // Cazador alcanzó a la vicuña: la asusta y busca otra
        if (b.meta && largo < 1.4) {
          b.meta.asustada = 3;
          b.meta.dir = Math.atan2(b.meta.raiz.position.x - r.position.x, b.meta.raiz.position.z - r.position.z);
          this.c.aviso("😱 ¡Asustaron a una vicuña! Dispárales antes de que lleguen.", 2000);
          b.meta = this.vicunas[Math.floor(Math.random() * this.vicunas.length)];
        }
        if (d < 1.5 && Math.floor(b.t / 0.9) !== Math.floor((b.t - dt) / 0.9)) {
          this.c.chaski.golpeado();
          this.c.sacudida.disparar(0.25);
          sonido.error();
        }
      }
      r.position.y = 0.7 + Math.abs(Math.sin(b.t * 6)) * 0.3;
      r.rotation.y = Math.atan2(p.x - r.position.x, p.z - r.position.z);
      r.scaling.setAll(this.tiempo < b.golpeHasta ? 1.3 : 1);
    }
    // Vicuñas: pastan; si las asustan, corren
    for (const v of this.vicunas) {
      if (quieto) break;
      if (v.asustada > 0) {
        v.asustada -= dt;
        v.raiz.position.x += Math.sin(v.dir) * 5 * dt;
        v.raiz.position.z += Math.cos(v.dir) * 5 * dt;
      } else {
        v.dir += (Math.sin(this.tiempo * 0.3 + v.raiz.position.x) * 0.5) * dt;
        v.raiz.position.x += Math.sin(v.dir) * 0.5 * dt;
        v.raiz.position.z += Math.cos(v.dir) * 0.5 * dt;
      }
      const dc = Math.hypot(v.raiz.position.x, v.raiz.position.z);
      if (dc > LIMITE_MISION - 2) {
        v.raiz.position.x *= (LIMITE_MISION - 2) / dc;
        v.raiz.position.z *= (LIMITE_MISION - 2) / dc;
        v.dir += Math.PI;
      }
      v.raiz.rotation.y = v.dir;
    }
    // Objetos para recoger
    for (const it of this.items) {
      if (it.tomado) continue;
      it.malla.rotation.y += dt * 2;
      it.malla.position.y = 0.9 + Math.sin(this.tiempo * 3) * 0.15;
      if (!quieto && Math.hypot(p.x - it.malla.position.x, p.z - it.malla.position.z) < 1.5) this.recoger(it);
    }
    // Ilusiones (selva): si te acercas, te pierdes
    for (const il of this.ilusiones) {
      il.raiz.rotation.y = Math.atan2(p.x - il.raiz.position.x, p.z - il.raiz.position.z);
      il.raiz.position.y = Math.sin(this.tiempo * 2 + il.raiz.position.x) * 0.15;
      const d = Math.hypot(p.x - il.raiz.position.x, p.z - il.raiz.position.z);
      if (!quieto && d < 9 && !il.dicho) {
        il.dicho = true;
        this.c.aviso(["🗣 «¡Chaski, por aquí! ¡Soy Amaru!»", "🗣 «Kraa… ven, sígueme…» (¿esa es la voz de Tuki?)", "🗣 «¡Encontré una semilla, ven!»"][this.ilusiones.indexOf(il) % 3], 3000);
        sonido.ojo(true);
      }
      if (!quieto && d < 1.8) {
        estallido(this.c.escena, il.raiz.position.add(new Vector3(0, 1.4, 0)), ["#bfe3ff", "#ffffff"], 50, 5);
        this.c.aviso("🌀 ¡Era una ilusión del Chullachaqui! Te perdiste en la neblina y volviste al inicio. No sigas las voces.", 4000);
        this.c.sacudida.disparar(0.6);
        p.copyFrom(INICIO_MISION);
        il.dicho = false;
      }
    }
    // Animales liberados: saltan y corren al bosque
    for (const j of this.jaulas) {
      if (!j.libre || j.huida > 6) continue;
      j.huida += dt;
      j.animal.position.x += Math.sin(j.dir) * 4 * dt;
      j.animal.position.z += Math.cos(j.dir) * 4 * dt;
      j.animal.position.y = Math.abs(Math.sin(j.huida * 8)) * 0.6;
      j.animal.rotation.y = j.dir;
      if (j.huida > 6) j.animal.setEnabled(false);
    }
    // El Chullachaqui: primera aparición al entrar, y se desvanece solo
    if (m.ambiente === "selva" && this.fase === "explorar" && !quieto) {
      if (this.apariciones === 0 && this.tiempo > 4) void this.aparecerChulla("¿Quién entra a mi bosque? Je, je… ¡Cuidado con perderte, chaski!");
      if (this.chullaVisible > 0) {
        this.chullaVisible -= dt;
        if (this.chullaVisible <= 0 && this.chulla) {
          estallido(this.c.escena, this.chulla.raiz.position.add(new Vector3(0, 1.5, 0)), ["#bfe3ff", "#ffffff"], 50, 5);
          this.chulla.raiz.setEnabled(false);
        }
      }
    }
    // Disco del Inti (templo): brilla más con cada pieza
    if (this.disco && m.exploracion.tipo === "recoger") {
      const f = this.progreso / m.exploracion.total;
      this.disco.emissiveColor = new Color3(0.08 + f * 0.9, 0.06 + f * 0.7, 0.02 + f * 0.15);
    }
    // Jefe flotando
    if (this.jefe) this.jefe.actualizar(dt, p);
    if (this.escudoJefe && this.jefe) this.escudoJefe.position.copyFrom(this.jefe.raiz.position);
  }

  private recoger(it: Item) {
    it.tomado = true;
    const m = this.mision!;
    estallido(this.c.escena, it.malla.position, m.ambiente === "selva" ? ["#7dffb0", "#ffffff"] : ["#ffd166", "#ffffff", "#f5b83d"], 60, 6);
    sonido.tesoro();
    it.malla.dispose();
    this.progreso++;
    this.c.chaski.festejar();
    this.c.aviso(`${m.ambiente === "selva" ? "🌱 Semilla de lupuna" : "🌞 Pieza de oro"}: ${this.progreso}/${m.exploracion.total}`, 1800);
    this.pintarObjetivo();
    if (this.progreso >= m.exploracion.total) this.listoParaJefe();
  }

  /** Dónde apunta la flecha dorada. */
  destino(): Vector3 | null {
    if (!this.mision || this.fase !== "explorar") return null;
    const p = this.c.jugador();
    let mejor: Vector3 | null = null;
    let d = Infinity;
    const candidatos = [...this.jaulas.filter((j) => !j.libre).map((j) => j.raiz.position), ...this.items.filter((i) => !i.tomado).map((i) => i.malla.position), ...this.bugs.filter((b) => b.vida > 0 && !b.lleva).map((b) => b.raiz.position), ...this.bugs.filter((b) => b.lleva).map((b) => b.raiz.position)];
    for (const c of candidatos) {
      const dd = Vector3.Distance(p, c);
      if (dd < d) [d, mejor] = [dd, c];
    }
    return mejor;
  }

  listaObjetivos(): [string, boolean][] {
    const m = this.mision;
    if (!m) return [];
    return [
      [`${m.exploracion.objetivo}: ${Math.min(this.progreso, m.exploracion.total)}/${m.exploracion.total}`, this.progreso >= m.exploracion.total],
      [`Duelo de runas contra ${m.jefe.nombre}`, this.fase === "fin"],
    ];
  }

  private pintarObjetivo() {
    const m = this.mision;
    if (!m) return;
    if (this.fase === "explorar") this.c.objetivo(`${m.exploracion.objetivo}: ${this.progreso}/${m.exploracion.total}`);
    else if (this.fase === "duelo") this.c.objetivo(`¡Duelo de runas contra ${m.jefe.nombre}!`);
    this.c.cambio();
  }

  // ---------------------------------------------------------------------------
  // Jefe y duelo
  // ---------------------------------------------------------------------------
  private listoParaJefe() {
    if (this.fase !== "explorar") return;
    this.fase = "duelo";
    for (const b of this.bugs) b.raiz.dispose();
    this.bugs = [];
    for (const il of this.ilusiones) il.raiz.setEnabled(false);
    window.setTimeout(() => void this.empezarDuelo(), 900);
  }

  private async empezarDuelo() {
    const m = this.mision;
    if (!m) return;
    const e = this.c.escena;
    const p = this.c.jugador();
    // Chaski mira al frente (+z) y el jefe aparece delante
    this.c.chaski.raiz.rotation.y = 0;
    // Arena del duelo: Chaski en un claro del centro y el jefe delante (la cámara queda libre)
    p.set(0, 0, -9);
    const lugar = new Vector3(0, 0, -1.5);
    cambiarMusica("batalla");
    sonido.pututu();
    this.c.sacudida.disparar(0.8);
    // Despeja la vista: nada entre Chaski y el jefe
    const medio = Vector3.Lerp(p, lugar, 0.5);
    for (const malla of this.mallas) {
      if (!["tronco", "copa", "helecho", "pilar", "lupuna", "copa-lupuna", "aleta"].includes(malla.name)) continue;
      const q = malla.getAbsolutePosition();
      if (Math.hypot(q.x - lugar.x, q.z - lugar.z) < 5 || Math.hypot(q.x - medio.x, q.z - medio.z) < 4.5 || (q.z < p.z && Math.hypot(q.x - p.x, q.z - p.z) < 9)) malla.setEnabled(false);
    }
    if (m.jefe.tipo === "bug") {
      const j = new Jefe(e);
      j.vidaMax = 100;
      j.aparecer(lugar);
      j.raiz.scaling.setAll(0.75);
      const color = Color3.FromHexString(m.jefe.color);
      j.mallas.forEach((malla, i) => {
        const mat = malla.material as StandardMaterial;
        if (mat && mat.name.startsWith("m-jefe") && !mat.name.includes("ojo") && !mat.name.includes("pupila")) {
          const nuevo = mat.clone(`${mat.name}-${m.id}-${i}`);
          nuevo.diffuseColor = i % 2 ? color.scale(1.2) : color;
          nuevo.emissiveColor = color.scale(0.35);
          malla.material = nuevo;
        }
      });
      this.jefe = j;
      if (m.id === "vicuna") {
        const em = new StandardMaterial("m-escudo-cazador", e);
        em.diffuseColor = new Color3(0.7, 0.7, 0.75);
        em.emissiveColor = new Color3(0.25, 0.25, 0.3);
        em.alpha = 0.3;
        this.escudoJefe = MeshBuilder.CreateSphere("escudo-cazador", { diameter: 5.5, segments: 16 }, e);
        this.escudoJefe.material = em;
        this.escudoJefe.isPickable = false;
      }
    } else {
      const ch = await this.crearChulla(lugar);
      this.chullaVisible = 0;
      ch.raiz.setEnabled(true);
      ch.raiz.rotation.y = Math.PI;
      estallido(e, lugar.add(new Vector3(0, 1.5, 0)), ["#bfe3ff", "#7dffb0", "#ffffff"], 90, 7);
    }
    await hablar(m.jefe.llega);
    this.enDuelo = true;
    this.pintarObjetivo();
    const resultado = await duelo(m, {
      animar: (a) => this.animar(a),
      jefeGolpea: () => this.jefeGolpea(),
      jefeVencido: () => this.jefeVencido(),
      vidaJefe: (f) => {
        if (this.jefe) this.jefe.raiz.scaling.setAll(0.45 + f * 0.3);
      },
    });
    this.enDuelo = false;
    if (!resultado.ganado) {
      this.c.terminar(null);
      return;
    }
    this.fase = "fin";
    await hablar(m.jefe.derrota);
    this.c.terminar(resultado);
  }

  private posJefe(): Vector3 {
    return (this.jefe?.raiz.position ?? this.chulla?.raiz.position.add(new Vector3(0, 1.4, 0)) ?? this.c.jugador().add(new Vector3(0, 1.5, 7))).clone();
  }

  private espera(ms: number) {
    return new Promise<void>((r) => window.setTimeout(r, ms));
  }

  /** Lo que hizo el código del jugador, paso a paso. */
  private async animar(a: Accion) {
    const e = this.c.escena;
    const ch = this.c.chaski;
    const p = this.c.jugador();
    const mano = p.add(new Vector3(0, 1.6, 0.3));
    switch (a.a) {
      case "atacar": {
        ch.lanzar();
        sonido.toque();
        await this.proyectil(mano, this.posJefe(), "#ffe08a", 0.6);
        this.jefe?.golpear();
        sonido.kallpa();
        estallido(e, this.posJefe(), ["#ffd166", "#ffffff", "#b388ff"], 40, 6);
        this.c.sacudida.disparar(0.15);
        break;
      }
      case "rebota": {
        ch.lanzar();
        await this.proyectil(mano, this.posJefe(), "#ffe08a", 0.6);
        sonido.error();
        estallido(e, this.posJefe(), ["#c9d6ff", "#8fa0ff"], 30, 4);
        break;
      }
      case "esquivar":
        ch.saltar();
        sonido.toque();
        await this.espera(350);
        break;
      case "romper":
        ch.lanzar();
        await this.proyectil(mano, this.posJefe(), "#4ff0dc", 0.4);
        estallido(e, this.posJefe(), ["#c9d6ff", "#ffffff", "#4ff0dc"], 110, 9);
        this.escudoJefe?.dispose();
        this.escudoJefe = null;
        sonido.reparar();
        break;
      case "recuperar": {
        const pieza = MeshBuilder.CreateCylinder("pieza-vuelve", { height: 0.1, diameter: 0.8, tessellation: 16 }, e);
        pieza.material = this.oroMat;
        pieza.rotation.x = Math.PI / 2;
        const desde = this.posJefe();
        let t = 0;
        await new Promise<void>((r) => {
          const obs = e.onBeforeRenderObservable.add(() => {
            t += e.getEngine().getDeltaTime() / 450;
            const k = Math.min(1, t);
            pieza.position = Vector3.Lerp(desde, p.add(new Vector3(0, 1.4, 0)), k).add(new Vector3(0, Math.sin(k * Math.PI) * 1.5, 0));
            pieza.rotation.z += 0.3;
            if (k >= 1) {
              e.onBeforeRenderObservable.remove(obs);
              pieza.dispose();
              r();
            }
          });
        });
        sonido.tesoro();
        estallido(e, p.add(new Vector3(0, 1.5, 0)), ["#ffd166", "#ffffff"], 40, 5);
        break;
      }
      case "proteger": {
        const v = this.vicunas[((a.n ?? 1) - 1) % Math.max(1, this.vicunas.length)];
        const donde = v ? v.raiz.position.add(new Vector3(0, 1, 0)) : p.add(new Vector3(1, 1, 1));
        estallido(e, donde, ["#4ff0dc", "#ffffff", "#7dffb0"], 50, 5);
        sonido.kallpa();
        await this.espera(260);
        break;
      }
      case "avanzar":
        p.z += 1.2;
        await this.espera(300);
        break;
      case "esperar":
        await this.espera(450);
        break;
      case "sembrar": {
        const x = p.x + (Math.random() - 0.5) * 6;
        const z = p.z + 2 + Math.random() * 3;
        const tallo = this.malla(MeshBuilder.CreateCylinder("brote", { height: 1.2, diameter: 0.14, tessellation: 6 }, e));
        tallo.position.set(x, 0.6, z);
        tallo.material = material(e, "#6b4a2a");
        const hoja = this.malla(MeshBuilder.CreateSphere("brote-copa", { diameter: 0.9, segments: 6 }, e));
        hoja.position.set(x, 1.3, z);
        hoja.material = material(e, "#4caf50");
        estallido(e, new Vector3(x, 0.8, z), ["#7dffb0", "#4caf50", "#ffffff"], 40, 4);
        sonido.reparar();
        await this.espera(320);
        break;
      }
      case "cuidar":
        estallido(e, p.add(new Vector3((Math.random() - 0.5) * 5, 2, 3)), ["#7dffb0", "#ffffff"], 30, 4);
        sonido.kallpa();
        await this.espera(260);
        break;
    }
  }

  private async jefeGolpea() {
    const e = this.c.escena;
    const p = this.c.jugador();
    const disco = MeshBuilder.CreateDisc("alerta-duelo", { radius: 1.6, tessellation: 24 }, e);
    const m = new StandardMaterial("m-alerta-duelo", e);
    m.emissiveColor = new Color3(0.95, 0.1, 0.15);
    m.alpha = 0.5;
    m.disableLighting = true;
    disco.material = m;
    disco.rotation.x = Math.PI / 2;
    disco.position.set(p.x, 0.08, p.z);
    await this.espera(450);
    await this.proyectil(this.posJefe(), p.add(new Vector3(0, 1.2, 0)), this.mision?.jefe.tipo === "chullachaqui" ? "#bfe3ff" : "#ff3355", 0.3);
    disco.dispose();
    m.dispose();
    this.c.chaski.golpeado();
    this.c.sacudida.disparar(0.5);
    estallido(e, p.add(new Vector3(0, 1.2, 0)), ["#ff3355", "#8b3dff"], 40, 5);
  }

  private async jefeVencido() {
    const e = this.c.escena;
    const donde = this.posJefe();
    sonido.nivel();
    this.c.sacudida.disparar(1);
    estallido(e, donde, ["#ffd166", "#b388ff", "#4ff0dc", "#ffffff"], 240, 13);
    if (this.jefe) {
      this.jefe.raiz.dispose();
      this.jefe = null;
    }
    this.escudoJefe?.dispose();
    this.escudoJefe = null;
    if (this.chulla) this.chulla.festejar();
    this.c.chaski.festejar();
    if (this.disco) this.disco.emissiveColor = new Color3(1, 0.8, 0.2);
    await this.espera(1200);
  }

  /** Guarda el resultado: estrellas (3 = sin errores ni golpes). */
  static estrellas(r: ResultadoDuelo) {
    return r.errores === 0 && r.golpes === 0 ? 3 : r.errores <= 2 ? 2 : 1;
  }

  static guardarResultado(id: string, estrellas: number) {
    estado.misiones[id] = Math.max(estado.misiones[id] ?? 0, estrellas);
    guardar();
  }

  /** Para las pruebas automáticas. */
  prueba = {
    explorar: () => {
      const m = this.mision;
      if (!m) return;
      for (const b of [...this.bugs]) {
        b.vida = 1;
        this.golpearBug(b);
      }
      for (const it of this.items.filter((i) => !i.tomado)) this.recoger(it);
      for (const j of this.jaulas.filter((x) => !x.libre)) {
        j.vida = 1;
        this.golpearJaula(j);
      }
      if (m.exploracion.tipo === "proteger") {
        this.progreso = m.exploracion.total;
        this.listoParaJefe();
      }
    },
    estado: () => ({ fase: this.fase, progreso: this.progreso, bugs: this.bugsVivos, items: this.items.filter((i) => !i.tomado).length + this.jaulas.filter((j) => !j.libre).length, enDuelo: this.enDuelo }),
  };
}
