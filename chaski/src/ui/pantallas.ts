// Pantallas completas: selección de héroe y ¡Nuevo nivel!

import { retrato } from "./retratos";
import { estado } from "../estado";
import { sonido } from "../sonido";

interface Heroe {
  clave: string;
  nombre: string;
  rol: string;
  desbloqueo: string;
  habilidades: [string, string, string][]; // ícono, nombre, qué enseña
}

const HEROES: Heroe[] = [
  {
    clave: "chaski",
    nombre: "CHASKI",
    rol: "Equilibrado",
    desbloqueo: "",
    habilidades: [
      ["⚡", "Carrera del Chaski", "Variables: guarda y cambia valores"],
      ["📣", "Mensaje veloz", "print(): muestra mensajes"],
      ["🐚", "Pututu", "Funciones (Misión 3)"],
    ],
  },
  {
    clave: "amaru",
    nombre: "AMARU",
    rol: "Mágica",
    desbloqueo: "Se une en la Misión 2",
    habilidades: [
      ["🌀", "Espiral del río", "Bucles for y while"],
      ["✨", "Onda solar", "Condicionales if / else"],
      ["🔮", "Visión del khipu", "Listas"],
    ],
  },
  {
    clave: "killa",
    nombre: "KILLA",
    rol: "Ataque",
    desbloqueo: "Se une en la Misión 3",
    habilidades: [
      ["🌙", "Golpe lunar", "Funciones con parámetros"],
      ["🛡", "Escudo de los Apus", "try / except"],
      ["⚔", "Doble filo", "Diccionarios"],
    ],
  },
  {
    clave: "yaru",
    nombre: "YARU",
    rol: "Soporte",
    desbloqueo: "Se une en la Misión 4",
    habilidades: [
      ["🗃", "Memoria de lana", "Bases de datos SQL"],
      ["🔎", "Olfato de datos", "SELECT y WHERE"],
      ["💚", "Abrazo de la manada", "Python + SQL"],
    ],
  },
];

export function elegirHeroe(): Promise<string> {
  const caja = document.getElementById("seleccion")!;
  let elegido = HEROES[0];
  const pintar = () => {
    caja.innerHTML = `
      <div class="seleccion-marco">
        <h2>SELECCIONA TU HÉROE</h2>
        <div class="seleccion-cuerpo">
          <div class="tarjetas">
            ${HEROES.map(
              (h) => `
              <button class="tarjeta-heroe ${h === elegido ? "activa" : ""} ${h.desbloqueo ? "bloqueada" : ""}" data-clave="${h.clave}">
                ${retrato(h.clave, 92)}
                <b>${h.nombre}</b><small>${h.rol}</small>
                ${h.desbloqueo ? `<span class="candado">🔒</span>` : ""}
              </button>`
            ).join("")}
          </div>
          <div class="habilidades">
            <h3>HABILIDADES</h3>
            ${elegido.habilidades.map(([i, n, t]) => `<div class="habilidad"><span class="icono">${i}</span><div><b>${n}</b><small>${t}</small></div></div>`).join("")}
            ${
              elegido.desbloqueo
                ? `<p class="bloqueo">🔒 ${elegido.desbloqueo}</p>`
                : `<button class="boton-oro" id="confirmar-heroe">CONFIRMAR</button>`
            }
          </div>
        </div>
      </div>`;
    caja.querySelectorAll<HTMLButtonElement>(".tarjeta-heroe").forEach((b) =>
      b.addEventListener("click", () => {
        sonido.toque();
        elegido = HEROES.find((h) => h.clave === b.dataset.clave)!;
        pintar();
        enlazar();
      })
    );
  };
  let resolver: (c: string) => void = () => {};
  const enlazar = () => {
    caja.querySelector("#confirmar-heroe")?.addEventListener("click", () => {
      caja.hidden = true;
      resolver(elegido.clave);
    });
  };
  caja.hidden = false;
  pintar();
  return new Promise((r) => {
    resolver = r;
    enlazar();
  });
}

