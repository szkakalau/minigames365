(function(){
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  const CELL = 20; // grid size
  const COLS = Math.floor(W / CELL);
  const ROWS = Math.floor(H / CELL);

  let snake, dir, nextDir, food, score, best, running, lastTime, step, speed;
  let paused = false;
  const pauseBtn = document.getElementById('pauseBtn');

  function roundRectFill(x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r);
    ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r);
    ctx.arcTo(x,y,x+w,y,r);
    ctx.closePath();
    ctx.fill();
  }

  function reset() {
    snake = [{x: Math.floor(COLS/2), y: Math.floor(ROWS/2)}];
    dir = {x:1, y:0};
    nextDir = {x:1, y:0};
    placeFood();
    score = 0;
    best = Number(localStorage.getItem('snake_best') || 0);
    running = true;
    step = 0;
    speed = 8; // cells per second
    paused = false;
    if (pauseBtn) pauseBtn.textContent = 'Pause';
    updateHUD();
    track('game_start');
  }

  function placeFood(){
    while(true){
      const x = Math.floor(Math.random()*COLS);
      const y = Math.floor(Math.random()*ROWS);
      if(!snake.some(s=>s.x===x && s.y===y)){
        food = {x,y};
        return;
      }
    }
  }

  function updateHUD(){
    document.getElementById('score').textContent = 'Score: ' + score;
    document.getElementById('best').textContent = 'Best: ' + Math.max(best, score);
  }

  function loop(ts){
    if(!running) return;
    if (paused) { draw(); drawPauseOverlay(); requestAnimationFrame(loop); return; }
    if(!lastTime) lastTime = ts;
    const dt = (ts - lastTime)/1000;
    lastTime = ts;
    step += dt * speed;
    while(step >= 1){
      step -= 1;
      tick();
    }
    draw();
    requestAnimationFrame(loop);
  }

  function tick(){
    if (paused) return;
    dir = nextDir;
    const head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};

    // Wrap or collide with wall? Let's use solid walls for classic mode
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS){
      return gameOver();
    }

    // Self collision
    if (snake.some(s=> s.x===head.x && s.y===head.y)){
      return gameOver();
    }

    snake.unshift(head);

    // Eat food
    if (head.x === food.x && head.y === food.y){
      score += 1;
      if (score % 5 === 0) speed += 0.5; // Gradually speed up
      placeFood();
      track('score', { score });
    } else {
      snake.pop();
    }

    updateHUD();
  }

  function draw(){
    // background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0,0,W,H);

    // grid (subtle)
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let x=0; x<=W; x+=CELL){
      ctx.beginPath();
      ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke();
    }
    for (let y=0; y<=H; y+=CELL){
      ctx.beginPath();
      ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke();
    }

    // snake
    for (let i=0;i<snake.length;i++){
      const s = snake[i];
      const isHead = i===0;
      ctx.fillStyle = isHead ? '#34d399' : '#10b981';
      roundRectFill(s.x*CELL+2, s.y*CELL+2, CELL-4, CELL-4, 6);
    }

    // food
    ctx.fillStyle = '#f59e0b';
    roundRectFill(food.x*CELL+3, food.y*CELL+3, CELL-6, CELL-6, 6);
  }

  function drawPauseOverlay(){
    // dim overlay
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0,0,W,H);
    // text
    ctx.fillStyle = '#fff';
    ctx.font = '20px system-ui, -apple-system, Segoe UI, Roboto, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Paused - Press P or Pause', W/2, H/2);
  }

  function gameOver(){
    running = false;
    best = Math.max(best, score);
    localStorage.setItem('snake_best', String(best));
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOverScreen').style.display = 'block';
    track('game_over', { score });
  }

  function restartGame(){
    document.getElementById('gameOverScreen').style.display = 'none';
    score = 0;
    lastTime = 0;
    step = 0;
    paused = false;
    if (pauseBtn) pauseBtn.textContent = 'Pause';
    track('restart');
    reset();
    requestAnimationFrame(loop);
  }
  window.restartGame = restartGame;

  // input
  window.addEventListener('keydown', (e)=>{
    const k = e.key.toLowerCase();
    const code = e.code;
    const interceptCodes = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyW','KeyA','KeyS','KeyD','KeyP'];
    if (interceptCodes.includes(code)) e.preventDefault();

    if (k === 'p') {
      if (!running) return; // ignore when not running
      paused = !paused;
      if (pauseBtn) pauseBtn.textContent = paused ? 'Resume' : 'Pause';
      track('pause_toggle', { state: paused ? 'paused' : 'resumed' });
      return;
    }
    if (paused) return;
    if(!running && (k===' ' || code==='Space')){ restartGame(); return; }
    if(k==='arrowup' || k==='w') { if (dir.y!==1) nextDir={x:0,y:-1}; }
    else if(k==='arrowdown' || k==='s') { if (dir.y!==-1) nextDir={x:0,y:1}; }
    else if(k==='arrowleft' || k==='a') { if (dir.x!==1) nextDir={x:-1,y:0}; }
    else if(k==='arrowright' || k==='d') { if (dir.x!==-1) nextDir={x:1,y:0}; }
  });
  window.addEventListener('keyup', (e)=>{
    const code = e.code;
    const interceptCodes = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyW','KeyA','KeyS','KeyD','KeyP'];
    if (interceptCodes.includes(code)) e.preventDefault();
  });

  // touch swipe
  let startX=0, startY=0;
  canvas.addEventListener('touchstart', (e)=>{
    if (paused) return;
    const t = e.touches[0]; startX=t.clientX; startY=t.clientY;
  }, {passive:true});
  canvas.addEventListener('touchmove', (e)=>{
    if (paused) return;
    if(!startX && !startY) return;
    const t = e.touches[0];
    const dx = t.clientX - startX; const dy = t.clientY - startY;
    if (Math.abs(dx) > Math.abs(dy)){
      if (dx > 10 && dir.x!==-1) nextDir={x:1,y:0};
      else if (dx < -10 && dir.x!==1) nextDir={x:-1,y:0};
    } else {
      if (dy > 10 && dir.y!==-1) nextDir={x:0,y:1};
      else if (dy < -10 && dir.y!==1) nextDir={x:0,y:-1};
    }
  }, {passive:true});

  document.getElementById('restartBtn').addEventListener('click', restartGame);
  if (pauseBtn) pauseBtn.addEventListener('click', ()=>{
    if (!running) return;
    paused = !paused;
    pauseBtn.textContent = paused ? 'Resume' : 'Pause';
    track('pause_toggle', { state: paused ? 'paused' : 'resumed' });
  });

  function track(action, extras = {}){
    if (typeof window.trackGameEvent === 'function') window.trackGameEvent(action, extras);
  }

  // boot
  reset();
  requestAnimationFrame(loop);
})();