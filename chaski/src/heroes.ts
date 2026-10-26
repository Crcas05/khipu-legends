// Personajes principales armados con formas y texturas tejidas (provisionales).
// Cada uno expone la misma interfaz (raiz, mallas, actualizar), así un modelo 3D
// (.glb) podrá reemplazarlos más adelante sin cambiar el resto del juego.

import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { material, pieza } from "./personajes";
import type { Modelo } from "./modelos";

// ---------------------------------------------------------------------------
// Tejidos andinos dibujados en el momento (sin descargar imágenes)
// ---------------------------------------------------------------------------
type Dibujo = (c: CanvasRenderingContext2D, ancho: number, alto: number) => void;

function tejido(escena: Scene, nombre: string, dibujar: Dibujo, ancho = 512, alto = 256): StandardMaterial {
  const textura = new DynamicTexture(`tx-${nombre}`, { width: ancho, height: alto }, escena, true);
  const c = textura.getContext() as unknown as CanvasRenderingContext2D;
  dibujar(c, ancho, alto);
  textura.update();
  const m = new StandardMaterial(`m-${nombre}`, escena);
  m.diffuseTexture = textura;
  m.specularColor = new Color3(0.05, 0.05, 0.05);
  m.emissiveColor = new Color3(0.06, 0.06, 0.06);
  return m;
}

/** Fila de rombos andinos (q'inqu) entre dos líneas. */
function rombos(c: CanvasRenderingContext2D, y: number, alto: number, ancho: number, fondo: string, rombo: string, centro: string, n = 16) {
  c.fillStyle = fondo;
  c.fillRect(0, y, ancho, alto);
  const paso = ancho / n;
  for (let i = 0; i < n; i++) {
    const x = i * paso + paso / 2;
    c.fillStyle = rombo;
    c.beginPath();
    c.moveTo(x, y + 3);
    c.lineTo(x + paso / 2 - 3, y + alto / 2);
    c.lineTo(x, y + alto - 3);
    c.lineTo(x - paso / 2 + 3, y + alto / 2);
    c.closePath();
    c.fill();
    c.fillStyle = centro;
    c.beginPath();
    c.moveTo(x, y + alto * 0.32);
    c.lineTo(x + paso * 0.16, y + alto / 2);
    c.lineTo(x, y + alto * 0.68);
    c.lineTo(x - paso * 0.16, y + alto / 2);
    c.closePath();
    c.fill();
  }
}

function zigzag(c: CanvasRenderingContext2D, y: number, alto: number, ancho: number, color: string, n = 24) {
  c.strokeStyle = color;
  c.lineWidth = alto * 0.35;
  c.beginPath();
  for (let i = 0; i <= n; i++) {
    const x = (i / n) * ancho;
    c.lineTo(x, i % 2 ? y + alto * 0.2 : y + alto * 0.8);
  }
  c.stroke();
}

function linea(c: CanvasRenderingContext2D, y: number, alto: number, ancho: number, color: string) {
  c.fillStyle = color;
  c.fillRect(0, y, ancho, alto);
}

// ---------------------------------------------------------------------------
// El Chaski (basado en el diseño aprobado: chullo rojo y blanco, poncho de rombos,
// pantalón marrón, sandalias y bolsa tejida)
// ---------------------------------------------------------------------------
export class Chaski {
  raiz: TransformNode;
  mallas: Mesh[] = [];
  private cuerpo: TransformNode;
  private piernaI: TransformNode;
  private piernaD: TransformNode;
  private brazoI: TransformNode;
  private brazoD: TransformNode;
  private orejeras: TransformNode[] = [];
  private tiempo = 0;
  private angulo = 0;
  private festejo = 0;
  private modelo: Modelo | null = null;
  private esFantasma = false;

  /** Cambia el cuerpo armado con formas por un modelo 3D animado (ya colocado dentro de raiz). */
  vestir(modelo: Modelo, extras: Mesh[] = []) {
    this.cuerpo.setEnabled(false);
    this.modelo = modelo;
    this.mallas = [...modelo.mallas, ...extras];
    if (this.esFantasma) this.fantasma();
  }

