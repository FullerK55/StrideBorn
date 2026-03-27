// Stride Born — Main Game Page
// Design: Neo-Retro Pixel RPG — dark dungeon terminal, idle walking mechanic
// Tabs: Bag | Stash | Gear | Materials | Craft | Dungeons | Log

import { useState } from "react";
import { useGameState, DUNGEONS, RARITY_COLORS } from "@/hooks/useGameState";
import { useProfile } from "@/contexts/ProfileContext";
import DungeonScene from "@/components/DungeonScene";
import SettingsOverlay from "@/components/SettingsOverlay";
import OfflineSummary from "@/components/OfflineSummary";
import GearTab from "@/components/GearTab";
import MaterialsTab from "@/components/MaterialsTab";
import CraftTab from "@/components/CraftTab";
import type { GearItem, MaterialItem } from "@/hooks/useGameState";
import { MATERIAL_INFO, RARITY_LABELS, TIER_LABELS } from "@/hooks/useGameState";
import VendorModal from "@/components/VendorModal";
import ShopTab from "@/components/ShopTab";
import QuestsTab from "@/components/QuestsTab";
import EnhanceTab from "@/components/EnhanceTab";

type Tab = "bag" | "stash" | "gear" | "materials" | "craft" | "enhance" | "shop" | "quests" | "dungeons" | "log";

const TABS: { id: Tab; label: string; baseOnly?: boolean }[] = [
  { id: "bag", label: "BAG" },
  { id: "stash", label: "STASH" },
  { id: "gear", label: "GEAR" },
  { id: "materials", label: "MATS", baseOnly: true },
  { id: "craft", label: "CRAFT", baseOnly: true },
  { id: "enhance", label: "ENHANCE", baseOnly: true },
  { id: "shop", label: "SHOP", baseOnly: true },
  { id: "quests", label: "QUESTS" },
  { id: "dungeons", label: "MAP" },
  { id: "log", label: "LOG" },
];

