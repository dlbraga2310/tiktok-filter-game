// GameController.js - adaptador fino do Effect House para o jogo "Chuva de Docinhos".
//
// ATENCAO: este script NAO foi testado dentro do Effect House (o app nao roda no ambiente
// onde o projeto foi criado). A LOGICA do jogo (bloco GAME LOGIC abaixo) foi testada com Node.
// As chamadas da API Amaz (achar objetos, mexer em Transform, tocar audio, ler a boca) seguem o
// padrao de scripts do Effect House, mas podem precisar de pequenos ajustes. Veja o README.
//
// O bloco GAME LOGIC e uma COPIA de src/gameLogic.js, para o caso de "require" de outro arquivo
// nao funcionar no Effect House. Se mudar a logica, mude nos dois lugares (e rode os testes).

const Amaz = effect.Amaz;

// ============================ CONFIG ============================
// Nomes EXATOS dos objetos que voce cria na aba Hierarchy do Effect House.
const CONFIG = {
  // Textos (componente Text em objetos 2D / Screen)
  scoreText: "ScoreText", // "Pontos: 0"
  messageText: "MessageText", // "Abra a boca!", "Combo x3!", "Fim de jogo..."
  livesText: "LivesText", // "Vidas: 3" (simples, sem imagem de coracao)

  // Objetos que se movem. Crie ITEM_COUNT copias chamadas Item1, Item2, ... Item8
  // (cada uma com Transform e uma imagem). O script troca a imagem pelo tipo.
  itemPrefix: "Item",
  itemCount: 8,

  // Alvo da boca (anel que segue o rosto)
  mouthRing: "MouthRing",

  // Objetos com componente Audio (um por som). Os nomes dos catches sao SfxCatch1..SfxCatch5.
  bgm: "BgmLoop",
  sfxStart: "SfxStart",
  sfxBomb: "SfxBomb",
  sfxGameOver: "SfxGameOver",
  sfxCatchPrefix: "SfxCatch",

  // Jogo
  mouthOpenThreshold: 0.35, // 0 = fechada, 1 = bem aberta
  // Tamanho da area de jogo em unidades do Transform. Ajuste ate os doces cairem de cima a baixo.
  worldHalfWidth: 3.0,
  worldTop: 5.0,
  worldBottom: -5.0,

  // Textos em portugues
  texts: {
    menu: "Abra a boca!\nToque para comecar",
    score: "Pontos: ",
    lives: "Vidas: ",
    combo: "Combo x",
    gameover: "Fim de jogo! Toque para jogar de novo",
    best: "Recorde: ",
  },
};

// ========================== GAME LOGIC ==========================
// (copia de src/gameLogic.js, sem module.exports)
const DEFAULTS = {
  lives: 3, catchY: 0.78, catchHalfHeight: 0.1, catchHalfWidth: 0.22,
  baseSpeed: 0.35, speedPerSecond: 0.012, maxSpeed: 1.1,
  baseSpawnInterval: 1.1, minSpawnInterval: 0.4, spawnDecayPerSecond: 0.012,
  bombChance: 0.2, bombChanceMax: 0.4, bombChancePerSecond: 0.003,
  pointsPerCandy: 10, maxCombo: 5, catchesPerComboLevel: 3,
  missResetsCombo: true, missCostsLife: true, mouthThreshold: 0.35,
};

