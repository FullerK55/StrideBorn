// ============================================================
// Stride Born — Game State Hook
// Design: Idle dungeon crawler — character always walks automatically
// Steps accumulate on their own; player decides when to enter/return
// Profile-aware: loads from and auto-saves to the active profile
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

export interface GameActions {
  enterDungeon: () => void;
  startReturn: () => void;
  selectDungeon: (id: string) => void;
  dropBagItem: (idx: number) => void;
  log: LogEntry[];
  notification: string | null;
  lootPopups: LootPopup[];
  lastSaved: number | null;
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

function buildInitialState(profile: Profile): GameState {
  const dungeons = DUNGEONS.map((d) => ({
    ...d,
    unlocked: (profile.deepestFloor ?? 0) >= d.unlockFloor || d.unlockFloor === 0,
  }));

  return {
    steps: 0,
    totalSteps: profile.totalSteps ?? 0,
    currentFloor: 0,
    deepestFloor: profile.deepestFloor ?? 0,
    stepsToNextFloor: 2000,
    currentDungeon: profile.currentDungeon ?? "crystal",
    isInDungeon: false,
    isReturning: false,
    returnStepsNeeded: 0,
    returnStepsWalked: 0,
    bag: [],
    bagSize: 5,
    stash: (profile.stash as LootItem[]) ?? [],
    stashSize: 18,
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
  const [state, setState] = useState<GameState>(() => buildInitialState(profile));
  const [log, setLog] = useState<LogEntry[]>([
    { id: logIdCounter++, text: `🗡 ${profile.name} awakens...`, cls: "log-muted", timestamp: Date.now() },
    { id: logIdCounter++, text: "💎 Crystal Caverns await your first steps.", cls: "log-gem", timestamp: Date.now() },
  ]);
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

  // ---- Auto-save every 5 seconds ----
  useEffect(() => {
    saveTimerRef.current = setInterval(() => {
      const s = stateRef.current;
      onSaveRef.current({
        totalSteps: s.totalSteps,
        deepestFloor: s.deepestFloor,
        currentDungeon: s.currentDungeon,
        stash: s.stash,
        runs: s.runs,
        lives: s.lives,
      });
      setLastSaved(Date.now());
    }, 5000);
    return () => {
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
    };
  }, []);

  // ---- Also save immediately on stash/deepest/runs change ----
  useEffect(() => {
    onSaveRef.current({
      totalSteps: state.totalSteps,
      deepestFloor: state.deepestFloor,
      currentDungeon: state.currentDungeon,
      stash: state.stash,
      runs: state.runs,
      lives: state.lives,
    });
    setLastSaved(Date.now());
  }, [state.deepestFloor, state.stash, state.runs]);

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

  // ---- Core step ticker (always runs when in dungeon) ----
  const startWalkInterval = useCallback(() => {
    if (walkIntervalRef.current) return;
    walkIntervalRef.current = setInterval(() => {
      setState((prev) => {
        if (!prev.isInDungeon && !prev.isReturning) return prev;
        return tickSteps(prev, 10);
      });
    }, 100);
  }, []);

  const stopWalkInterval = useCallback(() => {
    if (walkIntervalRef.current) {
      clearInterval(walkIntervalRef.current);
      walkIntervalRef.current = null;
    }
  }, []);

  // ---- Tick steps (pure state update) ----
  function tickSteps(prev: GameState, n: number): GameState {
    const next = { ...prev, totalSteps: prev.totalSteps + n };

    if (prev.isReturning) {
      const walked = prev.returnStepsWalked + n;
      if (walked >= prev.returnStepsNeeded) {
        return { ...next, returnStepsWalked: walked, returnStepsNeeded: prev.returnStepsNeeded };
      }
      return { ...next, returnStepsWalked: walked };
    }

    // Descending
    const newSteps = prev.steps + n;
    if (newSteps >= prev.stepsToNextFloor) {
      return { ...next, steps: newSteps - prev.stepsToNextFloor, currentFloor: prev.currentFloor + 1 };
    }
    return { ...next, steps: newSteps };
  }

  // ---- Watch for floor changes (trigger loot, boss, unlocks) ----
  const prevFloorRef = useRef(0);
  useEffect(() => {
    if (!state.isInDungeon || state.isReturning) return;
    if (state.currentFloor > prevFloorRef.current) {
      const floor = state.currentFloor;
      prevFloorRef.current = floor;

      // Update deepest
      if (floor > stateRef.current.deepestFloor) {
        setState((p) => ({ ...p, deepestFloor: floor }));
      }

      addLog(`⬇ Descended to floor ${floor}`, "log-gem");

      // Loot rolls
      const rolls = 1 + Math.floor(floor / 5);
      for (let i = 0; i < rolls; i++) {
        setTimeout(() => rollLoot(false), i * 200);
      }

      // Boss every 10 floors
      if (floor % 10 === 0) {
        setTimeout(() => {
          addLog(`✨ BOSS ROOM! Floor ${floor} guardian defeated!`, "log-gold");
          rollLoot(true);
          rollLoot(true);
          showNotif("⚔ BOSS DEFEATED!");
        }, 600);
      }

      // Dungeon unlocks
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
  }, [state.returnStepsWalked, state.returnStepsNeeded, state.isReturning]);

  // ---- Loot roll ----
  function rollLoot(guaranteed = false) {
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

  // ---- Arrive at base ----
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
      const needed = prev.currentFloor * 2000;
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
    { enterDungeon, startReturn, selectDungeon, dropBagItem, log, notification, lootPopups, lastSaved },
  ];
}
