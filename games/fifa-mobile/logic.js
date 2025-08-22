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

  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const timerEl = document.getElementById('timer');
  const overEl = document.getElementById('gameOverScreen');
  const finalScoreEl = document.getElementById('finalScore');
  const restartBtn = document.getElementById('restartBtn');

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
    updateHUD();
  }

  function endGame() {
    running = false;
    overEl.style.display = 'block';
    finalScoreEl.textContent = score;
    if (score > best) { best = score; localStorage.setItem('fifa_best', best); }
    updateHUD();
    if (typeof trackGameEvent === 'function') {
      trackGameEvent('game_over', score);
    }
  }

  function update(dt) {
    if (!running) return;

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
            trackGameEvent('score_goal', score);
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

  function draw() {
    // pitch
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, W, H);

    // penalty box / goal area simplified
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.strokeRect(goal.x, goal.y, goal.w, goal.h);

    // keeper
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(keeper.x, keeper.y, keeper.w, keeper.h);

    // ball
    ctx.fillStyle = '#e5e7eb';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();

    // aim indicator
    if (!ball.moving) {
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(ball.x, ball.y);
      ctx.lineTo(ball.x + Math.cos(aim.angle) * 60, ball.y + Math.sin(aim.angle) * 60);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function shoot() {
    if (ball.moving) return;
    ball.moving = true;
    const p = aim.power;
    ball.vx = Math.cos(aim.angle) * p;
    ball.vy = Math.sin(aim.angle) * p;
  }

  function move(dir) {
    if (ball.moving) return;
    aim.angle += dir * 0.05;
  }

  window.restartGame = function () { resetGame(); };

  window.addEventListener('keydown', (e) => {
    if (!running && e.key.toLowerCase() === 'enter') { resetGame(); return; }
    if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') move(-1);
    if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') move(1);
    if (e.key === ' ' || e.key === 'Spacebar') shoot();
  });

  canvas.addEventListener('click', shoot);

  restartBtn.addEventListener('click', resetGame);

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