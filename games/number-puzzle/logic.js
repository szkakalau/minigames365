class NumberPuzzle {
    constructor() {
        this.size = 4; // Default 4x4 puzzle
        this.board = [];
        this.emptyPos = { row: 0, col: 0 };
        this.gameTime = 0;
        this.gameTimer = null;
        this.moveCount = 0;
        this.isGameActive = false;
        this.isAnimating = false;
        
        this.initializeGame();
        this.loadBestTimes();
    }
    
    initializeGame() {
        this.createSolvedBoard();
        this.shuffle();
        this.renderBoard();
        this.startTimer();
        this.isGameActive = true;
        this.updateDisplay();
    }
    
    createSolvedBoard() {
        this.board = [];
        let num = 1;
        
        for (let row = 0; row < this.size; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.size; col++) {
                if (row === this.size - 1 && col === this.size - 1) {
                    this.board[row][col] = 0; // Empty space
                    this.emptyPos = { row, col };
                } else {
                    this.board[row][col] = num++;
                }
            }
        }
    }
    
    shuffle() {
        // Perform random valid moves to ensure solvability
        const moves = this.size * this.size * 100;
        
        for (let i = 0; i < moves; i++) {
            const validMoves = this.getValidMoves();
            if (validMoves.length > 0) {
                const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
                this.moveTile(randomMove.row, randomMove.col, false);
            }
        }
        
        this.moveCount = 0;
        this.gameTime = 0;
    }
    
    getValidMoves() {
        const moves = [];
        const { row, col } = this.emptyPos;
        
        // Check all four directions
        const directions = [
            { row: row - 1, col: col }, // Up
            { row: row + 1, col: col }, // Down
            { row: row, col: col - 1 }, // Left
            { row: row, col: col + 1 }  // Right
        ];
        
        directions.forEach(pos => {
            if (this.isValidPosition(pos.row, pos.col)) {
                moves.push(pos);
            }
        });
        
        return moves;
    }
    
    isValidPosition(row, col) {
        return row >= 0 && row < this.size && col >= 0 && col < this.size;
    }
    
    moveTile(row, col, countMove = true) {
        if (!this.isGameActive || this.isAnimating) return false;
        
        const { row: emptyRow, col: emptyCol } = this.emptyPos;
        
        // Check if the clicked tile is adjacent to empty space
        const isAdjacent = 
            (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
            (Math.abs(col - emptyCol) === 1 && row === emptyRow);
        
        if (!isAdjacent) return false;
        
        // Swap tile with empty space
        this.board[emptyRow][emptyCol] = this.board[row][col];
        this.board[row][col] = 0;
        this.emptyPos = { row, col };
        
        if (countMove) {
            this.moveCount++;
            this.updateDisplay();
        }
        
        return true;
    }
    
    handleTileClick(row, col) {
        if (this.moveTile(row, col)) {
            this.animateTileMove(row, col);
            
            setTimeout(() => {
                this.renderBoard();
                this.checkWinCondition();
            }, 200);
        }
    }
    
    animateTileMove(row, col) {
        const tileElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (tileElement) {
            this.isAnimating = true;
            tileElement.classList.add('moving');
            
            setTimeout(() => {
                tileElement.classList.remove('moving');
                this.isAnimating = false;
            }, 200);
        }
    }
    
    renderBoard() {
        const boardElement = document.getElementById('puzzleBoard');
        boardElement.innerHTML = '';
        
        // Set grid size
        boardElement.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;
        boardElement.style.gridTemplateRows = `repeat(${this.size}, 1fr)`;
        
        // Calculate tile size based on container
        const tileSize = Math.min(300 / this.size, 80);
        boardElement.style.width = `${tileSize * this.size + (this.size + 1) * 3}px`;
        boardElement.style.height = `${tileSize * this.size + (this.size + 1) * 3}px`;
        
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const tileElement = document.createElement('div');
                tileElement.className = 'tile';
                tileElement.style.width = `${tileSize}px`;
                tileElement.style.height = `${tileSize}px`;
                tileElement.setAttribute('data-row', row);
                tileElement.setAttribute('data-col', col);
                
                const value = this.board[row][col];
                
                if (value === 0) {
                    tileElement.classList.add('empty');
                } else {
                    tileElement.textContent = value;
                    tileElement.addEventListener('click', () => this.handleTileClick(row, col));
                    
                    // Add touch support
                    tileElement.addEventListener('touchend', (e) => {
                        e.preventDefault();
                        this.handleTileClick(row, col);
                    });
                }
                
                boardElement.appendChild(tileElement);
            }
        }
    }
    
    checkWinCondition() {
        let expectedValue = 1;
        
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (row === this.size - 1 && col === this.size - 1) {
                    // Last position should be empty
                    if (this.board[row][col] !== 0) return false;
                } else {
                    if (this.board[row][col] !== expectedValue) return false;
                    expectedValue++;
                }
            }
        }
        
        // Puzzle solved!
        this.isGameActive = false;
        this.stopTimer();
        this.saveBestTime();
        
        setTimeout(() => {
            this.showWinMessage();
        }, 300);
        
        return true;
    }
    
    showWinMessage() {
        const timeStr = this.formatTime(this.gameTime);
        const message = `🎉 Congratulations!\n\nPuzzle solved in:\n⏱️ Time: ${timeStr}\n🔄 Moves: ${this.moveCount}\n\nWell done!`;
        alert(message);
    }
    
    setDifficulty(newSize) {
        if (newSize === this.size) return;
        
        this.size = newSize;
        this.stopTimer();
        this.gameTime = 0;
        this.moveCount = 0;
        
        // Update difficulty button states
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        this.initializeGame();
        this.updateBestTimeDisplay();
    }
    
    newGame() {
        this.stopTimer();
        this.gameTime = 0;
        this.moveCount = 0;
        this.initializeGame();
    }
    
    solve() {
        if (!this.isGameActive) return;
        
        this.stopTimer();
        this.createSolvedBoard();
        this.renderBoard();
        this.isGameActive = false;
        
        setTimeout(() => {
            alert('🎯 Puzzle solved automatically!');
        }, 300);
    }
    
    startTimer() {
        this.gameTimer = setInterval(() => {
            this.gameTime++;
            this.updateDisplay();
        }, 1000);
    }
    
    stopTimer() {
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    updateDisplay() {
        document.getElementById('timeDisplay').textContent = this.formatTime(this.gameTime);
        document.getElementById('moveCount').textContent = this.moveCount;
    }
    
    saveBestTime() {
        const key = `numberPuzzle_best_${this.size}x${this.size}`;
        const currentBest = localStorage.getItem(key);
        
        if (!currentBest || this.gameTime < parseInt(currentBest)) {
            localStorage.setItem(key, this.gameTime.toString());
            this.updateBestTimeDisplay();
        }
    }
    
    loadBestTimes() {
        this.updateBestTimeDisplay();
    }
    
    updateBestTimeDisplay() {
        const key = `numberPuzzle_best_${this.size}x${this.size}`;
        const bestTime = localStorage.getItem(key);
        
        if (bestTime) {
            document.getElementById('bestTime').textContent = this.formatTime(parseInt(bestTime));
        } else {
            document.getElementById('bestTime').textContent = '--:--';
        }
    }
    
    // Auto-solver using A* algorithm (simplified)
    autoSolve() {
        if (!this.isGameActive) return;
        
        const solution = this.findSolution();
        if (solution.length === 0) {
            alert('No solution found!');
            return;
        }
        
        this.executeSolution(solution);
    }
    
    findSolution() {
        // Simplified solver - just return random valid moves for demo
        // In a real implementation, you'd use A* or IDA* algorithm
        const moves = [];
        const maxMoves = 20;
        
        for (let i = 0; i < maxMoves; i++) {
            const validMoves = this.getValidMoves();
            if (validMoves.length > 0) {
                const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
                moves.push(randomMove);
            }
        }
        
        return moves;
    }
    
    executeSolution(moves) {
        let moveIndex = 0;
        
        const executeNextMove = () => {
            if (moveIndex >= moves.length || !this.isGameActive) return;
            
            const move = moves[moveIndex];
            this.handleTileClick(move.row, move.col);
            moveIndex++;
            
            setTimeout(executeNextMove, 500);
        };
        
        executeNextMove();
    }
    
    // Keyboard support
    handleKeyPress(event) {
        if (!this.isGameActive) return;
        
        const { row, col } = this.emptyPos;
        let targetRow = row;
        let targetCol = col;
        
        switch (event.key) {
            case 'ArrowUp':
                targetRow = row + 1; // Move tile from below
                break;
            case 'ArrowDown':
                targetRow = row - 1; // Move tile from above
                break;
            case 'ArrowLeft':
                targetCol = col + 1; // Move tile from right
                break;
            case 'ArrowRight':
                targetCol = col - 1; // Move tile from left
                break;
            default:
                return;
        }
        
        if (this.isValidPosition(targetRow, targetCol)) {
            event.preventDefault();
            this.handleTileClick(targetRow, targetCol);
        }
    }
}

