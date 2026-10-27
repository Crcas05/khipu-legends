// Mensajeros del juego: en los Andes un CÓNDOR y en la selva un GUACAMAYO bajan volando
// con un khipu (mensaje de cuerdas con nudos). Suena el pututo y llega la misión, sin
// tener que caminar a buscar a nadie. (El ave mensajera es fantasía del juego; los incas
// usaban chaskis corredores, khipus y el pututo.)

import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { material } from "./personajes";
import { estallido } from "./efectos";
import { sonido } from "./sonido";

export type Ave = "condor" | "guacamayo";

function armarAve(escena: Scene, tipo: Ave) {
  const raiz = new TransformNode(`mensajero-${tipo}`, escena);
  const c = tipo === "condor" ? { cuerpo: "#1b1b1f", ala: "#26262c", punta: "#f2f2f2", cuello: "#f7f7f7", cabeza: "#c46a5a", pico: "#d9c9a3" } : { cuerpo: "#d7262e", ala: "#1f6fd1", punta: "#f5c518", cuello: "#d7262e", cabeza: "#d7262e", pico: "#2a2a2a" };
  const e = tipo === "condor" ? 1.3 : 0.75;
  const m = (mesh: Mesh, color: string, x: number, y: number, z: number) => {
    mesh.material = material(escena, color);
    mesh.parent = raiz;
    mesh.position.set(x, y, z);
    return mesh;
  };
  const cuerpo = m(MeshBuilder.CreateSphere("ave-cuerpo", { diameter: 1 }, escena), c.cuerpo, 0, 0, 0);
  cuerpo.scaling.set(0.7 * e, 0.6 * e, 1.3 * e);
  m(MeshBuilder.CreateTorus("ave-collar", { diameter: 0.5 * e, thickness: 0.16 * e, tessellation: 14 }, escena), c.cuello, 0, 0.22 * e, 0.5 * e).rotation.x = Math.PI / 2.4;
  m(MeshBuilder.CreateSphere("ave-cabeza", { diameter: 0.42 * e }, escena), c.cabeza, 0, 0.32 * e, 0.72 * e);
  const pico = m(MeshBuilder.CreateCylinder("ave-pico", { height: 0.3 * e, diameterTop: 0, diameterBottom: 0.14 * e, tessellation: 6 }, escena), c.pico, 0, 0.28 * e, 0.95 * e);
  pico.rotation.x = Math.PI / 2.2;
  for (const lado of [-1, 1]) {
    const ojo = m(MeshBuilder.CreateSphere("ave-ojo", { diameter: 0.08 * e }, escena), "#111111", 0.12 * e * lado, 0.38 * e, 0.86 * e);
    ojo.isPickable = false;
  }
  const cola = m(MeshBuilder.CreateBox("ave-cola", { width: 0.5 * e, height: 0.06 * e, depth: (tipo === "guacamayo" ? 1.3 : 0.6) * e }, escena), tipo === "guacamayo" ? c.ala : c.cuerpo, 0, -0.05 * e, -(tipo === "guacamayo" ? 1.1 : 0.85) * e);
  cola.rotation.x = -0.2;
  const alas: TransformNode[] = [];
  for (const lado of [-1, 1]) {
    const pivote = new TransformNode("ave-pivote", escena);
    pivote.parent = raiz;
    pivote.position.set(0.25 * e * lado, 0.1 * e, 0);
    const ala = MeshBuilder.CreateBox("ave-ala", { width: (tipo === "condor" ? 2.6 : 1.3) * e, height: 0.06 * e, depth: 0.75 * e }, escena);
    ala.material = material(escena, c.ala);
    ala.parent = pivote;
    ala.position.x = (tipo === "condor" ? 1.3 : 0.65) * e * lado;
    const punta = MeshBuilder.CreateBox("ave-punta", { width: 0.5 * e, height: 0.07 * e, depth: 0.5 * e }, escena);
    punta.material = material(escena, c.punta);
    punta.parent = pivote;
    punta.position.set((tipo === "condor" ? 2.55 : 1.25) * e * lado, 0, -0.1 * e);
    alas.push(pivote);
  }
  // El khipu que lleva colgando
  const khipu = new TransformNode("ave-khipu", escena);
  khipu.parent = raiz;
  khipu.position.set(0, -0.45 * e, 0.2 * e);
  m(MeshBuilder.CreateCylinder("khipu-cuerda", { height: 0.7, diameter: 0.05 }, escena), "#c8102e", 0, 0, 0).parent = khipu;
  for (let i = 0; i < 4; i++) {
    const cuerda = MeshBuilder.CreateCylinder("khipu-cuerda", { height: 0.5, diameter: 0.035 }, escena);
    cuerda.material = material(escena, ["#f5b83d", "#1fa596", "#ffffff", "#7b1fa2"][i]);
    cuerda.parent = khipu;
    cuerda.position.set(-0.15 + i * 0.1, -0.25, 0);
  }
  return { raiz, alas };
}

