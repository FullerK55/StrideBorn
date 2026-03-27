// Stride Born — Craft Tab
// Only accessible at base. Material conversion, gear crafting, rune combining.
// Design: Retro pixel dungeon aesthetic

import React, { useState } from "react";
import type { GameState, GameActions, GearItem, MaterialType } from "@/hooks/useGameState";
import { MATERIAL_INFO, RARITY_COLORS, RARITY_LABELS, TIER_LABELS, RUNES } from "@/hooks/useGameState";

interface Props {
  state: GameState;
  actions: GameActions;
}

const MATERIAL_ORDER: MaterialType[] = ["crude", "refined", "tempered", "voidmat", "celestialmat"];

const CONVERT_LABELS: Record<MaterialType, string> = {
  crude:        "5 🪨 Crude → 1 ⚙️ Refined",
  refined:      "5 ⚙️ Refined → 1 🔩 Tempered",
  tempered:     "5 🔩 Tempered → 1 💠 Void",
  voidmat:      "5 💠 Void → 1 🌟 Celestial",
  celestialmat: "Already max tier",
};

type CraftSection = "convert" | "gear" | "runes";

export default function CraftTab({ state, actions }: Props) {
  const [section, setSection] = useState<CraftSection>("convert");
  const [selectedGear, setSelectedGear] = useState<GearItem | null>(null);
  const isAtBase = !state.isInDungeon && !state.isReturning;

  const tabStyle = (active: boolean) => ({
    flex: 1,
    padding: "6px 4px",
    background: active ? "#1a1a3e" : "#0d0d1a",
    border: `1px solid ${active ? "#ffaa00" : "#333"}`,
    color: active ? "#ffaa00" : "#666",
    fontSize: 8,
    fontFamily: "'Press Start 2P', monospace",
    cursor: "pointer",
    textAlign: "center" as const,
  });

  return (
    <div style={{ padding: "12px 8px", fontFamily: "'Press Start 2P', monospace" }}>
      {!isAtBase && (
        <div style={{
          background: "#2a1a00", border: "1px solid #ffaa00", borderRadius: 4,
          padding: "8px 10px", fontSize: 9, color: "#ffaa00", marginBottom: 12, textAlign: "center",
        }}>
          ⚠ Return to base to craft
        </div>
      )}

      <div style={{ fontSize: 10, color: "#ffaa00", marginBottom: 10, letterSpacing: 1 }}>⚗ CRAFTING</div>

      {/* Section tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
        {(["convert", "gear", "runes"] as CraftSection[]).map((s) => (
          <button key={s} style={tabStyle(section === s)} onClick={() => setSection(s)}>
            {s === "convert" ? "CONVERT" : s === "gear" ? "GEAR" : "RUNES"}
          </button>
        ))}
      </div>

      {/* CONVERT section */}
      {section === "convert" && (
        <div>
          <div style={{ fontSize: 9, color: "#888", marginBottom: 10, fontFamily: "'VT323', monospace" }}>
            Convert 5 of a lower material into 1 of the next tier.
          </div>
          {MATERIAL_ORDER.map((type) => {
            const qty = state.materials[type] ?? 0;
            const canConvert = type !== "celestialmat" && qty >= 5;
            return (
              <div key={type} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "8px 10px", marginBottom: 6,
                background: canConvert ? "#0d1a0d" : "#0d0d0d",
                border: `1px solid ${canConvert ? "#44ff88" : "#333"}`,
                borderRadius: 4,
              }}>
                <div>
                  <div style={{ fontSize: 8, color: canConvert ? "#44ff88" : "#555" }}>
                    {CONVERT_LABELS[type]}
                  </div>
                  <div style={{ fontSize: 8, color: "#888", fontFamily: "'VT323', monospace", marginTop: 2 }}>
                    You have: {qty} {MATERIAL_INFO[type].emoji}
                  </div>
                </div>
                <button
                  disabled={!canConvert || !isAtBase}
                  onClick={() => actions.craftConvert(type)}
                  style={{
                    padding: "5px 8px", fontSize: 8,
                    background: canConvert && isAtBase ? "#1a3a1a" : "#1a1a1a",
                    border: `1px solid ${canConvert && isAtBase ? "#44ff88" : "#333"}`,
                    color: canConvert && isAtBase ? "#44ff88" : "#444",
                    fontFamily: "'Press Start 2P', monospace",
                    cursor: canConvert && isAtBase ? "pointer" : "not-allowed",
                    borderRadius: 3,
                  }}
                >
                  CONVERT
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* GEAR section */}
      {section === "gear" && (
        <div>
          {!selectedGear ? (
            <>
              <div style={{ fontSize: 9, color: "#888", marginBottom: 10, fontFamily: "'VT323', monospace" }}>
                Select a gear piece from your stash to craft on it.
              </div>
              {state.stash.length === 0 ? (
                <div style={{ textAlign: "center", color: "#555", fontSize: 9, padding: "16px 0" }}>
                  No gear in stash. Explore dungeons!
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {state.stash.map((gear) => (
                    <div
                      key={gear.id}
                      onClick={() => setSelectedGear(gear)}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "8px 10px", cursor: "pointer",
                        background: "#0d0d1a",
                        border: `1px solid ${RARITY_COLORS[gear.rarity]}`,
                        borderRadius: 4,
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{gear.emoji}</span>
                      <div>
                        <div style={{ fontSize: 9, color: RARITY_COLORS[gear.rarity] }}>{gear.name}</div>
                        <div style={{ fontSize: 8, color: "#888", fontFamily: "'VT323', monospace" }}>
                          {RARITY_LABELS[gear.rarity]} · {TIER_LABELS[gear.tier]}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div>
              <button
                onClick={() => setSelectedGear(null)}
                style={{ fontSize: 8, color: "#888", background: "none", border: "none", cursor: "pointer", marginBottom: 10, fontFamily: "'Press Start 2P', monospace" }}
              >
                ← BACK
              </button>
              <div style={{ padding: "10px", background: "#0d0d1a", border: `1px solid ${RARITY_COLORS[selectedGear.rarity]}`, borderRadius: 4, marginBottom: 12 }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{selectedGear.emoji}</div>
                <div style={{ fontSize: 9, color: RARITY_COLORS[selectedGear.rarity] }}>{selectedGear.name}</div>
                <div style={{ fontSize: 8, color: "#aaa", fontFamily: "'VT323', monospace" }}>
                  {RARITY_LABELS[selectedGear.rarity]} · {TIER_LABELS[selectedGear.tier]}
                </div>
              </div>

              {/* Reroll stat */}
              <CraftAction
                label="🎲 REROLL STATS"
                desc={`Randomize all stats. Cost varies by rarity.`}
                canDo={isAtBase}
                onClick={() => { actions.craftReroll(selectedGear.id); setSelectedGear(null); }}
              />

              {/* Add socket */}
              {["uncommon", "rare", "epic"].includes(selectedGear.rarity) && (
                <CraftAction
                  label="🔮 ADD SOCKET"
                  desc={`Add a rune socket. Max sockets: ${selectedGear.sockets}/${selectedGear.rarity === "uncommon" ? 1 : selectedGear.rarity === "rare" ? 2 : 3}`}
                  canDo={isAtBase}
                  onClick={() => { actions.craftSocket(selectedGear.id); setSelectedGear(null); }}
                />
              )}

              {/* Tier upgrade */}
              {selectedGear.tier !== "celestial" && (
                <CraftAction
                  label="⬆ TIER UPGRADE"
                  desc={`Upgrade to next tier. Costs significant materials.`}
                  canDo={isAtBase}
                  onClick={() => { actions.craftTierUp(selectedGear.id); setSelectedGear(null); }}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* RUNES section */}
      {section === "runes" && (
        <div>
          <div style={{ fontSize: 9, color: "#888", marginBottom: 10, fontFamily: "'VT323', monospace" }}>
            Combine 3 runes of the same type to create a higher grade rune.
          </div>
          {RUNES.filter((r) => (state.runes[r.id] ?? 0) > 0 || r.grade === 1).map((rune) => {
            const qty = state.runes[rune.id] ?? 0;
            const canCombine = rune.nextId !== null && qty >= 3;
            return (
              <div key={rune.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "8px 10px", marginBottom: 6,
                background: qty > 0 ? "#0d0d1a" : "#080808",
                border: `1px solid ${qty > 0 ? "#aa88ff" : "#222"}`,
                borderRadius: 4,
                opacity: qty > 0 ? 1 : 0.4,
              }}>
                <div>
                  <div style={{ fontSize: 9, color: qty > 0 ? "#aa88ff" : "#555" }}>
                    {rune.emoji} {rune.name}
                  </div>
                  <div style={{ fontSize: 8, color: "#888", fontFamily: "'VT323', monospace", marginTop: 2 }}>
                    {rune.stat} · You have: {qty}
                  </div>
                </div>
                {rune.nextId && (
                  <button
                    disabled={!canCombine || !isAtBase}
                    onClick={() => actions.combineRune(rune.id)}
                    style={{
                      padding: "5px 8px", fontSize: 8,
                      background: canCombine && isAtBase ? "#1a1a3a" : "#0d0d0d",
                      border: `1px solid ${canCombine && isAtBase ? "#aa88ff" : "#333"}`,
                      color: canCombine && isAtBase ? "#aa88ff" : "#444",
                      fontFamily: "'Press Start 2P', monospace",
                      cursor: canCombine && isAtBase ? "pointer" : "not-allowed",
                      borderRadius: 3,
                    }}
                  >
                    3→1
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CraftAction({ label, desc, canDo, onClick }: { label: string; desc: string; canDo: boolean; onClick: () => void }) {
  return (
    <div style={{
      padding: "10px", marginBottom: 8,
      background: "#0d0d1a", border: "1px solid #333", borderRadius: 4,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div style={{ fontSize: 9, color: "#ffaa00" }}>{label}</div>
        <button
          disabled={!canDo}
          onClick={onClick}
          style={{
            padding: "5px 8px", fontSize: 8,
            background: canDo ? "#1a1a00" : "#111",
            border: `1px solid ${canDo ? "#ffaa00" : "#333"}`,
            color: canDo ? "#ffaa00" : "#444",
            fontFamily: "'Press Start 2P', monospace",
            cursor: canDo ? "pointer" : "not-allowed",
            borderRadius: 3,
          }}
        >
          CRAFT
        </button>
      </div>
      <div style={{ fontSize: 8, color: "#888", fontFamily: "'VT323', monospace" }}>{desc}</div>
    </div>
  );
}
