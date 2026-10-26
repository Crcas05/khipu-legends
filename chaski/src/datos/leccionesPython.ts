// Programa de Python (básico B2–B8 e intermedio I1–I10) como lecciones jugables.
// Cada lección: gancho → predicción → teoría → práctica guiada → Taller (Python real
// con comprobación automática) → error típico. Las soluciones sirven para las pruebas.

import type { Leccion } from "../ui/leccion";
import { entradas } from "../python/motorSql";

// =============================================================================
// ZONA 2 · LAGO TITICACA (Killa) — B2 operadores, B3 textos, B4 input, B5 condicionales
// =============================================================================

export const B2_OPERADORES: Leccion = {
  id: "B2",
  modulo: "B2 Operadores",
  titulo: "La balsa de totora",
  pasos: [
    { tipo: "voz", quien: "killa", texto: "Los uros construyen sus balsas con atados de totora. El Bug desordenó las cuentas: ¡hay que calcular de nuevo!" },
    {
      tipo: "elegir",
      quien: "killa",
      texto: "¿Qué muestra esta runa?",
      codigo: "print(17 / 5)",
      opciones: [
        ["3.4", true, "¡Sí! La división / siempre da un número decimal (float)."],
        ["3", false, "Eso daría //, la división entera. / da decimales."],
        ["3.0", false, "17 entre 5 no es exacto: sobra algo."],
      ],
    },
    {
      tipo: "elegir",
      quien: "killa",
      texto: "Tienes 17 atados y cada balsa usa 5. ¿Qué muestra?",
      codigo: "print(17 // 5, 17 % 5)",
      opciones: [
        ["3 2", true, "¡Exacto! // da 3 balsas completas y % da los 2 atados que sobran."],
        ["3.4 2", false, "// es división ENTERA: no da decimales."],
        ["2 3", false, "Al revés: // es el cociente (3) y % es el resto (2)."],
      ],
    },
    {
      tipo: "teoria",
      texto:
        "<code>+  -  *</code> suman, restan y multiplican. <code>/</code> divide y da decimal. <code>//</code> da la parte entera y <code>%</code> el <b>resto</b>. <code>**</code> es potencia. Python calcula primero <code>**</code>, luego <code>* / // %</code> y al final <code>+ -</code>: usa paréntesis para cambiar el orden.",
      codigo: "print(2 + 3 * 4)    # 14\nprint((2 + 3) * 4)  # 20\nprint(2 ** 3)       # 8",
    },
    {
      tipo: "taller",
      reto: {
        id: "B2",
        titulo: "Runa B2 · Atados para las balsas",
        enunciado: [
          "Hay <code>47</code> atados de totora y cada balsa usa <code>10</code>.",
          "Calcula <b>balsas</b> (cuántas balsas completas salen) con <code>//</code>.",
          "Calcula <b>sobran</b> (atados que quedan) con <code>%</code>.",
        ],
        plantilla: "atados = 47\npor_balsa = 10\nbalsas = \nsobran = \nprint(balsas, sobran)\n",
        pistas: ["balsas = atados // por_balsa", "sobran = atados % por_balsa", "Debe mostrar: 4 7"],
        comprobar: `
if "//" not in _codigo or "%" not in _codigo: _falla("Usa los operadores // y % (no escribas los números a mano).")
elif balsas != 4: _falla(f"balsas vale {balsas}, pero con 47 atados salen 4 balsas completas.")
elif sobran != 7: _falla(f"sobran vale {sobran}, pero deberían sobrar 7 atados.")`,
        solucion: "atados = 47\npor_balsa = 10\nbalsas = atados // por_balsa\nsobran = atados % por_balsa\nprint(balsas, sobran)\n",
        exito: "¡Bien calculado! <code>//</code> y <code>%</code> son perfectos para repartir cosas. 🛶",
      },
    },
    {
      tipo: "bug",
      texto: "Killa esperaba que <code>total</code> fuera 30, pero salió 20. ¿Qué pasó?",
      codigo: "precio = 10\ntotal = precio + 5 * 2\nprint(total)",
      opciones: [
        ["La * se calcula antes que la +: faltan paréntesis (precio + 5) * 2", true, "¡Así es! Python respeta el orden de operaciones."],
        ["Python sumó mal", false, "Python nunca suma mal: sigue el orden de operaciones."],
        ["Hay que usar // en vez de *", false, "No hay ninguna división aquí."],
      ],
    },
  ],
};

export const B3_TEXTOS: Leccion = {
  id: "B3",
  modulo: "B3 Textos",
  titulo: "El telar de Taquile",
  pasos: [
    { tipo: "voz", quien: "killa", texto: "Los tejedores de Taquile tejen mensajes en sus chumpis (fajas). El Bug cortó uno. ¡Vamos a repararlo con textos!" },
    {
      tipo: "elegir",
      quien: "killa",
      texto: "Cada letra tiene una posición, empezando en 0. ¿Qué muestra?",
      codigo: 'lago = "TITICACA"\nprint(lago[0], lago[-1])',
      opciones: [
        ["T A", true, "¡Sí! [0] es la primera letra y [-1] la última."],
        ["I C", false, "Recuerda: se empieza a contar desde 0."],
        ["T C", false, "[-1] es la ÚLTIMA letra: A."],
      ],
    },
    {
      tipo: "elegir",
      quien: "killa",
      texto: "Una rebanada [inicio:fin] corta un pedazo. El fin NO se incluye. ¿Qué muestra?",
      codigo: 'lago = "TITICACA"\nprint(lago[0:4])',
      opciones: [
        ["TITI", true, "¡Exacto! Posiciones 0, 1, 2 y 3. La 4 no entra."],
        ["TITIC", false, "El fin (4) no se incluye."],
        ["ITIC", false, "El inicio 0 es la primera letra."],
      ],
    },
    {
      tipo: "teoria",
      texto:
        "Un texto (<code>str</code>) es una fila de letras: <code>[0]</code> la primera, <code>[-1]</code> la última, <code>[a:b]</code> un pedazo y <code>len()</code> cuántas tiene. <code>+</code> une textos. Para meter variables dentro de un texto usa una <b>f-string</b>: <code>f\"Hola {nombre}\"</code>.",
      codigo: 'nombre = "Killa"\nprint(len(nombre))          # 5\nprint(f"Soy {nombre}")      # Soy Killa',
    },
    {
      tipo: "taller",
      reto: {
        id: "B3",
        titulo: "Runa B3 · El cartel de la isla",
        enunciado: [
          "Crea la variable <b>cartel</b> con una <b>f-string</b> que diga exactamente:",
          "<code>Bienvenidos a Taquile: 120 tejedores</code>",
          "Usa las variables <code>isla</code> y <code>tejedores</code> dentro de las llaves <code>{ }</code>.",
        ],
        plantilla: 'isla = "Taquile"\ntejedores = 120\ncartel = f""\nprint(cartel)\n',
        pistas: ['Dentro de la f-string: f"Bienvenidos a {isla}: ..."', 'cartel = f"Bienvenidos a {isla}: {tejedores} tejedores"'],
        comprobar: `
if "{isla}" not in _codigo or "{tejedores}" not in _codigo: _falla("Usa las variables dentro de la f-string: {isla} y {tejedores}.")
elif cartel != "Bienvenidos a Taquile: 120 tejedores": _falla(f"Tu cartel dice «{cartel}». Revisa espacios y los dos puntos.")`,
        solucion: 'isla = "Taquile"\ntejedores = 120\ncartel = f"Bienvenidos a {isla}: {tejedores} tejedores"\nprint(cartel)\n',
        exito: "¡Cartel listo! Las f-strings son la forma más cómoda de armar textos. 🧶",
      },
    },
    {
      tipo: "bug",
      codigo: 'edad = 12\nprint("Edad: " + edad)',
      opciones: [
        ['No se puede unir texto con número: usa str(edad) o f"Edad: {edad}"', true, "¡Correcto! Es un TypeError: + no mezcla str con int."],
        ["Falta un espacio después de Edad:", false, "El espacio ya está. El problema es el tipo de dato."],
        ["print no acepta el signo +", false, "print sí lo acepta, pero entre textos."],
      ],
    },
  ],
};

