// VendorModal — in-dungeon wandering vendor popup
// Three services:
//   1. Wandering Vendor — buy gear/materials, selective stat reroll (one-time), material merge (one-time)
//   2. Fence — buy your bag gear at rip-off prices (convenient, not worth it)
// Design: retro pixel aesthetic, gold-bordered dark modal

import { useState, useMemo } from "react";
import type { GameState, GameActions, GearItem, MaterialItem, MaterialType } from "@/hooks/useGameState";
import {
  RARITY_COLORS,
  RARITY_LABELS,
  TIER_LABELS,
  TIER_COLORS,
  MATERIAL_INFO,
  VENDOR_REROLL_BASE,
  VENDOR_REROLL_TIER_MULT,
  VENDOR_REROLL_RARITY_MULT,
  VENDOR_MERGE_COST_PER_UNIT,
  FENCE_SELL_MULT,
} from "@/hooks/useGameState";

interface Props {
  state: GameState;
  actions: GameActions;
}

type VendorSection = "shop" | "reroll" | "merge" | "fence";

const MERGE_CAP = 25;

const s = {
  sectionTitle: {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 9,
    color: "#ffcc44",
    marginBottom: 8,
    letterSpacing: 1,
  } as React.CSSProperties,
  muted: {
    fontFamily: "'VT323', monospace",
    fontSize: 14,
    color: "#888",
  } as React.CSSProperties,
  btn: (enabled: boolean, color = "#ffaa00"): React.CSSProperties => ({
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 8,
    padding: "7px 12px",
    background: enabled ? "#0d0800" : "#1a1a1a",
    color: enabled ? color : "#555",
    border: `1px solid ${enabled ? color : "#444"}`,
    borderRadius: 3,
    cursor: enabled ? "pointer" : "not-allowed",
    transition: "background 0.15s",
    whiteSpace: "nowrap" as const,
  }),
  itemRow: (selected = false, borderColor = "#2a2a2a"): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "7px 10px",
    background: selected ? "rgba(255,170,0,0.07)" : "rgba(0,0,0,0.4)",
    border: `1px solid ${selected ? borderColor : "#2a2a2a"}`,
    borderRadius: 4,
    marginBottom: 5,
    cursor: "pointer",
  }),
};

