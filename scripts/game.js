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
  const headerGuess = 200; // space for header/title + control buttons
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
const pauseToggleButton = document.getElementById("pause-toggle");
const restartGameButton = document.getElementById("restart-game");
const muteToggleButton = document.getElementById("mute-toggle");

let createRect = (x, y, width, height, color) => {
    canvasContext.fillStyle = color;
    canvasContext.fillRect(x, y, width, height);
};

const DIRECTION_RIGHT = 4;
const DIRECTION_UP = 3;
const DIRECTION_LEFT = 2;
const DIRECTION_BOTTOM = 1;
const SWIPE_THRESHOLD_PX = 24;
const STARTING_LIVES = 3;
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
let highScore = 0;
let lives = STARTING_LIVES;
let ghosts = [];
let wallSpaceWidth = oneBlockSize / 1.6;
let wallOffset = (oneBlockSize - wallSpaceWidth) / 2;
let wallInnerColor = "black";
const FRUIT_SPAWN_DELAY_MS = 12000;
const FRUIT_VISIBLE_MS = 10000;
const FRUIT_SCORE = 50;
const GHOST_EAT_BASE_SCORE = 20;
const POWER_PELLET_FRIGHTENED_MS = 7000;
const FRIGHTENED_FLASH_WINDOW_MS = 2200;
const FRIGHTENED_FLASH_INTERVAL_MS = 180;
const MIN_FRUIT_SPAWN_DISTANCE = 8;
const MIN_GHOST_INITIAL_SPAWN_DISTANCE = 7;
const GHOST_HOME_TILE = { x: 13, y: 17 };
const HIGH_SCORE_STORAGE_KEY = "pacman.highScore";
let frightenedUntil = 0;
let ghostEatChain = 0;
let isPaused = false;
let isMuted = false;
let fruit = {
  active: false,
  x: 0,
  y: 0,
  expiresAt: 0,
  nextSpawnAt: Date.now() + FRUIT_SPAWN_DELAY_MS,
};
let audioContext = null;
let audioMasterGain = null;
const touchControlsRoot = document.getElementById("touch-controls");
const touchButtons = touchControlsRoot
  ? Array.from(touchControlsRoot.querySelectorAll(".touch-btn[data-direction]"))
  : [];
let swipeStartX = null;
let swipeStartY = null;

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

function getGameplayUtils() {
  if (typeof GameplayUtils === "object" && GameplayUtils) {
    return GameplayUtils;
  }
  return null;
}

function readHighScoreFromStorage() {
  try {
    const rawValue = localStorage.getItem(HIGH_SCORE_STORAGE_KEY);
    const parsed = Number.parseInt(rawValue || "0", 10);
    if (Number.isNaN(parsed) || parsed < 0) return 0;
    return parsed;
  } catch (error) {
    return 0;
  }
}

function persistHighScore() {
  try {
    localStorage.setItem(HIGH_SCORE_STORAGE_KEY, String(highScore));
  } catch (error) {
    // Ignore storage failures (private mode, storage access blocked, etc.)
  }
}

function syncHighScore() {
  const utils = getGameplayUtils();
  if (utils && typeof utils.updateHighScore === "function") {
    highScore = utils.updateHighScore(highScore, score);
  } else {
    highScore = Math.max(highScore, score);
  }
  persistHighScore();
}

function addScore(points) {
  const safePoints = Number(points);
  if (!Number.isFinite(safePoints)) return;

  score += safePoints;
  syncHighScore();
}

highScore = readHighScoreFromStorage();
syncHighScore();

