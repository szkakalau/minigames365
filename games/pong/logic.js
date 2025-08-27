(function(){
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  let running = true;
  let paused = false;
  let player = { x: 10, y: H/2 - 40, w: 12, h: 80, speed: 6 };
  let ai = { x: W-22, y: H/2 - 40, w: 12, h: 80, speed: 5 };
  let ball = { x: W/2, y: H/2, r: 8, vx: 5, vy: 3 };
  let score = { p: 0, ai: 0 };

  function resetBall(direction=1){
    ball.x = W/2; ball.y = H/2; ball.vx = 5*direction; ball.vy = (Math.random()*4-2);
  }

  function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }

  function update(){
    if (!running || paused) return;
    // player movement (follows mouse/touch or arrow keys)
    if (keys['ArrowUp']) player.y -= player.speed;
    if (keys['ArrowDown']) player.y += player.speed;
    player.y = clamp(player.y, 0, H - player.h);

    // AI movement (simple)
    const aiCenter = ai.y + ai.h/2;
    if (aiCenter < ball.y - 10) ai.y += ai.speed;
    else if (aiCenter > ball.y + 10) ai.y -= ai.speed;
    ai.y = clamp(ai.y, 0, H - ai.h);

    // ball movement
    ball.x += ball.vx; ball.y += ball.vy;

    // top/bottom bounce
    if (ball.y - ball.r < 0 && ball.vy < 0){ ball.y = ball.r; ball.vy *= -1; }
    if (ball.y + ball.r > H && ball.vy > 0){ ball.y = H - ball.r; ball.vy *= -1; }

    // paddle collisions
    // player
    if (ball.x - ball.r < player.x + player.w &&
        ball.y > player.y && ball.y < player.y + player.h && ball.vx < 0){
      ball.x = player.x + player.w + ball.r;
      ball.vx *= -1;
      // add spin
      const hitPos = (ball.y - (player.y + player.h/2)) / (player.h/2);
      ball.vy = hitPos * 5;
      track('hit');
    }
    // ai
    if (ball.x + ball.r > ai.x &&
        ball.y > ai.y && ball.y < ai.y + ai.h && ball.vx > 0){
      ball.x = ai.x - ball.r;
      ball.vx *= -1;
      const hitPos = (ball.y - (ai.y + ai.h/2)) / (ai.h/2);
      ball.vy = hitPos * 5;
      track('ai_hit');
    }

    // scoring
    if (ball.x < -20){ score.ai++; track('score_ai'); resetBall(1); }
    if (ball.x > W+20){ score.p++; track('score_player'); resetBall(-1); }

    // update HUD
    document.getElementById('score').textContent = `Player: ${score.p} | AI: ${score.ai}`;

    // end condition (first to 7)
    if (score.p >= 7 || score.ai >= 7){
      running = false;
      document.getElementById('finalScore').textContent = `${score.p} - ${score.ai}`;
      document.getElementById('gameOverScreen').style.display = 'block';
      track('game_end', score.p);
    }
  }

  function draw(){
    ctx.fillStyle = '#0b1220'; ctx.fillRect(0,0,W,H);
    // middle dashed line
    ctx.strokeStyle = '#334155';
    ctx.setLineDash([8,10]);
    ctx.beginPath(); ctx.moveTo(W/2, 0); ctx.lineTo(W/2, H); ctx.stroke();
    ctx.setLineDash([]);

    // paddles
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.fillRect(ai.x, ai.y, ai.w, ai.h);

    // ball
    ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2); ctx.fill();
  }

  function drawPauseOverlay(){
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle = '#fff';
    ctx.font = '20px system-ui, -apple-system, Segoe UI, Roboto, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Paused - Press P or Pause', W/2, H/2);
  }

  function loop(){
    update();
    draw();
    if (paused) drawPauseOverlay();
    if (running) requestAnimationFrame(loop);
  }

  const keys = {};
  const controlCodes = new Set(['ArrowUp','ArrowDown','KeyW','KeyS','Space','KeyP']);
  window.addEventListener('keydown', e=>{ 
    // Prevent default scroll/space behavior for control keys at all times
    if (controlCodes.has(e.code)) { if (e.preventDefault) e.preventDefault(); }
    // Map WASD to Arrow keys for movement
    if (e.code === 'KeyW') keys['ArrowUp'] = true;
    if (e.code === 'KeyS') keys['ArrowDown'] = true;

    keys[e.code]=true; 
    if(e.code==='KeyP'){
      if (!running) return;
      paused = !paused;
      const pb = document.getElementById('pauseBtn'); if(pb) pb.textContent = paused? 'Resume':'Pause';
      track('pause_toggle', paused ? 1 : 0);
    }
    if(!running && e.code==='Space') restartGame(); 
  });
  window.addEventListener('keyup', e=> {
    keys[e.code]=false;
    if (e.code === 'KeyW') keys['ArrowUp'] = false;
    if (e.code === 'KeyS') keys['ArrowDown'] = false;
  });

  // Pause button
  const pauseBtn = document.getElementById('pauseBtn');
  if(pauseBtn){
    pauseBtn.addEventListener('click', ()=>{
      if (!running) return;
      paused = !paused;
      pauseBtn.textContent = paused? 'Resume':'Pause';
      track('pause_toggle', paused ? 1 : 0);
    });
  }

  // Mobile controls (Up/Down hold)
  function bindHold(el, onStart, onEnd){
    if(!el) return;
    const start = (e)=>{ onStart(); e.preventDefault && e.preventDefault(); };
    const end = ()=>{ onEnd(); };
    el.addEventListener('touchstart', start, {passive:false});
    el.addEventListener('touchend', end);
    el.addEventListener('mousedown', start);
    el.addEventListener('mouseup', end);
    el.addEventListener('mouseleave', end);
  }
  bindHold(document.getElementById('btnUp'), ()=>{ keys['ArrowUp']=true; }, ()=>{ keys['ArrowUp']=false; });
  bindHold(document.getElementById('btnDown'), ()=>{ keys['ArrowDown']=true; }, ()=>{ keys['ArrowDown']=false; });

  // Mouse/touch control: move paddle to pointer Y
  function pointerMove(clientY){
    if (paused) return;
    const rect = canvas.getBoundingClientRect();
    const y = clientY - rect.top;
    player.y = clamp(y - player.h/2, 0, H - player.h);
  }
  canvas.addEventListener('mousemove', e=> pointerMove(e.clientY));
  canvas.addEventListener('touchmove', e=>{ if(e.preventDefault) e.preventDefault(); pointerMove(e.touches[0].clientY); }, {passive:false});

  function restartGame(){
    score.p = 0; score.ai = 0; running = true; paused = false; player.y = H/2-40; ai.y = H/2-40; resetBall((Math.random()<0.5)?1:-1);
    document.getElementById('gameOverScreen').style.display = 'none';
    const pb = document.getElementById('pauseBtn'); if(pb) pb.textContent = 'Pause';
    track('game_start');
    requestAnimationFrame(loop);
  }
  document.getElementById('restartBtn').addEventListener('click', restartGame);

  function track(action, val){ if (typeof window.trackGameEvent === 'function') window.trackGameEvent(action, val); }

  // Expose restartGame for inline button in HTML
  window.restartGame = restartGame;

  track('game_start');
  requestAnimationFrame(loop);
})();