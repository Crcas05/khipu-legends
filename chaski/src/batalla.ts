// La batalla contra el Bug Ch'aqwa. Cartas Q/W/E/R: cada carta es código.
// Q: tu función rayo() (el daño lo calcula Python con TU código). W: escudo = True.
// E: ecos con for/range. R: bloqueada (Misión 3). Antes de lanzar, "modo enfoque":
// una predicción rápida; si aciertas, golpe crítico. Esquivar: sal del círculo rojo.

import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { estallido, Sacudida } from "./efectos";
import { python } from "./python/python";
import { estado } from "./estado";
import { sonido, musicaSuave } from "./sonido";

const escapar = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const mezclar = <T,>(a: T[]) => a.map((v) => [Math.random(), v] as const).sort((x, y) => x[0] - y[0]).map((x) => x[1]);

// ---------------------------------------------------------------------------
// El jefe: un cúmulo de código corrupto con ojos
// ---------------------------------------------------------------------------
export class Jefe {
  raiz: TransformNode;
  mallas: Mesh[] = [];
  private nucleo: Mesh;
  private orbitales: Mesh[] = [];
  private alas: { m: Mesh; lado: number }[] = [];
  private t = 0;
  private destello = 0;
  vidaMax = 120;
  vida = 120;

  constructor(escena: Scene) {
    this.raiz = new TransformNode("jefe", escena);
    const morado = new StandardMaterial("m-jefe", escena);
    morado.diffuseColor = Color3.FromHexString("#6a2bbf");
    morado.emissiveColor = Color3.FromHexString("#3d0f8f");
    morado.specularColor = new Color3(0.4, 0.4, 0.4);
    const claro = new StandardMaterial("m-jefe2", escena);
    claro.diffuseColor = Color3.FromHexString("#b388ff");
    claro.emissiveColor = Color3.FromHexString("#7b3dff");
    const blanco = new StandardMaterial("m-jefe-ojo", escena);
    blanco.emissiveColor = new Color3(1, 1, 1);
    blanco.disableLighting = true;
    const rojo = new StandardMaterial("m-jefe-pupila", escena);
    rojo.emissiveColor = new Color3(1, 0.1, 0.2);
    rojo.disableLighting = true;
    const m = (mesh: Mesh, mat: StandardMaterial) => {
      mesh.parent = this.raiz;
      mesh.material = mat;
      this.mallas.push(mesh);
      return mesh;
    };
    // El jefe ya no es un cubo: es un gran escarabajo volador corrompido (cuerpo acorazado, alas que
    // zumban, mandíbulas) rodeado de fragmentos de código roto que giran.
    this.nucleo = m(MeshBuilder.CreateSphere("jefe-nucleo", { diameter: 2.2, segments: 18 }, escena), morado);
    this.nucleo.scaling.set(1, 0.8, 1.35);
    const cabeza = m(MeshBuilder.CreateSphere("jefe-cabeza", { diameter: 1.3, segments: 14 }, escena), claro);
    cabeza.position.set(0, 0.15, 1.35);
    for (const lado of [-1, 1]) {
      const mand = m(MeshBuilder.CreateCylinder("jefe-mandibula", { height: 0.9, diameterTop: 0.02, diameterBottom: 0.25, tessellation: 6 }, escena), morado);
      mand.position.set(0.35 * lado, -0.25, 1.95);
      mand.rotation.set(1.4, 0, -0.5 * lado);
      const antena = m(MeshBuilder.CreateCylinder("jefe-antena", { height: 1.4, diameterTop: 0.02, diameterBottom: 0.07, tessellation: 5 }, escena), claro);
      antena.position.set(0.3 * lado, 0.85, 1.7);
      antena.rotation.set(0.6, 0, -0.45 * lado);
      for (let k = 0; k < 3; k++) {
        const pata = m(MeshBuilder.CreateCylinder("jefe-pata", { height: 1.3, diameterTop: 0.12, diameterBottom: 0.04, tessellation: 6 }, escena), morado);
        pata.position.set(0.85 * lado, -0.75, 0.6 - k * 0.6);
        pata.rotation.z = lado * 0.5;
      }
    }
    // Alas: dos pares translúcidos que zumban
    const alaMat = claro.clone("m-jefe-ala");
    alaMat.alpha = 0.55;
    alaMat.backFaceCulling = false;
    for (const lado of [-1, 1])
      for (const k of [0, 1]) {
        const ala = m(MeshBuilder.CreateDisc("jefe-ala", { radius: 1.5 - k * 0.35, tessellation: 18 }, escena), alaMat);
        ala.scaling.set(1.6, 0.6, 1);
        ala.setPivotPoint(new Vector3(-1.4 * lado, 0, 0));
        ala.position.set(1.4 * lado + 0.2 * lado, 0.85, -0.2 - k * 0.7);
        ala.rotation.x = Math.PI / 2;
        this.alas.push({ m: ala, lado });
      }
    // Fragmentos de código roto (esquirlas triangulares brillantes)
    for (let i = 0; i < 12; i++) {
      const frag = m(MeshBuilder.CreateDisc("jefe-pieza", { radius: 0.3 + (i % 3) * 0.1, tessellation: 3 }, escena), i % 2 ? claro : morado);
      (frag.material as StandardMaterial).backFaceCulling = false;
      this.orbitales.push(frag);
    }
    for (const lado of [-1, 1]) {
      m(MeshBuilder.CreateSphere("jefe-ojo", { diameter: 0.55, segments: 10 }, escena), blanco).position.set(0.42 * lado, 0.3, 1.85);
      m(MeshBuilder.CreateSphere("jefe-pupila", { diameter: 0.26, segments: 8 }, escena), rojo).position.set(0.42 * lado, 0.28, 2.06);
    }
    this.raiz.setEnabled(false);
  }

