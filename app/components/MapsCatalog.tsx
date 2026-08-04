"use client";

import {
  Award,
  ChevronDown,
  ChevronUp,
  Filter,
  Flame,
  MapPin,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  Swords,
  Trophy,
  User,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { competitiveMaps, mapBombSites, maps, nonCompetitiveMaps } from "../../data/catalog";
import { type TrackerMapStat } from "../../data/trackerParser";
import { OperatorIcon } from "./OperatorIcon";
import { getMapStrategies, getRecommendedOpsForPibe } from "../../data/mapStrategies";
import { getMapPlayerStat } from "../../data/playerMapStats";

type CategoryFilter = "all" | "competitive" | "nonCompetitive";
type PlayerFilter = "all" | "el_notorious" | "chango_nocturno" | "azusa_cooper09";
type SortOption = "name" | "winrate" | "rounds";

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

export function MapsCatalog({ matchMap: _matchMap, onSelectMap: _onSelectMap, randomItem: _randomItem }: MapsCatalogProps) {
  const [mapQuery, setMapQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [playerFilter, setPlayerFilter] = useState<PlayerFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("name");
  const [expandedMap, setExpandedMap] = useState<string | null>(null);

  // Sub-tabs inside expanded map panel
  const [activePanelTab, setActivePanelTab] = useState<Record<string, "strategies" | "stats" | "sites">>({});
  const [panelSideFilter, setPanelSideFilter] = useState<"all" | "attack" | "defense">("all");
  const [panelPlayerFilter, setPanelPlayerFilter] = useState<PlayerFilter>("all");

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
        mvpPibe?: { pibeId: string; pibeName: string; winRate: number; opName: string };
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

      // Determinar el Pibe MVP en este mapa
      let bestPibe: { pibeId: string; pibeName: string; winRate: number; opName: string } | undefined = undefined;
      let maxWR = -1;

      Object.keys(pibePicks).forEach((pibeId) => {
        const bestOp = pibePicks[pibeId]?.bestOp;
        if (bestOp && bestOp.winRate > maxWR) {
          maxWR = bestOp.winRate;
          bestPibe = {
            pibeId,
            pibeName: bestOp.pibeName,
            winRate: bestOp.winRate,
            opName: bestOp.operator,
          };
        }
      });

      summaries[stdMapName] = {
        totalRounds: sumRounds,
        avgWinRate: Math.round(avgWR * 10) / 10,
        pibeTopPicks: pibePicks,
        mvpPibe: bestPibe,
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
      {/* Search, Filter & Random Controls */}
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

        {/* Filters Row: Categories & Player Strengths */}
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

        {/* Player Strength Quick Filters */}
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
        {filteredMaps.map((mapName) => {
          const sites = mapBombSites[mapName] || [];
          const isCompetitive = sites.length > 0;
          const isExpanded = expandedMap === mapName;

          const summary = mapSummaries[mapName];
          const allOpStatsForMap = mapStatsData[mapName] || [];
          const playerOverview = PIBES_CONFIG.flatMap((pibe) => {
            const stats = getMapPlayerStat(pibe.id, mapName);
            return stats ? [{ pibe, stats }] : [];
          });
          const mapMvp = [...playerOverview].sort(
            (a, b) => b.stats.winRate - a.stats.winRate || b.stats.kd - a.stats.kd || b.stats.matches - a.stats.matches
          )[0];

          const currentTab = activePanelTab[mapName] || "stats";

          return (
            <div
              key={mapName}
              className={`map-card ${
                !isCompetitive ? "map-non-competitive" : ""
              }`}
            >
              <div
                className="map-card-header"
                role={isCompetitive ? "button" : undefined}
                tabIndex={isCompetitive ? 0 : undefined}
                aria-expanded={isCompetitive ? isExpanded : undefined}
                onClick={() => isCompetitive && setExpandedMap(isExpanded ? null : mapName)}
                onKeyDown={(event) => {
                  if (isCompetitive && (event.key === "Enter" || event.key === " ")) {
                    event.preventDefault();
                    setExpandedMap(isExpanded ? null : mapName);
                  }
                }}
              >
                <div className={`map-card-icon ${!isCompetitive ? "icon-disabled" : ""}`}>
                  <MapPin size={22} />
                </div>

                <div className="map-card-info">
                  <div className="map-card-name-row">
                    <span className="map-card-name">{mapName}</span>
                    {isCompetitive ? (
                      <span className="map-badge-comp">COMPETITIVO</span>
                    ) : (
                      <span className="map-badge-noncomp">NO COMPETITIVO</span>
                    )}

                    {mapMvp && (
                      <span
                        className="map-mvp-badge"
                        title={`Mejor rendimiento general: ${mapMvp.stats.winRate.toFixed(1)}% WR · ${mapMvp.stats.kd.toFixed(2)} K/D`}
                      >
                        <Sparkles size={11} /> MVP: {mapMvp.pibe.name}
                        <span className="map-mvp-metrics">
                          {mapMvp.stats.winRate.toFixed(1)}% · {mapMvp.stats.kd.toFixed(2)} K/D
                        </span>
                      </span>
                    )}

                  </div>

                  <div className="map-card-meta">
                    {isCompetitive ? (
                      <>
                        <span>{sites.length} zonas de bomba oficiales</span>
                      </>
                    ) : (
                      "Sin zonas para ranked"
                    )}
                  </div>

                </div>

                <div className="map-card-actions">
                  {isCompetitive && (
                    <button
                      className="map-sites-toggle"
                      onClick={(event) => {
                        event.stopPropagation();
                        setExpandedMap(isExpanded ? null : mapName);
                      }}
                      aria-label={`${isExpanded ? "Cerrar" : "Ver"} estadísticas de ${mapName}`}
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded Details Panel */}
              {isExpanded && isCompetitive && (
                <div className="map-sites-panel" style={{ paddingTop: "14px" }}>
                  {/* Expanded Sub-tabs Navigation */}
                  <div className="map-panel-nav">
                    <button
                      className={`map-panel-tab ${currentTab === "strategies" ? "active" : ""}`}
                      onClick={() => setActivePanelTab((prev) => ({ ...prev, [mapName]: "strategies" }))}
                    >
                      <Sparkles size={14} /> Estrategias & Jugadas
                    </button>
                    <button
                      className={`map-panel-tab ${currentTab === "stats" ? "active" : ""}`}
                      onClick={() => setActivePanelTab((prev) => ({ ...prev, [mapName]: "stats" }))}
                    >
                      <Award size={14} /> Rendimiento ({playerOverview.length})
                    </button>
                    <button
                      className={`map-panel-tab ${currentTab === "sites" ? "active" : ""}`}
                      onClick={() => setActivePanelTab((prev) => ({ ...prev, [mapName]: "sites" }))}
                    >
                      <MapPin size={14} /> Zonas de Bomba ({sites.length})
                    </button>
                  </div>

                  {/* TAB 0: TACTICAL STRATEGIES & PLAYS */}
                  {(currentTab === "strategies" || !currentTab) && (() => {
                    const profile = getMapStrategies(mapName);
                    return (
                      <div className="map-strategies-container" style={{ marginTop: "12px" }}>
                        {!profile || (profile.attackStrategies.length === 0 && profile.defenseStrategies.length === 0) ? (
                          <div style={{ padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "13px", color: "var(--muted)" }}>
                            💡 <strong>Map Táctico listo para pulir:</strong> Añadí tus jugadas y ejecuciones de Ataque/Defensa para {mapName} en <code>data/mapStrategies.ts</code>.
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {/* Ataque Strategies */}
                            {profile.attackStrategies.length > 0 && (
                              <div>
                                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--atk)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                                  <Swords size={13} /> Estrategias de Ataque ({profile.attackStrategies.length})
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "10px" }}>
                                  {profile.attackStrategies.map((strat) => (
                                    <div key={strat.id} style={{ background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "10px", padding: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#fca5a5" }}>{strat.playTitle}</span>
                                        <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: "rgba(239, 68, 68, 0.2)", color: "#fca5a5" }}>{strat.siteName}</span>
                                      </div>
                                      <p style={{ fontSize: "11px", color: "var(--fg-dim, #cbd5e1)", margin: 0, lineHeight: 1.4 }}>{strat.objective}</p>
                                      
                                      {/* Pibe Roles */}
                                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px" }}>
                                        {strat.pibeAssignments.map((asgn) => {
                                          const pibeObj = PIBES_CONFIG.find((p) => p.id === asgn.pibeId);
                                          const opsList = getRecommendedOpsForPibe(asgn);
                                          return (
                                            <div key={asgn.pibeId} style={{ fontSize: "10px", padding: "4px 8px", background: "rgba(0,0,0,0.3)", borderRadius: "6px", borderLeft: `3px solid ${pibeObj?.color || "#6b7280"}` }}>
                                              <strong style={{ color: pibeObj?.color }}>{pibeObj?.name} ({asgn.role}):</strong> {opsList.join(", ")} — <em>{asgn.taskDescription}</em>
                                            </div>
                                          );
                                        })}
                                      </div>
                                      {strat.proTip && (
                                        <div style={{ fontSize: "10px", color: "#fef08a", marginTop: "4px", background: "rgba(254, 240, 138, 0.08)", padding: "4px 8px", borderRadius: "4px" }}>
                                          💡 <strong>Pro Tip:</strong> {strat.proTip}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Defensa Strategies */}
                            {profile.defenseStrategies.length > 0 && (
                              <div>
                                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--def)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                                  <Shield size={13} /> Setups de Defensa ({profile.defenseStrategies.length})
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "10px" }}>
                                  {profile.defenseStrategies.map((strat) => (
                                    <div key={strat.id} style={{ background: "rgba(59, 130, 246, 0.05)", border: "1px solid rgba(59, 130, 246, 0.2)", borderRadius: "10px", padding: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#93c5fd" }}>{strat.playTitle}</span>
                                        <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: "rgba(59, 130, 246, 0.2)", color: "#93c5fd" }}>{strat.siteName}</span>
                                      </div>
                                      <p style={{ fontSize: "11px", color: "var(--fg-dim, #cbd5e1)", margin: 0, lineHeight: 1.4 }}>{strat.objective}</p>

                                      {/* Pibe Roles */}
                                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px" }}>
                                        {strat.pibeAssignments.map((asgn) => {
                                          const pibeObj = PIBES_CONFIG.find((p) => p.id === asgn.pibeId);
                                          const opsList = getRecommendedOpsForPibe(asgn);
                                          return (
                                            <div key={asgn.pibeId} style={{ fontSize: "10px", padding: "4px 8px", background: "rgba(0,0,0,0.3)", borderRadius: "6px", borderLeft: `3px solid ${pibeObj?.color || "#6b7280"}` }}>
                                              <strong style={{ color: pibeObj?.color }}>{pibeObj?.name} ({asgn.role}):</strong> {opsList.join(", ")} — <em>{asgn.taskDescription}</em>
                                            </div>
                                          );
                                        })}
                                      </div>
                                      {strat.proTip && (
                                        <div style={{ fontSize: "10px", color: "#fef08a", marginTop: "4px", background: "rgba(254, 240, 138, 0.08)", padding: "4px 8px", borderRadius: "4px" }}>
                                          💡 <strong>Pro Tip:</strong> {strat.proTip}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* TAB 1: PIBES OPERATOR STATS FOR THIS MAP */}
                  {currentTab === "stats" && (
                    <div>
                      <section className="map-player-overview" aria-label={`Rendimiento por jugador en ${mapName}`}>
                        <div className="map-player-overview-heading">
                          <div>
                            <span>Rendimiento general por pibe</span>
                            <small>R6 Tracker · Y9S3 en adelante</small>
                          </div>
                          <strong>{mapName}</strong>
                        </div>
                        <div className="map-player-overview-grid">
                          {playerOverview
                            .filter(({ pibe }) => panelPlayerFilter === "all" || panelPlayerFilter === pibe.id)
                            .map(({ pibe, stats }) => {
                              const wrClass = stats.winRate >= 55 ? "wr-high" : stats.winRate >= 45 ? "wr-mid" : "wr-low";
                              const kdClass = stats.kd >= 1.2 ? "kd-high" : stats.kd >= 0.9 ? "kd-mid" : "kd-low";
                              return (
                                <article key={pibe.id} className="map-player-stat-card" style={{ "--pibe-color": pibe.color } as React.CSSProperties}>
                                  <div className="map-player-stat-name">
                                    <User size={14} /> {pibe.fullName}
                                  </div>
                                  <div className="op-metrics-grid">
                                    <div className="metric-item">
                                      <span className="metric-label">K/D</span>
                                      <span className={`metric-value ${kdClass}`}>{stats.kd.toFixed(2)}</span>
                                    </div>
                                    <div className="metric-item">
                                      <span className="metric-label">Winrate</span>
                                      <span className={`metric-value ${wrClass}`}>{stats.winRate.toFixed(1)}%</span>
                                    </div>
                                    <div className="metric-item">
                                      <span className="metric-label">Partidas</span>
                                      <span className="metric-value">{stats.matches}</span>
                                    </div>
                                  </div>
                                </article>
                              );
                            })}
                        </div>
                      </section>

                      {/* Filter Controls within Map Panel */}
                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "12px", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: "4px" }}>
                          <button
                            className={`pibe-filter-btn ${panelPlayerFilter === "all" ? "active" : ""}`}
                            style={{ padding: "3px 8px", fontSize: "11px" }}
                            onClick={() => setPanelPlayerFilter("all")}
                          >
                            Todos
                          </button>
                          {PIBES_CONFIG.map((p) => (
                            <button
                              key={p.id}
                              className={`pibe-filter-btn ${panelPlayerFilter === p.id ? p.badgeClass : ""}`}
                              style={{ padding: "3px 8px", fontSize: "11px" }}
                              onClick={() => setPanelPlayerFilter(p.id as PlayerFilter)}
                            >
                              {p.name}
                            </button>
                          ))}
                        </div>

                        <div className="maps-divider" style={{ height: "16px" }} />

                        <div style={{ display: "flex", gap: "4px" }}>
                          <button
                            className={`pibe-filter-btn ${panelSideFilter === "all" ? "active" : ""}`}
                            style={{ padding: "3px 8px", fontSize: "11px" }}
                            onClick={() => setPanelSideFilter("all")}
                          >
                            Ambos Bandos
                          </button>
                          <button
                            className={`pibe-filter-btn ${panelSideFilter === "attack" ? "active" : ""}`}
                            style={{ padding: "3px 8px", fontSize: "11px" }}
                            onClick={() => setPanelSideFilter("attack")}
                          >
                            <Swords size={11} /> Ataque
                          </button>
                          <button
                            className={`pibe-filter-btn ${panelSideFilter === "defense" ? "active" : ""}`}
                            style={{ padding: "3px 8px", fontSize: "11px" }}
                            onClick={() => setPanelSideFilter("defense")}
                          >
                            <Shield size={11} /> Defensa
                          </button>
                        </div>
                      </div>

                      {/* Operators Grid */}
                      {allOpStatsForMap.length === 0 ? (
                        <div style={{ padding: "20px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>
                          No hay datos importados de R6 Tracker para este mapa aún.
                        </div>
                      ) : (
                        <div className="map-op-stats-grid">
                          {allOpStatsForMap
                            .filter((item) => {
                              if (panelPlayerFilter !== "all" && item.pibeId !== panelPlayerFilter) return false;
                              if (panelSideFilter !== "all" && item.side !== panelSideFilter) return false;
                              return true;
                            })
                            .sort((a, b) => b.winRate - a.winRate || b.kd - a.kd)
                            .map((item, idx) => {
                              const wrClass = item.winRate >= 55 ? "wr-high" : item.winRate >= 45 ? "wr-mid" : "wr-low";
                              const fillClass = item.winRate >= 55 ? "fill-high" : item.winRate >= 45 ? "fill-mid" : "fill-low";
                              const kdClass = item.kd >= 1.2 ? "kd-high" : item.kd >= 0.9 ? "kd-mid" : "kd-low";

                              return (
                                <div
                                  key={`${item.pibeId}-${item.operator}-${idx}`}
                                  className={`map-op-stat-card ${item.side === "attack" ? "card-attack" : "card-defense"}`}
                                >
                                  <div className="op-card-top-row">
                                    <div className="op-info-left">
                                      <div className="op-icon-box">
                                        <OperatorIcon name={item.operator} size={28} />
                                      </div>
                                      <div>
                                        <div className="op-name">{item.operator}</div>
                                        <span className={`op-side-badge ${item.side}`}>
                                          {item.side === "attack" ? "Ataque" : "Defensa"}
                                        </span>
                                      </div>
                                    </div>

                                    <span
                                      className="player-owner-badge"
                                      style={{
                                        background: item.pibeId === "el_notorious" ? "rgba(234,179,8,0.15)" : item.pibeId === "chango_nocturno" ? "rgba(59,130,246,0.15)" : "rgba(236,72,153,0.15)",
                                        color: item.pibeColor,
                                        border: `1px solid ${item.pibeColor}40`,
                                      }}
                                    >
                                      <User size={11} /> {item.pibeName}
                                    </span>
                                  </div>

                                  {/* Metric Cards */}
                                  <div className="op-metrics-grid">
                                    <div className="metric-item">
                                      <span className="metric-label">Win Rate</span>
                                      <span className={`metric-value ${wrClass}`}>{item.winRate}%</span>
                                    </div>
                                    <div className="metric-item">
                                      <span className="metric-label">K/D</span>
                                      <span className={`metric-value ${kdClass}`}>{item.kd || "—"}</span>
                                    </div>
                                    <div className="metric-item">
                                      <span className="metric-label">Rondas</span>
                                      <span className="metric-value">{item.matchesOrRounds}</span>
                                    </div>
                                  </div>

                                  {/* Progress bar */}
                                  <div className="wr-progress-bar">
                                    <div
                                      className={`wr-progress-fill ${fillClass}`}
                                      style={{ width: `${Math.min(100, Math.max(5, item.winRate))}%` }}
                                    />
                                  </div>

                                  {/* Secondary Stats */}
                                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--muted)", fontWeight: 600 }}>
                                    <span>Headshot: <strong style={{ color: "var(--white)" }}>{item.headshotPct}%</strong></span>
                                    <span>KPR: <strong style={{ color: "var(--white)" }}>{item.kpr || "—"}</strong></span>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: BOMB SITES */}
                  {currentTab === "sites" && (
                    <div className="sites-pills">
                      {sites.map((site, i) => (
                        <div key={i} className="site-pill">
                          <span className="site-pill-floor">{site.floor}</span>
                          <span className="site-pill-name">{site.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
