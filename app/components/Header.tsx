"use client";

import { Crosshair } from "lucide-react";
import { maps, operators } from "../../data/catalog";

type Tab = "picker" | "operators" | "maps";

type HeaderProps = {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
};

export function Header({ activeTab, setActiveTab }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-brand">
        <span className="brand-icon">
          <Crosshair size={17} />
        </span>
        <span className="brand-title">
          R6<span className="brand-accent">·PICK</span>
        </span>
      </div>

      <nav className="desktop-nav">
        <button
          className={activeTab === "picker" ? "active" : ""}
          onClick={() => setActiveTab("picker")}
        >
          Partido
        </button>
        <button
          className={activeTab === "operators" ? "active" : ""}
          onClick={() => setActiveTab("operators")}
        >
          Agentes <span style={{ color: "var(--muted)", fontWeight: 400 }}>({operators.length})</span>
        </button>
        <button
          className={activeTab === "maps" ? "active" : ""}
          onClick={() => setActiveTab("maps")}
        >
          Mapas <span style={{ color: "var(--muted)", fontWeight: 400 }}>({maps.length})</span>
        </button>
      </nav>
    </header>
  );
}
