// Misiones de Chaski Runes: alguien del pueblo te encarga una misión, viajas a otro escenario,
// exploras y peleas, y al final enfrentas al jefe en un DUELO DE RUNAS: tu código mueve a Chaski.
// Cada ronda sube la dificultad: bloques → completar → código libre.

import type { Linea } from "./episodio1";

export type ModoRonda = "bloques" | "completar" | "libre";

export interface Ronda {
  modo: ModoRonda;
  titulo: string;
  /** Qué debe lograr (HTML corto). */
  enunciado: string;
  /** Teoría en una frase. */
  teoria: string;
  /** Piezas para tocar (en modo bloques, cada toque agrega una línea). */
  bloques: string[];
  /** Código inicial del editor (con ___ para completar). */
  plantilla: string;
  /** Python que prepara la ronda (estado del enemigo, listas...). */
  preludio: string;
  /** Python que revisa: llama a _falla("...") si algo no está bien. */
  comprobar: string;
  solucion: string;
  pista: string;
}

export interface Mision {
  id: string;
  numero: number;
  nombre: string;
  icono: string;
  lugar: string;
  ambiente: "costa" | "templo" | "puna" | "selva";
  /** Quién la encarga en el pueblo. */
  quien: "mama" | "sisa" | "yachaq";
  pedido: Linea[];
  amenaza: string;
  aprendes: string;
  dificultad: 1 | 2 | 3;
  recompensa: number;
  logro: string;
  exploracion: { tipo: "recoger" | "proteger" | "semillas" | "rescatar"; total: number; objetivo: string; item: string };
  jefe: { nombre: string; tipo: "bug" | "chullachaqui"; color: string; tiempoAtaque: number; llega: Linea[]; derrota: Linea[] };
  rondas: Ronda[];
  ficha: { nombre: string; icono: string; dato: string };
}

/** Motor del duelo (Python): las funciones que mueven a Chaski y guardan cada acción. */
export const MOTOR_DUELO = String.raw`
import json as _json
_acciones = []
def _accion(**k):
    _acciones.append(k)
    if len(_acciones) > 60:
        raise RuntimeError("¡Demasiadas acciones! Revisa que tu bucle termine.")
class Enemigo:
    def __init__(self, nombre, vida, escudo=False):
        self.nombre = nombre
        self.vida = vida
        self.escudo = escudo
    def __repr__(self):
        return f"Enemigo({self.nombre!r}, vida={self.vida}, escudo={self.escudo})"
enemigo = Enemigo("Bug", 30)
_golpe = 10
_recuperadas = []
_protegidas = []
_sembrados = []
_cuidados = []
def atacar():
    if enemigo.escudo:
        _accion(a="rebota")
        return
    enemigo.vida = max(0, enemigo.vida - _golpe)
    _accion(a="atacar", vida=enemigo.vida)
def esquivar():
    _accion(a="esquivar")
def romper_escudo():
    enemigo.escudo = False
    _accion(a="romper")
def recuperar(pieza):
    _recuperadas.append(pieza)
    _accion(a="recuperar", p=str(pieza))
def proteger():
    _protegidas.append(len(_protegidas) + 1)
    _accion(a="proteger", n=len(_protegidas))
def avanzar():
    _accion(a="avanzar")
def esperar():
    _accion(a="esperar")
def sembrar(arbol="lupuna"):
    _sembrados.append(arbol)
    _accion(a="sembrar", p=str(arbol))
def cuidar(arbol):
    _cuidados.append(arbol)
    _accion(a="cuidar", p=str(arbol))
def _falla(texto):
    print("§FALLA " + texto)
def _cuenta(tipo):
    return sum(1 for a in _acciones if a["a"] == tipo)
`;

