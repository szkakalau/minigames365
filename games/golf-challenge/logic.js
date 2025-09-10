class GolfChallenge {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.strokesElement = document.getElementById('strokes');
        this.levelElement = document.getElementById('level');
        this.bestScoreElement = document.getElementById('bestScore');
        this.powerFillElement = document.getElementById('powerFill');
        
        // 游戏状态
        this.gameState = 'waiting'; // waiting, aiming, shooting, moving, completed, gameOver
        this.strokes = 0;
        this.level = 1;
        this.bestScore = parseInt(localStorage.getItem('golfBestScore')) || 0;
        this.totalStrokes = 0;
        
        // 球的属性
        this.ball = {
            x: 100,
            y: 500,
            vx: 0,
            vy: 0,
            radius: 8,
            friction: 0.98,
            bounce: 0.7,
            trail: [],
            inHole: false
        };
        
        // 洞的属性
        this.hole = {
            x: 700,
            y: 100,
            radius: 20
        };
        
        // 击球控制
        this.aiming = {
            active: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            power: 0,
            angle: 0,
            maxPower: 15
        };
        
        // 地形和障碍
        this.terrain = [];
        this.obstacles = [];
        this.wind = { x: 0, y: 0 };
        
        // 游戏区域
        this.world = {
            width: 800,
            height: 600,
            gravity: 0.3
        };
        
        // 输入状态
        this.mouse = { x: 0, y: 0, isDown: false };
        this.touch = { active: false, x: 0, y: 0 };
        
        // 特效
        this.effects = [];
        
        // 游戏循环
        this.lastTime = 0;
        this.animationId = null;
        
        this.setupCanvas();
        this.setupEventListeners();
        this.generateLevel();
        this.updateDisplay();
        this.updateBestScore();
    }
    
    setupCanvas() {
        // 设置高DPI支持
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        this.ctx.scale(dpr, dpr);
        
        // 设置画布样式尺寸
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        // 计算缩放比例
        this.scaleX = rect.width / this.world.width;
        this.scaleY = rect.height / this.world.height;
        
        // 防止上下文菜单
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        
        // 防止双击缩放
        this.canvas.addEventListener('dblclick', (e) => {
            e.preventDefault();
        });
        
        // 防止页面滚动
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
    }
    
    setupEventListeners() {
        // 按钮事件
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        
        // 鼠标事件
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        // 触摸事件
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        // 窗口大小变化
        window.addEventListener('resize', () => {
            setTimeout(() => this.setupCanvas(), 100);
        });
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = (e.clientX - rect.left) / this.scaleX;
        this.mouse.y = (e.clientY - rect.top) / this.scaleY;
        
        if (this.aiming.active) {
            this.aiming.currentX = this.mouse.x;
            this.aiming.currentY = this.mouse.y;
            this.updateAiming();
        }
    }
    
    handleMouseDown(e) {
        this.mouse.isDown = true;
        if (this.gameState === 'aiming' && !this.ball.inHole) {
            this.startAiming();
        }
    }
    
    handleMouseUp(e) {
        this.mouse.isDown = false;
        if (this.aiming.active) {
            this.shoot();
        }
    }
    
    handleTouchStart(e) {
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        this.touch.active = true;
        this.touch.x = (touch.clientX - rect.left) / this.scaleX;
        this.touch.y = (touch.clientY - rect.top) / this.scaleY;
        
        if (this.gameState === 'aiming' && !this.ball.inHole) {
            this.mouse.x = this.touch.x;
            this.mouse.y = this.touch.y;
            this.startAiming();
        }
    }
    
    handleTouchMove(e) {
        if (this.touch.active) {
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            this.touch.x = (touch.clientX - rect.left) / this.scaleX;
            this.touch.y = (touch.clientY - rect.top) / this.scaleY;
            
            if (this.aiming.active) {
                this.aiming.currentX = this.touch.x;
                this.aiming.currentY = this.touch.y;
                this.updateAiming();
            }
        }
    }
    
    handleTouchEnd(e) {
        this.touch.active = false;
        if (this.aiming.active) {
            this.shoot();
        }
    }
    
    startGame() {
        this.gameState = 'aiming';
        this.strokes = 0;
        this.totalStrokes = 0;
        this.level = 1;
        this.generateLevel();
        this.updateDisplay();
        this.gameLoop();
    }
    
    restartGame() {
        this.gameState = 'waiting';
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.startGame();
    }
    
    togglePause() {
        if (this.gameState === 'aiming' || this.gameState === 'moving') {
            this.gameState = 'paused';
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
            }
        } else if (this.gameState === 'paused') {
            this.gameState = 'aiming';
            this.gameLoop();
        }
    }
    
    generateLevel() {
        // 重置球的位置
        this.ball.x = 100;
        this.ball.y = 500;
        this.ball.vx = 0;
        this.ball.vy = 0;
        this.ball.inHole = false;
        this.ball.trail = [];
        
        // 生成地形
        this.terrain = [];
        this.obstacles = [];
        
        // 基础地面
        this.terrain.push({
            type: 'ground',
            points: [
                { x: 0, y: 550 },
                { x: 800, y: 550 },
                { x: 800, y: 600 },
                { x: 0, y: 600 }
            ],
            color: '#4a7c59'
        });
        
        // 根据关卡生成不同地形
        switch (this.level) {
            case 1:
                // 简单平地
                this.hole.x = 700;
                this.hole.y = 530;
                break;
                
            case 2:
                // 添加小山丘
                this.terrain.push({
                    type: 'hill',
                    points: [
                        { x: 300, y: 550 },
                        { x: 400, y: 450 },
                        { x: 500, y: 550 }
                    ],
                    color: '#5d8a6b'
                });
                this.hole.x = 650;
                this.hole.y = 530;
                break;
                
            case 3:
                // 添加水障碍
                this.obstacles.push({
                    type: 'water',
                    x: 350,
                    y: 500,
                    width: 100,
                    height: 50,
                    color: '#4a90e2'
                });
                this.hole.x = 700;
                this.hole.y = 530;
                break;
                
            case 4:
                // 添加沙坑
                this.obstacles.push({
                    type: 'sand',
                    x: 250,
                    y: 520,
                    width: 150,
                    height: 30,
                    color: '#f5deb3'
                });
                this.hole.x = 650;
                this.hole.y = 530;
                break;
                
            default:
                // 复杂地形
                const numObstacles = Math.min(this.level - 4, 3);
                for (let i = 0; i < numObstacles; i++) {
                    const x = 200 + i * 150;
                    const type = Math.random() < 0.5 ? 'water' : 'sand';
                    this.obstacles.push({
                        type: type,
                        x: x,
                        y: type === 'water' ? 500 : 520,
                        width: 80,
                        height: type === 'water' ? 50 : 30,
                        color: type === 'water' ? '#4a90e2' : '#f5deb3'
                    });
                }
                this.hole.x = 700;
                this.hole.y = 530;
                break;
        }
        
        // 生成风力
        this.wind.x = (Math.random() - 0.5) * 0.1;
        this.wind.y = (Math.random() - 0.5) * 0.05;
    }
    
    startAiming() {
        if (this.gameState !== 'aiming') return;
        
        this.aiming.active = true;
        this.aiming.startX = this.mouse.x || this.touch.x;
        this.aiming.startY = this.mouse.y || this.touch.y;
        this.aiming.currentX = this.aiming.startX;
        this.aiming.currentY = this.aiming.startY;
    }
    
    updateAiming() {
        const dx = this.aiming.currentX - this.ball.x;
        const dy = this.aiming.currentY - this.ball.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        this.aiming.power = Math.min(distance / 50, 1) * this.aiming.maxPower;
        this.aiming.angle = Math.atan2(dy, dx);
        
        // 更新力度条
        const powerPercent = (this.aiming.power / this.aiming.maxPower) * 100;
        this.powerFillElement.style.width = powerPercent + '%';
    }
    
    shoot() {
        if (!this.aiming.active) return;
        
        this.aiming.active = false;
        this.gameState = 'moving';
        this.strokes++;
        this.totalStrokes++;
        
        // 设置球的速度
        this.ball.vx = Math.cos(this.aiming.angle) * this.aiming.power;
        this.ball.vy = Math.sin(this.aiming.angle) * this.aiming.power;
        
        // 重置力度条
        this.powerFillElement.style.width = '0%';
        
        this.updateDisplay();
        this.createShotEffect();
    }
    
    updatePhysics() {
        if (this.gameState !== 'moving') return;
        
        // 应用重力
        this.ball.vy += this.world.gravity;
        
        // 应用风力
        this.ball.vx += this.wind.x;
        this.ball.vy += this.wind.y;
        
        // 更新位置
        this.ball.x += this.ball.vx;
        this.ball.y += this.ball.vy;
        
        // 添加轨迹点
        this.ball.trail.push({ x: this.ball.x, y: this.ball.y });
        if (this.ball.trail.length > 15) {
            this.ball.trail.shift();
        }
        
        // 地面碰撞
        this.checkGroundCollision();
        
        // 障碍物碰撞
        this.checkObstacleCollision();
        
        // 洞检测
        this.checkHole();
        
        // 边界检测
        this.checkBoundaries();
        
        // 摩擦力
        if (Math.abs(this.ball.vx) < 0.1 && Math.abs(this.ball.vy) < 0.1 && this.ball.y >= 530) {
            this.ball.vx = 0;
            this.ball.vy = 0;
            this.gameState = 'aiming';
        }
    }
    
    checkGroundCollision() {
        // 简单地面碰撞
        if (this.ball.y + this.ball.radius >= 550) {
            this.ball.y = 550 - this.ball.radius;
            this.ball.vy *= -this.ball.bounce;
            this.ball.vx *= this.ball.friction;
            
            if (Math.abs(this.ball.vy) < 1) {
                this.ball.vy = 0;
            }
        }
    }
    
    checkObstacleCollision() {
        for (const obstacle of this.obstacles) {
            if (this.ball.x + this.ball.radius > obstacle.x &&
                this.ball.x - this.ball.radius < obstacle.x + obstacle.width &&
                this.ball.y + this.ball.radius > obstacle.y &&
                this.ball.y - this.ball.radius < obstacle.y + obstacle.height) {
                
                if (obstacle.type === 'water') {
                    // 水障碍：球重置到起始位置
                    this.ball.x = 100;
                    this.ball.y = 500;
                    this.ball.vx = 0;
                    this.ball.vy = 0;
                    this.strokes++;
                    this.totalStrokes++;
                    this.gameState = 'aiming';
                    this.createWaterEffect();
                } else if (obstacle.type === 'sand') {
                    // 沙坑：减慢速度
                    this.ball.vx *= 0.5;
                    this.ball.vy *= 0.5;
                    this.createSandEffect();
                }
                
                this.updateDisplay();
            }
        }
    }
    
    checkHole() {
        const dx = this.ball.x - this.hole.x;
        const dy = this.ball.y - this.hole.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.hole.radius && Math.abs(this.ball.vx) < 3 && Math.abs(this.ball.vy) < 3) {
            this.ball.inHole = true;
            this.ball.x = this.hole.x;
            this.ball.y = this.hole.y;
            this.ball.vx = 0;
            this.ball.vy = 0;
            this.gameState = 'completed';
            
            this.createHoleEffect();
            
            // 延迟进入下一关
            setTimeout(() => {
                this.nextLevel();
            }, 2000);
        }
    }
    
    checkBoundaries() {
        if (this.ball.x < 0 || this.ball.x > this.world.width) {
            this.ball.x = 100;
            this.ball.y = 500;
            this.ball.vx = 0;
            this.ball.vy = 0;
            this.strokes++;
            this.totalStrokes++;
            this.gameState = 'aiming';
            this.updateDisplay();
        }
    }
    
    nextLevel() {
        this.level++;
        this.strokes = 0;
        this.generateLevel();
        this.gameState = 'aiming';
        this.updateDisplay();
        
        if (this.level > 10) {
            this.endGame();
        }
    }
    
    endGame() {
        this.gameState = 'gameOver';
        this.updateBestScore();
        this.createGameOverEffect();
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
    
    createShotEffect() {
        for (let i = 0; i < 5; i++) {
            this.effects.push({
                x: this.ball.x,
                y: this.ball.y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                life: 20,
                maxLife: 20,
                color: '#ffff00',
                size: Math.random() * 3 + 1
            });
        }
    }
    
    createHoleEffect() {
        for (let i = 0; i < 15; i++) {
            this.effects.push({
                x: this.hole.x,
                y: this.hole.y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 40,
                maxLife: 40,
                color: '#00ff00',
                size: Math.random() * 5 + 2
            });
        }
        
        this.effects.push({
            x: this.world.width / 2,
            y: this.world.height / 2,
            text: `关卡 ${this.level} 完成！`,
            color: '#00ff00',
            life: 120,
            maxLife: 120,
            size: 32
        });
    }
    
    createWaterEffect() {
        for (let i = 0; i < 10; i++) {
            this.effects.push({
                x: this.ball.x,
                y: this.ball.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 30,
                maxLife: 30,
                color: '#4a90e2',
                size: Math.random() * 4 + 2
            });
        }
    }
    
    createSandEffect() {
        for (let i = 0; i < 8; i++) {
            this.effects.push({
                x: this.ball.x,
                y: this.ball.y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 25,
                maxLife: 25,
                color: '#f5deb3',
                size: Math.random() * 3 + 1
            });
        }
    }
    
    createGameOverEffect() {
        this.effects.push({
            x: this.world.width / 2,
            y: this.world.height / 2,
            text: `游戏结束！总杆数：${this.totalStrokes}`,
            color: '#ff4444',
            life: 180,
            maxLife: 180,
            size: 28
        });
    }
    
    updateEffects() {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            effect.life--;
            
            if (effect.vx !== undefined) {
                effect.x += effect.vx;
                effect.y += effect.vy;
                effect.vx *= 0.95;
                effect.vy *= 0.95;
            }
            
            if (effect.life <= 0) {
                this.effects.splice(i, 1);
            }
        }
    }
    
    updateDisplay() {
        this.strokesElement.textContent = this.strokes;
        this.levelElement.textContent = this.level;
    }
    
    updateBestScore() {
        if (this.totalStrokes > 0 && (this.bestScore === 0 || this.totalStrokes < this.bestScore)) {
            this.bestScore = this.totalStrokes;
            localStorage.setItem('golfBestScore', this.bestScore.toString());
        }
        this.bestScoreElement.textContent = this.bestScore;
    }
    
    render() {
        // 清空画布
        this.ctx.fillStyle = '#87ceeb';
        this.ctx.fillRect(0, 0, this.world.width, this.world.height);
        
        // 绘制地形
        this.drawTerrain();
        
        // 绘制障碍物
        this.drawObstacles();
        
        // 绘制洞
        this.drawHole();
        
        // 绘制球的轨迹
        this.drawBallTrail();
        
        // 绘制球
        this.drawBall();
        
        // 绘制瞄准线
        this.drawAimingLine();
        
        // 绘制风向指示
        this.drawWindIndicator();
        
        // 绘制特效
        this.drawEffects();
        
        // 绘制游戏状态
        this.drawGameState();
    }
    
    drawTerrain() {
        for (const terrain of this.terrain) {
            this.ctx.fillStyle = terrain.color;
            this.ctx.beginPath();
            
            if (terrain.type === 'ground') {
                this.ctx.moveTo(terrain.points[0].x, terrain.points[0].y);
                for (let i = 1; i < terrain.points.length; i++) {
                    this.ctx.lineTo(terrain.points[i].x, terrain.points[i].y);
                }
                this.ctx.closePath();
            } else if (terrain.type === 'hill') {
                this.ctx.moveTo(terrain.points[0].x, terrain.points[0].y);
                this.ctx.quadraticCurveTo(
                    terrain.points[1].x, terrain.points[1].y,
                    terrain.points[2].x, terrain.points[2].y
                );
                this.ctx.lineTo(terrain.points[2].x, 550);
                this.ctx.lineTo(terrain.points[0].x, 550);
                this.ctx.closePath();
            }
            
            this.ctx.fill();
        }
    }
    
    drawObstacles() {
        for (const obstacle of this.obstacles) {
            this.ctx.fillStyle = obstacle.color;
            
            if (obstacle.type === 'water') {
                // 绘制水波效果
                this.ctx.save();
                this.ctx.globalAlpha = 0.8;
                this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                
                // 水波纹
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 1;
                this.ctx.globalAlpha = 0.5;
                for (let i = 0; i < 3; i++) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(obstacle.x, obstacle.y + 10 + i * 10);
                    this.ctx.quadraticCurveTo(
                        obstacle.x + obstacle.width / 2, obstacle.y + 5 + i * 10,
                        obstacle.x + obstacle.width, obstacle.y + 10 + i * 10
                    );
                    this.ctx.stroke();
                }
                this.ctx.restore();
            } else {
                this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            }
        }
    }
    
    drawHole() {
        // 洞的阴影
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(this.hole.x, this.hole.y, this.hole.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 洞的边缘
        this.ctx.strokeStyle = '#333333';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // 旗杆
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(this.hole.x, this.hole.y - this.hole.radius);
        this.ctx.lineTo(this.hole.x, this.hole.y - 60);
        this.ctx.stroke();
        
        // 旗帜
        this.ctx.fillStyle = '#ff0000';
        this.ctx.beginPath();
        this.ctx.moveTo(this.hole.x, this.hole.y - 60);
        this.ctx.lineTo(this.hole.x + 20, this.hole.y - 50);
        this.ctx.lineTo(this.hole.x, this.hole.y - 40);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    drawBallTrail() {
        for (let i = 0; i < this.ball.trail.length; i++) {
            const point = this.ball.trail[i];
            const alpha = (i + 1) / this.ball.trail.length * 0.5;
            
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, this.ball.radius * alpha, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawBall() {
        if (this.ball.inHole) return;
        
        // 球的阴影
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x + 2, this.ball.y + 2, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 球
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 球的纹理
        this.ctx.strokeStyle = '#cccccc';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius - 1, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // 球的凹点
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const x = this.ball.x + Math.cos(angle) * 3;
            const y = this.ball.y + Math.sin(angle) * 3;
            
            this.ctx.fillStyle = '#eeeeee';
            this.ctx.beginPath();
            this.ctx.arc(x, y, 1, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawAimingLine() {
        if (!this.aiming.active) return;
        
        const dx = this.aiming.currentX - this.ball.x;
        const dy = this.aiming.currentY - this.ball.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 10) {
            // 瞄准线
            this.ctx.strokeStyle = '#ff0000';
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(this.ball.x, this.ball.y);
            this.ctx.lineTo(this.aiming.currentX, this.aiming.currentY);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
            
            // 力度指示器
            const powerPercent = Math.min(distance / 100, 1);
            this.ctx.fillStyle = `hsl(${120 - powerPercent * 120}, 100%, 50%)`;
            this.ctx.beginPath();
            this.ctx.arc(this.aiming.currentX, this.aiming.currentY, 8, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawWindIndicator() {
        const x = 50;
        const y = 50;
        
        // 风向背景
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.fillRect(x - 25, y - 25, 50, 50);
        
        // 风向箭头
        const windStrength = Math.sqrt(this.wind.x * this.wind.x + this.wind.y * this.wind.y);
        if (windStrength > 0.01) {
            const windAngle = Math.atan2(this.wind.y, this.wind.x);
            const arrowLength = windStrength * 200;
            
            this.ctx.strokeStyle = '#0066cc';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(
                x + Math.cos(windAngle) * arrowLength,
                y + Math.sin(windAngle) * arrowLength
            );
            this.ctx.stroke();
            
            // 箭头头部
            const headX = x + Math.cos(windAngle) * arrowLength;
            const headY = y + Math.sin(windAngle) * arrowLength;
            
            this.ctx.beginPath();
            this.ctx.moveTo(headX, headY);
            this.ctx.lineTo(
                headX - Math.cos(windAngle - 0.5) * 8,
                headY - Math.sin(windAngle - 0.5) * 8
            );
            this.ctx.moveTo(headX, headY);
            this.ctx.lineTo(
                headX - Math.cos(windAngle + 0.5) * 8,
                headY - Math.sin(windAngle + 0.5) * 8
            );
            this.ctx.stroke();
        }
        
        // 风向标签
        this.ctx.fillStyle = '#333333';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('风向', x, y + 35);
    }
    
    drawEffects() {
        for (const effect of this.effects) {
            const alpha = effect.life / effect.maxLife;
            
            if (effect.text) {
                // 文字特效
                this.ctx.fillStyle = effect.color;
                this.ctx.globalAlpha = alpha;
                this.ctx.font = `bold ${effect.size}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.fillText(effect.text, effect.x, effect.y);
                this.ctx.globalAlpha = 1;
            } else {
                // 粒子特效
                this.ctx.fillStyle = effect.color;
                this.ctx.globalAlpha = alpha;
                this.ctx.beginPath();
                this.ctx.arc(effect.x, effect.y, effect.size, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.globalAlpha = 1;
            }
        }
    }
    
    drawGameState() {
        if (this.gameState === 'waiting') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.world.width, this.world.height);
            
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 32px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('点击开始游戏', this.world.width / 2, this.world.height / 2);
            
            this.ctx.font = '16px Arial';
            this.ctx.fillText('拖拽调整角度和力度', this.world.width / 2, this.world.height / 2 + 40);
            this.ctx.fillText('将球打入洞中', this.world.width / 2, this.world.height / 2 + 60);
        } else if (this.gameState === 'paused') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.world.width, this.world.height);
            
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 32px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('游戏暂停', this.world.width / 2, this.world.height / 2);
        }
    }
    
    gameLoop(currentTime = 0) {
        if (this.gameState === 'waiting' || this.gameState === 'paused') return;
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // 更新游戏逻辑
        this.updatePhysics();
        this.updateEffects();
        
        // 渲染
        this.render();
        
        // 继续循环
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// 初始化游戏
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new GolfChallenge();
});