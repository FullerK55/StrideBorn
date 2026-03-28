// BooksTab — base-only tab showing all books stored in the stash
// Books are stacked by enchantment name — one row per unique stat (or "Blank Book")
// Placing a book consumes one from the stack.
// Discarding removes one from the stack (or all if desired).

import { useState } from "react";
import type { GameState, GameActions, GearItem, BookItem } from "@/hooks/useGameState";
import { RARITY_COLORS, RARITY_LABELS, TIER_LABELS, TIER_COLORS } from "@/hooks/useGameState";

interface Props {
  state: GameState;
  actions: GameActions;
}

interface BookStack {
  key: string;           // enchantment name or "blank"
  label: string;         // display name
  count: number;
  ids: string[];         // all book IDs in this stack (use first when placing/discarding)
  isBlank: boolean;
}

export default function BookshelfTab({ state, actions }: Props) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedGearId, setSelectedGearId] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState<string | null>(null); // stack key

  // Books are stored in stash with isBook flag
  const books = state.stash.filter((g) => (g as unknown as BookItem).isBook) as unknown as BookItem[];
  const gearItems = state.stash.filter((g) => !(g as unknown as BookItem).isBook);

  // Group books into stacks by enchantment name (null → "blank")
  const stackMap = new Map<string, BookStack>();
  for (const book of books) {
    const key = book.enchantment ?? "blank";
    const label = book.enchantment ?? "Empty Book";
    if (!stackMap.has(key)) {
      stackMap.set(key, { key, label, count: 0, ids: [], isBlank: !book.enchantment });
    }
    const stack = stackMap.get(key)!;
    stack.count++;
    stack.ids.push(book.id);
  }

  // Sort: blank first, then alphabetical
  const stacks: BookStack[] = Array.from(stackMap.values()).sort((a, b) => {
    if (a.isBlank && !b.isBlank) return -1;
    if (!a.isBlank && b.isBlank) return 1;
    return a.label.localeCompare(b.label);
  });

  const selectedStack = selectedKey ? stacks.find((s) => s.key === selectedKey) ?? null : null;

  const selectedGear: GearItem | null = selectedGearId
    ? gearItems.find((g) => g.id === selectedGearId) ?? null
    : null;

  function handlePlace() {
    if (!selectedStack || selectedStack.isBlank || !selectedGearId) return;
    // Use the first book ID in the stack
    actions.placeBookOnGear(selectedStack.ids[0], selectedGearId);
    // If stack will be empty after placing, deselect
    if (selectedStack.count <= 1) {
      setSelectedKey(null);
    }
    setSelectedGearId(null);
  }

  function handleDiscard(stackKey: string) {
    const stack = stacks.find((s) => s.key === stackKey);
    if (!stack) return;
    if (confirmDiscard === stackKey) {
      // Discard one book from the stack
      actions.dropBookFromShelf(stack.ids[0]);
      setConfirmDiscard(null);
      if (selectedKey === stackKey && stack.count <= 1) setSelectedKey(null);
    } else {
      setConfirmDiscard(stackKey);
      setTimeout(() => setConfirmDiscard(null), 3000);
    }
  }

  const s = {
    muted: { fontFamily: "'VT323', monospace", fontSize: 14, color: "#666" } as React.CSSProperties,
    label: { fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#bb88ff", marginBottom: 8 } as React.CSSProperties,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

      {/* Header */}
      <div style={{ background: "rgba(136,68,255,0.06)", border: "1px solid #4422aa", borderRadius: 4, padding: "8px 12px" }}>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#bb88ff", marginBottom: 4 }}>📚 BOOKS</div>
        <div style={{ fontFamily: "'VT323', monospace", fontSize: 13, color: "#888" }}>
          {books.length} book{books.length !== 1 ? "s" : ""} · {stacks.length} type{stacks.length !== 1 ? "s" : ""} · Place onto gear to add the stat. Books are consumed on use.
        </div>
      </div>

      {stacks.length === 0 ? (
        <div style={s.muted}>
          No books yet. Books drop from mini bosses (2% chance) or are created at the Enchanting Table after defeating a Mega Boss (floor 100, 200, ...).
        </div>
      ) : (
        <>
          {/* Stacked book list */}
          <div>
            <div style={s.label}>BOOKS IN STASH</div>
            {stacks.map((stack) => {
              const isSelected = selectedKey === stack.key;
              return (
                <div
                  key={stack.key}
                  style={{
                    background: isSelected ? "rgba(136,68,255,0.1)" : "rgba(0,0,0,0.4)",
                    border: `1px solid ${isSelected ? "#8844ff" : "#2a2a2a"}`,
                    borderRadius: 4,
                    padding: "8px 10px",
                    marginBottom: 5,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {/* Count badge */}
                    <div style={{
                      minWidth: 32, height: 32, borderRadius: 4,
                      background: stack.isBlank ? "rgba(80,80,80,0.3)" : "rgba(136,68,255,0.15)",
                      border: `1px solid ${stack.isBlank ? "#444" : "#6633cc"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: stack.isBlank ? "#666" : "#bb88ff" }}>
                        {stack.count}
                      </span>
                    </div>

                    {/* Book icon + label */}
                    <span style={{ fontSize: 18, flexShrink: 0 }}>📖</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'VT323', monospace", fontSize: 16, color: stack.isBlank ? "#666" : "#bb88ff" }}>
                        {stack.label}
                      </div>
                      <div style={{ fontFamily: "'VT323', monospace", fontSize: 12, color: "#555" }}>
                        {stack.isBlank
                          ? "Blank — use Enchanting Table to inscribe a stat"
                          : "Place on any gear → adds stat → reroll to improve"}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                      {!stack.isBlank && (
                        <button
                          onClick={() => {
                            setSelectedKey(isSelected ? null : stack.key);
                            setSelectedGearId(null);
                          }}
                          style={{
                            fontFamily: "'Press Start 2P', monospace", fontSize: 7,
                            padding: "5px 8px",
                            background: isSelected ? "#1a0a30" : "#0a0020",
                            color: isSelected ? "#bb88ff" : "#8844ff",
                            border: `1px solid ${isSelected ? "#bb88ff" : "#8844ff"}`,
                            borderRadius: 3, cursor: "pointer",
                          }}
                        >
                          {isSelected ? "CANCEL" : "PLACE"}
                        </button>
                      )}
                      <button
                        onClick={() => handleDiscard(stack.key)}
                        style={{
                          fontFamily: "'Press Start 2P', monospace", fontSize: 7,
                          padding: "5px 8px",
                          background: confirmDiscard === stack.key ? "#1a0000" : "#0a0a0a",
                          color: confirmDiscard === stack.key ? "#ff4444" : "#555",
                          border: `1px solid ${confirmDiscard === stack.key ? "#ff4444" : "#333"}`,
                          borderRadius: 3, cursor: "pointer",
                        }}
                      >
                        {confirmDiscard === stack.key ? "SURE?" : "DISCARD 1"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Gear picker when a book stack is selected */}
          {selectedStack && !selectedStack.isBlank && (
            <div style={{ background: "rgba(136,68,255,0.05)", border: "1px solid #4422aa", borderRadius: 4, padding: "10px 12px" }}>
              <div style={s.label}>PICK GEAR TO ENCHANT</div>
              <div style={{ fontFamily: "'VT323', monospace", fontSize: 13, color: "#888", marginBottom: 8 }}>
                Will add <strong style={{ color: "#bb88ff" }}>"{selectedStack.label}"</strong> — stat value is determined by the gear's rarity, quality, and GS level. One book consumed.
              </div>

              {gearItems.length === 0 ? (
                <div style={s.muted}>No gear in stash</div>
              ) : (
                gearItems.map((gear) => {
                  const isGearSelected = selectedGearId === gear.id;
                  return (
                    <div
                      key={gear.id}
                      onClick={() => setSelectedGearId(isGearSelected ? null : gear.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "7px 10px",
                        background: isGearSelected ? "rgba(136,68,255,0.1)" : "rgba(0,0,0,0.3)",
                        border: `1px solid ${isGearSelected ? "#8844ff" : "#2a2a2a"}`,
                        borderRadius: 3, marginBottom: 4, cursor: "pointer",
                      }}
                    >
                      <span style={{ fontSize: 18 }}>{gear.emoji}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'VT323', monospace", fontSize: 14, color: RARITY_COLORS[gear.rarity], overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {gear.name}
                        </div>
                        <div style={{ fontFamily: "'VT323', monospace", fontSize: 12, color: "#555" }}>
                          {RARITY_LABELS[gear.rarity]} · <span style={{ color: TIER_COLORS[gear.tier] }}>{TIER_LABELS[gear.tier]}</span> · {gear.stats.length} stats
                        </div>
                      </div>
                      {isGearSelected && <span style={{ color: "#8844ff", fontSize: 16 }}>✓</span>}
                    </div>
                  );
                })
              )}

              {selectedGear && (
                <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ fontFamily: "'VT323', monospace", fontSize: 14, color: "#bb88ff" }}>
                    Place onto: <strong style={{ color: RARITY_COLORS[selectedGear.rarity] }}>{selectedGear.name}</strong>
                  </div>
                  <button
                    onClick={handlePlace}
                    style={{
                      fontFamily: "'Press Start 2P', monospace", fontSize: 8,
                      padding: "7px 12px",
                      background: "#0a0020", color: "#8844ff",
                      border: "1px solid #8844ff", borderRadius: 3, cursor: "pointer",
                    }}
                  >
                    📖 ENCHANT GEAR
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Info footer */}
      <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid #1a1a2a", borderRadius: 4, padding: "8px 12px" }}>
        <div style={{ fontFamily: "'VT323', monospace", fontSize: 13, color: "#555", lineHeight: 1.5 }}>
          💡 After placing a book, the stat value is rolled based on the gear's rarity, quality, and GS level. Use Vendor Reroll or Craft Reroll to improve it.
        </div>
      </div>
    </div>
  );
}
