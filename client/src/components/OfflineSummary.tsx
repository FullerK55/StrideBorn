// ============================================================
// Stride Born — Offline Summary Modal
// Design: Neo-Retro Pixel RPG — shown on login when offline progress was earned
// ============================================================

import { DUNGEONS, RARITY_COLORS, MATERIAL_INFO } from "@/hooks/useGameState";
import type { OfflineSummary as OfflineSummaryType, GearItem, MaterialItem } from "@/hooks/useGameState";

interface OfflineSummaryProps {
  summary: OfflineSummaryType;
  onClose: () => void;
}

export default function OfflineSummary({ summary, onClose }: OfflineSummaryProps) {
  const dungeon = DUNGEONS.find((d) => d.id === summary.dungeon);

  const hours = Math.floor(summary.secondsAway / 3600);
  const mins = Math.floor((summary.secondsAway % 3600) / 60);
  const timeLabel = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  // Group loot by key for display
  const lootGroups: Record<string, { emoji: string; name: string; rarity: string; count: number }> = {};
  summary.lootFound.forEach((item) => {
    const isGear = 'isGear' in item;
    const key = isGear ? (item as GearItem).id : (item as MaterialItem).type;
    const emoji = isGear ? (item as GearItem).emoji : MATERIAL_INFO[(item as MaterialItem).type].emoji;
    const name = isGear ? (item as GearItem).name : MATERIAL_INFO[(item as MaterialItem).type].label;
    const rarity = isGear ? (item as GearItem).rarity : 'common';
    if (lootGroups[key]) {
      lootGroups[key].count++;
    } else {
      lootGroups[key] = { emoji, name, rarity, count: 1 };
    }
  });
  const lootEntries = Object.values(lootGroups).sort((a, b) => {
    const rarityOrder = { legendary: 0, rare: 1, uncommon: 2, common: 3 };
    return (rarityOrder[a.rarity as keyof typeof rarityOrder] ?? 4) -
           (rarityOrder[b.rarity as keyof typeof rarityOrder] ?? 4);
  });

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.85)",
          zIndex: 300,
          animation: "fadeIn 0.2s ease",
        }}
      />

      {/* Modal */}
      <div style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "calc(100% - 32px)",
        maxWidth: 420,
        maxHeight: "85dvh",
        overflowY: "auto",
        background: "var(--bg-panel)",
        border: "3px solid var(--gold)",
        zIndex: 301,
        animation: "scaleIn 0.25s cubic-bezier(0.32, 0.72, 0, 1)",
        boxShadow: "0 0 40px rgba(255,215,0,0.2)",
      }}>

        {/* Header */}
        <div style={{
          background: "rgba(255,215,0,0.08)",
          borderBottom: "2px solid var(--gold)",
          padding: "16px 16px 12px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 36, marginBottom: 6 }}>⏰</div>
          <div className="pixel-font" style={{
            fontSize: 11,
            color: "var(--gold)",
            letterSpacing: 2,
            marginBottom: 4,
          }}>
            WELCOME BACK!
          </div>
          <div style={{ fontSize: 15, color: "var(--game-muted)" }}>
            You were away for <span style={{ color: "var(--gem)" }}>{timeLabel}</span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ padding: "14px 16px 0" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginBottom: 14,
          }}>
            {[
              { label: "DUNGEON", value: `${dungeon?.icon ?? "?"} ${dungeon?.name ?? summary.dungeon}`, color: "var(--gem)" },
              { label: "FLOORS CLEARED", value: `+${summary.floorsCleared}`, color: "var(--green)" },
              { label: "FLOOR REACHED", value: `${summary.endFloor}`, color: "var(--gold)" },
              { label: "STEPS EARNED", value: summary.totalStepsEarned.toLocaleString(), color: "var(--gem)" },
            ].map((s) => (
              <div key={s.label} style={{
                background: "#0a0a1a",
                border: "2px solid var(--game-border)",
                padding: "8px 10px",
                textAlign: "center",
              }}>
                <div className="pixel-font" style={{ fontSize: 7, color: "var(--game-muted)", marginBottom: 4, letterSpacing: 0.5 }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 16, color: s.color, fontFamily: "'VT323', monospace" }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          {/* Loot */}
          <div className="pixel-font" style={{
            fontSize: 8,
            color: "var(--gem)",
            letterSpacing: 2,
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            LOOT COLLECTED ({summary.lootFound.length})
            <span style={{ flex: 1, height: 1, background: "var(--game-border)", display: "block" }} />
          </div>

          {lootEntries.length === 0 ? (
            <div style={{ fontSize: 14, color: "var(--game-muted)", textAlign: "center", padding: "8px 0" }}>
              No floors cleared — nothing found.
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))",
              gap: 6,
              marginBottom: 14,
              maxHeight: 180,
              overflowY: "auto",
            }}>
              {lootEntries.map(({ emoji, name, rarity, count }) => (
                <div
                  key={name}
                  title={`${name} x${count} [${rarity}]`}
                  style={{
                    background: "#0a0a1a",
                    border: `2px solid ${RARITY_COLORS[rarity] ?? "var(--game-border)"}`,
                    padding: "6px 4px",
                    textAlign: "center",
                    position: "relative",
                  }}
                >
                  <div style={{ fontSize: 22 }}>{emoji}</div>
                  <div style={{ fontSize: 11, color: RARITY_COLORS[rarity] ?? "var(--game-muted)" }}>
                    x{count}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ fontSize: 13, color: "var(--game-muted)", textAlign: "center", marginBottom: 14 }}>
            All loot has been added to your stash.
          </div>
        </div>

        {/* Close button */}
        <div style={{ padding: "0 16px 16px" }}>
          <button
            onClick={onClose}
            className="pixel-font"
            style={{
              width: "100%",
              background: "none",
              border: "3px solid var(--green)",
              color: "var(--green)",
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 10,
              padding: 14,
              cursor: "pointer",
              letterSpacing: 2,
            }}
          >
            ▶ CONTINUE
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </>
  );
}
