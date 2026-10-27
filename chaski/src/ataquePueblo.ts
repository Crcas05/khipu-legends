// Episodio 1 con acción: mini-Bugs que atacan la fuente desde el primer minuto,
// burbujas de rescate (Mama Khipu y las llamas), la runa de kallpa (responder bien
// = disparo especial), guardianes en cada reparación y el mini-jefe Ch'aqwa Wawa.

import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { estado, guardar, yaPaso } from "./estado";
import { estallido, Sacudida } from "./efectos";
import { sonido, alarma, cambiarMusica, musicaSuave } from "./sonido";
import { tarjeta, cerrarTarjeta } from "./ui/prologo";
import { hablar } from "./ui/dialogo";
import { Jefe } from "./batalla";
import { RUNAS_PUEBLO, RUNAS_WAWA, ALARMA_INTRO, OLA_GANADA, WAWA_LLEGA, WAWA_VENCIDO, type PreguntaRuna } from "./datos/ataquePueblo";

const escapar = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const FUENTE = new Vector3(0, 0, 0);
const TIEMPO_OLA = 100;
const CARGA_RUNA = 4;
const VIDA_WAWA = 60;
const ENTRADAS = [new Vector3(0, 0, 21), new Vector3(0, 0, -20), new Vector3(21, 0, 5), new Vector3(-21, 0, -5)];

interface Contexto {
  escena: Scene;
  jugador: () => Vector3;
  mama: TransformNode;
  vecinos: { id: string; nombre: string; raiz: TransformNode }[];
  lanzar: () => void;
  golpeado: () => void;
  festejar: () => void;
  sacudida: Sacudida;
  aviso: (t: string, ms?: number) => void;
  ganarKallpa: (n: number) => void;
  desbloquear: (clave: string) => void;
  objetivo: (t: string | null) => void;
  /** Avisa a main que cambió algo (botones, flecha). */
  cambio: () => void;
  /** Liberaron a Mama: main sigue la historia. */
  mamaLibre: () => void;
}

interface MiniBug {
  raiz: TransformNode;
  vida: number;
  grande: boolean;
  t: number;
  golpeHasta: number;
  /** Guardianes: se quedan cerca de su casa. Ola: van a la fuente. */
  casa: Vector3 | null;
  guardia: string | null;
}

interface Burbuja {
  id: string;
  malla: Mesh;
  dueno: TransformNode;
  vida: number;
  nombre: string;
}

type Modo = "nada" | "ola" | "mama" | "jefe";

export class AtaquePueblo {
  modo: Modo = "nada";
  preguntando = false;
  vida = 100;
  carga = 0;
  private bugs: MiniBug[] = [];
  private burbujas: Burbuja[] = [];
  private amenaza = TIEMPO_OLA;
  private olaDos = false;
  private tiempo = 0;
  private recarga = 0;
  private bugMat: StandardMaterial;
  private ojoMat: StandardMaterial;
  private burbujaMat: StandardMaterial;
  private piedraMat: StandardMaterial;
  // Mini-jefe
  private jefe: Jefe | null = null;
  private escudo: Mesh | null = null;
  private escudoArriba = true;
  private escudoHasta = 0;
  private runa: Mesh | null = null;
  private pregunta = 0;
  private proximoAtaque = 4;
  private proximaCria = 12;
  private alertas: { malla: Mesh; t: number; donde: Vector3 }[] = [];
  private activo = false;

  constructor(private c: Contexto) {
    const e = c.escena;
    this.bugMat = new StandardMaterial("m-bug-pueblo", e);
    this.bugMat.diffuseColor = Color3.FromHexString("#8b3dff");
    this.bugMat.emissiveColor = Color3.FromHexString("#4a14b0");
    this.ojoMat = new StandardMaterial("m-bug-pueblo-ojo", e);
    this.ojoMat.emissiveColor = new Color3(1, 1, 1);
    this.ojoMat.disableLighting = true;
    this.burbujaMat = new StandardMaterial("m-burbuja", e);
    this.burbujaMat.diffuseColor = new Color3(0.6, 0.35, 1);
    this.burbujaMat.emissiveColor = new Color3(0.35, 0.15, 0.75);
    this.burbujaMat.alpha = 0.38;
    this.burbujaMat.backFaceCulling = false;
    this.piedraMat = new StandardMaterial("m-huaraca-pueblo", e);
    this.piedraMat.emissiveColor = new Color3(1, 0.95, 0.75);
    this.piedraMat.disableLighting = true;
  }

