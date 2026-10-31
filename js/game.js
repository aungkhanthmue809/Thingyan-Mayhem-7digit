/**
 * Thingyan Mayhem — Game Engine
 * Days Mode (4 levels) + Endless Mode.
 * Single-file logic split across modules. HTML5 canvas, touch + mouse,
 * mobile-first portrait, responsive canvas.
 */

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const gameScreen = document.getElementById('screen-game');

// Days Mode level configs — all four days are playable.
//   1. အကြို  — warm-up: 20 people in 20 seconds
//   2. အကျ   — the original Level 1 gameplay, preserved
//   3. အကြတ် — crowd challenge: 25 people in 45 seconds, faster walkers
//   4. အတက်  — final celebration: 30 people + a 5-person combo in 60 seconds
const LEVEL_DAY1 = {
  id: 'akyo',
  day: 1,
  name: 'အကြို',
  tagline: 'Warm-up Challenge',
  duration: 20, // seconds
  startingHearts: 0,
  timed: true,
  anyTarget: true, // every person counts on Day 1
  // Only friendly pedestrians appear on Day 1 — no busy women or aunts.
  excludeTemplates: ['busy_woman', 'aunt'],
  speedMultiplier: 0.8, // warm-up: a little slower than normal
  playable: true,
  // Faster, steadier spawns than the classic level so 20 targets are reachable.
  spawn: { initial: 0, base: 420, step: 0, stepCap: 0, min: 300, max: 4 },
  objectives: [
    { id: 'people', targetType: ['man_red'], required: 20, completed: 0 },
  ],
  victoryTitle: 'အကြို ပြီးမြောက်ပါပြီ!',
  hazardsEnabled: false,
  specialEvent: null,
};

// Original Level 1 — preserved mechanics/objective, now Day 2 (အကျ).
const LEVEL_DAY2 = {
  id: 'akya',
  day: 2,
  name: 'အကျ',
  tagline: 'Splash 6 men in red shirts',
  duration: 45, // seconds
  startingHearts: 3,
  timed: false,
  anyTarget: false,
  playable: true,
  spawn: { initial: 25, base: 70, step: 3, stepCap: 45, min: 28, max: 4 },
  objectives: [
    {
      id: 'red_children',
      // "targetType" can be a single id or a list; the description is built
      // automatically from the first target's goalPlural, so it always matches
      // the character (e.g. "Splash 6 men in red shirts") — never ambiguous.
      targetType: ['man_red'],
      required: 6,
      completed: 0,
    },
  ],
  hazardsEnabled: false,
  specialEvent: null,
};

// Day 3 (အကြတ်) — crowd challenge: 25 people in 45 seconds.
// Most walkers are normal speed; a few are faster. Spawns get gradually
// quicker as the counter rises, and density is slightly above Day 2.
const LEVEL_DAY3 = {
  id: 'akyat',
  day: 3,
  name: 'အကြတ်',
  tagline: 'Crowd Challenge',
  duration: 45, // seconds
  startingHearts: 0,
  timed: true,
  anyTarget: true,
  speedMultiplier: 1,
  fastChance: 0.18, // only a small number of people rush past
  fastMultiplier: 1.55,
  playable: true,
  spawn: { initial: 0, base: 380, step: 6, stepCap: 140, min: 240, max: 5 },
  objectives: [
    { id: 'people', targetType: ['man_red'], required: 25, completed: 0 },
  ],
  victoryTitle: 'အကြတ် အောင်မြင်ပါပြီ!',
  hazardsEnabled: false,
  specialEvent: null,
};

// Day 4 (အတက်) — final celebration: 30 people AND a 5-person combo in 60s.
// The combo objective is completed once; the current combo still resets on a
// miss or when the combo window expires.
const LEVEL_DAY4 = {
  id: 'atat',
  day: 4,
  name: 'အတက်',
  tagline: 'Final Celebration',
  duration: 60, // seconds
  startingHearts: 0,
  timed: true,
  anyTarget: true,
  speedMultiplier: 1.05,
  fastChance: 0.2,
  fastMultiplier: 1.55,
  playable: true,
  spawn: { initial: 0, base: 340, step: 5, stepCap: 150, min: 210, max: 6 },
  objectives: [
    { id: 'people', targetType: ['man_red'], required: 30, completed: 0 },
  ],
  comboObjective: { required: 5 },
  comboWindow: 2500, // ms allowed between splashes to keep a combo alive
  victoryTitle: 'သင်္ကြန်လေးရက်လုံး အောင်မြင်စွာ ဖြတ်သန်းနိုင်ခဲ့ပါပြီ!',
  hazardsEnabled: false,
  specialEvent: null,
};

const LEVELS = [LEVEL_DAY1, LEVEL_DAY2, LEVEL_DAY3, LEVEL_DAY4];

// ---------- Endless Mode config ----------
// No countdown and no final objective — just survive and score. Difficulty is
// interpolated smoothly over the first 180 seconds (see getEndlessDifficulty).
const ENDLESS_MAX_HEARTS = 5;
const ENDLESS_LIFE_REGEN = 20; // one life back every 20 unique splashes
const ENDLESS_CONFIG = {
  id: 'endless',
  day: 0,
  name: 'Endless',
  tagline: 'Endless Survival',
  duration: 0,
  startingHearts: ENDLESS_MAX_HEARTS,
  maxHearts: ENDLESS_MAX_HEARTS,
  timed: false,
  anyTarget: true,
  playable: true,
  spawn: { initial: 1200, base: 1300, step: 0, stepCap: 0, min: 360, max: 3 },
  objectives: [
    { id: 'endless', targetType: [], required: Infinity, completed: 0 },
  ],
  bonusChance: 0.07, // rare golden pedestrian
  bonusPoints: 5,
  hazardsEnabled: false,
  specialEvent: null,
};

