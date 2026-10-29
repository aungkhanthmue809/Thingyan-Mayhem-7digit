# Technical Notes — Thingyan Mayhem (Level 1 MVP)

## Compatibility
- **Browsers:** Chrome, Edge, Firefox, Safari (current stable versions).
- **Devices:** Desktop and mobile (Android 10+, iOS 16+).
- **Orientation:** Portrait.
- **Viewport:** Designed around 390 × 844 CSS pixels; canvas scales responsively.

## Controls
- Touch (mobile): Tap pedestrian to splash.
- Mouse (desktop): Click pedestrian to splash.
- Keyboard: Spacebar as a dev fallback.

## Performance Targets
- Initial load: < 10 seconds (static HTML + JS + local image assets, no build step, no network dependencies).
- Frame rate: 60 fps target on phone-sized viewport.
- No crashes or freezes during normal play.

## Known Limitations (Level 1 MVP)
- Only Level 1 ("First Splash") is implemented.
- Character art is AI-generated (Google Gemini); see `AI_USE_DECLARATION.md` and `ASSET_CREDIT_LIST.md`.
- Audio is code-synthesized (Web Audio API); no audio files are included.
- Endless Mode, Levels 2–6, pause, and level select are planned but not yet built.
- `assets/irrelevant/` (unused AI drafts) and `assets/buffer/` (working screenshots) are excluded from the shipped build.

## Submission Version
- Playable URL, ZIP, demo video, README, and repository all identify the same submitted version: **Level 1 MVP**.
