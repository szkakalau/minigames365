(function(){
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  // Camera state (angle around player)
  let cameraAngle = 0; // radians
  let cameraDistance = 140;

  // Player state
  const player = {
    x: W/2,
    y: H/2,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    speed: 2.2,
    radius: 12,
    onGround: true,
    color: '#4ade80'
  };

  // Input state
  const keys = {};
  let mouseX = W/2;

  // Arena and enemies
  const arena = { x: W/2, y: H/2, radius: 200 };
  let enemies = [];
  let spawnTimer = 0;
  let score = 0;
  let best = Number(localStorage.getItem('rumble-rush_best') || 0);
  let hp = 100;
  let running = true;

  function init(){
    enemies = [];
    spawnTimer = 0;
    score = 0;
    hp = 100;
    player.x = W/2; player.y = H/2; player.z = 0; player.vx = player.vy = player.vz = 0; player.onGround = true;
    running = true;
    document.getElementById('score').textContent = 'Score: ' + score;
    document.getElementById('best').textContent = 'Best: ' + best;
    document.getElementById('health').textContent = 'HP: ' + hp;
    track('game_start');
    loop();
  }

  function loop(){
    if (!running) return;
    update();
    draw();
    requestAnimationFrame(loop);
  }

  function worldToScreen(wx, wy, wz){
    // Simple 2.5D projection using cameraAngle and fake depth
    const dx = wx - player.x;
    const dy = wy - player.y;
    const cos = Math.cos(cameraAngle), sin = Math.sin(cameraAngle);
    const cx = dx * cos - dy * sin;
    const cy = dx * sin + dy * cos;
    const depth = 1 + (wz*0.003) + (cy*0.002);
    const sx = W/2 + cx * 1.0;
    const sy = H/2 + (-wz * 0.6) + (-cy * 0.15);
    return {x: sx, y: sy, scale: Math.max(0.6, 1 - (depth-1)*0.5)};
  }

  function update(){
    // camera angle follows mouse horizontally
    const centerX = W/2; const delta = (mouseX - centerX);
    cameraAngle += delta * 0.0008; // sensitivity

    // movement input (relative to camera)
    const forward = (keys['KeyW']||keys['ArrowUp']) ? 1 : 0;
    const back = (keys['KeyS']||keys['ArrowDown']) ? 1 : 0;
    const left = (keys['KeyA']||keys['ArrowLeft']) ? 1 : 0;
    const right = (keys['KeyD']||keys['ArrowRight']) ? 1 : 0;
    let mx = right - left;
    let my = forward - back;
    if (mx !== 0 || my !== 0){
      const len = Math.hypot(mx,my); mx/=len; my/=len;
      // rotate by camera angle
      const cos = Math.cos(cameraAngle), sin = Math.sin(cameraAngle);
      const vx = mx * cos + my * sin;
      const vy = -mx * sin + my * cos;
      player.vx = vx * player.speed;
      player.vy = vy * player.speed;
    } else {
      player.vx *= 0.85; player.vy *= 0.85;
    }

    // jumping
    if (!player.onGround){
      player.vz -= 0.45; // gravity
      if (player.z + player.vz <= 0){
        player.z = 0; player.vz = 0; player.onGround = true;
      } else {
        player.z += player.vz;
      }
    }

    player.x += player.vx;
    player.y += player.vy;

    // keep inside arena circle
    const dx = player.x - arena.x; const dy = player.y - arena.y;
    const dist = Math.hypot(dx,dy);
    if (dist > arena.radius - player.radius){
      const nx = dx / dist; const ny = dy / dist;
      player.x = arena.x + nx * (arena.radius - player.radius);
      player.y = arena.y + ny * (arena.radius - player.radius);
      // slight bounce
      player.vx *= -0.2; player.vy *= -0.2;
    }

    // spawn enemies
    spawnTimer -= 1;
    if (spawnTimer <= 0){
      spawnTimer = Math.max(20, 80 - Math.floor(score/10));
      const angle = Math.random()*Math.PI*2;
      const r = arena.radius - 14;
      enemies.push({
        x: arena.x + Math.cos(angle)*r,
        y: arena.y + Math.sin(angle)*r,
        z: 0,
        radius: 10 + Math.random()*6,
        speed: 1.4 + Math.random()*0.8,
        color: '#f59e0b'
      });
    }

    // update enemies: seek player
    enemies.forEach(e => {
      const ex = player.x - e.x; const ey = player.y - e.y;
      const len = Math.hypot(ex,ey) || 1;
      e.x += (ex/len) * e.speed;
      e.y += (ey/len) * e.speed;
    });

    // collisions
    for (let i=0;i<enemies.length;i++){
      const e = enemies[i];
      const ddx = e.x - player.x; const ddy = e.y - player.y;
      const d = Math.hypot(ddx,ddy);
      if (d < e.radius + player.radius){
        const damage = player.onGround ? 12 : 6; // jumping reduces damage
        hp -= damage;
        document.getElementById('health').textContent = 'HP: ' + Math.max(0, hp);
        // knockback
        const nx = ddx/(d||1), ny = ddy/(d||1);
        player.x -= nx * 8; player.y -= ny * 8;
        enemies.splice(i,1); i--;
        if (hp <= 0){ gameOver(); return; }
      }
    }

    // scoring over time
    score += 1;
    if (score % 10 === 0){
      document.getElementById('score').textContent = 'Score: ' + score;
    }
  }

  function draw(){
    // background grid
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0,0,W,H);

    // arena ring
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(arena.x, arena.y, arena.radius, 0, Math.PI*2);
    ctx.stroke();

    // draw enemies (with simple pseudo-3D)
    enemies.forEach(e => {
      const s = worldToScreen(e.x, e.y, e.z);
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, e.radius * s.scale, 0, Math.PI*2);
      ctx.fill();
    });

    // player shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(player.x, player.y + 10, player.radius*0.8, player.radius*0.4, 0, 0, Math.PI*2);
    ctx.fill();

    // player
    const p = worldToScreen(player.x, player.y, player.z);
    const pr = player.radius * p.scale;
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, pr, 0, Math.PI*2);
    ctx.fill();

    // HUD text (best)
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Best: ' + best, W - 12, 24);
  }

  function gameOver(){
    running = false;
    best = Math.max(best, score);
    localStorage.setItem('rumble-rush_best', String(best));
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOverScreen').style.display = 'block';
    track('game_end', score);
  }

  function restartGame(){
    document.getElementById('gameOverScreen').style.display = 'none';
    init();
  }

  // Input events
  window.addEventListener('keydown', (e)=>{
    keys[e.code] = true;
    if ((e.code === 'Space' || e.key === ' ') && player.onGround){
      player.vz = 7.5; player.onGround = false;
    }
  });
  window.addEventListener('keyup', (e)=>{ keys[e.code] = false; });
  canvas.addEventListener('mousemove', (e)=>{
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
  });
  canvas.addEventListener('touchmove', (e)=>{
    const t = e.touches[0]; if (!t) return;
    const rect = canvas.getBoundingClientRect();
    mouseX = t.clientX - rect.left;
  }, {passive:true});

  // Expose restart for button
  window.restartGame = restartGame;

  function track(action, score){ if (typeof window.trackGameEvent === 'function') window.trackGameEvent(action, score); }

  init();
})();