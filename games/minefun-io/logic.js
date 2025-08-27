(function(){
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  // Controls DOM
  const pauseBtn = document.getElementById('pauseBtn');
  const btnUp = document.getElementById('btnUp');
  const btnDown = document.getElementById('btnDown');
  const btnLeft = document.getElementById('btnLeft');
  const btnRight = document.getElementById('btnRight');
  const btnJump = document.getElementById('btnJump');
  const btnCrouch = document.getElementById('btnCrouch');
  const btnMine = document.getElementById('btnMine');

  // World grid
  const TILE = 24;
  const COLS = Math.floor(W / TILE);
  const ROWS = Math.floor(H / TILE);
  const world = Array.from({length: ROWS}, (_,y)=>Array.from({length: COLS}, (_,x)=>{
    const horizon = 8;
    if (y < horizon - Math.floor(Math.random()*2)) return 0; // air
    if (Math.random() < 0.06 && y > horizon+3) return 3; // ore
    return 1; // dirt
  }));

  // Player
  const player = { x: TILE*4, y: TILE*4, vx:0, vy:0, w:16, h:24, onGround:false, crouch:false, hp:100 };
  let mined = 0;
  let best = Number(localStorage.getItem('minefun-io_best') || 0);
  const keys = {};
  let paused = false;
  let gameOver = false;

  function init(){
    mined = 0; player.x = TILE*4; player.y = TILE*4; player.vx=player.vy=0; player.onGround=false; player.crouch=false; player.hp=100;
    paused = false; gameOver = false; if (pauseBtn) pauseBtn.textContent = 'Pause';
    updateHUD();
    loop();
    track('game_start');
  }

  function updateHUD(){
    document.getElementById('score').textContent = 'Blocks: ' + mined;
    document.getElementById('best').textContent = 'Best: ' + best;
    document.getElementById('health').textContent = 'HP: ' + player.hp;
  }

  function tileAt(px, py){
    const cx = Math.floor(px / TILE), cy = Math.floor(py / TILE);
    if (cy<0||cy>=ROWS||cx<0||cx>=COLS) return 2; // treat out of bounds as solid rock
    return world[cy][cx];
  }

  function setTile(px, py, v){
    const cx = Math.floor(px / TILE), cy = Math.floor(py / TILE);
    if (cy<0||cy>=ROWS||cx<0||cx>=COLS) return;
    world[cy][cx] = v;
  }

  function loop(){
    update();
    draw();
    if (paused && !gameOver) drawPauseOverlay();
    requestAnimationFrame(loop);
  }

  function update(){
    if (paused || gameOver) return;
    // movement
    const left = keys['KeyA']||keys['ArrowLeft'];
    const right = keys['KeyD']||keys['ArrowRight'];
    const up = keys['KeyW']||keys['ArrowUp'];
    const down = keys['KeyS']||keys['ArrowDown'];

    player.crouch = !!keys['KeyC'];
    const speed = player.crouch ? 1.2 : 2.0;
    if (left) player.vx = -speed; else if (right) player.vx = speed; else player.vx *= 0.7;

    // gravity & jump
    player.vy += 0.5; if (player.vy > 8) player.vy = 8;
    if ((keys['Space'] || keys['Spacebar']) && player.onGround){ player.vy = -7.2; player.onGround = false; }

    // Apply movement with collision
    moveAndCollide(player.vx, 0);
    moveAndCollide(0, player.vy);

    // danger: suffocation if inside block
    if (isSolidAt(player.x, player.y) || isSolidAt(player.x+player.w, player.y) || isSolidAt(player.x, player.y+player.h) || isSolidAt(player.x+player.w, player.y+player.h)){
      player.hp -= 0.4; if (player.hp <= 0) end();
      updateHUD();
    }
  }

  function drawPauseOverlay(){
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 28px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    ctx.fillText('Paused', W/2, H/2);
    ctx.font = '14px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    ctx.fillText('Press P or tap Resume', W/2, H/2 + 28);
  }

  function isSolid(tile){ return tile===1 || tile===2 || tile===3; }
  function isSolidAt(px, py){ return isSolid(tileAt(px, py)); }

  function moveAndCollide(dx, dy){
    if (dx !== 0){
      player.x += dx;
      if (collides()){
        while (collides()) player.x -= Math.sign(dx)*0.5;
        player.vx = 0;
      }
    }
    if (dy !== 0){
      player.y += dy;
      if (collides()){
        while (collides()) player.y -= Math.sign(dy)*0.5;
        if (dy>0) player.onGround = true; else player.onGround = false;
        player.vy = 0;
      } else {
        if (dy>0) player.onGround = false;
      }
    }
  }

  function collides(){
    return (
      isSolidAt(player.x, player.y) ||
      isSolidAt(player.x+player.w, player.y) ||
      isSolidAt(player.x, player.y+player.h) ||
      isSolidAt(player.x+player.w, player.y+player.h)
    );
  }

  function draw(){
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,W,H);

    // draw tiles
    for (let y=0;y<ROWS;y++){
      for(let x=0;x<COLS;x++){
        const t = world[y][x]; if (!t) continue;
        const px = x*TILE, py = y*TILE;
        if (t===1){ ctx.fillStyle = '#374151'; ctx.fillRect(px,py,TILE,TILE); }
        else if (t===2){ ctx.fillStyle = '#1f2937'; ctx.fillRect(px,py,TILE,TILE); }
        else if (t===3){ ctx.fillStyle = '#fbbf24'; ctx.fillRect(px,py,TILE,TILE); }
        ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.strokeRect(px+0.5,py+0.5,TILE-1,TILE-1);
      }
    }

    // player
    ctx.fillStyle = '#22d3ee';
    const ph = player.crouch ? player.h*0.7 : player.h;
    ctx.fillRect(player.x, player.y + (player.h-ph), player.w, ph);

    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Best: ' + best, W-12, 22);
  }

  function end(){
    gameOver = true;
    best = Math.max(best, mined);
    localStorage.setItem('minefun-io_best', String(best));
    document.getElementById('finalBlocks').textContent = mined;
    document.getElementById('gameOverScreen').style.display = 'block';
    // 标准化事件名与参数
    track('game_over', { score: mined });
  }

  function restartGame(){
    document.getElementById('gameOverScreen').style.display = 'none';
    // 重开打点
    track('restart');
    init();
  }

  // Mining
  function mineAtClientXY(clientX, clientY){
    const rect = canvas.getBoundingClientRect();
    const mx = (clientX - rect.left) * (canvas.width / rect.width);
    const my = (clientY - rect.top) * (canvas.height / rect.height);
    const tx = Math.floor(mx / TILE), ty = Math.floor(my / TILE);
    const px = Math.floor(player.x / TILE), py = Math.floor(player.y / TILE);
    if (Math.abs(tx - px) <= 1 && Math.abs(ty - py) <= 2){
      const t = world[ty] && world[ty][tx];
      if (t && t !== 0){
        world[ty][tx] = 0; mined += (t===3?3:1); updateHUD();
      }
    }
  }

  canvas.addEventListener('mousedown', (e)=>{ if (paused||gameOver) return; mineAtClientXY(e.clientX, e.clientY); });
  canvas.addEventListener('touchstart', (e)=>{ if (paused||gameOver) return; if (!e.touches||e.touches.length===0) return; e.preventDefault(); mineAtClientXY(e.touches[0].clientX, e.touches[0].clientY); }, { passive:false });

  // Keyboard
  window.addEventListener('keydown', (e)=>{ 
    const code = e.code;
    const shouldBlockDefault = (
      code === 'ArrowUp' || code === 'ArrowDown' || code === 'ArrowLeft' || code === 'ArrowRight' ||
      code === 'Space' || code === 'Spacebar' || code === 'KeyP' || code === 'KeyR'
    );
    if (shouldBlockDefault) e.preventDefault();

    if (code === 'KeyP'){ if (!gameOver) togglePause(); return; }
    // 如果处于暂停或已结束，仍要拦截这些键避免页面滚动
    if (paused || gameOver) return;
    keys[code] = true; if (code==='KeyR') { restartGame(); return; }
  });
  // 在 keyup 上也阻止默认行为，避免在移动端/某些浏览器中滚动
  window.addEventListener('keyup', (e)=>{
    const code = e.code;
    const intercept = new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Spacebar','KeyW','KeyA','KeyS','KeyD','KeyP','KeyR']);
    if (intercept.has(code)) e.preventDefault();
    keys[code] = false;
  });

  // Pause toggle
  function togglePause(){
    if (gameOver) return;
    paused = !paused; if (pauseBtn) pauseBtn.textContent = paused ? 'Resume' : 'Pause';
    // 统一为 { state: 'paused' | 'resumed' }
    track('pause_toggle', { state: paused ? 'paused' : 'resumed' });
  }
  if (pauseBtn){ pauseBtn.addEventListener('click', togglePause); }

  // Bind restart button in HUD
  const restartBtn = document.getElementById('restartBtn');
  if (restartBtn){ restartBtn.addEventListener('click', restartGame); }

  // Mobile directional controls: press-hold to set key flags
  const hold = (el, code) => {
    if (!el) return;
    el.addEventListener('touchstart', (e)=>{ e.preventDefault(); if (!paused && !gameOver) keys[code] = true; }, { passive:false });
    el.addEventListener('touchend',   (e)=>{ e.preventDefault(); keys[code] = false; }, { passive:false });
    el.addEventListener('mousedown',  (e)=>{ e.preventDefault(); if (!paused && !gameOver) keys[code] = true; });
  };
  const releaseOnDoc = (code) => {
    document.addEventListener('mouseup', ()=>{ keys[code] = false; });
    document.addEventListener('touchend', ()=>{ keys[code] = false; }, { passive:true });
  };

  hold(btnLeft, 'KeyA'); releaseOnDoc('KeyA');
  hold(btnRight,'KeyD'); releaseOnDoc('KeyD');
  hold(btnUp,   'ArrowUp'); releaseOnDoc('ArrowUp');
  hold(btnDown, 'ArrowDown'); releaseOnDoc('ArrowDown');
  if (btnJump){
    btnJump.addEventListener('click', ()=>{ if (!paused && !gameOver && player.onGround){ keys['Space'] = true; setTimeout(()=>{ keys['Space']=false; }, 80); }});
    btnJump.addEventListener('touchstart', (e)=>{ e.preventDefault(); if (!paused && !gameOver && player.onGround){ keys['Space']=true; setTimeout(()=>{ keys['Space']=false; }, 80); }}, { passive:false });
  }
  if (btnCrouch){
    hold(btnCrouch, 'KeyC'); releaseOnDoc('KeyC');
  }
  if (btnMine){
    btnMine.addEventListener('click', ()=>{ if (!paused && !gameOver) mineAtClientXY(canvas.getBoundingClientRect().left + canvas.width/2, canvas.getBoundingClientRect().top + canvas.height/2); });
  }

  window.restartGame = restartGame;
  // 统一 track 签名，兼容数字 score
  function track(action, extras){ 
    if (typeof window.trackGameEvent !== 'function') return;
    if (typeof extras === 'number') { window.trackGameEvent(action, { score: extras }); }
    else { window.trackGameEvent(action, extras || {}); }
  }

  init();
})();