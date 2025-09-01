(function(){
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // Responsive scale helpers
  function fitCanvas() {
    const maxW = Math.min(480, document.getElementById('game-root').clientWidth - 24);
    const scale = maxW / 400; // base width 400
    canvas.style.width = Math.round(400 * scale) + 'px';
    canvas.style.height = Math.round(600 * scale) + 'px';
  }
  window.addEventListener('resize', fitCanvas);
  setTimeout(fitCanvas, 0);

  // Game state
  const W = canvas.width;
  const H = canvas.height;
  const player = { x: W/2, y: H - 70, r: 16, speed: 4.2 };
  let score = 0;
  const key = 'crypto_collectibles_best';
  let best = Number(localStorage.getItem(key) || 0);
  let running = true;

  // Entities
  const collectibles = []; // good tokens
  const hazards = [];      // bad tokens

  // Spawn control
  let spawnTimer = 0;
  let hazardTimer = 0;
  let speedFactor = 1; // increases over time

  // Input
  const input = { left:false, right:false, pointerActive:false, pointerX: player.x };
  window.addEventListener('keydown', (e)=>{
    if (e.key === 'ArrowLeft' || e.key.toLowerCase()==='a') input.left = true;
    if (e.key === 'ArrowRight' || e.key.toLowerCase()==='d') input.right = true;
    if (!running && (e.code === 'Space' || e.key === ' ')) restartGame();
  });
  window.addEventListener('keyup', (e)=>{
    if (e.key === 'ArrowLeft' || e.key.toLowerCase()==='a') input.left = false;
    if (e.key === 'ArrowRight' || e.key.toLowerCase()==='d') input.right = false;
  });
  canvas.addEventListener('pointerdown', (e)=>{
    input.pointerActive = true;
    const rect = canvas.getBoundingClientRect();
    input.pointerX = ((e.clientX - rect.left) / rect.width) * W;
  });
  canvas.addEventListener('pointermove', (e)=>{
    if (!input.pointerActive) return;
    const rect = canvas.getBoundingClientRect();
    input.pointerX = ((e.clientX - rect.left) / rect.width) * W;
  });
  window.addEventListener('pointerup', ()=>{ input.pointerActive = false; });

  // Utils
  function rand(min, max){ return Math.random() * (max - min) + min; }

  function spawnCollectible(){
    collectibles.push({ x: rand(20, W-20), y: -20, r: 10, vy: rand(1.2, 2.0) * speedFactor, value: 1 });
  }
  function spawnHazard(){
    hazards.push({ x: rand(20, W-20), y: -20, r: 12, vy: rand(1.0, 1.8) * speedFactor });
  }

  function reset(){
    score = 0;
    collectibles.length = 0;
    hazards.length = 0;
    speedFactor = 1;
    player.x = W/2;
  }

  function restartGame(){
    const over = document.getElementById('gameOverScreen');
    over.style.display = 'none';
    running = true;
    reset();
    loop();
  }
  window.restartGame = restartGame;

  function update(){
    // difficulty scaling
    speedFactor += 0.0008; // slowly ramp

    // player movement
    if (input.left) player.x -= player.speed;
    if (input.right) player.x += player.speed;
    if (input.pointerActive) {
      // lerp toward pointer X
      player.x += (input.pointerX - player.x) * 0.22;
    }
    player.x = Math.max(player.r + 6, Math.min(W - player.r - 6, player.x));

    // spawn cadence
    spawnTimer -= 1;
    hazardTimer -= 1;
    if (spawnTimer <= 0){ spawnCollectible(); spawnTimer = Math.max(18, 42 - Math.floor(score/5)); }
    if (hazardTimer <= 0){ spawnHazard(); hazardTimer = Math.max(28, 60 - Math.floor(score/4)); }

    // update entities
    for (let i=collectibles.length-1; i>=0; i--){
      const c = collectibles[i];
      c.y += c.vy;
      if (c.y - c.r > H) { collectibles.splice(i,1); continue; }
      const dx = c.x - player.x, dy = c.y - player.y;
      if (dx*dx + dy*dy <= (c.r + player.r)*(c.r + player.r)){
        score += c.value;
        collectibles.splice(i,1);
      }
    }
    for (let i=hazards.length-1; i>=0; i--){
      const h = hazards[i];
      h.y += h.vy;
      if (h.y - h.r > H) { hazards.splice(i,1); continue; }
      const dx = h.x - player.x, dy = h.y - player.y;
      if (dx*dx + dy*dy <= (h.r + player.r)*(h.r + player.r)){
        return gameOver();
      }
    }
  }

  function draw(){
    // bg
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0,0,W,H);

    // subtle grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let x=0; x<W; x+=40){
      ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke();
    }
    for (let y=0; y<H; y+=40){
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke();
    }

    // player
    ctx.fillStyle = '#22c55e';
    ctx.beginPath(); ctx.arc(player.x, player.y, player.r, 0, Math.PI*2); ctx.fill();

    // collectibles
    ctx.fillStyle = '#0ea5e9';
    collectibles.forEach(c=>{ ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI*2); ctx.fill(); });

    // hazards
    ctx.fillStyle = '#ef4444';
    hazards.forEach(h=>{ ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, Math.PI*2); ctx.fill(); });

    // score HUD inside canvas (reinforce)
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left'; ctx.fillText('Score: ' + score, 12, 28);
    ctx.textAlign = 'right'; ctx.fillText('Best: ' + best, W-12, 28);
  }

  function loop(){
    if (!running) return;
    update();
    draw();
    requestAnimationFrame(loop);
  }

  function gameOver(){
    running = false;
    best = Math.max(best, score);
    localStorage.setItem(key, String(best));
    document.getElementById('scoreValue').textContent = String(score);
    document.getElementById('bestValue').textContent = String(best);
    document.getElementById('finalScore').textContent = String(score);
    const over = document.getElementById('gameOverScreen');
    over.style.display = 'block';
    if (typeof window.trackGameEvent === 'function') window.trackGameEvent('game_end', { score });
  }

  // Restart button
  document.getElementById('restartBtn').addEventListener('click', restartGame);

  // Start
  if (typeof window.trackGameEvent === 'function') window.trackGameEvent('game_start', {});
  reset();
  loop();
})();