import { type OperatorProfile, type PibeProfile, type PlayerPick, type SquadResponsibilities, type TacticalWarning, type ConfidenceInfo, type SquadRecommendation, type RecommendationEngineOutput } from "./types";
import { type Side, attackers, defenders } from "../catalog";
import { type TacticalNeedId, type AttackSiteProfile, getAttackSiteProfile } from "../siteTactics";
import { ROLE_LABELS } from "../roles";
import { buildPibeProfiles, normalizeOperator } from "./loader";
import { scoreAndExplainPick } from "./scoring";
import { determineSquadOrder } from "./synergies";
import { getSiteStrategy } from "../mapStrategies";
import synergiesRaw from "../synergies.json";

export const DEFAULT_PIBES = buildPibeProfiles();

function seededRandom(seed: string) {
  let h = 0xdeadbeef;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 2654435761);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 0x100000000;
  };
}

function assignSquadResponsibilities(picks: PlayerPick[], side: Side): SquadResponsibilities {
  const resp: SquadResponsibilities = {};

  if (side === "attack") {
    const carrierPick = picks.find((p) => ["Osa", "Sens", "Gridlock", "Rauora"].includes(p.opName)) ??
      picks.find((p) => ["Thermite", "Hibana", "Ace"].includes(p.opName)) ??
      picks.find((p) => p.playerId === "azusa_cooper09") ?? picks[0];
    resp.defuserCarrier = carrierPick?.playerLabel;

    const dronePick = picks.find((p) => ["Thatcher", "Zero", "Twitch", "Brava", "IQ", "Lion", "Dokkaebi"].includes(p.opName)) ??
      picks.find((p) => p.playerId === "chango_nocturno") ?? picks[0];
    resp.primaryDrone = dronePick?.playerLabel;

    const firstEntryPick = picks.find((p) => ["Ash", "Zofia", "Deimos", "Buck", "Iana", "Amaru", "Nøkk", "Blitz"].includes(p.opName)) ??
      picks.find((p) => p.playerId === "el_notorious") ?? picks[0];
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

function evaluateTacticalWarnings(picks: PlayerPick[], side: Side): TacticalWarning[] {
  const warnings: TacticalWarning[] = [];
  const opNames = picks.map((p) => p.opName);

  if (side === "attack") {
    const structuralCount = opNames.filter((n) => ["Thermite", "Thatcher", "Ace", "Hibana"].includes(n)).length;
    if (structuralCount >= 3) {
      warnings.push({ id: "no-entry-pressure", severity: "high", message: "La composición tiene 3 soportes estructurales. Abre la pared pero carece de agresión para tomar sitio." });
    }

    const hasShield = picks.some((p) => p.playerId === "azusa_cooper09" && ["Montagne", "Blitz"].includes(p.opName));
    if (hasShield) {
      warnings.push({ id: "isolated-shield", severity: "medium", message: "El escudo de Azusa requiere avanzar pegado con un compañero preparado para tradear disparos." });
    }
  } else {
    const passiveAnchors = picks.filter((p) => ["Doc", "Rook", "Tachanka", "Maestro", "Echo", "Castle"].includes(p.opName)).length;
    if (passiveAnchors >= 3) {
      warnings.push({ id: "passive-defense", severity: "high", message: "Los 3 defensores dependen de quedarse encerrados en el objetivo sin control del mapa ni roaming." });
    }
  }
  return warnings;
}

function calculateConfidence(picks: PlayerPick[], siteReqs: string[], warnings: TacticalWarning[], explicitSynergy?: any): ConfidenceInfo {
  const reasons: string[] = [];
  let scorePoints = 85;

  const coveredReqs = siteReqs.filter((req) => picks.some((p) => p.operatorProfile.roles.includes(req as any)));

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

const explicitSynergiesList: any[] = (synergiesRaw as any).explicitSynergies ?? [];

function findExplicitSynergy(picks: PlayerPick[], side: Side) {
  const opNames = picks.map((p) => p.opName);
  return explicitSynergiesList.find((s: any) => s.side === side && s.operators.every((op: string) => opNames.includes(op)));
}

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
  observedDefenseIds?: string[],
  currentSiteName?: string
): PlayerPick[] {
  const rng = seededRandom(seedStr);
  const bannedSet = new Set((bannedOps || []).map((b) => b.toLowerCase()));
  const isBanned = (opName: string) => bannedSet.has(opName.toLowerCase());

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
    const tryouts = (side === "attack" ? pibe.tryoutAttack : pibe.tryoutDefense).filter((t) => !isBanned(t.operatorId));

    let chosenOpName: string = "";
    let backupOpName: string | undefined = undefined;
    let isMain = false;
    let isTryout = false;
    let developmentGoal: string | undefined = undefined;

    if (isBreathingPlayer && tryouts.length > 0) {
      const avail = tryouts.filter((t) => !usedOps.has(t.operatorId));
      if (avail.length > 0) {
        const picked = avail[Math.floor(rng() * avail.length)];
        chosenOpName = picked.operatorId;
        isTryout = true;
        developmentGoal = picked.developmentGoal;
      }
    }

    if (!chosenOpName) {
      // Ampliar el pool de candidatos evaluando mains primarios, roles secundarios y condicionales del mapa
      const primaryMains = side === "attack" ? pibe.attackMains : pibe.defenseMains;
      const siteStrat = matchMap ? getSiteStrategy(matchMap, side, currentSiteName) : undefined;
      const pibeAsgn = siteStrat?.pibeAssignments.find((a) => a.pibeId === pibe.id);

      const mapPreferred = pibeAsgn?.recommendedOps?.preferred || [];
      const mapConditional = pibeAsgn?.recommendedOps?.conditional || [];
      const mapTryouts = pibeAsgn?.recommendedOps?.tryout || [];
      const mapAvoid = new Set((pibeAsgn?.recommendedOps?.avoidForSite || []).map((o) => o.toLowerCase()));
      const playerAvoid = new Set((pibe.avoidOperators || []).map((o) => o.toLowerCase()));

      const candidateSet = new Set<string>([
        ...primaryMains,
        ...(pibe.comfortOperators || []),
        ...mapPreferred,
        ...mapConditional,
        ...mapTryouts,
      ]);

      // Incluir operadores del pool general que coincidan con roles secundarios o tengan alta afinidad
      const secRoles = pibe.identity.secondaryRoles || [];
      fullPool.forEach((op) => {
        const prof = normalizeOperator(op.name);
        const opRoles = prof.roles || [];
        const matchesSecRole = opRoles.some((r: string) => secRoles.includes(r));
        const highAffinity = opRoles.some((r: string) => (pibe.roleAffinity[r]?.score ?? 0) >= 0.65);
        if (matchesSecRole || highAffinity) {
          candidateSet.add(op.name);
        }
      });

      const candidateOps = Array.from(candidateSet).filter((opName) => {
        const lower = opName.toLowerCase();
        if (isBanned(lower)) return false;
        if (usedOps.has(opName)) return false;
        if (mapAvoid.has(lower)) return false;
        if (playerAvoid.has(lower)) return false;
        return true;
      });

      if (candidateOps.length > 0) {
        const scoredCandidates = candidateOps
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
              observedDefenseCounters,
              idx + 1,
              currentSiteName
            );
            const isPrimary = primaryMains.includes(opName);
            const mainBonus = isPrimary ? 8 : 0;
            // Jitter sensible al re-sortear (±12 pts) para alternar entre candidatos top manteninendo coherencia táctica
            const jitter = (rng() * 24 - 12);
            return { opName, score, totalScore: score + mainBonus + jitter, isPrimary };
          })
          .sort((a, b) => b.totalScore - a.totalScore);

        if (strategy === "safe" && scoredCandidates.length > 1) {
          chosenOpName = scoredCandidates[1].opName;
          backupOpName = scoredCandidates[0].opName;
        } else {
          chosenOpName = scoredCandidates[0].opName;
          backupOpName = scoredCandidates[1]?.opName || scoredCandidates[2]?.opName;
        }
        isMain = primaryMains.includes(chosenOpName);
      } else {
        const pool = fullPool.filter((op) => !usedOps.has(op.name) && !isBanned(op.name));
        const picked = (pool.length > 0 ? pool : fullPool)[Math.floor(rng() * (pool.length > 0 ? pool.length : fullPool.length))];
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
    const { score, explanation, trackerHighlight, scoreBreakdown } = scoreAndExplainPick(
      prof,
      pibe,
      siteReqs,
      squadOpsSoFar,
      squadRolesSoFar,
      matchMap,
      tacticalNeeds,
      observedDefenseCounters,
      idx + 1,
      currentSiteName
    );

    squadOpsSoFar.push(prof);
    for (const r of prof.roles) squadRolesSoFar.add(r);

    const coversReq = prof.roles.some((r) => siteReqs.includes(r));
    const coveredRole = prof.roles.find((r) => siteReqs.includes(r));

    const siteStrat = matchMap ? getSiteStrategy(matchMap, side) : undefined;
    const pibeAsgn = siteStrat?.pibeAssignments.find((a) => a.pibeId === pibe.id);

    picks.push({
      playerLabel: pibe.displayName,
      playerId: pibe.id,
      opName: chosenOpName,
      backupOpName,
      trackerHighlight,
      operatorProfile: prof,
      role: pibeAsgn?.role || ((ROLE_LABELS as Record<string, string>)[prof.roles[0]] ?? prof.roles[0]),
      isMain,
      isTryout,
      isBreathing: isBreathingPlayer,
      pickOrderNumber: idx + 1,
      coversRequirement: coversReq,
      coveredRole: coveredRole ? (ROLE_LABELS as Record<string, string>)[coveredRole] : undefined,
      developmentGoal,
      tacticalTask: pibeAsgn?.taskDescription,
      mapStrategyRole: pibeAsgn?.role,
      explanation,
      scoreBreakdown,
      score
    });
  });

  return picks;
}

