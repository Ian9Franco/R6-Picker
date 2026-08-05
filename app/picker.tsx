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
  getAgnosticRecommendations,
  getPibesRecommendations,
  normalizeOperator,
  type PibeProfile,
  type PlayerPick,
  type RecommendationEngineOutput,
  type SquadRecommendation,
} from "../data/pibes";
import { ActiveMatch } from "./components/ActiveMatch";
import { FinishedMatch } from "./components/FinishedMatch";
import { Header, type Tab } from "./components/Header";
import { MapsCatalog } from "./components/MapsCatalog";
import { MatchSetup } from "./components/MatchSetup";
import { MobileTabBar } from "./components/MobileTabBar";
import { OperatorsCatalog } from "./components/OperatorsCatalog";
import { PibesView } from "./components/PibesView";

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
  const [mode, setMode] = useState<"default" | "pibes">("default");
  const [partySize, setPartySize] = useState<2 | 3>(3);
  const [pibes, setPibes] = useState<PibeProfile[]>(DEFAULT_PIBES);
  // Active pibes selected by default for 3-player squad
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

  // Bans State
  const [ourBans, setOurBans] = useState<string[]>([]);
  const [enemyBans, setEnemyBans] = useState<string[]>([]);

  // Site Lockout States
  const [lockedSites, setLockedSites] = useState<string[]>([]);
  const [enemyLockedSites, setEnemyLockedSites] = useState<string[]>([]);
  const [selectedSiteName, setSelectedSiteName] = useState<string>("");

  // Current Round Recommendations Engine Output
  const [engineOutput, setEngineOutput] = useState<RecommendationEngineOutput | null>(null);
  const [activeVariantTab, setActiveVariantTab] = useState<"primary" | "safe" | "breathing" | "experimental">("primary");
  const [standardRecs, setStandardRecs] = useState<PlayerPick[]>([]);
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

  // Active Squad Recommendation computed from activeVariantTab
  const currentSquadRecommendation: SquadRecommendation | undefined = useMemo(() => {
    if (!engineOutput) return undefined;
    if (activeVariantTab === "safe") return engineOutput.safeVariant;
    if (activeVariantTab === "breathing" && engineOutput.breathingVariant) {
      return engineOutput.breathingVariant;
    }
    if (activeVariantTab === "experimental" && engineOutput.experimentalVariant) {
      return engineOutput.experimentalVariant;
    }
    return engineOutput.primary;
  }, [engineOutput, activeVariantTab]);

  // Picks displayed in UI
  const displayedRecommendations: PlayerPick[] = useMemo(() => {
    const picks = currentSquadRecommendation
      ? currentSquadRecommendation.picks
      : standardRecs;
    const operatorKey = (value: string) => value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
    const allowed = new Set((currentSide === "attack" ? attackers : defenders).map((op) => operatorKey(op.name)));

    return picks.map((pick) => {
      const backupKey = pick.backupOpName ? operatorKey(pick.backupOpName) : "";
      const validBackup = backupKey && allowed.has(backupKey) && backupKey !== operatorKey(pick.opName);
      return validBackup ? pick : { ...pick, backupOpName: undefined };
    });
  }, [currentSquadRecommendation, standardRecs, currentSide]);

  // Update a Pibe profile
  const handleUpdatePibe = (updated: PibeProfile) => {
    setPibes((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  // Tactical Site Routes & Drone Observations State
  const [selectedRouteId, setSelectedRouteId] = useState<string>("auto");
  const [observedDefenseIds, setObservedDefenseIds] = useState<string[]>([]);

  const handleSelectRoute = (routeId: string) => {
    setSelectedRouteId(routeId);
    rollRecommendationsForSide(currentSide, currentBombSiteObj, routeId, observedDefenseIds);
  };

  const handleToggleObservedDefense = (defId: string) => {
    const next = observedDefenseIds.includes(defId)
      ? observedDefenseIds.filter((id) => id !== defId)
      : [...observedDefenseIds, defId];
    setObservedDefenseIds(next);
    rollRecommendationsForSide(currentSide, currentBombSiteObj, selectedRouteId, next);
  };

  // Roll operator recommendations for current round side
  const rollRecommendationsForSide = (
    sideToUse: Side,
    siteOverride?: BombSite,
    routeIdOverride?: string,
    obsIdsOverride?: string[]
  ) => {
    const site = siteOverride ?? currentBombSiteObj;
    const routeToUse = routeIdOverride ?? selectedRouteId;
    const obsToUse = obsIdsOverride ?? observedDefenseIds;

    const nextRoll = opRoll + 1;
    const allBans = [...ourBans, ...enemyBans];
    if (mode === "pibes" && activePibeProfiles.length > 0) {
      const output = getPibesRecommendations(
        sideToUse,
        activePibeProfiles,
        site,
        currentRoundNum,
        matchMap,
        allBans,
        routeToUse,
        obsToUse,
        nextRoll
      );
      setEngineOutput(output);
    } else {
      const output = getAgnosticRecommendations(
        sideToUse,
        partySize,
        site,
        currentRoundNum,
        matchMap,
        routeToUse,
        obsToUse,
        nextRoll
      );
      setEngineOutput(output);
      setStandardRecs([]);
    }
    setOpRoll(nextRoll);
  };

  const rollTacticalVariant = () => {
    rollRecommendationsForSide(currentSide);
  };

  const selectSiteAndReplan = (siteName: string) => {
    const site = allMapSites.find((candidate) => candidate.name === siteName);
    setSelectedSiteName(siteName);
    setSelectedRouteId("auto");
    setObservedDefenseIds([]);
    setActiveVariantTab("primary");
    rollRecommendationsForSide(currentSide, site, "auto", []);
  };

  // Toggle Ban handler
  const toggleBan = (side: "our" | "enemy", opName: string) => {
    let nextOur = [...ourBans];
    let nextEnemy = [...enemyBans];

    if (side === "our") {
      if (nextOur.includes(opName)) {
        nextOur = nextOur.filter((o) => o !== opName);
      } else {
        nextOur.push(opName);
      }
    } else {
      if (nextEnemy.includes(opName)) {
        nextEnemy = nextEnemy.filter((o) => o !== opName);
      } else {
        nextEnemy.push(opName);
      }
    }

    setOurBans(nextOur);
    setEnemyBans(nextEnemy);

    // Immediately recalculate recommendations with the updated ban set
    const updatedBans = [...nextOur, ...nextEnemy];
    if (mode === "pibes" && activePibeProfiles.length > 0) {
      const output = getPibesRecommendations(
        currentSide,
        activePibeProfiles,
        currentBombSiteObj,
        currentRoundNum,
        matchMap,
        updatedBans,
        selectedRouteId,
        observedDefenseIds,
        opRoll
      );
      setEngineOutput(output);
    }
  };

  // Re-roll single player pick
  const rollSinglePlayer = (index: number) => {
    const pool = currentSide === "attack" ? attackers : defenders;
    const operatorKey = (value: string) => value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");

    const allBans = new Set([...ourBans, ...enemyBans].map(operatorKey));
    const currentRecs = displayedRecommendations;
    const used = new Set(
      currentRecs
        .filter((_, i) => i !== index)
        .map((r) => operatorKey(r.opName))
    );

    const available = pool.filter((op) => {
      const key = operatorKey(op.name);
      return !used.has(key) && !allBans.has(key) && key !== operatorKey(currentRecs[index]?.opName || "");
    });

    const fallback = available.length > 0 ? available : pool.filter((op) => !allBans.has(operatorKey(op.name)));
    if (fallback.length === 0) return;

    const newOp = randomItem(fallback).name;
    const newProfile = normalizeOperator(newOp);

    if (engineOutput) {
      setEngineOutput((prev) => {
        if (!prev) return null;
        const updatePicks = (variant: SquadRecommendation): SquadRecommendation => {
          const updatedPicks = variant.picks.map((rec, i) =>
            i === index
              ? {
                  ...rec,
                  opName: newOp,
                  backupOpName: undefined,
                  operatorProfile: newProfile,
                  explanation: {
                    positive: [`Re-sorteado individualmente para ${rec.playerLabel}`],
                    negative: [],
                    warnings: [],
                  },
                }
              : rec
          );
          return { ...variant, picks: updatedPicks };
        };

        if (activeVariantTab === "safe") return { ...prev, safeVariant: updatePicks(prev.safeVariant) };
        if (activeVariantTab === "breathing" && prev.breathingVariant) return { ...prev, breathingVariant: updatePicks(prev.breathingVariant) };
        if (activeVariantTab === "experimental" && prev.experimentalVariant) return { ...prev, experimentalVariant: updatePicks(prev.experimentalVariant) };
        return { ...prev, primary: updatePicks(prev.primary) };
      });
    }
  };

  // Swap specific player operator to a selected alternative
  const handleSelectAlternative = (index: number, newOpName: string) => {
    const newProfile = normalizeOperator(newOpName);
    if (engineOutput) {
      setEngineOutput((prev) => {
        if (!prev) return null;
        const updatePicks = (variant: SquadRecommendation): SquadRecommendation => {
          const updatedPicks = variant.picks.map((rec, i) => {
            if (i !== index) return rec;
            const remainingAlts = (rec.alternativeOps || []).filter(
              (name) => name.toLowerCase() !== newOpName.toLowerCase()
            );
            if (!remainingAlts.includes(rec.opName)) {
              remainingAlts.unshift(rec.opName);
            }
            return {
              ...rec,
              opName: newOpName,
              alternativeOps: remainingAlts.slice(0, 3),
              backupOpName: undefined,
              operatorProfile: newProfile,
              explanation: {
                positive: [`Variante elegida manualmente para ${rec.playerLabel}`],
                negative: [],
                warnings: [],
              },
            };
          });
          return { ...variant, picks: updatedPicks };
        };

        if (activeVariantTab === "safe") return { ...prev, safeVariant: updatePicks(prev.safeVariant) };
        if (activeVariantTab === "breathing" && prev.breathingVariant) return { ...prev, breathingVariant: updatePicks(prev.breathingVariant) };
        if (activeVariantTab === "experimental" && prev.experimentalVariant) return { ...prev, experimentalVariant: updatePicks(prev.experimentalVariant) };
        return { ...prev, primary: updatePicks(prev.primary) };
      });
    } else {
      setStandardRecs((prev) =>
        prev.map((rec, i) => (i === index ? { ...rec, opName: newOpName, backupOpName: undefined, operatorProfile: newProfile } : rec))
      );
    }
  };

  // Roll available bomb site
  const rollAvailableSite = () => {
    const pool = availableSites.length > 0 ? availableSites : allMapSites;
    if (pool.length > 0) {
      selectSiteAndReplan(randomItem(pool).name);
    }
  };

  // Start match
  const startMatch = () => {
    setMyScore(0);
    setOpponentScore(0);
    setHistory([]);
    setLockedSites([]);
    setEnemyLockedSites([]);
    setActiveVariantTab("primary");
    setMatchState("active");

    const firstPool = mapBombSites[matchMap] || [];
    const firstSite = firstPool[0] ?? undefined;
    // Pass firstSite directly since state hasn't updated yet
    rollRecommendationsForSide(startingSide, firstSite);

    if (firstSite) {
      setSelectedSiteName(firstSite.name);
    } else {
      setSelectedSiteName("");
    }
  };

  // Record round result
  const recordRound = (result: "win" | "loss") => {
    const nextMyScore = result === "win" ? myScore + 1 : myScore;
    const nextOpScore = result === "loss" ? opponentScore + 1 : opponentScore;

    const opSummary = displayedRecommendations.map((r) => r.opName).join(", ");

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

      const currentLocks = nextSide === "defense" ? nextLocked : nextEnemyLocked;
      const nextAvail = allMapSites.filter((s) => !currentLocks.includes(s.name));
      const pool = nextAvail.length > 0 ? nextAvail : allMapSites;
      setActiveVariantTab("primary");
      if (pool.length > 0) {
        const nextSite = pool[0];
        setSelectedSiteName(nextSite.name);
        setSelectedRouteId("auto");
        setObservedDefenseIds([]);
        rollRecommendationsForSide(nextSide, nextSite, "auto", []);
      } else {
        rollRecommendationsForSide(nextSide, undefined, "auto", []);
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
    setActiveVariantTab("primary");
    rollRecommendationsForSide(last.side, last.bombSite, "auto", []);
    if (last.bombSite) setSelectedSiteName(last.bombSite.name);
    setSelectedRouteId("auto");
    setObservedDefenseIds([]);
  };

  // Reset / New Match
  const resetMatch = () => {
    setMatchState("setup");
    setHistory([]);
    setMyScore(0);
    setOpponentScore(0);
    setLockedSites([]);
    setEnemyLockedSites([]);
    setOurBans([]);
    setEnemyBans([]);
    setSelectedSiteName("");
    setActiveVariantTab("primary");
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
                  activePibeProfiles={activePibeProfiles}
                  myScore={myScore}
                  opponentScore={opponentScore}
                  currentRoundNum={currentRoundNum}
                  isOvertime={isOvertime}
                  currentSide={currentSide}
                  personalized={mode === "pibes"}
                  ourBans={ourBans}
                  enemyBans={enemyBans}
                  onToggleBan={toggleBan}
                  selectedRouteId={selectedRouteId}
                  setSelectedRouteId={handleSelectRoute}
                  observedDefenseIds={observedDefenseIds}
                  onToggleObservedDefense={handleToggleObservedDefense}
                  recommendations={displayedRecommendations}
                  squadRecommendation={currentSquadRecommendation}
                  engineOutput={engineOutput}
                  activeVariantTab={activeVariantTab}
                  setActiveVariantTab={setActiveVariantTab}
                  opRoll={opRoll}
                  allMapSites={allMapSites}
                  lockedSites={lockedSites}
                  enemyLockedSites={enemyLockedSites}
                  selectedSiteName={selectedSiteName}
                  setSelectedSiteName={selectSiteAndReplan}
                  history={history}
                  onRecordRound={recordRound}
                  onUndoLastRound={undoLastRound}
                  onRollOperator={rollTacticalVariant}
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
              <OperatorsCatalog />
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
              <MapsCatalog />
            </motion.section>
          )}

          {activeTab === "pibes" && (
            <motion.section
              key="tab-pibes"
              className="tab-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <PibesView />
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      <MobileTabBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
