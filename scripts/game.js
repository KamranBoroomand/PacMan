const canvas = document.getElementById("canvas");
const canvasContext = canvas.getContext("2d");
const pacmanFrames = document.getElementById("animation");
const ghostFrames = document.getElementById("ghosts");
const startGameButton = document.getElementById("start-game");
const pauseToggleButton = document.getElementById("pause-toggle");
const restartGameButton = document.getElementById("restart-game");
const muteToggleButton = document.getElementById("mute-toggle");
const installAppButton = document.getElementById("install-app");
const volumeControl = document.getElementById("volume-control");
const mobileInputModeSelect = document.getElementById("mobile-input-mode");
const keybindButtons = Array.from(document.querySelectorAll(".keybind-btn[data-action]"));
const keybindHelp = document.getElementById("keybind-help");
const touchControlsRoot = document.getElementById("touch-controls");
const touchButtons = touchControlsRoot
  ? Array.from(touchControlsRoot.querySelectorAll(".touch-btn[data-direction]"))
  : [];
const virtualStickRoot = document.getElementById("virtual-stick");
const stickBase = document.getElementById("stick-base");
const stickKnob = document.getElementById("stick-knob");

const DIRECTION_RIGHT = 4;
const DIRECTION_UP = 3;
const DIRECTION_LEFT = 2;
const DIRECTION_BOTTOM = 1;

const GAME_PHASE_START = "start";
const GAME_PHASE_READY = "ready";
const GAME_PHASE_PLAYING = "playing";
const GAME_PHASE_PAUSED = "paused";
const GAME_PHASE_DYING = "dying";
const GAME_PHASE_INTERMISSION = "intermission";
const GAME_PHASE_GAMEOVER = "gameover";

const HUD_ROWS = 2;
const FRAME_STEP_MS = 1000 / 60;
const STARTING_LIVES = 3;
const START_LEVEL = 1;
const BONUS_LIFE_STEP = 10000;
const SWIPE_THRESHOLD_PX = 24;
const STICK_MAX_RADIUS = 54;
const STICK_DEAD_ZONE = 14;
const ROUND_READY_MS = 1800;
const LIFE_LOSS_MS = 1100;
const INTERMISSION_MS = 1500;
const FRIGHTENED_FLASH_WINDOW_MS = 2200;
const FRIGHTENED_FLASH_INTERVAL_MS = 180;
const MIN_FRUIT_SPAWN_DISTANCE = 8;
const MIN_GHOST_INITIAL_SPAWN_DISTANCE = 7;
const SETTINGS_STORAGE_KEY = "pacman.settings.v1";
const HIGH_SCORE_STORAGE_KEY = "pacman.highScore";
const GHOST_HOME_TILE = { x: 13, y: 13 };
const GHOST_HOUSE_EXIT_TILE = { x: 13, y: 12 };
const BASE_AUDIO_GAIN = 0.25;
const GHOST_MODE_SCHEDULE = [
  { mode: "scatter", durationMs: 7000 },
  { mode: "chase", durationMs: 20000 },
  { mode: "scatter", durationMs: 7000 },
  { mode: "chase", durationMs: 20000 },
  { mode: "scatter", durationMs: 5000 },
  { mode: "chase", durationMs: 20000 },
  { mode: "scatter", durationMs: 5000 },
  { mode: "chase", durationMs: Infinity },
];

const GHOST_DEFINITIONS = [
  {
    id: "blinky",
    displayName: "Blinky",
    spriteIndex: 0,
    scatterTile: { x: 26, y: 1 },
    startInHouse: false,
    releaseDotThreshold: 0,
    forceReleaseMs: 0,
    spawnTile: { x: 13, y: 11 },
  },
  {
    id: "pinky",
    displayName: "Pinky",
    spriteIndex: 1,
    scatterTile: { x: 1, y: 1 },
    startInHouse: true,
    releaseDotThreshold: 4,
    forceReleaseMs: 1200,
    spawnTile: { x: 12, y: 13 },
  },
  {
    id: "inky",
    displayName: "Inky",
    spriteIndex: 2,
    scatterTile: { x: 26, y: 29 },
    startInHouse: true,
    releaseDotThreshold: 14,
    forceReleaseMs: 3500,
    spawnTile: { x: 13, y: 13 },
  },
  {
    id: "clyde",
    displayName: "Clyde",
    spriteIndex: 3,
    scatterTile: { x: 1, y: 29 },
    startInHouse: true,
    releaseDotThreshold: 28,
    forceReleaseMs: 6000,
    spawnTile: { x: 14, y: 13 },
  },
];

const ghostImageLocations = [
  { x: 0, y: 0 },
  { x: 176, y: 0 },
  { x: 0, y: 121 },
  { x: 176, y: 121 },
];

const FRUIT_TABLE = [
  { name: "Cherry", points: 100, color: "#FF2E59" },
  { name: "Strawberry", points: 300, color: "#FF5A7A" },
  { name: "Orange", points: 500, color: "#FF9F1A" },
  { name: "Apple", points: 700, color: "#88D43F" },
  { name: "Melon", points: 1000, color: "#4FD1C5" },
  { name: "Galaxian", points: 2000, color: "#7C83FF" },
  { name: "Bell", points: 3000, color: "#FDE047" },
  { name: "Key", points: 5000, color: "#F8FAFC" },
];

const DEFAULT_KEYBINDS = {
  left: "a",
  up: "w",
  right: "d",
  down: "s",
  pause: "p",
  restart: "r",
  mute: "m",
  start: "enter",
};

const DEFAULT_SETTINGS = {
  muted: false,
  volume: 70,
  mobileInputMode: "buttons",
  keybinds: { ...DEFAULT_KEYBINDS },
};

const SFX_LIBRARY = {
  pellet: [
    { frequency: 430, duration: 0.04, volume: 0.08, wave: "square", offset: 0 },
  ],
  powerPellet: [
    { frequency: 290, duration: 0.07, volume: 0.14, wave: "square", offset: 0 },
    { frequency: 540, duration: 0.08, volume: 0.12, wave: "triangle", offset: 0.07 },
  ],
  fruit: [
    { frequency: 580, duration: 0.06, volume: 0.12, wave: "triangle", offset: 0 },
    { frequency: 760, duration: 0.08, volume: 0.12, wave: "triangle", offset: 0.05 },
  ],
  ghostEaten: [
    { frequency: 860, duration: 0.05, volume: 0.13, wave: "square", offset: 0 },
    { frequency: 640, duration: 0.07, volume: 0.13, wave: "square", offset: 0.06 },
  ],
  death: [
    { frequency: 520, duration: 0.11, volume: 0.14, wave: "sawtooth", offset: 0 },
    { frequency: 330, duration: 0.13, volume: 0.13, wave: "sawtooth", offset: 0.1 },
    { frequency: 180, duration: 0.16, volume: 0.1, wave: "triangle", offset: 0.2 },
  ],
  levelClear: [
    { frequency: 520, duration: 0.08, volume: 0.11, wave: "triangle", offset: 0 },
    { frequency: 680, duration: 0.08, volume: 0.11, wave: "triangle", offset: 0.08 },
    { frequency: 920, duration: 0.12, volume: 0.12, wave: "triangle", offset: 0.16 },
  ],
  extraLife: [
    { frequency: 620, duration: 0.08, volume: 0.11, wave: "triangle", offset: 0 },
    { frequency: 820, duration: 0.08, volume: 0.11, wave: "triangle", offset: 0.09 },
    { frequency: 1040, duration: 0.12, volume: 0.12, wave: "triangle", offset: 0.18 },
  ],
  ui: [{ frequency: 460, duration: 0.04, volume: 0.08, wave: "square", offset: 0 }],
};

