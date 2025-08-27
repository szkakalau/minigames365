(function(){
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  let score = 0;
  let best = Number(localStorage.getItem('futebol-frenzy_best') || 0);
  let running = true;
  let paused = false;

  const player = { x: 60, y: H/2, r: 14, speed: 3.5 };
  const ball = { x: 100, y: H/2, r: 8, vx: 0, vy: 0 };
  const defenders = [];
  const goal = { x: W - 40, y: H/2 - 60, w: 10, h: 120 };

  const keys = { ArrowUp:false, ArrowDown:false, ArrowLeft:false, ArrowRight:false, Space:false };

  // Controls DOM
  const restartBtn = document.getElementById('restartBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const btnUp = document.getElementById('btnUp');
  const btnDown = document.getElementById('btnDown');
  const btnLeft = document.getElementById('btnLeft');
  const btnRight = document.getElementById('btnRight');
  const btnShoot = document.getElementById('btnShoot');

  function spawnDefender() {
    const y = 40 + Math.random() * (H - 80);
    const speed = 2 + Math.random() * 1.5;
    defenders.push({ x: W + 20, y, r: 14, vx: -speed });
  }

  let spawnTimer = 0;

  function init(){
    score = 0;
    running = true;
    paused = false;
    if (pauseBtn) pauseBtn.textContent = 'Pausar';
    player.x = 60; player.y = H/2;
    ball.x = 100; ball.y = H/2; ball.vx = 0; ball.vy = 0;
    defenders.length = 0;
    spawnTimer = 0;
    draw();
    loop();
    track('game_start');
    document.getElementById('score').textContent = 'Gols: ' + score;
    document.getElementById('best').textContent = 'Melhor: ' + best;
  }

  function loop(){
    if (!running) return;
    update();
    draw();
    if (paused) drawPauseOverlay();
    requestAnimationFrame(loop);
  }

  function update(){
    if (paused) return;
    // Player move
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    player.x = Math.max(player.r, Math.min(W - player.r, player.x));
    player.y = Math.max(player.r, Math.min(H - player.r, player.y));

    // Ball follow player slightly if not moving
    if (Math.abs(ball.vx) < 0.01 && Math.abs(ball.vy) < 0.01) {
      ball.x += (player.x + 18 - ball.x) * 0.2;
      ball.y += (player.y - ball.y) * 0.2;
    }

    // Kick ball
    if (keys.Space && (Math.abs(ball.vx) < 0.1 && Math.abs(ball.vy) < 0.1)){
      const dx = goal.x - player.x;
      const dy = (goal.y + goal.h/2) - player.y;
      const len = Math.hypot(dx, dy) || 1;
      ball.vx = (dx/len) * 6.0;
      ball.vy = (dy/len) * 6.0;
      track('shoot');
    }

    // Ball physics
    ball.x += ball.vx;
    ball.y += ball.vy;
    ball.vx *= 0.99;
    ball.vy *= 0.99;

    // Wall bounce
    if (ball.y - ball.r < 0 || ball.y + ball.r > H) ball.vy *= -1;
    if (ball.x - ball.r < 0) ball.vx *= -1;

    // Spawn defenders
    spawnTimer -= 1;
    if (spawnTimer <= 0) {
      spawnDefender();
      spawnTimer = 60 + Math.random() * 50;
    }

    // Update defenders
    for (let i = defenders.length - 1; i >= 0; i--) {
      const d = defenders[i];
      d.x += d.vx;
      if (d.x < -30) defenders.splice(i,1);

      // Collide with ball
      const dx = ball.x - d.x;
      const dy = ball.y - d.y;
      const dist = Math.hypot(dx, dy);
      if (dist < ball.r + d.r) {
        // ball knocked away
        const nx = dx / (dist || 1);
        const ny = dy / (dist || 1);
        ball.vx = nx * 5;
        ball.vy = ny * 5;
      }

      // Tackle player -> game over
      const pdx = player.x - d.x;
      const pdy = player.y - d.y;
      if (Math.hypot(pdx, pdy) < player.r + d.r) {
        gameOver();
        return;
      }
    }

    // Goal scored
    if (ball.x + ball.r > goal.x && ball.y > goal.y && ball.y < goal.y + goal.h) {
      score += 1;
      best = Math.max(best, score);
      localStorage.setItem('futebol-frenzy_best', String(best));
      document.getElementById('score').textContent = 'Gols: ' + score;
      track('score', score);
      // reset ball and some defenders
      ball.x = player.x + 20; ball.y = player.y; ball.vx = 0; ball.vy = 0;
      defenders.splice(0, Math.floor(defenders.length/3));
    }
  }

  function draw(){
    // Field
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0,0,W,H);
    // Mid line and circle
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W/2,0); ctx.lineTo(W/2,H); ctx.stroke();
    ctx.beginPath();
    ctx.arc(W/2, H/2, 50, 0, Math.PI*2); ctx.stroke();

    // Goal
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(goal.x, goal.y, goal.w, goal.h);

    // Defenders
    defenders.forEach(d => {
      ctx.fillStyle = '#FFCC00';
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI*2);
      ctx.fill();
    });

    // Player
    ctx.fillStyle = '#006400';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI*2);
    ctx.fill();

    // Ball
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2);
    ctx.fill();

    // Score overlay
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Melhor: ' + best, W - 12, 24);
  }

  function drawPauseOverlay(){
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 28px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    ctx.fillText('Pausado', W/2, H/2);
    ctx.font = '14px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    ctx.fillText('Pressione P ou toque em Retomar', W/2, H/2 + 28);
  }

  function gameOver(){
    running = false;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOverScreen').style.display = 'block';
    track('game_end', score);
  }

  function restartGame(){
    document.getElementById('gameOverScreen').style.display = 'none';
    init();
  }

  window.restartGame = restartGame;

  // Key events
  window.addEventListener('keydown', (e) => { 
    if (e.code === 'KeyP'){ e.preventDefault(); togglePause(); return; }
    if (!paused && e.key in keys) keys[e.key] = true; 
    if (!paused && e.code === 'Space') { e.preventDefault(); keys.Space = true; }
  });
  window.addEventListener('keyup',   (e) => { if (e.key in keys) keys[e.key] = false; if (e.code === 'Space') keys.Space = false; });

  // Pause binding
  function togglePause(){
    if (!running) return; // when game over, ignore
    paused = !paused;
    if (pauseBtn) pauseBtn.textContent = paused ? 'Retomar' : 'Pausar';
    track(paused ? 'pause' : 'resume');
  }
  if (pauseBtn) pauseBtn.addEventListener('click', togglePause);
  if (restartBtn) restartBtn.addEventListener('click', restartGame);

  // Mobile controls mapping
  const hold = (el, setFn, clearFn) => {
    if (!el) return;
    el.addEventListener('touchstart', (e)=>{ e.preventDefault(); if (!paused && running) setFn(); }, { passive:false });
    el.addEventListener('touchend',   (e)=>{ e.preventDefault(); clearFn(); }, { passive:false });
    el.addEventListener('mousedown',  (e)=>{ e.preventDefault(); if (!paused && running) setFn(); });
    document.addEventListener('mouseup', ()=> clearFn());
    document.addEventListener('touchend', ()=> clearFn(), { passive:true });
  };

  hold(btnUp,   ()=> keys.ArrowUp = true,   ()=> keys.ArrowUp = false);
  hold(btnDown, ()=> keys.ArrowDown = true, ()=> keys.ArrowDown = false);
  hold(btnLeft, ()=> keys.ArrowLeft = true, ()=> keys.ArrowLeft = false);
  hold(btnRight,()=> keys.ArrowRight = true,()=> keys.ArrowRight = false);
  if (btnShoot){
    btnShoot.addEventListener('click', ()=>{ if (!paused && running){ keys.Space = true; setTimeout(()=> keys.Space = false, 80); }});
    btnShoot.addEventListener('touchstart', (e)=>{ e.preventDefault(); if (!paused && running){ keys.Space = true; setTimeout(()=> keys.Space = false, 80); }}, { passive:false });
  }

  function track(action, score){ if (typeof window.trackGameEvent === 'function') window.trackGameEvent(action, score); }

  init();
})();