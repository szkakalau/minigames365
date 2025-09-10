class TennisMatch {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');
        this.bestScoreElement = document.getElementById('bestScore');
        
        // 游戏状态
        this.gameState = 'waiting'; // waiting, playing, paused, gameOver
        this.score = 0;
        this.level = 1;
        this.bestScore = parseInt(localStorage.getItem('tennisBestScore')) || 0;
        
        // 球的属性
        this.ball = {
            x: 400,
            y: 200,
            vx: 0,
            vy: 0,
            radius: 8,
            speed: 5,
            trail: []
        };
        
        // 玩家球拍
        this.playerRacket = {
            x: 50,
            y: 180,
            width: 15,
            height: 80,
            speed: 8
        };
        
        // AI球拍
        this.aiRacket = {
            x: 735,
            y: 180,
            width: 15,
            height: 80,
            speed: 4,
            targetY: 180
        };
        
        // 游戏区域
        this.court = {
            width: 800,
            height: 400,
            netX: 400,
            netHeight: 60
        };
        
        // 比分
        this.playerScore = 0;
        this.aiScore = 0;
        this.maxScore = 11;
        
        // 输入状态
        this.keys = {};
        this.mouse = { x: 0, y: 0, isDown: false };
        this.touch = { active: false, x: 0, y: 0 };
        
        // 特效
        this.effects = [];
        
        // 游戏循环
        this.lastTime = 0;
        this.animationId = null;
        
        this.setupCanvas();
        this.setupEventListeners();
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
        this.scaleX = rect.width / this.court.width;
        this.scaleY = rect.height / this.court.height;
        
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
        
        // 键盘事件
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (e.key === ' ') {
                e.preventDefault();
                this.hitBall();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
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
        
        if (this.gameState === 'playing') {
            this.playerRacket.y = Math.max(0, Math.min(this.court.height - this.playerRacket.height, this.mouse.y - this.playerRacket.height / 2));
        }
    }
    
    handleMouseDown(e) {
        this.mouse.isDown = true;
        if (this.gameState === 'playing') {
            this.hitBall();
        }
    }
    
    handleMouseUp(e) {
        this.mouse.isDown = false;
    }
    
    handleTouchStart(e) {
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        this.touch.active = true;
        this.touch.x = (touch.clientX - rect.left) / this.scaleX;
        this.touch.y = (touch.clientY - rect.top) / this.scaleY;
        
        if (this.gameState === 'playing') {
            this.playerRacket.y = Math.max(0, Math.min(this.court.height - this.playerRacket.height, this.touch.y - this.playerRacket.height / 2));
            this.hitBall();
        }
    }
    
    handleTouchMove(e) {
        if (this.touch.active) {
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            this.touch.x = (touch.clientX - rect.left) / this.scaleX;
            this.touch.y = (touch.clientY - rect.top) / this.scaleY;
            
            if (this.gameState === 'playing') {
                this.playerRacket.y = Math.max(0, Math.min(this.court.height - this.playerRacket.height, this.touch.y - this.playerRacket.height / 2));
            }
        }
    }
    
    handleTouchEnd(e) {
        this.touch.active = false;
    }
    
    startGame() {
        this.gameState = 'playing';
        this.playerScore = 0;
        this.aiScore = 0;
        this.score = 0;
        this.level = 1;
        this.resetBall();
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
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
            }
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.gameLoop();
        }
    }
    
    resetBall() {
        this.ball.x = this.court.width / 2;
        this.ball.y = this.court.height / 2;
        
        // 随机发球方向
        const angle = (Math.random() - 0.5) * Math.PI / 3; // -30度到30度
        const direction = Math.random() < 0.5 ? -1 : 1; // 左或右
        
        this.ball.vx = Math.cos(angle) * this.ball.speed * direction;
        this.ball.vy = Math.sin(angle) * this.ball.speed;
        
        this.ball.trail = [];
    }
    
    hitBall() {
        if (this.gameState !== 'playing') return;
        
        // 检查球是否在玩家球拍附近
        const ballLeft = this.ball.x - this.ball.radius;
        const ballRight = this.ball.x + this.ball.radius;
        const ballTop = this.ball.y - this.ball.radius;
        const ballBottom = this.ball.y + this.ball.radius;
        
        const racketLeft = this.playerRacket.x;
        const racketRight = this.playerRacket.x + this.playerRacket.width;
        const racketTop = this.playerRacket.y;
        const racketBottom = this.playerRacket.y + this.playerRacket.height;
        
        if (ballRight >= racketLeft && ballLeft <= racketRight &&
            ballBottom >= racketTop && ballTop <= racketBottom &&
            this.ball.vx < 0) { // 球向左移动时才能击中
            
            // 计算击球角度
            const hitPoint = (this.ball.y - this.playerRacket.y) / this.playerRacket.height;
            const angle = (hitPoint - 0.5) * Math.PI / 3; // -60度到60度
            
            this.ball.vx = Math.abs(this.ball.vx) * 1.1; // 增加速度
            this.ball.vy = Math.sin(angle) * this.ball.speed * 1.1;
            
            // 限制最大速度
            const maxSpeed = 12;
            if (Math.abs(this.ball.vx) > maxSpeed) {
                this.ball.vx = this.ball.vx > 0 ? maxSpeed : -maxSpeed;
            }
            if (Math.abs(this.ball.vy) > maxSpeed) {
                this.ball.vy = this.ball.vy > 0 ? maxSpeed : -maxSpeed;
            }
            
            this.createHitEffect(this.ball.x, this.ball.y);
        }
    }
    
    updatePhysics() {
        // 更新球的位置
        this.ball.x += this.ball.vx;
        this.ball.y += this.ball.vy;
        
        // 添加轨迹点
        this.ball.trail.push({ x: this.ball.x, y: this.ball.y });
        if (this.ball.trail.length > 10) {
            this.ball.trail.shift();
        }
        
        // 球与上下边界碰撞
        if (this.ball.y - this.ball.radius <= 0 || this.ball.y + this.ball.radius >= this.court.height) {
            this.ball.vy = -this.ball.vy;
            this.ball.y = Math.max(this.ball.radius, Math.min(this.court.height - this.ball.radius, this.ball.y));
        }
        
        // 球与网碰撞
        if (Math.abs(this.ball.x - this.court.netX) < this.ball.radius &&
            this.ball.y > this.court.height - this.court.netHeight) {
            this.ball.vx = -this.ball.vx;
        }
        
        // AI球拍碰撞检测
        this.checkAIRacketCollision();
        
        // 检查得分
        this.checkScore();
        
        // 更新AI球拍
        this.updateAI();
    }
    
    checkAIRacketCollision() {
        const ballLeft = this.ball.x - this.ball.radius;
        const ballRight = this.ball.x + this.ball.radius;
        const ballTop = this.ball.y - this.ball.radius;
        const ballBottom = this.ball.y + this.ball.radius;
        
        const racketLeft = this.aiRacket.x;
        const racketRight = this.aiRacket.x + this.aiRacket.width;
        const racketTop = this.aiRacket.y;
        const racketBottom = this.aiRacket.y + this.aiRacket.height;
        
        if (ballLeft <= racketRight && ballRight >= racketLeft &&
            ballBottom >= racketTop && ballTop <= racketBottom &&
            this.ball.vx > 0) { // 球向右移动时才能击中
            
            // 计算击球角度
            const hitPoint = (this.ball.y - this.aiRacket.y) / this.aiRacket.height;
            const angle = (hitPoint - 0.5) * Math.PI / 4; // -45度到45度
            
            this.ball.vx = -Math.abs(this.ball.vx) * 1.05; // 反向并稍微增加速度
            this.ball.vy = Math.sin(angle) * this.ball.speed * 1.05;
            
            this.createHitEffect(this.ball.x, this.ball.y);
        }
    }
    
    updateAI() {
        // AI预测球的位置
        if (this.ball.vx > 0) { // 球向AI方向移动
            this.aiRacket.targetY = this.ball.y - this.aiRacket.height / 2;
        }
        
        // AI移动到目标位置
        const diff = this.aiRacket.targetY - this.aiRacket.y;
        if (Math.abs(diff) > 2) {
            this.aiRacket.y += Math.sign(diff) * this.aiRacket.speed;
        }
        
        // 限制AI球拍在场地内
        this.aiRacket.y = Math.max(0, Math.min(this.court.height - this.aiRacket.height, this.aiRacket.y));
    }
    
    checkScore() {
        if (this.ball.x < 0) {
            // AI得分
            this.aiScore++;
            this.createScoreEffect('AI得分!', '#ff4444');
            this.resetBall();
        } else if (this.ball.x > this.court.width) {
            // 玩家得分
            this.playerScore++;
            this.score += 10;
            this.createScoreEffect('得分!', '#44ff44');
            this.resetBall();
        }
        
        // 检查游戏结束
        if (this.playerScore >= this.maxScore || this.aiScore >= this.maxScore) {
            this.endGame();
        }
        
        this.updateDisplay();
    }
    
    endGame() {
        this.gameState = 'gameOver';
        
        if (this.playerScore > this.aiScore) {
            this.level++;
            this.aiRacket.speed += 0.5; // 增加AI难度
            this.createScoreEffect('胜利! 进入下一回合', '#ffff44');
            
            // 重新开始下一回合
            setTimeout(() => {
                this.playerScore = 0;
                this.aiScore = 0;
                this.resetBall();
                this.gameState = 'playing';
            }, 2000);
        } else {
            this.createScoreEffect('游戏结束!', '#ff4444');
            this.updateBestScore();
            
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
            }
        }
    }
    
    createHitEffect(x, y) {
        for (let i = 0; i < 8; i++) {
            this.effects.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 30,
                maxLife: 30,
                color: '#ffff00',
                size: Math.random() * 4 + 2
            });
        }
    }
    
    createScoreEffect(text, color) {
        this.effects.push({
            x: this.court.width / 2,
            y: this.court.height / 2,
            text: text,
            color: color,
            life: 120,
            maxLife: 120,
            size: 24
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
        this.scoreElement.textContent = this.score;
        this.levelElement.textContent = this.level;
    }
    
    updateBestScore() {
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('tennisBestScore', this.bestScore.toString());
        }
        this.bestScoreElement.textContent = this.bestScore;
    }
    
    render() {
        // 清空画布
        this.ctx.fillStyle = '#2E8B57';
        this.ctx.fillRect(0, 0, this.court.width, this.court.height);
        
        // 绘制球场线条
        this.drawCourt();
        
        // 绘制球拍
        this.drawRackets();
        
        // 绘制球的轨迹
        this.drawBallTrail();
        
        // 绘制球
        this.drawBall();
        
        // 绘制特效
        this.drawEffects();
        
        // 绘制比分
        this.drawScore();
        
        // 绘制游戏状态
        this.drawGameState();
    }
    
    drawCourt() {
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 3;
        
        // 外边框
        this.ctx.strokeRect(10, 10, this.court.width - 20, this.court.height - 20);
        
        // 中线
        this.ctx.beginPath();
        this.ctx.moveTo(this.court.netX, 10);
        this.ctx.lineTo(this.court.netX, this.court.height - 10);
        this.ctx.stroke();
        
        // 网
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(this.court.netX - 2, this.court.height - this.court.netHeight, 4, this.court.netHeight);
        
        // 发球线
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(100, 10);
        this.ctx.lineTo(100, this.court.height - 10);
        this.ctx.moveTo(700, 10);
        this.ctx.lineTo(700, this.court.height - 10);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    
    drawRackets() {
        // 玩家球拍
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.fillRect(this.playerRacket.x, this.playerRacket.y, this.playerRacket.width, this.playerRacket.height);
        
        // AI球拍
        this.ctx.fillStyle = '#4ecdc4';
        this.ctx.fillRect(this.aiRacket.x, this.aiRacket.y, this.aiRacket.width, this.aiRacket.height);
    }
    
    drawBallTrail() {
        for (let i = 0; i < this.ball.trail.length; i++) {
            const point = this.ball.trail[i];
            const alpha = (i + 1) / this.ball.trail.length * 0.5;
            
            this.ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, this.ball.radius * alpha, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawBall() {
        // 球的阴影
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x + 2, this.ball.y + 2, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 球
        this.ctx.fillStyle = '#ffff00';
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 球的纹理
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius - 1, 0, Math.PI);
        this.ctx.stroke();
    }
    
    drawScore() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        
        // 玩家比分
        this.ctx.fillText(this.playerScore.toString(), 200, 40);
        
        // AI比分
        this.ctx.fillText(this.aiScore.toString(), 600, 40);
        
        // 分隔符
        this.ctx.fillText(':', 400, 40);
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
            this.ctx.fillRect(0, 0, this.court.width, this.court.height);
            
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 32px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('点击开始游戏', this.court.width / 2, this.court.height / 2);
            
            this.ctx.font = '16px Arial';
            this.ctx.fillText('移动鼠标或触摸控制球拍', this.court.width / 2, this.court.height / 2 + 40);
            this.ctx.fillText('点击或按空格键击球', this.court.width / 2, this.court.height / 2 + 60);
        } else if (this.gameState === 'paused') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.court.width, this.court.height);
            
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 32px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('游戏暂停', this.court.width / 2, this.court.height / 2);
        }
    }
    
    gameLoop(currentTime = 0) {
        if (this.gameState !== 'playing') return;
        
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
    game = new TennisMatch();
});