  aparecer(donde: Vector3) {
    this.raiz.position.copyFrom(donde);
    this.raiz.setEnabled(true);
    this.vida = this.vidaMax;
  }

  golpear() {
    this.destello = 0.25;
  }

  actualizar(dt: number, mirar: Vector3) {
    this.t += dt;
    const base = this.raiz.position;
    base.y = 2.6 + Math.sin(this.t * 2) * 0.35;
    this.raiz.rotation.y = Math.atan2(mirar.x - base.x, mirar.z - base.z);
    this.nucleo.rotation.set(Math.sin(this.t) * 0.08, 0, Math.cos(this.t * 0.8) * 0.06);
    for (const a of this.alas) a.m.rotation.z = Math.sin(this.t * 34) * 0.45 * a.lado;
    const furia = this.vida < this.vidaMax / 2 ? 1.8 : 1;
    this.orbitales.forEach((o, i) => {
      const a = this.t * (1.2 + (i % 4) * 0.3) * furia + i;
      const r = 2 + (i % 3) * 0.5;
      o.position.set(Math.sin(a) * r, Math.sin(this.t * 3 + i) * 1.1, Math.cos(a) * r);
      o.rotation.set(this.t * 2 + i, this.t + i, 0);
    });
    if (this.destello > 0) {
      this.destello -= dt;
      this.raiz.scaling.setAll(1 + Math.sin(this.destello * 60) * 0.08);
    } else this.raiz.scaling.setAll(1);
  }
}

// ---------------------------------------------------------------------------
// La batalla
// ---------------------------------------------------------------------------
interface Contexto {
  escena: Scene;
  jefe: Jefe;
  jugador: () => Vector3;
  escudo: (activo: boolean) => void;
  festejar: () => void;
  sacudida: Sacudida;
  ecos: (n: number) => Promise<Vector3[]>;
  aviso: (t: string, ms?: number) => void;
  animar: (a: "lanzar" | "golpe") => void;
}

