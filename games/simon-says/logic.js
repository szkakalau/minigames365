(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const scoreEl = document.getElementById('score');
  const roundEl = document.getElementById('round');
  const startBtn = document.getElementById('startBtn');
  const gameOverScreen = document.getElementById('gameOverScreen');
  const finalScoreEl = document.getElementById('finalScore');

  const colors = [
    { base: '#ef4444', glow: '#f87171' }, // red
    { base: '#22c55e', glow: '#4ade80' }, // green
    { base: '#3b82f6', glow: '#60a5fa' }, // blue
    { base: '#eab308', glow: '#facc15' }  // yellow
  ];

  const buttons = [];
  const SIZE = canvas.width; // assume square
  const padding = 10;
  const half = SIZE/2;
  const radius = half - padding;

  let sequence = [];
  let inputIndex = 0;
  let round = 0;
  let score = 0;
  let playingBack = false;
  let activeIndex = -1; // which color is glowing

  function resetGame() {
    sequence = [];
    inputIndex = 0;
    round = 0;
    score = 0;
    playingBack = false;
    activeIndex = -1;
    updateHUD();
    gameOverScreen.style.display = 'none';
    draw();
  }

  function updateHUD() {
    scoreEl.textContent = `Score: ${score}`;
    roundEl.textContent = `Round: ${round}`;
  }

  function nextRound() {
    round += 1;
    sequence.push(Math.floor(Math.random() * 4));
    inputIndex = 0;
    updateHUD();
    playSequence();
  }

  async function playSequence() {
    playingBack = true;
    trackGameEvent('play_sequence', { round });
    for (let i = 0; i < sequence.length; i++) {
      activeIndex = sequence[i];
      draw();
      await wait(500);
      activeIndex = -1;
      draw();
      await wait(200);
    }
    playingBack = false;
  }

  function wait(ms) { return new Promise(res => setTimeout(res, ms)); }

  function handleClick(e) {
    if (playingBack || sequence.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    const idx = hitIndex(x, y);
    if (idx === -1) return;

    // flash
    activeIndex = idx;
    draw();
    setTimeout(() => { activeIndex = -1; draw(); }, 180);

    // check input
    if (idx === sequence[inputIndex]) {
      inputIndex += 1;
      score += 5;
      updateHUD();
      if (inputIndex === sequence.length) {
        score += 10; // round bonus
        updateHUD();
        trackGameEvent('round_complete', { round, score });
        setTimeout(nextRound, 400);
      }
    } else {
      gameOver();
    }
  }

  function hitIndex(x, y) {
    const dx = x - half;
    const dy = y - half;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > radius) return -1;
    const angle = Math.atan2(dy, dx); // -PI..PI
    const quadrant = (angle + Math.PI) / (Math.PI / 2); // 0..4
    return Math.floor(quadrant) % 4; // 0: left-bottom, 1: right-bottom, 2: right-top, 3: left-top
  }

  function draw() {
    ctx.clearRect(0,0,canvas.width, canvas.height);

    // draw four quadrants
    drawQuadrant(3, 0, 0, half, half); // top-left (index 3)
    drawQuadrant(2, half, 0, half, half); // top-right (index 2)
    drawQuadrant(1, half, half, half, half); // bottom-right (index 1)
    drawQuadrant(0, 0, half, half, half); // bottom-left (index 0)

    // center circle
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(half, half, 40, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawQuadrant(index, x, y, w, h) {
    const color = colors[index];
    ctx.fillStyle = activeIndex === index ? color.glow : color.base;
    ctx.fillRect(x + padding, y + padding, w - padding*2, h - padding*2);
  }

  function startGame() {
    resetGame();
    nextRound();
    trackGameEvent('start');
  }

  function gameOver() {
    finalScoreEl.textContent = score;
    gameOverScreen.style.display = 'block';
    trackGameEvent('game_over', { round, score });
  }

  startBtn.addEventListener('click', startGame);
  canvas.addEventListener('click', handleClick);

  resetGame();
})();