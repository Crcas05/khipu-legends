// Sistema de sonido (Web Audio). La MELODÍA es una quena REAL: grabaciones de Ximena Núñez del
// Berklee Intersectional Soundbox Archive (licencia CC BY, ver Créditos). La percusión, el bordón
// y los efectos se sintetizan en el momento. Todo en la pentatónica de Mi (la de las grabaciones).

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
const TEMA_SEGUNDOS: Partial<Record<string, number>> = { andes: 110, altiplano: 110, selva: 110, costa: 100, feria: 90, cumbre: 110 };
let musicaActiva = false;

// Pentatónica menor en Mi (la escala del huayno y de las grabaciones de quena): Mi, Sol, La, Si, Re
const ESCALA = [220, 246.94, 293.66, 329.63, 392, 440, 493.88, 587.33, 659.25, 783.99, 880];

// ---------------------------------------------------------------------------
// Quena real: dos grabaciones divididas en frases (segundos de inicio y fin)
// ---------------------------------------------------------------------------
const FRASES: Record<"quena1" | "quena2", [number, number][]> = {
  quena1: [[0, 12.7], [13.2, 16.55], [17.1, 20.2], [20.7, 28.3], [29.05, 37.5], [37.95, 42.1], [42.5, 50.9], [51.35, 54.7]],
  quena2: [[0, 7.1], [7.7, 11.0], [11.4, 14.55], [15.65, 30.1], [30.75, 34.9], [35.4, 39.6]],
};
const buffers: Partial<Record<keyof typeof FRASES, AudioBuffer>> = {};
let cargandoQuena = false;
let reverb: ConvolverNode | null = null;

/** Descarga y decodifica la quena (una sola vez, después del primer toque). */
function cargarQuena() {
  const c = ctx;
  if (!c || cargandoQuena) return;
  cargandoQuena = true;
  const base = import.meta.env.BASE_URL ?? "./";
  for (const n of Object.keys(FRASES) as (keyof typeof FRASES)[]) {
    fetch(`${base}audio/${n}.mp3`)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
      .then((ab) => new Promise<AudioBuffer>((ok, mal) => c.decodeAudioData(ab, ok, mal)))
      .then((b) => (buffers[n] = b))
      .catch(() => {
        /* sin red: queda la quena sintetizada */
      });
  }
}

/** Sala con eco (cerros, templo, bosque): respuesta al impulso generada. */
function salaEco(c: AudioContext): ConvolverNode {
  if (reverb) return reverb;
  const seg = 2.6;
  const largo = Math.floor(c.sampleRate * seg);
  const ir = c.createBuffer(2, largo, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < largo; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / largo, 3.2);
  }
  reverb = c.createConvolver();
  reverb.buffer = ir;
  const g = c.createGain();
  g.gain.value = 0.55;
  reverb.connect(g).connect(musica!);
  return reverb;
}

/** Toca una frase real de quena. Devuelve cuánto dura (s) o 0 si aún no está cargada. */
function fraseQuena(opc: { velocidad?: number; volumen?: number; filtro?: number; eco?: number; en?: number; corta?: boolean; destino?: AudioNode } = {}): number {
  const c = ctx;
  if (!c || !musica) return 0;
  const listas = (Object.keys(FRASES) as (keyof typeof FRASES)[]).filter((n) => buffers[n]);
  if (!listas.length) return 0;
  const n = listas[Math.floor(Math.random() * listas.length)];
  const opciones = opc.corta ? FRASES[n].filter(([x, y]) => y - x < 4.6) : FRASES[n];
  const [a, b] = opciones[Math.floor(Math.random() * opciones.length)];
  const vel = opc.velocidad ?? 1;
  const dur = (b - a) / vel;
  const t = c.currentTime + (opc.en ?? 0);
  const src = c.createBufferSource();
  src.buffer = buffers[n]!;
  src.playbackRate.value = vel;
  const g = c.createGain();
  const vol = opc.volumen ?? 0.9;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.08);
  g.gain.setValueAtTime(vol, t + Math.max(0.1, dur - 0.35));
  g.gain.linearRampToValueAtTime(0, t + dur);
  let nodo: AudioNode = src;
  if (opc.filtro) {
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = opc.filtro;
    nodo = nodo.connect(f);
  }
  nodo.connect(g);
  g.connect(opc.destino ?? musica);
  if (opc.eco) {
    const e = c.createGain();
    e.gain.value = opc.eco;
    g.connect(e).connect(salaEco(c));
  }
  src.start(t, a, b - a);
  return dur;
}

