"use client";

import { Check, Search, Shield, Shuffle, Swords } from "lucide-react";
import { useMemo, useState } from "react";
import { attackers, defenders, operators, type Side } from "../../data/catalog";

type FilterSide = Side | "all";

type OperatorsCatalogProps = {
  currentOperator: string;
  onSelectOperator: (opName: string) => void;
};

// Map role strings to CSS class suffixes for coloring
function getRoleClass(role: string): string {
  if (role.includes("Anclas")) return "op-role-anchor";
  if (role.includes("Información") && !role.includes("caza")) return "op-role-info";
  if (role.includes("caza")) return "op-role-info";
  if (role.includes("Trampas")) return "op-role-trap";
  if (role.includes("Bloqueo")) return "op-role-block";
  if (role.includes("Antidispositivos")) return "op-role-anti";
  if (role.includes("Roamers")) return "op-role-roam";
  if (role.includes("dura")) return "op-role-breach-hard";
  if (role.includes("blanda")) return "op-role-breach-soft";
  if (role.includes("Entrada")) return "op-role-entry";
  if (role.includes("Control")) return "op-role-zone";
  if (role.includes("Escudos")) return "op-role-shield";
  if (role.includes("Ejecución")) return "op-role-exec";
  if (role.includes("Flexible")) return "op-role-flex";
  return "op-role-info";
}

export function OperatorsCatalog({
  currentOperator,
  onSelectOperator,
}: OperatorsCatalogProps) {
  const [opQuery, setOpQuery] = useState("");
  const [opSideFilter, setOpSideFilter] = useState<FilterSide>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const pool = useMemo(() => {
    if (opSideFilter === "attack") return attackers;
    if (opSideFilter === "defense") return defenders;
    return operators;
  }, [opSideFilter]);

  const availableRoles = useMemo(() => {
    const seen = new Set<string>();
    pool.forEach((op) => seen.add(op.role));
    return Array.from(seen);
  }, [pool]);

  const filteredOperators = useMemo(() => {
    let result = pool;
    if (roleFilter !== "all") {
      result = result.filter((op) => op.role === roleFilter);
    }
    if (opQuery.trim()) {
      const q = opQuery.toLowerCase();
      result = result.filter(
        (op) =>
          op.name.toLowerCase().includes(q) ||
          op.role.toLowerCase().includes(q) ||
          (op.desc && op.desc.toLowerCase().includes(q))
      );
    }
    return result;
  }, [pool, roleFilter, opQuery]);

  return (
    <div className="catalog-shell">
      {/* Controls */}
      <div className="catalog-controls">
        {/* Search */}
        <div className="search-row">
          <Search size={15} color="var(--muted)" />
          <input
            type="text"
            placeholder="Buscar por nombre, rol o habilidad..."
            value={opQuery}
            onChange={(e) => setOpQuery(e.target.value)}
          />
        </div>

        {/* Side Tabs */}
        <div className="side-tabs">
          <button
            className={`side-tab tab-all ${opSideFilter === "all" ? "active" : ""}`}
            onClick={() => { setOpSideFilter("all"); setRoleFilter("all"); }}
          >
            Todos ({operators.length})
          </button>
          <button
            className={`side-tab tab-atk ${opSideFilter === "attack" ? "active" : ""}`}
            onClick={() => { setOpSideFilter("attack"); setRoleFilter("all"); }}
          >
            <Swords size={13} /> ATK ({attackers.length})
          </button>
          <button
            className={`side-tab tab-def ${opSideFilter === "defense" ? "active" : ""}`}
            onClick={() => { setOpSideFilter("defense"); setRoleFilter("all"); }}
          >
            <Shield size={13} /> DEF ({defenders.length})
          </button>
        </div>

        {/* Role Chips */}
        <div className="role-filter-strip">
          <button
            data-role="all"
            className={`role-chip ${roleFilter === "all" ? "active-all" : ""}`}
            onClick={() => setRoleFilter("all")}
          >
            Todos
          </button>
          {availableRoles.map((role) => (
            <button
              key={role}
              data-role={role}
              className={`role-chip ${roleFilter === role ? "active" : ""}`}
              onClick={() => setRoleFilter(role)}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Operator Cards */}
      <div className="ops-grid">
        {filteredOperators.map((item) => {
          const isSelected = currentOperator === item.name;
          const isAtk = item.side === "attack";
          const roleClass = getRoleClass(item.role);

          return (
            <button
              key={item.name}
              className={`op-card ${isAtk ? "atk-op" : "def-op"} ${isSelected ? "op-selected" : ""}`}
              onClick={() => onSelectOperator(item.name)}
            >
              <div className="op-card-stripe" />
              <div className="op-card-body">
                <div className="op-card-top">
                  <div className="op-monogram">
                    {item.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="op-card-meta">
                    <span className="op-card-name">{item.name}</span>
                    <span className={`op-card-role ${roleClass}`}>{item.role}</span>
                  </div>
                </div>
                {item.desc && (
                  <p className="op-card-desc">{item.desc}</p>
                )}
              </div>
              {isSelected && (
                <div className="op-selected-badge">
                  <Check size={11} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
