"use client";

import {
  Filter,
  RefreshCw,
  Search,
  ShieldAlert,
  Trophy,
  User,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { competitiveMaps, maps, nonCompetitiveMaps } from "../../data/catalog";
import { type TrackerMapStat } from "../../data/trackerParser";
import { MapCardItem } from "./maps/MapCardItem";

export type CategoryFilter = "all" | "competitive" | "nonCompetitive";
export type PlayerFilter = "all" | "el_notorious" | "chango_nocturno" | "azusa_cooper09";
export type SortOption = "name" | "winrate" | "rounds";

type MapsCatalogProps = {
  matchMap?: string;
  onSelectMap?: (mapName: string) => void;
  randomItem?: <T>(items: readonly T[]) => T;
};

export type PlayerMapOpStat = {
  pibeId: string;
  pibeName: string;
  pibeColor: string;
  operator: string;
  side: "attack" | "defense";
  winRate: number;
  matchesOrRounds: number;
  kd: number;
  headshotPct: number;
  kpr: number;
};

export const PIBES_CONFIG = [
  {
    id: "el_notorious",
    aliases: ["el_notorious", "elnotorious", "notorious"],
    name: "Notorious",
    fullName: "El_Notorious",
    color: "#eab308",
    bg: "rgba(234, 179, 8, 0.15)",
    border: "rgba(234, 179, 8, 0.3)",
    badgeClass: "active-notorious",
  },
  {
    id: "chango_nocturno",
    aliases: ["chango_nocturno", "changonocturno", "chango"],
    name: "Chango",
    fullName: "ChangoNocturno",
    color: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.15)",
    border: "rgba(59, 130, 246, 0.3)",
    badgeClass: "active-chango",
  },
  {
    id: "azusa_cooper09",
    aliases: ["azusa_cooper09", "azusacooper09", "azusa"],
    name: "Azusa",
    fullName: "AzusaCooper09",
    color: "#ec4899",
    bg: "rgba(236, 72, 153, 0.15)",
    border: "rgba(236, 72, 153, 0.3)",
    badgeClass: "active-azusa",
  },
];

const MAP_KEY_MAP: Record<string, string> = {
  bank: "Bank",
  banco: "Bank",
  border: "Border",
  frontera: "Border",
  chalet: "Chalet",
  clubhouse: "Clubhouse",
  club: "Clubhouse",
  coastline: "Coastline",
  litoral: "Coastline",
  consulate: "Consulate",
  consulado: "Consulate",
  fortress: "Fortress",
  fortaleza: "Fortress",
  calypso_casino: "Calypso Casino",
  casino_calypso: "Calypso Casino",
  villa: "Villa",
  kafe_dostoyevsky: "Kafe Dostoyevsky",
  kafe: "Kafe Dostoyevsky",
  nighthaven_labs: "Nighthaven Labs",
  laboratorios_de_nighthaven: "Nighthaven Labs",
  emerald_plains: "Emerald Plains",
  praderas_esmeralda: "Emerald Plains",
  lair: "Lair",
  guarida: "Lair",
  kanal: "Kanal",
  canal: "Kanal",
  outback: "Outback",
  skyscraper: "Skyscraper",
  rascacielos: "Skyscraper",
  theme_park: "Theme Park",
  house: "House",
  casa: "House",
  favela: "Favela",
  tower: "Tower",
  torre: "Tower",
  presidential_plane: "Presidential Plane",
  avion_presidencial: "Presidential Plane",
  yacht: "Yacht",
  yate: "Yacht",
  hereford_base: "Hereford Base",
  base_hereford: "Hereford Base",
  stadium_alpha: "Stadium Alpha",
  estadio_alfa: "Stadium Alpha",
  stadium_bravo: "Stadium Bravo",
  estadio_bravo: "Stadium Bravo",
  close_quarter: "Close Quarter",
  combate_cercano: "Close Quarter",
};

export function normalizeStandardMapName(raw: string): string {
  if (!raw) return "";
  const key = raw
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
  return MAP_KEY_MAP[key] || raw;
}

export function normalizePibeId(playerStr: string): string {
  const clean = playerStr.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (clean.includes("notorious")) return "el_notorious";
  if (clean.includes("chango")) return "chango_nocturno";
  if (clean.includes("azusa")) return "azusa_cooper09";
  return "el_notorious";
}

