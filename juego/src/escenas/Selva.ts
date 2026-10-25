// Escena principal de la Etapa 1: un pedazo de selva para caminar.

import Phaser from "phaser";
import { TILE } from "../config";
import { BALDOSA } from "../arte/texturas";
import { SUELO, OBJETOS, WAYRURU, INICIO, type TipoObjeto } from "../mundo/mapaSelva";
import { Chaski } from "../entidades/Chaski";
import { Tuki } from "../entidades/Tuki";
import { entrada } from "../ui/controles";
import { aviso, dialogo, actualizarWayruru } from "../ui/hud";

// Qué baldosa corresponde a cada letra del mapa
const LETRA_A_BALDOSA: Record<string, number> = {
  ".": BALDOSA.PASTO,
  ",": BALDOSA.PASTO_2,
  "*": BALDOSA.PASTO_FLORES,
  "=": BALDOSA.TIERRA,
  "~": BALDOSA.AGUA,
  "#": BALDOSA.PUENTE,
};

// Parte de cada objeto que choca con el Chaski (ancho y alto, en la base)
const CHOQUE: Record<TipoObjeto, [number, number]> = {
  arbol: [10, 6],
  palmera: [6, 5],
  roca: [14, 6],
  choza: [40, 12],
  lupuna: [44, 16],
};

interface Lugar {
  x: number;
  y: number;
  radio: number;
  quien: string;
  texto: string;
}

export class Selva extends Phaser.Scene {
  private chaski!: Chaski;
  private tuki!: Tuki;
  private teclas!: Record<string, Phaser.Input.Keyboard.Key>;
  private lugares: Lugar[] = [];
  private lugarCercano: Lugar | null = null;
  private recogidas = 0;

  constructor() {
    super("selva");
  }

