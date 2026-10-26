// Personajes 3D estilizados, armados con formas simples (provisionales).
// Se reemplazarán por modelos 3D (.glb) sin cambiar el resto del juego:
// cada personaje expone la misma interfaz (raiz, actualizar).

import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

const cache = new Map<string, StandardMaterial>();

/** Material "de juguete": color plano, poco brillo, como los juegos estilizados. */
export function material(escena: Scene, hex: string, brillo = 0.08): StandardMaterial {
  const clave = `${hex}-${brillo}`;
  const guardado = cache.get(clave);
  if (guardado) return guardado;
  const m = new StandardMaterial(`m-${clave}`, escena);
  m.diffuseColor = Color3.FromHexString(hex);
  m.specularColor = new Color3(brillo, brillo, brillo);
  m.emissiveColor = Color3.FromHexString(hex).scale(0.07);
  cache.set(clave, m);
  return m;
}

function pieza(m: Mesh, padre: TransformNode, mat: StandardMaterial, x = 0, y = 0, z = 0): Mesh {
  m.parent = padre;
  m.position.set(x, y, z);
  m.material = mat;
  return m;
}

// ---------------------------------------------------------------------------
// El Chaski
// ---------------------------------------------------------------------------
export class Chaski {
  raiz: TransformNode;
  private cuerpo: TransformNode;
  private piernaI: TransformNode;
  private piernaD: TransformNode;
  private brazoI: TransformNode;
  private brazoD: TransformNode;
  private tiempo = 0;
  private angulo = 0;
  mallas: Mesh[] = [];

  constructor(escena: Scene) {
    const piel = material(escena, "#c68a5a");
    const rojo = material(escena, "#d7192f");
    const oro = material(escena, "#f5b83d");
    const turquesa = material(escena, "#1fa596");
    const oscuro = material(escena, "#3a2416");
    const negro = material(escena, "#161616", 0.6);
    const blanco = material(escena, "#ffffff", 0.9);
    const crema = material(escena, "#f4ead6");

    this.raiz = new TransformNode("chaski", escena);
    this.cuerpo = new TransformNode("chaski-cuerpo", escena);
    this.cuerpo.parent = this.raiz;
    const m = (x: Mesh) => (this.mallas.push(x), x);

    // Piernas (con pivote en la cadera para animarlas)
    const pierna = (lado: number) => {
      const cadera = new TransformNode("cadera", escena);
      cadera.parent = this.cuerpo;
      cadera.position.set(0.17 * lado, 0.62, 0);
      m(pieza(MeshBuilder.CreateCapsule("pierna", { radius: 0.14, height: 0.62, tessellation: 8 }, escena), cadera, oscuro, 0, -0.3, 0));
      m(pieza(MeshBuilder.CreateBox("pie", { width: 0.24, height: 0.12, depth: 0.34 }, escena), cadera, oscuro, 0, -0.6, 0.05));
      return cadera;
    };
    this.piernaI = pierna(-1);
    this.piernaD = pierna(1);

    // Poncho con franjas
    m(pieza(MeshBuilder.CreateCylinder("poncho", { height: 0.85, diameterTop: 0.62, diameterBottom: 1.05, tessellation: 8 }, escena), this.cuerpo, rojo, 0, 1.0, 0));
    m(pieza(MeshBuilder.CreateCylinder("franja", { height: 0.12, diameterTop: 0.9, diameterBottom: 0.95, tessellation: 8 }, escena), this.cuerpo, oro, 0, 0.82, 0));
    m(pieza(MeshBuilder.CreateCylinder("franja2", { height: 0.07, diameterTop: 1.03, diameterBottom: 1.06, tessellation: 8 }, escena), this.cuerpo, turquesa, 0, 0.6, 0));

    // Brazos (pivote en el hombro)
    const brazo = (lado: number) => {
      const hombro = new TransformNode("hombro", escena);
      hombro.parent = this.cuerpo;
      hombro.position.set(0.4 * lado, 1.32, 0);
      m(pieza(MeshBuilder.CreateCapsule("brazo", { radius: 0.11, height: 0.58, tessellation: 8 }, escena), hombro, piel, 0, -0.26, 0));
      return hombro;
    };
    this.brazoI = brazo(-1);
    this.brazoD = brazo(1);
    // Pututu (caracola) en la mano derecha
    const pututu = m(pieza(MeshBuilder.CreateCylinder("pututu", { height: 0.3, diameterTop: 0, diameterBottom: 0.16, tessellation: 8 }, escena), this.brazoD, crema, 0, -0.56, 0.1));
    pututu.rotation.x = Math.PI / 2;

    // Cabeza grande (proporción chibi)
    m(pieza(MeshBuilder.CreateSphere("cabeza", { diameter: 1.05, segments: 12 }, escena), this.cuerpo, piel, 0, 1.9, 0));
    for (const lado of [-1, 1]) {
      m(pieza(MeshBuilder.CreateSphere("ojo", { diameter: 0.17, segments: 8 }, escena), this.cuerpo, negro, 0.19 * lado, 1.92, 0.45));
      m(pieza(MeshBuilder.CreateSphere("brillo", { diameter: 0.06, segments: 6 }, escena), this.cuerpo, blanco, 0.19 * lado + 0.03, 1.96, 0.52));
    }
    m(pieza(MeshBuilder.CreateBox("boca", { width: 0.16, height: 0.04, depth: 0.04 }, escena), this.cuerpo, oscuro, 0, 1.7, 0.5));
    // Cintillo rojo y chullo
    m(pieza(MeshBuilder.CreateTorus("cintillo", { diameter: 1.02, thickness: 0.09, tessellation: 20 }, escena), this.cuerpo, rojo, 0, 2.06, 0));
    m(pieza(MeshBuilder.CreateCylinder("chullo", { height: 0.62, diameterTop: 0.12, diameterBottom: 1.0, tessellation: 12 }, escena), this.cuerpo, oro, 0, 2.42, 0));
    m(pieza(MeshBuilder.CreateCylinder("banda", { height: 0.1, diameterTop: 0.78, diameterBottom: 0.84, tessellation: 12 }, escena), this.cuerpo, turquesa, 0, 2.32, 0));
    m(pieza(MeshBuilder.CreateCylinder("banda2", { height: 0.08, diameterTop: 0.5, diameterBottom: 0.55, tessellation: 12 }, escena), this.cuerpo, rojo, 0, 2.55, 0));
    m(pieza(MeshBuilder.CreateSphere("pompon", { diameter: 0.24, segments: 8 }, escena), this.cuerpo, rojo, 0, 2.78, 0));
    for (const lado of [-1, 1]) {
      const orejera = m(pieza(MeshBuilder.CreateBox("orejera", { width: 0.1, height: 0.42, depth: 0.26 }, escena), this.cuerpo, oro, 0.5 * lado, 1.86, 0));
      orejera.rotation.z = 0.15 * lado;
    }
  }

