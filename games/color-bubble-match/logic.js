class ColorBubbleMatch {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.overlay = document.getElementById('gameOverlay');
        
        // Game state
        this.gameState = 'menu'; // menu, playing, paused, gameOver
        this.score = 0;
        this.level = 1;
        this.bubblesLeft = 5;
        
        // Game settings
        this.bubbleRadius = 20;
        this.colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
        this.rows = 8;
        this.cols = 10;
        
        // Game objects
        this.bubbles = [];
        this.shooter = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 50,
            angle: 0,
            nextBubble: null,
            currentBubble: null
        };
        
        // Animation
        this.animationId = null;
        this.lastTime = 0;
        
        // Input handling
        this.mousePos = { x: 0, y: 0 };
        this.isShooting = false;
        
        this.initializeGame();
        this.setupEventListeners();
    }
    
    initializeGame() {
        this.createBubbleGrid();
        this.generateNextBubble();
        this.generateCurrentBubble();
        this.updateUI();
    }
    
    createBubbleGrid() {
        this.bubbles = [];
        const offsetX = this.bubbleRadius;
        const offsetY = this.bubbleRadius;
        const spacing = this.bubbleRadius * 2;
        
        for (let row = 0; row < this.rows; row++) {
            this.bubbles[row] = [];
            for (let col = 0; col < this.cols; col++) {
                // Hexagonal grid offset
                const hexOffset = (row % 2) * this.bubbleRadius;
                const x = offsetX + col * spacing + hexOffset;
                const y = offsetY + row * spacing * 0.866; // sqrt(3)/2 for hexagonal spacing
                
                // Only create bubbles for the first few rows
                if (row < 5) {
                    this.bubbles[row][col] = {
                        x: x,
                        y: y,
                        color: this.colors[Math.floor(Math.random() * this.colors.length)],
                        exists: true,
                        row: row,
                        col: col
                    };
                } else {
                    this.bubbles[row][col] = null;
                }
            }
        }
    }
    
    generateNextBubble() {
        this.shooter.nextBubble = {
            color: this.colors[Math.floor(Math.random() * this.colors.length)],
            x: this.shooter.x + 40,
            y: this.shooter.y
        };
    }
    
    generateCurrentBubble() {
        if (this.shooter.nextBubble) {
            this.shooter.currentBubble = {
                color: this.shooter.nextBubble.color,
                x: this.shooter.x,
                y: this.shooter.y,
                vx: 0,
                vy: 0,
                moving: false
            };
            this.generateNextBubble();
        }
    }
    
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        
        // Touch events for mobile
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleTouchMove(e);
        });
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleTouchStart(e);
        });
        
        // Button events
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        document.getElementById('pauseButton').addEventListener('click', () => this.togglePause());
        document.getElementById('restartButton').addEventListener('click', () => this.restartGame());
        document.getElementById('helpButton').addEventListener('click', () => this.toggleHelp());
        
        // Prevent context menu on canvas
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mousePos.x = e.clientX - rect.left;
        this.mousePos.y = e.clientY - rect.top;
        this.updateShooterAngle();
    }
    
    handleTouchMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        this.mousePos.x = touch.clientX - rect.left;
        this.mousePos.y = touch.clientY - rect.top;
        this.updateShooterAngle();
    }
    
    handleClick(e) {
        if (this.gameState === 'playing' && !this.isShooting) {
            this.shootBubble();
        }
    }
    
    handleTouchStart(e) {
        if (this.gameState === 'playing' && !this.isShooting) {
            this.shootBubble();
        }
    }
    
    updateShooterAngle() {
        if (this.gameState === 'playing') {
            const dx = this.mousePos.x - this.shooter.x;
            const dy = this.mousePos.y - this.shooter.y;
            this.shooter.angle = Math.atan2(dy, dx);
            
            // Limit shooting angle to upward directions
            if (this.shooter.angle > Math.PI / 6) {
                this.shooter.angle = Math.PI / 6;
            } else if (this.shooter.angle < -Math.PI / 6) {
                this.shooter.angle = -Math.PI / 6;
            }
        }
    }
    
    shootBubble() {
        if (!this.shooter.currentBubble || this.isShooting) return;
        
        this.isShooting = true;
        const speed = 8;
        this.shooter.currentBubble.vx = Math.cos(this.shooter.angle) * speed;
        this.shooter.currentBubble.vy = Math.sin(this.shooter.angle) * speed;
        this.shooter.currentBubble.moving = true;
        
        // Track shooting event
        if (typeof gtag !== 'undefined') {
            gtag('event', 'bubble_shot', {
                'game_name': 'color_bubble_match',
                'level': this.level
            });
        }
    }
    
    updateGame(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        this.updateMovingBubble(deltaTime);
        this.checkCollisions();
        this.checkGameEnd();
    }
    
    updateMovingBubble(deltaTime) {
        if (!this.shooter.currentBubble || !this.shooter.currentBubble.moving) return;
        
        const bubble = this.shooter.currentBubble;
        
        // Update position
        bubble.x += bubble.vx;
        bubble.y += bubble.vy;
        
        // Wall collision
        if (bubble.x - this.bubbleRadius <= 0 || bubble.x + this.bubbleRadius >= this.canvas.width) {
            bubble.vx = -bubble.vx;
            bubble.x = Math.max(this.bubbleRadius, Math.min(this.canvas.width - this.bubbleRadius, bubble.x));
        }
        
        // Top collision
        if (bubble.y - this.bubbleRadius <= 0) {
            this.attachBubbleToGrid(bubble);
        }
    }
    
    checkCollisions() {
        if (!this.shooter.currentBubble || !this.shooter.currentBubble.moving) return;
        
        const movingBubble = this.shooter.currentBubble;
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const gridBubble = this.bubbles[row][col];
                if (!gridBubble || !gridBubble.exists) continue;
                
                const dx = movingBubble.x - gridBubble.x;
                const dy = movingBubble.y - gridBubble.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.bubbleRadius * 2) {
                    this.attachBubbleToGrid(movingBubble, row, col);
                    return;
                }
            }
        }
    }
    
    attachBubbleToGrid(bubble, nearRow = null, nearCol = null) {
        let targetRow, targetCol;
        
        if (nearRow !== null && nearCol !== null) {
            // Find the best empty position near the collision
            const positions = this.getAdjacentPositions(nearRow, nearCol);
            let bestPos = null;
            let minDistance = Infinity;
            
            for (const pos of positions) {
                if (pos.row >= 0 && pos.row < this.rows && pos.col >= 0 && pos.col < this.cols) {
                    if (!this.bubbles[pos.row][pos.col] || !this.bubbles[pos.row][pos.col].exists) {
                        const hexOffset = (pos.row % 2) * this.bubbleRadius;
                        const gridX = this.bubbleRadius + pos.col * this.bubbleRadius * 2 + hexOffset;
                        const gridY = this.bubbleRadius + pos.row * this.bubbleRadius * 2 * 0.866;
                        
                        const dx = bubble.x - gridX;
                        const dy = bubble.y - gridY;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        if (distance < minDistance) {
                            minDistance = distance;
                            bestPos = pos;
                        }
                    }
                }
            }
            
            if (bestPos) {
                targetRow = bestPos.row;
                targetCol = bestPos.col;
            } else {
                // Fallback to top row
                targetRow = 0;
                targetCol = Math.floor(bubble.x / (this.bubbleRadius * 2));
            }
        } else {
            // Attach to top
            targetRow = 0;
            targetCol = Math.floor(bubble.x / (this.bubbleRadius * 2));
        }
        
        // Ensure valid position
        targetRow = Math.max(0, Math.min(this.rows - 1, targetRow));
        targetCol = Math.max(0, Math.min(this.cols - 1, targetCol));
        
        // Create bubble in grid
        const hexOffset = (targetRow % 2) * this.bubbleRadius;
        const gridX = this.bubbleRadius + targetCol * this.bubbleRadius * 2 + hexOffset;
        const gridY = this.bubbleRadius + targetRow * this.bubbleRadius * 2 * 0.866;
        
        this.bubbles[targetRow][targetCol] = {
            x: gridX,
            y: gridY,
            color: bubble.color,
            exists: true,
            row: targetRow,
            col: targetCol
        };
        
        // Check for matches
        this.checkMatches(targetRow, targetCol);
        
        // Reset shooter
        this.isShooting = false;
        this.generateCurrentBubble();
        this.bubblesLeft--;
        this.updateUI();
    }
    
    getAdjacentPositions(row, col) {
        const positions = [];
        const isEvenRow = row % 2 === 0;
        
        // Hexagonal grid adjacency
        const offsets = isEvenRow ? [
            [-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]
        ] : [
            [-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]
        ];
        
        for (const [dr, dc] of offsets) {
            positions.push({ row: row + dr, col: col + dc });
        }
        
        return positions;
    }
    
    checkMatches(row, col) {
        const bubble = this.bubbles[row][col];
        if (!bubble || !bubble.exists) return;
        
        const matchedBubbles = this.findConnectedBubbles(row, col, bubble.color);
        
        if (matchedBubbles.length >= 3) {
            // Remove matched bubbles
            for (const pos of matchedBubbles) {
                if (this.bubbles[pos.row][pos.col]) {
                    this.bubbles[pos.row][pos.col].exists = false;
                }
            }
            
            // Add score
            const points = matchedBubbles.length * 10 * this.level;
            this.score += points;
            
            // Remove floating bubbles
            this.removeFloatingBubbles();
            
            // Track match event
            if (typeof gtag !== 'undefined') {
                gtag('event', 'bubbles_matched', {
                    'game_name': 'color_bubble_match',
                    'bubbles_count': matchedBubbles.length,
                    'points': points
                });
            }
        }
    }
    
    findConnectedBubbles(startRow, startCol, color, visited = new Set()) {
        const key = `${startRow},${startCol}`;
        if (visited.has(key)) return [];
        
        const bubble = this.bubbles[startRow][startCol];
        if (!bubble || !bubble.exists || bubble.color !== color) return [];
        
        visited.add(key);
        const connected = [{ row: startRow, col: startCol }];
        
        const adjacent = this.getAdjacentPositions(startRow, startCol);
        for (const pos of adjacent) {
            if (pos.row >= 0 && pos.row < this.rows && pos.col >= 0 && pos.col < this.cols) {
                connected.push(...this.findConnectedBubbles(pos.row, pos.col, color, visited));
            }
        }
        
        return connected;
    }
    
    removeFloatingBubbles() {
        const connected = new Set();
        
        // Find all bubbles connected to the top
        for (let col = 0; col < this.cols; col++) {
            if (this.bubbles[0][col] && this.bubbles[0][col].exists) {
                this.markConnectedBubbles(0, col, connected);
            }
        }
        
        // Remove bubbles not connected to top
        let removedCount = 0;
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const bubble = this.bubbles[row][col];
                if (bubble && bubble.exists && !connected.has(`${row},${col}`)) {
                    bubble.exists = false;
                    removedCount++;
                    this.score += 5 * this.level; // Bonus points for floating bubbles
                }
            }
        }
        
        if (removedCount > 0 && typeof gtag !== 'undefined') {
            gtag('event', 'floating_bubbles_removed', {
                'game_name': 'color_bubble_match',
                'count': removedCount
            });
        }
    }
    
    markConnectedBubbles(row, col, connected) {
        const key = `${row},${col}`;
        if (connected.has(key)) return;
        
        const bubble = this.bubbles[row][col];
        if (!bubble || !bubble.exists) return;
        
        connected.add(key);
        
        const adjacent = this.getAdjacentPositions(row, col);
        for (const pos of adjacent) {
            if (pos.row >= 0 && pos.row < this.rows && pos.col >= 0 && pos.col < this.cols) {
                this.markConnectedBubbles(pos.row, pos.col, connected);
            }
        }
    }
    
    checkGameEnd() {
        // Check if all bubbles are cleared (win)
        let bubblesRemaining = 0;
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.bubbles[row][col] && this.bubbles[row][col].exists) {
                    bubblesRemaining++;
                }
            }
        }
        
        if (bubblesRemaining === 0) {
            this.levelComplete();
            return;
        }
        
        // Check if bubbles reached bottom (lose)
        for (let col = 0; col < this.cols; col++) {
            const bubble = this.bubbles[this.rows - 1][col];
            if (bubble && bubble.exists) {
                this.gameOver();
                return;
            }
        }
        
        // Check if no bubbles left (lose)
        if (this.bubblesLeft <= 0 && !this.isShooting) {
            this.gameOver();
            return;
        }
    }
    
    levelComplete() {
        this.level++;
        this.bubblesLeft = Math.max(3, 8 - this.level); // Fewer bubbles per level
        this.score += 100 * this.level; // Level completion bonus
        
        // Create new level
        this.createBubbleGrid();
        this.generateCurrentBubble();
        this.updateUI();
        
        // Show level complete message
        this.showOverlay('Level Complete!', `Congratulations on completing level ${this.level - 1}!`, 'Continue Game', () => {
            this.hideOverlay();
        });
        
        if (typeof gtag !== 'undefined') {
            gtag('event', 'level_complete', {
                'game_name': 'color_bubble_match',
                'level': this.level - 1
            });
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.showOverlay('Game Over', `Final Score: ${this.score}\nLevel Reached: ${this.level}`, 'Restart', () => {
            this.restartGame();
        });
        
        if (typeof gtag !== 'undefined') {
            gtag('event', 'game_over', {
                'game_name': 'color_bubble_match',
                'score': this.score,
                'level': this.level
            });
        }
    }
    
    startGame() {
        this.gameState = 'playing';
        this.hideOverlay();
        this.startGameLoop();
        
        if (typeof gtag !== 'undefined') {
            gtag('event', 'game_start', {
                'game_name': 'color_bubble_match'
            });
        }
    }
    
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.showOverlay('Game Paused', 'Click continue button to resume game', 'Continue Game', () => {
                this.gameState = 'playing';
                this.hideOverlay();
            });
        }
    }
    
    restartGame() {
        this.gameState = 'menu';
        this.score = 0;
        this.level = 1;
        this.bubblesLeft = 5;
        this.isShooting = false;
        
        this.initializeGame();
        this.showOverlay('Color Bubble Match', 'Click start button to begin the game', 'Start Game', () => {
            this.startGame();
        });
    }
    
    toggleHelp() {
        const instructions = document.getElementById('gameInstructions');
        instructions.style.display = instructions.style.display === 'none' ? 'block' : 'none';
    }
    
    showOverlay(title, message, buttonText, callback) {
        document.getElementById('overlayTitle').textContent = title;
        document.getElementById('overlayMessage').textContent = message;
        const button = document.getElementById('startButton');
        button.textContent = buttonText;
        button.onclick = callback;
        this.overlay.style.display = 'flex';
    }
    
    hideOverlay() {
        this.overlay.style.display = 'none';
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('bubbles-left').textContent = this.bubblesLeft;
    }
    
    startGameLoop() {
        const gameLoop = (currentTime) => {
            const deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;
            
            this.updateGame(deltaTime);
            this.render();
            
            if (this.gameState === 'playing') {
                this.animationId = requestAnimationFrame(gameLoop);
            }
        };
        
        this.animationId = requestAnimationFrame(gameLoop);
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid bubbles
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const bubble = this.bubbles[row][col];
                if (bubble && bubble.exists) {
                    this.drawBubble(bubble.x, bubble.y, bubble.color);
                }
            }
        }
        
        // Draw shooter
        this.drawShooter();
        
        // Draw current bubble
        if (this.shooter.currentBubble) {
            this.drawBubble(
                this.shooter.currentBubble.x,
                this.shooter.currentBubble.y,
                this.shooter.currentBubble.color
            );
        }
        
        // Draw next bubble
        if (this.shooter.nextBubble) {
            this.drawBubble(
                this.shooter.nextBubble.x,
                this.shooter.nextBubble.y,
                this.shooter.nextBubble.color,
                0.7
            );
        }
        
        // Draw aim line
        if (this.gameState === 'playing' && !this.isShooting) {
            this.drawAimLine();
        }
    }
    
    drawBubble(x, y, color, alpha = 1) {
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        
        // Bubble shadow
        this.ctx.beginPath();
        this.ctx.arc(x + 2, y + 2, this.bubbleRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fill();
        
        // Bubble
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.bubbleRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.fill();
        
        // Bubble highlight
        const gradient = this.ctx.createRadialGradient(
            x - this.bubbleRadius * 0.3,
            y - this.bubbleRadius * 0.3,
            0,
            x,
            y,
            this.bubbleRadius
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        // Bubble border
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.bubbleRadius, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    drawShooter() {
        const x = this.shooter.x;
        const y = this.shooter.y;
        
        // Shooter base
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.bubbleRadius + 5, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }
    
    drawAimLine() {
        const startX = this.shooter.x;
        const startY = this.shooter.y;
        const length = 100;
        const endX = startX + Math.cos(this.shooter.angle) * length;
        const endY = startY + Math.sin(this.shooter.angle) * length;
        
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([10, 5]);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
}

// Global game instance
let game;

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    game = new ColorBubbleMatch();
});

// Handle window resize
window.addEventListener('resize', () => {
    if (game) {
        // Adjust canvas size for mobile
        const canvas = game.canvas;
        const container = canvas.parentElement;
        const maxWidth = Math.min(400, container.clientWidth - 20);
        const aspectRatio = canvas.height / canvas.width;
        
        canvas.style.width = maxWidth + 'px';
        canvas.style.height = (maxWidth * aspectRatio) + 'px';
    }
});

// Prevent zoom on double tap for mobile
document.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
});

let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Visibility change handling
document.addEventListener('visibilitychange', () => {
    if (game && game.gameState === 'playing' && document.hidden) {
        game.togglePause();
    }
});