export const B4_INPUT: Leccion = {
  id: "B4",
  modulo: "B4 Entrada y conversión",
  titulo: "El guardián del puerto",
  pasos: [
    { tipo: "voz", quien: "killa", texto: "El guardián del puerto anota cuántas personas suben a la balsa. Él escribe los números; tu runa debe sumarlos." },
    {
      tipo: "elegir",
      quien: "killa",
      texto: "El guardián escribe 8. ¿Qué pasa?",
      codigo: 'n = input("Pasajeros: ")   # escribe 8\nprint(n + 1)',
      opciones: [
        ["Da error: input() entrega texto y no se suma con 1", true, "¡Así es! input() SIEMPRE devuelve un str."],
        ["Muestra 9", false, "Sería 9 solo si convirtieras n con int()."],
        ["Muestra 81", false, "Eso pasaría con \"8\" + \"1\" (dos textos)."],
      ],
    },
    {
      tipo: "teoria",
      texto:
        "<code>input()</code> pregunta algo y devuelve lo escrito <b>siempre como texto</b>. Para hacer cuentas, conviértelo: <code>int()</code> a entero, <code>float()</code> a decimal, <code>str()</code> a texto.",
      codigo: 'texto = input("Edad: ")   # "12"\nedad = int(texto)          # 12\nprint(edad + 1)            # 13',
    },
    {
      tipo: "taller",
      reto: {
        id: "B4",
        titulo: "Runa B4 · Contar pasajeros",
        enunciado: [
          "El guardián escribirá <b>8</b> adultos y <b>3</b> niños.",
          "La runa los está sumando como textos. <b>Arréglala</b> para que <code>total</code> sea un número.",
          "Debe mostrar <code>Total: 11</code>.",
        ],
        plantilla: 'adultos = input("Adultos: ")\nninos = input("Niños: ")\ntotal = adultos + ninos\nprint(f"Total: {total}")\n',
        preludio: entradas(["8", "3"]),
        pistas: ["Convierte cada respuesta con int(...)", 'adultos = int(input("Adultos: "))'],
        comprobar: `
if total == "83": _falla("Salió 83 porque sumaste textos: \\"8\\" + \\"3\\". Convierte con int().")
elif total != 11: _falla(f"total vale {total!r}, pero debería ser 11.")`,
        solucion: 'adultos = int(input("Adultos: "))\nninos = int(input("Niños: "))\ntotal = adultos + ninos\nprint(f"Total: {total}")\n',
        exito: "¡11 pasajeros a bordo! Siempre convierte lo que viene de input(). ⛵",
      },
    },
    {
      tipo: "bug",
      codigo: 'remos = int("tres")',
      opciones: [
        ["int() solo convierte textos con dígitos, como \"3\" (ValueError)", true, "¡Eso! \"tres\" no tiene dígitos."],
        ["Faltan comillas", false, "Las comillas están bien."],
        ["int() no existe en Python", false, "Sí existe: convierte a entero."],
      ],
    },
  ],
};

export const B5_CONDICIONALES: Leccion = {
  id: "B5",
  modulo: "B5 Condicionales",
  titulo: "Navegar de noche",
  pasos: [
    { tipo: "voz", quien: "killa", texto: "Soy Killa, guerrera de la luna. Para cruzar el lago hay que decidir según el viento. ¡Eso se hace con if, elif y else!" },
    {
      tipo: "elegir",
      quien: "killa",
      texto: "¿Qué muestra esta runa?",
      codigo: 'viento = 25\nif viento > 40:\n    print("quedarse")\nelif viento > 20:\n    print("remar con cuidado")\nelse:\n    print("navegar")',
      opciones: [
        ["remar con cuidado", true, "¡Sí! 25 no es > 40, pero sí es > 20."],
        ["quedarse", false, "25 no es mayor que 40."],
        ["remar con cuidado y navegar", false, "Solo se ejecuta UNA rama: la primera que se cumpla."],
      ],
    },
    {
      tipo: "elegir",
      quien: "killa",
      texto: "¿Se navega esta noche?",
      codigo: 'luna_llena = True\nviento = 30\nif luna_llena and viento < 15:\n    print("navegar")\nelse:\n    print("esperar")',
      opciones: [
        ["esperar", true, "¡Bien! and necesita que AMBAS sean verdad, y viento < 15 es falso."],
        ["navegar", false, "Con and deben cumplirse las dos condiciones."],
        ["Da error", false, "La runa está bien escrita."],
      ],
    },
    {
      tipo: "teoria",
      texto:
        "<code>if</code> prueba una condición; <code>elif</code> prueba otra si la anterior falló; <code>else</code> es el plan B. Solo corre <b>una</b> rama. Compara con <code>== != &lt; &gt; &lt;= &gt;=</code>. Une condiciones con <code>and</code> (las dos), <code>or</code> (al menos una) y <code>not</code> (lo contrario).",
    },
    {
      tipo: "taller",
      reto: {
        id: "B5",
        titulo: "Runa B5 · La decisión del lago",
        enunciado: [
          "La variable <code>viento</code> ya existe: la mide el lago (no la vuelvas a escribir).",
          "Si <code>viento</code> es mayor que 40, muestra <code>quedarse</code>.",
          "Si no, pero es mayor que 20, muestra <code>remar con cuidado</code>. En otro caso, <code>navegar</code>.",
        ],
        plantilla: "# viento ya existe\nif viento > 40:\n    print(\"quedarse\")\n",
        preludio: "viento = 25",
        pistas: ["Agrega elif viento > 20: y debajo su print con 4 espacios", 'Al final: else: y print("navegar")'],
        comprobar: `
import io as _io, contextlib as _cl
for _v, _e in [(50, "quedarse"), (30, "remar con cuidado"), (10, "navegar"), (40, "remar con cuidado"), (20, "navegar")]:
    _s = _io.StringIO()
    with _cl.redirect_stdout(_s):
        exec(_codigo, {"viento": _v})
    if _s.getvalue().strip() != _e:
        _falla(f"Con viento = {_v} tu runa dijo «{_s.getvalue().strip()}», pero debía decir «{_e}».")
        break`,
        solucion: '# viento ya existe\nif viento > 40:\n    print("quedarse")\nelif viento > 20:\n    print("remar con cuidado")\nelse:\n    print("navegar")\n',
        exito: "¡Tu runa decidió bien en los 5 casos de prueba! 🌙",
      },
    },
    {
      tipo: "bug",
      texto: "Con viento = 50 esta runa dice «remar», ¡peligroso! ¿Por qué?",
      codigo: 'if viento > 20:\n    print("remar")\nelif viento > 40:\n    print("quedarse")',
      opciones: [
        ["El orden importa: 50 ya cumple > 20 y nunca llega a > 40", true, "¡Exacto! Pon primero la condición más estricta."],
        ["Falta un else", false, "else no arregla el orden de las condiciones."],
        ["elif no puede usar >", false, "Sí puede."],
      ],
    },
  ],
};

// =============================================================================
// ZONA 3 · RÍO UCAYALI (Amaru) — B7 while, B8 listas, recorrer listas, proyecto básico
// =============================================================================

export const B7_WHILE: Leccion = {
  id: "B7",
  modulo: "B7 Bucle while",
  titulo: "Remar río arriba",
  pasos: [
    { tipo: "voz", quien: "amaru", texto: "Para llegar a la comunidad hay que remar río arriba. No sabemos cuántas remadas: ¡remamos MIENTRAS falte camino!" },
    {
      tipo: "elegir",
      quien: "amaru",
      texto: "¿Cuántas veces dice «remar»?",
      codigo: 'energia = 3\nwhile energia > 0:\n    print("remar")\n    energia = energia - 1',
      opciones: [
        ["3", true, "¡Sí! energía pasa por 3, 2, 1 y en 0 se detiene."],
        ["2", false, "Cuenta otra vez: 3, 2 y 1 son mayores que 0."],
        ["Para siempre", false, "No: energia baja en cada vuelta y llega a 0."],
      ],
    },
    {
      tipo: "teoria",
      texto:
        "<code>while</code> repite <b>mientras</b> la condición sea verdadera. Dentro debe cambiar algo, o se repite para siempre (un <b>LoopBug</b>). <code>break</code> sale del bucle y <code>continue</code> salta a la siguiente vuelta. Usa <code>for</code> si sabes cuántas veces; <code>while</code> si no lo sabes.",
    },
    {
      tipo: "taller",
      reto: {
        id: "B7",
        titulo: "Runa B7 · ¿Cuántas remadas?",
        enunciado: [
          "Cada remada avanza <code>7</code> km. La comunidad está a <code>50</code> km.",
          "Con un <code>while</code>, suma 7 a <code>km</code> y 1 a <code>remadas</code> mientras <code>km &lt; 50</code>.",
          "Al final muestra <code>remadas</code>.",
        ],
        plantilla: "km = 0\nremadas = 0\nwhile km < 50:\n    \nprint(remadas)\n",
        pistas: ["Dentro del while van 2 líneas con 4 espacios", "km = km + 7\n    remadas = remadas + 1"],
        comprobar: `
if "while" not in _codigo: _falla("Usa un bucle while.")
elif remadas != 8: _falla(f"remadas vale {remadas}, pero se necesitan 8 remadas (8 × 7 = 56 km).")`,
        solucion: "km = 0\nremadas = 0\nwhile km < 50:\n    km = km + 7\n    remadas = remadas + 1\nprint(remadas)\n",
        exito: "¡8 remadas y llegaste! while es ideal cuando no sabes cuántas vueltas darás. 🛶",
      },
    },
    {
      tipo: "bug",
      codigo: "n = 5\nwhile n > 0:\n    print(n)",
      opciones: [
        ["n nunca cambia: es un bucle infinito. Falta n = n - 1", true, "¡Eso! Siempre cambia la variable de la condición."],
        ["Falta un else", false, "while funciona sin else."],
        ["print(n) va fuera del bucle", false, "El problema es que n no baja nunca."],
      ],
    },
  ],
};

