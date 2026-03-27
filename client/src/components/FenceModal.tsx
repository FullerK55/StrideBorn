// FenceModal — standalone fence vendor that buys bag gear at rip-off prices
// Appears after floor 50, every 20-30 floors, never same floor as vendor or anvil
// Design: retro pixel aesthetic, dark red/grey theme (shady feel)

import { useMemo } from "react";
import type { GameState, GameActions, GearItem } from "@/hooks/useGameState";
import { RARITY_COLORS, RARITY_LABELS, TIER_LABELS, TIER_COLORS, FENCE_SELL_MULT } from "@/hooks/useGameState";

interface Props {
  state: GameState;
  actions: GameActions;
}

export default function FenceModal({ state, actions }: Props) {
  const fence = state.activeFence;
  if (!fence) return null;

  const bagGear = useMemo(() =>
    state.bag
      .map((b, i) => ({ item: b, idx: i }))
      .filter((x): x is { item: GearItem; idx: number } => !!x.item && 'isGear' in x.item),
    [state.bag]
  );

  function fencePrice(gear: GearItem): number {
    const base = { scrap: 10, common: 30, uncommon: 60, rare: 120, epic: 250, legendary: 500, mythic: 1000 }[gear.rarity];
    return Math.max(1, Math.floor((base + gear.stats.length * 5) * FENCE_SELL_MULT));
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.87)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "0 16px" }}>
      <div style={{ background: "#0a0a0a", border: "2px solid #884422", borderRadius: 6, width: "100%", maxWidth: 420, maxHeight: "88vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 0 40px rgba(180,80,0,0.25)" }}>

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #110600, #1e0c00)", borderBottom: "2px solid #884422", padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 26 }}>💸</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#cc7733" }}>THE FENCE</div>
            <div style={{ fontFamily: "'VT323', monospace", fontSize: 13, color: "#777", marginTop: 2 }}>Floor {fence.floor} · Shady dealer</div>
          </div>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#cc7733" }}>💰 {state.gold.toLocaleString()}g</div>
        </div>

        {/* Warning banner */}
        <div style={{ background: "rgba(120,40,0,0.3)", borderBottom: "1px solid #553311", padding: "7px 14px" }}>
          <div style={{ fontFamily: "'VT323', monospace", fontSize: 13, color: "#aa6633" }}>
            ⚠ Prices are ~{Math.round(FENCE_SELL_MULT * 100)}% of base value. Convenient, but a rip-off. Salvage at base for materials instead.
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
          {bagGear.length === 0 ? (
            <div style={{ textAlign: "center", padding: 30 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🎒</div>
              <div style={{ fontFamily: "'VT323', monospace", fontSize: 15, color: "#666" }}>No gear in bag to sell</div>
            </div>
          ) : (
            bagGear.map(({ item: gear }) => {
              const price = fencePrice(gear);
              return (
                <div key={gear.id} style={{ background: "rgba(0,0,0,0.5)", border: "1px solid #2a1a0a", borderRadius: 4, padding: "9px 12px", display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
                  <span style={{ fontSize: 20 }}>{gear.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'VT323', monospace", fontSize: 15, color: RARITY_COLORS[gear.rarity], overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{gear.name}</div>
                    <div style={{ fontFamily: "'VT323', monospace", fontSize: 12, color: "#555" }}>
                      {RARITY_LABELS[gear.rarity]} · <span style={{ color: TIER_COLORS[gear.tier] }}>{TIER_LABELS[gear.tier]}</span>
                    </div>
                    {gear.stats.length > 0 && (
                      <div style={{ fontFamily: "'VT323', monospace", fontSize: 12, color: "#444", marginTop: 2 }}>
                        {gear.stats.map((st) => `+${st.value} ${st.stat}`).join(" · ")}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => actions.fenceSellGear(gear.id)}
                    style={{
                      fontFamily: "'Press Start 2P', monospace",
                      fontSize: 8,
                      padding: "7px 10px",
                      background: "#0d0500",
                      color: "#cc7733",
                      border: "1px solid #884422",
                      borderRadius: 3,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    💰 {price}g
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid #553311", padding: "10px 14px" }}>
          <button
            onClick={actions.dismissFence}
            style={{ width: "100%", fontFamily: "'Press Start 2P', monospace", fontSize: 9, padding: "10px", background: "#110600", color: "#884422", border: "1px solid #884422", borderRadius: 4, cursor: "pointer" }}
          >
            ▶ CONTINUE EXPLORING
          </button>
        </div>
      </div>
    </div>
  );
}
