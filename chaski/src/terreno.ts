// Terreno con relieve: plano donde se juega y cerros/quebradas alrededor (para que el paisaje
// no se vea como un piso liso). También: pasto en matas, sol en el cielo y agua que brilla.

import { Scene } from "@babylonjs/core/scene";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import "@babylonjs/core/Meshes/thinInstanceMesh";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";

function ruido(x: number, z: number) {
  return (
    Math.sin(x * 0.11 + z * 0.07) * 0.5 +
    Math.sin(x * 0.23 - z * 0.19 + 1.7) * 0.3 +
    Math.sin(x * 0.051 + z * 0.13 + 4.1) * 0.6 +
    Math.sin(x * 0.4 + z * 0.37) * 0.12
  );
}
const suave = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export interface OpcionesTerreno {
  tamano: number;
  /** Radio plano donde se juega. */
  plano: number;
  /** Altura de los cerros del borde. */
  alto: number;
  /** Centro del área plana. */
  cx?: number;
  cz?: number;
  material: StandardMaterial;
  /** Material para las laderas altas (roca/pasto seco). */
  ladera?: StandardMaterial;
}

/** Altura del terreno en (x, z) (la usan los objetos que se ponen encima). */
export function alturaTerreno(o: OpcionesTerreno, x: number, z: number) {
  const r = Math.hypot(x - (o.cx ?? 0), z - (o.cz ?? 0));
  const borde = suave(o.plano, o.plano + 26, r);
  const lomas = suave(o.plano - 2, o.plano + 6, r) * (0.6 + ruido(x, z) * 0.5);
  return borde * o.alto * (0.65 + 0.45 * (ruido(x * 0.6, z * 0.6) * 0.5 + 0.5)) + lomas;
}

export function crearTerreno(escena: Scene, nombre: string, o: OpcionesTerreno): Mesh[] {
  const div = 110;
  const suelo = MeshBuilder.CreateGround(nombre, { width: o.tamano, height: o.tamano, subdivisions: div, updatable: true }, escena);
  const pos = suelo.getVerticesData(VertexBuffer.PositionKind)!;
  for (let i = 0; i < pos.length; i += 3) pos[i + 1] = alturaTerreno(o, pos[i], pos[i + 2]) - 0.02;
  suelo.updateVerticesData(VertexBuffer.PositionKind, pos);
  const normales: number[] = [];
  VertexData.ComputeNormals(pos, suelo.getIndices()!, normales);
  suelo.updateVerticesData(VertexBuffer.NormalKind, normales);
  suelo.material = o.material;
  suelo.receiveShadows = true;
  const mallas = [suelo];
  // Laderas: una segunda capa (roca/pasto seco) que asoma donde el terreno es alto
  if (o.ladera) {
    const capa = MeshBuilder.CreateGround(`${nombre}-ladera`, { width: o.tamano, height: o.tamano, subdivisions: div, updatable: true }, escena);
    const p2 = capa.getVerticesData(VertexBuffer.PositionKind)!;
    for (let i = 0; i < p2.length; i += 3) {
      const h = alturaTerreno(o, p2[i], p2[i + 2]);
      p2[i + 1] = h > o.alto * 0.45 ? h + 0.05 : h - 3;
    }
    capa.updateVerticesData(VertexBuffer.PositionKind, p2);
    const n2: number[] = [];
    VertexData.ComputeNormals(p2, capa.getIndices()!, n2);
    capa.updateVerticesData(VertexBuffer.NormalKind, n2);
    capa.material = o.ladera;
    mallas.push(capa);
  }
  return mallas;
}

