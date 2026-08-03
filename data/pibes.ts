/**
 * pibes.ts
 * --------
 * Motor de recomendación de operadores y orden táctico de escuadrón.
 * Incorpora:
 *   - Parseo enriquecido de operator-roles.json y pibes.json
 *   - Orden de Selección de Squad (ATK: Chango -> Notorious -> Azusa; DEF: Chango -> Azusa -> Notorious)
 *   - Regla de Respiración / Rotación (Rondas múltiplo de 3)
 *   - Sinergias de Dúo/Trío y advertencias tácticas de queno.md
 */

import { attackers, defenders, type BombSite, type Side } from "./catalog";
import operatorRolesRaw from "./operator-roles.json";
import pibesDataRaw from "./pibes.json";
import synergiesRaw from "./synergies.json";
import type { AttackRole, DefenseRole, TacticalRole } from "./roles";

// ─── Tipos Enriquecidos ──────────────────────────────────────────────────────

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
  attackMains: string[];
  defenseMains: string[];
  attackRoles: AttackRole[];
  defenseRoles: DefenseRole[];
  tryoutAttack: TryoutOpInfo[];
  tryoutDefense: TryoutOpInfo[];
};

export type Recommendation = {
  playerLabel: string;
  opName: string;
  role?: string;
  isMain?: boolean;
  isTryout?: boolean;
  isBreathing?: boolean;
  pickOrderNumber?: number;
  coversRequirement?: boolean;
  coveredRole?: string;
  duoPlan?: string;
  trioPlan?: string;
  avoidWarning?: string;
  developmentGoal?: string;
};

// ─── Parseo de Operadores y Roles ───────────────────────────────────────────

type OperatorRoleEntry = {
  side?: Side;
  roles?: TacticalRole[];
  attack?: TacticalRole[];
  defense?: TacticalRole[];
  duo_plan?: string;
  trio_plan?: string;
  provides?: string[];
  needs?: string[];
};

const operatorRoles = operatorRolesRaw as Record<string, OperatorRoleEntry>;

export function getOperatorRoles(opName: string, side: Side): TacticalRole[] {
  const entry = operatorRoles[opName];
  if (!entry) return [];
  if (entry.roles && Array.isArray(entry.roles)) {
    return entry.roles;
  }
  const raw = side === "attack" ? entry.attack : entry.defense;
  return (raw ?? []) as TacticalRole[];
}

export function getOperatorDuoPlan(opName: string): string | undefined {
  return operatorRoles[opName]?.duo_plan;
}

export function getOperatorTrioPlan(opName: string): string | undefined {
  return operatorRoles[opName]?.trio_plan;
}

// ─── Playstyle y Roles Derivados ─────────────────────────────────────────────

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

function derivePlaystyle(attackRoles: string[], defenseRoles: string[]): string {
  const topAtk = attackRoles[0];
  const topDef = defenseRoles[0];
  const parts: string[] = [];
  if (topAtk) parts.push(ROLE_PLAYSTYLE_LABELS[topAtk] ?? topAtk);
  if (topDef && topDef !== topAtk) parts.push(ROLE_PLAYSTYLE_LABELS[topDef] ?? topDef);
  return parts.join(" & ") || "Flexible";
}

function deriveRoles<T extends TacticalRole>(mains: string[], side: Side): T[] {
  const roleSet = new Set<T>();
  for (const opName of mains) {
    for (const role of getOperatorRoles(opName, side) as T[]) {
      roleSet.add(role);
    }
  }
  return Array.from(roleSet);
}

// ─── Construir Perfiles ─────────────────────────────────────────────────────

export function buildPibeProfiles(): PibeProfile[] {
  return pibesDataRaw.pibes.map((raw: any) => {
    const attackRoles = deriveRoles<AttackRole>(raw.attackMains, "attack");
    const defenseRoles = deriveRoles<DefenseRole>(raw.defenseMains, "defense");
    const tryoutAttack: TryoutOpInfo[] = raw.tryoutOperators?.attack ?? [];
    const tryoutDefense: TryoutOpInfo[] = raw.tryoutOperators?.defense ?? [];

    return {
      id: raw.id,
      name: raw.name,
      tag: raw.tag,
      attackMains: raw.attackMains,
      defenseMains: raw.defenseMains,
      attackRoles,
      defenseRoles,
      tryoutAttack,
      tryoutDefense,
      playstyle: raw.profile?.summary
        ? derivePlaystyle(attackRoles, defenseRoles)
        : derivePlaystyle(attackRoles, defenseRoles),
      primaryRole: raw.profile?.primaryRole,
    };
  });
}

