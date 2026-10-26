// Chaski Runes · Fase 1: Temporada 1, Misión 1, Episodio 1 "El Ojo del Khipukamayuq".
// Mundo 3D (Babylon.js) + diálogos + Ojo editable + Taller con Python real + guardado.

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
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { crearMundo, resolverChoques } from "./mundo";
import { Tuki, crearLlama } from "./personajes";
import { Chaski, MamaKhipu, crearMarcador } from "./heroes";
import { entrada, iniciarControles } from "./controles";
import { estado, guardar, hayPartida, reiniciar, yaPaso, type Paso } from "./estado";
import { INTRO, MAMA_1, FUENTE_LISTA, TECHO_LISTO, MAMA_2, FINAL, REPARAR_FUENTE, REPARAR_TECHO, APRENDIDO } from "./datos/episodio1";
import { hablar, dialogoAbierto } from "./ui/dialogo";
import { aviso, actualizarHud, ganarKallpa } from "./ui/hud";
import { abrirReparacion } from "./ui/reparar";
import { abrirTaller } from "./ui/taller";
import { elegirHeroe, nuevoNivel, proximamente } from "./ui/pantallas";
import { desbloquear, abrirSimiQillqa, TOTAL_NUDOS } from "./ui/logros";
import { sonido, despertarAudio, iniciarMusica, alternarSilencio, estaSilenciado } from "./sonido";
import { crearChorro, estallido, crearPolvo, crearDestello, Sacudida } from "./efectos";
import type { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";

type Calidad = "bajo" | "medio" | "alto";
const VELOCIDAD = 5.4;
const $ = (id: string) => document.getElementById(id)!;

// ---------------------------------------------------------------------------
// Motor, cámara y luces
// ---------------------------------------------------------------------------
const lienzo = $("lienzo") as HTMLCanvasElement;
const motor = new Engine(lienzo, true, { stencil: true, preserveDrawingBuffer: false, powerPreference: "high-performance" }, false);
const escena = new Scene(motor);
const CIELO = new Color4(0.62, 0.83, 0.96, 1);
escena.clearColor = CIELO;
escena.ambientColor = new Color3(0.35, 0.35, 0.35);
escena.fogMode = Scene.FOGMODE_LINEAR;
escena.fogColor = new Color3(0.72, 0.86, 0.95);
escena.fogStart = 45;
escena.fogEnd = 95;

let radioBase = 20;
const camara = new ArcRotateCamera("camara", -Math.PI / 2, 0.92, 20, Vector3.Zero(), escena);
camara.minZ = 0.5;
camara.maxZ = 200;
function ajustarCamara() {
  const vertical = lienzo.clientHeight > lienzo.clientWidth;
  camara.fovMode = vertical ? ArcRotateCamera.FOVMODE_HORIZONTAL_FIXED : ArcRotateCamera.FOVMODE_VERTICAL_FIXED;
  camara.fov = vertical ? 1.05 : 0.75;
  camara.beta = vertical ? 0.72 : 0.92;
  radioBase = vertical ? 18 : 20;
  camara.radius = radioBase;
  document.body.classList.toggle("vertical", vertical);
}
ajustarCamara();

const cielo = new HemisphericLight("cielo", new Vector3(0.2, 1, -0.3), escena);
cielo.intensity = 0.62;
cielo.groundColor = new Color3(0.45, 0.42, 0.38);
const sol = new DirectionalLight("sol", new Vector3(-0.5, -1, 0.6), escena);
sol.position = new Vector3(20, 40, -20);
sol.intensity = 1.05;

// ---------------------------------------------------------------------------
// Mundo y personajes
// ---------------------------------------------------------------------------
const mundo = crearMundo(escena);
const chaski = new Chaski(escena);
chaski.raiz.position.set(0, 0, -8);
const tuki = new Tuki(escena);
const yaru = crearLlama(escena, 4, -4);
yaru.raiz.rotation.y = -2.4;
mundo.choques.push({ x: 4, z: -4, r: 1.1 });
const MAMA_POS = new Vector3(-5, 0, 3);
const mama = new MamaKhipu(escena, MAMA_POS.x, MAMA_POS.z, 2.7);
mundo.choques.push({ x: MAMA_POS.x, z: MAMA_POS.z, r: 0.9 });
const marcador = crearMarcador(escena);
marcador.position.set(MAMA_POS.x, 3.6, MAMA_POS.z);
const personajes: Mesh[] = [...chaski.mallas, ...tuki.mallas, ...yaru.mallas, ...mama.mallas];

// VFX
const chorro = crearChorro(escena, new Vector3(0, 2.2, 0));
const polvo = crearPolvo(escena, chaski.raiz.position);
const sacudida = new Sacudida();

// Secretos de level design: 3 nudos dorados que solo se ven con el Ojo
const NUDOS = [new Vector3(15.5, 1, -14.5), new Vector3(7, 1, 22.5), new Vector3(-19, 1, -7)];
const destellos: ParticleSystem[] = NUDOS.map((p) => crearDestello(escena, p));

// Valores del mundo que el Ojo puede leer y cambiar
const valores = { agua: false, techo: "gris", animo: "triste" };
function aplicarValores() {
  mundo.control.agua(valores.agua);
  if (valores.agua) chorro.start();
  else chorro.stop();
  mundo.control.techo(valores.techo);
  mundo.control.bug(!yaPaso("techo"));
  refrescarEtiquetas();
}

// ---------------------------------------------------------------------------
// Calidad gráfica
// ---------------------------------------------------------------------------
let sombras: ShadowGenerator | null = null;
let calidad: Calidad = "medio";
const SIN_CONTORNO = ["pasto", "plaza", "camino", "borde", "agua", "apu", "nieve", "glitch", "marcador", "mejilla", "sonrisa", "ojo", "brillo", "pupila", "iris", "esclera", "ceja", "nudo", "cuerda", "mecha"];
function aplicarCalidad(nueva: Calidad) {
  calidad = nueva;
  sombras?.dispose();
  sombras = null;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  motor.setHardwareScalingLevel(nueva === "alto" ? 1 / dpr : nueva === "medio" ? 1 / Math.min(dpr, 1.5) : 1.25);
  if (nueva !== "bajo") {
    sombras = new ShadowGenerator(nueva === "alto" ? 2048 : 1024, sol);
    sombras.usePercentageCloserFiltering = true;
    sombras.bias = 0.002;
    for (const m of personajes) sombras.addShadowCaster(m);
    for (const m of mundo.mallas) {
      if (["pasto", "plaza", "camino"].includes(m.name)) m.receiveShadows = true;
      else if (m.position.length() < 40) sombras.addShadowCaster(m);
    }
  }
  for (const m of [...personajes, ...mundo.mallas]) {
    m.renderOutline = nueva !== "bajo" && !SIN_CONTORNO.includes(m.name);
    m.outlineColor = new Color3(0.1, 0.07, 0.12);
    m.outlineWidth = 0.03;
  }
  document.querySelectorAll<HTMLButtonElement>("[data-calidad]").forEach((b) => b.classList.toggle("activo", b.dataset.calidad === nueva));
}

// ---------------------------------------------------------------------------
// El Ojo del Khipukamayuq: el mundo como código, y se puede cambiar
// ---------------------------------------------------------------------------
let ojoAbierto = false;
const coloresOriginales = new Map<StandardMaterial, [Color3, Color3, Texture | null]>();
interface Etiqueta {
  clave: string;
  posicion: () => Vector3;
  texto: () => string;
  editable: () => boolean;
  visible?: () => boolean;
  tesoro?: boolean;
  el?: HTMLDivElement;
}
const ETIQUETAS: Etiqueta[] = [
  { clave: "chaski", posicion: () => chaski.raiz.position.add(new Vector3(0, 3.7, 0)), texto: () => `chaski = {"vida": 100, "kallpa": ${estado.kallpa}}`, editable: () => false },
  { clave: "fuente", posicion: () => new Vector3(0, 3.6, 0), texto: () => `fuente.agua = ${valores.agua ? "True" : "False"}`, editable: () => estado.paso === "fuente" },
  { clave: "casa", posicion: () => new Vector3(-12, 4.9, 12), texto: () => `casa.techo = "${valores.techo}"`, editable: () => estado.paso === "techo" },
  { clave: "yaru", posicion: () => new Vector3(4, 3.4, -4), texto: () => `yaru.animo = "${valores.animo}"`, editable: () => false },
  { clave: "mama", posicion: () => new Vector3(MAMA_POS.x, 3.5, MAMA_POS.z), texto: () => `mama_khipu.rol = "guardiana"`, editable: () => false },
  ...NUDOS.map((p, i) => ({
    clave: `nudo${i}`,
    posicion: () => p.add(new Vector3(0, 1.3, 0)),
    texto: () => `nudo_dorado[${i}] = "?"`,
    editable: () => false,
    visible: () => !estado.nudos.includes(i),
    tesoro: true,
  })),
];
const capaEtiquetas = $("etiquetas");

function refrescarEtiquetas() {
  capaEtiquetas.innerHTML = "";
  if (!ojoAbierto) return;
  for (const e of ETIQUETAS) {
    e.el = undefined;
    if (e.visible && !e.visible()) continue;
    const el = document.createElement("div");
    el.className = "etiqueta-codigo" + (e.editable() ? " editable" : "") + (e.tesoro ? " tesoro" : "");
    el.textContent = e.texto();
    if (e.editable()) {
      el.insertAdjacentHTML("beforeend", '<span class="toca">✎ toca</span>');
      el.addEventListener("pointerdown", (ev) => {
        ev.stopPropagation();
        ev.preventDefault();
        reparar(e.clave);
      });
    }
    capaEtiquetas.appendChild(el);
    e.el = el;
  }
}

function alternarOjo(forzar?: boolean) {
  if (!yaPaso("hablar1")) {
    aviso("Primero habla con Mama Khipu. Ella te entregará el Ojo.");
    return;
  }
  ojoAbierto = forzar ?? !ojoAbierto;
  document.body.classList.toggle("ojo", ojoAbierto);
  for (const m of escena.materials) {
    if (!(m instanceof StandardMaterial) || m.name === "m-marcador" || m.name === "m-cielo") continue;
    if (ojoAbierto) {
      coloresOriginales.set(m, [m.diffuseColor.clone(), m.emissiveColor.clone(), m.diffuseTexture as Texture | null]);
      m.diffuseColor = new Color3(0.03, 0.06, 0.12);
      m.emissiveColor = new Color3(0.1, 0.75, 0.7).scale(0.55);
      m.diffuseTexture = null;
      m.wireframe = true;
    } else {
      const guardado = coloresOriginales.get(m);
      if (guardado) {
        m.diffuseColor = guardado[0];
        m.emissiveColor = guardado[1];
        m.diffuseTexture = guardado[2];
      }
      m.wireframe = false;
    }
  }
  escena.clearColor = ojoAbierto ? new Color4(0.02, 0.03, 0.08, 1) : CIELO;
  mundo.cupula.isVisible = !ojoAbierto;
  for (const n of mundo.nubes) n.isVisible = !ojoAbierto;
  destellos.forEach((d, i) => (ojoAbierto && !estado.nudos.includes(i) ? d.start() : d.stop()));
  sonido.ojo(ojoAbierto);
  if (ojoAbierto) desbloquear("ojo");
  $("boton-accion").classList.remove("nuevo");
  escena.fogColor = ojoAbierto ? new Color3(0.02, 0.03, 0.08) : new Color3(0.72, 0.86, 0.95);
  refrescarEtiquetas();
  if (ojoAbierto && (estado.paso === "fuente" || estado.paso === "techo")) aviso("Toca el código que brilla en amarillo ✎", 3000);
}

function ubicarEtiquetas() {
  if (!ojoAbierto) return;
  const ancho = motor.getRenderWidth();
  const alto = motor.getRenderHeight();
  const escala = lienzo.clientWidth / ancho;
  const vista = camara.viewport.toGlobal(ancho, alto);
  const transformacion = escena.getTransformMatrix();
  const W = lienzo.clientWidth;
  const H = lienzo.clientHeight;
  for (const e of ETIQUETAS) {
    if (!e.el) continue;
    const s = Vector3.Project(e.posicion(), Matrix.Identity(), transformacion, vista);
    let x = s.x * escala;
    let y = s.y * escala;
    const detras = s.z < 0 || s.z > 1;
    // Las editables nunca se pierden: se pegan al borde de la pantalla
    const fuera = detras || x < 40 || x > W - 40 || y < 90 || y > H - 40;
    if (fuera && !e.el.classList.contains("editable")) {
      e.el.style.display = "none";
      continue;
    }
    if (fuera) {
      x = Math.min(Math.max(x, 120), W - 120);
      y = Math.min(Math.max(y, 120), H - 140);
    }
    // Que ninguna etiqueta quede cortada por los bordes
    const medio = e.el.offsetWidth / 2 + 6;
    x = Math.min(Math.max(x, medio), W - medio);
    e.el.classList.toggle("al-borde", fuera);
    e.el.style.display = "block";
    e.el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
  }
}

// ---------------------------------------------------------------------------
// La historia: cada paso del episodio
// ---------------------------------------------------------------------------
function avanzar(paso: Paso) {
  estado.paso = paso;
  guardar();
  actualizarHud();
  actualizarBotones();
}

let ocupado = false;
async function enCalma(f: () => Promise<void>) {
  if (ocupado) return;
  ocupado = true;
  entrada.x = entrada.y = 0;
  try {
    await f();
  } finally {
    ocupado = false;
    actualizarBotones();
  }
}

async function reparar(clave: string) {
  await enCalma(async () => {
    if (clave === "fuente" && estado.paso === "fuente") {
      const ok = await abrirReparacion(REPARAR_FUENTE, "False");
      if (!ok) return;
      valores.agua = true;
      aplicarValores();
      sonido.reparar();
      sonido.agua();
      estallido(escena, new Vector3(0, 2.5, 0), ["#bff3ff", "#4fc3f7", "#ffffff"], 120, 7);
      sacudida.disparar(0.4);
      desbloquear("fuente");
      chaski.festejar();
      ganarKallpa(5);
      avanzar("techo");
      alternarOjo(false);
      await hablar(FUENTE_LISTA);
    } else if (clave === "casa" && estado.paso === "techo") {
      const ok = await abrirReparacion(REPARAR_TECHO, '"gris"');
      if (!ok) return;
      valores.techo = "rojo";
      // El Bug huye: estallido morado donde estaban los glitches y luego chispas en las casas
      for (const g of mundo.glitches) estallido(escena, g.position, ["#b388ff", "#8b3dff", "#2a0a5e"], 25, 4);
      avanzar("hablar2");
      aplicarValores();
      sonido.reparar();
      estallido(escena, new Vector3(-12, 4, 12), ["#ffd166", "#c8102e", "#ffffff"], 90, 6);
      sacudida.disparar(0.5);
      desbloquear("techo");
      chaski.festejar();
      ganarKallpa(5);
      alternarOjo(false);
      aviso("¡El Bug Ch'aqwa huyó del pueblo!", 3500);
      await hablar(TECHO_LISTO);
    }
  });
}

async function hablarConMama() {
  await enCalma(async () => {
    switch (estado.paso) {
      case "hablar1":
        await hablar(MAMA_1);
        avanzar("fuente");
        sonido.pututu();
        $("boton-accion").classList.add("nuevo");
        break;
      case "hablar2":
        await hablar(MAMA_2);
        avanzar("taller");
        await usarTaller();
        break;
      case "final":
        await hablar(FINAL);
        valores.animo = "feliz";
        estado.nivel = Math.max(estado.nivel, 2);
        avanzar("completo");
        desbloquear("episodio1");
        chaski.festejar();
        await nuevoNivel(APRENDIDO);
        if ((await proximamente()) === "repetir") {
          const heroe = estado.heroe;
          reiniciar();
          estado.heroe = heroe;
          guardar();
          location.reload();
        }
        break;
      case "taller":
        await usarTaller();
        break;
      default:
        await hablar([{ quien: "mama", texto: estado.paso === "completo" ? "Sigue explorando, Chaski. La selva te espera." : "Usa el Ojo, Chaski. El pueblo te necesita." }]);
    }
  });
}

async function usarTaller() {
  const ok = await abrirTaller();
  if (ok && estado.paso === "taller") {
    ganarKallpa(10);
    desbloquear("runa");
    estallido(escena, chaski.raiz.position.add(new Vector3(0, 2, 0)), ["#c78bff", "#ffd166", "#ffffff"], 90, 6);
    chaski.festejar();
    avanzar("final");
    aviso("Vuelve con Mama Khipu para terminar el episodio.", 4000);
  }
}

// ---------------------------------------------------------------------------
// Botones de acción
// ---------------------------------------------------------------------------
let cercaDeMama = false;
function actualizarBotones() {
  $("boton-hablar").hidden = !cercaDeMama || ocupado;
  $("boton-taller").hidden = !(estado.paso === "taller" || estado.paso === "final" || estado.paso === "completo");
  $("boton-accion").hidden = !yaPaso("hablar1");
  const avisar = ["hablar1", "hablar2", "final"].includes(estado.paso);
  marcador.isVisible = avisar;
}

iniciarControles();
$("boton-hablar").addEventListener("click", () => hablarConMama());
$("boton-taller").addEventListener("click", () => enCalma(usarTaller));
document.querySelectorAll<HTMLButtonElement>("[data-calidad]").forEach((b) =>
  b.addEventListener("click", () => {
    aplicarCalidad(b.dataset.calidad as Calidad);
    muestras.length = 0;
  })
);
$("chip-simi").addEventListener("click", () => {
  sonido.toque();
  enCalma(abrirSimiQillqa);
});
const pintarSonido = () => ($("boton-sonido").textContent = estaSilenciado() ? "🔇 Sonido: no" : "🔊 Sonido: sí");
pintarSonido();
$("boton-sonido").addEventListener("click", () => {
  alternarSilencio();
  pintarSonido();
});
$("boton-ajustes").addEventListener("click", () => ($("ajustes").hidden = !$("ajustes").hidden));
$("cerrar-ajustes").addEventListener("click", () => ($("ajustes").hidden = true));
$("boton-reiniciar").addEventListener("click", () => {
  if (confirmarDoble($("boton-reiniciar") as HTMLButtonElement)) {
    reiniciar();
    location.reload();
  }
});
$("boton-pantalla").addEventListener("click", async () => {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  } catch {
    aviso("Tu navegador no permite pantalla completa");
  }
});