// Backwards-compatible alias: the old "Level 1" is now Day 2 (အကျ).
const LEVEL_1 = LEVEL_DAY2;

// ---------- Progression (saved locally) ----------
// One small save object, extended as more levels are added. It stores which
// days are complete and whether Endless Mode has been permanently unlocked.
const PROGRESS_KEY = 'thingyanMayhem.progress.v1';

function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return { completed: {}, endlessUnlocked: false, endlessHighScore: 0 };
    const data = JSON.parse(raw);
    const highScore = Number(data && data.endlessHighScore);
    return {
      completed: (data && data.completed) || {},
      endlessUnlocked: !!(data && data.endlessUnlocked),
      endlessHighScore: Number.isFinite(highScore) && highScore > 0 ? Math.floor(highScore) : 0,
    };
  } catch (e) {
    // Storage unavailable (private mode / file://) — start fresh.
    return { completed: {}, endlessUnlocked: false, endlessHighScore: 0 };
  }
}

let progress = loadProgress();

function saveProgress() {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch (e) {
    // Storage unavailable — progress still works for this session.
  }
}

function allLevelsComplete() {
  return LEVELS.every((lvl) => !!progress.completed[lvl.id]);
}

function isEndlessUnlocked() {
  if (progress.endlessUnlocked) return true;
  if (allLevelsComplete()) {
    progress.endlessUnlocked = true;
    saveProgress();
    return true;
  }
  return false;
}

function markLevelComplete(levelId) {
  if (!progress.completed[levelId]) {
    progress.completed[levelId] = true;
    saveProgress();
  }
  if (allLevelsComplete() && !progress.endlessUnlocked) {
    progress.endlessUnlocked = true;
    saveProgress();
  }
}

// Day 4 clears the whole festival: mark every day done and unlock Endless.
function markAllLevelsComplete() {
  let changed = false;
  LEVELS.forEach((lvl) => {
    if (!progress.completed[lvl.id]) {
      progress.completed[lvl.id] = true;
      changed = true;
    }
  });
  if (!progress.endlessUnlocked) {
    progress.endlessUnlocked = true;
    changed = true;
  }
  if (changed) saveProgress();
}

// ---------- State ----------
let W, H;
let state = 'title'; // title | how | mode | levels | quit | playing | paused | clear | gameover
let currentMode = 'days'; // days | endless
let currentLevel = null;
let timeLeft = 0;
let hearts = 0;
let score = 0;
let combo = 0;
let bestCombo = 0;
let lastComboTime = 0;
let mission = null;
let comboObjective = null; // { required, completed } — Day 4 only
let endless = null; // { elapsed, bestAtStart, newRecord, missed, hudAcc } — Endless only
let pedestrians = [];
let splashes = []; // {x,y,size,life,vx,vy,color}
let waterDrops = []; // {x,y,targetX,targetY,vx,vy,life,arrived}
let floats = []; // floating text DOM elements are handled by UI.floatText
let last = 0;
let timeAcc = 0;
let spawnTimer = 0;
let animFrame = null;

// ---------- Resize / Canvas ----------
// Blueprint requires usable play at 360x640 (mobile) and 1280x720 (desktop).
// The screen fills the window via CSS; the canvas takes the space left
// below the HUD + mission bar so nothing is ever clipped.
function resizeCanvas() {
  // Don't pin the screen to a fixed size — CSS (inset: 0) handles it
  gameScreen.style.width = '';
  gameScreen.style.height = '';

  // Width: portrait column (mobile-first per blueprint; narrow strip on desktop)
  const maxW = Math.min(window.innerWidth, 420);

  // Height: remaining space under the HUD + mission bar, clamped so the
  // playfield never exceeds the blueprint's 844px reference height
  // (canvas offsetTop measures everything stacked above it)
  const available = gameScreen.clientHeight - canvas.offsetTop - 12;
  const maxH = Math.max(320, Math.min(available, 844));

  canvas.width = maxW;
  canvas.height = maxH;
  W = canvas.width;
  H = canvas.height;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ---------- Block background images ----------
// Two separate backgrounds, one per block (see README → Art & Audio):
//   assets/background-top.png    — top block (people walking)
//   assets/background-bottom.jpg — bottom block (player)
// If either is missing, the single assets/background.jpg is used as a fallback;
// if that is missing too, the drawn colours are used.
const BACKGROUND_TOP_SRC = 'assets/background-top.png';
const BACKGROUND_BOTTOM_SRC = 'assets/background-bottom.jpg';
const BACKGROUND_FALLBACK_SRC = 'assets/background.jpg';

function loadBackgroundImage(src) {
  const img = new Image();
  const state = { img: img, loaded: false };
  img.onload = () => { state.loaded = true; };
  img.onerror = () => { state.loaded = false; };
  img.src = src;
  return state;
}

const backgroundTop = loadBackgroundImage(BACKGROUND_TOP_SRC);
const backgroundBottom = loadBackgroundImage(BACKGROUND_BOTTOM_SRC);
const backgroundFallback = loadBackgroundImage(BACKGROUND_FALLBACK_SRC);

// Draw an image so it covers a rectangle without distorting (like CSS cover)
function drawCoverImage(image, dx, dy, dw, dh) {
  const iw = image.width;
  const ih = image.height;
  if (!iw || !ih) return;
  const scale = Math.max(dw / iw, dh / ih);
  const w = iw * scale;
  const h = ih * scale;
  ctx.drawImage(image, dx + (dw - w) / 2, dy + (dh - h) / 2, w, h);
}

// ---------- Layout: walking block vs player block ----------
// The playfield is split into two blocks:
//   • top block    — pedestrians walk here, over the background photo
//   • bottom block — the player stands here, visually separated
// The background image still shows through both blocks.
const PLAYER_ZONE_MAX = 150;    // px — tallest the bottom block gets
const PLAYER_ZONE_RATIO = 0.24; // ...or 24% of the canvas on short screens

function getPlayerZoneTop() {
  return H - Math.min(PLAYER_ZONE_MAX, H * PLAYER_ZONE_RATIO);
}

// Player position: near the bottom of its block ("a bit down")
function getPlayerY() {
  return H - 64;
}

function drawPlayerZone() {
  const top = getPlayerZoneTop();
  ctx.save();

  // Soft shadow under the divider so the two blocks read as separate layers
  const shadow = ctx.createLinearGradient(0, top, 0, top + 20);
  shadow.addColorStop(0, 'rgba(0, 0, 0, 0.30)');
  shadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = shadow;
  ctx.fillRect(0, top, W, 20);

  // Gold divider line between the two blocks
  ctx.fillStyle = 'rgba(240, 207, 107, 0.95)';
  ctx.fillRect(0, top, W, 3);

  ctx.restore();
}

// ---------- Audio ----------
function playSound(type) {
  try {
    const ctxAudio = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctxAudio.createOscillator();
    const gain = ctxAudio.createGain();
    osc.connect(gain);
    gain.connect(ctxAudio.destination);
    const now = ctxAudio.currentTime;
    if (type === 'splash') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'combo') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.1);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'mistake') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.25);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'complete') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.linearRampToValueAtTime(780, now + 0.15);
      osc.frequency.linearRampToValueAtTime(1040, now + 0.3);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch (e) {
    // AudioContext may be blocked until user gesture — safe to ignore
  }
}

