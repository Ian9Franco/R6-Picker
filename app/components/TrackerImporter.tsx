"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  Check,
  CheckCircle2,
  Copy,
  Database,
  FileSpreadsheet,
  HelpCircle,
  Layers,
  RefreshCw,
  Shield,
  Swords,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";
import { attackers, defenders } from "../../data/catalog";
import pibesDataRaw from "../../data/pibes.json";
import { parseTrackerText, type ParsedTrackerBlock, type TrackerMapStat } from "../../data/trackerParser";

type SavedStatsMap = Record<string, {
  player: string;
  side: "attack" | "defense";
  operator: string;
  playlist?: string;
  period?: string;
  maps: TrackerMapStat[];
  updatedAt: string;
}>;

const STORAGE_KEY = "r6_tracker_map_stats_v1";

const SAMPLE_TEXT = `JUGADOR: El_Notorious
BANDO: Ataque
OPERADOR: Zofia
PLAYLIST: Ranked
PERÍODO: Y9S3 y posteriores

Coastline	42	54.8%	23	19	1.31	48.2%	0.63
Chalet	38	47.4%	18	20	1.18	45.0%	0.58
Clubhouse	29	62.1%	18	11	1.45	51.0%	0.72
Oregon	35	51.4%	18	17	1.22	46.5%	0.60`;

