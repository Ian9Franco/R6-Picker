"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  Compass,
  Flame,
  Layers,
  Lock,
  MapPin,
  RefreshCw,
  RotateCcw,
  Shield,
  Shuffle,
  Star,
  Swords,
  Target,
  UserCheck,
  XCircle,
} from "lucide-react";
import type { BombSite, Side } from "../../data/catalog";
import type {
  PlayerPick,
  RecommendationEngineOutput,
  SquadRecommendation,
} from "../../data/pibes";

type RoundLog = {
  roundNum: number;
  side: Side;
  operator: string;
  bombSite?: BombSite;
  result: "win" | "loss";
};

type ActiveMatchProps = {
  matchMap: string;
  myScore: number;
  opponentScore: number;
  currentRoundNum: number;
  isOvertime: boolean;
  currentSide: Side;
  recommendations: PlayerPick[];
  squadRecommendation?: SquadRecommendation;
  engineOutput?: RecommendationEngineOutput | null;
  activeVariantTab?: "primary" | "safe" | "breathing";
  setActiveVariantTab?: (tab: "primary" | "safe" | "breathing") => void;
  opRoll: number;
  allMapSites: BombSite[];
  lockedSites: string[];
  enemyLockedSites: string[];
  selectedSiteName: string;
  setSelectedSiteName: (name: string) => void;
  history: RoundLog[];
  onRecordRound: (result: "win" | "loss") => void;
  onUndoLastRound: () => void;
  onRollOperator: () => void;
  onRollSinglePlayer: (index: number) => void;
  onRollAvailableSite: () => void;
};

const MAX_SCORE = 5;

