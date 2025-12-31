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

// Live map instance (coins get consumed during play)
let map = classicMap.map((row) => row.slice());
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
    createNewPacman();
    createGhosts();
};

let onGhostCollision = () => {
  lives--;

  if (lives <= 0) {
    alert("Game Over!\nPress 'OK' to restart.\nYour Score: " + score);

    // Choose one:
    lives = 3;     // classic restart lives
    // lives = 999; // "unlimited life" feel (your call)

    score = 0; // optional: reset score
    // Optional: reset pellets too if you want a true restart.
  }

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
  updateGhosts();
  if (pacman.checkGhostCollision(ghosts)) {
    onGhostCollision();
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

let draw = () => {
  // Clear the *logical* canvas (important when using setTransform with scaling)
  canvasContext.clearRect(0, 0, logicalW, logicalH);

  // Paint background in logical units (do NOT use canvas.width/height here)
  createRect(0, 0, logicalW, logicalH, "black");

  drawWalls();
  drawFoods();
  drawGhosts();
  pacman.draw();
  drawScore();
  drawRemainingLives();
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
  ghosts = [];

  const forbidden = new Set();
  forbidden.add(`${pacmanStart.x},${pacmanStart.y}`);

  for (let i = 0; i < ghostCount; i++) {
    const tile = getRandomWalkableTile({
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

createNewPacman();
createGhosts();
startGame();

/*game controls*/
window.addEventListener("keydown", (event) => {
    let k = event.keyCode;
    setTimeout(() => {
        if (k == 37 || k == 65) {
            // left arrow or a
            pacman.nextDirection = DIRECTION_LEFT;
        } else if (k == 38 || k == 87) {
            // up arrow or w
            pacman.nextDirection = DIRECTION_UP;
        } else if (k == 39 || k == 68) {
            // right arrow or d
            pacman.nextDirection = DIRECTION_RIGHT;
        } else if (k == 40 || k == 83) {
            // bottom arrow or s
            pacman.nextDirection = DIRECTION_BOTTOM;
        }
    }, 1);
});
