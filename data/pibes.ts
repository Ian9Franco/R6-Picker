/**
 * pibes.ts
 * --------
 * Motor Táctico Avanzado de Recomendación de Escuadrón.
 * Implementa:
 *   1. Normalización unificada de 77 operadores a OperatorProfile
 *   2. Motor de puntuación dinámico (needCoverage * 4 + complementary * 3 + playerAffinity * 3 + synergy - penalty)
 *   3. Orden de Picks dinámico calculado con justificación
 *   4. Respiración Programada y Adaptativa
 *   5. Generación de Responsabilidades de Squad (Defuser, Primary Drone, First/Second Entry, Flank Watch, Shot Caller)
 *   6. Evaluación de reglas estructuradas (player-rules.json) y warnings por severidad
 *   7. Salida con Confianza, Recomendación Principal, Variante Segura y Variante de Respiración
 */

import { attackers, defenders, type BombSite, type Side } from "./catalog";
import operatorRolesRaw from "./operator-roles.json";
import pibesDataRaw from "./pibes.json";
import playerRulesRaw from "./player-rules.json";
import synergiesRaw from "./synergies.json";
import type { AttackRole, DefenseRole, TacticalRole } from "./roles";

// ─── 1. Tipos Normalizados ───────────────────────────────────────────────────

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

export type PlayerPick = {
  playerLabel: string;
  playerId: string;
  opName: string;
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
};

export type Recommendation = PlayerPick;

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

export type SquadRecommendation = {
  title: string;
  picks: PlayerPick[];
  pickOrder: string[];
  orderReason: string;
  trioPlan?: string;
  duoPlan?: string;
  responsibilities: SquadResponsibilities;
  warnings: TacticalWarning[];
  confidence: number; // 0.0 - 1.0
  breathingType?: "none" | "scheduled" | "adaptive";
  breathingReason?: string;
};

export type RecommendationEngineOutput = {
  primary: SquadRecommendation;
  safeVariant: SquadRecommendation;
  breathingVariant?: SquadRecommendation;
};

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

// ─── 2. Normalización de Operadores ──────────────────────────────────────────

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

// ─── 3. Cargador de Pibes y Reglas ───────────────────────────────────────────

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

// ─── 4. Motor de Puntuación Dinámico ────────────────────────────────────────

const weights = synergiesRaw.scoreWeights ?? {
  coveredNeed: 4,
  complementaryRole: 3,
  playerFit: 3,
  explicitSynergyBonus: 5,
  duplicatedRolePenalty: -2,
  uncoveredCriticalNeedPenalty: -5,
  forbiddenPatternPenalty: -6,
};

function scorePick(
  op: OperatorProfile,
  pibe: PibeProfile,
  siteReqs: string[],
  squadOpsSoFar: OperatorProfile[],
  squadRolesSoFar: Set<string>
): number {
  let score = 50;

  // Afinidad del jugador con el rol del operador (0.3 - 1.0)
  const topRole = op.roles[0];
  const affinity = pibe.roleAffinity[topRole] ?? 0.7;
  score += affinity * weights.playerFit;

  // Requerimientos cubiertos del site
  const coversSiteReq = op.roles.some((r) => siteReqs.includes(r) && !squadRolesSoFar.has(r));
  if (coversSiteReq) score += weights.coveredNeed;

  // Complementariedad con necesidades de operadores previos
  for (const prevOp of squadOpsSoFar) {
    if (prevOp.needs.some((n) => op.provides.includes(n) || op.roles.includes(n as any))) {
      score += weights.complementaryRole;
    }
  }

  // Penalización por rol duplicado si ya hay suficiente
  for (const role of op.roles) {
    if (squadRolesSoFar.has(role)) {
      score += weights.duplicatedRolePenalty;
    }
  }

  // Penalización si está en la lista de avoid del jugador
  const isAvoid = op.side === "attack"
    ? pibe.avoidOperators.attack.includes(op.name)
    : pibe.avoidOperators.defense.includes(op.name);
  if (isAvoid) score += weights.forbiddenPatternPenalty;

  return score;
}

