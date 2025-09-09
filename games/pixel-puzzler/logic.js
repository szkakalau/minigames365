(function(){
  // Pixel Puzzler: 4x4 sliding puzzle (15 puzzle)
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const N = 4; // 4x4
  const TILE = 100; // logical tile size for drawing
  const PADDING = 8;

  let w = canvas.width, h = canvas.height;
  let moves = 0;
  let best = Number(localStorage.getItem('pixel-puzzler_best') || 0);
  let board = []; // 0..15 where 0 is empty
  let solvedOrder = Array.from({length:N*N}, (_,i)=>i);
  let anim = null; // simple animation state

  function init(){
    createSolved();
    shuffleBoard();
    moves = 0; updateHUD();
    draw();
  }

  function createSolved(){ board = solvedOrder.slice(); }

  function shuffleBoard(){
    // Perform random valid moves to ensure solvable configuration
    let emptyIndex = board.indexOf(0);
    for (let i=0;i<300;i++){
      const neighbors = getNeighborIndices(emptyIndex);
      const pick = neighbors[Math.floor(Math.random()*neighbors.length)];
      // swap empty with pick
      [board[emptyIndex], board[pick]] = [board[pick], board[emptyIndex]];
      emptyIndex = pick;
    }
  }

  function updateHUD(){
    const m = document.getElementById('moves'); if (m) m.textContent = 'Moves: '+moves;
    const b = document.getElementById('best'); if (b) b.textContent = 'Best: '+(best||'--');
  }

  function indexToRC(idx){ return {r: Math.floor(idx/N), c: idx%N}; }
  function rcToIndex(r,c){ return r*N+c; }

  function getNeighborIndices(emptyIdx){
    const {r,c} = indexToRC(emptyIdx);
    const res = [];
    if (r>0) res.push(rcToIndex(r-1,c));
    if (r<N-1) res.push(rcToIndex(r+1,c));
    if (c>0) res.push(rcToIndex(r,c-1));
    if (c<N-1) res.push(rcToIndex(r,c+1));
    return res;
  }

  function isSolved(){
    for (let i=0;i<N*N;i++) if (board[i]!==solvedOrder[i]) return false;
    return true;
  }

  function onClick(x,y){
    const cellSize = Math.min((w-2*PADDING)/N, (h-2*PADDING)/N);
    const offsetX = (w - cellSize*N)/2;
    const offsetY = (h - cellSize*N)/2;
    const c = Math.floor((x - offsetX)/cellSize);
    const r = Math.floor((y - offsetY)/cellSize);
    if (r<0||r>=N||c<0||c>=N) return;
    const idx = rcToIndex(r,c);
    moveTile(idx);
  }

  function moveTile(idx){
    const empty = board.indexOf(0);
    const {r:er,c:ec} = indexToRC(empty);
    const {r:tr,c:tc} = indexToRC(idx);
    const dr = Math.abs(er-tr), dc = Math.abs(ec-tc);
    if (dr+dc!==1) return; // only adjacent
    [board[empty], board[idx]] = [board[idx], board[empty]];
    moves++; updateHUD();
    draw();
    if (isSolved()) finish();
  }

  function finish(){
    if (!best || moves<best) { best=moves; localStorage.setItem('pixel-puzzler_best', String(best)); }
    const over = document.getElementById('gameOverScreen');
    const fm = document.getElementById('finalMoves'); if (fm) fm.textContent = String(moves);
    if (over) over.style.display='block';
  }

  function restartGame(){ const over = document.getElementById('gameOverScreen'); if (over) over.style.display='none'; shuffleGame(); }
  window.restartGame = restartGame;

  function shuffleGame(){ moves=0; updateHUD(); createSolved(); shuffleBoard(); draw(); }
  window.shuffleGame = shuffleGame;

  function solveGame(){ createSolved(); moves=0; updateHUD(); draw(); finish(); }
  window.solveGame = solveGame;

  function draw(){
    w = canvas.width; h = canvas.height;
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,w,h);

    const cellSize = Math.min((w-2*PADDING)/N, (h-2*PADDING)/N);
    const offsetX = (w - cellSize*N)/2;
    const offsetY = (h - cellSize*N)/2;

    ctx.font = Math.floor(cellSize*0.45)+'px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    for (let i=0;i<N*N;i++){
      const val = board[i];
      const {r,c} = indexToRC(i);
      const x = offsetX + c*cellSize;
      const y = offsetY + r*cellSize;

      // tile bg
      if (val!==0){
        ctx.fillStyle = '#22d3ee';
        roundRect(ctx, x+4, y+4, cellSize-8, cellSize-8, 10);
        ctx.fill();
        ctx.fillStyle = '#0b1220';
        ctx.fillText(String(val), x+cellSize/2, y+cellSize/2);
      } else {
        // empty
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        roundRect(ctx, x+4, y+4, cellSize-8, cellSize-8, 10);
        ctx.fill();
      }
    }
  }

  function roundRect(ctx, x, y, w, h, r){
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.arcTo(x+w, y, x+w, y+h, r);
    ctx.arcTo(x+w, y+h, x, y+h, r);
    ctx.arcTo(x, y+h, x, y, r);
    ctx.arcTo(x, y, x+w, y, r);
    ctx.closePath();
  }

  canvas.addEventListener('click', (e)=>{
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    // We drew in CSS pixels, so adjust back
    const dpr = window.devicePixelRatio||1;
    onClick(x/dpr, y/dpr);
  });

  function resize(){
    const dpr = window.devicePixelRatio||1;
    const width = Math.max(320, Math.min(window.innerWidth-24, 520));
    const height = width; // square canvas
    canvas.style.width = width+"px"; canvas.style.height = height+"px";
    canvas.width = Math.floor(width*dpr); canvas.height = Math.floor(height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    draw();
  }
  window.addEventListener('resize', resize);
  resize();
  init();
})();