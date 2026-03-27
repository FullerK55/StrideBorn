// EnhanceTab — base-only Enhancement Table
// Sacrifice gear + materials to gain XP and upgrade a target gear piece's quality tier.
// Rarity is NEVER changed — only quality tier advances.
// Design: retro pixel aesthetic matching the rest of the game

import { useState } from "react";
import type { GameState, GameActions, GearItem, MaterialType } from "@/hooks/useGameState";
import {
  RARITY_COLORS,
  RARITY_LABELS,
  TIER_LABELS,
  TIER_COLORS,
  TIER_ORDER,
  ENHANCE_XP_THRESHOLDS,
  TIER_XP_VALUE,
  RARITY_XP_VALUE,
  MATERIAL_XP_VALUE,
  MATERIAL_INFO,
  GEAR_SLOTS,
} from "@/hooks/useGameState";

interface Props {
  state: GameState;
  actions: GameActions;
}

const MATERIAL_TYPES: MaterialType[] = ["crude", "refined", "tempered", "voidmat", "celestialmat"];

const s = {
  section: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid #333",
    borderRadius: 6,
    padding: "12px 14px",
    marginBottom: 10,
  } as React.CSSProperties,
  sectionTitle: {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 9,
    color: "#ffcc44",
    marginBottom: 8,
    letterSpacing: 1,
  } as React.CSSProperties,
  itemRow: (selected: boolean, color?: string): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "7px 10px",
    background: selected ? "rgba(255,170,0,0.08)" : "rgba(0,0,0,0.4)",
    border: `1px solid ${selected ? (color ?? "#ffaa00") : "#2a2a2a"}`,
    borderRadius: 4,
    marginBottom: 5,
    cursor: "pointer",
    transition: "background 0.1s, border-color 0.1s",
  }),
  btn: (enabled: boolean, color = "#ffaa00"): React.CSSProperties => ({
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 8,
    padding: "8px 14px",
    background: enabled ? "#0d0800" : "#1a1a1a",
    color: enabled ? color : "#555",
    border: `1px solid ${enabled ? color : "#444"}`,
    borderRadius: 4,
    cursor: enabled ? "pointer" : "not-allowed",
    transition: "background 0.15s",
  }),
  muted: {
    fontFamily: "'VT323', monospace",
    fontSize: 14,
    color: "#888",
  } as React.CSSProperties,
};

function calcGearXp(gear: GearItem): number {
  return TIER_XP_VALUE[gear.tier] * RARITY_XP_VALUE[gear.rarity] * 10;
}

function calcMatXp(type: MaterialType, qty: number): number {
  return MATERIAL_XP_VALUE[type] * qty;
}

