"use client";

import { Dice5, MapPinned, Shield, Shuffle, Swords, UserCheck, Users } from "lucide-react";
import { competitiveMaps, mapBombSites, type Side } from "../../data/catalog";
import type { PibeProfile } from "../../data/pibes";
import { PibesManager } from "./PibesManager";
import { useState } from "react";

type MatchSetupProps = {
  mode: "default" | "pibes";
  setMode: (mode: "default" | "pibes") => void;
  partySize: 1 | 2 | 3;
  setPartySize: (size: 1 | 2 | 3) => void;
  activePibeIds: string[];
  setActivePibeIds: (ids: string[]) => void;
  pibes: PibeProfile[];
  onUpdatePibe: (updated: PibeProfile) => void;
  matchMap: string;
  setMatchMap: (map: string) => void;
  startingSide: Side;
  setStartingSide: (side: Side) => void;
  onStartMatch: () => void;
  randomItem: <T>(items: readonly T[]) => T;
};

export function MatchSetup({
  mode,
  setMode,
  partySize,
  setPartySize,
  activePibeIds,
  setActivePibeIds,
  pibes,
  onUpdatePibe,
  matchMap,
  setMatchMap,
  startingSide,
  setStartingSide,
  onStartMatch,
  randomItem,
}: MatchSetupProps) {
  // Hidden: PibesManager not exposed until DB is implemented
  const [showPibesManager, setShowPibesManager] = useState(false);

  const togglePibeActive = (pibeId: string) => {
    const isActive = activePibeIds.includes(pibeId);

    if (isActive) {
      // Can't deselect if it's the last one
      if (activePibeIds.length <= 1) return;
      setActivePibeIds(activePibeIds.filter((id) => id !== pibeId));
    } else {
      // Can't add more than partySize
      if (activePibeIds.length >= partySize) return;
      setActivePibeIds([...activePibeIds, pibeId]);
    }
  };

  return (
    <div className="tab-panel">
      {/* Game Mode & Squad Size Setup */}
      <div className="card">
        <div className="card-section">
          <div className="setup-label">
            <span>Modo de Recomendación</span>
          </div>
          <div className="segmented-control mode-toggle">
            <button
              className={mode === "default" ? "active" : ""}
              onClick={() => setMode("default")}
            >
              <Dice5 size={16} /> Modo Estándar
            </button>
            <button
              className={mode === "pibes" ? "active active-pibes" : ""}
              onClick={() => setMode("pibes")}
            >
              <UserCheck size={16} /> Modo "Los Pibes"
            </button>
          </div>

          <div className="setup-label" style={{ marginTop: 16 }}>
            <span>¿Cuántos juegan en Squad?</span>
          </div>
          <div className="party-selector">
            <button
              className={`party-card ${partySize === 1 ? "active" : ""}`}
              onClick={() => {
                setPartySize(1);
                setActivePibeIds([activePibeIds[0]]);
              }}
            >
              <Users size={18} />
              <span className="party-title">Solo</span>
              <span className="party-sub">1 Jugador</span>
            </button>

            <button
              className={`party-card ${partySize === 2 ? "active" : ""}`}
              onClick={() => {
                setPartySize(2);
                const next = activePibeIds.slice(0, 2);
                if (next.length < 2) {
                  const missing = pibes.find((p) => !next.includes(p.id))?.id;
                  if (missing) next.push(missing);
                }
                setActivePibeIds(next);
              }}
            >
              <Users size={18} />
              <span className="party-title">Dúo</span>
              <span className="party-sub">2 Jugadores</span>
            </button>

            <button
              className={`party-card ${partySize === 3 ? "active" : ""}`}
              onClick={() => {
                setPartySize(3);
                setActivePibeIds(pibes.map((p) => p.id));
              }}
            >
              <Users size={18} />
              <span className="party-title">Trío</span>
              <span className="party-sub">3 Jugadores</span>
            </button>
          </div>

          {/* Los Pibes Squad selection */}
          {mode === "pibes" && (
            <div className="pibes-setup-box">
              <div className="pibes-setup-header">
                <span className="setup-label" style={{ margin: 0 }}>
                  Pibes en la Partida ({activePibeIds.length}/{partySize}):
                </span>
                {/* Customize button hidden until DB is ready */}
              </div>

              <div className="pibes-chips-grid">
                {pibes.map((pibe) => {
                  const isActive = activePibeIds.includes(pibe.id);
                  const isDisabled = !isActive && activePibeIds.length >= partySize;

                  return (
                    <button
                      key={pibe.id}
                      className={`pibe-select-chip ${isActive ? "chip-active" : ""} ${isDisabled ? "chip-disabled" : ""}`}
                      onClick={() => togglePibeActive(pibe.id)}
                      disabled={isDisabled}
                      title={isDisabled ? `Ya tenés ${partySize} jugador${partySize > 1 ? "es" : ""} seleccionado${partySize > 1 ? "s" : ""}` : undefined}
                    >
                      <span className="pibe-chip-name">{pibe.name}</span>
                      <span className="pibe-chip-style">{pibe.playstyle}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map Selection */}
      <div className="card">
        <div className="card-section">
          <div className="setup-label">
            <span>
              <MapPinned
                size={12}
                style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }}
              />
              Mapa Competitivo ({competitiveMaps.length})
            </span>
            <button
              className="label-action"
              onClick={() => setMatchMap(randomItem(competitiveMaps))}
            >
              <Shuffle size={11} /> Aleatorio
            </button>
          </div>

          <div className="map-grid">
            {competitiveMaps.map((m) => {
              const siteCount = mapBombSites[m]?.length ?? 0;
              return (
                <button
                  key={m}
                  className={`map-grid-btn ${matchMap === m ? "selected" : ""}`}
                  onClick={() => setMatchMap(m)}
                >
                  <span>{m}</span>
                  {siteCount > 0 && (
                    <span className="map-site-count">{siteCount} zonas</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Side Selection */}
      <div className="card">
        <div className="card-section">
          <div className="setup-label">
            <span>Bando Inicial — Primeras 3 rondas</span>
          </div>
          <div className="side-selector">
            <button
              className={`side-card side-atk ${startingSide === "attack" ? "active" : ""}`}
              onClick={() => setStartingSide("attack")}
            >
              <div className="side-card-icon">
                <Swords size={26} />
              </div>
              <span className="side-card-title">Ataque</span>
              <span className="side-card-desc">Planta la bomba. Elimina al equipo enemigo.</span>
            </button>

            <button
              className={`side-card side-def ${startingSide === "defense" ? "active" : ""}`}
              onClick={() => setStartingSide("defense")}
            >
              <div className="side-card-icon">
                <Shield size={26} />
              </div>
              <span className="side-card-title">Defensa</span>
              <span className="side-card-desc">Protege la zona. Elige tu site de defensa.</span>
            </button>
          </div>
        </div>
      </div>

      {/* Start */}
      <button className="start-match-btn" onClick={onStartMatch}>
        <Dice5 size={20} />
        Iniciar en {matchMap}
      </button>

      {/* Hidden PibesManager modal until DB ready */}
      {showPibesManager && (
        <PibesManager
          pibes={pibes}
          onUpdatePibe={onUpdatePibe}
          onClose={() => setShowPibesManager(false)}
        />
      )}
    </div>
  );
}
