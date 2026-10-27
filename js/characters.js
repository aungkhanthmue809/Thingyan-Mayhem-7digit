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

const CHAR_TEMPLATES = [
  // id, role, label, shirt color, accessory color, speed, size
  { id: 'child_red',   role: 'target',  label: 'Child in red',   shirt: '#e63946', acc: '#ffb703', speed: 2.0, scale: 0.85 },
  { id: 'child_blue',  role: 'distractor', label: 'Child in blue', shirt: '#457b9d', acc: '#ffb703', speed: 1.9, scale: 0.85 },
  { id: 'person_green',role: 'distractor', label: 'Person in green',shirt: '#2a9d8f', acc: '#ffb703', speed: 1.7, scale: 1.0 },
  { id: 'auntie',      role: 'hazard',  label: 'Furious Auntie', shirt: '#d00000', acc: '#ffb703', speed: 1.4, scale: 1.05 },
  { id: 'monk',        role: 'hazard',  label: 'Monk',           shirt: '#fb8500', acc: '#fb8500', speed: 1.6, scale: 1.0 },
];

// Try to load images for all templates
for (const t of CHAR_TEMPLATES) {
  loadTemplateImage(t.id, `assets/character_${t.id}.png`);
}

function pickTemplate() {
  // Weighted: more targets than hazards/distractors for a fair feel
  const weights = [4, 2, 2, 1, 1];
  let total = 0;
  for (const w of weights) total += w;
  let r = Math.random() * total;
  for (let i = 0; i < CHAR_TEMPLATES.length; i++) {
    r -= weights[i];
    if (r <= 0) return CHAR_TEMPLATES[i];
  }
  return CHAR_TEMPLATES[0];
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

  // Try per-template image first, then generic custom image
  const tmplImg = templateImages[t.id];
  const tmplLoaded = templateImageLoaded[t.id];
  if (tmplLoaded && tmplImg) {
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

  // Role badge (small colored dot under feet)
  const badgeColor = t.role === 'target' ? '#2a9d8f' : t.role === 'hazard' ? '#e63946' : '#457b9d';
  ctx.fillStyle = badgeColor;
  ctx.beginPath();
  ctx.arc(0, r + 34 * s, 5 * s, 0, Math.PI * 2);
  ctx.fill();

  // Splash / dead tint
  if (p.splashing) {
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -r * 0.35, r * 0.52, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
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

// Draw the player/thrower character (can be replaced with an image later)
const playerImg = new Image();
let playerImgLoaded = false;
playerImg.src = 'assets/player.png';
playerImg.onload = () => { playerImgLoaded = true; };
playerImg.onerror = () => { playerImgLoaded = false; };

function drawPlayer(ctx, x, y) {
  const s = 1.0;
  ctx.save();
  ctx.translate(x, y);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath();
  ctx.ellipse(0, 38 * s, 22 * s, 6 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  if (playerImgLoaded) {
    const imgW = 80 * s;
    const imgH = 110 * s;
    ctx.drawImage(playerImg, -imgW / 2, -imgH / 2 + 8 * s, imgW, imgH);
  } else {
    // Legs
    ctx.strokeStyle = '#6b4226';
    ctx.lineWidth = 6 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-8 * s, 24 * s);
    ctx.lineTo(-8 * s, 38 * s);
    ctx.moveTo(8 * s, 24 * s);
    ctx.lineTo(8 * s, 38 * s);
    ctx.stroke();

    // Feet
    ctx.fillStyle = '#4a3728';
    ctx.beginPath();
    ctx.arc(-8 * s, 42 * s, 7 * s, 0, Math.PI * 2);
    ctx.arc(8 * s, 42 * s, 7 * s, 0, Math.PI * 2);
    ctx.fill();

    // Body (shirt)
    ctx.fillStyle = '#2a9d8f';
    const bodyW = 38 * s;
    const bodyH = 30 * s;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(-bodyW / 2, -6 * s, bodyW, bodyH, 8 * s);
      ctx.fill();
    } else {
      ctx.fillRect(-bodyW / 2, -6 * s, bodyW, bodyH);
    }

    // Head
    ctx.fillStyle = '#f4a261';
    ctx.beginPath();
    ctx.arc(0, -24 * s, 16 * s, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = '#3d2b1f';
    ctx.beginPath();
    ctx.arc(0, -28 * s, 15 * s, -0.1 * Math.PI, 1.1 * Math.PI);
    ctx.fill();

    // Headband
    ctx.fillStyle = '#ffb703';
    ctx.beginPath();
    ctx.ellipse(0, -34 * s, 16 * s, 6 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e76f51';
    ctx.fillRect(-16 * s, -37 * s, 32 * s, 6 * s);

    // Face
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(-5 * s, -26 * s, 2 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(5 * s, -26 * s, 2 * s, 0, Math.PI * 2);
    ctx.fill();
    // Smile
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.arc(0, -24 * s, 6 * s, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();

    // Throwing arm with bucket
    ctx.strokeStyle = '#f4a261';
    ctx.lineWidth = 6 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(bodyW / 2 - 2 * s, 4 * s);
    ctx.lineTo(bodyW / 2 + 16 * s, -6 * s);
    ctx.stroke();

    ctx.fillStyle = '#457b9d';
    ctx.beginPath();
    ctx.ellipse(bodyW / 2 + 20 * s, -8 * s, 10 * s, 8 * s, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1d3557';
    ctx.lineWidth = 2 * s;
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