export function getPibesRecommendations(
  side: Side,
  activePibes: PibeProfile[],
  currentSite?: { name?: string; requirements?: { attack?: string[]; defense?: string[] } },
  currentRoundNum: number = 1,
  matchMap: string = "Clubhouse",
  bannedOps?: string[],
  selectedRouteId?: string,
  observedDefenseIds?: string[],
  seedModifier: number = 0
): RecommendationEngineOutput {
  const fullPool = side === "attack" ? attackers : defenders;
  const siteReqs: string[] = currentSite?.requirements?.[side === "attack" ? "attack" : "defense"] ?? [];

  const siteKey = currentSite?.name ?? "any_site";
  const pibesKey = activePibes.map((p) => p.id).join("_");
  const bansKey = (bannedOps || []).sort().join("_");
  const routeKey = selectedRouteId || "auto";
  const obsKey = (observedDefenseIds || []).sort().join("_");
  const rngSeed = `${side}_${matchMap}_${siteKey}_${currentRoundNum}_${pibesKey}_${bansKey}_${routeKey}_${obsKey}_mod${seedModifier}`;

  const { orderedPibes, reason: orderReason } = determineSquadOrder(activePibes, side);

  const isMatchPoint = currentRoundNum >= 6;
  const isScheduledBreathing = !isMatchPoint && currentRoundNum > 0 && currentRoundNum % 3 === 0;

  const siteName = currentSite?.name;
  const primaryPicks = generateSquadPicks(orderedPibes, side, siteReqs, fullPool, "primary", rngSeed + "_primary", 0, matchMap, bannedOps, selectedRouteId, observedDefenseIds, siteName);
  const primaryWarnings = evaluateTacticalWarnings(primaryPicks, side);
  const explicitSynergy = findExplicitSynergy(primaryPicks, side);

  const primaryRecommendation: SquadRecommendation = {
    title: "Recomendación Principal (Máxima Sinergia)",
    picks: primaryPicks,
    pickOrder: orderedPibes.map((p) => p.displayName),
    orderReason,
    trioPlan: explicitSynergy?.plan?.setup ? `${explicitSynergy.plan.setup} ${explicitSynergy.plan.execute}` : primaryPicks[0]?.operatorProfile?.trio_plan || "Coordinar brecha, toma de espacio y plantado seguro.",
    duoPlan: explicitSynergy?.plan?.setup || primaryPicks[0]?.operatorProfile?.duo_plan,
    responsibilities: assignSquadResponsibilities(primaryPicks, side),
    warnings: primaryWarnings,
    confidence: calculateConfidence(primaryPicks, siteReqs, primaryWarnings, explicitSynergy),
    breathingType: "none",
  };

  const safePicks = generateSquadPicks(orderedPibes, side, siteReqs, fullPool, "safe", rngSeed + "_safe", 0, matchMap, bannedOps, selectedRouteId, observedDefenseIds, siteName);
  const safeWarnings = evaluateTacticalWarnings(safePicks, side);
  const safeRecommendation: SquadRecommendation = {
    title: "Variante Segura (Estructura Estable)",
    picks: safePicks,
    pickOrder: orderedPibes.map((p) => p.displayName),
    orderReason: "Composición de respaldo con alta estabilidad y menor riesgo operativo.",
    trioPlan: safePicks[0]?.operatorProfile?.trio_plan || "Mantener estructura sólida de sitio y soporte.",
    duoPlan: safePicks[0]?.operatorProfile?.duo_plan,
    responsibilities: assignSquadResponsibilities(safePicks, side),
    warnings: safeWarnings,
    confidence: calculateConfidence(safePicks, siteReqs, safeWarnings),
    breathingType: "none",
  };

  let breathingRecommendation: SquadRecommendation | undefined = undefined;

  if (isScheduledBreathing || activePibes.some((p) => (side === "attack" ? p.tryoutAttack : p.tryoutDefense).length > 0)) {
    const breathingIndex = (currentRoundNum / 3 - 1) % orderedPibes.length;
    const breathingPicks = generateSquadPicks(orderedPibes, side, siteReqs, fullPool, "breathing", rngSeed + "_breathing", breathingIndex, matchMap, bannedOps, selectedRouteId, observedDefenseIds, siteName);
    const breathingWarnings = evaluateTacticalWarnings(breathingPicks, side);

    breathingRecommendation = {
      title: "Variante de Respiración / Tryout",
      picks: breathingPicks,
      pickOrder: orderedPibes.map((p) => p.displayName),
      orderReason: "Rotación táctica para evitar volver la estrategia del squad predecible.",
      trioPlan: breathingPicks.find((p) => p.developmentGoal)?.developmentGoal ? `Objetivo de Desarrollo: ${breathingPicks.find((p) => p.developmentGoal)?.developmentGoal}` : "Variación de roles para probar alternativas de combate.",
      responsibilities: assignSquadResponsibilities(breathingPicks, side),
      warnings: breathingWarnings,
      confidence: calculateConfidence(breathingPicks, siteReqs, breathingWarnings),
      breathingType: isScheduledBreathing ? "scheduled" : "adaptive",
      breathingReason: isScheduledBreathing ? "Rotación programada de ronda 3 para evitar previsibilidad." : "Adaptación estratégica de squad.",
    };
  }

  return {
    primary: primaryRecommendation,
    safeVariant: safeRecommendation,
    breathingVariant: breathingRecommendation,
  };
}

export function getStandardRecommendations(side: Side, count: number): PlayerPick[] {
  const pool = side === "attack" ? attackers : defenders;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, count);

  return picked.map((op, idx) => ({
    playerLabel: count === 1 ? "Tu Pick" : `Jugador ${idx + 1}`,
    playerId: `player_${idx + 1}`,
    opName: op.name,
    operatorProfile: normalizeOperator(op.name),
    role: "flex",
    pickOrderNumber: idx + 1,
    scoreBreakdown: { operatorComfort: 0, roleAffinity: 0, compositionNeed: 0, trackerMapPerformance: 0, factosMapContext: 0, activeSupportTransition: 0, pickOrderContext: 0, avoidPatternPenalty: 0, penalties: 0 },
    score: 50,
    explanation: { positive: ["Pick aleatorio estándar"], negative: [], warnings: [] },
  }));
}
