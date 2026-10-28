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
import { texturaPasto, texturaAdobe, texturaTejas, texturaPiedraInca, texturaIchu } from "./texturas";
import { crearTerreno, crearPastizal, alturaTerreno, aguaViva, type OpcionesTerreno } from "./terreno";
import type { Colocacion } from "./paisaje";

function conTextura(escena: Scene, nombre: string, tex: StandardMaterial["diffuseTexture"], color = "#ffffff") {
  const m = new StandardMaterial(nombre, escena);
  m.diffuseTexture = tex;
  m.diffuseColor = Color3.FromHexString(color);
  m.specularColor = new Color3(0.04, 0.04, 0.04);
  m.emissiveColor = Color3.FromHexString(color).scale(0.06);
  return m;
}

export interface Choque {
  x: number;
  z: number;
  r: number;
  /** Obstáculo bajo (tronco, muro, roca): si Chaski salta más alto que esto, lo pasa por encima. */
  alto?: number;
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
  // Valle con relieve: plano donde se juega y cerros con ichu dorado alrededor
  const OPC: OpcionesTerreno = {
    tamano: 300,
    plano: 32,
    alto: 22,
    material: conTextura(escena, "m-pasto", texturaPasto(escena, "#5c9a43", 48)),
    ladera: conTextura(escena, "m-ladera", texturaIchu(escena, 30), "#e8d9a8"),
  };
  const [pasto, ladera] = crearTerreno(escena, "pasto", OPC);
  mallas.push(pasto, ladera);
  const sobre = (x: number, z: number) => alturaTerreno(OPC, x, z);
  const paisaje: Colocacion[] = [];
  const plaza = agrega(MeshBuilder.CreateDisc("plaza", { radius: 10, tessellation: 40 }, escena));
  plaza.rotation.x = Math.PI / 2;
  plaza.position.y = 0.02;
  const empedrado = texturaPiedraInca(escena);
  empedrado.uScale = empedrado.vScale = 5;
  plaza.material = conTextura(escena, "m-plaza", empedrado, "#e9dcc4");
  const anillo = agrega(MeshBuilder.CreateTorus("borde", { diameter: 20, thickness: 0.35, tessellation: 48 }, escena));
  anillo.position.y = 0.05;
  anillo.material = material(escena, "#a8916f");
  // Caminos
  for (const [x, z, w, d] of [[0, 17, 3.2, 14], [0, -17, 3.2, 14], [17, 0, 14, 3.2], [-17, 0, 14, 3.2]]) {
    const camino = agrega(MeshBuilder.CreateGround("camino", { width: w, height: d }, escena));
    camino.position.set(x, 0.015, z);
    const tx = texturaPiedraInca(escena).clone();
    tx.uScale = w / 4;
    tx.vScale = d / 4;
    camino.material = conTextura(escena, `m-camino-${x}-${z}`, tx, "#e3d2b0");
  }

