"use client";

import { ChevronDown, ChevronUp, Dice5, MapPin, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { mapBombSites, maps } from "../../data/catalog";

type MapsCatalogProps = {
  matchMap: string;
  onSelectMap: (mapName: string) => void;
  randomItem: <T>(items: readonly T[]) => T;
};

export function MapsCatalog({ matchMap, onSelectMap, randomItem }: MapsCatalogProps) {
  const [mapQuery, setMapQuery] = useState("");
  const [expandedMap, setExpandedMap] = useState<string | null>(null);

  const filteredMaps = useMemo(() => {
    if (!mapQuery.trim()) return maps;
    return maps.filter((m) => m.toLowerCase().includes(mapQuery.toLowerCase()));
  }, [mapQuery]);

  return (
    <div className="maps-shell">
      {/* Search bar */}
      <div className="maps-search-row">
        <Search size={15} color="var(--muted)" />
        <input
          type="text"
          placeholder="Buscar mapa..."
          value={mapQuery}
          onChange={(e) => setMapQuery(e.target.value)}
        />
        <div className="maps-divider" />
        <button
          className="maps-random-btn"
          onClick={() => onSelectMap(randomItem(maps))}
        >
          <Dice5 size={14} /> Aleatorio
        </button>
      </div>

      {/* Map Cards */}
      <div className="maps-list">
        {filteredMaps.map((mapName) => {
          const isSelected = matchMap === mapName;
          const isExpanded = expandedMap === mapName;
          const sites = mapBombSites[mapName] || [];

          return (
            <div
              key={mapName}
              className={`map-card ${isSelected ? "map-active" : ""}`}
            >
              <div className="map-card-header">
                <div className="map-card-icon">
                  <MapPin size={20} />
                </div>

                <div className="map-card-info">
                  <div className="map-card-name">{mapName}</div>
                  {sites.length > 0 && (
                    <div className="map-card-meta">
                      {sites.length} zonas de bomba
                    </div>
                  )}
                </div>

                <div className="map-card-actions">
                  <button
                    className="map-select-btn"
                    onClick={() => onSelectMap(mapName)}
                  >
                    {isSelected ? "✓ Activo" : "Elegir"}
                  </button>
                  {sites.length > 0 && (
                    <button
                      className="map-sites-toggle"
                      onClick={() => setExpandedMap(isExpanded ? null : mapName)}
                    >
                      {isExpanded ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {isExpanded && sites.length > 0 && (
                <div className="map-sites-panel">
                  <div className="sites-pills">
                    {sites.map((site, i) => (
                      <div key={i} className="site-pill">
                        <span className="site-pill-floor">{site.floor}</span>
                        <span className="site-pill-name">{site.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