const SFX_LIBRARY = {
  pellet: [
    { frequency: 430, duration: 0.045, volume: 0.08, wave: "square", offset: 0 },
  ],
  powerPellet: [
    { frequency: 280, duration: 0.075, volume: 0.12, wave: "square", offset: 0 },
    { frequency: 520, duration: 0.08, volume: 0.1, wave: "triangle", offset: 0.06 },
  ],
  fruit: [
    { frequency: 560, duration: 0.06, volume: 0.11, wave: "triangle", offset: 0 },
    { frequency: 770, duration: 0.08, volume: 0.11, wave: "triangle", offset: 0.05 },
  ],
  ghostEaten: [
    { frequency: 820, duration: 0.05, volume: 0.12, wave: "square", offset: 0 },
    { frequency: 620, duration: 0.07, volume: 0.12, wave: "square", offset: 0.06 },
  ],
  death: [
    { frequency: 500, duration: 0.11, volume: 0.12, wave: "sawtooth", offset: 0 },
    { frequency: 320, duration: 0.13, volume: 0.12, wave: "sawtooth", offset: 0.1 },
    { frequency: 170, duration: 0.16, volume: 0.1, wave: "triangle", offset: 0.2 },
  ],
  levelClear: [
    { frequency: 520, duration: 0.08, volume: 0.1, wave: "triangle", offset: 0 },
    { frequency: 680, duration: 0.08, volume: 0.1, wave: "triangle", offset: 0.08 },
    { frequency: 890, duration: 0.11, volume: 0.11, wave: "triangle", offset: 0.16 },
  ],
  ui: [{ frequency: 460, duration: 0.04, volume: 0.07, wave: "square", offset: 0 }],
};

function ensureAudioContextReady() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioContext) {
    audioContext = new AudioContextClass();
    audioMasterGain = audioContext.createGain();
    audioMasterGain.gain.value = isMuted ? 0 : 0.22;
    audioMasterGain.connect(audioContext.destination);
  }

  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {
      // Browser autoplay policy can still block; we retry on next interaction.
    });
  }

  return audioContext;
}

function playTone({ frequency, duration, volume, wave, offset }) {
  if (isMuted) return;
  const ctx = ensureAudioContextReady();
  if (!ctx || !audioMasterGain) return;

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  const startTime = ctx.currentTime + (offset || 0);
  const endTime = startTime + duration;

  oscillator.type = wave || "square";
  oscillator.frequency.setValueAtTime(frequency, startTime);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

  oscillator.connect(gain);
  gain.connect(audioMasterGain);
  oscillator.start(startTime);
  oscillator.stop(endTime + 0.01);
}

function playGameSfx(type) {
  const pattern = SFX_LIBRARY[type];
  if (!Array.isArray(pattern) || pattern.length === 0) return;

  for (let i = 0; i < pattern.length; i++) {
    playTone(pattern[i]);
  }
}

function renderMuteButton() {
  if (!muteToggleButton) return;
  muteToggleButton.textContent = isMuted ? "Sound: Off" : "Sound: On";
  muteToggleButton.setAttribute("aria-pressed", String(isMuted));
}

function setMuted(nextMuted) {
  isMuted = Boolean(nextMuted);
  if (audioMasterGain && audioContext) {
    audioMasterGain.gain.setValueAtTime(isMuted ? 0 : 0.22, audioContext.currentTime);
  }
  renderMuteButton();
}

function toggleMuted() {
  setMuted(!isMuted);
  playGameSfx("ui");
}

function primeAudioContext() {
  ensureAudioContextReady();
}

function isGhostFrightened() {
  return Date.now() < frightenedUntil;
}

function shouldFlashFrightenedGhosts() {
  const utils = getGameplayUtils();
  if (!utils || typeof utils.isFrightenedFlashing !== "function") {
    return false;
  }

  return utils.isFrightenedFlashing(
    Date.now(),
    frightenedUntil,
    FRIGHTENED_FLASH_WINDOW_MS,
    FRIGHTENED_FLASH_INTERVAL_MS
  );
}

function activateFrightenedMode(durationMs = POWER_PELLET_FRIGHTENED_MS) {
  frightenedUntil = Math.max(frightenedUntil, Date.now() + durationMs);
  ghostEatChain = 0;
  playGameSfx("powerPellet");
}

function clearFrightenedMode() {
  frightenedUntil = 0;
  ghostEatChain = 0;
}

function getGhostHomeTarget() {
  return {
    x: GHOST_HOME_TILE.x * oneBlockSize,
    y: GHOST_HOME_TILE.y * oneBlockSize,
  };
}

