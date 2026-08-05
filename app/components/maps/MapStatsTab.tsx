"use client";

import React, { useState } from "react";
import { User, Swords, Shield } from "lucide-react";
import { PIBES_CONFIG, PlayerMapOpStat, PlayerFilter } from "../MapsCatalog";
import { OperatorIcon } from "../OperatorIcon";

export type MapStatsTabProps = {
  mapName: string;
  playerOverview: { pibe: typeof PIBES_CONFIG[number]; stats: any }[];
  allOpStatsForMap: PlayerMapOpStat[];
};

export function MapStatsTab({
  mapName,
  playerOverview,
  allOpStatsForMap,
}: MapStatsTabProps) {
  const [panelSideFilter, setPanelSideFilter] = useState<"all" | "attack" | "defense">("all");
  const [panelPlayerFilter, setPanelPlayerFilter] = useState<PlayerFilter>("all");

  return (
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
                <article
                  key={pibe.id}
                  className="map-player-stat-card"
                  style={{ "--pibe-color": pibe.color } as React.CSSProperties}
                >
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
      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "12px",
          alignItems: "center",
        }}
      >
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
                        background:
                          item.pibeId === "el_notorious"
                            ? "rgba(234,179,8,0.15)"
                            : item.pibeId === "chango_nocturno"
                            ? "rgba(59,130,246,0.15)"
                            : "rgba(236,72,153,0.15)",
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
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "10px",
                      color: "var(--muted)",
                      fontWeight: 600,
                    }}
                  >
                    <span>
                      Headshot: <strong style={{ color: "var(--white)" }}>{item.headshotPct}%</strong>
                    </span>
                    <span>
                      KPR: <strong style={{ color: "var(--white)" }}>{item.kpr || "—"}</strong>
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
