/*
  FIFA Mobile (Lite) - top-down penalty/shootout style mini game
  Mechanics:
    - Player aims and shoots at goal with a moving keeper
    - Time-limited match, score as many goals as possible
*/

(function () {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  let running = true;
  let score = 0;
  let best = Number(localStorage.getItem('fifa_best') || 0);
  let timeLeft = 60 * 1000; // 60 sec in ms
  let paused = false;

  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const timerEl = document.getElementById('timer');
  const overEl = document.getElementById('gameOverScreen');
  const finalScoreEl = document.getElementById('finalScore');
  const restartBtn = document.getElementById('restartBtn');
  const pauseBtn = document.getElementById('pauseBtn');

  function updateHUD() {
    scoreEl.textContent = `Score: ${score}`;
    bestEl.textContent = `Best: ${best}`;
    timerEl.textContent = `Time: ${Math.ceil(timeLeft / 1000)}`;
  }

  const goal = { x: W/2 - 120, y: 20, w: 240, h: 20 };
  const keeper = { x: W/2 - 20, y: 40, w: 40, h: 10, vx: 2 };
  const ball = { x: W/2, y: H - 40, r: 6, vx: 0, vy: 0, moving: false };
  const aim = { angle: -Math.PI/2, power: 5, dir: 1 };

  function resetBall() {
    ball.x = W/2;
    ball.y = H - 40;
    ball.vx = 0; ball.vy = 0; ball.moving = false;
    aim.angle = -Math.PI/2 + (Math.random()*0.4 - 0.2);
    aim.power = 5 + Math.random()*4;
  }

  function resetGame() {
    running = true;
    score = 0;
    timeLeft = 60 * 1000;
    keeper.x = W/2 - 20; keeper.vx = 2;
    resetBall();
    overEl.style.display = 'none';
    paused = false;
    if (pauseBtn) pauseBtn.textContent = 'Pause';
    updateHUD();
  }

  function endGame() {
    running = false;
    overEl.style.display = 'block';
    finalScoreEl.textContent = score;
    if (score > best) { best = score; localStorage.setItem('fifa_best', best); }
    updateHUD();
    if (typeof trackGameEvent === 'function') {
      trackGameEvent('game_over', { score });
    }
  }

  function update(dt) {
-    if (!running) return;
+    if (!running || paused) return;

    // time
    timeLeft -= dt;
    if (timeLeft <= 0) { endGame(); return; }

    // keeper movement
    keeper.x += keeper.vx;
    if (keeper.x < goal.x) { keeper.x = goal.x; keeper.vx *= -1; }
    if (keeper.x + keeper.w > goal.x + goal.w) { keeper.x = goal.x + goal.w - keeper.w; keeper.vx *= -1; }

    // aim sway when not moving
    if (!ball.moving) {
      aim.angle += 0.002 * aim.dir * dt;
      if (aim.angle < -Math.PI/2 - 0.4) { aim.angle = -Math.PI/2 - 0.4; aim.dir *= -1; }
      if (aim.angle > -Math.PI/2 + 0.4) { aim.angle = -Math.PI/2 + 0.4; aim.dir *= -1; }
    }

    // ball physics
    if (ball.moving) {
      ball.x += ball.vx;
      ball.y += ball.vy;

      // friction
      ball.vx *= 0.995; ball.vy *= 0.995;

      // goal detection
      if (ball.y < goal.y + goal.h && ball.x > goal.x && ball.x < goal.x + goal.w) {
        // Check keeper block
        if (ball.y < keeper.y + keeper.h && ball.y > keeper.y && ball.x > keeper.x && ball.x < keeper.x + keeper.w) {
          // blocked - slow and bounce back slightly
          ball.vy = Math.abs(ball.vy) * 0.5;
          ball.vx *= 0.5;
        } else {
          // goal!
          score += 1;
          resetBall();
          if (typeof trackGameEvent === 'function') {
-            trackGameEvent('score_goal', score);
+            trackGameEvent('score_goal', { score });
          }
        }
      }

      // bounds
      if (ball.x < 10 || ball.x > W - 10) ball.vx *= -1;
      if (ball.y < 0) ball.vy *= -1;
      if (ball.y > H - 10) { // missed
        resetBall();
      }
    }

    updateHUD();
  }

  function togglePause(){
    if (!running) return;
    paused = !paused;
    if (pauseBtn) pauseBtn.textContent = paused ? 'Resume' : 'Pause';
    if (typeof trackGameEvent === 'function') {
-      trackGameEvent('pause_toggle', { state: paused ? 1 : 0 });
+      trackGameEvent('pause_toggle', { state: paused ? 'paused' : 'resumed' });
    }
  }

  window.restartGame = function () { resetGame(); };

  window.addEventListener('keydown', (e) => {
    const key = (e.key || '').toLowerCase();
    const code = e.code;
    const isArrow = key.startsWith('arrow');
    const isWASD = key === 'w' || key === 'a' || key === 's' || key === 'd';
    const isSpace = code === 'Space' || key === ' ';
    const isP = code === 'KeyP' || key === 'p';
    if (isArrow || isWASD || isSpace || isP) { e.preventDefault(); }
    if (isP) { if (!running) return; togglePause(); return; }
    if (paused) { return; }
    if (!running && key === 'enter') { resetGame(); return; }
    if (key === 'arrowleft' || key === 'a') move(-1);
    if (key === 'arrowright' || key === 'd') move(1);
    if (isSpace) shoot();
  });
+
+  // 控制键集合 + 键盘 keyup 屏蔽默认
+  const controlCodes = new Set(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyA','KeyD','KeyW','KeyS','Space','KeyP','Enter','KeyX','KeyC']);
+  window.addEventListener('keyup', (e)=>{ if (controlCodes.has(e.code) && e.preventDefault) e.preventDefault(); });

-  canvas.addEventListener('click', (e)=>{ if (paused) { e.preventDefault(); return; } shoot(); });
+  canvas.addEventListener('click', (e)=>{ if (paused || !running) { e.preventDefault(); return; } shoot(); });

-  restartBtn.addEventListener('click', resetGame);
+  restartBtn.addEventListener('click', ()=>{ resetGame(); if (typeof trackGameEvent==='function') trackGameEvent('restart'); });
+  window.restartGame = function () { resetGame(); if (typeof trackGameEvent==='function') trackGameEvent('restart'); };

  // Gameplay controls and rendering
  function move(dir) {
    if (paused || !running) return;
    if (ball.moving) return;
    // Adjust aiming angle within bounds
    aim.angle += dir * 0.06;
    const minAng = -Math.PI/2 - 0.4;
    const maxAng = -Math.PI/2 + 0.4;
    if (aim.angle < minAng) aim.angle = minAng;
    if (aim.angle > maxAng) aim.angle = maxAng;
  }

  function shoot() {
    if (paused || !running) return;
    if (ball.moving) return;
    // Launch ball based on current aim
    ball.vx = Math.cos(aim.angle) * aim.power;
    ball.vy = Math.sin(aim.angle) * aim.power;
    ball.moving = true;
  }

  function draw() {
    // background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);

    // goal frame (top bar + posts)
    ctx.fillStyle = '#e5e7eb';
    // top bar
    ctx.fillRect(goal.x, goal.y, goal.w, goal.h);
    // left and right posts
    ctx.fillRect(goal.x - 6, goal.y, 6, 60);
    ctx.fillRect(goal.x + goal.w, goal.y, 6, 60);

    // keeper
    ctx.fillStyle = '#fbbf24'; // amber
    ctx.fillRect(keeper.x, keeper.y, keeper.w, keeper.h);

    // ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // aim guide (only when ball is stationary)
    if (!ball.moving) {
      const len = 28 + aim.power * 4;
      const ex = ball.x + Math.cos(aim.angle) * len;
      const ey = ball.y + Math.sin(aim.angle) * len;
      ctx.strokeStyle = '#22c55e'; // green
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ball.x, ball.y);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      // arrowhead
      const ah = 6;
      const leftAng = aim.angle + Math.PI * 0.85;
      const rightAng = aim.angle - Math.PI * 0.85;
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex + Math.cos(leftAng) * ah, ey + Math.sin(leftAng) * ah);
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex + Math.cos(rightAng) * ah, ey + Math.sin(rightAng) * ah);
      ctx.stroke();
    }

    // paused overlay
    if (paused && running) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Paused - Press P or click Resume', W / 2, H / 2);
    }
  }

  let last = 0;
  function loop(ts) {
    const dt = last ? (ts - last) : 16;
    last = ts;
    update(dt);
    draw();
    if (running) requestAnimationFrame(loop);
  }

  resetGame();
  requestAnimationFrame(loop);
})();

// Removed dangling global togglePause; now defined within IIFE for proper scope