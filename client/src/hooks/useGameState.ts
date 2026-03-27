// ============================================================
// Stride Born — Game State Hook
// Design: Idle dungeon crawler — character always walks automatically
// Full gear system: 9 slots, tiered drops, materials, crafting
// ============================================================

import { useEffect, useRef, useState, useCallback } from "react";
import type { Profile } from "@/contexts/ProfileContext";

// ============================================================
// GAME DATA — DUNGEONS
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
    unlockFloor: 10,
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
    unlockFloor: 20,
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
    unlockFloor: 40,
  },
];

// ============================================================
// GEAR SYSTEM DATA
// ============================================================

export type GearSlot = "helmet" | "gloves" | "chest" | "pants" | "boots" | "backpack" | "weapon" | "ring" | "amulet";
export type GearRarity = "scrap" | "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";
export type GearTier = "iron" | "steel" | "shadow" | "void" | "celestial";
export type MaterialType = "crude" | "refined" | "tempered" | "voidmat" | "celestialmat";

export const GEAR_SLOTS: { id: GearSlot; label: string; emoji: string }[] = [
  { id: "helmet",   label: "Helmet",   emoji: "⛑️" },
  { id: "gloves",   label: "Gloves",   emoji: "🧤" },
  { id: "chest",    label: "Chest",    emoji: "🥋" },
  { id: "pants",    label: "Pants",    emoji: "👖" },
  { id: "boots",    label: "Boots",    emoji: "👢" },
  { id: "backpack", label: "Backpack", emoji: "🎒" },
  { id: "weapon",   label: "Weapon",   emoji: "⚔️" },
  { id: "ring",     label: "Ring",     emoji: "💍" },
  { id: "amulet",   label: "Amulet",   emoji: "📿" },
];

export const RARITY_COLORS: Record<GearRarity | string, string> = {
  scrap:     "#888888",
  common:    "#aaaacc",
  uncommon:  "#44ff88",
  rare:      "#4488ff",
  epic:      "#aa44ff",
  legendary: "#ffaa00",
  mythic:    "#ff4488",
};

export const RARITY_LABELS: Record<GearRarity, string> = {
  scrap:     "⚪ Scrap",
  common:    "🟢 Common",
  uncommon:  "🔵 Uncommon",
  rare:      "🟣 Rare",
  epic:      "🟠 Epic",
  legendary: "🔴 Legendary",
  mythic:    "🌟 Mythic",
};

export const TIER_LABELS: Record<GearTier, string> = {
  iron:      "Tier 1 Iron",
  steel:     "Tier 2 Steel",
  shadow:    "Tier 3 Shadow",
  void:      "Tier 4 Void",
  celestial: "Tier 5 Celestial",
};

export const MATERIAL_INFO: Record<MaterialType, { label: string; emoji: string }> = {
  crude:       { label: "Crude",     emoji: "🪨" },
  refined:     { label: "Refined",   emoji: "⚙️" },
  tempered:    { label: "Tempered",  emoji: "🔩" },
  voidmat:     { label: "Void",      emoji: "💠" },
  celestialmat:{ label: "Celestial", emoji: "🌟" },
};

// All possible stats that can roll on gear
export const ALL_STATS = [
  // Movement
  "Steps Efficiency", "Return Speed", "Encumbrance", "Scout Range",
  // Combat
  "Attack Power", "Defense", "Crit Chance", "Crit Damage", "Lifesteal",
  "Dodge Chance", "Armor Penetration", "Stun Chance",
  // Loot
  "Loot Find", "Item Rarity", "Gold Find", "Material Yield",
  "Socket Luck", "Rune Drop Rate",
  // Survival
  "Max HP", "HP Regen", "Death Insurance", "Corpse Preservation",
  "Bag Slots", "Stash Overflow",
  // Economy
  "Craft Cost Reduction", "Reroll Luck", "Salvage Yield", "Tier Conversion",
];

// Stats available per slot (each slot has a preferred stat pool)
const SLOT_STATS: Record<GearSlot, string[]> = {
  helmet:   ["Defense", "Max HP", "Loot Find", "Scout Range", "Item Rarity"],
  gloves:   ["Attack Power", "Crit Chance", "Crit Damage", "Craft Cost Reduction", "Material Yield"],
  chest:    ["Defense", "Max HP", "HP Regen", "Lifesteal", "Stash Overflow"],
  pants:    ["Steps Efficiency", "Return Speed", "Dodge Chance", "Encumbrance", "Bag Slots"],
  boots:    ["Steps Efficiency", "Return Speed", "Encumbrance", "Dodge Chance", "Scout Range"],
  backpack: ["Bag Slots", "Stash Overflow", "Material Yield", "Salvage Yield", "Gold Find"],
  weapon:   ["Attack Power", "Crit Chance", "Crit Damage", "Armor Penetration", "Stun Chance"],
  ring:     ["Loot Find", "Gold Find", "Rune Drop Rate", "Socket Luck", "Reroll Luck"],
  amulet:   ["HP Regen", "Death Insurance", "Corpse Preservation", "Lifesteal", "Tier Conversion"],
};