let renderScale = 1;
let dpr = 1;
let logicalW = 0;
let logicalH = 0;

let oneBlockSize = 20;
let fps = 60;
let pacman = null;
let ghosts = [];
let wallTiles = [];
let score = 0;
let highScore = 0;
let lives = STARTING_LIVES;
let level = START_LEVEL;
let nextBonusLifeScore = BONUS_LIFE_STEP;
let phase = GAME_PHASE_START;
let phaseUntil = 0;
let phaseMessage = "Press Start";
let roundStartAt = 0;
let frightenedUntil = 0;
let ghostEatChain = 0;
let ghostGlobalMode = "scatter";
let lastGhostGlobalMode = "scatter";
let currentLevelTuning = null;
let dotsEatenThisRound = 0;
let remainingFoodCount = 0;
let initialFoodCount = 0;
let pointPopups = [];
let hudToasts = [];
let lastUpdateNow = performance.now();
let frameAccumulator = 0;
let animationFrameId = null;
let swipeStartX = null;
let swipeStartY = null;
let stickPointerId = null;
let stickCenterX = 0;
let stickCenterY = 0;
let pendingRebindAction = null;
let settings = loadSettings();
let audioContext = null;
let audioMasterGain = null;
let deferredInstallPrompt = null;
let gamepadButtonsState = [];

let fruit = {
  active: false,
  x: 0,
  y: 0,
  expiresAt: 0,
  nextSpawnAt: 0,
  spawnsThisRound: 0,
  spec: FRUIT_TABLE[0],
};

let createRect = (x, y, width, height, color) => {
  canvasContext.fillStyle = color;
  canvasContext.fillRect(x, y, width, height);
};

// Legend: 1 = wall, 2 = pellet, 4 = power pellet, 0 = empty path
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

for (let y = 18; y <= 26; y++) {
  classicMap[y][13] = 2;
  classicMap[y][14] = 2;
}

const pacmanStart = { x: 13, y: 23 };
classicMap[1][1] = 4;
classicMap[1][26] = 4;
classicMap[26][1] = 4;
classicMap[26][26] = 4;
classicMap[pacmanStart.y][pacmanStart.x] = 0;
classicMap[pacmanStart.y][pacmanStart.x + 1] = 0;

const cloneClassicMap = () => classicMap.map((row) => row.slice());
let map = cloneClassicMap();

let randomTargetsForGhosts = [
  { x: oneBlockSize, y: oneBlockSize },
  { x: oneBlockSize, y: (map.length - 2) * oneBlockSize },
  { x: (map[0].length - 2) * oneBlockSize, y: oneBlockSize },
  {
    x: (map[0].length - 2) * oneBlockSize,
    y: (map.length - 2) * oneBlockSize,
  },
];

function getGameplayUtils() {
  if (typeof GameplayUtils === "object" && GameplayUtils) {
    return GameplayUtils;
  }
  return null;
}

function normalizeKeyName(value) {
  if (!value) return "";
  const lower = String(value).toLowerCase();
  if (lower === " ") return "space";
  return lower;
}

function formatKeyForUi(key) {
  if (!key) return "?";
  if (key === "arrowup") return "ArrowUp";
  if (key === "arrowdown") return "ArrowDown";
  if (key === "arrowleft") return "ArrowLeft";
  if (key === "arrowright") return "ArrowRight";
  if (key === "space") return "Space";
  if (key === "enter") return "Enter";
  if (key.length === 1) return key.toUpperCase();
  return key;
}

function validateSettings(raw) {
  const safe = {
    muted: Boolean(raw && raw.muted),
    volume: Number.isFinite(Number(raw && raw.volume))
      ? Math.max(0, Math.min(100, Number(raw.volume)))
      : DEFAULT_SETTINGS.volume,
    mobileInputMode:
      raw && raw.mobileInputMode === "stick" ? "stick" : "buttons",
    keybinds: { ...DEFAULT_KEYBINDS },
  };

  const incomingKeybinds = raw && raw.keybinds ? raw.keybinds : {};
  const actions = Object.keys(DEFAULT_KEYBINDS);
  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    const normalized = normalizeKeyName(incomingKeybinds[action]);
    if (normalized) {
      safe.keybinds[action] = normalized;
    }
  }

  return safe;
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return validateSettings(DEFAULT_SETTINGS);
    return validateSettings(JSON.parse(raw));
  } catch (error) {
    return validateSettings(DEFAULT_SETTINGS);
  }
}

function persistSettings() {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    // Ignore settings persistence failures.
  }
}

function readHighScoreFromStorage() {
  try {
    const raw = localStorage.getItem(HIGH_SCORE_STORAGE_KEY);
    const parsed = Number.parseInt(raw || "0", 10);
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
    // Ignore storage failures.
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

function renderMuteButton() {
  if (!muteToggleButton) return;
  muteToggleButton.textContent = settings.muted ? "Sound: Off" : "Sound: On";
  muteToggleButton.setAttribute("aria-pressed", String(settings.muted));
}

function renderPauseButton() {
  if (!pauseToggleButton) return;
  const isPaused = phase === GAME_PHASE_PAUSED;
  pauseToggleButton.textContent = isPaused ? "Resume" : "Pause";
  pauseToggleButton.setAttribute("aria-pressed", String(isPaused));
}

function renderStartButton() {
  if (!startGameButton) return;
  if (phase === GAME_PHASE_START || phase === GAME_PHASE_GAMEOVER) {
    startGameButton.textContent = "Start";
  } else {
    startGameButton.textContent = "Play";
  }
}

function renderInstallButton() {
  if (!installAppButton) return;
  if (deferredInstallPrompt) {
    installAppButton.classList.remove("hidden");
  } else {
    installAppButton.classList.add("hidden");
  }
}

function renderKeybindButtons() {
  for (let i = 0; i < keybindButtons.length; i++) {
    const button = keybindButtons[i];
    const action = button.dataset.action;
    if (!action) continue;
    const labelBase = action.charAt(0).toUpperCase() + action.slice(1);
    const key = settings.keybinds[action] || DEFAULT_KEYBINDS[action];
    button.textContent = `${labelBase}: ${formatKeyForUi(key)}`;
    if (pendingRebindAction === action) {
      button.classList.add("rebinding");
    } else {
      button.classList.remove("rebinding");
    }
  }
}

function renderSettingsUi() {
  if (volumeControl) {
    volumeControl.value = String(settings.volume);
  }
  if (mobileInputModeSelect) {
    mobileInputModeSelect.value = settings.mobileInputMode;
  }
  renderKeybindButtons();
  if (keybindHelp) {
    keybindHelp.textContent = pendingRebindAction
      ? `Press a key for ${pendingRebindAction}. Esc to cancel.`
      : "Click a keybind, then press a key.";
  }
}

function validateMapRectangular() {
  if (!Array.isArray(map) || map.length === 0) throw new Error("Map is empty.");
  const cols = map[0].length;
  for (let row = 0; row < map.length; row++) {
    if (!Array.isArray(map[row]) || map[row].length !== cols) {
      throw new Error(`Map row ${row} has invalid width.`);
    }
  }
  return { rows: map.length, cols };
}

function resizeCanvasToFitViewport() {
  const { rows, cols } = validateMapRectangular();
  dpr = window.devicePixelRatio || 1;

  logicalW = cols * oneBlockSize;
  logicalH = (rows + HUD_ROWS) * oneBlockSize;

  const padding = 24;
  const header = document.querySelector(".site-header");
  const headerGuess = header
    ? Math.min(header.offsetHeight + 10, 110)
    : 90;
  const availW = Math.max(320, window.innerWidth - padding);
  const availH = Math.max(320, window.innerHeight - headerGuess);

  renderScale = Math.min(availW / logicalW, availH / logicalH, 1);

  const cssW = Math.floor(logicalW * renderScale);
  const cssH = Math.floor(logicalH * renderScale);

  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;

  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);
  canvasContext.setTransform(dpr * renderScale, 0, 0, dpr * renderScale, 0, 0);
  canvasContext.imageSmoothingEnabled = false;
}

function quantizeSpeed(rawSpeed) {
  const safe = Math.max(0.5, Number(rawSpeed) || 0.5);
  return Math.round(safe * 4) / 4;
}

function rebuildMapCaches() {
  wallTiles = [];
  remainingFoodCount = 0;
  initialFoodCount = 0;

  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[0].length; x++) {
      if (map[y][x] === 1) {
        wallTiles.push({ x, y });
      }
      if (map[y][x] === 2 || map[y][x] === 4) {
        remainingFoodCount++;
      }
    }
  }

  initialFoodCount = remainingFoodCount;
}

