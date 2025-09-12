class TetrisGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        // Game state
        this.board = [];
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.isGameOver = false;
        this.isPaused = false;
        this.dropTime = 0;
        this.dropInterval = 1000;
        
        // Board dimensions
        this.boardWidth = 10;
        this.boardHeight = 20;
        this.cellSize = 30;
        
        // Tetris pieces (tetrominoes)
        this.pieces = {
            I: {
                shape: [
                    [1, 1, 1, 1]
                ],
                color: '#00f5ff'
            },
            O: {
                shape: [
                    [1, 1],
                    [1, 1]
                ],
                color: '#ffff00'
            },
            T: {
                shape: [
                    [0, 1, 0],
                    [1, 1, 1]
                ],
                color: '#800080'
            },
            S: {
                shape: [
                    [0, 1, 1],
                    [1, 1, 0]
                ],
                color: '#00ff00'
            },
            Z: {
                shape: [
                    [1, 1, 0],
                    [0, 1, 1]
                ],
                color: '#ff0000'
            },
            J: {
                shape: [
                    [1, 0, 0],
                    [1, 1, 1]
                ],
                color: '#0000ff'
            },
            L: {
                shape: [
                    [0, 0, 1],
                    [1, 1, 1]
                ],
                color: '#ffa500'
            }
        };
        
        this.pieceTypes = Object.keys(this.pieces);
        
        this.init();
    }
    
    init() {
        this.initBoard();
        this.setupEventListeners();
        this.spawnPiece();
        this.spawnNextPiece();
        this.gameLoop();
        this.updateUI();
    }
    
    initBoard() {
        this.board = [];
        for (let y = 0; y < this.boardHeight; y++) {
            this.board[y] = [];
            for (let x = 0; x < this.boardWidth; x++) {
                this.board[y][x] = 0;
            }
        }
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Mobile controls
        document.getElementById('leftBtn').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.movePiece(-1, 0);
        });
        
        document.getElementById('rightBtn').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.movePiece(1, 0);
        });
        
        document.getElementById('downBtn').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.movePiece(0, 1);
        });
        
        document.getElementById('rotateBtn').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.rotatePiece();
        });
        
        // Control buttons
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('restartBtn').addEventListener('click', () => this.restart());
        document.getElementById('dropBtn').addEventListener('click', () => this.hardDrop());
        
        // Prevent scrolling on mobile
        document.addEventListener('touchmove', (e) => {
            if (e.target.closest('.mobile-controls')) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Handle visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && !this.isPaused && !this.isGameOver) {
                this.togglePause();
            }
        });
    }
    
    handleKeyPress(e) {
        if (this.isGameOver || this.isPaused) return;
        
        switch (e.code) {
            case 'ArrowLeft':
                this.movePiece(-1, 0);
                break;
            case 'ArrowRight':
                this.movePiece(1, 0);
                break;
            case 'ArrowDown':
                this.movePiece(0, 1);
                break;
            case 'ArrowUp':
            case 'Space':
                e.preventDefault();
                if (e.code === 'Space') {
                    this.hardDrop();
                } else {
                    this.rotatePiece();
                }
                break;
            case 'KeyP':
                this.togglePause();
                break;
            case 'KeyR':
                this.restart();
                break;
        }
    }
    
    spawnPiece() {
        if (this.nextPiece) {
            this.currentPiece = this.nextPiece;
        } else {
            const randomType = this.pieceTypes[Math.floor(Math.random() * this.pieceTypes.length)];
            this.currentPiece = {
                type: randomType,
                shape: this.pieces[randomType].shape,
                color: this.pieces[randomType].color,
                x: Math.floor(this.boardWidth / 2) - Math.floor(this.pieces[randomType].shape[0].length / 2),
                y: 0
            };
        }
        
        // Check for game over
        if (this.checkCollision(this.currentPiece, 0, 0)) {
            this.gameOver();
        }
    }
    
    spawnNextPiece() {
        const randomType = this.pieceTypes[Math.floor(Math.random() * this.pieceTypes.length)];
        this.nextPiece = {
            type: randomType,
            shape: this.pieces[randomType].shape,
            color: this.pieces[randomType].color,
            x: Math.floor(this.boardWidth / 2) - Math.floor(this.pieces[randomType].shape[0].length / 2),
            y: 0
        };
        
        this.drawNextPiece();
    }
    
    movePiece(dx, dy) {
        if (!this.currentPiece || this.isGameOver || this.isPaused) return;
        
        if (!this.checkCollision(this.currentPiece, dx, dy)) {
            this.currentPiece.x += dx;
            this.currentPiece.y += dy;
            
            if (dy > 0) {
                this.score += 1; // Bonus for soft drop
            }
        } else if (dy > 0) {
            // Piece has landed
            this.placePiece();
            this.clearLines();
            this.spawnPiece();
            this.spawnNextPiece();
        }
    }
    
    rotatePiece() {
        if (!this.currentPiece || this.isGameOver || this.isPaused) return;
        
        const rotated = this.rotateMatrix(this.currentPiece.shape);
        const originalShape = this.currentPiece.shape;
        
        this.currentPiece.shape = rotated;
        
        // Wall kick - try to adjust position if rotation causes collision
        const kicks = [0, -1, 1, -2, 2];
        let canRotate = false;
        
        for (let kick of kicks) {
            if (!this.checkCollision(this.currentPiece, kick, 0)) {
                this.currentPiece.x += kick;
                canRotate = true;
                break;
            }
        }
        
        if (!canRotate) {
            this.currentPiece.shape = originalShape;
        }
    }
    
    rotateMatrix(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const rotated = [];
        
        for (let i = 0; i < cols; i++) {
            rotated[i] = [];
            for (let j = 0; j < rows; j++) {
                rotated[i][j] = matrix[rows - 1 - j][i];
            }
        }
        
        return rotated;
    }
    
    hardDrop() {
        if (!this.currentPiece || this.isGameOver || this.isPaused) return;
        
        let dropDistance = 0;
        while (!this.checkCollision(this.currentPiece, 0, dropDistance + 1)) {
            dropDistance++;
        }
        
        this.currentPiece.y += dropDistance;
        this.score += dropDistance * 2; // Bonus for hard drop
        
        this.placePiece();
        this.clearLines();
        this.spawnPiece();
        this.spawnNextPiece();
    }
    
    checkCollision(piece, dx, dy) {
        const newX = piece.x + dx;
        const newY = piece.y + dy;
        
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const boardX = newX + x;
                    const boardY = newY + y;
                    
                    // Check boundaries
                    if (boardX < 0 || boardX >= this.boardWidth || 
                        boardY >= this.boardHeight) {
                        return true;
                    }
                    
                    // Check collision with placed pieces
                    if (boardY >= 0 && this.board[boardY][boardX]) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    placePiece() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const boardX = this.currentPiece.x + x;
                    const boardY = this.currentPiece.y + y;
                    
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let y = this.boardHeight - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                // Line is full, remove it
                this.board.splice(y, 1);
                this.board.unshift(new Array(this.boardWidth).fill(0));
                linesCleared++;
                y++; // Check the same line again
            }
        }
        
        if (linesCleared > 0) {
            // Calculate score based on lines cleared
            const lineScores = [0, 100, 300, 500, 800];
            this.score += lineScores[linesCleared] * this.level;
            this.lines += linesCleared;
            
            // Level up every 10 lines
            const newLevel = Math.floor(this.lines / 10) + 1;
            if (newLevel > this.level) {
                this.level = newLevel;
                this.dropInterval = Math.max(50, 1000 - (this.level - 1) * 50);
            }
            
            // Line clear animation
            this.animateLineClear();
        }
    }
    
    animateLineClear() {
        // Simple flash effect
        this.canvas.style.filter = 'brightness(1.5)';
        setTimeout(() => {
            this.canvas.style.filter = 'brightness(1)';
        }, 200);
    }
    
    gameLoop() {
        if (this.isGameOver) return;
        
        if (!this.isPaused) {
            this.dropTime += 16; // Assuming 60 FPS
            
            if (this.dropTime >= this.dropInterval) {
                this.movePiece(0, 1);
                this.dropTime = 0;
            }
        }
        
        this.draw();
        this.updateUI();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#2d3748';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.drawGrid();
        
        // Draw placed pieces
        this.drawBoard();
        
        // Draw current piece
        if (this.currentPiece) {
            this.drawPiece(this.currentPiece);
        }
        
        // Draw ghost piece
        if (this.currentPiece && !this.isPaused) {
            this.drawGhostPiece();
        }
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#4a5568';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x <= this.boardWidth; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.cellSize, 0);
            this.ctx.lineTo(x * this.cellSize, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.boardHeight; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.cellSize);
            this.ctx.lineTo(this.canvas.width, y * this.cellSize);
            this.ctx.stroke();
        }
    }
    
    drawBoard() {
        for (let y = 0; y < this.boardHeight; y++) {
            for (let x = 0; x < this.boardWidth; x++) {
                if (this.board[y][x]) {
                    this.drawCell(x, y, this.board[y][x]);
                }
            }
        }
    }
    
    drawPiece(piece) {
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    this.drawCell(piece.x + x, piece.y + y, piece.color);
                }
            }
        }
    }
    
    drawGhostPiece() {
        let ghostY = this.currentPiece.y;
        while (!this.checkCollision(this.currentPiece, 0, ghostY - this.currentPiece.y + 1)) {
            ghostY++;
        }
        
        this.ctx.globalAlpha = 0.3;
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    this.drawCell(this.currentPiece.x + x, ghostY + y, this.currentPiece.color);
                }
            }
        }
        this.ctx.globalAlpha = 1;
    }
    
    drawCell(x, y, color) {
        const pixelX = x * this.cellSize;
        const pixelY = y * this.cellSize;
        
        // Draw cell background
        this.ctx.fillStyle = color;
        this.ctx.fillRect(pixelX + 1, pixelY + 1, this.cellSize - 2, this.cellSize - 2);
        
        // Draw cell border for 3D effect
        this.ctx.fillStyle = this.lightenColor(color, 20);
        this.ctx.fillRect(pixelX + 1, pixelY + 1, this.cellSize - 2, 3);
        this.ctx.fillRect(pixelX + 1, pixelY + 1, 3, this.cellSize - 2);
        
        this.ctx.fillStyle = this.darkenColor(color, 20);
        this.ctx.fillRect(pixelX + this.cellSize - 4, pixelY + 1, 3, this.cellSize - 2);
        this.ctx.fillRect(pixelX + 1, pixelY + this.cellSize - 4, this.cellSize - 2, 3);
    }
    
    drawNextPiece() {
        // Clear next canvas
        this.nextCtx.fillStyle = '#2d3748';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        if (this.nextPiece) {
            const cellSize = 15;
            const offsetX = (this.nextCanvas.width - this.nextPiece.shape[0].length * cellSize) / 2;
            const offsetY = (this.nextCanvas.height - this.nextPiece.shape.length * cellSize) / 2;
            
            for (let y = 0; y < this.nextPiece.shape.length; y++) {
                for (let x = 0; x < this.nextPiece.shape[y].length; x++) {
                    if (this.nextPiece.shape[y][x]) {
                        this.nextCtx.fillStyle = this.nextPiece.color;
                        this.nextCtx.fillRect(
                            offsetX + x * cellSize,
                            offsetY + y * cellSize,
                            cellSize - 1,
                            cellSize - 1
                        );
                    }
                }
            }
        }
    }
    
    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }
    
    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return '#' + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
            (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
            (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score.toLocaleString();
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
        
        const pauseBtn = document.getElementById('pauseBtn');
        pauseBtn.textContent = this.isPaused ? '▶️ 继续' : '⏸️ 暂停';
    }
    
    togglePause() {
        if (this.isGameOver) return;
        
        this.isPaused = !this.isPaused;
        this.updateUI();
        
        if (this.isPaused) {
            // Show pause overlay
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('游戏暂停', this.canvas.width / 2, this.canvas.height / 2);
        }
    }
    
    gameOver() {
        this.isGameOver = true;
        
        // Save high score
        const highScore = localStorage.getItem('tetris-high-score') || 0;
        if (this.score > highScore) {
            localStorage.setItem('tetris-high-score', this.score);
        }
        
        // Show game over screen
        document.getElementById('finalScore').textContent = this.score.toLocaleString();
        document.getElementById('finalLines').textContent = this.lines;
        document.getElementById('gameOver').style.display = 'flex';
    }
    
    restart() {
        this.isGameOver = false;
        this.isPaused = false;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.dropTime = 0;
        this.dropInterval = 1000;
        
        document.getElementById('gameOver').style.display = 'none';
        
        this.initBoard();
        this.spawnPiece();
        this.spawnNextPiece();
        this.updateUI();
    }
}

// Global game instance
let game;

// Initialize game when page loads
window.addEventListener('load', () => {
    game = new TetrisGame();
});

// Handle window resize
window.addEventListener('resize', () => {
    // Adjust canvas size for mobile
    const canvas = document.getElementById('gameCanvas');
    const container = document.querySelector('.game-board');
    
    if (window.innerWidth < 480) {
        container.style.transform = 'scale(0.8)';
    } else if (window.innerWidth < 768) {
        container.style.transform = 'scale(0.9)';
    } else {
        container.style.transform = 'scale(1)';
    }
});

// Trigger initial resize
window.dispatchEvent(new Event('resize'));