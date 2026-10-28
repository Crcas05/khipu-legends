// Los BUGS ya no son cubos: son insectos y crustáceos corrompidos por el código roto, con grietas que
// brillan como un error y un temblor de "falla" (glitch). Cada región tiene los suyos:
//   costa → cangrejo · sierra → araña de la puna · selva → escarabajo

import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export type FormaBicho = "cangrejo" | "arana" | "escarabajo";

interface Pata {
  nodo: TransformNode;
  fase: number;
  lado: number;
}
interface Bicho {
  raiz: TransformNode;
  cuerpo: TransformNode;
  patas: Pata[];
  pinzas: TransformNode[];
  t: number;
  previo: Vector3;
}

const vivos: Bicho[] = [];
let grietaMat: StandardMaterial | null = null;
let registrado = false;

/** Elige la forma según el lugar. */
export function formaDe(ambiente: string | undefined): FormaBicho {
  if (!ambiente) return "arana";
  const a = ambiente.toLowerCase();
  if (a.includes("costa") || a.includes("desierto") || a.includes("mar") || a.includes("adobe")) return "cangrejo";
  if (a.includes("selva") || a.includes("nubes") || a.includes("rio")) return "escarabajo";
  return "arana";
}

function grietas(escena: Scene) {
  if (grietaMat) return grietaMat;
  grietaMat = new StandardMaterial("m-grieta-bug", escena);
  grietaMat.emissiveColor = Color3.FromHexString("#4ff0dc");
  grietaMat.diffuseColor = Color3.Black();
  grietaMat.disableLighting = true;
  return grietaMat;
}

/**
 * Arma el cuerpo de un Bug dentro de "raiz" (que ya existe y es la que se mueve).
 * cuerpoMat: color del bicho; ojoMat: ojos brillantes. tam: tamaño (1 = normal).
 */
