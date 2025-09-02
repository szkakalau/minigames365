// Hbm4 - Fast Arcade Dodger
(function(){
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  // Mobile-friendly input
  let inputX = W/2;
  let isDown = false;
  canvas.addEventListener('pointerdown', (e)=>{ isDown = true; moveTo(e); });
  canvas.addEventListener('pointermove', (e)=>{ if(isDown) moveTo(e); });
  canvas.addEventListener('pointerup', ()=>{ isDown = false; });
  canvas.addEventListener('pointercancel', ()=>{ isDown = false; });
  function moveTo(e){
    const rect = canvas.getBoundingClientRect();
    inputX = (e.clientX - rect.left) / rect.width * W;
  }

  // Player
  const player = { x: W/2, y: H-60, w: 40, h: 16, color: '#22c55e', speed: 0.2 };

  // Obstacles and powerups
  const objs = [];
  let spawnTimer = 0;
  let score = 0;
  let best = parseInt(localStorage.getItem('hbm4_best')||'0',10);
  const gameOverEl = document.getElementById('gameOver');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const finalScoreEl = document.getElementById('finalScore');
  const restartBtn = document.getElementById('restartBtn');
  restartBtn.addEventListener('click', restart);

  let alive = true;
  let speed = 2.4;
  function spawn(){
    const isPower = Math.random() < 0.12;
    const size = isPower ? 14 : 18 + Math.random()*16;
    objs.push({
      x: Math.random()*(W-size), y: -size, w: size, h: size,
      vy: speed + Math.random()*2.0,
      color: isPower ? '#3b82f6' : '#ef4444',
      power: isPower
    });
  }

  function rectsCollide(a,b){
    return !(a.x+a.w < b.x || a.x > b.x+b.w || a.y+a.h < b.y || a.y > b.y+b.h);
  }

  function update(dt){
    // follow input
    const dx = inputX - (player.x + player.w/2);
    player.x += dx * Math.min(player.speed*dt, 1);
    player.x = Math.max(0, Math.min(W - player.w, player.x));

    // spawn
    spawnTimer -= dt;
    if (spawnTimer <= 0){
      spawn();
      spawnTimer = 280 - Math.min(200, score*0.4); // faster spawns
    }

    // move objects
    for (let i=objs.length-1;i>=0;i--){
      const o = objs[i];
      o.y += o.vy;
      if (o.y > H+40) objs.splice(i,1);
      else if (rectsCollide(player, o)){
        if (o.power){
          score += 20;
          objs.splice(i,1);
        } else {
          alive = false;
        }
      }
    }

    // score over time
    score += dt*0.02;
    speed += dt*0.0006; // slight acceleration
  }

  function draw(){
    ctx.clearRect(0,0,W,H);

    // background grid
    ctx.fillStyle = '#0b1220';
    ctx.fillRect(0,0,W,H);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for(let y=0;y<H;y+=20){
      ctx.beginPath(); ctx.moveTo(0,y+0.5); ctx.lineTo(W,y+0.5); ctx.stroke();
    }

    // player
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.w, player.h);

    // objects
    for(const o of objs){
      ctx.fillStyle = o.color;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    }
  }

  let last = performance.now();
  function loop(now){
    const dt = Math.min(50, now - last);
    last = now;
    if (alive){
      update(dt);
      draw();
      scoreEl.textContent = Math.floor(score);
      bestEl.textContent = best;
      requestAnimationFrame(loop);
    } else {
      end();
    }
  }

  function end(){
    finalScoreEl.textContent = Math.floor(score);
    if (score > best){ best = Math.floor(score); localStorage.setItem('hbm4_best', best.toString()); }
    bestEl.textContent = best;
    gameOverEl.classList.remove('hidden');
  }

  function restart(){
    objs.length = 0;
    score = 0;
    alive = true;
    speed = 2.4;
    gameOverEl.classList.add('hidden');
    last = performance.now();
    requestAnimationFrame(loop);
  }

  // start
  requestAnimationFrame(loop);
})();