"use client";

import React from "react";
import {
  Side,
  RoundLog,
  OperatorRecommendation,
  BombSite,
  PibeProfile,
  AttackSiteProfile,
  SquadRecommendation,
  AdaptiveEngineOutput,
  VariantTabKey,
} from "@/app/types";
import {
  Shield,
  Swords,
  Layers,
  Shuffle,
  Lock,
  Check,
  Compass,
  Flame,
  XCircle,
  RefreshCw,
} from "lucide-react";

import { MapAffinityHud } from "./MapAffinityHud";
import { QuickBanManager } from "./QuickBanManager";
import { TacticalPlayBanner } from "./TacticalPlayBanner";
import { OperatorRecommendationsList } from "./OperatorRecommendationsList";
import { MatchHistorySection } from "./MatchHistorySection";
import { OperatorIcon } from "./OperatorIcon";

const MAX_SCORE = 4;

export type ActiveMatchProps = {
  matchMap: string;
  myScore: number;
  opponentScore: number;
  currentRoundNum: number;
  isOvertime?: boolean;
  currentSide: Side;
  ourBans: string[];
  enemyBans: string[];
  selectedSiteName: string;
  lockedSites: string[];
  enemyLockedSites?: string[];
  history: RoundLog[];
  recommendations: OperatorRecommendation[];
  squadRecommendation?: SquadRecommendation | null;
  personalized?: boolean;
  opRoll: number;
  isMulti?: boolean;
  allMapSites: BombSite[];

  // Site Profile & Tactical Controls
  siteProfile?: AttackSiteProfile;
  selectedRouteId: string;
  observedDefenseIds: string[];
  setSelectedRouteId: (routeId: string) => void;
  onToggleObservedDefense: (defenseId: string) => void;

  // Handlers
  onRecordRound: (result: "win" | "loss") => void;
  onUndoLastRound: () => void;
  onToggleBan: (side: "our" | "enemy", opName: string) => void;
  onClearBans?: () => void;
  setSelectedSiteName: (siteName: string) => void;
  onRollAvailableSite: () => void;
  onRollOperator: () => void;
  onRollSinglePlayer: (index: number) => void;
  onSelectAlternative?: (playerIndex: number, newOpName: string) => void;
  activePibeProfiles?: PibeProfile[];

  // Dynamic Engine Variants
  engineOutput?: AdaptiveEngineOutput | null;
  activeVariantTab?: VariantTabKey;
  setActiveVariantTab?: (tab: VariantTabKey) => void;
  hasBreathingVariant?: boolean;
};

