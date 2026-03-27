// AnvilModal.tsx
// In-dungeon Anvil event (floor 100+): break down bag gear into the Enhancement XP pool.
// Two modes:
//   MANUAL — tap individual items to select them
//   MASS   — set rarity threshold + slot filter, auto-selects all matching gear
// Design: retro pixel aesthetic, red/ember-bordered dark modal matching VendorModal style.

import { useState, useMemo } from "react";
import type { GameState, GameActions, GearItem, GearRarity, GearSlot } from "@/hooks/useGameState";
import {
  RARITY_COLORS,
  RARITY_LABELS,
  TIER_LABELS,
  TIER_XP_VALUE,
  RARITY_XP_VALUE,
  GEAR_SLOTS,
  ANVIL_COST_PER_TIER,
} from "@/hooks/useGameState";

interface Props {
  state: GameState;
  actions: GameActions;
}

const RARITY_ORDER: GearRarity[] = ["scrap", "common", "uncommon", "rare", "epic", "legendary", "mythic"];

const s = {
  sectionTitle: {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 9,
    color: "#ff8844",
    marginBottom: 8,
    letterSpacing: 1,
  } as React.CSSProperties,
  muted: {
    fontFamily: "'VT323', monospace",
    fontSize: 14,
    color: "#888",
  } as React.CSSProperties,
  btn: (enabled: boolean, color = "#ff6622"): React.CSSProperties => ({
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 8,
    padding: "7px 12px",
    background: enabled ? "#110500" : "#1a1a1a",
    color: enabled ? color : "#555",
    border: `1px solid ${enabled ? color : "#444"}`,
    borderRadius: 3,
    cursor: enabled ? "pointer" : "not-allowed",
    transition: "background 0.15s",
    whiteSpace: "nowrap" as const,
  }),
  itemRow: (selected = false): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "7px 10px",
    background: selected ? "rgba(255,100,34,0.12)" : "rgba(255,255,255,0.02)",
    border: `1px solid ${selected ? "#ff6622" : "#2a2a2a"}`,
    borderRadius: 3,
    cursor: "pointer",
    marginBottom: 4,
  }),
  filterChip: (active: boolean, color = "#ff8844"): React.CSSProperties => ({
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 7,
    padding: "4px 7px",
    background: active ? `${color}22` : "transparent",
    color: active ? color : "#555",
    border: `1px solid ${active ? color : "#333"}`,
    borderRadius: 3,
    cursor: "pointer",
    transition: "all 0.12s",
    whiteSpace: "nowrap" as const,
  }),
};

function calcEnhXp(gear: GearItem): number {
  const rawXp = TIER_XP_VALUE[gear.tier] * RARITY_XP_VALUE[gear.rarity] * 10;
  return Math.max(1, Math.floor(rawXp * 0.1));
}

function getSlotLabel(slotId: string): string {
  return GEAR_SLOTS.find((s) => s.id === slotId)?.label ?? slotId;
}

type AnvilTab = "manual" | "mass";

