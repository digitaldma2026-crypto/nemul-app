import { useState, useEffect, useRef } from "react";
import { track as vercelTrack } from "@vercel/analytics/react";

// gaEvent ya estaba protegido con try/catch —"la analítica nunca debe romper la
// experiencia"— pero track() de Vercel se llamaba a pelo. Y varios botones
// hacen track(...) y justo después cambian de pantalla: si track() falla (un
// bloqueador de anuncios, la protección antiseguimiento del móvil, la red),
// la excepción corta el manejador y el cambio de pantalla nunca ocurre. El
// botón parece muerto: lo pulsas y no pasa nada. Envolverlo aquí arregla de
// una vez todas las llamadas del archivo.
function track(name, params) {
  try {
    vercelTrack(name, params);
  } catch (e) {
    // silencioso, a propósito
  }
}

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
// jspdf y html2canvas pesan bastante y solo hacen falta cuando alguien pulsa
// "Descargar informe en PDF". Se cargan en ese momento (ver
// downloadReportAsPdf), no al abrir la web, para que la primera visita sea
// más ligera.
import {
  Sofa, ChefHat, BedDouble, Bath, UtensilsCrossed, DoorOpen, Shirt, TreePine,
  ArrowLeft, Check, ChevronRight, ChevronDown, Sun, Moon, CloudSun, Lightbulb,
  Sparkles, BookOpen, Users, Coffee, Plus, Trash2, Home as HomeIcon,
  Package, Palette, Wind, Tv, Briefcase, Droplets, Zap, Laptop, Lamp, X, Hammer, Info, Pencil, Lock, Download,
} from "lucide-react";

/* ---------------------------------------------------------------------------
 * SISTEMA DE DISEÑO NEMUL
 *
 * Un solo sitio donde se decide cómo se ve todo. Si algo hay que cambiarlo
 * (un color, un tamaño de texto, un radio), se cambia aquí y cambia en toda
 * la app. Nada de valores sueltos repartidos por el archivo.
 *
 * Principios: superficie plana, un único acento, y que el peso visual lo
 * lleven el espacio en blanco y la tipografía — no las sombras.
 * ------------------------------------------------------------------------- */

const COLORS = {
  bg: "#FAF6EF",       // Crema — fondo de toda la marca
  bgAlt: "#E8DFD3",    // Beige — bloques y bandas secundarias
  card: "#FFFFFF",
  text: "#3A2E22",     // Marrón casi negro — 12,2:1 sobre crema
  subtext: "#6B5744",  // Marrón tierra — 6,3:1 sobre crema (antes fallaba)
  primary: "#3A2E22",  // Énfasis y estado seleccionado
  accent: "#6B5744",   // Rótulos e iconos (antes dorado #C1A16B, 2,3:1)
  bulb: "#F2B84B",     // Amarillo bombilla — SOLO CTA, checks y señales de luz
  bulbInk: "#3A2E22",  // Texto sobre el amarillo — 7,4:1
  success: "#5C6B53",
  warning: "#8C4A32",
  border: "#E7DFD3",
};

/* Escala tipográfica: 7 pasos, ni uno más. Antes había 18 tamaños distintos
 * con medios píxeles, que es la razón principal de que nada "encajara". */
const FONT_STYLE = `
  .font-display { font-family: 'Cormorant Garamond', Georgia, serif; }
  .font-body { font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif; }

  .t-caption { font-size: 12px;  line-height: 1.5; }
  .t-small   { font-size: 13px;  line-height: 1.55; }
  .t-body    { font-size: 15px;  line-height: 1.6; }
  .t-lead    { font-size: 18px;  line-height: 1.55; }
  .t-title   { font-size: 22px;  line-height: 1.3; }
  .t-display { font-size: 28px;  line-height: 1.2; }
  .t-hero    { font-size: 34px;  line-height: 1.15; }
  @media (min-width: 768px) {
    .t-lead  { font-size: 19px; }
    .t-hero  { font-size: 48px; }
  }

  /* Rótulo en versalitas: el patrón que se repite encima de cada título */
  .t-eyebrow {
    font-size: 12px; line-height: 1.4;
    letter-spacing: 0.18em; text-transform: uppercase; font-weight: 500;
  }

  /* Foco visible para navegación por teclado. Antes no había ninguno. */
  :focus-visible {
    outline: 2px solid ${COLORS.text};
    outline-offset: 2px;
    border-radius: 4px;
  }

  /* Deja respirar el botón de acción sobre la barra de gestos del móvil. */
  .screen-actions { padding-bottom: max(20px, env(safe-area-inset-bottom)); }
  .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
  .no-scrollbar::-webkit-scrollbar { display: none; }
  @keyframes option-in {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .option-in { animation: option-in 0.35s cubic-bezier(0.22,1,0.36,1) both; }
  .check-pop { animation: option-in 0.2s ease-out both; }
  /* Una sola transición para todo lo interactivo, sin desplazamientos. */
  .tap-scale { transition: border-color 0.18s ease, background-color 0.18s ease, opacity 0.18s ease; }
  .tap-scale:active { opacity: 0.7; }
  @keyframes rise-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .rise-in { animation: rise-in 0.4s cubic-bezier(0.22,1,0.36,1) both; }
  @keyframes toast-in {
    from { opacity: 0; transform: translate(-50%, 8px); }
    to { opacity: 1; transform: translate(-50%, 0); }
  }
  .toast-in { animation: toast-in 0.3s ease-out both; }
  @media (prefers-reduced-motion: reduce) {
    .rise-in, .toast-in, .option-in, .check-pop { animation: none; }
    /* El centrado del aviso vivía dentro de la animación: sin ella se iba
       al lado derecho de la pantalla. */
    .toast-in { transform: translate(-50%, 0); }
    .tap-scale:active { opacity: 1; }
  }
`;

