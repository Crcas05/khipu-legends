// Jugabilidad de las zonas del viaje: mini-Bugs con la huaraca, lecciones en los
// altares, fichas culturales, progreso guardado y minimapa.

import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Zona, SitioZona } from "./datos/zonas";
import { crearZonaMundo, INICIO_ZONA, LIMITE_ZONA } from "./zonaMundo";
import { jugarLeccion, NOMBRE_SELLO } from "./ui/leccion";
import { tarjeta, esperarBoton, cerrarTarjeta } from "./ui/prologo";
import { estado, guardar } from "./estado";
import { estallido, Sacudida } from "./efectos";
import { sonido } from "./sonido";

const MATERIALES = ["piedra", "ichu", "adobe"];

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
}

interface MiniBug {
  raiz: TransformNode;
  vida: number;
  casa: Vector3;
  sitio: string;
  golpeHasta: number;
  t: number;
}

export function zonaCompleta(z: Zona) {
  const hechos = estado.zonas[z.id] ?? [];
  return z.sitios.every((s) => hechos.includes(s.id));
}

export class ZonaJuego {
  zona: Zona | null = null;
  mundo: ReturnType<typeof crearZonaMundo> | null = null;
  vida = 100;
  private bugs: MiniBug[] = [];
  private tiempo = 0;
  private recarga = 0;
  private mapaCada = 0;
  private bugMat: StandardMaterial;
  private ojoMat: StandardMaterial;

  constructor(private c: Contexto) {
    this.bugMat = new StandardMaterial("m-minibug-z", c.escena);
    this.bugMat.diffuseColor = Color3.FromHexString("#8b3dff");
    this.bugMat.emissiveColor = Color3.FromHexString("#4a14b0");
    this.ojoMat = new StandardMaterial("m-minibug-ojo-z", c.escena);
    this.ojoMat.emissiveColor = new Color3(1, 1, 1);
    this.ojoMat.disableLighting = true;
  }

  get activa() {
    return this.zona !== null;
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
    for (const s of this.hechos()) this.mundo.completar(s);
    this.mundo.restaurar(this.hechos().length / z.sitios.length);
    for (const s of z.sitios) if (!this.hechos().includes(s.id)) this.ponerGuardianes(s, 2);
    document.getElementById("hud-valle")!.hidden = false;
    document.body.classList.add("en-valle");
    this.pintarHud();
  }

  salir() {
    for (const b of this.bugs) b.raiz.dispose();
    this.bugs = [];
    this.mundo?.dispose();
    this.mundo = null;
    this.zona = null;
  }

  private ponerGuardianes(s: SitioZona, n: number) {
    for (let i = 0; i < n; i++) {
      const raiz = new TransformNode("minibug", this.c.escena);
      const cuerpo = MeshBuilder.CreateBox("glitch", { size: 0.8 }, this.c.escena);
      cuerpo.material = this.bugMat;
      cuerpo.parent = raiz;
      for (const lado of [-1, 1]) {
        const ojo = MeshBuilder.CreateSphere("glitch", { diameter: 0.22, segments: 6 }, this.c.escena);
        ojo.material = this.ojoMat;
        ojo.parent = raiz;
        ojo.position.set(0.18 * lado, 0.12, 0.41);
      }
      const a = (i / n) * Math.PI * 2 + 0.6;
      const casa = new Vector3(s.x + Math.sin(a) * 4, 0, s.z + Math.cos(a) * 4);
      raiz.position.copyFrom(casa);
      this.bugs.push({ raiz, vida: 2, casa, sitio: s.id, golpeHasta: 0, t: Math.random() * 5 });
    }
  }

  bugsCerca(radio = 14) {
    const p = this.c.jugador();
    return this.bugs.filter((b) => b.vida > 0 && Vector3.Distance(p, b.raiz.position) < radio).length;
  }

  private guardianesVivos(s: string) {
    return this.bugs.some((b) => b.sitio === s && b.vida > 0);
  }

  sitioCercano(): SitioZona | null {
    if (!this.zona) return null;
    const p = this.c.jugador();
    for (const s of this.zona.sitios) {
      if (this.hechos().includes(s.id)) continue;
      if (Math.hypot(p.x - s.x, p.z - s.z) < 4.2) return s;
    }
    return null;
  }