export default function AnvilModal({ state, actions }: Props) {
  const { activeAnvil, bag } = state;

  // ── Manual mode state ──────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmed, setConfirmed] = useState(false);

  // ── Mass mode state ────────────────────────────────────────
  const [tab, setTab] = useState<AnvilTab>("manual");
  // "up to and including this rarity" — default: scrap only
  const [massMaxRarity, setMassMaxRarity] = useState<GearRarity>("scrap");
  // null = all slots; otherwise only these slots
  const [massSlots, setMassSlots] = useState<Set<GearSlot>>(new Set());
  const [massConfirmed, setMassConfirmed] = useState(false);

  if (!activeAnvil) return null;

  const isBaseAnvil = activeAnvil.floor === 0;
  const poolBalance = state.enhancementXpPool;

  // All bag gear
  const bagGear: { idx: number; gear: GearItem }[] = bag
    .map((b, idx) => ({ idx, b }))
    .filter(({ b }) => b && 'isGear' in b && (b as GearItem).isGear === true)
    .map(({ idx, b }) => ({ idx, gear: b as GearItem }));

  // Stash gear (only available at base anvil)
  const stashGear: { gear: GearItem }[] = isBaseAnvil
    ? state.stash.map((g) => ({ gear: g }))
    : [];

  // Combined list for manual/mass selection
  const allGear = [
    ...bagGear.map(({ gear }) => gear),
    ...stashGear.map(({ gear }) => gear),
  ];

  // ── Manual helpers ─────────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setConfirmed(false);
  };

  const selectedGear = bagGear.filter(({ gear }) => selectedIds.has(gear.id));
  const totalEnhXp = selectedGear.reduce((sum, { gear }) => sum + calcEnhXp(gear), 0);
  const totalRawXp = selectedGear.reduce((sum, { gear }) => sum + TIER_XP_VALUE[gear.tier] * RARITY_XP_VALUE[gear.rarity] * 10, 0);
  const totalGoldCost = selectedGear.reduce((sum, { gear }) => sum + ANVIL_COST_PER_TIER[gear.tier], 0);
  const canAfford = state.gold >= totalGoldCost;

  const handleBreakdown = () => {
    if (selectedIds.size === 0) return;
    if (!confirmed) { setConfirmed(true); return; }
    actions.anvilBreakdown(Array.from(selectedIds));
    setSelectedIds(new Set());
    setConfirmed(false);
  };

  // ── Mass helpers ───────────────────────────────────────────
  const maxRarityIdx = RARITY_ORDER.indexOf(massMaxRarity);

  const massMatches = useMemo(() => {
    return allGear.filter((gear) => {
      const rarityIdx = RARITY_ORDER.indexOf(gear.rarity);
      if (rarityIdx > maxRarityIdx) return false;
      if (massSlots.size > 0 && !massSlots.has(gear.slot)) return false;
      return true;
    });
  }, [bagGear, maxRarityIdx, massSlots]);

  const massTotalXp = massMatches.reduce((sum, gear) => sum + calcEnhXp(gear), 0);
  const massTotalCost = massMatches.reduce((sum, gear) => sum + ANVIL_COST_PER_TIER[gear.tier], 0);
  const massCanAfford = state.gold >= massTotalCost;

  const toggleMassSlot = (slot: GearSlot) => {
    setMassSlots((prev) => {
      const next = new Set(prev);
      if (next.has(slot)) next.delete(slot);
      else next.add(slot);
      return next;
    });
    setMassConfirmed(false);
  };

  const handleMassBreakdown = () => {
    if (massMatches.length === 0) return;
    if (!massConfirmed) { setMassConfirmed(true); return; }
    actions.anvilBreakdown(massMatches.map((gear) => gear.id));
    setMassConfirmed(false);
  };

  const handleDismiss = () => {
    if (isBaseAnvil) {
      // At base: just close the modal, don't restart walk interval
      actions.dismissAnvil();
    } else {
      actions.dismissAnvil();
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.87)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "0 16px" }}>
      <div style={{ background: "#0a0500", border: "2px solid #ff6622", borderRadius: 6, width: "100%", maxWidth: 440, maxHeight: "88vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 0 40px rgba(255,100,34,0.3)" }}>

        {/* Header */}
        <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid #2a1a0a", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 11, color: "#ff8844", letterSpacing: 1 }}>
              ⚔️ ANVIL
            </div>
            <div style={{ fontFamily: "'VT323', monospace", fontSize: 13, color: "#666", marginTop: 3 }}>
              {isBaseAnvil ? "Base · Bag & Stash · Break gear into Enh XP" : `Floor ${activeAnvil.floor} · Break gear into Enhancement XP`}
            </div>
          </div>
          <button onClick={handleDismiss} style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, background: "transparent", color: "#555", border: "1px solid #333", borderRadius: 3, padding: "5px 8px", cursor: "pointer" }}>
            LEAVE
          </button>
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", borderBottom: "1px solid #2a1a0a", background: "#080300", flexShrink: 0 }}>
          {(["manual", "mass"] as AnvilTab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setConfirmed(false); setMassConfirmed(false); }}
              style={{
                flex: 1,
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 8,
                padding: "9px 0",
                background: "none",
                border: "none",
                borderBottom: `2px solid ${tab === t ? "#ff6622" : "transparent"}`,
                color: tab === t ? "#ff8844" : "#555",
                cursor: "pointer",
                letterSpacing: 1,
              }}
            >
              {t === "manual" ? "✋ MANUAL" : "⚡ MASS"}
            </button>
          ))}
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px" }}>

          {/* Pool balance banner */}
          <div style={{
            background: poolBalance > 0 ? "rgba(255,170,68,0.08)" : "rgba(255,100,34,0.07)",
            border: poolBalance > 0 ? "1px solid #ffaa44" : "1px solid #3a1a00",
            borderRadius: 4,
            padding: "10px 12px",
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}>
            <span style={{ fontSize: 22 }}>✨</span>
            <div>
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#ffaa44", marginBottom: 3 }}>
                ENHANCEMENT XP POOL
              </div>
              <div style={{ fontFamily: "'VT323', monospace", fontSize: 18, color: poolBalance > 0 ? "#ffcc44" : "#555" }}>
                {poolBalance.toLocaleString()} XP
              </div>
              <div style={{ fontFamily: "'VT323', monospace", fontSize: 12, color: "#666" }}>
                Spend at the Enhancement Table (base) · Cross-slot
              </div>
            </div>
          </div>

          {/* ── MANUAL TAB ── */}
          {tab === "manual" && (
            <>
              <div style={{ background: "rgba(255,100,34,0.07)", border: "1px solid #3a1a00", borderRadius: 4, padding: "10px 12px", marginBottom: 14 }}>
                <div style={{ fontFamily: "'VT323', monospace", fontSize: 14, color: "#cc8844", lineHeight: 1.5 }}>
                  Break down gear to add XP to your <span style={{ color: "#ffaa44" }}>Enhancement XP Pool</span>.
                  <br />
                  <span style={{ color: "#ff4422" }}>⚠ Only 10% of the gear's full XP value is retained.</span>
                </div>
              </div>

              <div style={s.sectionTitle}>SELECT GEAR TO BREAK DOWN</div>

              {bagGear.length === 0 && stashGear.length === 0 ? (
                <div style={{ ...s.muted, textAlign: "center", padding: "20px 0" }}>No gear in bag{isBaseAnvil ? " or stash" : ""}.</div>
              ) : (
                <>
                {bagGear.length > 0 && (
                  <>
                    {isBaseAnvil && <div style={{ fontFamily: "'VT323', monospace", fontSize: 12, color: "#88ccff", marginBottom: 4, letterSpacing: 1 }}>🎒 BAG</div>}
                    {bagGear.map(({ gear }) => {
                  const isSelected = selectedIds.has(gear.id);
                  const enhXp = calcEnhXp(gear);
                  const fullXp = TIER_XP_VALUE[gear.tier] * RARITY_XP_VALUE[gear.rarity] * 10;
                  return (
                    <div key={gear.id} style={s.itemRow(isSelected)} onClick={() => toggleSelect(gear.id)}>
                      <span style={{ fontSize: 18 }}>{gear.emoji}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'VT323', monospace", fontSize: 15, color: RARITY_COLORS[gear.rarity], overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {gear.name}
                        </div>
                        <div style={{ fontFamily: "'VT323', monospace", fontSize: 12, color: "#666" }}>
                          {RARITY_LABELS[gear.rarity]} · {TIER_LABELS[gear.tier]} · {getSlotLabel(gear.slot)}
                        </div>
                        <div style={{ fontFamily: "'VT323', monospace", fontSize: 11, color: "#444" }}>
                          Full XP: {fullXp} → Pool: +{enhXp}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#ff8844" }}>
                          +{enhXp} XP
                        </div>
                        <div style={{ fontFamily: "'VT323', monospace", fontSize: 12, color: "#ffcc44" }}>
                          {ANVIL_COST_PER_TIER[gear.tier]}g
                        </div>
                      </div>
                      <div style={{ width: 14, height: 14, border: `2px solid ${isSelected ? "#ff6622" : "#444"}`, borderRadius: 2, background: isSelected ? "#ff6622" : "transparent", flexShrink: 0 }} />
                    </div>
                  );
                })}
                  </>
                )}
                {isBaseAnvil && stashGear.length > 0 && (
                  <>
                    <div style={{ fontFamily: "'VT323', monospace", fontSize: 12, color: "#aaaacc", margin: "8px 0 4px", letterSpacing: 1 }}>📦 STASH</div>
                    {stashGear.map(({ gear }) => {
                      const isSelected = selectedIds.has(gear.id);
                      const enhXp = calcEnhXp(gear);
                      const fullXp = TIER_XP_VALUE[gear.tier] * RARITY_XP_VALUE[gear.rarity] * 10;
                      return (
                        <div key={gear.id} style={s.itemRow(isSelected)} onClick={() => toggleSelect(gear.id)}>
                          <span style={{ fontSize: 18 }}>{gear.emoji}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontFamily: "'VT323', monospace", fontSize: 15, color: RARITY_COLORS[gear.rarity], overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {gear.name}
                            </div>
                            <div style={{ fontFamily: "'VT323', monospace", fontSize: 12, color: "#666" }}>
                              {RARITY_LABELS[gear.rarity]} · {TIER_LABELS[gear.tier]} · {getSlotLabel(gear.slot)}
                            </div>
                            <div style={{ fontFamily: "'VT323', monospace", fontSize: 11, color: "#444" }}>
                              Full XP: {fullXp} → Pool: +{enhXp}
                            </div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#ff8844" }}>+{enhXp} XP</div>
                            <div style={{ fontFamily: "'VT323', monospace", fontSize: 12, color: "#ffcc44" }}>{ANVIL_COST_PER_TIER[gear.tier]}g</div>
                          </div>
                          <div style={{ width: 14, height: 14, border: `2px solid ${isSelected ? "#ff6622" : "#444"}`, borderRadius: 2, background: isSelected ? "#ff6622" : "transparent", flexShrink: 0 }} />
                        </div>
                      );
                    })}
                  </>
                )}
                </>
              )}
            </>
          )}

          {/* ── MASS TAB ── */}
          {tab === "mass" && (
            <>
              <div style={{ background: "rgba(255,100,34,0.07)", border: "1px solid #3a1a00", borderRadius: 4, padding: "10px 12px", marginBottom: 14 }}>
                <div style={{ fontFamily: "'VT323', monospace", fontSize: 14, color: "#cc8844", lineHeight: 1.5 }}>
                  Set filters below. All matching bag gear will be broken down at once.
                  <br />
                  <span style={{ color: "#ff4422" }}>⚠ Only 10% XP retained. Gear is permanently destroyed.</span>
                </div>
              </div>

              {/* Rarity threshold */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ ...s.sectionTitle, marginBottom: 10 }}>BREAK UP TO RARITY</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {RARITY_ORDER.map((r) => (
                    <button
                      key={r}
                      onClick={() => { setMassMaxRarity(r); setMassConfirmed(false); }}
                      style={s.filterChip(massMaxRarity === r, RARITY_COLORS[r])}
                    >
                      {RARITY_LABELS[r].replace(/^[^ ]+ /, "")}
                    </button>
                  ))}
                </div>
                <div style={{ fontFamily: "'VT323', monospace", fontSize: 12, color: "#555", marginTop: 5 }}>
                  Breaks all gear at or below the selected rarity
                </div>
              </div>

              {/* Slot filter */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ ...s.sectionTitle, marginBottom: 10 }}>
                  SLOT FILTER
                  <span style={{ fontFamily: "'VT323', monospace", fontSize: 12, color: "#555", marginLeft: 8, letterSpacing: 0 }}>
                    (none = all slots)
                  </span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {GEAR_SLOTS.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => toggleMassSlot(slot.id)}
                      style={s.filterChip(massSlots.has(slot.id), "#ff8844")}
                    >
                      {slot.emoji} {slot.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview list */}
              <div style={s.sectionTitle}>
                PREVIEW ({massMatches.length} item{massMatches.length !== 1 ? "s" : ""})
              </div>

              {massMatches.length === 0 ? (
                <div style={{ ...s.muted, textAlign: "center", padding: "16px 0" }}>
                  No matching gear in bag.
                </div>
              ) : (
                <div style={{ maxHeight: 200, overflowY: "auto" }}>
                  {massMatches.map((gear) => {
                    const enhXp = calcEnhXp(gear);
                    return (
                      <div key={gear.id} style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "5px 8px",
                        background: "rgba(255,100,34,0.06)",
                        border: "1px solid #2a1a0a",
                        borderRadius: 3,
                        marginBottom: 3,
                      }}>
                        <span style={{ fontSize: 16 }}>{gear.emoji}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: "'VT323', monospace", fontSize: 14, color: RARITY_COLORS[gear.rarity], overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {gear.name}
                          </div>
                          <div style={{ fontFamily: "'VT323', monospace", fontSize: 11, color: "#555" }}>
                            {RARITY_LABELS[gear.rarity].replace(/^[^ ]+ /, "")} · {getSlotLabel(gear.slot)}
                          </div>
                        </div>
                        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#ff8844", flexShrink: 0 }}>
                          +{enhXp} XP
                        </div>
                        <div style={{ fontFamily: "'VT323', monospace", fontSize: 12, color: "#ffcc44", flexShrink: 0 }}>
                          {ANVIL_COST_PER_TIER[gear.tier]}g
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid #2a1a0a", flexShrink: 0, display: "flex", flexDirection: "column", gap: 8 }}>

          {/* Manual footer */}
          {tab === "manual" && (
            <>
              {selectedIds.size > 0 && (
                <div style={{ fontFamily: "'VT323', monospace", fontSize: 14, color: "#ff8844", textAlign: "center" }}>
                  {selectedIds.size} item{selectedIds.size > 1 ? "s" : ""} →{" "}
                  <span style={{ color: "#ffcc44" }}>+{totalEnhXp} Pool XP</span>
                  <span style={{ color: "#555" }}> ({totalRawXp} full)</span>
                  {" · "}
                  <span style={{ color: canAfford ? "#ffcc44" : "#ff4422" }}>{totalGoldCost}g</span>
                  {!canAfford && <span style={{ color: "#ff4422" }}> (need {totalGoldCost - state.gold}g more)</span>}
                </div>
              )}
              {confirmed && (
                <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#ff4422", textAlign: "center", padding: "4px 0" }}>
                  ⚠ CONFIRM: GEAR WILL BE DESTROYED
                </div>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  style={{ ...s.btn(selectedIds.size > 0 && canAfford, confirmed ? "#ff4422" : "#ff6622"), flex: 1 }}
                  onClick={handleBreakdown}
                  disabled={selectedIds.size === 0 || !canAfford}
                >
                  {confirmed ? "⚠ CONFIRM BREAK DOWN" : "BREAK DOWN"}
                </button>
                <button style={{ ...s.btn(true, "#666"), flex: 0 }} onClick={handleDismiss}>
                  LEAVE
                </button>
              </div>
            </>
          )}

          {/* Mass footer */}
          {tab === "mass" && (
            <>
              {massMatches.length > 0 && (
                <div style={{ fontFamily: "'VT323', monospace", fontSize: 14, color: "#ff8844", textAlign: "center" }}>
                  {massMatches.length} item{massMatches.length !== 1 ? "s" : ""} →{" "}
                  <span style={{ color: "#ffcc44" }}>+{massTotalXp} Pool XP</span>
                  {" · "}
                  <span style={{ color: massCanAfford ? "#ffcc44" : "#ff4422" }}>{massTotalCost}g</span>
                  {!massCanAfford && <span style={{ color: "#ff4422" }}> (need {massTotalCost - state.gold}g more)</span>}
                </div>
              )}
              {massConfirmed && (
                <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#ff4422", textAlign: "center", padding: "4px 0" }}>
                  ⚠ CONFIRM: ALL {massMatches.length} ITEMS WILL BE DESTROYED
                </div>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  style={{ ...s.btn(massMatches.length > 0 && massCanAfford, massConfirmed ? "#ff4422" : "#ff6622"), flex: 1 }}
                  onClick={handleMassBreakdown}
                  disabled={massMatches.length === 0 || !massCanAfford}
                >
                  {massConfirmed
                    ? `⚠ CONFIRM BREAK ${massMatches.length}`
                    : `⚡ BREAK ALL (${massMatches.length})`}
                </button>
                <button style={{ ...s.btn(true, "#666"), flex: 0 }} onClick={handleDismiss}>
                  LEAVE
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
