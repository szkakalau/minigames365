(function(){
  // Space Defender game logic
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  let score = 0;
  let best = Number(localStorage.getItem('space-defender_best') || 0);
  let running = true;
  
  // Game objects
  let player = {
    x: W / 2,
    y: H - 50,
    width: 40,
    height: 30,
    speed: 5,
    color: '#4ade80',
    moving: null // 'left', 'right', or null
  };
  
  let bullets = [];
  let enemies = [];
  let stars = [];
  
  // Game settings
  const enemySpawnRate = 60; // frames between enemy spawns
  let enemySpawnCounter = 0;
  let gameSpeed = 1;
  let level = 1;

  function init() {
    // Reset game state
    score = 0;
    running = true;
    player.x = W / 2;
    bullets = [];
    enemies = [];
    stars = [];
    gameSpeed = 1;
    level = 1;
    
    // Create initial stars
    for (let i = 0; i < 50; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 2 + 1
      });
    }
    
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
    // Update game speed and level based on score
    gameSpeed = 1 + Math.floor(score / 500) * 0.2;
    level = 1 + Math.floor(score / 500);
    
    // Move player based on input
    if (player.moving === 'left') {
      player.x = Math.max(player.width / 2, player.x - player.speed);
    } else if (player.moving === 'right') {
      player.x = Math.min(W - player.width / 2, player.x + player.speed);
    }
    
    // Update stars
    for (let i = 0; i < stars.length; i++) {
      stars[i].y += stars[i].speed * gameSpeed;
      if (stars[i].y > H) {
        stars[i].y = 0;
        stars[i].x = Math.random() * W;
      }
    }
    
    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      bullets[i].y -= bullets[i].speed;
      
      // Remove bullets that go off screen
      if (bullets[i].y < 0) {
        bullets.splice(i, 1);
        continue;
      }
      
      // Check for collisions with enemies
      for (let j = enemies.length - 1; j >= 0; j--) {
        if (checkCollision(bullets[i], enemies[j])) {
          // Increase score
          score += 10;
          
          // Remove bullet and enemy
          bullets.splice(i, 1);
          enemies.splice(j, 1);
          break;
        }
      }
    }
    
    // Update enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
      enemies[i].y += enemies[i].speed * gameSpeed;
      
      // Check if enemy has reached bottom
      if (enemies[i].y > H) {
        enemies.splice(i, 1);
        continue;
      }
      
      // Check for collision with player
      if (checkCollision(enemies[i], player)) {
        gameOver();
        return;
      }
    }
    
    // Spawn new enemies
    enemySpawnCounter++;
    if (enemySpawnCounter >= enemySpawnRate / gameSpeed) {
      spawnEnemy();
      enemySpawnCounter = 0;
    }
  }

  function draw(){
    // Clear canvas
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0,0,W,H);
    
    // Draw stars
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let i = 0; i < stars.length; i++) {
      ctx.beginPath();
      ctx.arc(stars[i].x, stars[i].y, stars[i].size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Draw player
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - player.height / 2);
    ctx.lineTo(player.x - player.width / 2, player.y + player.height / 2);
    ctx.lineTo(player.x + player.width / 2, player.y + player.height / 2);
    ctx.closePath();
    ctx.fill();
    
    // Draw bullets
    ctx.fillStyle = '#60a5fa';
    for (let i = 0; i < bullets.length; i++) {
      ctx.fillRect(
        bullets[i].x - bullets[i].width / 2,
        bullets[i].y - bullets[i].height / 2,
        bullets[i].width,
        bullets[i].height
      );
    }
    
    // Draw enemies
    for (let i = 0; i < enemies.length; i++) {
      ctx.fillStyle = enemies[i].color;
      ctx.beginPath();
      ctx.moveTo(enemies[i].x, enemies[i].y + enemies[i].height / 2);
      ctx.lineTo(enemies[i].x - enemies[i].width / 2, enemies[i].y - enemies[i].height / 2);
      ctx.lineTo(enemies[i].x + enemies[i].width / 2, enemies[i].y - enemies[i].height / 2);
      ctx.closePath();
      ctx.fill();
    }

    // Draw score overlay
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 12, 28);
    ctx.textAlign = 'right';
    ctx.fillText('Best: ' + best, W - 12, 28);
    
    // Draw level
    ctx.textAlign = 'center';
    ctx.fillText('Level: ' + level, W / 2, 28);
  }

  function gameOver(){
    running = false;
    best = Math.max(best, score);
    localStorage.setItem('space-defender_best', String(best));
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
  function spawnEnemy() {
    const enemy = {
      x: Math.random() * (W - 40) + 20,
      y: -30,
      width: 30 + Math.random() * 20,
      height: 30,
      speed: 2 + Math.random() * 2,
      color: `hsl(${Math.random() * 60 + 340}, 80%, 60%)`
    };
    enemies.push(enemy);
  }
  
  function fireBullet() {
    const bullet = {
      x: player.x,
      y: player.y - player.height / 2,
      width: 4,
      height: 15,
      speed: 10
    };
    bullets.push(bullet);
  }
  
  function checkCollision(obj1, obj2) {
    return (
      obj1.x < obj2.x + obj2.width / 2 &&
      obj1.x + obj1.width / 2 > obj2.x - obj2.width / 2 &&
      obj1.y < obj2.y + obj2.height / 2 &&
      obj1.y + obj1.height / 2 > obj2.y - obj2.height / 2
    );
  }
  
  // Input handling
  window.addEventListener('keydown', (e) => {
    if (!running) {
      if (e.code === 'Space' || e.key === ' ') restartGame();
      return;
    }
    
    if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      player.moving = 'left';
    } else if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      player.moving = 'right';
    } else if (e.code === 'Space' || e.key === ' ') {
      fireBullet();
    }
  });
  
  window.addEventListener('keyup', (e) => {
    if ((e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && player.moving === 'left') {
      player.moving = null;
    } else if ((e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') && player.moving === 'right') {
      player.moving = null;
    }
  });
  
  // Mobile controls
  canvas.addEventListener('pointerdown', (e) => {
    if (!running) {
      restartGame();
      return;
    }
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Top third of screen to fire
    if (y < H / 3) {
      fireBullet();
    } else {
      // Left half to move left, right half to move right
      player.moving = x < W / 2 ? 'left' : 'right';
    }
  });
  
  canvas.addEventListener('pointerup', () => {
    player.moving = null;
  });
  
  canvas.addEventListener('pointerout', () => {
    player.moving = null;
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