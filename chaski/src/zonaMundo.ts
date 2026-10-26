// Construye en 3D cada zona del viaje (formas simples + colores de cada región).
// Cada lugar de lección tiene un altar con un cristal corrupto del Bug que se
// vuelve dorado al completar la lección.

import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { material } from "./personajes";
import type { Choque } from "./mundo";
import type { Zona, Ambiente } from "./datos/zonas";

export const LIMITE_ZONA = 30;
export const INICIO_ZONA = new Vector3(0, 0, -22);

function azar(s: number) {
  const x = Math.sin(s * 57.13) * 43758.5453;
  return x - Math.floor(x);
}

interface Paleta {
  suelo: string;
  sueloRestaurado: string;
  niebla: [number, number, number];
  apu: string[];
  nieve: boolean;
}
const PALETAS: Record<Ambiente, Paleta> = {
  altiplano: { suelo: "#a39a7a", sueloRestaurado: "#c4b47a", niebla: [0.78, 0.86, 0.95], apu: ["#8c8270", "#7d735f"], nieve: true },
  selva: { suelo: "#3d6b33", sueloRestaurado: "#3f9a3a", niebla: [0.55, 0.72, 0.55], apu: ["#2f6b33", "#3a7a3a"], nieve: false },
  nubes: { suelo: "#5e7d55", sueloRestaurado: "#6aa84f", niebla: [0.85, 0.88, 0.9], apu: ["#4f6b4a", "#5a7a52"], nieve: false },
  piedra: { suelo: "#8a8a74", sueloRestaurado: "#9fae7a", niebla: [0.78, 0.84, 0.9], apu: ["#7a7a6a", "#6c7360"], nieve: true },
  ayllu: { suelo: "#6c8f4a", sueloRestaurado: "#5fae45", niebla: [0.75, 0.86, 0.95], apu: ["#6f8f5a", "#7c8f6a"], nieve: true },
  desierto: { suelo: "#c9ad7a", sueloRestaurado: "#d8bd85", niebla: [0.9, 0.86, 0.78], apu: ["#b8996a", "#a88b5e"], nieve: false },
  barro: { suelo: "#b8976a", sueloRestaurado: "#cfae7a", niebla: [0.82, 0.86, 0.9], apu: ["#a78a63", "#9b8059"], nieve: false },
  feria: { suelo: "#8f9a62", sueloRestaurado: "#79a84f", niebla: [0.78, 0.86, 0.95], apu: ["#7a8a5a", "#6f8052"], nieve: true },
  cumbre: { suelo: "#5f8a48", sueloRestaurado: "#5fae45", niebla: [0.8, 0.85, 0.9], apu: ["#3f6b3a", "#4a7a42"], nieve: false },
};

/** Ícono (emoji) pintado en un plano que siempre mira a la cámara. */
function icono(escena: Scene, emoji: string, tam = 1.6) {
  const plano = MeshBuilder.CreatePlane("icono", { size: tam }, escena);
  plano.billboardMode = Mesh.BILLBOARDMODE_ALL;
  const tx = new DynamicTexture(`tx-icono-${emoji}`, { width: 128, height: 128 }, escena, true);
  tx.hasAlpha = true;
  const c = tx.getContext() as unknown as CanvasRenderingContext2D;
  c.clearRect(0, 0, 128, 128);
  c.font = "96px system-ui, 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji'";
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText(emoji, 64, 72);
  tx.update();
  const m = new StandardMaterial(`m-icono-${emoji}`, escena);
  m.diffuseTexture = tx;
  m.useAlphaFromDiffuseTexture = true;
  m.emissiveColor = new Color3(1, 1, 1);
  m.disableLighting = true;
  m.backFaceCulling = false;
  plano.material = m;
  plano.isPickable = false;
  return plano;
}