export function armarBicho(escena: Scene, raiz: TransformNode, forma: FormaBicho, cuerpoMat: StandardMaterial, ojoMat: StandardMaterial, tam = 1): Mesh[] {
  const mallas: Mesh[] = [];
  const cuerpo = new TransformNode("bicho-cuerpo", escena);
  cuerpo.parent = raiz;
  cuerpo.scaling.setAll(tam);
  const g = grietas(escena);
  const pon = (m: Mesh, mat: StandardMaterial, padre: TransformNode = cuerpo) => {
    m.parent = padre;
    m.material = mat;
    m.isPickable = false;
    mallas.push(m);
    return m;
  };
  const patas: Pata[] = [];
  const pinzas: TransformNode[] = [];
  const pata = (x: number, z: number, lado: number, largo: number, fase: number, alto: number) => {
    const nodo = new TransformNode("bicho-pata", escena);
    nodo.parent = cuerpo;
    nodo.position.set(x, alto, z);
    // Pata articulada: muslo hacia afuera y arriba, canilla hacia abajo
    const muslo = pon(MeshBuilder.CreateCylinder("pata", { height: largo, diameterTop: 0.07, diameterBottom: 0.05, tessellation: 6 }, escena), cuerpoMat, nodo);
    muslo.rotation.z = lado * 1.0;
    muslo.position.set(lado * largo * 0.42, largo * 0.27, 0);
    const canilla = pon(MeshBuilder.CreateCylinder("pata", { height: largo * 1.1, diameterTop: 0.05, diameterBottom: 0.015, tessellation: 5 }, escena), cuerpoMat, nodo);
    canilla.rotation.z = -lado * 0.35;
    canilla.position.set(lado * largo * 0.95, -largo * 0.05, 0);
    patas.push({ nodo, fase, lado });
  };

  if (forma === "arana") {
    // Araña de la puna: abdomen grande y peludo, cefalotórax, 8 patas largas
    const abdomen = pon(MeshBuilder.CreateSphere("bicho", { diameter: 0.75, segments: 12 }, escena), cuerpoMat);
    abdomen.position.set(0, 0.62, -0.32);
    abdomen.scaling.set(1, 0.85, 1.15);
    const torax = pon(MeshBuilder.CreateSphere("bicho", { diameter: 0.45, segments: 10 }, escena), cuerpoMat);
    torax.position.set(0, 0.5, 0.18);
    // Grietas de código en el lomo
    for (let i = 0; i < 4; i++) {
      const gr = pon(MeshBuilder.CreateBox("grieta", { width: 0.04, height: 0.02, depth: 0.32 - i * 0.04 }, escena), g);
      gr.position.set(-0.15 + i * 0.1, 0.98 - Math.abs(i - 1.5) * 0.03, -0.3);
      gr.rotation.y = (i - 1.5) * 0.3;
    }
    for (let i = 0; i < 4; i++) for (const lado of [-1, 1]) pata(lado * 0.17, 0.3 - i * 0.14, lado, 0.5, i * 1.6 + (lado > 0 ? Math.PI : 0), 0.5);
    for (const lado of [-1, 1]) {
      const ojo = pon(MeshBuilder.CreateSphere("ojo", { diameter: 0.1, segments: 6 }, escena), ojoMat);
      ojo.position.set(lado * 0.09, 0.6, 0.38);
      const ojito = pon(MeshBuilder.CreateSphere("ojo", { diameter: 0.06, segments: 5 }, escena), ojoMat);
      ojito.position.set(lado * 0.15, 0.64, 0.33);
    }
  } else if (forma === "cangrejo") {
    // Cangrejo de la costa: caparazón ancho, dos pinzas, 6 patas, ojos en pedúnculos
    const capa = pon(MeshBuilder.CreateSphere("bicho", { diameter: 0.9, segments: 14 }, escena), cuerpoMat);
    capa.position.set(0, 0.45, 0);
    capa.scaling.set(1.25, 0.5, 0.9);
    for (let i = 0; i < 3; i++) {
      const gr = pon(MeshBuilder.CreateBox("grieta", { width: 0.5 - i * 0.12, height: 0.02, depth: 0.035 }, escena), g);
      gr.position.set(0, 0.69, -0.18 + i * 0.16);
      gr.rotation.y = (i - 1) * 0.25;
    }
    for (let i = 0; i < 3; i++) for (const lado of [-1, 1]) pata(lado * 0.42, 0.18 - i * 0.2, lado, 0.42, i * 1.9 + (lado > 0 ? Math.PI : 0), 0.38);
    for (const lado of [-1, 1]) {
      const brazo = new TransformNode("pinza", escena);
      brazo.parent = cuerpo;
      brazo.position.set(lado * 0.42, 0.45, 0.35);
      pon(MeshBuilder.CreateCylinder("brazo", { height: 0.35, diameter: 0.09, tessellation: 6 }, escena), cuerpoMat, brazo).rotation.set(1.2, 0, -lado * 0.6);
      const mano = pon(MeshBuilder.CreateSphere("pinza", { diameter: 0.3, segments: 8 }, escena), cuerpoMat, brazo);
      mano.position.set(lado * 0.12, 0.05, 0.25);
      mano.scaling.set(0.8, 0.6, 1.3);
      const dedo = pon(MeshBuilder.CreateCylinder("dedo", { height: 0.22, diameterTop: 0.01, diameterBottom: 0.08, tessellation: 5 }, escena), cuerpoMat, brazo);
      dedo.rotation.x = Math.PI / 2;
      dedo.position.set(lado * 0.16, 0.12, 0.42);
      pinzas.push(brazo);
      const tallo = pon(MeshBuilder.CreateCylinder("pedunculo", { height: 0.2, diameter: 0.04, tessellation: 5 }, escena), cuerpoMat);
      tallo.position.set(lado * 0.13, 0.75, 0.3);
      const ojo = pon(MeshBuilder.CreateSphere("ojo", { diameter: 0.11, segments: 6 }, escena), ojoMat);
      ojo.position.set(lado * 0.13, 0.87, 0.3);
    }
  } else {
    // Escarabajo de la selva: élitros brillantes, cuerno, 6 patas
    const elitros = pon(MeshBuilder.CreateSphere("bicho", { diameter: 0.85, segments: 14 }, escena), cuerpoMat);
    elitros.position.set(0, 0.5, -0.1);
    elitros.scaling.set(0.9, 0.6, 1.25);
    const surco = pon(MeshBuilder.CreateBox("grieta", { width: 0.035, height: 0.02, depth: 0.95 }, escena), g);
    surco.position.set(0, 0.76, -0.1);
    for (const lado of [-1, 1]) {
      const gr = pon(MeshBuilder.CreateBox("grieta", { width: 0.03, height: 0.02, depth: 0.4 }, escena), g);
      gr.position.set(lado * 0.2, 0.7, -0.2);
      gr.rotation.y = lado * 0.4;
    }
    const cabeza = pon(MeshBuilder.CreateSphere("bicho", { diameter: 0.38, segments: 10 }, escena), cuerpoMat);
    cabeza.position.set(0, 0.45, 0.5);
    const cuerno = pon(MeshBuilder.CreateCylinder("cuerno", { height: 0.4, diameterTop: 0.01, diameterBottom: 0.1, tessellation: 6 }, escena), cuerpoMat);
    cuerno.position.set(0, 0.68, 0.66);
    cuerno.rotation.x = 0.7;
    for (let i = 0; i < 3; i++) for (const lado of [-1, 1]) pata(lado * 0.28, 0.25 - i * 0.25, lado, 0.4, i * 1.9 + (lado > 0 ? Math.PI : 0), 0.38);
    for (const lado of [-1, 1]) {
      const ojo = pon(MeshBuilder.CreateSphere("ojo", { diameter: 0.1, segments: 6 }, escena), ojoMat);
      ojo.position.set(lado * 0.13, 0.52, 0.64);
    }
  }
  vivos.push({ raiz, cuerpo, patas, pinzas, t: Math.random() * 10, previo: raiz.position.clone() });
  if (!registrado) {
    registrado = true;
    escena.onBeforeRenderObservable.add(() => animar(escena.getEngine().getDeltaTime() / 1000));
  }
  return mallas;
}

