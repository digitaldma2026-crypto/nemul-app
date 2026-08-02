import { useState, useEffect, useRef } from "react";
import { track } from "@vercel/analytics/react";

// Envía un evento a Google Analytics (gratis, sin límite en el volumen de
// tráfico actual). Si gtag todavía no ha cargado, simplemente no hace nada
// en vez de romper la app.
function gaEvent(name, params = {}) {
  try {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", name, params);
    }
  } catch (e) {
    // silencioso: la analítica nunca debe romper la experiencia del usuario
  }
}
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  Sofa, ChefHat, BedDouble, Bath, UtensilsCrossed, DoorOpen, Shirt, TreePine,
  ArrowLeft, Check, ChevronRight, ChevronDown, Sun, Moon, CloudSun, Lightbulb,
  Sparkles, BookOpen, Users, Coffee, Plus, Trash2, Home as HomeIcon,
  Package, Palette, Wind, Tv, Briefcase, Droplets, Zap, Laptop, Lamp, X, Hammer, Info, Pencil, Lock, Download,
} from "lucide-react";

const FONT_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Montserrat:wght@400;500;600&display=swap');
  .font-display { font-family: 'Cormorant Garamond', serif; }
  .font-body { font-family: 'Montserrat', sans-serif; }
  @keyframes glow-pulse {
    0%, 100% { opacity: 0.55; transform: scale(1); }
    50% { opacity: 0.85; transform: scale(1.06); }
  }
  .glow-orb { animation: glow-pulse 4.5s ease-in-out infinite; }
  .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
  .no-scrollbar::-webkit-scrollbar { display: none; }
  @keyframes option-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .option-in { animation: option-in 0.4s cubic-bezier(0.22,1,0.36,1) both; }
  @keyframes check-pop {
    0% { transform: scale(0.4); }
    60% { transform: scale(1.15); }
    100% { transform: scale(1); }
  }
  .check-pop { animation: check-pop 0.32s cubic-bezier(0.34,1.56,0.64,1) both; }
  .tap-scale { transition: transform 0.15s ease, box-shadow 0.2s ease, border-color 0.2s ease, background-color 0.2s ease; }
  .tap-scale:active { transform: scale(0.965); }
  @keyframes rise-in {
    from { opacity: 0; transform: translateY(14px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .rise-in { animation: rise-in 0.45s cubic-bezier(0.22,1,0.36,1) both; }
  @keyframes toast-in {
    from { opacity: 0; transform: translate(-50%, 8px); }
    to { opacity: 1; transform: translate(-50%, 0); }
  }
  .toast-in { animation: toast-in 0.3s ease-out both; }
  @media (prefers-reduced-motion: reduce) {
    .glow-orb, .rise-in, .toast-in, .option-in, .check-pop { animation: none; }
    .tap-scale:active { transform: none; }
  }
`;

const COLORS = {
  bg: "#F8F6F2",
  card: "#FFFFFF",
  text: "#2E2A27",
  subtext: "#6F6A64",
  primary: "#6F5E4D",
  accent: "#C1A16B",
  success: "#7C8470",
  warning: "#B3684F",
  border: "#E9E4DD",
};

const ROOMS = [
  { id: "living", label: "Salón", Icon: Sofa },
  { id: "livingDining", label: "Salón-Comedor abierto", Icon: Sofa },
  { id: "kitchen", label: "Cocina", Icon: ChefHat },
  { id: "kitchenOpen", label: "Cocina abierta al salón", Icon: ChefHat },
  { id: "bedroom", label: "Dormitorio", Icon: BedDouble },
  { id: "bathroom", label: "Baño", Icon: Bath },
  { id: "dining", label: "Comedor", Icon: UtensilsCrossed },
  { id: "hallway", label: "Pasillo", Icon: DoorOpen },
  { id: "closet", label: "Vestidor", Icon: Shirt },
  { id: "terrace", label: "Terraza", Icon: TreePine },
  { id: "office", label: "Despacho", Icon: Laptop },
];

// Los planes se guardan en el propio navegador (localStorage), para que
// sobrevivan a recargar la página. Los objetos de habitación incluyen un
// componente de icono que no se puede guardar como texto, así que solo
// guardamos el id de cada habitación y lo reconstruimos al cargar.
function loadSavedPlans() {
  try {
    const raw = localStorage.getItem("nemul_savedPlans");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.map((p) => ({
      id: p.id,
      savedAt: new Date(p.savedAt),
      rooms: (p.roomIds || []).map((rid) => ROOMS.find((r) => r.id === rid)).filter(Boolean),
      answersByRoom: p.answersByRoom || {},
    }));
  } catch {
    return [];
  }
}

function persistSavedPlans(plans) {
  try {
    const serializable = plans.map((p) => ({
      id: p.id,
      savedAt: p.savedAt instanceof Date ? p.savedAt.toISOString() : p.savedAt,
      roomIds: p.rooms.map((r) => r.id),
      answersByRoom: p.answersByRoom,
    }));
    localStorage.setItem("nemul_savedPlans", JSON.stringify(serializable));
  } catch {
    // Si localStorage no está disponible (por ejemplo, modo privado),
    // simplemente no persiste entre recargas; el resto de la app sigue funcionando.
  }
}

const LIGHT_OPTIONS = [
  { id: "bright", label: "Mucha luz natural", Icon: Sun },
  { id: "moderate", label: "Media", Icon: CloudSun },
  { id: "low", label: "Muy poca", Icon: Moon },
];

const YES_NO_OPTIONS = [
  { id: "si", label: "Sí" },
  { id: "no", label: "No" },
];

const CLOSET_LIGHT_OPTIONS = [
  { id: "dentro", label: "Dentro del armario" },
  { id: "delante", label: "Delante del armario" },
  { id: "no", label: "No hace falta" },
];

const MIRROR_STATUS_OPTIONS = [
  { id: "tengo", label: "Sí, ya tengo uno" },
  { id: "planeo", label: "Sí, voy a instalar uno" },
  { id: "no", label: "No" },
];

const CEILING_OPTIONS = [
  { id: "liso", label: "Liso" },
  { id: "pladur", label: "Falso techo de pladur" },
  { id: "vigas", label: "Con vigas" },
  { id: "noSe", label: "No lo sé" },
];

const CEILING_INSIGHT = {
  liso: "Un techo liso no tiene cámara donde empotrar focos: sin reforma, lo más viable son luminarias de superficie o carriles; si vas a reformar, se puede construir un falso techo para tener más libertad. Si te preocupa el deslumbramiento lateral de los focos de superficie, un accesorio tipo \"honeycomb\" lo reduce bastante.",
  pladur: "Un falso techo de pladur ya tiene la cámara necesaria para empotrar focos e integrar tiras LED sin obra adicional. Al elegir el downlight, uno con acabado negro y la fuente de luz más hundida respecto al techo da más confort visual que uno blanco y superficial, porque reduce el deslumbramiento.",
  vigas: "Con vigas vistas, evita empotrar focos en la madera: opta por soluciones de superficie o carriles.",
  noSe: "Antes de instalar focos empotrados, confirma con un instalador qué tipo de techo tienes.",
};

// Mejora universal: en qué fase está el proyecto cambia mucho la recomendación.
const RENOVATION_STATUS_OPTIONS = [
  { id: "renovation", label: "Estoy haciendo una reforma", Icon: Hammer },
  { id: "onlyLights", label: "Solo quiero cambiar las luces", Icon: Lightbulb },
];
const renovationStep = {
  key: "renovationStatus",
  title: "¿Estás reformando la estancia o solo quieres mejorar la iluminación?",
  subtitle: "Esto cambia bastante nuestra recomendación.",
  type: "single",
  layout: "list",
  options: RENOVATION_STATUS_OPTIONS,
};
const RENOVATION_INSIGHT = {
  renovation: "Como vas a hacer una reforma, aprovecha para mover o añadir puntos de luz donde realmente se necesiten, sin depender de la instalación actual.",
  onlyLights: "Como solo vas a cambiar las luminarias, la propuesta se adapta a los puntos de luz que ya existen en tu instalación.",
};

const STYLE_OPTIONS = [
  { id: "acogedor", label: "Muy acogedor", hint: "Luz cálida y suave, ideal para relajarte", Icon: Moon },
  { id: "equilibrado", label: "Equilibrado", hint: "Ni muy tenue ni muy intenso, para el día a día", Icon: Sparkles },
  { id: "luminoso", label: "Muy luminoso", hint: "Luz blanca y clara, como de pleno día", Icon: Sun },
];

const TEMP_BY_STYLE = { acogedor: 2700, equilibrado: 3000, luminoso: 4000 };
const LUMENS_PER_DOWNLIGHT = 800;
const WATTS_PER_DOWNLIGHT = 8;

// Un criterio profesional nunca da una única cifra exacta: da un rango,
// porque el número real depende del modelo de luminaria, la altura del
// techo o la distribución final. Siempre se muestra como un rango de 2.
function downlightRange(lumens, minCount) {
  const exact = lumens / LUMENS_PER_DOWNLIGHT;
  const low = Math.max(minCount, Math.round(exact));
  const high = low + 1;
  return { low, high };
}

// Traducción a lenguaje humano: el número técnico no desaparece, pero nunca
// se queda solo. Así lo explicaría una diseñadora en persona.
const TEMP_HUMAN = {
  2700: "Luz cálida, similar a la de un salón acogedor al atardecer.",
  3000: "Luz cálida neutra, ideal para crear un ambiente confortable y natural.",
  3500: "Luz neutra cálida, similar a la de un hogar moderno y bien iluminado.",
  4000: "Luz blanca neutra, similar a la de una cocina moderna bien iluminada.",
};
function describeTempK(tempK) {
  return TEMP_HUMAN[tempK] || "un tono de luz equilibrado";
}
function describeLux(lux) {
  if (lux < 130) return "un ambiente suave, pensado para relajarse";
  if (lux < 200) return "una luz cómoda para el día a día";
  if (lux < 300) return "una luz intensa, pensada para tareas que exigen precisión";
  return "una luz muy intensa, como la de una zona de trabajo";
}

// Regla de diseño: la luz natural decide cuánta luz añadimos (lm/m²).
// El estilo, las prioridades o el problema deciden el tono (Kelvin) y los consejos,
// nunca el número de lúmenes. Así cada pregunta tiene un único trabajo claro.
const ROOM_LUX_BY_LIGHT = {
  living: { bright: 150, moderate: 175, low: 200 },
  livingDining: { bright: 150, moderate: 175, low: 200 },
  kitchen: { bright: 300, moderate: 350, low: 400 },
  kitchenOpen: { bright: 300, moderate: 350, low: 400 },
  bedroom: { bright: 130, moderate: 150, low: 170 },
  bathroom: { bright: 225, moderate: 250, low: 300 },
  dining: { bright: 175, moderate: 200, low: 225 },
  closet: { bright: 225, moderate: 250, low: 275 },
  terrace: { bright: 80, moderate: 100, low: 120 },
  office: { bright: 300, moderate: 350, low: 400 },
};
function getLux(roomId, light) {
  const table = ROOM_LUX_BY_LIGHT[roomId] || {};
  return table[light] ?? table.moderate ?? 200;
}

// ---------- Salón ----------
const LIVING_ACTIVITY_OPTIONS = [
  { id: "tv", label: "Ver la televisión", Icon: Tv },
  { id: "read", label: "Leer", Icon: BookOpen },
  { id: "guests", label: "Recibir visitas", Icon: Users },
  { id: "dine", label: "Comer", Icon: UtensilsCrossed },
  { id: "laptop", label: "Trabajar con el portátil", Icon: Laptop },
  { id: "relax", label: "Relajarte", Icon: Moon },
];

const SALON_SIZE_OPTIONS = [
  { id: "small", label: "Pequeño", hint: "Menos de 15 m²", area: 12 },
  { id: "medium", label: "Mediano", hint: "15–25 m²", area: 20 },
  { id: "large", label: "Grande", hint: "25–35 m²", area: 30 },
  { id: "xl", label: "Extra grande", hint: "Más de 35 m²", area: 40 },
];
const SALON_AREA_BY_SIZE = Object.fromEntries(SALON_SIZE_OPTIONS.map((o) => [o.id, o.area]));

const LIVING_GOAL_OPTIONS = [
  { id: "cozy", label: "Crear un ambiente acogedor", Icon: Moon },
  { id: "reading", label: "Tener buena luz para leer", Icon: BookOpen },
  { id: "decor", label: "Resaltar la decoración", Icon: Sparkles },
  { id: "tvFurniture", label: "Iluminar el mueble de TV", Icon: Zap },
  { id: "scenes", label: "Crear distintas escenas de luz", Icon: Lightbulb },
];

const LIVING_PROBLEM_OPTIONS = [
  { id: "dark", label: "El salón se ve oscuro" },
  { id: "glare", label: "Hay reflejos en la televisión" },
  { id: "reading", label: "Me falta luz para leer" },
  { id: "cozy", label: "Quiero un ambiente más acogedor" },
  { id: "renovating", label: "Estoy reformando desde cero", Icon: Hammer },
];

function inferLivingStyle(activities = [], goals = [], problem) {
  let style = "equilibrado";
  if (activities.includes("laptop")) style = "luminoso";
  else if (activities.includes("relax")) style = "acogedor";
  if (goals.includes("cozy")) style = "acogedor";
  if (problem === "cozy") style = "acogedor";
  else if (problem === "dark") style = "luminoso";
  return style;
}

function generateLivingReport(answers = {}) {
  const { activities = [], size, light, ceiling, goals = [], problem, renovationStatus, diningShape, diningSeats, diningPendant } = answers;

  const area = SALON_AREA_BY_SIZE[size] || 20;
  const style = inferLivingStyle(activities, goals, problem);
  const tempK = TEMP_BY_STYLE[style];
  const lux = getLux("living", light);
  const lumens = Math.round((lux * area) / 100) * 100;
  const { low: downlightsLow, high: downlightsHigh } = downlightRange(lumens, 4);

  const tips = [];
  tips.push("Coloca los downlights separados aproximadamente entre 1,2 y 1,5 m.");
  tips.push("Evita colocar focos justo encima del sofá para reducir deslumbramientos.");
  tips.push("Al ser una zona de relax, prioriza lámparas de pared, de pie o de sobremesa sobre la luz general de techo; mejor varios puntos suaves repartidos que pocos focos potentes.");

  if (activities.includes("read") || goals.includes("reading") || problem === "reading") tips.push("Añade una lámpara de pie regulable junto al sofá, pensada para leer sin depender de la luz general.");
  if (goals.includes("tvFurniture")) tips.push("Una tira LED en el mueble de televisión aportará profundidad y hará el ambiente más acogedor.");
  if (goals.includes("decor")) tips.push("Si tienes cuadros u objetos decorativos, utiliza luz de acento para resaltarlos.");
  if (goals.includes("scenes")) tips.push("Instala un sistema regulable o varios circuitos para pasar de un ambiente luminoso de día a uno más íntimo por la noche.");
  if (activities.includes("tv") || problem === "glare") tips.push("Dirige la luz general lejos de la pantalla del televisor para evitar reflejos molestos.");
  if (activities.includes("guests")) tips.push("Instala reguladores (dimmers) para pasar de un ambiente luminoso a uno más íntimo según la ocasión.");
  if (activities.includes("dine")) tips.push("Si comes en el salón, añade un punto de luz más cálido sobre esa zona para diferenciarla del área de estar.");
  if (activities.includes("laptop")) tips.push("Añade una luz blanca y neutra dirigida a la zona de trabajo, distinta de la calidez general.");
  if (activities.includes("relax") || goals.includes("cozy") || problem === "cozy") tips.push("Prioriza tonos cálidos y añade la posibilidad de atenuar la luz para las noches de relax.");

  // Comedor integrado (Salón-Comedor abierto): reutiliza el mismo criterio que en un comedor independiente.
  if (EXTRA_INSIGHT.dining?.shape?.[diningShape]) tips.push(EXTRA_INSIGHT.dining.shape[diningShape]);
  if (EXTRA_INSIGHT.dining?.seats?.[diningSeats]) tips.push(EXTRA_INSIGHT.dining.seats[diningSeats]);
  if (EXTRA_INSIGHT.dining?.pendant?.[diningPendant]) tips.push(EXTRA_INSIGHT.dining.pendant[diningPendant]);
  if (diningShape || diningSeats || diningPendant) tips.push("Como el salón y el comedor comparten el mismo espacio, mantén una temperatura de luz similar en ambas zonas: usa la mesa para marcar la diferencia con un punto de luz propio, no con un tono distinto.");

  if (ceiling === "vigas") tips.push("Con vigas vistas, evita empotrar downlights en la madera: opta por focos de superficie o carriles que se adapten a la estructura.");
  if (ceiling === "pladur") tips.push("Un falso techo de pladur es ideal para empotrar downlights e integrar tiras LED perimetrales sin obra adicional. Elige uno con acabado negro y la fuente de luz más hundida: da más confort visual que uno blanco y superficial.");
  if (ceiling === "liso") tips.push("Un techo liso no tiene cámara para empotrar: si no vas a reformar, usa downlights de superficie, y si te preocupa el deslumbramiento lateral, un accesorio tipo \"honeycomb\" lo reduce bastante.");
  if (ceiling === "noSe") tips.push("Antes de instalar downlights empotrados, confirma con un instalador qué tipo de techo tienes.");

  if (light === "bright") tips.push("Como el salón recibe mucha luz natural de día, reserva la calidez de la luz artificial sobre todo para la noche.");
  if (light === "moderate") tips.push("Con una luz natural media, un punto cálido adicional para las tardes es suficiente para no notar el cambio de luz.");
  if (light === "low" || problem === "dark") tips.push("Como el salón necesita más luz, sube ligeramente los lúmenes generales calculados y refuerza también las esquinas.");

  if (renovationStatus === "renovation" || problem === "renovating") tips.push("Como vas a reformar desde cero, aprovecha para dejar previstos varios circuitos independientes y reguladores de intensidad.");
  if (renovationStatus === "onlyLights") tips.push("Como solo vas a cambiar las luminarias, prioriza soluciones que aprovechen los puntos de luz ya existentes, como sustituir un plafón por un foco orientable en el mismo lugar.");

  const mistakes = [
    "No utilices una única lámpara en el centro del salón.",
    "No mezcles temperaturas de color muy diferentes.",
    "No coloques todos los focos pegados a las paredes.",
  ];
  if (activities.includes("tv") || problem === "glare") mistakes.push("No ilumines directamente la pantalla del televisor.");
  if (ceiling === "vigas") mistakes.push("No empotres focos en las vigas de madera sin consultarlo antes con un instalador.");

  return { tempK, lumens, downlightsLow, downlightsHigh, area, lux, tips: [...new Set(tips)], mistakes: [...new Set(mistakes)] };
}

// ---------- Cocina ----------
const KITCHEN_LAYOUT_OPTIONS = [
  { id: "lineal", label: "Lineal" },
  { id: "L", label: "En L" },
  { id: "U", label: "En U" },
  { id: "paralela", label: "Paralela" },
  { id: "isla", label: "Con isla" },
  { id: "peninsula", label: "Con península" },
];

const KITCHEN_LAYOUT_REACTIONS = {
  isla: "En una cocina con isla, las lámparas colgantes serán las protagonistas de la iluminación.",
  peninsula: "La luz debe destacar la península sin cerrar visualmente el paso.",
  L: "La esquina interior de la encimera necesita un poco más de luz para que toda la superficie quede iluminada de forma uniforme.",
  U: "En una cocina en U, la luz debe repartirse entre los tres frentes de trabajo, no concentrarse en un único punto central.",
  paralela: "Reparte la luz por igual entre ambos lados para evitar zonas con sombra.",
  lineal: "Una línea de luz continua será la clave para iluminar toda la encimera de forma uniforme.",
};

const KITCHEN_PRIORITY_OPTIONS = [
  { id: "comfortable", label: "Cocinar con comodidad", Icon: ChefHat },
  { id: "family", label: "Compartir tiempo con la familia", Icon: Users },
  { id: "elegant", label: "Tener una cocina elegante", Icon: Sparkles },
  { id: "practical", label: "Que sea muy práctica", Icon: Package },
  { id: "all", label: "Todo lo anterior", Icon: Check },
];

const KITCHEN_UPPER_CABINETS_OPTIONS = [
  { id: "unaPared", label: "Sí, en una pared" },
  { id: "dosParedes", label: "Sí, en dos paredes" },
  { id: "no", label: "No" },
];

const KITCHEN_WORK_ZONE_OPTIONS = [
  { id: "encimera", label: "Encimera principal" },
  { id: "isla", label: "Isla" },
  { id: "peninsula", label: "Península" },
  { id: "varias", label: "En varias zonas" },
];

const KITCHEN_PROBLEM_OPTIONS = [
  { id: "shadows", label: "La encimera tiene sombras" },
  { id: "visibility", label: "No veo bien cuando cocino" },
  { id: "modern", label: "Quiero una cocina más moderna" },
  { id: "renovating", label: "Voy a hacer una reforma", Icon: Hammer },
  { id: "onlyLighting", label: "Solo quiero cambiar la iluminación" },
];

const KITCHEN_PROBLEM_REACTIONS = {
  shadows: "Entendido: vamos a poner luz directa sobre la encimera, no solo general.",
  visibility: "Vamos a priorizar visibilidad sobre ambiente en la zona de trabajo.",
  modern: "Buscamos un aspecto más moderno sin sacrificar función.",
  renovating: "Con reforma completa, podemos plantear circuitos independientes desde cero.",
  onlyLighting: "Solo cambiar la iluminación: nos vamos a adaptar a lo que ya existe.",
};

const KITCHEN_SIZE_OPTIONS = [
  { id: "small", label: "Pequeña", hint: "Menos de 8 m²", area: 6 },
  { id: "medium", label: "Mediana", hint: "8–14 m²", area: 11 },
  { id: "large", label: "Grande", hint: "14–20 m²", area: 17 },
  { id: "xl", label: "Extra grande", hint: "Más de 20 m²", area: 24 },
];
const KITCHEN_AREA_BY_SIZE = Object.fromEntries(KITCHEN_SIZE_OPTIONS.map((o) => [o.id, o.area]));

const KITCHEN_CEILING_HEIGHT_OPTIONS = [
  { id: "h240", label: "2,40 m" },
  { id: "h250", label: "2,50 m" },
  { id: "h270", label: "2,70 m" },
  { id: "h300", label: "Más de 3 m" },
];
const KITCHEN_HEIGHT_FACTOR = { h240: 1, h250: 1, h270: 1.1, h300: 1.2 };

const KITCHEN_LAYOUT_PHRASE = {
  lineal: "es lineal",
  L: "tiene forma de L",
  U: "tiene forma de U",
  paralela: "es paralela",
  isla: "tiene isla",
  peninsula: "tiene península",
};

const KITCHEN_PRIORITY_LABEL = {
  comfortable: "cocinar con comodidad",
  family: "compartir tiempo en familia en la cocina",
  elegant: "tener una cocina elegante",
  practical: "que la cocina sea muy práctica",
  all: "la comodidad, la familia, la elegancia y lo práctico, todo a la vez",
};

const KITCHEN_PROBLEM_SENTENCE = {
  shadows: "Ya que la encimera tiene sombras, dirige puntos de luz independientes directamente sobre la zona de trabajo, no solo luz general desde el techo.",
  visibility: "Como no ves bien al cocinar, sube la intensidad de la luz sobre la encimera por encima de lo habitual, en un tono blanco neutro.",
  modern: "Para lograr un aspecto más moderno, combina downlights empotrados con un detalle de luz LED bajo los muebles altos.",
  renovating: "Como vas a hacer una reforma completa, aprovecha para dejar circuitos independientes para la zona de trabajo, la isla o península, y la luz general.",
  onlyLighting: "Ya que solo vas a cambiar la iluminación, prioriza soluciones sin obra, como focos de superficie o tiras adhesivas regulables.",
};

function joinNatural(items) {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

function generateKitchenReport(answers = {}) {
  const { layout, priorities = [], upperCabinets, workZone, size, ceilingHeight, light, problem, renovationStatus, adjoiningStyle } = answers;

  let tempK = 3000;
  if (priorities.includes("practical") || priorities.includes("comfortable")) tempK = 4000;
  else if (priorities.includes("elegant")) tempK = 2700;
  if (problem === "shadows" || problem === "visibility" || problem === "modern") tempK = 4000;

  const lux = getLux("kitchen", light);

  const area = KITCHEN_AREA_BY_SIZE[size] || 11;
  const heightFactor = KITCHEN_HEIGHT_FACTOR[ceilingHeight] || 1;
  const lumens = Math.round((lux * area * heightFactor) / 100) * 100;
  const { low: downlightsLow, high: downlightsHigh } = downlightRange(lumens, 4);

  const distribution = [];
  distribution.push(`${downlightsLow}–${downlightsHigh} downlights recomendados.`);
  distribution.push("Separación aproximada entre focos: 1,20–1,50 m, adaptada al tamaño de la cocina.");
  if (upperCabinets && upperCabinets !== "no") {
    distribution.push("Coloca la línea de focos entre 20 y 30 cm por delante de los muebles altos, para iluminar bien el centro de la encimera y evitar sombras al cocinar.");
    distribution.push("Añade iluminación LED bajo los muebles altos.");
  } else {
    distribution.push("Centra la línea de focos sobre la zona de trabajo principal para evitar sombras al cocinar.");
  }
  if (ceilingHeight === "h300") distribution.push("Con un techo tan alto, valora downlights de mayor potencia o un ángulo de haz más cerrado para que la luz llegue bien hasta la encimera.");
  distribution.push(`Temperatura recomendada: ${tempK} K.`);
  distribution.push("Índice de reproducción cromática: CRI ≥ 90, para ver bien el color real de los alimentos.");

  const priorityLabels = priorities.map((p) => KITCHEN_PRIORITY_LABEL[p]).filter(Boolean);
  const priorityIntro = priorityLabels.length ? joinNatural(priorityLabels) : "usar bien la cocina cada día";
  const layoutPhrase = KITCHEN_LAYOUT_PHRASE[layout] || "tiene una distribución propia";
  const goalPhrase = (priorities.includes("practical") || priorities.includes("comfortable"))
    ? "mejorar la visibilidad durante la preparación de alimentos"
    : "crear un ambiente agradable para desayunar o reunirte con la familia";

  const sentences = [];
  sentences.push(`Como para ti lo más importante es ${priorityIntro}, y tu cocina ${layoutPhrase}, te recomendamos una iluminación principal de ${tempK}K para ${goalPhrase}.`);

  if (workZone === "isla" || (layout === "isla" && workZone !== "encimera")) {
    sentences.push("Sobre la isla, dos o tres lámparas colgantes crearán un punto focal y una luz más agradable para desayunar o reunirte con la familia.");
  } else if (workZone === "peninsula" || layout === "peninsula") {
    sentences.push("Sobre la península, un par de colgantes lineales marcan la zona de trabajo sin cerrar la vista hacia el resto de la cocina.");
  } else if (workZone === "varias") {
    sentences.push("Como trabajas en varias zonas, reparte la luz en puntos independientes en lugar de concentrarla en un único lugar.");
  } else {
    sentences.push("Sobre la encimera principal, una regleta de luz continua bajo los muebles altos elimina las sombras que tus propias manos proyectan al cocinar.");
  }

  if (upperCabinets === "unaPared") {
    sentences.push("Añade iluminación LED bajo los muebles altos de esa pared para evitar sombras sobre la encimera.");
  } else if (upperCabinets === "dosParedes") {
    sentences.push("Como tienes muebles altos en dos paredes, ilumina ambas por separado: si solo iluminas una, la otra encimera quedará en sombra.");
  } else if (upperCabinets === "no") {
    sentences.push("Al no tener muebles altos, la luz general y los puntos sobre la zona de trabajo serán tu principal fuente de luz: conviene reforzarlos algo más de lo habitual.");
  }

  if (KITCHEN_PROBLEM_SENTENCE[problem]) sentences.push(KITCHEN_PROBLEM_SENTENCE[problem]);
  if (renovationStatus === "renovation" && problem !== "renovating") sentences.push("Aprovecha además que vas a hacer una reforma para dejar circuitos independientes preparados para el futuro.");
  if (renovationStatus === "onlyLights" && problem !== "onlyLighting") sentences.push("Ya que solo vas a cambiar la iluminación, prioriza soluciones sin obra que aprovechen los puntos ya existentes.");

  if (light === "low") sentences.push("Como la cocina recibe poca luz natural, compensa con un tono algo más intenso durante el día.");
  else if (light === "bright") sentences.push("Como recibe mucha luz natural, reserva esta intensidad sobre todo para las horas sin sol.");

  if (adjoiningStyle === "acogedor") sentences.push("Como el salón contiguo busca un ambiente acogedor, añade un punto cálido fuera de la zona de trabajo para que la cocina no se sienta fría en contraste.");
  else if (adjoiningStyle === "luminoso") sentences.push("Como el salón contiguo es muy luminoso, la temperatura de trabajo de la cocina encajará de forma natural con el resto del espacio.");
  else if (adjoiningStyle === "equilibrado") sentences.push("Como el salón contiguo tiene un ambiente equilibrado, tu cocina puede mantener su temperatura de trabajo sin que se note un salto brusco entre ambos espacios.");

  const mistakes = [
    "No coloques un único punto de luz general en el centro: dejarás la encimera en sombra.",
    "No mezcles temperaturas de color muy distintas entre la zona de trabajo y la de comer.",
    "No ilumines la zona de trabajo únicamente con luz cálida: dificulta ver bien el punto de cocción.",
  ];
  if (upperCabinets && upperCabinets !== "no") mistakes.push("No dejes los muebles altos sin luz debajo: proyectan sombra justo sobre donde más la necesitas.");
  if (workZone === "isla" || layout === "isla") mistakes.push("No cuelgues las lámparas demasiado bajas sobre la isla: interfieren con la vista entre comensales.");
  if (problem === "onlyLighting") mistakes.push("No elijas soluciones que requieran romper alicatado o encimera si no vas a hacer obra.");
  if (adjoiningStyle) mistakes.push("No dejes la cocina con una temperatura de luz totalmente distinta a la del salón: en un espacio abierto, el contraste se nota mucho más que en una habitación cerrada.");

  return { tempK, lumens, downlightsLow, downlightsHigh, area, lux, distribution, narrative: sentences.join(" "), mistakes: [...new Set(mistakes)] };
}

// ---------- Dormitorio, baño, comedor, pasillo, vestidor y terraza ----------
// Preguntas pensadas como las haría una diseñadora en una primera reunión con el cliente:
// nunca "¿qué estilo?", siempre "¿cómo vives este espacio?".

const BEDROOM_ACTIVITY_OPTIONS = [
  { id: "sleep", label: "Dormir", Icon: Moon },
  { id: "readBed", label: "Leer en la cama", Icon: BookOpen },
  { id: "dress", label: "Vestirme", Icon: Shirt },
  { id: "makeup", label: "Maquillarme", Icon: Sparkles },
  { id: "work", label: "Trabajar", Icon: Briefcase },
  { id: "tv", label: "Ver la televisión", Icon: Tv },
];

const BEDROOM_CLOSET_TYPE_OPTIONS = [
  { id: "empotrado", label: "Armario empotrado" },
  { id: "independiente", label: "Armario independiente" },
];

const BEDROOM_SIZE_OPTIONS = [
  { id: "small", label: "Pequeño", hint: "Menos de 9 m²", area: 7 },
  { id: "medium", label: "Mediano", hint: "9–14 m²", area: 11 },
  { id: "large", label: "Grande", hint: "14–20 m²", area: 17 },
  { id: "xl", label: "Extra grande", hint: "Más de 20 m²", area: 24 },
];
const BEDROOM_AREA_BY_SIZE = Object.fromEntries(BEDROOM_SIZE_OPTIONS.map((o) => [o.id, o.area]));

const BATHROOM_TYPE_OPTIONS = [
  { id: "aseo", label: "Aseo" },
  { id: "completo", label: "Baño completo" },
];

const BATHROOM_MIRROR_OPTIONS = [
  { id: "maquillarme", label: "Maquillarme" },
  { id: "afeitarme", label: "Afeitarme" },
  { id: "rutinaFacial", label: "Rutina facial" },
  { id: "basico", label: "Uso básico" },
];

const BATHROOM_FIXTURE_OPTIONS = [
  { id: "ducha", label: "Ducha" },
  { id: "banera", label: "Bañera" },
  { id: "ambas", label: "Tengo ambas" },
];

const BATHROOM_SIZE_OPTIONS = [
  { id: "small", label: "Pequeño", hint: "Menos de 4 m² (aseo)", area: 3 },
  { id: "medium", label: "Mediano", hint: "4–8 m²", area: 6 },
  { id: "large", label: "Grande", hint: "Más de 8 m²", area: 10 },
];
const BATHROOM_AREA_BY_SIZE = Object.fromEntries(BATHROOM_SIZE_OPTIONS.map((o) => [o.id, o.area]));

const DINING_SHAPE_OPTIONS = [
  { id: "redonda", label: "Redonda" },
  { id: "rectangular", label: "Rectangular" },
  { id: "cuadrada", label: "Cuadrada" },
];

const DINING_SEATS_OPTIONS = [
  { id: "pocas", label: "2 personas" },
  { id: "varias", label: "3–4 personas" },
  { id: "muchas", label: "5 o más" },
];

const DINING_SIZE_OPTIONS = [
  { id: "small", label: "Pequeño", hint: "Menos de 10 m²", area: 8 },
  { id: "medium", label: "Mediano", hint: "10–16 m²", area: 13 },
  { id: "large", label: "Grande", hint: "16–24 m²", area: 20 },
  { id: "xl", label: "Extra grande", hint: "Más de 24 m²", area: 28 },
];
const DINING_AREA_BY_SIZE = Object.fromEntries(DINING_SIZE_OPTIONS.map((o) => [o.id, o.area]));

const CLOSET_TYPE_OPTIONS = [
  { id: "abierto", label: "Abiertos" },
  { id: "cerrado", label: "Con puertas" },
  { id: "mixto", label: "Combinación de ambos" },
];

const CLOSET_SIZE_OPTIONS = [
  { id: "small", label: "Pequeño", hint: "Menos de 3 m²", area: 2 },
  { id: "medium", label: "Mediano", hint: "3–6 m²", area: 4.5 },
  { id: "large", label: "Grande", hint: "6–12 m²", area: 9 },
  { id: "xl", label: "Extra grande", hint: "Más de 12 m²", area: 15 },
];
const CLOSET_AREA_BY_SIZE = Object.fromEntries(CLOSET_SIZE_OPTIONS.map((o) => [o.id, o.area]));

const TERRACE_ACTIVITY_OPTIONS = [
  { id: "eat", label: "Comer", Icon: UtensilsCrossed },
  { id: "relax", label: "Relajarme", Icon: Wind },
  { id: "read", label: "Leer", Icon: BookOpen },
  { id: "plants", label: "Plantas", Icon: TreePine },
  { id: "gatherings", label: "Reuniones", Icon: Users },
];

const TERRACE_COVERED_OPTIONS = [
  { id: "cubierta", label: "Cubierta" },
  { id: "descubierta", label: "Descubierta" },
];

const TERRACE_SIZE_OPTIONS = [
  { id: "small", label: "Pequeña", hint: "Menos de 6 m²", area: 5 },
  { id: "medium", label: "Mediana", hint: "6–12 m²", area: 9 },
  { id: "large", label: "Grande", hint: "12–20 m²", area: 16 },
  { id: "xl", label: "Extra grande", hint: "Más de 20 m²", area: 25 },
];
const TERRACE_AREA_BY_SIZE = Object.fromEntries(TERRACE_SIZE_OPTIONS.map((o) => [o.id, o.area]));

const HALLWAY_LENGTH_OPTIONS = [
  { id: "corto", label: "Corto", hint: "Menos de 3 m" },
  { id: "medio", label: "Medio", hint: "3–6 m" },
  { id: "largo", label: "Largo", hint: "Más de 6 m" },
];

const HALLWAY_SENSOR_OPTIONS = [
  { id: "si", label: "Sí, quiero sensor de movimiento", Icon: Zap },
  { id: "no", label: "No, prefiero interruptor normal", Icon: DoorOpen },
];

const OFFICE_SIZE_OPTIONS = [
  { id: "small", label: "Pequeño", hint: "Menos de 6 m²", area: 6 },
  { id: "medium", label: "Mediano", hint: "6–10 m²", area: 9 },
  { id: "large", label: "Grande", hint: "10–16 m²", area: 14 },
  { id: "xl", label: "Extra grande", hint: "Más de 16 m²", area: 20 },
];
const OFFICE_AREA_BY_SIZE = Object.fromEntries(OFFICE_SIZE_OPTIONS.map((o) => [o.id, o.area]));

const DESK_POSITION_OPTIONS = [
  { id: "frente", label: "Frente a la ventana" },
  { id: "espaldas", label: "De espaldas a la ventana" },
  { id: "lateral", label: "De lado a la ventana" },
  { id: "sinVentana", label: "Sin ventana cerca" },
];

const ACTIVITY_OPTIONS = {
  bedroom: BEDROOM_ACTIVITY_OPTIONS,
  terrace: TERRACE_ACTIVITY_OPTIONS,
};

const ACTIVITY_INSIGHT = {
  bedroom: {
    sleep: "Para dormir bien, la luz principal debe poder atenuarse hasta casi apagarse: la última luz que ves antes de dormir marca el tono del descanso.",
    readBed: "Para leer en la cama, una lámpara orientable en la mesita, a la altura del hombro, evita que la luz general te deslumbre al recostarte.",
    dress: "Para vestirte con buena luz, usa un tono neutro y sin sombras en la zona donde te cambias: la misma cálida que usas para dormir no te deja ver bien los colores.",
    makeup: "Para maquillarte, necesitas luz uniforme sobre el rostro, nunca solo cenital: la luz de techo genera sombras que engañan al ojo.",
    work: "Si tienes un rincón de trabajo en el dormitorio, sepáralo con una luz blanca propia, distinta del resto del cuarto, para que el cerebro distinga descanso de trabajo.",
    tv: "Si ves la televisión desde la cama, evita que la luz general quede justo detrás o enfrente de la pantalla para no generar reflejos.",
  },
  terrace: {
    eat: "Para comer al aire libre, protege la luminaria de la intemperie y céntrala sobre la mesa.",
    relax: "Para relajarte, una luz cálida e indirecta —guirnaldas o farolillos— crea un ambiente sereno sin deslumbrar a nadie.",
    read: "Para leer al aire libre, añade un punto de luz algo más intenso cerca de tu rincón habitual, sin depender solo del ambiente general.",
    plants: "Si tienes plantas cerca, evita luces muy próximas y cálidas que alteren su ciclo natural; mejor puntos indirectos alrededor.",
    gatherings: "Para las reuniones, reparte la luz en varios puntos de baja intensidad en lugar de un único foco potente que centre toda la atención.",
  },
};

function activityStep(roomId, subtitle) {
  return { key: "activities", title: roomId === "bedroom" ? "¿Qué haces habitualmente en el dormitorio?" : "¿Cómo utilizas la terraza?", subtitle, type: "multi", layout: "list", options: ACTIVITY_OPTIONS[roomId] };
}

// Reacciones cortas que aparecen justo después de responder la pregunta del
// "problema a resolver" en cada habitación — el mismo guiño de razonamiento
// que ya se probó y validó en Cocina.
const PROBLEM_REACTIONS = {
  living: {
    dark: "Entendido, vamos a reforzar la luz general y las esquinas.",
    glare: "Vamos a alejar la luz de la línea de visión hacia la televisión.",
    reading: "Anotado: un buen rincón de lectura va a ser prioridad.",
    cozy: "Vamos a priorizar tonos cálidos y luz regulable.",
    renovating: "Con reforma desde cero, podemos dejar varios circuitos independientes preparados.",
  },
  bedroom: {
    dark: "Vamos a reforzar la luz general sin perder la calidez para descansar.",
    glare: "Evitaremos puntos de luz que apunten directo a la cama.",
    reading: "Anotado: un buen punto de luz en la mesita de noche será clave.",
    cozy: "Priorizaremos tonos cálidos y la posibilidad de atenuar la luz.",
    renovating: "Con reforma desde cero, separaremos en circuitos la zona de descanso y el vestidor.",
  },
  bathroom: {
    shadows: "Vamos a iluminar el espejo desde ambos lados, no solo desde arriba.",
    cold: "Bajaremos el tono general hacia un blanco más cálido.",
    night: "Añadiremos una luz muy tenue, independiente de la principal, para la noche.",
    spa: "Priorizaremos luz cálida y regulable para ese ambiente de spa.",
    renovating: "Con reforma desde cero, separaremos en circuitos el espejo, la zona húmeda (si la tienes) y la general.",
  },
  dining: {
    badLight: "Vamos a centrar un punto de luz directo sobre la mesa.",
    noAmbience: "Añadiremos un regulador para bajar la intensidad según la ocasión.",
    pendant: "La lámpara colgante irá a la altura justa para no bloquear la vista entre comensales.",
    elegant: "Combinaremos la luz de la mesa con algún punto cálido adicional en la sala.",
    renovating: "Con reforma desde cero, dejaremos prevista una toma en el techo, centrada sobre la mesa.",
  },
  closet: {
    colors: "Cambiaremos a una luz blanca neutra para que veas los colores reales de la ropa.",
    mirror: "Iluminaremos el espejo desde ambos lados del cuerpo, no solo desde arriba.",
    organize: "Añadiremos luz uniforme dentro de cajones y estantes.",
    elegant: "Sumaremos un punto de luz cálida decorativa junto al espejo o la entrada.",
    renovating: "Con reforma desde cero, integraremos luz dentro de los propios armarios.",
  },
  terrace: {
    dark: "Añadiremos dos o tres puntos de luz repartidos, en vez de uno solo central.",
    noAmbience: "Combinaremos luz cálida indirecta con algún punto decorativo.",
    weather: "Elegiremos luminarias con certificación IP44 o superior.",
    decor: "Priorizaremos varios puntos de baja intensidad frente a un único foco potente.",
    renovating: "Con reforma desde cero, dejaremos prevista una toma eléctrica protegida junto a la zona de estar.",
  },
  hallway: {
    dark: "Añadiremos un punto adicional en el tramo central, además de los extremos.",
    scary: "Una luz muy tenue permanente o con sensor hará que dé menos reparo cruzarlo de noche.",
    energy: "Un sensor de movimiento con LED de bajo consumo será lo más eficiente.",
    decor: "Consideraremos apliques en la pared en vez de solo downlights en el techo.",
    renovating: "Con reforma desde cero, dejaremos cableado preparado para un sensor de movimiento.",
  },
  office: {
    glare: "Vamos a reorientar o suavizar la luz que se refleja en la pantalla.",
    tired: "Añadiremos una luz de tarea más uniforme para descansar la vista.",
    videocall: "Reforzaremos la luz frontal para que te veas mejor en cámara.",
    cold: "Bajaremos el tono hacia una luz algo más cálida.",
    renovating: "Con reforma desde cero, dejaremos previstas varias tomas para escritorio y estanterías.",
  },
};

function problemStep(roomId) {
  return { key: "problem", title: "¿Qué te gustaría solucionar?", subtitle: "Elige lo que más se acerque a tu situación.", type: "single", layout: "list", options: PROBLEM_OPTIONS[roomId], reactions: PROBLEM_REACTIONS[roomId] };
}
const lightStep = { key: "light", title: "¿Qué iluminación tiene?", subtitle: "Piensa en un día normal, sin encender ninguna luz.", type: "single", layout: "list", options: LIGHT_OPTIONS };

const PROBLEM_OPTIONS = {
  bedroom: [
    { id: "dark", label: "El dormitorio se ve oscuro" },
    { id: "glare", label: "La luz me deslumbra al despertar" },
    { id: "reading", label: "Me falta luz para leer o vestirme" },
    { id: "cozy", label: "Quiero un ambiente más relajante" },
    { id: "renovating", label: "Estoy reformando desde cero", Icon: Hammer },
  ],
  bathroom: [
    { id: "shadows", label: "Tengo sombras en el espejo" },
    { id: "cold", label: "La luz es demasiado fría o clínica" },
    { id: "night", label: "Me falta luz para las rutinas nocturnas" },
    { id: "spa", label: "Quiero un ambiente de spa" },
    { id: "renovating", label: "Estoy reformando desde cero", Icon: Hammer },
  ],
  dining: [
    { id: "badLight", label: "La mesa se ve mal iluminada" },
    { id: "noAmbience", label: "Falta ambiente para las cenas" },
    { id: "pendant", label: "Quiero instalar una lámpara colgante" },
    { id: "elegant", label: "Busco algo más elegante" },
    { id: "renovating", label: "Estoy reformando desde cero", Icon: Hammer },
  ],
  closet: [
    { id: "colors", label: "No veo bien los colores de la ropa" },
    { id: "mirror", label: "Hay sombras al mirarme al espejo" },
    { id: "organize", label: "Quiero organizarlo mejor con luz" },
    { id: "elegant", label: "Busco algo más elegante" },
    { id: "renovating", label: "Estoy reformando desde cero", Icon: Hammer },
  ],
  terrace: [
    { id: "dark", label: "Se ve muy oscura de noche" },
    { id: "noAmbience", label: "Falta ambiente para recibir invitados" },
    { id: "weather", label: "Quiero proteger las luces del agua o el sol" },
    { id: "decor", label: "Busco algo más decorativo" },
    { id: "renovating", label: "Estoy reformando desde cero", Icon: Hammer },
  ],
  hallway: [
    { id: "dark", label: "El pasillo se ve oscuro" },
    { id: "scary", label: "Da algo de reparo cruzarlo de noche" },
    { id: "energy", label: "Quiero ahorrar energía" },
    { id: "decor", label: "Busco algo más decorativo" },
    { id: "renovating", label: "Estoy reformando desde cero", Icon: Hammer },
  ],
  office: [
    { id: "glare", label: "Se refleja la luz en la pantalla" },
    { id: "tired", label: "Se me cansa la vista" },
    { id: "videocall", label: "No me veo bien en videollamadas" },
    { id: "cold", label: "Se ve muy fría o clínica" },
    { id: "renovating", label: "Estoy reformando desde cero", Icon: Hammer },
  ],
};

// Preguntas específicas de cada habitación que no encajan en "actividad" ni "problema":
// se resuelven todas con este mismo mecanismo genérico.
const EXTRA_INSIGHT = {
  bedroom: {
    closetType: {
      empotrado: "Con armario empotrado, una luz continua en la parte superior evita que el interior quede en sombra al abrir las puertas.",
      independiente: "Con un armario independiente, un punto de luz cercano evita que el propio mueble haga sombra sobre sí mismo al abrirlo.",
    },
    closetLight: {
      dentro: "Coloca una tira LED vertical en un lateral si el armario mide alrededor de 60 cm de ancho, o en ambos laterales si ronda los 120 cm. Usa tiras de unos 10W/m con los puntos de led muy juntos, para que no se note el punteado.",
      delante: "Cuando la luz dentro del armario no es posible, coloca luminarias empotrables o de superficie delante, a unos 15-20 cm de las puertas, para que la luz no quede detrás de ti al vestirte y genere sombras.",
      no: "Al no necesitar luz específica en el armario, la luz general del dormitorio bien colocada será suficiente.",
    },
  },
  bathroom: {
    type: {
      aseo: "Al ser un aseo, con un buen punto sobre el espejo y otro general suele bastar; no necesitas tantas zonas diferenciadas.",
      completo: "Al ser un baño completo, conviene diferenciar al menos tres zonas de luz: espejo, ducha o bañera, y general.",
    },
    mirrorUse: {
      maquillarme: "Para maquillarte, la luz debe llegar uniforme a ambos lados del rostro y tener buena calidad de color, no solo intensidad.",
      afeitarme: "Para afeitarte, prioriza una luz uniforme y sin sombras duras, más que una luz muy intensa en un único punto.",
      rutinaFacial: "Para tu rutina facial, una luz uniforme y neutra te deja ver la piel tal como es, sin suavizar ni exagerar nada.",
      basico: "Para un uso básico del espejo, con un buen punto de luz a cada lado es más que suficiente.",
    },
    fixture: {
      ducha: "Con ducha, usa una luz resistente a la humedad y bien centrada, sin dejar las esquinas en sombra.",
      banera: "Con bañera, una luz regulable y cálida cerca convierte el baño en un momento de relax, no solo de higiene.",
      ambas: "Al tener ducha y bañera, diferencia la luz de cada zona: más funcional en la ducha, más cálida y regulable junto a la bañera.",
    },
    nightlight: {
      si: "Con luz nocturna automática, un sensor de presencia a baja altura evita encender todo el baño en mitad de la noche.",
      no: "Sin luz nocturna automática, deja al menos un interruptor accesible desde la puerta para no cruzar el baño a oscuras.",
    },
  },
  hallway: {
    connects: {
      si: "Como conecta varias habitaciones, un sensor de movimiento cobra aún más sentido: se usará muchas veces al día solo de paso.",
      no: "Al conectar pocos espacios, un interruptor simple en cada extremo puede ser suficiente, sin necesidad de automatizarlo.",
    },
  },
  dining: {
    daily: {
      si: "Como lo usas todos los días, prioriza una luz cómoda para el uso diario por encima de un efecto muy decorativo.",
      no: "Al usarlo de forma ocasional, puedes permitirte una propuesta más decorativa, pensada para momentos especiales.",
    },
    shape: {
      redonda: "Con mesa redonda, un único punto de luz centrado sobre ella suele ser suficiente y queda más equilibrado visualmente.",
      rectangular: "Con mesa rectangular, dos o tres puntos en línea reparten mejor la luz que un único punto central.",
      cuadrada: "Con mesa cuadrada, un punto centrado o un colgante de varias luces cubre bien la mesa sin dejar las esquinas oscuras.",
    },
    seats: {
      pocas: "Para dos personas, no necesitas mucha potencia: prioriza el ambiente sobre la cantidad de luz.",
      varias: "Para 3–4 personas, asegúrate de que la luz cubra bien toda la mesa, no solo el centro.",
      muchas: "Para 5 o más personas, reparte la luz en varios puntos: un único foco central dejará los extremos de la mesa en sombra.",
    },
    pendant: {
      si: "Si quieres una lámpara decorativa sobre la mesa, cuélgala entre 70 y 90 cm sobre la superficie para iluminar bien sin bloquear la vista.",
      no: "Sin lámpara decorativa, unos downlights orientables sobre la mesa cumplen la misma función de forma más discreta.",
    },
  },
  closet: {
    mirror: {
      tengo: "Añade iluminación frontal o lateral a ambos lados del espejo, a la altura de los ojos: la luz cenital sola genera sombras bajo la barbilla y los ojos. Busca un CRI de 90 o superior para ver bien los colores reales de la ropa.",
      planeo: "Antes de instalar el espejo, coloca dos puntos de luz a ambos lados de donde irá ubicado, a la altura aproximada de los ojos, y deja prevista la instalación eléctrica en esa zona para no tener que abrir pared después. Busca un CRI de 90 o superior.",
      no: "Con iluminación general uniforme es suficiente, sin necesidad de puntos de luz adicionales para el rostro.",
    },
  },
  terrace: {
    covered: {
      cubierta: "Al estar cubierta, puedes usar luminarias pensadas para interior siempre que estén protegidas de la humedad ambiental.",
      descubierta: "Al estar descubierta, elige luminarias con certificación para exterior (IP44 o superior) que resistan la lluvia directa.",
    },
    night: {
      si: "Como la usas sobre todo de noche, prioriza la calidez y la posibilidad de regular la intensidad por encima de una luz general muy potente.",
      no: "Al usarla sobre todo de día, la luz artificial puede ser más discreta: la protagonista sigue siendo la luz natural.",
    },
  },
  office: {
    deskPosition: {
      frente: "Al mirar hacia la ventana, la luz natural puede deslumbrarte directamente frente a la pantalla; usa una cortina o estor semitranslúcido para suavizarla en las horas de más sol.",
      espaldas: "Con la ventana detrás de ti, la luz puede reflejarse en la pantalla y crear un contraluz molesto en videollamadas; orienta el monitor ligeramente en ángulo respecto a la ventana.",
      lateral: "La posición lateral es la más favorable: aprovecha la luz natural sin generar reflejos directos ni deslumbramiento — solo hay que reforzarla con luz artificial en días nublados.",
      sinVentana: "Sin luz natural cercana, prioriza una lámpara de escritorio con buena reproducción de color (CRI ≥ 90) para no forzar la vista durante jornadas largas.",
    },
    videoCalls: {
      si: "Si haces videollamadas, coloca una luz suave y difusa frente a tu rostro, a la altura de los ojos. Evita depender solo de la luz del techo para reducir las sombras duras y verte mejor en cámara.",
      no: "Al no depender de videollamadas, puedes priorizar la comodidad visual sobre la estética frente a cámara.",
    },
  },
};

const CLOSET_TYPE_INSIGHT = {
  abierto: "Como tu armario es abierto, la luz general del vestidor ya alcanza la ropa; refuerza sobre todo la zona del espejo, si tienes uno.",
  cerrado: "Con armarios cerrados, añade una luz interior en cada módulo: si no, la luz general no llega bien al fondo.",
  mixto: "Con armarios mixtos, ilumina primero los módulos cerrados por dentro y deja que la luz general cubra las zonas abiertas.",
};

const HALLWAY_LENGTH_INSIGHT = {
  corto: "Al ser un pasillo corto, un único punto centrado suele ser suficiente para cubrirlo bien.",
  medio: "Con una longitud media, dos puntos bien distribuidos evitan zonas oscuras sin necesidad de saturar de luz.",
  largo: "Como el pasillo es largo, un único punto central dejaría los extremos en sombra: reparte dos o tres puntos a lo largo del recorrido.",
};

const HALLWAY_SENSOR_INSIGHT = {
  si: "Con sensor de movimiento, puedes usar una luz algo más tenue de base: se activará con más intensidad solo cuando alguien pase.",
  no: "Sin sensor, conviene un interruptor accesible en ambos extremos del pasillo para no tener que cruzarlo a oscuras.",
};

const LIGHT_INSIGHT = {
  bright: "Como el espacio recibe mucha luz natural, reserva los tonos cálidos para la noche y evita saturar de luz durante el día.",
  moderate: "Con una luz natural media, un punto cálido adicional para las tardes es suficiente para no notar el cambio de luz.",
  low: "Al recibir poca luz natural, compensa con un tono blanco cálido algo más intenso de lo habitual durante el día.",
};

const PROBLEM_INSIGHT = {
  bedroom: {
    dark: "Como el dormitorio se ve oscuro, refuerza la luz general con un punto adicional, sin perder la calidez necesaria para descansar.",
    glare: "Para que la luz no te deslumbre al despertar, evita puntos orientados directamente hacia la cama y prioriza luz indirecta.",
    reading: "Ya que te falta luz para leer o vestirte, añade un punto dedicado en la mesita de noche y otro de luz neutra en la zona donde te cambias.",
    cozy: "Para un ambiente más relajante, prioriza tonos cálidos y añade la posibilidad de atenuar la luz por la noche.",
    renovating: "Como estás reformando desde cero, aprovecha para separar en circuitos la zona de descanso y la de vestidor.",
  },
  bathroom: {
    shadows: "Para eliminar las sombras del espejo, coloca la luz a ambos lados del rostro en lugar de un único punto cenital.",
    cold: "Si la luz se siente demasiado fría, baja la temperatura de color general hacia un blanco más cálido y neutro.",
    night: "Para las rutinas nocturnas, añade una luz muy tenue independiente de la luz principal del baño.",
    spa: "Para un ambiente de spa, prioriza luz cálida y regulable, y valora añadir una vela o luz indirecta en la zona húmeda.",
    renovating: "Como estás reformando desde cero, separa en circuitos distintos el espejo, la zona húmeda (si la tienes) y la luz general.",
  },
  dining: {
    badLight: "Para que la mesa se vea bien iluminada, centra un punto de luz directamente sobre ella, no solo la luz general de la sala.",
    noAmbience: "Para dar más ambiente a las cenas, añade un regulador que te permita bajar la intensidad según la ocasión.",
    pendant: "Si vas a instalar una lámpara colgante, cuélgala entre 70 y 90 cm sobre la mesa para que ilumine bien sin bloquear la vista.",
    elegant: "Para un aspecto más elegante, combina la luz de la mesa con algún punto cálido adicional en el resto de la sala.",
    renovating: "Como estás reformando desde cero, deja prevista una toma de corriente en el techo, centrada sobre la mesa.",
  },
  closet: {
    colors: "Si no distingues bien los colores, cambia a una luz blanca neutra de alta fidelidad de color sobre la zona de la ropa.",
    mirror: "Para evitar sombras en el espejo, ilumina desde ambos lados del cuerpo en lugar de un único punto superior.",
    organize: "Para organizar mejor, añade luz uniforme dentro de cajones y estantes, no solo en el centro del vestidor.",
    elegant: "Para un aspecto más elegante, añade un punto de luz cálida decorativa junto al espejo o la entrada.",
    renovating: "Como estás reformando desde cero, aprovecha para integrar luz dentro de los propios armarios.",
  },
  terrace: {
    dark: "Si la terraza se ve muy oscura de noche, añade dos o tres puntos de luz distribuidos en lugar de uno solo central.",
    noAmbience: "Para dar ambiente a las visitas, combina luz cálida indirecta con algún punto decorativo, como farolillos o guirnaldas.",
    weather: "Si buscas proteger las luces del agua o el sol, elige luminarias con certificación para exterior (IP44 o superior).",
    decor: "Para un toque más decorativo, prioriza varios puntos de baja intensidad frente a un único foco potente.",
    renovating: "Como estás reformando desde cero, deja prevista una toma eléctrica protegida cerca de la zona de estar exterior.",
  },
  hallway: {
    dark: "Si el pasillo se ve oscuro, añade un punto adicional en el tramo central, además de los extremos.",
    scary: "Para que dé menos reparo cruzarlo de noche, instala una luz muy tenue permanente o con sensor a baja altura.",
    energy: "Para ahorrar energía, un sensor de movimiento con luz LED de bajo consumo es la combinación más eficiente.",
    decor: "Para un toque decorativo, considera apliques en la pared en lugar de solo downlights en el techo.",
    renovating: "Como estás reformando desde cero, aprovecha para dejar cableado preparado para un sensor de movimiento.",
  },
  office: {
    glare: "Para evitar reflejos en la pantalla, evita colocar luces justo detrás de ti o frente al monitor; opta por luz indirecta o lateral.",
    tired: "El cansancio visual suele deberse a contrastes fuertes entre la pantalla y el entorno: iguala la luz ambiente con el brillo de la pantalla.",
    videocall: "Además de la luz, revisa la posición de la cámara: colócala a la altura de los ojos, no por debajo, para evitar un ángulo poco favorecedor.",
    cold: "Si la luz se siente demasiado fría o clínica, baja la temperatura de color hacia un blanco más neutro.",
    renovating: "Con una reforma completa, aprovecha para dejar circuitos independientes para la luz general y la de tarea del escritorio.",
  },
};

// Motor de cálculo compartido: dormitorio, baño, comedor, vestidor y terraza
// reutilizan los mismos textos ya redactados en getReport() como "consejos",
// y solo cambia cómo se calculan los números (m², lux de referencia y temperatura).
const ROOM_TECH_CONFIG = {
  bedroom: {
    areaMap: BEDROOM_AREA_BY_SIZE,
    defaultArea: 12,
    minDownlights: 2,
    getTempK: (a) => ((a.activities || []).includes("work") ? 3500 : 2700),
  },
  bathroom: {
    areaMap: BATHROOM_AREA_BY_SIZE,
    defaultArea: 6,
    minDownlights: 2,
    getTempK: (a) => (a.fixture === "banera" || a.problem === "spa" || a.problem === "cold" ? 3000 : 4000),
  },
  dining: {
    areaMap: DINING_AREA_BY_SIZE,
    defaultArea: 13,
    minDownlights: 2,
    getTempK: () => 2700,
  },
  closet: {
    areaMap: CLOSET_AREA_BY_SIZE,
    defaultArea: 6,
    minDownlights: 2,
    getTempK: () => 4000,
  },
  terrace: {
    areaMap: TERRACE_AREA_BY_SIZE,
    defaultArea: 12,
    minDownlights: 2,
    getTempK: () => 3000,
  },
  office: {
    areaMap: OFFICE_AREA_BY_SIZE,
    defaultArea: 9,
    minDownlights: 2,
    getTempK: (a) => (a.problem === "cold" ? 3500 : 4000),
  },
};

const ROOM_TECH_MISTAKES = {
  bedroom: [
    "No ilumines la zona de la cama con un único punto de techo: combina apliques, una lámpara de sobremesa, una suspensión o tiras de led escondidas, cuidando siempre que ninguna deslumbre estando tumbado.",
    "No mezcles tonos de luz muy distintos entre la zona de la cama y la zona de vestir.",
  ],
  bathroom: [
    "No coloques un único punto de luz cenital sobre el espejo: usa apliques de luz directa a ambos lados para evitar sombras bajo los ojos y la nariz.",
    "No mezcles temperaturas de color muy distintas entre la zona del espejo y el resto del baño.",
    "No dejes el lavabo sin un punto de luz propio: un downlight de haz algo cerrado sobre esa zona la enmarca y aporta luz general al baño.",
    "No empotres luminarias directamente en el techo de la ducha: mejor luz indirecta con tiras led estancas (IP67) ocultas en un foseado de techo o una hornacina.",
  ],
  dining: [
    "No cuelgues la lámpara demasiado alta sobre la mesa: pierde función si queda muy por encima de la superficie.",
    "No ilumines solo el centro si la mesa es grande: deja los extremos en sombra.",
    "No dependas solo de luz general difusa: sin un punto centrado sobre la mesa, el comedor se ve plano y la mesa mal iluminada.",
  ],
  closet: [
    "No uses luz muy cálida como única fuente: distorsiona el color real de la ropa.",
    "No dejes los armarios cerrados sin luz interior si son profundos: la luz general no llega bien al fondo.",
  ],
  terrace: [
    "No uses luminarias sin certificación para exterior si la terraza está descubierta.",
    "No dependas de un único foco potente: reparte varios puntos de menor intensidad.",
  ],
  office: [
    "No coloques una lámpara de escritorio que proyecte la sombra de tu propia mano al escribir: debe venir del lado contrario a tu mano dominante.",
    "No dependas solo del brillo de la pantalla como fuente de luz: fuerza mucho la vista en sesiones largas.",
  ],
};

function generateGenericTechnicalReport(roomId, answers = {}) {
  const cfg = ROOM_TECH_CONFIG[roomId];
  const area = cfg.areaMap[answers.size] ?? cfg.defaultArea;
  const lux = getLux(roomId, answers.light);
  const lumens = Math.round((lux * area) / 100) * 100;
  const { low: downlightsLow, high: downlightsHigh } = downlightRange(lumens, cfg.minDownlights);
  const tempK = cfg.getTempK(answers);
  const tips = getReport(roomId, answers);
  const mistakes = ROOM_TECH_MISTAKES[roomId] || [];
  return { tempK, lumens, downlightsLow, downlightsHigh, area, lux, tips, mistakes };
}

const ROOM_FLOWS = {
  living: [
    { key: "activities", title: "¿Cómo utilizas principalmente el salón?", subtitle: "Puedes elegir varias opciones.", type: "multi", layout: "list", options: LIVING_ACTIVITY_OPTIONS },
    { key: "size", title: "¿Cuántos metros cuadrados tiene el salón?", subtitle: "Un cálculo aproximado está bien.", info: "En un salón suelen recomendarse entre 150 y 225 lm/m² según el ambiente que busques. Nemul hará el cálculo automáticamente.", type: "single", layout: "grid", options: SALON_SIZE_OPTIONS },
    { key: "light", title: "¿Cuánta luz natural recibe?", subtitle: "Piensa en un día normal, sin encender ninguna luz.", type: "single", layout: "list", options: LIGHT_OPTIONS },
    { key: "ceiling", title: "¿Qué tipo de techo tienes?", subtitle: "Esto determina qué soluciones de instalación son posibles.", type: "single", layout: "list", options: CEILING_OPTIONS, reactions: {
      liso: "Un techo liso no tiene cámara para empotrar focos: sin reforma iremos a soluciones de superficie; con reforma, se puede crear un falso techo.",
      pladur: "Con falso techo de pladur, podemos integrar tiras LED perimetrales sin ninguna obra extra.",
      vigas: "Con vigas vistas, vamos a evitar empotrar nada en la madera y usar soluciones de superficie.",
      noSe: "Sin problema, lo confirmamos con un instalador antes de decidir si se puede empotrar algo.",
    } },
    { key: "goals", title: "¿Qué te gustaría conseguir con la iluminación?", subtitle: "Puedes elegir varias opciones.", type: "multi", layout: "list", options: LIVING_GOAL_OPTIONS },
    { key: "problem", title: "¿Qué te gustaría solucionar?", subtitle: "Elige lo que más se acerque a tu situación.", type: "single", layout: "list", options: LIVING_PROBLEM_OPTIONS, reactions: PROBLEM_REACTIONS.living },
    renovationStep,
  ],
  livingDining: [
    { key: "activities", title: "¿Cómo utilizas principalmente el espacio?", subtitle: "Puedes elegir varias opciones.", type: "multi", layout: "list", options: LIVING_ACTIVITY_OPTIONS },
    { key: "diningShape", title: "¿La mesa del comedor es redonda, rectangular o cuadrada?", subtitle: "La forma cambia cómo repartimos la luz sobre ella.", type: "single", layout: "list", options: DINING_SHAPE_OPTIONS, reactions: {
      redonda: "Con mesa redonda, un único punto centrado suele ser suficiente y queda muy equilibrado.",
      rectangular: "Con mesa rectangular, dos o tres puntos en línea reparten mejor la luz.",
      cuadrada: "Con mesa cuadrada, un colgante centrado o de varias luces cubre bien toda la superficie.",
    } },
    { key: "diningSeats", title: "¿Cuántas personas suelen comer?", subtitle: "Un cálculo aproximado está bien.", type: "single", layout: "list", options: DINING_SEATS_OPTIONS },
    { key: "diningPendant", title: "¿Quieres una lámpara decorativa sobre la mesa?", subtitle: "Como una lámpara colgante.", type: "single", layout: "list", options: YES_NO_OPTIONS },
    { key: "size", title: "¿Cuántos metros cuadrados tiene el salón-comedor en total?", subtitle: "Un cálculo aproximado está bien.", info: "Al ser un espacio abierto, se calcula como una sola superficie. Nemul hará el cálculo automáticamente.", type: "single", layout: "grid", options: SALON_SIZE_OPTIONS },
    { key: "light", title: "¿Cuánta luz natural recibe?", subtitle: "Piensa en un día normal, sin encender ninguna luz.", type: "single", layout: "list", options: LIGHT_OPTIONS },
    { key: "ceiling", title: "¿Qué tipo de techo tienes?", subtitle: "Esto determina qué soluciones de instalación son posibles.", type: "single", layout: "list", options: CEILING_OPTIONS },
    { key: "goals", title: "¿Qué te gustaría conseguir con la iluminación?", subtitle: "Puedes elegir varias opciones.", type: "multi", layout: "list", options: LIVING_GOAL_OPTIONS },
    { key: "problem", title: "¿Qué te gustaría solucionar?", subtitle: "Elige lo que más se acerque a tu situación.", type: "single", layout: "list", options: LIVING_PROBLEM_OPTIONS, reactions: PROBLEM_REACTIONS.living },
    renovationStep,
  ],
  kitchen: [
    {
      key: "layout", title: "¿Qué distribución tiene tu cocina?", subtitle: "Elige la forma que más se parece a la tuya.", type: "single", layout: "grid", options: KITCHEN_LAYOUT_OPTIONS,
      reactions: KITCHEN_LAYOUT_REACTIONS,
    },
    { key: "size", title: "¿Cuántos metros cuadrados tiene la cocina?", subtitle: "Un cálculo aproximado está bien.", info: "Para una cocina suelen recomendarse entre 300 y 400 lm/m². Nemul hará el cálculo automáticamente según el tamaño y la luz natural.", type: "single", layout: "grid", options: KITCHEN_SIZE_OPTIONS },
    { key: "priorities", title: "¿Qué es lo más importante para ti en la cocina?", subtitle: "Puedes elegir varias opciones.", type: "multi", layout: "list", options: KITCHEN_PRIORITY_OPTIONS },
    {
      key: "upperCabinets", title: "¿Tienes muebles altos?", subtitle: "Esto nos dice dónde puede faltar luz sobre la encimera.", type: "single", layout: "list", options: KITCHEN_UPPER_CABINETS_OPTIONS,
      reactions: {
        unaPared: "Anotado: esa pared es donde probablemente falte luz sobre la encimera.",
        dosParedes: "Con muebles en dos paredes, ninguna de las dos se puede quedar en sombra.",
        no: "Sin muebles altos, la luz general va a tener que hacer casi todo el trabajo.",
      },
    },
    { key: "workZone", title: "¿Dónde preparas normalmente los alimentos?", subtitle: "Así sabremos dónde reforzar la iluminación.", type: "single", layout: "list", options: KITCHEN_WORK_ZONE_OPTIONS },
    { key: "ceilingHeight", title: "¿Cuál es la altura aproximada del techo?", subtitle: "Un cálculo aproximado está bien.", type: "single", layout: "grid", options: KITCHEN_CEILING_HEIGHT_OPTIONS },
    { key: "light", title: "¿Cuánta luz natural recibe la cocina durante el día?", subtitle: "Piensa en un día normal, sin encender ninguna luz.", type: "single", layout: "list", options: LIGHT_OPTIONS },
    {
      key: "problem", title: "¿Qué te gustaría solucionar?", subtitle: "Elige lo que más se acerque a tu situación.", type: "single", layout: "list", options: KITCHEN_PROBLEM_OPTIONS,
      reactions: KITCHEN_PROBLEM_REACTIONS,
    },
    renovationStep,
  ],
  kitchenOpen: [
    { key: "layout", title: "¿Qué distribución tiene tu cocina?", subtitle: "Elige la forma que más se parece a la tuya.", type: "single", layout: "grid", options: KITCHEN_LAYOUT_OPTIONS, reactions: KITCHEN_LAYOUT_REACTIONS },
    { key: "size", title: "¿Cuántos metros cuadrados tiene la zona de cocina?", subtitle: "Un cálculo aproximado está bien.", info: "Para una cocina suelen recomendarse entre 300 y 400 lm/m². Nemul hará el cálculo automáticamente según el tamaño y la luz natural.", type: "single", layout: "grid", options: KITCHEN_SIZE_OPTIONS },
    { key: "priorities", title: "¿Qué es lo más importante para ti en la cocina?", subtitle: "Puedes elegir varias opciones.", type: "multi", layout: "list", options: KITCHEN_PRIORITY_OPTIONS },
    { key: "upperCabinets", title: "¿Tienes muebles altos?", subtitle: "Esto nos dice dónde puede faltar luz sobre la encimera.", type: "single", layout: "list", options: KITCHEN_UPPER_CABINETS_OPTIONS },
    { key: "workZone", title: "¿Dónde preparas normalmente los alimentos?", subtitle: "Así sabremos dónde reforzar la iluminación.", type: "single", layout: "list", options: KITCHEN_WORK_ZONE_OPTIONS },
    { key: "ceilingHeight", title: "¿Cuál es la altura aproximada del techo?", subtitle: "Un cálculo aproximado está bien.", type: "single", layout: "grid", options: KITCHEN_CEILING_HEIGHT_OPTIONS },
    { key: "light", title: "¿Cuánta luz natural recibe la cocina durante el día?", subtitle: "Piensa en un día normal, sin encender ninguna luz.", type: "single", layout: "list", options: LIGHT_OPTIONS },
    { key: "adjoiningStyle", title: "¿Qué ambiente tiene el salón con el que se conecta?", subtitle: "Así coordinamos la luz entre ambas zonas.", type: "single", layout: "grid", options: STYLE_OPTIONS },
    { key: "problem", title: "¿Qué te gustaría solucionar?", subtitle: "Elige lo que más se acerque a tu situación.", type: "single", layout: "list", options: KITCHEN_PROBLEM_OPTIONS, reactions: KITCHEN_PROBLEM_REACTIONS },
    renovationStep,
  ],
  bedroom: (answers = {}) => [
    lightStep,
    { key: "ceiling", title: "¿Qué tipo de techo tienes?", subtitle: "Esto determina qué soluciones de instalación son posibles.", type: "single", layout: "list", options: CEILING_OPTIONS },
    { key: "size", title: "¿Cuántos metros cuadrados tiene el dormitorio?", subtitle: "Un cálculo aproximado está bien.", info: "En un dormitorio suelen bastar entre 100 y 150 lm/m². Nemul hará el cálculo automáticamente.", type: "single", layout: "grid", options: BEDROOM_SIZE_OPTIONS },
    activityStep("bedroom", "Puedes elegir varias opciones."),
    { key: "closetType", title: "¿Tienes armario empotrado o independiente?", subtitle: "Si tienes vestidor, hazlo aparte como su propia habitación en Nemul, para un cálculo completo de ese espacio.", type: "single", layout: "list", options: BEDROOM_CLOSET_TYPE_OPTIONS, reactions: {
      empotrado: "Con armario empotrado, una luz continua arriba evitará que el interior quede en sombra.",
      independiente: "Con un armario independiente, un punto de luz cercano evitará que el propio mueble haga sombra.",
    } },
    { key: "closetLight", title: "¿Quieres iluminación dentro o delante del armario?", subtitle: "Ideal si te vistes ahí mismo.", type: "single", layout: "list", options: CLOSET_LIGHT_OPTIONS },
    problemStep("bedroom"),
    renovationStep,
  ],
  bathroom: (answers = {}) => [
    { key: "type", title: "¿Qué tipo de baño es?", subtitle: "Esto cambia cuántas zonas de luz necesitas.", type: "single", layout: "list", options: BATHROOM_TYPE_OPTIONS, reactions: {
      aseo: "Al ser un aseo, con un buen punto sobre el espejo y otro general bastará.",
      completo: "En un baño completo, vamos a diferenciar la luz del espejo, la ducha o bañera, y la general.",
    } },
    { key: "size", title: "¿Cuántos metros cuadrados tiene aproximadamente?", subtitle: "Un cálculo aproximado está bien.", info: "En un baño suelen recomendarse entre 200 y 300 lm/m². Nemul hará el cálculo automáticamente.", type: "single", layout: "grid", options: BATHROOM_SIZE_OPTIONS },
    { key: "mirrorUse", title: "¿Qué haces habitualmente delante del espejo?", subtitle: "Elige la opción principal.", type: "single", layout: "list", options: BATHROOM_MIRROR_OPTIONS },
    ...(answers.type === "aseo" ? [] : [{ key: "fixture", title: "¿Tienes ducha o bañera?", subtitle: "Cada una pide un tipo de luz distinto.", type: "single", layout: "list", options: BATHROOM_FIXTURE_OPTIONS }]),
    { key: "nightlight", title: "¿Te gustaría una luz nocturna automática?", subtitle: "Para las visitas nocturnas al baño.", type: "single", layout: "list", options: YES_NO_OPTIONS },
    lightStep,
    problemStep("bathroom"),
    renovationStep,
  ],
  dining: [
    { key: "daily", title: "¿Lo utilizas todos los días?", subtitle: "Cambia si priorizamos lo cómodo o lo decorativo.", type: "single", layout: "list", options: YES_NO_OPTIONS },
    { key: "shape", title: "¿La mesa es redonda, rectangular o cuadrada?", subtitle: "La forma cambia cómo repartimos la luz.", type: "single", layout: "list", options: DINING_SHAPE_OPTIONS, reactions: {
      redonda: "Con mesa redonda, un único punto centrado suele ser suficiente y queda muy equilibrado.",
      rectangular: "Con mesa rectangular, dos o tres puntos en línea reparten mejor la luz.",
      cuadrada: "Con mesa cuadrada, un colgante centrado o de varias luces cubre bien toda la superficie.",
    } },
    { key: "size", title: "¿Cuántos metros cuadrados tiene el comedor?", subtitle: "Un cálculo aproximado está bien.", info: "En un comedor suelen recomendarse entre 150 y 200 lm/m². Nemul hará el cálculo automáticamente.", type: "single", layout: "grid", options: DINING_SIZE_OPTIONS },
    { key: "seats", title: "¿Cuántas personas suelen comer?", subtitle: "Un cálculo aproximado está bien.", type: "single", layout: "list", options: DINING_SEATS_OPTIONS },
    { key: "pendant", title: "¿Quieres una lámpara decorativa sobre la mesa?", subtitle: "Como una lámpara colgante.", type: "single", layout: "list", options: YES_NO_OPTIONS },
    lightStep,
    problemStep("dining"),
    renovationStep,
  ],
  closet: [
    { key: "type", title: "¿Cómo son los armarios del vestidor?", subtitle: "Solo para decidir la iluminación interior del armario.", type: "single", layout: "list", options: CLOSET_TYPE_OPTIONS, reactions: {
      abierto: "Con armarios abiertos, la luz general ya alcanza la ropa; reforzaremos sobre todo el espejo, si tienes uno.",
      cerrado: "Con armarios de puertas, añadiremos luz interior en cada módulo para que no quede oscuro el fondo.",
      mixto: "Con una combinación de ambos, iluminaremos primero los módulos cerrados por dentro.",
    } },
    { key: "mirror", title: "¿Tienes o piensas instalar un espejo en el vestidor?", subtitle: "Así podremos recomendar la iluminación adecuada para esa zona.", type: "single", layout: "list", options: MIRROR_STATUS_OPTIONS, reactions: {
      tengo: "Con espejo ya instalado, evitaremos sombras iluminando desde ambos lados, no solo desde arriba.",
      planeo: "Antes de instalarlo, dejaremos previstos los puntos de luz y la instalación eléctrica en esa zona.",
      no: "Sin espejo en esta zona, la luz general uniforme del vestidor será suficiente.",
    } },
    { key: "size", title: "¿Qué superficie tiene el vestidor?", subtitle: "Esto sí cambia la iluminación general de todo el espacio.", info: "En un vestidor conviene entre 250 y 300 lm/m² para ver bien los colores. Nemul hará el cálculo automáticamente.", type: "single", layout: "grid", options: CLOSET_SIZE_OPTIONS },
    lightStep,
    problemStep("closet"),
    renovationStep,
  ],
  terrace: [
    activityStep("terrace", "Puedes elegir varias opciones."),
    { key: "covered", title: "¿Está cubierta o descubierta?", subtitle: "Esto determina qué luminarias puedes usar.", type: "single", layout: "list", options: TERRACE_COVERED_OPTIONS, reactions: {
      cubierta: "Al estar cubierta, podemos usar luminarias de interior, siempre protegidas de la humedad.",
      descubierta: "Al estar descubierta, elegiremos luminarias con certificación para exterior.",
    } },
    { key: "size", title: "¿Cuántos metros cuadrados tiene la terraza?", subtitle: "Un cálculo aproximado está bien.", info: "En una terraza suelen bastar entre 80 y 150 lm/m² de ambiente. Nemul hará el cálculo automáticamente.", type: "single", layout: "grid", options: TERRACE_SIZE_OPTIONS },
    { key: "night", title: "¿La usas principalmente de noche?", subtitle: "Cambia cuánto peso le damos a la luz artificial.", type: "single", layout: "list", options: YES_NO_OPTIONS },
    lightStep,
    problemStep("terrace"),
    renovationStep,
  ],
  hallway: [
    { key: "length", title: "¿Qué longitud tiene aproximadamente?", subtitle: "Un cálculo aproximado está bien.", type: "single", layout: "grid", options: HALLWAY_LENGTH_OPTIONS, reactions: {
      corto: "Al ser corto, un único punto centrado probablemente sea suficiente.",
      medio: "Con longitud media, repartiremos dos puntos para no dejar zonas oscuras.",
      largo: "Al ser largo, repartiremos varios puntos a lo largo del recorrido.",
    } },
    { key: "light", title: "¿Tiene luz natural?", subtitle: "Piensa en un día normal, sin encender ninguna luz.", type: "single", layout: "list", options: LIGHT_OPTIONS },
    { key: "sensor", title: "¿Quieres sensor de movimiento?", subtitle: "Ideal para pasillos que se cruzan de paso.", type: "single", layout: "list", options: HALLWAY_SENSOR_OPTIONS },
    { key: "connects", title: "¿Conecta muchas habitaciones?", subtitle: "Cuantas más conecte, más se usará.", type: "single", layout: "list", options: YES_NO_OPTIONS },
    problemStep("hallway"),
    renovationStep,
  ],
  office: [
    { key: "deskPosition", title: "¿Dónde está el escritorio respecto a la ventana?", subtitle: "Esto determina el riesgo de reflejos en la pantalla.", type: "single", layout: "list", options: DESK_POSITION_OPTIONS, reactions: {
      frente: "Con el escritorio frente a la ventana, cuidaremos que la luz no te deslumbre al mirar la pantalla.",
      espaldas: "De espaldas a la ventana, evitaremos que la luz se refleje en tu pantalla.",
      lateral: "De lado a la ventana, es la posición más equilibrada: aprovechamos la luz sin deslumbrar ni generar reflejos.",
      sinVentana: "Sin ventana cerca, la luz artificial va a tener que cubrir todo el trabajo por sí sola.",
    } },
    { key: "size", title: "¿Cuántos metros cuadrados tiene el despacho?", subtitle: "Un cálculo aproximado está bien.", info: "Para trabajar con pantallas y papeleo suelen recomendarse entre 300 y 400 lm/m². Nemul hará el cálculo automáticamente.", type: "single", layout: "grid", options: OFFICE_SIZE_OPTIONS },
    { key: "light", title: "¿Cuánta luz natural recibe durante el día?", subtitle: "Piensa en un día normal, sin encender ninguna luz.", type: "single", layout: "list", options: LIGHT_OPTIONS },
    { key: "videoCalls", title: "¿Haces videollamadas con frecuencia?", subtitle: "Para adaptar la iluminación de tu zona de trabajo.", type: "single", layout: "list", options: YES_NO_OPTIONS },
    problemStep("office"),
    renovationStep,
  ],
};

function getFlowForRoom(roomId, answers) {
  const flow = ROOM_FLOWS[roomId];
  return typeof flow === "function" ? flow(answers || {}) : flow;
}

function getReport(roomId, answers = {}) {
  const parts = [];
  if (roomId === "hallway") {
    if (HALLWAY_LENGTH_INSIGHT[answers.length]) parts.push(HALLWAY_LENGTH_INSIGHT[answers.length]);
    if (LIGHT_INSIGHT[answers.light]) parts.push(LIGHT_INSIGHT[answers.light]);
    if (HALLWAY_SENSOR_INSIGHT[answers.sensor]) parts.push(HALLWAY_SENSOR_INSIGHT[answers.sensor]);
  } else {
    if (roomId === "closet" && CLOSET_TYPE_INSIGHT[answers.type]) parts.push(CLOSET_TYPE_INSIGHT[answers.type]);
    (answers.activities || []).forEach((a) => {
      const dict = ACTIVITY_INSIGHT[roomId] || {};
      if (dict[a]) parts.push(dict[a]);
    });
    if (LIGHT_INSIGHT[answers.light]) parts.push(LIGHT_INSIGHT[answers.light]);
  }
  if (CEILING_INSIGHT[answers.ceiling]) parts.push(CEILING_INSIGHT[answers.ceiling]);
  const extra = EXTRA_INSIGHT[roomId];
  if (extra) {
    Object.keys(extra).forEach((key) => {
      const val = answers[key];
      if (val && extra[key][val]) parts.push(extra[key][val]);
    });
  }
  const problemDict = PROBLEM_INSIGHT[roomId] || {};
  if (problemDict[answers.problem]) parts.push(problemDict[answers.problem]);
  if (RENOVATION_INSIGHT[answers.renovationStatus]) parts.push(RENOVATION_INSIGHT[answers.renovationStatus]);
  if (parts.length === 0) parts.push("Con lo que nos cuentes de este espacio, Nemul preparará una propuesta de iluminación a medida.");
  return parts;
}

function formatDate(d) {
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-6 pt-3 pb-1 font-body text-[13px]" style={{ color: COLORS.text }}>
      <span className="font-medium">9:41</span>
      <div className="flex items-center gap-1">
        <div className="w-4 h-2.5 rounded-[2px] border" style={{ borderColor: COLORS.text }} />
      </div>
    </div>
  );
}

function HomeIndicator() {
  return (
    <div className="flex justify-center pt-2 pb-2">
      <div className="w-32 h-1 rounded-full" style={{ backgroundColor: COLORS.text, opacity: 0.25 }} />
    </div>
  );
}

function TopNav({ onBack, step, total, eyebrow }) {
  return (
    <div className="px-6 pt-2 pb-3">
      <div className="flex items-center justify-between mb-2">
        <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center transition-colors" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
          <ArrowLeft size={16} color={COLORS.text} />
        </button>
        {total ? (
          <div className="flex items-center gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
              <div key={i} className="rounded-full transition-all duration-300" style={{ width: i === step ? 18 : 6, height: 6, backgroundColor: i <= step ? COLORS.accent : COLORS.border }} />
            ))}
          </div>
        ) : <div className="w-9" />}
        <div className="w-9" />
      </div>
      {eyebrow && <p className="font-body text-[13px] tracking-[0.15em] uppercase text-center" style={{ color: COLORS.subtext }}>{eyebrow}</p>}
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="tap-scale w-full font-body font-medium text-[15px] tracking-wide rounded-2xl py-4 transition-all duration-200"
      style={{
        background: disabled ? COLORS.border : `linear-gradient(135deg, #7C6A56 0%, ${COLORS.primary} 55%, #5E4F41 100%)`,
        color: disabled ? COLORS.subtext : "#FFFFFF",
        boxShadow: disabled ? "none" : "0 8px 20px rgba(111,94,77,0.3)",
      }}
    >
      {children}
    </button>
  );
}

