export type PlayerMapStat = {
  matches: number;
  winRate: number;
  kd: number;
};

type PlayerMapStats = Record<string, PlayerMapStat>;

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function parse(rows: string): PlayerMapStats {
  return Object.fromEntries(
    rows.trim().split("\n").map((row) => {
      const [map, matches, winRate, kd] = row.split("|");
      return [normalize(map), { matches: Number(matches), winRate: Number(winRate), kd: Number(kd) }];
    })
  );
}

// R6 Tracker Maps Overview: Y9S3 onwards, excluding Arcade and Event playlists.
const statsByPlayer: Record<string, PlayerMapStats> = {
  chango_nocturno: parse(`
Coastline|65|46.2|0.89
Clubhouse|53|54.7|0.77
Chalet|51|52.9|0.79
Border|47|36.2|0.73
Kafe Dostoyevsky|45|40.0|0.70
Oregon|44|40.9|0.74
Villa|42|40.5|0.75
Bank|34|52.9|0.61
Consulate|34|44.1|0.74
Fortress|31|45.2|0.77
Calypso Casino|30|53.3|0.83
Outback|29|65.5|1.06
Kanal|23|52.2|0.82
Theme Park|22|50.0|1.04
Nighthaven Labs|21|57.1|0.92
Emerald Plains|16|43.8|1.15
Skyscraper|16|50.0|0.72
Lair|10|50.0|0.91
Favela|3|100.0|1.00
Stadium Alpha|3|33.3|1.36
House|2|50.0|0.88
Tower|2|50.0|1.00
Presidential Plane|1|0.0|0.88
Stadium Bravo|1|0.0|0.50
Yacht|1|100.0|3.00
`),
  el_notorious: parse(`
Coastline|81|48.1|1.19
Chalet|72|56.9|1.25
Border|65|38.5|0.94
Oregon|64|43.8|1.08
Villa|62|50.0|1.28
Clubhouse|61|55.7|1.21
Kafe Dostoyevsky|57|47.4|1.03
Bank|52|57.7|1.31
Consulate|50|42.0|1.25
Kanal|37|54.1|1.36
Outback|37|51.4|1.13
Theme Park|30|50.0|1.33
Fortress|29|44.8|1.02
Calypso Casino|28|53.6|1.06
Nighthaven Labs|26|57.7|1.19
Skyscraper|24|54.2|1.20
Lair|20|45.0|0.89
Emerald Plains|17|47.1|1.44
House|4|50.0|1.54
Stadium Alpha|4|0.0|1.35
Yacht|4|75.0|1.75
Favela|2|100.0|1.22
Presidential Plane|2|0.0|0.90
Stadium Bravo|2|50.0|2.00
Tower|2|50.0|2.00
`),
  azusa_cooper09: parse(`
Chalet|58|55.2|0.75
Border|48|35.4|0.62
Coastline|44|45.5|0.69
Oregon|40|35.0|0.54
Clubhouse|36|52.8|0.62
Consulate|36|44.4|0.59
Kafe Dostoyevsky|36|47.2|0.56
Villa|35|48.6|0.75
Bank|34|58.8|0.63
Outback|27|59.3|0.77
Kanal|23|56.5|0.62
Fortress|20|50.0|0.85
Calypso Casino|17|58.8|0.74
Emerald Plains|17|35.3|0.56
Theme Park|17|47.1|0.64
Nighthaven Labs|15|53.3|0.66
Skyscraper|15|40.0|0.55
Lair|12|58.3|0.92
House|5|60.0|1.00
Stadium Alpha|5|60.0|0.50
Favela|4|75.0|0.59
Stadium Bravo|4|50.0|0.57
Tower|3|66.7|0.45
Presidential Plane|2|0.0|0.64
Yacht|2|100.0|0.00
`),
};

export function getMapPlayerStat(playerId: string, mapName: string): PlayerMapStat | undefined {
  return statsByPlayer[playerId]?.[normalize(mapName)];
}
