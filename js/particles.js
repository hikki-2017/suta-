// ============================================================
// PARTICLES.JS - パーティクル・エフェクトシステム
// ============================================================

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.damageNumbers = [];
  }

  addHitEffect(x, y, color) {
    const count = 5;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        color,
        alpha: 1,
        life: 1,
        decay: 0.04 + Math.random() * 0.04,
      });
    }
    this._trim();
  }

  addExplosion(x, y) {
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      const colors = ['#ff6600', '#ffcc00', '#ff2200', '#ffffff'];
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 1,
        decay: 0.025 + Math.random() * 0.025,
      });
    }
    this._trim();
  }

  addDeathEffect(x, y, color) {
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        color,
        alpha: 1,
        life: 1,
        decay: 0.02 + Math.random() * 0.02,
      });
    }
    this._trim();
  }

  addLevelUpEffect(x, y) {
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      const colors = ['#00f0ff', '#ffffff', '#ffcc00', '#88ff44'];
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: 4 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 1,
        decay: 0.015,
      });
    }
    this._trim();
  }

  addDamageNumber(x, y, dmg, isCrit) {
    this.damageNumbers.push({
      x: x + (Math.random() - 0.5) * 30,
      y,
      text: isCrit ? `${dmg}!!` : `${dmg}`,
      color: isCrit ? '#ffff00' : '#ffffff',
      size: isCrit ? 20 : 14,
      vy: -1.5 - Math.random(),
      alpha: 1,
      life: 1,
      decay: 0.025,
      isCrit,
    });
    if (this.damageNumbers.length > 60) {
      this.damageNumbers.splice(0, this.damageNumbers.length - 60);
    }
  }

  update(dt) {
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.life -= p.decay;
      p.alpha = Math.max(0, p.life);
    }
    this.particles = this.particles.filter(p => p.life > 0);

    for (const n of this.damageNumbers) {
      n.y += n.vy;
      n.x += (Math.random() - 0.5) * 0.3;
      n.life -= n.decay;
      n.alpha = Math.max(0, n.life);
    }
    this.damageNumbers = this.damageNumbers.filter(n => n.life > 0);
  }

  draw(ctx) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.shadowBlur = 4;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.restore();
    }

    for (const n of this.damageNumbers) {
      ctx.save();
      ctx.globalAlpha = n.alpha;
      if (n.isCrit) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffff00';
      }
      ctx.font = `bold ${n.size}px 'Rajdhani', sans-serif`;
      ctx.fillStyle = n.color;
      ctx.textAlign = 'center';
      ctx.fillText(n.text, n.x, n.y);
      ctx.restore();
    }
  }

  _trim() {
    if (this.particles.length > CONFIG.STAGE.PARTICLE_MAX) {
      this.particles.splice(0, this.particles.length - CONFIG.STAGE.PARTICLE_MAX);
    }
  }
}
