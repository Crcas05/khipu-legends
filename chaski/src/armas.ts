// Armas andinas reales (huaraca, champi, lanza, liwi/boleadoras y arco). Cada una se FORJA
// escribiendo una runa de Python en el Taller: el código es lo que da el poder.
// Datos históricos: los ejércitos incas usaban hondas, mazas estrelladas (champi), lanzas,
// boleadoras y, en la selva, arcos; cada unidad luchaba con sus armas preferidas.

import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { estado, guardar } from "./estado";
import type { Reto } from "./ui/taller";

export type ArmaId = "huaraca" | "champi" | "lanza" | "liwi" | "arco";

export interface Arma {
  id: ArmaId;
  nombre: string;
  icono: string;
  /** Distancia máxima para apuntar. */
  alcance: number;
  /** Golpes que da a cada objetivo. */
  danio: number;
  recarga: number;
  /** Cuerpo a cuerpo: golpea a todo lo que esté a esta distancia (0 = lanza un proyectil). */
  area: number;
  /** Segundos que deja quieto al enemigo (boleadoras). */
  aturde: number;
  forma: "piedra" | "flecha" | "lanza" | "bolas" | "golpe";
  color: string;
  como: string;
  dato: string;
  /** Qué hace falta para poder forjarla. */
  requisito: string;
  disponible: () => boolean;
  reto: Reto | null;
}

const llego = (p: string) => {
  const orden = ["prologo", "intro", "hablar1", "fuente", "techo", "hablar2", "taller", "final", "completo", "selva", "ecos", "forja", "batalla", "victoria", "completo2", "valle", "completo3"];
  return orden.indexOf(estado.paso) >= orden.indexOf(p);
};

