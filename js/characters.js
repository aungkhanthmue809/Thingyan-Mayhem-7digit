/**
 * Thingyan Mayhem — Characters & Placeholder Art
 * All art is drawn programmatically with Canvas 2D so the game is playable
 * immediately. Drop your own illustrated sprites into assets/ and replace
 * drawCharacter() when ready.
 */

// Load custom character images
const customCharacterImg = new Image();
let customCharacterLoaded = false;
customCharacterImg.src = 'assets/character.png';
customCharacterImg.onload = () => { customCharacterLoaded = true; };
customCharacterImg.onerror = () => { customCharacterLoaded = false; };

// Load player/thrower character image
const playerCharacterImg = new Image();
let playerCharacterLoaded = false;
playerCharacterImg.src = 'assets/player.png';
playerCharacterImg.onload = () => { playerCharacterLoaded = true; };
playerCharacterImg.onerror = () => { playerCharacterLoaded = false; };

// Per-template custom images (can be replaced later)
const templateImages = {};
const templateImageLoaded = {};

function loadTemplateImage(templateId, src) {
  if (!templateImages[templateId]) {
    templateImages[templateId] = new Image();
    templateImageLoaded[templateId] = false;
    templateImages[templateId].src = src;
    templateImages[templateId].onload = () => { templateImageLoaded[templateId] = true; };
    templateImages[templateId].onerror = () => { templateImageLoaded[templateId] = false; };
  }
}

// Multi-frame walk cycle support — a template may own an array of walk frames
const templateWalkFrames = {};   // templateId -> [Image, Image, ...]
const templateWalkFramesLoaded = {}; // templateId -> boolean

// Single "wet/soaked" reaction frame per template
const templateWetFrames = {};    // templateId -> Image
const templateWetFramesLoaded = {}; // templateId -> boolean

function loadTemplateWetFrame(templateId, src) {
  if (templateWetFrames[templateId]) return;
  const img = new Image();
  img.onload = () => { templateWetFramesLoaded[templateId] = true; };
  img.onerror = () => { templateWetFramesLoaded[templateId] = false; };
  img.src = src;
  templateWetFrames[templateId] = img;
}

function loadTemplateWalkFrames(templateId, sources) {
  if (templateWalkFrames[templateId]) return;
  const frames = [];
  let loadedCount = 0;
  sources.forEach((src) => {
    const img = new Image();
    img.onload = () => {
      loadedCount++;
      if (loadedCount === sources.length) templateWalkFramesLoaded[templateId] = true;
    };
    img.onerror = () => { templateWalkFramesLoaded[templateId] = false; };
    img.src = src;
    frames.push(img);
  });
  templateWalkFrames[templateId] = frames;
}

const CHAR_TEMPLATES = [
  // id = exact folder name under assets/. roles: target / distractor / hazard
  // goal / goalPlural = how the mission text names this character when it's the target
  { id: 'aunt',       role: 'distractor', label: 'Aunt',       goal: 'aunt in a maroon top',        goalPlural: 'aunts in maroon tops',   shirt: '#8e3b3b', acc: '#c9c9c9', speed: 1.4, scale: 1.05 },
  { id: 'busy_woman', role: 'distractor', label: 'Busy Woman', goal: 'busy woman with her phone',   goalPlural: 'busy women with phones', shirt: '#b59a7f', acc: '#8d6e55', speed: 1.9, scale: 0.95 },
  { id: 'man_blue',   role: 'distractor', label: 'Man Blue',   goal: 'man in a blue shirt',         goalPlural: 'men in blue shirts',     shirt: '#5aa7d4', acc: '#e0b53c', speed: 1.7, scale: 1.0 },
  { id: 'man_red',    role: 'target',     label: 'Man Red',    goal: 'man in a red shirt',          goalPlural: 'men in red shirts',      shirt: '#c0392b', acc: '#5d4037', speed: 2.0, scale: 0.95 },
  { id: 'woman',      role: 'distractor', label: 'Woman',      goal: 'woman in pink',               goalPlural: 'women in pink',          shirt: '#c2478f', acc: '#e8a0d0', speed: 2.0, scale: 0.95 },
  { id: 'kid',        role: 'distractor', label: 'Kid',        goal: 'kid in the green splash tee', goalPlural: 'kids in green tees',     shirt: '#3faf4c', acc: '#45a3e5', speed: 1.8, scale: 0.95, drop: '#45a3e5' },
];

