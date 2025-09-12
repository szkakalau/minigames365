class MotoRacing {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.speedElement = document.getElementById('speed');
        this.timeElement = document.getElementById('time');
        
        // Game state
        this.gameRunning = false;
        this.gamePaused = false;
        this.score = 0;
        this.gameTime = 0;
        this.lastTime = 0;
        
        // Player motorcycle
        this.player = {
            x: this.canvas.width / 2 - 15,
            y: this.canvas.height - 80,
            width: 30,
            height: 60,
            speed: 0,
            maxSpeed: 8,
            acceleration: 0.3,
            deceleration: 0.2,
            turnSpeed: 4
        };
        
        // Game objects
        this.vehicles = [];
        this.coins = [];
        this.particles = [];
        this.roadLines = [];
        
        // Road animation
        this.roadOffset = 0;
        this.roadSpeed = 2;
        
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
        this.highScore = localStorage.getItem('motoRacingHighScore') || 0;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupTouchControls();
        this.initializeRoadLines();
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
                    this.keys.up = true;
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.keys.down = true;
                    e.preventDefault();
                    break;
                case 'Space':
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
                    this.keys.up = false;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.keys.down = false;
                    break;
            }
        });
        
        // Button controls
        document.getElementById('leftBtn').addEventListener('touchstart', () => this.keys.left = true);
        document.getElementById('leftBtn').addEventListener('touchend', () => this.keys.left = false);
        document.getElementById('leftBtn').addEventListener('mousedown', () => this.keys.left = true);
        document.getElementById('leftBtn').addEventListener('mouseup', () => this.keys.left = false);
        
        document.getElementById('rightBtn').addEventListener('touchstart', () => this.keys.right = true);
        document.getElementById('rightBtn').addEventListener('touchend', () => this.keys.right = false);
        document.getElementById('rightBtn').addEventListener('mousedown', () => this.keys.right = true);
        document.getElementById('rightBtn').addEventListener('mouseup', () => this.keys.right = false);
        
        document.getElementById('upBtn').addEventListener('touchstart', () => this.keys.up = true);
        document.getElementById('upBtn').addEventListener('touchend', () => this.keys.up = false);
        document.getElementById('upBtn').addEventListener('mousedown', () => this.keys.up = true);
        document.getElementById('upBtn').addEventListener('mouseup', () => this.keys.up = false);
        
        document.getElementById('downBtn').addEventListener('touchstart', () => this.keys.down = true);
        document.getElementById('downBtn').addEventListener('touchend', () => this.keys.down = false);
        document.getElementById('downBtn').addEventListener('mousedown', () => this.keys.down = true);
        document.getElementById('downBtn').addEventListener('mouseup', () => this.keys.down = false);
        
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
            if (!this.isTouching) return;
            
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const currentX = touch.clientX - rect.left;
            const currentY = touch.clientY - rect.top;
            
            const deltaX = currentX - this.touchStartX;
            const deltaY = currentY - this.touchStartY;
            
            // Reset all keys
            this.keys.left = false;
            this.keys.right = false;
            this.keys.up = false;
            this.keys.down = false;
            
            // Determine direction based on swipe
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX > 20) {
                    this.keys.right = true;
                } else if (deltaX < -20) {
                    this.keys.left = true;
                }
            } else {
                if (deltaY < -20) {
                    this.keys.up = true;
                } else if (deltaY > 20) {
                    this.keys.down = true;
                }
            }
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.isTouching = false;
            // Reset all keys
            this.keys.left = false;
            this.keys.right = false;
            this.keys.up = false;
            this.keys.down = false;
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
    
    initializeRoadLines() {
        for (let i = 0; i < 10; i++) {
            this.roadLines.push({
                x: this.canvas.width / 2,
                y: i * 60,
                width: 4,
                height: 30
            });
        }
    }
    
    startGame() {
        this.gameRunning = true;
        this.gamePaused = false;
        this.score = 0;
        this.gameTime = 0;
        this.player.speed = 0;
        this.vehicles = [];
        this.coins = [];
        this.particles = [];
        this.roadOffset = 0;
        
        this.gameLoop();
    }
    
    gameLoop(currentTime = 0) {
        if (!this.gameRunning) return;
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        if (!this.gamePaused) {
            this.update(deltaTime);
        }
        
        this.render();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        // Update game time
        this.gameTime += deltaTime / 1000;
        
        // Update player movement
        this.updatePlayer();
        
        // Update road animation
        this.updateRoad();
        
        // Spawn and update vehicles
        this.updateVehicles();
        
        // Spawn and update coins
        this.updateCoins();
        
        // Update particles
        this.updateParticles();
        
        // Check collisions
        this.checkCollisions();
        
        // Update score based on speed
        this.score += Math.floor(this.player.speed * 0.1);
        
        // Update UI
        this.updateUI();
    }
    
    updatePlayer() {
        // Handle acceleration and deceleration
        if (this.keys.up) {
            this.player.speed = Math.min(this.player.speed + this.player.acceleration, this.player.maxSpeed);
        } else if (this.keys.down) {
            this.player.speed = Math.max(this.player.speed - this.player.deceleration * 2, 0);
        } else {
            this.player.speed = Math.max(this.player.speed - this.player.deceleration * 0.5, 0);
        }
        
        // Handle turning
        if (this.keys.left && this.player.x > 0) {
            this.player.x -= this.player.turnSpeed;
        }
        if (this.keys.right && this.player.x < this.canvas.width - this.player.width) {
            this.player.x += this.player.turnSpeed;
        }
        
        // Create exhaust particles when accelerating
        if (this.keys.up && Math.random() < 0.3) {
            this.createExhaustParticle();
        }
    }
    
    updateRoad() {
        this.roadSpeed = 2 + this.player.speed * 0.5;
        this.roadOffset += this.roadSpeed;
        
        // Update road lines
        this.roadLines.forEach(line => {
            line.y += this.roadSpeed;
            if (line.y > this.canvas.height) {
                line.y = -30;
            }
        });
    }
    
    updateVehicles() {
        // Spawn new vehicles
        if (Math.random() < 0.02 + this.gameTime * 0.001) {
            this.spawnVehicle();
        }
        
        // Update existing vehicles
        this.vehicles.forEach((vehicle, index) => {
            vehicle.y += vehicle.speed + this.roadSpeed;
            
            // Remove vehicles that are off screen
            if (vehicle.y > this.canvas.height) {
                this.vehicles.splice(index, 1);
                this.score += 10; // Bonus for passing a vehicle
            }
        });
    }
    
    updateCoins() {
        // Spawn new coins
        if (Math.random() < 0.01) {
            this.spawnCoin();
        }
        
        // Update existing coins
        this.coins.forEach((coin, index) => {
            coin.y += this.roadSpeed;
            coin.rotation += 0.1;
            
            // Remove coins that are off screen
            if (coin.y > this.canvas.height) {
                this.coins.splice(index, 1);
            }
        });
    }
    
    updateParticles() {
        this.particles.forEach((particle, index) => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= 0.02;
            particle.alpha = particle.life;
            
            if (particle.life <= 0) {
                this.particles.splice(index, 1);
            }
        });
    }
    
    spawnVehicle() {
        const lanes = [150, 250, 350, 450];
        const lane = lanes[Math.floor(Math.random() * lanes.length)];
        
        this.vehicles.push({
            x: lane - 15,
            y: -60,
            width: 30,
            height: 60,
            speed: Math.random() * 2 + 1,
            color: `hsl(${Math.random() * 360}, 70%, 50%)`
        });
    }
    
    spawnCoin() {
        this.coins.push({
            x: Math.random() * (this.canvas.width - 20) + 10,
            y: -20,
            width: 20,
            height: 20,
            rotation: 0
        });
    }
    
    createExhaustParticle() {
        for (let i = 0; i < 3; i++) {
            this.particles.push({
                x: this.player.x + this.player.width / 2 + (Math.random() - 0.5) * 10,
                y: this.player.y + this.player.height,
                vx: (Math.random() - 0.5) * 2,
                vy: Math.random() * 2 + 1,
                life: 1,
                alpha: 1,
                color: `hsl(${Math.random() * 60 + 15}, 70%, 50%)`
            });
        }
    }
    
    createCrashParticles(x, y) {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 1,
                alpha: 1,
                color: `hsl(${Math.random() * 60}, 70%, 50%)`
            });
        }
    }
    
    checkCollisions() {
        // Check vehicle collisions
        this.vehicles.forEach(vehicle => {
            if (this.isColliding(this.player, vehicle)) {
                this.createCrashParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
                this.gameOver();
            }
        });
        
        // Check coin collisions
        this.coins.forEach((coin, index) => {
            if (this.isColliding(this.player, coin)) {
                this.coins.splice(index, 1);
                this.score += 50;
                this.createCollectParticles(coin.x, coin.y);
            }
        });
    }
    
    createCollectParticles(x, y) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 1,
                alpha: 1,
                color: '#ffd700'
            });
        }
    }
    
    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#2d5a27';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw road
        this.drawRoad();
        
        // Draw road lines
        this.drawRoadLines();
        
        // Draw vehicles
        this.drawVehicles();
        
        // Draw coins
        this.drawCoins();
        
        // Draw player
        this.drawPlayer();
        
        // Draw particles
        this.drawParticles();
        
        // Draw pause overlay
        if (this.gamePaused) {
            this.drawPauseOverlay();
        }
    }
    
    drawRoad() {
        // Draw road surface
        this.ctx.fillStyle = '#444';
        this.ctx.fillRect(100, 0, 400, this.canvas.height);
        
        // Draw road edges
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(95, 0, 10, this.canvas.height);
        this.ctx.fillRect(495, 0, 10, this.canvas.height);
    }
    
    drawRoadLines() {
        this.ctx.fillStyle = '#fff';
        this.roadLines.forEach(line => {
            this.ctx.fillRect(line.x - line.width / 2, line.y, line.width, line.height);
        });
    }
    
    drawVehicles() {
        this.vehicles.forEach(vehicle => {
            this.ctx.fillStyle = vehicle.color;
            this.ctx.fillRect(vehicle.x, vehicle.y, vehicle.width, vehicle.height);
            
            // Draw vehicle details
            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(vehicle.x + 5, vehicle.y + 5, 20, 10);
            this.ctx.fillRect(vehicle.x + 5, vehicle.y + 45, 20, 10);
        });
    }
    
    drawCoins() {
        this.coins.forEach(coin => {
            this.ctx.save();
            this.ctx.translate(coin.x + coin.width / 2, coin.y + coin.height / 2);
            this.ctx.rotate(coin.rotation);
            
            this.ctx.fillStyle = '#ffd700';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, coin.width / 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#ffed4e';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, coin.width / 3, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        });
    }
    
    drawPlayer() {
        // Draw motorcycle body
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Draw motorcycle details
        this.ctx.fillStyle = '#c0392b';
        this.ctx.fillRect(this.player.x + 5, this.player.y + 10, 20, 15);
        
        // Draw wheels
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.beginPath();
        this.ctx.arc(this.player.x + 8, this.player.y + 50, 6, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(this.player.x + 22, this.player.y + 50, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw rider
        this.ctx.fillStyle = '#f39c12';
        this.ctx.beginPath();
        this.ctx.arc(this.player.x + 15, this.player.y + 5, 8, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }
    
    drawPauseOverlay() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Press SPACE or Pause button to resume', this.canvas.width / 2, this.canvas.height / 2 + 50);
    }
    
    updateUI() {
        this.scoreElement.textContent = this.score;
        this.speedElement.textContent = Math.floor(this.player.speed * 20);
        this.timeElement.textContent = Math.floor(this.gameTime);
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
            localStorage.setItem('motoRacingHighScore', this.highScore);
        }
        
        // Show game over screen
        setTimeout(() => {
            alert(`Game Over!\nScore: ${this.score}\nTime: ${Math.floor(this.gameTime)}s\nHigh Score: ${this.highScore}`);
        }, 100);
    }
    
    restartGame() {
        this.startGame();
        document.getElementById('pauseBtn').textContent = '⏸️ Pause';
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new MotoRacing();
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