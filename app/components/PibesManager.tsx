"use client";

import { Check, Edit3, Shield, Swords, UserCheck, X } from "lucide-react";
import { useState } from "react";
import { attackers, defenders } from "../../data/catalog";
import type { PibeProfile } from "../../data/pibes";

type PibesManagerProps = {
  pibes: PibeProfile[];
  onUpdatePibe: (updatedPibe: PibeProfile) => void;
  onClose: () => void;
};

export function PibesManager({ pibes, onUpdatePibe, onClose }: PibesManagerProps) {
  const [editingPibeId, setEditingPibeId] = useState<string | null>(null);
  const [activeTabSide, setActiveTabSide] = useState<"attack" | "defense">("attack");

  const currentEditingPibe = pibes.find((p) => p.id === editingPibeId);

  const toggleMain = (pibe: PibeProfile, side: "attack" | "defense", opName: string) => {
    const list = side === "attack" ? [...pibe.attackMains] : [...pibe.defenseMains];
    const index = list.indexOf(opName);
    if (index >= 0) {
      list.splice(index, 1);
    } else {
      list.push(opName);
    }

    const updated: PibeProfile = {
      ...pibe,
      attackMains: side === "attack" ? list : pibe.attackMains,
      defenseMains: side === "defense" ? list : pibe.defenseMains,
    };

    onUpdatePibe(updated);
  };

  const updatePlaystyle = (pibe: PibeProfile, newPlaystyle: string) => {
    // playstyle is not a field on PibeProfile V2; silently skip for now
    onUpdatePibe({ ...pibe });
  };

  return (
    <div className="modal-backdrop glass">
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title-row">
            <UserCheck size={20} color="var(--atk)" />
            <h3>Personalizar "Los Pibes"</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <p className="modal-subtitle">
          Configurá los mains y estilos tácticos de tu squad para recomendaciones personalizadas.
        </p>

        {/* Player List */}
        <div className="pibes-list">
          {pibes.map((pibe) => {
            const isEditing = editingPibeId === pibe.id;
            return (
              <div key={pibe.id} className="pibe-card">
                <div className="pibe-card-header">
                  <div className="pibe-avatar-box">
                    <span>{pibe.displayName.slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div className="pibe-info">
                    <span className="pibe-name">{pibe.displayName}</span>
                    <input
                      type="text"
                      className="pibe-playstyle-input"
                      value={pibe.identity?.summary ?? ""}
                      onChange={(e) => updatePlaystyle(pibe, e.target.value)}
                      placeholder="Estilo de juego (ej. Entry Fragger)"
                    />
                  </div>
                  <button
                    className={`edit-mains-btn ${isEditing ? "active" : ""}`}
                    onClick={() => setEditingPibeId(isEditing ? null : pibe.id)}
                  >
                    <Edit3 size={14} />
                    <span>{isEditing ? "Cerrar" : "Mains"}</span>
                  </button>
                </div>

                <div className="pibe-mains-summary">
                  <span className="mains-label">
                    <Swords size={11} /> ATK ({pibe.attackMains.length}):
                  </span>
                  <span className="mains-values">
                    {pibe.attackMains.join(", ") || "Ninguno"}
                  </span>
                </div>
                <div className="pibe-mains-summary">
                  <span className="mains-label">
                    <Shield size={11} /> DEF ({pibe.defenseMains.length}):
                  </span>
                  <span className="mains-values">
                    {pibe.defenseMains.join(", ") || "Ninguno"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mains Selector Panel when a pibe is selected */}
        {currentEditingPibe && (
          <div className="mains-picker-panel">
            <div className="mains-picker-header">
              <span>Selección de Mains de <strong>{currentEditingPibe.displayName}</strong></span>
              <div className="picker-side-toggle">
                <button
                  className={activeTabSide === "attack" ? "active-atk" : ""}
                  onClick={() => setActiveTabSide("attack")}
                >
                  <Swords size={12} /> Atacantes
                </button>
                <button
                  className={activeTabSide === "defense" ? "active-def" : ""}
                  onClick={() => setActiveTabSide("defense")}
                >
                  <Shield size={12} /> Defensores
                </button>
              </div>
            </div>

            <div className="mains-grid">
              {(activeTabSide === "attack" ? attackers : defenders).map((op) => {
                const mainsList =
                  activeTabSide === "attack"
                    ? currentEditingPibe.attackMains
                    : currentEditingPibe.defenseMains;
                const isMain = mainsList.includes(op.name);

                return (
                  <button
                    key={op.name}
                    className={`main-chip ${isMain ? "chip-selected" : ""}`}
                    onClick={() => toggleMain(currentEditingPibe, activeTabSide, op.name)}
                  >
                    <span>{op.name}</span>
                    {isMain && <Check size={12} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <button className="primary-action-btn" style={{ marginTop: 16 }} onClick={onClose}>
          <Check size={18} /> Guardar y Volver
        </button>
      </div>
    </div>
  );
}