/** Cómo suena la quena en cada estilo (velocidad, brillo, eco). */
const QUENA_ESTILO: Partial<Record<string, { velocidad: number; volumen: number; filtro?: number; eco: number }>> = {
  andes: { velocidad: 1, volumen: 0.9, eco: 0.35 },
  cumbre: { velocidad: 1, volumen: 0.85, eco: 0.6 },
  altiplano: { velocidad: 1, volumen: 0.85, eco: 0.45 },
  selva: { velocidad: 0.94, volumen: 0.75, filtro: 2600, eco: 0.55 },
  misterio: { velocidad: 0.84, volumen: 0.6, filtro: 2000, eco: 0.9 },
  batalla: { velocidad: 1.06, volumen: 1, eco: 0.25 },
  feria: { velocidad: 1.03, volumen: 0.8, eco: 0.2 },
  costa: { velocidad: 1, volumen: 0.55, filtro: 3200, eco: 0.3 },
};

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
  window.setTimeout(cargarQuena, 300);
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
    // Avisa al juego: alguien está soplando el pututo (Chaski lo lleva a la boca)
    window.dispatchEvent(new CustomEvent("pututu"));
    const c = iniciar();
    if (!c || !maestro) return;
    const t = c.currentTime;
    // Caracola marina: tono grave que sube, con vibrato del soplo y el "aire" de la concha
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.2, t + 0.18);
    g.gain.setValueAtTime(0.18, t + 1.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.9);
    const formante = c.createBiquadFilter();
    formante.type = "bandpass";
    formante.frequency.value = 520;
    formante.Q.value = 1.4;
    const vib = c.createOscillator();
    vib.frequency.value = 5.5;
    const vg = c.createGain();
    vg.gain.value = 2.2;
    vib.connect(vg);
    for (const [tipo, mult, vol] of [["sawtooth", 1, 0.9], ["square", 2, 0.25], ["sine", 0.5, 0.6]] as [OscillatorType, number, number][]) {
      const o = c.createOscillator();
      o.type = tipo;
      o.frequency.setValueAtTime(131 * mult, t);
      o.frequency.linearRampToValueAtTime(147 * mult, t + 0.3);
      o.frequency.setValueAtTime(147 * mult, t + 1.4);
      o.frequency.linearRampToValueAtTime(139 * mult, t + 1.85);
      vg.connect(o.frequency);
      const og = c.createGain();
      og.gain.value = vol;
      o.connect(og).connect(formante);
      o.start(t);
      o.stop(t + 2);
    }
    vib.start(t);
    vib.stop(t + 2);
    formante.connect(g).connect(maestro);
    ruido(0, 1.6, 0.04, 1400);
  },
  nivel() {
    sonido.pututu();
    // Festejo con una frase corta de quena real (si ya cargó)
    if (fraseQuena({ corta: true, en: 1.2, volumen: 0.8, eco: 0.4, destino: maestro ?? undefined }) > 0) return;
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
  ritmo: ("bombo" | "cajon" | "maraca" | "charango" | "tambor" | "manguare" | "quijada" | "-")[][]; // por compás: 8 corcheas
  ambiente: ("viento" | "aves" | "agua" | "olas" | "insectos" | "ranas")[];
  pausa: [number, number]; // silencio entre frases (s)
}

