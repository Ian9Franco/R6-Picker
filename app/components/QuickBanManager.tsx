"use client";

import React, { useState, useMemo } from "react";
import { Ban, Shield, Swords, RotateCcw, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Side } from "@/app/types";
import { attackers, defenders } from "../../data/catalog";
import { OperatorIcon } from "./OperatorIcon";

export type QuickBanManagerProps = {
  currentSide: Side;
  ourBans: string[];
  enemyBans: string[];
  onToggleBan: (side: "our" | "enemy", opName: string) => void;
  onClearBans?: () => void;
};

export function QuickBanManager({
  currentSide,
  ourBans,
  enemyBans,
  onToggleBan,
  onClearBans,
}: QuickBanManagerProps) {
  const [banTargetSide, setBanTargetSide] = useState<"our" | "enemy">("our");
  const [banOpCategory, setBanOpCategory] = useState<"auto" | "attack" | "defense">("auto");
  const [banSearchQuery, setBanSearchQuery] = useState("");

  const activeBanSide: Side =
    banOpCategory === "auto"
      ? currentSide === "defense"
        ? "attack"
        : "defense"
      : banOpCategory;

  const quickMetaOps = useMemo(() => {
    const list = activeBanSide === "attack" ? attackers : defenders;
    if (banSearchQuery.trim().length > 0) {
      const q = banSearchQuery.toLowerCase();
      return list.filter(
        (op) =>
          op.name.toLowerCase().includes(q) ||
          op.role.toLowerCase().includes(q)
      );
    }
    const topNames =
      activeBanSide === "attack"
        ? ["Thatcher", "Jackal", "Dokkaebi", "Ying", "Deimos", "Montagne", "Fuze", "Nomad", "Thermite", "Ram", "Ace", "Twitch"]
        : ["Fenrir", "Solis", "Azami", "Kaid", "Mira", "Tubarao", "Valkyrie", "Clash", "Kapkan", "Caveira", "Lesion", "Mute"];

    return list
      .filter((op) => topNames.includes(op.name))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [activeBanSide, banSearchQuery]);

  /* ── Shared style tokens ───────────────────────────────────────── */
  const s = {
    container: {
      background: "var(--surface-1)",
      border: "1px solid var(--border)",
      borderRadius: 14,
      padding: "16px 18px",
      display: "flex",
      flexDirection: "column" as const,
      gap: 14,
    },
    /* Header row */
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap" as const,
      gap: 8,
    },
    sectionLabel: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontSize: 11,
      fontWeight: 800,
      textTransform: "uppercase" as const,
      letterSpacing: "0.07em",
      color: "var(--white)",
    },
    hint: {
      fontSize: 11,
      color: "var(--muted-bright)",
      marginLeft: 8,
      fontStyle: "italic" as const,
    },
    clearBtn: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "4px 10px",
      background: "rgba(239,68,68,0.1)",
      border: "1px solid rgba(239,68,68,0.3)",
      borderRadius: 7,
      color: "#fca5a5",
      fontSize: 11,
      fontWeight: 700,
      cursor: "pointer",
    },
    /* Card display grid */
    cardsGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 10,
    },
    card: (active: boolean, isEnemy: boolean) => ({
      background: active
        ? isEnemy
          ? "rgba(239,68,68,0.07)"
          : "rgba(30,127,255,0.07)"
        : "var(--surface-2)",
      border: `1px solid ${
        active
          ? isEnemy
            ? "rgba(239,68,68,0.45)"
            : "rgba(30,127,255,0.45)"
          : "var(--border)"
      }`,
      borderRadius: 10,
      padding: "10px 12px",
      cursor: "pointer",
      transition: "all 0.18s ease",
      display: "flex",
      flexDirection: "column" as const,
      gap: 8,
    }),
    cardTitle: (isEnemy: boolean) => ({
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 6,
      fontSize: 11,
      fontWeight: 800,
      textTransform: "uppercase" as const,
      letterSpacing: "0.06em",
      color: isEnemy ? "var(--atk)" : "var(--def)",
    }),
    activePill: (isEnemy: boolean) => ({
      fontSize: 9,
      fontWeight: 800,
      padding: "2px 7px",
      borderRadius: 6,
      background: isEnemy ? "rgba(239,68,68,0.2)" : "rgba(30,127,255,0.2)",
      border: `1px solid ${isEnemy ? "rgba(239,68,68,0.45)" : "rgba(30,127,255,0.45)"}`,
      color: isEnemy ? "#fca5a5" : "#60a5fa",
      textTransform: "uppercase" as const,
      letterSpacing: "0.04em",
    }),
    chipsRow: {
      display: "flex",
      flexWrap: "wrap" as const,
      gap: 5,
      minHeight: 28,
      alignItems: "center",
    },
    chip: (isEnemy: boolean) => ({
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "3px 8px 3px 5px",
      background: isEnemy ? "rgba(239,68,68,0.12)" : "rgba(30,127,255,0.12)",
      border: `1px solid ${isEnemy ? "rgba(239,68,68,0.3)" : "rgba(30,127,255,0.3)"}`,
      borderRadius: 6,
      fontSize: 12,
      fontWeight: 700,
      color: isEnemy ? "#fca5a5" : "#93c5fd",
    }),
    chipRemove: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 15,
      height: 15,
      borderRadius: "50%",
      background: "rgba(255,255,255,0.12)",
      fontSize: 13,
      lineHeight: 1,
      cursor: "pointer",
      marginLeft: 2,
    },
    emptyText: {
      fontSize: 11,
      color: "var(--muted)",
      fontStyle: "italic" as const,
    },
    /* Controls panel */
    controls: {
      background: "var(--surface-2)",
      border: "1px solid var(--border)",
      borderRadius: 10,
      padding: "12px 14px",
      display: "flex",
      flexDirection: "column" as const,
      gap: 10,
    },
    toolbar: {
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap" as const,
      gap: 10,
    },
    toolbarGroup: {
      display: "flex",
      alignItems: "center",
      gap: 5,
    },
    toolbarLabel: {
      fontSize: 10,
      fontWeight: 800,
      textTransform: "uppercase" as const,
      letterSpacing: "0.06em",
      color: "var(--muted-bright)",
      whiteSpace: "nowrap" as const,
    },
    tabBtn: (active: boolean, color?: string) => ({
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "5px 11px",
      background: active
        ? color === "red"
          ? "rgba(239,68,68,0.18)"
          : "rgba(30,127,255,0.18)"
        : "rgba(255,255,255,0.04)",
      border: `1px solid ${
        active
          ? color === "red"
            ? "rgba(239,68,68,0.45)"
            : "rgba(30,127,255,0.45)"
          : "var(--border)"
      }`,
      borderRadius: 7,
      fontSize: 11,
      fontWeight: 700,
      color: active
        ? color === "red"
          ? "#fca5a5"
          : "#93c5fd"
        : "var(--muted-bright)",
      cursor: "pointer",
      transition: "all 0.15s ease",
    }),
    search: {
      flex: "1 1 140px",
      background: "var(--surface-1)",
      border: "1px solid var(--border-mid)",
      borderRadius: 7,
      padding: "6px 10px",
      color: "var(--white)",
      fontSize: 12,
      outline: "none",
      minWidth: 0,
    },
    /* Operator grid */
    opsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
      gap: 6,
    },
    opTile: (isOur: boolean, isEnemy: boolean) => ({
      display: "flex",
      alignItems: "center",
      gap: 7,
      padding: "7px 10px",
      background: isOur
        ? "rgba(30,127,255,0.14)"
        : isEnemy
        ? "rgba(239,68,68,0.14)"
        : "rgba(255,255,255,0.04)",
      border: `1px solid ${
        isOur
          ? "rgba(30,127,255,0.4)"
          : isEnemy
          ? "rgba(239,68,68,0.4)"
          : "var(--border)"
      }`,
      borderRadius: 8,
      cursor: "pointer",
      transition: "all 0.13s ease",
      width: "100%",
      textAlign: "left" as const,
      position: "relative" as const,
    }),
    opName: {
      fontSize: 12,
      fontWeight: 700,
      color: "var(--white)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap" as const,
      flex: 1,
    },
    opTag: (isEnemy: boolean) => ({
      fontSize: 8,
      fontWeight: 900,
      padding: "1px 4px",
      borderRadius: 3,
      background: isEnemy ? "rgba(239,68,68,0.35)" : "rgba(30,127,255,0.35)",
      color: isEnemy ? "#fca5a5" : "#93c5fd",
      letterSpacing: "0.05em",
      flexShrink: 0,
    }),
  };

  return (
    <div style={s.container}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={s.header}>
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
          <span style={s.sectionLabel}>
            <Ban size={13} /> Bans en Partida
          </span>
          <span style={s.hint}>
            {currentSide === "defense"
              ? "Defendiendo: priorizá banear Atacantes rivales"
              : "Atacando: priorizá banear Defensores rivales"}
          </span>
        </div>
        {onClearBans && (ourBans.length > 0 || enemyBans.length > 0) && (
          <button type="button" style={s.clearBtn} onClick={onClearBans} title="Limpiar bans (Prórroga / Reset)">
            <RotateCcw size={11} /> Limpiar Bans
          </button>
        )}
      </div>

      {/* ── Ban Display Cards ───────────────────────────────────────── */}
      <div style={s.cardsGrid}>
        {/* Nuestros Bans */}
        <div style={s.card(banTargetSide === "our", false)} onClick={() => setBanTargetSide("our")}>
          <div style={s.cardTitle(false)}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Shield size={11} /> Nuestros Bans ({ourBans.length})
            </span>
            {banTargetSide === "our" && <span style={s.activePill(false)}>Target</span>}
          </div>
          <div style={s.chipsRow}>
            {ourBans.length === 0 ? (
              <span style={s.emptyText}>Toca un operador abajo para banear</span>
            ) : (
              ourBans.map((op) => (
                <span key={op} style={s.chip(false)}>
                  <OperatorIcon name={op} size={16} />
                  <span>{op}</span>
                  <span style={s.chipRemove} onClick={(e) => { e.stopPropagation(); onToggleBan("our", op); }} title="Quitar Ban">×</span>
                </span>
              ))
            )}
          </div>
        </div>

        {/* Bans Rivales */}
        <div style={s.card(banTargetSide === "enemy", true)} onClick={() => setBanTargetSide("enemy")}>
          <div style={s.cardTitle(true)}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Swords size={11} /> Bans Rivales ({enemyBans.length})
            </span>
            {banTargetSide === "enemy" && <span style={s.activePill(true)}>Target</span>}
          </div>
          <div style={s.chipsRow}>
            {enemyBans.length === 0 ? (
              <span style={s.emptyText}>Toca un operador abajo para registrar</span>
            ) : (
              enemyBans.map((op) => (
                <span key={op} style={s.chip(true)}>
                  <OperatorIcon name={op} size={16} />
                  <span>{op}</span>
                  <span style={s.chipRemove} onClick={(e) => { e.stopPropagation(); onToggleBan("enemy", op); }} title="Quitar Ban">×</span>
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Controls Panel ─────────────────────────────────────────── */}
      <div style={s.controls}>
        {/* Toolbar */}
        <div style={s.toolbar}>
          {/* Target: Nosotros / Rivales */}
          <div style={s.toolbarGroup}>
            <span style={s.toolbarLabel}>Banear para:</span>
            <button type="button" style={s.tabBtn(banTargetSide === "our", "blue")} onClick={() => setBanTargetSide("our")}>
              <Shield size={10} /> Nosotros
            </button>
            <button type="button" style={s.tabBtn(banTargetSide === "enemy", "red")} onClick={() => setBanTargetSide("enemy")}>
              <Swords size={10} /> Rivales
            </button>
          </div>

          {/* Category: Atacantes / Defensores */}
          <div style={s.toolbarGroup}>
            <button type="button" style={s.tabBtn(activeBanSide === "attack", "red")} onClick={() => setBanOpCategory("attack")}>
              ⚔️ Atk
            </button>
            <button type="button" style={s.tabBtn(activeBanSide === "defense", "blue")} onClick={() => setBanOpCategory("defense")}>
              🛡️ Def
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            style={s.search}
            placeholder="Buscar operador..."
            value={banSearchQuery}
            onChange={(e) => setBanSearchQuery(e.target.value)}
          />
        </div>

        {/* Operator Grid */}
        <div style={s.opsGrid}>
          <AnimatePresence mode="popLayout">
            {quickMetaOps.map((op) => {
              const isOur = ourBans.includes(op.name);
              const isEnemy = enemyBans.includes(op.name);
              return (
                <motion.button
                  key={op.name}
                  type="button"
                  style={s.opTile(isOur, isEnemy)}
                  onClick={() => onToggleBan(banTargetSide, op.name)}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.88 }}
                  transition={{ duration: 0.12 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  title={op.role}
                >
                  <OperatorIcon name={op.name} size={20} />
                  <span style={s.opName}>{op.name}</span>
                  {isOur && <span style={s.opTag(false)}>NOS</span>}
                  {isEnemy && <span style={s.opTag(true)}>RIV</span>}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
