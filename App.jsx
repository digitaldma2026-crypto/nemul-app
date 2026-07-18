import { useState, useEffect, useRef } from "react";
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
    .glow-orb, .rise-in, .toast-in { animation: none; }
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

const CEILING_OPTIONS = [
  { id: "liso", label: "Liso" },
  { id: "pladur", label: "Falso techo de pladur" },
  { id: "vigas", label: "Con vigas" },
  { id: "noSe", label: "No lo sé" },
];

const CEILING_INSIGHT = {
  liso: "Un techo liso te da libertad total para colocar los puntos de luz donde más los necesites.",
  pladur: "Un falso techo de pladur es ideal para empotrar focos e integrar tiras LED sin obra adicional.",
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
const LUMENS_PER_DOWNLIGHT = 700;
const WATTS_PER_DOWNLIGHT = 7;

// Traducción a lenguaje humano: el número técnico no desaparece, pero nunca
// se queda solo. Así lo explicaría una diseñadora en persona.
const TEMP_HUMAN = {
  2700: "luz muy cálida y acogedora, como la de una lámpara de mesa clásica",
  3000: "luz cálida, la más habitual en los hogares",
  3500: "luz cálida-neutra, ni amarilla ni blanca",
  4000: "luz blanca neutra, parecida a la de una oficina bien iluminada",
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
  const downlights = Math.max(4, Math.ceil(lumens / LUMENS_PER_DOWNLIGHT));

  const tips = [];
  tips.push("Coloca los downlights separados aproximadamente entre 1,2 y 1,5 m.");
  tips.push("Evita colocar focos justo encima del sofá para reducir deslumbramientos.");

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
  if (ceiling === "pladur") tips.push("Un falso techo de pladur es ideal para empotrar downlights e integrar tiras LED perimetrales sin obra adicional.");
  if (ceiling === "liso") tips.push("Un techo liso te da libertad total para distribuir los downlights donde más los necesites.");
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

  return { tempK, lumens, downlights, area, lux, tips: [...new Set(tips)], mistakes: [...new Set(mistakes)] };
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
  const downlights = Math.max(4, Math.ceil(lumens / LUMENS_PER_DOWNLIGHT));

  const distribution = [];
  distribution.push(`${downlights} downlights recomendados.`);
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

  return { tempK, lumens, downlights, area, lux, distribution, narrative: sentences.join(" "), mistakes: [...new Set(mistakes)] };
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
  { id: "vestidor", label: "Vestidor" },
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
  { id: "abierto", label: "Armarios abiertos" },
  { id: "cerrado", label: "Armarios cerrados" },
  { id: "mixto", label: "Mixto" },
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

const ACTIVITY_OPTIONS = {
  bedroom: BEDROOM_ACTIVITY_OPTIONS,
  terrace: TERRACE_ACTIVITY_OPTIONS,
};

const ACTIVITY_INSIGHT = {
  bedroom: {
    sleep: "Para dormir bien, la luz principal debe poder atenuarse hasta casi apagarse: la última luz que ves antes de dormir marca el tono del descanso.",
    readBed: "Para leer en la cama, una lámpara orientable en la mesita, a la altura del hombro, evita que la luz general te deslumbre al recostarte.",
    dress: "Para vestirte frente al armario, usa una luz neutra y sin sombras: la misma cálida que usas para dormir no te deja ver bien los colores.",
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
function problemStep(roomId) {
  return { key: "problem", title: "¿Qué te gustaría solucionar?", subtitle: "Elige lo que más se acerque a tu situación.", type: "single", layout: "list", options: PROBLEM_OPTIONS[roomId] };
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
};

// Preguntas específicas de cada habitación que no encajan en "actividad" ni "problema":
// se resuelven todas con este mismo mecanismo genérico.
const EXTRA_INSIGHT = {
  bedroom: {
    closetType: {
      empotrado: "Con armario empotrado, una luz continua en la parte superior evita que el interior quede en sombra al abrir las puertas.",
      vestidor: "Al tener vestidor, trátalo casi como una habitación aparte: necesita su propia luz general, neutra y sin sombras.",
      independiente: "Con un armario independiente, un punto de luz cercano evita que el propio mueble haga sombra sobre sí mismo al abrirlo.",
    },
    closetLight: {
      si: "Como quieres luz dentro o delante del armario, añade una tira LED interior o un foco orientado directamente hacia la ropa.",
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
      si: "Con espejo de cuerpo entero, ilumina desde ambos lados para ver el conjunto completo sin sombras duras.",
      no: "Sin espejo de cuerpo entero, la luz general uniforme sobre la ropa es tu prioridad principal.",
    },
    makeup: {
      si: "Como te maquillas o preparas aquí, añade un punto de luz de buena calidad de color cerca de donde te sientas o te miras.",
      no: "Al no maquillarte aquí, puedes priorizar una luz más funcional que estética.",
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
};

const CLOSET_TYPE_INSIGHT = {
  abierto: "Como tu armario es abierto, la luz general del vestidor ya alcanza la ropa; refuerza solo la zona del espejo.",
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
    reading: "Ya que te falta luz para leer o vestirte, añade un punto dedicado en la mesita de noche y otro neutro cerca del armario.",
    cozy: "Para un ambiente más relajante, prioriza tonos cálidos y añade la posibilidad de atenuar la luz por la noche.",
    renovating: "Como estás reformando desde cero, aprovecha para separar en circuitos la zona de descanso y la de vestidor.",
  },
  bathroom: {
    shadows: "Para eliminar las sombras del espejo, coloca la luz a ambos lados del rostro en lugar de un único punto cenital.",
    cold: "Si la luz se siente demasiado fría, baja la temperatura de color general hacia un blanco más cálido y neutro.",
    night: "Para las rutinas nocturnas, añade una luz muy tenue independiente de la luz principal del baño.",
    spa: "Para un ambiente de spa, prioriza luz cálida y regulable, y valora añadir una vela o luz indirecta junto a la bañera.",
    renovating: "Como estás reformando desde cero, separa en circuitos distintos la zona del espejo, la ducha y la luz general.",
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
};

const ROOM_TECH_MISTAKES = {
  bedroom: [
    "No uses una única luz cenital muy intensa: resulta poco agradable para conciliar el sueño.",
    "No mezcles tonos de luz muy distintos entre la zona de la cama y el armario.",
  ],
  bathroom: [
    "No coloques un único punto de luz cenital sobre el espejo: crea sombras bajo los ojos y la nariz.",
    "No mezcles temperaturas de color muy distintas entre la zona del espejo y el resto del baño.",
    "No instales luminarias sin certificación para zonas húmedas cerca de la ducha o la bañera.",
  ],
  dining: [
    "No cuelgues la lámpara demasiado alta sobre la mesa: pierde función si queda muy por encima de la superficie.",
    "No ilumines solo el centro si la mesa es grande: deja los extremos en sombra.",
  ],
  closet: [
    "No uses luz muy cálida como única fuente: distorsiona el color real de la ropa.",
    "No dejes los armarios cerrados sin luz interior si son profundos: la luz general no llega bien al fondo.",
  ],
  terrace: [
    "No uses luminarias sin certificación para exterior si la terraza está descubierta.",
    "No dependas de un único foco potente: reparte varios puntos de menor intensidad.",
  ],
};

function generateGenericTechnicalReport(roomId, answers = {}) {
  const cfg = ROOM_TECH_CONFIG[roomId];
  const area = cfg.areaMap[answers.size] ?? cfg.defaultArea;
  const lux = getLux(roomId, answers.light);
  const lumens = Math.round((lux * area) / 100) * 100;
  const downlights = Math.max(cfg.minDownlights, Math.ceil(lumens / LUMENS_PER_DOWNLIGHT));
  const tempK = cfg.getTempK(answers);
  const tips = getReport(roomId, answers);
  const mistakes = ROOM_TECH_MISTAKES[roomId] || [];
  return { tempK, lumens, downlights, area, lux, tips, mistakes };
}

const ROOM_FLOWS = {
  living: [
    { key: "activities", title: "¿Cómo utilizas principalmente el salón?", subtitle: "Puedes elegir varias opciones.", type: "multi", layout: "list", options: LIVING_ACTIVITY_OPTIONS },
    { key: "size", title: "¿Cuántos metros cuadrados tiene el salón?", subtitle: "Un cálculo aproximado está bien.", info: "En un salón suelen recomendarse entre 150 y 225 lm/m² según el ambiente que busques. Nemul hará el cálculo automáticamente.", type: "single", layout: "grid", options: SALON_SIZE_OPTIONS },
    { key: "light", title: "¿Cuánta luz natural recibe?", subtitle: "Piensa en un día normal, sin encender ninguna luz.", type: "single", layout: "list", options: LIGHT_OPTIONS },
    { key: "ceiling", title: "¿Qué tipo de techo tienes?", subtitle: "Esto determina qué soluciones de instalación son posibles.", type: "single", layout: "list", options: CEILING_OPTIONS },
    { key: "goals", title: "¿Qué te gustaría conseguir con la iluminación?", subtitle: "Puedes elegir varias opciones.", type: "multi", layout: "list", options: LIVING_GOAL_OPTIONS },
    { key: "problem", title: "¿Qué te gustaría solucionar?", subtitle: "Elige lo que más se acerque a tu situación.", type: "single", layout: "list", options: LIVING_PROBLEM_OPTIONS },
    renovationStep,
  ],
  livingDining: [
    { key: "activities", title: "¿Cómo utilizas principalmente el espacio?", subtitle: "Puedes elegir varias opciones.", type: "multi", layout: "list", options: LIVING_ACTIVITY_OPTIONS },
    { key: "diningShape", title: "¿La mesa del comedor es redonda, rectangular o cuadrada?", subtitle: "La forma cambia cómo repartimos la luz sobre ella.", type: "single", layout: "list", options: DINING_SHAPE_OPTIONS },
    { key: "diningSeats", title: "¿Cuántas personas suelen comer?", subtitle: "Un cálculo aproximado está bien.", type: "single", layout: "list", options: DINING_SEATS_OPTIONS },
    { key: "diningPendant", title: "¿Quieres una lámpara decorativa sobre la mesa?", subtitle: "Como una lámpara colgante.", type: "single", layout: "list", options: YES_NO_OPTIONS },
    { key: "size", title: "¿Cuántos metros cuadrados tiene el salón-comedor en total?", subtitle: "Un cálculo aproximado está bien.", info: "Al ser un espacio abierto, se calcula como una sola superficie. Nemul hará el cálculo automáticamente.", type: "single", layout: "grid", options: SALON_SIZE_OPTIONS },
    { key: "light", title: "¿Cuánta luz natural recibe?", subtitle: "Piensa en un día normal, sin encender ninguna luz.", type: "single", layout: "list", options: LIGHT_OPTIONS },
    { key: "ceiling", title: "¿Qué tipo de techo tienes?", subtitle: "Esto determina qué soluciones de instalación son posibles.", type: "single", layout: "list", options: CEILING_OPTIONS },
    { key: "goals", title: "¿Qué te gustaría conseguir con la iluminación?", subtitle: "Puedes elegir varias opciones.", type: "multi", layout: "list", options: LIVING_GOAL_OPTIONS },
    { key: "problem", title: "¿Qué te gustaría solucionar?", subtitle: "Elige lo que más se acerque a tu situación.", type: "single", layout: "list", options: LIVING_PROBLEM_OPTIONS },
    renovationStep,
  ],
  kitchen: [
    { key: "layout", title: "¿Qué distribución tiene tu cocina?", subtitle: "Elige la forma que más se parece a la tuya.", type: "single", layout: "grid", options: KITCHEN_LAYOUT_OPTIONS },
    { key: "size", title: "¿Cuántos metros cuadrados tiene la cocina?", subtitle: "Un cálculo aproximado está bien.", info: "Para una cocina suelen recomendarse entre 300 y 400 lm/m². Nemul hará el cálculo automáticamente según el tamaño y la luz natural.", type: "single", layout: "grid", options: KITCHEN_SIZE_OPTIONS },
    { key: "priorities", title: "¿Qué es lo más importante para ti en la cocina?", subtitle: "Puedes elegir varias opciones.", type: "multi", layout: "list", options: KITCHEN_PRIORITY_OPTIONS },
    { key: "upperCabinets", title: "¿Tienes muebles altos?", subtitle: "Esto nos dice dónde puede faltar luz sobre la encimera.", type: "single", layout: "list", options: KITCHEN_UPPER_CABINETS_OPTIONS },
    { key: "workZone", title: "¿Dónde preparas normalmente los alimentos?", subtitle: "Así sabremos dónde reforzar la iluminación.", type: "single", layout: "list", options: KITCHEN_WORK_ZONE_OPTIONS },
    { key: "ceilingHeight", title: "¿Cuál es la altura aproximada del techo?", subtitle: "Un cálculo aproximado está bien.", type: "single", layout: "grid", options: KITCHEN_CEILING_HEIGHT_OPTIONS },
    { key: "light", title: "¿Cuánta luz natural recibe la cocina durante el día?", subtitle: "Piensa en un día normal, sin encender ninguna luz.", type: "single", layout: "list", options: LIGHT_OPTIONS },
    { key: "problem", title: "¿Qué te gustaría solucionar?", subtitle: "Elige lo que más se acerque a tu situación.", type: "single", layout: "list", options: KITCHEN_PROBLEM_OPTIONS },
    renovationStep,
  ],
  kitchenOpen: [
    { key: "layout", title: "¿Qué distribución tiene tu cocina?", subtitle: "Elige la forma que más se parece a la tuya.", type: "single", layout: "grid", options: KITCHEN_LAYOUT_OPTIONS },
    { key: "size", title: "¿Cuántos metros cuadrados tiene la zona de cocina?", subtitle: "Un cálculo aproximado está bien.", info: "Para una cocina suelen recomendarse entre 300 y 400 lm/m². Nemul hará el cálculo automáticamente según el tamaño y la luz natural.", type: "single", layout: "grid", options: KITCHEN_SIZE_OPTIONS },
    { key: "priorities", title: "¿Qué es lo más importante para ti en la cocina?", subtitle: "Puedes elegir varias opciones.", type: "multi", layout: "list", options: KITCHEN_PRIORITY_OPTIONS },
    { key: "upperCabinets", title: "¿Tienes muebles altos?", subtitle: "Esto nos dice dónde puede faltar luz sobre la encimera.", type: "single", layout: "list", options: KITCHEN_UPPER_CABINETS_OPTIONS },
    { key: "workZone", title: "¿Dónde preparas normalmente los alimentos?", subtitle: "Así sabremos dónde reforzar la iluminación.", type: "single", layout: "list", options: KITCHEN_WORK_ZONE_OPTIONS },
    { key: "ceilingHeight", title: "¿Cuál es la altura aproximada del techo?", subtitle: "Un cálculo aproximado está bien.", type: "single", layout: "grid", options: KITCHEN_CEILING_HEIGHT_OPTIONS },
    { key: "light", title: "¿Cuánta luz natural recibe la cocina durante el día?", subtitle: "Piensa en un día normal, sin encender ninguna luz.", type: "single", layout: "list", options: LIGHT_OPTIONS },
    { key: "adjoiningStyle", title: "¿Qué ambiente tiene el salón con el que se conecta?", subtitle: "Así coordinamos la luz entre ambas zonas.", type: "single", layout: "grid", options: STYLE_OPTIONS },
    { key: "problem", title: "¿Qué te gustaría solucionar?", subtitle: "Elige lo que más se acerque a tu situación.", type: "single", layout: "list", options: KITCHEN_PROBLEM_OPTIONS },
    renovationStep,
  ],
  bedroom: [
    lightStep,
    { key: "ceiling", title: "¿Qué tipo de techo tienes?", subtitle: "Esto determina qué soluciones de instalación son posibles.", type: "single", layout: "list", options: CEILING_OPTIONS },
    { key: "size", title: "¿Cuántos metros cuadrados tiene el dormitorio?", subtitle: "Un cálculo aproximado está bien.", info: "En un dormitorio suelen bastar entre 100 y 150 lm/m². Nemul hará el cálculo automáticamente.", type: "single", layout: "grid", options: BEDROOM_SIZE_OPTIONS },
    activityStep("bedroom", "Puedes elegir varias opciones."),
    { key: "closetType", title: "¿Tienes armario o vestidor?", subtitle: "Cada uno necesita una luz distinta.", type: "single", layout: "list", options: BEDROOM_CLOSET_TYPE_OPTIONS },
    { key: "closetLight", title: "¿Quieres iluminación dentro o delante del armario?", subtitle: "Ideal si te vistes ahí mismo.", type: "single", layout: "list", options: YES_NO_OPTIONS },
    problemStep("bedroom"),
    renovationStep,
  ],
  bathroom: (answers = {}) => [
    { key: "type", title: "¿Qué tipo de baño es?", subtitle: "Esto cambia cuántas zonas de luz necesitas.", type: "single", layout: "list", options: BATHROOM_TYPE_OPTIONS },
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
    { key: "shape", title: "¿La mesa es redonda, rectangular o cuadrada?", subtitle: "La forma cambia cómo repartimos la luz.", type: "single", layout: "list", options: DINING_SHAPE_OPTIONS },
    { key: "size", title: "¿Cuántos metros cuadrados tiene el comedor?", subtitle: "Un cálculo aproximado está bien.", info: "En un comedor suelen recomendarse entre 150 y 200 lm/m². Nemul hará el cálculo automáticamente.", type: "single", layout: "grid", options: DINING_SIZE_OPTIONS },
    { key: "seats", title: "¿Cuántas personas suelen comer?", subtitle: "Un cálculo aproximado está bien.", type: "single", layout: "list", options: DINING_SEATS_OPTIONS },
    { key: "pendant", title: "¿Quieres una lámpara decorativa sobre la mesa?", subtitle: "Como una lámpara colgante.", type: "single", layout: "list", options: YES_NO_OPTIONS },
    lightStep,
    problemStep("dining"),
    renovationStep,
  ],
  closet: [
    { key: "type", title: "¿Qué tipo de armario tienes?", subtitle: "Esto cambia cómo debe repartirse la luz.", type: "single", layout: "list", options: CLOSET_TYPE_OPTIONS },
    { key: "size", title: "¿Cuántos metros cuadrados tiene el vestidor?", subtitle: "Un cálculo aproximado está bien.", info: "En un vestidor conviene entre 250 y 300 lm/m² para ver bien los colores. Nemul hará el cálculo automáticamente.", type: "single", layout: "grid", options: CLOSET_SIZE_OPTIONS },
    { key: "mirror", title: "¿Hay espejo de cuerpo entero?", subtitle: "Ideal para ver el conjunto completo.", type: "single", layout: "list", options: YES_NO_OPTIONS },
    { key: "makeup", title: "¿Te maquillas o preparas aquí?", subtitle: "Esto pide una luz de mejor calidad de color.", type: "single", layout: "list", options: YES_NO_OPTIONS },
    lightStep,
    problemStep("closet"),
    renovationStep,
  ],
  terrace: [
    activityStep("terrace", "Puedes elegir varias opciones."),
    { key: "covered", title: "¿Está cubierta o descubierta?", subtitle: "Esto determina qué luminarias puedes usar.", type: "single", layout: "list", options: TERRACE_COVERED_OPTIONS },
    { key: "size", title: "¿Cuántos metros cuadrados tiene la terraza?", subtitle: "Un cálculo aproximado está bien.", info: "En una terraza suelen bastar entre 80 y 150 lm/m² de ambiente. Nemul hará el cálculo automáticamente.", type: "single", layout: "grid", options: TERRACE_SIZE_OPTIONS },
    { key: "night", title: "¿La usas principalmente de noche?", subtitle: "Cambia cuánto peso le damos a la luz artificial.", type: "single", layout: "list", options: YES_NO_OPTIONS },
    lightStep,
    problemStep("terrace"),
    renovationStep,
  ],
  hallway: [
    { key: "length", title: "¿Qué longitud tiene aproximadamente?", subtitle: "Un cálculo aproximado está bien.", type: "single", layout: "grid", options: HALLWAY_LENGTH_OPTIONS },
    { key: "light", title: "¿Tiene luz natural?", subtitle: "Piensa en un día normal, sin encender ninguna luz.", type: "single", layout: "list", options: LIGHT_OPTIONS },
    { key: "sensor", title: "¿Quieres sensor de movimiento?", subtitle: "Ideal para pasillos que se cruzan de paso.", type: "single", layout: "list", options: HALLWAY_SENSOR_OPTIONS },
    { key: "connects", title: "¿Conecta muchas habitaciones?", subtitle: "Cuantas más conecte, más se usará.", type: "single", layout: "list", options: YES_NO_OPTIONS },
    problemStep("hallway"),
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
      className="w-full font-body font-medium text-[15px] tracking-wide rounded-2xl py-4 transition-all duration-200"
      style={{ backgroundColor: disabled ? COLORS.border : COLORS.primary, color: disabled ? COLORS.subtext : "#FFFFFF", boxShadow: disabled ? "none" : "0 8px 20px rgba(111,94,77,0.25)" }}
    >
      {children}
    </button>
  );
}

function OptionRow({ selected, onClick, Icon, label, hint, multi }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all duration-200"
      style={{ backgroundColor: COLORS.card, border: `1.5px solid ${selected ? COLORS.accent : COLORS.border}`, boxShadow: selected ? "0 6px 18px rgba(193,161,107,0.20)" : "0 2px 10px rgba(46,42,39,0.04)" }}
    >
      {Icon && (
        <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: selected ? "#F3E9D8" : COLORS.bg }}>
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
        {selected && <Check size={11} color="#FFFFFF" strokeWidth={3} />}
      </div>
    </button>
  );
}

function WelcomeScreen({ onStart }) {
  return (
    <div className="flex flex-col h-full px-7 pt-8 pb-8 rise-in">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="relative w-28 h-28 mb-8 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full glow-orb" style={{ background: "radial-gradient(circle, #FFC94Db3 0%, #FFC94D33 45%, transparent 72%)" }} />
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.card, boxShadow: "0 8px 24px rgba(244,181,66,0.45)" }}>
            <Lightbulb size={26} color="#F4B942" fill="#FFDE8A" strokeWidth={1.4} />
          </div>
        </div>
        <p className="font-body text-[13px] tracking-[0.25em] uppercase mb-3" style={{ color: COLORS.accent }}>Nemul</p>
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
          {ROOMS.map(({ id, label, Icon }) => {
            const isSelected = selected.includes(id);
            const isLocked = freeRoomId && freeRoomId !== id;
            return (
              <button
                key={id}
                onClick={() => toggle(id)}
                className="relative flex flex-col items-center justify-center gap-3 rounded-2xl py-6 px-3 transition-all duration-200"
                style={{ backgroundColor: COLORS.card, border: `1.5px solid ${isSelected ? COLORS.accent : COLORS.border}`, boxShadow: isSelected ? "0 6px 18px rgba(193,161,107,0.20)" : "0 2px 10px rgba(46,42,39,0.04)" }}
              >
                {isLocked && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: "#F3E9D8" }}>
                    <Lock size={10} color={COLORS.accent} strokeWidth={2} />
                  </div>
                )}
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: isSelected ? "#F3E9D8" : COLORS.bg, opacity: isLocked ? 0.6 : 1 }}>
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
            {step.options.map((opt) => {
              const selected = isMulti ? (value || []).includes(opt.id) : value === opt.id;
              return <OptionRow key={opt.id} selected={selected} onClick={() => onSelect(opt.id)} Icon={opt.Icon} label={opt.label} hint={opt.hint} multi={isMulti} />;
            })}
          </div>
        )}
        {step.layout === "grid" && (
          <div className="grid grid-cols-2 gap-3">
            {step.options.map((opt) => {
              const selected = isMulti ? (value || []).includes(opt.id) : value === opt.id;
              const { Icon } = opt;
              return (
                <button
                  key={opt.id}
                  onClick={() => onSelect(opt.id)}
                  className="rounded-2xl py-5 px-3 text-center transition-all duration-200 flex flex-col items-center gap-2"
                  style={{ backgroundColor: COLORS.card, border: `1.5px solid ${selected ? COLORS.accent : COLORS.border}`, boxShadow: selected ? "0 6px 18px rgba(193,161,107,0.20)" : "0 2px 10px rgba(46,42,39,0.04)" }}
                >
                  {Icon && (
                    <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: selected ? "#F3E9D8" : COLORS.bg }}>
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
          <div key={i} className="flex items-start gap-3 rounded-xl p-3.5" style={{ backgroundColor: "#FBF1EC" }}>
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
function CalculationBlock({ area, lux, lumens, downlights }) {
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
          <StatRow label="Downlights recomendados" value={`${downlights} × ${LUMENS_PER_DOWNLIGHT} lm`} />
          <p className="font-body text-[13.5px] italic mt-1 ml-9" style={{ color: COLORS.subtext }}>
            Equivale a downlights LED de unos {WATTS_PER_DOWNLIGHT}W cada uno, el estándar más habitual en casa.
          </p>
        </div>
      </div>
    </div>
  );
}

// Esquema orientativo (no a escala) de dónde van los downlights según la
// distribución de la cocina. Primer paso visual de Nemul: ver la propuesta,
// no solo leerla.
function KitchenFloorPlan({ layout, downlights }) {
  const W = 300, H = 190;
  const pad = 22;
  const roomX = pad, roomY = pad, roomW = W - pad * 2, roomH = H - pad * 2;
  const depth = 22;

  let counters = [];
  let feature = null;
  if (layout === "L") {
    counters = [
      { x: roomX, y: roomY + roomH - depth, w: roomW, h: depth },
      { x: roomX, y: roomY, w: depth, h: roomH - depth },
    ];
  } else if (layout === "U") {
    counters = [
      { x: roomX, y: roomY + roomH - depth, w: roomW, h: depth },
      { x: roomX, y: roomY, w: depth, h: roomH - depth },
      { x: roomX + roomW - depth, y: roomY, w: depth, h: roomH - depth },
    ];
  } else if (layout === "paralela") {
    counters = [
      { x: roomX, y: roomY, w: roomW, h: depth },
      { x: roomX, y: roomY + roomH - depth, w: roomW, h: depth },
    ];
  } else if (layout === "isla") {
    counters = [{ x: roomX, y: roomY + roomH - depth, w: roomW, h: depth }];
    feature = { x: roomX + roomW * 0.32, y: roomY + roomH * 0.28, w: roomW * 0.36, h: roomH * 0.26, kind: "isla" };
  } else if (layout === "peninsula") {
    counters = [{ x: roomX, y: roomY + roomH - depth, w: roomW, h: depth }];
    feature = { x: roomX + roomW * 0.58, y: roomY + roomH * 0.32, w: depth, h: roomH * 0.42, kind: "peninsula" };
  } else {
    counters = [{ x: roomX, y: roomY + roomH - depth, w: roomW, h: depth }];
  }

  const featureDots = feature ? Math.min(3, Math.max(2, Math.round(downlights * 0.3))) : 0;
  const remaining = Math.max(downlights - featureDots, counters.length);
  const total = counters.reduce((s, c) => s + Math.max(c.w, c.h), 0) || 1;

  const dots = [];
  let left = remaining;
  counters.forEach((c, i) => {
    const isLast = i === counters.length - 1;
    const len = Math.max(c.w, c.h);
    const count = isLast ? left : Math.max(1, Math.round(remaining * (len / total)));
    left -= count;
    const horizontal = c.w >= c.h;
    for (let k = 0; k < count; k++) {
      const t = count === 1 ? 0.5 : (k + 0.5) / count;
      dots.push({
        cx: horizontal ? c.x + c.w * t : c.x + c.w / 2,
        cy: horizontal ? c.y + c.h / 2 : c.y + c.h * t,
      });
    }
  });

  const featureDotPositions = [];
  if (feature) {
    const horizontal = feature.w >= feature.h;
    for (let k = 0; k < featureDots; k++) {
      const t = featureDots === 1 ? 0.5 : (k + 0.5) / featureDots;
      featureDotPositions.push({
        cx: horizontal ? feature.x + feature.w * t : feature.x + feature.w / 2,
        cy: horizontal ? feature.y + feature.h / 2 : feature.y + feature.h * t,
      });
    }
  }

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <rect x={roomX} y={roomY} width={roomW} height={roomH} rx="10" fill={COLORS.bg} stroke={COLORS.border} strokeWidth="2" />
        {counters.map((c, i) => (
          <rect key={i} x={c.x} y={c.y} width={c.w} height={c.h} rx="4" fill="#EFE6D8" stroke={COLORS.border} strokeWidth="1" />
        ))}
        {feature && <rect x={feature.x} y={feature.y} width={feature.w} height={feature.h} rx="6" fill="#EFE6D8" stroke={COLORS.accent} strokeWidth="1.5" />}
        {dots.map((d, i) => (
          <circle key={i} cx={d.cx} cy={d.cy} r="4.5" fill={COLORS.accent} stroke="#FFFFFF" strokeWidth="1" />
        ))}
        {featureDotPositions.map((d, i) => (
          <circle key={`f${i}`} cx={d.cx} cy={d.cy} r="5.5" fill="#F4B942" stroke="#FFFFFF" strokeWidth="1.2" />
        ))}
      </svg>
      <div className="flex items-center gap-4 justify-center mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.accent }} />
          <span className="font-body text-[14px]" style={{ color: COLORS.subtext }}>Downlight</span>
        </div>
        {feature && (
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#F4B942" }} />
            <span className="font-body text-[14px]" style={{ color: COLORS.subtext }}>Lámpara colgante</span>
          </div>
        )}
      </div>
      <p className="font-body text-[14px] text-center mt-1.5" style={{ color: COLORS.subtext }}>Esquema orientativo, no a escala.</p>
    </div>
  );
}

function DiningFloorPlan({ shape, pendant, seats }) {
  const W = 300, H = 190, pad = 22;
  const roomX = pad, roomY = pad, roomW = W - pad * 2, roomH = H - pad * 2;
  const cx = roomX + roomW / 2, cy = roomY + roomH / 2;

  let tableW, tableH;
  if (shape === "redonda") { tableW = 90; tableH = 90; }
  else if (shape === "cuadrada") { tableW = 80; tableH = 80; }
  else { tableW = 150; tableH = 64; }

  const usePendant = pendant === "si";
  const lightCount = seats === "muchas" ? 3 : seats === "varias" ? 2 : 1;
  const dots = [];
  for (let k = 0; k < lightCount; k++) {
    const t = lightCount === 1 ? 0.5 : (k + 0.5) / lightCount;
    dots.push({ cx: cx - tableW / 2 + tableW * t, cy });
  }

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <rect x={roomX} y={roomY} width={roomW} height={roomH} rx="10" fill={COLORS.bg} stroke={COLORS.border} strokeWidth="2" />
        {shape === "redonda" ? (
          <ellipse cx={cx} cy={cy} rx={tableW / 2} ry={tableH / 2} fill="#EFE6D8" stroke={COLORS.border} strokeWidth="1" />
        ) : (
          <rect x={cx - tableW / 2} y={cy - tableH / 2} width={tableW} height={tableH} rx={shape === "cuadrada" ? 8 : 10} fill="#EFE6D8" stroke={COLORS.border} strokeWidth="1" />
        )}
        {dots.map((d, i) => (
          <circle key={i} cx={d.cx} cy={d.cy} r={usePendant ? 5.5 : 4.5} fill={usePendant ? "#F4B942" : COLORS.accent} stroke="#FFFFFF" strokeWidth={usePendant ? 1.2 : 1} />
        ))}
      </svg>
      <div className="flex items-center gap-4 justify-center mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: usePendant ? "#F4B942" : COLORS.accent }} />
          <span className="font-body text-[14px]" style={{ color: COLORS.subtext }}>{usePendant ? "Lámpara colgante" : "Downlight"}</span>
        </div>
      </div>
      <p className="font-body text-[14px] text-center mt-1.5" style={{ color: COLORS.subtext }}>Esquema orientativo, no a escala.</p>
    </div>
  );
}

function HallwayFloorPlan({ length, sensor }) {
  const W = 300, H = 120, pad = 20;
  const roomX = pad, roomY = pad, roomW = W - pad * 2, roomH = H - pad * 2;
  const count = length === "largo" ? 3 : length === "medio" ? 2 : 1;
  const dots = [];
  for (let k = 0; k < count; k++) {
    const t = count === 1 ? 0.5 : (k + 0.5) / count;
    dots.push({ cx: roomX + roomW * t, cy: roomY + roomH / 2 });
  }
  const hasSensor = sensor === "si";

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <rect x={roomX} y={roomY} width={roomW} height={roomH} rx="10" fill={COLORS.bg} stroke={COLORS.border} strokeWidth="2" />
        {dots.map((d, i) => (
          <circle key={i} cx={d.cx} cy={d.cy} r="5" fill={COLORS.accent} stroke="#FFFFFF" strokeWidth="1" />
        ))}
        {hasSensor && <circle cx={roomX + 16} cy={roomY + 16} r="6" fill="none" stroke="#F4B942" strokeWidth="2" />}
      </svg>
      <div className="flex items-center gap-4 justify-center mt-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.accent }} />
          <span className="font-body text-[14px]" style={{ color: COLORS.subtext }}>Downlight</span>
        </div>
        {hasSensor && (
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full border-2" style={{ borderColor: "#F4B942" }} />
            <span className="font-body text-[14px]" style={{ color: COLORS.subtext }}>Sensor de movimiento</span>
          </div>
        )}
      </div>
      <p className="font-body text-[14px] text-center mt-1.5" style={{ color: COLORS.subtext }}>Esquema orientativo, no a escala.</p>
    </div>
  );
}

function BathroomFloorPlan({ type, fixture }) {
  const W = 300, H = 190, pad = 22;
  const roomX = pad, roomY = pad, roomW = W - pad * 2, roomH = H - pad * 2;
  const sinkZone = { x: roomX + roomW * 0.15, y: roomY, w: roomW * 0.32, h: 18 };

  const zones = [];
  if (type !== "aseo") {
    if (fixture === "ducha" || fixture === "ambas") {
      zones.push({ x: roomX + roomW - 72, y: roomY + roomH - 72, w: 60, h: 60 });
    }
    if (fixture === "banera" || fixture === "ambas") {
      zones.push({ x: roomX + 10, y: roomY + roomH - 50, w: fixture === "ambas" ? 90 : 120, h: 40 });
    }
  }

  const dots = [{ cx: sinkZone.x + sinkZone.w / 2, cy: sinkZone.y + sinkZone.h / 2 }];
  zones.forEach((z) => dots.push({ cx: z.x + z.w / 2, cy: z.y + z.h / 2 }));

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <rect x={roomX} y={roomY} width={roomW} height={roomH} rx="10" fill={COLORS.bg} stroke={COLORS.border} strokeWidth="2" />
        <rect x={sinkZone.x} y={sinkZone.y} width={sinkZone.w} height={sinkZone.h} rx="4" fill="#EFE6D8" stroke={COLORS.border} strokeWidth="1" />
        {zones.map((z, i) => (
          <rect key={i} x={z.x} y={z.y} width={z.w} height={z.h} rx="6" fill="#E4EEF0" stroke={COLORS.border} strokeWidth="1" />
        ))}
        {dots.map((d, i) => (
          <circle key={i} cx={d.cx} cy={d.cy} r="4.5" fill={COLORS.accent} stroke="#FFFFFF" strokeWidth="1" />
        ))}
      </svg>
      <p className="font-body text-[14px] text-center mt-1.5 leading-relaxed" style={{ color: COLORS.subtext }}>
        Esquema orientativo, no a escala. Zona clara: espejo. Zona azulada: ducha o bañera.
      </p>
    </div>
  );
}

function ceilingGrid(roomX, roomY, roomW, roomH, downlights) {
  const cols = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(downlights))));
  const rows = Math.max(1, Math.ceil(downlights / cols));
  const marginX = roomW * 0.14, marginY = roomH * 0.16;
  const dots = [];
  let count = downlights;
  for (let r = 0; r < rows && count > 0; r++) {
    for (let c = 0; c < cols && count > 0; c++) {
      const tx = cols === 1 ? 0.5 : c / (cols - 1);
      const ty = rows === 1 ? 0.5 : r / (rows - 1);
      dots.push({ cx: roomX + marginX + (roomW - 2 * marginX) * tx, cy: roomY + marginY + (roomH - 2 * marginY) * ty });
      count--;
    }
  }
  return dots;
}

