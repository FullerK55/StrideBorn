// Stride Born — Gear Tab
// Shows 9 equipment slots + Gear in Bag with filters and fixed-height scroll.
// Design: Retro pixel dungeon aesthetic — dark panels, gold accents
// Nerd Mode: detail modal shows stat (min–max) ranges per tier/rarity

import React, { useState, useMemo } from "react";
import type { GameState, GameActions, GearItem, GearSlot, GearRarity, GearTier } from "@/hooks/useGameState";
import { GEAR_SLOTS, RARITY_COLORS, RARITY_LABELS, TIER_LABELS, TIER_ORDER, statRange } from "@/hooks/useGameState";

interface Props {
  state: GameState;
  actions: GameActions;
  nerdMode?: boolean;
}

const RARITY_ORD: GearRarity[] = ["scrap","common","uncommon","rare","epic","legendary","mythic"];
const SLOT_ORD: GearSlot[] = ["helmet","chest","pants","gloves","boots","backpack","weapon","ring","amulet"];

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
              {gear.runes.map((r, _i) => r ? "🔮" : "○").join(" ")} sockets
            </div>
          )}
          {gear.gearScore !== undefined && gear.gearScore > 0 && (
            <div style={{
              position: "absolute", top: 4, right: 4,
              fontSize: 7, color: "#ffd700", fontFamily: "'Press Start 2P', monospace",
              background: "#1a1400", border: "1px solid #ffd700", borderRadius: 2, padding: "1px 3px",
            }}>{gear.gearScore}</div>
          )}
        </>
      ) : (
        <div style={{ fontSize: 22, opacity: 0.2, textAlign: "center", paddingTop: 4 }}>—</div>
      )}
    </div>
  );
}

