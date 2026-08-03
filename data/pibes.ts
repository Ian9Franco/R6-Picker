import { attackers, defenders, type Side } from "./catalog";

export type PibeProfile = {
  id: string;
  name: string;
  tag: string;
  playstyle: string;
  attackMains: string[];
  defenseMains: string[];
};

export const DEFAULT_PIBES: PibeProfile[] = [
  {
    id: "el_notorious",
    name: "El_Notorious",
    tag: "El_Notorious",
    playstyle: "Entry Fragger & Roamer agresivo",
    attackMains: ["Ash", "Zofia", "Deimos", "Ace", "Buck"],
    defenseMains: ["Jäger", "Doc", "Vigil", "Mozzie", "Alibi"],
  },
  {
    id: "chango_nocturno",
    name: "ChangoNocturno",
    tag: "ChangoNocturno",
    playstyle: "Brecha dura & Ancla del objetivo",
    attackMains: ["Thermite", "Hibana", "Thatcher", "Ace", "Sledge"],
    defenseMains: ["Smoke", "Mira", "Kaid", "Mute", "Bandit"],
  },
  {
    id: "azusa_cooper09",
    name: "AzusaCooper09",
    tag: "AzusaCooper09",
    playstyle: "Información, Trampas & Soporte",
    attackMains: ["Dokkaebi", "IQ", "Gridlock", "Zero", "Iana"],
    defenseMains: ["Lesion", "Kapkan", "Valkyrie", "Echo", "Aruni"],
  },
];

export type Recommendation = {
  playerLabel: string;
  opName: string;
  playstyle?: string;
  isMain?: boolean;
};

// Utility to pick distinct random operators for Standard Mode (Default)
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
    playstyle: op.role,
  }));
}

// Utility to pick custom recommendations for "Los Pibes" Mode
export function getPibesRecommendations(
  side: Side,
  activePibes: PibeProfile[]
): Recommendation[] {
  const usedOps = new Set<string>();
  const recommendations: Recommendation[] = [];
  const fullPool = side === "attack" ? attackers : defenders;

  for (const pibe of activePibes) {
    const mains = side === "attack" ? pibe.attackMains : pibe.defenseMains;
    const availableMains = mains.filter((m) => !usedOps.has(m));

    let chosenOpName: string;
    let isMain = false;

    // 75% chance to pick from available mains if any exist
    if (availableMains.length > 0 && Math.random() < 0.75) {
      chosenOpName = availableMains[Math.floor(Math.random() * availableMains.length)];
      isMain = true;
    } else {
      // Pick from full pool minus already used ops
      const availablePool = fullPool.filter((op) => !usedOps.has(op.name));
      if (availablePool.length > 0) {
        chosenOpName = availablePool[Math.floor(Math.random() * availablePool.length)].name;
      } else if (availableMains.length > 0) {
        chosenOpName = availableMains[Math.floor(Math.random() * availableMains.length)];
      } else {
        chosenOpName = fullPool[0].name;
      }
    }

    usedOps.add(chosenOpName);
    recommendations.push({
      playerLabel: pibe.name,
      opName: chosenOpName,
      playstyle: pibe.playstyle,
      isMain,
    });
  }

  return recommendations;
}
