class NumberSlidePuzzle {
    constructor() {
        this.board = [];
        this.size = 4;
        this.emptyPos = { row: 3, col: 3 };
        this.moves = 0;
        this.startTime = null;
        this.timerInterval = null;
        this.isGameActive = false;
        
        this.initializeGame();
        this.setupEventListeners();
    }
    
    initializeGame() {
        this.createBoard();
        this.renderBoard();
        this.shufflePuzzle();
    }
    
    createBoard() {
        this.board = [];
        for (let i = 0; i < this.size; i++) {
            this.board[i] = [];
            for (let j = 0; j < this.size; j++) {
                const value = i * this.size + j + 1;
                this.board[i][j] = value === 16 ? 0 : value;
            }
        }
        this.emptyPos = { row: 3, col: 3 };
    }
    
    renderBoard() {
        const gameBoard = document.getElementById('gameBoard');
        gameBoard.innerHTML = '';
        
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.dataset.row = i;
                tile.dataset.col = j;
                
                if (this.board[i][j] === 0) {
                    tile.classList.add('empty');
                    tile.textContent = '';
                } else {
                    tile.textContent = this.board[i][j];
                    tile.addEventListener('click', () => this.handleTileClick(i, j));
                    
                    // Touch events for mobile
                    tile.addEventListener('touchstart', (e) => {
                        e.preventDefault();
                        this.handleTileClick(i, j);
                    });
                }
                
                gameBoard.appendChild(tile);
            }
        }
    }
    
    handleTileClick(row, col) {
        if (!this.isGameActive) {
            this.startGame();
        }
        
        if (this.canMoveTile(row, col)) {
            this.moveTile(row, col);
            this.moves++;
            this.updateMoves();
            
            if (this.checkWin()) {
                this.endGame();
            }
        }
    }
    
    canMoveTile(row, col) {
        const emptyRow = this.emptyPos.row;
        const emptyCol = this.emptyPos.col;
        
        return (
            (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
            (Math.abs(col - emptyCol) === 1 && row === emptyRow)
        );
    }
    
    moveTile(row, col) {
        const emptyRow = this.emptyPos.row;
        const emptyCol = this.emptyPos.col;
        
        // Swap tile with empty space
        this.board[emptyRow][emptyCol] = this.board[row][col];
        this.board[row][col] = 0;
        
        // Update empty position
        this.emptyPos = { row, col };
        
        this.renderBoard();
    }
    
    shufflePuzzle() {
        // Reset to solved state first
        this.createBoard();
        
        // Perform random valid moves to shuffle
        const shuffleMoves = 1000;
        for (let i = 0; i < shuffleMoves; i++) {
            const possibleMoves = this.getPossibleMoves();
            const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
            this.moveTileQuiet(randomMove.row, randomMove.col);
        }
        
        this.renderBoard();
        this.resetStats();
    }
    
    getPossibleMoves() {
        const moves = [];
        const emptyRow = this.emptyPos.row;
        const emptyCol = this.emptyPos.col;
        
        // Check all four directions
        const directions = [
            { row: -1, col: 0 }, // Up
            { row: 1, col: 0 },  // Down
            { row: 0, col: -1 }, // Left
            { row: 0, col: 1 }   // Right
        ];
        
        directions.forEach(dir => {
            const newRow = emptyRow + dir.row;
            const newCol = emptyCol + dir.col;
            
            if (newRow >= 0 && newRow < this.size && newCol >= 0 && newCol < this.size) {
                moves.push({ row: newRow, col: newCol });
            }
        });
        
        return moves;
    }
    
    moveTileQuiet(row, col) {
        const emptyRow = this.emptyPos.row;
        const emptyCol = this.emptyPos.col;
        
        this.board[emptyRow][emptyCol] = this.board[row][col];
        this.board[row][col] = 0;
        this.emptyPos = { row, col };
    }
    
    checkWin() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const expectedValue = i * this.size + j + 1;
                if (i === 3 && j === 3) {
                    // Last position should be empty (0)
                    if (this.board[i][j] !== 0) return false;
                } else {
                    if (this.board[i][j] !== expectedValue) return false;
                }
            }
        }
        return true;
    }
    
    startGame() {
        if (!this.isGameActive) {
            this.isGameActive = true;
            this.startTime = Date.now();
            this.startTimer();
        }
    }
    
    endGame() {
        this.isGameActive = false;
        this.stopTimer();
        
        // Show win message
        const winMessage = document.getElementById('winMessage');
        winMessage.style.display = 'block';
        
        // Track game completion event
        if (typeof gtag !== 'undefined') {
            gtag('event', 'game_complete', {
                'game_name': 'number_slide_puzzle',
                'moves': this.moves,
                'time': this.getElapsedTime()
            });
        }
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.updateTimer();
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    updateTimer() {
        if (this.startTime) {
            const elapsed = this.getElapsedTime();
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            document.getElementById('time').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    getElapsedTime() {
        return Math.floor((Date.now() - this.startTime) / 1000);
    }
    
    updateMoves() {
        document.getElementById('moves').textContent = this.moves;
    }
    
    resetStats() {
        this.moves = 0;
        this.startTime = null;
        this.isGameActive = false;
        this.stopTimer();
        
        document.getElementById('moves').textContent = '0';
        document.getElementById('time').textContent = '00:00';
        document.getElementById('winMessage').style.display = 'none';
    }
    
    newGame() {
        this.resetStats();
        this.shufflePuzzle();
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!this.isGameActive) return;
            
            const emptyRow = this.emptyPos.row;
            const emptyCol = this.emptyPos.col;
            let targetRow = emptyRow;
            let targetCol = emptyCol;
            
            switch (e.key) {
                case 'ArrowUp':
                    targetRow = emptyRow + 1;
                    break;
                case 'ArrowDown':
                    targetRow = emptyRow - 1;
                    break;
                case 'ArrowLeft':
                    targetCol = emptyCol + 1;
                    break;
                case 'ArrowRight':
                    targetCol = emptyCol - 1;
                    break;
                default:
                    return;
            }
            
            if (targetRow >= 0 && targetRow < this.size && 
                targetCol >= 0 && targetCol < this.size) {
                e.preventDefault();
                this.handleTileClick(targetRow, targetCol);
            }
        });
    }
}

// Global game instance
let game;

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    game = new NumberSlidePuzzle();
});

// Global functions for buttons
function newGame() {
    if (game) {
        game.newGame();
    }
}

function shufflePuzzle() {
    if (game) {
        game.shufflePuzzle();
    }
}

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

// Track game start event
if (typeof gtag !== 'undefined') {
    gtag('event', 'game_start', {
        'game_name': 'number_slide_puzzle'
    });
}