// Pone modelos del paquete de naturaleza (montañas, bosques, rocas, nubes...) con "thin instances".
// Una colocación = modelo + posición + escala + giro. Devuelve las mallas creadas (para mostrarlas/ocultarlas por región).

import { Scene } from "@babylonjs/core/scene";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import "@babylonjs/core/Meshes/thinInstanceMesh";
import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { cargarPlantillas } from "./modelos";

export interface Colocacion {
  modelo: string;
  x: number;
  z: number;
  y?: number;
  escala: number;
  giro?: number;
  /** Escala vertical extra (para montes más altos). */
  alto?: number;
}

let contador = 0;
export async function poblar(escena: Scene, colocaciones: Colocacion[]): Promise<Mesh[]> {
  const mapa = await cargarPlantillas(escena, "naturaleza.glb");
  const porModelo = new Map<string, Colocacion[]>();
  for (const c of colocaciones) {
    if (!mapa.has(c.modelo)) continue;
    if (!porModelo.has(c.modelo)) porModelo.set(c.modelo, []);
    porModelo.get(c.modelo)!.push(c);
  }
  const creadas: Mesh[] = [];
  for (const [modelo, lista] of porModelo) {
    const malla = mapa.get(modelo)!.clone(`paisaje-${modelo}-${contador++}`, null, true, false)!;
    malla.setEnabled(true);
    malla.isPickable = false;
    for (const c of lista) {
      const m = Matrix.Compose(
        new Vector3(c.escala, c.escala * (c.alto ?? 1), c.escala),
        Quaternion.RotationYawPitchRoll(c.giro ?? 0, 0, 0),
        new Vector3(c.x, c.y ?? 0, c.z)
      );
      malla.thinInstanceAdd(m, false);
    }
    malla.thinInstanceBufferUpdated("matrix");
    malla.thinInstanceRefreshBoundingInfo(true);
    creadas.push(malla);
  }
  return creadas;
}

/** Generador pseudoaleatorio estable (mismo paisaje siempre). */
export function semilla(n: number) {
  let s = n;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
