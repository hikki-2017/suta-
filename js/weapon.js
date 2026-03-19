// ============================================================
// WEAPON.JS - 武器・スキルシステム
// ============================================================

class WeaponSystem {
  constructor() {
    this.projectiles = []; // プレイヤー弾
    this.effects = [];     // ビジュアルエフェクト（雷・爆発・レーザー）
  }

  update(dt, player, enemies, particles) {
    const pWeapons = player.weapons;
    const spMult = player.attackSpeedMult;

    for (const w of pWeapons) {
      const cfg = CONFIG.WEAPONS[w.id];
      const lvl = cfg.levels[w.level - 1];

      switch (w.id) {
        case 'bullet':
          this._updateBullet(dt, w, lvl, player, enemies, spMult);
          break;
        case 'spread':
          this._updateSpread(dt, w, lvl, player, enemies, spMult);
          break;
        case 'blade':
          this._updateBlade(dt, w, lvl, player, enemies, spMult, particles);
          break;
        case 'lightning':
          this._updateLightning(dt, w, lvl, player, enemies, spMult, particles);
          break;
        case 'explosion':
          this._updateExplosion(dt, w, lvl, player, enemies, spMult, particles);
          break;
        case 'laser':
          this._updateLaser(dt, w, lvl, player, enemies, spMult, particles);
          break;
        case 'drone':
          this._updateDrone(dt, w, lvl, player, enemies, spMult, particles);
          break;
      }
    }

    // プロジェクタイル更新
    for (const p of this.projectiles) {
      p.update(dt, enemies);
    }
    this.projectiles = this.projectiles.filter(p => !p.dead);

    // エフェクト更新
    for (const e of this.effects) {
      e.timer -= dt;
    }
    this.effects = this.effects.filter(e => e.timer > 0);

    // 最大数制限（重さ対策）
    if (this.projectiles.length > 300) {
      this.projectiles.splice(0, this.projectiles.length - 300);
    }
  }

  _nearestEnemy(player, enemies) {
    let nearest = null, minDist = Infinity;
    for (const e of enemies) {
      const dx = e.x - player.x, dy = e.y - player.y;
      const d = dx*dx + dy*dy;
      if (d < minDist) { minDist = d; nearest = e; }
    }
    return nearest;
  }

  _dealDamage(player, enemy, base, particles, posX, posY) {
    const isCrit = player.rollCrit();
    const dmg = Math.floor(base * player.damageMult * (isCrit ? player.critMulti : 1));
    const dead = enemy.takeDamage(dmg, isCrit);
    if (particles) {
      particles.addDamageNumber(posX || enemy.x, posY || enemy.y, dmg, isCrit);
      particles.addHitEffect(enemy.x, enemy.y, isCrit ? '#ffff00' : '#ff8800');
    }
    return { dead, dmg, isCrit };
  }

  // ===== 直線弾 =====
  _updateBullet(dt, w, lvl, player, enemies, spMult, particles) {
    w.cooldownTimer -= dt;
    if (w.cooldownTimer > 0) return;
    if (enemies.length === 0) return;
    w.cooldownTimer = lvl.cooldown * spMult;

    const nearest = this._nearestEnemy(player, enemies);
    if (!nearest) return;
    const dx = nearest.x - player.x, dy = nearest.y - player.y;
    const dist = Math.sqrt(dx*dx + dy*dy) || 1;
    const nx = dx/dist, ny = dy/dist;

    for (let i = 0; i < lvl.count; i++) {
      const spread = (i - (lvl.count-1)/2) * 0.15;
      const angle = Math.atan2(ny, nx) + spread;
      this.projectiles.push(new Bullet(
        player.x, player.y,
        Math.cos(angle) * lvl.speed, Math.sin(angle) * lvl.speed,
        lvl.damage, lvl.size, player, CONFIG.WEAPONS.bullet.color, false
      ));
    }
  }

  // ===== 拡散弾 =====
  _updateSpread(dt, w, lvl, player, enemies, spMult) {
    w.cooldownTimer -= dt;
    if (w.cooldownTimer > 0) return;
    if (enemies.length === 0) return;
    w.cooldownTimer = lvl.cooldown * spMult;

    const nearest = this._nearestEnemy(player, enemies);
    if (!nearest) return;
    const dx = nearest.x - player.x, dy = nearest.y - player.y;
    const baseAngle = Math.atan2(dy, dx);

    for (let i = 0; i < lvl.count; i++) {
      const offset = (i - (lvl.count-1)/2) * lvl.spread;
      const a = baseAngle + offset;
      this.projectiles.push(new Bullet(
        player.x, player.y,
        Math.cos(a) * lvl.speed, Math.sin(a) * lvl.speed,
        lvl.damage, lvl.size, player, CONFIG.WEAPONS.spread.color, false
      ));
    }
  }

