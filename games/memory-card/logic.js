class MemoryCard {
    constructor() {
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.startTime = null;
        this.timer = null;
        this.isPaused = false;
        this.isGameActive = false;
        this.difficulty = 'medium';
        this.hintUsed = false;
        
        this.difficulties = {
            easy: { rows: 3, cols: 4, pairs: 6 },
            medium: { rows: 4, cols: 4, pairs: 8 },
            hard: { rows: 4, cols: 6, pairs: 12 }
        };
        
        this.symbols = [
            '🎮', '🎯', '🎲', '🎪', '🎨', '🎭', '🎪', '🎸',
            '🚀', '🌟', '⭐', '🔥', '💎', '🏆', '🎊', '🎉',
            '🦄', '🐱', '🐶', '🐼', '🦊', '🐸', '🐧', '🦋',
            '🍎', '🍊', '🍋', '🍇', '🍓', '🍒', '🥝', '🍑'
        ];
        
        this.loadBestTimes();
        this.init();
    }
    
    init() {
        this.createBoard();
        this.updateDisplay();
        this.addEventListeners();
    }
    
    createBoard() {
        const config = this.difficulties[this.difficulty];
        const gameBoard = document.getElementById('gameBoard');
        
        gameBoard.className = `game-board ${this.difficulty}`;
        gameBoard.innerHTML = '';
        
        // Create card pairs
        const cardSymbols = [];
        for (let i = 0; i < config.pairs; i++) {
            cardSymbols.push(this.symbols[i], this.symbols[i]);
        }
        
        // Shuffle cards
        this.shuffleArray(cardSymbols);
        
        // Create card elements
        this.cards = [];
        cardSymbols.forEach((symbol, index) => {
            const card = {
                id: index,
                symbol: symbol,
                isFlipped: false,
                isMatched: false,
                element: this.createCardElement(symbol, index)
            };
            
            this.cards.push(card);
            gameBoard.appendChild(card.element);
        });
        
        // Reset game state
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.isGameActive = true;
        this.hintUsed = false;
        
        this.startTimer();
    }
    
    createCardElement(symbol, index) {
        const cardElement = document.createElement('div');
        cardElement.className = 'memory-card';
        cardElement.dataset.cardId = index;
        
        cardElement.innerHTML = `
            <div class="card-face card-front">${symbol}</div>
            <div class="card-face card-back"></div>
        `;
        
        cardElement.addEventListener('click', () => this.flipCard(index));
        
        // Touch support for mobile
        cardElement.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.flipCard(index);
        });
        
        return cardElement;
    }
    
    flipCard(cardId) {
        if (!this.isGameActive || this.isPaused) return;
        
        const card = this.cards[cardId];
        
        // Prevent flipping already flipped or matched cards
        if (card.isFlipped || card.isMatched) return;
        
        // Prevent flipping more than 2 cards
        if (this.flippedCards.length >= 2) return;
        
        // Flip the card
        card.isFlipped = true;
        card.element.classList.add('flipped');
        this.flippedCards.push(card);
        
        // Check for match when 2 cards are flipped
        if (this.flippedCards.length === 2) {
            this.moves++;
            this.updateDisplay();
            
            setTimeout(() => {
                this.checkMatch();
            }, 1000);
        }
    }
    
    checkMatch() {
        const [card1, card2] = this.flippedCards;
        
        if (card1.symbol === card2.symbol) {
            // Match found
            card1.isMatched = true;
            card2.isMatched = true;
            card1.element.classList.add('matched');
            card2.element.classList.add('matched');
            
            this.matchedPairs++;
            this.updateDisplay();
            
            // Check if game is complete
            if (this.matchedPairs === this.difficulties[this.difficulty].pairs) {
                this.gameComplete();
            }
        } else {
            // No match - flip cards back
            card1.isFlipped = false;
            card2.isFlipped = false;
            card1.element.classList.remove('flipped');
            card2.element.classList.remove('flipped');
        }
        
        this.flippedCards = [];
    }
    
    startTimer() {
        this.startTime = Date.now();
        this.timer = setInterval(() => {
            if (!this.isPaused && this.isGameActive) {
                this.updateTimer();
            }
        }, 1000);
    }
    
    updateTimer() {
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        document.getElementById('timer').textContent = `${minutes}:${seconds}`;
    }
    
    updateDisplay() {
        document.getElementById('moves').textContent = this.moves;
        document.getElementById('matches').textContent = this.matchedPairs;
        
        const bestTime = this.getBestTime();
        document.getElementById('bestTime').textContent = bestTime || '--:--';
    }
    
    gameComplete() {
        this.isGameActive = false;
        clearInterval(this.timer);
        
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        const timeString = `${minutes}:${seconds}`;
        
        document.getElementById('finalTime').textContent = timeString;
        document.getElementById('finalMoves').textContent = this.moves;
        
        // Check for new best time
        const isNewRecord = this.saveBestTime(elapsed);
        if (isNewRecord) {
            document.getElementById('newRecord').style.display = 'block';
        } else {
            document.getElementById('newRecord').style.display = 'none';
        }
        
        document.getElementById('gameComplete').style.display = 'block';
        
        // Add celebration animation
        this.celebrateWin();
    }
    
    celebrateWin() {
        const stars = document.querySelectorAll('.star');
        stars.forEach((star, index) => {
            setTimeout(() => {
                star.style.animationDelay = `${index * 0.2}s`;
            }, index * 200);
        });
        
        // Add confetti effect
        this.createConfetti();
    }
    
    createConfetti() {
        const colors = ['#f1c40f', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6'];
        
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.style.cssText = `
                    position: fixed;
                    top: -10px;
                    left: ${Math.random() * 100}%;
                    width: 10px;
                    height: 10px;
                    background: ${colors[Math.floor(Math.random() * colors.length)]};
                    z-index: 1000;
                    animation: confetti-fall 3s linear forwards;
                `;
                
                document.body.appendChild(confetti);
                
                setTimeout(() => {
                    confetti.remove();
                }, 3000);
            }, i * 50);
        }
        
        // Add confetti animation
        if (!document.getElementById('confetti-style')) {
            const style = document.createElement('style');
            style.id = 'confetti-style';
            style.textContent = `
                @keyframes confetti-fall {
                    to {
                        transform: translateY(100vh) rotate(360deg);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    showHint() {
        if (!this.isGameActive || this.hintUsed) {
            alert('Hint not available!');
            return;
        }
        
        // Find two unmatched cards with the same symbol
        const unmatchedCards = this.cards.filter(card => !card.isMatched && !card.isFlipped);
        const symbolGroups = {};
        
        unmatchedCards.forEach(card => {
            if (!symbolGroups[card.symbol]) {
                symbolGroups[card.symbol] = [];
            }
            symbolGroups[card.symbol].push(card);
        });
        
        // Find a pair to hint
        for (const symbol in symbolGroups) {
            if (symbolGroups[symbol].length >= 2) {
                const [card1, card2] = symbolGroups[symbol];
                
                // Briefly show the cards
                card1.element.classList.add('flipped');
                card2.element.classList.add('flipped');
                
                setTimeout(() => {
                    card1.element.classList.remove('flipped');
                    card2.element.classList.remove('flipped');
                }, 1500);
                
                this.hintUsed = true;
                break;
            }
        }
    }
    
    pauseGame() {
        if (!this.isGameActive) return;
        
        this.isPaused = !this.isPaused;
        const pauseBtn = document.querySelector('.btn.secondary');
        
        if (this.isPaused) {
            pauseBtn.textContent = 'Resume';
            // Hide all cards during pause
            this.cards.forEach(card => {
                if (!card.isMatched) {
                    card.element.style.visibility = 'hidden';
                }
            });
        } else {
            pauseBtn.textContent = 'Pause';
            // Show all cards when resumed
            this.cards.forEach(card => {
                card.element.style.visibility = 'visible';
            });
        }
    }
    
    newGame() {
        clearInterval(this.timer);
        document.getElementById('gameComplete').style.display = 'none';
        this.isPaused = false;
        document.querySelector('.btn.secondary').textContent = 'Pause';
        this.createBoard();
    }
    
    changeDifficulty(newDifficulty) {
        this.difficulty = newDifficulty;
        this.newGame();
    }
    
    getBestTime() {
        const bestTimes = JSON.parse(localStorage.getItem('memoryCardBestTimes') || '{}');
        const bestSeconds = bestTimes[this.difficulty];
        
        if (bestSeconds) {
            const minutes = Math.floor(bestSeconds / 60).toString().padStart(2, '0');
            const seconds = (bestSeconds % 60).toString().padStart(2, '0');
            return `${minutes}:${seconds}`;
        }
        
        return null;
    }
    
    saveBestTime(timeInSeconds) {
        const bestTimes = JSON.parse(localStorage.getItem('memoryCardBestTimes') || '{}');
        const currentBest = bestTimes[this.difficulty];
        
        if (!currentBest || timeInSeconds < currentBest) {
            bestTimes[this.difficulty] = timeInSeconds;
            localStorage.setItem('memoryCardBestTimes', JSON.stringify(bestTimes));
            return true;
        }
        
        return false;
    }
    
    loadBestTimes() {
        // Initialize best times if not exists
        if (!localStorage.getItem('memoryCardBestTimes')) {
            localStorage.setItem('memoryCardBestTimes', '{}');
        }
    }
    
    resetStats() {
        if (confirm('Are you sure you want to reset all best times?')) {
            localStorage.setItem('memoryCardBestTimes', '{}');
            this.updateDisplay();
            alert('Statistics reset successfully!');
        }
    }
    
    addEventListeners() {
        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.pauseGame();
            } else if (e.code === 'KeyN') {
                this.newGame();
            } else if (e.code === 'KeyH') {
                this.showHint();
            }
        });
        
        // Prevent context menu on cards for mobile
        document.addEventListener('contextmenu', (e) => {
            if (e.target.closest('.memory-card')) {
                e.preventDefault();
            }
        });
        
        // Handle visibility change (tab switching)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isGameActive && !this.isPaused) {
                this.pauseGame();
            }
        });
    }
}

// Global functions
function changeDifficulty() {
    const difficulty = document.getElementById('difficulty').value;
    game.changeDifficulty(difficulty);
}

function newGame() {
    game.newGame();
}

function pauseGame() {
    game.pauseGame();
}

function showHint() {
    game.showHint();
}

function resetStats() {
    game.resetStats();
}

// Initialize game
let game;
window.addEventListener('load', () => {
    game = new MemoryCard();
});

// Mobile optimization
if ('ontouchstart' in window) {
    // Prevent zoom on double tap
    document.addEventListener('touchend', (e) => {
        const now = new Date().getTime();
        const timeSince = now - (window.lastTouchEnd || 0);
        
        if (timeSince < 300 && timeSince > 0) {
            e.preventDefault();
        }
        
        window.lastTouchEnd = now;
    });
    
    // Add haptic feedback for mobile devices
    document.addEventListener('DOMContentLoaded', () => {
        const cards = document.querySelectorAll('.memory-card');
        cards.forEach(card => {
            card.addEventListener('touchstart', () => {
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
            });
        });
    });
}

// Performance optimization
if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
        // Preload symbols for better performance
        game.symbols.forEach(symbol => {
            const span = document.createElement('span');
            span.textContent = symbol;
            span.style.visibility = 'hidden';
            span.style.position = 'absolute';
            document.body.appendChild(span);
            setTimeout(() => span.remove(), 100);
        });
    });
}