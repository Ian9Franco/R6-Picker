"use client";

import React, { useState } from "react";
import {
  MapPin,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Award,
} from "lucide-react";
import { mapBombSites } from "../../../data/catalog";
import { getMapPlayerStat } from "../../../data/playerMapStats";
import { PIBES_CONFIG, PlayerMapOpStat } from "../MapsCatalog";
import { MapStrategiesTab } from "./MapStrategiesTab";
import { MapStatsTab } from "./MapStatsTab";

export type MapCardItemProps = {
  mapName: string;
  mapStatsData: Record<string, PlayerMapOpStat[]>;
};

export function MapCardItem({ mapName, mapStatsData }: MapCardItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTab, setCurrentTab] = useState<"strategies" | "stats" | "sites">("stats");

  const sites = mapBombSites[mapName] || [];
  const isCompetitive = sites.length > 0;

  const allOpStatsForMap = mapStatsData[mapName] || [];
  const playerOverview = PIBES_CONFIG.flatMap((pibe) => {
    const stats = getMapPlayerStat(pibe.id, mapName);
    return stats ? [{ pibe, stats }] : [];
  });
  const mapMvp = [...playerOverview].sort(
    (a, b) =>
      b.stats.winRate - a.stats.winRate ||
      b.stats.kd - a.stats.kd ||
      b.stats.matches - a.stats.matches
  )[0];

  return (
    <div className={`map-card ${!isCompetitive ? "map-non-competitive" : ""}`}>
      <div
        className="map-card-header"
        role={isCompetitive ? "button" : undefined}
        tabIndex={isCompetitive ? 0 : undefined}
        aria-expanded={isCompetitive ? isExpanded : undefined}
        onClick={() => isCompetitive && setIsExpanded(!isExpanded)}
        onKeyDown={(event) => {
          if (isCompetitive && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            setIsExpanded(!isExpanded);
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
                title={`Mejor rendimiento general: ${mapMvp.stats.winRate.toFixed(
                  1
                )}% WR · ${mapMvp.stats.kd.toFixed(2)} K/D`}
              >
                <Sparkles size={11} /> MVP: {mapMvp.pibe.name}
                <span className="map-mvp-metrics">
                  {mapMvp.stats.winRate.toFixed(1)}% · {mapMvp.stats.kd.toFixed(2)} K/D
                </span>
              </span>
            )}
          </div>

          <div className="map-card-meta">
            {isCompetitive
              ? `${sites.length} zonas de bomba oficiales`
              : "Sin zonas para ranked"}
          </div>
        </div>

        <div className="map-card-actions">
          {isCompetitive && (
            <button
              className="map-sites-toggle"
              onClick={(event) => {
                event.stopPropagation();
                setIsExpanded(!isExpanded);
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
              onClick={() => setCurrentTab("strategies")}
            >
              <Sparkles size={14} /> Estrategias & Jugadas
            </button>
            <button
              className={`map-panel-tab ${currentTab === "stats" ? "active" : ""}`}
              onClick={() => setCurrentTab("stats")}
            >
              <Award size={14} /> Rendimiento ({playerOverview.length})
            </button>
            <button
              className={`map-panel-tab ${currentTab === "sites" ? "active" : ""}`}
              onClick={() => setCurrentTab("sites")}
            >
              <MapPin size={14} /> Zonas de Bomba ({sites.length})
            </button>
          </div>

          {/* TAB 0: TACTICAL STRATEGIES & PLAYS */}
          {currentTab === "strategies" && <MapStrategiesTab mapName={mapName} />}

          {/* TAB 1: PIBES OPERATOR STATS FOR THIS MAP */}
          {currentTab === "stats" && (
            <MapStatsTab
              mapName={mapName}
              playerOverview={playerOverview}
              allOpStatsForMap={allOpStatsForMap}
            />
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
}
