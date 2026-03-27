// BooksTab — base-only tab showing all books stored in the stash
// Books are stored in stash (stash is unlimited), filtered by isBook flag
// Each book can be placed onto any stash gear piece (consumes the book)
// Books can also be discarded

import { useState } from "react";
import type { GameState, GameActions, GearItem, BookItem } from "@/hooks/useGameState";
import { RARITY_COLORS, RARITY_LABELS, TIER_LABELS, TIER_COLORS } from "@/hooks/useGameState";

interface Props {
  state: GameState;
  actions: GameActions;
}

export default function BookshelfTab({ state, actions }: Props) {
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [selectedGearId, setSelectedGearId] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState<string | null>(null);

  // Books are stored in stash with isBook flag
  const books = state.stash.filter((g) => (g as unknown as BookItem).isBook) as unknown as BookItem[];
  const gearItems = state.stash.filter((g) => !(g as unknown as BookItem).isBook);

  const selectedBook: BookItem | null = selectedBookId
    ? (books.find((b) => b.id === selectedBookId) ?? null)
    : null;

  const selectedGear: GearItem | null = selectedGearId
    ? gearItems.find((g) => g.id === selectedGearId) ?? null
    : null;

  function handlePlace() {
    if (!selectedBookId || !selectedGearId) return;
    actions.placeBookOnGear(selectedBookId, selectedGearId);
    setSelectedBookId(null);
    setSelectedGearId(null);
  }

  function handleDiscard(bookId: string) {
    if (confirmDiscard === bookId) {
      actions.dropBookFromShelf(bookId);
      setConfirmDiscard(null);
      if (selectedBookId === bookId) setSelectedBookId(null);
    } else {
      setConfirmDiscard(bookId);
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
          {books.length} book{books.length !== 1 ? "s" : ""} · Books are stored in your stash. Place enchanted books onto gear to add their stat.
        </div>
      </div>

      {books.length === 0 ? (
        <div style={s.muted}>
          No books yet. Books drop from mini bosses (2% chance) or are created at the Enchanting Table after defeating a Mega Boss (floor 100, 200, ...).
        </div>
      ) : (
        <>
          {/* Book list */}
          <div>
            <div style={s.label}>BOOKS IN STASH</div>
            {books.map((book) => {
              const isSelected = selectedBookId === book.id;
              return (
                <div
                  key={book.id}
                  style={{ background: isSelected ? "rgba(136,68,255,0.1)" : "rgba(0,0,0,0.4)", border: `1px solid ${isSelected ? "#8844ff" : "#2a2a2a"}`, borderRadius: 4, padding: "8px 10px", marginBottom: 5 }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 20 }}>📖</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'VT323', monospace", fontSize: 15, color: book.enchantment ? "#bb88ff" : "#888" }}>
                        {book.enchantment ? `${book.enchantment} (base: ${book.baseValue})` : "Blank Book"}
                      </div>
                      <div style={{ fontFamily: "'VT323', monospace", fontSize: 12, color: "#555" }}>
                        {book.enchantment
                          ? "Place on any gear → adds stat at base value → reroll to improve"
                          : "Blank — use Enchanting Table to inscribe a stat"}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                      {book.enchantment && (
                        <button
                          onClick={() => { setSelectedBookId(isSelected ? null : book.id); setSelectedGearId(null); }}
                          style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, padding: "5px 8px", background: isSelected ? "#1a0a30" : "#0a0020", color: isSelected ? "#bb88ff" : "#8844ff", border: `1px solid ${isSelected ? "#bb88ff" : "#8844ff"}`, borderRadius: 3, cursor: "pointer" }}
                        >
                          {isSelected ? "CANCEL" : "PLACE"}
                        </button>
                      )}
                      <button
                        onClick={() => handleDiscard(book.id)}
                        style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, padding: "5px 8px", background: confirmDiscard === book.id ? "#1a0000" : "#0a0a0a", color: confirmDiscard === book.id ? "#ff4444" : "#555", border: `1px solid ${confirmDiscard === book.id ? "#ff4444" : "#333"}`, borderRadius: 3, cursor: "pointer" }}
                      >
                        {confirmDiscard === book.id ? "SURE?" : "DISCARD"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Gear picker when a book is selected */}
          {selectedBook && selectedBook.enchantment && (
            <div style={{ background: "rgba(136,68,255,0.05)", border: "1px solid #4422aa", borderRadius: 4, padding: "10px 12px" }}>
              <div style={s.label}>PICK GEAR TO ENCHANT</div>
              <div style={{ fontFamily: "'VT323', monospace", fontSize: 13, color: "#888", marginBottom: 8 }}>
                Will add <strong style={{ color: "#bb88ff" }}>"{selectedBook.enchantment}"</strong> at base value ({selectedBook.baseValue}). Book is consumed.
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
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: isGearSelected ? "rgba(136,68,255,0.1)" : "rgba(0,0,0,0.3)", border: `1px solid ${isGearSelected ? "#8844ff" : "#2a2a2a"}`, borderRadius: 3, marginBottom: 4, cursor: "pointer" }}
                    >
                      <span style={{ fontSize: 18 }}>{gear.emoji}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'VT323', monospace", fontSize: 14, color: RARITY_COLORS[gear.rarity], overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{gear.name}</div>
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
                    style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, padding: "7px 12px", background: "#0a0020", color: "#8844ff", border: "1px solid #8844ff", borderRadius: 3, cursor: "pointer" }}
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
          💡 After placing a book, the stat starts at base value (lowest roll). Use Vendor Reroll or Craft Reroll to improve it. Books cannot be stacked or sold.
        </div>
      </div>
    </div>
  );
}
