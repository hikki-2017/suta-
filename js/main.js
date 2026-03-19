// ============================================================
// MAIN.JS - ゲームメインループ・状態管理
// ============================================================

// ===== セーブデータ =====
const SaveData = {
  key: 'novasurvive_save',
  load() {
    try {
      return JSON.parse(localStorage.getItem(this.key)) || {};
    } catch { return {}; }
  },
  save(data) {
    try { localStorage.setItem(this.key, JSON.stringify(data)); } catch {}
  }
};

// ===== バーチャルジョイスティック =====
class Joystick {
  constructor(canvas) {
    this.canvas = canvas;
    this.active = false;
    this.startX = 0; this.startY = 0;
    this.curX = 0; this.curY = 0;
    this.dx = 0; this.dy = 0;
    this.maxRadius = 45;
    this.touchId = null;

    canvas.addEventListener('touchstart', e => this._onStart(e), { passive: false });
    canvas.addEventListener('touchmove',  e => this._onMove(e),  { passive: false });
    canvas.addEventListener('touchend',   e => this._onEnd(e),   { passive: false });
    canvas.addEventListener('touchcancel',e => this._onEnd(e),   { passive: false });

    // マウス対応（デスクトップ用）
    canvas.addEventListener('mousedown', e => this._onMouseDown(e));
    canvas.addEventListener('mousemove', e => this._onMouseMove(e));
    canvas.addEventListener('mouseup',   e => this._onMouseUp(e));
  }

  _onStart(e) {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    for (const t of e.changedTouches) {
      const y = (t.clientY - rect.top) * scaleY;
      if (y > this.canvas.height * 0.55 && this.touchId === null) {
        this.touchId = t.identifier;
        this.active = true;
        this.startX = (t.clientX - rect.left) * scaleX;
        this.startY = y;
        this.curX = this.startX;
        this.curY = this.startY;
      }
    }
  }
  _onMove(e) {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    for (const t of e.changedTouches) {
      if (t.identifier === this.touchId) {
        this.curX = (t.clientX - rect.left) * scaleX;
        this.curY = (t.clientY - rect.top) * scaleY;
        const dx = this.curX - this.startX;
        const dy = this.curY - this.startY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > 0) {
          this.dx = dx / Math.max(dist, this.maxRadius);
          this.dy = dy / Math.max(dist, this.maxRadius);
        }
      }
    }
  }
  _onEnd(e) {
    for (const t of e.changedTouches) {
      if (t.identifier === this.touchId) {
        this.active = false;
        this.dx = 0; this.dy = 0;
        this.touchId = null;
      }
    }
  }

  _mouseDown = false;
  _onMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const y = (e.clientY - rect.top) * scaleY;
    if (y > this.canvas.height * 0.55) {
      this._mouseDown = true;
      this.active = true;
      this.startX = (e.clientX - rect.left) * scaleX;
      this.startY = y;
    }
  }
  _onMouseMove(e) {
    if (!this._mouseDown) return;
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    this.curX = (e.clientX - rect.left) * scaleX;
    this.curY = (e.clientY - rect.top) * scaleY;
    const dx = this.curX - this.startX;
    const dy = this.curY - this.startY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > 0) {
      this.dx = dx / Math.max(dist, this.maxRadius);
      this.dy = dy / Math.max(dist, this.maxRadius);
    }
  }
  _onMouseUp() {
    this._mouseDown = false;
    this.active = false;
    this.dx = 0; this.dy = 0;
  }

  draw(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.globalAlpha = 0.35;
    // 外輪
    ctx.beginPath();
    ctx.arc(this.startX, this.startY, this.maxRadius, 0, Math.PI * 2);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.stroke();
    // スティック
    const sx = this.startX + this.dx * this.maxRadius;
    const sy = this.startY + this.dy * this.maxRadius;
    ctx.beginPath();
    ctx.arc(sx, sy, this.maxRadius * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = '#00f0ff';
    ctx.fill();
    ctx.restore();
  }
}