  get tieneModelo() {
    return this.modelo !== null;
  }

  /** Lanza la animación de hechizo (al atacar). */
  lanzar() {
    this.modelo?.accion("Spellcast_Shoot", 0.9);
  }

  /** Reacciona a un golpe. */
  golpeado() {
    this.modelo?.accion("Hit_A", 0.6);
  }

  /** amaru = true arma a Amaru (montera, trenzas largas, pollera y bastón del río). */
  constructor(escena: Scene, amaru = false) {
    const piel = material(escena, "#c98a5c");
    const pelo = material(escena, "#1c1410", 0.3);
    const marron = material(escena, "#6b4026");
    const marronClaro = material(escena, "#8a5634");
    const sandalia = material(escena, "#4a2a17");
    const blanco = material(escena, "#ffffff", 0.9);
    const ojoMarron = material(escena, "#5a3214", 0.4);
    const negro = material(escena, "#120c08", 0.6);
    const rojo = material(escena, "#c8102e");
    const rosado = material(escena, "#e88a7a");
    const boca = material(escena, "#7a2318");
    const bolsaTejida = tejido(escena, "bolsa", (c, w, h) => {
      linea(c, 0, h, w, "#d9c49a");
      for (let y = 0; y < h; y += 32) rombos(c, y + 6, 20, w, "#d9c49a", "#c8102e", "#2a6f5e", 10);
    }, 256, 256);
    const poncho = amaru ? tejido(escena, "poncho-amaru", (c, w, h) => {
      linea(c, 0, h, w, "#d6336c");
      linea(c, h * 0.2, 6, w, "#f5b83d");
      rombos(c, h * 0.24, 44, w, "#1fa596", "#f7f1e6", "#d6336c", 14);
      linea(c, h * 0.24 + 44, 6, w, "#f5b83d");
      rombos(c, h * 0.76, 38, w, "#f7f1e6", "#1fa596", "#141414", 18);
      for (let x = 0; x < w; x += 8) linea2(c, x, h - 14, 4, 14, "#f5b83d");
    }) : tejido(escena, "poncho", (c, w, h) => {
      linea(c, 0, h, w, "#c8102e");
      linea(c, h * 0.18, 6, w, "#f5b83d");
      rombos(c, h * 0.22, 46, w, "#f7f1e6", "#c8102e", "#141414", 14);
      linea(c, h * 0.22 + 46, 6, w, "#f5b83d");
      for (let x = 0; x < w; x += 32) linea2(c, x, h * 0.45, 4, h * 0.25, "#8f0b20");
      linea(c, h * 0.74, 5, w, "#141414");
      rombos(c, h * 0.76, 40, w, "#f7f1e6", "#141414", "#c8102e", 18);
      linea(c, h * 0.76 + 40, h, w, "#c8102e");
      for (let x = 0; x < w; x += 8) linea2(c, x, h - 14, 4, 14, "#f7f1e6");
    });
    const chullo = tejido(escena, "chullo", (c, w, h) => {
      linea(c, 0, h, w, "#c8102e");
      linea(c, h * 0.08, h * 0.2, w, "#f7f1e6");
      zigzag(c, h * 0.08, h * 0.2, w, "#c8102e", 28);
      rombos(c, h * 0.36, 52, w, "#f7f1e6", "#c8102e", "#141414", 12);
      linea(c, h * 0.62, 10, w, "#f7f1e6");
      linea(c, h * 0.72, h * 0.12, w, "#f7f1e6");
      zigzag(c, h * 0.72, h * 0.12, w, "#c8102e", 36);
      linea(c, h * 0.9, h * 0.1, w, "#c8102e");
    });

    this.raiz = new TransformNode(amaru ? "amaru" : "chaski", escena);
    this.cuerpo = new TransformNode("chaski-cuerpo", escena);
    this.cuerpo.parent = this.raiz;
    const m = (x: Mesh) => (this.mallas.push(x), x);

    // Piernas: pantalón marrón remangado, pantorrilla y sandalia
    const pierna = (lado: number) => {
      const cadera = new TransformNode("cadera", escena);
      cadera.parent = this.cuerpo;
      cadera.position.set(0.18 * lado, 0.7, 0);
      m(pieza(MeshBuilder.CreateCapsule("pantalon", { radius: 0.16, height: 0.48, tessellation: 10 }, escena), cadera, marron, 0, -0.18, 0));
      m(pieza(MeshBuilder.CreateCylinder("dobladillo", { height: 0.09, diameter: 0.36, tessellation: 10 }, escena), cadera, marronClaro, 0, -0.4, 0));
      m(pieza(MeshBuilder.CreateCapsule("pantorrilla", { radius: 0.1, height: 0.3, tessellation: 8 }, escena), cadera, piel, 0, -0.52, 0));
      m(pieza(MeshBuilder.CreateBox("sandalia", { width: 0.24, height: 0.06, depth: 0.4 }, escena), cadera, sandalia, 0, -0.68, 0.06));
      m(pieza(MeshBuilder.CreateBox("pie", { width: 0.2, height: 0.07, depth: 0.32 }, escena), cadera, piel, 0, -0.625, 0.07));
      m(pieza(MeshBuilder.CreateBox("correa", { width: 0.22, height: 0.05, depth: 0.06 }, escena), cadera, sandalia, 0, -0.6, 0.12));
      return cadera;
    };
    this.piernaI = pierna(-1);
    this.piernaD = pierna(1);

    // Poncho de cuatro puntas (forma tradicional) con tejido de rombos
    const pon = m(pieza(MeshBuilder.CreateCylinder("poncho", { height: 0.95, diameterTop: 0.62, diameterBottom: 1.35, tessellation: 4 }, escena), this.cuerpo, poncho, 0, 1.08, 0));
    pon.rotation.y = Math.PI / 4 + 0.0001;
    pon.scaling.z = 0.8;
    m(pieza(MeshBuilder.CreateCylinder("cuello", { height: 0.12, diameter: 0.5, tessellation: 12 }, escena), this.cuerpo, rojo, 0, 1.56, 0));

    // Brazos (pivote en el hombro), con manga roja y mano
    const brazo = (lado: number) => {
      const hombro = new TransformNode("hombro", escena);
      hombro.parent = this.cuerpo;
      hombro.position.set(0.42 * lado, 1.38, 0);
      hombro.rotation.z = 0.32 * lado;
      m(pieza(MeshBuilder.CreateCapsule("manga", { radius: 0.12, height: 0.32, tessellation: 8 }, escena), hombro, rojo, 0, -0.12, 0));
      m(pieza(MeshBuilder.CreateCapsule("brazo", { radius: 0.1, height: 0.4, tessellation: 8 }, escena), hombro, piel, 0, -0.38, 0));
      m(pieza(MeshBuilder.CreateSphere("mano", { diameter: 0.2, segments: 8 }, escena), hombro, piel, 0, -0.6, 0));
      return hombro;
    };
    this.brazoI = brazo(-1);
    this.brazoD = brazo(1);

    // Bolsa tejida cruzada (ch'uspa)
    const tira = m(pieza(MeshBuilder.CreateCylinder("tira", { height: 1.25, diameter: 0.05, tessellation: 6 }, escena), this.cuerpo, rojo, 0.02, 1.15, 0.36));
    tira.rotation.z = 0.78;
    const bolsa = m(pieza(MeshBuilder.CreateBox("chuspa", { width: 0.34, height: 0.36, depth: 0.12 }, escena), this.cuerpo, bolsaTejida, 0.4, 0.84, 0.42));
    bolsa.rotation.y = -0.3;
    m(pieza(MeshBuilder.CreateBox("tapa", { width: 0.35, height: 0.08, depth: 0.13 }, escena), this.cuerpo, rojo, 0.4, 1.03, 0.42)).rotation.y = -0.3;

    // Cabeza grande (proporción chibi)
    const cabezaY = 2.05;
    m(pieza(MeshBuilder.CreateSphere("cabeza", { diameter: 1.0, segments: 16 }, escena), this.cuerpo, piel, 0, cabezaY, 0));
    // Pelo negro: casquete y flequillo
    m(pieza(MeshBuilder.CreateSphere("pelo", { diameter: 1.05, segments: 12, slice: 0.62 }, escena), this.cuerpo, pelo, 0, cabezaY + 0.02, -0.02));
    for (let i = -2; i <= 2; i++) {
      const mecha = m(pieza(MeshBuilder.CreateCylinder("mecha", { height: 0.26, diameterTop: 0.16, diameterBottom: 0.02, tessellation: 5 }, escena), this.cuerpo, pelo, i * 0.13, cabezaY + 0.22 - Math.abs(i) * 0.02, 0.4 - Math.abs(i) * 0.04));
      mecha.rotation.x = 0.45;
      mecha.rotation.z = -i * 0.12;
    }
    // Ojos grandes y expresivos
    for (const lado of [-1, 1]) {
      const esclera = m(pieza(MeshBuilder.CreateSphere("esclera", { diameter: 0.27, segments: 10 }, escena), this.cuerpo, blanco, 0.19 * lado, cabezaY - 0.02, 0.42));
      esclera.scaling.set(0.9, 1.15, 0.45);
      m(pieza(MeshBuilder.CreateSphere("iris", { diameter: 0.17, segments: 10 }, escena), this.cuerpo, ojoMarron, 0.19 * lado, cabezaY - 0.04, 0.48)).scaling.set(1, 1.15, 0.45);
      m(pieza(MeshBuilder.CreateSphere("pupila", { diameter: 0.09, segments: 8 }, escena), this.cuerpo, negro, 0.19 * lado, cabezaY - 0.04, 0.505)).scaling.z = 0.4;
      m(pieza(MeshBuilder.CreateSphere("brillo", { diameter: 0.05, segments: 6 }, escena), this.cuerpo, blanco, 0.19 * lado + 0.035, cabezaY + 0.01, 0.52));
      const ceja = m(pieza(MeshBuilder.CreateBox("ceja", { width: 0.17, height: 0.035, depth: 0.04 }, escena), this.cuerpo, pelo, 0.19 * lado, cabezaY + 0.17, 0.43));
      ceja.rotation.z = -0.15 * lado;
      const mejilla = m(pieza(MeshBuilder.CreateDisc("mejilla", { radius: 0.07, tessellation: 12 }, escena), this.cuerpo, rosado, 0.3 * lado, cabezaY - 0.17, 0.4));
      mejilla.rotation.y = Math.PI + 0.55 * lado;
    }
    m(pieza(MeshBuilder.CreateSphere("nariz", { diameter: 0.09, segments: 6 }, escena), this.cuerpo, piel, 0, cabezaY - 0.12, 0.49));
    const sonrisa = m(pieza(MeshBuilder.CreateDisc("sonrisa", { radius: 0.09, tessellation: 16, arc: 0.5 }, escena), this.cuerpo, boca, 0, cabezaY - 0.22, 0.465));
    sonrisa.rotation.set(0, Math.PI, Math.PI);

    if (amaru) {
      // Montera roja (sombrero plano tradicional), pelo largo con trenzas y bastón con luz del río
      const sombrero = material(escena, "#c8102e");
      const oro = material(escena, "#f5b83d", 0.4);
      m(pieza(MeshBuilder.CreateCylinder("montera", { height: 0.12, diameter: 1.5, tessellation: 24 }, escena), this.cuerpo, sombrero, 0, cabezaY + 0.42, 0));
      m(pieza(MeshBuilder.CreateCylinder("montera-copa", { height: 0.22, diameter: 0.8, tessellation: 20 }, escena), this.cuerpo, sombrero, 0, cabezaY + 0.55, 0));
      m(pieza(MeshBuilder.CreateTorus("montera-banda", { diameter: 1.32, thickness: 0.05, tessellation: 28 }, escena), this.cuerpo, oro, 0, cabezaY + 0.47, 0));
      m(pieza(MeshBuilder.CreateCapsule("melena", { radius: 0.42, height: 1.1, tessellation: 10 }, escena), this.cuerpo, pelo, 0, cabezaY - 0.3, -0.18));
      for (const lado of [-1, 1]) {
        const pivote = new TransformNode("trenza", escena);
        pivote.parent = this.cuerpo;
        pivote.position.set(0.42 * lado, cabezaY - 0.1, 0.05);
        m(pieza(MeshBuilder.CreateCapsule("trenza", { radius: 0.08, height: 0.8, tessellation: 6 }, escena), pivote, pelo, 0, -0.4, 0));
        m(pieza(MeshBuilder.CreateSphere("lazo", { diameter: 0.13, segments: 6 }, escena), pivote, oro, 0, -0.82, 0));
        this.orejeras.push(pivote);
      }
      m(pieza(MeshBuilder.CreateCylinder("pollera", { height: 0.5, diameterTop: 0.9, diameterBottom: 1.25, tessellation: 18 }, escena), this.cuerpo, poncho, 0, 0.5, 0));
      const baston = m(pieza(MeshBuilder.CreateCylinder("baston", { height: 1.7, diameter: 0.07, tessellation: 6 }, escena), this.brazoD, material(escena, "#7a4b2a"), 0.05, -0.35, 0.18));
      baston.rotation.x = 0.15;
      const luz = material(escena, "#4ff0dc", 0.6);
      luz.emissiveColor = new Color3(0.2, 0.85, 0.8);
      m(pieza(MeshBuilder.CreateSphere("luz-rio", { diameter: 0.3, segments: 10 }, escena), this.brazoD, luz, 0.05, 0.5, 0.3));
      return;
    }

    // Chullo tejido con orejeras, trenzas y pompón
    const chulloY = cabezaY + 0.3;
    m(pieza(MeshBuilder.CreateCylinder("chullo", { height: 0.5, diameterTop: 0.62, diameterBottom: 1.1, tessellation: 20 }, escena), this.cuerpo, chullo, 0, chulloY, 0));
    m(pieza(MeshBuilder.CreateSphere("copa", { diameter: 0.64, segments: 12, slice: 0.5 }, escena), this.cuerpo, rojo, 0, chulloY + 0.24, 0));
    m(pieza(MeshBuilder.CreateSphere("pompon", { diameter: 0.3, segments: 10 }, escena), this.cuerpo, rojo, 0, chulloY + 0.6, 0));
    for (const lado of [-1, 1]) {
      const pivote = new TransformNode("orejera", escena);
      pivote.parent = this.cuerpo;
      pivote.position.set(0.5 * lado, chulloY - 0.2, 0);
      const orejera = m(pieza(MeshBuilder.CreateBox("orejera", { width: 0.1, height: 0.5, depth: 0.32 }, escena), pivote, chullo, 0, -0.22, 0));
      orejera.rotation.z = 0.1 * lado;
      m(pieza(MeshBuilder.CreateCylinder("trenza", { height: 0.4, diameter: 0.05, tessellation: 6 }, escena), pivote, blanco, 0.02 * lado, -0.66, 0));
      m(pieza(MeshBuilder.CreateSphere("borla", { diameter: 0.15, segments: 8 }, escena), pivote, rojo, 0.02 * lado, -0.88, 0));
      this.orejeras.push(pivote);
    }
  }