// Runes
export const RUNES = [
  // Crystal Caverns
  { id: "crystal_1", name: "Crystal Shard Rune", emoji: "💎",   dungeon: "crystal", grade: 1, stat: "+Loot Find",                  nextId: "crystal_2" },
  { id: "crystal_2", name: "Crystal Rune",        emoji: "💎💎", dungeon: "crystal", grade: 2, stat: "+Item Rarity",                nextId: "crystal_3" },
  { id: "crystal_3", name: "Void Crystal Rune",   emoji: "💎💎💎",dungeon: "crystal", grade: 3, stat: "+Socket Luck + Item Rarity", nextId: null },
  // Ember Depths
  { id: "ember_1",   name: "Ember Rune",           emoji: "🔴",   dungeon: "ember",   grade: 1, stat: "+Attack Power",              nextId: "ember_2" },
  { id: "ember_2",   name: "Magma Rune",           emoji: "🔴🔴", dungeon: "ember",   grade: 2, stat: "+Crit Chance",               nextId: "ember_3" },
  { id: "ember_3",   name: "Inferno Rune",         emoji: "🔴🔴🔴",dungeon: "ember",  grade: 3, stat: "+Crit Damage + Armor Pen",   nextId: null },
  // Verdant Ruins
  { id: "verdant_1", name: "Herb Rune",            emoji: "🌿",   dungeon: "verdant", grade: 1, stat: "+HP Regen",                  nextId: "verdant_2" },
  { id: "verdant_2", name: "Verdant Rune",         emoji: "🌿🌿", dungeon: "verdant", grade: 2, stat: "+Lifesteal",                 nextId: "verdant_3" },
  { id: "verdant_3", name: "Spirit Rune",          emoji: "🌿🌿🌿",dungeon: "verdant",grade: 3, stat: "+Death Insurance + HP Regen",nextId: null },
  // Frost Warrens
  { id: "frost_1",   name: "Frost Rune",           emoji: "❄️",   dungeon: "frost",   grade: 1, stat: "+Dodge Chance",              nextId: "frost_2" },
  { id: "frost_2",   name: "Glacial Rune",         emoji: "❄️❄️", dungeon: "frost",   grade: 2, stat: "+Defense",                   nextId: "frost_3" },
  { id: "frost_3",   name: "Aurora Rune",          emoji: "❄️❄️❄️",dungeon: "frost",  grade: 3, stat: "+Stun Chance + Return Speed",nextId: null },
];

// ============================================================
// CONSTANTS
// ============================================================

const STEPS_PER_TICK = 10;
const TICKS_PER_SECOND = 10;
const STEPS_PER_SECOND = STEPS_PER_TICK * TICKS_PER_SECOND;
const STEPS_PER_FLOOR = 4000;
const MAX_OFFLINE_SECONDS = 8 * 60 * 60;
const BAG_SIZE = 5;
const STASH_SIZE = 30;

// ============================================================
// TYPES
// ============================================================

export interface GearItem {
  id: string;           // unique instance id
  slot: GearSlot;
  tier: GearTier;
  rarity: GearRarity;
  name: string;         // e.g. "Iron Helmet"
  emoji: string;
  stats: { stat: string; value: number }[];
  sockets: number;      // max sockets
  runes: (string | null)[];  // rune ids in each socket
  isGear: true;
}

export interface MaterialItem {
  type: MaterialType;
  qty: number;
  isMaterial: true;
}

export type BagItem = GearItem | MaterialItem;

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

export interface Materials {
  crude: number;
  refined: number;
  tempered: number;
  voidmat: number;
  celestialmat: number;
}

export interface RuneInventory {
  [runeId: string]: number; // count of each rune
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
  bag: (BagItem | null)[];
  bagSize: number;
  stash: GearItem[];
  stashSize: number;
  equippedGear: Record<GearSlot, GearItem | null>;
  materials: Materials;
  runes: RuneInventory;
  runs: number;
  lives: number;
  dungeons: typeof DUNGEONS;
}

export interface OfflineSummary {
  secondsAway: number;
  floorsCleared: number;
  startFloor: number;
  endFloor: number;
  lootFound: BagItem[];
  totalStepsEarned: number;
  deepestReached: number;
  dungeon: string;
}

