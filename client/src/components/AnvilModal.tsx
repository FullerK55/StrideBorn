// AnvilModal.tsx
// In-dungeon Anvil event (floor 100+): break down bag gear into Enhancement XP items.
// Enhancement XP items are cross-slot but only worth 10% of the gear's full XP value.
// Design: retro pixel aesthetic, red/ember-bordered dark modal matching VendorModal style.

import { useState } from "react";
import type { GameState, GameActions, GearItem, EnhancementXpItem } from "@/hooks/useGameState";
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
};

function calcEnhXp(gear: GearItem): number {
  const rawXp = TIER_XP_VALUE[gear.tier] * RARITY_XP_VALUE[gear.rarity] * 10;
  return Math.max(1, Math.floor(rawXp * 0.1));
}

function getSlotLabel(slotId: string): string {
  return GEAR_SLOTS.find((s) => s.id === slotId)?.label ?? slotId;
}

export default function AnvilModal({ state, actions }: Props) {
  const { activeAnvil, bag } = state;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmed, setConfirmed] = useState(false);

  if (!activeAnvil) return null;

  // Gear items currently in bag (not EnhXp items)
  const bagGear: { idx: number; gear: GearItem }[] = bag
    .map((b, idx) => ({ idx, b }))
    .filter(({ b }) => b && !("isEnhXp" in b))
    .map(({ idx, b }) => ({ idx, gear: b as GearItem }));

  // EnhXp items already in bag
  const existingEnhXp: { idx: number; item: EnhancementXpItem & { id: string } }[] = bag
    .map((b, idx) => ({ idx, b }))
    .filter(({ b }) => b && "isEnhXp" in b)
    .map(({ idx, b }) => ({ idx, item: b as unknown as EnhancementXpItem & { id: string } }));

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

  const handleDismiss = () => {
    actions.dismissAnvil();
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
              Floor {activeAnvil.floor} · Break gear into Enhancement XP
            </div>
          </div>
          <button onClick={handleDismiss} style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, background: "transparent", color: "#555", border: "1px solid #333", borderRadius: 3, padding: "5px 8px", cursor: "pointer" }}>
            LEAVE
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px" }}>

          {/* Info banner */}
          <div style={{ background: "rgba(255,100,34,0.07)", border: "1px solid #3a1a00", borderRadius: 4, padding: "10px 12px", marginBottom: 14 }}>
            <div style={{ fontFamily: "'VT323', monospace", fontSize: 14, color: "#cc8844", lineHeight: 1.5 }}>
              Break down gear into <span style={{ color: "#ff8844" }}>Enhancement XP items</span> that can be used on <em>any slot</em> at the Enhancement Table.
              <br />
              <span style={{ color: "#ff4422" }}>⚠ Only 10% of the gear's full XP value is retained.</span>
              <br />
              Same-slot gear at base gives full XP — use the Anvil only when you have surplus off-slot gear.
            </div>
          </div>

          {/* Gear selection */}
          <div style={s.sectionTitle}>SELECT GEAR TO BREAK DOWN</div>

          {bagGear.length === 0 ? (
            <div style={{ ...s.muted, textAlign: "center", padding: "20px 0" }}>No gear in bag.</div>
          ) : (
            bagGear.map(({ gear }) => {
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
            })
          )}

          {/* Existing EnhXp items in bag */}
          {existingEnhXp.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={s.sectionTitle}>ENHANCEMENT XP IN BAG</div>
              {existingEnhXp.map(({ item }) => (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "rgba(255,100,34,0.05)", border: "1px solid #2a1a00", borderRadius: 3, marginBottom: 4 }}>
                  <span style={{ fontSize: 16 }}>✨</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'VT323', monospace", fontSize: 14, color: "#ff8844" }}>
                      Enhancement XP · {item.xp} XP
                    </div>
                    <div style={{ fontFamily: "'VT323', monospace", fontSize: 12, color: "#555" }}>
                      From: {getSlotLabel(item.sourceSlot)} · Usable on any slot
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid #2a1a0a", flexShrink: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {selectedIds.size > 0 && (
            <div style={{ fontFamily: "'VT323', monospace", fontSize: 14, color: "#ff8844", textAlign: "center" }}>
              {selectedIds.size} item{selectedIds.size > 1 ? "s" : ""} →{" "}
              <span style={{ color: "#ffcc44" }}>+{totalEnhXp} Enh XP</span>
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
        </div>
      </div>
    </div>
  );
}