function OptionRow({ selected, onClick, Icon, label, hint, multi, delay = 0 }) {
  return (
    <button
      onClick={onClick}
      className="option-in tap-scale w-full flex items-center gap-4 rounded-2xl px-5 py-4 text-left"
      style={{ backgroundColor: COLORS.card, border: `1.5px solid ${selected ? COLORS.accent : COLORS.border}`, boxShadow: selected ? "0 6px 18px rgba(193,161,107,0.20)" : "0 2px 10px rgba(46,42,39,0.04)", animationDelay: `${delay}ms` }}
    >
      {Icon && (
        <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: selected ? "linear-gradient(135deg, #F3E9D8, #EAD9BC)" : COLORS.bg }}>
          <Icon size={19} color={selected ? COLORS.accent : COLORS.subtext} strokeWidth={1.6} />
        </div>
      )}
      <div className="flex-1">
        <p className="font-body text-[14.5px] font-medium" style={{ color: COLORS.text }}>{label}</p>
        {hint && <p className="font-body text-[14px] mt-0.5" style={{ color: COLORS.subtext }}>{hint}</p>}
      </div>
      <div
        className={`w-5 h-5 flex items-center justify-center shrink-0 transition-all duration-200 ${multi ? "rounded-[6px]" : "rounded-full"}`}
        style={{ backgroundColor: selected ? COLORS.accent : "transparent", border: `1.5px solid ${selected ? COLORS.accent : COLORS.border}` }}
      >
        {selected && <Check size={11} color="#FFFFFF" strokeWidth={3} className="check-pop" />}
      </div>
    </button>
  );
}

