/**
 * mapStrategies.ts (Schema V2.0.0)
 * --------------------------------
 * Carga e integra las estrategias tácticas depuradas desde map_strategies_corrected.json.
 * Alimenta la sugerencia de picks del Picker (Active Match), el Catálogo de Mapas y Los Pibes.
 */

import mapStrategiesRaw from "./map_strategies_corrected.json";

export type RecommendedOpsConfig = {
  preferred: string[];
  conditional: string[];
  tryout: string[];
  avoidForSite: string[];
};

export type PibeAssignment = {
  pibeId: "el_notorious" | "chango_nocturno" | "azusa_cooper09";
  role: string;
  recommendedOps: RecommendedOpsConfig;
  taskDescription: string;
};

export type AntiGadgetPlan = {
  primary: string[];
  secondary: string[];
  requiredWhen: string;
};

export type DefuserPlan = {
  primaryCarrier: string;
  secondaryCarrier: string;
  avoidCarrier: string;
};

export type SiteStrategy = {
  id: string;
  siteName: string;
  floor?: string;
  playTitle: string;
  objective: string;
  keyFloors?: string[];
  keyWalls?: string[];
  keyAreas?: string[];
  requiredRoles: string[];
  antiGadgetPlan?: AntiGadgetPlan;
  pibeAssignments: PibeAssignment[];
  executionSteps?: string[];
  defuserPlan?: DefuserPlan;
  reinforcementPlan?: string[];
  rotations?: string[];
  fallbackPlan?: string;
  avoid?: string[];
  proTip?: string;
};

export type MapStrategyProfile = {
  mapName: string;
  siteAliases?: Record<string, string[]>;
  attackStrategies: SiteStrategy[];
  defenseStrategies: SiteStrategy[];
};

/** Normalizar cadenas para búsqueda flexible (remueve acentos, espacios y símbolos) */
function normalizeKey(str: string): string {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/** Mapeo de nombres de mapa estándar */
const MAP_NAME_ALIASES: Record<string, string> = {
  clubhouse: "Clubhouse",
  club: "Clubhouse",
  oregon: "Oregon",
  chalet: "Chalet",
  bank: "Bank",
  banco: "Bank",
  border: "Border",
  frontera: "Border",
  consulate: "Consulate",
  consulado: "Consulate",
  kafedostoyevsky: "Kafe Dostoyevsky",
  kafe: "Kafe Dostoyevsky",
  coastline: "Coastline",
  litoral: "Coastline",
  nighthavenlabs: "Nighthaven Labs",
  nighthaven: "Nighthaven Labs",
  outback: "Outback",
  skyscraper: "Skyscraper",
  rascacielos: "Skyscraper",
  themepark: "Theme Park",
  parquetematico: "Theme Park",
  villa: "Villa",
  emeraldplains: "Emerald Plains",
  emerald: "Emerald Plains",
};

export const MAP_STRATEGIES: Record<string, MapStrategyProfile> = (mapStrategiesRaw as any).maps;

/**
 * Obtener el perfil táctico completo de un mapa.
 */
export function getMapStrategies(mapName: string): MapStrategyProfile | undefined {
  if (!mapName) return undefined;
  const targetNorm = normalizeKey(mapName);
  const stdName = MAP_NAME_ALIASES[targetNorm] || mapName;

  const exactKey = Object.keys(MAP_STRATEGIES).find(
    (k) => normalizeKey(k) === normalizeKey(stdName)
  );

  return exactKey ? MAP_STRATEGIES[exactKey] : undefined;
}

/**
 * Buscar la jugada táctica recomendada para un mapa, bando y sitio de bomba específico.
 */
export function getSiteStrategy(
  mapName: string,
  side: "attack" | "defense",
  siteName?: string
): SiteStrategy | undefined {
  const profile = getMapStrategies(mapName);
  if (!profile) return undefined;

  const strategies = side === "attack" ? profile.attackStrategies : profile.defenseStrategies;
  if (!strategies || strategies.length === 0) return undefined;

  if (!siteName) return strategies[0];

  const siteNorm = normalizeKey(siteName);

  // 1. Coincidencia exacta
  let match = strategies.find((s) => normalizeKey(s.siteName) === siteNorm);
  if (match) return match;

  // 2. Coincidencia por Alias de sitio
  if (profile.siteAliases) {
    for (const [siteKey, aliases] of Object.entries(profile.siteAliases)) {
      const allNames = [siteKey, ...aliases].map(normalizeKey);
      if (allNames.some((a) => siteNorm.includes(a) || a.includes(siteNorm))) {
        const found = strategies.find((s) => normalizeKey(s.siteName) === normalizeKey(siteKey));
        if (found) return found;
      }
    }
  }

  // 3. Coincidencia por superposición de palabras clave
  match = strategies.find((s) => {
    const sNorm = normalizeKey(s.siteName);
    return siteNorm.includes(sNorm) || sNorm.includes(siteNorm);
  });
  if (match) return match;

  return strategies[0];
}

/**
 * Obtener la lista plana de operadores recomendados (preferidos + condicionales) para un pibe en un sitio.
 */
export function getRecommendedOpsForPibe(asgn: PibeAssignment): string[] {
  if (Array.isArray(asgn.recommendedOps)) {
    return asgn.recommendedOps;
  }
  const preferred = asgn.recommendedOps?.preferred || [];
  const conditional = asgn.recommendedOps?.conditional || [];
  const avoid = new Set((asgn.recommendedOps?.avoidForSite || []).map((o) => o.toLowerCase()));

  const combined = [...preferred, ...conditional];
  return Array.from(new Set(combined)).filter((op) => !avoid.has(op.toLowerCase()));
}
