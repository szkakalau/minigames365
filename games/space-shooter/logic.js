class SpaceShooter {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.gameState = 'playing'; // playing, paused, gameOver, levelUp
        this.score = 0;
        this.level = 1;
        this.health = 3;
        this.kills = 0;
        this.weaponType = 'basic';
        this.isMuted = false;
        
        // Player properties
        this.player = {
            x: this.canvas.width / 2 - 20,
            y: this.canvas.height - 80,
            width: 40,
            height: 60,
            speed: 7,
            color: '#00d4ff',
            invulnerable: false,
            invulnerableTime: 0
        };
        
        // Game objects
        this.bullets = [];
        this.enemies = [];
        this.enemyBullets = [];
        this.powerUps = [];
        this.particles = [];
        this.stars = [];
        
        // Input handling
        this.keys = {};
        this.touchControls = {
            left: false,
            right: false,
            shoot: false,
            special: false
        };
        
        // Game timing
        this.lastShot = 0;
        this.shootCooldown = 200; // milliseconds
        this.enemySpawnRate = 1000;
        this.lastEnemySpawn = 0;
        this.powerUpSpawnRate = 15000;
        this.lastPowerUpSpawn = 0;
        
        // Weapon properties
        this.weapons = {
            basic: { damage: 1, speed: 10, cooldown: 200, color: '#00d4ff' },
            rapid: { damage: 1, speed: 12, cooldown: 100, color: '#ff6b6b' },
            heavy: { damage: 3, speed: 8, cooldown: 400, color: '#ffd700' },
            spread: { damage: 1, speed: 10, cooldown: 250, color: '#9b59b6' }
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.createStars();
        this.gameLoop();
        this.updateUI();
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space') {
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Mobile controls
        const leftBtn = document.getElementById('leftBtn');
        const rightBtn = document.getElementById('rightBtn');
        const shootBtn = document.getElementById('shootBtn');
        const specialBtn = document.getElementById('specialBtn');
        
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
        
        shootBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchControls.shoot = true;
        });
        
        shootBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touchControls.shoot = false;
        });
        
        specialBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchControls.special = true;
        });
        
        specialBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touchControls.special = false;
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
    
    createStars() {
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 2 + 1,
                opacity: Math.random() * 0.8 + 0.2
            });
        }
    }
    
    gameLoop() {
        if (this.gameState === 'playing') {
            this.update();
        }
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        const now = Date.now();
        
        this.handleInput();
        this.updatePlayer();
        this.updateBullets();
        this.updateEnemies();
        this.updateEnemyBullets();
        this.updatePowerUps();
        this.updateParticles();
        this.updateStars();
        this.spawnEnemies(now);
        this.spawnPowerUps(now);
        this.checkCollisions();
        this.checkLevelUp();
    }
    
    handleInput() {
        // Player movement
        if (this.keys['ArrowLeft'] || this.keys['KeyA'] || this.touchControls.left) {
            this.player.x -= this.player.speed;
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD'] || this.touchControls.right) {
            this.player.x += this.player.speed;
        }
        
        // Keep player within bounds
        this.player.x = Math.max(0, Math.min(this.canvas.width - this.player.width, this.player.x));
        
        // Shooting
        if ((this.keys['Space'] || this.touchControls.shoot) && this.canShoot()) {
            this.shoot();
        }
        
        // Special attack
        if ((this.keys['KeyX'] || this.touchControls.special) && this.canShoot()) {
            this.specialAttack();
        }
    }
    
    updatePlayer() {
        // Handle invulnerability
        if (this.player.invulnerable) {
            this.player.invulnerableTime--;
            if (this.player.invulnerableTime <= 0) {
                this.player.invulnerable = false;
            }
        }
    }
    
    canShoot() {
        const now = Date.now();
        const weapon = this.weapons[this.weaponType];
        return now - this.lastShot > weapon.cooldown;
    }
    
    shoot() {
        const now = Date.now();
        this.lastShot = now;
        
        const weapon = this.weapons[this.weaponType];
        const centerX = this.player.x + this.player.width / 2;
        
        if (this.weaponType === 'spread') {
            // Spread shot - 3 bullets
            for (let i = -1; i <= 1; i++) {
                this.bullets.push({
                    x: centerX - 2,
                    y: this.player.y,
                    width: 4,
                    height: 10,
                    speed: weapon.speed,
                    damage: weapon.damage,
                    color: weapon.color,
                    velocityX: i * 2,
                    velocityY: -weapon.speed
                });
            }
        } else {
            // Single shot
            this.bullets.push({
                x: centerX - 2,
                y: this.player.y,
                width: 4,
                height: 10,
                speed: weapon.speed,
                damage: weapon.damage,
                color: weapon.color,
                velocityX: 0,
                velocityY: -weapon.speed
            });
        }
        
        // Create muzzle flash particles
        this.createParticles(centerX, this.player.y, weapon.color, 3);
    }
    
    specialAttack() {
        const now = Date.now();
        this.lastShot = now;
        
        // Create a powerful laser beam
        this.bullets.push({
            x: this.player.x + this.player.width / 2 - 5,
            y: this.player.y,
            width: 10,
            height: this.canvas.height,
            speed: 0,
            damage: 5,
            color: '#ffffff',
            velocityX: 0,
            velocityY: 0,
            special: true,
            life: 10
        });
        
        // Create special effect particles
        this.createParticles(this.player.x + this.player.width / 2, this.player.y, '#ffffff', 10);
    }
    
    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            if (bullet.special) {
                bullet.life--;
                if (bullet.life <= 0) {
                    this.bullets.splice(i, 1);
                }
            } else {
                bullet.x += bullet.velocityX;
                bullet.y += bullet.velocityY;
                
                if (bullet.y < -bullet.height || bullet.x < 0 || bullet.x > this.canvas.width) {
                    this.bullets.splice(i, 1);
                }
            }
        }
    }
    
    spawnEnemies(now) {
        if (now - this.lastEnemySpawn > this.enemySpawnRate) {
            this.lastEnemySpawn = now;
            
            const enemyTypes = ['basic', 'fast', 'heavy', 'shooter'];
            const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            
            let enemy;
            switch (type) {
                case 'basic':
                    enemy = {
                        x: Math.random() * (this.canvas.width - 40),
                        y: -40,
                        width: 40,
                        height: 40,
                        speed: 2 + this.level * 0.5,
                        health: 1,
                        color: '#e74c3c',
                        type: 'basic',
                        score: 10
                    };
                    break;
                case 'fast':
                    enemy = {
                        x: Math.random() * (this.canvas.width - 30),
                        y: -30,
                        width: 30,
                        height: 30,
                        speed: 4 + this.level * 0.5,
                        health: 1,
                        color: '#f39c12',
                        type: 'fast',
                        score: 15
                    };
                    break;
                case 'heavy':
                    enemy = {
                        x: Math.random() * (this.canvas.width - 60),
                        y: -60,
                        width: 60,
                        height: 60,
                        speed: 1 + this.level * 0.3,
                        health: 3,
                        color: '#8e44ad',
                        type: 'heavy',
                        score: 30
                    };
                    break;
                case 'shooter':
                    enemy = {
                        x: Math.random() * (this.canvas.width - 45),
                        y: -45,
                        width: 45,
                        height: 45,
                        speed: 1.5 + this.level * 0.3,
                        health: 2,
                        color: '#27ae60',
                        type: 'shooter',
                        score: 25,
                        lastShot: 0,
                        shootCooldown: 2000
                    };
                    break;
            }
            
            this.enemies.push(enemy);
            
            // Increase spawn rate with level
            this.enemySpawnRate = Math.max(300, 1000 - this.level * 50);
        }
    }
    
    updateEnemies() {
        const now = Date.now();
        
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.y += enemy.speed;
            
            // Enemy shooting
            if (enemy.type === 'shooter' && now - enemy.lastShot > enemy.shootCooldown) {
                enemy.lastShot = now;
                this.enemyBullets.push({
                    x: enemy.x + enemy.width / 2 - 2,
                    y: enemy.y + enemy.height,
                    width: 4,
                    height: 8,
                    speed: 5,
                    color: '#e74c3c'
                });
            }
            
            // Remove enemies that are off screen
            if (enemy.y > this.canvas.height) {
                this.enemies.splice(i, 1);
                this.health--;
                if (this.health <= 0) {
                    this.gameOver();
                }
                this.updateUI();
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
    
    spawnPowerUps(now) {
        if (now - this.lastPowerUpSpawn > this.powerUpSpawnRate) {
            this.lastPowerUpSpawn = now;
            
            const types = ['weapon', 'health', 'special'];
            const type = types[Math.floor(Math.random() * types.length)];
            
            this.powerUps.push({
                x: Math.random() * (this.canvas.width - 30),
                y: -30,
                width: 30,
                height: 30,
                speed: 2,
                type: type,
                color: type === 'weapon' ? '#3498db' : type === 'health' ? '#e74c3c' : '#2ecc71',
                rotation: 0
            });
        }
    }
    
    updatePowerUps() {
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            powerUp.y += powerUp.speed;
            powerUp.rotation += 0.1;
            
            if (powerUp.y > this.canvas.height) {
                this.powerUps.splice(i, 1);
            }
        }
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.velocityX;
            particle.y += particle.velocityY;
            particle.life--;
            particle.opacity = particle.life / particle.maxLife;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    updateStars() {
        for (let star of this.stars) {
            star.y += star.speed;
            if (star.y > this.canvas.height) {
                star.y = -star.size;
                star.x = Math.random() * this.canvas.width;
            }
        }
    }
    
    checkCollisions() {
        // Player bullets vs enemies
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                
                if (this.checkRectCollision(bullet, enemy)) {
                    // Damage enemy
                    enemy.health -= bullet.damage;
                    
                    // Create hit particles
                    this.createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color, 5);
                    
                    // Remove bullet (unless it's special)
                    if (!bullet.special) {
                        this.bullets.splice(i, 1);
                    }
                    
                    // Remove enemy if health <= 0
                    if (enemy.health <= 0) {
                        this.score += enemy.score;
                        this.kills++;
                        this.createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ffd700', 8);
                        this.enemies.splice(j, 1);
                    }
                    
                    this.updateUI();
                    break;
                }
            }
        }
        
        // Enemy bullets vs player
        if (!this.player.invulnerable) {
            for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
                const bullet = this.enemyBullets[i];
                
                if (this.checkRectCollision(bullet, this.player)) {
                    this.health--;
                    this.player.invulnerable = true;
                    this.player.invulnerableTime = 120; // 2 seconds at 60fps
                    
                    this.createParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, '#e74c3c', 8);
                    this.enemyBullets.splice(i, 1);
                    
                    if (this.health <= 0) {
                        this.gameOver();
                    }
                    
                    this.updateUI();
                    break;
                }
            }
        }
        
        // Enemies vs player
        if (!this.player.invulnerable) {
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const enemy = this.enemies[i];
                
                if (this.checkRectCollision(enemy, this.player)) {
                    this.health--;
                    this.player.invulnerable = true;
                    this.player.invulnerableTime = 120;
                    
                    this.createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color, 8);
                    this.enemies.splice(i, 1);
                    
                    if (this.health <= 0) {
                        this.gameOver();
                    }
                    
                    this.updateUI();
                    break;
                }
            }
        }
        
        // Power-ups vs player
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            
            if (this.checkRectCollision(powerUp, this.player)) {
                this.collectPowerUp(powerUp);
                this.createParticles(powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2, powerUp.color, 6);
                this.powerUps.splice(i, 1);
            }
        }
    }
    
    collectPowerUp(powerUp) {
        switch (powerUp.type) {
            case 'weapon':
                const weapons = ['rapid', 'heavy', 'spread'];
                this.weaponType = weapons[Math.floor(Math.random() * weapons.length)];
                break;
            case 'health':
                this.health = Math.min(this.health + 1, 5);
                break;
            case 'special':
                this.score += 100;
                break;
        }
        this.updateUI();
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
                velocityX: (Math.random() - 0.5) * 8,
                velocityY: (Math.random() - 0.5) * 8,
                color: color,
                life: 30 + Math.random() * 20,
                maxLife: 50,
                opacity: 1,
                size: Math.random() * 3 + 1
            });
        }
    }
    
    checkLevelUp() {
        const newLevel = Math.floor(this.score / 1000) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.levelUp();
        }
    }
    
    levelUp() {
        this.gameState = 'levelUp';
        
        // Calculate bonus
        const bonus = this.level * 500;
        this.score += bonus;
        
        // Show level up screen
        document.getElementById('newLevel').textContent = this.level;
        document.getElementById('levelBonus').textContent = bonus;
        document.getElementById('levelUp').style.display = 'flex';
        
        this.updateUI();
    }
    
    hideLevelUp() {
        document.getElementById('levelUp').style.display = 'none';
        this.gameState = 'playing';
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000011';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw stars
        for (let star of this.stars) {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
            this.ctx.fillRect(star.x, star.y, star.size, star.size);
        }
        
        // Draw player
        if (!this.player.invulnerable || Math.floor(Date.now() / 100) % 2) {
            this.ctx.fillStyle = this.player.color;
            this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
            
            // Player details
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(this.player.x + 15, this.player.y + 10, 10, 20);
            this.ctx.fillRect(this.player.x + 5, this.player.y + 40, 30, 10);
        }
        
        // Draw bullets
        for (let bullet of this.bullets) {
            if (bullet.special) {
                // Draw laser beam
                this.ctx.fillStyle = bullet.color;
                this.ctx.globalAlpha = 0.8;
                this.ctx.fillRect(bullet.x, 0, bullet.width, this.canvas.height);
                
                // Laser glow effect
                this.ctx.shadowColor = bullet.color;
                this.ctx.shadowBlur = 20;
                this.ctx.fillRect(bullet.x + 2, 0, bullet.width - 4, this.canvas.height);
                this.ctx.shadowBlur = 0;
                this.ctx.globalAlpha = 1;
            } else {
                this.ctx.fillStyle = bullet.color;
                this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            }
        }
        
        // Draw enemies
        for (let enemy of this.enemies) {
            this.ctx.fillStyle = enemy.color;
            this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            
            // Enemy details based on type
            this.ctx.fillStyle = '#ffffff';
            if (enemy.type === 'basic') {
                this.ctx.fillRect(enemy.x + 10, enemy.y + 10, 20, 20);
            } else if (enemy.type === 'fast') {
                this.ctx.fillRect(enemy.x + 5, enemy.y + 5, 20, 20);
                this.ctx.fillRect(enemy.x + 10, enemy.y + 15, 10, 10);
            } else if (enemy.type === 'heavy') {
                this.ctx.fillRect(enemy.x + 15, enemy.y + 15, 30, 30);
                this.ctx.fillRect(enemy.x + 5, enemy.y + 25, 50, 10);
            } else if (enemy.type === 'shooter') {
                this.ctx.fillRect(enemy.x + 10, enemy.y + 10, 25, 25);
                this.ctx.fillRect(enemy.x + 20, enemy.y + 35, 5, 10);
            }
        }
        
        // Draw enemy bullets
        this.ctx.fillStyle = '#e74c3c';
        for (let bullet of this.enemyBullets) {
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        }
        
        // Draw power-ups
        for (let powerUp of this.powerUps) {
            this.ctx.save();
            this.ctx.translate(powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2);
            this.ctx.rotate(powerUp.rotation);
            
            this.ctx.fillStyle = powerUp.color;
            this.ctx.fillRect(-powerUp.width / 2, -powerUp.height / 2, powerUp.width, powerUp.height);
            
            // Power-up symbol
            this.ctx.fillStyle = '#ffffff';
            if (powerUp.type === 'weapon') {
                this.ctx.fillRect(-8, -2, 16, 4);
                this.ctx.fillRect(-2, -8, 4, 16);
            } else if (powerUp.type === 'health') {
                this.ctx.fillRect(-6, -2, 12, 4);
                this.ctx.fillRect(-2, -6, 4, 12);
            } else if (powerUp.type === 'special') {
                this.ctx.fillRect(-6, -6, 12, 12);
            }
            
            this.ctx.restore();
        }
        
        // Draw particles
        for (let particle of this.particles) {
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.opacity;
            this.ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
        }
        this.ctx.globalAlpha = 1;
        
        // Draw pause overlay
        if (this.gameState === 'paused') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#00d4ff';
            this.ctx.font = '36px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('游戏暂停', this.canvas.width / 2, this.canvas.height / 2);
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        
        // Save high score
        const highScore = localStorage.getItem('space-shooter-high-score') || 0;
        if (this.score > highScore) {
            localStorage.setItem('space-shooter-high-score', this.score);
        }
        
        // Show game over screen
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalLevel').textContent = this.level;
        document.getElementById('finalKills').textContent = this.kills;
        document.getElementById('highScore').textContent = Math.max(this.score, highScore);
        document.getElementById('gameOver').style.display = 'flex';
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
        this.health = 3;
        this.kills = 0;
        this.weaponType = 'basic';
        
        // Reset player
        this.player.x = this.canvas.width / 2 - 20;
        this.player.y = this.canvas.height - 80;
        this.player.invulnerable = false;
        this.player.invulnerableTime = 0;
        
        // Clear all game objects
        this.bullets = [];
        this.enemies = [];
        this.enemyBullets = [];
        this.powerUps = [];
        this.particles = [];
        
        // Reset timing
        this.lastShot = 0;
        this.lastEnemySpawn = 0;
        this.lastPowerUpSpawn = 0;
        this.enemySpawnRate = 1000;
        
        this.hideGameOver();
        this.hideLevelUp();
        this.updateUI();
    }
    
    updateUI() {
        document.getElementById('health').textContent = this.health;
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('kills').textContent = this.kills;
        document.getElementById('weapon').textContent = this.getWeaponName();
        
        const pauseBtn = document.getElementById('pauseBtn');
        pauseBtn.textContent = this.gameState === 'paused' ? '▶️ 继续' : '⏸️ 暂停';
    }
    
    getWeaponName() {
        const names = {
            basic: '基础',
            rapid: '速射',
            heavy: '重炮',
            spread: '散射'
        };
        return names[this.weaponType] || '基础';
    }
}

// Global game instance
let game;

// Initialize game when page loads
window.addEventListener('load', () => {
    game = new SpaceShooter();
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