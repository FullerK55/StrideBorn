# Stride Born — Design Brainstorm

## Design Philosophy: Retro Dungeon Terminal

**Design Movement:** Neo-Retro Pixel RPG — blending 8-bit nostalgia with modern mobile UI clarity.

**Core Principles:**
1. Dark, atmospheric dungeon aesthetic — deep navy/black backgrounds with gold and cyan accents
2. Pixel-perfect typography using Press Start 2P for headers, VT323 for body text
3. Everything feels like a dungeon terminal — panels with glowing borders, scanline textures
4. Mobile-first: thumb-friendly tap targets, bottom-heavy layout for one-handed play

**Color Philosophy:**
- Deep space black (#0a0a1a) as base — feels like descending into the unknown
- Gold (#FFD700) for rewards, titles, and progress — the promise of treasure
- Cyan (#00FFFF) for stats and data — cold, precise dungeon readouts
- Red (#FF4466) for danger, HP, and urgency
- Green (#44FF88) for actions and success

**Layout Paradigm:**
- Single column, max 480px wide, centered — optimized for phone screens
- Dungeon scene at top as the "viewport" into the world
- Tabbed panel below for inventory/gear/log management
- No sidebar — pure vertical scroll with sticky header stats

**Signature Elements:**
1. Pixel star background — fixed, subtle, atmospheric
2. Glowing panel borders with gold gradient top edge
3. Animated character sprite (SVG pixel art) always walking

**Interaction Philosophy:**
- Minimal input required — idle game, just watch and make strategic decisions
- Tap to enter dungeon, tap to return — two core actions
- Everything else is passive observation and inventory management

**Animation:**
- Character bob/walk animation always active during dungeon runs
- Floating particles per dungeon theme (crystals, embers, leaves, snowflakes)
- Torch flicker on dungeon walls
- Loot popup floats up from character on item find
- Progress bar smooth fill transition

**Typography System:**
- Headers: Press Start 2P — pixel font, gold color, letter-spacing 2px
- Body/stats: VT323 — retro terminal font, 16-18px
- Labels: VT323 muted color, smaller size
