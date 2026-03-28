// Stride Born — DifficultyUnlockModal
// Shown when the player clears the max floor of a difficulty tier.
// Offers: Advance to next difficulty (resets floor, keeps everything else)
//         or Stay on current difficulty (dismiss, keep running).

import { DIFFICULTY_CONFIG, DungeonDifficulty } from "@/hooks/useGameState";

interface Props {
  dungeonName: string;
  currentDifficulty: DungeonDifficulty;
  nextDifficulty: DungeonDifficulty;
  onAdvance: () => void;
  onStay: () => void;
}

export default function DifficultyUnlockModal({ dungeonName, currentDifficulty, nextDifficulty, onAdvance, onStay }: Props) {
  const curr = DIFFICULTY_CONFIG[currentDifficulty];
  const next = DIFFICULTY_CONFIG[nextDifficulty];

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-yellow-500/40 bg-zinc-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-900/60 to-amber-900/40 px-5 py-4 text-center">
          <div className="text-3xl mb-1">🏆</div>
          <h2 className="text-lg font-bold text-yellow-300 tracking-wide">DIFFICULTY CLEARED!</h2>
          <p className="text-sm text-zinc-400 mt-0.5">{dungeonName}</p>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          <p className="text-center text-sm text-zinc-300">
            You've conquered all{" "}
            <span className="font-bold" style={{ color: curr.color }}>{curr.label}</span>{" "}
            floors. Ready to face{" "}
            <span className="font-bold" style={{ color: next.color }}>{next.label}</span>?
          </p>

          {/* Comparison table */}
          <div className="rounded-xl border border-zinc-700 overflow-hidden text-xs">
            <div className="grid grid-cols-3 bg-zinc-800 text-zinc-400 font-semibold px-3 py-2">
              <span></span>
              <span className="text-center" style={{ color: curr.color }}>{curr.label}</span>
              <span className="text-center" style={{ color: next.color }}>{next.label}</span>
            </div>
            <div className="grid grid-cols-3 px-3 py-2 border-t border-zinc-700 text-zinc-300">
              <span className="text-zinc-500">Max Floor</span>
              <span className="text-center">{curr.maxFloor?.toLocaleString() ?? "∞"}</span>
              <span className="text-center">{next.maxFloor?.toLocaleString() ?? "∞"}</span>
            </div>
            <div className="grid grid-cols-3 px-3 py-2 border-t border-zinc-700 text-zinc-300">
              <span className="text-zinc-500">Bosses / 10F</span>
              <span className="text-center">{curr.bossCount}</span>
              <span className="text-center font-bold" style={{ color: next.color }}>{next.bossCount}</span>
            </div>
          </div>

          <p className="text-xs text-zinc-500 text-center">
            Nothing resets — your gear, stash, gold, and books carry over.
            <br />You'll restart from floor 1 on {next.label}.
          </p>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 grid grid-cols-2 gap-3">
          <button
            onClick={onStay}
            className="rounded-xl border border-zinc-600 bg-zinc-800 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-zinc-700 transition-colors"
          >
            Stay on {curr.label}
          </button>
          <button
            onClick={onAdvance}
            className="rounded-xl py-2.5 text-sm font-bold text-black transition-all hover:brightness-110 active:scale-95"
            style={{ backgroundColor: next.color }}
          >
            Advance → {next.label}
          </button>
        </div>
      </div>
    </div>
  );
}
