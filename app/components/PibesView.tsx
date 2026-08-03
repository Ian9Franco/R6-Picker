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
  Lightbulb,
  RefreshCw,
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
    develops: "Segundo entry utilitario con capacidad de respuesta y limpieza de trampas.",
    whenToUse: "Cuando ya existe brecha dura asegurada en el squad.",
    whatNotToDo: "Gastar proyectiles de impacto antes de identificar utilidad pesada clave.",
  },
  "Zero": {
    develops: "Flex informativo de ataque con cámaras Argus persistentes.",
    whenToUse: "Mapas grandes con rotaciones largas de defensas (ej. Bank, Clubhouse).",
    whatNotToDo: "Quedarse dronando demasiado tiempo sin avanzar con la línea.",
  },
  "Flores": {
    develops: "Limpieza paciente de dispositivos Ratero y desplazamiento de anclas.",
    whenToUse: "Zonas defensivas saturadas de trampas (ej. Oregon Lavandería).",
    whatNotToDo: "Lanzar drones Ratero sin cobertura cercana de un compañero.",
  },
  "Azami": {
    develops: "Construcción dinámica de coberturas Kiba y bloqueo de ángulos.",
    whenToUse: "Sitios con líneas de visión largas de ataque difíciles de tapar.",
    whatNotToDo: "Colocar barreras Kiba que obstaculicen el retake de los compañeros.",
  },
  "Wamai": {
    develops: "Protección de utilidad proyectil combinada con juego flexible.",
    whenToUse: "Rondas defensivas con alta amenaza de granadas o proyectiles.",
    whatNotToDo: "Morir temprano acumulando discos MAG-NET en el inventario.",
  },
  "Aruni": {
    develops: "Control de accesos con portones Surya y consumo de recursos.",
    whenToUse: "Puertas y escotillas principales de entrada enemiga.",
    whatNotToDo: "Desperdiciar el golpe de cuerpo a cuerpo sin remodelar el sitio.",
  },
  "Osa": {
    develops: "Soporte de toma de espacio y cobertura frontal Talon para plantado.",
    whenToUse: "Ataques a sitios con ventanas o pasillos largos (ej. Consulado).",
    whatNotToDo: "Desplegar el escudo Talon en lugares que bloqueen el paso al propio equipo.",
  },
  "Brava": {
    develops: "Manipulación Kludge de dispositivos defensivos para devolver la utilidad.",
    whenToUse: "Defensas cargadas de Maestro, Echo, Kapkan o Aruni.",
    whatNotToDo: "Perder los drones Kludge escaneando gadgets secundarios sin impacto.",
  },
  "Nomad": {
    develops: "Control territorial automático de flancos mediante Airjabs.",
    whenToUse: "Mapas con flanqueos constantes de roamers (ej. Kafe, Coastline).",
    whatNotToDo: "Disparar Airjabs en posiciones expuestas a destrucción directa.",
  },
  "Castle": {
    develops: "Planificación de arquitectura de sitio y cierre de rutas.",
    whenToUse: "Mapas de sitio reducido donde bloquear accesos canalice el ataque.",
    whatNotToDo: "Encerrar a los defensores dejándolos sin rotación interna.",
  },
  "Lesion": {
    develops: "Información pasiva progresiva con minas Gu y retraso del ejecutor.",
    whenToUse: "Sitios donde el ataque suele presionar en los últimos 30 segundos.",
    whatNotToDo: "Morir en los primeros 45 segundos guardando minas Gu.",
  },
  "Rauora": {
    develops: "Control flexible de coberturas y apoyo en ejecuciones.",
    whenToUse: "Tácticas de empuje directo con defuser.",
    whatNotToDo: "Avanzar aislado sin apoyo del segundo entry.",
  },
  "Gridlock": {
    develops: "Control territorial masivo Trax para asegurar el post-plantado.",
    whenToUse: "Sitios con múltiples accesos de retake defensivo.",
    whatNotToDo: "Lanzar Trax Stingers antes de asegurar la zona de plantado.",
  },
  "Sens": {
    develops: "Cobertura visual masiva ROU para plantado rápido.",
    whenToUse: "Líneas de tiro defensivas largas imposibles de fumar con humo regular.",
    whatNotToDo: "Tirar la rueda ROU sin coordinar la posición del defuser.",
  },
  "Echo": {
    develops: "Negación remota de plantado e intel de sitio mediante Yokai.",
    whenToUse: "Rondas donde el enemigo busca plantado en los segundos finales.",
    whatNotToDo: "Perder ambos drones Yokai por usarlos como cámaras estáticas al descubierto.",
  },
  "Alibi": {
    develops: "Roam corto con engaños visuales e información rápida.",
    whenToUse: "Pisos superiores para retrasar la bajada del ataque.",
    whatNotToDo: "Colocar hologramas en zonas obvias que no confundan al atacante.",
  },
};

