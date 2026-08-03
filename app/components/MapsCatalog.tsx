"use client";

import { ChevronDown, ChevronUp, Dice5, MapPin, Search, ShieldAlert, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import { competitiveMaps, mapBombSites, maps, nonCompetitiveMaps } from "../../data/catalog";

type CategoryFilter = "all" | "competitive" | "nonCompetitive";

type MapsCatalogProps = {
  matchMap: string;
  onSelectMap: (mapName: string) => void;
  randomItem: <T>(items: readonly T[]) => T;
};

export function MapsCatalog({ matchMap, onSelectMap, randomItem }: MapsCatalogProps) {
  const [mapQuery, setMapQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [expandedMap, setExpandedMap] = useState<string | null>(null);

  const filteredMaps = useMemo(() => {
    let pool = maps;
    if (categoryFilter === "competitive") {
      pool = competitiveMaps as unknown as typeof maps;
    } else if (categoryFilter === "nonCompetitive") {
      pool = nonCompetitiveMaps as unknown as typeof maps;
    }

    if (!mapQuery.trim()) return pool;
    return pool.filter((m) => m.toLowerCase().includes(mapQuery.toLowerCase()));
  }, [categoryFilter, mapQuery]);

  return (
    <div className="maps-shell">
      {/* Search & Category Header */}
      <div className="catalog-controls">
        <div className="search-row">
          <Search size={15} color="var(--muted)" />
          <input
            type="text"
            placeholder="Buscar mapa (ej. Clubhouse, House...)"
            value={mapQuery}
            onChange={(e) => setMapQuery(e.target.value)}
          />
          <div className="maps-divider" />
          <button
            className="maps-random-btn"
            title="Elegir mapa competitivo al azar"
            onClick={() => onSelectMap(randomItem(competitiveMaps))}
          >
            <Dice5 size={14} /> Aleatorio
          </button>
        </div>

        {/* Category Tabs */}
        <div className="side-tabs">
          <button
            className={`side-tab tab-all ${categoryFilter === "all" ? "active" : ""}`}
            onClick={() => setCategoryFilter("all")}
          >
            Todos ({maps.length})
          </button>
          <button
            className={`side-tab tab-atk ${categoryFilter === "competitive" ? "active" : ""}`}
            onClick={() => setCategoryFilter("competitive")}
          >
            <Trophy size={13} /> Competitivos ({competitiveMaps.length})
          </button>
          <button
            className={`side-tab tab-def ${categoryFilter === "nonCompetitive" ? "active" : ""}`}
            onClick={() => setCategoryFilter("nonCompetitive")}
          >
            <ShieldAlert size={13} /> No competitivos ({nonCompetitiveMaps.length})
          </button>
        </div>
      </div>

      {/* Map Cards */}
      <div className="maps-list">
        {filteredMaps.map((mapName) => {
          const sites = mapBombSites[mapName] || [];
          const isCompetitive = sites.length > 0;
          const isSelected = matchMap === mapName;
          const isExpanded = expandedMap === mapName;

          return (
            <div
              key={mapName}
              className={`map-card ${isSelected ? "map-active" : ""} ${
                !isCompetitive ? "map-non-competitive" : ""
              }`}
            >
              <div className="map-card-header">
                <div className={`map-card-icon ${!isCompetitive ? "icon-disabled" : ""}`}>
                  <MapPin size={20} />
                </div>

                <div className="map-card-info">
                  <div className="map-card-name-row">
                    <span className="map-card-name">{mapName}</span>
                    {isCompetitive ? (
                      <span className="map-badge-comp">COMPETITIVO</span>
                    ) : (
                      <span className="map-badge-noncomp">NO COMPETITIVO</span>
                    )}
                  </div>
                  <div className="map-card-meta">
                    {isCompetitive
                      ? `${sites.length} zonas de bomba oficiales`
                      : "Sin zonas para ranked"}
                  </div>
                </div>

                <div className="map-card-actions">
                  {isCompetitive ? (
                    <button
                      className="map-select-btn"
                      onClick={() => onSelectMap(mapName)}
                    >
                      {isSelected ? "✓ Activo" : "Elegir"}
                    </button>
                  ) : (
                    <button
                      className="map-select-btn map-btn-disabled"
                      disabled
                      title="Este mapa no tiene zonas de bomba competitivas"
                    >
                      No elegible
                    </button>
                  )}

                  {isCompetitive && (
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

              {isExpanded && isCompetitive && (
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
