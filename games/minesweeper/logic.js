(function(){
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // Game config presets
  const PRESETS = {
    beginner: { rows: 9, cols: 9, mines: 10, cell: 32 },
    intermediate: { rows: 16, cols: 16, mines: 40, cell: 28 },
    expert: { rows: 16, cols: 30, mines: 99, cell: 24 }
  };

  let presetKey = 'intermediate';
  let rows, cols, mineCount, CELL;
  let grid; // each cell: {mine, revealed, flagged, adjacent}
  let firstClick;
  let running;
+ let paused = false;
  let flagsLeft;
  let startTime; let timerInterval; let elapsed = 0;

  const minesHUD = document.getElementById('mines');
  const timerHUD = document.getElementById('timer');
  const diffSelect = document.getElementById('difficulty');
  const restartBtn = document.getElementById('restartBtn');

  diffSelect.addEventListener('change', (e)=>{
    presetKey = e.target.value;
    startNewGame();
  });
  restartBtn.addEventListener('click', startNewGame);

  // Long press detection for mobile flagging
  let pointerDownTime = 0; let lastPointer = null; const LONG_PRESS_MS = 350;

  canvas.addEventListener('contextmenu', (e)=> e.preventDefault());
  canvas.addEventListener('pointerdown', (e)=>{
    pointerDownTime = Date.now();
    lastPointer = e;
  });
  canvas.addEventListener('pointerup', (e)=>{
    const dt = Date.now() - pointerDownTime;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / CELL);
    const y = Math.floor((e.clientY - rect.top) / CELL);
    if (dt >= LONG_PRESS_MS || e.button === 2) {
      toggleFlag(x,y);
    } else {
      reveal(x,y);
    }
  });

  function startNewGame(){
    const conf = PRESETS[presetKey] || PRESETS.intermediate;
    rows = conf.rows; cols = conf.cols; mineCount = conf.mines; CELL = conf.cell;
    resizeCanvas();
    grid = createGrid(rows, cols);
    firstClick = true;
    running = true;
+   paused = false;
    flagsLeft = mineCount;
    elapsed = 0;
    updateHUD();
    stopTimer();
    draw();
    track('game_start');
+   const pb = document.getElementById('pauseBtn');
+   if (pb) pb.textContent = 'Pause';
  }

  function resizeCanvas(){
    // Keep within max width, adjust height accordingly
    const maxW = Math.min(640, cols * CELL);
    canvas.width = cols * CELL;
    canvas.height = rows * CELL;
  }

  function createGrid(r,c){
    const g = new Array(r);
    for (let y=0;y<r;y++){
      g[y] = new Array(c);
      for (let x=0;x<c;x++){
        g[y][x] = { mine:false, revealed:false, flagged:false, adjacent:0 };
      }
    }
    return g;
  }

  function placeMines(excludeX, excludeY){
    let placed = 0;
    while(placed < mineCount){
      const x = Math.floor(Math.random()*cols);
      const y = Math.floor(Math.random()*rows);
      if (gcell(x,y).mine) continue;
      // avoid placing on first click area (safe start)
      if (Math.abs(x-excludeX)<=1 && Math.abs(y-excludeY)<=1) continue;
      gcell(x,y).mine = true;
      placed++;
    }
    // compute adjacent numbers
    for (let y=0;y<rows;y++){
      for (let x=0;x<cols;x++){
        gcell(x,y).adjacent = neighbors(x,y).reduce((n,[nx,ny])=> n + (gcell(nx,ny).mine?1:0), 0);
      }
    }
  }

  function gcell(x,y){
    if (x<0||x>=cols||y<0||y>=rows) return {mine:false,revealed:true,flagged:false,adjacent:0};
    return grid[y][x];
  }

  function neighbors(x,y){
    const res=[];
    for (let dy=-1; dy<=1; dy++) for (let dx=-1; dx<=1; dx++){
      if (dx===0 && dy===0) continue;
      const nx=x+dx, ny=y+dy;
      if (nx>=0&&nx<cols&&ny>=0&&ny<rows) res.push([nx,ny]);
    }
    return res;
  }

  function updateHUD(){
    minesHUD.textContent = '💣 ' + flagsLeft;
    timerHUD.textContent = '⏰ ' + Math.floor(elapsed);
  }

  function startTimer(){
-    startTime = Date.now();
+    // Continue from existing elapsed when resuming
+    startTime = Date.now() - Math.floor(elapsed * 1000);
    stopTimer();
    timerInterval = setInterval(()=>{
      elapsed = (Date.now() - startTime)/1000;
      updateHUD();
      draw();
    }, 250);
  }
  function stopTimer(){ if (timerInterval) { clearInterval(timerInterval); timerInterval = null; } }

  function reveal(x,y){
    if (!running) return;
    if (x<0||x>=cols||y<0||y>=rows) return;
    const cell = gcell(x,y);
    if (cell.flagged || cell.revealed) return;

    if (firstClick){
      placeMines(x,y);
      firstClick = false;
      startTimer();
    }

    cell.revealed = true;

    if (cell.mine){
      // lose
      running = false;
      stopTimer();
      revealAllMines();
      showGameOver(false);
      track('game_end', Math.floor(elapsed));
      return;
    }

    // If empty, flood fill
    if (cell.adjacent === 0){
      floodFill(x,y);
    }

    // Win check
    if (checkWin()){
      running = false;
      stopTimer();
      showGameOver(true);
      track('game_end', Math.floor(elapsed));
    } else {
      draw();
    }
  }

  function toggleFlag(x,y){
    if (!running) return;
    const cell = gcell(x,y);
    if (cell.revealed) return;
    cell.flagged = !cell.flagged;
    flagsLeft += cell.flagged ? -1 : 1;
    updateHUD();
    draw();
  }

  function floodFill(x,y){
    const q=[[x,y]];
    const visited=new Set();
    while(q.length){
      const [cx,cy]=q.shift();
      const key=cx+','+cy; if (visited.has(key)) continue; visited.add(key);
      const c = gcell(cx,cy);
      if (c.flagged||c.mine) continue;
      c.revealed=true;
      if (c.adjacent===0){
        neighbors(cx,cy).forEach(([nx,ny])=>{
          const nc=gcell(nx,ny);
          if (!nc.revealed && !nc.flagged) q.push([nx,ny]);
        });
      }
    }
  }

  function checkWin(){
    // Win when all non-mine cells revealed
    for (let y=0;y<rows;y++){
      for (let x=0;x<cols;x++){
        const c=gcell(x,y);
        if (!c.mine && !c.revealed) return false;
      }
    }
    return true;
  }

  function revealAllMines(){
    for (let y=0;y<rows;y++){
      for (let x=0;x<cols;x++){
        const c=gcell(x,y);
        if (c.mine) c.revealed = true;
      }
    }
  }

  function showGameOver(win){
    const over = document.getElementById('gameOverScreen');
    const title = document.getElementById('gameOverTitle');
    const msg = document.getElementById('gameOverMessage');
    title.textContent = win ? 'You Win!' : 'Game Over!';
    msg.textContent = win ? `Time: ${Math.floor(elapsed)}s` : 'You hit a mine!';
    over.style.display = 'block';
  }

  window.restartGame = function(){
    document.getElementById('gameOverScreen').style.display = 'none';
    startNewGame();
  }

  // Drawing
  function draw(){
    // background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // grid
    for (let y=0;y<rows;y++){
      for (let x=0;x<cols;x++){
        drawCell(x,y);
      }
    }
+
+    // pause overlay on top
+    if (paused && running){
+      ctx.fillStyle = 'rgba(0,0,0,0.5)';
+      ctx.fillRect(0,0,canvas.width,canvas.height);
+      ctx.fillStyle = '#ffffff';
+      ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
+      ctx.textAlign = 'center';
+      ctx.textBaseline = 'middle';
+      ctx.fillText('Paused - press P or tap Resume', canvas.width/2, canvas.height/2);
+    }
  }

  function drawCell(x,y){
    const c = gcell(x,y);
    const px = x*CELL, py = y*CELL;

    // cell base
    if (!c.revealed){
      ctx.fillStyle = '#0b1220';
      roundRect(px+1, py+1, CELL-2, CELL-2, 6, true);
      // flag
      if (c.flagged){
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(px+CELL*0.35, py+CELL*0.3);
        ctx.lineTo(px+CELL*0.7, py+CELL*0.38);
        ctx.lineTo(px+CELL*0.35, py+CELL*0.46);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#6b7280';
        ctx.fillRect(px+CELL*0.34, py+CELL*0.3, 2, CELL*0.5);
      }
      return;
    }

    // revealed cell
    ctx.fillStyle = '#111827';
    roundRect(px+1, py+1, CELL-2, CELL-2, 6, true);

    if (c.mine){
      // draw mine
      ctx.fillStyle = '#111827';
      roundRect(px+3, py+3, CELL-6, CELL-6, 6, true);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(px+CELL/2, py+CELL/2, Math.max(4, CELL*0.18), 0, Math.PI*2);
      ctx.fill();
      return;
    }

    if (c.adjacent>0){
      ctx.fillStyle = numberColor(c.adjacent);
      ctx.font = `bold ${Math.floor(CELL*0.5)}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(c.adjacent), px+CELL/2, py+CELL/2+1);
    }
  }

  function numberColor(n){
    switch(n){
      case 1: return '#60a5fa';
      case 2: return '#34d399';
      case 3: return '#f87171';
      case 4: return '#a78bfa';
      case 5: return '#fbbf24';
      case 6: return '#22d3ee';
      case 7: return '#f472b6';
      case 8: return '#9ca3af';
      default: return '#e5e7eb';
    }
  }

  function roundRect(x, y, w, h, r, fill){
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.arcTo(x+w, y, x+w, y+h, r);
    ctx.arcTo(x+w, y+h, x, y+h, r);
    ctx.arcTo(x, y+h, x, y, r);
    ctx.arcTo(x, y, x+w, y, r);
    ctx.closePath();
    if (fill) ctx.fill(); else ctx.stroke();
  }

  // Google Analytics events tracking
  function track(action, score){
    if (typeof window.trackGameEvent === 'function') {
      window.trackGameEvent(action, score);
    }
  }

-  // Keyboard shortcuts
-  window.addEventListener('keydown', (e)=>{
-    if (!running && (e.code==='Space' || e.key===' ')){
-      e.preventDefault();
-      window.restartGame();
-    }
-  });
+  // Keyboard shortcuts + Pause toggle standardization
+  window.addEventListener('keydown', (e)=>{
+    const code = e.code;
+    const isP = (e.key?.toLowerCase() === 'p');
+    const intercept = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyW','KeyA','KeyS','KeyD'].includes(code) || isP;
+    if (intercept) e.preventDefault();
+    // quick restart when game over
+    if (!running && (code==='Space' || e.key===' ')){
+      window.restartGame();
+      return;
+    }
+    // pause toggle while running
+    if (isP){
+      if (!running) return;
+      paused = !paused;
+      const pb = document.getElementById('pauseBtn');
+      if (pb) pb.textContent = paused ? 'Resume' : 'Pause';
+      if (paused){
+        stopTimer();
+        draw(); // render overlay once
+      } else {
+        if (!firstClick) startTimer(); // only resume timer after first reveal
+      }
+      track('pause_toggle', paused ? 1 : 0);
+    }
+  });
+
+  // Pause/Resume button
+  (function(){
+    const pb = document.getElementById('pauseBtn');
+    if (!pb) return;
+    pb.addEventListener('click', ()=>{
+      if (!running) return;
+      paused = !paused;
+      pb.textContent = paused ? 'Resume' : 'Pause';
+      if (paused){
+        stopTimer();
+        draw();
+      } else {
+        if (!firstClick) startTimer();
+      }
+      track('pause_toggle', paused ? 1 : 0);
+    });
+  })();
})();