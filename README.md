# Khipu Legends: Código Ancestral

Videojuego educativo peruano para aprender Python y SQL. Una aventura donde programar es tener poder.

**Juega aquí:** https://crcas05.github.io/khipu-legends/

## Estado

Versión piloto: Región 1 (Caral), Misión 1 «La Voz del Pututu».

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
