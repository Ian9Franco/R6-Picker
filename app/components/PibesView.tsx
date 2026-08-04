"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Award,
  CheckCircle2,
  Compass,
  Crosshair,
  FileSpreadsheet,
  Flame,
  HelpCircle,
  Info,
  Layers,
  Lightbulb,
  MapPin,
  MapPinned,
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
import { KNOWN_MAPS } from "../../data/trackerParser";
import { TrackerImporter } from "./TrackerImporter";
import { PIBES_CONFIG } from "../../data/pibes";

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

const AVOID_OP_MOTIVES: Record<string, { title: string; whenAvoid: string; whenViable: string }> = {
  "Deimos": {
    title: "Deimos — Cazador de Roamers",
    whenAvoid: "Falta abrir la pared principal o si se caza en solitario sin compañero para el re-frag.",
    whenViable: "El rival abusa de roamers sueltos y el squad ya cuenta con la brecha dura cubierta.",
  },
  "Ash": {
    title: "Ash — Entry y Destrucción Distante",
    whenAvoid: "Pick por defecto si el equipo no tiene quién abra sitio o limpie utilidades pesadas.",
    whenViable: "1st entry agresivo o limpieza rápida de utilidades si otro compañero ya lleva el soporte.",
  },
  "Ace": {
    title: "Ace — Brecha Remota Versátil",
    whenAvoid: "Pick automático sobre Thermite cuando se requieren aperturas grandes de sitio.",
    whenViable: "Mapas con escotillas lejanas o paredes expuestas donde lanzar brecha a distancia es más seguro.",
  },
  "Caveira": {
    title: "Caveira — Roam de Sigilo y Presión",
    whenAvoid: "Ejecuciones apretadas de sitio o sin utilidad pasiva si caen las defensas rápido.",
    whenViable: "Rondas de sorpresa cuando el ataque enemigo avanza desorganizado y aislado.",
  },
  "Pulse": {
    title: "Pulse — Intel Vertical de Sitio",
    whenAvoid: "Roam distante fuera de sitio o si el squad carece de anclas con trampas pasivas.",
    whenViable: "Debajo de sitios con piso destructible para rastrear e interrumpir el plantado con C4.",
  },
  "Amaru": {
    title: "Amaru — Entrada Inmediata",
    whenAvoid: "Primer pick sin dronero previo o en rondas coordinadas de brecha dura.",
    whenViable: "Rondas de sorpresa para tomar ventanas o pisos superiores sin vigilancia.",
  },
  "Nøkk": {
    title: "Nøkk — Infiltración Silenciosa",
    whenAvoid: "Se requiere utilidad pesada de destrucción o soporte colectivo para el grupo.",
    whenViable: "Flanquear cámaras cuando el resto del equipo ejerce presión por el frente.",
  },
  "Oryx": {
    title: "Oryx — Movilidad y Rotación Rápida",
    whenAvoid: "El sitio defensivo exige utilidades pasivas de retención o bloqueo de accesos.",
    whenViable: "Mapas de varios pisos (ej. Bank) para rotaciones verticales de respuesta rápida.",
  },
  "Vigil": {
    title: "Vigil — Roam de Ocultación",
    whenAvoid: "La defensa carece de utilidades pasivas de sitio o anclas de retención.",
    whenViable: "Desperdiciar el tiempo de dronero enemigo en zonas clave de rotación.",
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
        condition: "Si falta abrir pared / brecha principal",
        picks: ["Kali", "Thermite", "Thatcher"],
        tip: "Priorizar Kali o Thermite. Evitar Ace o Ash si se necesita apertura completa del portón de sitio.",
      },
      {
        condition: "Si ya hay hard breacher en el squad",
        picks: ["Ash", "Ram", "Brava", "Iana", "Ying"],
        tip: "Ash y Ram son viables aquí para 1st entry o destrucción vertical, dado que la brecha ya está cubierta.",
      },
      {
        condition: "Si el rival tiene mucho roam",
        picks: ["Deimos", "Dokkaebi", "Iana", "Jackal"],
        tip: "Deimos es muy efectivo aquí para cazar con seguimiento, siempre que el squad ya tenga la brecha asegurada.",
      },
      {
        condition: "Si el rival juega muy encerrado en sitio",
        picks: ["Ying", "Ram", "Fuze", "Brava"],
        tip: "Encargarse de romper la estructura defensiva o hackear dispositivos clave antes del push.",
      },
    ],
    defenseAdvice: [
      {
        condition: "Si hace falta negar pared",
        picks: ["Kaid", "Mute", "Bandit", "Tubarão"],
        tip: "Kaid es su main defensivo más natural. Mute y Tubarão ofrecen gran control de brecha.",
      },
      {
        condition: "Si ya está cubierta la pared",
        picks: ["Pulse", "Valkyrie", "Fenrir", "Mozzie"],
        tip: "Pulse es excelente para denegación vertical desde abajo en sitios con piso destructible.",
      },
      {
        condition: "Si van ganando (Match Point)",
        picks: ["Mute", "Valkyrie", "Fenrir", "Kaid", "Lesion"],
        tip: "Cero improvisaciones de riesgo. Priorizar utilidad persistente y control seguro de sitio.",
      },
    ],
  },
  "chango_nocturno": {
    generalRole: "Support estructural fijo y ancla defensiva principal.",
    attackAdvice: [
      {
        condition: "Si falta hard breacher principal",
        picks: ["Thermite", "Hibana", "Ace"],
        tip: "Thermite para portones de sitio directos; Hibana en mapas verticales; Ace solo en aberturas lejanas a distancia.",
      },
      {
        condition: "Si falta apoyo de plantado o flanco",
        picks: ["Gridlock", "Capitão", "Nomad"],
        tip: "Colocar trax o airjabs en rotaciones defensivas antes de apoyar la ejecución con el defuser.",
      },
      {
        condition: "Si el rival juega roam muy agresivo",
        picks: ["Lion", "Gridlock", "Nomad"],
        tip: "Bloquear rutas de retorno enemigas con Lion y Gridlock sin perseguir roamers solo.",
      },
      {
        condition: "Si el equipo necesita soporte de línea media",
        picks: ["Lion", "Hibana", "Gridlock"],
        tip: "Lion es su atacante más estable para aportar valor y escaneos sin exponerse en primera línea.",
      },
    ],
    defenseAdvice: [
      {
        condition: "Si hace falta negar brecha o congelar avance",
        picks: ["Tubarão", "Mute", "Bandit", "Kaid"],
        tip: "Tubarão es su mejor pick defensivo por impacto. Frena cargadores y ralentiza la ejecución enemiga.",
      },
      {
        condition: "Si hace falta control de entrada / trampas pasivas",
        picks: ["Thorn", "Kapkan", "Frost", "Castle"],
        tip: "Kapkan y Castle remodelan el sitio y castigan avances apresurados sin depender de puntería rápida.",
      },
      {
        condition: "Si van perdiendo y necesitan defensa segura",
        picks: ["Tubarão", "Kapkan", "Mute", "Thorn", "Lesion"],
        tip: "Composición sólida de sitio. Las trampas y la denegación pasiva aseguran rondas sin regalar bajas.",
      },
    ],
  },
  "azusa_cooper09": {
    generalRole: "Especialista en escudos de primera línea e información/ancla de objetivo.",
    attackAdvice: [
      {
        condition: "Si el equipo tiene buena comunicación",
        picks: ["Montagne", "Blitz"],
        tip: "Avanzar al frente como escudo de presión, dar callouts precisos y coordinar al segundo fragger atrás.",
      },
      {
        condition: "Si se juega sin comunicación fluida",
        picks: ["Lion", "Dokkaebi", "Brava", "Twitch"],
        tip: "Evitar escudos individuales. Usar intel global o hackeo directo para aportar valor independiente.",
      },
      {
        condition: "Si falta hard breacher en el squad",
        picks: ["Thermite", "Thatcher"],
        tip: "Usar Thermite para asegurar la apertura del objetivo sin perder la disciplina de línea.",
      },
      {
        condition: "Si el sitio exige presión de ventanas / frontal",
        picks: ["Osa", "Brava", "Twitch"],
        tip: "Osa asegura ángulos frontales en ventanas o pasillos largos de toma de sitio.",
      },
    ],
    defenseAdvice: [
      {
        condition: "Si hace falta ancla principal de sitio",
        picks: ["Mute", "Tachanka", "Smoke", "Thorn"],
        tip: "Tachanka y Mute tienen winrate altísimo en su historial. El fuego niega ejecuciones en los últimos 20 segundos.",
      },
      {
        condition: "Si el sitio tiene piso destructible desde abajo",
        picks: ["Pulse", "Wamai", "Jäger"],
        tip: "Pulse permite detectar el plantado enemigo a través del techo/piso e interrumpirlo con C4.",
      },
      {
        condition: "Si hace falta denegación pasiva de accesos",
        picks: ["Lesion", "Kapkan", "Mute"],
        tip: "Colocar utilidades en las puertas principales y jugar escondido para forzar al atacante a gastar tiempo.",
      },
    ],
  },
};