export interface GameActions {
  enterDungeon: () => void;
  startReturn: () => void;
  selectDungeon: (id: string) => void;
  dropBagItem: (idx: number) => void;
  equipFromBag: (bagIdx: number) => void;
  craftConvert: (from: MaterialType) => void;
  craftReroll: (gearId: string) => void;
  craftSocket: (gearId: string) => void;
  craftTierUp: (gearId: string) => void;
  combineRune: (runeId: string) => void;
  socketRune: (gearId: string, socketIdx: number, runeId: string) => void;
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
// HELPERS — GEAR GENERATION
// ============================================================

function getFloorZone(floor: number): { tier: GearTier; rarityWeights: Record<GearRarity, number>; gearDropChance: number; matType: MaterialType; matQty: [number, number] } {
  if (floor <= 20) return {
    tier: "iron",
    rarityWeights: { scrap: 60, common: 30, uncommon: 8, rare: 2, epic: 0, legendary: 0, mythic: 0 },
    gearDropChance: 0.40,
    matType: "crude",
    matQty: [2, 4],
  };
  if (floor <= 50) return {
    tier: "steel",
    rarityWeights: { scrap: 0, common: 50, uncommon: 30, rare: 15, epic: 4, legendary: 1, mythic: 0 },
    gearDropChance: 0.35,
    matType: "refined",
    matQty: [1, 3],
  };
  if (floor <= 100) return {
    tier: "shadow",
    rarityWeights: { scrap: 0, common: 0, uncommon: 40, rare: 35, epic: 18, legendary: 6, mythic: 1 },
    gearDropChance: 0.25,
    matType: "tempered",
    matQty: [1, 2],
  };
  if (floor <= 200) return {
    tier: "void",
    rarityWeights: { scrap: 0, common: 0, uncommon: 0, rare: 30, epic: 40, legendary: 25, mythic: 5 },
    gearDropChance: 0.15,
    matType: "voidmat",
    matQty: [1, 3],
  };
  return {
    tier: "celestial",
    rarityWeights: { scrap: 0, common: 0, uncommon: 0, rare: 0, epic: 30, legendary: 45, mythic: 25 },
    gearDropChance: 0.10,
    matType: "celestialmat",
    matQty: [1, 2],
  };
}

function rollRarity(weights: Record<GearRarity, number>): GearRarity {
  const entries = Object.entries(weights).filter(([, w]) => w > 0) as [GearRarity, number][];
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [rarity, w] of entries) {
    r -= w;
    if (r <= 0) return rarity;
  }
  return entries[entries.length - 1][0];
}

function getSocketCount(rarity: GearRarity): number {
  switch (rarity) {
    case "scrap":     return 0;
    case "common":    return 0;
    case "uncommon":  return 1;
    case "rare":      return 2;
    case "epic":      return 3;
    case "legendary": return 3;
    case "mythic":    return 4;
  }
}

function getStatCount(rarity: GearRarity): number {
  switch (rarity) {
    case "scrap":     return 1;
    case "common":    return 1;
    case "uncommon":  return 2;
    case "rare":      return 3;
    case "epic":      return 4;
    case "legendary": return 5;
    case "mythic":    return 6;
  }
}

function rollStats(slot: GearSlot, rarity: GearRarity, tier: GearTier): { stat: string; value: number }[] {
  const pool = SLOT_STATS[slot];
  const count = getStatCount(rarity);
  const tierMult = { iron: 1, steel: 1.5, shadow: 2.5, void: 4, celestial: 7 }[tier];
  const rarityMult = { scrap: 0.5, common: 1, uncommon: 1.3, rare: 1.8, epic: 2.5, legendary: 3.5, mythic: 5 }[rarity];
  const chosen: string[] = [];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    chosen.push(shuffled[i]);
  }
  return chosen.map((stat) => ({
    stat,
    value: Math.floor((5 + Math.random() * 15) * tierMult * rarityMult),
  }));
}

let gearIdCounter = 0;
function generateGearItem(slot: GearSlot, tier: GearTier, rarity: GearRarity): GearItem {
  const slotInfo = GEAR_SLOTS.find((s) => s.id === slot)!;
  const tierLabel = { iron: "Iron", steel: "Steel", shadow: "Shadow", void: "Void", celestial: "Celestial" }[tier];
  const sockets = getSocketCount(rarity);
  return {
    id: `gear_${Date.now()}_${gearIdCounter++}`,
    slot,
    tier,
    rarity,
    name: `${tierLabel} ${slotInfo.label}`,
    emoji: slotInfo.emoji,
    stats: rollStats(slot, rarity, tier),
    sockets,
    runes: Array(sockets).fill(null),
    isGear: true,
  };
}

function rollRandomSlot(): GearSlot {
  const slots = GEAR_SLOTS.map((s) => s.id);
  return slots[Math.floor(Math.random() * slots.length)];
}

function generateFloorDrops(floor: number): BagItem[] {
  const zone = getFloorZone(floor);
  const drops: BagItem[] = [];

  // Gear drop
  if (Math.random() < zone.gearDropChance) {
    const rarity = rollRarity(zone.rarityWeights);
    const slot = rollRandomSlot();
    drops.push(generateGearItem(slot, zone.tier, rarity));
  }

  // Material drop
  const [minQty, maxQty] = zone.matQty;
  const qty = minQty + Math.floor(Math.random() * (maxQty - minQty + 1));
  drops.push({ type: zone.matType, qty, isMaterial: true });

  // Floors 21-50 also drop some crude
  if (floor > 20 && floor <= 50 && Math.random() < 0.5) {
    drops.push({ type: "crude", qty: 1 + Math.floor(Math.random() * 2), isMaterial: true });
  }
  // Floors 51-100 also drop some refined
  if (floor > 50 && floor <= 100 && Math.random() < 0.4) {
    drops.push({ type: "refined", qty: 1, isMaterial: true });
  }
  // Floors 101-200 also drop tempered
  if (floor > 100 && floor <= 200 && Math.random() < 0.3) {
    drops.push({ type: "tempered", qty: 1, isMaterial: true });
  }
  // Floors 200+ rare celestial chance
  if (floor > 200 && Math.random() < 0.05) {
    drops.push({ type: "celestialmat", qty: 1, isMaterial: true });
  }

  return drops;
}

