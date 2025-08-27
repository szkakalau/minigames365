(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const scoreEl = document.getElementById('score');
  const timerEl = document.getElementById('timer');
  const startBtn = document.getElementById('startBtn');
  const gameOverScreen = document.getElementById('gameOverScreen');
  const finalScoreEl = document.getElementById('finalScore');

  const GRID_ROWS = 3;
  const GRID_COLS = 4;
  const TOTAL_TIME = 60; // seconds

  let score = 0;
  let timeLeft = TOTAL_TIME;
  let gameActive = false;
  let moleCells = []; // positions where moles can appear
  let activeMoles = []; // { cellIndex, appearAt, hideAt, hit }
  let lastSpawn = 0;

  const cellWidth = canvas.width / GRID_COLS;
  const cellHeight = canvas.height / GRID_ROWS;

  // Precompute grid cell centers
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      moleCells.push({
        x: c * cellWidth + cellWidth / 2,
        y: r * cellHeight + cellHeight / 1.5,
        r: Math.min(cellWidth, cellHeight) * 0.28
      });
    }
  }

  function resetGame() {
    score = 0;
    timeLeft = TOTAL_TIME;
    gameActive = false;
    activeMoles = [];
    lastSpawn = 0;
    scoreEl.textContent = `Score: ${score}`;
    timerEl.textContent = `Time: ${timeLeft}`;
    gameOverScreen.style.display = 'none';
    draw();
  }

  function startGame() {
    if (gameActive) return;
    resetGame();
    gameActive = true;
    trackGameEvent('start');
    gameLoop(0);
    countdown();
  }

  function endGame() {
    gameActive = false;
    finalScoreEl.textContent = score;
    gameOverScreen.style.display = 'block';
    trackGameEvent('game_over', score);
  }

  function spawnMoles(dt) {
    if (!gameActive) return;
    lastSpawn += dt;
    const spawnInterval = Math.max(350, 1000 - score * 10); // faster with higher score
    if (lastSpawn >= spawnInterval) {
      lastSpawn = 0;
      // choose 1-2 new moles
      const count = Math.random() < 0.7 ? 1 : 2;
      const available = [...Array(moleCells.length).keys()].filter(i => !activeMoles.some(m => m.cellIndex === i));
      for (let i = 0; i < count && available.length > 0; i++) {
        const idx = available.splice(Math.floor(Math.random() * available.length), 1)[0];
        const now = performance.now();
        const life = Math.max(500, 1200 - score * 5); // visible time reduces with score
        activeMoles.push({ cellIndex: idx, appearAt: now, hideAt: now + life, hit: false });
      }
    }
  }

  function updateMoles(now) {
    activeMoles = activeMoles.filter(m => now < m.hideAt && !m.hit);
  }

  function drawHole(cell) {
    // hole oval
    ctx.fillStyle = '#064e3b';
    ctx.beginPath();
    ctx.ellipse(cell.x, cell.y + cell.r * 0.25, cell.r * 1.2, cell.r * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    // rim
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  function drawMole(cell, t) {
    // t in [0,1] rise animation factor
    const y = cell.y - cell.r * 0.9 * t;

    // body
    ctx.fillStyle = '#a16207';
    ctx.beginPath();
    ctx.arc(cell.x, y, cell.r * 0.75, 0, Math.PI * 2);
    ctx.fill();

    // eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cell.x - cell.r * 0.25, y - cell.r * 0.15, cell.r * 0.12, 0, Math.PI * 2);
    ctx.arc(cell.x + cell.r * 0.25, y - cell.r * 0.15, cell.r * 0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(cell.x - cell.r * 0.25, y - cell.r * 0.15, cell.r * 0.06, 0, Math.PI * 2);
    ctx.arc(cell.x + cell.r * 0.25, y - cell.r * 0.15, cell.r * 0.06, 0, Math.PI * 2);
    ctx.fill();

    // nose
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(cell.x, y + cell.r * 0.05, cell.r * 0.14, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBackground() {
    ctx.fillStyle = '#065f46';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw grass lines
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const y = ((i + 1) / 9) * canvas.height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }

  function draw(now = performance.now()) {
    drawBackground();

    // holes first
    moleCells.forEach(drawHole);

    // moles
    activeMoles.forEach(m => {
      const cell = moleCells[m.cellIndex];
      const life = m.hideAt - m.appearAt;
      const t = Math.min(1, (now - m.appearAt) / Math.min(300, life));
      drawMole(cell, t);
    });
  }

  function gameLoop(now) {
    if (!gameActive) return;
    if (!gameLoop.last) gameLoop.last = now;
    const dt = now - gameLoop.last;
    gameLoop.last = now;

    spawnMoles(dt);
    updateMoles(now);
    draw(now);
    requestAnimationFrame(gameLoop);
  }

  function countdown() {
    if (!gameActive) return;
    timeLeft -= 1;
    timerEl.textContent = `Time: ${timeLeft}`;
    if (timeLeft <= 0) {
      endGame();
      return;
    }
    setTimeout(countdown, 1000);
  }

  function hitTest(x, y) {
    // check any mole within circle
    for (const m of activeMoles) {
      const cell = moleCells[m.cellIndex];
      const life = m.hideAt - m.appearAt;
      const t = Math.min(1, (performance.now() - m.appearAt) / Math.min(300, life));
      const cy = cell.y - cell.r * 0.9 * t;
      const dx = x - cell.x;
      const dy = y - cy;
      const dist2 = dx * dx + dy * dy;
      if (dist2 <= (cell.r * 0.85) * (cell.r * 0.85)) {
        return m;
      }
    }
    return null;
  }

  function onClick(e) {
    if (!gameActive) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    const target = hitTest(x, y);
    if (target) {
      target.hit = true;
      score += 1;
      scoreEl.textContent = `Score: ${score}`;
      trackGameEvent('hit', score);
      // small pop effect
      const cell = moleCells[target.cellIndex];
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.arc(cell.x, cell.y - cell.r * 0.5, cell.r * 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      trackGameEvent('miss');
    }
  }

  canvas.addEventListener('click', onClick);
  canvas.addEventListener('touchstart', (e) => {
    if (!gameActive) return;
    const touch = e.changedTouches[0];
    const rect = canvas.getBoundingClientRect();
    const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
    const y = (touch.clientY - rect.top) * (canvas.height / rect.height);
    const target = hitTest(x, y);
    if (target) {
      target.hit = true;
      score += 1;
      scoreEl.textContent = `Score: ${score}`;
      trackGameEvent('hit', score);
    } else {
      trackGameEvent('miss');
    }
  }, { passive: true });

  startBtn.addEventListener('click', startGame);

  // expose startGame for overlay button
  window.startGame = startGame;

  // initial draw
  resetGame();
})();