"use client";

import { Dice5, MapPin, User, Users } from "lucide-react";
import type { Tab } from "./Header";

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
          <Dice5 size={20} />
        </span>
        <span className="tab-btn-label">Partido</span>
      </button>

      <button
        className={`tab-btn ${activeTab === "operators" ? "active" : ""}`}
        onClick={() => setActiveTab("operators")}
      >
        <span className="tab-btn-icon">
          <Users size={20} />
        </span>
        <span className="tab-btn-label">Agentes</span>
      </button>

      <button
        className={`tab-btn ${activeTab === "maps" ? "active" : ""}`}
        onClick={() => setActiveTab("maps")}
      >
        <span className="tab-btn-icon">
          <MapPin size={20} />
        </span>
        <span className="tab-btn-label">Mapas</span>
      </button>

      <button
        className={`tab-btn ${activeTab === "pibes" ? "active" : ""}`}
        onClick={() => setActiveTab("pibes")}
      >
        <span className="tab-btn-icon">
          <User size={20} />
        </span>
        <span className="tab-btn-label">Los Pibes</span>
      </button>
    </nav>
  );
}