function resetMap() {
  map = cloneClassicMap();
  rebuildMapCaches();
}

function updateRandomTargetsForGhosts() {
  randomTargetsForGhosts = [
    { x: oneBlockSize, y: oneBlockSize },
    { x: oneBlockSize, y: (map.length - 2) * oneBlockSize },
    { x: (map[0].length - 2) * oneBlockSize, y: oneBlockSize },
    {
      x: (map[0].length - 2) * oneBlockSize,
      y: (map.length - 2) * oneBlockSize,
    },
  ];
}

function isWalkableTile(tileY, tileX) {
  if (tileY < 0 || tileY >= map.length) return false;
  if (tileX < 0 || tileX >= map[0].length) return false;
  return map[tileY][tileX] !== 1;
}

function getRandomWalkableTile(options = {}) {
  const {
    minX = 0,
    maxX = map[0].length - 1,
    minY = 0,
    maxY = map.length - 1,
    maxTries = 5000,
    forbidden = new Set(),
  } = options;

  for (let tries = 0; tries < maxTries; tries++) {
    const x = Math.floor(Math.random() * (maxX - minX + 1)) + minX;
    const y = Math.floor(Math.random() * (maxY - minY + 1)) + minY;

    if (!isWalkableTile(y, x)) continue;
    if (forbidden.has(`${x},${y}`)) continue;

    return { x, y };
  }

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
  const reachable = [];
  let head = 0;

  while (head < queue.length) {
    const current = queue[head++];
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
      reachable.push({ x: current.x, y: current.y });
    }

    queue.push({ x: current.x - 1, y: current.y });
    queue.push({ x: current.x + 1, y: current.y });
    queue.push({ x: current.x, y: current.y - 1 });
    queue.push({ x: current.x, y: current.y + 1 });
  }

  if (reachable.length === 0) {
    return getRandomWalkableTile(options);
  }

  const candidates = reachable.filter((tile) => {
    const key = `${tile.x},${tile.y}`;
    if (forbidden.has(key)) return false;
    const distance = Math.abs(tile.x - startX) + Math.abs(tile.y - startY);
    return distance >= minDistanceFromPacman;
  });

  if (candidates.length === 0) {
    return reachable[Math.floor(Math.random() * reachable.length)];
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}

function tileToPixel(tile) {
  return {
    x: tile.x * oneBlockSize,
    y: tile.y * oneBlockSize,
  };
}

function getFruitSpecForLevel(currentLevel) {
  const index = Math.min(FRUIT_TABLE.length - 1, Math.max(0, currentLevel - 1));
  return FRUIT_TABLE[index];
}

function ensureAudioContextReady() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioContext) {
    audioContext = new AudioContextClass();
    audioMasterGain = audioContext.createGain();
    audioMasterGain.connect(audioContext.destination);
  }

  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {
      // Browsers may block autoplay until the next interaction.
    });
  }

  applyAudioSettings();
  return audioContext;
}

function applyAudioSettings() {
  if (!audioMasterGain || !audioContext) return;
  const volumeScale = Math.max(0, Math.min(1, settings.volume / 100));
  const targetGain = settings.muted ? 0 : BASE_AUDIO_GAIN * volumeScale;
  audioMasterGain.gain.setValueAtTime(targetGain, audioContext.currentTime);
}

function playTone({ frequency, duration, volume, wave, offset }) {
  if (settings.muted) return;
  const ctx = ensureAudioContextReady();
  if (!ctx || !audioMasterGain) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const startTime = ctx.currentTime + (offset || 0);
  const endTime = startTime + duration;

  osc.type = wave || "square";
  osc.frequency.setValueAtTime(frequency, startTime);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

  osc.connect(gain);
  gain.connect(audioMasterGain);
  osc.start(startTime);
  osc.stop(endTime + 0.01);
}

function playGameSfx(type) {
  const pattern = SFX_LIBRARY[type];
  if (!Array.isArray(pattern)) return;
  for (let i = 0; i < pattern.length; i++) {
    playTone(pattern[i]);
  }
}

function addHudToast(text, color = "#FFE16A", durationMs = 1400) {
  hudToasts.push({
    text,
    color,
    createdAt: lastUpdateNow,
    expiresAt: lastUpdateNow + durationMs,
  });
}

function addPointPopup(tileX, tileY, text, color = "#FFFFFF", durationMs = 1000) {
  pointPopups.push({
    x: tileX * oneBlockSize,
    y: tileY * oneBlockSize,
    text,
    color,
    createdAt: lastUpdateNow,
    expiresAt: lastUpdateNow + durationMs,
  });
}

function addScore(points) {
  const safePoints = Number(points);
  if (!Number.isFinite(safePoints)) return;

  score += safePoints;
  syncHighScore();

  const utils = getGameplayUtils();
  while (
    utils &&
    typeof utils.shouldAwardBonusLife === "function" &&
    utils.shouldAwardBonusLife(score, nextBonusLifeScore)
  ) {
    lives++;
    nextBonusLifeScore = utils.nextBonusLifeMilestone(nextBonusLifeScore, BONUS_LIFE_STEP);
    addHudToast("1UP!", "#78F7FF", 1800);
    playGameSfx("extraLife");
  }

  if (!utils && score >= nextBonusLifeScore) {
    lives++;
    nextBonusLifeScore += BONUS_LIFE_STEP;
    addHudToast("1UP!", "#78F7FF", 1800);
    playGameSfx("extraLife");
  }
}

function setMuted(nextMuted) {
  settings.muted = Boolean(nextMuted);
  applyAudioSettings();
  persistSettings();
  renderMuteButton();
}

function toggleMuted() {
  setMuted(!settings.muted);
  playGameSfx("ui");
}

function primeAudioContext() {
  ensureAudioContextReady();
}

