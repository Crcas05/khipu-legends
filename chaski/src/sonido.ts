// Sistema de sonido sintetizado en el momento (Web Audio): no descarga archivos.
// Usa la escala pentatónica andina (la de la quena y el siku) para que todo suene a los Andes.

let ctx: AudioContext | null = null;
let maestro: GainNode | null = null;
let musica: GainNode | null = null;
let silenciado = false;
let musicaActiva = false;

// Pentatónica menor en La (la escala del huayno): La, Do, Re, Mi, Sol
const ESCALA = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25, 783.99, 880];

try {
  silenciado = localStorage.getItem("chaski-silencio") === "1";
} catch {
  /* sin almacenamiento */
}

function iniciar(): AudioContext | null {
  if (ctx) return ctx;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  maestro = ctx.createGain();
  maestro.gain.value = silenciado ? 0 : 0.7;
  maestro.connect(ctx.destination);
  musica = ctx.createGain();
  musica.gain.value = 0.22;
  musica.connect(maestro);
  return ctx;
}

/** Los navegadores solo dejan sonar después de un toque del jugador. */
export function despertarAudio() {
  const c = iniciar();
  if (c && c.state === "suspended") c.resume();
}

export function alternarSilencio(): boolean {
  silenciado = !silenciado;
  try {
    localStorage.setItem("chaski-silencio", silenciado ? "1" : "0");
  } catch {
    /* ignorar */
  }
  if (maestro && ctx) maestro.gain.setTargetAtTime(silenciado ? 0 : 0.7, ctx.currentTime, 0.05);
  return silenciado;
}
export const estaSilenciado = () => silenciado;

/** Una nota con timbre de quena: seno + soplo + vibrato suave. */
function quena(frecuencia: number, inicio: number, duracion: number, volumen = 0.25, destino?: AudioNode) {
  const c = iniciar();
  if (!c || !maestro) return;
  const t = c.currentTime + inicio;
  const osc = c.createOscillator();
  osc.type = "sine";
  osc.frequency.value = frecuencia;
  const vib = c.createOscillator();
  vib.frequency.value = 5.5;
  const vibGanancia = c.createGain();
  vibGanancia.gain.value = frecuencia * 0.008;
  vib.connect(vibGanancia).connect(osc.frequency);
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(volumen, t + 0.04);
  g.gain.setValueAtTime(volumen * 0.85, t + duracion * 0.7);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duracion);
  osc.connect(g).connect(destino ?? maestro);
  osc.start(t);
  vib.start(t);
  osc.stop(t + duracion + 0.05);
  vib.stop(t + duracion + 0.05);
}

function ruido(inicio: number, duracion: number, volumen: number, filtro: number, tipo: BiquadFilterType = "bandpass") {
  const c = iniciar();
  if (!c || !maestro) return;
  const t = c.currentTime + inicio;
  const largo = Math.floor(c.sampleRate * duracion);
  const buffer = c.createBuffer(1, largo, c.sampleRate);
  const datos = buffer.getChannelData(0);
  for (let i = 0; i < largo; i++) datos[i] = Math.random() * 2 - 1;
  const fuente = c.createBufferSource();
  fuente.buffer = buffer;
  const f = c.createBiquadFilter();
  f.type = tipo;
  f.frequency.value = filtro;
  const g = c.createGain();
  g.gain.setValueAtTime(volumen, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duracion);
  fuente.connect(f).connect(g).connect(maestro);
  fuente.start(t);
}

function tono(frecuencia: number, inicio: number, duracion: number, tipo: OscillatorType, volumen: number, hasta?: number) {
  const c = iniciar();
  if (!c || !maestro) return;
  const t = c.currentTime + inicio;
  const osc = c.createOscillator();
  osc.type = tipo;
  osc.frequency.setValueAtTime(frecuencia, t);
  if (hasta) osc.frequency.exponentialRampToValueAtTime(hasta, t + duracion);
  const g = c.createGain();
  g.gain.setValueAtTime(volumen, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duracion);
  osc.connect(g).connect(maestro);
  osc.start(t);
  osc.stop(t + duracion + 0.02);
}

