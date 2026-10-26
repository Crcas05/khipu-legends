// Chaski Runes · Fase 0 (prueba técnica 3D).
// Objetivo: comprobar que un mundo 3D estilizado corre fluido en celulares básicos.

import "./estilos.css";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import "@babylonjs/core/Rendering/outlineRenderer";
import { Vector3, Matrix } from "@babylonjs/core/Maths/math.vector";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { crearMundo, resolverChoques } from "./mundo";
import { Chaski, Tuki, crearLlama } from "./personajes";
import { entrada, iniciarControles } from "./controles";

type Calidad = "bajo" | "medio" | "alto";
const VELOCIDAD = 5.2;

const lienzo = document.getElementById("lienzo") as HTMLCanvasElement;
const motor = new Engine(lienzo, true, { stencil: true, preserveDrawingBuffer: false, powerPreference: "high-performance" }, false);
const escena = new Scene(motor);
const CIELO = new Color4(0.62, 0.83, 0.96, 1);
escena.clearColor = CIELO;
escena.ambientColor = new Color3(0.35, 0.35, 0.35);
escena.fogMode = Scene.FOGMODE_LINEAR;
escena.fogColor = new Color3(0.72, 0.86, 0.95);
escena.fogStart = 45;
escena.fogEnd = 95;

// Cámara inclinada que sigue al jugador (estilo Brawl Stars)
const camara = new ArcRotateCamera("camara", -Math.PI / 2, 0.92, 17, Vector3.Zero(), escena);
camara.fov = 0.75;
camara.minZ = 0.5;
camara.maxZ = 200;

// Luz: cielo suave + sol con sombras
const cielo = new HemisphericLight("cielo", new Vector3(0.2, 1, -0.3), escena);
cielo.intensity = 0.62;
cielo.groundColor = new Color3(0.45, 0.42, 0.38);
const sol = new DirectionalLight("sol", new Vector3(-0.5, -1, 0.6), escena);
sol.position = new Vector3(20, 40, -20);
sol.intensity = 1.05;

// Mundo y personajes
const mundo = crearMundo(escena);
const chaski = new Chaski(escena);
chaski.raiz.position.set(0, 0, -6);
const tuki = new Tuki(escena);
const yaru = crearLlama(escena, 4, -4);
yaru.raiz.rotation.y = -2.4;
mundo.choques.push({ x: 4, z: -4, r: 1.1 });
const personajes: Mesh[] = [...chaski.mallas, ...tuki.mallas, ...yaru.mallas];
mundo.leibles.push({ posicion: new Vector3(4, 3.4, -4), texto: 'yaru.animo = "feliz"' });

// ---------------------------------------------------------------------------
// Calidad gráfica: bajo, medio o alto
// ---------------------------------------------------------------------------
let sombras: ShadowGenerator | null = null;
let calidad: Calidad = "medio";

function aplicarCalidad(nueva: Calidad) {
  calidad = nueva;
  sombras?.dispose();
  sombras = null;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  motor.setHardwareScalingLevel(nueva === "alto" ? 1 / dpr : nueva === "medio" ? 1 / Math.min(dpr, 1.5) : 1.25);
  if (nueva !== "bajo") {
    sombras = new ShadowGenerator(nueva === "alto" ? 2048 : 1024, sol);
    sombras.usePercentageCloserFiltering = nueva === "alto";
    sombras.bias = 0.002;
    for (const m of personajes) sombras.addShadowCaster(m);
    for (const m of mundo.mallas) {
      if (["pasto", "plaza", "camino"].includes(m.name)) m.receiveShadows = true;
      else if (m.position.length() < 40) sombras.addShadowCaster(m);
    }
  }
  for (const m of [...personajes, ...mundo.mallas]) {
    const contorno = nueva !== "bajo" && !["pasto", "plaza", "camino", "borde", "agua", "apu", "nieve"].includes(m.name);
    m.renderOutline = contorno;
    m.outlineColor = new Color3(0.1, 0.07, 0.12);
    m.outlineWidth = 0.035;
  }
  document.querySelectorAll<HTMLButtonElement>("[data-calidad]").forEach((b) => b.classList.toggle("activo", b.dataset.calidad === nueva));
}