const CONSEJOS_DATABANK: Record<string, {
  generalRole: string;
  attackAdvice: { condition: string; picks: string[]; tip: string }[];
  defenseAdvice: { condition: string; picks: string[]; tip: string }[];
}> = {
  "el_notorious": {
    generalRole: "Flex principal del equipo: adapta su rol según lo que falte en la ronda.",
    attackAdvice: [
      {
        condition: "Si falta abrir pared",
        picks: ["Kali", "Thermite", "Thatcher"],
        tip: "Priorizar Kali o Thermite antes que Ace. Ace tiene malos resultados en su historial.",
      },
      {
        condition: "Si ya hay hard breacher",
        picks: ["Ash", "Ram", "Brava", "Iana", "Ying"],
        tip: "No duplicar soporte. Cambiar inmediatamente a segundo entry o flex agresivo.",
      },
      {
        condition: "Si el rival tiene mucho roam",
        picks: ["Deimos", "Iana", "Ash", "Dokkaebi"],
        tip: "Acompañar drones y convertir información en bajas tempranas sin obsesionarse con la kill.",
      },
      {
        condition: "Si el rival juega muy encerrado",
        picks: ["Ying", "Ram", "Fuze", "Brava"],
        tip: "Encargarse de romper la estructura defensiva, no de buscar duelos aislados.",
      },
    ],
    defenseAdvice: [
      {
        condition: "Si hace falta negar pared",
        picks: ["Kaid", "Mute", "Bandit", "Tubarão"],
        tip: "Kaid es su main defensivo más natural. Mute y Bandit ofrecen resultados sólidos.",
      },
      {
        condition: "Si ya está cubierta la pared",
        picks: ["Valkyrie", "Vigil", "Fenrir", "Pulse", "Mozzie"],
        tip: "Su mejor situación: jugar libre, buscar información y fraggear.",
      },
      {
        condition: "Si van ganando (Match Point)",
        picks: ["Mute", "Valkyrie", "Fenrir", "Kaid", "Lesion"],
        tip: "Cero improvisaciones de riesgo. Priorizar utilidad persistente y control seguro.",
      },
    ],
  },
  "chango_nocturno": {
    generalRole: "Support estructural fijo y ancla defensiva principal.",
    attackAdvice: [
      {
        condition: "Si falta hard breacher",
        picks: ["Thermite", "Hibana", "Ace"],
        tip: "Usar Hibana en mapas con escotillas y Thermite para aperturas grandes de sitio.",
      },
      {
        condition: "Si falta apoyo de plantado",
        picks: ["Gridlock", "Capitão", "Fuze"],
        tip: "Guardar utilidad para la ejecución final y no gastarla antes de tiempo.",
      },
      {
        condition: "Si el rival juega muy agresivo",
        picks: ["Lion", "Gridlock", "Nomad"],
        tip: "Castigar rotaciones enemigas y proteger flancos sin perseguir roamers solo.",
      },
      {
        condition: "Si el equipo necesita soporte sin entrar 1.º",
        picks: ["Lion", "Gridlock", "Hibana"],
        tip: "Lion es su atacante más estable para aportar valor desde la línea media.",
      },
    ],
    defenseAdvice: [
      {
        condition: "Si hace falta negar brecha",
        picks: ["Tubarão", "Mute", "Bandit", "Kaid"],
        tip: "Tubarão debe ser su primera opción siempre que el sitio lo permita. Excelente rendimiento.",
      },
      {
        condition: "Si hace falta control de entrada",
        picks: ["Thorn", "Kapkan", "Frost", "Ela"],
        tip: "Kapkan y Thorn combinan utilidad pasiva simple con alta efectividad de sitio.",
      },
      {
        condition: "Si van perdiendo y necesitan defensa segura",
        picks: ["Tubarão", "Kapkan", "Mute", "Thorn", "Frost"],
        tip: "Composición aburrida pero ganadora de ELO. Las trampas no tienen ego y aseguran sitio.",
      },
    ],
  },
  "azusa_cooper09": {
    generalRole: "Especialista en escudos de primera línea e información/ancla de objetivo.",
    attackAdvice: [
      {
        condition: "Si el equipo tiene buena comunicación",
        picks: ["Montagne", "Blitz"],
        tip: "Avanzar pegado a un compañero que aproveche la presión y haga calls.",
      },
      {
        condition: "Si se juega sin comunicación",
        picks: ["Lion", "Dokkaebi", "Brava", "Twitch"],
        tip: "Evitar Montagne solo. Usar Lion o Twitch para aportar valor independiente.",
      },
      {
        condition: "Si falta hard breacher",
        picks: ["Thermite", "Thatcher"],
        tip: "Priorizar Thermite antes que Ace. Ace es su peor pick frecuente.",
      },
    ],
    defenseAdvice: [
      {
        condition: "Si hace falta ancla de sitio",
        picks: ["Mute", "Tachanka", "Smoke", "Thorn"],
        tip: "Tachanka tiene winrate altísimo con él porque su utilidad niega ejecuciones en tiempo final.",
      },
      {
        condition: "Si el equipo necesita antigranadas",
        picks: ["Wamai", "Jäger"],
        tip: "Jugar Wamai o Jäger cerca del sitio sin alejarse a duelos lejanos.",
      },
    ],
  },
};