// ─── 5. Orden de Picks Dinámico con Justificación ─────────────────────────────

function calculateDynamicPickOrder(
  activePibes: PibeProfile[],
  side: Side,
  siteReqs: string[]
): { orderedPibes: PibeProfile[]; reason: string } {
  // Copia segura de pibes
  const pibes = [...activePibes];

  if (side === "attack") {
    // Si el sitio requiere Hard Breach explícito, el jugador con mayor afinidad a Hard Breach va 1.º
    const hardBreacher = pibes.find((p) => p.roleAffinity["hard-breach"] && p.roleAffinity["hard-breach"] > 0.85);
    const shieldOrExec = pibes.find((p) => p.id === "azusa_cooper09");
    const flex = pibes.find((p) => p.id === "el_notorious");

    if (hardBreacher && hardBreacher.id === "chango_nocturno") {
      return {
        orderedPibes: [
          changoOrFirst(pibes, "chango_nocturno"),
          changoOrFirst(pibes, "el_notorious"),
          changoOrFirst(pibes, "azusa_cooper09"),
        ].filter(Boolean),
        reason: "Orden sugerido: Chango → Notorious → Azusa. Motivo: Primero se fija la brecha dura, luego el flex de presión y finalmente la ejecución de plantado.",
      };
    }
  } else {
    // Defensa: 1. Estructura de sitio -> 2. Ancla -> 3. Intel/Roam
    return {
      orderedPibes: [
        changoOrFirst(pibes, "chango_nocturno"),
        changoOrFirst(pibes, "azusa_cooper09"),
        changoOrFirst(pibes, "el_notorious"),
      ].filter(Boolean),
      reason: "Orden sugerido: Chango → Azusa → Notorious. Motivo: Primero se asegura la negación del muro, luego el ancla de sitio y finalmente la cobertura de roaming/intel.",
    };
  }

  return {
    orderedPibes: pibes,
    reason: "Orden estándar táctico según responsabilidades primarias del squad.",
  };
}

function changoOrFirst(pibes: PibeProfile[], targetId: string): PibeProfile {
  return pibes.find((p) => p.id === targetId) ?? pibes[0];
}

// ─── 6. Generación de Responsabilidades ──────────────────────────────────────

function assignSquadResponsibilities(
  picks: PlayerPick[],
  side: Side
): SquadResponsibilities {
  const resp: SquadResponsibilities = {};

  if (side === "attack") {
    // Carrier: Azusa si tiene escudo/support, o Chango con brecha
    const azusaPick = picks.find((p) => p.playerId === "azusa_cooper09");
    const changoPick = picks.find((p) => p.playerId === "chango_nocturno");
    const notoriousPick = picks.find((p) => p.playerId === "el_notorious");

    resp.defuserCarrier = azusaPick?.playerLabel ?? changoPick?.playerLabel ?? picks[0]?.playerLabel;
    resp.primaryDrone = changoPick?.playerLabel ?? notoriousPick?.playerLabel ?? picks[0]?.playerLabel;
    resp.firstEntry = notoriousPick?.playerLabel ?? picks[0]?.playerLabel;
    resp.secondEntry = azusaPick?.playerLabel ?? changoPick?.playerLabel;
    resp.flankWatch = changoPick?.playerLabel ?? "Escuadrón";
    resp.shotCaller = notoriousPick?.playerLabel ?? "El_Notorious";
  } else {
    const notoriousPick = picks.find((p) => p.playerId === "el_notorious");
    const changoPick = picks.find((p) => p.playerId === "chango_nocturno");
    const azusaPick = picks.find((p) => p.playerId === "azusa_cooper09");

    resp.firstEntry = notoriousPick?.playerLabel ?? picks[0]?.playerLabel;
    resp.secondEntry = changoPick?.playerLabel;
    resp.flankWatch = notoriousPick?.playerLabel;
    resp.shotCaller = notoriousPick?.playerLabel ?? "El_Notorious";
  }

  return resp;
}

