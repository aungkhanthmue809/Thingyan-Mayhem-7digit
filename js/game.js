/**
 * Thingyan Mayhem — Game Engine (Level 1 MVP)
 * Single-file logic split across modules. Follows the Thingyan_Mayhem_Game_Blueprint.docx.
 * Competition-ready: HTML5 canvas, touch + mouse, mobile-first portrait, responsive canvas.
 */

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const gameScreen = document.getElementById('screen-game');

// ---------- Level 1 Config (from blueprint) ----------
const LEVEL_1 = {
  id: 1,
  name: 'First Splash',
  duration: 45, // seconds
  startingHearts: 3,
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

// ---------- State ----------
let W, H;
let state = 'title'; // title | how | playing | paused | clear | gameover
let currentLevel = null;
let timeLeft = 0;
let hearts = 0;
let score = 0;
let combo = 0;
let lastComboTime = 0;
let mission = null;
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

// ---------- Gameplay ----------
function startLevel(config) {
  currentLevel = config;
  timeLeft = config.duration;
  hearts = config.startingHearts;
  score = 0;
  combo = 0;
  pedestrians = [];
  splashes = [];
  waterDrops = [];
  mission = { ...config.objectives[0], completed: 0 };
  const firstTarget = Array.isArray(mission.targetType) ? mission.targetType[0] : mission.targetType;
  const targetTemplate = pickTemplateById(firstTarget);
  mission.description = `Splash <b class="target-word">${mission.required} ${targetTemplate.goalPlural}</b>`;
  // Auto-built avoid-hint from the people who cost a life (kept in sync with resolveSplash)
  const penaltyIds = ['busy_woman', 'aunt'];
  const avoidText = penaltyIds.map((id) => pickTemplateById(id).label).join(' & ');
  mission.description += ` &nbsp;•&nbsp; avoid the <b class="avoid-word">${avoidText}</b>`;
  last = performance.now();
  timeAcc = 0;
  spawnTimer = 25;
  state = 'playing';
  UI.showScreen('screen-game');
  resizeCanvas(); // re-measure now that the screen is visible (HUD/canvas offsets are real)
  UI.setHud(hearts, timeLeft, score, combo);
  UI.setMission(mission.description, mission.completed, mission.required);
  spawnPedestrian('man_red'); // guaranteed first appearance so you always see him
  requestAnimationFrame(loop);
}

function spawnPedestrian(forceTemplateId) {
  // Limit how many people are on screen at once (keeps it readable & fair)
  if (pedestrians.length >= 4) return false;

  const t = forceTemplateId ? pickTemplateById(forceTemplateId) : pickTemplate();
  const dir = Math.random() < 0.5 ? 1 : -1;
  const x = dir === 1 ? -50 : W + 50;
  const y = H * 0.32 + Math.random() * (H * 0.42);
  pedestrians.push({
    x: x,
    y: y,
    dir: dir,
    vx: t.speed * dir * (0.85 + Math.random() * 0.45),
    template: t,
    phase: Math.random() * Math.PI * 2,
    radius: 30 * t.scale,
    splashing: false,
    dead: false,
    spawnTime: performance.now(),
  });
  // Much slower spawn rate — people trickle through instead of crowding
  spawnTimer = 70 - Math.min(mission.completed * 3, 45);
  if (spawnTimer < 28) spawnTimer = 28;
}

function addWaterDrop(tx, ty) {
  // Start from the water gun's nozzle (bottom center of the stage)
  const sx = W / 2;
  const sy = H - 100;
  const dx = tx - sx;
  const dy = ty - sy;
  const dist = Math.hypot(dx, dy);
  const speed = 12;
  waterDrops.push({
    x: sx,
    y: sy,
    targetX: tx,
    targetY: ty,
    vx: (dx / dist) * speed,
    vy: (dy / dist) * speed,
    life: 1.0,
    arrived: false,
  });
  playSound('splash'); // water throw sound
  triggerShot(dx, dy); // gun kicks back AND swivels to face the shot direction
}

function resolveSplashAt(tx, ty) {
  // Forgiving hit zone: larger than the visual character so water connects easily
  const HIT_MULTIPLIER = 1.45;
  let hit = null;
  let bestDist = Infinity;
  for (let i = pedestrians.length - 1; i >= 0; i--) {
    const p = pedestrians[i];
    if (p.dead || p.splashing) continue;
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
    const isTarget = targetTypes.includes(hit.template.id);
    resolveSplash(hit, isTarget);
  } else {
    UI.floatText(gameScreen, tx, ty - 30, 'Miss', '#888');
  }
}

function resolveSplash(p, isTarget) {
  p.splashing = true;
  p.dead = true;

  if (isTarget) {
    const now = Date.now();
    if (now - lastComboTime < 2000) {
      combo++;
    } else {
      combo = 1;
    }
    lastComboTime = now;

    const points = 100 + (combo - 1) * 25;
    score += points;
    mission.completed++;

    if (combo > 1) playSound('combo');

    addSplash(p.x, p.y, p.template.drop || p.template.shirt, true);
    UI.floatText(gameScreen, p.x, p.y - 40, `+${points} ${combo > 1 ? `x${combo}` : ''}`, '#2a9d8f');

    UI.setHud(hearts, timeLeft, score, combo);
    UI.setMission(mission.description, mission.completed, mission.required);

    if (mission.completed >= mission.required) {
      endLevel(true);
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
  state = win ? 'clear' : 'gameover';
  cancelAnimationFrame(animFrame);

  if (win) {
    const bonus = hearts > 0 ? hearts * 50 : 0;
    const timeBonus = Math.max(0, Math.floor(timeLeft)) * 2;
    score += bonus + timeBonus + 300;
    playSound('complete');

    UI.setClearTitle('LEVEL CLEARED!', 'Mission complete.');
    UI.showClear(score, hearts, timeLeft);
  } else {
    playSound('mistake');
    UI.setClearTitle('GAME OVER', reason);
    UI.showGameOver(score, reason);
  }
}

// ---------- Main Loop ----------
function loop(t) {
  if (state !== 'playing') return;
  const dt = t - last;
  last = t;

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
        pedestrians.splice(i, 1);
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

  // Stage background
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#fdf3c7');
  grad.addColorStop(1, '#e8e2d3');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Stage platform
  ctx.fillStyle = '#d9c49a';
  ctx.fillRect(0, H * 0.82, W, H * 0.18);
  ctx.fillStyle = '#c7b299';
  ctx.fillRect(0, H * 0.82, W, 5);

  // Draw player/thrower character
  try {
    if (typeof drawPlayer === 'function') {
      drawPlayer(ctx, W / 2, H - 52); // anchored to the bottom of the play field
    } else if (typeof drawThrower === 'function') {
      drawThrower(ctx, W / 2, H * 0.82 - 35, 1.0);
    }
  } catch (e) {
    // ignore
  }

  // Draw water drops in flight (behind pedestrians)
  for (const d of waterDrops) {
    if (d.arrived) continue;
    const angle = Math.atan2(d.vy, d.vx);
    drawWaterDrop(ctx, d.x, d.y, 8, angle);
  }

  // Draw pedestrians
  for (const p of pedestrians) {
    drawCharacter(ctx, p);
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

  animFrame = requestAnimationFrame(loop);
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

// ---------- Wire up buttons ----------
document.getElementById('btn-play').addEventListener('click', () => {
  UI.showScreen('screen-how');
});
document.getElementById('btn-how').addEventListener('click', () => {
  UI.showScreen('screen-how');
});
document.getElementById('btn-back-menu').addEventListener('click', () => {
  UI.showScreen('screen-title');
});
document.getElementById('btn-start-from-how').addEventListener('click', () => {
  startLevel(LEVEL_1);
});

document.getElementById('btn-pause').addEventListener('click', () => {
  if (state !== 'playing') return;
  state = 'paused';
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
  startLevel(LEVEL_1);
});
document.getElementById('btn-menu-pause').addEventListener('click', () => {
  state = 'title';
  UI.showScreen('screen-title');
});

document.getElementById('btn-next').addEventListener('click', () => {
  state = 'title';
  UI.showScreen('screen-title');
});
document.getElementById('btn-retry-clear').addEventListener('click', () => {
  startLevel(LEVEL_1);
});
document.getElementById('btn-menu-clear').addEventListener('click', () => {
  state = 'title';
  UI.showScreen('screen-title');
});

document.getElementById('btn-retry-go').addEventListener('click', () => {
  startLevel(LEVEL_1);
});
document.getElementById('btn-menu-go').addEventListener('click', () => {
  state = 'title';
  UI.showScreen('screen-title');
});

// Init UI module
UI.init();

// Start on title
UI.showScreen('screen-title');
