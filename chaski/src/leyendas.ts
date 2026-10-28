// SERES DE LEYENDA del Perú (tradición oral). No son "monstruos para matar": son guardianes o almas
// de las historias andinas y amazónicas. Fuentes: tradición oral recogida por la Biblioteca Nacional
// del Perú y estudios de literatura oral (ver Créditos).
//   Muki ............ duende de las minas de la sierra central; cuida las vetas de metal.
//   Jarjacha ........ (qarqacha) Ayacucho, Huancavelica, Junín: alma castigada que vaga de noche con
//                     forma de llama; su grito "qar-qar" le da el nombre.
//   Amaru ........... serpiente de las nubes; en relatos de Junín sale de los cerros y vomita granizo.
//   Yacumama ........ "madre del agua" amazónica: serpiente gigante que cuida ríos y cochas.
//   Chullachaqui .... guardián del bosque; tiene un pie humano y el otro deforme (chulla = desigual).

import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { material } from "./personajes";
import type { Modelo } from "./modelos";

const brillo = (escena: Scene, hex: string) => {
  const m = new StandardMaterial(`m-brillo-${hex}`, escena);
  m.emissiveColor = Color3.FromHexString(hex);
  m.disableLighting = true;
  return m;
};

const pegar = (m: Mesh, padre: TransformNode, mat: StandardMaterial, x = 0, y = 0, z = 0) => {
  m.parent = padre;
  m.material = mat;
  m.position.set(x, y, z);
  m.isPickable = false;
  return m;
};

/** MUKI: barba larga blanca, casco de minero con lámpara, poncho y pico (sobre un modelo pequeño). */
export function vestirMuki(escena: Scene, modelo: Modelo) {
  const cab = modelo.cabeza;
  if (cab) {
    const barba = MeshBuilder.CreateCylinder("muki-barba", { height: 0.75, diameterTop: 0.7, diameterBottom: 0.15, tessellation: 10 }, escena);
    pegar(barba, cab, material(escena, "#efeae0"), 0, -0.05, 0.38).rotation.x = 0.15;
    const casco = MeshBuilder.CreateSphere("muki-casco", { diameter: 1.15, segments: 14, slice: 0.5 }, escena);
    pegar(casco, cab, material(escena, "#c99a2e", 0.4), 0, 0.55, 0);
    const ala = MeshBuilder.CreateCylinder("muki-ala", { height: 0.05, diameter: 1.35, tessellation: 20 }, escena);
    pegar(ala, cab, material(escena, "#a87c22", 0.3), 0, 0.55, 0.04);
    const lampara = MeshBuilder.CreateCylinder("muki-lampara", { height: 0.16, diameter: 0.2, tessellation: 10 }, escena);
    pegar(lampara, cab, brillo(escena, "#ffe9a8"), 0, 0.85, 0.5).rotation.x = Math.PI / 2;
    for (const l of [-1, 1]) {
      const cuerno = MeshBuilder.CreateCylinder("muki-cuerno", { height: 0.25, diameterTop: 0, diameterBottom: 0.1, tessellation: 6 }, escena);
      pegar(cuerno, cab, material(escena, "#e7d9b8"), 0.42 * l, 0.95, -0.05).rotation.z = -0.5 * l;
    }
  }
  if (modelo.manoDerecha) {
    const pico = new TransformNode("muki-pico", escena);
    pico.parent = modelo.manoDerecha;
    pegar(MeshBuilder.CreateCylinder("pico-mango", { height: 0.9, diameter: 0.06, tessellation: 6 }, escena), pico, material(escena, "#6b4026"), 0, 0.3, 0);
    const hoja = pegar(MeshBuilder.CreateCylinder("pico-hoja", { height: 0.7, diameterTop: 0.02, diameterBottom: 0.08, tessellation: 5 }, escena), pico, material(escena, "#8d8a85", 0.5), 0, 0.72, 0);
    hoja.rotation.z = Math.PI / 2;
  }
}

/** CHULLACHAQUI: un pie de raíz retorcida (el otro es humano). */
export function pieDeRaiz(escena: Scene, nodos: TransformNode[]) {
  const pie = nodos.find((n) => n.name.replace(/^Clone of /, "") === "foot.l");
  if (!pie) return;
  const raizMat = material(escena, "#5a3b22");
  for (let i = 0; i < 4; i++) {
    const camino: Vector3[] = [];
    const a = (i / 4) * Math.PI * 2;
    for (let k = 0; k <= 6; k++) {
      const t = k / 6;
      camino.push(new Vector3(Math.cos(a) * t * 0.5, -t * 0.25 + Math.sin(t * 5 + i) * 0.04, Math.sin(a) * t * 0.5 + t * 0.2));
    }
    pegar(MeshBuilder.CreateTube("chulla-raiz", { path: camino, radiusFunction: (k) => 0.09 - k * 0.012, tessellation: 6 }, escena), pie, raizMat);
  }
}

