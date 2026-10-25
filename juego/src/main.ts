// Punto de entrada de «Khipu: Guardianes del Código».

import Phaser from "phaser";
import "./estilos.css";
import { ANCHO, ALTO } from "./config";
import { Arranque } from "./escenas/Arranque";
import { Selva } from "./escenas/Selva";
import { iniciarControles } from "./ui/controles";
import { iniciarHud } from "./ui/hud";

iniciarControles();
iniciarHud();

const verChoques = new URLSearchParams(location.search).has("choques");

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "juego",
  width: ANCHO,
  height: ALTO,
  pixelArt: true,
  roundPixels: true,
  backgroundColor: "#1d1a39",
  physics: { default: "arcade", arcade: { gravity: { x: 0, y: 0 }, debug: verChoques } },
  scale: { mode: Phaser.Scale.EXPAND, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [Arranque, Selva],
});
