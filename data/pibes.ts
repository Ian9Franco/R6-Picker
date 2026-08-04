/**
 * pibes.ts
 * --------
 * Motor Táctico Avanzado de Recomendación de Escuadrón.
 * Incluye:
 *   1. Normalización unificada de 77 operadores a OperatorProfile
 *   2. Generador pseudo-aleatorio determinista (Seeded PRNG) sin jitter de render
 *   3. Calibración de Confianza (high/medium/low + porcentaje + razones)
 *   4. Asignación lógica cruzada de Responsabilidades (sin errores como Montagne 1st entry o Thermite droning)
 *   5. Registro de desglose de puntuación (positive/negative explanations)
 *   6. Supresión de respiración en Match Point y cooldown entre rotaciones
 *   7. Sinergias Híbridas (Puntuación + Sinergias Explícitas)
 */

import { attackers, defenders, type BombSite, type Side } from "./catalog";
import operatorRolesRaw from "./operator-roles.json";
import pibesDataRaw from "./pibes.json";
import playerMapOpsRaw from "./player-map-operators.json";
import playerRulesRaw from "./player-rules.json";
import synergiesRaw from "./synergies.json";
import type { AttackRole, DefenseRole, TacticalRole } from "./roles";
import {
  getAttackSiteProfile,
  NEED_OPERATORS_MAP,
  TACTICAL_NEED_LABELS,
  type TacticalNeedId,
} from "./siteTactics";

// ─── 1. PRNG Determinista (Sin Render Jitter) ───────────────────────────────

export function seededRandom(seedStr: string): () => number {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  let current = Math.abs(hash);
  return function () {
    current = (current * 9301 + 49297) % 233280;
    return current / 233280;
  };
}

// ─── 2. Tipos Normalizados ───────────────────────────────────────────────────

export type OperatorSide = "attack" | "defense";

export type OperatorProfile = {
  name: string;
  side: OperatorSide;
  roles: TacticalRole[];
  position: string;
  tempo: string;
  provides: string[];
  needs: string[];
  best_with_roles: string[];
  duo_plan: string;
  trio_plan: string;
  player_fit: string[];
  difficulty: "low" | "medium" | "high";
};

export type TryoutOpInfo = {
  operator: string;
  developmentGoal: string;
};

export type PibeProfile = {
  id: string;
  name: string;
  tag: string;
  playstyle: string;
  primaryRole?: string;
  roleAffinity: Record<string, number>;
  identityOperators: { attack: string[]; defense: string[] };
  comfortOperators: { attack: string[]; defense: string[] };
  tryoutAttack: TryoutOpInfo[];
  tryoutDefense: TryoutOpInfo[];
  avoidOperators: { attack: string[]; defense: string[] };
  attackMains: string[];
  defenseMains: string[];
  attackRoles: AttackRole[];
  defenseRoles: DefenseRole[];
};

export type ScoreExplanation = {
  positive: string[];
  negative: string[];
};

export type PlayerPick = {
  playerLabel: string;
  playerId: string;
  opName: string;
  backupOpName?: string;
  trackerHighlight?: string;
  operatorProfile: OperatorProfile;
  role: string;
  isMain?: boolean;
  isTryout?: boolean;
  isBreathing?: boolean;
  pickOrderNumber: number;
  coversRequirement?: boolean;
  coveredRole?: string;
  developmentGoal?: string;
  avoidWarning?: string;
  explanation: ScoreExplanation;
};

export type SquadResponsibilities = {
  defuserCarrier?: string;
  primaryDrone?: string;
  firstEntry?: string;
  secondEntry?: string;
  flankWatch?: string;
  shotCaller?: string;
};

export type TacticalWarning = {
  id: string;
  severity: "low" | "medium" | "high";
  message: string;
};

export type ConfidenceInfo = {
  level: "high" | "medium" | "low";
  percentage: number;
  reasons: string[];
};

export type SquadRecommendation = {
  title: string;
  picks: PlayerPick[];
  pickOrder: string[];
  orderReason: string;
  trioPlan?: string;
  duoPlan?: string;
  responsibilities: SquadResponsibilities;
  warnings: TacticalWarning[];
  confidence: ConfidenceInfo;
  breathingType?: "none" | "scheduled" | "adaptive";
  breathingReason?: string;
};

