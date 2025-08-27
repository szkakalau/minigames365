(function(){
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const COLS = 10, ROWS = 20, SIZE = 28; // 10x20 grid
  canvas.width = COLS * SIZE;
  canvas.height = ROWS * SIZE;

  const COLORS = {
    I: '#22d3ee', O: '#fde047', T: '#a78bfa', S: '#34d399', Z: '#f87171', J: '#60a5fa', L: '#fb923c'
  };
  const SHAPES = {
    I: [[1,1,1,1]],
    O: [[1,1],[1,1]],
    T: [[1,1,1],[0,1,0]],
    S: [[0,1,1],[1,1,0]],
    Z: [[1,1,0],[0,1,1]],
    J: [[1,0,0],[1,1,1]],
    L: [[0,0,1],[1,1,1]]
  };
  const TYPES = Object.keys(SHAPES);

  let grid = createMatrix(COLS, ROWS);
  let piece = createPiece();
  let score = 0, lines = 0, level = 1;
  let dropCounter = 0;
  let dropInterval = 800; // ms
  let lastTime = 0;
  let paused = false;

  function createMatrix(w, h){
    const m = [];
    for (let y=0; y<h; y++){ m.push(new Array(w).fill(0)); }
    return m;
  }
  function randType(){ return TYPES[(Math.random()*TYPES.length)|0]; }
  function createPiece(){
    const type = randType();
    const shape = SHAPES[type].map(r=>r.slice());
    return { type, shape, x: (COLS>>1)-((shape[0].length/2)|0), y: 0 };
  }

  function collide(grid, p){
    for (let y=0; y<p.shape.length; y++){
      for (let x=0; x<p.shape[y].length; x++){
        if (p.shape[y][x] && (grid[y+p.y] && grid[y+p.y][x+p.x]) !== 0){
          return true;
        }
      }
    }
    return false;
  }

  function merge(grid, p){
    for (let y=0; y<p.shape.length; y++){
      for (let x=0; x<p.shape[y].length; x++){
        if (p.shape[y][x]){ grid[y+p.y][x+p.x] = p.type; }
      }
    }
  }

  function rotate(matrix, dir){
    const m = matrix.map((_, i) => matrix.map(row => row[i])); // transpose
    m.forEach(row => row.reverse()); // rotate right
    if (dir < 0){ m.reverse(); m.forEach(row=>row.reverse()); } // rotate left
    return m;
  }

  function sweep(){
    let rowsCleared = 0;
    outer: for (let y=ROWS-1; y>=0; y--){
      for (let x=0; x<COLS; x++){
        if (grid[y][x] === 0) continue outer;
      }
      const row = grid.splice(y,1)[0].fill(0);
      grid.unshift(row);
      y++;
      rowsCleared++;
    }
    if (rowsCleared){
      const points = [0,40,100,300,1200][rowsCleared] * level;
      score += points;
      lines += rowsCleared;
      if (lines >= level * 10) { level++; dropInterval = Math.max(120, dropInterval - 80); }
      updateHUD();
    }
  }

  function updateHUD(){
    document.getElementById('score').textContent = 'Score: ' + score;
    document.getElementById('level').textContent = 'Level: ' + level;
    document.getElementById('lines').textContent = 'Lines: ' + lines;
  }

  function drawMatrix(matrix, offset){
    for (let y=0; y<matrix.length; y++){
      for (let x=0; x<matrix[y].length; x++){
        if (matrix[y][x]){
          ctx.fillStyle = COLORS[matrix[y][x]] || '#e5e7eb';
          ctx.fillRect((x+offset.x)*SIZE, (y+offset.y)*SIZE, SIZE-1, SIZE-1);
        }
      }
    }
  }

  function draw(){
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0,0,canvas.width, canvas.height);
    // draw grid blocks
    for (let y=0; y<ROWS; y++){
      for (let x=0; x<COLS; x++){
        if (grid[y][x]){
          ctx.fillStyle = COLORS[grid[y][x]] || '#e5e7eb';
          ctx.fillRect(x*SIZE, y*SIZE, SIZE-1, SIZE-1);
        }
      }
    }
    // draw current piece
    drawMatrix(piece.shape.map(r=>r.map(v=> v? piece.type:0)), {x:piece.x, y:piece.y});
    // draw pause overlay
    if (paused && running){
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(0,0,canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Paused - press P or tap Resume', canvas.width/2, canvas.height/2);
    }
  }

  function drop(){
    piece.y++;
    if (collide(grid, piece)){
      piece.y--;
      merge(grid, piece);
      sweep();
      piece = createPiece();
      if (collide(grid, piece)){
        gameOver();
        return;
      }
    }
  }

  function gameOver(){
    running = false;
    document.getElementById('finalScore').textContent = String(score);
    document.getElementById('finalLines').textContent = String(lines);
    document.getElementById('gameOverScreen').style.display = 'block';
    track('game_end', score);
  }

  function restartGame(){
    grid = createMatrix(COLS, ROWS);
    piece = createPiece();
    score = 0; lines = 0; level = 1; dropInterval = 800; lastTime = 0; paused=false;
    document.getElementById('gameOverScreen').style.display = 'none';
    updateHUD();
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) pauseBtn.textContent = 'Pause';
    track('game_start');
    running = true;
    requestAnimationFrame(loop);
  }

  function move(dx){
    piece.x += dx;
    if (collide(grid, piece)) piece.x -= dx;
  }
  function hardDrop(){
    while(!collide(grid, piece)) piece.y++;
    piece.y--; merge(grid, piece); sweep(); piece = createPiece();
    if (collide(grid, piece)) { gameOver(); }
  }
  function rotatePiece(dir){
    const old = piece.shape;
    const rotated = rotate(piece.shape, dir);
    piece.shape = rotated;
    const posX = piece.x;
    let offset = 1;
    while (collide(grid, piece)){
      piece.x += offset; offset = -(offset + (offset>0 ? 1 : -1));
      if (offset > old[0].length){ piece.shape = old; piece.x = posX; return; }
    }
  }

  let running = true;
  function loop(time=0){
    if (!running) return;
    const delta = time - lastTime; lastTime = time;
    if (!paused){
      dropCounter += delta;
      if (dropCounter > dropInterval){ drop(); dropCounter = 0; }
    }
    draw();
    requestAnimationFrame(loop);
  }

  // controls
  document.addEventListener('keydown', (e)=>{
    // allow quick restart when not running via Space
    if (!running && (e.code === 'Space' || e.key === ' ')) { e.preventDefault(); return restartGame(); }
    const isP = (e.key?.toLowerCase() === 'p');
    const isMoveKey = ['ArrowLeft','ArrowRight','ArrowDown','ArrowUp','Space','KeyW','KeyA','KeyS','KeyD'].includes(e.code);
    if (isP || isMoveKey) { e.preventDefault(); }
    // handle pause toggle only when running
    if (isP){
      if (!running) return;
      paused = !paused;
      const pb = document.getElementById('pauseBtn');
      if (pb) pb.textContent = paused ? 'Resume' : 'Pause';
      track('pause_toggle', { state: paused ? 1 : 0 });
      return;
    }
    // block inputs while paused or not running
    if (!running || paused) return;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') move(-1);
    if (e.code === 'ArrowRight' || e.code === 'KeyD') move(1);
    if (e.code === 'ArrowDown' || e.code === 'KeyS') drop();
    if (e.code === 'ArrowUp' || e.code === 'KeyW') rotatePiece(1);
    if (e.code === 'Space') hardDrop();
  });
  document.getElementById('restartBtn').addEventListener('click', restartGame);

  // Pause/Resume button
  (function(){
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn){
      pauseBtn.addEventListener('click', ()=>{
        if (!running) return;
        paused = !paused;
        pauseBtn.textContent = paused ? 'Resume' : 'Pause';
        track('pause_toggle', { state: paused ? 1 : 0 });
      });
    }
  })();
  // Mobile on-screen controls
  (function(){
    const left = document.getElementById('btnLeft');
    const right = document.getElementById('btnRight');
    const rotateBtn = document.getElementById('btnRotate');
    const dropBtn = document.getElementById('btnDrop');
    left && left.addEventListener('click', ()=> { if (!running || paused) return; move(-1); }, { passive: true });
    right && right.addEventListener('click', ()=> { if (!running || paused) return; move(1); }, { passive: true });
    rotateBtn && rotateBtn.addEventListener('click', ()=> { if (!running || paused) return; rotatePiece(1); }, { passive: true });
    dropBtn && dropBtn.addEventListener('click', ()=> { if (!running || paused) return; drop(); }, { passive: true });
  })();
  function track(action, extras){
    if (typeof window.trackGameEvent !== 'function') return;
    if (typeof extras === 'number') { window.trackGameEvent(action, { score: extras }); }
    else { window.trackGameEvent(action, extras || {}); }
  }

  // boot
  updateHUD();
  track('game_start');
  window.restartGame = restartGame;
  requestAnimationFrame(loop);
})();