export function nuevoNivel(aprendido: string[]): Promise<void> {
  const caja = document.getElementById("nivel")!;
  caja.innerHTML = `
    <div class="nivel-marco">
      <div class="rayos"></div>
      <div class="confeti">${Array.from({ length: 36 }, (_, i) => `<i style="left:${(i * 37) % 100}%;animation-delay:${(i % 12) * 0.12}s;background:${["#f5b83d", "#c8102e", "#4ff0dc", "#ffffff", "#7b1fa2"][i % 5]}"></i>`).join("")}</div>
      ${retrato(estado.heroe || "chaski", 120)}
      <h2 class="nivel-titulo">¡NUEVO NIVEL!</h2>
      <p class="nivel-numero">Nivel ${estado.nivel}</p>
      <div class="nivel-premios">
        <span>⚡ ${estado.kallpa} kallpa</span>
        <span>📖 ${estado.palabras.length} palabras quechua</span>
      </div>
      <div class="nivel-aprendido">
        <b>Aprendiste:</b>
        ${aprendido.map((a) => `<span>✓ ${a}</span>`).join("")}
      </div>
      <button class="boton-oro" id="nivel-seguir">CONTINUAR</button>
    </div>`;
  caja.hidden = false;
  sonido.nivel();
  return new Promise((r) =>
    caja.querySelector("#nivel-seguir")!.addEventListener("click", () => {
      caja.hidden = true;
      r();
    })
  );
}

export function proximamente(episodio = 2): Promise<"selva" | "plaza" | "repetir" | "valle"> {
  const caja = document.getElementById("nivel")!;
  caja.innerHTML =
    episodio === 2
      ? `
    <div class="nivel-marco">
      <p class="nota">TEMPORADA 1 · MISIÓN 1</p>
      <h2 class="nivel-titulo pequeño">Episodio 2</h2>
      <p class="nivel-numero">La selva de Ch'aqwa</p>
      <p class="explica">Conocerás a <b>Amaru</b>, crearás <b>ecos</b> de ti mismo con <code>for</code> y forjarás tu primera <b>runa de ataque</b> con <code>def</code> para tu primera batalla.</p>
      <div class="fila-botones">
        <button class="boton-oro" id="ir-selva">🌿 ¡Viajar a la selva!</button>
        <button class="boton-secundario" id="ir-plaza">🏘 Quedarme en la plaza</button>
      </div>
      <button class="boton-secundario" id="repetir">↺ Repetir episodio 1</button>
    </div>`
      : episodio === 3
      ? `
    <div class="nivel-marco">
      <p class="nota">TEMPORADA 1 · MISIÓN 2 · ZONA 1</p>
      <h2 class="nivel-titulo pequeño">El Valle Sagrado</h2>
      <p class="nivel-numero">¡Mundo abierto!</p>
      <p class="explica">Explora libremente, espanta mini-Bugs con tu <b>huaraca</b> y <b>rescata la naturaleza</b> con código: la vicuña, el río, las queñuas, el cóndor y el colibrí. Aprenderás <b>if / else</b> y <b>listas</b>.</p>
      <div class="fila-botones">
        <button class="boton-oro" id="ir-valle">🏔 ¡Ir al Valle Sagrado!</button>
        <button class="boton-secundario" id="ir-plaza">Quedarme aquí</button>
      </div>
    </div>`
      : `
    <div class="nivel-marco">
      <p class="nota">TEMPORADA 1 · MISIÓN 3</p>
      <h2 class="nivel-titulo pequeño">Zona 2</h2>
      <p class="nivel-numero">Muy pronto</p>
      <p class="explica">El Bug tiene hermanos. Prepárate para <b>if / else</b>, el <b>Khipu vivo</b> (listas) y <b>Killa</b>, la guerrera de la luna.</p>
      <button class="boton-oro" id="ir-plaza">🌿 Seguir explorando</button>
    </div>`;
  caja.hidden = false;
  return new Promise((r) => {
    const fin = (v: "selva" | "plaza" | "repetir" | "valle") => () => {
      sonido.toque();
      caja.hidden = true;
      r(v);
    };
    caja.querySelector("#ir-selva")?.addEventListener("click", fin("selva"));
    caja.querySelector("#ir-valle")?.addEventListener("click", fin("valle"));
    caja.querySelector("#ir-plaza")?.addEventListener("click", fin("plaza"));
    caja.querySelector("#repetir")?.addEventListener("click", fin("repetir"));
  });
}
