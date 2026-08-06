import { type OperatorProfile, type PibeProfile, type PlayerPick, type SquadResponsibilities, type TacticalWarning, type ConfidenceInfo, type SquadRecommendation, type RecommendationEngineOutput } from "./types";
import { type Side, attackers, defenders } from "../catalog";
import { type TacticalNeedId, type AttackSiteProfile, getAttackSiteProfile } from "../siteTactics";
import { ROLE_LABELS } from "../roles";
import { buildPibeProfiles, normalizeOperator } from "./loader";
import { scoreAndExplainPick } from "./scoring";
import { determineSquadOrder } from "./synergies";
import { getSiteStrategy } from "../mapStrategies";
import synergiesRaw from "../synergies.json";
import { planTacticalComposition } from "./composition";
import { getPlayerTop4MostPlayed, getPlayerTop4WinRate, getOperatorPlayerStat, getPlayerExperimentalOps } from "../operatorPlayerStats";

export const DEFAULT_PIBES = buildPibeProfiles();

function buildNeutralProfiles(count: number): PibeProfile[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `slot_${index + 1}`,
    displayName: `Jugador ${index + 1}`,
    tag: `Slot ${index + 1}`,
    identity: {
      summary: "Slot táctico sin perfil personal",
      primaryRoles: [],
      secondaryRoles: [],
      postUtilityRole: [],
      preferredTempo: "",
      preferredPosition: [],
      playstyleTags: [],
    },
    roleAffinity: {},
    identityOperators: [],
    comfortOperators: [],
    tryoutAttack: [],
    tryoutDefense: [],
    avoidOperators: [],
    attackMains: [],
    defenseMains: [],
    attackRoles: [],
    defenseRoles: [],
    mapPerformance: { attack: {}, defense: {} },
    pickOrder: {
      attack: { preferredPosition: index + 1, reason: "Orden táctico neutro", flexible: true },
      defense: { preferredPosition: index + 1, reason: "Orden táctico neutro", flexible: true },
    },
    activeSupport: {
      attack: { requiredFunctions: [], preferredTransitions: [], avoidPatterns: [] },
      defense: { requiredFunctions: [], preferredTransitions: [], avoidPatterns: [] },
    },
    tacticalGuidelines: {
      attack: { do: [], avoid: [] },
      defense: { do: [], avoid: [] },
      general: { do: [], avoid: [] },
    },
  }));
}

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