/** Pide un segundo toque para acciones que borran progreso (sin ventanas del navegador). */
function confirmarDoble(b: HTMLButtonElement): boolean {
  if (b.dataset.seguro === "1") return true;
  b.dataset.seguro = "1";
  const original = b.textContent;
  b.textContent = "¿Seguro? Toca otra vez";
  window.setTimeout(() => {
    b.dataset.seguro = "";
    b.textContent = original;
  }, 3000);
  return false;
}

const teclas = new Set<string>();
window.addEventListener("keydown", (e) => {
  if ((e.target as HTMLElement).closest("textarea, input")) return;
  const k = e.key.toLowerCase();
  teclas.add(k);
  if (!jugando || ocupado || dialogoAbierto()) return;
  if (k === "o") alternarOjo();
  if (k === "e" && cercaDeMama) hablarConMama();
  if (k === "t" && !$("boton-taller").hidden) enCalma(usarTaller);
  if (k === "q") enCalma(abrirSimiQillqa);
});
window.addEventListener("keyup", (e) => teclas.delete(e.key.toLowerCase()));

// ---------------------------------------------------------------------------
// Medidor de fluidez (baja la calidad solo si el celular sufre)
// ---------------------------------------------------------------------------
const muestras: number[] = [];
let bajoDesde = 0;
function medir() {
  const fps = motor.getFps();
  if (!isFinite(fps)) return;
  muestras.push(fps);
  if (muestras.length > 20) muestras.shift();
  const promedio = muestras.reduce((a, b) => a + b, 0) / muestras.length;
  const fpsEl = $("fps");
  fpsEl.textContent = `${Math.round(promedio)} FPS · ${promedio >= 50 ? "Fluido ✓" : promedio >= 30 ? "Aceptable" : "Lento"}`;
  fpsEl.dataset.nivel = promedio >= 50 ? "bien" : promedio >= 30 ? "medio" : "mal";
  if (promedio < 28 && calidad !== "bajo" && muestras.length >= 10) {
    if (!bajoDesde) bajoDesde = performance.now();
    if (performance.now() - bajoDesde > 4000) {
      aplicarCalidad(calidad === "alto" ? "medio" : "bajo");
      muestras.length = 0;
      bajoDesde = 0;
    }
  } else bajoDesde = 0;
}

