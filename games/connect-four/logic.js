(function(){
  const COLS = 7, ROWS = 6;
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const cellSize = 70; // 7 cols => 490px width
  const offsetX = 0, offsetY = 0;

  let board = Array.from({length: ROWS}, ()=>Array(COLS).fill(0)); // 0 empty, 1 player, 2 ai
  let currentPlayer = 1; // 1 player first
  let gameOver = false;
  let paused = false;

  const pauseBtn = document.getElementById('pauseBtn');
  if (pauseBtn) pauseBtn.addEventListener('click', () => togglePause());

  function setPauseUI(){
    if (pauseBtn) pauseBtn.textContent = paused ? 'Resume' : 'Pause';
    const status = document.getElementById('gameStatus');
    if (status && !gameOver) status.textContent = paused ? 'Paused' : (currentPlayer === 1 ? 'Your Turn' : 'AI Thinking...');
  }

  function togglePause(){
    if (gameOver) return; // 仅在进行中可暂停
    paused = !paused;
    setPauseUI();
    drawBoard();
    if (typeof trackGameEvent === 'function') {
      trackGameEvent('pause_toggle', paused ? 'paused' : 'resumed');
    }
  }

  function drawBoard(){
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0,0,canvas.width, canvas.height);

    // board holes
    for(let r=0;r<ROWS;r++){
      for(let c=0;c<COLS;c++){
        const x = offsetX + c*cellSize + cellSize/2;
        const y = offsetY + r*cellSize + cellSize/2;
        // slot background
        ctx.fillStyle = '#0b1220';
        ctx.beginPath();
        ctx.arc(x, y, cellSize*0.45, 0, Math.PI*2);
        ctx.fill();

        // piece
        if(board[r][c] === 1){
          drawPiece(x,y,'#ef4444');
        }else if(board[r][c] === 2){
          drawPiece(x,y,'#e5e7eb');
        }
      }
    }

    // grid frame
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 2;
    for(let c=0;c<=COLS;c++){
      const x = c*cellSize + 0.5;
      ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for(let r=0;r<=ROWS;r++){
      const y = r*cellSize + 0.5;
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // paused overlay
    if (paused && !gameOver) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0,0,canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px system-ui, -apple-system, Segoe UI, Roboto';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Paused', canvas.width/2, canvas.height/2);
      ctx.restore();
    }
  }

  function drawPiece(x,y,color){
    const grad = ctx.createRadialGradient(x-6,y-6,4,x,y,cellSize*0.45);
    grad.addColorStop(0,'#ffffff');
    grad.addColorStop(0.1,color);
    grad.addColorStop(1,color);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, cellSize*0.42, 0, Math.PI*2);
    ctx.fill();
  }

  function dropInColumn(col, player){
    for(let r=ROWS-1; r>=0; r--){
      if(board[r][col] === 0){
        board[r][col] = player;
        return r;
      }
    }
    return -1; // column full
  }

  function isValidMove(col){
    return board[0][col] === 0;
  }

  function checkDirection(r,c, dr, dc, player){
    let count = 0;
    for(let i=-3;i<=3;i++){
      const rr = r + dr*i;
      const cc = c + dc*i;
      if(rr>=0 && rr<ROWS && cc>=0 && cc<COLS && board[rr][cc] === player){
        count++;
        if(count >= 4) return true;
      }else{
        count = 0;
      }
    }
    return false;
  }

  function checkWin(r,c, player){
    return checkDirection(r,c, 0,1, player) || // horizontal
           checkDirection(r,c, 1,0, player) || // vertical
           checkDirection(r,c, 1,1, player) || // diag \
           checkDirection(r,c, 1,-1, player);  // diag /
  }

  function getMouseCol(x){
    const col = Math.floor((x - offsetX) / cellSize);
    return Math.max(0, Math.min(COLS-1, col));
  }

  function setStatus(text){
    const el = document.getElementById('gameStatus');
    if(el) el.textContent = text;
  }

  function endGame(result){
    gameOver = true;
    setStatus(result);
    const over = document.getElementById('gameOverScreen');
    const title = document.getElementById('gameResult');
    if(over){
      if(title) title.textContent = result;
      over.style.display = 'block';
    }
    trackGameEvent && trackGameEvent('game_over', result);
  }

  function aiMove(){
    if(gameOver || paused) return;
    // 1) Winning move
    for(let c=0;c<COLS;c++){
      if(!isValidMove(c)) continue;
      const r = simulateDrop(c, 2);
      if(r>=0 && checkWin(r,c,2)){
        board[r][c] = 2; drawBoard();
        if(checkWin(r,c,2)) return endGame('AI Wins!');
        currentPlayer = 1; setStatus('Your Turn'); return;
      }
    }
    // 2) Block player winning move
    for(let c=0;c<COLS;c++){
      if(!isValidMove(c)) continue;
      const r = simulateDrop(c, 1);
      if(r>=0 && checkWin(r,c,1)){
        const rr = dropInColumn(c,2);
        drawBoard();
        if(checkWin(rr,c,2)) return endGame('AI Wins!');
        currentPlayer = 1; setStatus('Your Turn'); return;
      }
    }
    // 3) Prefer center
    const order = [3,2,4,1,5,0,6];
    for(const c of order){
      if(isValidMove(c)){
        const r = dropInColumn(c,2);
        drawBoard();
        if(checkWin(r,c,2)) return endGame('AI Wins!');
        currentPlayer = 1; setStatus('Your Turn'); return;
      }
    }
  }

  function simulateDrop(col, player){
    for(let r=ROWS-1; r>=0; r--){
      if(board[r][col] === 0){
        // temporarily place
        board[r][col] = player;
        const win = checkWin(r,col, player);
        board[r][col] = 0;
        if(win) return r;
        return r; // return landing row even if not winning, for logic
      }
    }
    return -1;
  }

  // 键盘：P 键切换暂停
  document.addEventListener('keydown', (e) => {
    if (e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      togglePause();
    }
  }, { passive: false });

  canvas.addEventListener('click', (e)=>{
    if(gameOver || paused || currentPlayer !== 1) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const col = getMouseCol(x);
    if(!isValidMove(col)) return;

    const r = dropInColumn(col, 1);
    drawBoard();
    if(checkWin(r, col, 1)) return endGame('You Win!');

    currentPlayer = 2; setStatus('AI Thinking...');
    trackGameEvent && trackGameEvent('player_move', `col_${col}`);
    setTimeout(() => { if(!paused) aiMove(); }, 300);
  });

  const restartBtn = document.getElementById('restartBtn');
  if(restartBtn){
    restartBtn.addEventListener('click', ()=> restartGame());
  }

  function restartGame(){
    board = Array.from({length: ROWS}, ()=>Array(COLS).fill(0));
    currentPlayer = 1; gameOver = false; paused = false; setPauseUI();
    drawBoard(); setStatus('Your Turn');
    const over = document.getElementById('gameOverScreen');
    if(over) over.style.display = 'none';
    trackGameEvent && trackGameEvent('restart_click');
  }
  window.restartGame = restartGame;

  drawBoard(); setStatus('Your Turn'); setPauseUI();
})();