export function ActiveMatch({
  matchMap,
  myScore,
  opponentScore,
  currentRoundNum,
  isOvertime,
  currentSide,
  recommendations,
  squadRecommendation,
  engineOutput,
  activeVariantTab = "primary",
  setActiveVariantTab,
  opRoll,
  allMapSites,
  lockedSites,
  enemyLockedSites,
  selectedSiteName,
  setSelectedSiteName,
  history,
  onRecordRound,
  onUndoLastRound,
  onRollOperator,
  onRollSinglePlayer,
  onRollAvailableSite,
}: ActiveMatchProps) {
  const isMulti = recommendations.length > 1;
  const hasBreathingVariant = Boolean(engineOutput?.breathingVariant);

  return (
    <div className="tab-panel">
      {/* Scoreboard HUD */}
      <div className="scoreboard-hud">
        <div className="scoreboard-top">
          <div className="map-tag">
            <MapPin size={12} />
            {matchMap}
          </div>
          <div className="round-tag">
            {isOvertime ? (
              <span className="ot-tag">
                <Flame size={13} /> PRÓRROGA · R{currentRoundNum}
              </span>
            ) : (
              <span style={{ color: "var(--muted-bright)" }}>
                Ronda {currentRoundNum} / 6
              </span>
            )}
          </div>
        </div>

        <div className="scoreboard-scores">
          <div className="score-side us">
            <span className="score-label">Nosotros</span>
            <span className="score-num">{myScore}</span>
            <div className="score-pips">
              {Array.from({ length: MAX_SCORE }).map((_, i) => (
                <div key={i} className={`pip ${i < myScore ? "filled" : ""}`} />
              ))}
            </div>
          </div>

          <div className="score-center">—</div>

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

      {/* Bomb Sites */}
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
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
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
                      <span className="site-status-locked" style={{ fontSize: 10, fontFamily: "Rajdhani,sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                        Bloqueada
                      </span>
                    ) : isSelected ? (
                      <span className="site-status-chosen" style={{ fontSize: 10, fontFamily: "Rajdhani,sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                        Elegida
                      </span>
                    ) : (
                      <span className="site-status-free" style={{ fontSize: 10, fontFamily: "Rajdhani,sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" }}>
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

      {/* Operator Recommendations Section */}
      <div className="operator-section">
        <div className="operator-header">
          <span className="operator-round-label">
            R{currentRoundNum} · {currentSide === "attack" ? "Ataque" : "Defensa"}
            {" · "}
            {recommendations.length} {recommendations.length === 1 ? "Pick" : "Picks"}
          </span>
          <button className="reroll-btn" onClick={onRollOperator}>
            <RefreshCw size={12} /> Re-sortear
          </button>
        </div>

        {/* Dynamic Engine Variants Tabs */}
        {engineOutput && setActiveVariantTab && (
          <div className="variant-tabs-bar">
            <button
              className={`variant-tab-btn ${activeVariantTab === "primary" ? "active" : ""}`}
              onClick={() => setActiveVariantTab("primary")}
            >
              <Flame size={12} /> Principal ({engineOutput.primary.confidence.percentage}%)
            </button>
            <button
              className={`variant-tab-btn ${activeVariantTab === "safe" ? "active" : ""}`}
              onClick={() => setActiveVariantTab("safe")}
            >
              <Shield size={12} /> Variante Segura
            </button>
            {hasBreathingVariant && (
              <button
                className={`variant-tab-btn ${activeVariantTab === "breathing" ? "active" : ""}`}
                onClick={() => setActiveVariantTab("breathing")}
              >
                <RefreshCw size={12} /> Rotación / Tryout
              </button>
            )}
          </div>
        )}

        {/* Order Reason Header */}
        {squadRecommendation?.orderReason && (
          <div className="order-reason-banner">
            <Compass size={13} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{squadRecommendation.orderReason}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={`op-group-${opRoll}-${activeVariantTab}`}
            className={isMulti ? "picks-list" : "single-pick-box"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {recommendations.map((rec, index) => (
              <div
                key={`${rec.playerLabel}-${rec.opName}-${index}`}
                className={`pick-row ${currentSide === "attack" ? "pick-row-atk" : "pick-row-def"}`}
              >
                {/* Left stripe */}
                <div className="pick-row-stripe" />

                {/* Avatar */}
                <div className="pick-row-avatar">
                  {rec.opName.slice(0, 2).toUpperCase()}
                </div>

                {/* Info */}
                <div className="pick-row-info">
                  <div className="pick-row-top">
                    {rec.pickOrderNumber && (
                      <span className="pick-order-badge">
                        {rec.pickOrderNumber}.º PICK
                      </span>
                    )}
                    <span className="pick-player-tag">{rec.playerLabel}</span>
                    {rec.isMain && (
                      <span className="main-star-badge">
                        <Star size={9} /> MAIN
                      </span>
                    )}
                    {rec.isTryout && (
                      <span className="tryout-badge">
                        <Flame size={9} /> PRUEBA
                      </span>
                    )}
                    {rec.isBreathing && (
                      <span className="breathing-badge">
                        <RefreshCw size={9} /> ROTACIÓN
                      </span>
                    )}
                  </div>
                  <div className="pick-row-op-name">{rec.opName}</div>
                  {rec.coveredRole ? (
                    <div className="pick-row-playstyle covered-role-tag">
                      ✓ Cubre: {rec.coveredRole}
                    </div>
                  ) : rec.developmentGoal ? (
                    <div className="pick-row-playstyle tryout-goal-tag">
                      🎯 Objetivo: {rec.developmentGoal}
                    </div>
                  ) : rec.role ? (
                    <div className="pick-row-playstyle">{rec.role}</div>
                  ) : null}

                  {rec.avoidWarning && (
                    <div className="pick-row-warning">
                      {rec.avoidWarning}
                    </div>
                  )}
                </div>

                {/* Side badge + reroll */}
                <div className="pick-row-right">
                  <div className="pick-side-badge">
                    {currentSide === "attack" ? (
                      <><Swords size={10} /> ATK</>
                    ) : (
                      <><Shield size={10} /> DEF</>
                    )}
                  </div>
                  {isMulti && (
                    <button
                      className="single-reroll-btn"
                      title={`Re-sortear para ${rec.playerLabel}`}
                      onClick={() => onRollSinglePlayer(index)}
                    >
                      <RefreshCw size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* 3 Compact Tactical Blocks: Por qué este pick, Cómo coordinarlo, Qué evitar */}
        {squadRecommendation && (
          <div className="tactical-blocks-grid">
            <div className="tac-block">
              <span className="tac-block-title">
                <Target size={11} /> ¿Por qué este pick?
              </span>
              <p className="tac-block-text">
                {squadRecommendation.picks.map((p) => `${p.playerLabel}: ${p.opName} (${p.role})`).join(" · ")}
              </p>
            </div>

            <div className="tac-block">
              <span className="tac-block-title">
                <Flame size={11} /> ¿Cómo coordinarlo?
              </span>
              <p className="tac-block-text">
                {squadRecommendation.trioPlan || squadRecommendation.duoPlan || "Avanzar con la brecha, tomar espacio y asegurar el plantado."}
              </p>
            </div>

            {squadRecommendation.warnings.length > 0 && (
              <div className="tac-block warning-block">
                <span className="tac-block-title warning-title">
                  <AlertTriangle size={11} /> ¿Qué evitar?
                </span>
                <p className="tac-block-text warning-text">
                  {squadRecommendation.warnings.map((w) => w.message).join(" ")}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Responsabilidades Asignadas al Squad */}
        {squadRecommendation?.responsibilities && (
          <div className="responsibilities-bar">
            <span className="resp-bar-title">Responsabilidades:</span>
            <div className="resp-chips">
              {squadRecommendation.responsibilities.shotCaller && (
                <span className="resp-chip">🎯 Callouts: {squadRecommendation.responsibilities.shotCaller}</span>
              )}
              {squadRecommendation.responsibilities.defuserCarrier && (
                <span className="resp-chip">💣 Defuser: {squadRecommendation.responsibilities.defuserCarrier}</span>
              )}
              {squadRecommendation.responsibilities.primaryDrone && (
                <span className="resp-chip">📡 Dron: {squadRecommendation.responsibilities.primaryDrone}</span>
              )}
              {squadRecommendation.responsibilities.firstEntry && (
                <span className="resp-chip">⚡ Entry 1: {squadRecommendation.responsibilities.firstEntry}</span>
              )}
              {squadRecommendation.responsibilities.secondEntry && (
                <span className="resp-chip">🛡️ Entry 2: {squadRecommendation.responsibilities.secondEntry}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Outcome Buttons */}
      <div className="outcome-section">
        <div className="outcome-label">¿Ganamos la ronda {currentRoundNum}?</div>
        <div className="outcome-buttons">
          <button className="outcome-btn win-btn" onClick={() => onRecordRound("win")}>
            <Check size={18} /> Ganamos
          </button>
          <button className="outcome-btn loss-btn" onClick={() => onRecordRound("loss")}>
            <XCircle size={18} /> Perdimos
          </button>
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="history-section">
          <div className="history-header">
            <span className="history-label">Historial</span>
            <button className="undo-btn" onClick={onUndoLastRound}>
              <RotateCcw size={12} /> Deshacer última
            </button>
          </div>
          <div className="history-rows">
            {history.map((log) => (
              <div
                key={log.roundNum}
                className={`history-row ${log.result === "win" ? "row-win" : "row-loss"}`}
              >
                <span className="row-round-num">R{log.roundNum}</span>
                <div className="row-result-dot" />
                <span className="row-op">{log.operator}</span>
                <span className="row-side-badge">
                  {log.side === "attack" ? "ATK" : "DEF"}
                </span>
                {log.bombSite && (
                  <span className="row-site" title={log.bombSite.name}>
                    {log.bombSite.name}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
