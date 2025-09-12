class PlatformJumper {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.gameState = 'playing'; // playing, paused, gameOver, levelComplete
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.coins = 0;
        this.isMuted = false;
        
        // Player properties
        this.player = {
            x: 50,
            y: 300,
            width: 30,
            height: 40,
            velocityX: 0,
            velocityY: 0,
            speed: 5,
            jumpPower: 15,
            onGround: false,
            color: '#e74c3c',
            direction: 1 // 1 for right, -1 for left
        };
        
        // Game world
        this.gravity = 0.8;
        this.friction = 0.8;
        this.camera = { x: 0, y: 0 };
        
        // Game objects
        this.platforms = [];
        this.enemies = [];
        this.collectibles = [];
        this.particles = [];
        
        // Input handling
        this.keys = {};
        this.touchControls = {
            left: false,
            right: false,
            jump: false
        };
        
        // Level data
        this.levelData = {
            1: {
                platforms: [
                    { x: 0, y: 380, width: 200, height: 20 },
                    { x: 250, y: 320, width: 100, height: 20 },
                    { x: 400, y: 260, width: 100, height: 20 },
                    { x: 550, y: 200, width: 100, height: 20 },
                    { x: 700, y: 140, width: 100, height: 20 },
                    { x: 850, y: 200, width: 100, height: 20 },
                    { x: 1000, y: 300, width: 200, height: 20 }
                ],
                enemies: [
                    { x: 300, y: 290, width: 25, height: 25, speed: 1, direction: 1, patrol: 80 },
                    { x: 600, y: 170, width: 25, height: 25, speed: 1.5, direction: -1, patrol: 60 },
                    { x: 900, y: 170, width: 25, height: 25, speed: 1, direction: 1, patrol: 70 }
                ],
                collectibles: [
                    { x: 280, y: 290, type: 'coin', value: 10 },
                    { x: 430, y: 230, type: 'coin', value: 10 },
                    { x: 580, y: 170, type: 'coin', value: 10 },
                    { x: 730, y: 110, type: 'coin', value: 10 },
                    { x: 1050, y: 270, type: 'gem', value: 50 }
                ],
                goal: { x: 1100, y: 250, width: 40, height: 50 }
            },
            2: {
                platforms: [
                    { x: 0, y: 380, width: 150, height: 20 },
                    { x: 200, y: 350, width: 80, height: 20 },
                    { x: 320, y: 300, width: 60, height: 20 },
                    { x: 420, y: 250, width: 80, height: 20 },
                    { x: 550, y: 200, width: 60, height: 20 },
                    { x: 650, y: 150, width: 80, height: 20 },
                    { x: 780, y: 180, width: 100, height: 20 },
                    { x: 920, y: 220, width: 80, height: 20 },
                    { x: 1050, y: 280, width: 150, height: 20 }
                ],
                enemies: [
                    { x: 230, y: 320, width: 25, height: 25, speed: 1.2, direction: 1, patrol: 60 },
                    { x: 450, y: 220, width: 25, height: 25, speed: 1.5, direction: -1, patrol: 50 },
                    { x: 680, y: 120, width: 25, height: 25, speed: 1, direction: 1, patrol: 60 },
                    { x: 950, y: 190, width: 25, height: 25, speed: 1.3, direction: -1, patrol: 70 }
                ],
                collectibles: [
                    { x: 230, y: 320, type: 'coin', value: 10 },
                    { x: 350, y: 270, type: 'coin', value: 10 },
                    { x: 450, y: 220, type: 'coin', value: 10 },
                    { x: 580, y: 170, type: 'coin', value: 10 },
                    { x: 680, y: 120, type: 'gem', value: 50 },
                    { x: 810, y: 150, type: 'coin', value: 10 },
                    { x: 1100, y: 250, type: 'gem', value: 50 }
                ],
                goal: { x: 1150, y: 230, width: 40, height: 50 }
            }
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadLevel(this.level);
        this.gameLoop();
        this.updateUI();
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Mobile controls
        const leftBtn = document.getElementById('leftBtn');
        const rightBtn = document.getElementById('rightBtn');
        const jumpBtn = document.getElementById('jumpBtn');
        
        // Touch events for mobile controls
        leftBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchControls.left = true;
        });
        
        leftBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touchControls.left = false;
        });
        
        rightBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchControls.right = true;
        });
        
        rightBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touchControls.right = false;
        });
        
        jumpBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchControls.jump = true;
        });
        
        jumpBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touchControls.jump = false;
        });
        
        // Control buttons
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('restartBtn').addEventListener('click', () => this.restart());
        document.getElementById('muteBtn').addEventListener('click', () => this.toggleMute());
        
        // Prevent scrolling on mobile
        document.addEventListener('touchmove', (e) => {
            if (e.target.closest('.mobile-controls')) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Handle visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.gameState === 'playing') {
                this.togglePause();
            }
        });
    }
    
    loadLevel(levelNum) {
        const data = this.levelData[levelNum];
        if (!data) {
            this.gameWon();
            return;
        }
        
        // Reset player position
        this.player.x = 50;
        this.player.y = 300;
        this.player.velocityX = 0;
        this.player.velocityY = 0;
        this.camera.x = 0;
        
        // Load level data
        this.platforms = [...data.platforms];
        this.enemies = data.enemies.map(enemy => ({
            ...enemy,
            startX: enemy.x,
            velocityX: enemy.speed * enemy.direction
        }));
        this.collectibles = [...data.collectibles];
        this.goal = { ...data.goal };
        
        this.gameState = 'playing';
    }
    
    gameLoop() {
        if (this.gameState === 'playing') {
            this.update();
        }
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        this.handleInput();
        this.updatePlayer();
        this.updateEnemies();
        this.updateCamera();
        this.updateParticles();
        this.checkCollisions();
    }
    
    handleInput() {
        // Horizontal movement
        if (this.keys['ArrowLeft'] || this.keys['KeyA'] || this.touchControls.left) {
            this.player.velocityX = -this.player.speed;
            this.player.direction = -1;
        } else if (this.keys['ArrowRight'] || this.keys['KeyD'] || this.touchControls.right) {
            this.player.velocityX = this.player.speed;
            this.player.direction = 1;
        } else {
            this.player.velocityX *= this.friction;
        }
        
        // Jumping
        if ((this.keys['Space'] || this.keys['ArrowUp'] || this.keys['KeyW'] || this.touchControls.jump) && this.player.onGround) {
            this.player.velocityY = -this.player.jumpPower;
            this.player.onGround = false;
            this.createParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height, '#74b9ff', 5);
        }
    }
    
    updatePlayer() {
        // Apply gravity
        this.player.velocityY += this.gravity;
        
        // Update position
        this.player.x += this.player.velocityX;
        this.player.y += this.player.velocityY;
        
        // Reset ground state
        this.player.onGround = false;
        
        // Platform collision
        for (let platform of this.platforms) {
            if (this.checkRectCollision(this.player, platform)) {
                // Top collision (landing on platform)
                if (this.player.velocityY > 0 && this.player.y < platform.y) {
                    this.player.y = platform.y - this.player.height;
                    this.player.velocityY = 0;
                    this.player.onGround = true;
                }
                // Bottom collision (hitting platform from below)
                else if (this.player.velocityY < 0 && this.player.y > platform.y) {
                    this.player.y = platform.y + platform.height;
                    this.player.velocityY = 0;
                }
                // Side collisions
                else if (this.player.velocityX > 0) {
                    this.player.x = platform.x - this.player.width;
                } else if (this.player.velocityX < 0) {
                    this.player.x = platform.x + platform.width;
                }
            }
        }
        
        // World boundaries
        if (this.player.x < 0) {
            this.player.x = 0;
        }
        
        // Fall off the world
        if (this.player.y > this.canvas.height) {
            this.loseLife();
        }
    }
    
    updateEnemies() {
        for (let enemy of this.enemies) {
            // Move enemy
            enemy.x += enemy.velocityX;
            
            // Patrol behavior
            if (Math.abs(enemy.x - enemy.startX) > enemy.patrol) {
                enemy.velocityX *= -1;
            }
            
            // Platform edge detection
            let onPlatform = false;
            for (let platform of this.platforms) {
                if (enemy.y + enemy.height >= platform.y && 
                    enemy.y + enemy.height <= platform.y + platform.height &&
                    enemy.x + enemy.width > platform.x && 
                    enemy.x < platform.x + platform.width) {
                    onPlatform = true;
                    break;
                }
            }
            
            if (!onPlatform) {
                enemy.velocityX *= -1;
            }
        }
    }
    
    updateCamera() {
        // Follow player with some offset
        const targetX = this.player.x - this.canvas.width / 3;
        this.camera.x += (targetX - this.camera.x) * 0.1;
        
        // Keep camera within bounds
        this.camera.x = Math.max(0, this.camera.x);
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.velocityX;
            particle.y += particle.velocityY;
            particle.velocityY += 0.2; // gravity
            particle.life--;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    checkCollisions() {
        // Enemy collisions
        for (let enemy of this.enemies) {
            if (this.checkRectCollision(this.player, enemy)) {
                this.loseLife();
                return;
            }
        }
        
        // Collectible collisions
        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const collectible = this.collectibles[i];
            if (this.checkRectCollision(this.player, { x: collectible.x, y: collectible.y, width: 20, height: 20 })) {
                this.score += collectible.value;
                if (collectible.type === 'coin') {
                    this.coins++;
                }
                this.createParticles(collectible.x + 10, collectible.y + 10, '#ffd700', 8);
                this.collectibles.splice(i, 1);
            }
        }
        
        // Goal collision
        if (this.checkRectCollision(this.player, this.goal)) {
            this.levelComplete();
        }
    }
    
    checkRectCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    createParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                velocityX: (Math.random() - 0.5) * 6,
                velocityY: (Math.random() - 0.5) * 6 - 2,
                color: color,
                life: 30 + Math.random() * 20
            });
        }
    }
    
    draw() {
        // Clear canvas with gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87ceeb');
        gradient.addColorStop(1, '#98fb98');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Save context for camera transform
        this.ctx.save();
        this.ctx.translate(-this.camera.x, 0);
        
        // Draw platforms
        this.ctx.fillStyle = '#8b4513';
        for (let platform of this.platforms) {
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            
            // Platform highlight
            this.ctx.fillStyle = '#a0522d';
            this.ctx.fillRect(platform.x, platform.y, platform.width, 3);
            this.ctx.fillStyle = '#8b4513';
        }
        
        // Draw enemies
        this.ctx.fillStyle = '#e74c3c';
        for (let enemy of this.enemies) {
            this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            
            // Enemy eyes
            this.ctx.fillStyle = '#fff';
            this.ctx.fillRect(enemy.x + 5, enemy.y + 5, 4, 4);
            this.ctx.fillRect(enemy.x + 16, enemy.y + 5, 4, 4);
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(enemy.x + 6, enemy.y + 6, 2, 2);
            this.ctx.fillRect(enemy.x + 17, enemy.y + 6, 2, 2);
            this.ctx.fillStyle = '#e74c3c';
        }
        
        // Draw collectibles
        for (let collectible of this.collectibles) {
            if (collectible.type === 'coin') {
                this.ctx.fillStyle = '#ffd700';
                this.ctx.beginPath();
                this.ctx.arc(collectible.x + 10, collectible.y + 10, 8, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Coin shine
                this.ctx.fillStyle = '#ffed4e';
                this.ctx.beginPath();
                this.ctx.arc(collectible.x + 7, collectible.y + 7, 3, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (collectible.type === 'gem') {
                this.ctx.fillStyle = '#9b59b6';
                this.ctx.fillRect(collectible.x + 5, collectible.y, 10, 20);
                this.ctx.fillRect(collectible.x, collectible.y + 5, 20, 10);
                
                // Gem shine
                this.ctx.fillStyle = '#bb77d6';
                this.ctx.fillRect(collectible.x + 7, collectible.y + 2, 6, 6);
            }
        }
        
        // Draw goal
        this.ctx.fillStyle = '#2ecc71';
        this.ctx.fillRect(this.goal.x, this.goal.y, this.goal.width, this.goal.height);
        
        // Goal flag
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.fillRect(this.goal.x + 5, this.goal.y, 20, 15);
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(this.goal.x + 10, this.goal.y + 5, 10, 5);
        
        // Draw player
        this.ctx.fillStyle = this.player.color;
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Player face
        this.ctx.fillStyle = '#fff';
        const eyeOffset = this.player.direction > 0 ? 5 : 20;
        this.ctx.fillRect(this.player.x + eyeOffset, this.player.y + 8, 4, 4);
        this.ctx.fillRect(this.player.x + eyeOffset, this.player.y + 18, 4, 4);
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(this.player.x + eyeOffset + 1, this.player.y + 9, 2, 2);
        this.ctx.fillRect(this.player.x + eyeOffset + 1, this.player.y + 19, 2, 2);
        
        // Draw particles
        for (let particle of this.particles) {
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.life / 50;
            this.ctx.fillRect(particle.x, particle.y, 3, 3);
        }
        this.ctx.globalAlpha = 1;
        
        // Restore context
        this.ctx.restore();
        
        // Draw pause overlay
        if (this.gameState === 'paused') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = '36px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('游戏暂停', this.canvas.width / 2, this.canvas.height / 2);
        }
    }
    
    loseLife() {
        this.lives--;
        this.createParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, '#e74c3c', 10);
        
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            // Reset player position
            this.player.x = 50;
            this.player.y = 300;
            this.player.velocityX = 0;
            this.player.velocityY = 0;
            this.camera.x = 0;
        }
        
        this.updateUI();
    }
    
    levelComplete() {
        this.gameState = 'levelComplete';
        
        // Calculate bonuses
        const levelBonus = this.level * 100;
        const timeBonus = Math.max(0, 500 - Math.floor(Date.now() / 1000) % 1000);
        this.score += levelBonus + timeBonus;
        
        // Show level complete screen
        document.getElementById('levelBonus').textContent = levelBonus;
        document.getElementById('timeBonus').textContent = timeBonus;
        document.getElementById('totalScore').textContent = this.score;
        document.getElementById('levelComplete').style.display = 'flex';
        
        this.updateUI();
    }
    
    nextLevel() {
        this.level++;
        this.hideLevelComplete();
        this.loadLevel(this.level);
        this.updateUI();
    }
    
    hideLevelComplete() {
        document.getElementById('levelComplete').style.display = 'none';
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        
        // Save high score
        const highScore = localStorage.getItem('platform-jumper-high-score') || 0;
        if (this.score > highScore) {
            localStorage.setItem('platform-jumper-high-score', this.score);
        }
        
        // Show game over screen
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalLevel').textContent = this.level;
        document.getElementById('finalCoins').textContent = this.coins;
        document.getElementById('gameOver').style.display = 'flex';
    }
    
    gameWon() {
        this.gameState = 'gameWon';
        alert('恭喜！你完成了所有关卡！');
        this.restart();
    }
    
    hideGameOver() {
        document.getElementById('gameOver').style.display = 'none';
    }
    
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
        }
        this.updateUI();
    }
    
    toggleMute() {
        this.isMuted = !this.isMuted;
        const muteBtn = document.getElementById('muteBtn');
        muteBtn.textContent = this.isMuted ? '🔇 音效' : '🔊 音效';
    }
    
    restart() {
        this.gameState = 'playing';
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.coins = 0;
        this.particles = [];
        
        this.hideGameOver();
        this.hideLevelComplete();
        this.loadLevel(this.level);
        this.updateUI();
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('coins').textContent = this.coins;
        
        const pauseBtn = document.getElementById('pauseBtn');
        pauseBtn.textContent = this.gameState === 'paused' ? '▶️ 继续' : '⏸️ 暂停';
    }
}

// Global game instance
let game;

// Initialize game when page loads
window.addEventListener('load', () => {
    game = new PlatformJumper();
});

// Handle window resize
window.addEventListener('resize', () => {
    const canvas = document.getElementById('gameCanvas');
    const container = document.querySelector('.game-board');
    
    if (window.innerWidth < 480) {
        container.style.transform = 'scale(0.7)';
    } else if (window.innerWidth < 768) {
        container.style.transform = 'scale(0.85)';
    } else {
        container.style.transform = 'scale(1)';
    }
});

// Trigger initial resize
window.dispatchEvent(new Event('resize'));