(function(){
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const TILE = 20;
  const COLS = 26;
  const ROWS = 28;
  canvas.width = COLS * TILE;
  canvas.height = ROWS * TILE;

  const WALL = 1, DOT = 2, POWER = 3, EMPTY = 0;
  let score = 0, level = 1, lives = 3, running = true;
  let paused = false;
  const SPEED = 2.0;

  // Simple maze layout (border walls + dots inside)
  const grid = Array.from({length: ROWS}, (_, y) => Array.from({length: COLS}, (_, x)=>{
    if (y===0||y===ROWS-1||x===0||x===COLS-1) return WALL;
    if ((x%2===0 && y%2===0) && Math.random()>0.6) return WALL;
    return DOT;
  }));

  const pac = { x: 13*TILE, y: 23*TILE, dirX: 0, dirY: 0, nextX:0, nextY:0 };
  const ghosts = [
    { x: 13*TILE, y: 11*TILE, color:'#ef4444', dirX:1, dirY:0 },
    { x: 12*TILE, y: 14*TILE, color:'#22d3ee', dirX:-1, dirY:0 },
    { x: 14*TILE, y: 14*TILE, color:'#f59e0b', dirX:0, dirY:1 },
    { x: 13*TILE, y: 14*TILE, color:'#a78bfa', dirX:0, dirY:-1 }
  ];

  function cell(x,y){ return grid[y]?.[x] ?? WALL; }
  function isWall(cx, cy){ return cell(cx,cy) === WALL; }

  function update(){
    if (!running) return;
    if (paused) { updateHUD(); return; }
    // Try turn
    if (pac.nextX!==0 || pac.nextY!==0){
      const nx = Math.floor((pac.x + pac.nextX*TILE)/TILE);
      const ny = Math.floor((pac.y + pac.nextY*TILE)/TILE);
      if (!isWall(nx, ny)){
        pac.dirX = pac.nextX; pac.dirY = pac.nextY; pac.nextX=0; pac.nextY=0;
      }
    }
    // Move pacman
    const cx = Math.floor(pac.x / TILE), cy = Math.floor(pac.y / TILE);
    const tx = Math.floor((pac.x + pac.dirX*SPEED)/TILE);
    const ty = Math.floor((pac.y + pac.dirY*SPEED)/TILE);
    if (!isWall(tx, ty)){
      pac.x += pac.dirX * SPEED; pac.y += pac.dirY * SPEED;
    }
    // Eat dots
    const ccx = Math.floor((pac.x+TILE/2)/TILE), ccy = Math.floor((pac.y+TILE/2)/TILE);
    if (cell(ccx, ccy) === DOT) { grid[ccy][ccx] = EMPTY; score += 10; }

    // Move ghosts (simple random turns)
    ghosts.forEach(g=>{
      const gtx = Math.floor((g.x + g.dirX*SPEED)/TILE);
      const gty = Math.floor((g.y + g.dirY*SPEED)/TILE);
      if (!isWall(gtx, gty)){
        g.x += g.dirX*SPEED; g.y += g.dirY*SPEED;
      } else {
        const dirs = [ [1,0], [-1,0], [0,1], [0,-1] ];
        const choices = dirs.filter(([dx,dy])=>!isWall(Math.floor(g.x/TILE)+dx, Math.floor(g.y/TILE)+dy));
        if (choices.length){ const [dx,dy] = choices[(Math.random()*choices.length)|0]; g.dirX=dx; g.dirY=dy; }
      }
    });

    // Check collisions
    ghosts.forEach(g=>{
      const dist = Math.hypot(g.x - pac.x, g.y - pac.y);
      if (dist < TILE*0.6){
        lives -= 1; track('life_lost');
        if (lives <= 0){ gameOver(); }
        else { resetPositions(); }
      }
    });

    updateHUD();
  }

  function resetPositions(){
    pac.x = 13*TILE; pac.y = 23*TILE; pac.dirX=0; pac.dirY=0; pac.nextX=0; pac.nextY=0;
    ghosts[0].x=13*TILE; ghosts[0].y=11*TILE; ghosts[0].dirX=1; ghosts[0].dirY=0;
    ghosts[1].x=12*TILE; ghosts[1].y=14*TILE; ghosts[1].dirX=-1; ghosts[1].dirY=0;
    ghosts[2].x=14*TILE; ghosts[2].y=14*TILE; ghosts[2].dirX=0; ghosts[2].dirY=1;
    ghosts[3].x=13*TILE; ghosts[3].y=14*TILE; ghosts[3].dirX=0; ghosts[3].dirY=-1;
  }

  function draw(){
    ctx.fillStyle = '#000'; ctx.fillRect(0,0,canvas.width, canvas.height);
    // grid
    for (let y=0; y<ROWS; y++){
      for (let x=0; x<COLS; x++){
        if (grid[y][x] === WALL){ ctx.fillStyle = '#0ea5e9'; ctx.fillRect(x*TILE, y*TILE, TILE, TILE); }
        else if (grid[y][x] === DOT){ ctx.fillStyle = '#fef3c7'; ctx.beginPath(); ctx.arc(x*TILE+TILE/2, y*TILE+TILE/2, 2, 0, Math.PI*2); ctx.fill(); }
      }
    }
    // pacman
    ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(pac.x+TILE/2, pac.y+TILE/2, TILE/2-2, 0.25*Math.PI, 1.75*Math.PI); ctx.lineTo(pac.x+TILE/2, pac.y+TILE/2); ctx.fill();
    // ghosts
    ghosts.forEach(g=>{ ctx.fillStyle = g.color; ctx.fillRect(g.x+2, g.y+2, TILE-4, TILE-4); });

    // pause overlay
    if (running && paused){
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0,0,canvas.width, canvas.height);
      ctx.fillStyle = '#e5e7eb';
      ctx.font = '18px system-ui, -apple-system, Segoe UI, Roboto, Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Paused - press P or tap Resume', canvas.width/2, canvas.height/2);
    }
  }

  function loop(){ update(); draw(); if (running) requestAnimationFrame(loop); }

  function updateHUD(){
    document.getElementById('score').textContent = 'Score: ' + score;
    document.getElementById('level').textContent = 'Level: ' + level;
    document.getElementById('lives').textContent = 'Lives: ' + lives;
  }

  function gameOver(){
    running = false;
    document.getElementById('finalScore').textContent = String(score);
    document.getElementById('finalLevel').textContent = String(level);
    document.getElementById('gameOverScreen').style.display = 'block';
    track('game_over', { score });
  }
  function restartGame(){
    score = 0; level = 1; lives = 3; running = true; paused = false; resetPositions();
    document.getElementById('gameOverScreen').style.display = 'none';
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) pauseBtn.textContent = 'Pause';
    track('restart');
    requestAnimationFrame(loop);
  }

  document.addEventListener('keydown', (e)=>{
    if (!running && (e.code === 'Space' || e.key === ' ')) { e.preventDefault(); return restartGame(); }
    if (e.code === 'KeyP'){
      if (running){
        paused = !paused;
        const pb=document.getElementById('pauseBtn'); if (pb) pb.textContent = paused ? 'Resume' : 'Pause';
        track('pause_toggle', { state: paused ? 'paused' : 'resumed' });
      }
      e.preventDefault();
      return;
    }
    // block directional inputs when paused or not running
    if (!running || paused){ 
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'].includes(e.code)) {
        e.preventDefault(); 
      }
      return; 
    }
    if (e.code === 'ArrowLeft'){ pac.nextX=-1; pac.nextY=0; e.preventDefault(); }
    if (e.code === 'ArrowRight'){ pac.nextX=1; pac.nextY=0; e.preventDefault(); }
    if (e.code === 'ArrowUp'){ pac.nextX=0; pac.nextY=-1; e.preventDefault(); }
    if (e.code === 'ArrowDown'){ pac.nextX=0; pac.nextY=1; e.preventDefault(); }
    if (e.code === 'KeyW'){ pac.nextX=0; pac.nextY=-1; e.preventDefault(); }
    if (e.code === 'KeyA'){ pac.nextX=-1; pac.nextY=0; e.preventDefault(); }
    if (e.code === 'KeyS'){ pac.nextX=0; pac.nextY=1; e.preventDefault(); }
    if (e.code === 'KeyD'){ pac.nextX=1; pac.nextY=0; e.preventDefault(); }
  });

  document.addEventListener('keyup', (e)=>{
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'KeyP'].includes(e.code)) {
      e.preventDefault();
    }
  });

  document.getElementById('restartBtn').addEventListener('click', restartGame);
  // Pause button
  (function(){
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn){
      pauseBtn.addEventListener('click', ()=>{
        if (!running) return;
        paused = !paused; pauseBtn.textContent = paused ? 'Resume' : 'Pause';
        track('pause_toggle', { state: paused ? 'paused' : 'resumed' });
      });
    }
  })();
  // Mobile controls
  (function(){
    const up = document.getElementById('btnUp');
    const down = document.getElementById('btnDown');
    const left = document.getElementById('btnLeft');
    const right = document.getElementById('btnRight');
    const tryDir = (dx,dy)=>{ if (!running || paused) return; pac.nextX=dx; pac.nextY=dy; };
    up && up.addEventListener('click', ()=>{ tryDir(0,-1); }, { passive: true });
    down && down.addEventListener('click', ()=>{ tryDir(0,1); }, { passive: true });
    left && left.addEventListener('click', ()=>{ tryDir(-1,0); }, { passive: true });
    right && right.addEventListener('click', ()=>{ tryDir(1,0); }, { passive: true });
  })();

  function track(action, extras){
    if (typeof window.trackGameEvent === 'function') {
      window.trackGameEvent(action, extras);
    }
  }

  track('game_start');
  window.restartGame = restartGame;
  requestAnimationFrame(loop);
})();