/**
 * trackerParser.ts
 * ----------------
 * Utilidad de parseo y normalización para bloques de texto crudo copiados desde R6 Tracker.
 */

export const MAP_NAMES_ES: Record<string, string> = {
  bank: "Banco",
  border: "Frontera",
  chalet: "Chalet",
  clubhouse: "Club",
  coastline: "Litoral",
  consulate: "Consulado",
  emerald_plains: "Praderas Esmeralda",
  fortress: "Fortaleza",
  kafe_dostoyevsky: "Kafe Dostoyevsky",
  kanal: "Canal",
  lair: "Guarida",
  nighthaven_labs: "Laboratorios de Nighthaven",
  oregon: "Oregon",
  outback: "Outback",
  skyscraper: "Rascacielos",
  theme_park: "Theme Park",
  villa: "Villa",
  calypso_casino: "Casino Calypso",
  stadium_alpha: "Estadio Alfa",
  stadium_bravo: "Estadio Bravo",
  house: "Casa",
  favela: "Favela",
  tower: "Torre",
  presidential_plane: "Avión Presidencial",
  yacht: "Yate",
  close_quarter: "Combate Cercano",
  hereford_base: "Base Hereford"
};

export function getMapDetails(rawName: string): { mapId: string; trackerName: string; displayName: string } {
  const clean = rawName.trim();
  const key = clean
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

  const displayName = MAP_NAMES_ES[key] || clean;

  return {
    mapId: key,
    trackerName: clean,
    displayName: displayName,
  };
}

export type TrackerMapStat = {
  mapId: string;
  trackerName: string;
  displayName: string;
  mapName?: string; // backwards compatibility alias for trackerName
  matchesOrRounds: number;
  winRate: number; // Porcentaje, ej: 54.8
  wins: number;
  losses: number;
  kd: number;
  headshotPct: number; // Porcentaje, ej: 48.2
  kpr?: number;
};

export type ParsedTrackerBlock = {
  player?: string;
  side?: "attack" | "defense";
  operator?: string;
  playlist?: string;
  period?: string;
  maps: TrackerMapStat[];
  rawLineCount: number;
  parseWarnings: string[];
};

export const KNOWN_MAPS = [
  "Bank",
  "Border",
  "Chalet",
  "Clubhouse",
  "Coastline",
  "Consulate",
  "Emerald Plains",
  "Favela",
  "Fortress",
  "Hereford Base",
  "Kafe Dostoyevsky",
  "Kafe",
  "Kanal",
  "Lair",
  "Nighthaven Labs",
  "Oregon",
  "Outback",
  "Presidential Plane",
  "Skyscraper",
  "Theme Park",
  "Tower",
  "Villa",
  "Yacht",
];

// Helper para normalizar cadenas
function cleanValue(val: string): string {
  return val.trim().replace(/^[:=\-\s]+/, "");
}

