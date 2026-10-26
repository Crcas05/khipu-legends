// La plaza andina de la Fase 0: suelo, fuente, casas, andenes, árboles y montañas.
// En la versión final, cada región se armará desde un archivo de datos con piezas 3D.

import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
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
  const techos: Mesh[] = [];
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
    techos.push(techo);
    const puerta = agrega(MeshBuilder.CreateBox("puerta", { width: 1, height: 1.7, depth: 0.1 }, escena));
    puerta.parent = muro;
    puerta.position.set(0, -0.45, 1.81);
    puerta.material = material(escena, "#2b6cb0");
    choques.push({ x, z, r: 2.6 });
    if (i === 0) leibles.push({ posicion: new Vector3(x, 4.8, z), texto: "casa" });
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

  // Cielo con degradado (cúpula) y nubes que pasan
  const cieloMat = new StandardMaterial("m-cielo", escena);
  const cieloTx = new DynamicTexture("tx-cielo", { width: 8, height: 256 }, escena, false);
  const cc = cieloTx.getContext() as unknown as CanvasRenderingContext2D;
  const deg = cc.createLinearGradient(0, 0, 0, 256);
  deg.addColorStop(0, "#3d8fd6");
  deg.addColorStop(0.45, "#8fd0f4");
  deg.addColorStop(0.62, "#ffe7b8");
  deg.addColorStop(1, "#ffe7b8");
  cc.fillStyle = deg;
  cc.fillRect(0, 0, 8, 256);
  cieloTx.update();
  cieloMat.emissiveTexture = cieloTx;
  cieloMat.disableLighting = true;
  cieloMat.backFaceCulling = false;
  cieloMat.fogEnabled = false;
  const cupula = MeshBuilder.CreateSphere("cielo", { diameter: 190, segments: 16 }, escena);
  cupula.material = cieloMat;
  cupula.isPickable = false;
  cupula.infiniteDistance = true;

  const blancoNube = material(escena, "#ffffff", 0);
  blancoNube.emissiveColor = new Color3(0.75, 0.78, 0.82);
  const nubes: Mesh[] = [];
  for (let i = 0; i < 9; i++) {
    const partes: Mesh[] = [];
    for (let j = 0; j < 4; j++) {
      const b = MeshBuilder.CreateSphere("nube", { diameter: 4 + azar(i * 7 + j) * 3, segments: 8 }, escena);
      b.position.set(j * 2.4 - 3.6, azar(i + j * 3) * 1.2, azar(j + i) * 1.5);
      b.scaling.y = 0.55;
      partes.push(b);
    }
    const nube = Mesh.MergeMeshes(partes, true)!;
    nube.name = "nube";
    nube.material = blancoNube;
    nube.position.set(-60 + i * 15, 26 + azar(i * 2) * 8, 20 + azar(i * 5) * 40 - 20);
    nubes.push(nube);
  }
  escena.onBeforeRenderObservable.add(() => {
    const dt = escena.getEngine().getDeltaTime() / 1000;
    for (const n of nubes) {
      n.position.x += dt * 1.2;
      if (n.position.x > 75) n.position.x = -75;
    }
  });

  // Flores de colores en el pasto (unidas por color para que el celular dibuje poco)
  for (const color of ["#ff5d8f", "#ffd166", "#ffffff", "#b388ff"]) {
    const grupo: Mesh[] = [];
    for (let i = 0; i < 26; i++) {
      const sem = i * 13 + color.charCodeAt(1);
      const angulo = azar(sem) * Math.PI * 2;
      const distancia = 10.8 + azar(sem + 1) * 14;
      const x = Math.sin(angulo) * distancia;
      const z = Math.cos(angulo) * distancia;
      if (Math.abs(x) < 1.8 || Math.abs(z) < 1.8) continue;
      const flor = MeshBuilder.CreateSphere("flor", { diameter: 0.28, segments: 4 }, escena);
      flor.position.set(x, 0.14, z);
      grupo.push(flor);
    }
    const flores = Mesh.MergeMeshes(grupo, true);
    if (flores) {
      flores.name = "flor";
      flores.material = material(escena, color, 0.2);
      mallas.push(flores);
    }
  }

  // Glitches del Bug Ch'aqwa: cubos morados que desordenan el código del pueblo
  const glitches: Mesh[] = [];
  const morado = material(escena, "#8b3dff", 0.4);
  morado.emissiveColor = Color3.FromHexString("#5b1fd1");
  for (let i = 0; i < 7; i++) {
    const g = MeshBuilder.CreateBox("glitch", { size: 0.35 + azar(i + 40) * 0.3 }, escena);
    g.material = morado;
    glitches.push(g);
  }
  let t = 0;
  escena.onBeforeRenderObservable.add(() => {
    t += escena.getEngine().getDeltaTime() / 1000;
    glitches.forEach((g, i) => {
      const a = t * (0.6 + i * 0.07) + i;
      g.position.set(Math.sin(a) * (3 + (i % 3) * 0.6), 1.2 + Math.sin(t * 2 + i) * 0.6 + (i % 2), Math.cos(a) * (3 + (i % 3) * 0.6));
      g.rotation.set(t * 1.3 + i, t * 0.9, t * 0.5 * i);
      // Parpadeo "glitch"
      g.isVisible = g.metadata !== "oculto" && Math.sin(t * 9 + i * 3) > -0.85;
    });
  });

  const gris = material(escena, "#7d7d85");
  const rojo = material(escena, "#b8432f");
  const azul = material(escena, "#2f6fd1");
  const verde = material(escena, "#3f8f3a");
  const coloresTecho: Record<string, typeof rojo> = { gris, rojo, azul, verde };
  const intiOro = inti.material;
  const intiApagado = material(escena, "#6f6a62");

  const control = {
    /** fuente.agua = True / False */
    agua(hay: boolean) {
      agua.isVisible = hay;
      inti.material = hay ? intiOro : intiApagado;
      sol.material = hay ? material(escena, "#ffd166", 0.5) : intiApagado;
    },
    /** casa.techo = "rojo" | "gris" | ... */
    techo(color: string) {
      const mat = coloresTecho[color] ?? gris;
      for (const tec of techos) tec.material = mat;
    },
    /** Muestra u oculta los glitches del Bug */
    bug(visible: boolean) {
      for (const g of glitches) g.metadata = visible ? null : "oculto";
    },
  };

  return { mallas, choques, leibles, control, glitches, cupula, nubes };
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
