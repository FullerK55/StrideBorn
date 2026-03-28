// EnchantingTableModal — appears after choosing Enchanting Table from Mega Boss reward
// Two modes:
//   EXTRACT: consume a blank book + pick a stat from stash gear → enchanted book in stash
//   APPLY:   pick an enchanted book + pick stash gear with a free slot → add stat to gear
// Design: mystical purple/blue aesthetic, pixel font

import { useState } from "react";
import type { GameState, GameActions, GearItem, BookItem } from "@/hooks/useGameState";
import { RARITY_COLORS, RARITY_LABELS, TIER_LABELS, TIER_COLORS } from "@/hooks/useGameState";

interface Props {
  state: GameState;
  actions: GameActions;
}

type Mode = "extract" | "apply";

export default function EnchantingTableModal({ state, actions }: Props) {
  const table = state.activeEnchantingTable;
  if (!table) return null;

  const [mode, setMode] = useState<Mode>("extract");

  // ── EXTRACT state ──────────────────────────────────────────
  const [extGearId, setExtGearId] = useState<string | null>(null);
  const [extStatIdx, setExtStatIdx] = useState<number | null>(null);
  const [extConfirm, setExtConfirm] = useState(false);

  // ── APPLY state ────────────────────────────────────────────
  const [appBookKey, setAppBookKey] = useState<string | null>(null); // enchantment name
  const [appGearId, setAppGearId] = useState<string | null>(null);
  const [appConfirm, setAppConfirm] = useState(false);

  // Helpers
  const allStash = state.stash;
  const gearItems = allStash.filter((g) => !(g as unknown as BookItem).isBook) as GearItem[];
  const books = allStash.filter((g) => (g as unknown as BookItem).isBook) as unknown as BookItem[];

  const blankBooks = books.filter((b) => !b.enchantment);
  const enchantedBooks = books.filter((b) => !!b.enchantment);

  // Group enchanted books by stat name for APPLY mode
  interface BookStack { key: string; label: string; count: number; ids: string[]; statValue: number | null }
  const enchantedStacks: BookStack[] = [];
  for (const b of enchantedBooks) {
    const key = b.enchantment!;
    const existing = enchantedStacks.find((s) => s.key === key);
    if (existing) { existing.count++; existing.ids.push(b.id); }
    else enchantedStacks.push({ key, label: key, count: 1, ids: [b.id], statValue: b.statValue ?? null });
  }
  enchantedStacks.sort((a, b) => a.label.localeCompare(b.label));

  // EXTRACT helpers
  const extGear: GearItem | null = extGearId ? gearItems.find((g) => g.id === extGearId) ?? null : null;

  function handleExtract() {
    if (!extGearId || extStatIdx === null) return;
    if (extConfirm) {
      actions.enchantingTableStrip(extGearId, extStatIdx);
      setExtGearId(null); setExtStatIdx(null); setExtConfirm(false);
    } else {
      setExtConfirm(true);
      setTimeout(() => setExtConfirm(false), 4000);
    }
  }

  // APPLY helpers
  const appStack = appBookKey ? enchantedStacks.find((s) => s.key === appBookKey) ?? null : null;
  const appGear: GearItem | null = appGearId ? gearItems.find((g) => g.id === appGearId) ?? null : null;

  function handleApply() {
    if (!appStack || !appGearId) return;
    if (appConfirm) {
      actions.placeBookOnGear(appStack.ids[0], appGearId);
      setAppBookKey(null); setAppGearId(null); setAppConfirm(false);
    } else {
      setAppConfirm(true);
      setTimeout(() => setAppConfirm(false), 4000);
    }
  }

  const px = { fontFamily: "'Press Start 2P', monospace" } as React.CSSProperties;
  const vt = { fontFamily: "'VT323', monospace" } as React.CSSProperties;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 210, padding: "0 16px" }}>
      <div style={{ background: "#050010", border: "2px solid #8844ff", borderRadius: 6, width: "100%", maxWidth: 460, maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 0 60px rgba(136,68,255,0.35)" }}>

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #0a0020, #100030)", borderBottom: "2px solid #8844ff", padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 28 }}>🔮</span>
          <div style={{ flex: 1 }}>
            <div style={{ ...px, fontSize: 9, color: "#bb88ff", letterSpacing: 1 }}>ENCHANTING TABLE</div>
            <div style={{ ...vt, fontSize: 13, color: "#888", marginTop: 2 }}>Floor {table.floor} · Extract or Apply enchantments</div>
          </div>
          <div style={{ ...px, fontSize: 8, color: "#ffcc44" }}>📖 {blankBooks.length} blank</div>
        </div>

        {/* Mode tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #2a1a44" }}>
          {(["extract", "apply"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setExtGearId(null); setExtStatIdx(null); setExtConfirm(false); setAppBookKey(null); setAppGearId(null); setAppConfirm(false); }}
              style={{
                flex: 1, padding: "10px 0",
                ...px, fontSize: 8,
                background: mode === m ? "rgba(136,68,255,0.15)" : "transparent",
                color: mode === m ? "#bb88ff" : "#555",
                border: "none",
                borderBottom: mode === m ? "2px solid #8844ff" : "2px solid transparent",
                cursor: "pointer",
                letterSpacing: 1,
              }}
            >
              {m === "extract" ? "🔮 EXTRACT" : "📖 APPLY"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>

          {/* ── EXTRACT MODE ── */}
          {mode === "extract" && (
            <div>
              <div style={{ background: "rgba(136,68,255,0.08)", border: "1px solid #4422aa", borderRadius: 4, padding: "8px 12px", marginBottom: 12 }}>
                <div style={{ ...vt, fontSize: 13, color: "#9966dd", lineHeight: 1.5 }}>
                  Consume <span style={{ color: "#fff" }}>1 blank book</span> to extract a stat from a stash gear piece. The stat is removed from the gear and stored in the book at its original value.
                </div>
              </div>

              {blankBooks.length === 0 && (
                <div style={{ ...vt, fontSize: 14, color: "#ff6644", marginBottom: 10 }}>
                  ⚠ No blank books in stash. Books drop from mini bosses or book vendors.
                </div>
              )}

              {!extGear ? (
                <div>
                  <div style={{ ...px, fontSize: 8, color: "#8844ff", marginBottom: 8 }}>STEP 1 — PICK GEAR FROM STASH</div>
                  {gearItems.length === 0 ? (
                    <div style={{ ...vt, fontSize: 14, color: "#555" }}>No gear in stash</div>
                  ) : (
                    gearItems.map((gear) => (
                      <div
                        key={gear.id}
                        onClick={() => { if (blankBooks.length > 0) { setExtGearId(gear.id); setExtStatIdx(null); setExtConfirm(false); } }}
                        style={{
                          display: "flex", alignItems: "center", gap: 8,
                          padding: "8px 10px",
                          background: "rgba(0,0,0,0.4)",
                          border: `1px solid ${RARITY_COLORS[gear.rarity]}44`,
                          borderRadius: 4, marginBottom: 5,
                          cursor: blankBooks.length > 0 ? "pointer" : "not-allowed",
                          opacity: blankBooks.length > 0 ? 1 : 0.4,
                        }}
                      >
                        <span style={{ fontSize: 20 }}>{gear.emoji}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ ...vt, fontSize: 15, color: RARITY_COLORS[gear.rarity], overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{gear.name}</div>
                          <div style={{ ...vt, fontSize: 12, color: "#666" }}>
                            {RARITY_LABELS[gear.rarity]} · <span style={{ color: TIER_COLORS[gear.tier] }}>{TIER_LABELS[gear.tier]}</span> · {gear.stats.length} stats
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div>
                  {/* Selected gear */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "rgba(136,68,255,0.08)", border: `1px solid ${TIER_COLORS[extGear.tier]}`, borderRadius: 4, marginBottom: 10 }}>
                    <span style={{ fontSize: 22 }}>{extGear.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ ...vt, fontSize: 15, color: RARITY_COLORS[extGear.rarity] }}>{extGear.name}</div>
                      <div style={{ ...vt, fontSize: 12, color: "#666" }}>{RARITY_LABELS[extGear.rarity]} · <span style={{ color: TIER_COLORS[extGear.tier] }}>{TIER_LABELS[extGear.tier]}</span></div>
                    </div>
                    <button onClick={() => { setExtGearId(null); setExtStatIdx(null); setExtConfirm(false); }} style={{ ...vt, fontSize: 13, background: "none", border: "1px solid #333", color: "#666", padding: "3px 7px", cursor: "pointer", borderRadius: 3 }}>✕</button>
                  </div>

                  <div style={{ ...px, fontSize: 8, color: "#8844ff", marginBottom: 8 }}>STEP 2 — PICK STAT TO EXTRACT</div>
                  <div style={{ ...vt, fontSize: 13, color: "#666", marginBottom: 8 }}>⚠ The stat is permanently removed from this gear and written into the book at its current value.</div>

                  {extGear.stats.length === 0 ? (
                    <div style={{ ...vt, fontSize: 14, color: "#555" }}>This item has no stats to extract.</div>
                  ) : (
                    extGear.stats.map((st, i) => {
                      const isSel = extStatIdx === i;
                      return (
                        <div
                          key={i}
                          onClick={() => { setExtStatIdx(i); setExtConfirm(false); }}
                          style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "7px 10px",
                            background: isSel ? "rgba(136,68,255,0.12)" : "rgba(0,0,0,0.3)",
                            border: `1px solid ${isSel ? "#8844ff" : "#2a2a2a"}`,
                            borderRadius: 3, marginBottom: 4, cursor: "pointer",
                          }}
                        >
                          <div style={{ width: 14, height: 14, border: `1px solid ${isSel ? "#8844ff" : "#444"}`, background: isSel ? "#8844ff" : "transparent", borderRadius: 2, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {isSel && <span style={{ color: "#fff", fontSize: 10, lineHeight: 1 }}>✓</span>}
                          </div>
                          <div style={{ ...vt, fontSize: 15, color: isSel ? "#bb88ff" : "#aaa" }}>+{st.value.toLocaleString()} {st.stat}</div>
                        </div>
                      );
                    })
                  )}

                  {extStatIdx !== null && (
                    <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(136,68,255,0.06)", border: "1px solid #4422aa", borderRadius: 4 }}>
                      <div style={{ ...vt, fontSize: 14, color: "#bb88ff", marginBottom: 6 }}>
                        Extract <strong style={{ color: "#fff" }}>"{extGear.stats[extStatIdx]?.stat}"</strong> (+{extGear.stats[extStatIdx]?.value.toLocaleString()}) → enchanted book
                      </div>
                      <div style={{ ...vt, fontSize: 13, color: "#888", marginBottom: 10 }}>
                        Costs 1 blank book. The stat value is preserved exactly.
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <div style={{ ...vt, fontSize: 14, color: "#bb88ff" }}>📖 {blankBooks.length} blank book{blankBooks.length !== 1 ? "s" : ""} available</div>
                        <button
                          onClick={handleExtract}
                          disabled={blankBooks.length === 0}
                          style={{
                            ...px, fontSize: 8, padding: "7px 12px",
                            background: blankBooks.length > 0 ? "#0a0020" : "#1a1a1a",
                            color: blankBooks.length > 0 ? (extConfirm ? "#ff4444" : "#8844ff") : "#555",
                            border: `1px solid ${blankBooks.length > 0 ? (extConfirm ? "#ff4444" : "#8844ff") : "#333"}`,
                            borderRadius: 3, cursor: blankBooks.length > 0 ? "pointer" : "not-allowed",
                          }}
                        >
                          {extConfirm ? "⚠ CONFIRM?" : "🔮 EXTRACT"}
                        </button>
                        {extConfirm && <button onClick={() => setExtConfirm(false)} style={{ ...vt, fontSize: 13, background: "none", border: "1px solid #333", color: "#666", padding: "5px 8px", cursor: "pointer", borderRadius: 3 }}>Cancel</button>}
                      </div>
                      {extConfirm && <div style={{ ...vt, fontSize: 13, color: "#ff8844", marginTop: 6 }}>⚠ Stat will be permanently removed from the gear!</div>}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── APPLY MODE ── */}
          {mode === "apply" && (
            <div>
              <div style={{ background: "rgba(136,68,255,0.08)", border: "1px solid #4422aa", borderRadius: 4, padding: "8px 12px", marginBottom: 12 }}>
                <div style={{ ...vt, fontSize: 13, color: "#9966dd", lineHeight: 1.5 }}>
                  Select an enchanted book, then pick a stash gear piece with a free stat slot. The stat is added at its stored value. The book is consumed.
                </div>
              </div>

              {enchantedStacks.length === 0 && (
                <div style={{ ...vt, fontSize: 14, color: "#888" }}>
                  No enchanted books in stash. Use the EXTRACT tab to create some.
                </div>
              )}

              {/* Step 1: pick book */}
              {!appStack ? (
                <div>
                  <div style={{ ...px, fontSize: 8, color: "#8844ff", marginBottom: 8 }}>STEP 1 — PICK AN ENCHANTED BOOK</div>
                  {enchantedStacks.map((stack) => (
                    <div
                      key={stack.key}
                      onClick={() => { setAppBookKey(stack.key); setAppGearId(null); setAppConfirm(false); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "8px 10px",
                        background: "rgba(136,68,255,0.06)",
                        border: "1px solid #4422aa",
                        borderRadius: 4, marginBottom: 5, cursor: "pointer",
                      }}
                    >
                      <div style={{ minWidth: 28, height: 28, borderRadius: 3, background: "rgba(136,68,255,0.15)", border: "1px solid #6633cc", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ ...px, fontSize: 9, color: "#bb88ff" }}>{stack.count}</span>
                      </div>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>📖</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ ...vt, fontSize: 16, color: "#bb88ff" }}>{stack.label}</div>
                        <div style={{ ...vt, fontSize: 12, color: "#555" }}>
                          {stack.statValue !== null ? `Stored value: +${stack.statValue.toLocaleString()}` : "Value rolled on apply"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  {/* Selected book */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "rgba(136,68,255,0.1)", border: "1px solid #8844ff", borderRadius: 4, marginBottom: 10 }}>
                    <span style={{ fontSize: 20 }}>📖</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ ...vt, fontSize: 16, color: "#bb88ff" }}>{appStack.label}</div>
                      <div style={{ ...vt, fontSize: 12, color: "#666" }}>
                        {appStack.statValue !== null ? `Value: +${appStack.statValue.toLocaleString()} (preserved)` : "Value rolled from gear on apply"} · {appStack.count} available
                      </div>
                    </div>
                    <button onClick={() => { setAppBookKey(null); setAppGearId(null); setAppConfirm(false); }} style={{ ...vt, fontSize: 13, background: "none", border: "1px solid #333", color: "#666", padding: "3px 7px", cursor: "pointer", borderRadius: 3 }}>✕</button>
                  </div>

                  <div style={{ ...px, fontSize: 8, color: "#8844ff", marginBottom: 8 }}>STEP 2 — PICK GEAR TO ENCHANT</div>
                  <div style={{ ...vt, fontSize: 13, color: "#666", marginBottom: 8 }}>Only gear with a free stat slot is shown.</div>

                  {gearItems.filter((g) => {
                    const isGS = (g.gearScore ?? 0) > 0;
                    const maxSt = isGS ? 6 : (g.rarity === "scrap" || g.rarity === "common" ? 1 : g.rarity === "uncommon" ? 2 : g.rarity === "rare" ? 3 : g.rarity === "epic" ? 4 : g.rarity === "legendary" ? 5 : 6);
                    return g.stats.length < maxSt;
                  }).length === 0 ? (
                    <div style={{ ...vt, fontSize: 14, color: "#555" }}>No gear with free stat slots in stash.</div>
                  ) : (
                    gearItems.filter((g) => {
                      const isGS = (g.gearScore ?? 0) > 0;
                      const maxSt = isGS ? 6 : (g.rarity === "scrap" || g.rarity === "common" ? 1 : g.rarity === "uncommon" ? 2 : g.rarity === "rare" ? 3 : g.rarity === "epic" ? 4 : g.rarity === "legendary" ? 5 : 6);
                      return g.stats.length < maxSt;
                    }).map((gear) => {
                      const isGS = (gear.gearScore ?? 0) > 0;
                      const maxSt = isGS ? 6 : (gear.rarity === "scrap" || gear.rarity === "common" ? 1 : gear.rarity === "uncommon" ? 2 : gear.rarity === "rare" ? 3 : gear.rarity === "epic" ? 4 : gear.rarity === "legendary" ? 5 : 6);
                      const freeSlots = maxSt - gear.stats.length;
                      const isSel = appGearId === gear.id;
                      return (
                        <div
                          key={gear.id}
                          onClick={() => { setAppGearId(isSel ? null : gear.id); setAppConfirm(false); }}
                          style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "7px 10px",
                            background: isSel ? "rgba(136,68,255,0.1)" : "rgba(0,0,0,0.3)",
                            border: `1px solid ${isSel ? "#8844ff" : "#2a2a2a"}`,
                            borderRadius: 3, marginBottom: 4, cursor: "pointer",
                          }}
                        >
                          <span style={{ fontSize: 18 }}>{gear.emoji}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ ...vt, fontSize: 14, color: RARITY_COLORS[gear.rarity], overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{gear.name}</div>
                            <div style={{ ...vt, fontSize: 12, color: "#555" }}>
                              {RARITY_LABELS[gear.rarity]} · <span style={{ color: TIER_COLORS[gear.tier] }}>{TIER_LABELS[gear.tier]}</span> · {gear.stats.length}/{maxSt} stats · <span style={{ color: "#44ff88" }}>{freeSlots} free</span>
                            </div>
                          </div>
                          {isSel && <span style={{ color: "#8844ff", fontSize: 16 }}>✓</span>}
                        </div>
                      );
                    })
                  )}

                  {appGear && (
                    <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(136,68,255,0.06)", border: "1px solid #4422aa", borderRadius: 4 }}>
                      <div style={{ ...vt, fontSize: 14, color: "#bb88ff", marginBottom: 6 }}>
                        Apply <strong style={{ color: "#fff" }}>"{appStack.label}"</strong> onto <strong style={{ color: RARITY_COLORS[appGear.rarity] }}>{appGear.name}</strong>
                      </div>
                      <div style={{ ...vt, fontSize: 13, color: "#888", marginBottom: 10 }}>
                        {appStack.statValue !== null
                          ? `Stat added at preserved value: +${appStack.statValue.toLocaleString()}`
                          : "Stat value will be rolled from the gear's rarity and tier range."}
                        {" "}1 book consumed.
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <button
                          onClick={handleApply}
                          style={{
                            ...px, fontSize: 8, padding: "7px 12px",
                            background: "#0a0020",
                            color: appConfirm ? "#ff4444" : "#8844ff",
                            border: `1px solid ${appConfirm ? "#ff4444" : "#8844ff"}`,
                            borderRadius: 3, cursor: "pointer",
                          }}
                        >
                          {appConfirm ? "⚠ CONFIRM?" : "📖 APPLY ENCHANTMENT"}
                        </button>
                        {appConfirm && <button onClick={() => setAppConfirm(false)} style={{ ...vt, fontSize: 13, background: "none", border: "1px solid #333", color: "#666", padding: "5px 8px", cursor: "pointer", borderRadius: 3 }}>Cancel</button>}
                      </div>
                      {appConfirm && <div style={{ ...vt, fontSize: 13, color: "#ff8844", marginTop: 6 }}>⚠ The book will be permanently consumed!</div>}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid #2a1a44", padding: "10px 14px", display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={actions.dismissEnchantingTable}
            style={{ ...px, fontSize: 8, padding: "8px 14px", background: "#0a0020", color: "#8844ff", border: "1px solid #8844ff", borderRadius: 3, cursor: "pointer" }}
          >
            CLOSE TABLE
          </button>
        </div>
      </div>
    </div>
  );
}