type Carta = "q" | "w" | "e" | "r";

export class Batalla {
  activa = false;
  private pausa = false;
  private vida = 100;
  private escudoHasta = 0;
  private enfriamiento: Record<Carta, number> = { q: 0, w: 0, e: 0, r: 0 };
  private proximoAtaque = 3;
  private alertas: { malla: Mesh; t: number; dur: number; donde: Vector3 }[] = [];
  private terminar: () => void = () => {};
  private alerta: StandardMaterial;
  private tiempo = 0;
  private corrupta = false;
  private yaCorrompio = false;

  constructor(private c: Contexto) {
    this.alerta = new StandardMaterial("m-alerta", c.escena);
    this.alerta.diffuseColor = new Color3(1, 0.1, 0.15);
    this.alerta.emissiveColor = new Color3(0.9, 0.05, 0.1);
    this.alerta.alpha = 0.45;
    this.alerta.disableLighting = true;
  }

  /** Empieza la batalla. Termina (resuelve) cuando el jefe cae. */
  iniciar(): Promise<void> {
    this.activa = true;
    this.vida = 100;
    this.c.jefe.vida = this.c.jefe.vidaMax;
    this.proximoAtaque = 3;
    this.corrupta = false;
    this.yaCorrompio = false;
    this.pintarHud();
    document.getElementById("batalla")!.hidden = false;
    document.body.classList.add("en-batalla");
    document.querySelectorAll<HTMLButtonElement>("#batalla [data-carta]").forEach((b) => {
      b.onclick = () => this.usar(b.dataset.carta as Carta);
    });
    window.addEventListener("keydown", this.teclas);
    return new Promise((r) => (this.terminar = r));
  }