export const ARMAS: Arma[] = [
  {
    id: "huaraca",
    nombre: "Huaraca",
    icono: "🎯",
    alcance: 15,
    danio: 1,
    recarga: 0.42,
    area: 0,
    aturde: 0,
    forma: "piedra",
    color: "#fff6d6",
    como: "Honda de lana: lanza piedras lejos y apunta sola.",
    dato: "La huaraca (honda) era una de las armas más temidas de los Andes: lanzaba piedras con muchísima fuerza.",
    requisito: "",
    disponible: () => true,
    reto: null,
  },
  {
    id: "champi",
    nombre: "Champi",
    icono: "🔨",
    alcance: 3.4,
    danio: 2,
    recarga: 0.7,
    area: 3.4,
    aturde: 0,
    forma: "golpe",
    color: "#e0a050",
    como: "Maza estrellada de bronce: golpe fuerte a TODOS los que estén cerca.",
    dato: "El champi era una maza con cabeza de estrella de cobre o bronce. Los cronistas la llaman también porra o macana.",
    requisito: "Termina el Episodio 1",
    disponible: () => llego("completo"),
    reto: {
      id: "arma-champi",
      titulo: "Forja el champi · if / else",
      enunciado: [
        "El champi sirve de <b>cerca</b>; la huaraca, de <b>lejos</b>.",
        "Completa la función <code>elegir_arma(distancia)</code>: <b>si</b> la distancia es menor que 4, devuelve <code>\"champi\"</code>; <b>si no</b>, devuelve <code>\"huaraca\"</code>.",
        "Prueba con <code>print(elegir_arma(2))</code> y <code>print(elegir_arma(10))</code>.",
      ],
      plantilla: "def elegir_arma(distancia):\n    if distancia < 4:\n        return \n    else:\n        return \n\nprint(elegir_arma(2))\nprint(elegir_arma(10))\n",
      pistas: ['En la primera línea return escribe "champi" (con comillas).', 'En la segunda: return "huaraca"', "Las líneas return llevan 8 espacios (están dentro del if y del else)."],
      comprobar: `
try:
    _a = elegir_arma(1); _b = elegir_arma(3); _c = elegir_arma(4); _d = elegir_arma(20)
except Exception as _e:
    _a = _b = _c = _d = None
if "if" not in _codigo or "else" not in _codigo: _falla("Usa if y else para decidir.")
elif _a != "champi" or _b != "champi": _falla(f"Con distancia 1 devolvió {_a!r}: de cerca debe ser \\"champi\\".")
elif _c != "huaraca" or _d != "huaraca": _falla(f"Con distancia 4 devolvió {_c!r}: desde 4 en adelante debe ser \\"huaraca\\".")`,
      solucion: 'def elegir_arma(distancia):\n    if distancia < 4:\n        return "champi"\n    else:\n        return "huaraca"\n\nprint(elegir_arma(2))\nprint(elegir_arma(10))\n',
      exito: "¡Champi forjado! 🔨 Tu función decide sola qué arma usar. Ahora puedes golpear a todos los enemigos cercanos.",
    },
  },
  {
    id: "lanza",
    nombre: "Lanza",
    icono: "🔱",
    alcance: 12,
    danio: 2,
    recarga: 0.65,
    area: 0,
    aturde: 0,
    forma: "lanza",
    color: "#c9a06a",
    como: "Lanza de chonta: tiro recto y fuerte (2 de daño).",
    dato: "Según Guaman Poma, la lanza era el arma principal de los ejércitos del Inca.",
    requisito: "Gana la misión «El oro del Inti»",
    disponible: () => !!estado.misiones.oro,
    reto: {
      id: "arma-lanza",
      titulo: "Forja la lanza · for y acumulador",
      enunciado: [
        "Tu lanza dará 3 golpes con fuerza <code>4</code>, <code>5</code> y <code>6</code>.",
        "Usa un <b>for</b> para sumar todos los golpes en la variable <code>total</code> (empieza en 0).",
        "Al final muestra <code>print(total)</code>: debe salir 15.",
      ],
      plantilla: "golpes = [4, 5, 6]\ntotal = 0\nfor golpe in golpes:\n    total = \n\nprint(total)\n",
      pistas: ["Dentro del for: total = total + golpe", "La línea de adentro lleva 4 espacios.", "Debe mostrar 15."],
      comprobar: `
if "for" not in _codigo: _falla("Suma con un for: así funciona para cualquier cantidad de golpes.")
elif total != 15: _falla(f"total vale {total}, pero 4 + 5 + 6 = 15. Usa total = total + golpe.")`,
      solucion: "golpes = [4, 5, 6]\ntotal = 0\nfor golpe in golpes:\n    total = total + golpe\n\nprint(total)\n",
      exito: "¡Lanza forjada! 🔱 Sumaste con un for (un acumulador). Tu lanza ahora da 2 golpes de una vez.",
    },
  },
  {
    id: "liwi",
    nombre: "Liwi",
    icono: "🪢",
    alcance: 13,
    danio: 1,
    recarga: 0.6,
    area: 0,
    aturde: 3,
    forma: "bolas",
    color: "#a0785a",
    como: "Boleadoras: enreda al enemigo y lo deja quieto 3 segundos.",
    dato: "Las boleadoras (liwi) son cuerdas con piedras en las puntas que se lanzan girando para atrapar.",
    requisito: "Gana la misión «Guardianes de la vicuña»",
    disponible: () => !!estado.misiones.vicuna,
    reto: {
      id: "arma-liwi",
      titulo: "Forja el liwi · listas",
      enunciado: [
        "Un liwi tiene <b>3 piedras</b> atadas a cuerdas.",
        "Crea la lista <code>bolas</code> vacía y agrégale 3 veces <code>\"piedra\"</code> con <code>.append()</code>.",
        "Muestra cuántas tiene con <code>print(len(bolas))</code>: debe salir 3.",
      ],
      plantilla: 'bolas = []\nbolas.append("piedra")\n\nprint(len(bolas))\n',
      pistas: ['Repite bolas.append("piedra") hasta tener 3.', "También puedes usar un for i in range(3): bolas.append(\"piedra\")", "len(bolas) cuenta los elementos de la lista."],
      comprobar: `
if ".append" not in _codigo: _falla("Agrega las piedras con bolas.append(\\"piedra\\").")
elif bolas != ["piedra", "piedra", "piedra"]: _falla(f"Tu lista es {bolas}: debe tener exactamente 3 \\"piedra\\".")`,
      solucion: 'bolas = []\nbolas.append("piedra")\nbolas.append("piedra")\nbolas.append("piedra")\n\nprint(len(bolas))\n',
      exito: "¡Liwi forjado! 🪢 Armaste una lista con append. Tus boleadoras dejan quietos a los enemigos.",
    },
  },
  {
    id: "arco",
    nombre: "Arco",
    icono: "🏹",
    alcance: 24,
    danio: 1,
    recarga: 0.28,
    area: 0,
    aturde: 0,
    forma: "flecha",
    color: "#e8d9a8",
    como: "Arco de la selva: flechas rápidas y muy lejanas.",
    dato: "El arco y la flecha eran armas de los pueblos de la selva; llegaron tarde a los ejércitos incas.",
    requisito: "Gana la misión «Rescate en la selva»",
    disponible: () => !!estado.misiones.chullachaqui,
    reto: {
      id: "arma-arco",
      titulo: "Forja el arco · diccionarios",
      enunciado: [
        "Guarda los datos del arco en un <b>diccionario</b> llamado <code>arco</code>.",
        "Debe tener <code>\"flechas\"</code>: 12 y <code>\"alcance\"</code>: 24.",
        "Muestra el alcance con <code>print(arco[\"alcance\"])</code>.",
      ],
      plantilla: 'arco = {"flechas": 12}\n\nprint(arco["alcance"])\n',
      pistas: ['Agrega dentro de las llaves: , "alcance": 24', 'Un diccionario guarda pares clave: valor, separados por comas.', 'arco["alcance"] lee el valor de esa clave.'],
      comprobar: `
if not isinstance(arco, dict): _falla("arco debe ser un diccionario: usa llaves { }.")
elif arco.get("flechas") != 12 or arco.get("alcance") != 24: _falla(f"Tu arco es {arco}: necesita \\"flechas\\": 12 y \\"alcance\\": 24.")`,
      solucion: 'arco = {"flechas": 12, "alcance": 24}\n\nprint(arco["alcance"])\n',
      exito: "¡Arco forjado! 🏹 Usaste un diccionario (clave: valor). Tus flechas llegan muy lejos.",
    },
  },
];

