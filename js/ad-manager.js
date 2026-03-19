// ============================================================
// AD-MANAGER.JS
// 広告SDK差し替え口
// AdMob等に切り替える場合は showAd() 関数だけ書き換えればOK
// ============================================================

const AdManager = (() => {

  // -------------------------------------------------------
  // ここを AdMob / Unity Ads 等のSDKに差し替える
  // callback() は報酬付与時に呼ぶ
  // -------------------------------------------------------
  function showAd(rewardType, callback) {
    // 【疑似実装】実際の広告SDKに差し替えるまでの仮処理
    // 本番では以下のような形になる:
    //   admob.showRewardedAd(() => callback());
    console.log(`[AdManager] 広告視聴: ${rewardType}`);
    setTimeout(() => {
      callback();
    }, 500); // 0.5秒後に報酬付与（疑似広告表示時間）
  }

  // 報酬処理（ゲーム本体から呼ばれる）
  function grantReward(type, gameState) {
    const rewards = CONFIG.AD_REWARDS;
    switch (type) {
      case 'revive':
        gameState.player.hp = gameState.player.maxHp;
        gameState.isGameOver = false;
        gameState.isRevived = true;
        showToast('復活！HPが全回復しました', '#00f0ff');
        break;
      case 'coinX2':
        gameState.coinMultiplier = 2;
        showToast('コイン獲得量が2倍になった！', '#ffcc00');
        break;
      case 'expX2':
        gameState.expMultiplier = 2;
        showToast('経験値獲得量が2倍になった！', '#88ff44');
        break;
      case 'rareWeapon':
        const weaponIds = Object.keys(CONFIG.WEAPONS);
        const owned = gameState.player.weapons.map(w => w.id);
        const available = weaponIds.filter(id => !owned.includes(id));
        if (available.length > 0) {
          const id = available[Math.floor(Math.random() * available.length)];
          gameState.player.addWeapon(id);
          showToast(`レア武器「${CONFIG.WEAPONS[id].name}」を獲得！`, '#ff00ff');
        } else {
          // 全武器所持済みなら攻撃力アップ
          gameState.player.damageMult *= 1.3;
          showToast('全武器習得済み！攻撃力+30%', '#ff6600');
        }
        break;
      case 'resultX3':
        gameState.resultMultiplier = 3;
        showToast('リザルト報酬が3倍！', '#ff88ff');
        break;
    }
  }

  function showToast(msg, color) {
    const t = document.createElement('div');
    t.style.cssText = `
      position:fixed; top:20%; left:50%; transform:translateX(-50%);
      background: rgba(0,0,0,0.85); color: ${color};
      padding: 12px 24px; border-radius: 8px; font-size: 15px; font-weight: bold;
      z-index: 9999; border: 1px solid ${color}; pointer-events: none;
      text-align: center; white-space: nowrap;
    `;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.style.opacity = '0', 1800);
    setTimeout(() => t.remove(), 2200);
  }

  return { showAd, grantReward, showToast };
})();
