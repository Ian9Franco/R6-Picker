import { type Operator, type Side } from "../catalog";
import {
  getAttackSiteProfile,
  NEED_OPERATORS_MAP,
  TACTICAL_NEED_LABELS,
  type TacticalNeedId,
} from "../siteTactics";
import { ROLE_LABELS } from "../roles";
import {
  getPlaybookLineup,
  getPlaybookOperatorTask,
  getSiteSidePlaybook,
} from "../sitePlaybooks";
import { normalizeOperator } from "./loader";
import { type OperatorProfile, type TacticalCompositionPlan } from "./types";

export type CompositionStrategy = "primary" | "safe" | "breathing" | "experimental";

type PlannerInput = {
  side: Side;
  pool: Operator[];
  count: number;
  siteReqs: string[];
  strategy: CompositionStrategy;
  seed: string;
  seedModifier?: number;
  matchMap?: string;
  currentSiteName?: string;
  selectedRouteId?: string;
  observedDefenseIds?: string[];
  excludeLineups?: string[][];
};

function seededValue(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

function combinations<T>(items: T[], count: number): T[][] {
  const result: T[][] = [];
  const walk = (start: number, picked: T[]) => {
    if (picked.length === count) {
      result.push(picked);
      return;
    }
    for (let index = start; index <= items.length - (count - picked.length); index += 1) {
      walk(index + 1, [...picked, items[index]]);
    }
  };
  walk(0, []);
  return result;
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function buildContext(input: PlannerInput) {
  const profile = input.side === "attack" && input.matchMap
    ? getAttackSiteProfile(input.matchMap, input.currentSiteName || "")
    : null;
  const requiredNeeds: TacticalNeedId[] = [...(profile?.defaultNeeds.required ?? [])];
  const importantNeeds: TacticalNeedId[] = [...(profile?.defaultNeeds.important ?? [])];
  const optionalNeeds: TacticalNeedId[] = [...(profile?.defaultNeeds.optional ?? [])];
  const directCounters: string[] = [];
  const playbook = getSiteSidePlaybook(input.matchMap, input.currentSiteName, input.side);
  const preferredLineup = getPlaybookLineup(
    input.matchMap,
    input.currentSiteName,
    input.side,
    input.count,
    input.strategy === "experimental" ? "breathing" : input.strategy,
    input.pool.map((operator) => operator.name)
  ) ?? [];

  if (profile && input.selectedRouteId && input.selectedRouteId !== "auto") {
    const route = profile.attackRoutes.find((candidate) => candidate.id === input.selectedRouteId);
    if (route) {
      requiredNeeds.push(...route.requiredNeeds);
      importantNeeds.push(...route.usefulNeeds);
    }
  }

  if (profile && input.observedDefenseIds?.length) {
    profile.commonDefenses.forEach((defense) => {
      if (input.observedDefenseIds!.includes(defense.id)) {
        requiredNeeds.push(...defense.createsNeeds);
        directCounters.push(...defense.counters);
      }
    });
  }

  return {
    requiredNeeds: unique(requiredNeeds),
    importantNeeds: unique(importantNeeds),
    optionalNeeds: unique(optionalNeeds),
    directCounters: unique(directCounters),
    playbook,
    preferredLineup,
  };
}

function coversNeed(profiles: OperatorProfile[], need: TacticalNeedId): boolean {
  const operators = NEED_OPERATORS_MAP[need] ?? [];
  return profiles.some((profile) => operators.includes(profile.name));
}

function scoreComposition(
  profiles: OperatorProfile[],
  input: PlannerInput,
  context: ReturnType<typeof buildContext>
) {
  const roles = unique(profiles.flatMap((profile) => profile.roles));
  const provides = new Set(profiles.flatMap((profile) => [...profile.roles, ...profile.provides]));
  const requiredRoles = unique([
    ...input.siteReqs,
    ...(context.playbook?.requiredRoles ?? []),
  ]);
  let score = 20;

  if (context.preferredLineup.length > 0) {
    const preferred = new Set(context.preferredLineup);
    const matchedPicks = profiles.filter((profile) => preferred.has(profile.name)).length;
    score += matchedPicks * 70;
    if (matchedPicks === profiles.length && matchedPicks === context.preferredLineup.length) {
      score += 300;
    }
  }

  if (context.playbook?.suggestedPicks?.length) {
    const suggestedNames = new Set(context.playbook.suggestedPicks.map((p) => p.operator));
    const matchedSuggested = profiles.filter((profile) => suggestedNames.has(profile.name)).length;
    score += matchedSuggested * 35;
  }

  const coveredRequirements = requiredRoles.filter((role) => roles.includes(role as never));
  score += coveredRequirements.length * 24;
  score -= (requiredRoles.length - coveredRequirements.length) * 18;

  const coveredRequiredNeeds = context.requiredNeeds.filter((need) => coversNeed(profiles, need));
  const coveredImportantNeeds = context.importantNeeds.filter((need) => coversNeed(profiles, need));
  const coveredOptionalNeeds = context.optionalNeeds.filter((need) => coversNeed(profiles, need));
  score += coveredRequiredNeeds.length * 22;
  score -= (context.requiredNeeds.length - coveredRequiredNeeds.length) * 16;
  score += coveredImportantNeeds.length * 10;
  score += coveredOptionalNeeds.length * 4;
  score += context.directCounters.filter((name) => profiles.some((profile) => profile.name === name)).length * 14;

  if (input.side === "attack") {
    const hasBreach = roles.includes("hard-breach");
    const hasEnable = roles.some((role) => ["anti-gadget", "intel", "soft-breach"].includes(role));
    const hasExecute = roles.some((role) => ["entry-frag", "zone-control", "support"].includes(role));
    score += hasBreach ? 22 : -24;
    score += hasEnable ? 14 : -12;
    score += hasExecute ? 14 : -12;
    if (profiles.every((profile) => profile.position === "backline")) score -= 16;
  } else {
    const hasAnchor = roles.includes("objective-anchor");
    const hasDenial = roles.some((role) => ["anti-gadget-def", "access-denial", "zone-deny"].includes(role));
    const hasResponse = roles.some((role) => ["intel-def", "trap-setter", "roamer"].includes(role));
    score += hasAnchor ? 22 : -22;
    score += hasDenial ? 15 : -12;
    score += hasResponse ? 13 : -10;
    if (profiles.every((profile) => profile.roles.includes("roamer"))) score -= 22;
  }

  score += Math.min(18, roles.length * 3);
  profiles.forEach((profile) => {
    score += profile.needs.filter((need) => provides.has(need)).length * 4;
    score += profile.best_with_roles.filter((role) => roles.includes(role as never)).length * 3;
  });

  const positions = unique(profiles.map((profile) => profile.position));
  score += positions.length * 3;

  if (input.strategy === "safe") {
    score += profiles.reduce((total, profile) => {
      const difficultyKey = String(profile.difficulty);
      const difficulty = difficultyKey === "easy" || difficultyKey === "low" ? 7 : difficultyKey === "medium" ? 3 : -4;
      const structure = ["structured", "flexible"].includes(profile.tempo) ? 3 : 0;
      return total + difficulty + structure;
    }, 0);
  } else if (input.strategy === "breathing") {
    score += profiles.filter((profile) => profile.tempo === "adaptive" || profile.tempo === "fast").length * 3;
    score += seededValue(`${input.seed}:${profiles.map((profile) => profile.name).join("|")}`) * 9;
  } else {
    score += seededValue(`${input.seed}:${profiles.map((profile) => profile.name).join("|")}`) * 2;
  }

  return {
    score,
    roles,
    coveredRequirements,
    coveredNeeds: unique([...coveredRequiredNeeds, ...coveredImportantNeeds, ...coveredOptionalNeeds]),
    missingNeeds: context.requiredNeeds.filter((need) => !coveredRequiredNeeds.includes(need)),
  };
}

export function planTacticalComposition(input: PlannerInput): TacticalCompositionPlan {
  const count = Math.max(1, Math.min(input.count, input.pool.length));
  const context = buildContext(input);
  const profiles = input.pool.map((operator) => normalizeOperator(operator.name));
  const ranked = combinations(profiles, count)
    .map((operators) => ({ operators, result: scoreComposition(operators, input, context) }))
    .sort((a, b) => b.result.score - a.result.score || a.operators.map((op) => op.name).join().localeCompare(b.operators.map((op) => op.name).join()));
  const pickIndex = input.seedModifier ?? 0;
  let candidatePool = ranked;

  if (input.excludeLineups && input.excludeLineups.length > 0) {
    const isExactMatch = (candidateOps: OperatorProfile[], excluded: string[]) => {
      const candidateNames = new Set(candidateOps.map((op) => op.name.toLowerCase()));
      return (
        excluded.length === candidateOps.length &&
        excluded.every((name) => candidateNames.has(name.toLowerCase()))
      );
    };

    const countOverlap = (candidateOps: OperatorProfile[], excluded: string[]) => {
      const candidateNames = new Set(candidateOps.map((op) => op.name.toLowerCase()));
      return excluded.filter((name) => candidateNames.has(name.toLowerCase())).length;
    };

    const nonExact = ranked.filter(
      ({ operators }) => !input.excludeLineups!.some((ex) => isExactMatch(operators, ex))
    );

    if (nonExact.length > 0) {
      nonExact.sort((a, b) => {
        const maxOverlapA = Math.max(...input.excludeLineups!.map((ex) => countOverlap(a.operators, ex)));
        const maxOverlapB = Math.max(...input.excludeLineups!.map((ex) => countOverlap(b.operators, ex)));
        if (maxOverlapA !== maxOverlapB) return maxOverlapA - maxOverlapB;
        return b.result.score - a.result.score;
      });
      candidatePool = nonExact;
    }
  }

  if (context.preferredLineup.length > 0) {
    const prefSet = new Set(context.preferredLineup.map((n) => n.toLowerCase()));
    const playbookCandidate = candidatePool.find(
      ({ operators }) =>
        operators.length === context.preferredLineup.length &&
        operators.every((op) => prefSet.has(op.name.toLowerCase()))
    );
    if (playbookCandidate) {
      candidatePool = [playbookCandidate, ...candidatePool.filter((c) => c !== playbookCandidate)];
    }
  }

  const selectedIndex = pickIndex % Math.max(1, candidatePool.length);
  const winner = candidatePool[selectedIndex];
  const coveredLabels = winner.result.coveredNeeds.map((need) => TACTICAL_NEED_LABELS[need]);
  const missingLabels = winner.result.missingNeeds.map((need) => TACTICAL_NEED_LABELS[need]);
  const roleLabels = winner.result.roles.map((role) => ROLE_LABELS[role]).filter(Boolean);
  const doctrine = context.playbook?.doctrine ?? (input.side === "attack"
    ? "Abrir · habilitar · ejecutar"
    : "Anclar · negar · responder");
  const names = winner.operators.map((operator) => operator.name);
  const operatorTasks = Object.fromEntries(
    names.flatMap((name) => {
      const task = getPlaybookOperatorTask(context.playbook, name);
      return task ? [[name, task]] : [];
    })
  );

  return {
    playerAgnostic: true,
    strategy: input.strategy,
    doctrine,
    operatorNames: names,
    score: Math.max(0, Math.min(100, Math.round(winner.result.score / 2.2))),
    coveredRoles: unique([...winner.result.coveredRequirements, ...roleLabels]),
    coveredNeeds: coveredLabels,
    missingNeeds: missingLabels,
    summary: context.playbook
      ? `${names.join(" + ")}: ${context.playbook.objective}`
      : input.side === "attack"
        ? `${names.join(" + ")}: habilitar la apertura, limpiar la respuesta defensiva y cerrar la ejecución como trío.`
        : `${names.join(" + ")}: sostener sitio, negar recursos y responder a la entrada sin aislarse.`,
    operatorTasks,
    siteObjective: context.playbook?.objective,
    siteApproach: context.playbook?.approach,
    avoid: context.playbook?.avoid,
  };
}