export type RecommendationEngineOutput = {
  primary: SquadRecommendation;
  safeVariant: SquadRecommendation;
  breathingVariant?: SquadRecommendation;
};

// ─── 3. Normalización de Operadores ──────────────────────────────────────────

const rawOpDictionary = operatorRolesRaw as Record<string, any>;

export function normalizeOperator(name: string): OperatorProfile {
  const raw = rawOpDictionary[name];
  if (!raw) {
    const isAtk = attackers.some((a) => a.name === name);
    return {
      name,
      side: isAtk ? "attack" : "defense",
      roles: ["support" as TacticalRole],
      position: "flex",
      tempo: "flexible",
      provides: [],
      needs: [],
      best_with_roles: [],
      duo_plan: "",
      trio_plan: "",
      player_fit: ["flex"],
      difficulty: "medium",
    };
  }

  const side: OperatorSide =
    raw.side ?? (attackers.some((a) => a.name === name) ? "attack" : "defense");
  const roles: TacticalRole[] =
    raw.roles ?? (side === "attack" ? raw.attack : raw.defense) ?? [];

  return {
    name,
    side,
    roles,
    position: raw.position ?? "flex",
    tempo: raw.tempo ?? "flexible",
    provides: raw.provides ?? [],
    needs: raw.needs ?? [],
    best_with_roles: raw.best_with_roles ?? [],
    duo_plan: raw.duo_plan ?? "",
    trio_plan: raw.trio_plan ?? "",
    player_fit: raw.player_fit ?? ["flex"],
    difficulty: raw.difficulty ?? "medium",
  };
}

const ROLE_PLAYSTYLE_LABELS: Record<string, string> = {
  "hard-breach":      "Brecha dura",
  "soft-breach":      "Brecha blanda",
  "entry-frag":       "Entry Fragger",
  "anti-gadget":      "Anti-gadget",
  "intel":            "Información",
  "zone-control":     "Control de zona",
  "support":          "Soporte",
  "objective-anchor": "Ancla del objetivo",
  "anti-gadget-def":  "Anti-gadget",
  "roamer":           "Roamer",
  "intel-def":        "Información",
  "trap-setter":      "Trampas",
  "access-denial":    "Bloqueo de accesos",
  "support-def":      "Soporte defensivo",
  "zone-deny":        "Negación de zona",
};

// ─── 4. Cargador de Pibes y Reglas ───────────────────────────────────────────

export function buildPibeProfiles(): PibeProfile[] {
  return pibesDataRaw.pibes.map((raw: any) => {
    const attackMains: string[] = raw.attackMains ?? [];
    const defenseMains: string[] = raw.defenseMains ?? [];
    const tryoutAttack: TryoutOpInfo[] = raw.tryoutOperators?.attack ?? [];
    const tryoutDefense: TryoutOpInfo[] = raw.tryoutOperators?.defense ?? [];
    const roleAffinity: Record<string, number> = raw.roleAffinity ?? {};

    const attackRoles = deriveRoles<AttackRole>(attackMains, "attack");
    const defenseRoles = deriveRoles<DefenseRole>(defenseMains, "defense");

    return {
      id: raw.id,
      name: raw.name,
      tag: raw.tag,
      attackMains,
      defenseMains,
      attackRoles,
      defenseRoles,
      tryoutAttack,
      tryoutDefense,
      roleAffinity,
      identityOperators: raw.identityOperators ?? { attack: [], defense: [] },
      comfortOperators: raw.comfortOperators ?? { attack: [], defense: [] },
      avoidOperators: raw.avoidOperators ?? { attack: [], defense: [] },
      playstyle: raw.profile?.summary ?? "Flexible",
      primaryRole: raw.profile?.primaryRole,
    };
  });
}

function deriveRoles<T extends TacticalRole>(mains: string[], side: Side): T[] {
  const roleSet = new Set<T>();
  for (const opName of mains) {
    const prof = normalizeOperator(opName);
    for (const r of prof.roles) roleSet.add(r as T);
  }
  return Array.from(roleSet);
}

export const DEFAULT_PIBES: PibeProfile[] = buildPibeProfiles();

// ─── 5. Puntuación Dinámica con Desglose ─────────────────────────────────────

