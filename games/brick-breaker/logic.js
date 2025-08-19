(function(){
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  let paddle, ball, bricks, cols=12, rows=6, brickW, brickH=24, gap=6, offsetTop=60, offsetLeft=30;
  let score=0, level=1, lives=3, best=Number(localStorage.getItem('bb_best')||0);
  let running=true;

  function resetLevel(){
    paddle={x:canvas.width/2-60, y:canvas.height-30, w:120, h:14, speed:10};
    ball={x:canvas.width/2, y:canvas.height-60, r:8, vx:4*Math.sign(Math.random()-0.5), vy:-5};
    brickW = Math.floor((canvas.width - offsetLeft*2 - (cols-1)*gap)/cols);
    bricks=[];
    for(let r=0;r<rows;r++){
      for(let c=0;c<cols;c++){
        bricks.push({x:offsetLeft + c*(brickW+gap), y:offsetTop + r*(brickH+gap), w:brickW, h:brickH, alive:true, hp:1});
      }
    }
    updateHUD();
  }

  function nextLevel(){
    level++; rows = Math.min(9, rows+1); 
    ball.vx *= 1.05; ball.vy *= 1.08;
    resetLevel();
  }

  function update(){
    if(!running) return;
    // ball move
    ball.x += ball.vx; ball.y += ball.vy;

    // wall collision
    if(ball.x-ball.r<0){ball.x=ball.r; ball.vx*=-1}
    if(ball.x+ball.r>canvas.width){ball.x=canvas.width-ball.r; ball.vx*=-1}
    if(ball.y-ball.r<0){ball.y=ball.r; ball.vy*=-1}

    // bottom
    if(ball.y - ball.r > canvas.height){
      lives--; updateHUD();
      if(lives<=0){
        gameOver();
      } else {
        ball.x=canvas.width/2; ball.y=canvas.height-60; ball.vx=4*Math.sign(Math.random()-0.5); ball.vy=-5;
      }
    }

    // paddle follow mouse targetX
    if(typeof paddle.targetX==='number'){
      const dx = paddle.targetX - (paddle.x + paddle.w/2);
      if(Math.abs(dx)>1) paddle.x += Math.sign(dx) * Math.min(Math.abs(dx), paddle.speed);
    }

    // paddle bounds
    paddle.x = Math.max(0, Math.min(canvas.width - paddle.w, paddle.x));

    // ball-paddle
    if(rectCircleCollide(paddle.x,paddle.y,paddle.w,paddle.h, ball.x,ball.y,ball.r)){
      ball.y = paddle.y - ball.r; ball.vy = -Math.abs(ball.vy);
      const hit = (ball.x - (paddle.x + paddle.w/2)) / (paddle.w/2);
      ball.vx = hit * 6; // angle control
    }

    // ball-bricks
    let remaining=0;
    for(const b of bricks){
      if(!b.alive){continue;} remaining++;
      if(rectCircleCollide(b.x,b.y,b.w,b.h, ball.x,ball.y,ball.r)){
        b.alive=false; score+=10; updateHUD();
        // reflect
        ball.vy*=-1; 
      }
    }

    if(remaining===0){
      score+=100; updateHUD(); nextLevel();
    }
  }

  function draw(){
    ctx.fillStyle='#0f172a'; ctx.fillRect(0,0,canvas.width,canvas.height);

    // paddle
    ctx.fillStyle='#22d3ee'; roundRect(ctx,paddle.x,paddle.y,paddle.w,paddle.h,8,true,false);

    // ball
    ctx.fillStyle='#f59e0b'; ctx.beginPath(); ctx.arc(ball.x,ball.y,ball.r,0,Math.PI*2); ctx.fill();

    // bricks
    for(const b of bricks){
      if(!b.alive) continue;
      ctx.fillStyle='#1f2937'; ctx.strokeStyle='rgba(255,255,255,0.1)'; ctx.lineWidth=2;
      roundRect(ctx,b.x,b.y,b.w,b.h,6,true,true);
    }
  }

  function loop(){
    update(); draw(); requestAnimationFrame(loop);
  }

  function updateHUD(){
    document.getElementById('score').innerText = 'Score: ' + score;
    document.getElementById('level').innerText = 'Level: ' + level;
    document.getElementById('lives').innerText = 'Lives: ' + lives;
    document.getElementById('bricks').innerText = 'Bricks: ' + bricks.filter(b=>b.alive).length;
    const b = Math.max(best, score); document.getElementById('best').innerText = 'Best: ' + b;
  }

  function gameOver(){
    running=false; best=Math.max(best, score); localStorage.setItem('bb_best', String(best));
    document.getElementById('gameOverTitle').innerText='Game Over';
    document.getElementById('finalScore').innerText=String(score);
    document.getElementById('finalLevel').innerText=String(level);
    document.getElementById('gameOverScreen').style.display='block';
    track('game_end', score);
  }

  // utils
  function rectCircleCollide(rx,ry,rw,rh, cx,cy,cr){
    const cx1=Math.max(rx, Math.min(cx, rx+rw));
    const cy1=Math.max(ry, Math.min(cy, ry+rh));
    const dx=cx-cx1, dy=cy-cy1; return dx*dx+dy*dy <= cr*cr;
  }

  function roundRect(ctx,x,y,w,h,r,fill,stroke){
    if(typeof r==='number') r={tl:r,tr:r,br:r,bl:r};
    ctx.beginPath();
    ctx.moveTo(x+r.tl,y);
    ctx.lineTo(x+w-r.tr,y);
    ctx.quadraticCurveTo(x+w,y,x+w,y+r.tr);
    ctx.lineTo(x+w,y+h-r.br);
    ctx.quadraticCurveTo(x+w,y+h,x+w-r.br,y+h);
    ctx.lineTo(x+r.bl,y+h);
    ctx.quadraticCurveTo(x,y+h,x,y+h-r.bl);
    ctx.lineTo(x,y+r.tl);
    ctx.quadraticCurveTo(x,y,x+r.tl,y);
    ctx.closePath(); if(fill) ctx.fill(); if(stroke) ctx.stroke();
  }

  // input
  canvas.addEventListener('mousemove', (e)=>{
    const rect=canvas.getBoundingClientRect();
    const x=e.clientX-rect.left; paddle.targetX=x;
  });
  canvas.addEventListener('touchmove', (e)=>{
    const t=e.touches[0]; const rect=canvas.getBoundingClientRect();
    paddle.targetX=t.clientX-rect.left; e.preventDefault();
  }, {passive:false});

  document.getElementById('pauseBtn').addEventListener('click', ()=>{running=!running;});
  document.getElementById('restartBtn').addEventListener('click', ()=>{location.reload();});
  window.restartGame = ()=>{location.reload();};
  function track(action, score){ if (typeof window.trackGameEvent==='function') window.trackGameEvent(action, score); }

  resetLevel(); loop();
})();