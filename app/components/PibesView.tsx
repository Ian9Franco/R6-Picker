"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Compass,
  Crosshair,
  Flame,
  HelpCircle,
  Info,
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
  "anti-gadget": "Anti-gadget",
  "intel": "Información",
  "entry-frag": "Entry Fragger",
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

const AVOID_OP_MOTIVES: Record<string, { title: string; reason: string }> = {
  "Deimos": {
    title: "Deimos — Evitar por aislamiento",
    reason: "Exige cazar aisladamente sin aportar utilidad estructural ni cobertura para el avance del grupo.",
  },
  "Caveira": {
    title: "Caveira — Evitar por alto riesgo",
    reason: "Roaming de extremo riesgo sin utilidad pasiva para el sitio en caso de caer temprano.",
  },
  "Ash": {
    title: "Ash — Ritmo incompatible",
    reason: "Forzar a un jugador metódico a 1st entry agresivo aumenta drásticamente la tasa de bajas tempranas.",
  },
  "Amaru": {
    title: "Amaru — Evitar por impredecibilidad",
    reason: "Entrada directa individual desincronizada con el planteo de brecha y dron de escuadrón.",
  },
  "Nøkk": {
    title: "Nøkk — Falta de impacto",
    reason: "Carece de utilidad pesada para limpiar dispositivos o abrir sitio para el grupo.",
  },
  "Oryx": {
    title: "Oryx — Ausencia de utilidad de sitio",
    reason: "Movilidad individual sin dispositivos pasivos de ayuda al equipo si caen las defensas.",
  },
  "Vigil": {
    title: "Vigil — Roam pasivo",
    reason: "Ocultación individual que no otorga información colectiva al resto del squad.",
  },
  "Ace": {
    title: "Ace — Evitar como pick habitual",
    reason: "Duplica la función estructural que otros jugadores ya cubren y reduce su impacto posterior a la apertura.",
  },
};