function getLevelTuning(levelNumber) {
  const utils = getGameplayUtils();
  if (utils && typeof utils.getLevelTuning === "function") {
    return utils.getLevelTuning(levelNumber);
  }

  const safeLevel = Math.max(1, levelNumber);
  return {
    level: safeLevel,
    pacmanSpeedMultiplier: 1 + (safeLevel - 1) * 0.015,
    ghostSpeedMultiplier: 1 + (safeLevel - 1) * 0.018,
    frightenedDurationMs: Math.max(2400, 7000 - (safeLevel - 1) * 380),
    fruitSpawnDelayMs: Math.max(5000, 12000 - (safeLevel - 1) * 350),
    fruitVisibleMs: Math.max(4200, 10000 - (safeLevel - 1) * 220),
  };
}

function applyLevelTuning(levelNumber) {
  currentLevelTuning = getLevelTuning(levelNumber);
  fps = 60;
}

function setPhase(nextPhase, options = {}) {
  phase = nextPhase;
  phaseMessage = options.message || "";
  phaseUntil = options.durationMs ? lastUpdateNow + options.durationMs : 0;
  renderPauseButton();
  renderStartButton();
}

function isGhostFrightened() {
  return lastUpdateNow < frightenedUntil;
}

function clearFrightenedMode() {
  frightenedUntil = 0;
  ghostEatChain = 0;
}

function shouldFlashFrightenedGhosts() {
  const utils = getGameplayUtils();
  if (!utils || typeof utils.isFrightenedFlashing !== "function") {
    return false;
  }

  return utils.isFrightenedFlashing(
    lastUpdateNow,
    frightenedUntil,
    FRIGHTENED_FLASH_WINDOW_MS,
    FRIGHTENED_FLASH_INTERVAL_MS
  );
}

function activateFrightenedMode(durationMs) {
  frightenedUntil = Math.max(frightenedUntil, lastUpdateNow + durationMs);
  ghostEatChain = 0;
  for (let i = 0; i < ghosts.length; i++) {
    const ghost = ghosts[i];
    if (!ghost || ghost.isEaten() || ghost.isInHouse()) continue;
    ghost.reverseDirection();
  }
  playGameSfx("powerPellet");
}

function getGhostHouseExitTarget() {
  return tileToPixel(GHOST_HOUSE_EXIT_TILE);
}

function getGhostHomeTarget() {
  return tileToPixel(GHOST_HOME_TILE);
}

function canReleaseGhostFromHouse(ghost) {
  if (!ghost || !ghost.houseState) return false;

  const utils = getGameplayUtils();
  const elapsed = Math.max(0, lastUpdateNow - roundStartAt);
  if (utils && typeof utils.shouldReleaseGhostFromHouse === "function") {
    return utils.shouldReleaseGhostFromHouse({
      dotsEatenThisRound,
      releaseDotThreshold: ghost.houseState.releaseDotThreshold,
      elapsedMs: elapsed,
      forceReleaseMs: ghost.houseState.forceReleaseMs,
    });
  }

  return (
    dotsEatenThisRound >= ghost.houseState.releaseDotThreshold ||
    elapsed >= ghost.houseState.forceReleaseMs
  );
}

function getFrightenedTargetForGhost(ghost) {
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

  const fallbackIndex = ghost
    ? (ghost.randomTargetIndex + 2) % randomTargetsForGhosts.length
    : 0;
  return randomTargetsForGhosts[fallbackIndex];
}

function getGhostScatterTarget(ghost) {
  if (!ghost || !ghost.scatterTile) {
    return randomTargetsForGhosts[0];
  }
  return tileToPixel(ghost.scatterTile);
}

function getGhostTargetForPersonality(ghost) {
  if (!ghost || !pacman) return randomTargetsForGhosts[0];

  if (ghostGlobalMode === "scatter") {
    return getGhostScatterTarget(ghost);
  }

  const utils = getGameplayUtils();
  const bounds = { maxX: map[0].length - 1, maxY: map.length - 1 };
  const pacmanTile = { x: pacman.getMapX(), y: pacman.getMapY() };
  const pacmanDirection = pacman.direction;

  let targetTile = { x: pacmanTile.x, y: pacmanTile.y };

  if (ghost.personality === "blinky") {
    targetTile =
      utils && typeof utils.computeBlinkyTargetTile === "function"
        ? utils.computeBlinkyTargetTile(pacmanTile)
        : pacmanTile;
  } else if (ghost.personality === "pinky") {
    targetTile =
      utils && typeof utils.computePinkyTargetTile === "function"
        ? utils.computePinkyTargetTile(pacmanTile, pacmanDirection, bounds)
        : pacmanTile;
  } else if (ghost.personality === "inky") {
    const blinky = ghosts.find((entry) => entry.personality === "blinky");
    const blinkyTile = blinky
      ? { x: blinky.getMapX(), y: blinky.getMapY() }
      : { x: pacmanTile.x, y: pacmanTile.y };

    targetTile =
      utils && typeof utils.computeInkyTargetTile === "function"
        ? utils.computeInkyTargetTile(pacmanTile, pacmanDirection, blinkyTile, bounds)
        : pacmanTile;
  } else if (ghost.personality === "clyde") {
    const clydeTile = { x: ghost.getMapX(), y: ghost.getMapY() };
    targetTile =
      utils && typeof utils.computeClydeTargetTile === "function"
        ? utils.computeClydeTargetTile(
            pacmanTile,
            clydeTile,
            ghost.scatterTile,
            8
          )
        : pacmanTile;
  }

  return tileToPixel(targetTile);
}

function updateGhostGlobalMode() {
  if (isGhostFrightened()) return;

  const utils = getGameplayUtils();
  const elapsed = Math.max(0, lastUpdateNow - roundStartAt);

  if (utils && typeof utils.computeScatterChaseMode === "function") {
    ghostGlobalMode = utils.computeScatterChaseMode(elapsed, GHOST_MODE_SCHEDULE);
  } else {
    ghostGlobalMode = elapsed < 7000 ? "scatter" : "chase";
  }

  if (ghostGlobalMode !== lastGhostGlobalMode) {
    for (let i = 0; i < ghosts.length; i++) {
      const ghost = ghosts[i];
      if (!ghost || ghost.isEaten() || ghost.isInHouse()) continue;
      ghost.reverseDirection();
    }
    lastGhostGlobalMode = ghostGlobalMode;
  }
}

function getCurrentGhostModeLabel() {
  if (isGhostFrightened()) return "FRIGHT";
  return ghostGlobalMode.toUpperCase();
}

function resetFruitState() {
  fruit.active = false;
  fruit.expiresAt = 0;
  fruit.nextSpawnAt = lastUpdateNow + currentLevelTuning.fruitSpawnDelayMs;
  fruit.spawnsThisRound = 0;
  fruit.spec = getFruitSpecForLevel(level);
}

function spawnFruit() {
  if (!pacman) return;
  if (fruit.spawnsThisRound >= 2) return;

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
  fruit.expiresAt = lastUpdateNow + currentLevelTuning.fruitVisibleMs;
  fruit.spawnsThisRound += 1;
}

function updateFruitState() {
  if (fruit.active && lastUpdateNow >= fruit.expiresAt) {
    fruit.active = false;
    fruit.expiresAt = 0;
    fruit.nextSpawnAt = lastUpdateNow + currentLevelTuning.fruitSpawnDelayMs;
  }

  if (
    !fruit.active &&
    fruit.spawnsThisRound < 2 &&
    lastUpdateNow >= fruit.nextSpawnAt &&
    remainingFoodCount > 0
  ) {
    spawnFruit();
  }
}

