// Jugabilidad de las zonas del viaje: acción (mini-Bugs de varios tipos y huaraca),
// suspenso (el Bug avanza con una cuenta regresiva), rescate (lecciones en los altares)
// y un jefe final por zona cuyo escudo solo cae respondiendo runas de esa zona.

import { esquivoElGolpe } from "./movimiento";
import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Zona, SitioZona } from "./datos/zonas";
import { JEFES } from "./datos/jefes";
import { crearZonaMundo, INICIO_ZONA, LIMITE_ZONA } from "./zonaMundo";
import { jugarLeccion, NOMBRE_SELLO } from "./ui/leccion";
import { tarjeta, voz, esperarBoton, cerrarTarjeta } from "./ui/prologo";
import { estado, guardar } from "./estado";
import { estallido, Sacudida } from "./efectos";
import { sonido, alarma, cambiarMusica, musicaSuave, type Estilo } from "./sonido";
import { Jefe } from "./batalla";
import { armaActual, lanzarProyectil, golpeChampi } from "./armas";
import { ponerClima } from "./clima";

const MATERIALES = ["piedra", "ichu", "adobe"];
const AMENAZA = 120; // segundos que tarda el Bug en mandar una ola
const escapar = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");

export const MUSICA_ZONA: Record<string, Estilo> = {
  titicaca: "altiplano",
  ucayali: "selva",
  kuelap: "selva",
  chavin: "andes",
  ayllu: "andes",
  caral: "costa",
  chanchan: "costa",
  feria: "feria",
  machupicchu: "cumbre",
};

interface Contexto {
  escena: Scene;
  jugador: () => Vector3;
  lanzar: () => void;
  golpeado: () => void;
  festejar: () => void;
  sacudida: Sacudida;
  aviso: (t: string, ms?: number) => void;
  ganarKallpa: (n: number) => void;
  desbloquear: (clave: string) => void;
  alTerminar: (z: Zona) => void;
  alAvanzar?: (z: Zona) => void;
  /** Ejecuta algo con el juego en pausa (sin moverse). */
  pausa: (f: () => Promise<void>) => Promise<void>;
}

type TipoBug = "normal" | "rapido" | "escudo" | "divisor";
const TIPOS: Record<TipoBug, { vida: number; velocidad: number; tam: number; color: string; brillo: string }> = {
  normal: { vida: 2, velocidad: 2.4, tam: 0.8, color: "#8b3dff", brillo: "#4a14b0" },
  rapido: { vida: 1, velocidad: 4.2, tam: 0.6, color: "#ff4fa3", brillo: "#a0145e" },
  escudo: { vida: 4, velocidad: 1.7, tam: 1.05, color: "#5c6bc0", brillo: "#1a237e" },
  divisor: { vida: 2, velocidad: 2.2, tam: 0.9, color: "#2ec4b6", brillo: "#0b6e66" },
};

interface MiniBug {
  raiz: TransformNode;
  tipo: TipoBug;
  vida: number;
  casa: Vector3;
  sitio: string;
  golpeHasta: number;
  t: number;
  quietoHasta?: number;
}

export function zonaCompleta(z: Zona) {
  const hechos = estado.zonas[z.id] ?? [];
  return z.sitios.every((s) => hechos.includes(s.id)) && estado.jefes.includes(z.id);
}

export class ZonaJuego {
  zona: Zona | null = null;
  mundo: ReturnType<typeof crearZonaMundo> | null = null;
  vida = 100;
  private bugs: MiniBug[] = [];
  private tiempo = 0;
  private recarga = 0;
  private mapaCada = 0;
  private amenaza = AMENAZA;
  private mats = new Map<TipoBug, StandardMaterial>();
  private ojoMat: StandardMaterial;
  // Jefe
  private jefe: Jefe | null = null;
  private escudoJefe: Mesh | null = null;
  private escudoArriba = true;
  private escudoHasta = 0;
  private runa: TransformNode | null = null;
  private pregunta = 0;
  private alertas: { malla: Mesh; t: number; donde: Vector3 }[] = [];
  private proximoAtaque = 4;
  private proximaOla = 12;
  private enPregunta = false;
  // Tesoros ocultos: solo se ven (y se recogen) con el Ojo abierto
  private tesoros: { malla: TransformNode; i: number }[] = [];
  ojoAbierto = false;

  constructor(private c: Contexto) {
    for (const [tipo, d] of Object.entries(TIPOS) as [TipoBug, (typeof TIPOS)[TipoBug]][]) {
      const m = new StandardMaterial(`m-minibug-${tipo}`, c.escena);
      m.diffuseColor = Color3.FromHexString(d.color);
      m.emissiveColor = Color3.FromHexString(d.brillo);
      this.mats.set(tipo, m);
    }
    this.ojoMat = new StandardMaterial("m-minibug-ojo-z", c.escena);
    this.ojoMat.emissiveColor = new Color3(1, 1, 1);
    this.ojoMat.disableLighting = true;
  }