// ---------- Difficulty helpers ----------
function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Smooth 0→1 ramp over the first 180 seconds. Everything stays capped so the
// game never becomes impossible or unplayable.
function getEndlessDifficulty(elapsedSec) {
  const ramp = 180;
  const p = Math.max(0, Math.min(1, elapsedSec / ramp));
  const k = p * p * (3 - 2 * p); // smoothstep
  let label = 'Easy';
  if (elapsedSec >= 180) label = 'Extreme';
  else if (elapsedSec >= 120) label = 'Very Hard';
  else if (elapsedSec >= 90) label = 'Hard';
  else if (elapsedSec >= 60) label = 'Medium';
  else if (elapsedSec >= 30) label = 'Normal';
  return {
    progress: k,
    label,
    spawnInterval: lerp(1300, 360, k),
    speed: lerp(0.85, 1.55, k),
    maxPedestrians: Math.max(3, Math.round(lerp(3, 7, k))),
    fastChance: lerp(0, 0.3, k),
    fastMultiplier: 1.5,
  };
}

function getEndlessSpawnCfg(elapsedSec) {
  const d = getEndlessDifficulty(elapsedSec);
  return { max: d.maxPedestrians, base: d.spawnInterval, min: d.spawnInterval, step: 0, stepCap: 0, difficulty: d };
}

function comboWindowMs() {
  return (currentLevel && currentLevel.comboWindow) || 2000;
}

function buildMissionDescription(config, objective) {
  const tag = `<span class="level-tag mm" lang="my">${config.name}</span>`;
  if (config.anyTarget) return `${tag}People Splashed:`;

  const firstTarget = Array.isArray(objective.targetType) ? objective.targetType[0] : objective.targetType;
  const targetTemplate = pickTemplateById(firstTarget);
  let desc = `${tag}Splash <b class="target-word">${objective.required} ${targetTemplate.goalPlural}</b>`;
  // Auto-built avoid-hint from the people who cost a life (kept in sync with resolveSplash)
  const penaltyIds = ['busy_woman', 'aunt'];
  const avoidText = penaltyIds.map((id) => pickTemplateById(id).label).join(' & ');
  desc += ` &nbsp;•&nbsp; avoid the <b class="avoid-word">${avoidText}</b>`;
  return desc;
}

// ---------- Gameplay ----------
function startLevel(config, mode) {
  if (!config || config.playable === false) return;

  // Stop any loop still running from a previous attempt.
  cancelAnimationFrame(animFrame);

  currentMode = mode || (config.id === 'endless' ? 'endless' : 'days');
  const isEndless = currentMode === 'endless';

  currentLevel = config;
  hearts = config.startingHearts || 0;
  score = 0;
  combo = 0;
  bestCombo = 0;
  lastComboTime = 0;
  pedestrians = [];
  splashes = [];
  waterDrops = [];
  timeAcc = 0;
  endless = null;

  if (isEndless) {
    timeLeft = 0;
    mission = { id: 'endless', targetType: [], required: Infinity, completed: 0, description: '' };
    comboObjective = null;
    endless = {
      elapsed: 0,
      bestAtStart: progress.endlessHighScore || 0,
      newRecord: false,
      missed: 0,
      hudAcc: 0,
    };
  } else {
    timeLeft = config.duration;
    mission = { ...config.objectives[0], completed: 0 };
    mission.description = buildMissionDescription(config, mission);
    comboObjective = config.comboObjective
      ? { required: config.comboObjective.required, completed: false }
      : null;
  }

  const spawnCfg = config.spawn || { initial: 25, base: 70, step: 3, stepCap: 45, min: 28, max: 4 };

  last = performance.now();
  spawnTimer = spawnCfg.initial != null ? spawnCfg.initial : 25;
  state = 'playing';

  // HUD visibility: timed Days levels have no lives; only Day 4 shows the
  // combo box; Endless shows the saved best score.
  gameScreen.classList.toggle('hide-hearts', !!config.timed && !isEndless);
  gameScreen.classList.toggle('hide-combo', !config.comboObjective);
  gameScreen.classList.toggle('show-best', isEndless);

  UI.showScreen('screen-game');
  resizeCanvas(); // re-measure now that the screen is visible (HUD/canvas offsets are real)

  if (isEndless) {
    updateEndlessHud();
    UI.setMission2('Best Combo:', 0, 0, false);
  } else {
    UI.setHud(hearts, timeLeft, score, combo);
    UI.setMission(mission.description, mission.completed, mission.required);
    UI.setMission2('Best Combo:', 0, comboObjective ? comboObjective.required : 0, !!comboObjective);
  }

  if (isEndless) {
    spawnPedestrian();
    spawnPedestrian();
  } else if (config.id === 'akya') {
    spawnPedestrian('man_red'); // guaranteed first appearance so you always see him
  } else {
    // Start with two people already walking so timed challenges begin at once.
    spawnPedestrian();
    spawnPedestrian();
  }

  requestAnimationFrame(loop);
}