function getFrightenedTargetForGhost(ghost) {
  if (!Array.isArray(randomTargetsForGhosts) || randomTargetsForGhosts.length === 0) {
    return null;
  }

  const utils = getGameplayUtils();
  if (
    utils &&
    typeof utils.pickFarthestTarget === "function" &&
    pacman &&
    typeof pacman.getMapX === "function"
  ) {
    const target = utils.pickFarthestTarget(
      randomTargetsForGhosts,
      pacman.getMapX() * oneBlockSize,
      pacman.getMapY() * oneBlockSize
    );
    if (target) return target;
  }

  const offset = 2;
  const fallbackIndex = ghost
    ? (ghost.randomTargetIndex + offset) % randomTargetsForGhosts.length
    : 0;
  return randomTargetsForGhosts[fallbackIndex];
}

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
    minDistanceFromPacman = 0,
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

  const distanceSafePreferredTiles = preferredTiles.filter((tile) => {
    const distance =
      Math.abs(tile.x - startX) + Math.abs(tile.y - startY);
    return distance >= minDistanceFromPacman;
  });

  const nonPacmanTiles = preferredTiles.filter(
    (tile) => !(tile.x === startX && tile.y === startY)
  );
  const distanceSafeNonPacmanTiles = nonPacmanTiles.filter((tile) => {
    const distance =
      Math.abs(tile.x - startX) + Math.abs(tile.y - startY);
    return distance >= minDistanceFromPacman;
  });

  const candidates =
    distanceSafePreferredTiles.length > 0
      ? distanceSafePreferredTiles
      : preferredTiles.length > 0
      ? preferredTiles
      : distanceSafeNonPacmanTiles.length > 0
      ? distanceSafeNonPacmanTiles
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

function resetFruitState() {
  fruit.active = false;
  fruit.expiresAt = 0;
  fruit.nextSpawnAt = Date.now() + FRUIT_SPAWN_DELAY_MS;
  clearFrightenedMode();
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
    minDistanceFromPacman: MIN_FRUIT_SPAWN_DISTANCE,
  });

  fruit.active = true;
  fruit.x = tile.x;
  fruit.y = tile.y;
  fruit.expiresAt = Date.now() + FRUIT_VISIBLE_MS;
}

function updateFruitState() {
  const now = Date.now();

  if (fruit.active && now >= fruit.expiresAt) {
    fruit.active = false;
    fruit.expiresAt = 0;
    fruit.nextSpawnAt = now + FRUIT_SPAWN_DELAY_MS;
  }

  if (!fruit.active && now >= fruit.nextSpawnAt && hasRemainingFood()) {
    spawnFruit();
  }
}

function updateFrightenedModeState() {
  if (!isGhostFrightened() && ghostEatChain !== 0) {
    ghostEatChain = 0;
  }
}

function tryConsumeFruit() {
  if (!fruit.active) return;
  if (pacman.getMapX() !== fruit.x || pacman.getMapY() !== fruit.y) return;

  fruit.active = false;
  fruit.expiresAt = 0;
  fruit.nextSpawnAt = Date.now() + FRUIT_SPAWN_DELAY_MS;
  addScore(FRUIT_SCORE);
  playGameSfx("fruit");
}

function getCollidingGhostIndices() {
  const collidingIndices = {
    dangerous: [],
    frightened: [],
  };
  const pacmanTileX = pacman.getMapX();
  const pacmanTileY = pacman.getMapY();

  for (let i = 0; i < ghosts.length; i++) {
    const ghost = ghosts[i];
    if (!ghost) continue;

    if (ghost.getMapX() !== pacmanTileX || ghost.getMapY() !== pacmanTileY) {
      continue;
    }

    if (typeof ghost.isEaten === "function" && ghost.isEaten()) {
      continue;
    }

    const isFrightenedGhost =
      isGhostFrightened() &&
      typeof ghost.isFrightened === "function" &&
      ghost.isFrightened();

    if (isFrightenedGhost) {
      collidingIndices.frightened.push(i);
    } else {
      collidingIndices.dangerous.push(i);
    }
  }

  return collidingIndices;
}