export const B8_LISTAS: Leccion = {
  id: "B8",
  modulo: "B8 Listas",
  titulo: "La cosecha de la comunidad",
  pasos: [
    { tipo: "voz", quien: "amaru", texto: "La comunidad cosechó aguaje, camu camu y cocona. Una lista nos ayuda a guardar todo junto." },
    {
      tipo: "elegir",
      quien: "amaru",
      texto: "¿Qué muestra?",
      codigo: 'frutos = ["aguaje", "camu camu"]\nfrutos.append("cocona")\nprint(len(frutos), frutos[-1])',
      opciones: [
        ["3 cocona", true, "¡Sí! append agrega al final y len cuenta los elementos."],
        ["2 camu camu", false, "append agregó \"cocona\": ahora hay 3."],
        ["3 aguaje", false, "[-1] es el ÚLTIMO: cocona."],
      ],
    },
    {
      tipo: "teoria",
      texto:
        "Una <b>lista</b> guarda varios valores en orden: <code>[12, 30, 7]</code>. <code>append()</code> agrega, <code>remove()</code> quita, <code>len()</code> cuenta, <code>in</code> pregunta si algo está. Con números: <code>sum()</code>, <code>max()</code> y <code>min()</code>.",
      codigo: 'kilos = [12, 30, 7]\nprint(sum(kilos), max(kilos))   # 49 30\nprint(30 in kilos)               # True',
    },
    {
      tipo: "taller",
      reto: {
        id: "B8",
        titulo: "Runa B8 · Kilos de la cosecha",
        enunciado: [
          "<code>cosecha</code> tiene los kilos de 4 familias.",
          "Calcula <b>total</b> con <code>sum()</code>, <b>mayor</b> con <code>max()</code>…",
          "…y <b>promedio</b> = total dividido entre <code>len(cosecha)</code>.",
        ],
        plantilla: "cosecha = [12, 30, 7, 25]\ntotal = \nmayor = \npromedio = \nprint(total, mayor, promedio)\n",
        pistas: ["total = sum(cosecha)", "promedio = total / len(cosecha)"],
        comprobar: `
if total != 74: _falla(f"total vale {total}, pero 12 + 30 + 7 + 25 = 74.")
elif mayor != 30: _falla(f"mayor vale {mayor}; usa max(cosecha).")
elif promedio != 18.5: _falla(f"promedio vale {promedio}; debe ser 74 / 4 = 18.5.")
elif "len(" not in _codigo: _falla("Usa len(cosecha) para dividir (así funciona con cualquier cantidad de familias).")`,
        solucion: "cosecha = [12, 30, 7, 25]\ntotal = sum(cosecha)\nmayor = max(cosecha)\npromedio = total / len(cosecha)\nprint(total, mayor, promedio)\n",
        exito: "¡Cosecha contada! 74 kg en total. 🍇",
      },
    },
    {
      tipo: "bug",
      codigo: 'frutos = ["aguaje", "cocona"]\nprint(frutos[2])',
      opciones: [
        ["Solo existen [0] y [1]: es un IndexError", true, "¡Correcto! Con 2 elementos el último índice es 1."],
        ["Faltan comillas", false, "Las comillas están bien."],
        ["print no muestra listas", false, "Sí las muestra."],
      ],
    },
  ],
};

export const B8_RECORRER: Leccion = {
  id: "B8b",
  modulo: "B8 Listas",
  titulo: "Los diseños kené",
  pasos: [
    { tipo: "voz", quien: "amaru", texto: "Las artistas shipibo pintan diseños kené en tela y cerámica. Vamos a revisar las piezas una por una con un for." },
    {
      tipo: "elegir",
      quien: "amaru",
      texto: "¿Cuántas piezas cuentan como «grandes»?",
      codigo: "piezas = [15, 32, 8]\ngrandes = 0\nfor p in piezas:\n    if p > 10:\n        grandes = grandes + 1\nprint(grandes)",
      opciones: [
        ["2", true, "¡Sí! 15 y 32 son mayores que 10."],
        ["3", false, "8 no es mayor que 10."],
        ["1", false, "Revisa 15 y 32."],
      ],
    },
    {
      tipo: "teoria",
      texto:
        "<code>for elemento in lista:</code> visita cada elemento. Un <b>contador</b> empieza en 0 <b>antes</b> del bucle y suma 1 cuando se cumple algo. Un <b>acumulador</b> suma valores.",
    },
    {
      tipo: "taller",
      reto: {
        id: "B8b",
        titulo: "Runa B8 · Piezas valiosas",
        enunciado: [
          "<code>precios</code> tiene el precio de cada cerámica.",
          "Con un <code>for</code> y un <code>if</code>, cuenta en <b>caras</b> cuántas cuestan <b>más de 20</b>.",
          "Muestra <code>caras</code>.",
        ],
        plantilla: "precios = [15, 32, 20, 45, 8, 27]\ncaras = 0\nfor p in precios:\n    \nprint(caras)\n",
        pistas: ["Dentro del for: if p > 20:", "Y dentro del if (8 espacios): caras = caras + 1"],
        comprobar: `
if "for" not in _codigo or "if" not in _codigo: _falla("Usa un for y un if.")
elif caras != 3: _falla(f"caras vale {caras}, pero hay 3 piezas de más de 20 (32, 45 y 27). Ojo: 20 no es MÁS de 20.")`,
        solucion: "precios = [15, 32, 20, 45, 8, 27]\ncaras = 0\nfor p in precios:\n    if p > 20:\n        caras = caras + 1\nprint(caras)\n",
        exito: "¡3 piezas valiosas! Contador + for + if: una combinación que usarás siempre. 🏺",
      },
    },
    {
      tipo: "bug",
      texto: "Este contador siempre termina en 0 o 1. ¿Por qué?",
      codigo: "for p in precios:\n    caras = 0\n    if p > 20:\n        caras = caras + 1",
      opciones: [
        ["caras = 0 está DENTRO del for: se reinicia en cada vuelta", true, "¡Exacto! El contador va antes del bucle."],
        ["Falta un else", false, "El problema es dónde empieza el contador."],
        ["Debería usar while", false, "for está bien; el contador está mal ubicado."],
      ],
    },
  ],
};

