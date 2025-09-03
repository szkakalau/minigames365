'use strict';
// Ultra Crypto - simple mobile-friendly arcade game
// Goal: collect coins, avoid rug pulls. Swipe/tap to move left/right.

(function(){
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const gameOverScreen = document.getElementById('gameOverScreen');
  const finalScoreEl = document.getElementById('finalScore');
  const restartBtn = document.getElementById('restartBtn');

  const DPR = Math.max(1, Math.floor(window.devicePixelRatio||1));
  let W = canvas.clientWidth;
  let H = canvas.clientHeight;
  canvas.width = W * DPR; canvas.height = H * DPR; ctx.scale(DPR,DPR);

  let running = false;
  let score = 0;
  let best = Number(localStorage.getItem('uc_best')||0);
  let t = 0; // time

  const laneCount = 3;
  const laneW = () => Math.min(W*0.26, 96);
  const playW = () => laneW()*laneCount;
  const playX = () => (W - playW())/2;

  const player = { x: 1, y: H-110, w: 28, h: 28, color: '#22d3ee', vx: 0, px: 0 };
  const coins = []; // {x,y,r,vy}
  const rugs = [];  // {x,y,w,h,vy}

  function reset(){
    running = true; score = 0; t = 0; coins.length = 0; rugs.length = 0;
    player.x = 1; player.px = laneToX(1) + laneW()/2; player.y = H-110; player.vx = 0;
    gameOverScreen.style.display = 'none';
    updateHUD();
    trackGameEvent('game_start');
  }

  function updateHUD(){
    scoreEl.textContent = 'Score: ' + score;
    bestEl.textContent = 'Best: ' + best;
  }

  function laneToX(l){
    return playX() + l*laneW();
  }

  function spawnCoin(){
    const lane = Math.floor(Math.random()*laneCount);
    coins.push({ x: laneToX(lane)+laneW()/2, y: -20, r: 10, vy: 2.2 + Math.min(3, t/600) });
  }

  function spawnRug(){
    const lane = Math.floor(Math.random()*laneCount);
    const w = laneW()*0.82, h = 14;
    rugs.push({ x: laneToX(lane)+laneW()/2 - w/2, y: -20, w, h, vy: 2.0 + Math.min(3, t/600) });
  }

  function update(){
    if (!running) return;
    t++;

    // spawn logic
    if (t%45===0) spawnCoin();
    if (t%80===0) spawnRug();

    // move player smoothly toward target px
    player.px += (laneToX(player.x)+laneW()/2 - player.px)*0.15;

    // update coins
    for (let i=coins.length-1;i>=0;i--){
      const c = coins[i]; c.y += c.vy;
      if (c.y - c.r > H+20) { coins.splice(i,1); continue; }
      const dx = Math.abs(c.x - player.px), dy = Math.abs(c.y - player.y);
      if (dx < (player.w*0.6) && dy < (player.h*0.6)){
        coins.splice(i,1); score += 1; updateHUD();
        trackGameEvent('coin_collected', score);
      }
    }

    // update rugs
    for (let i=rugs.length-1;i>=0;i--){
      const r = rugs[i]; r.y += r.vy;
      if (r.y - r.h > H+20) { rugs.splice(i,1); continue; }
      if (player.px > r.x && player.px < r.x + r.w && Math.abs(player.y - (r.y + r.h/2)) < (player.h/2 + r.h/2)){
        gameOver(); return;
      }
    }

    draw();
    requestAnimationFrame(update);
  }

  function draw(){
    ctx.clearRect(0,0,W,H);
    // play area bg
    ctx.fillStyle = '#0b1220';
    ctx.fillRect(playX(), 40, playW(), H-60);

    // grid lanes
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.setLineDash([8,10]);
    ctx.lineWidth = 1;
    for (let i=1;i<laneCount;i++){
      const x = playX()+i*laneW();
      ctx.beginPath(); ctx.moveTo(x, 40); ctx.lineTo(x, H-20); ctx.stroke();
    }
    ctx.setLineDash([]);

    // player
    ctx.fillStyle = player.color;
    roundedRect(ctx, player.px - player.w/2, player.y - player.h/2, player.w, player.h, 6);
    ctx.fill();

    // coins
    coins.forEach(c=>{
      const grd = ctx.createRadialGradient(c.x, c.y, 2, c.x, c.y, c.r);
      grd.addColorStop(0, '#fde047');
      grd.addColorStop(1, '#f59e0b');
      ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI*2); ctx.fill();
    });

    // rugs
    rugs.forEach(r=>{
      ctx.fillStyle = '#ef4444';
      roundedRect(ctx, r.x, r.y, r.w, r.h, 6); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(r.x, r.y+r.h-3, r.w, 3);
    });

    // score label floating
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '12px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    ctx.fillText('Ultra Crypto', 10, 18);
  }

  function roundedRect(ctx, x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.arcTo(x+w, y, x+w, y+h, r);
    ctx.arcTo(x+w, y+h, x, y+h, r);
    ctx.arcTo(x, y+h, x, y, r);
    ctx.arcTo(x, y, x+w, y, r);
    ctx.closePath();
  }

  function gameOver(){
    running = false;
    best = Math.max(best, score); localStorage.setItem('uc_best', String(best));
    updateHUD();
    finalScoreEl.textContent = String(score);
    gameOverScreen.style.display = 'block';
    trackGameEvent('game_over', score);
  }

  function restartGame(){ reset(); requestAnimationFrame(update); }
  window.restartGame = restartGame;

  // input
  function onKey(e){
    if (!running) return;
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') player.x = Math.max(0, player.x-1);
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') player.x = Math.min(laneCount-1, player.x+1);
  }
  window.addEventListener('keydown', onKey);

  let touchStartX = 0;
  canvas.addEventListener('touchstart', e=>{ if (e.touches[0]) touchStartX = e.touches[0].clientX; }, {passive:true});
  canvas.addEventListener('touchmove', e=>{
    if (!running) return;
    const x = e.touches[0]?.clientX || touchStartX;
    const rel = x - canvas.getBoundingClientRect().left;
    const lane = Math.max(0, Math.min(laneCount-1, Math.floor((rel - playX())/laneW())));
    player.x = lane;
  }, {passive:true});

  canvas.addEventListener('click', ()=>{
    if (!running) return;
    const rect = canvas.getBoundingClientRect();
    const mx = window._lastMouseX ?? (rect.left+rect.width/2);
    const lane = Math.max(0, Math.min(laneCount-1, Math.floor((mx - playX())/laneW())));
    player.x = lane;
  });
  canvas.addEventListener('mousemove', e=>{ window._lastMouseX = e.clientX; });

  restartBtn.addEventListener('click', restartGame);

  // start
  reset();
  requestAnimationFrame(update);
})();