function startEndless() {
  startLevel(ENDLESS_CONFIG, 'endless');
}

function updateEndlessHud() {
  if (!endless || currentMode !== 'endless') return;
  const d = getEndlessDifficulty(endless.elapsed);
  UI.setEndlessHud(hearts, score, endless.elapsed, progress.endlessHighScore || 0);
  UI.setMissionCustom(
    `<span class="level-tag">ENDLESS</span>Difficulty: <b class="target-word">${d.label}</b>`,
    `${Math.round(d.progress * 100)}%`,
    d.progress * 100
  );
}

function spawnPedestrian(forceTemplateId) {
  const isEndless = currentMode === 'endless';
  const diff = isEndless ? getEndlessDifficulty(endless ? endless.elapsed : 0) : null;
  const spawnCfg = isEndless
    ? getEndlessSpawnCfg(endless ? endless.elapsed : 0)
    : ((currentLevel && currentLevel.spawn) ||
      { max: 4, base: 70, step: 3, stepCap: 45, min: 28 });

  // Limit how many people are on screen at once (keeps it readable & fair)
  if (pedestrians.length >= spawnCfg.max) return false;

  const t = forceTemplateId
    ? pickTemplateById(forceTemplateId)
    : pickTemplate(currentLevel && currentLevel.excludeTemplates);

  // Endless has a rare golden pedestrian worth bonus points.
  const bonus = isEndless && !forceTemplateId && Math.random() < (ENDLESS_CONFIG.bonusChance || 0);

  const dir = Math.random() < 0.5 ? 1 : -1;
  const x = dir === 1 ? -50 : W + 50;

  // Keep pedestrians inside the top block so they never overlap the player block
  const walkTop = H * 0.30;
  const walkBottom = Math.max(walkTop + 40, getPlayerZoneTop() - 60);

  // Avoid spawning someone directly on top of an existing walker near the edge.
  let y = walkTop + Math.random() * (walkBottom - walkTop);
  const minGap = 64;
  for (let attempt = 0; attempt < 12; attempt++) {
    const candidate = walkTop + Math.random() * (walkBottom - walkTop);
    const tooClose = pedestrians.some((p) => !p.dead &&
      Math.abs(p.y - candidate) < minGap && Math.abs(p.x - x) < 140);
    if (!tooClose) {
      y = candidate;
      break;
    }
  }

  // Speed: per-level multiplier, plus Endless difficulty and occasional rushers.
  let speedMultiplier = (currentLevel && currentLevel.speedMultiplier) || 1;
  let fast = false;
  if (isEndless) {
    speedMultiplier *= diff.speed;
    if (Math.random() < diff.fastChance) {
      fast = true;
      speedMultiplier *= diff.fastMultiplier;
    }
  } else if (currentLevel && currentLevel.fastChance && Math.random() < currentLevel.fastChance) {
    fast = true;
    speedMultiplier *= currentLevel.fastMultiplier || 1.5;
  }

  const speed = t.speed * (0.85 + Math.random() * 0.45) * speedMultiplier;

  pedestrians.push({
    x: x,
    y: y,
    dir: dir,
    vx: speed * dir,
    template: t,
    phase: Math.random() * Math.PI * 2,
    radius: 30 * t.scale,
    splashing: false,
    dead: false,
    scored: false,
    bonus: bonus,
    fast: fast,
    spawnTime: performance.now(),
  });

  // Endless spawns quicken with the difficulty ramp. Days levels use the
  // original "spawn faster as the counter rises" behaviour.
  if (isEndless) {
    spawnTimer = spawnCfg.base * (0.85 + Math.random() * 0.3);
  } else {
    spawnTimer = Math.max(
      spawnCfg.min,
      spawnCfg.base - Math.min(mission.completed * spawnCfg.step, spawnCfg.stepCap)
    );
  }
  return true;
}

function addWaterDrop(tx, ty) {
  // Start from the water gun's nozzle, in the player block
  const sx = W / 2;
  const sy = getPlayerY() - 50;
  const dx = tx - sx;
  const dy = ty - sy;
  const dist = Math.hypot(dx, dy);
  const speed = 16;
  waterDrops.push({
    x: sx,
    y: sy,
    targetX: tx,
    targetY: ty,
    vx: (dx / dist) * speed,
    vy: (dy / dist) * speed - 2, // slight arc
    life: 1.0,
    arrived: false,
  });
  playSound('splash'); // water throw sound
  triggerShot(dx, dy); // gun kicks back AND swivels to face the shot direction
}

function resolveSplashAt(tx, ty) {
  // Never score after the level has been won or lost.
  if (state !== 'playing') return;

  // Forgiving hit zone: larger than the visual character so water connects easily
  const HIT_MULTIPLIER = 1.45;
  let hit = null;
  let bestDist = Infinity;
  for (let i = pedestrians.length - 1; i >= 0; i--) {
    const p = pedestrians[i];
    if (p.dead || p.splashing || p.scored) continue;
    const dx = tx - p.x;
    const dy = ty - p.y;
    const dist = Math.hypot(dx, dy);
    const hitRadius = p.radius * HIT_MULTIPLIER;
    if (dist < hitRadius && dist < bestDist) {
      hit = p;
      bestDist = dist;
    }
  }

  if (hit) {
    const targetTypes = Array.isArray(mission.targetType) ? mission.targetType : [mission.targetType];
    // Endless and the "everyone counts" days accept any pedestrian.
    const isTarget = currentMode === 'endless' ||
      !!(currentLevel && currentLevel.anyTarget) ||
      targetTypes.includes(hit.template.id);
    resolveSplash(hit, isTarget);
  } else {
    UI.floatText(gameScreen, tx, ty - 30, 'Miss', '#888');
    // A miss breaks an active Day 4 combo immediately.
    if (comboObjective && combo > 0) {
      combo = 0;
      lastComboTime = 0;
      UI.setHud(hearts, timeLeft, score, combo);
    }
  }
}

