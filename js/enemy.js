// ============================================================
// ENEMY.JS - 敵クラス・スポーン管理
// ============================================================

class Enemy {
  constructor(x, y, typeId, timeScale) {
    const cfg = CONFIG.ENEMIES[typeId];
    this.id = Math.random().toString(36).substr(2, 9);
    this.typeId = typeId;
    this.x = x;
    this.y = y;
    this.radius = cfg.radius;
    this.maxHp = cfg.hp * (1 + timeScale * 0.8);
    this.hp = this.maxHp;
    this.speed = cfg.speed * (1 + timeScale * 0.3);
    this.damage = cfg.damage;
    this.exp = cfg.exp;
    this.coin = cfg.coin;
    this.color = cfg.color;
    this.isBoss = typeId === 'boss';
    this.name = cfg.name;

    // 特殊フラグ
    this.shootTimer = 0;
    this.shootInterval = 2000;
    this.splitted = false;
    this.hitFlash = 0;
    this.angle = 0;
    this.knockVx = 0;
    this.knockVy = 0;

    // ダメージ処理
    this.lastDamageTaken = 0;
  }

  update(dt, player, projectiles, particles) {
    // ノックバック減衰
    this.knockVx *= 0.85;
    this.knockVy *= 0.85;

    // プレイヤー追尾
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = dx / dist;
    const ny = dy / dist;

    // シューターは距離を保つ
    if (this.typeId === 'shooter') {
      if (dist > 150) {
        this.x += nx * this.speed + this.knockVx;
        this.y += ny * this.speed + this.knockVy;
      } else if (dist < 100) {
        this.x -= nx * this.speed * 0.5;
        this.y -= ny * this.speed * 0.5;
      }
      // 弾を撃つ
      this.shootTimer -= dt;
      if (this.shootTimer <= 0) {
        this.shootTimer = this.shootInterval;
        if (projectiles) {
          projectiles.push(new EnemyBullet(this.x, this.y, nx, ny));
        }
      }
    } else {
      this.x += nx * this.speed + this.knockVx;
      this.y += ny * this.speed + this.knockVy;
    }

    // ボスは画面内に留まる
    const canvas = CONFIG.CANVAS;
    if (this.isBoss) {
      this.x = Math.max(this.radius, Math.min(canvas.WIDTH - this.radius, this.x));
      this.y = Math.max(this.radius, Math.min(canvas.HEIGHT - this.radius, this.y));
    }

    this.hitFlash = Math.max(0, this.hitFlash - dt * 0.01);
    this.angle += 0.03;
  }

  takeDamage(amount, isCrit) {
    this.hp -= amount;
    this.hitFlash = 1;
    this.lastDamageTaken = amount;
    return this.hp <= 0;
  }

  knockback(nx, ny, force) {
    this.knockVx -= nx * force;
    this.knockVy -= ny * force;
  }

  draw(ctx) {
    const x = this.x, y = this.y, r = this.radius;
    ctx.save();

    if (this.isBoss) {
      // ボス専用描画
      ctx.shadowBlur = 20;
      ctx.shadowColor = this.color;
      // 外輪
      for (let i = 3; i > 0; i--) {
        ctx.beginPath();
        ctx.arc(x, y, r + i * 4, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,34,0,${0.15 * i})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      // 本体
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(x - r*0.3, y - r*0.3, 2, x, y, r);
      grad.addColorStop(0, '#ff8800');
      grad.addColorStop(0.5, '#ff2200');
      grad.addColorStop(1, '#660000');
      ctx.fillStyle = grad;
      ctx.fill();
      // ボスマーク
      ctx.strokeStyle = 'rgba(255,255,0,0.8)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const a = this.angle + i * Math.PI / 3;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a) * (r - 6), y + Math.sin(a) * (r - 6));
        ctx.lineTo(x + Math.cos(a) * (r + 4), y + Math.sin(a) * (r + 4));
        ctx.stroke();
      }
      // HPバー
      const bw = r * 2.5;
      const bx = x - bw / 2;
      const by = y - r - 16;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(bx, by, bw, 8);
      ctx.fillStyle = `hsl(${(this.hp / this.maxHp) * 120}, 100%, 50%)`;
      ctx.fillRect(bx, by, bw * (this.hp / this.maxHp), 8);
    } else {
      // 通常敵
      if (this.hitFlash > 0) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffffff';
      }
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      const alpha = this.hitFlash > 0 ? 1 : 0.9;
      const col = this.hitFlash > 0
        ? `rgba(255,255,255,${alpha})`
        : this.color;
      ctx.fillStyle = col;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.restore();
  }
}

class EnemyBullet {
  constructor(x, y, nx, ny) {
    this.x = x;
    this.y = y;
    this.vx = nx * 3;
    this.vy = ny * 3;
    this.radius = 5;
    this.damage = 8;
    this.dead = false;
    this.color = '#ff4488';
  }
  update(dt) {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < -20 || this.x > CONFIG.CANVAS.WIDTH + 20 ||
        this.y < -20 || this.y > CONFIG.CANVAS.HEIGHT + 20) {
      this.dead = true;
    }
  }
  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 6;
    ctx.shadowColor = this.color;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

// ===== スポーンマネージャー =====
class SpawnManager {
  constructor() {
    this.timer = 0;
    this.interval = 1200;
    this.bossTimer = 0;
    this.waveCount = 0;
  }

  update(dt, enemies, stageTime) {
    this.timer += dt;
    this.bossTimer += dt;
    const timeScale = stageTime / 60; // 1分ごとにスケールアップ

    // 通常敵スポーン
    const spawnInterval = Math.max(400, this.interval - stageTime * 3);
    if (this.timer >= spawnInterval && enemies.length < CONFIG.STAGE.ENEMY_MAX) {
      this.timer = 0;
      const count = Math.min(3 + Math.floor(stageTime / 30), 8);
      for (let i = 0; i < count; i++) {
        if (enemies.length >= CONFIG.STAGE.ENEMY_MAX) break;
        enemies.push(this.spawnEnemy(timeScale));
      }
      this.waveCount++;
    }

    // ボススポーン
    if (this.bossTimer >= CONFIG.STAGE.BOSS_INTERVAL * 1000) {
      this.bossTimer = 0;
      return 'boss'; // ボス出現シグナル
    }
    return null;
  }

  spawnEnemy(timeScale) {
    const pos = this.randomEdgePos();
    const typeId = this.weightedRandom();
    return new Enemy(pos.x, pos.y, typeId, timeScale);
  }

  spawnBoss(timeScale) {
    const pos = this.randomEdgePos();
    return new Enemy(pos.x, pos.y, 'boss', timeScale);
  }

  randomEdgePos() {
    const w = CONFIG.CANVAS.WIDTH;
    const h = CONFIG.CANVAS.HEIGHT;
    const side = Math.floor(Math.random() * 4);
    switch (side) {
      case 0: return { x: Math.random() * w, y: -20 };
      case 1: return { x: Math.random() * w, y: h + 20 };
      case 2: return { x: -20, y: Math.random() * h };
      case 3: return { x: w + 20, y: Math.random() * h };
    }
  }

  weightedRandom() {
    const entries = Object.entries(CONFIG.ENEMIES).filter(([k]) => k !== 'boss');
    const total = entries.reduce((s, [, v]) => s + v.spawnWeight, 0);
    let r = Math.random() * total;
    for (const [id, cfg] of entries) {
      r -= cfg.spawnWeight;
      if (r <= 0) return id;
    }
    return 'slime';
  }
}
