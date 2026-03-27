// ============================================================
// Stride Born — Profile Context
// Design: Up to 5 local profiles, each with independent save data
// Auto-saves active profile every 5 seconds
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
  runs: number;
  lives: number;
}

const PROFILES_KEY = "strideborn_profiles_v1";
const ACTIVE_PROFILE_KEY = "strideborn_active_profile_v1";
const MAX_PROFILES = 5;

const AVATARS = ["⚔️", "🧙", "🏹", "🛡️", "💀", "🔮", "🗡️", "🪄"];

function loadProfiles(): Profile[] {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
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
    runs: 0,
    lives: 1,
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
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === activeProfileId
          ? { ...p, ...data, lastPlayed: Date.now() }
          : p
      )
    );
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