export function TrackerImporter() {
  const [rawText, setRawText] = useState<string>("");
  const [parsed, setParsed] = useState<ParsedTrackerBlock | null>(null);
  
  // Controles de anulación manual
  const [selectedPlayer, setSelectedPlayer] = useState<string>("el_notorious");
  const [selectedSide, setSelectedSide] = useState<"attack" | "defense">("attack");
  const [selectedOperator, setSelectedOperator] = useState<string>("Zofia");
  const [playlistInput, setPlaylistInput] = useState<string>("Ranked");
  const [periodInput, setPeriodInput] = useState<string>("Y9S3 y posteriores");

  const [savedStats, setSavedStats] = useState<SavedStatsMap>({});
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);
  const [saveSuccessNotification, setSaveSuccessNotification] = useState<boolean>(false);

  // Cargar estadísticas guardadas desde API y LocalStorage
  const loadSavedStats = async () => {
    try {
      const res = await fetch("/api/save-tracker-stats");
      if (res.ok) {
        const data = await res.json();
        if (data.imports) {
          setSavedStats(data.imports);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.imports));
          return;
        }
      }
    } catch (e) {
      console.error("Error al cargar archivos desde API:", e);
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedStats(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Error al cargar estadísticas del almacenamiento local:", e);
    }
  };

  useEffect(() => {
    loadSavedStats();
  }, []);

  // Re-parsear texto cada vez que cambia
  const handleParse = (text: string) => {
    setRawText(text);
    if (!text.trim()) {
      setParsed(null);
      return;
    }
    const result = parseTrackerText(text);
    setParsed(result);

    // Sincronizar selectores si se detectan en el encabezado
    if (result.player) {
      const foundPibe = pibesDataRaw.pibes.find(
        (p) => p.name.toLowerCase() === result.player?.toLowerCase() || p.id === result.player?.toLowerCase()
      );
      if (foundPibe) setSelectedPlayer(foundPibe.id);
    }
    if (result.side) setSelectedSide(result.side);
    if (result.operator) setSelectedOperator(result.operator);
    if (result.playlist) setPlaylistInput(result.playlist);
    if (result.period) setPeriodInput(result.period);
  };

  // Guardar físicamente en disco (data/imports/<jugador>_<bando>_<operador>.json) y en localStorage
  const handleSaveToStorage = async () => {
    if (!parsed || parsed.maps.length === 0) return;

    const pibeObj = pibesDataRaw.pibes.find((p) => p.id === selectedPlayer);
    const playerName = pibeObj ? pibeObj.name : selectedPlayer;

    const payload = {
      player: playerName,
      side: selectedSide,
      operator: selectedOperator,
      playlist: playlistInput,
      period: periodInput,
      maps: parsed.maps,
      updatedAt: new Date().toISOString(),
    };

    try {
      // Guardar físicamente en archivo JSON individual en disco
      const res = await fetch("/api/save-tracker-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSaveSuccessNotification(true);
        setTimeout(() => setSaveSuccessNotification(false), 3000);
        await loadSavedStats();
      } else {
        const errData = await res.json();
        console.error("Error de guardado en API:", errData);
      }
    } catch (err) {
      console.error("Error conectando con la API de guardado:", err);
    }
  };

  // Copiar JSON normalizado al portapapeles
  const handleCopyJSON = () => {
    if (!parsed) return;
    const pibeObj = pibesDataRaw.pibes.find((p) => p.id === selectedPlayer);
    const exportObj = {
      player: pibeObj ? pibeObj.name : selectedPlayer,
      side: selectedSide,
      operator: selectedOperator,
      playlist: playlistInput,
      period: periodInput,
      maps: parsed.maps,
    };

    navigator.clipboard.writeText(JSON.stringify(exportObj, null, 2));
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  // Eliminar un conjunto de estadísticas guardado físicamente
  const handleDeleteSaved = async (key: string) => {
    const entry = savedStats[key];
    const fileName = (entry as any)?.fileName || `${key}.json`;

    try {
      await fetch(`/api/save-tracker-stats?fileName=${encodeURIComponent(fileName)}`, {
        method: "DELETE",
      });
    } catch (e) {
      console.error("Error al eliminar archivo en API:", e);
    }

    const updated = { ...savedStats };
    delete updated[key];
    setSavedStats(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const currentOpList = selectedSide === "attack" ? attackers : defenders;

  return (
    <div className="tracker-importer-container">
      {/* Header Info */}
      <div className="pibe-header-card">
        <div className="pibe-avatar-large">
          <FileSpreadsheet size={28} />
        </div>
        <div className="pibe-header-info">
          <div className="pibe-header-top">
            <h2 className="pibe-name-title">Importador de Estadísticas R6 Tracker</h2>
            <span className="pibe-role-badge">Motor de Normalización</span>
          </div>
          <p className="pibe-summary-text">
            Copiá las tablas de rendimiento por mapa de tus operadores desde la app de R6 Tracker y convertilas automáticamente en datos tácticos utilizables.
          </p>
        </div>
      </div>

      <div className="tracker-importer-grid">
        {/* Panel Izquierdo: Entrada de Texto & Metadatos */}
        <div className="tracker-input-card">
          <div className="tracker-card-title">
            <Upload size={16} /> 1. Pegá el Texto Crudo de R6 Tracker
            <button
              className="sample-btn"
              onClick={() => handleParse(SAMPLE_TEXT)}
              title="Cargar texto de ejemplo"
            >
              Cargar Ejemplo
            </button>
          </div>

          <textarea
            className="tracker-textarea"
            placeholder={`Pegá aquí el encabezado y las filas de la tabla de R6 Tracker...\nEjemplo:\nJUGADOR: El_Notorious\nBANDO: Ataque\nOPERADOR: Zofia\nCoastline 42 54.8% 23 19 1.31 48.2% 0.63`}
            value={rawText}
            onChange={(e) => handleParse(e.target.value)}
            rows={10}
          />

          <div className="tracker-card-title" style={{ marginTop: 16 }}>
            <Layers size={16} /> 2. Verificar & Asignar Metadatos
          </div>

          <div className="tracker-selectors-grid">
            <div className="selector-field">
              <label><User size={12} /> Jugador:</label>
              <select
                value={selectedPlayer}
                onChange={(e) => setSelectedPlayer(e.target.value)}
              >
                {pibesDataRaw.pibes.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="selector-field">
              <label>Bando:</label>
              <div className="side-toggle-group">
                <button
                  type="button"
                  className={selectedSide === "attack" ? "active-atk" : ""}
                  onClick={() => {
                    setSelectedSide("attack");
                    if (!attackers.some((a) => a.name === selectedOperator)) {
                      setSelectedOperator(attackers[0].name);
                    }
                  }}
                >
                  <Swords size={12} /> Ataque
                </button>
                <button
                  type="button"
                  className={selectedSide === "defense" ? "active-def" : ""}
                  onClick={() => {
                    setSelectedSide("defense");
                    if (!defenders.some((d) => d.name === selectedOperator)) {
                      setSelectedOperator(defenders[0].name);
                    }
                  }}
                >
                  <Shield size={12} /> Defensa
                </button>
              </div>
            </div>

            <div className="selector-field">
              <label>Operador:</label>
              <select
                value={selectedOperator}
                onChange={(e) => setSelectedOperator(e.target.value)}
              >
                {currentOpList.map((op) => (
                  <option key={op.name} value={op.name}>{op.name}</option>
                ))}
              </select>
            </div>

            <div className="selector-field">
              <label>Playlist / Período:</label>
              <input
                type="text"
                value={playlistInput}
                onChange={(e) => setPlaylistInput(e.target.value)}
                placeholder="Ej. Ranked / Y9S3"
              />
            </div>
          </div>
        </div>

        {/* Panel Derecho: Vista Previa de Tabla Normalizada */}
        <div className="tracker-preview-card">
          <div className="tracker-card-title">
            <BarChart3 size={16} /> 3. Vista Previa Normalizada ({parsed?.maps.length ?? 0} mapas)
          </div>

          {!parsed || parsed.maps.length === 0 ? (
            <div className="empty-preview-box">
              <HelpCircle size={32} opacity={0.4} />
              <p>Pegá las tablas de R6 Tracker a la izquierda para previsualizar los resultados normalizados.</p>
            </div>
          ) : (
            <>
              <div className="parsed-summary-bar">
                <span className="summary-badge">
                  <strong>{parsed.maps.length}</strong> Mapas Detectados
                </span>
                <span className="summary-op">
                  {selectedOperator} ({selectedSide === "attack" ? "ATK" : "DEF"})
                </span>
              </div>

              <div className="parsed-table-wrapper no-scrollbar">
                <table className="parsed-table">
                  <thead>
                    <tr>
                      <th>Mapa</th>
                      <th>Partidas</th>
                      <th>Winrate</th>
                      <th>V / D</th>
                      <th>K/D</th>
                      <th>HS %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.maps.map((stat, idx) => (
                      <tr key={idx}>
                        <td className="map-cell">
                          <strong>{stat.mapName}</strong>
                        </td>
                        <td>{stat.matchesOrRounds}</td>
                        <td>
                          <div className="winrate-cell">
                            <div className="wr-bar-bg">
                              <div
                                className="wr-bar-fill"
                                style={{
                                  width: `${Math.min(100, stat.winRate)}%`,
                                  background: stat.winRate >= 55 ? "#22c55e" : stat.winRate >= 48 ? "#3b82f6" : "#ef4444",
                                }}
                              />
                            </div>
                            <span>{stat.winRate}%</span>
                          </div>
                        </td>
                        <td className="wl-cell">
                          <span className="w-val">{stat.wins}W</span> / <span className="l-val">{stat.losses}L</span>
                        </td>
                        <td className={stat.kd >= 1.2 ? "kd-high" : stat.kd < 1.0 ? "kd-low" : ""}>
                          {stat.kd.toFixed(2)}
                        </td>
                        <td>{stat.headshotPct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="action-buttons-row">
                <button className="save-btn primary-action-btn" onClick={handleSaveToStorage}>
                  <CheckCircle2 size={16} /> Guardar en la App
                </button>
                <button className="copy-btn secondary-action-btn" onClick={handleCopyJSON}>
                  <Copy size={16} /> Copiar JSON
                </button>
              </div>

              {saveSuccessNotification && (
                <div className="notification-toast success">
                  <Check size={14} /> ¡Estadísticas guardadas exitosamente en la aplicación!
                </div>
              )}

              {copiedNotification && (
                <div className="notification-toast info">
                  <Copy size={14} /> JSON copiado al portapapeles.
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Lista de Registros Guardados en la App */}
      <div className="saved-stats-section" style={{ marginTop: 24 }}>
        <div className="pibe-section-title">
          <Database size={16} /> Base de Datos de Mapas Importados ({Object.keys(savedStats).length})
        </div>

        {Object.keys(savedStats).length === 0 ? (
          <p className="no-saved-text">No hay estadísticas guardadas aún. Importá tablas de tus jugadores para conservarlas.</p>
        ) : (
          <div className="saved-cards-grid">
            {Object.entries(savedStats).map(([key, entry]) => (
              <div key={key} className="saved-stat-card">
                <div className="saved-card-header">
                  <div>
                    <span className="saved-player-name">{entry.player}</span>
                    <span className={`saved-side-pill ${entry.side}`}>
                      {entry.side === "attack" ? "ATK" : "DEF"} — {entry.operator}
                    </span>
                  </div>
                  <button
                    className="delete-saved-btn"
                    onClick={() => handleDeleteSaved(key)}
                    title="Eliminar este registro"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="saved-card-info">
                  <span>{entry.maps.length} mapas registrados</span>
                  {entry.playlist && <span>• {entry.playlist}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
