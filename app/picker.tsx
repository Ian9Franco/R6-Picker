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

  // Current Round Operator
  const [currentOperator, setCurrentOperator] = useState<string>("");
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

  // Roll operator for current side
  const rollOperatorForCurrentSide = (sideToUse: Side) => {
    const pool = sideToUse === "attack" ? attackers : defenders;
    setCurrentOperator(randomItem(pool).name);
    setOpRoll((v) => v + 1);
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

    rollOperatorForCurrentSide(startingSide);

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

    const newLog: RoundLog = {
      roundNum: currentRoundNum,
      side: currentSide,
      operator: currentOperator,
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

      rollOperatorForCurrentSide(nextSide);

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
    rollOperatorForCurrentSide(last.side);
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
                  currentOperator={currentOperator}
                  opRoll={opRoll}
                  allMapSites={allMapSites}
                  lockedSites={lockedSites}
                  enemyLockedSites={enemyLockedSites}
                  selectedSiteName={selectedSiteName}
                  setSelectedSiteName={setSelectedSiteName}
                  history={history}
                  onRecordRound={recordRound}
                  onUndoLastRound={undoLastRound}
                  onRollOperator={() => rollOperatorForCurrentSide(currentSide)}
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
                currentOperator={currentOperator}
                onSelectOperator={(opName) => {
                  setCurrentOperator(opName);
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