// ---------------------------------------------------------------------------
// El Ojo del Khipukamayuq (adelanto): el mundo se vuelve código
// ---------------------------------------------------------------------------
let ojoAbierto = false;
const coloresOriginales = new Map<StandardMaterial, [Color3, Color3]>();
const etiquetas: HTMLDivElement[] = [];
const capaEtiquetas = document.getElementById("etiquetas")!;

function alternarOjo() {
  ojoAbierto = !ojoAbierto;
  document.body.classList.toggle("ojo", ojoAbierto);
  for (const m of escena.materials) {
    if (!(m instanceof StandardMaterial)) continue;
    if (ojoAbierto) {
      coloresOriginales.set(m, [m.diffuseColor.clone(), m.emissiveColor.clone()]);
      m.diffuseColor = new Color3(0.03, 0.06, 0.12);
      m.emissiveColor = new Color3(0.1, 0.75, 0.7).scale(m.name.includes("#f5b83d") ? 1.3 : 0.55);
      m.wireframe = true;
    } else {
      const [d, e] = coloresOriginales.get(m) ?? [m.diffuseColor, m.emissiveColor];
      m.diffuseColor = d;
      m.emissiveColor = e;
      m.wireframe = false;
    }
  }
  escena.clearColor = ojoAbierto ? new Color4(0.02, 0.03, 0.08, 1) : CIELO;
  escena.fogColor = ojoAbierto ? new Color3(0.02, 0.03, 0.08) : new Color3(0.72, 0.86, 0.95);
  capaEtiquetas.innerHTML = "";
  etiquetas.length = 0;
  if (ojoAbierto) {
    const textos = [{ posicion: Vector3.Zero(), texto: 'chaski = {"vida": 100, "kallpa": 6}' }, ...mundo.leibles];
    for (const l of textos) {
      const e = document.createElement("div");
      e.className = "etiqueta-codigo";
      e.textContent = l.texto;
      capaEtiquetas.appendChild(e);
      etiquetas.push(e);
    }
    mostrarAviso("👁 El Ojo del Khipukamayuq: así se ve el mundo como código. En la Fase 1 podrás cambiarlo.");
  }
}

function ubicarEtiquetas() {
  if (!ojoAbierto) return;
  const ancho = motor.getRenderWidth();
  const alto = motor.getRenderHeight();
  const escala = lienzo.clientWidth / ancho;
  const posiciones = [chaski.raiz.position.add(new Vector3(0, 3.4, 0)), ...mundo.leibles.map((l) => l.posicion)];
  posiciones.forEach((p, i) => {
    const s = Vector3.Project(p, Matrix.Identity(), escena.getTransformMatrix(), camara.viewport.toGlobal(ancho, alto));
    const e = etiquetas[i];
    if (!e) return;
    const visible = s.z > 0 && s.z < 1;
    e.style.display = visible ? "block" : "none";
    e.style.transform = `translate(${s.x * escala}px, ${s.y * escala}px) translate(-50%, -100%)`;
  });
}

// ---------------------------------------------------------------------------
// Avisos y medidor de fluidez
// ---------------------------------------------------------------------------
let temporizadorAviso = 0;
function mostrarAviso(texto: string, ms = 4200) {
  const a = document.getElementById("aviso")!;
  a.textContent = texto;
  a.hidden = false;
  window.clearTimeout(temporizadorAviso);
  temporizadorAviso = window.setTimeout(() => (a.hidden = true), ms);
}