export default function VendorModal({ state, actions }: Props) {
  const vendor = state.activeVendor;
  if (!vendor) return null;

  const [section, setSection] = useState<VendorSection>("shop");

  // ── Reroll state ──────────────────────────────────────────────────────────
  const [rerollGearId, setRerollGearId] = useState<string | null>(null);
  const [rerollStatIndices, setRerollStatIndices] = useState<Set<number>>(new Set());
  const [rerollConfirm, setRerollConfirm] = useState(false);

  const rerollGear: GearItem | null = useMemo(() => {
    if (!rerollGearId) return null;
    const fromBag = state.bag.find((b) => b && 'isGear' in b && (b as GearItem).id === rerollGearId) as GearItem | undefined;
    const fromStash = state.stash.find((g) => g.id === rerollGearId);
    return fromBag ?? fromStash ?? null;
  }, [rerollGearId, state.bag, state.stash]);

  const rerollCost = useMemo(() => {
    if (!rerollGear || rerollStatIndices.size === 0) return 0;
    return Math.ceil(
      VENDOR_REROLL_BASE *
      VENDOR_REROLL_TIER_MULT[rerollGear.tier] *
      VENDOR_REROLL_RARITY_MULT[rerollGear.rarity] *
      rerollStatIndices.size
    );
  }, [rerollGear, rerollStatIndices]);

  function toggleRerollStat(i: number) {
    setRerollStatIndices((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
    setRerollConfirm(false);
  }

  function handleReroll() {
    if (!rerollGearId || rerollStatIndices.size === 0) return;
    if (rerollConfirm) {
      actions.vendorReroll(rerollGearId, Array.from(rerollStatIndices));
      setRerollGearId(null);
      setRerollStatIndices(new Set());
      setRerollConfirm(false);
    } else {
      setRerollConfirm(true);
      setTimeout(() => setRerollConfirm(false), 4000);
    }
  }

  // ── Merge preview ─────────────────────────────────────────────────────────
  const mergePreview = useMemo(() => {
    const matSlots: { item: MaterialItem }[] = [];
    state.bag.forEach((b) => { if (b && 'isMaterial' in b) matSlots.push({ item: b as MaterialItem }); });
    const grouped: Partial<Record<MaterialType, number>> = {};
    matSlots.forEach(({ item }) => { grouped[item.type] = (grouped[item.type] ?? 0) + item.qty; });
    let totalCost = 0;
    let totalUnits = 0;
    let slotsBefore = matSlots.length;
    let slotsAfter = 0;
    (Object.keys(grouped) as MaterialType[]).forEach((t) => {
      const qty = grouped[t]!;
      totalCost += qty * VENDOR_MERGE_COST_PER_UNIT[t];
      totalUnits += qty;
      slotsAfter += Math.ceil(qty / MERGE_CAP);
    });
    return { grouped, totalCost: Math.ceil(totalCost), totalUnits, slotsBefore, slotsAfter, slotsSaved: slotsBefore - slotsAfter };
  }, [state.bag]);

  // ── Fence: bag gear ───────────────────────────────────────────────────────
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

  // ── Nav tabs ──────────────────────────────────────────────────────────────
  const tabs: { id: VendorSection; label: string; emoji: string }[] = [
    { id: "shop",   label: "SHOP",   emoji: "🛒" },
    { id: "reroll", label: "REROLL", emoji: "🎲" },
    { id: "merge",  label: "MERGE",  emoji: "📦" },
    { id: "fence",  label: "FENCE",  emoji: "💸" },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.87)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "0 16px" }}>
      <div style={{ background: "#0a0a0a", border: "2px solid #ffaa00", borderRadius: 6, width: "100%", maxWidth: 440, maxHeight: "88vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 0 40px rgba(255,170,0,0.3)" }}>

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #1a0a00, #2a1400)", borderBottom: "2px solid #ffaa00", padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 26 }}>🛒</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#ffcc44" }}>WANDERING VENDOR</div>
            <div style={{ fontFamily: "'VT323', monospace", fontSize: 13, color: "#aaa", marginTop: 2 }}>Floor {vendor.floor}</div>
          </div>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#ffcc44" }}>💰 {state.gold.toLocaleString()}g</div>
        </div>

        {/* Tab nav */}
        <div style={{ display: "flex", borderBottom: "1px solid #333", background: "#0d0d0d" }}>
          {tabs.map((t) => {
            const used = (t.id === "reroll" && vendor.rerollUsed) || (t.id === "merge" && vendor.mergeUsed);
            return (
              <button
                key={t.id}
                onClick={() => setSection(t.id)}
                style={{
                  flex: 1,
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: 7,
                  padding: "8px 2px",
                  background: section === t.id ? "#1a0a00" : "transparent",
                  color: used ? "#444" : section === t.id ? "#ffcc44" : "#888",
                  border: "none",
                  borderBottom: `2px solid ${section === t.id ? "#ffaa00" : "transparent"}`,
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                {t.emoji} {t.label}
                {used && <span style={{ display: "block", fontSize: 6, color: "#555", marginTop: 2 }}>USED</span>}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>

          {/* ── SHOP ── */}
          {section === "shop" && (
            <div>
              {vendor.items.filter(i => i.type === "gear" || i.type === "material").length === 0 ? (
                <div style={{ ...s.muted, textAlign: "center", padding: 20 }}>Sold out!</div>
              ) : (
                vendor.items.filter(i => i.type === "gear" || i.type === "material").map((item) => {
                  const canAfford = state.gold >= item.cost;
                  return (
                    <div key={item.id} style={{ background: "rgba(0,0,0,0.5)", border: "1px solid #664400", borderRadius: 4, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <span style={{ fontSize: 22, minWidth: 28, textAlign: "center" }}>{item.emoji}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#ffcc44", wordBreak: "break-word", marginBottom: 3 }}>{item.label}</div>
                        {item.gear && (
                          <div style={{ fontFamily: "'VT323', monospace", fontSize: 13, color: RARITY_COLORS[item.gear.rarity] }}>
                            {RARITY_LABELS[item.gear.rarity]} · <span style={{ color: TIER_COLORS[item.gear.tier] }}>{TIER_LABELS[item.gear.tier]}</span>
                          </div>
                        )}
                        {item.gear && item.gear.stats.length > 0 && (
                          <div style={{ fontFamily: "'VT323', monospace", fontSize: 12, color: "#aaa", marginTop: 2 }}>
                            {item.gear.stats.map((st) => `+${st.value} ${st.stat}`).join(" · ")}
                          </div>
                        )}
                      </div>
                      <button onClick={() => actions.buyFromVendor(item.id)} disabled={!canAfford} style={s.btn(canAfford)}>
                        💰 {item.cost}g
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── REROLL ── */}
          {section === "reroll" && (
            <div>
              {vendor.rerollUsed ? (
                <div style={{ textAlign: "center", padding: 20 }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🎲</div>
                  <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#555" }}>REROLL USED</div>
                  <div style={{ ...s.muted, marginTop: 6 }}>One reroll per vendor visit</div>
                </div>
              ) : (
                <>
                  <div style={s.sectionTitle}>🎲 SELECTIVE STAT REROLL</div>
                  <div style={{ ...s.muted, marginBottom: 10 }}>
                    Pick a gear piece, then select which stats to reroll. Cost scales by tier, rarity, and stat count.
                  </div>

                  {/* Gear picker (bag + stash) */}
                  {!rerollGear ? (
                    <div>
                      <div style={{ fontFamily: "'VT323', monospace", fontSize: 13, color: "#666", marginBottom: 6 }}>BAG GEAR</div>
                      {bagGear.length === 0 && <div style={s.muted}>No gear in bag</div>}
                      {bagGear.map(({ item: gear }) => (
                        <div key={gear.id} onClick={() => { setRerollGearId(gear.id); setRerollStatIndices(new Set()); }} style={s.itemRow(false, RARITY_COLORS[gear.rarity])}>
                          <span style={{ fontSize: 18 }}>{gear.emoji}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontFamily: "'VT323', monospace", fontSize: 14, color: RARITY_COLORS[gear.rarity], overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{gear.name}</div>
                            <div style={{ fontFamily: "'VT323', monospace", fontSize: 12, color: "#666" }}>{RARITY_LABELS[gear.rarity]} · <span style={{ color: TIER_COLORS[gear.tier] }}>{TIER_LABELS[gear.tier]}</span></div>
                          </div>
                        </div>
                      ))}
                      <div style={{ fontFamily: "'VT323', monospace", fontSize: 13, color: "#666", marginTop: 8, marginBottom: 6 }}>STASH GEAR</div>
                      {state.stash.length === 0 && <div style={s.muted}>No gear in stash</div>}
                      {state.stash.map((gear) => (
                        <div key={gear.id} onClick={() => { setRerollGearId(gear.id); setRerollStatIndices(new Set()); }} style={s.itemRow(false, RARITY_COLORS[gear.rarity])}>
                          <span style={{ fontSize: 18 }}>{gear.emoji}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontFamily: "'VT323', monospace", fontSize: 14, color: RARITY_COLORS[gear.rarity], overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{gear.name}</div>
                            <div style={{ fontFamily: "'VT323', monospace", fontSize: 12, color: "#666" }}>{RARITY_LABELS[gear.rarity]} · <span style={{ color: TIER_COLORS[gear.tier] }}>{TIER_LABELS[gear.tier]}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>
                      {/* Selected gear header */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "rgba(255,170,0,0.06)", border: `1px solid ${TIER_COLORS[rerollGear.tier]}`, borderRadius: 4, marginBottom: 10 }}>
                        <span style={{ fontSize: 22 }}>{rerollGear.emoji}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: "'VT323', monospace", fontSize: 15, color: RARITY_COLORS[rerollGear.rarity] }}>{rerollGear.name}</div>
                          <div style={{ fontFamily: "'VT323', monospace", fontSize: 12, color: "#666" }}>{RARITY_LABELS[rerollGear.rarity]} · <span style={{ color: TIER_COLORS[rerollGear.tier] }}>{TIER_LABELS[rerollGear.tier]}</span></div>
                        </div>
                        <button onClick={() => { setRerollGearId(null); setRerollStatIndices(new Set()); setRerollConfirm(false); }} style={{ fontFamily: "'VT323', monospace", fontSize: 13, background: "none", border: "1px solid #444", color: "#888", padding: "3px 7px", cursor: "pointer", borderRadius: 3 }}>✕</button>
                      </div>

                      {/* Stat checkboxes */}
                      <div style={{ ...s.muted, marginBottom: 6 }}>Select stats to reroll:</div>
                      {rerollGear.stats.map((st, i) => {
                        const checked = rerollStatIndices.has(i);
                        return (
                          <div key={i} onClick={() => toggleRerollStat(i)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: checked ? "rgba(255,170,0,0.08)" : "rgba(0,0,0,0.3)", border: `1px solid ${checked ? "#ffaa00" : "#2a2a2a"}`, borderRadius: 3, marginBottom: 4, cursor: "pointer" }}>
                            <div style={{ width: 14, height: 14, border: `1px solid ${checked ? "#ffaa00" : "#555"}`, background: checked ? "#ffaa00" : "transparent", borderRadius: 2, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {checked && <span style={{ color: "#000", fontSize: 10, lineHeight: 1 }}>✓</span>}
                            </div>
                            <div style={{ fontFamily: "'VT323', monospace", fontSize: 15, color: checked ? "#88aaff" : "#aaa" }}>+{st.value} {st.stat}</div>
                          </div>
                        );
                      })}

                      {/* Cost preview + confirm */}
                      <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <div style={{ fontFamily: "'VT323', monospace", fontSize: 14, color: rerollCost > 0 ? "#ffcc44" : "#555" }}>
                          Cost: {rerollCost > 0 ? `${rerollCost}g` : "—"}
                          {rerollCost > 0 && state.gold < rerollCost && <span style={{ color: "#ff4444", marginLeft: 6 }}>({state.gold - rerollCost}g short)</span>}
                        </div>
                        <button onClick={handleReroll} disabled={rerollStatIndices.size === 0 || state.gold < rerollCost} style={s.btn(rerollStatIndices.size > 0 && state.gold >= rerollCost, rerollConfirm ? "#ff4444" : "#ffaa00")}>
                          {rerollConfirm ? "⚠ CONFIRM?" : `🎲 REROLL (${rerollCost}g)`}
                        </button>
                        {rerollConfirm && <button onClick={() => setRerollConfirm(false)} style={{ fontFamily: "'VT323', monospace", fontSize: 13, background: "none", border: "1px solid #444", color: "#888", padding: "5px 8px", cursor: "pointer", borderRadius: 3 }}>Cancel</button>}
                      </div>
                      {rerollConfirm && <div style={{ fontFamily: "'VT323', monospace", fontSize: 13, color: "#ff8844", marginTop: 4 }}>⚠ Selected stats will be re-rolled with new random values!</div>}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── MERGE ── */}
          {section === "merge" && (
            <div>
              {vendor.mergeUsed ? (
                <div style={{ textAlign: "center", padding: 20 }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📦</div>
                  <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#555" }}>MERGE USED</div>
                  <div style={{ ...s.muted, marginTop: 6 }}>One merge per vendor visit</div>
                </div>
              ) : (
                <>
                  <div style={s.sectionTitle}>📦 COMPRESS MATERIALS</div>
                  <div style={{ ...s.muted, marginBottom: 10 }}>
                    Merges all material stacks in your bag into stacks of up to {MERGE_CAP}, freeing bag slots. Expensive but saves space.
                  </div>

                  {mergePreview.slotsBefore <= 1 ? (
                    <div style={s.muted}>No material stacks to merge (need 2+)</div>
                  ) : (
                    <>
                      {/* Preview table */}
                      <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid #333", borderRadius: 4, padding: "10px 12px", marginBottom: 10 }}>
                        {(Object.keys(mergePreview.grouped) as MaterialType[]).map((t) => {
                          const qty = mergePreview.grouped[t]!;
                          const stacksAfter = Math.ceil(qty / MERGE_CAP);
                          const cost = Math.ceil(qty * VENDOR_MERGE_COST_PER_UNIT[t]);
                          return (
                            <div key={t} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                              <span style={{ fontSize: 18 }}>{MATERIAL_INFO[t].emoji}</span>
                              <div style={{ flex: 1, fontFamily: "'VT323', monospace", fontSize: 14, color: "#ccc" }}>
                                {MATERIAL_INFO[t].label}: {qty} units → {stacksAfter} stack{stacksAfter !== 1 ? "s" : ""}
                              </div>
                              <div style={{ fontFamily: "'VT323', monospace", fontSize: 13, color: "#ffcc44" }}>{cost}g</div>
                            </div>
                          );
                        })}
                        <div style={{ borderTop: "1px solid #333", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", fontFamily: "'VT323', monospace", fontSize: 14 }}>
                          <span style={{ color: "#888" }}>Slots: {mergePreview.slotsBefore} → {mergePreview.slotsAfter} <span style={{ color: "#66ff88" }}>(saves {mergePreview.slotsSaved})</span></span>
                          <span style={{ color: "#ffcc44" }}>Total: {mergePreview.totalCost}g</span>
                        </div>
                      </div>

                      {state.gold < mergePreview.totalCost && (
                        <div style={{ fontFamily: "'VT323', monospace", fontSize: 14, color: "#ff4444", marginBottom: 8 }}>
                          Need {mergePreview.totalCost - state.gold}g more
                        </div>
                      )}
                      <button onClick={actions.vendorMergeMaterials} disabled={state.gold < mergePreview.totalCost} style={s.btn(state.gold >= mergePreview.totalCost, "#88ccff")}>
                        📦 COMPRESS ({mergePreview.totalCost}g)
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── FENCE ── */}
          {section === "fence" && (
            <div>
              <div style={s.sectionTitle}>💸 THE FENCE</div>
              <div style={{ ...s.muted, marginBottom: 10 }}>
                Buys your bag gear on the spot — no trip back to base needed. Prices are terrible (~{Math.round(FENCE_SELL_MULT * 100)}% value), but it's convenient.
              </div>
              {bagGear.length === 0 ? (
                <div style={s.muted}>No gear in bag to sell</div>
              ) : (
                bagGear.map(({ item: gear }) => {
                  const price = fencePrice(gear);
                  return (
                    <div key={gear.id} style={{ background: "rgba(0,0,0,0.5)", border: "1px solid #2a2a2a", borderRadius: 4, padding: "9px 12px", display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
                      <span style={{ fontSize: 20 }}>{gear.emoji}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'VT323', monospace", fontSize: 14, color: RARITY_COLORS[gear.rarity], overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{gear.name}</div>
                        <div style={{ fontFamily: "'VT323', monospace", fontSize: 12, color: "#666" }}>{RARITY_LABELS[gear.rarity]} · <span style={{ color: TIER_COLORS[gear.tier] }}>{TIER_LABELS[gear.tier]}</span></div>
                        {gear.stats.length > 0 && (
                          <div style={{ fontFamily: "'VT323', monospace", fontSize: 12, color: "#555", marginTop: 2 }}>
                            {gear.stats.map((st) => `+${st.value} ${st.stat}`).join(" · ")}
                          </div>
                        )}
                      </div>
                      <button onClick={() => actions.vendorSellGear(gear.id)} style={s.btn(true, "#ff8844")}>
                        💰 {price}g
                      </button>
                    </div>
                  );
                })
              )}
              <div style={{ fontFamily: "'VT323', monospace", fontSize: 12, color: "#444", marginTop: 8 }}>
                ⚠ Fence prices are {Math.round(FENCE_SELL_MULT * 100)}% of base value. Salvage at base for materials instead.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid #664400", padding: "10px 14px" }}>
          <button onClick={actions.dismissVendor} style={{ width: "100%", fontFamily: "'Press Start 2P', monospace", fontSize: 9, padding: "10px", background: "#1a0a00", color: "#ff8844", border: "1px solid #ff8844", borderRadius: 4, cursor: "pointer" }}>
            ▶ CONTINUE EXPLORING
          </button>
        </div>
      </div>
    </div>
  );
}
