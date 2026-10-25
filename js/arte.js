// Arte provisional del piloto, dibujado con formas simples (SVG).
// Se reemplazará por ilustraciones hechas con artistas peruanos.
// El diseño del héroe del Ucayali es un marcador de lugar: su versión final
// debe co-crearse con artistas shipibo-konibo.

const PIEL = "#B8794A";
const NEGRO = "#1b1b1b";

const ojos = `
  <ellipse cx="43" cy="57" rx="2.8" ry="3.8" fill="${NEGRO}"/>
  <ellipse cx="57" cy="57" rx="2.8" ry="3.8" fill="${NEGRO}"/>
  <circle cx="44" cy="55.6" r="1" fill="#fff"/>
  <circle cx="58" cy="55.6" r="1" fill="#fff"/>`;
const boca = `<path d="M45 67 Q50 71 55 67" stroke="#5a2d14" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
const cara = `<ellipse cx="50" cy="56" rx="17" ry="19" fill="${PIEL}"/>`;

const RETRATOS = {
  yupanki: `
    <circle cx="50" cy="50" r="50" fill="#2A9D8F"/>
    <path d="M18 100 L29 74 Q50 65 71 74 L82 100Z" fill="#C8102E"/>
    <path d="M26 86 H74" stroke="#F2B33D" stroke-width="3"/>
    <path d="M30 93 l5 -4 l5 4 l5 -4 l5 4 l5 -4 l5 4 l5 -4 l5 4" stroke="#fff" stroke-width="1.6" fill="none"/>
    ${cara}
    <path d="M33 50 Q50 44 67 50 L67 54 Q50 48 33 54Z" fill="${NEGRO}"/>
    <path d="M31 51 Q33 25 50 21 Q67 25 69 51 Z" fill="#F2B33D"/>
    <path d="M33 43 H67" stroke="#C8102E" stroke-width="4"/>
    <path d="M36 34 H64" stroke="#2A9D8F" stroke-width="3"/>
    <circle cx="50" cy="19" r="4.5" fill="#C8102E"/>
    <path d="M31 50 L29 68 L37 58 Z" fill="#F2B33D"/>
    <path d="M69 50 L71 68 L63 58 Z" fill="#F2B33D"/>
    ${ojos}${boca}`,
  sisa: `
    <circle cx="50" cy="50" r="50" fill="#E76F51"/>
    <path d="M34 50 Q28 76 33 94" stroke="${NEGRO}" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M66 50 Q72 76 67 94" stroke="${NEGRO}" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M18 100 L28 72 Q50 62 72 72 L82 100Z" fill="#B5179E"/>
    <path d="M24 84 H76" stroke="#F2B33D" stroke-width="3"/>
    <path d="M22 91 H78" stroke="#2A9D8F" stroke-width="3"/>
    ${cara}
    <path d="M32 55 Q32 36 50 36 Q68 36 68 55 Q61 45 50 45 Q39 45 32 55Z" fill="${NEGRO}"/>
    <ellipse cx="50" cy="37" rx="31" ry="6" fill="#3D2B1F"/>
    <path d="M38 37 Q40 22 50 22 Q60 22 62 37Z" fill="#3D2B1F"/>
    <path d="M39 33 H61" stroke="#F2B33D" stroke-width="3"/>
    <circle cx="61" cy="31" r="3" fill="#fff"/>
    ${ojos}${boca}`,
  ucayali: `
    <circle cx="50" cy="50" r="50" fill="#264653"/>
    <path d="M18 100 L29 72 Q50 64 71 72 L82 100Z" fill="#E9DCC3"/>
    <path d="M30 82 H42 V90 H58 V82 H70 M34 98 V92 H46 V97 H54 V92 H66 V98" stroke="${NEGRO}" stroke-width="1.8" fill="none"/>
    ${cara}
    <path d="M32 57 Q32 37 50 37 Q68 37 68 57 L66 50 Q50 45 34 50Z" fill="${NEGRO}"/>
    <rect x="31" y="34" width="38" height="9" rx="2" fill="#E9DCC3"/>
    <path d="M33 38.5 H38 V36 H44 V41 H50 V36 H56 V41 H62 V36 H67" stroke="${NEGRO}" stroke-width="1.2" fill="none"/>
    ${ojos}${boca}`,
  mama: `
    <circle cx="50" cy="50" r="50" fill="#6D597A"/>
    <path d="M14 100 L26 72 Q50 61 74 72 L86 100Z" fill="#8E3B46"/>
    <path d="M30 84 H70" stroke="#F2B33D" stroke-width="2.5"/>
    <path d="M34 84 V98 M40 84 V96 M46 84 V99 M52 84 V95 M58 84 V98 M64 84 V96" stroke-width="2" stroke="#F2B33D"/>
    <circle cx="34" cy="91" r="1.8" fill="#E9DCC3"/><circle cx="46" cy="93" r="1.8" fill="#E9DCC3"/>
    <circle cx="58" cy="90" r="1.8" fill="#E9DCC3"/><circle cx="40" cy="89" r="1.8" fill="#E9DCC3"/>
    <ellipse cx="50" cy="56" rx="17" ry="19" fill="#A86B45"/>
    <circle cx="50" cy="31" r="7.5" fill="#D6D6D6"/>
    <path d="M32 55 Q32 35 50 35 Q68 35 68 55 Q62 43 50 43 Q38 43 32 55Z" fill="#D6D6D6"/>
    <path d="M40 57 Q43 54 46 57 M54 57 Q57 54 60 57" stroke="${NEGRO}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <path d="M38 62 l3 1 M62 62 l-3 1" stroke="#7a4a2c" stroke-width="1.2"/>
    <path d="M44 67 Q50 72 56 67" stroke="#5a2d14" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
  tuki: `
    <circle cx="50" cy="50" r="50" fill="#2A9D8F"/>
    <ellipse cx="50" cy="70" rx="24" ry="22" fill="#FF6B1A"/>
    <path d="M58 62 Q78 68 72 88 Q61 82 56 68Z" fill="${NEGRO}"/>
    <path d="M62 68 Q70 72 68 80" stroke="#BBB" stroke-width="3" fill="none"/>
    <circle cx="46" cy="46" r="16" fill="#FF6B1A"/>
    <path d="M28 47 Q31 20 52 22 Q66 24 63 42 Q52 31 28 47Z" fill="#FF8A3D"/>
    <circle cx="49" cy="46" r="3.2" fill="${NEGRO}"/>
    <circle cx="50" cy="45" r="1" fill="#fff"/>
    <path d="M33 48 L26 50 L33 52Z" fill="#F2B33D"/>`,
  gigante: `
    <circle cx="50" cy="50" r="50" fill="#E9C46A"/>
    <rect x="22" y="24" width="56" height="58" rx="7" fill="#B5651D"/>
    <path d="M22 44 H78 M22 64 H78 M40 24 V44 M60 44 V64 M36 64 V82 M64 24 V44" stroke="#8B4513" stroke-width="1.5"/>
    <circle cx="39" cy="50" r="5" fill="#F2B33D"/><circle cx="61" cy="50" r="5" fill="#F2B33D"/>`,
};