function tryConsumeFruit() {
  if (!fruit.active || !pacman) return;
  if (pacman.getMapX() !== fruit.x || pacman.getMapY() !== fruit.y) return;

  fruit.active = false;
  fruit.expiresAt = 0;
  fruit.nextSpawnAt = lastUpdateNow + currentLevelTuning.fruitSpawnDelayMs;

  addScore(fruit.spec.points);
  addPointPopup(fruit.x, fruit.y, `${fruit.spec.points}`, "#FFE16A", 1100);
  playGameSfx("fruit");
}

function getCollidingGhostIndices() {
  const colliding = { dangerous: [], frightened: [] };
  const pacX = pacman.getMapX();
  const pacY = pacman.getMapY();

  for (let i = 0; i < ghosts.length; i++) {
    const ghost = ghosts[i];
    if (!ghost) continue;

    if (ghost.getMapX() !== pacX || ghost.getMapY() !== pacY) {
      continue;
    }

    if (ghost.isEaten()) continue;

    if (isGhostFrightened() && ghost.isFrightened()) {
      colliding.frightened.push(i);
    } else {
      colliding.dangerous.push(i);
    }
  }

  return colliding;
}

function eatCollidingGhosts(indices) {
  const unique = [...new Set(indices)];
  const utils = getGameplayUtils();

  for (let i = 0; i < unique.length; i++) {
    const ghost = ghosts[unique[i]];
    if (!ghost || ghost.isEaten()) continue;

    const points =
      utils && typeof utils.computeGhostEatScore === "function"
        ? utils.computeGhostEatScore(200, ghostEatChain)
        : 200 * Math.pow(2, ghostEatChain);

    addScore(points);
    addPointPopup(ghost.getMapX(), ghost.getMapY(), `${points}`, "#78F7FF", 1200);
    ghostEatChain =
      utils && typeof utils.nextGhostEatChain === "function"
        ? utils.nextGhostEatChain(ghostEatChain, 6)
        : Math.min(ghostEatChain + 1, 6);

    ghost.setEatenMode();
    playGameSfx("ghostEaten");
  }
}

function createNewPacman() {
  const baseSpeed = oneBlockSize / 12.5;
  const speed = quantizeSpeed(baseSpeed * currentLevelTuning.pacmanSpeedMultiplier);

  pacman = new Pacman(
    pacmanStart.x * oneBlockSize,
    pacmanStart.y * oneBlockSize,
    oneBlockSize,
    oneBlockSize,
    speed
  );
}

function createGhosts() {
  for (let i = 0; i < ghosts.length; i++) {
    if (ghosts[i] && typeof ghosts[i].dispose === "function") {
      ghosts[i].dispose();
    }
  }
  ghosts = [];

  for (let i = 0; i < GHOST_DEFINITIONS.length; i++) {
    const def = GHOST_DEFINITIONS[i];
    const spawnPixel = tileToPixel(def.spawnTile);

    const ghost = new Ghost(
      spawnPixel.x,
      spawnPixel.y,
      oneBlockSize,
      oneBlockSize,
      quantizeSpeed((pacman.speed * 0.78) * currentLevelTuning.ghostSpeedMultiplier),
      ghostImageLocations[def.spriteIndex].x,
      ghostImageLocations[def.spriteIndex].y,
      124,
      116,
      6 + i,
      {
        personality: def.id,
        displayName: def.displayName,
        scatterTile: def.scatterTile,
        startInHouse: def.startInHouse,
        releaseDotThreshold: def.releaseDotThreshold,
        forceReleaseMs: def.forceReleaseMs,
      }
    );

    ghosts.push(ghost);
  }
}

function disposeActors() {
  if (pacman && typeof pacman.dispose === "function") {
    pacman.dispose();
  }
  for (let i = 0; i < ghosts.length; i++) {
    if (ghosts[i] && typeof ghosts[i].dispose === "function") {
      ghosts[i].dispose();
    }
  }
}

function prepareRound() {
  clearFrightenedMode();
  ghostGlobalMode = "scatter";
  lastGhostGlobalMode = "scatter";
  dotsEatenThisRound = 0;
  updateRandomTargetsForGhosts();
  createNewPacman();
  createGhosts();
  resetFruitState();
}

function startNewGame() {
  disposeActors();
  score = 0;
  lives = STARTING_LIVES;
  level = START_LEVEL;
  nextBonusLifeScore = BONUS_LIFE_STEP;
  applyLevelTuning(level);
  resetMap();
  prepareRound();
  setPhase(GAME_PHASE_READY, {
    durationMs: ROUND_READY_MS,
    message: "READY!",
  });
}

function startNextLevel() {
  level += 1;
  applyLevelTuning(level);
  resetMap();
  prepareRound();
  setPhase(GAME_PHASE_READY, {
    durationMs: ROUND_READY_MS,
    message: "READY!",
  });
}

function restartCurrentRun() {
  startNewGame();
  playGameSfx("ui");
}

function onLevelComplete() {
  syncHighScore();
  playGameSfx("levelClear");
  setPhase(GAME_PHASE_INTERMISSION, {
    durationMs: INTERMISSION_MS,
    message: "STAGE CLEAR!",
  });
}

function onGhostCollision() {
  lives -= 1;
  clearFrightenedMode();
  fruit.active = false;
  playGameSfx("death");

  setPhase(GAME_PHASE_DYING, {
    durationMs: LIFE_LOSS_MS,
    message: lives > 0 ? "OUCH!" : "GAME OVER",
  });
}

function setPaused(nextPaused) {
  const shouldPause = Boolean(nextPaused);
  if (shouldPause && phase === GAME_PHASE_PLAYING) {
    setPhase(GAME_PHASE_PAUSED, { message: "PAUSED" });
    playGameSfx("ui");
  } else if (!shouldPause && phase === GAME_PHASE_PAUSED) {
    setPhase(GAME_PHASE_PLAYING);
    playGameSfx("ui");
  }
}

function togglePaused() {
  setPaused(phase !== GAME_PHASE_PAUSED);
}

function mapDirectionNameToCode(directionName) {
  if (directionName === "left") return DIRECTION_LEFT;
  if (directionName === "up") return DIRECTION_UP;
  if (directionName === "right") return DIRECTION_RIGHT;
  if (directionName === "down") return DIRECTION_BOTTOM;
  return null;
}

function setPacmanDirection(nextDirection) {
  if (!pacman) return;
  if (phase === GAME_PHASE_PAUSED) {
    setPaused(false);
  }
  if (phase !== GAME_PHASE_PLAYING && phase !== GAME_PHASE_READY) {
    return;
  }
  pacman.nextDirection = nextDirection;
}

function getActionForKey(key) {
  const normalized = normalizeKeyName(key);
  const actions = Object.keys(settings.keybinds);
  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    if (settings.keybinds[action] === normalized) {
      return action;
    }
  }

  if (normalized === "arrowleft") return "left";
  if (normalized === "arrowup") return "up";
  if (normalized === "arrowright") return "right";
  if (normalized === "arrowdown") return "down";

  return null;
}

function bindKey(action, rawKey) {
  const key = normalizeKeyName(rawKey);
  if (!key) return;

  const actions = Object.keys(settings.keybinds);
  for (let i = 0; i < actions.length; i++) {
    if (actions[i] !== action && settings.keybinds[actions[i]] === key) {
      settings.keybinds[actions[i]] = DEFAULT_KEYBINDS[actions[i]];
    }
  }

  settings.keybinds[action] = key;
  persistSettings();
  pendingRebindAction = null;
  renderSettingsUi();
}

