const test = require("node:test");
const assert = require("node:assert");
const { Game, seededRng } = require("../src/gameLogic.js");

// Cria jogo sem spawn automatico (intervalo enorme) para controlar os itens na mao.
function manual(extra) {
  const g = new Game({ seed: 1, config: Object.assign({ baseSpawnInterval: 1e9, minSpawnInterval: 1e9 }, extra || {}) });
  g.start();
  g.drain();
  return g;
}
function put(g, kind, x, y) {
  g.items.push({ id: g.nextId++, kind: kind, variant: 0, x: x === undefined ? 0 : x, y: y === undefined ? g.cfg.catchY : y });
}

test("estado inicial e transicoes", () => {
  const g = new Game({ seed: 1 });
  assert.strictEqual(g.state, "menu");
  g.tap();
  assert.strictEqual(g.state, "playing");
  g.lives = 1;
  put(g, "bomb");
  g.tick(0.001, true, 0);
  assert.strictEqual(g.state, "gameover");
  g.tap();
  assert.strictEqual(g.state, "playing");
  assert.strictEqual(g.lives, 3);
  assert.strictEqual(g.score, 0);
});

test("pontua ao pegar doce com a boca aberta", () => {
  const g = manual();
  put(g, "candy");
  const ev = g.tick(0.001, true, 0);
  assert.strictEqual(g.score, 10);
  assert.ok(ev.some((e) => e.type === "catch"));
});

test("boca fechada nao pega", () => {
  const g = manual();
  put(g, "candy");
  g.tick(0.001, false, 0);
  assert.strictEqual(g.score, 0);
  assert.strictEqual(g.items.length, 1);
});

test("combo sobe a cada 3 acertos e multiplica pontos", () => {
  const g = manual();
  for (let i = 0; i < 3; i++) {
    put(g, "candy");
    g.tick(0.001, true, 0);
  }
  assert.strictEqual(g.combo, 2);
  const before = g.score;
  put(g, "candy");
  g.tick(0.001, true, 0);
  assert.strictEqual(g.score - before, 20);
});

test("combo nunca passa do maximo", () => {
  const g = manual();
  for (let i = 0; i < 40; i++) {
    put(g, "candy");
    g.tick(0.001, true, 0);
  }
  assert.strictEqual(g.combo, 5);
});

test("bomba zera combo e tira vida", () => {
  const g = manual();
  for (let i = 0; i < 3; i++) {
    put(g, "candy");
    g.tick(0.001, true, 0);
  }
  put(g, "bomb");
  g.tick(0.001, true, 0);
  assert.strictEqual(g.combo, 1);
  assert.strictEqual(g.lives, 2);
});

test("desviar da bomba nao custa vida", () => {
  const g = manual();
  put(g, "bomb", 0, 0.99);
  g.tick(0.1, false, 0);
  assert.strictEqual(g.lives, 3);
});

test("deixar doce cair tira vida e zera combo", () => {
  const g = manual();
  g.streak = 5;
  g.combo = 2;
  put(g, "candy", 0, 0.99);
  g.tick(0.1, false, 0);
  assert.strictEqual(g.lives, 2);
  assert.strictEqual(g.combo, 1);
});

test("fim de jogo apos perder as 3 vidas e guarda recorde", () => {
  const g = manual();
  put(g, "candy");
  g.tick(0.001, true, 0);
  for (let i = 0; i < 3; i++) {
    put(g, "bomb");
    g.tick(0.001, true, 0);
  }
  assert.strictEqual(g.state, "gameover");
  assert.strictEqual(g.best, 10);
});

test("dificuldade aumenta com o tempo", () => {
  const g = new Game({ seed: 1 });
  const s0 = g.speed();
  const i0 = g.spawnInterval();
  const b0 = g.bombChance();
  g.time = 60;
  assert.ok(g.speed() > s0);
  assert.ok(g.spawnInterval() < i0);
  assert.ok(g.bombChance() > b0);
  g.time = 1e6;
  assert.ok(g.speed() <= g.cfg.maxSpeed);
  assert.ok(g.spawnInterval() >= g.cfg.minSpawnInterval);
});

test("mesma semente gera o mesmo jogo", () => {
  function run(seed) {
    const g = new Game({ seed: seed });
    g.start();
    const log = [];
    for (let i = 0; i < 600; i++) {
      g.tick(1 / 30, i % 20 < 10, Math.sin(i / 30));
      log.push(g.score + ":" + g.lives + ":" + g.items.length);
      if (g.state !== "playing") break;
    }
    return log.join(",");
  }
  assert.strictEqual(run(42), run(42));
  assert.notStrictEqual(run(42), run(7));
});

test("itens aparecem com o tempo", () => {
  const g = new Game({ seed: 3 });
  g.start();
  let spawns = 0;
  for (let i = 0; i < 90; i++) {
    spawns += g.tick(1 / 30, false, 0).filter((e) => e.type === "spawn").length;
    if (g.state !== "playing") break;
  }
  assert.ok(spawns >= 1);
});

test("seededRng e deterministico", () => {
  const a = seededRng(5), b = seededRng(5);
  assert.strictEqual(a(), b());
});