  // Fuente con el símbolo del Inti
  const base = agrega(MeshBuilder.CreateCylinder("fuente", { height: 0.7, diameter: 4.2, tessellation: 24 }, escena));
  base.position.y = 0.35;
  base.material = material(escena, "#9c8b78");
  const agua = agrega(MeshBuilder.CreateCylinder("agua", { height: 0.1, diameter: 3.6, tessellation: 24 }, escena));
  agua.position.y = 0.74;
  agua.material = material(escena, "#3fa7d6", 0.6);
  aguaViva(escena, agua.material as StandardMaterial, 2);
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
  const adobe = conTextura(escena, "m-adobe", texturaAdobe(escena), "#ffffff");
  const techoMats: Record<string, StandardMaterial> = {};
  const tejas = texturaTejas(escena);
  for (const [n, c] of Object.entries({ gris: "#8d8d95", rojo: "#c2492f", azul: "#2f6fd1", verde: "#3f8f3a" })) techoMats[n] = conTextura(escena, `m-techo-${n}`, tejas, c);
  casas.forEach(([x, z, giro], i) => {
    const muro = agrega(MeshBuilder.CreateBox("casa", { width: 4.4, height: 2.6, depth: 3.6 }, escena));
    muro.position.set(x, 1.3, z);
    muro.rotation.y = giro;
    muro.material = adobe;
    const techo = agrega(MeshBuilder.CreateCylinder("techo", { height: 1.7, diameterTop: 0, diameterBottom: 5.6, tessellation: 4 }, escena));
    techo.position.set(x, 3.45, z);
    techo.rotation.y = giro + Math.PI / 4;
    techo.material = techoMats.gris;
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
    const distancia = 120 + azar(i) * 18;
    const alto = 46 + azar(i + 7) * 30;
    const monte = agrega(MeshBuilder.CreateCylinder("apu", { height: alto, diameterTop: 0, diameterBottom: alto * 1.5, tessellation: 7 }, escena));
    monte.position.set(Math.sin(angulo) * distancia, alto / 2 - 1 + 10, Math.cos(angulo) * distancia);
    monte.material = material(escena, i % 2 ? "#6f8f5a" : "#7c8f6a");
    const nieve = agrega(MeshBuilder.CreateCylinder("nieve", { height: alto * 0.25, diameterTop: 0, diameterBottom: alto * 0.38, tessellation: 7 }, escena));
    nieve.position.set(monte.position.x, alto - 1 + 10 - alto * 0.125 + 0.05, monte.position.z);
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
      paisaje.push({ modelo: azar(i) > 0.5 ? "rock_single_E" : "rock_single_C", x, z, escala: 4.5 + azar(i * 2) * 2, giro: azar(i * 4) * 6.28 });
      choques.push({ x, z, r: 0.9 });
      continue;
    }
    paisaje.push({ modelo: azar(i * 1.7) > 0.5 ? "tree_single_A" : "tree_single_B", x, z, escala: 2.8 + azar(i * 3) * 0.9, giro: azar(i * 6) * 6.28 });
    choques.push({ x, z, r: 0.6 });
  }
  void k;
  // Colinas con bosque alrededor del pueblo (fuera del área caminable)
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2 + azar(i * 3.3) * 0.2;
    const d = 31 + azar(i * 4.1) * 9;
    const x = Math.sin(a) * d;
    const z = Math.cos(a) * d;
    if (z > 24 && Math.abs(x) < 22) continue; // los andenes del fondo quedan libres
    if (z < -12 && Math.abs(x) < 30) continue; // detrás de la cámara: no tapar la vista
    paisaje.push({ modelo: ["hills_A_trees", "hills_B_trees", "hills_C_trees"][i % 3], x, z, y: sobre(x, z) - 0.3, escala: 6.5 + azar(i) * 2.5, giro: azar(i * 7) * 6.28 });
  }
  // Bosquecitos entre las casas y el borde
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + 0.3;
    const d = 26 + azar(i * 9.7) * 3;
    if (Math.cos(a) * d < -12 && Math.abs(Math.sin(a) * d) < 26) continue;
    paisaje.push({ modelo: i % 2 ? "trees_A_medium" : "trees_B_medium", x: Math.sin(a) * d, z: Math.cos(a) * d, y: sobre(Math.sin(a) * d, Math.cos(a) * d) - 0.2, escala: 3.6, giro: azar(i) * 6.28 });
  }
  // Montañas verdes con árboles (cerros cercanos) y rocas grandes
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + azar(i * 2.2) * 0.25;
    const d = 54 + azar(i * 3.9) * 14;
    const mx = Math.sin(a) * d;
    const mz = Math.cos(a) * d;
    paisaje.push({ modelo: ["mountain_A_grass_trees", "mountain_B_grass_trees", "mountain_C_grass_trees"][i % 3], x: mx, z: mz, y: sobre(mx, mz) - 2, escala: 13 + azar(i) * 5, alto: 1.2 + azar(i * 5) * 0.5, giro: azar(i * 8) * 6.28 });
  }
  for (let i = 0; i < 10; i++) {
    const a = azar(i * 13.1) * Math.PI * 2;
    const d = 27 + azar(i * 2.7) * 6;
    paisaje.push({ modelo: "resource_stone", x: Math.sin(a) * d, z: Math.cos(a) * d, y: sobre(Math.sin(a) * d, Math.cos(a) * d) - 0.1, escala: 5, giro: azar(i) * 6.28 });
  }
  // Matas de pasto e ichu (miles, muy livianas para el celular)
  const libre = (x: number, z: number) => {
    const r = Math.hypot(x, z);
    if (r < 11.5) return false; // plaza
    if (Math.abs(x) < 2.6 || Math.abs(z) < 2.6) return false; // caminos
    return !choques.some((c) => Math.hypot(c.x - x, c.z - z) < c.r + 0.4);
  };
  mallas.push(crearPastizal(escena, "matas", OPC, 1700, ["#8cc95c", "#5a9a3a"], libre, 46));
  mallas.push(crearPastizal(escena, "ichu-matas", { ...OPC }, 1400, ["#d9bf74", "#a88a3e"], (x, z) => Math.hypot(x, z) > 34, 75));

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
  // Centro y radio de la órbita del Bug (cambian cuando ataca al jugador)
  const centroBug = new Vector3(0, 0, 0);
  let radioBug = 3;
  let objetivoBug: Vector3 | null = null;
  let radioObjetivo = 3;
  escena.onBeforeRenderObservable.add(() => {
    const dt = escena.getEngine().getDeltaTime() / 1000;
    t += dt;
    const meta = objetivoBug ?? Vector3.Zero();
    centroBug.x += (meta.x - centroBug.x) * Math.min(1, dt * 3);
    centroBug.z += (meta.z - centroBug.z) * Math.min(1, dt * 3);
    radioBug += (radioObjetivo - radioBug) * Math.min(1, dt * 2);
    glitches.forEach((g, i) => {
      const a = t * (0.6 + i * 0.07) * (objetivoBug ? 2.2 : 1) + i;
      const r = radioBug + (i % 3) * 0.6 * (radioBug / 3);
      g.position.set(centroBug.x + Math.sin(a) * r, 1.2 + Math.sin(t * 2 + i) * 0.6 + (i % 2), centroBug.z + Math.cos(a) * r);
      g.rotation.set(t * 1.3 + i, t * 0.9, t * 0.5 * i);
      // Parpadeo "glitch"
      g.isVisible = g.metadata !== "oculto" && Math.sin(t * 9 + i * 3) > -0.85;
    });
  });

  const coloresTecho = techoMats;
  const gris = techoMats.gris;
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
    /** El Bug rodea al jugador (ataque) o vuelve a la fuente (null). radio: qué tan cerca. */
    atacar(objetivo: Vector3 | null, radio = 3) {
      objetivoBug = objetivo;
      radioObjetivo = radio;
    },
    /** Muestra u oculta los glitches del Bug */
    bug(visible: boolean) {
      for (const g of glitches) g.metadata = visible ? null : "oculto";
    },
  };

  return { mallas, choques, leibles, control, glitches, cupula, nubes, paisaje };
}

/** Empuja la posición fuera de los objetos sólidos y dentro del límite del mapa. */
export function resolverChoques(pos: Vector3, choques: Choque[], radio = 0.45, limite = LIMITE) {
  for (const c of choques) {
    if (c.alto !== undefined && pos.y > c.alto) continue;
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
  if (d > limite) {
    pos.x *= limite / d;
    pos.z *= limite / d;
  }
}
