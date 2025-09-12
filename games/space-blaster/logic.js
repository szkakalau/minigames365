class SpaceBlaster {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.waveElement = document.getElementById('wave');
        this.enemiesElement = document.getElementById('enemies');
        this.healthElement = document.getElementById('health');
        this.healthFillElement = document.getElementById('healthFill');
        this.gameOverElement = document.getElementById('gameOver');
        this.finalScoreElement = document.getElementById('finalScore');
        this.finalWaveElement = document.getElementById('finalWave');
        this.waveIndicatorElement = document.getElementById('waveIndicator');
        
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 50,
            width: 30,
            height: 30,
            speed: 5,
            health: 100,
            maxHealth: 100
        };
        
        this.bullets = [];
        this.enemies = [];
        this.enemyBullets = [];
        this.powerUps = [];
        this.particles = [];
        this.stars = [];
        
        this.score = 0;
        this.wave = 1;
        this.enemiesInWave = 5;
        this.enemiesKilled = 0;
        this.highScore = localStorage.getItem('spaceBlasterHighScore') || 0;
        this.gameRunning = false;
        this.gameLoop = null;
        
        this.keys = {};
        this.isFiring = false;
        this.fireRate = 200; // milliseconds
        this.lastFireTime = 0;
        
        this.movement = {
            up: false,
            down: false,
            left: false,
            right: false
        };
        
        this.initStars();
        this.updateHighScore();
        this.setupEventListeners();
        this.draw();
    }
    
    initStars() {
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2,
                speed: Math.random() * 2 + 1
            });
        }
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            if (e.key === ' ') {
                e.preventDefault();
                this.isFiring = true;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            
            if (e.key === ' ') {
                e.preventDefault();
                this.isFiring = false;
            }
        });
        
        // Prevent context menu on right click
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
    spawnEnemies() {
        const enemyCount = this.enemiesInWave + Math.floor(this.wave / 2);
        
        for (let i = 0; i < enemyCount; i++) {
            setTimeout(() => {
                this.enemies.push({
                    x: Math.random() * (this.canvas.width - 30),
                    y: -30,
                    width: 25,
                    height: 25,
                    speed: 1 + Math.random() * 2 + (this.wave * 0.2),
                    health: 1 + Math.floor(this.wave / 3),
                    maxHealth: 1 + Math.floor(this.wave / 3),
                    lastFireTime: 0,
                    fireRate: 1000 + Math.random() * 2000,
                    type: Math.random() < 0.8 ? 'basic' : 'fast'
                });
            }, i * 500);
        }
    }
    
    update() {
        if (!this.gameRunning) return;
        
        this.updatePlayer();
        this.updateBullets();
        this.updateEnemies();
        this.updateEnemyBullets();
        this.updatePowerUps();
        this.updateParticles();
        this.updateStars();
        this.checkCollisions();
        this.checkWaveComplete();
        
        if (this.isFiring) {
            this.fireBullet();
        }
    }
    
    updatePlayer() {
        // Handle movement
        if (this.keys['a'] || this.keys['arrowleft'] || this.movement.left) {
            this.player.x = Math.max(0, this.player.x - this.player.speed);
        }
        if (this.keys['d'] || this.keys['arrowright'] || this.movement.right) {
            this.player.x = Math.min(this.canvas.width - this.player.width, this.player.x + this.player.speed);
        }
        if (this.keys['w'] || this.keys['arrowup'] || this.movement.up) {
            this.player.y = Math.max(0, this.player.y - this.player.speed);
        }
        if (this.keys['s'] || this.keys['arrowdown'] || this.movement.down) {
            this.player.y = Math.min(this.canvas.height - this.player.height, this.player.y + this.player.speed);
        }
    }
    
    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.y -= bullet.speed;
            
            if (bullet.y < 0) {
                this.bullets.splice(i, 1);
            }
        }
    }
    
    updateEnemies() {
        const currentTime = Date.now();
        
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.y += enemy.speed;
            
            // Enemy firing
            if (currentTime - enemy.lastFireTime > enemy.fireRate) {
                this.enemyBullets.push({
                    x: enemy.x + enemy.width / 2,
                    y: enemy.y + enemy.height,
                    speed: 3,
                    width: 4,
                    height: 8
                });
                enemy.lastFireTime = currentTime;
            }
            
            // Remove enemies that go off screen
            if (enemy.y > this.canvas.height) {
                this.enemies.splice(i, 1);
                this.player.health -= 10; // Penalty for letting enemy pass
                this.updateHealth();
            }
        }
    }
    
    updateEnemyBullets() {
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = this.enemyBullets[i];
            bullet.y += bullet.speed;
            
            if (bullet.y > this.canvas.height) {
                this.enemyBullets.splice(i, 1);
            }
        }
    }
    
    updatePowerUps() {
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            powerUp.y += 2;
            powerUp.rotation += 0.1;
            
            if (powerUp.y > this.canvas.height) {
                this.powerUps.splice(i, 1);
            }
        }
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            particle.alpha = particle.life / particle.maxLife;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    updateStars() {
        for (let star of this.stars) {
            star.y += star.speed;
            if (star.y > this.canvas.height) {
                star.y = 0;
                star.x = Math.random() * this.canvas.width;
            }
        }
    }
    
    fireBullet() {
        const currentTime = Date.now();
        if (currentTime - this.lastFireTime > this.fireRate) {
            this.bullets.push({
                x: this.player.x + this.player.width / 2 - 2,
                y: this.player.y,
                speed: 8,
                width: 4,
                height: 10
            });
            this.lastFireTime = currentTime;
        }
    }
    
    checkCollisions() {
        // Bullet vs Enemy collisions
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                
                if (this.isColliding(bullet, enemy)) {
                    this.bullets.splice(i, 1);
                    enemy.health--;
                    
                    this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ffff00');
                    
                    if (enemy.health <= 0) {
                        this.enemies.splice(j, 1);
                        this.score += 10 * this.wave;
                        this.enemiesKilled++;
                        this.updateScore();
                        
                        this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ff6600');
                        
                        // Chance to drop power-up
                        if (Math.random() < 0.15) {
                            this.powerUps.push({
                                x: enemy.x,
                                y: enemy.y,
                                width: 20,
                                height: 20,
                                type: Math.random() < 0.5 ? 'health' : 'weapon',
                                rotation: 0
                            });
                        }
                    }
                    break;
                }
            }
        }
        
        // Enemy bullet vs Player collisions
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = this.enemyBullets[i];
            
            if (this.isColliding(bullet, this.player)) {
                this.enemyBullets.splice(i, 1);
                this.player.health -= 15;
                this.updateHealth();
                
                this.createExplosion(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, '#ff0000');
                
                if (this.player.health <= 0) {
                    this.gameOver();
                }
            }
        }
        
        // Player vs Enemy collisions
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            if (this.isColliding(this.player, enemy)) {
                this.enemies.splice(i, 1);
                this.player.health -= 25;
                this.updateHealth();
                
                this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ff0000');
                
                if (this.player.health <= 0) {
                    this.gameOver();
                }
            }
        }
        
        // Player vs PowerUp collisions
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            
            if (this.isColliding(this.player, powerUp)) {
                this.powerUps.splice(i, 1);
                
                if (powerUp.type === 'health') {
                    this.player.health = Math.min(this.player.maxHealth, this.player.health + 30);
                    this.updateHealth();
                } else if (powerUp.type === 'weapon') {
                    this.fireRate = Math.max(50, this.fireRate - 20);
                    setTimeout(() => {
                        this.fireRate = Math.min(200, this.fireRate + 20);
                    }, 5000);
                }
                
                this.createExplosion(powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2, '#00ff00');
            }
        }
    }
    
    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    createExplosion(x, y, color) {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 30,
                maxLife: 30,
                color: color,
                size: Math.random() * 4 + 2,
                alpha: 1
            });
        }
    }
    
    checkWaveComplete() {
        if (this.enemies.length === 0 && this.enemiesKilled >= this.enemiesInWave + Math.floor(this.wave / 2)) {
            this.wave++;
            this.enemiesKilled = 0;
            this.updateWave();
            this.showWaveIndicator();
            
            // Heal player slightly between waves
            this.player.health = Math.min(this.player.maxHealth, this.player.health + 20);
            this.updateHealth();
            
            setTimeout(() => {
                this.spawnEnemies();
            }, 2000);
        }
    }
    
    showWaveIndicator() {
        this.waveIndicatorElement.textContent = `Wave ${this.wave} Starting!`;
        this.waveIndicatorElement.style.display = 'block';
        
        setTimeout(() => {
            this.waveIndicatorElement.style.display = 'none';
        }, 2000);
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw stars
        this.ctx.fillStyle = '#fff';
        for (let star of this.stars) {
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, 2 * Math.PI);
            this.ctx.fill();
        }
        
        // Draw player
        this.ctx.fillStyle = '#00ffff';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Player details
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(this.player.x + 5, this.player.y + 5, 5, 10);
        this.ctx.fillRect(this.player.x + 20, this.player.y + 5, 5, 10);
        this.ctx.fillRect(this.player.x + 12, this.player.y, 6, 8);
        
        // Draw bullets
        this.ctx.fillStyle = '#ffff00';
        for (let bullet of this.bullets) {
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        }
        
        // Draw enemies
        for (let enemy of this.enemies) {
            if (enemy.type === 'fast') {
                this.ctx.fillStyle = '#ff6600';
            } else {
                this.ctx.fillStyle = '#ff0000';
            }
            this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            
            // Enemy details
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(enemy.x + 5, enemy.y + 5, 3, 3);
            this.ctx.fillRect(enemy.x + 17, enemy.y + 5, 3, 3);
            
            // Health bar for stronger enemies
            if (enemy.maxHealth > 1) {
                const healthPercent = enemy.health / enemy.maxHealth;
                this.ctx.fillStyle = '#333';
                this.ctx.fillRect(enemy.x, enemy.y - 8, enemy.width, 4);
                this.ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : '#ff0000';
                this.ctx.fillRect(enemy.x, enemy.y - 8, enemy.width * healthPercent, 4);
            }
        }
        
        // Draw enemy bullets
        this.ctx.fillStyle = '#ff0000';
        for (let bullet of this.enemyBullets) {
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        }
        
        // Draw power-ups
        for (let powerUp of this.powerUps) {
            this.ctx.save();
            this.ctx.translate(powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2);
            this.ctx.rotate(powerUp.rotation);
            
            if (powerUp.type === 'health') {
                this.ctx.fillStyle = '#00ff00';
            } else {
                this.ctx.fillStyle = '#0080ff';
            }
            
            this.ctx.fillRect(-powerUp.width / 2, -powerUp.height / 2, powerUp.width, powerUp.height);
            this.ctx.restore();
        }
        
        // Draw particles
        for (let particle of this.particles) {
            this.ctx.save();
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.restore();
        }
    }
    
    start() {
        if (this.gameRunning) return;
        
        this.gameRunning = true;
        this.gameOverElement.style.display = 'none';
        this.spawnEnemies();
        
        this.gameLoop = setInterval(() => {
            this.update();
            this.draw();
        }, 1000 / 60); // 60 FPS
    }
    
    pause() {
        if (!this.gameRunning) return;
        
        this.gameRunning = false;
        clearInterval(this.gameLoop);
    }
    
    reset() {
        this.gameRunning = false;
        clearInterval(this.gameLoop);
        
        this.player.x = this.canvas.width / 2;
        this.player.y = this.canvas.height - 50;
        this.player.health = this.player.maxHealth;
        
        this.bullets = [];
        this.enemies = [];
        this.enemyBullets = [];
        this.powerUps = [];
        this.particles = [];
        
        this.score = 0;
        this.wave = 1;
        this.enemiesKilled = 0;
        this.fireRate = 200;
        
        this.updateScore();
        this.updateWave();
        this.updateHealth();
        this.gameOverElement.style.display = 'none';
        this.draw();
    }
    
    gameOver() {
        this.gameRunning = false;
        clearInterval(this.gameLoop);
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('spaceBlasterHighScore', this.highScore);
            this.updateHighScore();
        }
        
        this.finalScoreElement.textContent = this.score;
        this.finalWaveElement.textContent = this.wave;
        this.gameOverElement.style.display = 'block';
    }
    
    updateScore() {
        this.scoreElement.textContent = this.score;
    }
    
    updateWave() {
        this.waveElement.textContent = this.wave;
        this.enemiesElement.textContent = this.enemies.length;
    }
    
    updateHealth() {
        this.healthElement.textContent = Math.max(0, this.player.health);
        const healthPercent = Math.max(0, this.player.health) / this.player.maxHealth * 100;
        this.healthFillElement.style.width = healthPercent + '%';
    }
    
    updateHighScore() {
        this.highScoreElement.textContent = this.highScore;
    }
}

// Initialize game
let game;

window.addEventListener('load', () => {
    game = new SpaceBlaster();
});

// Global functions for buttons
function startGame() {
    game.start();
}

function pauseGame() {
    game.pause();
}

function resetGame() {
    game.reset();
}

function setMovement(direction) {
    Object.keys(game.movement).forEach(key => {
        game.movement[key] = false;
    });
    
    if (direction !== 'stop') {
        game.movement[direction] = true;
    }
}

function startFiring() {
    game.isFiring = true;
}

function stopFiring() {
    game.isFiring = false;
}

// Prevent scrolling on mobile
document.addEventListener('touchmove', (e) => {
    if (e.target === game?.canvas || e.target.classList.contains('control-btn')) {
        e.preventDefault();
    }
}, { passive: false });

// Handle visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden && game?.gameRunning) {
        game.pause();
    }
});