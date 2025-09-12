class AsteroidsClassic {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');
        this.livesElement = document.getElementById('lives');
        this.asteroidsElement = document.getElementById('asteroids');
        
        // Game state
        this.gameRunning = false;
        this.gamePaused = false;
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.invulnerable = false;
        this.invulnerableTimer = 0;
        
        // Ship
        this.ship = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            angle: 0,
            velocity: { x: 0, y: 0 },
            thrust: false,
            size: 10
        };
        
        // Game objects
        this.bullets = [];
        this.asteroids = [];
        this.particles = [];
        
        // Controls
        this.keys = {
            left: false,
            right: false,
            thrust: false,
            shoot: false
        };
        
        // Touch controls
        this.touchControls = {
            left: false,
            right: false,
            thrust: false,
            shoot: false
        };
        
        // Game settings
        this.maxBullets = 4;
        this.bulletSpeed = 5;
        this.bulletLifetime = 60;
        this.shipTurnSpeed = 0.1;
        this.shipThrustPower = 0.3;
        this.shipMaxSpeed = 8;
        this.shipFriction = 0.98;
        
        // High score
        this.highScore = localStorage.getItem('asteroidsHighScore') || 0;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupTouchControls();
        this.createAsteroids();
        this.startGame();
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            switch(e.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    this.keys.left = true;
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.keys.right = true;
                    e.preventDefault();
                    break;
                case 'ArrowUp':
                case 'KeyW':
                    this.keys.thrust = true;
                    e.preventDefault();
                    break;
                case 'Space':
                    this.keys.shoot = true;
                    e.preventDefault();
                    break;
                case 'KeyP':
                    this.togglePause();
                    e.preventDefault();
                    break;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            switch(e.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    this.keys.left = false;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.keys.right = false;
                    break;
                case 'ArrowUp':
                case 'KeyW':
                    this.keys.thrust = false;
                    break;
                case 'Space':
                    this.keys.shoot = false;
                    break;
            }
        });
        
        // Button controls
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
        // Mobile control buttons
        const leftBtn = document.getElementById('leftBtn');
        const rightBtn = document.getElementById('rightBtn');
        const thrustBtn = document.getElementById('thrustBtn');
        const shootBtn = document.getElementById('shootBtn');
        
        // Left button
        leftBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchControls.left = true;
        });
        leftBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touchControls.left = false;
        });
        leftBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.touchControls.left = true;
        });
        leftBtn.addEventListener('mouseup', (e) => {
            e.preventDefault();
            this.touchControls.left = false;
        });
        
        // Right button
        rightBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchControls.right = true;
        });
        rightBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touchControls.right = false;
        });
        rightBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.touchControls.right = true;
        });
        rightBtn.addEventListener('mouseup', (e) => {
            e.preventDefault();
            this.touchControls.right = false;
        });
        
        // Thrust button
        thrustBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchControls.thrust = true;
        });
        thrustBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touchControls.thrust = false;
        });
        thrustBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.touchControls.thrust = true;
        });
        thrustBtn.addEventListener('mouseup', (e) => {
            e.preventDefault();
            this.touchControls.thrust = false;
        });
        
        // Shoot button
        shootBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchControls.shoot = true;
        });
        shootBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touchControls.shoot = false;
        });
        shootBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.touchControls.shoot = true;
        });
        shootBtn.addEventListener('mouseup', (e) => {
            e.preventDefault();
            this.touchControls.shoot = false;
        });
        
        // Prevent scrolling
        document.body.addEventListener('touchstart', (e) => {
            if (e.target.classList.contains('mobile-btn')) {
                e.preventDefault();
            }
        }, { passive: false });
        
        document.body.addEventListener('touchend', (e) => {
            if (e.target.classList.contains('mobile-btn')) {
                e.preventDefault();
            }
        }, { passive: false });
        
        document.body.addEventListener('touchmove', (e) => {
            if (e.target.classList.contains('mobile-btn')) {
                e.preventDefault();
            }
        }, { passive: false });
    }
    
    createAsteroids() {
        this.asteroids = [];
        const numAsteroids = 4 + this.level - 1;
        
        for (let i = 0; i < numAsteroids; i++) {
            let x, y;
            do {
                x = Math.random() * this.canvas.width;
                y = Math.random() * this.canvas.height;
            } while (this.distance(x, y, this.ship.x, this.ship.y) < 100);
            
            this.asteroids.push({
                x: x,
                y: y,
                velocity: {
                    x: (Math.random() - 0.5) * 2,
                    y: (Math.random() - 0.5) * 2
                },
                angle: Math.random() * Math.PI * 2,
                angularVelocity: (Math.random() - 0.5) * 0.1,
                size: 'large',
                radius: 40
            });
        }
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
        // Update ship
        this.updateShip();
        
        // Update bullets
        this.updateBullets();
        
        // Update asteroids
        this.updateAsteroids();
        
        // Update particles
        this.updateParticles();
        
        // Handle invulnerability
        if (this.invulnerable) {
            this.invulnerableTimer--;
            if (this.invulnerableTimer <= 0) {
                this.invulnerable = false;
            }
        }
        
        // Check collisions
        this.checkCollisions();
        
        // Update UI
        this.updateUI();
        
        // Check win condition
        if (this.asteroids.length === 0) {
            this.nextLevel();
        }
    }
    
    updateShip() {
        const isLeft = this.keys.left || this.touchControls.left;
        const isRight = this.keys.right || this.touchControls.right;
        const isThrust = this.keys.thrust || this.touchControls.thrust;
        
        // Rotation
        if (isLeft) {
            this.ship.angle -= this.shipTurnSpeed;
        }
        if (isRight) {
            this.ship.angle += this.shipTurnSpeed;
        }
        
        // Thrust
        if (isThrust) {
            this.ship.velocity.x += Math.cos(this.ship.angle) * this.shipThrustPower;
            this.ship.velocity.y += Math.sin(this.ship.angle) * this.shipThrustPower;
            
            // Create thrust particles
            this.createThrustParticles();
        }
        
        // Apply friction
        this.ship.velocity.x *= this.shipFriction;
        this.ship.velocity.y *= this.shipFriction;
        
        // Limit speed
        const speed = Math.sqrt(this.ship.velocity.x ** 2 + this.ship.velocity.y ** 2);
        if (speed > this.shipMaxSpeed) {
            this.ship.velocity.x = (this.ship.velocity.x / speed) * this.shipMaxSpeed;
            this.ship.velocity.y = (this.ship.velocity.y / speed) * this.shipMaxSpeed;
        }
        
        // Update position
        this.ship.x += this.ship.velocity.x;
        this.ship.y += this.ship.velocity.y;
        
        // Wrap around screen
        this.ship.x = (this.ship.x + this.canvas.width) % this.canvas.width;
        this.ship.y = (this.ship.y + this.canvas.height) % this.canvas.height;
        
        // Shooting
        if ((this.keys.shoot || this.touchControls.shoot) && this.bullets.length < this.maxBullets) {
            this.shoot();
            this.keys.shoot = false;
            this.touchControls.shoot = false;
        }
    }
    
    updateBullets() {
        this.bullets = this.bullets.filter(bullet => {
            bullet.x += bullet.velocity.x;
            bullet.y += bullet.velocity.y;
            bullet.lifetime--;
            
            // Wrap around screen
            bullet.x = (bullet.x + this.canvas.width) % this.canvas.width;
            bullet.y = (bullet.y + this.canvas.height) % this.canvas.height;
            
            return bullet.lifetime > 0;
        });
    }
    
    updateAsteroids() {
        this.asteroids.forEach(asteroid => {
            asteroid.x += asteroid.velocity.x;
            asteroid.y += asteroid.velocity.y;
            asteroid.angle += asteroid.angularVelocity;
            
            // Wrap around screen
            asteroid.x = (asteroid.x + this.canvas.width) % this.canvas.width;
            asteroid.y = (asteroid.y + this.canvas.height) % this.canvas.height;
        });
    }
    
    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.velocity.x;
            particle.y += particle.velocity.y;
            particle.velocity.x *= 0.98;
            particle.velocity.y *= 0.98;
            particle.alpha -= 0.02;
            particle.size *= 0.98;
            
            return particle.alpha > 0 && particle.size > 0.1;
        });
    }
    
    shoot() {
        this.bullets.push({
            x: this.ship.x + Math.cos(this.ship.angle) * this.ship.size,
            y: this.ship.y + Math.sin(this.ship.angle) * this.ship.size,
            velocity: {
                x: Math.cos(this.ship.angle) * this.bulletSpeed + this.ship.velocity.x,
                y: Math.sin(this.ship.angle) * this.bulletSpeed + this.ship.velocity.y
            },
            lifetime: this.bulletLifetime
        });
    }
    
    createThrustParticles() {
        for (let i = 0; i < 3; i++) {
            this.particles.push({
                x: this.ship.x - Math.cos(this.ship.angle) * this.ship.size,
                y: this.ship.y - Math.sin(this.ship.angle) * this.ship.size,
                velocity: {
                    x: -Math.cos(this.ship.angle) * (2 + Math.random() * 2) + (Math.random() - 0.5),
                    y: -Math.sin(this.ship.angle) * (2 + Math.random() * 2) + (Math.random() - 0.5)
                },
                size: 2 + Math.random() * 3,
                alpha: 1,
                color: `hsl(${30 + Math.random() * 30}, 100%, 60%)`
            });
        }
    }
    
    createExplosionParticles(x, y, count = 10) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                velocity: {
                    x: (Math.random() - 0.5) * 8,
                    y: (Math.random() - 0.5) * 8
                },
                size: 2 + Math.random() * 4,
                alpha: 1,
                color: `hsl(${Math.random() * 60}, 100%, 60%)`
            });
        }
    }
    
    checkCollisions() {
        // Bullet-asteroid collisions
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            for (let j = this.asteroids.length - 1; j >= 0; j--) {
                const asteroid = this.asteroids[j];
                
                if (this.distance(bullet.x, bullet.y, asteroid.x, asteroid.y) < asteroid.radius) {
                    // Remove bullet
                    this.bullets.splice(i, 1);
                    
                    // Create explosion particles
                    this.createExplosionParticles(asteroid.x, asteroid.y, 15);
                    
                    // Score points
                    if (asteroid.size === 'large') {
                        this.score += 20;
                    } else if (asteroid.size === 'medium') {
                        this.score += 50;
                    } else {
                        this.score += 100;
                    }
                    
                    // Split asteroid
                    this.splitAsteroid(asteroid, j);
                    break;
                }
            }
        }
        
        // Ship-asteroid collisions
        if (!this.invulnerable) {
            for (let asteroid of this.asteroids) {
                if (this.distance(this.ship.x, this.ship.y, asteroid.x, asteroid.y) < asteroid.radius + this.ship.size) {
                    this.shipDestroyed();
                    break;
                }
            }
        }
    }
    
    splitAsteroid(asteroid, index) {
        this.asteroids.splice(index, 1);
        
        if (asteroid.size === 'large') {
            // Split into 2 medium asteroids
            for (let i = 0; i < 2; i++) {
                this.asteroids.push({
                    x: asteroid.x,
                    y: asteroid.y,
                    velocity: {
                        x: (Math.random() - 0.5) * 3,
                        y: (Math.random() - 0.5) * 3
                    },
                    angle: Math.random() * Math.PI * 2,
                    angularVelocity: (Math.random() - 0.5) * 0.15,
                    size: 'medium',
                    radius: 20
                });
            }
        } else if (asteroid.size === 'medium') {
            // Split into 2 small asteroids
            for (let i = 0; i < 2; i++) {
                this.asteroids.push({
                    x: asteroid.x,
                    y: asteroid.y,
                    velocity: {
                        x: (Math.random() - 0.5) * 4,
                        y: (Math.random() - 0.5) * 4
                    },
                    angle: Math.random() * Math.PI * 2,
                    angularVelocity: (Math.random() - 0.5) * 0.2,
                    size: 'small',
                    radius: 10
                });
            }
        }
        // Small asteroids are completely destroyed
    }
    
    shipDestroyed() {
        this.lives--;
        this.createExplosionParticles(this.ship.x, this.ship.y, 20);
        
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            // Reset ship position and make invulnerable
            this.ship.x = this.canvas.width / 2;
            this.ship.y = this.canvas.height / 2;
            this.ship.velocity = { x: 0, y: 0 };
            this.ship.angle = 0;
            this.invulnerable = true;
            this.invulnerableTimer = 120; // 2 seconds at 60fps
        }
    }
    
    nextLevel() {
        this.level++;
        this.createAsteroids();
        
        // Reset ship position
        this.ship.x = this.canvas.width / 2;
        this.ship.y = this.canvas.height / 2;
        this.ship.velocity = { x: 0, y: 0 };
        this.ship.angle = 0;
    }
    
    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw stars background
        this.drawStars();
        
        // Draw ship
        this.drawShip();
        
        // Draw bullets
        this.drawBullets();
        
        // Draw asteroids
        this.drawAsteroids();
        
        // Draw particles
        this.drawParticles();
        
        // Draw pause overlay
        if (this.gamePaused) {
            this.drawPauseOverlay();
        }
    }
    
    drawStars() {
        this.ctx.fillStyle = '#fff';
        for (let i = 0; i < 100; i++) {
            const x = (i * 37) % this.canvas.width;
            const y = (i * 73) % this.canvas.height;
            const size = (i % 3) * 0.5 + 0.5;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawShip() {
        if (this.invulnerable && Math.floor(Date.now() / 100) % 2) {
            return; // Flashing effect when invulnerable
        }
        
        this.ctx.save();
        this.ctx.translate(this.ship.x, this.ship.y);
        this.ctx.rotate(this.ship.angle);
        
        this.ctx.strokeStyle = '#00d4ff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.ship.size, 0);
        this.ctx.lineTo(-this.ship.size, -this.ship.size / 2);
        this.ctx.lineTo(-this.ship.size / 2, 0);
        this.ctx.lineTo(-this.ship.size, this.ship.size / 2);
        this.ctx.closePath();
        this.ctx.stroke();
        
        // Draw thrust flame
        if (this.keys.thrust || this.touchControls.thrust) {
            this.ctx.strokeStyle = '#ffa500';
            this.ctx.beginPath();
            this.ctx.moveTo(-this.ship.size, -this.ship.size / 4);
            this.ctx.lineTo(-this.ship.size * 1.5, 0);
            this.ctx.lineTo(-this.ship.size, this.ship.size / 4);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
    
    drawBullets() {
        this.ctx.fillStyle = '#fff';
        this.bullets.forEach(bullet => {
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, 2, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    drawAsteroids() {
        this.ctx.strokeStyle = '#888';
        this.ctx.lineWidth = 2;
        
        this.asteroids.forEach(asteroid => {
            this.ctx.save();
            this.ctx.translate(asteroid.x, asteroid.y);
            this.ctx.rotate(asteroid.angle);
            
            this.ctx.beginPath();
            const points = 8;
            for (let i = 0; i < points; i++) {
                const angle = (i / points) * Math.PI * 2;
                const radius = asteroid.radius * (0.8 + Math.sin(i * 2.5) * 0.2);
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            this.ctx.closePath();
            this.ctx.stroke();
            
            this.ctx.restore();
        });
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }
    
    drawPauseOverlay() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#00d4ff';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Press P or Pause button to resume', this.canvas.width / 2, this.canvas.height / 2 + 50);
    }
    
    updateUI() {
        this.scoreElement.textContent = this.score;
        this.levelElement.textContent = this.level;
        this.livesElement.textContent = this.lives;
        this.asteroidsElement.textContent = this.asteroids.length;
    }
    
    togglePause() {
        if (!this.gameRunning) return;
        this.gamePaused = !this.gamePaused;
        
        const pauseBtn = document.getElementById('pauseBtn');
        pauseBtn.textContent = this.gamePaused ? '▶️ 继续' : '⏸️ 暂停';
    }
    
    gameOver() {
        this.gameRunning = false;
        
        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('asteroidsHighScore', this.highScore);
        }
        
        // Show game over screen
        setTimeout(() => {
            alert(`游戏结束！\n得分: ${this.score}\n等级: ${this.level}\n最高分: ${this.highScore}`);
        }, 100);
    }
    
    restartGame() {
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.invulnerable = false;
        this.invulnerableTimer = 0;
        
        // Reset ship
        this.ship.x = this.canvas.width / 2;
        this.ship.y = this.canvas.height / 2;
        this.ship.angle = 0;
        this.ship.velocity = { x: 0, y: 0 };
        
        // Clear game objects
        this.bullets = [];
        this.particles = [];
        
        this.createAsteroids();
        this.startGame();
        document.getElementById('pauseBtn').textContent = '⏸️ 暂停';
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new AsteroidsClassic();
});

// Handle window resize
window.addEventListener('resize', () => {
    // Adjust canvas size if needed
    const canvas = document.getElementById('gameCanvas');
    const container = canvas.parentElement;
    const maxWidth = Math.min(container.clientWidth - 40, 800);
    const aspectRatio = 600 / 800;
    
    canvas.style.width = maxWidth + 'px';
    canvas.style.height = (maxWidth * aspectRatio) + 'px';
});

// Trigger initial resize
window.dispatchEvent(new Event('resize'));