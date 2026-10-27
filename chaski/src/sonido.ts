// Sistema de sonido sintetizado en el momento (Web Audio): no descarga archivos.
// Usa la escala pentatónica andina (la de la quena y el siku) para que todo suene a los Andes.

let ctx: AudioContext | null = null;
let maestro: GainNode | null = null;
let musica: GainNode | null = null;
let silenciado = false;
/** Música apagada (los efectos y el ambiente siguen). */
let sinMusica = (() => {
  try {
    return localStorage.getItem("chaski-sin-musica") === "1";
  } catch {
    return false;
  }
})();
const VOL_MUSICA = 0.36;
/** Hasta cuándo suena el tema (melodía, ritmo y bordón). Después queda solo el ambiente. */
let temaHasta = 0;
const TEMA_SEGUNDOS: Partial<Record<string, number>> = { andes: 55, altiplano: 55, selva: 55, costa: 55, feria: 60, cumbre: 55 };
let musicaActiva = false;

// Pentatónica menor en La (la escala del huayno): La, Do, Re, Mi, Sol
const ESCALA = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25, 783.99, 880];

try {
  silenciado = localStorage.getItem("chaski-silencio") === "1";
  sinMusica = localStorage.getItem("chaski-sin-musica") === "1";
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
  musica.gain.value = sinMusica ? 0 : VOL_MUSICA;
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
export const musicaApagada = () => sinMusica;
export function alternarMusica(): boolean {
  sinMusica = !sinMusica;
  try {
    localStorage.setItem("chaski-sin-musica", sinMusica ? "1" : "0");
  } catch {
    /* ignorar */
  }
  if (musica && ctx) musica.gain.setTargetAtTime(sinMusica ? 0 : VOL_MUSICA, ctx.currentTime, 0.1);
  return sinMusica;
}
const conTema = () => !!ctx && ctx.currentTime < temaHasta;

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
  /** Impulso del salto. */
  salto() {
    ruido(0, 0.18, 0.06, 900);
    tono(260, 0, 0.16, "sine", 0.06, 420);
  },
  /** Aterrizaje sobre la tierra. */
  aterrizar() {
    ruido(0, 0.12, 0.08, 220, "lowpass");
  },
  /** Silbido de la esquiva/rodada. */
  esquive() {
    ruido(0, 0.28, 0.07, 1800);
  },
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

// =============================================================================
// Música por estilo: cada región tiene sus instrumentos (todo sintetizado, original)
// =============================================================================
export type Estilo = "andes" | "altiplano" | "selva" | "costa" | "feria" | "cumbre" | "batalla" | "misterio";
let estilo: Estilo = "andes";
let generacion = 0;
let fuentesAmbiente: AudioScheduledSourceNode[] = [];

interface Receta {
  bpm: number;
  bordon: number | null; // frecuencia del bordón (null = sin bordón)
  melodia: "quena" | "zampona" | "flauta" | null;
  registro: number; // desplazamiento en la escala
  ritmo: ("bombo" | "cajon" | "maraca" | "charango" | "tambor" | "-")[][]; // por compás: 8 corcheas
  ambiente: ("viento" | "aves" | "agua" | "olas" | "insectos" | "ranas")[];
  pausa: [number, number]; // silencio entre frases (s)
}

const RECETAS: Record<Estilo, Receta> = {
  andes: { bpm: 84, bordon: 110, melodia: "quena", registro: 0, ritmo: [["charango", "-", "-", "charango", "-", "charango", "-", "-"]], ambiente: ["viento"], pausa: [1.5, 3] },
  altiplano: { bpm: 96, bordon: 98, melodia: "zampona", registro: -1, ritmo: [["bombo", "-", "charango", "charango", "bombo", "-", "charango", "-"]], ambiente: ["viento", "agua"], pausa: [1, 2.5] },
  selva: { bpm: 100, bordon: null, melodia: "flauta", registro: 1, ritmo: [["tambor", "-", "maraca", "-", "tambor", "tambor", "maraca", "-"]], ambiente: ["aves", "agua", "insectos", "ranas"], pausa: [2, 4] },
  misterio: { bpm: 66, bordon: 61.7, melodia: "flauta", registro: -1, ritmo: [["tambor", "-", "-", "-", "-", "-", "maraca", "-"], ["-", "-", "-", "-", "tambor", "-", "-", "-"]], ambiente: ["insectos", "ranas", "agua"], pausa: [3, 6] },
  costa: { bpm: 88, bordon: 82, melodia: "quena", registro: -1, ritmo: [["cajon", "-", "-", "maraca", "cajon", "-", "maraca", "-"]], ambiente: ["olas", "viento"], pausa: [2, 4] },
  feria: { bpm: 112, bordon: 110, melodia: "quena", registro: 1, ritmo: [["cajon", "-", "maraca", "cajon", "-", "cajon", "maraca", "-"], ["cajon", "-", "maraca", "-", "cajon", "cajon", "maraca", "cajon"]], ambiente: [], pausa: [0.8, 2] },
  cumbre: { bpm: 72, bordon: 73.4, melodia: "quena", registro: 2, ritmo: [["bombo", "-", "-", "-", "charango", "-", "-", "-"]], ambiente: ["viento", "aves"], pausa: [2, 3.5] },
  batalla: { bpm: 138, bordon: 55, melodia: "quena", registro: 3, ritmo: [["bombo", "-", "tambor", "bombo", "bombo", "-", "tambor", "tambor"]], ambiente: [], pausa: [0.3, 0.8] },
};

function ruidoBuffer(c: AudioContext, segundos: number) {
  const b = c.createBuffer(1, Math.floor(c.sampleRate * segundos), c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

/** Golpe de percusión o rasgueo, en el bus de música. */
function percusion(tipo: string, t: number, notaBase: number) {
  const c = ctx;
  if (!c || !musica) return;
  const g = c.createGain();
  g.connect(musica);
  if (tipo === "bombo" || tipo === "tambor") {
    const o = c.createOscillator();
    o.frequency.setValueAtTime(tipo === "bombo" ? 95 : 180, t);
    o.frequency.exponentialRampToValueAtTime(tipo === "bombo" ? 42 : 90, t + 0.18);
    g.gain.setValueAtTime(tipo === "bombo" ? 0.7 : 0.35, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    o.connect(g);
    o.start(t);
    o.stop(t + 0.32);
  } else if (tipo === "cajon" || tipo === "maraca") {
    const n = c.createBufferSource();
    n.buffer = ruidoBuffer(c, 0.2);
    const f = c.createBiquadFilter();
    f.type = tipo === "cajon" ? "lowpass" : "highpass";
    f.frequency.value = tipo === "cajon" ? 900 : 5000;
    g.gain.setValueAtTime(tipo === "cajon" ? 0.55 : 0.12, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (tipo === "cajon" ? 0.14 : 0.06));
    n.connect(f).connect(g);
    n.start(t);
    if (tipo === "cajon") percusion("tambor", t, notaBase);
  } else if (tipo === "charango") {
    // Rasgueo: 3 cuerdas pulsadas casi a la vez
    g.gain.value = 0.16;
    [0, 2, 4].forEach((k, i) => {
      const o = c.createOscillator();
      o.type = "triangle";
      o.frequency.value = ESCALA[Math.min(ESCALA.length - 1, notaBase + k)] * 2;
      const gg = c.createGain();
      const ti = t + i * 0.015;
      gg.gain.setValueAtTime(0.5, ti);
      gg.gain.exponentialRampToValueAtTime(0.0001, ti + 0.35);
      o.connect(gg).connect(g);
      o.start(ti);
      o.stop(ti + 0.4);
    });
  }
}

/** Zampoña: dos tubos levemente desafinados y el soplo del aire. */
function zampona(f: number, inicio: number, dur: number) {
  const c = ctx;
  if (!c || !musica) return;
  const t = c.currentTime + inicio;
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.32, t + 0.06);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(musica);
  for (const d of [0, 3]) {
    const o = c.createOscillator();
    o.frequency.value = f + d;
    o.connect(g);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
  const n = c.createBufferSource();
  n.buffer = ruidoBuffer(c, 0.25);
  const bf = c.createBiquadFilter();
  bf.type = "bandpass";
  bf.frequency.value = f * 2;
  const gn = c.createGain();
  gn.gain.setValueAtTime(0.25, t);
  gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
  n.connect(bf).connect(gn).connect(musica);
  n.start(t);
}

function ambiente(tipos: Receta["ambiente"]) {
  const c = ctx;
  if (!c || !musica) return;
  for (const f of fuentesAmbiente) {
    try {
      f.stop();
    } catch {
      /* ya detenida */
    }
  }
  fuentesAmbiente = [];
  for (const tipo of tipos) {
    if (tipo === "insectos") {
      // Chicharras y grillos de la noche amazónica: ruido agudo que vibra
      const n = c.createBufferSource();
      n.buffer = ruidoBuffer(c, 4);
      n.loop = true;
      const f = c.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = 5200;
      f.Q.value = 9;
      const g = c.createGain();
      g.gain.value = 0.03;
      const lfo = c.createOscillator();
      lfo.frequency.value = 17;
      const lg = c.createGain();
      lg.gain.value = 0.025;
      lfo.connect(lg).connect(g.gain);
      n.connect(f).connect(g).connect(musica);
      n.start();
      lfo.start();
      fuentesAmbiente.push(n, lfo);
      continue;
    }
    if (tipo === "viento" || tipo === "agua" || tipo === "olas") {
      const n = c.createBufferSource();
      n.buffer = ruidoBuffer(c, 4);
      n.loop = true;
      const f = c.createBiquadFilter();
      f.type = tipo === "agua" ? "highpass" : "lowpass";
      f.frequency.value = tipo === "viento" ? 500 : tipo === "agua" ? 3500 : 700;
      const g = c.createGain();
      g.gain.value = tipo === "viento" ? 0.1 : tipo === "agua" ? 0.035 : 0.12;
      // Olas y viento suben y bajan lentamente
      const lfo = c.createOscillator();
      lfo.frequency.value = tipo === "olas" ? 0.12 : 0.07;
      const lg = c.createGain();
      lg.gain.value = g.gain.value * 0.8;
      lfo.connect(lg).connect(g.gain);
      n.connect(f).connect(g).connect(musica);
      n.start();
      lfo.start();
      fuentesAmbiente.push(n, lfo);
    }
  }
}

/** Croar de rana (selva). */
function croar() {
  const c = ctx;
  if (!c || !musica) return;
  const t = c.currentTime;
  const base = 180 + Math.random() * 160;
  for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) {
    const o = c.createOscillator();
    o.type = "square";
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 900;
    const g = c.createGain();
    const ti = t + i * 0.22;
    o.frequency.setValueAtTime(base, ti);
    o.frequency.exponentialRampToValueAtTime(base * 0.7, ti + 0.12);
    g.gain.setValueAtTime(0.0001, ti);
    g.gain.exponentialRampToValueAtTime(0.06, ti + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ti + 0.15);
    o.connect(f).connect(g).connect(musica);
    o.start(ti);
    o.stop(ti + 0.17);
  }
}

/** Motivos originales (índices de la escala pentatónica) para que la música tenga frases reconocibles. */
const MOTIVOS: Partial<Record<Estilo, number[][]>> = {
  andes: [[4, 5, 6, 5, 4, 3, 4], [6, 7, 6, 5, 4, 4], [3, 4, 5, 6, 5, 3, 4]],
  altiplano: [[3, 3, 4, 5, 4, 3, 2, 3], [5, 6, 5, 4, 3, 3]],
  selva: [[6, 7, 8, 7, 6, 5], [5, 6, 5, 7, 6, 5]],
  misterio: [[3, 2, 3, 5, 3], [4, 3, 2, 1], [2, 3, 2]],
  batalla: [[7, 7, 8, 7, 6, 7], [6, 7, 8, 9, 8, 7]],
};

function cantarAve() {
  const c = ctx;
  if (!c || !musica) return;
  const t = c.currentTime;
  const base = 1800 + Math.random() * 1600;
  for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) {
    const o = c.createOscillator();
    const g = c.createGain();
    const ti = t + i * 0.13;
    o.frequency.setValueAtTime(base, ti);
    o.frequency.exponentialRampToValueAtTime(base * 1.6, ti + 0.08);
    g.gain.setValueAtTime(0.05, ti);
    g.gain.exponentialRampToValueAtTime(0.0001, ti + 0.1);
    o.connect(g).connect(musica);
    o.start(ti);
    o.stop(ti + 0.12);
  }
}

let bordonNodo: OscillatorNode | null = null;

/** Música de fondo: melodía, ritmo y ambiente según el estilo. Se genera sola, nunca se repite igual. */
export function iniciarMusica(nuevo?: Estilo) {
  const c = iniciar();
  if (!c || !musica) return;
  if (nuevo) estilo = nuevo;
  if (musicaActiva && !nuevo) return;
  musicaActiva = true;
  const gen = ++generacion;
  const r = RECETAS[estilo];
  // Escenas: la música de exploración suena un rato al llegar y luego queda el ambiente.
  // Batallas, jefes y misterio suenan mientras dure la escena.
  const dur = TEMA_SEGUNDOS[estilo];
  temaHasta = dur ? c.currentTime + dur : Infinity;
  // Bordón
  bordonNodo?.stop();
  bordonNodo = null;
  if (r.bordon) {
    const o = c.createOscillator();
    o.type = "triangle";
    o.frequency.value = r.bordon;
    const g = c.createGain();
    g.gain.value = 0.16;
    if (isFinite(temaHasta)) g.gain.setTargetAtTime(0, temaHasta - 2, 1.5);
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 400;
    o.connect(f).connect(g).connect(musica);
    o.start();
    bordonNodo = o;
  }
  ambiente(r.ambiente);
  // Ritmo: se agenda compás por compás
  const corchea = 30 / r.bpm;
  let compas = 0;
  let proximo = c.currentTime + 0.2;
  const ritmo = () => {
    if (gen !== generacion || !ctx) return;
    while (proximo < ctx.currentTime + 0.6) {
      const patron = r.ritmo[compas % r.ritmo.length];
      if (proximo < temaHasta) patron.forEach((golpe, i) => golpe !== "-" && percusion(golpe, proximo + i * corchea, 3 + r.registro));
      proximo += corchea * 8;
      compas++;
    }
    window.setTimeout(ritmo, 200);
  };
  ritmo();
  // Melodía
  let paso = 4 + r.registro;
  const tocarFrase = () => {
    if (gen !== generacion) return;
    let t = 0;
    const motivos = MOTIVOS[estilo];
    const motivo = motivos && Math.random() < 0.55 ? motivos[Math.floor(Math.random() * motivos.length)] : null;
    const notas = motivo ? motivo.length : 4 + Math.floor(Math.random() * 4);
    for (let i = 0; i < notas && r.melodia && conTema(); i++) {
      paso = motivo ? Math.max(0, Math.min(ESCALA.length - 1, motivo[i])) : Math.max(0, Math.min(ESCALA.length - 1, paso + [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)]));
      const dur = (estilo === "batalla" ? [0.5, 0.5, 1] : [1, 1, 2, 3])[Math.floor(Math.random() * (estilo === "batalla" ? 3 : 4))] * corchea;
      if (r.melodia === "zampona") zampona(ESCALA[paso], t, dur * 0.95);
      else quena(ESCALA[paso] * (r.melodia === "flauta" ? 2 : 1), t, dur * 0.95, r.melodia === "flauta" ? 0.32 : 0.5, musica!);
      t += dur;
    }
    if (paso > 7 + Math.max(0, r.registro)) paso = 4 + r.registro;
    if (r.ambiente.includes("aves") && Math.random() < 0.6) window.setTimeout(cantarAve, Math.random() * 2000);
    if (r.ambiente.includes("ranas") && Math.random() < 0.7) window.setTimeout(croar, Math.random() * 2500);
    window.setTimeout(tocarFrase, (t + r.pausa[0] + Math.random() * (r.pausa[1] - r.pausa[0])) * 1000);
  };
  window.setTimeout(tocarFrase, 900);
}

/** Cambia el estilo de la música (por zona o al empezar una batalla). */
export function cambiarMusica(nuevo: Estilo, repetirTema = false) {
  if (nuevo === estilo && musicaActiva && !repetirTema) return;
  if (!musicaActiva) {
    estilo = nuevo;
    return;
  }
  iniciarMusica(nuevo);
}
export const estiloMusica = () => estilo;

/** Alarma de amenaza: el Bug avanza. */
export function alarma() {
  const c = iniciar();
  if (!c || !maestro) return;
  for (let i = 0; i < 3; i++) tono(880, i * 0.3, 0.2, "square", 0.06, 440);
}

/** Baja la música mientras hay diálogo o retos, para no distraer. */
export function musicaSuave(suave: boolean) {
  if (musica && ctx) musica.gain.setTargetAtTime(sinMusica ? 0 : suave ? 0.12 : VOL_MUSICA, ctx.currentTime, 0.3);
}

// ---------------------------------------------------------------------------
// Clima: trueno, lluvia y granizo (sintetizados)
// ---------------------------------------------------------------------------
let lluviaNodo: { fuente: AudioBufferSourceNode; ganancia: GainNode } | null = null;

/** Trueno: estallido grave que retumba (cerca = fuerte e inmediato). */
export function trueno(cerca = true) {
  const c = iniciar();
  if (!c || !maestro) return;
  const t = c.currentTime + (cerca ? 0.05 : 0.6 + Math.random() * 0.8);
  const n = c.createBufferSource();
  n.buffer = ruidoBuffer(c, 3);
  const f = c.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.setValueAtTime(cerca ? 900 : 400, t);
  f.frequency.exponentialRampToValueAtTime(90, t + 2.5);
  const g = c.createGain();
  const v = cerca ? 0.75 : 0.35;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(v, t + 0.04);
  g.gain.setValueAtTime(v * 0.6, t + 0.3);
  g.gain.exponentialRampToValueAtTime(v * 0.5, t + 0.6);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 2.8);
  n.connect(f).connect(g).connect(maestro);
  n.start(t);
  n.stop(t + 3);
}

