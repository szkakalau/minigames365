class CityBuilder {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.isGameRunning = false;
        this.isPaused = false;
        
        // 游戏状态
        this.resources = {
            money: 1000,
            population: 0,
            happiness: 100,
            power: 0,
            powerUsed: 0
        };
        
        // 网格系统
        this.gridSize = 40;
        this.gridWidth = Math.floor(this.canvas.width / this.gridSize);
        this.gridHeight = Math.floor(this.canvas.height / this.gridSize);
        this.grid = [];
        
        // 建筑类型
        this.buildingTypes = {
            house: {
                name: '住宅',
                icon: '🏠',
                cost: 100,
                income: 0,
                population: 4,
                happiness: 0,
                power: -2,
                color: '#ff9999'
            },
            shop: {
                name: '商店',
                icon: '🏪',
                cost: 200,
                income: 50,
                population: 0,
                happiness: 10,
                power: -1,
                color: '#99ff99'
            },
            factory: {
                name: '工厂',
                icon: '🏭',
                cost: 500,
                income: 200,
                population: 0,
                happiness: -20,
                power: -5,
                color: '#9999ff'
            },
            park: {
                name: '公园',
                icon: '🌳',
                cost: 150,
                income: 0,
                population: 0,
                happiness: 30,
                power: 0,
                color: '#99ffcc'
            },
            power: {
                name: '发电厂',
                icon: '⚡',
                cost: 800,
                income: 0,
                population: 0,
                happiness: -10,
                power: 20,
                color: '#ffff99'
            },
            road: {
                name: '道路',
                icon: '🛣️',
                cost: 50,
                income: 0,
                population: 0,
                happiness: 0,
                power: 0,
                color: '#cccccc'
            }
        };
        
        this.selectedBuilding = null;
        this.buildings = [];
        this.roads = [];
        
        // 游戏循环
        this.lastUpdate = 0;
        this.updateInterval = 2000; // 2秒更新一次资源
        
        // 动画
        this.animations = [];
        
        // 移动端支持
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.touchStartPos = null;
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.initGrid();
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
        
        // 重新计算网格
        this.gridWidth = Math.floor(rect.width / this.gridSize);
        this.gridHeight = Math.floor(rect.height / this.gridSize);
    }
    
    setupEventListeners() {
        // 游戏控制按钮
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        
        // 建筑选择
        document.querySelectorAll('.building-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const buildingType = e.currentTarget.dataset.building;
                this.selectBuilding(buildingType);
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
    
    initGrid() {
        this.grid = [];
        for (let x = 0; x < this.gridWidth; x++) {
            this.grid[x] = [];
            for (let y = 0; y < this.gridHeight; y++) {
                this.grid[x][y] = null;
            }
        }
    }
    
    selectBuilding(type) {
        // 移除之前的选中状态
        document.querySelectorAll('.building-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // 选中新建筑
        if (this.selectedBuilding === type) {
            this.selectedBuilding = null;
        } else {
            this.selectedBuilding = type;
            document.querySelector(`[data-building="${type}"]`).classList.add('selected');
        }
        
        this.canvas.style.cursor = this.selectedBuilding ? 'crosshair' : 'default';
    }
    
    handleCanvasClick(e) {
        if (!this.isGameRunning || this.isPaused || !this.selectedBuilding) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / this.gridSize);
        const y = Math.floor((e.clientY - rect.top) / this.gridSize);
        
        this.placeBuilding(x, y, this.selectedBuilding);
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
            const x = Math.floor((touch.clientX - rect.left) / this.gridSize);
            const y = Math.floor((touch.clientY - rect.top) / this.gridSize);
            
            if (this.selectedBuilding) {
                this.placeBuilding(x, y, this.selectedBuilding);
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
            case 'r':
            case 'R':
                this.restartGame();
                break;
            case 'Escape':
                this.selectedBuilding = null;
                document.querySelectorAll('.building-item').forEach(item => {
                    item.classList.remove('selected');
                });
                this.canvas.style.cursor = 'default';
                break;
        }
    }
    
    placeBuilding(gridX, gridY, type) {
        // 检查位置是否有效
        if (gridX < 0 || gridX >= this.gridWidth || gridY < 0 || gridY >= this.gridHeight) {
            return false;
        }
        
        // 检查位置是否已被占用
        if (this.grid[gridX][gridY] !== null) {
            this.showMessage('该位置已被占用！', 'error');
            return false;
        }
        
        const buildingType = this.buildingTypes[type];
        
        // 检查是否有足够的金币
        if (this.resources.money < buildingType.cost) {
            this.showMessage('金币不足！', 'error');
            return false;
        }
        
        // 创建建筑
        const building = {
            x: gridX,
            y: gridY,
            type: type,
            ...buildingType,
            id: Date.now() + Math.random(),
            connected: false
        };
        
        // 扣除金币
        this.resources.money -= buildingType.cost;
        
        // 放置建筑
        this.grid[gridX][gridY] = building;
        this.buildings.push(building);
        
        if (type === 'road') {
            this.roads.push(building);
        }
        
        // 更新连接状态
        this.updateConnections();
        
        // 更新资源
        this.updateResources();
        
        // 添加建造动画
        this.addAnimation({
            type: 'build',
            x: gridX * this.gridSize + this.gridSize / 2,
            y: gridY * this.gridSize + this.gridSize / 2,
            duration: 500,
            startTime: Date.now()
        });
        
        this.showMessage(`建造了${buildingType.name}！`, 'success');
        
        return true;
    }
    
    updateConnections() {
        // 重置所有建筑的连接状态
        this.buildings.forEach(building => {
            building.connected = false;
        });
        
        // 使用BFS算法从道路开始连接建筑
        const visited = new Set();
        const queue = [];
        
        // 将所有道路作为起点
        this.roads.forEach(road => {
            if (!visited.has(`${road.x},${road.y}`)) {
                queue.push(road);
                visited.add(`${road.x},${road.y}`);
                road.connected = true;
            }
        });
        
        // BFS遍历
        while (queue.length > 0) {
            const current = queue.shift();
            
            // 检查相邻的格子
            const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
            directions.forEach(([dx, dy]) => {
                const newX = current.x + dx;
                const newY = current.y + dy;
                const key = `${newX},${newY}`;
                
                if (newX >= 0 && newX < this.gridWidth && 
                    newY >= 0 && newY < this.gridHeight && 
                    !visited.has(key) && 
                    this.grid[newX][newY] !== null) {
                    
                    const building = this.grid[newX][newY];
                    building.connected = true;
                    visited.add(key);
                    
                    // 如果是道路，继续传播连接
                    if (building.type === 'road') {
                        queue.push(building);
                    }
                }
            });
        }
    }
    
    updateResources() {
        let totalIncome = 0;
        let totalPopulation = 0;
        let totalHappiness = 100; // 基础幸福度
        let totalPower = 0;
        let totalPowerUsed = 0;
        
        this.buildings.forEach(building => {
            const efficiency = building.connected ? 1 : 0.5; // 未连接的建筑效率减半
            
            totalIncome += building.income * efficiency;
            totalPopulation += building.population * efficiency;
            totalHappiness += building.happiness * efficiency;
            
            if (building.power > 0) {
                totalPower += building.power;
            } else {
                totalPowerUsed += Math.abs(building.power) * efficiency;
            }
        });
        
        // 电力不足会影响幸福度
        if (totalPowerUsed > totalPower) {
            totalHappiness -= (totalPowerUsed - totalPower) * 5;
        }
        
        // 更新资源
        this.resources.population = Math.floor(totalPopulation);
        this.resources.happiness = Math.max(0, Math.min(100, Math.floor(totalHappiness)));
        this.resources.power = totalPower;
        this.resources.powerUsed = totalPowerUsed;
        
        this.updateUI();
    }
    
    updateUI() {
        document.getElementById('money').textContent = this.resources.money;
        document.getElementById('population').textContent = this.resources.population;
        document.getElementById('happiness').textContent = this.resources.happiness;
        document.getElementById('power').textContent = `${this.resources.powerUsed}/${this.resources.power}`;
        
        // 更新建筑按钮状态
        document.querySelectorAll('.building-item').forEach(item => {
            const buildingType = item.dataset.building;
            const cost = this.buildingTypes[buildingType].cost;
            
            if (this.resources.money < cost) {
                item.style.opacity = '0.5';
                item.style.pointerEvents = 'none';
            } else {
                item.style.opacity = '1';
                item.style.pointerEvents = 'auto';
            }
        });
    }
    
    startGame() {
        this.isGameRunning = true;
        this.isPaused = false;
        this.lastUpdate = Date.now();
        
        document.getElementById('startBtn').textContent = '游戏中';
        document.getElementById('startBtn').disabled = true;
        
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
    
    restartGame() {
        this.isGameRunning = false;
        this.isPaused = false;
        
        // 重置资源
        this.resources = {
            money: 1000,
            population: 0,
            happiness: 100,
            power: 0,
            powerUsed: 0
        };
        
        // 清空建筑
        this.buildings = [];
        this.roads = [];
        this.initGrid();
        
        // 重置选择
        this.selectedBuilding = null;
        document.querySelectorAll('.building-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // 重置按钮
        document.getElementById('startBtn').textContent = '开始游戏';
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').textContent = '暂停';
        
        this.canvas.style.cursor = 'default';
        this.updateUI();
    }
    
    gameLoop() {
        if (!this.isGameRunning || this.isPaused) return;
        
        const now = Date.now();
        
        // 定期更新收入
        if (now - this.lastUpdate >= this.updateInterval) {
            this.generateIncome();
            this.lastUpdate = now;
        }
        
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    generateIncome() {
        let totalIncome = 0;
        
        this.buildings.forEach(building => {
            const efficiency = building.connected ? 1 : 0.5;
            totalIncome += building.income * efficiency;
        });
        
        this.resources.money += Math.floor(totalIncome);
        
        if (totalIncome > 0) {
            this.showMessage(`+${Math.floor(totalIncome)} 金币`, 'income');
        }
        
        this.updateUI();
    }
    
    render() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格
        this.drawGrid();
        
        // 绘制建筑
        this.drawBuildings();
        
        // 绘制选中建筑的预览
        this.drawBuildingPreview();
        
        // 绘制动画
        this.drawAnimations();
        
        // 绘制UI信息
        this.drawGameInfo();
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;
        
        // 绘制垂直线
        for (let x = 0; x <= this.gridWidth; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.gridSize, 0);
            this.ctx.lineTo(x * this.gridSize, this.gridHeight * this.gridSize);
            this.ctx.stroke();
        }
        
        // 绘制水平线
        for (let y = 0; y <= this.gridHeight; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.gridSize);
            this.ctx.lineTo(this.gridWidth * this.gridSize, y * this.gridSize);
            this.ctx.stroke();
        }
    }
    
    drawBuildings() {
        this.buildings.forEach(building => {
            const x = building.x * this.gridSize;
            const y = building.y * this.gridSize;
            
            // 绘制建筑背景
            this.ctx.fillStyle = building.connected ? building.color : '#cccccc';
            this.ctx.fillRect(x + 2, y + 2, this.gridSize - 4, this.gridSize - 4);
            
            // 绘制边框
            this.ctx.strokeStyle = building.connected ? '#333' : '#999';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x + 2, y + 2, this.gridSize - 4, this.gridSize - 4);
            
            // 绘制建筑图标
            this.ctx.font = `${this.gridSize * 0.6}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = '#333';
            this.ctx.fillText(
                building.icon,
                x + this.gridSize / 2,
                y + this.gridSize / 2
            );
            
            // 如果未连接，显示警告
            if (!building.connected && building.type !== 'road') {
                this.ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
                this.ctx.fillRect(x, y, this.gridSize, 4);
            }
        });
    }
    
    drawBuildingPreview() {
        if (!this.selectedBuilding) return;
        
        // 获取鼠标位置（简化处理，使用画布中心）
        const mouseX = this.canvas.width / 2;
        const mouseY = this.canvas.height / 2;
        
        const gridX = Math.floor(mouseX / this.gridSize);
        const gridY = Math.floor(mouseY / this.gridSize);
        
        if (gridX >= 0 && gridX < this.gridWidth && gridY >= 0 && gridY < this.gridHeight) {
            const x = gridX * this.gridSize;
            const y = gridY * this.gridSize;
            const building = this.buildingTypes[this.selectedBuilding];
            
            // 检查是否可以放置
            const canPlace = this.grid[gridX][gridY] === null && this.resources.money >= building.cost;
            
            // 绘制预览
            this.ctx.fillStyle = canPlace ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)';
            this.ctx.fillRect(x + 2, y + 2, this.gridSize - 4, this.gridSize - 4);
            
            this.ctx.strokeStyle = canPlace ? '#00ff00' : '#ff0000';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x + 2, y + 2, this.gridSize - 4, this.gridSize - 4);
            
            // 绘制建筑图标
            this.ctx.font = `${this.gridSize * 0.6}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = canPlace ? '#333' : '#666';
            this.ctx.fillText(
                building.icon,
                x + this.gridSize / 2,
                y + this.gridSize / 2
            );
        }
    }
    
    drawAnimations() {
        const now = Date.now();
        
        this.animations = this.animations.filter(animation => {
            const elapsed = now - animation.startTime;
            const progress = elapsed / animation.duration;
            
            if (progress >= 1) {
                return false; // 移除完成的动画
            }
            
            if (animation.type === 'build') {
                // 建造动画：圆圈扩散
                const radius = progress * 30;
                const alpha = 1 - progress;
                
                this.ctx.strokeStyle = `rgba(0, 255, 0, ${alpha})`;
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(animation.x, animation.y, radius, 0, Math.PI * 2);
                this.ctx.stroke();
            }
            
            return true;
        });
    }
    
    drawGameInfo() {
        // 在画布上显示一些游戏信息
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
    
    addAnimation(animation) {
        this.animations.push(animation);
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
            case 'income':
                message.style.backgroundColor = '#2196F3';
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
    game = new CityBuilder();
});