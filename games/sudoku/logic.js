class Sudoku {
    constructor() {
        this.board = [];
        this.solution = [];
        this.initialBoard = [];
        this.selectedCell = null;
        this.errors = 0;
        this.maxErrors = 3;
        this.startTime = null;
        this.timerInterval = null;
        this.difficulty = 'medium';
        this.gameComplete = false;
        
        this.difficultySettings = {
            easy: 40,    // 40 empty cells
            medium: 50,  // 50 empty cells
            hard: 60,    // 60 empty cells
            expert: 65   // 65 empty cells
        };
        
        this.init();
    }
    
    init() {
        this.errors = 0;
        this.gameComplete = false;
        this.generatePuzzle();
        this.renderBoard();
        this.updateDisplay();
        this.startTimer();
    }
    
    generatePuzzle() {
        // Create empty 9x9 board
        this.board = Array(9).fill().map(() => Array(9).fill(0));
        
        // Fill the board with a valid solution
        this.solveSudoku(this.board);
        
        // Copy the complete solution
        this.solution = this.board.map(row => [...row]);
        
        // Remove numbers based on difficulty
        this.removeNumbers();
        
        // Store initial state
        this.initialBoard = this.board.map(row => [...row]);
    }
    
    solveSudoku(board) {
        const emptyCell = this.findEmptyCell(board);
        if (!emptyCell) {
            return true; // Puzzle solved
        }
        
        const [row, col] = emptyCell;
        const numbers = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        
        for (const num of numbers) {
            if (this.isValidMove(board, row, col, num)) {
                board[row][col] = num;
                
                if (this.solveSudoku(board)) {
                    return true;
                }
                
                board[row][col] = 0; // Backtrack
            }
        }
        
        return false;
    }
    
    findEmptyCell(board) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    return [row, col];
                }
            }
        }
        return null;
    }
    
    isValidMove(board, row, col, num) {
        // Check row
        for (let i = 0; i < 9; i++) {
            if (board[row][i] === num) {
                return false;
            }
        }
        
        // Check column
        for (let i = 0; i < 9; i++) {
            if (board[i][col] === num) {
                return false;
            }
        }
        
        // Check 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        
        for (let i = boxRow; i < boxRow + 3; i++) {
            for (let j = boxCol; j < boxCol + 3; j++) {
                if (board[i][j] === num) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    removeNumbers() {
        const cellsToRemove = this.difficultySettings[this.difficulty];
        const positions = [];
        
        // Create array of all positions
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                positions.push([row, col]);
            }
        }
        
        // Shuffle positions
        this.shuffleArray(positions);
        
        // Remove numbers from random positions
        for (let i = 0; i < cellsToRemove && i < positions.length; i++) {
            const [row, col] = positions[i];
            this.board[row][col] = 0;
        }
    }
    
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    renderBoard() {
        const gameBoard = document.getElementById('gameBoard');
        gameBoard.innerHTML = '';
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement('div');
                cell.className = 'sudoku-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                if (this.initialBoard[row][col] !== 0) {
                    cell.classList.add('given');
                    cell.textContent = this.initialBoard[row][col];
                } else if (this.board[row][col] !== 0) {
                    cell.textContent = this.board[row][col];
                }
                
                cell.addEventListener('click', () => this.selectCell(row, col));
                
                // Add 3x3 box borders
                if (col === 2 || col === 5) {
                    cell.style.borderRight = '3px solid #2c3e50';
                }
                if (row === 2 || row === 5) {
                    cell.style.borderBottom = '3px solid #2c3e50';
                }
                
                gameBoard.appendChild(cell);
            }
        }
    }
    
    selectCell(row, col) {
        if (this.gameComplete) return;
        
        // Don't select given cells
        if (this.initialBoard[row][col] !== 0) return;
        
        // Clear previous selection
        document.querySelectorAll('.sudoku-cell.selected').forEach(cell => {
            cell.classList.remove('selected');
        });
        
        // Select new cell
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.classList.add('selected');
        
        this.selectedCell = { row, col };
        
        // Highlight related cells
        this.highlightRelatedCells(row, col);
    }
    
    highlightRelatedCells(row, col) {
        // Clear previous highlights
        document.querySelectorAll('.sudoku-cell.highlight').forEach(cell => {
            cell.classList.remove('highlight');
        });
        
        // Highlight row, column, and 3x3 box
        for (let i = 0; i < 9; i++) {
            // Highlight row
            const rowCell = document.querySelector(`[data-row="${row}"][data-col="${i}"]`);
            if (rowCell && !rowCell.classList.contains('selected')) {
                rowCell.classList.add('highlight');
            }
            
            // Highlight column
            const colCell = document.querySelector(`[data-row="${i}"][data-col="${col}"]`);
            if (colCell && !colCell.classList.contains('selected')) {
                colCell.classList.add('highlight');
            }
        }
        
        // Highlight 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        
        for (let i = boxRow; i < boxRow + 3; i++) {
            for (let j = boxCol; j < boxCol + 3; j++) {
                const boxCell = document.querySelector(`[data-row="${i}"][data-col="${j}"]`);
                if (boxCell && !boxCell.classList.contains('selected')) {
                    boxCell.classList.add('highlight');
                }
            }
        }
    }
    
    selectNumber(num) {
        if (!this.selectedCell || this.gameComplete) return;
        
        const { row, col } = this.selectedCell;
        
        // Don't modify given cells
        if (this.initialBoard[row][col] !== 0) return;
        
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        
        if (num === 0) {
            // Erase
            this.board[row][col] = 0;
            cell.textContent = '';
            cell.classList.remove('error');
        } else {
            // Place number
            this.board[row][col] = num;
            cell.textContent = num;
            
            // Check if move is valid
            if (this.solution[row][col] !== num) {
                cell.classList.add('error');
                this.errors++;
                
                if (this.errors >= this.maxErrors) {
                    this.gameOver();
                    return;
                }
            } else {
                cell.classList.remove('error');
            }
        }
        
        this.updateDisplay();
        
        // Check if puzzle is complete
        if (this.isPuzzleComplete()) {
            this.puzzleComplete();
        }
    }
    
    isPuzzleComplete() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.board[row][col] === 0 || this.board[row][col] !== this.solution[row][col]) {
                    return false;
                }
            }
        }
        return true;
    }
    
    getHint() {
        if (!this.selectedCell || this.gameComplete) {
            // Find first empty cell
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (this.board[row][col] === 0) {
                        this.selectCell(row, col);
                        break;
                    }
                }
                if (this.selectedCell) break;
            }
        }
        
        if (this.selectedCell) {
            const { row, col } = this.selectedCell;
            if (this.board[row][col] === 0) {
                this.selectNumber(this.solution[row][col]);
            }
        }
    }
    
    checkSolution() {
        let hasErrors = false;
        
        // Clear previous error highlights
        document.querySelectorAll('.sudoku-cell.error').forEach(cell => {
            cell.classList.remove('error');
        });
        
        // Check all filled cells
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.board[row][col] !== 0 && this.board[row][col] !== this.solution[row][col]) {
                    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    cell.classList.add('error');
                    hasErrors = true;
                }
            }
        }
        
        if (!hasErrors) {
            alert('Great! No errors found so far!');
        } else {
            alert('Some numbers are incorrect. Check the highlighted cells.');
        }
    }
    
    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            document.getElementById('timer').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    updateDisplay() {
        document.getElementById('errors').textContent = this.errors;
        
        // Count remaining empty cells
        let remaining = 0;
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.board[row][col] === 0) {
                    remaining++;
                }
            }
        }
        document.getElementById('remaining').textContent = remaining;
    }
    
    puzzleComplete() {
        this.gameComplete = true;
        this.stopTimer();
        
        const elapsed = Date.now() - this.startTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('finalTime').textContent = timeString;
        document.getElementById('gameComplete').style.display = 'block';
    }
    
    gameOver() {
        this.gameComplete = true;
        this.stopTimer();
        alert('Game Over! Too many errors. Try again!');
    }
    
    changeDifficulty(newDifficulty) {
        this.difficulty = newDifficulty;
        this.stopTimer();
        document.getElementById('gameComplete').style.display = 'none';
        this.init();
    }
}