function resolveSplash(p, isTarget) {
  // Guard against double-scoring the same person (or scoring after endLevel).
  if (state !== 'playing' || p.scored) return;
  p.scored = true;
  p.splashing = true;
  p.dead = true;

  if (isTarget) {
    const now = Date.now();
    if (now - lastComboTime < comboWindowMs()) {
      combo++;
    } else {
      combo = 1;
    }
    lastComboTime = now;
    if (combo > bestCombo) bestCombo = combo;

    if (currentMode === 'endless') {
      // Endless scoring: +1 per unique pedestrian, +5 for a golden one.
      const points = p.bonus ? (ENDLESS_CONFIG.bonusPoints || 5) : 1;
      score += points;
      mission.completed++;

      // Keep the saved record live as soon as it is beaten.
      if (score > (progress.endlessHighScore || 0)) {
        progress.endlessHighScore = score;
        endless.newRecord = true;
        saveProgress();
      }

      // A small reward for a long run: one life back every 20 splashes.
      if (mission.completed % ENDLESS_LIFE_REGEN === 0 && hearts < ENDLESS_MAX_HEARTS) {
        hearts++;
        UI.floatText(gameScreen, W / 2, getPlayerZoneTop() - 16, '+1 Life', '#2a9d8f');
      }

      addSplash(p.x, p.y, p.bonus ? '#ffd93d' : (p.template.drop || p.template.shirt), true);
      UI.floatText(
        gameScreen,
        p.x,
        p.y - 40,
        `+${points}${p.bonus ? ' ★' : ''}`,
        p.bonus ? '#b8860b' : '#2a9d8f'
      );
      if (p.bonus) playSound('combo');
      updateEndlessHud();
    } else {
      const points = 100 + (combo - 1) * 25;
      score += points;
      mission.completed++;

      if (combo > 1) playSound('combo');

      addSplash(p.x, p.y, p.template.drop || p.template.shirt, true);
      UI.floatText(gameScreen, p.x, p.y - 40, `+${points} ${combo > 1 ? `x${combo}` : ''}`, '#2a9d8f');

      UI.setHud(hearts, timeLeft, score, combo);
      UI.setMission(mission.description, mission.completed, mission.required);

      if (comboObjective) {
        UI.setMission2(
          'Best Combo:',
          Math.min(bestCombo, comboObjective.required),
          comboObjective.required,
          true
        );
        if (!comboObjective.completed && bestCombo >= comboObjective.required) {
          comboObjective.completed = true;
          UI.floatText(gameScreen, W / 2, getPlayerZoneTop() - 20, 'COMBO OBJECTIVE!', '#2a9d8f');
          playSound('complete');
        }
      }

      const missionDone = mission.completed >= mission.required;
      const comboDone = !comboObjective || comboObjective.completed;
      if (missionDone && comboDone) {
        endLevel(true);
        return;
      }
    }
  } else {
    const penaltyTargetIds = ['busy_woman', 'aunt']; // only these people cost a life
    const costHeart = penaltyTargetIds.includes(p.template.id);

    if (costHeart) {
      hearts--;
      combo = 0;
      lastComboTime = 0;
      score = Math.max(0, score - 25);
      playSound('mistake');

      UI.floatText(gameScreen, p.x, p.y - 40, '-Life', '#e63946');

      UI.setHud(hearts, timeLeft, score, combo);

      if (hearts <= 0) {
        endLevel(false, 'You hit the wrong person!');

        return;
      }
    }
    // Non-goal, non-penalty people (e.g. men/women/kids who aren't the goal):
    // nothing gained, nothing lost — the splash simply disappears.

    addSplash(p.x, p.y, p.template.drop || p.template.shirt, false);
  }

  setTimeout(() => {
    pedestrians = pedestrians.filter((x) => x !== p);
  }, 350);
}

function addSplash(x, y, color, isTarget) {
  // Expanding splat ring
  splashes.push({
    x: x, y: y, color: color, life: 1.0, type: 'splat',
    radius: 0, maxRadius: 44, vx: 0, vy: 0,
  });

  // Droplet burst — more particles, better spread, gravity
  const count = isTarget ? 22 : 14;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 16;
    splashes.push({
      x: x, y: y, color: color, life: 1.0, type: 'drop',
      radius: 3 + Math.random() * 4,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      gravity: 0.5,
      drag: 0.96,
    });
  }
}

