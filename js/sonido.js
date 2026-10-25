// Sonidos cortos generados por el navegador (sin archivos de audio que descargar).

let contexto = null;
let activado = true;

function ctx() {
  if (!contexto) {
    const Clase = window.AudioContext || window.webkitAudioContext;
    if (!Clase) return null;
    contexto = new Clase();
  }
  return contexto;
}

function tono(frecuencias, duracion, tipo = "sawtooth", volumen = 0.08) {
  if (!activado) return;
  const c = ctx();
  if (!c) return;
  const osc = c.createOscillator();
  const gan = c.createGain();
  osc.type = tipo;
  const t = c.currentTime;
  osc.frequency.setValueAtTime(frecuencias[0], t);
  if (frecuencias[1]) osc.frequency.exponentialRampToValueAtTime(frecuencias[1], t + duracion);
  gan.gain.setValueAtTime(0.0001, t);
  gan.gain.exponentialRampToValueAtTime(volumen, t + 0.05);
  gan.gain.exponentialRampToValueAtTime(0.0001, t + duracion);
  osc.connect(gan).connect(c.destination);
  osc.start(t);
  osc.stop(t + duracion + 0.05);
}

export const sonido = {
  pututu: () => tono([196, 233], 0.7, "sawtooth", 0.06),
  error: () => tono([220, 140], 0.25, "square", 0.04),
  victoria: () => {
    tono([262, 392], 0.4, "triangle", 0.08);
    setTimeout(() => tono([392, 523], 0.6, "triangle", 0.08), 250);
  },
  alternar() {
    activado = !activado;
    return activado;
  },
  get activado() {
    return activado;
  },
};
