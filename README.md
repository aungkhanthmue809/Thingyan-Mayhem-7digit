# Thingyan Mayhem — Digit7 Jam 

**Working title:** Thingyan Mayhem  
**Genre:** Fast-tapping target-selection arcade game  
**Platform:** Browser (HTML5 Canvas, CSS, JavaScript)  
**Players:** Single-player  
**Level:** Days Mode (4 days) + unlockable Endless Mode  
**Team:** ArmSIX  


---

## 🎮 Game Description

Thingyan Mayhem is a playful, fast-tapping arcade game inspired by the Thingyan (Myanmar New Year) water festival. You stand on a raised festival stage and tap people walking past to splash them with water — but only the people matching the current mission. Splash the wrong person and you lose a heart!

### Main menu

The title screen has exactly three buttons: **Start Game**, **How to Play**, and **Quit Game**. Start Game opens the mode selection screen.

### Game modes

- **Days Mode** — the four days of Thingyan, in order: **အကြို**, **အကျ**, **အကြတ်**, **အတက်**.
- **Endless Mode** — a survival score chase, locked until all four Days Mode levels are completed. The unlock state is saved locally, so it stays unlocked once earned.

### Days Mode levels

| Day | Name | Objective |
|-----|------|-----------|
| 1 | အကြို | Splash **20 people** before the **20-second** timer runs out. Every person counts. Only normal pedestrians appear — no busy women or aunts. |
| 2 | အကျ | Original Level 1 gameplay: splash **6 men in red shirts** in 45 seconds with 3 lives. Splashing busy women or aunts costs a life. |
| 3 | အကြတ် | Splash **25 people** in **45 seconds**. Most walkers are normal speed, a few are faster, and spawns get gradually quicker as the counter rises. |
| 4 | အတက် | Final celebration: splash **30 people** **and** reach a **5-person combo** in **60 seconds**. Both objectives are shown on screen. |

- **Day 1 scoring:** correct splash +100, combo bonus +25 per consecutive hit. There are no lives — only the timer and the `People Splashed: 0 / 20` counter.
- **Day 2 scoring:** correct target +100 points, combo bonus +25 per consecutive hit, mission complete +300, hearts bonus +50 per remaining heart, time bonus +2 per second left.
- **Day 3 scoring:** same as Day 1 (+100 per person, combo bonus). No lives; the timer and the `25` target are the whole challenge.
- **Day 4 combo:** chain splashes within **2.5 seconds** to build a combo. A miss or a closed combo window resets the current chain, but the 5-person combo objective only has to be reached once.
- **Victory / failure:** Day 1–3 wins show **Continue**, **Retry**, and **Back to Levels**. Day 4's win marks all four days complete, unlocks Endless Mode, and shows **Continue** (to mode selection), **Retry**, and **Back to Main Menu**. Timed failures show the Burmese time-up message with **Retry** and **Back to Levels**.
- **Controls:** Tap / click on a pedestrian to splash. Empty taps have no penalty in Days Mode.

### Endless Mode

Endless Mode is a real survival run with no countdown:

- You start with **5 lives**. Any pedestrian who walks off screen un-splashed costs one life; at 0 lives the run ends.
- Every **20 unique splashes** restores one life (up to 5).
- Each unique splash scores **+1**. Rare **golden pedestrians** are worth **+5** and have a golden halo.
- Difficulty ramps smoothly over the first **180 seconds** — spawn interval, walking speed, on-screen density, and the chance of fast walkers all increase, then cap at **Extreme**.
- The HUD shows lives, score, survival time, and your saved best. Difficulty is labelled **Easy → Normal → Medium → Hard → Very Hard → Extreme**.
- The game-over screen shows the final score, survival time, best score, and previous best, plus a **New Record** notice when you beat it. The high score is saved as soon as it is beaten, and survives Play Again / reloads.

### Progression save

Progress is stored in `localStorage` under the key **`thingyanMayhem.progress.v1`**:

```json
{
  "completed": { "akyo": true, "akya": true, "akyat": true, "atat": true },
  "endlessUnlocked": true,
  "endlessHighScore": 42
}
```

- Winning a level marks it complete; replaying or retrying never erases completion.
- The level cards show a ✓ for completed days.
- Day 4 marks all four days complete and unlocks Endless Mode permanently.
- Endless Mode also unlocks automatically if every level ID is already complete (e.g. from an older save).
- `endlessHighScore` is the best Endless score and is kept across runs.
- If storage is unavailable (private mode / `file://`), progress still works for the current session.

---

## 📦 How to Run

1. Open `index.html` in any modern browser (Chrome, Edge, Firefox, Safari).
2. No build step, no installation, no external dependencies.
3. Works on mobile (touch) and desktop (mouse).

### Recommended viewport
390 × 844 CSS pixels (mobile-first portrait design). The canvas scales to fit your screen.

---

## 🕹 Controls

