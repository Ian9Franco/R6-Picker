"use client";

import { Flame, Info, Search, Shield, Swords, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { attackers, defenders, operators, type Side } from "../../data/catalog";
import { PIBES_CONFIG, normalizeOperator } from "../../data/pibes";
import { OperatorIcon } from "./OperatorIcon";

type FilterSide = Side | "all";

type OperatorsCatalogProps = {
  currentOperator: string;
  matchMap?: string;
  onSelectOperator: (opName: string) => void;
};

const PIBE_COLORS: Record<string, string> = {
  chango_nocturno: "#f97316",
  el_notorious: "#3b82f6",
  azusa_cooper09: "#a855f7",
};

/** Calculate direct affinity between a pibe and operator using FACTOS data. */
function calcPibeOpAffinity(pibeId: string, opName: string): number {
  const pibe = PIBES_CONFIG.find((p) => p.id === pibeId);
  if (!pibe) return 0;

  const opKey = opName.toLowerCase();
  const op = normalizeOperator(opName);

  // 1. Is it an identity/mains operator? → highest affinity
  const isIdentity = pibe.identityOperators.some((o) => o.toLowerCase() === opKey);
  if (isIdentity) return 92;

  // 2. Is it a comfort operator?
  const isComfort = pibe.comfortOperators.some((o) => o.toLowerCase() === opKey);
  if (isComfort) return 75;

  // 3. Is it an avoid operator?
  const isAvoid = pibe.avoidOperators.some((o) => o.toLowerCase() === opKey);
  if (isAvoid) return 10;

  // 4. Is it a tryout operator?
  const isTryout = [...pibe.tryoutAttack, ...pibe.tryoutDefense].some(
    (t) => t.operatorId.toLowerCase() === opKey
  );
  if (isTryout) return 55;

  // 5. Role affinity overlap
  let bestRoleScore = 0;
  for (const role of op.roles) {
    const entry = pibe.roleAffinity[role];
    if (entry) {
      const score = (entry as any).score ?? 0;
      if (score > bestRoleScore) bestRoleScore = score;
    }
  }

  if (bestRoleScore > 0) {
    return Math.round(20 + bestRoleScore * 45);
  }

  return 25; // neutral
}

function getRoleClass(role: string): string {
  if (role.includes("dura")) return "op-role-breach-hard";
  if (role.includes("blanda")) return "op-role-breach-soft";
  if (role.includes("Entrada") || role.includes("entry")) return "op-role-entry";
  if (role.includes("Anti-gadget") || role.includes("anti")) return "op-role-anti";
  if (role.includes("Información")) return "op-role-info";
  if (role.includes("zona")) return "op-role-zone";
  if (role.includes("Ancla")) return "op-role-anchor";
  if (role.includes("Roamer")) return "op-role-roam";
  if (role.includes("Trampas")) return "op-role-trap";
  if (role.includes("accesos") || role.includes("Bloqueo")) return "op-role-block";
  if (role.includes("Negación")) return "op-role-block";
  return "op-role-info";
}

function getPibeTrackerStatsForOp(pibeId: string, opName: string, side: string) {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("r6_tracker_map_stats_v1");
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    const key = `${pibeId}_${side}_${opName.toLowerCase().replace(/\s+/g, "_")}`;
    const entry = parsed[key];
    if (!entry || !entry.maps || entry.maps.length === 0) return null;

    let totalWins = 0;
    let totalLosses = 0;
    let totalRounds = 0;
    let totalKdSum = 0;
    let mapCount = 0;

    for (const m of entry.maps) {
      if (m.wins !== undefined && m.losses !== undefined) {
        totalWins += m.wins;
        totalLosses += m.losses;
      }
      totalRounds += m.matchesOrRounds || 0;
      if (m.kd !== undefined) {
        totalKdSum += m.kd;
        mapCount++;
      }
    }

    const totalMatches = totalWins + totalLosses || totalRounds;
    const winRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : undefined;
    const kd = mapCount > 0 ? (totalKdSum / mapCount).toFixed(2) : undefined;

    return {
      totalRounds,
      totalMatches,
      winRate,
      kd,
      maps: entry.maps as any[],
    };
  } catch (e) {
    return null;
  }
}