  /** Lugar pendiente más cercano (para la flecha guía). */
  destino(): Vector3 | null {
    if (!this.zona) return null;
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
  // Huaraca
  // ---------------------------------------------------------------------------
  disparar(adelante: Vector3) {
    if (!this.zona || this.recarga > 0) return;
    this.recarga = 0.45;
    const p = this.c.jugador();
    let objetivo: MiniBug | null = null;
    let mejor = 14;
    for (const b of this.bugs) {
      if (b.vida <= 0) continue;
      const d = Vector3.Distance(p, b.raiz.position);
      if (d < mejor) [mejor, objetivo] = [d, b];
    }
    this.c.lanzar();
    sonido.toque();
    const desde = p.add(new Vector3(0, 1.6, 0));
    const hasta = objetivo ? objetivo.raiz.position.add(new Vector3(0, 0.4, 0)) : desde.add(adelante.scale(10));
    const piedra = MeshBuilder.CreateSphere("huaraca", { diameter: 0.3, segments: 6 }, this.c.escena);
    piedra.material = this.ojoMat;
    let t = 0;
    const dur = Math.max(0.15, Vector3.Distance(desde, hasta) / 30);
    const obs = this.c.escena.onBeforeRenderObservable.add(() => {
      t += this.c.escena.getEngine().getDeltaTime() / 1000 / dur;
      const k = Math.min(1, t);
      piedra.position = Vector3.Lerp(desde, hasta, k).add(new Vector3(0, Math.sin(k * Math.PI) * 1.2, 0));
      if (k >= 1) {
        this.c.escena.onBeforeRenderObservable.remove(obs);
        piedra.dispose();
        if (objetivo && objetivo.vida > 0) this.golpear(objetivo);
      }
    });
  }

  private golpear(b: MiniBug) {
    b.vida -= 1;
    b.golpeHasta = this.tiempo + 0.2;
    estallido(this.c.escena, b.raiz.position, ["#b388ff", "#ffffff"], 25, 4);
    sonido.kallpa();
    if (b.vida > 0) return;
    estallido(this.c.escena, b.raiz.position, ["#b388ff", "#8b3dff", "#ffd166"], 60, 6);
    b.raiz.dispose();
    const mat = MATERIALES[Math.floor(Math.random() * MATERIALES.length)];
    estado.inventario[mat] = (estado.inventario[mat] ?? 0) + 1;
    guardar();
    this.c.aviso(`+1 ${mat} 🧱  inventario["${mat}"] = ${estado.inventario[mat]}`, 1800);
    this.pintarHud();
    if (!this.guardianesVivos(b.sitio)) window.setTimeout(() => this.c.aviso("¡Altar despejado! Acércate y toca 🔧 APRENDER.", 2800), 1900);
  }

  actualizar(dt: number, pausado: boolean) {
    if (!this.zona) return;
    this.tiempo += dt;
    this.recarga = Math.max(0, this.recarga - dt);
    const p = this.c.jugador();
    for (const b of this.bugs) {
      if (b.vida <= 0) continue;
      b.t += dt;
      const r = b.raiz;
      const d = Vector3.Distance(p, r.position);
      if (!pausado && d < 9 && d > 1.1) r.position.addInPlace(p.subtract(r.position).normalize().scale(2.4 * dt));
      else if (d >= 9) r.position = Vector3.Lerp(r.position, b.casa.add(new Vector3(Math.sin(b.t) * 1.2, 0, Math.cos(b.t) * 1.2)), Math.min(1, dt * 1.5));
      r.position.y = 0.7 + Math.abs(Math.sin(b.t * 6)) * 0.35;
      r.rotation.y = Math.atan2(p.x - r.position.x, p.z - r.position.z);
      r.scaling.setAll(this.tiempo < b.golpeHasta ? 1.3 : 1);
      if (!pausado && d < 1.4 && Math.floor(b.t / 0.9) !== Math.floor((b.t - dt) / 0.9)) {
        this.vida -= 7;
        this.c.golpeado();
        this.c.sacudida.disparar(0.25);
        sonido.error();
        if (this.vida <= 0) {
          this.vida = 100;
          p.copyFrom(INICIO_ZONA);
          this.c.aviso("💫 ¡Los mini-Bugs te desordenaron! Dispárales desde lejos con 🎯.", 3500);
        }
      }
    }
    if (this.vida < 100 && !pausado) this.vida = Math.min(100, this.vida + dt * 2);
    this.mapaCada -= dt;
    if (this.mapaCada <= 0) {
      this.mapaCada = 0.2;
      this.pintarMapa();
      (document.getElementById("vida-valle") as HTMLElement).style.width = `${this.vida}%`;
    }
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
    const sello = estado.sellos[s.leccion.modulo] ?? 1;
    const c = tarjeta(`
      <h3 class="prologo-titulo">${s.ficha.icono} ¡${s.nombre} restaurado!</h3>
      <p class="sello-ganado">${NOMBRE_SELLO[sello]} · <b>${s.leccion.modulo}</b></p>
      <div class="ficha"><b>Santuario · ${s.ficha.nombre}</b><p>${s.ficha.dato}</p></div>
      <p class="explica">${z.nombre}: <b>${this.hechos().length}/${z.sitios.length}</b></p>
      <button class="boton-oro" id="seguir">¡Seguir! ▸</button>`);
    await esperarBoton(c, "#seguir");
    cerrarTarjeta();
    this.pintarHud();
    this.c.alAvanzar?.(z);
    if (zonaCompleta(z)) window.setTimeout(() => this.c.alTerminar(z), 80);
  }

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
    ctx.strokeStyle = "#4a8a3a";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = `${Math.round(W / 9)}px system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const s of this.zona.sitios) {
      const [x, y] = aMapa(s.x, s.z);
      ctx.fillText(this.hechos().includes(s.id) ? "✅" : s.icono, x, y);
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
