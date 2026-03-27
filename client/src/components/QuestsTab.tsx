// QuestsTab — accept quests at base, complete in dungeon, turn in at base
// Design: retro pixel aesthetic matching the rest of the game

import type { GameState, GameActions, Quest } from "@/hooks/useGameState";

interface Props {
  state: GameState;
  actions: GameActions;
}

const STATUS_COLORS: Record<string, string> = {
  available: "#aaa",
  active: "#44aaff",
  completed: "#44ff88",
  turned_in: "#555",
};

const STATUS_LABELS: Record<string, string> = {
  available: "AVAILABLE",
  active: "ACTIVE",
  completed: "COMPLETE!",
  turned_in: "TURNED IN",
};

function QuestCard({ quest, actions, isAtBase }: { quest: Quest; actions: GameActions; isAtBase: boolean }) {
  const progress = Math.min(quest.progress, quest.objective.target);
  const pct = quest.objective.target > 0 ? Math.round((progress / quest.objective.target) * 100) : 0;
  const color = STATUS_COLORS[quest.status] ?? "#aaa";

  return (
    <div
      style={{
        background: "rgba(0,0,0,0.5)",
        border: `1px solid ${quest.status === "completed" ? "#44ff88" : quest.status === "active" ? "#224466" : "#2a2a2a"}`,
        borderRadius: 6,
        padding: "12px 12px",
        marginBottom: 10,
        opacity: quest.status === "turned_in" ? 0.4 : 1,
      }}
    >
      {/* Title row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#ffcc44", marginBottom: 3 }}>
            {quest.title}
          </div>
          <div style={{ fontFamily: "'VT323', monospace", fontSize: 14, color: "#bbb" }}>
            {quest.description}
          </div>
        </div>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color, textAlign: "right", minWidth: 60 }}>
          {STATUS_LABELS[quest.status]}
        </div>
      </div>

      {/* Progress bar (active/completed) */}
      {(quest.status === "active" || quest.status === "completed") && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ height: 6, background: "#1a1a1a", borderRadius: 3, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${pct}%`,
                background: quest.status === "completed" ? "#44ff88" : "#44aaff",
                borderRadius: 3,
                transition: "width 0.3s",
              }}
            />
          </div>
          <div style={{ fontFamily: "'VT323', monospace", fontSize: 12, color: "#666", marginTop: 3 }}>
            {progress} / {quest.objective.target}
          </div>
        </div>
      )}

      {/* Reward */}
      <div style={{ fontFamily: "'VT323', monospace", fontSize: 13, color: "#ffaa44", marginBottom: 8 }}>
        Reward: 💰 {quest.reward.gold}g
        {quest.reward.materials && ` + ${quest.reward.materials.qty}x ${quest.reward.materials.type}`}
      </div>

      {/* Action button */}
      {quest.status === "available" && isAtBase && (
        <button
          onClick={() => actions.acceptQuest(quest.id)}
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 8,
            padding: "7px 12px",
            background: "#001a33",
            color: "#44aaff",
            border: "1px solid #44aaff",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          📋 ACCEPT
        </button>
      )}
      {quest.status === "completed" && isAtBase && (
        <button
          onClick={() => actions.turnInQuest(quest.id)}
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 8,
            padding: "7px 12px",
            background: "#001a0a",
            color: "#44ff88",
            border: "1px solid #44ff88",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          ✅ TURN IN
        </button>
      )}
      {quest.status === "completed" && !isAtBase && (
        <div style={{ fontFamily: "'VT323', monospace", fontSize: 13, color: "#44ff88" }}>
          ✅ Return to base to turn in!
        </div>
      )}
      {quest.status === "turned_in" && (
        <div style={{ fontFamily: "'VT323', monospace", fontSize: 13, color: "#555" }}>
          ✓ Completed
        </div>
      )}
    </div>
  );
}

export default function QuestsTab({ state, actions }: Props) {
  const isAtBase = !state.isInDungeon && !state.isReturning;
  const activeCount = state.quests.filter((q) => q.status === "active").length;
  const completedCount = state.quests.filter((q) => q.status === "completed").length;

  const sorted = [...state.quests].sort((a, b) => {
    const order = { completed: 0, active: 1, available: 2, turned_in: 3 };
    return (order[a.status] ?? 9) - (order[b.status] ?? 9);
  });

  return (
    <div style={{ padding: "10px 4px" }}>
      {/* Header info */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 14,
          padding: "10px 12px",
          background: "rgba(0,0,0,0.4)",
          border: "1px solid #2a2a2a",
          borderRadius: 6,
        }}
      >
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 11, color: "#44aaff" }}>{activeCount}/3</div>
          <div style={{ fontFamily: "'VT323', monospace", fontSize: 13, color: "#666", marginTop: 2 }}>ACTIVE</div>
        </div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 11, color: "#44ff88" }}>{completedCount}</div>
          <div style={{ fontFamily: "'VT323', monospace", fontSize: 13, color: "#666", marginTop: 2 }}>READY</div>
        </div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 11, color: "#ffcc44" }}>💰 {state.gold.toLocaleString()}</div>
          <div style={{ fontFamily: "'VT323', monospace", fontSize: 13, color: "#666", marginTop: 2 }}>GOLD</div>
        </div>
      </div>

      {!isAtBase && (
        <div
          style={{
            fontFamily: "'VT323', monospace",
            fontSize: 14,
            color: "#ff8844",
            textAlign: "center",
            padding: "8px",
            background: "rgba(255,100,0,0.1)",
            border: "1px solid #ff8844",
            borderRadius: 4,
            marginBottom: 12,
          }}
        >
          ⚠ Return to base to accept or turn in quests
        </div>
      )}

      {sorted.length === 0 ? (
        <div style={{ textAlign: "center", padding: 20 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
          <div style={{ fontFamily: "'VT323', monospace", fontSize: 16, color: "#555" }}>No quests available</div>
        </div>
      ) : (
        sorted.map((q) => (
          <QuestCard key={q.id} quest={q} actions={actions} isAtBase={isAtBase} />
        ))
      )}
    </div>
  );
}