export function OperatorsCatalog({
  currentOperator,
  matchMap,
  onSelectOperator,
}: OperatorsCatalogProps) {
  const [opQuery, setOpQuery] = useState("");
  const [opSideFilter, setOpSideFilter] = useState<FilterSide>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedDetailOp, setSelectedDetailOp] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const pool = useMemo(() => {
    if (opSideFilter === "attack") return attackers;
    if (opSideFilter === "defense") return defenders;
    return operators;
  }, [opSideFilter]);

  const availableRoles = useMemo(() => {
    const seen = new Set<string>();
    pool.forEach((op) => seen.add(op.role));
    return Array.from(seen);
  }, [pool]);

  const filteredOperators = useMemo(() => {
    let result = pool;
    if (roleFilter !== "all") result = result.filter((op) => op.role === roleFilter);
    if (opQuery.trim()) {
      const q = opQuery.toLowerCase();
      result = result.filter(
        (op) =>
          op.name.toLowerCase().includes(q) ||
          op.role.toLowerCase().includes(q) ||
          (op.desc && op.desc.toLowerCase().includes(q))
      );
    }
    return result;
  }, [pool, roleFilter, opQuery]);

  // Pre-calculate affinities for all operators
  const affinityCache = useMemo(() => {
    const cache: Record<string, { pibe: typeof PIBES_CONFIG[0]; pct: number }[]> = {};
    for (const item of operators) {
      const ranked = PIBES_CONFIG
        .map((pibe) => ({ pibe, pct: calcPibeOpAffinity(pibe.id, item.name) }))
        .sort((a, b) => b.pct - a.pct);
      cache[item.name] = ranked;
    }
    return cache;
  }, []);

  const detailOpObj = useMemo(() => {
    if (!selectedDetailOp) return null;
    const catItem = operators.find((o) => o.name === selectedDetailOp);
    const prof = normalizeOperator(selectedDetailOp);
    return { ...catItem, ...prof };
  }, [selectedDetailOp]);

  const handleCardClick = (opName: string) => {
    onSelectOperator(opName);
    setSelectedDetailOp(opName);
  };

  return (
    <div className="catalog-shell">
      {/* Controls */}
      <div className="catalog-controls">
        <div className="search-row">
          <Search size={15} color="var(--muted)" />
          <input
            type="text"
            placeholder="Buscar por nombre, rol o habilidad..."
            value={opQuery}
            onChange={(e) => setOpQuery(e.target.value)}
          />
        </div>

        <div className="side-tabs">
          <button className={`side-tab tab-all ${opSideFilter === "all" ? "active" : ""}`} onClick={() => { setOpSideFilter("all"); setRoleFilter("all"); }}>
            Todos ({operators.length})
          </button>
          <button className={`side-tab tab-atk ${opSideFilter === "attack" ? "active" : ""}`} onClick={() => { setOpSideFilter("attack"); setRoleFilter("all"); }}>
            <Swords size={13} /> ATK ({attackers.length})
          </button>
          <button className={`side-tab tab-def ${opSideFilter === "defense" ? "active" : ""}`} onClick={() => { setOpSideFilter("defense"); setRoleFilter("all"); }}>
            <Shield size={13} /> DEF ({defenders.length})
          </button>
        </div>

        <div className="role-filter-strip">
          <button data-role="all" className={`role-chip ${roleFilter === "all" ? "active-all" : ""}`} onClick={() => setRoleFilter("all")}>
            Todos
          </button>
          {availableRoles.map((role) => (
            <button key={role} data-role={role} className={`role-chip ${roleFilter === role ? "active" : ""}`} onClick={() => setRoleFilter(role)}>
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Operator Cards */}
      <div className="ops-grid">
        {filteredOperators.map((item) => {
          const isSelected = currentOperator === item.name;
          const roleClass = getRoleClass(item.role);
          const ranked = affinityCache[item.name] ?? [];

          return (
            <button
              key={item.name}
              className={`op-card ${isSelected ? "op-selected" : ""}`}
              onClick={() => handleCardClick(item.name)}
            >
              {/* Side stripe */}
              <div
                className="op-card-stripe"
                style={{
                  background:
                    item.side === "attack"
                      ? "linear-gradient(90deg, var(--atk), transparent)"
                      : "linear-gradient(90deg, var(--def), transparent)",
                }}
              />

              <div className="op-card-body">
                <div className="op-card-top">
                  {/* Clean SVG icon frame */}
                  <div className="op-card-icon-frame">
                    <OperatorIcon name={item.name} size={36} />
                  </div>
                  <div className="op-card-meta">
                    <span className="op-card-name">{item.name}</span>
                    <span className={`op-card-role ${roleClass}`}>{item.role}</span>
                  </div>
                </div>

                {item.desc && <p className="op-card-desc">{item.desc}</p>}

                {/* Pibe Affinity Ranking */}
                <div className="op-pibe-ranking">
                  {ranked.map((entry, rankIdx) => (
                    <div key={entry.pibe.id} className="op-pibe-rank-row">
                      <span style={{ color: "var(--muted)", fontSize: "10px", fontWeight: 600, minWidth: "14px" }}>
                        {rankIdx + 1}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: PIBE_COLORS[entry.pibe.id] ?? "#9ca3af",
                          minWidth: "70px",
                        }}
                      >
                        {entry.pibe.displayName}
                      </span>
                      <div className="op-pibe-rank-bar-track">
                        <div
                          className="op-pibe-rank-bar-fill"
                          style={{
                            width: `${entry.pct}%`,
                            background: PIBE_COLORS[entry.pibe.id] ?? "#6b7280",
                          }}
                        />
                      </div>
                      <span style={{ fontSize: "10px", color: "var(--fg-dim, #94a3b8)", minWidth: "30px", textAlign: "right" }}>
                        {entry.pct}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {isSelected && (
                <div className="op-selected-badge">
                  <span style={{ fontSize: "9px", fontWeight: 700 }}>✓</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* DETAILED STATS MODAL FOR CLICKED OPERATOR (PORTALED) */}
      {mounted && detailOpObj && createPortal(
        <div className="ban-modal-overlay" onClick={() => setSelectedDetailOp(null)}>
          <div className="op-detail-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="ban-modal-close" onClick={() => setSelectedDetailOp(null)}>
              <X size={18} />
            </button>

            {/* Modal Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "14px" }}>
              <div style={{ padding: "6px", borderRadius: "12px", background: "rgba(0,0,0,0.5)", border: `2px solid ${detailOpObj.side === "attack" ? "var(--atk)" : "var(--def)"}` }}>
                <OperatorIcon name={detailOpObj.name} size={48} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h2 style={{ fontSize: "20px", fontWeight: 800, margin: 0, color: "var(--white)" }}>{detailOpObj.name}</h2>
                  <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: detailOpObj.side === "attack" ? "rgba(239,68,68,0.2)" : "rgba(59,130,246,0.2)", color: detailOpObj.side === "attack" ? "#fca5a5" : "#93c5fd", textTransform: "uppercase" }}>
                    {detailOpObj.side === "attack" ? "Ataque" : "Defensa"}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "var(--muted-bright)", marginTop: "2px" }}>
                  Rol: <strong>{detailOpObj.role}</strong> · Dificultad: <strong style={{ textTransform: "capitalize" }}>{detailOpObj.difficulty || "Media"}</strong>
                </div>
              </div>
            </div>

            {/* Description & Provides/Needs */}
            {detailOpObj.desc && (
              <p style={{ fontSize: "12px", color: "var(--fg-dim, #cbd5e1)", lineHeight: 1.4, margin: "0 0 16px 0", background: "rgba(255,255,255,0.03)", padding: "10px", borderRadius: "8px" }}>
                {detailOpObj.desc}
              </p>
            )}

            {/* STATS BREAKDOWN PER PIBE */}
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--white)", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Flame size={14} color="#f97316" /> Rendimiento y Compatibilidad por Pibe
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {PIBES_CONFIG.map((pibe) => {
                const affinityPct = calcPibeOpAffinity(pibe.id, detailOpObj.name);
                const trackerStats = getPibeTrackerStatsForOp(pibe.id, detailOpObj.name, detailOpObj.side);

                const isMain = pibe.identityOperators.some((o) => o.toLowerCase() === detailOpObj.name.toLowerCase());
                const isComfort = pibe.comfortOperators.some((o) => o.toLowerCase() === detailOpObj.name.toLowerCase());
                const isAvoid = pibe.avoidOperators.some((o) => o.toLowerCase() === detailOpObj.name.toLowerCase());

                const mapPerfEntry = pibe.mapPerformance[detailOpObj.side === "attack" ? "attack" : "defense"]?.[matchMap || ""] ||
                  Object.values(pibe.mapPerformance[detailOpObj.side === "attack" ? "attack" : "defense"] || {})[0];

                return (
                  <div key={pibe.id} style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${PIBE_COLORS[pibe.id] || "rgba(255,255,255,0.1)"}`, borderRadius: "10px", padding: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "14px", fontWeight: 800, color: PIBE_COLORS[pibe.id] }}>{pibe.displayName}</span>
                        {isMain && <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: "rgba(249,115,22,0.2)", color: "#fdba74", fontWeight: 700 }}>MAIN</span>}
                        {isComfort && <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: "rgba(59,130,246,0.2)", color: "#93c5fd", fontWeight: 700 }}>CONFORT</span>}
                        {isAvoid && <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: "rgba(239,68,68,0.2)", color: "#fca5a5", fontWeight: 700 }}>EVITAR</span>}
                      </div>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: PIBE_COLORS[pibe.id] }}>{affinityPct}% Afinidad</span>
                    </div>

                    {/* Stats Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", background: "rgba(255,255,255,0.03)", padding: "8px", borderRadius: "6px", fontSize: "11px", marginBottom: "6px" }}>
                      <div>
                        <span style={{ color: "var(--muted)", display: "block", fontSize: "10px" }}>Winrate</span>
                        <strong style={{ color: trackerStats?.winRate && trackerStats.winRate >= 50 ? "#4ade80" : "#f8fafc" }}>
                          {trackerStats?.winRate !== undefined ? `${trackerStats.winRate}%` : (mapPerfEntry?.winRate ? `${mapPerfEntry.winRate}%` : "Sin datos")}
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: "var(--muted)", display: "block", fontSize: "10px" }}>K/D Ratio</span>
                        <strong style={{ color: trackerStats?.kd && Number(trackerStats.kd) >= 1.2 ? "#38bdf8" : "#f8fafc" }}>
                          {trackerStats?.kd ? `${trackerStats.kd}` : (mapPerfEntry?.kd ? `${mapPerfEntry.kd}` : "N/D")}
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: "var(--muted)", display: "block", fontSize: "10px" }}>Rondas / Muestra</span>
                        <strong>{trackerStats?.totalRounds ? `${trackerStats.totalRounds} rondas` : (mapPerfEntry?.rounds ? `${mapPerfEntry.rounds} rondas` : "FACTOS")}</strong>
                      </div>
                    </div>

                    {mapPerfEntry?.tacticalNote && (
                      <div style={{ fontSize: "10px", color: "var(--fg-dim)", marginTop: "4px" }}>
                        📝 <strong>Nota Táctica:</strong> {mapPerfEntry.tacticalNote}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
              <button
                className="variant-tab-btn active"
                onClick={() => setSelectedDetailOp(null)}
                style={{ padding: "8px 16px" }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
