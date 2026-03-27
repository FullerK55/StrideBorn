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
export type GearTier = "iron" | "steel" | "shadow" | "void" | "celestial" | "obsidian" | "runic" | "spectral" | "primordial" | "eternal";
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
  iron:       "Tier 1 Iron",
  steel:      "Tier 2 Steel",
  shadow:     "Tier 3 Shadow",
  void:       "Tier 4 Void",
  celestial:  "Tier 5 Celestial",
  obsidian:   "Tier 6 Obsidian",
  runic:      "Tier 7 Runic",
  spectral:   "Tier 8 Spectral",
  primordial: "Tier 9 Primordial",
  eternal:    "Tier 10 Eternal",
};

export const TIER_ORDER: GearTier[] = ["iron","steel","shadow","void","celestial","obsidian","runic","spectral","primordial","eternal"];

export const TIER_COLORS: Record<GearTier, string> = {
  iron:       "#a0a0a0",
  steel:      "#88aacc",
  shadow:     "#aa44ff",
  void:       "#4444ff",
  celestial:  "#ffcc00",
  obsidian:   "#222222",
  runic:      "#00ffaa",
  spectral:   "#ff88ff",
  primordial: "#ff6600",
  eternal:    "#ffffff",
};

// Enhancement XP thresholds per tier upgrade (cost to go from tier N to N+1)
export const ENHANCE_XP_THRESHOLDS: Partial<Record<GearTier, number>> = {
  iron:       100,
  steel:      250,
  shadow:     600,
  void:       1500,
  celestial:  3500,
  obsidian:   8000,
  runic:      18000,
  spectral:   40000,
  primordial: 90000,
  // eternal is max tier — no upgrade
};

// XP contributed by sacrificing a gear piece: tierLevel * rarityLevel * 10
export const TIER_XP_VALUE: Record<GearTier, number> = {
  iron:       1,
  steel:      2,
  shadow:     4,
  void:       8,
  celestial:  16,
  obsidian:   32,
  runic:      64,
  spectral:   128,
  primordial: 256,
  eternal:    512,
};
export const RARITY_XP_VALUE: Record<GearRarity, number> = {
  scrap:     1,
  common:    2,
  uncommon:  4,
  rare:      8,
  epic:      16,
  legendary: 32,
  mythic:    64,
};
export const MATERIAL_XP_VALUE: Record<MaterialType, number> = {
  crude:        2,
  refined:      5,
  tempered:     12,
  voidmat:      30,
  celestialmat: 75,
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
  enhancementXp: number;    // XP accumulated toward next tier upgrade
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

// Quest types
export type QuestStatus = "available" | "active" | "completed" | "turned_in";
export interface Quest {
  id: string;
  title: string;
  description: string;
  objective: { type: "reach_floor" | "find_rarity" | "complete_runs" | "collect_materials" | "earn_gold"; target: number; rarity?: GearRarity; matType?: MaterialType };
  progress: number;
  reward: { gold: number; materials?: { type: MaterialType; qty: number } };
  status: QuestStatus;
  expiresAt: number; // timestamp
}

// Vendor types
export interface VendorItem {
  id: string;
  type: "gear" | "material" | "reroll" | "socket";
  label: string;
  emoji: string;
  cost: number;
  gear?: GearItem;
  matType?: MaterialType;
  matQty?: number;
}

export interface ActiveVendor {
  floor: number;
  items: VendorItem[];
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
  gold: number;
  quests: Quest[];
  activeVendor: ActiveVendor | null;
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
  acceptQuest: (questId: string) => void;
  turnInQuest: (questId: string) => void;
  buyFromVendor: (itemId: string) => void;
  dismissVendor: () => void;
  salvageGear: (gearId: string) => void;
  shopReroll: (gearId: string) => void;
  shopBuyBagSlot: () => void;
  enhanceGear: (targetId: string, sacrificeGearIds: string[], sacrificeMaterials: Partial<Materials>) => void;
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
  const tierMult: Record<GearTier, number> = { iron: 1, steel: 1.5, shadow: 2.5, void: 4, celestial: 7, obsidian: 11, runic: 17, spectral: 26, primordial: 40, eternal: 60 };
  const tm = tierMult[tier];
  const rarityMult = { scrap: 0.5, common: 1, uncommon: 1.3, rare: 1.8, epic: 2.5, legendary: 3.5, mythic: 5 }[rarity];
  const chosen: string[] = [];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    chosen.push(shuffled[i]);
  }
  return chosen.map((stat) => ({
    stat,
    value: Math.floor((5 + Math.random() * 15) * tm * rarityMult),
  }));
}