  get activa() {
    return this.zona !== null;
  }
  get preguntando() {
    return this.enPregunta;
  }
  get jefeActivo() {
    return this.jefe !== null;
  }

  private hechos(): string[] {
    if (!this.zona) return [];
    return (estado.zonas[this.zona.id] ??= []);
  }

  entrar(z: Zona) {
    this.salir();
    this.zona = z;
    this.mundo = crearZonaMundo(this.c.escena, z);
    this.mundo.raiz.setEnabled(true);
    this.vida = 100;
    this.amenaza = AMENAZA;
    for (const s of this.hechos()) this.mundo.completar(s);
    this.mundo.restaurar(this.hechos().length / z.sitios.length);
    z.sitios.forEach((s, i) => {
      if (this.hechos().includes(s.id)) return;
      this.ponerBug(s.id, this.tipoPara(i, 0), new Vector3(s.x + 4, 0, s.z + 1));
      this.ponerBug(s.id, this.tipoPara(i, 1), new Vector3(s.x - 3, 0, s.z + 3));
    });
    document.getElementById("hud-valle")!.hidden = false;
    document.getElementById("amenaza")!.hidden = this.todoRestaurado();
    document.body.classList.add("en-valle");
    this.ponerTesoros();
    cambiarMusica(MUSICA_ZONA[z.id] ?? "andes");
    this.pintarHud();
    if (this.todoRestaurado() && !estado.jefes.includes(z.id)) window.setTimeout(() => this.iniciarJefe(), 1500);
  }

  salir() {
    for (const t of this.tesoros) t.malla.dispose();
    this.tesoros = [];
    for (const b of this.bugs) b.raiz.dispose();
    this.bugs = [];
    this.terminarJefe(false);
    this.mundo?.dispose();
    this.mundo = null;
    this.zona = null;
    document.getElementById("amenaza")!.hidden = true;
    document.body.classList.remove("amenaza");
  }

  /** Dos tesoros escondidos por zona, en lugares fijos. */
  private ponerTesoros() {
    if (!this.zona) return;
    const lugares = [
      [-24 + this.zona.numero, 22 - this.zona.numero],
      [22 - this.zona.numero * 0.5, -18 + this.zona.numero],
    ];
    const mat = new StandardMaterial("m-tesoro", this.c.escena);
    mat.emissiveColor = new Color3(1, 0.82, 0.3);
    mat.disableLighting = true;
    lugares.forEach(([x, z], i) => {
      if (estado.tesoros.includes(`${this.zona!.id}:${i}`)) return;
      const r = new TransformNode("tesoro", this.c.escena);
      const nudo = MeshBuilder.CreateTorusKnot("tesoro", { radius: 0.45, tube: 0.14, radialSegments: 48 }, this.c.escena);
      nudo.material = mat;
      nudo.parent = r;
      nudo.position.y = 1.2;
      r.position.set(x, 0, z);
      r.setEnabled(this.ojoAbierto);
      this.tesoros.push({ malla: r, i });
    });
  }

  /** El Ojo se abrió o cerró: los tesoros aparecen o desaparecen. */
  verConOjo(abierto: boolean) {
    this.ojoAbierto = abierto;
    for (const t of this.tesoros) t.malla.setEnabled(abierto);
    if (abierto && this.tesoros.length) this.c.aviso(`👁 ¡El Ojo revela ${this.tesoros.length} tesoro${this.tesoros.length > 1 ? "s" : ""} escondido${this.tesoros.length > 1 ? "s" : ""}! Búscalo${this.tesoros.length > 1 ? "s" : ""} en el minimapa (✨).`, 3500);
  }

  /** Posiciones para las etiquetas del Ojo. */
  datosOjo() {
    return {
      tesoros: this.tesoros.map((t) => t.malla.position),
      jefe: this.jefe ? this.jefe.raiz.position : null,
      escudo: this.escudoArriba,
      vidaJefe: this.jefe?.vida ?? 0,
    };
  }

  private todoRestaurado() {
    return !!this.zona && this.zona.sitios.every((s) => this.hechos().includes(s.id));
  }

  /** Los tipos de Bug se vuelven más variados en cada zona. */
  private tipoPara(i: number, k: number): TipoBug {
    const n = this.zona?.numero ?? 2;
    const lista: TipoBug[] = n <= 2 ? ["normal", "rapido"] : n <= 3 ? ["normal", "rapido", "escudo"] : ["normal", "rapido", "escudo", "divisor"];
    return lista[(i * 2 + k) % lista.length];
  }

