import { type OperatorProfile, type PibeProfile } from "./types";
import synergiesRaw from "../synergies.json";
import { type Side } from "../catalog";

export const scoreWeights = synergiesRaw.scoreWeights ?? {
  coveredNeed: 4,
  complementaryRole: 3,
  playerFit: 3,
  explicitSynergyBonus: 5,
  duplicatedRolePenalty: -2,
  uncoveredCriticalNeedPenalty: -5,
  forbiddenPatternPenalty: -6,
};

export function calcHybridSynergyScore(
  baseScore: number,
  candidateOp: string,
  squadOps: string[],
  pibes: PibeProfile[]
): { score: number; explanations: string[] } {
  let finalScore = baseScore;
  const explanations: string[] = [];

  // Use the explicit synergies by operator pairing from the synergies data
  const rawSynergies = (synergiesRaw as any).explicitSynergies ?? [];
  const explicitSynergies: Record<string, string[]> = {};
  for (const syn of rawSynergies) {
    if (syn.operators && Array.isArray(syn.operators)) {
      for (const op of syn.operators) {
        explicitSynergies[op] = (syn.operators as string[]).filter((o: string) => o !== op);
      }
    }
  }

  for (const [opA, synergiesB] of Object.entries(explicitSynergies)) {
    if (candidateOp === opA && squadOps.some((op) => synergiesB.includes(op))) {
      finalScore += scoreWeights.explicitSynergyBonus;
      explanations.push(`+${scoreWeights.explicitSynergyBonus} Sinergia explícita de Operador (Ej. Thatcher+Thermite)`);
    }
  }

  return { score: finalScore, explanations };
}

export function determineSquadOrder(
  pibes: PibeProfile[],
  side: Side
): { orderedPibes: PibeProfile[]; reason: string } {
  const sortedPibes = [...pibes].sort((a, b) => {
    // On defense, Notorious leads pick 1 for Kaid/intel setup, Chango 2nd, Azusa 3rd/flex
    if (side === "defense") {
      const defOrder: Record<string, number> = { el_notorious: 1, chango_nocturno: 2, azusa_cooper09: 3 };
      const posA = defOrder[a.id] ?? 2;
      const posB = defOrder[b.id] ?? 2;
      return posA - posB;
    }
    const posA = a.pickOrder?.[side]?.preferredPosition ?? 2;
    const posB = b.pickOrder?.[side]?.preferredPosition ?? 2;
    return posA - posB;
  });

  const reasonLines = sortedPibes.map((p) => {
    const r = p.pickOrder?.[side]?.reason || "Selección flexible";
    return `${p.displayName}: ${r}`;
  });

  return {
    orderedPibes: sortedPibes,
    reason: `Orden Dinámico de Selección:\n` + reasonLines.join("\n"),
  };
}
