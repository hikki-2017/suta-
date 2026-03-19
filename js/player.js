// ============================================================
// PLAYER.JS - プレイヤークラス
// ============================================================

class Player {
  constructor(x, y, saveData) {
    const cfg = CONFIG.PLAYER;
    const s = saveData || {};

    this.x = x;
    this.y = y;
    this.radius = cfg.RADIUS;

    // 基本ステータス（恒久強化込み）
    this.maxHp = cfg.BASE_HP + (s.maxHp || 0) * 20;
    this.hp = this.maxHp;
    this.baseSpeed = cfg.BASE_SPEED + (s.speed || 0) * 0.2;
    this.baseDamage = cfg.BASE_DAMAGE + (s.attack || 0) * 3;
    this.baseCritRate = cfg.BASE_CRIT_RATE + (s.critRate || 0) * 0.03;

    // ランタイム乗数（スキルで変化）
    this.speedMult = 1.0;
    this.damageMult = 1.0;
    this.attackSpeedMult = 1.0;
    this.critRate = this.baseCritRate;
    this.critMulti = cfg.BASE_CRIT_MULTI;
    this.regenRate = 0;
    this.pickupRadius = 60;

    // 経験値・レベル
    this.exp = 0;
    this.level = 1;

    // 武器スロット
    this.weapons = [];
    this.addWeapon('bullet'); // デフォルト武器

    // 無敵
    this.invincibleUntil = 0;

    // 移動
    this.vx = 0;
    this.vy = 0;

    // ステージ補正
    this.coinMult = 1 + (s.coinBoost || 0) * 0.1;
    this.expMult  = 1 + (s.expBoost || 0) * 0.1;

    // アニメ
    this.angle = 0;
    this.trail = [];
  }

  get speed() { return this.baseSpeed * this.speedMult; }
  get damage() { return this.baseDamage * this.damageMult; }

  addWeapon(weaponId) {
    const existing = this.weapons.find(w => w.id === weaponId);
    if (existing) {
      if (existing.level < CONFIG.WEAPONS[weaponId].maxLevel) {
        existing.level++;
      }
      return;
    }
    if (this.weapons.length >= 6) return; // 最大6スロット
    this.weapons.push({
      id: weaponId,
      level: 1,
      cooldownTimer: 0,
      bladeAngle: 0,
      laserAngle: 0,
      laserActive: false,
      laserTimer: 0,
    });
  }

  applyPassive(passiveId) {
    const p = CONFIG.PASSIVES[passiveId];
    if (p) p.effect(this);
  }

  update(dt, joystick) {
    // 移動
    if (joystick.active) {
      const spd = this.speed;
      this.vx = joystick.dx * spd;
      this.vy = joystick.dy * spd;
    } else {
      this.vx *= 0.8;
      this.vy *= 0.8;
    }
    this.x = Math.max(this.radius, Math.min(CONFIG.CANVAS.WIDTH - this.radius, this.x + this.vx));
    this.y = Math.max(this.radius, Math.min(CONFIG.CANVAS.HEIGHT - this.radius, this.y + this.vy));

    // 軌跡
    this.trail.push({ x: this.x, y: this.y, t: Date.now() });
    if (this.trail.length > 8) this.trail.shift();

    // リジェネ
    if (this.regenRate > 0) {
      this.hp = Math.min(this.maxHp, this.hp + this.regenRate * dt / 1000);
    }

    // アニメ
    this.angle += 0.05;
  }

  takeDamage(amount) {
    const now = Date.now();
    if (now < this.invincibleUntil) return 0;
    this.hp = Math.max(0, this.hp - amount);
    this.invincibleUntil = now + CONFIG.PLAYER.INVINCIBLE_DURATION;
    return amount;
  }

  rollCrit() {
    return Math.random() < this.critRate;
  }

  draw(ctx) {
    // 軌跡
    for (let i = 0; i < this.trail.length; i++) {
      const a = i / this.trail.length * 0.3;
      ctx.beginPath();
      ctx.arc(this.trail[i].x, this.trail[i].y, this.radius * 0.5 * (i / this.trail.length), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 240, 255, ${a})`;
      ctx.fill();
    }

    // 無敵中点滅
    if (Date.now() < this.invincibleUntil && Math.floor(Date.now() / 80) % 2 === 0) return;

    // 外輪
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius + 4, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,240,255,0.3)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 本体
    const grad = ctx.createRadialGradient(this.x - 4, this.y - 4, 2, this.x, this.y, this.radius);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, '#00f0ff');
    grad.addColorStop(1, '#0044aa');
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // 回転マーカー
    const mx = this.x + Math.cos(this.angle) * (this.radius - 4);
    const my = this.y + Math.sin(this.angle) * (this.radius - 4);
    ctx.beginPath();
    ctx.arc(mx, my, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }
}
