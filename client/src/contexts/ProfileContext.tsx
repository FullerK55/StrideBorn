// ============================================================
// Stride Born — Profile Context
// Design: Up to 5 local profiles, each with independent save data
// Auto-saves active profile every 5 seconds
// Offline progress: each profile tracks when it went offline while in a dungeon
// ============================================================

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface Profile {
  id: string;
  name: string;
  avatar: string; // emoji avatar
  createdAt: number;
  lastPlayed: number;
  // Saved game fields
  totalSteps: number;
  deepestFloor: number;
  currentDungeon: string;
  stash: unknown[];
  bag: unknown[];       // (BagItem | null)[] — persisted so offline calc can use it
  bagSize: number;      // persisted bag size including shop purchases
  equippedGear: unknown; // Record<GearSlot, GearItem | null>
  materials: unknown;   // Materials
  runes: unknown;       // RuneInventory
  runs: number;
  lives: number;
  gold: number;
  quests: unknown; // Quest[]
  // Offline progress tracking
  offlineTimestamp: number | null;
  offlineFloor: number | null;
  offlineDungeon: string | null;
}

const PROFILES_KEY = "strideborn_profiles_v1";
const ACTIVE_PROFILE_KEY = "strideborn_active_profile_v1";
const MAX_PROFILES = 5;

const AVATARS = ["⚔️", "🧙", "🏹", "🛡️", "💀", "🔮", "🗡️", "🪄"];

function loadProfiles(): Profile[] {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Migrate old profiles that don't have offline fields
    return parsed.map((p: Profile) => ({
      ...p,
      equippedGear: p.equippedGear ?? { helmet: null, gloves: null, chest: null, pants: null, boots: null, backpack: null, weapon: null, ring: null, amulet: null },
      materials: p.materials ?? { crude: 0, refined: 0, tempered: 0, voidmat: 0, celestialmat: 0 },
      runes: p.runes ?? {},
      bag: Array.isArray(p.bag) ? p.bag : [],
      bagSize: (p.bagSize as number | undefined) ?? 5,
      gold: (p.gold as number | undefined) ?? 0,
      quests: Array.isArray(p.quests) ? p.quests : [],
      stash: Array.isArray(p.stash) ? p.stash : [],
      runs: p.runs ?? 0,
      lives: p.lives ?? 1,
      offlineTimestamp: p.offlineTimestamp ?? null,
      offlineFloor: p.offlineFloor ?? null,
      offlineDungeon: p.offlineDungeon ?? null,
    }));
  } catch {
    return [];
  }
}

function saveProfiles(profiles: Profile[]) {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

function loadActiveProfileId(): string | null {
  return localStorage.getItem(ACTIVE_PROFILE_KEY);
}

function saveActiveProfileId(id: string) {
  localStorage.setItem(ACTIVE_PROFILE_KEY, id);
}

function createProfile(name: string, avatar: string): Profile {
  return {
    id: `profile_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim().slice(0, 16) || "Adventurer",
    avatar,
    createdAt: Date.now(),
    lastPlayed: Date.now(),
    totalSteps: 0,
    deepestFloor: 0,
    currentDungeon: "crystal",
    stash: [],
    bag: [],
    bagSize: 5,
    equippedGear: { helmet: null, gloves: null, chest: null, pants: null, boots: null, backpack: null, weapon: null, ring: null, amulet: null },
    materials: { crude: 0, refined: 0, tempered: 0, voidmat: 0, celestialmat: 0 },
    runes: {},
    runs: 0,
    lives: 1,
    gold: 0,
    quests: [],
    offlineTimestamp: null,
    offlineFloor: null,
    offlineDungeon: null,
  };
}

interface ProfileContextValue {
  profiles: Profile[];
  activeProfile: Profile | null;
  selectProfile: (id: string) => void;
  createNewProfile: (name: string, avatar: string) => Profile;
  deleteProfile: (id: string) => void;
  updateProfileSave: (data: Partial<Profile>) => void;
  switchingProfile: boolean;
  setSwitchingProfile: (v: boolean) => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>(() => loadProfiles());
  const [activeProfileId, setActiveProfileId] = useState<string | null>(() => loadActiveProfileId());
  const [switchingProfile, setSwitchingProfile] = useState(false);

  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? null;

  // Persist profiles whenever they change
  useEffect(() => {
    saveProfiles(profiles);
  }, [profiles]);

  // Persist active profile id
  useEffect(() => {
    if (activeProfileId) saveActiveProfileId(activeProfileId);
  }, [activeProfileId]);

  const selectProfile = useCallback((id: string) => {
    setActiveProfileId(id);
    setSwitchingProfile(false);
    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, lastPlayed: Date.now() } : p))
    );
  }, []);

  const createNewProfile = useCallback((name: string, avatar: string): Profile => {
    const profile = createProfile(name, avatar);
    setProfiles((prev) => [...prev, profile]);
    return profile;
  }, []);

  const deleteProfile = useCallback((id: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    if (activeProfileId === id) {
      setActiveProfileId(null);
    }
  }, [activeProfileId]);

  const updateProfileSave = useCallback((data: Partial<Profile>) => {
    setProfiles((prev) => {
      const updated = prev.map((p) =>
        p.id === activeProfileId
          ? { ...p, ...data, lastPlayed: Date.now() }
          : p
      );
      // Write to localStorage immediately — do not rely solely on the useEffect
      // which fires asynchronously and can miss saves on tab close.
      saveProfiles(updated);
      return updated;
    });
  }, [activeProfileId]);

  return (
    <ProfileContext.Provider
      value={{
        profiles,
        activeProfile,
        selectProfile,
        createNewProfile,
        deleteProfile,
        updateProfileSave,
        switchingProfile,
        setSwitchingProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used inside ProfileProvider");
  return ctx;
}

export { MAX_PROFILES, AVATARS };
