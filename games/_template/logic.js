(function(){
  // Template game logic skeleton
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  let score = 0;
  let best = Number(localStorage.getItem('GAME_SLUG_best') || 0);
  let running = true;

  function init() {
    score = 0;
    running = true;
    draw();
    track('game_start');
    loop();
  }

  function loop(){
    if (!running) return;
    update();
    draw();
    requestAnimationFrame(loop);
  }

  function update(){
    // TODO: implement your game state update here
  }

  function draw(){
    // Clear canvas
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0,0,W,H);

    // Draw score overlay
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 12, 28);
    ctx.textAlign = 'right';
    ctx.fillText('Best: ' + best, W - 12, 28);
  }

  function gameOver(){
    running = false;
    best = Math.max(best, score);
    localStorage.setItem('GAME_SLUG_best', String(best));
    document.getElementById('finalScore').textContent = score;
    const over = document.getElementById('gameOverScreen');
    over.style.display = 'block';
    track('game_end', score);
  }

  function restartGame(){
    const over = document.getElementById('gameOverScreen');
    over.style.display = 'none';
    init();
  }

  // Input samples (replace as needed)
  window.addEventListener('keydown', (e) => {
    if (!running && (e.code === 'Space' || e.key === ' ')) restartGame();
  });
  canvas.addEventListener('pointerdown', () => {
    if (!running) restartGame();
  });

  // Expose restart
  window.restartGame = restartGame;

  function track(action, score){
    if (typeof window.trackGameEvent === 'function') {
      window.trackGameEvent(action, score);
    }
  }

  // boot
  init();
})();