let gearIdCounter = 0;
function generateGearItem(slot: GearSlot, tier: GearTier, rarity: GearRarity): GearItem {
  const slotInfo = GEAR_SLOTS.find((s) => s.id === slot)!;
  const tierLabel: Record<GearTier, string> = { iron: "Iron", steel: "Steel", shadow: "Shadow", void: "Void", celestial: "Celestial", obsidian: "Obsidian", runic: "Runic", spectral: "Spectral", primordial: "Primordial", eternal: "Eternal" };
  const tLabel = tierLabel[tier];
  const sockets = getSocketCount(rarity);
  return {
    id: `gear_${Date.now()}_${gearIdCounter++}`,
    slot,
    tier,
    rarity,
    name: `${tLabel} ${slotInfo.label}`,
    emoji: slotInfo.emoji,
    stats: rollStats(slot, rarity, tier),
    sockets,
    runes: Array(sockets).fill(null),
    enhancementXp: 0,
    isGear: true,
  };
}

function rollRandomSlot(): GearSlot {
  const slots = GEAR_SLOTS.map((s) => s.id);
  return slots[Math.floor(Math.random() * slots.length)];
}

function generateFloorDrops(
  floor: number,
  lootFindBonus = 0,
  itemRarityBonus = 0,
  materialYieldBonus = 0
): BagItem[] {
  const zone = getFloorZone(floor);
  const drops: BagItem[] = [];

  // Loot Find: base 1 gear roll + bonus rolls (each 100 Loot Find = +1 extra roll)
  const baseGearRolls = 1;
  const extraRolls = Math.floor(lootFindBonus / 100);
  const totalGearRolls = baseGearRolls + extraRolls;

  // Item Rarity: shift rarity weights toward higher tiers
  // Each 10 Item Rarity shifts 5% weight from lower to higher rarities
  function applyRarityBonus(weights: Record<GearRarity, number>): Record<GearRarity, number> {
    if (itemRarityBonus <= 0) return weights;
    const shift = Math.min(itemRarityBonus * 0.5, 40); // cap at 40% shift
    const w = { ...weights };
    const shiftFrom: GearRarity[] = ["scrap", "common", "uncommon"];
    const shiftTo: GearRarity[] = ["rare", "epic", "legendary", "mythic"];
    let remaining = shift;
    for (const r of shiftFrom) {
      const take = Math.min(w[r], remaining);
      w[r] -= take;
      remaining -= take;
      if (remaining <= 0) break;
    }
    const perTier = (shift - remaining) / shiftTo.length;
    for (const r of shiftTo) w[r] += perTier;
    return w;
  }

  const adjustedWeights = applyRarityBonus(zone.rarityWeights);

  for (let roll = 0; roll < totalGearRolls; roll++) {
    if (Math.random() < zone.gearDropChance) {
      const rarity = rollRarity(adjustedWeights);
      const slot = rollRandomSlot();
      drops.push(generateGearItem(slot, zone.tier, rarity));
    }
  }

  // Material drop — Material Yield bonus increases quantity
  const yieldMult = 1 + materialYieldBonus / 100;
  const [minQty, maxQty] = zone.matQty;
  const baseQty = minQty + Math.floor(Math.random() * (maxQty - minQty + 1));
  const qty = Math.max(1, Math.round(baseQty * yieldMult));
  drops.push({ type: zone.matType, qty, isMaterial: true });

  // Floors 21-50 also drop some crude
  if (floor > 20 && floor <= 50 && Math.random() < 0.5) {
    drops.push({ type: "crude", qty: Math.max(1, Math.round((1 + Math.floor(Math.random() * 2)) * yieldMult)), isMaterial: true });
  }
  // Floors 51-100 also drop some refined
  if (floor > 50 && floor <= 100 && Math.random() < 0.4) {
    drops.push({ type: "refined", qty: Math.max(1, Math.round(yieldMult)), isMaterial: true });
  }
  // Floors 101-200 also drop tempered
  if (floor > 100 && floor <= 200 && Math.random() < 0.3) {
    drops.push({ type: "tempered", qty: Math.max(1, Math.round(yieldMult)), isMaterial: true });
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
  // Use the profile's saved bag size (includes shop purchases + gear bonuses at time of save)
  const savedBagSize = (profile.bagSize as number | undefined) ?? BAG_SIZE;
  const existingBag: (BagItem | null)[] = Array.isArray(profile.bag)
    ? (profile.bag as (BagItem | null)[])
    : Array(savedBagSize).fill(null);
  const newBag: (BagItem | null)[] = existingBag.length < savedBagSize
    ? [...existingBag, ...Array(savedBagSize - existingBag.length).fill(null)]
    : [...existingBag];
  for (const item of lootFound) {
    const emptySlot = newBag.findIndex((s, idx) => s === null && idx < savedBagSize);
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
// GOLD HELPERS
// ============================================================

/** Gold earned per floor — slow scaling, boosted by Gold Find stat */
export function calcGoldForFloor(floor: number, goldFind: number): number {
  const base = 5 + Math.floor(floor * 0.8);
  const bonus = 1 + goldFind / 100;
  return Math.round(base * bonus);
}

// ============================================================
// QUEST GENERATION
// ============================================================

const QUEST_TEMPLATES: Array<{
  title: string;
  desc: (t: number) => string;
  objective: Quest["objective"];
  reward: (t: number) => Quest["reward"];
}> = [
  { title: "Deep Delver",    desc: (t) => `Reach floor ${t} in any dungeon`,       objective: { type: "reach_floor",      target: 0 }, reward: (t) => ({ gold: t * 10 }) },
  { title: "Rarity Hunter",  desc: (t) => `Find ${t} Rare or better items`,         objective: { type: "find_rarity",      target: 0, rarity: "rare" }, reward: (t) => ({ gold: t * 20 }) },
  { title: "Seasoned Runner",desc: (t) => `Complete ${t} dungeon runs`,              objective: { type: "complete_runs",    target: 0 }, reward: (t) => ({ gold: t * 30 }) },
  { title: "Material Hoarder",desc:(t) => `Collect ${t} Crude materials`,           objective: { type: "collect_materials", target: 0, matType: "crude" }, reward: (t) => ({ gold: t * 5, materials: { type: "refined" as MaterialType, qty: Math.ceil(t / 10) } }) },
  { title: "Gold Rush",      desc: (t) => `Earn ${t} gold from dungeon runs`,       objective: { type: "earn_gold",        target: 0 }, reward: (t) => ({ gold: Math.round(t * 0.5) }) },
];

export function generateDailyQuests(): Quest[] {
  const now = Date.now();
  // Expire at midnight UTC
  const tomorrow = new Date();
  tomorrow.setUTCHours(24, 0, 0, 0);
  const expiresAt = tomorrow.getTime();

  const targets = [15, 25, 40, 3, 5, 8, 50, 100, 200, 500];
  const quests: Quest[] = [];
  const used = new Set<number>();

  for (let i = 0; i < 4; i++) {
    let tIdx = Math.floor(Math.random() * QUEST_TEMPLATES.length);
    // Avoid duplicate types
    let attempts = 0;
    while (used.has(tIdx) && attempts < 10) { tIdx = Math.floor(Math.random() * QUEST_TEMPLATES.length); attempts++; }
    used.add(tIdx);
    const tmpl = QUEST_TEMPLATES[tIdx];
    const target = targets[Math.floor(Math.random() * targets.length)];
    const obj = { ...tmpl.objective, target };
    quests.push({
      id: `quest_${now}_${i}`,
      title: tmpl.title,
      description: tmpl.desc(target),
      objective: obj,
      progress: 0,
      reward: tmpl.reward(target),
      status: "available",
      expiresAt,
    });
  }
  return quests;
}

// ============================================================
// VENDOR GENERATION
// ============================================================

export function generateVendorItems(floor: number): VendorItem[] {
  const tier: GearTier = floor < 40 ? "iron" : floor < 80 ? "steel" : floor < 120 ? "shadow" : floor < 160 ? "void" : "celestial";
  const items: VendorItem[] = [];
  // 1-2 random gear pieces
  const slots: GearSlot[] = ["helmet", "gloves", "chest", "pants", "boots", "backpack", "weapon", "ring", "amulet"];
  const rarities: GearRarity[] = floor < 20 ? ["common", "uncommon"] : floor < 50 ? ["uncommon", "rare"] : floor < 100 ? ["rare", "epic"] : ["epic", "legendary"];
  for (let i = 0; i < 2; i++) {
    const slot = slots[Math.floor(Math.random() * slots.length)];
    const rarity = rarities[Math.floor(Math.random() * rarities.length)];
    const gear = generateGearItem(slot, tier, rarity);
    const baseCost = { common: 30, uncommon: 60, rare: 120, epic: 250, legendary: 500, mythic: 1000, scrap: 10 }[rarity];
    items.push({ id: `vi_${Date.now()}_${i}`, type: "gear", label: gear.name, emoji: gear.emoji, cost: baseCost + Math.floor(floor * 2), gear });
  }
  // 1 material bundle
  const matTypes: MaterialType[] = ["crude", "refined", "tempered", "voidmat", "celestialmat"];
  const matIdx = Math.min(Math.floor(floor / 40), 4);
  const matType = matTypes[matIdx];
  const matQty = 10 + Math.floor(floor / 10);
  const matCost = [20, 50, 100, 200, 400][matIdx];
  items.push({ id: `vi_mat_${Date.now()}`, type: "material", label: `${matQty}x ${MATERIAL_INFO[matType].label}`, emoji: MATERIAL_INFO[matType].emoji, cost: matCost, matType, matQty });
  // 1 service: reroll or socket
  const svcCost = 80 + floor * 3;
  items.push({ id: `vi_svc_${Date.now()}`, type: "reroll", label: "Stat Reroll (any stash item)", emoji: "🎲", cost: svcCost });
  return items;
}

// ============================================================
// SALVAGE HELPERS
// ============================================================

export function salvageYield(gear: GearItem, salvageYieldBonus: number): { type: MaterialType; qty: number }[] {
  const tierMat: Record<GearTier, MaterialType> = { iron: "crude", steel: "refined", shadow: "tempered", void: "voidmat", celestial: "celestialmat", obsidian: "celestialmat", runic: "celestialmat", spectral: "celestialmat", primordial: "celestialmat", eternal: "celestialmat" };
  const rarityQty: Record<GearRarity, number> = { scrap: 1, common: 2, uncommon: 4, rare: 8, epic: 15, legendary: 25, mythic: 40 };
  const mat = tierMat[gear.tier];
  const qty = Math.round(rarityQty[gear.rarity] * (1 + salvageYieldBonus / 100));
  return [{ type: mat, qty }];
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
    gold: (profile as Profile & { gold?: number }).gold ?? 0,
    quests: (profile as Profile & { quests?: Quest[] }).quests ?? generateDailyQuests(),
    activeVendor: null,
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

      // Roll floor drops — pass gear stat bonuses
      const lootFind = getEquippedStatTotal(stateRef.current.equippedGear, 'Loot Find');
      const itemRarity = getEquippedStatTotal(stateRef.current.equippedGear, 'Item Rarity');
      const materialYield = getEquippedStatTotal(stateRef.current.equippedGear, 'Material Yield');
      const drops = generateFloorDrops(floor, lootFind, itemRarity, materialYield);
      setState((prev) => {
        // Use prev.bagSize (dynamic — includes gear bonuses + shop purchases)
        // Ensure the bag array is at least bagSize long before filling
        const currentBag = prev.bag.length < prev.bagSize
          ? [...prev.bag, ...Array(prev.bagSize - prev.bag.length).fill(null)]
          : [...prev.bag];
        let added = 0;
        for (const drop of drops) {
          const emptySlot = currentBag.findIndex((s, idx) => s === null && idx < prev.bagSize);
          if (emptySlot !== -1) {
            currentBag[emptySlot] = drop;
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
        return added > 0 ? { ...prev, bag: currentBag } : prev;
      });

      // Boss floor
      if (floor % 10 === 0) {
        showNotif(`💀 BOSS FLOOR ${floor}!`);
        addLog(`💀 Boss encountered on floor ${floor}!`, "log-red");
      }

      // Gold drop per floor
      setState((prev) => {
        const goldFind = getEquippedStatTotal(prev.equippedGear, 'Gold Find');
        const earned = calcGoldForFloor(floor, goldFind);
        // Update earn_gold quests
        const newQuests = prev.quests.map((q) =>
          q.status === "active" && q.objective.type === "earn_gold"
            ? { ...q, progress: Math.min(q.progress + earned, q.objective.target) }
            : q
        );
        addLog(`💰 +${earned} gold (floor ${floor})`, "log-gold");
        return { ...prev, gold: prev.gold + earned, quests: newQuests };
      });

      // Vendor spawn: random floor every 10-20 floors
      setState((prev) => {
        if (prev.activeVendor) return prev; // already has vendor
        // Seed vendor appearance: every 10-20 floors randomly
        const vendorInterval = 10 + Math.floor(Math.random() * 11);
        if (floor > 0 && floor % vendorInterval === 0) {
          const vendorItems = generateVendorItems(floor);
          stopWalkInterval();
          showNotif(`🛒 VENDOR ON FLOOR ${floor}!`);
          addLog(`🛒 A wandering vendor appeared on floor ${floor}!`, "log-gold");
          return { ...prev, activeVendor: { floor, items: vendorItems } };
        }
        return prev;
      });

      // Quest progress: reach_floor
      setState((prev) => {
        const newQuests = prev.quests.map((q) => {
          if (q.status !== "active") return q;
          if (q.objective.type === "reach_floor" && floor >= q.objective.target) {
            return { ...q, progress: q.objective.target, status: "completed" as QuestStatus };
          }
          return q;
        });
        return { ...prev, quests: newQuests };
      });

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
  }, [state.currentFloor, state.isInDungeon, state.isReturning, addLog, showNotif, spawnLootPopup, stopWalkInterval]);

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
      // Return Speed: each point reduces steps needed by 1%
      const returnSpeed = getEquippedStatTotal(prev.equippedGear, 'Return Speed');
      const reduction = Math.min(returnSpeed / 100, 0.75); // cap at 75% reduction
      const baseNeeded = prev.currentFloor * STEPS_PER_FLOOR;
      const needed = Math.max(1, Math.round(baseNeeded * (1 - reduction)));
      const savedSteps = baseNeeded - needed;
      const msg = savedSteps > 0
        ? `↩ Returning — ${needed} steps (${Math.round(reduction * 100)}% faster!)`
        : `↩ Returning to base — ${needed} steps needed`;
      addLog(msg, "log-orange");
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
        iron:       { next: "steel",      cost: { type: "crude",        qty: 50,  type2: "refined",      qty2: 20 } },
        steel:      { next: "shadow",     cost: { type: "refined",      qty: 40,  type2: "tempered",     qty2: 15 } },
        shadow:     { next: "void",       cost: { type: "tempered",     qty: 30,  type2: "voidmat",      qty2: 10 } },
        void:       { next: "celestial",  cost: { type: "voidmat",      qty: 20,  type2: "celestialmat", qty2: 5  } },
        celestial:  { next: "obsidian",   cost: { type: "celestialmat", qty: 30,  type2: "celestialmat", qty2: 30 } },
        obsidian:   { next: "runic",      cost: { type: "celestialmat", qty: 60,  type2: "celestialmat", qty2: 60 } },
        runic:      { next: "spectral",   cost: { type: "celestialmat", qty: 120, type2: "celestialmat", qty2: 120 } },
        spectral:   { next: "primordial", cost: { type: "celestialmat", qty: 250, type2: "celestialmat", qty2: 250 } },
        primordial: { next: "eternal",    cost: { type: "celestialmat", qty: 500, type2: "celestialmat", qty2: 500 } },
        eternal:    { next: null, cost: { type: "celestialmat", qty: 0, type2: "celestialmat", qty2: 0 } },
      };
      const upgrade = tierUp[gear.tier];
      if (!upgrade.next) { showNotif("ALREADY MAX TIER!"); return prev; }
      const { type, qty, type2, qty2 } = upgrade.cost;
      if ((prev.materials[type] ?? 0) < qty || (prev.materials[type2] ?? 0) < qty2) {
        showNotif("NOT ENOUGH MATERIALS!"); return prev;
      }
      const newTier = upgrade.next;
      const slotInfo = GEAR_SLOTS.find((s) => s.id === gear.slot)!;
      const tierLabelMap: Record<GearTier, string> = { iron: "Iron", steel: "Steel", shadow: "Shadow", void: "Void", celestial: "Celestial", obsidian: "Obsidian", runic: "Runic", spectral: "Spectral", primordial: "Primordial", eternal: "Eternal" };
      const tierLabel = tierLabelMap[newTier];
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

  // ---- Quest actions ----
  const acceptQuest = useCallback((questId: string) => {
    setState((prev) => {
      if (prev.isInDungeon) { showNotif("RETURN TO BASE TO ACCEPT QUESTS!"); return prev; }
      const q = prev.quests.find((q) => q.id === questId);
      if (!q || q.status !== "available") return prev;
      const active = prev.quests.filter((q) => q.status === "active").length;
      if (active >= 3) { showNotif("MAX 3 ACTIVE QUESTS!"); return prev; }
      addLog(`📋 Quest accepted: ${q.title}`, "log-gem");
      return { ...prev, quests: prev.quests.map((qq) => qq.id === questId ? { ...qq, status: "active" as QuestStatus } : qq) };
    });
  }, [addLog, showNotif]);

  const turnInQuest = useCallback((questId: string) => {
    setState((prev) => {
      if (prev.isInDungeon) { showNotif("RETURN TO BASE TO TURN IN QUESTS!"); return prev; }
      const q = prev.quests.find((q) => q.id === questId);
      if (!q || q.status !== "completed") return prev;
      let newMats = { ...prev.materials };
      if (q.reward.materials) {
        const { type, qty } = q.reward.materials;
        newMats[type] = (newMats[type] ?? 0) + qty;
      }
      addLog(`✅ Quest complete: ${q.title} — +${q.reward.gold} gold!`, "log-gold");
      showNotif(`✅ QUEST COMPLETE! +${q.reward.gold} GOLD!`);
      return {
        ...prev,
        gold: prev.gold + q.reward.gold,
        materials: newMats,
        quests: prev.quests.map((qq) => qq.id === questId ? { ...qq, status: "turned_in" as QuestStatus } : qq),
      };
    });
  }, [addLog, showNotif]);

  // ---- Vendor actions ----
  const buyFromVendor = useCallback((itemId: string) => {
    setState((prev) => {
      if (!prev.activeVendor) return prev;
      const item = prev.activeVendor.items.find((i) => i.id === itemId);
      if (!item) return prev;
      if (prev.gold < item.cost) { showNotif("NOT ENOUGH GOLD!"); return prev; }
      let newState = { ...prev, gold: prev.gold - item.cost };
      if (item.type === "gear" && item.gear) {
        const emptySlot = newState.bag.findIndex((s) => s === null);
        if (emptySlot === -1) { showNotif("BAG FULL!"); return prev; }
        const newBag = [...newState.bag];
        newBag[emptySlot] = item.gear;
        newState = { ...newState, bag: newBag };
        addLog(`🛒 Bought ${item.gear.name} for ${item.cost}g`, "log-gold");
      } else if (item.type === "material" && item.matType && item.matQty) {
        newState = { ...newState, materials: { ...newState.materials, [item.matType]: (newState.materials[item.matType] ?? 0) + item.matQty } };
        addLog(`🛒 Bought ${item.matQty}x ${MATERIAL_INFO[item.matType].label} for ${item.cost}g`, "log-gold");
      } else if (item.type === "reroll") {
        // Mark as a pending reroll — handled in shop
        addLog(`🛒 Bought stat reroll service for ${item.cost}g`, "log-gold");
        showNotif("REROLL SERVICE PURCHASED! USE IN CRAFT TAB.");
      }
      // Remove purchased item from vendor
      const newItems = prev.activeVendor.items.filter((i) => i.id !== itemId);
      newState = { ...newState, activeVendor: { ...prev.activeVendor, items: newItems } };
      return newState;
    });
  }, [addLog, showNotif]);

  const dismissVendor = useCallback(() => {
    setState((prev) => ({ ...prev, activeVendor: null }));
    startWalkInterval();
    addLog("🛒 Vendor dismissed. Continuing...", "log-muted");
  }, [addLog, startWalkInterval]);

  // ---- Salvage action (base only) ----
  const salvageGear = useCallback((gearId: string) => {
    setState((prev) => {
      if (prev.isInDungeon) { showNotif("RETURN TO BASE TO SALVAGE!"); return prev; }
      const gear = prev.stash.find((g) => g.id === gearId);
      if (!gear) return prev;
      const salvageBonus = getEquippedStatTotal(prev.equippedGear, 'Salvage Yield');
      const yields = salvageYield(gear, salvageBonus);
      const newMats = { ...prev.materials };
      yields.forEach(({ type, qty }) => { newMats[type] = (newMats[type] ?? 0) + qty; });
      const newStash = prev.stash.filter((g) => g.id !== gearId);
      addLog(`🔨 Salvaged ${gear.name} → ${yields.map(y => `${y.qty}x ${MATERIAL_INFO[y.type].label}`).join(", ")}`, "log-gem");
      return { ...prev, stash: newStash, materials: newMats };
    });
  }, [addLog, showNotif]);

  // ---- Shop actions (base only) ----
  const SHOP_REROLL_COST = 150;
  const SHOP_BAG_SLOT_COST = 500;
  const shopReroll = useCallback((gearId: string) => {
    setState((prev) => {
      if (prev.isInDungeon) { showNotif("RETURN TO BASE FOR SHOP!"); return prev; }
      if (prev.gold < SHOP_REROLL_COST) { showNotif(`NEED ${SHOP_REROLL_COST} GOLD!`); return prev; }
      const gear = prev.stash.find((g) => g.id === gearId);
      if (!gear) return prev;
      const newStats = rollStats(gear.slot, gear.rarity, gear.tier);
      const newStash = prev.stash.map((g) => g.id === gearId ? { ...g, stats: newStats } : g);
      addLog(`🏪 Shop rerolled stats on ${gear.name} (-${SHOP_REROLL_COST}g)`, "log-gold");
      return { ...prev, gold: prev.gold - SHOP_REROLL_COST, stash: newStash };
    });
  }, [addLog, showNotif]);

  const shopBuyBagSlot = useCallback(() => {
    setState((prev) => {
      if (prev.isInDungeon) { showNotif("RETURN TO BASE FOR SHOP!"); return prev; }
      if (prev.gold < SHOP_BAG_SLOT_COST) { showNotif(`NEED ${SHOP_BAG_SLOT_COST} GOLD!`); return prev; }
      const newBagSize = prev.bagSize + 1;
      const newBag = [...prev.bag, null];
      addLog(`🏪 Bought extra bag slot! Bag: ${newBagSize} slots (-${SHOP_BAG_SLOT_COST}g)`, "log-gold");
      return { ...prev, gold: prev.gold - SHOP_BAG_SLOT_COST, bagSize: newBagSize, bag: newBag };
    });
  }, [addLog, showNotif]);

  // ---- Enhancement action (base only) ----
  const enhanceGear = useCallback((targetId: string, sacrificeGearIds: string[], sacrificeMaterials: Partial<Materials>) => {
    setState((prev) => {
      if (prev.isInDungeon) { showNotif("RETURN TO BASE TO ENHANCE!"); return prev; }
      const target = prev.stash.find((g) => g.id === targetId);
      if (!target) return prev;
      const threshold = ENHANCE_XP_THRESHOLDS[target.tier];
      if (threshold === undefined) { showNotif("ALREADY MAX TIER!"); return prev; }

      // Calculate XP from sacrificed gear
      const sacrificeGear = sacrificeGearIds.map((id) => prev.stash.find((g) => g.id === id)).filter(Boolean) as GearItem[];
      let xpGained = 0;
      sacrificeGear.forEach((g) => {
        xpGained += TIER_XP_VALUE[g.tier] * RARITY_XP_VALUE[g.rarity] * 10;
      });

      // Calculate XP from sacrificed materials
      (Object.keys(sacrificeMaterials) as MaterialType[]).forEach((matType) => {
        const qty = sacrificeMaterials[matType] ?? 0;
        if (qty > 0 && (prev.materials[matType] ?? 0) >= qty) {
          xpGained += MATERIAL_XP_VALUE[matType] * qty;
        }
      });

      if (xpGained <= 0) { showNotif("SELECT ITEMS TO SACRIFICE!"); return prev; }

      // Deduct sacrificed gear from stash
      const sacrificeSet = new Set(sacrificeGearIds);
      let newStash = prev.stash.filter((g) => g.id === targetId || !sacrificeSet.has(g.id));

      // Deduct sacrificed materials
      const newMats = { ...prev.materials };
      (Object.keys(sacrificeMaterials) as MaterialType[]).forEach((matType) => {
        const qty = sacrificeMaterials[matType] ?? 0;
        if (qty > 0) newMats[matType] = Math.max(0, (newMats[matType] ?? 0) - qty);
      });

      // Apply XP to target and check for tier upgrade
      const newXp = target.enhancementXp + xpGained;
      const tierIdx = TIER_ORDER.indexOf(target.tier);
      let finalTier = target.tier;
      let finalXp = newXp;
      let upgraded = false;

      if (newXp >= threshold) {
        // Upgrade tier
        finalTier = TIER_ORDER[tierIdx + 1];
        finalXp = newXp - threshold;
        upgraded = true;
      }

      const tierLabelMap: Record<GearTier, string> = { iron: "Iron", steel: "Steel", shadow: "Shadow", void: "Void", celestial: "Celestial", obsidian: "Obsidian", runic: "Runic", spectral: "Spectral", primordial: "Primordial", eternal: "Eternal" };
      const slotInfo = GEAR_SLOTS.find((s) => s.id === target.slot)!;
      newStash = newStash.map((g) => g.id === targetId ? {
        ...g,
        tier: finalTier,
        name: `${tierLabelMap[finalTier]} ${slotInfo.label}`,
        stats: upgraded ? rollStats(g.slot, g.rarity, finalTier) : g.stats,
        enhancementXp: finalXp,
      } : g);

      if (upgraded) {
        addLog(`✨ Enhanced ${target.name} → ${TIER_LABELS[finalTier]}! (+${xpGained} XP)`, "log-gold");
        showNotif(`TIER UP! ${TIER_LABELS[finalTier]}!`);
      } else {
        addLog(`⚡ Enhanced ${target.name}: +${xpGained} XP (${finalXp}/${threshold})`, "log-gem");
      }

      return { ...prev, stash: newStash, materials: newMats };
    });
  }, [addLog, showNotif]);

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
      acceptQuest,
      turnInQuest,
      buyFromVendor,
      dismissVendor,
      salvageGear,
      shopReroll,
      shopBuyBagSlot,
      enhanceGear,
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