export function crearZonaMundo(escena: Scene, zona: Zona) {
  const raiz = new TransformNode(`zona-${zona.id}`, escena);
  const mallas: Mesh[] = [];
  const choques: Choque[] = [];
  const pal = PALETAS[zona.ambiente];
  const agrega = <T extends Mesh>(m: T, x = 0, y = 0, z = 0, mat?: StandardMaterial) => {
    m.parent = raiz;
    m.position.set(x, y, z);
    if (mat) m.material = mat;
    mallas.push(m);
    return m;
  };
  const cerca = (x: number, z: number, r = 6) => zona.sitios.some((s) => Math.hypot(s.x - x, s.z - z) < r) || Math.hypot(x - INICIO_ZONA.x, z - INICIO_ZONA.z) < 5;

  // Suelo: arranca apagado y recupera su color con cada lección
  const sueloMat = new StandardMaterial(`m-suelo-${zona.id}`, escena);
  sueloMat.specularColor = new Color3(0.04, 0.04, 0.04);
  const apagado = Color3.FromHexString(pal.suelo).scale(0.8);
  const vivo = Color3.FromHexString(pal.sueloRestaurado);
  agrega(MeshBuilder.CreateGround("pasto", { width: 150, height: 150 }, escena), 0, 0, 0, sueloMat);
  agrega(MeshBuilder.CreateGround("camino", { width: 2.6, height: 44 }, escena), 0, 0.02, -2, material(escena, "#b89a6c"));

  // Montañas alrededor
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + 0.3;
    const d = 54 + azar(i + zona.numero) * 14;
    const alto = 20 + azar(i * 3 + zona.numero) * 24;
    agrega(MeshBuilder.CreateCylinder("apu", { height: alto, diameterTop: 0, diameterBottom: alto * 1.4, tessellation: 7 }, escena), Math.sin(a) * d, alto / 2 - 1, Math.cos(a) * d, material(escena, pal.apu[i % 2]));
    if (pal.nieve) agrega(MeshBuilder.CreateCylinder("nieve", { height: alto * 0.24, diameterTop: 0, diameterBottom: alto * 0.34, tessellation: 7 }, escena), Math.sin(a) * d, alto * 0.88 - 1, Math.cos(a) * d, material(escena, "#f4f7fb"));
  }

  decorar(escena, zona.ambiente, agrega, choques, cerca);

  // Altares de las lecciones
  const cristalMat = new StandardMaterial(`m-cristal-${zona.id}`, escena);
  cristalMat.diffuseColor = Color3.FromHexString("#8b3dff");
  cristalMat.emissiveColor = Color3.FromHexString("#5b1fd1");
  cristalMat.alpha = 0.92;
  const oroMat = new StandardMaterial(`m-oro-${zona.id}`, escena);
  oroMat.diffuseColor = Color3.FromHexString("#ffd166");
  oroMat.emissiveColor = Color3.FromHexString("#c98a12");
  const altares = new Map<string, { cristal: Mesh; anillo: Mesh }>();
  for (const s of zona.sitios) {
    agrega(MeshBuilder.CreateCylinder("altar", { height: 0.6, diameterTop: 2.6, diameterBottom: 3.2, tessellation: 8 }, escena), s.x, 0.3, s.z, material(escena, "#8f8577"));
    const anillo = agrega(MeshBuilder.CreateTorus("runa", { diameter: 2.2, thickness: 0.12, tessellation: 24 }, escena), s.x, 0.64, s.z, material(escena, "#3d3a52"));
    const cristal = agrega(MeshBuilder.CreatePolyhedron("glitch", { type: 1, size: 0.75 }, escena), s.x, 2.1, s.z, cristalMat);
    const ic = icono(escena, s.icono, 1.5);
    ic.parent = raiz;
    ic.position.set(s.x, 4, s.z);
    choques.push({ x: s.x, z: s.z, r: 1.6 });
    altares.set(s.id, { cristal, anillo });
  }

  raiz.setEnabled(false);
  let t = 0;
  escena.onBeforeRenderObservable.add(() => {
    if (!raiz.isEnabled()) return;
    t += escena.getEngine().getDeltaTime() / 1000;
    for (const { cristal } of altares.values()) {
      cristal.rotation.y = t * 1.2;
      cristal.position.y = 2.1 + Math.sin(t * 2 + cristal.position.x) * 0.2;
    }
  });

  return {
    raiz,
    mallas,
    choques,
    niebla: new Color3(...pal.niebla),
    restaurar(fraccion: number) {
      sueloMat.diffuseColor = Color3.Lerp(apagado, vivo, fraccion);
    },
    completar(sitio: string) {
      const a = altares.get(sitio);
      if (!a) return;
      a.cristal.material = oroMat;
      a.cristal.scaling.setAll(0.7);
      a.anillo.material = oroMat;
    },
    dispose() {
      raiz.dispose(false, true);
    },
  };
}