export const PROYECTO_BASICO: Leccion = {
  id: "PB",
  modulo: "🏆 Proyecto básico",
  titulo: "El censo de la cosecha",
  pasos: [
    { tipo: "voz", quien: "amaru", texto: "¡Proyecto final del nivel básico! La comunidad necesita saber si la cosecha alcanza para la temporada de lluvias. Usarás todo lo aprendido." },
    {
      tipo: "teoria",
      texto:
        "Un buen programa sigue 3 pasos: <b>1. Pedir los datos</b> (input + int), <b>2. Procesarlos</b> (listas, bucles, cuentas) y <b>3. Decidir y mostrar</b> (if + f-strings). Piensa el plan antes de escribir.",
    },
    {
      tipo: "taller",
      reto: {
        id: "PB",
        titulo: "🏆 Proyecto · El censo de la cosecha",
        enunciado: [
          "Pide con <code>input</code> cuántas familias hay (el guardián dirá <b>4</b>).",
          "Con un <code>for</code>, pide los kilos de cada familia (<b>12, 30, 7, 25</b>), conviértelos y guárdalos en la lista <code>cosecha</code>.",
          "Calcula <code>total</code> y <code>promedio</code>. Si <code>total &gt;= 70</code> muestra <code>Alcanza</code>; si no, <code>Falta</code>.",
        ],
        plantilla: '# 1. Pedir los datos\nfamilias = int(input("Familias: "))\ncosecha = []\n\n# 2. Procesar\n\n# 3. Decidir\n',
        preludio: entradas(["4", "12", "30", "7", "25"]),
        pistas: [
          "for i in range(familias):",
          '    kilos = int(input("Kilos: "))\n    cosecha.append(kilos)',
          "total = sum(cosecha) y promedio = total / len(cosecha)",
        ],
        comprobar: `
if cosecha != [12, 30, 7, 25]: _falla(f"cosecha es {cosecha}; debería ser [12, 30, 7, 25] (¿convertiste con int y usaste append?).")
elif total != 74 or promedio != 18.5: _falla("Revisa total (74) y promedio (18.5).")
elif "Alcanza" not in _salida: _falla("Con 74 kilos la cosecha alcanza: muestra «Alcanza» con un if.")`,
        solucion:
          '# 1. Pedir los datos\nfamilias = int(input("Familias: "))\ncosecha = []\n\n# 2. Procesar\nfor i in range(familias):\n    kilos = int(input("Kilos: "))\n    cosecha.append(kilos)\ntotal = sum(cosecha)\npromedio = total / len(cosecha)\n\n# 3. Decidir\nif total >= 70:\n    print(f"Alcanza: {total} kg (promedio {promedio})")\nelse:\n    print("Falta")\n',
        exito: "🏆 ¡Proyecto básico completado! Escribiste un programa completo: datos, bucles, listas y decisiones.",
      },
    },
  ],
};

// =============================================================================
// ZONA 4 · KUÉLAP (Killa) — I1 funciones, I2 diccionarios, I3 tuplas y sets, I4 métodos de texto
// =============================================================================

export const I1_FUNCIONES: Leccion = {
  id: "I1",
  modulo: "I1 Funciones a fondo",
  titulo: "La muralla de Kuélap",
  pasos: [
    { tipo: "voz", quien: "killa", texto: "Los chachapoyas levantaron murallas enormes en Kuélap. Vamos a crear una función que calcule las piedras de un muro." },
    {
      tipo: "elegir",
      quien: "killa",
      texto: "El parámetro alto tiene un valor por defecto. ¿Qué muestra?",
      codigo: "def area(base, alto=2):\n    return base * alto\n\nprint(area(5), area(5, 3))",
      opciones: [
        ["10 15", true, "¡Sí! Si no das alto, usa 2. Si lo das, usa el tuyo."],
        ["Error: falta alto", false, "alto tiene valor por defecto: es opcional."],
        ["5 15", false, "area(5) usa alto = 2: 5 × 2 = 10."],
      ],
    },
    {
      tipo: "elegir",
      quien: "killa",
      texto: "¿Qué muestra el último print?",
      codigo: "def doble(x):\n    print(x * 2)\n\nr = doble(4)\nprint(r)",
      opciones: [
        ["8 y luego None", true, "¡Exacto! La función MUESTRA 8, pero no DEVUELVE nada: r es None."],
        ["8 y luego 8", false, "Sin return, la función devuelve None."],
        ["Solo 8", false, "El segundo print muestra r, que es None."],
      ],
    },
    {
      tipo: "teoria",
      texto:
        "Los <b>parámetros</b> son los datos que recibe la función; puedes darles <b>valor por defecto</b>. <code>return</code> devuelve un resultado (puedes devolver varios: <code>return a, b</code>). Las variables creadas dentro de la función son <b>locales</b>: no existen afuera.",
      codigo: "def dividir(a, b):\n    return a // b, a % b\n\ncociente, resto = dividir(17, 5)   # 3 2",
    },
    {
      tipo: "taller",
      reto: {
        id: "I1",
        titulo: "Runa I1 · Calcular un muro",
        enunciado: [
          "Crea <code>muro(largo, alto, por_m2=12)</code>.",
          "Debe calcular <b>piedras</b> = largo × alto × por_m2 y <b>horas</b> = piedras // 50.",
          "Debe <b>devolver las dos</b>: <code>return piedras, horas</code>.",
        ],
        plantilla: "def muro(largo, alto, por_m2=12):\n    \n\nprint(muro(10, 3))\n",
        pistas: ["piedras = largo * alto * por_m2", "horas = piedras // 50", "return piedras, horas"],
        comprobar: `
try:
    _a, _b = muro(10, 3), muro(4, 2, 20)
except Exception as _e:
    _falla(f"Tu función falló al probarla: {_e}")
else:
    if _a is None: _falla("Tu función no devuelve nada: falta return.")
    elif _a != (360, 7): _falla(f"muro(10, 3) devolvió {_a}; debería ser (360, 7).")
    elif _b != (160, 3): _falla(f"muro(4, 2, 20) devolvió {_b}; debería ser (160, 3). ¿Usas por_m2?")`,
        solucion: "def muro(largo, alto, por_m2=12):\n    piedras = largo * alto * por_m2\n    horas = piedras // 50\n    return piedras, horas\n\nprint(muro(10, 3))\n",
        exito: "¡Función profesional! Parámetros, valor por defecto y dos resultados. 🧱",
      },
    },
    {
      tipo: "bug",
      codigo: "def piedras(largo, alto):\n    total = largo * alto\n\npiedras(3, 4)\nprint(total)",
      opciones: [
        ["total es local: no existe fuera de la función. Usa return total", true, "¡Exacto! Lo que pasa dentro de la función se queda dentro, salvo lo que devuelve."],
        ["Falta print dentro de la función", false, "Eso solo lo mostraría; total seguiría sin existir afuera."],
        ["largo y alto están al revés", false, "El orden no es el problema."],
      ],
    },
  ],
};

export const I2_DICCIONARIOS: Leccion = {
  id: "I2",
  modulo: "I2 Diccionarios",
  titulo: "El almacén chachapoya",
  pasos: [
    { tipo: "voz", quien: "killa", texto: "En el almacén se guarda cuánto hay de cada producto. Un diccionario une cada nombre con su cantidad." },
    {
      tipo: "elegir",
      quien: "killa",
      texto: "¿Qué muestra?",
      codigo: 'almacen = {"maiz": 10, "papa": 25}\nprint(almacen["papa"], almacen.get("oca", 0))',
      opciones: [
        ["25 0", true, "¡Sí! get devuelve 0 si la clave no existe, sin error."],
        ["25 Error", false, "get evita el error: devuelve el valor por defecto."],
        ["10 0", false, "La clave \"papa\" vale 25."],
      ],
    },
    {
      tipo: "teoria",
      texto:
        "Un <b>diccionario</b> guarda pares <b>clave: valor</b>: <code>{\"maiz\": 10}</code>. Lees con <code>d[\"clave\"]</code> o <code>d.get(\"clave\", por_defecto)</code>, agregas con <code>d[\"nueva\"] = 5</code> y recorres con <code>for clave, valor in d.items():</code>.",
    },
    {
      tipo: "taller",
      reto: {
        id: "I2",
        titulo: "Runa I2 · Ordenar el almacén",
        enunciado: [
          "Agrega <code>\"quinua\": 8</code> al diccionario <code>almacen</code>.",
          "Suma 5 a <code>\"maiz\"</code>.",
          "Calcula <code>total</code> con <code>sum(almacen.values())</code> y muestra cada producto con un <code>for</code> y <code>.items()</code>.",
        ],
        plantilla: 'almacen = {"maiz": 10, "papa": 25}\n\n',
        pistas: ['almacen["quinua"] = 8', 'almacen["maiz"] = almacen["maiz"] + 5', 'for nombre, cantidad in almacen.items():\n    print(nombre, cantidad)'],
        comprobar: `
if almacen.get("quinua") != 8: _falla("Falta agregar quinua con 8.")
elif almacen.get("maiz") != 15: _falla(f"maiz vale {almacen.get('maiz')}; debería ser 15.")
elif total != 48: _falla(f"total vale {total}; debería ser 48.")
elif ".items()" not in _codigo: _falla("Muestra los productos recorriendo almacen.items() con un for.")`,
        solucion: 'almacen = {"maiz": 10, "papa": 25}\nalmacen["quinua"] = 8\nalmacen["maiz"] = almacen["maiz"] + 5\ntotal = sum(almacen.values())\nfor nombre, cantidad in almacen.items():\n    print(nombre, cantidad)\nprint("Total:", total)\n',
        exito: "¡Almacén ordenado! Los diccionarios son la base de casi todos los programas reales. 🌽",
      },
    },
    {
      tipo: "bug",
      codigo: 'almacen = {"maiz": 10}\nprint(almacen["oca"])',
      opciones: [
        ['"oca" no es una clave: KeyError. Usa almacen.get("oca", 0)', true, "¡Eso! get es la forma segura."],
        ["Faltan llaves", false, "El diccionario está bien escrito."],
        ["Los diccionarios no se pueden imprimir", false, "Sí se pueden."],
      ],
    },
  ],
};