// Load 2-frame walk cycles for every illustrated character (folder name = character id)
loadTemplateWalkFrames('aunt',       ['assets/aunt/walk_1.png',       'assets/aunt/walk_2.png']);
loadTemplateWalkFrames('busy_woman', ['assets/busy_woman/walk_1.png', 'assets/busy_woman/walk_2.png']);
loadTemplateWalkFrames('man_blue',   ['assets/man_blue/walk_1.png',   'assets/man_blue/walk_2.png']);
loadTemplateWalkFrames('man_red',    ['assets/man_red/walk_1.png',    'assets/man_red/walk_2.png']);
loadTemplateWalkFrames('woman',      ['assets/woman/walk_1.png',      'assets/woman/walk_2.png']);

// Load walk frames for the kid template
loadTemplateWalkFrames('kid', ['assets/kid/walk_1.png', 'assets/kid/walk_2.png']);
// Load wet (soaked) reaction frame for the kid
loadTemplateWetFrame('kid', 'assets/kid/wet.png');

function pickTemplate() {
  // Weighted: more targets than hazards/distractors for a fair feel
  const weights = [4, 2, 2, 2, 2, 3];
  let total = 0;
  for (const w of weights) total += w;
  let r = Math.random() * total;
  for (let i = 0; i < CHAR_TEMPLATES.length; i++) {
    r -= weights[i];
    if (r <= 0) return CHAR_TEMPLATES[i];
  }
  return CHAR_TEMPLATES[0];
}

function pickTemplateById(id) {
  return CHAR_TEMPLATES.find((t) => t.id === id) || CHAR_TEMPLATES[0];
}

function shadeColor(hex, amt) {
  let c = hex.substring(1);
  let num = parseInt(c, 16);
  let r = Math.max(0, Math.min(255, (num >> 16) + amt));
  let g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt));
  let b = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
  return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
}