export function ActiveMatch({
  matchMap,
  myScore,
  opponentScore,
  currentRoundNum,
  isOvertime,
  currentSide,
  ourBans,
  enemyBans,
  selectedSiteName,
  lockedSites,
  enemyLockedSites = [],
  history,
  recommendations,
  squadRecommendation,
  personalized,
  opRoll,
  isMulti,
  allMapSites,
  siteProfile,
  selectedRouteId,
  observedDefenseIds,
  setSelectedRouteId,
  onToggleObservedDefense,
  onRecordRound,
  onUndoLastRound,
  onToggleBan,
  onClearBans,
  setSelectedSiteName,
  onRollAvailableSite,
  onRollOperator,
  onRollSinglePlayer,
  onSelectAlternative,
  activePibeProfiles,
  engineOutput,
  activeVariantTab,
  setActiveVariantTab,
  hasBreathingVariant,
}: ActiveMatchProps) {
  return (
    <div className="tab-panel">
      {/* Scoreboard HUD */}
      <div className="scoreboard-hud">
        <div className="scoreboard-top">
          <MapAffinityHud
            matchMap={matchMap}
            activePibeProfiles={activePibeProfiles}
          />
          <div className="round-badge">
            Ronda {currentRoundNum} · {currentSide === "attack" ? "Ataque" : "Defensa"}
          </div>
        </div>

        <div className="scoreboard-main" style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 16 }}>
          {/* NOSOTROS */}
          <div className="score-side us">
            <span className="score-label">Nosotros</span>
            <span className="score-num">{myScore}</span>
            <div className="score-pips">
              {Array.from({ length: MAX_SCORE }).map((_, i) => (
                <div key={i} className={`pip ${i < myScore ? "filled" : ""}`} />
              ))}
            </div>
          </div>

          {/* DYNAMIC SQUAD PICKS & VARIANTS HEADER CENTER */}
          <div
            className="score-center-hud"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              padding: "8px 18px",
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 12,
            }}
          >
            {/* Squad Operators Icons Bar */}
            {recommendations && recommendations.length > 0 ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                {recommendations.map((rec, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "4px 8px",
                      background: "rgba(0,0,0,0.4)",
                      borderRadius: 8,
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                    title={`${rec.playerLabel}: ${rec.opName}`}
                  >
                    <OperatorIcon name={rec.opName} size={22} />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "var(--white)", lineHeight: 1 }}>
                        {rec.opName}
                      </span>
                      <span style={{ fontSize: 9, color: "var(--muted)", fontWeight: 700 }}>
                        {rec.playerLabel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: "var(--muted)", fontSize: 12 }}>Sin recomendación activa</div>
            )}

            {/* Quick Actions & Variant Tabs Bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
              {engineOutput && setActiveVariantTab && (
                <div style={{ display: "inline-flex", gap: 4, background: "rgba(0,0,0,0.4)", padding: 3, borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <button
                    type="button"
                    onClick={() => setActiveVariantTab("primary")}
                    style={{
                      padding: "3px 9px",
                      borderRadius: 6,
                      border: "none",
                      fontSize: 10,
                      fontWeight: 800,
                      cursor: "pointer",
                      background: activeVariantTab === "primary" ? "#3b82f6" : "transparent",
                      color: activeVariantTab === "primary" ? "#fff" : "var(--muted-bright)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    🔥 Principal
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveVariantTab("safe")}
                    style={{
                      padding: "3px 9px",
                      borderRadius: 6,
                      border: "none",
                      fontSize: 10,
                      fontWeight: 800,
                      cursor: "pointer",
                      background: activeVariantTab === "safe" ? "#10b981" : "transparent",
                      color: activeVariantTab === "safe" ? "#fff" : "var(--muted-bright)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    🛡️ Segura
                  </button>
                  {hasBreathingVariant && (
                    <button
                      type="button"
                      onClick={() => setActiveVariantTab("breathing")}
                      style={{
                        padding: "3px 9px",
                        borderRadius: 6,
                        border: "none",
                        fontSize: 10,
                        fontWeight: 800,
                        cursor: "pointer",
                        background: activeVariantTab === "breathing" ? "#8b5cf6" : "transparent",
                        color: activeVariantTab === "breathing" ? "#fff" : "var(--muted-bright)",
                        transition: "all 0.15s ease",
                      }}
                    >
                      🔄 Rotación
                    </button>
                  )}
                  {engineOutput?.experimentalVariant && (
                    <button
                      type="button"
                      onClick={() => setActiveVariantTab("experimental")}
                      style={{
                        padding: "3px 9px",
                        borderRadius: 6,
                        border: "none",
                        fontSize: 10,
                        fontWeight: 800,
                        cursor: "pointer",
                        background: activeVariantTab === "experimental" ? "#f59e0b" : "transparent",
                        color: activeVariantTab === "experimental" ? "#fff" : "var(--muted-bright)",
                        transition: "all 0.15s ease",
                      }}
                    >
                      🧪 Experimental
                    </button>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={onRollOperator}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "4px 10px",
                  background: "rgba(59,130,246,0.15)",
                  border: "1px solid rgba(59,130,246,0.35)",
                  borderRadius: 7,
                  color: "#60a5fa",
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <Shuffle size={11} /> Re-sortear
              </button>
            </div>
          </div>

          {/* RIVALES */}
          <div className="score-side them">
            <span className="score-label">Rivales</span>
            <span className="score-num">{opponentScore}</span>
            <div className="score-pips" style={{ justifyContent: "flex-end" }}>
              {Array.from({ length: MAX_SCORE }).map((_, i) => (
                <div key={i} className={`pip ${i < opponentScore ? "filled" : ""}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Fast-Access Bans Manager */}
      <QuickBanManager
        currentSide={currentSide}
        ourBans={ourBans}
        enemyBans={enemyBans}
        onToggleBan={onToggleBan}
        onClearBans={onClearBans}
      />

      {/* Bomb Sites Grid */}
      {allMapSites.length > 0 && (
        <div className="sites-section">
          <div className="sites-header">
            <span className="sites-title">
              <Layers size={13} /> Zonas de Bomba
            </span>
            <button className="shuffle-site-btn" onClick={onRollAvailableSite}>
              <Shuffle size={12} /> Sortear
            </button>
          </div>
          <p className="sites-hint">
            {currentSide === "defense"
              ? "Elegí la zona a defender en esta ronda"
              : "Elegí la zona que tiene el enemigo"}
          </p>
          <div className="sites-grid">
            {allMapSites.map((site) => {
              const currentLocks =
                currentSide === "defense" ? lockedSites : enemyLockedSites;
              const isLocked = currentLocks.includes(site.name);
              const isSelected = selectedSiteName === site.name;

              let stateClass = "site-available";
              if (isLocked) stateClass = "site-locked";
              else if (isSelected) stateClass = "site-active";

              return (
                <button
                  key={site.name}
                  disabled={isLocked}
                  className={`site-card ${stateClass}`}
                  onClick={() => setSelectedSiteName(site.name)}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <span className="site-card-floor">{site.floor}</span>
                    {isLocked ? (
                      <span className="site-card-status site-status-locked">
                        <Lock size={10} />
                      </span>
                    ) : isSelected ? (
                      <span className="site-card-status site-status-chosen">
                        <Check size={10} />
                      </span>
                    ) : null}
                  </div>
                  <span className="site-card-name">{site.name}</span>
                  <div className="site-card-status">
                    {isLocked ? (
                      <span className="site-status-locked" style={{ fontSize: 10, fontFamily: "Rajdhani,sans-serif" }}>
                        Bloqueada
                      </span>
                    ) : isSelected ? (
                      <span className="site-status-chosen" style={{ fontSize: 10, fontFamily: "Rajdhani,sans-serif" }}>
                        Elegida
                      </span>
                    ) : (
                      <span className="site-status-free" style={{ fontSize: 10, fontFamily: "Rajdhani,sans-serif" }}>
                        Disponible
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tactical Route & Drone Controls */}
      {currentSide === "attack" && (
        <div className="tactical-site-controls">
          {siteProfile && siteProfile.attackRoutes.length > 0 && (
            <div>
              <div className="tac-ctrl-header" style={{ marginBottom: 8 }}>
                <span>
                  <Compass size={12} style={{ display: "inline", marginRight: 4 }} />
                  Ruta de Ataque Planeada
                </span>
              </div>
              <div className="tactical-routes-grid">
                {siteProfile.attackRoutes.map((route) => {
                  const isSelected = selectedRouteId === route.id;
                  return (
                    <button
                      key={route.id}
                      className={`tac-route-card ${isSelected ? "active" : ""}`}
                      onClick={() => setSelectedRouteId(route.id)}
                    >
                      <div className="tac-route-title">{route.name}</div>
                      <div className="tac-route-desc">{route.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {siteProfile && siteProfile.commonDefenses.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div className="tac-ctrl-header" style={{ marginBottom: 8 }}>
                <span>
                  <Flame size={12} style={{ display: "inline", marginRight: 4 }} />
                  Defensa Rival Observada en Dron
                </span>
              </div>
              <div className="observed-defenses-grid">
                {siteProfile.commonDefenses.map((def) => {
                  const isObserved = observedDefenseIds.includes(def.id);
                  return (
                    <button
                      key={def.id}
                      className={`obs-def-card ${isObserved ? "observed" : ""}`}
                      onClick={() => onToggleObservedDefense(def.id)}
                    >
                      <span>{def.name}</span>
                      {isObserved ? <XCircle size={12} /> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Map Tactical Play Banner */}
      <TacticalPlayBanner
        matchMap={matchMap}
        selectedSiteName={selectedSiteName}
        currentSide={currentSide}
      />

      {/* Operator Recommendations Section */}
      <OperatorRecommendationsList
        currentRoundNum={currentRoundNum}
        currentSide={currentSide}
        recommendations={recommendations}
        onRollOperator={onRollOperator}
        onSelectAlternative={onSelectAlternative}
        engineOutput={engineOutput}
        activeVariantTab={activeVariantTab}
        setActiveVariantTab={setActiveVariantTab}
        hasBreathingVariant={hasBreathingVariant}
        squadRecommendation={squadRecommendation}
        personalized={personalized}
        opRoll={opRoll}
        isMulti={isMulti}
        matchMap={matchMap}
        onRollSinglePlayer={onRollSinglePlayer}
      />

      {/* Outcome Buttons */}
      <div className="outcome-section">
        <div className="outcome-label">¿Ganamos la ronda {currentRoundNum}?</div>
        <div className="outcome-buttons">
          <button className="outcome-btn win-btn" onClick={() => onRecordRound("win")}>
            ¡Ganamos la Ronda!
          </button>
          <button className="outcome-btn loss-btn" onClick={() => onRecordRound("loss")}>
            Perdimos la Ronda
          </button>
        </div>

        {history.length > 0 && (
          <button className="undo-btn" onClick={onUndoLastRound}>
            Deshacer Última Ronda
          </button>
        )}
      </div>

      {/* Match History */}
      <MatchHistorySection history={history} onUndoLastRound={onUndoLastRound} />
    </div>
  );
}
