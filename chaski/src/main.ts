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
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Ray } from "@babylonjs/core/Culling/ray";
import "@babylonjs/core/Culling/ray";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { crearMundo, resolverChoques } from "./mundo";
import { Tuki, crearLlama } from "./personajes";
import { Chaski, MamaKhipu, crearMarcador } from "./heroes";
import { entrada, iniciarControles } from "./controles";
import { estado, guardar, hayPartida, reiniciar, yaPaso, enSelva, enValle, type Paso } from "./estado";
import { BLOQUES_1, MAMA_TALLER, RETO_TALLER, INTRO, MAMA_1, FUENTE_LISTA, TECHO_LISTO, MAMA_2, FINAL, REPARAR_FUENTE, REPARAR_TECHO, APRENDIDO } from "./datos/episodio1";
import { hablar, dialogoAbierto } from "./ui/dialogo";
import { aviso, actualizarHud, ganarKallpa, fijarObjetivo } from "./ui/hud";
import { abrirReparacion } from "./ui/reparar";
import { abrirTaller } from "./ui/taller";
import { elegirHeroe, nuevoNivel, proximamente } from "./ui/pantallas";
import { prologo, tarjeta, voz, teoria, elegir, esperarBoton, cerrarTarjeta } from "./ui/prologo";
import { crearSelva, PIEDRAS, PUERTA, AMARU_POS, INICIO_SELVA, LIMITE_SELVA } from "./selva";
import { Jefe, Batalla } from "./batalla";
import { crearValle, SITIOS, INICIO_VALLE, LIMITE_VALLE, type Sitio } from "./valle";
import { ValleJuego } from "./valleJuego";
import { ZonaJuego } from "./zonaJuego";
import { INICIO_ZONA, LIMITE_ZONA } from "./zonaMundo";
import { ZONAS, type Zona } from "./datos/zonas";
import type { SitioZona } from "./datos/zonas";
import { abrirMapa } from "./ui/mapa";
import { JEFES } from "./datos/jefes";
import { INTRO_VALLE, FIN_VALLE, APRENDIDO_VALLE, codigoSitio } from "./datos/valle";
import { abrirBloques } from "./ui/bloques";
import { BLOQUES_2, LLEGADA, AMARU_1, ECOS_LISTOS, ANTES_BATALLA, VICTORIA, APRENDIDO_2, RETO_RAYO } from "./datos/episodio2";
import { desbloquear, abrirSimiQillqa, TOTAL_NUDOS } from "./ui/logros";
import { sonido, despertarAudio, iniciarMusica, alternarSilencio, estaSilenciado, cambiarMusica } from "./sonido";
import { crearModelo, ponerChullo, ponerMontera } from "./modelos";
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
  camara.beta = vertical ? 0.56 : 0.82;
  radioBase = vertical ? 19 : 19;
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
chaski.raiz.position.set(0, 0, -6);
const tuki = new Tuki(escena);
const yaru = crearLlama(escena, 4, -4);
yaru.raiz.rotation.y = -2.4;
mundo.choques.push({ x: 4, z: -4, r: 1.1 });
const MAMA_POS = new Vector3(-5, 0, 3);
const mama = new MamaKhipu(escena, MAMA_POS.x, MAMA_POS.z, 2.7);
mundo.choques.push({ x: MAMA_POS.x, z: MAMA_POS.z, r: 0.9 });
const marcador = crearMarcador(escena);
marcador.position.set(MAMA_POS.x, 3.6, MAMA_POS.z);
// Región 2: la selva, Amaru y los ecos fantasma
const selva = crearSelva(escena);
const amaru = new Chaski(escena, true);
amaru.raiz.position.copyFrom(AMARU_POS);
amaru.raiz.rotation.y = Math.PI + 0.4;
amaru.raiz.setEnabled(false);
selva.choques.push({ x: AMARU_POS.x, z: AMARU_POS.z, r: 0.9 });
const ecos: Chaski[] = [];
for (let i = 0; i < 4; i++) {
  const e = new Chaski(escena);
  e.fantasma();
  e.raiz.setEnabled(false);
  ecos.push(e);
}
const jefe = new Jefe(escena);
const valle = crearValle(escena);
// Killa (guerrera de la luna) y Yaru (la llama) acompañan en las zonas del viaje
const killa = new Chaski(escena, true);
killa.raiz.setEnabled(false);
const yaruGuia = crearLlama(escena, 0, 0);
yaruGuia.raiz.scaling.setAll(0.8);
yaruGuia.raiz.setEnabled(false);
let guiaActual: "amaru" | "killa" | "yaru" | null = null;
type Region = "plaza" | "selva" | "valle" | "zona";
let region: Region = "plaza";
let personajes: Mesh[] = [];
function listarPersonajes() {
  personajes = [...chaski.mallas, ...tuki.mallas, ...yaru.mallas, ...mama.mallas, ...amaru.mallas, ...killa.mallas, ...yaruGuia.mallas];
}
listarPersonajes();