function LivingFloorPlan({ activities = [], goals = [], downlights, diningShape, diningPendant }) {
  const W = 300, H = 190, pad = 22;
  const roomX = pad, roomY = pad, roomW = W - pad * 2, roomH = H - pad * 2;

  const sofa = { x: roomX + roomW * 0.2, y: roomY + roomH - 46, w: roomW * 0.5, h: 32 };
  const hasTV = activities.includes("tv");
  const tv = hasTV ? { x: roomX + roomW * 0.32, y: roomY + 6, w: roomW * 0.34, h: 9 } : null;

  let table = null;
  if (diningShape) {
    const tw = diningShape === "redonda" ? 46 : diningShape === "cuadrada" ? 42 : 60;
    const th = diningShape === "rectangular" ? 32 : tw;
    table = { x: roomX + roomW - tw - 14, y: roomY + 14, w: tw, h: th, shape: diningShape };
  }

  const dots = ceilingGrid(roomX, roomY, roomW, roomH, downlights);
  const hasReading = goals.includes("reading") || activities.includes("read");
  const hasDecor = goals.includes("decor");

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <rect x={roomX} y={roomY} width={roomW} height={roomH} rx="10" fill={COLORS.bg} stroke={COLORS.border} strokeWidth="2" />
        <rect x={sofa.x} y={sofa.y} width={sofa.w} height={sofa.h} rx="10" fill="#EFE6D8" stroke={COLORS.border} strokeWidth="1" />
        {tv && <rect x={tv.x} y={tv.y} width={tv.w} height={tv.h} rx="2.5" fill="#2E2A27" />}
        {table && (table.shape === "redonda"
          ? <ellipse cx={table.x + table.w / 2} cy={table.y + table.h / 2} rx={table.w / 2} ry={table.h / 2} fill="#EFE6D8" stroke={COLORS.border} strokeWidth="1" />
          : <rect x={table.x} y={table.y} width={table.w} height={table.h} rx="6" fill="#EFE6D8" stroke={COLORS.border} strokeWidth="1" />)}
        {dots.map((d, i) => <circle key={i} cx={d.cx} cy={d.cy} r="4.5" fill={COLORS.accent} stroke="#FFFFFF" strokeWidth="1" />)}
        {hasReading && <circle cx={sofa.x - 8} cy={sofa.y + sofa.h / 2} r="5.5" fill="#F4B942" stroke="#FFFFFF" strokeWidth="1.2" />}
        {hasDecor && <circle cx={roomX + 14} cy={roomY + roomH * 0.55} r="5.5" fill="#F4B942" stroke="#FFFFFF" strokeWidth="1.2" />}
        {table && diningPendant === "si" && <circle cx={table.x + table.w / 2} cy={table.y + table.h / 2} r="5.5" fill="#F4B942" stroke="#FFFFFF" strokeWidth="1.2" />}
      </svg>
      <div className="flex items-center gap-4 justify-center mt-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.accent }} />
          <span className="font-body text-[14px]" style={{ color: COLORS.subtext }}>Downlight</span>
        </div>
        {(hasReading || hasDecor || (table && diningPendant === "si")) && (
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#F4B942" }} />
            <span className="font-body text-[14px]" style={{ color: COLORS.subtext }}>Lámpara / acento</span>
          </div>
        )}
      </div>
      <p className="font-body text-[14px] text-center mt-1.5" style={{ color: COLORS.subtext }}>Esquema orientativo, no a escala.</p>
    </div>
  );
}