// ============================================================
// HELPERS — OFFLINE PROGRESS
// ============================================================

function weightedRandom<T extends { weight: number }>(table: T[]): T {
  const total = table.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const item of table) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return table[0];
}

function calculateOfflineProgress(profile: Profile): {
  summary: OfflineSummary;
  newBag: (BagItem | null)[];
  newTotalSteps: number;
  newDeepestFloor: number;
} | null {
  if (!profile.offlineTimestamp || profile.offlineFloor === null || !profile.offlineDungeon) return null;

  const now = Date.now();
  const rawSeconds = Math.floor((now - profile.offlineTimestamp) / 1000);
  const secondsAway = Math.min(rawSeconds, MAX_OFFLINE_SECONDS);
  if (secondsAway < 5) return null;

  const totalOfflineSteps = secondsAway * STEPS_PER_SECOND;
  const floorsCleared = Math.floor(totalOfflineSteps / STEPS_PER_FLOOR);
  const startFloor = profile.offlineFloor;
  const endFloor = startFloor + floorsCleared;

  const lootFound: BagItem[] = [];
  for (let f = startFloor + 1; f <= endFloor; f++) {
    const drops = generateFloorDrops(f);
    lootFound.push(...drops);
  }

  // Fill bag only — bag full = loot lost
  const newBag: (BagItem | null)[] = Array(BAG_SIZE).fill(null);
  for (const item of lootFound) {
    const emptySlot = newBag.findIndex((s) => s === null);
    if (emptySlot !== -1) {
      newBag[emptySlot] = item;
    }
  }

  const newTotalSteps = (profile.totalSteps ?? 0) + totalOfflineSteps;
  const newDeepestFloor = Math.max(profile.deepestFloor ?? 0, endFloor);

  return {
    summary: {
      secondsAway,
      floorsCleared,
      startFloor,
      endFloor,
      lootFound: lootFound.slice(0, 40),
      totalStepsEarned: totalOfflineSteps,
      deepestReached: endFloor,
      dungeon: profile.offlineDungeon,
    },
    newBag,
    newTotalSteps,
    newDeepestFloor,
  };
}

// ============================================================
// INITIAL STATE BUILDER
// ============================================================

const EMPTY_EQUIPPED: Record<GearSlot, GearItem | null> = {
  helmet: null, gloves: null, chest: null, pants: null,
  boots: null, backpack: null, weapon: null, ring: null, amulet: null,
};

const EMPTY_MATERIALS: Materials = {
  crude: 0, refined: 0, tempered: 0, voidmat: 0, celestialmat: 0,
};

function buildInitialState(
  profile: Profile,
  resumeInDungeon = false,
  resumeFloor = 0,
  resumeBag: (BagItem | null)[] = []
): GameState {
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
    bag: resumeInDungeon && resumeBag.length > 0 ? resumeBag : Array(BAG_SIZE).fill(null),
    bagSize: BAG_SIZE,
    stash: (profile.stash as GearItem[]) ?? [],
    stashSize: STASH_SIZE,
    equippedGear: (profile.equippedGear as Record<GearSlot, GearItem | null>) ?? { ...EMPTY_EQUIPPED },
    materials: (profile.materials as Materials) ?? { ...EMPTY_MATERIALS },
    runes: (profile.runes as RuneInventory) ?? {},
    runs: profile.runs ?? 0,
    lives: profile.lives ?? 1,
    dungeons,
  };
}

// ============================================================
// GEAR STAT HELPERS
// ============================================================

