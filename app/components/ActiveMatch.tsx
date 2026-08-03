"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
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
  XCircle,
} from "lucide-react";
import type { BombSite, Side } from "../../data/catalog";
import type { Recommendation } from "../../data/pibes";

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
  recommendations: Recommendation[];
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
            R{currentRoundNum} · {currentSide === "attack" ? "Ataque" : "Defensa"} ({recommendations.length} {recommendations.length === 1 ? "Pick" : "Picks"})
          </span>
          <button className="reroll-btn" onClick={onRollOperator}>
            <RefreshCw size={12} /> Re-sortear Squad
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`op-group-${opRoll}`}
            className={`operator-recommendations-wrapper ${
              recommendations.length > 1 ? "multi-picks-grid" : "single-pick-box"
            }`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {recommendations.map((rec, index) => (
              <div
                key={`${rec.playerLabel}-${rec.opName}-${index}`}
                className={`operator-display ${
                  currentSide === "attack" ? "atk-side" : "def-side"
                }`}
              >
                <div className="operator-avatar">
                  <span className="operator-monogram">
                    {rec.opName.slice(0, 2).toUpperCase()}
                  </span>
                </div>

                <div className="operator-info">
                  <div className="player-tag-row">
                    <span className="player-tag-name">{rec.playerLabel}</span>
                    {rec.isMain && (
                      <span className="main-star-badge" title="Es uno de sus mains configurados">
                        <Star size={10} /> MAIN
                      </span>
                    )}
                  </div>

                  <h2 className="operator-name">{rec.opName}</h2>

                  {rec.playstyle && (
                    <p className="operator-playstyle">{rec.playstyle}</p>
                  )}

                  <div className="operator-side-badge">
                    {currentSide === "attack" ? (
                      <><Swords size={10} style={{ display: "inline", marginRight: 4 }} />Atacante</>
                    ) : (
                      <><Shield size={10} style={{ display: "inline", marginRight: 4 }} />Defensor</>
                    )}
                  </div>
                </div>

                {recommendations.length > 1 && (
                  <button
                    className="single-reroll-btn"
                    title={`Re-sortear solo para ${rec.playerLabel}`}
                    onClick={() => onRollSinglePlayer(index)}
                  >
                    <RefreshCw size={12} />
                  </button>
                )}
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
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
