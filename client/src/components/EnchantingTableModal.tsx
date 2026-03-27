// EnchantingTableModal — appears after choosing Enchanting Table from Mega Boss reward
// Lets player strip one stat from a stash gear piece and inscribe it onto a book
// The book is added to the stash (stash is unlimited)
// Design: mystical purple/blue aesthetic, pixel font

import { useState } from "react";
import type { GameState, GameActions, GearItem, BookItem } from "@/hooks/useGameState";
import { RARITY_COLORS, RARITY_LABELS, TIER_LABELS, TIER_COLORS } from "@/hooks/useGameState";

interface Props {
  state: GameState;
  actions: GameActions;
}

const STRIP_COST = 500;

export default function EnchantingTableModal({ state, actions }: Props) {
  const table = state.activeEnchantingTable;
  if (!table) return null;

  const [selectedGearId, setSelectedGearId] = useState<string | null>(null);
  const [selectedStatIdx, setSelectedStatIdx] = useState<number | null>(null);
  const [confirm, setConfirm] = useState(false);

  // Only show real gear (not books) for stripping
  const gearItems = state.stash.filter((g) => !(g as unknown as BookItem).isBook);
  const booksInStash = state.stash.filter((g) => (g as unknown as BookItem).isBook).length;

  const selectedGear: GearItem | null = selectedGearId
    ? gearItems.find((g) => g.id === selectedGearId) ?? null
    : null;

  const canAfford = state.gold >= STRIP_COST;
  const canStrip = selectedGear !== null && selectedStatIdx !== null && canAfford;

  function handleStrip() {
    if (!selectedGearId || selectedStatIdx === null) return;
    if (confirm) {
      actions.enchantingTableStrip(selectedGearId, selectedStatIdx);
      setSelectedGearId(null);
      setSelectedStatIdx(null);
      setConfirm(false);
    } else {
      setConfirm(true);
      setTimeout(() => setConfirm(false), 4000);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 210, padding: "0 16px" }}>
      <div style={{ background: "#050010", border: "2px solid #8844ff", borderRadius: 6, width: "100%", maxWidth: 440, maxHeight: "88vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 0 60px rgba(136,68,255,0.35)" }}>

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #0a0020, #100030)", borderBottom: "2px solid #8844ff", padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 28 }}>🔮</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#bb88ff", letterSpacing: 1 }}>ENCHANTING TABLE</div>
            <div style={{ fontFamily: "'VT323', monospace", fontSize: 13, color: "#888", marginTop: 2 }}>Floor {table.floor} — Strip a stat onto a book</div>
          </div>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#ffcc44" }}>💰 {state.gold.toLocaleString()}g</div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>

          {/* Info banner */}
          <div style={{ background: "rgba(136,68,255,0.08)", border: "1px solid #4422aa", borderRadius: 4, padding: "8px 12px", marginBottom: 12 }}>
            <div style={{ fontFamily: "'VT323', monospace", fontSize: 13, color: "#9966dd", lineHeight: 1.5 }}>
              Select a stash gear piece, then pick one stat to strip. The stat is removed from the gear and written onto a book added to your stash. Cost: <span style={{ color: "#ffcc44" }}>{STRIP_COST}g</span> per strip.
            </div>
          </div>

          {/* Book count */}
          <div style={{ fontFamily: "'VT323', monospace", fontSize: 13, color: "#666", marginBottom: 10 }}>
            📚 Books in stash: {booksInStash}
          </div>

          {!canAfford && (
            <div style={{ fontFamily: "'VT323', monospace", fontSize: 14, color: "#ff6644", marginBottom: 10 }}>
              ⚠ Need {STRIP_COST}g to strip a stat.
            </div>
          )}

          {/* Step 1: pick gear */}
          {!selectedGear ? (
            <div>
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#8844ff", marginBottom: 8 }}>STEP 1 — PICK GEAR FROM STASH</div>
              {gearItems.length === 0 ? (
                <div style={{ fontFamily: "'VT323', monospace", fontSize: 14, color: "#555" }}>No gear in stash</div>
              ) : (
                gearItems.map((gear) => (
                  <div
                    key={gear.id}
                    onClick={() => { setSelectedGearId(gear.id); setSelectedStatIdx(null); setConfirm(false); }}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "rgba(0,0,0,0.4)", border: `1px solid ${RARITY_COLORS[gear.rarity]}44`, borderRadius: 4, marginBottom: 5, cursor: "pointer" }}
                  >
                    <span style={{ fontSize: 20 }}>{gear.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'VT323', monospace", fontSize: 15, color: RARITY_COLORS[gear.rarity], overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{gear.name}</div>
                      <div style={{ fontFamily: "'VT323', monospace", fontSize: 12, color: "#666" }}>
                        {RARITY_LABELS[gear.rarity]} · <span style={{ color: TIER_COLORS[gear.tier] }}>{TIER_LABELS[gear.tier]}</span> · {gear.stats.length} stats
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div>
              {/* Selected gear header */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "rgba(136,68,255,0.08)", border: `1px solid ${TIER_COLORS[selectedGear.tier]}`, borderRadius: 4, marginBottom: 10 }}>
                <span style={{ fontSize: 22 }}>{selectedGear.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'VT323', monospace", fontSize: 15, color: RARITY_COLORS[selectedGear.rarity] }}>{selectedGear.name}</div>
                  <div style={{ fontFamily: "'VT323', monospace", fontSize: 12, color: "#666" }}>{RARITY_LABELS[selectedGear.rarity]} · <span style={{ color: TIER_COLORS[selectedGear.tier] }}>{TIER_LABELS[selectedGear.tier]}</span></div>
                </div>
                <button onClick={() => { setSelectedGearId(null); setSelectedStatIdx(null); setConfirm(false); }} style={{ fontFamily: "'VT323', monospace", fontSize: 13, background: "none", border: "1px solid #333", color: "#666", padding: "3px 7px", cursor: "pointer", borderRadius: 3 }}>✕</button>
              </div>

              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#8844ff", marginBottom: 8 }}>STEP 2 — PICK STAT TO STRIP</div>
              <div style={{ fontFamily: "'VT323', monospace", fontSize: 13, color: "#666", marginBottom: 8 }}>
                ⚠ The selected stat will be permanently removed from this gear.
              </div>

              {selectedGear.stats.length === 0 ? (
                <div style={{ fontFamily: "'VT323', monospace", fontSize: 14, color: "#555" }}>This item has no stats to strip.</div>
              ) : (
                selectedGear.stats.map((st, i) => {
                  const isSelected = selectedStatIdx === i;
                  return (
                    <div
                      key={i}
                      onClick={() => { setSelectedStatIdx(i); setConfirm(false); }}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: isSelected ? "rgba(136,68,255,0.12)" : "rgba(0,0,0,0.3)", border: `1px solid ${isSelected ? "#8844ff" : "#2a2a2a"}`, borderRadius: 3, marginBottom: 4, cursor: "pointer" }}
                    >
                      <div style={{ width: 14, height: 14, border: `1px solid ${isSelected ? "#8844ff" : "#444"}`, background: isSelected ? "#8844ff" : "transparent", borderRadius: 2, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {isSelected && <span style={{ color: "#fff", fontSize: 10, lineHeight: 1 }}>✓</span>}
                      </div>
                      <div style={{ fontFamily: "'VT323', monospace", fontSize: 15, color: isSelected ? "#bb88ff" : "#aaa" }}>+{st.value} {st.stat}</div>
                    </div>
                  );
                })
              )}

              {/* Action footer */}
              {selectedStatIdx !== null && (
                <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(136,68,255,0.06)", border: "1px solid #4422aa", borderRadius: 4 }}>
                  <div style={{ fontFamily: "'VT323', monospace", fontSize: 14, color: "#bb88ff", marginBottom: 8 }}>
                    Strip <strong style={{ color: "#fff" }}>"{selectedGear.stats[selectedStatIdx]?.stat}"</strong> → book added to stash
                  </div>
                  <div style={{ fontFamily: "'VT323', monospace", fontSize: 13, color: "#888", marginBottom: 10 }}>
                    Book will have base value (lowest roll). Place on gear via the Books tab, then reroll to improve.
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <div style={{ fontFamily: "'VT323', monospace", fontSize: 14, color: canAfford ? "#ffcc44" : "#ff4444" }}>
                      Cost: {STRIP_COST}g {!canAfford && `(short ${STRIP_COST - state.gold}g)`}
                    </div>
                    <button
                      onClick={handleStrip}
                      disabled={!canStrip}
                      style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, padding: "7px 12px", background: canStrip ? "#0a0020" : "#1a1a1a", color: canStrip ? (confirm ? "#ff4444" : "#8844ff") : "#555", border: `1px solid ${canStrip ? (confirm ? "#ff4444" : "#8844ff") : "#333"}`, borderRadius: 3, cursor: canStrip ? "pointer" : "not-allowed" }}
                    >
                      {confirm ? "⚠ CONFIRM?" : `🔮 STRIP (-${STRIP_COST}g)`}
                    </button>
                    {confirm && <button onClick={() => setConfirm(false)} style={{ fontFamily: "'VT323', monospace", fontSize: 13, background: "none", border: "1px solid #333", color: "#666", padding: "5px 8px", cursor: "pointer", borderRadius: 3 }}>Cancel</button>}
                  </div>
                  {confirm && <div style={{ fontFamily: "'VT323', monospace", fontSize: 13, color: "#ff8844", marginTop: 6 }}>⚠ This stat will be permanently removed from the gear!</div>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid #2a1a44", padding: "10px 14px", display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={actions.dismissEnchantingTable}
            style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, padding: "8px 14px", background: "#0a0020", color: "#8844ff", border: "1px solid #8844ff", borderRadius: 3, cursor: "pointer" }}
          >
            CLOSE TABLE
          </button>
        </div>
      </div>
    </div>
  );
}
