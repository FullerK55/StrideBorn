// VendorModal — in-dungeon wandering vendor popup
// Auto-pauses walking when shown; resumes on dismiss
// Design: retro pixel aesthetic, gold-bordered dark modal

import type { GameState, GameActions, VendorItem } from "@/hooks/useGameState";
import { RARITY_COLORS } from "@/hooks/useGameState";

interface Props {
  state: GameState;
  actions: GameActions;
}

export default function VendorModal({ state, actions }: Props) {
  const vendor = state.activeVendor;
  if (!vendor) return null;

  function renderItem(item: VendorItem) {
    const canAfford = state.gold >= item.cost;
    return (
      <div
        key={item.id}
        style={{
          background: "rgba(0,0,0,0.6)",
          border: "1px solid #664400",
          borderRadius: 4,
          padding: "10px 12px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 24, minWidth: 32, textAlign: "center" }}>{item.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#ffcc44", marginBottom: 4, wordBreak: "break-word" }}>
            {item.label}
          </div>
          {item.gear && (
            <div style={{ fontFamily: "'VT323', monospace", fontSize: 13, color: RARITY_COLORS[item.gear.rarity] }}>
              {item.gear.rarity.toUpperCase()} · {item.gear.tier.toUpperCase()}
            </div>
          )}
          {item.gear && item.gear.stats.length > 0 && (
            <div style={{ fontFamily: "'VT323', monospace", fontSize: 12, color: "#aaa", marginTop: 2 }}>
              {item.gear.stats.map((s) => `+${s.value} ${s.stat}`).join(" · ")}
            </div>
          )}
        </div>
        <button
          onClick={() => actions.buyFromVendor(item.id)}
          disabled={!canAfford}
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 8,
            padding: "6px 10px",
            background: canAfford ? "#664400" : "#333",
            color: canAfford ? "#ffcc44" : "#666",
            border: `1px solid ${canAfford ? "#ffaa00" : "#555"}`,
            borderRadius: 3,
            cursor: canAfford ? "pointer" : "not-allowed",
            whiteSpace: "nowrap",
            minWidth: 70,
          }}
        >
          💰 {item.cost}g
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        padding: "0 16px",
      }}
    >
      <div
        style={{
          background: "#0a0a0a",
          border: "2px solid #ffaa00",
          borderRadius: 6,
          width: "100%",
          maxWidth: 420,
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 0 40px rgba(255,170,0,0.3)",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #1a0a00, #2a1400)",
            borderBottom: "2px solid #ffaa00",
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 28 }}>🛒</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: "#ffcc44" }}>
              WANDERING VENDOR
            </div>
            <div style={{ fontFamily: "'VT323', monospace", fontSize: 14, color: "#aaa", marginTop: 2 }}>
              Floor {vendor.floor} · {vendor.items.length} item{vendor.items.length !== 1 ? "s" : ""} available
            </div>
          </div>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#ffcc44" }}>
            💰 {state.gold.toLocaleString()}g
          </div>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
          {vendor.items.length === 0 ? (
            <div style={{ fontFamily: "'VT323', monospace", fontSize: 16, color: "#666", textAlign: "center", padding: 20 }}>
              Sold out!
            </div>
          ) : (
            vendor.items.map(renderItem)
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid #664400", padding: "12px 14px" }}>
          <button
            onClick={actions.dismissVendor}
            style={{
              width: "100%",
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 9,
              padding: "10px",
              background: "#1a0a00",
              color: "#ff8844",
              border: "1px solid #ff8844",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            ▶ CONTINUE EXPLORING
          </button>
        </div>
      </div>
    </div>
  );
}