// Global game instance
let game;

// Initialize game when page loads
window.addEventListener('load', () => {
    game = new Sudoku();
});

// Game control functions
function newGame() {
    document.getElementById('gameComplete').style.display = 'none';
    game = new Sudoku();
}

function selectNumber(num) {
    if (game) {
        game.selectNumber(num);
    }
}

function getHint() {
    if (game) {
        game.getHint();
    }
}

function checkSolution() {
    if (game) {
        game.checkSolution();
    }
}

function changeDifficulty() {
    const difficulty = document.getElementById('difficulty').value;
    if (game) {
        game.changeDifficulty(difficulty);
    }
}

// Keyboard support
document.addEventListener('keydown', (e) => {
    if (game && game.selectedCell && !game.gameComplete) {
        const key = e.key;
        
        if (key >= '1' && key <= '9') {
            game.selectNumber(parseInt(key));
        } else if (key === 'Delete' || key === 'Backspace') {
            game.selectNumber(0);
        } else if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight') {
            e.preventDefault();
            const { row, col } = game.selectedCell;
            let newRow = row;
            let newCol = col;
            
            switch (key) {
                case 'ArrowUp':
                    newRow = Math.max(0, row - 1);
                    break;
                case 'ArrowDown':
                    newRow = Math.min(8, row + 1);
                    break;
                case 'ArrowLeft':
                    newCol = Math.max(0, col - 1);
                    break;
                case 'ArrowRight':
                    newCol = Math.min(8, col + 1);
                    break;
            }
            
            game.selectCell(newRow, newCol);
        }
    }
});