function WelcomeScreen({ onStart }) {
  return (
    <div className="flex flex-col h-full px-7 pt-8 pb-8 rise-in">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <img src="/logo.png" alt="Nemul" className="h-28 w-auto mb-6" />
        <h1 className="font-display text-[34px] leading-[1.15] font-medium mb-4" style={{ color: COLORS.text }}>Iluminemos<br />tu hogar</h1>
        <p className="font-body text-[14.5px] leading-relaxed max-w-[280px]" style={{ color: COLORS.subtext }}>
          Cuéntanos cómo vives cada espacio. Nosotros nos encargamos de la parte técnica.
        </p>
      </div>
      <PrimaryButton onClick={onStart}>Comenzar</PrimaryButton>
    </div>
  );
}

// Endpoint real de Formspree de Dayami: los emails de interés en Premium
// llegan directamente a digitaldma2026@gmail.com.
const PREMIUM_INTEREST_FORM_ENDPOINT = "https://formspree.io/f/mjgnwwbw";

function PremiumGateScreen({ freeRoomLabel, onBack, onContinueFree }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || sending) return;
    setSending(true);
    setError(false);
    try {
      const res = await fetch(PREMIUM_INTEREST_FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email, interes: "Premium Nemul", habitacion_gratuita: freeRoomLabel }),
      });
      if (!res.ok) throw new Error("request failed");
      setSubmitted(true);
      track("premium_interest_submitted");
      gaEvent("premium_interest_submitted");
    } catch (e) {
      setError(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full rise-in">
      <TopNav onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-7">
        <div className="text-center mb-6 pt-2">
          <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "#F3E9D8" }}>
            <Lock size={22} color={COLORS.accent} strokeWidth={1.8} />
          </div>
          <p className="font-body text-[13.5px] tracking-[0.2em] uppercase mb-2" style={{ color: COLORS.accent }}>Premium</p>
          <h2 className="font-display text-[26px] font-medium mb-2" style={{ color: COLORS.text }}>Desbloquea toda tu vivienda</h2>
          <p className="font-body text-[14px] leading-relaxed" style={{ color: COLORS.subtext }}>
            Ya probaste {freeRoomLabel} gratis. El resto de habitaciones forman parte de Premium.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 mb-6">
          {["Toda la vivienda", "Informe en PDF", "Recomendaciones avanzadas"].map((f) => (
            <div key={f} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#EEF0EA" }}>
                <Check size={12} color={COLORS.success} strokeWidth={3} />
              </div>
              <span className="font-body text-[14px] font-medium" style={{ color: COLORS.text }}>{f}</span>
            </div>
          ))}
        </div>

        {!submitted ? (
          <div className="rounded-2xl p-5" style={{ backgroundColor: "#F3E9D8", border: `1px solid #C1A16B55` }}>
            <p className="font-body text-[13px] leading-relaxed mb-3" style={{ color: COLORS.text }}>
              Premium todavía no está activo. Déjanos tu email y te avisamos en cuanto esté disponible.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full rounded-xl px-4 py-3 mb-3 font-body text-[14px]"
              style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
            />
            <PrimaryButton onClick={handleSubmit} disabled={!email.trim() || sending}>
              {sending ? "Enviando..." : "Avísame cuando esté listo"}
            </PrimaryButton>
            {error && (
              <p className="font-body text-[12.5px] mt-2 text-center" style={{ color: COLORS.warning }}>
                No se pudo enviar. Vuelve a intentarlo en un momento.
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-2xl p-5 text-center" style={{ backgroundColor: "#EEF0EA" }}>
            <Check size={20} color={COLORS.success} strokeWidth={2.5} className="mx-auto mb-2" />
            <p className="font-body text-[14px] font-medium" style={{ color: COLORS.text }}>¡Listo! Te avisaremos en cuanto Premium esté disponible.</p>
          </div>
        )}
      </div>
      <div className="px-7 pt-3 pb-1">
        <button onClick={onContinueFree} className="w-full font-body text-[13.5px] font-medium py-2 flex items-center justify-center gap-1" style={{ color: COLORS.subtext }}>
          Seguir explorando {freeRoomLabel}
        </button>
      </div>
    </div>
  );
}

