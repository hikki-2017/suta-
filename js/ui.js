// ============================================================
// UI.JS - HUD・UI管理
// ============================================================

class UI {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.levelUpChoices = [];
    this.showingLevelUp = false;
    this.bossAlert = 0;
    this.levelUpAnim = 0;
  }

  drawHUD(player, stageTime, stageMaxTime, coinTotal) {
    const ctx = this.ctx;
    const w = this.canvas.width;

    // 上部半透明バー背景
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, w, 52);

    // HPバー（左上）
    const hpW = 140;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(8, 8, hpW, 14);
    const hpRatio = player.hp / player.maxHp;
    const hpColor = hpRatio > 0.5 ? '#44ff44' : hpRatio > 0.25 ? '#ffcc00' : '#ff2200';
    ctx.fillStyle = hpColor;
    ctx.fillRect(8, 8, hpW * hpRatio, 14);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(8, 8, hpW, 14);
    ctx.font = '10px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(`HP ${Math.ceil(player.hp)}/${player.maxHp}`, 12, 19);

    // 経験値バー（上部中央）
    const expTable = CONFIG.EXP_TABLE;
    const curLvl = player.level;
    const maxLvl = CONFIG.MAX_LEVEL;
    let expRatio = 1;
    if (curLvl < maxLvl) {
      const base = expTable[curLvl - 1];
      const next = expTable[curLvl];
      expRatio = (player.exp - base) / (next - base);
    }
    const expW = w - 16;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(8, 26, expW, 10);
    const expGrad = ctx.createLinearGradient(8, 0, 8 + expW * expRatio, 0);
    expGrad.addColorStop(0, '#00f0ff');
    expGrad.addColorStop(1, '#aa88ff');
    ctx.fillStyle = expGrad;
    ctx.fillRect(8, 26, expW * expRatio, 10);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(8, 26, expW, 10);
    ctx.font = '10px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`Lv.${curLvl}`, w / 2, 35);

    // コイン（右上）
    ctx.font = 'bold 13px monospace';
    ctx.fillStyle = '#ffcc00';
    ctx.textAlign = 'right';
    ctx.fillText(`💰 ${coinTotal}`, w - 8, 20);

    // タイマー（右上下）
    const remaining = Math.max(0, stageMaxTime - stageTime);
    const mm = Math.floor(remaining / 60);
    const ss = Math.floor(remaining % 60);
    ctx.font = '11px monospace';
    ctx.fillStyle = remaining < 30 ? '#ff4444' : '#aaaaff';
    ctx.textAlign = 'right';
    ctx.fillText(`${mm}:${ss.toString().padStart(2,'0')}`, w - 8, 36);

    // 武器アイコン（下部）
    this._drawWeaponSlots(player);

    // ボスアラート
    if (this.bossAlert > 0) {
      this.bossAlert -= 1/60;
      const alpha = Math.min(1, this.bossAlert * 3);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 28px sans-serif';
      ctx.fillStyle = '#ff2200';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#ff0000';
      ctx.fillText('⚠ BOSS INCOMING ⚠', w / 2, this.canvas.height / 2 - 60);
      ctx.restore();
    }
  }

  _drawWeaponSlots(player) {
    const ctx = this.ctx;
    const slotSize = 40;
    const startX = 8;
    const y = this.canvas.height - 55;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, y - 4, slotSize * 6 + 16, slotSize + 12);

    player.weapons.forEach((w, i) => {
      const cfg = CONFIG.WEAPONS[w.id];
      const lvl = cfg.levels[w.level - 1];
      const x = startX + i * (slotSize + 2);
      const isEvolved = lvl.evolved;

      ctx.fillStyle = isEvolved ? 'rgba(255,0,255,0.3)' : 'rgba(0,240,255,0.15)';
      ctx.strokeStyle = isEvolved ? '#ff00ff' : 'rgba(0,240,255,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x, y, slotSize, slotSize, 4);
      ctx.fill();
      ctx.stroke();

      ctx.font = `16px sans-serif`;
      ctx.fillStyle = cfg.color;
      ctx.textAlign = 'center';
      ctx.fillText(cfg.icon, x + slotSize/2, y + slotSize/2 + 6);

      // レベル表示
      ctx.font = `bold 9px monospace`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(`Lv${w.level}${isEvolved ? '★' : ''}`, x + 2, y + slotSize - 3);
    });
  }

  showBossAlert() {
    this.bossAlert = 3;
  }

  // ===== レベルアップ画面 =====
  buildLevelUpChoices(player) {
    const choices = [];
    const weaponIds = Object.keys(CONFIG.WEAPONS);
    const passiveIds = Object.keys(CONFIG.PASSIVES);
    const ownedWeapons = player.weapons.map(w => w.id);

    const pool = [];
    // 武器追加・強化
    for (const id of weaponIds) {
      const owned = player.weapons.find(w => w.id === id);
      if (owned) {
        if (owned.level < CONFIG.WEAPONS[id].maxLevel) {
          pool.push({ type: 'weapon_upgrade', id, priority: 3 });
        }
      } else {
        if (player.weapons.length < 6) {
          pool.push({ type: 'weapon_new', id, priority: 2 });
        }
      }
    }
    // パッシブ
    for (const id of passiveIds) {
      pool.push({ type: 'passive', id, priority: 1 });
    }

    // ランダム3択
    const shuffled = pool.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 3);
    return selected.map(item => {
      if (item.type === 'weapon_upgrade') {
        const cfg = CONFIG.WEAPONS[item.id];
        const owned = player.weapons.find(w => w.id === item.id);
        const nextLvl = cfg.levels[owned.level]; // 次のレベル
        return {
          type: 'weapon_upgrade',
          id: item.id,
          icon: cfg.icon,
          name: `${cfg.name} Lv${owned.level + 1}${nextLvl && nextLvl.evolved ? ' ★進化!' : ''}`,
          desc: `${cfg.desc}（強化）`,
          color: cfg.color,
          evolved: nextLvl && nextLvl.evolved,
        };
      }
      if (item.type === 'weapon_new') {
        const cfg = CONFIG.WEAPONS[item.id];
        return {
          type: 'weapon_new',
          id: item.id,
          icon: cfg.icon,
          name: `NEW: ${cfg.name}`,
          desc: cfg.desc,
          color: cfg.color,
        };
      }
      if (item.type === 'passive') {
        const cfg = CONFIG.PASSIVES[item.id];
        return {
          type: 'passive',
          id: item.id,
          icon: cfg.icon,
          name: cfg.name,
          desc: cfg.desc,
          color: '#aaaaff',
        };
      }
    });
  }

  drawLevelUpScreen(choices, animT) {
    const ctx = this.ctx;
    const w = this.canvas.width, h = this.canvas.height;
    ctx.fillStyle = 'rgba(0, 10, 30, 0.85)';
    ctx.fillRect(0, 0, w, h);

    // タイトル
    ctx.save();
    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#00f0ff';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00f0ff';
    const pulse = 1 + Math.sin(animT * 4) * 0.05;
    ctx.scale(pulse, pulse);
    ctx.fillText('LEVEL UP!', w / 2 / pulse, 70 / pulse);
    ctx.restore();

    ctx.font = '13px monospace';
    ctx.fillStyle = '#aaaaff';
    ctx.textAlign = 'center';
    ctx.fillText('スキルを1つ選んでください', w / 2, 95);

    // カード
    const cardW = w - 40;
    const cardH = 90;
    const startY = 115;

    choices.forEach((c, i) => {
      const y = startY + i * (cardH + 12);
      const isEvolved = c.evolved;

      // カード背景
      ctx.save();
      ctx.shadowBlur = isEvolved ? 20 : 10;
      ctx.shadowColor = isEvolved ? '#ff00ff' : c.color;
      ctx.fillStyle = isEvolved ? 'rgba(80,0,80,0.9)' : 'rgba(0,20,50,0.92)';
      ctx.strokeStyle = isEvolved ? '#ff00ff' : c.color;
      ctx.lineWidth = isEvolved ? 2 : 1;
      ctx.beginPath();
      ctx.roundRect(20, y, cardW, cardH, 8);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // アイコン
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(c.icon, 52, y + 55);

      // テキスト
      ctx.font = `bold 14px sans-serif`;
      ctx.fillStyle = isEvolved ? '#ff88ff' : c.color;
      ctx.textAlign = 'left';
      ctx.fillText(c.name, 76, y + 38);

      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#99aacc';
      ctx.fillText(c.desc, 76, y + 58);

      // 進化バッジ
      if (isEvolved) {
        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = '#ffcc00';
        ctx.textAlign = 'right';
        ctx.fillText('★ EVOLVED', 20 + cardW - 8, y + 20);
      }

      // 番号
      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.textAlign = 'left';
      ctx.fillText(`${i+1}`, 26, y + 20);
    });
  }

  // ゲームオーバー画面
  drawGameOverScreen(ctx, player, coins, totalExp, canRevive) {
    const w = this.canvas.width, h = this.canvas.height;
    ctx.fillStyle = 'rgba(0,0,0,0.88)';
    ctx.fillRect(0, 0, w, h);

    ctx.font = 'bold 36px sans-serif';
    ctx.fillStyle = '#ff2200';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff0000';
    ctx.fillText('GAME OVER', w/2, h*0.28);
    ctx.shadowBlur = 0;

    ctx.font = '14px monospace';
    ctx.fillStyle = '#aaaaff';
    ctx.fillText(`Lv.${player.level}  コイン: ${coins}  経験値: ${totalExp}`, w/2, h*0.38);
  }

  drawClearScreen(ctx, player, coins, totalExp) {
    const w = this.canvas.width, h = this.canvas.height;
    ctx.fillStyle = 'rgba(0,10,30,0.9)';
    ctx.fillRect(0, 0, w, h);

    ctx.font = 'bold 36px sans-serif';
    ctx.fillStyle = '#00f0ff';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 25;
    ctx.shadowColor = '#00f0ff';
    ctx.fillText('STAGE CLEAR!', w/2, h*0.25);
    ctx.shadowBlur = 0;

    ctx.font = '15px monospace';
    ctx.fillStyle = '#ffcc00';
    ctx.fillText(`獲得コイン: ${coins}`, w/2, h*0.38);
    ctx.fillStyle = '#88ff44';
    ctx.fillText(`獲得経験値: ${totalExp}`, w/2, h*0.44);
    ctx.fillStyle = '#aaaaff';
    ctx.fillText(`到達レベル: ${player.level}`, w/2, h*0.50);
  }
}
