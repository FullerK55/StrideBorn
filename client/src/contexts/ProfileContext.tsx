// ============================================================
// Stride Born — Profile Context (Supabase-backed)
// Design: Single profile per authenticated user, stored in Supabase
// First-time login: migrates any existing localStorage save automatically
// Auto-saves to Supabase every 5 seconds (debounced)
// ============================================================

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { DungeonDifficulty } from "@/hooks/useGameState";

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  createdAt: number;
  lastPlayed: number;
  totalSteps: number;
  deepestFloor: number;
  currentDungeon: string;
  stash: unknown[];
  bag: unknown[];
  bagSize: number;
  equippedGear: unknown;
  materials: unknown;
  runes: unknown;
  runs: number;
  lives: number;
  gold: number;
  quests: unknown;
  bookshelf: unknown[];
  bookDropPity: number;
  bookVendorPity: number;
  enhancementXpPool: number;
  dungeonDifficulties: Record<string, DungeonDifficulty>;
  dismissedDifficultyFloor: Record<string, number>;
  offlineTimestamp: number | null;
  offlineFloor: number | null;
  offlineDungeon: string | null;
}

// Legacy localStorage keys (for one-time migration)
const LEGACY_PROFILES_KEY = "strideborn_profiles_v1";
const LEGACY_ACTIVE_KEY = "strideborn_active_profile_v1";

export const MAX_PROFILES = 1;
export const AVATARS = ["⚔️", "🧙", "🏹", "🛡️", "💀", "🔮", "🗡️", "🪄"];

function makeDefaultProfile(id: string, name: string, avatar: string): Profile {
  return {
    id,
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
    bookshelf: [],
    bookDropPity: 0,
    bookVendorPity: 0,
    enhancementXpPool: 0,
    dungeonDifficulties: {},
    dismissedDifficultyFloor: {},
    offlineTimestamp: null,
    offlineFloor: null,
    offlineDungeon: null,
  };
}

