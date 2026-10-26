// Región 2: la selva de Ch'aqwa. Claro en la selva, río, árboles gigantes,
// tres piedras sagradas (rumi) y una puerta inca (punku) sellada por el Bug.

import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { material } from "./personajes";
import type { Choque } from "./mundo";

function azar(semilla: number) {
  const x = Math.sin(semilla * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export const PIEDRAS = [new Vector3(-6, 0, 5), new Vector3(0, 0, 9), new Vector3(6, 0, 5)];
export const PUERTA = new Vector3(0, 0, 16);
export const AMARU_POS = new Vector3(4.5, 0, 11);
export const INICIO_SELVA = new Vector3(0, 0, -12);
export const LIMITE_SELVA = 21;

export function crearSelva(escena: Scene) {
  const raiz = new TransformNode("selva", escena);
  const mallas: Mesh[] = [];
  const choques: Choque[] = [];
  const agrega = <T extends Mesh>(m: T, x = 0, y = 0, z = 0) => {
    m.parent = raiz;
    m.position.set(x, y, z);
    mallas.push(m);
    return m;
  };

  // Suelo de la selva y claro central
  const suelo = agrega(MeshBuilder.CreateGround("pasto", { width: 140, height: 140 }, escena));
  suelo.material = material(escena, "#2e6b2a");
  const claro = agrega(MeshBuilder.CreateDisc("plaza", { radius: 14, tessellation: 40 }, escena), 0, 0.02, 2);
  claro.rotation.x = Math.PI / 2;
  claro.material = material(escena, "#6aa84f");
  const sendero = agrega(MeshBuilder.CreateGround("camino", { width: 3, height: 16 }, escena), 0, 0.03, -14);
  sendero.material = material(escena, "#a67c52");

  // Río Ch'aqwa al este (no se puede cruzar)
  const aguaMat = material(escena, "#2e9fd6", 0.7);
  aguaMat.emissiveColor = new Color3(0.05, 0.25, 0.35);
  const rio = agrega(MeshBuilder.CreateGround("agua", { width: 5, height: 80 }, escena), 17.5, 0.05, 0);
  rio.material = aguaMat;
  for (let z = -36; z <= 36; z += 2.5) choques.push({ x: 17.5, z, r: 2.6 });
  for (let i = 0; i < 14; i++) {
    const roca = agrega(MeshBuilder.CreateSphere("roca", { diameter: 0.8 + azar(i) * 0.9, segments: 6 }, escena), 14.6 + azar(i + 3) * 0.6, 0.2, -30 + i * 4.6);
    roca.scaling.y = 0.6;
    roca.material = material(escena, "#8a8378");
  }

  // Puerta inca (forma trapezoidal) sellada por el Bug
  const piedraInca = material(escena, "#9d927f");
  for (const lado of [-1, 1]) {
    const jamba = agrega(MeshBuilder.CreateBox("pirqa", { width: 1.4, height: 5, depth: 1.6 }, escena), lado * 2.1, 2.5, PUERTA.z);
    jamba.rotation.z = -lado * 0.08;
    jamba.material = piedraInca;
    choques.push({ x: lado * 2.2, z: PUERTA.z, r: 1.1 });
    const muro = agrega(MeshBuilder.CreateBox("pirqa", { width: 10, height: 4, depth: 1.6 }, escena), lado * 7.6, 2, PUERTA.z + 0.3);
    muro.material = piedraInca;
    for (let x = 3.5; x <= 12; x += 1.6) choques.push({ x: lado * x, z: PUERTA.z + 0.3, r: 1 });
  }
  const dintel = agrega(MeshBuilder.CreateBox("pirqa", { width: 5.6, height: 1.1, depth: 1.8 }, escena), 0, 5.4, PUERTA.z);
  dintel.material = piedraInca;
  const selloMat = new StandardMaterial("m-sello", escena);
  selloMat.diffuseColor = new Color3(0.5, 0.2, 1);
  selloMat.emissiveColor = new Color3(0.35, 0.1, 0.8);
  selloMat.alpha = 0.75;
  const sello = agrega(MeshBuilder.CreatePlane("sello", { width: 3.2, height: 4.8 }, escena), 0, 2.4, PUERTA.z);
  sello.material = selloMat;
  sello.isPickable = false;
  const choqueSello: Choque = { x: 0, z: PUERTA.z, r: 1.6 };
  choques.push(choqueSello);

  // Tres piedras sagradas (rumi) con runas que se encienden
  const apagada = material(escena, "#6f6a62");
  const runaApagada = material(escena, "#3d3a52");
  const runaEncendida = new StandardMaterial("m-runa-on", escena);
  runaEncendida.diffuseColor = new Color3(1, 0.82, 0.3);
  runaEncendida.emissiveColor = new Color3(1, 0.7, 0.15);
  const runas: Mesh[] = [];
  PIEDRAS.forEach((p) => {
    const base = agrega(MeshBuilder.CreateCylinder("rumi", { height: 0.35, diameter: 2.2, tessellation: 8 }, escena), p.x, 0.17, p.z);
    base.material = apagada;
    const runa = agrega(MeshBuilder.CreateTorus("runa", { diameter: 1.3, thickness: 0.12, tessellation: 24 }, escena), p.x, 0.38, p.z);
    runa.material = runaApagada;
    runas.push(runa);
  });

  // Árbol gigante (lupuna) detrás de la puerta y selva espesa alrededor
  const tronco = material(escena, "#6b4a2f");
  const hojas = [material(escena, "#1f5e2a"), material(escena, "#2b7a35"), material(escena, "#17491f")];
  const lupuna = agrega(MeshBuilder.CreateCylinder("tronco", { height: 16, diameterTop: 1.8, diameterBottom: 4, tessellation: 10 }, escena), 0, 8, 26);
  lupuna.material = tronco;
  for (let j = 0; j < 4; j++) {
    const copa = agrega(MeshBuilder.CreateSphere("copa", { diameter: 11 - j * 1.5, segments: 10 }, escena), (j - 1.5) * 3, 16 + (j % 2) * 2, 26 + (j % 2));
    copa.scaling.y = 0.5;
    copa.material = hojas[j % 3];
  }
  for (let i = 0; i < 60; i++) {
    const angulo = azar(i * 2.3) * Math.PI * 2;
    const distancia = 15 + azar(i * 4.1) * 16;
    const x = Math.sin(angulo) * distancia;
    const z = Math.cos(angulo) * distancia + 2;
    if (x > 13 && x < 22) continue; // el río
    if (Math.abs(x) < 3 && z < -6) continue; // el sendero
    if (Math.abs(z - PUERTA.z) < 3 && Math.abs(x) < 13) continue; // el muro
    const alto = 4 + azar(i + 9) * 5;
    agrega(MeshBuilder.CreateCylinder("tronco", { height: alto, diameter: 0.5 + azar(i) * 0.4, tessellation: 6 }, escena), x, alto / 2, z).material = tronco;
    const copa = agrega(MeshBuilder.CreateSphere("copa", { diameter: 3 + azar(i + 1) * 2.5, segments: 8 }, escena), x, alto + 0.6, z);
    copa.scaling.y = 0.7;
    copa.material = hojas[i % 3];
    choques.push({ x, z, r: 0.7 });
  }
  // Helechos (unidos para que el celular dibuje poco)
  const helechos: Mesh[] = [];
  for (let i = 0; i < 70; i++) {
    const angulo = azar(i * 7.7) * Math.PI * 2;
    const distancia = 6 + azar(i * 3.3) * 17;
    const h = MeshBuilder.CreateCylinder("helecho", { height: 0.9, diameterTop: 0.9, diameterBottom: 0.05, tessellation: 5 }, escena);
    h.position.set(Math.sin(angulo) * distancia, 0.45, Math.cos(angulo) * distancia + 2);
    helechos.push(h);
  }
  const unidos = Mesh.MergeMeshes(helechos, true);
  if (unidos) {
    unidos.name = "helecho";
    unidos.material = material(escena, "#3f9a3a");
    agrega(unidos, 0, 0, 0);
  }

  raiz.setEnabled(false);

  const control = {
    activarPiedra(i: number, encendida: boolean) {
      runas[i].material = encendida ? runaEncendida : runaApagada;
    },
    abrirPuerta(abierta: boolean) {
      sello.setEnabled(!abierta);
      choqueSello.r = abierta ? 0 : 1.6;
    },
  };
  return { raiz, mallas, choques, control, sello };
}
