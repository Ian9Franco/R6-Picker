import elNotoriousRaw from "../FACTOS/el_notorious.json";
import changoNocturnoRaw from "../FACTOS/chango_nocturno.json";
import azusaCooper09Raw from "../FACTOS/azusa_cooper09.json";
import { type PibeProfile, type TryoutOpInfo } from "./types";
import { type AttackRole, type DefenseRole, type TacticalRole } from "../roles";
import operatorRolesRaw from "../operator-roles.json";
import { attackers } from "../catalog";
import { type OperatorSide, type OperatorProfile } from "./types";

const rawOpDictionary = operatorRolesRaw as Record<string, any>;

export function normalizeOperator(name: string): OperatorProfile {
  // Find case-insensitive key from rawOpDictionary
  const dictKey = Object.keys(rawOpDictionary).find(k => k.toLowerCase() === name.toLowerCase());
  const raw = dictKey ? rawOpDictionary[dictKey] : undefined;
  
  const lowerName = name.toLowerCase();
  const isAtk = attackers.some((a) => a.name.toLowerCase() === lowerName);
  
  if (!raw) {
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
    raw.side ?? (isAtk ? "attack" : "defense");
  const roles: TacticalRole[] =
    raw.roles ?? (side === "attack" ? raw.attack : raw.defense) ?? [];

  return {
    name: raw.name ?? name,
    side,
    roles: [...roles],
    position: raw.position ?? "flex",
    tempo: raw.tempo ?? "flexible",
    provides: [...(raw.provides ?? [])],
    needs: [...(raw.needs ?? [])],
    best_with_roles: [...(raw.best_with_roles ?? [])],
    duo_plan: raw.duo_plan ?? "",
    trio_plan: raw.trio_plan ?? "",
    player_fit: [...(raw.player_fit ?? ["flex"])],
    difficulty: raw.difficulty ?? "medium",
  };
}

function deriveRoles<T extends TacticalRole>(mains: string[], side: OperatorSide): T[] {
  const roleSet = new Set<T>();
  for (const opName of mains) {
    const prof = normalizeOperator(opName);
    for (const r of prof.roles) roleSet.add(r as T);
  }
  return Array.from(roleSet);
}

export function buildPibeProfiles(): PibeProfile[] {
  const factosPibes = [changoNocturnoRaw, elNotoriousRaw, azusaCooper09Raw];

  return factosPibes.map((raw: any) => {
    const attackMains = [
      ...(raw.identityOperators?.filter((op: any) => op.side === "attack").map((op: any) => op.operatorId) || []),
      ...(raw.comfortOperators?.filter((op: any) => op.side === "attack").map((op: any) => op.operatorId) || []),
    ];
    const defenseMains = [
      ...(raw.identityOperators?.filter((op: any) => op.side === "defense").map((op: any) => op.operatorId) || []),
      ...(raw.comfortOperators?.filter((op: any) => op.side === "defense").map((op: any) => op.operatorId) || []),
    ];

    const tryoutAttack = raw.tryoutOperators?.filter((op: any) => op.side === "attack") || [];
    const tryoutDefense = raw.tryoutOperators?.filter((op: any) => op.side === "defense") || [];

    const identityOperators = raw.identityOperators?.map((op: any) => op.operatorId) || [];
    const comfortOperators = raw.comfortOperators?.map((op: any) => op.operatorId) || [];
    const avoidOperators = raw.avoidOperators?.map((op: any) => op.operatorId) || [];

    const attackRoles = deriveRoles<AttackRole>(attackMains, "attack");
    const defenseRoles = deriveRoles<DefenseRole>(defenseMains, "defense");

    return {
      id: raw.id,
      displayName: raw.name,
      tag: raw.name,
      identity: raw.identity || { summary: "", primaryRoles: [], secondaryRoles: [], postUtilityRole: [], preferredTempo: "", preferredPosition: [], playstyleTags: [] },
      roleAffinity: raw.roleAffinity || {},
      identityOperators,
      comfortOperators,
      tryoutAttack,
      tryoutDefense,
      avoidOperators,
      attackMains,
      defenseMains,
      attackRoles,
      defenseRoles,
      mapPerformance: raw.mapPerformance || { attack: {}, defense: {} },
      pickOrder: raw.pickOrder || { attack: { preferredPosition: 2, reason: "", flexible: true }, defense: { preferredPosition: 2, reason: "", flexible: true } },
      activeSupport: raw.activeSupport || { attack: { requiredFunctions: [], preferredTransitions: [], avoidPatterns: [] }, defense: { requiredFunctions: [], preferredTransitions: [], avoidPatterns: [] } },
      tacticalGuidelines: raw.tacticalGuidelines || { attack: { do: [], avoid: [] }, defense: { do: [], avoid: [] }, general: { do: [], avoid: [] } }
    };
  });
}