function endLevel(win, reason) {
  // Only the first win/loss counts — late water drops cannot change the result.
  if (state !== 'playing') return;

  state = win ? 'clear' : 'gameover';
  cancelAnimationFrame(animFrame);

  const isDay4 = currentLevel && currentLevel.day === 4;

  if (win) {
    if (isDay4) markAllLevelsComplete();
    else markLevelComplete(currentLevel.id);
  }

  if (win) {
    playSound('complete');

    // Day 4 — the whole festival is complete: special message + unlock banner.
    if (isDay4) {
      UI.setClearTitle(
        currentLevel.victoryTitle,
        `You splashed ${mission.completed} people and reached a ${bestCombo}-person combo. All four days are complete!`
      );
      UI.showClear(score, 0, timeLeft, {
        showHearts: false,
        people: `${mission.completed} / ${mission.required}`,
        combo: `${Math.min(bestCombo, comboObjective.required)} / ${comboObjective.required}`,
        unlockNote: '🔓 Endless Mode unlocked!',
        backLabel: 'BACK TO MAIN MENU',
      });
      return;
    }

    // Days 1 & 3 — timed levels with Burmese victory messages and no lives.
    if (currentLevel.timed) {
      UI.setClearTitle(
        currentLevel.victoryTitle || 'LEVEL CLEARED!',
        `You splashed ${mission.completed} people in ${currentLevel.duration} seconds.`
      );
      UI.showClear(score, 0, timeLeft, {
        showHearts: false,
        people: `${mission.completed} / ${mission.required}`,
        backLabel: 'BACK TO LEVELS',
      });
      return;
    }

    // Day 2 — preserved original scoring/bonus behaviour.
    const bonus = hearts > 0 ? hearts * 50 : 0;
    const timeBonus = Math.max(0, Math.floor(timeLeft)) * 2;
    score += bonus + timeBonus + 300;

    UI.setClearTitle('LEVEL CLEARED!', 'Mission complete.');
    UI.showClear(score, hearts, timeLeft, { backLabel: 'BACK TO LEVELS' });
    return;
  }

  // Failure
  playSound('mistake');
  let title = 'GAME OVER';
  let msg = reason || 'Level failed.';

  if (currentLevel && currentLevel.timed) {
    title = 'အချိန်ကုန်သွားပါပြီ!';
    if (comboObjective) {
      msg = `You splashed ${mission.completed} / ${mission.required} people and reached a best combo of ${Math.min(bestCombo, comboObjective.required)} / ${comboObjective.required}. Try again!`;
    } else {
      msg = `You splashed ${mission.completed} / ${mission.required} people. Try again!`;
    }
  }

  UI.showGameOver(score, msg, title);
}

// Endless only — pedestrians who leave the screen un-splashed cost a life.
function registerEndlessMiss() {
  if (!endless || state !== 'playing') return;
  hearts--;
  endless.missed++;
  playSound('mistake');
  UI.floatText(gameScreen, W / 2, getPlayerZoneTop() - 24, '-Life', '#e63946');
  updateEndlessHud();
  if (hearts <= 0) endEndless();
}

function endEndless() {
  if (state !== 'playing' || !endless) return;
  state = 'gameover';
  cancelAnimationFrame(animFrame);

  const previousBest = endless.bestAtStart;
  const newRecord = score > previousBest;
  if (score > (progress.endlessHighScore || 0)) {
    progress.endlessHighScore = score;
    saveProgress();
  }

  playSound('mistake');
  UI.showGameOver(
    score,
    'Pedestrians got past you. Splash everyone before they leave the screen!',
    'GAME OVER',
    {
      endless: true,
      survivalTime: UI.formatTime(endless.elapsed),
      highScore: progress.endlessHighScore || 0,
      previousHighScore: previousBest,
      newRecord: newRecord,
    }
  );
}

