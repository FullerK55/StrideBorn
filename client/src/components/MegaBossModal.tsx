// MegaBossModal — shown when player reaches a floor divisible by 100
// Player chooses one reward from a set of options
// Design: dark red / ominous aesthetic, pixel font

import type { GameState, GameActions, MegaBossReward } from "@/hooks/useGameState";

interface Props {
  state: GameState;
  actions: GameActions;
}

const REWARDS: { id: MegaBossReward; emoji: string; title: string; desc: string; available: boolean }[] = [
  {
    id: "enchanting_table",
    emoji: "🔮",
    title: "ENCHANTING TABLE",
    desc: "Strip a stat from any stash gear piece and inscribe it onto a book. Books can be placed on any gear at base.",
    available: true,
  },
  {
    id: "portal",
    emoji: "🌀",
    title: "DUNGEON PORTAL",
    desc: "A portal opens to base. Return instantly, manage your gear, then step back through to resume from this exact floor. One trip each way.",
    available: true,
  },
  {
    id: "placeholder_a",
    emoji: "⚗️",
    title: "ALCHEMIST'S BOON",
    desc: "Coming soon...",
    available: false,
  },
];

export default function MegaBossModal({ state, actions }: Props) {
  const boss = state.activeMegaBoss;
  if (!boss) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "0 16px" }}>
      <div style={{ background: "#0a0000", border: "2px solid #cc2200", borderRadius: 6, width: "100%", maxWidth: 420, maxHeight: "88vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 0 60px rgba(200,0,0,0.4)" }}>

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #1a0000, #2a0000)", borderBottom: "2px solid #cc2200", padding: "14px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 6 }}>☠️</div>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: "#ff4444", letterSpacing: 2 }}>MEGA BOSS DEFEATED</div>
          <div style={{ fontFamily: "'VT323', monospace", fontSize: 14, color: "#888", marginTop: 4 }}>Floor {boss.floor} — Choose your reward</div>
        </div>

        {/* Reward choices */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px" }}>
          {boss.rewardChosen ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#888" }}>REWARD CLAIMED</div>
              <button
                onClick={actions.dismissMegaBoss}
                style={{ marginTop: 16, fontFamily: "'Press Start 2P', monospace", fontSize: 8, padding: "10px 18px", background: "#0d0000", color: "#cc2200", border: "1px solid #cc2200", borderRadius: 3, cursor: "pointer" }}
              >
                CONTINUE
              </button>
            </div>
          ) : (
            <>
              <div style={{ fontFamily: "'VT323', monospace", fontSize: 14, color: "#888", marginBottom: 12, textAlign: "center" }}>
                Select one of the following:
              </div>
              {REWARDS.map((r) => (
                <div
                  key={r.id}
                  onClick={() => r.available && actions.chooseMegaBossReward(r.id)}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    padding: "12px 14px",
                    background: r.available ? "rgba(200,0,0,0.06)" : "rgba(0,0,0,0.3)",
                    border: `1px solid ${r.available ? "#cc2200" : "#2a2a2a"}`,
                    borderRadius: 4,
                    marginBottom: 10,
                    cursor: r.available ? "pointer" : "not-allowed",
                    opacity: r.available ? 1 : 0.45,
                    transition: "background 0.15s",
                  }}
                >
                  <span style={{ fontSize: 28, flexShrink: 0 }}>{r.emoji}</span>
                  <div>
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: r.available ? "#ff8844" : "#555", marginBottom: 5 }}>{r.title}</div>
                    <div style={{ fontFamily: "'VT323', monospace", fontSize: 14, color: r.available ? "#aaa" : "#555" }}>{r.desc}</div>
                    {!r.available && <div style={{ fontFamily: "'VT323', monospace", fontSize: 12, color: "#444", marginTop: 3 }}>NOT YET IMPLEMENTED</div>}
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 6, textAlign: "center" }}>
                <button
                  onClick={actions.dismissMegaBoss}
                  style={{ fontFamily: "'VT323', monospace", fontSize: 14, background: "none", border: "1px solid #333", color: "#555", padding: "6px 14px", cursor: "pointer", borderRadius: 3 }}
                >
                  Skip reward
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