/** Patas que caminan, pinzas que se abren y un temblor de "falla" de vez en cuando. */
function animar(dt: number) {
  const d = Math.min(dt, 0.05);
  for (let i = vivos.length - 1; i >= 0; i--) {
    const b = vivos[i];
    if (b.raiz.isDisposed()) {
      vivos.splice(i, 1);
      continue;
    }
    if (!b.raiz.isEnabled()) continue;
    const p = b.raiz.position;
    const vel = Math.min(1, Math.hypot(p.x - b.previo.x, p.z - b.previo.z) / Math.max(d, 0.001) / 3);
    b.previo.copyFrom(p);
    b.t += d * (4 + vel * 14);
    for (const pa of b.patas) {
      pa.nodo.rotation.y = Math.sin(b.t + pa.fase) * (0.15 + vel * 0.35);
      pa.nodo.rotation.z = Math.max(0, Math.sin(b.t + pa.fase + 1.2)) * 0.25 * pa.lado;
    }
    for (const [k, pz] of b.pinzas.entries()) pz.rotation.x = Math.sin(b.t * 0.6 + k) * 0.25;
    // Falla de código: un salto pequeño y rápido de lado
    const falla = Math.sin(b.t * 0.37) > 0.985;
    b.cuerpo.position.x = falla ? (Math.random() - 0.5) * 0.12 : 0;
    b.cuerpo.position.y = Math.abs(Math.sin(b.t * 2)) * 0.03;
  }
  if (grietaMat) {
    const k = 0.6 + Math.sin(performance.now() / 180) * 0.4;
    grietaMat.emissiveColor.set(0.31 * k, 0.94 * k, 0.86 * k);
  }
}