  private ponerBug(sitio: string, tipo: TipoBug, donde: Vector3) {
    const d = TIPOS[tipo];
    const raiz = new TransformNode("minibug", this.c.escena);
    const cuerpo = tipo === "divisor" ? MeshBuilder.CreatePolyhedron("glitch", { type: 2, size: d.tam * 0.6 }, this.c.escena) : MeshBuilder.CreateBox("glitch", { size: d.tam }, this.c.escena);
    cuerpo.material = this.mats.get(tipo)!;
    cuerpo.parent = raiz;
    if (tipo === "escudo") {
      const anillo = MeshBuilder.CreateTorus("glitch", { diameter: d.tam * 1.7, thickness: 0.1, tessellation: 20 }, this.c.escena);
      anillo.material = this.ojoMat;
      anillo.parent = raiz;
      anillo.rotation.x = Math.PI / 2;
    }
    for (const lado of [-1, 1]) {
      const ojo = MeshBuilder.CreateSphere("glitch", { diameter: d.tam * 0.27, segments: 6 }, this.c.escena);
      ojo.material = this.ojoMat;
      ojo.parent = raiz;
      ojo.position.set(d.tam * 0.22 * lado, d.tam * 0.15, d.tam * 0.52);
    }
    raiz.position.copyFrom(donde);
    this.bugs.push({ raiz, tipo, vida: d.vida, casa: donde.clone(), sitio, golpeHasta: 0, t: Math.random() * 5 });
  }

  bugsCerca(radio = 14) {
    const p = this.c.jugador();
    return this.bugs.filter((b) => b.vida > 0 && Vector3.Distance(p, b.raiz.position) < radio).length + (this.jefe ? 1 : 0);
  }

  private guardianesVivos(s: string) {
    return this.bugs.some((b) => b.sitio === s && b.vida > 0);
  }

  sitioCercano(): SitioZona | null {
    if (!this.zona || this.jefe) return null;
    const p = this.c.jugador();
    for (const s of this.zona.sitios) {
      if (this.hechos().includes(s.id)) continue;
      if (Math.hypot(p.x - s.x, p.z - s.z) < 4.2) return s;
    }
    return null;
  }

  /** Hacia dónde apunta la flecha guía. */
  destino(): Vector3 | null {
    if (!this.zona) return null;
    if (this.jefe) return this.escudoArriba && this.runa ? this.runa.position.clone() : this.jefe.raiz.position.clone();
    const p = this.c.jugador();
    let mejor: Vector3 | null = null;
    let d = Infinity;
    for (const s of this.zona.sitios) {
      if (this.hechos().includes(s.id)) continue;
      const dd = Math.hypot(s.x - p.x, s.z - p.z);
      if (dd < d) [d, mejor] = [dd, new Vector3(s.x, 0, s.z)];
    }
    return mejor;
  }

  // ---------------------------------------------------------------------------
  // Huaraca (con disparo triple cuando ya sabes usar for)
  // ---------------------------------------------------------------------------
  disparar(adelante: Vector3) {
    if (!this.zona || this.recarga > 0 || this.enPregunta) return;
    const a = armaActual();
    this.recarga = a.recarga;
    const p = this.c.jugador();
    const golpeBug = (b: MiniBug) => {
      for (let i = 0; i < a.danio && b.vida > 0; i++) this.golpear(b);
      if (a.aturde && b.vida > 0) b.quietoHasta = this.tiempo + a.aturde;
    };
    const golpeJefe = () => {
      for (let i = 0; i < a.danio; i++) this.golpearJefe();
    };
    this.c.lanzar();
    sonido.toque();
    if (a.area) {
      golpeChampi(this.c.escena, p, a.area);
      this.c.sacudida.disparar(0.2);
      for (const b of this.bugs.filter((x) => x.vida > 0 && Vector3.Distance(p, x.raiz.position) < a.area)) golpeBug(b);
      if (this.jefe && Math.hypot(p.x - this.jefe.raiz.position.x, p.z - this.jefe.raiz.position.z) < a.area + 2) golpeJefe();
      return;
    }
    const vivos = this.bugs.filter((b) => b.vida > 0 && Vector3.Distance(p, b.raiz.position) < a.alcance).sort((x, y) => Vector3.Distance(p, x.raiz.position) - Vector3.Distance(p, y.raiz.position));
    const triple = (estado.sellos["B6 Bucle for"] ?? 0) > 0;
    const desde = p.add(new Vector3(0, 1.6, 0));
    const objetivos: (MiniBug | "jefe" | null)[] = [];
    const jefeCerca = this.jefe && Vector3.Distance(p, this.jefe.raiz.position) < Math.max(18, a.alcance);
    if (jefeCerca && (!vivos.length || Vector3.Distance(p, vivos[0].raiz.position) > 5)) objetivos.push("jefe");
    for (const b of vivos) if (objetivos.length < (triple ? 3 : 1)) objetivos.push(b);
    if (!objetivos.length) objetivos.push(null);
    if (triple && objetivos.length > 1) this.flotar(`for i in range(${objetivos.length}): ${a.icono}`);
    objetivos.forEach((o, i) => {
      const hasta = o === "jefe" ? this.jefe!.raiz.position.clone() : o ? o.raiz.position.add(new Vector3(0, 0.4, 0)) : desde.add(adelante.scale(10));
      window.setTimeout(() => lanzarProyectil(this.c.escena, desde, hasta, a, () => (o === "jefe" ? golpeJefe() : o && o.vida > 0 ? golpeBug(o) : undefined)), i * 90);
    });
  }