function BedroomFloorPlan({ activities = [], closetType, closetLight, downlights }) {
  const W = 300, H = 190, pad = 22;
  const roomX = pad, roomY = pad, roomW = W - pad * 2, roomH = H - pad * 2;

  const bed = { x: roomX + roomW * 0.3, y: roomY + 8, w: roomW * 0.4, h: roomH * 0.36 };

  let closet;
  if (closetType === "vestidor") closet = { x: roomX + roomW - 66, y: roomY + roomH - 56, w: 56, h: 46 };
  else if (closetType === "independiente") closet = { x: roomX + roomW * 0.55, y: roomY + roomH - 50, w: 50, h: 36 };
  else closet = { x: roomX + roomW - 16, y: roomY + roomH * 0.12, w: 14, h: roomH * 0.5 }; // empotrado: franja en la pared

  const dots = ceilingGrid(roomX, roomY, roomW, roomH, downlights);
  const hasReadBed = activities.includes("readBed");

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <rect x={roomX} y={roomY} width={roomW} height={roomH} rx="10" fill={COLORS.bg} stroke={COLORS.border} strokeWidth="2" />
        <rect x={bed.x} y={bed.y} width={bed.w} height={bed.h} rx="8" fill="#EFE6D8" stroke={COLORS.border} strokeWidth="1" />
        <rect x={closet.x} y={closet.y} width={closet.w} height={closet.h} rx="5" fill="#EFE6D8" stroke={COLORS.accent} strokeWidth="1.3" />
        {dots.map((d, i) => <circle key={i} cx={d.cx} cy={d.cy} r="4.5" fill={COLORS.accent} stroke="#FFFFFF" strokeWidth="1" />)}
        {hasReadBed && (
          <>
            <circle cx={bed.x - 6} cy={bed.y + 8} r="5" fill="#F4B942" stroke="#FFFFFF" strokeWidth="1.2" />
            <circle cx={bed.x + bed.w + 6} cy={bed.y + 8} r="5" fill="#F4B942" stroke="#FFFFFF" strokeWidth="1.2" />
          </>
        )}
        {closetLight === "si" && <circle cx={closet.x + closet.w / 2} cy={closet.y + closet.h / 2} r="4.5" fill="#F4B942" stroke="#FFFFFF" strokeWidth="1.1" />}
      </svg>
      <div className="flex items-center gap-4 justify-center mt-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.accent }} />
          <span className="font-body text-[14px]" style={{ color: COLORS.subtext }}>Downlight</span>
        </div>
        {(hasReadBed || closetLight === "si") && (
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#F4B942" }} />
            <span className="font-body text-[14px]" style={{ color: COLORS.subtext }}>Lámpara / acento</span>
          </div>
        )}
      </div>
      <p className="font-body text-[14px] text-center mt-1.5" style={{ color: COLORS.subtext }}>Esquema orientativo, no a escala.</p>
    </div>
  );
}

