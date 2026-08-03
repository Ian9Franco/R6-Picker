"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  attackers,
  defenders,
  mapBombSites,
  maps,
  type BombSite,
  type Side,
} from "../data/catalog";
import {
  DEFAULT_PIBES,
  getPibesRecommendations,
  getStandardRecommendations,
  type PibeProfile,
  type Recommendation,
} from "../data/pibes";
import { ActiveMatch } from "./components/ActiveMatch";
import { FinishedMatch } from "./components/FinishedMatch";
import { Header } from "./components/Header";
import { MapsCatalog } from "./components/MapsCatalog";
import { MatchSetup } from "./components/MatchSetup";
import { MobileTabBar } from "./components/MobileTabBar";
import { OperatorsCatalog } from "./components/OperatorsCatalog";

type Tab = "picker" | "operators" | "maps";

type RoundLog = {
  roundNum: number;
  side: Side;
  operator: string;
  bombSite?: BombSite;
  result: "win" | "loss";
};

const randomItem = <T,>(items: readonly T[]) =>
  items[Math.floor(Math.random() * items.length)];

export function Picker() {
  const [activeTab, setActiveTab] = useState<Tab>("picker");

  // Mode & Squad Setup
  const [mode, setMode] = useState<"default" | "pibes">("pibes");
  const [partySize, setPartySize] = useState<1 | 2 | 3>(3);
  const [pibes, setPibes] = useState<PibeProfile[]>(DEFAULT_PIBES);
  const [activePibeIds, setActivePibeIds] = useState<string[]>([
    "el_notorious",
    "chango_nocturno",
    "azusa_cooper09",
  ]);

  // Match State
  const [matchState, setMatchState] = useState<"setup" | "active" | "finished">("setup");
  const [matchMap, setMatchMap] = useState<string>("Clubhouse");
  const [startingSide, setStartingSide] = useState<Side>("attack");

  // Active Match Stats
  const [myScore, setMyScore] = useState<number>(0);
  const [opponentScore, setOpponentScore] = useState<number>(0);
  const [history, setHistory] = useState<RoundLog[]>([]);

  // Site Lockout States
  const [lockedSites, setLockedSites] = useState<string[]>([]);
  const [enemyLockedSites, setEnemyLockedSites] = useState<string[]>([]);
  const [selectedSiteName, setSelectedSiteName] = useState<string>("");

  // Current Round Recommendations
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [opRoll, setOpRoll] = useState<number>(0);

  const currentRoundNum = history.length + 1;
  const isOvertime = myScore >= 3 && opponentScore >= 3;

  // Calculate current round side based on R6 Siege Rules
  const currentSide: Side = useMemo(() => {
    if (!isOvertime) {
      return currentRoundNum <= 3
        ? startingSide
        : startingSide === "attack"
        ? "defense"
        : "attack";
    } else {
      const otRound = currentRoundNum - 6;
      return otRound % 2 !== 0
        ? startingSide
        : startingSide === "attack"
        ? "defense"
        : "attack";
    }
  }, [currentRoundNum, startingSide, isOvertime]);

  // All bomb sites for chosen map
  const allMapSites = useMemo(() => {
    return mapBombSites[matchMap] || [];
  }, [matchMap]);

  // Available (non-locked) sites for current side
  const availableSites = useMemo(() => {
    const currentLocks = currentSide === "defense" ? lockedSites : enemyLockedSites;
    return allMapSites.filter((s) => !currentLocks.includes(s.name));
  }, [allMapSites, currentSide, lockedSites, enemyLockedSites]);

  // Current BombSite object
  const currentBombSiteObj = useMemo(() => {
    return allMapSites.find((s) => s.name === selectedSiteName);
  }, [allMapSites, selectedSiteName]);

  // Active Pibes objects for Pibes mode
  const activePibeProfiles = useMemo(() => {
    return pibes
      .filter((p) => activePibeIds.includes(p.id))
      .slice(0, partySize);
  }, [pibes, activePibeIds, partySize]);

  // Update a Pibe profile
  const handleUpdatePibe = (updated: PibeProfile) => {
    setPibes((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  // Roll operator recommendations for current round side
  const rollRecommendationsForSide = (sideToUse: Side) => {
    let recs: Recommendation[];
    if (mode === "pibes") {
      recs = getPibesRecommendations(sideToUse, activePibeProfiles);
    } else {
      recs = getStandardRecommendations(sideToUse, partySize);
    }
    setRecommendations(recs);
    setOpRoll((v) => v + 1);
  };

  // Re-roll single player pick
  const rollSinglePlayer = (index: number) => {
    const pool = currentSide === "attack" ? attackers : defenders;
    const used = new Set(recommendations.map((r) => r.opName));
    const available = pool.filter((op) => !used.has(op.name));
    const fallback = available.length > 0 ? available : pool;
    const newOp = randomItem(fallback).name;

    setRecommendations((prev) =>
      prev.map((rec, i) => (i === index ? { ...rec, opName: newOp } : rec))
    );
  };

  // Roll available bomb site
  const rollAvailableSite = () => {
    const pool = availableSites.length > 0 ? availableSites : allMapSites;
    if (pool.length > 0) {
      setSelectedSiteName(randomItem(pool).name);
    }
  };

  // Start match
  const startMatch = () => {
    setMyScore(0);
    setOpponentScore(0);
    setHistory([]);
    setLockedSites([]);
    setEnemyLockedSites([]);
    setMatchState("active");

    rollRecommendationsForSide(startingSide);

    const firstPool = mapBombSites[matchMap] || [];
    if (firstPool.length > 0) {
      setSelectedSiteName(firstPool[0].name);
    } else {
      setSelectedSiteName("");
    }
  };

  // Record round result
  const recordRound = (result: "win" | "loss") => {
    const nextMyScore = result === "win" ? myScore + 1 : myScore;
    const nextOpScore = result === "loss" ? opponentScore + 1 : opponentScore;

    const opSummary = recommendations.map((r) => r.opName).join(", ");

    const newLog: RoundLog = {
      roundNum: currentRoundNum,
      side: currentSide,
      operator: opSummary,
      bombSite: currentBombSiteObj,
      result,
    };

    const nextHistory = [...history, newLog];
    setHistory(nextHistory);
    setMyScore(nextMyScore);
    setOpponentScore(nextOpScore);

    // Site Lockout Updates
    const isNowOvertime = nextMyScore >= 3 && nextOpScore >= 3;
    const wasOvertime = isOvertime;

    let nextLocked = [...lockedSites];
    let nextEnemyLocked = [...enemyLockedSites];

    if (isNowOvertime && !wasOvertime) {
      nextLocked = [];
      nextEnemyLocked = [];
    } else if (result === "win" && selectedSiteName) {
      if (currentSide === "defense") {
        if (!nextLocked.includes(selectedSiteName)) {
          nextLocked.push(selectedSiteName);
        }
      } else {
        if (!nextEnemyLocked.includes(selectedSiteName)) {
          nextEnemyLocked.push(selectedSiteName);
        }
      }
    }

    setLockedSites(nextLocked);
    setEnemyLockedSites(nextEnemyLocked);

    // Check Win/Loss conditions
    const isWinner =
      (nextMyScore === 4 && nextOpScore < 3) ||
      (nextMyScore >= 4 && nextMyScore - nextOpScore >= 2) ||
      nextMyScore === 5;

    const isLoser =
      (nextOpScore === 4 && nextMyScore < 3) ||
      (nextOpScore >= 4 && nextOpScore - nextOpScore >= 2) ||
      nextOpScore === 5;

    if (isWinner || isLoser) {
      setMatchState("finished");
    } else {
      const nextRoundNum = nextHistory.length + 1;
      const nextIsOvertime = nextMyScore >= 3 && nextOpScore >= 3;
      let nextSide: Side;
      if (!nextIsOvertime) {
        nextSide =
          nextRoundNum <= 3
            ? startingSide
            : startingSide === "attack"
            ? "defense"
            : "attack";
      } else {
        const otRound = nextRoundNum - 6;
        nextSide =
          otRound % 2 !== 0
            ? startingSide
            : startingSide === "attack"
            ? "defense"
            : "attack";
      }

      rollRecommendationsForSide(nextSide);

      const currentLocks = nextSide === "defense" ? nextLocked : nextEnemyLocked;
      const nextAvail = allMapSites.filter((s) => !currentLocks.includes(s.name));
      const pool = nextAvail.length > 0 ? nextAvail : allMapSites;
      if (pool.length > 0) {
        setSelectedSiteName(pool[0].name);
      }
    }
  };

  // Undo last round
  const undoLastRound = () => {
    if (history.length === 0) return;
    const remainingHistory = history.slice(0, -1);
    setHistory(remainingHistory);

    let myS = 0;
    let opS = 0;
    let recomputedLocked: string[] = [];
    let recomputedEnemyLocked: string[] = [];

    for (const log of remainingHistory) {
      if (log.result === "win") myS++;
      if (log.result === "loss") opS++;

      if (myS >= 3 && opS >= 3) {
        recomputedLocked = [];
        recomputedEnemyLocked = [];
      } else if (log.result === "win" && log.bombSite) {
        if (log.side === "defense") {
          if (!recomputedLocked.includes(log.bombSite.name)) {
            recomputedLocked.push(log.bombSite.name);
          }
        } else {
          if (!recomputedEnemyLocked.includes(log.bombSite.name)) {
            recomputedEnemyLocked.push(log.bombSite.name);
          }
        }
      }
    }

    setMyScore(myS);
    setOpponentScore(opS);
    setLockedSites(recomputedLocked);
    setEnemyLockedSites(recomputedEnemyLocked);

    if (matchState === "finished") {
      setMatchState("active");
    }

    const last = history[history.length - 1];
    rollRecommendationsForSide(last.side);
    if (last.bombSite) setSelectedSiteName(last.bombSite.name);
  };

  // Reset / New Match
  const resetMatch = () => {
    setMatchState("setup");
    setHistory([]);
    setMyScore(0);
    setOpponentScore(0);
    setLockedSites([]);
    setEnemyLockedSites([]);
    setSelectedSiteName("");
  };

  return (
    <div className="app-viewport">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="app-content">
        <AnimatePresence mode="wait">
          {activeTab === "picker" && (
            <motion.section
              key="tab-picker"
              className="tab-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {matchState === "setup" && (
                <MatchSetup
                  mode={mode}
                  setMode={setMode}
                  partySize={partySize}
                  setPartySize={setPartySize}
                  activePibeIds={activePibeIds}
                  setActivePibeIds={setActivePibeIds}
                  pibes={pibes}
                  onUpdatePibe={handleUpdatePibe}
                  matchMap={matchMap}
                  setMatchMap={setMatchMap}
                  startingSide={startingSide}
                  setStartingSide={setStartingSide}
                  onStartMatch={startMatch}
                  randomItem={randomItem}
                />
              )}

              {matchState === "active" && (
                <ActiveMatch
                  matchMap={matchMap}
                  myScore={myScore}
                  opponentScore={opponentScore}
                  currentRoundNum={currentRoundNum}
                  isOvertime={isOvertime}
                  currentSide={currentSide}
                  recommendations={recommendations}
                  opRoll={opRoll}
                  allMapSites={allMapSites}
                  lockedSites={lockedSites}
                  enemyLockedSites={enemyLockedSites}
                  selectedSiteName={selectedSiteName}
                  setSelectedSiteName={setSelectedSiteName}
                  history={history}
                  onRecordRound={recordRound}
                  onUndoLastRound={undoLastRound}
                  onRollOperator={() => rollRecommendationsForSide(currentSide)}
                  onRollSinglePlayer={rollSinglePlayer}
                  onRollAvailableSite={rollAvailableSite}
                />
              )}

              {matchState === "finished" && (
                <FinishedMatch
                  matchMap={matchMap}
                  myScore={myScore}
                  opponentScore={opponentScore}
                  history={history}
                  onResetMatch={resetMatch}
                  onUndoLastRound={undoLastRound}
                />
              )}
            </motion.section>
          )}

          {activeTab === "operators" && (
            <motion.section
              key="tab-operators"
              className="tab-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <OperatorsCatalog
                currentOperator={recommendations[0]?.opName ?? ""}
                onSelectOperator={(opName) => {
                  setRecommendations([
                    { playerLabel: "Tu Pick", opName, playstyle: "Manual" },
                  ]);
                  setActiveTab("picker");
                }}
              />
            </motion.section>
          )}

          {activeTab === "maps" && (
            <motion.section
              key="tab-maps"
              className="tab-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <MapsCatalog
                matchMap={matchMap}
                onSelectMap={(mapName) => {
                  setMatchMap(mapName);
                  setActiveTab("picker");
                }}
                randomItem={randomItem}
              />
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      <MobileTabBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
