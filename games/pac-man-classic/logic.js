class PacManClassic {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');
        this.dotsLeftElement = document.getElementById('dotsLeft');
        this.livesDisplay = document.getElementById('livesDisplay');
        
        // Game state
        this.gameRunning = false;
        this.gamePaused = false;
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.dotsLeft = 0;
        
        // Grid settings
        this.gridSize = 20;
        this.cols = Math.floor(this.canvas.width / this.gridSize);
        this.rows = Math.floor(this.canvas.height / this.gridSize);
        
        // Pac-Man
        this.pacman = {
            x: 14,
            y: 10,
            direction: 'right',
            nextDirection: 'right',
            mouthOpen: true,
            mouthTimer: 0
        };
        
        // Ghosts
        this.ghosts = [
            { x: 14, y: 8, direction: 'up', color: '#ff0000', scared: false, scaredTimer: 0 },
            { x: 13, y: 8, direction: 'down', color: '#ffb8ff', scared: false, scaredTimer: 0 },
            { x: 15, y: 8, direction: 'left', color: '#00ffff', scared: false, scaredTimer: 0 },
            { x: 14, y: 9, direction: 'right', color: '#ffb852', scared: false, scaredTimer: 0 }
        ];
        
        // Game objects
        this.maze = [];
        this.dots = [];
        this.powerPellets = [];
        this.fruits = [];
        
        // Power mode
        this.powerMode = false;
        this.powerModeTimer = 0;
        this.powerModeDuration = 300; // 5 seconds at 60fps
        
        // Controls
        this.keys = {
            left: false,
            right: false,
            up: false,
            down: false
        };
        
        // Touch controls
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.isTouching = false;
        
        // High score
        this.highScore = localStorage.getItem('pacmanHighScore') || 0;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupTouchControls();
        this.createMaze();
        this.startGame();
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            switch(e.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    this.pacman.nextDirection = 'left';
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.pacman.nextDirection = 'right';
                    e.preventDefault();
                    break;
                case 'ArrowUp':
                case 'KeyW':
                    this.pacman.nextDirection = 'up';
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.pacman.nextDirection = 'down';
                    e.preventDefault();
                    break;
                case 'Space':
                    this.togglePause();
                    e.preventDefault();
                    break;
            }
        });
        
        // Button controls
        document.getElementById('leftBtn').addEventListener('click', () => this.pacman.nextDirection = 'left');
        document.getElementById('rightBtn').addEventListener('click', () => this.pacman.nextDirection = 'right');
        document.getElementById('upBtn').addEventListener('click', () => this.pacman.nextDirection = 'up');
        document.getElementById('downBtn').addEventListener('click', () => this.pacman.nextDirection = 'down');
        
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        
        // Prevent context menu on long press
        document.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Handle visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.gameRunning) {
                this.gamePaused = true;
            }
        });
    }
    
    setupTouchControls() {
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.touchStartX = touch.clientX - rect.left;
            this.touchStartY = touch.clientY - rect.top;
            this.isTouching = true;
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (!this.isTouching) return;
            
            const touch = e.changedTouches[0];
            const rect = this.canvas.getBoundingClientRect();
            const endX = touch.clientX - rect.left;
            const endY = touch.clientY - rect.top;
            
            const deltaX = endX - this.touchStartX;
            const deltaY = endY - this.touchStartY;
            
            // Determine swipe direction
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX > 30) {
                    this.pacman.nextDirection = 'right';
                } else if (deltaX < -30) {
                    this.pacman.nextDirection = 'left';
                }
            } else {
                if (deltaY < -30) {
                    this.pacman.nextDirection = 'up';
                } else if (deltaY > 30) {
                    this.pacman.nextDirection = 'down';
                }
            }
            
            this.isTouching = false;
        });
        
        // Prevent scrolling
        document.body.addEventListener('touchstart', (e) => {
            if (e.target === this.canvas) {
                e.preventDefault();
            }
        }, { passive: false });
        
        document.body.addEventListener('touchend', (e) => {
            if (e.target === this.canvas) {
                e.preventDefault();
            }
        }, { passive: false });
        
        document.body.addEventListener('touchmove', (e) => {
            if (e.target === this.canvas) {
                e.preventDefault();
            }
        }, { passive: false });
    }
    
    createMaze() {
        // Simple maze layout (1 = wall, 0 = empty, 2 = dot, 3 = power pellet)
        const mazeLayout = [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,3,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,3,2,2,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1,1,1],
            [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,2,2,1],
            [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1,1,1],
            [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0,0,0],
            [1,1,1,1,1,1,2,1,1,0,1,1,0,0,0,0,1,1,0,1,1,2,1,1,1,1,1,1,1,1],
            [0,0,0,0,0,0,2,0,0,0,1,0,0,0,0,0,0,1,0,0,0,2,0,0,0,0,0,0,0,0],
            [1,1,1,1,1,1,2,1,1,0,1,0,0,0,0,0,0,1,0,1,1,2,1,1,1,1,1,1,1,1],
            [0,0,0,0,0,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,0,0,0,0,0,0,0],
            [1,1,1,1,1,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,1,1,1,1,1,1,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1,1,1],
            [1,3,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,3,2,2,1],
            [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1,2,1],
            [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,2,2,1],
            [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ];
        
        this.maze = [];
        this.dots = [];
        this.powerPellets = [];
        
        for (let row = 0; row < Math.min(mazeLayout.length, this.rows); row++) {
            this.maze[row] = [];
            for (let col = 0; col < Math.min(mazeLayout[row].length, this.cols); col++) {
                this.maze[row][col] = mazeLayout[row][col];
                
                if (mazeLayout[row][col] === 2) {
                    this.dots.push({ x: col, y: row });
                } else if (mazeLayout[row][col] === 3) {
                    this.powerPellets.push({ x: col, y: row });
                }
            }
        }
        
        this.dotsLeft = this.dots.length + this.powerPellets.length;
    }
    
    startGame() {
        this.gameRunning = true;
        this.gamePaused = false;
        this.gameLoop();
    }
    
    gameLoop() {
        if (!this.gameRunning) return;
        
        if (!this.gamePaused) {
            this.update();
        }
        
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        // Update Pac-Man mouth animation
        this.pacman.mouthTimer++;
        if (this.pacman.mouthTimer >= 10) {
            this.pacman.mouthOpen = !this.pacman.mouthOpen;
            this.pacman.mouthTimer = 0;
        }
        
        // Update Pac-Man movement
        this.updatePacMan();
        
        // Update ghosts
        this.updateGhosts();
        
        // Update power mode
        if (this.powerMode) {
            this.powerModeTimer--;
            if (this.powerModeTimer <= 0) {
                this.powerMode = false;
                this.ghosts.forEach(ghost => {
                    ghost.scared = false;
                    ghost.scaredTimer = 0;
                });
            }
        }
        
        // Check collisions
        this.checkCollisions();
        
        // Update UI
        this.updateUI();
        
        // Check win condition
        if (this.dotsLeft === 0) {
            this.nextLevel();
        }
    }
    
    updatePacMan() {
        // Try to change direction
        if (this.canMove(this.pacman.x, this.pacman.y, this.pacman.nextDirection)) {
            this.pacman.direction = this.pacman.nextDirection;
        }
        
        // Move Pac-Man
        if (this.canMove(this.pacman.x, this.pacman.y, this.pacman.direction)) {
            const newPos = this.getNewPosition(this.pacman.x, this.pacman.y, this.pacman.direction);
            this.pacman.x = newPos.x;
            this.pacman.y = newPos.y;
            
            // Handle tunnel effect
            if (this.pacman.x < 0) this.pacman.x = this.cols - 1;
            if (this.pacman.x >= this.cols) this.pacman.x = 0;
        }
    }
    
    updateGhosts() {
        this.ghosts.forEach(ghost => {
            if (ghost.scared && ghost.scaredTimer > 0) {
                ghost.scaredTimer--;
                if (ghost.scaredTimer <= 0) {
                    ghost.scared = false;
                }
            }
            
            // Simple AI: change direction randomly at intersections
            const possibleDirections = this.getPossibleDirections(ghost.x, ghost.y);
            if (possibleDirections.length > 2 || !this.canMove(ghost.x, ghost.y, ghost.direction)) {
                const validDirections = possibleDirections.filter(dir => dir !== this.getOppositeDirection(ghost.direction));
                if (validDirections.length > 0) {
                    ghost.direction = validDirections[Math.floor(Math.random() * validDirections.length)];
                }
            }
            
            // Move ghost
            if (this.canMove(ghost.x, ghost.y, ghost.direction)) {
                const newPos = this.getNewPosition(ghost.x, ghost.y, ghost.direction);
                ghost.x = newPos.x;
                ghost.y = newPos.y;
                
                // Handle tunnel effect
                if (ghost.x < 0) ghost.x = this.cols - 1;
                if (ghost.x >= this.cols) ghost.x = 0;
            }
        });
    }
    
    canMove(x, y, direction) {
        const newPos = this.getNewPosition(x, y, direction);
        
        // Handle tunnel
        if (newPos.x < 0 || newPos.x >= this.cols) return true;
        if (newPos.y < 0 || newPos.y >= this.rows) return false;
        
        return this.maze[newPos.y] && this.maze[newPos.y][newPos.x] !== 1;
    }
    
    getNewPosition(x, y, direction) {
        switch (direction) {
            case 'up': return { x, y: y - 1 };
            case 'down': return { x, y: y + 1 };
            case 'left': return { x: x - 1, y };
            case 'right': return { x: x + 1, y };
            default: return { x, y };
        }
    }
    
    getPossibleDirections(x, y) {
        const directions = ['up', 'down', 'left', 'right'];
        return directions.filter(dir => this.canMove(x, y, dir));
    }
    
    getOppositeDirection(direction) {
        const opposites = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        };
        return opposites[direction];
    }
    
    checkCollisions() {
        // Check dot collection
        this.dots = this.dots.filter(dot => {
            if (dot.x === this.pacman.x && dot.y === this.pacman.y) {
                this.score += 10;
                this.dotsLeft--;
                return false;
            }
            return true;
        });
        
        // Check power pellet collection
        this.powerPellets = this.powerPellets.filter(pellet => {
            if (pellet.x === this.pacman.x && pellet.y === this.pacman.y) {
                this.score += 50;
                this.dotsLeft--;
                this.activatePowerMode();
                return false;
            }
            return true;
        });
        
        // Check ghost collisions
        this.ghosts.forEach((ghost, index) => {
            if (ghost.x === this.pacman.x && ghost.y === this.pacman.y) {
                if (ghost.scared) {
                    // Eat ghost
                    this.score += 200;
                    ghost.scared = false;
                    ghost.scaredTimer = 0;
                    // Reset ghost position
                    ghost.x = 14;
                    ghost.y = 8;
                } else {
                    // Pac-Man dies
                    this.loseLife();
                }
            }
        });
    }
    
    activatePowerMode() {
        this.powerMode = true;
        this.powerModeTimer = this.powerModeDuration;
        this.ghosts.forEach(ghost => {
            ghost.scared = true;
            ghost.scaredTimer = this.powerModeDuration;
        });
    }
    
    loseLife() {
        this.lives--;
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            // Reset positions
            this.pacman.x = 14;
            this.pacman.y = 10;
            this.pacman.direction = 'right';
            this.pacman.nextDirection = 'right';
            
            this.ghosts.forEach((ghost, index) => {
                ghost.x = 14;
                ghost.y = 8;
                ghost.scared = false;
                ghost.scaredTimer = 0;
            });
            
            this.powerMode = false;
            this.powerModeTimer = 0;
        }
    }
    
    nextLevel() {
        this.level++;
        this.createMaze();
        
        // Reset positions
        this.pacman.x = 14;
        this.pacman.y = 10;
        this.pacman.direction = 'right';
        this.pacman.nextDirection = 'right';
        
        this.ghosts.forEach(ghost => {
            ghost.x = 14;
            ghost.y = 8;
            ghost.scared = false;
            ghost.scaredTimer = 0;
        });
        
        this.powerMode = false;
        this.powerModeTimer = 0;
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw maze
        this.drawMaze();
        
        // Draw dots
        this.drawDots();
        
        // Draw power pellets
        this.drawPowerPellets();
        
        // Draw Pac-Man
        this.drawPacMan();
        
        // Draw ghosts
        this.drawGhosts();
        
        // Draw pause overlay
        if (this.gamePaused) {
            this.drawPauseOverlay();
        }
    }
    
    drawMaze() {
        this.ctx.fillStyle = '#0000ff';
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.maze[row] && this.maze[row][col] === 1) {
                    this.ctx.fillRect(
                        col * this.gridSize,
                        row * this.gridSize,
                        this.gridSize,
                        this.gridSize
                    );
                }
            }
        }
    }
    
    drawDots() {
        this.ctx.fillStyle = '#ffff00';
        this.dots.forEach(dot => {
            this.ctx.beginPath();
            this.ctx.arc(
                dot.x * this.gridSize + this.gridSize / 2,
                dot.y * this.gridSize + this.gridSize / 2,
                2,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        });
    }
    
    drawPowerPellets() {
        this.ctx.fillStyle = '#ffff00';
        this.powerPellets.forEach(pellet => {
            this.ctx.beginPath();
            this.ctx.arc(
                pellet.x * this.gridSize + this.gridSize / 2,
                pellet.y * this.gridSize + this.gridSize / 2,
                6,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        });
    }
    
    drawPacMan() {
        const centerX = this.pacman.x * this.gridSize + this.gridSize / 2;
        const centerY = this.pacman.y * this.gridSize + this.gridSize / 2;
        const radius = this.gridSize / 2 - 2;
        
        this.ctx.fillStyle = '#ffff00';
        this.ctx.beginPath();
        
        if (this.pacman.mouthOpen) {
            let startAngle, endAngle;
            switch (this.pacman.direction) {
                case 'right':
                    startAngle = 0.2 * Math.PI;
                    endAngle = 1.8 * Math.PI;
                    break;
                case 'left':
                    startAngle = 1.2 * Math.PI;
                    endAngle = 0.8 * Math.PI;
                    break;
                case 'up':
                    startAngle = 1.7 * Math.PI;
                    endAngle = 1.3 * Math.PI;
                    break;
                case 'down':
                    startAngle = 0.7 * Math.PI;
                    endAngle = 0.3 * Math.PI;
                    break;
            }
            this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            this.ctx.lineTo(centerX, centerY);
        } else {
            this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        }
        
        this.ctx.fill();
    }
    
    drawGhosts() {
        this.ghosts.forEach(ghost => {
            const centerX = ghost.x * this.gridSize + this.gridSize / 2;
            const centerY = ghost.y * this.gridSize + this.gridSize / 2;
            const radius = this.gridSize / 2 - 2;
            
            if (ghost.scared) {
                this.ctx.fillStyle = ghost.scaredTimer > 60 ? '#0000ff' : '#ffffff';
            } else {
                this.ctx.fillStyle = ghost.color;
            }
            
            // Draw ghost body
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY - radius / 2, radius, Math.PI, 0);
            this.ctx.lineTo(centerX + radius, centerY + radius / 2);
            this.ctx.lineTo(centerX + radius / 2, centerY + radius);
            this.ctx.lineTo(centerX, centerY + radius / 2);
            this.ctx.lineTo(centerX - radius / 2, centerY + radius);
            this.ctx.lineTo(centerX - radius, centerY + radius / 2);
            this.ctx.closePath();
            this.ctx.fill();
            
            // Draw eyes
            if (!ghost.scared) {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.arc(centerX - radius / 3, centerY - radius / 3, radius / 4, 0, Math.PI * 2);
                this.ctx.arc(centerX + radius / 3, centerY - radius / 3, radius / 4, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.fillStyle = '#000000';
                this.ctx.beginPath();
                this.ctx.arc(centerX - radius / 3, centerY - radius / 3, radius / 6, 0, Math.PI * 2);
                this.ctx.arc(centerX + radius / 3, centerY - radius / 3, radius / 6, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }
    
    drawPauseOverlay() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#ffff00';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Press SPACE or Pause button to resume', this.canvas.width / 2, this.canvas.height / 2 + 50);
    }
    
    updateUI() {
        this.scoreElement.textContent = this.score;
        this.levelElement.textContent = this.level;
        this.dotsLeftElement.textContent = this.dotsLeft;
        
        // Update lives display
        this.livesDisplay.innerHTML = '';
        for (let i = 0; i < this.lives; i++) {
            const life = document.createElement('div');
            life.className = 'life';
            this.livesDisplay.appendChild(life);
        }
    }
    
    togglePause() {
        if (!this.gameRunning) return;
        this.gamePaused = !this.gamePaused;
        
        const pauseBtn = document.getElementById('pauseBtn');
        pauseBtn.textContent = this.gamePaused ? '▶️ Resume' : '⏸️ Pause';
    }
    
    gameOver() {
        this.gameRunning = false;
        
        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('pacmanHighScore', this.highScore);
        }
        
        // Show game over screen
        setTimeout(() => {
            alert(`Game Over!\nScore: ${this.score}\nLevel: ${this.level}\nHigh Score: ${this.highScore}`);
        }, 100);
    }
    
    restartGame() {
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.powerMode = false;
        this.powerModeTimer = 0;
        
        // Reset positions
        this.pacman.x = 14;
        this.pacman.y = 10;
        this.pacman.direction = 'right';
        this.pacman.nextDirection = 'right';
        
        this.ghosts.forEach((ghost, index) => {
            ghost.x = 14;
            ghost.y = 8;
            ghost.scared = false;
            ghost.scaredTimer = 0;
        });
        
        this.createMaze();
        this.startGame();
        document.getElementById('pauseBtn').textContent = '⏸️ Pause';
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new PacManClassic();
});

// Handle window resize
window.addEventListener('resize', () => {
    // Adjust canvas size if needed
    const canvas = document.getElementById('gameCanvas');
    const container = canvas.parentElement;
    const maxWidth = Math.min(container.clientWidth - 40, 600);
    const aspectRatio = 400 / 600;
    
    canvas.style.width = maxWidth + 'px';
    canvas.style.height = (maxWidth * aspectRatio) + 'px';
});

// Trigger initial resize
window.dispatchEvent(new Event('resize'));