function ClosetFloorPlan({ type, mirror, makeup, downlights }) {
  const W = 300, H = 190, pad = 22;
  const roomX = pad, roomY = pad, roomW = W - pad * 2, roomH = H - pad * 2;
  const wardrobe = { x: roomX + roomW * 0.1, y: roomY, w: roomW * 0.8, h: 26 };
  const mirrorZone = mirror === "si" ? { x: roomX + roomW - 22, y: roomY + roomH * 0.3, w: 12, h: roomH * 0.4 } : null;

  const dots = ceilingGrid(roomX, roomY, roomW, roomH - 20, downlights).map((d) => ({ ...d, cy: d.cy + 20 }));

  const dashArray = type === "abierto" ? "5 4" : type === "mixto" ? "5 4" : undefined;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <rect x={roomX} y={roomY} width={roomW} height={roomH} rx="10" fill={COLORS.bg} stroke={COLORS.border} strokeWidth="2" />
        {type === "mixto" ? (
          <>
            <rect x={wardrobe.x} y={wardrobe.y} width={wardrobe.w / 2} height={wardrobe.h} fill="#EFE6D8" stroke={COLORS.border} strokeWidth="1" strokeDasharray="5 4" />
            <rect x={wardrobe.x + wardrobe.w / 2} y={wardrobe.y} width={wardrobe.w / 2} height={wardrobe.h} fill="#EFE6D8" stroke={COLORS.border} strokeWidth="1" />
          </>
        ) : (
          <rect x={wardrobe.x} y={wardrobe.y} width={wardrobe.w} height={wardrobe.h} fill="#EFE6D8" stroke={COLORS.border} strokeWidth="1" strokeDasharray={dashArray} />
        )}
        {mirrorZone && <rect x={mirrorZone.x} y={mirrorZone.y} width={mirrorZone.w} height={mirrorZone.h} rx="4" fill="#E4EEF0" stroke={COLORS.border} strokeWidth="1" />}
        {dots.map((d, i) => <circle key={i} cx={d.cx} cy={d.cy} r="4.5" fill={COLORS.accent} stroke="#FFFFFF" strokeWidth="1" />)}
        {mirrorZone && makeup === "si" && <circle cx={mirrorZone.x + mirrorZone.w / 2} cy={mirrorZone.y + mirrorZone.h / 2} r="5" fill="#F4B942" stroke="#FFFFFF" strokeWidth="1.2" />}
      </svg>
      <p className="font-body text-[14px] text-center mt-1.5 leading-relaxed" style={{ color: COLORS.subtext }}>
        Esquema orientativo, no a escala.{mirrorZone ? " Zona azulada: espejo." : ""}
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
  const { tempK, lumens, downlights, area, lux, tips, mistakes } = generateLivingReport(answers);
  const { Icon } = room;
  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: "0 2px 12px rgba(46,42,39,0.05)" }}>
      <button onClick={onToggle} className="w-full flex items-center gap-4 p-5 text-left">
        <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#F3E9D8" }}>
          <Icon size={19} color={COLORS.accent} strokeWidth={1.6} />
        </div>
        <div className="flex-1">
          <p className="font-body text-[14.5px] font-medium" style={{ color: COLORS.text }}>{room.label}</p>
          <p className="font-body text-[14px]" style={{ color: COLORS.subtext }}>Informe técnico de iluminación</p>
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

          <CalculationBlock area={area} lux={lux} lumens={lumens} downlights={downlights} />

          <div>
            <p className="font-body text-[13px] tracking-[0.12em] uppercase mb-2.5" style={{ color: COLORS.accent }}>Plano orientativo</p>
            <div className="rounded-xl p-4" style={{ backgroundColor: COLORS.bg }}>
              <LivingFloorPlan
                activities={answers.activities}
                goals={answers.goals}
                downlights={downlights}
                diningShape={answers.diningShape}
                diningPendant={answers.diningPendant}
              />
            </div>
          </div>

          <div>
            <p className="font-body text-[13px] tracking-[0.12em] uppercase mb-2.5" style={{ color: COLORS.accent }}>Recomendaciones profesionales</p>
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
  const { tempK, lumens, downlights, area, lux, distribution, narrative, mistakes } = generateKitchenReport(answers);
  const { Icon } = room;
  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: "0 2px 12px rgba(46,42,39,0.05)" }}>
      <button onClick={onToggle} className="w-full flex items-center gap-4 p-5 text-left">
        <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#F3E9D8" }}>
          <Icon size={19} color={COLORS.accent} strokeWidth={1.6} />
        </div>
        <div className="flex-1">
          <p className="font-body text-[14.5px] font-medium" style={{ color: COLORS.text }}>{room.label}</p>
          <p className="font-body text-[14px]" style={{ color: COLORS.subtext }}>Informe técnico de iluminación</p>
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

          <CalculationBlock area={area} lux={lux} lumens={lumens} downlights={downlights} />

          <div>
            <p className="font-body text-[13px] tracking-[0.12em] uppercase mb-2.5" style={{ color: COLORS.accent }}>Plano orientativo</p>
            <div className="rounded-xl p-4" style={{ backgroundColor: COLORS.bg }}>
              <KitchenFloorPlan layout={answers.layout} downlights={downlights} />
            </div>
          </div>

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
          {room.id === "hallway" && (
            <div className="rounded-xl p-4 mb-1" style={{ backgroundColor: COLORS.bg }}>
              <p className="font-body text-[13px] tracking-[0.12em] uppercase mb-2.5" style={{ color: COLORS.accent }}>Plano orientativo</p>
              <HallwayFloorPlan length={answers.length} sensor={answers.sensor} />
            </div>
          )}
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
  const { tempK, lumens, downlights, area, lux, tips, mistakes } = generateGenericTechnicalReport(room.id, answers);
  const { Icon } = room;
  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: "0 2px 12px rgba(46,42,39,0.05)" }}>
      <button onClick={onToggle} className="w-full flex items-center gap-4 p-5 text-left">
        <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#F3E9D8" }}>
          <Icon size={19} color={COLORS.accent} strokeWidth={1.6} />
        </div>
        <div className="flex-1">
          <p className="font-body text-[14.5px] font-medium" style={{ color: COLORS.text }}>{room.label}</p>
          <p className="font-body text-[14px]" style={{ color: COLORS.subtext }}>Informe técnico de iluminación</p>
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

          <CalculationBlock area={area} lux={lux} lumens={lumens} downlights={downlights} />

          {room.id === "dining" && (
            <div>
              <p className="font-body text-[13px] tracking-[0.12em] uppercase mb-2.5" style={{ color: COLORS.accent }}>Plano orientativo</p>
              <div className="rounded-xl p-4" style={{ backgroundColor: COLORS.bg }}>
                <DiningFloorPlan shape={answers.shape} pendant={answers.pendant} seats={answers.seats} />
              </div>
            </div>
          )}

          {room.id === "bathroom" && (
            <div>
              <p className="font-body text-[13px] tracking-[0.12em] uppercase mb-2.5" style={{ color: COLORS.accent }}>Plano orientativo</p>
              <div className="rounded-xl p-4" style={{ backgroundColor: COLORS.bg }}>
                <BathroomFloorPlan type={answers.type} fixture={answers.fixture} />
              </div>
            </div>
          )}

          {room.id === "bedroom" && (
            <div>
              <p className="font-body text-[13px] tracking-[0.12em] uppercase mb-2.5" style={{ color: COLORS.accent }}>Plano orientativo</p>
              <div className="rounded-xl p-4" style={{ backgroundColor: COLORS.bg }}>
                <BedroomFloorPlan activities={answers.activities} closetType={answers.closetType} closetLight={answers.closetLight} downlights={downlights} />
              </div>
            </div>
          )}

          {room.id === "closet" && (
            <div>
              <p className="font-body text-[13px] tracking-[0.12em] uppercase mb-2.5" style={{ color: COLORS.accent }}>Plano orientativo</p>
              <div className="rounded-xl p-4" style={{ backgroundColor: COLORS.bg }}>
                <ClosetFloorPlan type={answers.type} mirror={answers.mirror} makeup={answers.makeup} downlights={downlights} />
              </div>
            </div>
          )}

          {room.id === "terrace" && (
            <div>
              <p className="font-body text-[13px] tracking-[0.12em] uppercase mb-2.5" style={{ color: COLORS.accent }}>Zonas a iluminar</p>
              <div className="rounded-xl p-4" style={{ backgroundColor: COLORS.bg }}>
                <TerraceZoneScheme activities={answers.activities} covered={answers.covered} night={answers.night} />
              </div>
            </div>
          )}

          <div>
            <p className="font-body text-[13px] tracking-[0.12em] uppercase mb-2.5" style={{ color: COLORS.accent }}>Recomendaciones profesionales</p>
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