async function migrateLegacyProfile(userId: string, username: string, avatar: string): Promise<Profile | null> {
  try {
    const raw = localStorage.getItem(LEGACY_PROFILES_KEY);
    if (!raw) return null;
    const parsed: Profile[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    const best = parsed.reduce((a, b) => ((a.deepestFloor ?? 0) >= (b.deepestFloor ?? 0) ? a : b));
    const migrated: Profile = {
      ...makeDefaultProfile(userId, username, avatar),
      ...best,
      id: userId,
      name: username,
      avatar,
      lastPlayed: Date.now(),
      equippedGear: best.equippedGear ?? { helmet: null, gloves: null, chest: null, pants: null, boots: null, backpack: null, weapon: null, ring: null, amulet: null },
      materials: best.materials ?? { crude: 0, refined: 0, tempered: 0, voidmat: 0, celestialmat: 0 },
      runes: best.runes ?? {},
      bag: Array.isArray(best.bag) ? best.bag : [],
      stash: Array.isArray(best.stash) ? best.stash : [],
      bookshelf: Array.isArray(best.bookshelf) ? best.bookshelf : [],
      quests: Array.isArray(best.quests) ? best.quests : [],
      bagSize: (best.bagSize as number | undefined) ?? 5,
      gold: (best.gold as number | undefined) ?? 0,
      bookDropPity: typeof best.bookDropPity === 'number' ? best.bookDropPity : 0,
      bookVendorPity: typeof best.bookVendorPity === 'number' ? best.bookVendorPity : 0,
      enhancementXpPool: typeof (best as Profile & { enhancementXpPool?: number }).enhancementXpPool === 'number'
        ? (best as Profile & { enhancementXpPool?: number }).enhancementXpPool! : 0,
      dungeonDifficulties: (best as Profile & { dungeonDifficulties?: Record<string, DungeonDifficulty> }).dungeonDifficulties ?? {},
      dismissedDifficultyFloor: (best as Profile & { dismissedDifficultyFloor?: Record<string, number> }).dismissedDifficultyFloor ?? {},
      offlineTimestamp: best.offlineTimestamp ?? null,
      offlineFloor: best.offlineFloor ?? null,
      offlineDungeon: best.offlineDungeon ?? null,
    };
    return migrated;
  } catch {
    return null;
  }
}

interface ProfileContextValue {
  profile: Profile | null;
  loading: boolean;
  updateProfileSave: (data: Partial<Profile>) => void;
  // Shim: existing components use profiles[] and activeProfile
  profiles: Profile[];
  activeProfile: Profile | null;
  selectProfile: (id: string) => void;
  createNewProfile: (name: string, avatar: string) => Profile;
  deleteProfile: (id: string) => void;
  switchingProfile: boolean;
  setSwitchingProfile: (v: boolean) => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [switchingProfile, setSwitchingProfile] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef<Partial<Profile> | null>(null);
  const profileRef = useRef<Profile | null>(null);
  profileRef.current = profile;

  // Load profile from Supabase when user logs in
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error || !data) {
        const username = user.user_metadata?.username ?? user.email?.split("@")[0] ?? "Adventurer";
        const avatar = user.user_metadata?.avatar ?? "⚔️";
        const migrated = await migrateLegacyProfile(user.id, username, avatar);
        const newProfile = migrated ?? makeDefaultProfile(user.id, username, avatar);
        await supabase.from("profiles").upsert({
          id: user.id,
          username: newProfile.name,
          avatar: newProfile.avatar,
          last_played: new Date().toISOString(),
          save_data: newProfile,
        });
        if (migrated) {
          localStorage.removeItem(LEGACY_PROFILES_KEY);
          localStorage.removeItem(LEGACY_ACTIVE_KEY);
        }
        setProfile(newProfile);
      } else {
        const saved = (data.save_data ?? {}) as Partial<Profile>;
        const hydrated: Profile = {
          ...makeDefaultProfile(user.id, data.username, data.avatar),
          ...saved,
          id: user.id,
          name: data.username,
          avatar: data.avatar,
        };
        setProfile(hydrated);
      }
      setLoading(false);
    })();
  }, [user]);

  // Debounced Supabase save
  const flushSave = useCallback(async (patch: Partial<Profile>) => {
    if (!user || !profileRef.current) return;
    const updated = { ...profileRef.current, ...patch, lastPlayed: Date.now() };
    await supabase.from("profiles").update({
      last_played: new Date().toISOString(),
      save_data: updated,
    }).eq("id", user.id);
  }, [user]);

  const updateProfileSave = useCallback((data: Partial<Profile>) => {
    setProfile((prev) => {
      if (!prev) return prev;
      return { ...prev, ...data, lastPlayed: Date.now() };
    });
    pendingSaveRef.current = { ...(pendingSaveRef.current ?? {}), ...data };
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (pendingSaveRef.current) {
        flushSave(pendingSaveRef.current);
        pendingSaveRef.current = null;
      }
    }, 5000);
  }, [flushSave]);

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (pendingSaveRef.current && user && profileRef.current) {
        const updated = { ...profileRef.current, ...pendingSaveRef.current, lastPlayed: Date.now() };
        supabase.from("profiles").update({
          last_played: new Date().toISOString(),
          save_data: updated,
        }).eq("id", user.id);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Shim for existing components
  const profiles = profile ? [profile] : [];
  const activeProfile = profile;
  const selectProfile = useCallback((_id: string) => {}, []);
  const createNewProfile = useCallback((_name: string, _avatar: string): Profile => {
    return profile ?? makeDefaultProfile(user?.id ?? "local", _name, _avatar);
  }, [profile, user]);
  const deleteProfile = useCallback((_id: string) => {}, []);

  return (
    <ProfileContext.Provider value={{
      profile,
      loading,
      updateProfileSave,
      profiles,
      activeProfile,
      selectProfile,
      createNewProfile,
      deleteProfile,
      switchingProfile,
      setSwitchingProfile,
    }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used inside ProfileProvider");
  return ctx;
}
