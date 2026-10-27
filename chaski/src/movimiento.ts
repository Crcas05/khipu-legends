// Movimiento de acción: saltar, esquivar (rodar) y correr. Mientras Chaski está en el aire
// o esquivando, los ataques NO le hacen daño (¡como en un juego de acción de verdad!).

let alturaSalto = 0;
let velocidadY = 0;
let esquiveHasta = 0;
let esquiveListo = 0;
let ultimoMensaje = 0;

// Reloj del juego (avanza con cada cuadro), así un celular lento esquiva igual de lejos
let reloj = 0;
const ahora = () => reloj;

export const enElAire = () => alturaSalto > 0.45;
export const esquivando = () => ahora() < esquiveHasta;
/** ¿Los ataques fallan ahora? */
export const invulnerable = () => enElAire() || esquivando();

/** Llamar en cada daño: si Chaski esquivó, muestra "¡ESQUIVADO!" y devuelve true. */
export function esquivoElGolpe(): boolean {
  if (!invulnerable()) return false;
  if (performance.now() - ultimoMensaje > 600) {
    ultimoMensaje = performance.now();
    const f = document.createElement("div");
    f.className = "dano esquive";
    f.textContent = enElAire() ? "¡SALTÓ! 🦘" : "¡ESQUIVADO! 💨";
    document.body.appendChild(f);
    window.setTimeout(() => f.remove(), 1100);
  }
  return true;
}

export function saltar(): boolean {
  if (alturaSalto > 0.01) return false;
  velocidadY = 8.6;
  alturaSalto = 0.02;
  return true;
}

export function puedeEsquivar() {
  return ahora() >= esquiveListo;
}

export function empezarEsquive(): boolean {
  if (!puedeEsquivar()) return false;
  esquiveHasta = ahora() + 0.45;
  esquiveListo = ahora() + 0.9;
  return true;
}

/** Física del salto (cada cuadro). Devuelve la altura actual. */
export function actualizarSalto(dt: number): number {
  reloj += dt;
  if (alturaSalto <= 0) return 0;
  velocidadY -= 24 * dt;
  alturaSalto += velocidadY * dt;
  if (alturaSalto <= 0) {
    alturaSalto = 0;
    velocidadY = 0;
  }
  return alturaSalto;
}

export const alturaActual = () => alturaSalto;
