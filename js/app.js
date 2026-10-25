// Khipu Legends: Código Ancestral — lógica del piloto (Misión 1 de Caral).
// La misión se lee desde misiones/caral-01.json: para cambiar textos, bloques
// o pistas, se edita ese archivo, no este.

import { PythonRunner } from "./python.js";
import { traducirError } from "./tuki.js";
import { retrato, escenaCaral, HEROES } from "./arte.js";
import { sonido } from "./sonido.js";

// ---------- Estado guardado en el dispositivo ----------
const CLAVE = "khipu-legends-v1";
const DEFECTO = { apodo: "", heroe: "yupanki", kallpa: 0, completadas: [], poderes: [] };

function cargarEstado() {
  try {
    return { ...DEFECTO, ...JSON.parse(localStorage.getItem(CLAVE) || "{}") };
  } catch {
    return { ...DEFECTO };
  }
}
function guardarEstado() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(estado));
  } catch {
    /* sin almacenamiento: el juego sigue, solo no recuerda el avance */
  }
}

let estado = cargarEstado();
let mision = null;
let indiceDialogo = 0;
let pistasUsadas = 0;
let programa = []; // bloques elegidos en el modo Bloques
let modo = "bloques";

const $ = (s) => document.querySelector(s);
const python = new PythonRunner(pintarChipPython);

// ---------- Utilidades ----------
function escapar(texto) {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
// Reemplaza {apodo} y otras marcas en los textos de la misión.
function rellenar(texto, extra = {}) {
  return String(texto).replace(/\{(\w+)\}/g, (_, k) => (k in extra ? extra[k] : k === "apodo" ? estado.apodo : `{${k}}`));
}
// Convierte `código` en <code>código</code> de forma segura.
function conCodigo(texto) {
  return escapar(texto).replace(/`([^`]+)`/g, "<code>$1</code>");
}
// El apodo va dentro de un print("..."): quitamos lo que rompería el texto.
function limpiarApodo(texto) {
  return texto.replace(/["'\\{}<>`]/g, "").replace(/\s+/g, " ").trim().slice(0, 16);
}
function mezclar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function mostrar(id) {
  document.querySelectorAll(".pantalla").forEach((p) => (p.hidden = p.id !== id));
  $("#hud").hidden = id === "inicio" || id === "personaje";
  window.scrollTo(0, 0);
}

function pintarHud() {
  $("#hud-avatar").innerHTML = retrato(estado.heroe);
  $("#hud-apodo").textContent = estado.apodo;
  $("#hud-kallpa").textContent = estado.kallpa;
}

function pintarChipPython(e) {
  const chip = $("#chip-python");
  const textos = {
    apagado: "",
    cargando: "Cargando Python…",
    listo: "Python listo",
    error: "Sin Python: revisa tu internet",
  };
  chip.textContent = textos[e] || "";
  chip.dataset.estado = e;
}

// ---------- 1. Inicio ----------
function pintarInicio() {
  const conAvance = Boolean(estado.apodo);
  $("#btn-comenzar").textContent = conAvance ? `Continuar como ${estado.apodo}` : "Comenzar aventura";
  $("#btn-reiniciar").hidden = !conAvance;
  mostrar("inicio");
}

$("#btn-comenzar").addEventListener("click", () => {
  if (estado.apodo) empezarMision();
  else pintarPersonaje();
});
$("#btn-reiniciar").addEventListener("click", () => {
  estado = { ...DEFECTO };
  guardarEstado();
  pintarPersonaje();
});

