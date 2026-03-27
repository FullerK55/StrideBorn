// ============================================================
// Stride Born — Profile Select Screen
// Design: Neo-Retro Pixel RPG — shown on first launch or when switching profiles
// ============================================================

import { useState } from "react";
import { useProfile, AVATARS, MAX_PROFILES } from "@/contexts/ProfileContext";

export default function ProfileSelect() {
  const { profiles, selectProfile, createNewProfile, deleteProfile } = useProfile();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function handleCreate() {
    if (!newName.trim()) return;
    const profile = createNewProfile(newName, selectedAvatar);
    selectProfile(profile.id);
  }

  function formatDate(ts: number) {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <div
      className="star-bg"
      style={{
        background: "var(--bg-deep)",
        minHeight: "100dvh",
        color: "var(--game-text)",
        fontFamily: "'VT323', monospace",
        fontSize: 18,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "20px 16px",
        paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div style={{ width: "100%", maxWidth: 440 }}>

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            className="animate-title-pulse pixel-font"
            style={{
              fontSize: 20,
              color: "var(--gold)",
              textShadow: "0 0 20px rgba(255,215,0,0.5), 3px 3px 0 #8B6914",
              letterSpacing: 2,
              marginBottom: 6,
            }}
          >
            STRIDE BORN
          </div>
          <div className="pixel-font" style={{ fontSize: 8, color: "var(--game-muted)", letterSpacing: 2 }}>
            SELECT ADVENTURER
          </div>
        </div>

        {/* Profile list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          {profiles.length === 0 && !creating && (
            <div style={{
              border: "2px dashed var(--game-border)",
              padding: 20,
              textAlign: "center",
              color: "var(--game-muted)",
              fontSize: 15,
            }}>
              No adventurers yet.<br />Create your first profile below.
            </div>
          )}

          {profiles.map((p) => (
            <div
              key={p.id}
              style={{
                background: "#0a0a1a",
                border: "2px solid var(--game-border)",
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                position: "relative",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--gold)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--game-border)")}
            >
              {/* Avatar */}
              <div style={{ fontSize: 32, flexShrink: 0 }}>{p.avatar}</div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="pixel-font" style={{ fontSize: 10, color: "var(--gold)", marginBottom: 3 }}>
                  {p.name}
                </div>
                <div style={{ fontSize: 13, color: "var(--game-muted)" }}>
                  Floor {p.deepestFloor} · {p.runs} runs · {p.totalSteps.toLocaleString()} steps
                </div>
                <div style={{ fontSize: 12, color: "var(--gem)", marginTop: 2 }}>
                  Last played: {formatDate(p.lastPlayed)}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
                <button
                  onClick={() => selectProfile(p.id)}
                  className="pixel-font"
                  style={{
                    background: "none",
                    border: "2px solid var(--green)",
                    color: "var(--green)",
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: 7,
                    padding: "6px 10px",
                    cursor: "pointer",
                    letterSpacing: 1,
                  }}
                >
                  ▶ PLAY
                </button>
                {confirmDelete === p.id ? (
                  <div style={{ display: "flex", gap: 3 }}>
                    <button
                      onClick={() => { deleteProfile(p.id); setConfirmDelete(null); }}
                      className="pixel-font"
                      style={{
                        background: "none",
                        border: "2px solid var(--health)",
                        color: "var(--health)",
                        fontFamily: "'Press Start 2P', monospace",
                        fontSize: 6,
                        padding: "4px 6px",
                        cursor: "pointer",
                      }}
                    >
                      YES
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="pixel-font"
                      style={{
                        background: "none",
                        border: "2px solid var(--game-border)",
                        color: "var(--game-muted)",
                        fontFamily: "'Press Start 2P', monospace",
                        fontSize: 6,
                        padding: "4px 6px",
                        cursor: "pointer",
                      }}
                    >
                      NO
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(p.id)}
                    className="pixel-font"
                    style={{
                      background: "none",
                      border: "2px solid var(--game-border)",
                      color: "var(--game-muted)",
                      fontFamily: "'Press Start 2P', monospace",
                      fontSize: 6,
                      padding: "4px 6px",
                      cursor: "pointer",
                    }}
                  >
                    🗑 DEL
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Create new profile */}
        {profiles.length < MAX_PROFILES && (
          <>
            {!creating ? (
              <button
                onClick={() => { setCreating(true); setNewName(""); setSelectedAvatar(AVATARS[0]); }}
                className="pixel-font"
                style={{
                  width: "100%",
                  background: "none",
                  border: "2px dashed var(--gem)",
                  color: "var(--gem)",
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: 9,
                  padding: 14,
                  cursor: "pointer",
                  letterSpacing: 2,
                  marginTop: 4,
                }}
              >
                + NEW ADVENTURER
              </button>
            ) : (
              <div style={{
                background: "#0a0a1a",
                border: "2px solid var(--gem)",
                padding: 16,
                marginTop: 4,
              }}>
                <div className="pixel-font" style={{ fontSize: 8, color: "var(--gem)", marginBottom: 12, letterSpacing: 1 }}>
                  CREATE ADVENTURER
                </div>

                {/* Avatar picker */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 13, color: "var(--game-muted)", marginBottom: 6 }}>Choose avatar:</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {AVATARS.map((av) => (
                      <button
                        key={av}
                        onClick={() => setSelectedAvatar(av)}
                        style={{
                          fontSize: 24,
                          background: selectedAvatar === av ? "rgba(68,255,136,0.15)" : "none",
                          border: `2px solid ${selectedAvatar === av ? "var(--green)" : "var(--game-border)"}`,
                          padding: 6,
                          cursor: "pointer",
                          borderRadius: 0,
                          transition: "border-color 0.15s",
                        }}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name input */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 13, color: "var(--game-muted)", marginBottom: 6 }}>Name (max 16 chars):</div>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value.slice(0, 16))}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    placeholder="Enter name..."
                    maxLength={16}
                    autoFocus
                    style={{
                      width: "100%",
                      background: "#050510",
                      border: "2px solid var(--game-border)",
                      color: "var(--game-text)",
                      fontFamily: "'VT323', monospace",
                      fontSize: 18,
                      padding: "8px 10px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Buttons */}
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={handleCreate}
                    disabled={!newName.trim()}
                    className="pixel-font"
                    style={{
                      flex: 1,
                      background: "none",
                      border: `2px solid ${newName.trim() ? "var(--green)" : "var(--game-border)"}`,
                      color: newName.trim() ? "var(--green)" : "var(--game-muted)",
                      fontFamily: "'Press Start 2P', monospace",
                      fontSize: 8,
                      padding: 12,
                      cursor: newName.trim() ? "pointer" : "not-allowed",
                      letterSpacing: 1,
                    }}
                  >
                    ▶ CREATE
                  </button>
                  <button
                    onClick={() => setCreating(false)}
                    className="pixel-font"
                    style={{
                      flex: 1,
                      background: "none",
                      border: "2px solid var(--game-border)",
                      color: "var(--game-muted)",
                      fontFamily: "'Press Start 2P', monospace",
                      fontSize: 8,
                      padding: 12,
                      cursor: "pointer",
                      letterSpacing: 1,
                    }}
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {profiles.length >= MAX_PROFILES && (
          <div style={{ textAlign: "center", fontSize: 13, color: "var(--game-muted)", marginTop: 8 }}>
            Maximum {MAX_PROFILES} profiles reached. Delete one to create a new adventurer.
          </div>
        )}
      </div>
    </div>
  );
}