const GENERIC_TECH_ROOMS = ["bedroom", "bathroom", "dining", "closet", "terrace"];

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
        className="w-full flex items-center justify-center font-body font-medium text-[14px] rounded-xl py-3.5 transition-all duration-200"
        style={{ backgroundColor: COLORS.primary, color: "#FFFFFF", boxShadow: "0 8px 20px rgba(111,94,77,0.25)" }}
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
        <button onClick={onNewPlan} className="w-full flex items-center justify-center gap-2 font-body font-medium text-[15px] tracking-wide rounded-2xl py-4 transition-all duration-200" style={{ backgroundColor: COLORS.primary, color: "#FFFFFF", boxShadow: "0 8px 20px rgba(111,94,77,0.25)" }}>
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

function LandingNav({ onStart }) {
  return (
    <div className="sticky top-0 z-10 backdrop-blur-md" style={{ backgroundColor: "rgba(248,246,242,0.85)", borderBottom: `1px solid ${COLORS.border}` }}>
      <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.card, boxShadow: "0 4px 12px rgba(244,181,66,0.35)" }}>
            <Lightbulb size={15} color="#F4B942" fill="#FFDE8A" strokeWidth={1.4} />
          </div>
          <span className="font-body text-[15px] font-semibold tracking-wide" style={{ color: COLORS.text }}>Nemul</span>
        </div>
        <button
          onClick={onStart}
          className="font-body text-[13.5px] font-medium rounded-full px-5 py-2.5 transition-all duration-200"
          style={{ backgroundColor: COLORS.primary, color: "#FFFFFF" }}
        >
          Empieza gratis
        </button>
      </div>
    </div>
  );
}