/** Sum a named stat across all equipped gear pieces */
export function getEquippedStatTotal(equippedGear: Record<GearSlot, GearItem | null>, statName: string): number {
  return GEAR_SLOTS.reduce((total, slot) => {
    const piece = equippedGear[slot.id];
    if (!piece) return total;
    const found = piece.stats.find((s) => s.stat === statName);
    return total + (found ? found.value : 0);
  }, 0);
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
  const offlineResult = useRef<ReturnType<typeof calculateOfflineProgress>>(null);
  const offlineSummaryRef = useRef<OfflineSummary | null>(null);
  const resumeInDungeonRef = useRef(false);
  const resumeFloorRef = useRef(0);

  const [initialState] = useState<GameState>(() => {
    const result = calculateOfflineProgress(profile);
    offlineResult.current = result;
    if (result) {
      offlineSummaryRef.current = result.summary;
      const resumeFloor = result.summary.endFloor;
      resumeInDungeonRef.current = true;
      resumeFloorRef.current = resumeFloor;
      const updatedProfile: Profile = {
        ...profile,
        totalSteps: result.newTotalSteps,
        deepestFloor: result.newDeepestFloor,
        currentDungeon: result.summary.dungeon,
        offlineTimestamp: null,
        offlineFloor: null,
        offlineDungeon: null,
      };
      return buildInitialState(updatedProfile, true, resumeFloor, result.newBag);
    }
    if (profile.offlineTimestamp && profile.offlineFloor !== null && profile.offlineDungeon) {
      resumeInDungeonRef.current = true;
      resumeFloorRef.current = profile.offlineFloor;
      return buildInitialState(profile, true, profile.offlineFloor);
    }
    return buildInitialState(profile);
  });

  const [state, setState] = useState<GameState>(initialState);
  const [offlineSummary, setOfflineSummary] = useState<OfflineSummary | null>(() => offlineSummaryRef.current);
  const [log, setLog] = useState<LogEntry[]>(() => {
    const entries: LogEntry[] = [
      { id: logIdCounter++, text: `🗡 ${profile.name} awakens...`, cls: "log-muted", timestamp: Date.now() },
    ];
    if (offlineSummaryRef.current) {
      const s = offlineSummaryRef.current;
      const mins = Math.floor(s.secondsAway / 60);
      entries.unshift({ id: logIdCounter++, text: `⏰ Offline ${mins}m — cleared ${s.floorsCleared} floors!`, cls: "log-gold", timestamp: Date.now() });
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
        totalSteps: r.newTotalSteps,
        deepestFloor: r.newDeepestFloor,
        offlineTimestamp: null,
        offlineFloor: null,
        offlineDungeon: null,
      });
    }
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
      const offlineData = s.isInDungeon && !s.isReturning
        ? { offlineTimestamp: Date.now(), offlineFloor: s.currentFloor, offlineDungeon: s.currentDungeon }
        : { offlineTimestamp: null, offlineFloor: null, offlineDungeon: null };
      onSaveRef.current({
        totalSteps: s.totalSteps,
        deepestFloor: s.deepestFloor,
        currentDungeon: s.currentDungeon,
        stash: s.stash,
        equippedGear: s.equippedGear,
        materials: s.materials,
        runes: s.runes,
        runs: s.runs,
        lives: s.lives,
        ...offlineData,
      });
      setLastSaved(Date.now());
    }, 5000);
    return () => { if (saveTimerRef.current) clearInterval(saveTimerRef.current); };
  }, []);

  // ---- Save on key state changes ----
  useEffect(() => {
    const s = stateRef.current;
    const offlineData = s.isInDungeon && !s.isReturning
      ? { offlineTimestamp: Date.now(), offlineFloor: s.currentFloor, offlineDungeon: s.currentDungeon }
      : { offlineTimestamp: null, offlineFloor: null, offlineDungeon: null };
    onSaveRef.current({
      totalSteps: s.totalSteps,
      deepestFloor: s.deepestFloor,
      currentDungeon: s.currentDungeon,
      stash: s.stash,
      equippedGear: s.equippedGear,
      materials: s.materials,
      runes: s.runes,
      runs: s.runs,
      lives: s.lives,
      ...offlineData,
    });
    setLastSaved(Date.now());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.deepestFloor, state.stash, state.runs, state.isInDungeon, state.currentFloor, state.equippedGear, state.materials]);

  const addLog = useCallback((text: string, cls = "") => {
    setLog((prev) => [{ id: logIdCounter++, text, cls, timestamp: Date.now() }, ...prev.slice(0, 49)]);
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
    setTimeout(() => setLootPopups((prev) => prev.filter((p) => p.id !== id)), 1600);
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
    if (walkIntervalRef.current) { clearInterval(walkIntervalRef.current); walkIntervalRef.current = null; }
  }, []);

  function tickSteps(prev: GameState, n: number): GameState {
    // Apply Step Efficiency bonus from equipped gear
    const stepEfficiency = getEquippedStatTotal(prev.equippedGear, 'Steps Efficiency');
    const effectiveSteps = Math.round(n * (1 + stepEfficiency / 100));

    // Apply Bag Slots bonus — recalculate bagSize dynamically
    const bagSlotBonus = Math.floor(getEquippedStatTotal(prev.equippedGear, 'Bag Slots'));
    const newBagSize = BAG_SIZE + bagSlotBonus;

    const next = { ...prev, totalSteps: prev.totalSteps + effectiveSteps, bagSize: newBagSize };
    if (prev.isReturning) {
      const walked = prev.returnStepsWalked + effectiveSteps;
      return { ...next, returnStepsWalked: walked };
    }
    const newSteps = prev.steps + effectiveSteps;
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

      // Roll floor drops
      const drops = generateFloorDrops(floor);
      setState((prev) => {
        const newBag = [...prev.bag];
        let added = 0;
        for (const drop of drops) {
          const emptySlot = newBag.findIndex((s) => s === null);
          if (emptySlot !== -1) {
            newBag[emptySlot] = drop;
            added++;
            if ('isMaterial' in drop) {
              const matInfo = MATERIAL_INFO[(drop as MaterialItem).type];
              addLog(`${matInfo.emoji} Found ${(drop as MaterialItem).qty}x ${matInfo.label}`, "");
              spawnLootPopup(matInfo.emoji);
            } else {
              const gear = drop as GearItem;
              const cls = gear.rarity === "legendary" || gear.rarity === "mythic" ? "log-gold"
                : gear.rarity === "epic" ? "log-gem"
                : gear.rarity === "rare" ? "log-gem" : "";
              addLog(`${gear.emoji} Found ${gear.name} [${RARITY_LABELS[gear.rarity]}]`, cls);
              spawnLootPopup(gear.emoji);
            }
          } else {
            addLog("⚠ Bag full! Return to base.", "log-red");
            break;
          }
        }
        return added > 0 ? { ...prev, bag: newBag } : prev;
      });

      // Boss floor
      if (floor % 10 === 0) {
        showNotif(`💀 BOSS FLOOR ${floor}!`);
        addLog(`💀 Boss encountered on floor ${floor}!`, "log-red");
      }

      // Dungeon unlocks
      DUNGEONS.forEach((d) => {
        if (!d.unlocked && d.unlockFloor > 0 && floor >= d.unlockFloor) {
          setState((p) => ({
            ...p,
            dungeons: p.dungeons.map((dd) => dd.id === d.id ? { ...dd, unlocked: true } : dd),
          }));
          showNotif(`🗺 ${d.name} UNLOCKED!`);
          addLog(`🗺 New dungeon unlocked: ${d.name}!`, "log-gold");
        }
      });
    }
  }, [state.currentFloor, state.isInDungeon, state.isReturning, addLog, showNotif, spawnLootPopup]);

  // ---- Watch for return completion ----
  useEffect(() => {
    if (state.isReturning && state.returnStepsWalked >= state.returnStepsNeeded && state.returnStepsNeeded > 0) {
      arriveAtBase();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.returnStepsWalked, state.returnStepsNeeded, state.isReturning]);

  function arriveAtBase() {
    stopWalkInterval();
    setState((prev) => {
      // Sort bag: gear goes to stash, materials go to materials inventory
      const newStash = [...prev.stash];
      const newMaterials = { ...prev.materials };
      let gearStashed = 0;
      let matsCollected = 0;

      prev.bag.forEach((item) => {
        if (!item) return;
        if ('isMaterial' in item) {
          const mat = item as MaterialItem;
          newMaterials[mat.type] = (newMaterials[mat.type] ?? 0) + mat.qty;
          matsCollected += mat.qty;
        } else {
          const gear = item as GearItem;
          if (newStash.length < prev.stashSize) {
            newStash.push(gear);
            gearStashed++;
          }
        }
      });

      if (gearStashed > 0) addLog(`📦 Stashed ${gearStashed} gear piece${gearStashed > 1 ? "s" : ""}!`, "log-green");
      if (matsCollected > 0) addLog(`⚙️ Collected materials!`, "log-gem");
      if (gearStashed === 0 && matsCollected === 0) addLog("🏠 Returned to base empty-handed.", "log-muted");
      addLog("🏠 Back at base. Rest up, adventurer.", "log-gold");
      showNotif("🏠 BACK AT BASE!");

      return {
        ...prev,
        isInDungeon: false,
        isReturning: false,
        currentFloor: 0,
        steps: 0,
        returnStepsWalked: 0,
        returnStepsNeeded: 0,
        bag: Array(prev.bagSize).fill(null),
        stash: newStash,
        materials: newMaterials,
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
      return { ...prev, isReturning: true, returnStepsNeeded: needed, returnStepsWalked: 0 };
    });
    if (stateRef.current.currentFloor === 0) arriveAtBase();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addLog]);

  const selectDungeon = useCallback((id: string) => {
    setState((prev) => {
      if (prev.isInDungeon || prev.isReturning) { showNotif("RETURN TO BASE FIRST!"); return prev; }
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
      const label = 'isMaterial' in item ? MATERIAL_INFO[(item as MaterialItem).type].label : (item as GearItem).name;
      addLog(`🗑 Dropped ${label}`, "log-muted");
      const newBag = [...prev.bag];
      newBag[idx] = null;
      return { ...prev, bag: newBag };
    });
  }, [addLog]);

  const equipFromBag = useCallback((bagIdx: number) => {
    setState((prev) => {
      const item = prev.bag[bagIdx];
      if (!item || 'isMaterial' in item) return prev;
      const gear = item as GearItem;
      const currentEquipped = prev.equippedGear[gear.slot];
      const newBag = [...prev.bag];
      newBag[bagIdx] = currentEquipped; // swap old equipped into bag slot
      const newEquipped = { ...prev.equippedGear, [gear.slot]: gear };
      addLog(`⚔️ Equipped ${gear.name} [${RARITY_LABELS[gear.rarity]}]`, "log-gold");
      return { ...prev, bag: newBag, equippedGear: newEquipped };
    });
  }, [addLog]);

  // ---- Crafting actions (base only) ----
  const craftConvert = useCallback((from: MaterialType) => {
    setState((prev) => {
      if (prev.isInDungeon) { showNotif("RETURN TO BASE TO CRAFT!"); return prev; }
      const toMap: Record<MaterialType, MaterialType | null> = {
        crude: "refined", refined: "tempered", tempered: "voidmat", voidmat: "celestialmat", celestialmat: null,
      };
      const to = toMap[from];
      if (!to) { showNotif("ALREADY MAX TIER!"); return prev; }
      if ((prev.materials[from] ?? 0) < 5) { showNotif("NEED 5 TO CONVERT!"); return prev; }
      const newMats = { ...prev.materials, [from]: prev.materials[from] - 5, [to]: (prev.materials[to] ?? 0) + 1 };
      addLog(`⚗️ Converted 5 ${MATERIAL_INFO[from].label} → 1 ${MATERIAL_INFO[to].label}`, "log-gem");
      return { ...prev, materials: newMats };
    });
  }, [addLog, showNotif]);

  const craftReroll = useCallback((gearId: string) => {
    setState((prev) => {
      if (prev.isInDungeon) { showNotif("RETURN TO BASE TO CRAFT!"); return prev; }
      const gear = prev.stash.find((g) => g.id === gearId);
      if (!gear) return prev;
      const costs: Record<GearRarity, { type: MaterialType; qty: number }> = {
        scrap:     { type: "crude",    qty: 10 },
        common:    { type: "crude",    qty: 10 },
        uncommon:  { type: "crude",    qty: 10 },
        rare:      { type: "refined",  qty: 5 },
        epic:      { type: "tempered", qty: 3 },
        legendary: { type: "voidmat",  qty: 2 },
        mythic:    { type: "voidmat",  qty: 2 },
      };
      const cost = costs[gear.rarity];
      if ((prev.materials[cost.type] ?? 0) < cost.qty) { showNotif(`NEED ${cost.qty} ${MATERIAL_INFO[cost.type].label.toUpperCase()}!`); return prev; }
      const newStats = rollStats(gear.slot, gear.rarity, gear.tier);
      const newStash = prev.stash.map((g) => g.id === gearId ? { ...g, stats: newStats } : g);
      const newMats = { ...prev.materials, [cost.type]: prev.materials[cost.type] - cost.qty };
      addLog(`🎲 Rerolled stats on ${gear.name}`, "log-gem");
      return { ...prev, stash: newStash, materials: newMats };
    });
  }, [addLog, showNotif]);

  const craftSocket = useCallback((gearId: string) => {
    setState((prev) => {
      if (prev.isInDungeon) { showNotif("RETURN TO BASE TO CRAFT!"); return prev; }
      const gear = prev.stash.find((g) => g.id === gearId);
      if (!gear) return prev;
      const maxSockets = getSocketCount(gear.rarity);
      if (gear.sockets >= maxSockets) { showNotif("MAX SOCKETS REACHED!"); return prev; }
      const costs: Partial<Record<GearRarity, { type: MaterialType; qty: number; type2: MaterialType; qty2: number }>> = {
        uncommon:  { type: "crude",    qty: 20, type2: "refined",   qty2: 5 },
        rare:      { type: "refined",  qty: 15, type2: "tempered",  qty2: 5 },
        epic:      { type: "tempered", qty: 10, type2: "voidmat",   qty2: 3 },
      };
      const cost = costs[gear.rarity];
      if (!cost) { showNotif("RARITY TOO LOW FOR SOCKETS!"); return prev; }
      if ((prev.materials[cost.type] ?? 0) < cost.qty || (prev.materials[cost.type2] ?? 0) < cost.qty2) {
        showNotif("NOT ENOUGH MATERIALS!"); return prev;
      }
      const newStash = prev.stash.map((g) => g.id === gearId ? { ...g, sockets: g.sockets + 1, runes: [...g.runes, null] } : g);
      const newMats = { ...prev.materials, [cost.type]: prev.materials[cost.type] - cost.qty, [cost.type2]: prev.materials[cost.type2] - cost.qty2 };
      addLog(`🔮 Added socket to ${gear.name}`, "log-gold");
      return { ...prev, stash: newStash, materials: newMats };
    });
  }, [addLog, showNotif]);

  const craftTierUp = useCallback((gearId: string) => {
    setState((prev) => {
      if (prev.isInDungeon) { showNotif("RETURN TO BASE TO CRAFT!"); return prev; }
      const gear = prev.stash.find((g) => g.id === gearId);
      if (!gear) return prev;
      const tierUp: Record<GearTier, { next: GearTier | null; cost: { type: MaterialType; qty: number; type2: MaterialType; qty2: number } }> = {
        iron:      { next: "steel",     cost: { type: "crude",    qty: 50, type2: "refined",   qty2: 20 } },
        steel:     { next: "shadow",    cost: { type: "refined",  qty: 40, type2: "tempered",  qty2: 15 } },
        shadow:    { next: "void",      cost: { type: "tempered", qty: 30, type2: "voidmat",   qty2: 10 } },
        void:      { next: "celestial", cost: { type: "voidmat",  qty: 20, type2: "celestialmat", qty2: 5 } },
        celestial: { next: null, cost: { type: "celestialmat", qty: 0, type2: "celestialmat", qty2: 0 } },
      };
      const upgrade = tierUp[gear.tier];
      if (!upgrade.next) { showNotif("ALREADY MAX TIER!"); return prev; }
      const { type, qty, type2, qty2 } = upgrade.cost;
      if ((prev.materials[type] ?? 0) < qty || (prev.materials[type2] ?? 0) < qty2) {
        showNotif("NOT ENOUGH MATERIALS!"); return prev;
      }
      const newTier = upgrade.next;
      const slotInfo = GEAR_SLOTS.find((s) => s.id === gear.slot)!;
      const tierLabel = { iron: "Iron", steel: "Steel", shadow: "Shadow", void: "Void", celestial: "Celestial" }[newTier];
      const newStash = prev.stash.map((g) => g.id === gearId ? {
        ...g, tier: newTier, name: `${tierLabel} ${slotInfo.label}`,
        stats: rollStats(g.slot, g.rarity, newTier),
      } : g);
      const newMats = { ...prev.materials, [type]: prev.materials[type] - qty, [type2]: prev.materials[type2] - qty2 };
      addLog(`⬆️ Upgraded ${gear.name} to ${TIER_LABELS[newTier]}!`, "log-gold");
      return { ...prev, stash: newStash, materials: newMats };
    });
  }, [addLog, showNotif]);

  const combineRune = useCallback((runeId: string) => {
    setState((prev) => {
      if (prev.isInDungeon) { showNotif("RETURN TO BASE TO CRAFT!"); return prev; }
      const rune = RUNES.find((r) => r.id === runeId);
      if (!rune || !rune.nextId) { showNotif("ALREADY MAX GRADE!"); return prev; }
      if ((prev.runes[runeId] ?? 0) < 3) { showNotif("NEED 3 TO COMBINE!"); return prev; }
      const newRunes = { ...prev.runes, [runeId]: prev.runes[runeId] - 3, [rune.nextId]: (prev.runes[rune.nextId] ?? 0) + 1 };
      const nextRune = RUNES.find((r) => r.id === rune.nextId)!;
      addLog(`✨ Combined 3x ${rune.name} → ${nextRune.name}!`, "log-gold");
      return { ...prev, runes: newRunes };
    });
  }, [addLog, showNotif]);

  const socketRune = useCallback((gearId: string, socketIdx: number, runeId: string) => {
    setState((prev) => {
      if (prev.isInDungeon) { showNotif("RETURN TO BASE TO CRAFT!"); return prev; }
      const gear = prev.stash.find((g) => g.id === gearId);
      if (!gear || socketIdx >= gear.sockets) return prev;
      if ((prev.runes[runeId] ?? 0) < 1) { showNotif("NO RUNE AVAILABLE!"); return prev; }
      const oldRune = gear.runes[socketIdx];
      const newRunes = { ...prev.runes, [runeId]: prev.runes[runeId] - 1 };
      if (oldRune) newRunes[oldRune] = (newRunes[oldRune] ?? 0) + 1; // return old rune
      const newStash = prev.stash.map((g) => {
        if (g.id !== gearId) return g;
        const newRuneArr = [...g.runes];
        newRuneArr[socketIdx] = runeId;
        return { ...g, runes: newRuneArr };
      });
      const rune = RUNES.find((r) => r.id === runeId)!;
      addLog(`🔮 Socketed ${rune.name} into ${gear.name}`, "log-gem");
      return { ...prev, stash: newStash, runes: newRunes };
    });
  }, [addLog, showNotif]);

  const clearOfflineSummary = useCallback(() => setOfflineSummary(null), []);

  const saveNow = useCallback(() => {
    const s = stateRef.current;
    const offlineData = s.isInDungeon && !s.isReturning
      ? { offlineTimestamp: Date.now(), offlineFloor: s.currentFloor, offlineDungeon: s.currentDungeon }
      : { offlineTimestamp: null, offlineFloor: null, offlineDungeon: null };
    onSaveRef.current({
      totalSteps: s.totalSteps,
      deepestFloor: s.deepestFloor,
      currentDungeon: s.currentDungeon,
      stash: s.stash,
      equippedGear: s.equippedGear,
      materials: s.materials,
      runes: s.runes,
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
      equipFromBag,
      craftConvert,
      craftReroll,
      craftSocket,
      craftTierUp,
      combineRune,
      socketRune,
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