  // ===== 回転刃 =====
  _updateBlade(dt, w, lvl, player, enemies, spMult, particles) {
    w.bladeAngle = (w.bladeAngle || 0) + 0.05;
    w.cooldownTimer -= dt;
    const hitCooldowns = w.hitCooldowns || (w.hitCooldowns = {});

    for (let i = 0; i < lvl.count; i++) {
      const a = w.bladeAngle + (i / lvl.count) * Math.PI * 2;
      const bx = player.x + Math.cos(a) * lvl.radius;
      const by = player.y + Math.sin(a) * lvl.radius;

      for (const e of enemies) {
        const dx = e.x - bx, dy = e.y - by;
        if (dx*dx + dy*dy < (e.radius + lvl.size) ** 2) {
          const now = Date.now();
          const key = `${i}_${e.id}`;
          if (!hitCooldowns[key] || now - hitCooldowns[key] > 300) {
            hitCooldowns[key] = now;
            this._dealDamage(player, e, lvl.damage, particles, bx, by);
          }
        }
      }
    }
  }

  // ===== 落雷 =====
  _updateLightning(dt, w, lvl, player, enemies, spMult, particles) {
    w.cooldownTimer -= dt;
    if (w.cooldownTimer > 0) return;
    if (enemies.length === 0) return;
    w.cooldownTimer = lvl.cooldown * spMult;

    const targets = [...enemies].sort(() => Math.random() - 0.5).slice(0, lvl.count);
    for (const e of targets) {
      this._dealDamage(player, e, lvl.damage, particles);
      this.effects.push({ type: 'lightning', x: e.x, y: e.y, timer: 300, size: lvl.size });
    }
  }

  // ===== 爆発 =====
  _updateExplosion(dt, w, lvl, player, enemies, spMult, particles) {
    w.cooldownTimer -= dt;
    if (w.cooldownTimer > 0) return;
    if (enemies.length === 0) return;
    w.cooldownTimer = lvl.cooldown * spMult;

    const target = this._nearestEnemy(player, enemies);
    if (!target) return;

    for (const e of enemies) {
      const dx = e.x - target.x, dy = e.y - target.y;
      if (dx*dx + dy*dy < lvl.radius * lvl.radius) {
        this._dealDamage(player, e, lvl.damage, particles);
      }
    }
    this.effects.push({ type: 'explosion', x: target.x, y: target.y, timer: 400, size: lvl.radius });
    if (particles) particles.addExplosion(target.x, target.y);
  }

  // ===== レーザー =====
  _updateLaser(dt, w, lvl, player, enemies, spMult, particles) {
    if (w.laserActive) {
      w.laserTimer -= dt;
      if (w.laserTimer <= 0) {
        w.laserActive = false;
        w.cooldownTimer = lvl.cooldown * spMult;
      } else {
        // レーザー当たり判定（毎フレーム）
        const a = w.laserAngle;
        const cos = Math.cos(a), sin = Math.sin(a);
        for (const e of enemies) {
          const dx = e.x - player.x, dy = e.y - player.y;
          const along = dx*cos + dy*sin;
          const perp  = Math.abs(-dx*sin + dy*cos);
          if (along > 0 && perp < e.radius + lvl.width) {
            const key = `laser_${e.id}`;
            const now = Date.now();
            if (!w.hitCooldowns) w.hitCooldowns = {};
            if (!w.hitCooldowns[key] || now - w.hitCooldowns[key] > 100) {
              w.hitCooldowns[key] = now;
              this._dealDamage(player, e, lvl.damage * (dt / 100), particles);
            }
          }
        }
      }
    } else {
      w.cooldownTimer -= dt;
      if (w.cooldownTimer <= 0 && enemies.length > 0) {
        const target = this._nearestEnemy(player, enemies);
        if (target) {
          const dx = target.x - player.x, dy = target.y - player.y;
          w.laserAngle = Math.atan2(dy, dx);
          w.laserActive = true;
          w.laserTimer = lvl.duration;
        }
      }
    }
  }

  // ===== ドローン =====
  _updateDrone(dt, w, lvl, player, enemies, spMult, particles) {
    w.cooldownTimer -= dt;
    if (w.cooldownTimer > 0) return;
    if (enemies.length === 0) return;
    w.cooldownTimer = lvl.cooldown * spMult;

    const targets = [];
    for (let i = 0; i < lvl.count; i++) {
      const remaining = enemies.filter(e => !targets.includes(e));
      const t = remaining.sort(() => Math.random() - 0.5)[0];
      if (t) targets.push(t);
    }
    for (const t of targets) {
      this.projectiles.push(new HomingBullet(
        player.x, player.y, t,
        lvl.speed, lvl.damage, lvl.size, player, CONFIG.WEAPONS.drone.color
      ));
    }
  }