function handleAction(action) {
  if (action === "left") {
    setPacmanDirection(DIRECTION_LEFT);
    return;
  }
  if (action === "up") {
    setPacmanDirection(DIRECTION_UP);
    return;
  }
  if (action === "right") {
    setPacmanDirection(DIRECTION_RIGHT);
    return;
  }
  if (action === "down") {
    setPacmanDirection(DIRECTION_BOTTOM);
    return;
  }
  if (action === "pause") {
    togglePaused();
    return;
  }
  if (action === "restart") {
    restartCurrentRun();
    return;
  }
  if (action === "mute") {
    toggleMuted();
    return;
  }
  if (action === "start") {
    if (phase === GAME_PHASE_START || phase === GAME_PHASE_GAMEOVER) {
      startNewGame();
    } else if (phase === GAME_PHASE_PAUSED) {
      setPaused(false);
    }
  }
}

function clearSwipeState() {
  swipeStartX = null;
  swipeStartY = null;
}

function onCanvasTouchStart(event) {
  if (settings.mobileInputMode !== "buttons") return;
  if (!event.touches || event.touches.length === 0) return;
  primeAudioContext();
  swipeStartX = event.touches[0].clientX;
  swipeStartY = event.touches[0].clientY;
}

function onCanvasTouchMove(event) {
  if (settings.mobileInputMode !== "buttons") return;
  if (swipeStartX === null || swipeStartY === null) return;
  event.preventDefault();
}

function onCanvasTouchEnd(event) {
  if (settings.mobileInputMode !== "buttons") return;
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

  if (Math.abs(dx) < SWIPE_THRESHOLD_PX && Math.abs(dy) < SWIPE_THRESHOLD_PX) {
    return;
  }

  if (Math.abs(dx) > Math.abs(dy)) {
    setPacmanDirection(dx > 0 ? DIRECTION_RIGHT : DIRECTION_LEFT);
  } else {
    setPacmanDirection(dy > 0 ? DIRECTION_BOTTOM : DIRECTION_UP);
  }
}

function updateMobileInputPresentation() {
  const coarsePointer = window.matchMedia("(hover: none), (pointer: coarse)").matches;

  if (touchControlsRoot) {
    const showButtons = coarsePointer && settings.mobileInputMode === "buttons";
    touchControlsRoot.classList.toggle("hidden", !showButtons);
  }

  if (virtualStickRoot) {
    const showStick = coarsePointer && settings.mobileInputMode === "stick";
    virtualStickRoot.classList.toggle("hidden", !showStick);
  }
}

function resetStickKnob() {
  if (!stickKnob) return;
  stickKnob.style.transform = "translate(0px, 0px)";
}

function updateDirectionFromVector(dx, dy) {
  if (Math.abs(dx) < STICK_DEAD_ZONE && Math.abs(dy) < STICK_DEAD_ZONE) {
    return;
  }

  if (Math.abs(dx) > Math.abs(dy)) {
    setPacmanDirection(dx > 0 ? DIRECTION_RIGHT : DIRECTION_LEFT);
  } else {
    setPacmanDirection(dy > 0 ? DIRECTION_BOTTOM : DIRECTION_UP);
  }
}

function onStickPointerDown(event) {
  if (settings.mobileInputMode !== "stick") return;
  if (!stickBase) return;

  primeAudioContext();
  stickPointerId = event.pointerId;
  stickBase.setPointerCapture(stickPointerId);

  const rect = stickBase.getBoundingClientRect();
  stickCenterX = rect.left + rect.width / 2;
  stickCenterY = rect.top + rect.height / 2;

  onStickPointerMove(event);
}

function onStickPointerMove(event) {
  if (stickPointerId !== event.pointerId) return;
  if (!stickKnob) return;

  const rawDx = event.clientX - stickCenterX;
  const rawDy = event.clientY - stickCenterY;
  const magnitude = Math.hypot(rawDx, rawDy);
  const clampScale = magnitude > STICK_MAX_RADIUS ? STICK_MAX_RADIUS / magnitude : 1;
  const dx = rawDx * clampScale;
  const dy = rawDy * clampScale;

  stickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
  updateDirectionFromVector(dx, dy);
}

function onStickPointerUp(event) {
  if (stickPointerId !== event.pointerId) return;
  if (stickBase) {
    try {
      stickBase.releasePointerCapture(stickPointerId);
    } catch (error) {
      // Ignore pointer capture cleanup errors.
    }
  }
  stickPointerId = null;
  resetStickKnob();
}

function pollGamepadInput() {
  if (typeof navigator.getGamepads !== "function") return;
  const pads = navigator.getGamepads();
  const gamepad = pads && pads[0] ? pads[0] : null;

  if (!gamepad) {
    gamepadButtonsState = [];
    return;
  }

  function buttonPressed(index) {
    return Boolean(gamepad.buttons[index] && gamepad.buttons[index].pressed);
  }

  function justPressed(index) {
    const previous = Boolean(gamepadButtonsState[index]);
    const current = buttonPressed(index);
    gamepadButtonsState[index] = current;
    return current && !previous;
  }

  if (justPressed(9)) {
    handleAction("start");
  }
  if (justPressed(1)) {
    handleAction("restart");
  }
  if (justPressed(2)) {
    handleAction("mute");
  }
  if (justPressed(3)) {
    handleAction("pause");
  }

  if (phase !== GAME_PHASE_PLAYING && phase !== GAME_PHASE_READY) {
    return;
  }

  const axisX = Number(gamepad.axes[0] || 0);
  const axisY = Number(gamepad.axes[1] || 0);
  const left = buttonPressed(14) || axisX < -0.45;
  const right = buttonPressed(15) || axisX > 0.45;
  const up = buttonPressed(12) || axisY < -0.45;
  const down = buttonPressed(13) || axisY > 0.45;

  if (left || right || up || down) {
    if (Math.abs(axisX) > Math.abs(axisY)) {
      if (left) setPacmanDirection(DIRECTION_LEFT);
      if (right) setPacmanDirection(DIRECTION_RIGHT);
    } else {
      if (up) setPacmanDirection(DIRECTION_UP);
      if (down) setPacmanDirection(DIRECTION_BOTTOM);
    }
  }
}

function registerPwaHandlers() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js").catch(() => {
        // Service worker registration can fail in unsupported/private contexts.
      });
    });
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    renderInstallButton();
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    renderInstallButton();
    addHudToast("App installed", "#78F7FF", 1500);
  });
}

function handleInstallApp() {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  deferredInstallPrompt.userChoice.finally(() => {
    deferredInstallPrompt = null;
    renderInstallButton();
  });
}

function updatePhaseTransitions() {
  if (!phaseUntil || lastUpdateNow < phaseUntil) return;

  if (phase === GAME_PHASE_READY) {
    roundStartAt = lastUpdateNow;
    setPhase(GAME_PHASE_PLAYING);
    return;
  }

  if (phase === GAME_PHASE_DYING) {
    if (lives <= 0) {
      syncHighScore();
      setPhase(GAME_PHASE_GAMEOVER, {
        message: "Press Start or your start key",
      });
      return;
    }

    prepareRound();
    setPhase(GAME_PHASE_READY, {
      durationMs: ROUND_READY_MS,
      message: "READY!",
    });
    return;
  }

  if (phase === GAME_PHASE_INTERMISSION) {
    startNextLevel();
  }
}

