class Crossword {
    constructor() {
        this.grid = [];
        this.words = [];
        this.clues = [];
        this.currentWord = null;
        this.selectedCell = null;
        this.direction = 'across';
        this.startTime = null;
        this.timer = null;
        this.difficulty = 'medium';
        this.completedWords = new Set();
        
        this.puzzles = {
            easy: {
                size: 9,
                words: [
                    { word: 'CAT', clue: 'Feline pet', start: [1, 1], direction: 'across', number: 1 },
                    { word: 'DOG', clue: 'Canine companion', start: [3, 1], direction: 'across', number: 3 },
                    { word: 'SUN', clue: 'Star in our solar system', start: [5, 1], direction: 'across', number: 5 },
                    { word: 'CAR', clue: 'Vehicle with four wheels', start: [1, 1], direction: 'down', number: 1 },
                    { word: 'ART', clue: 'Creative expression', start: [1, 3], direction: 'down', number: 2 },
                    { word: 'TOP', clue: 'Highest point', start: [3, 3], direction: 'down', number: 4 }
                ]
            },
            medium: {
                size: 11,
                words: [
                    { word: 'COMPUTER', clue: 'Electronic device for processing data', start: [1, 1], direction: 'across', number: 1 },
                    { word: 'SCIENCE', clue: 'Systematic study of the natural world', start: [3, 1], direction: 'across', number: 4 },
                    { word: 'NATURE', clue: 'The physical world and its phenomena', start: [5, 1], direction: 'across', number: 7 },
                    { word: 'MUSIC', clue: 'Art form using sound and rhythm', start: [7, 1], direction: 'across', number: 9 },
                    { word: 'OCEAN', clue: 'Large body of salt water', start: [9, 1], direction: 'across', number: 11 },
                    { word: 'CREATIVE', clue: 'Having original ideas', start: [1, 1], direction: 'down', number: 1 },
                    { word: 'SMART', clue: 'Intelligent', start: [1, 3], direction: 'down', number: 2 },
                    { word: 'MODERN', clue: 'Contemporary', start: [1, 5], direction: 'down', number: 3 },
                    { word: 'ENERGY', clue: 'Power or vigor', start: [3, 3], direction: 'down', number: 5 },
                    { word: 'FUTURE', clue: 'Time yet to come', start: [5, 3], direction: 'down', number: 6 },
                    { word: 'UNIQUE', clue: 'One of a kind', start: [7, 3], direction: 'down', number: 8 },
                    { word: 'CHANGE', clue: 'To make different', start: [9, 3], direction: 'down', number: 10 }
                ]
            },
            hard: {
                size: 13,
                words: [
                    { word: 'TECHNOLOGY', clue: 'Application of scientific knowledge', start: [1, 1], direction: 'across', number: 1 },
                    { word: 'INNOVATION', clue: 'Introduction of new ideas', start: [3, 1], direction: 'across', number: 6 },
                    { word: 'DEVELOPMENT', clue: 'Process of growth or progress', start: [5, 1], direction: 'across', number: 11 },
                    { word: 'ENVIRONMENT', clue: 'Natural world surroundings', start: [7, 1], direction: 'across', number: 16 },
                    { word: 'EDUCATION', clue: 'Process of learning and teaching', start: [9, 1], direction: 'across', number: 21 },
                    { word: 'COMMUNICATION', clue: 'Exchange of information', start: [11, 1], direction: 'across', number: 25 },
                    { word: 'TRANSFORMATION', clue: 'Complete change in form', start: [1, 1], direction: 'down', number: 1 },
                    { word: 'EXCELLENCE', clue: 'Quality of being outstanding', start: [1, 3], direction: 'down', number: 2 },
                    { word: 'CREATIVITY', clue: 'Use of imagination', start: [1, 5], direction: 'down', number: 3 },
                    { word: 'KNOWLEDGE', clue: 'Information and understanding', start: [1, 7], direction: 'down', number: 4 },
                    { word: 'OPPORTUNITY', clue: 'Favorable circumstances', start: [1, 9], direction: 'down', number: 5 },
                    { word: 'INSPIRATION', clue: 'Process of being mentally stimulated', start: [3, 3], direction: 'down', number: 7 },
                    { word: 'NETWORKING', clue: 'Building professional relationships', start: [5, 3], direction: 'down', number: 12 },
                    { word: 'VISION', clue: 'Ability to think about future', start: [7, 3], direction: 'down', number: 17 },
                    { word: 'DEDICATION', clue: 'Quality of being committed', start: [9, 3], direction: 'down', number: 22 },
                    { word: 'COLLABORATION', clue: 'Working together', start: [11, 3], direction: 'down', number: 26 }
                ]
            }
        };
        
        this.init();
    }
    
