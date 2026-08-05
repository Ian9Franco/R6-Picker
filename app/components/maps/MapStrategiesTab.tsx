"use client";

import React from "react";
import { Swords, Shield } from "lucide-react";
import { getMapStrategies, getRecommendedOpsForPibe } from "../../../data/mapStrategies";
import { PIBES_CONFIG } from "../MapsCatalog";

export type MapStrategiesTabProps = {
  mapName: string;
};

export function MapStrategiesTab({ mapName }: MapStrategiesTabProps) {
  const profile = getMapStrategies(mapName);

  if (
    !profile ||
    (profile.attackStrategies.length === 0 && profile.defenseStrategies.length === 0)
  ) {
    return (
      <div
        style={{
          padding: "16px",
          background: "rgba(255,255,255,0.03)",
          borderRadius: "8px",
          border: "1px solid var(--border)",
          fontSize: "13px",
          color: "var(--muted)",
          marginTop: "12px",
        }}
      >
        💡 <strong>Map Táctico listo para pulir:</strong> Añadí tus jugadas y ejecuciones de Ataque/Defensa para {mapName} en <code>data/mapStrategies.ts</code>.
      </div>
    );
  }

  return (
    <div className="map-strategies-container" style={{ marginTop: "12px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Ataque Strategies */}
        {profile.attackStrategies.length > 0 && (
          <div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--atk)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "8px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Swords size={13} /> Estrategias de Ataque ({profile.attackStrategies.length})
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "10px",
              }}
            >
              {profile.attackStrategies.map((strat) => (
                <div
                  key={strat.id}
                  style={{
                    background: "rgba(239, 68, 68, 0.05)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    borderRadius: "10px",
                    padding: "12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#fca5a5" }}>
                      {strat.playTitle}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        background: "rgba(239, 68, 68, 0.2)",
                        color: "#fca5a5",
                      }}
                    >
                      {strat.siteName}
                    </span>
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--fg-dim, #cbd5e1)", margin: 0, lineHeight: 1.4 }}>
                    {strat.objective}
                  </p>

                  {/* Pibe Roles */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px" }}>
                    {strat.pibeAssignments.map((asgn) => {
                      const pibeObj = PIBES_CONFIG.find((p) => p.id === asgn.pibeId);
                      const opsList = getRecommendedOpsForPibe(asgn);
                      return (
                        <div
                          key={asgn.pibeId}
                          style={{
                            fontSize: "10px",
                            padding: "4px 8px",
                            background: "rgba(0,0,0,0.3)",
                            borderRadius: "6px",
                            borderLeft: `3px solid ${pibeObj?.color || "#6b7280"}`,
                          }}
                        >
                          <strong style={{ color: pibeObj?.color }}>
                            {pibeObj?.name} ({asgn.role}):
                          </strong>{" "}
                          {opsList.join(", ")} — <em>{asgn.taskDescription}</em>
                        </div>
                      );
                    })}
                  </div>
                  {strat.proTip && (
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#fef08a",
                        marginTop: "4px",
                        background: "rgba(254, 240, 138, 0.08)",
                        padding: "4px 8px",
                        borderRadius: "4px",
                      }}
                    >
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
            <div
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--def)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "8px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Shield size={13} /> Setups de Defensa ({profile.defenseStrategies.length})
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "10px",
              }}
            >
              {profile.defenseStrategies.map((strat) => (
                <div
                  key={strat.id}
                  style={{
                    background: "rgba(59, 130, 246, 0.05)",
                    border: "1px solid rgba(59, 130, 246, 0.2)",
                    borderRadius: "10px",
                    padding: "12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#93c5fd" }}>
                      {strat.playTitle}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        background: "rgba(59, 130, 246, 0.2)",
                        color: "#93c5fd",
                      }}
                    >
                      {strat.siteName}
                    </span>
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--fg-dim, #cbd5e1)", margin: 0, lineHeight: 1.4 }}>
                    {strat.objective}
                  </p>

                  {/* Pibe Roles */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px" }}>
                    {strat.pibeAssignments.map((asgn) => {
                      const pibeObj = PIBES_CONFIG.find((p) => p.id === asgn.pibeId);
                      const opsList = getRecommendedOpsForPibe(asgn);
                      return (
                        <div
                          key={asgn.pibeId}
                          style={{
                            fontSize: "10px",
                            padding: "4px 8px",
                            background: "rgba(0,0,0,0.3)",
                            borderRadius: "6px",
                            borderLeft: `3px solid ${pibeObj?.color || "#6b7280"}`,
                          }}
                        >
                          <strong style={{ color: pibeObj?.color }}>
                            {pibeObj?.name} ({asgn.role}):
                          </strong>{" "}
                          {opsList.join(", ")} — <em>{asgn.taskDescription}</em>
                        </div>
                      );
                    })}
                  </div>
                  {strat.proTip && (
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#fef08a",
                        marginTop: "4px",
                        background: "rgba(254, 240, 138, 0.08)",
                        padding: "4px 8px",
                        borderRadius: "4px",
                      }}
                    >
                      💡 <strong>Pro Tip:</strong> {strat.proTip}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