/** Cuerpo de serpiente gigante (Yacumama o Amaru): segmentos que ondulan. */
function serpiente(escena: Scene, nombre: string, piel: StandardMaterial, panza: StandardMaterial, ojos: StandardMaterial, tam: number, n = 30) {
  const raiz = new TransformNode(nombre, escena);
  const segs: Mesh[] = [];
  for (let i = 0; i < n; i++) {
    const d = (0.9 - (i / n) * 0.6) * tam;
    const s = pegar(MeshBuilder.CreateSphere(`${nombre}-seg`, { diameter: d, segments: 10 }, escena), raiz, i % 4 === 2 ? panza : piel, 0, 0, -i * 0.32 * tam);
    s.scaling.set(1, 0.85, 1.25);
    segs.push(s);
  }
  const cabeza = pegar(MeshBuilder.CreateSphere(`${nombre}-cabeza`, { diameter: 1.0 * tam, segments: 14 }, escena), raiz, piel, 0, 0.1 * tam, 0.55 * tam);
  cabeza.scaling.set(1, 0.65, 1.45);
  for (const l of [-1, 1]) pegar(MeshBuilder.CreateSphere(`${nombre}-ojo`, { diameter: 0.18 * tam, segments: 8 }, escena), raiz, ojos, 0.3 * l * tam, 0.3 * tam, 0.85 * tam);
  return { raiz, segs, cabeza };
}

/** YACUMAMA: la madre del agua. Sale de la cocha, mira a Chaski y vuelve a hundirse. */
export function crearYacumama(escena: Scene) {
  const s = serpiente(escena, "yacumama", material(escena, "#26402a"), material(escena, "#8a8a52"), brillo(escena, "#ffd166"), 2.1, 32);
  let t = 0;
  let fase: "abajo" | "sube" | "mira" | "baja" = "abajo";
  let faseT = 0;
  const base = new Vector3();
  s.raiz.setEnabled(false);
  const obs = escena.onBeforeRenderObservable.add(() => {
    const dt = Math.min(escena.getEngine().getDeltaTime() / 1000, 0.05);
    if (!s.raiz.isEnabled()) return;
    t += dt;
    faseT += dt;
    // Cuerpo en espiral que ondula; la cabeza se alza sobre el agua
    const alto = fase === "sube" ? Math.min(1, faseT / 2.5) : fase === "mira" ? 1 : fase === "baja" ? Math.max(0, 1 - faseT / 2.5) : 0;
    s.segs.forEach((seg, i) => {
      const a = i * 0.35 + t * 0.8;
      seg.position.x = Math.sin(a) * (1.2 + i * 0.12);
      seg.position.z = Math.cos(a) * (1.2 + i * 0.12) - 1;
      seg.position.y = -1.5 + alto * Math.max(0, 3.8 - i * 0.35) + Math.sin(t * 2 + i) * 0.1;
    });
    const cuello = s.segs[0].position;
    s.cabeza.position.set(cuello.x * 0.5, -1.2 + alto * 5.2, cuello.z * 0.5 + 0.8);
    if (fase === "sube" && faseT > 2.5) [fase, faseT] = ["mira", 0];
    if (fase === "mira" && faseT > 3.5) [fase, faseT] = ["baja", 0];
    if (fase === "baja" && faseT > 2.6) {
      fase = "abajo";
      s.raiz.setEnabled(false);
    }
    s.raiz.position.copyFrom(base);
  });
  return {
    raiz: s.raiz,
    /** Emerge en ese punto del agua. */
    emerger(donde: Vector3) {
      base.copyFrom(donde);
      s.raiz.setEnabled(true);
      fase = "sube";
      faseT = 0;
    },
    dispose() {
      escena.onBeforeRenderObservable.remove(obs);
      s.raiz.dispose();
    },
  };
}

/** AMARU: serpiente con alas que cruza el cielo durante la tormenta y suelta granizo. */
export function crearAmaru(escena: Scene) {
  const piel = material(escena, "#5b6f86", 0.3);
  const s = serpiente(escena, "amaru-nube", piel, material(escena, "#c7d2de"), brillo(escena, "#bff3ff"), 1.6, 26);
  for (const l of [-1, 1]) {
    const ala = MeshBuilder.CreateDisc("amaru-ala", { radius: 2.2, tessellation: 5 }, escena);
    const m = material(escena, "#8fa3b8", 0.2);
    m.backFaceCulling = false;
    pegar(ala, s.raiz, m, 1.8 * l, 0.4, -1.5).rotation.x = Math.PI / 2;
    ala.scaling.set(1.4, 0.7, 1);
    ala.metadata = { ala: l };
  }
  s.raiz.setEnabled(false);
  let t = 0;
  let activo = false;
  const desde = new Vector3();
  const hacia = new Vector3();
  const obs = escena.onBeforeRenderObservable.add(() => {
    if (!activo) return;
    const dt = Math.min(escena.getEngine().getDeltaTime() / 1000, 0.05);
    t += dt / 14;
    const p = Vector3.Lerp(desde, hacia, t);
    p.y += Math.sin(t * Math.PI) * 4;
    s.raiz.position.copyFrom(p);
    s.raiz.rotation.y = Math.atan2(hacia.x - desde.x, hacia.z - desde.z);
    s.segs.forEach((seg, i) => (seg.position.x = Math.sin(t * 40 - i * 0.5) * 0.9));
    for (const c of s.raiz.getChildMeshes(true)) {
      const meta = c.metadata as { ala?: number } | null;
      if (meta?.ala) c.rotation.z = Math.sin(t * 60) * 0.5 * meta.ala;
    }
    if (t >= 1) {
      activo = false;
      s.raiz.setEnabled(false);
    }
  });
  return {
    raiz: s.raiz,
    /** Cruza el cielo de un lado a otro (altura ~22). */
    cruzar(centro: Vector3) {
      desde.set(centro.x - 60, 22, centro.z + 30);
      hacia.set(centro.x + 60, 24, centro.z + 10);
      t = 0;
      activo = true;
      s.raiz.setEnabled(true);
    },
    dispose() {
      escena.onBeforeRenderObservable.remove(obs);
      s.raiz.dispose();
    },
  };
}
