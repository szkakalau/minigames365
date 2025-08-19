'use strict';

(function(){
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // Game state
  let running = false;
  let paused = false;
  let gameOver = false;
  let score = 0;
  let best = Number(localStorage.getItem('trex_best') || 0);
  let distance = 0; // meters
  let speed = 6; // base speed (px/frame)
  let gravity = 0.6;
  let jumpVelocity = -11.5;
  let groundY = 250;
  let frame = 0;

  document.getElementById('best').textContent = `Best: ${best}`;

  const player = {
    x: 60,
    y: groundY - 40,
    w: 44,
    h: 44,
    vy: 0,
    onGround: true,
    animTick: 0,
  };

  /** Obstacles: cacti and pterodactyls */
  const obstacles = [];

  function resetGame(){
    running = true;
    paused = false;
    gameOver = false;
    score = 0;
    distance = 0;
    speed = 6;
    frame = 0;
    obstacles.length = 0;
    player.y = groundY - player.h;
    player.vy = 0;
    player.onGround = true;

    document.getElementById('gameOverScreen').style.display = 'none';
    updateHUD();
  }

  function restartGame(){
    resetGame();
  }
  window.restartGame = restartGame;

  function togglePause(){
    if(!running || gameOver) return;
    paused = !paused;
    document.getElementById('pauseBtn').textContent = paused ? 'Resume' : 'Pause';
  }

  function updateHUD(){
    document.getElementById('score').textContent = `Score: ${Math.floor(score)}`;
    document.getElementById('distance').textContent = `Distance: ${Math.floor(distance)}m`;
    document.getElementById('speed').textContent = `Speed: ${speed.toFixed(1)}`;
    document.getElementById('best').textContent = `Best: ${best}`;
  }

  function spawnObstacle(){
    const type = Math.random() < 0.7 ? 'cactus' : 'ptero';
    let obs;
    if(type === 'cactus'){
      const variants = [20, 30, 40];
      const w = variants[Math.floor(Math.random()*variants.length)];
      obs = {type, x: canvas.width + 10, y: groundY - w, w: w, h: w, vy: 0};
    } else {
      const hOptions = [groundY - 80, groundY - 120, groundY - 160];
      const y = hOptions[Math.floor(Math.random()*hOptions.length)];
      obs = {type, x: canvas.width + 10, y: y, w: 46, h: 32, vy: (Math.random()<0.5?0.5:-0.5)};
    }
    obstacles.push(obs);
  }

  function handleSpawn(){
    // spawn based on distance and randomness
    if(frame % Math.max(35, 80 - Math.floor(speed*5)) === 0){
      if(Math.random() < 0.8) spawnObstacle();
    }
  }

  function jump(){
    if(player.onGround){
      player.vy = jumpVelocity;
      player.onGround = false;
      // analytics
      if(typeof gtag !== 'undefined') gtag('event', 'jump', {game_name: 't-rex-runner'});
    }
  }

  function update(){
    if(!running || paused || gameOver) return;

    frame++;
    // difficulty scaling
    speed += 0.0025; // slowly increases
    score += 0.2 + speed*0.02;
    distance += speed*0.07; // convert px/frame to meters-ish

    // player physics
    player.vy += gravity;
    player.y += player.vy;
    if(player.y >= groundY - player.h){
      player.y = groundY - player.h;
      player.vy = 0;
      player.onGround = true;
    }

    // obstacles
    for(let i=obstacles.length-1;i>=0;i--){
      const o = obstacles[i];
      o.x -= speed;
      if(o.type === 'ptero'){
        // small flap
        o.y += o.vy;
        if(o.y < groundY-170 || o.y > groundY-70) o.vy *= -1;
      }
      if(o.x + o.w < 0) obstacles.splice(i,1);
      else if(collide(player, o)){
        endGame();
        return;
      }
    }

    // spawn
    handleSpawn();

    // HUD
    updateHUD();

    // render
    render();

    requestAnimationFrame(update);
  }

  function endGame(){
    gameOver = true;
    running = false;
    if(score > best){
      best = Math.floor(score);
      localStorage.setItem('trex_best', best);
    }
    document.getElementById('finalDistance').textContent = `${Math.floor(distance)}m`;
    document.getElementById('finalScore').textContent = `${Math.floor(score)}`;
    document.getElementById('gameOverScreen').style.display = 'flex';

    if(typeof gtag !== 'undefined'){
      gtag('event', 'game_over', {
        game_name: 't-rex-runner',
        score: Math.floor(score),
        distance: Math.floor(distance)
      });
    }
  }

  function collide(a,b){
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function render(){
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // sky
    ctx.fillStyle = '#0b1220';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // ground line
    ctx.strokeStyle = '#2a3759';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY+2);
    ctx.lineTo(canvas.width, groundY+2);
    ctx.stroke();

    // player (simple trex)
    ctx.fillStyle = '#dfe7ff';
    drawTrex(player.x, player.y, player.w, player.h);

    // obstacles
    ctx.fillStyle = '#9fb4ff';
    obstacles.forEach(o =>{
      if(o.type==='cactus') drawCactus(o.x, o.y, o.w, o.h);
      else drawPtero(o.x, o.y, o.w, o.h);
    });

    // clouds
    drawParallax();
  }

  const clouds = Array.from({length:5},()=>({x:Math.random()*800,y:40+Math.random()*100,s:0.3+Math.random()*0.4}));
  function drawParallax(){
    ctx.fillStyle = 'rgba(223,231,255,0.35)';
    clouds.forEach(c=>{
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, 24, 12, 0, 0, Math.PI*2);
      ctx.fill();
      c.x -= c.s;
      if(c.x < -30){ c.x = canvas.width + Math.random()*200; c.y = 40+Math.random()*100;}
    });
  }

  function drawTrex(x,y,w,h){
    // body
    ctx.fillRect(x+8,y+8,w-16,h-16);
    // head
    ctx.fillRect(x+w-20,y+4,18,18);
    // eye
    ctx.fillStyle = '#0b1220';
    ctx.fillRect(x+w-8,y+10,4,4);
    // feet
    ctx.fillStyle = '#dfe7ff';
    const t = Math.floor(frame/6)%2;
    ctx.fillRect(x+8, y+h-6, 14, 6);
    ctx.fillRect(x+22, y+h-6, 14, 6);
    if(!player.onGround){
      ctx.fillRect(x+8, y+h-6, 14, 6);
    } else if(t===0){
      ctx.fillRect(x+8, y+h-10, 14, 6);
    }
  }

  function drawCactus(x,y,w,h){
    ctx.fillRect(x, y, w, h);
  }

  function drawPtero(x,y,w,h){
    ctx.save();
    ctx.translate(x,y);
    ctx.fillRect(0,0,w,h/4);
    const flap = Math.sin(frame/5)*8;
    ctx.fillRect(-w/2, h/4, w + flap, 6);
    ctx.restore();
  }

  // Input
  function onKey(e){
    if(e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW'){
      e.preventDefault();
      jump();
    }else if(e.code === 'KeyP'){
      togglePause();
    }
  }
  document.addEventListener('keydown', onKey);
  canvas.addEventListener('mousedown', jump);
  canvas.addEventListener('touchstart', function(e){ e.preventDefault(); jump(); }, {passive:false});
  document.getElementById('pauseBtn').addEventListener('click', togglePause);

  // Start game when page ready
  function start(){
    if(running) return;
    resetGame();
    requestAnimationFrame(update);
  }
  window.addEventListener('load', start);
})();