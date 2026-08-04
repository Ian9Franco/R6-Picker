"use client";

import { Flame, Info, Search, Shield, Swords } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { attackers, defenders, operators, type Side } from "../../data/catalog";
import { PIBES_CONFIG, normalizeOperator } from "../../data/pibes";
import { getOperatorPlayerStat } from "../../data/operatorPlayerStats";
import { OperatorIcon } from "./OperatorIcon";

type FilterSide = Side | "all";

type OperatorsCatalogProps = {
  currentOperator: string;
  onSelectOperator: (opName: string) => void;
};

const PIBE_COLORS: Record<string, string> = {
  chango_nocturno: "#f97316",
  el_notorious: "#3b82f6",
  azusa_cooper09: "#a855f7",
};

/** Explain the direct affinity between a pibe and an operator using FACTOS data. */
type AffinityDetail = { score: number; reasons: string[] };

function getPibeOpAffinityDetail(pibeId: string, opName: string): AffinityDetail {
  const pibe = PIBES_CONFIG.find((p) => p.id === pibeId);
  if (!pibe) return { score: 0, reasons: ["No hay perfil FACTOS para este jugador."] };

  const opKey = opName.toLowerCase();
  const op = normalizeOperator(opName);

  if (pibe.identityOperators.some((name) => name.toLowerCase() === opKey)) {
    return { score: 92, reasons: ["Es uno de sus agentes de identidad (main)."] };
  }
  if (pibe.comfortOperators.some((name) => name.toLowerCase() === opKey)) {
    return { score: 75, reasons: ["Es un agente de confort declarado en su perfil."] };
  }
  if (pibe.avoidOperators.some((name) => name.toLowerCase() === opKey)) {
    return { score: 10, reasons: ["El perfil recomienda evitar este agente."] };
  }
  if ([...pibe.tryoutAttack, ...pibe.tryoutDefense].some((trial) => trial.operatorId.toLowerCase() === opKey)) {
    return { score: 55, reasons: ["Esta marcado como agente de prueba: hay potencial, pero aun no es una preferencia consolidada."] };
  }

  let bestRole: string | undefined;
  let bestRoleScore = 0;
  for (const role of op.roles) {
    const entry = pibe.roleAffinity[role];
    const score = (entry as any)?.score ?? 0;
    if (score > bestRoleScore) {
      bestRole = role;
      bestRoleScore = score;
    }
  }

  if (bestRole) {
    return {
      score: Math.round(20 + bestRoleScore * 45),
      reasons: ["Coincide con su afinidad de rol: " + bestRole + " (" + Math.round(bestRoleScore * 100) + "%)."],
    };
  }

  return { score: 25, reasons: ["No es main, confort, prueba ni una coincidencia fuerte de roles; afinidad neutral."] };
}