function updatePopups() {
  pointPopups = pointPopups.filter((popup) => lastUpdateNow < popup.expiresAt);
  hudToasts = hudToasts.filter((toast) => lastUpdateNow < toast.expiresAt);
}

function updateGameplay() {
  if (!pacman) return;

  pacman.moveProcess();
  const eatResult = pacman.eat();

  if (eatResult && eatResult.atePellet) {
    remainingFoodCount = Math.max(0, remainingFoodCount - 1);
    dotsEatenThisRound += 1;
  }

  if (eatResult && eatResult.atePowerPellet) {
    activateFrightenedMode(currentLevelTuning.frightenedDurationMs);
  }

  if (!isGhostFrightened() && ghostEatChain !== 0) {
    ghostEatChain = 0;
  }

  updateGhostGlobalMode();
  updateFruitState();
  tryConsumeFruit();
  updateGhosts();

  const colliding = getCollidingGhostIndices();
  if (colliding.frightened.length > 0) {
    eatCollidingGhosts(colliding.frightened);
  }

  if (colliding.dangerous.length > 0) {
    onGhostCollision();
    return;
  }

  if (remainingFoodCount <= 0) {
    onLevelComplete();
  }
}

function update() {
  pollGamepadInput();
  updatePhaseTransitions();
  updatePopups();

  if (phase === GAME_PHASE_PLAYING) {
    updateGameplay();
  }
}

function drawWalls() {
  for (let i = 0; i < wallTiles.length; i++) {
    const tile = wallTiles[i];
    const x = tile.x;
    const y = tile.y;

    createRect(
      x * oneBlockSize,
      y * oneBlockSize,
      oneBlockSize,
      oneBlockSize,
      "#342DCA"
    );

    const wallSpaceWidth = oneBlockSize / 1.6;
    const wallOffset = (oneBlockSize - wallSpaceWidth) / 2;
    const wallInnerColor = "black";

    if (x > 0 && map[y][x - 1] === 1) {
      createRect(
        x * oneBlockSize,
        y * oneBlockSize + wallOffset,
        wallSpaceWidth + wallOffset,
        wallSpaceWidth,
        wallInnerColor
      );
    }

    if (x < map[0].length - 1 && map[y][x + 1] === 1) {
      createRect(
        x * oneBlockSize + wallOffset,
        y * oneBlockSize + wallOffset,
        wallSpaceWidth + wallOffset,
        wallSpaceWidth,
        wallInnerColor
      );
    }

    if (y < map.length - 1 && map[y + 1][x] === 1) {
      createRect(
        x * oneBlockSize + wallOffset,
        y * oneBlockSize + wallOffset,
        wallSpaceWidth,
        wallSpaceWidth + wallOffset,
        wallInnerColor
      );
    }

    if (y > 0 && map[y - 1][x] === 1) {
      createRect(
        x * oneBlockSize + wallOffset,
        y * oneBlockSize,
        wallSpaceWidth,
        wallSpaceWidth + wallOffset,
        wallInnerColor
      );
    }
  }
}

function drawFoods() {
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[0].length; x++) {
      if (map[y][x] !== 2 && map[y][x] !== 4) continue;

      const isPowerPellet = map[y][x] === 4;
      const size = isPowerPellet ? oneBlockSize * 0.6 : oneBlockSize / 3;
      const offset = (oneBlockSize - size) / 2;

      createRect(
        x * oneBlockSize + offset,
        y * oneBlockSize + offset,
        size,
        size,
        isPowerPellet ? "#F7FF8A" : "#FEB897"
      );
    }
  }
}

function drawFruit() {
  if (!fruit.active) return;

  const tileX = fruit.x * oneBlockSize;
  const tileY = fruit.y * oneBlockSize;
  const fruitRadius = oneBlockSize * 0.23;
  const centerX = tileX + oneBlockSize * 0.5;
  const centerY = tileY + oneBlockSize * 0.62;

  canvasContext.strokeStyle = "#68D98E";
  canvasContext.lineWidth = Math.max(2, oneBlockSize * 0.08);
  canvasContext.beginPath();
  canvasContext.moveTo(centerX, centerY - fruitRadius);
  canvasContext.quadraticCurveTo(
    tileX + oneBlockSize * 0.56,
    tileY + oneBlockSize * 0.12,
    tileX + oneBlockSize * 0.68,
    tileY + oneBlockSize * 0.2
  );
  canvasContext.stroke();

  canvasContext.fillStyle = fruit.spec.color;
  canvasContext.beginPath();
  canvasContext.arc(centerX, centerY, fruitRadius, 0, 2 * Math.PI);
  canvasContext.fill();

  canvasContext.fillStyle = "#F8FAFC";
  canvasContext.beginPath();
  canvasContext.arc(
    centerX - fruitRadius * 0.35,
    centerY - fruitRadius * 0.3,
    fruitRadius * 0.28,
    0,
    2 * Math.PI
  );
  canvasContext.fill();
}

function drawPacman() {
  if (!pacman) return;
  if (phase === GAME_PHASE_DYING) {
    const flicker = Math.floor(lastUpdateNow / 80) % 2 === 0;
    if (flicker) return;
  }
  pacman.draw();
}

function drawRemainingLives() {
  canvasContext.font = "20px Emulogic";
  canvasContext.fillStyle = "white";
  canvasContext.fillText("Lives:", logicalW - 190, oneBlockSize * (map.length + 1));

  for (let i = 0; i < lives; i++) {
    canvasContext.drawImage(
      pacmanFrames,
      2 * oneBlockSize,
      0,
      oneBlockSize,
      oneBlockSize,
      logicalW - 120 + i * oneBlockSize,
      oneBlockSize * map.length + 2,
      oneBlockSize,
      oneBlockSize
    );
  }
}

function drawScoreHud() {
  const hudY = oneBlockSize * (map.length + 1);
  const hudY2 = oneBlockSize * (map.length + 1.8);

  canvasContext.font = "20px Emulogic";
  canvasContext.fillStyle = "white";
  canvasContext.fillText(`Score: ${score}`, 0, hudY);

  canvasContext.font = "16px Emulogic";
  canvasContext.fillStyle = "#FFE16A";
  canvasContext.fillText(`High: ${highScore}`, 0, hudY2);

  canvasContext.fillStyle = "#B8D8FF";
  canvasContext.fillText(`Level: ${level}`, 220, hudY);

  canvasContext.fillStyle = "#78F7FF";
  canvasContext.fillText(`Mode: ${getCurrentGhostModeLabel()}`, 220, hudY2);

  canvasContext.fillStyle = "#FFC95A";
  canvasContext.fillText(`Fruit: ${fruit.spec.name}`, 390, hudY2);

  if (isGhostFrightened()) {
    const remainingMs = Math.max(0, frightenedUntil - lastUpdateNow);
    const seconds = Math.ceil(remainingMs / 1000);
    canvasContext.fillStyle = "#78F7FF";
    canvasContext.fillText(`Fright: ${seconds}s`, 390, hudY);
  }
}

function drawPointPopups() {
  for (let i = 0; i < pointPopups.length; i++) {
    const popup = pointPopups[i];
    const life = (popup.expiresAt - lastUpdateNow) / (popup.expiresAt - popup.createdAt);
    const yOffset = (1 - life) * oneBlockSize;

    canvasContext.font = "14px Emulogic";
    canvasContext.fillStyle = popup.color;
    canvasContext.globalAlpha = Math.max(0, Math.min(1, life));
    canvasContext.fillText(popup.text, popup.x, popup.y - yOffset);
    canvasContext.globalAlpha = 1;
  }
}