  /** Lo vuelve un eco fantasma (para la runa for). */
  fantasma() {
    this.esFantasma = true;
    for (const malla of this.mallas) {
      malla.visibility = 0.5;
      malla.isPickable = false;
    }
  }

  /** Salta de alegría un momento (al lograr un reto). */
  festejar() {
    if (this.modelo) {
      this.modelo.accion("Cheer", 1.6);
      return;
    }
    this.festejo = 1.2;
  }

  /** dx, dz: dirección de movimiento (-1 a 1). dt en segundos. */
  actualizar(dx: number, dz: number, dt: number) {
    const fuerza = Math.min(1, Math.hypot(dx, dz));
    if (this.modelo) {
      if (fuerza > 0.05) {
        const objetivo = Math.atan2(dx, dz);
        let diferencia = objetivo - this.angulo;
        diferencia = Math.atan2(Math.sin(diferencia), Math.cos(diferencia));
        this.angulo += diferencia * Math.min(1, dt * 12);
        this.raiz.rotation.y = this.angulo;
      }
      this.modelo.mover(fuerza, dt);
      return;
    }
    if (fuerza > 0.05) {
      const objetivo = Math.atan2(dx, dz);
      let diferencia = objetivo - this.angulo;
      diferencia = Math.atan2(Math.sin(diferencia), Math.cos(diferencia));
      this.angulo += diferencia * Math.min(1, dt * 12);
      this.raiz.rotation.y = this.angulo;
      this.tiempo += dt * (6 + 6 * fuerza);
    } else {
      this.tiempo += dt * 2;
    }
    const paso = fuerza > 0.05 ? Math.sin(this.tiempo) * 0.7 * fuerza : 0;
    this.piernaI.rotation.x = paso;
    this.piernaD.rotation.x = -paso;
    this.brazoI.rotation.x = -paso * 0.8;
    this.brazoD.rotation.x = paso * 0.8;
    for (const o of this.orejeras) o.rotation.x = -paso * 0.25 + Math.sin(this.tiempo * 0.5) * 0.04;
    let y = fuerza > 0.05 ? Math.abs(Math.sin(this.tiempo)) * 0.09 : Math.sin(this.tiempo) * 0.015;
    if (this.festejo > 0) {
      this.festejo -= dt;
      const t = (this.festejo % 0.6) / 0.6;
      y += Math.sin(t * Math.PI) * 0.55;
      this.brazoI.rotation.x = this.brazoD.rotation.x = -2.6;
    }
    this.cuerpo.position.y = y;
    // Respiración cuando está quieto
    this.cuerpo.scaling.y = fuerza > 0.05 ? 1 : 1 + Math.sin(this.tiempo * 1.5) * 0.012;
  }
}

