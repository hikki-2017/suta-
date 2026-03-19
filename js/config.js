// ============================================================
// CONFIG.JS - 全調整値はここで管理
// 数値バランスを変えたい場合はこのファイルだけ編集すればOK
// ============================================================

const CONFIG = {
  // キャンバス
  CANVAS: {
    WIDTH: 400,
    HEIGHT: 700,
  },

  // プレイヤー
  PLAYER: {
    RADIUS: 16,
    BASE_HP: 100,
    BASE_SPEED: 2.8,
    BASE_DAMAGE: 10,
    BASE_ATTACK_SPEED: 1.0, // 攻撃間隔係数（低いほど速い）
    BASE_CRIT_RATE: 0.05,   // 5%
    BASE_CRIT_MULTI: 2.0,
    INVINCIBLE_DURATION: 800, // ms
    COLOR: '#00f0ff',
  },

  // 経験値テーブル（各レベルに必要な累積経験値）
  EXP_TABLE: [
    0,    // Lv1
    20,   // Lv2
    50,   // Lv3
    100,  // Lv4
    170,  // Lv5
    260,  // Lv6
    370,  // Lv7
    500,  // Lv8
    650,  // Lv9
    820,  // Lv10
    1020, // Lv11
    1250, // Lv12
    1510, // Lv13
    1800, // Lv14
    2130, // Lv15
    2500, // Lv16
    2910, // Lv17
    3370, // Lv18
    3880, // Lv19
    4450, // Lv20
  ],
  MAX_LEVEL: 20,

  // ステージ設定
  STAGE: {
    DURATION: 180,        // 秒
    BOSS_INTERVAL: 60,    // 秒ごとにボス
    ENEMY_MAX: 120,       // 同時最大敵数
    PARTICLE_MAX: 250,    // パーティクル最大数
  },

  // 敵の基本設定
  ENEMIES: {
    slime: {
      name: 'スライム',
      radius: 12,
      hp: 20,
      speed: 1.2,
      damage: 5,
      exp: 3,
      coin: 1,
      color: '#88ff44',
      spawnWeight: 40,
    },
    speeder: {
      name: 'スピーダー',
      radius: 9,
      hp: 12,
      speed: 2.8,
      damage: 8,
      exp: 5,
      coin: 2,
      color: '#ff8800',
      spawnWeight: 25,
    },
    tank: {
      name: 'タンク',
      radius: 20,
      hp: 80,
      speed: 0.7,
      damage: 15,
      exp: 10,
      coin: 4,
      color: '#aa44ff',
      spawnWeight: 15,
    },
    shooter: {
      name: 'シューター',
      radius: 11,
      hp: 25,
      speed: 1.0,
      damage: 6,
      exp: 7,
      coin: 3,
      color: '#ff4488',
      spawnWeight: 12,
    },
    splitter: {
      name: 'スプリッター',
      radius: 14,
      hp: 35,
      speed: 1.0,
      damage: 5,
      exp: 8,
      coin: 3,
      color: '#44ffaa',
      spawnWeight: 8,
    },
    boss: {
      name: 'ボス',
      radius: 35,
      hp: 500,
      speed: 0.9,
      damage: 25,
      exp: 80,
      coin: 30,
      color: '#ff2200',
      spawnWeight: 0, // 手動スポーン
    },
  },

  // 武器・スキル設定
  WEAPONS: {
    bullet: {
      id: 'bullet',
      name: '直線弾',
      icon: '●',
      desc: '最も基本的な弾。真っ直ぐ飛ぶ',
      color: '#00f0ff',
      maxLevel: 3,
      levels: [
        { damage: 12, cooldown: 800, speed: 6, count: 1, size: 5 },
        { damage: 20, cooldown: 650, speed: 7, count: 2, size: 5 },
        { damage: 35, cooldown: 500, speed: 8, count: 3, size: 6, evolved: true },
      ],
    },
    spread: {
      id: 'spread',
      name: '拡散弾',
      icon: '✦',
      desc: '3方向に弾を拡散させる',
      color: '#ffcc00',
      maxLevel: 3,
      levels: [
        { damage: 8,  cooldown: 1200, speed: 5, count: 3, spread: 0.4, size: 5 },
        { damage: 12, cooldown: 1000, speed: 5, count: 5, spread: 0.5, size: 5 },
        { damage: 18, cooldown: 800,  speed: 6, count: 7, spread: 0.6, size: 6, evolved: true },
      ],
    },
    blade: {
      id: 'blade',
      name: '回転刃',
      icon: '⚙',
      desc: 'プレイヤー周囲を回転する刃',
      color: '#ff6600',
      maxLevel: 3,
      levels: [
        { damage: 6,  cooldown: 100, count: 2, radius: 55, size: 8 },
        { damage: 10, cooldown: 100, count: 3, radius: 65, size: 9 },
        { damage: 16, cooldown: 100, count: 4, radius: 75, size: 11, evolved: true },
      ],
    },
    lightning: {
      id: 'lightning',
      name: '落雷',
      icon: '⚡',
      desc: 'ランダムな敵に雷を落とす',
      color: '#ffffaa',
      maxLevel: 3,
      levels: [
        { damage: 30, cooldown: 2000, count: 1, size: 12 },
        { damage: 50, cooldown: 1500, count: 2, size: 14 },
        { damage: 80, cooldown: 1200, count: 3, size: 16, evolved: true },
      ],
    },
    explosion: {
      id: 'explosion',
      name: '爆発',
      icon: '💥',
      desc: '範囲ダメージを与える爆弾',
      color: '#ff4400',
      maxLevel: 3,
      levels: [
        { damage: 20, cooldown: 2500, radius: 60, size: 10 },
        { damage: 35, cooldown: 2000, radius: 80, size: 12 },
        { damage: 55, cooldown: 1500, radius: 110, size: 15, evolved: true },
      ],
    },
    laser: {
      id: 'laser',
      name: '貫通レーザー',
      icon: '━',
      desc: '敵を貫通する直線レーザー',
      color: '#ff00ff',
      maxLevel: 3,
      levels: [
        { damage: 15, cooldown: 3000, duration: 500, width: 4 },
        { damage: 25, cooldown: 2500, duration: 600, width: 6 },
        { damage: 40, cooldown: 2000, duration: 800, width: 9, evolved: true },
      ],
    },
    drone: {
      id: 'drone',
      name: 'ドローン',
      icon: '◈',
      desc: 'ドローンが近くの敵を追跡攻撃',
      color: '#00ffaa',
      maxLevel: 3,
      levels: [
        { damage: 10, cooldown: 600, count: 1, speed: 4, size: 6 },
        { damage: 16, cooldown: 500, count: 2, speed: 5, size: 7 },
        { damage: 25, cooldown: 400, count: 3, speed: 6, size: 8, evolved: true },
      ],
    },
  },

  // パッシブスキル（レベルアップ選択肢に混入）
  PASSIVES: {
    atkUp: {
      id: 'atkUp', name: '攻撃力UP', icon: '⚔',
      desc: '攻撃力を15%アップ',
      effect: (p) => { p.damageMult *= 1.15; },
    },
    spdUp: {
      id: 'spdUp', name: '攻撃速度UP', icon: '⏩',
      desc: '全武器の攻撃速度を15%アップ',
      effect: (p) => { p.attackSpeedMult *= 0.85; },
    },
    moveUp: {
      id: 'moveUp', name: '移動速度UP', icon: '👟',
      desc: '移動速度を20%アップ',
      effect: (p) => { p.speedMult *= 1.20; },
    },
    hpUp: {
      id: 'hpUp', name: 'HP増加', icon: '❤',
      desc: '最大HPを30増加して回復',
      effect: (p) => { p.maxHp += 30; p.hp = Math.min(p.hp + 30, p.maxHp); },
    },
    critUp: {
      id: 'critUp', name: 'クリティカル率UP', icon: '💎',
      desc: 'クリティカル率を10%アップ',
      effect: (p) => { p.critRate += 0.10; },
    },
    pickup: {
      id: 'pickup', name: '吸収範囲UP', icon: '🌀',
      desc: '経験値・コインの拾える範囲を広げる',
      effect: (p) => { p.pickupRadius += 30; },
    },
    regen: {
      id: 'regen', name: 'リジェネ', icon: '💚',
      desc: '毎秒HPを1回復する',
      effect: (p) => { p.regenRate += 1; },
    },
  },

  // 恒久強化ショップ
  SHOP: {
    maxHp: {
      name: '最大HP強化',
      icon: '❤',
      desc: '最大HPを+20',
      baseCost: 30,
      maxLevel: 10,
      costMult: 1.4,
    },
    attack: {
      name: '攻撃力強化',
      icon: '⚔',
      desc: '基本攻撃力を+3',
      baseCost: 40,
      maxLevel: 10,
      costMult: 1.4,
    },
    speed: {
      name: '移動速度強化',
      icon: '👟',
      desc: '移動速度を+0.2',
      baseCost: 35,
      maxLevel: 8,
      costMult: 1.5,
    },
    coinBoost: {
      name: 'コイン獲得量UP',
      icon: '💰',
      desc: 'コイン獲得量を+10%',
      baseCost: 50,
      maxLevel: 8,
      costMult: 1.5,
    },
    expBoost: {
      name: '経験値獲得量UP',
      icon: '✨',
      desc: '経験値獲得量を+10%',
      baseCost: 50,
      maxLevel: 8,
      costMult: 1.5,
    },
    critRate: {
      name: 'クリティカル率UP',
      icon: '💎',
      desc: 'クリティカル率を+3%',
      baseCost: 60,
      maxLevel: 10,
      costMult: 1.4,
    },
  },

  // 広告報酬 (ad-manager.js で処理)
  AD_REWARDS: {
    revive:    { name: '復活', icon: '💖', desc: 'HPを全回復して復活' },
    coinX2:    { name: 'コイン2倍', icon: '💰', desc: 'このステージのコイン獲得量2倍' },
    expX2:     { name: '経験値2倍', icon: '✨', desc: 'このステージの経験値2倍' },
    rareWeapon:{ name: 'レア武器', icon: '⚡', desc: 'レアスキル1つをランダム獲得' },
    resultX3:  { name: 'リザルト3倍', icon: '🎁', desc: 'リザルト報酬を3倍にする' },
  },
};
