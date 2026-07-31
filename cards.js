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
    id: "尖兵", name: "尖兵", cost: 2, type: "unit", atk: 1, hp: 3,
    effectText: "護衛（これがいる限り、相手は護衛以外のユニットやプレイヤーに攻撃できない）。",
    guard: true
  },

  // === 3コスト ===
  "中級兵士": {
    id: "中級兵士", name: "中級兵士", cost: 3, type: "unit", atk: 3, hp: 3, effectText: ""
  },
  "徴兵施設": {
    id: "徴兵施設", name: "徴兵施設", cost: 3, type: "field",
    effectText: "起動：コスト1を支払い民兵を1枚場に出す。",
    activateCost: 1,
    effect: (game, owner) => game.summonToken(owner, "民兵")
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
    id: "疾風騎兵", name: "疾風騎兵", cost: 3, type: "unit", atk: 2, hp: 2,
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
    id: "槍兵", name: "槍兵", cost: 3, type: "unit", atk: 3, hp: 2,
    effectText: "突撃（出たターンにユニットへ攻撃できる）。",
    charge: true
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
    id: "斬り込み隊", name: "斬り込み隊", cost: 4, type: "unit", atk: 4, hp: 1,
    effectText: "速攻（出したターンでも攻撃できる）。",
    rush: true
  },

  // 4コスト
  "鉄壁の守備兵": {
    id: "鉄壁の守備兵", name: "鉄壁の守備兵", cost: 4, type: "unit", atk: 2, hp: 6,
    effectText: "護衛（これがいる限り、相手は護衛以外のユニットやプレイヤーに攻撃できない）。",
    guard: true
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
    effectText: "場に出た時：味方ユニット1体の体力を3回復。プレイヤーの体力を2回復。",
    needsTargetAlly: true,
    onPlay: (game, owner, targetUid) => {
      if (targetUid != null) game.healUnit(targetUid, 3);
      game.healPlayer(owner, 2);
    }
  },
  "破壊工作員": {
    id: "破壊工作員", name: "破壊工作員", cost: 4, type: "unit", atk: 3, hp: 3,
    effectText: "場に出た時：相手のユニット1体を破壊する。",
    needsTarget: true,
    onPlay: (game, owner, targetUid) => {
      if (targetUid != null) game.destroyUnit(targetUid);
    }
  },

  // 5コスト
  "精鋭槍兵": {
    id: "精鋭槍兵", name: "精鋭槍兵", cost: 5, type: "unit", atk: 5, hp: 4,
    effectText: "突撃（出たターンにユニットへ攻撃できる）。",
    charge: true
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
    id: "大盾兵", name: "大盾兵", cost: 6, type: "unit", atk: 3, hp: 8,
    effectText: "護衛（これがいる限り、相手は護衛以外のユニットやプレイヤーに攻撃できない）。",
    guard: true
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
    effectText: "カードを1枚引き、味方ユニット全ての攻撃力+1、体力+1。",
    effect: (game, owner) => {
      game.drawCards(owner, 1);
      game.buffAllUnits(owner, 1, 1);
    }
  },
  "落石": {
    id: "落石", name: "落石", cost: 4, type: "spell",
    effectText: "相手プレイヤーに4ダメージ。相手のランダムなフィールドを1つ破壊する。",
    effect: (game, owner) => {
      const enemy = owner === "player" ? "enemy" : "player";
      game.damagePlayer(enemy, 4);
      game.destroyRandomField(enemy);
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
    effectText: "自分の体力を5回復する。カードを1枚引く。",
    effect: (game, owner) => {
      game.healPlayer(owner, 5);
      game.drawCards(owner, 1);
    }
  },
  "処刑": {
    id: "処刑", name: "処刑", cost: 5, type: "spell",
    effectText: "相手のユニット1体またはフィールド1つを破壊する。",
    needsTarget: true,
    canTargetField: true,
    effect: (game, owner, targetUid) => {
      if (targetUid != null) game.destroyAny(targetUid);
    }
  },

  // ========== 新規フィールド（5種） ==========
  "野戦病院": {
    id: "野戦病院", name: "野戦病院", cost: 3, type: "field",
    effectText: "起動：コスト1を支払い、自分の体力を2回復。",
    activateCost: 1,
    effect: (game, owner) => game.healPlayer(owner, 2)
  },
  "訓練所": {
    id: "訓練所", name: "訓練所", cost: 2, type: "field",
    effectText: "起動：コスト2を支払い、味方ユニット1体の攻撃力+2し突撃を与える。",
    activateCost: 2,
    needsTargetAlly: true,
    effect: (game, owner, targetUid) => {
      if (targetUid != null) {
        game.buffUnit(targetUid, 2, 0);
        game.giveCharge(targetUid);
      }
    }
  },
  "矢倉": {
    id: "矢倉", name: "矢倉", cost: 2, type: "field",
    effectText: "起動：コスト2を支払い、相手のユニット全てに1ダメージ。",
    activateCost: 2,
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
    id: "要塞砲台", name: "要塞砲台", cost: 4, type: "field",
    effectText: "起動：コスト1を支払い、相手のユニット1体またはプレイヤーに2ダメージ。",
    activateCost: 1,
    needsTargetOrPlayer: true,
    effect: (game, owner, targetUid) => {
      if (targetUid === "player") {
        const enemy = owner === "player" ? "enemy" : "player";
        game.damagePlayer(enemy, 2);
      } else if (targetUid != null) {
        game.damageUnit(targetUid, 2);
      }
    }
  },
  "偵察兵": {
    id: "偵察兵", name: "偵察兵", cost: 2, type: "unit", atk: 2, hp: 2,
    effectText: "場に出た時：カードを1枚引く。",
    onPlay: (game, owner) => game.drawCards(owner, 1)
  },
  "旗手": {
    id: "旗手", name: "旗手", cost: 3, type: "unit", atk: 2, hp: 3,
    effectText: "場に出た時：味方ユニット全ての体力+1。",
    onPlay: (game, owner) => game.buffAllUnits(owner, 0, 1)
  },
  "暗殺者": {
    id: "暗殺者", name: "暗殺者", cost: 3, type: "unit", atk: 3, hp: 1,
    effectText: "速攻。場に出た時：相手のユニット1体に2ダメージ。",
    rush: true, needsTarget: true,
    onPlay: (game, owner, targetUid) => { if (targetUid != null) game.damageUnit(targetUid, 2); }
  },
  "補給兵": {
    id: "補給兵", name: "補給兵", cost: 2, type: "unit", atk: 1, hp: 3,
    effectText: "場に出た時：自分の体力を3回復。",
    onPlay: (game, owner) => game.healPlayer(owner, 3)
  },
  "連射弓兵": {
    id: "連射弓兵", name: "連射弓兵", cost: 4, type: "unit", atk: 3, hp: 4,
    effectText: "場に出た時：矢倉を1枚場に出す。",
    onPlay: (game, owner) => game.summonToken(owner, "矢倉")
  },
  "決死隊": {
    id: "決死隊", name: "決死隊", cost: 3, type: "spell",
    effectText: "味方ユニット全ての攻撃力+2。",
    effect: (game, owner) => game.buffAllUnits(owner, 2, 0)
  },
  "毒矢": {
    id: "毒矢", name: "毒矢", cost: 2, type: "spell",
    effectText: "相手のユニット1体に3ダメージ。",
    needsTarget: true,
    effect: (game, owner, targetUid) => { if (targetUid != null) game.damageUnit(targetUid, 3); }
  },
  "緊急徴兵": {
    id: "緊急徴兵", name: "緊急徴兵", cost: 3, type: "spell",
    effectText: "下級兵士を1枚と召集兵を1枚場に出す。",
    effect: (game, owner) => {
      game.summonToken(owner, "下級兵士");
      game.summonToken(owner, "召集兵");
    }
  },
  "監視塔": {
    id: "監視塔", name: "監視塔", cost: 2, type: "field",
    effectText: "起動：コスト2を支払い、カードを1枚引く。",
    activateCost: 2,
    effect: (game, owner) => game.drawCards(owner, 1)
  },
  "兵舎": {
    id: "兵舎", name: "兵舎", cost: 4, type: "field",
    effectText: "起動：コスト2を支払い、槍兵を1枚場に出す。",
    activateCost: 2,
    effect: (game, owner) => game.summonToken(owner, "槍兵")
  },
  "王直属近衛": {
    id: "王直属近衛", name: "王直属近衛", cost: 5, type: "unit", atk: 4, hp: 5,
    effectText: "護衛。場に出た時：味方ユニット全ての攻撃力+1。",
    guard: true,
    onPlay: (game, owner) => game.buffAllUnits(owner, 1, 0)
  },
  "黒騎兵団": {
    id: "黒騎兵団", name: "黒騎兵団", cost: 5, type: "unit", atk: 5, hp: 3,
    effectText: "速攻。場に出た時：相手のユニット1体に2ダメージ。",
    rush: true,
    needsTarget: true,
    onPlay: (game, owner, targetUid) => {
      if (targetUid != null) game.damageUnit(targetUid, 2);
    }
  },
  "戦術爆撃": {
    id: "戦術爆撃", name: "戦術爆撃", cost: 5, type: "spell",
    effectText: "相手のユニット全てに4ダメージ。相手プレイヤーに2ダメージ。",
    effect: (game, owner) => {
      const enemy = owner === "player" ? "enemy" : "player";
      game.damageAllUnits(enemy, 4);
      game.damagePlayer(enemy, 2);
    }
  },
  "再生の儀式": {
    id: "再生の儀式", name: "再生の儀式", cost: 4, type: "spell",
    effectText: "自分の体力を6回復し、カードを2枚引く。",
    effect: (game, owner) => {
      game.healPlayer(owner, 6);
      game.drawCards(owner, 2);
    }
  },
  "魔法砲台": {
    id: "魔法砲台", name: "魔法砲台", cost: 5, type: "field",
    effectText: "起動：コスト3を支払い、相手のユニット1体またはプレイヤーに3ダメージ。",
    activateCost: 3,
    needsTargetOrPlayer: true,
    effect: (game, owner, targetUid) => {
      if (targetUid === "player") game.damagePlayer(owner === "player" ? "enemy" : "player", 3);
      else if (targetUid != null) game.damageUnit(targetUid, 3);
    }
  },
  "伝説の英雄": {
    id: "伝説の英雄", name: "伝説の英雄", cost: 8, type: "unit", atk: 7, hp: 7,
    effectText: "速攻。場に出た時：相手のユニット全てに3ダメージ、相手プレイヤーに3ダメージ。",
    rush: true,
    onPlay: (game, owner) => {
      const enemy = owner === "player" ? "enemy" : "player";
      game.damageAllUnits(enemy, 3);
      game.damagePlayer(enemy, 3);
    }
  },
  "不滅の守護神": {
    id: "不滅の守護神", name: "不滅の守護神", cost: 7, type: "unit", atk: 4, hp: 12,
    effectText: "護衛。場に出た時：自分の体力を5回復、味方ユニット全ての体力+3。",
    guard: true,
    onPlay: (game, owner) => {
      game.healPlayer(owner, 5);
      game.buffAllUnits(owner, 0, 3);
    }
  },
  "終末の宣告": {
    id: "終末の宣告", name: "終末の宣告", cost: 7, type: "spell",
    effectText: "相手のユニット全てを破壊する。相手プレイヤーに5ダメージ。",
    effect: (game, owner) => {
      const enemy = owner === "player" ? "enemy" : "player";
      const p = enemy === "player" ? game.player : game.enemy;
      p.field.filter(c => c.type === "unit").forEach(c => { c.hp = 0; });
      game.checkDeaths();
      game.damagePlayer(enemy, 5);
    }
  },
  "無限の兵站": {
    id: "無限の兵站", name: "無限の兵站", cost: 6, type: "spell",
    effectText: "カードを3枚引き、中級兵士を2枚場に出す。",
    effect: (game, owner) => {
      game.drawCards(owner, 3);
      game.summonToken(owner, "中級兵士");
      game.summonToken(owner, "中級兵士");
    }
  },
  "世界樹の砦": {
    id: "世界樹の砦", name: "世界樹の砦", cost: 6, type: "field",
    effectText: "起動：コスト2を支払い、自分の体力を4回復し、カードを1枚引き、味方全体の攻撃力+1。",
    activateCost: 2,
    effect: (game, owner) => {
      game.healPlayer(owner, 4);
      game.drawCards(owner, 1);
      game.buffAllUnits(owner, 1, 0);
    }
  },
  "名の知れた傭兵": {
    id: "名の知れた傭兵", name: "名の知れた傭兵", cost: 2, type: "unit", atk: 2, hp: 1,
    effectText: "倒された時：召集兵を1枚場に出す。",
    onDeath: (game, owner) => game.summonToken(owner, "召集兵")
  },
  "不屈の護衛官": {
    id: "不屈の護衛官", name: "不屈の護衛官", cost: 3, type: "unit", atk: 2, hp: 1,
    effectText: "護衛。倒された時：治療兵を1枚場に出す。",
    guard: true,
    onDeath: (game, owner) => game.summonToken(owner, "治療兵")
  },
  "無双の将校": {
    id: "無双の将校", name: "無双の将校", cost: 4, type: "unit", atk: 1, hp: 1,
    effectText: "場に出た時：槍兵と尖兵を1枚ずつ場に出す。",
    onPlay: (game, owner) => {
      game.summonToken(owner, "槍兵");
      game.summonToken(owner, "尖兵");
    }
  },
  "伝説的な指揮官": {
    id: "伝説的な指揮官", name: "伝説的な指揮官", cost: 6, type: "unit", atk: 1, hp: 2,
    effectText: "場に出た時：疾風騎兵・槍兵・尖兵を1枚ずつ場に出す。",
    onPlay: (game, owner) => {
      game.summonToken(owner, "疾風騎兵");
      game.summonToken(owner, "槍兵");
      game.summonToken(owner, "尖兵");
    }
  },
  "荒くれものの頭": {
    id: "荒くれものの頭", name: "荒くれものの頭", cost: 6, type: "unit", atk: 3, hp: 5,
    effectText: "場に出た時：相手のユニット1体を破壊。相手プレイヤーに2ダメージ。",
    needsTarget: true,
    onPlay: (game, owner, targetUid) => {
      if (targetUid != null) game.destroyUnit(targetUid);
      game.damagePlayer(owner === "player" ? "enemy" : "player", 2);
    }
  },
  "銀の突撃兵": {
    id: "銀の突撃兵", name: "銀の突撃兵", cost: 6, type: "unit", atk: 7, hp: 4,
    effectText: "突撃（出たターンにユニットへ攻撃できる）。",
    charge: true
  },
  "守護兵団": {
    id: "守護兵団", name: "守護兵団", cost: 3, type: "unit", atk: 1, hp: 4,
    effectText: "護衛。場に出た時：召集兵を2枚場に出す。",
    guard: true,
    onPlay: (game, owner) => {
      game.summonToken(owner, "召集兵");
      game.summonToken(owner, "召集兵");
    }
  },
  "英雄級指揮官": {
    id: "英雄級指揮官", name: "英雄級指揮官", cost: 5, type: "unit", atk: 3, hp: 4,
    effectText: "場に出た時：味方ユニット全ての攻撃力と体力をそれぞれ+1。",
    onPlay: (game, owner) => game.buffAllUnits(owner, 1, 1)
  },
  "伝説級騎士団長": {
    id: "伝説級騎士団長", name: "伝説級騎士団長", cost: 7, type: "unit", atk: 3, hp: 7,
    effectText: "護衛。場に出た時：精鋭槍兵と槍兵を1体ずつ場に出す。",
    guard: true,
    onPlay: (game, owner) => {
      game.summonToken(owner, "精鋭槍兵");
      game.summonToken(owner, "槍兵");
    }
  },
  "荒くれもの": {
    id: "荒くれもの", name: "荒くれもの", cost: 4, type: "unit", atk: 5, hp: 3,
    effectText: ""
  },
  "近衛騎士": {
    id: "近衛騎士", name: "近衛騎士", cost: 6, type: "unit", atk: 6, hp: 6,
    effectText: ""
  },
  "山賊の頭": {
    id: "山賊の頭", name: "山賊の頭", cost: 7, type: "unit", atk: 3, hp: 6,
    effectText: "場に出た時：相手のユニット1体に6ダメージ。荒くれものを1体場に出す。",
    needsTarget: true,
    onPlay: (game, owner, targetUid) => {
      if (targetUid != null) game.damageUnit(targetUid, 6);
      game.summonToken(owner, "荒くれもの");
    }
  },
};


