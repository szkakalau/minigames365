class WordSearch {
    constructor() {
        this.gridSize = 15;
        this.grid = [];
        this.words = [];
        this.foundWords = [];
        this.selectedCells = [];
        this.isSelecting = false;
        this.startTime = null;
        this.timerInterval = null;
        this.difficulty = 'medium';
        
        this.wordLists = {
            easy: ['CAT', 'DOG', 'SUN', 'MOON', 'STAR', 'TREE', 'FISH', 'BIRD'],
            medium: ['COMPUTER', 'KEYBOARD', 'MONITOR', 'INTERNET', 'WEBSITE', 'BROWSER', 'DOWNLOAD', 'UPLOAD', 'PASSWORD', 'SOFTWARE', 'HARDWARE', 'NETWORK'],
            hard: ['JAVASCRIPT', 'PROGRAMMING', 'ALGORITHM', 'DATABASE', 'FRAMEWORK', 'DEVELOPMENT', 'RESPONSIVE', 'OPTIMIZATION', 'DEBUGGING', 'ENCRYPTION', 'AUTHENTICATION', 'ARCHITECTURE', 'DEPLOYMENT', 'INTEGRATION', 'DOCUMENTATION', 'MAINTENANCE']
        };
        
        this.init();
    }
    
    init() {
        this.words = [...this.wordLists[this.difficulty]];
        this.foundWords = [];
        this.createGrid();
        this.placeWords();
        this.fillEmptySpaces();
        this.renderGrid();
        this.renderWordList();
        this.updateDisplay();
        this.startTimer();
    }
    
    createGrid() {
        this.grid = [];
        for (let i = 0; i < this.gridSize; i++) {
            this.grid[i] = new Array(this.gridSize).fill('');
        }
    }
    
    placeWords() {
        const directions = [
            [0, 1],   // horizontal
            [1, 0],   // vertical
            [1, 1],   // diagonal down-right
            [1, -1],  // diagonal down-left
            [0, -1],  // horizontal backwards
            [-1, 0],  // vertical backwards
            [-1, -1], // diagonal up-left
            [-1, 1]   // diagonal up-right
        ];
        
        for (const word of this.words) {
            let placed = false;
            let attempts = 0;
            
            while (!placed && attempts < 100) {
                const direction = directions[Math.floor(Math.random() * directions.length)];
                const startRow = Math.floor(Math.random() * this.gridSize);
                const startCol = Math.floor(Math.random() * this.gridSize);
                
                if (this.canPlaceWord(word, startRow, startCol, direction)) {
                    this.placeWord(word, startRow, startCol, direction);
                    placed = true;
                }
                attempts++;
            }
        }
    }
    
    canPlaceWord(word, startRow, startCol, direction) {
        const [dRow, dCol] = direction;
        
        for (let i = 0; i < word.length; i++) {
            const row = startRow + i * dRow;
            const col = startCol + i * dCol;
            
            if (row < 0 || row >= this.gridSize || col < 0 || col >= this.gridSize) {
                return false;
            }
            
            if (this.grid[row][col] !== '' && this.grid[row][col] !== word[i]) {
                return false;
            }
        }
        
        return true;
    }
    
    placeWord(word, startRow, startCol, direction) {
        const [dRow, dCol] = direction;
        const positions = [];
        
        for (let i = 0; i < word.length; i++) {
            const row = startRow + i * dRow;
            const col = startCol + i * dCol;
            this.grid[row][col] = word[i];
            positions.push({ row, col });
        }
        
        // Store word position for checking
        this.words[this.words.indexOf(word)] = {
            word: word,
            positions: positions
        };
    }
    
    fillEmptySpaces() {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.grid[row][col] === '') {
                    this.grid[row][col] = letters[Math.floor(Math.random() * letters.length)];
                }
            }
        }
    }
    
    renderGrid() {
        const gameBoard = document.getElementById('gameBoard');
        gameBoard.innerHTML = '';
        
        // Adjust grid size for mobile
        if (window.innerWidth <= 768) {
            this.gridSize = 12;
            gameBoard.style.gridTemplateColumns = `repeat(${this.gridSize}, 25px)`;
            gameBoard.style.gridTemplateRows = `repeat(${this.gridSize}, 25px)`;
        } else {
            gameBoard.style.gridTemplateColumns = `repeat(${this.gridSize}, 30px)`;
            gameBoard.style.gridTemplateRows = `repeat(${this.gridSize}, 30px)`;
        }
        
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'letter';
                cell.textContent = this.grid[row][col];
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                cell.addEventListener('mousedown', (e) => this.startSelection(e, row, col));
                cell.addEventListener('mouseover', (e) => this.continueSelection(e, row, col));
                cell.addEventListener('mouseup', () => this.endSelection());
                
                // Touch events for mobile
                cell.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    this.startSelection(e, row, col);
                });
                cell.addEventListener('touchmove', (e) => {
                    e.preventDefault();
                    const touch = e.touches[0];
                    const element = document.elementFromPoint(touch.clientX, touch.clientY);
                    if (element && element.dataset.row) {
                        this.continueSelection(e, parseInt(element.dataset.row), parseInt(element.dataset.col));
                    }
                });
                cell.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    this.endSelection();
                });
                
                gameBoard.appendChild(cell);
            }
        }
    }
    
    renderWordList() {
        const wordList = document.getElementById('wordList');
        wordList.innerHTML = '';
        
        this.words.forEach(wordObj => {
            const wordElement = document.createElement('div');
            wordElement.className = 'word-item';
            const word = typeof wordObj === 'string' ? wordObj : wordObj.word;
            wordElement.textContent = word;
            
            if (this.foundWords.includes(word)) {
                wordElement.classList.add('found');
            }
            
            wordList.appendChild(wordElement);
        });
    }
    
    startSelection(e, row, col) {
        this.isSelecting = true;
        this.selectedCells = [{ row, col }];
        this.updateSelection();
    }
    
    continueSelection(e, row, col) {
        if (!this.isSelecting) return;
        
        const start = this.selectedCells[0];
        const newSelection = this.getLineCells(start.row, start.col, row, col);
        
        if (newSelection.length > 0) {
            this.selectedCells = newSelection;
            this.updateSelection();
        }
    }
    
    endSelection() {
        if (!this.isSelecting) return;
        
        this.isSelecting = false;
        this.checkSelectedWord();
        this.clearSelection();
    }
    
    getLineCells(startRow, startCol, endRow, endCol) {
        const cells = [];
        const dRow = endRow - startRow;
        const dCol = endCol - startCol;
        
        // Check if it's a valid line (horizontal, vertical, or diagonal)
        if (dRow !== 0 && dCol !== 0 && Math.abs(dRow) !== Math.abs(dCol)) {
            return [];
        }
        
        const steps = Math.max(Math.abs(dRow), Math.abs(dCol));
        const stepRow = steps === 0 ? 0 : dRow / steps;
        const stepCol = steps === 0 ? 0 : dCol / steps;
        
        for (let i = 0; i <= steps; i++) {
            const row = startRow + i * stepRow;
            const col = startCol + i * stepCol;
            
            if (row >= 0 && row < this.gridSize && col >= 0 && col < this.gridSize) {
                cells.push({ row: Math.round(row), col: Math.round(col) });
            }
        }
        
        return cells;
    }
    
    updateSelection() {
        // Clear previous selection
        document.querySelectorAll('.letter.selected').forEach(cell => {
            cell.classList.remove('selected');
        });
        
        // Highlight selected cells
        this.selectedCells.forEach(({ row, col }) => {
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (cell) {
                cell.classList.add('selected');
            }
        });
    }
    
    checkSelectedWord() {
        const selectedWord = this.selectedCells
            .map(({ row, col }) => this.grid[row][col])
            .join('');
        
        const reversedWord = selectedWord.split('').reverse().join('');
        
        for (const wordObj of this.words) {
            const word = typeof wordObj === 'string' ? wordObj : wordObj.word;
            
            if ((selectedWord === word || reversedWord === word) && !this.foundWords.includes(word)) {
                this.foundWords.push(word);
                this.markWordAsFound();
                this.updateDisplay();
                
                if (this.foundWords.length === this.words.length) {
                    this.gameComplete();
                }
                break;
            }
        }
    }
    
    markWordAsFound() {
        this.selectedCells.forEach(({ row, col }) => {
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (cell) {
                cell.classList.add('found');
                cell.classList.remove('selected');
            }
        });
        
        this.renderWordList();
    }
    
    clearSelection() {
        document.querySelectorAll('.letter.selected').forEach(cell => {
            cell.classList.remove('selected');
        });
        this.selectedCells = [];
    }
    
    showHint() {
        const unFoundWords = this.words.filter(wordObj => {
            const word = typeof wordObj === 'string' ? wordObj : wordObj.word;
            return !this.foundWords.includes(word);
        });
        
        if (unFoundWords.length > 0) {
            const randomWord = unFoundWords[Math.floor(Math.random() * unFoundWords.length)];
            const word = typeof randomWord === 'string' ? randomWord : randomWord.word;
            const positions = typeof randomWord === 'string' ? null : randomWord.positions;
            
            if (positions) {
                // Highlight the word briefly
                positions.forEach(({ row, col }) => {
                    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    if (cell) {
                        cell.style.background = '#f39c12';
                        cell.style.color = 'white';
                    }
                });
                
                setTimeout(() => {
                    positions.forEach(({ row, col }) => {
                        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                        if (cell && !cell.classList.contains('found')) {
                            cell.style.background = '';
                            cell.style.color = '';
                        }
                    });
                }, 2000);
            }
            
            alert(`Hint: Look for the word "${word}"`);
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
        document.getElementById('foundWords').textContent = this.foundWords.length;
        document.getElementById('totalWords').textContent = this.words.length;
    }
    
    gameComplete() {
        this.stopTimer();
        const elapsed = Date.now() - this.startTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('finalTime').textContent = timeString;
        document.getElementById('gameComplete').style.display = 'block';
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
    game = new WordSearch();
});

// Game control functions
function newGame() {
    document.getElementById('gameComplete').style.display = 'none';
    game = new WordSearch();
}

function showHint() {
    if (game) {
        game.showHint();
    }
}

function clearSelection() {
    if (game) {
        game.clearSelection();
    }
}

function changeDifficulty() {
    const difficulty = document.getElementById('difficulty').value;
    if (game) {
        game.changeDifficulty(difficulty);
    }
}

// Prevent context menu on right click
document.addEventListener('contextmenu', (e) => {
    if (e.target.classList.contains('letter')) {
        e.preventDefault();
    }
});

// Prevent text selection
document.addEventListener('selectstart', (e) => {
    if (e.target.classList.contains('letter')) {
        e.preventDefault();
    }
});