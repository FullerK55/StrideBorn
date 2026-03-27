// ============================================================
// Stride Born — Game State Hook
// Design: Idle dungeon crawler — character always walks automatically
// Steps accumulate on their own; player decides when to enter/return
// Profile-aware: loads from and auto-saves to the active profile
// Offline progress: calculates steps/floors/loot earned while away
// ============================================================

import { useEffect, useRef, useState, useCallback } from "react";
import type { Profile } from "@/contexts/ProfileContext";

// ============================================================
// GAME DATA
// ============================================================

export const DUNGEONS = [
  {
    id: "crystal",
    name: "Crystal Caverns",
    icon: "💎",
    bgClass: "crystal",
    tileClass: "crystal",
    desc: "Glittering gem deposits deep below",
    drops: ["💎 Crystals", "🔷 Sapphires", "⚗️ Dust"],
    color: "#4466ff",
    particles: ["#4466ff", "#00ffff", "#8844ff"],
    unlocked: true,
    unlockFloor: 0,
  },
  {
    id: "verdant",
    name: "Verdant Ruins",
    icon: "🌿",
    bgClass: "verdant",
    tileClass: "verdant",
    desc: "Ancient temple consumed by nature",
    drops: ["🌿 Herbs", "🪵 Ancient Wood", "🍄 Spores"],
    color: "#44ff44",
    particles: ["#44ff44", "#88ff44", "#44aa00"],
    unlocked: false,
    unlockFloor: 5,
  },
  {
    id: "ember",
    name: "Ember Depths",
    icon: "🔥",
    bgClass: "ember",
    tileClass: "ember",
    desc: "Volcanic shafts rich in rare ores",
    drops: ["🪨 Iron Ore", "🔴 Magma Core", "⚙️ Slag"],
    color: "#ff4400",
    particles: ["#ff4400", "#ff8800", "#ffcc00"],
    unlocked: false,
    unlockFloor: 10,
  },
  {
    id: "frost",
    name: "Frost Warrens",
    icon: "❄️",
    bgClass: "frost",
    tileClass: "frost",
    desc: "Frozen passages hiding ice relics",
    drops: ["❄️ Ice Shards", "🔮 Frost Rune", "🦴 Bone"],
    color: "#88ccff",
    particles: ["#88ccff", "#aaddff", "#ffffff"],
    unlocked: false,
    unlockFloor: 20,
  },
];

export const LOOT_TABLES: Record<string, LootItem[]> = {
  crystal: [
    { emoji: "💎", name: "Crystal Shard", rarity: "common", weight: 50 },
    { emoji: "🔷", name: "Sapphire", rarity: "uncommon", weight: 25 },
    { emoji: "⚗️", name: "Magic Dust", rarity: "uncommon", weight: 15 },
    { emoji: "💠", name: "Void Crystal", rarity: "rare", weight: 8 },
    { emoji: "🌟", name: "Star Fragment", rarity: "legendary", weight: 2 },
  ],
  ember: [
    { emoji: "🪨", name: "Iron Ore", rarity: "common", weight: 50 },
    { emoji: "🔴", name: "Magma Core", rarity: "uncommon", weight: 25 },
    { emoji: "⚙️", name: "Iron Slag", rarity: "common", weight: 15 },
    { emoji: "🏺", name: "Ember Flask", rarity: "rare", weight: 8 },
    { emoji: "🔱", name: "Inferno Rune", rarity: "legendary", weight: 2 },
  ],
  verdant: [
    { emoji: "🌿", name: "Wild Herb", rarity: "common", weight: 50 },
    { emoji: "🪵", name: "Ancient Wood", rarity: "uncommon", weight: 25 },
    { emoji: "🍄", name: "Spore Cap", rarity: "uncommon", weight: 15 },
    { emoji: "🌺", name: "Moonflower", rarity: "rare", weight: 8 },
    { emoji: "🦋", name: "Spirit Wing", rarity: "legendary", weight: 2 },
  ],
  frost: [
    { emoji: "❄️", name: "Ice Shard", rarity: "common", weight: 50 },
    { emoji: "🔮", name: "Frost Rune", rarity: "uncommon", weight: 25 },
    { emoji: "🦴", name: "Frozen Bone", rarity: "common", weight: 15 },
    { emoji: "🧊", name: "Glacial Core", rarity: "rare", weight: 8 },
    { emoji: "💫", name: "Aurora Dust", rarity: "legendary", weight: 2 },
  ],
};