// ---------- 2. Personaje ----------
function pintarPersonaje() {
  const lista = $("#lista-heroes");
  lista.innerHTML = "";
  for (const h of HEROES) {
    const boton = document.createElement("button");
    boton.className = "heroe" + (estado.heroe === h.id ? " elegido" : "");
    boton.setAttribute("role", "radio");
    boton.setAttribute("aria-checked", estado.heroe === h.id ? "true" : "false");
    boton.innerHTML = `${retrato(h.id)}<strong>${escapar(h.nombre)}</strong><small>${escapar(h.descripcion)}</small>`;
    boton.addEventListener("click", () => {
      estado.heroe = h.id;
      pintarPersonaje();
    });
    lista.appendChild(boton);
  }
  $("#input-apodo").value = estado.apodo;
  mostrar("personaje");
}

$("#btn-listo").addEventListener("click", () => {
  const apodo = limpiarApodo($("#input-apodo").value);
  if (!apodo) {
    $("#aviso-apodo").textContent = "Escribe un apodo (sin comillas ni símbolos raros).";
    return;
  }
  $("#aviso-apodo").textContent = "";
  estado.apodo = apodo;
  guardarEstado();
  empezarMision();
});

// ---------- 3. Escena ----------
function empezarMision() {
  pintarHud();
  python.iniciar().catch(() => {}); // Python se descarga mientras el jugador lee la historia
  indiceDialogo = 0;
  pistasUsadas = 0;
  programa = [];
  $("#escena-arte").innerHTML = escenaCaral("dormido");
  pintarDialogo();
  mostrar("escena");
}

let escribiendo = null;
function pintarDialogo() {
  const linea = mision.escena[indiceDialogo];
  const quien = linea.quien === "heroe" ? estado.heroe : linea.quien;
  const nombres = { narrador: "", mama: "Mama Khipu", tuki: "Tuki", gigante: "Gigante de Adobe" };
  const nombre = linea.quien === "heroe" ? estado.apodo : nombres[linea.quien] || "";
  $("#dialogo").classList.toggle("narrador", linea.quien === "narrador");
  $("#dialogo-retrato").innerHTML = linea.quien === "narrador" ? "" : retrato(quien);
  $("#dialogo-nombre").textContent = nombre;
  escribirTexto(rellenar(linea.texto));
}

// Efecto de máquina de escribir, como en los diálogos de anime.
function escribirTexto(texto) {
  const destino = $("#dialogo-texto");
  clearInterval(escribiendo);
  let i = 0;
  destino.textContent = "";
  escribiendo = setInterval(() => {
    i += 2;
    destino.textContent = texto.slice(0, i);
    if (i >= texto.length) {
      clearInterval(escribiendo);
      escribiendo = null;
    }
  }, 22);
  destino.dataset.completo = texto;
}

function avanzarDialogo() {
  if (escribiendo) {
    clearInterval(escribiendo);
    escribiendo = null;
    $("#dialogo-texto").textContent = $("#dialogo-texto").dataset.completo;
    return;
  }
  indiceDialogo++;
  if (indiceDialogo < mision.escena.length) pintarDialogo();
  else pintarEnsenanza();
}
$("#btn-siguiente").addEventListener("click", avanzarDialogo);
$("#dialogo").addEventListener("click", avanzarDialogo);
$("#dialogo").addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    avanzarDialogo();
  }
});

// ---------- 4. Enseñanza ----------
function pintarEnsenanza() {
  $("#retrato-mama").innerHTML = retrato("mama");
  $("#titulo-ensenanza").textContent = mision.aprende;
  $("#lista-ensenanza").innerHTML = mision.ensenanza.map((t) => `<li>${conCodigo(t)}</li>`).join("");
  $("#codigo-ejemplo").textContent = mision.ejemplo;
  $("#nota-ejemplo").textContent = mision.ejemplo_nota || "";
  mostrar("ensenanza");
}
$("#btn-a-practicar").addEventListener("click", pintarPrueba);

// ---------- 5. Prueba guiada ----------
function pintarPrueba() {
  $("#instruccion-prueba").textContent = mision.prueba.instruccion;
  $("#editor-prueba").value = mision.prueba.codigo;
  $("#salida-prueba").hidden = true;
  $("#tuki-prueba").hidden = true;
  $("#btn-ir-reto").disabled = true;
  mostrar("prueba");
}