function drawCharacter(ctx, p) {
  const t = p.template;
  const s = p.scale || 1;
  const bob = Math.sin(p.phase) * (3 * s);
  const legSwing = Math.sin(p.phase * 2.5) * (4 * s);
  const x = p.x;
  const y = p.y + bob;
  const r = 24 * s; // head radius

  ctx.save();
  ctx.translate(x, y);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath();
  ctx.ellipse(0, r + 12 * s, r * 0.9, 6 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wet/soaked reaction:
  //  - has wet image  -> draw the wet frame (constant size, sinks & fades out)
  //  - no wet image   -> the character simply disappears; the water splash
  //                      animation drawn separately covers the spot
  const wetFrame = templateWetFramesLoaded[t.id] ? templateWetFrames[t.id] : null;
  if (p.splashing) {
    if (wetFrame) {
      // Fade factor follows the splash shrink progress (radius: 30*scale -> ~3)
      const fade = Math.max(0, Math.min(1, (p.radius - 3) / (30 * t.scale - 3)));
      const imgH = 110 * s; // constant size — no shrinking, just sinks & fades
      const imgW = imgH * (wetFrame.width / wetFrame.height);
      ctx.save();
      ctx.globalAlpha = fade;
      if (p.dir === -1) ctx.scale(-1, 1);
      ctx.drawImage(wetFrame, -imgW / 2, -imgH / 2 + 10 * s, imgW, imgH);
      ctx.restore();
    }
    // Skip all other rendering whether or not a wet frame was drawn
    ctx.restore();
    return;
  }

  // Walk-cycle frames take priority, then per-template image, then generic
  const tmplImg = templateImages[t.id];
  const tmplLoaded = templateImageLoaded[t.id];
  const walkFramesArr = (templateWalkFramesLoaded[t.id] && !p.splashing) ? templateWalkFrames[t.id] : null;
  if (walkFramesArr) {
    // Cycle frames driven by the pedestrian's own phase (keeps each person unique)
    const frame = walkFramesArr[Math.floor(p.phase / 2.5) % walkFramesArr.length];
    const imgH = 110 * s;
    const imgW = imgH * (frame.width / frame.height); // preserve aspect
    if (p.dir === -1) {
      ctx.scale(-1, 1);
    }
    ctx.drawImage(frame, -imgW / 2, -imgH / 2 + 10 * s, imgW, imgH);
    if (p.dir === -1) {
      ctx.scale(-1, 1);
    }
  } else if (tmplLoaded && tmplImg) {
    if (p.dir === -1) {
      ctx.scale(-1, 1);
    }
    const imgWidth = 70 * s;
    const imgHeight = 90 * s;
    ctx.drawImage(tmplImg, -imgWidth/2, -imgHeight/2 + 10*s, imgWidth, imgHeight);
    if (p.dir === -1) {
      ctx.scale(-1, 1);
    }
  } else if (customCharacterLoaded) {
    if (p.dir === -1) {
      ctx.scale(-1, 1);
    }
    // Draw custom character image
    const imgWidth = 70 * s;
    const imgHeight = 90 * s;
    ctx.drawImage(customCharacterImg, -imgWidth/2, -imgHeight/2 + 10*s, imgWidth, imgHeight);
    if (p.dir === -1) {
      ctx.scale(-1, 1);
    }
  } else {
    // Legs
    ctx.strokeStyle = '#6b4226';
    ctx.lineWidth = 5 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-7 * s, r + 4 * s);
    ctx.lineTo(-7 * s - legSwing, r + 4 * s + 24 * s);
    ctx.moveTo(7 * s, r + 4 * s);
    ctx.lineTo(7 * s + legSwing, r + 4 * s + 24 * s);
    ctx.stroke();

    // Feet
    ctx.fillStyle = '#4a3728';
    ctx.beginPath();
    ctx.arc(-7 * s - legSwing, r + 30 * s, 7 * s, 0, Math.PI * 2);
    ctx.arc(7 * s + legSwing, r + 30 * s, 7 * s, 0, Math.PI * 2);
    ctx.fill();

    // Body (shirt)
    ctx.fillStyle = t.shirt;
    const bodyW = r * 1.7;
    const bodyH = r * 1.25;
    const bodyX = -bodyW / 2;
    const bodyY = r - 4 * s;
    ctx.beginPath();
    ctx.roundRect
      ? ctx.roundRect(bodyX, bodyY, bodyW, bodyH, 7 * s)
      : ctx.fillRect(bodyX, bodyY, bodyW, bodyH);
    ctx.fill();

    // Sleeves
    ctx.fillStyle = shadeColor(t.shirt, -25);
    ctx.fillRect(bodyX - 2 * s, bodyY - 2 * s, r * 0.5, r * 0.6);
    ctx.fillRect(bodyX + bodyW - r * 0.5 + 2 * s, bodyY - 2 * s, r * 0.5, r * 0.6);

    // Arms
    ctx.strokeStyle = '#f4a261';
    ctx.lineWidth = 5 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(bodyX, r + 2 * s);
    ctx.lineTo(bodyX - r * 0.55, r + 2 * s + legSwing * 0.6);
    ctx.moveTo(bodyX + bodyW, r + 2 * s);
    ctx.lineTo(bodyX + bodyW + r * 0.55, r + 2 * s - legSwing * 0.6);
    ctx.stroke();

    // Head
    ctx.fillStyle = '#f4a261';
    ctx.beginPath();
    ctx.arc(0, -r * 0.35, r * 0.52, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = '#3d2b1f';
    ctx.beginPath();
    ctx.arc(0, -r * 0.55, r * 0.5, -0.2 * Math.PI, 1.2 * Math.PI);
    ctx.fill();

    // Accessory (hat / headband)
    if (t.acc) {
      ctx.fillStyle = t.acc;
      ctx.beginPath();
      ctx.ellipse(0, -r * 1.05, r * 0.6, r * 0.26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = shadeColor(t.acc, -30);
      ctx.fillRect(-r * 0.6, -r * 1.05, r * 1.2, r * 0.14);
    }

    // Face
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(-r * 0.14, -r * 0.4, r * 0.055, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(r * 0.14, -r * 0.4, r * 0.055, 0, Math.PI * 2);
    ctx.fill();

    // Expression: angry for hazards
    if (t.role === 'hazard') {
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.moveTo(-r * 0.18, -r * 0.18);
      ctx.lineTo(-r * 0.06, -r * 0.04);
      ctx.moveTo(r * 0.06, -r * 0.04);
      ctx.lineTo(r * 0.18, -r * 0.18);
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawWaterDrop(ctx, x, y, size, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = '#72c3dc';
  ctx.beginPath();
  ctx.moveTo(0, -size * 1.6);
  ctx.bezierCurveTo(-size * 0.9, -size * 0.6, -size * 1.4, size * 0.4, 0, size * 1.4);
  ctx.bezierCurveTo(size * 1.4, size * 0.4, size * 0.9, -size * 0.6, 0, -size * 1.6);
  ctx.fill();
  // highlight
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-size * 0.25, -size * 0.9, size * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSplash(ctx, x, y, size, life) {
  ctx.save();
  ctx.globalAlpha = life;
  ctx.translate(x, y);
  ctx.fillStyle = '#72c3dc';
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.9 * life, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.5 * life, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawComboText(ctx, x, y, text, life) {
  ctx.save();
  ctx.globalAlpha = life;
  ctx.fillStyle = '#e63946';
  ctx.font = `bold ${20 * life}px system-ui`;
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawWaterDrop(ctx, x, y, size, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = '#72c3dc';
  ctx.beginPath();
  ctx.moveTo(0, -size * 1.6);
  ctx.bezierCurveTo(-size * 0.9, -size * 0.6, -size * 1.4, size * 0.4, 0, size * 1.4);
  ctx.bezierCurveTo(size * 1.4, size * 0.4, size * 0.9, -size * 0.6, 0, -size * 1.6);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-size * 0.25, -size * 0.9, size * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawWaterTrail(ctx, drops) {
  for (const d of drops) {
    ctx.save();
    ctx.globalAlpha = d.life;
    ctx.strokeStyle = '#72c3dc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(d.x, d.y);
    ctx.lineTo(d.x - d.vx * 0.3, d.y - d.vy * 0.3);
    ctx.stroke();
    ctx.globalAlpha = d.life * 0.6;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(d.x, d.y, 1.5 * d.life, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Draw the player/thrower character using the walk cycle frames
const playerImg = new Image();
let playerImgLoaded = false;
playerImg.src = 'assets/player.png';
playerImg.onload = () => { playerImgLoaded = true; };
playerImg.onerror = () => { playerImgLoaded = false; };

// Walk cycle frames (2-frame walk animation)
const walkFrames = [];
let walkFramesLoaded = false;
(function loadWalkFrames() {
  let loadedCount = 0;
  ['assets/kid/walk_1.png', 'assets/kid/walk_2.png'].forEach((src) => {
    const img = new Image();
    img.onload = () => {
      loadedCount++;
      if (loadedCount === 2) walkFramesLoaded = true;
    };
    img.onerror = () => {};
    img.src = src;
    walkFrames.push(img);
  });
})();

// Sequential frame index for a smooth 1-1-2-2 cycle (classic 2-frame ping-pong feel)
function getWalkFrameIndex() {
  const FRAME_MS = 180; // ms per frame
  const t = Math.floor(performance.now() / FRAME_MS) % 4;
  return (t === 0 || t === 1) ? 0 : 1; // frame1, frame1, frame2, frame2
}

// Player's water gun ("Hydro-Blast 5000") image
const gunImg = new Image();
let gunImgLoaded = false;
gunImg.onload = () => { gunImgLoaded = true; };
gunImg.onerror = () => { gunImgLoaded = false; };
gunImg.src = 'assets/player/gun.png';

// Recoil: brief "kick" when a shot is fired — the gun springs up, then settles
const RECOIL_MS = 220; // total recoil animation length
let recoilStart = -9999;

// Gun tilt: the weapon rotates to face the direction of the latest shot
let gunAngle = 0;
let gunAngleTarget = 0;

function triggerShot(dx, dy) {
  recoilStart = performance.now();
  // Rotate the barrel toward the shot direction (up = 0), clamped ±0.5 rad
  gunAngleTarget = Math.max(-0.5, Math.min(0.5, Math.atan2(dx, -dy)));
}

// Vertical offset (px) for recoil: rises quickly, falls back down, settles
function getRecoilOffset() {
  const k = (performance.now() - recoilStart) / RECOIL_MS;
  if (k < 0 || k >= 1) return 0;
  return Math.sin(k * Math.PI) * -7; // negative = up first, then back down
}

function drawPlayer(ctx, x, y) {
  const recoil = getRecoilOffset();
  // Ease the gun toward its aimed direction (frames add a small step each draw)
  gunAngle += (gunAngleTarget - gunAngle) * 0.2;

  ctx.save();
  ctx.translate(x, y + recoil);

  // Shadow (stays on the ground even while the gun kicks/rotates)
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath();
  ctx.ellipse(0, 44, 26, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  if (gunImgLoaded) {
    const imgH = 92; // smaller gun so it doesn't dominate the play area
    const imgW = imgH * (gunImg.width / gunImg.height);
    // Rotate around the gun's base so the weapon swivels toward the aim
    ctx.save();
    ctx.translate(0, 42);
    ctx.rotate(gunAngle);
    ctx.drawImage(gunImg, -imgW / 2, -imgH, imgW, imgH);
    ctx.restore();
  } else {
    // Fallback placeholder if the gun image is missing
    ctx.fillStyle = '#457b9d';
    ctx.beginPath();
    ctx.ellipse(-6, -4, 16, 12, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1d3557';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  ctx.restore();
}

function drawThrower(ctx, x, y, scale = 1, aimAngle = 0) {
  const s = scale;
  const bob = Math.sin(performance.now() / 400) * 2 * s;
  const throwX = x;
  const throwY = y + bob;

  ctx.save();
  ctx.translate(throwX, throwY);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath();
  ctx.ellipse(0, 40 * s, 22 * s, 6 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  if (playerCharacterLoaded) {
    const imgWidth = 80 * s;
    const imgHeight = 110 * s;
    ctx.drawImage(playerCharacterImg, -imgWidth/2, -imgHeight/2 + 10*s, imgWidth, imgHeight);
  } else {
    // Legs
    ctx.strokeStyle = '#6b4226';
    ctx.lineWidth = 6 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-8 * s, 26 * s);
    ctx.lineTo(-8 * s, 40 * s);
    ctx.moveTo(8 * s, 26 * s);
    ctx.lineTo(8 * s, 40 * s);
    ctx.stroke();

    // Feet
    ctx.fillStyle = '#4a3728';
    ctx.beginPath();
    ctx.arc(-8 * s, 44 * s, 7 * s, 0, Math.PI * 2);
    ctx.arc(8 * s, 44 * s, 7 * s, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = '#2a9d8f';
    const bodyW = 38 * s;
    const bodyH = 32 * s;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(-bodyW/2, -6 * s, bodyW, bodyH, 8 * s) : ctx.fillRect(-bodyW/2, -6 * s, bodyW, bodyH);
    ctx.fill();

    // Sleeves/arms - throwing pose
    ctx.strokeStyle = '#f4a261';
    ctx.lineWidth = 6 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(bodyW/2 - 2*s, 4*s);
    ctx.lineTo(bodyW/2 + 14*s, -4*s + Math.sin(aimAngle)*2);
    ctx.stroke();

    // Bucket/water container
    ctx.fillStyle = '#457b9d';
    ctx.beginPath();
    ctx.ellipse(bodyW/2 + 18*s, -6*s + Math.sin(aimAngle)*2, 10*s, 8*s, 0.3, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = '#1d3557';
    ctx.lineWidth = 2*s;
    ctx.stroke();

    // Head
    ctx.fillStyle = '#f4a261';
    ctx.beginPath();
    ctx.arc(0, -24*s, 16*s, 0, Math.PI*2);
    ctx.fill();

    // Hair
    ctx.fillStyle = '#3d2b1f';
    ctx.beginPath();
    ctx.arc(0, -28*s, 15*s, -0.1*Math.PI, 1.1*Math.PI);
    ctx.fill();

    // Headband/turban style for Thingyan
    ctx.fillStyle = '#ffb703';
    ctx.beginPath();
    ctx.ellipse(0, -34*s, 16*s, 6*s, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#e76f51';
    ctx.fillRect(-16*s, -37*s, 32*s, 6*s);

    // Face
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(-5*s, -26*s, 2*s, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(5*s, -26*s, 2*s, 0, Math.PI*2);
    ctx.fill();
    // Smile
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2*s;
    ctx.beginPath();
    ctx.arc(0, -24*s, 6*s, 0.1*Math.PI, 0.9*Math.PI);
    ctx.stroke();
  }

  ctx.restore();
}
