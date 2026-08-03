"use client";

import { Dice5, MapPin, Users } from "lucide-react";

type Tab = "picker" | "operators" | "maps";

type MobileTabBarProps = {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
};

export function MobileTabBar({ activeTab, setActiveTab }: MobileTabBarProps) {
  return (
    <nav className="mobile-tab-bar">
      <button
        className={`tab-btn ${activeTab === "picker" ? "active" : ""}`}
        onClick={() => setActiveTab("picker")}
      >
        <span className="tab-btn-icon">
          <Dice5 size={22} />
        </span>
        <span className="tab-btn-label">Partido</span>
      </button>

      <button
        className={`tab-btn ${activeTab === "operators" ? "active" : ""}`}
        onClick={() => setActiveTab("operators")}
      >
        <span className="tab-btn-icon">
          <Users size={22} />
        </span>
        <span className="tab-btn-label">Agentes</span>
      </button>

      <button
        className={`tab-btn ${activeTab === "maps" ? "active" : ""}`}
        onClick={() => setActiveTab("maps")}
      >
        <span className="tab-btn-icon">
          <MapPin size={22} />
        </span>
        <span className="tab-btn-label">Mapas</span>
      </button>
    </nav>
  );
}
