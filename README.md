# Khipu: Guardianes del Código

Videojuego educativo peruano para aprender Python y SQL. Una aventura donde programar es tener poder.

**Juego nuevo (en construcción):** https://crcas05.github.io/khipu-legends/selva/

**Prototipo de Caral:** https://crcas05.github.io/khipu-legends/

## Estado

- **Juego nuevo, carpeta `juego/`:** Etapa 1 de 6 lista. El Chaski camina por un pedazo de selva con joystick o teclado, junta semillas de wayruru y Tuki lo acompaña.
- **Prototipo de Caral (raíz del repositorio):** sigue en línea hasta que el Episodio 1 lo reemplace.

## Juego nuevo: cómo está hecho

- **Phaser 4 + TypeScript + Vite**, en la carpeta `juego/`.
- Cada vez que se suben cambios a `main`, **GitHub Actions** compila el juego y lo publica en `/selva/` (archivo `.github/workflows/publicar.yml`).
- El mapa está en `juego/src/mundo/mapaSelva.ts` y se puede editar como texto.
- El arte es provisional y está dibujado con código en `juego/src/arte/texturas.ts`. Se cambiará por un paquete de pixel art CC0 sin tocar el resto.

Para probarlo en tu computadora:

```bash
cd juego
npm install
npm run dev
```

## Prototipo de Caral

## Cómo funciona

- Es una página web instalable (PWA): funciona en celular, tablet y PC, y sin internet después de la primera visita.
- El código Python de cada jugador se ejecuta **en su propio dispositivo** con [Pyodide](https://pyodide.org). No hay servidor.
- Cada misión es un archivo de datos en `misiones/`. Para cambiar textos, bloques o pistas, se edita ese archivo.

## Estructura

| Archivo | Qué hace |
| --- | --- |
| `index.html` | Las pantallas del juego |
| `css/estilos.css` | Colores, tamaños y animaciones |
| `js/app.js` | El flujo del juego: historia, reto, recompensa |
| `js/python.js` y `js/python-worker.js` | Ejecutan Python en un hilo aparte, con límite de 5 segundos |
| `js/tuki.js` | Traduce los errores de Python a español simple |
| `js/arte.js` | Personajes y escenas (arte provisional) |
| `js/sonido.js` | Sonidos cortos |
| `misiones/caral-01.json` | Contenido de la Misión 1 |
| `sw.js` y `manifest.webmanifest` | Hacen que se instale y funcione sin internet |

## Probar en tu computadora

```bash
python3 -m http.server 8000
```

Luego abre http://localhost:8000

## Al publicar cambios

Sube el número de `VERSION` en `sw.js` (por ejemplo, de `kl-v1` a `kl-v2`) para que los celulares descarguen la versión nueva.

## Nota cultural

El arte es provisional. El diseño del héroe del Ucayali debe co-crearse con artistas shipibo-konibo, con crédito y pago.
