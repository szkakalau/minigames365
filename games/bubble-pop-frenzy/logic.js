(function(){
  // Bubble Pop Frenzy game logic
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  let score = 0;
  let best = Number(localStorage.getItem('bubble-pop-frenzy_best') || 0);
  let running = true;
  
  // Game variables
  const bubbles = [];
  const colors = ['#FF5252', '#4CAF50', '#2196F3', '#FFEB3B', '#E040FB', '#FF9800'];
  const bubbleRadius = 30;
  const maxBubbles = 20;
  let selectedBubbles = [];
  let gameTime = 60; // 60 seconds game time
  let timeLeft = gameTime;

  function init() {
    score = 0;
    running = true;
    timeLeft = gameTime;
    bubbles.length = 0;
    selectedBubbles = [];
    
    // Generate initial bubbles
    for (let i = 0; i < 15; i++) {
      createBubble();
    }
    
    // Start timer
    lastTime = Date.now();
    
    draw();
    track('game_start');
    loop();
  }
  
  function createBubble() {
    if (bubbles.length >= maxBubbles) return;
    
    const radius = bubbleRadius;
    let x, y;
    let overlapping;
    let attempts = 0;
    
    // Try to place bubble without overlapping (max 10 attempts)
    do {
      overlapping = false;
      x = radius + Math.random() * (W - radius * 2);
      y = radius + Math.random() * (H - radius * 2);
      
      // Check overlap with existing bubbles
      for (let i = 0; i < bubbles.length; i++) {
        const dx = bubbles[i].x - x;
        const dy = bubbles[i].y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < radius * 2) {
          overlapping = true;
          break;
        }
      }
      
      attempts++;
    } while (overlapping && attempts < 10);
    
    // If we couldn't place without overlap after 10 attempts, just place it
    if (!overlapping || attempts >= 10) {
      const colorIndex = Math.floor(Math.random() * colors.length);
      bubbles.push({
        x: x,
        y: y,
        radius: radius,
        color: colors[colorIndex],
        colorIndex: colorIndex
      });
    }
  }

  function loop(){
    if (!running) return;
    update();
    draw();
    requestAnimationFrame(loop);
  }

  let lastTime = Date.now();
  
  function update(){
    const now = Date.now();
    const dt = (now - lastTime) / 1000; // Convert to seconds
    lastTime = now;
    
    // Update timer
    if (running) {
      timeLeft -= dt;
      if (timeLeft <= 0) {
        timeLeft = 0;
        gameOver();
        return;
      }
    }
    
    // Add new bubbles occasionally
    if (Math.random() < 0.02 && bubbles.length < maxBubbles) {
      createBubble();
    }
    
    // Check for matches
    if (selectedBubbles.length >= 3) {
      // Remove matched bubbles
      const colorToRemove = bubbles[selectedBubbles[0]].colorIndex;
      
      // Sort in reverse order to remove from end first
      selectedBubbles.sort((a, b) => b - a);
      
      // Remove bubbles
      for (let i = 0; i < selectedBubbles.length; i++) {
        bubbles.splice(selectedBubbles[i], 1);
      }
      
      // Add score based on match size
      const matchSize = selectedBubbles.length;
      const points = matchSize * matchSize * 10; // Squared for bigger combos
      score += points;
      
      // Add time bonus for matches
      timeLeft = Math.min(gameTime, timeLeft + matchSize * 0.5);
      
      // Clear selection
      selectedBubbles = [];
      
      // Add new bubbles
      for (let i = 0; i < Math.min(3, maxBubbles - bubbles.length); i++) {
        createBubble();
      }
    }
  }

  function draw(){
    // Clear canvas
    ctx.fillStyle = '#6A5ACD'; // Purple background
    ctx.fillRect(0,0,W,H);
    
    // Draw bubbles
    for (let i = 0; i < bubbles.length; i++) {
      const bubble = bubbles[i];
      
      // Draw bubble
      ctx.beginPath();
      ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
      ctx.fillStyle = bubble.color;
      ctx.fill();
      
      // Draw white stroke
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Highlight selected bubbles
      if (selectedBubbles.includes(i)) {
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.radius - 5, 0, Math.PI * 2);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }
    
    // Draw timer bar
    const timerWidth = (timeLeft / gameTime) * W;
    ctx.fillStyle = timeLeft < 10 ? '#FF5252' : '#4CAF50';
    ctx.fillRect(0, 0, timerWidth, 10);

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
    localStorage.setItem('bubble-pop-frenzy_best', String(best));
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

  // Handle bubble clicks
  canvas.addEventListener('pointerdown', (e) => {
    if (!running) {
      restartGame();
      return;
    }
    
    // Get click position relative to canvas
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Check if click hit any bubble
    for (let i = 0; i < bubbles.length; i++) {
      const bubble = bubbles[i];
      const dx = bubble.x - clickX;
      const dy = bubble.y - clickY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= bubble.radius) {
        // Bubble clicked!
        handleBubbleClick(i);
        break;
      }
    }
  });
  
  function handleBubbleClick(index) {
    // If no bubbles selected yet, select this one
    if (selectedBubbles.length === 0) {
      selectedBubbles.push(index);
      return;
    }
    
    // If this bubble is already selected, deselect it
    const alreadySelectedIndex = selectedBubbles.indexOf(index);
    if (alreadySelectedIndex !== -1) {
      selectedBubbles.splice(alreadySelectedIndex, 1);
      return;
    }
    
    // Check if this bubble matches the color of selected bubbles
    const firstBubbleColor = bubbles[selectedBubbles[0]].colorIndex;
    const clickedBubbleColor = bubbles[index].colorIndex;
    
    if (firstBubbleColor === clickedBubbleColor) {
      selectedBubbles.push(index);
    } else {
      // Different color, clear selection and select this one
      selectedBubbles = [index];
    }
  }
  
  // Keyboard controls
  window.addEventListener('keydown', (e) => {
    if (!running && (e.code === 'Space' || e.key === ' ')) restartGame();
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