export const I3_TUPLAS_SETS: Leccion = {
  id: "I3",
  modulo: "I3 Tuplas y sets",
  titulo: "El mirador de Karajía",
  pasos: [
    { tipo: "voz", quien: "killa", texto: "Desde aquí se ven los sarcófagos de Karajía en el acantilado. Anotemos coordenadas y las aves que vemos." },
    {
      tipo: "elegir",
      quien: "killa",
      texto: "¿Qué muestra?",
      codigo: 'punto = (3, 5)\nx, y = punto\naves = {"colibrí", "cóndor", "colibrí"}\nprint(y, len(aves))',
      opciones: [
        ["5 2", true, "¡Sí! Se desempaqueta la tupla, y el set elimina el colibrí repetido."],
        ["5 3", false, "Un set no guarda repetidos."],
        ["3 2", false, "x vale 3 e y vale 5."],
      ],
    },
    {
      tipo: "teoria",
      texto:
        "Una <b>tupla</b> <code>(3, 5)</code> es como una lista que <b>no se puede cambiar</b>: ideal para coordenadas. Se desempaqueta: <code>x, y = punto</code>. Un <b>set</b> <code>{...}</code> no guarda repetidos: <code>|</code> une dos sets y <code>&amp;</code> da lo que tienen en común.",
    },
    {
      tipo: "taller",
      reto: {
        id: "I3",
        titulo: "Runa I3 · Aves avistadas",
        enunciado: [
          "Convierte <code>dia1</code> y <code>dia2</code> en sets.",
          "<b>unicas</b>: todas las especies vistas (unión <code>|</code>).",
          "<b>comunes</b>: las vistas ambos días (intersección <code>&amp;</code>).",
        ],
        plantilla: 'dia1 = ["colibrí", "cóndor", "gallito", "colibrí"]\ndia2 = ["cóndor", "pava", "colibrí"]\nunicas = \ncomunes = \nprint(len(unicas), comunes)\n',
        pistas: ["unicas = set(dia1) | set(dia2)", "comunes = set(dia1) & set(dia2)"],
        comprobar: `
if not isinstance(unicas, set) or not isinstance(comunes, set): _falla("unicas y comunes deben ser sets: usa set(...).")
elif unicas != {"colibrí", "cóndor", "gallito", "pava"}: _falla(f"unicas es {unicas}; deberían ser 4 especies.")
elif comunes != {"colibrí", "cóndor"}: _falla(f"comunes es {comunes}; deberían ser colibrí y cóndor.")`,
        solucion: 'dia1 = ["colibrí", "cóndor", "gallito", "colibrí"]\ndia2 = ["cóndor", "pava", "colibrí"]\nunicas = set(dia1) | set(dia2)\ncomunes = set(dia1) & set(dia2)\nprint(len(unicas), comunes)\n',
        exito: "¡4 especies distintas! Los sets eliminan repetidos al instante. 🦜",
      },
    },
    {
      tipo: "bug",
      codigo: "punto = (3, 5)\npunto[0] = 4",
      opciones: [
        ["Las tuplas no se pueden cambiar: crea una nueva, punto = (4, 5)", true, "¡Correcto! TypeError: las tuplas son inmutables."],
        ["Los índices empiezan en 1", false, "Empiezan en 0."],
        ["Faltan corchetes", false, "El problema es que las tuplas no cambian."],
      ],
    },
  ],
};

export const I4_METODOS_TEXTO: Leccion = {
  id: "I4",
  modulo: "I4 Métodos de texto",
  titulo: "El mensaje en la piedra",
  pasos: [
    { tipo: "voz", quien: "killa", texto: "El Bug llenó de símbolos raros el mensaje grabado en la piedra. ¡Limpiémoslo con métodos de texto!" },
    {
      tipo: "elegir",
      quien: "killa",
      texto: "¿Qué muestra?",
      codigo: 'print("  kuelap  ".strip().upper())\nprint("a,b,c".split(","))',
      opciones: [
        ["KUELAP y ['a', 'b', 'c']", true, "¡Sí! strip quita espacios, upper pone mayúsculas y split corta por comas."],
        ["  KUELAP   y abc", false, "strip quita los espacios de los bordes."],
        ["kuelap y ['a,b,c']", false, "upper convierte a MAYÚSCULAS."],
      ],
    },
    {
      tipo: "teoria",
      texto:
        "Métodos útiles: <code>upper() lower() capitalize() strip() replace(a, b) split() join() find()</code>. Los textos <b>no cambian</b>: el método devuelve uno nuevo, guárdalo en una variable. Formato de números: <code>f\"{precio:.2f}\"</code> muestra 2 decimales.",
    },
    {
      tipo: "taller",
      reto: {
        id: "I4",
        titulo: "Runa I4 · Limpiar el mensaje",
        enunciado: [
          "<b>limpio</b>: quita los espacios de los bordes, cambia <code>##</code> por un espacio y deja solo la primera letra en mayúscula.",
          "Debe quedar: <code>La fortaleza de las nubes</code>",
          "<b>palabras</b>: la lista de palabras de <code>limpio</code> (con <code>split()</code>).",
        ],
        plantilla: 'mensaje = "  la##FORTALEZA##de##las##nubes  "\nlimpio = \npalabras = \nprint(limpio, len(palabras))\n',
        pistas: ['limpio = mensaje.strip().replace("##", " ")', "Agrega .capitalize() al final", "palabras = limpio.split()"],
        comprobar: `
if limpio != "La fortaleza de las nubes": _falla(f"limpio quedó «{limpio}». Usa strip(), replace() y capitalize().")
elif palabras != ["La", "fortaleza", "de", "las", "nubes"]: _falla("palabras debe ser limpio.split().")`,
        solucion: 'mensaje = "  la##FORTALEZA##de##las##nubes  "\nlimpio = mensaje.strip().replace("##", " ").capitalize()\npalabras = limpio.split()\nprint(limpio, len(palabras))\n',
        exito: "¡Mensaje restaurado! Encadenar métodos es muy usado en la vida real. ☁️",
      },
    },
    {
      tipo: "bug",
      texto: "Esto muestra «killa» en minúsculas. ¿Por qué?",
      codigo: 'nombre = "killa"\nnombre.upper()\nprint(nombre)',
      opciones: [
        ["upper() devuelve un texto nuevo y no se guardó: nombre = nombre.upper()", true, "¡Exacto! Los textos no cambian solos."],
        ["upper() solo funciona con print", false, "Funciona siempre, pero hay que guardar el resultado."],
        ["Faltan comillas en upper", false, "Es un método, no lleva comillas."],
      ],
    },
  ],
};

// =============================================================================
// ZONA 5 · CHAVÍN DE HUÁNTAR (Amaru) — I5 errores, I6 comprensiones y lambda, I7 clases
// =============================================================================

