// Zona 1: el Valle Sagrado. Mundo abierto que el Bug corrompió: la naturaleza
// se recupera rescate por rescate (y el pasto se pone más verde con cada uno).

import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { material, crearLlama } from "./personajes";
import type { Choque } from "./mundo";

function azar(semilla: number) {
  const x = Math.sin(semilla * 91.17) * 43758.5453;
  return x - Math.floor(x);
}

export const INICIO_VALLE = new Vector3(0, 0, -28);
export const LIMITE_VALLE = 36;

/** Los seis lugares que hay que rescatar (el orden lo decide el jugador, la puerta va al final). */
export const SITIOS = {
  vicuna: new Vector3(-20, 0, -12),
  rio: new Vector3(14, 0, 2.5),
  quenua: new Vector3(-22, 0, 14),
  condor: new Vector3(20, 0, 17),
  colibri: new Vector3(0, 0, 14),
  puerta: new Vector3(0, 0, 30),
};
export type Sitio = keyof typeof SITIOS;

export function crearValle(escena: Scene) {
  const raiz = new TransformNode("valle", escena);
  const mallas: Mesh[] = [];
  const choques: Choque[] = [];
  const animar: ((dt: number, t: number) => void)[] = [];
  const agrega = <T extends Mesh>(m: T, x = 0, y = 0, z = 0, mat?: StandardMaterial) => {
    m.parent = raiz;
    m.position.set(x, y, z);
    if (mat) m.material = mat;
    mallas.push(m);
    return m;
  };

  // Pasto: empieza gris (corrupto) y se vuelve verde con cada rescate
  const pastoMat = new StandardMaterial("m-pasto-valle", escena);
  pastoMat.specularColor = new Color3(0.05, 0.05, 0.05);
  const gris = Color3.FromHexString("#8c9178");
  const verde = Color3.FromHexString("#5fae45");
  agrega(MeshBuilder.CreateGround("pasto", { width: 160, height: 160 }, escena), 0, 0, 0, pastoMat);
  const caminoMat = material(escena, "#b89a6c");
  agrega(MeshBuilder.CreateGround("camino", { width: 3, height: 60 }, escena), 0, 0.02, 0, caminoMat);

  // Apus (montañas) alrededor
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const d = 58 + azar(i) * 14;
    const alto = 26 + azar(i + 3) * 22;
    agrega(MeshBuilder.CreateCylinder("apu", { height: alto, diameterTop: 0, diameterBottom: alto * 1.4, tessellation: 7 }, escena), Math.sin(a) * d, alto / 2 - 1, Math.cos(a) * d, material(escena, i % 2 ? "#7a8a64" : "#6c7d5a"));
    agrega(MeshBuilder.CreateCylinder("nieve", { height: alto * 0.24, diameterTop: 0, diameterBottom: alto * 0.34, tessellation: 7 }, escena), Math.sin(a) * d, alto * 0.88 - 1, Math.cos(a) * d, material(escena, "#f4f7fb"));
  }
  // Rocas y matas de ichu sueltas
  for (let i = 0; i < 40; i++) {
    const a = azar(i * 2.1) * Math.PI * 2;
    const d = 8 + azar(i * 3.7) * 28;
    const x = Math.sin(a) * d;
    const z = Math.cos(a) * d;
    if (Object.values(SITIOS).some((s) => Math.hypot(s.x - x, s.z - z) < 6) || Math.abs(x) < 3 || Math.abs(z - 6) < 4) continue;
    if (i % 3 === 0) {
      const r = agrega(MeshBuilder.CreateSphere("roca", { diameter: 1 + azar(i) * 1.2, segments: 6 }, escena), x, 0.3, z, material(escena, "#9a9389"));
      r.scaling.y = 0.6;
      choques.push({ x, z, r: 0.8 });
    } else {
      agrega(MeshBuilder.CreateCylinder("ichu", { height: 0.9, diameterTop: 1, diameterBottom: 0.1, tessellation: 6 }, escena), x, 0.45, z, material(escena, "#c9b26a"));
    }
  }

  // ---------- 1. Vicuña atrapada en una jaula de glitch ----------
  const vicuna = crearLlama(escena, SITIOS.vicuna.x, SITIOS.vicuna.z, "#c9965a", false);
  vicuna.raiz.parent = raiz;
  vicuna.raiz.scaling.setAll(0.9);
  mallas.push(...vicuna.mallas);
  const barrotes: Mesh[] = [];
  const glitchMat = new StandardMaterial("m-glitch-valle", escena);
  glitchMat.diffuseColor = Color3.FromHexString("#8b3dff");
  glitchMat.emissiveColor = Color3.FromHexString("#5b1fd1");
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    barrotes.push(agrega(MeshBuilder.CreateBox("barrote", { width: 0.18, height: 3, depth: 0.18 }, escena), SITIOS.vicuna.x + Math.sin(a) * 1.9, 1.5, SITIOS.vicuna.z + Math.cos(a) * 1.9, glitchMat));
  }
  const choqueJaula: Choque = { x: SITIOS.vicuna.x, z: SITIOS.vicuna.z, r: 2.2 };
  choques.push(choqueJaula);
  let vicunaLibre = false;
  let tv = 0;
  animar.push((dt) => {
    if (!vicunaLibre) return;
    tv += dt;
    const p = vicuna.raiz.position;
    p.x = SITIOS.vicuna.x + Math.sin(tv * 0.6) * 5;
    p.z = SITIOS.vicuna.z + Math.cos(tv * 0.6) * 3;
    vicuna.raiz.rotation.y = tv * 0.6 + Math.PI / 2;
  });

  // ---------- 2. Río bloqueado por 5 rocas ----------
  const agua = new StandardMaterial("m-rio", escena);
  agua.diffuseColor = Color3.FromHexString("#2e9fd6");
  agua.emissiveColor = new Color3(0.05, 0.25, 0.35);
  const seco = material(escena, "#8a6f4c");
  agrega(MeshBuilder.CreateGround("agua", { width: 30, height: 4 }, escena), 27, 0.04, 6, agua); // aguas arriba
  const rioAbajo = agrega(MeshBuilder.CreateGround("agua", { width: 52, height: 4 }, escena), -14, 0.04, 6, seco);
  const piedrasRio: Mesh[] = [];
  for (let i = 0; i < 5; i++) {
    const r = agrega(MeshBuilder.CreateSphere("roca", { diameter: 1.6, segments: 7 }, escena), 11 + i * 1.3, 0.6, 5 + (i % 2) * 1.6, material(escena, "#7d756b"));
    r.scaling.y = 0.75;
    piedrasRio.push(r);
  }

  // ---------- 3. Bosque de queñuas seco ----------
  const tocon = material(escena, "#6b4a2f");
  const tocones: Mesh[] = [];
  for (let i = 0; i < 8; i++) {
    tocones.push(agrega(MeshBuilder.CreateCylinder("tocon", { height: 0.5, diameter: 0.5, tessellation: 6 }, escena), SITIOS.quenua.x - 7 + i * 2, 0.25, SITIOS.quenua.z + 3, tocon));
  }
  const arboles: TransformNode[] = [];

  // ---------- 4. Nido de cóndor helado sobre una roca alta ----------
  const pilar = agrega(MeshBuilder.CreateCylinder("pilar", { height: 6, diameterTop: 2.2, diameterBottom: 3.4, tessellation: 7 }, escena), SITIOS.condor.x + 2, 3, SITIOS.condor.z + 3, material(escena, "#8f8577"));
  choques.push({ x: pilar.position.x, z: pilar.position.z, r: 1.8 });
  agrega(MeshBuilder.CreateTorus("nido", { diameter: 1.6, thickness: 0.35, tessellation: 16 }, escena), pilar.position.x, 6.2, pilar.position.z, material(escena, "#8a6a3f"));
  const huevo = agrega(MeshBuilder.CreateSphere("huevo", { diameter: 0.7, segments: 10 }, escena), pilar.position.x, 6.5, pilar.position.z, material(escena, "#f2ead8"));
  huevo.scaling.y = 1.25;
  const hieloMat = new StandardMaterial("m-hielo", escena);
  hieloMat.diffuseColor = Color3.FromHexString("#bfe9ff");
  hieloMat.emissiveColor = new Color3(0.3, 0.45, 0.55);
  hieloMat.alpha = 0.6;
  const hielo = agrega(MeshBuilder.CreateBox("hielo", { size: 1.6 }, escena), pilar.position.x, 6.6, pilar.position.z, hieloMat);
  // Cóndor adulto (vuela en círculos cuando nace el pichón)
  const condor = new TransformNode("condor", escena);
  condor.parent = raiz;
  const negro = material(escena, "#1b1b1b");
  const blanco = material(escena, "#f5f5f5");
  const cuerpoC = MeshBuilder.CreateSphere("condor-cuerpo", { diameter: 1, segments: 8 }, escena);
  cuerpoC.scaling.set(0.8, 0.7, 1.5);
  const collar = MeshBuilder.CreateTorus("condor-collar", { diameter: 0.6, thickness: 0.15, tessellation: 12 }, escena);
  collar.position.z = 0.65;
  collar.rotation.x = Math.PI / 2;
  const cabeza = MeshBuilder.CreateSphere("condor-cabeza", { diameter: 0.4, segments: 8 }, escena);
  cabeza.position.set(0, 0.1, 0.95);
  const alaI = MeshBuilder.CreateBox("condor-ala", { width: 3, height: 0.08, depth: 0.9 }, escena);
  const alaD = alaI.clone("condor-ala2");
  alaI.position.x = -1.6;
  alaD.position.x = 1.6;
  for (const [m, mat] of [[cuerpoC, negro], [collar, blanco], [cabeza, material(escena, "#d98b7a")], [alaI, negro], [alaD, negro]] as const) {
    m.parent = condor;
    m.material = mat;
    mallas.push(m);
  }
  condor.setEnabled(false);
  let condorVivo = false;
  let tc = 0;
  animar.push((dt) => {
    if (!condorVivo) return;
    tc += dt;
    condor.position.set(SITIOS.condor.x + Math.sin(tc * 0.5) * 9, 10 + Math.sin(tc) * 0.8, SITIOS.condor.z + Math.cos(tc * 0.5) * 9);
    condor.rotation.y = tc * 0.5 + Math.PI / 2;
    alaI.rotation.z = Math.sin(tc * 3) * 0.25;
    alaD.rotation.z = -Math.sin(tc * 3) * 0.25;
  });

  // ---------- 5. Prado de flores para el colibrí ----------
  const brotes: Mesh[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    brotes.push(agrega(MeshBuilder.CreateCylinder("brote", { height: 0.5, diameter: 0.12, tessellation: 5 }, escena), SITIOS.colibri.x + Math.sin(a) * 3, 0.25, SITIOS.colibri.z + Math.cos(a) * 3, material(escena, "#6e6a58")));
  }
  const colibri = new TransformNode("colibri", escena);
  colibri.parent = raiz;
  const cc = MeshBuilder.CreateSphere("colibri-cuerpo", { diameter: 0.35, segments: 8 }, escena);
  cc.scaling.set(0.7, 0.7, 1.4);
  const pico = MeshBuilder.CreateCylinder("colibri-pico", { height: 0.4, diameterTop: 0, diameterBottom: 0.05, tessellation: 4 }, escena);
  pico.rotation.x = Math.PI / 2;
  pico.position.z = 0.4;
  const ala1 = MeshBuilder.CreateBox("colibri-ala", { width: 0.5, height: 0.03, depth: 0.2 }, escena);
  const ala2 = ala1.clone("colibri-ala2");
  ala1.position.x = -0.3;
  ala2.position.x = 0.3;
  for (const [m, mat] of [[cc, material(escena, "#1fb86b", 0.5)], [pico, negro], [ala1, material(escena, "#0f7a45")], [ala2, material(escena, "#0f7a45")]] as const) {
    m.parent = colibri;
    m.material = mat;
    mallas.push(m);
  }
  colibri.setEnabled(false);
  let tco = 0;
  animar.push((dt) => {
    if (!colibri.isEnabled()) return;
    tco += dt;
    colibri.position.set(SITIOS.colibri.x + Math.sin(tco * 0.9) * 3, 1.4 + Math.sin(tco * 4) * 0.2, SITIOS.colibri.z + Math.cos(tco * 0.9) * 3);
    colibri.rotation.y = tco * 0.9 + Math.PI / 2;
    ala1.rotation.z = Math.sin(tco * 60) * 0.8;
    ala2.rotation.z = -Math.sin(tco * 60) * 0.8;
  });

  // ---------- 6. Puerta final: arco inca con portal ----------
  const piedra = material(escena, "#9d927f");
  for (const lado of [-1, 1]) {
    agrega(MeshBuilder.CreateBox("pirqa", { width: 1.2, height: 4.5, depth: 1.2 }, escena), SITIOS.puerta.x + lado * 2, 2.25, SITIOS.puerta.z + 1.5, piedra);
    choques.push({ x: SITIOS.puerta.x + lado * 2, z: SITIOS.puerta.z + 1.5, r: 0.9 });
  }
  agrega(MeshBuilder.CreateBox("pirqa", { width: 5.4, height: 1, depth: 1.4 }, escena), SITIOS.puerta.x, 4.9, SITIOS.puerta.z + 1.5, piedra);
  const portalMat = new StandardMaterial("m-portal", escena);
  portalMat.diffuseColor = Color3.FromHexString("#6a2bbf");
  portalMat.emissiveColor = Color3.FromHexString("#4a1a9f");
  portalMat.alpha = 0.75;
  const portal = agrega(MeshBuilder.CreatePlane("sello", { width: 2.8, height: 4.2 }, escena), SITIOS.puerta.x, 2.2, SITIOS.puerta.z + 1.5, portalMat);
  portal.isPickable = false;

  raiz.setEnabled(false);
  let t = 0;
  escena.onBeforeRenderObservable.add(() => {
    if (!raiz.isEnabled()) return;
    const dt = escena.getEngine().getDeltaTime() / 1000;
    t += dt;
    for (const f of animar) f(dt, t);
    portal.rotation.z = Math.sin(t) * 0.03;
  });

  const control = {
    /** fraccion 0..1: el valle recupera su color. */
    restaurar(fraccion: number) {
      pastoMat.diffuseColor = Color3.Lerp(gris, verde, fraccion);
    },
    liberarVicuna() {
      for (const b of barrotes) b.setEnabled(false);
      choqueJaula.r = 0;
      vicunaLibre = true;
    },
    quitarRoca(i: number) {
      piedrasRio[i]?.setEnabled(false);
      if (i >= piedrasRio.length - 1) rioAbajo.material = agua;
    },
    plantar(i: number) {
      const base = tocones[i];
      if (!base || arboles[i]) return;
      const arbol = new TransformNode("quenua", escena);
      arbol.parent = raiz;
      arbol.position.copyFrom(base.position);
      const tr = MeshBuilder.CreateCylinder("tronco", { height: 2.4, diameterTop: 0.25, diameterBottom: 0.45, tessellation: 6 }, escena);
      tr.position.y = 1.2;
      tr.material = material(escena, "#a0522d");
      const copa = MeshBuilder.CreateSphere("copa", { diameter: 2, segments: 8 }, escena);
      copa.position.y = 2.8;
      copa.scaling.y = 0.75;
      copa.material = material(escena, i % 2 ? "#3f8f3a" : "#2f7a32");
      for (const m of [tr, copa]) {
        m.parent = arbol;
        mallas.push(m);
      }
      choques.push({ x: arbol.position.x, z: arbol.position.z, r: 0.5 });
      arboles[i] = arbol;
      let crece = 0;
      arbol.scaling.setAll(0.01);
      const obs = escena.onBeforeRenderObservable.add(() => {
        crece = Math.min(1, crece + escena.getEngine().getDeltaTime() / 600);
        arbol.scaling.setAll(Math.sin((crece * Math.PI) / 2) * 1.05);
        if (crece >= 1) escena.onBeforeRenderObservable.remove(obs);
      });
    },
    eclosionar() {
      hielo.setEnabled(false);
      huevo.scaling.set(0.8, 0.8, 0.8);
      huevo.material = material(escena, "#9a9a9a");
      condor.setEnabled(true);
      condorVivo = true;
    },
    florecer() {
      brotes.forEach((b, i) => {
        b.material = material(escena, "#3f9a3a");
        const flor = MeshBuilder.CreateSphere("flor", { diameter: 0.5, segments: 6 }, escena);
        flor.parent = raiz;
        flor.position.set(b.position.x, 0.6, b.position.z);
        flor.material = material(escena, i % 2 ? "#e0213b" : "#ffc93c"); // kantu y amancay
        mallas.push(flor);
      });
      colibri.setEnabled(true);
    },
    abrirPuerta() {
      portal.setEnabled(false);
    },
  };
  return { raiz, mallas, choques, control };
}