  private teclas = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (["q", "w", "e", "r"].includes(k) && this.activa && !this.pausa) this.usar(k as Carta);
  };

  private pintarHud() {
    const j = this.c.jefe;
    (document.getElementById("jefe-vida") as HTMLElement).style.width = `${Math.max(0, (j.vida / j.vidaMax) * 100)}%`;
    document.getElementById("jefe-numero")!.textContent = `vida = ${Math.max(0, Math.round(j.vida))}`;
    (document.getElementById("jugador-vida") as HTMLElement).style.width = `${Math.max(0, this.vida)}%`;
    document.getElementById("jugador-numero")!.textContent = `${estado.nombre || "Chaski"}: vida = ${Math.max(0, this.vida)}`;
    const ahora = this.tiempo;
    document.querySelectorAll<HTMLButtonElement>("#batalla [data-carta]").forEach((b) => {
      const k = b.dataset.carta as Carta;
      const falta = Math.max(0, this.enfriamiento[k] - ahora);
      b.classList.toggle("enfriando", falta > 0);
      b.style.setProperty("--carga", `${falta > 0 ? 100 - (falta / ({ q: 2.5, w: 9, e: 12, r: 1 }[k])) * 100 : 100}%`);
    });
  }

  private flotante(texto: string, clase = "") {
    const f = document.createElement("div");
    f.className = `dano ${clase}`;
    f.textContent = texto;
    document.getElementById("batalla")!.appendChild(f);
    window.setTimeout(() => f.remove(), 1300);
  }

  /** Pregunta rápida de "modo enfoque" (el tiempo se detiene). */
  private enfoque(codigo: string, pregunta: string, opciones: string[], correcta: string, explicacion: string): Promise<boolean> {
    this.pausa = true;
    musicaSuave(true);
    const caja = document.getElementById("enfoque")!;
    caja.innerHTML = `
      <div class="enfoque-tarjeta">
        <p class="enfoque-titulo">⏸ MODO ENFOQUE</p>
        <pre class="codigo-mini">${escapar(codigo)}</pre>
        <p>${pregunta}</p>
        <div class="prologo-opciones">${mezclar(opciones).map((o) => `<button class="opcion" data-v="${escapar(o)}"><code>${escapar(o)}</code></button>`).join("")}</div>
      </div>`;
    caja.hidden = false;
    return new Promise((r) =>
      caja.querySelectorAll<HTMLButtonElement>(".opcion").forEach((b) =>
        b.addEventListener("click", () => {
          const ok = b.dataset.v === correcta;
          if (ok) sonido.acierto();
          else {
            sonido.error();
            this.c.aviso(explicacion, 3500);
          }
          caja.hidden = true;
          this.pausa = false;
          musicaSuave(false);
          r(ok);
        })
      )
    );
  }

  /** Ejecuta la función rayo del jugador en Python de verdad. */
  private async rayo(fuerza: number): Promise<number> {
    const codigo = estado.runas.rayo ?? "def rayo(fuerza):\n    return fuerza * 2\n";
    try {
      const res = await python.ejecutar(`${codigo}\nprint('§', rayo(${fuerza}))`);
      const linea = res.salida.join("\n").split("\n").find((l) => l.startsWith("§"));
      const valor = Number(linea?.split(" ")[1]);
      return Number.isFinite(valor) ? valor : fuerza * 2;
    } catch {
      return fuerza * 2;
    }
  }

  private danar(cantidad: number, critico: boolean) {
    const j = this.c.jefe;
    const total = Math.round(cantidad * (critico ? 1.5 : 1));
    j.vida -= total;
    j.golpear();
    this.c.sacudida.disparar(critico ? 0.5 : 0.25);
    estallido(this.c.escena, j.raiz.position, critico ? ["#ffd166", "#ffffff", "#f5a623"] : ["#b388ff", "#ffffff", "#7b3dff"], critico ? 90 : 50, 6);
    sonido.kallpa();
    this.flotante(`-${total}${critico ? " ¡CRÍTICO!" : ""}`, critico ? "critico" : "");
    this.pintarHud();
    if (j.vida <= 0) this.ganar();
    else if (!this.yaCorrompio && j.vida <= j.vidaMax / 2) {
      this.yaCorrompio = true;
      this.corrupta = true;
      document.querySelector('#batalla [data-carta="q"]')?.classList.add("corrupta");
      window.setTimeout(() => this.depurar(), 500);
    }
  }

  /** Mecánica "enemigos que son errores": el Bug rompe tu runa y debes encontrar el error. */
  private async depurar() {
    if (!this.activa) return;
    this.c.sacudida.disparar(0.6);
    sonido.error();
    const errores = [
      { codigo: "def rayo(fuerza)\n    return fuerza * 2", bien: "Falta : al final de def", mal: ["fuerza va entre comillas", "Falta print()"], explica: "Toda línea def termina en dos puntos: def rayo(fuerza):" },
      { codigo: "def rayo(fuerza):\nreturn fuerza * 2", bien: "Falta la sangría en return", mal: ["Falta : al final", "return va en mayúsculas"], explica: "Lo que va dentro de la función necesita 4 espacios de sangría." },
      { codigo: "def rayo(fuerza):\n    return fuerza * dos", bien: "dos no existe: debe ser 2", mal: ["Falta : al final", "rayo va entre comillas"], explica: "Python no conoce «dos». Los números se escriben con dígitos: 2." },
    ];
    const e = errores[Math.floor(Math.random() * errores.length)];
    for (;;) {
      const ok = await this.enfoque(e.codigo, "🐛 <b>¡El Bug corrompió tu runa!</b> Tu carta Q no funciona. ¿Cuál es el error?", [e.bien, ...e.mal], e.bien, e.explica);
      if (ok || !this.activa) break;
    }
    this.corrupta = false;
    document.querySelector('#batalla [data-carta="q"]')?.classList.remove("corrupta");
    this.flotante("¡Runa reparada!", "codigo");
    estallido(this.c.escena, this.c.jugador().add(new Vector3(0, 2, 0)), ["#4ff0dc", "#ffffff"], 60, 5);
  }

  private async usar(carta: Carta) {
    if (!this.activa || this.pausa) return;
    if (this.enfriamiento[carta] > this.tiempo) return;
    sonido.toque();
    if (carta === "r") {
      this.c.aviso("🔒 Pututu se desbloquea en la Misión 3 (funciones con varios parámetros).", 3000);
      return;
    }
    if (carta === "w") {
      this.enfriamiento.w = this.tiempo + 9;
      this.escudoHasta = this.tiempo + 4;
      this.c.escudo(true);
      this.flotante("escudo = True", "codigo");
      return;
    }
    if (carta === "q") {
      if (this.corrupta) {
        this.c.aviso("🐛 Tu runa está corrupta. ¡Arréglala primero!", 2000);
        return;
      }
      this.enfriamiento.q = this.tiempo + 2.5;
      const fuerza = [5, 10, 15, 20][Math.floor(Math.random() * 4)];
      const real = await this.rayo(fuerza);
      const ok = await this.enfoque(
        `daño = rayo(${fuerza})`,
        "¿Cuánto daño hará tu runa? Acierta y será <b>crítico</b>.",
        [String(real), String(fuerza), String(real + 2)].filter((v, i, a) => a.indexOf(v) === i),
        String(real),
        `Tu rayo devuelve fuerza * 2: rayo(${fuerza}) = ${real}.`
      );
      if (!this.activa) return;
      await this.proyectil();
      this.danar(real, ok);
      return;
    }
    if (carta === "e") {
      this.enfriamiento.e = this.tiempo + 12;
      const n = 2 + Math.floor(Math.random() * 3);
      const ok = await this.enfoque(
        `for i in range(${n}):\n    rayo(5)`,
        "¿Cuántos rayos lanzarán tus ecos?",
        [String(n), String(n + 1), String(n - 1)],
        String(n),
        `range(${n}) repite ${n} veces: i toma los valores ${Array.from({ length: n }, (_, i) => i).join(", ")}.`
      );
      if (!this.activa) return;
      await this.c.ecos(n);
      const golpe = await this.rayo(5);
      for (let i = 0; i < n; i++) {
        await new Promise((r) => window.setTimeout(r, 260));
        if (!this.activa) return;
        await this.proyectil();
        this.danar(golpe, ok);
      }
    }
  }

  /** Un orbe de luz viaja de Chaski al jefe. */
  private proyectil(): Promise<void> {
    this.c.animar("lanzar");
    const orbe = MeshBuilder.CreateSphere("rayo", { diameter: 0.6, segments: 8 }, this.c.escena);
    const mat = new StandardMaterial("m-rayo", this.c.escena);
    mat.emissiveColor = new Color3(1, 0.85, 0.3);
    mat.disableLighting = true;
    orbe.material = mat;
    const desde = this.c.jugador().add(new Vector3(0, 1.6, 0));
    const hasta = this.c.jefe.raiz.position.clone();
    let t = 0;
    return new Promise((r) => {
      const obs = this.c.escena.onBeforeRenderObservable.add(() => {
        t += this.c.escena.getEngine().getDeltaTime() / 1000 / 0.28;
        orbe.position = Vector3.Lerp(desde, hasta, Math.min(1, t));
        if (t >= 1) {
          this.c.escena.onBeforeRenderObservable.remove(obs);
          orbe.dispose();
          mat.dispose();
          r();
        }
      });
    });
  }

  /** Se llama cada cuadro desde el bucle principal. */
  actualizar(dt: number) {
    if (!this.activa) return;
    this.c.jefe.actualizar(dt, this.c.jugador());
    if (this.pausa) return;
    this.tiempo += dt;
    if (this.escudoHasta && this.tiempo > this.escudoHasta) {
      this.escudoHasta = 0;
      this.c.escudo(false);
    }
    // Ataque del jefe: marca el suelo en rojo y luego golpea
    this.proximoAtaque -= dt;
    if (this.proximoAtaque <= 0) {
      const furioso = this.c.jefe.vida < this.c.jefe.vidaMax / 2;
      this.proximoAtaque = furioso ? 3.2 : 4.5;
      const objetivos = [this.c.jugador().clone()];
      if (furioso) objetivos.push(this.c.jugador().add(new Vector3((Math.random() - 0.5) * 8, 0, (Math.random() - 0.5) * 8)));
      for (const donde of objetivos) {
        const disco = MeshBuilder.CreateDisc("alerta", { radius: 2.6, tessellation: 32 }, this.c.escena);
        disco.rotation.x = Math.PI / 2;
        disco.position.set(donde.x, 0.08, donde.z);
        disco.material = this.alerta;
        disco.isPickable = false;
        this.alertas.push({ malla: disco, t: 0, dur: 1.8, donde });
      }
      sonido.ojo(true);
    }
    for (const a of [...this.alertas]) {
      a.t += dt;
      const k = a.t / a.dur;
      a.malla.scaling.setAll(0.3 + k * 0.7);
      if (k >= 1) {
        a.malla.dispose();
        this.alertas.splice(this.alertas.indexOf(a), 1);
        estallido(this.c.escena, a.donde.add(new Vector3(0, 0.5, 0)), ["#ff3355", "#8b3dff", "#2a0a5e"], 60, 7);
        this.c.sacudida.disparar(0.3);
        sonido.error();
        const p = this.c.jugador();
        if (Math.hypot(p.x - a.donde.x, p.z - a.donde.z) < 2.6) {
          if (this.escudoHasta) {
            this.flotante("¡Bloqueado!", "codigo");
          } else {
            this.vida -= 20;
            this.c.animar("golpe");
            this.flotante("-20", "recibido");
            document.body.classList.remove("golpe");
            void document.body.offsetWidth;
            document.body.classList.add("golpe");
            if (this.vida <= 0) this.perder();
          }
        }
      }
    }
    this.pintarHud();
  }

  private limpiar() {
    for (const a of this.alertas) a.malla.dispose();
    this.alertas = [];
    this.c.escudo(false);
    this.escudoHasta = 0;
  }

  private perder() {
    this.pausa = true;
    this.limpiar();
    const caja = document.getElementById("enfoque")!;
    caja.innerHTML = `
      <div class="enfoque-tarjeta">
        <p class="enfoque-titulo">💥 ¡El Bug te desordenó!</p>
        <p>Consejo: cuando el suelo se ponga <b>rojo</b>, camina fuera del círculo. Usa <b>W</b> (escudo) antes del golpe.</p>
        <button class="boton-oro" id="reintentar">↺ Reintentar</button>
      </div>`;
    caja.hidden = false;
    caja.querySelector("#reintentar")!.addEventListener("click", () => {
      caja.hidden = true;
      this.vida = 100;
      this.c.jefe.vida = this.c.jefe.vidaMax;
      this.proximoAtaque = 3;
      this.pausa = false;
      this.pintarHud();
    });
  }

  private ganar() {
    this.activa = false;
    this.pausa = false;
    document.getElementById("enfoque")!.hidden = true;
    musicaSuave(false);
    this.limpiar();
    window.removeEventListener("keydown", this.teclas);
    const j = this.c.jefe;
    for (let i = 0; i < 4; i++) {
      window.setTimeout(() => {
        estallido(this.c.escena, j.raiz.position.add(new Vector3((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 3)), ["#b388ff", "#ffd166", "#ffffff"], 120, 9);
        this.c.sacudida.disparar(0.7);
        sonido.reparar();
      }, i * 260);
    }
    window.setTimeout(() => {
      j.raiz.setEnabled(false);
      document.getElementById("batalla")!.hidden = true;
      document.body.classList.remove("en-batalla");
      this.c.festejar();
      this.terminar();
    }, 1300);
  }
}