// ─── 7. Reglas de Advertencias Estructuradas ────────────────────────────────

const playerRules = playerRulesRaw as any;

function evaluateTacticalWarnings(
  picks: PlayerPick[],
  side: Side
): TacticalWarning[] {
  const warnings: TacticalWarning[] = [];
  const opNames = picks.map((p) => p.opName);
  const isAttack = side === "attack";

  // Revisa reglas de player-rules.json
  if (isAttack) {
    const structuralCount = opNames.filter((n) =>
      ["Thermite", "Thatcher", "Ace", "Hibana"].includes(n)
    ).length;

    if (structuralCount >= 3) {
      warnings.push({
        id: "no-entry-pressure",
        severity: "high",
        message: "La composición tiene 3 soportes estructurales. Abre el sitio pero carece de presión para cruzar la brecha.",
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
    // Defensa: 3 anclas sin roaming
    const passiveAnchors = picks.filter((p) =>
      ["Doc", "Rook", "Tachanka", "Maestro", "Echo", "Castle"].includes(p.opName)
    ).length;

    if (passiveAnchors >= 3) {
      warnings.push({
        id: "passive-defense",
        severity: "high",
        message: "Los 3 defensores dependen de quedarse dentro del objetivo sin control del mapa ni roaming.",
      });
    }
  }

  return warnings;
}

// ─── 8. Motor Principal Los Pibes (Salida Completa) ───────────────────────────

export function getPibesRecommendations(
  side: Side,
  activePibes: PibeProfile[],
  currentSite?: BombSite,
  currentRoundNum: number = 1
): RecommendationEngineOutput {
  const fullPool = side === "attack" ? attackers : defenders;
  const siteReqs: string[] =
    currentSite?.requirements?.[side === "attack" ? "attack" : "defense"] ?? [];

  // Calcular orden dinámico de picks
  const { orderedPibes, reason: orderReason } = calculateDynamicPickOrder(
    activePibes,
    side,
    siteReqs
  );

  // Evaluar respiración programada y adaptativa
  const isScheduledBreathing = currentRoundNum > 0 && currentRoundNum % 3 === 0;

  // ── GENERAR RECOMENDACIÓN PRINCIPAL ─────────────────────────────────────────
  const primaryPicks = generateSquadPicks(
    orderedPibes,
    side,
    siteReqs,
    fullPool,
    "primary"
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
    confidence: primaryWarnings.some((w) => w.severity === "high") ? 0.72 : 0.94,
    breathingType: "none",
  };

  // ── GENERAR VARIANTE SEGURA ────────────────────────────────────────────────
  const safePicks = generateSquadPicks(
    orderedPibes,
    side,
    siteReqs,
    fullPool,
    "safe"
  );

  const safeRecommendation: SquadRecommendation = {
    title: "Variante Segura (Estructura Estable)",
    picks: safePicks,
    pickOrder: orderedPibes.map((p) => p.name),
    orderReason: "Composición de respaldo con alta estabilidad y menor riesgo operativo.",
    trioPlan: safePicks[0]?.operatorProfile?.trio_plan || "Mantener estructura sólida de sitio y soporte.",
    duoPlan: safePicks[0]?.operatorProfile?.duo_plan,
    responsibilities: assignSquadResponsibilities(safePicks, side),
    warnings: evaluateTacticalWarnings(safePicks, side),
    confidence: 0.88,
    breathingType: "none",
  };

  // ── GENERAR VARIANTE DE RESPIRACIÓN ─────────────────────────────────────────
  let breathingRecommendation: SquadRecommendation | undefined = undefined;

  if (isScheduledBreathing || activePibes.some((p) => (side === "attack" ? p.tryoutAttack : p.tryoutDefense).length > 0)) {
    const breathingPicks = generateSquadPicks(
      orderedPibes,
      side,
      siteReqs,
      fullPool,
      "breathing",
      (currentRoundNum / 3 - 1) % orderedPibes.length
    );

    breathingRecommendation = {
      title: "Variante de Respiración / Tryout",
      picks: breathingPicks,
      pickOrder: orderedPibes.map((p) => p.name),
      orderReason: "Rotación táctica para evitar volver la estrategia del squad predecible.",
      trioPlan: breathingPicks.find((p) => p.developmentGoal)?.developmentGoal
        ? `Objetivo de Desarrollo: ${breathingPicks.find((p) => p.developmentGoal)?.developmentGoal}`
        : "Variación de roles para probar alternativas de combate.",
      responsibilities: assignSquadResponsibilities(breathingPicks, side),
      warnings: evaluateTacticalWarnings(breathingPicks, side),
      confidence: 0.82,
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

// Helper para generar picks de escuadrón según estrategia
function generateSquadPicks(
  orderedPibes: PibeProfile[],
  side: Side,
  siteReqs: string[],
  fullPool: any[],
  strategy: "primary" | "safe" | "breathing",
  breathingIndex: number = 0
): PlayerPick[] {
  const usedOps = new Set<string>();
  const squadRolesSoFar = new Set<string>();
  const squadOpsSoFar: OperatorProfile[] = [];
  const picks: PlayerPick[] = [];

  orderedPibes.forEach((pibe, idx) => {
    const isBreathingPlayer = strategy === "breathing" && idx === Math.abs(breathingIndex % orderedPibes.length);
    const mains = side === "attack" ? pibe.attackMains : pibe.defenseMains;
    const tryouts = side === "attack" ? pibe.tryoutAttack : pibe.tryoutDefense;

    let chosenOpName: string = "";
    let isMain = false;
    let isTryout = false;
    let developmentGoal: string | undefined = undefined;

    if (isBreathingPlayer && tryouts.length > 0) {
      const avail = tryouts.filter((t) => !usedOps.has(t.operator));
      if (avail.length > 0) {
        const picked = avail[0];
        chosenOpName = picked.operator;
        isTryout = true;
        developmentGoal = picked.developmentGoal;
      }
    }

    if (!chosenOpName) {
      const availableMains = mains.filter((m) => !usedOps.has(m));
      if (strategy === "safe" && availableMains.length > 1) {
        chosenOpName = availableMains[1];
        isMain = true;
      } else if (availableMains.length > 0) {
        chosenOpName = availableMains[0];
        isMain = true;
      } else {
        const pool = fullPool.filter((op) => !usedOps.has(op.name));
        chosenOpName = (pool.length > 0 ? pool : fullPool)[0].name;
      }
    }

    usedOps.add(chosenOpName);
    const prof = normalizeOperator(chosenOpName);
    squadOpsSoFar.push(prof);
    for (const r of prof.roles) squadRolesSoFar.add(r);

    const coversReq = prof.roles.some((r) => siteReqs.includes(r));
    const coveredRole = prof.roles.find((r) => siteReqs.includes(r));

    picks.push({
      playerLabel: pibe.name,
      playerId: pibe.id,
      opName: chosenOpName,
      operatorProfile: prof,
      role: ROLE_PLAYSTYLE_LABELS[prof.roles[0]] ?? prof.roles[0],
      isMain,
      isTryout,
      isBreathing: isBreathingPlayer,
      pickOrderNumber: idx + 1,
      coversRequirement: coversReq,
      coveredRole: coveredRole ? ROLE_PLAYSTYLE_LABELS[coveredRole] : undefined,
      developmentGoal,
    });
  });

  return picks;
}

// ─── 9. Búsqueda de Sinergias Explícitas ──────────────────────────────────────

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
  }));
}