  create() {
    // --- Suelo (mapa de baldosas) ---
    const datos = SUELO.map((fila) => [...fila].map((letra) => LETRA_A_BALDOSA[letra] ?? BALDOSA.PASTO));
    const mapa = this.make.tilemap({ data: datos, tileWidth: TILE, tileHeight: TILE });
    const baldosas = mapa.addTilesetImage("baldosas", "baldosas", TILE, TILE, 0, 0)!;
    const suelo = mapa.createLayer(0, baldosas, 0, 0)!;
    suelo.setCollision([BALDOSA.AGUA, BALDOSA.AGUA_2]);
    suelo.setDepth(-1000);

    const anchoMundo = mapa.widthInPixels;
    const altoMundo = mapa.heightInPixels;
    this.physics.world.setBounds(0, 0, anchoMundo, altoMundo);

    // --- Objetos: árboles, palmeras, rocas, chozas y la Gran Lupuna ---
    const solidos = this.physics.add.staticGroup();
    for (const [tipo, col, fila] of OBJETOS) {
      const x = col * TILE + TILE / 2;
      const y = (fila + 1) * TILE;
      const obj = solidos.create(x, y, tipo) as Phaser.Physics.Arcade.Image;
      obj.setOrigin(0.5, 1).setDepth(y);
      const [w, h] = CHOQUE[tipo];
      const cuerpo = obj.body as Phaser.Physics.Arcade.StaticBody;
      cuerpo.setSize(w, h);
      cuerpo.position.set(x - w / 2, y - h);
      cuerpo.updateCenter();

      if (tipo === "lupuna") {
        this.lugares.push({
          x, y: y - 10, radio: 44,
          quien: "Tuki",
          texto: "¡Kraa! Es la <b>Gran Lupuna</b>. Su Corazón está apagado… Muy pronto podrás despertarlo (Etapa 3).",
        });
      } else if (tipo === "choza") {
        this.lugares.push({
          x, y: y + 4, radio: 34,
          quien: "Tuki",
          texto: "Esta es la aldea <b>Raíz del Río</b>. En la Etapa 2 podrás hablar con los vecinos. <i>Sulpayki</i> (gracias) por tu paciencia.",
        });
      }
    }

    // --- Semillas de wayruru ---
    const semillas = this.physics.add.staticGroup();
    for (const [col, fila] of WAYRURU) {
      const s = semillas.create(col * TILE + 8, fila * TILE + 10, "wayruru") as Phaser.Physics.Arcade.Image;
      s.setDepth(s.y);
      this.tweens.add({ targets: s, y: s.y - 2, duration: 600, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    }
    actualizarWayruru(0, WAYRURU.length);

    // --- Chaski y Tuki ---
    this.chaski = new Chaski(this, INICIO.columna * TILE + 8, (INICIO.fila + 1) * TILE - 2);
    this.tuki = new Tuki(this, this.chaski);
    this.physics.add.collider(this.chaski, suelo);
    this.physics.add.collider(this.chaski, solidos);
    this.physics.add.overlap(this.chaski, semillas, (_c, s) => this.recoger(s as Phaser.Physics.Arcade.Image));

    // --- Cámara ---
    const camara = this.cameras.main;
    camara.setBounds(0, 0, anchoMundo, altoMundo);
    camara.startFollow(this.chaski, true, 0.12, 0.12);
    camara.setRoundPixels(true);
    camara.fadeIn(600, 29, 26, 57);

    // --- Teclado (PC) ---
    this.teclas = this.input.keyboard!.addKeys("UP,DOWN,LEFT,RIGHT,W,A,S,D,SPACE,E,ENTER") as Record<string, Phaser.Input.Keyboard.Key>;

    this.time.delayedCall(700, () =>
      dialogo(
        "Tuki",
        "¡Kraa! <b>Allillanchu</b> (¿cómo estás?), Chaski. Muévete con el joystick y junta las semillas de <b>wayruru</b>. Al otro lado del río está la aldea.",
        8000
      )
    );

    // Para las pruebas automáticas: ?prueba en la URL expone el estado del juego
    if (new URLSearchParams(location.search).has("prueba")) {
      (window as unknown as { __selva: Selva }).__selva = this;
    }
  }

  private recoger(semilla: Phaser.Physics.Arcade.Image) {
    if (!semilla.active) return;
    semilla.disableBody(true, false);
    this.tweens.add({ targets: semilla, y: semilla.y - 12, alpha: 0, duration: 350, onComplete: () => semilla.destroy() });
    this.recogidas++;
    actualizarWayruru(this.recogidas, WAYRURU.length);
    if (this.recogidas === WAYRURU.length) aviso("¡Juntaste todos los wayruru! Dicen que traen buena suerte.");
    else if (this.recogidas === 1) aviso("+1 wayruru: la moneda de Tawa Pacha");
  }

  update(_tiempo: number, delta: number) {
    const t = this.teclas;
    let dx = entrada.x;
    let dy = entrada.y;
    if (t.LEFT.isDown || t.A.isDown) dx = -1;
    else if (t.RIGHT.isDown || t.D.isDown) dx = 1;
    if (t.UP.isDown || t.W.isDown) dy = -1;
    else if (t.DOWN.isDown || t.S.isDown) dy = 1;

    this.chaski.mover(dx, dy);
    this.tuki.seguir(delta);

    // ¿Hay algo interesante cerca? Se activa el botón de acción
    this.lugarCercano =
      this.lugares.find((l) => Phaser.Math.Distance.Between(l.x, l.y, this.chaski.x, this.chaski.y) < l.radio) ?? null;
    document.getElementById("boton-accion")?.classList.toggle("disponible", this.lugarCercano !== null);

    const pidioAccion =
      entrada.tomarAccion() ||
      Phaser.Input.Keyboard.JustDown(t.SPACE) ||
      Phaser.Input.Keyboard.JustDown(t.E) ||
      Phaser.Input.Keyboard.JustDown(t.ENTER);
    if (pidioAccion) {
      if (this.lugarCercano) dialogo(this.lugarCercano.quien, this.lugarCercano.texto);
      else aviso("No hay nada cerca. Acércate a algo que brille.");
    }
  }

  /** Solo para pruebas: mueve al Chaski a una baldosa. */
  teletransportar(columna: number, fila: number) {
    this.chaski.setPosition(columna * TILE + 8, (fila + 1) * TILE - 2);
  }
  get estadoPrueba() {
    return { x: this.chaski.x, y: this.chaski.y, wayruru: this.recogidas, cerca: this.lugarCercano?.quien ?? null };
  }
}
