class TowerDefense {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.isGameRunning = false;
        this.isPaused = false;
        
        // 游戏状态
        this.gameState = {
            money: 500,
            lives: 20,
            wave: 1,
            score: 0,
            waveInProgress: false,
            enemiesSpawned: 0,
            enemiesKilled: 0
        };
        
        // 路径点
        this.path = [
            {x: 0, y: 300},
            {x: 150, y: 300},
            {x: 150, y: 150},
            {x: 350, y: 150},
            {x: 350, y: 450},
            {x: 550, y: 450},
            {x: 550, y: 250},
            {x: 700, y: 250},
            {x: 700, y: 100},
            {x: 800, y: 100}
        ];
        
        // 防御塔类型
        this.towerTypes = {
            basic: {
                name: '基础塔',
                icon: '🔫',
                cost: 50,
                damage: 20,
                range: 80,
                fireRate: 1000,
                color: '#4CAF50',
                projectileColor: '#FFC107',
                projectileSpeed: 5
            },
            cannon: {
                name: '加农炮',
                icon: '💣',
                cost: 100,
                damage: 50,
                range: 60,
                fireRate: 2000,
                color: '#FF5722',
                projectileColor: '#FF9800',
                projectileSpeed: 3,
                splash: true,
                splashRadius: 30
            },
            laser: {
                name: '激光塔',
                icon: '⚡',
                cost: 150,
                damage: 30,
                range: 100,
                fireRate: 500,
                color: '#2196F3',
                projectileColor: '#00BCD4',
                projectileSpeed: 8,
                laser: true
            },
            freeze: {
                name: '冰冻塔',
                icon: '❄️',
                cost: 120,
                damage: 10,
                range: 70,
                fireRate: 1500,
                color: '#00BCD4',
                projectileColor: '#E1F5FE',
                projectileSpeed: 4,
                freeze: true,
                freezeDuration: 2000
            },
            missile: {
                name: '导弹塔',
                icon: '🚀',
                cost: 200,
                damage: 100,
                range: 120,
                fireRate: 3000,
                color: '#9C27B0',
                projectileColor: '#E91E63',
                projectileSpeed: 6,
                homing: true
            }
        };
        
        // 敌人类型
        this.enemyTypes = {
            basic: {
                name: '基础敌人',
                icon: '👾',
                health: 50,
                speed: 1,
                reward: 10,
                color: '#f44336'
            },
            fast: {
                name: '快速敌人',
                icon: '🏃',
                health: 30,
                speed: 2,
                reward: 15,
                color: '#ff9800'
            },
            tank: {
                name: '坦克敌人',
                icon: '🛡️',
                health: 150,
                speed: 0.5,
                reward: 25,
                color: '#607d8b'
            },
            flying: {
                name: '飞行敌人',
                icon: '🦅',
                health: 40,
                speed: 1.5,
                reward: 20,
                color: '#9c27b0',
                flying: true
            }
        };
        
        this.selectedTower = null;
        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        this.effects = [];
        
        // 游戏循环
        this.lastUpdate = 0;
        this.lastSpawn = 0;
        this.spawnInterval = 1000;
        