function linea2(c: CanvasRenderingContext2D, x: number, y: number, ancho: number, alto: number, color: string) {
  c.fillStyle = color;
  c.fillRect(x, y, ancho, alto);
}

// ---------------------------------------------------------------------------
// Mama Khipu: la sabia guardiana de los khipus del pueblo
// ---------------------------------------------------------------------------
export class MamaKhipu {
  raiz: TransformNode;
  mallas: Mesh[] = [];
  private cuerdas: TransformNode;
  private tiempo = Math.random() * 10;

  constructor(escena: Scene, x: number, z: number, giro: number) {
    const piel = material(escena, "#b97c52");
    const canas = material(escena, "#cfcac4", 0.2);
    const blanco = material(escena, "#f6f1e8");
    const negro = material(escena, "#1a1210", 0.5);
    const boca = material(escena, "#6e2418");
    const madera = material(escena, "#7a4b2a");
    const pollera = tejido(escena, "pollera", (c, w, h) => {
      linea(c, 0, h, w, "#7b1fa2");
      linea(c, h * 0.55, 8, w, "#f5b83d");
      rombos(c, h * 0.6, 40, w, "#1fa596", "#f7f1e6", "#c8102e", 16);
      linea(c, h * 0.6 + 40, 8, w, "#f5b83d");
      linea(c, h * 0.86, h, w, "#4a1063");
    });
    const lliclla = tejido(escena, "lliclla", (c, w, h) => {
      linea(c, 0, h, w, "#c8102e");
      rombos(c, h * 0.25, 60, w, "#1fa596", "#f5b83d", "#141414", 12);
      linea(c, h * 0.25 + 60, 10, w, "#f7f1e6");
      for (let x = 0; x < w; x += 10) linea2(c, x, h - 18, 5, 18, "#f5b83d");
    });
    const sombrero = tejido(escena, "sombrero", (c, w, h) => {
      linea(c, 0, h, w, "#f6f1e8");
      linea(c, h * 0.62, h * 0.2, w, "#141414");
      rombos(c, h * 0.62, h * 0.2, w, "#141414", "#f5b83d", "#c8102e", 14);
    });

    this.raiz = new TransformNode("mama-khipu", escena);
    this.raiz.position.set(x, 0, z);
    this.raiz.rotation.y = giro;
    const m = (mesh: Mesh, mat: StandardMaterial, px: number, py: number, pz: number) => {
      this.mallas.push(pieza(mesh, this.raiz, mat, px, py, pz));
      return mesh;
    };

    m(MeshBuilder.CreateCylinder("pollera", { height: 1.05, diameterTop: 0.7, diameterBottom: 1.55, tessellation: 20 }, escena), pollera, 0, 0.52, 0);
    m(MeshBuilder.CreateCylinder("blusa", { height: 0.6, diameterTop: 0.55, diameterBottom: 0.72, tessellation: 14 }, escena), blanco, 0, 1.28, 0);
    m(MeshBuilder.CreateCylinder("lliclla", { height: 0.42, diameterTop: 0.6, diameterBottom: 1.0, tessellation: 16 }, escena), lliclla, 0, 1.42, 0);
    for (const lado of [-1, 1]) {
      const brazo = m(MeshBuilder.CreateCapsule("brazo", { radius: 0.1, height: 0.62, tessellation: 8 }, escena), blanco, 0.36 * lado, 1.15, 0.12);
      brazo.rotation.x = -0.9;
      m(MeshBuilder.CreateSphere("mano", { diameter: 0.18, segments: 8 }, escena), piel, 0.3 * lado, 1.0, 0.38);
    }
    // Cabeza, canas y trenzas
    const cy = 1.98;
    m(MeshBuilder.CreateSphere("cabeza", { diameter: 0.8, segments: 14 }, escena), piel, 0, cy, 0);
    m(MeshBuilder.CreateSphere("pelo", { diameter: 0.84, segments: 12, slice: 0.55 }, escena), canas, 0, cy + 0.02, -0.03);
    for (const lado of [-1, 1]) {
      const trenza = m(MeshBuilder.CreateCapsule("trenza", { radius: 0.07, height: 0.75, tessellation: 6 }, escena), canas, 0.3 * lado, cy - 0.45, -0.12);
      trenza.rotation.z = 0.1 * lado;
      m(MeshBuilder.CreateSphere("lazo", { diameter: 0.1, segments: 6 }, escena), negro, 0.33 * lado, cy - 0.85, -0.12);
      // Ojos amables (cerrados en media luna) y mejillas
      const ojo = m(MeshBuilder.CreateDisc("ojo", { radius: 0.06, tessellation: 12, arc: 0.5 }, escena), negro, 0.15 * lado, cy + 0.0, 0.385);
      ojo.rotation.y = Math.PI;
      m(MeshBuilder.CreateDisc("mejilla", { radius: 0.06, tessellation: 10 }, escena), material(escena, "#d97a6a"), 0.24 * lado, cy - 0.12, 0.33).rotation.y = Math.PI + 0.6 * lado;
    }
    m(MeshBuilder.CreateSphere("nariz", { diameter: 0.09, segments: 6 }, escena), piel, 0, cy - 0.06, 0.4);
    const sonrisa = m(MeshBuilder.CreateDisc("sonrisa", { radius: 0.07, tessellation: 14, arc: 0.5 }, escena), boca, 0, cy - 0.18, 0.37);
    sonrisa.rotation.set(0, Math.PI, Math.PI);
    // Sombrero blanco de copa (montera cusqueña simplificada)
    m(MeshBuilder.CreateCylinder("ala", { height: 0.05, diameter: 1.1, tessellation: 24 }, escena), blanco, 0, cy + 0.3, 0);
    m(MeshBuilder.CreateCylinder("copa", { height: 0.36, diameterTop: 0.5, diameterBottom: 0.58, tessellation: 20 }, escena), sombrero, 0, cy + 0.5, 0);

    // El khipu: un palo con cuerdas de colores y nudos
    this.cuerdas = new TransformNode("khipu", escena);
    this.cuerdas.parent = this.raiz;
    this.cuerdas.position.set(0, 1.02, 0.46);
    const palo = MeshBuilder.CreateCylinder("palo", { height: 0.8, diameter: 0.05, tessellation: 6 }, escena);
    palo.rotation.z = Math.PI / 2;
    this.mallas.push(pieza(palo, this.cuerdas, madera));
    const colores = ["#c8102e", "#f5b83d", "#1fa596", "#f7f1e6", "#7b1fa2", "#2b6cb0"];
    colores.forEach((color, i) => {
      const x = -0.3 + i * 0.12;
      const mat = material(escena, color);
      this.mallas.push(pieza(MeshBuilder.CreateCylinder("cuerda", { height: 0.55, diameter: 0.025, tessellation: 4 }, escena), this.cuerdas, mat, x, -0.28, 0));
      for (let k = 0; k < 1 + (i % 3); k++) {
        this.mallas.push(pieza(MeshBuilder.CreateSphere("nudo", { diameter: 0.06, segments: 4 }, escena), this.cuerdas, mat, x, -0.12 - k * 0.12, 0));
      }
    });
  }