export const I5_ERRORES: Leccion = {
  id: "I5",
  modulo: "I5 Errores y excepciones",
  titulo: "Las galerías subterráneas",
  pasos: [
    { tipo: "voz", quien: "amaru", texto: "Las galerías de Chavín son un laberinto bajo tierra. Aquí los errores acechan: aprendamos a atraparlos antes de que nos dañen." },
    {
      tipo: "elegir",
      quien: "amaru",
      texto: "¿Qué muestra?",
      codigo: 'try:\n    n = int("diez")\nexcept ValueError:\n    n = 0\nprint(n)',
      opciones: [
        ["0", true, "¡Sí! El error se atrapó y n tomó el plan B."],
        ["Error", false, "except ValueError atrapa justamente ese error."],
        ["10", false, "int no entiende \"diez\" escrito con letras."],
      ],
    },
    {
      tipo: "teoria",
      texto:
        "<code>try:</code> intenta algo riesgoso; <code>except TipoDeError:</code> dice qué hacer si falla. <code>else:</code> corre si no hubo error y <code>finally:</code> corre siempre. Atrapa errores <b>específicos</b> (<code>ValueError</code>, <code>ZeroDivisionError</code>…). Con <code>raise</code> lanzas tus propios errores.",
    },
    {
      tipo: "taller",
      reto: {
        id: "I5",
        titulo: "Runa I5 · El escudo inteligente",
        enunciado: [
          "<code>convertir(texto)</code>: devuelve <code>int(texto)</code>, o <code>0</code> si hay <code>ValueError</code>.",
          "<code>repartir(total, personas)</code>: devuelve <code>total // personas</code>, o <code>None</code> si hay <code>ZeroDivisionError</code>.",
          "Usa <code>try</code> / <code>except</code> en ambas.",
        ],
        plantilla: "def convertir(texto):\n    \n\ndef repartir(total, personas):\n    \n\nprint(convertir(\"12\"), convertir(\"doce\"), repartir(10, 0))\n",
        pistas: ["try:\n        return int(texto)\n    except ValueError:\n        return 0", "Igual en repartir, con except ZeroDivisionError: return None"],
        comprobar: `
try:
    _r = (convertir("12"), convertir("doce"), repartir(10, 3), repartir(10, 0))
except Exception as _e:
    _falla(f"Un error se escapó de tu escudo: {type(_e).__name__}. Atrápalo con try/except.")
else:
    if _r != (12, 0, 3, None): _falla(f"Tus funciones dieron {_r}; se esperaba (12, 0, 3, None).")
    elif "except:" in _codigo.replace(" ", ""): _falla("No uses un except vacío: atrapa ValueError y ZeroDivisionError por su nombre.")`,
        solucion: "def convertir(texto):\n    try:\n        return int(texto)\n    except ValueError:\n        return 0\n\ndef repartir(total, personas):\n    try:\n        return total // personas\n    except ZeroDivisionError:\n        return None\n\nprint(convertir(\"12\"), convertir(\"doce\"), repartir(10, 0))\n",
        exito: "¡Escudo activado! Tu programa ya no se cae con datos raros. 🛡️",
      },
    },
    {
      tipo: "bug",
      codigo: "try:\n    resultado = calcular()\nexcept:\n    pass",
      opciones: [
        ["Un except vacío esconde TODOS los errores, hasta los de escritura", true, "¡Exacto! Atrapa solo el error que esperas."],
        ["pass no existe en Python", false, "pass sí existe: significa «no hacer nada»."],
        ["Falta finally", false, "finally es opcional."],
      ],
    },
  ],
};

export const I6_COMPRENSIONES: Leccion = {
  id: "I6",
  modulo: "I6 Comprensiones y lambda",
  titulo: "Las cabezas clavas",
  pasos: [
    { tipo: "voz", quien: "amaru", texto: "Las cabezas clavas adornaban los muros del templo. Vamos a ordenar el ranking de aventureros con código corto y poderoso." },
    {
      tipo: "elegir",
      quien: "amaru",
      texto: "¿Qué muestra?",
      codigo: "nums = [5, 12, 8]\nprint([n * 2 for n in nums if n > 6])",
      opciones: [
        ["[24, 16]", true, "¡Sí! Filtra los mayores que 6 (12 y 8) y los duplica."],
        ["[10, 24, 16]", false, "5 no pasa el filtro n > 6."],
        ["[12, 8]", false, "Además los multiplica por 2."],
      ],
    },
    {
      tipo: "teoria",
      texto:
        "Una <b>comprensión</b> crea una lista en una línea: <code>[expresión for x in lista if condición]</code>. Una <b>lambda</b> es una función pequeña sin nombre: <code>lambda x: x * 2</code>. Se usa mucho para ordenar: <code>sorted(lista, key=lambda a: a[1])</code>.",
    },
    {
      tipo: "taller",
      reto: {
        id: "I6",
        titulo: "Runa I6 · El ranking",
        enunciado: [
          "<b>ranking</b>: <code>aventureros</code> ordenado por puntos, de mayor a menor (usa <code>sorted</code>, <code>key=lambda</code> y <code>reverse=True</code>).",
          "<b>top</b>: con una comprensión, solo los <b>nombres</b> de quienes tienen más de 40 puntos, en el orden del ranking.",
        ],
        plantilla: 'aventureros = [("Ana", 30), ("Luis", 55), ("Rosa", 42), ("Teo", 18)]\nranking = \ntop = \nprint(top)\n',
        pistas: ["ranking = sorted(aventureros, key=lambda a: a[1], reverse=True)", "top = [nombre for nombre, puntos in ranking if puntos > 40]"],
        comprobar: `
if ranking != [("Luis", 55), ("Rosa", 42), ("Ana", 30), ("Teo", 18)]: _falla(f"ranking quedó {ranking}. Ordena por el puntaje (a[1]) de mayor a menor.")
elif top != ["Luis", "Rosa"]: _falla(f"top es {top}; debería ser ['Luis', 'Rosa'].")
elif "lambda" not in _codigo or " for " not in _codigo: _falla("Usa lambda para ordenar y una comprensión [ ... for ... ] para top.")`,
        solucion: 'aventureros = [("Ana", 30), ("Luis", 55), ("Rosa", 42), ("Teo", 18)]\nranking = sorted(aventureros, key=lambda a: a[1], reverse=True)\ntop = [nombre for nombre, puntos in ranking if puntos > 40]\nprint(top)\n',
        exito: "¡Ranking listo en 2 líneas! Así escriben código los profesionales. 🏅",
      },
    },
    {
      tipo: "bug",
      codigo: "doble = lambda x: return x * 2",
      opciones: [
        ["Una lambda no lleva return: lambda x: x * 2", true, "¡Correcto! La lambda devuelve su expresión automáticamente."],
        ["Faltan paréntesis en x", false, "lambda x funciona sin paréntesis."],
        ["lambda no puede multiplicar", false, "Sí puede."],
      ],
    },
  ],
};

export const I7_CLASES: Leccion = {
  id: "I7",
  modulo: "I7 Clases y objetos",
  titulo: "El guardián del Lanzón",
  pasos: [
    { tipo: "voz", quien: "amaru", texto: "En el corazón del templo está el Lanzón. Para protegerlo crearemos guardianes con una CLASE: un molde para fabricar objetos." },
    {
      tipo: "elegir",
      quien: "amaru",
      texto: "¿Qué muestra?",
      codigo: 'class Bug:\n    def __init__(self, nombre, vida):\n        self.nombre = nombre\n        self.vida = vida\n\n    def recibir(self, dano):\n        self.vida = self.vida - dano\n\nb = Bug("Loop", 30)\nb.recibir(12)\nprint(b.vida)',
      opciones: [
        ["18", true, "¡Sí! El objeto b guarda su vida y el método la cambia."],
        ["30", false, "recibir(12) le restó 12."],
        ["Error: falta self", false, "self está bien puesto en cada método."],
      ],
    },
    {
      tipo: "teoria",
      texto:
        "Una <b>clase</b> es un molde; cada <b>objeto</b> creado con ella tiene sus propios datos (<b>atributos</b>) y acciones (<b>métodos</b>). <code>__init__</code> prepara el objeto y <code>self</code> es «este objeto». <code>__str__</code> define cómo se ve al imprimirlo. Con herencia, <code>class Jefe(Bug):</code> reutiliza todo lo de Bug.",
    },
    {
      tipo: "taller",
      reto: {
        id: "I7",
        titulo: "Runa I7 · Fabrica un guardián",
        enunciado: [
          "Crea <code>class Guardian</code> con <code>__init__(self, nombre, vida=100)</code>.",
          "<code>recibir(self, dano)</code>: resta el daño, pero la vida nunca baja de 0. <code>vivo(self)</code>: devuelve <code>True</code> si vida &gt; 0.",
          "<code>__str__</code> devuelve, por ejemplo, <code>Killa (70)</code>.",
        ],
        plantilla: "class Guardian:\n    def __init__(self, nombre, vida=100):\n        \n\ng = Guardian(\"Killa\")\ng.recibir(30)\nprint(g)\n",
        pistas: ["self.nombre = nombre\n        self.vida = vida", "def recibir(self, dano):\n        self.vida = max(0, self.vida - dano)", 'def __str__(self):\n        return f"{self.nombre} ({self.vida})"'],
        comprobar: `
try:
    _g = Guardian("Killa")
    _g.recibir(30)
    _t = str(_g)
    _g2 = Guardian("Amaru", 20)
    _g2.recibir(50)
    _r = (_g.vida, _t, _g2.vida, _g.vivo(), _g2.vivo())
except Exception as _e:
    _falla(f"Tu clase falló al probarla: {type(_e).__name__}: {_e}")
else:
    if _r[0] != 70: _falla(f"Tras recibir 30, la vida es {_r[0]}; debería ser 70.")
    elif _r[1] != "Killa (70)": _falla(f"Al imprimir sale «{_r[1]}»; debería ser «Killa (70)».")
    elif _r[2] != 0: _falla(f"La vida no puede bajar de 0 (quedó {_r[2]}). Usa max(0, ...).")
    elif _r[3] is not True or _r[4] is not False: _falla("vivo() debe devolver True si vida > 0 y False si no.")`,
        solucion: 'class Guardian:\n    def __init__(self, nombre, vida=100):\n        self.nombre = nombre\n        self.vida = vida\n\n    def recibir(self, dano):\n        self.vida = max(0, self.vida - dano)\n\n    def vivo(self):\n        return self.vida > 0\n\n    def __str__(self):\n        return f"{self.nombre} ({self.vida})"\n\ng = Guardian("Killa")\ng.recibir(30)\nprint(g)\n',
        exito: "¡Fabricaste tu primer objeto! Las clases son la base de los videojuegos de verdad. 🗿",
      },
    },
    {
      tipo: "bug",
      codigo: "class Bug:\n    def atacar():\n        print(\"¡Ataque!\")\n\nBug().atacar()",
      opciones: [
        ["Falta self: def atacar(self):", true, "¡Eso! Todo método recibe el objeto como primer parámetro."],
        ["Falta __init__", false, "__init__ es opcional."],
        ["print no se usa en clases", false, "Sí se puede usar."],
      ],
    },
  ],
};