  drawWeapons(ctx, player) {
    const pWeapons = player.weapons;
    for (const w of pWeapons) {
      const cfg = CONFIG.WEAPONS[w.id];
      const lvl = cfg.levels[w.level - 1];

      if (w.id === 'blade') {
        for (let i = 0; i < lvl.count; i++) {
          const a = w.bladeAngle + (i / lvl.count) * Math.PI * 2;
          const bx = player.x + Math.cos(a) * lvl.radius;
          const by = player.y + Math.sin(a) * lvl.radius;
          ctx.save();
          ctx.shadowBlur = 10;
          ctx.shadowColor = cfg.color;
          ctx.beginPath();
          ctx.arc(bx, by, lvl.size, 0, Math.PI * 2);
          ctx.fillStyle = cfg.color;
          ctx.fill();
          ctx.restore();
        }
      }

      if (w.id === 'laser' && w.laserActive) {
        const a = w.laserAngle;
        const len = Math.max(CONFIG.CANVAS.WIDTH, CONFIG.CANVAS.HEIGHT) * 2;
        ctx.save();
        ctx.globalAlpha = 0.7 + Math.random() * 0.3;
        ctx.shadowBlur = 20;
        ctx.shadowColor = cfg.color;
        ctx.strokeStyle = cfg.color;
        ctx.lineWidth = lvl.width;
        ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        ctx.lineTo(player.x + Math.cos(a) * len, player.y + Math.sin(a) * len);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  drawProjectiles(ctx) {
    for (const p of this.projectiles) p.draw(ctx);
  }

  drawEffects(ctx) {
    for (const e of this.effects) {
      const t = e.timer;
      ctx.save();
      ctx.globalAlpha = t / 400;

      if (e.type === 'explosion') {
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#ff4400';
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size * (1 - t/400) + 10, 0, Math.PI * 2);
        ctx.strokeStyle = '#ff6600';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size * (1 - t/400) * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,200,0,0.3)';
        ctx.fill();
      }

      if (e.type === 'lightning') {
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ffffaa';
        // ジグザグ描画
        const x = e.x, y = e.y, s = e.size * 3;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y - s);
        ctx.lineTo(x + s*0.4, y - s*0.2);
        ctx.lineTo(x - s*0.2, y + s*0.2);
        ctx.lineTo(x + s*0.3, y + s*0.6);
        ctx.lineTo(x, y + s);
        ctx.stroke();
      }

      ctx.restore();
    }
  }
}

// ===== プロジェクタイルクラス =====
class Bullet {
  constructor(x, y, vx, vy, damage, size, player, color, piercing) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.damage = damage;
    this.size = size;
    this.player = player;
    this.color = color;
    this.piercing = piercing || false;
    this.dead = false;
    this.hitEnemies = new Set();
  }

  update(dt, enemies) {
    this.x += this.vx;
    this.y += this.vy;

    const w = CONFIG.CANVAS.WIDTH, h = CONFIG.CANVAS.HEIGHT;
    if (this.x < -30 || this.x > w+30 || this.y < -30 || this.y > h+30) {
      this.dead = true;
      return;
    }

    for (const e of enemies) {
      if (this.hitEnemies.has(e.id)) continue;
      const dx = e.x - this.x, dy = e.y - this.y;
      if (dx*dx + dy*dy < (e.radius + this.size) ** 2) {
        this.hitEnemies.add(e.id);
        e.takeDamage(Math.floor(this.damage * this.player.damageMult));
        const nx = dx / (Math.sqrt(dx*dx+dy*dy) || 1);
        const ny = dy / (Math.sqrt(dx*dx+dy*dy) || 1);
        e.knockback(nx, ny, 2);
        if (!this.piercing) { this.dead = true; break; }
      }
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.shadowBlur = 8;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }
}

class HomingBullet {
  constructor(x, y, target, speed, damage, size, player, color) {
    this.x = x; this.y = y;
    this.target = target;
    this.speed = speed;
    this.damage = damage;
    this.size = size;
    this.player = player;
    this.color = color;
    this.dead = false;
    this.vx = 0; this.vy = 0;
  }

  update(dt, enemies) {
    if (this.target && this.target.hp > 0 && enemies.includes(this.target)) {
      const dx = this.target.x - this.x, dy = this.target.y - this.y;
      const dist = Math.sqrt(dx*dx+dy*dy) || 1;
      this.vx += (dx/dist * this.speed - this.vx) * 0.15;
      this.vy += (dy/dist * this.speed - this.vy) * 0.15;
    }
    this.x += this.vx;
    this.y += this.vy;

    const w = CONFIG.CANVAS.WIDTH, h = CONFIG.CANVAS.HEIGHT;
    if (this.x < -50 || this.x > w+50 || this.y < -50 || this.y > h+50) {
      this.dead = true; return;
    }

    for (const e of enemies) {
      const dx = e.x - this.x, dy = e.y - this.y;
      if (dx*dx + dy*dy < (e.radius + this.size) ** 2) {
        e.takeDamage(Math.floor(this.damage * this.player.damageMult));
        this.dead = true;
        break;
      }
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    // 追尾軌跡
    const trail = Math.sqrt(this.vx*this.vx + this.vy*this.vy);
    if (trail > 0) {
      ctx.strokeStyle = `rgba(0,255,170,0.4)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.vx * 4, this.y - this.vy * 4);
      ctx.stroke();
    }
    ctx.restore();
  }
}