const weights = synergiesRaw.scoreWeights ?? {
  coveredNeed: 4,
  complementaryRole: 3,
  playerFit: 3,
  explicitSynergyBonus: 5,
  duplicatedRolePenalty: -2,
  uncoveredCriticalNeedPenalty: -5,
  forbiddenPatternPenalty: -6,
};

function getMapStatForPick(playerId: string, side: string, opName: string, mapName?: string) {
  if (!mapName) return null;
  const targetKey = mapName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");

  const matchMap = (m: any) => {
    if (!m) return false;
    const nameCandidate = (m.displayName || m.trackerName || m.mapName || "").toLowerCase();
    const idCandidate = (m.mapId || "").toLowerCase();
    const keyCandidate = nameCandidate.replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    return (
      nameCandidate === mapName.toLowerCase() ||
      idCandidate === targetKey ||
      keyCandidate === targetKey
    );
  };
  
  // 1. Intentar buscar en LocalStorage si estamos en el navegador
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
      console.error("Error leyendo LocalStorage para estadistica de mapa:", e);
    }
  }

  // 2. Fallback a player-map-operators.json si no está en LocalStorage
  try {
    const playerData = (playerMapOpsRaw as any).players?.find((p: any) => p.playerId === playerId);
    if (!playerData) return null;

    const opStat = playerData.stats?.find(
      (s: any) => s.operator.toLowerCase() === opName.toLowerCase() && s.side === side
    );
    if (!opStat) return null;

    return opStat.maps?.find(matchMap) ?? null;
  } catch (e) {
    return null;
  }
}

function scoreAndExplainPick(
  op: OperatorProfile,
  pibe: PibeProfile,
  siteReqs: string[],
  squadOpsSoFar: OperatorProfile[],
  squadRolesSoFar: Set<string>,
  matchMap?: string,
  tacticalNeeds?: TacticalNeedId[],
  observedDefenseCounters?: string[]
): { score: number; explanation: ScoreExplanation; trackerHighlight?: string } {
  let score = 50;
  const positive: string[] = [];
  const negative: string[] = [];
  let trackerHighlight: string | undefined = undefined;

  // Afinidad del jugador
  const topRole = op.roles[0];
  const affinity = pibe.roleAffinity[topRole] ?? 0.7;
  const affinityPts = Math.round(affinity * weights.playerFit * 3);
  score += affinityPts;
  positive.push(`+${affinityPts} afinidad de ${pibe.name} con ${ROLE_PLAYSTYLE_LABELS[topRole] ?? topRole}`);

  // Rendimiento histórico en el mapa específico (R6 Tracker) - Pesaje Aumentado
  const mapStat = getMapStatForPick(pibe.id, op.side, op.name, matchMap);
  if (mapStat) {
    if (mapStat.winRate >= 50) {
      const bonus = Math.min(25, Math.round((mapStat.winRate - 45) * 1.2));
      score += bonus;
      positive.push(`🔥 STAT TRACKER: ${mapStat.winRate}% Winrate en ${matchMap} (${mapStat.wins || 0}V-${mapStat.losses || 0}D)`);
    } else if (mapStat.winRate < 45) {
      const penalty = Math.min(15, Math.round((50 - mapStat.winRate) * 1.2));
      score -= penalty;
      negative.push(`⚠️ STAT TRACKER: Winrate bajo del ${mapStat.winRate}% en ${matchMap}`);
    }

    if (mapStat.kd >= 1.1) {
      score += 8;
      positive.push(`⭐ K/D Destacado: ${mapStat.kd.toFixed(2)} K/D en ${matchMap}`);
    }

    trackerHighlight = `${mapStat.winRate}% WR · ${mapStat.kd.toFixed(2)} KD (${mapStat.matchesOrRounds || 0} rondas)`;
  }

  // Evaluación de Necesidades Tácticas Específicas del Sitio
  if (tacticalNeeds && tacticalNeeds.length > 0) {
    for (const needId of tacticalNeeds) {
      const opsForNeed = NEED_OPERATORS_MAP[needId] || [];
      if (opsForNeed.includes(op.name)) {
        score += 15;
        const needLabel = TACTICAL_NEED_LABELS[needId] || needId;
        positive.push(`🎯 Cubre necesidad táctica de sitio: ${needLabel}`);
      }
    }
  }

  // Evaluación de Contras Directas a Defensa Observada del Rival
  if (observedDefenseCounters && observedDefenseCounters.includes(op.name)) {
    score += 20;
    positive.push(`⚡ Contra directa para defensa observada del rival`);
  }

  // Requerimientos del sitio
  const coversSiteReq = op.roles.find((r) => siteReqs.includes(r) && !squadRolesSoFar.has(r));
  if (coversSiteReq) {
    score += weights.coveredNeed * 3;
    positive.push(`+${weights.coveredNeed * 3} cubre necesidad de ${ROLE_PLAYSTYLE_LABELS[coversSiteReq] ?? coversSiteReq}`);
  }

  // Complementariedad con squad
  for (const prevOp of squadOpsSoFar) {
    if (prevOp.needs.some((n) => op.provides.includes(n) || op.roles.includes(n as any))) {
      score += weights.complementaryRole * 2;
      positive.push(`+${weights.complementaryRole * 2} sinergia de rol con ${prevOp.name}`);
    }
  }

  // Penalización por duplicación innecesaria
  for (const role of op.roles) {
    if (squadRolesSoFar.has(role)) {
      score += weights.duplicatedRolePenalty * 2;
      negative.push(`${weights.duplicatedRolePenalty * 2} duplica rol de ${ROLE_PLAYSTYLE_LABELS[role] ?? role}`);
    }
  }

  // Penalización si es avoid del pibe
  const isAvoid = op.side === "attack"
    ? pibe.avoidOperators.attack.includes(op.name)
    : pibe.avoidOperators.defense.includes(op.name);
  if (isAvoid) {
    score += weights.forbiddenPatternPenalty * 2;
    negative.push(`${weights.forbiddenPatternPenalty * 2} operador desaconsejado para ${pibe.name}`);
  }

  return { score, explanation: { positive, negative }, trackerHighlight };
}

