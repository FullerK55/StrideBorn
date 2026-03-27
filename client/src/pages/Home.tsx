// Stride Born — Main Game Page
// Design: Neo-Retro Pixel RPG — dark dungeon terminal, idle walking mechanic
// Character always walks automatically once in dungeon; player decides when to enter/return
// Profile-aware: shows active profile name and switch profile button

import { useState } from "react";
import { useGameState, DUNGEONS, RARITY_COLORS } from "@/hooks/useGameState";
import { useProfile } from "@/contexts/ProfileContext";
import DungeonScene from "@/components/DungeonScene";
import SettingsOverlay from "@/components/SettingsOverlay";
import OfflineSummary from "@/components/OfflineSummary";

type Tab = "bag" | "stash" | "gear" | "dungeons" | "log";

export default function Home() {
  const { activeProfile, updateProfileSave, setSwitchingProfile } = useProfile();
  const [state, actions] = useGameState(activeProfile!, updateProfileSave);
  const [activeTab, setActiveTab] = useState<Tab>("bag");
  const [showSettings, setShowSettings] = useState(false);

  const dungeon = state.dungeons.find((d) => d.id === state.currentDungeon) ?? state.dungeons[0];
  const isActive = state.isInDungeon || state.isReturning;

  // Progress bar values
  let progressPct = 0;
  let progressLabel = "";
  let progressColor = "linear-gradient(90deg, #2244aa, #4466ff)";

  if (state.isReturning) {
    progressPct = Math.min(100, (state.returnStepsWalked / state.returnStepsNeeded) * 100);
    progressLabel = `${Math.max(0, state.returnStepsNeeded - state.returnStepsWalked)} steps left`;
    progressColor = "linear-gradient(90deg, #aa4400, #ff8800)";
  } else if (state.isInDungeon) {
    progressPct = Math.min(100, (state.steps / state.stepsToNextFloor) * 100);
    progressLabel = `${state.stepsToNextFloor - state.steps} to next floor`;
    progressColor = "linear-gradient(90deg, #2244aa, #4466ff)";
  } else {
    progressPct = 0;
    progressLabel = "at base";
    progressColor = "linear-gradient(90deg, #224422, #448844)";
  }

  const bagUsed = state.bag.filter(Boolean).length;

  return (
    <div
      className="star-bg"
      style={{
        background: "var(--bg-deep)",
        minHeight: "100dvh",
        color: "var(--game-text)",
        fontFamily: "'VT323', monospace",
        fontSize: 18,
        overflowX: "hidden",
      }}
    >
      {/* Notification */}
      {actions.notification && (
        <div style={{
          position: "fixed",
          top: 16,
          left: "50%",
          transform: "translateX(-50%)",
          background: "var(--bg-panel)",
          border: "2px solid var(--gold)",
          padding: "10px 20px",
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 9,
          color: "var(--gold)",
          zIndex: 100,
          whiteSpace: "nowrap",
          maxWidth: "90vw",
          textAlign: "center",
          animation: "notifSlideIn 0.3s cubic-bezier(0.36,0.07,0.19,0.97)",
        }}>
          {actions.notification}
        </div>
      )}

      <div style={{
        position: "relative",
        zIndex: 1,
        maxWidth: 480,
        margin: "0 auto",
        padding: "12px 12px",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
      }}>

        {/* SETTINGS OVERLAY */}
        {showSettings && <SettingsOverlay onClose={() => setShowSettings(false)} onSaveNow={actions.saveNow} />}

        {/* OFFLINE SUMMARY MODAL */}
        {actions.offlineSummary && (
          <OfflineSummary
            summary={actions.offlineSummary}
            onClose={actions.clearOfflineSummary}
          />
        )}

        {/* HEADER */}
        <div style={{ textAlign: "center", padding: "12px 0 4px", position: "relative" }}>
          <div
            className="animate-title-pulse pixel-font"
            style={{
              fontSize: 20,
              color: "var(--gold)",
              textShadow: "0 0 20px rgba(255,215,0,0.5), 3px 3px 0 #8B6914",
              letterSpacing: 2,
            }}
          >
            STRIDE BORN
          </div>
          <div style={{ fontSize: 14, color: "var(--game-muted)", marginTop: 4, letterSpacing: 3 }}>
            ▸ WALK. DELVE. SURVIVE. ◂
          </div>

          {/* Profile info + switch button */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginTop: 6,
          }}>
            <span style={{ fontSize: 16, color: "var(--gem)" }}>
              {activeProfile?.avatar} {activeProfile?.name}
            </span>
            <button
              onClick={() => { actions.saveNow(); setSwitchingProfile(true); }}
              className="pixel-font"
              style={{
                background: "none",
                border: "1px solid var(--game-border)",
                color: "var(--game-muted)",
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 6,
                padding: "3px 6px",
                cursor: "pointer",
                letterSpacing: 0.5,
              }}
            >
              ⇄ SWITCH
            </button>
          </div>

          {/* Settings button + Auto-save indicator row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 4 }}>
            {actions.lastSaved && (
              <div style={{ fontSize: 11, color: "rgba(68,255,136,0.4)" }}>
                ● AUTO-SAVED
              </div>
            )}
            <button
              onClick={() => setShowSettings(true)}
              style={{
                background: "none",
                border: "1px solid var(--game-border)",
                color: "var(--game-muted)",
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 7,
                padding: "4px 8px",
                cursor: "pointer",
                letterSpacing: 0.5,
              }}
            >
              ⚙ SETTINGS
            </button>
          </div>
        </div>

        {/* STATS ROW */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { val: state.deepestFloor, lbl: "⚔ DEEPEST" },
            { val: state.totalSteps.toLocaleString(), lbl: "👣 TOTAL" },
            { val: state.runs, lbl: "🗡 RUNS" },
            { val: state.lives, lbl: "💀 LIVES" },
          ].map((s) => (
            <div key={s.lbl} style={{
              background: "#0a0a1a",
              border: "2px solid var(--game-border)",
              padding: "6px 10px",
              flex: 1,
              minWidth: 70,
              textAlign: "center",
            }}>
              <span className="pixel-font" style={{ fontSize: 11, color: "var(--gold)", display: "block" }}>{s.val}</span>
              <span style={{ fontSize: 12, color: "var(--game-muted)" }}>{s.lbl}</span>
            </div>
          ))}
        </div>

        {/* DUNGEON SCENE */}
        <DungeonScene state={state} lootPopups={actions.lootPopups} />

        {/* RETURN INDICATOR */}
        {state.isReturning && (
          <div style={{
            background: "rgba(255,136,68,0.1)",
            border: "2px solid var(--orange)",
            padding: 8,
            textAlign: "center",
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 8,
            color: "var(--orange)",
          }}>
            ↑ RETURNING TO BASE — {Math.max(0, state.returnStepsNeeded - state.returnStepsWalked)} STEPS REMAINING
          </div>
        )}

        {/* PROGRESS PANEL */}
        <div className="game-panel" style={{ padding: 12 }}>
          <div className="pixel-font" style={{ fontSize: 9, color: "var(--gold)", letterSpacing: 1, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
            PROGRESS
            <span style={{ flex: 1, height: 1, background: "var(--game-border)", display: "block" }} />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span className="pixel-font" style={{ fontSize: 11, color: "var(--gem)" }}>
              👣 {state.isReturning ? state.returnStepsWalked.toLocaleString() : state.steps.toLocaleString()} steps
            </span>
            <span style={{ fontSize: 14, color: "var(--game-muted)" }}>{progressLabel}</span>
          </div>

          {/* Progress bar */}
          <div style={{
            background: "#0a0a1a",
            border: "2px solid var(--game-border)",
            height: 16,
            position: "relative",
            overflow: "hidden",
            marginBottom: 10,
          }}>
            <div style={{
              height: "100%",
              width: `${progressPct}%`,
              background: progressColor,
              transition: "width 0.3s ease",
              position: "relative",
              overflow: "hidden",
            }} className="progress-segments" />
            <span className="pixel-font" style={{
              position: "absolute",
              right: 4,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 7,
              color: "rgba(255,255,255,0.8)",
              zIndex: 1,
            }}>
              {Math.floor(progressPct)}%
            </span>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            {/* Enter Dungeon / (active state placeholder) */}
            {!isActive ? (
              <button
                onClick={actions.enterDungeon}
                style={{
                  flex: 2,
                  background: "none",
                  border: "3px solid var(--green)",
                  color: "var(--green)",
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: 10,
                  padding: 12,
                  cursor: "pointer",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                ▶ ENTER DUNGEON
              </button>
            ) : (
              <div style={{
                flex: 2,
                border: "3px solid var(--health)",
                color: "var(--health)",
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 10,
                padding: 12,
                textAlign: "center",
                letterSpacing: 2,
              }}
              className="animate-btn-pulse"
              >
                {state.isReturning ? "🏃 RETURNING..." : "⚔ DELVING..."}
              </div>
            )}

            {/* Return to base */}
            <button
              onClick={actions.startReturn}
              disabled={!state.isInDungeon || state.isReturning}
              style={{
                flex: 1,
                background: "none",
                border: `2px solid ${state.isInDungeon && !state.isReturning ? "var(--orange)" : "var(--game-border)"}`,
                color: state.isInDungeon && !state.isReturning ? "var(--orange)" : "var(--game-muted)",
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 7,
                padding: "8px 4px",
                cursor: state.isInDungeon && !state.isReturning ? "pointer" : "not-allowed",
                opacity: state.isInDungeon && !state.isReturning ? 1 : 0.4,
                letterSpacing: 0.5,
              }}
            >
              ↩ RETURN
            </button>

            {/* Change dungeon */}
            <button
              onClick={() => setActiveTab("dungeons")}
              disabled={isActive}
              style={{
                flex: 1,
                background: "none",
                border: "2px solid var(--game-border)",
                color: "var(--game-muted)",
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 7,
                padding: "8px 4px",
                cursor: !isActive ? "pointer" : "not-allowed",
                opacity: !isActive ? 1 : 0.4,
                letterSpacing: 0.5,
              }}
            >
              🗺 DUNGEON
            </button>
          </div>
        </div>

        {/* MAIN TABBED PANEL */}
        <div className="game-panel" style={{ padding: 12, flex: 1 }}>
          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "2px solid var(--game-border)", marginBottom: 10 }}>
            {(["bag", "stash", "gear", "dungeons", "log"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="pixel-font"
                style={{
                  fontSize: 7,
                  padding: "8px 10px",
                  color: activeTab === tab ? "var(--gold)" : "var(--game-muted)",
                  cursor: "pointer",
                  borderBottom: `2px solid ${activeTab === tab ? "var(--gold)" : "transparent"}`,
                  marginBottom: -2,
                  background: "none",
                  border: "none",
                  letterSpacing: 0.5,
                  transition: "color 0.15s",
                }}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>

          {/* BAG TAB */}
          {activeTab === "bag" && (
            <div>
              <div style={{ fontSize: 13, color: "var(--game-muted)", marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
                <span>BAG ({bagUsed}/{state.bagSize} slots used)</span>
                <span style={{ fontSize: 12 }}>tap item to drop</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4 }}>
                {Array.from({ length: state.bagSize }).map((_, i) => {
                  const item = state.bag[i];
                  return (
                    <div
                      key={i}
                      onClick={() => item && actions.dropBagItem(i)}
                      title={item ? `${item.name} [${item.rarity}]\nTap to drop` : "Empty"}
                      style={{
                        background: "#0a0a1a",
                        border: `2px solid ${item ? RARITY_COLORS[item.rarity] ?? "var(--game-border)" : "var(--game-border)"}`,
                        aspectRatio: "1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 20,
                        position: "relative",
                        cursor: item ? "pointer" : "default",
                        opacity: item ? 1 : 0.3,
                        transition: "border-color 0.15s",
                      }}
                    >
                      {item ? item.emoji : "·"}
                      {item && item.qty && item.qty > 1 && (
                        <span style={{ position: "absolute", bottom: 1, right: 3, fontSize: 12, color: "var(--gold)", lineHeight: 1 }}>
                          {item.qty}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STASH TAB */}
          {activeTab === "stash" && (
            <div>
              <div style={{ fontSize: 13, color: "var(--game-muted)", marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
                <span>STASH ({state.stash.length}/{state.stashSize} slots)</span>
                <span style={{ color: "var(--green)", fontSize: 12 }}>
                  {state.currentFloor === 0 ? "✓ AT BASE" : "return to access"}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 3 }}>
                {Array.from({ length: state.stashSize }).map((_, i) => {
                  const item = state.stash[i];
                  return (
                    <div
                      key={i}
                      title={item ? `${item.name} x${item.qty || 1}` : "Empty"}
                      style={{
                        background: "#080810",
                        border: `1px solid ${item ? RARITY_COLORS[item.rarity] ?? "#2a2a4a" : "#2a2a4a"}`,
                        aspectRatio: "1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 16,
                        position: "relative",
                        opacity: item ? 1 : 0.15,
                      }}
                    >
                      {item ? item.emoji : ""}
                      {item && item.qty && item.qty > 1 && (
                        <span style={{ position: "absolute", bottom: 1, right: 2, fontSize: 10, color: "var(--gold)", lineHeight: 1 }}>
                          {item.qty}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* GEAR TAB */}
          {activeTab === "gear" && (
            <div>
              <div style={{ fontSize: 13, color: "var(--game-muted)", marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
                <span>EQUIPPED GEAR</span>
                <span style={{ color: "var(--gem)", fontSize: 12 }}>steps/floor bonus: 1.0x</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                {[
                  { name: "HELMET", emoji: "⛑️", bonus: "+DEF 2" },
                  { name: "ARMOR", emoji: "🥋", bonus: "+DEF 5" },
                  { name: "WEAPON", emoji: "⚔️", bonus: "+ATK 4" },
                  { name: "BOOTS", emoji: "👢", bonus: "+0.1x steps", bonusColor: "var(--gold)" },
                  { name: "RING", emoji: "💍", bonus: "+LUCK 1" },
                  { name: "AMULET", emoji: "📿", bonus: "+HP 10" },
                ].map((g) => (
                  <div key={g.name} style={{
                    background: "#0a0a1a",
                    border: "2px solid var(--game-border)",
                    padding: 8,
                    textAlign: "center",
                  }}>
                    <span style={{ fontSize: 11, color: "var(--game-muted)", display: "block", marginBottom: 4 }}>{g.name}</span>
                    <div style={{ fontSize: 24 }}>{g.emoji}</div>
                    <span style={{ fontSize: 11, color: g.bonusColor ?? "var(--green)", display: "block", marginTop: 2 }}>{g.bonus}</span>
                  </div>
                ))}
              </div>
              <div className="px-divider" style={{ marginTop: 10 }} />
              <div style={{ fontSize: 12, color: "var(--game-muted)", marginTop: 8, textAlign: "center" }}>
                upgrade gear at base using stash materials<br/>better boots = more floors per 1000 steps
              </div>
            </div>
          )}

          {/* DUNGEONS TAB */}
          {activeTab === "dungeons" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {state.dungeons.map((d) => (
                <div
                  key={d.id}
                  onClick={() => d.unlocked && !isActive && actions.selectDungeon(d.id)}
                  style={{
                    background: "#0a0a1a",
                    border: `2px solid ${d.id === state.currentDungeon ? "var(--gold)" : "var(--game-border)"}`,
                    padding: 10,
                    cursor: d.unlocked && !isActive ? "pointer" : "not-allowed",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    opacity: d.unlocked ? 1 : 0.4,
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ fontSize: 28, flexShrink: 0 }}>{d.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div className="pixel-font" style={{ fontSize: 8, color: "var(--gold)", marginBottom: 3 }}>
                      {d.name}{!d.unlocked ? ` 🔒 (floor ${d.unlockFloor})` : ""}
                      {d.id === state.currentDungeon ? " ✓" : ""}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--game-muted)" }}>{d.desc}</div>
                    <div style={{ fontSize: 12, color: "var(--gem)", marginTop: 2 }}>{d.drops.join(" · ")}</div>
                  </div>
                </div>
              ))}
              {isActive && (
                <div style={{ fontSize: 12, color: "var(--orange)", textAlign: "center", marginTop: 4 }}>
                  Return to base to change dungeon
                </div>
              )}
            </div>
          )}

          {/* LOG TAB */}
          {activeTab === "log" && (
            <div style={{
              background: "#050510",
              border: "2px solid var(--game-border)",
              padding: 8,
              height: 200,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 2,
              fontSize: 13,
            }}>
              {actions.log.map((entry) => (
                <div
                  key={entry.id}
                  className="animate-log-slide"
                  style={{
                    padding: "2px 0",
                    borderBottom: "1px solid rgba(58,58,106,0.3)",
                    color: entry.cls === "log-gold" ? "var(--gold)"
                      : entry.cls === "log-gem" ? "var(--gem)"
                      : entry.cls === "log-red" ? "var(--health)"
                      : entry.cls === "log-green" ? "var(--green)"
                      : entry.cls === "log-orange" ? "var(--orange)"
                      : "var(--game-muted)",
                  }}
                >
                  {entry.text}
                </div>
              ))}
              {actions.log.length === 0 && (
                <div style={{ color: "var(--game-muted)" }}>— awaiting your first steps, adventurer —</div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