const ROOMS = [
  { id: "living", label: "Salón", Icon: Sofa },
  /* Salón y salón-comedor vuelven a ser dos estancias distintas, y no es solo
   * una etiqueta: al elegir "Salón-comedor" Nemul ya sabe desde el principio
   * que hay dos zonas principales —zona de estar y zona de comedor— y usa ese
   * dato después, al montar las capas de luz. En "Salón" no se da por supuesta
   * ninguna zona de comedor: si alguien come ahí, elige la otra estancia. */
  { id: "livingDining", label: "Salón-comedor", Icon: Sofa },
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
  { id: "dentro", label: "Sí, por dentro" },
  { id: "delante", label: "Sí, por delante" },
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

/* Lo que Nemul nunca había preguntado y llevaba tiempo dando por supuesto.
 *
 * "¿Qué tipo de techo tienes?" pregunta por la construcción —si hay cámara
 * para empotrar—, no por si ahí arriba hay luz. Son cosas distintas: el techo
 * liso es el más común en España y casi siempre lleva un plafón colgando.
 * Sin esta pregunta, el informe proponía una retícula de downlights a quien
 * no tiene ni un punto, y hablaba de "los puntos de luz que ya tienes" sin
 * haber preguntado nunca si existían.
 *
 * Tres respuestas y no un número exacto a propósito: quien contesta está de
 * pie en su habitación mirando al techo, no contando agujeros. */
const CEILING_POINTS_OPTIONS = [
  { id: "no", label: "No tengo" },
  { id: "uno", label: "Sí, uno" },
  { id: "varios", label: "Sí, varios" },
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
  // Decía "la propuesta se adapta a los puntos de luz que ya existen", y no es
  // verdad: el cálculo y el plano dibujan la distribución ideal para los m² de
  // la estancia, sin saber dónde están los puntos actuales. Prometer que se
  // adapta y enseñar debajo una retícula de seis focos deja a quien lo lee
  // pensando que tiene que abrir seis agujeros. Ahora se dice lo que es.
  onlyLights: "Como solo vas a cambiar las luminarias, toma el cálculo y el plano como el objetivo a alcanzar, no como una obra a ejecutar: indican cuánta luz necesita la estancia y cómo debería repartirse. Con los puntos de luz que ya tienes, acércate a ese reparto sin tocar la instalación — un plafón sustituido por un foco orientable, un carril o una suspensión múltiple en el punto existente, y lámparas de pie o de mesa en las zonas donde el plano pide luz y no llega ningún punto.",
};

const BEDROOM_RENOVATION_INSIGHT = {
  onlyLights: "Como solo vas a cambiar las luminarias, esto no es una obra a ejecutar sino el objetivo de luz que hay que alcanzar: sustituye lo que cuelga de los puntos que ya tienes por luminarias que den el flujo indicado, y resuelve la cabecera con lámparas de mesita, apliques o colgantes, que no piden instalación nueva.",
  renovation: "Como vas a reformar, aprovecha para dejar la luz general y la de la cabecera en circuitos separados: poder encender solo las mesitas es lo que convierte el dormitorio en una habitación de descanso por la noche.",
};

const STYLE_OPTIONS = [
  { id: "acogedor", label: "Muy acogedor", hint: "Luz cálida y suave, ideal para relajarte", Icon: Moon },
  { id: "equilibrado", label: "Equilibrado", hint: "Ni muy tenue ni muy intenso, para el día a día", Icon: Sparkles },
  { id: "luminoso", label: "Muy luminoso", hint: "Luz blanca y clara, como de pleno día", Icon: Sun },
];

/* TEMP_BY_STYLE se retiró con la pregunta de objetivos del salón: era la
 * tabla que convertía "acogedor/equilibrado/luminoso" en kelvin, y el salón
 * era su único cliente. STYLE_OPTIONS sigue vivo porque la cocina abierta lo
 * usa para preguntar por el ambiente del salón contiguo, pero eso solo
 * produce consejos, no temperatura. */
// La bombilla de toda la vida, que sirve para explicar qué es un lumen. No es
// la luminaria del proyecto: esa la decide la retícula (ver planLayout).
const REFERENCE_BULB_LM = 800;
const REFERENCE_BULB_W = 8;

// Criterio de reparto de downlights: de 1,20 a 1,50 m entre centros, y unos
// 60-75 cm a las paredes como punto de partida.
// Entre focos: 1,20-1,50 m es la franja objetivo.
const SPACING_MIN = 1.2;
const SPACING_MAX = 1.5;

// A pared: 60-75 cm es lo recomendado, y 45-90 cm el margen excepcional. Los
// dos extremos son topes duros, no penalizaciones: fuera de ahí no se estira
// el margen, se cambia el número de puntos.
//
// Los 45 cm de suelo no son un descuido. En un eje corto —una cocina o un baño
// de 2,07 m de fondo— obligar a 60 cm deja los focos a 87 cm entre sí, o sea
// una retícula apretada sin motivo. Poder bajar a 45 le da aire al cálculo y
// saca una distribución más lógica en esas estancias estrechas.
const WALL_MARGIN_ABS_MIN = 0.45;
const WALL_MARGIN_MIN = 0.6;
const WALL_MARGIN_MAX = 0.75;
const WALL_MARGIN_ABS_MAX = 0.9;
const WALL_MARGIN_STEP = 0.05;

/* Reparto de las estancias de estar (salón y salón-comedor). Ver openPlanLayout.
 *
 * Exigir 1,20-1,50 m en cada eje por separado no deja elegir: cada foco acaba
 * cubriendo entre 1,44 y 2,25 m², así que un salón de 20 m² cae por aritmética
 * entre 9 y 14 puntos, hagas lo que hagas con los márgenes. Los 12 focos de
 * 300 lm que salían no eran una decisión de diseño, eran la única celda de la
 * tabla. Un techo de salón con doce agujeros no es un techo limpio.
 *
 * Así que aquí la medida no es cada eje por su cuenta, sino la superficie que
 * cubre cada punto: SE_* es el lado del cuadrado equivalente. 1,26 x 1,98 m
 * reparte mejor en una estancia alargada que 1,50 x 1,50, y un eje suelto no
 * sabe decirlo. */
const SE_OPEN_MAX = 1.75;
// Con la superficie por punto como única medida, el cálculo se iba a 2,12 m
// entre focos: aprobaba de sobra en superficie y en el techo dejaba sombra.
// 1,80 y no 2,00 porque arreglar el exceso de focos abriendo la retícula hasta
// casi dos metros es cambiar un problema por el contrario. En un salón de
// 20 m² este tope es justo lo que descarta 8 focos con las filas a 1,98 m y
// deja 9 en 3x3, que es la retícula que de verdad queda limpia.
const AXIS_OPEN_MAX = 1.8;
// Y una retícula estirada —una fila de siete— también aprueba en superficie.
const GRID_ANISO_MAX = 1.6;

/* El dormitorio se reparte más suelto que el salón, y no por descuido.
 *
 * En un salón la retícula del techo ES la luz de la estancia, así que la
 * uniformidad manda. En un dormitorio es solo el fondo: quien lee lo hace con
 * la mesita, quien se viste con la luz del armario, y el techo casi siempre se
 * enciende para cruzar la habitación. Exigirle la uniformidad de un salón es
 * lo que llenaba de agujeros un cuarto de 11 m².
 *
 * Con los topes del salón, la única retícula legal en 3,92 x 2,80 m era 3 x 2:
 * el 2 x 2 pedía 2,12 m de eje (tope 1,80) y salía estirado 1,63 (tope 1,60),
 * o sea que lo descartaban por 32 cm y por tres centésimas. Con estos topes
 * entra, y son cuatro puntos en vez de seis para la misma luz. */
const BEDROOM_GRID_LIMITS = { axisMax: 2.4, seMax: 2.2, anisoMax: 1.9 };
// Por encima de 900 lm un downlight doméstico hace mancha y deslumbra: es el
// suelo del número de puntos.
const DOWNLIGHT_LM_CAP = 900;

/* Y el suelo, que faltaba. El tope de arriba obliga a poner MÁS puntos cuando
 * el total es alto; sin su pareja, nada impedía repartir un total bajo entre
 * todos los puntos que cupieran, y el número de focos quedaba decidido solo
 * por la geometría de la estancia. Con las dos cotas, la cuenta de puntos sale
 * de los lúmenes en las dos direcciones: primero cuánta luz hace falta,
 * después entre cuántos puntos tiene sentido repartirla.
 *
 * 300 lm es el flujo por debajo del cual un downlight deja de aportar luz
 * general y pasa a ser decorativo. */
const DOWNLIGHT_LM_FLOOR = 300;

/* La segunda capa del despacho: la mesa.
 *
 * Los 500 lux de la norma son el nivel de la SUPERFICIE DE TRABAJO, no el de
 * la habitación. Esa confusión es la que llenaba el techo de focos. La luz
 * general deja el despacho cómodo, y la diferencia hasta los 500 lux la pone
 * una lámpara de escritorio, que además se orienta y se apaga cuando no se
 * trabaja. */
const TASK_LUX_TARGET = 500;   // lux objetivo sobre la mesa
const TASK_AREA = 0.6;         // m² de zona de trabajo a cubrir
const TASK_UTILISATION = 0.55; // parte del flujo de la lámpara que cae ahí
const AMBIENT_TO_TASK = 0.65;  // parte del nivel general que llega al tablero

function deskTaskLamp(lux) {
  const fromAmbient = Math.round(lux * AMBIENT_TO_TASK);
  const missing = Math.max(0, TASK_LUX_TARGET - fromAmbient);
  const lm = Math.max(200, Math.round((missing * TASK_AREA) / TASK_UTILISATION / 50) * 50);
  return { fromAmbient, missing, lm };
}

// Flujos habituales de un downlight LED doméstico.
//
// Antes el foco era fijo —800 lm— y de ahí salía el número de puntos: en un
// salón de 25 m² daban seis, y para repartir seis puntos en 25 m² el plano
// tenía que separarlos 2,6 m. Eso no es una retícula, son manchas de luz con
// sombra entre medias. Ahora el orden es el de un proyecto de verdad: primero
// cuántos puntos caben con la separación correcta, y después qué foco reparte
// el total entre ellos. Salen más puntos y de menos flujo cada uno, que es
// exactamente lo que se busca.
const DOWNLIGHT_LM_STEPS = [200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900, 1000];

// Un foco de exterior no cuelga de una retícula de techo. Ver ambientLayout.
const AMBIENT_LM_PER_POINT = 400;

// Traducción a lenguaje humano: el número técnico no desaparece, pero nunca
// se queda solo. Así lo explicaría una diseñadora en persona.
// Estas descripciones acompañan al número en todas las estancias, así que
// hablan solo de la luz. Antes comparaban con una habitación concreta ("como
// la de una cocina moderna") y ese mismo texto salía en el dormitorio o en el
// baño. El porqué de esa temperatura en esta estancia se explica después, en
// la recomendación de diseño, que sí conoce las respuestas del cuestionario.
const TEMP_HUMAN = {
  2700: "Luz cálida, ideal para crear un ambiente acogedor y relajante.",
  3000: "Luz cálida con un equilibrio entre confort y funcionalidad.",
  3500: "Luz blanco cálido-neutro, adecuada para espacios versátiles y de uso diario.",
  4000: "Luz blanca neutra, que mejora la visibilidad y la percepción de los detalles.",
};
function describeTempK(tempK) {
  return TEMP_HUMAN[tempK] || "Un tono de luz equilibrado para el uso diario.";
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
  /* El salón bajó de 150-200 a 130-170 cuando la luz general dejó de ser toda
   * la luz de la estancia.
   *
   * Los 175 lm/m² de antes son el valor correcto para un salón cuyo techo hace
   * todo el trabajo: rondan los 74 lux medios en el suelo, el techo de la
   * banda ambiental. Con el pie de lectura, la lámpara de ambiente y el acento
   * como capas propias, el techo solo tiene que resolver el fondo —entrar,
   * cruzar, estar—, y eso son 55-65 lux.
   *
   * No es un número inventado: es la misma escala que ya usa el dormitorio,
   * que resolvió esto antes por la misma razón (la cabecera hace su parte).
   * El despacho hizo lo propio al separar la luz de la mesa. En el informe
   * sigue llamándose "Iluminación general" y nunca "ambiental": esa palabra
   * ya es de la capa "Lámpara de ambiente" y confundiría las dos. */
  living: { bright: 130, moderate: 150, low: 170 },
  livingDining: { bright: 130, moderate: 150, low: 170 },
  kitchen: { bright: 300, moderate: 350, low: 400 },
  kitchenOpen: { bright: 300, moderate: 350, low: 400 },
  bedroom: { bright: 130, moderate: 150, low: 170 },
  /* El baño bajó de 225-300 a 180-230 al separar la capa del espejo.
   *
   * El número viejo no estaba mal como cifra: un baño refleja mucho —azulejo,
   * espejo, sanitarios blancos— y 250 lm/m² dan unos 135 lux, dentro de la
   * banda. Lo que estaba mal es que TODO salía del techo, incluida la luz de
   * la cara. Y un downlight cenital no ilumina una cara: la ilumina desde
   * arriba, que es justo lo que la propia lista de errores del baño desaconseja.
   * Ahora el techo hace de fondo y el espejo tiene sus apliques. */
  bathroom: { bright: 180, moderate: 200, low: 230 },
  dining: { bright: 175, moderate: 200, low: 225 },
  closet: { bright: 225, moderate: 250, low: 275 },
  terrace: { bright: 80, moderate: 100, low: 120 },
  // El despacho tiene DOS capas y esta tabla solo calcula la primera: la luz
  // general de la estancia. Antes ponía 300-400 lm/m², que son los 500 lux que
  // la norma pide sobre la superficie de trabajo aplicados a la habitación
  // entera. En 9 m² eso pedía 3.200 lm y el techo acababa con seis downlights
  // para iluminar un escritorio de medio metro cuadrado. Los lux de la mesa se
  // resuelven con luz de tarea (ver deskTaskLamp), no subiendo la retícula.
  office: { bright: 200, moderate: 225, low: 250 },
};
function getLux(roomId, light) {
  const table = ROOM_LUX_BY_LIGHT[roomId] || {};
  return table[light] ?? table.moderate ?? 200;
}

/* ---------------------------------------------------------------------------
 * LAS MEDIDAS DE LA ESTANCIA
 *
 * Antes se preguntaba el tamaño por tramos —pequeño, mediano, grande— y de ahí
 * salían unos m² de tabla. Con los m² solos, la FORMA había que inventarla:
 * PLAN_ASPECT daba por hecho que toda estancia es un rectángulo de proporción
 * 1,4, y sobre ese rectángulo inventado se calculaba la retícula, el corte
 * entre zonas y el plano. Un salón de 20 m² que en realidad es un pasillo de
 * 8 x 2,5 m recibía la retícula de uno de 5,3 x 3,8.
 *
 * Ahora se piden las dos medidas. Cuestan un poco más de teclear que tocar un
 * botón, y a cambio el cálculo deja de suponer nada sobre la forma.
 *
 * Los tramos siguen en el código porque los planes ya guardados los tienen
 * apuntados: si no hay medidas, se usa el área del tramo y la forma vuelve a
 * estimarse como siempre. Ver roomDims y roomArea. */
const DIM_MIN_M = 1;
const DIM_MAX_M = 30;

// Quien escribe en español teclea "4,5", no "4.5". Las dos valen.
function parseDim(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : NaN;
  if (typeof v !== "string") return NaN;
  const n = parseFloat(v.replace(",", ".").trim());
  return Number.isFinite(n) ? n : NaN;
}

function dimIsValid(v) {
  const n = parseDim(v);
  return n >= DIM_MIN_M && n <= DIM_MAX_M;
}

/* Las dos medidas, ordenadas: `w` es siempre el lado largo y `d` el corto.
 * Los planos dibujan `w` en horizontal, así que una estancia alargada sale
 * apaisada mire por donde se mire, que es como se lee un plano.
 *
 * Devuelve null si faltan o no son creíbles: ahí manda el camino de siempre. */
function roomDims(answers = {}) {
  const d = answers.dims;
  if (!d || !dimIsValid(d.length) || !dimIsValid(d.width)) return null;
  const a = parseDim(d.length), b = parseDim(d.width);
  return { w: Math.max(a, b), d: Math.min(a, b), length: a, width: b };
}

// La superficie sale de las medidas cuando las hay. `fallback` es el área del
// tramo, para los planes guardados antes de este cambio.
function roomArea(answers = {}, fallback) {
  const dm = roomDims(answers);
  return dm ? Math.round(dm.w * dm.d * 10) / 10 : fallback;
}

const fmtDim = (n) => (Math.round(n * 100) / 100).toString().replace(".", ",");

// ---------- Salón ----------
/* Antes la pregunta era "¿Cómo utilizas principalmente el salón?" con seis
 * opciones, y al lado había otras dos preguntas —objetivos y problema— que
 * pedían lo mismo por otro camino. Ahora se pregunta una sola vez y en el
 * idioma de quien contesta: cómo vive el salón, no qué luminaria quiere.
 *
 * La zona de comedor ya no se pregunta aquí: la dice la estancia elegida. En
 * "Salón" no la hay, y en "Salón-comedor" la damos por sabida —preguntarla
 * sería pedir un dato que ya tenemos. Los planes antiguos que la guardaron
 * como actividad se siguen leyendo (ver hasDining en generateLivingReport). */
const LIVING_ACTIVITY_OPTIONS = [
  { id: "tv", label: "Tengo zona de televisión", Icon: Tv },
  // "aquí" y no "en el salón": la misma lista se usa en el salón-comedor.
  { id: "read", label: "Me gusta leer aquí", Icon: BookOpen },
  { id: "relax", label: "Principalmente para descansar", Icon: Sofa },
];

const SALON_SIZE_OPTIONS = [
  { id: "small", label: "Pequeño", hint: "Menos de 15 m²", area: 12 },
  { id: "medium", label: "Mediano", hint: "15–25 m²", area: 20 },
  { id: "large", label: "Grande", hint: "25–35 m²", area: 30 },
  { id: "xl", label: "Extra grande", hint: "Más de 35 m²", area: 40 },
];
const SALON_AREA_BY_SIZE = Object.fromEntries(SALON_SIZE_OPTIONS.map((o) => [o.id, o.area]));

/* El salón ya no deduce su temperatura de las respuestas.
 *
 * Antes la sacaba de tres preguntas —actividades, objetivos y problema— que
 * se pisaban entre sí: "Trabajar con el portátil" lo llevaba a 4000 K y
 * "Relajarte" a 2700, así que el tono de toda la estancia dependía de cuál
 * marcases primero. Y 4000 K en un salón casi nunca es la respuesta.
 *
 * Ahora la recomendación general es 3000 K siempre, y la calidez de 2700 se
 * reserva para las capas de ambiente cuando lleguen: así se puede tener un
 * rincón cálido sin enfriar ni calentar la habitación entera. */
const LIVING_TEMP_K = 3000;

/* ---------------------------------------------------------------------------
 * CAPAS DEL SALÓN Y DEL SALÓN-COMEDOR
 *
 * El cambio de fondo: los m² dejan de ser una superficie uniforme.
 *
 * Antes, un salón-comedor de 20 m² pedía 3.500 lm y el cálculo los repartía en
 * nueve downlights por todo el techo, mesa incluida. Eso es iluminar una mesa
 * de comedor con luz general, que es exactamente lo que no se hace: la mesa es
 * una zona funcional propia y se resuelve con su colgante.
 *
 * Ahora Nemul parte la estancia en zonas ANTES de calcular nada, y dentro de
 * cada zona reparte por capas. La regla de reparto es la del dormitorio: se
 * dimensionan primero las capas concretas —las que existen de verdad según lo
 * que ha contestado— y la general se queda con el resto. Así el reparto se
 * adapta solo: un salón con televisión y rincón de lectura tiene menos luz de
 * techo que uno sin nada de eso, porque el pie y la tira LED ya ponen su parte.
 *
 * Los porcentajes de aquí abajo son el arranque de una capa cuando esa capa
 * existe. No son cuotas que haya que rellenar siempre. */

/* La partición estar / comedor es una ESTIMACIÓN de Nemul, no un dato del
 * usuario: no sabemos el tamaño de su mesa ni dónde está, y no lo preguntamos
 * para no alargar el cuestionario. Un 30 % es lo que ocupa de verdad una mesa
 * con las sillas retiradas y paso alrededor. Los topes evitan los dos
 * absurdos: un comedor de 3,6 m² donde no cabe la mesa, y uno de 12 m² que se
 * comería el salón. Todo lo que salga de aquí se presenta como orientativo.
 * Ver ZoneSplitBlock y LivingZonePlan. */
const LIVING_DINING_AREA_SHARE = 0.3;
const LIVING_DINING_AREA_MIN = 5;
const LIVING_DINING_AREA_MAX = 9;

// Las capas concretas son piezas físicas, y una lámpara de pie da lo que da
// tenga el salón 12 o 40 m². Por eso van en lúmenes absolutos y no en
// proporción: escalar el acento con la superficie pedía tiras LED de 1.000 lm
// en un salón grande, que no es una tira LED, es otra luz general.
const LIVING_ACCENT_LM = 350;         // tira LED en el mueble de televisión
const LIVING_AMBIENT_PIECE_LM = 300;  // una lámpara de pie o de sobremesa
const LIVING_READING_LM = 450;        // el pie de lectura, regulable



// El colgante resuelve la mesa; el resto de la zona necesita un relleno en el
// borde, o al encender solo el colgante la mesa flota en un pozo negro.
const LIVING_PENDANT_SHARE = 0.75;
const LIVING_DINING_FILL_PIECES = 2;

// Cuántos colgantes según la forma de la mesa, que es el único dato real que
// tenemos de ella. Es la misma regla que ya decían los consejos del comedor.
const LIVING_PENDANTS_BY_SHAPE = { redonda: 1, cuadrada: 1, rectangular: 3 };

/* La altura del colgante se mide DESDE EL TABLERO, no desde el suelo.
 *
 * Desde el suelo la cifra no sirve para nada: obliga a saber la altura de la
 * mesa y a restar, y cada mesa es de una altura. Desde el tablero es una
 * medida que se comprueba con un metro en la mano. Y se mide hasta la PARTE
 * INFERIOR de la luminaria, que es lo que entra en el campo de visión de
 * quien está sentado enfrente. */
const PENDANT_H_MIN_CM = 75;
const PENDANT_H_MAX_CM = 85;
const PENDANT_H_TEXT = `${PENDANT_H_MIN_CM}–${PENDANT_H_MAX_CM} cm`;

/* La zona de estar se reparte con la geometría suelta del dormitorio, no con
 * la del salón, y por el mismo motivo que allí: su techo ya no es toda la luz
 * de la estancia. De los 2.450 lm de una zona de estar de 14 m², la general
 * pone 1.350 y el resto lo ponen el pie, la sobremesa y el acento. Exigirle la
 * uniformidad de un techo que trabaja solo es lo que llenaba de agujeros el
 * salón. Con los topes del salón esa misma zona pedía seis downlights; con
 * estos, cuatro. */
const LIVING_GRID_LIMITS = BEDROOM_GRID_LIMITS;
// Ningún foco de la general entra en la mesa ni en su corona de 60 cm. Se
// dice en el informe y se dibuja en el plano.
const LIVING_TABLE_KEEPOUT_M = 0.6;

/* La partición de la estancia. En el salón hay una sola zona y es la estancia
 * entera; en el salón-comedor son dos. */
function livingZones(area, roomId) {
  if (roomId !== "livingDining") return { estar: area, comedor: 0 };
  const raw = area * LIVING_DINING_AREA_SHARE;
  const comedor = Math.round(Math.min(LIVING_DINING_AREA_MAX, Math.max(LIVING_DINING_AREA_MIN, raw)) * 10) / 10;
  return { estar: Math.round((area - comedor) * 10) / 10, comedor };
}

/* El reparto completo: zonas, capas y retícula de la zona de estar.
 *
 * Devuelve lo que aporta cada capa, no lo que "debería" aportar: si las capas
 * concretas suman más de lo que la zona pedía, el total sube y se dice. Un
 * reparto que cuadra a base de recortar la lámpara de lectura a 380 lm es un
 * reparto que miente sobre la lámpara. */
function livingLayers(area, answers = {}, roomId = "living") {
  const activities = answers.activities || [];
  const zones = livingZones(area, roomId);
  const isDining = zones.comedor > 0;
  const onlyLights = answers.renovationStatus === "onlyLights";

  // ---------- zona de estar ----------
  const estarLux = getLux("living", answers.light);
  const estarNeed = roundLm(zones.estar * estarLux, 50);

  let ambient = [];
  if (activities.includes("read")) {
    ambient.push({
      id: "lectura", lm: LIVING_READING_LM, dimmable: true,
      label: "Pie de lectura",
      detail: "junto al sofá y por detrás del hombro, con la pantalla por debajo de la altura de los ojos al sentarse",
    });
  }
  ambient.push({
    id: "ambiente", lm: LIVING_AMBIENT_PIECE_LM, dimmable: true,
    label: "Lámpara de ambiente",
    detail: "de sobremesa o de pie, en el extremo opuesto del sofá, para que la luz venga de dos sitios y no de uno",
  });
  // Quien dice que el salón es sobre todo para descansar pide luz repartida y
  // baja, no un foco más: se le da una segunda pieza en vez de subir el techo.
  if (activities.includes("relax")) {
    ambient.push({
      id: "relax", lm: LIVING_AMBIENT_PIECE_LM, dimmable: true,
      label: "Segundo punto de ambiente",
      detail: "una lámpara más, baja y cálida, para las noches en las que la luz general sobra",
    });
  }
  let accent = activities.includes("tv")
    ? { lm: LIVING_ACCENT_LM, label: "Acento", detail: "una tira LED en el mueble de la televisión, oculta tras el canto: da profundidad y evita el contraste duro entre la pantalla y la pared" }
    : null;

  /* ---------- General y complementarias son dos cosas distintas ----------
   *
   * Aquí hubo dos intentos anteriores, los dos equivocados por el mismo motivo:
   * daban por hecho que todas las capas se encienden a la vez. Primero se
   * fundían capas en estancias pequeñas; después se atenuaban para que la suma
   * cupiera. Las dos cosas partían de sumar la general con el pie de lectura,
   * la tira de la tele y el colgante de la mesa, como si eso fuera "la luz que
   * necesita la habitación".
   *
   * No lo es. La general es lo que pide la estancia por sus metros: la luz de
   * fondo, la que se enciende al entrar. Las complementarias son escenas —se
   * lee con el pie, se cena con el colgante, se ve la tele con la tira— y cada
   * una vale lo que vale para su función, tenga la estancia 12 m² o 40.
   *
   * Así que ni se recortan ni se suman. Cada cifra es la suya. */
  // Se suman solo para poder enseñarlas agrupadas, nunca para restarlas de la
  // general: la general es la que pide la estancia por sus metros, entera.
  const ambientLm = ambient.reduce((acc, a) => acc + a.lm, 0);
  const accentLm = accent ? accent.lm : 0;
  const generalLm = estarNeed;
  const complementaryLm = ambientLm + accentLm;

  /* La retícula se calcula sobre los m² de la zona de estar y con los lúmenes
   * de la general, nunca sobre la estancia entera ni con el total. Y con las
   * dimensiones reales de la zona: el comedor se lleva una franja de la
   * estancia, así que lo que le queda al estar no es un rectángulo corriente
   * de 14 m², es 3,7 x 3,8 m. */
  /* La forma de la estancia sale de las medidas cuando el usuario las ha
   * dado. Solo se estima con PLAN_ASPECT en los planes guardados antes de que
   * se preguntaran. */
  const dm = roomDims(answers);
  const roomW = dm ? dm.w : Math.sqrt(area * PLAN_ASPECT);
  const roomD = dm ? dm.d : area / roomW;
  const diningDepth = isDining ? zones.comedor / roomD : 0;
  const estarDims = { w: roomW - diningDepth, d: roomD };
  const grid = openPlanLayout(zones.estar, generalLm, 1, 200, LIVING_GRID_LIMITS, isDining || dm ? estarDims : null);

  // ---------- zona de comedor ----------
  let dining = null;
  if (isDining) {
    const diningLux = getLux("dining", answers.light);
    const need = roundLm(zones.comedor * diningLux, 50);
    const pendantTotal = roundLm(need * LIVING_PENDANT_SHARE, 50);
    const pieces = LIVING_PENDANTS_BY_SHAPE[answers.diningShape] || 1;
    const pendantPer = roundLm(pendantTotal / pieces, 50);
    const fillTotal = Math.max(0, need - pendantPer * pieces);
    const fillPer = fillTotal > 0 ? roundLm(fillTotal / LIVING_DINING_FILL_PIECES, 50) : 0;
    dining = {
      area: zones.comedor, lux: diningLux, need,
      pieces, pendantPer, pendantTotal: pendantPer * pieces,
      fillPieces: fillPer > 0 ? LIVING_DINING_FILL_PIECES : 0,
      fillPer, fillTotal: fillPer * LIVING_DINING_FILL_PIECES,
      shape: answers.diningShape || null,
    };
  }

  return {
    zones, isDining, onlyLights,
    plan: { roomW, roomD, diningDepth, estarW: estarDims.w },
    estar: { area: zones.estar, lux: estarLux, need: estarNeed, generalLm, ambient, ambientLm, accent, accentLm, complementaryLm },
    grid, dining,
  };
}

function generateLivingReport(answers = {}, roomId = "living") {
  const { size, light, ceiling, renovationStatus } = answers;
  const activities = answers.activities || [];

  const area = roomArea(answers, SALON_AREA_BY_SIZE[size] || 20);
  const tempK = LIVING_TEMP_K;
  const lux = getLux("living", light);
  const layers = livingLayers(area, answers, roomId);
  const { estar, dining, grid } = layers;
  // El total ya no es area x lux: cada zona tiene su nivel y cada capa su
  // flujo. Se sigue devolviendo `lumens` porque el resto del informe —el
  // glosario, el PDF— lo lee, pero ahora es la suma real de las capas.
  // Para el resto del informe, "los lúmenes de la estancia" son los de la luz
  // general. Las complementarias no se suman aquí: son escenas, no fondo.
  const lumens = layers.estar.generalLm;
  const onlyLights = renovationStatus === "onlyLights";
  const room = dining ? "salón-comedor" : "salón";

  const tips = [];

  // ---------- la general de la zona de estar ----------
  if (dining) {
    tips.push(onlyLights
      ? `La luz general no se reparte por toda la estancia: se reparte por la zona de estar. Son unos ${estar.generalLm.toLocaleString("es-ES")} lm sobre unos ${fmtArea(estar.area)} m², y la mesa queda fuera de ese reparto porque la resuelve su propia luminaria.`
      : `Reparte la luz general solo por la zona de estar, siguiendo el esquema del plano: unos ${spacingText(grid)}, y a unos ${marginText(grid)} de las paredes. La zona de la mesa queda fuera de esa retícula.`);
    tips.push(`Ningún foco de la luz general debe caer sobre la mesa ni a menos de ${Math.round(LIVING_TABLE_KEEPOUT_M * 100)} cm de su borde: si la mesa ya tiene su colgante, un downlight encima solo añade una segunda sombra y le quita el papel de zona propia.`);
  } else {
    tips.push(onlyLights
      ? `Reparte la luz siguiendo el esquema del plano: unos ${spacingText(grid, true)}, y a unos ${marginText(grid)} de las paredes. Las lámparas de pie y de sobremesa que ya tienes cuentan como parte de ese reparto.`
      : `Coloca los downlights siguiendo la retícula del plano: unos ${spacingText(grid)}, y a unos ${marginText(grid)} de las paredes.`);
  }
  tips.push(`Ajusta ${onlyLights ? "ese reparto" : "esa retícula"} a la planta real y a los muebles: es una referencia de partida, no una plantilla que haya que respetar punto por punto.`);
  tips.push(`Las luces complementarias no se suman a la general: son escenas. Con todo encendido a la vez sobraría luz, así que ponlas reguladas y enciende cada una cuando toque.`);
  tips.push("Evita colocar focos justo encima del sofá o de donde os sentéis: desde ahí el foco queda en el campo de visión y deslumbra.");

  // ---------- capas de la zona de estar ----------
  if (activities.includes("read")) tips.push(`El pie de lectura pide unos ${LIVING_READING_LM} lm y un regulador: a plena potencia para leer, atenuado el resto del tiempo. Colócalo junto al sofá y por detrás del hombro, no enfrente.`);
  if (activities.includes("tv")) tips.push("Dirige la luz general lejos de la pantalla del televisor para evitar reflejos molestos.");
  if (estar.accent) tips.push(`Una tira LED de unos ${estar.accent.lm} lm en el mueble de televisión, oculta tras el canto, aporta profundidad y suaviza el contraste entre la pantalla encendida y la pared oscura.`);
  if (activities.includes("relax")) tips.push("Que la luz de ambiente sea regulable: es lo que permite pasar de un salón luminoso a uno de sobremesa sin cambiar ninguna bombilla.");

  // ---------- la mesa ----------
  if (dining) {
    tips.push(`Sobre la mesa, ${dining.pieces > 1 ? `${dining.pieces} colgantes en línea de unos ${dining.pendantPer} lm cada uno` : `un colgante de unos ${dining.pendantPer} lm`}, colgados a ${PENDANT_H_TEXT} sobre el tablero: se mide desde la superficie de la mesa hasta la parte inferior de la luminaria, no desde el suelo. A esa altura ilumina bien el plato y queda por encima de la línea de visión entre comensales.`);
    tips.push(`Si dudas dentro del rango, ${PENDANT_H_MIN_CM} cm para una mesa donde se cena a diario y ${PENDANT_H_MAX_CM} cm si la luminaria es ancha o el techo alto: cuanto más grande es la pantalla, más alto puede ir sin cerrar la vista.`);
    if (dining.pieces > 1) tips.push("Reparte los colgantes a lo largo del eje largo de la mesa y deja libres unos 25–30 cm en cada extremo del tablero: así la luz cubre toda la superficie sin que el colgante de la punta quede sobre el aire.");
    if (EXTRA_INSIGHT.dining?.shape?.[dining.shape]) tips.push(EXTRA_INSIGHT.dining.shape[dining.shape]);
    if (dining.fillPieces) tips.push(`Añade ${dining.fillPieces} puntos de unos ${dining.fillPer} lm en el borde de la zona de comedor —o un aplique equivalente—, siempre fuera de la mesa. Sin ellos, al encender solo el colgante la mesa queda flotando en un rincón oscuro.`);
    tips.push("Mantén la misma temperatura de luz en las dos zonas: lo que separa el comedor del estar es que tiene su propio punto de luz, no un tono distinto.");
    tips.push("Deja el colgante en un circuito propio, aparte de la luz general del estar: poder cenar con la mesa encendida y el resto apagado es la mitad del valor de tener dos zonas.");
    if (onlyLights) tips.push("El punto de techo que ya tienes casi nunca cae sobre la mesa, sino en el centro de la estancia. Sin obra, la salida es desviar el cable hasta el eje de la mesa con un gancho o un florón de desvío, o sustituir el punto por un carril que te deje mover las luminarias.");
  }

  // ---------- techo, luz natural, obra ----------
  if (ceiling === "vigas") tips.push("Con vigas vistas, evita empotrar downlights en la madera: opta por focos de superficie o carriles que se adapten a la estructura.");
  if (ceiling === "pladur") tips.push("Un falso techo de pladur es ideal para empotrar downlights e integrar tiras LED perimetrales sin obra adicional. Elige uno con acabado negro y la fuente de luz más hundida: da más confort visual que uno blanco y superficial.");
  if (ceiling === "liso") tips.push("Un techo liso no tiene cámara para empotrar: si no vas a reformar, usa downlights de superficie, y si te preocupa el deslumbramiento lateral, un accesorio tipo \"honeycomb\" lo reduce bastante.");
  if (ceiling === "noSe") tips.push("Antes de instalar downlights empotrados, confirma con un instalador qué tipo de techo tienes.");

  if (light === "bright") tips.push(`Como el ${room} recibe mucha luz natural de día, reserva la calidez de la luz artificial sobre todo para la noche.`);
  if (light === "moderate") tips.push(`Con una entrada de luz natural media, la parte del ${room} más alejada de la ventana puede recibir menos iluminación durante buena parte del día. Refuerza esa zona con luz artificial en lugar de aumentar la intensidad general de toda la estancia.`);
  if (light === "low") tips.push(`Como el ${room} necesita más luz, sube ligeramente los lúmenes generales calculados y refuerza también las esquinas.`);

  if (renovationStatus === "renovation") tips.push(`Como vas a reformar desde cero, aprovecha para dejar previstos circuitos independientes${dining ? " —general del estar, colgante de la mesa y ambiente— " : " "}y reguladores de intensidad.`);
  if (onlyLights) tips.push("Como solo vas a cambiar las luminarias, prioriza soluciones que aprovechen los puntos de luz ya existentes, como sustituir un plafón por un foco orientable en el mismo lugar.");

  const mistakes = [
    `Evita depender de una única lámpara en el centro del ${room}, ya que genera una luz plana y deja las esquinas apagadas.`,
    "Evita mezclar temperaturas de color muy diferentes en la misma estancia, ya que el contraste hace que el conjunto se perciba desordenado.",
    "Evita colocar todos los focos pegados a las paredes, ya que iluminan más el muro que la zona donde realmente se hace vida.",
  ];
  if (dining) mistakes.push("Evita cubrir la mesa con focos generales del techo además del colgante, ya que duplicar la luz cenital sobre el mismo sitio marca ojeras en la cara de quien come y deja la mesa sin identidad propia dentro del espacio.");
  if (activities.includes("tv")) mistakes.push("Evita dirigir la luz directamente hacia la pantalla del televisor, ya que produce reflejos que obligan a forzar la vista.");
  if (ceiling === "vigas") mistakes.push("No es recomendable empotrar focos en las vigas de madera sin consultarlo antes con un instalador, ya que son elementos estructurales y no siempre admiten perforaciones.");

  return { tempK, lumens, grid, area, lux, layers, tips: [...new Set(tips)], mistakes: [...new Set(mistakes)] };
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

// Antes esto eran dos pantallas propias. La altura del techo se preguntaba
// con cuatro opciones de las que dos (2,40 y 2,50) multiplicaban por 1, y la
// zona de trabajo repetía lo que la distribución ya decía: "Con isla" y "Con
// península" son opciones de esa primera pregunta. Ahora las dos viajan como
// casilla dentro de una pregunta que ya existía: el cálculo conserva la
// variable y el cuestionario baja de diez pasos a ocho.
const TALL_CEILING_FACTOR = 1.15;
const TALL_CEILING_EXTRA = {
  key: "tallCeiling",
  label: "Mi techo mide más de 2,70 m",
  hint: "Solo si es más alto de lo habitual.",
};
const KITCHEN_MULTI_ZONE_EXTRA = {
  key: "multiZone",
  label: "Preparo la comida en varias zonas",
  hint: "Por ejemplo, encimera e isla a la vez.",
};

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

/* ---------------------------------------------------------------------------
 * CAPAS DE LA COCINA
 *
 * El problema no era el número de focos, era pedirle al techo algo que el
 * techo no sabe hacer. Un downlight no ilumina bien una encimera: te colocas
 * entre el foco y la encimera y trabajas sobre tu propia sombra. Añadir focos
 * lo empeora, porque cada uno añade una sombra más.
 *
 * Los 300-400 lm/m² de la tabla vieja son un nivel de TAREA —300-500 lux sobre
 * la encimera— aplicado a los metros del suelo. Es el mismo error que tenía el
 * despacho, donde los 500 lux del escritorio aplicados a 9 m² pedían seis
 * focos, y que se arregló separando la capa de la mesa.
 *
 * Ahora la cocina se resuelve en capas:
 *   1. general de techo    — moverse, ver el conjunto, abrir un armario
 *   2. trabajo             — la encimera, con tira bajo mueble
 *   3. refuerzos           — fregadero, placa, rincón interior
 *   4. isla o península    — zona propia, como la mesa del comedor
 *
 * Ninguna se resta de otra. La referencia global de 300-400 lm/m² se mantiene
 * como comprobación —general 180 + trabajo ~120 = 300—, nunca como divisor
 * para sacar downlights. */

// La general de la cocina, con la encimera resuelta aparte: unos 90 lux medios,
// que es lo que pide circular y ver el conjunto. Con 20 m² salen 3.600 lm, que
// la retícula abierta reparte en 6 puntos de 600 lm — un downlight corriente,
// no una bomba de 800.
const KITCHEN_GENERAL_LUX = { bright: 160, moderate: 180, low: 200 };

/* La cocina reparte con la geometría relajada, la misma del salón y el
 * dormitorio: su techo ya no es la única luz, la encimera tiene la suya.
 *
 * Con los topes por defecto —los estrictos— una cocina de 5,3 x 3,8 m pedía
 * 3 x 3 = nueve focos, que es volver al problema por otro camino. Con estos,
 * 3 x 2 = seis de 600 lm. */
const KITCHEN_GRID_LIMITS = BEDROOM_GRID_LIMITS;

/* Metros lineales de encimera, estimados con la forma y las medidas. Nemul no
 * los pregunta —el cuestionario ya es largo— así que sale de la distribución
 * cruzada con el largo y el ancho. Va declarado como estimación en el informe.
 * Fracciones del lado largo (w) y del corto (d) de la estancia. */
const KITCHEN_RUN_BY_LAYOUT = {
  lineal:     (w, d) => 0.70 * w,
  L:          (w, d) => 0.70 * w + 0.60 * d,
  U:          (w, d) => 0.70 * w + 1.20 * d,
  paralela:   (w, d) => 1.40 * w,
  /* Isla y península cuentan solo el frente de PARED. Su propio frente lo
   * resuelve la capa de colgantes, y sumarlo aquí lo iluminaba dos veces:
   * una península de 20 m² pedía 5 focos orientables además de sus 2
   * colgantes, más luz sobre ese metro y medio que sobre toda la cocina. */
  isla:       (w, d) => 0.70 * w,
  peninsula:  (w, d) => 0.70 * w,
};

/* Qué parte del frente lleva tira. No es un porcentaje fijo: depende de en
 * cuántas paredes hay encimera y en cuántas hay mueble alto. En una cocina en U
 * con muebles altos en dos paredes, la tira cubre dos de los tres frentes; en
 * una lineal, con una pared ya está todo. El resto se queda con los focos
 * orientables del techo, y el informe lo dice. */
const KITCHEN_WALL_RUNS = { lineal: 1, L: 2, U: 3, paralela: 2, isla: 1, peninsula: 1 };
const KITCHEN_CABINET_WALLS = { unaPared: 1, dosParedes: 2 };
function kitchenRunShare(layout, upperCabinets) {
  const walls = KITCHEN_CABINET_WALLS[upperCabinets];
  if (!walls) return 1; // sin muebles altos, el frente entero va con focos
  return Math.min(1, walls / (KITCHEN_WALL_RUNS[layout] || 1));
}

/* 400 lm por metro lineal de tira: sobre una encimera de 60 cm de fondo son
 * unos 500 lux, justo la banda de tarea. Más que eso deslumbra en el azulejo. */
const KITCHEN_TASK_LM_PER_M = 400;
// Sin muebles altos no hay dónde ponerla, y hace falta más flujo desde el techo
// para compensar el peor ángulo.
const KITCHEN_TASK_SPOT_LM = 500;
const KITCHEN_TASK_SPOT_SPACING_M = 1.1;

const KITCHEN_SINK_LM = 400;
const KITCHEN_HOB_LM = 400;
const KITCHEN_CORNER_LM = 300;
const KITCHEN_ISLAND_PIECE_LM = 500;

function kitchenLayers(area, answers = {}, tempK = 3000) {
  const { layout, upperCabinets, light, multiZone } = answers;
  const dm = roomDims(answers);
  const w = dm ? dm.w : Math.sqrt(area * PLAN_ASPECT);
  const d = dm ? dm.d : area / w;

  // ---------- 1. general ----------
  const generalLux = KITCHEN_GENERAL_LUX[light] || KITCHEN_GENERAL_LUX.moderate;
  const heightFactor = answers.tallCeiling ? TALL_CEILING_FACTOR : 1;
  const generalLm = Math.round((generalLux * area * heightFactor) / 100) * 100;
  const grid = openPlanLayout(area, generalLm, 4, 200, KITCHEN_GRID_LIMITS, dm);

  // ---------- 2. trabajo ----------
  const runFn = KITCHEN_RUN_BY_LAYOUT[layout] || KITCHEN_RUN_BY_LAYOUT.lineal;
  const runTotalM = Math.round(runFn(w, d) * 10) / 10;
  const runM = Math.round(runTotalM * kitchenRunShare(layout, upperCabinets) * 10) / 10;
  // Lo que queda sin mueble alto y sigue siendo encimera: se resuelve desde el
  // techo, y conviene decirlo en vez de dejar ese tramo sin mencionar.
  const uncoveredM = Math.round((runTotalM - runM) * 10) / 10;
  const hasUpper = upperCabinets && upperCabinets !== "no";
  const task = hasUpper
    ? {
        mode: "underCabinet", runM, runTotalM, uncoveredM,
        lmPerM: KITCHEN_TASK_LM_PER_M,
        lm: roundLm(runM * KITCHEN_TASK_LM_PER_M, 50),
      }
    : {
        // Sin mueble alto: focos orientables adelantados. Peor solución, y se
        // dice. El haz llega en diagonal y sigue habiendo algo de sombra propia.
        mode: "ceilingSpots",
        runM, runTotalM, uncoveredM: 0,
        pieces: Math.max(2, Math.round(runM / KITCHEN_TASK_SPOT_SPACING_M)),
        lmPer: KITCHEN_TASK_SPOT_LM,
        lm: Math.max(2, Math.round(runM / KITCHEN_TASK_SPOT_SPACING_M)) * KITCHEN_TASK_SPOT_LM,
      };

  // ---------- 3. refuerzos ----------
  const reinforcements = [
    { id: "fregadero", label: "Sobre el fregadero", lm: KITCHEN_SINK_LM,
      hint: "un punto adelantado hacia el borde de la encimera: encima de la cabeza deja el seno en sombra" },
    { id: "placa", label: "Sobre la placa", lm: KITCHEN_HOB_LM,
      hint: "solo si tu campana no lleva luz propia; si la lleva, ya está resuelto" },
  ];
  if (layout === "L" || layout === "U") {
    reinforcements.push({ id: "rincon", label: "Rincón interior", lm: KITCHEN_CORNER_LM,
      hint: "el punto más oscuro de una cocina en " + (layout === "L" ? "L" : "U") + ": un foco orientable lo resuelve" });
  }

  // ---------- 4. isla o península ----------
  let island = null;
  if (layout === "isla" || layout === "peninsula") {
    const pieces = layout === "isla" ? 2 : (w * 0.45 < 1.2 ? 1 : 2);
    island = {
      kind: layout, pieces,
      lmPer: KITCHEN_ISLAND_PIECE_LM,
      lm: pieces * KITCHEN_ISLAND_PIECE_LM,
    };
  }

  return { generalLux, generalLm, grid, task, reinforcements, island, hasUpper, multiZone: !!multiZone, tempK };
}

function generateKitchenReport(answers = {}) {
  const { layout, priorities = [], upperCabinets, multiZone, size, tallCeiling, light, problem, renovationStatus, adjoiningStyle } = answers;

  let tempK = 3000;
  if (priorities.includes("practical") || priorities.includes("comfortable")) tempK = 4000;
  else if (priorities.includes("elegant")) tempK = 2700;
  if (problem === "shadows" || problem === "visibility" || problem === "modern") tempK = 4000;

  const area = roomArea(answers, KITCHEN_AREA_BY_SIZE[size] || 11);
  const layers = kitchenLayers(area, answers, tempK);
  const { task, grid } = layers;
  // `lux` y `lumens` son los de la luz GENERAL. Las capas de trabajo y los
  // refuerzos van aparte y no se suman aquí: no se encienden todas a la vez.
  const lux = layers.generalLux;
  const lumens = layers.generalLm;

  const distribution = [];
  distribution.push(`${grid.n} downlights de luz general, de ${grid.lmPer} lm cada uno. La encimera no depende de ellos: tiene su propia capa.`);
  distribution.push(`Sepáralos siguiendo la retícula del plano: unos ${spacingText(grid)}, dejando unos ${marginText(grid)} hasta las paredes.`);
  if (task.mode === "underCabinet") {
    distribution.push("Coloca la línea de focos generales entre 30 y 40 cm por delante de los muebles altos: así la luz cae sobre el centro de la encimera y no sobre las puertas.");
    distribution.push("Si tienes muebles altos, la tira LED bajo mueble es la solución recomendada para iluminar correctamente la encimera: es la única que llega por delante de ti y no proyecta tu propia sombra sobre lo que cortas.");
  } else {
    distribution.push("Centra la línea de focos sobre la zona de trabajo principal para evitar sombras al cocinar.");
  }
  // Este consejo antes solo lo veía quien elegía exactamente 3,00 m. Ahora
  // llega a cualquier techo por encima de 2,70, que es cuando empieza a notarse.
  if (tallCeiling) distribution.push("Con un techo alto, valora downlights de mayor potencia o un ángulo de haz más cerrado para que la luz llegue bien hasta la encimera.");
  distribution.push(`Temperatura recomendada: ${tempK} K.`);
  distribution.push("Índice de reproducción cromática: CRI ≥ 90, para ver bien el color real de los alimentos.");

  const priorityLabels = priorities.map((p) => KITCHEN_PRIORITY_LABEL[p]).filter(Boolean);
  const priorityIntro = priorityLabels.length ? joinNatural(priorityLabels) : "usar bien la cocina cada día";
  const layoutPhrase = KITCHEN_LAYOUT_PHRASE[layout] || "tiene una distribución propia";
  const goalPhrase = (priorities.includes("practical") || priorities.includes("comfortable"))
    ? "mejorar la visibilidad durante la preparación de alimentos"
    : "crear un ambiente agradable para desayunar o reunirte con la familia";

  const sentences = [];
  // "Se recomienda" en vez de "te recomendamos": el informe es orientativo y
  // cada cocina real tiene condiciones que el cuestionario no ve. Suena a
  // criterio profesional, no a norma cerrada.
  sentences.push(`Como para ti lo más importante es ${priorityIntro}, y tu cocina ${layoutPhrase}, se recomienda una iluminación general en torno a ${tempK}K para ${goalPhrase}.`);

  // La zona de trabajo se deduce de la distribución, que ya distingue isla y
  // península. La casilla de "varias zonas" añade su consejo encima, porque
  // se puede tener isla y cocinar además en la encimera.
  if (layout === "isla") {
    sentences.push("Sobre la isla, dos o tres lámparas colgantes ayudan a crear un punto focal y una iluminación más agradable para cocinar, desayunar o reunirse.");
    // Las medidas concretas faltaban: el informe decía "no las cuelgues
    // demasiado bajas" sin decir nunca cuál era la altura buena. En el
    // comedor sí se daba el número, y la isla es la pieza más visible de
    // una cocina.
    sentences.push("Cuélgalas entre 75 y 85 cm por encima de la encimera. Esa altura ofrece una buena iluminación de trabajo y evita deslumbramientos.");
    sentences.push("Sepáralas entre 60 y 80 cm entre sí, y deja unos 30 cm libres hasta cada extremo de la isla para conseguir una distribución más uniforme de la luz.");
    sentences.push("Con dos colgantes cubres una isla de hasta 1,80 m; a partir de 2,20 m, reparte mejor la luz con tres.");
  } else if (layout === "peninsula") {
    sentences.push("Sobre la península, un par de colgantes lineales ayudan a marcar la zona de trabajo sin cerrar la vista hacia el resto de la cocina.");
    sentences.push("Cuélgalos entre 75 y 85 cm por encima de la encimera, la misma altura que sobre una isla. Si la península mide menos de 1,20 m, suele ser suficiente con un solo colgante centrado.");
  } else if (!multiZone) {
    sentences.push("Sobre la encimera principal, una regleta de luz continua bajo los muebles altos elimina las sombras que tus propias manos proyectan al cocinar.");
  }
  if (multiZone) {
    sentences.push("Como trabajas en varias zonas, reparte la luz en puntos independientes en lugar de concentrarla en un único lugar.");
  }

  if (upperCabinets === "unaPared") {
    sentences.push("Tienes muebles altos en una pared: ahí la tira LED bajo mueble es la solución recomendada para iluminar correctamente la encimera. El tramo que se queda sin mueble alto necesita focos orientables adelantados hacia el borde.");
  } else if (upperCabinets === "dosParedes") {
    sentences.push("Como tienes muebles altos en dos paredes, lleva la tira LED a las dos: si solo iluminas una, la otra encimera se queda en sombra. Van en circuito propio, para poder encender solo la encimera mientras cocinas.");
  } else if (upperCabinets === "no") {
    sentences.push("Sin muebles altos no hay dónde poner la tira, así que la encimera se resuelve con focos orientables adelantados hacia su borde. Es una alternativa menos eficaz: la luz llega en diagonal y sigues proyectando algo de sombra sobre la zona de corte. Si en algún momento pones muebles altos, la tira bajo mueble es la mejor solución.");
  }
  if (task.mode === "underCabinet") {
    sentences.push(`Para la tira, unos ${task.lmPerM} lm por metro lineal, con CRI ≥ 90 y montada en el borde delantero del bajo del mueble: al fondo ilumina el azulejo y deja la encimera en sombra.`);
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
    "Evita concentrar toda la luz en un único punto central, ya que tu propio cuerpo proyectará sombra sobre la encimera al cocinar.",
    "Evita diferencias muy marcadas de temperatura de color entre las distintas zonas de la cocina.",
    "Evita iluminar la zona de trabajo únicamente con luz cálida, ya que dificulta apreciar el color real de los alimentos y el punto de cocción.",
  ];
  if (upperCabinets && upperCabinets !== "no") mistakes.push("Evita dejar los muebles altos sin iluminación debajo, ya que proyectan sombra justo sobre la superficie de trabajo.");
  // Un error a evitar tiene que dar la medida. "Demasiado bajas" dejaba a
  // quien lo leía igual que estaba.
  if (layout === "isla") mistakes.push("Evita instalar las lámparas a menos de 75 cm de la encimera, ya que pueden producir deslumbramientos y obstaculizar la visión entre las personas situadas a ambos lados de la isla.");
  else if (layout === "peninsula") mistakes.push("Evita instalar las lámparas a menos de 75 cm de la encimera, ya que pueden producir deslumbramientos y quedar dentro del campo de visión desde el resto de la cocina.");
  if (problem === "onlyLighting") mistakes.push("No conviene elegir soluciones que requieran romper alicatado o encimera, ya que encarecen mucho una intervención pensada sin obra.");
  if (adjoiningStyle) mistakes.push("Evita una temperatura de luz muy distinta entre la cocina y el salón, ya que en un espacio abierto el contraste se percibe con mucha más fuerza que entre habitaciones separadas.");

  return { tempK, lumens, grid, area, lux, layers, distribution, narrative: sentences.join(" "), mistakes: [...new Set(mistakes)] };
}

// ---------- Dormitorio, baño, comedor, pasillo, vestidor y terraza ----------
// Preguntas pensadas como las haría una diseñadora en una primera reunión con el cliente:
// nunca "¿qué estilo?", siempre "¿cómo vives este espacio?".

/* Antes había seis actividades y cuatro no cambiaban el cálculo: "Dormir" lo
 * hace todo el mundo, y "Vestirme", "Trabajar" o "Ver la televisión" solo
 * añadían un consejo suelto. Una pregunta de la que la mitad de las respuestas
 * no mueven nada enseña a contestar por contestar.
 *
 * Quedan las dos que encienden una capa de luz, y una salida honesta para
 * quien no hace ninguna. */
const BEDROOM_ACTIVITY_OPTIONS = [
  { id: "readBed", label: "Leo en la cama", Icon: BookOpen },
  { id: "makeup", label: "Me maquillo", Icon: Sparkles },
  { id: "none", label: "Ninguna de estas", Icon: Moon, exclusive: true },
];

/* La pregunta del tipo de armario se retiró: empotrado o independiente cambia
 * el mueble, no la luz que hay que darle. Lo que sí decide es la pregunta
 * siguiente —dentro, delante o nada—, que es la que enciende la capa. */

/* Lo primero que se pregunta, porque condiciona todo lo demás: si solo se van
 * a cambiar luminarias, Nemul respeta la instalación que hay; si hay reforma,
 * puede diseñar puntos nuevos. La clave sigue siendo `renovationStatus`, la
 * misma que el resto de la casa, para no duplicar la lógica de los consejos.
 * Lo que cambia son los textos, que aquí hablan del dormitorio. */
const livingProjectOptions = (roomWord) => [
  { id: "onlyLights", label: "Solo mejorar o cambiar la iluminación", Icon: Lightbulb },
  { id: "renovation", label: `Estoy reformando el ${roomWord}`, Icon: Hammer },
];

// Igual que en el dormitorio: sin "con vigas", que se resuelve como un techo
// liso y solo añadía una opción más que decidir.
const LIVING_CEILING_OPTIONS = [
  { id: "liso", label: "Techo liso" },
  { id: "pladur", label: "Falso techo / pladur" },
  { id: "noSe", label: "No lo sé" },
];

const LIVING_CEILING_POINTS_OPTIONS = [
  { id: "uno", label: "Uno" },
  { id: "varios", label: "Varios" },
];

const BEDROOM_PROJECT_OPTIONS = [
  { id: "onlyLights", label: "Solo mejorar o cambiar la iluminación", Icon: Lightbulb },
  { id: "renovation", label: "Estoy reformando el dormitorio", Icon: Hammer },
];

// Sin "con vigas": en un dormitorio la decisión útil es si hay cámara donde
// empotrar o no, y las vigas se resuelven igual que un techo liso.
const BEDROOM_CEILING_OPTIONS = [
  { id: "liso", label: "Techo liso" },
  { id: "pladur", label: "Falso techo / pladur" },
  { id: "noSe", label: "No lo sé" },
];

// Sin "no tengo": si no hubiera ningún punto, la pregunta que toca no es esta
// sino si va a haber obra. Y solo se pregunta cuando no hay reforma, porque
// con reforma los puntos actuales dejan de condicionar nada.
const BEDROOM_CEILING_POINTS_OPTIONS = [
  { id: "uno", label: "Uno" },
  { id: "varios", label: "Varios" },
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
    readBed: "Para leer en la cama, una lámpara orientable en la mesita, a la altura del hombro, evita que la luz general te deslumbre al recostarte.",
    makeup: "Para maquillarte, necesitas luz uniforme sobre el rostro, nunca solo cenital: la luz de techo genera sombras que engañan al ojo.",
    none: "Un dormitorio que solo se usa para dormir es el más fácil de iluminar: luz general atenuable y la cabecera, y poco más hace falta.",
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
  return { key: "activities", title: roomId === "bedroom" ? "Además de dormir, ¿qué haces en el dormitorio?" : "¿Cómo utilizas la terraza?", subtitle, type: "multi", layout: "list", options: ACTIVITY_OPTIONS[roomId] };
}

// Reacciones cortas que aparecen justo después de responder la pregunta del
// "problema a resolver" en cada habitación — el mismo guiño de razonamiento
// que ya se probó y validó en Cocina.
const PROBLEM_REACTIONS = {
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
      ducha: "Con ducha, usa una luz resistente a la humedad y desplazada hacia la entrada o indirecta, no en la vertical de la cabeza: ahí queda en el camino del vapor y te deja la cara a contraluz.",
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
  moderate: "Con una entrada de luz natural media, la zona más alejada de la ventana puede recibir menos iluminación durante buena parte del día. Refuerza esa zona con luz artificial en lugar de aumentar la intensidad general de todo el espacio.",
  low: "Al recibir poca luz natural, compensa con un tono blanco cálido algo más intenso de lo habitual durante el día.",
};


const PROBLEM_INSIGHT = {
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
    // El consejo de "coloca la cámara a la altura de los ojos" se quitó: es
    // un consejo de videollamadas, no de iluminación, y Nemul solo habla de
    // luz. Lo que sí toca decir sobre verse bien en cámara ya está en
    // EXTRA_INSIGHT.office.videoCalls.si, y es puramente lumínico.
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
    // Sin la actividad "Trabajar" en el cuestionario, un dormitorio es siempre
    // luz cálida: es la estancia donde el tono frío nunca ayuda.
    getTempK: () => 2700,
    // Un dormitorio es una estancia de estar: nadie trabaja bajo la retícula,
    // y el techo se mira desde la cama. Con el reparto estricto un dormitorio
    // de 17 m² salían doce focos de 200 lm, un flujo que casi no existe como
    // producto. Ver openPlanLayout.
    openGrid: true,
    limits: BEDROOM_GRID_LIMITS,
  },
  bathroom: {
    areaMap: BATHROOM_AREA_BY_SIZE,
    defaultArea: 6,
    minDownlights: 2,
    /* 3000 K siempre. Antes salía a 4000 K salvo con bañera, spa o "la luz es
     * demasiado fría", que es tanto como decir que el baño por defecto es un
     * quirófano y que hay que pedir que no lo sea.
     *
     * Un baño doméstico no es un espacio de trabajo: es donde te despiertas y
     * donde te acuestas. Los 4000 K se colaron por confundir "ver bien la cara"
     * con "enfriar toda la estancia", y ver bien la cara es un problema de
     * CRI y de dónde pones la luz, no de kelvin. Eso lo resuelve el espejo,
     * que tiene los suyos. */
    getTempK: () => 3000,
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
    // Una terraza no tiene techo donde trazar una retícula, y su informe
    // enseña zonas en vez de un plano: aquí el reparto sale del flujo.
    ambient: true,
  },
  office: {
    areaMap: OFFICE_AREA_BY_SIZE,
    defaultArea: 9,
    minDownlights: 2,
    getTempK: (a) => (a.problem === "cold" ? 3500 : 4000),
    // El techo del despacho solo tiene que resolver el ambiente, así que se
    // reparte como el de un dormitorio: la retícula más despejada que ilumine
    // bien, no la más apretada que quepa. Con el reparto estricto, 9 m² daban
    // 3 x 2 y 20 m² daban 4 x 3 — doce focos en un despacho — porque el número
    // de puntos salía solo de la geometría. Ver openPlanLayout.
    openGrid: true,
    minLmPerPoint: DOWNLIGHT_LM_FLOOR,
  },
};

const ROOM_TECH_MISTAKES = {
  bedroom: [
    "Evita iluminar la zona de la cama con un único punto de techo, ya que deslumbra estando tumbado; es preferible combinar apliques, una lámpara de sobremesa, una suspensión o tiras de led ocultas.",
    "Evita mezclar tonos de luz muy distintos dentro del dormitorio, ya que el salto de temperatura entre una zona y otra rompe la sensación de descanso.",
  ],
  bathroom: [
    "Evita un único punto de luz cenital sobre el espejo, ya que genera sombras bajo los ojos y la nariz; es preferible usar apliques de luz directa a ambos lados.",
    "Evita diferencias marcadas de temperatura de color entre la zona del espejo y el resto del baño, ya que el contraste altera la percepción del tono de piel.",
    "Evita dejar el lavabo sin un punto de luz propio, ya que es la zona de mayor uso; un downlight de haz algo cerrado la enmarca y aporta luz general al baño.",
    "Evita empotrar luminarias directamente en el techo de la ducha, ya que quedan expuestas al vapor; suele funcionar mejor una luz indirecta con tiras led estancas (IP67) ocultas en un foseado o una hornacina.",
  ],
  dining: [
    "Evita colgar la lámpara a más de 90 cm sobre la mesa, ya que la luz se dispersa y deja de cumplir su función sobre la superficie.",
    "Evita iluminar únicamente el centro de una mesa grande, ya que los extremos quedan en sombra.",
    "No conviene depender solo de la luz general difusa, ya que sin un punto centrado sobre la mesa el comedor se percibe plano.",
  ],
  closet: [
    "Evita la luz muy cálida como única fuente, ya que distorsiona el color real de la ropa al vestirte.",
    "Evita dejar sin luz interior los armarios cerrados y profundos, ya que la luz general no alcanza el fondo.",
  ],
  terrace: [
    "Evita luminarias sin certificación para exterior en una terraza descubierta, ya que la lluvia y la humedad acortan mucho su vida útil.",
    "Evita concentrar la luz en un único foco potente, ya que crea contrastes duros; suele funcionar mejor repartir varios puntos de menor intensidad.",
  ],
  office: [
    "Evita situar la lámpara de escritorio del mismo lado que tu mano dominante, ya que proyectará la sombra de tu propia mano al escribir.",
    "No es recomendable depender solo del brillo de la pantalla como fuente de luz, ya que el contraste con un entorno oscuro fatiga la vista en sesiones largas.",
  ],
  hallway: [
    "Evita iluminar el pasillo únicamente con un punto de luz central. La iluminación debe acompañar el recorrido y facilitar la orientación.",
  ],
};

/* ---------------------------------------------------------------------------
 * EL DORMITORIO POR CAPAS
 *
 * El resto de la casa calcula un total y lo reparte entre downlights, porque
 * es lo único que sabe dibujar. En un dormitorio eso es mentir por omisión:
 * nadie lee en la cama con el techo, ni se viste con él, y la mesita y la luz
 * del armario dan una parte real de la luz de la habitación.
 *
 * Aquí el total se reparte entre las capas que el cuestionario dice que
 * existen, y solo entre esas. Quien responde "Dormir" y nada más sigue
 * teniendo todo en el techo; quien lee en la cama y quiere luz de armario ve
 * cuatro capas y un techo más discreto.
 *
 * Dos familias, y la diferencia importa:
 *
 *   AMBIENTE (techo, pie, cabecera, acento) se REPARTEN el total calculado.
 *   Las cuatro iluminan la habitación entera, así que suman entre ellas.
 *
 *   TAREA (lectura, armario, espejo, escritorio) se SUMAN aparte. Iluminan
 *   una superficie concreta, no la habitación, igual que el flexo del
 *   despacho: restárselas al techo dejaría el dormitorio a oscuras.
 * ------------------------------------------------------------------------- */

// Pesos del reparto de ambiente. No son porcentajes: se normalizan con las
// capas que estén activas, así que el techo solo se lleva el 100 % cuando es
// la única capa. Con cabecera sale 77/23; con cabecera y acento, 70/21/9.
/* Cuatro capas, y cada una la enciende una respuesta.
 *
 * La luz general y la cabecera SE REPARTEN la necesidad calculada: las dos
 * iluminan la habitación entera, así que suman entre ellas y su suma es
 * exactamente la necesidad. Ni un lumen se cuenta dos veces.
 *
 * El maquillaje y el armario NO entran en ese reparto. Iluminan una
 * superficie concreta —el rostro, el interior de un mueble— y se listan
 * aparte con su propio flujo. Meterlas dentro obligaría a restarle luz al
 * techo para que "cuadrara" una suma que no significa nada, y dejaría el
 * dormitorio más oscuro de lo calculado.
 *
 * Y la lectura no es una capa: es la cabecera dimensionada para leer. Antes
 * salía como una línea propia y sumaba lúmenes que ya estaban contados. */

// La cabecera es capa base del dormitorio: existe siempre, se pregunte lo que
// se pregunte. Se lleva esta parte de la necesidad general, en dos piezas.
const BEDROOM_BEDSIDE_SHARE = 0.2;
// Por debajo de esto no hay lámpara de mesita que valga.
const BEDROOM_BEDSIDE_MIN_LM = 150;
// Lo que pide leer en la cama, por pieza. No se suma: es la misma lámpara,
// regulada. Atenuada aporta su parte de la luz general; a plena potencia,
// ilumina el libro.
const BEDROOM_READING_LM = 350;
// Por encima de esto, un único punto de techo ya no da: no se inventa una
// capa para taparlo, se dice y se propone un carril o una luminaria de varios
// focos en ese mismo punto.
const BEDROOM_SINGLE_POINT_LIMIT = 1800;
// Luz localizada, fuera del reparto general.
const BEDROOM_MAKEUP_LM = 250;   // por aplique, dos piezas a los lados del espejo
const BEDROOM_CLOSET_LM = { dentro: 400, delante: 300 };

const roundLm = (lm, step) => Math.round(lm / step) * step;

/* Tres situaciones, no cuatro: con reforma Nemul diseña puntos nuevos y
 * enseña dónde van; sin reforma se adapta a lo que hay y no dibuja ninguna
 * retícula, porque no sabe dónde están esos puntos.
 *
 * Sin respuesta se asume "varios", que es el comportamiento de siempre: los
 * planes guardados antes de esta pregunta no cambian de forma. */
function bedroomCeilingMode(answers = {}) {
  if (answers.renovationStatus === "renovation") return "reforma";
  return (answers.ceilingPoints || "varios") === "uno" ? "uno" : "varios";
}

function bedroomLayers(area, need, answers = {}) {
  const mode = bedroomCeilingMode(answers);
  const activities = answers.activities || [];
  const reads = activities.includes("readBed");

  // Cabecera primero, y la luz general se queda con el resto: así el reparto
  // suma la necesidad exacta sin arrastrar redondeos.
  const bedsidePer = Math.max(BEDROOM_BEDSIDE_MIN_LM, roundLm((need * BEDROOM_BEDSIDE_SHARE) / 2, 50));
  const bedsideAmbient = bedsidePer * 2;
  const generalLm = Math.max(0, need - bedsideAmbient);
  // La misma capa, dimensionada para leer cuando hace falta.
  const bedsideSpec = reads ? Math.max(BEDROOM_READING_LM, bedsidePer) : bedsidePer;

  const local = [];
  if (activities.includes("makeup")) {
    local.push({
      id: "maquillaje",
      pieces: 2,
      per: BEDROOM_MAKEUP_LM,
      lm: BEDROOM_MAKEUP_LM * 2,
      detail: "dos apliques a los lados del espejo, a la altura de los ojos — nunca un único punto cenital, que hunde en sombra los ojos y la nariz",
    });
  }
  const closet = BEDROOM_CLOSET_LM[answers.closetLight];
  if (closet) {
    local.push({
      id: "armario",
      pieces: 1,
      per: closet,
      lm: closet,
      detail: answers.closetLight === "dentro"
        ? "una tira LED continua dentro del armario, con los puntos de led muy juntos para que no se note el punteado"
        : "luminarias delante de las puertas, a unos 15-20 cm, para que la luz no quede detrás de ti al vestirte",
    });
  }

  return {
    mode, need, generalLm, bedsidePer, bedsideAmbient, bedsideSpec, reads, local,
    // Un plafón solo no puede con la luz general de un dormitorio grande.
    singlePointStrained: mode === "uno" && generalLm > BEDROOM_SINGLE_POINT_LIMIT,
  };
}

/* La frase que sostiene todo lo demás: el techo de un dormitorio no tiene que
 * dar toda la luz, y por eso puede ir más suelto que el de un salón. Se dice
 * siempre, en dormitorios de 7 y de 24 m², porque cuanto más pequeño es el
 * cuarto más peso tienen la mesita y el armario. */
function bedroomLayerTips(layers, grid) {
  const tips = [
    "En un dormitorio no hace falta que toda la luz salga del techo: la cabecera hace buena parte del trabajo y da un ambiente mucho más cálido para descansar.",
  ];
  if (layers.mode === "varios") {
    tips.push("Nemul no sabe cuántos puntos tienes en el techo ni dónde están, así que no te dibuja una retícula: te dice cuánta luz debería salir de ahí arriba en conjunto y tú la repartes entre los puntos que ya existen.");
  }
  if (layers.mode === "uno") {
    tips.push(layers.singlePointStrained
      ? `Un único punto de techo se queda corto para los ${layers.generalLm.toLocaleString("es-ES")} lm que pide esta habitación: una luminaria sola de ese flujo deslumbra al mirar hacia arriba desde la cama. Sin obra, la salida es aprovechar ese mismo punto con un carril, una suspensión de varios brazos o un plafón de varios focos, que reparten el flujo en vez de concentrarlo.`
      : "Con un solo punto de techo, elige una luminaria que reparta la luz en vez de concentrarla —difusor opaco, varios focos o luz indirecta hacia el techo— para no tener un foco intenso justo en el campo de visión desde la cama.");
  }
  if (grid && grid.n >= 9) {
    tips.push(`Los ${grid.n} downlights son la retícula más despejada que cabe respetando las distancias entre focos, no la única solución posible: con la cabecera y las capas localizadas puedes poner menos focos y dejar que el resto del flujo venga de ellas.`);
  }
  return tips;
}

/* ---------------------------------------------------------------------------
 * CAPAS DEL BAÑO
 *
 * El baño ya preguntaba todo lo necesario y no usaba casi nada: el tipo, lo que
 * se hace ante el espejo y la luz nocturna no movían ni un lumen —solo
 * generaban párrafos— y la ducha o bañera solo movía los kelvin. Los 250 lm/m²
 * se convertían íntegros en downlights.
 *
 * Cuatro capas, cada una activada por una respuesta que ya existe. Ninguna se
 * inventa para completar lúmenes, y ninguna se suma a los lm/m² de la general:
 * el espejo ilumina un plano vertical, no el suelo.
 *
 * El beneficio menos evidente es la temperatura. Antes, elegir bañera bajaba
 * TODO el baño a 3000 K, espejo incluido, y maquillarse a 3000 K falsea el
 * tono de piel. Ahora cada capa lleva la suya. */
const BATHROOM_NIGHT_TEMP_K = 2200;
const BATHROOM_NIGHT_LM = 60;

/* El flujo del espejo sale de lo que se hace delante de él; el CRI es 90 de
 * base y sube a 95 para maquillarse, que es el único uso donde el color del
 * producto sobre la piel tiene que verse tal cual. */
const BATHROOM_MIRROR_BY_USE = {
  // 3500 K donde hay que juzgar color sobre la piel; 3000 K donde lo que pesa
  // es la uniformidad. Ninguno llega a 4000: a esa temperatura la piel se ve
  // más apagada de lo que es y el maquillaje se corrige de más.
  maquillarme:  { per: 400, cri: 95, tempK: 3500 },
  rutinaFacial: { per: 400, cri: 90, tempK: 3500 },
  afeitarme:    { per: 350, cri: 90, tempK: 3000 },
  basico:       { per: 300, cri: 90, tempK: 3000 },
};

/* Zona húmeda. Deliberadamente NO se propone un downlight centrado sobre la
 * ducha: es lo que la propia lista de errores desaconseja, porque queda en la
 * vertical del vapor y encima deja la cara a contraluz. Se propone luz
 * indirecta o desplazada, con su grado de protección.
 *
 * Los grados salen de las zonas del baño: dentro del plato o la bañera, IP67;
 * en su vertical hasta 2,25 m, IP65; en los 60 cm de alrededor, IP44. */
const BATHROOM_WET_BY_FIXTURE = {
  ducha: [{
    id: "ducha", label: "Zona de ducha", lm: 400, ip: "IP65", tempText: "3000 K", dimmable: false,
    detail: "tira estanca IP67 en un foseado o en la hornacina de la ducha, o una luminaria IP65 desplazada hacia la entrada. Nunca un foco en la vertical de la cabeza: queda en el camino del vapor y te deja la cara a contraluz",
  }],
  banera: [{
    id: "banera", label: "Zona de bañera", lm: 300, ip: "IP65", tempText: "2700–3000 K", dimmable: true,
    detail: "luz indirecta y regulable: un aplique de pared a media altura o una tira oculta en el faldón. Cálida y baja, que es lo que convierte el baño en un rato de relax y no en una revisión médica",
  }],
};
BATHROOM_WET_BY_FIXTURE.ambas = [...BATHROOM_WET_BY_FIXTURE.ducha, ...BATHROOM_WET_BY_FIXTURE.banera];

function bathroomLayers(area, answers = {}, generalTempK = 4000) {
  const { type, mirrorUse, fixture, nightlight } = answers;

  // ---------- espejo: siempre, hasta en un aseo ----------
  const m = BATHROOM_MIRROR_BY_USE[mirrorUse] || BATHROOM_MIRROR_BY_USE.basico;
  const mirror = {
    pieces: 2, per: m.per, lm: m.per * 2, cri: m.cri, tempK: m.tempK,
    detail: `dos apliques a los lados del espejo, a la altura de los ojos — nunca un único punto encima, que hunde en sombra las cuencas y la nariz`,
  };

  /* ---------- zona húmeda: solo en baño completo y si hay respuesta ----------
   * En un aseo la pregunta ni se hace, así que la capa no existe. No se
   * sustituye por nada: si no hay ducha ni bañera, no hay que iluminar. */
  const wet = type === "aseo" ? [] : (BATHROOM_WET_BY_FIXTURE[fixture] || []);

  // ---------- nocturna: solo si la ha pedido ----------
  const night = nightlight === "si"
    ? {
        lm: BATHROOM_NIGHT_LM, tempK: BATHROOM_NIGHT_TEMP_K,
        detail: "a 30-40 cm del suelo, con sensor de presencia y en circuito propio: lo justo para ver el suelo sin despertarte del todo",
      }
    : null;

  return { mirror, wet, night, generalTempK };
}

function generateGenericTechnicalReport(roomId, answers = {}) {
  const cfg = ROOM_TECH_CONFIG[roomId];
  // Las medidas cuando las hay; el tramo, para los planes ya guardados.
  const area = roomArea(answers, cfg.areaMap[answers.size] ?? cfg.defaultArea);
  const dm = roomDims(answers);
  const lux = getLux(roomId, answers.light);
  const lumens = Math.round((lux * area) / 100) * 100;

  // El dormitorio no reparte el total entre downlights: lo reparte entre las
  // capas que el cuestionario dice que existen, y la retícula —cuando la hay—
  // se traza solo con lo que le toca al techo.
  const tempK = cfg.getTempK(answers);
  const layers = roomId === "bedroom" ? bedroomLayers(area, lumens, answers) : null;
  // El baño tiene sus propias capas y no comparte la maquinaria del dormitorio:
  // van en su propio campo para no tocar el reparto de la retícula.
  const bath = roomId === "bathroom" ? bathroomLayers(area, answers, tempK) : null;
  const grid = cfg.ambient
    ? ambientLayout(area, lumens, cfg.minDownlights)
    : layers
      // Posiciones y distancias solo con reforma: en los demás casos Nemul no
      // sabe dónde están los puntos, y un plano se lee como si lo supiera.
      ? (layers.mode === "reforma"
          ? openPlanLayout(area, layers.generalLm, cfg.minDownlights, cfg.minLmPerPoint, cfg.limits, dm)
          : null)
      : cfg.openGrid
        ? openPlanLayout(area, lumens, cfg.minDownlights, cfg.minLmPerPoint, cfg.limits, dm)
        : planLayout(area, lumens, cfg.minDownlights, dm);

  const tips = getReport(roomId, answers);
  if (layers) tips.push(...bedroomLayerTips(layers, grid));
  if (roomId === "office") tips.push(...officeTaskTips(lux));
  const mistakes = ROOM_TECH_MISTAKES[roomId] || [];
  return { tempK, lumens, grid, area, lux, tips, mistakes, layers, bath };
}

/* Salón y salón-comedor comparten las mismas preguntas, no el mismo recorrido.
 *
 * La diferencia está en un dato que en un caso se pregunta y en el otro ya se
 * sabe: si hay zona de comedor. En "Salón" no la hay —nadie la ha pedido, así
 * que Nemul no la inventa—. En "Salón-comedor" la damos por hecha desde la
 * primera pantalla, y por eso ahí no se pregunta "¿tienes zona de comedor?"
 * sino directamente por la mesa, que es lo único que cambia el reparto de luz.
 *
 * Esa misma información —dos zonas principales, estar y comedor— es la que
 * usarán después las capas. Aquí solo se recoge. */
const livingFlow = (roomId) => (answers = {}) => {
  const isDining = roomId === "livingDining";
  const room = isDining ? "salón-comedor" : "salón";
  return [
    { key: "renovationStatus", title: "¿Qué quieres hacer?", subtitle: "Esto decide si nos adaptamos a lo que ya hay o podemos diseñar de cero.", type: "single", layout: "list", options: livingProjectOptions(room), reactions: {
      onlyLights: "Perfecto: respetaremos los puntos de luz que ya tienes y completaremos con luminarias que no necesiten obra.",
      renovation: "Entonces podemos diseñar la distribución desde cero, sin depender de dónde estén los puntos actuales.",
    } },
    { key: "dims", title: `¿Cuánto mide aproximadamente tu ${room}?`, subtitle: "A ojo está bien: no hace falta sacar el metro.", info: `Con el largo y el ancho, Nemul calcula la superficie y también la forma de la estancia, que es lo que decide cómo se reparten los puntos de luz. En un ${room}, la luz general suele moverse entre 130 y 170 lm/m² según la luz natural que entre; las lámparas de lectura o de ambiente van aparte.`, type: "dims" },
    { key: "light", title: "¿Cuánta luz natural entra?", subtitle: "Piensa en un día normal, sin encender ninguna luz.", type: "single", layout: "list", options: LIGHT_OPTIONS },
    { key: "ceiling", title: "¿Qué tipo de techo tienes?", subtitle: "Esto determina qué soluciones de instalación son posibles.", type: "single", layout: "list", options: LIVING_CEILING_OPTIONS },
    // Con reforma no hay instalación que respetar, así que no se pregunta.
    ...(answers.renovationStatus === "renovation" ? [] : [
      { key: "ceilingPoints", title: "¿Cuántos puntos de luz tienes actualmente en el techo?", subtitle: "Nos adaptaremos a los que ya existen.", type: "single", layout: "list", options: LIVING_CEILING_POINTS_OPTIONS, reactions: {
        uno: "Con un solo punto, esa luminaria dará la luz general y el resto lo repartiremos en otras capas.",
        varios: "Con varios puntos, te diremos cuánta luz debe salir del techo en conjunto y la repartes entre los que tienes.",
      } },
    ]),
    { key: "activities", title: `¿Cómo usas tu ${room}?`, subtitle: isDining
      ? "La zona de comedor ya la damos por hecha. Cuéntanos qué más haces aquí."
      : "Puedes elegir varias opciones.", type: "multi", layout: "list", options: LIVING_ACTIVITY_OPTIONS },
    /* La forma de la mesa sí cambia la propuesta: redonda pide un punto
     * centrado y rectangular dos o tres en línea. En el salón-comedor se
     * pregunta siempre; en el salón no se pregunta nunca, salvo en un plan
     * antiguo que guardara la zona de comedor como actividad. */
    ...(isDining || (answers.activities || []).includes("dining") ? [
      { key: "diningShape", title: "¿La mesa del comedor es redonda, rectangular o cuadrada?", subtitle: "La forma cambia cómo repartimos la luz sobre ella.", type: "single", layout: "list", options: DINING_SHAPE_OPTIONS, reactions: {
        redonda: "Con mesa redonda, un único punto centrado suele ser suficiente y queda muy equilibrado.",
        rectangular: "Con mesa rectangular, dos o tres puntos en línea reparten mejor la luz.",
        cuadrada: "Con mesa cuadrada, un colgante centrado o de varias luces cubre bien toda la superficie.",
      } },
    ] : []),
  ];
};

const ROOM_FLOWS = {
  living: livingFlow("living"),
  livingDining: livingFlow("livingDining"),
  kitchen: [
    {
      key: "layout", title: "¿Qué distribución tiene tu cocina?", subtitle: "Elige la forma que más se parece a la tuya.", type: "single", layout: "grid", options: KITCHEN_LAYOUT_OPTIONS,
      reactions: KITCHEN_LAYOUT_REACTIONS,
      extra: KITCHEN_MULTI_ZONE_EXTRA,
    },
    { key: "dims", title: "¿Cuánto mide aproximadamente la cocina?", subtitle: "A ojo está bien: no hace falta sacar el metro.", info: "Con el largo y el ancho, Nemul calcula la superficie y también la forma de la cocina, que es lo que decide cómo se reparten los focos. Para una cocina suelen recomendarse entre 300 y 400 lm/m² según la luz natural.", type: "dims", extra: TALL_CEILING_EXTRA },
    { key: "priorities", title: "¿Qué es lo más importante para ti en la cocina?", subtitle: "Puedes elegir varias opciones.", type: "multi", layout: "list", options: KITCHEN_PRIORITY_OPTIONS },
    {
      key: "upperCabinets", title: "¿Tienes muebles altos?", subtitle: "Esto nos dice dónde puede faltar luz sobre la encimera.", type: "single", layout: "list", options: KITCHEN_UPPER_CABINETS_OPTIONS,
      reactions: {
        unaPared: "Anotado: esa pared es donde probablemente falte luz sobre la encimera.",
        dosParedes: "Con muebles en dos paredes, ninguna de las dos se puede quedar en sombra.",
        no: "Sin muebles altos, la luz general va a tener que hacer casi todo el trabajo.",
      },
    },
    { key: "light", title: "¿Cuánta luz natural recibe la cocina durante el día?", subtitle: "Piensa en un día normal, sin encender ninguna luz.", type: "single", layout: "list", options: LIGHT_OPTIONS },
    {
      key: "problem", title: "¿Qué te gustaría solucionar?", subtitle: "Elige lo que más se acerque a tu situación.", type: "single", layout: "list", options: KITCHEN_PROBLEM_OPTIONS,
      reactions: KITCHEN_PROBLEM_REACTIONS,
    },
    renovationStep,
  ],
  kitchenOpen: [
    { key: "layout", title: "¿Qué distribución tiene tu cocina?", subtitle: "Elige la forma que más se parece a la tuya.", type: "single", layout: "grid", options: KITCHEN_LAYOUT_OPTIONS, reactions: KITCHEN_LAYOUT_REACTIONS, extra: KITCHEN_MULTI_ZONE_EXTRA },
    { key: "dims", title: "¿Cuánto mide aproximadamente la zona de cocina?", subtitle: "Solo la parte de cocina, sin el salón al que se abre.", info: "Con el largo y el ancho, Nemul calcula la superficie y también la forma de la zona, que es lo que decide cómo se reparten los focos. Para una cocina suelen recomendarse entre 300 y 400 lm/m² según la luz natural.", type: "dims", extra: TALL_CEILING_EXTRA },
    { key: "priorities", title: "¿Qué es lo más importante para ti en la cocina?", subtitle: "Puedes elegir varias opciones.", type: "multi", layout: "list", options: KITCHEN_PRIORITY_OPTIONS },
    { key: "upperCabinets", title: "¿Tienes muebles altos?", subtitle: "Esto nos dice dónde puede faltar luz sobre la encimera.", type: "single", layout: "list", options: KITCHEN_UPPER_CABINETS_OPTIONS },
    { key: "light", title: "¿Cuánta luz natural recibe la cocina durante el día?", subtitle: "Piensa en un día normal, sin encender ninguna luz.", type: "single", layout: "list", options: LIGHT_OPTIONS },
    { key: "adjoiningStyle", title: "¿Qué ambiente tiene el salón con el que se conecta?", subtitle: "Así coordinamos la luz entre ambas zonas.", type: "single", layout: "grid", options: STYLE_OPTIONS },
    { key: "problem", title: "¿Qué te gustaría solucionar?", subtitle: "Elige lo que más se acerque a tu situación.", type: "single", layout: "list", options: KITCHEN_PROBLEM_OPTIONS, reactions: KITCHEN_PROBLEM_REACTIONS },
    renovationStep,
  ],
  /* El dormitorio pregunta primero qué se va a hacer, porque de eso depende
   * todo lo demás: si solo se cambian luminarias, la pregunta de cuántos
   * puntos hay es decisiva y el informe no dibujará ninguna retícula; si hay
   * reforma, esa pregunta sobra. Ver bedroomLayers. */
  bedroom: (answers = {}) => [
    { key: "renovationStatus", title: "¿Qué quieres hacer?", subtitle: "Esto decide si nos adaptamos a lo que ya hay o podemos diseñar de cero.", type: "single", layout: "list", options: BEDROOM_PROJECT_OPTIONS, reactions: {
      onlyLights: "Perfecto: respetaremos los puntos de luz que ya tienes y completaremos con luminarias que no necesiten obra.",
      renovation: "Entonces podemos diseñar la distribución desde cero, sin depender de dónde estén los puntos actuales.",
    } },
    { key: "dims", title: "¿Cuánto mide aproximadamente el dormitorio?", subtitle: "A ojo está bien: no hace falta sacar el metro.", info: "Con el largo y el ancho, Nemul calcula la superficie y también la forma de la habitación, que es lo que decide cómo se reparten los puntos de luz. En un dormitorio suelen bastar entre 130 y 170 lm/m² de luz general.", type: "dims" },
    lightStep,
    { key: "ceiling", title: "¿Qué tipo de techo tienes?", subtitle: "Esto determina qué soluciones de instalación son posibles.", type: "single", layout: "list", options: BEDROOM_CEILING_OPTIONS },
    // Condicional: con reforma no hay nada que respetar, así que no se pregunta.
    ...(answers.renovationStatus === "renovation" ? [] : [
      { key: "ceilingPoints", title: "¿Cuántos puntos de luz tienes actualmente en el techo?", subtitle: "Nos adaptaremos a los que ya existen.", type: "single", layout: "list", options: BEDROOM_CEILING_POINTS_OPTIONS, reactions: {
        uno: "Con un solo punto, esa luminaria dará la luz general y la cabecera hará el resto del trabajo.",
        varios: "Con varios puntos, te diremos cuánta luz debe salir del techo en conjunto y la repartes entre los que tienes.",
      } },
    ]),
    activityStep("bedroom", "Puedes elegir varias opciones."),
    { key: "closetLight", title: "¿Quieres iluminar especialmente el armario?", subtitle: "Ideal si te vistes ahí mismo.", type: "single", layout: "list", options: CLOSET_LIGHT_OPTIONS },
  ],
  bathroom: (answers = {}) => [
    { key: "type", title: "¿Qué tipo de baño es?", subtitle: "Esto cambia cuántas zonas de luz necesitas.", type: "single", layout: "list", options: BATHROOM_TYPE_OPTIONS, reactions: {
      aseo: "Al ser un aseo, con un buen punto sobre el espejo y otro general bastará.",
      completo: "En un baño completo, vamos a diferenciar la luz del espejo, la ducha o bañera, y la general.",
    } },
    { key: "dims", title: "¿Cuánto mide aproximadamente el baño?", subtitle: "A ojo está bien: no hace falta sacar el metro.", info: "Con el largo y el ancho, Nemul calcula la superficie y también la forma del baño, que es lo que decide cómo se reparten los focos. En un baño, la luz general suele moverse entre 180 y 230 lm/m²; el espejo y la zona húmeda se calculan aparte.", type: "dims" },
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
    { key: "dims", title: "¿Cuánto mide aproximadamente el comedor?", subtitle: "A ojo está bien: no hace falta sacar el metro.", info: "Con el largo y el ancho, Nemul calcula la superficie y también la forma del comedor, que es lo que decide cómo se reparten los puntos de luz. En un comedor suelen recomendarse entre 150 y 200 lm/m².", type: "dims" },
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
    { key: "dims", title: "¿Cuánto mide aproximadamente el vestidor?", subtitle: "A ojo está bien: no hace falta sacar el metro.", info: "Con el largo y el ancho, Nemul calcula la superficie y también la forma del vestidor, que es lo que decide cómo se reparten los puntos de luz. Aquí conviene entre 250 y 300 lm/m² para ver bien los colores.", type: "dims" },
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
    { key: "dims", title: "¿Cuánto mide aproximadamente la terraza?", subtitle: "A ojo está bien: no hace falta sacar el metro.", info: "Con el largo y el ancho, Nemul calcula la superficie. En una terraza suelen bastar entre 80 y 150 lm/m² de ambiente.", type: "dims" },
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
    { key: "dims", title: "¿Cuánto mide aproximadamente el despacho?", subtitle: "A ojo está bien: no hace falta sacar el metro.", info: "Con el largo y el ancho, Nemul calcula la superficie y también la forma del despacho, que es lo que decide cómo se reparten los focos. Un despacho se calcula en dos capas: la luz general de la estancia, entre 200 y 250 lm/m², y la de la mesa, que debe llegar a unos 500 lux con una lámpara de escritorio.", type: "dims" },
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
    // Abre el informe del pasillo: es la idea que cambia el planteamiento
    // antes de entrar en longitudes y sensores.
    parts.push("En un pasillo no siempre es necesario instalar iluminación en el techo. Un foseado lineal, balizas, apliques de pared o tiras LED en el rodapié pueden guiar el recorrido con una luz uniforme, evitando deslumbramientos y creando un ambiente más agradable.");
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
  const renovationDict = roomId === "bedroom" ? BEDROOM_RENOVATION_INSIGHT : RENOVATION_INSIGHT;
  if (renovationDict[answers.renovationStatus]) parts.push(renovationDict[answers.renovationStatus]);
  if (parts.length === 0) parts.push("Con lo que nos cuentes de este espacio, Nemul preparará un estudio de iluminación a medida.");
  return parts;
}

function formatDate(d) {
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

// La barra de estado falsa ("9:41") y el indicador de home de iOS se han
// eliminado: eran atrezzo de mockup dentro de un producto real.

function TopNav({ onBack, step, total, eyebrow }) {
  return (
    <div className="px-6 pt-4 pb-5">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={onBack}
          aria-label="Volver"
          className="tap-scale w-10 h-10 -ml-2 rounded-full flex items-center justify-center"
        >
          <ArrowLeft size={18} color={COLORS.text} strokeWidth={1.8} />
        </button>
        {total ? (
          // Barra de progreso continua: más legible que una fila de puntos y
          // no crece indefinidamente cuando el cuestionario tiene muchos pasos.
          <div className="flex-1 mx-4 h-[3px] rounded-full overflow-hidden" style={{ backgroundColor: COLORS.border }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${((step + 1) / total) * 100}%`, backgroundColor: COLORS.text }}
            />
          </div>
        ) : <div className="flex-1" />}
        <div className="w-10" />
      </div>
      {/* Este rótulo dice en qué pantalla estás ("INFORME DE EJEMPLO",
          "DESPACHO"), y en marrón claro a 12px con mucho espaciado apenas se
          leía. Cumplía el contraste mínimo, pero cumplir no es lo mismo que
          verse. En marrón oscuro y algo más grueso se lee de un vistazo. */}
      {eyebrow && <p className="font-body t-eyebrow text-center" style={{ color: COLORS.text, fontWeight: 600 }}>{eyebrow}</p>}
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="tap-scale w-full font-body font-medium t-body rounded-xl py-4"
      style={{
        backgroundColor: disabled ? COLORS.border : COLORS.bulb,
        color: disabled ? COLORS.subtext : COLORS.bulbInk,
        cursor: disabled ? "default" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

// Acción secundaria: mismo peso de forma, sin relleno. Evita que dos botones
// compitan por la atención en la misma pantalla.
function SecondaryButton({ children, onClick, disabled, Icon }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="tap-scale w-full flex items-center justify-center gap-2 font-body font-medium t-body rounded-xl py-4"
      style={{ backgroundColor: "transparent", border: `1px solid ${COLORS.text}`, color: COLORS.text }}
    >
      {Icon && <Icon size={16} color={COLORS.text} strokeWidth={1.8} />}
      {children}
    </button>
  );
}

function OptionRow({ selected, onClick, Icon, label, hint, multi, delay = 0 }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className="option-in tap-scale w-full flex items-center gap-4 rounded-xl px-5 py-4 text-left"
      style={{
        backgroundColor: selected ? COLORS.bgAlt : COLORS.card,
        border: `1px solid ${selected ? COLORS.text : COLORS.border}`,
        animationDelay: `${delay}ms`,
      }}
    >
      {/* El icono va suelto, sin círculo de fondo: menos ruido por fila. */}
      {Icon && <Icon size={20} color={selected ? COLORS.text : COLORS.subtext} strokeWidth={1.5} className="shrink-0" />}
      <div className="flex-1">
        <p className="font-body t-body font-medium" style={{ color: COLORS.text }}>{label}</p>
        {hint && <p className="font-body t-small mt-0.5" style={{ color: COLORS.subtext }}>{hint}</p>}
      </div>
      <div
        className={`w-5 h-5 flex items-center justify-center shrink-0 ${multi ? "rounded-[4px]" : "rounded-full"}`}
        style={{ backgroundColor: selected ? COLORS.text : "transparent", border: `1px solid ${selected ? COLORS.text : COLORS.border}` }}
      >
        {selected && <Check size={12} color="#FFFFFF" strokeWidth={3} className="check-pop" />}
      </div>
    </button>
  );
}

function WelcomeScreen({ onStart, onSeeSample }) {
  return (
    <div className="flex flex-col h-full screen-actions px-6 pt-10 rise-in">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <Lightbulb size={32} color={COLORS.bulb} fill={COLORS.bulb} strokeWidth={1.2} className="mb-8" />
        <p className="font-body t-eyebrow mb-4" style={{ color: COLORS.subtext }}>Nemul</p>
        <h1 className="font-display t-hero font-medium mb-5" style={{ color: COLORS.text }}>Iluminemos<br />tu hogar</h1>
        <p className="font-body t-body max-w-[300px]" style={{ color: COLORS.subtext }}>
          Cuéntanos cómo vives cada espacio. Nosotros nos encargamos de la parte técnica.
        </p>
        {/* Esto estaba debajo de "Comenzar", en la barra de acciones. En un
            navegador de escritorio se veía; en un móvil real quedaba a diez
            píxeles del borde inferior y la barra de direcciones se lo comía.
            Aquí, dentro del bloque centrado, no depende de dónde acabe la
            pantalla. Sigue siendo secundario —"Comenzar" es el único botón
            de la barra— pero se ve. */}
        <button
          onClick={onSeeSample}
          className="tap-scale mt-9 inline-flex items-center gap-2 rounded-xl px-5 py-3 font-body t-small font-medium transition-all duration-200"
          style={{ color: COLORS.text, backgroundColor: COLORS.bgAlt, border: `1px solid ${COLORS.border}` }}
        >
          Ver un informe de ejemplo
          <ChevronRight size={14} color={COLORS.text} />
        </button>
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
      <div className="flex-1 overflow-y-auto px-6">
        <div className="text-center mb-6 pt-2">
          <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: COLORS.bgAlt }}>
            <Lock size={22} color={COLORS.accent} strokeWidth={1.8} />
          </div>
          <p className="font-body t-eyebrow mb-2" style={{ color: COLORS.accent }}>Premium</p>
          <h2 className="font-display t-display font-medium mb-2" style={{ color: COLORS.text }}>Desbloquea toda tu vivienda</h2>
          <p className="font-body t-body" style={{ color: COLORS.subtext }}>
            Ya probaste {freeRoomLabel} gratis. El resto de habitaciones forman parte de Premium.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 mb-6">
          {["Toda la vivienda", "Informe en PDF", "Recomendaciones avanzadas"].map((f) => (
            <div key={f} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
              <Check size={15} color={COLORS.success} strokeWidth={2.5} className="shrink-0" />
              <span className="font-body t-body font-medium" style={{ color: COLORS.text }}>{f}</span>
            </div>
          ))}
        </div>

        {!submitted ? (
          <div className="rounded-xl p-5" style={{ backgroundColor: COLORS.bgAlt, border: `1px solid ${COLORS.border}` }}>
            <p className="font-body t-small mb-3" style={{ color: COLORS.text }}>
              Premium todavía no está activo. Déjanos tu email y te avisamos en cuanto esté disponible.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full rounded-xl px-4 py-3 mb-3 font-body t-body"
              style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
            />
            <PrimaryButton onClick={handleSubmit} disabled={!email.trim() || sending}>
              {sending ? "Enviando..." : "Avísame cuando esté listo"}
            </PrimaryButton>
            {error && (
              <p className="font-body t-caption mt-2 text-center" style={{ color: COLORS.warning }}>
                No se pudo enviar. Vuelve a intentarlo en un momento.
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-xl p-5 text-center" style={{ backgroundColor: COLORS.bgAlt }}>
            <Check size={20} color={COLORS.success} strokeWidth={2.5} className="mx-auto mb-2" />
            <p className="font-body t-body font-medium" style={{ color: COLORS.text }}>¡Listo! Te avisaremos en cuanto Premium esté disponible.</p>
          </div>
        )}
      </div>
      <div className="screen-actions px-6 pt-4">
        <button onClick={onContinueFree} className="w-full font-body t-small font-medium py-2 flex items-center justify-center gap-1" style={{ color: COLORS.subtext }}>
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
      <div className="px-6 pb-4">
        <h2 className="font-display t-display font-medium mb-1.5" style={{ color: COLORS.text }}>¿Qué espacio?</h2>
        <p className="font-body t-small" style={{ color: COLORS.subtext }}>
          {freeRoomId
            ? "Tu habitación gratuita ya está elegida. El resto son parte de Premium."
            : "Elige el espacio para el que quieras planear la iluminación. La primera es gratis."}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto px-6">
        <div className="grid grid-cols-2 gap-3 pb-3">
          {ROOMS.filter((r) => !r.hidden).map(({ id, label, Icon }, i) => {
            const isSelected = selected.includes(id);
            const isLocked = freeRoomId && freeRoomId !== id;
            return (
              <button
                key={id}
                onClick={() => toggle(id)}
                className="option-in tap-scale relative flex flex-col items-center justify-center gap-3 rounded-xl py-6 px-3"
                style={{ backgroundColor: isSelected ? COLORS.bgAlt : COLORS.card, border: `1px solid ${isSelected ? COLORS.text : COLORS.border}`, animationDelay: `${i * 40}ms` }}
              >
                {isLocked && (
                  <Lock size={12} color={COLORS.subtext} strokeWidth={2} className="absolute top-3 right-3" />
                )}
                <Icon size={24} color={isSelected ? COLORS.text : COLORS.subtext} strokeWidth={1.4} style={{ opacity: isLocked ? 0.5 : 1 }} />
                <span className="font-body t-body font-medium text-center" style={{ color: isLocked ? COLORS.subtext : COLORS.text }}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="screen-actions px-6 pt-4">
        <PrimaryButton onClick={onContinue} disabled={selected.length === 0}>Continuar</PrimaryButton>
      </div>
    </div>
  );
}

/* Los dos campos de medidas. Teclado numérico en el móvil, coma o punto
 * indistintos, y la superficie calculándose debajo mientras se escribe: es la
 * forma de que quien teclea vea al momento si se ha equivocado de una cifra. */
function DimensionFields({ value, onChange }) {
  const dims = value || {};
  const area = roomDims({ dims }) ? Math.round(parseDim(dims.length) * parseDim(dims.width) * 10) / 10 : null;
  const touched = (dims.length || "") !== "" || (dims.width || "") !== "";
  const wrong = touched && !roomDims({ dims });

  /* Los dos campos van escritos a mano y no con un componente local: un
   * componente definido dentro de este cuerpo se recrea en cada render, y
   * React desmonta el <input> en cada pulsación. El síntoma es que el campo
   * pierde el foco después de teclear un solo carácter. */
  return (
    <div>
      <div className="flex gap-3">
        {[{ k: "length", label: "Largo" }, { k: "width", label: "Ancho" }].map(({ k, label }) => (
          <label key={k} className="flex-1 rounded-xl px-4 py-3.5" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
            <span className="font-body t-small block" style={{ color: COLORS.subtext }}>{label}</span>
            <span className="flex items-baseline gap-1.5">
              <input
                type="text" inputMode="decimal" autoComplete="off"
                value={dims[k] ?? ""}
                onChange={(e) => onChange(k, e.target.value)}
                placeholder="0,0"
                aria-label={`${label} en metros`}
                className="font-display bg-transparent outline-none w-full min-w-0"
                style={{ color: COLORS.text, fontSize: 26, lineHeight: 1.2 }}
              />
              <span className="font-body t-body shrink-0" style={{ color: COLORS.subtext }}>m</span>
            </span>
          </label>
        ))}
      </div>
      <p className="font-body t-body mt-3 rounded-xl px-4 py-3" style={{ color: area ? COLORS.text : COLORS.subtext, backgroundColor: COLORS.bg }}>
        {area
          ? <>Superficie aproximada: <span className="font-medium">{fmtDim(area)} m²</span></>
          : wrong
            ? `Escribe las dos medidas en metros, entre ${DIM_MIN_M} y ${DIM_MAX_M}.`
            : "Superficie aproximada: la calculamos en cuanto pongas las dos medidas."}
      </p>
    </div>
  );
}

function QuestionScreen({ step, value, onSelect, onContinue, onBack, stepIndex, total, eyebrow, extraValue, onToggleExtra }) {
  const isMulti = step.type === "multi";
  const isDims = step.type === "dims";
  const isAnswered = isMulti ? (value || []).length > 0 : isDims ? !!roomDims({ dims: value }) : !!value;
  const [showInfo, setShowInfo] = useState(false);
  return (
    <div className="flex flex-col h-full rise-in">
      <TopNav onBack={onBack} step={stepIndex} total={total} eyebrow={eyebrow} />
      <div className="px-6 pb-5 pt-1">
        <h2 className="font-display t-display font-medium mb-1.5" style={{ color: COLORS.text }}>{step.title}</h2>
        <div className="flex items-center gap-1.5">
          <p className="font-body t-small" style={{ color: COLORS.subtext }}>{step.subtitle}</p>
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
          <p className="font-body t-body mt-2 rounded-xl p-3" style={{ color: COLORS.subtext, backgroundColor: COLORS.bg }}>
            {step.info}
          </p>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-6">
        {isDims && <DimensionFields value={value} onChange={onSelect} />}
        {step.layout === "list" && step.options && (
          <div className="flex flex-col gap-3">
            {step.options.map((opt, i) => {
              const selected = isMulti ? (value || []).includes(opt.id) : value === opt.id;
              return <OptionRow key={opt.id} selected={selected} onClick={() => onSelect(opt.id)} Icon={opt.Icon} label={opt.label} hint={opt.hint} multi={isMulti} delay={i * 45} />;
            })}
          </div>
        )}
        {step.layout === "grid" && step.options && (
          <div className="grid grid-cols-2 gap-3">
            {step.options.map((opt, i) => {
              const selected = isMulti ? (value || []).includes(opt.id) : value === opt.id;
              const { Icon } = opt;
              return (
                <button
                  key={opt.id}
                  onClick={() => onSelect(opt.id)}
                  className="option-in tap-scale rounded-xl py-5 px-3 text-center flex flex-col items-center gap-2"
                  style={{ backgroundColor: selected ? COLORS.bgAlt : COLORS.card, border: `1px solid ${selected ? COLORS.text : COLORS.border}`, animationDelay: `${i * 45}ms` }}
                >
                  {Icon && (
                    <Icon size={22} color={selected ? COLORS.text : COLORS.subtext} strokeWidth={1.4} />
                  )}
                  <p className="font-body t-body font-medium" style={{ color: COLORS.text }}>{opt.label}</p>
                  {opt.hint && <p className="font-body t-small" style={{ color: COLORS.subtext }}>{opt.hint}</p>}
                </button>
              );
            })}
          </div>
        )}
        {/* Matiz opcional que viaja dentro de una pregunta que ya existe, en
            vez de gastar una pantalla propia. Sin marcar no hace nada; al
            marcarlo entra en el cálculo. Así el cuestionario se queda en ocho
            pasos sin perder la variable. */}
        {step.extra && (
          <button
            onClick={onToggleExtra}
            aria-pressed={!!extraValue}
            className="tap-scale w-full flex items-center gap-4 rounded-xl px-5 py-4 mt-3 text-left"
            style={{
              backgroundColor: extraValue ? COLORS.bgAlt : "transparent",
              border: `1px dashed ${extraValue ? COLORS.text : COLORS.border}`,
            }}
          >
            <div
              className="w-5 h-5 rounded-[4px] flex items-center justify-center shrink-0"
              style={{
                backgroundColor: extraValue ? COLORS.text : "transparent",
                border: `1px solid ${extraValue ? COLORS.text : COLORS.border}`,
              }}
            >
              {extraValue && <Check size={12} color="#FFFFFF" strokeWidth={3} className="check-pop" />}
            </div>
            <div className="flex-1">
              <p className="font-body t-body" style={{ color: COLORS.text }}>{step.extra.label}</p>
              {step.extra.hint && (
                <p className="font-body t-small mt-0.5" style={{ color: COLORS.subtext }}>{step.extra.hint}</p>
              )}
            </div>
          </button>
        )}
      </div>
      {!isMulti && step.reactions && value && step.reactions[value] && (
        <div className="px-6 pb-2 rise-in">
          <div className="flex items-start gap-2.5 rounded-xl px-4 py-3" style={{ backgroundColor: COLORS.bgAlt }}>
            <Sparkles size={14} color={COLORS.accent} strokeWidth={1.8} className="mt-0.5 shrink-0" />
            <p className="font-body t-small italic" style={{ color: COLORS.primary }}>
              {step.reactions[value]}
            </p>
          </div>
        </div>
      )}
      <div className="screen-actions px-6 pt-4">
        <PrimaryButton onClick={onContinue} disabled={!isAnswered}>Continuar</PrimaryButton>
      </div>
    </div>
  );
}

function RoomDoneScreen({ roomLabel, RoomIcon, nextLabel, onContinue }) {
  return (
    <div className="flex flex-col h-full screen-actions px-6 pt-10 rise-in">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: COLORS.bgAlt }}>
          <Check size={26} color={COLORS.success} strokeWidth={2} />
        </div>
        <p className="font-body t-eyebrow mb-2" style={{ color: COLORS.accent }}>{roomLabel} listo</p>
        <h2 className="font-display t-display font-medium mb-3" style={{ color: COLORS.text }}>Muy bien</h2>
        <p className="font-body t-body max-w-[260px]" style={{ color: COLORS.subtext }}>
          El plan de iluminación de tu {roomLabel.toLowerCase()} está listo. Sigamos con el siguiente espacio.
        </p>
        <div className="flex items-center gap-3 mt-8 rounded-xl px-5 py-3" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
          {RoomIcon && <RoomIcon size={18} color={COLORS.accent} strokeWidth={1.6} />}
          <span className="font-body t-small font-medium" style={{ color: COLORS.text }}>Siguiente: {nextLabel}</span>
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
    if (step.type === "dims") {
      const dm = roomDims({ dims: raw });
      text = dm ? `${fmtDim(dm.length)} × ${fmtDim(dm.width)} m · ${fmtDim(Math.round(dm.w * dm.d * 10) / 10)} m²` : "Sin respuesta";
    } else if (step.type === "multi") {
      const ids = raw || [];
      const labels = ids.map((id) => step.options.find((o) => o.id === id)?.label).filter(Boolean);
      text = labels.length ? labels.join(", ") : "Ninguna opción seleccionada";
    } else {
      const opt = step.options.find((o) => o.id === raw);
      text = opt ? opt.label : "Sin respuesta";
    }
    if (step.extra && answers[step.extra.key]) text += ` · ${step.extra.label}`;
    return { index, title: step.title, text };
  });
}

function ReviewScreen({ room, summary, onEdit, onConfirm, onBack }) {
  return (
    <div className="flex flex-col h-full rise-in">
      <TopNav onBack={onBack} />
      <div className="px-6 pb-4">
        <p className="font-body t-eyebrow mb-2" style={{ color: COLORS.accent }}>{room.label}</p>
        <h2 className="font-display t-display font-medium mb-1.5" style={{ color: COLORS.text }}>Antes de continuar</h2>
        <p className="font-body t-small" style={{ color: COLORS.subtext }}>Revisa que todo esté correcto. Toca cualquier respuesta para cambiarla.</p>
      </div>
      <div className="flex-1 overflow-y-auto px-6">
        <div className="flex flex-col gap-2.5 pb-4">
          {summary.map((item) => (
            <button
              key={item.index}
              onClick={() => onEdit(item.index)}
              className="w-full flex items-center gap-3 rounded-xl p-4 text-left transition-all duration-200"
              style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}
            >
              <div className="flex-1 min-w-0">
                <p className="font-body t-small" style={{ color: COLORS.subtext }}>{item.title}</p>
                <p className="font-body t-small font-medium mt-0.5" style={{ color: COLORS.text }}>{item.text}</p>
              </div>
              <Pencil size={15} color={COLORS.subtext} strokeWidth={1.8} className="shrink-0" />
            </button>
          ))}
        </div>
      </div>
      <div className="screen-actions px-6 pt-4">
        <PrimaryButton onClick={onConfirm}>Confirmar y ver mi informe</PrimaryButton>
      </div>
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="flex items-center gap-3">
      <Check size={15} color={COLORS.success} strokeWidth={2.5} className="shrink-0" />
      <p className="font-body t-small" style={{ color: COLORS.text }}>
        <span style={{ color: COLORS.subtext }}>{label}: </span>
        <span className="font-medium">{value}</span>
      </p>
    </div>
  );
}

// data-pdf-keep: al generar el PDF, este bloque no se parte entre dos
// páginas. Si no cabe en lo que queda de hoja, pasa entero a la siguiente.
function MistakesList({ mistakes }) {
  return (
    <div data-pdf-keep>
      <p className="font-body t-eyebrow mb-2.5" style={{ color: COLORS.warning }}>Errores que debes evitar</p>
      <div className="flex flex-col gap-2">
        {mistakes.map((m, i) => (
          <div key={i} className="option-in flex items-start gap-3 rounded-xl p-3.5" style={{ backgroundColor: COLORS.bgAlt, border: `1px solid ${COLORS.border}`, animationDelay: `${i * 60}ms` }}>
            <X size={15} color={COLORS.warning} strokeWidth={2.2} className="mt-0.5 shrink-0" />
            <p className="font-body t-body" style={{ color: COLORS.text }}>{m}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Transparencia sin tecnicismo: el usuario ve de dónde sale el número,
// sin que nadie le explique una fórmula.
//
// Aquí se daba un rango ("6–7 × 800 lm") y el plano de abajo dibujaba 6, así
// que quien lo leía se quedaba sin saber cuál poner. Ahora hay una propuesta
// con un número: los focos que pide la retícula y el flujo que le toca a cada
// uno. Un rango es honesto en la cabeza de quien calcula; en la de quien
// compra bombillas es una pregunta sin responder.
function CalculationBlock({ area, lux, lumens, grid, onlyLights = false, ambientOnly = false }) {
  const { n, lmPer, totalLm } = grid;
  return (
    <div>
      <p className="font-body t-eyebrow mb-2.5" style={{ color: COLORS.accent }}>Cálculo realizado</p>
      <div className="flex flex-col gap-3 rounded-xl p-4" style={{ backgroundColor: COLORS.bg }}>
        <StatRow label="Superficie" value={`${fmtArea(area)} m²`} />
        <div>
          {/* En una estancia con zona de trabajo este número NO es el nivel de
              la mesa, y llamarlo "nivel de iluminación recomendado" a secas es
              lo que llevaba a aplicarle los 500 lux del escritorio a los m²
              enteros. Aquí se dice de qué luz habla. */}
          <StatRow label={ambientOnly ? "Luz general recomendada" : "Nivel de iluminación recomendado"} value={`${lux} lm/m²`} />
          <p className="font-body t-small italic mt-1 ml-9" style={{ color: COLORS.subtext }}>
            {ambientOnly ? "una luz cómoda para estar y moverse por la estancia; la de la mesa se calcula aparte, justo debajo" : describeLux(lux)}
          </p>
        </div>
        <StatRow label={ambientOnly ? "Luz general total necesaria" : "Iluminación total necesaria"} value={`${lumens.toLocaleString("es-ES")} lúmenes`} />
        {/* Quien no va a abrir puntos nuevos no necesita una lista de focos:
            necesita saber en cuántas zonas repartir la luz que ya puede
            encender. El número es el mismo; lo que cambia es qué promete. */}
        <StatRow
          label={onlyLights ? "Reparto orientativo" : "Propuesta"}
          value={onlyLights ? `${n} zonas de luz de unos ${lmPer} lm` : `${n} downlights de ${lmPer} lm`}
        />
        <StatRow label="Flujo total aproximado" value={`${totalLm.toLocaleString("es-ES")} lm`} />
      </div>
      <p className="font-body t-caption mt-2.5" style={{ color: COLORS.subtext }}>
        {onlyLights
          ? `Esto no es una lista de compra ni un plano de obra: dice cuánta luz pide la estancia y en cuántas zonas conviene repartirla —aquí, unos ${spacingText(grid, true)}— sin tocar la instalación. Con los puntos que ya tienes, acércate a ese total con luminarias que abran el haz en varias direcciones y con lámparas de pie o de mesa donde no llegue ningún punto. Lo que conviene mantener es el flujo total, no el número de zonas.`
          : `El número de focos sale de la retícula, no del catálogo: primero se calcula cuánta luz hace falta, después entre cuántos puntos tiene sentido repartirla —aquí, unos ${spacingText(grid)}— y el flujo de cada uno se ajusta al final para llegar al total. Es una propuesta equilibrada, no una regla: si el modelo que te gusta da más o menos lúmenes, puedes poner algún foco más o menos y repartirlos a tu manera. Lo que conviene mantener es el flujo total.`}
      </p>
    </div>
  );
}

/* La capa que faltaba: la mesa.
 *
 * El bloque de arriba habla de la habitación. Este habla de los 60 cm donde
 * se lee y se escribe, que piden mucha más luz y no la piden del techo. Antes
 * los dos niveles eran el mismo número, así que para dar a la mesa sus 500 lux
 * se iluminaba todo el despacho a 500 lux: seis focos en 9 m² para acabar
 * escribiendo sobre la sombra de la propia mano, que es lo que hace un
 * downlight situado detrás de quien trabaja.
 */
function TaskLightingBlock({ lux }) {
  const { lm } = deskTaskLamp(lux);
  return (
    <div data-pdf-keep>
      <p className="font-body t-eyebrow mb-2.5" style={{ color: COLORS.accent }}>Luz de tarea: la zona del escritorio</p>
      <div className="flex flex-col gap-3 rounded-xl p-4" style={{ backgroundColor: COLORS.bg }}>
        <StatRow label="Objetivo sobre la mesa" value={`unos ${TASK_LUX_TARGET} lux`} />
        <div>
          <StatRow label="Lámpara de escritorio" value={`unos ${lm} lm, regulable`} />
          <p className="font-body t-small italic mt-1 ml-9" style={{ color: COLORS.subtext }}>
            Una lámpara de mesa o un flexo orientable corriente, no un foco más en el techo.
          </p>
        </div>
      </div>
      <p className="font-body t-caption mt-2.5" style={{ color: COLORS.subtext }}>
        Los {TASK_LUX_TARGET} lux son el nivel de la superficie de trabajo, no el de la habitación entera. Llevar ahí toda la estancia obligaría a llenar el techo de focos, deslumbraría al levantar la vista y aun así dejaría tu propia sombra sobre el papel. Elige la lámpara con buena fidelidad de color (CRI ≥ 90) y colócala del lado contrario a tu mano dominante.
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * PIEZAS VISUALES DEL INFORME
 *
 * Todo lo que sigue es SVG y CSS: ni una sola imagen, y es deliberado. El PDF
 * se genera rasterizando el informe entero (ver downloadReportAsPdf) y la
 * escala de captura BAJA a medida que el documento crece; meter fotos haría
 * que todo el texto saliera más borroso, además de pesar en la primera visita
 * y de arrastrar CORS y licencias. Un dibujo vectorial no cuesta nada y sale
 * nítido a cualquier escala.
 *
 * Los ids de los degradados son deterministas a propósito (nada de useId):
 * html2canvas clona el informe en otro documento y las referencias url(#...)
 * tienen que seguir resolviendo. El informe se pinta dos veces a la vez —en
 * pantalla y en la copia de impresión—, así que un mismo id existe duplicado;
 * las dos definiciones son idénticas, de modo que resolver a la primera es
 * exactamente lo que queremos.
 * ------------------------------------------------------------------------- */

// El tono de una escena depende SOLO de los kelvin, nunca de si es la opción
// recomendada. Si 4000 K se dibujara frío cuando lo descartamos y cálido
// cuando lo recomendamos, el dibujo dejaría de ser un dato y sería un adorno
// que además engaña.
const SCENE_LIGHT = {
  // 2700 y 3000 comparten tono (38,6°) y solo se distinguen en claridad: por
  // eso el 2700 se veía anaranjado, no por ser más cálido sino por ser más
  // oscuro y saturado. Subido de L50 a L56 se lee como luz de salón y sigue
  // siendo claramente más cálido que el 3000 (L62), ayudado por su top mayor.
  2700: { wash: "#EDA934", top: 0.54, bottom: 0.1, paper: "#FFFCF6", ink: 0.78 },
  3000: { wash: "#F2B84B", top: 0.46, bottom: 0.07, paper: "#FFFDFA", ink: 0.82 },
  3500: { wash: "#F7DCA8", top: 0.62, bottom: 0.14, paper: "#FFFEFB", ink: 0.84 },
  4000: { wash: "#E6EDF3", top: 0.72, bottom: 0.22, paper: "#FDFEFF", ink: 0.86 },
};

// Un dibujo por tipo de estancia, no uno por habitación: el salón y el
// salón-comedor comparten sofá, y la cocina y la cocina abierta, encimera.
const SCENE_KIND_BY_ROOM = {
  living: "lounge", livingDining: "lounge",
  kitchen: "kitchen", kitchenOpen: "kitchen",
  bedroom: "bedroom", bathroom: "bathroom", dining: "dining",
  closet: "closet", office: "office", terrace: "terrace",
};

// Trazos sueltos: el color, el grosor y el fondo los pone SceneArt, para que
// una escena solo se diferencie de otra en la luz.
const SCENE_ART = {
  lounge: (
    <>
      <line x1="0" y1="84" x2="150" y2="84" />
      <rect x="46" y="24" width="30" height="22" rx="2" />
      <path d="M24 84V66a4 4 0 0 1 4-4h50a4 4 0 0 1 4 4v18" />
      <path d="M24 70h58" />
      <path d="M32 62V54a3 3 0 0 1 3-3h36a3 3 0 0 1 3 3v8" />
      <line x1="120" y1="84" x2="120" y2="50" />
      <path d="M111 50l4-11h10l4 11z" />
      <ellipse cx="66" cy="94" rx="46" ry="5" />
    </>
  ),
  kitchen: (
    <>
      <line x1="0" y1="88" x2="150" y2="88" />
      <rect x="18" y="30" width="46" height="20" rx="2" />
      <rect x="76" y="30" width="46" height="20" rx="2" />
      <path d="M14 88V62h122v26" />
      <line x1="14" y1="68" x2="136" y2="68" />
      <path d="M92 62v-6a6 6 0 0 1 6-6" />
      <line x1="30" y1="75" x2="30" y2="81" />
      <line x1="60" y1="75" x2="60" y2="81" />
      <line x1="105" y1="75" x2="105" y2="81" />
    </>
  ),
  bedroom: (
    <>
      <line x1="0" y1="84" x2="150" y2="84" />
      <rect x="36" y="38" width="78" height="15" rx="2" />
      <path d="M30 84V66h90v18" />
      <line x1="30" y1="72" x2="120" y2="72" />
      <rect x="44" y="57" width="26" height="9" rx="3" />
      <rect x="80" y="57" width="26" height="9" rx="3" />
      <rect x="12" y="70" width="16" height="14" rx="1.5" />
      <rect x="122" y="70" width="16" height="14" rx="1.5" />
      <path d="M20 70v-8" />
      <path d="M15 62l3-7h4l3 7z" />
    </>
  ),
  bathroom: (
    <>
      <line x1="0" y1="86" x2="150" y2="86" />
      <rect x="50" y="20" width="50" height="28" rx="3" />
      <path d="M54 62h42a3 3 0 0 1 3 3v6H51v-6a3 3 0 0 1 3-3z" />
      <path d="M75 62v-7a4 4 0 0 1 4-4h6" />
      <line x1="60" y1="71" x2="60" y2="86" />
      <line x1="90" y1="71" x2="90" y2="86" />
      <line x1="26" y1="32" x2="26" y2="54" />
      <path d="M19 32h14" />
    </>
  ),
  dining: (
    <>
      <line x1="0" y1="86" x2="150" y2="86" />
      <rect x="30" y="60" width="90" height="5" rx="2" />
      <line x1="40" y1="65" x2="40" y2="86" />
      <line x1="110" y1="65" x2="110" y2="86" />
      <line x1="75" y1="8" x2="75" y2="30" />
      <path d="M62 44l13-14 13 14z" />
      <path d="M24 86V64" />
      <path d="M18 64h12" />
      <path d="M24 52v12" />
      <path d="M126 86V64" />
      <path d="M120 64h12" />
      <path d="M126 52v12" />
    </>
  ),
  closet: (
    <>
      <line x1="0" y1="86" x2="150" y2="86" />
      <rect x="16" y="20" width="118" height="66" rx="3" />
      <line x1="75" y1="20" x2="75" y2="86" />
      <line x1="22" y1="36" x2="68" y2="36" />
      <path d="M32 36v6" />
      <rect x="26" y="42" width="12" height="18" rx="1.5" />
      <path d="M48 36v6" />
      <rect x="42" y="42" width="12" height="18" rx="1.5" />
      <line x1="82" y1="44" x2="128" y2="44" />
      <line x1="82" y1="64" x2="128" y2="64" />
    </>
  ),
  office: (
    <>
      <line x1="0" y1="86" x2="150" y2="86" />
      <rect x="26" y="62" width="98" height="5" rx="2" />
      <line x1="34" y1="67" x2="34" y2="86" />
      <line x1="116" y1="67" x2="116" y2="86" />
      <rect x="52" y="32" width="42" height="26" rx="2" />
      <line x1="73" y1="58" x2="73" y2="62" />
      <path d="M112 62v-8l12-10" />
      <path d="M119 40l10 3-3 8z" />
    </>
  ),
  terrace: (
    <>
      <line x1="0" y1="86" x2="150" y2="86" />
      <rect x="40" y="60" width="60" height="4" rx="2" />
      <line x1="70" y1="64" x2="70" y2="86" />
      <path d="M58 86h24" />
      <path d="M28 86V66" />
      <path d="M22 66h12" />
      <path d="M28 56v10" />
      <path d="M112 86V66" />
      <path d="M106 66h12" />
      <path d="M112 56v10" />
      <path d="M126 86V74" />
      <path d="M126 74c-8 0-11-6-11-11 7 0 11 5 11 11z" />
      <path d="M126 74c8 0 11-6 11-11-7 0-11 5-11 11z" />
      <path d="M6 16q36 16 72 0t66 8" />
      <circle cx="30" cy="21" r="2" />
      <circle cx="60" cy="22" r="2" />
      <circle cx="92" cy="16" r="2" />
      <circle cx="120" cy="19" r="2" />
    </>
  ),
};

function SceneArt({ kind, tempK, alt }) {
  const l = SCENE_LIGHT[tempK] || SCENE_LIGHT[3000];
  const art = SCENE_ART[kind] || SCENE_ART.lounge;
  const gid = `nemul-wash-${tempK}`;
  return (
    <svg viewBox="0 0 150 112" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={alt} style={{ display: "block", width: "100%", height: "auto" }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={l.wash} stopOpacity={l.top} />
          <stop offset="1" stopColor={l.wash} stopOpacity={l.bottom} />
        </linearGradient>
      </defs>
      <rect width="150" height="112" fill={l.paper} />
      <rect width="150" height="112" fill={`url(#${gid})`} />
      <g fill="none" stroke={COLORS.text} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity={l.ink}>
        {art}
      </g>
    </svg>
  );
}

// Los dos extremos siempre presentes (2700 y 4000) y la recomendación en su
// sitio. Si la recomendación ES un extremo, se marca ese y no se inventa una
// cuarta columna: en el móvil, tres escenas ya van justas de ancho.
function sceneTrio(tempK) {
  if (tempK <= 2700 || tempK >= 4000) return [2700, 3000, 4000];
  return [2700, tempK, 4000];
}

const SCENE_ROOM_NAME = {
  living: "Tu salón", livingDining: "Tu salón-comedor", kitchen: "Tu cocina",
  kitchenOpen: "Tu cocina", bedroom: "Tu dormitorio", bathroom: "Tu baño",
  dining: "Tu comedor", closet: "Tu vestidor", office: "Tu despacho",
  terrace: "Tu terraza",
};

// Con dos escenas descartadas al mismo lado ("2700 y 3000 para una cocina de
// 4000"), poner "Demasiado cálida" dos veces no dice nada. La más cercana se
// queda en "Un punto más cálida" y solo la lejana es "demasiado".
//
// El lado alto no se llama "frío". 4000 K es blanco neutro, no luz fría, y
// llamarlo frío contradecía al resto de la app: la barra de kelvin ya acota
// "Más cálida — Más neutra", y TEMP_HUMAN describe los 4000 K como "luz blanca
// neutra". Sobre todo, contradecía al propio Nemul, que recomienda 4000 K para
// trabajar: no puede ser la luz correcta del despacho y "demasiado fría" dos
// pantallas más allá. Descartarla en un salón es decir que es demasiado
// neutra para lo acogedor que se busca, no que esté fría.
function sceneVerdict(stop, tempK, stops) {
  if (stop === tempK) return null;
  const sameSide = stops.filter((s) => s !== tempK && (s < tempK) === (stop < tempK));
  const nearest = sameSide.length > 1 && Math.abs(stop - tempK) === Math.min(...sameSide.map((s) => Math.abs(s - tempK)));
  if (stop < tempK) return nearest ? "Un punto más cálida" : "Demasiado cálida";
  return nearest ? "Un punto más neutra" : "Muy neutra";
}

const SCENE_FOOT = {
  lounge: "En un salón buscamos una luz cálida: acogedora por la noche, sin llegar al tono anaranjado.",
  kitchen: "En la cocina interesa ver bien lo que cortas: una luz más blanca marca mejor los detalles y el color real de los alimentos.",
  bedroom: "En el dormitorio la luz debe invitar a parar: cuanto más cálida, más fácil es desconectar antes de dormir.",
  bathroom: "En el baño hace falta ver con precisión para afeitarse o maquillarse, pero sin que parezca un quirófano.",
  dining: "Sobre la mesa, una luz cálida hace que la comida se vea apetecible y que la sobremesa se alargue.",
  closet: "En el vestidor conviene una luz bastante neutra: es la única forma de ver el color real de la ropa antes de salir.",
  office: "Para trabajar, una luz más blanca mantiene despierto; la cálida de más da sensación de sobremesa.",
  terrace: "Fuera, la luz cálida es la que hace que apetezca quedarse cuando ya ha anochecido.",
};

// Pieza D del prototipo: la misma estancia con tres tonos. Es lo que hace
// que alguien que no sabe qué es un kelvin entienda la recomendación sin
// leer una sola palabra.
function LightScenes({ roomId, tempK }) {
  const kind = SCENE_KIND_BY_ROOM[roomId] || "lounge";
  const stops = sceneTrio(tempK);
  const mine = SCENE_ROOM_NAME[roomId] || "Lo recomendado";
  return (
    <div data-pdf-keep>
      <p className="font-body t-eyebrow mb-2.5" style={{ color: COLORS.accent }}>Así se verá</p>
      <div className="rounded-xl p-4" style={{ backgroundColor: COLORS.bg }}>
        <div className="flex gap-2">
          {stops.map((stop) => {
            const isMine = stop === tempK;
            const verdict = sceneVerdict(stop, tempK, stops);
            return (
              <div key={stop} className="flex-1 text-center">
                <div
                  className="rounded-lg overflow-hidden"
                  style={{
                    border: isMine ? `2px solid ${COLORS.text}` : `1px solid ${COLORS.border}`,
                    opacity: isMine ? 1 : 0.62,
                  }}
                >
                  <SceneArt kind={kind} tempK={stop} alt={`${mine.replace("Tu ", "")} con luz de ${stop} K`} />
                </div>
                <p
                  className="font-body t-caption mt-1.5"
                  style={{ color: isMine ? COLORS.text : COLORS.subtext, fontWeight: isMine ? 600 : 400 }}
                >
                  {isMine ? mine : verdict}
                </p>
                <p className="font-body" style={{ fontSize: 10, lineHeight: 1.4, color: COLORS.subtext }}>{stop} K</p>
              </div>
            );
          })}
        </div>
        <p className="font-body t-small italic mt-3" style={{ color: COLORS.subtext }}>{SCENE_FOOT[kind]}</p>
      </div>
    </div>
  );
}

// Pieza A: sitúa el número dentro del recorrido de cálido a neutro. Va junto
// a las escenas porque responde a otra pregunta: no "cómo se ve" sino "cuánto
// margen hay a cada lado" si en la tienda solo tienen otro valor.
const KELVIN_MIN = 2700;
const KELVIN_MAX = 4000;
function KelvinScale({ tempK, roomId }) {
  const pct = ((Math.min(KELVIN_MAX, Math.max(KELVIN_MIN, tempK)) - KELVIN_MIN) / (KELVIN_MAX - KELVIN_MIN)) * 100;
  // En los extremos, una etiqueta centrada se sale del bloque. En vez de
  // recortarla, se ancla al borde que le toca.
  const anchor = pct <= 12 ? "translateX(0)" : pct >= 88 ? "translateX(-100%)" : "translateX(-50%)";
  const name = (SCENE_ROOM_NAME[roomId] || "Lo recomendado").replace("Tu ", "Tu ");
  return (
    <div className="mt-4">
      <div style={{ position: "relative", height: 26 }}>
        <span
          className="font-body"
          style={{
            position: "absolute", left: `${pct}%`, transform: anchor,
            backgroundColor: COLORS.text, color: "#FFF7E8",
            fontSize: 11, lineHeight: 1, fontWeight: 600,
            padding: "5px 9px", borderRadius: 100, whiteSpace: "nowrap",
          }}
        >
          {name} · {tempK} K
        </span>
        <span style={{ position: "absolute", top: 22, left: `${pct}%`, transform: "translateX(-50%)", width: 2, height: 8, backgroundColor: COLORS.text, borderRadius: 1 }} />
      </div>
      <div
        style={{
          height: 12, borderRadius: 6, marginTop: 4,
          // El extremo cálido arrancaba en #EFA92A, un naranja más saturado que
          // ningún color de la marca: 2700 K parecía la luz de un túnel, no la
          // de un salón. Ahora empieza en el amarillo bombilla (COLORS.bulb) y
          // el resto de paradas se aclaran desde ahí.
          background: "linear-gradient(90deg,#F2B84B 0%,#F6CE84 32%,#F9E3BB 62%,#FBF2E2 100%)",
          boxShadow: "inset 0 0 0 1px rgba(58,46,34,.12)",
        }}
      />
      <div className="flex justify-between mt-2">
        {[2700, 3000, 3500, 4000].map((k) => (
          <span key={k} className="font-body" style={{ fontSize: 11, color: COLORS.subtext }}>{k} K</span>
        ))}
      </div>
      <div className="flex justify-between" style={{ marginTop: 2 }}>
        <span className="font-body t-eyebrow" style={{ fontSize: 10, color: COLORS.subtext }}>Más cálida</span>
        <span className="font-body t-eyebrow" style={{ fontSize: 10, color: COLORS.subtext }}>Más neutra</span>
      </div>
    </div>
  );
}

/* Glosario de palabras.
 *
 * Solo texto, a propósito: dos dibujos explicando dos términos ayudan, y doce
 * dibujos explicando doce términos son un catálogo que nadie lee y que además
 * dispara la altura del informe (y con ella la nitidez del PDF).
 *
 * No se listan las doce siempre: se mira qué palabras aparecen de verdad en
 * los consejos de las estancias elegidas y se explican solo esas. Quien no
 * tiene terraza no necesita saber qué es un IP44.
 */
function reportBundle(roomId, answers = {}) {
  if (roomId === "living" || roomId === "livingDining") return generateLivingReport(answers, roomId);
  if (roomId === "kitchen" || roomId === "kitchenOpen") return generateKitchenReport(answers);
  if (GENERIC_TECH_ROOMS.includes(roomId)) return generateGenericTechnicalReport(roomId, answers);
  return null;
}

function reportTextFor(roomId, answers = {}) {
  const b = reportBundle(roomId, answers);
  if (!b) return (getReport(roomId, answers) || []).join(" ");
  return [...(b.tips || []), ...(b.mistakes || []), ...(b.distribution || []), b.narrative || ""].join(" ");
}

// Estas dos salen en el bloque de cálculo de todas las estancias técnicas, así
// que no hace falta buscarlas en los consejos: si hay cálculo, están.
const ALWAYS_TERMS = [
  { key: "kelvin", term: "Kelvin (K)", line: "Miden si la luz tira a amarilla o a blanca. Cuantos menos kelvin, más cálida y acogedora; cuantos más, más blanca y despierta." },
  { key: "lux", term: "lm/m²", line: "Los lúmenes que conviene repartir por cada metro cuadrado. Es la forma de decir cuánta luz pide una estancia según su tamaño." },
];

const DETECTED_TERMS = [
  { key: "dimmer", re: /regulador|dimmer|regulable|atenuar/i, term: "Regulador (o dimmer)", line: "El mando que permite subir y bajar la intensidad de la luz, como el volumen de la música." },
  { key: "ip44", re: /IP\s?44/i, term: "IP44", line: "Un sello que indica que la luminaria aguanta salpicaduras de agua. Es lo mínimo que se pide en un baño o en una terraza descubierta." },
  { key: "acento", re: /de acento/i, term: "Luz de acento", line: "Un punto de luz dirigido a algo concreto —un cuadro, una estantería— para que destaque sobre el resto." },
  { key: "orientable", re: /orientable/i, term: "Foco orientable", line: "Un foco que se puede girar para dirigir la luz hacia donde interese, en vez de apuntar siempre recto hacia abajo." },
  { key: "carril", re: /carril/i, term: "Carril", line: "Una guía fija al techo por la que se mueven varios focos, que además se orientan hacia donde quieras." },
  { key: "circuito", re: /circuito/i, term: "Circuitos independientes", line: "Que cada grupo de luces se encienda con su propio interruptor, en vez de encenderse todo a la vez." },
  { key: "honeycomb", re: /honeycomb/i, term: "Honeycomb", line: "Una rejilla con forma de panal que se pone delante del foco para que no deslumbre al mirarlo de lado." },
];

function glossaryFor(rooms, answersByRoom) {
  const text = rooms.map((r) => reportTextFor(r.id, answersByRoom[r.id])).join(" ");
  const hasCalc = rooms.some((r) => reportBundle(r.id, answersByRoom[r.id]) !== null);
  return [...(hasCalc ? ALWAYS_TERMS : []), ...DETECTED_TERMS.filter((t) => t.re.test(text))];
}

/* Dos estancias pueden compartir dibujo Y temperatura: pasa siempre con Salón
 * y Salón-Comedor abierto, y con Cocina y Cocina abierta al salón. La segunda
 * enseñaría exactamente la misma barra y las mismas tres escenas que la
 * primera, una debajo de otra, sin aportar nada y alargando el informe.
 *
 * Devuelve, por estancia, el nombre de la anterior con la que coincide (o
 * null). Solo se compara el tono: el cálculo y el plano SÍ se repiten en cada
 * estancia, porque los metros y el número de focos sí cambian.
 */
function toneDuplicates(rooms, answersByRoom) {
  const seen = new Map();
  const out = {};
  for (const room of rooms) {
    const bundle = reportBundle(room.id, answersByRoom[room.id]);
    const kind = SCENE_KIND_BY_ROOM[room.id];
    if (!bundle || !kind) {
      out[room.id] = null;
      continue;
    }
    const key = `${kind}-${bundle.tempK}`;
    out[room.id] = seen.get(key) || null;
    if (!seen.has(key)) seen.set(key, room.label);
  }
  return out;
}

// Pieza E: va UNA sola vez al abrir el informe, no en cada estancia. Son los
// dos términos que aparecen en todas las páginas y que nadie tiene por qué
// conocer: qué es un downlight y qué es un lumen.
function LightingBasics({ rooms = [], answersByRoom = {} }) {
  const terms = glossaryFor(rooms, answersByRoom);
  return <LightingBasicsView terms={terms} />;
}

function LightingBasicsView({ terms }) {
  return (
    <div data-pdf-keep className="rounded-xl p-5" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
      <p className="font-body t-eyebrow mb-3" style={{ color: COLORS.accent }}>Antes de empezar</p>

      <div className="flex items-start gap-4 rounded-xl p-4" style={{ backgroundColor: COLORS.bg }}>
        <div style={{ width: 116, flexShrink: 0 }}>
          <svg viewBox="0 0 132 96" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sección de un techo con dos focos empotrados y sus conos de luz" style={{ display: "block", width: "100%", height: "auto" }}>
            <defs>
              <linearGradient id="nemul-cone" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={COLORS.bulb} stopOpacity="0.5" />
                <stop offset="1" stopColor={COLORS.bulb} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M40 18 L18 84 L62 84 Z" fill="url(#nemul-cone)" />
            <path d="M92 18 L70 84 L114 84 Z" fill="url(#nemul-cone)" />
            <rect x="0" y="4" width="132" height="13" fill={COLORS.bgAlt} />
            <g stroke={COLORS.text} strokeWidth="1.5" strokeLinecap="round" fill="none">
              <line x1="0" y1="17" x2="132" y2="17" />
              <line x1="0" y1="4" x2="132" y2="4" />
              <line x1="0" y1="84" x2="132" y2="84" />
            </g>
            <g fill={COLORS.text}>
              <rect x="32" y="10" width="16" height="7" rx="1.5" />
              <rect x="84" y="10" width="16" height="7" rx="1.5" />
            </g>
            <g stroke={COLORS.subtext} strokeWidth="1" fill="none">
              <line x1="40" y1="26" x2="92" y2="26" strokeDasharray="2 2" />
              <line x1="40" y1="23" x2="40" y2="29" />
              <line x1="92" y1="23" x2="92" y2="29" />
            </g>
          </svg>
        </div>
        <div>
          <p className="font-body t-small font-medium" style={{ color: COLORS.text }}>Un downlight es un foco empotrado en el techo</p>
          <p className="font-body t-small mt-1" style={{ color: COLORS.subtext }}>
            Queda a ras, sin sobresalir, y lanza la luz hacia abajo. Es lo que en casa se llama «los focos del techo». Se reparten separados entre sí para que la luz llegue por igual a toda la estancia.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-4 rounded-xl p-4 mt-2.5" style={{ backgroundColor: COLORS.bg }}>
        <div style={{ width: 116, flexShrink: 0 }}>
          <svg viewBox="0 0 132 96" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Una bombilla iluminada con la equivalencia de 800 lúmenes a 60 vatios" style={{ display: "block", width: "100%", height: "auto" }}>
            <defs>
              <radialGradient id="nemul-glow">
                <stop offset="0" stopColor={COLORS.bulb} stopOpacity="0.55" />
                <stop offset="1" stopColor={COLORS.bulb} stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="66" cy="42" r="40" fill="url(#nemul-glow)" />
            <g fill="none" stroke={COLORS.text} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M66 16a17 17 0 0 1 10 30c-2 1.6-3 3.4-3 5.6h-14c0-2.2-1-4-3-5.6A17 17 0 0 1 66 16z" />
              <line x1="59" y1="58" x2="73" y2="58" />
              <line x1="61" y1="64" x2="71" y2="64" />
              <line x1="66" y1="4" x2="66" y2="9" />
              <line x1="41" y1="14" x2="45" y2="18" />
              <line x1="91" y1="14" x2="87" y2="18" />
              <line x1="32" y1="40" x2="38" y2="40" />
              <line x1="100" y1="40" x2="94" y2="40" />
            </g>
            <text x="66" y="88" textAnchor="middle" fontFamily="Montserrat, sans-serif" fontSize="10" fontWeight="600" fill={COLORS.text}>800 lm ≈ 60 W</text>
          </svg>
        </div>
        <div>
          <p className="font-body t-small font-medium" style={{ color: COLORS.text }}>Los lúmenes son la cantidad de luz</p>
          <p className="font-body t-small mt-1" style={{ color: COLORS.subtext }}>
            Antes mirábamos los vatios; con el LED se miran los lúmenes. Como referencia: {REFERENCE_BULB_LM} lúmenes es la luz de una bombilla de toda la vida de 60 W, y hoy se consigue con un LED de unos {REFERENCE_BULB_W} W.
          </p>
        </div>
      </div>

      {terms.length > 0 && (
        <div className="mt-4">
          <p className="font-body t-eyebrow mb-2.5" style={{ color: COLORS.accent }}>Otras palabras que verás</p>
          <div className="rounded-xl p-4" style={{ backgroundColor: COLORS.bg }}>
            {terms.map((t, i) => (
              <p key={t.key} className="font-body t-small" style={{ color: COLORS.subtext, marginTop: i === 0 ? 0 : 8 }}>
                <span className="font-medium" style={{ color: COLORS.text }}>{t.term}. </span>
                {t.line}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* Pieza F: el plano visto desde arriba.
 *
 * La forma de la estancia no se pregunta en ningún sitio, así que se dibuja
 * un rectángulo de proporción corriente a partir de los m². Eso se dice en el
 * pie, porque un plano que no avisa de que la forma es inventada se lee como
 * si fuera la casa de quien lo mira.
 *
 * La retícula SÍ es real, y es la que manda: los focos se separan entre 1,20
 * y 1,50 m y se dejan unos 60-75 cm hasta la pared. De ahí sale cuántos hay,
 * y el flujo de cada uno se ajusta después para dar el total calculado. Al
 * revés —foco fijo, focos contados, separación la que salga— es como se
 * llegaba a acotar 2,6 m en un salón mediano.
 */
const PLAN_ASPECT = 1.4;

// Cuánto se castiga un margen a pared fuera de los 60-75 cm de referencia.
/* De 1,20 a 1,50 m es una franja objetivo, no una diana. Dentro de ella todas
 * las separaciones valen lo mismo: no hay motivo para preferir 1,35 m a 1,45 m,
 * y forzar el centro de la franja metía filas de más en estancias que admitían
 * una retícula más abierta.
 *
 * Solo se penaliza quedarse corto, y se penaliza flojo: en una estancia
 * estrecha no siempre hay forma de llegar a 1,20 m. Pasarse de 1,50 no se
 * penaliza porque no se permite — de eso se encarga axisOptions dejando esas
 * combinaciones fuera de la búsqueda. Cuando era una penalización, por fuerte
 * que fuera, había estancias donde ganaba por unas milésimas: 3,11 m de fondo
 * salían a 1,505 m porque la alternativa correcta costaba un pelín más. */
const spacingPenalty = (s) => Math.max(0, SPACING_MIN - s);

/* Dentro de 60-75 cm no resta nada. Salirse de ahí resta poco —a veces es lo
 * que permite abrir la retícula, o lo que la desapretuja en una estancia
 * estrecha— pero acercarse a la pared resta el triple que alejarse, porque un
 * foco a 45 cm ilumina el muro más que la estancia: es un recurso, no un
 * punto de partida. Los topes de 45 y 90 no aparecen aquí; los aplica
 * axisOptions dejando fuera de la búsqueda todo lo que se salga. */
const marginPenalty = (m) =>
  Math.max(0, m - WALL_MARGIN_MAX) * 0.5 + Math.max(0, WALL_MARGIN_MIN - m) * 1.5;

/* Reparto de UN eje: cuántos puntos y a qué separación.
 *
 * Se prueban todos los números de puntos con todos los márgenes a pared
 * razonables. Como dentro de la franja no hay preferencia, lo normal es que
 * varias combinaciones empaten a cero; el bucle va de menos puntos a más y se
 * queda con la primera, así que ante dos retículas igual de válidas gana la
 * más abierta —menos focos, más separados— en vez de la más apretada.
 */
function axisOptions(len) {
  const out = [];
  for (let count = 1; count <= 20; count++) {
    if (count === 1) {
      // Un punto solo se queda a media estancia de cada pared: solo vale si
      // esa media estancia cabe dentro del tope.
      const margin = len / 2;
      if (margin <= WALL_MARGIN_ABS_MAX) {
        out.push({ count, spacing: 0, margin, score: Math.max(0, margin - WALL_MARGIN_MAX) * 2 });
      }
      continue;
    }
    let best = null;
    // El margen solo se busca entre los dos topes: de 45 a 90 cm. Dentro de
    // esa horquilla decide marginPenalty; fuera no hay nada que decidir,
    // porque lo que cambia es el número de puntos, no el margen.
    const steps = Math.round((WALL_MARGIN_ABS_MAX - WALL_MARGIN_ABS_MIN) / WALL_MARGIN_STEP);
    for (let k = 0; k <= steps; k++) {
      const margin = Math.round((WALL_MARGIN_ABS_MIN + k * WALL_MARGIN_STEP) * 100) / 100;
      const spacing = (len - 2 * margin) / (count - 1);
      // Los tres topes duros, en una línea: si con este número de puntos no
      // hay margen legal que baje de 1,50 m, este número de puntos no vale.
      if (spacing <= 0 || spacing > SPACING_MAX + 1e-9) continue;
      const score = spacingPenalty(spacing) + marginPenalty(margin);
      if (!best || score < best.score) best = { count, spacing, margin, score };
    }
    if (best) out.push(best);
  }
  // Con estancias de casa nunca pasa —a 20 puntos por eje se cubren 30 m—,
  // pero un eje sin ninguna opción dejaría el informe sin plano.
  if (!out.length) {
    const count = Math.max(2, Math.ceil((len - 2 * WALL_MARGIN_ABS_MAX) / SPACING_MAX) + 1);
    out.push({
      count,
      spacing: (len - 2 * WALL_MARGIN_ABS_MAX) / (count - 1),
      margin: WALL_MARGIN_ABS_MAX,
      score: 99,
    });
  }
  return out;
}

// Reparto para un espacio sin techo: la separación entre centros no manda
// porque no hay retícula que dibujar, así que se parte de un punto de luz
// exterior corriente y se ajusta el flujo al total.
function ambientLayout(area, lumens, minCount = 1) {
  const n = Math.max(minCount, Math.round(lumens / AMBIENT_LM_PER_POINT));
  const lmPer = downlightLumens(lumens, n);
  return {
    area, w: 0, d: 0, n, cols: n, rows: 1,
    sx: 0, sy: 0, mx: 0, my: 0,
    lmPer, totalLm: lmPer * n,
  };
}

/* Qué foco reparte `lumens` entre `n` puntos: el flujo comercial más cercano.
 *
 * "Más cercano" quiere decir que el total instalado casi nunca cae clavado en
 * el objetivo, y eso es deliberado. Los focos existen en escalones (300, 350,
 * 400, 450...), así que un despacho de 20 m² con poca luz natural pide 5.000 lm
 * y acaba en 9 x 600 = 5.400, o sea 270 lm/m² frente a los 250 de la tabla.
 *
 * La alternativa sería obligar a no pasar del objetivo, y entonces ese mismo
 * despacho bajaría a 4.500 lm: 500 lm por debajo de lo que necesita, en el
 * caso en que MENOS luz natural hay. Quedarse corto se nota; pasarse un 8 %
 * con la luz regulada, no. Los lm/m² de ROOM_LUX_BY_LIGHT son el objetivo del
 * cálculo, no un techo que haya que respetar al elegir producto real.
 */
function downlightLumens(lumens, n) {
  return DOWNLIGHT_LM_STEPS.reduce((a, b) =>
    Math.abs(b * n - lumens) < Math.abs(a * n - lumens) ? b : a);
}

/* Todas las colocaciones posibles de un eje: cuántos puntos, a qué margen, y
 * qué franja cubre cada uno. A diferencia de axisOptions no puntúa ni descarta
 * nada, porque en el reparto abierto un eje no se juzga solo: lo que decide es
 * la superficie que sale al cruzarlo con el otro. Un eje de un solo punto
 * cubre el eje entero. */
function axisSpreads(len) {
  const out = [];
  if (len / 2 <= WALL_MARGIN_ABS_MAX) out.push({ count: 1, cover: len, spacing: 0, margin: len / 2 });
  const steps = Math.round((WALL_MARGIN_ABS_MAX - WALL_MARGIN_ABS_MIN) / WALL_MARGIN_STEP);
  for (let count = 2; count <= 12; count++) {
    for (let k = 0; k <= steps; k++) {
      const margin = Math.round((WALL_MARGIN_ABS_MIN + k * WALL_MARGIN_STEP) * 100) / 100;
      const spacing = (len - 2 * margin) / (count - 1);
      if (spacing > 0) out.push({ count, cover: spacing, spacing, margin });
    }
  }
  return out;
}

/* La retícula de un salón: la más despejada que siga iluminando bien.
 *
 * Filtra por superficie por punto, por que ningún eje se dispare, por que la
 * retícula no se estire y por que ningún foco tenga que ser una bomba. De las
 * que pasan gana la de MENOS puntos —no la más cercana a una separación
 * ideal—, y solo entre las empatadas a puntos decide la puntuación fina.
 *
 * Esa preferencia por menos puntos es el ajuste entero: sin ella el cálculo
 * sube focos gratis para apretar la retícula, que es de donde venían los 12.
 */
function openPlanLayout(area, lumens, minCount = 1, minLmPer = 0, limits = {}, dims = null) {
  // Sin `limits` manda el criterio del salón, que es el de toda la casa.
  const axisMax = limits.axisMax ?? AXIS_OPEN_MAX;
  const seMax = limits.seMax ?? SE_OPEN_MAX;
  const anisoMax = limits.anisoMax ?? GRID_ANISO_MAX;
  /* `dims` es para las zonas: la de estar de un salón-comedor no es un
   * rectángulo de proporción corriente sacado de sus m², es el trozo que
   * queda de la estancia al apartar el comedor. Sin esto, la retícula se
   * calcularía sobre un rectángulo que no es el que dibuja el plano, y el
   * texto y el dibujo dirían separaciones distintas. */
  const w = dims ? dims.w : Math.sqrt(area * PLAN_ASPECT);
  const d = dims ? dims.d : area / w;
  let best = null;

  for (const x of axisSpreads(w)) {
    for (const y of axisSpreads(d)) {
      const n = x.count * y.count;
      if (n < minCount || lumens / n > DOWNLIGHT_LM_CAP) continue;
      // El suelo de flujo: repartir el total entre tantos puntos que a cada
      // uno le toquen migajas es tener focos de más, no luz mejor repartida.
      if (minLmPer && lumens / n < minLmPer) continue;
      const wide = Math.max(x.cover, y.cover);
      const tight = Math.min(x.cover, y.cover);
      if (wide > axisMax + 1e-9) continue;
      const se = Math.sqrt(x.cover * y.cover);
      if (se > seMax + 1e-9) continue;
      const aniso = wide / tight;
      if (aniso > anisoMax + 1e-9) continue;
      const score =
        Math.max(0, SPACING_MIN - se) +
        Math.max(0, se - SPACING_MAX) +
        marginPenalty(x.margin) + marginPenalty(y.margin) +
        (aniso - 1) * 0.3;
      if (!best || n < best.n || (n === best.n && score < best.score)) best = { x, y, n, score };
    }
  }

  // Ninguna retícula abierta sirve para esta estancia. Si lo que sobraba era
  // el suelo de flujo, se reintenta sin él antes de cambiar de criterio: es
  // una preferencia, no un requisito. Y si aun así no hay nada, se reparte
  // como el resto de la casa antes que devolver un informe sin plano.
  if (!best && minLmPer) return openPlanLayout(area, lumens, minCount, 0, limits, dims);
  if (!best) return planLayout(area, lumens, minCount, dims);

  const { x, y, n } = best;
  const lmPer = downlightLumens(lumens, n);
  return {
    area, w, d, n,
    cols: x.count, rows: y.count,
    sx: x.spacing, sy: y.spacing,
    mx: x.margin, my: y.margin,
    lmPer,
    totalLm: lmPer * n,
  };
}

/* La retícula completa.
 *
 * La forma de la estancia no se pregunta en ningún sitio, así que se parte de
 * un rectángulo de proporción corriente sacado de los m². Lo que sí es real
 * es el criterio: la separación entre centros manda, el número de puntos sale
 * de ella, y el flujo de cada foco se ajusta después para dar el total
 * calculado. Nunca al revés.
 */
function planLayout(area, lumens, minCount = 1, dims = null) {
  const w = dims ? dims.w : Math.sqrt(area * PLAN_ASPECT);
  const d = dims ? dims.d : area / w;
  const xs = axisOptions(w);
  const ys = axisOptions(d);

  let best = null;
  for (const x of xs) {
    for (const y of ys) {
      if (x.count * y.count < minCount) continue;
      const score = x.score + y.score;
      if (!best || score < best.score) best = { x, y, score };
    }
  }

  const { x, y } = best;
  const n = x.count * y.count;
  const lmPer = downlightLumens(lumens, n);
  return {
    area, w, d, n,
    cols: x.count, rows: y.count,
    sx: x.spacing, sy: y.spacing,
    mx: x.margin, my: y.margin,
    lmPer,
    totalLm: lmPer * n,
  };
}

const fmtM = (n) => n.toFixed(1).replace(".", ",");
// Los m² de una zona son un número redondo o casi: "14,0 m²" se lee como una
// precisión que no tenemos, y encima es una estimación. Se dice "14 m²".
const fmtArea = (n) => fmtM(n).replace(/,0$/, "");
const fmtCm = (m) => `${Math.round((m * 100) / 5) * 5} cm`;

// La separación que se dice en el texto es siempre la que dibuja el plano de
// al lado, no una cifra de manual: si no coinciden, el informe se contradice
// a la vista. Cuando la retícula sale cuadrada, las dos medidas son la misma
// y decir dos veces el mismo número sobra: se dice una.
//
// Un eje puede tener un solo punto (una estancia estrecha), y ahí no hay
// separación que dar: no se inventa un "0,0 m".
function spacingText(grid, onlyLights = false) {
  const { cols, rows, sx, sy } = grid;
  const x = fmtM(sx);
  const y = fmtM(sy);
  const unit = onlyLights ? "zonas" : "focos";
  if (cols > 1 && rows > 1) return x === y ? `${x} m` : `${x} m entre ${unit} y ${y} m entre filas`;
  if (cols > 1) return `${x} m entre ${unit}, en una sola fila`;
  if (rows > 1) return `${y} m entre filas, en una sola columna`;
  return "un único punto centrado";
}

// La misma medida, para una fila de datos: ahí "1,4 m entre focos y 1,0 m
// entre filas" repite lo que ya dice la etiqueta de al lado.
function spacingShort(grid) {
  const { cols, rows, sx, sy } = grid;
  const x = fmtM(sx);
  const y = fmtM(sy);
  if (cols > 1 && rows > 1) return x === y ? `${x} m` : `${x} × ${y} m`;
  if (cols > 1) return `${x} m`;
  if (rows > 1) return `${y} m`;
  return "punto único";
}

// La distancia a la pared es la otra mitad del criterio, y hasta ahora no se
// decía en ningún sitio: el plano repartía los focos dejando medio hueco a
// cada lado, que con separaciones grandes dejaba el muro a más de un metro.
function marginText(grid) {
  const lo = Math.min(grid.mx, grid.my);
  const hi = Math.max(grid.mx, grid.my);
  return fmtCm(lo) === fmtCm(hi) ? fmtCm(hi) : `${Math.round((lo * 100) / 5) * 5}-${fmtCm(hi)}`;
}

/* ---------------------------------------------------------------------------
 * LAS CUATRO CARAS DEL INFORME DEL DORMITORIO
 *
 * El reparto por capas es común a las cuatro. Lo que cambia es la parte
 * espacial, y cambia por una razón: Nemul solo sabe dónde va a ir la luz
 * cuando hay reforma, porque entonces los puntos todavía no existen y el
 * plano ES la propuesta. En los demás casos la instalación ya está puesta,
 * Nemul no la conoce, y cualquier dibujo con cotas se lee como si la
 * conociera.
 * ------------------------------------------------------------------------- */

const BEDROOM_LOCAL_META = {
  maquillaje: { label: "Maquillaje", Icon: Sparkles },
  armario: { label: "Armario", Icon: Shirt },
};

// Cuánta luz pone cada capa de la necesidad general, en proporción. Es una
// barra, no una planta: no insinúa dónde va nada.
function LayerBar({ parts }) {
  const total = parts.reduce((acc, p) => acc + p.lm, 0) || 1;
  return (
    <div className="flex w-full rounded-full overflow-hidden" style={{ height: 10, backgroundColor: COLORS.border }}>
      {parts.map((p, i) => (
        <div key={i} style={{
          width: `${(p.lm / total) * 100}%`,
          backgroundColor: COLORS.bulb,
          opacity: 1 - i * 0.3,
          borderRight: i < parts.length - 1 ? `1.5px solid ${COLORS.bg}` : "none",
        }} />
      ))}
    </div>
  );
}

/* El bloque de cálculo del dormitorio.
 *
 * La regla que manda aquí: NUNCA se enseña un número por pieza que no
 * multiplique exactamente lo que aporta su capa. Antes la cabecera decía
 * "2 x 350 lm" y aportaba 300 —la diferencia era que las lámparas van
 * reguladas—, así que en pantalla quedaba 1.400 + 700 = 1.700 y había que
 * leerse un párrafo para entender por qué no era un error. Ahora el flujo de
 * lectura sale del reparto y se explica en su propio bloque: lo que se suma
 * es lo que aporta cada capa, y la suma se ve sin leer nada.
 */
function BedroomLayerBlock({ area, lux, layers, grid }) {
  const { need, generalLm, bedsidePer, bedsideAmbient, bedsideSpec, reads, local, mode, singlePointStrained } = layers;

  // En reforma el techo aporta lo que dan los focos elegidos, que es lo que
  // se instala de verdad; en los demás modos, su parte del reparto.
  const ceilingLm = mode === "reforma" && grid ? grid.totalLm : generalLm;
  const ceilingLabel = mode === "reforma" && grid
    ? `Techo — ${grid.n} downlights de ${grid.lmPer} lm`
    : mode === "uno" ? "Techo — tu punto actual" : "Techo — tus puntos actuales";

  // El "2 x 150" solo se enseña cuando multiplica los 300 que aporta. Si leer
  // pide lámparas más potentes, esa cifra se va al bloque de lectura.
  const showPerPiece = !reads || bedsideSpec === bedsidePer;
  const bedsideLabel = showPerPiece ? `Cabecera — 2 × ${bedsidePer} lm` : "Cabecera — 2 luminarias";

  const total = ceilingLm + bedsideAmbient;
  const drift = Math.abs(total / need - 1) > 0.1;

  const Row = ({ label, value, bold }) => (
    <div className="flex items-baseline justify-between gap-3">
      <p className="font-body t-small" style={{ color: bold ? COLORS.text : COLORS.subtext, fontWeight: bold ? 600 : 400 }}>{label}</p>
      <p className="font-body t-small font-medium shrink-0" style={{ color: COLORS.text, fontWeight: bold ? 600 : 500 }}>{value}</p>
    </div>
  );

  return (
    <div>
      <p className="font-body t-eyebrow mb-2.5" style={{ color: COLORS.accent }}>Necesidad general</p>
      <div className="flex flex-col gap-3 rounded-xl p-4" style={{ backgroundColor: COLORS.bg }}>
        <StatRow label="Superficie" value={`${fmtArea(area)} m²`} />
        <StatRow label="Nivel recomendado" value={`${lux} lm/m²`} />
        <StatRow label="Luz general" value={`≈ ${need.toLocaleString("es-ES")} lm`} />
        {local.length > 0 && (
          <p className="font-body t-small italic ml-9" style={{ color: COLORS.subtext }}>Las luces localizadas van aparte.</p>
        )}
      </div>

      <p className="font-body t-eyebrow mt-4 mb-2.5" style={{ color: COLORS.accent }}>De dónde sale esa luz</p>
      <div className="flex flex-col gap-2.5 rounded-xl p-4" style={{ backgroundColor: COLORS.bg }}>
        <LayerBar parts={[{ lm: ceilingLm }, { lm: bedsideAmbient }]} />
        <Row label={ceilingLabel} value={`${ceilingLm.toLocaleString("es-ES")} lm`} />
        <Row label={bedsideLabel} value={`${bedsideAmbient.toLocaleString("es-ES")} lm`} />
        <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 10 }}>
          <Row label="Total" value={`${total.toLocaleString("es-ES")} lm`} bold />
        </div>
        <p className="font-body t-small italic" style={{ color: COLORS.subtext }}>
          {mode === "reforma"
            ? "Lámparas de mesita, apliques o colgantes junto a la cama."
            : mode === "uno"
              ? `En la luminaria del punto que ya tienes.${singlePointStrained ? " Es mucho para un solo punto: mira las recomendaciones." : ""} La cabecera, con lámparas de mesita, apliques o colgantes.`
              : "Reparte la cifra del techo entre los puntos que ya tienes. La cabecera, con lámparas de mesita, apliques o colgantes."}
        </p>
        {drift && (
          <p className="font-body t-caption" style={{ color: COLORS.subtext }}>
            El total no cae justo en los {need.toLocaleString("es-ES")} lm calculados porque las luminarias vienen en escalones de flujo: este es el reparto real más cercano.
          </p>
        )}
      </div>

      {reads && (
        <>
          <p className="font-body t-eyebrow mt-4 mb-2.5" style={{ color: COLORS.accent }}>Para leer en la cama</p>
          <div className="rounded-xl p-4" style={{ backgroundColor: COLORS.bg }}>
            <p className="font-body t-body" style={{ color: COLORS.text }}>
              {bedsideSpec > bedsidePer
                ? `Que las luminarias de la cabecera sean regulables y de ${bedsideSpec} lm o más cada una.`
                : "Que las luminarias de la cabecera sean regulables: atenuadas por la noche, a plena potencia para leer."}
            </p>
          </div>
        </>
      )}

      {local.length > 0 && (
        <>
          <p className="font-body t-eyebrow mt-4 mb-2.5" style={{ color: COLORS.accent }}>Luz localizada</p>
          <div className="flex flex-col gap-2.5 rounded-xl p-4" style={{ backgroundColor: COLORS.bg }}>
            {local.map((l) => {
              const meta = BEDROOM_LOCAL_META[l.id];
              return (
                <div key={l.id} className="flex items-start gap-3">
                  <meta.Icon size={15} color={COLORS.accent} strokeWidth={1.8} className="shrink-0 mt-0.5" />
                  <p className="font-body t-small" style={{ color: COLORS.text }}>
                    <span className="font-medium">{meta.label} — {l.pieces > 1 ? `${l.pieces} × ${l.per} lm` : `${l.lm} lm`}</span>
                    <span style={{ color: COLORS.subtext }}>, {l.detail}</span>
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* Varios puntos y solo cambio de luminarias: el único caso sin representación
 * espacial, y es deliberado. Nemul no sabe cuántos puntos hay ni dónde están;
 * dibujar unos cuantos círculos repartidos "idealmente" se lee como el sitio
 * donde deberían ir los suyos. El dato útil es el flujo. */
function CeilingFluxNote({ generalLm }) {
  return (
    <div data-pdf-keep>
      <p className="font-body t-eyebrow mb-2.5" style={{ color: COLORS.accent }}>La capa de luz general</p>
      <div className="rounded-xl p-4" style={{ backgroundColor: COLORS.bg }}>
        <div className="flex items-center gap-3">
          <Lightbulb size={18} color={COLORS.bulb} strokeWidth={1.8} className="shrink-0" />
          <p className="font-display" style={{ color: COLORS.text, fontSize: 26, lineHeight: 1.1 }}>
            {generalLm.toLocaleString("es-ES")} lm
          </p>
        </div>
        <p className="font-body t-body mt-3" style={{ color: COLORS.text }}>
          Reparte estos {generalLm.toLocaleString("es-ES")} lm aproximadamente entre los puntos de techo que ya tienes. No es necesario que todos aporten exactamente el mismo flujo; lo importante es acercarse al total recomendado para esta capa.
        </p>
        <p className="font-body t-small italic mt-2.5" style={{ color: COLORS.subtext }}>
          No verás aquí un plano con distancias: dijiste que solo vas a cambiar las luminarias, así que tus puntos ya están donde están. Dibujar una retícula sería proponerte agujeros nuevos.
        </p>
      </div>
    </div>
  );
}

/* Un solo punto: hay algo que enseñar, pero son zonas, no posiciones. Sin
 * contorno de habitación y sin una sola cota. */
function BedroomZoneScheme({ layers }) {
  const zones = [
    { Icon: Lightbulb, label: "Tu punto de techo", value: `${layers.generalLm.toLocaleString("es-ES")} lm` },
    { Icon: BedDouble, label: "Cabecera", value: `${layers.bedsideAmbient.toLocaleString("es-ES")} lm` },
    ...layers.local.map((l) => {
      const meta = BEDROOM_LOCAL_META[l.id];
      return { Icon: meta.Icon, label: meta.label, value: l.pieces > 1 ? `${l.pieces} × ${l.per} lm` : `${l.lm} lm` };
    }),
  ];
  return (
    <div data-pdf-keep>
      <p className="font-body t-eyebrow mb-2.5" style={{ color: COLORS.accent }}>Zonas a iluminar</p>
      <div className="rounded-xl p-4" style={{ backgroundColor: COLORS.bg }}>
        <div className="flex flex-wrap justify-center gap-4 py-1">
          {zones.map((z, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5" style={{ width: 92 }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.bgAlt }}>
                <z.Icon size={20} color={COLORS.accent} strokeWidth={1.6} />
              </div>
              <span className="font-body t-small text-center" style={{ color: COLORS.text }}>{z.label}</span>
              <span className="font-body t-caption text-center font-medium" style={{ color: COLORS.subtext }}>{z.value}</span>
            </div>
          ))}
        </div>
        <p className="font-body t-small italic text-center mt-3" style={{ color: COLORS.subtext }}>
          Sin plano ni retícula: tu punto de techo ya está donde está. Estas son las zonas que tienen que quedar iluminadas y con cuánta luz cada una.
        </p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * LAS PIEZAS DEL SALÓN Y DEL SALÓN-COMEDOR
 *
 * Tres bloques, en este orden: qué zonas hay, cuánta luz pone cada capa, y
 * dónde va. El orden importa: quien lee tiene que entender que su estancia se
 * ha partido en dos ANTES de ver un número de lúmenes que ya no cuadra con
 * multiplicar los metros por los lm/m².
 */

/* Zona de estar y zona de comedor: solo los metros y de dónde salen.
 *
 * Los lúmenes se fueron de aquí cuando la general y las complementarias se
 * separaron: el número de la zona de comedor no era una luz general —esa zona
 * no la tiene, la resuelve el colgante— y repetirlo aquí confundía. */
function LivingZonesBlock({ layers, measured }) {
  const { zones } = layers;
  return (
    <div data-pdf-keep>
      <p className="font-body t-eyebrow mb-2.5" style={{ color: COLORS.accent }}>Las dos zonas de tu salón-comedor</p>
      <div className="flex gap-3">
        {[
          { Icon: Sofa, name: "Zona de estar", area: zones.estar },
          { Icon: UtensilsCrossed, name: "Zona de comedor", area: zones.comedor },
        ].map((z) => (
          <div key={z.name} className="flex-1 rounded-xl p-4" style={{ backgroundColor: COLORS.bg }}>
            <z.Icon size={18} color={COLORS.accent} strokeWidth={1.6} />
            <p className="font-body t-small font-medium mt-2" style={{ color: COLORS.text }}>{z.name}</p>
            <p className="font-display mt-0.5" style={{ color: COLORS.text, fontSize: 22, lineHeight: 1.1 }}>{fmtArea(z.area)} m²</p>
          </div>
        ))}
      </div>
      <p className="font-body t-small mt-2.5 rounded-lg p-3" style={{ color: COLORS.text, backgroundColor: COLORS.bgAlt }}>
        <span className="font-medium">El corte entre las dos zonas lo ha estimado Nemul.</span> {measured ? "Los metros de la estancia son los tuyos, pero no" : "No"} te hemos preguntado el tamaño de tu mesa ni dónde está, así que hemos supuesto que el comedor ocupa alrededor de una tercera parte. Lo que sí sabemos de tu mesa es la forma, y eso es lo que decide la luz sobre ella.
      </p>
    </div>
  );
}

/* La luz general y las complementarias, separadas.
 *
 * Separadas de verdad, en dos bloques, y sin una fila de total debajo. Sumarlas
 * diría que todas se encienden a la vez, y no es así: se lee con el pie, se
 * cena con el colgante, se ve la tele con la tira encendida y el techo bajo.
 *
 * La general responde a "¿cuánta luz de fondo pide esta estancia por sus
 * metros?". Las complementarias, a "¿qué más necesito según lo que hago aquí?".
 * Son dos preguntas distintas y no se restan la una a la otra. */
const LIVING_LAYER_ICON = {
  general: Lightbulb,
  lectura: BookOpen,
  ambiente: Lamp,
  relax: Lamp,
  acento: Sparkles,
  mesa: Lightbulb,
  apoyo: Lamp,
};

function LayerRow({ id, label, hint, lm, first }) {
  const Icon = LIVING_LAYER_ICON[id] || Lightbulb;
  return (
    <div className="flex items-start gap-3 px-4 py-3"
      style={{ borderTop: first ? "none" : `1px solid ${COLORS.border}` }}>
      <Icon size={16} color={COLORS.bulb} strokeWidth={1.9} className="shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-body t-body" style={{ color: COLORS.text }}>{label}</p>
        <p className="font-body t-caption" style={{ color: COLORS.subtext }}>{hint}</p>
      </div>
      <p className="font-body t-body font-medium shrink-0" style={{ color: COLORS.text }}>{lm.toLocaleString("es-ES")} lm</p>
    </div>
  );
}

function LivingLayerBlock({ layers }) {
  const { estar, dining, grid, onlyLights, isDining } = layers;

  /* Dos cifras distintas, y hasta ahora se enseñaba una sola.
   *
   * La NECESIDAD sale de multiplicar los metros por los lm/m². La PROPUESTA es
   * lo que dan los focos elegidos, y casi nunca coincide: los downlights vienen
   * en escalones de flujo, así que 2.115 lm en cuatro puntos acaban siendo
   * 4 x 500 = 2.000. Enseñar "14,1 m² · 150 lm/m²" encima de "2.000 lm" es una
   * contradicción a la vista de cualquiera que multiplique. */
  const needLm = estar.generalLm;
  const proposalLm = grid.totalLm;
  const showProposal = !onlyLights && proposalLm !== needLm;

  const extras = [
    ...estar.ambient.map((a) => ({
      id: a.id,
      label: a.id === "lectura" ? "Pie de lectura" : a.label,
      lm: a.lm,
      hint: { lectura: "junto al sofá, regulable", relax: "un punto bajo y cálido, regulable" }[a.id] || "en el extremo opuesto del sofá, regulable",
    })),
    ...(estar.accent ? [{ id: "acento", label: "Luz de acento TV", lm: estar.accent.lm, hint: "tira LED oculta tras el canto del mueble" }] : []),
    ...(dining ? [{ id: "mesa", label: "Luz sobre la mesa", lm: dining.pendantTotal, hint: `${dining.pieces > 1 ? `${dining.pieces} colgantes de ${dining.pendantPer} lm` : `un colgante de ${dining.pendantPer} lm`}, a ${PENDANT_H_TEXT} del tablero` }] : []),
    ...(dining && dining.fillPieces ? [{ id: "apoyo", label: "Luz de apoyo del comedor", lm: dining.fillTotal, hint: `${dining.fillPieces} puntos en el borde, fuera de la mesa` }] : []),
  ];

  return (
    <div>
      <p className="font-body t-eyebrow mb-2.5" style={{ color: COLORS.accent }}>Iluminación general</p>
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: COLORS.bg }}>
        <div className="px-4 pt-4 pb-3">
          <p className="font-body t-caption" style={{ color: COLORS.subtext }}>
            {isDining ? `Zona de estar · ${fmtArea(estar.area)} m² × ${estar.lux} lm/m²` : `${fmtArea(estar.area)} m² × ${estar.lux} lm/m²`}
          </p>
          <p className="font-display mt-1" style={{ color: COLORS.text, fontSize: 32, lineHeight: 1.1 }}>
            {needLm.toLocaleString("es-ES")} lm
          </p>
          <p className="font-body t-caption" style={{ color: COLORS.subtext }}>necesidad calculada</p>
        </div>
        {/* Sin repetir la cifra: ya está arriba en grande. Esta línea dice
            de dónde sale, no cuánto es. */}
        <div className="flex items-start gap-3 px-4 py-3" style={{ borderTop: `1px solid ${COLORS.border}` }}>
          <Lightbulb size={16} color={COLORS.bulb} strokeWidth={1.9} className="shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-body t-body" style={{ color: COLORS.text }}>
              {onlyLights ? "Repartidos entre tus puntos de techo" : `Propuesta: ${grid.n} downlights de ${grid.lmPer} lm`}
            </p>
            <p className="font-body t-caption" style={{ color: COLORS.subtext }}>
              {isDining ? "solo por la zona de estar: la mesa tiene su propia luz" : "la luz de fondo, la que enciendes al entrar"}
              {showProposal ? " · los focos vienen en escalones de flujo, así que la propuesta no cae clavada" : ""}
            </p>
          </div>
          {showProposal && (
            <p className="font-body t-body font-medium shrink-0" style={{ color: COLORS.text }}>{proposalLm.toLocaleString("es-ES")} lm</p>
          )}
        </div>
      </div>

      {extras.length > 0 && (
        <>
          <p className="font-body t-eyebrow mt-4 mb-1" style={{ color: COLORS.accent }}>Luces complementarias</p>
          <p className="font-body t-caption mb-2.5" style={{ color: COLORS.subtext }}>
            Según lo que haces aquí. No se suman a la general: cada una se enciende cuando hace falta.
          </p>
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: COLORS.bg }}>
            {extras.map((e, i) => <LayerRow key={e.id} {...e} first={i === 0} />)}
          </div>
        </>
      )}
    </div>
  );
}

/* El esquema de distribución de techo. SOLO en reforma.
 *
 * Aquí sí hay algo real que enseñar: los puntos no existen todavía y Nemul los
 * está proponiendo, así que su posición es la propuesta. Lo que se dibuja son
 * puntos de luz, no muebles: el sofá y el mueble de la televisión estuvieron
 * un rato en este plano y se quitaron, porque Nemul no sabe dónde están y
 * dibujarlos se leía como una instrucción de dónde ponerlos.
 *
 * La mesa sí se dibuja, y por una razón concreta: es lo que da sentido al
 * recuadro discontinuo y a que la retícula se pare antes de llegar. Va
 * declarada como referencia en el pie.
 *
 * Sin cotas. Las distancias están en las recomendaciones. */
function LivingZonePlan({ layers, measured }) {
  const { plan, grid, dining, estar } = layers;
  const { roomW, roomD, diningDepth, estarW } = plan;

  const PAD = 18, BOX_W = 320;
  const BOX_H = Math.max(150, Math.min(250, Math.round((BOX_W * roomD) / roomW)));
  const vbW = PAD * 2 + BOX_W, vbH = BOX_H + PAD * 2;
  const px = BOX_W / roomW, py = BOX_H / roomD;
  const X = (m) => PAD + m * px;
  const Y = (m) => PAD + m * py;
  const splitX = X(estarW);

  const dots = [];
  for (let r = 0; r < grid.rows; r++) for (let c = 0; c < grid.cols; c++) {
    dots.push({
      x: grid.cols > 1 ? grid.mx + c * grid.sx : estarW / 2,
      y: grid.rows > 1 ? grid.my + r * grid.sy : roomD / 2,
    });
  }

  const tW = diningDepth * 0.55;
  const tL = Math.min(roomD * 0.45, 1.7);
  const tCx = estarW + diningDepth / 2;
  const tCy = roomD / 2;
  const round = dining.shape === "redonda";

  const keep = LIVING_TABLE_KEEPOUT_M;
  const kx0 = X(tCx - tW / 2 - keep), kx1 = Math.min(X(tCx + tW / 2 + keep), PAD + BOX_W);
  const ky0 = Math.max(Y(tCy - tL / 2 - keep), PAD), ky1 = Math.min(Y(tCy + tL / 2 + keep), PAD + BOX_H);

  const n = dining.pieces;
  const pend = Array.from({ length: n }, (_, i) => tCy - tL / 2 + (tL * (2 * i + 1)) / (2 * n));
  const fillOff = tL / 2 + keep + 0.2;
  const clampY = (m) => Math.min(Math.max(m, 0.35), roomD - 0.35);
  const fills = dining.fillPieces ? [clampY(tCy - fillOff), clampY(tCy + fillOff)] : [];

  return (
    <div data-pdf-keep>
      <p className="font-body t-eyebrow mb-2.5" style={{ color: COLORS.accent }}>Dónde abrir los puntos de techo</p>
      <div className="rounded-xl p-4" style={{ backgroundColor: COLORS.bg }}>
        <svg viewBox={`0 0 ${vbW} ${vbH}`} xmlns="http://www.w3.org/2000/svg" role="img"
          aria-label={`Esquema de techo: ${grid.n} focos generales repartidos solo por la zona de estar, ${n === 1 ? "un colgante" : `${n} colgantes`} sobre la mesa y luz de apoyo en el borde del comedor. Ningún foco general sobre la mesa.`}
          style={{ display: "block", width: "100%", height: "auto" }}>
          <defs>
            <radialGradient id="nemul-zone-pool">
              <stop offset="0" stopColor={COLORS.bulb} stopOpacity="0.42" />
              <stop offset="1" stopColor={COLORS.bulb} stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect x={PAD} y={PAD} width={BOX_W} height={BOX_H} rx="4" fill="#FFFDF8" stroke={COLORS.text} strokeWidth="2" />
          <rect x={splitX} y={PAD} width={PAD + BOX_W - splitX} height={BOX_H} fill={COLORS.bgAlt} opacity="0.8" />
          <line x1={splitX} y1={PAD} x2={splitX} y2={PAD + BOX_H} stroke={COLORS.subtext} strokeWidth="1.6" strokeDasharray="7 5" />

          {dots.map((p, i) => (
            <circle key={`pool${i}`} cx={X(p.x)} cy={Y(p.y)} r={Math.min(grid.cols > 1 ? grid.sx * px : BOX_W, grid.rows > 1 ? grid.sy * py : BOX_H) * 0.55} fill="url(#nemul-zone-pool)" />
          ))}
          {dots.map((p, i) => (
            <circle key={`d${i}`} cx={X(p.x)} cy={Y(p.y)} r="6" fill={COLORS.bulb} stroke={COLORS.text} strokeWidth="1.5" />
          ))}

          <rect x={kx0} y={ky0} width={kx1 - kx0} height={ky1 - ky0} rx="4" fill="none" stroke={COLORS.warning} strokeWidth="1.3" strokeDasharray="6 4" />
          {round
            ? <circle cx={X(tCx)} cy={Y(tCy)} r={Math.min((tW / 2) * px, (tL / 2) * py)} fill={COLORS.bgAlt} stroke={COLORS.subtext} strokeWidth="1.4" strokeDasharray="4 3" />
            : <rect x={X(tCx - tW / 2)} y={Y(tCy - tL / 2)} width={tW * px} height={tL * py} rx="3" fill={COLORS.bgAlt} stroke={COLORS.subtext} strokeWidth="1.4" strokeDasharray="4 3" />}
          {pend.map((m, i) => (
            <g key={`c${i}`}>
              <circle cx={X(tCx)} cy={Y(m)} r="15" fill={COLORS.bulb} opacity="0.34" />
              <circle cx={X(tCx)} cy={Y(m)} r="7.5" fill={COLORS.bulb} stroke={COLORS.text} strokeWidth="1.7" />
            </g>
          ))}
          {fills.map((m, i) => (
            <circle key={`f${i}`} cx={X(tCx)} cy={Y(m)} r="4.5" fill="#FFFDF8" stroke={COLORS.subtext} strokeWidth="1.6" />
          ))}
        </svg>

        <p className="font-body t-caption text-center mt-1.5" style={{ color: COLORS.subtext }}>
          A la izquierda, la zona de estar ({fmtArea(estar.area)} m²). A la derecha, la de comedor ({fmtArea(dining.area)} m²).
        </p>

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full" style={{ width: 11, height: 11, backgroundColor: COLORS.bulb, boxShadow: `inset 0 0 0 1.4px ${COLORS.text}` }} />
            <span className="font-body t-caption" style={{ color: COLORS.subtext }}>Luz general — {grid.n} focos de {grid.lmPer} lm</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full" style={{ width: 13, height: 13, backgroundColor: COLORS.bulb, boxShadow: `inset 0 0 0 1.6px ${COLORS.text}` }} />
            <span className="font-body t-caption" style={{ color: COLORS.subtext }}>{n === 1 ? `Colgante de ${dining.pendantPer} lm` : `${n} colgantes de ${dining.pendantPer} lm`}</span>
          </div>
          {dining.fillPieces > 0 && (
            <div className="flex items-center gap-2">
              <span className="rounded-full" style={{ width: 11, height: 11, backgroundColor: "#FFFDF8", boxShadow: `inset 0 0 0 1.6px ${COLORS.subtext}` }} />
              <span className="font-body t-caption" style={{ color: COLORS.subtext }}>Luz de apoyo — {dining.fillPieces} × {dining.fillPer} lm</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span style={{ width: 13, height: 11, border: `1.3px dashed ${COLORS.warning}`, borderRadius: 2 }} />
            <span className="font-body t-caption" style={{ color: COLORS.subtext }}>sin luz general sobre la mesa</span>
          </div>
        </div>

        <p className="font-body t-small italic mt-2.5" style={{ color: COLORS.subtext }}>
          Solo se dibujan puntos de luz. Las lámparas de pie y de sobremesa no salen aquí porque no dependen del techo, y los muebles tampoco: Nemul no sabe cómo tienes puesto el salón.
        </p>
        <p className="font-body t-small mt-2.5 rounded-lg p-3" style={{ color: COLORS.text, backgroundColor: COLORS.bgAlt }}>
          <span className="font-medium">El esquema es orientativo.</span> {measured
            ? "El rectángulo son las medidas que nos has dado; lo que ha supuesto Nemul es el corte entre las dos zonas y el lugar de la mesa, dibujada con línea discontinua."
            : "La forma de la estancia, el corte entre las dos zonas y el lugar de la mesa —dibujada con línea discontinua— los ha supuesto Nemul a partir de tus metros cuadrados."} Lo que puedes llevarte tal cual es el criterio: los focos generales solo por la zona de estar, y ninguno sobre la mesa ni pegado a ella.
        </p>
      </div>
    </div>
  );
}

function CeilingPlan({ grid, onlyLights = false, measured = false }) {
  const { area, w, d, n, cols, rows, sx, sy, mx, my } = grid;
  const PAD = 20;
  const BOX_W = 300;
  const BOX_H = Math.max(120, Math.min(240, Math.round((BOX_W * d) / w)));

  // Hueco extra a la izquierda para la cota vertical. El plano acotaba solo la
  // separación horizontal, así que una retícula de 1,75 x 1,29 m se leía como
  // si los focos estuvieran a 1,7 m en las dos direcciones. Con un solo número
  // a la vista, el dibujo dice menos de lo que sabe.
  //
  // Solo se reserva cuando hay dos filas que acotar: en un plano de una sola
  // fila ese margen quedaría vacío y descentraría la estancia.
  const GUTTER = rows >= 2 ? 22 : 0;
  const LEFT = PAD + GUTTER;
  const vbW = LEFT + BOX_W + PAD;
  const vbH = BOX_H + PAD * 2 + 26;

  // El plano dibuja el margen a pared real. Antes repartía los focos en
  // huecos iguales —medio hueco a cada lado—, así que con separaciones
  // grandes el muro quedaba a más de un metro sin que nadie lo hubiera
  // decidido.
  const cx = (c) => LEFT + (BOX_W * (cols > 1 ? mx + c * sx : w / 2)) / w;
  const cy = (r) => PAD + (BOX_H * (rows > 1 ? my + r * sy : d / 2)) / d;
  const stepX = cols > 1 ? (BOX_W * sx) / w : BOX_W;
  const stepY = rows > 1 ? (BOX_H * sy) / d : BOX_H;
  const pool = Math.min(stepX, stepY) * 0.62;

  const lights = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) lights.push({ c, r });

  return (
    <div data-pdf-keep>
      {/* Quien solo va a cambiar luminarias no está mirando dónde colocar
          focos: está mirando dónde debería llegar la luz. El mismo dibujo
          responde a las dos preguntas, pero no con el mismo título. */}
      <p className="font-body t-eyebrow mb-2.5" style={{ color: COLORS.accent }}>
        {onlyLights ? "Distribución ideal de la luz" : "Dónde colocar los focos"}
      </p>
      <div className="rounded-xl p-4" style={{ backgroundColor: COLORS.bg }}>
        <svg viewBox={`0 0 ${vbW} ${vbH}`} xmlns="http://www.w3.org/2000/svg" role="img"
          aria-label={`Plano orientativo visto desde arriba: ${n} ${onlyLights ? "zonas de luz repartidas" : "focos repartidos"} en ${cols} columnas y ${rows} filas, con ${spacingText(grid, onlyLights)}`}
          style={{ display: "block", width: "100%", height: "auto" }}>
          <defs>
            <radialGradient id="nemul-pool">
              <stop offset="0" stopColor={COLORS.bulb} stopOpacity="0.42" />
              <stop offset="1" stopColor={COLORS.bulb} stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect x={LEFT} y={PAD} width={BOX_W} height={BOX_H} rx="4" fill="#FFFDF8" stroke={COLORS.text} strokeWidth="2" />
          {lights.map(({ c, r }, i) => <circle key={`p${i}`} cx={cx(c)} cy={cy(r)} r={pool} fill="url(#nemul-pool)" />)}
          {lights.map(({ c, r }, i) => (
            <circle key={`l${i}`} cx={cx(c)} cy={cy(r)} r="7" fill={COLORS.bulb} stroke={COLORS.text} strokeWidth="1.6" />
          ))}

          {cols >= 2 && (
            <>
              <g stroke={COLORS.text} strokeWidth="1.1" fill="none">
                <line x1={cx(0)} y1={PAD - 8} x2={cx(1)} y2={PAD - 8} strokeDasharray="3 2" />
                <line x1={cx(0)} y1={PAD - 12} x2={cx(0)} y2={PAD - 4} />
                <line x1={cx(1)} y1={PAD - 12} x2={cx(1)} y2={PAD - 4} />
              </g>
              <rect x={(cx(0) + cx(1)) / 2 - 27} y={PAD - 19} width="54" height="15" rx="7" fill={COLORS.text} />
              <text x={(cx(0) + cx(1)) / 2} y={PAD - 8} textAnchor="middle" fontFamily="Montserrat, sans-serif" fontSize="9.5" fontWeight="600" fill="#FFF7E8">
                {fmtM(sx)} m
              </text>
            </>
          )}

          {rows >= 2 && (
            <>
              <g stroke={COLORS.text} strokeWidth="1.1" fill="none">
                <line x1={LEFT - 8} y1={cy(0)} x2={LEFT - 8} y2={cy(1)} strokeDasharray="3 2" />
                <line x1={LEFT - 12} y1={cy(0)} x2={LEFT - 4} y2={cy(0)} />
                <line x1={LEFT - 12} y1={cy(1)} x2={LEFT - 4} y2={cy(1)} />
              </g>
              {/* La misma píldora que arriba, girada sobre su propio centro:
                  así el texto sube por el lateral en vez de tumbarse. */}
              <g transform={`rotate(-90 ${LEFT - 11} ${(cy(0) + cy(1)) / 2})`}>
                <rect x={LEFT - 38} y={(cy(0) + cy(1)) / 2 - 7.5} width="54" height="15" rx="7" fill={COLORS.text} />
                <text x={LEFT - 11} y={(cy(0) + cy(1)) / 2 + 3.6} textAnchor="middle" fontFamily="Montserrat, sans-serif" fontSize="9.5" fontWeight="600" fill="#FFF7E8">
                  {fmtM(sy)} m
                </text>
              </g>
            </>
          )}

          <g stroke={COLORS.subtext} strokeWidth="1" fill="none">
            <line x1={LEFT} y1={vbH - 18} x2={LEFT + BOX_W} y2={vbH - 18} strokeDasharray="3 2" />
            <line x1={LEFT} y1={vbH - 22} x2={LEFT} y2={vbH - 14} />
            <line x1={LEFT + BOX_W} y1={vbH - 22} x2={LEFT + BOX_W} y2={vbH - 14} />
          </g>
          <text x={LEFT + BOX_W / 2} y={vbH - 4} textAnchor="middle" fontFamily="Montserrat, sans-serif" fontSize="9.5" fill={COLORS.subtext}>
            {fmtArea(area)} m² · unos {fmtM(w)} × {fmtM(d)} m
          </text>
        </svg>

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full" style={{ width: 11, height: 11, backgroundColor: COLORS.bulb, boxShadow: `inset 0 0 0 1.4px ${COLORS.text}` }} />
            <span className="font-body t-caption" style={{ color: COLORS.subtext }}>
              {onlyLights ? `${n} zonas de luz de unos ${grid.lmPer} lm` : `${n} focos de ${grid.lmPer} lm`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full" style={{ width: 11, height: 11, backgroundColor: "#F6DFAE" }} />
            <span className="font-body t-caption" style={{ color: COLORS.subtext }}>zona que cubre cada uno</span>
          </div>
        </div>

        <p className="font-body t-small italic mt-2.5" style={{ color: COLORS.subtext }}>
          {onlyLights
            ? `Reparto orientativo en ${cols} × ${rows}: unos ${spacingText(grid, true)}, y a unos ${marginText(grid)} de las paredes. ${measured ? "El rectángulo son las medidas que nos has dado: si tu planta tiene recodos o columnas, ajústalo" : "La forma de la estancia se ha dibujado como un rectángulo corriente a partir de los m²: llévalo a tu planta real"} y a dónde estén los muebles, y cuenta las lámparas que ya tienes como parte del reparto.`
            : `Colocación orientativa en ${cols} × ${rows}: unos ${spacingText(grid)}, y a unos ${marginText(grid)} de las paredes. ${measured ? "El rectángulo son las medidas que nos has dado: ajusta la retícula a los recodos que tenga tu planta" : "La forma de la estancia se ha dibujado como un rectángulo corriente a partir de los m²: ajusta la retícula a tu planta real"} y a dónde estén los muebles, apartando los focos de los sitios donde os sentáis para que no queden en el campo de visión.`}
        </p>
        {/* Este plano dibuja la distribución ideal para los m² de la estancia:
            no sabe dónde están los puntos de luz actuales, porque no se
            preguntan. A quien va a reformar eso le vale como plano. A quien
            solo cambia luminarias hay que decírselo, o se irá pensando que
            necesita abrir seis puntos nuevos. */}
        {onlyLights && (
          <p className="font-body t-small mt-2.5 rounded-lg p-3" style={{ color: COLORS.text, backgroundColor: COLORS.bgAlt }}>
            <span className="font-medium">No necesitas crear estos puntos.</span> El esquema representa cómo conviene repartir la luz, no una nueva instalación. Utiliza los puntos existentes y completa las zonas que lo necesiten con luminarias orientables o lámparas de mesa o de pie.
          </p>
        )}
      </div>
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
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.bgAlt }}>
                <z.Icon size={20} color={COLORS.accent} strokeWidth={1.6} />
              </div>
              <span className="font-body t-small text-center" style={{ color: COLORS.text }}>{z.label}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="font-body t-body text-center" style={{ color: COLORS.subtext }}>Cuéntanos cómo usas la terraza para ver aquí sus zonas de luz.</p>
      )}

      {(covered === "descubierta" || night === "si") && (
        <div className="flex flex-col gap-1.5 mt-3">
          {covered === "descubierta" && (
            <div className="flex items-center gap-2 justify-center">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.bulb }} />
              <span className="font-body t-small" style={{ color: COLORS.subtext }}>Luminarias aptas para exterior (IP44 o superior)</span>
            </div>
          )}
          {night === "si" && (
            <div className="flex items-center gap-2 justify-center">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.bulb }} />
              <span className="font-body t-small" style={{ color: COLORS.subtext }}>Prioriza calidez y luz regulable</span>
            </div>
          )}
        </div>
      )}

      <p className="font-body t-body text-center mt-2.5" style={{ color: COLORS.subtext }}>
        Sin plano fijo: cada terraza tiene una forma distinta. Estas son las zonas a iluminar según cómo la usas.
      </p>
    </div>
  );
}

// Este bloque estaba copiado literal en las tres tarjetas técnicas. Al
// añadirle escenas, plano y glosario, mantener tres copias garantizaba que
// acabaran diciendo cosas distintas.
function TipsList({ tips }) {
  return (
    <div>
      <p className="font-body t-eyebrow mb-2.5" style={{ color: COLORS.accent }}>Recomendaciones personalizadas</p>
      <div className="flex flex-col gap-2">
        {tips.map((tip, i) => (
          <div key={i} className="flex items-start gap-3 rounded-xl p-3.5" style={{ backgroundColor: COLORS.bg }}>
            <Lightbulb size={15} color={COLORS.accent} strokeWidth={1.8} className="mt-0.5 shrink-0" />
            <p className="font-body t-body" style={{ color: COLORS.text }}>{tip}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// La "Recomendación general" de las tres tarjetas técnicas: el número, la
// frase que lo traduce, la barra y las escenas. Antes era solo el número.
function ColorTempBlock({ roomId, tempK, extra, sameToneAs }) {
  return (
    <>
      <div data-pdf-keep>
        <p className="font-body t-eyebrow mb-2.5" style={{ color: COLORS.accent }}>Recomendación general</p>
        <div className="flex flex-col gap-2 rounded-xl p-4" style={{ backgroundColor: COLORS.bg }}>
          <StatRow label="Temperatura de color" value={`${tempK} K`} />
          <p className="font-body t-small italic mt-1" style={{ color: COLORS.subtext }}>{describeTempK(tempK)}</p>
          {extra}
          {sameToneAs ? (
            <p className="font-body t-small italic" style={{ color: COLORS.subtext }}>
              Es el mismo tono de luz que en {sameToneAs.toLowerCase()}, así que no repetimos aquí la escala ni los ejemplos.
            </p>
          ) : (
            <KelvinScale tempK={tempK} roomId={roomId} />
          )}
        </div>
      </div>
      {!sameToneAs && <LightScenes roomId={roomId} tempK={tempK} />}
    </>
  );
}

function TechnicalReportCard({ room, answers, expanded, onToggle, sameToneAs }) {
  // room.id importa: es lo que distingue el salón del salón-comedor, y con él
  // si el informe habla o no de la zona de comedor.
  // room.id importa: es lo que distingue el salón del salón-comedor, y con él
  // si la estancia se parte en dos zonas o se calcula como una sola.
  const { tempK, grid, tips, mistakes, layers } = generateLivingReport(answers, room.id);
  const onlyLights = answers.renovationStatus === "onlyLights";
  const { Icon } = room;
  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
      <button onClick={onToggle} className="w-full flex items-center gap-4 p-5 text-left">
        <Icon size={22} color={COLORS.subtext} strokeWidth={1.5} className="shrink-0" />
        <div className="flex-1">
          <p className="font-body t-body font-medium" style={{ color: COLORS.text }}>{room.label}</p>
          <p className="font-body t-body" style={{ color: COLORS.subtext }}>Estudio de iluminación</p>
        </div>
        <ChevronDown size={16} color={COLORS.subtext} style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
      </button>
      {expanded && (
        <div className="px-5 pb-5 flex flex-col gap-5">
          <ColorTempBlock roomId={room.id} tempK={tempK} sameToneAs={sameToneAs} />

          {layers.isDining && <LivingZonesBlock layers={layers} measured={!!roomDims(answers)} />}

          <LivingLayerBlock layers={layers} />

          {/* El salón conserva su esquema orientativo en los dos modos, con el
              aviso de siempre de que es un reparto recomendado y no una
              instalación que haya que abrir.

              El salón-comedor no: ahí el dibujo tendría que colocar la mesa y
              el corte entre las dos zonas, y ninguna de las dos cosas las
              sabe Nemul. Solo se dibuja cuando hay reforma y los puntos que
              se enseñan son de verdad una propuesta. */}
          {layers.isDining
            ? (!onlyLights && <LivingZonePlan layers={layers} measured={!!roomDims(answers)} />)
            : <CeilingPlan grid={grid} onlyLights={onlyLights} measured={!!roomDims(answers)} />}

          <TipsList tips={tips} />

          <MistakesList mistakes={mistakes} />
        </div>
      )}
    </div>
  );
}

/* La cocina, en dos bloques como el salón: la general por un lado y el trabajo
 * y los refuerzos por otro. Sin fila de total: la tira de la encimera y los
 * focos del techo no se encienden a la vez ni suman una cifra útil. */
function KitchenLayerBlock({ layers, area, onlyLights }) {
  const { generalLux, generalLm, grid, task, reinforcements, island } = layers;
  // Necesidad y propuesta son dos cifras distintas: la primera es los metros
  // por los lm/m², la segunda lo que dan los focos, que vienen en escalones.
  const needLm = generalLm;
  const proposalLm = grid.totalLm;
  const showProposal = !onlyLights && proposalLm !== needLm;

  const work = [];
  if (task.mode === "underCabinet") {
    work.push({
      id: "encimera", label: "Encimera — tira LED bajo mueble", lm: task.lm,
      hint: `unos ${fmtDim(task.runM)} m de frente × ${task.lmPerM} lm/m, CRI ≥ 90, en el borde delantero del mueble${task.uncoveredM > 0.4 ? `. Los otros ${fmtDim(task.uncoveredM)} m de encimera no tienen mueble alto: van con focos orientables adelantados` : ""}`,
    });
  } else {
    work.push({
      id: "encimera", label: "Encimera — focos orientables", lm: task.lm,
      hint: `${task.pieces} puntos de ${task.lmPer} lm adelantados hacia el borde. Sin muebles altos no hay dónde poner tira, y esta solución es menos eficaz`,
    });
  }
  if (island) {
    work.push({
      id: "isla", label: island.kind === "isla" ? "Isla" : "Península", lm: island.lm,
      hint: `${island.pieces} colgantes de ${island.lmPer} lm, a ${PENDANT_H_TEXT} de la encimera`,
    });
  }
  reinforcements.forEach((r) => work.push({ id: r.id, label: r.label, lm: r.lm, hint: r.hint }));

  return (
    <div>
      <p className="font-body t-eyebrow mb-2.5" style={{ color: COLORS.accent }}>Iluminación general</p>
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: COLORS.bg }}>
        <div className="px-4 pt-4 pb-3">
          <p className="font-body t-caption" style={{ color: COLORS.subtext }}>{fmtArea(area)} m² × {generalLux} lm/m²</p>
          <p className="font-display mt-1" style={{ color: COLORS.text, fontSize: 32, lineHeight: 1.1 }}>
            {needLm.toLocaleString("es-ES")} lm
          </p>
          <p className="font-body t-caption" style={{ color: COLORS.subtext }}>necesidad calculada</p>
        </div>
        <div className="flex items-start gap-3 px-4 py-3" style={{ borderTop: `1px solid ${COLORS.border}` }}>
          <Lightbulb size={16} color={COLORS.bulb} strokeWidth={1.9} className="shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-body t-body" style={{ color: COLORS.text }}>
              {onlyLights ? "Repartidos entre tus puntos de techo" : `Propuesta: ${grid.n} downlights de ${grid.lmPer} lm`}
            </p>
            <p className="font-body t-caption" style={{ color: COLORS.subtext }}>
              moverse, ver el conjunto y abrir un armario: la encimera no depende de esto
              {showProposal ? " · los focos vienen en escalones de flujo, así que la propuesta no cae clavada" : ""}
            </p>
          </div>
          {showProposal && (
            <p className="font-body t-body font-medium shrink-0" style={{ color: COLORS.text }}>{proposalLm.toLocaleString("es-ES")} lm</p>
          )}
        </div>
      </div>

      <p className="font-body t-eyebrow mt-4 mb-1" style={{ color: COLORS.accent }}>Luz de trabajo y refuerzos</p>
      <p className="font-body t-caption mb-2.5" style={{ color: COLORS.subtext }}>
        No se suman a la general: cada una se enciende cuando hace falta.
      </p>
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: COLORS.bg }}>
        {work.map((wk, i) => (
          <div key={wk.id} className="flex items-start gap-3 px-4 py-3"
            style={{ borderTop: i === 0 ? "none" : `1px solid ${COLORS.border}` }}>
            <ChefHat size={16} color={COLORS.bulb} strokeWidth={1.9} className="shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-body t-body" style={{ color: COLORS.text }}>{wk.label}</p>
              <p className="font-body t-caption" style={{ color: COLORS.subtext }}>{wk.hint}</p>
            </div>
            <p className="font-body t-body font-medium shrink-0" style={{ color: COLORS.text }}>{wk.lm.toLocaleString("es-ES")} lm</p>
          </div>
        ))}
      </div>
      <p className="font-body t-small mt-2.5 rounded-lg p-3" style={{ color: COLORS.text, backgroundColor: COLORS.bgAlt }}>
        <span className="font-medium">Los {fmtDim(task.runM)} m de encimera son una estimación de Nemul.</span> Salen de la forma que has elegido y de las medidas de la estancia; no te hemos preguntado cuánto mide tu frente de trabajo. Ajusta los metros de tira a lo que tengas de verdad, manteniendo los {task.lmPerM ?? KITCHEN_TASK_LM_PER_M} lm por metro.
      </p>
    </div>
  );
}

function KitchenReportCard({ room, answers, expanded, onToggle, sameToneAs }) {
  const { tempK, grid, area, layers, distribution, narrative, mistakes } = generateKitchenReport(answers);
  const onlyLights = answers.renovationStatus === "onlyLights";
  const { Icon } = room;
  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
      <button onClick={onToggle} className="w-full flex items-center gap-4 p-5 text-left">
        <Icon size={22} color={COLORS.subtext} strokeWidth={1.5} className="shrink-0" />
        <div className="flex-1">
          <p className="font-body t-body font-medium" style={{ color: COLORS.text }}>{room.label}</p>
          <p className="font-body t-body" style={{ color: COLORS.subtext }}>Estudio de iluminación</p>
        </div>
        <ChevronDown size={16} color={COLORS.subtext} style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
      </button>
      {expanded && (
        <div className="px-5 pb-5 flex flex-col gap-5">
          <ColorTempBlock
            roomId={room.id}
            tempK={tempK}
            sameToneAs={sameToneAs}
            extra={<StatRow label="Separación entre downlights" value={spacingShort(grid)} />}
          />

          <KitchenLayerBlock layers={layers} area={area} onlyLights={onlyLights} />

          <CeilingPlan grid={grid} onlyLights={onlyLights} measured={!!roomDims(answers)} />

          <div>
            <p className="font-body t-eyebrow mb-2.5" style={{ color: COLORS.accent }}>Distribución recomendada de los focos</p>
            <div className="flex flex-col gap-2">
              {distribution.map((line, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl p-3.5" style={{ backgroundColor: COLORS.bg }}>
                  <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ backgroundColor: COLORS.accent }} />
                  <p className="font-body t-body" style={{ color: COLORS.text }}>{line}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="font-body t-eyebrow mb-2.5" style={{ color: COLORS.accent }}>Recomendación de diseño</p>
            <div className="rounded-xl p-4" style={{ backgroundColor: COLORS.bg }}>
              <p className="font-body t-small" style={{ color: COLORS.text }}>{narrative}</p>
            </div>
          </div>

          <MistakesList mistakes={mistakes} />
        </div>
      )}
    </div>
  );
}

function RoomReportCard({ room, answers, expanded, onToggle, sameToneAs }) {
  const insights = getReport(room.id, answers);
  // Este informe era el único sin "Errores que debes evitar", así que salía
  // más pobre que el resto al ponerlos uno al lado de otro.
  const mistakes = ROOM_TECH_MISTAKES[room.id] || [];
  const { Icon } = room;
  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
      <button onClick={onToggle} className="w-full flex items-center gap-4 p-5 text-left">
        <Icon size={22} color={COLORS.subtext} strokeWidth={1.5} className="shrink-0" />
        <div className="flex-1">
          <p className="font-body t-body font-medium" style={{ color: COLORS.text }}>{room.label}</p>
          <p className="font-body t-body" style={{ color: COLORS.subtext }}>Informe de diseño · {insights.length} recomendaciones</p>
        </div>
        <ChevronDown size={16} color={COLORS.subtext} style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
      </button>
      {expanded && (
        <div className="px-5 pb-5 flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            {insights.map((text, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl p-3.5" style={{ backgroundColor: COLORS.bg }}>
                <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ backgroundColor: COLORS.accent }} />
                <p className="font-body t-body" style={{ color: COLORS.text }}>{text}</p>
              </div>
            ))}
          </div>
          {mistakes.length > 0 && <MistakesList mistakes={mistakes} />}
        </div>
      )}
    </div>
  );
}

/* El baño, en dos bloques: la general y las capas funcionales. Sin total: el
 * espejo ilumina una cara y la general un suelo, así que sumarlos no da una
 * cifra que signifique nada. */
function BathroomLayerBlock({ bath, area, lux, grid, onlyLights }) {
  const { mirror, wet, night, generalTempK } = bath;
  const needLm = Math.round((lux * area) / 100) * 100;
  const proposalLm = grid.totalLm;
  const showProposal = !onlyLights && proposalLm !== needLm;

  const rows = [
    {
      id: "espejo", Icon: Sparkles, label: `Espejo — ${mirror.pieces} × ${mirror.per} lm`, lm: mirror.lm,
      hint: `${mirror.detail}. CRI ≥ ${mirror.cri} y ${mirror.tempK} K${mirror.tempK !== generalTempK ? `, un punto más neutra que la general de ${generalTempK} K para juzgar bien el color sobre la piel` : ""}`,
    },
    ...wet.map((w) => ({
      id: w.id, Icon: Droplets, label: `${w.label} — ${w.lm} lm`, lm: w.lm,
      hint: `${w.detail}. ${w.tempText}, ${w.ip} en la vertical de la zona e IP44 en los 60 cm de alrededor${w.dimmable ? ", y regulable" : ""}`,
    })),
    ...(night ? [{
      id: "nocturna", Icon: Moon, label: `Luz nocturna — ${night.lm} lm`, lm: night.lm,
      hint: `${night.detail}. ${night.tempK} K, lo más cálida posible`,
    }] : []),
  ];

  return (
    <div>
      <p className="font-body t-eyebrow mb-2.5" style={{ color: COLORS.accent }}>Iluminación general</p>
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: COLORS.bg }}>
        <div className="px-4 pt-4 pb-3">
          <p className="font-body t-caption" style={{ color: COLORS.subtext }}>{fmtArea(area)} m² × {lux} lm/m²</p>
          <p className="font-display mt-1" style={{ color: COLORS.text, fontSize: 32, lineHeight: 1.1 }}>
            {needLm.toLocaleString("es-ES")} lm
          </p>
          <p className="font-body t-caption" style={{ color: COLORS.subtext }}>necesidad calculada</p>
        </div>
        <div className="flex items-start gap-3 px-4 py-3" style={{ borderTop: `1px solid ${COLORS.border}` }}>
          <Lightbulb size={16} color={COLORS.bulb} strokeWidth={1.9} className="shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-body t-body" style={{ color: COLORS.text }}>
              {onlyLights ? "Repartidos entre tus puntos de techo" : `Propuesta: ${grid.n} downlights de ${grid.lmPer} lm`}
            </p>
            <p className="font-body t-caption" style={{ color: COLORS.subtext }}>
              la luz de fondo: moverse y ver el conjunto. La cara no depende de esto
              {showProposal ? " · los focos vienen en escalones de flujo, así que la propuesta no cae clavada" : ""}
            </p>
          </div>
          {showProposal && (
            <p className="font-body t-body font-medium shrink-0" style={{ color: COLORS.text }}>{proposalLm.toLocaleString("es-ES")} lm</p>
          )}
        </div>
      </div>

      <p className="font-body t-eyebrow mt-4 mb-1" style={{ color: COLORS.accent }}>Capas funcionales</p>
      <p className="font-body t-caption mb-2.5" style={{ color: COLORS.subtext }}>
        No se suman a la general: cada una se enciende cuando hace falta.
      </p>
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: COLORS.bg }}>
        {rows.map((r, i) => (
          <div key={r.id} className="flex items-start gap-3 px-4 py-3"
            style={{ borderTop: i === 0 ? "none" : `1px solid ${COLORS.border}` }}>
            <r.Icon size={16} color={COLORS.bulb} strokeWidth={1.9} className="shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-body t-body" style={{ color: COLORS.text }}>{r.label}</p>
              <p className="font-body t-caption" style={{ color: COLORS.subtext }}>{r.hint}</p>
            </div>
            <p className="font-body t-body font-medium shrink-0" style={{ color: COLORS.text }}>{r.lm.toLocaleString("es-ES")} lm</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function GenericTechnicalReportCard({ room, answers, expanded, onToggle, sameToneAs }) {
  const { tempK, lumens, grid, area, lux, tips, mistakes, layers, bath } = generateGenericTechnicalReport(room.id, answers);
  const { Icon } = room;
  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
      <button onClick={onToggle} className="w-full flex items-center gap-4 p-5 text-left">
        <Icon size={22} color={COLORS.subtext} strokeWidth={1.5} className="shrink-0" />
        <div className="flex-1">
          <p className="font-body t-body font-medium" style={{ color: COLORS.text }}>{room.label}</p>
          <p className="font-body t-body" style={{ color: COLORS.subtext }}>Estudio de iluminación</p>
        </div>
        <ChevronDown size={16} color={COLORS.subtext} style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
      </button>
      {expanded && (
        <div className="px-5 pb-5 flex flex-col gap-5">
          <ColorTempBlock roomId={room.id} tempK={tempK} sameToneAs={sameToneAs} />

          {layers ? (
            <BedroomLayerBlock area={area} lux={lux} layers={layers} grid={grid} />
          ) : bath ? (
            <BathroomLayerBlock bath={bath} area={area} lux={lux} grid={grid} onlyLights={answers.renovationStatus === "onlyLights"} />
          ) : (
            <CalculationBlock
              area={area} lux={lux} lumens={lumens} grid={grid}
              onlyLights={answers.renovationStatus === "onlyLights"}
              ambientOnly={room.id === "office"}
            />
          )}

          {/* El despacho es la única estancia con una zona de trabajo fija, y
              su nivel no es el de la habitación: va en su propio bloque, justo
              después del general, para que se lean como dos capas. */}
          {room.id === "office" && <TaskLightingBlock lux={lux} />}

          {/* El dormitorio elige entre tres representaciones según lo que hay
              en su techo; ver BEDROOM: LAS CUATRO CARAS DEL INFORME. */}
          {layers ? (
            layers.mode === "reforma" ? <CeilingPlan grid={grid} measured={!!roomDims(answers)} />
            : layers.mode === "varios" ? <CeilingFluxNote generalLm={layers.generalLm} />
            : <BedroomZoneScheme layers={layers} />
          ) : room.id === "terrace" ? (
            <div data-pdf-keep>
              <p className="font-body t-eyebrow mb-2.5" style={{ color: COLORS.accent }}>Zonas a iluminar</p>
              <div className="rounded-xl p-4" style={{ backgroundColor: COLORS.bg }}>
                <TerraceZoneScheme activities={answers.activities} covered={answers.covered} night={answers.night} />
              </div>
            </div>
          ) : (
            <CeilingPlan grid={grid} onlyLights={answers.renovationStatus === "onlyLights"} measured={!!roomDims(answers)} />
          )}

          <TipsList tips={tips} />

          <MistakesList mistakes={mistakes} />
        </div>
      )}
    </div>
  );
}

const GENERIC_TECH_ROOMS = ["bedroom", "bathroom", "dining", "closet", "terrace", "office"];

function ReportCard({ room, answers, expanded, onToggle, sameToneAs }) {
  if (room.id === "living" || room.id === "livingDining") return <TechnicalReportCard room={room} answers={answers} expanded={expanded} onToggle={onToggle} sameToneAs={sameToneAs} />;
  if (room.id === "kitchen" || room.id === "kitchenOpen") return <KitchenReportCard room={room} answers={answers} expanded={expanded} onToggle={onToggle} sameToneAs={sameToneAs} />;
  if (GENERIC_TECH_ROOMS.includes(room.id)) return <GenericTechnicalReportCard room={room} answers={answers} expanded={expanded} onToggle={onToggle} sameToneAs={sameToneAs} />;
  return <RoomReportCard room={room} answers={answers} expanded={expanded} onToggle={onToggle} sameToneAs={sameToneAs} />;
}

// El logotipo real de Instagram, en un solo trazo y del color del texto: se
// reconoce al instante y no mete un cuarto color en una paleta de tres. El de
// lucide es una aproximación y aquí se nota, porque compite con un icono de
// libro que sí es genérico.
const INSTAGRAM_GLYPH = "M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.439.645 1.439 1.439z";

function InstagramGlyph({ size = 16, color = COLORS.text }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d={INSTAGRAM_GLYPH} />
    </svg>
  );
}

// Antes era una tarjeta de Etsy con recuadro, icono, titular, descripción y
// botón: ocupaba más que algunas recomendaciones del informe. Reducida a dos
// líneas, deja de competir con el contenido por el que la persona ha venido.
//
// Instagram va primero: seguir es gratis y no interrumpe a quien todavía está
// leyendo sus recomendaciones. La tienda queda debajo, para quien acaba de ver
// que esto le sirve y quiere más.
function GuidePromoCard({ desde = "informe" }) {
  return (
    <div style={{ borderTop: `1px solid ${COLORS.text}`, borderBottom: `1px solid ${COLORS.text}` }}>
      <a
        href="https://www.instagram.com/nemul.app/"
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => { track("instagram_click", { desde }); gaEvent("instagram_click", { desde }); }}
        className="tap-scale w-full flex items-center justify-center gap-2 py-4 font-body t-small font-medium flex-wrap"
        style={{ color: COLORS.text }}
      >
        <InstagramGlyph />
        Consejos sencillos para iluminar mejor tu casa
        <span style={{ color: COLORS.subtext }}>@nemul.app</span>
        <ChevronRight size={14} color={COLORS.text} />
      </a>
      <a
        href="https://www.etsy.com/es/listing/4427720777/guia-de-iluminacion-del-hogar-consejos?ref=share_ios_native_control"
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => { track("etsy_click", { desde }); gaEvent("etsy_click", { desde }); }}
        className="tap-scale w-full flex items-center justify-center gap-2 py-4 font-body t-small font-medium"
        style={{ color: COLORS.text, borderTop: `1px solid ${COLORS.border}` }}
      >
        <BookOpen size={16} color={COLORS.text} strokeWidth={1.7} />
        Visita mi tienda de Etsy para más consejos de diseño
        <ChevronRight size={14} color={COLORS.text} />
      </a>
    </div>
  );
}

// La marca va arriba del informe, no aquí: es lo primero que se ve y lo que
// entra en una captura de pantalla. Al pie solo queda el aviso legal.
function LegalNote() {
  return (
    <p className="font-body t-caption text-center px-3" style={{ color: COLORS.subtext }}>
      Estas recomendaciones son orientativas. Para la instalación eléctrica, consulta siempre a un profesional certificado.
    </p>
  );
}

// Firma de marca del informe. Legible en una captura, discreta en pantalla.
function MarcaNemul() {
  return (
    <div className="flex items-center justify-center gap-2 mb-5">
      <span className="rounded-full" style={{ width: 6, height: 6, backgroundColor: COLORS.bulb }} />
      <span className="font-display" style={{ fontSize: 24, lineHeight: 1, color: COLORS.text }}>Nemul</span>
      <span className="font-body t-small" style={{ color: COLORS.subtext }}>nemul.app</span>
    </div>
  );
}

// Versión "para imprimir": las mismas tarjetas de informe, siempre abiertas
// del todo, renderizadas fuera de pantalla para capturarlas como imagen.
function PrintableReport({ rooms, answersByRoom }) {
  const dupTone = toneDuplicates(rooms, answersByRoom);
  return (
    <div style={{ width: 700 }} className="bg-white p-10">
      <div className="text-center mb-8">
        {/* La marca abre el informe con el mismo peso que tiene en pantalla.
            Antes era un "NEMUL" en versalitas de 12px que en una captura de
            móvil no se leía, y la firma solo quedaba al pie. */}
        <div className="flex items-center justify-center gap-2.5 mb-3">
          <span className="rounded-full" style={{ width: 7, height: 7, backgroundColor: COLORS.bulb }} />
          <span className="font-display" style={{ fontSize: 26, lineHeight: 1, color: COLORS.text }}>Nemul</span>
          <span className="font-body t-small" style={{ color: COLORS.subtext }}>nemul.app</span>
        </div>
        <p className="font-display t-title font-medium" style={{ color: COLORS.text }}>Estudio de iluminación</p>
        <p className="font-body t-small mt-1.5" style={{ color: COLORS.subtext }}>
          {new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>
      <div className="mb-6">
        <LightingBasics rooms={rooms} answersByRoom={answersByRoom} />
      </div>
      <div className="flex flex-col gap-6">
        {rooms.map((room) => (
          <ReportCard key={room.id} room={room} answers={answersByRoom[room.id]} expanded={true} onToggle={() => {}} sameToneAs={dupTone[room.id]} />
        ))}
      </div>
      {/* El aviso legal y la firma viajan juntos y sin partirse: en la última
          página salía media línea de "Nemul" abajo y la otra media arriba de
          una hoja que, por lo demás, quedaba en blanco. */}
      <div>
        <p className="font-body t-caption text-center mt-8" style={{ color: COLORS.subtext }}>
          Estas recomendaciones son orientativas. Para la instalación eléctrica, consulta siempre a un profesional certificado.
        </p>
        {/* Solo la firma es indivisible. Marcando también el aviso legal, los
            dos juntos ocupaban demasiado y se iban a una página para ellos
            solos. */}
        <div data-pdf-keep className="flex items-center justify-center gap-2.5 mt-5 pt-5" style={{ borderTop: `1px solid ${COLORS.border}` }}>
          <span className="rounded-full" style={{ width: 6, height: 6, backgroundColor: COLORS.bulb }} />
          <span className="font-display" style={{ fontSize: 18, color: COLORS.text }}>Nemul</span>
          <span className="font-body t-small" style={{ color: COLORS.subtext }}>
            Diseña la iluminación de tu hogar en nemul.app
          </span>
        </div>
      </div>
    </div>
  );
}

async function downloadReportAsPdf(node, filename) {
  if (!node) return;
  // Aquí es donde se descargan de verdad las dos librerías del PDF. El
  // navegador las guarda en caché, así que solo pasa la primera vez.
  // Ojo: jspdf 4 exporta el constructor con nombre ({ jsPDF }), no por
  // defecto como hacía la versión 2. Cambiar esto rompe la descarga del PDF
  // sin que la compilación avise de nada.
  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);
  // Los navegadores limitan el tamaño de un lienzo, y al superarlo lo recortan
  // en silencio: el informe salía sin el final. Bajamos la resolución de
  // captura lo justo para no pasarnos, en vez de fijar siempre el doble.
  const MAX_LADO = 8000;
  const alto = node.scrollHeight || 1;
  const ancho = node.scrollWidth || 1;
  const scale = Math.max(1, Math.min(2, MAX_LADO / alto, MAX_LADO / ancho));

  // Todo lo que sigue se mide sobre el informe real, antes de la foto, y se
  // traduce a píxeles del lienzo multiplicando por la escala.
  //
  // Se mide con querySelectorAll + getBoundingClientRect y nada más. El
  // intento anterior recorría los nodos de texto con un TreeWalker y pedía
  // getClientRects() de cada uno, para tener precisión de línea: devolvía una
  // lista vacía, y con la lista vacía esto cortaba a ciegas y además creía
  // que el informe se acababa en el píxel cero. Un párrafo entero es menos
  // preciso que una línea, pero se mide con la única vía que sabemos que
  // responde bien aquí.
  const origen = node.getBoundingClientRect().top;
  const aPx = (r) => ({ top: (r.top - origen) * scale, bottom: (r.bottom - origen) * scale });

  // Bloques que no se pueden partir entre dos páginas.
  const bloquesEnteros = Array.from(node.querySelectorAll("[data-pdf-keep]")).map((el) =>
    aPx(el.getBoundingClientRect()),
  );

  // Todo lo que lleva tinta: párrafos, rótulos e iconos. Ningún corte puede
  // caer dentro de uno de estos rectángulos.
  const bloquesTinta = [];
  for (const el of node.querySelectorAll("p, span, svg")) {
    const r = el.getBoundingClientRect();
    if (r.height > 0) bloquesTinta.push(aPx(r));
  }
  // Si por lo que sea no se ha podido medir nada, finContenido se queda a cero
  // y más abajo eso NO puede servir para descartar páginas: perder el final
  // del informe es mucho peor que dejar una hoja de más.
  const finContenido = bloquesTinta.reduce((max, l) => Math.max(max, l.bottom), 0);

  const canvas = await html2canvas(node, {
    scale,
    backgroundColor: "#FFFFFF",
    useCORS: true,
    // El informe se dibuja fuera de pantalla; sin esto html2canvas puede
    // capturar solo la parte que cabría en la ventana visible.
    scrollX: 0,
    scrollY: 0,
    windowWidth: ancho,
    windowHeight: alto,
    // Esta es la causa de que el informe saliera sin "Errores que debes
    // evitar": para capturar, la librería clona el informe en un documento
    // nuevo, y al clonarlo las animaciones de entrada vuelven a empezar. Como
    // arrancan en opacidad 0 y algunos elementos llevan retardo, la foto se
    // tomaba antes de que aparecieran y salían en blanco. Aquí las apagamos
    // en la copia; la pantalla real no se toca.
    onclone: (doc) => {
      const style = doc.createElement("style");
      style.textContent =
        ".option-in, .check-pop, .rise-in, .toast-in {" +
        " animation: none !important; opacity: 1 !important; transform: none !important; }";
      doc.head.appendChild(style);
    },
  });

  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Cuántos píxeles de alto del lienzo entran en una página A4.
  const pxPorPagina = Math.max(1, Math.floor((canvas.width * pageHeight) / pageWidth));

  const MARGEN_BUSQUEDA = Math.floor(pxPorPagina * 0.25);
  // Unos píxeles de aire por encima de lo que baja de página, para no rozar
  // su borde superior al cortar.
  const AIRE = Math.max(2, Math.round(scale * 3));

  // Sube el corte hasta que no atraviese ningún párrafo, rótulo ni icono.
  // Cada vez que tropieza con uno, se coloca justo por encima y vuelve a
  // comprobarlo todo, porque puede haber varios a distintas alturas (un icono
  // al lado de su frase, un rótulo pegado a su tarjeta).
  const buscarCorte = (ideal) => {
    const minimo = ideal - MARGEN_BUSQUEDA;
    let corte = ideal;
    for (let vuelta = 0; vuelta < 60; vuelta++) {
      let tropieza = false;
      for (const b of bloquesTinta) {
        if (b.top < corte && b.bottom > corte) {
          corte = b.top - AIRE;
          tropieza = true;
        }
      }
      if (!tropieza) return corte;
      // Si hay que subir tanto que la página quedaría a medias, no compensa.
      if (corte < minimo) return ideal;
    }
    return ideal;
  };

  // Recortamos el lienzo página a página. Antes se incrustaba la imagen
  // entera en cada página, desplazada hacia arriba: el PDF pesaba tantas
  // veces el informe como páginas tuviera, y el último tramo podía perderse.
  const trozo = document.createElement("canvas");
  const ctx = trozo.getContext("2d");
  trozo.width = canvas.width;

  let y = 0;
  let primera = true;
  while (y < canvas.height) {
    let altoTrozo = Math.min(pxPorPagina, canvas.height - y);
    const esUltima = y + altoTrozo >= canvas.height;
    if (!esUltima) {
      const ideal = y + altoTrozo;
      // Primero manda el bloque entero: si el corte cae dentro de uno que
      // empieza en esta página y termina en la siguiente, cerramos la página
      // justo antes y el bloque pasa completo a la hoja siguiente.
      const parte = bloquesEnteros.find((b) => b.top > y && b.top < ideal && b.bottom > ideal);
      const corte = parte && parte.top - y > pxPorPagina * 0.3
        ? Math.round(parte.top) - AIRE
        : buscarCorte(ideal);
      // Nunca dejamos una página a menos de un tercio: si no hay forma
      // limpia, mejor el corte fijo que una hoja casi vacía.
      if (corte - y > pxPorPagina * 0.3) altoTrozo = corte - y;
    } else if (!primera && finContenido > 0 && y >= finContenido) {
      // Lo que queda por debajo del último texto es margen: una hoja vacía.
      // El "finContenido > 0" es deliberado: si la medición falla, esta línea
      // se desactiva sola en vez de tirar la última página del informe.
      break;
    }
    trozo.height = altoTrozo;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, trozo.width, altoTrozo);
    ctx.drawImage(canvas, 0, y, canvas.width, altoTrozo, 0, 0, canvas.width, altoTrozo);

    if (!primera) pdf.addPage();
    pdf.addImage(
      trozo.toDataURL("image/png"),
      "PNG",
      0,
      0,
      pageWidth,
      (altoTrozo * pageWidth) / canvas.width,
    );

    primera = false;
    y += altoTrozo;
  }

  pdf.save(filename);
}

// La descarga no pide nada a cambio. El informe lleva dentro el nombre y el
// dominio de Nemul, así que cada PDF que alguien reenvía es publicidad: poner
// una puerta delante reduce esa difusión, que es justo lo que hace falta ahora.
// El correo se pide después, cuando ya tienen lo suyo, y sin bloquear nada.
const EMAIL_GUARDADO = "nemul_email";

function leerEmailGuardado() {
  try {
    return localStorage.getItem(EMAIL_GUARDADO) || "";
  } catch {
    return "";
  }
}

function DescargaConEmail({ printRef, roomLabels }) {
  const [descargando, setDescargando] = useState(false);
  const [pedirEmail, setPedirEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState("inicial"); // inicial | enviando | hecho | error
  const cajaRef = useRef(null);

  useEffect(() => {
    if (pedirEmail) cajaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [pedirEmail]);

  const descargar = async () => {
    if (descargando) return;
    setDescargando(true);
    try {
      const fecha = new Date().toISOString().slice(0, 10);
      await downloadReportAsPdf(printRef.current, `nemul-informe-${fecha}.pdf`);
      track("downloaded_pdf");
      gaEvent("downloaded_pdf");
      // A quien ya nos dejó el correo no le volvemos a preguntar.
      if (!leerEmailGuardado()) {
        setPedirEmail(true);
        track("email_optin_shown");
        gaEvent("email_optin_shown");
      }
    } catch (e) {
      // Si algo falla generando el PDF, no rompemos el resto de la app.
    } finally {
      setDescargando(false);
    }
  };

  const enviar = async () => {
    const limpio = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpio) || estado === "enviando") {
      setEstado("error");
      return;
    }
    setEstado("enviando");
    try {
      const res = await fetch(PREMIUM_INTEREST_FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: limpio, interes: "Avisos de Nemul", estancias: roomLabels }),
      });
      if (!res.ok) throw new Error("request failed");
      try {
        localStorage.setItem(EMAIL_GUARDADO, limpio);
      } catch {
        // Si el navegador bloquea el almacenamiento, volveremos a preguntar. No pasa nada.
      }
      setEstado("hecho");
      track("email_optin_submitted");
      gaEvent("email_optin_submitted");
    } catch (e) {
      setEstado("error");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <SecondaryButton onClick={descargar} disabled={descargando} Icon={Download}>
        {descargando ? "Generando PDF..." : "Descargar informe en PDF"}
      </SecondaryButton>

      {pedirEmail && estado === "hecho" && (
        <div ref={cajaRef} className="rounded-xl p-5 text-center rise-in" style={{ backgroundColor: COLORS.bgAlt }}>
          <Check size={20} color={COLORS.success} strokeWidth={2.5} className="mx-auto mb-2" />
          <p className="font-body t-body font-medium" style={{ color: COLORS.text }}>Anotado</p>
          <p className="font-body t-small mt-1" style={{ color: COLORS.subtext }}>
            Te escribiremos cuando haya novedades. Gracias por confiar en Nemul.
          </p>
        </div>
      )}

      {pedirEmail && estado !== "hecho" && (
        <div ref={cajaRef} className="rounded-xl p-5 rise-in" style={{ backgroundColor: COLORS.bgAlt }}>
          <p className="font-body t-body font-medium mb-1" style={{ color: COLORS.text }}>
            Ya tienes tu informe
          </p>
          <p className="font-body t-small mb-4" style={{ color: COLORS.subtext }}>
            Si quieres, déjanos tu correo y te avisamos cuando ampliemos Nemul o publiquemos
            consejos nuevos. No hace falta para nada más.
          </p>
          <label htmlFor="email-avisos" className="sr-only">Tu correo electrónico</label>
          <input
            id="email-avisos"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (estado === "error") setEstado("inicial"); }}
            onKeyDown={(e) => { if (e.key === "Enter") enviar(); }}
            placeholder="tu@email.com"
            className="w-full rounded-xl px-4 py-3 mb-3 font-body t-body"
            style={{ backgroundColor: COLORS.card, border: `1px solid ${estado === "error" ? COLORS.warning : COLORS.border}`, color: COLORS.text }}
          />
          <PrimaryButton onClick={enviar} disabled={estado === "enviando"}>
            {estado === "enviando" ? "Enviando..." : "Avisadme de novedades"}
          </PrimaryButton>
          {estado === "error" && (
            <p className="font-body t-small mt-2 text-center" style={{ color: COLORS.warning }}>
              Revisa la dirección o vuelve a intentarlo.
            </p>
          )}
          <button
            onClick={() => setPedirEmail(false)}
            className="w-full font-body t-small font-medium py-2 mt-1"
            style={{ color: COLORS.subtext }}
          >
            No, gracias
          </button>
          <p className="font-body t-caption mt-1 text-center" style={{ color: COLORS.subtext }}>
            Ni spam, ni cesión a terceros. Puedes pedir la baja cuando quieras.
          </p>
        </div>
      )}
    </div>
  );
}

