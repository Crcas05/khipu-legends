// Tuki, el gallito de las rocas: vuela siguiendo al Chaski.

import Phaser from "phaser";

export class Tuki extends Phaser.GameObjects.Sprite {
  private objetivo: Phaser.GameObjects.Sprite;
  private tiempo = 0;

  constructor(escena: Phaser.Scene, objetivo: Phaser.GameObjects.Sprite) {
    super(escena, objetivo.x - 14, objetivo.y - 22, "tuki", 0);
    this.objetivo = objetivo;
    escena.add.existing(this);
    this.play("tuki-volar");
  }

  seguir(delta: number) {
    this.tiempo += delta;
    const lado = this.objetivo.flipX ? 12 : -12;
    const destinoX = this.objetivo.x + lado;
    const destinoY = this.objetivo.y - 24 + Math.sin(this.tiempo / 260) * 2;
    this.x += (destinoX - this.x) * 0.08;
    this.y += (destinoY - this.y) * 0.08;
    this.setFlipX(destinoX > this.x + 1);
    this.setDepth(this.objetivo.depth + 1);
  }
}
