// ============================================================
// Stride Born — Settings Overlay
// Design: Neo-Retro Pixel RPG — slides up from bottom as a panel
// Sections: Account, Combat Record, Game, Auto-Invest
// ============================================================

import { useState } from "react";
import { useProfile } from "@/contexts/ProfileContext";
import type { GameState, GearRarity, GearSlot, AutoInvestConfig, LeaveAloneAdvancedConfig } from "@/hooks/useGameState";
export type { AutoInvestConfig, LeaveAloneAdvancedConfig };

const NERD_MODE_KEY = "strideborn_nerd_mode";
const LEAVE_ALONE_KEY = "strideborn_leave_alone";
const LEAVE_ALONE_ADVANCED_KEY = "strideborn_leave_alone_advanced";
const AUTO_INVEST_KEY = "strideborn_auto_invest";

const ALL_GS_SLOTS: GearSlot[] = ["helmet","gloves","chest","pants","boots","backpack","weapon","ring","amulet"];
const GS_SLOT_LABELS: Record<GearSlot, string> = {
  helmet: "Helmet", gloves: "Gloves", chest: "Chest", pants: "Pants",
  boots: "Boots", backpack: "Backpack", weapon: "Weapon", ring: "Ring", amulet: "Amulet"
};
const DEFAULT_LEAVE_ALONE_ADVANCED: LeaveAloneAdvancedConfig = {
  showMegaBossReward: false,
  autoEquipHigherGS: false,
  autoEquipGSSlots: [], // empty = all slots
  autoAdvanceDifficulty: false,
};

export function loadLeaveAloneAdvanced(): LeaveAloneAdvancedConfig {
  try {
    const raw = localStorage.getItem(LEAVE_ALONE_ADVANCED_KEY);
    if (!raw) return { ...DEFAULT_LEAVE_ALONE_ADVANCED };
    return { ...DEFAULT_LEAVE_ALONE_ADVANCED, ...JSON.parse(raw) };
  } catch { return { ...DEFAULT_LEAVE_ALONE_ADVANCED }; }
}
function saveLeaveAloneAdvanced(v: LeaveAloneAdvancedConfig) {
  localStorage.setItem(LEAVE_ALONE_ADVANCED_KEY, JSON.stringify(v));
}

export function loadLeaveAloneMode(): boolean {
  return localStorage.getItem(LEAVE_ALONE_KEY) === "true";
}
function saveLeaveAloneMode(v: boolean) {
  localStorage.setItem(LEAVE_ALONE_KEY, v ? "true" : "false");
}

export function loadNerdMode(): boolean {
  return localStorage.getItem(NERD_MODE_KEY) === "true";
}
function saveNerdMode(v: boolean) {
  localStorage.setItem(NERD_MODE_KEY, v ? "true" : "false");
}

// AutoInvestConfig is imported from useGameState to avoid circular imports

const DEFAULT_AUTO_INVEST: AutoInvestConfig = {
  enabled: false,
  buyBooks: true,
  buyBookVendor: true,
  buyGearMinRarity: "rare",
  buyGearMaxPrice: 500,
  buyMaterials: false,
  goldReserve: 2000,
  anvilBreakMaxRarity: "uncommon",
  anvilBreakFromStash: false,
  anvilProtectGS: true,
  fenceSellMaxRarity: null,
};

export function loadAutoInvest(): AutoInvestConfig {
  try {
    const raw = localStorage.getItem(AUTO_INVEST_KEY);
    if (!raw) return { ...DEFAULT_AUTO_INVEST };
    return { ...DEFAULT_AUTO_INVEST, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_AUTO_INVEST };
  }
}

export function saveAutoInvest(cfg: AutoInvestConfig) {
  localStorage.setItem(AUTO_INVEST_KEY, JSON.stringify(cfg));
}

// ---- Rarity ordering ----
const RARITY_ORDER: GearRarity[] = ["scrap", "common", "uncommon", "rare", "epic", "legendary", "mythic"];
const RARITY_EMOJI: Record<GearRarity, string> = {
  scrap: "⚪", common: "🟢", uncommon: "🔵", rare: "🟣", epic: "🟠", legendary: "🟡", mythic: "🔴",
};

function fmtNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toString();
}

interface SettingsOverlayProps {
  onClose: () => void;
  onSaveNow: () => void;
  state?: GameState;
  nerdMode: boolean;
  onNerdModeChange: (v: boolean) => void;
  leaveAloneMode: boolean;
  onLeaveAloneModeChange: (v: boolean) => void;
  leaveAloneAdvanced: LeaveAloneAdvancedConfig;
  onLeaveAloneAdvancedChange: (cfg: LeaveAloneAdvancedConfig) => void;
  autoInvest: AutoInvestConfig;
  onAutoInvestChange: (cfg: AutoInvestConfig) => void;
}

// Shared toggle row style
function ToggleRow({ label, note, active, onClick }: { label: string; note?: string; active: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 12px", cursor: "pointer",
        background: active ? "rgba(102,255,136,0.04)" : "transparent",
        border: `1px solid ${active ? "rgba(102,255,136,0.2)" : "rgba(58,58,106,0.3)"}`,
        borderRadius: 4, transition: "background 0.15s",
      }}
    >
      <div>
        <span style={{ fontSize: 14, color: "var(--game-text)" }}>{label}</span>
        {note && <div style={{ fontSize: 11, color: "var(--game-muted)", marginTop: 2 }}>{note}</div>}
      </div>
      <span className="pixel-font" style={{
        fontSize: 8, color: active ? "var(--green)" : "var(--game-muted)",
        border: `1px solid ${active ? "var(--green)" : "var(--game-border)"}`,
        padding: "3px 6px", flexShrink: 0, marginLeft: 10,
      }}>
        {active ? "ON" : "OFF"}
      </span>
    </div>
  );
}

