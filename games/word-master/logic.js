(function(){
  // Word Master game logic
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  let score = 0;
  let best = Number(localStorage.getItem('word-master_best') || 0);
  let running = true;
  
  // Game variables
  const commonWords = [
    'apple', 'beach', 'chair', 'dance', 'earth', 'fruit', 'green', 'happy',
    'igloo', 'juice', 'kite', 'lemon', 'music', 'night', 'ocean', 'paper',
    'queen', 'river', 'sugar', 'table', 'under', 'voice', 'water', 'xylophone',
    'yellow', 'zebra', 'bread', 'cloud', 'dream', 'eagle', 'flame', 'garden',
    'honey', 'island', 'jungle', 'knife', 'light', 'money', 'north', 'orange',
    'plant', 'quiet', 'radio', 'storm', 'tiger', 'umbrella', 'violin', 'window',
    'young', 'zesty'
  ];
  
  let currentWord = '';
  let typedWord = '';
  let timeLeft = 60; // 60 seconds game
  let timer = null;
  let letterTiles = [];
  const tileSize = 40;
  const tileGap = 10;
  let shakeTiles = false;
  let shakeTime = 0;

  function init() {
    score = 0;
    running = true;
    typedWord = '';
    timeLeft = 60;
    letterTiles = [];
    shakeTiles = false;
    
    // Generate a new word
    selectNewWord();
    
    // Start the timer
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(timer);
        gameOver();
      }
    }, 1000);
    
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
    // Update shake effect
    if (shakeTiles) {
      shakeTime++;
      if (shakeTime > 10) {
        shakeTiles = false;
        shakeTime = 0;
      }
    }
  }

  function draw(){
    // Clear canvas
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0,0,W,H);
    
    // Draw timer bar
    const timerWidth = (timeLeft / 60) * (W - 24);
    ctx.fillStyle = timeLeft < 10 ? '#ef4444' : '#3b82f6';
    ctx.fillRect(12, 40, timerWidth, 8);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.strokeRect(12, 40, W - 24, 8);
    
    // Draw current word tiles
    const totalWidth = letterTiles.length * (tileSize + tileGap) - tileGap;
    let startX = (W - totalWidth) / 2;
    
    for (let i = 0; i < letterTiles.length; i++) {
      const tile = letterTiles[i];
      let tileX = startX + i * (tileSize + tileGap);
      let tileY = H / 2 - 50;
      
      // Apply shake effect if needed
      if (shakeTiles) {
        tileX += Math.random() * 6 - 3;
        tileY += Math.random() * 6 - 3;
      }
      
      // Draw tile background
      ctx.fillStyle = tile.matched ? '#4ade80' : '#64748b';
      ctx.fillRect(tileX, tileY, tileSize, tileSize);
      
      // Draw letter
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tile.letter.toUpperCase(), tileX + tileSize / 2, tileY + tileSize / 2);
    }
    
    // Draw typed word
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedWord, W / 2, H / 2 + 50);
    
    // Draw input prompt
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '16px system-ui, -apple-system, sans-serif';
    ctx.fillText('Type your answer and press Enter', W / 2, H / 2 + 80);

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
    clearInterval(timer);
    best = Math.max(best, score);
    localStorage.setItem('word-master_best', String(best));
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
  function selectNewWord() {
    // Select a random word from the list
    currentWord = commonWords[Math.floor(Math.random() * commonWords.length)];
    
    // Create letter tiles
    letterTiles = [];
    for (let i = 0; i < currentWord.length; i++) {
      letterTiles.push({
        letter: currentWord[i],
        matched: false
      });
    }
  }
  
  function checkWord() {
    if (typedWord.toLowerCase() === currentWord) {
      // Correct word
      const wordLength = currentWord.length;
      score += wordLength * 10;
      
      // Mark all tiles as matched
      letterTiles.forEach(tile => tile.matched = true);
      
      // Select a new word after a short delay
      setTimeout(() => {
        selectNewWord();
        typedWord = '';
      }, 500);
    } else {
      // Wrong word
      shakeTiles = true;
      shakeTime = 0;
      typedWord = '';
    }
  }
  
  // Input handling
  window.addEventListener('keydown', (e) => {
    if (!running) {
      if (e.code === 'Space' || e.key === ' ' || e.code === 'Enter') restartGame();
      return;
    }
    
    if (e.code === 'Enter' || e.key === 'Enter') {
      // Submit word
      if (typedWord.length > 0) {
        checkWord();
      }
    } else if (e.code === 'Backspace') {
      // Delete last character
      typedWord = typedWord.slice(0, -1);
    } else if (e.key.length === 1 && e.key.match(/[a-z]/i)) {
      // Add letter (only allow letters)
      if (typedWord.length < 15) { // Limit word length
        typedWord += e.key.toLowerCase();
      }
    }
  });
  
  // Mobile input - create a virtual keyboard for mobile
  const mobileInput = document.createElement('input');
  mobileInput.type = 'text';
  mobileInput.style.position = 'absolute';
  mobileInput.style.opacity = '0';
  mobileInput.style.height = '0';
  mobileInput.style.width = '0';
  document.body.appendChild(mobileInput);
  
  canvas.addEventListener('pointerdown', () => {
    if (!running) {
      restartGame();
    } else {
      // Focus the hidden input field to bring up keyboard on mobile
      mobileInput.focus();
    }
  });
  
  mobileInput.addEventListener('input', (e) => {
    if (running) {
      typedWord = e.target.value.toLowerCase();
    }
  });
  
  mobileInput.addEventListener('keydown', (e) => {
    if (running && (e.code === 'Enter' || e.key === 'Enter')) {
      checkWord();
      mobileInput.value = '';
      e.preventDefault();
    }
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