function LandingHero({ onStart }) {
  return (
    <section className="max-w-3xl mx-auto px-6 pt-16 pb-14 text-center">
      <div className="relative w-24 h-24 mx-auto mb-8 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full glow-orb" style={{ background: "radial-gradient(circle, #FFC94Db3 0%, #FFC94D33 45%, transparent 72%)" }} />
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.card, boxShadow: "0 8px 24px rgba(244,181,66,0.45)" }}>
          <Lightbulb size={26} color="#F4B942" fill="#FFDE8A" strokeWidth={1.4} />
        </div>
      </div>
      <p className="font-body text-[13px] tracking-[0.25em] uppercase mb-4" style={{ color: COLORS.accent }}>Nemul</p>
      <h1 className="font-display text-[40px] md:text-[52px] leading-[1.1] font-medium mb-5" style={{ color: COLORS.text }}>
        La forma más sencilla de diseñar la iluminación de tu hogar.
      </h1>
      <p className="font-body text-[16px] md:text-[17px] leading-relaxed max-w-xl mx-auto mb-9" style={{ color: COLORS.subtext }}>
        Recibe recomendaciones profesionales en pocos minutos. Sin conocimientos técnicos.
      </p>
      <button
        onClick={onStart}
        className="font-body font-medium text-[15px] tracking-wide rounded-2xl px-8 py-4 transition-all duration-200"
        style={{ backgroundColor: COLORS.primary, color: "#FFFFFF", boxShadow: "0 10px 26px rgba(111,94,77,0.3)" }}
      >
        ✨ Empieza gratis
      </button>
      <p className="font-body text-[12.5px] mt-3.5" style={{ color: COLORS.subtext }}>
        Sin registro. Sin compromiso. Informe gratuito en pocos minutos.
      </p>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    { n: "1", title: "Elige una estancia", text: "Salón, cocina, dormitorio... empieza por el espacio que más te importa ahora mismo." },
    { n: "2", title: "Responde unas preguntas sencillas", text: "Nada de términos técnicos: te preguntamos cómo vives ese espacio, no cómo diseñar luz." },
    { n: "3", title: "Recibe tu estudio de iluminación", text: "Temperatura, lúmenes, distribución de focos y consejos, explicados en lenguaje simple." },
  ];
  return (
    <section className="max-w-4xl mx-auto px-6 py-14">
      <h2 className="font-display text-[28px] font-medium text-center mb-10" style={{ color: COLORS.text }}>¿Cómo funciona?</h2>
      <div className="grid md:grid-cols-3 gap-5">
        {steps.map((s) => (
          <div key={s.n} className="rounded-2xl p-6" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: "0 2px 12px rgba(46,42,39,0.05)" }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center mb-4 font-body text-[14px] font-semibold" style={{ backgroundColor: "#F3E9D8", color: COLORS.accent }}>
              {s.n}
            </div>
            <p className="font-body text-[15px] font-medium mb-2" style={{ color: COLORS.text }}>{s.title}</p>
            <p className="font-body text-[13.5px] leading-relaxed" style={{ color: COLORS.subtext }}>{s.text}</p>
          </div>
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

const REPORT_PREVIEW_ITEMS = [
  "Luz necesaria según los m²",
  "Temperatura de color",
  "Distribución de luminarias",
  "Capas de iluminación",
  "Errores a evitar",
  "Recomendaciones profesionales",
];

function ProductShowcaseSection() {
  return (
    <section className="max-w-md mx-auto px-6 py-14">
      <h2 className="font-display text-[28px] font-medium text-center mb-3" style={{ color: COLORS.text }}>¿Qué vas a recibir con Nemul?</h2>
      <p className="font-body text-[13px] tracking-wide text-center mb-6" style={{ color: COLORS.accent }}>
        Vista previa del informe (resumen)
      </p>
      <div className="rounded-2xl p-6" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: "0 12px 32px rgba(46,42,39,0.08)" }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#F3E9D8" }}>
            <Sofa size={18} color={COLORS.accent} strokeWidth={1.6} />
          </div>
          <div>
            <p className="font-body text-[14px] font-medium" style={{ color: COLORS.text }}>Ejemplo: Salón</p>
            <p className="font-body text-[12px]" style={{ color: COLORS.subtext }}>Informe técnico de iluminación</p>
          </div>
        </div>
        <div>
          {REPORT_PREVIEW_ITEMS.map((label, i) => <PreviewRow key={i} label={label} />)}
        </div>
      </div>
      <p className="font-body text-[12.5px] text-center mt-5 leading-relaxed" style={{ color: COLORS.subtext }}>
        El informe completo incluye todos los cálculos, recomendaciones y explicaciones para cada estancia.
      </p>
    </section>
  );
}

function CredentialSection() {
  return (
    <section className="max-w-2xl mx-auto px-6 py-14 text-center">
      <div className="w-14 h-14 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ backgroundColor: "#F3E9D8" }}>
        <Sparkles size={22} color={COLORS.accent} strokeWidth={1.6} />
      </div>
      <p className="font-display text-[22px] font-medium mb-3" style={{ color: COLORS.text }}>Creado por Dayami, diseñadora de interiores</p>
      <p className="font-body text-[14.5px] leading-relaxed" style={{ color: COLORS.subtext }}>
        Aplica criterios profesionales de interiorismo y los explica de forma sencilla para ayudarte a tomar mejores decisiones.
      </p>
    </section>
  );
}

function AccessSection({ onStart }) {
  return (
    <section className="max-w-2xl mx-auto px-6 py-14 text-center">
      <div className="rounded-2xl p-8" style={{ backgroundColor: "#F3E9D8", border: `1px solid #C1A16B55` }}>
        <p className="font-body text-[12px] tracking-[0.2em] uppercase mb-3" style={{ color: COLORS.primary }}>Acceso</p>
        <p className="font-display text-[22px] font-medium mb-3" style={{ color: COLORS.text }}>Empieza gratis con una habitación</p>
        <p className="font-body text-[14px] leading-relaxed mb-6" style={{ color: COLORS.subtext }}>
          Prueba Nemul sin coste en el espacio que más te importe ahora. Muy pronto abriremos el acceso a toda la vivienda.
        </p>
        <button
          onClick={onStart}
          className="font-body font-medium text-[14.5px] rounded-2xl px-7 py-3.5 transition-all duration-200"
          style={{ backgroundColor: COLORS.primary, color: "#FFFFFF", boxShadow: "0 8px 20px rgba(111,94,77,0.25)" }}
        >
          Empieza gratis
        </button>
      </div>
    </section>
  );
}

function LandingGuideSection() {
  return (
    <section className="max-w-2xl mx-auto px-6 py-14">
      <p className="font-body text-[12px] tracking-[0.2em] uppercase text-center mb-4" style={{ color: COLORS.accent }}>¿Quieres aprender más?</p>
      <div className="rounded-2xl p-6" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: "0 2px 12px rgba(46,42,39,0.05)" }}>
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#F3E9D8" }}>
            <BookOpen size={19} color={COLORS.accent} strokeWidth={1.6} />
          </div>
          <div className="flex-1">
            <p className="font-display text-[18px] font-medium mb-1" style={{ color: COLORS.text }}>Guía Profesional de Iluminación</p>
            <p className="font-body text-[13px] leading-relaxed mb-4" style={{ color: COLORS.subtext }}>
              Aprende a iluminar cualquier estancia como un profesional, con ejemplos reales y consejos prácticos.
            </p>
            <a
              href="https://www.etsy.com/es/listing/4427720777/guia-de-iluminacion-del-hogar-consejos?ref=share_ios_native_control"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block font-body font-medium text-[13.5px] rounded-xl px-5 py-2.5"
              style={{ backgroundColor: COLORS.primary, color: "#FFFFFF" }}
            >
              Ver en Etsy
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left">
        <span className="font-body text-[14px] font-medium" style={{ color: COLORS.text }}>{q}</span>
        <ChevronDown size={16} color={COLORS.subtext} style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }} />
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="font-body text-[13.5px] leading-relaxed" style={{ color: COLORS.subtext }}>{a}</p>
        </div>
      )}
    </div>
  );
}