export function MapsCatalog({
  matchMap: _matchMap,
  onSelectMap: _onSelectMap,
  randomItem: _randomItem,
}: MapsCatalogProps) {
  const [mapQuery, setMapQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [playerFilter, setPlayerFilter] = useState<PlayerFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("name");

  const [savedImports, setSavedImports] = useState<Record<string, any>>({});
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Cargar imports de R6 Tracker desde la API
  const fetchImports = async () => {
    setIsLoadingStats(true);
    try {
      const res = await fetch("/api/save-tracker-stats");
      if (res.ok) {
        const data = await res.json();
        if (data.imports) {
          setSavedImports(data.imports);
        }
      }
    } catch (e) {
      console.error("Error al cargar imports en MapsCatalog:", e);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchImports();
  }, []);

  // Procesar y agrupar estadísticas por mapa y por pibe
  const mapStatsData = useMemo(() => {
    const grouped: Record<string, PlayerMapOpStat[]> = {};

    Object.values(savedImports).forEach((item: any) => {
      const pibeId = normalizePibeId(item.player || item.playerId || "");
      const pibeCfg = PIBES_CONFIG.find((p) => p.id === pibeId) || PIBES_CONFIG[0];
      const operator = item.operator || "";
      const side = (item.side || "attack") as "attack" | "defense";

      if (Array.isArray(item.maps)) {
        item.maps.forEach((m: TrackerMapStat) => {
          const rawName = m.mapId || m.displayName || m.trackerName || m.mapName || "";
          const stdMapName = normalizeStandardMapName(rawName);

          if (!grouped[stdMapName]) grouped[stdMapName] = [];

          grouped[stdMapName].push({
            pibeId: pibeCfg.id,
            pibeName: pibeCfg.name,
            pibeColor: pibeCfg.color,
            operator,
            side,
            winRate: m.winRate || 0,
            matchesOrRounds: m.matchesOrRounds || 0,
            kd: m.kd || 0,
            headshotPct: m.headshotPct || 0,
            kpr: m.kpr || 0,
          });
        });
      }
    });

    return grouped;
  }, [savedImports]);

  // Resumen calculado por mapa: mejores agentes de cada Pibe
  const mapSummaries = useMemo(() => {
    const summaries: Record<
      string,
      {
        totalRounds: number;
        avgWinRate: number;
        pibeTopPicks: Record<string, { topAtk?: PlayerMapOpStat; topDef?: PlayerMapOpStat; bestOp?: PlayerMapOpStat }>;
      }
    > = {};

    Object.keys(mapStatsData).forEach((stdMapName) => {
      const statsList = mapStatsData[stdMapName] || [];
      if (statsList.length === 0) return;

      let sumRounds = 0;
      let sumWRTimesRounds = 0;

      const pibePicks: Record<string, { topAtk?: PlayerMapOpStat; topDef?: PlayerMapOpStat; bestOp?: PlayerMapOpStat }> = {};

      PIBES_CONFIG.forEach((pibe) => {
        const pibeStats = statsList.filter((s) => s.pibeId === pibe.id);
        if (pibeStats.length === 0) return;

        const atkList = pibeStats.filter((s) => s.side === "attack").sort((a, b) => b.winRate - a.winRate || b.kd - a.kd);
        const defList = pibeStats.filter((s) => s.side === "defense").sort((a, b) => b.winRate - a.winRate || b.kd - a.kd);
        const allList = [...pibeStats].sort((a, b) => b.winRate - a.winRate || b.kd - a.kd);

        pibePicks[pibe.id] = {
          topAtk: atkList[0],
          topDef: defList[0],
          bestOp: allList[0],
        };
      });

      statsList.forEach((s) => {
        const r = s.matchesOrRounds || 1;
        sumRounds += r;
        sumWRTimesRounds += s.winRate * r;
      });

      const avgWR = sumRounds > 0 ? sumWRTimesRounds / sumRounds : 0;

      summaries[stdMapName] = {
        totalRounds: sumRounds,
        avgWinRate: Math.round(avgWR * 10) / 10,
        pibeTopPicks: pibePicks,
      };
    });

    return summaries;
  }, [mapStatsData]);

  // Filtrado y ordenamiento principal de mapas
  const filteredMaps = useMemo(() => {
    let pool = maps as unknown as string[];

    if (categoryFilter === "competitive") {
      pool = competitiveMaps as unknown as string[];
    } else if (categoryFilter === "nonCompetitive") {
      pool = nonCompetitiveMaps as unknown as string[];
    }

    if (mapQuery.trim()) {
      const q = mapQuery.toLowerCase();
      pool = pool.filter((m) => m.toLowerCase().includes(q));
    }

    // Filtrar por fortaleza de Pibe si está activo
    if (playerFilter !== "all") {
      pool = pool.filter((m) => {
        const summary = mapSummaries[m];
        if (!summary) return false;
        const pibeTop = summary.pibeTopPicks[playerFilter];
        return !!pibeTop?.bestOp;
      });
    }

    // Ordenar
    const sorted = [...pool];
    if (sortOption === "winrate") {
      sorted.sort((a, b) => {
        const wrA = mapSummaries[a]?.avgWinRate || 0;
        const wrB = mapSummaries[b]?.avgWinRate || 0;
        return wrB - wrA;
      });
    } else if (sortOption === "rounds") {
      sorted.sort((a, b) => {
        const rA = mapSummaries[a]?.totalRounds || 0;
        const rB = mapSummaries[b]?.totalRounds || 0;
        return rB - rA;
      });
    } else {
      sorted.sort((a, b) => a.localeCompare(b));
    }

    return sorted;
  }, [categoryFilter, mapQuery, playerFilter, sortOption, mapSummaries]);

  return (
    <div className="maps-shell">
      {/* Search, Filter & Controls */}
      <div className="catalog-controls">
        <div className="search-row">
          <Search size={16} color="var(--muted)" />
          <input
            type="text"
            placeholder="Buscar mapa (ej. Clubhouse, Border, Chalet...)"
            value={mapQuery}
            onChange={(e) => setMapQuery(e.target.value)}
          />

          <button
            className="pibe-filter-btn"
            onClick={fetchImports}
            title="Recargar datos de R6 Tracker"
            disabled={isLoadingStats}
          >
            <RefreshCw size={13} className={isLoadingStats ? "animate-spin" : ""} />
            Stats
          </button>
        </div>

        {/* Category Filters */}
        <div className="side-tabs">
          <button
            className={`side-tab tab-all ${categoryFilter === "all" ? "active" : ""}`}
            onClick={() => setCategoryFilter("all")}
          >
            Todos ({maps.length})
          </button>
          <button
            className={`side-tab tab-atk ${categoryFilter === "competitive" ? "active" : ""}`}
            onClick={() => setCategoryFilter("competitive")}
          >
            <Trophy size={13} /> Competitivos ({competitiveMaps.length})
          </button>
          <button
            className={`side-tab tab-def ${categoryFilter === "nonCompetitive" ? "active" : ""}`}
            onClick={() => setCategoryFilter("nonCompetitive")}
          >
            <ShieldAlert size={13} /> No competitivos ({nonCompetitiveMaps.length})
          </button>
        </div>

        {/* Player Quick Filters */}
        <div className="map-pibe-filters">
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>
            <Filter size={12} className="inline mr-1" /> Fortalezas de:
          </span>

          <button
            className={`pibe-filter-btn ${playerFilter === "all" ? "active" : ""}`}
            onClick={() => setPlayerFilter("all")}
          >
            Todos los Pibes
          </button>

          {PIBES_CONFIG.map((pibe) => (
            <button
              key={pibe.id}
              className={`pibe-filter-btn ${playerFilter === pibe.id ? pibe.badgeClass : ""}`}
              onClick={() => setPlayerFilter(pibe.id as PlayerFilter)}
            >
              <User size={12} color={pibe.color} />
              {pibe.name}
            </button>
          ))}

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>
              Ordenar:
            </span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              style={{
                background: "var(--surface-2)",
                color: "var(--white)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                padding: "3px 8px",
                fontSize: "12px",
                fontFamily: "Rajdhani, sans-serif",
                fontWeight: 700,
              }}
            >
              <option value="name">Nombre (A-Z)</option>
              <option value="winrate">Mayor WinRate de Squad</option>
              <option value="rounds">Más Partidas Jugadas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Map Cards List */}
      <div className="maps-list">
        {filteredMaps.map((mapName) => (
          <MapCardItem
            key={mapName}
            mapName={mapName}
            mapStatsData={mapStatsData}
          />
        ))}
      </div>
    </div>
  );
}
