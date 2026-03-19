// ============================================================
// SHOP.JS - 恒久強化ショップ
// ============================================================

class Shop {
  constructor(saveData) {
    // セーブデータから恒久強化レベルを読み込む
    this.upgrades = {};
    const shopKeys = Object.keys(CONFIG.SHOP);
    for (const key of shopKeys) {
      this.upgrades[key] = (saveData && saveData[key]) || 0;
    }
  }

  getCost(key) {
    const cfg = CONFIG.SHOP[key];
    const lvl = this.upgrades[key];
    return Math.floor(cfg.baseCost * Math.pow(cfg.costMult, lvl));
  }

  canUpgrade(key) {
    const cfg = CONFIG.SHOP[key];
    return this.upgrades[key] < cfg.maxLevel;
  }

  buy(key, coins) {
    if (!this.canUpgrade(key)) return { success: false, reason: 'MAX LEVEL' };
    const cost = this.getCost(key);
    if (coins < cost) return { success: false, reason: 'コイン不足' };
    this.upgrades[key]++;
    return { success: true, cost };
  }

  getSaveData() {
    return { ...this.upgrades };
  }

  render(container, coins, onBuy) {
    container.innerHTML = '';
    const shopKeys = Object.keys(CONFIG.SHOP);

    for (const key of shopKeys) {
      const cfg = CONFIG.SHOP[key];
      const lvl = this.upgrades[key];
      const cost = this.getCost(key);
      const maxed = !this.canUpgrade(key);
      const canAfford = coins >= cost;

      const card = document.createElement('div');
      card.className = 'shop-card' + (maxed ? ' maxed' : '') + (canAfford && !maxed ? ' affordable' : '');
      card.innerHTML = `
        <div class="shop-icon">${cfg.icon}</div>
        <div class="shop-info">
          <div class="shop-name">${cfg.name}</div>
          <div class="shop-desc">${cfg.desc}</div>
          <div class="shop-level">Lv ${lvl} / ${cfg.maxLevel}</div>
        </div>
        <div class="shop-cost-area">
          ${maxed
            ? '<div class="shop-maxed">MAX</div>'
            : `<div class="shop-cost ${canAfford ? 'can-afford' : 'cant-afford'}">💰${cost}</div>
               <button class="shop-btn" ${canAfford ? '' : 'disabled'}>強化</button>`}
        </div>
      `;

      if (!maxed) {
        const btn = card.querySelector('.shop-btn');
        btn.addEventListener('click', () => onBuy(key));
      }

      container.appendChild(card);
    }
  }
}