function calcPibeOpAffinity(pibeId: string, opName: string): number {
  return getPibeOpAffinityDetail(pibeId, opName).score;
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

type TrackerStatsStore = Record<string, any>;

const STORAGE_KEY = "r6_tracker_map_stats_v1";

/** Matches IDs, display names and filenames despite underscores, spaces or accents. */
function normalizeTrackerKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function getPibeTrackerStatsForOp(
  imports: TrackerStatsStore,
  pibeId: string,
  opName: string,
  side: string
) {
  const entry = Object.values(imports).find((candidate: any) =>
    candidate?.side === side &&
    normalizeTrackerKey(candidate?.playerId || candidate?.player || "") === normalizeTrackerKey(pibeId) &&
    normalizeTrackerKey(candidate?.operator || "") === normalizeTrackerKey(opName)
  ) as any;

  if (!entry?.maps?.length) return null;

  const maps = entry.maps;

  let totalWins = 0;
  let totalLosses = 0;
  let totalRounds = 0;
  let weightedKd = 0;
  let kdWeight = 0;

  for (const map of maps) {
    totalWins += Number(map.wins) || 0;
    totalLosses += Number(map.losses) || 0;
    const sample = Number(map.matchesOrRounds) || 0;
    totalRounds += sample;
    if (typeof map.kd === "number") {
      weightedKd += map.kd * (sample || 1);
      kdWeight += sample || 1;
    }
  }

  const totalMatches = totalWins + totalLosses || totalRounds;
  return {
    matches: totalMatches,
    winRate: totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : undefined,
    kd: kdWeight > 0 ? (weightedKd / kdWeight).toFixed(2) : undefined,
  };
}

export function OperatorsCatalog({
  currentOperator,
  onSelectOperator,
}: OperatorsCatalogProps) {
  const [opQuery, setOpQuery] = useState("");
  const [opSideFilter, setOpSideFilter] = useState<FilterSide>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [pibeSortId, setPibeSortId] = useState<string>("all");
  const [selectedDetailOp, setSelectedDetailOp] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [trackerImports, setTrackerImports] = useState<TrackerStatsStore>({});

  useEffect(() => {
    setMounted(true);

    const loadTrackerImports = async () => {
      try {
        const response = await fetch("/api/save-tracker-stats");
        if (response.ok) {
          const data = await response.json();
          if (data.imports) {
            setTrackerImports(data.imports);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data.imports));
            return;
          }
        }
      } catch (error) {
        console.error("Error al cargar las estadisticas de Tracker:", error);
      }

      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) setTrackerImports(JSON.parse(stored));
      } catch (error) {
        console.error("Error al leer las estadisticas locales de Tracker:", error);
      }
    };

    loadTrackerImports();
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
    if (pibeSortId !== "all") {
      result = [...result].sort((a, b) => {
        const affinityDifference = calcPibeOpAffinity(pibeSortId, b.name) - calcPibeOpAffinity(pibeSortId, a.name);
        return affinityDifference || a.name.localeCompare(b.name);
      });
    }
    return result;
  }, [pool, roleFilter, opQuery, pibeSortId]);

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

        <label className="pibe-affinity-filter">
          <span>Ordenar por afinidad</span>
          <select value={pibeSortId} onChange={(event) => setPibeSortId(event.target.value)}>
            <option value="all">Sin ordenar</option>
            {PIBES_CONFIG.map((pibe) => (
              <option key={pibe.id} value={pibe.id}>{pibe.displayName}: mayor a menor</option>
            ))}
          </select>
        </label>

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
                const affinityDetail = getPibeOpAffinityDetail(pibe.id, detailOpObj.name);
                const affinityPct = affinityDetail.score;
                const trackerStats = getOperatorPlayerStat(pibe.id, detailOpObj.name) ??
                  getPibeTrackerStatsForOp(trackerImports, pibe.id, detailOpObj.name, detailOpObj.side);

                const isMain = pibe.identityOperators.some((o) => o.toLowerCase() === detailOpObj.name.toLowerCase());
                const isComfort = pibe.comfortOperators.some((o) => o.toLowerCase() === detailOpObj.name.toLowerCase());
                const isAvoid = pibe.avoidOperators.some((o) => o.toLowerCase() === detailOpObj.name.toLowerCase());

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
                          {trackerStats?.winRate !== undefined ? `${trackerStats.winRate}%` : "Sin datos reales"}
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: "var(--muted)", display: "block", fontSize: "10px" }}>K/D Ratio</span>
                        <strong style={{ color: trackerStats?.kd && Number(trackerStats.kd) >= 1.2 ? "#38bdf8" : "#f8fafc" }}>
                          {trackerStats?.kd ? `${trackerStats.kd}` : "Sin datos reales"}
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: "var(--muted)", display: "block", fontSize: "10px" }}>Partidas</span>
                        <strong>{trackerStats?.matches ? `${trackerStats.matches} partidas` : "Sin datos reales"}</strong>
                      </div>
                    </div>
                    <div style={{ fontSize: "10px", color: "var(--fg-dim, #cbd5e1)", lineHeight: 1.35 }}>
                      <strong>Por que esta afinidad:</strong> {affinityDetail.reasons.join(" ")}
                    </div>
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
