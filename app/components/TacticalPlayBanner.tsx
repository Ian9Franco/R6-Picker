"use client";

import React from "react";
import { Side } from "@/app/types";
import { getSitePlaybook } from "../../data/sitePlaybooks";
import { getSiteStrategy } from "../../data/mapStrategies";

export type TacticalPlayBannerProps = {
  matchMap: string;
  selectedSiteName: string;
  currentSide: Side;
};

export function TacticalPlayBanner({
  matchMap,
  selectedSiteName,
  currentSide,
}: TacticalPlayBannerProps) {
  const playbookSite = getSitePlaybook(matchMap, selectedSiteName);
  const playbook = playbookSite?.[currentSide];
  const matchingPlay = playbook
    ? undefined
    : getSiteStrategy(matchMap, currentSide, selectedSiteName);

  if (!playbook && !matchingPlay) return null;

  const keyWallsStr = matchingPlay?.keyWalls?.length
    ? matchingPlay.keyWalls.join(", ")
    : undefined;
  const keyAreas = playbook?.keyAreas ?? matchingPlay?.keyAreas;
  const keyAreasStr = keyAreas?.length ? keyAreas.join(", ") : undefined;
  const antiGadget = matchingPlay?.antiGadgetPlan;
  const shownSiteName =
    playbookSite?.name ?? matchingPlay?.siteName ?? selectedSiteName;
  const shownFloor = playbookSite?.floor ?? matchingPlay?.floor ?? "Sitio";
  const shownTitle =
    playbook?.doctrine ?? matchingPlay?.playTitle ?? "Plan del sitio";
  const shownObjective =
    playbook?.objective ??
    matchingPlay?.objective ??
    "Coordinar la utilidad antes de ejecutar.";
  const shownTip = playbook?.approach[0] ?? matchingPlay?.proTip;

  return (
    <div
      style={{
        marginTop: 12,
        padding: "12px 16px",
        borderRadius: "10px",
        background:
          currentSide === "attack"
            ? "rgba(239,68,68,0.06)"
            : "rgba(59,130,246,0.06)",
        border: `1px solid ${
          currentSide === "attack"
            ? "rgba(239,68,68,0.25)"
            : "rgba(59,130,246,0.25)"
        }`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 4,
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: currentSide === "attack" ? "var(--atk)" : "var(--def)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          🎯 Jugada Táctica ({currentSide === "attack" ? "Ataque" : "Defensa"}) —{" "}
          {shownSiteName} ({shownFloor})
        </span>
      </div>
      <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--white)" }}>
        {shownTitle}
      </div>
      <p
        style={{
          fontSize: "11px",
          color: "var(--fg-dim, #cbd5e1)",
          margin: "4px 0 6px 0",
          lineHeight: 1.4,
        }}
      >
        {shownObjective}
      </p>

      {/* Strategic Tags Row */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          fontSize: "10px",
          marginTop: "6px",
        }}
      >
        {keyWallsStr && (
          <span
            style={{
              padding: "2px 7px",
              borderRadius: "4px",
              background: "rgba(255,255,255,0.08)",
              color: "#f8fafc",
            }}
          >
            🧱 Paredes clave: <strong>{keyWallsStr}</strong>
          </span>
        )}
        {keyAreasStr && (
          <span
            style={{
              padding: "2px 7px",
              borderRadius: "4px",
              background: "rgba(255,255,255,0.08)",
              color: "#f8fafc",
            }}
          >
            🗺️ Áreas clave: <strong>{keyAreasStr}</strong>
          </span>
        )}
        {antiGadget?.primary?.length && (
          <span
            style={{
              padding: "2px 7px",
              borderRadius: "4px",
              background: "rgba(234, 179, 8, 0.15)",
              color: "#fef08a",
              border: "1px solid rgba(234, 179, 8, 0.3)",
            }}
          >
            ⚡ Anti-Gadget: <strong>{antiGadget.primary.join(", ")}</strong>
          </span>
        )}
      </div>

      {shownTip && (
        <div
          style={{
            marginTop: "8px",
            fontSize: "10px",
            color: "#fef08a",
            background: "rgba(254, 240, 138, 0.08)",
            padding: "4px 8px",
            borderRadius: "4px",
          }}
        >
          💡 <strong>{playbook ? "Primer paso" : "Pro Tip"}:</strong> {shownTip}
        </div>
      )}
    </div>
  );
}