function ResultScreen({ rooms, answersByRoom, onRestart, onSave, saved }) {
  const [expandedId, setExpandedId] = useState(rooms[0]?.id);
  const printRef = useRef(null);
  const dupTone = toneDuplicates(rooms, answersByRoom);

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

  return (
    <div className="flex flex-col h-full rise-in relative">
      <TopNav onBack={onRestart} />
      <div className="flex-1 overflow-y-auto px-6">
        <div className="text-center mb-6">
          <MarcaNemul />
          <p className="font-body t-eyebrow mb-2" style={{ color: COLORS.accent }}>
            {rooms.length} espacio{rooms.length > 1 ? "s" : ""}, con criterio de diseño
          </p>
          <h2 className="font-display t-display font-medium" style={{ color: COLORS.text }}>
            Tu estudio de iluminación está listo
          </h2>
        </div>

        <div className="pb-4">
          <LightingBasics rooms={rooms} answersByRoom={answersByRoom} />
        </div>

        <div className="flex flex-col gap-3 pb-4">
          {rooms.map((room) => (
            <ReportCard key={room.id} room={room} answers={answersByRoom[room.id]} expanded={expandedId === room.id} onToggle={() => setExpandedId(expandedId === room.id ? null : room.id)} sameToneAs={dupTone[room.id]} />
          ))}
        </div>

        <div className="pb-3">
          <GuidePromoCard />
        </div>
        <div className="pb-4">
          <LegalNote />
        </div>
      </div>
      <div className="screen-actions px-6 pt-4 flex flex-col gap-3">
        <PrimaryButton onClick={onSave}>Guardar este plan</PrimaryButton>
        <DescargaConEmail printRef={printRef} roomLabels={rooms.map((r) => r.label).join(", ")} />
        <button onClick={onRestart} className="w-full font-body t-small font-medium py-2 flex items-center justify-center gap-1" style={{ color: COLORS.subtext }}>
          Crear un nuevo plan <ChevronRight size={14} />
        </button>
      </div>
      {saved && (
        <div className="absolute left-1/2 bottom-24 toast-in flex items-center gap-2 px-4 py-2.5 rounded-full" style={{ backgroundColor: COLORS.text }}>
          <Check size={14} color="#FFFFFF" strokeWidth={3} />
          <span className="font-body t-body font-medium text-white">Plan guardado</span>
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

/* Informe de ejemplo: lo que vas a recibir, antes de contestar nada.
 *
 * La duda que frena a cualquiera ante un cuestionario de siete preguntas no
 * es "¿me costará mucho?", es "¿qué me van a dar a cambio?". Aquí se enseña.
 *
 * No es una captura ni un PDF: son los mismos componentes del informe real,
 * alimentados con unas respuestas fijas. Por eso no puede quedarse antiguo —
 * cada mejora del informe aparece aquí sola, sin que nadie se acuerde de
 * actualizar el ejemplo.
 *
 * El caso elegido es el más común y el más difícil de explicar: un salón
 * mediano, con luz natural media, de alguien que solo va a cambiar las
 * luminarias. Si el informe convence en ese caso, convence.
 */
const SAMPLE_ROOM = ROOMS.find((r) => r.id === "living");
const SAMPLE_ANSWERS = {
  renovationStatus: "onlyLights",
  size: "medium",
  light: "moderate",
  ceiling: "pladur",
  ceilingPoints: "varios",
  activities: ["tv", "read", "relax"],
};
const SAMPLE_ANSWER_SUMMARY = [
  "Solo se van a cambiar las luminarias",
  "Salón de unos 20 m²",
  "Luz natural media",
  "Falso techo de pladur",
  "Varios puntos de luz en el techo",
  "Se usa para ver la tele, leer y descansar",
];

function SampleReportScreen({ onBack, onStart }) {
  const rooms = [SAMPLE_ROOM];
  const answersByRoom = { living: SAMPLE_ANSWERS };
  // Abierto de entrada: quien entra a ver un ejemplo no viene a pulsar nada,
  // viene a leerlo. Pero se puede plegar, como en el informe de verdad.
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    track("viewed_sample_report");
    gaEvent("viewed_sample_report");
  }, []);

  return (
    <div className="flex flex-col h-full rise-in">
      <TopNav onBack={onBack} eyebrow="Informe de ejemplo" />
      <div className="flex-1 overflow-y-auto px-6">
        <div className="text-center mb-5">
          <MarcaNemul />
          <h2 className="font-display t-display font-medium mb-2" style={{ color: COLORS.text }}>
            Esto es lo que vas a recibir
          </h2>
          <p className="font-body t-body" style={{ color: COLORS.subtext }}>
            Un informe real, con un salón de ejemplo. El tuyo se calcula con tus respuestas.
          </p>
        </div>

        {/* Sin esto, el informe se lee como un folleto. Enseñar de qué
            respuestas sale cada número es lo que hace entender que el suyo
            será distinto. */}
        <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: COLORS.bgAlt, border: `1px solid ${COLORS.border}` }}>
          <p className="font-body t-eyebrow mb-2.5" style={{ color: COLORS.accent }}>Respuestas de este ejemplo</p>
          <div className="flex flex-col gap-1.5">
            {SAMPLE_ANSWER_SUMMARY.map((line) => (
              <div key={line} className="flex items-start gap-2.5">
                <Check size={14} color={COLORS.accent} strokeWidth={2.4} className="mt-1 shrink-0" />
                <span className="font-body t-small" style={{ color: COLORS.text }}>{line}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pb-4">
          <LightingBasics rooms={rooms} answersByRoom={answersByRoom} />
        </div>

        <div className="pb-4">
          <ReportCard room={SAMPLE_ROOM} answers={SAMPLE_ANSWERS} expanded={expanded} onToggle={() => setExpanded((e) => !e)} />
        </div>

        <div className="pb-4">
          <LegalNote />
        </div>
      </div>
      <div className="screen-actions px-6 pt-4 flex flex-col gap-3">
        <PrimaryButton onClick={onStart}>Crear el mío gratis</PrimaryButton>
        <button onClick={onBack} className="w-full font-body t-small font-medium py-2" style={{ color: COLORS.subtext }}>
          Volver
        </button>
      </div>
    </div>
  );
}

function PlanCard({ plan, onOpen, onDelete }) {
  const first = plan.rooms[0];
  const extra = plan.rooms.length - 1;
  return (
    <button onClick={onOpen} className="w-full flex items-center gap-4 rounded-xl p-5 text-left transition-all duration-200" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
      <div className="flex -space-x-3 shrink-0">
        {plan.rooms.slice(0, 3).map((r, i) => (
          <div key={r.id} className="w-11 h-11 rounded-full flex items-center justify-center border-2" style={{ backgroundColor: COLORS.bgAlt, borderColor: COLORS.card, zIndex: 10 - i }}>
            <r.Icon size={16} color={COLORS.accent} strokeWidth={1.6} />
          </div>
        ))}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-body t-body font-medium truncate" style={{ color: COLORS.text }}>{first.label}{extra > 0 ? ` + ${extra} más` : ""}</p>
        <p className="font-body t-small" style={{ color: COLORS.subtext }}>Guardado el {formatDate(plan.savedAt)}</p>
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
      <div className="px-6 pt-6 pb-5">
        <p className="font-body t-eyebrow mb-2" style={{ color: COLORS.accent }}>Nemul</p>
        <h2 className="font-display t-display font-medium mb-1.5" style={{ color: COLORS.text }}>Tus planes</h2>
        <p className="font-body t-small" style={{ color: COLORS.subtext }}>Cada espacio que has iluminado, todo en un solo lugar.</p>
      </div>
      <div className="flex-1 overflow-y-auto px-6">
        {plans.length === 0 ? (
          <div className="flex flex-col items-center text-center pt-14">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
              <HomeIcon size={22} color={COLORS.subtext} strokeWidth={1.5} />
            </div>
            <p className="font-body t-body max-w-[240px]" style={{ color: COLORS.subtext }}>Aún no tienes planes. Empieza con tu primer espacio y Nemul te guiará.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-4">
            {plans.map((plan) => <PlanCard key={plan.id} plan={plan} onOpen={() => onOpenPlan(plan.id)} onDelete={() => onDeletePlan(plan.id)} />)}
          </div>
        )}
      </div>
      <div className="screen-actions px-6 pt-4">
        <button onClick={onNewPlan} className="tap-scale w-full flex items-center justify-center gap-2 font-body font-medium t-body tracking-wide rounded-xl py-4 transition-all duration-200" style={{ background: COLORS.bulb, color: COLORS.bulbInk }}>
          <Plus size={16} strokeWidth={2.2} /> Planear un nuevo espacio
        </button>
      </div>
    </div>
  );
}

function PlanDetailScreen({ plan, onBack }) {
  const [expandedId, setExpandedId] = useState(plan.rooms[0]?.id);
  const printRef = useRef(null);
  const dupTone = toneDuplicates(plan.rooms, plan.answersByRoom);

  return (
    <div className="flex flex-col h-full rise-in">
      <TopNav onBack={onBack} />
      <div className="px-6 pb-5 text-center">
        <MarcaNemul />
        <p className="font-body t-eyebrow mb-2" style={{ color: COLORS.accent }}>Guardado el {formatDate(plan.savedAt)}</p>
        <h2 className="font-display t-display font-medium" style={{ color: COLORS.text }}>
          {plan.rooms.length} espacio{plan.rooms.length > 1 ? "s" : ""}, con criterio de diseño
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto px-6">
        <div className="pb-4">
          <LightingBasics rooms={plan.rooms} answersByRoom={plan.answersByRoom} />
        </div>
        <div className="flex flex-col gap-3 pb-4">
          {plan.rooms.map((room) => (
            <ReportCard key={room.id} room={room} answers={plan.answersByRoom[room.id]} expanded={expandedId === room.id} onToggle={() => setExpandedId(expandedId === room.id ? null : room.id)} sameToneAs={dupTone[room.id]} />
          ))}
        </div>
        <div className="pb-3">
          <DescargaConEmail printRef={printRef} roomLabels={plan.rooms.map((r) => r.label).join(", ")} />
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
      // Antes exigía que el 15 % del bloque estuviera ya en pantalla. En
      // bloques altos eso llega tarde: mientras scrolleas ves un hueco crema
      // donde el contenido todavía no ha aparecido, y la página parece mucho
      // más vacía de lo que es. Ahora aparece en cuanto asoma.
      { threshold: 0.01, rootMargin: "0px 0px -60px 0px" }
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
        // 0,6 s era largo para un fundido de entrada: sumado al escalonado de
        // las listas, el último elemento tardaba casi un segundo en verse y
        // mientras tanto su hueco estaba en blanco.
        transition: `opacity 0.45s ease ${delay}ms, transform 0.45s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
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
    // "Propuesta" era la única palabra de la web que rebajaba lo que Nemul
    // entrega. El producto ya se llama a sí mismo estudio en todas partes —cada
    // tarjeta del informe pone "Estudio de iluminación" y al terminar dice "Tu
    // estudio de iluminación está listo"—, así que la portada prometía menos de
    // lo que se cumple. Y es literal: se calculan lúmenes, temperatura de color
    // y distribución, no se sugiere una idea.
    heroSubtitle: "Recibe un estudio de iluminación personalizado en pocos minutos. No necesitas conocimientos técnicos.",
    heroCta: "Diseña tu iluminación",
    heroTrust: "Gratis · Sin registro · En pocos minutos",
    sampleLink: "Ver un informe de ejemplo",
    bannerAlt: "Despacho iluminado de noche: focos empotrados en el techo, tira LED bajo las estanterías y flexo sobre la mesa",
    langNotice: "",
    howTitle: "¿Cómo funciona?",
    howSubtitle: "Responde unas preguntas y recibe un estudio personalizado para tu estancia.",
    steps: [
      { n: "1", title: "Elige una estancia", text: "Salón, cocina, dormitorio... empieza por el espacio que más te importa ahora mismo." },
      { n: "2", title: "Responde unas preguntas sencillas", text: "Nada de términos técnicos: te preguntamos cómo vives ese espacio, no cómo diseñar luz." },
      { n: "3", title: "Recibe tu estudio de iluminación", text: "Temperatura, lúmenes, distribución de focos y recomendaciones adaptadas a tu estancia." },
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
    instagramLine: "Consejos sencillos para iluminar mejor tu casa",
    instagramHandle: "@nemul.app",
    faqTitle: "Preguntas frecuentes",
    faqs: [
      { q: "¿Necesito saber de iluminación para usar Nemul?", a: "No. Todas las preguntas están pensadas para cualquier persona, sin necesidad de conocer términos técnicos. Nemul traduce los aspectos técnicos a recomendaciones fáciles de entender." },
      { q: "¿Nemul sustituye a un electricista?", a: "No. Las recomendaciones son orientativas; para la instalación eléctrica siempre debes consultar a un profesional certificado." },
      { q: "¿Cuántas habitaciones puedo probar gratis?", a: "Una habitación completa, sin ningún coste. Muy pronto abriremos el acceso a toda la vivienda." },
      { q: "¿Cómo sé cuándo esté disponible el acceso completo?", a: "Al intentar entrar a otra habitación te ofrecemos dejar tu email para avisarte en cuanto esté listo." },
    ],
    footerLegal: "Estas recomendaciones son orientativas. Para la instalación eléctrica, consulta siempre a un profesional certificado.",
    footerFaqLink: "Preguntas frecuentes",
    footerShop: "Guía de iluminación",
    footerContact: "Contacto",
    footerPrivacy: "Política de privacidad",
    privacy: {
      dataTitle: "Qué datos recopilamos",
      dataText: "Nemul solo te pide tu email si tú decides dejarlo voluntariamente: después de descargar tu informe, por si quieres que te avisemos de novedades, o en la pantalla de acceso Premium. Descargar el informe no requiere dejar ningún dato. En ambos casos es opcional. No pedimos contraseña, datos de pago, ni ningún otro dato personal para usar la habitación gratuita.",
      useTitle: "Cómo lo usamos",
      useText: "Únicamente para avisarte de novedades de Nemul, como el acceso Premium. No lo usamos para ningún otro fin, y no lo compartimos, vendemos ni cedemos a terceros bajo ninguna circunstancia. Puedes pedirnos que te demos de baja en cualquier momento.",
      whereTitle: "Dónde se guarda",
      whereText: "Tu email se almacena de forma segura en Formspree, el servicio que usamos para gestionar este formulario de interés.",
      localTitle: "Almacenamiento en tu propio dispositivo",
      localText: "Para que Nemul funcione bien, guardamos cierta información directamente en tu navegador (no en nuestros servidores): qué habitación probaste gratis y los planes que decidas guardar. Esta información se queda únicamente en tu dispositivo, nunca se nos envía, y puedes borrarla en cualquier momento eliminando los datos de navegación de tu navegador.",
      cookiesTitle: "Cookies",
      cookiesText: "Nemul utiliza Google Analytics y Vercel Analytics para medir de forma agregada cuánta gente visita la web y qué secciones se usan más. Estos datos no se emplean para identificarte personalmente ni para mostrarte publicidad, y no se cruzan con el email que puedas dejarnos.",
      rightsTitle: "Tus derechos",
      rightsTextPrefix: "Puedes pedirnos en cualquier momento que eliminemos tu email de nuestros registros escribiendo a ",
      changesTitle: "Cambios futuros",
      changesText: "Si en el futuro añadimos cuentas de usuario, pagos u otro tratamiento de datos, actualizaremos esta política y te lo indicaremos claramente aquí.",
    },
  },
  en: {
    navCta: "Start for free",
    heroTitle: "The simplest way to design your home's lighting.",
    heroSubtitle: "Get a personalized lighting study in minutes. No technical knowledge required.",
    heroCta: "Start for free",
    sampleLink: "See a sample report",
    bannerAlt: "Home office lit at night: recessed ceiling downlights, LED strip under the shelves and a task lamp on the desk",
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
    instagramLine: "Simple tips to light your home better",
    instagramHandle: "@nemul.app",
    faqTitle: "Frequently asked questions",
    faqs: [
      { q: "Do I need to know about lighting to use Nemul?", a: "No. Every question is designed for anyone, no technical terms required. Nemul handles the professional part for you." },
      { q: "Does Nemul replace an electrician?", a: "No. The recommendations are for guidance only; always consult a certified professional for electrical installation." },
      { q: "How many rooms can I try for free?", a: "One full room, at no cost. We'll soon open access to your entire home." },
      { q: "How will I know when full access is available?", a: "When you try to enter another room, we'll offer you the option to leave your email so we can notify you." },
    ],
    footerLegal: "These recommendations are for guidance only. Always consult a certified professional for electrical installation.",
    footerFaqLink: "FAQ",
    footerShop: "Lighting guide",
    footerContact: "Contact",
    footerPrivacy: "Privacy policy",
    privacy: {
      dataTitle: "What data we collect",
      dataText: "Nemul only asks for your email if you choose to leave it: after you download your report, in case you want to hear about updates, or on the Premium access screen. Downloading the report requires no details at all. Both are optional. We don't ask for a password, payment details, or any other personal data to use the free room.",
      useTitle: "How we use it",
      useText: "Only to let you know about Nemul updates such as Premium access. We never use it for any other purpose, and we never share, sell, or transfer it to third parties under any circumstances. You can ask to be removed at any time.",
      whereTitle: "Where it's stored",
      whereText: "Your email is securely stored in Formspree, the service we use to manage this interest form.",
      localTitle: "Storage on your own device",
      localText: "To make Nemul work properly, we store certain information directly in your browser (not on our servers): which room you tried for free, and any plans you choose to save. This information stays only on your device, is never sent to us, and you can delete it anytime by clearing your browser's browsing data.",
      cookiesTitle: "Cookies",
      cookiesText: "Nemul uses Google Analytics and Vercel Analytics to measure, in aggregate, how many people visit the site and which sections are used most. This data is never used to identify you personally or to show you advertising, and it is not linked to any email you may leave us.",
      rightsTitle: "Your rights",
      rightsTextPrefix: "You can ask us at any time to delete your email from our records by writing to ",
      changesTitle: "Future changes",
      changesText: "If we add user accounts, payments, or any other data processing in the future, we'll update this policy and clearly note it here.",
    },
  },
};

function LandingNav({ onStart, lang, setLang, t }) {
  return (
    <div className="sticky top-0 z-10 backdrop-blur-md" style={{ backgroundColor: "rgba(250,246,239,0.88)", borderBottom: `1px solid ${COLORS.border}` }}>
      <div className="max-w-3xl mx-auto flex items-center justify-between px-6 py-4">
        {/* El logotipo es texto, no una imagen: nítido en cualquier pantalla,
            una petición de red menos, y no puede salir roto. El punto amarillo
            es la bombilla reducida a su mínima expresión — el símbolo completo
            vive en el favicon, donde se ve lo bastante grande. */}
        <div className="flex items-end gap-1.5">
          <span className="font-display" style={{ fontSize: 30, lineHeight: 1, fontWeight: 500, color: COLORS.text }}>
            Nemul
          </span>
          <span className="rounded-full mb-[3px]" style={{ width: 6, height: 6, backgroundColor: COLORS.bulb }} />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-full p-0.5" style={{ border: `1px solid ${COLORS.border}` }}>
            {["es", "en"].map((code) => (
              <button
                key={code}
                onClick={() => setLang(code)}
                aria-pressed={lang === code}
                className="tap-scale font-body t-caption font-medium rounded-full px-3 py-1.5"
                style={{
                  backgroundColor: lang === code ? COLORS.text : "transparent",
                  color: lang === code ? "#FFFFFF" : COLORS.subtext,
                }}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>
          {/* CTA de la barra en versión discreta: el botón amarillo del hero
              debe ser el único elemento que grita en la primera pantalla. */}
          <button
            onClick={onStart}
            className="tap-scale font-body t-small font-medium rounded-full px-5 py-2.5"
            style={{ backgroundColor: "transparent", border: `1px solid ${COLORS.text}`, color: COLORS.text }}
          >
            {t.navCta}
          </button>
        </div>
      </div>
    </div>
  );
}

/* Banda de imagen bajo el hero.
 *
 * Una portada que vende diseño de iluminación y no enseña ni una luz le pide
 * a la persona un acto de fe. Esta foto hace el argumento sola: se ven las
 * tres capas de las que habla el informe —empotrados en el techo, tira LED
 * bajo las estanterías, flexo sobre la mesa— y el pie las nombra, para que
 * quien no sepa mirar una foto de iluminación aprenda algo en tres segundos.
 *
 * Si el archivo no está, la banda entera se oculta en vez de dejar el icono
 * de imagen rota: el código puede viajar antes que la foto.
 */
function LandingBanner({ t }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <section className="w-full">
      {/* Banda, no bloque: a 16:9 completo la foto empujaba el titular y el
          botón fuera de la primera pantalla del móvil. Recortada en alto, la
          composición se mantiene —la mesa está centrada— y encima queda más
          cinematográfica. */}
      <img
        src="/despacho.jpg"
        alt={t.bannerAlt}
        onError={() => setFailed(true)}
        className="w-full object-cover h-[190px] md:h-[320px]"
        style={{ backgroundColor: COLORS.bgAlt }}
      />
    </section>
  );
}

function LandingHero({ onStart, onSeeSample, t }) {
  return (
    // El logo ya está en la barra fija justo encima; repetirlo aquí a 144 px
    // de alto empujaba el titular fuera de la primera pantalla en móvil.
    // Antes pt-24 pb-28: casi 100 px de aire por arriba y 112 por abajo, que
    // en un móvil es media pantalla vacía antes de leer nada.
    <section className="max-w-3xl mx-auto px-6 pt-10 pb-12 md:pt-14 md:pb-14 text-center">
      <h1 className="font-display t-hero font-medium mb-5 max-w-2xl mx-auto" style={{ color: COLORS.text }}>
        {t.heroTitle}
      </h1>
      <p className="font-body t-lead max-w-xl mx-auto mb-7" style={{ color: COLORS.subtext }}>
        {t.heroSubtitle}
      </p>
      <button
        onClick={onStart}
        className="tap-scale font-body font-medium t-body rounded-xl px-8 py-4"
        style={{ backgroundColor: COLORS.bulb, color: COLORS.bulbInk }}
      >
        {t.heroCta}
      </button>
      <p className="font-body t-caption mt-3" style={{ color: COLORS.subtext }}>
        {t.heroTrust}
      </p>
      {/* El único sitio de la portada donde se enseña el informe. Aquí es donde
          alguien decide si le dedica cinco minutos o se va, y la pregunta que
          tiene en la cabeza es "¿qué me vais a dar?". */}
      <button
        onClick={onSeeSample}
        className="tap-scale mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-3 font-body t-small font-medium transition-all duration-200"
        style={{ color: COLORS.text, backgroundColor: COLORS.bgAlt, border: `1px solid ${COLORS.border}` }}
      >
        {t.sampleLink}
        <ChevronRight size={14} color={COLORS.text} />
      </button>
      {t.langNotice && (
        <p className="font-body t-caption mt-5 max-w-sm mx-auto rounded-lg px-4 py-3" style={{ color: COLORS.text, backgroundColor: COLORS.bgAlt }}>
          {t.langNotice}
        </p>
      )}
    </section>
  );
}

function HowItWorksSection({ t }) {
  return (
    <section className="max-w-3xl mx-auto px-6 py-10 md:py-14">
      <Reveal>
        <h2 className="font-display t-display font-medium text-center mb-3" style={{ color: COLORS.text }}>{t.howTitle}</h2>
        <p className="font-body t-body text-center mb-10 max-w-md mx-auto" style={{ color: COLORS.subtext }}>{t.howSubtitle}</p>
      </Reveal>
      <div className="grid md:grid-cols-3 gap-5">
        {t.steps.map((s, i) => (
          <Reveal key={s.n} delay={i * 120}>
            <div
              className="rounded-xl p-6 transition-all duration-300"
              style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}
            >
              <p className="font-display t-title mb-3" style={{ color: COLORS.subtext }}>{s.n}</p>
              <p className="font-body t-body font-medium mb-2" style={{ color: COLORS.text }}>{s.title}</p>
              <p className="font-body t-small" style={{ color: COLORS.subtext }}>{s.text}</p>
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
      <p className="font-body t-body font-medium" style={{ color: COLORS.text }}>{label}</p>
      <Check size={15} color={COLORS.success} strokeWidth={2.5} className="shrink-0" />
    </div>
  );
}

function ProductShowcaseSection({ t }) {
  return (
    <section className="max-w-3xl mx-auto px-6 py-10 md:py-14">
      <Reveal>
        <h2 className="font-display t-display font-medium text-center mb-3" style={{ color: COLORS.text }}>{t.showcaseTitle}</h2>
        <p className="font-body t-small tracking-wide text-center mb-6" style={{ color: COLORS.accent }}>
          {t.showcasePreviewLabel}
        </p>
      </Reveal>
      <Reveal delay={150}>
        <div className="rounded-xl p-6 transition-all duration-300" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
          <div className="flex items-center gap-3 mb-2">
            <Sofa size={22} color={COLORS.subtext} strokeWidth={1.5} />
            <div>
              <p className="font-body t-body font-medium" style={{ color: COLORS.text }}>{t.showcaseExampleLabel}</p>
              <p className="font-body t-caption" style={{ color: COLORS.subtext }}>{t.showcaseSubLabel}</p>
            </div>
          </div>
          <div>
            {t.showcaseItems.map((label, i) => <PreviewRow key={i} label={label} />)}
          </div>
        </div>
      </Reveal>
      <p className="font-body t-caption text-center mt-5" style={{ color: COLORS.subtext }}>
        {t.showcaseFooter}
      </p>
    </section>
  );
}

function CredentialSection({ t }) {
  return (
    <section className="max-w-3xl mx-auto px-6 py-10 md:py-14 text-center">
      <Reveal>
        <div className="w-10 h-px mx-auto mb-8" style={{ backgroundColor: COLORS.subtext }} />
        <p className="font-display t-title font-medium mb-3" style={{ color: COLORS.text }}>{t.credentialTitle}</p>
        <p className="font-body t-body" style={{ color: COLORS.subtext }}>
          {t.credentialText}
        </p>
      </Reveal>
    </section>
  );
}

function AccessSection({ onStart, t }) {
  return (
    <section className="max-w-3xl mx-auto px-6 py-10 md:py-14 text-center">
      <Reveal>
      <div className="rounded-xl p-8 transition-all duration-300" style={{ backgroundColor: COLORS.bgAlt, border: `1px solid ${COLORS.border}` }}>
        <p className="font-body t-eyebrow mb-3" style={{ color: COLORS.primary }}>{t.accessLabel}</p>
        <p className="font-display t-title font-medium mb-3" style={{ color: COLORS.text }}>{t.accessTitle}</p>
        <p className="font-body t-body mb-6" style={{ color: COLORS.subtext }}>
          {t.accessText}
        </p>
        <button
          onClick={onStart}
          className="tap-scale font-body font-medium t-body rounded-xl px-6 py-3.5 transition-all duration-200"
          style={{ background: COLORS.bulb, color: COLORS.bulbInk }}
        >
          {t.accessCta}
        </button>
      </div>
      </Reveal>
    </section>
  );
}

// Antes era una tarjeta de Etsy con rótulo, recuadro, icono, titular,
// descripción y botón, y ocupaba una sección entera de la portada.
// Ahora esta línea es de Instagram: seguir es gratis y sin fricción, así que
// es la salida que tiene sentido ofrecer a quien todavía no ha probado nada.
// La tienda vive donde convierte — dentro del informe, cuando ya has recibido
// algo — y en la portada baja al footer para no competir con esta línea.
function LandingInstagramSection({ t }) {
  return (
    <section className="max-w-3xl mx-auto px-6 pb-6">
      <Reveal>
        <a
          href="https://www.instagram.com/nemul.app/"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => { track("instagram_click", { desde: "landing" }); gaEvent("instagram_click", { desde: "landing" }); }}
          className="tap-scale w-full flex items-center justify-center gap-2 py-4 font-body t-small font-medium flex-wrap"
          style={{ color: COLORS.text, borderTop: `1px solid ${COLORS.text}`, borderBottom: `1px solid ${COLORS.text}` }}
        >
          <InstagramGlyph />
          {t.instagramLine}
          <span style={{ color: COLORS.subtext }}>{t.instagramHandle}</span>
          <ChevronRight size={14} color={COLORS.text} />
        </a>
      </Reveal>
    </section>
  );
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="tap-scale rounded-xl overflow-hidden transition-all duration-200" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left">
        <span className="font-body t-body font-medium" style={{ color: COLORS.text }}>{q}</span>
        <ChevronDown size={16} color={COLORS.subtext} style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }} />
      </button>
      {open && (
        <div className="px-5 pb-4 option-in">
          <p className="font-body t-small" style={{ color: COLORS.subtext }}>{a}</p>
        </div>
      )}
    </div>
  );
}

function FAQSection({ t }) {
  return (
    <section id="faq" className="max-w-3xl mx-auto px-6 py-10 md:py-14">
      <Reveal><h2 className="font-display t-display font-medium text-center mb-8" style={{ color: COLORS.text }}>{t.faqTitle}</h2></Reveal>
      <div className="flex flex-col gap-3">
        {t.faqs.map((f, i) => (
          <Reveal key={i} delay={i * 50}>
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
      <div className="max-w-3xl mx-auto px-6 py-10 text-center">
        <p className="font-body t-caption mb-5" style={{ color: COLORS.subtext }}>
          {t.footerLegal}
        </p>
        <div className="flex items-center justify-center gap-5 mb-5 flex-wrap">
          <a href="#faq" className="font-body t-small font-medium" style={{ color: COLORS.text }}>{t.footerFaqLink}</a>
          <a
            href="https://www.etsy.com/es/listing/4427720777/guia-de-iluminacion-del-hogar-consejos?ref=share_ios_native_control"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => { track("etsy_click", { desde: "footer" }); gaEvent("etsy_click", { desde: "footer" }); }}
            className="font-body t-small font-medium"
            style={{ color: COLORS.text }}
          >
            {t.footerShop}
          </a>
          <a href="mailto:digitaldma2026@gmail.com" className="font-body t-small font-medium" style={{ color: COLORS.text }}>{t.footerContact}</a>
          <button onClick={() => setShowPrivacy((s) => !s)} className="font-body t-small font-medium" style={{ color: COLORS.text }}>{t.footerPrivacy}</button>
        </div>
        {showPrivacy && (
          <div className="rounded-xl p-6 text-left mb-5 flex flex-col gap-4" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
            <div>
              <p className="font-body t-small font-medium mb-1.5" style={{ color: COLORS.text }}>{p.dataTitle}</p>
              <p className="font-body t-caption" style={{ color: COLORS.subtext }}>{p.dataText}</p>
            </div>
            <div>
              <p className="font-body t-small font-medium mb-1.5" style={{ color: COLORS.text }}>{p.useTitle}</p>
              <p className="font-body t-caption" style={{ color: COLORS.subtext }}>{p.useText}</p>
            </div>
            <div>
              <p className="font-body t-small font-medium mb-1.5" style={{ color: COLORS.text }}>{p.whereTitle}</p>
              <p className="font-body t-caption" style={{ color: COLORS.subtext }}>{p.whereText}</p>
            </div>
            <div>
              <p className="font-body t-small font-medium mb-1.5" style={{ color: COLORS.text }}>{p.localTitle}</p>
              <p className="font-body t-caption" style={{ color: COLORS.subtext }}>{p.localText}</p>
            </div>
            <div>
              <p className="font-body t-small font-medium mb-1.5" style={{ color: COLORS.text }}>{p.cookiesTitle}</p>
              <p className="font-body t-caption" style={{ color: COLORS.subtext }}>{p.cookiesText}</p>
            </div>
            <div>
              <p className="font-body t-small font-medium mb-1.5" style={{ color: COLORS.text }}>{p.rightsTitle}</p>
              <p className="font-body t-caption" style={{ color: COLORS.subtext }}>
                {p.rightsTextPrefix}<a href="mailto:digitaldma2026@gmail.com" style={{ color: COLORS.accent }}>digitaldma2026@gmail.com</a>.
              </p>
            </div>
            <div>
              <p className="font-body t-small font-medium mb-1.5" style={{ color: COLORS.text }}>{p.changesTitle}</p>
              <p className="font-body t-caption" style={{ color: COLORS.subtext }}>{p.changesText}</p>
            </div>
          </div>
        )}
        <p className="font-body t-caption" style={{ color: COLORS.subtext }}>© {new Date().getFullYear()} Nemul</p>
      </div>
    </footer>
  );
}

function LandingPage({ onStart, onSeeSample }) {
  const [lang, setLang] = useState("es");
  const t = LANDING_COPY[lang];

  // El <html lang="..."> estaba fijo en "es" aunque la página tuviera
  // selector ES/EN, lo que confunde a lectores de pantalla y a Google.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: COLORS.bg }}>
      <style>{FONT_STYLE}</style>
      <LandingNav onStart={onStart} lang={lang} setLang={setLang} t={t} />
      <LandingBanner t={t} />
      <LandingHero onStart={onStart} onSeeSample={onSeeSample} t={t} />
      <HowItWorksSection t={t} />
      <ProductShowcaseSection t={t} />
      <CredentialSection t={t} />
      <AccessSection onStart={onStart} t={t} />
      <LandingInstagramSection t={t} />
      <FAQSection t={t} />
      <LandingFooter t={t} />
    </div>
  );
}


export default function NemulApp() {
  // nemul.app/?ejemplo abre el informe de ejemplo directamente, sin pasar por
  // la portada. Sirve para enlazarlo desde fuera —la bio de Instagram, un
  // mensaje— y para comprobar que la pantalla funciona sin depender de que el
  // botón responda.
  const [screen, setScreen] = useState(() => {
    try {
      if (new URLSearchParams(window.location.search).has("ejemplo")) return "sample";
    } catch (e) {
      // si no hay window (o la URL es rara), se entra por la portada
    }
    return "landing";
  });

  // Desde dónde se abrió el ejemplo, para que "Volver" devuelva ahí y no a una
  // pantalla por la que esa persona no ha pasado. Por defecto la portada: es
  // donde cae quien entra directo por nemul.app/?ejemplo.
  const [sampleFrom, setSampleFrom] = useState("landing");
  const openSample = (desde) => {
    track("sample_report_click", { desde });
    gaEvent("sample_report_click", { desde });
    setSampleFrom(desde);
    setScreen("sample");
  };
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

  const setAnswer = (optionId, dimValue) => {
    if (!currentRoom || !currentStep) return;
    setAnswersByRoom((prev) => {
      const roomAnswers = prev[currentRoom.id] || {};
      let value;
      if (currentStep.type === "dims") {
        // Aquí `optionId` es el campo ("length" o "width") y `dimValue` lo
        // tecleado. Se guarda tal cual, sin parsear: si no, no se puede
        // escribir "4," porque el punto intermedio desaparecería al teclear.
        value = { ...(roomAnswers[currentStep.key] || {}), [optionId]: dimValue };
      } else if (currentStep.type === "multi") {
        const arr = roomAnswers[currentStep.key] || [];
        // "Ninguna de estas" no convive con las demás: marcarla las apaga, y
        // marcar cualquier otra la apaga a ella. Sin esto se podía responder
        // "Leo en la cama" y "Ninguna de estas" a la vez.
        const exclusiveIds = currentStep.options.filter((o) => o.exclusive).map((o) => o.id);
        if (exclusiveIds.includes(optionId)) {
          value = arr.includes(optionId) ? [] : [optionId];
        } else {
          const next = arr.includes(optionId) ? arr.filter((x) => x !== optionId) : [...arr, optionId];
          value = next.filter((x) => !exclusiveIds.includes(x));
        }
      } else {
        value = optionId;
      }
      return { ...prev, [currentRoom.id]: { ...roomAnswers, [currentStep.key]: value } };
    });
  };

  // Casilla opcional de la pregunta actual (techo alto, varias zonas...).
  const toggleExtraAnswer = () => {
    if (!currentRoom || !currentStep?.extra) return;
    setAnswersByRoom((prev) => {
      const roomAnswers = prev[currentRoom.id] || {};
      const key = currentStep.extra.key;
      return { ...prev, [currentRoom.id]: { ...roomAnswers, [key]: !roomAnswers[key] } };
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
    return (
      <LandingPage
        onStart={() => { track("landing_cta_click"); gaEvent("landing_cta_click"); setScreen("welcome"); }}
        onSeeSample={() => { openSample("landing"); }}
      />
    );
  }

  return (
    // Antes: un marco de iPhone falso de 375×780 px fijos, con borde negro de
    // 8 px. En un móvil real el contenido se comprimía y se cortaba por abajo,
    // y en escritorio parecía un mockup, no un producto. Ahora es un contenedor
    // real: pantalla completa en móvil, columna acotada y centrada en escritorio.
    <div className="w-full flex justify-center" style={{ height: "100dvh", backgroundColor: COLORS.bg }}>
      <style>{FONT_STYLE}</style>
      <div className="relative w-full max-w-[560px] h-full" style={{ backgroundColor: COLORS.bg }}>
        <div className="h-full">
          {screen === "welcome" && (
            <WelcomeScreen
              onStart={() => setScreen("rooms")}
              onSeeSample={() => { openSample("welcome"); }}
            />
          )}
          {screen === "sample" && (
            <SampleReportScreen onBack={() => setScreen(sampleFrom)} onStart={() => setScreen("rooms")} />
          )}
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
            <QuestionScreen step={currentStep} value={currentValue} onSelect={setAnswer} onBack={handleBack} onContinue={handleContinue} stepIndex={stepIndex} total={currentFlow.length} eyebrow={roomEyebrow} extraValue={currentStep.extra ? currentAnswers[currentStep.extra.key] : undefined} onToggleExtra={toggleExtraAnswer} />
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
      </div>
    </div>
  );
}
