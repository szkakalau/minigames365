/*
  Subway Surfers - endless 3-lane runner (simplified)
  Mechanics:
    - 3 lanes runner
    - Obstacles (trains) and coins
    - Jump and roll
*/

(function () {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  const lanes = [W * 0.2, W * 0.5, W * 0.8];

  let running = true;
  let score = 0;
  let best = Number(localStorage.getItem('subway_best') || 0);
  let coins = 0;
  let speed = 4;

  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const coinsEl = document.getElementById('coins');
  const overEl = document.getElementById('gameOverScreen');
  const finalScoreEl = document.getElementById('finalScore');
  const finalCoinsEl = document.getElementById('finalCoins');
  const restartBtn = document.getElementById('restartBtn');

  function updateHUD() {
    scoreEl.textContent = `Score: ${score}`;
    bestEl.textContent = `Best: ${best}`;
    coinsEl.textContent = `Coins: ${coins}`;
  }

  const player = { laneIndex: 1, y: H - 110, w: 40, h: 60, vy: 0, onGround: true, rolling: false };
  const obstacles = [];
  const coinItems = [];

  function spawnObstacle() {
    const lane = Math.floor(Math.random() * 3);
    const h = 60 + Math.random()*40;
    obstacles.push({ laneIndex: lane, x: lanes[lane] - 20, y: -h, w: 40, h, vy: speed + 2 });
  }

  function spawnCoinLine() {
    const lane = Math.floor(Math.random() * 3);
    for (let i = 0; i < 5; i++) {
      coinItems.push({ laneIndex: lane, x: lanes[lane], y: -20 - i * 30, r: 8, vy: speed + 1 });
    }
  }

  let obTimer = 0;
  let coinTimer = 0;

  function resetGame() {
    running = true; score = 0; coins = 0; speed = 4;
    obstacles.length = 0; coinItems.length = 0;
    player.y = H - 110; player.vy = 0; player.onGround = true; player.rolling = false;
    overEl.style.display = 'none';
    updateHUD();
  }

  function endGame() {
    running = false;
    overEl.style.display = 'block';
    finalScoreEl.textContent = score;
    finalCoinsEl.textContent = coins;
    if (score > best) { best = score; localStorage.setItem('subway_best', best); }
    updateHUD();
    if (typeof trackGameEvent === 'function') {
      trackGameEvent('game_over', score);
    }
  }

  function intersects(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function update(dt) {
    if (!running) return;

    speed += 0.0006 * dt;

    obTimer += dt; coinTimer += dt;
    if (obTimer > Math.max(600 - speed * 30, 220)) { spawnObstacle(); obTimer = 0; }
    if (coinTimer > 900) { spawnCoinLine(); coinTimer = 0; }

    // gravity and jump
    if (!player.onGround) {
      player.vy += 0.4; // gravity
      player.y += player.vy;
      if (player.y >= H - 110) { player.y = H - 110; player.vy = 0; player.onGround = true; player.rolling = false; }
    }

    // obstacles move
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.vy;
      if (o.y > H + 80) obstacles.splice(i, 1);
    }

    // coins move
    for (let i = coinItems.length - 1; i >= 0; i--) {
      const c = coinItems[i];
      c.y += c.vy;
      if (c.y > H + 20) coinItems.splice(i, 1);
    }

    // collision
    const px = lanes[player.laneIndex] - player.w/2;
    for (const o of obstacles) {
      const ox = lanes[o.laneIndex] - o.w/2;
      if (intersects(px, player.y, player.w, player.h * (player.rolling ? 0.6 : 1), ox, o.y, o.w, o.h)) {
        endGame();
        return;
      }
    }

    // collect coins
    for (let i = coinItems.length - 1; i >= 0; i--) {
      const c = coinItems[i];
      const cx = lanes[c.laneIndex] - 6;
      if (intersects(px, player.y, player.w, player.h, cx, c.y - 6, 12, 12)) {
        coins += 1; score += 5; coinItems.splice(i, 1);
        if (typeof trackGameEvent === 'function') { trackGameEvent('collect_coin', score); }
      }
    }

    // passive score
    score += Math.floor(speed * 0.5);
    updateHUD();
  }

  function drawScene() {
    // background
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H);
    // tracks area
    ctx.fillStyle = '#1f2937'; ctx.fillRect(W*0.1, 0, W*0.8, H);
    // lanes
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.setLineDash([10, 15]); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(W*0.35, 0); ctx.lineTo(W*0.35, H);
    ctx.moveTo(W*0.65, 0); ctx.lineTo(W*0.65, H); ctx.stroke(); ctx.setLineDash([]);
  }

  function drawPlayer() {
    const x = lanes[player.laneIndex] - player.w/2;
    ctx.fillStyle = '#22c55e';
    const h = player.h * (player.rolling ? 0.6 : 1);
    ctx.fillRect(x, player.y + (player.h - h), player.w, h);
  }

  function drawObstacles() {
    ctx.fillStyle = '#ef4444';
    obstacles.forEach(o => {
      const x = lanes[o.laneIndex] - o.w/2;
      ctx.fillRect(x, o.y, o.w, o.h);
    });
  }

  function drawCoins() {
    ctx.fillStyle = '#fbbf24';
    coinItems.forEach(c => {
      const x = lanes[c.laneIndex];
      ctx.beginPath(); ctx.arc(x, c.y, c.r, 0, Math.PI*2); ctx.fill();
    });
  }

  function moveLeft() { player.laneIndex = Math.max(0, player.laneIndex - 1); }
  function moveRight() { player.laneIndex = Math.min(2, player.laneIndex + 1); }
  function jump() { if (player.onGround) { player.onGround = false; player.vy = -9; } }
  function roll() { if (player.onGround) { player.rolling = true; setTimeout(() => player.rolling = false, 500); } }

  window.restartGame = function () { resetGame(); };

  window.addEventListener('keydown', (e) => {
    if (!running && e.key.toLowerCase() === 'enter') { resetGame(); return; }
    if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') moveLeft();
    if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') moveRight();
    if (e.key === ' ' || e.key === 'Spacebar') jump();
    if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') roll();
  });

  canvas.addEventListener('touchstart', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.changedTouches[0].clientX - rect.left;
    if (x < W/3) moveLeft(); else if (x > 2*W/3) moveRight(); else jump();
  });

  restartBtn.addEventListener('click', resetGame);

  let last = 0;
  function loop(ts) {
    const dt = last ? (ts - last) : 16; last = ts;
    update(dt);
    drawScene();
    drawObstacles();
    drawCoins();
    drawPlayer();
    requestAnimationFrame(loop);
  }

  resetGame();
  requestAnimationFrame(loop);
})();