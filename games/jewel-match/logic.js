class JewelMatch {
    constructor() {
        this.board = [];
        this.boardSize = 8;
        this.jewelTypes = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
        this.jewelSymbols = ['💎', '🔷', '💚', '⭐', '🔮', '🧡'];
        this.score = 0;
        this.moves = 30;
        this.level = 1;
        this.selectedJewel = null;
        this.gameOver = false;
        this.targetScore = 1000;
        
        this.init();
    }
    
    init() {
        this.createBoard();
        this.renderBoard();
        this.updateDisplay();
    }
    
    createBoard() {
        this.board = [];
        for (let row = 0; row < this.boardSize; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.boardSize; col++) {
                let jewelType;
                do {
                    jewelType = Math.floor(Math.random() * this.jewelTypes.length);
                } while (this.wouldCreateMatch(row, col, jewelType));
                
                this.board[row][col] = jewelType;
            }
        }
        
        // Ensure there are possible moves
        if (!this.hasPossibleMoves()) {
            this.shuffleBoard();
        }
    }
    
    wouldCreateMatch(row, col, jewelType) {
        // Check horizontal match
        let horizontalCount = 1;
        if (col > 0 && this.board[row][col - 1] === jewelType) horizontalCount++;
        if (col > 1 && this.board[row][col - 2] === jewelType) horizontalCount++;
        
        // Check vertical match
        let verticalCount = 1;
        if (row > 0 && this.board[row - 1][col] === jewelType) verticalCount++;
        if (row > 1 && this.board[row - 2][col] === jewelType) verticalCount++;
        
        return horizontalCount >= 3 || verticalCount >= 3;
    }
    
    renderBoard() {
        const gameBoard = document.getElementById('gameBoard');
        gameBoard.innerHTML = '';
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const jewel = document.createElement('div');
                jewel.className = `jewel ${this.jewelTypes[this.board[row][col]]}`;
                jewel.textContent = this.jewelSymbols[this.board[row][col]];
                jewel.dataset.row = row;
                jewel.dataset.col = col;
                jewel.addEventListener('click', () => this.handleJewelClick(row, col));
                gameBoard.appendChild(jewel);
            }
        }
    }
    
    handleJewelClick(row, col) {
        if (this.gameOver) return;
        
        const clickedJewel = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        
        if (this.selectedJewel === null) {
            this.selectedJewel = { row, col };
            clickedJewel.classList.add('selected');
        } else {
            const prevSelected = document.querySelector('.jewel.selected');
            if (prevSelected) prevSelected.classList.remove('selected');
            
            if (this.selectedJewel.row === row && this.selectedJewel.col === col) {
                this.selectedJewel = null;
                return;
            }
            
            if (this.areAdjacent(this.selectedJewel.row, this.selectedJewel.col, row, col)) {
                this.swapJewels(this.selectedJewel.row, this.selectedJewel.col, row, col);
                
                if (this.checkForMatches()) {
                    this.moves--;
                    this.processMatches();
                    this.updateDisplay();
                    
                    if (this.moves <= 0) {
                        this.endGame();
                    } else if (this.score >= this.targetScore) {
                        this.nextLevel();
                    }
                } else {
                    // Swap back if no matches
                    this.swapJewels(row, col, this.selectedJewel.row, this.selectedJewel.col);
                    this.renderBoard();
                }
            }
            
            this.selectedJewel = null;
        }
    }
    
    areAdjacent(row1, col1, row2, col2) {
        const rowDiff = Math.abs(row1 - row2);
        const colDiff = Math.abs(col1 - col2);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }
    
    swapJewels(row1, col1, row2, col2) {
        const temp = this.board[row1][col1];
        this.board[row1][col1] = this.board[row2][col2];
        this.board[row2][col2] = temp;
    }
    
    checkForMatches() {
        const matches = [];
        
        // Check horizontal matches
        for (let row = 0; row < this.boardSize; row++) {
            let count = 1;
            let currentType = this.board[row][0];
            
            for (let col = 1; col < this.boardSize; col++) {
                if (this.board[row][col] === currentType) {
                    count++;
                } else {
                    if (count >= 3) {
                        for (let i = col - count; i < col; i++) {
                            matches.push({ row, col: i });
                        }
                    }
                    count = 1;
                    currentType = this.board[row][col];
                }
            }
            
            if (count >= 3) {
                for (let i = this.boardSize - count; i < this.boardSize; i++) {
                    matches.push({ row, col: i });
                }
            }
        }
        
        // Check vertical matches
        for (let col = 0; col < this.boardSize; col++) {
            let count = 1;
            let currentType = this.board[0][col];
            
            for (let row = 1; row < this.boardSize; row++) {
                if (this.board[row][col] === currentType) {
                    count++;
                } else {
                    if (count >= 3) {
                        for (let i = row - count; i < row; i++) {
                            matches.push({ row: i, col });
                        }
                    }
                    count = 1;
                    currentType = this.board[row][col];
                }
            }
            
            if (count >= 3) {
                for (let i = this.boardSize - count; i < this.boardSize; i++) {
                    matches.push({ row: i, col });
                }
            }
        }
        
        this.matches = matches;
        return matches.length > 0;
    }
    
    processMatches() {
        // Remove matched jewels
        this.matches.forEach(match => {
            this.board[match.row][match.col] = -1;
        });
        
        // Calculate score
        const matchCount = this.matches.length;
        this.score += matchCount * 10 * this.level;
        
        // Drop jewels down
        this.dropJewels();
        
        // Fill empty spaces
        this.fillEmptySpaces();
        
        // Render updated board
        this.renderBoard();
        
        // Check for new matches (cascade)
        setTimeout(() => {
            if (this.checkForMatches()) {
                this.processMatches();
            }
        }, 300);
    }
    
    dropJewels() {
        for (let col = 0; col < this.boardSize; col++) {
            let writePos = this.boardSize - 1;
            
            for (let row = this.boardSize - 1; row >= 0; row--) {
                if (this.board[row][col] !== -1) {
                    this.board[writePos][col] = this.board[row][col];
                    if (writePos !== row) {
                        this.board[row][col] = -1;
                    }
                    writePos--;
                }
            }
        }
    }
    
    fillEmptySpaces() {
        for (let col = 0; col < this.boardSize; col++) {
            for (let row = 0; row < this.boardSize; row++) {
                if (this.board[row][col] === -1) {
                    this.board[row][col] = Math.floor(Math.random() * this.jewelTypes.length);
                }
            }
        }
    }
    
    hasPossibleMoves() {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                // Check right swap
                if (col < this.boardSize - 1) {
                    this.swapJewels(row, col, row, col + 1);
                    if (this.checkForMatches()) {
                        this.swapJewels(row, col, row, col + 1); // Swap back
                        return true;
                    }
                    this.swapJewels(row, col, row, col + 1); // Swap back
                }
                
                // Check down swap
                if (row < this.boardSize - 1) {
                    this.swapJewels(row, col, row + 1, col);
                    if (this.checkForMatches()) {
                        this.swapJewels(row, col, row + 1, col); // Swap back
                        return true;
                    }
                    this.swapJewels(row, col, row + 1, col); // Swap back
                }
            }
        }
        return false;
    }
    
    shuffleBoard() {
        const flatBoard = [];
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                flatBoard.push(this.board[row][col]);
            }
        }
        
        // Fisher-Yates shuffle
        for (let i = flatBoard.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [flatBoard[i], flatBoard[j]] = [flatBoard[j], flatBoard[i]];
        }
        
        // Rebuild board
        let index = 0;
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                this.board[row][col] = flatBoard[index++];
            }
        }
    }
    
    showHint() {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                // Check right swap
                if (col < this.boardSize - 1) {
                    this.swapJewels(row, col, row, col + 1);
                    if (this.checkForMatches()) {
                        this.swapJewels(row, col, row, col + 1); // Swap back
                        this.highlightHint(row, col, row, col + 1);
                        return;
                    }
                    this.swapJewels(row, col, row, col + 1); // Swap back
                }
                
                // Check down swap
                if (row < this.boardSize - 1) {
                    this.swapJewels(row, col, row + 1, col);
                    if (this.checkForMatches()) {
                        this.swapJewels(row, col, row + 1, col); // Swap back
                        this.highlightHint(row, col, row + 1, col);
                        return;
                    }
                    this.swapJewels(row, col, row + 1, col); // Swap back
                }
            }
        }
    }
    
    highlightHint(row1, col1, row2, col2) {
        const jewel1 = document.querySelector(`[data-row="${row1}"][data-col="${col1}"]`);
        const jewel2 = document.querySelector(`[data-row="${row2}"][data-col="${col2}"]`);
        
        jewel1.style.border = '3px solid #f39c12';
        jewel2.style.border = '3px solid #f39c12';
        
        setTimeout(() => {
            jewel1.style.border = '';
            jewel2.style.border = '';
        }, 2000);
    }
    
    nextLevel() {
        this.level++;
        this.moves = 30;
        this.targetScore = this.level * 1000;
        this.createBoard();
        this.renderBoard();
        this.updateDisplay();
        
        alert(`Level ${this.level}! Target Score: ${this.targetScore}`);
    }
    
    endGame() {
        this.gameOver = true;
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOver').style.display = 'block';
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('moves').textContent = this.moves;
        document.getElementById('level').textContent = this.level;
    }
}

// Global game instance
let game;

// Initialize game when page loads
window.addEventListener('load', () => {
    game = new JewelMatch();
});

// Game control functions
function newGame() {
    document.getElementById('gameOver').style.display = 'none';
    game = new JewelMatch();
}

function showHint() {
    if (game && !game.gameOver) {
        game.showHint();
    }
}

// Touch support for mobile
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
});

document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
});

function handleSwipe() {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const minSwipeDistance = 50;
    
    if (Math.abs(deltaX) > minSwipeDistance || Math.abs(deltaY) > minSwipeDistance) {
        // Handle swipe gestures if needed
    }
}