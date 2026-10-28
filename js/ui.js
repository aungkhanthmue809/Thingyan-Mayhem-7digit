/**
 * Thingyan Mayhem — UI Helpers
 * DOM updates and floating text. Called by game.js.
 */

const UI = {
  els: {},

  init() {
    this.els = {
      hudHearts: document.getElementById('hud-hearts'),
      hudTimer: document.getElementById('hud-timer'),
      hudScore: document.getElementById('hud-score'),
      hudCombo: document.getElementById('hud-combo'),
      comboVal: document.getElementById('combo-val'),
      missionDesc: document.getElementById('mission-desc'),
      missionProgress: document.getElementById('mission-progress'),
      missionFill: document.getElementById('mission-fill'),
      resScore: document.getElementById('res-score'),
      resHearts: document.getElementById('res-hearts'),
      resTime: document.getElementById('res-time'),
      resFinalScore: document.getElementById('res-final-score'),
      clearTitle: document.getElementById('clear-title'),
      clearMsg: document.getElementById('clear-msg'),
      goTitle: document.getElementById('go-title'),
      goMsg: document.getElementById('go-msg'),
    };
  },

  setHud(hearts, timer, score, combo) {
    let h = '';
    for (let i = 0; i < 3; i++) {
      h += i < hearts
        ? '<img class="life-icon" src="assets/life/life.png" alt="life">'
        : '<img class="life-icon life-lost" src="assets/life/life.png" alt="lost life">';
    }
    this.els.hudHearts.innerHTML = h;
    this.els.hudTimer.textContent = Math.max(0, Math.ceil(timer));
    this.els.hudScore.textContent = score;
    if (combo > 1) {
      this.els.hudCombo.style.display = 'block';
      this.els.comboVal.textContent = combo;
    } else {
      this.els.hudCombo.style.display = 'none';
    }
  },

  setMission(desc, current, required) {
    this.els.missionDesc.innerHTML = desc;
    this.els.missionProgress.textContent = `${current} / ${required}`;
    const pct = required > 0 ? Math.min(100, (current / required) * 100) : 0;
    this.els.missionFill.style.width = `${pct}%`;
  },

  showClear(score, hearts, timeLeft) {
    this.els.resScore.textContent = score;
    this.els.resHearts.innerHTML = '<img class="life-icon" src="assets/life/life.png" alt="life">'.repeat(hearts);
    this.els.resTime.textContent = Math.max(0, Math.ceil(timeLeft));
    this.showScreen('screen-clear');
  },

  showGameOver(score, reason) {
    this.els.resFinalScore.textContent = score;
    this.els.goMsg.textContent = reason || 'Level failed.';
    this.showScreen('screen-gameover');
  },

  setClearTitle(title, msg) {
    this.els.clearTitle.textContent = title;
    this.els.clearMsg.textContent = msg;
  },

  showScreen(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  },

  // Floating text above canvas (absolute positioned DOM elements for crisp text)
  floatText(container, x, y, text, color, duration = 900) {
    const el = document.createElement('div');
    el.textContent = text;
    el.style.position = 'absolute';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.color = color;
    el.style.fontWeight = '900';
    el.style.fontSize = '1.2rem';
    el.style.pointerEvents = 'none';
    el.style.zIndex = '30';
    el.style.textShadow = '1px 1px 2px rgba(0,0,0,0.25)';
    el.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;
    container.appendChild(el);

    // Kick off animation in next frame
    requestAnimationFrame(() => {
      el.style.transform = 'translateY(-40px)';
      el.style.opacity = '0';
    });

    setTimeout(() => el.remove(), duration);
  },
};