// ===== メインゲームクラス =====
class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.saveData = SaveData.load();
    this.shop = new Shop(this.saveData.shop || {});
    this.totalCoins = this.saveData.totalCoins || 0;

    this.state = 'title'; // title | playing | levelup | gameover | clear | shop
    this.initTitle();
  }

  resize() {
    const maxW = Math.min(window.innerWidth, 420);
    const maxH = window.innerHeight;
    const ratio = CONFIG.CANVAS.WIDTH / CONFIG.CANVAS.HEIGHT;
    let w = maxW, h = maxW / ratio;
    if (h > maxH) { h = maxH; w = h * ratio; }
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
  }

  initTitle() {
    document.getElementById('titleScreen').style.display = 'flex';
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('clearScreen').style.display = 'none';
    document.getElementById('shopScreen').style.display = 'none';
    document.getElementById('totalCoinsDisplay').textContent = `💰 ${this.totalCoins}`;
  }

  startGame() {
    document.getElementById('titleScreen').style.display = 'none';

    const shopData = this.shop.getSaveData();
    this.player = new Player(
      CONFIG.CANVAS.WIDTH / 2,
      CONFIG.CANVAS.HEIGHT / 2,
      shopData
    );

    this.enemies = [];
    this.enemyBullets = [];
    this.spawnMgr = new SpawnManager();
    this.weaponSys = new WeaponSystem();
    this.particles = new ParticleSystem();
    this.ui = new UI(this.canvas, this.ctx);
    this.joystick = new Joystick(this.canvas);

    this.stageTime = 0;
    this.stageMaxTime = CONFIG.STAGE.DURATION;
    this.coinsThisRun = 0;
    this.expThisRun = 0;
    this.coinMultiplier = 1;
    this.expMultiplier = 1;
    this.resultMultiplier = 1;
    this.isGameOver = false;
    this.isRevived = false;
    this.levelUpChoices = [];
    this.levelUpAnim = 0;

    this.bgStars = this._genStars(80);

    this.state = 'playing';
    this.lastTime = performance.now();
    this._setupGameInput();
    requestAnimationFrame(t => this.loop(t));
  }

  _genStars(n) {
    const stars = [];
    for (let i = 0; i < n; i++) {
      stars.push({
        x: Math.random() * CONFIG.CANVAS.WIDTH,
        y: Math.random() * CONFIG.CANVAS.HEIGHT,
        r: Math.random() * 1.5,
        alpha: 0.2 + Math.random() * 0.6,
        twinkle: Math.random() * Math.PI * 2,
      });
    }
    return stars;
  }

  _setupGameInput() {
    this.canvas.addEventListener('click', e => this._handleGameClick(e));
    this.canvas.addEventListener('touchend', e => this._handleGameTouch(e), { passive: false });
  }

  _handleGameClick(e) {
    if (this.state !== 'levelup') return;
    const rect = this.canvas.getBoundingClientRect();
    const scaleY = this.canvas.height / rect.height;
    const y = (e.clientY - rect.top) * scaleY;
    this._selectLevelUpCard(y);
  }

  _handleGameTouch(e) {
    if (this.state !== 'levelup') return;
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const scaleY = this.canvas.height / rect.height;
    const t = e.changedTouches[0];
    const y = (t.clientY - rect.top) * scaleY;
    this._selectLevelUpCard(y);
  }

  _selectLevelUpCard(y) {
    const cardH = 90, startY = 115;
    const idx = Math.floor((y - startY) / (cardH + 12));
    if (idx >= 0 && idx < this.levelUpChoices.length) {
      const choice = this.levelUpChoices[idx];
      if (choice.type === 'weapon_new' || choice.type === 'weapon_upgrade') {
        this.player.addWeapon(choice.id);
      } else if (choice.type === 'passive') {
        this.player.applyPassive(choice.id);
      }
      this.particles.addLevelUpEffect(
        CONFIG.CANVAS.WIDTH / 2,
        CONFIG.CANVAS.HEIGHT / 2
      );
      this.state = 'playing';
    }
  }

  loop(timestamp) {
    const dt = Math.min(timestamp - this.lastTime, 50);
    this.lastTime = timestamp;

    if (this.state === 'playing' || this.state === 'levelup') {
      this.update(dt);
      this.draw();
      requestAnimationFrame(t => this.loop(t));
    }
  }

  update(dt) {
    if (this.state === 'levelup') {
      this.levelUpAnim += dt / 1000;
      return;
    }

    // ステージ時間
    this.stageTime += dt / 1000;
    if (this.stageTime >= this.stageMaxTime) {
      this.triggerClear();
      return;
    }

    const p = this.player;
    p.update(dt, this.joystick);

    // スポーン
    const spawnResult = this.spawnMgr.update(dt, this.enemies, this.stageTime);
    if (spawnResult === 'boss') {
      const timeScale = this.stageTime / 60;
      this.enemies.push(this.spawnMgr.spawnBoss(timeScale));
      this.ui.showBossAlert();
    }

    // 敵更新
    for (const e of this.enemies) {
      e.update(dt, p, this.enemyBullets, this.particles);
    }

    // 敵弾更新
    for (const b of this.enemyBullets) b.update(dt);
    this.enemyBullets = this.enemyBullets.filter(b => !b.dead);

    // 武器・弾更新
    this.weaponSys.update(dt, p, this.enemies, this.particles);

    // 当たり判定：プレイヤー vs 敵
    for (const e of this.enemies) {
      const dx = e.x - p.x, dy = e.y - p.y;
      if (dx*dx + dy*dy < (e.radius + p.radius) ** 2) {
        const taken = p.takeDamage(e.damage);
        if (taken > 0) {
          this.particles.addHitEffect(p.x, p.y, '#ff2200');
        }
      }
    }

    // 当たり判定：プレイヤー vs 敵弾
    for (const b of this.enemyBullets) {
      const dx = b.x - p.x, dy = b.y - p.y;
      if (dx*dx + dy*dy < (b.radius + p.radius) ** 2) {
        p.takeDamage(b.damage);
        b.dead = true;
        this.particles.addHitEffect(p.x, p.y, '#ff4488');
      }
    }

    // 敵死亡処理
    const dead = this.enemies.filter(e => e.hp <= 0);
    for (const e of dead) {
      this.particles.addDeathEffect(e.x, e.y, e.color);
      const expGain = Math.floor(e.exp * this.expMultiplier * p.expMult);
      const coinGain = Math.floor(e.coin * this.coinMultiplier * p.coinMult);
      this.expThisRun += expGain;
      this.coinsThisRun += coinGain;
      this.totalCoins += coinGain;
      p.exp += expGain;

      // スプリッター分裂
      if (e.typeId === 'splitter' && !e.splitted) {
        for (let i = 0; i < 2; i++) {
          const mini = new Enemy(
            e.x + (Math.random()-0.5)*30,
            e.y + (Math.random()-0.5)*30,
            'slime', this.stageTime / 60
          );
          mini.splitted = true;
          this.enemies.push(mini);
        }
      }

      // レベルアップ判定
      this._checkLevelUp(p);
    }
    this.enemies = this.enemies.filter(e => e.hp > 0);

    // パーティクル
    this.particles.update(dt);

    // ゲームオーバー
    if (p.hp <= 0) {
      this.triggerGameOver();
    }
  }

  _checkLevelUp(p) {
    const table = CONFIG.EXP_TABLE;
    while (p.level < CONFIG.MAX_LEVEL && p.exp >= table[p.level]) {
      p.level++;
      this.particles.addLevelUpEffect(p.x, p.y);
      this.levelUpChoices = this.ui.buildLevelUpChoices(p);
      this.state = 'levelup';
      this.levelUpAnim = 0;
      break;
    }
  }

  draw() {
    const ctx = this.ctx;
    const w = CONFIG.CANVAS.WIDTH, h = CONFIG.CANVAS.HEIGHT;

    // 背景
    ctx.fillStyle = '#050a18';
    ctx.fillRect(0, 0, w, h);

    // 星
    for (const s of this.bgStars) {
      s.twinkle += 0.02;
      const a = s.alpha * (0.7 + 0.3 * Math.sin(s.twinkle));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.fill();
    }

    // グリッドライン（軽め）
    ctx.strokeStyle = 'rgba(0,240,255,0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // 武器エフェクト
    this.weaponSys.drawWeapons(ctx, this.player);

    // 敵
    for (const e of this.enemies) e.draw(ctx);

    // 敵弾
    for (const b of this.enemyBullets) b.draw(ctx);

    // プロジェクタイル
    this.weaponSys.drawProjectiles(ctx);

    // 武器エフェクト（後面）
    this.weaponSys.drawEffects(ctx);

    // プレイヤー
    this.player.draw(ctx);

    // パーティクル
    this.particles.draw(ctx);

    // HUD
    this.ui.drawHUD(this.player, this.stageTime, this.stageMaxTime, this.totalCoins);

    // ジョイスティック
    this.joystick.draw(ctx);

    // レベルアップ画面
    if (this.state === 'levelup') {
      this.ui.drawLevelUpScreen(this.levelUpChoices, this.levelUpAnim);
    }
  }

  triggerGameOver() {
    this.state = 'gameover';
    const s = document.getElementById('gameOverScreen');
    s.style.display = 'flex';
    document.getElementById('goLevel').textContent = `Lv.${this.player.level}`;
    document.getElementById('goCoins').textContent = this.coinsThisRun;
    document.getElementById('goExp').textContent = this.expThisRun;
    this._saveProgress();
  }

  triggerClear() {
    this.state = 'clear';
    const s = document.getElementById('clearScreen');
    s.style.display = 'flex';
    document.getElementById('clCoins').textContent = this.coinsThisRun;
    document.getElementById('clExp').textContent = this.expThisRun;
    document.getElementById('clLevel').textContent = this.player.level;
    this._saveProgress();
  }

  _saveProgress() {
    const save = {
      totalCoins: this.totalCoins,
      shop: this.shop.getSaveData(),
    };
    SaveData.save(save);
  }

  adRevive() {
    AdManager.showAd('revive', () => {
      AdManager.grantReward('revive', this);
      document.getElementById('gameOverScreen').style.display = 'none';
      this.state = 'playing';
      requestAnimationFrame(t => { this.lastTime = t; this.loop(t); });
    });
  }

  adResultBoost() {
    AdManager.showAd('resultX3', () => {
      AdManager.grantReward('resultX3', this);
      const bonus = Math.floor(this.coinsThisRun * 2); // 追加2倍分
      this.totalCoins += bonus;
      this.coinsThisRun += bonus;
      document.getElementById('clCoins').textContent = this.coinsThisRun;
      this._saveProgress();
    });
  }

  adStartBonus() {
    AdManager.showAd('rareWeapon', () => {
      AdManager.grantReward('rareWeapon', this);
    });
  }

  openShop() {
    document.getElementById('titleScreen').style.display = 'none';
    const shopScreen = document.getElementById('shopScreen');
    shopScreen.style.display = 'flex';
    const container = document.getElementById('shopItems');
    this.shop.render(container, this.totalCoins, (key) => {
      const result = this.shop.buy(key, this.totalCoins);
      if (result.success) {
        this.totalCoins -= result.cost;
        this._saveProgress();
        this.shop.render(container, this.totalCoins, arguments.callee);
        document.getElementById('shopCoins').textContent = `💰 ${this.totalCoins}`;
      } else {
        AdManager.showToast(result.reason, '#ff4444');
      }
    });
    document.getElementById('shopCoins').textContent = `💰 ${this.totalCoins}`;
  }

  closeShop() {
    document.getElementById('shopScreen').style.display = 'none';
    document.getElementById('titleScreen').style.display = 'flex';
    document.getElementById('totalCoinsDisplay').textContent = `💰 ${this.totalCoins}`;
  }
}

