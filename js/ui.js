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
      hudBest: document.getElementById('hud-best'),
      hudCombo: document.getElementById('hud-combo'),
      comboVal: document.getElementById('combo-val'),
      missionDesc: document.getElementById('mission-desc'),
      missionProgress: document.getElementById('mission-progress'),
      missionFill: document.getElementById('mission-fill'),
      missionRow2: document.getElementById('mission-row2'),
      missionDesc2: document.getElementById('mission-desc2'),
      missionProgress2: document.getElementById('mission-progress2'),
      resScore: document.getElementById('res-score'),
      resHearts: document.getElementById('res-hearts'),
      resTime: document.getElementById('res-time'),
      resPeople: document.getElementById('res-people'),
      resCombo: document.getElementById('res-combo'),
      resFinalScore: document.getElementById('res-final-score'),
      resSurvival: document.getElementById('res-survival'),
      resHighscore: document.getElementById('res-highscore'),
      resPrevious: document.getElementById('res-previous'),
      clearTitle: document.getElementById('clear-title'),
      clearMsg: document.getElementById('clear-msg'),
      clearUnlock: document.getElementById('clear-unlock'),
      goTitle: document.getElementById('go-title'),
      goMsg: document.getElementById('go-msg'),
      goRecord: document.getElementById('go-record'),
      btnRetryGo: document.getElementById('btn-retry-go'),
      btnLevelsGo: document.getElementById('btn-levels-go'),
      btnLevelsClear: document.getElementById('btn-levels-clear'),
    };
  },

  renderHearts(hearts, maxHearts = 3, compact = false) {
    if (compact) {
      // Endless can have up to 5 lives — show a compact "❤ 5" instead of icons
      // so the four-box HUD still fits narrow phones.
      this.els.hudHearts.innerHTML = `<span class="heart-count">❤ ${Math.max(0, hearts)}</span>`;
      return;
    }
    let h = '';
    for (let i = 0; i < maxHearts; i++) {
      h += i < hearts
        ? '<img class="life-icon" src="assets/life/life.png" alt="life">'
        : '<img class="life-icon life-lost" src="assets/life/life.png" alt="lost life">';
    }
    this.els.hudHearts.innerHTML = h;
  },

  setHud(hearts, timer, score, combo) {
    this.renderHearts(hearts);
    this.els.hudTimer.textContent = Math.max(0, Math.ceil(timer));
    this.els.hudScore.textContent = score;
    // Day 4 has a combo objective, so keep the box visible even at 0.
    const showCombo = combo > 1 ||
      !document.getElementById('screen-game').classList.contains('hide-combo');
    if (showCombo) {
      this.els.hudCombo.style.display = 'block';
      this.els.comboVal.textContent = combo;
    } else {
      this.els.hudCombo.style.display = 'none';
    }
  },

  // Endless Mode HUD: lives, score, survival clock, and saved best.
  setEndlessHud(hearts, score, elapsed, best) {
    this.renderHearts(hearts, 5, true);
    this.els.hudTimer.textContent = this.formatTime(elapsed);
    this.els.hudScore.textContent = score;
    if (this.els.hudBest) this.els.hudBest.textContent = best;
    // Endless has no combo objective — hide any box left over from Days Mode.
    if (this.els.hudCombo) this.els.hudCombo.style.display = 'none';
  },

  formatTime(seconds) {
    const total = Math.max(0, Math.floor(seconds));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  },

  setMission(desc, current, required) {
    this.els.missionDesc.innerHTML = desc;
    this.els.missionProgress.textContent = `${current} / ${required}`;
    const pct = required > 0 ? Math.min(100, (current / required) * 100) : 0;
    this.els.missionFill.style.width = `${pct}%`;
  },

  // Second objective row (used by အတက် for Best Combo).
  setMission2(desc, current, required, visible) {
    if (!this.els.missionRow2) return;
    this.els.missionRow2.style.display = visible ? 'flex' : 'none';
    if (visible) {
      this.els.missionDesc2.innerHTML = desc;
      this.els.missionProgress2.textContent = `${current} / ${required}`;
    }
  },

  // Free-form mission row (used by Endless for the difficulty indicator).
  setMissionCustom(desc, progressText, pct) {
    this.els.missionDesc.innerHTML = desc;
    this.els.missionProgress.textContent = progressText;
    this.els.missionFill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
  },

  showClear(score, hearts, timeLeft, opts = {}) {
    this.els.resScore.textContent = score;
    this.els.resHearts.innerHTML = '<img class="life-icon" src="assets/life/life.png" alt="life">'.repeat(hearts);
    this.els.resTime.textContent = Math.max(0, Math.ceil(timeLeft));

    const heartsRow = document.getElementById('res-hearts-row');
    if (heartsRow) heartsRow.style.display = opts.showHearts === false ? 'none' : 'flex';

    const peopleRow = document.getElementById('res-people-row');
    if (peopleRow && this.els.resPeople) {
      peopleRow.style.display = opts.people ? 'flex' : 'none';
      if (opts.people) this.els.resPeople.textContent = opts.people;
    }

    const comboRow = document.getElementById('res-combo-row');
    if (comboRow && this.els.resCombo) {
      comboRow.style.display = opts.combo ? 'flex' : 'none';
      if (opts.combo) this.els.resCombo.textContent = opts.combo;
    }

    if (this.els.clearUnlock) {
      this.els.clearUnlock.style.display = opts.unlockNote ? 'block' : 'none';
      if (opts.unlockNote) this.els.clearUnlock.textContent = opts.unlockNote;
    }

    if (this.els.btnLevelsClear) {
      this.els.btnLevelsClear.textContent = opts.backLabel || 'BACK TO LEVELS';
    }

    this.showScreen('screen-clear');
  },

  showGameOver(score, reason, title, opts = {}) {
    this.els.resFinalScore.textContent = score;
    this.els.goTitle.textContent = title || 'GAME OVER';
    this.els.goMsg.textContent = reason || 'Level failed.';

    const endless = !!opts.endless;
    const survivalRow = document.getElementById('res-survival-row');
    const highscoreRow = document.getElementById('res-highscore-row');
    const previousRow = document.getElementById('res-previous-row');

    if (survivalRow) survivalRow.style.display = endless ? 'flex' : 'none';
    if (highscoreRow) highscoreRow.style.display = endless ? 'flex' : 'none';
    if (endless) {
      if (this.els.resSurvival) this.els.resSurvival.textContent = opts.survivalTime || '0:00';
      if (this.els.resHighscore) this.els.resHighscore.textContent = opts.highScore != null ? opts.highScore : 0;
    }

    if (previousRow) previousRow.style.display = endless ? 'flex' : 'none';
    if (endless && this.els.resPrevious) {
      this.els.resPrevious.textContent = opts.previousHighScore != null ? opts.previousHighScore : 0;
    }
    if (this.els.goRecord) {
      this.els.goRecord.style.display = endless && opts.newRecord ? 'block' : 'none';
    }

    if (this.els.btnRetryGo) this.els.btnRetryGo.textContent = endless ? 'PLAY AGAIN' : 'RETRY';
    if (this.els.btnLevelsGo) this.els.btnLevelsGo.textContent = endless ? 'BACK TO MAIN MENU' : 'BACK TO LEVELS';

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