  // ---------------------------------------------------------------------------
  // Estado de la historia
  // ---------------------------------------------------------------------------
  get olaHecha() {
    return estado.pueblo.ola || yaPaso("hablar1");
  }
  get mamaAtrapada() {
    return !(estado.pueblo.mama || yaPaso("hablar1"));
  }
  get jefeActivo() {
    return this.modo === "jefe";
  }
  get bugsVivos() {
    return this.bugs.filter((b) => b.vida > 0).length;
  }
  /** ¿Hay algo a qué disparar? (para mostrar el botón 🎯) */
  get armado() {
    return this.activo && (this.bugsVivos > 0 || this.burbujas.some((b) => b.id !== "mama") || this.modo === "jefe");
  }
  get runaLista() {
    return this.activo && this.carga >= CARGA_RUNA && this.bugsVivos > 0 && !this.preguntando;
  }
  guardiasVivos(sitio: string) {
    return this.bugs.some((b) => b.vida > 0 && b.guardia === sitio);
  }
  /** Chaski está junto a la burbuja de Mama y ya no hay Bugs. */
  puedeLiberarMama() {
    if (!this.activo || !this.mamaAtrapada || this.modo !== "mama") return false;
    const p = this.c.jugador();
    return Math.hypot(p.x - this.c.mama.position.x, p.z - this.c.mama.position.z) < 3.6;
  }
  /** Dónde apunta la flecha dorada (o null para que decida la historia). */
  destino(): Vector3 | null {
    if (!this.activo) return null;
    if (this.modo === "mama") return this.c.mama.position;
    if (this.modo === "jefe") {
      if (this.escudoArriba && this.runa) return this.runa.position;
      return this.jefe?.raiz.position ?? null;
    }
    const p = this.c.jugador();
    let mejor: Vector3 | null = null;
    let d = Infinity;
    for (const b of this.bugs) {
      if (b.vida <= 0) continue;
      const dd = Vector3.Distance(p, b.raiz.position);
      if (dd < d) [d, mejor] = [dd, b.raiz.position];
    }
    return mejor;
  }

  // ---------------------------------------------------------------------------
  // Entrar / salir de la plaza
  // ---------------------------------------------------------------------------
  /** Se llama al entrar a la plaza (o al empezar a jugar). Arma lo que toque según el paso. */
  entrar() {
    this.activo = true;
    this.vida = 100;
    if (yaPaso("completo")) {
      this.limpiarTodo();
      return;
    }
    this.ponerBurbujas();
    this.prepararPaso();
    this.pintar();
  }

  salir() {
    this.activo = false;
    this.limpiarTodo();
  }

  private limpiarTodo() {
    for (const b of this.bugs) b.raiz.dispose();
    this.bugs = [];
    for (const b of this.burbujas) b.malla.dispose();
    this.burbujas = [];
    this.quitarJefe();
    this.modo = "nada";
    this.c.objetivo(null);
    this.pintar();
  }

  /** Revisa el paso de la historia: guardianes en la fuente y en las casas, mini-jefe al final. */
  prepararPaso() {
    if (!this.activo) return;
    const p = estado.paso;
    if (p === "fuente" && !estado.pueblo.guardias.includes("fuente") && !this.guardiasVivos("fuente")) this.ponerGuardias("fuente", FUENTE, 3);
    if (p === "techo" && !estado.pueblo.guardias.includes("techo") && !this.guardiasVivos("techo")) this.ponerGuardias("techo", new Vector3(-12, 0, 8.5), 3);
    this.c.cambio();
  }

  /** Paso "intro": la primera oleada (después de los diálogos de alarma). */
  async empezarOla(conDialogo = true) {
    if (!this.activo || this.olaHecha) {
      if (this.mamaAtrapada && this.activo) this.modoMama();
      return;
    }
    if (conDialogo) await hablar(ALARMA_INTRO);
    this.modo = "ola";
    this.amenaza = TIEMPO_OLA;
    this.olaDos = false;
    this.vida = 100;
    for (let i = 0; i < 4; i++) this.ponerBug(ENTRADAS[i], false, null, null);
    cambiarMusica("batalla");
    sonido.pututu();
    this.c.sacudida.disparar(0.5);
    this.c.objetivo("¡Defiende la fuente! Dispara a los mini-Bugs con 🎯 HUARACA");
    this.c.aviso("🐛 ¡4 mini-Bugs van hacia la fuente! Toca 🎯 HUARACA", 3000);
    this.pintar();
    this.c.cambio();
  }

  private modoMama() {
    this.modo = "mama";
    this.c.objetivo("Libera a Mama Khipu: acércate a la burbuja 🫧");
    this.c.cambio();
  }

