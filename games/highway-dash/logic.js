// Highway Dash Game Logic
// A three-lane racing game where players dodge obstacles and collect coins

// Game canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game settings
const LANE_WIDTH = 100;
const PLAYER_HEIGHT = 120;
const PLAYER_WIDTH = 70;
const OBSTACLE_WIDTH = 80;
const OBSTACLE_HEIGHT = 80;
const COIN_SIZE = 40;
const INITIAL_SPEED = 5;
const MAX_SPEED = 15;
const ACCELERATION = 0.001;
const LANE_POSITIONS = [canvas.width / 2 - LANE_WIDTH, canvas.width / 2, canvas.width / 2 + LANE_WIDTH];

// Game state
let score = 0;
let highScore = localStorage.getItem('highwayDashHighScore') || 0;
let speed = INITIAL_SPEED;
let gameOver = false;
let animationId;
let lastTimestamp = 0;

// Player state
const player = {
    x: LANE_POSITIONS[1] - PLAYER_WIDTH / 2,
    y: canvas.height - PLAYER_HEIGHT - 20,
    lane: 1, // 0: left, 1: center, 2: right
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    moving: false,
    targetX: 0
};

// Game objects
let obstacles = [];
let coins = [];

// Images
const playerImg = new Image();
playerImg.src = '/assets/images/games/highway-dash-car.svg';

const obstacleImg = new Image();
obstacleImg.src = '/assets/images/games/highway-dash-obstacle.svg';

const coinImg = new Image();
coinImg.src = '/assets/images/games/highway-dash-coin.svg';

const roadImg = new Image();
roadImg.src = '/assets/images/games/highway-dash-road.svg';

// Initialize game
function init() {
    // Reset game state
    score = 0;
    speed = INITIAL_SPEED;
    gameOver = false;
    obstacles = [];
    coins = [];
    player.lane = 1;
    player.x = LANE_POSITIONS[1] - PLAYER_WIDTH / 2;
    player.moving = false;
    
    // Update UI
    document.getElementById('score').textContent = score;
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('finalScore').textContent = '';
    
    // Start game loop
    lastTimestamp = performance.now();
    animationId = requestAnimationFrame(gameLoop);
}

// Game loop
function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw road background
    ctx.drawImage(roadImg, 0, 0, canvas.width, canvas.height);
    
    // Update player position if moving between lanes
    if (player.moving) {
        const targetX = LANE_POSITIONS[player.lane] - PLAYER_WIDTH / 2;
        const dx = targetX - player.x;
        if (Math.abs(dx) < 5) {
            player.x = targetX;
            player.moving = false;
        } else {
            player.x += dx * 0.2;
        }
    }
    
    // Draw player
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
    
    // Increase speed over time
    speed += ACCELERATION * deltaTime;
    if (speed > MAX_SPEED) speed = MAX_SPEED;
    
    // Generate obstacles and coins
    if (Math.random() < 0.02) {
        const lane = Math.floor(Math.random() * 3);
        obstacles.push({
            x: LANE_POSITIONS[lane] - OBSTACLE_WIDTH / 2,
            y: -OBSTACLE_HEIGHT,
            width: OBSTACLE_WIDTH,
            height: OBSTACLE_HEIGHT,
            lane: lane
        });
    }
    
    if (Math.random() < 0.01) {
        const lane = Math.floor(Math.random() * 3);
        coins.push({
            x: LANE_POSITIONS[lane] - COIN_SIZE / 2,
            y: -COIN_SIZE,
            size: COIN_SIZE,
            lane: lane
        });
    }
    
    // Update and draw obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        obstacle.y += speed;
        
        // Remove obstacles that are off-screen
        if (obstacle.y > canvas.height) {
            obstacles.splice(i, 1);
            continue;
        }
        
        // Draw obstacle
        ctx.drawImage(obstacleImg, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Check collision with player
        if (
            player.x < obstacle.x + obstacle.width &&
            player.x + player.width > obstacle.x &&
            player.y < obstacle.y + obstacle.height &&
            player.y + player.height > obstacle.y
        ) {
            gameOver = true;
            endGame();
            return;
        }
    }
    
    // Update and draw coins
    for (let i = coins.length - 1; i >= 0; i--) {
        const coin = coins[i];
        coin.y += speed;
        
        // Remove coins that are off-screen
        if (coin.y > canvas.height) {
            coins.splice(i, 1);
            continue;
        }
        
        // Draw coin
        ctx.drawImage(coinImg, coin.x, coin.y, coin.size, coin.size);
        
        // Check collision with player
        if (
            player.x < coin.x + coin.size &&
            player.x + player.width > coin.x &&
            player.y < coin.y + coin.size &&
            player.y + player.height > coin.y
        ) {
            // Collect coin
            coins.splice(i, 1);
            score += 10;
            document.getElementById('score').textContent = score;
        }
    }
    
    // Continue game loop
    if (!gameOver) {
        animationId = requestAnimationFrame(gameLoop);
    }
}

// End game
function endGame() {
    cancelAnimationFrame(animationId);
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highwayDashHighScore', highScore);
    }
    
    // Show game over screen
    document.getElementById('gameOverScreen').style.display = 'flex';
    document.getElementById('finalScore').textContent = score;
    document.getElementById('best').textContent = 'Best: ' + highScore;
}

// Event listeners
function handleKeyDown(e) {
    if (gameOver) return;
    
    if (e.key === 'ArrowLeft' && player.lane > 0) {
        player.lane--;
        player.moving = true;
    } else if (e.key === 'ArrowRight' && player.lane < 2) {
        player.lane++;
        player.moving = true;
    }
}

// Touch controls for mobile
let touchStartX = 0;
function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
}

function handleTouchEnd(e) {
    if (gameOver) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchEndX - touchStartX;
    
    // Swipe left
    if (diffX < -50 && player.lane > 0) {
        player.lane--;
        player.moving = true;
    }
    // Swipe right
    else if (diffX > 50 && player.lane < 2) {
        player.lane++;
        player.moving = true;
    }
}

// Restart button
document.getElementById('restartBtn').addEventListener('click', init);

// Add event listeners
document.addEventListener('keydown', handleKeyDown);
canvas.addEventListener('touchstart', handleTouchStart, false);
canvas.addEventListener('touchend', handleTouchEnd, false);

// Prevent scrolling when touching the canvas
canvas.addEventListener('touchmove', function(e) {
    e.preventDefault();
}, { passive: false });

// Resize canvas to fit window
function resizeCanvas() {
    canvas.width = Math.min(window.innerWidth, 500);
    canvas.height = Math.min(window.innerHeight - 200, 700);
    
    // Recalculate lane positions
    const laneWidth = canvas.width / 4;
    LANE_POSITIONS[0] = laneWidth;
    LANE_POSITIONS[1] = laneWidth * 2;
    LANE_POSITIONS[2] = laneWidth * 3;
    
    // Update player position
    player.x = LANE_POSITIONS[player.lane] - PLAYER_WIDTH / 2;
    player.y = canvas.height - PLAYER_HEIGHT - 20;
}

window.addEventListener('resize', resizeCanvas);

// Initialize canvas size and start game
resizeCanvas();
init();