// ===== 起動 =====
let game;
window.addEventListener('DOMContentLoaded', () => {
  game = new Game();

  document.getElementById('btnStart').addEventListener('click', () => game.startGame());
  document.getElementById('btnShop').addEventListener('click', () => game.openShop());
  document.getElementById('btnShopClose').addEventListener('click', () => game.closeShop());
  document.getElementById('btnRetry').addEventListener('click', () => {
    document.getElementById('gameOverScreen').style.display = 'none';
    game.startGame();
  });
  document.getElementById('btnRevive').addEventListener('click', () => game.adRevive());
  document.getElementById('btnGoHome').addEventListener('click', () => {
    document.getElementById('gameOverScreen').style.display = 'none';
    game.initTitle();
    game.state = 'title';
  });
  document.getElementById('btnClearRetry').addEventListener('click', () => {
    document.getElementById('clearScreen').style.display = 'none';
    game.startGame();
  });
  document.getElementById('btnClearAd').addEventListener('click', () => game.adResultBoost());
  document.getElementById('btnClearHome').addEventListener('click', () => {
    document.getElementById('clearScreen').style.display = 'none';
    game.initTitle();
    game.state = 'title';
  });
  document.getElementById('btnAdStart').addEventListener('click', () => game.adStartBonus());
});