export const DEFAULT_PIBES: PibeProfile[] = buildPibeProfiles();

// ─── Modo Estándar ────────────────────────────────────────────────────────────

export function getStandardRecommendations(
  side: Side,
  count: number
): Recommendation[] {
  const pool = side === "attack" ? attackers : defenders;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, count);

  return picked.map((op, idx) => ({
    playerLabel: count === 1 ? "Tu Pick" : `Jugador ${idx + 1}`,
    opName: op.name,
    role: op.role,
    pickOrderNumber: idx + 1,
  }));
}

// ─── Squad Pick Order & Engine ───────────────────────────────────────────────

/**
 * Orden de Pick según plan.md:
 * Ataque:  1. ChangoNocturno (Estructura) -> 2. El_Notorious (Flex/Presión) -> 3. AzusaCooper09 (Ejecución/Escudo)
 * Defensa: 1. ChangoNocturno (Estructura) -> 2. AzusaCooper09 (Ancla/Control) -> 3. El_Notorious (Intel/Flex/Roam)
 */
function sortPibesByPickOrder(pibes: PibeProfile[], side: Side): PibeProfile[] {
  const orderMap: Record<string, number> =
    side === "attack"
      ? { chango_nocturno: 1, el_notorious: 2, azusa_cooper09: 3 }
      : { chango_nocturno: 1, azusa_cooper09: 2, el_notorious: 3 };

  return [...pibes].sort((a, b) => (orderMap[a.id] ?? 99) - (orderMap[b.id] ?? 99));
}

/**
 * Revisa reglas anti-patrones de queno.md
 */
function checkForAntiPatternWarnings(
  recs: Recommendation[],
  side: Side
): Recommendation[] {
  const opNames = recs.map((r) => r.opName);
  const isAttack = side === "attack";

  return recs.map((rec) => {
    let warning: string | undefined = undefined;

    // Regla 1: 3 Hard supports en ataque
    if (
      isAttack &&
      ["Thermite", "Thatcher", "Ace", "Hibana"].includes(rec.opName) &&
      opNames.filter((name) => ["Thermite", "Thatcher", "Ace", "Hibana"].includes(name)).length >= 3
    ) {
      warning = "⚠️ Cuidado: 3 soportes estructurales en ataque. Falta alguien que genere espacio.";
    }

    // Regla 2: Escudo sin acompañante o aislado (Azusa)
    if (isAttack && ["Montagne", "Blitz"].includes(rec.opName) && rec.playerLabel === "AzusaCooper09") {
      warning = "⚠️ Escudo requiere un compañero avanzando inmediatamente detrás para tradear.";
    }

    // Regla 3: Duplicar brecha de El_Notorious si Chango ya abrió
    if (
      isAttack &&
      rec.playerLabel === "El_Notorious" &&
      ["Thatcher", "Ace"].includes(rec.opName) &&
      opNames.some((n) => ["Thermite", "Hibana"].includes(n))
    ) {
      warning = "⚠️ Notorious duplica brecha. Rendiría mejor pasando a flex agresivo (Ash/Zofia/Ram).";
    }

    // Regla 4: Roaming profundo sin plan
    if (!isAttack && rec.opName === "Vigil") {
      warning = "⚠️ Consume tiempo en pisos superiores pero asegura ruta de regreso antes de la ejecución.";
    }

    return { ...rec, avoidWarning: warning };
  });
}

// ─── Motor Principal Los Pibes ───────────────────────────────────────────────