        // 移动端支持
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.touchStartPos = null;
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.updateUI();
        this.render();
    }
    
    setupCanvas() {
        // 高DPI支持
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
    }
    
    setupEventListeners() {
        // 游戏控制按钮
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('nextWaveBtn').addEventListener('click', () => this.startNextWave());
        
        // 防御塔选择
        document.querySelectorAll('.tower-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const towerType = e.currentTarget.dataset.tower;
                this.selectTower(towerType);
            });
        });
        
        // 画布点击事件
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        
        // 移动端触摸事件
        if (this.isMobile) {
            this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
            this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
            
            // 防止页面滚动
            document.addEventListener('touchmove', (e) => {
                if (e.target === this.canvas) {
                    e.preventDefault();
                }
            }, { passive: false });
        }
        
        // 窗口大小改变
        window.addEventListener('resize', () => {
            setTimeout(() => this.setupCanvas(), 100);
        });
        
        // 键盘事件
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }
    
    selectTower(type) {
        // 移除之前的选中状态
        document.querySelectorAll('.tower-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // 选中新防御塔
        if (this.selectedTower === type) {
            this.selectedTower = null;
        } else {
            this.selectedTower = type;
            document.querySelector(`[data-tower="${type}"]`).classList.add('selected');
        }
        
        this.canvas.style.cursor = this.selectedTower ? 'crosshair' : 'default';
    }
    
    handleCanvasClick(e) {
        if (!this.isGameRunning || this.isPaused || !this.selectedTower) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.placeTower(x, y, this.selectedTower);
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.touchStartPos = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now()
        };
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        if (!this.touchStartPos) return;
        
        const touch = e.changedTouches[0];
        const deltaTime = Date.now() - this.touchStartPos.time;
        const deltaX = Math.abs(touch.clientX - this.touchStartPos.x);
        const deltaY = Math.abs(touch.clientY - this.touchStartPos.y);
        
        // 判断是否为点击（而非滑动）
        if (deltaTime < 300 && deltaX < 10 && deltaY < 10) {
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            if (this.selectedTower) {
                this.placeTower(x, y, this.selectedTower);
            }
        }
        
        this.touchStartPos = null;
    }
    
    handleKeyPress(e) {
        switch(e.key) {
            case ' ':
                e.preventDefault();
                this.togglePause();
                break;
            case 'n':
            case 'N':
                this.startNextWave();
                break;
            case 'Escape':
                this.selectedTower = null;
                document.querySelectorAll('.tower-item').forEach(item => {
                    item.classList.remove('selected');
                });
                this.canvas.style.cursor = 'default';
                break;
        }
    }
    
    placeTower(x, y, type) {
        const towerType = this.towerTypes[type];
        
        // 检查是否有足够的金币
        if (this.gameState.money < towerType.cost) {
            this.showMessage('金币不足！', 'error');
            return false;
        }
        
        // 检查是否在路径上
        if (this.isOnPath(x, y, 25)) {
            this.showMessage('不能在路径上建造！', 'error');
            return false;
        }
        
        // 检查是否与其他防御塔重叠
        const tooClose = this.towers.some(tower => {
            const distance = Math.sqrt((tower.x - x) ** 2 + (tower.y - y) ** 2);
            return distance < 40;
        });
        
        if (tooClose) {
            this.showMessage('防御塔太近了！', 'error');
            return false;
        }
        
        // 创建防御塔
        const tower = {
            x: x,
            y: y,
            type: type,
            ...towerType,
            id: Date.now() + Math.random(),
            lastFire: 0,
            target: null,
            level: 1
        };
        
        // 扣除金币
        this.gameState.money -= towerType.cost;
        
        // 放置防御塔
        this.towers.push(tower);
        
        // 添加建造效果
        this.addEffect({
            type: 'build',
            x: x,
            y: y,
            duration: 500,
            startTime: Date.now()
        });
        
        this.showMessage(`建造了${towerType.name}！`, 'success');
        this.updateUI();
        
        return true;
    }
    
    isOnPath(x, y, radius) {
        for (let i = 0; i < this.path.length - 1; i++) {
            const start = this.path[i];
            const end = this.path[i + 1];
            
            const distance = this.distanceToLineSegment(x, y, start.x, start.y, end.x, end.y);
            if (distance < radius) {
                return true;
            }
        }
        return false;
    }
    
    distanceToLineSegment(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) {
            param = dot / lenSq;
        }
        
        let xx, yy;
        
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    startGame() {
        this.isGameRunning = true;
        this.isPaused = false;
        this.lastUpdate = Date.now();
        
        document.getElementById('startBtn').textContent = '游戏中';
        document.getElementById('startBtn').disabled = true;
        
        this.startNextWave();
        this.gameLoop();
    }
    
    togglePause() {
        if (!this.isGameRunning) return;
        
        this.isPaused = !this.isPaused;
        document.getElementById('pauseBtn').textContent = this.isPaused ? '继续' : '暂停';
        
        if (!this.isPaused) {
            this.lastUpdate = Date.now();
            this.gameLoop();
        }
    }
    
    startNextWave() {
        if (this.gameState.waveInProgress) return;
        
        this.gameState.waveInProgress = true;
        this.gameState.enemiesSpawned = 0;
        this.gameState.enemiesKilled = 0;
        this.lastSpawn = Date.now();
        
        // 根据波次调整敌人数量和难度
        this.currentWaveEnemies = this.generateWaveEnemies(this.gameState.wave);
        
        document.getElementById('nextWaveBtn').disabled = true;
        this.updateWaveUI();
    }
    
    generateWaveEnemies(wave) {
        const enemies = [];
        const baseCount = 10;
        const count = baseCount + Math.floor(wave / 2);
        
        for (let i = 0; i < count; i++) {
            let enemyType = 'basic';
            
            // 根据波次增加不同类型的敌人
            if (wave >= 3 && Math.random() < 0.3) {
                enemyType = 'fast';
            }
            if (wave >= 5 && Math.random() < 0.2) {
                enemyType = 'tank';
            }
            if (wave >= 7 && Math.random() < 0.15) {
                enemyType = 'flying';
            }
            
            enemies.push(enemyType);
        }
        
        return enemies;
    }
    
    spawnEnemy() {
        if (this.gameState.enemiesSpawned >= this.currentWaveEnemies.length) {
            return;
        }
        
        const enemyType = this.currentWaveEnemies[this.gameState.enemiesSpawned];
        const enemyTemplate = this.enemyTypes[enemyType];
        
        // 根据波次增加敌人属性
        const healthMultiplier = 1 + (this.gameState.wave - 1) * 0.2;
        const speedMultiplier = 1 + (this.gameState.wave - 1) * 0.1;
        
        const enemy = {
            x: this.path[0].x,
            y: this.path[0].y,
            type: enemyType,
            ...enemyTemplate,
            health: Math.floor(enemyTemplate.health * healthMultiplier),
            maxHealth: Math.floor(enemyTemplate.health * healthMultiplier),
            speed: enemyTemplate.speed * speedMultiplier,
            id: Date.now() + Math.random(),
            pathIndex: 0,
            pathProgress: 0,
            effects: []
        };
        
        this.enemies.push(enemy);
        this.gameState.enemiesSpawned++;
    }
    
    updateEnemies(deltaTime) {
        this.enemies.forEach((enemy, index) => {
            // 更新敌人效果
            enemy.effects = enemy.effects.filter(effect => {
                effect.duration -= deltaTime;
                return effect.duration > 0;
            });
            
            // 计算移动速度（考虑减速效果）
            let currentSpeed = enemy.speed;
            enemy.effects.forEach(effect => {
                if (effect.type === 'freeze') {
                    currentSpeed *= 0.5;
                }
            });
            
            // 移动敌人
            if (enemy.pathIndex < this.path.length - 1) {
                const currentPoint = this.path[enemy.pathIndex];
                const nextPoint = this.path[enemy.pathIndex + 1];
                
                const dx = nextPoint.x - currentPoint.x;
                const dy = nextPoint.y - currentPoint.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                enemy.pathProgress += (currentSpeed * deltaTime) / distance;
                
                if (enemy.pathProgress >= 1) {
                    enemy.pathIndex++;
                    enemy.pathProgress = 0;
                } else {
                    enemy.x = currentPoint.x + dx * enemy.pathProgress;
                    enemy.y = currentPoint.y + dy * enemy.pathProgress;
                }
            } else {
                // 敌人到达终点
                this.gameState.lives--;
                this.enemies.splice(index, 1);
                this.showMessage('敌人突破了防线！', 'error');
                
                if (this.gameState.lives <= 0) {
                    this.gameOver();
                }
            }
        });
    }
    
    updateTowers(deltaTime) {
        this.towers.forEach(tower => {
            const now = Date.now();
            
            // 寻找目标
            if (!tower.target || tower.target.health <= 0 || !this.isInRange(tower, tower.target)) {
                tower.target = this.findTarget(tower);
            }
            
            // 射击
            if (tower.target && now - tower.lastFire >= tower.fireRate) {
                this.fireTower(tower);
                tower.lastFire = now;
            }
        });
    }
    
    findTarget(tower) {
        let bestTarget = null;
        let bestDistance = Infinity;
        
        this.enemies.forEach(enemy => {
            if (this.isInRange(tower, enemy)) {
                const distance = Math.sqrt((tower.x - enemy.x) ** 2 + (tower.y - enemy.y) ** 2);
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestTarget = enemy;
                }
            }
        });
        
        return bestTarget;
    }
    
    isInRange(tower, enemy) {
        const distance = Math.sqrt((tower.x - enemy.x) ** 2 + (tower.y - enemy.y) ** 2);
        return distance <= tower.range;
    }
    
    fireTower(tower) {
        const projectile = {
            x: tower.x,
            y: tower.y,
            targetX: tower.target.x,
            targetY: tower.target.y,
            target: tower.target,
            damage: tower.damage,
            speed: tower.projectileSpeed,
            color: tower.projectileColor,
            type: tower.type,
            id: Date.now() + Math.random()
        };
        
        // 计算方向
        const dx = tower.target.x - tower.x;
        const dy = tower.target.y - tower.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        projectile.vx = (dx / distance) * projectile.speed;
        projectile.vy = (dy / distance) * projectile.speed;
        
        this.projectiles.push(projectile);
        
        // 添加射击效果
        this.addEffect({
            type: 'muzzleFlash',
            x: tower.x,
            y: tower.y,
            duration: 100,
            startTime: Date.now()
        });
    }
    
    updateProjectiles(deltaTime) {
        this.projectiles.forEach((projectile, index) => {
            // 移动投射物
            if (projectile.type === 'missile' && projectile.target && projectile.target.health > 0) {
                // 导弹追踪目标
                const dx = projectile.target.x - projectile.x;
                const dy = projectile.target.y - projectile.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 0) {
                    projectile.vx = (dx / distance) * projectile.speed;
                    projectile.vy = (dy / distance) * projectile.speed;
                }
            }
            
            projectile.x += projectile.vx * deltaTime;
            projectile.y += projectile.vy * deltaTime;
            
            // 检查碰撞
            let hit = false;
            this.enemies.forEach(enemy => {
                const distance = Math.sqrt((projectile.x - enemy.x) ** 2 + (projectile.y - enemy.y) ** 2);
                if (distance < 15) {
                    this.hitEnemy(enemy, projectile);
                    hit = true;
                }
            });
            
            // 移除击中的投射物
            if (hit) {
                this.projectiles.splice(index, 1);
            }
            
            // 移除超出边界的投射物
            if (projectile.x < 0 || projectile.x > this.canvas.width || 
                projectile.y < 0 || projectile.y > this.canvas.height) {
                this.projectiles.splice(index, 1);
            }
        });
    }
    
    hitEnemy(enemy, projectile) {
        // 造成伤害
        enemy.health -= projectile.damage;
        
        // 特殊效果
        if (projectile.type === 'freeze') {
            enemy.effects.push({
                type: 'freeze',
                duration: 2000
            });
        }
        
        // 溅射伤害
        if (projectile.type === 'cannon') {
            this.enemies.forEach(otherEnemy => {
                if (otherEnemy !== enemy) {
                    const distance = Math.sqrt((projectile.x - otherEnemy.x) ** 2 + (projectile.y - otherEnemy.y) ** 2);
                    if (distance < 30) {
                        otherEnemy.health -= projectile.damage * 0.5;
                    }
                }
            });
        }
        
        // 添加击中效果
        this.addEffect({
            type: 'hit',
            x: enemy.x,
            y: enemy.y,
            duration: 200,
            startTime: Date.now()
        });
        
        // 检查敌人是否死亡
        if (enemy.health <= 0) {
            this.killEnemy(enemy);
        }
    }
    
    killEnemy(enemy) {
        // 获得奖励
        this.gameState.money += enemy.reward;
        this.gameState.score += enemy.reward * 10;
        this.gameState.enemiesKilled++;
        
        // 移除敌人
        const index = this.enemies.indexOf(enemy);
        if (index > -1) {
            this.enemies.splice(index, 1);
        }
        
        // 添加死亡效果
        this.addEffect({
            type: 'explosion',
            x: enemy.x,
            y: enemy.y,
            duration: 300,
            startTime: Date.now()
        });
        
        this.updateUI();
    }
    
    gameLoop() {
        if (!this.isGameRunning || this.isPaused) return;
        
        const now = Date.now();
        const deltaTime = now - this.lastUpdate;
        this.lastUpdate = now;
        
        // 生成敌人
        if (this.gameState.waveInProgress && now - this.lastSpawn >= this.spawnInterval) {
            this.spawnEnemy();
            this.lastSpawn = now;
        }
        
        // 更新游戏对象
        this.updateEnemies(deltaTime);
        this.updateTowers(deltaTime);
        this.updateProjectiles(deltaTime);
        this.updateEffects(deltaTime);
        
        // 检查波次是否结束
        if (this.gameState.waveInProgress && 
            this.gameState.enemiesSpawned >= this.currentWaveEnemies.length && 
            this.enemies.length === 0) {
            this.endWave();
        }
        
        this.render();
        this.updateWaveUI();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    endWave() {
        this.gameState.waveInProgress = false;
        this.gameState.wave++;
        this.gameState.money += 50; // 波次奖励
        
        document.getElementById('nextWaveBtn').disabled = false;
        this.showMessage(`第${this.gameState.wave - 1}波完成！`, 'success');
        this.updateUI();
    }
    
    gameOver() {
        this.isGameRunning = false;
        this.showMessage('游戏结束！', 'error');
        
        // 重置游戏
        setTimeout(() => {
            this.resetGame();
        }, 3000);
    }
    
    resetGame() {
        this.gameState = {
            money: 500,
            lives: 20,
            wave: 1,
            score: 0,
            waveInProgress: false,
            enemiesSpawned: 0,
            enemiesKilled: 0
        };
        
        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        this.effects = [];
        
        document.getElementById('startBtn').textContent = '开始游戏';
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').textContent = '暂停';
        document.getElementById('nextWaveBtn').disabled = false;
        
        this.updateUI();
        this.updateWaveUI();
    }
    
    updateUI() {
        document.getElementById('money').textContent = this.gameState.money;
        document.getElementById('lives').textContent = this.gameState.lives;
        document.getElementById('wave').textContent = this.gameState.wave;
        document.getElementById('score').textContent = this.gameState.score;
        
        // 更新防御塔按钮状态
        document.querySelectorAll('.tower-item').forEach(item => {
            const towerType = item.dataset.tower;
            const cost = this.towerTypes[towerType].cost;
            
            if (this.gameState.money < cost) {
                item.style.opacity = '0.5';
                item.style.pointerEvents = 'none';
            } else {
                item.style.opacity = '1';
                item.style.pointerEvents = 'auto';
            }
        });
    }
    
    updateWaveUI() {
        const waveStatus = document.getElementById('waveStatus');
        const waveProgress = document.getElementById('waveProgress');
        const enemyCount = document.getElementById('enemyCount');
        
        if (this.gameState.waveInProgress) {
            waveStatus.textContent = `第${this.gameState.wave}波进行中`;
            const progress = (this.gameState.enemiesKilled / this.currentWaveEnemies.length) * 100;
            waveProgress.style.width = `${progress}%`;
            enemyCount.textContent = `敌人数量: ${this.gameState.enemiesKilled}/${this.currentWaveEnemies.length}`;
        } else {
            waveStatus.textContent = `准备开始第${this.gameState.wave}波`;
            waveProgress.style.width = '0%';
            enemyCount.textContent = `点击"下一波"开始`;
        }
    }
    
    render() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制路径
        this.drawPath();
        
        // 绘制防御塔
        this.drawTowers();
        
        // 绘制敌人
        this.drawEnemies();
        
        // 绘制投射物
        this.drawProjectiles();
        
        // 绘制效果
        this.drawEffects();
        
        // 绘制防御塔预览
        this.drawTowerPreview();
        
        // 绘制游戏信息
        this.drawGameInfo();
    }
    
    drawPath() {
        this.ctx.strokeStyle = '#8BC34A';
        this.ctx.lineWidth = 20;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.path[0].x, this.path[0].y);
        
        for (let i = 1; i < this.path.length; i++) {
            this.ctx.lineTo(this.path[i].x, this.path[i].y);
        }
        
        this.ctx.stroke();
        
        // 绘制路径边框
        this.ctx.strokeStyle = '#4CAF50';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }
    
    drawTowers() {
        this.towers.forEach(tower => {
            // 绘制射程（仅选中的防御塔）
            if (this.selectedTower === tower.type) {
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
                this.ctx.stroke();
            }
            
            // 绘制防御塔
            this.ctx.fillStyle = tower.color;
            this.ctx.beginPath();
            this.ctx.arc(tower.x, tower.y, 20, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // 绘制防御塔图标
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = '#333';
            this.ctx.fillText(tower.icon, tower.x, tower.y);
        });
    }
    
    drawEnemies() {
        this.enemies.forEach(enemy => {
            // 绘制敌人
            this.ctx.fillStyle = enemy.color;
            this.ctx.beginPath();
            this.ctx.arc(enemy.x, enemy.y, 15, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // 绘制敌人图标
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText(enemy.icon, enemy.x, enemy.y);
            
            // 绘制血条
            const barWidth = 30;
            const barHeight = 4;
            const healthPercent = enemy.health / enemy.maxHealth;
            
            this.ctx.fillStyle = '#f44336';
            this.ctx.fillRect(enemy.x - barWidth/2, enemy.y - 25, barWidth, barHeight);
            
            this.ctx.fillStyle = '#4CAF50';
            this.ctx.fillRect(enemy.x - barWidth/2, enemy.y - 25, barWidth * healthPercent, barHeight);
            
            // 绘制效果
            enemy.effects.forEach(effect => {
                if (effect.type === 'freeze') {
                    this.ctx.fillStyle = 'rgba(0, 188, 212, 0.5)';
                    this.ctx.beginPath();
                    this.ctx.arc(enemy.x, enemy.y, 18, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            });
        });
    }
    
    drawProjectiles() {
        this.projectiles.forEach(projectile => {
            this.ctx.fillStyle = projectile.color;
            this.ctx.beginPath();
            this.ctx.arc(projectile.x, projectile.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    drawEffects() {
        const now = Date.now();
        
        this.effects.forEach(effect => {
            const elapsed = now - effect.startTime;
            const progress = elapsed / effect.duration;
            
            if (effect.type === 'explosion') {
                const radius = progress * 20;
                const alpha = 1 - progress;
                
                this.ctx.fillStyle = `rgba(255, 87, 34, ${alpha})`;
                this.ctx.beginPath();
                this.ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (effect.type === 'hit') {
                const alpha = 1 - progress;
                
                this.ctx.fillStyle = `rgba(255, 193, 7, ${alpha})`;
                this.ctx.beginPath();
                this.ctx.arc(effect.x, effect.y, 10, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }
    
    drawTowerPreview() {
        if (!this.selectedTower) return;
        
        // 简化处理，使用画布中心作为预览位置
        const mouseX = this.canvas.width / 2;
        const mouseY = this.canvas.height / 2;
        
        const tower = this.towerTypes[this.selectedTower];
        
        // 检查是否可以放置
        const canPlace = !this.isOnPath(mouseX, mouseY, 25) && this.gameState.money >= tower.cost;
        
        // 绘制射程
        this.ctx.strokeStyle = canPlace ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(mouseX, mouseY, tower.range, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // 绘制防御塔预览
        this.ctx.fillStyle = canPlace ? tower.color : '#999';
        this.ctx.globalAlpha = 0.7;
        this.ctx.beginPath();
        this.ctx.arc(mouseX, mouseY, 20, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        this.ctx.globalAlpha = 1;
        
        // 绘制图标
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#333';
        this.ctx.fillText(tower.icon, mouseX, mouseY);
    }
    
    drawGameInfo() {
        if (this.isPaused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(
                '游戏暂停',
                this.canvas.width / 2,
                this.canvas.height / 2
            );
        }
    }
    
    addEffect(effect) {
        this.effects.push(effect);
    }
    
    updateEffects(deltaTime) {
        this.effects = this.effects.filter(effect => {
            const elapsed = Date.now() - effect.startTime;
            return elapsed < effect.duration;
        });
    }
    
    showMessage(text, type = 'info') {
        // 创建消息元素
        const message = document.createElement('div');
        message.textContent = text;
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            transition: all 0.3s;
        `;
        
        // 根据类型设置颜色
        switch(type) {
            case 'success':
                message.style.backgroundColor = '#4CAF50';
                break;
            case 'error':
                message.style.backgroundColor = '#f44336';
                break;
            default:
                message.style.backgroundColor = '#333';
        }
        
        document.body.appendChild(message);
        
        // 自动移除消息
        setTimeout(() => {
            message.style.opacity = '0';
            message.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (message.parentNode) {
                    message.parentNode.removeChild(message);
                }
            }, 300);
        }, 2000);
    }
}

// 游戏初始化
let game;

window.addEventListener('load', () => {
    game = new TowerDefense();
});