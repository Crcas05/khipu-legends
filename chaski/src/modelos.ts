// Personajes 3D con animaciones (KayKit Adventurers, licencia CC0 de Kay Lousberg).
// Se cargan una vez y se clonan (Chaski, sus ecos, Amaru). Si fallan, el juego
// sigue con los personajes armados con formas (heroes.ts).

import { Scene } from "@babylonjs/core/scene";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import "@babylonjs/loaders/glTF/2.0/glTFLoader";
import "@babylonjs/core/Animations/animatable";
import "@babylonjs/core/Bones/skeleton";
import { AssetContainer } from "@babylonjs/core/assetContainer";
import { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { material } from "./personajes";

const contenedores = new Map<string, Promise<AssetContainer>>();

function cargar(escena: Scene, archivo: string): Promise<AssetContainer> {
  if (!contenedores.has(archivo)) {
    const base = `${import.meta.env.BASE_URL}modelos/`;
    contenedores.set(
      archivo,
      SceneLoader.LoadAssetContainerAsync(base, archivo, escena).then((c) => {
        // Materiales "de juguete": color plano como el resto del juego (y compatibles con el Ojo)
        const cambios = new Map<PBRMaterial, StandardMaterial>();
        for (const m of c.materials) {
          if (!(m instanceof PBRMaterial)) continue;
          const s = new StandardMaterial(`${m.name}-std`, escena);
          s.diffuseTexture = m.albedoTexture;
          s.specularColor = new Color3(0.06, 0.06, 0.06);
          s.emissiveColor = new Color3(0.2, 0.2, 0.2);
          cambios.set(m, s);
          c.materials.push(s);
        }
        for (const malla of c.meshes) if (malla.material instanceof PBRMaterial) malla.material = cambios.get(malla.material)!;
        return c;
      })
    );
  }
  return contenedores.get(archivo)!;
}

export type Animacion = "Idle" | "Walking_A" | "Running_A" | "Cheer" | "Spellcast_Shoot" | "Hit_A" | "Interact" | "Jump_Full_Short" | "Block";

/** Un personaje animado. Se coloca dentro de "padre" (el nodo que el juego mueve). */
export class Modelo {
  mallas: Mesh[] = [];
  private anims = new Map<string, AnimationGroup>();
  private actual: AnimationGroup | null = null;
  private unaVez = 0;
  cabeza: TransformNode | null = null;

  constructor(raiz: TransformNode, grupos: AnimationGroup[], mallas: AbstractMesh[], nodos: TransformNode[]) {
    for (const g of grupos) {
      g.stop();
      this.anims.set(g.name.replace(/^Clone of /, ""), g);
      for (const t of g.targetedAnimations) {
        t.animation.enableBlending = true;
        t.animation.blendingSpeed = 0.12;
      }
    }
    this.mallas = mallas.filter((m): m is Mesh => m instanceof Mesh);
    this.cabeza = nodos.find((n) => n.name.replace(/^Clone of /, "") === "head") ?? null;
    void raiz;
    this.tocar("Idle");
  }

  tocar(nombre: Animacion, repetir = true, velocidad = 1) {
    const g = this.anims.get(nombre);
    if (!g || (this.actual === g && repetir)) return;
    this.actual?.stop();
    this.actual = g;
    g.start(repetir, velocidad);
  }

  /** Animación de un solo tiro (festejar, lanzar, recibir golpe); luego vuelve a moverse normal. */
  accion(nombre: Animacion, segundos = 1.2) {
    this.tocar(nombre, false, 1);
    this.unaVez = segundos;
  }

  /** Elige caminar/correr/quieto según la fuerza del movimiento. */
  mover(fuerza: number, dt: number) {
    if (this.unaVez > 0) {
      this.unaVez -= dt;
      if (this.unaVez > 0) return;
      this.actual = null;
    }
    if (fuerza > 0.65) this.tocar("Running_A");
    else if (fuerza > 0.08) this.tocar("Walking_A");
    else this.tocar("Idle");
  }
}

/** Clona un personaje del archivo y lo pone dentro de "padre". */
export async function crearModelo(escena: Scene, archivo: string, padre: TransformNode, altura = 2.7): Promise<Modelo> {
  const c = await cargar(escena, archivo);
  const inst = c.instantiateModelsToScene((n) => `${n}`, false, { doNotInstantiate: true });
  const raiz = inst.rootNodes[0] as TransformNode;
  raiz.parent = padre;
  raiz.position.setAll(0);
  const mallas = raiz.getChildMeshes(false);
  // Escalar a la altura del juego
  raiz.computeWorldMatrix(true);
  let minY = Infinity;
  let maxY = -Infinity;
  for (const m of mallas) {
    m.computeWorldMatrix(true);
    const b = m.getBoundingInfo().boundingBox;
    minY = Math.min(minY, b.minimumWorld.y);
    maxY = Math.max(maxY, b.maximumWorld.y);
  }
  const alto = maxY - minY;
  if (isFinite(alto) && alto > 0.1) raiz.scaling.scaleInPlace(altura / alto);
  const nodos = raiz.getChildTransformNodes(false);
  for (const m of mallas) m.alwaysSelectAsActiveMesh = true; // los esqueletos animados no deben desaparecer
  return new Modelo(raiz, inst.animationGroups, mallas, nodos);
}

/** Chullo andino que se coloca en el hueso de la cabeza del modelo. */
export function ponerChullo(escena: Scene, cabeza: TransformNode, escala = 1): Mesh[] {
  const blanco = material(escena, "#f7f1e6");
  const rojo = material(escena, "#c8102e");
  const oro = material(escena, "#f5b83d");
  const raiz = new TransformNode("chullo", escena);
  raiz.parent = cabeza;
  raiz.position.set(0, 0.78 * escala, -0.02);
  raiz.scaling.setAll(escala);
  const piezas: Mesh[] = [];
  const p = (m: Mesh, mat: StandardMaterial, x: number, y: number, z: number) => {
    m.parent = raiz;
    m.position.set(x, y, z);
    m.material = mat;
    piezas.push(m);
    return m;
  };
  p(MeshBuilder.CreateCylinder("chullo", { height: 0.42, diameterTop: 0.62, diameterBottom: 1.12, tessellation: 18 }, escena), rojo, 0, 0, 0);
  p(MeshBuilder.CreateCylinder("chullo-banda", { height: 0.16, diameterTop: 1.0, diameterBottom: 1.08, tessellation: 18 }, escena), blanco, 0, -0.06, 0);
  p(MeshBuilder.CreateCylinder("chullo-banda", { height: 0.06, diameterTop: 0.86, diameterBottom: 0.9, tessellation: 18 }, escena), oro, 0, 0.1, 0);
  p(MeshBuilder.CreateSphere("chullo-copa", { diameter: 0.64, segments: 12, slice: 0.5 }, escena), rojo, 0, 0.2, 0);
  p(MeshBuilder.CreateSphere("pompon", { diameter: 0.3, segments: 10 }, escena), blanco, 0, 0.55, 0);
  for (const lado of [-1, 1]) {
    p(MeshBuilder.CreateBox("orejera", { width: 0.1, height: 0.46, depth: 0.32 }, escena), rojo, 0.47 * lado, -0.36, 0);
    p(MeshBuilder.CreateCylinder("trenza", { height: 0.32, diameter: 0.05, tessellation: 6 }, escena), blanco, 0.48 * lado, -0.76, 0);
    p(MeshBuilder.CreateSphere("borla", { diameter: 0.14, segments: 8 }, escena), rojo, 0.48 * lado, -0.95, 0);
  }
  return piezas;
}

/** Montera roja (sombrero plano andino) para Amaru. */
export function ponerMontera(escena: Scene, cabeza: TransformNode, escala = 1): Mesh[] {
  const rojo = material(escena, "#c8102e");
  const oro = material(escena, "#f5b83d", 0.4);
  const raiz = new TransformNode("montera", escena);
  raiz.parent = cabeza;
  raiz.position.set(0, 0.72 * escala, 0);
  raiz.scaling.setAll(escala);
  const ala = MeshBuilder.CreateCylinder("montera", { height: 0.1, diameter: 1.7, tessellation: 24 }, escena);
  const copa = MeshBuilder.CreateCylinder("montera-copa", { height: 0.22, diameter: 0.85, tessellation: 20 }, escena);
  const banda = MeshBuilder.CreateTorus("montera-banda", { diameter: 1.45, thickness: 0.05, tessellation: 28 }, escena);
  copa.position.y = 0.14;
  banda.position.y = 0.05;
  ala.material = copa.material = rojo;
  banda.material = oro;
  for (const m of [ala, copa, banda]) m.parent = raiz;
  // Dos trenzas largas con lazos de colores
  const pelo = material(escena, "#1c1410", 0.3);
  const piezas: Mesh[] = [ala, copa, banda];
  for (const lado of [-1, 1]) {
    const trenza = MeshBuilder.CreateCapsule("trenza", { radius: 0.11, height: 1.25, tessellation: 8 }, escena);
    trenza.parent = raiz;
    trenza.position.set(0.42 * lado, -1.05, -0.05);
    trenza.material = pelo;
    const lazo = MeshBuilder.CreateSphere("lazo", { diameter: 0.18, segments: 8 }, escena);
    lazo.parent = raiz;
    lazo.position.set(0.42 * lado, -1.72, -0.05);
    lazo.material = material(escena, lado < 0 ? "#d6336c" : "#1fa596");
    piezas.push(trenza, lazo);
  }
  return piezas;
}

// ---------------------------------------------------------------------------
// Paisaje: modelos estáticos (KayKit Medieval Hexagon Pack, CC0) como plantillas.
// Cada plantilla se une en una sola malla y se repite con "thin instances"
// (cientos de árboles y montes en pocas llamadas de dibujo: va fluido en celular).
// ---------------------------------------------------------------------------
const plantillas = new Map<string, Promise<Map<string, Mesh>>>();

export function cargarPlantillas(escena: Scene, archivo: string): Promise<Map<string, Mesh>> {
  if (!plantillas.has(archivo)) {
    plantillas.set(
      archivo,
      cargar(escena, archivo).then((c) => {
        c.addAllToScene();
        const raiz = c.meshes.find((m) => m.name === "__root__");
        const mapa = new Map<string, Mesh>();
        const hijos = (raiz?.getChildren() ?? []) as TransformNode[];
        for (const nodo of hijos) {
          const mallas = nodo.getChildMeshes(false).filter((m): m is Mesh => m instanceof Mesh && m.getTotalVertices() > 0);
          if (!mallas.length) continue;
          for (const m of mallas) m.computeWorldMatrix(true);
          const unida = Mesh.MergeMeshes(mallas, false, true, undefined, false, false);
          if (!unida) continue;
          unida.name = `plantilla-${nodo.name}`;
          // La raíz del glTF viene espejada (escala z = -1): al unir, las caras quedan al revés
          if ((raiz?.computeWorldMatrix(true).determinant() ?? 1) < 0) unida.flipFaces(false);
          unida.setEnabled(false);
          unida.isPickable = false;
          mapa.set(nodo.name, unida);
        }
        raiz?.dispose(false, false);
        return mapa;
      })
    );
  }
  return plantillas.get(archivo)!;
}