export default function EnhanceTab({ state, actions }: Props) {
  const isAtBase = !state.isInDungeon && !state.isReturning;

  // Step 1: pick target gear
  const [targetId, setTargetId] = useState<string | null>(null);
  // Step 2: pick sacrifices
  const [sacrificeIds, setSacrificeIds] = useState<Set<string>>(new Set());
  const [matQty, setMatQty] = useState<Partial<Record<MaterialType, number>>>({});
  const [confirmPending, setConfirmPending] = useState(false);

  // Target can be in stash OR equipped
  const equippedList: GearItem[] = GEAR_SLOTS
    .map((sl) => state.equippedGear[sl.id])
    .filter((g): g is GearItem => g !== null);

  const target = targetId
    ? (state.stash.find((g) => g.id === targetId) ?? equippedList.find((g) => g.id === targetId) ?? null)
    : null;

  // Stash items eligible as sacrifice (not the target itself, same slot as target)
  const sacrificeCandidates = target
    ? state.stash.filter((g) => g.id !== targetId && g.slot === target.slot)
    : state.stash.filter((g) => g.id !== targetId);

  // XP preview
  const xpFromGear = Array.from(sacrificeIds).reduce((sum, id) => {
    const g = state.stash.find((x) => x.id === id);
    return sum + (g ? calcGearXp(g) : 0);
  }, 0);
  const xpFromMats = MATERIAL_TYPES.reduce((sum, t) => {
    const qty = matQty[t] ?? 0;
    return sum + calcMatXp(t, qty);
  }, 0);
  const totalXpPreview = xpFromGear + xpFromMats;

  // Current XP and threshold
  const currentXp = target ? target.enhancementXp : 0;
  const threshold = target ? (ENHANCE_XP_THRESHOLDS[target.tier] ?? null) : null;
  const tierIdx = target ? TIER_ORDER.indexOf(target.tier) : -1;
  const isMaxTier = target ? ENHANCE_XP_THRESHOLDS[target.tier] === undefined : false;
  const nextTier = !isMaxTier && tierIdx >= 0 ? TIER_ORDER[tierIdx + 1] : null;

  // Progress bar
  const progressPct = threshold ? Math.min(100, ((currentXp + totalXpPreview) / threshold) * 100) : 100;
  const currentPct = threshold ? Math.min(100, (currentXp / threshold) * 100) : 100;

  function toggleSacrifice(id: string) {
    setSacrificeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function setMat(type: MaterialType, raw: string) {
    const val = Math.max(0, Math.min(state.materials[type] ?? 0, parseInt(raw) || 0));
    setMatQty((prev) => ({ ...prev, [type]: val }));
  }

  function handleReset() {
    setTargetId(null);
    setSacrificeIds(new Set());
    setMatQty({});
    setConfirmPending(false);
  }

  function handleEnhance() {
    if (!targetId) return;
    if (confirmPending) {
      actions.enhanceGear(targetId, Array.from(sacrificeIds), matQty);
      setSacrificeIds(new Set());
      setMatQty({});
      setConfirmPending(false);
    } else {
      setConfirmPending(true);
      setTimeout(() => setConfirmPending(false), 4000);
    }
  }

  if (!isAtBase) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>⚗️</div>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#ff4444" }}>
          RETURN TO BASE
        </div>
        <div style={{ fontFamily: "'VT323', monospace", fontSize: 15, color: "#666", marginTop: 6 }}>
          Enhancement Table is only available at base
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "10px 4px" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: "#aa88ff" }}>
          ⚗️ ENHANCEMENT TABLE
        </div>
        <div style={{ fontFamily: "'VT323', monospace", fontSize: 14, color: "#666", marginTop: 4 }}>
          Sacrifice gear &amp; materials to upgrade quality tier
        </div>
      </div>

      {/* STEP 1 — Select Target */}
      <div style={s.section}>
        <div style={s.sectionTitle}>
          {target ? "✓ TARGET SELECTED" : "① SELECT TARGET GEAR"}
        </div>

        {target ? (
          /* Target summary card */
          <div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 10px",
              background: "rgba(170,136,255,0.08)",
              border: `1px solid ${TIER_COLORS[target.tier]}`,
              borderRadius: 4,
              marginBottom: 8,
            }}>
              <span style={{ fontSize: 24 }}>{target.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'VT323', monospace", fontSize: 16, color: RARITY_COLORS[target.rarity], overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {target.name}
                </div>
                <div style={{ fontFamily: "'VT323', monospace", fontSize: 13, color: "#888" }}>
                  {RARITY_LABELS[target.rarity]} · <span style={{ color: TIER_COLORS[target.tier] }}>{TIER_LABELS[target.tier]}</span>
                  {nextTier && (
                    <span style={{ color: "#555" }}> → <span style={{ color: TIER_COLORS[nextTier] }}>{TIER_LABELS[nextTier]}</span></span>
                  )}
                  {isMaxTier && <span style={{ color: "#ffcc44" }}> ✦ MAX TIER</span>}
                </div>
              </div>
              <button
                onClick={handleReset}
                style={{ fontFamily: "'VT323', monospace", fontSize: 13, background: "none", border: "1px solid #444", color: "#888", padding: "3px 7px", cursor: "pointer", borderRadius: 3 }}
              >
                ✕
              </button>
            </div>

            {/* XP Progress Bar */}
            {!isMaxTier && threshold !== null && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'VT323', monospace", fontSize: 13, color: "#888", marginBottom: 4 }}>
                  <span>Enhancement XP</span>
                  <span style={{ color: "#aa88ff" }}>
                    {currentXp + totalXpPreview} / {threshold}
                    {totalXpPreview > 0 && <span style={{ color: "#66ff88" }}> (+{totalXpPreview})</span>}
                  </span>
                </div>
                <div style={{ height: 10, background: "#111", border: "1px solid #333", borderRadius: 3, overflow: "hidden", position: "relative" }}>
                  {/* Current XP (solid) */}
                  <div style={{
                    position: "absolute",
                    left: 0, top: 0, bottom: 0,
                    width: `${currentPct}%`,
                    background: "linear-gradient(90deg, #5533aa, #8855ff)",
                    transition: "width 0.3s",
                  }} />
                  {/* Preview XP (dashed overlay) */}
                  {totalXpPreview > 0 && (
                    <div style={{
                      position: "absolute",
                      left: `${currentPct}%`,
                      top: 0, bottom: 0,
                      width: `${Math.min(progressPct - currentPct, 100 - currentPct)}%`,
                      background: "repeating-linear-gradient(90deg, #66ff88 0px, #66ff88 4px, transparent 4px, transparent 8px)",
                      opacity: 0.7,
                    }} />
                  )}
                </div>
                {progressPct >= 100 && (
                  <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#ffcc44", marginTop: 4, textAlign: "center" }}>
                    ✦ READY TO TIER UP!
                  </div>
                )}
              </div>
            )}

            {isMaxTier && (
              <div style={{ fontFamily: "'VT323', monospace", fontSize: 14, color: "#ffcc44", textAlign: "center", padding: "6px 0" }}>
                ✦ This item is already at maximum tier (Eternal)
              </div>
            )}
          </div>
        ) : (
          /* Target picker list — equipped first, then stash */
          <div style={{ maxHeight: 220, overflowY: "auto" }}>
            {/* EQUIPPED section */}
            {equippedList.length > 0 && (
              <>
                <div style={{ fontFamily: "'VT323', monospace", fontSize: 12, color: "#00ffcc", marginBottom: 4, letterSpacing: 1 }}>⚔ EQUIPPED</div>
                {equippedList.map((gear) => (
                  <div
                    key={gear.id}
                    onClick={() => { setTargetId(gear.id); setSacrificeIds(new Set()); setMatQty({}); }}
                    style={{ ...s.itemRow(false, RARITY_COLORS[gear.rarity]), borderColor: "#00ffcc44" }}
                  >
                    <span style={{ fontSize: 20 }}>{gear.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'VT323', monospace", fontSize: 14, color: RARITY_COLORS[gear.rarity], overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {gear.name}
                      </div>
                      <div style={{ fontFamily: "'VT323', monospace", fontSize: 12, color: "#666" }}>
                        {RARITY_LABELS[gear.rarity]} · <span style={{ color: TIER_COLORS[gear.tier] }}>{TIER_LABELS[gear.tier]}</span>
                        {ENHANCE_XP_THRESHOLDS[gear.tier] === undefined && <span style={{ color: "#ffcc44" }}> ✦ MAX</span>}
                      </div>
                    </div>
                    <div style={{ fontFamily: "'VT323', monospace", fontSize: 12, color: "#555", textAlign: "right" }}>
                      {gear.enhancementXp > 0 && <div style={{ color: "#aa88ff" }}>{gear.enhancementXp} XP</div>}
                      <div style={{ fontSize: 11, color: "#00ffcc" }}>equipped</div>
                    </div>
                  </div>
                ))}
                {state.stash.length > 0 && (
                  <div style={{ fontFamily: "'VT323', monospace", fontSize: 12, color: "#555", margin: "6px 0 4px", letterSpacing: 1 }}>📦 STASH</div>
                )}
              </>
            )}
            {/* STASH section */}
            {state.stash.length === 0 && equippedList.length === 0 ? (
              <div style={s.muted}>No gear available</div>
            ) : (
              <>{state.stash.map((gear) => (
                <div
                  key={gear.id}
                  onClick={() => { setTargetId(gear.id); setSacrificeIds(new Set()); setMatQty({}); }}
                  style={s.itemRow(false, RARITY_COLORS[gear.rarity])}
                >
                  <span style={{ fontSize: 20 }}>{gear.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'VT323', monospace", fontSize: 14, color: RARITY_COLORS[gear.rarity], overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {gear.name}
                    </div>
                    <div style={{ fontFamily: "'VT323', monospace", fontSize: 12, color: "#666" }}>
                      {RARITY_LABELS[gear.rarity]} · <span style={{ color: TIER_COLORS[gear.tier] }}>{TIER_LABELS[gear.tier]}</span>
                      {ENHANCE_XP_THRESHOLDS[gear.tier] === undefined && <span style={{ color: "#ffcc44" }}> ✦ MAX</span>}
                    </div>
                  </div>
                  <div style={{ fontFamily: "'VT323', monospace", fontSize: 12, color: "#555", textAlign: "right" }}>
                    {gear.enhancementXp > 0 && <div style={{ color: "#aa88ff" }}>{gear.enhancementXp} XP</div>}
                  </div>
                </div>
              ))}</>)
            }
          </div>
        )}
      </div>

      {/* STEP 2 — Select Sacrifices (only shown once target is selected) */}
      {target && !isMaxTier && (
        <>
          {/* Sacrifice Gear */}
          <div style={s.section}>
            <div style={s.sectionTitle}>② SACRIFICE GEAR</div>
            <div style={{ ...s.muted, marginBottom: 8 }}>
              Select gear to destroy for enhancement XP. Higher tier &amp; rarity = more XP.
            </div>
            {sacrificeCandidates.length === 0 ? (
              <div style={s.muted}>No other gear in stash</div>
            ) : (
              <div style={{ maxHeight: 200, overflowY: "auto" }}>
                {sacrificeCandidates.map((gear) => {
                  const xp = calcGearXp(gear);
                  const selected = sacrificeIds.has(gear.id);
                  return (
                    <div
                      key={gear.id}
                      onClick={() => toggleSacrifice(gear.id)}
                      style={s.itemRow(selected, RARITY_COLORS[gear.rarity])}
                    >
                      <span style={{ fontSize: 18 }}>{gear.emoji}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'VT323', monospace", fontSize: 14, color: RARITY_COLORS[gear.rarity], overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {gear.name}
                        </div>
                        <div style={{ fontFamily: "'VT323', monospace", fontSize: 12, color: "#666" }}>
                          {RARITY_LABELS[gear.rarity]} · {TIER_LABELS[gear.tier]}
                        </div>
                      </div>
                      <div style={{ fontFamily: "'VT323', monospace", fontSize: 13, color: selected ? "#66ff88" : "#aa88ff", textAlign: "right", flexShrink: 0 }}>
                        +{xp} XP
                        {selected && <div style={{ fontSize: 11, color: "#66ff88" }}>✓ selected</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sacrifice Materials */}
          <div style={s.section}>
            <div style={s.sectionTitle}>③ SACRIFICE MATERIALS</div>
            <div style={{ ...s.muted, marginBottom: 8 }}>
              Enter quantities to sacrifice. Each material grants XP.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {MATERIAL_TYPES.map((type) => {
                const have = state.materials[type] ?? 0;
                const qty = matQty[type] ?? 0;
                const xp = calcMatXp(type, qty);
                const info = MATERIAL_INFO[type];
                return (
                  <div key={type} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{info.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'VT323', monospace", fontSize: 14, color: "#ccc" }}>
                        {info.label}
                      </div>
                      <div style={{ fontFamily: "'VT323', monospace", fontSize: 12, color: "#555" }}>
                        Have: {have} · {MATERIAL_XP_VALUE[type]} XP each
                      </div>
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={have}
                      value={qty || ""}
                      placeholder="0"
                      onChange={(e) => setMat(type, e.target.value)}
                      disabled={have === 0}
                      style={{
                        width: 60,
                        background: "#0a0a1a",
                        border: `1px solid ${qty > 0 ? "#aa88ff" : "#333"}`,
                        color: qty > 0 ? "#aa88ff" : "#666",
                        fontFamily: "'VT323', monospace",
                        fontSize: 14,
                        padding: "4px 6px",
                        borderRadius: 3,
                        textAlign: "center",
                      }}
                    />
                    {qty > 0 && (
                      <div style={{ fontFamily: "'VT323', monospace", fontSize: 13, color: "#66ff88", minWidth: 55, textAlign: "right" }}>
                        +{xp} XP
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary & Confirm */}
          <div style={s.section}>
            <div style={s.sectionTitle}>④ ENHANCE</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'VT323', monospace", fontSize: 14, color: "#aaa", marginBottom: 10 }}>
              <span>XP from gear: <span style={{ color: "#aa88ff" }}>{xpFromGear}</span></span>
              <span>XP from mats: <span style={{ color: "#aa88ff" }}>{xpFromMats}</span></span>
              <span>Total: <span style={{ color: "#66ff88" }}>+{totalXpPreview}</span></span>
            </div>

            {totalXpPreview === 0 && (
              <div style={{ fontFamily: "'VT323', monospace", fontSize: 14, color: "#ff6644", marginBottom: 8 }}>
                Select at least one gear piece or material to sacrifice
              </div>
            )}

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                onClick={handleEnhance}
                disabled={totalXpPreview === 0}
                style={s.btn(totalXpPreview > 0, confirmPending ? "#ff4444" : "#aa88ff")}
              >
                {confirmPending
                  ? "⚠ CONFIRM SACRIFICE?"
                  : `⚗️ ENHANCE (+${totalXpPreview} XP)`}
              </button>
              {confirmPending && (
                <button
                  onClick={() => setConfirmPending(false)}
                  style={{ fontFamily: "'VT323', monospace", fontSize: 13, background: "none", border: "1px solid #444", color: "#888", padding: "6px 10px", cursor: "pointer", borderRadius: 3 }}
                >
                  Cancel
                </button>
              )}
            </div>
            {confirmPending && (
              <div style={{ fontFamily: "'VT323', monospace", fontSize: 13, color: "#ff8844", marginTop: 6 }}>
                ⚠ Sacrificed items will be permanently destroyed!
              </div>
            )}
          </div>
        </>
      )}

      {/* Info panel */}
      <div style={{ ...s.section, opacity: 0.6 }}>
        <div style={s.sectionTitle}>📖 HOW IT WORKS</div>
        <div style={{ fontFamily: "'VT323', monospace", fontSize: 13, color: "#888", lineHeight: 1.6 }}>
          • Select a target gear piece to enhance<br />
          • Sacrifice other gear and/or materials as fuel<br />
          • XP = tier level × rarity level × 10 (gear) or mat tier × qty (mats)<br />
          • When XP threshold is met, the item upgrades one quality tier<br />
          • Rarity is <span style={{ color: "#ffcc44" }}>never</span> changed — only quality tier advances<br />
          • Stats are re-rolled at the new tier level on upgrade
        </div>
      </div>
    </div>
  );
}
