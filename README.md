# astuning.dev

Personal site of **astuning**, a developer who builds software the way they build
worlds: block by block. Voxel-game inspired single-page site — no frameworks,
no build step.

## Sections

- **Hero** — animated isometric voxel terrain on canvas (procedural noise,
  trees, water, floating ore blocks, drifting clouds). Click the terrain to
  break blocks and spawn particles.
- **About** — player card with a pixel avatar drawn on canvas, stats, and
  achievement toasts.
- **Inventory** — skills as item slots with XP bars and hover tooltips.
- **Projects** — block-styled cards with enchant-glow lore text.
- **Contact** — a sign block with email and socials.
- **Hotbar** — fixed bottom navigation that tracks the visible section.

## How it works

- `index.html` — markup only.
- `style.css` — Minecraft-style bevels, pixel fonts (Press Start 2P, VT323),
  stepped transitions, hotbar nav.
- `script.js` — value-noise heightmap, isometric cube renderer, procedurally
  generated dirt/grass/stone textures applied as CSS variables, scroll reveals,
  FPS counter.

## Run

Open `index.html` directly, or serve it:

```sh
python3 -m http.server 5173
```

Then visit `http://127.0.0.1:5173/`.

## Notes

- Respects `prefers-reduced-motion` (static scene, no reveals).
- Fan-made aesthetic only; not affiliated with Mojang or Microsoft.
