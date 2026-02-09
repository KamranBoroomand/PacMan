const canvas = document.getElementById("canvas");
const canvasContext = canvas.getContext("2d");
// ---------- Responsive canvas scaling (fits any screen) ----------
let renderScale = 1;
let dpr = 1;

// How many tile-rows below the map you use for HUD (score/lives).
// Your code draws at y = oneBlockSize*(map.length + 1), so 2 is safe.
const HUD_ROWS = 2;
let logicalW = 0;
let logicalH = 0;

function validateMapRectangular() {
  if (!Array.isArray(map) || map.length === 0) throw new Error("Map is empty.");
  const cols = map[0].length;
  for (let r = 0; r < map.length; r++) {
    if (!Array.isArray(map[r]) || map[r].length !== cols) {
      throw new Error(`Map row ${r} has length ${map[r]?.length}, expected ${cols}.`);
    }
  }
  return { rows: map.length, cols };
}

function resizeCanvasToFitViewport() {
  const { rows, cols } = validateMapRectangular();

  dpr = window.devicePixelRatio || 1;

  // Logical (game) size in your coordinate system (unscaled).
  logicalW = cols * oneBlockSize;
  logicalH = (rows + HUD_ROWS) * oneBlockSize;

  // Available viewport space for the canvas (tune header guess if needed).
  const padding = 24;
  const headerGuess = 140; // space for your header/title; adjust if needed
  const availW = Math.max(320, window.innerWidth - padding);
  const availH = Math.max(320, window.innerHeight - headerGuess);

  // Never upscale above 1 (keeps pixel-art crisp and gameplay consistent).
  renderScale = Math.min(availW / logicalW, availH / logicalH, 1);

  // CSS size (what the user sees).
  const cssW = Math.floor(logicalW * renderScale);
  const cssH = Math.floor(logicalH * renderScale);

  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;

  // Actual backing store size (sharp on Retina/HiDPI).
  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);

  // Scale drawing so all your existing drawing code keeps working unchanged.
  canvasContext.setTransform(dpr * renderScale, 0, 0, dpr * renderScale, 0, 0);
  canvasContext.imageSmoothingEnabled = false;
}

window.addEventListener("resize", () => {
  // Refit on resize/orientation changes
  resizeCanvasToFitViewport();
});

const pacmanFrames = document.getElementById("animation");
const ghostFrames = document.getElementById("ghosts");

let createRect = (x, y, width, height, color) => {
    canvasContext.fillStyle = color;
    canvasContext.fillRect(x, y, width, height);
};

const DIRECTION_RIGHT = 4;
const DIRECTION_UP = 3;
const DIRECTION_LEFT = 2;
const DIRECTION_BOTTOM = 1;
let lives = 3;
let ghostCount = 4;
let ghostImageLocations = [
    { x: 0, y: 0 },
    { x: 176, y: 0 },
    { x: 0, y: 121 },
    { x: 176, y: 121 },
];

// Game variables
let fps = 30;
let pacman;
let oneBlockSize = 20;
let score = 0;
let ghosts = [];
let ghostsc = [];
let ghostsr = [];
let wallSpaceWidth = oneBlockSize / 1.6;
let wallOffset = (oneBlockSize - wallSpaceWidth) / 2;
let wallInnerColor = "black";
const FRUIT_SPAWN_DELAY_MS = 12000;
const FRUIT_VISIBLE_MS = 10000;
const FRUIT_INVINCIBILITY_MS = 8000;
const FRUIT_SCORE = 50;
const GHOST_EAT_BASE_SCORE = 20;
let invincibleUntil = 0;
let ghostEatChain = 0;
let fruit = {
  active: false,
  x: 0,
  y: 0,
  expiresAt: 0,
  nextSpawnAt: Date.now() + FRUIT_SPAWN_DELAY_MS,
};