function RoomsScreen({ selected, toggle, onContinue, onBack, freeRoomId }) {
  return (
    <div className="flex flex-col h-full rise-in">
      <TopNav onBack={onBack} />
      <div className="px-7 pb-4">
        <h2 className="font-display text-[26px] font-medium mb-1.5" style={{ color: COLORS.text }}>¿Qué espacio?</h2>
        <p className="font-body text-[13.5px]" style={{ color: COLORS.subtext }}>
          {freeRoomId
            ? "Tu habitación gratuita ya está elegida. El resto son parte de Premium."
            : "Elige el espacio para el que quieras planear la iluminación. La primera es gratis."}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto px-7">
        <div className="grid grid-cols-2 gap-3 pb-3">
          {ROOMS.map(({ id, label, Icon }, i) => {
            const isSelected = selected.includes(id);
            const isLocked = freeRoomId && freeRoomId !== id;
            return (
              <button
                key={id}
                onClick={() => toggle(id)}
                className="option-in tap-scale relative flex flex-col items-center justify-center gap-3 rounded-2xl py-6 px-3"
                style={{ backgroundColor: COLORS.card, border: `1.5px solid ${isSelected ? COLORS.accent : COLORS.border}`, boxShadow: isSelected ? "0 6px 18px rgba(193,161,107,0.20)" : "0 2px 10px rgba(46,42,39,0.04)", animationDelay: `${i * 40}ms` }}
              >
                {isLocked && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: "#F3E9D8" }}>
                    <Lock size={10} color={COLORS.accent} strokeWidth={2} />
                  </div>
                )}
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: isSelected ? "linear-gradient(135deg, #F3E9D8, #EAD9BC)" : COLORS.bg, opacity: isLocked ? 0.6 : 1 }}>
                  <Icon size={20} color={isSelected ? COLORS.accent : COLORS.subtext} strokeWidth={1.5} />
                </div>
                <span className="font-body text-[14px] font-medium text-center leading-tight" style={{ color: isLocked ? COLORS.subtext : COLORS.text }}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="px-7 pt-3 pb-1">
        <PrimaryButton onClick={onContinue} disabled={selected.length === 0}>Continuar</PrimaryButton>
      </div>
    </div>
  );
}

