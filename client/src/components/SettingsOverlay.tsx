// ============================================================
// Stride Born — Settings Overlay
// Design: Neo-Retro Pixel RPG — slides up from bottom as a panel
// Sections: Account, Combat Record, Game (Nerd Mode toggle)
// Nerd Mode: shows stat min/max ranges on gear, book drop % in Combat Record
// ============================================================

import { useState } from "react";
import { useProfile } from "@/contexts/ProfileContext";
import type { GameState } from "@/hooks/useGameState";

const NERD_MODE_KEY = "strideborn_nerd_mode";
const LEAVE_ALONE_KEY = "strideborn_leave_alone";

export function loadLeaveAloneMode(): boolean {
  return localStorage.getItem(LEAVE_ALONE_KEY) === "true";
}

function saveLeaveAloneMode(v: boolean) {
  localStorage.setItem(LEAVE_ALONE_KEY, v ? "true" : "false");
}

export function loadNerdMode(): boolean {
  return localStorage.getItem(NERD_MODE_KEY) === "true";
}

function saveNerdMode(v: boolean) {
  localStorage.setItem(NERD_MODE_KEY, v ? "true" : "false");
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toString();
}

interface SettingsOverlayProps {
  onClose: () => void;
  onSaveNow: () => void;
  state?: GameState;
  nerdMode: boolean;
  onNerdModeChange: (v: boolean) => void;
  leaveAloneMode: boolean;
  onLeaveAloneModeChange: (v: boolean) => void;
}

