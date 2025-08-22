(function(){
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  // World grid
  const TILE = 24;
  const COLS = Math.floor(W / TILE);
  const ROWS = Math.floor(H / TILE);
  const world = Array.from({length: ROWS}, (_,y)=>Array.from({length: COLS}, (_,x)=>{
    // Simple terrain: sky above horizon, dirt below; sprinkle ores
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

  function init(){
    mined = 0; player.x = TILE*4; player.y = TILE*4; player.vx=player.vy=0; player.onGround=false; player.crouch=false; player.hp=100;
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
    requestAnimationFrame(loop);
  }

  function update(){
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
        // grid lines
        ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.strokeRect(px+0.5,py+0.5,TILE-1,TILE-1);
      }
    }

    // player
    ctx.fillStyle = '#22d3ee';
    const ph = player.crouch ? player.h*0.7 : player.h;
    ctx.fillRect(player.x, player.y + (player.h-ph), player.w, ph);

    // HUD overlay minimal
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Best: ' + best, W-12, 22);
  }

  function end(){
    best = Math.max(best, mined);
    localStorage.setItem('minefun-io_best', String(best));
    document.getElementById('finalBlocks').textContent = mined;
    document.getElementById('gameOverScreen').style.display = 'block';
    track('game_end', mined);
  }

  function restartGame(){
    document.getElementById('gameOverScreen').style.display = 'none';
    init();
  }

  // Mining with mouse
  canvas.addEventListener('mousedown', (e)=>{
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const tx = Math.floor(mx / TILE), ty = Math.floor(my / TILE);
    // only allow mining adjacent tiles
    const px = Math.floor(player.x / TILE), py = Math.floor(player.y / TILE);
    if (Math.abs(tx - px) <= 1 && Math.abs(ty - py) <= 2){
      const t = world[ty] && world[ty][tx];
      if (t && t !== 0){
        world[ty][tx] = 0; mined += (t===3?3:1); updateHUD();
      }
    }
  });

  window.addEventListener('keydown', (e)=>{ keys[e.code] = true; if (e.code==='KeyR') restartGame(); });
  window.addEventListener('keyup', (e)=>{ keys[e.code] = false; });

  window.restartGame = restartGame;
  function track(action, score){ if (typeof window.trackGameEvent === 'function') window.trackGameEvent(action, score); }

  init();
})();