export function armaActual(): Arma {
  return ARMAS.find((a) => a.id === estado.arma && estado.armas.includes(a.id)) ?? ARMAS[0];
}

export function desbloqueadas(): Arma[] {
  return ARMAS.filter((a) => a.id === "huaraca" || estado.armas.includes(a.id));
}

export function elegirArma(id: ArmaId) {
  if (id !== "huaraca" && !estado.armas.includes(id)) return;
  estado.arma = id;
  guardar();
}

/** Pasa a la siguiente arma forjada. */
export function siguienteArma(): Arma {
  const lista = desbloqueadas();
  const i = lista.findIndex((a) => a.id === armaActual().id);
  const a = lista[(i + 1) % lista.length];
  elegirArma(a.id);
  return a;
}

const mats = new Map<string, StandardMaterial>();
function mat(escena: Scene, color: string) {
  const k = color;
  if (!mats.has(k)) {
    const m = new StandardMaterial(`m-arma-${color}`, escena);
    m.diffuseColor = Color3.FromHexString(color);
    m.emissiveColor = Color3.FromHexString(color).scale(0.45);
    mats.set(k, m);
  }
  return mats.get(k)!;
}

/** Anima el proyectil de cada arma y llama a alLlegar al impactar. */
export function lanzarProyectil(escena: Scene, desde: Vector3, hasta: Vector3, a: Arma, alLlegar: () => void) {
  let malla: Mesh;
  if (a.forma === "flecha") {
    malla = MeshBuilder.CreateCylinder("flecha", { height: 1.1, diameter: 0.05, tessellation: 5 }, escena);
    const punta = MeshBuilder.CreateCylinder("punta", { height: 0.22, diameterTop: 0, diameterBottom: 0.14, tessellation: 5 }, escena);
    punta.parent = malla;
    punta.position.y = 0.6;
    punta.material = mat(escena, "#555555");
  } else if (a.forma === "lanza") {
    malla = MeshBuilder.CreateCylinder("lanza", { height: 1.8, diameter: 0.07, tessellation: 5 }, escena);
    const punta = MeshBuilder.CreateCylinder("punta", { height: 0.35, diameterTop: 0, diameterBottom: 0.18, tessellation: 4 }, escena);
    punta.parent = malla;
    punta.position.y = 1;
    punta.material = mat(escena, "#c87533");
  } else if (a.forma === "bolas") {
    malla = MeshBuilder.CreateTorus("liwi", { diameter: 0.9, thickness: 0.03, tessellation: 12 }, escena);
    for (let i = 0; i < 3; i++) {
      const b = MeshBuilder.CreateSphere("bola", { diameter: 0.2, segments: 5 }, escena);
      b.parent = malla;
      const ang = (i / 3) * Math.PI * 2;
      b.position.set(Math.sin(ang) * 0.45, 0, Math.cos(ang) * 0.45);
      b.material = mat(escena, "#8a7a6a");
    }
  } else {
    malla = MeshBuilder.CreateSphere("huaraca", { diameter: 0.3, segments: 6 }, escena);
  }
  malla.material = mat(escena, a.color);
  malla.isPickable = false;
  const recto = a.forma === "flecha" || a.forma === "lanza";
  const arco = recto ? 0.25 : a.forma === "bolas" ? 0.7 : 1.2;
  const velocidad = a.forma === "flecha" ? 55 : a.forma === "lanza" ? 34 : 30;
  const dur = Math.max(0.12, Vector3.Distance(desde, hasta) / velocidad);
  const dir = hasta.subtract(desde).normalize();
  let t = 0;
  const obs = escena.onBeforeRenderObservable.add(() => {
    t += escena.getEngine().getDeltaTime() / 1000 / dur;
    const k = Math.min(1, t);
    malla.position = Vector3.Lerp(desde, hasta, k).add(new Vector3(0, Math.sin(k * Math.PI) * arco, 0));
    if (recto) {
      // Apunta en la dirección del vuelo
      malla.rotation.x = Math.PI / 2;
      malla.rotation.y = Math.atan2(dir.x, dir.z);
    } else if (a.forma === "bolas") malla.rotation.y += 0.5;
    if (k >= 1) {
      escena.onBeforeRenderObservable.remove(obs);
      malla.dispose();
      alLlegar();
    }
  });
}

/** Golpe circular del champi (onda en el suelo). */
export function golpeChampi(escena: Scene, centro: Vector3, radio: number) {
  const anillo = MeshBuilder.CreateTorus("onda-champi", { diameter: 1, thickness: 0.12, tessellation: 32 }, escena);
  const m = new StandardMaterial("m-onda", escena);
  m.emissiveColor = new Color3(1, 0.75, 0.35);
  m.disableLighting = true;
  m.alpha = 0.8;
  anillo.material = m;
  anillo.position.set(centro.x, 0.25, centro.z);
  let t = 0;
  const obs = escena.onBeforeRenderObservable.add(() => {
    t += escena.getEngine().getDeltaTime() / 1000;
    const k = Math.min(1, t / 0.35);
    anillo.scaling.setAll(1 + k * radio * 2);
    m.alpha = 0.8 * (1 - k);
    if (k >= 1) {
      escena.onBeforeRenderObservable.remove(obs);
      anillo.dispose();
      m.dispose();
    }
  });
}