  private flotar(texto: string, clase = "codigo") {
    const f = document.createElement("div");
    f.className = `dano ${clase}`;
    f.textContent = texto;
    document.body.appendChild(f);
    window.setTimeout(() => f.remove(), 1300);
  }

  private golpear(b: MiniBug) {
    b.vida -= 1;
    b.golpeHasta = this.tiempo + 0.2;
    estallido(this.c.escena, b.raiz.position, ["#b388ff", "#ffffff"], 25, 4);
    sonido.kallpa();
    if (b.vida > 0) {
      if (b.tipo === "escudo") this.flotar(`vida = ${b.vida}`);
      return;
    }
    estallido(this.c.escena, b.raiz.position, [TIPOS[b.tipo].color, "#ffd166", "#ffffff"], 60, 6);
    const donde = b.raiz.position.clone();
    b.raiz.dispose();
    if (b.tipo === "divisor") {
      // Se parte en dos Bugs rápidos
      this.ponerBug(b.sitio, "rapido", donde.add(new Vector3(1, 0, 0)));
      this.ponerBug(b.sitio, "rapido", donde.add(new Vector3(-1, 0, 0)));
      this.c.aviso("✂️ ¡El Bug se dividió en dos!", 1500);
      return;
    }
    const mat = MATERIALES[Math.floor(Math.random() * MATERIALES.length)];
    estado.inventario[mat] = (estado.inventario[mat] ?? 0) + 1;
    guardar();
    this.c.aviso(`+1 ${mat} 🧱  inventario["${mat}"] = ${estado.inventario[mat]}`, 1500);
    this.pintarHud();
    if (b.sitio !== "ola" && !this.guardianesVivos(b.sitio) && !this.hechos().includes(b.sitio)) window.setTimeout(() => this.c.aviso("¡Altar despejado! Acércate y toca 📘 APRENDER.", 2800), 1600);
  }

  // ---------------------------------------------------------------------------
  // Cada cuadro
  // ---------------------------------------------------------------------------
  actualizar(dt: number, pausado: boolean) {
    if (!this.zona) return;
    this.tiempo += dt;
    this.recarga = Math.max(0, this.recarga - dt);
    const p = this.c.jugador();
    const quieto = pausado || this.enPregunta;
    for (const b of this.bugs) {
      if (b.vida <= 0) continue;
      b.t += dt;
      const r = b.raiz;
      const d = Vector3.Distance(p, r.position);
      const vel = TIPOS[b.tipo].velocidad;
      if (!quieto && !((b.quietoHasta ?? 0) > this.tiempo) && d < (b.sitio === "ola" ? 40 : 9) && d > 1.1) r.position.addInPlace(p.subtract(r.position).normalize().scale(vel * dt));
      else if (d >= 9 && b.sitio !== "ola") r.position = Vector3.Lerp(r.position, b.casa.add(new Vector3(Math.sin(b.t) * 1.2, 0, Math.cos(b.t) * 1.2)), Math.min(1, dt * 1.5));
      r.position.y = 0.7 + Math.abs(Math.sin(b.t * (b.tipo === "rapido" ? 10 : 6))) * 0.35;
      r.rotation.y = Math.atan2(p.x - r.position.x, p.z - r.position.z);
      r.scaling.setAll(this.tiempo < b.golpeHasta ? 1.3 : 1);
      if (!quieto && d < 1.4 && Math.floor(b.t / 0.9) !== Math.floor((b.t - dt) / 0.9)) this.dano(b.tipo === "escudo" ? 10 : 7);
    }
    if (!quieto) {
      if (this.vida < 100) this.vida = Math.min(100, this.vida + dt * 2);
      // Suspenso: el Bug avanza mientras queden altares
      if (!this.jefe && !this.todoRestaurado()) {
        this.amenaza -= dt;
        if (this.amenaza <= 0) this.ola();
      }
      if (this.jefe) this.actualizarJefe(dt);
    } else if (this.jefe) this.jefe.actualizar(dt, p);
    // Recoger tesoros con el Ojo abierto
    for (const t of [...this.tesoros]) {
      t.malla.rotation.y += dt * 2;
      if (!this.ojoAbierto || Math.hypot(p.x - t.malla.position.x, p.z - t.malla.position.z) > 2) continue;
      estado.tesoros.push(`${this.zona.id}:${t.i}`);
      estado.inventario.piedra = (estado.inventario.piedra ?? 0) + 2;
      guardar();
      estallido(this.c.escena, t.malla.position.add(new Vector3(0, 1.2, 0)), ["#ffd166", "#4ff0dc", "#ffffff"], 70, 5);
      sonido.tesoro();
      t.malla.dispose();
      this.tesoros.splice(this.tesoros.indexOf(t), 1);
      this.c.ganarKallpa(5);
      this.c.aviso(`✨ ¡Tesoro oculto! +5 kallpa y +2 piedra. Quedan ${this.tesoros.length} en esta zona.`, 3000);
      this.c.desbloquear("tesoro");
      this.pintarHud();
    }
    this.mapaCada -= dt;
    if (this.mapaCada <= 0) {
      this.mapaCada = 0.2;
      this.pintarMapa();
      this.pintarAmenaza();
      (document.getElementById("vida-valle") as HTMLElement).style.width = `${this.vida}%`;
    }
  }