// Flecha guía en el suelo: siempre apunta al objetivo (nadie se pierde)
const guia = new TransformNode("guia", escena);
guia.scaling.setAll(1.6);
const oroGuia = new StandardMaterial("m-guia", escena);
oroGuia.diffuseColor = new Color3(1, 0.82, 0.3);
oroGuia.emissiveColor = new Color3(0.9, 0.62, 0.1);
oroGuia.alpha = 0.9;
const asta = MeshBuilder.CreateBox("guia-asta", { width: 0.28, height: 0.06, depth: 0.9 }, escena);
asta.parent = guia;
asta.position.z = 0.2;
const punta = MeshBuilder.CreateCylinder("guia-punta", { height: 0.06, diameter: 0.95, tessellation: 3 }, escena);
punta.parent = guia;
punta.position.z = 0.85;
punta.rotation.y = -Math.PI / 2;
for (const m of [asta, punta]) {
  m.material = oroGuia;
  m.isPickable = false;
}
function destinoGuia(): Vector3 | null {
  if (region === "zona") return zonaJuego.destino();
  if (region === "valle") {
    // La flecha apunta al rescate pendiente más cercano (la puerta, solo al final)
    const p = chaski.raiz.position;
    let mejor: Vector3 | null = null;
    let d = Infinity;
    for (const [s, v] of Object.entries(SITIOS) as [Sitio, Vector3][]) {
      if (estado.rescates.includes(s) || (s === "puerta" && estado.rescates.length < 5)) continue;
      const dd = Math.hypot(v.x - p.x, v.z - p.z);
      if (dd < d) [d, mejor] = [dd, v];
    }
    return estado.paso === "valle" ? mejor : null;
  }
  if (region === "selva") return ["selva", "victoria"].includes(estado.paso) ? AMARU_POS : null;
  if (["hablar1", "hablar2", "final", "taller"].includes(estado.paso)) return MAMA_POS;
  if (estado.paso === "fuente") return Vector3.Zero();
  if (estado.paso === "techo") return new Vector3(-12, 0, 12);
  return null;
}

// Lo que tapa al jugador se vuelve transparente
const TAPAN = new Set(["casa", "techo", "puerta", "copa", "tronco", "anden", "pirqa"]);
let transparentes: Mesh[] = [];

// Escudo del prólogo (burbuja turquesa)
const escudoMat = new StandardMaterial("m-escudo", escena);
escudoMat.diffuseColor = new Color3(0.3, 0.95, 0.9);
escudoMat.emissiveColor = new Color3(0.15, 0.7, 0.65);
escudoMat.alpha = 0.32;
const escudo = MeshBuilder.CreateSphere("escudo", { diameter: 3.4, segments: 16 }, escena);
escudo.material = escudoMat;
escudo.parent = chaski.raiz;
escudo.position.y = 1.4;
escudo.isPickable = false;
escudo.setEnabled(false);

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
const SIN_CONTORNO = ["helecho", "sello", "runa", "rumi", "pasto", "plaza", "camino", "borde", "agua", "apu", "nieve", "glitch", "marcador", "mejilla", "sonrisa", "ojo", "brillo", "pupila", "iris", "esclera", "ceja", "nudo", "cuerda", "mecha"];
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
    for (const m of [...mundo.mallas, ...selva.mallas, ...valle.mallas]) {
      if (["pasto", "plaza", "camino"].includes(m.name)) m.receiveShadows = true;
      else if (m.position.length() < 40) sombras.addShadowCaster(m);
    }
  }
  for (const m of [...personajes, ...mundo.mallas, ...selva.mallas, ...valle.mallas]) {
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
  region?: Region;
  el?: HTMLDivElement;
}
const ETIQUETAS: Etiqueta[] = [
  { clave: "chaski", posicion: () => chaski.raiz.position.add(new Vector3(0, 3.7, 0)), texto: () => `chaski = {"vida": 100, "kallpa": ${estado.kallpa}}`, editable: () => false },
  { clave: "fuente", posicion: () => new Vector3(0, 3.6, 0), texto: () => `fuente.agua = ${valores.agua ? "True" : "False"}`, editable: () => estado.paso === "fuente" },
  { clave: "casa", posicion: () => new Vector3(-12, 4.9, 12), texto: () => `casa.techo = "${valores.techo}"`, editable: () => estado.paso === "techo" },
  { clave: "yaru", posicion: () => new Vector3(4, 3.4, -4), texto: () => `yaru.animo = "${valores.animo}"`, editable: () => false },
  { clave: "mama", posicion: () => new Vector3(MAMA_POS.x, 3.5, MAMA_POS.z), texto: () => `mama_khipu.rol = "guardiana"`, editable: () => false },
  { clave: "punku", region: "selva", posicion: () => PUERTA.add(new Vector3(0, 6.6, 0)), texto: () => `punku.abierta = ${yaPaso("ecos") ? "True" : "False"}`, editable: () => false },
  { clave: "rumi", region: "selva", posicion: () => new Vector3(0, 2.2, 7), texto: () => `rumi = [${PIEDRAS.map((_, i) => (rumiEncendidas[i] ? "True" : "False")).join(", ")}]`, editable: () => false },
  { clave: "amaru", region: "selva", posicion: () => amaru.raiz.position.add(new Vector3(0, 3.6, 0)), texto: () => `amaru.magia = "río"`, editable: () => false },
  ...(Object.keys(SITIOS) as Sitio[]).map((s) => ({
    clave: `sitio-${s}`,
    region: "valle" as Region,
    posicion: () => SITIOS[s].add(new Vector3(0, s === "condor" ? 8 : 3.6, 0)),
    texto: () => codigoSitio(s, estado.rescates.includes(s), estado.rescates.length),
    editable: () => false,
  })),
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
    if ((e.region ?? "plaza") !== region && e.clave !== "chaski") continue;
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
  if (region === "selva") return hablarConAmaru();
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
        await abrirBloques(BLOQUES_1);
        ganarKallpa(5);
        avanzar("taller");
        await hablar(MAMA_TALLER);
        await usarTaller();
        break;
      case "final":
        await hablar(FINAL);
        valores.animo = "feliz";
        estado.nivel = Math.max(estado.nivel, 2);
        estado.sellos["B1 Variables y tipos"] = Math.max(estado.sellos["B1 Variables y tipos"] ?? 0, 2);
        avanzar("completo");
        desbloquear("episodio1");
        chaski.festejar();
        await nuevoNivel(APRENDIDO);
        await despuesDelEpisodio1();
        break;
      case "taller":
        await usarTaller();
        break;
      case "completo":
        await hablar([{ quien: "mama", texto: "El Bug Ch'aqwa se esconde en la selva, {nombre}. ¿Estás listo para el viaje?" }]);
        await despuesDelEpisodio1();
        break;
      default:
        await hablar([{ quien: "mama", texto: "Usa el Ojo, {nombre}. El pueblo te necesita." }]);
    }
  });
}

