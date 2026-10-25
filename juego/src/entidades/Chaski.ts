// El protagonista: camina en 4 direcciones con animación.

import Phaser from "phaser";
import { VELOCIDAD_CHASKI } from "../config";

type Direccion = "abajo" | "arriba" | "izquierda" | "derecha";
const QUIETO: Record<Direccion, number> = { abajo: 0, arriba: 3, izquierda: 6, derecha: 6 };

export class Chaski extends Phaser.Physics.Arcade.Sprite {
  private direccion: Direccion = "abajo";
  private sombra: Phaser.GameObjects.Image;

  constructor(escena: Phaser.Scene, x: number, y: number) {
    super(escena, x, y, "chaski", 0);
    escena.add.existing(this);
    escena.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    // El cuerpo físico son solo los pies: así puede pasar "detrás" de los árboles
    const cuerpo = this.body as Phaser.Physics.Arcade.Body;
    cuerpo.setSize(10, 5).setOffset(3, 15);
    cuerpo.setCollideWorldBounds(true);
    this.sombra = escena.add.image(x, y, "sombra").setOrigin(0.5, 0.6);
  }

  /** Mueve al Chaski según la dirección pedida (valores de -1 a 1). */
  mover(dx: number, dy: number) {
    const largo = Math.hypot(dx, dy);
    if (largo > 1) {
      dx /= largo;
      dy /= largo;
    }
    this.setVelocity(dx * VELOCIDAD_CHASKI, dy * VELOCIDAD_CHASKI);

    if (largo < 0.1) {
      this.anims.stop();
      this.setFrame(QUIETO[this.direccion]);
    } else {
      if (Math.abs(dx) > Math.abs(dy)) this.direccion = dx > 0 ? "derecha" : "izquierda";
      else this.direccion = dy > 0 ? "abajo" : "arriba";
      const anim = this.direccion === "abajo" ? "caminar-abajo" : this.direccion === "arriba" ? "caminar-arriba" : "caminar-lado";
      this.setFlipX(this.direccion === "izquierda");
      this.anims.play(anim, true);
      // Camina más rápido o más lento según cuánto se empuje el joystick
      this.anims.timeScale = 0.6 + Math.min(largo, 1) * 0.6;
    }

    // Lo que está más abajo en la pantalla se dibuja delante
    this.setDepth(this.y);
    this.sombra.setPosition(this.x, this.y).setDepth(this.y - 1);
  }

  get mirando(): Direccion {
    return this.direccion;
  }
}