| Input | Action |
|-------|--------|
| Tap / Click | Splash the pedestrian under your finger/cursor |
| Menu buttons | Start Game / How to Play / Quit Game, mode and level selection, pause, retry, continue, back |

---

## 🧩 Submission Checklist (per Digit7 Jam Guide)

| Item | Status | Location |
|------|--------|----------|
| Playable Game Link | — | Deploy `index.html` to the Digit7s-provided HTTPS hosting |
| Playable Build ZIP | — | Zip this folder (excluding `node_modules` if any) |
| Source Code / Repository | — | Private GitHub repo; grant reviewer access |
| README File | ✅ | This file |
| Screenshots (≥3) | ⬜ | Add PNG/JPG to `assets/screenshots/` |
| Demo Video (1–3 min MP4) | ⬜ | Record gameplay; link in portal |
| Asset Credit List | ✅ | `ASSET_CREDIT_LIST.md` |
| License Proof | ⬜ | Add if you use third-party assets |
| Originality Declaration | ✅ | `ORIGINALITY_DECLARATION.md` |
| Team Profile | ✅ | See below |
| Technical Notes | ✅ | `TECHNICAL_NOTES.md` |
| AI Use Declaration | ✅ | `AI_USE_DECLARATION.md` |

---

## 👥 Team Profile

- **Team Name:** ArmSIX
- **Main Contact:** Aung Khant Hmue — aungkhanthmue809@gmail.com — @cheese_burgur
- **Team Members:** Aung Khant Hmue(Programmer) and Ye Yint Hein(Programmer)
- **Institution / Company / Independent / Student:** Student


---

## 🛠 Technical Notes

- **Engine:** Vanilla HTML5 Canvas 2D + CSS + JavaScript (no framework).
- **Browsers:** Tested on Chrome, Edge, Firefox, Safari (desktop & mobile).
- **Orientation:** Portrait (mobile-first).
- **Resolution:** Canvas adapts to viewport; designed around 390 × 844.
- **Offline:** No external API or network required. localStorage stores level completion, the Endless Mode unlock, and the Endless high score.
- **Build ZIP contents:** `index.html`, `css/`, `js/`, `assets/`.
- **Entry point:** `index.html`.

---

## 🎨 Art & Audio

Character sprites are loaded from `assets/<character>/walk_1.png` and `walk_2.png` (e.g. `assets/man_red/walk_1.png`). Wet-state reaction art (`wet.png`) now exists for kid, aunt, busy_woman, woman, man_red, and man_blue (`assets/<character>/wet.png`).

### Two block background images

The playfield has two separate background image slots — one per block:

| Block | File to add | Recommended format |
|-------|-------------|--------------------|
| **Top** (people walking) | `assets/background-top.png` | Portrait **9:16** — e.g. `940 × 1672` or `1080 × 1920` |
| **Bottom** (player) | `assets/background-bottom.jpg` | Wide strip **~2.6:1** — e.g. `780 × 300` or `1040 × 400` |

Each image is scaled to "cover" its block and centred, so it never stretches. Match the aspect ratio and keep the important part centred so cropping is not noticeable.

- `.jfif` / `.jpeg` files are just JPEGs — rename or copy them to the names above.
- If a block image is missing, the game falls back to `assets/background.jpg`, then to the drawn colours.
- To use `.png` or different names, edit `BACKGROUND_TOP_SRC` / `BACKGROUND_BOTTOM_SRC` near the top of `js/game.js`.

### Main menu background

Drop a full-screen background for the title/menu screen at **`assets/menu-background.png`** (portrait **9:16** recommended, e.g. `1080 × 1920` or `940 × 1672`). It is scaled to "cover" the screen and centred, with a light dark gradient on top so the menu text stays readable.

- If it is missing, `assets/background-top.png` is used instead, and if that is missing too the plain stage colour shows.
- To use a different filename/format, edit the `#screen-title, #screen-how, #screen-mode, #screen-levels` rule in `css/style.css`.

### Player / walking areas

- **Top block** — pedestrians walk here; their spawn heights are clamped so they never enter the player block.
- **Bottom block** — the player stands here, separated by a gold divider and a soft shadow.

Tune the layout in `js/game.js` with `getPlayerZoneTop()` (block boundary), `getPlayerY()` (player height), and `drawPlayerZone()` (divider/shadow).

All other visuals (water drops, splashes, player gun) are drawn with Canvas 2D.

Audio uses the Web Audio API for simple synthesized tones (no external audio files).

- **Art:** AI-generated sprites (Google Gemini), per `AI_USE_DECLARATION.md` and `ASSET_CREDIT_LIST.md`. Stored under `assets/` and loaded at runtime by `js/characters.js`.

---

## License

Created for the Digit7 Jam 2026. Game design and direction by the submitting team; code and visual assets AI-generated per `AI_USE_DECLARATION.md`.