// ─── 6. Orden de Picks Dinámico Justificado ───────────────────────────────────

function calculateDynamicPickOrder(
  activePibes: PibeProfile[],
  side: Side,
  siteReqs: string[]
): { orderedPibes: PibeProfile[]; reason: string } {
  const pibes = [...activePibes];

  if (side === "attack") {
    return {
      orderedPibes: [
        changoOrFirst(pibes, "chango_nocturno"),
        changoOrFirst(pibes, "el_notorious"),
        changoOrFirst(pibes, "azusa_cooper09"),
      ].filter(Boolean),
      reason: "Orden sugerido: Chango → Notorious → Azusa. Motivo: Primero se fija la estructura/brecha, luego el flex de presión y finalmente la ejecución de plantado.",
    };
  } else {
    return {
      orderedPibes: [
        changoOrFirst(pibes, "chango_nocturno"),
        changoOrFirst(pibes, "azusa_cooper09"),
        changoOrFirst(pibes, "el_notorious"),
      ].filter(Boolean),
      reason: "Orden sugerido: Chango → Azusa → Notorious. Motivo: Primero se sella la negación de muro, luego el ancla de sitio y finalmente la cobertura de roaming/intel.",
    };
  }
}

function changoOrFirst(pibes: PibeProfile[], targetId: string): PibeProfile {
  return pibes.find((p) => p.id === targetId) ?? pibes[0];
}

// ─── 7. Asignación Lógica Cruzada de Responsabilidades ───────────────────────

