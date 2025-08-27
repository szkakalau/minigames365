(function(){
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const W = canvas.width;
  const H = canvas.height;

  let gameOver = false;
  let paused = false;
  let score = 0;
  let wave = 1;
  let lives = 3;

  const player = {
    x: W/2 - 20,
    y: H - 60,
    w: 40,
    h: 12,
    speed: 6,
    color: '#34d399',
    vx: 0
  };

  const bullets = [];
  const enemyBullets = [];

  function createWave(rows, cols) {
    const invaders = [];
    const gapX = 60;
    const gapY = 40;
    const startX = (W - (cols-1)*gapX)/2 - 20;
    const startY = 80;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        invaders.push({
          x: startX + c*gapX,
          y: startY + r*gapY,
          w: 40,
          h: 24,
          alive: true,
          color: ['#60a5fa','#f472b6','#fbbf24'][r%3]
        });
      }
    }
    return invaders;
  }

  let invaders = createWave(3, 8);
  let invaderVx = 1.2;
  let invaderVyStep = 16;
  let invaderShootCooldown = 0;

  function drawPlayer(){
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.w, player.h);
    // turret
    ctx.fillRect(player.x + player.w/2 - 3, player.y - 10, 6, 10);
  }

  function drawInvaders(){
    invaders.forEach(inv => {
      if(!inv.alive) return;
      ctx.fillStyle = inv.color;
      ctx.fillRect(inv.x, inv.y, inv.w, inv.h);
      // eyes
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(inv.x + 6, inv.y + 6, 6, 6);
      ctx.fillRect(inv.x + inv.w - 12, inv.y + 6, 6, 6);
    });
  }

  function drawBullets(){
    ctx.fillStyle = '#e5e7eb';
    bullets.forEach(b => ctx.fillRect(b.x, b.y, 3, 10));
    ctx.fillStyle = '#f87171';
    enemyBullets.forEach(b => ctx.fillRect(b.x, b.y, 3, 10));
  }

  function drawPauseOverlay(){
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle = '#fff';
    ctx.font = '24px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Paused - Press P or Pause', W/2, H/2);
  }

  function updatePlayer(){
    player.x += player.vx;
    if(player.x < 10) player.x = 10;
    if(player.x + player.w > W - 10) player.x = W - 10 - player.w;
  }

  function updateBullets(){
    bullets.forEach(b => b.y -= 9);
    enemyBullets.forEach(b => b.y += 5);

    // remove offscreen
    for(let i = bullets.length-1; i>=0; i--){
      if(bullets[i].y < -12) bullets.splice(i,1);
    }
    for(let i = enemyBullets.length-1; i>=0; i--){
      if(enemyBullets[i].y > H+12) enemyBullets.splice(i,1);
    }
  }

  function rectsOverlap(a,b){
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function handleCollisions(){
    // player bullets vs invaders
    for(let i = bullets.length-1; i>=0; i--){
      const b = bullets[i];
      for(let j = 0; j < invaders.length; j++){
        const inv = invaders[j];
        if(!inv.alive) continue;
        if(rectsOverlap({x:b.x-1,y:b.y,w:3,h:10}, inv)){
          inv.alive = false;
          bullets.splice(i,1);
          score += 10;
          updateHUD();
          trackGameEvent && trackGameEvent('enemy_destroyed', { score });
          break;
        }
      }
    }

    // enemy bullets vs player
    for(let i = enemyBullets.length-1; i>=0; i--){
      const b = enemyBullets[i];
      if(rectsOverlap({x:b.x-1,y:b.y,w:3,h:10}, player)){
        enemyBullets.splice(i,1);
        lives -= 1;
        updateHUD();
        if(lives <= 0){
          endGame();
          return;
        }
      }
    }

    // invaders reach the player line
    const lowestInvader = invaders.filter(inv=>inv.alive).reduce((m,inv)=>Math.max(m, inv.y+inv.h), 0);
    if(lowestInvader >= player.y){
      lives = 0;
      endGame();
      return;
    }
  }

  function updateInvaders(){
    let hitEdge = false;
    invaders.forEach(inv => {
      if(!inv.alive) return;
      inv.x += invaderVx;
      if(inv.x <= 10 || inv.x + inv.w >= W - 10){
        hitEdge = true;
      }
    });
    if(hitEdge){
      invaderVx *= -1;
      invaders.forEach(inv => inv.y += invaderVyStep);
    }

    // enemy shooting
    if(invaderShootCooldown > 0) invaderShootCooldown--;
    if(invaderShootCooldown === 0){
      // choose random alive invader to shoot
      const alive = invaders.filter(inv=>inv.alive);
      if(alive.length){
        const shooter = alive[Math.floor(Math.random()*alive.length)];
        enemyBullets.push({x: shooter.x + shooter.w/2, y: shooter.y + shooter.h, vy: 5});
        invaderShootCooldown = Math.max(20, 60 - wave*5);
      }
    }

    // next wave if all dead
    if(invaders.every(inv=>!inv.alive)){
      wave += 1;
      updateHUD();
      const rows = Math.min(5, 2 + wave);
      const cols = Math.min(10, 6 + Math.floor(wave/2));
      invaders = createWave(rows, cols);
      invaderVx = Math.min(4, 1.2 + wave*0.2) * (Math.random()>0.5?1:-1);
      invaderVyStep = Math.min(28, 16 + wave*1);
      trackGameEvent && trackGameEvent('wave_cleared', { score, wave });
    }
  }

  function drawHUD(){
    // handled via DOM
  }

  function updateHUD(){
    const sEl = document.getElementById('score');
    const lEl = document.getElementById('lives');
    const wEl = document.getElementById('level');
    if(sEl) sEl.textContent = `Score: ${score}`;
    if(lEl) lEl.textContent = `Lives: ${lives}`;
    if(wEl) wEl.textContent = `Wave: ${wave}`;
  }

  function endGame(){
    gameOver = true;
    const over = document.getElementById('gameOverScreen');
    const fs = document.getElementById('finalScore');
    const fw = document.getElementById('finalWave');
    if(over){
      over.style.display = 'block';
      if(fs) fs.textContent = String(score);
      if(fw) fw.textContent = String(wave);
    }
    trackGameEvent && trackGameEvent('game_over', { score });
  }

  function restartGame(){
    gameOver = false;
    paused = false;
    score = 0; wave = 1; lives = 3;
    invaders = createWave(3,8);
    invaderVx = 1.2;
    enemyBullets.length = 0;
    bullets.length = 0;
    const over = document.getElementById('gameOverScreen');
    if(over) over.style.display = 'none';
    const pauseBtn = document.getElementById('pauseBtn');
    if(pauseBtn) pauseBtn.textContent = 'Pause';
    updateHUD();
    trackGameEvent && trackGameEvent('restart');
  }
  window.restartGame = restartGame;

  // input
  const keys = {};
  // 控制键集合：左右箭头、A/D、空格、P
  const controlCodes = new Set(['ArrowLeft','ArrowRight','KeyA','KeyD','Space','KeyP']);
  // replace keydown to include pause toggle and shoot guard
  window.addEventListener('keydown', e => {
    // 统一拦截默认滚动/空格下滑
    if (controlCodes.has(e.code)) { if (e.preventDefault) e.preventDefault(); }

    keys[e.code] = true;
    if(e.code === 'KeyP'){
      if(gameOver) return;
      paused = !paused;
      const pb = document.getElementById('pauseBtn');
      if(pb) pb.textContent = paused ? 'Resume' : 'Pause';
      // 统一事件为 pause_toggle 并附带状态对象
      trackGameEvent && trackGameEvent('pause_toggle', { state: paused ? 'paused' : 'resumed' });
    }
    if(e.code === 'Space'){
      if(!gameOver && !paused){
        bullets.push({x: player.x + player.w/2, y: player.y});
        trackGameEvent && trackGameEvent('player_shoot');
      }
    }
  });
  window.addEventListener('keyup', e => {
    if (controlCodes.has(e.code)) { if (e.preventDefault) e.preventDefault(); }
    keys[e.code] = false;
  });

  // Pause button
  const pauseBtn = document.getElementById('pauseBtn');
  if(pauseBtn){
    pauseBtn.addEventListener('click', ()=>{
      if(gameOver) return;
      paused = !paused;
      pauseBtn.textContent = paused ? 'Resume' : 'Pause';
      // 统一事件为 pause_toggle 并附带状态对象
      trackGameEvent && trackGameEvent('pause_toggle', { state: paused ? 'paused' : 'resumed' });
    });
  }

  // Mobile controls
  const btnLeft = document.getElementById('btnLeft');
  const btnRight = document.getElementById('btnRight');
  const btnFire = document.getElementById('btnFire');

  function bindHold(el, onStart, onEnd){
    if(!el) return;
    const start = (e)=>{ onStart(); e.preventDefault && e.preventDefault(); };
    const end = (e)=>{ onEnd(); };
    el.addEventListener('touchstart', start, {passive:false});
    el.addEventListener('touchend', end);
    el.addEventListener('mousedown', start);
    el.addEventListener('mouseup', end);
    el.addEventListener('mouseleave', end);
  }

  bindHold(btnLeft, ()=>{ keys['ArrowLeft'] = true; }, ()=>{ keys['ArrowLeft'] = false; });
  bindHold(btnRight, ()=>{ keys['ArrowRight'] = true; }, ()=>{ keys['ArrowRight'] = false; });
  if(btnFire){
    const shoot = (e)=>{
      if(!gameOver && !paused){
        bullets.push({x: player.x + player.w/2, y: player.y});
        trackGameEvent && trackGameEvent('player_shoot');
      }
      e && e.preventDefault && e.preventDefault();
    };
    btnFire.addEventListener('touchstart', shoot, {passive:false});
    btnFire.addEventListener('click', shoot);
    btnFire.addEventListener('mousedown', shoot);
  }

  // restart btn
  const restartBtn = document.getElementById('restartBtn');
  if(restartBtn){
    restartBtn.addEventListener('click', ()=>{
      restartGame();
      trackGameEvent && trackGameEvent('restart_click');
    });
  }

  function update(){
    if(gameOver || paused) return;
    // move
    player.vx = 0;
    if(keys['ArrowLeft'] || keys['KeyA']) player.vx = -player.speed;
    if(keys['ArrowRight'] || keys['KeyD']) player.vx = player.speed;

    updatePlayer();
    updateBullets();
    updateInvaders();
    handleCollisions();
  }

  function render(){
    ctx.clearRect(0,0,W,H);

    // background starry
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    for(let i=0;i<80;i++){
      const x = (i*73) % W;
      const y = (i*127) % H;
      ctx.fillRect(x, y, 2, 2);
    }

    drawPlayer();
    drawInvaders();
    drawBullets();
    if(paused && !gameOver){
      drawPauseOverlay();
    }
  }

  function loop(){
    update();
    render();
    requestAnimationFrame(loop);
  }

  updateHUD();
  loop();

})();