export const RARITY_COLORS: Record<string, string> = {
  common: "#aaaacc",
  uncommon: "#44ff88",
  rare: "#4488ff",
  legendary: "#ffaa00",
};

// ============================================================
// CONSTANTS
// ============================================================

const STEPS_PER_TICK = 10;          // steps per 100ms tick
const TICKS_PER_SECOND = 10;        // 10 ticks/s
const STEPS_PER_SECOND = STEPS_PER_TICK * TICKS_PER_SECOND; // 100 steps/s
const STEPS_PER_FLOOR = 2000;
const MAX_OFFLINE_SECONDS = 8 * 60 * 60; // 8 hours cap
const BAG_SIZE = 5;
const STASH_SIZE = 18;

// ============================================================
// TYPES
// ============================================================

export interface LootItem {
  emoji: string;
  name: string;
  rarity: string;
  weight: number;
  qty?: number;
}

export interface LogEntry {
  id: number;
  text: string;
  cls: string;
  timestamp: number;
}

export interface GameState {
  steps: number;
  totalSteps: number;
  currentFloor: number;
  deepestFloor: number;
  stepsToNextFloor: number;
  currentDungeon: string;
  isInDungeon: boolean;
  isReturning: boolean;
  returnStepsNeeded: number;
  returnStepsWalked: number;
  bag: (LootItem | null)[];
  bagSize: number;
  stash: LootItem[];
  stashSize: number;
  runs: number;
  lives: number;
  dungeons: typeof DUNGEONS;
}

export interface OfflineSummary {
  secondsAway: number;
  floorsCleared: number;
  startFloor: number;
  endFloor: number;
  lootFound: LootItem[];
  totalStepsEarned: number;
  deepestReached: number;
  dungeon: string;
}

export interface GameActions {
  enterDungeon: () => void;
  startReturn: () => void;
  selectDungeon: (id: string) => void;
  dropBagItem: (idx: number) => void;
  log: LogEntry[];
  notification: string | null;
  lootPopups: LootPopup[];
  lastSaved: number | null;
  offlineSummary: OfflineSummary | null;
  clearOfflineSummary: () => void;
  saveNow: () => void;
}

export interface LootPopup {
  id: number;
  emoji: string;
  x: number;
}

// ============================================================
// HELPERS
// ============================================================

function weightedRandom(table: LootItem[]): LootItem {
  const total = table.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const item of table) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return table[0];
}

/**
 * Calculate offline progress for a profile that was in a dungeon.
 * Returns the resulting stash additions and summary.
 */
function calculateOfflineProgress(profile: Profile): {
  summary: OfflineSummary;
  newStash: LootItem[];
  newTotalSteps: number;
  newDeepestFloor: number;
} | null {
  if (
    !profile.offlineTimestamp ||
    profile.offlineFloor === null ||
    !profile.offlineDungeon
  ) {
    return null;
  }

  const now = Date.now();
  const rawSeconds = Math.floor((now - profile.offlineTimestamp) / 1000);
  const secondsAway = Math.min(rawSeconds, MAX_OFFLINE_SECONDS);

  if (secondsAway < 5) return null; // too short to matter

  const totalOfflineSteps = secondsAway * STEPS_PER_SECOND;
  const floorsCleared = Math.floor(totalOfflineSteps / STEPS_PER_FLOOR);
  const startFloor = profile.offlineFloor;
  const endFloor = startFloor + floorsCleared;
  const dungeonId = profile.offlineDungeon;

  // Roll loot: 1 roll per floor + boss bonus every 10 floors
  const table = LOOT_TABLES[dungeonId] || LOOT_TABLES.crystal;
  const lootFound: LootItem[] = [];

  for (let f = startFloor + 1; f <= endFloor; f++) {
    const rolls = 1 + Math.floor(f / 5);
    for (let r = 0; r < rolls; r++) {
      lootFound.push(weightedRandom(table));
    }
    if (f % 10 === 0) {
      // Boss bonus: 2 extra rolls
      lootFound.push(weightedRandom(table));
      lootFound.push(weightedRandom(table));
    }
  }

  // Cap loot at a reasonable amount (avoid overwhelming stash)
  const cappedLoot = lootFound.slice(0, 40);

  // Merge loot into existing stash
  const newStash: LootItem[] = [...(profile.stash as LootItem[])];
  cappedLoot.forEach((item) => {
    const existing = newStash.find((s) => s && s.name === item.name);
    if (existing) {
      existing.qty = (existing.qty || 1) + 1;
    } else if (newStash.length < STASH_SIZE) {
      newStash.push({ ...item, qty: 1 });
    }
  });

  const newTotalSteps = (profile.totalSteps ?? 0) + totalOfflineSteps;
  const newDeepestFloor = Math.max(profile.deepestFloor ?? 0, endFloor);

  return {
    summary: {
      secondsAway,
      floorsCleared,
      startFloor,
      endFloor,
      lootFound: cappedLoot,
      totalStepsEarned: totalOfflineSteps,
      deepestReached: endFloor,
      dungeon: dungeonId,
    },
    newStash,
    newTotalSteps,
    newDeepestFloor,
  };
}

