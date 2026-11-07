// Logica pura do jogo "Chuva de Docinhos". Nao usa nenhuma chamada do Effect House,
// por isso pode ser testada com Node. Coordenadas: x em [-1, 1], y em [0, 1] (0 = topo, 1 = base).

const DEFAULTS = {
  lives: 3,
  catchY: 0.78, // altura da zona da boca
  catchHalfHeight: 0.1,
  catchHalfWidth: 0.22,
  baseSpeed: 0.35, // unidades de y por segundo
  speedPerSecond: 0.012, // aumento de velocidade a cada segundo jogado
  maxSpeed: 1.1,
  baseSpawnInterval: 1.1,
  minSpawnInterval: 0.4,
  spawnDecayPerSecond: 0.012,
  bombChance: 0.2,
  bombChanceMax: 0.4,
  bombChancePerSecond: 0.003,
  pointsPerCandy: 10,
  maxCombo: 5,
  catchesPerComboLevel: 3,
  missResetsCombo: true,
  missCostsLife: true, // deixar doce cair tira uma vida
  mouthThreshold: 0.35,
};

// RNG com semente (mulberry32) para testes deterministicos.
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
    this.items = [];
    this.nextId = 1;
    this.time = 0;
    this.spawnTimer = 0;
    this.score = 0;
    this.lives = this.cfg.lives;
    this.streak = 0; // acertos seguidos
    this.combo = 1; // multiplicador 1..maxCombo
  }

  start() {
    this.reset();
    this.state = "playing";
    this.events.push({ type: "start" });
  }

  // Chamado quando o usuario toca na tela: inicia ou reinicia.
  tap() {
    if (this.state === "menu" || this.state === "gameover") this.start();
  }

  speed() {
    return Math.min(this.cfg.maxSpeed, this.cfg.baseSpeed + this.cfg.speedPerSecond * this.time);
  }

  spawnInterval() {
    return Math.max(
      this.cfg.minSpawnInterval,
      this.cfg.baseSpawnInterval - this.cfg.spawnDecayPerSecond * this.time
    );
  }

  bombChance() {
    return Math.min(this.cfg.bombChanceMax, this.cfg.bombChance + this.cfg.bombChancePerSecond * this.time);
  }

  spawn() {
    const isBomb = this.rng() < this.bombChance();
    const item = {
      id: this.nextId++,
      kind: isBomb ? "bomb" : "candy",
      variant: isBomb ? 0 : Math.floor(this.rng() * 3),
      x: this.rng() * 1.6 - 0.8,
      y: 0,
    };
    this.items.push(item);
    this.events.push({ type: "spawn", item: item });
  }

  // Retorna a lista de eventos ocorridos neste tick (e esvazia a fila).
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
      const inZone =
        Math.abs(it.y - c.catchY) <= c.catchHalfHeight && Math.abs(it.x - mx) <= c.catchHalfWidth;
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
    if (it.kind === "bomb") {
      this.streak = 0;
      this.combo = 1;
      this.loseLife("bomb", it);
      return;
    }
    this.streak++;
    const level = Math.min(this.cfg.maxCombo, 1 + Math.floor(this.streak / this.cfg.catchesPerComboLevel));
    const leveledUp = level > this.combo;
    this.combo = level;
    this.score += this.cfg.pointsPerCandy * this.combo;
    this.events.push({ type: "catch", item: it, combo: this.combo, score: this.score });
    if (leveledUp) this.events.push({ type: "combo", combo: this.combo });
  }

  resolveMiss(it) {
    if (this.cfg.missResetsCombo) {
      this.streak = 0;
      this.combo = 1;
    }
    this.events.push({ type: "miss", item: it });
    if (this.cfg.missCostsLife) this.loseLife("miss", it);
  }

  loseLife(reason, it) {
    this.lives--;
    this.events.push({ type: "hit", reason: reason, item: it, lives: this.lives });
    if (this.lives <= 0) this.endGame();
  }

  endGame() {
    this.state = "gameover";
    this.items = [];
    const newBest = this.score > this.best;
    if (newBest) this.best = this.score;
    this.events.push({ type: "gameover", score: this.score, best: this.best, newBest: newBest });
  }

  drain() {
    const e = this.events;
    this.events = [];
    return e;
  }
}

module.exports = { Game, DEFAULTS, seededRng };