async function despuesDelEpisodio1() {
  const eleccion = await proximamente();
  if (eleccion === "repetir") {
    const { heroe, nombre } = estado;
    reiniciar();
    Object.assign(estado, { heroe, nombre, paso: "intro" });
    guardar();
    location.reload();
  } else if (eleccion === "selva") {
    avanzar("selva");
    await viajarA("selva");
    await hablar(LLEGADA);
  }
}

// ---------------------------------------------------------------------------
// Regiones: cambiar de la plaza a la selva
// ---------------------------------------------------------------------------
async function viajarA(destino: Region) {
  const velo = $("velo");
  velo.hidden = false;
  velo.classList.add("cubre");
  await new Promise((r) => window.setTimeout(r, 450));
  if (ojoAbierto) alternarOjo(false);
  if (region === "valle") valleJuego.salir();
  if (region === "zona" && destino !== "zona") {
    zonaJuego.salir();
    estado.zonaActual = "";
    guardar();
  }
  region = destino;
  const zonaActiva = destino === "zona";
  const selvaActiva = destino === "selva";
  const plazaActiva = destino === "plaza";
  const valleActivo = destino === "valle";
  for (const m of mundo.mallas) m.setEnabled(plazaActiva);
  for (const g of mundo.glitches) g.setEnabled(plazaActiva);
  mama.raiz.setEnabled(plazaActiva);
  yaru.raiz.setEnabled(plazaActiva);
  marcador.setEnabled(plazaActiva);
  if (!plazaActiva) chorro.stop();
  else if (valores.agua) chorro.start();
  selva.raiz.setEnabled(selvaActiva);
  valle.raiz.setEnabled(valleActivo);
  const zona = zonaActiva ? ZONAS.find((z) => z.id === estado.zonaActual) ?? null : null;
  guiaActual = valleActivo ? "amaru" : zona ? (zona.guia as "amaru" | "killa" | "yaru") : null;
  amaru.raiz.setEnabled(selvaActiva || guiaActual === "amaru");
  killa.raiz.setEnabled(guiaActual === "killa");
  yaruGuia.raiz.setEnabled(guiaActual === "yaru");
  const inicio = selvaActiva ? INICIO_SELVA : valleActivo ? INICIO_VALLE : zonaActiva ? INICIO_ZONA : new Vector3(0, 0, -6);
  if (guiaActual) nodoGuia()!.position.copyFrom(inicio.add(new Vector3(2, 0, -1)));
  else amaru.raiz.position.copyFrom(AMARU_POS);
  chaski.raiz.position.copyFrom(inicio);
  if (valleActivo) valleJuego.entrar();
  if (zona) zonaJuego.entrar(zona);
  fijarObjetivo(zona ? objetivoDeZona(zona) : null);
  camara.target.copyFrom(chaski.raiz.position);
  escena.fogColor = zonaJuego.mundo ? zonaJuego.mundo.niebla : selvaActiva ? new Color3(0.55, 0.72, 0.55) : new Color3(0.72, 0.86, 0.95);
  escena.fogStart = selvaActiva ? 28 : zona?.ambiente === "nubes" ? 22 : 45;
  escena.fogEnd = selvaActiva ? 70 : zona?.ambiente === "nubes" ? 60 : 95;
  $("valle-titulo").textContent = zona ? `${zona.numero}. ${zona.nombre}` : "🌿 Naturaleza";
  sol.intensity = selvaActiva ? 0.9 : 1.05;
  document.body.dataset.region = destino;
  if (!zonaActiva) cambiarMusica(selvaActiva ? (batalla.activa ? "batalla" : "selva") : "andes");
  actualizarBotones();
  await new Promise((r) => window.setTimeout(r, 200));
  velo.classList.remove("cubre");
  window.setTimeout(() => (velo.hidden = true), 500);
}

// ---------------------------------------------------------------------------
// Episodio 2: Ecos del Chaski (for) y la batalla
// ---------------------------------------------------------------------------
const rumiEncendidas = [false, false, false];
function pintarRumi() {
  rumiEncendidas.forEach((on, i) => selva.control.activarPiedra(i, on));
  refrescarEtiquetas();
}