    init() {
        this.createGrid();
        this.renderGrid();
        this.renderClues();
        this.startTimer();
        this.updateStats();
        this.addEventListeners();
    }
    
    createGrid() {
        const puzzle = this.puzzles[this.difficulty];
        const size = puzzle.size;
        
        // Initialize empty grid
        this.grid = Array(size).fill().map(() => Array(size).fill({
            letter: '',
            isBlack: true,
            number: null,
            userLetter: '',
            isCorrect: false
        }));
        
        this.words = puzzle.words;
        
        // Place words in grid
        this.words.forEach(wordData => {
            const { word, start, direction } = wordData;
            const [row, col] = start;
            
            for (let i = 0; i < word.length; i++) {
                const currentRow = direction === 'across' ? row : row + i;
                const currentCol = direction === 'across' ? col + i : col;
                
                if (currentRow < size && currentCol < size) {
                    this.grid[currentRow][currentCol] = {
                        letter: word[i],
                        isBlack: false,
                        number: i === 0 ? wordData.number : this.grid[currentRow][currentCol].number,
                        userLetter: '',
                        isCorrect: false
                    };
                }
            }
        });
    }
    
    renderGrid() {
        const gridElement = document.getElementById('crosswordGrid');
        const size = this.puzzles[this.difficulty].size;
        
        gridElement.style.gridTemplateColumns = `repeat(${size}, 35px)`;
        gridElement.style.gridTemplateRows = `repeat(${size}, 35px)`;
        gridElement.innerHTML = '';
        
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                const cell = this.grid[row][col];
                const cellElement = document.createElement('div');
                cellElement.className = 'crossword-cell';
                cellElement.dataset.row = row;
                cellElement.dataset.col = col;
                
                if (cell.isBlack) {
                    cellElement.classList.add('black');
                } else {
                    if (cell.number) {
                        const numberElement = document.createElement('div');
                        numberElement.className = 'cell-number';
                        numberElement.textContent = cell.number;
                        cellElement.appendChild(numberElement);
                    }
                    
                    cellElement.textContent = cell.userLetter;
                    cellElement.addEventListener('click', () => this.selectCell(row, col));
                }
                
                gridElement.appendChild(cellElement);
            }
        }
    }
    
    renderClues() {
        const acrossClues = document.getElementById('acrossClues');
        const downClues = document.getElementById('downClues');
        
        acrossClues.innerHTML = '';
        downClues.innerHTML = '';
        
        this.words.forEach(wordData => {
            const clueElement = document.createElement('div');
            clueElement.className = 'clue-item';
            clueElement.dataset.number = wordData.number;
            clueElement.dataset.direction = wordData.direction;
            
            clueElement.innerHTML = `
                <span class="clue-number">${wordData.number}.</span> ${wordData.clue}
            `;
            
            clueElement.addEventListener('click', () => this.selectWord(wordData));
            
            if (wordData.direction === 'across') {
                acrossClues.appendChild(clueElement);
            } else {
                downClues.appendChild(clueElement);
            }
        });
    }
    
    selectCell(row, col) {
        if (this.grid[row][col].isBlack) return;
        
        this.selectedCell = { row, col };
        this.highlightCell(row, col);
        
        // Find word that contains this cell
        const word = this.findWordAtCell(row, col);
        if (word) {
            this.selectWord(word);
        }
    }
    
    selectWord(wordData) {
        this.currentWord = wordData;
        this.direction = wordData.direction;
        
        // Clear previous highlights
        document.querySelectorAll('.crossword-cell').forEach(cell => {
            cell.classList.remove('highlighted', 'selected');
        });
        
        document.querySelectorAll('.clue-item').forEach(clue => {
            clue.classList.remove('active');
        });
        
        // Highlight current word
        this.highlightWord(wordData);
        
        // Highlight current clue
        const clueElement = document.querySelector(`[data-number="${wordData.number}"][data-direction="${wordData.direction}"]`);
        if (clueElement) {
            clueElement.classList.add('active');
        }
    }
    
    highlightWord(wordData) {
        const { start, direction, word } = wordData;
        const [row, col] = start;
        
        for (let i = 0; i < word.length; i++) {
            const currentRow = direction === 'across' ? row : row + i;
            const currentCol = direction === 'across' ? col + i : col;
            
            const cellElement = document.querySelector(`[data-row="${currentRow}"][data-col="${currentCol}"]`);
            if (cellElement) {
                cellElement.classList.add('highlighted');
            }
        }
    }
    
    highlightCell(row, col) {
        document.querySelectorAll('.crossword-cell').forEach(cell => {
            cell.classList.remove('selected');
        });
        
        const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cellElement) {
            cellElement.classList.add('selected');
        }
    }
    
    findWordAtCell(row, col) {
        return this.words.find(wordData => {
            const { start, direction, word } = wordData;
            const [startRow, startCol] = start;
            
            if (direction === 'across') {
                return row === startRow && col >= startCol && col < startCol + word.length;
            } else {
                return col === startCol && row >= startRow && row < startRow + word.length;
            }
        });
    }
    
    addEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (!this.selectedCell) return;
            
            const { row, col } = this.selectedCell;
            
            if (e.key.match(/[a-zA-Z]/)) {
                this.enterLetter(row, col, e.key.toUpperCase());
                this.moveToNextCell();
            } else if (e.key === 'Backspace') {
                this.enterLetter(row, col, '');
                this.moveToPreviousCell();
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || 
                       e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                this.handleArrowKey(e.key);
            }
        });
        
        // Touch support for mobile
        document.addEventListener('touchstart', (e) => {
            if (e.target.classList.contains('crossword-cell')) {
                e.preventDefault();
            }
        });
    }
    
    enterLetter(row, col, letter) {
        if (this.grid[row][col].isBlack) return;
        
        this.grid[row][col].userLetter = letter;
        this.grid[row][col].isCorrect = letter === this.grid[row][col].letter;
        
        const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cellElement) {
            cellElement.textContent = letter;
            if (cellElement.querySelector('.cell-number')) {
                cellElement.appendChild(cellElement.querySelector('.cell-number'));
            }
            
            if (this.grid[row][col].isCorrect && letter) {
                cellElement.classList.add('correct');
            } else {
                cellElement.classList.remove('correct');
            }
        }
        
        this.checkWordCompletion();
        this.updateStats();
    }
    
    moveToNextCell() {
        if (!this.currentWord || !this.selectedCell) return;
        
        const { start, direction, word } = this.currentWord;
        const [startRow, startCol] = start;
        const { row, col } = this.selectedCell;
        
        let nextRow = row;
        let nextCol = col;
        
        if (direction === 'across') {
            nextCol++;
            if (nextCol >= startCol + word.length) return;
        } else {
            nextRow++;
            if (nextRow >= startRow + word.length) return;
        }
        
        this.selectCell(nextRow, nextCol);
    }
    
    moveToPreviousCell() {
        if (!this.currentWord || !this.selectedCell) return;
        
        const { start, direction } = this.currentWord;
        const [startRow, startCol] = start;
        const { row, col } = this.selectedCell;
        
        let prevRow = row;
        let prevCol = col;
        
        if (direction === 'across') {
            prevCol--;
            if (prevCol < startCol) return;
        } else {
            prevRow--;
            if (prevRow < startRow) return;
        }
        
        this.selectCell(prevRow, prevCol);
    }
    
    handleArrowKey(key) {
        if (!this.selectedCell) return;
        
        const { row, col } = this.selectedCell;
        const size = this.puzzles[this.difficulty].size;
        
        let newRow = row;
        let newCol = col;
        
        switch (key) {
            case 'ArrowUp':
                newRow = Math.max(0, row - 1);
                break;
            case 'ArrowDown':
                newRow = Math.min(size - 1, row + 1);
                break;
            case 'ArrowLeft':
                newCol = Math.max(0, col - 1);
                break;
            case 'ArrowRight':
                newCol = Math.min(size - 1, col + 1);
                break;
        }
        
        if (!this.grid[newRow][newCol].isBlack) {
            this.selectCell(newRow, newCol);
        }
    }
    
    checkWordCompletion() {
        this.words.forEach(wordData => {
            const { word, start, direction, number } = wordData;
            const [row, col] = start;
            let isComplete = true;
            
            for (let i = 0; i < word.length; i++) {
                const currentRow = direction === 'across' ? row : row + i;
                const currentCol = direction === 'across' ? col + i : col;
                
                if (this.grid[currentRow][currentCol].userLetter !== word[i]) {
                    isComplete = false;
                    break;
                }
            }
            
            const clueElement = document.querySelector(`[data-number="${number}"][data-direction="${direction}"]`);
            if (isComplete) {
                this.completedWords.add(`${number}-${direction}`);
                if (clueElement) {
                    clueElement.classList.add('completed');
                }
            } else {
                this.completedWords.delete(`${number}-${direction}`);
                if (clueElement) {
                    clueElement.classList.remove('completed');
                }
            }
        });
        
        if (this.completedWords.size === this.words.length) {
            this.gameComplete();
        }
    }
    
    updateStats() {
        document.getElementById('completed').textContent = this.completedWords.size;
        document.getElementById('total').textContent = this.words.length;
    }
    
    startTimer() {
        this.startTime = Date.now();
        this.timer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
            const seconds = (elapsed % 60).toString().padStart(2, '0');
            document.getElementById('timer').textContent = `${minutes}:${seconds}`;
        }, 1000);
    }
    
    gameComplete() {
        clearInterval(this.timer);
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        
        document.getElementById('finalTime').textContent = `${minutes}:${seconds}`;
        document.getElementById('gameComplete').style.display = 'block';
    }
    
    getHint() {
        if (!this.currentWord) {
            alert('Please select a word first!');
            return;
        }
        
        const { word, start, direction } = this.currentWord;
        const [row, col] = start;
        
        // Find first empty cell in current word
        for (let i = 0; i < word.length; i++) {
            const currentRow = direction === 'across' ? row : row + i;
            const currentCol = direction === 'across' ? col + i : col;
            
            if (!this.grid[currentRow][currentCol].userLetter) {
                this.enterLetter(currentRow, currentCol, word[i]);
                this.selectCell(currentRow, currentCol);
                break;
            }
        }
    }
    
    checkAnswers() {
        let hasErrors = false;
        
        for (let row = 0; row < this.grid.length; row++) {
            for (let col = 0; col < this.grid[row].length; col++) {
                const cell = this.grid[row][col];
                if (!cell.isBlack && cell.userLetter) {
                    const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    if (cell.userLetter !== cell.letter) {
                        cellElement.style.background = '#e74c3c';
                        cellElement.style.color = 'white';
                        hasErrors = true;
                        
                        setTimeout(() => {
                            cellElement.style.background = '';
                            cellElement.style.color = '';
                        }, 1000);
                    }
                }
            }
        }
        
        if (!hasErrors) {
            alert('All filled answers are correct!');
        }
    }
    
    clearWord() {
        if (!this.currentWord) {
            alert('Please select a word first!');
            return;
        }
        
        const { word, start, direction } = this.currentWord;
        const [row, col] = start;
        
        for (let i = 0; i < word.length; i++) {
            const currentRow = direction === 'across' ? row : row + i;
            const currentCol = direction === 'across' ? col + i : col;
            
            this.enterLetter(currentRow, currentCol, '');
        }
    }
    
    newGame() {
        clearInterval(this.timer);
        this.completedWords.clear();
        this.selectedCell = null;
        this.currentWord = null;
        document.getElementById('gameComplete').style.display = 'none';
        this.init();
    }
}

