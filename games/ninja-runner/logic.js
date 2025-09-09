(function(){
  // Ninja Runner game logic
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  let score = 0;
  let best = Number(localStorage.getItem('ninja-runner_best') || 0);
  let running = true;
  
  // Game objects
  const ninja = {
    x: 80,
    y: H - 80,
    width: 40,
    height: 50,
    jumping: false,
    sliding: false,
    jumpHeight: 150,
    jumpSpeed: 0,
    gravity: 0.8,
    slideTime: 0,
    slideMaxTime: 45
  };
  
  // Game variables
  let obstacles = [];
  let coins = [];
  let ground = H - 30;
  let speed = 5;
  let obstacleTimer = 0;
  let coinTimer = 0;
  let distance = 0;
  let backgroundX = 0;

  function init() {
    score = 0;
    running = true;
    ninja.y = H - 80;
    ninja.jumping = false;
    ninja.sliding = false;
    ninja.jumpSpeed = 0;
    obstacles = [];
    coins = [];
    speed = 5;
    obstacleTimer = 0;
    coinTimer = 0;
    distance = 0;
    backgroundX = 0;
    
    draw();
    track('game_start');
    loop();
  }

  function loop(){
    if (!running) return;
    update();
    draw();
    requestAnimationFrame(loop);
  }

  function update(){
    // Increase distance and score
    distance += speed;
    if (distance % 100 === 0) {
      score += 1;
    }
    
    // Increase speed over time
    if (distance % 1000 === 0) {
      speed += 0.5;
    }
    
    // Update background
    backgroundX -= speed / 2;
    if (backgroundX <= -W) {
      backgroundX = 0;
    }
    
    // Update ninja
    if (ninja.jumping) {
      ninja.y += ninja.jumpSpeed;
      ninja.jumpSpeed += ninja.gravity;
      
      // Check if landed
      if (ninja.y >= ground - ninja.height) {
        ninja.y = ground - ninja.height;
        ninja.jumping = false;
        ninja.jumpSpeed = 0;
      }
    }
    
    // Update sliding
    if (ninja.sliding) {
      ninja.slideTime++;
      if (ninja.slideTime >= ninja.slideMaxTime) {
        ninja.sliding = false;
        ninja.slideTime = 0;
        ninja.height = 50; // Return to normal height
      }
    }
    
    // Spawn obstacles
    obstacleTimer++;
    if (obstacleTimer >= 100 - speed * 5) {
      spawnObstacle();
      obstacleTimer = 0;
    }
    
    // Spawn coins
    coinTimer++;
    if (coinTimer >= 150 - speed * 3) {
      spawnCoin();
      coinTimer = 0;
    }
    
    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      obstacles[i].x -= speed;
      
      // Remove obstacles that are off screen
      if (obstacles[i].x + obstacles[i].width < 0) {
        obstacles.splice(i, 1);
        continue;
      }
      
      // Check for collision
      if (checkCollision(ninja, obstacles[i])) {
        gameOver();
        return;
      }
    }
    
    // Update coins
    for (let i = coins.length - 1; i >= 0; i--) {
      coins[i].x -= speed;
      
      // Remove coins that are off screen
      if (coins[i].x + coins[i].size < 0) {
        coins.splice(i, 1);
        continue;
      }
      
      // Check for collection
      if (checkCollision(ninja, coins[i])) {
        score += 5;
        coins.splice(i, 1);
      }
    }
  }

  function draw(){
    // Clear canvas
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0,0,W,H);
    
    // Draw background (stars)
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let i = 0; i < 50; i++) {
      const x = (i * 30 + backgroundX) % W;
      const y = 50 + Math.sin(i * 0.5) * 30;
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Draw ground
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, ground, W, H - ground);
    
    // Draw obstacles
    ctx.fillStyle = '#ef4444';
    for (let i = 0; i < obstacles.length; i++) {
      const obstacle = obstacles[i];
      if (obstacle.type === 'high') {
        // High obstacle (jump over)
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      } else {
        // Low obstacle (slide under)
        ctx.beginPath();
        ctx.moveTo(obstacle.x, obstacle.y);
        ctx.lineTo(obstacle.x + obstacle.width, obstacle.y);
        ctx.lineTo(obstacle.x + obstacle.width / 2, obstacle.y - obstacle.height);
        ctx.closePath();
        ctx.fill();
      }
    }
    
    // Draw coins
    ctx.fillStyle = '#fbbf24';
    for (let i = 0; i < coins.length; i++) {
      const coin = coins[i];
      ctx.beginPath();
      ctx.arc(coin.x, coin.y, coin.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Draw ninja
    ctx.fillStyle = '#4ade80';
    if (ninja.sliding) {
      // Draw sliding ninja (lower height, longer width)
      ctx.fillRect(ninja.x - ninja.width / 2, ninja.y - ninja.height / 2 + 15, ninja.width + 10, ninja.height - 15);
    } else {
      // Draw standing/jumping ninja
      ctx.fillRect(ninja.x - ninja.width / 2, ninja.y - ninja.height / 2, ninja.width, ninja.height);
    }

    // Draw score overlay
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 12, 28);
    ctx.textAlign = 'right';
    ctx.fillText('Best: ' + best, W - 12, 28);
  }

  function gameOver(){
    running = false;
    best = Math.max(best, score);
    localStorage.setItem('ninja-runner_best', String(best));
    document.getElementById('finalScore').textContent = score;
    const over = document.getElementById('gameOverScreen');
    over.style.display = 'block';
    track('game_end', score);
  }

  function restartGame(){
    const over = document.getElementById('gameOverScreen');
    over.style.display = 'none';
    init();
  }

  // Helper functions
  function spawnObstacle() {
    const type = Math.random() > 0.5 ? 'high' : 'low';
    const obstacle = {
      x: W,
      y: ground,
      width: 30,
      height: type === 'high' ? 40 : 20,
      type: type
    };
    
    obstacles.push(obstacle);
  }
  
  function spawnCoin() {
    const coin = {
      x: W,
      y: ground - 50 - Math.random() * 50,
      size: 20
    };
    
    coins.push(coin);
  }
  
  function checkCollision(obj1, obj2) {
    // Simple box collision
    const obj1Left = obj1.x - obj1.width / 2;
    const obj1Right = obj1.x + obj1.width / 2;
    const obj1Top = obj1.y - obj1.height / 2;
    const obj1Bottom = obj1.y + obj1.height / 2;
    
    const obj2Left = obj2.x;
    const obj2Right = obj2.x + (obj2.width || obj2.size);
    const obj2Top = obj2.y - (obj2.height || obj2.size / 2);
    const obj2Bottom = obj2.y + (obj2.height || obj2.size / 2);
    
    return (
      obj1Right > obj2Left &&
      obj1Left < obj2Right &&
      obj1Bottom > obj2Top &&
      obj1Top < obj2Bottom
    );
  }
  
  function jump() {
    if (!ninja.jumping && !ninja.sliding) {
      ninja.jumping = true;
      ninja.jumpSpeed = -15;
    }
  }
  
  function slide() {
    if (!ninja.jumping && !ninja.sliding) {
      ninja.sliding = true;
      ninja.slideTime = 0;
      ninja.height = 25; // Lower height while sliding
    }
  }
  
  // Input handling
  window.addEventListener('keydown', (e) => {
    if (!running) {
      if (e.code === 'Space' || e.key === ' ') restartGame();
      return;
    }
    
    if (e.code === 'Space' || e.key === ' ' || e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      jump();
    } else if (e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      slide();
    }
  });
  
  // Touch controls
  let touchStartY = 0;
  
  canvas.addEventListener('touchstart', (e) => {
    if (!running) {
      restartGame();
      return;
    }
    
    touchStartY = e.touches[0].clientY;
  });
  
  canvas.addEventListener('touchend', (e) => {
    if (!running) return;
    
    const touchEndY = e.changedTouches[0].clientY;
    const touchDiff = touchEndY - touchStartY;
    
    if (touchDiff > 50) {
      // Swipe down - slide
      slide();
    } else {
      // Tap - jump
      jump();
    }
  });
  
  // Mouse controls
  canvas.addEventListener('pointerdown', (e) => {
    if (!running) {
      restartGame();
      return;
    }
    
    jump();
  });

  // Expose restart
  window.restartGame = restartGame;

  function track(action, score){
    if (typeof window.trackGameEvent === 'function') {
      window.trackGameEvent(action, score);
    }
  }

  // boot
  init();
})();