/** Lanza n ecos fantasma desde Chaski hasta cada destino (caminando). */
function lanzarEcos(destinos: Vector3[], quedarse: boolean): Promise<void> {
  const origen = chaski.raiz.position.clone();
  return new Promise((r) => {
    const activos = destinos.map((d, i) => {
      const e = ecos[i];
      e.raiz.setEnabled(true);
      e.raiz.position.copyFrom(origen);
      estallido(escena, origen.add(new Vector3(0, 1.5, 0)), ["#4ff0dc", "#ffffff"], 30, 3);
      return { e, d };
    });
    sonido.agua();
    let t = 0;
    const obs = escena.onBeforeRenderObservable.add(() => {
      const dt = Math.min(motor.getDeltaTime() / 1000, 0.05);
      t += dt;
      let llegaron = true;
      for (const { e, d } of activos) {
        const p = e.raiz.position;
        const dx = d.x - p.x;
        const dz = d.z - p.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 0.15) {
          llegaron = false;
          const v = Math.min(dist, 7 * dt);
          p.x += (dx / dist) * v;
          p.z += (dz / dist) * v;
          e.actualizar(dx / dist, dz / dist, dt);
        } else e.actualizar(0, 0, dt);
      }
      if (llegaron || t > 4) {
        escena.onBeforeRenderObservable.remove(obs);
        if (!quedarse) window.setTimeout(() => activos.forEach(({ e }) => e.raiz.setEnabled(false)), 900);
        r();
      }
    });
  });
}
function guardarEcos() {
  for (const e of ecos) e.raiz.setEnabled(false);
}

async function rompecabezasEcos() {
  for (;;) {
    rumiEncendidas.fill(false);
    pintarRumi();
    guardarEcos();
    const c = tarjeta(`
      ${voz("amaru", "¿Cuántas veces quieres repetir tu paso? Cada repetición crea un <b>eco</b> que corre a una [[rumi]].".replace(/\[\[|\]\]/g, ""))}
      <pre class="codigo-mini"><span class="fn">for</span> <span class="var">i</span> <span class="fn">in</span> <span class="fn">range</span>(<span class="valor">___</span>):
    eco(rumi[<span class="var">i</span>])</pre>
      <div class="prologo-opciones">${[1, 2, 3].map((n) => `<button class="opcion" data-n="${n}"><code>range(${n})</code></button>`).join("")}</div>`);
    const n = await new Promise<number>((r) =>
      c.querySelectorAll<HTMLButtonElement>("[data-n]").forEach((b) => b.addEventListener("click", () => (sonido.toque(), r(Number(b.dataset.n)))))
    );
    cerrarTarjeta();
    await lanzarEcos(PIEDRAS.slice(0, n), true);
    for (let i = 0; i < n; i++) {
      rumiEncendidas[i] = true;
      pintarRumi();
      sonido.kallpa();
      estallido(escena, PIEDRAS[i].add(new Vector3(0, 0.6, 0)), ["#ffd166", "#ffffff"], 40, 4);
      await new Promise((r) => window.setTimeout(r, 300));
    }
    if (n === 3) break;
    sonido.error();
    const c2 = tarjeta(`
      ${voz("amaru", `Con <code>range(${n})</code> la runa se repite <b>${n} ${n === 1 ? "vez" : "veces"}</b>: i vale ${Array.from({ length: n }, (_, i) => i).join(" y ")}. ¡Faltan piedras por pisar!`)}
      <button class="boton-oro" id="seguir">↺ Intentar otra vez</button>`);
    await esperarBoton(c2, "#seguir");
  }
  // ¡Las tres piedras! La puerta se abre
  sonido.reparar();
  sacudida.disparar(0.6);
  selva.control.abrirPuerta(true);
  estallido(escena, PUERTA.add(new Vector3(0, 2.5, 0)), ["#b388ff", "#ffd166", "#ffffff"], 140, 8);
  desbloquear("ecos");
  ganarKallpa(10);
  let c = tarjeta(`
    ${voz("amaru", "¡Tres ecos, tres piedras! Así funciona <code>for</code>.")}
    ${teoria("<code>for</code> repite el código de adentro. <code>range(3)</code> entrega <b>0, 1, 2</b>: ¡Python empieza a contar desde 0! Por eso <code>rumi[0]</code> es la primera piedra.")}
    <button class="boton-oro" id="seguir">Siguiente ▸</button>`);
  await esperarBoton(c, "#seguir");
  c = tarjeta(`
    ${voz("amaru", "Pregunta de guardiana: ¿qué valores toma <code>i</code>?")}
    <pre class="codigo-mini">for i in range(3):
    print(i)</pre>
    <div class="prologo-opciones"></div>
    <p class="prologo-nota" hidden></p>`);
  await elegir(c, [
    { codigo: "1, 2, 3", ok: false, porque: "Casi. range() empieza en 0, no en 1." },
    { codigo: "0, 1, 2", ok: true, porque: "¡Exacto! Tres valores, empezando en 0." },
    { codigo: "3", ok: false, porque: "3 es cuántas veces se repite, pero i cambia en cada vuelta: 0, 1, 2." },
  ]);
  cerrarTarjeta();
  await abrirBloques(BLOQUES_2);
  ganarKallpa(5);
  guardarEcos();
  avanzar("forja");
  await hablar(ECOS_LISTOS);
  jefe.aparecer(new Vector3(0, 0, 9));
  sacudida.disparar(0.8);
  sonido.pututu();
}

