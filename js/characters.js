/**
 * Thingyan Mayhem — Characters & Placeholder Art
 * All art is drawn programmatically with Canvas 2D so the game is playable
 * immediately. Drop your own illustrated sprites into assets/ and replace
 * drawCharacter() when ready.
 */

const CHAR_TEMPLATES = [
  // id, role, label, shirt color, accessory color, speed, size
  { id: 'child_red',   role: 'target',  label: 'Child in red',   shirt: '#e63946', acc: '#ffb703', speed: 2.0, scale: 0.85 },
  { id: 'child_blue',  role: 'distractor', label: 'Child in blue', shirt: '#457b9d', acc: '#ffb703', speed: 1.9, scale: 0.85 },
  { id: 'person_green',role: 'distractor', label: 'Person in green',shirt: '#2a9d8f', acc: '#ffb703', speed: 1.7, scale: 1.0 },
  { id: 'auntie',      role: 'hazard',  label: 'Furious Auntie', shirt: '#d00000', acc: '#ffb703', speed: 1.4, scale: 1.05 },
  { id: 'monk',        role: 'hazard',  label: 'Monk',           shirt: '#fb8500', acc: '#fb8500', speed: 1.6, scale: 1.0 },
];

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
