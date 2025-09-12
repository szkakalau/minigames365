class KlotskiPuzzle {
    constructor() {
        this.gameBoard = document.getElementById('gameBoard');
        this.movesElement = document.getElementById('moves');
        this.timeElement = document.getElementById('time');
        this.bestMovesElement = document.getElementById('bestMoves');
        this.victoryMessage = document.getElementById('victoryMessage');
        
        // Game state
        this.currentLevel = 'easy';
        this.moves = 0;
        this.startTime = null;
        this.gameTime = 0;
        this.isGameActive = false;
        this.selectedPiece = null;
        this.moveHistory = [];
        
        // Board configuration
        this.boardWidth = 4;
        this.boardHeight = 5;
        this.cellSize = 70;
        
        // Game pieces
        this.pieces = [];
        this.board = [];
        
        // Level configurations
        this.levels = {
            easy: {
                name: '横刀立马',
                pieces: [
                    { id: 'caocao', type: 'caocao', x: 1, y: 0, width: 2, height: 2, name: '曹操' },
                    { id: 'guanyu', type: 'general', x: 1, y: 2, width: 2, height: 1, name: '关羽' },
                    { id: 'zhangfei', type: 'general', x: 0, y: 0, width: 1, height: 2, name: '张飞' },
                    { id: 'zhaoyun', type: 'general', x: 3, y: 0, width: 1, height: 2, name: '赵云' },
                    { id: 'machao', type: 'general', x: 0, y: 2, width: 1, height: 2, name: '马超' },
                    { id: 'huangzhong', type: 'general', x: 3, y: 2, width: 1, height: 2, name: '黄忠' },
                    { id: 'soldier1', type: 'soldier', x: 1, y: 3, width: 1, height: 1, name: '兵' },
                    { id: 'soldier2', type: 'soldier', x: 2, y: 3, width: 1, height: 1, name: '兵' },
                    { id: 'soldier3', type: 'soldier', x: 0, y: 4, width: 1, height: 1, name: '兵' },
                    { id: 'soldier4', type: 'soldier', x: 3, y: 4, width: 1, height: 1, name: '兵' }
                ]
            },
            medium: {
                name: '近在咫尺',
                pieces: [
                    { id: 'caocao', type: 'caocao', x: 0, y: 0, width: 2, height: 2, name: '曹操' },
                    { id: 'guanyu', type: 'general', x: 2, y: 0, width: 1, height: 2, name: '关羽' },
                    { id: 'zhangfei', type: 'general', x: 3, y: 0, width: 1, height: 2, name: '张飞' },
                    { id: 'zhaoyun', type: 'general', x: 0, y: 2, width: 2, height: 1, name: '赵云' },
                    { id: 'machao', type: 'general', x: 2, y: 2, width: 1, height: 2, name: '马超' },
                    { id: 'huangzhong', type: 'general', x: 3, y: 2, width: 1, height: 2, name: '黄忠' },
                    { id: 'soldier1', type: 'soldier', x: 0, y: 3, width: 1, height: 1, name: '兵' },
                    { id: 'soldier2', type: 'soldier', x: 1, y: 3, width: 1, height: 1, name: '兵' },
                    { id: 'soldier3', type: 'soldier', x: 1, y: 4, width: 1, height: 1, name: '兵' },
                    { id: 'soldier4', type: 'soldier', x: 3, y: 4, width: 1, height: 1, name: '兵' }
                ]
            },
            hard: {
                name: '水泄不通',
                pieces: [
                    { id: 'caocao', type: 'caocao', x: 1, y: 0, width: 2, height: 2, name: '曹操' },
                    { id: 'guanyu', type: 'general', x: 1, y: 2, width: 2, height: 1, name: '关羽' },
                    { id: 'zhangfei', type: 'general', x: 0, y: 0, width: 1, height: 2, name: '张飞' },
                    { id: 'zhaoyun', type: 'general', x: 3, y: 0, width: 1, height: 2, name: '赵云' },
                    { id: 'machao', type: 'general', x: 0, y: 3, width: 1, height: 2, name: '马超' },
                    { id: 'huangzhong', type: 'general', x: 3, y: 3, width: 1, height: 2, name: '黄忠' },
                    { id: 'soldier1', type: 'soldier', x: 0, y: 2, width: 1, height: 1, name: '兵' },
                    { id: 'soldier2', type: 'soldier', x: 3, y: 2, width: 1, height: 1, name: '兵' },
                    { id: 'soldier3', type: 'soldier', x: 1, y: 3, width: 1, height: 1, name: '兵' },
                    { id: 'soldier4', type: 'soldier', x: 2, y: 3, width: 1, height: 1, name: '兵' }
                ]
            }
        };
        
        // Best scores
        this.bestScores = {
            easy: localStorage.getItem('klotski-easy-best') || null,
            medium: localStorage.getItem('klotski-medium-best') || null,
            hard: localStorage.getItem('klotski-hard-best') || null
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.initializeGame();
        this.updateBestScore();
    }
    
    setupEventListeners() {
        // Difficulty selector
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentLevel = e.target.dataset.level;
                this.initializeGame();
            });
        });
        
        // Control buttons
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('hintBtn').addEventListener('click', () => this.showHint());
        document.getElementById('undoBtn').addEventListener('click', () => this.undoMove());
        
        // Touch and mouse events for pieces
        this.gameBoard.addEventListener('click', (e) => this.handleBoardClick(e));
        this.gameBoard.addEventListener('touchstart', (e) => this.handleBoardTouch(e));
        
        // Prevent context menu
        document.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    initializeGame() {
        this.moves = 0;
        this.startTime = null;
        this.gameTime = 0;
        this.isGameActive = true;
        this.selectedPiece = null;
        this.moveHistory = [];
        
        this.pieces = JSON.parse(JSON.stringify(this.levels[this.currentLevel].pieces));
        this.createBoard();
        this.renderBoard();
        this.updateUI();
        this.updateBestScore();
    }
    
    createBoard() {
        // Initialize empty board
        this.board = [];
        for (let y = 0; y < this.boardHeight; y++) {
            this.board[y] = [];
            for (let x = 0; x < this.boardWidth; x++) {
                this.board[y][x] = null;
            }
        }
        
        // Place pieces on board
        this.pieces.forEach(piece => {
            for (let dy = 0; dy < piece.height; dy++) {
                for (let dx = 0; dx < piece.width; dx++) {
                    if (piece.y + dy < this.boardHeight && piece.x + dx < this.boardWidth) {
                        this.board[piece.y + dy][piece.x + dx] = piece.id;
                    }
                }
            }
        });
    }
    
    renderBoard() {
        this.gameBoard.innerHTML = '';
        
        this.pieces.forEach(piece => {
            const pieceElement = document.createElement('div');
            pieceElement.className = `puzzle-piece ${piece.type}`;
            pieceElement.dataset.id = piece.id;
            pieceElement.textContent = piece.name;
            
            // Position and size
            pieceElement.style.left = (piece.x * this.cellSize) + 'px';
            pieceElement.style.top = (piece.y * this.cellSize) + 'px';
            pieceElement.style.width = (piece.width * this.cellSize - 4) + 'px';
            pieceElement.style.height = (piece.height * this.cellSize - 4) + 'px';
            
            // Font size based on piece size
            const fontSize = Math.min(piece.width, piece.height) * 12;
            pieceElement.style.fontSize = fontSize + 'px';
            
            this.gameBoard.appendChild(pieceElement);
        });
    }
    
    handleBoardClick(e) {
        if (!this.isGameActive) return;
        
        const pieceElement = e.target.closest('.puzzle-piece');
        if (pieceElement) {
            this.selectPiece(pieceElement.dataset.id);
        }
    }
    
    handleBoardTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        const pieceElement = element?.closest('.puzzle-piece');
        
        if (pieceElement) {
            this.selectPiece(pieceElement.dataset.id);
        }
    }
    
    selectPiece(pieceId) {
        if (!this.startTime) {
            this.startTime = Date.now();
            this.startTimer();
        }
        
        const piece = this.pieces.find(p => p.id === pieceId);
        if (!piece) return;
        
        // If same piece is selected, deselect
        if (this.selectedPiece === pieceId) {
            this.selectedPiece = null;
            this.updatePieceSelection();
            return;
        }
        
        // If another piece is selected, try to move it
        if (this.selectedPiece) {
            this.tryMovePiece(this.selectedPiece);
            this.selectedPiece = null;
        }
        
        // Select new piece
        this.selectedPiece = pieceId;
        this.updatePieceSelection();
    }
    
    updatePieceSelection() {
        document.querySelectorAll('.puzzle-piece').forEach(el => {
            el.classList.remove('selected');
        });
        
        if (this.selectedPiece) {
            const selectedElement = document.querySelector(`[data-id="${this.selectedPiece}"]`);
            if (selectedElement) {
                selectedElement.classList.add('selected');
            }
        }
    }
    
    tryMovePiece(pieceId) {
        const piece = this.pieces.find(p => p.id === pieceId);
        if (!piece) return;
        
        const possibleMoves = this.getPossibleMoves(piece);
        
        if (possibleMoves.length > 0) {
            // Save current state for undo
            this.moveHistory.push(JSON.parse(JSON.stringify(this.pieces)));
            
            // For simplicity, move to the first possible position
            // In a more advanced version, you could show all possible moves
            const move = possibleMoves[0];
            this.movePiece(piece, move.x, move.y);
        }
    }
    
    getPossibleMoves(piece) {
        const moves = [];
        const directions = [
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 },  // down
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 }   // right
        ];
        
        directions.forEach(dir => {
            const newX = piece.x + dir.dx;
            const newY = piece.y + dir.dy;
            
            if (this.canMoveTo(piece, newX, newY)) {
                moves.push({ x: newX, y: newY });
            }
        });
        
        return moves;
    }
    
    canMoveTo(piece, newX, newY) {
        // Check bounds
        if (newX < 0 || newY < 0 || 
            newX + piece.width > this.boardWidth || 
            newY + piece.height > this.boardHeight) {
            return false;
        }
        
        // Check for collisions with other pieces
        for (let dy = 0; dy < piece.height; dy++) {
            for (let dx = 0; dx < piece.width; dx++) {
                const checkX = newX + dx;
                const checkY = newY + dy;
                
                if (this.board[checkY][checkX] !== null && 
                    this.board[checkY][checkX] !== piece.id) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    movePiece(piece, newX, newY) {
        // Clear old position
        for (let dy = 0; dy < piece.height; dy++) {
            for (let dx = 0; dx < piece.width; dx++) {
                this.board[piece.y + dy][piece.x + dx] = null;
            }
        }
        
        // Update piece position
        piece.x = newX;
        piece.y = newY;
        
        // Set new position
        for (let dy = 0; dy < piece.height; dy++) {
            for (let dx = 0; dx < piece.width; dx++) {
                this.board[piece.y + dy][piece.x + dx] = piece.id;
            }
        }
        
        this.moves++;
        this.renderBoard();
        this.updateUI();
        this.checkVictory();
        
        // Add celebration effect
        const pieceElement = document.querySelector(`[data-id="${piece.id}"]`);
        if (pieceElement) {
            pieceElement.classList.add('celebrate');
            setTimeout(() => {
                pieceElement.classList.remove('celebrate');
            }, 500);
        }
    }
    
    checkVictory() {
        const caocao = this.pieces.find(p => p.id === 'caocao');
        
        // Victory condition: Cao Cao at bottom center (position 1,3)
        if (caocao && caocao.x === 1 && caocao.y === 3) {
            this.gameWon();
        }
    }
    
    gameWon() {
        this.isGameActive = false;
        
        // Update best score
        const currentBest = this.bestScores[this.currentLevel];
        if (!currentBest || this.moves < currentBest) {
            this.bestScores[this.currentLevel] = this.moves;
            localStorage.setItem(`klotski-${this.currentLevel}-best`, this.moves);
            this.updateBestScore();
        }
        
        // Show victory message
        document.getElementById('finalMoves').textContent = this.moves;
        document.getElementById('finalTime').textContent = this.formatTime(this.gameTime);
        this.victoryMessage.style.display = 'block';
        
        // Add celebration effects
        this.createCelebrationParticles();
    }
    
    createCelebrationParticles() {
        // Simple celebration effect
        const colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1'];
        
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.style.position = 'fixed';
                particle.style.width = '10px';
                particle.style.height = '10px';
                particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                particle.style.borderRadius = '50%';
                particle.style.left = Math.random() * window.innerWidth + 'px';
                particle.style.top = '-10px';
                particle.style.zIndex = '9999';
                particle.style.pointerEvents = 'none';
                
                document.body.appendChild(particle);
                
                const animation = particle.animate([
                    { transform: 'translateY(0px) rotate(0deg)', opacity: 1 },
                    { transform: `translateY(${window.innerHeight + 20}px) rotate(360deg)`, opacity: 0 }
                ], {
                    duration: 3000,
                    easing: 'ease-out'
                });
                
                animation.onfinish = () => {
                    document.body.removeChild(particle);
                };
            }, i * 100);
        }
    }
    
    nextLevel() {
        const levels = ['easy', 'medium', 'hard'];
        const currentIndex = levels.indexOf(this.currentLevel);
        const nextIndex = (currentIndex + 1) % levels.length;
        
        this.currentLevel = levels[nextIndex];
        
        // Update difficulty selector
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.level === this.currentLevel) {
                btn.classList.add('active');
            }
        });
        
        this.hideVictory();
        this.initializeGame();
    }
    
    hideVictory() {
        this.victoryMessage.style.display = 'none';
    }
    
    resetGame() {
        this.initializeGame();
    }
    
    undoMove() {
        if (this.moveHistory.length > 0) {
            this.pieces = this.moveHistory.pop();
            this.createBoard();
            this.renderBoard();
            this.moves = Math.max(0, this.moves - 1);
            this.updateUI();
        }
    }
    
    showHint() {
        if (!this.isGameActive) return;
        
        // Simple hint: highlight a piece that can move
        const movablePieces = this.pieces.filter(piece => 
            this.getPossibleMoves(piece).length > 0
        );
        
        if (movablePieces.length > 0) {
            const randomPiece = movablePieces[Math.floor(Math.random() * movablePieces.length)];
            const pieceElement = document.querySelector(`[data-id="${randomPiece.id}"]`);
            
            if (pieceElement) {
                pieceElement.classList.add('pulse');
                setTimeout(() => {
                    pieceElement.classList.remove('pulse');
                }, 2000);
            }
        }
    }
    
    startTimer() {
        const timer = setInterval(() => {
            if (!this.isGameActive) {
                clearInterval(timer);
                return;
            }
            
            this.gameTime = Math.floor((Date.now() - this.startTime) / 1000);
            this.updateUI();
        }, 1000);
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    updateUI() {
        this.movesElement.textContent = this.moves;
        this.timeElement.textContent = this.formatTime(this.gameTime);
    }
    
    updateBestScore() {
        const best = this.bestScores[this.currentLevel];
        this.bestMovesElement.textContent = best ? best : '-';
    }
}

// Global game instance
let game;

// Initialize game when page loads
window.addEventListener('load', () => {
    game = new KlotskiPuzzle();
});

// Handle window resize
window.addEventListener('resize', () => {
    // Adjust board size for mobile
    const gameBoard = document.getElementById('gameBoard');
    if (window.innerWidth < 480) {
        gameBoard.style.transform = 'scale(0.8)';
    } else if (window.innerWidth < 768) {
        gameBoard.style.transform = 'scale(0.9)';
    } else {
        gameBoard.style.transform = 'scale(1)';
    }
});

// Trigger initial resize
window.dispatchEvent(new Event('resize'));