# Thingyan Mayhem — Digit7 Jam Submission

**Working title:** Thingyan Mayhem  
**Genre:** Fast-tapping target-selection arcade game  
**Platform:** Browser (HTML5 Canvas, CSS, JavaScript)  
**Players:** Single-player  
**Level:** Level 1 MVP — "First Splash"  
**Team:** [Your Team Name]  
**Main Contact:** [Your Name / Email / Telegram]

---

## 🎮 Game Description

Thingyan Mayhem is a playful, fast-tapping arcade game inspired by the Thingyan (Myanmar New Year) water festival. You stand on a raised festival stage and tap people walking past to splash them with water — but only the people matching the current mission. Splash the wrong person and you lose a heart!

### Level 1 — First Splash
- **Mission:** Splash 6 children wearing red shirts.
- **Time limit:** 45 seconds.
- **Hearts:** 3.
- **Scoring:** Correct target +100 points, combo bonus +25 per consecutive hit, mission complete +300, hearts bonus +50 per remaining heart, time bonus +2 per second left.
- **Controls:** Tap / click on a pedestrian to splash. Empty taps have no penalty.

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
| Space (keyboard) | Dev fallback — splashes center of screen |
| Sound toggle | Title screen toggle (persisted in localStorage) |

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

- **Team Name:** [Your Team Name]
- **Main Contact:** [Name] — [Email] — [Telegram Username]
- **Team Members:** [Names & roles]
- **Institution / Company / Independent / Student:** [ ]
- **Registration ID:** [ ]

---

## 🛠 Technical Notes

- **Engine:** Vanilla HTML5 Canvas 2D + CSS + JavaScript (no framework).
- **Browsers:** Tested on Chrome, Edge, Firefox, Safari (desktop & mobile).
- **Orientation:** Portrait (mobile-first).
- **Resolution:** Canvas adapts to viewport; designed around 390 × 844.
- **Offline:** No external API or network required. localStorage used for sound preference.
- **Build ZIP contents:** `index.html`, `css/`, `js/`, `assets/`.
- **Entry point:** `index.html`.

---

## 🎨 Art & Audio

Character sprites are loaded from `assets/<character>/walk_1.png` and `walk_2.png` (e.g. `assets/man_red/walk_1.png`). The kid also has a `wet.png` reaction frame.

### Adding a stage/background image

Drop a portrait background image at **`assets/background.jpg`** (recommended size ~420 × 844, or any 9:16-ish portrait ratio). It is scaled to "cover" the play area and centered, so it will not stretch.

- `.jfif` / `.jpeg` files are just JPEGs — rename or copy them to `background.jpg` (or change `BACKGROUND_IMAGE_SRC` to point at your file).
- If the file is missing, the game automatically falls back to the drawn gradient + platform colors.
- To use a different filename or format (e.g. `.png`), change `BACKGROUND_IMAGE_SRC` near the top of `js/game.js`.

All other visuals (water drops, splashes, player gun) are drawn with Canvas 2D.

Audio uses the Web Audio API for simple synthesized tones (no external audio files).

---

## 📜 License

Created for the Digit7 Jam 2026. All original code and design by the submitting team.
