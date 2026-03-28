// Stride Born — Main Game Page
// Design: Neo-Retro Pixel RPG — dark dungeon terminal, idle walking mechanic
// Tabs: Bag | Stash | Gear | Materials | Craft | Dungeons | Log

import { useState, useMemo } from "react";
import { useGameState, DUNGEONS, RARITY_COLORS } from "@/hooks/useGameState";
import { useProfile } from "@/contexts/ProfileContext";
import DungeonScene from "@/components/DungeonScene";
import SettingsOverlay, { loadNerdMode, loadLeaveAloneMode, loadAutoInvest, saveAutoInvest, loadLeaveAloneAdvanced } from "@/components/SettingsOverlay";
import type { AutoInvestConfig, LeaveAloneAdvancedConfig } from "@/components/SettingsOverlay";
import OfflineSummary from "@/components/OfflineSummary";
import GearTab from "@/components/GearTab";
import MaterialsTab from "@/components/MaterialsTab";
import CraftTab from "@/components/CraftTab";
import type { GearItem, MaterialItem } from "@/hooks/useGameState";
import { MATERIAL_INFO, RARITY_LABELS, TIER_LABELS, TIER_ORDER, statRange } from "@/hooks/useGameState";
import type { GearRarity, GearTier, GearSlot } from "@/hooks/useGameState";
import VendorModal from "@/components/VendorModal";
import AnvilModal from "@/components/AnvilModal";
import FenceModal from "@/components/FenceModal";
import ShopTab from "@/components/ShopTab";
import QuestsTab from "@/components/QuestsTab";
import EnhanceTab from "@/components/EnhanceTab";
import BookshelfTab from "@/components/BookshelfTab";
import MegaBossModal from "@/components/MegaBossModal";
import EnchantingTableModal from "@/components/EnchantingTableModal";
import DifficultyUnlockModal from "@/components/DifficultyUnlockModal";
import { DIFFICULTY_CONFIG } from "@/hooks/useGameState";

type Tab = "bag" | "stash" | "gear" | "materials" | "craft" | "enhance" | "shop" | "bookshelf" | "quests" | "dungeons" | "log";

const TABS: { id: Tab; label: string; baseOnly?: boolean }[] = [
  { id: "bag", label: "BAG" },
  { id: "stash", label: "STASH" },
  { id: "gear", label: "GEAR" },
  { id: "materials", label: "MATS", baseOnly: true },
  { id: "craft", label: "CRAFT", baseOnly: true },
  { id: "enhance", label: "ENHANCE", baseOnly: true },
  { id: "shop", label: "SHOP", baseOnly: true },
  { id: "bookshelf", label: "BOOKS", baseOnly: true },
  { id: "quests", label: "QUESTS" },
  { id: "dungeons", label: "MAP" },
  { id: "log", label: "LOG" },
];

