(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const scoreEl = document.getElementById('score');
  const heightEl = document.getElementById('height');
  const restartBtn = document.getElementById('restartBtn');
  const gameOverScreen = document.getElementById('gameOverScreen');
  const finalScoreEl = document.getElementById('finalScore');
  const pauseBtn = document.getElementById('pauseBtn');
  const playAgainBtn = document.getElementById('playAgainBtn');

  const W = canvas.width;
  const H = canvas.height;

  const player = {
    x: W / 2,
    y: H - 80,
    vx: 0,
    vy: -350,
    radius: 16
  };

  const GRAVITY = 800;
  const MOVE_SPEED = 280;
  const BOUNCE_VELOCITY = -450;

  let platforms = [];
  let cameraY = 0; // camera offset upwards
  let score = 0;
  let maxHeight = 0;
  let gameActive = true;
  let paused = false;

  function resetGame() {
    player.x = W / 2;
    player.y = H - 80;
    player.vx = 0;
    player.vy = -350;
    platforms = [];
    cameraY = 0;
    score = 0;
    maxHeight = 0;
    gameActive = true;
    paused = false;
    if (pauseBtn) pauseBtn.textContent = 'Pause';
    gameOverScreen.style.display = 'none';
    spawnInitialPlatforms();
    updateHUD();
  }

  function updateHUD() {
    scoreEl.textContent = `Score: ${score}`;
    heightEl.textContent = `Height: ${Math.floor(maxHeight)}`;
  }

  function spawnInitialPlatforms() {
    // base platform
    platforms.push({ x: W/2 - 40, y: H - 40, w: 80, h: 12, type: 'static' });
    // random platforms upwards
    let y = H - 120;
    while (y > -2000) {
      platforms.push({
        x: Math.random() * (W - 100) + 20,
        y,
        w: 80,
        h: 12,
        type: Math.random() < 0.15 ? 'moving' : 'static',
        dir: Math.random() < 0.5 ? -1 : 1,
        speed: 80 + Math.random() * 80
      });
      y -= 100 + Math.random() * 40;
    }
  }

  function spawnAboveIfNeeded() {
    // ensure platforms above current camera
    const highest = Math.min(...platforms.map(p => p.y));
    while (highest > cameraY - 2000) {
      const ny = highest - (100 + Math.random() * 60);
      platforms.push({
        x: Math.random() * (W - 100) + 20,
        y: ny,
        w: 80,
        h: 12,
        type: Math.random() < 0.2 ? 'moving' : 'static',
        dir: Math.random() < 0.5 ? -1 : 1,
        speed: 90 + Math.random() * 90
      });
    }
  }

  const keys = { left: false, right: false };
  document.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') keys.left = true;
    if (k === 'arrowright' || k === 'd') keys.right = true;
    if (k === 'p') {
      // toggle pause via keyboard
      if (gameActive) {
        paused = !paused;
        if (pauseBtn) pauseBtn.textContent = paused ? 'Resume' : 'Pause';
        trackGameEvent(paused ? 'pause' : 'resume');
      }
    }
  });
  document.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') keys.left = false;
    if (k === 'arrowright' || k === 'd') keys.right = false;
  });

  function update(dt) {
    if (keys.left) player.vx = -MOVE_SPEED; else if (keys.right) player.vx = MOVE_SPEED; else player.vx = 0;

    // physics
    player.vy += GRAVITY * dt;
    player.x += player.vx * dt;
    player.y += player.vy * dt;

    // wrap x
    if (player.x < -20) player.x = W + 20;
    if (player.x > W + 20) player.x = -20;

    // moving platforms
    platforms.forEach(p => {
      if (p.type === 'moving') {
        p.x += p.dir * p.speed * dt;
        if (p.x < 10 || p.x + p.w > W - 10) p.dir *= -1;
      }
    });

    // collision only when falling
    if (player.vy > 0) {
      for (const p of platforms) {
        const px1 = p.x, px2 = p.x + p.w;
        const py1 = p.y, py2 = p.y + p.h;
        const nextY = player.y + player.radius;
        const prevY = player.y - player.vy * dt + player.radius; // previous bottom
        const withinX = player.x > px1 && player.x < px2;
        const crossing = prevY <= py1 && nextY >= py1;
        if (withinX && crossing) {
          player.vy = BOUNCE_VELOCITY;
          score += 10;
          trackGameEvent('bounce', { score });
          break;
        }
      }
    }

    // camera follows player upward
    if (player.y < H/2) {
      const diff = H/2 - player.y;
      player.y += diff;
      cameraY -= diff;
      maxHeight = Math.max(maxHeight, -cameraY);
    }

    // remove platforms below view
    platforms = platforms.filter(p => p.y > cameraY - 100);

    spawnAboveIfNeeded();

    // fail if player falls below camera + H
    if (player.y - cameraY > H + 60) {
      endGame();
    }
  }

  function render() {
    // sky gradient already as background; we overlay stars and platforms
    ctx.clearRect(0, 0, W, H);

    // stars
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (let i = 0; i < 40; i++) {
      const sx = (i * 97) % W;
      const sy = ((i * 53) % (H + 200)) - ((cameraY * 0.05) % (H + 200));
      ctx.fillRect(sx, sy, 2, 2);
    }

    // platforms
    platforms.forEach(p => {
      ctx.fillStyle = p.type === 'moving' ? '#34d399' : '#22c55e';
      ctx.fillRect(p.x, p.y - cameraY, p.w, p.h);
    });

    // player
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(player.x, player.y - cameraY, player.radius, 0, Math.PI * 2);
    ctx.fill();
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
      // draw pause overlay
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Paused', W / 2, H / 2);
      ctx.textAlign = 'left';
    }
    requestAnimationFrame(loop);
  }

  function endGame() {
    gameActive = false;
    finalScoreEl.textContent = score;
    gameOverScreen.style.display = 'block';
    trackGameEvent('game_over', { score, height: Math.floor(maxHeight) });
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

  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
      if (!gameActive) return;
      paused = !paused;
      pauseBtn.textContent = paused ? 'Resume' : 'Pause';
      trackGameEvent(paused ? 'pause' : 'resume');
    });
  }

  // touch/mobile controls
  function bindHoldButton(id, onPress, onRelease) {
    const el = document.getElementById(id);
    if (!el) return;
    const down = (e) => { e.preventDefault(); onPress(); };
    const up = (e) => { e.preventDefault(); onRelease(); };
    el.addEventListener('mousedown', down);
    el.addEventListener('mouseup', up);
    el.addEventListener('mouseleave', up);
    el.addEventListener('touchstart', down, { passive: false });
    el.addEventListener('touchend', up, { passive: false });
    el.addEventListener('touchcancel', up, { passive: false });
  }
  bindHoldButton('btnLeft', () => { keys.left = true; }, () => { keys.left = false; });
  bindHoldButton('btnRight', () => { keys.right = true; }, () => { keys.right = false; });
  resetGame();
  requestAnimationFrame(loop);
})();