async function forjarRayo(): Promise<boolean> {
  const ok = await abrirTaller(RETO_RAYO);
  if (!ok) {
    aviso("Toca 📜 TALLER cuando estés listo para forjar tu rayo.", 3500);
    return false;
  }
  desbloquear("forja");
  ganarKallpa(10);
  chaski.festejar();
  avanzar("batalla");
  await hablar(ANTES_BATALLA);
  return true;
}

const batalla = new Batalla({
  escena,
  jefe,
  jugador: () => chaski.raiz.position,
  animar: (a) => (a === "lanzar" ? chaski.lanzar() : chaski.golpeado()),
  escudo: (a) => escudo.setEnabled(a),
  festejar: () => chaski.festejar(),
  sacudida,
  ecos: async (n) => {
    const p = chaski.raiz.position;
    const destinos = Array.from({ length: n }, (_, i) => p.add(new Vector3(Math.sin((i / n) * Math.PI * 2) * 2.2, 0, Math.cos((i / n) * Math.PI * 2) * 2.2)));
    await lanzarEcos(destinos, false);
    return destinos;
  },
  aviso,
});

function empezarBatalla() {
  actualizarBotones();
  cambiarMusica("batalla");
  aviso("¡Usa tus cartas Q, W, E! Esquiva el suelo rojo.", 3500);
  batalla.iniciar().then(() =>
    enCalma(async () => {
      cambiarMusica("selva");
      desbloquear("jefe");
      ganarKallpa(25);
      avanzar("victoria");
      await hablar([{ quien: "tuki", texto: "¡KRAAA! ¡Lo [[atipay]]! ¡Lo venciste, {nombre}! Habla con Amaru." }]);
    })
  );
}

// ---------------------------------------------------------------------------
// Zona 1: el Valle Sagrado (mundo abierto con rescates)
// ---------------------------------------------------------------------------
const valleJuego = new ValleJuego({
  escena,
  valle,
  jugador: () => chaski.raiz.position,
  festejar: () => chaski.festejar(),
  lanzar: () => chaski.lanzar(),
  golpeado: () => chaski.golpeado(),
  sacudida,
  aviso,
  ganarKallpa,
  desbloquear,
  alTerminar: () =>
    enCalma(async () => {
      sonido.nivel();
      await hablar(FIN_VALLE);
      estado.nivel = Math.max(estado.nivel, 4);
      avanzar("completo3");
      desbloquear("valle");
      await nuevoNivel(APRENDIDO_VALLE);
      await irAlMapa();
    }),
});

// ---------------------------------------------------------------------------
// Zonas 2–10: el viaje por el Perú
// ---------------------------------------------------------------------------
const zonaJuego = new ZonaJuego({
  escena,
  jugador: () => chaski.raiz.position,
  lanzar: () => chaski.lanzar(),
  golpeado: () => chaski.golpeado(),
  festejar: () => chaski.festejar(),
  sacudida,
  aviso,
  ganarKallpa,
  desbloquear,
  alAvanzar: (z: Zona) => fijarObjetivo(objetivoDeZona(z)),
  pausa: (f) => enCalma(f),
  alTerminar: (z: Zona) =>
    enCalma(async () => {
      sonido.nivel();
      await hablar(z.fin);
      estado.nivel = Math.max(estado.nivel, 4 + z.numero - 1);
      guardar();
      desbloquear(`zona-${z.id}`);
      await nuevoNivel(z.temas.split(" · "));
      await irAlMapa();
    }),
});

function objetivoDeZona(z: Zona) {
  const hechos = estado.zonas[z.id]?.length ?? 0;
  if (hechos < z.sitios.length) return `Restaura los altares de ${z.nombre}: ${hechos}/${z.sitios.length} (sigue la flecha)`;
  if (!estado.jefes.includes(z.id)) return "⚔️ ¡Vence al jefe! Rompe su escudo con la 🔮 runa y dispárale";
  return `¡${z.nombre} restaurado! Toca 🗺 para seguir el viaje`;
}

function nodoGuia() {
  return guiaActual === "amaru" ? amaru.raiz : guiaActual === "killa" ? killa.raiz : guiaActual === "yaru" ? yaruGuia.raiz : null;
}

/** Abre el mapa del Perú y viaja a la zona elegida. */
async function irAlMapa() {
  const destino = await abrirMapa();
  if (!destino) return;
  if (destino === "valle") {
    if (yaPaso("valle")) await viajarA("valle");
    else await entrarValle();
    return;
  }
  const z = ZONAS.find((x) => x.id === destino);
  if (!z) return;
  const primeraVez = !(estado.zonas[z.id]?.length);
  estado.zonaActual = z.id;
  guardar();
  await viajarA("zona");
  if (primeraVez) await hablar(z.intro);
  aviso(`🗺 ${z.nombre}: ${z.sitios.length} altares por restaurar. ¡Sigue la flecha!`, 3500);
}

async function entrarValle() {
  avanzar("valle");
  await viajarA("valle");
  await hablar(INTRO_VALLE);
  aviso("🗺 Mira el mapa (arriba a la izquierda) y elige tu primer rescate.", 4000);
}

