(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const movesEl = document.getElementById('moves');
  const sizeSelect = document.getElementById('sizeSelect');
  const shuffleBtn = document.getElementById('shuffleBtn');
  const restartBtn = document.getElementById('restartBtn');
  const gameOverScreen = document.getElementById('gameOverScreen');
  const finalMovesEl = document.getElementById('finalMoves');
  const playAgainBtn = document.getElementById('playAgainBtn');

  let N = parseInt(sizeSelect.value, 10) || 4;
  let tiles = []; // flatten grid 0..N*N-1, 0 is empty
  let moves = 0;

  function resetTiles() {
    tiles = Array.from({ length: N*N }, (_, i) => i);
    moves = 0;
    movesEl.textContent = `Moves: ${moves}`;
    gameOverScreen.style.display = 'none';
  }

  function shuffleTiles() {
    // generate a solvable permutation by doing valid moves from solved state
    resetTiles();
    let emptyIndex = 0; // in solved, 0 at index 0
    for (let i = 0; i < N*N*50; i++) {
      const neighbors = getNeighborIndexes(emptyIndex);
      const swapWith = neighbors[Math.floor(Math.random() * neighbors.length)];
      swap(emptyIndex, swapWith);
      emptyIndex = swapWith;
    }
    moves = 0;
    movesEl.textContent = `Moves: ${moves}`;
    draw();
  }

  function indexToRC(idx) {
    return { r: Math.floor(idx / N), c: idx % N };
  }
  function rcToIndex(r, c) {
    return r * N + c;
  }

  function getNeighborIndexes(idx) {
    const { r, c } = indexToRC(idx);
    const res = [];
    if (r > 0) res.push(rcToIndex(r-1, c));
    if (r < N-1) res.push(rcToIndex(r+1, c));
    if (c > 0) res.push(rcToIndex(r, c-1));
    if (c < N-1) res.push(rcToIndex(r, c+1));
    return res;
  }

  function swap(i, j) {
    const tmp = tiles[i];
    tiles[i] = tiles[j];
    tiles[j] = tmp;
  }

  function isSolved() {
    for (let i = 0; i < tiles.length; i++) {
      if (tiles[i] !== i) return false;
    }
    return true;
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const W = canvas.width;
    const H = canvas.height;
    const size = Math.min(W, H) - 20;
    const cell = size / N;
    const offX = (W - size) / 2 + 10;
    const offY = (H - size) / 2 + 10;

    ctx.fillStyle = '#0b1220';
    ctx.fillRect(0, 0, W, H);

    for (let idx = 0; idx < tiles.length; idx++) {
      const val = tiles[idx];
      const { r, c } = indexToRC(idx);
      const x = offX + c * cell;
      const y = offY + r * cell;

      if (val === 0) {
        // empty tile
        ctx.fillStyle = '#111827';
        ctx.fillRect(x+2, y+2, cell-4, cell-4);
        continue;
      }

      ctx.fillStyle = '#22c55e';
      ctx.fillRect(x+2, y+2, cell-4, cell-4);
      ctx.fillStyle = '#0b1220';
      ctx.font = `${Math.floor(cell*0.4)}px Inter, system-ui, -apple-system, Segoe UI, Roboto`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(val), x + cell/2, y + cell/2);
    }
  }

  function onClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    const W = canvas.width;
    const H = canvas.height;
    const size = Math.min(W, H) - 20;
    const cell = size / N;
    const offX = (W - size) / 2 + 10;
    const offY = (H - size) / 2 + 10;

    if (x < offX || x > offX + size || y < offY || y > offY + size) return;

    const c = Math.floor((x - offX) / cell);
    const r = Math.floor((y - offY) / cell);
    const idx = rcToIndex(r, c);

    // can move only if adjacent to empty
    const emptyIdx = tiles.indexOf(0);
    if (getNeighborIndexes(emptyIdx).includes(idx)) {
      swap(idx, emptyIdx);
      moves += 1;
      movesEl.textContent = `Moves: ${moves}`;
      draw();
      trackGameEvent('move', { moves, size: N });
      if (isSolved()) {
        finalMovesEl.textContent = moves;
        gameOverScreen.style.display = 'block';
        trackGameEvent('puzzle_solved', { moves, size: N });
      }
    }
  }

  function onTouchStart(e) {
    if (!e.touches || e.touches.length === 0) return;
    const t = e.touches[0];
    e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const x = (t.clientX - rect.left) * (canvas.width / rect.width);
    const y = (t.clientY - rect.top) * (canvas.height / rect.height);

    const W = canvas.width;
    const H = canvas.height;
    const size = Math.min(W, H) - 20;
    const cell = size / N;
    const offX = (W - size) / 2 + 10;
    const offY = (H - size) / 2 + 10;

    if (x < offX || x > offX + size || y < offY || y > offY + size) return;

    const c = Math.floor((x - offX) / cell);
    const r = Math.floor((y - offY) / cell);
    const idx = rcToIndex(r, c);

    const emptyIdx = tiles.indexOf(0);
    if (getNeighborIndexes(emptyIdx).includes(idx)) {
      swap(idx, emptyIdx);
      moves += 1;
      movesEl.textContent = `Moves: ${moves}`;
      draw();
      trackGameEvent('move', { moves, size: N });
      if (isSolved()) {
        finalMovesEl.textContent = moves;
        gameOverScreen.style.display = 'block';
        trackGameEvent('puzzle_solved', { moves, size: N });
      }
    }
  }

  function onShuffle() {
    shuffleTiles();
    trackGameEvent('shuffle', { size: N });
  }

  function onRestart() {
    resetTiles();
    trackGameEvent('restart', { size: N });
    draw();
  }

  sizeSelect.addEventListener('change', () => {
    N = parseInt(sizeSelect.value, 10) || 4;
    resetTiles();
    shuffleTiles();
    trackGameEvent('change_size', { size: N });
  });

  shuffleBtn.addEventListener('click', onShuffle);
  restartBtn.addEventListener('click', onRestart);
  canvas.addEventListener('click', onClick);
  canvas.addEventListener('touchstart', onTouchStart, { passive: false });

  if (playAgainBtn) {
    playAgainBtn.addEventListener('click', onRestart);
  }

  // init
  resetTiles();
  shuffleTiles();
  draw();
})();