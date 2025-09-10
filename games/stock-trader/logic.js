class StockTrader {
    constructor() {
        this.canvas = document.getElementById('chartCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.isRunning = false;
        this.isPaused = false;
        this.selectedStock = null;
        
        // Portfolio state
        this.cash = 10000;
        this.initialCash = 10000;
        this.holdings = new Map();
        this.transactions = [];
        this.pendingOrders = [];
        
        // Market data
        this.stocks = new Map();
        this.marketTime = 0;
        this.marketOpen = true;
        this.marketVolatility = 1.0;
        
        // Chart data
        this.chartData = [];
        this.chartTimeframe = 100; // Number of data points to show
        this.chartScale = { min: 0, max: 100 };
        
        // News system
        this.news = [];
        this.newsTimer = 0;
        
        // UI elements
        this.stockListElement = document.getElementById('stockList');
        this.holdingsGridElement = document.getElementById('holdingsGrid');
        this.newsContainerElement = document.getElementById('newsContainer');
        this.selectedStockElement = document.getElementById('selectedStock');
        
        this.initializeStocks();
        this.setupEventListeners();
        this.setupCanvas();
        this.updateUI();
        this.gameLoop();
    }
    
    initializeStocks() {
        const stockData = [
            { symbol: 'AAPL', name: '苹果公司', price: 150.00, sector: 'tech', volatility: 0.02 },
            { symbol: 'GOOGL', name: '谷歌', price: 2800.00, sector: 'tech', volatility: 0.025 },
            { symbol: 'MSFT', name: '微软', price: 300.00, sector: 'tech', volatility: 0.02 },
            { symbol: 'TSLA', name: '特斯拉', price: 800.00, sector: 'auto', volatility: 0.04 },
            { symbol: 'AMZN', name: '亚马逊', price: 3200.00, sector: 'retail', volatility: 0.03 },
            { symbol: 'META', name: 'Meta', price: 320.00, sector: 'tech', volatility: 0.035 },
            { symbol: 'NVDA', name: '英伟达', price: 220.00, sector: 'tech', volatility: 0.045 },
            { symbol: 'JPM', name: '摩根大通', price: 140.00, sector: 'finance', volatility: 0.025 },
            { symbol: 'JNJ', name: '强生', price: 170.00, sector: 'healthcare', volatility: 0.015 },
            { symbol: 'XOM', name: '埃克森美孚', price: 90.00, sector: 'energy', volatility: 0.03 }
        ];
        
        stockData.forEach(data => {
            const stock = {
                ...data,
                history: [data.price],
                dayChange: 0,
                dayChangePercent: 0,
                volume: Math.floor(Math.random() * 1000000) + 100000,
                trend: 'neutral',
                lastUpdate: Date.now()
            };
            this.stocks.set(data.symbol, stock);
        });
        
        this.populateStockList();
        this.populateStockSelect();
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
    }
    
    setupEventListeners() {
        // Control buttons
        document.getElementById('startBtn').addEventListener('click', () => this.startTrading());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        
        // Trading buttons
        document.getElementById('buyBtn').addEventListener('click', () => this.executeTrade('buy'));
        document.getElementById('sellBtn').addEventListener('click', () => this.executeTrade('sell'));
        
        // Form elements
        document.getElementById('tradeType').addEventListener('change', (e) => {
            const limitPriceInput = document.getElementById('limitPrice');
            limitPriceInput.disabled = e.target.value !== 'limit';
        });
        
        document.getElementById('selectedStock').addEventListener('change', (e) => {
            this.selectStock(e.target.value);
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Window resize
        window.addEventListener('resize', () => this.setupCanvas());
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => e.preventDefault());
        this.canvas.addEventListener('touchmove', (e) => e.preventDefault());
        this.canvas.addEventListener('touchend', (e) => e.preventDefault());
    }
    
    handleKeyPress(e) {
        switch(e.key) {
            case ' ':
                e.preventDefault();
                this.togglePause();
                break;
            case 'b':
                this.executeTrade('buy');
                break;
            case 's':
                this.executeTrade('sell');
                break;
            case 'r':
                this.resetGame();
                break;
        }
    }
    
    populateStockList() {
        this.stockListElement.innerHTML = '';
        
        this.stocks.forEach((stock, symbol) => {
            const stockItem = document.createElement('div');
            stockItem.className = 'stock-item';
            stockItem.dataset.symbol = symbol;
            
            const changeClass = stock.dayChange >= 0 ? 'positive' : 'negative';
            const changeSymbol = stock.dayChange >= 0 ? '+' : '';
            
            stockItem.innerHTML = `
                <div class="stock-header">
                    <div class="stock-symbol">${symbol}</div>
                    <div class="stock-price">$${stock.price.toFixed(2)}</div>
                </div>
                <div class="stock-info">
                    <div>${stock.name}</div>
                    <div class="stock-change ${changeClass}">
                        ${changeSymbol}${stock.dayChange.toFixed(2)} (${stock.dayChangePercent.toFixed(2)}%)
                    </div>
                </div>
            `;
            
            stockItem.addEventListener('click', () => this.selectStock(symbol));
            this.stockListElement.appendChild(stockItem);
        });
    }
    
    populateStockSelect() {
        const selectElement = this.selectedStockElement;
        selectElement.innerHTML = '<option value="">请选择股票</option>';
        
        this.stocks.forEach((stock, symbol) => {
            const option = document.createElement('option');
            option.value = symbol;
            option.textContent = `${symbol} - ${stock.name}`;
            selectElement.appendChild(option);
        });
    }
    
    selectStock(symbol) {
        if (!symbol) {
            this.selectedStock = null;
            this.chartData = [];
            return;
        }
        
        this.selectedStock = symbol;
        const stock = this.stocks.get(symbol);
        
        // Update UI
        document.querySelectorAll('.stock-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        const selectedItem = document.querySelector(`[data-symbol="${symbol}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }
        
        this.selectedStockElement.value = symbol;
        
        // Update chart data
        this.chartData = stock.history.slice(-this.chartTimeframe);
        this.updateChartScale();
    }
    
    updateChartScale() {
        if (this.chartData.length === 0) return;
        
        this.chartScale.min = Math.min(...this.chartData) * 0.95;
        this.chartScale.max = Math.max(...this.chartData) * 1.05;
    }
    
    executeTrade(action) {
        if (!this.isRunning || this.isPaused || !this.selectedStock) return;
        
        const stock = this.stocks.get(this.selectedStock);
        const quantity = parseInt(document.getElementById('quantity').value);
        const tradeType = document.getElementById('tradeType').value;
        const limitPrice = parseFloat(document.getElementById('limitPrice').value);
        
        if (!quantity || quantity <= 0) {
            alert('请输入有效的股票数量');
            return;
        }
        
        if (action === 'buy') {
            this.buyStock(this.selectedStock, quantity, tradeType, limitPrice);
        } else {
            this.sellStock(this.selectedStock, quantity, tradeType, limitPrice);
        }
        
        // Clear form
        document.getElementById('quantity').value = '';
        document.getElementById('limitPrice').value = '';
    }
    
    buyStock(symbol, quantity, type, limitPrice) {
        const stock = this.stocks.get(symbol);
        const price = type === 'limit' ? limitPrice : stock.price;
        const totalCost = price * quantity;
        
        if (type === 'market') {
            if (this.cash < totalCost) {
                alert('现金不足！');
                return;
            }
            
            this.cash -= totalCost;
            
            if (this.holdings.has(symbol)) {
                const holding = this.holdings.get(symbol);
                const newQuantity = holding.quantity + quantity;
                const newAvgPrice = (holding.avgPrice * holding.quantity + totalCost) / newQuantity;
                holding.quantity = newQuantity;
                holding.avgPrice = newAvgPrice;
            } else {
                this.holdings.set(symbol, {
                    quantity: quantity,
                    avgPrice: price,
                    symbol: symbol
                });
            }
            
            this.addTransaction({
                type: 'buy',
                symbol: symbol,
                quantity: quantity,
                price: price,
                timestamp: Date.now()
            });
            
            this.createNotification(`买入 ${quantity} 股 ${symbol}，价格 $${price.toFixed(2)}`, 'success');
        } else {
            // Limit order
            this.pendingOrders.push({
                type: 'buy',
                symbol: symbol,
                quantity: quantity,
                limitPrice: limitPrice,
                timestamp: Date.now()
            });
            
            this.createNotification(`限价买单已提交：${quantity} 股 ${symbol}，限价 $${limitPrice.toFixed(2)}`, 'info');
        }
        
        this.updateUI();
    }
    
    sellStock(symbol, quantity, type, limitPrice) {
        const stock = this.stocks.get(symbol);
        const holding = this.holdings.get(symbol);
        
        if (!holding || holding.quantity < quantity) {
            alert('持股数量不足！');
            return;
        }
        
        const price = type === 'limit' ? limitPrice : stock.price;
        
        if (type === 'market') {
            const totalValue = price * quantity;
            this.cash += totalValue;
            
            holding.quantity -= quantity;
            if (holding.quantity === 0) {
                this.holdings.delete(symbol);
            }
            
            this.addTransaction({
                type: 'sell',
                symbol: symbol,
                quantity: quantity,
                price: price,
                timestamp: Date.now()
            });
            
            this.createNotification(`卖出 ${quantity} 股 ${symbol}，价格 $${price.toFixed(2)}`, 'success');
        } else {
            // Limit order
            this.pendingOrders.push({
                type: 'sell',
                symbol: symbol,
                quantity: quantity,
                limitPrice: limitPrice,
                timestamp: Date.now()
            });
            
            this.createNotification(`限价卖单已提交：${quantity} 股 ${symbol}，限价 $${limitPrice.toFixed(2)}`, 'info');
        }
        
        this.updateUI();
    }
    
    addTransaction(transaction) {
        this.transactions.push(transaction);
        
        // Keep only last 100 transactions
        if (this.transactions.length > 100) {
            this.transactions = this.transactions.slice(-100);
        }
    }
    
    updateStockPrices() {
        this.stocks.forEach((stock, symbol) => {
            const oldPrice = stock.price;
            
            // Generate price movement
            const randomFactor = (Math.random() - 0.5) * 2;
            const volatilityFactor = stock.volatility * this.marketVolatility;
            const priceChange = stock.price * volatilityFactor * randomFactor;
            
            // Apply news effects
            const newsEffect = this.getNewsEffect(symbol, stock.sector);
            
            stock.price = Math.max(0.01, stock.price + priceChange + newsEffect);
            stock.dayChange = stock.price - stock.history[0];
            stock.dayChangePercent = (stock.dayChange / stock.history[0]) * 100;
            
            // Update trend
            if (stock.price > oldPrice) {
                stock.trend = 'up';
            } else if (stock.price < oldPrice) {
                stock.trend = 'down';
            } else {
                stock.trend = 'neutral';
            }
            
            // Add to history
            stock.history.push(stock.price);
            if (stock.history.length > 1000) {
                stock.history = stock.history.slice(-1000);
            }
            
            // Update volume
            stock.volume = Math.floor(Math.random() * 500000) + 100000;
            stock.lastUpdate = Date.now();
        });
        
        // Update chart data for selected stock
        if (this.selectedStock) {
            const stock = this.stocks.get(this.selectedStock);
            this.chartData = stock.history.slice(-this.chartTimeframe);
            this.updateChartScale();
        }
    }
    
    getNewsEffect(symbol, sector) {
        let effect = 0;
        
        this.news.forEach(newsItem => {
            if (newsItem.affectedStocks.includes(symbol) || newsItem.affectedSectors.includes(sector)) {
                effect += newsItem.impact;
            }
        });
        
        return effect;
    }
    
    processPendingOrders() {
        this.pendingOrders = this.pendingOrders.filter(order => {
            const stock = this.stocks.get(order.symbol);
            let executed = false;
            
            if (order.type === 'buy' && stock.price <= order.limitPrice) {
                const totalCost = order.limitPrice * order.quantity;
                if (this.cash >= totalCost) {
                    this.cash -= totalCost;
                    
                    if (this.holdings.has(order.symbol)) {
                        const holding = this.holdings.get(order.symbol);
                        const newQuantity = holding.quantity + order.quantity;
                        const newAvgPrice = (holding.avgPrice * holding.quantity + totalCost) / newQuantity;
                        holding.quantity = newQuantity;
                        holding.avgPrice = newAvgPrice;
                    } else {
                        this.holdings.set(order.symbol, {
                            quantity: order.quantity,
                            avgPrice: order.limitPrice,
                            symbol: order.symbol
                        });
                    }
                    
                    this.addTransaction({
                        type: 'buy',
                        symbol: order.symbol,
                        quantity: order.quantity,
                        price: order.limitPrice,
                        timestamp: Date.now()
                    });
                    
                    this.createNotification(`限价买单执行：${order.quantity} 股 ${order.symbol}，价格 $${order.limitPrice.toFixed(2)}`, 'success');
                    executed = true;
                }
            } else if (order.type === 'sell' && stock.price >= order.limitPrice) {
                const holding = this.holdings.get(order.symbol);
                if (holding && holding.quantity >= order.quantity) {
                    const totalValue = order.limitPrice * order.quantity;
                    this.cash += totalValue;
                    
                    holding.quantity -= order.quantity;
                    if (holding.quantity === 0) {
                        this.holdings.delete(order.symbol);
                    }
                    
                    this.addTransaction({
                        type: 'sell',
                        symbol: order.symbol,
                        quantity: order.quantity,
                        price: order.limitPrice,
                        timestamp: Date.now()
                    });
                    
                    this.createNotification(`限价卖单执行：${order.quantity} 股 ${order.symbol}，价格 $${order.limitPrice.toFixed(2)}`, 'success');
                    executed = true;
                }
            }
            
            return !executed;
        });
    }
    
    generateNews() {
        this.newsTimer += 16;
        
        if (this.newsTimer >= 30000) { // Generate news every 30 seconds
            this.newsTimer = 0;
            
            const newsTemplates = [
                {
                    title: '科技股大涨',
                    content: '人工智能技术突破推动科技股普涨',
                    impact: 2.0,
                    affectedSectors: ['tech'],
                    affectedStocks: []
                },
                {
                    title: '能源价格上涨',
                    content: '地缘政治紧张局势推高油价',
                    impact: 1.5,
                    affectedSectors: ['energy'],
                    affectedStocks: []
                },
                {
                    title: '美联储利率决议',
                    content: '央行政策影响金融股表现',
                    impact: -1.0,
                    affectedSectors: ['finance'],
                    affectedStocks: []
                },
                {
                    title: '苹果发布新产品',
                    content: '新iPhone销量超预期',
                    impact: 3.0,
                    affectedSectors: [],
                    affectedStocks: ['AAPL']
                },
                {
                    title: '特斯拉交付量创新高',
                    content: '电动车销量持续增长',
                    impact: 2.5,
                    affectedSectors: [],
                    affectedStocks: ['TSLA']
                }
            ];
            
            const template = newsTemplates[Math.floor(Math.random() * newsTemplates.length)];
            const newsItem = {
                ...template,
                timestamp: Date.now(),
                id: Date.now()
            };
            
            this.news.unshift(newsItem);
            
            // Keep only last 10 news items
            if (this.news.length > 10) {
                this.news = this.news.slice(0, 10);
            }
            
            this.updateNewsDisplay();
        }
    }
    
    updateNewsDisplay() {
        this.newsContainerElement.innerHTML = '';
        
        this.news.forEach(newsItem => {
            const newsElement = document.createElement('div');
            newsElement.className = 'news-item';
            
            const impactClass = newsItem.impact > 0 ? 'positive' : 'negative';
            const impactText = newsItem.impact > 0 ? '利好' : '利空';
            
            newsElement.innerHTML = `
                <div class="news-title">${newsItem.title}</div>
                <div class="news-content">${newsItem.content}</div>
                <div class="news-impact ${impactClass}">市场影响：${impactText}</div>
            `;
            
            this.newsContainerElement.appendChild(newsElement);
        });
    }
    
    updateHoldingsDisplay() {
        this.holdingsGridElement.innerHTML = '';
        
        if (this.holdings.size === 0) {
            this.holdingsGridElement.innerHTML = '<p style="text-align: center; opacity: 0.7;">暂无持仓</p>';
            return;
        }
        
        this.holdings.forEach((holding, symbol) => {
            const stock = this.stocks.get(symbol);
            const currentValue = holding.quantity * stock.price;
            const costBasis = holding.quantity * holding.avgPrice;
            const unrealizedPnL = currentValue - costBasis;
            const unrealizedPnLPercent = (unrealizedPnL / costBasis) * 100;
            
            const holdingElement = document.createElement('div');
            holdingElement.className = 'holding-item';
            
            const pnlClass = unrealizedPnL >= 0 ? 'positive' : 'negative';
            const pnlSymbol = unrealizedPnL >= 0 ? '+' : '';
            
            holdingElement.innerHTML = `
                <div class="holding-header">
                    <div class="holding-symbol">${symbol}</div>
                    <div class="holding-value">$${currentValue.toFixed(2)}</div>
                </div>
                <div class="holding-details">
                    <div>数量：${holding.quantity}</div>
                    <div>均价：$${holding.avgPrice.toFixed(2)}</div>
                    <div>现价：$${stock.price.toFixed(2)}</div>
                    <div class="${pnlClass}">盈亏：${pnlSymbol}$${unrealizedPnL.toFixed(2)}</div>
                    <div class="${pnlClass}">收益率：${pnlSymbol}${unrealizedPnLPercent.toFixed(2)}%</div>
                </div>
            `;
            
            this.holdingsGridElement.appendChild(holdingElement);
        });
    }
    
    calculatePortfolioValue() {
        let totalValue = this.cash;
        
        this.holdings.forEach((holding, symbol) => {
            const stock = this.stocks.get(symbol);
            totalValue += holding.quantity * stock.price;
        });
        
        return totalValue;
    }
    
    createNotification(message, type) {
        // Simple notification system
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
    
    startTrading() {
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
    
    resetGame() {
        this.cash = this.initialCash;
        this.holdings.clear();
        this.transactions = [];
        this.pendingOrders = [];
        this.news = [];
        this.selectedStock = null;
        this.chartData = [];
        
        // Reset stock prices to initial values
        this.stocks.forEach(stock => {
            stock.price = stock.history[0];
            stock.history = [stock.price];
            stock.dayChange = 0;
            stock.dayChangePercent = 0;
        });
        
        this.isRunning = false;
        this.isPaused = false;
        
        document.getElementById('startBtn').textContent = '开始交易';
        document.getElementById('pauseBtn').textContent = '暂停';
        
        this.updateUI();
    }
    
    updateUI() {
        const portfolioValue = this.calculatePortfolioValue();
        const totalReturn = portfolioValue - this.initialCash;
        const returnPercent = (totalReturn / this.initialCash) * 100;
        
        document.getElementById('cash').textContent = `$${this.cash.toFixed(2)}`;
        document.getElementById('portfolioValue').textContent = `$${(portfolioValue - this.cash).toFixed(2)}`;
        document.getElementById('totalValue').textContent = `$${portfolioValue.toFixed(2)}`;
        document.getElementById('returnRate').textContent = `${returnPercent.toFixed(2)}%`;
        
        // Update return rate color
        const returnElement = document.getElementById('returnRate');
        returnElement.className = returnPercent >= 0 ? 'positive' : 'negative';
        
        this.populateStockList();
        this.updateHoldingsDisplay();
    }
    
    drawChart() {
        if (!this.selectedStock || this.chartData.length === 0) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#666';
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('请选择股票查看图表', this.canvas.width / 2, this.canvas.height / 2);
            return;
        }
        
        const rect = this.canvas.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        
        this.ctx.clearRect(0, 0, width, height);
        
        // Draw background
        this.ctx.fillStyle = '#f5f5f5';
        this.ctx.fillRect(0, 0, width, height);
        
        // Draw grid
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;
        
        const gridLines = 10;
        for (let i = 0; i <= gridLines; i++) {
            const y = (height / gridLines) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
            this.ctx.stroke();
            
            const x = (width / gridLines) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, height);
            this.ctx.stroke();
        }
        
        // Draw price line
        if (this.chartData.length > 1) {
            this.ctx.strokeStyle = '#2196F3';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            
            const priceRange = this.chartScale.max - this.chartScale.min;
            
            for (let i = 0; i < this.chartData.length; i++) {
                const x = (width / (this.chartData.length - 1)) * i;
                const y = height - ((this.chartData[i] - this.chartScale.min) / priceRange) * height;
                
                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            
            this.ctx.stroke();
            
            // Draw current price point
            const lastX = width - (width / (this.chartData.length - 1));
            const lastY = height - ((this.chartData[this.chartData.length - 1] - this.chartScale.min) / priceRange) * height;
            
            this.ctx.fillStyle = '#FF9800';
            this.ctx.beginPath();
            this.ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Draw price labels
        this.ctx.fillStyle = '#666';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'middle';
        
        for (let i = 0; i <= 5; i++) {
            const price = this.chartScale.min + (this.chartScale.max - this.chartScale.min) * (i / 5);
            const y = height - (height / 5) * i;
            this.ctx.fillText(`$${price.toFixed(2)}`, width - 5, y);
        }
        
        // Draw stock info
        if (this.selectedStock) {
            const stock = this.stocks.get(this.selectedStock);
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            this.ctx.fillRect(10, 10, 200, 80);
            
            this.ctx.fillStyle = '#333';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`${this.selectedStock} - ${stock.name}`, 20, 30);
            
            this.ctx.font = '14px Arial';
            this.ctx.fillText(`价格: $${stock.price.toFixed(2)}`, 20, 50);
            
            const changeColor = stock.dayChange >= 0 ? '#4CAF50' : '#F44336';
            const changeSymbol = stock.dayChange >= 0 ? '+' : '';
            this.ctx.fillStyle = changeColor;
            this.ctx.fillText(`${changeSymbol}${stock.dayChange.toFixed(2)} (${stock.dayChangePercent.toFixed(2)}%)`, 20, 70);
        }
    }
    
    gameLoop() {
        if (this.isRunning && !this.isPaused) {
            this.marketTime += 16;
            
            // Update stock prices every 1 second
            if (this.marketTime % 1000 < 16) {
                this.updateStockPrices();
                this.processPendingOrders();
                this.updateUI();
            }
            
            // Generate news
            this.generateNews();
        }
        
        this.drawChart();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new StockTrader();
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
    if (e.target === document.getElementById('chartCanvas')) {
        e.preventDefault();
    }
}, { passive: false });

document.body.addEventListener('touchend', function(e) {
    if (e.target === document.getElementById('chartCanvas')) {
        e.preventDefault();
    }
}, { passive: false });

document.body.addEventListener('touchmove', function(e) {
    if (e.target === document.getElementById('chartCanvas')) {
        e.preventDefault();
    }
}, { passive: false });