class SoccerPenalty {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.goalsElement = document.getElementById('goals');
        this.attemptsElement = document.getElementById('attempts');
        this.bestScoreElement = document.getElementById('bestScore');
        
        this.setupCanvas();
        
        // 游戏状态
        this.score = 0;
        this.goals = 0;
        this.attempts = 0;
        this.gameRunning = false;
        this.bestScore = parseInt(localStorage.getItem('soccerPenaltyBestScore')) || 0;
        this.consecutiveGoals = 0;
        
        // 足球
        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 80,
            radius: 12,
            vx: 0,
            vy: 0,
            isMoving: false,
            trail: []
        };
        
        // 球门
        this.goal = {
            x: this.canvas.width / 2,
            y: 50,
            width: 200,
            height: 120,
            postWidth: 8
        };
        
        // 守门员
        this.goalkeeper = {
            x: this.canvas.width / 2,
            y: this.goal.y + this.goal.height - 30,
            width: 40,
            height: 60,
            targetX: this.canvas.width / 2,
            speed: 3,
            reactionTime: 0,
            diving: false,
            diveDirection: 0
        };
        
        // 射门控制
        this.shooting = {
            isDragging: false,
            startX: 0,
            startY: 0,
            power: 0,
            angle: 0,
            maxPower: 15
        };
        
        // 物理参数
        this.gravity = 0.3;
        this.friction = 0.98;
        
        // 特效
        this.particles = [];
        this.goalEffect = [];
        
        this.setupEventListeners();
        this.updateBestScore();
        this.initGame();
        this.gameLoop();
    }
    
    setupCanvas() {
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        
        // 保持16:10的宽高比
        this.canvas.width = Math.min(containerWidth, 600);
        this.canvas.height = this.canvas.width * 0.67;
        
        // 高DPI支持
        const dpr = window.devicePixelRatio || 1;
        this.canvas.style.width = this.canvas.width + 'px';
        this.canvas.style.height = this.canvas.height + 'px';
        this.canvas.width *= dpr;
        this.canvas.height *= dpr;
        this.ctx.scale(dpr, dpr);
        
        // 重新设置游戏对象位置
        const width = this.canvas.width / dpr;
        const height = this.canvas.height / dpr;
        
        if (this.ball) {
            this.ball.x = width / 2;
            this.ball.y = height - 80;
        }
        if (this.goal) {
            this.goal.x = width / 2;
            this.goal.width = Math.min(200, width * 0.4);
        }
        if (this.goalkeeper) {
            this.goalkeeper.x = width / 2;
            this.goalkeeper.targetX = width / 2;
        }
    }
    
    setupEventListeners() {
        // 鼠标事件
        this.canvas.addEventListener('mousedown', (e) => this.handleStart(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleEnd(e));
        
        // 触摸事件
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleStart(e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleMove(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleEnd(e.changedTouches[0]);
        });
        
        // 按钮事件
        document.getElementById('newGameBtn').addEventListener('click', () => this.initGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        
        // 窗口大小改变
        window.addEventListener('resize', () => {
            this.setupCanvas();
        });
        
        // 防止页面滚动
        document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    }
    
    handleStart(e) {
        if (!this.gameRunning || this.ball.isMoving) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 检查是否点击在球附近
        const dx = x - this.ball.x;
        const dy = y - this.ball.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= this.ball.radius + 20) {
            this.shooting.isDragging = true;
            this.shooting.startX = x;
            this.shooting.startY = y;
        }
    }
    
    handleMove(e) {
        if (!this.shooting.isDragging) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 计算射门方向和力度
        const dx = x - this.shooting.startX;
        const dy = y - this.shooting.startY;
        
        this.shooting.angle = Math.atan2(dy, dx);
        this.shooting.power = Math.min(
            Math.sqrt(dx * dx + dy * dy) / 10,
            this.shooting.maxPower
        );
    }
    
    handleEnd(e) {
        if (!this.shooting.isDragging) return;
        
        this.shooting.isDragging = false;
        
        if (this.shooting.power > 1) {
            this.shootBall();
        }
    }
    
    shootBall() {
        // 设置球的速度
        this.ball.vx = Math.cos(this.shooting.angle) * this.shooting.power;
        this.ball.vy = Math.sin(this.shooting.angle) * this.shooting.power;
        this.ball.isMoving = true;
        this.ball.trail = [];
        
        // 增加尝试次数
        this.attempts++;
        
        // 守门员反应
        this.triggerGoalkeeperReaction();
        
        this.updateDisplay();
    }
    
    triggerGoalkeeperReaction() {
        // 根据球的方向决定守门员的反应
        const ballTargetX = this.ball.x + this.ball.vx * 10;
        const goalLeft = this.goal.x - this.goal.width / 2;
        const goalRight = this.goal.x + this.goal.width / 2;
        
        if (ballTargetX < this.goal.x - 30) {
            // 球向左侧
            this.goalkeeper.targetX = goalLeft + 30;
            this.goalkeeper.diveDirection = -1;
        } else if (ballTargetX > this.goal.x + 30) {
            // 球向右侧
            this.goalkeeper.targetX = goalRight - 30;
            this.goalkeeper.diveDirection = 1;
        } else {
            // 球向中间
            this.goalkeeper.targetX = this.goal.x;
            this.goalkeeper.diveDirection = 0;
        }
        
        // 添加一些随机性
        if (Math.random() < 0.3) {
            this.goalkeeper.targetX += (Math.random() - 0.5) * 60;
        }
        
        this.goalkeeper.reactionTime = 20 + Math.random() * 10;
        this.goalkeeper.diving = true;
    }
    
    initGame() {
        this.score = 0;
        this.goals = 0;
        this.attempts = 0;
        this.consecutiveGoals = 0;
        this.gameRunning = true;
        
        // 重置球的位置
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height - 80;
        this.ball.vx = 0;
        this.ball.vy = 0;
        this.ball.isMoving = false;
        this.ball.trail = [];
        
        // 重置守门员
        this.goalkeeper.x = this.canvas.width / 2;
        this.goalkeeper.targetX = this.canvas.width / 2;
        this.goalkeeper.diving = false;
        this.goalkeeper.reactionTime = 0;
        
        // 重置射门控制
        this.shooting.isDragging = false;
        this.shooting.power = 0;
        this.shooting.angle = 0;
        
        // 清空特效
        this.particles = [];
        this.goalEffect = [];
        
        this.updateDisplay();
    }
    
    togglePause() {
        this.gameRunning = !this.gameRunning;
        const pauseBtn = document.getElementById('pauseBtn');
        pauseBtn.textContent = this.gameRunning ? 'Pause' : 'Resume';
    }
    
    updatePhysics() {
        if (!this.ball.isMoving) return;
        
        // 添加轨迹点
        this.ball.trail.push({ x: this.ball.x, y: this.ball.y });
        if (this.ball.trail.length > 8) {
            this.ball.trail.shift();
        }
        
        // 应用重力和摩擦
        this.ball.vy += this.gravity;
        this.ball.vx *= this.friction;
        
        // 更新位置
        this.ball.x += this.ball.vx;
        this.ball.y += this.ball.vy;
        
        // 边界检测
        if (this.ball.x - this.ball.radius <= 0 || this.ball.x + this.ball.radius >= this.canvas.width) {
            this.ball.vx *= -0.7;
            this.ball.x = Math.max(this.ball.radius, Math.min(this.canvas.width - this.ball.radius, this.ball.x));
        }
        
        // 地面碰撞
        if (this.ball.y + this.ball.radius >= this.canvas.height - 20) {
            this.ball.y = this.canvas.height - 20 - this.ball.radius;
            this.ball.vy *= -0.6;
            this.ball.vx *= 0.8;
            
            // 如果球几乎停止，重置
            if (Math.abs(this.ball.vx) < 0.5 && Math.abs(this.ball.vy) < 0.5) {
                this.resetBall();
            }
        }
        
        // 检查进球
        this.checkGoal();
        
        // 检查守门员扑救
        this.checkGoalkeeperSave();
        
        // 更新守门员位置
        this.updateGoalkeeper();
    }
    
    updateGoalkeeper() {
        if (this.goalkeeper.reactionTime > 0) {
            this.goalkeeper.reactionTime--;
            return;
        }
        
        if (this.goalkeeper.diving) {
            const dx = this.goalkeeper.targetX - this.goalkeeper.x;
            if (Math.abs(dx) > 2) {
                this.goalkeeper.x += Math.sign(dx) * this.goalkeeper.speed;
            }
        }
    }
    
    checkGoal() {
        const goalLeft = this.goal.x - this.goal.width / 2;
        const goalRight = this.goal.x + this.goal.width / 2;
        const goalTop = this.goal.y;
        const goalBottom = this.goal.y + this.goal.height;
        
        // 检查球是否进入球门区域
        if (this.ball.x > goalLeft && this.ball.x < goalRight &&
            this.ball.y > goalTop && this.ball.y < goalBottom &&
            this.ball.vy < 0) {
            
            this.scoreGoal();
        }
    }
    
    checkGoalkeeperSave() {
        const dx = this.ball.x - this.goalkeeper.x;
        const dy = this.ball.y - this.goalkeeper.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.ball.radius + 25 && this.ball.isMoving) {
            // 守门员扑救成功
            this.ball.vx *= -0.5;
            this.ball.vy *= -0.3;
            
            // 创建扑救特效
            this.createSaveEffect();
            
            // 重置连击
            this.consecutiveGoals = 0;
        }
    }
    
    scoreGoal() {
        this.goals++;
        this.consecutiveGoals++;
        
        // 计分（连击奖励）
        let points = 10;
        if (this.consecutiveGoals > 1) {
            points += (this.consecutiveGoals - 1) * 5;
        }
        
        this.score += points;
        
        // 创建进球特效
        this.createGoalEffect();
        
        // 重置球
        this.resetBall();
        
        // 重置守门员
        this.goalkeeper.x = this.canvas.width / 2;
        this.goalkeeper.targetX = this.canvas.width / 2;
        this.goalkeeper.diving = false;
        
        this.updateDisplay();
    }
    
    resetBall() {
        setTimeout(() => {
            this.ball.x = this.canvas.width / 2;
            this.ball.y = this.canvas.height - 80;
            this.ball.vx = 0;
            this.ball.vy = 0;
            this.ball.isMoving = false;
            this.ball.trail = [];
        }, 1000);
    }
    
    createGoalEffect() {
        // 创建进球庆祝粒子
        for (let i = 0; i < 20; i++) {
            this.goalEffect.push({
                x: this.goal.x + (Math.random() - 0.5) * this.goal.width,
                y: this.goal.y + this.goal.height / 2,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 60,
                maxLife: 60,
                color: `hsl(${Math.random() * 60 + 30}, 100%, 50%)`
            });
        }
    }
    
    createSaveEffect() {
        // 创建扑救特效
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: this.goalkeeper.x,
                y: this.goalkeeper.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 30,
                maxLife: 30,
                color: '#87CEEB'
            });
        }
    }
    
    updateEffects() {
        // 更新进球特效
        for (let i = this.goalEffect.length - 1; i >= 0; i--) {
            const effect = this.goalEffect[i];
            effect.x += effect.vx;
            effect.y += effect.vy;
            effect.vy += 0.2;
            effect.life--;
            
            if (effect.life <= 0) {
                this.goalEffect.splice(i, 1);
            }
        }
        
        // 更新其他粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    updateDisplay() {
        this.scoreElement.textContent = this.score;
        this.goalsElement.textContent = this.goals;
        this.attemptsElement.textContent = this.attempts;
        
        // 更新最高分
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('soccerPenaltyBestScore', this.bestScore.toString());
            this.updateBestScore();
        }
    }
    
    updateBestScore() {
        this.bestScoreElement.textContent = this.bestScore;
    }
    
    render() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制足球场背景
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#228B22');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制球门
        this.drawGoal();
        
        // 绘制守门员
        this.drawGoalkeeper();
        
        // 绘制球的轨迹
        this.drawBallTrail();
        
        // 绘制足球
        this.drawBall();
        
        // 绘制射门指示器
        if (this.shooting.isDragging) {
            this.drawShootingIndicator();
        }
        
        // 绘制特效
        this.drawEffects();
        
        // 绘制连击显示
        if (this.consecutiveGoals > 1) {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`Streak: ${this.consecutiveGoals}`, this.canvas.width / 2, 30);
        }
        
        // 绘制暂停提示
        if (!this.gameRunning) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 36px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
        }
    }
    
    drawGoal() {
        const goalLeft = this.goal.x - this.goal.width / 2;
        const goalRight = this.goal.x + this.goal.width / 2;
        
        // 球门框
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = this.goal.postWidth;
        this.ctx.beginPath();
        this.ctx.moveTo(goalLeft, this.goal.y);
        this.ctx.lineTo(goalLeft, this.goal.y + this.goal.height);
        this.ctx.moveTo(goalRight, this.goal.y);
        this.ctx.lineTo(goalRight, this.goal.y + this.goal.height);
        this.ctx.moveTo(goalLeft, this.goal.y + this.goal.height);
        this.ctx.lineTo(goalRight, this.goal.y + this.goal.height);
        this.ctx.stroke();
        
        // 球网
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
            const x = goalLeft + (i * this.goal.width / 7);
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.goal.y);
            this.ctx.lineTo(x, this.goal.y + this.goal.height);
            this.ctx.stroke();
        }
        for (let i = 0; i < 6; i++) {
            const y = this.goal.y + (i * this.goal.height / 5);
            this.ctx.beginPath();
            this.ctx.moveTo(goalLeft, y);
            this.ctx.lineTo(goalRight, y);
            this.ctx.stroke();
        }
    }
    
    drawGoalkeeper() {
        // 守门员身体
        this.ctx.fillStyle = '#FF6B6B';
        this.ctx.fillRect(
            this.goalkeeper.x - this.goalkeeper.width / 2,
            this.goalkeeper.y - this.goalkeeper.height,
            this.goalkeeper.width,
            this.goalkeeper.height
        );
        
        // 守门员头部
        this.ctx.fillStyle = '#FDBCB4';
        this.ctx.beginPath();
        this.ctx.arc(this.goalkeeper.x, this.goalkeeper.y - this.goalkeeper.height - 10, 8, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 守门员手套
        if (this.goalkeeper.diving) {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.beginPath();
            this.ctx.arc(this.goalkeeper.x + this.goalkeeper.diveDirection * 20, this.goalkeeper.y - 30, 6, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawBall() {
        // 足球主体
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 足球花纹
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // 五边形图案
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2) / 5;
            const x = this.ball.x + Math.cos(angle) * 4;
            const y = this.ball.y + Math.sin(angle) * 4;
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    drawBallTrail() {
        if (this.ball.trail.length < 2) return;
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(this.ball.trail[0].x, this.ball.trail[0].y);
        
        for (let i = 1; i < this.ball.trail.length; i++) {
            this.ctx.lineTo(this.ball.trail[i].x, this.ball.trail[i].y);
        }
        this.ctx.stroke();
    }
    
    drawShootingIndicator() {
        // 力度指示器
        const powerPercent = this.shooting.power / this.shooting.maxPower;
        const indicatorLength = 50 * powerPercent;
        
        this.ctx.strokeStyle = `hsl(${120 - powerPercent * 120}, 100%, 50%)`;
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(this.ball.x, this.ball.y);
        this.ctx.lineTo(
            this.ball.x + Math.cos(this.shooting.angle) * indicatorLength,
            this.ball.y + Math.sin(this.shooting.angle) * indicatorLength
        );
        this.ctx.stroke();
        
        // 力度条
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(this.canvas.width - 120, 20, 100, 20);
        
        this.ctx.fillStyle = `hsl(${120 - powerPercent * 120}, 100%, 50%)`;
        this.ctx.fillRect(this.canvas.width - 118, 22, 96 * powerPercent, 16);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('POWER', this.canvas.width - 70, 15);
    }
    
    drawEffects() {
        // 绘制进球特效
        this.goalEffect.forEach(effect => {
            const alpha = effect.life / effect.maxLife;
            this.ctx.fillStyle = effect.color.replace('50%)', `50%, ${alpha})`);
            this.ctx.beginPath();
            this.ctx.arc(effect.x, effect.y, 4, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // 绘制其他粒子
        this.particles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            this.ctx.fillStyle = `rgba(135, 206, 235, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    gameLoop() {
        if (this.gameRunning) {
            this.updatePhysics();
            this.updateEffects();
        }
        
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// 初始化游戏
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new SoccerPenalty();
});