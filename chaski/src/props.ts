// Objetos que Chaski lleva EN LA MANO: el pututo (caracola) y las armas andinas.
// Se sujetan al hueso "handslot" del modelo, así se mueven con la animación.

import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { material } from "./personajes";

const pieza = (m: Mesh, padre: TransformNode, mat: ReturnType<typeof material>) => {
  m.parent = padre;
  m.material = mat;
  m.isPickable = false;
  return m;
};

/** Pututo: caracola marina en espiral con boquilla (los chaskis lo soplaban para anunciarse). */
export function crearPututo(escena: Scene): TransformNode {
  const raiz = new TransformNode("pututo", escena);
  const concha = material(escena, "#efd9b4", 0.25);
  const rosado = material(escena, "#e8a07f", 0.2);
  const oscuro = material(escena, "#8a5a3a");
  // Espiral: un tubo que se enrolla y se ensancha hacia la boca
  const camino: Vector3[] = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const ang = t * Math.PI * 3.2;
    const r = 0.04 + t * 0.12;
    camino.push(new Vector3(Math.cos(ang) * r, t * 0.55, Math.sin(ang) * r));
  }
  const tubo = MeshBuilder.CreateTube("pututo-espiral", { path: camino, radiusFunction: (i) => 0.02 + (i / 40) * 0.13, tessellation: 12, cap: 2 }, escena);
  pieza(tubo, raiz, concha);
  // Boca nacarada (abertura grande)
  const boca = MeshBuilder.CreateSphere("pututo-boca", { diameter: 0.34, segments: 10 }, escena);
  boca.scaling.set(1, 0.55, 0.8);
  boca.position.set(0.1, 0.56, 0.03);
  pieza(boca, raiz, rosado);
  // Boquilla para soplar (en la punta)
  const boquilla = MeshBuilder.CreateCylinder("pututo-boquilla", { height: 0.1, diameter: 0.06, tessellation: 8 }, escena);
  boquilla.position.set(0.04, -0.03, 0);
  pieza(boquilla, raiz, oscuro);
  // Cordón de lana para colgarlo
  const cordon = MeshBuilder.CreateTorus("pututo-cordon", { diameter: 0.28, thickness: 0.02, tessellation: 16 }, escena);
  cordon.position.set(0, 0.25, 0);
  cordon.rotation.z = 1.2;
  pieza(cordon, raiz, material(escena, "#c8102e"));
  return raiz;
}

/** Arma en la mano según su id (huaraca, champi, lanza, liwi, arco). */
export function crearArmaProp(escena: Scene, id: string): TransformNode {
  const raiz = new TransformNode(`arma-${id}`, escena);
  const lana = material(escena, "#d9c39a");
  const lanaRoja = material(escena, "#b8241c");
  const madera = material(escena, "#7a4e2a");
  const bronce = material(escena, "#c8923a", 0.5);
  const piedra = material(escena, "#8d8a85");
  if (id === "huaraca") {
    // Honda de lana trenzada: dos cuerdas y la "cuna" con una piedra
    const cuerda = (lado: number) => {
      const path = [new Vector3(0, 0, 0), new Vector3(0.05 * lado, -0.35, 0.02), new Vector3(0.09 * lado, -0.7, 0)];
      return pieza(MeshBuilder.CreateTube("huaraca-cuerda", { path, radius: 0.018, tessellation: 6 }, escena), raiz, lado > 0 ? lana : lanaRoja);
    };
    cuerda(1);
    cuerda(-1);
    const cuna = pieza(MeshBuilder.CreateSphere("huaraca-cuna", { diameter: 0.22, segments: 8 }, escena), raiz, lanaRoja);
    cuna.position.set(0, -0.75, 0);
    cuna.scaling.set(1.2, 0.5, 0.8);
    const roca = pieza(MeshBuilder.CreateSphere("huaraca-piedra", { diameter: 0.12, segments: 6 }, escena), raiz, piedra);
    roca.position.set(0, -0.72, 0);
  } else if (id === "champi") {
    // Champi: mazo de guerra inca con cabeza de bronce en forma de estrella
    const mango = pieza(MeshBuilder.CreateCylinder("champi-mango", { height: 1.0, diameter: 0.07, tessellation: 8 }, escena), raiz, madera);
    mango.position.y = 0.35;
    const cabeza = pieza(MeshBuilder.CreateCylinder("champi-estrella", { height: 0.1, diameter: 0.26, tessellation: 6 }, escena), raiz, bronce);
    cabeza.position.y = 0.86;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const punta = pieza(MeshBuilder.CreateCylinder("champi-punta", { height: 0.16, diameterTop: 0, diameterBottom: 0.09, tessellation: 4 }, escena), raiz, bronce);
      punta.position.set(Math.cos(a) * 0.17, 0.86, Math.sin(a) * 0.17);
      punta.rotation.set(0, -a, Math.PI / 2);
    }
  } else if (id === "lanza") {
    const asta = pieza(MeshBuilder.CreateCylinder("lanza-asta", { height: 2.2, diameter: 0.06, tessellation: 8 }, escena), raiz, madera);
    asta.position.y = 0.5;
    const punta = pieza(MeshBuilder.CreateCylinder("lanza-punta", { height: 0.3, diameterTop: 0, diameterBottom: 0.1, tessellation: 4 }, escena), raiz, bronce);
    punta.position.y = 1.75;
    const plumas = pieza(MeshBuilder.CreateBox("lanza-borla", { width: 0.12, height: 0.12, depth: 0.12 }, escena), raiz, lanaRoja);
    plumas.position.y = 1.55;
  } else if (id === "liwi") {
    // Liwi (boleadora): tres piedras atadas a cuerdas
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const fin = new Vector3(Math.cos(a) * 0.18, -0.55, Math.sin(a) * 0.18);
      pieza(MeshBuilder.CreateTube("liwi-cuerda", { path: [Vector3.Zero(), fin], radius: 0.014, tessellation: 5 }, escena), raiz, lana);
      const b = pieza(MeshBuilder.CreateSphere("liwi-bola", { diameter: 0.13, segments: 6 }, escena), raiz, piedra);
      b.position.copyFrom(fin);
    }
  } else if (id === "arco") {
    // Arco de chonta (palmera amazónica) con su cuerda y una flecha
    const curva: Vector3[] = [];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16 - 0.5;
      curva.push(new Vector3(0, t * 1.5, -Math.cos(t * Math.PI) * 0.22));
    }
    pieza(MeshBuilder.CreateTube("arco-madera", { path: curva, radiusFunction: (i) => 0.035 - Math.abs(i - 8) * 0.0018, tessellation: 7 }, escena), raiz, material(escena, "#3a2416"));
    pieza(MeshBuilder.CreateTube("arco-cuerda", { path: [curva[0], curva[16]], radius: 0.006, tessellation: 4 }, escena), raiz, lana);
    const flecha = pieza(MeshBuilder.CreateCylinder("arco-flecha", { height: 1.1, diameter: 0.025, tessellation: 5 }, escena), raiz, material(escena, "#b9935a"));
    flecha.rotation.x = Math.PI / 2;
    flecha.position.z = 0.25;
    const pluma = pieza(MeshBuilder.CreateBox("arco-pluma", { width: 0.01, height: 0.08, depth: 0.16 }, escena), raiz, material(escena, "#2f9e5a"));
    pluma.position.z = -0.22;
  }
  return raiz;
}