export function PibesView() {
  const pibes = pibesDataRaw.pibes;
  const [selectedPibeId, setSelectedPibeId] = useState<string>("el_notorious");
  const [activeTab, setActiveTab] = useState<"profile" | "operators" | "warnings" | "synergies" | "advice" | "maps">("profile");

  const [playerMapStats, setPlayerMapStats] = useState<Record<string, any>>({});
  const [mapFilter, setMapFilter] = useState<string>("all");
  const [sideFilter, setSideFilter] = useState<string>("all");

  const [sortColumn, setSortColumn] = useState<"mapName" | "matchesOrRounds" | "winRate" | "kd" | "headshotPct">("winRate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const toggleSort = (col: "mapName" | "matchesOrRounds" | "winRate" | "kd" | "headshotPct") => {
    if (sortColumn === col) {
      setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"));
    } else {
      setSortColumn(col);
      setSortDirection(col === "mapName" ? "asc" : "desc");
    }
  };

  const loadAllStats = async () => {
    try {
      const res = await fetch("/api/save-tracker-stats");
      if (res.ok) {
        const data = await res.json();
        if (data.imports) {
          setPlayerMapStats(data.imports);
          return;
        }
      }
    } catch (e) {
      console.error("Error leyendo API stats:", e);
    }
    try {
      const stored = localStorage.getItem("r6_tracker_map_stats_v1");
      if (stored) setPlayerMapStats(JSON.parse(stored));
    } catch (e) {}
  };

  useEffect(() => {
    loadAllStats();
  }, [selectedPibeId, activeTab]);

  const currentPibe = pibes.find((p) => p.id === selectedPibeId) ?? pibes[0];
  const pibeRules = (playerRulesRaw as any).rules[selectedPibeId]?.avoid ?? [];
  const consejos = CONSEJOS_DATABANK[selectedPibeId];

  // FACTOS data for the current pibe — used to filter inconsistencies
  const factosProfile = PIBES_CONFIG.find((p) => p.id === selectedPibeId);
  const factosAvoidSet = new Set(
    (factosProfile?.avoidOperators ?? []).map((o) => o.toLowerCase())
  );

  /** Filter a list of pick names, removing any the pibe should avoid */
  function filterSafePicks(picks: string[]): { safe: string[]; removed: string[] } {
    const safe: string[] = [];
    const removed: string[] = [];
    for (const p of picks) {
      if (factosAvoidSet.has(p.toLowerCase())) {
        removed.push(p);
      } else {
        safe.push(p);
      }
    }
    return { safe, removed };
  }

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
        <button
          className={`pibe-select-btn tracker-tab-btn ${selectedPibeId === "tracker" ? "active" : ""}`}
          onClick={() => setSelectedPibeId("tracker")}
        >
          <FileSpreadsheet size={14} />
          <span>Importador Tracker</span>
        </button>
      </div>

      {selectedPibeId === "tracker" ? (
        <TrackerImporter />
      ) : selectedPibeId === "squad" ? (
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
              className={`pibe-sub-btn ${activeTab === "maps" ? "active" : ""}`}
              onClick={() => setActiveTab("maps")}
            >
              <MapPinned size={13} /> Rendimiento por Mapa (Tracker)
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

              {/* Avoid Operators con Contexto Dual (Cuándo Evitar vs Cuándo SÍ usar) */}
              <div className="pibe-section-title" style={{ marginTop: 24 }}>
                <AlertTriangle size={15} /> Agentes con Riesgo Táctico (Cuándo Evitar vs Cuándo Usar)
              </div>
              <div className="avoid-cards-grid">
                {[...currentPibe.avoidOperators?.attack.map((op) => ({ op, side: "attack" })), ...currentPibe.avoidOperators?.defense.map((op) => ({ op, side: "defense" }))].map(({ op, side }) => {
                  const info = AVOID_OP_MOTIVES[op] ?? {
                    title: `${op} — Condicional`,
                    whenAvoid: "Evitar si la composición del squad carece de roles estructurales o soporte de sitio.",
                    whenViable: "SÍ es viable en situaciones específicas cuando la brecha y el soporte ya están asegurados.",
                  };
                  return (
                    <div key={op} className="avoid-op-card-enriched">
                      <div className="avoid-card-top">
                        <span className="avoid-op-title">{info.title}</span>
                        <span className="avoid-side-badge">{side.toUpperCase()}</span>
                      </div>
                      <div className="tryout-micro-box avoid">
                        <span className="tryout-box-label">⚠️ Cuándo EVITARLO:</span>
                        <span className="tryout-box-text">{info.whenAvoid}</span>
                      </div>
                      <div className="tryout-micro-box viable">
                        <span className="tryout-box-label">✅ Cuándo SÍ es viable:</span>
                        <span className="tryout-box-text">{info.whenViable}</span>
                      </div>
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

          {/* TAB: RENDIMIENTO POR MAPA (TRACKER IMPORTS) */}
          {activeTab === "maps" && (() => {
            const rawEntries = Object.entries(playerMapStats).filter(([key, val]: [string, any]) => {
              const pId = currentPibe.id.toLowerCase();
              const pName = currentPibe.name.toLowerCase();
              const valPlayer = (val?.player || "").toLowerCase();
              return key.toLowerCase().startsWith(pId) || valPlayer === pName;
            });

            const filteredEntries = rawEntries.filter(([_, val]: [string, any]) => {
              if (sideFilter !== "all" && val.side !== sideFilter) return false;
              return true;
            });

            return (
              <div className="pibe-tab-content">
                <div className="general-role-banner">
                  <MapPinned size={15} style={{ flexShrink: 0 }} />
                  <span>
                    <strong>Estadísticas por Mapa (R6 Tracker):</strong> Rendimiento de cada operador importado para {currentPibe.name}. Se usa como fuente activa para calibrar recomendaciones por mapa.
                  </span>
                </div>

                {/* Filter Toolbar */}
                <div className="tracker-filter-bar">
                  <div className="tracker-filter-group">
                    <span className="tracker-filter-label">Bando:</span>
                    <div className="segmented-control">
                      <button className={sideFilter === "all" ? "active" : ""} onClick={() => setSideFilter("all")}>Todos</button>
                      <button className={sideFilter === "attack" ? "active" : ""} onClick={() => setSideFilter("attack")}>Ataque</button>
                      <button className={sideFilter === "defense" ? "active" : ""} onClick={() => setSideFilter("defense")}>Defensa</button>
                    </div>
                  </div>

                  <div className="tracker-filter-group">
                    <span className="tracker-filter-label">Mapa:</span>
                    <select
                      className="importer-select"
                      value={mapFilter}
                      onChange={(e) => setMapFilter(e.target.value)}
                    >
                      <option value="all">Todos los Mapas</option>
                      {KNOWN_MAPS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {filteredEntries.length === 0 ? (
                  <div className="empty-tracker-notice" style={{ textAlign: "center", padding: "32px 16px", background: "var(--card-bg)", borderRadius: 12, border: "1px dashed var(--border)" }}>
                    <FileSpreadsheet size={36} style={{ color: "var(--muted)", marginBottom: 8 }} />
                    <h4 style={{ margin: "4px 0", color: "var(--fg)" }}>No hay estadísticas de mapa para {currentPibe.name}</h4>
                    <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>
                      Entrá al Importador Tracker para pegar las tablas copiadas de R6 Tracker y agregarlas a su perfil.
                    </p>
                    <button
                      className="start-match-btn"
                      style={{ padding: "8px 16px", fontSize: 12, width: "auto" }}
                      onClick={() => setSelectedPibeId("tracker")}
                    >
                      Ir al Importador Tracker
                    </button>
                  </div>
                ) : (
                  <div className="imported-ops-grid" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {filteredEntries.map(([key, entry]: [string, any]) => {
                      const mapsList = (entry.maps || []).filter((m: any) => {
                        if (mapFilter === "all") return true;
                        const name = (m.displayName || m.trackerName || m.mapName || "").toLowerCase();
                        const id = (m.mapId || "").toLowerCase();
                        const filterLower = mapFilter.toLowerCase();
                        return (
                          name === filterLower ||
                          id === filterLower ||
                          name.replace(/\s+/g, "_") === filterLower
                        );
                      });

                      if (mapsList.length === 0) return null;

                      const sortedMaps = [...mapsList].sort((a: any, b: any) => {
                        let valA = a[sortColumn] ?? a.displayName ?? a.trackerName ?? a.mapName;
                        let valB = b[sortColumn] ?? b.displayName ?? b.trackerName ?? b.mapName;

                        if (sortColumn === "mapName") {
                          valA = (a.displayName || a.trackerName || a.mapName || "").toLowerCase();
                          valB = (b.displayName || b.trackerName || b.mapName || "").toLowerCase();
                          return sortDirection === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
                        }

                        const numA = typeof valA === "number" ? valA : parseFloat(valA) || 0;
                        const numB = typeof valB === "number" ? valB : parseFloat(valB) || 0;
                        return sortDirection === "asc" ? numA - numB : numB - numA;
                      });

                      const renderSortIcon = (col: "mapName" | "matchesOrRounds" | "winRate" | "kd" | "headshotPct") => {
                        if (sortColumn !== col) return <ArrowUpDown size={11} style={{ opacity: 0.4, marginLeft: 4, display: "inline" }} />;
                        return sortDirection === "desc" ? (
                          <ArrowDown size={11} style={{ color: "var(--atk)", marginLeft: 4, display: "inline" }} />
                        ) : (
                          <ArrowUp size={11} style={{ color: "var(--atk)", marginLeft: 4, display: "inline" }} />
                        );
                      };

                      return (
                        <div key={key} className="card" style={{ padding: 16 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span className="pick-row-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                                {entry.operator.slice(0, 2).toUpperCase()}
                              </span>
                              <div>
                                <h3 style={{ fontSize: 16, margin: 0, color: "var(--fg)", fontWeight: 700 }}>
                                  {entry.operator}
                                </h3>
                                <span style={{ fontSize: 11, color: "var(--muted)" }}>
                                  {entry.playlist} · {entry.period}
                                </span>
                              </div>
                            </div>
                            <span className={`saved-side-pill ${entry.side}`}>
                              {entry.side === "attack" ? "ATAQUE" : "DEFENSA"}
                            </span>
                          </div>

                          <div className="importer-table-container no-scrollbar">
                            <table className="importer-table">
                              <thead>
                                <tr>
                                  <th
                                    className={`sortable-th ${sortColumn === "mapName" ? "active-sort" : ""}`}
                                    onClick={() => toggleSort("mapName")}
                                  >
                                    Mapa {renderSortIcon("mapName")}
                                  </th>
                                  <th
                                    className={`sortable-th ${sortColumn === "matchesOrRounds" ? "active-sort" : ""}`}
                                    onClick={() => toggleSort("matchesOrRounds")}
                                  >
                                    Partidas {renderSortIcon("matchesOrRounds")}
                                  </th>
                                  <th
                                    className={`sortable-th ${sortColumn === "winRate" ? "active-sort" : ""}`}
                                    onClick={() => toggleSort("winRate")}
                                  >
                                    Winrate {renderSortIcon("winRate")}
                                  </th>
                                  <th>V / D</th>
                                  <th
                                    className={`sortable-th ${sortColumn === "kd" ? "active-sort" : ""}`}
                                    onClick={() => toggleSort("kd")}
                                  >
                                    K/D {renderSortIcon("kd")}
                                  </th>
                                  <th
                                    className={`sortable-th ${sortColumn === "headshotPct" ? "active-sort" : ""}`}
                                    onClick={() => toggleSort("headshotPct")}
                                  >
                                    Headshot % {renderSortIcon("headshotPct")}
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {sortedMaps.map((m: any) => {
                                  const isHighWR = m.winRate >= 55;
                                  const isLowWR = m.winRate < 45;
                                  const isHighKD = m.kd >= 1.25;
                                  const mapShowName = m.displayName || m.trackerName || m.mapName;

                                  return (
                                    <tr key={m.mapId || m.mapName}>
                                      <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
                                          <MapPin size={12} style={{ color: "var(--muted)" }} />
                                          {mapShowName}
                                        </div>
                                      </td>
                                      <td>{m.matchesOrRounds}</td>
                                      <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                          <span className={`winrate-tag ${isHighWR ? "high-wr" : isLowWR ? "low-wr" : "mid-wr"}`}>
                                            {m.winRate}%
                                          </span>
                                          {isHighWR && (
                                            <span style={{ fontSize: 9, background: "rgba(16,185,129,0.15)", color: "#34d399", padding: "1px 4px", borderRadius: 4, fontWeight: 700 }}>
                                              DOMINANTE
                                            </span>
                                          )}
                                          {isLowWR && (
                                            <span style={{ fontSize: 9, background: "rgba(239,68,68,0.15)", color: "#f87171", padding: "1px 4px", borderRadius: 4, fontWeight: 700 }}>
                                              CRÍTICO
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td>
                                        <span style={{ color: "var(--win)", fontWeight: 600 }}>{m.wins}V</span>
                                        {" - "}
                                        <span style={{ color: "var(--loss)", fontWeight: 600 }}>{m.losses}D</span>
                                      </td>
                                      <td>
                                        <span style={{ fontWeight: 700, color: isHighKD ? "var(--win)" : "inherit" }}>
                                          {m.kd}
                                        </span>
                                        {isHighKD && (
                                          <span style={{ fontSize: 9, color: "#fbbf24", marginLeft: 4 }}>★ FRAGGER</span>
                                        )}
                                      </td>
                                      <td>{m.headshotPct}%</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