export const MISIONES: Mision[] = [
  // -------------------------------------------------------------------------
  // COSTA (Lambayeque): el viaje empieza junto al mar. Python básico: variables, operadores e if.
  {
    id: "mullu",
    numero: 1,
    nombre: "El mullu de Naylamp",
    icono: "🐚",
    lugar: "Costa de Lambayeque",
    ambiente: "costa",
    quien: "mama",
    pedido: [
      { quien: "mama", texto: "{nombre}, un chaski llegó corriendo desde la costa norte, desde Lambayeque. Trae malas noticias del mar." },
      { quien: "narrador", texto: "Cuenta la leyenda que hace siglos llegó por el mar Naylamp, con una flota de balsas y su corte. Uno de los suyos, Pita Zofi, tocaba el pututo; otro, Fonga Sigde, esparcía polvo de conchas donde él caminaba." },
      { quien: "mama", texto: "Esas conchas son el mullu (spondylus): para los pueblos antiguos valía más que el oro. ¡Unos cangrejos-Bug se las llevaron de la playa!" },
      { quien: "tuki", texto: "¡Kraa! Primero aprendemos lo básico de Python allá: variables, operaciones y decisiones con if. ¿Vamos al mar, {nombre}?" },
    ],
    amenaza: "Cangrejos-Bug y el Mullu Bug, su jefe",
    aprendes: "Variables, textos, operadores e if",
    dificultad: 1,
    recompensa: 30,
    logro: "mision-mullu",
    exploracion: { tipo: "recoger", total: 5, objetivo: "Recupera las conchas de mullu", item: "concha de mullu" },
    jefe: {
      nombre: "Mullu Bug",
      tipo: "bug",
      color: "#e0603a",
      tiempoAtaque: 50,
      llega: [
        { quien: "narrador", texto: "La arena se abre. Un Bug enorme sale del mar, con conchas de mullu pegadas al caparazón…" },
        { quien: "tuki", texto: "¡Es el Mullu Bug! Aquí se pelea con runas: tu código mueve a Chaski. Empezamos con lo más básico." },
      ],
      derrota: [
        { quien: "tuki", texto: "¡LO VENCISTE! El Mullu Bug soltó todas las conchas." },
        { quien: "narrador", texto: "Los pescadores vuelven al mar en sus caballitos de totora, como lo hacen en esta costa desde hace siglos." },
      ],
    },
    rondas: [
      {
        modo: "completar",
        titulo: "Una variable guarda el mullu",
        enunciado: "Guarda el texto <code>\"mullu\"</code> en la variable <code>concha</code> y luego <b>recupérala</b> con <code>recuperar(concha)</code>.",
        teoria: "Una <b>variable</b> es un nombre que guarda un valor. Los textos (<b>str</b>) van entre comillas: <code>\"mullu\"</code>.",
        bloques: ['"mullu"', "concha", "recuperar("],
        plantilla: "concha = ___\nrecuperar(concha)",
        preludio: 'enemigo = Enemigo("Mullu Bug", 30)',
        comprobar: [
          'if "___" in _codigo:',
          '    _falla("Cambia ___ por el texto \\"mullu\\" (con comillas).")',
          'elif "recuperar(concha)" not in _codigo.replace(" ", ""):',
          '    _falla("Usa la variable: recuperar(concha). Así el valor sale de la caja.")',
          'elif _recuperadas != ["mullu"]:',
          '    _falla(f"Recuperaste {_recuperadas}. La variable concha debe valer \\"mullu\\".")',
        ].join("\n"),
        solucion: 'concha = "mullu"\nrecuperar(concha)',
        pista: 'Escribe: concha = "mullu"  (el texto va entre comillas).',
      },
      {
        modo: "completar",
        titulo: "¿Cuántos golpes? (operadores)",
        enunciado: "El Mullu Bug tiene <b>30</b> de vida y cada golpe quita <b>10</b>. Calcula los golpes con el operador de <b>división entera</b>.",
        teoria: "<code>//</code> divide sin decimales: <code>30 // 10</code> da <code>3</code>. En cambio <code>/</code> da <code>3.0</code> (un <b>float</b>), y <code>range()</code> solo acepta enteros.",
        bloques: ["//", "/", "*", "+"],
        plantilla: "vida = 30\ngolpe = 10\ngolpes = vida ___ golpe\nprint(\"Golpes:\", golpes)\nfor i in range(golpes):\n    atacar()",
        preludio: 'enemigo = Enemigo("Mullu Bug", 30)',
        comprobar: [
          "if enemigo.vida > 0:",
          '    _falla(f"Quedó con {enemigo.vida} de vida. ¿Cuántos golpes de 10 hacen falta para 30?")',
          'elif _cuenta("atacar") != 3:',
          '    _falla(f"Atacaste {_cuenta(\'atacar\')} veces; bastaban 3.")',
          'elif "//" not in _codigo:',
          '    _falla("Usa el operador // (división entera).")',
        ].join("\n"),
        solucion: "vida = 30\ngolpe = 10\ngolpes = vida // golpe\nprint(\"Golpes:\", golpes)\nfor i in range(golpes):\n    atacar()",
        pista: "Cambia ___ por //   (30 // 10 = 3).",
      },
      {
        modo: "libre",
        titulo: "Decide con if",
        enunciado: "El Mullu Bug se cubre con un <b>escudo</b> de conchas. <b>Si</b> <code>enemigo.escudo</code> es verdadero, rómpelo con <code>romper_escudo()</code>; después ataca <b>2 veces</b>.",
        teoria: "<code>if condición:</code> ejecuta lo que está con sangría <b>solo si</b> la condición es <code>True</code>. Los valores <code>True</code>/<code>False</code> son <b>booleanos</b>.",
        bloques: ["if", "enemigo.escudo", ":", "romper_escudo()", "atacar()", "    "],
        plantilla: "# El enemigo tiene escudo (enemigo.escudo vale True)\n",
        preludio: 'enemigo = Enemigo("Mullu Bug", 20, escudo=True)',
        comprobar: [
          'if "if" not in _codigo:',
          '    _falla("Usa un if para decidir: if enemigo.escudo:")',
          'elif any(a["a"] == "rebota" for a in _acciones):',
          '    _falla("¡Tu golpe rebotó en el escudo! Primero rómpelo dentro del if.")',
          "elif enemigo.vida > 0:",
          '    _falla(f"Le quedó {enemigo.vida} de vida: ataca 2 veces después del if.")',
        ].join("\n"),
        solucion: "if enemigo.escudo:\n    romper_escudo()\natacar()\natacar()",
        pista: "if enemigo.escudo:  (con dos puntos) y debajo, con 4 espacios: romper_escudo(). Luego, sin sangría, atacar() dos veces.",
      },
    ],
    ficha: {
      nombre: "Naylamp y el mullu",
      icono: "🐚",
      dato: "El cronista Miguel Cabello Valboa recogió en 1586 la leyenda de Naylamp: llegó a Lambayeque por mar con balsas y trajo un ídolo de piedra verde, Yampallec. El mullu (Spondylus) se traía desde el mar cálido del norte y era muy valioso en todo el mundo andino.",
    },
  },
  // -------------------------------------------------------------------------
  {
    id: "oro",
    numero: 2,
    nombre: "El oro del Inti",
    icono: "🌞",
    lugar: "Qorikancha, Cusco",
    ambiente: "templo",
    quien: "mama",
    pedido: [
      { quien: "mama", texto: "{nombre}, llegó un chaski desde el Cusco con malas noticias. ¡Unos huaqueros-Bug entraron al Qorikancha, el Templo del Sol!" },
      { quien: "mama", texto: "Se llevaron las piezas de oro del gran disco del Inti. Para nuestro pueblo, el oro era el sudor del sol: no se vende, se respeta." },
      { quien: "tuki", texto: "¡Kraa! Hay que recuperarlas y devolverlas al templo. ¿Vamos, {nombre}?" },
    ],
    amenaza: "Huaqueros-Bug y el Q'ori Bug, su jefe",
    aprendes: "Secuencias, bucle for y listas",
    dificultad: 1,
    recompensa: 30,
    logro: "mision-oro",
    exploracion: { tipo: "recoger", total: 5, objetivo: "Recupera las piezas de oro", item: "pieza de oro" },
    jefe: {
      nombre: "Q'ori Bug",
      tipo: "bug",
      color: "#d4a017",
      tiempoAtaque: 45,
      llega: [
        { quien: "narrador", texto: "El suelo tiembla. Las piezas de oro que faltan giran alrededor de un Bug enorme y dorado…" },
        { quien: "tuki", texto: "¡Es el Q'ori Bug, el jefe de los huaqueros! Kraa… aquí la huaraca no basta: ¡pelea con runas! Tu código mueve a Chaski." },
      ],
      derrota: [
        { quien: "tuki", texto: "¡LO VENCISTE! El Q'ori Bug se deshizo y soltó todo el oro." },
        { quien: "mama", texto: "(por el khipu mensajero) Bien hecho, {nombre}. El disco del Inti vuelve a brillar en su templo. Así se cuida lo que es de todos." },
      ],
    },
    rondas: [
      {
        modo: "bloques",
        titulo: "Primero esquiva, después golpea",
        enunciado: "El Q'ori Bug ataca primero. <b>Esquiva</b> y luego <b>ataca 2 veces</b> (cada golpe quita 10; su vida es 20).",
        teoria: "Python ejecuta las órdenes <b>en orden</b>, de arriba hacia abajo: eso se llama <b>secuencia</b>.",
        bloques: ["esquivar()", "atacar()", 'recuperar("tumi")'],
        plantilla: "",
        preludio: 'enemigo = Enemigo("Q\'ori Bug", 20)',
        comprobar: [
          'if not _acciones or _acciones[0]["a"] != "esquivar":',
          '    _falla("¡El Q\'ori Bug atacó primero y te dio! Empieza con esquivar().")',
          "elif enemigo.vida > 0:",
          '    _falla(f"Le falta: su vida quedó en {enemigo.vida}. Necesitas más atacar().")',
          'elif _cuenta("atacar") > 2:',
          '    _falla("¡Golpeaste de más! Con 2 golpes bastaba: gasta solo la kallpa necesaria.")',
        ].join("\n"),
        solucion: "esquivar()\natacar()\natacar()",
        pista: "Toca los bloques en este orden: esquivar(), atacar(), atacar().",
      },
      {
        modo: "completar",
        titulo: "El atajo del for",
        enunciado: "Ahora tiene <b>40</b> de vida. En vez de escribir atacar() 4 veces, usa un <b>for</b>: completa el número de golpes.",
        teoria: "<code>for i in range(4):</code> repite 4 veces todo lo que está <b>con sangría</b> (4 espacios) debajo.",
        bloques: ["4", "range(", "atacar()", "    "],
        plantilla: "for i in range(___):\n    atacar()",
        preludio: 'enemigo = Enemigo("Q\'ori Bug", 40)',
        comprobar: [
          'if "for" not in _codigo:',
          '    _falla("Usa el bucle for: así no repites la misma línea.")',
          "elif enemigo.vida > 0:",
          '    _falla(f"Quedó con {enemigo.vida} de vida: el for repitió pocas veces.")',
          'elif _cuenta("atacar") > 4:',
          '    _falla(f"Atacaste {_cuenta(\'atacar\')} veces y bastaban 4. Ajusta el número de range().")',
        ].join("\n"),
        solucion: "for i in range(4):\n    atacar()",
        pista: "Cambia ___ por 4: range(4) repite 4 veces.",
      },
      {
        modo: "libre",
        titulo: "Devuelve todo el oro",
        enunciado: "El Bug soltó la lista <code>piezas</code>. Usa un <b>for</b> para <b>recuperar</b> cada pieza: <code>recuperar(pieza)</code>.",
        teoria: "<code>for pieza in piezas:</code> recorre la lista: en cada vuelta, <code>pieza</code> vale el siguiente elemento.",
        bloques: ["for", "in", "piezas", "recuperar(pieza)", ":", "    "],
        plantilla: 'piezas = ["disco del sol", "tumi", "vaso ceremonial", "llama de oro"]\n# Recupera cada pieza con un for\n',
        preludio: 'enemigo = Enemigo("Q\'ori Bug", 0)',
        comprobar: [
          'if "for" not in _codigo:',
          '    _falla("Recorre la lista con un for: for pieza in piezas:")',
          'elif sorted(map(str, _recuperadas)) != sorted(["disco del sol", "tumi", "vaso ceremonial", "llama de oro"]):',
          '    _falla(f"Recuperaste {_recuperadas}. Deben ser las 4 piezas de la lista, una vez cada una.")',
        ].join("\n"),
        solucion: 'piezas = ["disco del sol", "tumi", "vaso ceremonial", "llama de oro"]\nfor pieza in piezas:\n    recuperar(pieza)',
        pista: "Escribe: for pieza in piezas:  y debajo, con 4 espacios: recuperar(pieza)",
      },
    ],
    ficha: {
      nombre: "Qorikancha, el recinto de oro",
      icono: "🌞",
      dato: "Era el templo más sagrado del Cusco, dedicado al Inti (el Sol). Se cuenta que sus muros estaban cubiertos con unas 700 láminas de oro. Sobre sus muros incas se construyó después el convento de Santo Domingo.",
    },
  },
  // -------------------------------------------------------------------------
  {
    id: "vicuna",
    numero: 3,
    nombre: "Guardianes de la vicuña",
    icono: "🦙",
    lugar: "Pampa Galeras, Ayacucho",
    ambiente: "puna",
    quien: "sisa",
    pedido: [
      { quien: "sisa", texto: "¡{nombre}! Soy Sisa, guardaparque de Pampa Galeras. Cazadores-Bug persiguen a las vicuñas en la puna." },
      { quien: "sisa", texto: "La vicuña está en nuestro Escudo Nacional. Hace años casi desaparece; las comunidades la salvaron. ¡No dejemos que vuelva a pasar!" },
      { quien: "tuki", texto: "Protegeremos a cada vicuña. ¡Kraa! Aquí aprenderás a repetir algo MIENTRAS haga falta: el bucle while." },
    ],
    amenaza: "Cazadores-Bug y el Cazador de la Puna",
    aprendes: "Condicionales if y bucle while",
    dificultad: 2,
    recompensa: 40,
    logro: "mision-vicuna",
    exploracion: { tipo: "proteger", total: 6, objetivo: "Espanta a los cazadores-Bug", item: "cazador" },
    jefe: {
      nombre: "Cazador de la Puna",
      tipo: "bug",
      color: "#9a4a24",
      tiempoAtaque: 40,
      llega: [
        { quien: "narrador", texto: "Un silbido corta el viento de la puna. El Cazador de la Puna baja del cerro con su escudo de lata." },
        { quien: "sisa", texto: "¡Ese es el jefe! Su escudo detiene la huaraca. Piensa como programador, {nombre}." },
      ],
      derrota: [
        { quien: "sisa", texto: "¡Se fue! Las vicuñas vuelven a pastar tranquilas. Gracias, {nombre}." },
        { quien: "tuki", texto: "¡Y tú aprendiste a decidir con if y a repetir con while! Kraa, kraa!" },
      ],
    },
    rondas: [
      {
        modo: "bloques",
        titulo: "Si tiene escudo…",
        enunciado: "El Cazador tiene <b>escudo</b>. <b>Si</b> tiene escudo, rómpelo; después <b>ataca 3 veces</b> (vida 30).",
        teoria: "<code>if condición:</code> ejecuta lo que está con sangría <b>solo si</b> la condición es True.",
        bloques: ["if enemigo.escudo:", "    romper_escudo()", "atacar()", "esquivar()"],
        plantilla: "",
        preludio: 'enemigo = Enemigo("Cazador", 30, escudo=True)',
        comprobar: [
          'if "if" not in _codigo:',
          '    _falla("Usa if enemigo.escudo: para decidir si hay que romper el escudo.")',
          'elif _cuenta("rebota"):',
          '    _falla("¡Tu huaraca rebotó en el escudo! Rómpelo antes de atacar.")',
          "elif enemigo.vida > 0:",
          '    _falla(f"Quedó con {enemigo.vida} de vida: faltan golpes.")',
        ].join("\n"),
        solucion: "if enemigo.escudo:\n    romper_escudo()\natacar()\natacar()\natacar()",
        pista: "if enemigo.escudo:  →  (con sangría) romper_escudo()  →  atacar() 3 veces.",
      },
      {
        modo: "completar",
        titulo: "Mientras siga en pie",
        enunciado: "No sabemos cuánta vida tiene. Ataca <b>mientras</b> su vida sea mayor que 0.",
        teoria: "<code>while condición:</code> repite <b>mientras</b> la condición sea True. ¡Cuidado con que nunca termine!",
        bloques: [">", "<", "==", "0", "atacar()"],
        plantilla: "while enemigo.vida ___ 0:\n    atacar()",
        preludio: 'enemigo = Enemigo("Cazador", 50)',
        comprobar: [
          'if "while" not in _codigo:',
          '    _falla("Usa while para repetir mientras haga falta.")',
          "elif enemigo.vida > 0:",
          '    _falla("El while se detuvo antes de tiempo: revisa la comparación (debe ser mayor que: >).")',
        ].join("\n"),
        solucion: "while enemigo.vida > 0:\n    atacar()",
        pista: "Cambia ___ por >  (mientras la vida sea mayor que 0).",
      },
      {
        modo: "libre",
        titulo: "Las 6 vicuñas a salvo",
        enunciado: "Usa un <b>while</b> para <b>proteger()</b> a las <b>6</b> vicuñas del rebaño. Cuenta con la variable <code>vicunas</code>.",
        teoria: "Un contador sube en cada vuelta: <code>vicunas = vicunas + 1</code>. El while se detiene cuando llega al número.",
        bloques: ["while", "vicunas < 6:", "proteger()", "vicunas = vicunas + 1", "    "],
        plantilla: "vicunas = 0\n# Mientras vicunas sea menor que 6: protege y suma 1\n",
        preludio: 'enemigo = Enemigo("Cazador", 0)',
        comprobar: [
          'if "while" not in _codigo:',
          '    _falla("Usa un while con el contador vicunas.")',
          "elif len(_protegidas) != 6:",
          '    _falla(f"Protegiste {len(_protegidas)} vicuñas. Deben ser exactamente 6.")',
        ].join("\n"),
        solucion: "vicunas = 0\nwhile vicunas < 6:\n    proteger()\n    vicunas = vicunas + 1",
        pista: "while vicunas < 6:  y debajo, con sangría: proteger()  y  vicunas = vicunas + 1",
      },
    ],
    ficha: {
      nombre: "Reserva Nacional Pampa Galeras",
      icono: "🦙",
      dato: "Se creó en 1967 en Lucanas (Ayacucho), cuando en todo el Perú quedaban solo unas 5,000 vicuñas por la caza furtiva. Gracias a las comunidades hoy hay más de 200,000. En el chaccu, las vicuñas se esquilan y luego se liberan sin hacerles daño.",
    },
  },
  // -------------------------------------------------------------------------
  {
    id: "chullachaqui",
    numero: 4,
    nombre: "Rescate en la selva",
    icono: "🌳",
    lugar: "Selva del Ucayali",
    ambiente: "selva",
    quien: "yachaq",
    pedido: [
      { quien: "yachaq", texto: "Wawa, soy el abuelo Yachaq, del Ucayali. ¡Los Bugs-taladores encerraron a los animales en jaulas y están cortando los árboles!" },
      { quien: "yachaq", texto: "El otorongo, el mono, el perezoso, el guacamayo… ¡hay que liberarlos! Y cuidado: en el monte anda el Chullachaqui." },
      { quien: "yachaq", texto: "Dicen que es el Chullachaqui: toma la forma de alguien que conoces para que lo sigas. Mírale los pies: uno es distinto al otro." },
      { quien: "yachaq", texto: "Pero él no es malo: es el guardián del bosque. Castiga a quien daña la selva. Muéstrale que vienes a cuidarla." },
      { quien: "tuki", texto: "Kraa… me tiemblan las plumas. Rompe las jaulas con tu 🎯 huaraca, {nombre}. Y no sigas ninguna voz sin pensar: usa if y else." },
    ],
    amenaza: "Bugs-taladores, voces que engañan y el Chullachaqui",
    aprendes: "if / else y funciones (def)",
    dificultad: 3,
    recompensa: 50,
    logro: "mision-chullachaqui",
    exploracion: { tipo: "rescatar", total: 4, objetivo: "Libera a los animales de sus jaulas", item: "animal" },
    jefe: {
      nombre: "Chullachaqui",
      tipo: "chullachaqui",
      color: "#3b6b3a",
      tiempoAtaque: 38,
      llega: [
        { quien: "narrador", texto: "La neblina se cierra. Entre los árboles aparece un hombrecito de sombrero grande… y un pie distinto al otro." },
        { quien: "narrador", texto: "«¿Vienes a talar mi bosque, chaski?», dice con la voz de Amaru. «Demuéstrame qué buscas.»" },
        { quien: "tuki", texto: "¡No es una pelea de golpes! Cada runa bien hecha le muestra respeto. ¡Gánate su confianza!" },
      ],
      derrota: [
        { quien: "narrador", texto: "El Chullachaqui sonríe. La neblina se abre y los árboles nuevos ya asoman entre la hojarasca." },
        { quien: "narrador", texto: "«Cuidaste mi bosque. Desde hoy, la selva te abre el camino, chaski.»" },
        { quien: "tuki", texto: "¡Nos ayudó! Kraa… y aprendiste a decidir con if/else y a crear tus propias funciones." },
      ],
    },
    rondas: [
      {
        modo: "bloques",
        titulo: "¿Huellas reales o falsas?",
        enunciado: "Las huellas del camino son <b>falsas</b> (es una trampa). <b>Si</b> son reales, avanza; <b>si no</b> (else), espera.",
        teoria: "<code>if … :</code> hace algo si es True; <code>else:</code> hace otra cosa si es False. ¡Siempre se elige uno de los dos!",
        bloques: ['if camino == "huellas reales":', "    avanzar()", "else:", "    esperar()"],
        plantilla: "",
        preludio: 'enemigo = Enemigo("Chullachaqui", 0)\ncamino = "huellas falsas"',
        comprobar: [
          'if "if" not in _codigo or "else" not in _codigo:',
          '    _falla("Usa if y else: el Chullachaqui quiere ver que decides con cuidado.")',
          'elif _cuenta("avanzar"):',
          '    _falla("¡Seguiste las huellas falsas y te perdiste en la neblina! Revisa la condición.")',
          'elif not _cuenta("esperar"):',
          '    _falla("Cuando las huellas son falsas, hay que esperar().")',
        ].join("\n"),
        solucion: 'if camino == "huellas reales":\n    avanzar()\nelse:\n    esperar()',
        pista: "Arma: if camino == \"huellas reales\": / avanzar() / else: / esperar()",
      },
      {
        modo: "completar",
        titulo: "Tu propia runa: plantar",
        enunciado: "Crea la función <code>plantar(n)</code> que siembra <b>n</b> árboles, y úsala para sembrar <b>3</b>.",
        teoria: "<code>def nombre(parámetro):</code> crea una <b>función</b>: una runa propia que puedes usar muchas veces.",
        bloques: ["3", "sembrar()", "    "],
        plantilla: "def plantar(n):\n    for i in range(n):\n        sembrar()\n\nplantar(___)",
        preludio: 'enemigo = Enemigo("Chullachaqui", 0)',
        comprobar: [
          'if "def plantar" not in _codigo:',
          '    _falla("Crea la función con def plantar(n):")',
          "elif len(_sembrados) != 3:",
          '    _falla(f"Sembraste {len(_sembrados)} árboles. Llama a plantar(3).")',
        ].join("\n"),
        solucion: "def plantar(n):\n    for i in range(n):\n        sembrar()\n\nplantar(3)",
        pista: "Cambia ___ por 3: plantar(3) siembra 3 árboles.",
      },
      {
        modo: "libre",
        titulo: "Cuida el bosque",
        enunciado: "Recorre <code>arboles</code>: <b>si</b> un árbol está <code>\"talado\"</code>, siembra uno nuevo con <code>sembrar()</code>; <b>si no</b>, cuídalo con <code>cuidar(arbol)</code>.",
        teoria: "Puedes poner un <b>if/else dentro de un for</b>: en cada vuelta se decide qué hacer.",
        bloques: ["for arbol in arboles:", 'if arbol == "talado":', "sembrar()", "else:", "cuidar(arbol)", "    "],
        plantilla: 'arboles = ["lupuna", "talado", "shihuahuaco", "talado", "cedro"]\n# Para cada árbol: si está talado, siembra; si no, cuídalo\n',
        preludio: 'enemigo = Enemigo("Chullachaqui", 0)',
        comprobar: [
          'if "for" not in _codigo or "else" not in _codigo:',
          '    _falla("Usa un for con if/else adentro.")',
          "elif len(_sembrados) != 2:",
          '    _falla(f"Sembraste {len(_sembrados)}; hay 2 árboles talados.")',
          'elif sorted(map(str, _cuidados)) != ["cedro", "lupuna", "shihuahuaco"]:',
          '    _falla(f"Cuidaste {_cuidados}. Deben ser los 3 árboles en pie.")',
        ].join("\n"),
        solucion: 'arboles = ["lupuna", "talado", "shihuahuaco", "talado", "cedro"]\nfor arbol in arboles:\n    if arbol == "talado":\n        sembrar()\n    else:\n        cuidar(arbol)',
        pista: 'for arbol in arboles:  →  if arbol == "talado":  →  sembrar()  →  else:  →  cuidar(arbol)  (cuida la sangría)',
      },
    ],
    ficha: {
      nombre: "El Chullachaqui, guardián del bosque",
      icono: "🌳",
      dato: "Ser de la tradición amazónica peruana. Su nombre viene del quechua: chulla (desigual) y chaqui (pie). Se dice que toma la forma de alguien conocido para perder a los caminantes, y que protege a los animales y plantas de la selva de quienes la dañan. En esa selva viven el otorongo (jaguar), el mono, el perezoso y el guacamayo.",
    },
  },
];
