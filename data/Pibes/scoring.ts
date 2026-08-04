import { type OperatorProfile, type PibeProfile, type ScoreBreakdown, type ScoreExplanation, type MapPerformanceEntry } from "./types";
import { type TacticalNeedId, NEED_OPERATORS_MAP, TACTICAL_NEED_LABELS } from "../siteTactics";
import { getSiteStrategy } from "../mapStrategies";

const MAP_MODIFIERS: Record<string, number> = {
  elite: 12,
  strong: 7,
  stable: 3,
  neutral: 0,
  weak: -7,
  critical: -12,
  "frag-heavy": 0,
};

const CONFIDENCE_MULTIPLIERS = {
  high: 1,
  medium: 0.7,
  low: 0.4,
};

export function normalizeMapId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getFactosMapPerformance(
  pibe: PibeProfile,
  matchMap: string,
  side: "attack" | "defense"
): MapPerformanceEntry | undefined {
  const mapId = normalizeMapId(matchMap);
  return pibe.mapPerformance[side]?.[mapId];
}

function getMapStatForPick(playerId: string, side: string, opName: string, mapName?: string) {
  if (!mapName) return null;
  const targetKey = normalizeMapId(mapName);

  const matchMap = (m: any) => {
    if (!m) return false;
    const nameCandidate = (m.displayName || m.trackerName || m.mapName || "").toLowerCase();
    const idCandidate = (m.mapId || "").toLowerCase();
    const keyCandidate = normalizeMapId(nameCandidate);
    return (
      nameCandidate === mapName.toLowerCase() ||
      idCandidate === targetKey ||
      keyCandidate === targetKey
    );
  };
  
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("r6_tracker_map_stats_v1");
      if (stored) {
        const parsed = JSON.parse(stored);
        const key = `${playerId}_${side}_${opName.toLowerCase().replace(/\s+/g, "_")}`;
        const entry = parsed[key];
        if (entry && entry.maps) {
          const mapStat = entry.maps.find(matchMap);
          if (mapStat) return mapStat;
        }
      }
    } catch (e) {
      console.error("Error leyendo LocalStorage:", e);
    }
  }
  return null;
}

