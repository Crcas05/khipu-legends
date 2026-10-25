// Primera escena: prepara el arte y las animaciones, y luego abre la selva.

import Phaser from "phaser";
import { crearArte } from "../arte/texturas";

export class Arranque extends Phaser.Scene {
  constructor() {
    super("arranque");
  }

  create() {
    crearArte(this);
    document.getElementById("cargando")?.remove();
    this.scene.start("selva");
  }
}