function QuestionScreen({ step, value, onSelect, onContinue, onBack, stepIndex, total, eyebrow }) {
  const isMulti = step.type === "multi";
  const isAnswered = isMulti ? (value || []).length > 0 : !!value;
  const [showInfo, setShowInfo] = useState(false);
  return (
    <div className="flex flex-col h-full rise-in">
      <TopNav onBack={onBack} step={stepIndex} total={total} eyebrow={eyebrow} />
      <div className="px-7 pb-5 pt-1">
        <h2 className="font-display text-[25px] font-medium mb-1.5" style={{ color: COLORS.text }}>{step.title}</h2>
        <div className="flex items-center gap-1.5">
          <p className="font-body text-[13.5px]" style={{ color: COLORS.subtext }}>{step.subtitle}</p>
          {step.info && (
            <button
              onClick={() => setShowInfo((s) => !s)}
              className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: showInfo ? COLORS.accent : COLORS.border }}
              aria-label="Más información"
            >
              <Info size={10} color={showInfo ? "#FFFFFF" : COLORS.subtext} strokeWidth={2.5} />
            </button>
          )}
        </div>
        {step.info && showInfo && (
          <p className="font-body text-[14px] leading-relaxed mt-2 rounded-xl p-3" style={{ color: COLORS.subtext, backgroundColor: COLORS.bg }}>
            {step.info}
          </p>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-7">
        {step.layout === "list" && (
          <div className="flex flex-col gap-3">
            {step.options.map((opt, i) => {
              const selected = isMulti ? (value || []).includes(opt.id) : value === opt.id;
              return <OptionRow key={opt.id} selected={selected} onClick={() => onSelect(opt.id)} Icon={opt.Icon} label={opt.label} hint={opt.hint} multi={isMulti} delay={i * 45} />;
            })}
          </div>
        )}
        {step.layout === "grid" && (
          <div className="grid grid-cols-2 gap-3">
            {step.options.map((opt, i) => {
              const selected = isMulti ? (value || []).includes(opt.id) : value === opt.id;
              const { Icon } = opt;
              return (
                <button
                  key={opt.id}
                  onClick={() => onSelect(opt.id)}
                  className="option-in tap-scale rounded-2xl py-5 px-3 text-center flex flex-col items-center gap-2"
                  style={{ backgroundColor: COLORS.card, border: `1.5px solid ${selected ? COLORS.accent : COLORS.border}`, boxShadow: selected ? "0 6px 18px rgba(193,161,107,0.20)" : "0 2px 10px rgba(46,42,39,0.04)", animationDelay: `${i * 45}ms` }}
                >
                  {Icon && (
                    <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: selected ? "linear-gradient(135deg, #F3E9D8, #EAD9BC)" : COLORS.bg }}>
                      <Icon size={16} color={selected ? COLORS.accent : COLORS.subtext} strokeWidth={1.6} />
                    </div>
                  )}
                  <p className="font-body text-[14.5px] font-medium" style={{ color: COLORS.text }}>{opt.label}</p>
                  {opt.hint && <p className="font-body text-[13px]" style={{ color: COLORS.subtext }}>{opt.hint}</p>}
                </button>
              );
            })}
          </div>
        )}
      </div>
      {!isMulti && step.reactions && value && step.reactions[value] && (
        <div className="px-7 pb-2 rise-in">
          <div className="flex items-start gap-2.5 rounded-xl px-4 py-3" style={{ backgroundColor: "#F3E9D8" }}>
            <Sparkles size={14} color={COLORS.accent} strokeWidth={1.8} className="mt-0.5 shrink-0" />
            <p className="font-body text-[13px] leading-relaxed italic" style={{ color: COLORS.primary }}>
              {step.reactions[value]}
            </p>
          </div>
        </div>
      )}
      <div className="px-7 pt-4 pb-1">
        <PrimaryButton onClick={onContinue} disabled={!isAnswered}>Continuar</PrimaryButton>
      </div>
    </div>
  );
}

function RoomDoneScreen({ roomLabel, RoomIcon, nextLabel, onContinue }) {
  return (
    <div className="flex flex-col h-full px-7 pt-10 pb-8 rise-in">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: "#EEF0EA" }}>
          <Check size={26} color={COLORS.success} strokeWidth={2} />
        </div>
        <p className="font-body text-[13.5px] tracking-[0.2em] uppercase mb-2" style={{ color: COLORS.accent }}>{roomLabel} listo</p>
        <h2 className="font-display text-[26px] font-medium mb-3" style={{ color: COLORS.text }}>Muy bien</h2>
        <p className="font-body text-[14px] leading-relaxed max-w-[260px]" style={{ color: COLORS.subtext }}>
          El plan de iluminación de tu {roomLabel.toLowerCase()} está listo. Sigamos con el siguiente espacio.
        </p>
        <div className="flex items-center gap-3 mt-8 rounded-2xl px-5 py-3" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
          {RoomIcon && <RoomIcon size={18} color={COLORS.accent} strokeWidth={1.6} />}
          <span className="font-body text-[13.5px] font-medium" style={{ color: COLORS.text }}>Siguiente: {nextLabel}</span>
        </div>
      </div>
      <PrimaryButton onClick={onContinue}>Continuar a {nextLabel}</PrimaryButton>
    </div>
  );
}

// Traduce cada respuesta guardada a una línea legible, usando las mismas
// etiquetas que ya se mostraron en cada pregunta (nunca ids ni datos crudos).
function summarizeAnswers(flow, answers) {
  return flow.map((step, index) => {
    const raw = answers[step.key];
    let text;
    if (step.type === "multi") {
      const ids = raw || [];
      const labels = ids.map((id) => step.options.find((o) => o.id === id)?.label).filter(Boolean);
      text = labels.length ? labels.join(", ") : "Ninguna opción seleccionada";
    } else {
      const opt = step.options.find((o) => o.id === raw);
      text = opt ? opt.label : "Sin respuesta";
    }
    return { index, title: step.title, text };
  });
}

