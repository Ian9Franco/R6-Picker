"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Compass,
  Crosshair,
  Flame,
  Layers,
  Shield,
  ShieldAlert,
  Star,
  Swords,
  Target,
  User,
  Users,
  Zap,
} from "lucide-react";
import pibesDataRaw from "../../data/pibes.json";
import playerRulesRaw from "../../data/player-rules.json";
import synergiesRaw from "../../data/synergies.json";

const ROLE_LABELS: Record<string, string> = {
  "hard-breach": "Brecha dura",
  "soft-breach": "Brecha blanda",
  "entry-frag": "Entry Fragger",
  "anti-gadget": "Anti-gadget",
  "intel": "Información",
  "zone-control": "Control de zona",
  "support": "Soporte",
  "objective-anchor": "Ancla de objetivo",
  "anti-gadget-def": "Anti-gadget DEF",
  "roamer": "Roamer",
  "intel-def": "Información DEF",
  "trap-setter": "Trampas",
  "access-denial": "Bloqueo accesos",
  "support-def": "Soporte DEF",
  "zone-deny": "Negación de zona",
};

export function PibesView() {
  const pibes = pibesDataRaw.pibes;
  const [selectedPibeId, setSelectedPibeId] = useState<string>("el_notorious");
  const [activeTab, setActiveTab] = useState<"profile" | "operators" | "warnings" | "synergies">("profile");

  const currentPibe = pibes.find((p) => p.id === selectedPibeId) ?? pibes[0];
  const pibeRules = (playerRulesRaw as any).rules[selectedPibeId]?.avoid ?? [];

  return (
    <div className="pibes-shell">
      {/* Top Player Selector Tabs */}
      <div className="pibes-selector-bar">
        {pibes.map((pibe) => (
          <button
            key={pibe.id}
            className={`pibe-select-btn ${selectedPibeId === pibe.id ? "active" : ""}`}
            onClick={() => setSelectedPibeId(pibe.id)}
          >
            <User size={14} />
            <span>{pibe.name}</span>
          </button>
        ))}
        <button
          className={`pibe-select-btn squad-tab-btn ${selectedPibeId === "squad" ? "active" : ""}`}
          onClick={() => setSelectedPibeId("squad")}
        >
          <Users size={14} />
          <span>Sinergias de Squad</span>
        </button>
      </div>

      {selectedPibeId === "squad" ? (
        /* VISTA DE SQUAD & SINERGIAS */
        <div className="squad-view-panel">
          {/* Header Banner */}
          <div className="pibe-header-card">
            <div className="pibe-avatar-large">
              <Users size={28} />
            </div>
            <div className="pibe-header-info">
              <div className="pibe-header-top">
                <h2 className="pibe-name-title">Estrategia Táctica de Squad</h2>
                <span className="pibe-role-badge">Trío Competitivo</span>
              </div>
              <p className="pibe-summary-text">
                Secuencia de orden de picks, composiciones fijas de sinergia y reglas de rotación (respiración) para Los Pibes.
              </p>
            </div>
          </div>

          {/* Pick Order Cards */}
          <div className="pibe-section-title">
            <Compass size={16} /> Orden de Selección de Squad (plan.md)
          </div>

          <div className="pick-order-grid">
            <div className="pick-order-card atk-card">
              <div className="pick-order-card-header">
                <Swords size={15} /> Orden de Picks en Ataque
              </div>
              <ol className="pick-order-list">
                <li>
                  <strong>1.º ChangoNocturno</strong>: Hard support / Fija la estructura principal de la ronda (Thermite/Hibana).
                </li>
                <li>
                  <strong>2.º El_Notorious</strong>: Flex / Presión / Limpieza de utilidad (Zofia/Ash/Zero).
                </li>
                <li>
                  <strong>3.º AzusaCooper09</strong>: Soporte de ejecución / Escudo / Plantado seguro (Montagne/Osa/Lion).
                </li>
              </ol>
            </div>

            <div className="pick-order-card def-card">
              <div className="pick-order-card-header">
                <Shield size={15} /> Orden de Picks en Defensa
              </div>
              <ol className="pick-order-list">
                <li>
                  <strong>1.º ChangoNocturno</strong>: Negación de brecha / Estructura base de sitio (Tubarão/Mute/Thorn).
                </li>
                <li>
                  <strong>2.º AzusaCooper09</strong>: Ancla de sitio / Control del objetivo (Smoke/Echo/Tachanka).
                </li>
                <li>
                  <strong>3.º El_Notorious</strong>: Intel / Flex / Roamer (Valkyrie/Vigil/Fenrir).
                </li>
              </ol>
            </div>
          </div>

          {/* Synergies List */}
          <div className="pibe-section-title" style={{ marginTop: 24 }}>
            <Flame size={16} /> Jugadas Explícitas de Sinergias
          </div>

          <div className="synergies-grid">
            {synergiesRaw.explicitSynergies.map((syn) => (
              <div key={syn.id} className="synergy-card">
                <div className="synergy-card-top">
                  <span className="synergy-name">{syn.id.replace(/-/g, " ").toUpperCase()}</span>
                  <span className="synergy-side-badge">
                    {syn.side === "attack" ? "ATAQUE" : "DEFENSA"}
                  </span>
                </div>
                <div className="synergy-ops-pills">
                  {syn.operators.map((op) => (
                    <span key={op} className="synergy-op-pill">{op}</span>
                  ))}
                </div>
                <p className="synergy-plan-desc">
                  <strong>Setup:</strong> {syn.plan.setup}
                </p>
                <p className="synergy-plan-desc">
                  <strong>Ejecución:</strong> {syn.plan.execute}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* VISTA INDIVIDUAL DE JUGADOR */
        <div className="pibe-profile-panel">
          {/* Header Banner */}
          <div className="pibe-header-card">
            <div className="pibe-avatar-large">
              {currentPibe.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="pibe-header-info">
              <div className="pibe-header-top">
                <h2 className="pibe-name-title">{currentPibe.name}</h2>
                <span className="pibe-role-badge">
                  {currentPibe.profile?.primaryRole?.toUpperCase() ?? "FLEX"}
                </span>
                <span className="pibe-tempo-badge">
                  {currentPibe.profile?.preferredTempo ?? "Adaptable"}
                </span>
              </div>
              <p className="pibe-summary-text">{currentPibe.profile?.summary}</p>
              <div className="pibe-tags-row">
                {currentPibe.profile?.playstyleTags?.map((tag) => (
                  <span key={tag} className="pibe-tag-chip">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Sub Navigation Bar */}
          <div className="pibe-sub-nav">
            <button
              className={`pibe-sub-btn ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              <User size={13} /> Perfil & Afinidad
            </button>
            <button
              className={`pibe-sub-btn ${activeTab === "operators" ? "active" : ""}`}
              onClick={() => setActiveTab("operators")}
            >
              <Crosshair size={13} /> Pool de Agentes
            </button>
            <button
              className={`pibe-sub-btn ${activeTab === "warnings" ? "active" : ""}`}
              onClick={() => setActiveTab("warnings")}
            >
              <AlertTriangle size={13} /> Errores a Evitar ({pibeRules.length})
            </button>
            <button
              className={`pibe-sub-btn ${activeTab === "synergies" ? "active" : ""}`}
              onClick={() => setActiveTab("synergies")}
            >
              <Users size={13} /> Uso en Escuadrón
            </button>
          </div>

          {/* TAB 1: PERFIL & AFINIDAD DE ROLES */}
          {activeTab === "profile" && (
            <div className="pibe-tab-content">
              {/* Role Affinity Progress Bars */}
              <div className="pibe-section-title">
                <Zap size={15} /> Afinidad de Roles Tácticos
              </div>
              <div className="role-affinity-grid">
                {Object.entries(currentPibe.roleAffinity ?? {}).map(([roleKey, value]) => {
                  const percentage = Math.round((value as number) * 100);
                  return (
                    <div key={roleKey} className="affinity-card">
                      <div className="affinity-top">
                        <span className="affinity-role-name">
                          {ROLE_LABELS[roleKey] ?? roleKey}
                        </span>
                        <span className="affinity-val">{percentage}%</span>
                      </div>
                      <div className="affinity-bar-track">
                        <div
                          className="affinity-bar-fill"
                          style={{
                            width: `${percentage}%`,
                            background: percentage >= 80 ? "var(--atk)" : percentage >= 65 ? "#3b82f6" : "#a855f7",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Strengths & Weaknesses */}
              <div className="strengths-weaknesses-grid">
                <div className="sw-card strengths-card">
                  <div className="sw-title">
                    <CheckCircle2 size={15} /> Mayores Fortalezas
                  </div>
                  <ul className="sw-list">
                    {currentPibe.strengths.map((str, i) => (
                      <li key={i}>{str}</li>
                    ))}
                  </ul>
                </div>

                <div className="sw-card weaknesses-card">
                  <div className="sw-title">
                    <ShieldAlert size={15} /> Áreas a Cuidar / Debilidades
                  </div>
                  <ul className="sw-list">
                    {currentPibe.weaknesses.map((weak, i) => (
                      <li key={i}>{weak}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: POOL DE AGENTES CLASIFICADOS */}
          {activeTab === "operators" && (
            <div className="pibe-tab-content">
              {/* Identity / Mains */}
              <div className="pibe-section-title">
                <Star size={15} /> Agentes Insignia (Identidad)
              </div>
              <div className="op-category-group">
                <div className="op-side-subgroup">
                  <span className="op-side-title"><Swords size={12} /> Ataque:</span>
                  <div className="op-pills-row">
                    {currentPibe.identityOperators?.attack.map((op) => (
                      <span key={op} className="op-pill main-pill">{op}</span>
                    ))}
                  </div>
                </div>
                <div className="op-side-subgroup">
                  <span className="op-side-title"><Shield size={12} /> Defensa:</span>
                  <div className="op-pills-row">
                    {currentPibe.identityOperators?.defense.map((op) => (
                      <span key={op} className="op-pill main-pill">{op}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tryout Operators (En Prueba) */}
              <div className="pibe-section-title" style={{ marginTop: 24 }}>
                <Flame size={15} /> Operadores de Tryout (En Prueba)
              </div>
              <div className="tryout-cards-grid">
                {currentPibe.tryoutOperators?.attack.map((t) => (
                  <div key={t.operator} className="tryout-op-card">
                    <div className="tryout-op-top">
                      <span className="tryout-op-name">{t.operator}</span>
                      <span className="tryout-side-tag atk">ATK</span>
                    </div>
                    <p className="tryout-goal-text">🎯 {t.developmentGoal}</p>
                  </div>
                ))}
                {currentPibe.tryoutOperators?.defense.map((t) => (
                  <div key={t.operator} className="tryout-op-card">
                    <div className="tryout-op-top">
                      <span className="tryout-op-name">{t.operator}</span>
                      <span className="tryout-side-tag def">DEF</span>
                    </div>
                    <p className="tryout-goal-text">🎯 {t.developmentGoal}</p>
                  </div>
                ))}
              </div>

              {/* Avoid Operators */}
              <div className="pibe-section-title" style={{ marginTop: 24 }}>
                <AlertTriangle size={15} /> Agentes a Evitar / Desaconsejados
              </div>
              <div className="op-pills-row">
                {currentPibe.avoidOperators?.attack.map((op) => (
                  <span key={op} className="op-pill avoid-pill">{op} (ATK)</span>
                ))}
                {currentPibe.avoidOperators?.defense.map((op) => (
                  <span key={op} className="op-pill avoid-pill">{op} (DEF)</span>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ERRORES A EVITAR (queno.md / player-rules.json) */}
          {activeTab === "warnings" && (
            <div className="pibe-tab-content">
              <div className="pibe-section-title">
                <AlertTriangle size={15} /> Reglas Anti-Errores (queno.md)
              </div>
              {pibeRules.length === 0 ? (
                <p className="no-data-msg">Sin reglas específicas configuradas.</p>
              ) : (
                <div className="rules-list">
                  {pibeRules.map((rule: any) => (
                    <div key={rule.id} className="rule-card">
                      <div className="rule-card-header">
                        <span className="rule-id">{rule.id}</span>
                        <span className={`rule-sev-badge ${rule.severity}`}>
                          {rule.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="rule-msg">{rule.message}</p>
                      <div className="rule-ops">
                        Agentes aplicables: {rule.operators.join(", ")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: USO EN ESCUADRÓN */}
          {activeTab === "synergies" && (
            <div className="pibe-tab-content">
              <div className="pibe-section-title">
                <Users size={15} /> Uso Recomendado en Escuadrón
              </div>
              <div className="team-usage-card">
                <p className="tu-item">
                  <strong>Mejor Uso:</strong> {currentPibe.teamUsage?.bestUse}
                </p>
                <p className="tu-item warning-text">
                  <strong>Evitar:</strong> {currentPibe.teamUsage?.avoid}
                </p>
                <div className="tu-item">
                  <strong>Dúos Ideales:</strong>
                  <ul className="tu-sublist">
                    {currentPibe.teamUsage?.idealDuoPartners?.map((duo, i) => (
                      <li key={i}>{duo}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
