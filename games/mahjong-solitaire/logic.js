class MahjongSolitaire {
    constructor() {
        this.board = [];
        this.selectedTile = null;
        this.matchedTiles = new Set();
        this.gameTime = 0;
        this.gameTimer = null;
        this.hintsRemaining = 3;
        this.matchCount = 0;
        this.moveHistory = [];
        this.isGameActive = false;
        
        // Mahjong tile types
        this.tileTypes = {
            // Dots (筒子)
            dots: ['🀙', '🀚', '🀛', '🀜', '🀝', '🀞', '🀟', '🀠', '🀡'],
            // Bamboo (条子)
            bamboo: ['🀐', '🀑', '🀒', '🀓', '🀔', '🀕', '🀖', '🀗', '🀘'],
            // Characters (万子)
            characters: ['🀇', '🀈', '🀉', '🀊', '🀋', '🀌', '🀍', '🀎', '🀏'],
            // Winds (风牌)
            winds: ['🀀', '🀁', '🀂', '🀃'],
            // Dragons (三元牌)
            dragons: ['🀄', '🀅', '🀆'],
            // Flowers (花牌)
            flowers: ['🀢', '🀣', '🀤', '🀥'],
            // Seasons (季牌)
            seasons: ['🀦', '🀧', '🀨', '🀩']
        };
        
        this.initializeGame();
    }
    
    initializeGame() {
        this.createBoard();
        this.renderBoard();
        this.startTimer();
        this.isGameActive = true;
        this.updateDisplay();
    }
    
    createBoard() {
        // Classic Turtle layout pattern
        const layout = [
            // Layer 0 (bottom)
            {layer: 0, positions: [
                [2,1], [3,1], [4,1], [5,1], [6,1], [7,1], [8,1], [9,1], [10,1], [11,1], [12,1], [13,1],
                [1,2], [2,2], [3,2], [4,2], [5,2], [6,2], [7,2], [8,2], [9,2], [10,2], [11,2], [12,2], [13,2], [14,2],
                [0,3], [1,3], [2,3], [3,3], [4,3], [5,3], [6,3], [7,3], [8,3], [9,3], [10,3], [11,3], [12,3], [13,3], [14,3], [15,3],
                [0,4], [1,4], [2,4], [3,4], [4,4], [5,4], [6,4], [7,4], [8,4], [9,4], [10,4], [11,4], [12,4], [13,4], [14,4], [15,4],
                [2,5], [3,5], [4,5], [5,5], [6,5], [7,5], [8,5], [9,5], [10,5], [11,5], [12,5], [13,5],
                [4,6], [5,6], [6,6], [7,6], [8,6], [9,6], [10,6], [11,6],
                [6,7], [7,7], [8,7], [9,7]
            ]},
            // Layer 1
            {layer: 1, positions: [
                [3,2], [4,2], [5,2], [6,2], [7,2], [8,2], [9,2], [10,2], [11,2], [12,2],
                [2,3], [3,3], [4,3], [5,3], [6,3], [7,3], [8,3], [9,3], [10,3], [11,3], [12,3], [13,3],
                [2,4], [3,4], [4,4], [5,4], [6,4], [7,4], [8,4], [9,4], [10,4], [11,4], [12,4], [13,4],
                [3,5], [4,5], [5,5], [6,5], [7,5], [8,5], [9,5], [10,5], [11,5], [12,5]
            ]},
            // Layer 2
            {layer: 2, positions: [
                [4,3], [5,3], [6,3], [7,3], [8,3], [9,3], [10,3], [11,3],
                [4,4], [5,4], [6,4], [7,4], [8,4], [9,4], [10,4], [11,4]
            ]},
            // Layer 3
            {layer: 3, positions: [
                [5,3], [6,3], [7,3], [8,3], [9,3], [10,3],
                [5,4], [6,4], [7,4], [8,4], [9,4], [10,4]
            ]},
            // Layer 4 (top)
            {layer: 4, positions: [
                [7,3], [8,3],
                [7,4], [8,4]
            ]}
        ];
        
        // Create tile deck
        const tiles = this.createTileDeck();
        this.shuffleArray(tiles);
        
        // Place tiles on board
        this.board = [];
        let tileIndex = 0;
        
        layout.forEach(layerData => {
            layerData.positions.forEach(([x, y]) => {
                if (tileIndex < tiles.length) {
                    this.board.push({
                        id: `tile-${tileIndex}`,
                        type: tiles[tileIndex],
                        x: x,
                        y: y,
                        layer: layerData.layer,
                        matched: false,
                        selected: false
                    });
                    tileIndex++;
                }
            });
        });
    }
    
    createTileDeck() {
        const tiles = [];
        
        // Add 4 copies of each regular tile
        Object.values(this.tileTypes).forEach(category => {
            if (category === this.tileTypes.flowers || category === this.tileTypes.seasons) {
                // Only one copy of each flower/season tile
                category.forEach(tile => tiles.push(tile));
            } else {
                // 4 copies of each other tile
                category.forEach(tile => {
                    for (let i = 0; i < 4; i++) {
                        tiles.push(tile);
                    }
                });
            }
        });
        
        return tiles;
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    renderBoard() {
        const boardElement = document.getElementById('mahjongBoard');
        boardElement.innerHTML = '';
        
        // Sort tiles by layer (bottom to top) for proper rendering
        const sortedTiles = [...this.board].sort((a, b) => a.layer - b.layer);
        
        sortedTiles.forEach(tile => {
            if (!tile.matched) {
                const tileElement = document.createElement('div');
                tileElement.className = 'tile';
                tileElement.id = tile.id;
                tileElement.textContent = tile.type;
                
                // Position tile
                const offsetX = tile.x * 25 + tile.layer * 2;
                const offsetY = tile.y * 30 + tile.layer * 2;
                tileElement.style.left = `${offsetX}px`;
                tileElement.style.top = `${offsetY}px`;
                tileElement.style.zIndex = tile.layer + 1;
                
                // Check if tile is free
                if (!this.isTileFree(tile)) {
                    tileElement.classList.add('blocked');
                } else {
                    tileElement.addEventListener('click', () => this.selectTile(tile));
                }
                
                if (tile.selected) {
                    tileElement.classList.add('selected');
                }
                
                boardElement.appendChild(tileElement);
            }
        });
    }
    
    isTileFree(tile) {
        // Check if tile is covered by another tile
        const coveredBy = this.board.find(t => 
            !t.matched && 
            t.layer === tile.layer + 1 && 
            Math.abs(t.x - tile.x) <= 1 && 
            Math.abs(t.y - tile.y) <= 1
        );
        
        if (coveredBy) return false;
        
        // Check if tile is blocked on both sides
        const leftBlocked = this.board.find(t => 
            !t.matched && 
            t.layer === tile.layer && 
            t.x === tile.x - 1 && 
            t.y === tile.y
        );
        
        const rightBlocked = this.board.find(t => 
            !t.matched && 
            t.layer === tile.layer && 
            t.x === tile.x + 1 && 
            t.y === tile.y
        );
        
        return !(leftBlocked && rightBlocked);
    }
    
    selectTile(tile) {
        if (!this.isGameActive || !this.isTileFree(tile)) return;
        
        if (this.selectedTile) {
            if (this.selectedTile.id === tile.id) {
                // Deselect same tile
                this.selectedTile.selected = false;
                this.selectedTile = null;
            } else if (this.canMatch(this.selectedTile, tile)) {
                // Match found
                this.matchTiles(this.selectedTile, tile);
            } else {
                // Select different tile
                this.selectedTile.selected = false;
                this.selectedTile = tile;
                tile.selected = true;
            }
        } else {
            // Select first tile
            this.selectedTile = tile;
            tile.selected = true;
        }
        
        this.renderBoard();
    }
    
    canMatch(tile1, tile2) {
        // Exact match
        if (tile1.type === tile2.type) return true;
        
        // Flower tiles can match with any flower
        if (this.tileTypes.flowers.includes(tile1.type) && 
            this.tileTypes.flowers.includes(tile2.type)) {
            return true;
        }
        
        // Season tiles can match with any season
        if (this.tileTypes.seasons.includes(tile1.type) && 
            this.tileTypes.seasons.includes(tile2.type)) {
            return true;
        }
        
        return false;
    }
    
    matchTiles(tile1, tile2) {
        // Save move for undo
        this.moveHistory.push({
            tile1: {...tile1},
            tile2: {...tile2}
        });
        
        // Mark tiles as matched
        tile1.matched = true;
        tile2.matched = true;
        tile1.selected = false;
        tile2.selected = false;
        
        this.selectedTile = null;
        this.matchCount++;
        
        // Add match animation
        this.animateMatch([tile1, tile2]);
        
        this.updateDisplay();
        this.checkWinCondition();
    }
    
    animateMatch(tiles) {
        tiles.forEach(tile => {
            const element = document.getElementById(tile.id);
            if (element) {
                element.style.transition = 'all 0.3s ease';
                element.style.transform = 'scale(1.2)';
                element.style.opacity = '0.5';
                
                setTimeout(() => {
                    element.style.transform = 'scale(0)';
                    element.style.opacity = '0';
                }, 150);
            }
        });
        
        setTimeout(() => this.renderBoard(), 300);
    }
    
    getHint() {
        if (this.hintsRemaining <= 0 || !this.isGameActive) return;
        
        const freeTiles = this.board.filter(tile => 
            !tile.matched && this.isTileFree(tile)
        );
        
        // Find matching pairs
        for (let i = 0; i < freeTiles.length; i++) {
            for (let j = i + 1; j < freeTiles.length; j++) {
                if (this.canMatch(freeTiles[i], freeTiles[j])) {
                    this.highlightHint([freeTiles[i], freeTiles[j]]);
                    this.hintsRemaining--;
                    this.updateDisplay();
                    return;
                }
            }
        }
        
        alert('No more matches available! Try shuffling.');
    }
    
    highlightHint(tiles) {
        tiles.forEach(tile => {
            const element = document.getElementById(tile.id);
            if (element) {
                element.style.animation = 'pulse 1s ease-in-out 3';
                setTimeout(() => {
                    element.style.animation = '';
                }, 3000);
            }
        });
    }
    
    shuffle() {
        if (!this.isGameActive) return;
        
        const remainingTiles = this.board.filter(tile => !tile.matched);
        const tileTypes = remainingTiles.map(tile => tile.type);
        this.shuffleArray(tileTypes);
        
        remainingTiles.forEach((tile, index) => {
            tile.type = tileTypes[index];
        });
        
        this.renderBoard();
    }
    
    undo() {
        if (this.moveHistory.length === 0 || !this.isGameActive) return;
        
        const lastMove = this.moveHistory.pop();
        
        // Find tiles and restore them
        const tile1 = this.board.find(t => t.id === lastMove.tile1.id);
        const tile2 = this.board.find(t => t.id === lastMove.tile2.id);
        
        if (tile1 && tile2) {
            tile1.matched = false;
            tile2.matched = false;
            this.matchCount--;
            this.updateDisplay();
            this.renderBoard();
        }
    }
    
    checkWinCondition() {
        const remainingTiles = this.board.filter(tile => !tile.matched);
        
        if (remainingTiles.length === 0) {
            this.isGameActive = false;
            this.stopTimer();
            setTimeout(() => {
                alert(`🎉 Congratulations! You completed the game in ${this.formatTime(this.gameTime)} with ${this.matchCount} matches!`);
            }, 500);
        } else {
            // Check if any moves are possible
            const freeTiles = remainingTiles.filter(tile => this.isTileFree(tile));
            let movesAvailable = false;
            
            for (let i = 0; i < freeTiles.length && !movesAvailable; i++) {
                for (let j = i + 1; j < freeTiles.length; j++) {
                    if (this.canMatch(freeTiles[i], freeTiles[j])) {
                        movesAvailable = true;
                        break;
                    }
                }
            }
            
            if (!movesAvailable) {
                alert('No more moves available! Try shuffling or start a new game.');
            }
        }
    }
    
    newGame() {
        this.stopTimer();
        this.gameTime = 0;
        this.matchCount = 0;
        this.hintsRemaining = 3;
        this.selectedTile = null;
        this.moveHistory = [];
        this.matchedTiles.clear();
        this.initializeGame();
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
        document.getElementById('tilesLeft').textContent = this.board.filter(tile => !tile.matched).length;
        document.getElementById('matchCount').textContent = this.matchCount;
        document.getElementById('hintCount').textContent = this.hintsRemaining;
    }
}

// Add CSS animation for hint pulse
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); box-shadow: 0 0 20px rgba(255, 215, 0, 0.8); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);

// Touch support for mobile
document.addEventListener('DOMContentLoaded', () => {
    let touchStartX, touchStartY;
    
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    });
    
    document.addEventListener('touchend', (e) => {
        if (!touchStartX || !touchStartY) return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        // If it's a tap (small movement), let the click handler deal with it
        if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
            return;
        }
        
        touchStartX = null;
        touchStartY = null;
    });
});