function ReviewScreen({ room, summary, onEdit, onConfirm, onBack }) {
  return (
    <div className="flex flex-col h-full rise-in">
      <TopNav onBack={onBack} />
      <div className="px-7 pb-4">
        <p className="font-body text-[13.5px] tracking-[0.2em] uppercase mb-2" style={{ color: COLORS.accent }}>{room.label}</p>
        <h2 className="font-display text-[26px] font-medium mb-1.5" style={{ color: COLORS.text }}>Antes de continuar</h2>
        <p className="font-body text-[13.5px]" style={{ color: COLORS.subtext }}>Revisa que todo esté correcto. Toca cualquier respuesta para cambiarla.</p>
      </div>
      <div className="flex-1 overflow-y-auto px-7">
        <div className="flex flex-col gap-2.5 pb-4">
          {summary.map((item) => (
            <button
              key={item.index}
              onClick={() => onEdit(item.index)}
              className="w-full flex items-center gap-3 rounded-2xl p-4 text-left transition-all duration-200"
              style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: "0 2px 10px rgba(46,42,39,0.04)" }}
            >
              <div className="flex-1 min-w-0">
                <p className="font-body text-[13px]" style={{ color: COLORS.subtext }}>{item.title}</p>
                <p className="font-body text-[13.5px] font-medium mt-0.5" style={{ color: COLORS.text }}>{item.text}</p>
              </div>
              <Pencil size={15} color={COLORS.subtext} strokeWidth={1.8} className="shrink-0" />
            </button>
          ))}
        </div>
      </div>
      <div className="px-7 pt-3 pb-1">
        <PrimaryButton onClick={onConfirm}>Confirmar y ver mi informe</PrimaryButton>
      </div>
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#EEF0EA" }}>
        <Check size={12} color={COLORS.success} strokeWidth={3} />
      </div>
      <p className="font-body text-[13.5px]" style={{ color: COLORS.text }}>
        <span style={{ color: COLORS.subtext }}>{label}: </span>
        <span className="font-medium">{value}</span>
      </p>
    </div>
  );
}

function MistakesList({ mistakes }) {
  return (
    <div>
      <p className="font-body text-[13px] tracking-[0.12em] uppercase mb-2.5" style={{ color: COLORS.warning }}>Errores que debes evitar</p>
      <div className="flex flex-col gap-2">
        {mistakes.map((m, i) => (
          <div key={i} className="option-in flex items-start gap-3 rounded-xl p-3.5" style={{ backgroundColor: "#FBF1EC", border: "1px solid #F0D9CE", animationDelay: `${i * 60}ms` }}>
            <X size={15} color={COLORS.warning} strokeWidth={2.2} className="mt-0.5 shrink-0" />
            <p className="font-body text-[14px] leading-relaxed" style={{ color: COLORS.text }}>{m}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Transparencia sin tecnicismo: el usuario ve de dónde sale el número,
// sin que nadie le explique una fórmula.
function CalculationBlock({ area, lux, lumens, downlightsLow, downlightsHigh }) {
  return (
    <div>
      <p className="font-body text-[13px] tracking-[0.12em] uppercase mb-2.5" style={{ color: COLORS.accent }}>Cálculo realizado</p>
      <div className="flex flex-col gap-3 rounded-xl p-4" style={{ backgroundColor: COLORS.bg }}>
        <StatRow label="Superficie" value={`${area} m²`} />
        <div>
          <StatRow label="Nivel de iluminación recomendado" value={`${lux} lm/m²`} />
          <p className="font-body text-[13.5px] italic mt-1 ml-9" style={{ color: COLORS.subtext }}>{describeLux(lux)}</p>
        </div>
        <StatRow label="Iluminación total necesaria" value={`${lumens.toLocaleString("es-ES")} lúmenes`} />
        <div>
          <StatRow label="Downlights recomendados" value={`${downlightsLow}–${downlightsHigh} × ${LUMENS_PER_DOWNLIGHT} lm`} />
          <p className="font-body text-[13.5px] italic mt-1 ml-9" style={{ color: COLORS.subtext }}>
            Equivale a downlights LED de unos {WATTS_PER_DOWNLIGHT}W cada uno, el estándar más habitual en casa.
          </p>
        </div>
      </div>
      <p className="font-body text-[12.5px] leading-relaxed mt-2.5" style={{ color: COLORS.subtext }}>
        La cantidad de luminarias se calcula según los m² de la estancia, el nivel de iluminación recomendado y el flujo luminoso de cada downlight. La recomendación es orientativa y puede ajustarse al diseño final.
      </p>
    </div>
  );
}


// La terraza no tiene una forma predecible (L, rincón, alargada...), así que en
// vez de fingir un plano, mostramos las zonas a iluminar sueltas, sin contorno.
function TerraceZoneScheme({ activities = [], covered, night }) {
  const ZONE_META = {
    eat: { Icon: UtensilsCrossed, label: "Zona de mesa" },
    relax: { Icon: Wind, label: "Rincón de relax" },
    read: { Icon: BookOpen, label: "Rincón de lectura" },
    plants: { Icon: TreePine, label: "Junto a las plantas" },
    gatherings: { Icon: Users, label: "Zona de encuentro" },
  };
  const zones = activities.map((a) => ZONE_META[a]).filter(Boolean);

  return (
    <div>
      {zones.length > 0 ? (
        <div className="flex flex-wrap justify-center gap-4 py-1">
          {zones.map((z, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5" style={{ width: 76 }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "#F3E9D8" }}>
                <z.Icon size={20} color={COLORS.accent} strokeWidth={1.6} />
              </div>
              <span className="font-body text-[13px] text-center leading-tight" style={{ color: COLORS.text }}>{z.label}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="font-body text-[14px] text-center" style={{ color: COLORS.subtext }}>Cuéntanos cómo usas la terraza para ver aquí sus zonas de luz.</p>
      )}

      {(covered === "descubierta" || night === "si") && (
        <div className="flex flex-col gap-1.5 mt-3">
          {covered === "descubierta" && (
            <div className="flex items-center gap-2 justify-center">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#F4B942" }} />
              <span className="font-body text-[13px]" style={{ color: COLORS.subtext }}>Luminarias aptas para exterior (IP44 o superior)</span>
            </div>
          )}
          {night === "si" && (
            <div className="flex items-center gap-2 justify-center">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#F4B942" }} />
              <span className="font-body text-[13px]" style={{ color: COLORS.subtext }}>Prioriza calidez y luz regulable</span>
            </div>
          )}
        </div>
      )}

      <p className="font-body text-[14px] text-center mt-2.5 leading-relaxed" style={{ color: COLORS.subtext }}>
        Sin plano fijo: cada terraza tiene una forma distinta. Estas son las zonas a iluminar según cómo la usas.
      </p>
    </div>
  );
}

function TechnicalReportCard({ room, answers, expanded, onToggle }) {
  const { tempK, lumens, downlightsLow, downlightsHigh, area, lux, tips, mistakes } = generateLivingReport(answers);
  const { Icon } = room;
  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: "0 2px 12px rgba(46,42,39,0.05)" }}>
      <button onClick={onToggle} className="w-full flex items-center gap-4 p-5 text-left">
        <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#F3E9D8" }}>
          <Icon size={19} color={COLORS.accent} strokeWidth={1.6} />
        </div>
        <div className="flex-1">
          <p className="font-body text-[14.5px] font-medium" style={{ color: COLORS.text }}>{room.label}</p>
          <p className="font-body text-[14px]" style={{ color: COLORS.subtext }}>Estudio de iluminación</p>
        </div>
        <ChevronDown size={16} color={COLORS.subtext} style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
      </button>
      {expanded && (
        <div className="px-5 pb-5 flex flex-col gap-5">
          <div>
            <p className="font-body text-[13px] tracking-[0.12em] uppercase mb-2.5" style={{ color: COLORS.accent }}>Recomendación general</p>
            <div className="flex flex-col gap-2 rounded-xl p-4" style={{ backgroundColor: COLORS.bg }}>
              <StatRow label="Temperatura de color" value={`${tempK} K`} />
              <p className="font-body text-[13.5px] italic mt-1" style={{ color: COLORS.subtext }}>{describeTempK(tempK)}</p>
            </div>
          </div>

          <CalculationBlock area={area} lux={lux} lumens={lumens} downlightsLow={downlightsLow} downlightsHigh={downlightsHigh} />

          <div>
            <p className="font-body text-[13px] tracking-[0.12em] uppercase mb-2.5" style={{ color: COLORS.accent }}>Recomendaciones personalizadas</p>
            <div className="flex flex-col gap-2">
              {tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl p-3.5" style={{ backgroundColor: COLORS.bg }}>
                  <Lightbulb size={15} color={COLORS.accent} strokeWidth={1.8} className="mt-0.5 shrink-0" />
                  <p className="font-body text-[14px] leading-relaxed" style={{ color: COLORS.text }}>{tip}</p>
                </div>
              ))}
            </div>
          </div>

          <MistakesList mistakes={mistakes} />
        </div>
      )}
    </div>
  );
}

function KitchenReportCard({ room, answers, expanded, onToggle }) {
  const { tempK, lumens, downlightsLow, downlightsHigh, area, lux, distribution, narrative, mistakes } = generateKitchenReport(answers);
  const { Icon } = room;
  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: "0 2px 12px rgba(46,42,39,0.05)" }}>
      <button onClick={onToggle} className="w-full flex items-center gap-4 p-5 text-left">
        <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#F3E9D8" }}>
          <Icon size={19} color={COLORS.accent} strokeWidth={1.6} />
        </div>
        <div className="flex-1">
          <p className="font-body text-[14.5px] font-medium" style={{ color: COLORS.text }}>{room.label}</p>
          <p className="font-body text-[14px]" style={{ color: COLORS.subtext }}>Estudio de iluminación</p>
        </div>
        <ChevronDown size={16} color={COLORS.subtext} style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
      </button>
      {expanded && (
        <div className="px-5 pb-5 flex flex-col gap-5">
          <div>
            <p className="font-body text-[13px] tracking-[0.12em] uppercase mb-2.5" style={{ color: COLORS.accent }}>Recomendación general</p>
            <div className="flex flex-col gap-2 rounded-xl p-4" style={{ backgroundColor: COLORS.bg }}>
              <StatRow label="Temperatura de color" value={`${tempK} K`} />
              <p className="font-body text-[13.5px] italic mt-1" style={{ color: COLORS.subtext }}>{describeTempK(tempK)}</p>
              <StatRow label="Separación entre downlights" value="1,20–1,50 m" />
            </div>
          </div>

          <CalculationBlock area={area} lux={lux} lumens={lumens} downlightsLow={downlightsLow} downlightsHigh={downlightsHigh} />

          <div>
            <p className="font-body text-[13px] tracking-[0.12em] uppercase mb-2.5" style={{ color: COLORS.accent }}>📍 Distribución recomendada de los focos</p>
            <div className="flex flex-col gap-2">
              {distribution.map((line, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl p-3.5" style={{ backgroundColor: COLORS.bg }}>
                  <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ backgroundColor: COLORS.accent }} />
                  <p className="font-body text-[14px] leading-relaxed" style={{ color: COLORS.text }}>{line}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="font-body text-[13px] tracking-[0.12em] uppercase mb-2.5" style={{ color: COLORS.accent }}>Recomendación de diseño</p>
            <div className="rounded-xl p-4" style={{ backgroundColor: COLORS.bg }}>
              <p className="font-body text-[13px] leading-relaxed" style={{ color: COLORS.text }}>{narrative}</p>
            </div>
          </div>

          <MistakesList mistakes={mistakes} />
        </div>
      )}
    </div>
  );
}

function RoomReportCard({ room, answers, expanded, onToggle }) {
  const insights = getReport(room.id, answers);
  const { Icon } = room;
  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: "0 2px 12px rgba(46,42,39,0.05)" }}>
      <button onClick={onToggle} className="w-full flex items-center gap-4 p-5 text-left">
        <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#F3E9D8" }}>
          <Icon size={19} color={COLORS.accent} strokeWidth={1.6} />
        </div>
        <div className="flex-1">
          <p className="font-body text-[14.5px] font-medium" style={{ color: COLORS.text }}>{room.label}</p>
          <p className="font-body text-[14px]" style={{ color: COLORS.subtext }}>Informe de diseño · {insights.length} recomendaciones</p>
        </div>
        <ChevronDown size={16} color={COLORS.subtext} style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
      </button>
      {expanded && (
        <div className="px-5 pb-5 flex flex-col gap-3">
          {insights.map((text, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl p-3.5" style={{ backgroundColor: COLORS.bg }}>
              <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ backgroundColor: COLORS.accent }} />
              <p className="font-body text-[14px] leading-relaxed" style={{ color: COLORS.text }}>{text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GenericTechnicalReportCard({ room, answers, expanded, onToggle }) {
  const { tempK, lumens, downlightsLow, downlightsHigh, area, lux, tips, mistakes } = generateGenericTechnicalReport(room.id, answers);
  const { Icon } = room;
  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: "0 2px 12px rgba(46,42,39,0.05)" }}>
      <button onClick={onToggle} className="w-full flex items-center gap-4 p-5 text-left">
        <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#F3E9D8" }}>
          <Icon size={19} color={COLORS.accent} strokeWidth={1.6} />
        </div>
        <div className="flex-1">
          <p className="font-body text-[14.5px] font-medium" style={{ color: COLORS.text }}>{room.label}</p>
          <p className="font-body text-[14px]" style={{ color: COLORS.subtext }}>Estudio de iluminación</p>
        </div>
        <ChevronDown size={16} color={COLORS.subtext} style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
      </button>
      {expanded && (
        <div className="px-5 pb-5 flex flex-col gap-5">
          <div>
            <p className="font-body text-[13px] tracking-[0.12em] uppercase mb-2.5" style={{ color: COLORS.accent }}>Recomendación general</p>
            <div className="flex flex-col gap-2 rounded-xl p-4" style={{ backgroundColor: COLORS.bg }}>
              <StatRow label="Temperatura de color" value={`${tempK} K`} />
              <p className="font-body text-[13.5px] italic mt-1" style={{ color: COLORS.subtext }}>{describeTempK(tempK)}</p>
            </div>
          </div>

          <CalculationBlock area={area} lux={lux} lumens={lumens} downlightsLow={downlightsLow} downlightsHigh={downlightsHigh} />

          {room.id === "terrace" && (
            <div>
              <p className="font-body text-[13px] tracking-[0.12em] uppercase mb-2.5" style={{ color: COLORS.accent }}>Zonas a iluminar</p>
              <div className="rounded-xl p-4" style={{ backgroundColor: COLORS.bg }}>
                <TerraceZoneScheme activities={answers.activities} covered={answers.covered} night={answers.night} />
              </div>
            </div>
          )}

          <div>
            <p className="font-body text-[13px] tracking-[0.12em] uppercase mb-2.5" style={{ color: COLORS.accent }}>Recomendaciones personalizadas</p>
            <div className="flex flex-col gap-2">
              {tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl p-3.5" style={{ backgroundColor: COLORS.bg }}>
                  <Lightbulb size={15} color={COLORS.accent} strokeWidth={1.8} className="mt-0.5 shrink-0" />
                  <p className="font-body text-[14px] leading-relaxed" style={{ color: COLORS.text }}>{tip}</p>
                </div>
              ))}
            </div>
          </div>

          <MistakesList mistakes={mistakes} />
        </div>
      )}
    </div>
  );
}

const GENERIC_TECH_ROOMS = ["bedroom", "bathroom", "dining", "closet", "terrace", "office"];

function ReportCard({ room, answers, expanded, onToggle }) {
  if (room.id === "living" || room.id === "livingDining") return <TechnicalReportCard room={room} answers={answers} expanded={expanded} onToggle={onToggle} />;
  if (room.id === "kitchen" || room.id === "kitchenOpen") return <KitchenReportCard room={room} answers={answers} expanded={expanded} onToggle={onToggle} />;
  if (GENERIC_TECH_ROOMS.includes(room.id)) return <GenericTechnicalReportCard room={room} answers={answers} expanded={expanded} onToggle={onToggle} />;
  return <RoomReportCard room={room} answers={answers} expanded={expanded} onToggle={onToggle} />;
}

function GuidePromoCard() {
  return (
    <div className="rounded-2xl p-5" style={{ backgroundColor: "#F3E9D8", border: `1px solid #C1A16B55` }}>
      <p className="font-body text-[14px] tracking-[0.15em] uppercase mb-3" style={{ color: COLORS.primary }}>¿Quieres ir un paso más allá?</p>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: COLORS.card }}>
          <BookOpen size={19} color={COLORS.accent} strokeWidth={1.6} />
        </div>
        <div>
          <p className="font-display text-[17px] font-medium leading-tight" style={{ color: COLORS.text }}>Guía Profesional de Iluminación</p>
          <p className="font-body text-[14px] leading-relaxed mt-1.5" style={{ color: COLORS.subtext }}>
            Aprende a iluminar cualquier estancia como un profesional, con ejemplos reales y consejos prácticos.
          </p>
        </div>
      </div>
      <a
        href="https://www.etsy.com/es/listing/4427720777/guia-de-iluminacion-del-hogar-consejos?ref=share_ios_native_control"
        target="_blank"
        rel="noopener noreferrer"
        className="tap-scale w-full flex items-center justify-center font-body font-medium text-[14px] rounded-xl py-3.5 transition-all duration-200"
        style={{ background: `linear-gradient(135deg, #7C6A56 0%, ${COLORS.primary} 55%, #5E4F41 100%)`, color: "#FFFFFF", boxShadow: "0 8px 20px rgba(111,94,77,0.25)" }}
      >
        Ver la guía en Etsy
      </a>
    </div>
  );
}

function LegalNote() {
  return (
    <p className="font-body text-[12px] leading-relaxed text-center px-3" style={{ color: COLORS.subtext }}>
      Estas recomendaciones son orientativas. Para la instalación eléctrica, consulta siempre a un profesional certificado.
    </p>
  );
}

