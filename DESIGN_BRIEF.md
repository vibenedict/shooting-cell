# Celo Shooter — Design Brief

## Product
Celo Shooter is a pocket arcade shooter for **MiniPay**, Celo's in-wallet
mobile browser. Drag to fly, tap to fire, dodge falling bullets, rack up a
score, and — if you beat your personal best — submit it to a shared,
on-chain top-10 leaderboard (gas only, no fee). It's a quick habit-loop
game: no session takes more than a minute or two, and the hook is chasing
your own high score and seeing your address climb the board.

Ported from a Python/pygame prototype into an HTML5 Canvas game with
touch controls (drag-to-move replaces mouse-follow, a fire button replaces
the keyboard shoot key).

## Platform & constraints
- Next.js 14 + TypeScript + Tailwind, mobile-first, hard-capped at 480px
  width (`html { max-width: 480px }`) — built to run inside **MiniPay**,
  not as a general desktop site.
- The game itself is a `<canvas>` element with a `requestAnimationFrame`
  loop — all in-game rendering (player ship, enemies, bullets, background)
  is drawn imperatively, not DOM/CSS. Any visual upgrade to gameplay
  happens inside `ShooterGame.tsx`'s draw calls, not via Tailwind classes.
- Everything outside the canvas (menu, game-over, leaderboard) is normal
  React + Tailwind and can be restyled conventionally.
- Must respect safe-area insets (notch phones), no scroll bounce, no
  pinch-zoom, `touch-action: none` globally so drag gestures don't scroll
  or zoom the page — it needs to feel like a native game, not a webpage
  with a game embedded in it.
- Wallet is **optional**, not gated — you can play and see your score with
  no wallet connected. It's only needed to submit a score on-chain. The
  design needs to make that distinction obvious (playing is free and
  instant; connecting is only for bragging rights).
- 4 screens: **Menu**, **Playing** (the canvas), **Game Over**,
  **Leaderboard**.

## Current visual language (placeholder — the thing to replace)
The whole thing is currently a fast reskin of a sibling project's ("HotTake")
design tokens with the accent swapped from coral to green — same dark
near-black surfaces, same Barlow Condensed/Sora font pairing, same flat
`cs-card` / `cs-btn-primary` component classes. It works, but it isn't a
game yet — it's a form with a canvas in the middle:

- **In-canvas rendering is placeholder-tier**: the player is a flat green
  triangle, enemies are flat red diamonds, bullets are plain rectangles,
  the background is a two-stop linear gradient. No sprites, no shading, no
  motion beyond raw position updates.
- **Zero game feel / juice**: nothing flashes, shakes, particles, or eases.
  A kill just deletes two rectangles and increments a number. A hit just
  decrements a number. There's no feedback that reads as an *event* — it
  all reads as a spreadsheet updating.
- **HUD is minimal to the point of invisible**: "SCORE 0" / "HP 10" in
  small mono text, top corners, no visual weight, no urgency signal as
  health gets low (color only flips to red at ≤3, nothing else changes).
- **Menu/game-over/leaderboard are generic dark cards**: functionally
  complete (see [`MenuScreen.tsx`](src/components/game/MenuScreen.tsx),
  [`GameOverScreen.tsx`](src/components/game/GameOverScreen.tsx),
  [`LeaderboardScreen.tsx`](src/components/game/LeaderboardScreen.tsx))
  but visually indistinguishable from a settings page — no arcade
  identity, no sense of "this is a game," no celebratory or tense moments
  called out.
- **No onboarding**: a first-time player is dropped straight into
  gameplay with only the tagline "Drag to fly, tap to fire" on the menu.
  No in-game hint the first time you play.

## Tone / personality
Arcade-cabinet energy — punchy, a little retro, immediate. Think classic
top-down shmup (Galaga/Space Invaders lineage) crossed with the instant
dopamine of a mobile hyper-casual game, but with a crypto-native flex
layered on top: your score isn't just a local high score, it's a public
on-chain claim other wallets can see. The leaderboard moment should feel
like a genuine "I'm #3 on-chain" flex, not a database table.

## What the redesign needs to solve
1. **Give the game its own visual identity**, distinct from being a green
   reskin of another project. New shape language / color system / motion
   language for the in-canvas world specifically — this doesn't have to
   (and probably shouldn't) match the surrounding menu chrome 1:1 the way
   it does now.
2. **Game feel / juice**, the highest-leverage fix:
   - Hit reactions — enemy death (flash/pop/particle burst, not just
     disappear), player-hit feedback (screen flash or shake, not just a
     number decrementing)
   - Motion — bullet trails, subtle enemy rotation/wobble, parallax
     starfield or scrolling background instead of a static gradient
   - Escalation cues — some visible signal as difficulty ramps over time
     (enemy speed/spawn rate both increase currently with zero indication)
3. **HUD that reads at a glance mid-action**: score and health need more
   visual weight and a real low-health danger state (pulsing, color
   sweep, border vignette — something beyond a text color swap) since
   this is a fast-twitch game where players won't be reading small text.
4. **Distinct, legible states for the emotional beats**, not just color
   swaps:
   - menu (idle, inviting)
   - playing (focused, high-contrast for reaction time)
   - low-health warning (tense)
   - game over — new personal best (celebratory) vs. game over — no
     improvement (still satisfying, not a dead end)
   - score submitted on-chain (confirmation should feel like a real
     "flex unlocked" moment, not a quiet tx-success line of text)
5. **A first-run hint** overlaid on the canvas the first time someone
   plays (drag zone + fire button called out briefly), since there's
   currently zero in-game onboarding beyond a menu tagline.
6. **Make the wallet-optional model legible**: right now "connect wallet"
   is a single dotted-underline text link with no visual priority — it
   should be clearly secondary/optional without looking neglected, and the
   leaderboard screen's "not configured yet" / connect / wrong-network /
   submitting / submitted states all need clear, distinct visual treatment.

## Key files for reference
- [`src/components/game/ShooterGame.tsx`](src/components/game/ShooterGame.tsx) —
  the canvas engine; all in-game visuals (shapes, colors, HUD overlay,
  fire button) live here as `ctx.fill*` calls and JSX, not Tailwind
- [`src/components/game/MenuScreen.tsx`](src/components/game/MenuScreen.tsx),
  [`GameOverScreen.tsx`](src/components/game/GameOverScreen.tsx),
  [`LeaderboardScreen.tsx`](src/components/game/LeaderboardScreen.tsx) —
  the three non-canvas screens
- [`tailwind.config.ts`](tailwind.config.ts), [`src/app/globals.css`](src/app/globals.css) —
  current design tokens (`cs-*` — currently a straight port of the sibling
  HotTake project's `ht-*` tokens with the accent hue changed)
- [`src/contracts/ShooterScore.sol`](src/contracts/ShooterScore.sol) —
  on-chain mechanic (best score per address, top-10 leaderboard) — useful
  context for designing the "submit"/"confirmed" moment
