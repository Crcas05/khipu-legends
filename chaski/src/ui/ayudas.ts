// Ayudas visuales: una mano 👆 y un globo señalan cada botón nuevo la primera vez.

import { estado, guardar } from "../estado";

let actual: HTMLElement | null = null;

export function ayudaBoton(id: string, boton: HTMLElement, texto: string) {
  if (estado.ayudas.includes(id) || boton.hidden || actual) return;
  const r = boton.getBoundingClientRect();
  if (!r.width) return;
  estado.ayudas.push(id);
  guardar();
  const globo = document.createElement("div");
  globo.className = "ayuda";
  globo.innerHTML = `<span class="ayuda-texto">${texto}</span><span class="ayuda-mano">👆</span>`;
  document.body.appendChild(globo);
  // A la izquierda del botón (los botones están a la derecha de la pantalla)
  const ancho = globo.offsetWidth;
  globo.style.left = `${Math.max(8, r.left - ancho - 6)}px`;
  globo.style.top = `${Math.max(8, r.top + r.height / 2 - globo.offsetHeight / 2)}px`;
  actual = globo;
  const quitar = () => {
    globo.remove();
    if (actual === globo) actual = null;
    boton.removeEventListener("pointerdown", quitar);
  };
  boton.addEventListener("pointerdown", quitar);
  window.setTimeout(quitar, 9000);
}
