"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, TrendingUp, TrendingDown, AlertCircle, Info } from "lucide-react";
import { PibeProfile } from "@/app/types";
import {
  calculateSquadMapWinChance,
  SquadMapAffinity,
} from "../../data/playerMapStats";

export type MapAffinityHudProps = {
  matchMap: string;
  activePibeProfiles?: PibeProfile[];
};

export function MapAffinityHud({
  matchMap,
  activePibeProfiles,
}: MapAffinityHudProps) {
  const [showAffinityDetails, setShowAffinityDetails] = useState(false);

  const squadMapAffinity: SquadMapAffinity | null = useMemo(() => {
    if (!activePibeProfiles || activePibeProfiles.length === 0) return null;
    return calculateSquadMapWinChance(
      matchMap,
      activePibeProfiles.map((p) => ({ id: p.id, displayName: p.displayName }))
    );
  }, [matchMap, activePibeProfiles]);

  const mapTagStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "4px 10px",
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderRadius: 7,
    fontSize: 12,
    fontWeight: 700,
    color: "var(--white)",
    letterSpacing: "0.03em",
  };

  if (!squadMapAffinity) {
    return (
      <div style={mapTagStyle}>
        <MapPin size={12} style={{ color: "var(--atk)" }} />
        {matchMap}
      </div>
    );
  }

  const isFav = squadMapAffinity.tier === "favorable";
  const isRisk = squadMapAffinity.tier === "risky";
  const badgeColor = isFav ? "#10b981" : isRisk ? "#ef4444" : "#3b82f6";
  const badgeBg = isFav ? "rgba(16,185,129,0.15)" : isRisk ? "rgba(239,68,68,0.15)" : "rgba(59,130,246,0.15)";
  const badgeBorder = isFav ? "rgba(16,185,129,0.35)" : isRisk ? "rgba(239,68,68,0.35)" : "rgba(59,130,246,0.35)";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, zIndex: 50, position: "relative" }}>
      <div style={mapTagStyle}>
        <MapPin size={12} style={{ color: "var(--atk)" }} />
        {matchMap}
      </div>

      <div style={{ position: "relative" }}>
        <button
          type="button"
          onClick={() => setShowAffinityDetails(!showAffinityDetails)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            background: badgeBg,
            border: `1px solid ${badgeBorder}`,
            borderRadius: 7,
            fontSize: 11,
            fontWeight: 800,
            color: badgeColor,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          title="Afinidad y expectativa de victoria de la escuadra"
        >
          {isFav ? (
            <TrendingUp size={12} />
          ) : isRisk ? (
            <AlertCircle size={12} />
          ) : (
            <Info size={12} />
          )}
          <span>{squadMapAffinity.winChance}% WR</span>
          <span style={{ opacity: 0.75, fontWeight: 600 }}>• {squadMapAffinity.label}</span>
        </button>

        <AnimatePresence>
          {showAffinityDetails && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: 8,
                width: 290,
                background: "#0e1117",
                border: "1px solid var(--border-bright)",
                borderRadius: 12,
                padding: "14px 16px",
                boxShadow: "0 14px 35px rgba(0,0,0,0.65)",
                zIndex: 100,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
                <div>
                  <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted-bright)" }}>
                    Afinidad de Escuadra
                  </span>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "var(--white)" }}>{matchMap}</h4>
                </div>
                <div
                  style={{
                    padding: "3px 8px",
                    borderRadius: 6,
                    background: badgeBg,
                    border: `1px solid ${badgeBorder}`,
                    color: badgeColor,
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  {squadMapAffinity.winChance}% Prob.
                </div>
              </div>

              {/* Player stats list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {squadMapAffinity.playerStats.map((st) => (
                  <div
                    key={st.playerId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "6px 8px",
                      background: "rgba(255,255,255,0.03)",
                      borderRadius: 6,
                      fontSize: 11,
                    }}
                  >
                    <span style={{ fontWeight: 700, color: "var(--white)" }}>{st.displayName}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontWeight: 800, color: st.winRate >= 54 ? "#10b981" : st.winRate <= 44 ? "#ef4444" : "var(--muted-bright)" }}>
                        {st.winRate}% WR
                      </span>
                      <span style={{ color: "var(--muted)", fontSize: 9 }}>•</span>
                      <span style={{ fontWeight: 800, color: st.kd >= 1.15 ? "#10b981" : st.kd <= 0.75 ? "#ef4444" : "var(--muted-bright)" }}>
                        {st.kd} K/D
                      </span>
                      <span style={{ fontSize: 10, color: "var(--muted)", fontStyle: "italic" }}>({st.matches} PJ)</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Positive Factors */}
              {squadMapAffinity.positiveFactors.length > 0 && (
                <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 8, padding: "8px 10px" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 800, color: "#10b981", textTransform: "uppercase" }}>
                    <TrendingUp size={11} /> Factores A Favor (+)
                  </span>
                  <ul style={{ margin: "4px 0 0 0", paddingLeft: 14, fontSize: 11, color: "#a7f3d0" }}>
                    {squadMapAffinity.positiveFactors.map((fact, idx) => (
                      <li key={idx} style={{ marginTop: 2 }}>{fact}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Negative Factors / Risks */}
              {squadMapAffinity.negativeFactors.length > 0 && (
                <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "8px 10px" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 800, color: "#ef4444", textTransform: "uppercase" }}>
                    <TrendingDown size={11} /> Riesgos / Alertas (-)
                  </span>
                  <ul style={{ margin: "4px 0 0 0", paddingLeft: 14, fontSize: 11, color: "#fca5a5" }}>
                    {squadMapAffinity.negativeFactors.map((fact, idx) => (
                      <li key={idx} style={{ marginTop: 2 }}>{fact}</li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