export function PibesView() {
  const pibes = pibesDataRaw.pibes;
  const [selectedPibeId, setSelectedPibeId] = useState<string>("el_notorious");
  const [activeTab, setActiveTab] = useState<"profile" | "operators" | "warnings" | "synergies" | "advice">("profile");

  const currentPibe = pibes.find((p) => p.id === selectedPibeId) ?? pibes[0];
  const pibeRules = (playerRulesRaw as any).rules[selectedPibeId]?.avoid ?? [];
  const consejos = CONSEJOS_DATABANK[selectedPibeId];

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

          {/* Matriz Comparativa de Cobertura de Roles Tarjetas */}
          <div className="pibe-section-title">
            <Layers size={16} /> Matriz Comparativa de Cobertura de Roles
          </div>

          <div className="squad-matrix-grid">
            <div className="squad-matrix-card">
              <div className="matrix-card-header">
                <Swords size={14} /> Hard Breach (Brecha Dura)
              </div>
              <div className="matrix-card-roles">
                <div className="matrix-role-box primary">
                  <span className="matrix-role-label">★ Titular Principal</span>
                  <span className="player-tag-pill chango">ChangoNocturno</span>
                  <span className="matrix-op-names">Thermite / Hibana</span>
                </div>
                <div className="matrix-role-box alt">
                  <span className="matrix-role-label">🛡️ Alternativa</span>
                  <span className="player-tag-pill notorious">El_Notorious</span>
                  <span className="matrix-op-names">Ace / Support</span>
                </div>
              </div>
            </div>

            <div className="squad-matrix-card">
              <div className="matrix-card-header">
                <Flame size={14} /> Entry / Presión Frontal
              </div>
              <div className="matrix-card-roles">
                <div className="matrix-role-box primary">
                  <span className="matrix-role-label">★ Titular Principal</span>
                  <span className="player-tag-pill notorious">El_Notorious</span>
                  <span className="matrix-op-names">Ash / Zofia</span>
                </div>
                <div className="matrix-role-box alt">
                  <span className="matrix-role-label">🛡️ Alternativa</span>
                  <span className="player-tag-pill azusa">AzusaCooper09</span>
                  <span className="matrix-op-names">Blitz agresivo</span>
                </div>
              </div>
            </div>

            <div className="squad-matrix-card">
              <div className="matrix-card-header">
                <Shield size={14} /> Soporte de Plantado
              </div>
              <div className="matrix-card-roles">
                <div className="matrix-role-box primary">
                  <span className="matrix-role-label">★ Titular Principal</span>
                  <span className="player-tag-pill azusa">AzusaCooper09</span>
                  <span className="matrix-op-names">Montagne / Osa</span>
                </div>
                <div className="matrix-role-box alt">
                  <span className="matrix-role-label">🛡️ Alternativa</span>
                  <span className="player-tag-pill chango">ChangoNocturno</span>
                  <span className="matrix-op-names">Gridlock</span>
                </div>
              </div>
            </div>

            <div className="squad-matrix-card">
              <div className="matrix-card-header">
                <Crosshair size={14} /> Ancla de Objetivo (DEF)
              </div>
              <div className="matrix-card-roles">
                <div className="matrix-role-box primary">
                  <span className="matrix-role-label">★ Titular Principal</span>
                  <span className="player-tag-pill azusa">AzusaCooper09</span>
                  <span className="matrix-op-names">Smoke / Mute</span>
                </div>
                <div className="matrix-role-box alt">
                  <span className="matrix-role-label">🛡️ Alternativa</span>
                  <span className="player-tag-pill chango">ChangoNocturno</span>
                  <span className="matrix-op-names">Tubarão / Tachanka</span>
                </div>
              </div>
            </div>

            <div className="squad-matrix-card">
              <div className="matrix-card-header">
                <Target size={14} /> Roaming / Flanqueo (DEF)
              </div>
              <div className="matrix-card-roles">
                <div className="matrix-role-box primary">
                  <span className="matrix-role-label">★ Titular Principal</span>
                  <span className="player-tag-pill notorious">El_Notorious</span>
                  <span className="matrix-op-names">Valkyrie / Vigil</span>
                </div>
                <div className="matrix-role-box alt">
                  <span className="matrix-role-label">🛡️ Alternativa</span>
                  <span className="player-tag-pill chango">ChangoNocturno</span>
                  <span className="matrix-op-names">Roam corto</span>
                </div>
              </div>
            </div>

            <div className="squad-matrix-card">
              <div className="matrix-card-header">
                <Zap size={14} /> Información & Intel
              </div>
              <div className="matrix-card-roles">
                <div className="matrix-role-box primary">
                  <span className="matrix-role-label">★ Titular Principal</span>
                  <span className="player-tag-pill notorious">El_Notorious</span>
                  <span className="matrix-op-names">Zero / Valkyrie</span>
                </div>
                <div className="matrix-role-box alt">
                  <span className="matrix-role-label">🛡️ Alternativa</span>
                  <span className="player-tag-pill azusa">AzusaCooper09</span>
                  <span className="matrix-op-names">Echo / Lion</span>
                </div>
              </div>
            </div>
          </div>

          {/* Riesgos y Huecos Colectivos del Squad */}
          <div className="pibe-section-title" style={{ marginTop: 24 }}>
            <AlertTriangle size={16} /> Evaluación de Riesgos & Huecos Colectivos
          </div>

          <div className="squad-risks-grid">
            <div className="squad-risk-card">
              <div className="risk-card-top">
                <AlertTriangle size={14} className="risk-icon" />
                <span className="risk-title">Riesgo: Composiciones pasivas en ataque</span>
              </div>
              <p className="risk-desc">
                Si Chango y Azusa eligen soportes pesados al mismo tiempo, Notorious queda como única fuente de agresión.
              </p>
              <div className="risk-correction">
                <strong>💡 Corrección Recomendada:</strong> Liberar a Notorious para 2nd entry utilitario cuando Chango cubra la brecha principal.
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
                <strong>💡 Corrección Recomendada:</strong> Avanzar pegados a Azusa para tradear disparos inmediatamente cuando absorba presión.
              </div>
            </div>

            <div className="squad-risk-card">
              <div className="risk-card-top">
                <AlertTriangle size={14} className="risk-icon" />
                <span className="risk-title">Riesgo: Encierro en sitio defensivo</span>
              </div>
              <p className="risk-desc">
                Composiciones con 3 anclas de sitio regalan el control vertical y las ventanas sin resistencia.
              </p>
              <div className="risk-correction">
                <strong>💡 Corrección Recomendada:</strong> Asignar a Notorious o Chango para roaming corto en pisos clave.
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
              className={`pibe-sub-btn ${activeTab === "advice" ? "active" : ""}`}
              onClick={() => setActiveTab("advice")}
            >
              <Lightbulb size={13} /> Consejos Situacionales
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

          {/* TAB: CONSEJOS SITUACIONALES (consejos.md) */}
          {activeTab === "advice" && consejos && (
            <div className="pibe-tab-content">
              {/* General Role Banner */}
              <div className="general-role-banner">
                <Star size={15} style={{ flexShrink: 0 }} />
                <span>
                  <strong>Línea de Juego Principal:</strong> {consejos.generalRole}
                </span>
              </div>

              {/* Consejos en Ataque */}
              <div className="pibe-section-title">
                <Swords size={15} /> Recomendaciones Situacionales en Ataque (consejos.md)
              </div>
              <div className="advice-grid">
                {consejos.attackAdvice.map((item, i) => (
                  <div key={i} className="advice-card atk-advice">
                    <div className="advice-card-header">
                      <span className="advice-condition">{item.condition}</span>
                    </div>
                    <div className="advice-op-pills">
                      {item.picks.map((op) => (
                        <span key={op} className="op-pill main-pill">{op}</span>
                      ))}
                    </div>
                    <p className="advice-tip-text">💡 {item.tip}</p>
                  </div>
                ))}
              </div>

              {/* Consejos en Defensa */}
              <div className="pibe-section-title" style={{ marginTop: 24 }}>
                <Shield size={15} /> Recomendaciones Situacionales en Defensa (consejos.md)
              </div>
              <div className="advice-grid">
                {consejos.defenseAdvice.map((item, i) => (
                  <div key={i} className="advice-card def-advice">
                    <div className="advice-card-header">
                      <span className="advice-condition">{item.condition}</span>
                    </div>
                    <div className="advice-op-pills">
                      {item.picks.map((op) => (
                        <span key={op} className="op-pill main-pill">{op}</span>
                      ))}
                    </div>
                    <p className="advice-tip-text">💡 {item.tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                <Star size={15} /> Agentes Insignia (Identidad Principal)
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

              {/* Explicit Rol & Picks de Respiro / Rotación */}
              <div className="pibe-section-title" style={{ marginTop: 24 }}>
                <RefreshCw size={15} /> Rol & Picks de Respiro / Rotación (Tryouts)
              </div>
              <div className="breathing-role-card">
                <div className="breathing-card-top">
                  <span className="breathing-card-title">Rol Secundario de Rotación:</span>
                  <span className="breathing-role-tag">
                    {currentPibe.profile?.secondaryRole?.toUpperCase() ?? "DEVELOPMENT FLEX"}
                  </span>
                </div>
                <div className="breathing-freq-box">
                  <Zap size={13} style={{ flexShrink: 0 }} />
                  <span>
                    <strong>Frecuencia:</strong> Se activa dinámicamente en la ronda 3 o ante rachas para romper la previsibilidad defensiva sin desarmar el núcleo.
                  </span>
                </div>
                <div className="breathing-pills-container">
                  <div className="breathing-side-row">
                    <span className="breathing-side-label"><Swords size={13} /> Respiro ATK:</span>
                    <div className="op-pills-row">
                      {currentPibe.tryoutOperators?.attack.map((t) => (
                        <span key={t.operator} className="op-pill breathing-pill">
                          <RefreshCw size={11} /> {t.operator}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="breathing-side-row">
                    <span className="breathing-side-label"><Shield size={13} /> Respiro DEF:</span>
                    <div className="op-pills-row">
                      {currentPibe.tryoutOperators?.defense.map((t) => (
                        <span key={t.operator} className="op-pill breathing-pill">
                          <RefreshCw size={11} /> {t.operator}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tryout Operators (En Prueba) con Contexto 3 Micro-Tarjetas */}
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
                      <div className="tryout-micro-box develops">
                        <span className="tryout-box-label">🔹 Qué desarrolla:</span>
                        <span className="tryout-box-text">{ctx.develops}</span>
                      </div>
                      <div className="tryout-micro-box when">
                        <span className="tryout-box-label">🎯 Cuándo usarlo:</span>
                        <span className="tryout-box-text">{ctx.whenToUse}</span>
                      </div>
                      <div className="tryout-micro-box avoid">
                        <span className="tryout-box-label">⚠️ Qué no hacer:</span>
                        <span className="tryout-box-text">{ctx.whatNotToDo}</span>
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

          {/* TAB 4: USO EN ESCUADRÓN (Tarjetas Estilizadas) */}
          {activeTab === "synergies" && (
            <div className="pibe-tab-content">
              <div className="pibe-section-title">
                <Users size={15} /> Uso Recomendado en Escuadrón
              </div>

              <div className="team-usage-grid">
                <div className="team-usage-card-item best">
                  <div className="tu-card-header">
                    <CheckCircle2 size={16} /> Mejor Uso Táctico
                  </div>
                  <p className="tu-card-body">{currentPibe.teamUsage?.bestUse}</p>
                </div>

                <div className="team-usage-card-item warning">
                  <div className="tu-card-header">
                    <AlertTriangle size={16} /> Qué Evitar
                  </div>
                  <p className="tu-card-body warning-text">{currentPibe.teamUsage?.avoid}</p>
                </div>

                <div className="team-usage-card-item duo">
                  <div className="tu-card-header">
                    <Users size={16} /> Dúos Ideales
                  </div>
                  <div className="tu-card-body">
                    <ul className="tu-duo-list">
                      {currentPibe.teamUsage?.idealDuoPartners?.map((duo, i) => (
                        <li key={i}>{duo}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {currentPibe.teamUsage?.idealTrioFunction && (
                  <div className="team-usage-card-item trio">
                    <div className="tu-card-header">
                      <Zap size={16} /> Función en Trío
                    </div>
                    <p className="tu-card-body">{currentPibe.teamUsage.idealTrioFunction}</p>
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
