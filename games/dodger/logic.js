(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const scoreEl = document.getElementById('score');
  const livesEl = document.getElementById('lives');
  const restartBtn = document.getElementById('restartBtn');
  const gameOverScreen = document.getElementById('gameOverScreen');
  const finalScoreEl = document.getElementById('finalScore');
  const pauseBtn = document.getElementById('pauseBtn');
  const playAgainBtn = document.getElementById('playAgainBtn');
  const btnLeft = document.getElementById('btnLeft');
  const btnRight = document.getElementById('btnRight');

  const W = canvas.width;
  const H = canvas.height;

  const player = { x: W/2, y: H - 40, w: 40, h: 14, speed: 300 };
  const obstacles = [];
  let spawnTimer = 0;
  let spawnInterval = 800; // ms

  let score = 0;
  let lives = 3;
  let gameActive = true;
  let paused = false;

  const keys = { left: false, right: false };

  function resetGame() {
    player.x = W/2;
    player.y = H - 40;
    obstacles.length = 0;
    spawnTimer = 0;
    spawnInterval = 800;
    score = 0;
    lives = 3;
    gameActive = true;
    paused = false;
    if (pauseBtn) pauseBtn.textContent = 'Pause';
    gameOverScreen.style.display = 'none';
    updateHUD();
  }

  function updateHUD() {
    scoreEl.textContent = `Score: ${score}`;
    livesEl.textContent = `Lives: ${lives}`;
  }

  function spawnObstacle() {
    const w = 20 + Math.random() * 60;
    const speed = 120 + Math.random() * 140 + Math.min(120, score);
    obstacles.push({ x: Math.random() * (W - w), y: -20, w, h: 16 + Math.random() * 14, speed });
  }

  function update(dt) {
    // controls
    if (keys.left) player.x -= player.speed * dt;
    if (keys.right) player.x += player.speed * dt;
    player.x = Math.max(0, Math.min(W - player.w, player.x));

    // spawn
    spawnTimer += dt * 1000;
    const dynamicInterval = Math.max(300, spawnInterval - Math.floor(score / 10) * 10);
    if (spawnTimer >= dynamicInterval) {
      spawnTimer = 0;
      spawnObstacle();
    }

    // move obstacles
    for (const o of obstacles) {
      o.y += o.speed * dt;
    }

    // collisions and cleanup
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      if (o.y > H + 30) {
        obstacles.splice(i, 1);
        score += 1;
        updateHUD();
      } else if (aabbIntersect(player, o)) {
        obstacles.splice(i, 1);
        lives -= 1;
        updateHUD();
        trackGameEvent('hit', { lives });
        if (lives <= 0) {
          endGame();
          return;
        }
      }
    }
  }

  function aabbIntersect(a, b) {
    return !(a.x + a.w < b.x || a.x > b.x + b.w || a.y + a.h < b.y || a.y > b.y + b.h);
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    // background grid
    ctx.fillStyle = '#0b1220';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }

    // obstacles
    ctx.fillStyle = '#ef4444';
    for (const o of obstacles) {
      ctx.fillRect(o.x, o.y, o.w, o.h);
    }

    // player
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(player.x, player.y, player.w, player.h);
  }

  function drawPauseOverlay() {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 28px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    ctx.fillText('Paused', W / 2, H / 2);
    ctx.font = '14px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    ctx.fillText('Press P or tap Resume', W / 2, H / 2 + 28);
  }

  let last = 0;
  function loop(ts) {
    if (!gameActive) return;
    if (!last) last = ts;
    const dt = Math.min(1/30, (ts - last) / 1000);
    last = ts;
    if (!paused) {
      update(dt);
    }
    render();
    if (paused) {
      drawPauseOverlay();
    }
    requestAnimationFrame(loop);
  }

  function endGame() {
    gameActive = false;
    finalScoreEl.textContent = score;
    gameOverScreen.style.display = 'block';
    trackGameEvent('game_over', { score });
  }

  function togglePause() {
    if (!gameActive) return; // don't pause on game over
    paused = !paused;
    if (pauseBtn) pauseBtn.textContent = paused ? 'Resume' : 'Pause';
    trackGameEvent('pause_toggle', { state: paused ? 'paused' : 'resumed' });
  }

  document.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    const code = e.code;
    const isArrow = code === 'ArrowUp' || code === 'ArrowDown' || code === 'ArrowLeft' || code === 'ArrowRight';
    const isWASD = k === 'w' || k === 'a' || k === 's' || k === 'd';
    const isSpace = code === 'Space' || k === ' ';
    const shouldBlock = isArrow || isWASD || isSpace || k === 'p';
    if (shouldBlock) e.preventDefault();

    if (k === 'p') {
      if (gameActive) togglePause();
      return;
    }
    if (!gameActive || paused) return;
    if (k === 'arrowleft' || k === 'a') keys.left = true;
    if (k === 'arrowright' || k === 'd') keys.right = true;
  });
  document.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    const code = e.code;
    const isArrow = code === 'ArrowUp' || code === 'ArrowDown' || code === 'ArrowLeft' || code === 'ArrowRight';
    const isWASD = k === 'w' || k === 'a' || k === 's' || k === 'd';
    const isSpace = code === 'Space' || k === ' ';
    if (isArrow || isWASD || isSpace || k === 'p') e.preventDefault();

    if (k === 'arrowleft' || k === 'a') keys.left = false;
    if (k === 'arrowright' || k === 'd') keys.right = false;
  });

  // Mobile controls
  const setLeft = (down) => {
    if (!gameActive || paused) { keys.left = false; return; }
    keys.left = !!down;
  };
  const setRight = (down) => {
    if (!gameActive || paused) { keys.right = false; return; }
    keys.right = !!down;
  };
  const clearMobileKeys = () => { keys.left = false; keys.right = false; };

  if (btnLeft) {
    btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); setLeft(true); }, { passive: false });
    btnLeft.addEventListener('touchend', (e) => { e.preventDefault(); setLeft(false); }, { passive: false });
    btnLeft.addEventListener('mousedown', (e) => { e.preventDefault(); setLeft(true); });
  }
  if (btnRight) {
    btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); setRight(true); }, { passive: false });
    btnRight.addEventListener('touchend', (e) => { e.preventDefault(); setRight(false); }, { passive: false });
    btnRight.addEventListener('mousedown', (e) => { e.preventDefault(); setRight(true); });
  }
  document.addEventListener('mouseup', clearMobileKeys);
  document.addEventListener('touchend', clearMobileKeys, { passive: true });

  if (pauseBtn) {
    pauseBtn.addEventListener('click', togglePause);
  }

  restartBtn.addEventListener('click', () => {
    resetGame();
    trackGameEvent('restart');
    requestAnimationFrame(loop);
  });

  if (playAgainBtn) {
    playAgainBtn.addEventListener('click', () => {
      resetGame();
      trackGameEvent('restart');
      requestAnimationFrame(loop);
    });
  }

  resetGame();
  requestAnimationFrame(loop);
})();