// Global functions
function changeDifficulty() {
    const difficulty = document.getElementById('difficulty').value;
    game.difficulty = difficulty;
    game.newGame();
}

function newGame() {
    game.newGame();
}

function getHint() {
    game.getHint();
}

function checkAnswers() {
    game.checkAnswers();
}

function clearWord() {
    game.clearWord();
}

// Initialize game
let game;
window.addEventListener('load', () => {
    game = new Crossword();
});

// Mobile optimization
if ('ontouchstart' in window) {
    document.addEventListener('DOMContentLoaded', () => {
        // Add virtual keyboard for mobile
        const gameContainer = document.querySelector('.game-container');
        const keyboard = document.createElement('div');
        keyboard.className = 'virtual-keyboard';
        keyboard.style.cssText = `
            display: grid;
            grid-template-columns: repeat(10, 1fr);
            gap: 5px;
            margin-top: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 10px;
        `;
        
        'QWERTYUIOPASDFGHJKLZXCVBNM'.split('').forEach(letter => {
            const key = document.createElement('button');
            key.textContent = letter;
            key.style.cssText = `
                padding: 10px;
                border: none;
                background: #3498db;
                color: white;
                border-radius: 5px;
                font-size: 16px;
                cursor: pointer;
            `;
            key.addEventListener('click', () => {
                if (game.selectedCell) {
                    const { row, col } = game.selectedCell;
                    game.enterLetter(row, col, letter);
                    game.moveToNextCell();
                }
            });
            keyboard.appendChild(key);
        });
        
        // Add backspace key
        const backspace = document.createElement('button');
        backspace.textContent = '⌫';
        backspace.style.cssText = `
            padding: 10px;
            border: none;
            background: #e74c3c;
            color: white;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            grid-column: span 2;
        `;
        backspace.addEventListener('click', () => {
            if (game.selectedCell) {
                const { row, col } = game.selectedCell;
                game.enterLetter(row, col, '');
                game.moveToPreviousCell();
            }
        });
        keyboard.appendChild(backspace);
        
        gameContainer.appendChild(keyboard);
    });
}