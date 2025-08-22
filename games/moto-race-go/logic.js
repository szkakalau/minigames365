/*
  Moto Race Go - simple endless lane-based motorcycle racing
  Mechanics:
    - Player bike moves between 3 lanes
    - Traffic cars spawn and move downward
    - Collect coins, avoid collisions, speed increases over time
*/

(function () {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const W = canvas.width;
  const H = canvas.height;

  // Lanes: 3 lanes (x positions)
  const lanes = [W * 0.2, W * 0.5, W * 0.8];

  // Game state
  let running = true;
  let score = 0;
  let best = Number(localStorage.getItem('moto_best') || 0);
  let speed = 4; // base forward speed
  let maxSpeedReached = 0;

  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const speedEl = document.getElementById('speed');
  const overEl = document.getElementById('gameOverScreen');
  const finalScoreEl = document.getElementById('finalScore');
  const maxSpeedEl = document.getElementById('maxSpeed');
  const restartBtn = document.getElementById('restartBtn');

  function updateHUD() {
    scoreEl.textContent = `Score: ${score}`;
    bestEl.textContent = `Best: ${best}`;
    speedEl.textContent = `Speed: ${Math.round(speed * 20)}`;
  }

  // Player
  const player = {
    laneIndex: 1,
    y: H - 120,
    w: 40,
    h: 70,
    color: '#22c55e',
    nitro: 0
  };

  // Entities
  const cars = [];
  const coins = [];

  function spawnCar() {
    const lane = Math.floor(Math.random() * 3);
    const sizeScale = 0.8 + Math.random() * 0.5;
    cars.push({
      laneIndex: lane,
      x: lanes[lane] - 20,
      y: -80,
      w: 40 * sizeScale,
      h: 70 * sizeScale,
      color: ['#ef4444', '#3b82f6', '#f59e0b'][Math.floor(Math.random()*3)],
      vy: speed + Math.random() * 2
    });
  }

  function spawnCoin() {
    const lane = Math.floor(Math.random() * 3);
    coins.push({ laneIndex: lane, x: lanes[lane], y: -20, r: 8, vy: speed + 1 });
  }

  let carTimer = 0;
  let coinTimer = 0;

  function resetGame() {
    running = true;
    score = 0;
    speed = 4;
    maxSpeedReached = 0;
    cars.length = 0;
    coins.length = 0;
    overEl.style.display = 'none';
    updateHUD();
  }

  function endGame() {
    running = false;
    overEl.style.display = 'block';
    finalScoreEl.textContent = score;
    maxSpeedEl.textContent = Math.round(maxSpeedReached * 20);
    if (score > best) {
      best = score;
      localStorage.setItem('moto_best', best);
    }
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

    // Increase speed gradually
    speed += 0.0008 * dt;
    if (speed > maxSpeedReached) maxSpeedReached = speed;

    // Timers
    carTimer += dt;
    coinTimer += dt;

    if (carTimer > Math.max(400 - speed * 20, 140)) {
      spawnCar();
      carTimer = 0;
    }
    if (coinTimer > 900) {
      spawnCoin();
      coinTimer = 0;
    }

    // Move cars
    for (let i = cars.length - 1; i >= 0; i--) {
      const c = cars[i];
      c.y += c.vy;
      c.vy = speed + 1 + Math.random() * 1.5;
      if (c.y > H + 100) cars.splice(i, 1);
    }

    // Move coins
    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i];
      c.y += c.vy;
      if (c.y > H + 30) coins.splice(i, 1);
    }

    // Player collision with cars
    const px = lanes[player.laneIndex] - player.w/2;
    for (const c of cars) {
      const cx = lanes[c.laneIndex] - c.w/2;
      if (intersects(px, player.y, player.w, player.h, cx, c.y, c.w, c.h)) {
        endGame();
        return;
      }
    }

    // Player collect coins
    for (let i = coins.length - 1; i >= 0; i--) {
      const coin = coins[i];
      const cx = lanes[coin.laneIndex] - 6;
      if (intersects(px, player.y, player.w, player.h, cx, coin.y - 6, 12, 12)) {
        score += 10;
        coins.splice(i, 1);
        if (typeof trackGameEvent === 'function') {
          trackGameEvent('collect_coin', score);
        }
      }
    }

    // Passive scoring
    score += Math.floor(speed);
    updateHUD();
  }

  function drawRoad() {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);

    // road
    ctx.fillStyle = '#111827';
    ctx.fillRect(W*0.05, 0, W*0.9, H);

    // lane markers
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.setLineDash([10, 15]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(W*0.35, 0); ctx.lineTo(W*0.35, H);
    ctx.moveTo(W*0.65, 0); ctx.lineTo(W*0.65, H);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawPlayer() {
    const x = lanes[player.laneIndex] - player.w/2;
    ctx.fillStyle = player.color;
    ctx.fillRect(x, player.y, player.w, player.h);
  }

  function drawCars() {
    for (const c of cars) {
      const x = lanes[c.laneIndex] - c.w/2;
      ctx.fillStyle = c.color;
      ctx.fillRect(x, c.y, c.w, c.h);
    }
  }

  function drawCoins() {
    ctx.fillStyle = '#fbbf24';
    for (const coin of coins) {
      const x = lanes[coin.laneIndex];
      ctx.beginPath();
      ctx.arc(x, coin.y, coin.r, 0, Math.PI*2);
      ctx.fill();
    }
  }

  // Input
  function moveLeft() { player.laneIndex = Math.max(0, player.laneIndex - 1); }
  function moveRight() { player.laneIndex = Math.min(2, player.laneIndex + 1); }
  function nitroBoost() { speed += 2; setTimeout(() => { speed = Math.max(4, speed - 2); }, 800); }

  window.restartGame = function () { resetGame(); };

  window.addEventListener('keydown', (e) => {
    if (!running && e.key.toLowerCase() === 'enter') { resetGame(); return; }
    if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') moveLeft();
    if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') moveRight();
    if (e.key === 'Shift') nitroBoost();
    if (e.key === ' ' || e.key === 'Spacebar') speed = Math.max(4, speed - 1); // brake
  });

  // Touch controls
  canvas.addEventListener('touchstart', (e) => {
    const x = e.changedTouches[0].clientX - canvas.getBoundingClientRect().left;
    if (x < W/2) moveLeft(); else moveRight();
  });

  restartBtn.addEventListener('click', resetGame);

  let last = 0;
  function loop(ts) {
    const dt = last ? (ts - last) : 16;
    last = ts;

    update(dt);
    drawRoad();
    drawCars();
    drawCoins();
    drawPlayer();

    requestAnimationFrame(loop);
  }

  // init
  resetGame();
  requestAnimationFrame(loop);
})();