function assignSquadResponsibilities(
  picks: PlayerPick[],
  side: Side
): SquadResponsibilities {
  const resp: SquadResponsibilities = {};

  if (side === "attack") {
    const carrierPick =
      picks.find((p) => ["Osa", "Sens", "Gridlock", "Rauora"].includes(p.opName)) ??
      picks.find((p) => ["Thermite", "Hibana", "Ace"].includes(p.opName)) ??
      picks.find((p) => p.playerId === "azusa_cooper09") ??
      picks[0];

    resp.defuserCarrier = carrierPick?.playerLabel;

    const dronePick =
      picks.find((p) => ["Thatcher", "Zero", "Twitch", "Brava", "IQ", "Lion", "Dokkaebi"].includes(p.opName)) ??
      picks.find((p) => p.playerId === "chango_nocturno") ??
      picks[0];

    resp.primaryDrone = dronePick?.playerLabel;

    const firstEntryPick =
      picks.find((p) => ["Ash", "Zofia", "Deimos", "Buck", "Iana", "Amaru", "Nøkk", "Blitz"].includes(p.opName)) ??
      picks.find((p) => p.playerId === "el_notorious") ??
      picks[0];

    resp.firstEntry = firstEntryPick?.playerLabel;

    const secondEntryPick = picks.find((p) => p.playerLabel !== firstEntryPick?.playerLabel) ?? picks[1];
    resp.secondEntry = secondEntryPick?.playerLabel;
    resp.flankWatch = picks.find((p) => ["Nomad", "Gridlock", "Grim"].includes(p.opName))?.playerLabel ?? "Escuadrón";
    resp.shotCaller = picks.find((p) => p.playerId === "el_notorious")?.playerLabel ?? "El_Notorious";
  } else {
    const notoriousPick = picks.find((p) => p.playerId === "el_notorious");
    const changoPick = picks.find((p) => p.playerId === "chango_nocturno");

    resp.firstEntry = notoriousPick?.playerLabel ?? picks[0]?.playerLabel;
    resp.secondEntry = changoPick?.playerLabel;
    resp.flankWatch = notoriousPick?.playerLabel;
    resp.shotCaller = notoriousPick?.playerLabel ?? "El_Notorious";
  }

  return resp;
}

// ─── 8. Evaluación de Advertencias Estructuradas ──────────────────────────────

function evaluateTacticalWarnings(
  picks: PlayerPick[],
  side: Side
): TacticalWarning[] {
  const warnings: TacticalWarning[] = [];
  const opNames = picks.map((p) => p.opName);
  const isAttack = side === "attack";

  if (isAttack) {
    const structuralCount = opNames.filter((n) =>
      ["Thermite", "Thatcher", "Ace", "Hibana"].includes(n)
    ).length;

    if (structuralCount >= 3) {
      warnings.push({
        id: "no-entry-pressure",
        severity: "high",
        message: "La composición tiene 3 soportes estructurales. Abre la pared pero carece de agresión para tomar sitio.",
      });
    }

    const hasShield = picks.some(
      (p) => p.playerId === "azusa_cooper09" && ["Montagne", "Blitz"].includes(p.opName)
    );
    if (hasShield) {
      warnings.push({
        id: "isolated-shield",
        severity: "medium",
        message: "El escudo de Azusa requiere avanzar pegado con un compañero preparado para tradear disparos.",
      });
    }
  } else {
    const passiveAnchors = picks.filter((p) =>
      ["Doc", "Rook", "Tachanka", "Maestro", "Echo", "Castle"].includes(p.opName)
    ).length;

    if (passiveAnchors >= 3) {
      warnings.push({
        id: "passive-defense",
        severity: "high",
        message: "Los 3 defensores dependen de quedarse encerrados en el objetivo sin control del mapa ni roaming.",
      });
    }
  }

  return warnings;
}

// ─── 9. Calibración de Confianza ───────────────────────────────────────────────

function calculateConfidence(
  picks: PlayerPick[],
  siteReqs: string[],
  warnings: TacticalWarning[],
  explicitSynergy?: any
): ConfidenceInfo {
  const reasons: string[] = [];
  let scorePoints = 85;

  const coveredReqs = siteReqs.filter((req) =>
    picks.some((p) => p.operatorProfile.roles.includes(req as any))
  );

  if (siteReqs.length > 0) {
    if (coveredReqs.length === siteReqs.length) {
      scorePoints += 8;
      reasons.push(`Cubre ${coveredReqs.length} de ${siteReqs.length} necesidades del sitio`);
    } else {
      scorePoints -= (siteReqs.length - coveredReqs.length) * 6;
      reasons.push(`Cubre ${coveredReqs.length} de ${siteReqs.length} necesidades del sitio`);
    }
  }

  if (explicitSynergy) {
    scorePoints += 10;
    reasons.push("Existe una sinergia de jugada explícita probada");
  }

  const highWarnings = warnings.filter((w) => w.severity === "high");
  if (highWarnings.length > 0) {
    scorePoints -= 15;
    reasons.push(`Presenta ${highWarnings.length} advertencia(s) táctica(s) crítica(s)`);
  }

  const percentage = Math.min(99, Math.max(50, scorePoints));
  let level: "high" | "medium" | "low" = "high";
  if (percentage < 75) level = "medium";
  if (percentage < 60) level = "low";

  return { level, percentage, reasons };
}