$("#btn-ejecutar-prueba").addEventListener("click", async () => {
  const resultado = await ejecutarConEspera($("#editor-prueba").value, "#btn-ejecutar-prueba");
  if (!resultado) return;
  mostrarSalida("#salida-prueba", resultado.salida);
  if (resultado.ok) {
    sonido.pututu();
    mostrarTuki("#tuki-prueba", null, resultado.salida.length ? "¡Tu pututu habló! Ahora sí, vamos al reto." : "Se ejecutó, pero tu pututu no dijo nada. ¿Escribiste un print?");
    if (resultado.salida.length) $("#btn-ir-reto").disabled = false;
  } else {
    sonido.error();
    const t = traducirError(resultado.error);
    mostrarTuki("#tuki-prueba", t.bug, t.texto);
  }
});
$("#btn-ir-reto").addEventListener("click", pintarReto);

// ---------- 6. Reto ----------
function pintarReto() {
  $("#reto-arte").innerHTML = escenaCaral("dormido");
  $("#instruccion-reto").textContent = mision.reto.instruccion;
  $("#lineas-esperadas").innerHTML = mision.reto.lineas.map((l) => `<li>${escapar(rellenar(l))}</li>`).join("");
  $("#salida-reto").hidden = true;
  $("#tuki-reto").hidden = true;
  $("#editor-reto").value = "";
  programa = [];
  pistasUsadas = 0;
  actualizarBotonPista();
  pintarBloques(mezclar(mision.bloques.map((b) => rellenar(b))));
  cambiarModo("bloques");
  mostrar("reto");
}

let disponibles = [];
function pintarBloques(lista) {
  if (lista) disponibles = lista;
  const zona = $("#bloques-disponibles");
  zona.innerHTML = "";
  disponibles.forEach((codigo) => {
    const b = document.createElement("button");
    b.className = "bloque";
    b.textContent = codigo;
    b.addEventListener("click", () => {
      programa.push(codigo);
      pintarPrograma();
    });
    zona.appendChild(b);
  });
  pintarPrograma();
}

function pintarPrograma() {
  const lista = $("#programa");
  lista.innerHTML = "";
  if (!programa.length) {
    lista.innerHTML = `<li class="vacio">Aún no hay bloques. Toca uno de arriba.</li>`;
    return;
  }
  programa.forEach((codigo, i) => {
    const li = document.createElement("li");
    li.className = "bloque-programa";
    const texto = document.createElement("code");
    texto.textContent = codigo;
    li.appendChild(texto);
    const controles = document.createElement("span");
    controles.className = "controles";
    controles.append(
      botonControl("↑", "Subir", i === 0, () => mover(i, -1)),
      botonControl("↓", "Bajar", i === programa.length - 1, () => mover(i, 1)),
      botonControl("✕", "Quitar", false, () => {
        programa.splice(i, 1);
        pintarPrograma();
      })
    );
    li.appendChild(controles);
    lista.appendChild(li);
  });
}
function botonControl(simbolo, etiqueta, deshabilitado, accion) {
  const b = document.createElement("button");
  b.textContent = simbolo;
  b.setAttribute("aria-label", etiqueta);
  b.disabled = deshabilitado;
  b.addEventListener("click", accion);
  return b;
}
function mover(i, paso) {
  const j = i + paso;
  [programa[i], programa[j]] = [programa[j], programa[i]];
  pintarPrograma();
}

function cambiarModo(nuevo) {
  if (nuevo === "libre" && modo === "bloques" && !$("#editor-reto").value.trim()) {
    $("#editor-reto").value = programa.join("\n"); // lo armado con bloques pasa al editor
  }
  modo = nuevo;
  $("#modo-bloques").hidden = modo !== "bloques";
  $("#modo-libre").hidden = modo !== "libre";
  $("#tab-bloques").classList.toggle("activa", modo === "bloques");
  $("#tab-libre").classList.toggle("activa", modo === "libre");
  $("#tab-bloques").setAttribute("aria-selected", String(modo === "bloques"));
  $("#tab-libre").setAttribute("aria-selected", String(modo === "libre"));
}
$("#tab-bloques").addEventListener("click", () => cambiarModo("bloques"));
$("#tab-libre").addEventListener("click", () => cambiarModo("libre"));