let sitioActual: Sitio | null = null;
let altarActual: SitioZona | null = null;
function adelanteDeChaski() {
  const a = chaski.raiz.rotation.y;
  return new Vector3(Math.sin(a), 0, Math.cos(a));
}

async function hablarConAmaru() {
  await enCalma(async () => {
    switch (estado.paso) {
      case "selva":
        await hablar(AMARU_1);
        avanzar("ecos");
        await rompecabezasEcos();
        await forjarRayo();
        break;
      case "ecos":
        await rompecabezasEcos();
        await forjarRayo();
        break;
      case "forja":
        await forjarRayo();
        break;
      case "victoria":
        await hablar(VICTORIA);
        estado.nivel = Math.max(estado.nivel, 3);
        estado.sellos["B6 Bucle for"] = Math.max(estado.sellos["B6 Bucle for"] ?? 0, 2);
        avanzar("completo2");
        desbloquear("episodio2");
        await nuevoNivel(APRENDIDO_2);
        if ((await proximamente(3)) === "valle") await entrarValle();
        break;
      case "completo2":
        await hablar([{ quien: "amaru", texto: "El Bug huyó hacia el Valle Sagrado, {nombre}. ¿Vamos tras él?" }]);
        if ((await proximamente(3)) === "valle") await entrarValle();
        break;
      default:
        await hablar([{ quien: "amaru", texto: "El río siempre encuentra un camino, {nombre}. Tú también." }]);
    }
  });
  if ((estado.paso as Paso) === "batalla" && !batalla.activa) empezarBatalla();
}

async function usarTaller() {
  if (region === "selva") {
    if (estado.paso === "forja") {
      await forjarRayo();
      if ((estado.paso as Paso) === "batalla" && !batalla.activa) window.setTimeout(empezarBatalla, 50);
    } else await abrirTaller(RETO_RAYO);
    return;
  }
  const ok = await abrirTaller(RETO_TALLER);
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
  const abierto = region === "valle" || region === "zona";
  $("boton-hablar").hidden = !cercaDeMama || ocupado || batalla.activa || abierto;
  $("boton-huaraca").hidden = !abierto;
  $("boton-rescatar").hidden = !(region === "valle" ? sitioActual : region === "zona" ? altarActual : null) || ocupado;
  $("boton-rescatar").innerHTML = region === "zona" ? "📘<br>APRENDER" : "🔧<br>RESCATAR";
  $("chip-mapa").hidden = !yaPaso("victoria") || batalla.activa;
  $("boton-taller").hidden = !(["taller", "final", "completo", "forja", "batalla", "victoria", "completo2"].includes(estado.paso)) || batalla.activa;
  $("boton-accion").hidden = !yaPaso("hablar1");
  const avisar = ["hablar1", "hablar2", "final"].includes(estado.paso);
  marcador.isVisible = avisar;
}

