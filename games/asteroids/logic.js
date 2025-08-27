(function(){
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  let gameOver = false;
  let score = 0;
  let lives = 3;
  let paused = false;

  const ship = {
    x: W/2,
    y: H/2,
    vx: 0,
    vy: 0,
    angle: -Math.PI/2,
    thrusting: false,
    thrust: 0.12,
    friction: 0.99,
    radius: 16
  };

  const bullets = [];
  const asteroids = [];

  function randRange(a,b){return a + Math.random()*(b-a)}

  function createAsteroid(x,y, size=3){
    const speed = randRange(0.5, 2.2);
    const angle = randRange(0, Math.PI*2);
    const radius = size===3? 46 : size===2? 28 : 16;
    return {x,y, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed, angle: randRange(0,Math.PI*2), spin: randRange(-0.02,0.02), size, radius, verts: makePoly(radius)}
  }

  function makePoly(radius){
    const points = 10 + Math.floor(Math.random()*6);
    const arr = [];
    for(let i=0;i<points;i++){
      const ang = (i/points)*Math.PI*2;
      const r = radius * (0.7 + Math.random()*0.6);
      arr.push({x: Math.cos(ang)*r, y: Math.sin(ang)*r});
    }
    return arr;
  }

  function resetGame(){
    gameOver = false; score=0; lives=3;
    ship.x=W/2; ship.y=H/2; ship.vx=0; ship.vy=0; ship.angle=-Math.PI/2;
    bullets.length=0; asteroids.length=0;
    for(let i=0;i<6;i++) spawnAsteroidAwayFromShip();
    updateHUD();
    const over=document.getElementById('gameOverScreen'); if(over) over.style.display='none';
  }
  window.restartGame = function(){
    resetGame();
    paused = false;
    const btn = document.getElementById('pauseBtn');
    if(btn) btn.textContent = 'Pause';
    trackGameEvent && trackGameEvent('restart');
  };

  function spawnAsteroidAwayFromShip(){
    let x, y;
    do{
      x = Math.random()*W; y = Math.random()*H;
    } while(Math.hypot(x-ship.x, y-ship.y) < 140);
    asteroids.push(createAsteroid(x,y, 3));
  }

  function drawShip(){
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ship.radius, 0);
    ctx.lineTo(-ship.radius*0.6, ship.radius*0.6);
    ctx.lineTo(-ship.radius*0.6, -ship.radius*0.6);
    ctx.closePath();
    ctx.stroke();

    if(ship.thrusting){
      ctx.strokeStyle = '#fca5a5';
      ctx.beginPath();
      ctx.moveTo(-ship.radius*0.6, 0);
      ctx.lineTo(-ship.radius*1.2, 6);
      ctx.lineTo(-ship.radius*0.6, 0);
      ctx.lineTo(-ship.radius*1.2, -6);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawAsteroids(){
    ctx.save();
    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 2;
    asteroids.forEach(a=>{
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      ctx.beginPath();
      ctx.moveTo(a.verts[0].x, a.verts[0].y);
      for(let i=1;i<a.verts.length;i++) ctx.lineTo(a.verts[i].x, a.verts[i].y);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    });
    ctx.restore();
  }

  function drawBullets(){
    ctx.fillStyle = '#fde68a';
    bullets.forEach(b=>{
      ctx.beginPath();
      ctx.arc(b.x, b.y, 2, 0, Math.PI*2);
      ctx.fill();
    });
  }

  const keys = {};
  // 控制键集合：方向键、WASD、空格、P
  const controlCodes = new Set(['ArrowUp','ArrowLeft','ArrowRight','KeyW','KeyA','KeyD','Space','KeyP']);
  window.addEventListener('keydown', e=>{
    // 统一拦截默认滚动/空格下滑
    if (controlCodes.has(e.code)) { if (e.preventDefault) e.preventDefault(); }
    // toggle pause by 'P'
    if(e.code === 'KeyP'){
      if(!gameOver){
        paused = !paused;
        const btn = document.getElementById('pauseBtn');
        if(btn) btn.textContent = paused ? 'Resume' : 'Pause';
        // 统一事件为 pause_toggle 并附带状态对象
        trackGameEvent && trackGameEvent('pause_toggle', { state: paused ? 'paused' : 'resumed' });
      }
      return;
    }
    // block inputs while paused or game over
    if(gameOver || paused){ return; }
    if(e.code === 'Space'){
      // shoot
      bullets.push({x: ship.x + Math.cos(ship.angle)*ship.radius, y: ship.y + Math.sin(ship.angle)*ship.radius, vx: Math.cos(ship.angle)*8 + ship.vx, vy: Math.sin(ship.angle)*8 + ship.vy, life: 60});
      trackGameEvent && trackGameEvent('player_shoot');
      return;
    }
    keys[e.code] = true;
  });
  window.addEventListener('keyup', e=>{
    if (controlCodes.has(e.code)) { if (e.preventDefault) e.preventDefault(); }
    keys[e.code] = false;
  });

  const restartBtn = document.getElementById('restartBtn');
  if(restartBtn){
    restartBtn.addEventListener('click', ()=>{
      resetGame();
      paused = false;
      const btn = document.getElementById('pauseBtn');
      if(btn) btn.textContent = 'Pause';
      trackGameEvent && trackGameEvent('restart_click');
    });
  }

  function update(){
    if(gameOver || paused) return;

    // ship control
    ship.thrusting = !!(keys['ArrowUp'] || keys['KeyW']);
    if(keys['ArrowLeft'] || keys['KeyA']) ship.angle -= 0.06;
    if(keys['ArrowRight'] || keys['KeyD']) ship.angle += 0.06;
    if(ship.thrusting){
      ship.vx += Math.cos(ship.angle)*ship.thrust;
      ship.vy += Math.sin(ship.angle)*ship.thrust;
    }else{
      ship.vx *= ship.friction;
      ship.vy *= ship.friction;
    }
    ship.x += ship.vx; ship.y += ship.vy;

    // screen wrap
    if(ship.x < -20) ship.x = W+20; else if(ship.x > W+20) ship.x = -20;
    if(ship.y < -20) ship.y = H+20; else if(ship.y > H+20) ship.y = -20;

    // bullets
    for(let i=bullets.length-1;i>=0;i--){
      const b = bullets[i];
      b.x += b.vx; b.y += b.vy; b.life--;
      if(b.x < -10) b.x = W+10; else if(b.x > W+10) b.x = -10;
      if(b.y < -10) b.y = H+10; else if(b.y > H+10) b.y = -10;
      if(b.life <= 0) bullets.splice(i,1);
    }

    // asteroids
    asteroids.forEach(a=>{
      a.x += a.vx; a.y += a.vy; a.angle += a.spin;
      if(a.x < -60) a.x = W+60; else if(a.x > W+60) a.x = -60;
      if(a.y < -60) a.y = H+60; else if(a.y > H+60) a.y = -60;
    });

    // collisions: bullet vs asteroid
    for(let bi = bullets.length-1; bi>=0; bi--){
      const b = bullets[bi];
      for(let ai = asteroids.length-1; ai>=0; ai--){
        const a = asteroids[ai];
        if(Math.hypot(b.x - a.x, b.y - a.y) < a.radius){
          bullets.splice(bi,1);
          // split asteroid
          if(a.size > 1){
            for(let k=0;k<2;k++){
              const child = createAsteroid(a.x, a.y, a.size-1);
              child.vx += randRange(-0.6,0.6);
              child.vy += randRange(-0.6,0.6);
              asteroids.push(child);
            }
          }
          score += (a.size===3?20:a.size===2?50:100);
          updateHUD();
          trackGameEvent && trackGameEvent('asteroid_destroyed', { score });
          asteroids.splice(ai,1);
          break;
        }
      }
    }

    // collisions: asteroid vs ship
    for(let ai = asteroids.length-1; ai>=0; ai--){
      const a = asteroids[ai];
      if(Math.hypot(ship.x - a.x, ship.y - a.y) < a.radius + ship.radius*0.7){
        lives -= 1; updateHUD();
        trackGameEvent && trackGameEvent('ship_hit', { score });
        // respawn ship in center with brief invuln by moving it away
        ship.x=W/2; ship.y=H/2; ship.vx=0; ship.vy=0; ship.angle=-Math.PI/2;
        if(lives <= 0){
          endGame();
          return;
        }
        break;
      }
    }

    // ensure some asteroids on screen
    if(asteroids.length < 5){
      spawnAsteroidAwayFromShip();
    }
  }

  function render(){
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0,0,W,H);

    // stars
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    for(let i=0;i<100;i++) ctx.fillRect((i*53)%W, (i*97)%H, 2, 2);

    drawShip();
    drawAsteroids();
    drawBullets();
  }

  function updateHUD(){
    const s = document.getElementById('score');
    const l = document.getElementById('lives');
    if(s) s.textContent = `Score: ${score}`;
    if(l) l.textContent = `Lives: ${lives}`;
  }

  function endGame(){
    gameOver = true;
    const over = document.getElementById('gameOverScreen');
    const fs = document.getElementById('finalScore');
    if(over){
      over.style.display = 'block';
      if(fs) fs.textContent = String(score);
    }
    trackGameEvent && trackGameEvent('game_over', { score });
  }

  function loop(){
    if(!gameOver){
      if(!paused){
        update();
        render();
      }else{
        // draw paused overlay without updating state
        render();
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(0,0,W,H);
        ctx.fillStyle = '#e5e7eb';
        ctx.font = '20px system-ui, -apple-system, Segoe UI, Roboto, Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Paused - press P or tap Resume', W/2, H/2);
      }
    }
    requestAnimationFrame(loop);
  }

  // init
  for(let i=0;i<6;i++) spawnAsteroidAwayFromShip();
  updateHUD();
  loop();
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
  
  // Mobile controls: Left / Thrust / Shoot / Right
  const btnLeft = document.getElementById('btn-left');
  const btnRight = document.getElementById('btn-right');
  const btnThrust = document.getElementById('btn-thrust');
  const btnShoot = document.getElementById('btn-shoot');
  
  function setKey(code, pressed){
    if(gameOver || paused) return;
    keys[code] = pressed;
  }
  
  if(btnLeft){
    btnLeft.addEventListener('touchstart', e=>{ e.preventDefault(); setKey('ArrowLeft', true); });
    btnLeft.addEventListener('touchend', e=>{ e.preventDefault(); setKey('ArrowLeft', false); });
    btnLeft.addEventListener('mousedown', ()=> setKey('ArrowLeft', true));
    btnLeft.addEventListener('mouseup', ()=> setKey('ArrowLeft', false));
    btnLeft.addEventListener('mouseleave', ()=> setKey('ArrowLeft', false));
  }
  if(btnRight){
    btnRight.addEventListener('touchstart', e=>{ e.preventDefault(); setKey('ArrowRight', true); });
    btnRight.addEventListener('touchend', e=>{ e.preventDefault(); setKey('ArrowRight', false); });
    btnRight.addEventListener('mousedown', ()=> setKey('ArrowRight', true));
    btnRight.addEventListener('mouseup', ()=> setKey('ArrowRight', false));
    btnRight.addEventListener('mouseleave', ()=> setKey('ArrowRight', false));
  }
  if(btnThrust){
    btnThrust.addEventListener('touchstart', e=>{ e.preventDefault(); setKey('ArrowUp', true); });
    btnThrust.addEventListener('touchend', e=>{ e.preventDefault(); setKey('ArrowUp', false); });
    btnThrust.addEventListener('mousedown', ()=> setKey('ArrowUp', true));
    btnThrust.addEventListener('mouseup', ()=> setKey('ArrowUp', false));
    btnThrust.addEventListener('mouseleave', ()=> setKey('ArrowUp', false));
  }
  if(btnShoot){
    const shoot = ()=>{
      if(gameOver || paused) return;
      bullets.push({x: ship.x + Math.cos(ship.angle)*ship.radius, y: ship.y + Math.sin(ship.angle)*ship.radius, vx: Math.cos(ship.angle)*8 + ship.vx, vy: Math.sin(ship.angle)*8 + ship.vy, life: 60});
      trackGameEvent && trackGameEvent('player_shoot');
    }
    btnShoot.addEventListener('touchstart', e=>{ e.preventDefault(); shoot(); });
    btnShoot.addEventListener('click', ()=> shoot());
  }
})();