/** Lluvia (o granizo) continua: 0 = nada, 1 = aguacero. */
export function lluviaSonido(intensidad: number, granizo = false) {
  const c = iniciar();
  if (!c || !maestro) return;
  if (!lluviaNodo && intensidad > 0) {
    const fuente = c.createBufferSource();
    fuente.buffer = ruidoBuffer(c, 4);
    fuente.loop = true;
    const f = c.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = granizo ? 2500 : 1200;
    const ganancia = c.createGain();
    ganancia.gain.value = 0;
    fuente.connect(f).connect(ganancia).connect(maestro);
    fuente.start();
    lluviaNodo = { fuente, ganancia };
  }
  if (!lluviaNodo) return;
  lluviaNodo.ganancia.gain.setTargetAtTime(intensidad * (granizo ? 0.22 : 0.16), c.currentTime, 0.8);
  if (intensidad <= 0) {
    const n = lluviaNodo;
    lluviaNodo = null;
    window.setTimeout(() => {
      try {
        n.fuente.stop();
      } catch {
        /* ya detenida */
      }
    }, 3000);
  }
}

/** Rugido grave (felino) o graznido para los animales corrompidos. */
export function rugido(tipo: "felino" | "ave" | "serpiente" | "murcielago" | "zorro" = "felino") {
  const c = iniciar();
  if (!c || !maestro) return;
  const t = c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  const f = c.createBiquadFilter();
  f.type = "lowpass";
  if (tipo === "felino") {
    o.type = "sawtooth";
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(70, t + 0.7);
    f.frequency.value = 600;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.3, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
  } else if (tipo === "ave") {
    o.type = "square";
    o.frequency.setValueAtTime(1300, t);
    o.frequency.exponentialRampToValueAtTime(600, t + 0.35);
    f.frequency.value = 2500;
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
  } else if (tipo === "serpiente") {
    const n = c.createBufferSource();
    n.buffer = ruidoBuffer(c, 1);
    const hf = c.createBiquadFilter();
    hf.type = "highpass";
    hf.frequency.value = 3000;
    const gn = c.createGain();
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(0.16, t + 0.1);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    n.connect(hf).connect(gn).connect(maestro);
    n.start(t);
    n.stop(t + 1);
    return;
  } else if (tipo === "murcielago") {
    o.type = "sine";
    o.frequency.setValueAtTime(3200, t);
    o.frequency.exponentialRampToValueAtTime(2200, t + 0.12);
    f.frequency.value = 5000;
    g.gain.setValueAtTime(0.06, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
  } else {
    o.type = "triangle";
    o.frequency.setValueAtTime(700, t);
    o.frequency.exponentialRampToValueAtTime(1100, t + 0.15);
    o.frequency.exponentialRampToValueAtTime(500, t + 0.4);
    f.frequency.value = 2000;
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
  }
  o.connect(f).connect(g).connect(maestro);
  o.start(t);
  o.stop(t + 1);
}