/** Matas de pasto (miles, con thin instances): solo fuera de las zonas libres. */
export function crearPastizal(
  escena: Scene,
  nombre: string,
  o: OpcionesTerreno,
  cantidad: number,
  colores: [string, string],
  libre: (x: number, z: number) => boolean,
  radioMax = 44
): Mesh {
  const hojas: Mesh[] = [];
  for (let k = 0; k < 3; k++) {
    const h = MeshBuilder.CreatePlane(`${nombre}-hoja`, { width: 0.5, height: 0.7, sideOrientation: Mesh.DOUBLESIDE }, escena);
    h.rotation.y = (k / 3) * Math.PI;
    h.position.y = 0.33;
    h.bakeCurrentTransformIntoVertices();
    hojas.push(h);
  }
  const mata = Mesh.MergeMeshes(hojas, true)!;
  mata.name = nombre;
  const tex = new DynamicTexture(`tx-${nombre}`, { width: 64, height: 64 }, escena, false);
  const c = tex.getContext() as CanvasRenderingContext2D;
  c.clearRect(0, 0, 64, 64);
  for (let i = 0; i < 14; i++) {
    c.strokeStyle = i % 2 ? colores[0] : colores[1];
    c.lineWidth = 3;
    const x = 6 + i * 3.8;
    c.beginPath();
    c.moveTo(x, 64);
    c.quadraticCurveTo(x + (i % 3) * 3 - 3, 30, x + (i % 2 ? 6 : -6), 4 + (i % 4) * 6);
    c.stroke();
  }
  tex.update();
  tex.hasAlpha = true;
  const m = new StandardMaterial(`m-${nombre}`, escena);
  m.diffuseTexture = tex;
  // Recorte por alfa (alpha test): mucho más liviano que la transparencia para miles de matas
  m.backFaceCulling = false;
  m.specularColor = new Color3(0, 0, 0);
  m.emissiveColor = new Color3(0.12, 0.14, 0.08);
  mata.material = m;
  mata.isPickable = false;
  let s = 7;
  const azar = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  const matrices: Matrix[] = [];
  for (let i = 0; i < cantidad * 3 && matrices.length < cantidad; i++) {
    const a = azar() * Math.PI * 2;
    const r = Math.sqrt(azar()) * radioMax;
    const x = (o.cx ?? 0) + Math.sin(a) * r;
    const z = (o.cz ?? 0) + Math.cos(a) * r;
    if (!libre(x, z)) continue;
    const e = 0.7 + azar() * 0.9;
    matrices.push(Matrix.Compose(new Vector3(e, e * (0.8 + azar() * 0.6), e), Quaternion.RotationYawPitchRoll(azar() * 6.28, 0, 0), new Vector3(x, alturaTerreno(o, x, z), z)));
  }
  for (const mt of matrices) mata.thinInstanceAdd(mt, false);
  mata.thinInstanceBufferUpdated("matrix");
  mata.thinInstanceRefreshBoundingInfo(true);
  return mata;
}

/** Sol con halo en el cielo (siempre lejos, sin niebla). */
export function crearSol(escena: Scene, direccion: Vector3): Mesh {
  const tex = new DynamicTexture("tx-sol", { width: 256, height: 256 }, escena, false);
  const c = tex.getContext() as CanvasRenderingContext2D;
  const g = c.createRadialGradient(128, 128, 8, 128, 128, 128);
  g.addColorStop(0, "rgba(255,255,240,1)");
  g.addColorStop(0.12, "rgba(255,248,210,1)");
  g.addColorStop(0.3, "rgba(255,226,150,.45)");
  g.addColorStop(1, "rgba(255,220,150,0)");
  c.fillStyle = g;
  c.fillRect(0, 0, 256, 256);
  tex.update();
  tex.hasAlpha = true;
  const m = new StandardMaterial("m-sol-cielo", escena);
  m.diffuseTexture = tex;
  m.emissiveTexture = tex;
  m.useAlphaFromDiffuseTexture = true;
  m.disableLighting = true;
  m.fogEnabled = false;
  const sol = MeshBuilder.CreatePlane("sol-cielo", { size: 34 }, escena);
  sol.material = m;
  sol.billboardMode = Mesh.BILLBOARDMODE_ALL;
  sol.position = direccion.normalize().scale(-85);
  sol.position.y = Math.abs(sol.position.y) + 10;
  sol.infiniteDistance = true;
  sol.isPickable = false;
  return sol;
}

/** Hace que el agua brille y se mueva (desplaza su textura de ondas). */
export function aguaViva(escena: Scene, m: StandardMaterial, repetir = 4) {
  const tex = new DynamicTexture("tx-ondas", { width: 128, height: 128 }, escena, true);
  const c = tex.getContext() as CanvasRenderingContext2D;
  c.fillStyle = "#ffffff";
  c.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 26; i++) {
    c.strokeStyle = `rgba(160,220,255,${0.25 + (i % 3) * 0.15})`;
    c.lineWidth = 2;
    const y = (i * 37) % 128;
    const x = (i * 53) % 128;
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(x + 8, y - 4, x + 16, y);
    c.stroke();
  }
  tex.update();
  tex.wrapU = tex.wrapV = Texture.WRAP_ADDRESSMODE;
  tex.uScale = tex.vScale = repetir;
  m.diffuseTexture = tex;
  m.specularColor = new Color3(0.9, 0.95, 1);
  m.specularPower = 48;
  escena.onBeforeRenderObservable.add(() => {
    const t = performance.now() / 1000;
    tex.uOffset = t * 0.03;
    tex.vOffset = Math.sin(t * 0.4) * 0.05;
  });
}