  /** dx, dz: dirección de movimiento (-1 a 1). dt en segundos. */
  actualizar(dx: number, dz: number, dt: number) {
    const fuerza = Math.min(1, Math.hypot(dx, dz));
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
    const paso = fuerza > 0.05 ? Math.sin(this.tiempo) * 0.75 * fuerza : 0;
    this.piernaI.rotation.x = paso;
    this.piernaD.rotation.x = -paso;
    this.brazoI.rotation.x = -paso * 0.8;
    this.brazoD.rotation.x = paso * 0.8;
    this.cuerpo.position.y = fuerza > 0.05 ? Math.abs(Math.sin(this.tiempo)) * 0.09 : Math.sin(this.tiempo) * 0.02;
  }
}

// ---------------------------------------------------------------------------
// Yaru, la llama
// ---------------------------------------------------------------------------
export function crearLlama(escena: Scene, x: number, z: number) {
  const lana = material(escena, "#f3ebdc");
  const manta = material(escena, "#c8102e");
  const franja = material(escena, "#1fa596");
  const oro = material(escena, "#f5b83d");
  const negro = material(escena, "#161616", 0.6);
  const raiz = new TransformNode("yaru", escena);
  raiz.position.set(x, 0, z);
  const mallas: Mesh[] = [];
  const m = (mesh: Mesh, mat: StandardMaterial, px: number, py: number, pz: number) => {
    mallas.push(pieza(mesh, raiz, mat, px, py, pz));
    return mesh;
  };
  m(MeshBuilder.CreateCapsule("lomo", { radius: 0.42, height: 1.5, tessellation: 10 }, escena), lana, 0, 1.15, 0).rotation.x = Math.PI / 2;
  m(MeshBuilder.CreateBox("manta", { width: 0.9, height: 0.12, depth: 0.8 }, escena), manta, 0, 1.55, -0.05);
  m(MeshBuilder.CreateBox("manta-franja", { width: 0.92, height: 0.13, depth: 0.16 }, escena), franja, 0, 1.56, -0.05);
  m(MeshBuilder.CreateCapsule("cuello", { radius: 0.2, height: 1.0, tessellation: 8 }, escena), lana, 0, 1.75, 0.55);
  m(MeshBuilder.CreateSphere("cabeza", { diameter: 0.5, segments: 10 }, escena), lana, 0, 2.3, 0.7);
  m(MeshBuilder.CreateBox("hocico", { width: 0.26, height: 0.22, depth: 0.3 }, escena), lana, 0, 2.2, 0.95);
  for (const lado of [-1, 1]) {
    m(MeshBuilder.CreateSphere("ojo", { diameter: 0.1, segments: 6 }, escena), negro, 0.15 * lado, 2.36, 0.9);
    m(MeshBuilder.CreateCylinder("oreja", { height: 0.32, diameterTop: 0.02, diameterBottom: 0.12, tessellation: 6 }, escena), lana, 0.13 * lado, 2.62, 0.62);
    m(MeshBuilder.CreateSphere("borla", { diameter: 0.12, segments: 6 }, escena), oro, 0.13 * lado, 2.8, 0.62);
    for (const fz of [-0.5, 0.45]) m(MeshBuilder.CreateCapsule("pata", { radius: 0.09, height: 0.8, tessellation: 6 }, escena), lana, 0.22 * lado, 0.4, fz);
  }
  return { raiz, mallas };
}