// Legend:
// 1 = wall, 2 = pellet, 4 = power pellet, 0 = empty path
// Classic Pac-Man layout (28 columns x 31 rows)
const classicMap = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,1,2,1,1,1,2,1],
  [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
  [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0],
  [1,1,1,1,1,1,2,1,1,0,1,1,1,0,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,1,1,0,1,1,1,0,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,1,1,0,1,1,1,0,1,1,1,1,0,1,1,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,0,1,1,1,0,1,1,1,1,0,1,1,2,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
  [0,0,0,0,0,1,2,1,1,0,1,1,1,0,1,1,1,1,0,1,1,2,1,0,0,0,0,0],
  [1,1,1,1,1,1,2,1,1,0,1,1,1,0,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,2,1,2,1],
  [1,2,2,2,1,2,2,2,2,0,0,0,0,0,0,0,0,0,0,2,2,2,2,2,1,2,2,1],
  [1,1,1,2,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// Create the central vertical corridor leading to the spawn area
for (let y = 18; y <= 26; y++) {
  classicMap[y][13] = 2;
  classicMap[y][14] = 2;
}

const pacmanStart = { x: 13, y: 23 };

// Place the four power pellets in the classic corners
classicMap[1][1] = 4;
classicMap[1][26] = 4;
classicMap[26][1] = 4;
classicMap[26][26] = 4;

// Clear Pac-Man's start tile (no pellet on spawn)
classicMap[pacmanStart.y][pacmanStart.x] = 0;
classicMap[pacmanStart.y][pacmanStart.x + 1] = 0;

const cloneClassicMap = () => classicMap.map((row) => row.slice());

// Live map instance (coins get consumed during play)
let map = cloneClassicMap();
// Fit canvas to screen once map is available

resizeCanvasToFitViewport();

// ---------- Random spawn helpers ----------

// A tile is walkable if it is not a wall (map value !== 1).
// In your game: 1 = wall, 2 = pellet, 0/3 = empty-ish (depends on your code).
function isWalkableTile(tileY, tileX) {
  // Bounds check
  if (tileY < 0 || tileY >= map.length) return false;
  if (tileX < 0 || tileX >= map[0].length) return false;

  return map[tileY][tileX] !== 1;
}

// Pick random walkable tile.
// Optionally restrict to a rectangle region (minX..maxX, minY..maxY) in TILE coordinates.
function getRandomWalkableTile(options = {}) {
  const {
    minX = 0,
    maxX = map[0].length - 1,
    minY = 0,
    maxY = map.length - 1,
    maxTries = 5000,
    forbidden = new Set(), // e.g., "x,y" strings
  } = options;

  for (let t = 0; t < maxTries; t++) {
    const x = Math.floor(Math.random() * (maxX - minX + 1)) + minX;
    const y = Math.floor(Math.random() * (maxY - minY + 1)) + minY;

    if (!isWalkableTile(y, x)) continue;

    const key = `${x},${y}`;
    if (forbidden.has(key)) continue;

    return { x, y };
  }

  // If we couldn't find a tile, fall back to (1,1)
  return { x: 1, y: 1 };
}

function getRandomReachableTile(options = {}) {
  const {
    minX = 0,
    maxX = map[0].length - 1,
    minY = 0,
    maxY = map.length - 1,
    forbidden = new Set(),
  } = options;

  if (!pacman || typeof pacman.getMapX !== "function") {
    return getRandomWalkableTile(options);
  }

  const startX = pacman.getMapX();
  const startY = pacman.getMapY();
  if (!isWalkableTile(startY, startX)) {
    return getRandomWalkableTile(options);
  }

  const visited = new Set();
  const queue = [{ x: startX, y: startY }];
  const reachableTiles = [];

  while (queue.length > 0) {
    const current = queue.shift();
    const key = `${current.x},${current.y}`;
    if (visited.has(key)) continue;
    visited.add(key);

    if (!isWalkableTile(current.y, current.x)) continue;

    if (
      current.x >= minX &&
      current.x <= maxX &&
      current.y >= minY &&
      current.y <= maxY
    ) {
      reachableTiles.push({ x: current.x, y: current.y });
    }

    queue.push({ x: current.x - 1, y: current.y });
    queue.push({ x: current.x + 1, y: current.y });
    queue.push({ x: current.x, y: current.y - 1 });
    queue.push({ x: current.x, y: current.y + 1 });
  }

  if (reachableTiles.length === 0) {
    return getRandomWalkableTile(options);
  }

  const preferredTiles = reachableTiles.filter((tile) => {
    const key = `${tile.x},${tile.y}`;
    return !forbidden.has(key);
  });

  const nonPacmanTiles = reachableTiles.filter(
    (tile) => !(tile.x === startX && tile.y === startY)
  );
  const candidates =
    preferredTiles.length > 0
      ? preferredTiles
      : nonPacmanTiles.length > 0
      ? nonPacmanTiles
      : reachableTiles;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function hasRemainingFood() {
  for (let i = 0; i < map.length; i++) {
    for (let j = 0; j < map[0].length; j++) {
      if (map[i][j] === 2 || map[i][j] === 4) {
        return true;
      }
    }
  }
  return false;
}

function resetMap() {
  map = cloneClassicMap();
}

function isPacmanInvincible() {
  return Date.now() < invincibleUntil;
}

function resetFruitState() {
  fruit.active = false;
  fruit.expiresAt = 0;
  fruit.nextSpawnAt = Date.now() + FRUIT_SPAWN_DELAY_MS;
  invincibleUntil = 0;
  ghostEatChain = 0;
}

function spawnFruit() {
  if (!pacman) return;

  const forbidden = new Set();
  forbidden.add(`${pacman.getMapX()},${pacman.getMapY()}`);
  for (let i = 0; i < ghosts.length; i++) {
    forbidden.add(`${ghosts[i].getMapX()},${ghosts[i].getMapY()}`);
  }

  const tile = getRandomReachableTile({
    minX: 1,
    maxX: map[0].length - 2,
    minY: 1,
    maxY: map.length - 2,
    forbidden,
  });

  fruit.active = true;
  fruit.x = tile.x;
  fruit.y = tile.y;
  fruit.expiresAt = Date.now() + FRUIT_VISIBLE_MS;
}

function updateFruitState() {
  const now = Date.now();

  if (now >= invincibleUntil) {
    ghostEatChain = 0;
  }

  if (fruit.active && now >= fruit.expiresAt) {
    fruit.active = false;
    fruit.expiresAt = 0;
    fruit.nextSpawnAt = now + FRUIT_SPAWN_DELAY_MS;
  }

  if (!fruit.active && now >= fruit.nextSpawnAt && hasRemainingFood()) {
    spawnFruit();
  }
}

function tryConsumeFruit() {
  if (!fruit.active) return;
  if (pacman.getMapX() !== fruit.x || pacman.getMapY() !== fruit.y) return;

  fruit.active = false;
  fruit.expiresAt = 0;
  fruit.nextSpawnAt = Date.now() + FRUIT_SPAWN_DELAY_MS;
  score += FRUIT_SCORE;
  invincibleUntil = Date.now() + FRUIT_INVINCIBILITY_MS;
  ghostEatChain = 0;
}

function getCollidingGhostIndices() {
  const collidingIndices = [];
  const pacmanTileX = pacman.getMapX();
  const pacmanTileY = pacman.getMapY();

  for (let i = 0; i < ghosts.length; i++) {
    if (
      ghosts[i].getMapX() === pacmanTileX &&
      ghosts[i].getMapY() === pacmanTileY
    ) {
      collidingIndices.push(i);
    }
  }

  return collidingIndices;
}

function respawnGhostAtRandomTile(ghostIndex) {
  const ghost = ghosts[ghostIndex];
  if (!ghost) return;

  const forbidden = new Set();
  forbidden.add(`${pacman.getMapX()},${pacman.getMapY()}`);
  if (fruit.active) {
    forbidden.add(`${fruit.x},${fruit.y}`);
  }
  for (let i = 0; i < ghosts.length; i++) {
    if (i === ghostIndex) continue;
    forbidden.add(`${ghosts[i].getMapX()},${ghosts[i].getMapY()}`);
  }

  const tile = getRandomReachableTile({
    minX: 1,
    maxX: map[0].length - 2,
    minY: 1,
    maxY: map.length - 2,
    forbidden,
  });

  ghost.x = tile.x * oneBlockSize;
  ghost.y = tile.y * oneBlockSize;
  ghost.direction = DIRECTION_RIGHT;
  ghost.randomTargetIndex = parseInt(
    Math.random() * randomTargetsForGhosts.length
  );
  ghost.target = randomTargetsForGhosts[ghost.randomTargetIndex];
}

function eatCollidingGhosts(collidingIndices) {
  const uniqueIndices = [...new Set(collidingIndices)];
  for (let i = 0; i < uniqueIndices.length; i++) {
    const points = GHOST_EAT_BASE_SCORE * Math.pow(2, ghostEatChain);
    score += points;
    ghostEatChain = Math.min(ghostEatChain + 1, 6);
    respawnGhostAtRandomTile(uniqueIndices[i]);
  }
}

let randomTargetsForGhosts = [
    { x: 1 * oneBlockSize, y: 1 * oneBlockSize },
    { x: 1 * oneBlockSize, y: (map.length - 2) * oneBlockSize },
    { x: (map[0].length - 2) * oneBlockSize, y: oneBlockSize },
    {
        x: (map[0].length - 2) * oneBlockSize,
        y: (map.length - 2) * oneBlockSize,
    },
];

let randomTargetsForGhostsc = [
    { x: 1 * oneBlockSize, y: 1 * oneBlockSize },
    { x: 1 * oneBlockSize, y: (map.length - 2) * oneBlockSize },
    { x: (map[0].length - 2) * oneBlockSize, y: oneBlockSize },
    {
        x: (map[0].length - 2) * oneBlockSize,
        y: (map.length - 2) * oneBlockSize,
    },
];

let randomTargetsForGhostsr = [
    { x: 1 * oneBlockSize, y: 1 * oneBlockSize },
    { x: 1 * oneBlockSize, y: (map.length - 2) * oneBlockSize },
    { x: (map[0].length - 2) * oneBlockSize, y: oneBlockSize },
    {
        x: (map[0].length - 2) * oneBlockSize,
        y: (map.length - 2) * oneBlockSize,
    },
];
// for (let i = 0; i < map.length; i++) {
//     for (let j = 0; j < map[0].length; j++) {
//         map[i][j] = 2;
//     }
// }

let createNewPacman = () => {
    pacman = new Pacman(
        pacmanStart.x * oneBlockSize,
        pacmanStart.y * oneBlockSize,
        oneBlockSize,
        oneBlockSize,
        oneBlockSize / 5
    );
};

let gameLoop = () => {
    update();
    draw();
};

/*let gameInterval = setInterval(gameLoop, 1000 / fps);//Speed of the game
*/
let gameInterval;

function startGame() {
  resizeCanvasToFitViewport();
  if (gameInterval) clearInterval(gameInterval);
  gameInterval = setInterval(gameLoop, 1000 / fps);
}

let restartPacmanAndGhosts = () => {
    if (pacman && typeof pacman.dispose === "function") {
      pacman.dispose();
    }
    for (let i = 0; i < ghosts.length; i++) {
      if (ghosts[i] && typeof ghosts[i].dispose === "function") {
        ghosts[i].dispose();
      }
    }
    ghosts = [];
    createNewPacman();
    createGhosts();
};

let onGhostCollision = () => {
  lives--;
  resetFruitState();

  if (lives <= 0) {
    alert("Game Over!\nPress 'OK' to restart.\nYour Score: " + score);

    // Choose one:
    lives = 3;     // classic restart lives
    // lives = 999; // "unlimited life" feel (your call)

    score = 0;
    resetMap();
  }

  restartPacmanAndGhosts();
};

let onLevelComplete = () => {
  alert("You cleared the maze!\nPress 'OK' for the next round.\nScore: " + score);
  resetMap();
  resetFruitState();
  restartPacmanAndGhosts();
};

/*let update = () => {
    pacman.moveProcess();
    pacman.eat();
    updateGhosts();
    if (pacman.checkGhostCollision(ghosts)) {
        onGhostCollision();
    }
    if (pacman.checkGhostCollision(ghostsc)) {
        onGhostCollision();
    }
    if (pacman.checkGhostCollision(ghostsr)) {
        onGhostCollision();
    }
};
*/

let update = () => {
  pacman.moveProcess();
  pacman.eat();
  updateFruitState();
  tryConsumeFruit();
  updateGhosts();

  const collidingGhostIndices = getCollidingGhostIndices();
  if (collidingGhostIndices.length > 0) {
    if (isPacmanInvincible()) {
      eatCollidingGhosts(collidingGhostIndices);
    } else {
      onGhostCollision();
      return;
    }
  }

  if (!hasRemainingFood()) {
    onLevelComplete();
  }
};

let drawFoods = () => {
    for (let i = 0; i < map.length; i++) {
        for (let j = 0; j < map[0].length; j++) {
          if (map[i][j] === 2 || map[i][j] === 4) {
            const isPowerPellet = map[i][j] === 4;
            const size = isPowerPellet ? oneBlockSize * 0.6 : oneBlockSize / 3;
            const offset = (oneBlockSize - size) / 2;
            createRect(
              j * oneBlockSize + offset,
              i * oneBlockSize + offset,
              size,
              size,
              isPowerPellet ? "#F7FF8A" : "#FEB897"
            );
          }
        }
    }
};

let drawFruit = () => {
    if (!fruit.active) return;

    const tileX = fruit.x * oneBlockSize;
    const tileY = fruit.y * oneBlockSize;
    const cherryRadius = oneBlockSize * 0.22;
    const centerY = tileY + oneBlockSize * 0.62;
    const centerLeftX = tileX + oneBlockSize * 0.40;
    const centerRightX = tileX + oneBlockSize * 0.63;

    canvasContext.strokeStyle = "#68D98E";
    canvasContext.lineWidth = Math.max(2, oneBlockSize * 0.08);
    canvasContext.beginPath();
    canvasContext.moveTo(centerLeftX, centerY - cherryRadius);
    canvasContext.quadraticCurveTo(
      tileX + oneBlockSize * 0.43,
      tileY + oneBlockSize * 0.08,
      tileX + oneBlockSize * 0.50,
      tileY + oneBlockSize * 0.28
    );
    canvasContext.moveTo(centerRightX, centerY - cherryRadius);
    canvasContext.quadraticCurveTo(
      tileX + oneBlockSize * 0.71,
      tileY + oneBlockSize * 0.14,
      tileX + oneBlockSize * 0.54,
      tileY + oneBlockSize * 0.28
    );
    canvasContext.stroke();

    canvasContext.fillStyle = "#FF2E59";
    canvasContext.beginPath();
    canvasContext.arc(centerLeftX, centerY, cherryRadius, 0, 2 * Math.PI);
    canvasContext.arc(centerRightX, centerY, cherryRadius, 0, 2 * Math.PI);
    canvasContext.fill();

    canvasContext.fillStyle = "#FFDDE5";
    const shineRadius = cherryRadius * 0.35;
    canvasContext.beginPath();
    canvasContext.arc(
      centerLeftX - cherryRadius * 0.35,
      centerY - cherryRadius * 0.3,
      shineRadius,
      0,
      2 * Math.PI
    );
    canvasContext.arc(
      centerRightX - cherryRadius * 0.35,
      centerY - cherryRadius * 0.3,
      shineRadius,
      0,
      2 * Math.PI
    );
    canvasContext.fill();
};

let drawRemainingLives = () => {
    canvasContext.font = "20px Emulogic";
    canvasContext.fillStyle = "white";
    canvasContext.fillText("Lives: ", 220, oneBlockSize * (map.length + 1));

    for (let i = 0; i < lives; i++) {
        canvasContext.drawImage(
            pacmanFrames,
            2 * oneBlockSize,
            0,
            oneBlockSize,
            oneBlockSize,
            350 + i * oneBlockSize,
            oneBlockSize * map.length + 2,
            oneBlockSize,
            oneBlockSize
        );
    }
};

let drawScore = () => {
    canvasContext.font = "20px Emulogic";
    canvasContext.fillStyle = "white";
    canvasContext.fillText(
        "Score: " + score,
        0,
        oneBlockSize * (map.length + 1)
    );
};

let drawPowerModeStatus = () => {
    if (!isPacmanInvincible()) return;

    const remainingMs = Math.max(0, invincibleUntil - Date.now());
    const remainingSeconds = Math.ceil(remainingMs / 1000);
    canvasContext.font = "16px Emulogic";
    canvasContext.fillStyle = "#78F7FF";
    canvasContext.fillText(
        "POWER: " + remainingSeconds + "s",
        0,
        oneBlockSize * (map.length + 1.8)
    );
};

let draw = () => {
  // Clear the *logical* canvas (important when using setTransform with scaling)
  canvasContext.clearRect(0, 0, logicalW, logicalH);

  // Paint background in logical units (do NOT use canvas.width/height here)
  createRect(0, 0, logicalW, logicalH, "black");

  drawWalls();
  drawFoods();
  drawFruit();
  drawGhosts();
  pacman.draw();
  drawScore();
  drawRemainingLives();
  drawPowerModeStatus();
};


/*draw walls*/
let drawWalls = () => {
    for (let i = 0; i < map.length; i++) {
        for (let j = 0; j < map[0].length; j++) {
            if (map[i][j] == 1) {
                createRect(
                    j * oneBlockSize,
                    i * oneBlockSize,
                    oneBlockSize,
                    oneBlockSize,
                    "#342DCA"
                );
                if (j > 0 && map[i][j - 1] == 1) {
                    createRect(
                        j * oneBlockSize,
                        i * oneBlockSize + wallOffset,
                        wallSpaceWidth + wallOffset,
                        wallSpaceWidth,
                        wallInnerColor
                    );
                }

                if (j < map[0].length - 1 && map[i][j + 1] == 1) {
                    createRect(
                        j * oneBlockSize + wallOffset,
                        i * oneBlockSize + wallOffset,
                        wallSpaceWidth + wallOffset,
                        wallSpaceWidth,
                        wallInnerColor
                    );
                }

                if (i < map.length - 1 && map[i + 1][j] == 1) {
                    createRect(
                        j * oneBlockSize + wallOffset,
                        i * oneBlockSize + wallOffset,
                        wallSpaceWidth,
                        wallSpaceWidth + wallOffset,
                        wallInnerColor
                    );
                }

                if (i > 0 && map[i - 1][j] == 1) {
                    createRect(
                        j * oneBlockSize + wallOffset,
                        i * oneBlockSize,
                        wallSpaceWidth,
                        wallSpaceWidth + wallOffset,
                        wallInnerColor
                    );
                }
            }
        }
    }
};

/*drawing ghosts*/
/*let createGhosts = () => {
    ghosts = [];
    for (let i = 0; i < ghostCount * 2; i++) {
        let newGhost = new Ghost(
            1 * oneBlockSize + (i % 2 == 0 ? 0 : 1) * oneBlockSize,
            19 * oneBlockSize + (i % 2 == 0 ? 0 : 1) * oneBlockSize,
            oneBlockSize,
            oneBlockSize,
            pacman.speed / 2,
            ghostImageLocations[i % 4].x,
            ghostImageLocations[i % 4].y,
            124,
            116,
            6 + i
        );
        ghosts.push(newGhost);
    }
    ghostsc = [];
    for (let i = 0; i < ghostCount * 2; i++) {
        let newGhost = new Ghost(
            46 * oneBlockSize + (i % 2 == 0 ? 0 : 1) * oneBlockSize,
            19 * oneBlockSize + (i % 2 == 0 ? 0 : 1) * oneBlockSize,
            oneBlockSize,
            oneBlockSize,
            pacman.speed / 2,
            ghostImageLocations[i % 4].x,
            ghostImageLocations[i % 4].y,
            124,
            116,
            6 + i
        );
        ghosts.push(newGhost);
    }

    ghostsr = [];
    for (let i = 0; i < ghostCount * 2; i++) {
        let newGhost = new Ghost(
            92 * oneBlockSize + (i % 2 == 0 ? 0 : 1) * oneBlockSize,
            19 * oneBlockSize + (i % 2 == 0 ? 0 : 1) * oneBlockSize,
            oneBlockSize,
            oneBlockSize,
            pacman.speed / 2,
            ghostImageLocations[i % 4].x,
            ghostImageLocations[i % 4].y,
            124,
            116,
            6 + i
        );
        ghosts.push(newGhost);
    }
};

*/


let createGhosts = () => {
  for (let i = 0; i < ghosts.length; i++) {
    if (ghosts[i] && typeof ghosts[i].dispose === "function") {
      ghosts[i].dispose();
    }
  }
  ghosts = [];

  const forbidden = new Set();
  forbidden.add(`${pacmanStart.x},${pacmanStart.y}`);

  for (let i = 0; i < ghostCount; i++) {
    const tile = getRandomReachableTile({
      minX: 1,
      maxX: map[0].length - 2,
      minY: 1,
      maxY: map.length - 2,
      forbidden,
    });

    forbidden.add(`${tile.x},${tile.y}`);

    const newGhost = new Ghost(
      tile.x * oneBlockSize,
      tile.y * oneBlockSize,
      oneBlockSize,
      oneBlockSize,
      pacman.speed / 2,
      ghostImageLocations[i % ghostImageLocations.length].x,
      ghostImageLocations[i % ghostImageLocations.length].y,
      124,
      116,
      6 + i
    );

    ghosts.push(newGhost);
  }
};

resetFruitState();
createNewPacman();
createGhosts();
startGame();

/*game controls*/
window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    let nextDirection = null;

    if (key === "arrowleft" || key === "a") {
        nextDirection = DIRECTION_LEFT;
    } else if (key === "arrowup" || key === "w") {
        nextDirection = DIRECTION_UP;
    } else if (key === "arrowright" || key === "d") {
        nextDirection = DIRECTION_RIGHT;
    } else if (key === "arrowdown" || key === "s") {
        nextDirection = DIRECTION_BOTTOM;
    }

    if (nextDirection !== null) {
        event.preventDefault();
        pacman.nextDirection = nextDirection;
    }
});

window.addEventListener("beforeunload", () => {
  if (gameInterval) {
    clearInterval(gameInterval);
  }
  if (pacman && typeof pacman.dispose === "function") {
    pacman.dispose();
  }
  for (let i = 0; i < ghosts.length; i++) {
    if (ghosts[i] && typeof ghosts[i].dispose === "function") {
      ghosts[i].dispose();
    }
  }
});
