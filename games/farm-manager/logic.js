class FarmManager {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.isRunning = false;
        this.isPaused = false;
        this.selectedAction = null;
        
        // Game state
        this.money = 500;
        this.experience = 0;
        this.level = 1;
        this.totalCrops = 0;
        this.totalAnimals = 0;
        
        // Time and seasons
        this.gameTime = 0;
        this.seasonTime = 0;
        this.seasonDuration = 120000; // 2 minutes per season
        this.currentSeason = 0;
        this.seasons = [
            { name: '🌸 春季', effect: 'growth_speed', bonus: 1.2, temp: 22, humidity: 60 },
            { name: '☀️ 夏季', effect: 'yield', bonus: 1.3, temp: 30, humidity: 40 },
            { name: '🍂 秋季', effect: 'price', bonus: 1.4, temp: 18, humidity: 70 },
            { name: '❄️ 冬季', effect: 'growth_speed', bonus: 0.7, temp: 5, humidity: 80 }
        ];
        
        // Weather system
        this.weather = {
            type: 'sunny',
            icon: '☀️',
            name: '晴天',
            effect: 1.0
        };
        this.weatherTypes = [
            { type: 'sunny', icon: '☀️', name: '晴天', effect: 1.0, chance: 0.4 },
            { type: 'cloudy', icon: '☁️', name: '多云', effect: 0.9, chance: 0.3 },
            { type: 'rainy', icon: '🌧️', name: '雨天', effect: 1.2, chance: 0.2 },
            { type: 'stormy', icon: '⛈️', name: '暴风雨', effect: 0.6, chance: 0.1 }
        ];
        
        // Grid system
        this.gridSize = 40;
        this.gridWidth = Math.floor(this.canvas.width / this.gridSize);
        this.gridHeight = Math.floor(this.canvas.height / this.gridSize);
        this.grid = [];
        
        // Farm items
        this.crops = [];
        this.animals = [];
        this.buildings = [];
        
        // Crop types
        this.cropTypes = {
            wheat: {
                name: '小麦',
                icon: '🌾',
                cost: 20,
                growTime: 30000,
                baseYield: 40,
                experience: 5
            },
            corn: {
                name: '玉米',
                icon: '🌽',
                cost: 30,
                growTime: 45000,
                baseYield: 70,
                experience: 8
            },
            tomato: {
                name: '番茄',
                icon: '🍅',
                cost: 40,
                growTime: 60000,
                baseYield: 100,
                experience: 12
            }
        };
        
        // Animal types
        this.animalTypes = {
            cow: {
                name: '奶牛',
                icon: '🐄',
                cost: 200,
                productionTime: 20000,
                baseYield: 50,
                experience: 15
            },
            chicken: {
                name: '鸡',
                icon: '🐔',
                cost: 100,
                productionTime: 15000,
                baseYield: 30,
                experience: 10
            }
        };
        
        // Building types
        this.buildingTypes = {
            well: {
                name: '水井',
                icon: '🏗️',
                cost: 150,
                effect: 'irrigation',
                radius: 2,
                bonus: 1.5
            }
        };
        
        // Animation and effects
        this.particles = [];
        this.animations = [];
        
        this.initializeGrid();
        this.setupEventListeners();
        this.setupCanvas();
        this.updateUI();
        this.gameLoop();
    }
    
    initializeGrid() {
        this.grid = [];
        for (let y = 0; y < this.gridHeight; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.gridWidth; x++) {
                this.grid[y][x] = {
                    type: 'empty',
                    item: null,
                    irrigated: false
                };
            }
        }
    }
    
    setupCanvas() {
        // Handle high DPI displays
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        // Recalculate grid after canvas resize
        this.gridWidth = Math.floor(rect.width / this.gridSize);
        this.gridHeight = Math.floor(rect.height / this.gridSize);
        this.initializeGrid();
    }
    
    setupEventListeners() {
        // Canvas events
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleCanvasHover(e));
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('click', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.handleCanvasClick(mouseEvent);
        });
        
        // Prevent scrolling on touch
        this.canvas.addEventListener('touchmove', (e) => e.preventDefault());
        this.canvas.addEventListener('touchend', (e) => e.preventDefault());
        
        // Control buttons
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('harvestBtn').addEventListener('click', () => this.harvestAll());
        
        // Action panel
        document.querySelectorAll('.action-item').forEach(item => {
            item.addEventListener('click', () => this.selectAction(item.dataset.action));
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Window resize
        window.addEventListener('resize', () => this.setupCanvas());
    }
    
    handleCanvasClick(e) {
        if (!this.isRunning || this.isPaused) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / this.gridSize);
        const y = Math.floor((e.clientY - rect.top) / this.gridSize);
        
        if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
            this.performAction(x, y);
        }
    }
    
    handleCanvasHover(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / this.gridSize);
        const y = Math.floor((e.clientY - rect.top) / this.gridSize);
        
        this.hoverX = x;
        this.hoverY = y;
    }
    
    handleKeyPress(e) {
        switch(e.key) {
            case ' ':
                e.preventDefault();
                this.togglePause();
                break;
            case 'h':
                this.harvestAll();
                break;
            case '1':
                this.selectAction('wheat');
                break;
            case '2':
                this.selectAction('corn');
                break;
            case '3':
                this.selectAction('tomato');
                break;
            case '4':
                this.selectAction('cow');
                break;
            case '5':
                this.selectAction('chicken');
                break;
            case '6':
                this.selectAction('well');
                break;
        }
    }
    
    selectAction(action) {
        this.selectedAction = action;
        
        // Update UI
        document.querySelectorAll('.action-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        const selectedItem = document.querySelector(`[data-action="${action}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }
    }
    
    performAction(x, y) {
        if (!this.selectedAction) return;
        
        const cell = this.grid[y][x];
        
        if (this.selectedAction in this.cropTypes) {
            this.plantCrop(x, y, this.selectedAction);
        } else if (this.selectedAction in this.animalTypes) {
            this.placeAnimal(x, y, this.selectedAction);
        } else if (this.selectedAction in this.buildingTypes) {
            this.placeBuilding(x, y, this.selectedAction);
        }
    }
    
    plantCrop(x, y, cropType) {
        const cell = this.grid[y][x];
        const crop = this.cropTypes[cropType];
        
        if (cell.type !== 'empty' || this.money < crop.cost) return;
        
        this.money -= crop.cost;
        
        const newCrop = {
            x: x,
            y: y,
            type: cropType,
            plantTime: Date.now(),
            growTime: crop.growTime,
            stage: 0,
            ready: false
        };
        
        this.crops.push(newCrop);
        cell.type = 'crop';
        cell.item = newCrop;
        
        this.createParticle(x * this.gridSize + this.gridSize/2, y * this.gridSize + this.gridSize/2, '🌱', '#4CAF50');
        this.updateUI();
    }
    
    placeAnimal(x, y, animalType) {
        const cell = this.grid[y][x];
        const animal = this.animalTypes[animalType];
        
        if (cell.type !== 'empty' || this.money < animal.cost) return;
        
        this.money -= animal.cost;
        
        const newAnimal = {
            x: x,
            y: y,
            type: animalType,
            lastProduction: Date.now(),
            productionTime: animal.productionTime,
            ready: false
        };
        
        this.animals.push(newAnimal);
        cell.type = 'animal';
        cell.item = newAnimal;
        
        this.totalAnimals++;
        this.createParticle(x * this.gridSize + this.gridSize/2, y * this.gridSize + this.gridSize/2, animal.icon, '#FF9800');
        this.updateUI();
    }
    
    placeBuilding(x, y, buildingType) {
        const cell = this.grid[y][x];
        const building = this.buildingTypes[buildingType];
        
        if (cell.type !== 'empty' || this.money < building.cost) return;
        
        this.money -= building.cost;
        
        const newBuilding = {
            x: x,
            y: y,
            type: buildingType
        };
        
        this.buildings.push(newBuilding);
        cell.type = 'building';
        cell.item = newBuilding;
        
        // Apply building effects
        if (building.effect === 'irrigation') {
            this.applyIrrigation(x, y, building.radius);
        }
        
        this.createParticle(x * this.gridSize + this.gridSize/2, y * this.gridSize + this.gridSize/2, building.icon, '#2196F3');
        this.updateUI();
    }
    
    applyIrrigation(centerX, centerY, radius) {
        for (let y = Math.max(0, centerY - radius); y <= Math.min(this.gridHeight - 1, centerY + radius); y++) {
            for (let x = Math.max(0, centerX - radius); x <= Math.min(this.gridWidth - 1, centerX + radius); x++) {
                const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
                if (distance <= radius) {
                    this.grid[y][x].irrigated = true;
                }
            }
        }
    }
    
    harvestCrop(crop) {
        const cropType = this.cropTypes[crop.type];
        const season = this.seasons[this.currentSeason];
        
        let yield = cropType.baseYield;
        
        // Apply season bonus
        if (season.effect === 'yield') {
            yield *= season.bonus;
        } else if (season.effect === 'price') {
            yield *= season.bonus;
        }
        
        // Apply weather effect
        yield *= this.weather.effect;
        
        // Apply irrigation bonus
        if (this.grid[crop.y][crop.x].irrigated) {
            yield *= 1.3;
        }
        
        yield = Math.floor(yield);
        
        this.money += yield;
        this.experience += cropType.experience;
        
        // Remove crop
        const cropIndex = this.crops.indexOf(crop);
        if (cropIndex > -1) {
            this.crops.splice(cropIndex, 1);
        }
        
        this.grid[crop.y][crop.x].type = 'empty';
        this.grid[crop.y][crop.x].item = null;
        
        this.createParticle(crop.x * this.gridSize + this.gridSize/2, crop.y * this.gridSize + this.gridSize/2, `+${yield}`, '#4CAF50');
        this.updateUI();
    }
    
    harvestAnimal(animal) {
        const animalType = this.animalTypes[animal.type];
        const season = this.seasons[this.currentSeason];
        
        let yield = animalType.baseYield;
        
        // Apply season bonus
        if (season.effect === 'yield') {
            yield *= season.bonus;
        } else if (season.effect === 'price') {
            yield *= season.bonus;
        }
        
        yield = Math.floor(yield);
        
        this.money += yield;
        this.experience += animalType.experience;
        
        animal.lastProduction = Date.now();
        animal.ready = false;
        
        this.createParticle(animal.x * this.gridSize + this.gridSize/2, animal.y * this.gridSize + this.gridSize/2, `+${yield}`, '#FF9800');
        this.updateUI();
    }
    
    harvestAll() {
        // Harvest ready crops
        this.crops.filter(crop => crop.ready).forEach(crop => {
            this.harvestCrop(crop);
        });
        
        // Harvest ready animals
        this.animals.filter(animal => animal.ready).forEach(animal => {
            this.harvestAnimal(animal);
        });
    }
    
    updateCrops() {
        const now = Date.now();
        const season = this.seasons[this.currentSeason];
        
        this.crops.forEach(crop => {
            const cropType = this.cropTypes[crop.type];
            let growTime = cropType.growTime;
            
            // Apply season effect
            if (season.effect === 'growth_speed') {
                growTime /= season.bonus;
            }
            
            // Apply irrigation effect
            if (this.grid[crop.y][crop.x].irrigated) {
                growTime *= 0.8;
            }
            
            const elapsed = now - crop.plantTime;
            const progress = elapsed / growTime;
            
            if (progress >= 1) {
                crop.ready = true;
                crop.stage = 3;
            } else if (progress >= 0.75) {
                crop.stage = 2;
            } else if (progress >= 0.5) {
                crop.stage = 1;
            } else {
                crop.stage = 0;
            }
        });
        
        this.totalCrops = this.crops.length;
    }
    
    updateAnimals() {
        const now = Date.now();
        
        this.animals.forEach(animal => {
            const animalType = this.animalTypes[animal.type];
            const elapsed = now - animal.lastProduction;
            
            if (elapsed >= animalType.productionTime) {
                animal.ready = true;
            }
        });
    }
    
    updateSeason() {
        this.seasonTime += 16;
        
        if (this.seasonTime >= this.seasonDuration) {
            this.seasonTime = 0;
            this.currentSeason = (this.currentSeason + 1) % this.seasons.length;
            this.changeWeather();
        }
        
        const progress = (this.seasonTime / this.seasonDuration) * 100;
        document.getElementById('seasonProgress').style.width = progress + '%';
        
        const season = this.seasons[this.currentSeason];
        document.getElementById('seasonName').textContent = season.name;
        document.getElementById('temperature').textContent = season.temp + '°C';
        document.getElementById('humidity').textContent = season.humidity + '%';
        
        let effectText = '';
        switch(season.effect) {
            case 'growth_speed':
                effectText = `${season.name.split(' ')[1]}：作物生长速度${season.bonus > 1 ? '+' : ''}${Math.round((season.bonus - 1) * 100)}%`;
                break;
            case 'yield':
                effectText = `${season.name.split(' ')[1]}：作物产量+${Math.round((season.bonus - 1) * 100)}%`;
                break;
            case 'price':
                effectText = `${season.name.split(' ')[1]}：作物价格+${Math.round((season.bonus - 1) * 100)}%`;
                break;
        }
        document.getElementById('seasonEffect').textContent = effectText;
    }
    
    changeWeather() {
        const rand = Math.random();
        let cumulative = 0;
        
        for (const weatherType of this.weatherTypes) {
            cumulative += weatherType.chance;
            if (rand <= cumulative) {
                this.weather = { ...weatherType };
                break;
            }
        }
        
        document.getElementById('weatherIcon').textContent = this.weather.icon;
        document.getElementById('weatherName').textContent = this.weather.name;
    }
    
    updateLevel() {
        const newLevel = Math.floor(this.experience / 100) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.createParticle(this.canvas.width / 2, this.canvas.height / 2, '🎉', '#FFD700');
        }
    }
    
    createParticle(x, y, text, color) {
        this.particles.push({
            x: x,
            y: y,
            text: text,
            color: color,
            life: 60,
            maxLife: 60,
            vx: (Math.random() - 0.5) * 2,
            vy: -2 - Math.random() * 2
        });
    }
    
    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            return particle.life > 0;
        });
    }
    
    startGame() {
        this.isRunning = true;
        this.isPaused = false;
        document.getElementById('startBtn').textContent = '重新开始';
        document.getElementById('pauseBtn').textContent = '暂停';
    }
    
    togglePause() {
        if (!this.isRunning) return;
        
        this.isPaused = !this.isPaused;
        document.getElementById('pauseBtn').textContent = this.isPaused ? '继续' : '暂停';
    }
    
    updateUI() {
        document.getElementById('money').textContent = this.money;
        document.getElementById('crops').textContent = this.totalCrops;
        document.getElementById('animals').textContent = this.totalAnimals;
        document.getElementById('experience').textContent = this.experience;
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.ctx.fillStyle = '#8BC34A';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.drawGrid();
        
        // Draw farm items
        this.drawCrops();
        this.drawAnimals();
        this.drawBuildings();
        
        // Draw hover effect
        this.drawHover();
        
        // Draw particles
        this.drawParticles();
        
        // Draw UI overlay
        this.drawOverlay();
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x <= this.gridWidth; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.gridSize, 0);
            this.ctx.lineTo(x * this.gridSize, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.gridHeight; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.gridSize);
            this.ctx.lineTo(this.canvas.width, y * this.gridSize);
            this.ctx.stroke();
        }
        
        // Draw irrigated areas
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                if (this.grid[y][x].irrigated) {
                    this.ctx.fillStyle = 'rgba(33, 150, 243, 0.2)';
                    this.ctx.fillRect(x * this.gridSize, y * this.gridSize, this.gridSize, this.gridSize);
                }
            }
        }
    }
    
    drawCrops() {
        this.crops.forEach(crop => {
            const x = crop.x * this.gridSize;
            const y = crop.y * this.gridSize;
            const centerX = x + this.gridSize / 2;
            const centerY = y + this.gridSize / 2;
            
            // Draw crop background
            this.ctx.fillStyle = crop.ready ? '#4CAF50' : '#8BC34A';
            this.ctx.fillRect(x + 2, y + 2, this.gridSize - 4, this.gridSize - 4);
            
            // Draw crop icon
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            const cropType = this.cropTypes[crop.type];
            if (crop.ready) {
                this.ctx.fillText(cropType.icon, centerX, centerY);
                
                // Draw ready indicator
                this.ctx.fillStyle = '#FFD700';
                this.ctx.beginPath();
                this.ctx.arc(x + this.gridSize - 8, y + 8, 4, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                // Draw growth stages
                const stages = ['🌱', '🌿', '🌾', cropType.icon];
                this.ctx.fillText(stages[crop.stage], centerX, centerY);
            }
        });
    }
    
    drawAnimals() {
        this.animals.forEach(animal => {
            const x = animal.x * this.gridSize;
            const y = animal.y * this.gridSize;
            const centerX = x + this.gridSize / 2;
            const centerY = y + this.gridSize / 2;
            
            // Draw animal background
            this.ctx.fillStyle = animal.ready ? '#FF9800' : '#FFC107';
            this.ctx.fillRect(x + 2, y + 2, this.gridSize - 4, this.gridSize - 4);
            
            // Draw animal icon
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            const animalType = this.animalTypes[animal.type];
            this.ctx.fillText(animalType.icon, centerX, centerY);
            
            if (animal.ready) {
                // Draw ready indicator
                this.ctx.fillStyle = '#4CAF50';
                this.ctx.beginPath();
                this.ctx.arc(x + this.gridSize - 8, y + 8, 4, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }
    
    drawBuildings() {
        this.buildings.forEach(building => {
            const x = building.x * this.gridSize;
            const y = building.y * this.gridSize;
            const centerX = x + this.gridSize / 2;
            const centerY = y + this.gridSize / 2;
            
            // Draw building background
            this.ctx.fillStyle = '#2196F3';
            this.ctx.fillRect(x + 2, y + 2, this.gridSize - 4, this.gridSize - 4);
            
            // Draw building icon
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            const buildingType = this.buildingTypes[building.type];
            this.ctx.fillText(buildingType.icon, centerX, centerY);
        });
    }
    
    drawHover() {
        if (this.hoverX >= 0 && this.hoverX < this.gridWidth && 
            this.hoverY >= 0 && this.hoverY < this.gridHeight && 
            this.selectedAction) {
            
            const x = this.hoverX * this.gridSize;
            const y = this.hoverY * this.gridSize;
            
            this.ctx.strokeStyle = '#FF9800';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(x, y, this.gridSize, this.gridSize);
            
            // Show preview
            if (this.grid[this.hoverY][this.hoverX].type === 'empty') {
                this.ctx.fillStyle = 'rgba(255, 152, 0, 0.3)';
                this.ctx.fillRect(x, y, this.gridSize, this.gridSize);
                
                // Show action icon
                this.ctx.font = '20px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                
                let icon = '';
                if (this.selectedAction in this.cropTypes) {
                    icon = this.cropTypes[this.selectedAction].icon;
                } else if (this.selectedAction in this.animalTypes) {
                    icon = this.animalTypes[this.selectedAction].icon;
                } else if (this.selectedAction in this.buildingTypes) {
                    icon = this.buildingTypes[this.selectedAction].icon;
                }
                
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                this.ctx.fillText(icon, x + this.gridSize / 2, y + this.gridSize / 2);
            }
        }
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = particle.color;
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 2;
            
            this.ctx.strokeText(particle.text, particle.x, particle.y);
            this.ctx.fillText(particle.text, particle.x, particle.y);
            
            this.ctx.restore();
        });
    }
    
    drawOverlay() {
        if (this.isPaused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = 'white';
            this.ctx.strokeStyle = 'black';
            this.ctx.lineWidth = 3;
            
            const text = '游戏暂停';
            this.ctx.strokeText(text, this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2);
        }
    }
    
    gameLoop() {
        if (this.isRunning && !this.isPaused) {
            this.updateCrops();
            this.updateAnimals();
            this.updateSeason();
            this.updateLevel();
            this.updateParticles();
        }
        
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new FarmManager();
});

// Prevent zoom on double tap (mobile)
document.addEventListener('touchstart', function(event) {
    if (event.touches.length > 1) {
        event.preventDefault();
    }
});

let lastTouchEnd = 0;
document.addEventListener('touchend', function(event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Prevent scrolling when touching the canvas
document.body.addEventListener('touchstart', function(e) {
    if (e.target === document.getElementById('gameCanvas')) {
        e.preventDefault();
    }
}, { passive: false });

document.body.addEventListener('touchend', function(e) {
    if (e.target === document.getElementById('gameCanvas')) {
        e.preventDefault();
    }
}, { passive: false });

document.body.addEventListener('touchmove', function(e) {
    if (e.target === document.getElementById('gameCanvas')) {
        e.preventDefault();
    }
}, { passive: false });