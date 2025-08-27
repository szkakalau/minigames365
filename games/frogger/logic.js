(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const scoreEl = document.getElementById('score');
  const livesEl = document.getElementById('lives');
  const restartBtn = document.getElementById('restartBtn');
  const gameOverScreen = document.getElementById('gameOverScreen');
  const finalScoreEl = document.getElementById('finalScore');

  const TILE = 50; // 12x12 grid (600px)
  const ROWS = canvas.height / TILE; // 12
  const COLS = canvas.width / TILE;  // 12

  const LANES = {
    safeBottom: 11,
    road1: 10,
    road2: 9,
    road3: 8,
    safeMid: 7,
    river1: 6,
    river2: 5,
    river3: 4,
    goals: 1,
    safeTop: 0,
  };

  const GOAL_SLOTS = [1, 3, 5, 7, 9, 11];

  const playerStart = { r: 11, c: 6 };
  let player = { r: playerStart.r, c: playerStart.c, x: playerStart.c * TILE + TILE/2, y: playerStart.r * TILE + TILE/2 };

  let score = 0;
  let lives = 3;
  let gameActive = true;
  let paused = false;
  let reachedGoals = new Set();

  const cars = [];
  const logs = [];

  function resetGame() {
    score = 0;
    lives = 3;
    player = { r: playerStart.r, c: playerStart.c, x: playerStart.c * TILE + TILE/2, y: playerStart.r * TILE + TILE/2 };
    reachedGoals = new Set();
    cars.length = 0;
    logs.length = 0;
    spawnObstacles();
    gameActive = true;
    gameOverScreen.style.display = 'none';
    updateHUD();
  }

  function updateHUD() {
    scoreEl.textContent = `Score: ${score}`;
    livesEl.textContent = `Lives: ${lives}`;
  }

  function spawnObstacles() {
    // Cars on three road lanes
    addCarLane(LANES.road1, 2.2, 1);
    addCarLane(LANES.road2, 2.8, -1);
    addCarLane(LANES.road3, 3.5, 1);

    // Logs on three river lanes
    addLogLane(LANES.river1, 1.8, 1);
    addLogLane(LANES.river2, 2.2, -1);
    addLogLane(LANES.river3, 2.6, 1);
  }

  function addCarLane(row, speed, dir) {
    const count = 4;
    for (let i = 0; i < count; i++) {
      cars.push({
        row,
        x: ((i * 300) + (Math.random() * 100)) % (COLS * TILE),
        w: 80,
        h: 30,
        speed: speed * dir * TILE * 0.5,
        dir,
      });
    }
  }

  function addLogLane(row, speed, dir) {
    const count = 3;
    for (let i = 0; i < count; i++) {
      logs.push({
        row,
        x: ((i * 350) + (Math.random() * 120)) % (COLS * TILE),
        w: 120,
        h: 30,
        speed: speed * dir * TILE * 0.4,
        dir,
      });
    }
  }

  function drawGrid() {
    // Background lanes
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Safe lanes
    drawLane(LANES.safeBottom, '#0b1220');
    drawLane(LANES.safeMid, '#0b1220');
    drawLane(LANES.safeTop, '#0b1220');

    // Roads
    drawLane(LANES.road1, '#334155');
    drawLane(LANES.road2, '#334155');
    drawLane(LANES.road3, '#334155');

    // Rivers
    drawLane(LANES.river1, '#0369a1');
    drawLane(LANES.river2, '#075985');
    drawLane(LANES.river3, '#0369a1');

    // goal slots indicator
    GOAL_SLOTS.forEach(c => {
      const x = c * TILE + TILE/2;
      const y = LANES.goals * TILE + TILE/2;
      ctx.strokeStyle = reachedGoals.has(c) ? '#22c55e' : '#94a3b8';
      ctx.lineWidth = 2;
      ctx.strokeRect(c * TILE + 10, LANES.goals * TILE + 10, TILE - 20, TILE - 20);
    });
  }

  function drawLane(row, color) {
    ctx.fillStyle = color;
    ctx.fillRect(0, row * TILE, canvas.width, TILE);
  }

  function drawPlayer() {
    const x = player.c * TILE + TILE/2;
    const y = player.r * TILE + TILE/2;
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(x, y, TILE * 0.32, 0, Math.PI * 2);
    ctx.fill();

    // eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x - TILE * 0.12, y - TILE * 0.08, TILE * 0.06, 0, Math.PI * 2);
    ctx.arc(x + TILE * 0.12, y - TILE * 0.08, TILE * 0.06, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(x - TILE * 0.12, y - TILE * 0.08, TILE * 0.03, 0, Math.PI * 2);
    ctx.arc(x + TILE * 0.12, y - TILE * 0.08, TILE * 0.03, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawCars() {
    ctx.fillStyle = '#ef4444';
    cars.forEach(car => {
      const y = car.row * TILE + TILE/2 - car.h/2;
      ctx.fillRect(car.x - car.w/2, y, car.w, car.h);
    });
  }

  function drawLogs() {
    ctx.fillStyle = '#a16207';
    logs.forEach(log => {
      const y = log.row * TILE + TILE/2 - log.h/2;
      ctx.fillRect(log.x - log.w/2, y, log.w, log.h);
    });
  }

  function update(dt) {
    // Move cars
    cars.forEach(car => {
      car.x += car.speed * dt;
      if (car.dir > 0 && car.x - car.w/2 > canvas.width) car.x = -car.w/2;
      if (car.dir < 0 && car.x + car.w/2 < 0) car.x = canvas.width + car.w/2;
    });

    // Move logs
    logs.forEach(log => {
      log.x += log.speed * dt;
      if (log.dir > 0 && log.x - log.w/2 > canvas.width) log.x = -log.w/2;
      if (log.dir < 0 && log.x + log.w/2 < 0) log.x = canvas.width + log.w/2;
    });

    // If on river lanes, need to be on a log
    if (player.r === LANES.river1 || player.r === LANES.river2 || player.r === LANES.river3) {
      const px = player.c * TILE + TILE/2;
      const py = player.r * TILE + TILE/2;
      const onLog = logs.find(log => {
        const y = log.row * TILE + TILE/2 - log.h/2;
        return py > y && py < y + log.h && px > log.x - log.w/2 && px < log.x + log.w/2;
      });

      if (onLog) {
        // drift with log
        const newX = onLog.x + (px - onLog.x) + onLog.speed * dt;
        const newCol = Math.floor((newX) / TILE);
        player.c = Math.max(0, Math.min(COLS - 1, newCol));
      } else {
        loseLife();
      }
    }

    // Check car collision
    const px = player.c * TILE + TILE/2;
    const py = player.r * TILE + TILE/2;
    for (const car of cars) {
      const y = car.row * TILE + TILE/2 - car.h/2;
      if (py > y && py < y + car.h && px > car.x - car.w/2 && px < car.x + car.w/2) {
        loseLife();
        break;
      }
    }

    // Check goal reach
    if (player.r === LANES.goals) {
      if (GOAL_SLOTS.includes(player.c) && !reachedGoals.has(player.c)) {
        reachedGoals.add(player.c);
        score += 100;
        trackGameEvent('reach_goal', { score });
        resetPlayer();
        if (reachedGoals.size === GOAL_SLOTS.length) {
          // level complete
          score += 250;
          trackGameEvent('level_complete', { score });
          reachedGoals.clear();
        }
      } else {
        // invalid goal area
        loseLife();
      }
    }
  }

  function resetPlayer() {
    player.r = playerStart.r;
    player.c = playerStart.c;
  }

  function loseLife() {
    lives -= 1;
    updateHUD();
    trackGameEvent('lose_life', { lives });
    if (lives <= 0) {
      endGame();
    } else {
      resetPlayer();
    }
  }

  function endGame() {
    gameActive = false;
    finalScoreEl.textContent = score;
    gameOverScreen.style.display = 'block';
    trackGameEvent('game_over', { score });
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawLogs();
    drawCars();
    drawPlayer();
  }

  let last = 0;
  function loop(ts) {
    if (!gameActive) return;
    if (!last) last = ts;
    const dt = Math.min(1/30, (ts - last) / 1000);
    if (!paused) {
      last = ts;
      update(dt);
      render();
    } else {
      last = ts;
      render();
      // paused overlay
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#e5e7eb';
      ctx.textAlign = 'center';
      ctx.font = '20px system-ui, -apple-system, Segoe UI, Roboto, Arial';
      ctx.fillText('Paused - press P or tap Resume', canvas.width/2, canvas.height/2);
    }
    requestAnimationFrame(loop);
  }

  function togglePause(){
    if (!gameActive) return;
    paused = !paused;
    const btn = document.getElementById('pauseBtn');
    if (btn) btn.textContent = paused ? 'Resume' : 'Pause';
    trackGameEvent('pause_toggle', { state: paused ? 1 : 0 });
  }

  function tryMove(direction){
    if (!gameActive || paused) return;
    let moved = false;
    if (direction === 'up') { if (player.r > 0) { player.r -= 1; moved = true; } }
    if (direction === 'down') { if (player.r < ROWS - 1) { player.r += 1; moved = true; } }
    if (direction === 'left') { if (player.c > 0) { player.c -= 1; moved = true; } }
    if (direction === 'right') { if (player.c < COLS - 1) { player.c += 1; moved = true; } }
    if (moved) {
      score = Math.max(0, score + (direction === 'up' ? 5 : 0));
      updateHUD();
      trackGameEvent('move', { r: player.r, c: player.c, score });
    }
  }

  function onKeyDown(e) {
    const key = e.key.toLowerCase();
    const code = e.code;
    // prevent page scroll on control keys
    const isArrow = key.startsWith('arrow');
    const isWASD = key === 'w' || key === 'a' || key === 's' || key === 'd';
    const isSpace = code === 'Space' || key === ' ';
    if (isArrow || isWASD || isSpace || key === 'p') { e.preventDefault(); }
    if (key === 'p') { if (!gameActive) return; togglePause(); return; }
    if (!gameActive || paused) return;
    if (key === 'arrowup' || key === 'w') { tryMove('up'); }
    if (key === 'arrowdown' || key === 's') { tryMove('down'); }
    if (key === 'arrowleft' || key === 'a') { tryMove('left'); }
    if (key === 'arrowright' || key === 'd') { tryMove('right'); }
  }

  function onRestart() {
    resetGame();
    paused = false;
    const btn = document.getElementById('pauseBtn');
    if (btn) btn.textContent = 'Pause';
    trackGameEvent('restart');
    requestAnimationFrame(loop);
  }

  restartBtn.addEventListener('click', onRestart);
  const playAgainBtn = document.getElementById('playAgainBtn');
  if (playAgainBtn) playAgainBtn.addEventListener('click', onRestart);

  document.addEventListener('keydown', onKeyDown);

  // Pause button
  const pauseBtn = document.getElementById('pauseBtn');
  if (pauseBtn) pauseBtn.addEventListener('click', togglePause);

  // Mobile controls: Up/Down/Left/Right
  const btnUp = document.getElementById('btn-up');
  const btnDown = document.getElementById('btn-down');
  const btnLeft = document.getElementById('btn-left');
  const btnRight = document.getElementById('btn-right');

  function bindTap(btn, dir){
    if (!btn) return;
    const handler = (e)=>{ e.preventDefault(); tryMove(dir); };
    btn.addEventListener('touchstart', handler, { passive: false });
    btn.addEventListener('click', handler);
  }

  bindTap(btnUp, 'up');
  bindTap(btnDown, 'down');
  bindTap(btnLeft, 'left');
  bindTap(btnRight, 'right');
  resetGame();
  requestAnimationFrame(loop);
})();