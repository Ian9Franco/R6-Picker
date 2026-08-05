"use client";

import React from "react";
import { RotateCcw } from "lucide-react";
import { RoundLog } from "@/app/types";

export type MatchHistorySectionProps = {
  history: RoundLog[];
  onUndoLastRound: () => void;
};

export function MatchHistorySection({
  history,
  onUndoLastRound,
}: MatchHistorySectionProps) {
  if (!history || history.length === 0) return null;

  return (
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
            className={`history-row ${
              log.result === "win" ? "row-win" : "row-loss"
            }`}
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
  );
}
