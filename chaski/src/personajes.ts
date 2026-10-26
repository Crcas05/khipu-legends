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

export function pieza(m: Mesh, padre: TransformNode, mat: StandardMaterial, x = 0, y = 0, z = 0): Mesh {
  m.parent = padre;
  m.position.set(x, y, z);
  m.material = mat;
  return m;
}

// ---------------------------------------------------------------------------
// Yaru, la llama
// ---------------------------------------------------------------------------
export function crearLlama(escena: Scene, x: number, z: number, lanaHex = "#f3ebdc", conManta = true) {
  // (Yaru será héroe jugable en la Misión 4). Con otro color y sin manta sirve de vicuña.
  const lana = material(escena, lanaHex);
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
  if (conManta) {
    m(MeshBuilder.CreateBox("manta", { width: 0.9, height: 0.12, depth: 0.8 }, escena), manta, 0, 1.55, -0.05);
    m(MeshBuilder.CreateBox("manta-franja", { width: 0.92, height: 0.13, depth: 0.16 }, escena), franja, 0, 1.56, -0.05);
  }
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
