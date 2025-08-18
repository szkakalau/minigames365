(function(){
  const size = 4;
  let board = createEmptyBoard();
  let score = 0;
  let best = Number(localStorage.getItem('pc_best_2048')||0);
  const canvas = document.getElementById('board');
  const ctx = canvas.getContext('2d');
  const cell = canvas.width / size;

  document.getElementById('score').textContent = 'Score: ' + score;
  document.getElementById('best').textContent = 'Best: ' + best;
  document.getElementById('restartBtn').addEventListener('click', restart);

  function createEmptyBoard(){
    return Array.from({length: size}, () => Array(size).fill(0));
  }

  function addRandomTile(){
    const empty = [];
    for(let r=0;r<size;r++){
      for(let c=0;c<size;c++) if(board[r][c]===0) empty.push([r,c]);
    }
    if(empty.length===0) return;
    const [r,c] = empty[Math.floor(Math.random()*empty.length)];
    board[r][c] = Math.random()<0.9?2:4;
  }

  function restart(){
    board = createEmptyBoard();
    score = 0;
    addRandomTile();
    addRandomTile();
    draw();
    updateHUD();
  }

  function updateHUD(){
    document.getElementById('score').textContent = 'Score: ' + score;
    if(score>best){ best=score; localStorage.setItem('pc_best_2048', best); }
    document.getElementById('best').textContent = 'Best: ' + best;
  }

  function slideRowLeft(row){
    const filtered = row.filter(v=>v!==0);
    const merged = [];
    for(let i=0;i<filtered.length;i++){
      if(filtered[i]===filtered[i+1]){
        const val = filtered[i]*2;
        score += val;
        merged.push(val);
        i++;
      } else {
        merged.push(filtered[i]);
      }
    }
    while(merged.length<size) merged.push(0);
    return merged;
  }

  function rotateClockwise(mat){
    const res = createEmptyBoard();
    for(let r=0;r<size;r++){
      for(let c=0;c<size;c++){
        res[c][size-1-r] = mat[r][c];
      }
    }
    return res;
  }

  function rotateCounter(mat){
    const res = createEmptyBoard();
    for(let r=0;r<size;r++){
      for(let c=0;c<size;c++){
        res[size-1-c][r] = mat[r][c];
      }
    }
    return res;
  }

  function equalBoards(a,b){
    for(let r=0;r<size;r++){
      for(let c=0;c<size;c++) if(a[r][c]!==b[r][c]) return false;
    }
    return true;
  }

  function moveLeft(){
    const before = board.map(row=>row.slice());
    for(let r=0;r<size;r++) board[r] = slideRowLeft(board[r]);
    if(!equalBoards(before, board)) { addRandomTile(); draw(); updateHUD(); checkGameOver(); }
  }
  function moveRight(){
    const before = board.map(row=>row.slice());
    for(let r=0;r<size;r++) board[r] = slideRowLeft(board[r].slice().reverse()).reverse();
    if(!equalBoards(before, board)) { addRandomTile(); draw(); updateHUD(); checkGameOver(); }
  }
  function moveUp(){
    const before = board.map(row=>row.slice());
    board = rotateCounter(board);
    for(let r=0;r<size;r++) board[r] = slideRowLeft(board[r]);
    board = rotateClockwise(board);
    if(!equalBoards(before, board)) { addRandomTile(); draw(); updateHUD(); checkGameOver(); }
  }
  function moveDown(){
    const before = board.map(row=>row.slice());
    board = rotateCounter(board);
    for(let r=0;r<size;r++) board[r] = slideRowLeft(board[r].slice().reverse()).reverse();
    board = rotateClockwise(board);
    if(!equalBoards(before, board)) { addRandomTile(); draw(); updateHUD(); checkGameOver(); }
  }

  function checkGameOver(){
    // any empty
    for(let r=0;r<size;r++) for(let c=0;c<size;c++) if(board[r][c]===0) return;
    // any mergeable neighbors
    for(let r=0;r<size;r++){
      for(let c=0;c<size;c++){
        const v = board[r][c];
        if((r+1<size && board[r+1][c]===v) || (c+1<size && board[r][c+1]===v)) return;
      }
    }
    setTimeout(()=>alert('Game Over! Score: '+score), 50);
  }

  function tileColor(v){
    const map = {
      0: '#0f172a', 2:'#164e63', 4:'#155e75', 8:'#0e7490', 16:'#0891b2', 32:'#06b6d4', 64:'#22d3ee', 128:'#67e8f9', 256:'#a5f3fc', 512:'#f59e0b', 1024:'#fbbf24', 2048:'#fcd34d'
    };
    return map[v] || '#fde68a';
  }

  function draw(){
    ctx.clearRect(0,0,canvas.width, canvas.height);
    for(let r=0;r<size;r++){
      for(let c=0;c<size;c++){
        const x=c*cell, y=r*cell;
        const v = board[r][c];
        ctx.fillStyle = tileColor(v);
        ctx.fillRect(x+6, y+6, cell-12, cell-12);
        if(v){
          ctx.fillStyle = v<=8? '#ecfeff' : '#0b1220';
          ctx.font = 'bold 22px system-ui, -apple-system, Segoe UI, Roboto';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(v, x + cell/2, y + cell/2);
        }
      }
    }
  }

  // input handlers
  document.addEventListener('keydown', (e)=>{
    switch(e.key){
      case 'ArrowLeft': e.preventDefault(); moveLeft(); break;
      case 'ArrowRight': e.preventDefault(); moveRight(); break;
      case 'ArrowUp': e.preventDefault(); moveUp(); break;
      case 'ArrowDown': e.preventDefault(); moveDown(); break;
    }
  }, {passive:false});

  let touchStartX=0, touchStartY=0;
  canvas.addEventListener('touchstart', (e)=>{
    const t = e.touches[0]; touchStartX = t.clientX; touchStartY = t.clientY;
  }, {passive:true});
  canvas.addEventListener('touchend', (e)=>{
    const t = e.changedTouches[0]; const dx = t.clientX - touchStartX; const dy = t.clientY - touchStartY;
    if(Math.abs(dx) > Math.abs(dy)){
      if(dx>20) moveRight(); else if(dx<-20) moveLeft();
    } else {
      if(dy>20) moveDown(); else if(dy<-20) moveUp();
    }
  }, {passive:true});

  // init
  restart();
})();