/** 初期デッキ構成（30枚） */
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

/** 対戦相手の初期デッキ（1〜14戦のベース） */
const ENEMY_DECK_EARLY = [
  "召集兵", "召集兵",
  "下級兵士", "下級兵士",
  "尖兵", "尖兵",
  "騎兵", "騎兵",
  "兵士組", "兵士組",
  "中級兵士", "中級兵士",
  "旗手",
  "鼓舞する士官",
  "リクルート", "リクルート",
  "兵隊招集", "兵隊招集",
  "兵士投入", "兵士投入",
  "軍団兵", "軍団兵",
  "上級兵士", "上級兵士",
  "投石部隊", "投石部隊",
  "兵団長", "兵団長",
  "処刑",
  "猛将の護衛"
];

/** レアリティマップ */
const RARITY_MAP = {
  "斥候": "epic", "民兵": "epic", "盾兵": "normal", "疾風騎兵": "epic",
  "治療兵": "normal", "弓兵": "epic", "槍兵": "epic", "重装兵": "normal",
  "伝令": "epic", "鼓舞する士官": "epic", "斬り込み隊": "epic",
  "鉄壁の守備兵": "normal", "突撃兵": "epic", "戦医": "epic", "破壊工作員": "ultimate",
  "精鋭槍兵": "epic", "猛将の護衛": "epic", "火炎弓兵": "ultimate",
  "大盾兵": "ultimate", "破壊の巨人兵": "ultimate",
  "応急手当": "normal", "矢の雨": "epic", "補給": "epic", "鼓舞": "epic",
  "狙撃": "normal", "戦術指揮": "epic", "落石": "normal", "全滅の計": "epic",
  "大回復": "epic", "処刑": "epic",
  "野戦病院": "epic", "訓練所": "epic", "矢倉": "epic", "補給基地": "ultimate", "要塞砲台": "ultimate",
  "偵察兵": "epic", "旗手": "epic", "暗殺者": "ultimate", "補給兵": "epic", "連射弓兵": "epic",
  "決死隊": "epic", "毒矢": "normal", "緊急徴兵": "epic", "監視塔": "epic", "兵舎": "epic",
  "王直属近衛": "ultimate", "黒騎兵団": "ultimate", "戦術爆撃": "ultimate",
  "再生の儀式": "ultimate", "魔法砲台": "ultimate",
    "荒くれものの頭": "epic", "銀の突撃兵": "epic", "守護兵団": "ultimate",
  "荒くれもの": "normal", "近衛騎士": "normal", "山賊の頭": "epic",
  "英雄級指揮官": "ultimate", "伝説級騎士団長": "ultimate",
  "名の知れた傭兵": "ultimate", "不屈の護衛官": "ultimate", "無双の将校": "ultimate", "伝説的な指揮官": "epic",
  "伝説の英雄": "legend", "不滅の守護神": "legend", "終末の宣告": "legend",
  "無限の兵站": "legend", "世界樹の砦": "legend"
};