const TRYOUT_CONTEXTS: Record<string, { develops: string; whenToUse: string; whatNotToDo: string }> = {
  "Zofia": {
    develops: "Segundo entry utilitario con capacidad de respuesta y limpieza.",
    whenToUse: "Cuando ya existe brecha dura asegurada en el squad.",
    whatNotToDo: "Gastar proyectiles de impacto antes de identificar utilidad pesada clave.",
  },
  "Zero": {
    develops: "Flex informativo de ataque con cámaras persistentes.",
    whenToUse: "Mapas grandes con rotaciones largas de defensas (ej. Bank, Clubhouse).",
    whatNotToDo: "Quedarse dronando demasiado tiempo sin avanzar con la línea.",
  },
  "Flores": {
    develops: "Limpieza paciente de dispositivos y desplazamiento de anclas.",
    whenToUse: "Zonas defensivas saturadas de trampas (ej. Oregon Lavandería).",
    whatNotToDo: "Lanzar drones Ratero sin cobertura cercana de un compañero.",
  },
  "Azami": {
    develops: "Construcción dinámica de coberturas y bloqueo de ángulos.",
    whenToUse: "Sitios con líneas de visión largas de ataque difíciles de tapar.",
    whatNotToDo: "Colocar barreras Kiba que obstaculicen el retake de los compañeros.",
  },
  "Wamai": {
    develops: "Protección de utilidad proyectil combinada con juego flexible.",
    whenToUse: "Rondas defensivas con alta amenaza de granadas o proyectiles.",
    whatNotToDo: "Morir temprano acumulando discos MAG-NET en el inventario.",
  },
  "Aruni": {
    develops: "Control de accesos y consumo de recursos del atacante.",
    whenToUse: "Puertas y escotillas principales de entrada enemiga.",
    whatNotToDo: "Desperdiciar el golpe de cuerpo a cuerpo sin remodelar el sitio.",
  },
  "Osa": {
    develops: "Soporte de toma de espacio y cobertura frontal de plantado.",
    whenToUse: "Ataques a sitios con ventanas o pasillos largos (ej. Consulado).",
    whatNotToDo: "Desplegar el escudo Talon en lugares que bloqueen el paso al propio equipo.",
  },
  "Brava": {
    develops: "Manipulación de dispositivos defensivos para volverlos en contra.",
    whenToUse: "Defensas cargadas de Maestro, Echo, Kapkan o Aruni.",
    whatNotToDo: "Perder los drones Kludge escaneando gadgets secundarios sin impacto.",
  },
  "Nomad": {
    develops: "Control territorial automático de flancos y re-tomas.",
    whenToUse: "Mapas con flanqueos constantes de roamers (ej. Kafe, Coastline).",
    whatNotToDo: "Disparar Airjabs en posiciones expuestas a destrucción directa.",
  },
  "Castle": {
    develops: "Planificación de arquitectura de sitio y cierre de rutas.",
    whenToUse: "Mapas de sitio reducido donde bloquear accesos canalice el ataque.",
    whatNotToDo: "Encerrar a los defensores dejándolos sin rotación interna.",
  },
  "Lesion": {
    develops: "Información pasiva progresiva y retraso del ejecutor.",
    whenToUse: "Sitios donde el ataque suele presionar en los últimos 30 segundos.",
    whatNotToDo: "Morir en los primeros 45 segundos guardando minas Gu.",
  },
  "Rauora": {
    develops: "Control flexible de coberturas y apoyo en ejecuciones.",
    whenToUse: "Tácticas de empuje directo con defuser.",
    whatNotToDo: "Avanzar aislado sin apoyo del segundo entry.",
  },
  "Gridlock": {
    develops: "Control territorial masivo post-plantado.",
    whenToUse: "Sitios con múltiples accesos de retake defensivo.",
    whatNotToDo: "Lanzar Trax Stingers antes de asegurar la zona de plantado.",
  },
  "Sens": {
    develops: "Cobertura visual masiva para plantado rápido.",
    whenToUse: "Líneas de tiro defensivas largas imposibles de fumar con humo regular.",
    whatNotToDo: "Tirar la rueda ROU sin coordinar la posición del defuser.",
  },
  "Echo": {
    develops: "Negación remota de plantado e intel de sitio.",
    whenToUse: "Rondas donde el enemigo busca plantado en los segundos finales.",
    whatNotToDo: "Perder ambos drones Yokai por usarlos como cámaras estáticas al descubierto.",
  },
  "Alibi": {
    develops: "Roam corto con engaños visuales e información rápida.",
    whenToUse: "Pisos superiores para retrasar la bajada del ataque.",
    whatNotToDo: "Colocar hologramas en zonas obvias que no confundan al atacante.",
  },
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
      <div className="pibes-selector-bar no-scrollbar">
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
                Secuencia de orden de picks, matriz comparativa de roles y evaluación colectiva de riesgos.
              </p>
            </div>
          </div>

          {/* Matriz Comparativa de Jugadores por Rol */}
          <div className="pibe-section-title">
            <Layers size={16} /> Matriz Comparativa de Cobertura de Roles
          </div>

          <div className="squad-comparison-table-wrapper">
            <table className="squad-comparison-table">
              <thead>
                <tr>
                  <th>Rol Táctico</th>
                  <th>Titular Principal</th>
                  <th>Alternativa de Resguardo</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Hard Breach (Brecha)</strong></td>
                  <td><span className="player-tag-pill chango">ChangoNocturno</span> (Thermite / Hibana)</td>
                  <td><span className="player-tag-pill notorious">El_Notorious</span> (Ace / Support)</td>
                </tr>
                <tr>
                  <td><strong>Entry / Presión Frontal</strong></td>
                  <td><span className="player-tag-pill notorious">El_Notorious</span> (Ash / Zofia)</td>
                  <td><span className="player-tag-pill azusa">AzusaCooper09</span> (Blitz agresivo)</td>
                </tr>
                <tr>
                  <td><strong>Soporte de Plantado</strong></td>
                  <td><span className="player-tag-pill azusa">AzusaCooper09</span> (Montagne / Osa)</td>
                  <td><span className="player-tag-pill chango">ChangoNocturno</span> (Gridlock)</td>
                </tr>
                <tr>
                  <td><strong>Ancla de Objetivo (DEF)</strong></td>
                  <td><span className="player-tag-pill azusa">AzusaCooper09</span> (Smoke / Mute)</td>
                  <td><span className="player-tag-pill chango">ChangoNocturno</span> (Tubarão / Tachanka)</td>
                </tr>
                <tr>
                  <td><strong>Roaming / Flanqueo (DEF)</strong></td>
                  <td><span className="player-tag-pill notorious">El_Notorious</span> (Valkyrie / Vigil)</td>
                  <td><span className="player-tag-pill chango">ChangoNocturno</span> (Roam corto)</td>
                </tr>
                <tr>
                  <td><strong>Información & Intel</strong></td>
                  <td><span className="player-tag-pill notorious">El_Notorious</span> (Zero / Valkyrie)</td>
                  <td><span className="player-tag-pill azusa">AzusaCooper09</span> (Echo / Lion)</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Riesgos y Huecos Colectivos del Squad */}
          <div className="pibe-section-title" style={{ marginTop: 24 }}>
            <AlertTriangle size={16} /> Evaluación de Riesgos & Huecos Colectivos
          </div>

          <div className="squad-risks-grid">
            <div className="squad-risk-card">
              <div className="risk-card-top">
                <AlertTriangle size={14} className="risk-icon" />
                <span className="risk-title">Riesgo: Tendencia a composiciones pasivas en ataque</span>
              </div>
              <p className="risk-desc">
                Si Chango y Azusa eligen soportes pesados al mismo tiempo, Notorious queda como única fuente de agresión.
              </p>
              <div className="risk-correction">
                <strong>Corrección:</strong> Liberar a Notorious para 2nd entry utilitario cuando Chango cubra la brecha principal.
              </div>
            </div>

            <div className="squad-risk-card">
              <div className="risk-card-top">
                <AlertTriangle size={14} className="risk-icon" />
                <span className="risk-title">Riesgo: Ataque con escudos sin follow-up</span>
              </div>
              <p className="risk-desc">
                Montagne o Blitz de Azusa pueden quedar aislados si el resto se queda atrás cubriendo la brecha.
              </p>
              <div className="risk-correction">
                <strong>Corrección:</strong> Avanzar pegados a Azusa para tradear disparos inmediatamente cuando absorba presión.
              </div>
            </div>

            <div className="squad-risk-card">
              <div className="risk-card-top">
                <AlertTriangle size={14} className="risk-icon" />
                <span className="risk-title">Riesgo: Encierro en sitio defensivo sin control de mapa</span>
              </div>
              <p className="risk-desc">
                Composiciones con 3 anclas de sitio regalan el control vertical y las ventanas sin resistencia.
              </p>
              <div className="risk-correction">
                <strong>Corrección:</strong> Asignar a Notorious o Chango para roaming corto en pisos clave.
              </div>
            </div>
          </div>

          {/* Pick Order Cards */}
          <div className="pibe-section-title" style={{ marginTop: 24 }}>
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
          <div className="pibe-sub-nav no-scrollbar">
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
              {/* Afinidad Note Banner */}
              <div className="affinity-explanation-banner">
                <Info size={14} style={{ flexShrink: 0 }} />
                <span>
                  <strong>Afinidad de Estilo:</strong> Indica qué tan natural y compatible resulta este rol táctico con la identidad del jugador (no representa winrate ni habilidad bruta).
                </span>
              </div>

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

              {/* Tryout Operators (En Prueba) con Contexto 3 Líneas */}
              <div className="pibe-section-title" style={{ marginTop: 24 }}>
                <Flame size={15} /> Operadores de Tryout (En Prueba) — Guía Accionable
              </div>
              <div className="tryout-cards-grid">
                {[...currentPibe.tryoutOperators?.attack.map((t) => ({ ...t, side: "attack" })), ...currentPibe.tryoutOperators?.defense.map((t) => ({ ...t, side: "defense" }))].map((t) => {
                  const ctx = TRYOUT_CONTEXTS[t.operator] ?? {
                    develops: t.developmentGoal,
                    whenToUse: "Rondas donde el rol secundario sea requerido.",
                    whatNotToDo: "Evitar jugar sin comunicación previa con el escuadrón.",
                  };
                  return (
                    <div key={t.operator} className="tryout-op-card-enriched">
                      <div className="tryout-op-top">
                        <span className="tryout-op-name">{t.operator}</span>
                        <span className={`tryout-side-tag ${t.side === "attack" ? "atk" : "def"}`}>
                          {t.side === "attack" ? "ATK" : "DEF"}
                        </span>
                      </div>
                      <div className="tryout-ctx-line">
                        <strong>Qué desarrolla:</strong> {ctx.develops}
                      </div>
                      <div className="tryout-ctx-line">
                        <strong>Cuándo usarlo:</strong> {ctx.whenToUse}
                      </div>
                      <div className="tryout-ctx-line warning">
                        <strong>Qué no hacer:</strong> {ctx.whatNotToDo}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Avoid Operators con Motivo Explicativo */}
              <div className="pibe-section-title" style={{ marginTop: 24 }}>
                <AlertTriangle size={15} /> Agentes a Evitar — Motivo Táctico
              </div>
              <div className="avoid-cards-grid">
                {[...currentPibe.avoidOperators?.attack.map((op) => ({ op, side: "attack" })), ...currentPibe.avoidOperators?.defense.map((op) => ({ op, side: "defense" }))].map(({ op, side }) => {
                  const info = AVOID_OP_MOTIVES[op] ?? {
                    title: `${op} — Desaconsejado`,
                    reason: "Incompatibilidad con el perfil del jugador o duplicación innecesaria de roles.",
                  };
                  return (
                    <div key={op} className="avoid-op-card-enriched">
                      <div className="avoid-card-top">
                        <span className="avoid-op-title">{info.title}</span>
                        <span className="avoid-side-badge">{side.toUpperCase()}</span>
                      </div>
                      <p className="avoid-op-reason">{info.reason}</p>
                    </div>
                  );
                })}
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

          {/* TAB 4: USO EN ESCUADRÓN (Con Estilos Completos) */}
          {activeTab === "synergies" && (
            <div className="pibe-tab-content">
              <div className="pibe-section-title">
                <Users size={15} /> Uso Recomendado en Escuadrón
              </div>
              <div className="team-usage-card">
                <div className="tu-block">
                  <span className="tu-label best">✓ Mejor Uso Táctico:</span>
                  <p className="tu-text">{currentPibe.teamUsage?.bestUse}</p>
                </div>

                <div className="tu-block avoid">
                  <span className="tu-label warning">⚠️ Qué Evitar:</span>
                  <p className="tu-text warning-text">{currentPibe.teamUsage?.avoid}</p>
                </div>

                <div className="tu-block">
                  <span className="tu-label">🤝 Dúos Ideales:</span>
                  <ul className="tu-sublist">
                    {currentPibe.teamUsage?.idealDuoPartners?.map((duo, i) => (
                      <li key={i}>{duo}</li>
                    ))}
                  </ul>
                </div>

                {currentPibe.teamUsage?.idealTrioFunction && (
                  <div className="tu-block">
                    <span className="tu-label">⚡ Función en Trío:</span>
                    <p className="tu-text">{currentPibe.teamUsage.idealTrioFunction}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
