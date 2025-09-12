class ExtremeMoto {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.speedElement = document.getElementById('speed');
        this.stuntScoreElement = document.getElementById('stuntScore');
        this.levelElement = document.getElementById('level');
        
        // Game state
        this.gameRunning = false;
        this.gamePaused = false;
        this.score = 0;
        this.stuntScore = 0;
        this.level = 1;
        this.gameSpeed = 1;
        
        // Player moto
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 150,
            width: 50,
            height: 80,
            speed: 0,
            maxSpeed: 10,
            acceleration: 0.3,
            deceleration: 0.15,
            turnSpeed: 0,
            maxTurnSpeed: 6,
            rotation: 0,
            isStunting: false,
            stuntTime: 0,
            stuntRotation: 0,
            airTime: 0,
            isInAir: false
        };
        
        // Road and environment
        this.road = {
            width: 500,
            x: this.canvas.width / 2,
            lanes: 3,
            stripeOffset: 0,
            curves: [],
            currentCurve: 0
        };
        
        // Obstacles and collectibles
        this.obstacles = [];
        this.coins = [];
        this.ramps = [];
        this.spawnTimer = 0;
        this.spawnRate = 100;
        
        // Controls
        this.keys = {
            left: false,
            right: false,
            up: false,
            down: false,
            space: false
        };
        
        // Touch controls
        this.touchControls = {
            left: false,
            right: false,
            accelerate: false,
            brake: false,
            stunt: false
        };
        
        // Visual effects
        this.particles = [];
        this.screenShake = 0;
        this.camera = {
            x: 0,
            y: 0,
            shake: 0
        };
        
        // High score
        this.highScore = localStorage.getItem('extremeMotoHighScore') || 0;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupTouchControls();
        this.generateRoadCurves();
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
                    if (!this.keys.space) {
                        this.keys.space = true;
                        this.startStunt();
                    }
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
                case 'Space':
                    this.keys.space = false;
                    break;
            }
        });
        
        // Button controls
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        
        // Prevent context menu
        document.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Handle visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.gameRunning) {
                this.gamePaused = true;
            }
        });
    }
    
    setupTouchControls() {
        const buttons = {
            leftBtn: () => { this.touchControls.left = true; },
            rightBtn: () => { this.touchControls.right = true; },
            accelerateBtn: () => { this.touchControls.accelerate = true; },
            brakeBtn: () => { this.touchControls.brake = true; },
            stuntBtn: () => { 
                if (!this.touchControls.stunt) {
                    this.touchControls.stunt = true;
                    this.startStunt();
                }
            }
        };
        
        Object.keys(buttons).forEach(btnId => {
            const btn = document.getElementById(btnId);
            
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                buttons[btnId]();
            });
            
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                const control = btnId.replace('Btn', '').toLowerCase();
                if (control === 'stunt') {
                    this.touchControls.stunt = false;
                } else {
                    this.touchControls[control] = false;
                }
            });
            
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                buttons[btnId]();
            });
            
            btn.addEventListener('mouseup', (e) => {
                e.preventDefault();
                const control = btnId.replace('Btn', '').toLowerCase();
                if (control === 'stunt') {
                    this.touchControls.stunt = false;
                } else {
                    this.touchControls[control] = false;
                }
            });
        });
        
        // Prevent scrolling
        document.body.addEventListener('touchstart', (e) => {
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
    
    generateRoadCurves() {
        this.road.curves = [];
        for (let i = 0; i < 100; i++) {
            this.road.curves.push({
                curve: (Math.random() - 0.5) * 0.02,
                y: i * 100
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
        // Update player
        this.updatePlayer();
        
        // Update game objects
        this.updateObstacles();
        this.updateCoins();
        this.updateRamps();
        
        // Spawn new objects
        this.spawnObjects();
        
        // Update road
        this.updateRoad();
        
        // Update particles
        this.updateParticles();
        
        // Update camera
        this.updateCamera();
        
        // Check collisions
        this.checkCollisions();
        
        // Update game progression
        this.updateGameProgression();
        
        // Update UI
        this.updateUI();
    }
    
    updatePlayer() {
        const isLeft = this.keys.left || this.touchControls.left;
        const isRight = this.keys.right || this.touchControls.right;
        const isAccelerate = this.keys.up || this.touchControls.accelerate;
        const isBrake = this.keys.down || this.touchControls.brake;
        
        // Handle stunts
        if (this.player.isStunting) {
            this.player.stuntTime++;
            this.player.stuntRotation += 15;
            
            if (this.player.stuntTime > 60) {
                this.endStunt();
            }
        }
        
        // Handle air time
        if (this.player.isInAir) {
            this.player.airTime++;
            this.player.y += Math.sin(this.player.airTime * 0.1) * 2;
            
            if (this.player.airTime > 30) {
                this.player.isInAir = false;
                this.player.airTime = 0;
                this.player.y = this.canvas.height - 150;
                this.createLandingParticles();
            }
        }
        
        // Acceleration and deceleration
        if (isAccelerate && !this.player.isStunting) {
            this.player.speed = Math.min(this.player.speed + this.player.acceleration, this.player.maxSpeed);
        } else if (isBrake) {
            this.player.speed = Math.max(this.player.speed - this.player.deceleration * 2, 0);
        } else {
            this.player.speed = Math.max(this.player.speed - this.player.deceleration, 0);
        }
        
        // Turning
        if (isLeft && this.player.speed > 0 && !this.player.isStunting) {
            this.player.turnSpeed = Math.max(this.player.turnSpeed - 0.4, -this.player.maxTurnSpeed);
            this.player.rotation = Math.max(this.player.rotation - 2, -15);
        } else if (isRight && this.player.speed > 0 && !this.player.isStunting) {
            this.player.turnSpeed = Math.min(this.player.turnSpeed + 0.4, this.player.maxTurnSpeed);
            this.player.rotation = Math.min(this.player.rotation + 2, 15);
        } else {
            this.player.turnSpeed *= 0.9;
            this.player.rotation *= 0.9;
        }
        
        // Apply turning
        if (!this.player.isStunting) {
            this.player.x += this.player.turnSpeed * (this.player.speed / this.player.maxSpeed);
        }
        
        // Keep player on road
        const roadLeft = this.road.x - this.road.width / 2;
        const roadRight = this.road.x + this.road.width / 2;
        this.player.x = Math.max(roadLeft + this.player.width / 2, 
                                Math.min(roadRight - this.player.width / 2, this.player.x));
        
        // Create exhaust particles
        if (this.player.speed > 3) {
            this.createExhaustParticles();
        }
    }
    
    startStunt() {
        if (!this.player.isStunting && this.player.speed > 5) {
            this.player.isStunting = true;
            this.player.stuntTime = 0;
            this.player.stuntRotation = 0;
            this.camera.shake = 10;
        }
    }
    
    endStunt() {
        this.player.isStunting = false;
        const stuntPoints = Math.floor(this.player.stuntTime * this.player.speed);
        this.stuntScore += stuntPoints;
        this.score += stuntPoints * 2;
        this.createStuntParticles();
    }
    
    updateObstacles() {
        this.obstacles = this.obstacles.filter(obstacle => {
            obstacle.y += (this.player.speed + this.gameSpeed) * 3;
            return obstacle.y < this.canvas.height + 100;
        });
    }
    
    updateCoins() {
        this.coins = this.coins.filter(coin => {
            coin.y += (this.player.speed + this.gameSpeed) * 3;
            coin.rotation += 5;
            return coin.y < this.canvas.height + 100;
        });
    }
    
    updateRamps() {
        this.ramps = this.ramps.filter(ramp => {
            ramp.y += (this.player.speed + this.gameSpeed) * 3;
            return ramp.y < this.canvas.height + 100;
        });
    }
    
    spawnObjects() {
        this.spawnTimer++;
        if (this.spawnTimer >= this.spawnRate) {
            this.spawnTimer = 0;
            
            const laneWidth = this.road.width / this.road.lanes;
            const lane = Math.floor(Math.random() * this.road.lanes);
            const objectX = this.road.x - this.road.width / 2 + lane * laneWidth + laneWidth / 2;
            
            const rand = Math.random();
            if (rand < 0.4) {
                // Spawn obstacle
                this.obstacles.push({
                    x: objectX,
                    y: -100,
                    width: 40,
                    height: 60,
                    type: Math.random() < 0.5 ? 'car' : 'barrier'
                });
            } else if (rand < 0.7) {
                // Spawn coin
                this.coins.push({
                    x: objectX,
                    y: -100,
                    width: 20,
                    height: 20,
                    rotation: 0,
                    collected: false
                });
            } else {
                // Spawn ramp
                this.ramps.push({
                    x: objectX,
                    y: -100,
                    width: 60,
                    height: 30
                });
            }
        }
    }
    
    updateRoad() {
        this.road.stripeOffset += (this.player.speed + this.gameSpeed) * 3;
        if (this.road.stripeOffset >= 80) {
            this.road.stripeOffset = 0;
        }
        
        // Update road curves
        const currentCurveIndex = Math.floor(this.road.stripeOffset / 100) % this.road.curves.length;
        if (currentCurveIndex !== this.road.currentCurve) {
            this.road.currentCurve = currentCurveIndex;
        }
    }
    
    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.velocity.x;
            particle.y += particle.velocity.y;
            particle.velocity.y += particle.gravity || 0.1;
            particle.alpha -= particle.decay || 0.02;
            particle.size *= particle.shrink || 0.98;
            
            return particle.alpha > 0 && particle.size > 0.1;
        });
    }
    
    updateCamera() {
        if (this.camera.shake > 0) {
            this.camera.shake--;
        }
        
        // Follow player with smooth camera
        this.camera.x = this.player.x - this.canvas.width / 2;
        this.camera.y = this.player.y - this.canvas.height / 2;
    }
    
    checkCollisions() {
        const playerRect = {
            x: this.player.x - this.player.width / 2,
            y: this.player.y - this.player.height / 2,
            width: this.player.width,
            height: this.player.height
        };
        
        // Check obstacle collisions
        for (let obstacle of this.obstacles) {
            const obstacleRect = {
                x: obstacle.x - obstacle.width / 2,
                y: obstacle.y - obstacle.height / 2,
                width: obstacle.width,
                height: obstacle.height
            };
            
            if (this.rectanglesCollide(playerRect, obstacleRect) && !this.player.isInAir) {
                this.crash();
                return;
            }
        }
        
        // Check coin collisions
        this.coins = this.coins.filter(coin => {
            const coinRect = {
                x: coin.x - coin.width / 2,
                y: coin.y - coin.height / 2,
                width: coin.width,
                height: coin.height
            };
            
            if (this.rectanglesCollide(playerRect, coinRect) && !coin.collected) {
                coin.collected = true;
                this.score += 50;
                this.createCoinParticles(coin.x, coin.y);
                return false;
            }
            return true;
        });
        
        // Check ramp collisions
        for (let ramp of this.ramps) {
            const rampRect = {
                x: ramp.x - ramp.width / 2,
                y: ramp.y - ramp.height / 2,
                width: ramp.width,
                height: ramp.height
            };
            
            if (this.rectanglesCollide(playerRect, rampRect) && !this.player.isInAir) {
                this.player.isInAir = true;
                this.player.airTime = 0;
                this.camera.shake = 15;
                this.createJumpParticles();
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
        this.camera.shake = 40;
        this.createCrashParticles();
        this.gameOver();
    }
    
    createExhaustParticles() {
        for (let i = 0; i < 2; i++) {
            this.particles.push({
                x: this.player.x + (Math.random() - 0.5) * this.player.width,
                y: this.player.y + this.player.height / 2,
                velocity: {
                    x: (Math.random() - 0.5) * 2,
                    y: Math.random() * 3 + 2
                },
                size: 3 + Math.random() * 4,
                alpha: 0.6,
                color: `hsl(${220 + Math.random() * 40}, 70%, 60%)`,
                decay: 0.03,
                shrink: 0.96
            });
        }
    }
    
    createStuntParticles() {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: this.player.x,
                y: this.player.y,
                velocity: {
                    x: (Math.random() - 0.5) * 8,
                    y: (Math.random() - 0.5) * 8
                },
                size: 4 + Math.random() * 6,
                alpha: 1,
                color: `hsl(${Math.random() * 60 + 300}, 100%, 70%)`,
                decay: 0.02,
                shrink: 0.97
            });
        }
    }
    
    createCoinParticles(x, y) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x,
                y: y,
                velocity: {
                    x: (Math.random() - 0.5) * 6,
                    y: (Math.random() - 0.5) * 6
                },
                size: 2 + Math.random() * 3,
                alpha: 1,
                color: '#ffd700',
                decay: 0.03,
                shrink: 0.95
            });
        }
    }
    
    createJumpParticles() {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: this.player.x + (Math.random() - 0.5) * this.player.width,
                y: this.player.y + this.player.height / 2,
                velocity: {
                    x: (Math.random() - 0.5) * 4,
                    y: Math.random() * 4 + 2
                },
                size: 3 + Math.random() * 4,
                alpha: 0.8,
                color: '#888',
                decay: 0.04,
                shrink: 0.94
            });
        }
    }
    
    createLandingParticles() {
        for (let i = 0; i < 12; i++) {
            this.particles.push({
                x: this.player.x + (Math.random() - 0.5) * this.player.width * 2,
                y: this.player.y + this.player.height / 2,
                velocity: {
                    x: (Math.random() - 0.5) * 6,
                    y: Math.random() * 3 + 1
                },
                size: 4 + Math.random() * 5,
                alpha: 0.9,
                color: '#666',
                decay: 0.03,
                shrink: 0.96
            });
        }
    }
    
    createCrashParticles() {
        for (let i = 0; i < 25; i++) {
            this.particles.push({
                x: this.player.x,
                y: this.player.y,
                velocity: {
                    x: (Math.random() - 0.5) * 12,
                    y: (Math.random() - 0.5) * 12
                },
                size: 3 + Math.random() * 6,
                alpha: 1,
                color: `hsl(${Math.random() * 60}, 100%, 60%)`,
                decay: 0.02,
                shrink: 0.98
            });
        }
    }
    
    updateGameProgression() {
        this.score += Math.floor(this.player.speed / 2);
        
        // Level progression
        const newLevel = Math.floor(this.score / 2000) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.gameSpeed += 0.5;
            this.spawnRate = Math.max(50, this.spawnRate - 5);
        }
    }
    
    render() {
        // Apply camera shake
        let shakeX = 0, shakeY = 0;
        if (this.camera.shake > 0) {
            shakeX = (Math.random() - 0.5) * this.camera.shake;
            shakeY = (Math.random() - 0.5) * this.camera.shake;
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
        
        // Draw game objects
        this.drawObstacles();
        this.drawCoins();
        this.drawRamps();
        
        // Draw player
        this.drawPlayer();
        
        // Draw particles
        this.drawParticles();
        
        this.ctx.restore();
        
        // Draw UI overlays
        if (this.gamePaused) {
            this.drawPauseOverlay();
        }
    }
    
    drawRoad() {
        const roadLeft = this.road.x - this.road.width / 2;
        const roadRight = this.road.x + this.road.width / 2;
        
        // Draw road surface
        this.ctx.fillStyle = '#444';
        this.ctx.fillRect(roadLeft, 0, this.road.width, this.canvas.height);
        
        // Draw road edges
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(roadLeft - 8, 0, 8, this.canvas.height);
        this.ctx.fillRect(roadRight, 0, 8, this.canvas.height);
        
        // Draw lane dividers
        this.ctx.fillStyle = '#ffff00';
        const laneWidth = this.road.width / this.road.lanes;
        for (let i = 1; i < this.road.lanes; i++) {
            const laneX = roadLeft + i * laneWidth;
            for (let y = -this.road.stripeOffset; y < this.canvas.height; y += 80) {
                this.ctx.fillRect(laneX - 3, y, 6, 40);
            }
        }
    }
    
    drawObstacles() {
        this.obstacles.forEach(obstacle => {
            if (obstacle.type === 'car') {
                // Draw car
                this.ctx.fillStyle = '#ff6b6b';
                this.ctx.fillRect(
                    obstacle.x - obstacle.width / 2,
                    obstacle.y - obstacle.height / 2,
                    obstacle.width,
                    obstacle.height
                );
                
                // Car details
                this.ctx.fillStyle = '#000';
                this.ctx.fillRect(
                    obstacle.x - obstacle.width / 2 + 5,
                    obstacle.y - obstacle.height / 2 + 5,
                    obstacle.width - 10,
                    obstacle.height - 10
                );
            } else {
                // Draw barrier
                this.ctx.fillStyle = '#ff9500';
                this.ctx.fillRect(
                    obstacle.x - obstacle.width / 2,
                    obstacle.y - obstacle.height / 2,
                    obstacle.width,
                    obstacle.height
                );
                
                // Barrier stripes
                this.ctx.fillStyle = '#fff';
                for (let i = 0; i < 3; i++) {
                    this.ctx.fillRect(
                        obstacle.x - obstacle.width / 2 + 5,
                        obstacle.y - obstacle.height / 2 + i * 20,
                        obstacle.width - 10,
                        5
                    );
                }
            }
        });
    }
    
    drawCoins() {
        this.coins.forEach(coin => {
            if (!coin.collected) {
                this.ctx.save();
                this.ctx.translate(coin.x, coin.y);
                this.ctx.rotate(coin.rotation * Math.PI / 180);
                
                // Draw coin
                this.ctx.fillStyle = '#ffd700';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, coin.width / 2, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Coin shine
                this.ctx.fillStyle = '#ffff99';
                this.ctx.beginPath();
                this.ctx.arc(-3, -3, coin.width / 4, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.restore();
            }
        });
    }
    
    drawRamps() {
        this.ramps.forEach(ramp => {
            // Draw ramp
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fillRect(
                ramp.x - ramp.width / 2,
                ramp.y - ramp.height / 2,
                ramp.width,
                ramp.height
            );
            
            // Ramp surface
            this.ctx.fillStyle = '#A0522D';
            this.ctx.fillRect(
                ramp.x - ramp.width / 2 + 2,
                ramp.y - ramp.height / 2 + 2,
                ramp.width - 4,
                ramp.height - 4
            );
        });
    }
    
    drawPlayer() {
        this.ctx.save();
        this.ctx.translate(this.player.x, this.player.y);
        
        if (this.player.isStunting) {
            this.ctx.rotate(this.player.stuntRotation * Math.PI / 180);
        } else {
            this.ctx.rotate(this.player.rotation * Math.PI / 180);
        }
        
        // Moto body
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.fillRect(-this.player.width / 2, -this.player.height / 2, this.player.width, this.player.height);
        
        // Moto details
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(-this.player.width / 2 + 5, -this.player.height / 2 + 10, this.player.width - 10, this.player.height - 20);
        
        // Wheels
        this.ctx.fillStyle = '#333';
        this.ctx.beginPath();
        this.ctx.arc(-this.player.width / 4, this.player.height / 3, 8, 0, Math.PI * 2);
        this.ctx.arc(this.player.width / 4, this.player.height / 3, 8, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Headlight
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(0, -this.player.height / 2, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
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
        this.speedElement.textContent = Math.floor(this.player.speed * 15) + ' km/h';
        this.stuntScoreElement.textContent = this.stuntScore;
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
        const totalScore = this.score + this.stuntScore;
        if (totalScore > this.highScore) {
            this.highScore = totalScore;
            localStorage.setItem('extremeMotoHighScore', this.highScore);
        }
        
        // Show game over screen
        setTimeout(() => {
            alert(`游戏结束！\n得分: ${this.score}\n特技分: ${this.stuntScore}\n总分: ${totalScore}\n等级: ${this.level}\n最高分: ${this.highScore}`);
        }, 100);
    }
    
    restartGame() {
        this.score = 0;
        this.stuntScore = 0;
        this.level = 1;
        this.gameSpeed = 1;
        this.spawnRate = 100;
        
        // Reset player
        this.player.x = this.canvas.width / 2;
        this.player.y = this.canvas.height - 150;
        this.player.speed = 0;
        this.player.turnSpeed = 0;
        this.player.rotation = 0;
        this.player.isStunting = false;
        this.player.stuntTime = 0;
        this.player.stuntRotation = 0;
        this.player.isInAir = false;
        this.player.airTime = 0;
        
        // Clear game objects
        this.obstacles = [];
        this.coins = [];
        this.ramps = [];
        this.particles = [];
        this.spawnTimer = 0;
        this.camera.shake = 0;
        
        this.startGame();
        document.getElementById('pauseBtn').textContent = '⏸️ 暂停';
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new ExtremeMoto();
});

// Handle window resize
window.addEventListener('resize', () => {
    const canvas = document.getElementById('gameCanvas');
    const container = canvas.parentElement;
    const maxWidth = Math.min(container.clientWidth - 40, 800);
    const aspectRatio = 600 / 800;
    
    canvas.style.width = maxWidth + 'px';
    canvas.style.height = (maxWidth * aspectRatio) + 'px';
});

// Trigger initial resize
window.dispatchEvent(new Event('resize'));