  // ---------------------------------------------------------------------------
  // Mini-Bugs y burbujas
  // ---------------------------------------------------------------------------
  private ponerBug(donde: Vector3, grande: boolean, casa: Vector3 | null, guardia: string | null) {
    const e = this.c.escena;
    const raiz = new TransformNode("minibug-pueblo", e);
    const cuerpo = MeshBuilder.CreateBox("glitch", { size: 0.8 }, e);
    cuerpo.material = this.bugMat;
    cuerpo.parent = raiz;
    for (const lado of [-1, 1]) {
      const ojo = MeshBuilder.CreateSphere("glitch", { diameter: 0.22, segments: 6 }, e);
      ojo.material = this.ojoMat;
      ojo.parent = raiz;
      ojo.position.set(0.18 * lado, 0.12, 0.41);
    }
    if (grande) raiz.scaling.setAll(1.6);
    raiz.position.copyFrom(donde);
    estallido(e, donde.add(new Vector3(0, 0.8, 0)), ["#b388ff", "#8b3dff"], 30, 4);
    this.bugs.push({ raiz, vida: grande ? 5 : 2, grande, t: Math.random() * 5, golpeHasta: 0, casa, guardia });
  }

  private ponerGuardias(sitio: string, centro: Vector3, n: number) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.4;
      const casa = centro.add(new Vector3(Math.sin(a) * 3.4, 0, Math.cos(a) * 3.4));
      this.ponerBug(casa, false, casa, sitio);
    }
    this.c.aviso(sitio === "fuente" ? "🐛 ¡Mini-Bugs cuidan la fuente! Espántalos con 🎯 antes de repararla." : "🐛 ¡Hay mini-Bugs junto a la casa! Dispárales con 🎯.", 3500);
  }

  private ponerBurbujas() {
    for (const b of this.burbujas) b.malla.dispose();
    this.burbujas = [];
    const e = this.c.escena;
    const crear = (id: string, dueno: TransformNode, nombre: string, diametro: number, vida: number) => {
      const m = MeshBuilder.CreateSphere(`burbuja-${id}`, { diameter: diametro, segments: 16 }, e);
      m.material = this.burbujaMat;
      m.isPickable = false;
      m.position.copyFrom(dueno.position).addInPlace(new Vector3(0, diametro * 0.42, 0));
      this.burbujas.push({ id, malla: m, dueno, vida, nombre });
    };
    if (this.mamaAtrapada) crear("mama", this.c.mama, "Mama Khipu", 3.4, 99);
    for (const v of this.c.vecinos) if (!estado.pueblo.vecinos.includes(v.id)) crear(v.id, v.raiz, v.nombre, 3, 3);
  }

  // ---------------------------------------------------------------------------
  // Huaraca
  // ---------------------------------------------------------------------------
  disparar(adelante: Vector3) {
    if (!this.activo || this.recarga > 0 || this.preguntando) return;
    this.recarga = 0.4;
    const p = this.c.jugador();
    // Prioridad: el Bug más cercano; si no hay, el jefe; si no, una burbuja de vecino.
    let objetivo: { pos: Vector3; golpe: () => void } | null = null;
    let mejor = 15;
    for (const b of this.bugs) {
      if (b.vida <= 0) continue;
      const d = Vector3.Distance(p, b.raiz.position);
      if (d < mejor) {
        mejor = d;
        objetivo = { pos: b.raiz.position, golpe: () => this.golpearBug(b) };
      }
    }
    if (!objetivo && this.jefe && Vector3.Distance(p, this.jefe.raiz.position) < 18) {
      const j = this.jefe;
      objetivo = { pos: j.raiz.position, golpe: () => this.golpearJefe() };
    }
    if (!objetivo) {
      mejor = 14;
      for (const b of this.burbujas) {
        if (b.id === "mama") continue;
        const d = Vector3.Distance(p, b.malla.position);
        if (d < mejor) {
          mejor = d;
          objetivo = { pos: b.malla.position, golpe: () => this.golpearBurbuja(b) };
        }
      }
    }
    this.c.lanzar();
    sonido.toque();
    const desde = p.add(new Vector3(0, 1.6, 0));
    const hasta = objetivo ? objetivo.pos.add(new Vector3(0, 0.4, 0)) : desde.add(adelante.scale(10));
    const piedra = MeshBuilder.CreateSphere("huaraca", { diameter: 0.3, segments: 6 }, this.c.escena);
    piedra.material = this.piedraMat;
    let t = 0;
    const dur = Math.max(0.15, Vector3.Distance(desde, hasta) / 30);
    const obs = this.c.escena.onBeforeRenderObservable.add(() => {
      t += this.c.escena.getEngine().getDeltaTime() / 1000 / dur;
      const k = Math.min(1, t);
      piedra.position = Vector3.Lerp(desde, hasta, k).add(new Vector3(0, Math.sin(k * Math.PI) * 1.2, 0));
      if (k >= 1) {
        this.c.escena.onBeforeRenderObservable.remove(obs);
        piedra.dispose();
        objetivo?.golpe();
      }
    });
  }

  private golpearBug(b: MiniBug) {
    if (b.vida <= 0) return;
    b.vida -= 1;
    b.golpeHasta = this.tiempo + 0.2;
    estallido(this.c.escena, b.raiz.position, ["#b388ff", "#ffffff"], 25, 4);
    sonido.kallpa();
    if (b.vida <= 0) this.morirBug(b);
  }

  private morirBug(b: MiniBug, silencioso = false) {
    b.vida = 0;
    estallido(this.c.escena, b.raiz.position, ["#b388ff", "#8b3dff", "#ffd166"], 60, 6);
    b.raiz.dispose();
    this.bugs.splice(this.bugs.indexOf(b), 1);
    if (this.modo === "ola" || this.modo === "jefe") {
      const antes = this.carga;
      this.carga = Math.min(CARGA_RUNA, this.carga + 1);
      if (antes < CARGA_RUNA && this.carga === CARGA_RUNA && this.bugsVivos > 0 && !silencioso) {
        this.c.aviso("🔮 ¡Runa de kallpa cargada! Tócala y responde bien: borrarás a todos los Bugs cercanos.", 3500);
        this.c.cambio();
      }
    }
    if (b.guardia && !this.guardiasVivos(b.guardia)) {
      estado.pueblo.guardias.push(b.guardia);
      guardar();
      this.c.ganarKallpa(3);
      this.c.aviso(b.guardia === "fuente" ? "✨ ¡Fuente despejada! Ahora toca 👁 OJO y su código para repararla." : "✨ ¡Casa despejada! Abre el 👁 OJO y toca su código.", 3500);
      this.c.cambio();
    }
    this.pintar();
    if (this.modo === "ola") this.revisarOla();
  }

  private golpearBurbuja(b: Burbuja) {
    b.vida -= 1;
    estallido(this.c.escena, b.malla.position, ["#d9c2ff", "#ffffff"], 20, 4);
    sonido.kallpa();
    b.malla.scaling.setAll(1.15);
    window.setTimeout(() => b.malla.scaling.setAll(1), 120);
    if (b.vida > 0) return;
    this.reventar(b);
    estado.pueblo.vecinos.push(b.id);
    guardar();
    this.c.ganarKallpa(5);
    const quedan = this.burbujas.filter((x) => x.id !== "mama").length;
    this.c.aviso(`🫧 ¡Liberaste a ${b.nombre}! +5 kallpa${quedan ? ` · quedan ${quedan} por rescatar` : " · ¡todos a salvo!"}`, 3000);
    if (!quedan) this.c.desbloquear("vecinos");
    this.c.cambio();
  }

  private reventar(b: Burbuja) {
    estallido(this.c.escena, b.malla.position, ["#d9c2ff", "#4ff0dc", "#ffffff", "#ffd166"], 90, 7);
    sonido.tesoro();
    b.malla.dispose();
    this.burbujas.splice(this.burbujas.indexOf(b), 1);
  }

  /** Botón 🫧 LIBERAR junto a Mama Khipu. */
  liberarMama() {
    if (!this.puedeLiberarMama()) return;
    const b = this.burbujas.find((x) => x.id === "mama");
    if (b) this.reventar(b);
    estado.pueblo.mama = true;
    guardar();
    this.c.sacudida.disparar(0.4);
    this.c.festejar();
    this.c.ganarKallpa(10);
    this.modo = "nada";
    this.c.objetivo(null);
    this.c.cambio();
    this.c.mamaLibre();
  }

  private revisarOla() {
    if (this.bugsVivos > 0) return;
    if (!this.olaDos) {
      // Segunda oleada, con un Bug grande
      this.olaDos = true;
      this.c.aviso("⚠ ¡Viene otra oleada! Y trae un mini-Bug GRANDE…", 2500);
      alarma();
      window.setTimeout(() => {
        if (this.modo !== "ola") return;
        for (let i = 0; i < 3; i++) this.ponerBug(ENTRADAS[(i + 1) % 4], false, null, null);
        this.ponerBug(ENTRADAS[0], true, null, null);
        this.pintar();
      }, 1800);
      return;
    }
    // ¡Ganaste la oleada!
    estado.pueblo.ola = true;
    guardar();
    cambiarMusica("andes");
    this.c.ganarKallpa(10);
    this.c.festejar();
    this.c.desbloquear("defensa");
    estallido(this.c.escena, FUENTE.add(new Vector3(0, 2.5, 0)), ["#ffd166", "#4ff0dc", "#ffffff"], 120, 8);
    this.modoMama();
    this.pintar();
    void hablar(OLA_GANADA);
  }

  /** Se acabó el tiempo: los Bugs secan la fuente. Se repite la oleada (sin castigo fuerte). */
  private perderOla() {
    for (const b of [...this.bugs]) {
      estallido(this.c.escena, b.raiz.position, ["#8b3dff", "#2a0a5e"], 30, 4);
      b.raiz.dispose();
    }
    this.bugs = [];
    alarma();
    this.c.sacudida.disparar(0.9);
    this.c.golpeado();
    document.body.classList.remove("golpe");
    void document.body.offsetWidth;
    document.body.classList.add("golpe");
    this.modo = "nada";
    this.c.aviso("💧 ¡Los mini-Bugs secaron la fuente! Kraa… ¡Vuelven a atacar! Esta vez dispárales antes de que lleguen.", 4500);
    window.setTimeout(() => void this.empezarOla(false), 3500);
    this.pintar();
  }

  // ---------------------------------------------------------------------------
  // Runa de kallpa (pregunta = disparo especial)
  // ---------------------------------------------------------------------------
  async usarRuna() {
    if (!this.runaLista) return;
    const ok = await this.preguntar(RUNAS_PUEBLO, "🔮 RUNA DE KALLPA", "Responde bien y lanzarás un disparo especial.");
    if (ok) {
      this.carga = 0;
      const p = this.c.jugador();
      estallido(this.c.escena, p.add(new Vector3(0, 1.5, 0)), ["#4ff0dc", "#ffd166", "#ffffff", "#c78bff"], 200, 14);
      this.c.sacudida.disparar(0.8);
      this.c.festejar();
      let n = 0;
      for (const b of [...this.bugs]) {
        if (Vector3.Distance(p, b.raiz.position) < 16) {
          this.morirBug(b, true);
          n++;
        }
      }
      this.c.aviso(`💥 ¡RUNA DE KALLPA! Borraste ${n} mini-Bug${n === 1 ? "" : "s"} de un solo golpe.`, 3000);
    } else {
      this.carga = Math.floor(CARGA_RUNA / 2);
    }
    this.pintar();
    this.c.cambio();
  }

  private async preguntar(banco: PreguntaRuna[], titulo: string, subtitulo: string): Promise<boolean> {
    this.preguntando = true;
    this.c.cambio();
    const [codigo, pregunta, correcta, malas, explica] = banco[this.pregunta % banco.length];
    this.pregunta++;
    musicaSuave(true);
    const opciones = [correcta, ...malas].map((v) => [Math.random(), v] as const).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
    const c = tarjeta(`
      <p class="enfoque-titulo">${titulo}</p>
      <p class="explica">${subtitulo}</p>
      ${codigo ? `<pre class="codigo-mini">${escapar(codigo)}</pre>` : ""}
      <p>${escapar(pregunta)}</p>
      <div class="prologo-opciones">${opciones.map((o) => `<button class="opcion" data-v="${escapar(o)}"><code>${escapar(o)}</code></button>`).join("")}</div>`);
    const elegido = await new Promise<string>((r) =>
      c.querySelectorAll<HTMLButtonElement>(".opcion").forEach((b) => b.addEventListener("click", () => r(b.dataset.v!)))
    );
    cerrarTarjeta();
    musicaSuave(false);
    this.preguntando = false;
    const ok = elegido === correcta;
    if (ok) sonido.acierto();
    else {
      sonido.error();
      this.c.aviso(`❌ ${explica}`, 4500);
    }
    this.c.cambio();
    return ok;
  }

  // ---------------------------------------------------------------------------
  // Mini-jefe: Ch'aqwa Wawa (al final del Episodio 1)
  // ---------------------------------------------------------------------------
  get jefePendiente() {
    return this.activo && estado.paso === "final" && !estado.pueblo.jefe;
  }

  async iniciarJefe() {
    if (!this.jefePendiente || this.modo === "jefe") return;
    this.modo = "jefe";
    await hablar(WAWA_LLEGA);
    const e = this.c.escena;
    this.jefe = new Jefe(e);
    this.jefe.vidaMax = VIDA_WAWA;
    this.jefe.aparecer(new Vector3(0, 0, -7));
    this.jefe.raiz.scaling.setAll(0.7);
    const m = new StandardMaterial("m-escudo-wawa", e);
    m.diffuseColor = new Color3(0.6, 0.4, 1);
    m.emissiveColor = new Color3(0.35, 0.2, 0.8);
    m.alpha = 0.3;
    this.escudo = MeshBuilder.CreateSphere("escudo-wawa", { diameter: 4.8, segments: 16 }, e);
    this.escudo.material = m;
    this.escudo.isPickable = false;
    this.escudoArriba = true;
    this.proximoAtaque = 4;
    this.proximaCria = 10;
    this.vida = 100;
    this.carga = 0;
    this.ponerRuna();
    document.getElementById("jefe-zona")!.hidden = false;
    document.getElementById("jefe-zona-nombre")!.textContent = "🐛 Ch'aqwa Wawa";
    cambiarMusica("batalla");
    sonido.pututu();
    this.c.sacudida.disparar(0.8);
    this.c.objetivo("¡Vence al Ch'aqwa Wawa! Toca la 🔮 runa para romper su escudo");
    this.pintarJefe();
    this.c.cambio();
  }

  private ponerRuna() {
    this.runa?.dispose();
    const e = this.c.escena;
    const r = MeshBuilder.CreatePolyhedron("runa-wawa", { type: 1, size: 0.55 }, e);
    const m = new StandardMaterial("m-runa-wawa", e);
    m.emissiveColor = new Color3(0.75, 0.45, 1);
    m.disableLighting = true;
    r.material = m;
    const a = Math.random() * Math.PI * 2;
    r.position.set(Math.sin(a) * 9, 1.4, Math.cos(a) * 9);
    this.runa = r;
  }

  private async responderRunaJefe() {
    if (this.preguntando) return;
    const ok = await this.preguntar(RUNAS_WAWA, "🔮 RUNA DEL ESCUDO", "El escudo del Ch'aqwa Wawa es de código.");
    if (!this.jefe) return;
    if (ok) {
      this.escudoArriba = false;
      this.escudoHasta = this.tiempo + 10;
      if (this.escudo) estallido(this.c.escena, this.escudo.position, ["#b388ff", "#ffffff"], 100, 9);
      this.runa?.dispose();
      this.runa = null;
      this.c.aviso("💥 ¡Escudo roto! Tienes 10 segundos: ¡dispárale con la 🎯 huaraca!", 3000);
    } else this.ponerRuna();
    this.pintarJefe();
  }

  private golpearJefe() {
    const j = this.jefe;
    if (!j) return;
    if (this.escudoArriba) {
      estallido(this.c.escena, j.raiz.position, ["#b388ff"], 15, 3);
      this.c.aviso("🛡 ¡Rebotó en el escudo! Busca la 🔮 runa (sigue la flecha).", 2200);
      return;
    }
    j.vida -= 10;
    j.golpear();
    sonido.kallpa();
    estallido(this.c.escena, j.raiz.position, ["#ffd166", "#ffffff", "#b388ff"], 40, 6);
    this.c.sacudida.disparar(0.2);
    this.pintarJefe();
    if (j.vida <= 0) void this.vencerJefe();
  }

  private async vencerJefe() {
    const j = this.jefe;
    if (!j) return;
    estallido(this.c.escena, j.raiz.position, ["#ffd166", "#b388ff", "#4ff0dc", "#ffffff"], 260, 14);
    this.c.sacudida.disparar(1);
    sonido.nivel();
    for (const b of [...this.bugs]) this.morirBug(b, true);
    this.quitarJefe();
    estado.pueblo.jefe = true;
    guardar();
    this.modo = "nada";
    cambiarMusica("andes");
    this.c.ganarKallpa(15);
    this.c.festejar();
    this.c.desbloquear("wawa");
    this.c.objetivo(null);
    this.c.cambio();
    await hablar(WAWA_VENCIDO);
    this.c.cambio();
  }

  private quitarJefe() {
    this.jefe?.raiz.dispose();
    this.jefe = null;
    this.escudo?.dispose();
    this.escudo = null;
    this.runa?.dispose();
    this.runa = null;
    for (const a of this.alertas) a.malla.dispose();
    this.alertas = [];
    document.getElementById("jefe-zona")!.hidden = true;
  }

  private pintarJefe() {
    const j = this.jefe;
    if (!j) return;
    (document.getElementById("jefe-zona-vida") as HTMLElement).style.width = `${Math.max(0, (j.vida / j.vidaMax) * 100)}%`;
    document.getElementById("jefe-zona-estado")!.textContent = this.escudoArriba
      ? `🛡 escudo = True · vida = ${Math.max(0, j.vida)}`
      : `💥 escudo = False · vida = ${Math.max(0, j.vida)}`;
  }

  // ---------------------------------------------------------------------------
  // Cada cuadro
  // ---------------------------------------------------------------------------
  actualizar(dt: number, pausado: boolean) {
    if (!this.activo) return;
    this.tiempo += dt;
    this.recarga = Math.max(0, this.recarga - dt);
    const p = this.c.jugador();
    const quieto = pausado || this.preguntando;

    // Burbujas: flotan y siguen a su dueño
    for (const b of this.burbujas) {
      const y = b.malla.scaling.y;
      b.malla.position.x = b.dueno.position.x;
      b.malla.position.z = b.dueno.position.z;
      b.malla.rotation.y += dt * 0.6;
      b.malla.scaling.x = y * (1 + Math.sin(this.tiempo * 3 + b.dueno.position.x) * 0.03);
    }
    // Avisos de la burbuja de Mama
    if (this.modo === "ola" && Math.hypot(p.x - this.c.mama.position.x, p.z - this.c.mama.position.z) < 3.5 && Math.floor(this.tiempo) % 6 === 0 && Math.floor(this.tiempo - dt) % 6 !== 0) {
      this.c.aviso("🫧 Mama Khipu está atrapada. ¡Primero espanta a los mini-Bugs!", 2500);
    }

    // Mini-Bugs
    let enFuente = 0;
    for (const b of this.bugs) {
      if (b.vida <= 0) continue;
      b.t += dt;
      const r = b.raiz;
      const d = Vector3.Distance(p, r.position);
      if (!quieto) {
        let meta: Vector3;
        const vel = b.grande ? 1.6 : 2.3;
        if (d < (b.guardia ? 8 : 5.5)) meta = p; // te ven: te persiguen
        else if (b.casa) meta = b.casa.add(new Vector3(Math.sin(b.t) * 1.2, 0, Math.cos(b.t) * 1.2));
        else meta = FUENTE.add(new Vector3(Math.sin(b.t * 0.7 + r.uniqueId) * 2.2, 0, Math.cos(b.t * 0.7 + r.uniqueId) * 2.2));
        const dir = meta.subtract(r.position);
        dir.y = 0;
        const largo = dir.length();
        if (largo > 1.1 || meta !== p) r.position.addInPlace(dir.normalize().scale(Math.min(largo, vel * dt)));
        if (!b.casa && Math.hypot(r.position.x, r.position.z) < 3.4) enFuente++;
      }
      r.position.y = (b.grande ? 1.1 : 0.7) + Math.abs(Math.sin(b.t * 6)) * 0.35;
      r.rotation.y = Math.atan2(p.x - r.position.x, p.z - r.position.z);
      const base = b.grande ? 1.6 : 1;
      r.scaling.setAll(this.tiempo < b.golpeHasta ? base * 1.3 : base);
      // Muerde si está pegado
      if (!quieto && d < 1.5 && Math.floor(b.t / 0.9) !== Math.floor((b.t - dt) / 0.9)) this.dano(b.grande ? 12 : 7);
    }

    // Cuenta regresiva de la fuente
    if (this.modo === "ola" && !quieto) {
      this.amenaza -= dt * (1 + enFuente * 0.6);
      if (enFuente && Math.floor(this.tiempo * 2) !== Math.floor((this.tiempo - dt) * 2)) {
        estallido(this.c.escena, FUENTE.add(new Vector3(0, 1.5, 0)), ["#8b3dff", "#2a0a5e"], 8, 3);
      }
      if (this.amenaza <= 0) this.perderOla();
    }

    // Mini-jefe
    if (this.modo === "jefe" && this.jefe) this.actualizarJefe(dt, p, quieto);

    if (!quieto && this.vida < 100) this.vida = Math.min(100, this.vida + dt * 2);
    if (Math.floor(this.tiempo * 5) !== Math.floor((this.tiempo - dt) * 5)) this.pintar();
  }

  private actualizarJefe(dt: number, p: Vector3, quieto: boolean) {
    const j = this.jefe!;
    j.actualizar(dt, p);
    if (this.escudo) {
      this.escudo.position.copyFrom(j.raiz.position);
      this.escudo.isVisible = this.escudoArriba;
    }
    if (this.runa) {
      this.runa.rotation.y += dt * 2;
      this.runa.position.y = 1.4 + Math.sin(this.tiempo * 3) * 0.3;
      if (!quieto && this.escudoArriba && Math.hypot(p.x - this.runa.position.x, p.z - this.runa.position.z) < 1.9) void this.responderRunaJefe();
    }
    if (!this.escudoArriba && this.tiempo > this.escudoHasta) {
      this.escudoArriba = true;
      this.ponerRuna();
      this.c.aviso("🛡 ¡El escudo volvió! Busca la nueva 🔮 runa.", 2500);
      this.pintarJefe();
    }
    if (quieto) return;
    // Se mueve despacio alrededor de la fuente
    const a = this.tiempo * 0.25;
    j.raiz.position.x += (Math.sin(a) * 7 - j.raiz.position.x) * Math.min(1, dt);
    j.raiz.position.z += (Math.cos(a) * 7 - j.raiz.position.z) * Math.min(1, dt);
    // Círculos rojos
    this.proximoAtaque -= dt;
    if (this.proximoAtaque <= 0) {
      this.proximoAtaque = j.vida < j.vidaMax / 2 ? 3.2 : 4.5;
      const disco = MeshBuilder.CreateDisc("alerta", { radius: 2.4, tessellation: 32 }, this.c.escena);
      const m = new StandardMaterial("m-alerta-wawa", this.c.escena);
      m.emissiveColor = new Color3(0.95, 0.1, 0.15);
      m.alpha = 0.45;
      m.disableLighting = true;
      disco.material = m;
      disco.rotation.x = Math.PI / 2;
      disco.position.set(p.x, 0.08, p.z);
      this.alertas.push({ malla: disco, t: 0, donde: p.clone() });
      sonido.ojo(true);
    }
    for (const al of [...this.alertas]) {
      al.t += dt;
      al.malla.scaling.setAll(0.3 + Math.min(1, al.t / 1.7) * 0.7);
      if (al.t >= 1.7) {
        al.malla.dispose();
        this.alertas.splice(this.alertas.indexOf(al), 1);
        estallido(this.c.escena, al.donde.add(new Vector3(0, 0.5, 0)), ["#ff3355", "#8b3dff"], 50, 7);
        this.c.sacudida.disparar(0.3);
        if (Math.hypot(p.x - al.donde.x, p.z - al.donde.z) < 2.4) this.dano(15);
      }
    }
    // Crías: refuerzos
    this.proximaCria -= dt;
    if (this.proximaCria <= 0) {
      this.proximaCria = 13;
      if (this.bugsVivos < 4) {
        for (const lado of [-1, 1]) this.ponerBug(j.raiz.position.add(new Vector3(lado * 2.5, -j.raiz.position.y, 1)), false, null, null);
        this.c.aviso("🐛 ¡El Wawa llamó a sus crías!", 1800);
      }
    }
  }

  private dano(n: number) {
    this.vida -= n;
    this.c.golpeado();
    this.c.sacudida.disparar(0.25);
    sonido.error();
    document.body.classList.remove("golpe");
    void document.body.offsetWidth;
    document.body.classList.add("golpe");
    if (this.vida <= 0) {
      this.vida = 100;
      this.c.jugador().set(0, 0, 14);
      this.c.aviso("💫 ¡Te desordenaron! Volviste a la entrada de la plaza. Dispara desde lejos con 🎯.", 3500);
    }
    this.pintar();
  }

  // ---------------------------------------------------------------------------
  // HUD
  // ---------------------------------------------------------------------------
  private pintar() {
    const hud = document.getElementById("hud-pueblo");
    const amenaza = document.getElementById("amenaza")!;
    const combate = this.activo && (this.modo === "ola" || this.modo === "jefe" || this.bugsVivos > 0);
    if (hud) hud.hidden = !combate;
    if (combate) {
      (document.getElementById("vida-pueblo") as HTMLElement).style.width = `${Math.max(0, this.vida)}%`;
      const cargado = Math.min(CARGA_RUNA, this.carga);
      document.getElementById("runa-carga")!.textContent = `🔮 ${"◆".repeat(cargado)}${"◇".repeat(CARGA_RUNA - cargado)}`;
    }
    const olaVisible = this.activo && this.modo === "ola";
    if (olaVisible) {
      amenaza.hidden = false;
      const s = Math.max(0, Math.ceil(this.amenaza));
      document.getElementById("amenaza-texto")!.textContent = `⏳ Los Bugs secan la fuente: ${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
      (document.getElementById("amenaza-relleno") as HTMLElement).style.width = `${(this.amenaza / TIEMPO_OLA) * 100}%`;
      amenaza.classList.toggle("urgente", this.amenaza < 25);
    } else if (this.activo && !document.body.classList.contains("en-valle")) amenaza.hidden = true;
    const runa = document.getElementById("boton-runa");
    if (runa) runa.hidden = !this.runaLista;
  }

  /** Lo que se dibuja en el minimapa. */
  puntosMapa() {
    return {
      bugs: this.bugs.filter((b) => b.vida > 0).map((b) => b.raiz.position),
      burbujas: this.burbujas.map((b) => b.malla.position),
      jefe: this.jefe?.raiz.position ?? null,
      runa: this.runa?.position ?? null,
    };
  }

  // ---------------------------------------------------------------------------
  // Para las pruebas automáticas
  // ---------------------------------------------------------------------------
  prueba = {
    limpiar: () => {
      for (const b of [...this.bugs]) this.morirBug(b, true);
      if (this.modo === "ola") this.revisarOla();
    },
    estado: () => ({ modo: this.modo, bugs: this.bugsVivos, carga: this.carga, amenaza: Math.round(this.amenaza), burbujas: this.burbujas.map((b) => b.id), vidaJefe: this.jefe?.vida ?? null, escudo: this.escudoArriba }),
    amenaza: (s: number) => (this.amenaza = s),
    cargar: () => (this.carga = CARGA_RUNA),
    vencer: () => void this.vencerJefe(),
    romperEscudo: () => {
      this.escudoArriba = false;
      this.escudoHasta = this.tiempo + 30;
    },
  };
}