  private dano(n: number) {
    // Si Chaski saltó o rodó a tiempo, el golpe falla
    if (esquivoElGolpe()) return;
    this.vida -= n;
    this.c.golpeado();
    this.c.sacudida.disparar(0.25);
    sonido.error();
    this.flotar(`-${n}`, "recibido");
    if (this.vida <= 0) {
      this.vida = 100;
      this.c.jugador().copyFrom(INICIO_ZONA);
      this.c.aviso("💫 ¡Los Bugs te desordenaron! Dispárales desde lejos con 🎯.", 3500);
    }
  }

  /** ¡Se acabó el tiempo! El Bug manda una ola de mini-Bugs hacia ti. */
  private ola() {
    this.amenaza = AMENAZA;
    const p = this.c.jugador();
    const tipos: TipoBug[] = ["rapido", "normal", (this.zona?.numero ?? 2) > 3 ? "divisor" : "rapido"];
    tipos.forEach((t, i) => {
      const a = (i / tipos.length) * Math.PI * 2;
      this.ponerBug("ola", t, new Vector3(Math.max(-LIMITE_ZONA, Math.min(LIMITE_ZONA, p.x + Math.sin(a) * 12)), 0, Math.max(-LIMITE_ZONA, Math.min(LIMITE_ZONA, p.z + Math.cos(a) * 12))));
    });
    alarma();
    this.c.sacudida.disparar(0.6);
    document.body.classList.add("amenaza");
    window.setTimeout(() => document.body.classList.remove("amenaza"), 3000);
    this.c.aviso("🚨 ¡El Bug Ch'aqwa avanza! ¡Una ola de Bugs viene por ti!", 3500);
  }