// Versión "para imprimir": las mismas tarjetas de informe, siempre abiertas
// del todo, renderizadas fuera de pantalla para capturarlas como imagen.
function PrintableReport({ rooms, answersByRoom }) {
  return (
    <div style={{ width: 700 }} className="bg-white p-10">
      <div className="text-center mb-8">
        <p className="font-body text-[13px] tracking-[0.2em] uppercase mb-2" style={{ color: COLORS.accent }}>Nemul</p>
        <p className="font-display text-[28px] font-medium" style={{ color: COLORS.text }}>Estudio de iluminación</p>
        <p className="font-body text-[13px] mt-1.5" style={{ color: COLORS.subtext }}>
          {new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>
      <div className="flex flex-col gap-6">
        {rooms.map((room) => (
          <ReportCard key={room.id} room={room} answers={answersByRoom[room.id]} expanded={true} onToggle={() => {}} />
        ))}
      </div>
      <p className="font-body text-[12px] text-center mt-8 leading-relaxed" style={{ color: COLORS.subtext }}>
        Estas recomendaciones son orientativas. Para la instalación eléctrica, consulta siempre a un profesional certificado.
      </p>
    </div>
  );
}

async function downloadReportAsPdf(node, filename) {
  if (!node) return;
  const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#FFFFFF", useCORS: true });
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(filename);
}

function ResultScreen({ rooms, answersByRoom, onRestart, onSave, saved }) {
  const [expandedId, setExpandedId] = useState(rooms[0]?.id);
  const [downloading, setDownloading] = useState(false);
  const printRef = useRef(null);

  useEffect(() => {
    track("viewed_report", { rooms: rooms.map((r) => r.id).join(",") });
    gaEvent("viewed_report", { rooms: rooms.map((r) => r.id).join(",") });
    rooms.forEach((r) => {
      const problem = answersByRoom[r.id]?.problem;
      if (problem) {
        track("problem_selected", { room: r.id, problem });
        gaEvent("problem_selected", { room: r.id, problem });
      }
    });
  }, []);

  const handleDownloadPdf = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const dateStr = new Date().toISOString().slice(0, 10);
      await downloadReportAsPdf(printRef.current, `nemul-informe-${dateStr}.pdf`);
      track("downloaded_pdf");
      gaEvent("downloaded_pdf");
    } catch (e) {
      // Si algo falla generando el PDF, no rompemos el resto de la app.
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col h-full rise-in relative">
      <TopNav onBack={onRestart} />
      <div className="flex-1 overflow-y-auto px-7">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "#EEF0EA" }}>
            <Check size={22} color={COLORS.success} strokeWidth={2} />
          </div>
          <p className="font-body text-[13.5px] tracking-[0.2em] uppercase mb-2" style={{ color: COLORS.accent }}>
            {rooms.length} espacio{rooms.length > 1 ? "s" : ""}, con criterio de diseño
          </p>
          <h2 className="font-display text-[26px] font-medium" style={{ color: COLORS.text }}>
            ✨ Tu estudio de iluminación está listo
          </h2>
        </div>

        <div className="flex flex-col gap-3 pb-4">
          {rooms.map((room) => (
            <ReportCard key={room.id} room={room} answers={answersByRoom[room.id]} expanded={expandedId === room.id} onToggle={() => setExpandedId(expandedId === room.id ? null : room.id)} />
          ))}
        </div>

        <div className="pb-3">
          <GuidePromoCard />
        </div>
        <div className="pb-4">
          <LegalNote />
        </div>
      </div>
      <div className="px-7 pt-3 pb-1 flex flex-col gap-3">
        <PrimaryButton onClick={onSave}>Guardar este plan</PrimaryButton>
        <button
          onClick={handleDownloadPdf}
          disabled={downloading}
          className="w-full flex items-center justify-center gap-2 font-body font-medium text-[14px] rounded-2xl py-3.5 transition-all duration-200"
          style={{ backgroundColor: COLORS.card, border: `1.5px solid ${COLORS.border}`, color: COLORS.text }}
        >
          <Download size={16} color={COLORS.text} strokeWidth={1.8} />
          {downloading ? "Generando PDF..." : "Descargar informe en PDF"}
        </button>
        <button onClick={onRestart} className="w-full font-body text-[13.5px] font-medium py-2 flex items-center justify-center gap-1" style={{ color: COLORS.subtext }}>
          Crear un nuevo plan <ChevronRight size={14} />
        </button>
      </div>
      {saved && (
        <div className="absolute left-1/2 bottom-24 toast-in flex items-center gap-2 px-4 py-2.5 rounded-full" style={{ backgroundColor: COLORS.text, boxShadow: "0 8px 20px rgba(0,0,0,0.2)" }}>
          <Check size={14} color="#FFFFFF" strokeWidth={3} />
          <span className="font-body text-[14px] font-medium text-white">Plan guardado</span>
        </div>
      )}
      <div style={{ position: "absolute", left: -99999, top: 0 }} aria-hidden="true">
        <div ref={printRef}>
          <PrintableReport rooms={rooms} answersByRoom={answersByRoom} />
        </div>
      </div>
    </div>
  );
}

function PlanCard({ plan, onOpen, onDelete }) {
  const first = plan.rooms[0];
  const extra = plan.rooms.length - 1;
  return (
    <button onClick={onOpen} className="w-full flex items-center gap-4 rounded-2xl p-5 text-left transition-all duration-200" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: "0 2px 12px rgba(46,42,39,0.05)" }}>
      <div className="flex -space-x-3 shrink-0">
        {plan.rooms.slice(0, 3).map((r, i) => (
          <div key={r.id} className="w-11 h-11 rounded-full flex items-center justify-center border-2" style={{ backgroundColor: "#F3E9D8", borderColor: COLORS.card, zIndex: 10 - i }}>
            <r.Icon size={16} color={COLORS.accent} strokeWidth={1.6} />
          </div>
        ))}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-body text-[14.5px] font-medium truncate" style={{ color: COLORS.text }}>{first.label}{extra > 0 ? ` + ${extra} más` : ""}</p>
        <p className="font-body text-[13.5px]" style={{ color: COLORS.subtext }}>Guardado el {formatDate(plan.savedAt)}</p>
      </div>
      <div role="button" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="w-8 h-8 rounded-full flex items-center justify-center shrink-0">
        <Trash2 size={15} color={COLORS.subtext} strokeWidth={1.6} />
      </div>
      <ChevronRight size={16} color={COLORS.subtext} className="shrink-0" />
    </button>
  );
}

function HomeScreen({ plans, onOpenPlan, onDeletePlan, onNewPlan }) {
  return (
    <div className="flex flex-col h-full rise-in">
      <div className="px-7 pt-6 pb-5">
        <p className="font-body text-[13.5px] tracking-[0.2em] uppercase mb-2" style={{ color: COLORS.accent }}>Nemul</p>
        <h2 className="font-display text-[28px] font-medium mb-1.5" style={{ color: COLORS.text }}>Tus planes</h2>
        <p className="font-body text-[13.5px]" style={{ color: COLORS.subtext }}>Cada espacio que has iluminado, todo en un solo lugar.</p>
      </div>
      <div className="flex-1 overflow-y-auto px-7">
        {plans.length === 0 ? (
          <div className="flex flex-col items-center text-center pt-14">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
              <HomeIcon size={22} color={COLORS.subtext} strokeWidth={1.5} />
            </div>
            <p className="font-body text-[14px] leading-relaxed max-w-[240px]" style={{ color: COLORS.subtext }}>Aún no tienes planes. Empieza con tu primer espacio y Nemul te guiará.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-4">
            {plans.map((plan) => <PlanCard key={plan.id} plan={plan} onOpen={() => onOpenPlan(plan.id)} onDelete={() => onDeletePlan(plan.id)} />)}
          </div>
        )}
      </div>
      <div className="px-7 pt-3 pb-1">
        <button onClick={onNewPlan} className="tap-scale w-full flex items-center justify-center gap-2 font-body font-medium text-[15px] tracking-wide rounded-2xl py-4 transition-all duration-200" style={{ background: `linear-gradient(135deg, #7C6A56 0%, ${COLORS.primary} 55%, #5E4F41 100%)`, color: "#FFFFFF", boxShadow: "0 8px 20px rgba(111,94,77,0.25)" }}>
          <Plus size={16} strokeWidth={2.2} /> Planear un nuevo espacio
        </button>
      </div>
    </div>
  );
}

function PlanDetailScreen({ plan, onBack }) {
  const [expandedId, setExpandedId] = useState(plan.rooms[0]?.id);
  const [downloading, setDownloading] = useState(false);
  const printRef = useRef(null);

  const handleDownloadPdf = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const dateStr = new Date().toISOString().slice(0, 10);
      await downloadReportAsPdf(printRef.current, `nemul-informe-${dateStr}.pdf`);
    } catch (e) {
      // Si algo falla generando el PDF, no rompemos el resto de la app.
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col h-full rise-in">
      <TopNav onBack={onBack} />
      <div className="px-7 pb-5">
        <p className="font-body text-[13.5px] tracking-[0.2em] uppercase mb-2" style={{ color: COLORS.accent }}>Guardado el {formatDate(plan.savedAt)}</p>
        <h2 className="font-display text-[26px] font-medium" style={{ color: COLORS.text }}>
          {plan.rooms.length} espacio{plan.rooms.length > 1 ? "s" : ""}, con criterio de diseño
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto px-7">
        <div className="flex flex-col gap-3 pb-4">
          {plan.rooms.map((room) => (
            <ReportCard key={room.id} room={room} answers={plan.answersByRoom[room.id]} expanded={expandedId === room.id} onToggle={() => setExpandedId(expandedId === room.id ? null : room.id)} />
          ))}
        </div>
        <div className="pb-3">
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="w-full flex items-center justify-center gap-2 font-body font-medium text-[14px] rounded-2xl py-3.5 transition-all duration-200"
            style={{ backgroundColor: COLORS.card, border: `1.5px solid ${COLORS.border}`, color: COLORS.text }}
          >
            <Download size={16} color={COLORS.text} strokeWidth={1.8} />
            {downloading ? "Generando PDF..." : "Descargar informe en PDF"}
          </button>
        </div>
        <div className="pb-3">
          <GuidePromoCard />
        </div>
        <div className="pb-6">
          <LegalNote />
        </div>
      </div>
      <div style={{ position: "absolute", left: -99999, top: 0 }} aria-hidden="true">
        <div ref={printRef}>
          <PrintableReport rooms={plan.rooms} answersByRoom={plan.answersByRoom} />
        </div>
      </div>
    </div>
  );
}

// ---------- Landing page: la puerta de entrada real de www.nemul.app ----------
// Se muestra fuera del marco de teléfono: es una página web normal y responsiva,
// no la simulación de app. El CTA lleva a la experiencia dentro del "teléfono".

// Envuelve cualquier sección para que aparezca con un fundido/deslizamiento
// suave la primera vez que entra en pantalla al hacer scroll, en vez de estar
// todo ya visible de golpe al cargar la página.
function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Copia original del modelo "una habitación gratis + Premium en espera",
 * guardada aquí para restaurarla fácilmente si se reactiva ese modelo.
 *
 * ES:
 *   accessTitle: "Empieza gratis con una habitación"
 *   accessText: "Prueba Nemul sin coste en el espacio que más te importe ahora. Muy pronto abriremos el acceso a toda la vivienda."
 *   faq (¿Cuántas habitaciones puedo probar gratis?): "Una habitación completa, sin ningún coste. Muy pronto abriremos el acceso a toda la vivienda."
 *   faq (¿Cómo sé cuándo esté disponible el acceso completo?): "Al intentar entrar a otra habitación te ofrecemos dejar tu email para avisarte en cuanto esté listo."
 *
 * EN:
 *   accessTitle: "Start free with one room"
 *   accessText: "Try Nemul at no cost in the space that matters most to you right now. We'll soon open access to your whole home."
 *   faq (How many rooms can I try for free?): "One full room, at no cost. We'll soon open access to your entire home."
 *   faq (How will I know when full access is available?): "When you try to enter another room, we'll offer you the option to leave your email so we can notify you."
 * ------------------------------------------------------------------------- */
const LANDING_COPY = {
  es: {
    navCta: "Empieza gratis",
    heroTitle: "Diseña la iluminación de tu hogar.",
    heroSubtitle: "Recibe una propuesta de iluminación personalizada en pocos minutos. No necesitas conocimientos técnicos.",
    heroCta: "Diseña tu iluminación",
    heroTrust: "Gratis · Sin registro · En pocos minutos",
    langNotice: "",
    howTitle: "¿Cómo funciona?",
    howSubtitle: "Responde unas preguntas y recibe un estudio personalizado para tu estancia.",
    steps: [
      { n: "1", title: "Elige una estancia", text: "Salón, cocina, dormitorio... empieza por el espacio que más te importa ahora mismo." },
      { n: "2", title: "Responde unas preguntas sencillas", text: "Nada de términos técnicos: te preguntamos cómo vives ese espacio, no cómo diseñar luz." },
      { n: "3", title: "Recibe tu estudio de iluminación", text: "Temperatura, lúmenes, distribución de focos y una propuesta adaptada a tu estancia." },
    ],
    showcaseTitle: "¿Qué vas a recibir con Nemul?",
    showcasePreviewLabel: "Vista previa del informe (resumen)",
    showcaseExampleLabel: "Ejemplo: Salón",
    showcaseSubLabel: "Estudio de iluminación",
    showcaseItems: [
      "Luz necesaria según los m²",
      "Temperatura de color",
      "Distribución de luminarias",
      "Capas de iluminación",
      "Errores a evitar",
      "Recomendaciones personalizadas",
    ],
    showcaseFooter: "El informe completo incluye todos los cálculos, recomendaciones y explicaciones para cada estancia.",
    credentialTitle: "Creado por Dayami, con formación en diseño de interiores",
    credentialText: "Aplica criterios de interiorismo y los explica de forma sencilla para ayudarte a tomar mejores decisiones.",
    accessLabel: "Acceso",
    accessTitle: "Empieza gratis con una habitación",
    accessText: "Prueba Nemul sin coste en el espacio que más te importe ahora. Muy pronto abriremos el acceso a toda la vivienda.",
    accessCta: "Empieza gratis",
    guideLabel: "¿Quieres aprender más?",
    guideTitle: "Guía práctica de iluminación",
    guideText: "Aprende a iluminar cualquier estancia como un profesional, con ejemplos reales y consejos prácticos.",
    guideCta: "Ver en Etsy",
    faqTitle: "Preguntas frecuentes",
    faqs: [
      { q: "¿Necesito saber de iluminación para usar Nemul?", a: "No. Todas las preguntas están pensadas para cualquier persona, sin necesidad de conocer términos técnicos. Nemul traduce los aspectos técnicos a recomendaciones fáciles de entender." },
      { q: "¿Nemul sustituye a un electricista?", a: "No. Las recomendaciones son orientativas; para la instalación eléctrica siempre debes consultar a un profesional certificado." },
      { q: "¿Cuántas habitaciones puedo probar gratis?", a: "Una habitación completa, sin ningún coste. Muy pronto abriremos el acceso a toda la vivienda." },
      { q: "¿Cómo sé cuándo esté disponible el acceso completo?", a: "Al intentar entrar a otra habitación te ofrecemos dejar tu email para avisarte en cuanto esté listo." },
    ],
    footerLegal: "Estas recomendaciones son orientativas. Para la instalación eléctrica, consulta siempre a un profesional certificado.",
    footerFaqLink: "Preguntas frecuentes",
    footerContact: "Contacto",
    footerPrivacy: "Política de privacidad",
    privacy: {
      dataTitle: "Qué datos recopilamos",
      dataText: "Nemul solo te pide tu email si tú decides dejarlo voluntariamente en la pantalla de acceso Premium, para avisarte cuando esa función esté disponible. No pedimos contraseña, datos de pago, ni ningún otro dato personal para usar la habitación gratuita.",
      useTitle: "Cómo lo usamos",
      useText: "Únicamente para enviarte un aviso relacionado con el acceso Premium. No lo usamos para ningún otro fin, y no lo compartimos, vendemos ni cedemos a terceros bajo ninguna circunstancia.",
      whereTitle: "Dónde se guarda",
      whereText: "Tu email se almacena de forma segura en Formspree, el servicio que usamos para gestionar este formulario de interés.",
      localTitle: "Almacenamiento en tu propio dispositivo",
      localText: "Para que Nemul funcione bien, guardamos cierta información directamente en tu navegador (no en nuestros servidores): qué habitación probaste gratis y los planes que decidas guardar. Esta información se queda únicamente en tu dispositivo, nunca se nos envía, y puedes borrarla en cualquier momento eliminando los datos de navegación de tu navegador.",
      cookiesTitle: "Cookies",
      cookiesText: "Nemul no utiliza cookies de seguimiento ni analíticas de terceros en esta versión.",
      rightsTitle: "Tus derechos",
      rightsTextPrefix: "Puedes pedirnos en cualquier momento que eliminemos tu email de nuestros registros escribiendo a ",
      changesTitle: "Cambios futuros",
      changesText: "Si en el futuro añadimos cuentas de usuario, pagos u otro tratamiento de datos, actualizaremos esta política y te lo indicaremos claramente aquí.",
    },
  },
  en: {
    navCta: "Start for free",
    heroTitle: "The simplest way to design your home's lighting.",
    heroSubtitle: "Get professional recommendations in minutes. No technical knowledge required.",
    heroCta: "✨ Start for free",
    heroTrust: "No sign-up. No commitment. Free report in minutes.",
    langNotice: "Note: the interactive questionnaire is currently only available in Spanish. Full English support is coming soon.",
    howTitle: "How does it work?",
    howSubtitle: "Answer a few questions and get a personalized study for your room.",
    steps: [
      { n: "1", title: "Choose a room", text: "Living room, kitchen, bedroom... start with the space that matters most to you right now." },
      { n: "2", title: "Answer a few simple questions", text: "No technical jargon: we ask how you live in that space, not how to design lighting." },
      { n: "3", title: "Get your lighting study", text: "Temperature, lumens, fixture layout and tips, explained in plain language." },
    ],
    showcaseTitle: "What will you get with Nemul?",
    showcasePreviewLabel: "Report preview (summary)",
    showcaseExampleLabel: "Example: Living Room",
    showcaseSubLabel: "Technical lighting report",
    showcaseItems: [
      "Light needed based on room size",
      "Color temperature",
      "Fixture layout",
      "Lighting layers",
      "Mistakes to avoid",
      "Personalized recommendations",
    ],
    showcaseFooter: "The full report includes every calculation, recommendation, and explanation for each room.",
    credentialTitle: "Created by Dayami, trained in interior design",
    credentialText: "Applies interior design criteria and explains it simply, to help you make better decisions.",
    accessLabel: "Access",
    accessTitle: "Start free with one room",
    accessText: "Try Nemul at no cost in the space that matters most to you right now. We'll soon open access to your whole home.",
    accessCta: "Start for free",
    guideLabel: "Want to learn more?",
    guideTitle: "Professional Lighting Guide",
    guideText: "Learn to light any room like a professional, with real examples and practical tips.",
    guideCta: "View on Etsy",
    faqTitle: "Frequently asked questions",
    faqs: [
      { q: "Do I need to know about lighting to use Nemul?", a: "No. Every question is designed for anyone, no technical terms required. Nemul handles the professional part for you." },
      { q: "Does Nemul replace an electrician?", a: "No. The recommendations are for guidance only; always consult a certified professional for electrical installation." },
      { q: "How many rooms can I try for free?", a: "One full room, at no cost. We'll soon open access to your entire home." },
      { q: "How will I know when full access is available?", a: "When you try to enter another room, we'll offer you the option to leave your email so we can notify you." },
    ],
    footerLegal: "These recommendations are for guidance only. Always consult a certified professional for electrical installation.",
    footerFaqLink: "FAQ",
    footerContact: "Contact",
    footerPrivacy: "Privacy policy",
    privacy: {
      dataTitle: "What data we collect",
      dataText: "Nemul only asks for your email if you choose to leave it on the Premium access screen, so we can notify you when that feature is available. We don't ask for a password, payment details, or any other personal data to use the free room.",
      useTitle: "How we use it",
      useText: "Only to send you a notice related to Premium access. We never use it for any other purpose, and we never share, sell, or transfer it to third parties under any circumstances.",
      whereTitle: "Where it's stored",
      whereText: "Your email is securely stored in Formspree, the service we use to manage this interest form.",
      localTitle: "Storage on your own device",
      localText: "To make Nemul work properly, we store certain information directly in your browser (not on our servers): which room you tried for free, and any plans you choose to save. This information stays only on your device, is never sent to us, and you can delete it anytime by clearing your browser's browsing data.",
      cookiesTitle: "Cookies",
      cookiesText: "Nemul does not use tracking cookies or third-party analytics in this version.",
      rightsTitle: "Your rights",
      rightsTextPrefix: "You can ask us at any time to delete your email from our records by writing to ",
      changesTitle: "Future changes",
      changesText: "If we add user accounts, payments, or any other data processing in the future, we'll update this policy and clearly note it here.",
    },
  },
};

