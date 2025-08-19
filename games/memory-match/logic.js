(function(){
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const THEMES = ['🍎','🍌','🍇','🍉','🍓','🍍','🥝','🍑','🍒','🥑','🍋','🍐','🍊','🍈','🥥','🥕'];

  let cols = 4, rows = 4; // default 4x4 (8 pairs)
  let cardW, cardH, gap=12, offsetX, offsetY;
  let board=[], revealed=[], matched=[], firstPick=-1, secondPick=-1, lock=false;
  let moves=0, score=0, pairsFound=0, totalPairs=(cols*rows)/2;
  let best = Number(localStorage.getItem('mm_best')||0);

  function layout(){
    cardW = Math.floor((canvas.width - (cols+1)*gap)/cols);
    cardH = Math.floor((canvas.height - (rows+1)*gap)/rows);
    offsetX = gap; offsetY = gap;
  }

  function init(level){
    if(level==='easy'){cols=4;rows=4;} else if(level==='medium'){cols=5;rows=4;} else if(level==='hard'){cols=6;rows=5;} else {cols=4;rows=4;}
    totalPairs=(cols*rows)/2|0;
    board=[]; revealed=[]; matched=[]; firstPick=secondPick=-1; lock=false; moves=0; score=0; pairsFound=0;

    const need = totalPairs;
    const icons = shuffle(THEMES.slice()).slice(0,need);
    const pool = shuffle([...icons, ...icons]);
    for(let i=0;i<cols*rows;i++) board[i]=pool[i]||'⭐';
    layout();
    updateHUD();
    hideGameOver();
    draw();
    track('game_start');
  }

  function updateHUD(){
    document.getElementById('score').textContent = 'Score: ' + score;
    document.getElementById('moves').textContent = 'Moves: ' + moves;
    document.getElementById('pairs').textContent = `Pairs: ${pairsFound}/${totalPairs}`;
    document.getElementById('best').textContent = 'Best: ' + Math.max(best, score);
  }

  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=(Math.random()* (i+1))|0; [a[i],a[j]]=[a[j],a[i]];} return a; }

  function draw(){
    ctx.fillStyle='#0f172a'; ctx.fillRect(0,0,canvas.width,canvas.height);
    for(let r=0;r<rows;r++){
      for(let c=0;c<cols;c++){
        const i=r*cols+c;
        const x=offsetX + c*(cardW+gap);
        const y=offsetY + r*(cardH+gap);
        const isShown = revealed[i] || matched[i];
        drawCard(x,y,cardW,cardH,isShown, board[i]);
      }
    }
  }

  function drawCard(x,y,w,h,shown,icon){
    ctx.fillStyle = shown? '#1f2937' : '#111827';
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth=2;
    roundRect(ctx,x,y,w,h,12,true,true);

    if(shown){
      ctx.font = Math.floor(Math.min(w,h)*0.5)+'px serif';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillStyle='#fbbf24';
      ctx.fillText(icon, x+w/2, y+h/2+2);
    } else {
      // back pattern
      ctx.strokeStyle='rgba(255,255,255,0.08)';
      for(let i=8;i<w;i+=12){ ctx.beginPath(); ctx.moveTo(x+i,y+6); ctx.lineTo(x+i,y+h-6); ctx.stroke(); }
    }
  }

  function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    if (typeof r === 'number') { r = {tl:r, tr:r, br:r, bl:r}; }
    ctx.beginPath();
    ctx.moveTo(x + r.tl, y);
    ctx.lineTo(x + w - r.tr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r.tr);
    ctx.lineTo(x + w, y + h - r.br);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
    ctx.lineTo(x + r.bl, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r.bl);
    ctx.lineTo(x, y + r.tl);
    ctx.quadraticCurveTo(x, y, x + r.tl, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  function posToIndex(x,y){
    for(let r=0;r<rows;r++){
      for(let c=0;c<cols;c++){
        const i=r*cols+c;
        const X=offsetX + c*(cardW+gap);
        const Y=offsetY + r*(cardH+gap);
        if(x>=X && x<=X+cardW && y>=Y && y<=Y+cardH) return i;
      }
    }
    return -1;
  }

  function onPick(i){
    if(lock || matched[i] || revealed[i]) return;
    revealed[i]=true; draw();
    if(firstPick<0){ firstPick=i; return; }
    if(secondPick<0){
      secondPick=i; lock=true; moves++;
      setTimeout(()=>{
        if(board[firstPick]===board[secondPick]){
          matched[firstPick]=matched[secondPick]=true;
          score += 100; pairsFound++;
        } else {
          revealed[firstPick]=revealed[secondPick]=false; 
          score = Math.max(0, score-10);
        }
        firstPick=secondPick=-1; lock=false; updateHUD(); draw();
        if(pairsFound===totalPairs){
          best=Math.max(best, score); localStorage.setItem('mm_best', String(best));
          document.getElementById('gameOverTitle').innerText='You Cleared All Pairs!';
          document.getElementById('finalScore').innerText=String(score);
          document.getElementById('finalMoves').innerText=String(moves);
          document.getElementById('gameOverScreen').style.display='block';
          track('game_end', score);
        }
      }, 700);
    }
  }

  canvas.addEventListener('click', (e)=>{
    const rect = canvas.getBoundingClientRect();
    onPick(posToIndex(e.clientX-rect.left, e.clientY-rect.top));
  });
  canvas.addEventListener('touchend', (e)=>{
    const t = e.changedTouches[0];
    const rect = canvas.getBoundingClientRect();
    onPick(posToIndex(t.clientX-rect.left, t.clientY-rect.top));
  }, {passive:true});

  document.getElementById('newGameBtn').addEventListener('click', ()=>init());
  document.getElementById('restartBtn').addEventListener('click', ()=>{
    document.getElementById('gameOverScreen').style.display='none';
    init();
  });
  window.restartGame = ()=>{
    document.getElementById('gameOverScreen').style.display='none';
    init();
  };

  function hideGameOver(){
    const el=document.getElementById('gameOverScreen'); if(el) el.style.display='none';
  }
  function track(action, score){
    if (typeof window.trackGameEvent === 'function') window.trackGameEvent(action, score);
  }

  // start
  init('easy');
})();