// ─── 10. Motor Principal Los Pibes (Deterministic & Complete) ────────────────

export function getPibesRecommendations(
  side: Side,
  activePibes: PibeProfile[],
  currentSite?: BombSite,
  currentRoundNum: number = 1,
  matchMap: string = "Clubhouse",
  bannedOps?: string[],
  selectedRouteId?: string,
  observedDefenseIds?: string[]
): RecommendationEngineOutput {
  const fullPool = side === "attack" ? attackers : defenders;
  const siteReqs: string[] =
    currentSite?.requirements?.[side === "attack" ? "attack" : "defense"] ?? [];

  const siteKey = currentSite?.name ?? "any_site";
  const pibesKey = activePibes.map((p) => p.id).join("_");
  const bansKey = (bannedOps || []).sort().join("_");
  const routeKey = selectedRouteId || "auto";
  const obsKey = (observedDefenseIds || []).sort().join("_");
  const rngSeed = `${side}_${matchMap}_${siteKey}_${currentRoundNum}_${pibesKey}_${bansKey}_${routeKey}_${obsKey}`;

  const { orderedPibes, reason: orderReason } = calculateDynamicPickOrder(
    activePibes,
    side,
    siteReqs
  );

  const isMatchPoint = currentRoundNum >= 6;
  const isScheduledBreathing = !isMatchPoint && currentRoundNum > 0 && currentRoundNum % 3 === 0;

  // ── GENERAR RECOMENDACIÓN PRINCIPAL ─────────────────────────────────────────
  const primaryPicks = generateSquadPicks(
    orderedPibes,
    side,
    siteReqs,
    fullPool,
    "primary",
    rngSeed + "_primary",
    0,
    matchMap,
    bannedOps,
    selectedRouteId,
    observedDefenseIds
  );

  const primaryWarnings = evaluateTacticalWarnings(primaryPicks, side);
  const explicitSynergy = findExplicitSynergy(primaryPicks, side);

  const primaryRecommendation: SquadRecommendation = {
    title: "Recomendación Principal (Máxima Sinergia)",
    picks: primaryPicks,
    pickOrder: orderedPibes.map((p) => p.name),
    orderReason,
    trioPlan: explicitSynergy?.plan?.setup
      ? `${explicitSynergy.plan.setup} ${explicitSynergy.plan.execute}`
      : primaryPicks[0]?.operatorProfile?.trio_plan || "Coordinar brecha, toma de espacio y plantado seguro.",
    duoPlan: explicitSynergy?.plan?.setup || primaryPicks[0]?.operatorProfile?.duo_plan,
    responsibilities: assignSquadResponsibilities(primaryPicks, side),
    warnings: primaryWarnings,
    confidence: calculateConfidence(primaryPicks, siteReqs, primaryWarnings, explicitSynergy),
    breathingType: "none",
  };

  // ── GENERAR VARIANTE SEGURA ────────────────────────────────────────────────
  const safePicks = generateSquadPicks(
    orderedPibes,
    side,
    siteReqs,
    fullPool,
    "safe",
    rngSeed + "_safe",
    0,
    matchMap,
    bannedOps,
    selectedRouteId,
    observedDefenseIds
  );

  const safeWarnings = evaluateTacticalWarnings(safePicks, side);
  const safeRecommendation: SquadRecommendation = {
    title: "Variante Segura (Estructura Estable)",
    picks: safePicks,
    pickOrder: orderedPibes.map((p) => p.name),
    orderReason: "Composición de respaldo con alta estabilidad y menor riesgo operativo.",
    trioPlan: safePicks[0]?.operatorProfile?.trio_plan || "Mantener estructura sólida de sitio y soporte.",
    duoPlan: safePicks[0]?.operatorProfile?.duo_plan,
    responsibilities: assignSquadResponsibilities(safePicks, side),
    warnings: safeWarnings,
    confidence: calculateConfidence(safePicks, siteReqs, safeWarnings),
    breathingType: "none",
  };

  // ── GENERAR VARIANTE DE RESPIRACIÓN ─────────────────────────────────────────
  let breathingRecommendation: SquadRecommendation | undefined = undefined;

  if (isScheduledBreathing || activePibes.some((p) => (side === "attack" ? p.tryoutAttack : p.tryoutDefense).length > 0)) {
    const breathingIndex = (currentRoundNum / 3 - 1) % orderedPibes.length;
    const breathingPicks = generateSquadPicks(
      orderedPibes,
      side,
      siteReqs,
      fullPool,
      "breathing",
      rngSeed + "_breathing",
      breathingIndex,
      matchMap,
      bannedOps,
      selectedRouteId,
      observedDefenseIds
    );

    const breathingWarnings = evaluateTacticalWarnings(breathingPicks, side);

    breathingRecommendation = {
      title: "Variante de Respiración / Tryout",
      picks: breathingPicks,
      pickOrder: orderedPibes.map((p) => p.name),
      orderReason: "Rotación táctica para evitar volver la estrategia del squad predecible.",
      trioPlan: breathingPicks.find((p) => p.developmentGoal)?.developmentGoal
        ? `Objetivo de Desarrollo: ${breathingPicks.find((p) => p.developmentGoal)?.developmentGoal}`
        : "Variación de roles para probar alternativas de combate.",
      responsibilities: assignSquadResponsibilities(breathingPicks, side),
      warnings: breathingWarnings,
      confidence: calculateConfidence(breathingPicks, siteReqs, breathingWarnings),
      breathingType: isScheduledBreathing ? "scheduled" : "adaptive",
      breathingReason: isScheduledBreathing
        ? "Rotación programada de ronda 3 para evitar previsibilidad."
        : "Adaptación estratégica de squad.",
    };
  }

  return {
    primary: primaryRecommendation,
    safeVariant: safeRecommendation,
    breathingVariant: breathingRecommendation,
  };
}

