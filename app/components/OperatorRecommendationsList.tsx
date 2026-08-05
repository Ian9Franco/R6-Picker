"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw,
  Flame,
  Shield,
  Layers,
  Compass,
  Star,
  Swords,
  Target,
  AlertTriangle,
} from "lucide-react";
import {
  Side,
  OperatorRecommendation,
  SquadRecommendation,
  AdaptiveEngineOutput,
  VariantTabKey,
} from "@/app/types";
import { OperatorIcon } from "./OperatorIcon";

export type OperatorRecommendationsListProps = {
  currentRoundNum: number;
  currentSide: Side;
  recommendations: OperatorRecommendation[];
  onRollOperator: () => void;
  onSelectAlternative?: (playerIndex: number, newOpName: string) => void;
  engineOutput?: AdaptiveEngineOutput | null;
  activeVariantTab?: VariantTabKey;
  setActiveVariantTab?: (tab: VariantTabKey) => void;
  hasBreathingVariant?: boolean;
  squadRecommendation?: SquadRecommendation | null;
  personalized?: boolean;
  opRoll: number;
  isMulti?: boolean;
  matchMap: string;
  onRollSinglePlayer: (index: number) => void;
};

export function OperatorRecommendationsList({
  currentRoundNum,
  currentSide,
  recommendations,
  onRollOperator,
  onSelectAlternative,
  engineOutput,
  activeVariantTab,
  setActiveVariantTab,
  hasBreathingVariant,
  squadRecommendation,
  personalized,
  opRoll,
  isMulti,
  matchMap,
  onRollSinglePlayer,
}: OperatorRecommendationsListProps) {
  return (
    <div className="operator-section" style={{ marginTop: 16 }}>
      <div className="operator-header">
        <span className="operator-round-label">
          R{currentRoundNum} · {currentSide === "attack" ? "Ataque" : "Defensa"}
          {" · "}
          {recommendations.length} {recommendations.length === 1 ? "Pick" : "Picks"}
        </span>
        <button className="reroll-btn" onClick={onRollOperator}>
          <RefreshCw size={12} /> Re-sortear variante
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
          {engineOutput?.experimentalVariant && (
            <button
              className={`variant-tab-btn ${activeVariantTab === "experimental" ? "active" : ""}`}
              onClick={() => setActiveVariantTab("experimental")}
              style={{
                borderColor: activeVariantTab === "experimental" ? "#f59e0b" : "rgba(245, 158, 11, 0.3)",
                color: activeVariantTab === "experimental" ? "#fbbf24" : "var(--muted-bright)",
                background: activeVariantTab === "experimental" ? "rgba(245, 158, 11, 0.15)" : "transparent",
              }}
            >
              🧪 Experimental
            </button>
          )}
        </div>
      )}

      {squadRecommendation?.tacticalComposition && (
        <div className="composition-layer-card">
          <div className="composition-layer-top">
            <span className="composition-layer-kicker">
              <Layers size={12} /> PLAN TÁCTICO AGNÓSTICO
            </span>
            <span className="composition-layer-score">
              {squadRecommendation.tacticalComposition.score}% coherencia
            </span>
          </div>
          <div className="composition-layer-doctrine">
            {squadRecommendation.tacticalComposition.doctrine}
          </div>
          <div className="composition-layer-ops">
            {squadRecommendation.tacticalComposition.operatorNames.map((operator) => (
              <span key={operator} className="composition-op-chip">
                <OperatorIcon name={operator} size={17} /> {operator}
              </span>
            ))}
          </div>
          <div className="composition-layer-foot">
            <span>{squadRecommendation.tacticalComposition.summary}</span>
            <strong>
              {personalized
                ? "CAPA 2 · asignado por afinidad de los pibes"
                : "MODO ESTÁNDAR · slots tácticos neutrales"}
            </strong>
          </div>
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
                <OperatorIcon name={rec.opName} size={36} />
              </div>

              {/* Info */}
              <div className="pick-row-info">
                <div className="pick-row-top" style={{ flexWrap: "wrap", gap: 6 }}>
                  {rec.pickOrderNumber && (
                    <span className="pick-order-badge">
                      {rec.pickOrderNumber}.º PICK
                    </span>
                  )}
                  <span className="pick-player-tag">{rec.playerLabel}</span>
                  {rec.trackerHighlight && (
                    <span className="hud-tracker-highlight">
                      <Flame size={10} /> {rec.trackerHighlight}
                    </span>
                  )}
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

                <div
                  className="pick-row-op-name"
                  style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", margin: "4px 0" }}
                >
                  <span style={{ fontSize: 18, fontWeight: 900, color: "var(--white)", letterSpacing: "0.02em" }}>
                    {rec.opName}
                  </span>

                  {/* Clickable Alternatives Bar */}
                  {rec.alternativeOps && rec.alternativeOps.length > 0 && (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 8px", background: "rgba(255,255,255,0.04)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)" }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: "var(--muted-bright)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        Variantes:
                      </span>
                      {rec.alternativeOps.map((altOp) => (
                        <button
                          key={altOp}
                          type="button"
                          onClick={() => onSelectAlternative && onSelectAlternative(index, altOp)}
                          title={`Elegir variante ${altOp} para ${rec.playerLabel}`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "3px 8px",
                            background: "rgba(255,255,255,0.07)",
                            border: "1px solid rgba(255,255,255,0.14)",
                            borderRadius: 6,
                            color: "var(--white)",
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(59,130,246,0.25)";
                            e.currentTarget.style.borderColor = "#3b82f6";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                            e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)";
                          }}
                        >
                          <OperatorIcon name={altOp} size={15} />
                          <span>{altOp}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {rec.backupOpName && !rec.alternativeOps?.includes(rec.backupOpName) && (
                    <span className="hud-backup-badge" title="Respaldo #2 si está tomado">
                      <OperatorIcon name={rec.backupOpName} size={15} /> #2: {rec.backupOpName}
                    </span>
                  )}
                </div>

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
                  <div className="pick-row-warning">{rec.avoidWarning}</div>
                )}

                {rec.tacticalTask && (
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#e2e8f0",
                      marginTop: "4px",
                      background: "rgba(255,255,255,0.04)",
                      padding: "5px 9px",
                      borderRadius: "6px",
                      borderLeft: "3px solid var(--accent, #3b82f6)",
                      lineHeight: 1.4,
                    }}
                  >
                    💡 <strong>Instrucción Táctica en {matchMap}:</strong> {rec.tacticalTask}
                  </div>
                )}

                {/* Concise 1-2 line reason for HUD speed */}
                {rec.explanation?.positive && rec.explanation.positive.length > 0 && (
                  <div className="pick-explanation-box positive">
                    {rec.explanation.positive.slice(0, 2).map((reason, rIdx) => (
                      <div key={rIdx} className="explanation-line pos">
                        ✨ {reason}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Side badge + reroll */}
              <div className="pick-row-right">
                <div className="pick-side-badge">
                  {currentSide === "attack" ? (
                    <>
                      <Swords size={10} /> ATK
                    </>
                  ) : (
                    <>
                      <Shield size={10} /> DEF
                    </>
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

      {/* Collapsible Tactical Accordion */}
      {squadRecommendation && (
        <details className="hud-details-accordion">
          <summary className="hud-details-summary">
            <span>
              <Target size={12} style={{ display: "inline", marginRight: 6 }} /> Análisis Táctico
              & Responsabilidades de Squad
            </span>
            <span style={{ fontSize: 11, opacity: 0.7 }}>▼ Ver Plan</span>
          </summary>
          <div style={{ padding: 14 }}>
            <div className="tactical-blocks-grid">
              <div className="tac-block">
                <span className="tac-block-title">
                  <Target size={11} /> ¿Por qué este pick?
                </span>
                <p className="tac-block-text">
                  {squadRecommendation.picks
                    .map((p) => `${p.playerLabel}: ${p.opName} (${p.role})`)
                    .join(" · ")}
                </p>
              </div>

              <div className="tac-block">
                <span className="tac-block-title">
                  <Flame size={11} /> ¿Cómo coordinarlo?
                </span>
                <p className="tac-block-text">
                  {squadRecommendation.trioPlan ||
                    squadRecommendation.duoPlan ||
                    "Avanzar con la brecha, tomar espacio y asegurar el plantado."}
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

            {squadRecommendation.responsibilities && (
              <div className="responsibilities-bar" style={{ marginTop: 12 }}>
                <span className="resp-bar-title">Responsabilidades:</span>
                <div className="resp-chips">
                  {squadRecommendation.responsibilities.shotCaller && (
                    <span className="resp-chip">
                      🎯 Callouts: {squadRecommendation.responsibilities.shotCaller}
                    </span>
                  )}
                  {squadRecommendation.responsibilities.defuserCarrier && (
                    <span className="resp-chip">
                      💣 Defuser: {squadRecommendation.responsibilities.defuserCarrier}
                    </span>
                  )}
                  {squadRecommendation.responsibilities.primaryDrone && (
                    <span className="resp-chip">
                      📡 Dron: {squadRecommendation.responsibilities.primaryDrone}
                    </span>
                  )}
                  {squadRecommendation.responsibilities.firstEntry && (
                    <span className="resp-chip">
                      ⚡ Entry 1: {squadRecommendation.responsibilities.firstEntry}
                    </span>
                  )}
                  {squadRecommendation.responsibilities.secondEntry && (
                    <span className="resp-chip">
                      🛡️ Entry 2: {squadRecommendation.responsibilities.secondEntry}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
}