export default function Home() {
  const { activeProfile, updateProfileSave, setSwitchingProfile } = useProfile();
  const [leaveAloneMode, setLeaveAloneMode] = useState<boolean>(() => loadLeaveAloneMode());
  const [leaveAloneAdvanced, setLeaveAloneAdvanced] = useState<LeaveAloneAdvancedConfig>(() => loadLeaveAloneAdvanced());
  const [autoInvest, setAutoInvest] = useState<AutoInvestConfig>(() => loadAutoInvest());
  const [state, actions] = useGameState(activeProfile!, updateProfileSave, leaveAloneMode, autoInvest, leaveAloneAdvanced);
  const [activeTab, setActiveTab] = useState<Tab>("bag");
  const [showSettings, setShowSettings] = useState(false);
  const [nerdMode, setNerdMode] = useState<boolean>(() => loadNerdMode());
  const [bagSortMode, setBagSortMode] = useState<"none"|"rarity"|"tier"|"slot"|"gs">("none");
  const [stashSortMode, setStashSortMode] = useState<"none"|"rarity"|"tier"|"slot"|"gs">("none");
  const [selectedStashId, setSelectedStashId] = useState<string | null>(null);

  const RARITY_ORD: GearRarity[] = ["scrap","common","uncommon","rare","epic","legendary","mythic"];
  const SLOT_ORD: GearSlot[] = ["helmet","chest","pants","gloves","boots","backpack","weapon","ring","amulet"];

  const sortedBag = useMemo(() => {
    if (bagSortMode === "none") return Array.from({ length: state.bagSize }, (_, i) => state.bag[i] ?? null);
    const items = state.bag.filter((b): b is NonNullable<typeof b> => b !== null);
    const nulls = Array.from({ length: state.bagSize - items.length }, () => null);
    const sorted = [...items].sort((a, b) => {
      if (bagSortMode === "rarity") {
        const ai = 'isGear' in a ? RARITY_ORD.indexOf((a as GearItem).rarity) : -1;
        const bi = 'isGear' in b ? RARITY_ORD.indexOf((b as GearItem).rarity) : -1;
        return bi - ai; // highest rarity first
      }
      if (bagSortMode === "tier") {
        const ai = 'isGear' in a ? TIER_ORDER.indexOf((a as GearItem).tier as GearTier) : -1;
        const bi = 'isGear' in b ? TIER_ORDER.indexOf((b as GearItem).tier as GearTier) : -1;
        return bi - ai; // highest tier first
      }
      if (bagSortMode === "slot") {
        const ai = 'isGear' in a ? SLOT_ORD.indexOf((a as GearItem).slot as GearSlot) : 99;
        const bi = 'isGear' in b ? SLOT_ORD.indexOf((b as GearItem).slot as GearSlot) : 99;
        return ai - bi;
      }
      if (bagSortMode === "gs") {
        const ai = 'isGear' in a ? ((a as GearItem).gearScore ?? -1) : -2;
        const bi = 'isGear' in b ? ((b as GearItem).gearScore ?? -1) : -2;
        return bi - ai; // highest GS first
      }
      return 0;
    });
    return [...sorted, ...nulls];
  }, [state.bag, state.bagSize, bagSortMode]);

  const sortedStash = useMemo(() => {
    if (stashSortMode === "none") return [...state.stash];
    return [...state.stash].sort((a, b) => {
      if (stashSortMode === "rarity") {
        return RARITY_ORD.indexOf(b.rarity) - RARITY_ORD.indexOf(a.rarity);
      }
      if (stashSortMode === "tier") {
        return TIER_ORDER.indexOf(b.tier as GearTier) - TIER_ORDER.indexOf(a.tier as GearTier);
      }
      if (stashSortMode === "slot") {
        return SLOT_ORD.indexOf(a.slot as GearSlot) - SLOT_ORD.indexOf(b.slot as GearSlot);
      }
      if (stashSortMode === "gs") {
        return (b.gearScore ?? -1) - (a.gearScore ?? -1);
      }
      return 0;
    });
  }, [state.stash, stashSortMode]);

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
        {showSettings && <SettingsOverlay onClose={() => setShowSettings(false)} onSaveNow={actions.saveNow} state={state} nerdMode={nerdMode} onNerdModeChange={setNerdMode} leaveAloneMode={leaveAloneMode} onLeaveAloneModeChange={setLeaveAloneMode} leaveAloneAdvanced={leaveAloneAdvanced} onLeaveAloneAdvancedChange={setLeaveAloneAdvanced} autoInvest={autoInvest} onAutoInvestChange={(cfg) => { setAutoInvest(cfg); saveAutoInvest(cfg); }} />}

        {/* Vendor Modal — auto-pauses walking */}
        <VendorModal state={state} actions={actions} />
        {state.activeAnvil && <AnvilModal state={state} actions={actions} />}
        {state.activeFence && <FenceModal state={state} actions={actions} />}
        {state.activeMegaBoss && <MegaBossModal state={state} actions={actions} />}
        {state.activeEnchantingTable && <EnchantingTableModal state={state} actions={actions} />}
        {state.pendingDifficultyUnlock && (() => {
          const { dungeonId, nextDifficulty } = state.pendingDifficultyUnlock;
          const dungeon = DUNGEONS.find(d => d.id === dungeonId);
          const currentDiff = (state.dungeonDifficulties[dungeonId] as import('@/hooks/useGameState').DungeonDifficulty | undefined) ?? 'easy';
          return (
            <DifficultyUnlockModal
              dungeonName={dungeon?.name ?? dungeonId}
              currentDifficulty={currentDiff}
              nextDifficulty={nextDifficulty}
              onAdvance={actions.advanceDifficulty}
              onStay={actions.dismissDifficultyUnlock}
            />
          );
        })()}

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

          {/* Portal return button — shown at base when portal has been used to base but return not yet taken */}
          {state.portal && state.portal.usedToBase && !state.portal.usedReturn && !isActive && (
            <button
              onClick={actions.usePortalReturn}
              style={{
                width: "100%",
                background: "rgba(0,255,200,0.06)",
                border: "2px solid #00ffcc",
                color: "#00ffcc",
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 8,
                padding: "10px",
                cursor: "pointer",
                letterSpacing: 1,
                marginBottom: 6,
              }}
            >
              🌀 PORTAL RETURN — FLOOR {state.portal.floor}
            </button>
          )}
          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            {!isActive ? (
              <>
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
              <button
                onClick={actions.openBaseAnvil}
                style={{
                  flex: 1,
                  background: "none",
                  border: "2px solid #ff8844",
                  color: "#ff8844",
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: 7,
                  padding: "8px 4px",
                  cursor: "pointer",
                  letterSpacing: 0.5,
                }}
              >
                ⚔️ ANVIL
              </button>
              </>
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

            {/* Portal to base button — only when portal is active and not yet used */}
            {state.portal && !state.portal.usedToBase && state.isInDungeon && !state.isReturning && (
              <button
                onClick={actions.usePortalToBase}
                style={{
                  flex: 1,
                  background: "rgba(0,255,200,0.06)",
                  border: "2px solid #00ffcc",
                  color: "#00ffcc",
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: 7,
                  padding: "8px 4px",
                  cursor: "pointer",
                  letterSpacing: 0.5,
                  animation: "pulse 1.5s infinite",
                }}
              >
                🌀 PORTAL
              </button>
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
              <div style={{ fontSize: 13, color: "var(--game-muted)", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>BAG ({bagUsed}/{state.bagSize} slots used)</span>
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  <span style={{ fontSize: 12 }}>tap item to drop</span>
                  <button
                    onClick={() => setBagSortMode((m) => m === "none" ? "rarity" : m === "rarity" ? "tier" : m === "tier" ? "slot" : m === "slot" ? "gs" : "none")}
                    title="Cycle sort: none → rarity → tier → slot → GS"
                    style={{ fontSize: 9, padding: "2px 6px", background: bagSortMode !== "none" ? "var(--gold)" : "#1a1a2e", color: bagSortMode !== "none" ? "#000" : "var(--game-muted)", border: "1px solid var(--game-border)", cursor: "pointer", fontFamily: "'Press Start 2P', monospace", letterSpacing: 0.5 }}
                  >
                    {bagSortMode === "none" ? "SORT" : bagSortMode === "rarity" ? "▼ RARITY" : bagSortMode === "tier" ? "▼ TIER" : bagSortMode === "slot" ? "▼ SLOT" : "▼ GS"}
                  </button>
                </div>
              </div>
              <div style={{ overflowY: "auto", maxHeight: "calc(5 * ((min(480px, 100vw) - 56px) / 5) + 4 * 4px)", scrollbarWidth: "thin", scrollbarColor: "var(--game-border) transparent" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4 }}>
                {sortedBag.map((item, i) => {
                  const origIdx = bagSortMode === "none" ? i : state.bag.indexOf(item as any);
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
                      onClick={() => item && actions.dropBagItem(bagSortMode === "none" ? i : origIdx)}
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
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: "#555", fontFamily: "'VT323', monospace" }}>
                Gear: tap in Gear tab to equip. Materials: auto-sorted to Mats tab at base.
              </div>
            </div>
          )}

          {/* STASH TAB */}
          {activeTab === "stash" && (() => {
            const selectedStash = selectedStashId ? state.stash.find(g => g.id === selectedStashId) ?? null : null;
            const range = selectedStash ? statRange(selectedStash.tier as GearTier, selectedStash.rarity, selectedStash.gearScore) : null;
            const equippedInSlot = selectedStash ? state.equippedGear[selectedStash.slot] : null;
            return (
            <div>
              {/* Header row: count + sort button */}
              <div style={{ fontSize: 13, color: "var(--game-muted)", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>STASH ({state.stash.length} item{state.stash.length !== 1 ? 's' : ''} · unlimited)</span>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ color: "var(--green)", fontSize: 12 }}>
                    {state.currentFloor === 0 ? "✓ AT BASE" : "return to access"}
                  </span>
                  <button
                    onClick={() => setStashSortMode(m => m === "none" ? "rarity" : m === "rarity" ? "tier" : m === "tier" ? "slot" : m === "slot" ? "gs" : "none")}
                    style={{ fontSize: 9, padding: "2px 6px", background: stashSortMode !== "none" ? "var(--gold)" : "#1a1a2e", color: stashSortMode !== "none" ? "#000" : "var(--game-muted)", border: "1px solid var(--game-border)", cursor: "pointer", fontFamily: "'Press Start 2P', monospace", letterSpacing: 0.5 }}
                  >
                    {stashSortMode === "none" ? "SORT" : stashSortMode === "rarity" ? "▼ RARITY" : stashSortMode === "tier" ? "▼ TIER" : stashSortMode === "slot" ? "▼ SLOT" : "▼ GS"}
                  </button>
                </div>
              </div>

              {/* Stash grid */}
              <div style={{ overflowY: "auto", maxHeight: "calc(5 * ((min(480px, 100vw) - 56px) / 6) + 4 * 3px)", scrollbarWidth: "thin", scrollbarColor: "var(--game-border) transparent" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 3 }}>
                  {sortedStash.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedStashId(prev => prev === item.id ? null : item.id)}
                      style={{
                        background: selectedStashId === item.id ? `${RARITY_COLORS[item.rarity]}22` : "#080810",
                        border: `${selectedStashId === item.id ? 2 : 1}px solid ${RARITY_COLORS[item.rarity] ?? "#2a2a4a"}`,
                        aspectRatio: "1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 16,
                        position: "relative",
                        cursor: "pointer",
                      }}
                    >
                      <span style={{ fontSize: 16 }}>{item.emoji}</span>
                      {item.gearScore !== undefined && item.gearScore > 0 && (
                        <span style={{ position: "absolute", top: 1, left: 2, fontSize: 7, color: "#ffd700", lineHeight: 1, fontFamily: "'Press Start 2P', monospace" }}>{item.gearScore}</span>
                      )}
                    </div>
                  ))}
                  {state.stash.length === 0 && (
                    <div style={{ gridColumn: "1 / -1", fontFamily: "'VT323', monospace", fontSize: 14, color: "#444", textAlign: "center", padding: "16px 0" }}>
                      Stash is empty
                    </div>
                  )}
                </div>
              </div>

              {/* Detail panel */}
              {selectedStash && (
                <div style={{ marginTop: 8, background: "#0a0a1a", border: `2px solid ${RARITY_COLORS[selectedStash.rarity] ?? "var(--game-border)"}`, padding: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div>
                      <div className="pixel-font" style={{ fontSize: 8, color: RARITY_COLORS[selectedStash.rarity], marginBottom: 2 }}>
                        {selectedStash.emoji} {selectedStash.name}
                        {selectedStash.gearScore !== undefined && selectedStash.gearScore > 0 && (
                          <span style={{ color: "#ffd700", marginLeft: 6 }}>[{selectedStash.gearScore}]</span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--game-muted)" }}>
                        {TIER_LABELS[selectedStash.tier as GearTier] ?? selectedStash.tier} · {RARITY_LABELS[selectedStash.rarity]} · {selectedStash.slot}
                        {selectedStash.enhancementXp > 0 && (
                          <span style={{ color: "#88aaff", marginLeft: 6 }}>XP:{selectedStash.enhancementXp}</span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => setSelectedStashId(null)} style={{ background: "none", border: "none", color: "var(--game-muted)", cursor: "pointer", fontSize: 14 }}>✕</button>
                  </div>

                  {/* Stats */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 8 }}>
                    {selectedStash.stats.map((stat, i) => {
                      const r = range ? statRange(selectedStash.tier as GearTier, selectedStash.rarity, selectedStash.gearScore) : null;
                      const pct = r ? Math.round(((stat.value - r.min) / Math.max(1, r.max - r.min)) * 100) : null;
                      const barColor = pct === null ? "#555" : pct >= 80 ? "#44ff88" : pct >= 50 ? "#ffcc44" : "#ff4444";
                      const isPercent = stat.stat.includes("Chance") || stat.stat.includes("Find") || stat.stat.includes("Efficiency") || stat.stat.includes("Speed") || stat.stat.includes("Yield") || stat.stat.includes("Rarity") || stat.stat.includes("Rate") || stat.stat.includes("Luck") || stat.stat.includes("Penetration") || stat.stat.includes("Lifesteal") || stat.stat.includes("Reduction") || stat.stat.includes("Overflow") || stat.stat.includes("Preservation") || stat.stat.includes("Insurance");
                      return (
                        <div key={i}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                            <span style={{ color: "var(--game-muted)" }}>{stat.stat}</span>
                            <span style={{ color: "#ccc" }}>
                              {stat.value.toFixed(1)}{isPercent ? "%" : ""}
                              {nerdMode && r && (
                                <span style={{ color: "#555", fontSize: 10, marginLeft: 4 }}>({r.min.toFixed(1)}–{r.max.toFixed(1)})</span>
                              )}
                            </span>
                          </div>
                          {nerdMode && pct !== null && (
                            <div style={{ height: 2, background: "#1a1a2e", marginTop: 1 }}>
                              <div style={{ width: `${pct}%`, height: "100%", background: barColor, transition: "width 0.2s" }} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Currently equipped in that slot */}
                  {equippedInSlot && (
                    <div style={{ fontSize: 11, color: "var(--game-muted)", marginBottom: 6, padding: "4px 6px", background: "#050510", border: "1px solid #2a2a4a" }}>
                      Currently equipped: <span style={{ color: RARITY_COLORS[equippedInSlot.rarity] }}>{equippedInSlot.emoji} {equippedInSlot.name}</span>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: 6 }}>
                    {!state.isInDungeon && !state.isReturning && (
                      <button
                        onClick={() => { actions.equipFromStash(selectedStash.id); setSelectedStashId(null); }}
                        style={{ flex: 2, background: "none", border: "2px solid var(--gold)", color: "var(--gold)", fontFamily: "'Press Start 2P', monospace", fontSize: 8, padding: "6px 4px", cursor: "pointer" }}
                      >
                        ⚔️ EQUIP
                      </button>
                    )}
                    {!state.isInDungeon && !state.isReturning && (
                      <button
                        onClick={() => { actions.salvageGear(selectedStash.id); setSelectedStashId(null); }}
                        style={{ flex: 1, background: "none", border: "2px solid #ff6644", color: "#ff6644", fontFamily: "'Press Start 2P', monospace", fontSize: 8, padding: "6px 4px", cursor: "pointer" }}
                      >
                        🔨 SALVAGE
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
            );
          })()}

          {/* GEAR TAB */}
          {activeTab === "gear" && (
            <GearTab state={state} actions={actions} nerdMode={nerdMode} />
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
          {/* BOOKSHELF TAB */}
          {activeTab === "bookshelf" && (
            <BookshelfTab state={state} actions={actions} />
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
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <div className="pixel-font" style={{ fontSize: 8, color: "var(--gold)" }}>
                        {d.name}{!d.unlocked ? ` 🔒 (floor ${d.unlockFloor})` : ""}
                        {d.id === state.currentDungeon ? " ✓" : ""}
                      </div>
                      {d.unlocked && (() => {
                        const diff = (state.dungeonDifficulties[d.id] as import('@/hooks/useGameState').DungeonDifficulty | undefined) ?? 'easy';
                        const cfg = DIFFICULTY_CONFIG[diff];
                        return (
                          <span style={{ fontSize: 9, fontWeight: 700, color: cfg.color, border: `1px solid ${cfg.color}40`, borderRadius: 4, padding: "1px 5px", background: `${cfg.color}15` }}>
                            {cfg.label.toUpperCase()}
                          </span>
                        );
                      })()}
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