export function getPibesRecommendations(
  side: Side,
  activePibes: PibeProfile[],
  currentSite?: BombSite,
  currentRoundNum: number = 1
): Recommendation[] {
  const fullPool = side === "attack" ? attackers : defenders;
  const siteReqs: string[] =
    currentSite?.requirements?.[side === "attack" ? "attack" : "defense"] ?? [];

  // 1. Ordenar pibes según secuencia de pick del squad (plan.md)
  const orderedPibes = sortPibesByPickOrder(activePibes, side);

  // 2. Evaluar si esta ronda es "Ronda de Respiración / Rotación" (ej. Ronda 3, 6)
  const isBreathingRound = currentRoundNum > 0 && currentRoundNum % 3 === 0;

  // Elegir quién rota en la ronda de respiración (1 solo pibe)
  const breathingPibeId = isBreathingRound
    ? orderedPibes[(currentRoundNum / 3 - 1) % orderedPibes.length]?.id
    : undefined;

  const usedOps = new Set<string>();
  const coveredRoles = new Set<string>();
  let rawRecommendations: Recommendation[] = [];

  orderedPibes.forEach((pibe, index) => {
    const isBreathingPlayer = pibe.id === breathingPibeId;
    const mains = side === "attack" ? pibe.attackMains : pibe.defenseMains;
    const tryouts = side === "attack" ? pibe.tryoutAttack : pibe.tryoutDefense;

    let chosenOpName: string = "";
    let isMain = false;
    let isTryout = false;
    let coversRequirement = false;
    let coveredRole: string | undefined;
    let developmentGoal: string | undefined;

    // Si es ronda de respiración y este jugador debe rotar, intentar un tryoutOp
    if (isBreathingPlayer && tryouts.length > 0 && Math.random() < 0.8) {
      const availableTryouts = tryouts.filter((t) => !usedOps.has(t.operator));
      if (availableTryouts.length > 0) {
        const pickedTryout =
          availableTryouts[Math.floor(Math.random() * availableTryouts.length)];
        chosenOpName = pickedTryout.operator;
        isTryout = true;
        developmentGoal = pickedTryout.developmentGoal;
      }
    }

    // Si no se eligió tryout, seguir flujo habitual de mains y requerimientos
    if (!chosenOpName) {
      const availableMains = mains.filter((m) => !usedOps.has(m));
      const mainsWithReq = availableMains.filter((m) => {
        const roles = getOperatorRoles(m, side);
        return roles.some((r) => siteReqs.includes(r) && !coveredRoles.has(r));
      });

      if (mainsWithReq.length > 0 && Math.random() < 0.85) {
        chosenOpName = mainsWithReq[Math.floor(Math.random() * mainsWithReq.length)];
        isMain = true;
        coversRequirement = true;
        const roles = getOperatorRoles(chosenOpName, side);
        coveredRole = roles.find((r) => siteReqs.includes(r) && !coveredRoles.has(r));
      } else if (availableMains.length > 0 && Math.random() < 0.75) {
        chosenOpName = availableMains[Math.floor(Math.random() * availableMains.length)];
        isMain = true;
      } else {
        const pool = fullPool.filter((op) => !usedOps.has(op.name));
        chosenOpName = (pool.length > 0 ? pool : fullPool)[
          Math.floor(Math.random() * (pool.length > 0 ? pool.length : fullPool.length))
        ].name;
      }
    }

    // Marcar roles cubiertos por este pick
    for (const role of getOperatorRoles(chosenOpName, side)) {
      if (siteReqs.includes(role)) coveredRoles.add(role);
    }
    usedOps.add(chosenOpName);

    const opData = fullPool.find((op) => op.name === chosenOpName);

    rawRecommendations.push({
      playerLabel: pibe.name,
      opName: chosenOpName,
      role: opData?.role,
      isMain,
      isTryout,
      isBreathing: isBreathingPlayer,
      pickOrderNumber: index + 1,
      coversRequirement,
      coveredRole: coveredRole ? ROLE_PLAYSTYLE_LABELS[coveredRole] : undefined,
      duoPlan: getOperatorDuoPlan(chosenOpName),
      trioPlan: getOperatorTrioPlan(chosenOpName),
      developmentGoal,
    });
  });

  // Revisar reglas anti-patrón de queno.md
  return checkForAntiPatternWarnings(rawRecommendations, side);
}
