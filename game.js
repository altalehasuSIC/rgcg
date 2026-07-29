/**
 * ローグライクカードゲーム - メインロジック
 */

class Game {
  constructor() {
    this.winStreak = 0;
    this.runScore = 0;
    this.runDeck = [];
    this.collection = [];
    this.hasActiveRun = false;
    this.builderDeck = {};
    this.ownedCards = {};
    this.deckEditMode = "start";
    this.selectedUnitUid = null;
    this.pendingTarget = null;
    this.bindUI();
  }

  bindUI() {
    document.getElementById("btn-start").onclick = () => {
      this.hasActiveRun = false;
      this.openDeckBuilder("start");
    };
    document.getElementById("btn-continue").onclick = () => this.continueRun();
    document.getElementById("btn-reset-deck").onclick = () => this.resetBuilderDeck();
    document.getElementById("btn-confirm-deck").onclick = () => this.confirmDeck();
    document.getElementById("btn-deck-to-title").onclick = () => this.goTitleKeepProgress();
    document.getElementById("btn-keep-hand").onclick = () => this.startBattleAfterMulligan(false);
    document.getElementById("btn-mulligan").onclick = () => this.startBattleAfterMulligan(true);
    document.getElementById("btn-mulligan-to-title").onclick = () => this.goTitleKeepProgress();
    document.getElementById("btn-end-turn").onclick = () => this.endPlayerTurn();
    document.getElementById("btn-attack-player").onclick = () => this.attackEnemyPlayer();
    document.getElementById("btn-cancel").onclick = () => this.cancelPending();
    document.getElementById("btn-retire").onclick = () => this.retire();
    document.getElementById("btn-show-log").onclick = () => this.showLogModal();
    const kwHelp = document.getElementById("btn-keyword-help");
    if (kwHelp) kwHelp.onclick = () => this.showKeywordHelp();
    const kwClose = document.getElementById("btn-close-keyword");
    if (kwClose) kwClose.onclick = () => {
      document.getElementById("keyword-modal").classList.add("hidden");
    };

    document.getElementById("btn-close-log").onclick = () => this.hideLogModal();
    document.getElementById("btn-edit-deck-mid").onclick = () => this.openDeckBuilder("mid");
    document.getElementById("btn-reward-to-title").onclick = () => this.goTitleKeepProgress();
    document.getElementById("btn-retry").onclick = () => this.resetToTitle();
    document.getElementById("log-modal").onclick = (e) => {
      if (e.target.id === "log-modal") this.hideLogModal();
    };
  }

  isTouchDevice() {
    return window.matchMedia("(pointer: coarse)").matches ||
           ("ontouchstart" in window) ||
           navigator.maxTouchPoints > 0;
  }

  clearHandTap() {
    this._handTapUid = null;
    this._selectedHandUid = null;
    document.querySelectorAll(".card.tap-armed").forEach(x => x.classList.remove("tap-armed"));
    document.querySelectorAll(".card.show-tooltip").forEach(x => x.classList.remove("show-tooltip"));
    this.updateUIBoardHighlight();
  }

  log(msg) {
    const el = document.getElementById("log");
    if (!el) return;
    const p = document.createElement("p");
    p.textContent = msg;
    el.prepend(p);
    while (el.children.length > 80) el.removeChild(el.lastChild);
  }

  showKeywordHelp() {
    const m = document.getElementById("keyword-modal");
    if (m) m.classList.remove("hidden");
  }

  showLogModal() {
    document.getElementById("log-modal").classList.remove("hidden");
  }

  hideLogModal() {
    document.getElementById("log-modal").classList.add("hidden");
  }

  showScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
  }

  goTitleKeepProgress() {
    this.hasActiveRun = true;
    this.showScreen("title-screen");
    this.updateTitleContinue();
  }

  updateTitleContinue() {
    const btn = document.getElementById("btn-continue");
    if (this.hasActiveRun && this.collection.length > 0) {
      btn.classList.remove("hidden");
      document.getElementById("continue-streak").textContent = this.winStreak;
    } else {
      btn.classList.add("hidden");
    }
  }

  continueRun() {
    // デッキが30枚ならマリガンから、そうでなければデッキ編集
    if (this.runDeck.length === 30) {
      this.startNextBattle();
    } else {
      this.openDeckBuilder("mid");
    }
  }

  resetToTitle() {
    this.hasActiveRun = false;
    this.winStreak = 0;
    this.runScore = 0;
    this.runDeck = [];
    this.collection = [];
    if (typeof resetEnemyDeckCache === "function") resetEnemyDeckCache();
    this.showScreen("title-screen");
    this.updateTitleContinue();
  }

  // ========== デッキ構築 ==========
  openDeckBuilder(mode = "start") {
    this.deckEditMode = mode;
    if (mode === "start") {
      this.resetBuilderDeck();
      document.getElementById("deckbuild-title").textContent = "デッキ構築";
      document.getElementById("deck-status-text").innerHTML =
        'デッキ枚数: <strong id="deck-count">0</strong> / 30　（同一カードは最大2枚）';
      document.getElementById("pool-title").textContent = "カードプール";
      document.getElementById("btn-reset-deck").textContent = "初期デッキに戻す";
      document.getElementById("btn-confirm-deck").textContent = "このデッキで挑戦開始";
    } else {
      this.ownedCards = {};
      this.collection.forEach(id => {
        this.ownedCards[id] = (this.ownedCards[id] || 0) + 1;
      });
      // 現在の runDeck を初期選択（なければ空）
      this.builderDeck = {};
      if (this.runDeck.length === 30) {
        this.runDeck.forEach(id => {
          this.builderDeck[id] = (this.builderDeck[id] || 0) + 1;
        });
      }
      document.getElementById("deckbuild-title").textContent = "デッキ編集（戦闘間）";
      document.getElementById("deck-status-text").innerHTML =
        'デッキ枚数: <strong id="deck-count">0</strong> / 30　（所持カードから30枚を選ぶ）';
      document.getElementById("pool-title").textContent = "所持カード";
      document.getElementById("btn-reset-deck").textContent = "現在のデッキを読込";
      document.getElementById("btn-confirm-deck").textContent = "このデッキで次の戦闘へ";
    }
    this.showScreen("deckbuild-screen");
    this.renderDeckBuilder();
  }

  resetBuilderDeck() {
    if (this.deckEditMode === "mid") {
      this.builderDeck = {};
      if (this.runDeck.length === 30) {
        this.runDeck.forEach(id => {
          this.builderDeck[id] = (this.builderDeck[id] || 0) + 1;
        });
      }
    } else {
      this.builderDeck = {};
      INITIAL_DECK.forEach(id => {
        this.builderDeck[id] = (this.builderDeck[id] || 0) + 1;
      });
    }
    this.renderDeckBuilder();
  }

  getBuilderCount() {
    return Object.values(this.builderDeck).reduce((a, b) => a + b, 0);
  }

  changeBuilderCount(cardId, delta) {
    const cur = this.builderDeck[cardId] || 0;
    const next = cur + delta;
    const total = this.getBuilderCount();

    if (delta > 0) {
      if (total >= 30) return;
      if (this.deckEditMode === "start") {
        if (next > 2) return;
      } else {
        const owned = this.ownedCards[cardId] || 0;
        if (next > owned) return;
      }
    }

    if (next <= 0) {
      delete this.builderDeck[cardId];
    } else {
      this.builderDeck[cardId] = next;
    }
    this.renderDeckBuilder();
  }

  renderDeckBuilder() {
    const poolEl = document.getElementById("card-pool");
    const deckEl = document.getElementById("current-deck");
    const countEl = document.getElementById("deck-count");
    const confirmBtn = document.getElementById("btn-confirm-deck");

    const total = this.getBuilderCount();
    if (countEl) {
      countEl.textContent = total;
      countEl.style.color = total === 30 ? "#50c878" : "#e94560";
    }
    confirmBtn.disabled = total !== 30;

    // プールに表示するID
    let poolIds;
    if (this.deckEditMode === "start") {
      poolIds = Object.keys(CARD_POOL);
    } else {
      poolIds = Object.keys(this.ownedCards);
    }
    poolIds.sort((a, b) => {
      const ca = CARD_POOL[a].cost - CARD_POOL[b].cost;
      return ca !== 0 ? ca : a.localeCompare(b, "ja");
    });

    poolEl.innerHTML = "";
    poolIds.forEach(id => {
      const def = CARD_POOL[id];
      if (!def) return;
      const count = this.builderDeck[id] || 0;
      const owned = this.deckEditMode === "mid" ? (this.ownedCards[id] || 0) : 2;
      const item = document.createElement("div");
      item.className = "pool-item";

      const mini = this.createMiniCard(def);
      const info = document.createElement("div");
      info.className = "info";
      const typeName = def.type === "unit" ? "ユニット" : def.type === "spell" ? "呪文" : "フィールド";
      info.innerHTML = `
        <div class="cname">${def.name}${this.deckEditMode === "mid" ? `（所持${owned}）` : ""}</div>
        <div class="cmeta">コスト${def.cost} / ${typeName}${def.type === "unit" ? ` ⚔${def.atk} / ❤${def.hp}` : ""}</div>
        ${def.effectText ? `<div class="ceffect">${def.effectText}</div>` : ""}
      `;

      const ctrl = document.createElement("div");
      ctrl.className = "count-ctrl";
      const minus = document.createElement("button");
      minus.textContent = "−";
      minus.disabled = count <= 0;
      minus.onclick = () => this.changeBuilderCount(id, -1);
      const num = document.createElement("span");
      num.className = "num";
      num.textContent = count;
      const plus = document.createElement("button");
      plus.textContent = "+";
      if (this.deckEditMode === "start") {
        plus.disabled = count >= 2 || total >= 30;
      } else {
        plus.disabled = count >= owned || total >= 30;
      }
      plus.onclick = () => this.changeBuilderCount(id, 1);

      ctrl.append(minus, num, plus);
      item.append(mini, info, ctrl);
      poolEl.appendChild(item);
    });

    deckEl.innerHTML = "";
    const deckIds = Object.keys(this.builderDeck).sort((a, b) => {
      const ca = CARD_POOL[a].cost - CARD_POOL[b].cost;
      return ca !== 0 ? ca : a.localeCompare(b, "ja");
    });

    if (deckIds.length === 0) {
      deckEl.innerHTML = '<p style="color:#888;text-align:center;padding:20px;">カードがありません</p>';
    } else {
      deckIds.forEach(id => {
        const def = CARD_POOL[id];
        const count = this.builderDeck[id];
        const item = document.createElement("div");
        item.className = "deck-item";
        const mini = this.createMiniCard(def);
        const info = document.createElement("div");
        info.className = "info";
        info.innerHTML = `<div class="cname">${def.name} ×${count}</div><div class="cmeta">コスト${def.cost}</div>`;
        const ctrl = document.createElement("div");
        ctrl.className = "count-ctrl";
        const minus = document.createElement("button");
        minus.textContent = "−";
        minus.onclick = () => this.changeBuilderCount(id, -1);
        const remove = document.createElement("button");
        remove.className = "remove-btn";
        remove.textContent = "×";
        remove.onclick = () => {
          delete this.builderDeck[id];
          this.renderDeckBuilder();
        };
        ctrl.append(minus, remove);
        item.append(mini, info, ctrl);
        deckEl.appendChild(item);
      });
    }
  }

  createMiniCard(def) {
    const el = document.createElement("div");
    el.className = `card card-mini ${def.type === "field" ? "field-card" : def.type}`;
    el.innerHTML = `
      <div class="cost" style="width:18px;height:18px;font-size:0.7rem;top:2px;left:2px;">${def.cost}</div>
      <div class="name" style="margin-top:14px;font-size:0.65rem;">${def.name}</div>
    `;
    return el;
  }

  confirmDeck() {
    if (this.getBuilderCount() !== 30) return;
    this.runDeck = [];
    Object.entries(this.builderDeck).forEach(([id, cnt]) => {
      for (let i = 0; i < cnt; i++) this.runDeck.push(id);
    });
    if (this.deckEditMode === "start") {
      this.collection = [...this.runDeck];
      this.winStreak = 0;
      this.runScore = 0;
      this.hasActiveRun = true;
      if (typeof resetEnemyDeckCache === "function") resetEnemyDeckCache();
    }
    this.startNextBattle();
  }

  retire() {
    if (!confirm("リタイアして敗北になります。よろしいですか？")) return;
    this.hasActiveRun = false;
    this.loseBattle();
  }

  // ========== ラン／戦闘開始 ==========
  startNextBattle() {
    this.enemyName = this.getEnemyName(this.winStreak);
    this.player = this.createPlayerState("player");
    this.enemy = this.createPlayerState("enemy");
    this.enemy.deck = generateEnemyDeck(this.winStreak);
    this.currentPlayer = "player";
    this.selectedUnitUid = null;
    this.pendingTarget = null;

    this.drawCards("player", 5);
    this.drawCards("enemy", 5);

    this.showScreen("mulligan-screen");
    this.renderMulligan();
  }

  createPlayerState(owner) {
    return {
      owner,
      hp: 20,
      mana: 0,
      maxMana: 0,
      deck: owner === "player" ? shuffle([...this.runDeck]) : [],
      hand: [],
      field: [],
      grave: []
    };
  }

  getEnemyName(streak) {
    const names = ["見習い兵", "守備隊", "精鋭小隊", "軍団の一角", "猛将", "大隊長", "副将", "大将"];
    return names[Math.min(streak, names.length - 1)] || `強敵 Lv${streak + 1}`;
  }

  // ========== マリガン ==========
  renderMulligan() {
    const area = document.getElementById("mulligan-hand");
    area.innerHTML = "";
    this.player.hand.forEach(c => {
      area.appendChild(this.createCardElement(c, false));
    });
  }

  startBattleAfterMulligan(doMulligan) {
    if (doMulligan) {
      this.player.deck.push(...this.player.hand);
      this.player.hand = [];
      shuffle(this.player.deck);
      this.drawCards("player", 5);
      this.log("手札を引き直しました。");
    }
    this.showScreen("battle-screen");
    this.startTurn("player");
  }

  // ========== ターン処理 ==========
  startTurn(who) {
    this.currentPlayer = who;
    this.selectedUnitUid = null;
    this.pendingTarget = null;
    this.updateCancelButton();

    const p = who === "player" ? this.player : this.enemy;

    p.maxMana = Math.min(10, p.maxMana + 1);
    p.mana = p.maxMana;
    p.field.forEach(c => {
      c.exhausted = false;
      c._summonTurnFaceBlock = false; // ターン経過で突撃のプレイヤー攻撃制限解除
    });
    this.drawCards(who, 1);

    if (who === "player") {
      document.getElementById("turn-indicator").textContent = "あなたのターン";
      this.log(`--- あなたのターン（マナ ${p.mana}）---`);
      this.updateUI();
    } else {
      document.getElementById("turn-indicator").textContent = "敵のターン";
      this.log(`--- 敵のターン ---`);
      this.updateUI();
      setTimeout(() => this.enemyAI(), 600);
    }
  }

  endPlayerTurn() {
    if (this.currentPlayer !== "player") return;
    if (this.pendingTarget) {
      this.log("対象選択中です。「キャンセル」で解除できます。");
      return;
    }
    this.startTurn("enemy");
  }

  // ========== キャンセル ==========
  cancelPending() {
    if (!this.pendingTarget) return;
    this.log("選択をキャンセルしました。");
    this.pendingTarget = null;
    this.selectedUnitUid = null;
    this.updateCancelButton();
    this.updateUI();
  }

  updateCancelButton() {
    const btn = document.getElementById("btn-cancel");
    if (this.pendingTarget) {
      btn.classList.remove("hidden");
    } else {
      btn.classList.add("hidden");
    }
  }

  // ========== ドロー・召喚 ==========
  drawCards(who, n) {
    const p = who === "player" ? this.player : this.enemy;
    for (let i = 0; i < n; i++) {
      if (p.deck.length === 0) {
        this.log(`${who === "player" ? "あなた" : "敵"}のデッキが切れました！`);
        break;
      }
      const id = p.deck.pop();
      const card = createCardInstance(id, who);
      if (card) p.hand.push(card);
    }
  }

  drawRandomUnit(who, n) {
    const p = who === "player" ? this.player : this.enemy;
    const unitIndices = [];
    p.deck.forEach((id, i) => {
      if (CARD_POOL[id] && CARD_POOL[id].type === "unit") unitIndices.push(i);
    });
    let drawn = 0;
    for (let i = 0; i < n && unitIndices.length > 0; i++) {
      const r = Math.floor(Math.random() * unitIndices.length);
      const deckIdx = unitIndices.splice(r, 1)[0];
      // 後ろから消すとインデックスがずれないよう、大きい順に処理したいが簡易に再構築
      const id = p.deck[deckIdx];
      p.deck.splice(deckIdx, 1);
      // 残りの unitIndices を修正
      for (let j = 0; j < unitIndices.length; j++) {
        if (unitIndices[j] > deckIdx) unitIndices[j]--;
      }
      const card = createCardInstance(id, who);
      if (card) {
        p.hand.push(card);
        drawn++;
      }
    }
    this.log(`${who === "player" ? "あなた" : "敵"}はユニットを${drawn}枚引いた。`);
  }

  summonToken(who, cardId) {
    const p = who === "player" ? this.player : this.enemy;
    if (p.field.length >= 5) {
      this.log("場がいっぱいのため召喚できなかった。");
      return false;
    }
    const card = createCardInstance(cardId, who);
    if (!card) return false;
    // キーワード：速攻・突撃
    card.exhausted = (card.rush || card.charge) ? false : true;
    if (card.charge && !card.rush) card._summonTurnFaceBlock = true;
    p.field.push(card);
    this.log(`${card.name}を場に出した。`);
    // 場に出た時効果（対象不要のみ自動誘発。対象必要はランダム or スキップ）
    const def = CARD_POOL[cardId];
    if (def && def.onPlay) {
      if (def.needsTarget) {
        const enemies = (who === "player" ? this.enemy : this.player).field.filter(c => c.type === "unit");
        const t = enemies.length ? enemies[Math.floor(Math.random() * enemies.length)] : null;
        def.onPlay(this, who, t ? t.uid : null);
      } else if (def.needsTargetAlly) {
        const allies = p.field.filter(c => c.type === "unit" && c.uid !== card.uid);
        const t = allies.length ? allies[Math.floor(Math.random() * allies.length)] : null;
        def.onPlay(this, who, t ? t.uid : null);
      } else {
        def.onPlay(this, who);
      }
    }
    this.checkDeaths();
    return true;
  }

  // ========== 効果ヘルパー ==========
  healPlayer(who, amount) {
    const p = who === "player" ? this.player : this.enemy;
    const before = p.hp;
    p.hp = Math.min(20, p.hp + amount);
    this.log(`${who === "player" ? "あなた" : "敵"}の体力が${p.hp - before}回復した。（${p.hp}）`);
  }

  damagePlayer(who, amount) {
    const p = who === "player" ? this.player : this.enemy;
    p.hp -= amount;
    this.log(`${who === "player" ? "あなた" : "敵"}に${amount}ダメージ！（残り${Math.max(0, p.hp)}）`);
  }

  buffAllUnits(who, atkBonus, hpBonus) {
    const p = who === "player" ? this.player : this.enemy;
    let count = 0;
    p.field.filter(c => c.type === "unit").forEach(c => {
      c.atk += atkBonus;
      c.hp += hpBonus;
      c.maxHp += hpBonus;
      count++;
    });
    if (count > 0) {
      const parts = [];
      if (atkBonus) parts.push(`攻撃力+${atkBonus}`);
      if (hpBonus) parts.push(`体力+${hpBonus}`);
      this.log(`${who === "player" ? "味方" : "敵"}ユニット${count}体に${parts.join("、")}`);
    }
  }

  healUnit(uid, amount) {
    let card = this.player.field.find(c => c.uid === uid);
    if (!card) card = this.enemy.field.find(c => c.uid === uid);
    if (!card || card.type !== "unit") return;
    const before = card.hp;
    card.hp = Math.min(card.maxHp, card.hp + amount);
    this.log(`${card.name}の体力が${card.hp - before}回復した。（${card.hp}/${card.maxHp}）`);
  }

  destroyUnit(uid) {
    let card = this.player.field.find(c => c.uid === uid);
    let who = "player";
    if (!card) {
      card = this.enemy.field.find(c => c.uid === uid);
      who = "enemy";
    }
    if (!card || card.type !== "unit") return;
    card.hp = 0;
    this.log(`${card.name}は破壊された。`);
    this.checkDeaths();
  }

  buffUnit(uid, atkBonus, hpBonus) {
    let card = this.player.field.find(c => c.uid === uid);
    if (!card) card = this.enemy.field.find(c => c.uid === uid);
    if (!card || card.type !== "unit") return;
    card.atk += atkBonus;
    card.hp += hpBonus;
    card.maxHp += hpBonus;
    this.log(`${card.name}に攻撃+${atkBonus} 体力+${hpBonus}`);
  }

  giveCharge(uid) {
    let card = this.player.field.find(c => c.uid === uid);
    if (!card) card = this.enemy.field.find(c => c.uid === uid);
    if (!card || card.type !== "unit") return;
    card.charge = true;
    card.exhausted = false;
    this.log(`${card.name}に突撃を付与`);
  }

  destroyAny(uid) {
    let card = this.player.field.find(c => c.uid === uid);
    let who = "player";
    if (!card) {
      card = this.enemy.field.find(c => c.uid === uid);
      who = "enemy";
    }
    if (!card) return;
    if (card.type === "unit") {
      card.hp = 0;
      this.log(`${card.name}は破壊された。`);
      this.checkDeaths();
    } else {
      const p = who === "player" ? this.player : this.enemy;
      p.field = p.field.filter(c => c.uid !== uid);
      p.grave.push(card);
      this.log(`${card.name}（フィールド）は破壊された。`);
    }
  }


  // ========== カードプレイ ==========
  tryPlayCard(cardUid) {
    if (this.currentPlayer !== "player") return;
    if (this.pendingTarget) return;

    const p = this.player;
    const idx = p.hand.findIndex(c => c.uid === cardUid);
    if (idx < 0) return;
    const card = p.hand[idx];
    const def = CARD_POOL[card.cardId];

    if (p.mana < card.cost) {
      this.log("マナが足りません。");
      return;
    }
    if ((card.type === "unit" || card.type === "field") && p.field.length >= 5) {
      this.log("場がいっぱいです（最大5枚）。");
      return;
    }

    // 敵ユニット対象が必要（ユニット出た時 or スペル）
    const needsEnemyTarget = (card.type === "unit" && card.needsTarget) ||
                             (card.type === "spell" && def && def.needsTarget);
    // 味方ユニット対象が必要
    const needsAllyTarget = card.type === "unit" && card.needsTargetAlly;

    if (needsEnemyTarget) {
      const enemies = this.enemy.field.filter(c => c.type === "unit");
      if (enemies.length === 0) {
        if (card.type === "spell") {
          // 対象なしでスペルは発動しない（無駄打ち防止）
          this.log("対象となる敵ユニットがいません。");
          return;
        }
        this._playCardToField(idx, card);
      } else {
        this.pendingTarget = {
          type: card.type === "spell" ? "spellTarget" : "playOnPlay",
          cardUid, handIdx: idx
        };
        this.log("対象の敵ユニットを選択してください。（キャンセル可）");
        this.updateCancelButton();
        this.updateUI();
      }
      return;
    }

    if (needsAllyTarget) {
      const allies = this.player.field.filter(c => c.type === "unit");
      // 出た後に自分も場にいるので、出す前は他の味方のみ。味方がいなければ効果なしで出す
      if (allies.length === 0) {
        this._playCardToField(idx, card);
      } else {
        this.pendingTarget = { type: "playOnPlayAlly", cardUid, handIdx: idx };
        this.log("対象の味方ユニットを選択してください。（キャンセル可）");
        this.updateCancelButton();
        this.updateUI();
      }
      return;
    }

    this._playCardToField(idx, card);
  }

  _playCardToField(handIdx, card) {
    const p = this.player;
    p.mana -= card.cost;
    p.hand.splice(handIdx, 1);

    if (card.type === "spell") {
      this.log(`${card.name}を唱えた。`);
      const def = CARD_POOL[card.cardId];
      if (def && def.effect) def.effect(this, "player");
      p.grave.push(card);
    } else {
      // 速攻・突撃なら出したターンでも攻撃可
      card.exhausted = (card.rush || card.charge) ? false : true;
      if (card.charge && !card.rush) card._summonTurnFaceBlock = true;
      p.field.push(card);
      this.log(`${card.name}を場に出した。`);
      const def = CARD_POOL[card.cardId];
      if (def && def.onPlay && !card.needsTarget && !card.needsTargetAlly) {
        def.onPlay(this, "player");
      }
    }
    this.pendingTarget = null;
    this.updateCancelButton();
    this.checkDeaths();
    this.updateUI();
    this.checkWinLose();
  }

  resolvePlayWithTarget(targetUid) {
    if (!this.pendingTarget) return;
    const { type, handIdx } = this.pendingTarget;
    const card = this.player.hand[handIdx];
    if (!card) {
      this.pendingTarget = null;
      this.updateCancelButton();
      return;
    }

    this.player.mana -= card.cost;
    this.player.hand.splice(handIdx, 1);

    if (type === "spellTarget") {
      this.log(`${card.name}を唱えた。`);
      const def = CARD_POOL[card.cardId];
      if (def && def.effect) def.effect(this, "player", targetUid);
      this.player.grave.push(card);
    } else {
      // unit onPlay with target (enemy or ally)
      card.exhausted = (card.rush || card.charge) ? false : true;
      this.player.field.push(card);
      this.log(`${card.name}を場に出した。`);
      const def = CARD_POOL[card.cardId];
      if (def && def.onPlay) def.onPlay(this, "player", targetUid);
    }

    this.pendingTarget = null;
    this.updateCancelButton();
    this.checkDeaths();
    this.updateUI();
    this.checkWinLose();
  }

  // ========== フィールド起動 ==========
  tryActivateField(cardUid) {
    if (this.currentPlayer !== "player") return;
    if (this.pendingTarget) return;

    const card = this.player.field.find(c => c.uid === cardUid);
    if (!card || card.type !== "field") return;
    const def = CARD_POOL[card.cardId];
    if (!def || !def.effect) return;

    const cost = def.activateCost || 0;
    if (this.player.mana < cost) {
      this.log("起動に必要なマナが足りません。");
      return;
    }
    if (card.cardId === "徴兵施設" && this.player.field.length >= 5) {
      this.log("場がいっぱいのため起動できません。");
      return;
    }

    // 要塞砲台など：ユニット or プレイヤー対象
    if (def.needsTargetOrPlayer) {
      this.pendingTarget = { type: "fieldTargetOrPlayer", fieldUid: cardUid, cost };
      this.log("ダメージ対象（敵ユニット or 「プレイヤーに攻撃」ボタン）を選んでください。");
      this.updateCancelButton();
      this.updateUI();
      return;
    }
    // 訓練所など：味方ユニット対象
    if (def.needsTargetAlly) {
      const allies = this.player.field.filter(c => c.type === "unit");
      if (!allies.length) {
        this.log("対象となる味方ユニットがいません。");
        return;
      }
      this.pendingTarget = { type: "fieldTargetAlly", fieldUid: cardUid, cost };
      this.log("対象の味方ユニットを選択してください。");
      this.updateCancelButton();
      this.updateUI();
      return;
    }

    this.player.mana -= cost;
    this.log(`${card.name}を起動した。`);
    def.effect(this, "player");
    this.checkDeaths();
    this.updateUI();
    this.checkWinLose();
  }

  resolveFieldTarget(targetUid) {
    if (!this.pendingTarget) return;
    if (this.pendingTarget.type !== "fieldTargetOrPlayer" && this.pendingTarget.type !== "fieldTargetAlly") return;
    const { fieldUid, cost } = this.pendingTarget;
    const card = this.player.field.find(c => c.uid === fieldUid);
    if (!card) {
      this.pendingTarget = null;
      this.updateCancelButton();
      return;
    }
    const def = CARD_POOL[card.cardId];
    this.player.mana -= cost;
    this.log(`${card.name}を起動した。`);
    if (def && def.effect) def.effect(this, "player", targetUid);
    this.pendingTarget = null;
    this.updateCancelButton();
    this.checkDeaths();
    this.updateUI();
    this.checkWinLose();
  }

  enemyHasGuard() {
    return this.enemy.field.some(c => c.type === "unit" && c.guard);
  }

  playerHasGuard() {
    return this.player.field.some(c => c.type === "unit" && c.guard);
  }

  // ========== 攻撃 ==========
  selectUnitForAttack(uid) {
    if (this.currentPlayer !== "player") return;
    if (this.pendingTarget && this.pendingTarget.type !== "attack") return;

    const card = this.player.field.find(c => c.uid === uid);
    if (!card || card.type !== "unit") return;
    if (card.exhausted) {
      this.log("このユニットは既に行動済みです。");
      return;
    }
    this.selectedUnitUid = uid;
    this.pendingTarget = { type: "attack", attackerUid: uid };
    this.log(`${card.name}で攻撃する対象を選んでください（敵ユニット or 「プレイヤーに攻撃」）。キャンセル可`);
    this.updateCancelButton();
    this.updateUI();
  }

  attackUnit(targetUid) {
    if (!this.pendingTarget || this.pendingTarget.type !== "attack") return;
    const attacker = this.player.field.find(c => c.uid === this.pendingTarget.attackerUid);
    const target = this.enemy.field.find(c => c.uid === targetUid);
    if (!attacker || !target || target.type !== "unit") return;

    this.log(`${attacker.name}が${target.name}に攻撃！`);
    target.hp -= attacker.atk;
    attacker.hp -= target.atk;
    attacker.exhausted = true;
    this.selectedUnitUid = null;
    this.pendingTarget = null;
    this.updateCancelButton();
    this.checkDeaths();
    this.updateUI();
    this.checkWinLose();
  }

  attackEnemyPlayer() {
    // 要塞砲台のプレイヤー対象
    if (this.pendingTarget && this.pendingTarget.type === "fieldTargetOrPlayer") {
      this.resolveFieldTarget("player");
      return;
    }
    if (!this.selectedUnitUid) return;
    const attacker = this.player.field.find(c => c.uid === this.selectedUnitUid);
    if (!attacker || attacker.exhausted) return;

    // 護衛：敵に護衛ユニットがいるとプレイヤー攻撃不可
    if (this.enemyHasGuard()) {
      this.log("敵の護衛ユニットがいるため、プレイヤーに攻撃できない。");
      return;
    }
    // 突撃のみ（速攻なし）は出たターンにプレイヤー攻撃不可
    if (attacker.charge && !attacker.rush && attacker._summonTurnFaceBlock) {
      this.log("突撃ユニットは出たターンにプレイヤーへ攻撃できない。");
      return;
    }

    this.log(`${attacker.name}が敵プレイヤーに${attacker.atk}ダメージ！`);
    this.enemy.hp -= attacker.atk;
    attacker.exhausted = true;
    this.selectedUnitUid = null;
    this.pendingTarget = null;
    this.updateCancelButton();
    this.updateUI();
    this.checkWinLose();
  }

  // ========== ダメージ処理 ==========
  damageUnit(uid, amount) {
    let card = this.player.field.find(c => c.uid === uid);
    if (!card) card = this.enemy.field.find(c => c.uid === uid);
    if (!card || card.type !== "unit") return;
    card.hp -= amount;
    this.log(`${card.name}に${amount}ダメージ。`);
  }

  damageAllUnits(who, amount) {
    const p = who === "player" ? this.player : this.enemy;
    p.field.filter(c => c.type === "unit").forEach(c => {
      c.hp -= amount;
    });
    this.log(`${who === "player" ? "あなたの" : "敵の"}全ユニットに${amount}ダメージ。`);
  }

  checkDeaths() {
    ["player", "enemy"].forEach(who => {
      const p = who === "player" ? this.player : this.enemy;
      const dead = p.field.filter(c => c.type === "unit" && c.hp <= 0);
      dead.forEach(c => {
        this.log(`${c.name}は破壊された。`);
        // 倒された時効果
        if (c.onDeath) {
          try { c.onDeath(this, who); } catch (e) { console.error(e); }
        } else {
          const def = CARD_POOL[c.cardId];
          if (def && def.onDeath) {
            try { def.onDeath(this, who); } catch (e) { console.error(e); }
          }
        }
        p.grave.push(c);
      });
      p.field = p.field.filter(c => !(c.type === "unit" && c.hp <= 0));
    });
  }

  // ========== 勝敗 ==========
  checkWinLose() {
    if (this.enemy.hp <= 0) {
      this.winBattle();
      return true;
    }
    if (this.player.hp <= 0) {
      this.loseBattle();
      return true;
    }
    return false;
  }

  winBattle() {
    this.winStreak++;
    const enemyPower = getEnemyPower(this.winStreak - 1);
    const gained = calcClearScore(this.winStreak, enemyPower);
    this.runScore += gained;
    this.log(`敵を倒した！ 連勝: ${this.winStreak} / スコア+${gained}`);
    let rewards = getRewardCards(this.collection);
    // 10勝ごとにレジェンド1枚保証
    if (this.winStreak % 10 === 0) {
      const counts = {};
      this.collection.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
      const legs = Object.keys(CARD_POOL).filter(id => getRarity(id) === "legend" && (counts[id] || 0) < 2);
      if (legs.length) {
        rewards[4] = legs[Math.floor(Math.random() * legs.length)];
      }
    }
    this.collection.push(...rewards);
    this.hasActiveRun = true;

    this.showScreen("reward-screen");
    const area = document.getElementById("reward-cards");
    area.innerHTML = "";
    // 種類ごとにまとめて表示
    const seen = {};
    rewards.forEach(id => { seen[id] = (seen[id] || 0) + 1; });
    Object.entries(seen).forEach(([id, cnt]) => {
      const inst = createCardInstance(id, "player");
      const el = this.createCardElement(inst, false);
      const badge = document.createElement("div");
      badge.style.cssText = "text-align:center;font-weight:bold;color:#ffd700;margin-top:4px;";
      badge.textContent = `×${cnt}`;
      const wrap = document.createElement("div");
      wrap.appendChild(el);
      wrap.appendChild(badge);
      area.appendChild(wrap);
    });
    const scoreEl = document.getElementById("reward-score");
    if (scoreEl) scoreEl.textContent = `${gained}（累計 ${this.runScore}）`;
  }

  loseBattle() {
    this.hasActiveRun = false;
    document.getElementById("final-streak").textContent = this.winStreak;
    const fs = document.getElementById("final-score");
    if (fs) fs.textContent = this.runScore;
    this.showScreen("gameover-screen");
  }

  // ========== 敵AI ==========
  enemyAI() {
    if (this.checkWinLose()) return;
    const e = this.enemy;

    // 優先度: 高コスト＋除去・全体ダメ・回復をやや優先
    const scoreCard = (c) => {
      let s = c.cost * 10;
      const def = CARD_POOL[c.cardId];
      if (!def) return s;
      const tx = def.effectText || "";
      if (tx.includes("破壊")) s += 25;
      if (tx.includes("全てに")) s += 20;
      if (tx.includes("回復")) s += 8;
      if (c.rush || c.charge) s += 12;
      if (c.guard) s += 10;
      if (c.type === "unit") s += (c.atk + c.hp);
      return s;
    };
    const playable = e.hand
      .filter(c => c.cost <= e.mana)
      .filter(c => {
        if (c.type === "unit" || c.type === "field") return e.field.length < 5;
        return true;
      })
      .sort((a, b) => scoreCard(b) - scoreCard(a));

    for (const card of [...playable]) {
      if (e.mana < card.cost) continue;
      if ((card.type === "unit" || card.type === "field") && e.field.length >= 5) continue;

      const def = CARD_POOL[card.cardId];

      // 対象が必要なスペルで対象がいない場合はスキップ
      if (card.type === "spell" && def && def.needsTarget) {
        const targets = this.player.field.filter(c => c.type === "unit");
        if (targets.length === 0) continue;
      }

      e.mana -= card.cost;
      const idx = e.hand.findIndex(c => c.uid === card.uid);
      if (idx >= 0) e.hand.splice(idx, 1);

      if (card.type === "spell") {
        this.log(`敵は${card.name}を唱えた。`);
        if (def && def.effect) {
          if (def.needsTarget) {
            const targets = this.player.field.filter(c => c.type === "unit");
            const t = targets[Math.floor(Math.random() * targets.length)];
            def.effect(this, "enemy", t.uid);
          } else {
            def.effect(this, "enemy");
          }
        }
        e.grave.push(card);
      } else {
        card.exhausted = (card.rush || card.charge) ? false : true;
        if (card.charge && !card.rush) card._summonTurnFaceBlock = true;
        e.field.push(card);
        this.log(`敵は${card.name}を場に出した。`);
        if (def && def.onPlay) {
          if (card.needsTarget) {
            const targets = this.player.field.filter(c => c.type === "unit");
            const t = targets.length ? targets[Math.floor(Math.random() * targets.length)] : null;
            def.onPlay(this, "enemy", t ? t.uid : null);
          } else if (card.needsTargetAlly) {
            const allies = e.field.filter(c => c.type === "unit" && c.uid !== card.uid);
            const t = allies.length ? allies[Math.floor(Math.random() * allies.length)] : null;
            def.onPlay(this, "enemy", t ? t.uid : null);
          } else {
            def.onPlay(this, "enemy");
          }
        }
      }
      this.checkDeaths();
      if (this.checkWinLose()) return;
    }

    // フィールド起動（召喚系は場に空きが必要）
    e.field.filter(c => c.type === "field").forEach(card => {
      const def = CARD_POOL[card.cardId];
      if (!def || !def.effect) return;
      const cost = def.activateCost || 0;
      if (e.mana < cost) return;
      // 徴兵施設のみ場空きが必要
      if (card.cardId === "徴兵施設" && e.field.length >= 5) return;
      e.mana -= cost;
      this.log(`敵は${card.name}を起動した。`);
      def.effect(this, "enemy");
      this.checkDeaths();
    });
    if (this.checkWinLose()) return;

    const attackers = e.field.filter(c => c.type === "unit" && !c.exhausted);
    // フェイスで倒せるなら優先
    const totalAtk = attackers.reduce((s, a) => {
      if (a.charge && !a.rush && a._summonTurnFaceBlock) return s;
      return s + a.atk;
    }, 0);
    const canLethal = !this.playerHasGuard() && totalAtk >= this.player.hp;

    for (const atk of attackers) {
      let targets = this.player.field.filter(c => c.type === "unit");
      const guards = targets.filter(c => c.guard);
      if (guards.length > 0) targets = guards;

      const faceBlocked = this.playerHasGuard() || (atk.charge && !atk.rush && atk._summonTurnFaceBlock);

      if (canLethal && !faceBlocked && !guards.length) {
        this.log(`敵の${atk.name}があなたに${atk.atk}ダメージ！`);
        this.player.hp -= atk.atk;
        atk.exhausted = true;
      } else if (targets.length > 0) {
        // 有利交換: 倒せる中で最も脅威（攻高）を優先、なければ低体力
        const killable = targets.filter(u => u.hp <= atk.atk);
        let t;
        if (killable.length) {
          killable.sort((a, b) => (b.atk - a.atk) || (a.hp - b.hp));
          t = killable[0];
        } else {
          targets.sort((a, b) => a.hp - b.hp);
          t = targets[0];
        }
        this.log(`敵の${atk.name}が${t.name}に攻撃！`);
        t.hp -= atk.atk;
        atk.hp -= t.atk;
        atk.exhausted = true;
      } else if (!faceBlocked) {
        this.log(`敵の${atk.name}があなたに${atk.atk}ダメージ！`);
        this.player.hp -= atk.atk;
        atk.exhausted = true;
      } else {
        atk.exhausted = true;
      }
      this.checkDeaths();
      if (this.checkWinLose()) return;
    }

    this.updateUI();
    setTimeout(() => {
      if (this.player.hp > 0 && this.enemy.hp > 0) {
        this.startTurn("player");
      }
    }, 800);
  }

  // ========== UI描画 ==========
  updateUI() {
    const php = Math.max(0, this.player.hp);
    const ehp = Math.max(0, this.enemy.hp);
    document.getElementById("player-hp").textContent = php;
    document.getElementById("enemy-hp").textContent = ehp;
    document.getElementById("player-mana").textContent = this.player.mana;
    document.getElementById("player-max-mana").textContent = this.player.maxMana;
    document.getElementById("win-streak").textContent = this.winStreak;
    const scoreHud = document.getElementById("run-score");
    if (scoreHud) scoreHud.textContent = this.runScore;
    document.getElementById("enemy-name").textContent = this.enemyName;
    document.getElementById("field-count").textContent = this.player.field.length;

    // HPバー
    const phpBar = document.getElementById("player-hp-bar");
    const ehpBar = document.getElementById("enemy-hp-bar");
    if (phpBar) phpBar.style.width = `${(php / 20) * 100}%`;
    if (ehpBar) ehpBar.style.width = `${(ehp / 20) * 100}%`;

    // マナピップ（最大マナ分の枠、現在マナ分が点灯）
    const pipsEl = document.getElementById("player-mana-pips");
    if (pipsEl) {
      pipsEl.innerHTML = "";
      for (let i = 0; i < 10; i++) {
        const pip = document.createElement("div");
        pip.className = "mana-pip";
        if (i < this.player.mana) {
          pip.classList.add("filled");
        } else if (i < this.player.maxMana) {
          pip.classList.add("available");
        }
        pipsEl.appendChild(pip);
      }
    }

    // 手札：クリック/タップで選択＋詳細表示 → 場をクリックでプレイ
    const handEl = document.getElementById("player-hand");
    handEl.innerHTML = "";
    this.player.hand.forEach(c => {
      const el = this.createCardElement(c, true);
      if (c.cost <= this.player.mana && this.currentPlayer === "player" && !this.pendingTarget) {
        if (!((c.type === "unit" || c.type === "field") && this.player.field.length >= 5)) {
          el.classList.add("can-play");
        }
      }
      if (this._selectedHandUid === c.uid) {
        el.classList.add("tap-armed");
        el.classList.add("show-tooltip");
      }
      el.onclick = (e) => {
        e.stopPropagation();
        if (this.pendingTarget) return;
        if (this.currentPlayer !== "player") return;
        // 選択＋詳細
        document.querySelectorAll(".card.show-tooltip").forEach(x => x.classList.remove("show-tooltip"));
        document.querySelectorAll(".card.tap-armed").forEach(x => x.classList.remove("tap-armed"));
        this._selectedHandUid = c.uid;
        el.classList.add("tap-armed");
        el.classList.add("show-tooltip");
        this.log(`${c.name}を選択（場をクリックしてプレイ）`);
        this.updateUIBoardHighlight();
      };
      handEl.appendChild(el);
    });

    // 自分の場
    const pf = document.getElementById("player-field");
    pf.innerHTML = "";
    this.player.field.forEach(c => {
      const el = this.createCardElement(c, true);
      if (c.exhausted) el.classList.add("exhausted");
      if (this.selectedUnitUid === c.uid) el.classList.add("selected");

      // 味方対象選択中
      if (this.pendingTarget && (this.pendingTarget.type === "playOnPlayAlly" || this.pendingTarget.type === "fieldTargetAlly") && c.type === "unit") {
        el.classList.add("targetable");
        el.onclick = () => {
          if (this.pendingTarget.type === "fieldTargetAlly") this.resolveFieldTarget(c.uid);
          else this.resolvePlayWithTarget(c.uid);
        };
      } else {
        el.onclick = () => {
          if (this.pendingTarget && this.pendingTarget.type === "attack") return;
          if (this.pendingTarget) return;
          if (c.type === "unit" && !c.exhausted && this.currentPlayer === "player") {
            this.selectUnitForAttack(c.uid);
          } else if (c.type === "field" && this.currentPlayer === "player") {
            this.tryActivateField(c.uid);
          }
        };
      }
      // 場のカード詳細タップ
      if (!el.onclick) {
        el.onclick = () => {
          document.querySelectorAll(".card.show-tooltip").forEach(x => x.classList.remove("show-tooltip"));
          el.classList.add("show-tooltip");
        };
      } else {
        const prev = el.onclick;
        el.onclick = (ev) => {
          if (this._selectedHandUid && !this.pendingTarget) {
            // 手札選択中に場のカードをタップしてもプレイ確定
            this.confirmPlaySelected();
            return;
          }
          prev(ev);
        };
      }
      pf.appendChild(el);
    });

    // 場（空き部分）をクリックで手札選択中のカードをプレイ
    pf.addEventListener("click", (e) => {
      if (!this._selectedHandUid || this.pendingTarget) return;
      // 場のカード自身のクリックは各カードのハンドラで処理
      if (e.target.closest && e.target.closest(".card")) return;
      this.confirmPlaySelected();
    });

    // 敵の場
    const ef = document.getElementById("enemy-field");
    ef.innerHTML = "";
    this.enemy.field.forEach(c => {
      const el = this.createCardElement(c, false);
      if (c.exhausted) el.classList.add("exhausted");

      if (this.pendingTarget) {
        if (this.pendingTarget.type === "attack" && c.type === "unit") {
          el.classList.add("targetable");
          el.onclick = () => this.attackUnit(c.uid);
        } else if ((this.pendingTarget.type === "playOnPlay" || this.pendingTarget.type === "spellTarget")) {
          const def = CARD_POOL[this.player.hand[this.pendingTarget.handIdx]?.cardId];
          const allowField = def && def.canTargetField;
          if (c.type === "unit" || (allowField && c.type === "field")) {
            el.classList.add("targetable");
            el.onclick = () => this.resolvePlayWithTarget(c.uid);
          }
        } else if (this.pendingTarget.type === "fieldTargetOrPlayer" && c.type === "unit") {
          el.classList.add("targetable");
          el.onclick = () => this.resolveFieldTarget(c.uid);
        }
      }
      if (!el.onclick) {
        el.onclick = () => {
          document.querySelectorAll(".card.show-tooltip").forEach(x => x.classList.remove("show-tooltip"));
          el.classList.add("show-tooltip");
        };
      }
      ef.appendChild(el);
    });

    const atkBtn = document.getElementById("btn-attack-player");
    const canFace = this.selectedUnitUid && this.currentPlayer === "player" && this.pendingTarget?.type === "attack";
    const canFieldFace = this.pendingTarget?.type === "fieldTargetOrPlayer";
    atkBtn.disabled = !(canFace || canFieldFace);
    if (canFieldFace) atkBtn.textContent = "プレイヤーにダメージ";
    else atkBtn.textContent = "プレイヤーに攻撃";
  }

  createCardElement(card, interactive) {
    const el = document.createElement("div");
    el.className = `card ${card.type === "field" ? "field-card" : card.type}`;
    el.dataset.uid = card.uid;

    const typeLabel = card.type === "unit" ? "ユニット" : card.type === "spell" ? "呪文" : "フィールド";

    // キーワードアイコン
    const icons = [];
    if (card.guard) icons.push('<span class="kw-icon" title="護衛">🛡️</span>');
    if (card.charge) icons.push('<span class="kw-icon" title="突撃">✊</span>');
    if (card.rush) icons.push('<span class="kw-icon" title="速攻">💨</span>');
    const iconHtml = icons.length ? `<div class="kw-icons">${icons.join("")}</div>` : "";

    let statsHtml = "";
    let tooltipStats = "";
    let kwLine = "";
    if (card.type === "unit") {
      const maxHp = card.maxHp || card.hp;
      let hpClass = "hp stat-badge";
      if (card.hp < maxHp) {
        hpClass += card.hp <= Math.ceil(maxHp / 2) ? " critical" : " damaged";
      }
      const hpText = card.hp < maxHp ? `${card.hp}/${maxHp}` : `${card.hp}`;
      statsHtml = `
        <div class="stats">
          <span class="atk stat-badge">${card.atk}</span>
          <span class="${hpClass}">${hpText}</span>
        </div>`;
      tooltipStats = `<div class="tt-stats">攻撃力 <strong style="color:#ff8a8a">${card.atk}</strong>　/　体力 <strong style="color:#8aff8a">${card.hp}</strong>${card.hp < maxHp ? " / " + maxHp : ""}</div>`;
      const kws = [];
      if (card.guard) kws.push("🛡️護衛");
      if (card.charge) kws.push("✊突撃");
      if (card.rush) kws.push("💨速攻");
      if (kws.length) kwLine = `<div class="tt-meta">${kws.join("　")}</div>`;
    }

    const effectLine = card.effectText
      ? `<div class="tt-effect">${card.effectText}</div>`
      : "";

    const rarity = card.rarity || "normal";
    const rarityLabel = (typeof RARITY_LABEL !== "undefined" && RARITY_LABEL[rarity]) ? RARITY_LABEL[rarity] : rarity;

    // アート用アイコン
    let artIcon = "⚔️";
    if (card.type === "spell") artIcon = "📜";
    else if (card.type === "field") artIcon = "🏰";
    else if (card.guard) artIcon = "🛡️";
    else if (card.rush) artIcon = "💨";
    else if (card.charge) artIcon = "✊";

    el.innerHTML = `
      <div class="cost">${card.cost}</div>
      ${iconHtml}
      <div class="card-art">${artIcon}</div>
      <div class="name">${card.name}</div>
      <div class="type-label">${typeLabel}</div>
      <div class="effect">${card.effectText || ""}</div>
      ${statsHtml}
      <div class="rarity-row">${rarity === "normal" ? "" : `<span class="rarity-dot rarity-${rarity}" title="${rarityLabel}"></span>`}</div>
      <div class="card-tooltip">
        <div class="tt-name">${card.name}</div>
        <div class="tt-meta">コスト ${card.cost}　／　${typeLabel}　／　${rarityLabel}</div>
        ${kwLine}
        ${tooltipStats}
        ${effectLine}
      </div>
    `;
    return el;
  }
}

window.addEventListener("DOMContentLoaded", () => {
  window.game = new Game();
  if (window.game.isTouchDevice()) {
    document.body.classList.add("is-mobile");
  }
  // 画面向き・リサイズでモバイル判定を更新
  const updateMobile = () => {
    if (window.innerWidth <= 900 || window.game.isTouchDevice()) {
      document.body.classList.add("is-mobile");
    }
  };
  window.addEventListener("resize", updateMobile);
  updateMobile();
  document.addEventListener("touchstart", (e) => {
    if (!e.target.closest(".card.show-tooltip") && !e.target.closest(".card-tooltip")) {
      document.querySelectorAll(".card.show-tooltip").forEach(x => x.classList.remove("show-tooltip"));
    }
  }, { passive: true });
});