function eatCollidingGhosts(collidingIndices) {
  const uniqueIndices = [...new Set(collidingIndices)];
  const utils = getGameplayUtils();

  for (let i = 0; i < uniqueIndices.length; i++) {
    const ghost = ghosts[uniqueIndices[i]];
    if (!ghost || (typeof ghost.isEaten === "function" && ghost.isEaten())) {
      continue;
    }

    const points =
      utils && typeof utils.computeGhostEatScore === "function"
        ? utils.computeGhostEatScore(GHOST_EAT_BASE_SCORE, ghostEatChain)
        : GHOST_EAT_BASE_SCORE * Math.pow(2, ghostEatChain);

    addScore(points);
    ghostEatChain =
      utils && typeof utils.nextGhostEatChain === "function"
        ? utils.nextGhostEatChain(ghostEatChain, 6)
        : Math.min(ghostEatChain + 1, 6);

    if (typeof ghost.setEatenMode === "function") {
      ghost.setEatenMode();
    }
    playGameSfx("ghostEaten");
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

let gameInterval = null;

function renderPauseButton() {
  if (!pauseToggleButton) return;
  pauseToggleButton.textContent = isPaused ? "Resume" : "Pause";
  pauseToggleButton.setAttribute("aria-pressed", String(isPaused));
}

function setPaused(nextPaused) {
  const shouldPause = Boolean(nextPaused);
  if (shouldPause === isPaused) return;
  isPaused = shouldPause;

  if (isPaused) {
    if (gameInterval) {
      clearInterval(gameInterval);
      gameInterval = null;
    }
    draw();
    drawPausedOverlay();
  } else {
    startGame();
  }

  renderPauseButton();
}

function togglePaused() {
  setPaused(!isPaused);
  playGameSfx("ui");
}

function startGame() {
  resizeCanvasToFitViewport();
  if (gameInterval) clearInterval(gameInterval);
  gameInterval = setInterval(gameLoop, 1000 / fps);
  isPaused = false;
  renderPauseButton();
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

function restartGameSession() {
  syncHighScore();
  lives = STARTING_LIVES;
  score = 0;
  resetMap();
  resetFruitState();
  restartPacmanAndGhosts();
  if (isPaused) {
    setPaused(false);
  }
}

let onGhostCollision = () => {
  lives--;
  resetFruitState();
  playGameSfx("death");

  if (lives <= 0) {
    alert("Game Over!\nPress 'OK' to restart.\nYour Score: " + score);
    restartGameSession();
    return;
  }

  restartPacmanAndGhosts();
};

let onLevelComplete = () => {
  playGameSfx("levelClear");
  alert("You cleared the maze!\nPress 'OK' for the next round.\nScore: " + score);
  resetMap();
  resetFruitState();
  restartPacmanAndGhosts();
};

let update = () => {
  if (!pacman) return;

  pacman.moveProcess();
  const eatResult = pacman.eat();
  if (eatResult && eatResult.atePowerPellet) {
    activateFrightenedMode();
  }

  updateFrightenedModeState();
  updateFruitState();
  tryConsumeFruit();
  updateGhosts();

  const collidingGhostIndices = getCollidingGhostIndices();
  if (collidingGhostIndices.frightened.length > 0) {
    eatCollidingGhosts(collidingGhostIndices.frightened);
  }

  if (collidingGhostIndices.dangerous.length > 0) {
    onGhostCollision();
    return;
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

    canvasContext.font = "16px Emulogic";
    canvasContext.fillStyle = "#FFE16A";
    canvasContext.fillText(
      "High: " + highScore,
      0,
      oneBlockSize * (map.length + 1.8)
    );
};

let drawPowerModeStatus = () => {
    if (!isGhostFrightened()) return;

    const remainingMs = Math.max(0, frightenedUntil - Date.now());
    const remainingSeconds = Math.ceil(remainingMs / 1000);
    canvasContext.font = "16px Emulogic";
    canvasContext.fillStyle = "#78F7FF";
    canvasContext.fillText(
        "FRIGHT: " + remainingSeconds + "s",
        220,
        oneBlockSize * (map.length + 1.8)
    );
};

function drawPausedOverlay() {
  canvasContext.fillStyle = "rgba(0, 0, 0, 0.5)";
  canvasContext.fillRect(0, 0, logicalW, logicalH);
  canvasContext.font = "22px Emulogic";
  canvasContext.fillStyle = "#FFDE00";
  canvasContext.textAlign = "center";
  canvasContext.fillText("PAUSED", logicalW / 2, logicalH / 2);
  canvasContext.font = "12px Emulogic";
  canvasContext.fillStyle = "#DDE7FF";
  canvasContext.fillText(
    "Press P or tap Resume",
    logicalW / 2,
    logicalH / 2 + oneBlockSize * 1.2
  );
  canvasContext.textAlign = "start";
}

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
  if (isPaused) {
    drawPausedOverlay();
  }
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

let createGhosts = () => {
  for (let i = 0; i < ghosts.length; i++) {
    if (ghosts[i] && typeof ghosts[i].dispose === "function") {
      ghosts[i].dispose();
    }
  }
  ghosts = [];

  const forbidden = new Set();
  forbidden.add(`${pacman.getMapX()},${pacman.getMapY()}`);

  for (let i = 0; i < ghostCount; i++) {
    const tile = getRandomReachableTile({
      minX: 1,
      maxX: map[0].length - 2,
      minY: 1,
      maxY: map.length - 2,
      forbidden,
      minDistanceFromPacman: MIN_GHOST_INITIAL_SPAWN_DISTANCE,
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
renderMuteButton();
startGame();

/*game controls*/
function setPacmanDirection(nextDirection) {
  if (!pacman) return;
  if (isPaused) {
    setPaused(false);
  }
  pacman.nextDirection = nextDirection;
}

function mapDirectionNameToCode(directionName) {
  if (directionName === "left") return DIRECTION_LEFT;
  if (directionName === "up") return DIRECTION_UP;
  if (directionName === "right") return DIRECTION_RIGHT;
  if (directionName === "down") return DIRECTION_BOTTOM;
  return null;
}

function mapKeyboardKeyToDirection(key) {
  if (key === "arrowleft" || key === "a") return DIRECTION_LEFT;
  if (key === "arrowup" || key === "w") return DIRECTION_UP;
  if (key === "arrowright" || key === "d") return DIRECTION_RIGHT;
  if (key === "arrowdown" || key === "s") return DIRECTION_BOTTOM;
  return null;
}

function clearSwipeState() {
  swipeStartX = null;
  swipeStartY = null;
}

function onCanvasTouchStart(event) {
  if (!event.touches || event.touches.length === 0) return;
  primeAudioContext();
  swipeStartX = event.touches[0].clientX;
  swipeStartY = event.touches[0].clientY;
}

function onCanvasTouchMove(event) {
  if (swipeStartX === null || swipeStartY === null) return;
  event.preventDefault();
}

function onCanvasTouchEnd(event) {
  if (swipeStartX === null || swipeStartY === null) return;
  if (!event.changedTouches || event.changedTouches.length === 0) {
    clearSwipeState();
    return;
  }

  event.preventDefault();
  const touch = event.changedTouches[0];
  const dx = touch.clientX - swipeStartX;
  const dy = touch.clientY - swipeStartY;
  clearSwipeState();

  if (
    Math.abs(dx) < SWIPE_THRESHOLD_PX &&
    Math.abs(dy) < SWIPE_THRESHOLD_PX
  ) {
    return;
  }

  if (Math.abs(dx) > Math.abs(dy)) {
    setPacmanDirection(dx > 0 ? DIRECTION_RIGHT : DIRECTION_LEFT);
  } else {
    setPacmanDirection(dy > 0 ? DIRECTION_BOTTOM : DIRECTION_UP);
  }
}

window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    primeAudioContext();

    if (key === "p") {
      event.preventDefault();
      togglePaused();
      return;
    }

    if (key === "r") {
      event.preventDefault();
      restartGameSession();
      playGameSfx("ui");
      return;
    }

    if (key === "m") {
      event.preventDefault();
      toggleMuted();
      return;
    }

    const nextDirection = mapKeyboardKeyToDirection(key);
    if (nextDirection === null) return;
    event.preventDefault();
    setPacmanDirection(nextDirection);
});

for (let i = 0; i < touchButtons.length; i++) {
  touchButtons[i].addEventListener("pointerdown", (event) => {
    event.preventDefault();
    primeAudioContext();
    const directionName = event.currentTarget.dataset.direction;
    const nextDirection = mapDirectionNameToCode(directionName);
    if (nextDirection === null) return;
    setPacmanDirection(nextDirection);
  });
}

if (pauseToggleButton) {
  pauseToggleButton.addEventListener("click", () => {
    primeAudioContext();
    togglePaused();
  });
}

if (restartGameButton) {
  restartGameButton.addEventListener("click", () => {
    primeAudioContext();
    restartGameSession();
    playGameSfx("ui");
  });
}

if (muteToggleButton) {
  muteToggleButton.addEventListener("click", () => {
    primeAudioContext();
    toggleMuted();
  });
}

canvas.addEventListener("touchstart", onCanvasTouchStart, { passive: true });
canvas.addEventListener("touchmove", onCanvasTouchMove, { passive: false });
canvas.addEventListener("touchend", onCanvasTouchEnd, { passive: false });
canvas.addEventListener("touchcancel", clearSwipeState, { passive: true });

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
