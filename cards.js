/**
 * カード定義
 * type: 'unit' | 'spell' | 'field'
 * onPlay: 場に出た時の効果
 * effect: スペル効果 or フィールド起動能力
 * needsTarget: 対象選択が必要（ユニット指定）
 * rush: 出したターンでも攻撃可能
 */

const CARD_POOL = {
  // ========== 既存カード ==========
  // === 1コスト ===
  "召集兵": {
    id: "召集兵", name: "召集兵", cost: 1, type: "unit", atk: 1, hp: 1, effectText: ""
  },
  "召集": {
    id: "召集", name: "召集", cost: 1, type: "spell",
    effectText: "デッキからユニットをランダムに1枚引く。",
    effect: (game, owner) => game.drawRandomUnit(owner, 1)
  },

  // === 2コスト ===
  "下級兵士": {
    id: "下級兵士", name: "下級兵士", cost: 2, type: "unit", atk: 2, hp: 2, effectText: ""
  },
  "兵士組": {
    id: "兵士組", name: "兵士組", cost: 2, type: "unit", atk: 1, hp: 1,
    effectText: "場に出た時：召集兵を1枚場に出す。",
    onPlay: (game, owner) => game.summonToken(owner, "召集兵")
  },
  "騎兵": {
    id: "騎兵", name: "騎兵", cost: 2, type: "unit", atk: 3, hp: 1, effectText: ""
  },
  "尖兵": {
    id: "尖兵", name: "尖兵", cost: 2, type: "unit", atk: 1, hp: 3, effectText: ""
  },

  // === 3コスト ===
  "中級兵士": {
    id: "中級兵士", name: "中級兵士", cost: 3, type: "unit", atk: 3, hp: 3, effectText: ""
  },
  "徴兵施設": {
    id: "徴兵施設", name: "徴兵施設", cost: 3, type: "field",
    effectText: "起動：コスト1を支払い召集兵を1枚場に出す。",
    activateCost: 1,
    effect: (game, owner) => game.summonToken(owner, "召集兵")
  },
  "リクルート": {
    id: "リクルート", name: "リクルート", cost: 3, type: "spell",
    effectText: "デッキからユニットをランダムに2枚引く。",
    effect: (game, owner) => game.drawRandomUnit(owner, 2)
  },

  // === 4コスト ===
  "兵隊招集": {
    id: "兵隊招集", name: "兵隊招集", cost: 4, type: "spell",
    effectText: "下級兵士を2枚場に出す。",
    effect: (game, owner) => {
      game.summonToken(owner, "下級兵士");
      game.summonToken(owner, "下級兵士");
    }
  },
  "兵士投入": {
    id: "兵士投入", name: "兵士投入", cost: 4, type: "spell",
    effectText: "中級兵士1枚と召集兵1枚を場に出す。",
    effect: (game, owner) => {
      game.summonToken(owner, "中級兵士");
      game.summonToken(owner, "召集兵");
    }
  },
  "軍団兵": {
    id: "軍団兵", name: "軍団兵", cost: 4, type: "unit", atk: 2, hp: 3,
    effectText: "場に出た時：相手のユニット全てに1ダメージ。",
    onPlay: (game, owner) => {
      const enemy = owner === "player" ? "enemy" : "player";
      game.damageAllUnits(enemy, 1);
    }
  },

  // === 5コスト ===
  "上級兵士": {
    id: "上級兵士", name: "上級兵士", cost: 5, type: "unit", atk: 5, hp: 5, effectText: ""
  },
  "投石部隊": {
    id: "投石部隊", name: "投石部隊", cost: 5, type: "unit", atk: 2, hp: 4,
    effectText: "場に出た時：相手のユニット1体に5ダメージ。",
    needsTarget: true,
    onPlay: (game, owner, targetUid) => {
      if (targetUid != null) game.damageUnit(targetUid, 5);
    }
  },

  // === 6コスト ===
  "兵団長": {
    id: "兵団長", name: "兵団長", cost: 6, type: "unit", atk: 4, hp: 5,
    effectText: "場に出た時：相手のユニット全てに2ダメージ。",
    onPlay: (game, owner) => {
      const enemy = owner === "player" ? "enemy" : "player";
      game.damageAllUnits(enemy, 2);
    }
  },

  // ========== 新規ユニット（約20種） ==========
  // 1コスト
  "斥候": {
    id: "斥候", name: "斥候", cost: 1, type: "unit", atk: 1, hp: 1,
    effectText: "場に出た時：カードを1枚引く。",
    onPlay: (game, owner) => game.drawCards(owner, 1)
  },
  "民兵": {
    id: "民兵", name: "民兵", cost: 1, type: "unit", atk: 2, hp: 1, effectText: ""
  },

  // 2コスト
  "盾兵": {
    id: "盾兵", name: "盾兵", cost: 2, type: "unit", atk: 1, hp: 4, effectText: ""
  },
  "疾風騎兵": {
    id: "疾風騎兵", name: "疾風騎兵", cost: 2, type: "unit", atk: 2, hp: 2,
    effectText: "速攻（出したターンでも攻撃できる）。",
    rush: true
  },
  "治療兵": {
    id: "治療兵", name: "治療兵", cost: 2, type: "unit", atk: 1, hp: 2,
    effectText: "場に出た時：自分の体力を2回復。",
    onPlay: (game, owner) => game.healPlayer(owner, 2)
  },
  "弓兵": {
    id: "弓兵", name: "弓兵", cost: 2, type: "unit", atk: 2, hp: 1,
    effectText: "場に出た時：相手のユニット1体に2ダメージ。",
    needsTarget: true,
    onPlay: (game, owner, targetUid) => {
      if (targetUid != null) game.damageUnit(targetUid, 2);
    }
  },

  // 3コスト
  "槍兵": {
    id: "槍兵", name: "槍兵", cost: 3, type: "unit", atk: 3, hp: 2, effectText: ""
  },
  "重装兵": {
    id: "重装兵", name: "重装兵", cost: 3, type: "unit", atk: 2, hp: 5, effectText: ""
  },
  "伝令": {
    id: "伝令", name: "伝令", cost: 3, type: "unit", atk: 1, hp: 2,
    effectText: "場に出た時：カードを2枚引く。",
    onPlay: (game, owner) => game.drawCards(owner, 2)
  },
  "鼓舞する士官": {
    id: "鼓舞する士官", name: "鼓舞する士官", cost: 3, type: "unit", atk: 2, hp: 2,
    effectText: "場に出た時：味方ユニット全ての攻撃力+1。",
    onPlay: (game, owner) => game.buffAllUnits(owner, 1, 0)
  },
  "斬り込み隊": {
    id: "斬り込み隊", name: "斬り込み隊", cost: 3, type: "unit", atk: 4, hp: 1,
    effectText: "速攻。",
    rush: true
  },

  // 4コスト
  "鉄壁の守備兵": {
    id: "鉄壁の守備兵", name: "鉄壁の守備兵", cost: 4, type: "unit", atk: 2, hp: 6, effectText: ""
  },
  "突撃兵": {
    id: "突撃兵", name: "突撃兵", cost: 4, type: "unit", atk: 4, hp: 3,
    effectText: "場に出た時：相手プレイヤーに2ダメージ。",
    onPlay: (game, owner) => {
      const enemy = owner === "player" ? "enemy" : "player";
      game.damagePlayer(enemy, 2);
    }
  },
  "戦医": {
    id: "戦医", name: "戦医", cost: 4, type: "unit", atk: 1, hp: 3,
    effectText: "場に出た時：味方ユニット1体の体力を3回復。",
    needsTargetAlly: true,
    onPlay: (game, owner, targetUid) => {
      if (targetUid != null) game.healUnit(targetUid, 3);
    }
  },
  "破壊工作員": {
    id: "破壊工作員", name: "破壊工作員", cost: 4, type: "unit", atk: 3, hp: 2,
    effectText: "場に出た時：相手のユニット1体を破壊する。",
    needsTarget: true,
    onPlay: (game, owner, targetUid) => {
      if (targetUid != null) game.destroyUnit(targetUid);
    }
  },

  // 5コスト
  "精鋭槍兵": {
    id: "精鋭槍兵", name: "精鋭槍兵", cost: 5, type: "unit", atk: 4, hp: 4, effectText: ""
  },
  "猛将の護衛": {
    id: "猛将の護衛", name: "猛将の護衛", cost: 5, type: "unit", atk: 3, hp: 5,
    effectText: "場に出た時：味方ユニット全ての体力+2。",
    onPlay: (game, owner) => game.buffAllUnits(owner, 0, 2)
  },
  "火炎弓兵": {
    id: "火炎弓兵", name: "火炎弓兵", cost: 5, type: "unit", atk: 3, hp: 3,
    effectText: "場に出た時：相手のユニット全てに2ダメージ。",
    onPlay: (game, owner) => {
      const enemy = owner === "player" ? "enemy" : "player";
      game.damageAllUnits(enemy, 2);
    }
  },

  // 6〜7コスト
  "大盾兵": {
    id: "大盾兵", name: "大盾兵", cost: 6, type: "unit", atk: 3, hp: 8, effectText: ""
  },
  "破壊の巨人兵": {
    id: "破壊の巨人兵", name: "破壊の巨人兵", cost: 7, type: "unit", atk: 6, hp: 6,
    effectText: "場に出た時：相手のユニット全てに3ダメージ。",
    onPlay: (game, owner) => {
      const enemy = owner === "player" ? "enemy" : "player";
      game.damageAllUnits(enemy, 3);
    }
  },

  // ========== 新規スペル（約10種） ==========
  "応急手当": {
    id: "応急手当", name: "応急手当", cost: 1, type: "spell",
    effectText: "自分の体力を3回復する。",
    effect: (game, owner) => game.healPlayer(owner, 3)
  },
  "矢の雨": {
    id: "矢の雨", name: "矢の雨", cost: 2, type: "spell",
    effectText: "相手のユニット全てに1ダメージ。",
    effect: (game, owner) => {
      const enemy = owner === "player" ? "enemy" : "player";
      game.damageAllUnits(enemy, 1);
    }
  },
  "補給": {
    id: "補給", name: "補給", cost: 2, type: "spell",
    effectText: "カードを2枚引く。",
    effect: (game, owner) => game.drawCards(owner, 2)
  },
  "鼓舞": {
    id: "鼓舞", name: "鼓舞", cost: 2, type: "spell",
    effectText: "味方ユニット全ての攻撃力+1。",
    effect: (game, owner) => game.buffAllUnits(owner, 1, 0)
  },
  "狙撃": {
    id: "狙撃", name: "狙撃", cost: 3, type: "spell",
    effectText: "相手のユニット1体に4ダメージ。",
    needsTarget: true,
    effect: (game, owner, targetUid) => {
      if (targetUid != null) game.damageUnit(targetUid, 4);
    }
  },
  "戦術指揮": {
    id: "戦術指揮", name: "戦術指揮", cost: 3, type: "spell",
    effectText: "カードを1枚引き、味方ユニット全ての体力+1。",
    effect: (game, owner) => {
      game.drawCards(owner, 1);
      game.buffAllUnits(owner, 0, 1);
    }
  },
  "落石": {
    id: "落石", name: "落石", cost: 4, type: "spell",
    effectText: "相手プレイヤーに4ダメージ。",
    effect: (game, owner) => {
      const enemy = owner === "player" ? "enemy" : "player";
      game.damagePlayer(enemy, 4);
    }
  },
  "全滅の計": {
    id: "全滅の計", name: "全滅の計", cost: 4, type: "spell",
    effectText: "相手のユニット全てに3ダメージ。",
    effect: (game, owner) => {
      const enemy = owner === "player" ? "enemy" : "player";
      game.damageAllUnits(enemy, 3);
    }
  },
  "大回復": {
    id: "大回復", name: "大回復", cost: 4, type: "spell",
    effectText: "自分の体力を8回復する。",
    effect: (game, owner) => game.healPlayer(owner, 8)
  },
  "処刑": {
    id: "処刑", name: "処刑", cost: 5, type: "spell",
    effectText: "相手のユニット1体を破壊する。",
    needsTarget: true,
    effect: (game, owner, targetUid) => {
      if (targetUid != null) game.destroyUnit(targetUid);
    }
  },

  // ========== 新規フィールド（5種） ==========
  "野戦病院": {
    id: "野戦病院", name: "野戦病院", cost: 2, type: "field",
    effectText: "起動：コスト1を支払い、自分の体力を2回復。",
    activateCost: 1,
    effect: (game, owner) => game.healPlayer(owner, 2)
  },
  "訓練所": {
    id: "訓練所", name: "訓練所", cost: 3, type: "field",
    effectText: "起動：コスト2を支払い、味方ユニット全ての攻撃力+1。",
    activateCost: 2,
    effect: (game, owner) => game.buffAllUnits(owner, 1, 0)
  },
  "矢倉": {
    id: "矢倉", name: "矢倉", cost: 3, type: "field",
    effectText: "起動：コスト1を支払い、相手のユニット全てに1ダメージ。",
    activateCost: 1,
    effect: (game, owner) => {
      const enemy = owner === "player" ? "enemy" : "player";
      game.damageAllUnits(enemy, 1);
    }
  },
  "補給基地": {
    id: "補給基地", name: "補給基地", cost: 4, type: "field",
    effectText: "起動：コスト2を支払い、カードを2枚引く。",
    activateCost: 2,
    effect: (game, owner) => game.drawCards(owner, 2)
  },
  "要塞砲台": {
    id: "要塞砲台", name: "要塞砲台", cost: 5, type: "field",
    effectText: "起動：コスト3を支払い、相手プレイヤーに3ダメージ。",
    activateCost: 3,
    effect: (game, owner) => {
      const enemy = owner === "player" ? "enemy" : "player";
      game.damagePlayer(enemy, 3);
    }
  }
};

