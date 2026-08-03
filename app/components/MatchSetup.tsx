"use client";

import { Dice5, MapPinned, Shield, Shuffle, Swords } from "lucide-react";
import { mapBombSites, maps, type Side } from "../../data/catalog";

type MatchSetupProps = {
  matchMap: string;
  setMatchMap: (map: string) => void;
  startingSide: Side;
  setStartingSide: (side: Side) => void;
  onStartMatch: () => void;
  randomItem: <T>(items: readonly T[]) => T;
};

export function MatchSetup({
  matchMap,
  setMatchMap,
  startingSide,
  setStartingSide,
  onStartMatch,
  randomItem,
}: MatchSetupProps) {
  return (
    <div className="tab-panel">
      {/* Map Selection */}
      <div className="card">
        <div className="card-section">
          <div className="setup-label">
            <span>
              <MapPinned
                size={12}
                style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }}
              />
              Mapa del Partido
            </span>
            <button
              className="label-action"
              onClick={() => setMatchMap(randomItem(maps))}
            >
              <Shuffle size={11} /> Aleatorio
            </button>
          </div>

          <div className="map-grid">
            {maps.map((m) => {
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
    </div>
  );
}