function drawHudToasts() {
  for (let i = 0; i < hudToasts.length; i++) {
    const toast = hudToasts[i];
    const life = (toast.expiresAt - lastUpdateNow) / (toast.expiresAt - toast.createdAt);
    canvasContext.font = "14px Emulogic";
    canvasContext.fillStyle = toast.color;
    canvasContext.globalAlpha = Math.max(0, Math.min(1, life));
    canvasContext.fillText(toast.text, logicalW / 2 - 50, oneBlockSize * (map.length + 1));
    canvasContext.globalAlpha = 1;
  }
}

function drawOverlay(title, subtitle) {
  canvasContext.fillStyle = "rgba(0, 0, 0, 0.58)";
  canvasContext.fillRect(0, 0, logicalW, logicalH);

  canvasContext.textAlign = "center";
  canvasContext.font = "24px Emulogic";
  canvasContext.fillStyle = "#FFDE00";
  canvasContext.fillText(title, logicalW / 2, logicalH / 2 - 12);

  if (subtitle) {
    canvasContext.font = "12px Emulogic";
    canvasContext.fillStyle = "#DDE7FF";
    canvasContext.fillText(subtitle, logicalW / 2, logicalH / 2 + oneBlockSize);
  }

  canvasContext.textAlign = "start";
}

function drawReadyMessage() {
  canvasContext.textAlign = "center";
  canvasContext.font = "22px Emulogic";
  canvasContext.fillStyle = "#FFDE00";
  canvasContext.fillText("READY!", logicalW / 2, logicalH / 2);
  canvasContext.textAlign = "start";
}

function drawPhaseOverlay() {
  if (phase === GAME_PHASE_PAUSED) {
    drawOverlay("PAUSED", "Press pause key or button to continue");
    return;
  }

  if (phase === GAME_PHASE_START) {
    drawOverlay("PAC-MAN", "Press Start, Enter, or gamepad Start");
    return;
  }

  if (phase === GAME_PHASE_GAMEOVER) {
    drawOverlay("GAME OVER", "Press Start or Restart");
    return;
  }

  if (phase === GAME_PHASE_DYING && lives <= 0) {
    drawOverlay("GAME OVER", "Press Start or Restart");
    return;
  }

  if (phase === GAME_PHASE_INTERMISSION) {
    drawOverlay("STAGE CLEAR!", `Next: Level ${level + 1}`);
    return;
  }

  if (phase === GAME_PHASE_READY) {
    drawReadyMessage();
  }
}

function draw() {
  canvasContext.clearRect(0, 0, logicalW, logicalH);
  createRect(0, 0, logicalW, logicalH, "black");

  drawWalls();
  drawFoods();
  drawFruit();
  drawGhosts();
  drawPacman();
  drawPointPopups();
  drawScoreHud();
  drawRemainingLives();
  drawHudToasts();
  drawPhaseOverlay();
}

function gameLoop(now) {
  if (!lastUpdateNow) lastUpdateNow = now;
  const delta = Math.min(100, now - lastUpdateNow);
  lastUpdateNow = now;

  frameAccumulator += delta;
  while (frameAccumulator >= FRAME_STEP_MS) {
    update();
    frameAccumulator -= FRAME_STEP_MS;
  }

  draw();
  animationFrameId = window.requestAnimationFrame(gameLoop);
}

function wireUiEvents() {
  for (let i = 0; i < touchButtons.length; i++) {
    touchButtons[i].addEventListener("pointerdown", (event) => {
      if (settings.mobileInputMode !== "buttons") return;
      event.preventDefault();
      primeAudioContext();
      const directionName = event.currentTarget.dataset.direction;
      const nextDirection = mapDirectionNameToCode(directionName);
      if (nextDirection === null) return;
      setPacmanDirection(nextDirection);
    });
  }

  if (stickBase) {
    stickBase.addEventListener("pointerdown", onStickPointerDown);
    stickBase.addEventListener("pointermove", onStickPointerMove);
    stickBase.addEventListener("pointerup", onStickPointerUp);
    stickBase.addEventListener("pointercancel", onStickPointerUp);
  }

  if (startGameButton) {
    startGameButton.addEventListener("click", () => {
      primeAudioContext();
      handleAction("start");
    });
  }

  if (pauseToggleButton) {
    pauseToggleButton.addEventListener("click", () => {
      primeAudioContext();
      handleAction("pause");
    });
  }

  if (restartGameButton) {
    restartGameButton.addEventListener("click", () => {
      primeAudioContext();
      handleAction("restart");
    });
  }

  if (muteToggleButton) {
    muteToggleButton.addEventListener("click", () => {
      primeAudioContext();
      handleAction("mute");
    });
  }

  if (installAppButton) {
    installAppButton.addEventListener("click", () => {
      primeAudioContext();
      handleInstallApp();
    });
  }

  if (volumeControl) {
    volumeControl.addEventListener("input", (event) => {
      settings.volume = Number(event.target.value);
      applyAudioSettings();
      persistSettings();
    });
  }

  if (mobileInputModeSelect) {
    mobileInputModeSelect.addEventListener("change", (event) => {
      settings.mobileInputMode = event.target.value === "stick" ? "stick" : "buttons";
      persistSettings();
      updateMobileInputPresentation();
      resetStickKnob();
    });
  }

  for (let i = 0; i < keybindButtons.length; i++) {
    keybindButtons[i].addEventListener("click", () => {
      pendingRebindAction = keybindButtons[i].dataset.action || null;
      renderSettingsUi();
    });
  }

  canvas.addEventListener("touchstart", onCanvasTouchStart, { passive: true });
  canvas.addEventListener("touchmove", onCanvasTouchMove, { passive: false });
  canvas.addEventListener("touchend", onCanvasTouchEnd, { passive: false });
  canvas.addEventListener("touchcancel", clearSwipeState, { passive: true });

  window.addEventListener("keydown", (event) => {
    const normalizedKey = normalizeKeyName(event.key);
    primeAudioContext();

    if (pendingRebindAction) {
      event.preventDefault();
      if (normalizedKey === "escape") {
        pendingRebindAction = null;
        renderSettingsUi();
        return;
      }
      bindKey(pendingRebindAction, normalizedKey);
      return;
    }

    const action = getActionForKey(normalizedKey);
    if (!action) return;

    if (event.repeat && (action === "pause" || action === "restart" || action === "mute" || action === "start")) {
      return;
    }

    event.preventDefault();
    handleAction(action);
  });

  window.addEventListener("resize", () => {
    resizeCanvasToFitViewport();
    updateMobileInputPresentation();
  });

  window.addEventListener("beforeunload", () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    disposeActors();
  });
}

function boot() {
  highScore = readHighScoreFromStorage();
  syncHighScore();

  resetMap();
  applyLevelTuning(level);
  prepareRound();

  resizeCanvasToFitViewport();
  renderStartButton();
  renderPauseButton();
  renderMuteButton();
  renderInstallButton();
  renderSettingsUi();
  updateMobileInputPresentation();
  applyAudioSettings();
  registerPwaHandlers();
  wireUiEvents();

  setPhase(GAME_PHASE_START, { message: "Press Start" });
  animationFrameId = window.requestAnimationFrame(gameLoop);
}

boot();