/** 初期デッキ構成（30枚）※既存のまま */
const INITIAL_DECK = [
  "召集兵", "召集兵",
  "召集", "召集",
  "下級兵士", "下級兵士",
  "兵士組", "兵士組",
  "騎兵", "騎兵",
  "尖兵", "尖兵",
  "中級兵士", "中級兵士",
  "徴兵施設", "徴兵施設",
  "リクルート", "リクルート",
  "兵隊招集", "兵隊招集",
  "兵士投入", "兵士投入",
  "軍団兵", "軍団兵",
  "上級兵士", "上級兵士",
  "投石部隊", "投石部隊",
  "兵団長", "兵団長"
];

/** 報酬候補（全カードプールからランダム） */
function getRewardCards(count = 5) {
  const ids = Object.keys(CARD_POOL);
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(ids[Math.floor(Math.random() * ids.length)]);
  }
  return result;
}

/** 敵用デッキ生成 */
function generateEnemyDeck(streak) {
  const base = [...INITIAL_DECK];
  const strong = ["上級兵士", "兵団長", "投石部隊", "軍団兵", "破壊の巨人兵", "火炎弓兵", "精鋭槍兵", "全滅の計"];
  if (streak >= 1) base.push(strong[streak % strong.length]);
  if (streak >= 2) base.push("上級兵士", "兵団長");
  if (streak >= 4) base.push("投石部隊", "破壊の巨人兵");
  if (streak >= 6) base.push("全滅の計", "要塞砲台");
  while (base.length > 30) base.pop();
  while (base.length < 30) base.push("中級兵士");
  return shuffle([...base]);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function createCardInstance(cardId, owner) {
  const def = CARD_POOL[cardId];
  if (!def) {
    console.error("Unknown card:", cardId);
    return null;
  }
  return {
    uid: `${owner}_${cardId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    cardId: def.id,
    name: def.name,
    cost: def.cost,
    type: def.type,
    atk: def.atk ?? 0,
    hp: def.hp ?? 0,
    maxHp: def.hp ?? 0,
    effectText: def.effectText || "",
    exhausted: false,
    owner: owner,
    activateCost: def.activateCost ?? 0,
    needsTarget: !!def.needsTarget,
    needsTargetAlly: !!def.needsTargetAlly,
    rush: !!def.rush
  };
}