// Small filter chip button
function Chip({ label, active, color, onClick }: { label: string; active: boolean; color?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 8,
        fontFamily: "'Press Start 2P', monospace",
        padding: "3px 6px",
        border: `1px solid ${active ? (color || "#ffaa00") : "#444"}`,
        borderRadius: 3,
        background: active ? `${color || "#ffaa00"}22` : "#111",
        color: active ? (color || "#ffaa00") : "#666",
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

type SortMode = "none" | "rarity" | "tier" | "slot" | "gs";

export default function GearTab({ state, actions, nerdMode }: Props) {
  const [detailGear, setDetailGear] = useState<GearItem | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("none");
  const [filterSlot, setFilterSlot] = useState<GearSlot | null>(null);
  const [filterRarity, setFilterRarity] = useState<GearRarity | null>(null);

  const SORT_CYCLE: SortMode[] = ["none", "rarity", "tier", "slot", "gs"];
  const SORT_LABELS: Record<SortMode, string> = { none: "SORT", rarity: "SORT: RARITY", tier: "SORT: TIER", slot: "SORT: SLOT", gs: "SORT: GS" };

  const cycleSort = () => {
    const idx = SORT_CYCLE.indexOf(sortMode);
    setSortMode(SORT_CYCLE[(idx + 1) % SORT_CYCLE.length]);
  };

  // All gear items from bag
  const allBagGear = useMemo(() =>
    state.bag
      .map((item, idx) => ({ item, idx }))
      .filter(({ item }) => item && 'isGear' in item && (item as GearItem).isGear)
      .map(({ item, idx }) => ({ gear: item as GearItem, idx })),
    [state.bag]
  );

  // Apply filters
  const filteredGear = useMemo(() => {
    let result = allBagGear;
    if (filterSlot) result = result.filter(({ gear }) => gear.slot === filterSlot);
    if (filterRarity) result = result.filter(({ gear }) => gear.rarity === filterRarity);
    return result;
  }, [allBagGear, filterSlot, filterRarity]);

  // Apply sort
  const sortedGear = useMemo(() => {
    if (sortMode === "none") return filteredGear;
    return [...filteredGear].sort((a, b) => {
      if (sortMode === "rarity") return RARITY_ORD.indexOf(b.gear.rarity) - RARITY_ORD.indexOf(a.gear.rarity);
      if (sortMode === "tier") return TIER_ORDER.indexOf(b.gear.tier as GearTier) - TIER_ORDER.indexOf(a.gear.tier as GearTier);
      if (sortMode === "slot") return SLOT_ORD.indexOf(a.gear.slot as GearSlot) - SLOT_ORD.indexOf(b.gear.slot as GearSlot);
      if (sortMode === "gs") {
        const ag = a.gear.gearScore ?? -1;
        const bg = b.gear.gearScore ?? -1;
        return bg - ag;
      }
      return 0;
    });
  }, [filteredGear, sortMode]);

  // Unique slots and rarities present in bag for filter chips
  const presentSlots = useMemo(() => {
    const seen = new Set<GearSlot>();
    allBagGear.forEach(({ gear }) => seen.add(gear.slot as GearSlot));
    return SLOT_ORD.filter((s) => seen.has(s));
  }, [allBagGear]);

  const presentRarities = useMemo(() => {
    const seen = new Set<GearRarity>();
    allBagGear.forEach(({ gear }) => seen.add(gear.rarity));
    return RARITY_ORD.filter((r) => seen.has(r));
  }, [allBagGear]);

  const SLOT_LABELS: Record<GearSlot, string> = {
    helmet: "HELM", chest: "CHEST", pants: "LEGS", gloves: "GLOVES",
    boots: "BOOTS", backpack: "PACK", weapon: "WPN", ring: "RING", amulet: "AMU",
  };

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

      {/* Gear in bag header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ fontSize: 10, color: "#88ccff", letterSpacing: 1 }}>
          🎒 GEAR IN BAG
          {(filterSlot || filterRarity) && (
            <span style={{ fontSize: 8, color: "#888", marginLeft: 6 }}>
              ({sortedGear.length}/{allBagGear.length})
            </span>
          )}
        </div>
        <button
          onClick={cycleSort}
          style={{
            fontSize: 7, fontFamily: "'Press Start 2P', monospace",
            padding: "3px 7px", border: `1px solid ${sortMode !== "none" ? "#ffaa00" : "#444"}`,
            borderRadius: 3, background: sortMode !== "none" ? "#ffaa0022" : "#111",
            color: sortMode !== "none" ? "#ffaa00" : "#666", cursor: "pointer",
          }}
        >
          {SORT_LABELS[sortMode]}
        </button>
      </div>

      {/* Filter chips — slot */}
      {presentSlots.length > 1 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 4 }}>
          {presentSlots.map((s) => (
            <Chip
              key={s}
              label={SLOT_LABELS[s]}
              active={filterSlot === s}
              color="#88ccff"
              onClick={() => setFilterSlot(filterSlot === s ? null : s)}
            />
          ))}
        </div>
      )}

      {/* Filter chips — rarity */}
      {presentRarities.length > 1 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
          {presentRarities.map((r) => (
            <Chip
              key={r}
              label={RARITY_LABELS[r].toUpperCase()}
              active={filterRarity === r}
              color={RARITY_COLORS[r]}
              onClick={() => setFilterRarity(filterRarity === r ? null : r)}
            />
          ))}
        </div>
      )}

      {allBagGear.length > 0 ? (
        sortedGear.length > 0 ? (
          <>
            <div style={{ fontSize: 9, color: "#888", marginBottom: 6, fontFamily: "'VT323', monospace" }}>
              Tap gear to inspect &amp; equip. Old piece returns to bag.
            </div>
            {/* Fixed-height scrollable window — 5 rows × ~88px each */}
            <div style={{ maxHeight: 440, overflowY: "auto", paddingRight: 2 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {sortedGear.map(({ gear, idx }) => (
                  <GearCard
                    key={gear.id}
                    gear={gear}
                    label={`${SLOT_LABELS[gear.slot as GearSlot] ?? gear.slot.toUpperCase()}`}
                    onClick={() => setDetailGear(gear)}
                  />
                ))}
              </div>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", color: "#555", fontSize: 9, padding: "16px 0" }}>
            No gear matches filters.{" "}
            <span
              style={{ color: "#888", cursor: "pointer", textDecoration: "underline" }}
              onClick={() => { setFilterSlot(null); setFilterRarity(null); }}
            >
              Clear filters
            </span>
          </div>
        )
      ) : (
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
              maxHeight: "85vh",
              overflowY: "auto",
            }}
          >
            <div style={{ fontSize: 28, textAlign: "center", marginBottom: 8 }}>{detailGear.emoji}</div>
            <div style={{ fontSize: 11, color: RARITY_COLORS[detailGear.rarity], textAlign: "center", marginBottom: 4 }}>
              {detailGear.name}
              {detailGear.gearScore !== undefined && detailGear.gearScore > 0 && (
                <span style={{ marginLeft: 6, fontSize: 9, color: "#ffd700", fontFamily: "'Press Start 2P', monospace" }}>[{detailGear.gearScore}]</span>
              )}
            </div>
            <div style={{ fontSize: 9, color: "#aaa", textAlign: "center", marginBottom: 12 }}>
              {RARITY_LABELS[detailGear.rarity]} · {TIER_LABELS[detailGear.tier]}
              {nerdMode && detailGear.gearScore !== undefined && detailGear.gearScore === 0 && (
                <span style={{ marginLeft: 6, color: "#ffd700" }}>[GS 0 — gateway]</span>
              )}
            </div>

            {/* Currently equipped in same slot */}
            {(() => {
              const equipped = state.equippedGear[detailGear.slot as GearSlot];
              if (!equipped) return null;
              return (
                <div style={{ background: "#0a0a18", border: "1px solid #333", borderRadius: 4, padding: "6px 8px", marginBottom: 10 }}>
                  <div style={{ fontSize: 8, color: "#888", marginBottom: 4, fontFamily: "'Press Start 2P', monospace" }}>CURRENTLY EQUIPPED:</div>
                  <div style={{ fontSize: 9, color: RARITY_COLORS[equipped.rarity], fontFamily: "'Press Start 2P', monospace" }}>{equipped.emoji} {equipped.name}</div>
                  <div style={{ fontSize: 8, color: "#777", fontFamily: "'VT323', monospace" }}>{RARITY_LABELS[equipped.rarity]} · {TIER_LABELS[equipped.tier]}</div>
                </div>
              );
            })()}

            <div style={{ borderTop: "1px solid #333", paddingTop: 10, marginBottom: 10 }}>
              {(() => {
                const range = nerdMode ? statRange(detailGear.tier, detailGear.rarity, detailGear.gearScore ?? 0) : null;
                return detailGear.stats.map((s, i) => (
                  <div key={i} style={{ marginBottom: 5, fontFamily: "'VT323', monospace" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#88ff88" }}>
                      <span>
                        {s.stat}
                        {range && (
                          <span style={{ color: "#556655", fontSize: 12, marginLeft: 6 }}>
                            ({range.min}–{range.max})
                          </span>
                        )}
                      </span>
                      <span style={{ color: "#ffaa00" }}>+{s.value}</span>
                    </div>
                    {range && (
                      <div style={{ marginTop: 2, height: 3, background: "#1a2a1a", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{
                          height: "100%",
                          width: `${range.max > range.min ? Math.round(((s.value - range.min) / (range.max - range.min)) * 100) : 100}%`,
                          background: (() => {
                            const pct = range.max > range.min ? (s.value - range.min) / (range.max - range.min) : 1;
                            return pct >= 0.8 ? "#44ff88" : pct >= 0.5 ? "#ffcc44" : "#ff6644";
                          })(),
                          borderRadius: 2,
                          transition: "width 0.3s",
                        }} />
                      </div>
                    )}
                  </div>
                ));
              })()}
            </div>

            {detailGear.sockets > 0 && (
              <div style={{ borderTop: "1px solid #333", paddingTop: 8, marginBottom: 10 }}>
                <div style={{ fontSize: 9, color: "#aa88ff", marginBottom: 4 }}>SOCKETS</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {detailGear.runes.map((r, i) => (
                    <div key={i} style={{
                      width: 32, height: 32, border: "1px solid #aa88ff",
                      borderRadius: 4, display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: 16, background: "#1a1a2e",
                    }}>
                      {r ? "🔮" : "○"}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button
                onClick={() => {
                  // Find bag index for this gear
                  const bagIdx = state.bag.findIndex((b) => b && 'isGear' in b && (b as GearItem).id === detailGear.id);
                  if (bagIdx >= 0) {
                    actions.equipFromBag(bagIdx);
                    setDetailGear(null);
                  }
                }}
                style={{
                  flex: 1, padding: "8px 0",
                  background: "#0a1a0a", border: `1px solid ${RARITY_COLORS[detailGear.rarity]}`,
                  color: RARITY_COLORS[detailGear.rarity], fontSize: 9,
                  fontFamily: "'Press Start 2P', monospace", cursor: "pointer", borderRadius: 4,
                }}
              >
                ⚔️ EQUIP
              </button>
              <button
                onClick={() => setDetailGear(null)}
                style={{
                  flex: 1, padding: "8px 0", background: "#1a1a2e",
                  border: "1px solid #555", color: "#aaa", fontSize: 9,
                  fontFamily: "'Press Start 2P', monospace", cursor: "pointer",
                  borderRadius: 4,
                }}
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