export function scoreAndExplainPick(
  op: OperatorProfile,
  pibe: PibeProfile,
  siteReqs: string[],
  squadOpsSoFar: OperatorProfile[],
  squadRolesSoFar: Set<string>,
  matchMap?: string,
  tacticalNeeds?: TacticalNeedId[],
  observedDefenseCounters?: string[],
  currentDraftPosition?: number,
  currentSiteName?: string
): { score: number; explanation: ScoreExplanation; trackerHighlight?: string; scoreBreakdown: ScoreBreakdown } {
  
  const breakdown: ScoreBreakdown = {
    operatorComfort: 20, // base constant
    roleAffinity: 0,
    compositionNeed: 0,
    trackerMapPerformance: 0,
    factosMapContext: 0,
    activeSupportTransition: 0,
    pickOrderContext: 0,
    avoidPatternPenalty: 0,
    penalties: 0,
  };

  const positive: string[] = [];
  const negative: string[] = [];
  const warnings: string[] = [];
  let trackerHighlight: string | undefined = undefined;
  
  const isAttack = op.side === "attack";
  const sideKey = isAttack ? "attack" : "defense";

  // 1. Role Affinity
  const weightedRoleScores = op.roles.map((role) => {
    const affinityEntry = pibe.roleAffinity[role];
    const affinityScore = affinityEntry?.score ?? 0.5;
    const confMult = CONFIDENCE_MULTIPLIERS[affinityEntry?.confidence ?? "low"] ?? 0.4;
    return affinityScore * confMult * 20; // Scale it
  });

  if (weightedRoleScores.length > 0) {
    const bestRoleScore = Math.max(...weightedRoleScores);
    const averageRoleScore = weightedRoleScores.reduce((sum, val) => sum + val, 0) / weightedRoleScores.length;
    breakdown.roleAffinity = Math.round(bestRoleScore * 0.7 + averageRoleScore * 0.3);
    positive.push(`+${breakdown.roleAffinity} afinidad ajustada con roles de ${op.name}`);
  } else {
    breakdown.roleAffinity = Math.round(0.5 * CONFIDENCE_MULTIPLIERS.low * 20);
  }

  // 2. Tracker Map Performance
  const trackerMapStat = getMapStatForPick(pibe.id, op.side, op.name, matchMap);
  const matches = trackerMapStat?.matchesOrRounds || 0;
  const trackerDataUsed = matches >= 5;

  if (trackerDataUsed && matchMap) {
    if (trackerMapStat.winRate >= 50) {
      const bonus = Math.min(30, Math.round((trackerMapStat.winRate - 45) * 1.5));
      breakdown.trackerMapPerformance += bonus;
      positive.push(`🔥 TRACKER (${matches} rondas): ${trackerMapStat.winRate}% WR en ${matchMap}`);
    } else if (trackerMapStat.winRate < 45) {
      const penalty = Math.min(20, Math.round((50 - trackerMapStat.winRate) * 1.5));
      breakdown.trackerMapPerformance -= penalty;
      negative.push(`⚠️ TRACKER (${matches} rondas): Winrate bajo del ${trackerMapStat.winRate}% en ${matchMap}`);
    }

    // Impacto de K/D del Tracker
    if (trackerMapStat.kd >= 1.2) {
      const kdBonus = Math.min(15, Math.round((trackerMapStat.kd - 1.0) * 12));
      breakdown.trackerMapPerformance += kdBonus;
      positive.push(`🎯 HIGH K/D (${trackerMapStat.kd.toFixed(2)}): Excelente letalidad con ${op.name} en ${matchMap}`);
    } else if (trackerMapStat.kd < 0.8 && matches >= 5) {
      breakdown.trackerMapPerformance -= 10;
      negative.push(`⚠️ LOW K/D (${trackerMapStat.kd.toFixed(2)}): Dificultad para convertir frags con ${op.name}`);
    }

    trackerHighlight = `${trackerMapStat.winRate}% WR · ${trackerMapStat.kd.toFixed(2)} KD (${matches} rondas)`;
  } else if (trackerMapStat && matches > 0 && matches < 5) {
    trackerHighlight = `Muestra insuficiente (<5 partidas)`;
  }

  // 2b. Bonus por Coincidencia con Roles Secundarios del Pibe
  const secRoles = pibe.identity.secondaryRoles || [];
  const matchesSecRole = op.roles.some((r) => secRoles.includes(r));
  if (matchesSecRole) {
    breakdown.roleAffinity += 10;
    positive.push(`🔄 ROL SECUNDARIO: Encaja con la versatilidad de ${pibe.displayName}`);
  }

  // 3. FACTOS Qualitative Map Performance
  if (matchMap) {
    const factosMap = getFactosMapPerformance(pibe, matchMap, sideKey);
    if (factosMap) {
      const classModifier = MAP_MODIFIERS[factosMap.classification] ?? 0;
      const confMult = CONFIDENCE_MULTIPLIERS[factosMap.confidence] ?? 0.4;
      let factosScore = classModifier * confMult;

      switch (factosMap.source) {
        case "tracker-derived":
          factosScore *= trackerDataUsed ? 0.5 : 1;
          break;
        case "mixed":
          factosScore *= trackerDataUsed ? 0.75 : 1;
          break;
        case "tactical-analysis":
        case "manual":
          break;
      }
      
      breakdown.factosMapContext = Math.round(factosScore);
      
      if (factosScore > 0) positive.push(`+${breakdown.factosMapContext} contexto mapa FACTOS (${factosMap.classification})`);
      if (factosScore < 0) negative.push(`${breakdown.factosMapContext} contexto mapa FACTOS (${factosMap.classification})`);

      if (factosMap.classification === "frag-heavy") {
        warnings.push("Buen potencial de bajas en este mapa, pero la conversión a victorias no es consistente.");
      }
      if (factosMap.tacticalNote) {
        positive.push(`Nota Táctica: ${factosMap.tacticalNote}`);
      }
    }

    // 3b. V2 Map Strategy (map_strategies_corrected.json) Context
    if (currentSiteName) {
      const siteStrat = getSiteStrategy(matchMap, op.side, currentSiteName);
      if (siteStrat) {
        const pibeAsgn = siteStrat.pibeAssignments.find((a) => a.pibeId === pibe.id);
        if (pibeAsgn && pibeAsgn.recommendedOps) {
          const preferred = pibeAsgn.recommendedOps.preferred || [];
          const conditional = pibeAsgn.recommendedOps.conditional || [];
          const avoid = pibeAsgn.recommendedOps.avoidForSite || [];
          const opLower = op.name.toLowerCase();

          if (preferred.some((o) => o.toLowerCase() === opLower)) {
            breakdown.factosMapContext += 25;
            positive.push(`🎯 ESTRATEGIA DE MAPA: Pick prioritario para ${siteStrat.playTitle}`);
          } else if (conditional.some((o) => o.toLowerCase() === opLower)) {
            breakdown.factosMapContext += 12;
            positive.push(`🗺️ ESTRATEGIA DE MAPA: Pick condicional para ${siteStrat.playTitle}`);
          }

          if (avoid.some((o) => o.toLowerCase() === opLower)) {
            breakdown.avoidPatternPenalty -= 35;
            negative.push(`⚠️ ESTRATEGIA DE MAPA: Evitar ${op.name} en ${siteStrat.siteName} (${siteStrat.playTitle})`);
          }
        }
      }
    }
  }

  // 4. Site Specific Reqs and Composition Need
  if (tacticalNeeds && tacticalNeeds.length > 0) {
    for (const needId of tacticalNeeds) {
      const opsForNeed = NEED_OPERATORS_MAP[needId] || [];
      if (opsForNeed.includes(op.name)) {
        breakdown.compositionNeed += 15;
        const needLabel = TACTICAL_NEED_LABELS[needId] || needId;
        positive.push(`🎯 Cubre necesidad táctica de sitio: ${needLabel}`);
      }
    }
  }

  if (observedDefenseCounters && observedDefenseCounters.includes(op.name)) {
    breakdown.compositionNeed += 20;
    positive.push(`⚡ Contra directa para defensa observada del rival`);
  }

  const coversSiteReq = op.roles.find((r) => siteReqs.includes(r) && !squadRolesSoFar.has(r));
  if (coversSiteReq) {
    breakdown.compositionNeed += 12;
    positive.push(`+12 cubre necesidad estructural de sitio`);
  }

  // 5. Active Support Transition
  const activeSupport = pibe.activeSupport[sideKey];
  if (activeSupport) {
    const missingRequiredFunctions = activeSupport.requiredFunctions.filter((fn) => !squadRolesSoFar.has(fn));
    const coversMissingRequirement = op.roles.some((role) => missingRequiredFunctions.includes(role));
    const enablesTransition = op.roles.some((role) => activeSupport.preferredTransitions.includes(role));

    if (coversMissingRequirement) {
      breakdown.compositionNeed += 10;
      positive.push(`+10 asume función obligatoria del equipo`);
    }

    if (coversMissingRequirement && enablesTransition) {
      breakdown.activeSupportTransition += 6;
      positive.push(`+6 soporte activo (cubre necesidad y habilita transición)`);
    } else if (!coversMissingRequirement && enablesTransition) {
      breakdown.activeSupportTransition += 3;
      positive.push(`+3 transición de soporte libre (necesidad ya cubierta)`);
    }
    
    // Penalizar duplicación
    if (!coversMissingRequirement && op.roles.some((role) => activeSupport.requiredFunctions.includes(role))) {
      breakdown.penalties -= 4;
      negative.push(`-4 asumiendo función obligatoria que el equipo ya cubrió (mejor usar soporte activo libre)`);
    }

    // Avoid patterns (different from negative comfort)
    if (op.roles.some(r => activeSupport.avoidPatterns.includes(r))) {
      breakdown.avoidPatternPenalty -= 8;
      negative.push(`-8 patrón desaconsejado: transición ineficiente o aislamiento`);
    }
  }

  // 6. Draft Context (Pick Order)
  const guideline = pibe.pickOrder[sideKey];
  if (guideline && currentDraftPosition !== undefined) {
    const hasOpenResponsibilities = activeSupport?.requiredFunctions.some(fn => !squadRolesSoFar.has(fn));
    if (guideline.flexible && currentDraftPosition === guideline.preferredPosition && hasOpenResponsibilities) {
      breakdown.pickOrderContext += 2;
      positive.push(`+2 orden recomendado de selección (responsabilidades abiertas)`);
    }
  }

  // 7. Comfort / Avoid
  if (pibe.comfortOperators.includes(op.name)) {
    breakdown.operatorComfort += 5;
    positive.push(`+5 operador de confort`);
  }
  if (pibe.identityOperators.includes(op.name)) {
    breakdown.operatorComfort += 10;
    positive.push(`+10 operador de identidad/main`);
  }
  if (pibe.avoidOperators.includes(op.name)) {
    breakdown.penalties -= 12;
    negative.push(`-12 operador desaconsejado para ${pibe.displayName}`);
  }

  // Sum everything
  const finalScore = Object.values(breakdown).reduce((total, value) => total + value, 0);

  return {
    score: Math.max(0, Math.min(100, finalScore)),
    scoreBreakdown: breakdown,
    explanation: {
      positive,
      negative,
      warnings,
    },
    trackerHighlight
  };
}
