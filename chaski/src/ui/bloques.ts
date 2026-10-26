// Bloques de código: el jugador ARMA la runa tocando líneas (cómodo en celular)
// y luego se ejecuta en Python de verdad. Es el escalón entre "elegir" y "escribir".
// Incluye bloques trampa con errores típicos para aprender a reconocerlos.

import { python } from "../python/python";
import { traducirError } from "../python/tuki";
import { retrato } from "./retratos";
import { sonido, musicaSuave } from "../sonido";

export interface RetoBloques {
  quien: string;
  titulo: string;
  mision: string;
  /** Líneas correctas en orden (con su sangría). */
  correctas: string[];
  /** Líneas trampa (errores comunes). */
  trampas: string[];
  /** Lo que debe mostrar el programa al ejecutarse. */
  salidaEsperada: string[];
  teoria: string;
  /** Una sola línea de Python oculta que prepara el mundo (funciones como quitar o plantar). */
  preludio?: string;
}

const escapar = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const mezclar = <T,>(a: T[]) => a.map((v) => [Math.random(), v] as const).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
const verLinea = (l: string) => escapar(l).replace(/^( +)/, (s) => '<span class="sangria">' + "·".repeat(s.length) + "</span>");

export function abrirBloques(r: RetoBloques): Promise<void> {
  const caja = document.getElementById("bloques")!;
  const bandeja = mezclar([...r.correctas, ...r.trampas]);
  const colocados: number[] = [];
  musicaSuave(true);

  caja.innerHTML = `
    <div class="tarjeta bloques-tarjeta desplazable">
      <header class="taller-cabecera"><span>🧩 ${escapar(r.titulo)}</span><span id="bloques-estado" class="estado-python"></span></header>
      <div class="bloques-cuerpo">
        <div class="prologo-tuki">${retrato(r.quien, 44)}<p>${r.mision}</p></div>
        <p class="bloques-ayuda"><b>👆 Aquí no se escribe: toca las líneas en orden</b> para armar tu runa. Toca una línea armada para devolverla. ⚠ Algunas líneas tienen errores.</p>
        <div class="bloques-runa" id="bloques-runa"></div>
        <div class="bloques-bandeja" id="bloques-bandeja"></div>
        <div class="fila-botones">
          <button class="boton-secundario" id="bloques-borrar">↺ Borrar</button>
          <button class="boton-oro" id="bloques-ejecutar" disabled>▶ Ejecutar runa</button>
        </div>
        <div class="consola" id="bloques-consola"><span class="gris">La salida aparecerá aquí.</span></div>
        <div class="tuki-dice" id="bloques-tuki" hidden>${retrato("tuki", 40)}<p></p></div>
      </div>
    </div>`;
  caja.hidden = false;
  const runa = caja.querySelector<HTMLElement>("#bloques-runa")!;
  const zona = caja.querySelector<HTMLElement>("#bloques-bandeja")!;
  const ejecutar = caja.querySelector<HTMLButtonElement>("#bloques-ejecutar")!;
  const consola = caja.querySelector<HTMLElement>("#bloques-consola")!;
  const tuki = caja.querySelector<HTMLElement>("#bloques-tuki")!;
  const estadoPy = caja.querySelector<HTMLElement>("#bloques-estado")!;
  const decir = (html: string, bien: boolean) => {
    tuki.hidden = false;
    tuki.className = `tuki-dice ${bien ? "bien" : "mal"}`;
    tuki.querySelector("p")!.innerHTML = html;
    if (bien) sonido.acierto();
    else sonido.error();
  };

  const pintar = () => {
    runa.innerHTML = colocados.length
      ? colocados.map((i, n) => `<button class="bloque puesto" data-n="${n}"><span class="num">${n + 1}</span><code>${verLinea(bandeja[i])}</code></button>`).join("")
      : '<p class="gris">Tu runa está vacía…</p>';
    zona.innerHTML = bandeja
      .map((l, i) => (colocados.includes(i) ? "" : `<button class="bloque" data-i="${i}"><code>${verLinea(l)}</code></button>`))
      .join("");
    ejecutar.disabled = colocados.length === 0 || python.estado !== "listo";
    zona.querySelectorAll<HTMLButtonElement>("[data-i]").forEach((b) =>
      b.addEventListener("click", () => {
        sonido.toque();
        colocados.push(Number(b.dataset.i));
        pintar();
      })
    );
    runa.querySelectorAll<HTMLButtonElement>("[data-n]").forEach((b) =>
      b.addEventListener("click", () => {
        sonido.toque();
        colocados.splice(Number(b.dataset.n), 1);
        pintar();
      })
    );
  };
  python.iniciar().catch(() => (estadoPy.textContent = "🔴 Sin conexión"));
  python.alCambiar((e) => {
    estadoPy.textContent = e === "listo" ? "🟢 Python listo" : e === "cargando" ? "⏳ Despertando…" : "";
    if (e === "listo" && runa.isConnected) pintar();
  });

  pintar();
  caja.querySelector("#bloques-borrar")!.addEventListener("click", () => {
    colocados.length = 0;
    pintar();
  });

  return new Promise((terminar) => {
    let completado = false;
    ejecutar.addEventListener("click", async () => {
      if (completado) {
        caja.hidden = true;
        caja.innerHTML = "";
        musicaSuave(false);
        return terminar();
      }
      ejecutar.disabled = true;
      const codigo = colocados.map((i) => bandeja[i]).join("\n");
      consola.innerHTML = '<span class="gris">Ejecutando…</span>';
      const res = await python.ejecutar(r.preludio ? `${r.preludio}\n${codigo}` : codigo);
      if (r.preludio && res.error?.linea) res.error.linea -= 1;
      ejecutar.disabled = false;
      const salida = res.salida.join("\n").split("\n").filter((l) => l !== "");
      consola.innerHTML = salida.length ? salida.map((l) => `<div>${escapar(l)}</div>`).join("") : '<span class="gris">(no mostró nada)</span>';
      if (!res.ok && res.error) {
        const nombre = (res.error.mensaje.match(/name '([^']+)' is not defined/) || [])[1];
        if (nombre && new RegExp(`^\\s*${nombre}\\s*=`, "m").test(codigo)) {
          return decir(`Usaste <b>${escapar(nombre)}</b> antes de crearlo. Python lee <b>de arriba hacia abajo</b>: primero crea la variable, después úsala.`, false);
        }
        const t = traducirError(res.error);
        return decir(`<b>${t.bug}</b>: ${escapar(t.texto)}`, false);
      }
      const igual = salida.length === r.salidaEsperada.length && salida.every((l, i) => l === r.salidaEsperada[i]);
      if (!igual) {
        return decir(`Tu runa funcionó, pero mostró otra cosa. Debería mostrar:<br><code>${r.salidaEsperada.map(escapar).join("<br>")}</code>`, false);
      }
      decir(`¡Runa armada y ejecutada! 🎉<div class="teoria"><b>📘 TEORÍA</b><p>${r.teoria}</p></div>`, true);
      completado = true;
      ejecutar.textContent = "✓ Continuar";
      ejecutar.classList.add("listo");
    });
  });
}