iniciarControles();
$("boton-hablar").addEventListener("click", () => hablarConMama());
$("boton-huaraca").addEventListener("pointerdown", (e) => {
  e.preventDefault();
  if (ocupado || dialogoAbierto()) return;
  if (region === "zona") zonaJuego.disparar(adelanteDeChaski());
  else valleJuego.disparar(adelanteDeChaski());
});
$("chip-mapa").addEventListener("click", () => {
  sonido.toque();
  enCalma(irAlMapa);
});
$("boton-rescatar").addEventListener("click", () => {
  if (region === "zona" && altarActual) {
    const s = altarActual;
    enCalma(() => zonaJuego.aprender(s));
  } else if (sitioActual) {
    const s = sitioActual;
    enCalma(() => valleJuego.rescatar(s));
  }
});
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
  if (!jugando || ocupado || dialogoAbierto() || batalla.activa) return;
  if (k === "o") alternarOjo();
  if (k === "e" && cercaDeMama) hablarConMama();
  if (k === "t" && !$("boton-taller").hidden) enCalma(usarTaller);
  if (k === "q") enCalma(abrirSimiQillqa);
  if (k === "f" && region === "valle") valleJuego.disparar(adelanteDeChaski());
  if (k === "f" && region === "zona") zonaJuego.disparar(adelanteDeChaski());
  if (k === "m" && yaPaso("victoria")) enCalma(irAlMapa);
  if (k === "e" && region === "zona" && altarActual) {
    const s = altarActual;
    enCalma(() => zonaJuego.aprender(s));
  }
  if (k === "e" && region === "valle" && sitioActual) {
    const s = sitioActual;
    enCalma(() => valleJuego.rescatar(s));
  }
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
  const bloqueado = !jugando || ocupado || dialogoAbierto() || zonaJuego.preguntando;
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
  resolverChoques(
    pos,
    region === "selva" ? selva.choques : region === "valle" ? valle.choques : region === "zona" ? zonaJuego.mundo?.choques ?? [] : mundo.choques,
    0.45,
    region === "selva" ? LIMITE_SELVA : region === "valle" ? LIMITE_VALLE : region === "zona" ? LIMITE_ZONA : undefined
  );
  // El guía acompaña al jugador en el viaje
  const acompanante = nodoGuia();
  if (acompanante && (region === "valle" || region === "zona")) {
    const meta = pos.add(new Vector3(-1.8, 0, -1.8));
    const ap = acompanante.position;
    const vx = meta.x - ap.x;
    const vz = meta.z - ap.z;
    const dist = Math.hypot(vx, vz);
    const anim = guiaActual === "killa" ? killa : guiaActual === "amaru" ? amaru : null;
    if (dist > 0.6) {
      const v = Math.min(dist, (dist > 6 ? 7 : 5) * dt);
      ap.x += (vx / dist) * v;
      ap.z += (vz / dist) * v;
      if (anim) anim.actualizar(vx / dist, vz / dist, dt);
      else acompanante.rotation.y = Math.atan2(vx, vz);
    } else anim?.actualizar(0, 0, dt);
  }
  if (region === "zona") {
    zonaJuego.actualizar(dt, ocupado || dialogoAbierto());
    const a = jugando && !ocupado ? zonaJuego.sitioCercano() : null;
    if (a !== altarActual) {
      altarActual = a;
      actualizarBotones();
    }
  }
  if (region === "valle") {
    valleJuego.actualizar(dt, ocupado || dialogoAbierto());
    const s = jugando && !ocupado ? valleJuego.sitioCercano() : null;
    if (s !== sitioActual) {
      sitioActual = s;
      actualizarBotones();
    }
  }
  batalla.actualizar(dt);
  chaski.actualizar(dx, dz, dt);
  tuki.seguir(chaski.raiz, dt);
  mama.actualizar(dt);
  camara.target = Vector3.Lerp(camara.target, pos.add(new Vector3(0, 1.2, 0)), Math.min(1, dt * 6)).add(sacudida.tomar(dt));
  // Cámara de cine: se acerca durante los diálogos
  const radioObjetivo = dialogoAbierto() ? radioBase * 0.72 : radioBase;
  camara.radius += (radioObjetivo - camara.radius) * Math.min(1, dt * 3);
  // Flecha guía
  const destino = destinoGuia();
  const lejos = destino ? Math.hypot(destino.x - pos.x, destino.z - pos.z) : 0;
  guia.setEnabled(!!destino && jugando && !dialogoAbierto() && lejos > 4.5);
  if (destino) {
    const ang = Math.atan2(destino.x - pos.x, destino.z - pos.z);
    guia.rotation.y = ang;
    const latido = 2.2 + Math.sin(performance.now() / 180) * 0.25;
    guia.position.set(pos.x + Math.sin(ang) * latido, 0.12, pos.z + Math.cos(ang) * latido);
  }
  // Transparencia de lo que se interpone entre la cámara y Chaski
  for (const m of transparentes) m.visibility = 1;
  transparentes = [];
  const desde = camara.position;
  const hacia = pos.add(new Vector3(0, 1.2, 0)).subtract(desde);
  const largoRayo = hacia.length();
  const choques = escena.multiPickWithRay(new Ray(desde, hacia.normalize(), largoRayo - 0.8), (m) => TAPAN.has(m.name));
  for (const c of choques ?? []) {
    const m = c.pickedMesh as Mesh;
    if (m) {
      m.visibility = 0.28;
      transparentes.push(m);
    }
  }

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

  const cerca = jugando && region !== "valle" && Vector3.Distance(pos, region === "selva" ? AMARU_POS : MAMA_POS) < 3.8;
  if (cerca !== cercaDeMama) {
    cercaDeMama = cerca;
    actualizarBotones();
  }
  if (entrada.tomarAccion() && jugando && !ocupado && !dialogoAbierto() && !batalla.activa) alternarOjo();
  ubicarEtiquetas();
});

// ---------------------------------------------------------------------------
// Arranque
// ---------------------------------------------------------------------------
function restaurarMundo() {
  valores.agua = yaPaso("fuente");
  valores.techo = yaPaso("techo") ? "rojo" : "gris";
  valores.animo = yaPaso("final") ? "feliz" : "triste";
  aplicarValores();
  const abierta = yaPaso("ecos");
  rumiEncendidas.fill(abierta);
  pintarRumi();
  selva.control.abrirPuerta(abierta);
}

const efectosPrologo = {
  festejar: () => chaski.festejar(),
  barra(v: number) {
    $("barra-kallpa").hidden = v < 0;
    if (v < 0) return;
    $("barra-texto").textContent = `kallpa = ${v}`;
    ($("barra-relleno") as HTMLElement).style.width = `${Math.min(100, (v / 20) * 100)}%`;
  },
  ataque(activo: boolean) {
    mundo.control.bug(true);
    mundo.control.atacar(activo ? chaski.raiz.position : null, activo ? 2.2 : 3);
    if (activo) sacudida.disparar(0.3);
  },
  escudo(activo: boolean) {
    escudo.setEnabled(activo);
    if (activo) {
      estallido(escena, chaski.raiz.position.add(new Vector3(0, 1.4, 0)), ["#4ff0dc", "#ffffff", "#1fa596"], 120, 8);
      for (const g of mundo.glitches) estallido(escena, g.position, ["#b388ff", "#8b3dff", "#2a0a5e"], 15, 4);
    }
  },
  golpe() {
    sacudida.disparar(0.9);
    document.body.classList.remove("golpe");
    void document.body.offsetWidth;
    document.body.classList.add("golpe");
  },
  chispas: () => estallido(escena, chaski.raiz.position.add(new Vector3(0, 2, 0)), ["#ffd166", "#4ff0dc", "#ffffff"], 80, 6),
};