function seededRng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class Game {
  constructor(options) {
    options = options || {};
    this.cfg = Object.assign({}, DEFAULTS, options.config || {});
    this.rng = options.rng || seededRng(options.seed === undefined ? 1 : options.seed);
    this.best = options.best || 0;
    this.state = "menu";
    this.events = [];
    this.reset();
  }
  reset() {
    this.items = []; this.nextId = 1; this.time = 0; this.spawnTimer = 0;
    this.score = 0; this.lives = this.cfg.lives; this.streak = 0; this.combo = 1;
  }
  start() { this.reset(); this.state = "playing"; this.events.push({ type: "start" }); }
  tap() { if (this.state === "menu" || this.state === "gameover") this.start(); }
  speed() { return Math.min(this.cfg.maxSpeed, this.cfg.baseSpeed + this.cfg.speedPerSecond * this.time); }
  spawnInterval() { return Math.max(this.cfg.minSpawnInterval, this.cfg.baseSpawnInterval - this.cfg.spawnDecayPerSecond * this.time); }
  bombChance() { return Math.min(this.cfg.bombChanceMax, this.cfg.bombChance + this.cfg.bombChancePerSecond * this.time); }
  spawn() {
    const isBomb = this.rng() < this.bombChance();
    const item = { id: this.nextId++, kind: isBomb ? "bomb" : "candy", variant: isBomb ? 0 : Math.floor(this.rng() * 3), x: this.rng() * 1.6 - 0.8, y: 0 };
    this.items.push(item);
    this.events.push({ type: "spawn", item: item });
  }
  tick(dt, mouthOpen, mouthX) {
    if (this.state !== "playing") return this.drain();
    const c = this.cfg;
    const mx = mouthX === undefined ? 0 : mouthX;
    this.time += dt;
    this.spawnTimer += dt;
    while (this.spawnTimer >= this.spawnInterval()) {
      this.spawnTimer -= this.spawnInterval();
      this.spawn();
    }
    const v = this.speed();
    const remaining = [];
    for (const it of this.items) {
      it.y += v * dt;
      const inZone = Math.abs(it.y - c.catchY) <= c.catchHalfHeight && Math.abs(it.x - mx) <= c.catchHalfWidth;
      if (mouthOpen && inZone) {
        this.resolveCatch(it);
        if (this.state !== "playing") break;
        continue;
      }
      if (it.y > 1) {
        if (it.kind === "candy") this.resolveMiss(it);
        else this.events.push({ type: "dodge", item: it });
        if (this.state !== "playing") break;
        continue;
      }
      remaining.push(it);
    }
    this.items = this.state === "playing" ? remaining : [];
    return this.drain();
  }
  resolveCatch(it) {
    if (it.kind === "bomb") { this.streak = 0; this.combo = 1; this.loseLife("bomb", it); return; }
    this.streak++;
    const level = Math.min(this.cfg.maxCombo, 1 + Math.floor(this.streak / this.cfg.catchesPerComboLevel));
    const leveledUp = level > this.combo;
    this.combo = level;
    this.score += this.cfg.pointsPerCandy * this.combo;
    this.events.push({ type: "catch", item: it, combo: this.combo, score: this.score });
    if (leveledUp) this.events.push({ type: "combo", combo: this.combo });
  }
  resolveMiss(it) {
    if (this.cfg.missResetsCombo) { this.streak = 0; this.combo = 1; }
    this.events.push({ type: "miss", item: it });
    if (this.cfg.missCostsLife) this.loseLife("miss", it);
  }
  loseLife(reason, it) {
    this.lives--;
    this.events.push({ type: "hit", reason: reason, item: it, lives: this.lives });
    if (this.lives <= 0) this.endGame();
  }
  endGame() {
    this.state = "gameover"; this.items = [];
    const newBest = this.score > this.best;
    if (newBest) this.best = this.score;
    this.events.push({ type: "gameover", score: this.score, best: this.best, newBest: newBest });
  }
  drain() { const e = this.events; this.events = []; return e; }
}

// ======================= ADAPTADOR EFFECT HOUSE =======================
class GameController {
  constructor() {
    this.game = null;
    this.slots = []; // {entity, transform, id}
    this.msgTimer = 0;
    this.touchDown = false;
  }

  // Chamado uma vez quando o efeito inicia.
  onStart(sys) {
    this.scene = this.script.scene; // cena atual (padrao dos scripts Amaz)
    this.game = new Game({ seed: Date.now() % 100000 });
    this.mouthRing = this.find(CONFIG.mouthRing);
    this.scoreText = this.textOf(CONFIG.scoreText);
    this.messageText = this.textOf(CONFIG.messageText);
    this.livesText = this.textOf(CONFIG.livesText);
    for (let i = 1; i <= CONFIG.itemCount; i++) {
      const e = this.find(CONFIG.itemPrefix + i);
      if (e) this.slots.push({ entity: e, transform: e.getComponent("Transform"), id: 0 });
    }
    this.setMessage(CONFIG.texts.menu, 999);
    this.refreshHud();
    this.hideAllItems();
  }

  // Chamado a cada frame.
  onUpdate(sys, dt) {
    if (!this.game) return;
    const mouth = this.readMouth();
    this.moveRing(mouth);
    const events = this.game.tick(dt, mouth.open, mouth.x);
    for (const ev of events) this.handleEvent(ev);
    this.renderItems();
    if (this.msgTimer > 0) {
      this.msgTimer -= dt;
      if (this.msgTimer <= 0 && this.game.state === "playing") this.setMessage("", 0);
    }
  }

  // Toque na tela: inicia/reinicia. Em alguns projetos o evento chega aqui; se nao chegar,
  // use o "Touch" do Visual Scripting do Effect House para chamar this.game.tap() (veja README).
  onEvent(sys, event) {
    if (event.type === Amaz.EventType.TOUCH) {
      const t = event.args && event.args.get ? event.args.get(0) : null;
      if (t && t.type === Amaz.TouchType.TOUCH_BEGAN) { this.touchDown = true; this.tap(); }
      if (t && t.type === Amaz.TouchType.TOUCH_ENDED) this.touchDown = false;
    }
  }

  tap() {
    if (!this.game) return;
    const was = this.game.state;
    this.game.tap();
    if (was !== this.game.state) this.setMessage("", 0);
  }

