import { type OperatorProfile, type PibeProfile, type ScoreBreakdown, type ScoreExplanation, type MapPerformanceEntry } from "./types";
import { type TacticalNeedId, NEED_OPERATORS_MAP, TACTICAL_NEED_LABELS } from "../siteTactics";
import { getSiteStrategy } from "../mapStrategies";
import { getOperatorPlayerStat } from "../operatorPlayerStats";

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

  // 2. Global & Map R6 Tracker Operator Performance
  const globalStat = getOperatorPlayerStat(pibe.id, op.name);
  const trackerDataUsed = Boolean(globalStat && globalStat.matches >= 5);
  if (globalStat) {
    // 2a. Volumen de Experiencia Real (Partidas jugadas en Tracker)
    if (globalStat.matches >= 150) {
      breakdown.trackerMapPerformance += 25;
      positive.push(`🔥 R6 TRACKER EXPERIENCIA: Dominio de ${op.name} (${globalStat.matches} partidas jugadas)`);
    } else if (globalStat.matches >= 80) {
      breakdown.trackerMapPerformance += 18;
      positive.push(`🔥 R6 TRACKER EXPERIENCIA: Gran rodaje con ${op.name} (${globalStat.matches} partidas)`);
    } else if (globalStat.matches >= 30) {
      breakdown.trackerMapPerformance += 12;
      positive.push(`📊 R6 TRACKER EXPERIENCIA: Experiencia sólida con ${op.name} (${globalStat.matches} partidas)`);
    } else if (globalStat.matches >= 10) {
      breakdown.trackerMapPerformance += 6;
      positive.push(`📊 R6 TRACKER EXPERIENCIA: Muestra base con ${op.name} (${globalStat.matches} partidas)`);
    } else if (globalStat.matches === 0) {
      breakdown.penalties -= 40;
      negative.push(`⚠️ FACTO R6 TRACKER: 0 partidas jugadas con ${op.name} por ${pibe.displayName}`);
    }

    // 2b. Winrate Global del Tracker
    if (globalStat.matches >= 10) {
      if (globalStat.winRate >= 55) {
        const wrBonus = Math.min(25, Math.round((globalStat.winRate - 50) * 2));
        breakdown.trackerMapPerformance += wrBonus;
        positive.push(`🏆 R6 TRACKER WINRATE: ${globalStat.winRate}% WR en ${globalStat.matches} partidas`);
      } else if (globalStat.winRate < 42) {
        const wrPenalty = Math.min(20, Math.round((50 - globalStat.winRate) * 1.5));
        breakdown.trackerMapPerformance -= wrPenalty;
        negative.push(`⚠️ R6 TRACKER WINRATE: Rendimiento bajo del ${globalStat.winRate}% WR`);
      }
    }

    // 2c. K/D Global del Tracker
    if (globalStat.matches >= 15) {
      if (globalStat.kd >= 1.20) {
        breakdown.trackerMapPerformance += 10;
        positive.push(`🎯 R6 TRACKER K/D (${globalStat.kd.toFixed(2)}): Alta letalidad comprobada`);
      } else if (globalStat.kd < 0.70) {
        breakdown.trackerMapPerformance -= 8;
        negative.push(`⚠️ R6 TRACKER K/D (${globalStat.kd.toFixed(2)}): Conversión baja de frags`);
      }
    }

    trackerHighlight = `${globalStat.winRate}% WR · ${globalStat.kd.toFixed(2)} KD (${globalStat.matches} partidas)`;
  }

  // 2d. Rendimiento Específico por Mapa si está disponible
  const trackerMapStat = getMapStatForPick(pibe.id, op.side, op.name, matchMap);
  const matchesOnMap = trackerMapStat?.matchesOrRounds || 0;
  if (matchesOnMap >= 5 && matchMap) {
    if (trackerMapStat.winRate >= 50) {
      const bonus = Math.min(15, Math.round((trackerMapStat.winRate - 45) * 1.0));
      breakdown.trackerMapPerformance += bonus;
      positive.push(`🔥 MAPA (${matchesOnMap} rondas): ${trackerMapStat.winRate}% WR en ${matchMap}`);
    } else if (trackerMapStat.winRate < 45) {
      const penalty = Math.min(15, Math.round((50 - trackerMapStat.winRate) * 1.0));
      breakdown.trackerMapPerformance -= penalty;
      negative.push(`⚠️ MAPA (${matchesOnMap} rondas): Winrate bajo en ${matchMap}`);
    }
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

      const trackerMapDataUsed = Boolean(trackerMapStat && matchesOnMap >= 5);
      switch (factosMap.source) {
        case "tracker-derived":
          factosScore *= trackerMapDataUsed ? 0.5 : 1;
          break;
        case "mixed":
          factosScore *= trackerMapDataUsed ? 0.75 : 1;
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

  // 7. Comfort / Avoid / Known Pool
  const mains = isAttack ? pibe.attackMains : pibe.defenseMains;
  const tryouts = (isAttack ? pibe.tryoutAttack : pibe.tryoutDefense).map((t) => t.operatorId);
  const hasKnownPool = mains.length > 0 || tryouts.length > 0 || (pibe.comfortOperators?.length ?? 0) > 0 || (pibe.identityOperators?.length ?? 0) > 0;
  const isKnown =
    !hasKnownPool ||
    pibe.comfortOperators.includes(op.name) ||
    pibe.identityOperators.includes(op.name) ||
    mains.includes(op.name) ||
    tryouts.includes(op.name);

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
  if (!isKnown) {
    breakdown.penalties -= 50;
    negative.push(`⚠️ -50 operador sin experiencia previa de ${pibe.displayName}`);
  }

  // 8. Subrole Alignment & Facto Roles (from op.md & op+.md)
  const opNameLower = op.name.toLowerCase();
  if (pibe.id === "el_notorious" || pibe.identity?.primaryRoles?.includes("flex")) {
    if (opNameLower === "kaid") {
      breakdown.operatorComfort += 22;
      positive.push(`🔥 FACTO: Kaid main real y firma defensiva de Notorious (408 partidas, 53.4% WR)`);
    } else if (["thermite", "kali"].includes(opNameLower)) {
      breakdown.operatorComfort += 20;
      positive.push(`🔥 FACTO: Notorious breacher / sniper de apertura (${op.name})`);
    } else if (["grim", "iana", "ram", "zofia", "zero", "brava", "flores"].includes(opNameLower) && siteReqs.includes("anti-gadget")) {
      breakdown.operatorComfort += 16;
      positive.push(`⚡ FACTO: Notorious Flex multifunción con EMP secundario (${op.name})`);
    } else if (op.roles.includes("hard-breach")) {
      breakdown.operatorComfort += 14;
      positive.push(`🔥 FACTO: Notorious breacher activo flex (${op.name}) - 2/5 apertura de brecha`);
    } else if (op.roles.some((r) => ["entry-frag", "intel", "soft-breach", "anti-gadget"].includes(r))) {
      breakdown.operatorComfort += 12;
      positive.push(`⚡ FACTO: Notorious fragger / entry liberado para ganar espacio (${op.name})`);
    }
  }

  if (pibe.id === "chango_nocturno" || pibe.identity?.primaryRoles?.includes("hard-support")) {
    if (["thermite", "ace"].includes(opNameLower)) {
      breakdown.operatorComfort += 20;
      positive.push(`🔥 FACTO: Chango hard breacher de preferencia (${op.name}) - 3/5 brecha dura principal`);
    } else if (["thorn", "kapkan"].includes(opNameLower)) {
      breakdown.operatorComfort += 20;
      positive.push(`🛡️ FACTO: Chango especialista en trampas y control de flancos (${op.name}) (316+ partidas, 56%+ WR)`);
    } else if (op.roles.some((r) => ["anti-gadget", "zone-control", "trap-setter", "access-denial", "intel-def"].includes(r))) {
      breakdown.operatorComfort += 15;
      positive.push(`🛡️ FACTO: Chango soporte de estructura, trampas y control de flancos (${op.name})`);
    }
  }

  if (pibe.id === "azusa_cooper09" || pibe.identity?.primaryRoles?.includes("frontline-support")) {
    if (["thorn", "kapkan", "tachanka"].includes(opNameLower)) {
      breakdown.operatorComfort += 20;
      positive.push(`🛡️ FACTO: Azusa ancla de objetivo y trampas (${op.name}) (55%+ WR)`);
    } else if (op.roles.some((r) => ["zone-control", "support", "objective-anchor"].includes(r))) {
      breakdown.operatorComfort += 14;
      positive.push(`🛡️ FACTO: Azusa protección frontal y soporte de ejecución (${op.name})`);
    } else if (op.roles.includes("hard-breach")) {
      breakdown.operatorComfort += 12;
      positive.push(`🎯 FACTO: Azusa brecha dura de objetivo flex (${op.name}) - 1/5 soporte de brecha`);
    }
  }

  // 9. High Ban Risk Operators & Counter Dynamics
  const HIGH_BAN_RISK_OPS = new Set([
    "dokkaebi", "maestro", "vigil", "fenrir", "solis",
    "thatcher", "valkyrie", "jackal", "mira", "kaid"
  ]);

  const OP_HARD_COUNTERS: Record<string, string[]> = {
    dokkaebi: ["mute", "iq", "echo", "solis"],
    maestro: ["brava", "twitch", "sledge", "flores", "iana"],
    vigil: ["lion", "dokkaebi", "iq"],
    fenrir: ["twitch", "brava", "thatcher", "iq"],
    thatcher: ["kaid", "bandit", "tubarao"],
    mira: ["twitch", "hibana", "ace", "flores"],
    valkyrie: ["iq", "brava", "dokkaebi"],
    jackal: ["caveira", "solis", "mute"],
    kaid: ["thatcher", "kali", "flores", "twitch"],
    solis: ["iq", "dokkaebi", "jackal"],
  };

  if (HIGH_BAN_RISK_OPS.has(opNameLower)) {
    const hardCounters = OP_HARD_COUNTERS[opNameLower] || [];
    const isCounterObserved = observedDefenseCounters?.some((c) =>
      hardCounters.includes(c.toLowerCase().replace(/[^a-z0-9]/g, ""))
    );

    if (isCounterObserved) {
      breakdown.avoidPatternPenalty -= 30;
      negative.push(`⚠️ COUNTER ACTIVO RIVAL: Counter (${hardCounters.join("/")}) activo. Usar variante alternativa.`);
    }
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
