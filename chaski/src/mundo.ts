// La plaza andina de la Fase 0: suelo, fuente, casas, andenes, árboles y montañas.
// En la versión final, cada región se armará desde un archivo de datos con piezas 3D.

import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { material } from "./personajes";

export interface Choque {
  x: number;
  z: number;
  r: number;
}

/** Objetos que el Ojo puede "leer" (adelanto de la Fase 1). */
export interface Leible {
  posicion: Vector3;
  texto: string;
}

export const LIMITE = 24; // radio del área caminable

function azar(semilla: number) {
  const x = Math.sin(semilla * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export function crearMundo(escena: Scene) {
  const mallas: Mesh[] = [];
  const choques: Choque[] = [];
  const leibles: Leible[] = [];
  const agrega = <T extends Mesh>(m: T) => (mallas.push(m), m);

  // Suelo de pasto y plaza de piedra
  const pasto = agrega(MeshBuilder.CreateGround("pasto", { width: 140, height: 140 }, escena));
  pasto.material = material(escena, "#4f9a3f");
  const plaza = agrega(MeshBuilder.CreateDisc("plaza", { radius: 10, tessellation: 40 }, escena));
  plaza.rotation.x = Math.PI / 2;
  plaza.position.y = 0.02;
  plaza.material = material(escena, "#b9a07c");
  const anillo = agrega(MeshBuilder.CreateTorus("borde", { diameter: 20, thickness: 0.35, tessellation: 48 }, escena));
  anillo.position.y = 0.05;
  anillo.material = material(escena, "#a8916f");
  // Caminos
  for (const [x, z, w, d] of [[0, 17, 3.2, 14], [0, -17, 3.2, 14], [17, 0, 14, 3.2], [-17, 0, 14, 3.2]]) {
    const camino = agrega(MeshBuilder.CreateGround("camino", { width: w, height: d }, escena));
    camino.position.set(x, 0.015, z);
    camino.material = material(escena, "#c9a774");
  }

  // Fuente con el símbolo del Inti
  const base = agrega(MeshBuilder.CreateCylinder("fuente", { height: 0.7, diameter: 4.2, tessellation: 24 }, escena));
  base.position.y = 0.35;
  base.material = material(escena, "#9c8b78");
  const agua = agrega(MeshBuilder.CreateCylinder("agua", { height: 0.1, diameter: 3.6, tessellation: 24 }, escena));
  agua.position.y = 0.74;
  agua.material = material(escena, "#3fa7d6", 0.6);
  const columna = agrega(MeshBuilder.CreateCylinder("columna", { height: 1.8, diameter: 0.6, tessellation: 12 }, escena));
  columna.position.y = 1.4;
  columna.material = material(escena, "#9c8b78");
  const inti = agrega(MeshBuilder.CreateTorus("inti", { diameter: 1.3, thickness: 0.22, tessellation: 24 }, escena));
  inti.position.y = 2.75;
  inti.rotation.x = Math.PI / 2;
  inti.material = material(escena, "#f5b83d", 0.5);
  const sol = agrega(MeshBuilder.CreateSphere("sol", { diameter: 0.7, segments: 12 }, escena));
  sol.position.y = 2.75;
  sol.material = material(escena, "#ffd166", 0.5);
  escena.onBeforeRenderObservable.add(() => (inti.rotation.z += 0.01));
  choques.push({ x: 0, z: 0, r: 2.4 });
  leibles.push({ posicion: new Vector3(0, 3.5, 0), texto: 'fuente.agua = True' });

  // Casas andinas: muros de adobe y techo rojo a cuatro aguas
  const casas: [number, number, number][] = [
    [-12, 12, 0.6], [12, 12, -0.6], [-13, -11, 2.4], [13, -11, -2.4], [-20, 3, 1.57], [20, -4, -1.57],
  ];
  casas.forEach(([x, z, giro], i) => {
    const muro = agrega(MeshBuilder.CreateBox("casa", { width: 4.4, height: 2.6, depth: 3.6 }, escena));
    muro.position.set(x, 1.3, z);
    muro.rotation.y = giro;
    muro.material = material(escena, i % 2 ? "#efe3cf" : "#e8cf9f");
    const techo = agrega(MeshBuilder.CreateCylinder("techo", { height: 1.7, diameterTop: 0, diameterBottom: 5.6, tessellation: 4 }, escena));
    techo.position.set(x, 3.45, z);
    techo.rotation.y = giro + Math.PI / 4;
    techo.material = material(escena, "#b8432f");
    const puerta = agrega(MeshBuilder.CreateBox("puerta", { width: 1, height: 1.7, depth: 0.1 }, escena));
    puerta.parent = muro;
    puerta.position.set(0, -0.45, 1.81);
    puerta.material = material(escena, "#2b6cb0");
    choques.push({ x, z, r: 2.6 });
    if (i === 0) leibles.push({ posicion: new Vector3(x, 4.8, z), texto: 'casa.techo = "rojo"' });
  });

  // Andenes (terrazas de cultivo) al fondo
  for (let nivel = 0; nivel < 4; nivel++) {
    const anden = agrega(MeshBuilder.CreateBox("anden", { width: 40 - nivel * 4, height: 1.1, depth: 4 }, escena));
    anden.position.set(0, 0.55 + nivel * 1.1, 30 + nivel * 3.2);
    anden.material = material(escena, nivel % 2 ? "#6fb35a" : "#5b9b48");
    const muro = agrega(MeshBuilder.CreateBox("pirqa", { width: 40 - nivel * 4, height: 1.1, depth: 0.4 }, escena));
    muro.position.set(0, 0.55 + nivel * 1.1, 28.1 + nivel * 3.2);
    muro.material = material(escena, "#8f8577");
  }

  // Montañas (apus) con nieve
  for (let i = 0; i < 14; i++) {
    const angulo = (i / 14) * Math.PI * 2 + 0.2;
    const distancia = 62 + azar(i) * 14;
    const alto = 22 + azar(i + 7) * 20;
    const monte = agrega(MeshBuilder.CreateCylinder("apu", { height: alto, diameterTop: 0, diameterBottom: alto * 1.5, tessellation: 7 }, escena));
    monte.position.set(Math.sin(angulo) * distancia, alto / 2 - 1, Math.cos(angulo) * distancia);
    monte.material = material(escena, i % 2 ? "#6f8f5a" : "#7c8f6a");
    const nieve = agrega(MeshBuilder.CreateCylinder("nieve", { height: alto * 0.25, diameterTop: 0, diameterBottom: alto * 0.38, tessellation: 7 }, escena));
    nieve.position.set(monte.position.x, alto - 1 - alto * 0.125 + 0.05, monte.position.z);
    nieve.material = material(escena, "#f4f7fb");
  }

  // Árboles (queñuas) y rocas
  let k = 0;
  for (let i = 0; i < 40; i++) {
    const angulo = azar(i * 3.1) * Math.PI * 2;
    const distancia = 11.5 + azar(i * 5.7) * 13;
    const x = Math.sin(angulo) * distancia;
    const z = Math.cos(angulo) * distancia;
    if (Math.abs(x) < 2.5 || Math.abs(z) < 2.5) continue; // no tapar los caminos
    if (choques.some((c) => Math.hypot(c.x - x, c.z - z) < c.r + 1.6)) continue;
    k++;
    if (azar(i * 9.1) > 0.75) {
      const roca = agrega(MeshBuilder.CreateSphere("roca", { diameter: 1.2 + azar(i) * 0.8, segments: 6 }, escena));
      roca.scaling.y = 0.6;
      roca.position.set(x, 0.3, z);
      roca.material = material(escena, "#9a9389");
      choques.push({ x, z, r: 0.8 });
      continue;
    }
    const tronco = agrega(MeshBuilder.CreateCylinder("tronco", { height: 1.6, diameter: 0.36, tessellation: 6 }, escena));
    tronco.position.set(x, 0.8, z);
    tronco.material = material(escena, "#7a4b2a");
    for (let j = 0; j < 3; j++) {
      const copa = agrega(MeshBuilder.CreateSphere("copa", { diameter: 1.6 - j * 0.3, segments: 8 }, escena));
      copa.position.set(x + (j - 1) * 0.35, 2.0 + j * 0.45, z + (j % 2) * 0.3);
      copa.material = material(escena, j % 2 ? "#3f8f3a" : "#2f7a32");
    }
    choques.push({ x, z, r: 0.6 });
  }
  void k;

  return { mallas, choques, leibles };
}

/** Empuja la posición fuera de los objetos sólidos y dentro del límite del mapa. */
export function resolverChoques(pos: Vector3, choques: Choque[], radio = 0.45) {
  for (const c of choques) {
    const dx = pos.x - c.x;
    const dz = pos.z - c.z;
    const d = Math.hypot(dx, dz);
    const minimo = c.r + radio;
    if (d < minimo && d > 0.0001) {
      pos.x = c.x + (dx / d) * minimo;
      pos.z = c.z + (dz / d) * minimo;
    }
  }
  const d = Math.hypot(pos.x, pos.z);
  if (d > LIMITE) {
    pos.x *= LIMITE / d;
    pos.z *= LIMITE / d;
  }
}