// ---------------------------------------------------------------------------
// Bucle principal
// ---------------------------------------------------------------------------
let jugando = false;
escena.onBeforeRenderObservable.add(() => {
  const dt = Math.min(motor.getDeltaTime() / 1000, 0.05);
  const bloqueado = !jugando || ocupado || dialogoAbierto();
  let dx = bloqueado ? 0 : entrada.x;
  let dz = bloqueado ? 0 : -entrada.y;
  if (!bloqueado) {
    if (teclas.has("arrowleft") || teclas.has("a")) dx = -1;
    if (teclas.has("arrowright") || teclas.has("d")) dx = 1;
    if (teclas.has("arrowup") || teclas.has("w")) dz = 1;
    if (teclas.has("arrowdown") || teclas.has("s")) dz = -1;
  }
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
  mama.actualizar(dt);
  camara.target = Vector3.Lerp(camara.target, pos.add(new Vector3(0, 1.2, 0)), Math.min(1, dt * 6)).add(sacudida.tomar(dt));
  // Cámara de cine: se acerca durante los diálogos
  const radioObjetivo = dialogoAbierto() ? radioBase * 0.72 : radioBase;
  camara.radius += (radioObjetivo - camara.radius) * Math.min(1, dt * 3);
  polvo.emitRate = !ojoAbierto && Math.hypot(dx, dz) > 0.6 ? 26 : 0;

  // Recoger nudos dorados (solo con el Ojo abierto)
  if (ojoAbierto) {
    NUDOS.forEach((n, i) => {
      if (estado.nudos.includes(i) || Math.hypot(pos.x - n.x, pos.z - n.z) > 2) return;
      estado.nudos.push(i);
      guardar();
      destellos[i].stop();
      estallido(escena, n, ["#ffd166", "#4ff0dc", "#ffffff"], 70, 5);
      sonido.tesoro();
      ganarKallpa(3);
      aviso(`✨ ¡Nudo dorado! ${estado.nudos.length}/${TOTAL_NUDOS}`, 2500);
      if (estado.nudos.length >= TOTAL_NUDOS) desbloquear("nudos");
      refrescarEtiquetas();
    });
  }
  if (estado.palabras.length >= 6) desbloquear("simi");

  const cerca = jugando && Vector3.Distance(pos, MAMA_POS) < 3.8;
  if (cerca !== cercaDeMama) {
    cercaDeMama = cerca;
    actualizarBotones();
  }
  if (entrada.tomarAccion() && jugando && !ocupado && !dialogoAbierto()) alternarOjo();
  ubicarEtiquetas();
});