type Agrega = <T extends Mesh>(m: T, x?: number, y?: number, z?: number, mat?: StandardMaterial) => T;

/** Decorados de cada región (piezas simples, livianas para el celular). */
function decorar(escena: Scene, ambiente: Ambiente, agrega: Agrega, choques: Choque[], cerca: (x: number, z: number, r?: number) => boolean) {
  const puntos = (n: number, min: number, max: number, sem: number) => {
    const lista: [number, number][] = [];
    for (let i = 0; i < n * 3 && lista.length < n; i++) {
      const a = azar(i * 1.7 + sem) * Math.PI * 2;
      const d = min + azar(i * 2.9 + sem) * (max - min);
      const x = Math.sin(a) * d;
      const z = Math.cos(a) * d;
      if (cerca(x, z) || Math.abs(x) < 2.5) continue;
      lista.push([x, z]);
    }
    return lista;
  };
  const arbol = (x: number, z: number, alto: number, verde: string, tronco = "#6b4a2f") => {
    agrega(MeshBuilder.CreateCylinder("tronco", { height: alto, diameter: 0.45, tessellation: 6 }, escena), x, alto / 2, z, material(escena, tronco));
    const copa = agrega(MeshBuilder.CreateSphere("copa", { diameter: 2.4 + alto * 0.25, segments: 8 }, escena), x, alto + 0.6, z, material(escena, verde));
    copa.scaling.y = 0.7;
    choques.push({ x, z, r: 0.6 });
  };
  const casaRedonda = (x: number, z: number, muro: string, techo: string) => {
    agrega(MeshBuilder.CreateCylinder("casa", { height: 2.2, diameter: 3.2, tessellation: 14 }, escena), x, 1.1, z, material(escena, muro));
    agrega(MeshBuilder.CreateCylinder("techo", { height: 2, diameterTop: 0, diameterBottom: 4, tessellation: 14 }, escena), x, 3.2, z, material(escena, techo));
    choques.push({ x, z, r: 1.9 });
  };
  const casaInca = (x: number, z: number, giro: number, piedra = "#9d927f", techo = "#c9a86a") => {
    const m = agrega(MeshBuilder.CreateBox("casa", { width: 4, height: 2.4, depth: 3.2 }, escena), x, 1.2, z, material(escena, piedra));
    m.rotation.y = giro;
    const t = agrega(MeshBuilder.CreateCylinder("techo", { height: 1.8, diameterTop: 0, diameterBottom: 5.2, tessellation: 4 }, escena), x, 3.3, z, material(escena, techo));
    t.rotation.y = giro + Math.PI / 4;
    choques.push({ x, z, r: 2.4 });
  };
  const roca = (x: number, z: number, d: number, color = "#9a9389") => {
    const r = agrega(MeshBuilder.CreateSphere("roca", { diameter: d, segments: 6 }, escena), x, d * 0.25, z, material(escena, color));
    r.scaling.y = 0.6;
    choques.push({ x, z, r: d * 0.45 });
  };

  switch (ambiente) {
    case "altiplano": {
      // El lago al norte con islas de totora, balsas e ichu
      const agua = material(escena, "#2f7fc1", 0.6);
      agua.emissiveColor = new Color3(0.05, 0.2, 0.35);
      agrega(MeshBuilder.CreateDisc("agua", { radius: 40, tessellation: 40 }, escena), 0, 0.05, 62, agua).rotation.x = Math.PI / 2;
      for (const [x, z] of [[-14, 30], [8, 36], [24, 28]]) {
        agrega(MeshBuilder.CreateCylinder("isla", { height: 0.4, diameter: 9, tessellation: 18 }, escena), x, 0.15, z, material(escena, "#d9c27a"));
        agrega(MeshBuilder.CreateCylinder("casa", { height: 1.8, diameterTop: 0, diameterBottom: 2.6, tessellation: 4 }, escena), x, 1.2, z, material(escena, "#c9a85a"));
      }
      for (const [x, z] of puntos(30, 8, 28, 1)) agrega(MeshBuilder.CreateCylinder("ichu", { height: 0.9, diameterTop: 1, diameterBottom: 0.1, tessellation: 6 }, escena), x, 0.45, z, material(escena, "#c9b26a"));
      for (const [x, z] of [[-4, 24], [4, 24]]) {
        const b = agrega(MeshBuilder.CreateCapsule("balsa", { radius: 0.5, height: 4.5, tessellation: 8 }, escena), x, 0.35, z, material(escena, "#d1b45f"));
        b.rotation.x = Math.PI / 2;
      }
      break;
    }
    case "selva": {
      const agua = material(escena, "#7a6a3a", 0.5);
      agua.emissiveColor = new Color3(0.15, 0.12, 0.05);
      agrega(MeshBuilder.CreateGround("agua", { width: 8, height: 90 }, escena), 24, 0.05, 0, agua);
      for (let z = -40; z <= 40; z += 3) choques.push({ x: 24, z, r: 4 });
      for (const [x, z] of puntos(42, 9, 30, 2)) arbol(x, z, 4 + azar(x) * 5, ["#1f5e2a", "#2b7a35", "#17491f"][Math.floor(azar(z) * 3)]);
      for (const [x, z] of [[-20, -16], [-22, 4], [6, -16]]) casaRedonda(x, z, "#b08a5a", "#c9a85a");
      break;
    }
    case "nubes": {
      // Muralla de la fortaleza (anillo de bloques) y casas circulares
      const piedra = material(escena, "#8f8a7c");
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * Math.PI * 2;
        if (Math.abs(Math.sin(a)) < 0.12 && Math.cos(a) < 0) continue; // entrada sur
        const x = Math.sin(a) * 26;
        const z = Math.cos(a) * 26;
        const b = agrega(MeshBuilder.CreateBox("pirqa", { width: 6.4, height: 7, depth: 1.6 }, escena), x, 3.5, z, piedra);
        b.rotation.y = a;
        choques.push({ x, z, r: 3 });
      }
      for (const [x, z] of puntos(9, 6, 22, 3)) casaRedonda(x, z, "#9a907e", "#7a6a4a");
      break;
    }
    case "piedra": {
      const piedra = material(escena, "#9a958a");
      agrega(MeshBuilder.CreateBox("templo", { width: 18, height: 6, depth: 8 }, escena), 0, 3, 30, piedra);
      agrega(MeshBuilder.CreateBox("templo", { width: 12, height: 3, depth: 6 }, escena), 0, 7.5, 30, piedra);
      for (let x = -14; x <= 14; x += 4) choques.push({ x, z: 30, r: 3 });
      for (let i = 0; i < 6; i++) agrega(MeshBuilder.CreateSphere("cabeza", { diameter: 0.9, segments: 6 }, escena), -7.5 + i * 3, 4.5, 25.8, material(escena, "#b0a998"));
      agrega(MeshBuilder.CreateBox("plaza", { width: 14, height: 0.3, depth: 14 }, escena), 0, 0.15, 6, material(escena, "#a9a291"));
      for (const [x, z] of puntos(14, 10, 30, 4)) roca(x, z, 1 + azar(x) * 1.4);
      break;
    }
    case "ayllu": {
      for (let nivel = 0; nivel < 4; nivel++) {
        agrega(MeshBuilder.CreateBox("anden", { width: 40 - nivel * 4, height: 1.1, depth: 4 }, escena), 0, 0.55 + nivel * 1.1, 30 + nivel * 3.2, material(escena, nivel % 2 ? "#6fb35a" : "#5b9b48"));
      }
      for (const [x, z, g] of [[-20, -8, 0.6], [20, -10, -0.6], [-22, 8, 1.4], [22, 6, -1.4]] as const) casaInca(x, z, g, "#e8cf9f", "#b8432f");
      for (const [x, z] of puntos(12, 10, 28, 5)) arbol(x, z, 2 + azar(z) * 1.5, "#3f8f3a");
      break;
    }
    case "desierto": {
      // Pirámides escalonadas y plaza circular hundida
      for (const [x, z, n] of [[0, 30, 5], [-24, 18, 3], [24, 20, 4]] as const) {
        for (let i = 0; i < n; i++) agrega(MeshBuilder.CreateBox("piramide", { width: 14 - i * 2.4, height: 1.4, depth: 12 - i * 2 }, escena), x, 0.7 + i * 1.4, z, material(escena, i % 2 ? "#c2a578" : "#b89a6c"));
        choques.push({ x, z, r: 7 });
      }
      agrega(MeshBuilder.CreateTorus("plaza", { diameter: 9, thickness: 0.6, tessellation: 32 }, escena), -8, 0.2, 4, material(escena, "#a88f68"));
      for (const [x, z] of puntos(10, 12, 30, 6)) roca(x, z, 1.2, "#b9a27a");
      break;
    }
    case "barro": {
      // Muros de adobe con frisos (laberinto bajo)
      const adobe = material(escena, "#c4a274");
      const muros: [number, number, number, number][] = [[-26, 0, 1.2, 50], [26, 0, 1.2, 50], [0, 28, 52, 1.2], [-8, 8, 10, 1.2], [9, 7, 10, 1.2], [-20, -10, 1.2, 12], [20, -12, 1.2, 10]];
      for (const [x, z, w, d] of muros) {
        agrega(MeshBuilder.CreateBox("muro", { width: w, height: 4, depth: d }, escena), x, 2, z, adobe);
        const pasos = Math.max(w, d) / 2.5;
        for (let k = 0; k <= pasos; k++) {
          const px = w > d ? x - w / 2 + k * 2.5 : x;
          const pz = w > d ? z : z - d / 2 + k * 2.5;
          choques.push({ x: px, z: pz, r: 1.3 });
        }
      }
      for (let i = 0; i < 10; i++) agrega(MeshBuilder.CreateBox("friso", { width: 1, height: 0.5, depth: 0.2 }, escena), -9 + i * 2, 2.6, 27.3, material(escena, i % 2 ? "#8a6a48" : "#a3825a"));
      break;
    }
    case "feria": {
      const toldos = ["#c8102e", "#f5b83d", "#1fa596", "#7b1fa2", "#2b6cb0"];
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 + 0.3;
        const x = Math.sin(a) * 22;
        const z = Math.cos(a) * 22;
        if (cerca(x, z, 5)) continue;
        agrega(MeshBuilder.CreateBox("puesto", { width: 3, height: 1, depth: 2 }, escena), x, 0.5, z, material(escena, "#8a6a48"));
        const toldo = agrega(MeshBuilder.CreateBox("toldo", { width: 3.4, height: 0.15, depth: 2.6 }, escena), x, 2.6, z, material(escena, toldos[i % toldos.length]));
        toldo.rotation.y = -a;
        for (const dx of [-1.4, 1.4]) agrega(MeshBuilder.CreateCylinder("poste", { height: 2.6, diameter: 0.12 }, escena), x + dx, 1.3, z, material(escena, "#5a4030"));
        choques.push({ x, z, r: 1.9 });
      }
      for (const [x, z] of puntos(8, 25, 32, 7)) arbol(x, z, 3, "#3f8f3a");
      break;
    }
    case "cumbre": {
      // Terrazas, recintos de piedra y el Huayna Picchu al fondo
      agrega(MeshBuilder.CreateCylinder("apu", { height: 34, diameterTop: 3, diameterBottom: 26, tessellation: 9 }, escena), 6, 16, 52, material(escena, "#3f6b3a"));
      for (let nivel = 0; nivel < 5; nivel++) agrega(MeshBuilder.CreateBox("anden", { width: 50, height: 1, depth: 3 }, escena), 0, 0.5 + nivel, 26 + nivel * 3, material(escena, nivel % 2 ? "#6fb35a" : "#5b9b48"));
      for (const [x, z, g] of [[-20, -6, 0.2], [-20, 8, 0.2], [20, -8, -0.2], [20, 8, -0.2], [-6, -14, 0], [8, -14, 0]] as const) casaInca(x, z, g);
      break;
    }
  }
}
