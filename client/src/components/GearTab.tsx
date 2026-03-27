// Stride Born — Gear Tab
// Shows 9 equipment slots. Tap a bag item (gear) to equip it.
// Design: Retro pixel dungeon aesthetic — dark panels, gold accents

import React, { useState } from "react";
import type { GameState, GameActions, GearItem, GearSlot } from "@/hooks/useGameState";
import { GEAR_SLOTS, RARITY_COLORS, RARITY_LABELS, TIER_LABELS } from "@/hooks/useGameState";

interface Props {
  state: GameState;
  actions: GameActions;
}

function GearCard({ gear, onClick, label }: { gear: GearItem | null; onClick?: () => void; label: string }) {
  const [hovered, setHovered] = useState(false);
  const color = gear ? RARITY_COLORS[gear.rarity] : "#444";

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `2px solid ${color}`,
        borderRadius: 4,
        padding: "6px 8px",
        background: gear ? `${color}18` : "#1a1a2e",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.15s",
        transform: hovered && onClick ? "scale(1.03)" : "scale(1)",
        minHeight: 64,
        position: "relative",
      }}
    >
      <div style={{ fontSize: 10, color: "#888", fontFamily: "'Press Start 2P', monospace", marginBottom: 2 }}>
        {label}
      </div>
      {gear ? (
        <>
          <div style={{ fontSize: 18, marginBottom: 2 }}>{gear.emoji}</div>
          <div style={{ fontSize: 9, color, fontFamily: "'Press Start 2P', monospace", lineHeight: 1.4 }}>
            {gear.name}
          </div>
          <div style={{ fontSize: 8, color: "#aaa", fontFamily: "'VT323', monospace", marginTop: 2 }}>
            {RARITY_LABELS[gear.rarity]} · {TIER_LABELS[gear.tier]}
          </div>
          {gear.stats.slice(0, 2).map((s, i) => (
            <div key={i} style={{ fontSize: 8, color: "#88ff88", fontFamily: "'VT323', monospace" }}>
              +{s.value} {s.stat}
            </div>
          ))}
          {gear.stats.length > 2 && (
            <div style={{ fontSize: 8, color: "#666", fontFamily: "'VT323', monospace" }}>
              +{gear.stats.length - 2} more...
            </div>
          )}
          {gear.sockets > 0 && (
            <div style={{ fontSize: 8, color: "#aa88ff", fontFamily: "'VT323', monospace", marginTop: 2 }}>
              {gear.runes.map((r, i) => r ? "🔮" : "○").join(" ")} sockets
            </div>
          )}
        </>
      ) : (
        <div style={{ fontSize: 22, opacity: 0.2, textAlign: "center", paddingTop: 4 }}>—</div>
      )}
    </div>
  );
}

export default function GearTab({ state, actions }: Props) {
  const [selectedBagIdx, setSelectedBagIdx] = useState<number | null>(null);
  const [detailGear, setDetailGear] = useState<GearItem | null>(null);

  const bagGearItems = state.bag
    .map((item, idx) => ({ item, idx }))
    .filter(({ item }) => item && 'isGear' in item && (item as GearItem).isGear);

  return (
    <div style={{ padding: "12px 8px", fontFamily: "'Press Start 2P', monospace" }}>
      {/* Equipped gear grid */}
      <div style={{ fontSize: 10, color: "#ffaa00", marginBottom: 8, letterSpacing: 1 }}>⚔ EQUIPPED GEAR</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 16 }}>
        {GEAR_SLOTS.map((slot) => {
          const equipped = state.equippedGear[slot.id];
          return (
            <GearCard
              key={slot.id}
              gear={equipped}
              label={slot.label.toUpperCase()}
              onClick={equipped ? () => setDetailGear(equipped) : undefined}
            />
          );
        })}
      </div>

      {/* Gear in bag */}
      {bagGearItems.length > 0 && (
        <>
          <div style={{ fontSize: 10, color: "#88ccff", marginBottom: 8, letterSpacing: 1 }}>🎒 GEAR IN BAG</div>
          <div style={{ fontSize: 9, color: "#888", marginBottom: 6, fontFamily: "'VT323', monospace" }}>
            Tap gear to equip it. Old piece returns to bag.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {bagGearItems.map(({ item, idx }) => {
              const gear = item as GearItem;
              return (
                <GearCard
                  key={idx}
                  gear={gear}
                  label={`BAG SLOT ${idx + 1}`}
                  onClick={() => {
                    actions.equipFromBag(idx);
                    setSelectedBagIdx(null);
                  }}
                />
              );
            })}
          </div>
        </>
      )}

      {bagGearItems.length === 0 && (
        <div style={{ textAlign: "center", color: "#555", fontSize: 9, padding: "16px 0" }}>
          No gear in bag. Explore dungeons to find equipment.
        </div>
      )}

      {/* Detail modal */}
      {detailGear && (
        <div
          onClick={() => setDetailGear(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 100, padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#0d0d1a",
              border: `2px solid ${RARITY_COLORS[detailGear.rarity]}`,
              borderRadius: 6,
              padding: 16,
              maxWidth: 320,
              width: "100%",
            }}
          >
            <div style={{ fontSize: 28, textAlign: "center", marginBottom: 8 }}>{detailGear.emoji}</div>
            <div style={{ fontSize: 11, color: RARITY_COLORS[detailGear.rarity], textAlign: "center", marginBottom: 4 }}>
              {detailGear.name}
            </div>
            <div style={{ fontSize: 9, color: "#aaa", textAlign: "center", marginBottom: 12 }}>
              {RARITY_LABELS[detailGear.rarity]} · {TIER_LABELS[detailGear.tier]}
            </div>
            <div style={{ borderTop: "1px solid #333", paddingTop: 10, marginBottom: 10 }}>
              {detailGear.stats.map((s, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#88ff88", marginBottom: 4, fontFamily: "'VT323', monospace" }}>
                  <span>{s.stat}</span>
                  <span style={{ color: "#ffaa00" }}>+{s.value}</span>
                </div>
              ))}
            </div>
            {detailGear.sockets > 0 && (
              <div style={{ borderTop: "1px solid #333", paddingTop: 8, marginBottom: 10 }}>
                <div style={{ fontSize: 9, color: "#aa88ff", marginBottom: 4 }}>SOCKETS</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {detailGear.runes.map((r, i) => {
                    const rune = r ? { emoji: r.split("_")[0] } : null;
                    return (
                      <div key={i} style={{
                        width: 32, height: 32, border: "1px solid #aa88ff",
                        borderRadius: 4, display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: 16, background: "#1a1a2e",
                      }}>
                        {r ? "🔮" : "○"}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <button
              onClick={() => setDetailGear(null)}
              style={{
                width: "100%", padding: "8px 0", background: "#1a1a2e",
                border: "1px solid #555", color: "#aaa", fontSize: 9,
                fontFamily: "'Press Start 2P', monospace", cursor: "pointer",
                borderRadius: 4,
              }}
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
