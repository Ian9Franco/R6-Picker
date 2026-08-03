export type Side = "attack" | "defense";
export type Operator = { name: string; side: Side };

const attackerNames = [
  "Striker", "Sledge", "Thatcher", "Ash", "Thermite", "Twitch", "Montagne", "Glaz", "Fuze", "Blitz", "IQ", "Buck", "Blackbeard", "Capitão", "Hibana", "Jackal", "Ying", "Zofia", "Dokkaebi", "Lion", "Finka", "Maverick", "Nomad", "Gridlock", "Nøkk", "Amaru", "Kali", "Iana", "Ace", "Zero", "Flores", "Osa", "Sens", "Grim", "Brava", "Ram", "Deimos", "Rauora", "Solid Snake",
] as const;

const defenderNames = [
  "Sentry", "Smoke", "Mute", "Castle", "Pulse", "Doc", "Rook", "Kapkan", "Tachanka", "Jäger", "Bandit", "Frost", "Valkyrie", "Caveira", "Echo", "Mira", "Lesion", "Ela", "Vigil", "Maestro", "Alibi", "Clash", "Kaid", "Mozzie", "Warden", "Goyo", "Wamai", "Oryx", "Melusi", "Aruni", "Thunderbird", "Thorn", "Azami", "Solis", "Fenrir", "Tubarão", "Skopós", "Denari",
] as const;

export const attackers: Operator[] = attackerNames.map((name) => ({ name, side: "attack" }));
export const defenders: Operator[] = defenderNames.map((name) => ({ name, side: "defense" }));
export const operators = [...attackers, ...defenders];

export const maps = [
  "Calypso Casino", "Border", "Chalet", "Kafe Dostoyevsky", "Bank", "Clubhouse", "Stadium Bravo", "Stadium Alpha", "Lair", "Nighthaven Labs", "Close Quarter", "Emerald Plains", "Coastline", "Consulate", "Favela", "Fortress", "Hereford Base", "House", "Kanal", "Oregon", "Outback", "Presidential Plane", "Skyscraper", "Theme Park", "Tower", "Villa", "Yacht",
] as const;

export const catalogMeta = {
  source: "Ubisoft Rainbow Six Siege",
  sourceUrl: "https://www.ubisoft.com/en-us/game/rainbow-six/siege/game-info",
  updatedAt: "2026-08-03",
};
