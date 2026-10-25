// Interfaz sobre el juego (HTML): paneles, diálogos y avisos.
// Se hace en HTML y no dentro de Phaser para que el texto se vea nítido en cualquier pantalla.

let temporizadorAviso: number | undefined;
let temporizadorDialogo: number | undefined;

export function actualizarWayruru(cantidad: number, total: number) {
  const el = document.getElementById("wayruru");
  if (el) el.textContent = `${cantidad}/${total}`;
}

/** Muestra un mensaje corto en la parte superior que desaparece solo. */
export function aviso(texto: string, ms = 2600) {
  const el = document.getElementById("aviso");
  if (!el) return;
  el.textContent = texto;
  el.hidden = false;
  el.classList.remove("entra");
  void el.offsetWidth; // reinicia la animación
  el.classList.add("entra");
  window.clearTimeout(temporizadorAviso);
  temporizadorAviso = window.setTimeout(() => (el.hidden = true), ms);
}

/** Muestra el cuadro de diálogo con el nombre de quien habla. Se cierra al tocarlo. */
export function dialogo(quien: string, texto: string, ms = 7000) {
  const caja = document.getElementById("dialogo");
  const nombre = document.getElementById("dialogo-nombre");
  const contenido = document.getElementById("dialogo-texto");
  if (!caja || !nombre || !contenido) return;
  nombre.textContent = quien;
  contenido.innerHTML = texto; // los textos son del propio juego, nunca del jugador
  caja.hidden = false;
  window.clearTimeout(temporizadorDialogo);
  temporizadorDialogo = window.setTimeout(() => (caja.hidden = true), ms);
}

export function iniciarHud() {
  const caja = document.getElementById("dialogo");
  caja?.addEventListener("pointerdown", () => (caja.hidden = true));

  // Pantalla completa: en celulares Android también intenta fijar la pantalla en horizontal
  document.getElementById("boton-pantalla")?.addEventListener("click", async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        const orientacion = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
        await orientacion.lock?.("landscape").catch(() => {});
      } else {
        await document.exitFullscreen();
      }
    } catch {
      aviso("Tu navegador no permite pantalla completa");
    }
  });
}