// =============================================================================
// ZONA 6 · TU AYLLU (Yaru) — I8 módulos, I9 pruebas, I10 archivos, proyecto intermedio
// =============================================================================

export const I8_MODULOS: Leccion = {
  id: "I8",
  modulo: "I8 Módulos y buenas prácticas",
  titulo: "El calendario de la siembra",
  pasos: [
    { tipo: "voz", quien: "yaru", texto: "¡Mee! Soy Yaru. En el ayllu se siembra según el clima. Python ya trae herramientas listas: se llaman módulos." },
    {
      tipo: "elegir",
      quien: "yaru",
      texto: "¿Qué muestra?",
      codigo: "import math\nprint(math.sqrt(16), math.pi > 3)",
      opciones: [
        ["4.0 True", true, "¡Sí! sqrt da la raíz cuadrada y pi vale 3.14…"],
        ["4 False", false, "sqrt devuelve decimal y pi es mayor que 3."],
        ["Error: math no existe", false, "math viene con Python."],
      ],
    },
    {
      tipo: "teoria",
      texto:
        "<code>import modulo</code> trae herramientas: <code>math</code> (cálculos), <code>random</code> (azar), <code>datetime</code> (fechas). Buenas prácticas: nombres claros (<code>temperatura</code>, no <code>t1</code>), un <b>docstring</b> que explique la función y <b>type hints</b>: <code>def f(x: int) -&gt; str:</code>.",
    },
    {
      tipo: "taller",
      reto: {
        id: "I8",
        titulo: "Runa I8 · ¿Qué sembrar?",
        enunciado: [
          "Crea <code>def clima(temperatura: int) -&gt; str:</code> con un <b>docstring</b>.",
          "Devuelve <code>helada</code> si es menor que 0, <code>frio</code> si es menor que 12, y si no <code>templado</code>.",
          "Con <code>import random</code>, guarda en <code>semilla</code> una opción al azar de <code>semillas</code>.",
        ],
        plantilla: 'import random\n\nsemillas = ["papa", "oca", "quinua"]\n\ndef clima(temperatura: int) -> str:\n    """Escribe aquí qué hace la función."""\n    \n\nsemilla = \nprint(clima(5), semilla)\n',
        pistas: ['if temperatura < 0:\n        return "helada"', 'elif temperatura < 12:\n        return "frio"\n    return "templado"', "semilla = random.choice(semillas)"],
        comprobar: `
if not (clima.__doc__ or "").strip() or "Escribe aquí" in (clima.__doc__ or ""): _falla("Escribe un docstring que explique la función.")
elif [clima(-3), clima(5), clima(12), clima(20)] != ["helada", "frio", "templado", "templado"]: _falla(f"clima(-3), clima(5), clima(12), clima(20) dieron {[clima(-3), clima(5), clima(12), clima(20)]}.")
elif semilla not in semillas or "random.choice" not in _codigo: _falla("Usa random.choice(semillas) para elegir la semilla.")`,
        solucion: 'import random\n\nsemillas = ["papa", "oca", "quinua"]\n\ndef clima(temperatura: int) -> str:\n    """Dice el tipo de clima según la temperatura en grados."""\n    if temperatura < 0:\n        return "helada"\n    elif temperatura < 12:\n        return "frio"\n    return "templado"\n\nsemilla = random.choice(semillas)\nprint(clima(5), semilla)\n',
        exito: "¡Código claro y documentado! Así lo escribe un equipo profesional. 🌱",
      },
    },
    {
      tipo: "bug",
      codigo: "import Random\nprint(Random.randint(1, 6))",
      opciones: [
        ["Los módulos van en minúsculas: import random", true, "¡Exacto! ModuleNotFoundError por la mayúscula."],
        ["randint no existe", false, "random.randint sí existe."],
        ["Faltan comillas en import", false, "import no usa comillas."],
      ],
    },
  ],
};

export const I9_PRUEBAS: Leccion = {
  id: "I9",
  modulo: "I9 Pruebas",
  titulo: "La prueba del puente",
  pasos: [
    { tipo: "voz", quien: "yaru", texto: "¡Mee! Antes de cruzar un puente nuevo, se prueba. Con el código es igual: las pruebas atrapan errores antes que los usuarios." },
    {
      tipo: "elegir",
      quien: "yaru",
      texto: "¿Qué pasa al ejecutar esto?",
      codigo: "assert 2 + 2 == 4\nassert 2 + 2 == 5",
      opciones: [
        ["La primera pasa y la segunda lanza AssertionError", true, "¡Sí! assert no dice nada si es verdad y explota si es falso."],
        ["Las dos pasan", false, "2 + 2 no es 5."],
        ["Muestra True y False", false, "assert no muestra nada si pasa."],
      ],
    },
    {
      tipo: "teoria",
      texto:
        "<code>assert condición</code> comprueba que algo sea verdad. Una función de prueba (<code>def test_...():</code>) reúne varios asserts. Prueba el caso normal y los <b>casos borde</b>: cero, negativos, listas vacías. En proyectos reales se usa <b>pytest</b>, que corre todas las funciones <code>test_</code>.",
    },
    {
      tipo: "taller",
      reto: {
        id: "I9",
        titulo: "Runa I9 · Prueba la función",
        enunciado: [
          "<code>materiales(casas)</code> calcula 12 adobes por casa.",
          "Escribe <code>def test_materiales():</code> con al menos 3 <code>assert</code>, incluido el caso borde <code>materiales(0) == 0</code>.",
          "El juego probará tu test contra 3 funciones con errores escondidos: ¡debe atraparlas todas!",
        ],
        plantilla: "def materiales(casas):\n    return casas * 12\n\ndef test_materiales():\n    assert materiales(1) == 12\n\ntest_materiales()\nprint(\"Pruebas pasadas\")\n",
        pistas: ["Agrega assert materiales(0) == 0", "Y otro caso: assert materiales(5) == 60"],
        comprobar: `
_buena = materiales
_malas = [lambda c: c * 10, lambda c: c * 12 + 1, lambda c: 12 if c == 0 else c * 12]
_escapan = 0
for _m in _malas:
    globals()["materiales"] = _m
    try:
        test_materiales()
        _escapan += 1
    except AssertionError:
        pass
globals()["materiales"] = _buena
if _escapan: _falla(f"{_escapan} función(es) con errores pasaron tu test. ¿Probaste el caso borde materiales(0) == 0 y otro número?")`,
        solucion: 'def materiales(casas):\n    return casas * 12\n\ndef test_materiales():\n    assert materiales(1) == 12\n    assert materiales(5) == 60\n    assert materiales(0) == 0\n\ntest_materiales()\nprint("Pruebas pasadas")\n',
        exito: "¡Tu test atrapó los 3 errores escondidos! Eso es pensar como un tester profesional. ✅",
      },
    },
    {
      tipo: "bug",
      texto: "Este test pasa… pero la función tiene un error con 0. ¿Qué le falta?",
      codigo: "def test_doble():\n    assert doble(3) == 6",
      opciones: [
        ["Probar casos borde como doble(0) y doble(-2)", true, "¡Exacto! Probar solo el caso fácil no basta."],
        ["Cambiar assert por print", false, "print no comprueba nada."],
        ["Nada: un assert es suficiente", false, "Un solo caso deja errores escondidos."],
      ],
    },
  ],
};