function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];
  return items.flatMap((item, index) =>
    permutations([...items.slice(0, index), ...items.slice(index + 1)]).map((rest) => [item, ...rest])
  );
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
  strategy: "primary" | "safe" | "breathing" | "experimental",
  seedStr: string,
  breathingIndex: number = 0,
  matchMap?: string,
  bannedOps?: string[],
  selectedRouteId?: string,
  observedDefenseIds?: string[],
  currentSiteName?: string,
  plannedOperatorNames?: string[],
  plannedOperatorTasks?: Record<string, string>
): PlayerPick[] {
  const rng = seededRandom(seedStr);
  const operatorKey = (value: string) => value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
  const bannedSet = new Set((bannedOps || []).map(operatorKey));
  const isBanned = (opName: string) => bannedSet.has(operatorKey(opName));
  const allowedPoolByKey = new Map(fullPool.map((op) => [operatorKey(op.name), op.name]));
  const allowedName = (opName: string): string | undefined => allowedPoolByKey.get(operatorKey(opName));

  const siteProfile = side === "attack" && matchMap ? getAttackSiteProfile(matchMap, currentSiteName || "") : null;
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

  const plannedProfiles = (plannedOperatorNames || [])
    .map((name) => normalizeOperator(name))
    .filter((profile) => allowedName(profile.name) && !isBanned(profile.name));
  let bestAssignment = plannedProfiles.slice(0, orderedPibes.length);
  let bestAssignmentScore = Number.NEGATIVE_INFINITY;

  if (plannedProfiles.length === orderedPibes.length) {
    permutations(plannedProfiles).forEach((assignment) => {
      const assignmentScore = assignment.reduce((total, profile, index) => {
        const pibe = orderedPibes[index];
        const result = scoreAndExplainPick(
          { ...profile, side },
          pibe,
          siteReqs,
          [],
          new Set(),
          matchMap,
          tacticalNeeds,
          observedDefenseCounters,
          index + 1,
          currentSiteName
        );
        const mains = (side === "attack" ? pibe.attackMains : pibe.defenseMains) || [];
        const comfort = pibe.comfortOperators || [];
        const identity = pibe.identityOperators || [];
        const tryouts = (side === "attack" ? pibe.tryoutAttack : pibe.tryoutDefense).map((t: any) => typeof t === "string" ? t : t.operatorId || t.operator || "");

        const opKey = operatorKey(profile.name);
        const isMain = mains.some((m) => operatorKey(m) === opKey);
        const isComfort = comfort.some((c) => operatorKey(c) === opKey);
        const isIdentity = identity.some((i) => operatorKey(i) === opKey);
        const isTryout = tryouts.some((t: any) => operatorKey(t) === opKey);
        const isAvoided = (pibe.avoidOperators || []).some((a) => operatorKey(a) === opKey);

        const pStat = getOperatorPlayerStat(pibe.id, profile.name);
        const matches = pStat?.matches ?? 0;
        const winRate = pStat?.winRate ?? 0;

        let fitAdjustment = 0;

        if (isAvoided) {
          fitAdjustment -= 500;
        } else {
          if (isIdentity || isComfort || isMain) {
            fitAdjustment += 120;
          } else if (isTryout) {
            fitAdjustment += 30;
          } else if (matches === 0) {
            fitAdjustment -= 250;
          }

          if (matches >= 100) {
            fitAdjustment += 60;
          } else if (matches >= 30) {
            fitAdjustment += 40;
          } else if (matches >= 10) {
            fitAdjustment += 20;
          }

          if (matches >= 10 && winRate >= 55) {
            fitAdjustment += 30;
          } else if (matches >= 10 && winRate < 40) {
            fitAdjustment -= 30;
          }

          if (pStat && matches > 0 && winRate === 0) {
            fitAdjustment -= 200;
          }
        }

        return total + result.score + fitAdjustment;
      }, 0);
      if (assignmentScore > bestAssignmentScore) {
        bestAssignmentScore = assignmentScore;
        bestAssignment = assignment;
      }
    });
  }

  const plannedByPibe = new Map<string, string>();
  orderedPibes.forEach((pibe, index) => {
    const operatorName = bestAssignment[index]?.name;
    if (operatorName) plannedByPibe.set(pibe.id, operatorName);
  });

  const usedOps = new Set<string>();
  const squadRolesSoFar = new Set<string>();
  const squadOpsSoFar: OperatorProfile[] = [];
  const picks: PlayerPick[] = [];

  orderedPibes.forEach((pibe, idx) => {
    const isBreathingPlayer = strategy === "breathing" && idx === Math.abs(Math.floor(breathingIndex) % orderedPibes.length);
    const mains = (side === "attack" ? pibe.attackMains : pibe.defenseMains)
      .flatMap((name) => {
        const canonical = allowedName(name);
        return canonical && !isBanned(canonical) ? [canonical] : [];
      });
    const tryouts = (side === "attack" ? pibe.tryoutAttack : pibe.tryoutDefense)
      .flatMap((tryout: any) => {
        const rawName = tryout.operatorId || tryout.operator;
        const canonical = rawName ? allowedName(rawName) : undefined;
        return canonical && !isBanned(canonical) ? [{ ...tryout, operatorId: canonical }] : [];
      });

    let chosenOpName: string = "";
    let backupOpName: string | undefined = undefined;
    let isMain = false;
    let isTryout = false;
    let developmentGoal: string | undefined = undefined;

    const plannedOpName = plannedByPibe.get(pibe.id);
    let validPlannedOpName: string | undefined = undefined;
    if (plannedOpName) {
      const isAvoided = (pibe.avoidOperators || []).some((a) => operatorKey(a) === operatorKey(plannedOpName));
      const pibeStat = getOperatorPlayerStat(pibe.id, plannedOpName);
      // Playbook-planned ops are always honoured — only hard-block avoided ops and true 0% WR
      const isZeroWinRate = Boolean(pibeStat && pibeStat.matches > 0 && pibeStat.winRate === 0);
      if (!isAvoided && !isZeroWinRate && !usedOps.has(plannedOpName)) {
        validPlannedOpName = plannedOpName;
      }
    }
    const assignedFromPlan = Boolean(validPlannedOpName);

    if (validPlannedOpName) {
      chosenOpName = validPlannedOpName;
      isMain = mains.some((main) => operatorKey(main) === operatorKey(validPlannedOpName));
      const matchingTryout = tryouts.find((tryout: any) => operatorKey(tryout.operatorId || tryout.operator) === operatorKey(validPlannedOpName));
      isTryout = strategy === "breathing" && Boolean(matchingTryout);
      developmentGoal = isTryout ? matchingTryout?.developmentGoal : undefined;
    }

    if (isBreathingPlayer && !plannedOpName && tryouts.length > 0) {
      const avail = tryouts.filter((t) => !usedOps.has(t.operatorId));
      if (avail.length > 0) {
        const picked = avail[Math.floor(rng() * avail.length)];
        chosenOpName = picked.operatorId;
        isTryout = true;
        developmentGoal = picked.developmentGoal;
      }
    }

    if (!chosenOpName) {
      const primaryMains = mains;
      const siteStrat = matchMap ? getSiteStrategy(matchMap, side, currentSiteName) : undefined;
      const pibeAsgn = siteStrat?.pibeAssignments.find((a) => a.pibeId === pibe.id);

      const mapPreferred = pibeAsgn?.recommendedOps?.preferred || [];
      const mapConditional = pibeAsgn?.recommendedOps?.conditional || [];
      const mapTryouts = pibeAsgn?.recommendedOps?.tryout || [];
      const mapAvoid = new Set((pibeAsgn?.recommendedOps?.avoidForSite || []).map((o) => o.toLowerCase()));
      const playerAvoid = new Set((pibe.avoidOperators || []).map((o) => o.toLowerCase()));

      const candidateSet = new Set<string>();
      let strategyBonusOps = new Set<string>();

      if (strategy === "primary") {
        const top4Used = getPlayerTop4MostPlayed(pibe.id, side, pibe.avoidOperators, bannedOps);
        top4Used.forEach((opName) => {
          const canonical = allowedName(opName);
          if (canonical) {
            candidateSet.add(canonical);
            strategyBonusOps.add(canonical);
          }
        });
      } else if (strategy === "safe") {
        const top4Win = getPlayerTop4WinRate(pibe.id, side, pibe.avoidOperators, bannedOps);
        top4Win.forEach((opName) => {
          const canonical = allowedName(opName);
          if (canonical) {
            candidateSet.add(canonical);
            strategyBonusOps.add(canonical);
          }
        });
      } else if (strategy === "breathing") {
        const topUsed = new Set(getPlayerTop4MostPlayed(pibe.id, side, pibe.avoidOperators, bannedOps).map(operatorKey));
        const topWin = new Set(getPlayerTop4WinRate(pibe.id, side, pibe.avoidOperators, bannedOps).map(operatorKey));
        const tryoutOps = (side === "attack" ? pibe.tryoutAttack : pibe.tryoutDefense).map((t: any) => t.operatorId || t.operator);
        tryoutOps.forEach((opName) => {
          const key = opName ? operatorKey(opName) : "";
          if (key && !topUsed.has(key) && !topWin.has(key)) {
            const canonical = allowedName(opName);
            if (canonical) {
              candidateSet.add(canonical);
              strategyBonusOps.add(canonical);
            }
          }
        });
      } else if (strategy === "experimental") {
        const expOps = getPlayerExperimentalOps(pibe.id, side, pibe.avoidOperators, bannedOps);
        expOps.forEach((opName) => {
          const canonical = allowedName(opName);
          if (canonical) {
            candidateSet.add(canonical);
            strategyBonusOps.add(canonical);
          }
        });
      }

      [
        ...primaryMains,
        ...(pibe.comfortOperators || []),
        ...mapPreferred,
        ...mapConditional,
        ...mapTryouts,
      ].forEach((candidate) => {
        const canonical = allowedName(candidate);
        if (canonical) candidateSet.add(canonical);
      });

      const candidateOps = Array.from(candidateSet).filter((opName) => {
        const lower = opName.toLowerCase();
        if (isBanned(lower)) return false;
        if (usedOps.has(opName)) return false;
        if (mapAvoid.has(lower)) return false;
        if (playerAvoid.has(lower)) return false;
        const pStat = getOperatorPlayerStat(pibe.id, opName);
        // Only gate on stats when we actually have a real player stat record
        if (pStat !== undefined) {
          if ((strategy === "primary" || strategy === "safe") && (pStat.matches < 20 || pStat.winRate === 0)) return false;
          if (strategy === "experimental" && pStat.matches >= 20) return false;
        }
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
            const stratBonus = strategyBonusOps.has(opName) ? 25 : 0;
            const pStat = getOperatorPlayerStat(pibe.id, opName);
            const matches = pStat?.matches ?? 0;
            const winRate = pStat?.winRate ?? 0;
            return { opName, score, mainBonus, stratBonus, matches, winRate, isPrimary };
          })
          .sort((a, b) => {
            if (strategy === "primary") {
              if (b.matches !== a.matches) return b.matches - a.matches;
              return (b.score + b.stratBonus) - (a.score + a.stratBonus);
            } else if (strategy === "safe") {
              if (b.winRate !== a.winRate) return b.winRate - a.winRate;
              if (b.matches !== a.matches) return b.matches - a.matches;
              return (b.score + b.stratBonus) - (a.score + a.stratBonus);
            }
            return (b.score + b.stratBonus + b.mainBonus) - (a.score + a.stratBonus + a.mainBonus);
          });

        chosenOpName = scoredCandidates[0].opName;
        backupOpName = scoredCandidates[1]?.opName || scoredCandidates[2]?.opName;
        isMain = primaryMains.includes(chosenOpName);
      } else {
        const uniquePool = fullPool.filter((op) => !usedOps.has(op.name) && !isBanned(op.name));
        const reusablePool = fullPool.filter((op) => !isBanned(op.name));
        const pool = uniquePool.length > 0 ? uniquePool : reusablePool;
        const picked = pool[Math.floor(rng() * pool.length)];
        if (!picked) return;
        chosenOpName = picked.name;
      }
    }

    if (
      backupOpName &&
      (!allowedName(backupOpName) || isBanned(backupOpName) || operatorKey(backupOpName) === operatorKey(chosenOpName))
    ) {
      backupOpName = undefined;
    }

    if (!backupOpName && !assignedFromPlan) {
      backupOpName = fullPool.find(
        (op) => !usedOps.has(op.name) && !isBanned(op.name) && operatorKey(op.name) !== operatorKey(chosenOpName)
      )?.name;
    }

    // Final invariant: no profile, map strategy or future data source may
    // inject an operator from the opposite side.
    if (!allowedName(chosenOpName) || isBanned(chosenOpName)) {
      const uniqueFallbacks = fullPool.filter((op) => !usedOps.has(op.name) && !isBanned(op.name));
      const reusableFallbacks = fullPool.filter((op) => !isBanned(op.name));
      const fallback = uniqueFallbacks[0] ?? reusableFallbacks[0];
      if (!fallback) return;
      chosenOpName = fallback.name;
      backupOpName = undefined;
      isMain = false;
      isTryout = false;
      developmentGoal = undefined;
    }

    if (
      backupOpName &&
      (!allowedName(backupOpName) || isBanned(backupOpName) || operatorKey(backupOpName) === operatorKey(chosenOpName))
    ) {
      backupOpName = fullPool.find(
        (op) => !usedOps.has(op.name) && !isBanned(op.name) && operatorKey(op.name) !== operatorKey(chosenOpName)
      )?.name;
    }

    usedOps.add(chosenOpName);
    const prof = { ...normalizeOperator(chosenOpName), side };
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

    const siteStrat = matchMap ? getSiteStrategy(matchMap, side, currentSiteName) : undefined;
    const pibeAsgn = siteStrat?.pibeAssignments.find((a) => a.pibeId === pibe.id);

    let altSourceOps: string[] = [];
    if (strategy === "primary") {
      altSourceOps = getPlayerTop4MostPlayed(pibe.id, side, pibe.avoidOperators, bannedOps);
    } else if (strategy === "safe") {
      altSourceOps = getPlayerTop4WinRate(pibe.id, side, pibe.avoidOperators, bannedOps);
    } else if (strategy === "experimental" || strategy === "breathing") {
      const topUsed = new Set(getPlayerTop4MostPlayed(pibe.id, side, pibe.avoidOperators, bannedOps).map(operatorKey));
      const topWin = new Set(getPlayerTop4WinRate(pibe.id, side, pibe.avoidOperators, bannedOps).map(operatorKey));
      altSourceOps = (side === "attack" ? pibe.tryoutAttack : pibe.tryoutDefense)
        .map((t: any) => typeof t === "string" ? t : t.operatorId || t.operator)
        .filter((op) => op && !topUsed.has(operatorKey(op)) && !topWin.has(operatorKey(op)));
    }
    if (altSourceOps.length === 0) {
      altSourceOps = [
        ...mains,
        ...(pibe.comfortOperators || []),
        ...((side === "attack" ? pibe.tryoutAttack : pibe.tryoutDefense).map((t: any) => t.operatorId || t.operator)),
      ];
    }

    picks.push({
      playerLabel: pibe.displayName,
      playerId: pibe.id,
      opName: chosenOpName,
      backupOpName,
      alternativeOps: Array.from(
        new Set(
          altSourceOps
            .map(allowedName)
            .filter((name): name is string => {
              if (!name) return false;
              const isAvoided = (pibe.avoidOperators || []).some((a) => a.toLowerCase() === name.toLowerCase());
              return operatorKey(name) !== operatorKey(chosenOpName) && !isBanned(name) && !usedOps.has(name) && !isAvoided;
            })
        )
      ).slice(0, 3),
      trackerHighlight,
      operatorProfile: prof,
      role: pibeAsgn?.role || ((ROLE_LABELS as Record<string, string>)[prof.roles[0]] ?? prof.roles[0]),
      isMain,
      isTryout,
      isBreathing: strategy === "breathing" && (isBreathingPlayer || isTryout),
      pickOrderNumber: idx + 1,
      coversRequirement: coversReq,
      coveredRole: coveredRole ? (ROLE_LABELS as Record<string, string>)[coveredRole] : undefined,
      developmentGoal,
      tacticalTask: plannedOperatorTasks?.[chosenOpName] ?? pibeAsgn?.taskDescription,
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
  const operatorKey = (value: string) => value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
  const bannedSet = new Set((bannedOps || []).map(operatorKey));
  const fullPool = (side === "attack" ? attackers : defenders).filter((op) => !bannedSet.has(operatorKey(op.name)));
  const siteReqs: string[] = currentSite?.requirements?.[side === "attack" ? "attack" : "defense"] ?? [];

  const siteKey = currentSite?.name ?? "any_site";
  const pibesKey = activePibes.map((p) => p.id).join("_");
  const bansKey = (bannedOps || []).sort().join("_");
  const routeKey = selectedRouteId || "auto";
  const obsKey = (observedDefenseIds || []).sort().join("_");
  const rngSeed = `${side}_${matchMap}_${siteKey}_${currentRoundNum}_${pibesKey}_${bansKey}_${routeKey}_${obsKey}_mod${seedModifier}`;
  const compositionSeed = `${side}_${matchMap}_${siteKey}_${currentRoundNum}_${bansKey}_${routeKey}_${obsKey}_mod${seedModifier}`;

  const { orderedPibes, reason: orderReason } = determineSquadOrder(activePibes, side);

  const isMatchPoint = currentRoundNum >= 6;
  const isScheduledBreathing = !isMatchPoint && currentRoundNum > 0 && currentRoundNum % 3 === 0;

  const siteName = currentSite?.name;

  // Build composition pool restricted strictly to operators played by active squad members (minus bans)
  const squadKnownKeys = new Set<string>();
  activePibes.forEach((pibe) => {
    const mains = side === "attack" ? pibe.attackMains : pibe.defenseMains;
    const comfort = pibe.comfortOperators || [];
    const tryouts = (side === "attack" ? pibe.tryoutAttack : pibe.tryoutDefense).map((t) => t.operatorId);
    [...mains, ...comfort, ...tryouts].forEach((op) => squadKnownKeys.add(operatorKey(op)));
  });

  const siteStratForPool = matchMap ? getSiteStrategy(matchMap, side, siteName) : undefined;
  if (siteStratForPool) {
    siteStratForPool.pibeAssignments.forEach((asgn) => {
      const recs = asgn.recommendedOps;
      if (recs) {
        [...(recs.preferred || []), ...(recs.conditional || []), ...(recs.tryout || [])].forEach((op) =>
          squadKnownKeys.add(operatorKey(op))
        );
      }
    });
  }

  const compositionPool = fullPool;

  const primaryPlan = planTacticalComposition({ side, pool: compositionPool, count: orderedPibes.length, siteReqs, strategy: "primary", seed: compositionSeed, seedModifier, matchMap, currentSiteName: siteName, selectedRouteId, observedDefenseIds });
  const primaryPicks = generateSquadPicks(orderedPibes, side, siteReqs, fullPool, "primary", rngSeed + "_primary", 0, matchMap, bannedOps, selectedRouteId, observedDefenseIds, siteName, primaryPlan.operatorNames, primaryPlan.operatorTasks);
  const primaryWarnings = evaluateTacticalWarnings(primaryPicks, side);
  const explicitSynergy = findExplicitSynergy(primaryPicks, side);

  const primaryRecommendation: SquadRecommendation = {
    title: "Recomendación Principal (Máxima Sinergia)",
    picks: primaryPicks,
    pickOrder: orderedPibes.map((p) => p.displayName),
    orderReason,
    trioPlan: explicitSynergy?.plan?.setup ? `${primaryPlan.summary} ${explicitSynergy.plan.setup} ${explicitSynergy.plan.execute}` : primaryPlan.summary,
    duoPlan: explicitSynergy?.plan?.setup || primaryPicks[0]?.operatorProfile?.duo_plan,
    responsibilities: assignSquadResponsibilities(primaryPicks, side),
    warnings: primaryWarnings,
    confidence: calculateConfidence(primaryPicks, siteReqs, primaryWarnings, explicitSynergy),
    tacticalComposition: primaryPlan,
    breathingType: "none",
  };

  const safePlan = planTacticalComposition({ side, pool: compositionPool, count: orderedPibes.length, siteReqs, strategy: "safe", seed: compositionSeed, seedModifier, matchMap, currentSiteName: siteName, selectedRouteId, observedDefenseIds, excludeLineups: [primaryPlan.operatorNames] });
  const safePicks = generateSquadPicks(orderedPibes, side, siteReqs, fullPool, "safe", rngSeed + "_safe", 0, matchMap, bannedOps, selectedRouteId, observedDefenseIds, siteName, safePlan.operatorNames, safePlan.operatorTasks);
  const safeWarnings = evaluateTacticalWarnings(safePicks, side);
  const safeRecommendation: SquadRecommendation = {
    title: "Variante Segura (Estructura Estable)",
    picks: safePicks,
    pickOrder: orderedPibes.map((p) => p.displayName),
    orderReason: "Composición de respaldo con alta estabilidad y menor riesgo operativo.",
    trioPlan: safePlan.summary,
    duoPlan: safePicks[0]?.operatorProfile?.duo_plan,
    responsibilities: assignSquadResponsibilities(safePicks, side),
    warnings: safeWarnings,
    confidence: calculateConfidence(safePicks, siteReqs, safeWarnings),
    tacticalComposition: safePlan,
    breathingType: "none",
  };

  const breathingIndex = Math.max(0, currentRoundNum - 1) % orderedPibes.length;
  const breathingPlan = planTacticalComposition({ side, pool: compositionPool, count: orderedPibes.length, siteReqs, strategy: "breathing", seed: compositionSeed, seedModifier, matchMap, currentSiteName: siteName, selectedRouteId, observedDefenseIds, excludeLineups: [primaryPlan.operatorNames, safePlan.operatorNames] });
  const breathingPicks = generateSquadPicks(orderedPibes, side, siteReqs, fullPool, "breathing", rngSeed + "_breathing", breathingIndex, matchMap, bannedOps, selectedRouteId, observedDefenseIds, siteName, breathingPlan.operatorNames, breathingPlan.operatorTasks);
  const breathingWarnings = evaluateTacticalWarnings(breathingPicks, side);

  const breathingRecommendation: SquadRecommendation = {
    title: "Variante Alternativa (Rotación Táctica)",
    picks: breathingPicks,
    pickOrder: orderedPibes.map((p) => p.displayName),
    orderReason: "Composición alternativa completa para cambiar el plan sin romper sus funciones.",
    trioPlan: breathingPlan.summary,
    responsibilities: assignSquadResponsibilities(breathingPicks, side),
    warnings: breathingWarnings,
    confidence: calculateConfidence(breathingPicks, siteReqs, breathingWarnings),
    tacticalComposition: breathingPlan,
    breathingType: isScheduledBreathing ? "scheduled" : "adaptive",
    breathingReason: isScheduledBreathing ? "Rotación programada de ronda 3 para evitar previsibilidad." : "Alternativa táctica disponible para re-sortear.",
  };

  const experimentalPlan = planTacticalComposition({ side, pool: compositionPool, count: orderedPibes.length, siteReqs, strategy: "experimental", seed: compositionSeed, seedModifier, matchMap, currentSiteName: siteName, selectedRouteId, observedDefenseIds, excludeLineups: [primaryPlan.operatorNames, safePlan.operatorNames, breathingPlan.operatorNames] });
  const experimentalPicks = generateSquadPicks(orderedPibes, side, siteReqs, fullPool, "experimental", rngSeed + "_experimental", 0, matchMap, bannedOps, selectedRouteId, observedDefenseIds, siteName, experimentalPlan.operatorNames, experimentalPlan.operatorTasks);
  const experimentalWarnings = evaluateTacticalWarnings(experimentalPicks, side);

  const experimentalRecommendation: SquadRecommendation = {
    title: "Variante Experimental (Alto Potencial / Niche)",
    picks: experimentalPicks,
    pickOrder: orderedPibes.map((p) => p.displayName),
    orderReason: "Composición experimental probando agentes de bajo WR/KD o de potencial oculto.",
    trioPlan: experimentalPlan.summary,
    responsibilities: assignSquadResponsibilities(experimentalPicks, side),
    warnings: experimentalWarnings,
    confidence: calculateConfidence(experimentalPicks, siteReqs, experimentalWarnings),
    tacticalComposition: experimentalPlan,
    breathingType: "none",
  };

  return {
    primary: primaryRecommendation,
    safeVariant: safeRecommendation,
    breathingVariant: breathingRecommendation,
    experimentalVariant: experimentalRecommendation,
  };
}

export function getAgnosticRecommendations(
  side: Side,
  count: 2 | 3,
  currentSite?: { name?: string; requirements?: { attack?: string[]; defense?: string[] } },
  currentRoundNum: number = 1,
  matchMap: string = "Clubhouse",
  selectedRouteId?: string,
  observedDefenseIds?: string[],
  seedModifier: number = 0
): RecommendationEngineOutput {
  return getPibesRecommendations(
    side,
    buildNeutralProfiles(count),
    currentSite,
    currentRoundNum,
    matchMap,
    [],
    selectedRouteId,
    observedDefenseIds,
    seedModifier
  );
}

export function getStandardRecommendations(side: Side, count: number, bannedOps: string[] = []): PlayerPick[] {
  const operatorKey = (value: string) => value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
  const bannedSet = new Set(bannedOps.map(operatorKey));
  const pool = (side === "attack" ? attackers : defenders).filter((op) => !bannedSet.has(operatorKey(op.name)));
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
