(function(){
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const CELL = Math.floor(W/3);

  let board, player, ai, running, score, best;

  function reset(){
    board = Array(9).fill(null); // 0..8
    player = 'X';
    ai = 'O';
    running = true;
    score = 0;
    best = Number(localStorage.getItem('ttt_best')||0);
    updateHUD();
    hideGameOver();
    draw();
    track('game_start');
  }

  function updateHUD(){
    document.getElementById('score').textContent = 'Score: ' + score;
    document.getElementById('best').textContent = 'Best: ' + Math.max(best, score);
  }

  function indexToRC(i){ return {r: Math.floor(i/3), c: i%3}; }
  function rcToIndex(r,c){ return r*3 + c; }

  function draw(){
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0,0,W,H);

    // grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(CELL, 20); ctx.lineTo(CELL, H-20);
    ctx.moveTo(2*CELL, 20); ctx.lineTo(2*CELL, H-20);
    ctx.moveTo(20, CELL); ctx.lineTo(W-20, CELL);
    ctx.moveTo(20, 2*CELL); ctx.lineTo(W-20, 2*CELL);
    ctx.stroke();

    // draw marks
    for (let i=0;i<9;i++){
      const v = board[i]; if(!v) continue;
      const {r,c} = indexToRC(i);
      const x = c*CELL + CELL/2;
      const y = r*CELL + CELL/2;
      if (v==='X') drawX(x,y);
      else drawO(x,y);
    }
  }

  function drawX(x,y){
    const s = CELL*0.28;
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x-s,y-s); ctx.lineTo(x+s,y+s);
    ctx.moveTo(x+s,y-s); ctx.lineTo(x-s,y+s);
    ctx.stroke();
  }
  function drawO(x,y){
    const r = CELL*0.30;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(x,y,r,0,Math.PI*2);
    ctx.stroke();
  }

  function emptyIndices(){
    const arr=[]; for(let i=0;i<9;i++) if(!board[i]) arr.push(i); return arr;
  }

  const WINS = [
    [0,1,2],[3,4,5],[6,7,8], // rows
    [0,3,6],[1,4,7],[2,5,8], // cols
    [0,4,8],[2,4,6]          // diags
  ];

  function checkWinner(b=board){
    for (const [a,b1,c] of WINS){
      if (b[a] && b[a]===b[b1] && b[a]===b[c]) return b[a];
    }
    if (b.every(v=>v)) return 'D';
    return null;
  }

  function gameOver(message){
    running = false;
    document.getElementById('gameOverTitle').innerText = message;
    document.getElementById('finalScore').innerText = String(score);
    document.getElementById('gameOverScreen').style.display = 'block';
    best = Math.max(best, score);
    localStorage.setItem('ttt_best', String(best));
    document.getElementById('best').textContent = 'Best: ' + best;
    track('game_end', score);
  }

  function aiMove(){
    // Simple AI: 1) Win if possible 2) Block player's win 3) Take center 4) Take corner 5) Random
    const empties = emptyIndices();
    // helper try
    function tryWin(side){
      for(const i of empties){
        const b2 = board.slice(); b2[i]=side; if(checkWinner(b2)===side) return i;
      }
      return null;
    }
    let move = tryWin(ai);
    if (move===null) move = tryWin(player);
    if (move===null && !board[4]) move = 4;
    if (move===null){
      const corners = [0,2,6,8].filter(i=>empties.includes(i));
      if (corners.length) move = corners[Math.floor(Math.random()*corners.length)];
    }
    if (move===null){
      move = empties[Math.floor(Math.random()*empties.length)];
    }
    if (move!=null){
      board[move]=ai;
    }
  }

  function handleMove(i){
    if(!running || board[i]) return;
    board[i]=player;
    let res = checkWinner();
    if(res){
      if(res==='X'){ score += 1; updateHUD(); gameOver('You Win!'); }
      else if(res==='O'){ gameOver('You Lose!'); }
      else { gameOver("It's a Draw!"); }
      draw(); return;
    }
    aiMove();
    res = checkWinner();
    if(res){
      if(res==='X'){ score += 1; updateHUD(); gameOver('You Win!'); }
      else if(res==='O'){ gameOver('You Lose!'); }
      else { gameOver("It's a Draw!"); }
      draw(); return;
    }
    draw();
  }

  function getCellFromPoint(x,y){
    const c = Math.floor(x / CELL);
    const r = Math.floor(y / CELL);
    if(c<0||c>2||r<0||r>2) return -1;
    return rcToIndex(r,c);
  }

  canvas.addEventListener('click', (e)=>{
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const idx = getCellFromPoint(x,y);
    if (idx>=0) handleMove(idx);
  });

  // touch
  canvas.addEventListener('touchend', (e)=>{
    const t = e.changedTouches[0];
    const rect = canvas.getBoundingClientRect();
    const x = t.clientX - rect.left;
    const y = t.clientY - rect.top;
    const idx = getCellFromPoint(x,y);
    if (idx>=0) handleMove(idx);
  }, {passive:true});

  document.getElementById('restartBtn').addEventListener('click', restartGame);

  function restartGame(){
    document.getElementById('gameOverScreen').style.display = 'none';
    reset();
  }
  window.restartGame = restartGame;

  function track(action, score){
    if (typeof window.trackGameEvent === 'function') window.trackGameEvent(action, score);
  }

  reset();
})();