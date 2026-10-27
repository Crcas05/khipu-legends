// Retratos dibujados en SVG (livianos, sin descargar imágenes).
// Cuando tengamos ilustraciones finales, se reemplazan aquí mismo por <img>.

const piel = "#c98a5c";

const RETRATOS: Record<string, string> = {
  chaski: `
    <circle cx="50" cy="50" r="50" fill="#2b3a8c"/>
    <rect x="18" y="52" width="10" height="30" rx="4" fill="#c8102e"/><rect x="72" y="52" width="10" height="30" rx="4" fill="#c8102e"/>
    <circle cx="23" cy="86" r="5" fill="#c8102e"/><circle cx="77" cy="86" r="5" fill="#c8102e"/>
    <path d="M10 100 Q50 70 90 100Z" fill="#c8102e"/>
    <circle cx="50" cy="56" r="27" fill="${piel}"/>
    <path d="M24 50 Q50 34 76 50 L76 44 Q50 30 24 44Z" fill="#1c1410"/>
    <path d="M20 46 Q50 14 80 46 L80 52 L20 52Z" fill="#f7f1e6"/>
    <path d="M20 46 Q50 14 80 46" fill="none" stroke="#c8102e" stroke-width="4"/>
    <path d="M22 50 L28 44 L34 50 L40 44 L46 50 L52 44 L58 50 L64 44 L70 50 L76 44 L80 50" fill="none" stroke="#c8102e" stroke-width="3"/>
    <path d="M28 30 Q50 6 72 30 Z" fill="#c8102e"/><circle cx="50" cy="12" r="7" fill="#c8102e"/>
    <ellipse cx="40" cy="60" rx="6" ry="7.5" fill="#fff"/><ellipse cx="60" cy="60" rx="6" ry="7.5" fill="#fff"/>
    <circle cx="40.5" cy="61" r="4.2" fill="#5a3214"/><circle cx="60.5" cy="61" r="4.2" fill="#5a3214"/>
    <circle cx="41.5" cy="59" r="1.5" fill="#fff"/><circle cx="61.5" cy="59" r="1.5" fill="#fff"/>
    <circle cx="32" cy="68" r="3.5" fill="#e88a7a" opacity=".7"/><circle cx="68" cy="68" r="3.5" fill="#e88a7a" opacity=".7"/>
    <path d="M43 71 Q50 77 57 71" fill="#7a2318"/>`,
  mama: `
    <circle cx="50" cy="50" r="50" fill="#5b2a86"/>
    <path d="M8 100 Q50 66 92 100Z" fill="#c8102e"/><path d="M20 92 L80 92" stroke="#1fa596" stroke-width="6"/>
    <rect x="23" y="56" width="8" height="30" rx="4" fill="#cfcac4"/><rect x="69" y="56" width="8" height="30" rx="4" fill="#cfcac4"/>
    <circle cx="50" cy="58" r="24" fill="#b97c52"/>
    <path d="M27 52 Q50 36 73 52 L73 46 Q50 34 27 46Z" fill="#cfcac4"/>
    <ellipse cx="50" cy="38" rx="34" ry="5" fill="#f6f1e8"/>
    <rect x="34" y="16" width="32" height="22" rx="4" fill="#f6f1e8"/><rect x="34" y="29" width="32" height="6" fill="#141414"/>
    <path d="M37 59 Q41 55 45 59" stroke="#1a1210" stroke-width="2.5" fill="none"/><path d="M55 59 Q59 55 63 59" stroke="#1a1210" stroke-width="2.5" fill="none"/>
    <circle cx="35" cy="66" r="3.5" fill="#d97a6a" opacity=".7"/><circle cx="65" cy="66" r="3.5" fill="#d97a6a" opacity=".7"/>
    <path d="M44 70 Q50 75 56 70" fill="#6e2418"/>`,
  tuki: `
    <circle cx="50" cy="50" r="50" fill="#1f6f5e"/>
    <ellipse cx="50" cy="66" rx="26" ry="24" fill="#ff6a13"/>
    <circle cx="50" cy="44" r="20" fill="#ff6a13"/>
    <ellipse cx="50" cy="24" rx="6" ry="18" fill="#ff8c3a"/>
    <circle cx="57" cy="42" r="5" fill="#1b1b1b"/><circle cx="58.5" cy="40.5" r="1.6" fill="#fff"/>
    <path d="M62 48 L76 52 L62 55Z" fill="#f5b83d"/>
    <ellipse cx="30" cy="70" rx="7" ry="14" fill="#1b1b1b"/>`,
  amaru: `
    <circle cx="50" cy="50" r="50" fill="#1f6f8b"/>
    <path d="M22 56 Q22 92 32 96 L68 96 Q78 92 78 56Z" fill="#2a1a12"/>
    <path d="M10 100 Q50 72 90 100Z" fill="#d6336c"/>
    <circle cx="50" cy="56" r="24" fill="${piel}"/>
    <ellipse cx="50" cy="36" rx="34" ry="7" fill="#c8102e"/><rect x="34" y="24" width="32" height="12" rx="5" fill="#c8102e"/>
    <path d="M30 36 L70 36" stroke="#f5b83d" stroke-width="3"/>
    <ellipse cx="41" cy="58" rx="5" ry="6.5" fill="#fff"/><ellipse cx="59" cy="58" rx="5" ry="6.5" fill="#fff"/>
    <circle cx="41" cy="59" r="3.6" fill="#3b2412"/><circle cx="59" cy="59" r="3.6" fill="#3b2412"/>
    <path d="M45 69 Q50 73 55 69" fill="#7a2318"/>
    <circle cx="84" cy="30" r="8" fill="#4ff0dc" opacity=".9"/>`,
  killa: `
    <circle cx="50" cy="50" r="50" fill="#3a3f6b"/>
    <path d="M10 100 Q50 70 90 100Z" fill="#3b5bdb"/>
    <circle cx="50" cy="56" r="24" fill="#8f6b52"/>
    <path d="M24 52 Q30 20 50 22 Q70 20 76 52 L70 40 L64 50 L58 36 L50 48 L42 36 L36 50 L30 40Z" fill="#eef0f6"/>
    <path d="M37 56 L46 58" stroke="#141414" stroke-width="3"/><path d="M63 56 L54 58" stroke="#141414" stroke-width="3"/>
    <circle cx="42" cy="61" r="3" fill="#141414"/><circle cx="58" cy="61" r="3" fill="#141414"/>
    <path d="M44 71 L56 71" stroke="#5a2a1a" stroke-width="3"/>`,
  yaru: `
    <circle cx="50" cy="50" r="50" fill="#7a5a2a"/>
    <path d="M14 100 Q50 74 86 100Z" fill="#f3ebdc"/>
    <rect x="38" y="44" width="24" height="40" rx="12" fill="#f3ebdc"/>
    <ellipse cx="50" cy="44" rx="22" ry="20" fill="#f3ebdc"/>
    <path d="M32 30 L36 8 L42 28Z" fill="#f3ebdc"/><path d="M68 30 L64 8 L58 28Z" fill="#f3ebdc"/>
    <circle cx="36" cy="8" r="5" fill="#c8102e"/><circle cx="64" cy="8" r="5" fill="#c8102e"/>
    <circle cx="42" cy="42" r="4" fill="#161616"/><circle cx="58" cy="42" r="4" fill="#161616"/>
    <ellipse cx="50" cy="56" rx="9" ry="6" fill="#e8dcc6"/><path d="M46 57 Q50 60 54 57" stroke="#5a3a2a" stroke-width="2" fill="none"/>
    <rect x="30" y="80" width="40" height="8" fill="#c8102e"/>`,
  waman: `
    <circle cx="50" cy="50" r="50" fill="#1f6f6a"/>
    <path d="M10 100 Q50 70 90 100Z" fill="#f2efe6"/>
    <path d="M30 100 L40 76 L50 84 L60 76 L70 100Z" fill="#c8102e"/>
    <circle cx="50" cy="56" r="24" fill="#a8744a"/>
    <path d="M26 48 Q50 30 74 48 L74 42 Q50 26 26 42Z" fill="#1c1410"/>
    <rect x="26" y="40" width="48" height="6" fill="#f2efe6"/>
    <path d="M50 40 L46 10 L52 14 L56 4 L58 40Z" fill="#ffffff" stroke="#ddd"/>
    <circle cx="42" cy="58" r="3.4" fill="#2a1a12"/><circle cx="58" cy="58" r="3.4" fill="#2a1a12"/>
    <path d="M43 68 Q50 73 57 68" stroke="#7a2318" stroke-width="2.5" fill="none"/>
    <path d="M66 70 Q84 64 86 78 Q80 82 70 78Z" fill="#f4e6d6" stroke="#c9a88a"/>`,
  sisa: `
    <circle cx="50" cy="50" r="50" fill="#5d7a3a"/>
    <path d="M10 100 Q50 70 90 100Z" fill="#8a7a4a"/>
    <path d="M30 60 Q28 86 40 92 L40 70Z M70 60 Q72 86 60 92 L60 70Z" fill="#2a1a12"/>
    <circle cx="50" cy="56" r="23" fill="#b07a52"/>
    <ellipse cx="50" cy="36" rx="36" ry="7" fill="#6b5a32"/><path d="M32 36 Q34 18 50 18 Q66 18 68 36Z" fill="#7d6a3a"/>
    <rect x="32" y="31" width="36" height="4" fill="#c8102e"/>
    <circle cx="42" cy="58" r="3.4" fill="#2a1a12"/><circle cx="58" cy="58" r="3.4" fill="#2a1a12"/>
    <path d="M44 68 Q50 72 56 68" stroke="#7a2318" stroke-width="2.5" fill="none"/>`,
  yachaq: `
    <circle cx="50" cy="50" r="50" fill="#2f5a3a"/>
    <path d="M10 100 Q50 70 90 100Z" fill="#d9c9a3"/>
    <path d="M22 100 L30 74 L50 82 L70 74 L78 100Z" fill="#c8102e"/>
    <circle cx="50" cy="56" r="23" fill="#8f6b4a"/>
    <path d="M30 52 Q32 30 50 30 Q68 30 70 52 Q66 40 50 40 Q34 40 30 52Z" fill="#e8e8e8"/>
    <path d="M34 62 Q50 92 66 62 Q60 74 50 74 Q40 74 34 62Z" fill="#f0f0f0"/>
    <path d="M38 55 L46 55 M54 55 L62 55" stroke="#2a1a12" stroke-width="3" stroke-linecap="round"/>
    <path d="M40 46 L46 48 M60 46 L54 48" stroke="#ddd" stroke-width="3"/>`,
};

export function retrato(clave: string, tam = 64): string {
  const cuerpo = RETRATOS[clave] ?? RETRATOS.tuki;
  return `<svg class="retrato" viewBox="0 0 100 100" width="${tam}" height="${tam}" aria-hidden="true"><clipPath id="r-${clave}-${tam}"><circle cx="50" cy="50" r="50"/></clipPath><g clip-path="url(#r-${clave}-${tam})">${cuerpo}</g></svg>`;
}
