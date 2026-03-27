// ShopTab — base-only gold shop
// Services: stat reroll (150g), extra bag slot (500g)
// Design: retro pixel aesthetic matching the rest of the game

import { useState } from "react";
import type { GameState, GameActions, GearItem } from "@/hooks/useGameState";
import { RARITY_COLORS, RARITY_LABELS, TIER_LABELS } from "@/hooks/useGameState";

interface Props {
  state: GameState;
  actions: GameActions;
}

const REROLL_COST = 150;
const BAG_SLOT_COST = 500;

const s = {
  section: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid #333",
    borderRadius: 6,
    padding: "14px 14px",
    marginBottom: 12,
  } as React.CSSProperties,
  sectionTitle: {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 9,
    color: "#ffcc44",
    marginBottom: 10,
    letterSpacing: 1,
  } as React.CSSProperties,
  desc: {
    fontFamily: "'VT323', monospace",
    fontSize: 15,
    color: "#aaa",
    marginBottom: 10,
    lineHeight: 1.4,
  } as React.CSSProperties,
  btn: (enabled: boolean): React.CSSProperties => ({
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 8,
    padding: "8px 14px",
    background: enabled ? "#1a1000" : "#1a1a1a",
    color: enabled ? "#ffcc44" : "#555",
    border: `1px solid ${enabled ? "#ffaa00" : "#444"}`,
    borderRadius: 4,
    cursor: enabled ? "pointer" : "not-allowed",
    transition: "background 0.15s",
  }),
  itemRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 10px",
    background: "rgba(0,0,0,0.4)",
    border: "1px solid #2a2a2a",
    borderRadius: 4,
    marginBottom: 6,
    cursor: "pointer",
  } as React.CSSProperties,
};

export default function ShopTab({ state, actions }: Props) {
  const isAtBase = !state.isInDungeon && !state.isReturning;
  const [selectedGearId, setSelectedGearId] = useState<string | null>(null);
  const [confirmBagSlot, setConfirmBagSlot] = useState(false);

  const selectedGear = state.stash.find((g) => g.id === selectedGearId) ?? null;

  function handleReroll() {
    if (!selectedGearId) return;
    actions.shopReroll(selectedGearId);
    setSelectedGearId(null);
  }

  function handleBagSlot() {
    if (confirmBagSlot) {
      actions.shopBuyBagSlot();
      setConfirmBagSlot(false);
    } else {
      setConfirmBagSlot(true);
      setTimeout(() => setConfirmBagSlot(false), 3000);
    }
  }

  if (!isAtBase) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>🏪</div>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#ff4444" }}>
          RETURN TO BASE
        </div>
        <div style={{ fontFamily: "'VT323', monospace", fontSize: 15, color: "#666", marginTop: 6 }}>
          Shop is only available at base
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "10px 4px" }}>
      {/* Gold display */}
      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 14, color: "#ffcc44" }}>
          💰 {state.gold.toLocaleString()}g
        </div>
        <div style={{ fontFamily: "'VT323', monospace", fontSize: 13, color: "#666", marginTop: 2 }}>
          Your gold balance
        </div>
      </div>

      {/* Stat Reroll Service */}
      <div style={s.section}>
        <div style={s.sectionTitle}>🎲 STAT REROLL — {REROLL_COST}g</div>
        <div style={s.desc}>
          Select a gear piece from your stash to reroll all its stats. Costs {REROLL_COST} gold.
        </div>

        {/* Gear picker */}
        {state.stash.length === 0 ? (
          <div style={{ fontFamily: "'VT323', monospace", fontSize: 14, color: "#555" }}>No gear in stash</div>
        ) : (
          <div style={{ maxHeight: 200, overflowY: "auto", marginBottom: 10 }}>
            {state.stash.map((gear: GearItem) => (
              <div
                key={gear.id}
                onClick={() => setSelectedGearId(gear.id === selectedGearId ? null : gear.id)}
                style={{
                  ...s.itemRow,
                  border: `1px solid ${gear.id === selectedGearId ? "#ffaa00" : "#2a2a2a"}`,
                  background: gear.id === selectedGearId ? "rgba(255,170,0,0.1)" : "rgba(0,0,0,0.4)",
                }}
              >
                <span style={{ fontSize: 20 }}>{gear.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'VT323', monospace", fontSize: 14, color: RARITY_COLORS[gear.rarity], overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {gear.name}
                  </div>
                  <div style={{ fontFamily: "'VT323', monospace", fontSize: 12, color: "#666" }}>
                    {RARITY_LABELS[gear.rarity]} · {TIER_LABELS[gear.tier]}
                  </div>
                </div>
                {gear.id === selectedGearId && <span style={{ color: "#ffaa00", fontSize: 16 }}>✓</span>}
              </div>
            ))}
          </div>
        )}

        {selectedGear && (
          <div style={{ marginBottom: 10, padding: "8px 10px", background: "rgba(255,170,0,0.05)", border: "1px solid #664400", borderRadius: 4 }}>
            <div style={{ fontFamily: "'VT323', monospace", fontSize: 13, color: "#aaa", marginBottom: 4 }}>Current stats:</div>
            {selectedGear.stats.map((st, i) => (
              <div key={i} style={{ fontFamily: "'VT323', monospace", fontSize: 13, color: "#88aaff" }}>
                +{st.value} {st.stat}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleReroll}
          disabled={!selectedGearId || state.gold < REROLL_COST}
          style={s.btn(!!selectedGearId && state.gold >= REROLL_COST)}
        >
          🎲 REROLL STATS ({REROLL_COST}g)
        </button>
        {state.gold < REROLL_COST && (
          <div style={{ fontFamily: "'VT323', monospace", fontSize: 13, color: "#ff4444", marginTop: 6 }}>
            Need {REROLL_COST - state.gold}g more
          </div>
        )}
      </div>

      {/* Bag Slot Purchase */}
      <div style={s.section}>
        <div style={s.sectionTitle}>🎒 EXTRA BAG SLOT — {BAG_SLOT_COST}g</div>
        <div style={s.desc}>
          Permanently add 1 extra bag slot. Current bag size: {state.bagSize} slots.
        </div>
        <button
          onClick={handleBagSlot}
          disabled={state.gold < BAG_SLOT_COST}
          style={s.btn(state.gold >= BAG_SLOT_COST)}
        >
          {confirmBagSlot ? `✓ CONFIRM (${BAG_SLOT_COST}g)` : `🎒 BUY SLOT (${BAG_SLOT_COST}g)`}
        </button>
        {state.gold < BAG_SLOT_COST && (
          <div style={{ fontFamily: "'VT323', monospace", fontSize: 13, color: "#ff4444", marginTop: 6 }}>
            Need {BAG_SLOT_COST - state.gold}g more
          </div>
        )}
      </div>

      {/* Coming soon */}
      <div style={{ ...s.section, opacity: 0.5 }}>
        <div style={s.sectionTitle}>🔮 MORE SERVICES</div>
        <div style={s.desc}>More shop services coming soon — consumables, special items, and more.</div>
      </div>
    </div>
  );
}
