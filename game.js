/**
 * ローグライクカードゲーム - メインロジック
 */


/**
 * BGM管理
 * bgm/ フォルダに title / battle / reward / main を配置
 * 拡張子: mp3, ogg, wav, m4a
 */
class BgmManager {
  constructor() {
    this.audio = new Audio();
    this.audio.loop = true;
    this.audio.preload = "auto";
    this.volume = 0.4;
    this.muted = false;
    this.unlocked = false;
    this.currentTrack = null;
    this.currentSrc = null;
    // バトル用BGM（戦闘開始ごとにランダムで1曲）
    this.battleTracks = [
      "bgm/battle1.mp3",
      "bgm/battle2.mp3",
      "bgm/battle3.mp3",
      "bgm/battle4.mp3",
    ];
    this.audio.volume = this.volume;

    // ローカル保存
    try {
      const v = localStorage.getItem("rcg_bgm_vol");
      const m = localStorage.getItem("rcg_bgm_mute");
      if (v != null) this.volume = Math.max(0, Math.min(1, Number(v)));
      if (m != null) this.muted = m === "1";
      this.audio.volume = this.muted ? 0 : this.volume;
    } catch (_) {}

    this.audio.addEventListener("error", () => {
      // ファイル未配置時は静かに失敗
      console.info("[BGM] 再生できないかファイルがありません:", this.currentTrack);
    });
  }

  bindUI() {
    const btn = document.getElementById("btn-bgm-toggle");
    const slider = document.getElementById("bgm-volume");
    if (slider) {
      slider.value = String(Math.round(this.volume * 100));
      slider.oninput = () => {
        this.volume = Number(slider.value) / 100;
        if (!this.muted) this.audio.volume = this.volume;
        try { localStorage.setItem("rcg_bgm_vol", String(this.volume)); } catch (_) {}
      };
    }
    if (btn) {
      btn.onclick = () => this.toggleMute();
      this._updateBtn();
    }
    // ユーザー操作でアンロック
    const unlock = () => this.unlock();
    document.addEventListener("click", unlock, { once: true });
    document.addEventListener("touchend", unlock, { once: true });
  }

  _updateBtn() {
    const btn = document.getElementById("btn-bgm-toggle");
    if (!btn) return;
    btn.classList.toggle("muted", this.muted || this.volume === 0);
    btn.textContent = (this.muted || this.volume === 0) ? "♪̸" : "♪";
  }