function LandingNav({ onStart, lang, setLang, t }) {
  return (
    <div className="sticky top-0 z-10 backdrop-blur-md" style={{ backgroundColor: "rgba(248,246,242,0.85)", borderBottom: `1px solid ${COLORS.border}` }}>
      <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <img src="/logo-icon.png" alt="" className="h-10 w-auto" />
          <span className="font-display text-[22px] font-medium" style={{ color: COLORS.text }}>Nemul</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-full p-0.5" style={{ backgroundColor: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
            {["es", "en"].map((code) => (
              <button
                key={code}
                onClick={() => setLang(code)}
                className="font-body text-[12px] font-semibold rounded-full px-3 py-1.5 transition-all duration-200"
                style={{
                  backgroundColor: lang === code ? COLORS.primary : "transparent",
                  color: lang === code ? "#FFFFFF" : COLORS.subtext,
                }}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            onClick={onStart}
            className="tap-scale font-body text-[13.5px] font-medium rounded-full px-5 py-2.5 transition-all duration-200"
            style={{ background: `linear-gradient(135deg, #7C6A56 0%, ${COLORS.primary} 55%, #5E4F41 100%)`, color: "#FFFFFF" }}
          >
            {t.navCta}
          </button>
        </div>
      </div>
    </div>
  );
}

function LandingHero({ onStart, t }) {
  return (
    <section className="max-w-3xl mx-auto px-6 pt-16 pb-14 text-center">
      <div className="mb-6">
        <img src="/logo.png" alt="Nemul" className="h-36 w-auto mx-auto" />
      </div>
      <h1 className="font-display text-[40px] md:text-[52px] leading-[1.1] font-medium mb-5" style={{ color: COLORS.text }}>
        {t.heroTitle}
      </h1>
      <p className="font-body text-[16px] md:text-[17px] leading-relaxed max-w-xl mx-auto mb-9" style={{ color: COLORS.subtext }}>
        {t.heroSubtitle}
      </p>
      <button
        onClick={onStart}
        className="tap-scale font-body font-medium text-[15px] tracking-wide rounded-2xl px-8 py-4 transition-all duration-200 hover:scale-[1.02]"
        style={{ background: `linear-gradient(135deg, #7C6A56 0%, ${COLORS.primary} 55%, #5E4F41 100%)`, color: "#FFFFFF", boxShadow: "0 10px 26px rgba(111,94,77,0.3)" }}
      >
        {t.heroCta}
      </button>
      <p className="font-body text-[12.5px] mt-3.5" style={{ color: COLORS.subtext }}>
        {t.heroTrust}
      </p>
      {t.langNotice && (
        <p className="font-body text-[12px] leading-relaxed mt-3 max-w-sm mx-auto rounded-xl px-4 py-2.5" style={{ color: COLORS.primary, backgroundColor: "#F3E9D8" }}>
          {t.langNotice}
        </p>
      )}
    </section>
  );
}

function HowItWorksSection({ t }) {
  return (
    <section className="max-w-4xl mx-auto px-6 py-14">
      <Reveal>
        <h2 className="font-display text-[28px] font-medium text-center mb-3" style={{ color: COLORS.text }}>{t.howTitle}</h2>
        <p className="font-body text-[14.5px] text-center mb-10 max-w-md mx-auto leading-relaxed" style={{ color: COLORS.subtext }}>{t.howSubtitle}</p>
      </Reveal>
      <div className="grid md:grid-cols-3 gap-5">
        {t.steps.map((s, i) => (
          <Reveal key={s.n} delay={i * 120}>
            <div
              className="rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1.5"
              style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: "0 2px 12px rgba(46,42,39,0.05)" }}
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center mb-4 font-body text-[14px] font-semibold" style={{ background: "linear-gradient(135deg, #F3E9D8, #EAD9BC)", color: COLORS.accent }}>
                {s.n}
              </div>
              <p className="font-body text-[15px] font-medium mb-2" style={{ color: COLORS.text }}>{s.title}</p>
              <p className="font-body text-[13.5px] leading-relaxed" style={{ color: COLORS.subtext }}>{s.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function PreviewRow({ label }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
      <p className="font-body text-[14px] font-medium" style={{ color: COLORS.text }}>{label}</p>
      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#EEF0EA" }}>
        <Check size={11} color={COLORS.success} strokeWidth={3} />
      </div>
    </div>
  );
}

function ProductShowcaseSection({ t }) {
  return (
    <section className="max-w-md mx-auto px-6 py-14">
      <Reveal>
        <h2 className="font-display text-[28px] font-medium text-center mb-3" style={{ color: COLORS.text }}>{t.showcaseTitle}</h2>
        <p className="font-body text-[13px] tracking-wide text-center mb-6" style={{ color: COLORS.accent }}>
          {t.showcasePreviewLabel}
        </p>
      </Reveal>
      <Reveal delay={150}>
        <div className="rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: "0 12px 32px rgba(46,42,39,0.08)" }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #F3E9D8, #EAD9BC)" }}>
              <Sofa size={18} color={COLORS.accent} strokeWidth={1.6} />
            </div>
            <div>
              <p className="font-body text-[14px] font-medium" style={{ color: COLORS.text }}>{t.showcaseExampleLabel}</p>
              <p className="font-body text-[12px]" style={{ color: COLORS.subtext }}>{t.showcaseSubLabel}</p>
            </div>
          </div>
          <div>
            {t.showcaseItems.map((label, i) => <PreviewRow key={i} label={label} />)}
          </div>
        </div>
      </Reveal>
      <p className="font-body text-[12.5px] text-center mt-5 leading-relaxed" style={{ color: COLORS.subtext }}>
        {t.showcaseFooter}
      </p>
    </section>
  );
}

function CredentialSection({ t }) {
  return (
    <section className="max-w-2xl mx-auto px-6 py-14 text-center">
      <Reveal>
        <div className="w-14 h-14 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #F3E9D8, #EAD9BC)" }}>
          <Sparkles size={22} color={COLORS.accent} strokeWidth={1.6} />
        </div>
        <p className="font-display text-[22px] font-medium mb-3" style={{ color: COLORS.text }}>{t.credentialTitle}</p>
        <p className="font-body text-[14.5px] leading-relaxed" style={{ color: COLORS.subtext }}>
          {t.credentialText}
        </p>
      </Reveal>
    </section>
  );
}

function AccessSection({ onStart, t }) {
  return (
    <section className="max-w-2xl mx-auto px-6 py-14 text-center">
      <Reveal>
      <div className="rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1" style={{ backgroundColor: "#F3E9D8", border: `1px solid #C1A16B55` }}>
        <p className="font-body text-[12px] tracking-[0.2em] uppercase mb-3" style={{ color: COLORS.primary }}>{t.accessLabel}</p>
        <p className="font-display text-[22px] font-medium mb-3" style={{ color: COLORS.text }}>{t.accessTitle}</p>
        <p className="font-body text-[14px] leading-relaxed mb-6" style={{ color: COLORS.subtext }}>
          {t.accessText}
        </p>
        <button
          onClick={onStart}
          className="tap-scale font-body font-medium text-[14.5px] rounded-2xl px-7 py-3.5 transition-all duration-200"
          style={{ background: `linear-gradient(135deg, #7C6A56 0%, ${COLORS.primary} 55%, #5E4F41 100%)`, color: "#FFFFFF", boxShadow: "0 8px 20px rgba(111,94,77,0.25)" }}
        >
          {t.accessCta}
        </button>
      </div>
      </Reveal>
    </section>
  );
}

function LandingGuideSection({ t }) {
  return (
    <section className="max-w-2xl mx-auto px-6 py-14">
      <Reveal>
        <p className="font-body text-[12px] tracking-[0.2em] uppercase text-center mb-4" style={{ color: COLORS.accent }}>{t.guideLabel}</p>
        <div className="rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: "0 2px 12px rgba(46,42,39,0.05)" }}>
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #F3E9D8, #EAD9BC)" }}>
              <BookOpen size={19} color={COLORS.accent} strokeWidth={1.6} />
            </div>
            <div className="flex-1">
              <p className="font-display text-[18px] font-medium mb-1" style={{ color: COLORS.text }}>{t.guideTitle}</p>
              <p className="font-body text-[13px] leading-relaxed mb-4" style={{ color: COLORS.subtext }}>
                {t.guideText}
              </p>
              <a
                href="https://www.etsy.com/es/listing/4427720777/guia-de-iluminacion-del-hogar-consejos?ref=share_ios_native_control"
                target="_blank"
                rel="noopener noreferrer"
                className="tap-scale inline-block font-body font-medium text-[13.5px] rounded-xl px-5 py-2.5"
                style={{ background: `linear-gradient(135deg, #7C6A56 0%, ${COLORS.primary} 55%, #5E4F41 100%)`, color: "#FFFFFF" }}
              >
                {t.guideCta}
              </a>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="tap-scale rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left">
        <span className="font-body text-[14px] font-medium" style={{ color: COLORS.text }}>{q}</span>
        <ChevronDown size={16} color={COLORS.subtext} style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }} />
      </button>
      {open && (
        <div className="px-5 pb-4 option-in">
          <p className="font-body text-[13.5px] leading-relaxed" style={{ color: COLORS.subtext }}>{a}</p>
        </div>
      )}
    </div>
  );
}

function FAQSection({ t }) {
  return (
    <section id="faq" className="max-w-2xl mx-auto px-6 py-14">
      <Reveal><h2 className="font-display text-[26px] font-medium text-center mb-8" style={{ color: COLORS.text }}>{t.faqTitle}</h2></Reveal>
      <div className="flex flex-col gap-3">
        {t.faqs.map((f, i) => (
          <Reveal key={i} delay={i * 80}>
            <FAQItem q={f.q} a={f.a} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function LandingFooter({ t }) {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const p = t.privacy;
  return (
    <footer className="border-t" style={{ borderColor: COLORS.border }}>
      <div className="max-w-2xl mx-auto px-6 py-10 text-center">
        <p className="font-body text-[12px] leading-relaxed mb-5" style={{ color: COLORS.subtext }}>
          {t.footerLegal}
        </p>
        <div className="flex items-center justify-center gap-5 mb-5 flex-wrap">
          <a href="#faq" className="font-body text-[13px] font-medium" style={{ color: COLORS.text }}>{t.footerFaqLink}</a>
          <a href="mailto:digitaldma2026@gmail.com" className="font-body text-[13px] font-medium" style={{ color: COLORS.text }}>{t.footerContact}</a>
          <button onClick={() => setShowPrivacy((s) => !s)} className="font-body text-[13px] font-medium" style={{ color: COLORS.text }}>{t.footerPrivacy}</button>
        </div>
        {showPrivacy && (
          <div className="rounded-xl p-6 text-left mb-5 flex flex-col gap-4" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
            <div>
              <p className="font-body text-[13.5px] font-medium mb-1.5" style={{ color: COLORS.text }}>{p.dataTitle}</p>
              <p className="font-body text-[12.5px] leading-relaxed" style={{ color: COLORS.subtext }}>{p.dataText}</p>
            </div>
            <div>
              <p className="font-body text-[13.5px] font-medium mb-1.5" style={{ color: COLORS.text }}>{p.useTitle}</p>
              <p className="font-body text-[12.5px] leading-relaxed" style={{ color: COLORS.subtext }}>{p.useText}</p>
            </div>
            <div>
              <p className="font-body text-[13.5px] font-medium mb-1.5" style={{ color: COLORS.text }}>{p.whereTitle}</p>
              <p className="font-body text-[12.5px] leading-relaxed" style={{ color: COLORS.subtext }}>{p.whereText}</p>
            </div>
            <div>
              <p className="font-body text-[13.5px] font-medium mb-1.5" style={{ color: COLORS.text }}>{p.localTitle}</p>
              <p className="font-body text-[12.5px] leading-relaxed" style={{ color: COLORS.subtext }}>{p.localText}</p>
            </div>
            <div>
              <p className="font-body text-[13.5px] font-medium mb-1.5" style={{ color: COLORS.text }}>{p.cookiesTitle}</p>
              <p className="font-body text-[12.5px] leading-relaxed" style={{ color: COLORS.subtext }}>{p.cookiesText}</p>
            </div>
            <div>
              <p className="font-body text-[13.5px] font-medium mb-1.5" style={{ color: COLORS.text }}>{p.rightsTitle}</p>
              <p className="font-body text-[12.5px] leading-relaxed" style={{ color: COLORS.subtext }}>
                {p.rightsTextPrefix}<a href="mailto:digitaldma2026@gmail.com" style={{ color: COLORS.accent }}>digitaldma2026@gmail.com</a>.
              </p>
            </div>
            <div>
              <p className="font-body text-[13.5px] font-medium mb-1.5" style={{ color: COLORS.text }}>{p.changesTitle}</p>
              <p className="font-body text-[12.5px] leading-relaxed" style={{ color: COLORS.subtext }}>{p.changesText}</p>
            </div>
          </div>
        )}
        <p className="font-body text-[11.5px]" style={{ color: COLORS.subtext }}>© {new Date().getFullYear()} Nemul</p>
      </div>
    </footer>
  );
}

function LandingPage({ onStart }) {
  const [lang, setLang] = useState("es");
  const t = LANDING_COPY[lang];
  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: COLORS.bg }}>
      <style>{FONT_STYLE}</style>
      <LandingNav onStart={onStart} lang={lang} setLang={setLang} t={t} />
      <LandingHero onStart={onStart} t={t} />
      <HowItWorksSection t={t} />
      <ProductShowcaseSection t={t} />
      <CredentialSection t={t} />
      <AccessSection onStart={onStart} t={t} />
      <LandingGuideSection t={t} />
      <FAQSection t={t} />
      <LandingFooter t={t} />
    </div>
  );
}


export default function NemulApp() {
  const [screen, setScreen] = useState("landing");
  const [selectedRoomIds, setSelectedRoomIds] = useState([]);
  const [roomIndex, setRoomIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [answersByRoom, setAnswersByRoom] = useState({});
  const [saved, setSaved] = useState(false);
  const [savedPlans, setSavedPlans] = useState(() => loadSavedPlans());

  useEffect(() => {
    persistSavedPlans(savedPlans);
  }, [savedPlans]);
  const [viewingPlanId, setViewingPlanId] = useState(null);
  const [freeRoomId, setFreeRoomId] = useState(() => {
    try {
      return localStorage.getItem("nemul_freeRoomId") || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (freeRoomId) localStorage.setItem("nemul_freeRoomId", freeRoomId);
    } catch {
      // Si el navegador bloquea localStorage (modo privado, por ejemplo),
      // simplemente no persiste entre recargas; el resto de la app sigue funcionando.
    }
  }, [freeRoomId]);

  const selectedRooms = selectedRoomIds.map((id) => ROOMS.find((r) => r.id === id));
  const currentRoom = selectedRooms[roomIndex];
  const currentFlow = currentRoom ? getFlowForRoom(currentRoom.id, answersByRoom[currentRoom.id]) : [];
  const currentStep = currentFlow[stepIndex];
  const currentAnswers = (currentRoom && answersByRoom[currentRoom.id]) || {};
  const currentValue = currentStep ? currentAnswers[currentStep.key] : null;

  const toggleRoom = (id) => setSelectedRoomIds((r) => (r[0] === id ? [] : [id]));

  const setAnswer = (optionId) => {
    if (!currentRoom || !currentStep) return;
    setAnswersByRoom((prev) => {
      const roomAnswers = prev[currentRoom.id] || {};
      let value;
      if (currentStep.type === "multi") {
        const arr = roomAnswers[currentStep.key] || [];
        value = arr.includes(optionId) ? arr.filter((x) => x !== optionId) : [...arr, optionId];
      } else {
        value = optionId;
      }
      return { ...prev, [currentRoom.id]: { ...roomAnswers, [currentStep.key]: value } };
    });
  };

  const resetFlow = () => {
    setSelectedRoomIds([]);
    setRoomIndex(0);
    setStepIndex(0);
    setAnswersByRoom({});
    setSaved(false);
  };

  const startFlow = () => { setRoomIndex(0); setStepIndex(0); setScreen("question"); };
  const startNewPlanFromHome = () => { resetFlow(); setScreen("rooms"); };

  const handleRoomsContinue = () => {
    const chosenId = selectedRoomIds[0];
    if (freeRoomId && chosenId !== freeRoomId) {
      track("saw_premium_gate", { room: chosenId });
      gaEvent("saw_premium_gate", { room: chosenId });
      setScreen("premiumGate");
      return;
    }
    if (!freeRoomId) setFreeRoomId(chosenId);
    track("started_room", { room: chosenId });
    gaEvent("started_room", { room: chosenId });
    startFlow();
  };

  const handleContinue = () => {
    if (stepIndex < currentFlow.length - 1) { setStepIndex(stepIndex + 1); return; }
    setScreen("review");
  };

  const editAnswer = (idx) => { setStepIndex(idx); setScreen("question"); };

  const confirmReview = () => {
    if (roomIndex < selectedRooms.length - 1) advanceToNextRoom();
    else setScreen("result");
  };

  const handleBack = () => {
    if (stepIndex > 0) { setStepIndex(stepIndex - 1); return; }
    if (roomIndex > 0) {
      const prevRoom = selectedRooms[roomIndex - 1];
      setRoomIndex(roomIndex - 1);
      setStepIndex(getFlowForRoom(prevRoom.id, answersByRoom[prevRoom.id]).length - 1);
      return;
    }
    setScreen("rooms");
  };

  const advanceToNextRoom = () => { setRoomIndex(roomIndex + 1); setStepIndex(0); setScreen("question"); };

  const restart = () => { resetFlow(); setScreen(savedPlans.length > 0 ? "home" : "welcome"); };

  const handleSave = () => {
    const newPlan = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, savedAt: new Date(), rooms: selectedRooms, answersByRoom };
    setSavedPlans((prev) => [newPlan, ...prev]);
    setSaved(true);
    track("saved_plan", { rooms: selectedRooms.map((r) => r.id).join(",") });
    gaEvent("saved_plan", { rooms: selectedRooms.map((r) => r.id).join(",") });
    setTimeout(() => setSaved(false), 2200);
  };

  const openPlan = (id) => { setViewingPlanId(id); setScreen("planDetail"); };
  const deletePlan = (id) => setSavedPlans((prev) => prev.filter((p) => p.id !== id));

  const roomEyebrow = selectedRooms.length > 1 && currentRoom
    ? `${currentRoom.label} · Espacio ${roomIndex + 1} de ${selectedRooms.length}`
    : currentRoom?.label;

  const viewingPlan = savedPlans.find((p) => p.id === viewingPlanId);

  if (screen === "landing") {
    return <LandingPage onStart={() => { track("landing_cta_click"); gaEvent("landing_cta_click"); setScreen("welcome"); }} />;
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center py-10 px-4" style={{ backgroundColor: "#EFECE5" }}>
      <style>{FONT_STYLE}</style>
      <div className="relative w-[375px] h-[780px] rounded-[48px] overflow-hidden" style={{ backgroundColor: COLORS.bg, boxShadow: "0 30px 70px rgba(46,42,39,0.28)", border: "8px solid #1C1A18" }}>
        <StatusBar />
        <div className="h-[calc(100%-88px)]">
          {screen === "welcome" && <WelcomeScreen onStart={() => setScreen("rooms")} />}
          {screen === "home" && <HomeScreen plans={savedPlans} onOpenPlan={openPlan} onDeletePlan={deletePlan} onNewPlan={startNewPlanFromHome} />}
          {screen === "rooms" && (
            <RoomsScreen selected={selectedRoomIds} toggle={toggleRoom} onBack={() => setScreen(savedPlans.length > 0 ? "home" : "welcome")} onContinue={handleRoomsContinue} freeRoomId={freeRoomId} />
          )}
          {screen === "premiumGate" && (
            <PremiumGateScreen
              freeRoomLabel={ROOMS.find((r) => r.id === freeRoomId)?.label || "tu habitación"}
              onBack={() => setScreen("rooms")}
              onContinueFree={() => {
                setSelectedRoomIds([freeRoomId]);
                startFlow();
              }}
            />
          )}
          {screen === "question" && currentRoom && currentStep && (
            <QuestionScreen step={currentStep} value={currentValue} onSelect={setAnswer} onBack={handleBack} onContinue={handleContinue} stepIndex={stepIndex} total={currentFlow.length} eyebrow={roomEyebrow} />
          )}
          {screen === "roomDone" && currentRoom && (
            <RoomDoneScreen roomLabel={currentRoom.label} RoomIcon={currentRoom.Icon} nextLabel={selectedRooms[roomIndex + 1]?.label} onContinue={advanceToNextRoom} />
          )}
          {screen === "review" && currentRoom && (
            <ReviewScreen
              room={currentRoom}
              summary={summarizeAnswers(currentFlow, currentAnswers)}
              onEdit={editAnswer}
              onConfirm={confirmReview}
              onBack={() => { setStepIndex(currentFlow.length - 1); setScreen("question"); }}
            />
          )}
          {screen === "result" && <ResultScreen rooms={selectedRooms} answersByRoom={answersByRoom} onRestart={restart} onSave={handleSave} saved={saved} />}
          {screen === "planDetail" && viewingPlan && <PlanDetailScreen plan={viewingPlan} onBack={() => setScreen("home")} />}
        </div>
        <HomeIndicator />
      </div>
    </div>
  );
}
