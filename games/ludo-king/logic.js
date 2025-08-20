/*
  Simple Ludo King (Single-player Turn Simulation)
  - 2 players (Red, Blue)
  - Click Roll Dice to roll (1-6)
  - A 6 allows piece to enter board from base; otherwise move forward
  - First player to reach home (track length simplified) wins
*/

(function () {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const diceEl = document.getElementById('dice');
  const rollBtn = document.getElementById('rollBtn');
  const restartBtn = document.getElementById('restartBtn');
  const gameOverScreen = document.getElementById('gameOverScreen');
  const winnerEl = document.getElementById('winner');

  const BOARD_SIZE = 500;
  const CELL = BOARD_SIZE / 15; // 15x15 grid

  const PLAYERS = [
    { name: 'Player 1', color: '#e74c3c', start: { x: 1, y: 6 }, home: { x: 7, y: 7 }, pos: -1 },
    { name: 'Player 2', color: '#3498db', start: { x: 13, y: 8 }, home: { x: 7, y: 7 }, pos: -1 }
  ];
  let currentPlayerIndex = 0;
  let lastDice = null;
  let gameOver = false;

  // Simplified path (square track around center)
  const path = [];
  for (let i = 1; i < 14; i++) path.push({ x: i, y: 6 });
  for (let i = 6; i < 14; i++) path.push({ x: 13, y: i });
  for (let i = 13; i > 0; i--) path.push({ x: i, y: 13 });
  for (let i = 13; i > 0; i--) path.push({ x: 1, y: i });
  for (let i = 1; i <= 6; i++) path.push({ x: i, y: 1 });

  function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Background
    ctx.fillStyle = '#f7d794';
    ctx.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);

    // Grid
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    for (let i = 0; i <= 15; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL, 0);
      ctx.lineTo(i * CELL, BOARD_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL);
      ctx.lineTo(BOARD_SIZE, i * CELL);
      ctx.stroke();
    }

    // Home
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(6 * CELL, 6 * CELL, 3 * CELL, 3 * CELL);

    // Start areas
    drawStart(1 * CELL, 1 * CELL, '#e74c3c');
    drawStart(11 * CELL, 1 * CELL, '#3498db');
  }

  function drawStart(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 3 * CELL, 3 * CELL);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.arc(x + 1.5 * CELL, y + 1.5 * CELL, CELL * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPieces() {
    PLAYERS.forEach((p, idx) => {
      const pos = p.pos;
      let x, y;
      if (pos < 0) {
        x = (idx === 0 ? 2.5 : 12.5) * CELL;
        y = (idx === 0 ? 2.5 : 2.5) * CELL;
      } else if (pos >= path.length - 1) {
        x = 7.5 * CELL;
        y = 7.5 * CELL;
      } else {
        const cell = path[pos];
        x = cell.x * CELL + CELL / 2;
        y = cell.y * CELL + CELL / 2;
      }

      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(x, y, CELL * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#2c3e50';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  function draw() {
    drawBoard();
    drawPieces();
  }

  function rollDice() {
    if (gameOver) return;
    lastDice = Math.floor(Math.random() * 6) + 1;
    diceEl.textContent = 'Dice: ' + lastDice;
    const p = PLAYERS[currentPlayerIndex];

    // Enter board on 6
    if (p.pos < 0) {
      if (lastDice === 6) p.pos = 0;
      else nextTurn();
      updateStatus();
      draw();
      return;
    }

    // Move forward
    p.pos += lastDice;
    if (p.pos >= path.length - 1) {
      p.pos = path.length - 1;
      endGame(p.name);
      draw();
      return;
    }

    // Capture rule: if land on opponent, send them home
    const other = PLAYERS[1 - currentPlayerIndex];
    if (other.pos >= 0 && other.pos < path.length - 1) {
      const a = path[p.pos];
      const b = path[other.pos];
      if (a.x === b.x && a.y === b.y) {
        other.pos = -1;
      }
    }

    // Extra turn on 6
    if (lastDice !== 6) nextTurn();

    updateStatus();
    draw();
  }

  function endGame(name) {
    gameOver = true;
    winnerEl.textContent = name;
    gameOverScreen.style.display = 'block';
    try { trackGameEvent && trackGameEvent('game_complete'); } catch (e) {}
  }

  function restartGame() {
    PLAYERS.forEach(p => p.pos = -1);
    currentPlayerIndex = 0;
    lastDice = null;
    gameOver = false;
    diceEl.textContent = 'Dice: -';
    gameOverScreen.style.display = 'none';
    updateStatus();
    draw();
  }

  function nextTurn() {
    currentPlayerIndex = (currentPlayerIndex + 1) % PLAYERS.length;
  }

  function updateStatus() {
    scoreEl.textContent = 'Turn: ' + PLAYERS[currentPlayerIndex].name;
  }

  rollBtn.addEventListener('click', rollDice);
  restartBtn.addEventListener('click', restartGame);

  updateStatus();
  draw();
})();

// Expose restart for overlay button
window.restartGame = function () { const btn = document.getElementById('restartBtn'); if (btn) btn.click(); };