$("#btn-ejecutar-reto").addEventListener("click", async () => {
  const codigo = modo === "bloques" ? programa.join("\n") : $("#editor-reto").value;
  const m = mision.validacion.mensajes;
  if (!codigo.trim()) {
    mostrarTuki("#tuki-reto", null, m.vacio);
    return;
  }
  const resultado = await ejecutarConEspera(codigo, "#btn-ejecutar-reto");
  if (!resultado) return;
  mostrarSalida("#salida-reto", resultado.salida);

  if (!resultado.ok) {
    sonido.error();
    const t = traducirError(resultado.error);
    mostrarTuki("#tuki-reto", t.bug, t.texto);
    return;
  }
  sonido.pututu();
  const v = validar(resultado.salida);
  if (v.ok) {
    completarMision();
  } else {
    $("#reto-arte").innerHTML = escenaCaral(v.medio ? "medio" : "dormido");
    mostrarTuki("#tuki-reto", null, v.mensaje);
  }
});

// Compara lo que dijo el pututu con lo que pide la misión.
function validar(salida) {
  const v = mision.validacion;
  const m = v.mensajes;
  const normal = (s) => String(s).trim().toLowerCase().replace(/\s+/g, " ");
  const lineas = salida.filter((l, i) => !(i === salida.length - 1 && l === ""));
  const n = lineas.length;
  if (n === 0) return { ok: false, mensaje: m.vacio };
  if (n < v.total_lineas) {
    const faltan = v.total_lineas - n;
    return { ok: false, medio: n >= v.total_lineas - 1, mensaje: rellenar(m.menos, { faltan: faltan === 1 ? "1 línea" : `${faltan} líneas` }) };
  }
  if (n > v.total_lineas) {
    return { ok: false, mensaje: rellenar(m.mas, { total: v.total_lineas, n }) };
  }
  for (const exacta of v.lineas_exactas) {
    if (normal(lineas[exacta.indice]) !== normal(rellenar(exacta.texto))) {
      return { ok: false, medio: true, mensaje: rellenar(m.linea, { pos: exacta.indice + 1, texto: rellenar(exacta.texto) }) };
    }
  }
  return { ok: true };
}

$("#btn-pista").addEventListener("click", () => {
  if (pistasUsadas >= mision.pistas.length) return;
  const pista = rellenar(mision.pistas[pistasUsadas]);
  pistasUsadas++;
  actualizarBotonPista();
  mostrarTuki("#tuki-reto", `Pista ${pistasUsadas}`, pista);
});
function actualizarBotonPista() {
  const total = mision.pistas.length;
  const b = $("#btn-pista");
  b.textContent = `Pedir pista (${pistasUsadas}/${total})`;
  b.disabled = pistasUsadas >= total;
}

// ---------- 7. Recompensa ----------
function completarMision() {
  const r = mision.recompensa;
  const ganada = Math.max(r.kallpa - pistasUsadas * 10, r.kallpa_minima);
  const primeraVez = !estado.completadas.includes(mision.id);
  if (primeraVez) {
    estado.completadas.push(mision.id);
    estado.poderes.push(r.poder);
    estado.kallpa += ganada;
    guardarEstado();
  }
  pintarHud();
  $("#recompensa-arte").innerHTML = escenaCaral("despierto");
  $("#nombre-poder").textContent = r.poder;
  $("#descripcion-poder").textContent = r.poder_descripcion;
  $("#resumen-mision").textContent = `«${r.resumen}»`;
  mostrar("recompensa");
  sonido.victoria();
  contarHasta($("#kallpa-ganada"), primeraVez ? ganada : 0);
}