// Number stepper (gold amounts)
function GoldStepper({ label, value, step, min, onChange }: { label: string; value: number; step: number; min: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", border: "1px solid rgba(58,58,106,0.3)", borderRadius: 4 }}>
      <div style={{ fontSize: 13, color: "var(--game-muted)" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button onClick={() => onChange(Math.max(min, value - step))} style={{ background: "none", border: "1px solid var(--game-border)", color: "var(--game-text)", width: 24, height: 24, cursor: "pointer", fontFamily: "inherit", fontSize: 14 }}>−</button>
        <span className="pixel-font" style={{ fontSize: 9, color: "var(--gold)", minWidth: 50, textAlign: "center" }}>{fmtNum(value)}g</span>
        <button onClick={() => onChange(value + step)} style={{ background: "none", border: "1px solid var(--game-border)", color: "var(--game-text)", width: 24, height: 24, cursor: "pointer", fontFamily: "inherit", fontSize: 14 }}>+</button>
      </div>
    </div>
  );
}

// Rarity picker (horizontal chips)
function RarityPicker({ label, value, allowNone, onChange }: { label: string; value: GearRarity | null; allowNone: boolean; onChange: (v: GearRarity | null) => void }) {
  return (
    <div style={{ padding: "8px 12px", border: "1px solid rgba(58,58,106,0.3)", borderRadius: 4 }}>
      <div style={{ fontSize: 12, color: "var(--game-muted)", marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {allowNone && (
          <button
            onClick={() => onChange(null)}
            style={{
              background: value === null ? "rgba(100,100,150,0.3)" : "none",
              border: `1px solid ${value === null ? "var(--game-border)" : "rgba(58,58,106,0.3)"}`,
              color: value === null ? "var(--game-text)" : "var(--game-muted)",
              padding: "3px 8px", cursor: "pointer", fontSize: 11, borderRadius: 3,
            }}
          >OFF</button>
        )}
        {RARITY_ORDER.map((r) => (
          <button
            key={r}
            onClick={() => onChange(r)}
            style={{
              background: value === r ? "rgba(100,100,200,0.25)" : "none",
              border: `1px solid ${value === r ? "var(--gem)" : "rgba(58,58,106,0.3)"}`,
              color: value === r ? "var(--game-text)" : "var(--game-muted)",
              padding: "3px 7px", cursor: "pointer", fontSize: 11, borderRadius: 3,
            }}
          >{RARITY_EMOJI[r]} {r.charAt(0).toUpperCase() + r.slice(1)}</button>
        ))}
      </div>
    </div>
  );
}

export default function SettingsOverlay({
  onClose, onSaveNow, state, nerdMode, onNerdModeChange,
  leaveAloneMode, onLeaveAloneModeChange,
  leaveAloneAdvanced, onLeaveAloneAdvancedChange,
  autoInvest, onAutoInvestChange,
}: SettingsOverlayProps) {
  const { activeProfile, setSwitchingProfile } = useProfile();

  function handleSignOut() {
    onSaveNow();
    setSwitchingProfile(true);
    onClose();
  }

  function toggleNerdMode() {
    const next = !nerdMode;
    saveNerdMode(next);
    onNerdModeChange(next);
  }

  function toggleLeaveAloneMode() {
    const next = !leaveAloneMode;
    saveLeaveAloneMode(next);
    onLeaveAloneModeChange(next);
  }

  function updateAI(patch: Partial<AutoInvestConfig>) {
    const next = { ...autoInvest, ...patch };
    saveAutoInvest(next);
    onAutoInvestChange(next);
  }

  function updateLAA(patch: Partial<LeaveAloneAdvancedConfig>) {
    const next = { ...leaveAloneAdvanced, ...patch };
    saveLeaveAloneAdvanced(next);
    onLeaveAloneAdvancedChange(next);
  }

  const bookDropPct = state ? (2 + (state.bookDropPity ?? 0)) : null;
  // Scholar spawn: 2% base + 0.01% per floor of pity, only after floor 200
  const scholarSpawnPct = (state && state.currentFloor > 200)
    ? parseFloat((2 + (state.bookVendorPity ?? 0) * 0.01).toFixed(2))
    : null;

  const sectionHeader = (label: string) => (
    <div className="pixel-font" style={{
      fontSize: 8, color: "var(--gem)", letterSpacing: 2, marginBottom: 12,
      display: "flex", alignItems: "center", gap: 8,
    }}>
      {label}
      <span style={{ flex: 1, height: 1, background: "var(--game-border)", display: "block" }} />
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, animation: "fadeIn 0.2s ease" }} />

      {/* Panel */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 480, maxHeight: "88vh", overflowY: "auto",
        background: "var(--bg-panel)", border: "2px solid var(--game-border)",
        borderBottom: "none", zIndex: 201,
        paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
        animation: "slideUp 0.25s cubic-bezier(0.32, 0.72, 0, 1)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 10px", borderBottom: "2px solid var(--game-border)" }}>
          <div className="pixel-font" style={{ fontSize: 10, color: "var(--gold)", letterSpacing: 2 }}>⚙ SETTINGS</div>
          <button onClick={onClose} style={{ background: "none", border: "2px solid var(--game-border)", color: "var(--game-muted)", fontFamily: "'Press Start 2P', monospace", fontSize: 8, padding: "4px 8px", cursor: "pointer" }}>✕ CLOSE</button>
        </div>

        {/* ACCOUNT */}
        <div style={{ padding: "14px 16px" }}>
          {sectionHeader("ACCOUNT")}
          <div style={{ background: "#0a0a1a", border: "2px solid var(--game-border)", padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 32, flexShrink: 0 }}>{activeProfile?.avatar}</div>
            <div style={{ flex: 1 }}>
              <div className="pixel-font" style={{ fontSize: 10, color: "var(--gold)", marginBottom: 3 }}>{activeProfile?.name}</div>
              <div style={{ fontSize: 13, color: "var(--game-muted)" }}>Floor {activeProfile?.deepestFloor ?? 0} · {activeProfile?.runs ?? 0} runs</div>
              <div style={{ fontSize: 12, color: "var(--green)", marginTop: 2 }}>● Active profile</div>
            </div>
          </div>
          <button onClick={handleSignOut} style={{ width: "100%", background: "none", border: "2px solid var(--health)", color: "var(--health)", fontFamily: "'Press Start 2P', monospace", fontSize: 9, padding: "12px 16px", cursor: "pointer", letterSpacing: 1, textAlign: "center", transition: "background 0.15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,68,68,0.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}>
            ⇠ SIGN OUT / SWITCH ACCOUNT
          </button>
          <div style={{ fontSize: 12, color: "var(--game-muted)", textAlign: "center", marginTop: 8 }}>Returns to profile select screen.<br />Your progress is auto-saved.</div>
        </div>

        <div style={{ height: 1, background: "var(--game-border)", margin: "0 16px" }} />

        {/* COMBAT RECORD */}
        {state && (
          <div style={{ padding: "14px 16px" }}>
            {sectionHeader("COMBAT RECORD")}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { emoji: "⚔️", label: "Deepest Floor", value: fmtNum(state.deepestFloor) },
                { emoji: "🗡️", label: "Total Runs", value: fmtNum(state.runs) },
                { emoji: "👣", label: "Total Steps", value: fmtNum(state.totalSteps) },
                { emoji: "💀", label: "Lives Remaining", value: fmtNum(state.lives) },
                { emoji: "💰", label: "Gold on Hand", value: fmtNum(state.gold) },
                { emoji: "📦", label: "Stash Items", value: `${fmtNum(state.stash.length)} (∞)` },
              ].map((row) => (
                <div key={row.label} style={{ background: "#0a0a1a", border: "1px solid var(--game-border)", padding: "8px 10px", borderRadius: 3 }}>
                  <div className="pixel-font" style={{ fontSize: 11, color: "var(--gold)", marginBottom: 2 }}>{row.emoji} {row.value}</div>
                  <div style={{ fontSize: 12, color: "var(--game-muted)" }}>{row.label}</div>
                </div>
              ))}
            </div>
            {nerdMode && bookDropPct !== null && (
              <div style={{ marginTop: 10, background: "#0a0a1a", border: "1px solid #2a3a2a", padding: "8px 10px", borderRadius: 3, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>📖</span>
                <div style={{ flex: 1 }}>
                  <div className="pixel-font" style={{ fontSize: 9, color: "#66ff88", marginBottom: 2 }}>{bookDropPct}% book drop</div>
                  <div style={{ fontSize: 12, color: "var(--game-muted)" }}>Next mini boss · {state!.bookDropPity} miss{state!.bookDropPity !== 1 ? "es" : ""} since last drop</div>
                </div>
                <div style={{ fontFamily: "'VT323', monospace", fontSize: 12, color: "#444", textAlign: "right" }}>base 2%<br />+1%/miss</div>
              </div>
            )}
            {nerdMode && scholarSpawnPct !== null && (
              <div style={{ marginTop: 8, background: "#0a0a1a", border: "1px solid #1a2a3a", padding: "8px 10px", borderRadius: 3, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>📚</span>
                <div style={{ flex: 1 }}>
                  <div className="pixel-font" style={{ fontSize: 9, color: "#66aaff", marginBottom: 2 }}>{scholarSpawnPct}% scholar spawn</div>
                  <div style={{ fontSize: 12, color: "var(--game-muted)" }}>Wandering Scholar · {state!.bookVendorPity ?? 0} floor{(state!.bookVendorPity ?? 0) !== 1 ? "s" : ""} of pity</div>
                </div>
                <div style={{ fontFamily: "'VT323', monospace", fontSize: 12, color: "#444", textAlign: "right" }}>base 2%<br />+0.01%/flr</div>
              </div>
            )}

            {/* GS per-slot summary — always shown when state is available */}
            {(() => {
              const SLOTS: GearSlot[] = ["helmet","gloves","chest","pants","boots","backpack","weapon","ring","amulet"];
              const rows = SLOTS.map((sl) => {
                const equipped = state!.equippedGear[sl];
                // Eligible = has Eternal Mythic equipped in this slot
                const eligible = equipped && equipped.tier === "eternal" && equipped.rarity === "mythic";
                // GS value: the equipped item's gearScore (may be 0 or undefined)
                const gsVal = equipped?.gearScore;
                let display: string;
                let color: string;
                if (!eligible) {
                  display = "✕";
                  color = "#444";
                } else if (gsVal === undefined || gsVal === 0) {
                  display = "0";
                  color = "#888";
                } else {
                  display = String(gsVal);
                  color = "#ffd700";
                }
                return { sl, display, color };
              });
              return (
                <div style={{ marginTop: 10, background: "#0a0a1a", border: "1px solid rgba(255,215,0,0.15)", padding: "8px 10px", borderRadius: 3 }}>
                  <div className="pixel-font" style={{ fontSize: 8, color: "#ffd700", marginBottom: 8, letterSpacing: 1 }}>⭐ GEAR SCORE PER SLOT</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
                    {rows.map(({ sl, display, color }) => (
                      <div key={sl} style={{ background: "rgba(255,215,0,0.04)", border: `1px solid ${color === "#ffd700" ? "rgba(255,215,0,0.3)" : "rgba(80,80,100,0.3)"}`, borderRadius: 3, padding: "5px 6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontFamily: "'VT323', monospace", fontSize: 12, color: "var(--game-muted)", textTransform: "capitalize" }}>{sl}</span>
                        <span style={{ fontFamily: "'VT323', monospace", fontSize: 14, color, fontWeight: "bold" }}>{display}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: "#444", marginTop: 6 }}>✕ = not yet Eternal Mythic · 0 = eligible, none dropped</div>
                </div>
              );
            })()}
          </div>
        )}

        <div style={{ height: 1, background: "var(--game-border)", margin: "0 16px" }} />

        {/* GAME */}
        <div style={{ padding: "14px 16px" }}>
          {sectionHeader("GAME")}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Leave Me Alone Mode */}
            <div onClick={toggleLeaveAloneMode} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 12px", cursor: "pointer",
              background: leaveAloneMode ? "rgba(255,170,0,0.06)" : "transparent",
              border: `1px solid ${leaveAloneMode ? "rgba(255,170,0,0.35)" : "rgba(58,58,106,0.3)"}`,
              borderRadius: 4, transition: "background 0.15s",
            }}>
              <div>
                <span style={{ fontSize: 14, color: "var(--game-text)" }}>🤫 Leave Me Alone Mode</span>
                <div style={{ fontSize: 11, color: "var(--game-muted)", marginTop: 2 }}>Skips vendors, anvils, bosses · full AFK</div>
              </div>
              <span className="pixel-font" style={{ fontSize: 8, color: leaveAloneMode ? "#ffaa00" : "var(--game-muted)", border: `1px solid ${leaveAloneMode ? "#ffaa00" : "var(--game-border)"}`, padding: "3px 6px", flexShrink: 0, marginLeft: 10 }}>
                {leaveAloneMode ? "ON" : "OFF"}
              </span>
            </div>

            {/* Nerd Mode */}
            <div onClick={toggleNerdMode} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 12px", cursor: "pointer",
              background: nerdMode ? "rgba(102,255,136,0.04)" : "transparent",
              border: `1px solid ${nerdMode ? "rgba(102,255,136,0.2)" : "rgba(58,58,106,0.3)"}`,
              borderRadius: 4, transition: "background 0.15s",
            }}>
              <div>
                <span style={{ fontSize: 14, color: "var(--game-text)" }}>🤓 Nerd Mode</span>
                <div style={{ fontSize: 11, color: "var(--game-muted)", marginTop: 2 }}>Shows stat ranges on gear · book drop % in record</div>
              </div>
              <span className="pixel-font" style={{ fontSize: 8, color: nerdMode ? "var(--green)" : "var(--game-muted)", border: `1px solid ${nerdMode ? "var(--green)" : "var(--game-border)"}`, padding: "3px 6px", flexShrink: 0, marginLeft: 10 }}>
                {nerdMode ? "ON" : "OFF"}
              </span>
            </div>

            {/* Placeholder settings */}
            {[
              { label: "Sound Effects", value: "OFF", note: "coming soon" },
              { label: "Animations", value: "ON", note: "" },
              { label: "Notifications", value: "OFF", note: "coming soon" },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(58,58,106,0.3)", opacity: item.note ? 0.5 : 1 }}>
                <div>
                  <span style={{ fontSize: 14, color: "var(--game-text)" }}>{item.label}</span>
                  {item.note && <span style={{ fontSize: 11, color: "var(--game-muted)", marginLeft: 8 }}>({item.note})</span>}
                </div>
                <span className="pixel-font" style={{ fontSize: 8, color: item.value === "ON" ? "var(--green)" : "var(--game-muted)", border: `1px solid ${item.value === "ON" ? "var(--green)" : "var(--game-border)"}`, padding: "3px 6px" }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: 1, background: "var(--game-border)", margin: "0 16px" }} />

        {/* AUTO-INVEST */}
        <div style={{ padding: "14px 16px" }}>
          {sectionHeader("AUTO-INVEST")}

          {/* Master enable */}
          <div style={{ marginBottom: 10 }}>
            <ToggleRow
              label="💰 Auto-Invest Enabled"
              note="Silently executes rules during vendor / anvil events"
              active={autoInvest.enabled}
              onClick={() => updateAI({ enabled: !autoInvest.enabled })}
            />
          </div>

          {/* Rules — only show when enabled */}
          {autoInvest.enabled && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

              {/* Gold reserve */}
              <GoldStepper
                label="🏦 Gold Reserve (never drop below)"
                value={autoInvest.goldReserve}
                step={500}
                min={0}
                onChange={(v) => updateAI({ goldReserve: v })}
              />

              {/* Divider */}
              <div className="pixel-font" style={{ fontSize: 7, color: "var(--game-muted)", letterSpacing: 2, marginTop: 4 }}>VENDOR RULES</div>

              {/* Buy books from regular vendor */}
              <ToggleRow
                label="📚 Always Buy Books (Vendor)"
                note="Buys any book from regular vendor if gold reserve allows"
                active={autoInvest.buyBooks}
                onClick={() => updateAI({ buyBooks: !autoInvest.buyBooks })}
              />

              {/* Buy books from wandering scholar */}
              <ToggleRow
                label="📖 Buy from Wandering Scholar"
                note="Auto-buys the book when scholar spawns after floor 200"
                active={autoInvest.buyBookVendor}
                onClick={() => updateAI({ buyBookVendor: !autoInvest.buyBookVendor })}
              />

              {/* Buy gear */}
              <RarityPicker
                label="⚔️ Buy Gear — minimum rarity (OFF = skip gear)"
                value={autoInvest.buyGearMinRarity}
                allowNone
                onChange={(v) => updateAI({ buyGearMinRarity: v })}
              />
              {autoInvest.buyGearMinRarity !== null && (
                <GoldStepper
                  label="Max price per gear item (0 = no cap)"
                  value={autoInvest.buyGearMaxPrice}
                  step={100}
                  min={0}
                  onChange={(v) => updateAI({ buyGearMaxPrice: v })}
                />
              )}

              {/* Buy materials */}
              <ToggleRow
                label="⚙️ Buy Materials"
                note="Buys material stacks from vendor if gold reserve allows"
                active={autoInvest.buyMaterials}
                onClick={() => updateAI({ buyMaterials: !autoInvest.buyMaterials })}
              />

              {/* Divider */}
              <div className="pixel-font" style={{ fontSize: 7, color: "var(--game-muted)", letterSpacing: 2, marginTop: 4 }}>ANVIL RULES</div>

              {/* Anvil auto-break */}
              <RarityPicker
                label="🔨 Auto-Break Gear — max rarity (OFF = skip anvil)"
                value={autoInvest.anvilBreakMaxRarity}
                allowNone
                onChange={(v) => updateAI({ anvilBreakMaxRarity: v })}
              />
              {autoInvest.anvilBreakMaxRarity !== null && (
                <>
                  <ToggleRow
                    label="📦 Also Break Stash Gear"
                    note="Extends auto-break to stash (not just bag) — use with caution!"
                    active={autoInvest.anvilBreakFromStash}
                    onClick={() => updateAI({ anvilBreakFromStash: !autoInvest.anvilBreakFromStash })}
                  />
                  <div style={{ fontSize: 12, color: "var(--game-muted)", padding: "4px 12px", background: "rgba(255,100,0,0.06)", border: "1px solid rgba(255,100,0,0.2)", borderRadius: 4 }}>
                    ⚠️ Gear at or below <strong style={{ color: "var(--game-text)" }}>{autoInvest.anvilBreakMaxRarity}</strong>{autoInvest.anvilBreakFromStash ? " in your bag AND stash" : " in your bag"} will be automatically broken down into Enhancement XP when an anvil spawns.
                  </div>
                  <ToggleRow
                    label="🛡️ Protect GS Gear"
                    note="Never auto-break gear that has a Gear Score, regardless of rarity"
                    active={autoInvest.anvilProtectGS}
                    onClick={() => updateAI({ anvilProtectGS: !autoInvest.anvilProtectGS })}
                  />
                  {autoInvest.anvilProtectGS && (
                    <div style={{ fontSize: 12, color: "var(--game-muted)", padding: "4px 12px", background: "rgba(0,200,100,0.06)", border: "1px solid rgba(0,200,100,0.2)", borderRadius: 4 }}>
                      ✅ Any gear with a Gear Score (GS) will be kept safe from auto-salvage, even if it falls within the rarity threshold.
                    </div>
                  )}
                </>
              )}

              {/* Divider */}
              <div className="pixel-font" style={{ fontSize: 7, color: "var(--game-muted)", letterSpacing: 2, marginTop: 4 }}>FENCE RULES</div>

              {/* Auto-sell to fence */}
              <RarityPicker
                label="💸 Auto-Sell to Fence — max rarity (OFF = skip fence)"
                value={autoInvest.fenceSellMaxRarity}
                allowNone
                onChange={(v) => updateAI({ fenceSellMaxRarity: v })}
              />
              {autoInvest.fenceSellMaxRarity !== null && (
                <div style={{ fontSize: 12, color: "var(--game-muted)", padding: "4px 12px", background: "rgba(255,200,0,0.06)", border: "1px solid rgba(255,200,0,0.2)", borderRadius: 4 }}>
                  💸 Bag gear at or below <strong style={{ color: "var(--game-text)" }}>{autoInvest.fenceSellMaxRarity}</strong> will be silently sold to the fence for gold (at fence rates: 15% of base value) when a fence spawns.
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ height: 1, background: "var(--game-border)", margin: "0 16px" }} />

        {/* ADVANCED LEAVE ME ALONE */}
        {leaveAloneMode && (
          <div style={{ padding: "14px 16px" }}>
            {sectionHeader("🤫 ADVANCED AFK SETTINGS")}
            <div style={{ fontSize: 12, color: "var(--game-muted)", marginBottom: 10 }}>
              Fine-tune what interrupts you while Leave Me Alone Mode is active.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <ToggleRow
                label="🏆 Auto-Advance Difficulty"
                note="When you hit the max floor of a difficulty tier, automatically advance to the next tier without pausing"
                active={leaveAloneAdvanced.autoAdvanceDifficulty}
                onClick={() => updateLAA({ autoAdvanceDifficulty: !leaveAloneAdvanced.autoAdvanceDifficulty })}
              />
              {leaveAloneAdvanced.autoAdvanceDifficulty && (
                <div style={{ fontSize: 12, color: "var(--game-muted)", padding: "4px 12px", background: "rgba(100,255,100,0.06)", border: "1px solid rgba(100,255,100,0.2)", borderRadius: 4 }}>
                  ✅ On reaching Easy floor 1000, Medium floor 2000, etc. the run silently resets to floor 1 on the next tier. Walk never pauses.
                </div>
              )}
              <ToggleRow
                label="☠️ Show Mega Boss Reward"
                note="Pauses run and shows reward popup on wave-100 boss floors so you can pick Portal / Enchanting Table"
                active={leaveAloneAdvanced.showMegaBossReward}
                onClick={() => updateLAA({ showMegaBossReward: !leaveAloneAdvanced.showMegaBossReward })}
              />
              {leaveAloneAdvanced.showMegaBossReward && (
                <div style={{ fontSize: 12, color: "var(--game-muted)", padding: "4px 12px", background: "rgba(255,170,0,0.06)", border: "1px solid rgba(255,170,0,0.2)", borderRadius: 4 }}>
                  ✅ The run will pause at every floor 100, 200, 300… so you can choose Portal (return to base) or Enchanting Table.
                </div>
              )}
              <ToggleRow
                label="⭐ Auto-Equip Higher GS"
                note="Automatically swap in any bag GS item that beats your currently equipped GS item in the same slot"
                active={leaveAloneAdvanced.autoEquipHigherGS}
                onClick={() => updateLAA({ autoEquipHigherGS: !leaveAloneAdvanced.autoEquipHigherGS })}
              />
              {leaveAloneAdvanced.autoEquipHigherGS && (
                <>
                  <div style={{ fontSize: 12, color: "var(--game-muted)", padding: "4px 12px", background: "rgba(0,200,255,0.06)", border: "1px solid rgba(0,200,255,0.2)", borderRadius: 4 }}>
                    ✅ Only swaps GS gear for GS gear. Normal (non-GS) items are never auto-equipped. The old GS item goes back into your bag.
                  </div>
                  <div style={{ fontSize: 11, color: "var(--game-muted)", marginTop: 4, marginBottom: 2 }}>
                    ENABLED SLOTS (tap to toggle — all enabled when none selected)
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
                    {ALL_GS_SLOTS.map((sl) => {
                      const slots = leaveAloneAdvanced.autoEquipGSSlots ?? [];
                      const isEnabled = slots.length === 0 || slots.includes(sl);
                      const isExplicit = slots.includes(sl);
                      function toggleSlot() {
                        const current = leaveAloneAdvanced.autoEquipGSSlots ?? [];
                        let next: GearSlot[];
                        if (current.length === 0) {
                          // All were implicitly on — explicitly disable just this one
                          next = ALL_GS_SLOTS.filter((s) => s !== sl);
                        } else if (isExplicit) {
                          next = current.filter((s) => s !== sl);
                          if (next.length === ALL_GS_SLOTS.length - 1) next = []; // all on = reset to empty
                        } else {
                          next = [...current, sl];
                          if (next.length === ALL_GS_SLOTS.length) next = []; // all on = reset to empty
                        }
                        updateLAA({ autoEquipGSSlots: next });
                      }
                      return (
                        <button
                          key={sl}
                          onClick={toggleSlot}
                          style={{
                            fontFamily: "'VT323', monospace",
                            fontSize: 12,
                            padding: "4px 6px",
                            cursor: "pointer",
                            borderRadius: 3,
                            border: isEnabled ? "1px solid rgba(0,200,255,0.5)" : "1px solid rgba(100,100,150,0.3)",
                            background: isEnabled ? "rgba(0,200,255,0.12)" : "rgba(30,30,50,0.5)",
                            color: isEnabled ? "#00c8ff" : "var(--game-muted)",
                          }}
                        >
                          {isEnabled ? "☑" : "☐"} {GS_SLOT_LABELS[sl]}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Version */}
        <div style={{ textAlign: "center", padding: "0 16px 4px", fontSize: 12, color: "rgba(100,100,150,0.5)", fontFamily: "'Press Start 2P', monospace" }}>
          STRIDE BORN v0.1.0
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateX(-50%) translateY(100%); } to { transform: translateX(-50%) translateY(0); } }
      `}</style>
    </>
  );
}
