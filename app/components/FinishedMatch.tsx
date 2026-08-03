"use client";

import { ArrowLeft, RotateCcw, Trophy, XCircle } from "lucide-react";
import type { BombSite, Side } from "../../data/catalog";

type RoundLog = {
  roundNum: number;
  side: Side;
  operator: string;
  bombSite?: BombSite;
  result: "win" | "loss";
};

type FinishedMatchProps = {
  matchMap: string;
  myScore: number;
  opponentScore: number;
  history: RoundLog[];
  onResetMatch: () => void;
  onUndoLastRound: () => void;
};

export function FinishedMatch({
  matchMap,
  myScore,
  opponentScore,
  history,
  onResetMatch,
  onUndoLastRound,
}: FinishedMatchProps) {
  const isWinner = myScore > opponentScore;

  return (
    <div className="tab-panel">
      <div className="finished-screen">
        {/* Banner */}
        <div className={`finished-banner ${isWinner ? "banner-win" : "banner-loss"}`}>
          {isWinner ? (
            <Trophy size={56} className="banner-icon win-icon" />
          ) : (
            <XCircle size={56} className="banner-icon loss-icon" />
          )}

          <div className="banner-title">
            {isWinner
              ? `¡Victoria en ${matchMap}!`
              : `Derrota en ${matchMap}`}
          </div>

          <div className="banner-score">
            {myScore} — {opponentScore}
          </div>
        </div>

        {/* Round Summary */}
        <div className="history-section" style={{ borderRadius: 0, border: "none", borderTop: "1px solid var(--border)" }}>
          <div className="history-header">
            <span className="history-label">Resumen de Rondas</span>
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
                  <span className="row-site">{log.bombSite.name}</span>
                )}
                <span className="row-side-badge" style={{ marginLeft: "auto" }}>
                  {log.result === "win" ? "W" : "L"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="finished-actions">
          <button className="new-match-btn" onClick={onResetMatch}>
            <RotateCcw size={18} />
            Nuevo Partido
          </button>
          <button className="undo-match-btn" onClick={onUndoLastRound}>
            <ArrowLeft size={15} />
            Deshacer última ronda
          </button>
        </div>
      </div>
    </div>
  );
}