// ---------------------------------------------------------------------------
// Arranque
// ---------------------------------------------------------------------------
function restaurarMundo() {
  valores.agua = yaPaso("fuente");
  valores.techo = yaPaso("techo") ? "rojo" : "gris";
  valores.animo = estado.paso === "completo" ? "feliz" : "triste";
  aplicarValores();
}

async function empezar() {
  despertarAudio();
  iniciarMusica();
  sonido.toque();
  $("portada").hidden = true;
  if (!estado.heroe) {
    estado.heroe = await elegirHeroe();
    guardar();
  }
  $("hud").hidden = false;
  $("botones-accion").hidden = false;
  document.body.classList.add("en-juego");
  jugando = true;
  actualizarHud();
  actualizarBotones();
  if (estado.paso === "intro") {
    await enCalma(async () => {
      await hablar(INTRO);
      avanzar("hablar1");
    });
  } else {
    aviso(`¡Bienvenido de vuelta! ${document.getElementById("objetivo-texto")!.textContent}`, 3500);
  }
}

if (hayPartida()) {
  $("boton-jugar").textContent = "▶ CONTINUAR";
  $("boton-nueva").hidden = false;
}
$("boton-jugar").addEventListener("click", () => empezar());
$("boton-nueva").addEventListener("click", () => {
  if (!confirmarDoble($("boton-nueva") as HTMLButtonElement)) return;
  reiniciar();
  restaurarMundo();
  empezar();
});

restaurarMundo();
const debil = navigator.hardwareConcurrency <= 4 || window.devicePixelRatio > 2.5;
aplicarCalidad(debil ? "medio" : "alto");
window.addEventListener("resize", () => {
  motor.resize();
  ajustarCamara();
});
motor.runRenderLoop(() => escena.render());
window.setInterval(medir, 500);

if (new URLSearchParams(location.search).has("prueba")) {
  (window as unknown as Record<string, unknown>).__juego = {
    estado: () => ({ ...estado, x: chaski.raiz.position.x, z: chaski.raiz.position.z, ojo: ojoAbierto, valores: { ...valores } }),
    ir: (x: number, z: number) => chaski.raiz.position.set(x, 0, z),
    calidad: (c: Calidad) => aplicarCalidad(c),
  };
}
