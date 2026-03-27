// Stride Born — Materials Tab
// Shows material inventory at base. Only accessible at base.
// Design: Retro pixel dungeon aesthetic

import React from "react";
import type { GameState } from "@/hooks/useGameState";
import { MATERIAL_INFO } from "@/hooks/useGameState";
import type { MaterialType } from "@/hooks/useGameState";

interface Props {
  state: GameState;
}

const MATERIAL_ORDER: MaterialType[] = ["crude", "refined", "tempered", "voidmat", "celestialmat"];

const MATERIAL_DESCRIPTIONS: Record<MaterialType, string> = {
  crude:        "Found in floors 1-20. Basic crafting material.",
  refined:      "Found in floors 21-50. Intermediate material.",
  tempered:     "Found in floors 51-100. Advanced material.",
  voidmat:      "Found in floors 101-200. Rare void-touched ore.",
  celestialmat: "Found in floors 200+. Celestial essence.",
};

const MATERIAL_COLORS: Record<MaterialType, string> = {
  crude:        "#aaaaaa",
  refined:      "#88ccff",
  tempered:     "#ff8844",
  voidmat:      "#aa44ff",
  celestialmat: "#ffdd44",
};

export default function MaterialsTab({ state }: Props) {
  const isAtBase = !state.isInDungeon && !state.isReturning;

  return (
    <div style={{ padding: "12px 8px", fontFamily: "'Press Start 2P', monospace" }}>
      {!isAtBase && (
        <div style={{
          background: "#2a1a00",
          border: "1px solid #ffaa00",
          borderRadius: 4,
          padding: "8px 10px",
          fontSize: 9,
          color: "#ffaa00",
          marginBottom: 12,
          textAlign: "center",
        }}>
          ⚠ Return to base to view materials
        </div>
      )}

      <div style={{ fontSize: 10, color: "#ffaa00", marginBottom: 12, letterSpacing: 1 }}>
        ⚙ MATERIAL INVENTORY
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {MATERIAL_ORDER.map((type) => {
          const info = MATERIAL_INFO[type];
          const qty = state.materials[type] ?? 0;
          const color = MATERIAL_COLORS[type];

          return (
            <div
              key={type}
              style={{
                background: qty > 0 ? `${color}12` : "#111",
                border: `1px solid ${qty > 0 ? color : "#333"}`,
                borderRadius: 4,
                padding: "10px 12px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                opacity: qty > 0 ? 1 : 0.5,
              }}
            >
              <div style={{ fontSize: 24, minWidth: 32, textAlign: "center" }}>{info.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color, marginBottom: 3 }}>{info.label.toUpperCase()}</div>
                <div style={{ fontSize: 8, color: "#888", fontFamily: "'VT323', monospace", lineHeight: 1.4 }}>
                  {MATERIAL_DESCRIPTIONS[type]}
                </div>
              </div>
              <div style={{
                fontSize: 18,
                color: qty > 0 ? color : "#444",
                fontFamily: "'Press Start 2P', monospace",
                minWidth: 40,
                textAlign: "right",
              }}>
                {qty}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 16, padding: "10px 12px", background: "#0d0d1a", border: "1px solid #333", borderRadius: 4 }}>
        <div style={{ fontSize: 9, color: "#ffaa00", marginBottom: 6 }}>CONVERSION RATES</div>
        <div style={{ fontSize: 8, color: "#888", fontFamily: "'VT323', monospace", lineHeight: 1.8 }}>
          5 🪨 Crude → 1 ⚙️ Refined<br />
          5 ⚙️ Refined → 1 🔩 Tempered<br />
          5 🔩 Tempered → 1 💠 Void<br />
          5 💠 Void → 1 🌟 Celestial
        </div>
        <div style={{ fontSize: 8, color: "#555", fontFamily: "'VT323', monospace", marginTop: 6 }}>
          Use the Craft tab to convert materials.
        </div>
      </div>
    </div>
  );
}