export const I10_ARCHIVOS: Leccion = {
  id: "I10",
  modulo: "I10 Archivos y JSON",
  titulo: "Guardar el ayllu",
  pasos: [
    { tipo: "voz", quien: "yaru", texto: "¡Mee! Si se apaga el celular, ¿se pierde la aldea? No si la guardamos en un archivo." },
    {
      tipo: "elegir",
      quien: "yaru",
      texto: "¿Por qué se usa with?",
      codigo: 'with open("nota.txt", "w") as f:\n    f.write("Hola ayllu")',
      opciones: [
        ["Cierra el archivo solo al terminar, aunque haya errores", true, "¡Sí! Es la forma segura de abrir archivos."],
        ["Hace el archivo más rápido", false, "Su ventaja es cerrar el archivo siempre."],
        ["Es obligatorio para escribir", false, "No es obligatorio, pero es la buena práctica."],
      ],
    },
    {
      tipo: "teoria",
      texto:
        "<code>open(ruta, modo)</code>: <code>\"w\"</code> escribe (borra lo anterior), <code>\"a\"</code> agrega y <code>\"r\"</code> lee. Usa siempre <code>with</code>. <b>JSON</b> guarda diccionarios y listas como texto: <code>json.dump(datos, f)</code> guarda y <code>json.load(f)</code> recupera.",
    },
    {
      tipo: "taller",
      reto: {
        id: "I10",
        titulo: "Runa I10 · Guardar y cargar",
        enunciado: [
          "Guarda el diccionario <code>aldea</code> en <code>aldea.json</code> con <code>json.dump</code>.",
          "Léelo otra vez en la variable <b>copia</b> con <code>json.load</code>.",
          "Muestra <code>copia[\"casas\"]</code>.",
        ],
        plantilla: 'import json\n\naldea = {"nombre": "Qhapaq", "casas": 5, "chacras": ["papa", "maiz"]}\n\nwith open("aldea.json", "w") as f:\n    \n\nwith open("aldea.json") as f:\n    copia = \n\nprint(copia["casas"])\n',
        pistas: ["json.dump(aldea, f)", "copia = json.load(f)"],
        comprobar: `
import os as _os
if not _os.path.exists("aldea.json"): _falla("No se creó aldea.json.")
elif copia != aldea: _falla("copia no es igual a aldea. ¿Usaste json.load(f)?")
elif "with" not in _codigo: _falla("Abre los archivos con with.")`,
        solucion: 'import json\n\naldea = {"nombre": "Qhapaq", "casas": 5, "chacras": ["papa", "maiz"]}\n\nwith open("aldea.json", "w") as f:\n    json.dump(aldea, f)\n\nwith open("aldea.json") as f:\n    copia = json.load(f)\n\nprint(copia["casas"])\n',
        exito: "¡Aldea guardada! Así guarda sus partidas este mismo juego. 💾",
      },
    },
    {
      tipo: "bug",
      codigo: 'with open("no_existe.json") as f:\n    datos = f.read()',
      opciones: [
        ["El archivo no existe: FileNotFoundError. Revisa el nombre o atrápalo con try", true, "¡Correcto!"],
        ["Falta el modo \"w\" para leer", false, "\"w\" es para escribir y borraría el archivo."],
        ["read() no existe", false, "Sí existe."],
      ],
    },
  ],
};

export const PROYECTO_INTERMEDIO: Leccion = {
  id: "PI",
  modulo: "🏆 Proyecto intermedio",
  titulo: "El sistema del Ayllu",
  pasos: [
    { tipo: "voz", quien: "yaru", texto: "¡Mee! Proyecto final del nivel intermedio: un sistema que construye la aldea con materiales reales y avisa si faltan. ¡Usa clases, diccionarios y errores!" },
    {
      tipo: "teoria",
      texto:
        "Diseño: una clase <code>Aldea</code> guarda su <b>inventario</b> (diccionario) y sus <b>casas</b> (lista). El método <code>construir</code> consulta la <b>receta</b>, comprueba los materiales y, si faltan, <b>lanza</b> un <code>ValueError</code> con <code>raise</code>.",
      codigo: 'RECETAS = {"casa": {"adobe": 10, "ichu": 4}}\nraise ValueError("Faltan materiales")',
    },
    {
      tipo: "taller",
      reto: {
        id: "PI",
        titulo: "🏆 Proyecto · El sistema del Ayllu",
        enunciado: [
          "Completa <code>construir(self, tipo)</code>: busca la receta en <code>RECETAS</code>.",
          "Si al inventario le falta algún material, haz <code>raise ValueError(\"Faltan materiales\")</code>.",
          "Si alcanza, resta los materiales y agrega <code>tipo</code> a <code>self.casas</code>.",
        ],
        plantilla:
          'RECETAS = {"casa": {"adobe": 10, "ichu": 4}, "qullqa": {"piedra": 8, "ichu": 2}}\n\nclass Aldea:\n    def __init__(self, inventario):\n        self.inventario = inventario\n        self.casas = []\n\n    def construir(self, tipo):\n        receta = RECETAS[tipo]\n        \n\nayllu = Aldea({"adobe": 12, "ichu": 5, "piedra": 3})\nayllu.construir("casa")\ntry:\n    ayllu.construir("qullqa")\nexcept ValueError as e:\n    print("No se pudo:", e)\nprint(ayllu.casas, ayllu.inventario)\n',
        pistas: [
          "for material, cantidad in receta.items():\n            if self.inventario.get(material, 0) < cantidad:\n                raise ValueError(\"Faltan materiales\")",
          "Después de revisar todo: otro for que reste cada cantidad",
          "self.casas.append(tipo)",
        ],
        comprobar: `
try:
    _a = Aldea({"adobe": 12, "ichu": 5, "piedra": 3})
    _a.construir("casa")
    _ok1 = (_a.casas == ["casa"] and _a.inventario == {"adobe": 2, "ichu": 1, "piedra": 3})
    _lanzo = False
    try:
        _a.construir("qullqa")
    except ValueError:
        _lanzo = True
    _ok2 = _lanzo and _a.casas == ["casa"] and _a.inventario == {"adobe": 2, "ichu": 1, "piedra": 3}
except Exception as _e:
    _falla(f"Tu sistema falló: {type(_e).__name__}: {_e}")
else:
    if not _ok1: _falla("Al construir una casa, el inventario debe quedar {'adobe': 2, 'ichu': 1, 'piedra': 3} y casas = ['casa'].")
    elif not _ok2: _falla("Si faltan materiales, debe lanzar ValueError SIN gastar nada ni agregar la construcción.")`,
        solucion:
          'RECETAS = {"casa": {"adobe": 10, "ichu": 4}, "qullqa": {"piedra": 8, "ichu": 2}}\n\nclass Aldea:\n    def __init__(self, inventario):\n        self.inventario = inventario\n        self.casas = []\n\n    def construir(self, tipo):\n        receta = RECETAS[tipo]\n        for material, cantidad in receta.items():\n            if self.inventario.get(material, 0) < cantidad:\n                raise ValueError("Faltan materiales")\n        for material, cantidad in receta.items():\n            self.inventario[material] -= cantidad\n        self.casas.append(tipo)\n\nayllu = Aldea({"adobe": 12, "ichu": 5, "piedra": 3})\nayllu.construir("casa")\ntry:\n    ayllu.construir("qullqa")\nexcept ValueError as e:\n    print("No se pudo:", e)\nprint(ayllu.casas, ayllu.inventario)\n',
        exito: "🏆 ¡Proyecto intermedio completado! Clases, diccionarios, bucles y errores trabajando juntos. Ya programas como un desarrollador junior.",
      },
    },
  ],
};