  toggleMute() {
    this.muted = !this.muted;
    this.audio.volume = this.muted ? 0 : this.volume;
    try { localStorage.setItem("rcg_bgm_mute", this.muted ? "1" : "0"); } catch (_) {}
    this._updateBtn();
    if (!this.muted && this.unlocked && this.currentTrack) {
      this.audio.play().catch(() => {});
    }
  }

  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    // 無音再生でアンロックを試みる
    this.audio.play().then(() => {
      if (!this.currentTrack) this.audio.pause();
    }).catch(() => {});
    if (this.currentTrack) this.play(this.currentTrack, true);
  }

  _candidates(name) {
    const exts = ["mp3", "ogg", "wav", "m4a"];
    const list = [];
    for (const ext of exts) list.push(`bgm/${name}.${ext}`);
    return list;
  }

  async _resolveSrc(track) {
    // track: title | battle | reward | main
    // file:// や簡易サーバでは存在確認が難しいので優先パスを返す
    const names = track === "main" ? ["main"] : [track, "main"];
    for (const name of names) {
      const paths = this._candidates(name);
      for (const path of paths) {
        try {
          const res = await fetch(path, { method: "HEAD" });
          if (res.ok) return path;
        } catch (_) {
          // オフライン/file は最初の候補を採用
        }
      }
    }
    return this._candidates(names[0])[0];
  }

  async play(track, force = false) {
    if (!track) return;
    if (!force && this.currentTrack === track && !this.audio.paused) return;
    this.currentTrack = track;

    const names = track === "main" ? ["main"] : [track, "main"];
    const candidates = [];
    for (const name of names) candidates.push(...this._candidates(name));

    const tryPlay = (idx) => {
      if (idx >= candidates.length) return;
      const src = candidates[idx];
      const onErr = () => {
        this.audio.removeEventListener("error", onErr);
        tryPlay(idx + 1);
      };
      this.audio.addEventListener("error", onErr);
      this.audio.loop = true;
      this.audio.volume = this.muted ? 0 : this.volume;
      this.audio.src = src;
      this.audio.load();
      if (this.unlocked) {
        this.audio.play().then(() => {
          this.audio.removeEventListener("error", onErr);
        }).catch(() => {
          // autoplay制限など。アンロック後に再試行
        });
      }
    };
    tryPlay(0);
  }

  stop() {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.currentTrack = null;
  }

  /** 画面IDに応じたBGM */
  forScreen(screenId) {
    if (screenId === "battle-screen") return this.playBattleRandom();
    if (screenId === "reward-screen" || screenId === "gameover-screen") return this.play("reward");
    // title, deckbuild, mulligan など
    return this.play("title");
  }

  /** バトル開始時: 4曲からランダムに1曲をループ再生 */
  playBattleRandom() {
    if (!this.battleTracks.length) return this.play("battle");
    // 直前と同じ曲を避けつつランダム
    let pick = this.battleTracks[Math.floor(Math.random() * this.battleTracks.length)];
    if (this.battleTracks.length > 1 && this.currentSrc) {
      const others = this.battleTracks.filter(s => s !== this.currentSrc);
      if (others.length) pick = others[Math.floor(Math.random() * others.length)];
    }
    return this.playSrc(pick, "battle");
  }

  playSrc(src, trackLabel) {
    this.currentTrack = trackLabel || src;
    this.currentSrc = src;
    this.audio.loop = true;
    this.audio.volume = this.muted ? 0 : this.volume;
    this.audio.src = src;
    this.audio.load();
    if (this.unlocked) {
      this.audio.play().catch(() => {});
    }
  }
}


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
    this.bgm = new BgmManager();
    this.bindUI();
    this.bgm.bindUI();
    this.bgm.forScreen("title-screen");
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

  loadHighScore() {
    try {
      const raw = localStorage.getItem("rcg_highscore");
      if (!raw) return { score: 0, streak: 0 };
      const data = JSON.parse(raw);
      return { score: data.score || 0, streak: data.streak || 0 };
    } catch (e) {
      return { score: 0, streak: 0 };
    }
  }

  saveHighScoreIfNeeded() {
    const cur = this.loadHighScore();
    let changed = false;
    if ((this.runScore || 0) > cur.score) {
      cur.score = this.runScore;
      changed = true;
    }
    if ((this.winStreak || 0) > cur.streak) {
      cur.streak = this.winStreak;
      changed = true;
    }
    if (changed) {
      try {
        localStorage.setItem("rcg_highscore", JSON.stringify(cur));
      } catch (e) {}
    }
    return cur;
  }

  updateHighScoreDisplay() {
    const hs = this.loadHighScore();
    const el = document.getElementById("high-score");
    const st = document.getElementById("high-streak");
    if (el) el.textContent = hs.score;
    if (st) st.textContent = hs.streak;
    const fe = document.getElementById("final-high-score");
    if (fe) fe.textContent = hs.score;
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
    this.updatePlayBar();
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
    if (this.bgm) this.bgm.forScreen(id);
  }

  goTitleKeepProgress() {
    this.hasActiveRun = true;
    this.showScreen("title-screen");
    this.updateTitleContinue();
  }

  updateTitleContinue() {
    this.updateHighScoreDisplay();
    const btn = document.getElementById("btn-continue");
    if (this.hasActiveRun && this.collection.length > 0) {
      btn.classList.remove("hidden");
      document.getElementById("continue-streak").textContent = this.winStreak;
    } else {
      btn.classList.add("hidden");
    }
  }

  continueRun() {
    // 再開時は必ずデッキ編成へ
    this.openDeckBuilder("mid");
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
      document.getElementById("pool-title").textContent = "カードリスト";
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
    const side = document.getElementById("deck-count-side");
    if (side) {
      side.textContent = total;
      side.style.color = total === 30 ? "#50c878" : "#e94560";
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

    if (who === "player") {
      this.battleTurn = (this.battleTurn || 0) + 1;
    }

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
    this._placeUnitOnField(who, card, null);
    return true;
  }

  /** ユニットを場に配置し、キーワードと出た時効果を適用 */
  _placeUnitOnField(who, card, targetUid) {
    const p = who === "player" ? this.player : this.enemy;
    const def = CARD_POOL[card.cardId];
    // 定義からキーワードを再適用（インスタンス漏れ防止）
    if (def) {
      card.rush = !!def.rush;
      card.charge = !!def.charge;
      card.guard = !!def.guard;
      card.onDeath = def.onDeath || null;
      card.effectText = def.effectText || card.effectText || "";
    }
    card.exhausted = (card.rush || card.charge) ? false : true;
    if (card.charge && !card.rush) card._summonTurnFaceBlock = true;
    else card._summonTurnFaceBlock = false;

    p.field.push(card);
    const kw = [];
    if (card.guard) kw.push("護衛");
    if (card.charge) kw.push("突撃");
    if (card.rush) kw.push("速攻");
    this.log(`${card.name}を場に出した。` + (kw.length ? `（${kw.join("・")}）` : ""));

    if (def && def.onPlay) {
      try {
        if (def.needsTarget) {
          let uid = targetUid;
          if (uid == null) {
            const enemies = (who === "player" ? this.enemy : this.player).field.filter(c => c.type === "unit");
            uid = enemies.length ? enemies[Math.floor(Math.random() * enemies.length)].uid : null;
          }
          def.onPlay(this, who, uid);
        } else if (def.needsTargetAlly) {
          let uid = targetUid;
          if (uid == null) {
            const allies = p.field.filter(c => c.type === "unit" && c.uid !== card.uid);
            uid = allies.length ? allies[Math.floor(Math.random() * allies.length)].uid : null;
          }
          def.onPlay(this, who, uid);
        } else {
          def.onPlay(this, who);
        }
      } catch (err) {
        console.error("onPlay error", card.cardId, err);
      }
    }
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

  destroyRandomField(who) {
    const p = who === "player" ? this.player : this.enemy;
    const fields = p.field.filter(c => c.type === "field");
    if (!fields.length) {
      this.log("破壊できるフィールドがなかった。");
      return;
    }
    const card = fields[Math.floor(Math.random() * fields.length)];
    p.field = p.field.filter(c => c.uid !== card.uid);
    p.grave.push(card);
    this.log(`${card.name}（フィールド）は破壊された。`);
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
  updatePlayBar() {
    let bar = document.getElementById("play-confirm-bar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "play-confirm-bar";
      bar.className = "play-confirm-bar hidden";
      bar.innerHTML = `
        <span id="play-confirm-name"></span>
        <button type="button" id="btn-confirm-play" class="btn primary">出す</button>
        <button type="button" id="btn-cancel-play" class="btn">取消</button>
      `;
      const arena = document.querySelector(".sv-arena") || document.getElementById("battle-screen");
      if (arena) arena.appendChild(bar);
      bar.querySelector("#btn-confirm-play").onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.confirmPlaySelected();
      };
      bar.querySelector("#btn-cancel-play").onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.clearHandTap();
        this.log("選択を取り消した。");
      };
    }
    if (this._selectedHandUid && this.currentPlayer === "player") {
      const card = this.player && this.player.hand.find(c => c.uid === this._selectedHandUid);
      bar.classList.remove("hidden");
      const nameEl = bar.querySelector("#play-confirm-name");
      if (nameEl) nameEl.textContent = card ? `選択中: ${card.name}` : "選択中";
    } else {
      bar.classList.add("hidden");
    }
  }

  updateUIBoardHighlight() {
    const pf = document.getElementById("player-field");
    if (!pf) return;
    if (this._selectedHandUid && this.currentPlayer === "player" && !this.pendingTarget) {
      pf.classList.add("play-target");
    } else {
      pf.classList.remove("play-target");
    }
  }

  confirmPlaySelected() {
    if (!this._selectedHandUid) return;
    const uid = this._selectedHandUid;
    this._selectedHandUid = null;
    document.querySelectorAll(".card.tap-armed").forEach(x => x.classList.remove("tap-armed"));
    document.querySelectorAll(".card.show-tooltip").forEach(x => x.classList.remove("show-tooltip"));
    this.updatePlayBar();
    this.updateUIBoardHighlight();
    this.tryPlayCard(uid);
  }

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
    } else if (card.type === "unit") {
      this._placeUnitOnField("player", card, null);
    } else {
      // フィールドカード
      card.exhausted = false;
      p.field.push(card);
      this.log(`${card.name}を場に出した。`);
      const def = CARD_POOL[card.cardId];
      if (def && def.onPlay) def.onPlay(this, "player");
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
      this._placeUnitOnField("player", card, targetUid);
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
    this.log(`${card.name}で攻撃対象を選んでください。護衛がいる場合は護衛ユニットのみ。キャンセル可`);
    this.updateCancelButton();
    this.updateUI();
  }

  attackUnit(targetUid) {
    if (!this.pendingTarget || this.pendingTarget.type !== "attack") return;
    const attacker = this.player.field.find(c => c.uid === this.pendingTarget.attackerUid);
    const target = this.enemy.field.find(c => c.uid === targetUid);
    if (!attacker || !target || target.type !== "unit") return;

    // 護衛がいる場合は護衛ユニットのみ攻撃可能
    if (this.enemyHasGuard() && !target.guard) {
      this.log("護衛ユニットがいるため、護衛を持たないユニットには攻撃できない。");
      return;
    }

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
    this.saveHighScoreIfNeeded();
    document.getElementById("final-streak").textContent = this.winStreak;
    const fs = document.getElementById("final-score");
    if (fs) fs.textContent = this.runScore;
    this.updateHighScoreDisplay();
    this.showScreen("gameover-screen");
  }

  // ========== 敵AI ==========

  triggerEnemySpecials() {
    const battleNum = (this.winStreak || 0) + 1;
    const turn = this.battleTurn || 1;
    if (!this.enemySpecialDone) this.enemySpecialDone = {};
    const key = `${battleNum}_${turn}`;
    if (this.enemySpecialDone[key]) return;
    if (battleNum < 15) return;

    const e = this.enemy;
    const mark = () => { this.enemySpecialDone[key] = true; };

    const addToHand = (cardId) => {
      const c = createCardInstance(cardId, "enemy");
      if (!c) return false;
      e.hand.push(c);
      this.log(`【敵の特殊】${c.name}が手札に加わった。`);
      return true;
    };
    const summon = (cardId) => {
      const ok = this.summonToken("enemy", cardId);
      if (ok) this.log(`【敵の特殊】${(CARD_POOL[cardId] && CARD_POOL[cardId].name) || cardId}が場に出た。`);
      return ok;
    };

    if (battleNum >= 15 && battleNum <= 29) {
      if (turn === 3) {
        mark();
        addToHand(Math.random() < 0.5 ? "矢倉" : "監視塔");
      } else if (turn === 6) {
        mark();
        const opts = [
          () => summon("鉄壁の守備兵"),
          () => summon("軍団兵"),
          () => addToHand("戦術爆撃"),
          () => addToHand("処刑"),
        ];
        opts[Math.floor(Math.random() * opts.length)]();
      }
    } else if (battleNum >= 30 && battleNum <= 49) {
      if (turn === 3) {
        mark();
        summon("槍兵");
      } else if (turn === 5) {
        mark();
        const opts = [
          () => summon("鉄壁の守備兵"),
          () => summon("軍団兵"),
          () => addToHand("再生の儀式"),
        ];
        opts[Math.floor(Math.random() * opts.length)]();
      } else if (turn === 8) {
        mark();
        const r = Math.floor(Math.random() * 3);
        if (r === 0) {
          this.player.field.filter(c => c.type === "unit").forEach(c => { c.hp = 0; });
          this.log("【敵の特殊】あなたのユニットが全て破壊された！");
          this.checkDeaths();
        } else if (r === 1) {
          this.healPlayer("enemy", 6);
          this.log("【敵の特殊】敵の体力が6回復した。");
        } else {
          this.damagePlayer("player", 4);
          this.log("【敵の特殊】あなたに4ダメージ！");
        }
      }
    } else if (battleNum >= 50) {
      if (turn === 1) {
        mark();
        if (e.field.length < 5) {
          const c = createCardInstance("徴兵施設", "enemy");
          if (c) {
            e.field.push(c);
            this.log("【敵の特殊】徴兵施設が場に出た。");
          }
        }
      } else if (turn === 3) {
        mark();
        summon("無双の将校");
      } else if (turn === 5) {
        mark();
        summon("兵団長");
      } else if (turn === 6) {
        mark();
        summon(Math.random() < 0.5 ? "精鋭槍兵" : "大盾兵");
      } else if (turn === 8) {
        mark();
        const r = Math.floor(Math.random() * 3);
        if (r === 0) {
          this.player.field.filter(c => c.type === "unit").forEach(c => { c.hp = 0; });
          this.log("【敵の特殊】あなたのユニットが全て破壊された！");
          this.checkDeaths();
        } else if (r === 1) {
          this.healPlayer("enemy", 6);
          this.log("【敵の特殊】敵の体力が6回復した。");
        } else {
          this.damagePlayer("player", 4);
          this.log("【敵の特殊】あなたに4ダメージ！");
        }
      } else if (turn === 10) {
        mark();
        this.healPlayer("enemy", 5);
        const units = this.player.field.filter(c => c.type === "unit");
        if (units.length) {
          const u = units[Math.floor(Math.random() * units.length)];
          u.hp = 0;
          this.log(`【敵の特殊】${u.name}が破壊された！`);
          this.checkDeaths();
        }
        this.damagePlayer("player", 5);
        this.log("【敵の特殊】敵が体力5回復し、あなたに5ダメージ！");
      }
    }
  }

  enemyAI() {
    if (this.checkWinLose()) return;
    this.triggerEnemySpecials();
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
      } else if (card.type === "unit") {
        this._placeUnitOnField("enemy", card, null);
      } else {
        // field
        e.field.push(card);
        this.log(`敵は${card.name}を場に出した。`);
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

    for (const atk of attackers) {
      let targets = this.player.field.filter(c => c.type === "unit");
      const guards = targets.filter(c => c.guard);
      if (guards.length > 0) targets = guards;

      const faceBlocked = this.playerHasGuard() || (atk.charge && !atk.rush && atk._summonTurnFaceBlock);

      // 候補を分類
      // ① 一方的に倒せる（相手は死に、自分は生き残る）
      const oneSided = targets.filter(u => u.hp <= atk.atk && atk.hp > u.atk);
      // ② 相打ち（お互い死ぬ）
      const trades = targets.filter(u => u.hp <= atk.atk && atk.hp <= u.atk);

      let chosen = null;
      let preferFace = false;

      if (oneSided.length > 0) {
        // ① 一方キル：最も脅威（攻撃高）を優先
        oneSided.sort((a, b) => (b.atk - a.atk) || (a.hp - b.hp));
        chosen = oneSided[0];
      } else if (trades.length > 0) {
        // ② 相打ち：自分の攻撃力の方が低い相手だけ交換（高攻撃の脅威除去）
        const goodTrades = trades.filter(u => atk.atk < u.atk);
        if (goodTrades.length > 0) {
          goodTrades.sort((a, b) => (b.atk - a.atk) || (a.hp - b.hp));
          chosen = goodTrades[0];
        } else {
          // ③ 攻撃力同じ or 自分の方が高い → リーダー攻撃を優先
          preferFace = true;
        }
      } else {
        // 倒せない対象しかいない → リーダーへ（可能な場合）
        preferFace = true;
      }

      if (chosen) {
        this.log(`敵の${atk.name}が${chosen.name}に攻撃！`);
        chosen.hp -= atk.atk;
        atk.hp -= chosen.atk;
        atk.exhausted = true;
      } else if (preferFace && !faceBlocked) {
        this.log(`敵の${atk.name}があなたに${atk.atk}ダメージ！`);
        this.player.hp -= atk.atk;
        atk.exhausted = true;
      } else if (!faceBlocked && targets.length === 0) {
        this.log(`敵の${atk.name}があなたに${atk.atk}ダメージ！`);
        this.player.hp -= atk.atk;
        atk.exhausted = true;
      } else {
        // 攻撃できない／不利のみ → 見送り
        if (targets.length > 0) {
          this.log(`敵の${atk.name}は攻撃を見送った。`);
        }
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

    // 手札：クリックで詳細 / ダブルクリック(スマホは2回タップ)でプレイ
    const handEl = document.getElementById("player-hand");
    handEl.innerHTML = "";
    this.player.hand.forEach(c => {
      const el = this.createCardElement(c, true);
      const canPlay = c.cost <= this.player.mana && this.currentPlayer === "player" && !this.pendingTarget &&
        !((c.type === "unit" || c.type === "field") && this.player.field.length >= 5);
      if (canPlay) el.classList.add("can-play");

      // 詳細表示
      const showDetail = () => {
        document.querySelectorAll(".card.show-tooltip").forEach(x => x.classList.remove("show-tooltip"));
        el.classList.add("show-tooltip");
      };

      const play = () => {
        if (this.pendingTarget) return;
        if (this.currentPlayer !== "player") return;
        document.querySelectorAll(".card.show-tooltip").forEach(x => x.classList.remove("show-tooltip"));
        document.querySelectorAll(".card.tap-armed").forEach(x => x.classList.remove("tap-armed"));
        this._selectedHandUid = null;
        this._handTapUid = null;
        this.tryPlayCard(c.uid);
      };

      if (this.isTouchDevice()) {
        let lastTap = 0;
        el.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (this.pendingTarget) return;
          const now = Date.now();
          if (this._handTapUid === c.uid && now - lastTap < 700) {
            this._handTapUid = null;
            el.classList.remove("tap-armed");
            play();
          } else {
            document.querySelectorAll(".card.tap-armed").forEach(x => x.classList.remove("tap-armed"));
            this._handTapUid = c.uid;
            lastTap = now;
            el.classList.add("tap-armed");
            showDetail();
            this.log(`${c.name}を選択（もう一度タップでプレイ）`);
          }
        });
      } else {
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          showDetail();
        });
        el.addEventListener("dblclick", (e) => {
          e.preventDefault();
          e.stopPropagation();
          play();
        });
      }
      handEl.appendChild(el);
    });

    // 自分の場
    const pf = document.getElementById("player-field");
    pf.innerHTML = "";
    pf.classList.remove("play-target");

    this.player.field.forEach(c => {
      const el = this.createCardElement(c, true);
      if (c.exhausted) el.classList.add("exhausted");
      if (this.selectedUnitUid === c.uid) el.classList.add("selected");

      if (this.pendingTarget && (this.pendingTarget.type === "playOnPlayAlly" || this.pendingTarget.type === "fieldTargetAlly") && c.type === "unit") {
        el.classList.add("targetable");
        el.onclick = () => {
          if (this.pendingTarget.type === "fieldTargetAlly") this.resolveFieldTarget(c.uid);
          else this.resolvePlayWithTarget(c.uid);
        };
      } else {
        el.onclick = () => {
          if (this.pendingTarget) return;
          document.querySelectorAll(".card.show-tooltip").forEach(x => x.classList.remove("show-tooltip"));
          el.classList.add("show-tooltip");
          if (c.type === "unit" && !c.exhausted && this.currentPlayer === "player") {
            this.selectUnitForAttack(c.uid);
          } else if (c.type === "field" && this.currentPlayer === "player") {
            this.tryActivateField(c.uid);
          }
        };
      }
      pf.appendChild(el);
    });

    // 敵の場
    const ef = document.getElementById("enemy-field");
    ef.innerHTML = "";
    this.enemy.field.forEach(c => {
      const el = this.createCardElement(c, false);
      if (c.exhausted) el.classList.add("exhausted");

      if (this.pendingTarget) {
        if (this.pendingTarget.type === "attack" && c.type === "unit") {
          const mustGuard = this.enemyHasGuard();
          if (!mustGuard || c.guard) {
            el.classList.add("targetable");
            el.onclick = () => this.attackUnit(c.uid);
          }
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
    this.updatePlayBar();
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
  window.game.updateTitleContinue();
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