// Normaliza porcentaje: "54.8%" -> 54.8
function parsePercentage(str: string): number {
  const clean = str.replace("%", "").replace(",", ".").trim();
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

// Normaliza números flotantes/enteros
function parseNum(str: string): number {
  const clean = str.replace(",", ".").trim();
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

/**
 * Parsea un bloque de texto crudo de R6 Tracker y extrae metadatos y estadísticas por mapa.
 */
export function parseTrackerText(rawText: string): ParsedTrackerBlock {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const warnings: string[] = [];
  let player: string | undefined = undefined;
  let side: "attack" | "defense" | undefined = undefined;
  let operator: string | undefined = undefined;
  let playlist: string | undefined = undefined;
  let period: string | undefined = undefined;

  const dataLines: string[] = [];

  // Parsear encabezados de metadatos
  for (const line of lines) {
    const upper = line.toUpperCase();
    if (upper.startsWith("JUGADOR:") || upper.startsWith("PLAYER:")) {
      player = cleanValue(line.split(":")[1] || "");
    } else if (upper.startsWith("BANDO:") || upper.startsWith("SIDE:")) {
      const val = cleanValue(line.split(":")[1] || "").toLowerCase();
      if (val.includes("ataque") || val.includes("attack") || val.includes("atk")) {
        side = "attack";
      } else if (val.includes("defensa") || val.includes("defense") || val.includes("def")) {
        side = "defense";
      }
    } else if (upper.startsWith("OPERADOR:") || upper.startsWith("OPERATOR:") || upper.startsWith("AGENTE:")) {
      operator = cleanValue(line.split(":")[1] || "");
    } else if (upper.startsWith("PLAYLIST:")) {
      playlist = cleanValue(line.split(":")[1] || "");
    } else if (upper.startsWith("PERÍODO:") || upper.startsWith("PERIODO:") || upper.startsWith("PERIOD:")) {
      period = cleanValue(line.split(":")[1] || "");
    } else {
      // Ignorar encabezados de tabla comunes (ej. "Mapa", "Win Rate", etc.)
      const isHeaderRow =
        upper.includes("WINRATE") ||
        upper.includes("VICTORIAS") ||
        upper.includes("HEADSHOT") ||
        upper.includes("PARTIDAS") ||
        upper.includes("RONDAS");

      if (!isHeaderRow) {
        dataLines.push(line);
      }
    }
  }

  const maps: TrackerMapStat[] = [];

  // Método A: Buscar filas tabuladas o en una sola línea (ej. "Coastline\t42\t54.8%\t23\t19\t1.31\t48.2%\t0.63")
  for (const line of dataLines) {
    const parts = line.split(/\t| {2,}/).map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 6) {
      const mapCandidate = parts[0];
      const isKnownMap = KNOWN_MAPS.some((m) => m.toLowerCase() === mapCandidate.toLowerCase());

      if (isKnownMap || isNaN(parseFloat(mapCandidate))) {
        const details = getMapDetails(mapCandidate);
        maps.push({
          mapId: details.mapId,
          trackerName: details.trackerName,
          displayName: details.displayName,
          mapName: details.trackerName,
          matchesOrRounds: parseNum(parts[1]),
          winRate: parsePercentage(parts[2]),
          wins: parseNum(parts[3]),
          losses: parseNum(parts[4]),
          kd: parseNum(parts[5]),
          headshotPct: parts[6] ? parsePercentage(parts[6]) : 0,
          kpr: parts[7] ? parseNum(parts[7]) : undefined,
        });
      }
    }
  }

  // Método B: Si el método A no dio resultados, intentar parsear secuencia vertical de líneas
  if (maps.length === 0 && dataLines.length > 0) {
    let currentMap: { mapId?: string; trackerName?: string; displayName?: string; mapName?: string } | null = null;
    const tokens: string[] = [];

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i];
      const matchingMap = KNOWN_MAPS.find((m) => m.toLowerCase() === line.toLowerCase());

      if (matchingMap || (isNaN(parseFloat(line)) && !line.includes("%") && line.length > 2)) {
        // Guardar token acumulado anterior si existía
        if (currentMap && (currentMap.trackerName || currentMap.mapName) && tokens.length >= 5) {
          const raw = currentMap.trackerName || currentMap.mapName || "";
          const details = getMapDetails(raw);
          maps.push({
            mapId: details.mapId,
            trackerName: details.trackerName,
            displayName: details.displayName,
            mapName: details.trackerName,
            matchesOrRounds: parseNum(tokens[0] || "0"),
            winRate: parsePercentage(tokens[1] || "0"),
            wins: parseNum(tokens[2] || "0"),
            losses: parseNum(tokens[3] || "0"),
            kd: parseNum(tokens[4] || "0"),
            headshotPct: tokens[5] ? parsePercentage(tokens[5]) : 0,
            kpr: tokens[6] ? parseNum(tokens[6]) : undefined,
          });
        }
        const rawName = matchingMap || line;
        const details = getMapDetails(rawName);
        currentMap = { ...details, mapName: details.trackerName };
        tokens.length = 0;
      } else if (currentMap) {
        tokens.push(line);
      }
    }

    // Flush del último mapa en el loop vertical
    if (currentMap && (currentMap.trackerName || currentMap.mapName) && tokens.length >= 5) {
      const raw = currentMap.trackerName || currentMap.mapName || "";
      const details = getMapDetails(raw);
      maps.push({
        mapId: details.mapId,
        trackerName: details.trackerName,
        displayName: details.displayName,
        mapName: details.trackerName,
        matchesOrRounds: parseNum(tokens[0] || "0"),
        winRate: parsePercentage(tokens[1] || "0"),
        wins: parseNum(tokens[2] || "0"),
        losses: parseNum(tokens[3] || "0"),
        kd: parseNum(tokens[4] || "0"),
        headshotPct: tokens[5] ? parsePercentage(tokens[5]) : 0,
        kpr: tokens[6] ? parseNum(tokens[6]) : undefined,
      });
    }
  }

  if (maps.length === 0) {
    warnings.push("No se pudieron detectar tablas de mapas válidas. Verifica la estructura del texto pegado.");
  }

  return {
    player,
    side,
    operator,
    playlist,
    period,
    maps,
    rawLineCount: lines.length,
    parseWarnings: warnings,
  };
}