function buildInitialState(profile: Profile, resumeInDungeon = false, resumeFloor = 0): GameState {
  const dungeons = DUNGEONS.map((d) => ({
    ...d,
    unlocked: (profile.deepestFloor ?? 0) >= d.unlockFloor || d.unlockFloor === 0,
  }));

  return {
    steps: 0,
    totalSteps: profile.totalSteps ?? 0,
    currentFloor: resumeInDungeon ? resumeFloor : 0,
    deepestFloor: profile.deepestFloor ?? 0,
    stepsToNextFloor: STEPS_PER_FLOOR,
    currentDungeon: profile.currentDungeon ?? "crystal",
    isInDungeon: resumeInDungeon,
    isReturning: false,
    returnStepsNeeded: 0,
    returnStepsWalked: 0,
    bag: [],
    bagSize: BAG_SIZE,
    stash: (profile.stash as LootItem[]) ?? [],
    stashSize: STASH_SIZE,
    runs: profile.runs ?? 0,
    lives: profile.lives ?? 1,
    dungeons,
  };
}

// ============================================================
// HOOK
// ============================================================

let logIdCounter = 0;
let popupIdCounter = 0;

export function useGameState(
  profile: Profile,
  onSave: (data: Partial<Profile>) => void
): [GameState, GameActions] {
  // ---- Compute offline progress before building initial state ----
  const offlineResult = useRef<ReturnType<typeof calculateOfflineProgress>>(null);
  const offlineSummaryRef = useRef<OfflineSummary | null>(null);

  // Track whether we should resume in dungeon on mount
  const resumeInDungeonRef = useRef(false);
  const resumeFloorRef = useRef(0);

  // Only compute once on mount
  const [initialState] = useState<GameState>(() => {
    const result = calculateOfflineProgress(profile);
    offlineResult.current = result;
    if (result) {
      offlineSummaryRef.current = result.summary;
      // Build state with updated stash/steps/deepest from offline calc
      // Resume in dungeon at the floor they reached after offline progress
      const resumeFloor = result.summary.endFloor;
      resumeInDungeonRef.current = true;
      resumeFloorRef.current = resumeFloor;
      const updatedProfile: Profile = {
        ...profile,
        stash: result.newStash,
        totalSteps: result.newTotalSteps,
        deepestFloor: result.newDeepestFloor,
        currentDungeon: result.summary.dungeon,
        // Clear offline tracking — they're back now
        offlineTimestamp: null,
        offlineFloor: null,
        offlineDungeon: null,
      };
      return buildInitialState(updatedProfile, true, resumeFloor);
    }
    // No offline progress — check if profile was in dungeon (e.g. very short absence < 5s)
    if (profile.offlineTimestamp && profile.offlineFloor !== null && profile.offlineDungeon) {
      resumeInDungeonRef.current = true;
      resumeFloorRef.current = profile.offlineFloor;
      return buildInitialState(profile, true, profile.offlineFloor);
    }
    return buildInitialState(profile);
  });

  const [state, setState] = useState<GameState>(initialState);
  const [offlineSummary, setOfflineSummary] = useState<OfflineSummary | null>(
    () => offlineSummaryRef.current
  );

  const [log, setLog] = useState<LogEntry[]>(() => {
    const entries: LogEntry[] = [
      { id: logIdCounter++, text: `🗡 ${profile.name} awakens...`, cls: "log-muted", timestamp: Date.now() },
    ];
    if (offlineSummaryRef.current) {
      const s = offlineSummaryRef.current;
      const mins = Math.floor(s.secondsAway / 60);
      entries.unshift({
        id: logIdCounter++,
        text: `⏰ Offline ${mins}m — cleared ${s.floorsCleared} floors, found ${s.lootFound.length} items!`,
        cls: "log-gold",
        timestamp: Date.now(),
      });
    } else {
      entries.push({
        id: logIdCounter++,
        text: "💎 Crystal Caverns await your first steps.",
        cls: "log-gem",
        timestamp: Date.now(),
      });
    }
    return entries;
  });

  const [notification, setNotification] = useState<string | null>(null);
  const [lootPopups, setLootPopups] = useState<LootPopup[]>([]);
  const [lastSaved, setLastSaved] = useState<number | null>(null);

  const stateRef = useRef(state);
  stateRef.current = state;

  const notifTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const walkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  // ---- Persist offline result immediately on mount ----
  useEffect(() => {
    if (offlineResult.current) {
      const r = offlineResult.current;
      onSaveRef.current({
        stash: r.newStash,
        totalSteps: r.newTotalSteps,
        deepestFloor: r.newDeepestFloor,
        offlineTimestamp: null,
        offlineFloor: null,
        offlineDungeon: null,
      });
    }
    // If resuming in dungeon, auto-start the walk interval
    if (resumeInDungeonRef.current) {
      prevFloorRef.current = resumeFloorRef.current;
      startWalkInterval();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Auto-save every 5 seconds ----
  useEffect(() => {
    saveTimerRef.current = setInterval(() => {
      const s = stateRef.current;
      // If in dungeon, save offline tracking info so other profiles/app-close can calculate progress
      const offlineData = s.isInDungeon && !s.isReturning
        ? {
            offlineTimestamp: Date.now(),
            offlineFloor: s.currentFloor,
            offlineDungeon: s.currentDungeon,
          }
        : {
            offlineTimestamp: null,
            offlineFloor: null,
            offlineDungeon: null,
          };

      onSaveRef.current({
        totalSteps: s.totalSteps,
        deepestFloor: s.deepestFloor,
        currentDungeon: s.currentDungeon,
        stash: s.stash,
        runs: s.runs,
        lives: s.lives,
        ...offlineData,
      });
      setLastSaved(Date.now());
    }, 5000);
    return () => {
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
    };
  }, []);

  // ---- Save immediately on key state changes ----
  useEffect(() => {
    const s = stateRef.current;
    const offlineData = s.isInDungeon && !s.isReturning
      ? {
          offlineTimestamp: Date.now(),
          offlineFloor: s.currentFloor,
          offlineDungeon: s.currentDungeon,
        }
      : {
          offlineTimestamp: null,
          offlineFloor: null,
          offlineDungeon: null,
        };

    onSaveRef.current({
      totalSteps: s.totalSteps,
      deepestFloor: s.deepestFloor,
      currentDungeon: s.currentDungeon,
      stash: s.stash,
      runs: s.runs,
      lives: s.lives,
      ...offlineData,
    });
    setLastSaved(Date.now());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.deepestFloor, state.stash, state.runs, state.isInDungeon, state.currentFloor]);

  const addLog = useCallback((text: string, cls = "") => {
    setLog((prev) => [
      { id: logIdCounter++, text, cls, timestamp: Date.now() },
      ...prev.slice(0, 49),
    ]);
  }, []);

  const showNotif = useCallback((msg: string) => {
    setNotification(msg);
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    notifTimerRef.current = setTimeout(() => setNotification(null), 2500);
  }, []);

  const spawnLootPopup = useCallback((emoji: string) => {
    const id = popupIdCounter++;
    const x = 30 + Math.random() * 40;
    setLootPopups((prev) => [...prev, { id, emoji, x }]);
    setTimeout(() => {
      setLootPopups((prev) => prev.filter((p) => p.id !== id));
    }, 1600);
  }, []);

  // ---- Core step ticker ----
  const startWalkInterval = useCallback(() => {
    if (walkIntervalRef.current) return;
    walkIntervalRef.current = setInterval(() => {
      setState((prev) => {
        if (!prev.isInDungeon && !prev.isReturning) return prev;
        return tickSteps(prev, STEPS_PER_TICK);
      });
    }, 100);
  }, []);

  const stopWalkInterval = useCallback(() => {
    if (walkIntervalRef.current) {
      clearInterval(walkIntervalRef.current);
      walkIntervalRef.current = null;
    }
  }, []);

  function tickSteps(prev: GameState, n: number): GameState {
    const next = { ...prev, totalSteps: prev.totalSteps + n };

    if (prev.isReturning) {
      const walked = prev.returnStepsWalked + n;
      if (walked >= prev.returnStepsNeeded) {
        return { ...next, returnStepsWalked: walked, returnStepsNeeded: prev.returnStepsNeeded };
      }
      return { ...next, returnStepsWalked: walked };
    }

    const newSteps = prev.steps + n;
    if (newSteps >= prev.stepsToNextFloor) {
      return { ...next, steps: newSteps - prev.stepsToNextFloor, currentFloor: prev.currentFloor + 1 };
    }
    return { ...next, steps: newSteps };
  }

  // ---- Watch for floor changes ----
  const prevFloorRef = useRef(0);
  useEffect(() => {
    if (!state.isInDungeon || state.isReturning) return;
    if (state.currentFloor > prevFloorRef.current) {
      const floor = state.currentFloor;
      prevFloorRef.current = floor;

      if (floor > stateRef.current.deepestFloor) {
        setState((p) => ({ ...p, deepestFloor: floor }));
      }

      addLog(`⬇ Descended to floor ${floor}`, "log-gem");

      const rolls = 1 + Math.floor(floor / 5);
      for (let i = 0; i < rolls; i++) {
        setTimeout(() => rollLoot(), i * 200);
      }

      if (floor % 10 === 0) {
        setTimeout(() => {
          addLog(`✨ BOSS ROOM! Floor ${floor} guardian defeated!`, "log-gold");
          rollLoot();
          rollLoot();
          showNotif("⚔ BOSS DEFEATED!");
        }, 600);
      }

      DUNGEONS.forEach((d) => {
        if (!d.unlocked && d.unlockFloor && floor >= d.unlockFloor) {
          setState((p) => ({
            ...p,
            dungeons: p.dungeons.map((dd) =>
              dd.id === d.id ? { ...dd, unlocked: true } : dd
            ),
          }));
          showNotif(`🗺 ${d.name} UNLOCKED!`);
          addLog(`🗺 New dungeon unlocked: ${d.name}!`, "log-gold");
        }
      });
    }
  }, [state.currentFloor, state.isInDungeon, state.isReturning, addLog, showNotif]);

  // ---- Watch for return completion ----
  useEffect(() => {
    if (
      state.isReturning &&
      state.returnStepsWalked >= state.returnStepsNeeded &&
      state.returnStepsNeeded > 0
    ) {
      arriveAtBase();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.returnStepsWalked, state.returnStepsNeeded, state.isReturning]);

  function rollLoot() {
    setState((prev) => {
      const table = LOOT_TABLES[prev.currentDungeon] || LOOT_TABLES.crystal;
      const item = weightedRandom(table);
      const usedSlots = prev.bag.filter(Boolean).length;
      if (usedSlots >= prev.bagSize) {
        addLog("⚠ Bag full! Return to base to stash items.", "log-red");
        return prev;
      }
      const newBag = [...prev.bag];
      for (let i = 0; i < prev.bagSize; i++) {
        if (!newBag[i]) {
          newBag[i] = { ...item, qty: 1 };
          break;
        }
      }
      const cls = item.rarity === "legendary" ? "log-gold" : item.rarity === "rare" ? "log-gem" : "";
      addLog(`${item.emoji} Found ${item.name} [${item.rarity.toUpperCase()}]`, cls);
      spawnLootPopup(item.emoji);
      return { ...prev, bag: newBag };
    });
  }

  function arriveAtBase() {
    stopWalkInterval();
    setState((prev) => {
      const dumped = prev.bag.filter(Boolean) as LootItem[];
      const newStash = [...prev.stash];
      dumped.forEach((item) => {
        const existing = newStash.find((s) => s && s.name === item.name);
        if (existing) {
          existing.qty = (existing.qty || 1) + 1;
        } else if (newStash.length < prev.stashSize) {
          newStash.push({ ...item, qty: 1 });
        }
      });
      if (dumped.length > 0) {
        addLog(`📦 Stashed ${dumped.length} items from bag!`, "log-green");
        showNotif(`📦 ${dumped.length} ITEMS STASHED!`);
      } else {
        addLog("🏠 Returned to base empty-handed.", "log-muted");
      }
      addLog("🏠 Back at base. Rest up, adventurer.", "log-gold");
      return {
        ...prev,
        isInDungeon: false,
        isReturning: false,
        currentFloor: 0,
        steps: 0,
        returnStepsWalked: 0,
        returnStepsNeeded: 0,
        bag: [],
        stash: newStash,
      };
    });
    prevFloorRef.current = 0;
  }

  // ---- Actions ----
  const enterDungeon = useCallback(() => {
    setState((prev) => {
      if (prev.isInDungeon || prev.isReturning) return prev;
      addLog(`🗺 Entering ${prev.dungeons.find((d) => d.id === prev.currentDungeon)?.name ?? "dungeon"}...`, "log-gem");
      return { ...prev, isInDungeon: true, steps: 0, runs: prev.runs + 1 };
    });
    prevFloorRef.current = 0;
    startWalkInterval();
  }, [addLog, startWalkInterval]);

  const startReturn = useCallback(() => {
    setState((prev) => {
      if (!prev.isInDungeon || prev.isReturning) return prev;
      if (prev.currentFloor === 0) return prev;
      const needed = prev.currentFloor * STEPS_PER_FLOOR;
      addLog(`↩ Returning to base — ${needed} steps needed`, "log-orange");
      return {
        ...prev,
        isReturning: true,
        returnStepsNeeded: needed,
        returnStepsWalked: 0,
      };
    });
    if (stateRef.current.currentFloor === 0) {
      arriveAtBase();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addLog]);

  const selectDungeon = useCallback((id: string) => {
    setState((prev) => {
      if (prev.isInDungeon || prev.isReturning) {
        showNotif("RETURN TO BASE FIRST!");
        return prev;
      }
      const d = prev.dungeons.find((dd) => dd.id === id);
      if (!d || !d.unlocked) return prev;
      addLog(`🗺 Selected dungeon: ${d.name}`, "log-gem");
      return { ...prev, currentDungeon: id };
    });
  }, [addLog, showNotif]);

  const dropBagItem = useCallback((idx: number) => {
    setState((prev) => {
      const item = prev.bag[idx];
      if (!item) return prev;
      addLog(`🗑 Dropped ${item.emoji} ${item.name}`, "log-muted");
      const newBag = [...prev.bag];
      newBag[idx] = null;
      return { ...prev, bag: newBag };
    });
  }, [addLog]);

  const clearOfflineSummary = useCallback(() => {
    setOfflineSummary(null);
  }, []);

  // Immediate synchronous save — call before profile switch so offline state is persisted
  const saveNow = useCallback(() => {
    const s = stateRef.current;
    const offlineData = s.isInDungeon && !s.isReturning
      ? {
          offlineTimestamp: Date.now(),
          offlineFloor: s.currentFloor,
          offlineDungeon: s.currentDungeon,
        }
      : {
          offlineTimestamp: null,
          offlineFloor: null,
          offlineDungeon: null,
        };
    onSaveRef.current({
      totalSteps: s.totalSteps,
      deepestFloor: s.deepestFloor,
      currentDungeon: s.currentDungeon,
      stash: s.stash,
      runs: s.runs,
      lives: s.lives,
      ...offlineData,
    });
    setLastSaved(Date.now());
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWalkInterval();
      if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
    };
  }, [stopWalkInterval]);

  return [
    state,
    {
      enterDungeon,
      startReturn,
      selectDungeon,
      dropBagItem,
      log,
      notification,
      lootPopups,
      lastSaved,
      offlineSummary,
      clearOfflineSummary,
      saveNow,
    },
  ];
}
