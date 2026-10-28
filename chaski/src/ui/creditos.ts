// Créditos y licencias: quién hizo cada recurso libre que usa el juego (y bajo qué licencia).

const CREDITOS: [string, string][] = [
  ["🎵 Quena (grabaciones reales)", "Interpretación: Ximena Núñez · Ingeniería: Daun Park · Edición: Asher Deverna. Berklee Intersectional Soundbox Archive (BISA), «Peruvian Quena Loops». Licencia CC BY. Las melodías de fondo se arman con frases de estas grabaciones."],
  ["🧍 Personajes y naturaleza 3D", "KayKit, de Kay Lousberg (kaylousberg.com). Licencia CC0 (dominio público). Ropa andina, armas, pututo, animales y criaturas: modelados para este juego."],
  ["🦊 Zorro andino 3D", "Modelo «Fox»: PixelMannen (CC0). Esqueleto y animación: tomkranis (CC BY 4.0). Conversión a glTF: @AsoboStudio y @scurest (CC BY 4.0). Khronos glTF Sample Assets."],
  ["🐍 Python, SQL y SQLAlchemy", "Pyodide (Mozilla Public License 2.0) corre Python en tu navegador. SQLite (dominio público). SQLAlchemy (licencia MIT)."],
  ["🎮 Motor 3D", "Babylon.js (licencia Apache 2.0)."],
  ["📚 Leyendas", "Naylamp: crónica de Miguel Cabello Valboa (1586). Qarqacha/Jarjacha, Muki, Amaru, Yacumama y Chullachaqui: tradición oral andina y amazónica, recopilada por la Biblioteca Nacional del Perú y estudios de literatura oral."],
  ["🐾 Datos de fauna", "Estado de conservación global según la Lista Roja de la UICN. Murciélagos del Perú: Pacheco et al. (2009)."],
];

export function abrirCreditos(): Promise<void> {
  const c = document.getElementById("mision-ui")!;
  c.innerHTML = `
    <div class="mision-tarjeta fauna-tarjeta">
      <div class="mision-cabeza"><span class="mision-icono">📜</span><div><small>GRACIAS</small><h2>Créditos y licencias</h2></div></div>
      ${CREDITOS.map(([t, d]) => `<div class="ficha-fauna"><p><b>${t}</b></p><p>${d}</p></div>`).join("")}
      <div class="mision-botones"><button class="boton-oro" id="creditos-cerrar">Cerrar</button></div>
    </div>`;
  c.hidden = false;
  return new Promise((r) =>
    c.querySelector("#creditos-cerrar")!.addEventListener("click", () => {
      c.hidden = true;
      r();
    })
  );
}