const muestras: number[] = [];
let bajoDesde = 0;
function medir() {
  const fps = motor.getFps();
  if (!isFinite(fps)) return;
  muestras.push(fps);
  if (muestras.length > 20) muestras.shift();
  const promedio = muestras.reduce((a, b) => a + b, 0) / muestras.length;
  const veredicto = promedio >= 50 ? "Fluido ✓" : promedio >= 30 ? "Aceptable" : "Lento";
  document.getElementById("fps")!.textContent = `${Math.round(promedio)} FPS · ${veredicto}`;
  document.getElementById("fps")!.dataset.nivel = promedio >= 50 ? "bien" : promedio >= 30 ? "medio" : "mal";
  // Si va lento varios segundos, baja la calidad sola
  if (promedio < 28 && calidad !== "bajo" && muestras.length >= 10) {
    if (!bajoDesde) bajoDesde = performance.now();
    if (performance.now() - bajoDesde > 4000) {
      aplicarCalidad(calidad === "alto" ? "medio" : "bajo");
      muestras.length = 0;
      bajoDesde = 0;
      mostrarAviso("Bajé la calidad gráfica para que el juego vaya más fluido.");
    }
  } else bajoDesde = 0;
}

// ---------------------------------------------------------------------------
// Bucle principal
// ---------------------------------------------------------------------------
const teclas = new Set<string>();
window.addEventListener("keydown", (e) => {
  teclas.add(e.key.toLowerCase());
  if (e.key.toLowerCase() === "o") alternarOjo();
});
window.addEventListener("keyup", (e) => teclas.delete(e.key.toLowerCase()));

escena.onBeforeRenderObservable.add(() => {
  const dt = Math.min(motor.getDeltaTime() / 1000, 0.05);
  let dx = entrada.x;
  let dz = -entrada.y;
  if (teclas.has("arrowleft") || teclas.has("a")) dx = -1;
  if (teclas.has("arrowright") || teclas.has("d")) dx = 1;
  if (teclas.has("arrowup") || teclas.has("w")) dz = 1;
  if (teclas.has("arrowdown") || teclas.has("s")) dz = -1;
  const largo = Math.hypot(dx, dz);
  if (largo > 1) {
    dx /= largo;
    dz /= largo;
  }
  const pos = chaski.raiz.position;
  pos.x += dx * VELOCIDAD * dt;
  pos.z += dz * VELOCIDAD * dt;
  resolverChoques(pos, mundo.choques);
  chaski.actualizar(dx, dz, dt);
  tuki.seguir(chaski.raiz, dt);
  camara.target = Vector3.Lerp(camara.target, pos.add(new Vector3(0, 1.2, 0)), Math.min(1, dt * 6));
  if (entrada.tomarAccion()) alternarOjo();
  ubicarEtiquetas();
});

// ---------------------------------------------------------------------------
// Arranque
// ---------------------------------------------------------------------------
iniciarControles();
document.querySelectorAll<HTMLButtonElement>("[data-calidad]").forEach((b) =>
  b.addEventListener("click", () => {
    aplicarCalidad(b.dataset.calidad as Calidad);
    muestras.length = 0;
  })
);
document.getElementById("boton-pantalla")!.addEventListener("click", async () => {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      const o = screen.orientation as ScreenOrientation & { lock?: (x: string) => Promise<void> };
      await o.lock?.("landscape").catch(() => {});
    } else await document.exitFullscreen();
  } catch {
    mostrarAviso("Tu navegador no permite pantalla completa");
  }
});
document.getElementById("boton-jugar")!.addEventListener("click", () => {
  document.getElementById("portada")!.hidden = true;
  mostrarAviso("Camina arrastrando el dedo en la izquierda. Toca 👁 OJO para ver el mundo como código.", 5500);
});

aplicarCalidad(window.devicePixelRatio > 2.5 || navigator.hardwareConcurrency <= 4 ? "bajo" : "medio");
window.addEventListener("resize", () => motor.resize());
motor.runRenderLoop(() => escena.render());
window.setInterval(medir, 500);

if (new URLSearchParams(location.search).has("prueba")) {
  (window as unknown as Record<string, unknown>).__fase0 = {
    estado: () => ({ x: chaski.raiz.position.x, z: chaski.raiz.position.z, calidad, ojo: ojoAbierto, fps: motor.getFps() }),
    calidad: (c: Calidad) => aplicarCalidad(c),
    ojo: () => alternarOjo(),
  };
}