function getRarity(cardId) {
  if (RARITY_MAP[cardId]) return RARITY_MAP[cardId];
  if (INITIAL_DECK.includes(cardId)) return "normal";
  return "epic";
}

Object.keys(CARD_POOL).forEach(id => {
  CARD_POOL[id].rarity = getRarity(id);
});

const RARITY_LABEL = {
  normal: "ノーマル",
  epic: "エピック",
  ultimate: "アルティメット",
  legend: "レジェンド"
};

function getRewardCards(ownedIds) {
  // 所持が2枚未満のカードから5枚（枠ごとレアリティ抽選）
  const counts = {};
  ownedIds.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
  const available = Object.keys(CARD_POOL).filter(id => (counts[id] || 0) < 2);

  function pickByRates(pool, rates) {
    // rates: { normal: 0.3, epic: 0.55, ... }
    const byR = { normal: [], epic: [], ultimate: [], legend: [] };
    pool.forEach(id => {
      const r = getRarity(id);
      if (byR[r]) byR[r].push(id);
    });
    let roll = Math.random();
    let chosenRarity = "epic";
    let acc = 0;
    for (const [r, p] of Object.entries(rates)) {
      acc += p;
      if (roll <= acc) { chosenRarity = r; break; }
    }
    let candidates = byR[chosenRarity];
    if (!candidates || !candidates.length) {
      candidates = pool;
    }
    if (!candidates.length) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  const rates1to4 = { normal: 0.30, epic: 0.55, ultimate: 0.14, legend: 0.01 };
  const rates5 = { normal: 0, epic: 0.75, ultimate: 0.24, legend: 0.01 };

  const result = [];
  const usedThisPack = {};
  for (let i = 0; i < 5; i++) {
    const rates = i < 4 ? rates1to4 : rates5;
    let pool = available.filter(id => (usedThisPack[id] || 0) + (counts[id] || 0) < 2);
    if (!pool.length) pool = Object.keys(CARD_POOL);
    const id = pickByRates(pool, rates);
    if (id) {
      result.push(id);
      usedThisPack[id] = (usedThisPack[id] || 0) + 1;
      counts[id] = (counts[id] || 0) + 1;
    }
  }
  return result;
}

function calcClearScore(winStreak, enemyPower) {
  return 500 + winStreak * 150 + enemyPower * 80;
}

function getEnemyPower(streak) {
  return streak;
}


/** フリー対戦：敵デッキ */
const ENEMY_DECK_FREE_A = [
  "毒矢","毒矢","補給兵","補給兵","尖兵","尖兵","狙撃","狙撃",
  "リクルート","リクルート","斬り込み隊","斬り込み隊","破壊工作員","破壊工作員",
  "全滅の計","全滅の計","再生の儀式","再生の儀式","兵舎","兵舎","要塞砲台","要塞砲台",
  "戦術爆撃","戦術爆撃","荒くれものの頭","荒くれものの頭","終末の宣告","終末の宣告",
  "破壊の巨人兵","破壊の巨人兵"
];
const ENEMY_DECK_FREE_B = [
  "偵察兵","偵察兵","名の知れた傭兵","名の知れた傭兵","尖兵","尖兵","徴兵施設",
  "守護兵団","守護兵団","不屈の護衛官","不屈の護衛官","破壊工作員","破壊工作員",
  "無双の将校","無双の将校","兵舎","黒騎兵団","黒騎兵団","火炎弓兵","火炎弓兵",
  "無限の兵站","無限の兵站","兵団長","兵団長","荒くれものの頭","荒くれものの頭",
  "終末の宣告","終末の宣告","伝説級騎士団長","伝説級騎士団長"
];
const ENEMY_DECK_FREE_C = [
  "偵察兵","偵察兵","名の知れた傭兵","名の知れた傭兵","中級兵士","中級兵士",
  "重装兵","重装兵","槍兵","槍兵","突撃兵","突撃兵","精鋭槍兵","精鋭槍兵",
  "全滅の計","全滅の計","猛将の護衛","猛将の護衛","英雄級指揮官","英雄級指揮官",
  "戦術爆撃","戦術爆撃","荒くれものの頭","荒くれものの頭","終末の宣告","終末の宣告",
  "不滅の守護神","不滅の守護神","伝説の英雄","伝説の英雄"
];

let _enemyDeckCache = null;
let _enemyDeckStreak = -1;

/** 15〜29戦固定デッキ */
const ENEMY_DECK_MID = [
  "徴兵施設", "徴兵施設",
  "名の知れた傭兵", "名の知れた傭兵",
  "尖兵", "尖兵",
  "槍兵", "槍兵",
  "中級兵士", "中級兵士",
  "不屈の護衛官", "不屈の護衛官",
  "リクルート", "リクルート",
  "破壊工作員", "破壊工作員",
  "無双の将校", "無双の将校",
  "全滅の計", "全滅の計",
  "投石部隊", "投石部隊",
  "荒くれものの頭", "荒くれものの頭",
  "兵団長", "兵団長",
  "破壊の巨人兵", "破壊の巨人兵",
  "伝説級騎士団長", "伝説級騎士団長"
];

/** 30〜49戦固定デッキ */
const ENEMY_DECK_LATE = [
  "徴兵施設",
  "野戦病院",
  "名の知れた傭兵", "名の知れた傭兵",
  "尖兵", "尖兵",
  "槍兵", "槍兵",
  "暗殺者", "暗殺者",
  "不屈の護衛官", "不屈の護衛官",
  "リクルート", "リクルート",
  "破壊工作員", "破壊工作員",
  "無双の将校", "無双の将校",
  "戦術爆撃", "戦術爆撃",
  "投石部隊", "投石部隊",
  "荒くれものの頭", "荒くれものの頭",
  "世界樹の砦", "世界樹の砦",
  "破壊の巨人兵", "破壊の巨人兵",
  "伝説級騎士団長", "伝説級騎士団長"
];

/** 50戦目以降固定デッキ */
const ENEMY_DECK_END = [
  "召集", "召集",
  "補給", "補給",
  "リクルート", "リクルート",
  "再生の儀式", "再生の儀式",
  "全滅の計", "全滅の計",
  "戦術爆撃", "戦術爆撃",
  "世界樹の砦", "世界樹の砦",
  "兵団長", "兵団長",
  "荒くれものの頭", "荒くれものの頭",
  "銀の突撃兵", "銀の突撃兵",
  "不滅の守護神", "不滅の守護神",
  "伝説級騎士団長", "伝説級騎士団長",
  "終末の宣告", "終末の宣告",
  "破壊の巨人兵", "破壊の巨人兵",
  "伝説の英雄", "伝説の英雄"
];

function rarityRank(id) {
  const r = getRarity(id);
  if (r === "legend") return 4;
  if (r === "ultimate") return 3;
  if (r === "epic") return 2;
  return 1;
}

/**
 * streak = 現在の連勝数（0 = 1戦目）
 * battleNum = streak + 1
 */
function generateEnemyDeck(streak) {
  const battleNum = streak + 1;

  if (_enemyDeckCache && _enemyDeckStreak === streak) {
    return shuffle([..._enemyDeckCache]);
  }

  let deck;

  if (battleNum >= 50) {
    deck = [...ENEMY_DECK_END];
  } else if (battleNum >= 30) {
    deck = [...ENEMY_DECK_LATE];
  } else if (battleNum >= 15) {
    deck = [...ENEMY_DECK_MID];
  } else {
    // 1〜14戦目: 徐々に高レアに2枚ずつ交換
    if (!_enemyDeckCache || streak === 0) {
      deck = [...ENEMY_DECK_EARLY];
    } else {
      deck = [..._enemyDeckCache];
    }
    // 2枚を高レアリティに交換
    const byRarity = (minRank) => Object.keys(CARD_POOL).filter(id => rarityRank(id) >= minRank);
    let upgradePool;
    if (battleNum <= 4) upgradePool = byRarity(2); // epic+
    else if (battleNum <= 9) upgradePool = byRarity(2).concat(byRarity(3));
    else upgradePool = byRarity(2).concat(byRarity(3)).concat(byRarity(4));
    if (!upgradePool.length) upgradePool = Object.keys(CARD_POOL);

    for (let n = 0; n < 2; n++) {
      // 低レア・低コスト優先で差し替え
      const weakIdx = [];
      deck.forEach((id, idx) => {
        if (rarityRank(id) <= 1) weakIdx.push(idx);
      });
      const idx = weakIdx.length
        ? weakIdx[Math.floor(Math.random() * weakIdx.length)]
        : Math.floor(Math.random() * deck.length);
      const newId = upgradePool[Math.floor(Math.random() * upgradePool.length)];
      deck[idx] = newId;
    }
  }

  while (deck.length > 30) deck.pop();
  while (deck.length < 30) deck.push("中級兵士");

  _enemyDeckCache = [...deck];
  _enemyDeckStreak = streak;
  return shuffle([...deck]);
}

function resetEnemyDeckCache() {
  _enemyDeckCache = null;
  _enemyDeckStreak = -1;
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
    needsTargetOrPlayer: !!def.needsTargetOrPlayer,
    rush: !!def.rush,
    charge: !!def.charge,
    guard: !!def.guard,
    onDeath: def.onDeath || null,
    rarity: def.rarity || getRarity(cardId)
  };
}