export const sonido = {
  toque() {
    tono(880, 0, 0.06, "triangle", 0.12);
  },
  letra() {
    tono(500 + Math.random() * 120, 0, 0.03, "square", 0.015);
  },
  acierto() {
    [4, 6, 8].forEach((n, i) => quena(ESCALA[n], i * 0.09, 0.35, 0.22));
  },
  error() {
    tono(196, 0, 0.18, "sawtooth", 0.06, 150);
    tono(185, 0.12, 0.22, "sawtooth", 0.05, 140);
  },
  ojo(abrir: boolean) {
    tono(abrir ? 300 : 900, 0, 0.35, "sine", 0.12, abrir ? 900 : 300);
    ruido(0, 0.3, 0.05, abrir ? 2000 : 800);
  },
  reparar() {
    ruido(0, 0.6, 0.08, 1200);
    [3, 4, 6, 7, 9].forEach((n, i) => quena(ESCALA[n], 0.05 + i * 0.08, 0.5, 0.18));
  },
  agua() {
    for (let i = 0; i < 6; i++) tono(700 + Math.random() * 600, i * 0.07, 0.12, "sine", 0.05, 300 + Math.random() * 200);
    ruido(0, 1.2, 0.05, 3000, "highpass");
  },
  kallpa() {
    tono(660, 0, 0.08, "triangle", 0.1);
    tono(990, 0.07, 0.12, "triangle", 0.1);
  },
  tesoro() {
    [5, 7, 9, 10].forEach((n, i) => tono(ESCALA[n], i * 0.06, 0.25, "triangle", 0.1));
  },
  /** El pututu (caracola andina): anuncia algo importante. */
  pututu() {
    const c = iniciar();
    if (!c || !maestro) return;
    const t = c.currentTime;
    const osc = c.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(147, t);
    osc.frequency.linearRampToValueAtTime(165, t + 0.25);
    osc.frequency.setValueAtTime(165, t + 1.1);
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 700;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.18, t + 0.15);
    g.gain.setValueAtTime(0.16, t + 1.0);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
    osc.connect(f).connect(g).connect(maestro);
    osc.start(t);
    osc.stop(t + 1.6);
  },
  nivel() {
    sonido.pututu();
    const frase = [5, 6, 7, 9, 7, 9, 10];
    frase.forEach((n, i) => quena(ESCALA[n], 0.9 + i * 0.16, i === frase.length - 1 ? 0.9 : 0.22, 0.22));
  },
};

/** Música de fondo: frases de quena en pentatónica sobre un bordón suave. Se genera sola, nunca se repite igual. */
export function iniciarMusica() {
  const c = iniciar();
  if (!c || !musica || musicaActiva) return;
  musicaActiva = true;
  // Bordón (como el de un charango lejano)
  const bordon = c.createOscillator();
  bordon.type = "triangle";
  bordon.frequency.value = 110;
  const gb = c.createGain();
  gb.gain.value = 0.18;
  const fb = c.createBiquadFilter();
  fb.type = "lowpass";
  fb.frequency.value = 400;
  bordon.connect(fb).connect(gb).connect(musica);
  bordon.start();
  let paso = 4;
  const tocarFrase = () => {
    if (!musicaActiva) return;
    let t = 0;
    const notas = 4 + Math.floor(Math.random() * 4);
    for (let i = 0; i < notas; i++) {
      paso = Math.max(0, Math.min(ESCALA.length - 1, paso + [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)]));
      const dur = [0.35, 0.35, 0.7, 1.05][Math.floor(Math.random() * 4)];
      quena(ESCALA[paso], t, dur * 0.95, 0.5, musica!);
      t += dur;
    }
    if (paso > 6) paso = 4;
    window.setTimeout(tocarFrase, (t + 1.5 + Math.random() * 2.5) * 1000);
  };
  window.setTimeout(tocarFrase, 1200);
}

/** Baja la música mientras hay diálogo o retos, para no distraer. */
export function musicaSuave(suave: boolean) {
  if (musica && ctx) musica.gain.setTargetAtTime(suave ? 0.08 : 0.22, ctx.currentTime, 0.3);
}
