// DungeonScene — Animated dungeon viewport
// Design: Pixel art scene with themed background, animated character, torches, particles, loot popups

import { useEffect, useRef } from "react";
import { DUNGEONS, type GameState, type LootPopup } from "@/hooks/useGameState";

interface Props {
  state: GameState;
  lootPopups: LootPopup[];
}

const DUNGEON_BG_STYLES: Record<string, React.CSSProperties> = {
  crystal: { background: "linear-gradient(180deg, #0d0d2e 0%, #1a0d3d 40%, #0d1a2e 100%)" },
  ember:   { background: "linear-gradient(180deg, #1a0a00 0%, #2d0f00 40%, #1a0500 100%)" },
  verdant: { background: "linear-gradient(180deg, #0a1a0a 0%, #0d2010 40%, #050f05 100%)" },
  frost:   { background: "linear-gradient(180deg, #0a1020 0%, #0d1530 40%, #080e1a 100%)" },
};

const TILE_STYLES: Record<string, React.CSSProperties> = {
  crystal: { background: "#2a1a5e", border: "1px solid #3d2a7a" },
  ember:   { background: "#3d1a00", border: "1px solid #5a2800" },
  verdant: { background: "#1a3d1a", border: "1px solid #2a5a2a" },
  frost:   { background: "#1a2a3d", border: "1px solid #2a3d5a" },
};

export default function DungeonScene({ state, lootPopups }: Props) {
  const particleRef = useRef<HTMLDivElement>(null);
  const particleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const dungeon = DUNGEONS.find((d) => d.id === state.currentDungeon) ?? DUNGEONS[0];
  const isActive = state.isInDungeon || state.isReturning;

  // Particle system
  useEffect(() => {
    if (!particleRef.current) return;

    const spawnParticle = () => {
      if (!particleRef.current) return;
      const el = document.createElement("div");
      const color = dungeon.particles[Math.floor(Math.random() * dungeon.particles.length)];
      const x = 10 + Math.random() * 80;
      const duration = 2 + Math.random() * 3;
      const drift = (Math.random() - 0.5) * 30;
      el.style.cssText = `
        position:absolute;
        width:2px;height:2px;
        background:${color};
        left:${x}%;
        bottom:32px;
        opacity:0;
        animation:floatUp ${duration}s linear forwards;
        --drift:${drift}px;
        border-radius:0;
      `;
      particleRef.current.appendChild(el);
      setTimeout(() => el.remove(), duration * 1000 + 100);
    };

    if (isActive) {
      particleIntervalRef.current = setInterval(spawnParticle, 300);
    } else {
      if (particleIntervalRef.current) {
        clearInterval(particleIntervalRef.current);
        particleIntervalRef.current = null;
      }
    }

    return () => {
      if (particleIntervalRef.current) {
        clearInterval(particleIntervalRef.current);
        particleIntervalRef.current = null;
      }
    };
  }, [isActive, dungeon]);

  const tileCount = Math.ceil(320 / 16) * 2;
  const tileStyle = TILE_STYLES[state.currentDungeon] ?? TILE_STYLES.crystal;
  const bgStyle = DUNGEON_BG_STYLES[state.currentDungeon] ?? DUNGEON_BG_STYLES.crystal;

  return (
    <div
      style={{
        background: "var(--bg-panel2)",
        border: "2px solid var(--game-border)",
        position: "relative",
        overflow: "hidden",
        height: 160,
        flexShrink: 0,
      }}
    >
      {/* Background */}
      <div style={{ position: "absolute", inset: 0, transition: "background 1s ease", ...bgStyle }} />

      {/* Particles container */}
      <div ref={particleRef} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />

      {/* Torches */}
      <div
        className="animate-flicker"
        style={{ position: "absolute", left: 16, bottom: 40, fontSize: 16, zIndex: 2 }}
      >🕯</div>
      <div
        className="animate-flicker"
        style={{ position: "absolute", right: 16, bottom: 40, fontSize: 16, zIndex: 2, animationDelay: "0.07s" }}
      >🕯</div>

      {/* Floor tiles */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 32, display: "flex", flexWrap: "wrap" }}>
        {Array.from({ length: tileCount }).map((_, i) => (
          <div key={i} style={{ width: 16, height: 16, flexShrink: 0, ...tileStyle }} />
        ))}
      </div>

      {/* Character */}
      <div
        className={isActive ? "animate-char-walk" : "animate-char-bob"}
        style={{
          position: "absolute",
          bottom: 32,
          left: "50%",
          transform: "translateX(-50%)",
          width: 16,
          height: 24,
          zIndex: 3,
        }}
      >
        <svg width="16" height="24" viewBox="0 0 16 24" style={{ imageRendering: "pixelated" }}>
          <rect x="5" y="8" width="6" height="8" fill="#4488ff"/>
          <rect x="4" y="2" width="8" height="7" fill="#ffcc88"/>
          <rect x="5" y="4" width="2" height="2" fill="#222"/>
          <rect x="9" y="4" width="2" height="2" fill="#222"/>
          <rect x="3" y="1" width="10" height="4" fill="#888899"/>
          <rect x="4" y="0" width="8" height="2" fill="#aaaacc"/>
          <rect x="5" y="16" width="2" height="4" fill="#334488"/>
          <rect x="9" y="16" width="2" height="4" fill="#334488"/>
          <rect x="4" y="20" width="3" height="3" fill="#553311"/>
          <rect x="9" y="20" width="3" height="3" fill="#553311"/>
          <rect x="12" y="8" width="2" height="10" fill="#ccccdd"/>
          <rect x="10" y="9" width="4" height="2" fill="#aa8800"/>
          <rect x="1" y="8" width="3" height="5" fill="#884400"/>
          <rect x="1" y="8" width="3" height="1" fill="#aa5500"/>
        </svg>
      </div>

      {/* Loot popups */}
      {lootPopups.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            bottom: 60,
            fontSize: 16,
            pointerEvents: "none",
            animation: "lootFloat 1.5s ease forwards",
            zIndex: 10,
            transform: "translateX(-50%)",
          }}
        >
          {p.emoji}
        </div>
      ))}

      {/* Floor display */}
      <div style={{ position: "absolute", top: 10, left: 10, zIndex: 4 }}>
        <div style={{ color: "var(--game-muted)", fontSize: 7, fontFamily: "'Press Start 2P', monospace", marginBottom: 2 }}>FLOOR</div>
        <div style={{
          color: "var(--gold)",
          fontSize: 14,
          fontFamily: "'Press Start 2P', monospace",
        }}>
          {state.currentFloor === 0 ? "BASE" : `B${state.currentFloor}`}
        </div>
      </div>

      {/* Dungeon name */}
      <div style={{ position: "absolute", top: 10, right: 10, textAlign: "right", zIndex: 4 }}>
        <div style={{ color: "var(--game-muted)", fontSize: 11 }}>
          {dungeon.icon} {dungeon.name.toUpperCase()}
        </div>
      </div>

      {/* Base overlay when not in dungeon */}
      {!isActive && (
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0,0,0,0.3)",
          zIndex: 5,
        }}>
          <div style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 9,
            color: "var(--game-muted)",
            textAlign: "center",
            lineHeight: 2,
          }}>
            AT BASE<br/>
            <span style={{ color: "var(--gold)", fontSize: 7 }}>READY TO DELVE</span>
          </div>
        </div>
      )}
    </div>
  );
}
