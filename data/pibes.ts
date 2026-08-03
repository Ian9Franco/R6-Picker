/**
 * pibes.ts
 * --------
 * Motor de recomendación de operadores.
 * Soporta dos modos:
 *   - Estándar: picks aleatorios del pool general.
 *   - Los Pibes: picks priorizados según mains y roles requeridos por la zona.
 */

import { attackers, defenders, type BombSite, type Side } from "./catalog";
import operatorRolesRaw from "./operator-roles.json";
import pibesData from "./pibes.json";
import type { AttackRole, DefenseRole, TacticalRole } from "./roles";

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type PibeProfile = {
  id: string;
  name: string;
  tag: string;
  /** Playstyle derivado de los roles principales */
  playstyle: string;
  attackMains: string[];
  defenseMains: string[];
  /** Roles de ataque derivados de los mains */
  attackRoles: AttackRole[];
  /** Roles de defensa derivados de los mains */
  defenseRoles: DefenseRole[];
};

export type Recommendation = {
  playerLabel: string;
  opName: string;
  /** Rol del operador elegido */
  role?: string;
  /** True si el operador es main del pibe */
  isMain?: boolean;
  /** True si el operador cubre un requerimiento del site */
  coversRequirement?: boolean;
  /** Nombre del rol táctico que cubre, para mostrar en UI */
  coveredRole?: string;
};

// ─── Mapeo de roles a roles tácticos desde el JSON ───────────────────────────

type OperatorRolesMap = Record<
  string,
  { attack?: string[]; defense?: string[] }
>;

const operatorRoles = operatorRolesRaw as OperatorRolesMap;

function getOperatorRoles(opName: string, side: Side): TacticalRole[] {
  const entry = operatorRoles[opName];
  if (!entry) return [];
  const raw = side === "attack" ? entry.attack : entry.defense;
  return (raw ?? []) as TacticalRole[];
}

// ─── Playstyle automático a partir de roles ───────────────────────────────────

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

// ─── Derivar roles de los mains ───────────────────────────────────────────────

function deriveRoles<T extends TacticalRole>(mains: string[], side: Side): T[] {
  const roleSet = new Set<T>();
  for (const opName of mains) {
    for (const role of getOperatorRoles(opName, side) as T[]) {
      roleSet.add(role);
    }
  }
  return Array.from(roleSet);
}

// ─── Construir perfiles de pibes desde el JSON ───────────────────────────────

export function buildPibeProfiles(): PibeProfile[] {
  return pibesData.pibes.map((raw) => {
    const attackRoles = deriveRoles<AttackRole>(raw.attackMains, "attack");
    const defenseRoles = deriveRoles<DefenseRole>(raw.defenseMains, "defense");
    return {
      id: raw.id,
      name: raw.name,
      tag: raw.tag,
      attackMains: raw.attackMains,
      defenseMains: raw.defenseMains,
      attackRoles,
      defenseRoles,
      playstyle: derivePlaystyle(attackRoles, defenseRoles),
    };
  });
}

/** Lista de perfiles construida en tiempo de módulo (se puede re-calcular si se refresca el JSON) */
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
  }));
}

// ─── Modo Los Pibes — Motor inteligente ──────────────────────────────────────

/**
 * Genera picks para Los Pibes priorizando:
 * 1. Mains del pibe que cubren requerimientos del site no cubiertos aún.
 * 2. Mains del pibe disponibles (no usados por otro pibe).
 * 3. Pool general (fallback).
 */
export function getPibesRecommendations(
  side: Side,
  activePibes: PibeProfile[],
  currentSite?: BombSite
): Recommendation[] {
  const fullPool = side === "attack" ? attackers : defenders;
  const siteReqs: string[] =
    currentSite?.requirements?.[side === "attack" ? "attack" : "defense"] ?? [];

  const usedOps = new Set<string>();
  const coveredRoles = new Set<string>();
  const recommendations: Recommendation[] = [];

  for (const pibe of activePibes) {
    const mains = side === "attack" ? pibe.attackMains : pibe.defenseMains;

    // Mains disponibles (no elegidos ya por otro pibe)
    const availableMains = mains.filter((m) => !usedOps.has(m));

    // Mains que cubren al menos un requerimiento del site aún no cubierto
    const mainsWithReq = availableMains.filter((m) => {
      const roles = getOperatorRoles(m, side);
      return roles.some((r) => siteReqs.includes(r) && !coveredRoles.has(r));
    });

    let chosenOpName: string;
    let isMain = false;
    let coversRequirement = false;
    let coveredRole: string | undefined;

    if (mainsWithReq.length > 0 && Math.random() < 0.85) {
      // Alta probabilidad de elegir un main que cubre un requerimiento
      chosenOpName = mainsWithReq[Math.floor(Math.random() * mainsWithReq.length)];
      isMain = true;
      coversRequirement = true;
      const roles = getOperatorRoles(chosenOpName, side);
      coveredRole = roles.find((r) => siteReqs.includes(r) && !coveredRoles.has(r));
    } else if (availableMains.length > 0 && Math.random() < 0.75) {
      // Elegir de mains disponibles
      chosenOpName = availableMains[Math.floor(Math.random() * availableMains.length)];
      isMain = true;
    } else {
      // Fallback: pool general excluyendo ya usados
      const pool = fullPool.filter((op) => !usedOps.has(op.name));
      chosenOpName = (pool.length > 0 ? pool : fullPool)[
        Math.floor(Math.random() * (pool.length > 0 ? pool.length : fullPool.length))
      ].name;
    }

    // Marcar roles cubiertos por este pick
    for (const role of getOperatorRoles(chosenOpName, side)) {
      if (siteReqs.includes(role)) coveredRoles.add(role);
    }
    usedOps.add(chosenOpName);

    const opData = fullPool.find((op) => op.name === chosenOpName);
    recommendations.push({
      playerLabel: pibe.name,
      opName: chosenOpName,
      role: opData?.role,
      isMain,
      coversRequirement,
      coveredRole: coveredRole ? ROLE_PLAYSTYLE_LABELS[coveredRole] : undefined,
    });
  }

  return recommendations;
}
