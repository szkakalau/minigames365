class SpeedRacer {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.speedElement = document.getElementById('speed');
        this.distanceElement = document.getElementById('distance');
        this.levelElement = document.getElementById('level');
        
        // Game state
        this.gameRunning = false;
        this.gamePaused = false;
        this.score = 0;
        this.distance = 0;
        this.level = 1;
        this.gameSpeed = 1;
        
        // Player car
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 100,
            width: 40,
            height: 80,
            speed: 0,
            maxSpeed: 8,
            acceleration: 0.2,
            deceleration: 0.1,
            turnSpeed: 0,
            maxTurnSpeed: 5
        };
        
        // Road
        this.road = {
            width: 400,
            x: this.canvas.width / 2,
            lanes: 4,
            stripeOffset: 0,
            stripeSpeed: 5
        };
        
        // Traffic cars
        this.trafficCars = [];
        this.carSpawnTimer = 0;
        this.carSpawnRate = 120; // frames
        
        // Controls
        this.keys = {
            left: false,
            right: false,
            up: false,
            down: false
        };
        
        // Touch controls
        this.touchControls = {
            left: false,
            right: false,
            accelerate: false,
            brake: false
        };
        
        // Visual effects
        this.particles = [];
        this.screenShake = 0;
        
        // High score
        this.highScore = localStorage.getItem('speedRacerHighScore') || 0;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupTouchControls();
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
        const accelerateBtn = document.getElementById('accelerateBtn');
        const brakeBtn = document.getElementById('brakeBtn');
        
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
        
        // Accelerate button
        accelerateBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchControls.accelerate = true;
        });
        accelerateBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touchControls.accelerate = false;
        });
        accelerateBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.touchControls.accelerate = true;
        });
        accelerateBtn.addEventListener('mouseup', (e) => {
            e.preventDefault();
            this.touchControls.accelerate = false;
        });
        
        // Brake button
        brakeBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchControls.brake = true;
        });
        brakeBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touchControls.brake = false;
        });
        brakeBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.touchControls.brake = true;
        });
        brakeBtn.addEventListener('mouseup', (e) => {
            e.preventDefault();
            this.touchControls.brake = false;
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
        // Update player movement
        this.updatePlayer();
        
        // Update traffic cars
        this.updateTrafficCars();
        
        // Spawn new traffic cars
        this.spawnTrafficCars();
        
        // Update road animation
        this.updateRoad();
        
        // Update particles
        this.updateParticles();
        
        // Update screen shake
        if (this.screenShake > 0) {
            this.screenShake--;
        }
        
        // Update game progression
        this.updateGameProgression();
        
        // Check collisions
        this.checkCollisions();
        
        // Update UI
        this.updateUI();
    }
    
    updatePlayer() {
        const isLeft = this.keys.left || this.touchControls.left;
        const isRight = this.keys.right || this.touchControls.right;
        const isAccelerate = this.keys.up || this.touchControls.accelerate;
        const isBrake = this.keys.down || this.touchControls.brake;
        
        // Acceleration and deceleration
        if (isAccelerate) {
            this.player.speed = Math.min(this.player.speed + this.player.acceleration, this.player.maxSpeed);
        } else if (isBrake) {
            this.player.speed = Math.max(this.player.speed - this.player.deceleration * 2, 0);
        } else {
            this.player.speed = Math.max(this.player.speed - this.player.deceleration, 0);
        }
        
        // Turning
        if (isLeft && this.player.speed > 0) {
            this.player.turnSpeed = Math.max(this.player.turnSpeed - 0.3, -this.player.maxTurnSpeed);
        } else if (isRight && this.player.speed > 0) {
            this.player.turnSpeed = Math.min(this.player.turnSpeed + 0.3, this.player.maxTurnSpeed);
        } else {
            this.player.turnSpeed *= 0.9; // Gradual return to center
        }
        
        // Apply turning
        this.player.x += this.player.turnSpeed * (this.player.speed / this.player.maxSpeed);
        
        // Keep player on road
        const roadLeft = this.road.x - this.road.width / 2;
        const roadRight = this.road.x + this.road.width / 2;
        this.player.x = Math.max(roadLeft + this.player.width / 2, 
                                Math.min(roadRight - this.player.width / 2, this.player.x));
        
        // Create engine particles when accelerating
        if (isAccelerate && this.player.speed > 2) {
            this.createEngineParticles();
        }
    }
    
    updateTrafficCars() {
        this.trafficCars = this.trafficCars.filter(car => {
            car.y += (this.player.speed + this.gameSpeed) * 2;
            return car.y < this.canvas.height + 100;
        });
    }
    
    spawnTrafficCars() {
        this.carSpawnTimer++;
        if (this.carSpawnTimer >= this.carSpawnRate) {
            this.carSpawnTimer = 0;
            
            const laneWidth = this.road.width / this.road.lanes;
            const lane = Math.floor(Math.random() * this.road.lanes);
            const carX = this.road.x - this.road.width / 2 + lane * laneWidth + laneWidth / 2;
            
            this.trafficCars.push({
                x: carX,
                y: -100,
                width: 35,
                height: 70,
                color: this.getRandomCarColor(),
                speed: Math.random() * 2 + 1
            });
        }
    }
    
    updateRoad() {
        this.road.stripeOffset += (this.player.speed + this.gameSpeed) * 2;
        if (this.road.stripeOffset >= 60) {
            this.road.stripeOffset = 0;
        }
    }
    
    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.velocity.x;
            particle.y += particle.velocity.y;
            particle.velocity.y += 0.1; // gravity
            particle.alpha -= 0.02;
            particle.size *= 0.98;
            
            return particle.alpha > 0 && particle.size > 0.1;
        });
    }
    
    updateGameProgression() {
        this.distance += this.player.speed;
        this.score += Math.floor(this.player.speed);
        
        // Level progression
        const newLevel = Math.floor(this.distance / 1000) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.gameSpeed += 0.5;
            this.carSpawnRate = Math.max(60, this.carSpawnRate - 10);
        }
    }
    
    checkCollisions() {
        const playerRect = {
            x: this.player.x - this.player.width / 2,
            y: this.player.y - this.player.height / 2,
            width: this.player.width,
            height: this.player.height
        };
        
        for (let car of this.trafficCars) {
            const carRect = {
                x: car.x - car.width / 2,
                y: car.y - car.height / 2,
                width: car.width,
                height: car.height
            };
            
            if (this.rectanglesCollide(playerRect, carRect)) {
                this.crash();
                break;
            }
        }
    }
    
    rectanglesCollide(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    crash() {
        this.screenShake = 30;
        this.createCrashParticles();
        this.gameOver();
    }
    
    createEngineParticles() {
        for (let i = 0; i < 2; i++) {
            this.particles.push({
                x: this.player.x + (Math.random() - 0.5) * this.player.width,
                y: this.player.y + this.player.height / 2,
                velocity: {
                    x: (Math.random() - 0.5) * 2,
                    y: Math.random() * 2 + 2
                },
                size: 2 + Math.random() * 3,
                alpha: 0.8,
                color: `hsl(${200 + Math.random() * 60}, 70%, 60%)`
            });
        }
    }
    
    createCrashParticles() {
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: this.player.x,
                y: this.player.y,
                velocity: {
                    x: (Math.random() - 0.5) * 10,
                    y: (Math.random() - 0.5) * 10
                },
                size: 3 + Math.random() * 5,
                alpha: 1,
                color: `hsl(${Math.random() * 60}, 100%, 60%)`
            });
        }
    }
    
    getRandomCarColor() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#98d8c8'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    render() {
        // Apply screen shake
        let shakeX = 0, shakeY = 0;
        if (this.screenShake > 0) {
            shakeX = (Math.random() - 0.5) * this.screenShake;
            shakeY = (Math.random() - 0.5) * this.screenShake;
        }
        
        this.ctx.save();
        this.ctx.translate(shakeX, shakeY);
        
        // Clear canvas with sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98FB98');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw road
        this.drawRoad();
        
        // Draw traffic cars
        this.drawTrafficCars();
        
        // Draw player car
        this.drawPlayerCar();
        
        // Draw particles
        this.drawParticles();
        
        this.ctx.restore();
        
        // Draw pause overlay
        if (this.gamePaused) {
            this.drawPauseOverlay();
        }
    }
    
    drawRoad() {
        const roadLeft = this.road.x - this.road.width / 2;
        const roadRight = this.road.x + this.road.width / 2;
        
        // Draw road surface
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(roadLeft, 0, this.road.width, this.canvas.height);
        
        // Draw road edges
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(roadLeft - 5, 0, 5, this.canvas.height);
        this.ctx.fillRect(roadRight, 0, 5, this.canvas.height);
        
        // Draw lane dividers
        this.ctx.fillStyle = '#ffff00';
        const laneWidth = this.road.width / this.road.lanes;
        for (let i = 1; i < this.road.lanes; i++) {
            const laneX = roadLeft + i * laneWidth;
            for (let y = -this.road.stripeOffset; y < this.canvas.height; y += 60) {
                this.ctx.fillRect(laneX - 2, y, 4, 30);
            }
        }
    }
    
    drawTrafficCars() {
        this.trafficCars.forEach(car => {
            this.ctx.fillStyle = car.color;
            this.ctx.fillRect(
                car.x - car.width / 2,
                car.y - car.height / 2,
                car.width,
                car.height
            );
            
            // Car details
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(
                car.x - car.width / 2 + 5,
                car.y - car.height / 2 + 5,
                car.width - 10,
                car.height - 10
            );
            
            // Headlights
            this.ctx.fillStyle = '#ffff00';
            this.ctx.fillRect(car.x - 10, car.y - car.height / 2, 8, 4);
            this.ctx.fillRect(car.x + 2, car.y - car.height / 2, 8, 4);
        });
    }
    
    drawPlayerCar() {
        // Car body
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.fillRect(
            this.player.x - this.player.width / 2,
            this.player.y - this.player.height / 2,
            this.player.width,
            this.player.height
        );
        
        // Car details
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(
            this.player.x - this.player.width / 2 + 5,
            this.player.y - this.player.height / 2 + 10,
            this.player.width - 10,
            this.player.height - 20
        );
        
        // Headlights
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(this.player.x - 12, this.player.y - this.player.height / 2, 8, 6);
        this.ctx.fillRect(this.player.x + 4, this.player.y - this.player.height / 2, 8, 6);
        
        // Taillights
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillRect(this.player.x - 12, this.player.y + this.player.height / 2 - 6, 8, 6);
        this.ctx.fillRect(this.player.x + 4, this.player.y + this.player.height / 2 - 6, 8, 6);
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
        
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Press SPACE or Pause button to resume', this.canvas.width / 2, this.canvas.height / 2 + 50);
    }
    
    updateUI() {
        this.scoreElement.textContent = this.score;
        this.speedElement.textContent = Math.floor(this.player.speed * 20) + ' km/h';
        this.distanceElement.textContent = Math.floor(this.distance / 10) + ' m';
        this.levelElement.textContent = this.level;
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
            localStorage.setItem('speedRacerHighScore', this.highScore);
        }
        
        // Show game over screen
        setTimeout(() => {
            alert(`游戏结束！\n得分: ${this.score}\n距离: ${Math.floor(this.distance / 10)}m\n等级: ${this.level}\n最高分: ${this.highScore}`);
        }, 100);
    }
    
    restartGame() {
        this.score = 0;
        this.distance = 0;
        this.level = 1;
        this.gameSpeed = 1;
        this.carSpawnRate = 120;
        
        // Reset player
        this.player.x = this.canvas.width / 2;
        this.player.speed = 0;
        this.player.turnSpeed = 0;
        
        // Clear game objects
        this.trafficCars = [];
        this.particles = [];
        this.carSpawnTimer = 0;
        this.screenShake = 0;
        
        this.startGame();
        document.getElementById('pauseBtn').textContent = '⏸️ 暂停';
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new SpeedRacer();
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