export default function Home() {
  const { activeProfile, updateProfileSave, setSwitchingProfile } = useProfile();
  const [state, actions] = useGameState(activeProfile!, updateProfileSave);
  const [activeTab, setActiveTab] = useState<Tab>("bag");
  const [showSettings, setShowSettings] = useState(false);

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

        {/* Vendor Modal — auto-pauses walking */}
        <VendorModal state={state} actions={actions} />

        {/* OFFLINE SUMMARY MODAL */}
        {actions.offlineSummary && (
          <OfflineSummary summary={actions.offlineSummary} onClose={actions.clearOfflineSummary} />
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 6 }}>
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
              <div
                style={{
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
              🗺 MAP
            </button>
          </div>
        </div>

        {/* MAIN TABBED PANEL */}
        <div className="game-panel" style={{ padding: 12, flex: 1 }}>
          {/* Tabs — scrollable row */}
          <div style={{
            display: "flex",
            overflowX: "auto",
            borderBottom: "2px solid var(--game-border)",
            marginBottom: 10,
            scrollbarWidth: "none",
          }}>
            {TABS.map((tab) => {
              const locked = !!tab.baseOnly && isActive;
              return (
                <button
                  key={tab.id}
                  onClick={() => !locked && setActiveTab(tab.id)}
                  className="pixel-font"
                  style={{
                    fontSize: 7,
                    padding: "8px 10px",
                    color: activeTab === tab.id ? "var(--gold)" : locked ? "#444" : "var(--game-muted)",
                    cursor: locked ? "not-allowed" : "pointer",
                    borderBottom: `2px solid ${activeTab === tab.id ? "var(--gold)" : "transparent"}`,
                    marginBottom: -2,
                    background: "none",
                    border: "none",
                    borderBottomWidth: 2,
                    borderBottomStyle: "solid",
                    borderBottomColor: activeTab === tab.id ? "var(--gold)" : "transparent",
                    letterSpacing: 0.5,
                    transition: "color 0.15s",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    opacity: locked ? 0.4 : 1,
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
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
                  const isGear = item && 'isGear' in item && (item as GearItem).isGear;
                  const isMat = item && 'isMaterial' in item && (item as MaterialItem).isMaterial;
                  const borderColor = item
                    ? isGear
                      ? RARITY_COLORS[(item as GearItem).rarity] ?? "var(--game-border)"
                      : isMat
                        ? "#888"
                        : RARITY_COLORS[(item as any).rarity] ?? "var(--game-border)"
                    : "var(--game-border)";
                  return (
                    <div
                      key={i}
                      onClick={() => item && actions.dropBagItem(i)}
                      title={item ? `${isGear ? (item as GearItem).name : (item as MaterialItem).type}\nTap to drop` : "Empty"}
                      style={{
                        background: "#0a0a1a",
                        border: `2px solid ${borderColor}`,
                        aspectRatio: "1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 20,
                        position: "relative",
                        cursor: item ? "pointer" : "default",
                        opacity: item ? 1 : 0.3,
                        transition: "border-color 0.15s",
                        flexDirection: "column",
                        gap: 1,
                      }}
                    >
                      {item ? (isGear ? (item as GearItem).emoji : (item as MaterialItem).isMaterial ? MATERIAL_INFO[(item as MaterialItem).type]?.emoji ?? "📦" : "📦") : "·"}
                      {item && isMat && (item as MaterialItem).qty > 1 && (
                        <span style={{ position: "absolute", bottom: 1, right: 3, fontSize: 11, color: "var(--gold)", lineHeight: 1 }}>
                          {(item as MaterialItem).qty}
                        </span>
                      )}
                      {item && isGear && (
                        <span style={{ position: "absolute", bottom: 1, left: 2, fontSize: 8, color: RARITY_COLORS[(item as GearItem).rarity], lineHeight: 1, fontFamily: "'Press Start 2P', monospace" }}>
                          {(item as GearItem).rarity.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: "#555", fontFamily: "'VT323', monospace" }}>
                Gear: tap in Gear tab to equip. Materials: auto-sorted to Mats tab at base.
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
                      title={item ? `${item.name}` : "Empty"}
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
                      {item ? (
                        <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: 16 }}>{item.emoji}</span>
                          {!state.isInDungeon && !state.isReturning && (
                            <button
                              onClick={(e) => { e.stopPropagation(); actions.salvageGear(item.id); }}
                              title="Salvage"
                              style={{
                                position: "absolute",
                                bottom: 1,
                                right: 1,
                                fontSize: 8,
                                background: "rgba(0,0,0,0.8)",
                                border: "none",
                                color: "#ff6644",
                                cursor: "pointer",
                                padding: "1px 2px",
                                lineHeight: 1,
                              }}
                            >
                              🔨
                            </button>
                          )}
                        </div>
                      ) : ""}
                    </div>
                  );
                })}
              </div>
              {!state.isInDungeon && !state.isReturning && state.stash.length > 0 && (
                <div style={{ marginTop: 6, fontSize: 11, color: "#555", fontFamily: "'VT323', monospace" }}>
                  🔨 = salvage for materials
                </div>
              )}
            </div>
          )}

          {/* GEAR TAB */}
          {activeTab === "gear" && (
            <GearTab state={state} actions={actions} />
          )}

          {/* MATERIALS TAB */}
          {activeTab === "materials" && (
            <MaterialsTab state={state} />
          )}

          {/* CRAFT TAB */}
          {activeTab === "craft" && (
            <CraftTab state={state} actions={actions} />
          )}

          {/* ENHANCE TAB */}
          {activeTab === "enhance" && (
            <EnhanceTab state={state} actions={actions} />
          )}

          {/* SHOP TAB */}
          {activeTab === "shop" && (
            <ShopTab state={state} actions={actions} />
          )}

          {/* QUESTS TAB */}
          {activeTab === "quests" && (
            <QuestsTab state={state} actions={actions} />
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