/** Racha diaria: volver cada día da kallpa extra. */
function revisarRacha() {
  const hoy = new Date().toLocaleDateString("en-CA");
  if (estado.ultimoDia === hoy) return;
  const ayer = new Date(Date.now() - 864e5).toLocaleDateString("en-CA");
  estado.racha = estado.ultimoDia === ayer ? estado.racha + 1 : 1;
  estado.ultimoDia = hoy;
  guardar();
  if (estado.racha > 1) {
    window.setTimeout(() => {
      aviso(`🔥 ¡Racha de ${estado.racha} días! +${Math.min(10, estado.racha * 2)} kallpa`, 3500);
      ganarKallpa(Math.min(10, estado.racha * 2));
    }, 1500);
  }
  if (estado.racha >= 3) desbloquear("racha3");
}

async function empezar() {
  revisarRacha();
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
  if (estado.paso === "prologo") {
    await enCalma(async () => {
      await prologo(efectosPrologo);
      ganarKallpa(15);
      desbloquear("prologo");
      avanzar("intro");
    });
  }
  if (estado.zonaActual && ZONAS.some((z) => z.id === estado.zonaActual)) {
    await viajarA("zona");
    aviso("🗺 Sigue tu viaje. Toca 🗺 para ver el mapa del Perú.", 3500);
    return;
  }
  if (enValle()) {
    await viajarA("valle");
    if (estado.paso === "valle") aviso("🗺 Sigue rescatando el Valle Sagrado. ¡Mira el mapa!", 3500);
  } else if (enSelva()) {
    await viajarA("selva");
    if (estado.paso === "forja" || estado.paso === "batalla") jefe.aparecer(new Vector3(0, 0, 9));
    if (estado.paso === "batalla") {
      aviso("¡El Bug Ch'aqwa te espera! Prepárate…", 2500);
      window.setTimeout(empezarBatalla, 2600);
      return;
    }
  }
  if (estado.paso === "intro") {
    await enCalma(async () => {
      await hablar(INTRO);
      avanzar("hablar1");
    });
  } else {
    aviso(`¡Bienvenido de vuelta! ${document.getElementById("objetivo-texto")!.textContent}`, 3500);
  }
}

// Portada: el título se "programa" solo, para mostrar desde el segundo 0 que este mundo es código
(function escribirPortada() {
  const lineas = ['mundo = "Andes"', 'heroe = "Chaski"', "codigo = True", "print(heroe + \" Runes\")"];
  const pre = $("portada-codigo");
  let i = 0;
  let j = 0;
  const paso = () => {
    if (i >= lineas.length) {
      pre.classList.add("listo");
      return;
    }
    j++;
    const hechas = lineas.slice(0, i).join("\n");
    pre.textContent = (hechas ? hechas + "\n" : "") + lineas[i].slice(0, j) + "▌";
    if (j >= lineas[i].length) {
      i++;
      j = 0;
      window.setTimeout(paso, 260);
    } else window.setTimeout(paso, 38);
  };
  window.setTimeout(paso, 400);
})();

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

// Personajes 3D animados (KayKit, CC0). Si no cargan, quedan los personajes armados con formas.
(async () => {
  try {
    const vestirChaski = async (heroe: Chaski) => {
      const m = await crearModelo(escena, "chaski.glb", heroe.raiz, 2.7);
      heroe.vestir(m, m.cabeza ? ponerChullo(escena, m.cabeza, 1.12) : []);
    };
    await vestirChaski(chaski);
    for (const e of ecos) await vestirChaski(e);
    const mk = await crearModelo(escena, "killa.glb", killa.raiz, 2.7);
    killa.vestir(mk);
    const ma = await crearModelo(escena, "amaru.glb", amaru.raiz, 2.7);
    amaru.vestir(ma, ma.cabeza ? ponerMontera(escena, ma.cabeza, 0.85) : []);
    listarPersonajes();
    aplicarCalidad(calidad);
    (window as unknown as Record<string, unknown>).__modelos = true;
  } catch (error) {
    console.warn("No se cargaron los modelos 3D; se usan los personajes simples.", error);
  }
})();
const debil = navigator.hardwareConcurrency <= 4 || window.devicePixelRatio > 2.5;
aplicarCalidad(debil ? "medio" : "alto");
window.addEventListener("resize", () => {
  motor.resize();
  ajustarCamara();
});
motor.runRenderLoop(() => escena.render());
window.setInterval(medir, 500);

if (new URLSearchParams(location.search).has("prueba")) {
  (window as unknown as Record<string, unknown>).__jefes = JEFES;
  (window as unknown as Record<string, unknown>).__juego = {
    estado: () => ({ ...estado, x: chaski.raiz.position.x, z: chaski.raiz.position.z, ojo: ojoAbierto, valores: { ...valores } }),
    ir: (x: number, z: number) => chaski.raiz.position.set(x, 0, z),
    calidad: (c: Calidad) => aplicarCalidad(c),
    jefe,
    camara,
    amaru,
    valle: { bugsVivos: () => ({ cerca: region === "zona" ? zonaJuego.bugsCerca() : valleJuego.bugsCerca() }) },
    zj: zonaJuego,
    zona: () => ({ id: zonaJuego.zona?.id, hechos: estado.zonas[zonaJuego.zona?.id ?? ""] ?? [], sitios: zonaJuego.zona?.sitios.map((s) => [s.id, s.x, s.z]) }),
  };
}