// Helper determinista para generar picks
function generateSquadPicks(
  orderedPibes: PibeProfile[],
  side: Side,
  siteReqs: string[],
  fullPool: any[],
  strategy: "primary" | "safe" | "breathing",
  seedStr: string,
  breathingIndex: number = 0,
  matchMap?: string,
  bannedOps?: string[],
  selectedRouteId?: string,
  observedDefenseIds?: string[]
): PlayerPick[] {
  const rng = seededRandom(seedStr);
  const bannedSet = new Set((bannedOps || []).map((b) => b.toLowerCase()));
  const isBanned = (opName: string) => bannedSet.has(opName.toLowerCase());

  // Perfil de sitio táctico
  const siteProfile = side === "attack" && matchMap ? getAttackSiteProfile(matchMap, siteReqs.join("_") || "") : null;
  const tacticalNeeds: TacticalNeedId[] = [];
  const observedDefenseCounters: string[] = [];

  if (siteProfile) {
    tacticalNeeds.push(...siteProfile.defaultNeeds.required, ...siteProfile.defaultNeeds.important);

    if (selectedRouteId && selectedRouteId !== "auto") {
      const route = siteProfile.attackRoutes.find((r) => r.id === selectedRouteId);
      if (route) {
        tacticalNeeds.push(...route.requiredNeeds, ...route.usefulNeeds);
      }
    }

    if (observedDefenseIds && observedDefenseIds.length > 0) {
      siteProfile.commonDefenses.forEach((def) => {
        if (observedDefenseIds.includes(def.id)) {
          tacticalNeeds.push(...def.createsNeeds);
          observedDefenseCounters.push(...def.counters);
        }
      });
    }
  }

  const usedOps = new Set<string>();
  const squadRolesSoFar = new Set<string>();
  const squadOpsSoFar: OperatorProfile[] = [];
  const picks: PlayerPick[] = [];

  orderedPibes.forEach((pibe, idx) => {
    const isBreathingPlayer = strategy === "breathing" && idx === Math.abs(Math.floor(breathingIndex) % orderedPibes.length);
    const mains = (side === "attack" ? pibe.attackMains : pibe.defenseMains).filter((m) => !isBanned(m));
    const tryouts = (side === "attack" ? pibe.tryoutAttack : pibe.tryoutDefense).filter((t) => !isBanned(t.operator));

    let chosenOpName: string = "";
    let backupOpName: string | undefined = undefined;
    let isMain = false;
    let isTryout = false;
    let developmentGoal: string | undefined = undefined;

    if (isBreathingPlayer && tryouts.length > 0) {
      const avail = tryouts.filter((t) => !usedOps.has(t.operator));
      if (avail.length > 0) {
        const picked = avail[Math.floor(rng() * avail.length)];
        chosenOpName = picked.operator;
        isTryout = true;
        developmentGoal = picked.developmentGoal;
      }
    }

    if (!chosenOpName) {
      const availableMains = mains.filter((m) => !usedOps.has(m));
      if (availableMains.length > 0) {
        const scoredMains = availableMains
          .map((opName) => {
            const prof = normalizeOperator(opName);
            const { score } = scoreAndExplainPick(
              prof,
              pibe,
              siteReqs,
              squadOpsSoFar,
              squadRolesSoFar,
              matchMap,
              tacticalNeeds,
              observedDefenseCounters
            );
            return { opName, score };
          })
          .sort((a, b) => b.score - a.score);

        if (strategy === "safe" && scoredMains.length > 1) {
          chosenOpName = scoredMains[1].opName;
          backupOpName = scoredMains[0].opName;
        } else {
          chosenOpName = scoredMains[0].opName;
          backupOpName = scoredMains[1]?.opName || scoredMains[2]?.opName;
        }
        isMain = true;
      } else {
        const pool = fullPool.filter((op) => !usedOps.has(op.name) && !isBanned(op.name));
        const picked = (pool.length > 0 ? pool : fullPool)[
          Math.floor(rng() * (pool.length > 0 ? pool.length : fullPool.length))
        ];
        chosenOpName = picked.name;
      }
    }

    if (!backupOpName) {
      const backupCandidate = mains.find((m) => m !== chosenOpName && !usedOps.has(m) && !isBanned(m));
      if (backupCandidate) {
        backupOpName = backupCandidate;
      } else {
        const fallbackCandidate = fullPool.find((op) => op.name !== chosenOpName && !usedOps.has(op.name) && !isBanned(op.name));
        if (fallbackCandidate) backupOpName = fallbackCandidate.name;
      }
    }

    usedOps.add(chosenOpName);
    const prof = normalizeOperator(chosenOpName);
    const { score, explanation, trackerHighlight } = scoreAndExplainPick(
      prof,
      pibe,
      siteReqs,
      squadOpsSoFar,
      squadRolesSoFar,
      matchMap,
      tacticalNeeds,
      observedDefenseCounters
    );

    squadOpsSoFar.push(prof);
    for (const r of prof.roles) squadRolesSoFar.add(r);

    const coversReq = prof.roles.some((r) => siteReqs.includes(r));
    const coveredRole = prof.roles.find((r) => siteReqs.includes(r));

    picks.push({
      playerLabel: pibe.name,
      playerId: pibe.id,
      opName: chosenOpName,
      backupOpName,
      trackerHighlight,
      operatorProfile: prof,
      role: ROLE_PLAYSTYLE_LABELS[prof.roles[0]] ?? prof.roles[0],
      isMain,
      isTryout,
      isBreathing: isBreathingPlayer,
      pickOrderNumber: idx + 1,
      coversRequirement: coversReq,
      coveredRole: coveredRole ? ROLE_PLAYSTYLE_LABELS[coveredRole] : undefined,
      developmentGoal,
      explanation,
    });
  });

  return picks;
}

// ─── 11. Búsqueda de Sinergias Explícitas ──────────────────────────────────────

const explicitSynergiesList = synergiesRaw.explicitSynergies ?? [];

function findExplicitSynergy(picks: PlayerPick[], side: Side) {
  const opNames = picks.map((p) => p.opName);
  return explicitSynergiesList.find(
    (s: any) =>
      s.side === side && s.operators.every((op: string) => opNames.includes(op))
  );
}

// ─── Modo Estándar Compatible ────────────────────────────────────────────────

export function getStandardRecommendations(
  side: Side,
  count: number
): PlayerPick[] {
  const pool = side === "attack" ? attackers : defenders;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, count);

  return picked.map((op, idx) => ({
    playerLabel: count === 1 ? "Tu Pick" : `Jugador ${idx + 1}`,
    playerId: `player_${idx + 1}`,
    opName: op.name,
    operatorProfile: normalizeOperator(op.name),
    role: op.role,
    pickOrderNumber: idx + 1,
    explanation: { positive: ["Pick aleatorio estándar"], negative: [] },
  }));
}
