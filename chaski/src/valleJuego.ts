// La jugabilidad del Valle Sagrado: mini-Bugs, huaraca (honda andina), rescates
// con código, inventario (un diccionario de Python), mapa y progreso.

import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { SITIOS, INICIO_VALLE, LIMITE_VALLE, type Sitio, crearValle } from "./valle";
import { FICHAS, NOMBRE_SITIO, BLOQUES_RIO, RETO_QUENUAS, BLOQUES_PUERTA } from "./datos/valle";
import { estado, guardar } from "./estado";
import { estallido, Sacudida } from "./efectos";
import { sonido } from "./sonido";
import { tarjeta, voz, teoria, elegir, esperarBoton, cerrarTarjeta } from "./ui/prologo";
import { abrirBloques } from "./ui/bloques";
import { abrirTaller } from "./ui/taller";

const ORDEN_SITIOS: Sitio[] = ["vicuna", "rio", "quenua", "condor", "colibri", "puerta"];
const MATERIALES = ["piedra", "ichu", "adobe"];

interface Contexto {
  escena: Scene;
  valle: ReturnType<typeof crearValle>;
  jugador: () => Vector3;
  festejar: () => void;
  lanzar: () => void;
  golpeado: () => void;
  sacudida: Sacudida;
  aviso: (t: string, ms?: number) => void;
  ganarKallpa: (n: number) => void;
  desbloquear: (clave: string) => void;
  alTerminar: () => void;
}

interface MiniBug {
  raiz: TransformNode;
  vida: number;
  casa: Vector3;
  sitio: Sitio;
  golpeHasta: number;
  t: number;
}

export class ValleJuego {
  activo = false;
  vida = 100;
  private bugs: MiniBug[] = [];
  private tiempo = 0;
  private recarga = 0;
  private mapaCada = 0;
  private bugMat: StandardMaterial;
  private ojoMat: StandardMaterial;

  constructor(private c: Contexto) {
    this.bugMat = new StandardMaterial("m-minibug", c.escena);
    this.bugMat.diffuseColor = Color3.FromHexString("#8b3dff");
    this.bugMat.emissiveColor = Color3.FromHexString("#4a14b0");
    this.ojoMat = new StandardMaterial("m-minibug-ojo", c.escena);
    this.ojoMat.emissiveColor = new Color3(1, 1, 1);
    this.ojoMat.disableLighting = true;
  }

  get rescatados() {
    return estado.rescates.length;
  }
  hecho(s: Sitio) {
    return estado.rescates.includes(s);
  }

  /** Entra al valle: aplica lo ya rescatado y pone a los guardianes. */
  entrar() {
    this.activo = true;
    this.vida = 100;
    const v = this.c.valle.control;
    for (const s of estado.rescates as Sitio[]) this.aplicarRescate(s, false);
    v.restaurar(this.rescatados / ORDEN_SITIOS.length);
    for (const b of this.bugs) b.raiz.dispose();
    this.bugs = [];
    for (const s of ORDEN_SITIOS) if (!this.hecho(s)) this.ponerGuardianes(s, s === "puerta" ? 3 : 2);
    document.getElementById("hud-valle")!.hidden = false;
    document.body.classList.add("en-valle");
    this.pintarHud();
  }

  salir() {
    this.activo = false;
    for (const b of this.bugs) b.raiz.setEnabled(false);
    document.getElementById("hud-valle")!.hidden = true;
    document.body.classList.remove("en-valle");
  }