// Add keyboard event listener
document.addEventListener('keydown', (event) => {
    if (window.game) {
        window.game.handleKeyPress(event);
    }
});

// Touch gesture support for mobile
document.addEventListener('DOMContentLoaded', () => {
    let touchStartX, touchStartY;
    let touchStartTime;
    
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
    });
    
    document.addEventListener('touchend', (e) => {
        if (!touchStartX || !touchStartY || !window.game) return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const touchDuration = Date.now() - touchStartTime;
        
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Swipe gesture detection
        if (distance > 50 && touchDuration < 300) {
            const { row, col } = window.game.emptyPos;
            let targetRow = row;
            let targetCol = col;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (deltaX > 0) {
                    targetCol = col - 1; // Swipe right, move tile from left
                } else {
                    targetCol = col + 1; // Swipe left, move tile from right
                }
            } else {
                // Vertical swipe
                if (deltaY > 0) {
                    targetRow = row - 1; // Swipe down, move tile from above
                } else {
                    targetRow = row + 1; // Swipe up, move tile from below
                }
            }
            
            if (window.game.isValidPosition(targetRow, targetCol)) {
                e.preventDefault();
                window.game.handleTileClick(targetRow, targetCol);
            }
        }
        
        touchStartX = null;
        touchStartY = null;
        touchStartTime = null;
    });
});