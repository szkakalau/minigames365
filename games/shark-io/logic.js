(function(){
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  // Player (shark)
  const shark = {
    x: W/2, y: H/2, vx: 0, vy: 0, angle: 0,
    speed: 2.2, maxSpeed: 3.2, radius: 16,
    hp: 100, dashing: false, dashTime: 0, dashCooldown: 0
  };

  // Input
  const keys = {};
  let mouse = {x: W/2, y: H/2, down: false};

  // Enemies
  let enemies = [];
  let spawnTimer = 0;

  // Score
  let score = 0;
  let best = Number(localStorage.getItem('shark-io_best') || 0);
  let running = true;
  let paused = false;

  function init(){
    shark.x = W/2; shark.y = H/2; shark.vx = shark.vy = 0; shark.hp = 100;
    shark.dashing = false; shark.dashTime = 0; shark.dashCooldown = 0;
    enemies = []; spawnTimer = 0; score = 0; running = true;
    paused = false;
    const pb = document.getElementById('pauseBtn'); if (pb) pb.textContent = 'Pause';
    updateHUD();
    track('game_start');
    loop();
  }
  function updateHUD(){
    document.getElementById('score').textContent = 'Score: ' + score;
    document.getElementById('best').textContent = 'Best: ' + best;
    document.getElementById('health').textContent = 'HP: ' + Math.max(0, Math.round(shark.hp));
  }

  function loop(){
    if (!running) return;
    if (!paused) update();
    draw();
    requestAnimationFrame(loop);
  }

  function update(){
    // Movement: WASD/Arrows or mouse steering
    const up = keys['KeyW']||keys['ArrowUp'];
    const down = keys['KeyS']||keys['ArrowDown'];
    const left = keys['KeyA']||keys['ArrowLeft'];
    const right = keys['KeyD']||keys['ArrowRight'];

    let ax = 0, ay = 0;
    if (left) ax -= 1; if (right) ax += 1; if (up) ay -= 1; if (down) ay += 1;
    if (ax !== 0 || ay !== 0){
      const len = Math.hypot(ax, ay); ax/=len; ay/=len;
      shark.vx += ax * 0.4; shark.vy += ay * 0.4;
    }

    // Mouse steering adds attraction towards cursor
    const mx = mouse.x - shark.x; const my = mouse.y - shark.y;
    const md = Math.hypot(mx,my) || 1;
    const toward = {x: mx/md, y: my/md};
    shark.vx += toward.x * 0.08; shark.vy += toward.y * 0.08;

    // Natural drag (water)
    const drag = shark.dashing ? 0.98 : 0.95;
    shark.vx *= drag; shark.vy *= drag;

    // Clamp speed
    const sp = Math.hypot(shark.vx, shark.vy);
    const maxSp = shark.dashing ? shark.maxSpeed*1.8 : shark.maxSpeed;
    if (sp > maxSp){ shark.vx = shark.vx/sp * maxSp; shark.vy = shark.vy/sp * maxSp; }

    // Position update
    shark.x += shark.vx; shark.y += shark.vy;

    // Boundaries (soft wrap with bounce)
    if (shark.x < shark.radius){ shark.x = shark.radius; shark.vx *= -0.6; }
    if (shark.x > W - shark.radius){ shark.x = W - shark.radius; shark.vx *= -0.6; }
    if (shark.y < shark.radius){ shark.y = shark.radius; shark.vy *= -0.6; }
    if (shark.y > H - shark.radius){ shark.y = H - shark.radius; shark.vy *= -0.6; }

    // Aim angle based on velocity or mouse
    shark.angle = (sp > 0.5) ? Math.atan2(shark.vy, shark.vx) : Math.atan2(my, mx);

    // Dash controls (Space or Mouse Left)
    if ((keys['Space'] || mouse.down) && !shark.dashing && shark.dashCooldown <= 0){
      shark.dashing = true; shark.dashTime = 14; shark.dashCooldown = 45;
      // burst forward
      const boost = 4.0;
      shark.vx += Math.cos(shark.angle) * boost; shark.vy += Math.sin(shark.angle) * boost;
    }
    if (shark.dashing){
      shark.dashTime -= 1; if (shark.dashTime <= 0){ shark.dashing = false; }
    } else if (shark.dashCooldown > 0){ shark.dashCooldown -= 1; }

    // Spawn enemies
    spawnTimer -= 1;
    if (spawnTimer <= 0){
      spawnTimer = Math.max(25, 70 - Math.floor(score/5));
      const side = Math.floor(Math.random()*4);
      const margin = 20;
      let ex = 0, ey = 0;
      if (side===0){ ex = -margin; ey = Math.random()*H; }
      else if (side===1){ ex = W+margin; ey = Math.random()*H; }
      else if (side===2){ ex = Math.random()*W; ey = -margin; }
      else { ex = Math.random()*W; ey = H+margin; }
      const speed = 1.2 + Math.random()*0.8;
      enemies.push({ x: ex, y: ey, vx: 0, vy: 0, speed, radius: 12+Math.random()*6, color: '#94a3b8' });
    }

    // Enemies seek shark
    enemies.forEach(e => {
      const dx = shark.x - e.x; const dy = shark.y - e.y; const d = Math.hypot(dx,dy) || 1;
      e.vx += (dx/d) * 0.06; e.vy += (dy/d) * 0.06;
      const sp = Math.hypot(e.vx, e.vy) || 1;
      const cap = e.speed; if (sp > cap){ e.vx = e.vx/sp*cap; e.vy = e.vy/sp*cap; }
      e.x += e.vx; e.y += e.vy;
    });

    // Collisions with horn damage when dashing
    for (let i=0;i<enemies.length;i++){
      const e = enemies[i];
      const dx = e.x - shark.x; const dy = e.y - shark.y; const d = Math.hypot(dx,dy);
      if (d < e.radius + shark.radius){
        if (shark.dashing){
          // Check if collision is in front (within 80 degrees of heading)
          const angToEnemy = Math.atan2(dy, dx);
          let diff = normalizeAngle(angToEnemy - shark.angle);
          if (Math.abs(diff) < Math.PI*0.44){
            // Kill enemy
            enemies.splice(i,1); i--;
            score += 5; updateHUD();
            // slight heal reward
            shark.hp = Math.min(100, shark.hp + 3);
            continue;
          }
        }
        // Otherwise shark takes damage and knockback
        shark.hp -= 10; updateHUD();
        const nx = dx/(d||1), ny = dy/(d||1);
        shark.vx -= nx * 4; shark.vy -= ny * 4;
        if (shark.hp <= 0){ gameOver(); return; }
      }
    }

    // Passive scoring over time
    if ((performance.now()|0) % 20 === 0){ score += 1; updateHUD(); }
  }

  function draw(){
    // Ocean background with light rays
    ctx.fillStyle = '#05223a'; ctx.fillRect(0,0,W,H);
    const grad = ctx.createLinearGradient(0,0,0,H);
    grad.addColorStop(0,'rgba(59,130,246,0.10)');
    grad.addColorStop(1,'rgba(2,132,199,0.05)');
    ctx.fillStyle = grad; ctx.fillRect(0,0,W,H);

    // caustics lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    for (let i=0;i<6;i++){
      ctx.beginPath();
      const y = (i+1) * (H/7);
      ctx.moveTo(0,y);
      for (let x=0; x<=W; x+=80){
        const ny = y + Math.sin((x*0.02) + i) * 6;
        ctx.lineTo(x, ny);
      }
      ctx.stroke();
    }

    // Draw enemies
    enemies.forEach(e => {
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI*2);
      ctx.fill();
    });

    // Draw shark (triangle body with horn)
    ctx.save();
    ctx.translate(shark.x, shark.y);
    ctx.rotate(shark.angle);
    // body
    ctx.fillStyle = shark.dashing ? '#38bdf8' : '#22d3ee';
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(-16, 10);
    ctx.lineTo(-12, 0);
    ctx.lineTo(-16, -10);
    ctx.closePath();
    ctx.fill();
    // horn
    ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(20,0); ctx.lineTo(28,0); ctx.stroke();
    ctx.restore();

    // Best overlay
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Best: ' + best, W-12, 22);

    // Cooldown bar
    const barW = 120, barH = 8;
    const cd = Math.max(0, shark.dashCooldown);
    const ratio = 1 - Math.min(1, cd/45);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(12, 12, barW, barH);
    ctx.fillStyle = '#34d399';
    ctx.fillRect(12, 12, barW * ratio, barH);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.strokeRect(12.5, 12.5, barW-1, barH-1);

    // Pause overlay
    if (paused){
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Paused', W/2, H/2);
      ctx.font = '14px system-ui, -apple-system, sans-serif';
      ctx.fillText('Press P or tap Pause to resume', W/2, H/2 + 26);
    }
  }

  function normalizeAngle(a){
    while (a > Math.PI) a -= Math.PI*2;
    while (a < -Math.PI) a += Math.PI*2;
    return a;
  }

  function gameOver(){
    running = false;
    best = Math.max(best, score);
    localStorage.setItem('shark-io_best', String(best));
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOverScreen').style.display = 'block';
    track('game_end', score);
  }
  function restartGame(){
    document.getElementById('gameOverScreen').style.display = 'none';
    paused = false; const pb2 = document.getElementById('pauseBtn'); if (pb2) pb2.textContent = 'Pause';
    init();
  }

  // Inputs
  window.addEventListener('keydown', (e)=>{
    const code = e.code;
    const key = (e.key || '').toLowerCase();
    const isArrow = code.startsWith('Arrow');
    const isWASD = code === 'KeyW' || code === 'KeyA' || code === 'KeyS' || code === 'KeyD';
    const isSpace = code === 'Space' || key === ' ';
    const isP = code === 'KeyP' || key === 'p';
    if (isArrow || isWASD || isSpace || isP) { e.preventDefault(); }
    if (isP) { if (!running) return; togglePause(); return; }
    if (paused) return;
    keys[code] = true;
  });
  window.addEventListener('keyup', (e)=>{
    const code = e.code;
    const key = (e.key || '').toLowerCase();
    const isArrow = code.startsWith('Arrow');
    const isWASD = code === 'KeyW' || code === 'KeyA' || code === 'KeyS' || code === 'KeyD';
    const isSpace = code === 'Space' || key === ' ';
    if (isArrow || isWASD || isSpace) { e.preventDefault(); }
    keys[code] = false;
  });
   canvas.addEventListener('mousemove', (e)=>{
     if (paused) { e.preventDefault(); return; }
     const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
   });
   canvas.addEventListener('mousedown', (e)=>{ if (paused) { e.preventDefault(); return; } mouse.down = true; });
   window.addEventListener('mouseup', ()=>{ mouse.down = false; });

  // Pause button wiring
  const pauseBtn = document.getElementById('pauseBtn');
  function togglePause(){
    if (!running) return;
    paused = !paused;
    if (!paused){
      // resume timestamp-sensitive stuff if needed
    }
    if (pauseBtn) pauseBtn.textContent = paused ? 'Resume' : 'Pause';
    // standardized pause tracking with 1/0 state
    if (typeof window.trackGameEvent === 'function') {
      window.trackGameEvent('pause_toggle', { state: paused ? 1 : 0 });
    }
  }
  if (pauseBtn){ pauseBtn.addEventListener('click', togglePause); }
 document.getElementById('restartBtn').addEventListener('click', restartGame);
  window.restartGame = restartGame;

   // Mobile onboarding overlay (only on first visit)
   function showMobileOnboarding(){
     const isMobile = /Mobi|Android/i.test(navigator.userAgent);
     if (!isMobile) return;
     if (localStorage.getItem('shark-io_onboarded') === '1') return;
     const root = document.getElementById('game-root');
     if (!root) return;
     const tip = document.createElement('div');
     tip.id = 'mobileOnboarding';
     tip.style = 'position:absolute;inset:0;background:rgba(0,0,0,0.78);color:#fff;display:flex;align-items:center;justify-content:center;z-index:20;border-radius:10px;';
     tip.innerHTML = `
       <div style="max-width:420px;padding:16px 18px;background:rgba(17,24,39,0.95);border:1px solid rgba(255,255,255,0.1);border-radius:12px;text-align:left;">
         <div style="font-weight:800;font-size:18px;margin-bottom:8px;">Tip: Dash & Aim</div>
         <div style="font-size:14px;opacity:0.9;line-height:1.5;">
           Use your finger to aim the shark. Tap & hold to DASH and ram enemies with your horn to defeat them.
         </div>
         <button id="closeOnboarding" class="search-btn" style="margin-top:12px;width:100%;">Got it</button>
       </div>`;
     root.appendChild(tip);
     document.getElementById('closeOnboarding').addEventListener('click', ()=>{
       localStorage.setItem('shark-io_onboarded','1');
       tip.remove();
     });
   }

   // Touch controls mapping to mouse steering and dash
   canvas.addEventListener('touchstart', (e)=>{
     if (paused) { e.preventDefault(); return; }
     const t = e.touches[0]; if (!t) return; e.preventDefault();
     const r = canvas.getBoundingClientRect();
     mouse.x = t.clientX - r.left; mouse.y = t.clientY - r.top; mouse.down = true;
   }, {passive:false});
   canvas.addEventListener('touchmove', (e)=>{
     if (paused) { e.preventDefault(); return; }
     const t = e.touches[0]; if (!t) return; e.preventDefault();
     const r = canvas.getBoundingClientRect();
     mouse.x = t.clientX - r.left; mouse.y = t.clientY - r.top;
   }, {passive:false});
   window.addEventListener('touchend', ()=>{ mouse.down = false; }, {passive:true});

   function track(action, extras){
     if (typeof window.trackGameEvent !== 'function') return;
     if (typeof extras === 'number') { window.trackGameEvent(action, { score: extras }); }
     else { window.trackGameEvent(action, extras || {}); }
   }

   showMobileOnboarding();
   init();
 })();