  private ponerGuardianes(s: Sitio, n: number) {
    const centro = SITIOS[s];
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
      const a = (i / n) * Math.PI * 2;
      const casa = centro.add(new Vector3(Math.sin(a) * 4, 0, Math.cos(a) * 4 - 1));
      raiz.position.copyFrom(casa);
      this.bugs.push({ raiz, vida: 2, casa, sitio: s, golpeHasta: 0, t: Math.random() * 5 });
    }
  }

  /** Cuántos mini-Bugs vivos hay a menos de "radio" del jugador (para pruebas y avisos). */
  bugsCerca(radio = 14) {
    const p = this.c.jugador();
    return this.bugs.filter((b) => b.vida > 0 && Vector3.Distance(p, b.raiz.position) < radio).length;
  }

  guardianesVivos(s: Sitio) {
    return this.bugs.some((b) => b.sitio === s && b.vida > 0);
  }

  /** Sitio cercano al jugador que se puede rescatar (o null). */
  sitioCercano(): Sitio | null {
    const p = this.c.jugador();
    for (const s of ORDEN_SITIOS) {
      if (this.hecho(s)) continue;
      if (Math.hypot(p.x - SITIOS[s].x, p.z - SITIOS[s].z) < 4.5) return s;
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // Huaraca: dispara al mini-Bug más cercano (o hacia adelante)
  // ---------------------------------------------------------------------------
  disparar(adelante: Vector3) {
    if (!this.activo || this.recarga > 0) return;
    this.recarga = 0.45;
    const p = this.c.jugador();
    let objetivo: MiniBug | null = null;
    let mejor = 14;
    for (const b of this.bugs) {
      if (b.vida <= 0) continue;
      const d = Vector3.Distance(p, b.raiz.position);
      if (d < mejor) {
        mejor = d;
        objetivo = b;
      }
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
        if (objetivo && objetivo.vida > 0) this.golpearBug(objetivo);
      }
    });
  }

  private golpearBug(b: MiniBug) {
    b.vida -= 1;
    b.golpeHasta = this.tiempo + 0.2;
    estallido(this.c.escena, b.raiz.position, ["#b388ff", "#ffffff"], 25, 4);
    sonido.kallpa();
    if (b.vida > 0) return;
    // Se desarma en pedazos de código y suelta un material
    estallido(this.c.escena, b.raiz.position, ["#b388ff", "#8b3dff", "#ffd166"], 60, 6);
    b.raiz.dispose();
    const mat = MATERIALES[Math.floor(Math.random() * MATERIALES.length)];
    estado.inventario[mat] = (estado.inventario[mat] ?? 0) + 1;
    guardar();
    this.c.aviso(`+1 ${mat} 🧱  inventario["${mat}"] = ${estado.inventario[mat]}`, 1800);
    this.pintarHud();
    if (!this.guardianesVivos(b.sitio) && !this.hecho(b.sitio)) {
      window.setTimeout(() => this.c.aviso(`¡Despejaste ${NOMBRE_SITIO[b.sitio]}! Acércate y toca 🔧 RESCATAR.`, 3000), 1900);
    }
  }

  // ---------------------------------------------------------------------------
  // Cada cuadro
  // ---------------------------------------------------------------------------
  actualizar(dt: number, pausado: boolean) {
    if (!this.activo) return;
    this.tiempo += dt;
    this.recarga = Math.max(0, this.recarga - dt);
    const p = this.c.jugador();
    for (const b of this.bugs) {
      if (b.vida <= 0) continue;
      b.t += dt;
      const r = b.raiz;
      const d = Vector3.Distance(p, r.position);
      if (!pausado && d < 9 && d > 1.1) {
        const dir = p.subtract(r.position).normalize();
        r.position.addInPlace(dir.scale(2.4 * dt));
      } else if (d >= 9) {
        const vuelta = b.casa.add(new Vector3(Math.sin(b.t) * 1.2, 0, Math.cos(b.t) * 1.2));
        r.position = Vector3.Lerp(r.position, vuelta, Math.min(1, dt * 1.5));
      }
      r.position.y = 0.7 + Math.abs(Math.sin(b.t * 6)) * 0.35;
      r.rotation.y = Math.atan2(p.x - r.position.x, p.z - r.position.z);
      r.scaling.setAll(this.tiempo < b.golpeHasta ? 1.3 : 1);
      // Muerde si está pegado
      if (!pausado && d < 1.4 && Math.floor(b.t / 0.9) !== Math.floor((b.t - dt) / 0.9)) {
        this.vida -= 7;
        this.c.golpeado();
        this.c.sacudida.disparar(0.25);
        sonido.error();
        if (this.vida <= 0) this.caer();
        this.pintarHud();
      }
    }
    // Se recupera de a poco
    if (this.vida < 100 && !pausado) {
      this.vida = Math.min(100, this.vida + dt * 2);
    }
    this.mapaCada -= dt;
    if (this.mapaCada <= 0) {
      this.mapaCada = 0.2;
      this.pintarMapa();
      (document.getElementById("vida-valle") as HTMLElement).style.width = `${this.vida}%`;
    }
  }

  private caer() {
    this.vida = 100;
    const p = this.c.jugador();
    p.copyFrom(INICIO_VALLE);
    this.c.aviso("💫 ¡Los mini-Bugs te desordenaron! Volviste a la entrada. Dispárales desde lejos con 🎯.", 4000);
  }

  // ---------------------------------------------------------------------------
  // Rescates (cada uno es código)
  // ---------------------------------------------------------------------------
  async rescatar(s: Sitio): Promise<void> {
    if (this.guardianesVivos(s)) {
      this.c.aviso("🐛 Primero espanta a los mini-Bugs con tu 🎯 HUARACA.", 3000);
      return;
    }
    if (s === "puerta" && this.rescatados < 5) {
      this.c.aviso(`🚪 La punku se abre cuando rescates todo el valle: llevas ${this.rescatados}/5.`, 3500);
      return;
    }
    const ok = await this.reto(s);
    if (!ok) return;
    estado.rescates.push(s);
    guardar();
    this.aplicarRescate(s, true);
    this.c.valle.control.restaurar(this.rescatados / ORDEN_SITIOS.length);
    this.c.ganarKallpa(10);
    this.c.festejar();
    this.c.desbloquear(`rescate-${s}`);
    const f = FICHAS[s];
    const c = tarjeta(`
      <h3 class="prologo-titulo">${f.icono} ¡Rescate logrado: ${f.nombre}!</h3>
      <div class="ficha"><b>Santuario · ${f.nombre}</b> <small>quechua: ${f.quechua}</small><p>${f.dato}</p></div>
      <p class="explica">Naturaleza restaurada: <b>${this.rescatados}/6</b></p>
      <button class="boton-oro" id="seguir">¡Seguir explorando! ▸</button>`);
    await esperarBoton(c, "#seguir");
    cerrarTarjeta();
    this.pintarHud();
    if (s === "puerta") window.setTimeout(() => this.c.alTerminar(), 80);
    else if (this.rescatados === 5) this.c.aviso("✨ ¡Rescataste todo! Ve a la 🚪 punku del norte para abrirla.", 4500);
  }

  private aplicarRescate(s: Sitio, conEfectos: boolean) {
    const v = this.c.valle.control;
    const e = (donde: Vector3, colores: string[]) => conEfectos && estallido(this.c.escena, donde, colores, 90, 7);
    switch (s) {
      case "vicuna":
        v.liberarVicuna();
        e(SITIOS.vicuna.add(new Vector3(0, 1.5, 0)), ["#b388ff", "#ffd166", "#ffffff"]);
        break;
      case "rio":
        if (conEfectos) {
          for (let i = 0; i < 5; i++)
            window.setTimeout(() => {
              v.quitarRoca(i);
              estallido(this.c.escena, new Vector3(11 + i * 1.3, 0.8, 5 + (i % 2) * 1.6), ["#9a9389", "#bff3ff"], 30, 5);
              sonido.kallpa();
            }, i * 350);
        } else for (let i = 0; i < 5; i++) v.quitarRoca(i);
        if (conEfectos) window.setTimeout(() => sonido.agua(), 1800);
        break;
      case "quenua":
        for (let i = 0; i < 8; i++) {
          if (conEfectos) window.setTimeout(() => (v.plantar(i), sonido.kallpa()), i * 250);
          else v.plantar(i);
        }
        break;
      case "condor":
        v.eclosionar();
        e(SITIOS.condor.add(new Vector3(2, 6.5, 3)), ["#bfe9ff", "#ffffff", "#ffd166"]);
        break;
      case "colibri":
        v.florecer();
        e(SITIOS.colibri.add(new Vector3(0, 1, 0)), ["#e0213b", "#ffc93c", "#1fb86b"]);
        break;
      case "puerta":
        v.abrirPuerta();
        e(SITIOS.puerta.add(new Vector3(0, 2.5, 1.5)), ["#b388ff", "#ffd166", "#ffffff"]);
        break;
    }
    if (conEfectos) {
      this.c.sacudida.disparar(0.4);
      sonido.reparar();
    }
  }

  /** El reto de código de cada lugar. Devuelve true si lo resolvió. */
  private async reto(s: Sitio): Promise<boolean> {
    switch (s) {
      case "vicuna": {
        const c = tarjeta(`
          ${voz("amaru", "La vicuña está encerrada por una jaula de glitch. Cambia el valor para abrirla.")}
          <pre class="codigo-mini"><span class="var">jaula</span>.cerrada = <span class="valor">___</span></pre>
          <div class="prologo-opciones"></div><p class="prologo-nota" hidden></p>`);
        await elegir(c, [
          { codigo: "True", ok: false, porque: "True significa SÍ: la jaula seguiría cerrada." },
          { codigo: "False", ok: true, porque: "¡Eso! False = NO está cerrada. ¡Se abre!" },
          { codigo: '"abierta"', ok: false, porque: "cerrada es una pregunta de sí o no: se responde con True o False, no con un texto." },
        ]);
        cerrarTarjeta();
        return true;
      }
      case "rio":
        await abrirBloques(BLOQUES_RIO);
        return true;
      case "quenua":
        return !!(await abrirTaller(RETO_QUENUAS));
      case "condor": {
        // if / else: primero predecir, luego completar la comparación, al final la teoría
        let c = tarjeta(`
          ${voz("amaru", "El huevo del kuntur está helado. Esta runa decide qué hacer según la temperatura. ¿Qué hará?")}
          <pre class="codigo-mini">temperatura = <span class="num">3</span>
<span class="fn">if</span> temperatura &lt; <span class="num">10</span>:
    abrigar(nido)
<span class="fn">else</span>:
    esperar()</pre>
          <div class="prologo-opciones"></div><p class="prologo-nota" hidden></p>`);
        await elegir(c, [
          { codigo: "abrigar(nido)", ok: true, porque: "¡Sí! 3 es menor que 10, así que se cumple el if." },
          { codigo: "esperar()", ok: false, porque: "else solo pasa si la condición es falsa. ¿3 < 10 es verdad?" },
          { codigo: "las dos", ok: false, porque: "if y else nunca pasan juntos: es uno O el otro." },
        ]);
        c = tarjeta(`
          ${voz("amaru", "Ahora complétala tú: ¿qué comparación va para abrigar el nido cuando hace frío?")}
          <pre class="codigo-mini"><span class="fn">if</span> temperatura <span class="valor">___</span> <span class="num">10</span>:
    abrigar(nido)</pre>
          <div class="prologo-opciones"></div><p class="prologo-nota" hidden></p>`);
        await elegir(c, [
          { codigo: ">", ok: false, porque: "> es MAYOR que. Abrigaría el nido cuando hace calor." },
          { codigo: "<", ok: true, porque: "¡Exacto! < es MENOR que: si hace menos de 10 grados, abriga." },
          { codigo: "=", ok: false, porque: "Un solo = guarda valores, no compara. Para comparar se usa ==, <, >." },
        ]);
        c = tarjeta(`
          ${teoria("<code>if</code> hace algo <b>solo si</b> la condición es verdadera. <code>else</code> es el plan B. Para comparar: <code>&lt;</code> menor, <code>&gt;</code> mayor, <code>==</code> igual.")}
          <button class="boton-oro" id="seguir">¡Abrigar el nido! ▸</button>`);
        await esperarBoton(c, "#seguir");
        cerrarTarjeta();
        return true;
      }
      case "colibri": {
        let c = tarjeta(`
          ${voz("amaru", "El colibrí no tiene flores. Una <b>lista</b> guarda varias cosas a la vez. ¿Cuál está bien escrita?")}
          <pre class="codigo-mini"><span class="var">flores</span> = <span class="valor">___</span></pre>
          <div class="prologo-opciones"></div><p class="prologo-nota" hidden></p>`);
        await elegir(c, [
          { codigo: '["kantu" "amancay"]', ok: false, porque: 'Sin coma, Python junta los textos: "kantuamancay" (¡una sola flor rara!).' },
          { codigo: "[kantu, amancay]", ok: false, porque: "Sin comillas, Python busca variables con esos nombres y no existen." },
          { codigo: '["kantu", "amancay"]', ok: true, porque: "¡Perfecto! Corchetes, comillas y comas." },
        ]);
        c = tarjeta(`
          ${voz("amaru", "Pregunta rápida: si <code>flores = [\"kantu\", \"amancay\"]</code>, ¿qué es <code>flores[0]</code>?")}
          <div class="prologo-opciones"></div><p class="prologo-nota" hidden></p>`);
        await elegir(c, [
          { codigo: '"kantu"', ok: true, porque: "¡Sí! Las listas, como range, empiezan en 0." },
          { codigo: '"amancay"', ok: false, porque: "amancay es flores[1]. El primero siempre es [0]." },
          { codigo: "2", ok: false, porque: "2 es cuántas flores hay (len). flores[0] es la primera flor." },
        ]);
        c = tarjeta(`
          ${teoria("Una <b>lista</b> guarda varios valores en orden: <code>[\"kantu\", \"amancay\"]</code>. Se escribe con <b>corchetes y comas</b>, y el primero es <code>[0]</code>.")}
          <button class="boton-oro" id="seguir">¡Hacer florecer! ▸</button>`);
        await esperarBoton(c, "#seguir");
        cerrarTarjeta();
        return true;
      }
      case "puerta":
        await abrirBloques(BLOQUES_PUERTA);
        return true;
    }
  }

  // ---------------------------------------------------------------------------
  // HUD: progreso, inventario y mapa
  // ---------------------------------------------------------------------------
  pintarHud() {
    document.getElementById("valle-progreso")!.textContent = `${this.rescatados}/6`;
    const inv = Object.entries(estado.inventario)
      .filter(([, n]) => n > 0)
      .map(([k, n]) => `"${k}": ${n}`)
      .join(", ");
    document.getElementById("valle-inventario")!.textContent = `inventario = {${inv}}`;
  }

  private pintarMapa() {
    const lienzo = document.getElementById("mapa") as HTMLCanvasElement | null;
    if (!lienzo) return;
    const ctx = lienzo.getContext("2d")!;
    const W = lienzo.width;
    const escala = W / 2 / (LIMITE_VALLE + 4);
    const aMapa = (v: Vector3) => [W / 2 + v.x * escala, W / 2 - v.z * escala] as const;
    ctx.clearRect(0, 0, W, W);
    ctx.fillStyle = "rgba(20, 40, 24, .85)";
    ctx.beginPath();
    ctx.arc(W / 2, W / 2, W / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#4a8a3a";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "rgba(46, 159, 214, .7)";
    const [rx, ry] = aMapa(new Vector3(-40, 0, 7));
    ctx.fillRect(rx, ry, 80 * escala, 4 * escala);
    ctx.font = `${Math.round(W / 9)}px system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const s of ORDEN_SITIOS) {
      const [x, y] = aMapa(SITIOS[s]);
      ctx.globalAlpha = this.hecho(s) ? 1 : 0.85;
      ctx.fillText(this.hecho(s) ? "✅" : FICHAS[s].icono, x, y);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#ff3355";
    for (const b of this.bugs) {
      if (b.vida <= 0) continue;
      const [x, y] = aMapa(b.raiz.position);
      ctx.fillRect(x - 2, y - 2, 4, 4);
    }
    const [px, py] = aMapa(this.c.jugador());
    ctx.fillStyle = "#ffd166";
    ctx.strokeStyle = "#000";
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}
