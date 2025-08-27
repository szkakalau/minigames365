(function(){
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  // Game state
  let bird, pipes, score, best, gravity, lift, speed, running, frame, groundY;
  let lastTapTime = 0;
  let paused = false;

  function reset() {
    bird = { x: 80, y: H/2, r: 14, vy: 0 };
    pipes = [];
    score = 0;
    best = Number(localStorage.getItem('flappy_best') || 0);
    gravity = 0.5;
    lift = -7.5;
    speed = 2.5;
    running = true;
    frame = 0;
    groundY = H - 40;
    paused = false;
    const pb = document.getElementById('pauseBtn');
    if (pb) pb.textContent = 'Pause';
    document.getElementById('score').textContent = 'Score: ' + score;
    document.getElementById('best').textContent = 'Best: ' + best;
    hideGameOver();
    track && track('game_start');
  }

  function showGameOver() {
    const over = document.getElementById('gameOverScreen');
    document.getElementById('finalScore').textContent = score;
    over.style.display = 'block';
  }
  function hideGameOver(){
    const over = document.getElementById('gameOverScreen');
    over.style.display = 'none';
  }

  function flap() {
    if (!running) return;
    bird.vy = lift;
  }

  function spawnPipe() {
    const gap = 140;
    const minTop = 50;
    const maxTop = H - groundY - gap - 80; // Ensure bottom pipe visible
    const top = minTop + Math.random() * (H - gap - minTop - 80);
    pipes.push({ x: W + 20, top: top, gap: gap, w: 60, scored: false });
  }

  function update() {
    if (!running) return;
    if (paused) {
      draw();
      requestAnimationFrame(update);
      return;
    }
    frame++;
    // Bird physics
    bird.vy += gravity;
    bird.y += bird.vy;

    // Pipes spawn
    if (frame % 90 === 0) {
      const gap = 110;
      const topH = 40 + Math.random() * (H - 160);
      pipes.push({ x: W + 20, top: topH, bottom: topH + gap, w: 60, passed: false });
    }

    // Pipes update & collide
    for (let i = pipes.length - 1; i >= 0; i--) {
      const p = pipes[i];
      p.x -= speed;
      // scoring
      if (!p.passed && p.x + p.w < bird.x - bird.r) {
        score++;
        document.getElementById('score').textContent = 'Score: ' + score;
        p.passed = true;
      }
      // collide
      const hitX = bird.x + bird.r > p.x && bird.x - bird.r < p.x + p.w;
      const hitY = bird.y - bird.r < p.top || bird.y + bird.r > p.bottom;
      if (hitX && hitY) {
        gameOver();
        return;
      }
      // remove off screen
      if (p.x + p.w < -20) pipes.splice(i, 1);
    }

    // Ground collide
    if (bird.y + bird.r > groundY) {
      gameOver();
      return;
    }
    if (bird.y - bird.r < 0) {
      bird.y = bird.r;
      bird.vy = 0;
    }

    draw();
    requestAnimationFrame(update);
  }

  function draw() {
    // Sky
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0,0,W,H);

    // Ground
    ctx.fillStyle = '#de9b35';
    ctx.fillRect(0, groundY, W, H - groundY);

    // Pipes
    ctx.fillStyle = '#41a62a';
    pipes.forEach(p => {
      // Top pipe
      ctx.fillRect(p.x, 0, p.w, p.top);
      // Bottom pipe
      ctx.fillRect(p.x, p.top + p.gap, p.w, H - (p.top + p.gap));
      // Pipe lips
      ctx.fillRect(p.x - 6, p.top - 12, p.w + 12, 12);
      ctx.fillRect(p.x - 6, p.top + p.gap, p.w + 12, 12);
    });

    // Bird
    ctx.fillStyle = '#ffeb3b';
    ctx.beginPath();
    ctx.arc(bird.x, bird.y, bird.r, 0, Math.PI * 2);
    ctx.fill();
    // Eye
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(bird.x + 5, bird.y - 5, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Score text (large)
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(score, W/2, 80);

    if (paused) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '24px system-ui, -apple-system, sans-serif';
      ctx.fillText('Paused - Press P or Pause', W/2, H/2);
    }
  }

  function gameOver() {
    running = false;
    best = Math.max(best, score);
    localStorage.setItem('flappy_best', String(best));
    document.getElementById('best').textContent = 'Best: ' + best;
    showGameOver();
    track && track('game_end', score);
  }

  function restartGame() {
    reset();
    draw();
    requestAnimationFrame(update);
  }

  function togglePause(){
    if (!running) return;
    paused = !paused;
    const pb = document.getElementById('pauseBtn');
    if (pb) pb.textContent = paused ? 'Resume' : 'Pause';
    // Unify analytics event name
    if (typeof gtag !== 'undefined') {
      gtag('event', 'pause_toggle', { game_name: 'flappy-bird', paused });
    }
    // Keep existing tracker without payload changes
    track && track('pause_toggle');
  }

  // Input
  window.addEventListener('keydown', (e) => {
    const isJumpKey = e.code === 'Space' || e.key === ' ' || e.code === 'ArrowUp' || e.code === 'KeyW';
    if (isJumpKey) {
      e.preventDefault();
      if (!paused && running) flap();
      // Allow space to restart when stopped
      if (!running && (e.code === 'Space' || e.key === ' ')) {
        restartGame();
      }
      return;
    }
    if (e.code === 'KeyP') { e.preventDefault(); togglePause(); return; }
  }, { passive: false });

  const pauseBtn = document.getElementById('pauseBtn');
  if (pauseBtn) pauseBtn.addEventListener('click', togglePause);
  const restartBtn = document.getElementById('restartBtn');
  if (restartBtn) restartBtn.addEventListener('click', restartGame);

  canvas.addEventListener('pointerdown', () => {
    const now = Date.now();
    if (paused) return;
    // Double tap to restart when game over
    if (!running && now - lastTapTime < 300) {
      restartGame();
    } else {
      flap();
    }
    lastTapTime = now;
  });

  // External access for button
  window.restartGame = restartGame;

  // Analytics helper
  function track(action, score) {
    if (typeof window.trackGameEvent === 'function') {
      window.trackGameEvent(action, score);
    }
  }

  // Init
  reset();
  draw();
  requestAnimationFrame(update);
})();