  actualizar(dt: number) {
    this.tiempo += dt;
    this.cuerdas.rotation.x = Math.sin(this.tiempo * 1.6) * 0.08;
    this.raiz.position.y = Math.sin(this.tiempo * 1.2) * 0.015;
  }

  get posicion(): Vector3 {
    return this.raiz.position;
  }
}

// ---------------------------------------------------------------------------
// Marcador flotante "!" sobre quien tiene algo que decir
// ---------------------------------------------------------------------------
export function crearMarcador(escena: Scene) {
  const plano = MeshBuilder.CreatePlane("marcador", { size: 0.9 }, escena);
  plano.billboardMode = Mesh.BILLBOARDMODE_ALL;
  const textura = new DynamicTexture("tx-marcador", { width: 128, height: 128 }, escena, true);
  textura.hasAlpha = true;
  const c = textura.getContext() as unknown as CanvasRenderingContext2D;
  c.clearRect(0, 0, 128, 128);
  c.fillStyle = "#f5b83d";
  c.strokeStyle = "#3a1d06";
  c.lineWidth = 8;
  c.beginPath();
  c.moveTo(64, 6);
  c.lineTo(122, 64);
  c.lineTo(64, 122);
  c.lineTo(6, 64);
  c.closePath();
  c.fill();
  c.stroke();
  c.fillStyle = "#3a1d06";
  c.font = "bold 78px sans-serif";
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText("!", 64, 70);
  textura.update();
  const m = new StandardMaterial("m-marcador", escena);
  m.diffuseTexture = textura;
  m.useAlphaFromDiffuseTexture = true;
  m.emissiveColor = new Color3(1, 1, 1);
  m.disableLighting = true;
  m.backFaceCulling = false;
  plano.material = m;
  plano.isPickable = false;
  let t = 0;
  escena.onBeforeRenderObservable.add(() => {
    t += escena.getEngine().getDeltaTime() / 1000;
    plano.scaling.setAll(1 + Math.sin(t * 4) * 0.08);
  });
  return plano;
}