  private pintarAmenaza() {
    const caja = document.getElementById("amenaza")!;
    const ver = !!this.zona && !this.jefe && !this.todoRestaurado();
    caja.hidden = !ver;
    if (!ver) return;
    const s = Math.max(0, Math.ceil(this.amenaza));
    document.getElementById("amenaza-texto")!.textContent = `⏳ El Bug avanza: ${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
    (document.getElementById("amenaza-relleno") as HTMLElement).style.width = `${(this.amenaza / AMENAZA) * 100}%`;
    caja.classList.toggle("urgente", this.amenaza < 20);
  }

  // ---------------------------------------------------------------------------
  // Lecciones
  // ---------------------------------------------------------------------------
  async aprender(s: SitioZona) {
    const z = this.zona;
    if (!z || !this.mundo) return;
    if (this.guardianesVivos(s.id)) {
      this.c.aviso("🐛 Primero espanta a los mini-Bugs con tu 🎯 HUARACA.", 3000);
      return;
    }
    const ok = await jugarLeccion(s.leccion, z.guia);
    if (!ok) {
      this.c.aviso("Tu avance quedó guardado. Vuelve al altar cuando quieras.", 3000);
      return;
    }
    this.hechos().push(s.id);
    guardar();
    this.mundo.completar(s.id);
    this.mundo.restaurar(this.hechos().length / z.sitios.length);
    estallido(this.c.escena, new Vector3(s.x, 2.5, s.z), ["#ffd166", "#ffffff", "#4ff0dc"], 110, 7);
    this.c.sacudida.disparar(0.4);
    sonido.reparar();
    this.c.festejar();
    this.c.ganarKallpa(10);
    const rapido = this.amenaza > AMENAZA / 2;
    if (rapido) window.setTimeout(() => this.c.ganarKallpa(5), 600);
    this.amenaza = AMENAZA;
    const sello = estado.sellos[s.leccion.modulo] ?? 1;
    const c = tarjeta(`
      <h3 class="prologo-titulo">${s.ficha.icono} ¡${s.nombre}: restaurado!</h3>
      <p class="sello-ganado">${NOMBRE_SELLO[sello]} · <b>${s.leccion.modulo}</b>${rapido ? " · ⚡ ¡Rápido! +5" : ""}</p>
      <div class="ficha"><b>Santuario · ${s.ficha.nombre}</b><p>${s.ficha.dato}</p></div>
      <p class="explica">${z.nombre}: <b>${this.hechos().length}/${z.sitios.length}</b> · el tiempo del Bug se reinició</p>
      <button class="boton-oro" id="seguir">¡Seguir! ▸</button>`);
    await esperarBoton(c, "#seguir");
    cerrarTarjeta();
    this.pintarHud();
    this.c.alAvanzar?.(z);
    if (this.todoRestaurado() && !estado.jefes.includes(z.id)) window.setTimeout(() => this.iniciarJefe(), 400);
  }

  // ---------------------------------------------------------------------------
  // Jefe de la zona
  // ---------------------------------------------------------------------------
  private async iniciarJefe() {
    const z = this.zona;
    if (!z || this.jefe) return;
    const datos = JEFES[z.id];
    await this.c.pausa(async () => {
      const c = tarjeta(`
        <p class="enfoque-titulo">⚠️ ¡JEFE DE ZONA!</p>
        ${voz(z.guia, `¡Apareció el <b>${escapar(datos.nombre)}</b>! Su escudo solo cae con runas de esta zona: busca la <b>🔮 runa</b>, respóndela bien y luego ¡dispárale con la huaraca!`)}
        <button class="boton-oro" id="seguir">¡A pelear! ⚔️</button>`);
      await esperarBoton(c, "#seguir");
      cerrarTarjeta();
    });
    for (const b of this.bugs) if (b.sitio === "ola") b.raiz.dispose();
    this.bugs = this.bugs.filter((b) => b.sitio !== "ola");
    this.jefe = new Jefe(this.c.escena);
    this.jefe.vidaMax = 100 + z.numero * 10;
    this.jefe.aparecer(new Vector3(0, 0, 8));
    const escudoMat = new StandardMaterial("m-escudo-jefe", this.c.escena);
    escudoMat.diffuseColor = new Color3(0.6, 0.4, 1);
    escudoMat.emissiveColor = new Color3(0.35, 0.2, 0.8);
    escudoMat.alpha = 0.3;
    this.escudoJefe = MeshBuilder.CreateSphere("escudo-jefe", { diameter: 6.5, segments: 16 }, this.c.escena);
    this.escudoJefe.material = escudoMat;
    this.escudoJefe.isPickable = false;
    this.escudoArriba = true;
    this.proximoAtaque = 4;
    this.proximaOla = 12;
    this.pregunta = Math.floor(Math.random() * datos.preguntas.length);
    this.ponerRuna();
    document.getElementById("jefe-zona")!.hidden = false;
    document.getElementById("jefe-zona-nombre")!.textContent = `🐛 ${datos.nombre}`;
    document.getElementById("amenaza")!.hidden = true;
    cambiarMusica("batalla");
    ponerClima("tormenta");
    this.c.sacudida.disparar(0.8);
    sonido.pututu();
    this.pintarJefe();
  }

  private ponerRuna() {
    this.runa?.dispose();
    const r = new TransformNode("runa-jefe", this.c.escena);
    const anillo = MeshBuilder.CreateTorus("runa", { diameter: 1.8, thickness: 0.15, tessellation: 24 }, this.c.escena);
    const mat = new StandardMaterial("m-runa-jefe", this.c.escena);
    mat.emissiveColor = new Color3(0.3, 1, 0.9);
    mat.disableLighting = true;
    anillo.material = mat;
    anillo.parent = r;
    anillo.position.y = 0.2;
    const orbe = MeshBuilder.CreateSphere("runa", { diameter: 0.8, segments: 10 }, this.c.escena);
    orbe.material = mat;
    orbe.parent = r;
    orbe.position.y = 1.4;
    const a = Math.random() * Math.PI * 2;
    const d = 10 + Math.random() * 6;
    r.position.set(Math.sin(a) * d, 0, 8 + Math.cos(a) * d * 0.7);
    r.position.x = Math.max(-LIMITE_ZONA + 3, Math.min(LIMITE_ZONA - 3, r.position.x));
    r.position.z = Math.max(-LIMITE_ZONA + 3, Math.min(LIMITE_ZONA - 3, r.position.z));
    this.runa = r;
  }

  private actualizarJefe(dt: number) {
    const j = this.jefe!;
    const p = this.c.jugador();
    j.actualizar(dt, p);
    if (this.escudoJefe) {
      this.escudoJefe.position.copyFrom(j.raiz.position);
      this.escudoJefe.setEnabled(this.escudoArriba);
    }
    // El escudo vuelve a subir
    if (!this.escudoArriba && this.tiempo > this.escudoHasta) {
      this.escudoArriba = true;
      this.ponerRuna();
      this.c.aviso("🛡 ¡El escudo volvió! Busca otra 🔮 runa.", 2500);
      this.pintarJefe();
    }
    if (this.runa) {
      this.runa.rotation.y += dt * 2;
      this.runa.setEnabled(this.escudoArriba);
      if (this.escudoArriba && Math.hypot(p.x - this.runa.position.x, p.z - this.runa.position.z) < 1.8) void this.responderRuna();
    }
    // Ataques: círculos rojos y refuerzos
    this.proximoAtaque -= dt;
    if (this.proximoAtaque <= 0) {
      this.proximoAtaque = j.vida < j.vidaMax / 2 ? 3 : 4.2;
      const disco = MeshBuilder.CreateDisc("alerta", { radius: 2.6, tessellation: 32 }, this.c.escena);
      const m = new StandardMaterial("m-alerta-z", this.c.escena);
      m.emissiveColor = new Color3(0.95, 0.1, 0.15);
      m.alpha = 0.45;
      m.disableLighting = true;
      disco.material = m;
      disco.rotation.x = Math.PI / 2;
      disco.position.set(p.x, 0.08, p.z);
      this.alertas.push({ malla: disco, t: 0, donde: p.clone() });
      sonido.ojo(true);
    }
    for (const a of [...this.alertas]) {
      a.t += dt;
      a.malla.scaling.setAll(0.3 + Math.min(1, a.t / 1.7) * 0.7);
      if (a.t >= 1.7) {
        a.malla.dispose();
        this.alertas.splice(this.alertas.indexOf(a), 1);
        estallido(this.c.escena, a.donde.add(new Vector3(0, 0.5, 0)), ["#ff3355", "#8b3dff"], 50, 7);
        this.c.sacudida.disparar(0.3);
        if (Math.hypot(p.x - a.donde.x, p.z - a.donde.z) < 2.6) this.dano(15);
      }
    }
    this.proximaOla -= dt;
    if (this.proximaOla <= 0) {
      this.proximaOla = 14;
      const o = j.raiz.position;
      this.ponerBug("ola", "rapido", new Vector3(o.x + 3, 0, o.z - 2));
      this.ponerBug("ola", (this.zona?.numero ?? 2) > 3 ? "divisor" : "rapido", new Vector3(o.x - 3, 0, o.z - 2));
    }
  }

  private async responderRuna() {
    if (this.enPregunta || !this.zona) return;
    this.enPregunta = true;
    const datos = JEFES[this.zona.id];
    const [codigo, pregunta, correcta, malas, explica] = datos.preguntas[this.pregunta % datos.preguntas.length];
    this.pregunta++;
    musicaSuave(true);
    const opciones = [correcta, ...malas].map((v) => [Math.random(), v] as const).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
    const c = tarjeta(`
      <p class="enfoque-titulo">🔮 RUNA DEL ESCUDO</p>
      ${codigo ? `<pre class="codigo-mini">${escapar(codigo)}</pre>` : ""}
      <p>${escapar(pregunta)}</p>
      <div class="prologo-opciones">${opciones.map((o) => `<button class="opcion" data-v="${escapar(o)}"><code>${escapar(o)}</code></button>`).join("")}</div>`);
    const elegido = await new Promise<string>((r) => c.querySelectorAll<HTMLButtonElement>(".opcion").forEach((b) => b.addEventListener("click", () => r(b.dataset.v!))));
    cerrarTarjeta();
    musicaSuave(false);
    if (elegido === correcta) {
      sonido.acierto();
      this.escudoArriba = false;
      this.escudoHasta = this.tiempo + 10;
      if (this.escudoJefe) estallido(this.c.escena, this.escudoJefe.position, ["#b388ff", "#ffffff"], 100, 9);
      this.c.aviso("💥 ¡Escudo roto! Tienes 10 segundos: ¡dispárale con la 🎯 huaraca!", 3000);
    } else {
      sonido.error();
      this.c.aviso(`❌ ${explica} La runa se movió.`, 4500);
      this.ponerRuna();
    }
    this.pintarJefe();
    window.setTimeout(() => (this.enPregunta = false), 300);
  }

  private golpearJefe() {
    const j = this.jefe;
    if (!j) return;
    if (this.escudoArriba) {
      this.flotar("🛡 ¡Escudo!", "codigo");
      this.c.aviso("Primero rompe el escudo: busca la 🔮 runa (sigue la flecha).", 2200);
      return;
    }
    j.vida -= 8;
    j.golpear();
    estallido(this.c.escena, j.raiz.position, ["#ffd166", "#ffffff", "#7b3dff"], 50, 6);
    sonido.kallpa();
    this.flotar("-8", "");
    this.pintarJefe();
    if (j.vida <= 0) void this.vencerJefe();
  }

  private async vencerJefe() {
    const z = this.zona;
    const j = this.jefe;
    if (!z || !j) return;
    for (let i = 0; i < 4; i++) {
      window.setTimeout(() => {
        estallido(this.c.escena, j.raiz.position.add(new Vector3((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 3)), ["#b388ff", "#ffd166", "#ffffff"], 120, 9);
        this.c.sacudida.disparar(0.7);
        sonido.reparar();
      }, i * 260);
    }
    estado.jefes.push(z.id);
    guardar();
    this.c.desbloquear("jefe-zona");
    this.c.ganarKallpa(25);
    window.setTimeout(() => {
      this.terminarJefe(true);
      this.c.festejar();
      this.c.alTerminar(z);
    }, 1300);
  }

  private terminarJefe(gano: boolean) {
    this.jefe?.raiz.dispose(false, true);
    this.jefe = null;
    this.escudoJefe?.dispose();
    this.escudoJefe = null;
    this.runa?.dispose();
    this.runa = null;
    for (const a of this.alertas) a.malla.dispose();
    this.alertas = [];
    this.enPregunta = false;
    document.getElementById("jefe-zona")!.hidden = true;
    ponerClima("sol");
    if (gano && this.zona) cambiarMusica(MUSICA_ZONA[this.zona.id] ?? "andes");
  }

  private pintarJefe() {
    const j = this.jefe;
    if (!j) return;
    (document.getElementById("jefe-zona-vida") as HTMLElement).style.width = `${Math.max(0, (j.vida / j.vidaMax) * 100)}%`;
    document.getElementById("jefe-zona-estado")!.textContent = this.escudoArriba ? `🛡 escudo = True · vida = ${Math.max(0, j.vida)}` : `💥 escudo = False · vida = ${Math.max(0, j.vida)}`;
  }

  // ---------------------------------------------------------------------------
  // HUD
  // ---------------------------------------------------------------------------
  pintarHud() {
    if (!this.zona) return;
    document.getElementById("valle-progreso")!.textContent = `${this.hechos().length}/${this.zona.sitios.length}`;
    const inv = Object.entries(estado.inventario)
      .filter(([, n]) => n > 0)
      .map(([k, n]) => `"${k}": ${n}`)
      .join(", ");
    document.getElementById("valle-inventario")!.textContent = `inventario = {${inv}}`;
  }

  private pintarMapa() {
    const lienzo = document.getElementById("mapa") as HTMLCanvasElement | null;
    if (!lienzo || !this.zona) return;
    const ctx = lienzo.getContext("2d")!;
    const W = lienzo.width;
    const escala = W / 2 / (LIMITE_ZONA + 4);
    const aMapa = (x: number, z: number) => [W / 2 + x * escala, W / 2 - z * escala] as const;
    ctx.clearRect(0, 0, W, W);
    ctx.fillStyle = "rgba(20, 40, 24, .85)";
    ctx.beginPath();
    ctx.arc(W / 2, W / 2, W / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = this.jefe ? "#ff3355" : "#4a8a3a";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = `${Math.round(W / 9)}px system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const s of this.zona.sitios) {
      const [x, y] = aMapa(s.x, s.z);
      ctx.fillText(this.hechos().includes(s.id) ? "✅" : s.icono, x, y);
    }
    if (this.jefe) {
      const [x, y] = aMapa(this.jefe.raiz.position.x, this.jefe.raiz.position.z);
      ctx.fillText("🐛", x, y);
    }
    if (this.ojoAbierto) {
      for (const t of this.tesoros) {
        const [x, y] = aMapa(t.malla.position.x, t.malla.position.z);
        ctx.fillText("✨", x, y);
      }
    }
    if (this.runa && this.escudoArriba) {
      const [x, y] = aMapa(this.runa.position.x, this.runa.position.z);
      ctx.fillText("🔮", x, y);
    }
    ctx.fillStyle = "#ff3355";
    for (const b of this.bugs) {
      if (b.vida <= 0) continue;
      const [x, y] = aMapa(b.raiz.position.x, b.raiz.position.z);
      ctx.fillRect(x - 2, y - 2, 4, 4);
    }
    const p = this.c.jugador();
    const [px, py] = aMapa(p.x, p.z);
    ctx.fillStyle = "#ffd166";
    ctx.strokeStyle = "#000";
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}
