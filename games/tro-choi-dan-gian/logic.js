(function(){
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const N = 15; // 15x15 grid
  const cell = Math.floor(Math.min(W, H) / N);
  const offsetX = Math.floor((W - cell * N) / 2);
  const offsetY = Math.floor((H - cell * N) / 2);

  const board = Array.from({length: N}, () => Array(N).fill(0)); // 0 empty, 1 player, 2 ai
  let playerTurn = true;
  let score = 0, wins = Number(localStorage.getItem('trochoi_best')||0);

  function drawBoard(){
    ctx.fillStyle = '#f3e6c8';
    ctx.fillRect(0,0,W,H);

    ctx.strokeStyle = '#b38b58';
    ctx.lineWidth = 1;
    for(let i=0;i<=N;i++){
      // vertical
      ctx.beginPath();
      ctx.moveTo(offsetX + i*cell + 0.5, offsetY + 0.5);
      ctx.lineTo(offsetX + i*cell + 0.5, offsetY + N*cell + 0.5);
      ctx.stroke();
      // horizontal
      ctx.beginPath();
      ctx.moveTo(offsetX + 0.5, offsetY + i*cell + 0.5);
      ctx.lineTo(offsetX + N*cell + 0.5, offsetY + i*cell + 0.5);
      ctx.stroke();
    }

    // stones
    for(let y=0;y<N;y++){
      for(let x=0;x<N;x++){
        if(board[y][x]===0) continue;
        const cx = offsetX + x*cell + cell/2;
        const cy = offsetY + y*cell + cell/2;
        ctx.beginPath();
        ctx.arc(cx, cy, cell*0.35, 0, Math.PI*2);
        ctx.fillStyle = board[y][x]===1 ? '#222' : '#fff';
        ctx.fill();
        ctx.strokeStyle = '#00000055';
        ctx.stroke();
      }
    }
  }

  function indexFromPos(mx,my){
    const x = Math.floor((mx - offsetX) / cell);
    const y = Math.floor((my - offsetY) / cell);
    if (x<0||y<0||x>=N||y>=N) return null;
    return {x,y};
  }

  function place(x,y,who){
    if(board[y][x]!==0) return false;
    board[y][x] = who;
    if (who===1) score += 1;
    updateHUD();
    const winner = checkWin(x,y,who);
    if (winner){
      endGame(who===1 ? 'Bạn Thắng!' : 'Máy Thắng!');
      return true;
    }
    return true;
  }

  function countDir(x,y,dx,dy,who){
    let c=0;
    let i=x+dx, j=y+dy;
    while(i>=0&&j>=0&&i<N&&j<N&&board[j][i]===who){c++; i+=dx; j+=dy;}
    return c;
  }

  function checkWin(x,y,who){
    const dirs = [[1,0],[0,1],[1,1],[1,-1]];
    for(const [dx,dy] of dirs){
      const total = 1 + countDir(x,y,dx,dy,who) + countDir(x,y,-dx,-dy,who);
      if (total>=5) return true;
    }
    return false;
  }

  function aiMove(){
    // simple heuristic: try win, block player 4, else random near center
    let bestMove = null;
    function tryList(moves, who){
      for(const [x,y] of moves){
        if(board[y][x]!==0) continue;
        board[y][x]=who;
        const win = checkWin(x,y,who);
        board[y][x]=0;
        if(win) return {x,y};
      }
      return null;
    }

    const all = [];
    for(let y=0;y<N;y++) for(let x=0;x<N;x++) if(board[y][x]===0) all.push([x,y]);

    // attempt win
    bestMove = tryList(all,2);
    if (bestMove) return place(bestMove.x,bestMove.y,2);

    // block player
    bestMove = tryList(all,1);
    if (bestMove) return place(bestMove.x,bestMove.y,2);

    // otherwise choose closest to center
    all.sort((a,b)=>dist2(a,center())-dist2(b,center()));
    const [rx,ry] = all[0] || [Math.floor(N/2), Math.floor(N/2)];
    return place(rx,ry,2);
  }

  function center(){return [Math.floor(N/2),Math.floor(N/2)];}
  function dist2(a,b){return (a[0]-b[0])**2+(a[1]-b[1])**2;}

  function updateHUD(){
    document.getElementById('score').textContent = 'Điểm: ' + score;
    document.getElementById('wins').textContent = 'Thắng: ' + wins;
    document.getElementById('best').textContent = 'Tốt Nhất: ' + Math.max(wins, score);
  }

  function endGame(message){
    if (message.includes('Bạn Thắng')) {
      wins += 1;
      localStorage.setItem('trochoi_best', String(wins));
    }
    document.getElementById('finalScore').textContent = score;
    const screen = document.getElementById('gameOverScreen');
    document.getElementById('gameOverTitle').textContent = message;
    screen.style.display = 'block';
    track('game_end', score);
  }

  function track(action, score){ if (typeof window.trackGameEvent==='function') window.trackGameEvent(action, score); }

  canvas.addEventListener('click', (e)=>{
    const rect = canvas.getBoundingClientRect();
    const pos = indexFromPos(e.clientX-rect.left, e.clientY-rect.top);
    if(!pos) return;
    if(!playerTurn) return;
    if(!place(pos.x,pos.y,1)) return;
    track('place');
    playerTurn = false;
    setTimeout(()=>{ aiMove(); playerTurn = true; draw(); }, 200);
    draw();
  });

  function newGame(){
    for(let y=0;y<N;y++) for(let x=0;x<N;x++) board[y][x]=0;
    playerTurn = true;
    score = 0;
    updateHUD();
    draw();
    track('game_start');
  }

  window.newGame = newGame;
  document.getElementById('newGameBtn').addEventListener('click', newGame);

  drawBoard();
  function draw(){ drawBoard(); }
  newGame();
})();