// ---------------------------------------------------------------------------
// Tuki, el gallito de las rocas
// ---------------------------------------------------------------------------
export class Tuki {
  raiz: TransformNode;
  mallas: Mesh[] = [];
  private tiempo = 0;
  private alaI: Mesh;
  private alaD: Mesh;

  constructor(escena: Scene) {
    const naranja = material(escena, "#ff6a13");
    const cresta = material(escena, "#ff8c3a");
    const negro = material(escena, "#1b1b1b");
    const pico = material(escena, "#f5b83d");
    const blanco = material(escena, "#ffffff", 0.9);
    this.raiz = new TransformNode("tuki", escena);
    const m = (mesh: Mesh, mat: StandardMaterial, x: number, y: number, z: number) => {
      this.mallas.push(pieza(mesh, this.raiz, mat, x, y, z));
      return mesh;
    };
    m(MeshBuilder.CreateSphere("cuerpo", { diameter: 0.5, segments: 10 }, escena), naranja, 0, 0, 0);
    m(MeshBuilder.CreateSphere("cabeza", { diameter: 0.36, segments: 10 }, escena), naranja, 0, 0.3, 0.12);
    const c = m(MeshBuilder.CreateCylinder("cresta", { height: 0.06, diameter: 0.42, tessellation: 16 }, escena), cresta, 0, 0.42, 0.14);
    c.rotation.z = Math.PI / 2;
    m(MeshBuilder.CreateSphere("ojo", { diameter: 0.08, segments: 6 }, escena), negro, 0.1, 0.33, 0.26);
    m(MeshBuilder.CreateSphere("ojo2", { diameter: 0.08, segments: 6 }, escena), negro, -0.1, 0.33, 0.26);
    m(MeshBuilder.CreateSphere("brillo", { diameter: 0.03, segments: 4 }, escena), blanco, 0.11, 0.35, 0.3);
    m(MeshBuilder.CreateCylinder("pico", { height: 0.14, diameterTop: 0, diameterBottom: 0.08, tessellation: 6 }, escena), pico, 0, 0.27, 0.32).rotation.x = Math.PI / 2;
    this.alaI = m(MeshBuilder.CreateBox("ala", { width: 0.06, height: 0.3, depth: 0.34 }, escena), negro, -0.26, 0.02, -0.02);
    this.alaD = m(MeshBuilder.CreateBox("ala", { width: 0.06, height: 0.3, depth: 0.34 }, escena), negro, 0.26, 0.02, -0.02);
  }

  seguir(objetivo: TransformNode, dt: number) {
    this.tiempo += dt;
    const lado = new Vector3(Math.cos(objetivo.rotation.y) * -0.9, 0, Math.sin(objetivo.rotation.y) * 0.9);
    const destino = objetivo.position.add(lado).add(new Vector3(0, 2.9 + Math.sin(this.tiempo * 3) * 0.12, -0.3));
    this.raiz.position = Vector3.Lerp(this.raiz.position, destino, Math.min(1, dt * 4));
    this.raiz.rotation.y = objetivo.rotation.y;
    const aleteo = Math.sin(this.tiempo * 18) * 0.6;
    this.alaI.rotation.z = aleteo;
    this.alaD.rotation.z = -aleteo;
  }
}