function FAQSection() {
  const faqs = [
    { q: "¿Necesito saber de iluminación para usar Nemul?", a: "No. Todas las preguntas están pensadas para cualquier persona, sin necesidad de conocer términos técnicos. Nemul se encarga de la parte profesional por ti." },
    { q: "¿Nemul sustituye a un electricista?", a: "No. Las recomendaciones son orientativas; para la instalación eléctrica siempre debes consultar a un profesional certificado." },
    { q: "¿Cuántas habitaciones puedo probar gratis?", a: "Una habitación completa, sin ningún coste. Muy pronto abriremos el acceso a toda la vivienda." },
    { q: "¿Cómo sé cuándo esté disponible el acceso completo?", a: "Al intentar entrar a otra habitación te ofrecemos dejar tu email para avisarte en cuanto esté listo." },
  ];
  return (
    <section id="faq" className="max-w-2xl mx-auto px-6 py-14">
      <h2 className="font-display text-[26px] font-medium text-center mb-8" style={{ color: COLORS.text }}>Preguntas frecuentes</h2>
      <div className="flex flex-col gap-3">
        {faqs.map((f, i) => <FAQItem key={i} q={f.q} a={f.a} />)}
      </div>
    </section>
  );
}

function LandingFooter() {
  const [showPrivacy, setShowPrivacy] = useState(false);
  return (
    <footer className="border-t" style={{ borderColor: COLORS.border }}>
      <div className="max-w-2xl mx-auto px-6 py-10 text-center">
        <p className="font-body text-[12px] leading-relaxed mb-5" style={{ color: COLORS.subtext }}>
          Estas recomendaciones son orientativas. Para la instalación eléctrica, consulta siempre a un profesional certificado.
        </p>
        <div className="flex items-center justify-center gap-5 mb-5 flex-wrap">
          <a href="#faq" className="font-body text-[13px] font-medium" style={{ color: COLORS.text }}>Preguntas frecuentes</a>
          <a href="mailto:digitaldma2026@gmail.com" className="font-body text-[13px] font-medium" style={{ color: COLORS.text }}>Contacto</a>
          <button onClick={() => setShowPrivacy((s) => !s)} className="font-body text-[13px] font-medium" style={{ color: COLORS.text }}>Política de privacidad</button>
        </div>
        {showPrivacy && (
          <div className="rounded-xl p-6 text-left mb-5 flex flex-col gap-4" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
            <div>
              <p className="font-body text-[13.5px] font-medium mb-1.5" style={{ color: COLORS.text }}>Qué datos recopilamos</p>
              <p className="font-body text-[12.5px] leading-relaxed" style={{ color: COLORS.subtext }}>
                Nemul solo te pide tu email si tú decides dejarlo voluntariamente en la pantalla de acceso Premium, para avisarte cuando esa función esté disponible. No pedimos contraseña, datos de pago, ni ningún otro dato personal para usar la habitación gratuita.
              </p>
            </div>
            <div>
              <p className="font-body text-[13.5px] font-medium mb-1.5" style={{ color: COLORS.text }}>Cómo lo usamos</p>
              <p className="font-body text-[12.5px] leading-relaxed" style={{ color: COLORS.subtext }}>
                Únicamente para enviarte un aviso relacionado con el acceso Premium. No lo usamos para ningún otro fin, y no lo compartimos, vendemos ni cedemos a terceros bajo ninguna circunstancia.
              </p>
            </div>
            <div>
              <p className="font-body text-[13.5px] font-medium mb-1.5" style={{ color: COLORS.text }}>Dónde se guarda</p>
              <p className="font-body text-[12.5px] leading-relaxed" style={{ color: COLORS.subtext }}>
                Tu email se almacena de forma segura en Formspree, el servicio que usamos para gestionar este formulario de interés.
              </p>
            </div>
            <div>
              <p className="font-body text-[13.5px] font-medium mb-1.5" style={{ color: COLORS.text }}>Almacenamiento en tu propio dispositivo</p>
              <p className="font-body text-[12.5px] leading-relaxed" style={{ color: COLORS.subtext }}>
                Para que Nemul funcione bien, guardamos cierta información directamente en tu navegador (no en nuestros servidores): qué habitación probaste gratis y los planes que decidas guardar. Esta información se queda únicamente en tu dispositivo, nunca se nos envía, y puedes borrarla en cualquier momento eliminando los datos de navegación de tu navegador.
              </p>
            </div>
            <div>
              <p className="font-body text-[13.5px] font-medium mb-1.5" style={{ color: COLORS.text }}>Cookies</p>
              <p className="font-body text-[12.5px] leading-relaxed" style={{ color: COLORS.subtext }}>
                Nemul no utiliza cookies de seguimiento ni analíticas de terceros en esta versión.
              </p>
            </div>
            <div>
              <p className="font-body text-[13.5px] font-medium mb-1.5" style={{ color: COLORS.text }}>Tus derechos</p>
              <p className="font-body text-[12.5px] leading-relaxed" style={{ color: COLORS.subtext }}>
                Puedes pedirnos en cualquier momento que eliminemos tu email de nuestros registros escribiendo a <a href="mailto:digitaldma2026@gmail.com" style={{ color: COLORS.accent }}>digitaldma2026@gmail.com</a>.
              </p>
            </div>
            <div>
              <p className="font-body text-[13.5px] font-medium mb-1.5" style={{ color: COLORS.text }}>Cambios futuros</p>
              <p className="font-body text-[12.5px] leading-relaxed" style={{ color: COLORS.subtext }}>
                Si en el futuro añadimos cuentas de usuario, pagos u otro tratamiento de datos, actualizaremos esta política y te lo indicaremos claramente aquí.
              </p>
            </div>
          </div>
        )}
        <p className="font-body text-[11.5px]" style={{ color: COLORS.subtext }}>© {new Date().getFullYear()} Nemul</p>
      </div>
    </footer>
  );
}

function LandingPage({ onStart }) {
  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: COLORS.bg }}>
      <style>{FONT_STYLE}</style>
      <LandingNav onStart={onStart} />
      <LandingHero onStart={onStart} />
      <HowItWorksSection />
      <ProductShowcaseSection />
      <CredentialSection />
      <AccessSection onStart={onStart} />
      <LandingGuideSection />
      <FAQSection />
      <LandingFooter />
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
      setScreen("premiumGate");
      return;
    }
    if (!freeRoomId) setFreeRoomId(chosenId);
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
    setTimeout(() => setSaved(false), 2200);
  };

  const openPlan = (id) => { setViewingPlanId(id); setScreen("planDetail"); };
  const deletePlan = (id) => setSavedPlans((prev) => prev.filter((p) => p.id !== id));

  const roomEyebrow = selectedRooms.length > 1 && currentRoom
    ? `${currentRoom.label} · Espacio ${roomIndex + 1} de ${selectedRooms.length}`
    : currentRoom?.label;

  const viewingPlan = savedPlans.find((p) => p.id === viewingPlanId);

  if (screen === "landing") {
    return <LandingPage onStart={() => setScreen("welcome")} />;
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