// ---------- Main Loop ----------
function loop(t) {
  if (state !== 'playing') return;
  const dt = Math.min(100, Math.max(0, t - last));
  last = t;
  const isEndless = currentMode === 'endless';

  if (isEndless) {
    // No countdown — track survival time and refresh the HUD about 10×/sec.
    endless.elapsed += dt / 1000;
    endless.hudAcc += dt;
    if (endless.hudAcc >= 100) {
      endless.hudAcc = 0;
      updateEndlessHud();
    }
  } else {
    // Timer
    timeAcc += dt;
    if (timeAcc >= 1000) {
      timeAcc -= 1000;
      timeLeft--;
      UI.setHud(hearts, timeLeft, score, combo);
      if (timeLeft <= 0) {
        endLevel(false, 'Time ran out before the mission was complete.');
        return;
      }
    }
  }

  // Day 4 combo expiry — letting the window close breaks the current chain.
  if (comboObjective && combo > 0 && Date.now() - lastComboTime >= comboWindowMs()) {
    combo = 0;
    lastComboTime = 0;
    UI.setHud(hearts, timeLeft, score, combo);
  }

  // Spawn pedestrians
  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnPedestrian();
  }

  // Update pedestrians
  for (let i = pedestrians.length - 1; i >= 0; i--) {
    const p = pedestrians[i];
    if (p.dead && !p.splashing) {
      pedestrians.splice(i, 1);
      continue;
    }
    if (!p.dead) {
      p.x += p.vx;
      p.phase += 0.18;
      if ((p.dir === 1 && p.x > W + 60) || (p.dir === -1 && p.x < -60)) {
        // In Endless, anyone who walks past un-splashed costs a life.
        if (isEndless) registerEndlessMiss();
        pedestrians.splice(i, 1);
        continue;
      }
    }
    if (p.splashing) {
      p.y += 2; // sink down: wet character drops toward the ground
      p.radius *= 0.94;
      if (p.radius < 3) {
        pedestrians = pedestrians.filter((x) => x !== p);
      }
    }
  }

  // Update water drops
  for (let i = waterDrops.length - 1; i >= 0; i--) {
    const d = waterDrops[i];
    if (!d.arrived) {
      d.x += d.vx;
      d.y += d.vy;
      const dx = d.targetX - d.x;
      const dy = d.targetY - d.y;
      if (Math.hypot(dx, dy) < 12) {
        d.arrived = true;
        resolveSplashAt(d.targetX, d.targetY);
      }
    }
    d.life -= 0.02;
    if (d.life <= 0 || d.arrived) {
      waterDrops.splice(i, 1);
    }
  }

  // Update splashes
  for (let i = splashes.length - 1; i >= 0; i--) {
    const s = splashes[i];
    if (s.type === 'splat') {
      s.radius += 2.6;
      s.life -= 0.022;
      if (s.life <= 0 || s.radius >= s.maxRadius) splashes.splice(i, 1);
    } else {
      // droplet
      s.x += s.vx;
      s.y += s.vy;
      s.vy += s.gravity;
      s.vx *= s.drag;
      s.vy *= s.drag;
      s.life -= 0.022;
      if (s.life <= 0) splashes.splice(i, 1);
    }
  }

  // ---------- Draw ----------
  ctx.clearRect(0, 0, W, H);

  const zoneTop = getPlayerZoneTop();

  // ---- Top block background (people walking) ----
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, zoneTop);
  ctx.clip();
  if (backgroundTop.loaded) {
    drawCoverImage(backgroundTop.img, 0, 0, W, zoneTop);
  } else if (backgroundFallback.loaded) {
    drawCoverImage(backgroundFallback.img, 0, 0, W, zoneTop);
  } else {
    const grad = ctx.createLinearGradient(0, 0, W, zoneTop);
    grad.addColorStop(0, '#fdf3c7');
    grad.addColorStop(1, '#e8e2d3');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, zoneTop);
  }
  ctx.restore();

  // ---- Bottom block background (player) ----
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, zoneTop, W, H - zoneTop);
  ctx.clip();
  if (backgroundBottom.loaded) {
    drawCoverImage(backgroundBottom.img, 0, zoneTop, W, H - zoneTop);
  } else if (backgroundFallback.loaded) {
    drawCoverImage(backgroundFallback.img, 0, 0, W, H);
  } else {
    const grad = ctx.createLinearGradient(0, zoneTop, 0, H);
    grad.addColorStop(0, '#d9c49a');
    grad.addColorStop(1, '#c7b299');
    ctx.fillStyle = grad;
    ctx.fillRect(0, zoneTop, W, H - zoneTop);
  }
  ctx.restore();

  // Divider / shadow between the two blocks
  drawPlayerZone();

  // Draw water drops in flight (behind pedestrians)
  for (const d of waterDrops) {
    if (d.arrived) continue;
    const angle = Math.atan2(d.vy, d.vx);
    drawWaterDrop(ctx, d.x, d.y, 10, angle);
  }

  // Draw pedestrians in the top block (they never enter the player block)
  for (const p of pedestrians) {
    // Golden Endless pedestrian: soft halo so the bonus is easy to spot.
    if (p.bonus && !p.splashing) {
      ctx.save();
      const glow = ctx.createRadialGradient(p.x, p.y, 6, p.x, p.y, 46);
      glow.addColorStop(0, 'rgba(255, 215, 0, 0.75)');
      glow.addColorStop(1, 'rgba(255, 215, 0, 0)');
      ctx.globalAlpha = 0.65 + Math.sin(p.phase) * 0.2;
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 46, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    drawCharacter(ctx, p);
  }

  // Draw player/thrower character in the bottom block
  try {
    if (typeof drawPlayer === 'function') {
      drawPlayer(ctx, W / 2, getPlayerY());
    } else if (typeof drawThrower === 'function') {
      drawThrower(ctx, W / 2, getPlayerY(), 1.0);
    }
  } catch (e) {
    // ignore
  }

  // Draw splash particles
  for (const s of splashes) {
    ctx.save();
    ctx.globalAlpha = s.life;
    ctx.fillStyle = s.color;
    if (s.type === 'splat') {
      // Expanding translucent splat ring
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
      // outer edge
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2 * s.life;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // droplet
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius * s.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.x - 1, s.y - 1, s.radius * 0.35 * s.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Only keep the loop alive while the level is still running.
  if (state === 'playing') {
    animFrame = requestAnimationFrame(loop);
  }
}

// ---------- Input ----------
function press(x, y) {
  if (state !== 'playing') return;
  addWaterDrop(x, y);
}

canvas.addEventListener('pointerdown', (e) => {
  // Use offsetX/offsetY relative to canvas, scaled by internal resolution / CSS display size
  const scaleX = canvas.width / Math.max(canvas.clientWidth, 1);
  const scaleY = canvas.height / Math.max(canvas.clientHeight, 1);
  const x = e.offsetX * scaleX;
  const y = e.offsetY * scaleY;
  press(x, y);
});

// ---------- Menus / navigation ----------
function goToTitle() {
  state = 'title';
  UI.showScreen('screen-title');
}

function goToMode() {
  state = 'mode';
  renderMode();
  UI.showScreen('screen-mode');
}

function goToLevels() {
  state = 'levels';
  renderLevels();
  UI.showScreen('screen-levels');
}

function getNextPlayableLevel(afterId) {
  const idx = LEVELS.findIndex((lvl) => lvl.id === afterId);
  if (idx < 0) return null;
  for (let i = idx + 1; i < LEVELS.length; i++) {
    if (LEVELS[i].playable !== false) return LEVELS[i];
  }
  return null;
}

function continueAfterClear() {
  // Day 4 finishes the festival — Continue returns to mode selection so the
  // newly unlocked Endless Mode is immediately visible.
  if (currentLevel && currentLevel.day === 4) {
    goToMode();
    return;
  }
  const next = getNextPlayableLevel(currentLevel ? currentLevel.id : null);
  if (next) startLevel(next);
  else goToLevels();
}

function updatePauseLabels() {
  const endlessMode = currentMode === 'endless';
  const restart = document.getElementById('btn-restart-pause');
  const quit = document.getElementById('btn-levels-pause');
  if (restart) restart.textContent = endlessMode ? 'RESTART RUN' : 'RESTART LEVEL';
  if (quit) quit.textContent = endlessMode ? 'QUIT RUN' : 'BACK TO LEVELS';
}

function renderLevels() {
  const list = document.getElementById('level-list');
  if (!list) return;

  list.innerHTML = '';
  LEVELS.forEach((lvl) => {
    const done = !!progress.completed[lvl.id];
    const playable = lvl.playable !== false;

    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'level-card';
    if (done) card.classList.add('completed');
    if (!playable) card.classList.add('locked');
    card.dataset.level = lvl.id;

    const num = document.createElement('span');
    num.className = 'level-num';
    num.textContent = String(lvl.day);

    const info = document.createElement('span');
    info.className = 'level-info';

    const name = document.createElement('span');
    name.className = 'level-name mm';
    name.lang = 'my';
    name.textContent = lvl.name;

    const sub = document.createElement('span');
    sub.className = 'level-sub';
    sub.textContent = done ? 'Completed' : (playable ? lvl.tagline : 'Coming soon');

    info.appendChild(name);
    info.appendChild(sub);

    const status = document.createElement('span');
    status.className = 'level-status' + (done ? ' done' : (!playable ? ' lock' : ' play'));
    status.textContent = done ? '✓' : (!playable ? '🔒' : '▶');

    card.appendChild(num);
    card.appendChild(info);
    card.appendChild(status);
    card.addEventListener('click', () => onLevelClick(lvl));
    list.appendChild(card);
  });

  const note = document.getElementById('levels-note');
  if (note) {
    const doneCount = LEVELS.filter((lvl) => progress.completed[lvl.id]).length;
    note.textContent = `${doneCount} / ${LEVELS.length} days completed`;
    note.classList.toggle('unlocked', doneCount === LEVELS.length);
  }
}

function onLevelClick(lvl) {
  if (lvl.playable === false) {
    const note = document.getElementById('levels-note');
    if (note) {
      note.textContent = `${lvl.name} is coming soon.`;
      note.classList.remove('unlocked');
    }
    return;
  }
  startLevel(lvl);
}

function renderMode() {
  const unlocked = isEndlessUnlocked();
  const endlessBtn = document.getElementById('btn-endless');
  const lockIcon = document.getElementById('endless-lock');
  const endlessSub = document.getElementById('endless-sub');
  const note = document.getElementById('mode-note');

  if (endlessBtn) endlessBtn.classList.toggle('locked', !unlocked);
  if (lockIcon) lockIcon.textContent = unlocked ? '✓' : '🔒';
  if (endlessSub) {
    endlessSub.textContent = unlocked
      ? 'Endless challenge unlocked'
      : 'Locked until all 4 days are complete';
  }
  if (note) {
    note.classList.toggle('unlocked', unlocked);
    note.textContent = unlocked
      ? 'All 4 days complete — Endless Mode is unlocked!'
      : 'Complete all 4 days to unlock Endless Mode.';
  }
}

// ---------- Wire up buttons ----------
// Title: exactly Start Game / How to Play / Quit Game
document.getElementById('btn-start').addEventListener('click', goToMode);
document.getElementById('btn-how').addEventListener('click', () => {
  state = 'how';
  UI.showScreen('screen-how');
});
document.getElementById('btn-quit').addEventListener('click', () => {
  // Browsers only allow window.close() for script-opened windows; try it,
  // then fall back to an exit message when the tab cannot be closed.
  try { window.close(); } catch (e) { /* ignore */ }
  setTimeout(() => {
    if (!document.hidden) {
      state = 'quit';
      UI.showScreen('screen-quit');
    }
  }, 120);
});
document.getElementById('btn-back-menu').addEventListener('click', goToTitle);
document.getElementById('btn-back-quit').addEventListener('click', goToTitle);

// Mode selection
document.getElementById('btn-days').addEventListener('click', goToLevels);
document.getElementById('btn-endless').addEventListener('click', () => {
  if (!isEndlessUnlocked()) {
    // Locked: show the requirement instead of starting gameplay.
    renderMode();
    const note = document.getElementById('mode-note');
    if (note) {
      note.textContent = 'Complete all 4 days to unlock Endless Mode.';
      note.classList.remove('unlocked');
      note.classList.remove('shake');
      void note.offsetWidth; // restart the animation
      note.classList.add('shake');
      setTimeout(() => note.classList.remove('shake'), 450);
    }
    return;
  }
  startEndless();
});
document.getElementById('btn-back-mode').addEventListener('click', goToTitle);
document.getElementById('btn-back-levels').addEventListener('click', goToMode);

// Pause
document.getElementById('btn-pause').addEventListener('click', () => {
  if (state !== 'playing') return;
  state = 'paused';
  updatePauseLabels();
  UI.showScreen('screen-pause');
});
document.getElementById('btn-resume').addEventListener('click', () => {
  if (state !== 'paused') return;
  state = 'playing';
  UI.showScreen('screen-game');
  last = performance.now();
  requestAnimationFrame(loop);
});
document.getElementById('btn-restart-pause').addEventListener('click', () => {
  if (currentMode === 'endless') startEndless();
  else if (currentLevel) startLevel(currentLevel);
});
document.getElementById('btn-levels-pause').addEventListener('click', () => {
  // "Quit Run" in Endless goes back to mode selection; Days returns to levels.
  if (currentMode === 'endless') goToMode();
  else goToLevels();
});
document.getElementById('btn-menu-pause').addEventListener('click', goToTitle);

// Victory / failure
document.getElementById('btn-next').addEventListener('click', continueAfterClear);
document.getElementById('btn-retry-clear').addEventListener('click', () => {
  if (currentMode === 'endless') startEndless();
  else if (currentLevel) startLevel(currentLevel);
});
document.getElementById('btn-levels-clear').addEventListener('click', () => {
  // Day 4's clear screen says "Back to Main Menu".
  if (currentLevel && currentLevel.day === 4) goToTitle();
  else goToLevels();
});
document.getElementById('btn-retry-go').addEventListener('click', () => {
  if (currentMode === 'endless') startEndless();
  else if (currentLevel) startLevel(currentLevel);
});
document.getElementById('btn-levels-go').addEventListener('click', () => {
  if (currentMode === 'endless') goToTitle();
  else goToLevels();
});

// Init UI module
UI.init();

// Render menu state once, then start on the title screen.
renderMode();
renderLevels();
UI.showScreen('screen-title');