export function retrato(id) {
  const contenido = RETRATOS[id] || "";
  return `<svg viewBox="0 0 100 100" aria-hidden="true" class="retrato-svg">${contenido}</svg>`;
}

export const HEROES = [
  { id: "yupanki", nombre: "Yupanki", descripcion: "Chaski andino. Su pututu se ilumina con cada orden." },
  { id: "sisa", nombre: "Sisa", descripcion: "Joven campesina, veloz como el viento de la puna." },
  { id: "ucayali", nombre: "Héroe del Ucayali", descripcion: "Ve patrones donde otros ven caos. (Diseño por co-crear)" },
];

// Escena de Caral. estado: "dormido" | "medio" | "despierto"
export function escenaCaral(estado = "dormido") {
  const despierto = estado === "despierto";
  const ojosGigante =
    estado === "dormido"
      ? `<path d="M280 92 h10 M300 92 h10" stroke="${NEGRO}" stroke-width="3" stroke-linecap="round"/>`
      : estado === "medio"
      ? `<path d="M280 92 h10" stroke="${NEGRO}" stroke-width="3" stroke-linecap="round"/>
         <circle cx="305" cy="92" r="5" fill="#F2B33D"/>`
      : `<circle cx="285" cy="92" r="6" fill="#F2B33D" class="ojo-brilla"/>
         <circle cx="305" cy="92" r="6" fill="#F2B33D" class="ojo-brilla"/>`;
  return `
  <svg viewBox="0 0 360 220" class="escena escena-${estado}" role="img"
       aria-label="${despierto ? "El gigante de adobe despertó y la niebla se fue" : "Caral cubierta de niebla, con el gigante de adobe dormido"}">
    <rect width="360" height="220" class="cielo"/>
    <circle cx="300" cy="44" r="22" fill="#F2B33D" class="sol"/>
    <path d="M0 160 Q90 130 180 155 T360 150 V220 H0Z" fill="#D4A373"/>
    <g class="piramide">
      <rect x="50" y="150" width="190" height="22" fill="#C9A27E" stroke="#8B5E3C"/>
      <rect x="72" y="128" width="146" height="22" fill="#C9A27E" stroke="#8B5E3C"/>
      <rect x="94" y="106" width="102" height="22" fill="#C9A27E" stroke="#8B5E3C"/>
      <rect x="116" y="84" width="58" height="22" fill="#C9A27E" stroke="#8B5E3C"/>
      <rect x="135" y="84" width="20" height="88" fill="#B08968"/>
    </g>
    <path d="M0 178 Q120 160 240 180 T360 175 V220 H0Z" fill="#E9C46A"/>
    <g class="gigante ${despierto ? "gigante-despierto" : ""}">
      <rect x="258" y="118" width="74" height="70" rx="6" fill="#B5651D"/>
      <rect x="240" y="124" width="18" height="46" rx="5" fill="#A0522D"/>
      <rect x="332" y="124" width="18" height="46" rx="5" fill="#A0522D"/>
      <rect x="268" y="72" width="54" height="46" rx="6" fill="#B5651D"/>
      <path d="M258 140 H332 M258 162 H332 M290 118 V140 M310 140 V162 M280 162 V188 M268 95 H322" stroke="#8B4513" stroke-width="1.5"/>
      ${ojosGigante}
    </g>
    <g class="niebla">
      <ellipse cx="60" cy="120" rx="90" ry="34" fill="#fff"/>
      <ellipse cx="200" cy="100" rx="110" ry="40" fill="#fff"/>
      <ellipse cx="320" cy="130" rx="80" ry="36" fill="#fff"/>
      <ellipse cx="150" cy="170" rx="160" ry="30" fill="#fff"/>
    </g>
  </svg>`;
}