export default function SettingsOverlay({ onClose, onSaveNow, state, nerdMode, onNerdModeChange, leaveAloneMode, onLeaveAloneModeChange }: SettingsOverlayProps) {
  const { activeProfile, setSwitchingProfile } = useProfile();

  function handleSignOut() {
    onSaveNow();
    setSwitchingProfile(true);
    onClose();
  }

  function toggleNerdMode() {
    const next = !nerdMode;
    saveNerdMode(next);
    onNerdModeChange(next);
  }

  function toggleLeaveAloneMode() {
    const next = !leaveAloneMode;
    saveLeaveAloneMode(next);
    onLeaveAloneModeChange(next);
  }

  // Book drop % = 2% base + 1% per consecutive miss
  const bookDropPct = state ? (2 + (state.bookDropPity ?? 0)) : null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          zIndex: 200,
          animation: "fadeIn 0.2s ease",
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 480,
          maxHeight: "88vh",
          overflowY: "auto",
          background: "var(--bg-panel)",
          border: "2px solid var(--game-border)",
          borderBottom: "none",
          zIndex: 201,
          paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
          animation: "slideUp 0.25s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px 10px",
          borderBottom: "2px solid var(--game-border)",
        }}>
          <div className="pixel-font" style={{ fontSize: 10, color: "var(--gold)", letterSpacing: 2 }}>
            ⚙ SETTINGS
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "2px solid var(--game-border)",
              color: "var(--game-muted)",
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 8,
              padding: "4px 8px",
              cursor: "pointer",
            }}
          >
            ✕ CLOSE
          </button>
        </div>

        {/* ACCOUNT SECTION */}
        <div style={{ padding: "14px 16px" }}>
          <div className="pixel-font" style={{
            fontSize: 8,
            color: "var(--gem)",
            letterSpacing: 2,
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            ACCOUNT
            <span style={{ flex: 1, height: 1, background: "var(--game-border)", display: "block" }} />
          </div>

          {/* Current profile card */}
          <div style={{
            background: "#0a0a1a",
            border: "2px solid var(--game-border)",
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 12,
          }}>
            <div style={{ fontSize: 32, flexShrink: 0 }}>{activeProfile?.avatar}</div>
            <div style={{ flex: 1 }}>
              <div className="pixel-font" style={{ fontSize: 10, color: "var(--gold)", marginBottom: 3 }}>
                {activeProfile?.name}
              </div>
              <div style={{ fontSize: 13, color: "var(--game-muted)" }}>
                Floor {activeProfile?.deepestFloor ?? 0} · {activeProfile?.runs ?? 0} runs
              </div>
              <div style={{ fontSize: 12, color: "var(--green)", marginTop: 2 }}>
                ● Active profile
              </div>
            </div>
          </div>

          {/* Sign out button */}
          <button
            onClick={handleSignOut}
            style={{
              width: "100%",
              background: "none",
              border: "2px solid var(--health)",
              color: "var(--health)",
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 9,
              padding: "12px 16px",
              cursor: "pointer",
              letterSpacing: 1,
              textAlign: "center",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,68,68,0.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            ⇠ SIGN OUT / SWITCH ACCOUNT
          </button>

          <div style={{
            fontSize: 12,
            color: "var(--game-muted)",
            textAlign: "center",
            marginTop: 8,
          }}>
            Returns to profile select screen.<br />Your progress is auto-saved.
          </div>
        </div>

        {/* DIVIDER */}
        <div style={{ height: 1, background: "var(--game-border)", margin: "0 16px" }} />

        {/* COMBAT RECORD */}
        {state && (
          <div style={{ padding: "14px 16px" }}>
            <div className="pixel-font" style={{
              fontSize: 8,
              color: "var(--gem)",
              letterSpacing: 2,
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              COMBAT RECORD
              <span style={{ flex: 1, height: 1, background: "var(--game-border)", display: "block" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { emoji: "⚔️", label: "Deepest Floor", value: fmtNum(state.deepestFloor) },
                { emoji: "🗡️", label: "Total Runs", value: fmtNum(state.runs) },
                { emoji: "👣", label: "Total Steps", value: fmtNum(state.totalSteps) },
                { emoji: "💀", label: "Lives Remaining", value: fmtNum(state.lives) },
                { emoji: "💰", label: "Gold on Hand", value: fmtNum(state.gold) },
                { emoji: "📦", label: "Stash Items", value: `${fmtNum(state.stash.length)} (∞)` },
              ].map((row) => (
                <div key={row.label} style={{
                  background: "#0a0a1a",
                  border: "1px solid var(--game-border)",
                  padding: "8px 10px",
                  borderRadius: 3,
                }}>
                  <div className="pixel-font" style={{ fontSize: 11, color: "var(--gold)", marginBottom: 2 }}>
                    {row.emoji} {row.value}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--game-muted)" }}>{row.label}</div>
                </div>
              ))}
            </div>

            {/* Nerd Mode: book drop % */}
            {nerdMode && bookDropPct !== null && (
              <div style={{
                marginTop: 10,
                background: "#0a0a1a",
                border: "1px solid #2a3a2a",
                padding: "8px 10px",
                borderRadius: 3,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}>
                <span style={{ fontSize: 18 }}>📖</span>
                <div style={{ flex: 1 }}>
                  <div className="pixel-font" style={{ fontSize: 9, color: "#66ff88", marginBottom: 2 }}>
                    {bookDropPct}% book drop
                  </div>
                  <div style={{ fontSize: 12, color: "var(--game-muted)" }}>
                    Next mini boss · {state.bookDropPity} miss{state.bookDropPity !== 1 ? "es" : ""} since last drop
                  </div>
                </div>
                <div style={{ fontFamily: "'VT323', monospace", fontSize: 12, color: "#444", textAlign: "right" }}>
                  base 2%<br />+1%/miss
                </div>
              </div>
            )}
          </div>
        )}

        {/* DIVIDER */}
        <div style={{ height: 1, background: "var(--game-border)", margin: "0 16px" }} />

        {/* GAME SECTION */}
        <div style={{ padding: "14px 16px" }}>
          <div className="pixel-font" style={{
            fontSize: 8,
            color: "var(--gem)",
            letterSpacing: 2,
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            GAME
            <span style={{ flex: 1, height: 1, background: "var(--game-border)", display: "block" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Leave Me Alone Mode — suppress all popups for AFK */}
            <div
              onClick={toggleLeaveAloneMode}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                cursor: "pointer",
                background: leaveAloneMode ? "rgba(255,170,0,0.06)" : "transparent",
                border: `1px solid ${leaveAloneMode ? "rgba(255,170,0,0.35)" : "rgba(58,58,106,0.3)"}`,
                borderRadius: 4,
                transition: "background 0.15s",
                marginBottom: 4,
              }}
            >
              <div>
                <span style={{ fontSize: 15, color: "var(--game-text)" }}>🤫 Leave Me Alone Mode</span>
                <div style={{ fontSize: 12, color: "var(--game-muted)", marginTop: 2 }}>
                  Skips vendors, anvils, bosses · full AFK
                </div>
              </div>
              <span className="pixel-font" style={{
                fontSize: 8,
                color: leaveAloneMode ? "#ffaa00" : "var(--game-muted)",
                border: `1px solid ${leaveAloneMode ? "#ffaa00" : "var(--game-border)"}`,
                padding: "3px 6px",
                flexShrink: 0,
                marginLeft: 10,
              }}>
                {leaveAloneMode ? "ON" : "OFF"}
              </span>
            </div>

            {/* Nerd Mode — functional toggle */}
            <div
              onClick={toggleNerdMode}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                borderBottom: "1px solid rgba(58,58,106,0.3)",
                cursor: "pointer",
                background: nerdMode ? "rgba(102,255,136,0.04)" : "transparent",
                border: `1px solid ${nerdMode ? "rgba(102,255,136,0.2)" : "rgba(58,58,106,0.3)"}`,
                borderRadius: 4,
                transition: "background 0.15s",
              }}
            >
              <div>
                <span style={{ fontSize: 15, color: "var(--game-text)" }}>🤓 Nerd Mode</span>
                <div style={{ fontSize: 12, color: "var(--game-muted)", marginTop: 2 }}>
                  Shows stat ranges on gear · book drop % in record
                </div>
              </div>
              <span className="pixel-font" style={{
                fontSize: 8,
                color: nerdMode ? "var(--green)" : "var(--game-muted)",
                border: `1px solid ${nerdMode ? "var(--green)" : "var(--game-border)"}`,
                padding: "3px 6px",
                flexShrink: 0,
                marginLeft: 10,
              }}>
                {nerdMode ? "ON" : "OFF"}
              </span>
            </div>

            {/* Placeholder settings */}
            {[
              { label: "Sound Effects", value: "OFF", note: "coming soon" },
              { label: "Animations", value: "ON", note: "" },
              { label: "Notifications", value: "OFF", note: "coming soon" },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: "1px solid rgba(58,58,106,0.3)",
                  opacity: item.note ? 0.5 : 1,
                }}
              >
                <div>
                  <span style={{ fontSize: 15, color: "var(--game-text)" }}>{item.label}</span>
                  {item.note && (
                    <span style={{ fontSize: 12, color: "var(--game-muted)", marginLeft: 8 }}>({item.note})</span>
                  )}
                </div>
                <span className="pixel-font" style={{
                  fontSize: 8,
                  color: item.value === "ON" ? "var(--green)" : "var(--game-muted)",
                  border: `1px solid ${item.value === "ON" ? "var(--green)" : "var(--game-border)"}`,
                  padding: "3px 6px",
                }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Version */}
        <div style={{
          textAlign: "center",
          padding: "0 16px 4px",
          fontSize: 12,
          color: "rgba(100,100,150,0.5)",
          fontFamily: "'Press Start 2P', monospace",
        }}>
          STRIDE BORN v0.1.0
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateX(-50%) translateY(100%); }
          to { transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </>
  );
}