  // ----------------------------- boca -----------------------------
  // Retorna {open: bool, x: -1..1}. Tenta ler a abertura da boca do rastreamento facial.
  // PLANO B: se nao funcionar na sua versao, use um objeto "Face Tracker" com "Mouth Open Trigger"
  // no Effect House e chame this.setMouthOpenFromTrigger(true/false) pelo Visual Scripting,
  // ou deixe o dedo pressionado na tela (touchDown) como "boca aberta" para testar no computador.
  readMouth() {
    let open = this.touchDown || this.externalMouthOpen === true;
    let x = 0;
    try {
      const algMgr = Amaz.AmazingManager.getSingleton("Algorithm");
      const result = algMgr.getAEAlgorithmResult();
      const face = result && result.getFaceBaseInfo(0);
      if (face) {
        // Pontos de contorno do rosto: usamos distancia vertical entre labios / altura do rosto.
        const pts = face.points_array;
        if (pts && pts.size() > 90) {
          const top = pts.get(87), bottom = pts.get(93); // labio sup/inf internos (indices tipicos)
          const faceTop = pts.get(43), chin = pts.get(16);
          const faceH = Math.abs(chin.y - faceTop.y) || 1;
          const openness = Math.abs(bottom.y - top.y) / faceH;
          open = open || openness * 6 > CONFIG.mouthOpenThreshold;
          x = (top.x - 0.5) * 2;
        }
      }
    } catch (err) {
      // Sem rastreamento disponivel: continua com o plano B (toque/externalMouthOpen).
    }
    return { open: open, x: x };
  }

  setMouthOpenFromTrigger(isOpen) { this.externalMouthOpen = !!isOpen; }

  // ------------------------- eventos do jogo -------------------------
  handleEvent(ev) {
    switch (ev.type) {
      case "start":
        this.play(CONFIG.bgm, true);
        this.play(CONFIG.sfxStart);
        this.setMessage("", 0);
        break;
      case "catch":
        this.play(CONFIG.sfxCatchPrefix + Math.min(5, ev.combo));
        break;
      case "combo":
        this.setMessage(CONFIG.texts.combo + ev.combo + "!", 1.0);
        break;
      case "hit":
        this.play(CONFIG.sfxBomb);
        break;
      case "gameover":
        this.stop(CONFIG.bgm);
        this.play(CONFIG.sfxGameOver);
        this.setMessage(CONFIG.texts.gameover + "\n" + CONFIG.texts.best + ev.best, 999);
        break;
    }
    this.refreshHud();
  }

  refreshHud() {
    this.setText(this.scoreText, CONFIG.texts.score + this.game.score);
    this.setText(this.livesText, CONFIG.texts.lives + Math.max(0, this.game.lives));
  }

  setMessage(msg, seconds) {
    this.setText(this.messageText, msg);
    this.msgTimer = seconds;
  }

  // ------------------------- renderizacao -------------------------
  moveRing(mouth) {
    if (!this.mouthRing) return;
    const tr = this.mouthRing.getComponent("Transform");
    const y = CONFIG.worldTop + (CONFIG.worldBottom - CONFIG.worldTop) * this.game.cfg.catchY;
    tr.localPosition = new Amaz.Vector3f(mouth.x * CONFIG.worldHalfWidth, y, 0);
  }

  renderItems() {
    const items = this.game.items;
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      const it = items[i];
      if (!it) { slot.entity.visible = false; continue; }
      slot.entity.visible = true;
      const wx = it.x * CONFIG.worldHalfWidth;
      const wy = CONFIG.worldTop + (CONFIG.worldBottom - CONFIG.worldTop) * it.y;
      slot.transform.localPosition = new Amaz.Vector3f(wx, wy, 0);
      // Troca de imagem por tipo: veja README (opcao simples: 4 filhos por Item, mostrar so um).
      this.showVariant(slot.entity, it);
    }
  }

  showVariant(entity, it) {
    // Filhos esperados dentro de cada ItemN, nesta ordem: Pink, Blue, Yellow, Bomb.
    const idx = it.kind === "bomb" ? 3 : it.variant;
    const children = entity.getComponent("Transform").children;
    for (let k = 0; k < children.size(); k++) {
      children.get(k).entity.visible = k === idx;
    }
  }

  hideAllItems() { for (const s of this.slots) s.entity.visible = false; }

  // --------------------------- utilitarios ---------------------------
  find(name) {
    const e = this.scene.findEntityBy(name);
    if (!e) console.log("[GameController] Objeto nao encontrado: " + name);
    return e;
  }
  textOf(name) {
    const e = this.find(name);
    return e ? e.getComponent("SDFText") : null;
  }
  setText(textComp, str) { if (textComp) textComp.str = str; }
  play(name, loop) {
    const e = this.find(name);
    const a = e && e.getComponent("AudioComponent");
    if (!a) return;
    if (loop !== undefined) a.setLoop && a.setLoop(!!loop);
    a.stop && a.stop();
    a.play && a.play();
  }
  stop(name) {
    const e = this.find(name);
    const a = e && e.getComponent("AudioComponent");
    if (a && a.stop) a.stop();
  }
}

exports.GameController = GameController;
