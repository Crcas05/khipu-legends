// Controles táctiles: joystick a la izquierda y botón de acción a la derecha.
// El juego lee "entrada" en cada cuadro. En PC también se usa el teclado (ver Selva.ts).

export const entrada = {
  x: 0, // -1 (izquierda) a 1 (derecha)
  y: 0, // -1 (arriba) a 1 (abajo)
  accionPendiente: false,
  /** Devuelve true una sola vez por cada toque del botón de acción. */
  tomarAccion(): boolean {
    const v = this.accionPendiente;
    this.accionPendiente = false;
    return v;
  },
};

const RADIO = 46; // radio del joystick en píxeles de pantalla

export function iniciarControles() {
  const zona = document.getElementById("zona-joystick")!;
  const base = document.getElementById("joystick")!;
  const perilla = document.getElementById("perilla")!;
  const botonAccion = document.getElementById("boton-accion")!;

  let dedo: number | null = null;
  let cx = 0;
  let cy = 0;

  const ubicarBase = (x: number, y: number) => {
    cx = x;
    cy = y;
    base.style.left = `${x - RADIO}px`;
    base.style.top = `${y - RADIO}px`;
  };
  const moverPerilla = (dx: number, dy: number) => {
    perilla.style.transform = `translate(${dx}px, ${dy}px)`;
  };
  const soltar = () => {
    dedo = null;
    entrada.x = 0;
    entrada.y = 0;
    moverPerilla(0, 0);
    base.classList.remove("activo");
    base.style.left = "";
    base.style.top = "";
  };

  zona.addEventListener("pointerdown", (e) => {
    if (dedo !== null) return;
    dedo = e.pointerId;
    zona.setPointerCapture(e.pointerId);
    ubicarBase(e.clientX, e.clientY);
    base.classList.add("activo");
    e.preventDefault();
  });
  zona.addEventListener("pointermove", (e) => {
    if (e.pointerId !== dedo) return;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const d = Math.hypot(dx, dy);
    if (d > RADIO) {
      dx = (dx / d) * RADIO;
      dy = (dy / d) * RADIO;
    }
    moverPerilla(dx, dy);
    // Zona muerta pequeña para que el personaje no tiemble
    const fuerza = Math.min(d, RADIO) / RADIO;
    entrada.x = fuerza < 0.15 ? 0 : dx / RADIO;
    entrada.y = fuerza < 0.15 ? 0 : dy / RADIO;
  });
  zona.addEventListener("pointerup", (e) => e.pointerId === dedo && soltar());
  zona.addEventListener("pointercancel", (e) => e.pointerId === dedo && soltar());

  botonAccion.addEventListener("pointerdown", (e) => {
    entrada.accionPendiente = true;
    botonAccion.classList.add("presionado");
    e.preventDefault();
  });
  const soltarBoton = () => botonAccion.classList.remove("presionado");
  botonAccion.addEventListener("pointerup", soltarBoton);
  botonAccion.addEventListener("pointerleave", soltarBoton);

  // Evita que el navegador haga zoom o desplace la página al tocar el juego
  document.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });
  document.addEventListener("contextmenu", (e) => e.preventDefault());
}