/** Un ave baja junto a Chaski con el khipu. Resuelve cuando aterriza. */
export function llegaMensajero(escena: Scene, tipo: Ave, destino: Vector3): { aterriza: Promise<void>; vete: () => void } {
  const { raiz, alas } = armarAve(escena, tipo);
  const lugar = destino.add(new Vector3(2.2, 0, 1.2));
  const desde = lugar.add(new Vector3(-26, 22, 30));
  raiz.position.copyFrom(desde);
  let t = 0;
  let fase: "llega" | "posada" | "se-va" = "llega";
  let resolver: () => void = () => {};
  const aterriza = new Promise<void>((r) => (resolver = r));
  let salida = 0;
  sonido.pututu();
  const obs = escena.onBeforeRenderObservable.add(() => {
    const dt = escena.getEngine().getDeltaTime() / 1000;
    t += dt;
    const batir = fase === "posada" ? Math.sin(t * 2) * 0.08 : Math.sin(t * (tipo === "condor" ? 5 : 14)) * (tipo === "condor" ? 0.35 : 0.7);
    alas[0].rotation.z = batir;
    alas[1].rotation.z = -batir;
    if (fase === "llega") {
      const k = Math.min(1, t / 2.6);
      const suave = 1 - Math.pow(1 - k, 3);
      // Planea en espiral (el cóndor casi no aletea: planea)
      const p = Vector3.Lerp(desde, lugar.add(new Vector3(0, 1.4, 0)), suave);
      p.x += Math.sin(k * Math.PI * 2) * 6 * (1 - k);
      raiz.position.copyFrom(p);
      const adelante = lugar.subtract(desde);
      raiz.rotation.y = Math.atan2(adelante.x, adelante.z) + Math.sin(k * Math.PI * 2) * 0.6 * (1 - k);
      raiz.rotation.z = Math.cos(k * Math.PI * 2) * 0.4 * (1 - k);
      if (k >= 1) {
        fase = "posada";
        raiz.rotation.z = 0;
        raiz.rotation.y = Math.atan2(destino.x - lugar.x, destino.z - lugar.z);
        estallido(escena, lugar.add(new Vector3(0, 1, 0)), tipo === "condor" ? ["#ffffff", "#d9d9d9"] : ["#d7262e", "#1f6fd1", "#f5c518"], 30, 4);
        if (tipo === "guacamayo") sonido.ojo(true);
        resolver();
      }
    } else if (fase === "se-va") {
      salida += dt;
      raiz.position.addInPlace(new Vector3(0.6, 0.5 + salida * 0.4, 1).scale(dt * 14));
      raiz.rotation.x = -0.4;
      if (salida > 3) {
        escena.onBeforeRenderObservable.remove(obs);
        raiz.dispose();
      }
    } else {
      raiz.position.y = lugar.y + 1.4 + Math.sin(t * 2) * 0.05;
    }
  });
  return {
    aterriza,
    vete: () => {
      fase = "se-va";
      salida = 0;
    },
  };
}