const RECETAS: Record<Estilo, Receta> = {
  // SIERRA: quena real + charango y bombo de huayno, bordón en Mi
  andes: { bpm: 84, bordon: 82.41, melodia: "quena", registro: 0, ritmo: [["bombo", "-", "charango", "charango", "-", "charango", "-", "-"]], ambiente: ["viento"], pausa: [2, 4] },
  altiplano: { bpm: 96, bordon: 82.41, melodia: "zampona", registro: -1, ritmo: [["bombo", "-", "charango", "charango", "bombo", "-", "charango", "-"]], ambiente: ["viento", "agua"], pausa: [1.5, 3] },
  cumbre: { bpm: 72, bordon: 82.41, melodia: "quena", registro: 2, ritmo: [["bombo", "-", "-", "-", "charango", "-", "-", "-"]], ambiente: ["viento", "aves"], pausa: [2.5, 4.5] },
  // SELVA: manguaré (tambor de tronco), maracas y el bosque; quena con sonido de caña
  selva: { bpm: 100, bordon: null, melodia: "flauta", registro: 1, ritmo: [["manguare", "-", "maraca", "-", "manguare", "manguare", "maraca", "-"]], ambiente: ["aves", "agua", "insectos", "ranas"], pausa: [3, 6] },
  misterio: { bpm: 66, bordon: 41.2, melodia: "flauta", registro: -1, ritmo: [["manguare", "-", "-", "-", "-", "-", "maraca", "-"], ["-", "-", "-", "-", "manguare", "-", "-", "-"]], ambiente: ["insectos", "ranas", "agua"], pausa: [4, 7] },
  // COSTA: cajón y quijada (ritmo de festejo), olas del Pacífico
  costa: { bpm: 112, bordon: 82.41, melodia: "quena", registro: -1, ritmo: [["cajon", "-", "quijada", "cajon", "-", "cajon", "maraca", "-"], ["cajon", "-", "maraca", "-", "cajon", "cajon", "quijada", "-"]], ambiente: ["olas", "viento"], pausa: [3, 6] },
  feria: { bpm: 112, bordon: 82.41, melodia: "quena", registro: 1, ritmo: [["cajon", "-", "maraca", "cajon", "-", "cajon", "maraca", "-"], ["cajon", "-", "maraca", "-", "cajon", "cajon", "maraca", "cajon"]], ambiente: [], pausa: [1, 2.5] },
  // PELEA: bombo y tambor rápidos + quena real
  batalla: { bpm: 138, bordon: 41.2, melodia: "quena", registro: 3, ritmo: [["bombo", "-", "tambor", "bombo", "bombo", "-", "tambor", "tambor"]], ambiente: [], pausa: [0.4, 1] },
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
  } else if (tipo === "manguare") {
    // Manguaré: tambor de tronco hueco de la Amazonía (dos tonos de madera)
    for (const [fr, v] of [[notaBase % 2 ? 196 : 147, 0.45], [notaBase % 2 ? 392 : 294, 0.12]] as [number, number][]) {
      const o = c.createOscillator();
      o.frequency.setValueAtTime(fr * 1.04, t);
      o.frequency.exponentialRampToValueAtTime(fr, t + 0.05);
      const gg = c.createGain();
      gg.gain.setValueAtTime(v, t);
      gg.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      o.connect(gg).connect(g);
      o.start(t);
      o.stop(t + 0.5);
    }
    g.gain.value = 1;
  } else if (tipo === "quijada") {
    // Quijada de burro (costa afroperuana): traqueteo de dientes
    for (let i = 0; i < 7; i++) {
      const n = c.createBufferSource();
      n.buffer = ruidoBuffer(c, 0.03);
      const f = c.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = 3200;
      const gg = c.createGain();
      const ti = t + i * 0.022;
      gg.gain.setValueAtTime(0.18 * (1 - i / 8), ti);
      gg.gain.exponentialRampToValueAtTime(0.0001, ti + 0.03);
      n.connect(f).connect(gg).connect(g);
      n.start(ti);
    }
    g.gain.value = 1;
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
    // Quena REAL si ya cargó (la zampoña del altiplano sigue sintetizada)
    const q = QUENA_ESTILO[estilo];
    if (q && r.melodia !== "zampona" && conTema()) {
      const d = fraseQuena(q);
      if (d > 0) {
        if (r.ambiente.includes("aves") && Math.random() < 0.6) window.setTimeout(cantarAve, Math.random() * 2000);
        if (r.ambiente.includes("ranas") && Math.random() < 0.7) window.setTimeout(croar, Math.random() * 2500);
        window.setTimeout(tocarFrase, (d + r.pausa[0] + Math.random() * (r.pausa[1] - r.pausa[0])) * 1000);
        return;
      }
    }
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
export function rugido(tipo: "felino" | "ave" | "serpiente" | "murcielago" | "zorro" | "jarjacha" = "felino") {
  const c = iniciar();
  if (!c || !maestro) return;
  const t = c.currentTime;
  if (tipo === "jarjacha") {
    // "¡Qar… qar… qar!": tres gritos ásperos y nasales en la neblina
    for (let i = 0; i < 3; i++) {
      const ti = t + i * 0.38;
      const o = c.createOscillator();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(260, ti);
      o.frequency.exponentialRampToValueAtTime(170, ti + 0.25);
      const bp = c.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 950;
      bp.Q.value = 3;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, ti);
      g.gain.exponentialRampToValueAtTime(0.22, ti + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, ti + 0.28);
      o.connect(bp).connect(g).connect(maestro);
      o.start(ti);
      o.stop(ti + 0.3);
    }
    return;
  }
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