function contarHasta(elemento, final) {
  let actual = 0;
  elemento.textContent = "0";
  const paso = Math.max(1, Math.round(final / 25));
  const t = setInterval(() => {
    actual = Math.min(final, actual + paso);
    elemento.textContent = actual;
    if (actual >= final) clearInterval(t);
  }, 40);
}

$("#btn-repetir").addEventListener("click", empezarMision);
$("#btn-volver-inicio").addEventListener("click", pintarInicio);

// ---------- Ejecución compartida ----------
async function ejecutarConEspera(codigo, selectorBoton) {
  const boton = $(selectorBoton);
  const textoOriginal = boton.textContent;
  boton.disabled = true;
  boton.textContent = python.estado === "listo" ? "Soplando…" : "Despertando la lengua antigua…";
  try {
    return await python.ejecutar(codigo);
  } catch {
    const zona = selectorBoton.includes("prueba") ? "#tuki-prueba" : "#tuki-reto";
    mostrarTuki(zona, null, "No pude descargar Python. Conéctate a internet una vez; después funciona sin conexión.");
    return null;
  } finally {
    boton.disabled = false;
    boton.textContent = textoOriginal;
  }
}

function mostrarSalida(selector, lineas) {
  const caja = $(selector);
  caja.hidden = false;
  caja.innerHTML = `<p class="etiqueta">Tu pututu dijo:</p>`;
  const pre = document.createElement("pre");
  pre.textContent = lineas.length ? lineas.join("\n") : "(silencio)";
  caja.appendChild(pre);
}

function mostrarTuki(selector, bug, texto) {
  const caja = $(selector);
  caja.hidden = false;
  caja.innerHTML = `<div class="tuki-retrato">${retrato("tuki")}</div>`;
  const cuerpo = document.createElement("div");
  if (bug) {
    const etiqueta = document.createElement("p");
    etiqueta.className = "bug";
    etiqueta.textContent = bug;
    cuerpo.appendChild(etiqueta);
  }
  const p = document.createElement("p");
  p.className = "tuki-texto";
  p.textContent = texto;
  cuerpo.appendChild(p);
  caja.appendChild(cuerpo);
  caja.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ---------- Teclado de código (para celulares) ----------
const TECLAS = [
  { etiqueta: 'print("")', insertar: 'print("")', retroceder: 2 },
  { etiqueta: '"', insertar: '"' },
  { etiqueta: "(", insertar: "(" },
  { etiqueta: ")", insertar: ")" },
  { etiqueta: ",", insertar: ", " },
  { etiqueta: "↵", insertar: "\n" },
];
document.querySelectorAll(".teclado-codigo").forEach((teclado) => {
  const area = document.getElementById(teclado.dataset.para);
  for (const t of TECLAS) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = t.etiqueta;
    b.addEventListener("click", () => {
      const ini = area.selectionStart;
      const fin = area.selectionEnd;
      area.value = area.value.slice(0, ini) + t.insertar + area.value.slice(fin);
      const pos = ini + t.insertar.length - (t.retroceder || 0);
      area.focus();
      area.setSelectionRange(pos, pos);
    });
    teclado.appendChild(b);
  }
});

$("#btn-sonido").addEventListener("click", () => {
  const activo = sonido.alternar();
  $("#btn-sonido").textContent = activo ? "♪" : "×";
  $("#btn-sonido").setAttribute("aria-label", activo ? "Silenciar sonido" : "Activar sonido");
});

// ---------- Arranque ----------
async function arrancar() {
  try {
    mision = await (await fetch("misiones/caral-01.json")).json();
  } catch {
    document.body.innerHTML = "<p style='padding:24px'>No se pudo cargar la misión. Revisa tu conexión y recarga.</p>";
    return;
  }
  pintarInicio();
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}
arrancar();
