const canvas = document.getElementById("canvas");
const canvasContext = canvas.getContext("2d");
const pacmanFrames = document.getElementById("animation");
const ghostFrames = document.getElementById("ghosts");
const startGameButton = document.getElementById("start-game");
const pauseToggleButton = document.getElementById("pause-toggle");
const restartGameButton = document.getElementById("restart-game");
const muteToggleButton = document.getElementById("mute-toggle");
const arcadeViewToggleButton = document.getElementById("arcade-view-toggle");
const installAppButton = document.getElementById("install-app");
const updateAppButton = document.getElementById("update-app");
const replayLastButton = document.getElementById("replay-last");
const dailyChallengeButton = document.getElementById("daily-challenge");
const replayExportButton = document.getElementById("replay-export");
const replayImportButton = document.getElementById("replay-import");
const replayShareButton = document.getElementById("replay-share");
const replayFileInput = document.getElementById("replay-file-input");
const volumeControl = document.getElementById("volume-control");
const sfxVolumeControl = document.getElementById("sfx-volume-control");
const musicVolumeControl = document.getElementById("music-volume-control");
const musicEnabledToggle = document.getElementById("music-enabled");
const hapticsEnabledToggle = document.getElementById("haptics-enabled");
const mobileInputModeSelect = document.getElementById("mobile-input-mode");
const challengeModeSelect = document.getElementById("challenge-mode");
const paletteModeSelect = document.getElementById("palette-mode");
const reducedMotionToggle = document.getElementById("reduced-motion");
const largeHudToggle = document.getElementById("large-hud");
const oneHandedModeToggle = document.getElementById("one-handed-mode");
const runSeedInput = document.getElementById("run-seed-input");
const applySeedButton = document.getElementById("apply-seed");
const copySeedButton = document.getElementById("copy-seed");
const seedStatus = document.getElementById("seed-status");
const simDebugEnabledToggle = document.getElementById("sim-debug-enabled");
const simPauseButton = document.getElementById("sim-pause");
const simStepButton = document.getElementById("sim-step");
const simDebugStatus = document.getElementById("sim-debug-status");
const replayStatus = document.getElementById("replay-status");
const dailyStatus = document.getElementById("daily-status");
const leaderboardOutput = document.getElementById("leaderboard-output");
const gamepadStartInput = document.getElementById("gamepad-btn-start");
const gamepadPauseInput = document.getElementById("gamepad-btn-pause");
const gamepadRestartInput = document.getElementById("gamepad-btn-restart");
const gamepadMuteInput = document.getElementById("gamepad-btn-mute");
const settingsPanel = document.getElementById("settings-panel");
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
const GAME_PHASE_CUTSCENE = "cutscene";
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
const ATTRACT_IDLE_MS = 7000;
const CHALLENGE_TIME_ATTACK_SECONDS = 120;
const FRIGHTENED_FLASH_WINDOW_MS = 2200;
const FRIGHTENED_FLASH_INTERVAL_MS = 180;
const MIN_FRUIT_SPAWN_DISTANCE = 8;
const MIN_GHOST_INITIAL_SPAWN_DISTANCE = 7;
const SETTINGS_STORAGE_KEY = "pacman.settings.v1";
const HIGH_SCORE_STORAGE_KEY = "pacman.highScore";
const DAILY_CHALLENGE_STORAGE_KEY = "pacman.daily.v1";
const LEADERBOARD_STORAGE_KEY = "pacman.leaderboard.v1";
const ARCADE_VIEW_STORAGE_KEY = "pacman.arcadeView.enabled";
const REPLAY_HASH_PREFIX = "#replay=";
const PERF_GUARDRAIL_CONFIG = Object.freeze({
  minSamples: 120,
  windowSize: 300,
  slowFrameMs: 34,
  severeFrameMs: 50,
  maxSlowRatio: 0.12,
  maxSevereRatio: 0.03,
  maxP95Ms: 36,
  maxP99Ms: 54,
  breachCooldownMs: 8000,
});
const DEFAULT_GAMEPAD_MAP = {
  start: 9,
  pause: 3,
  restart: 1,
  mute: 2,
};
const MUSIC_STEP_INTERVAL_MS = 250;
const GHOST_HOME_TILE = { x: 21, y: 13 };
const GHOST_HOUSE_EXIT_TILE = { x: 21, y: 12 };
const GHOST_HOUSE_EXIT_BY_PERSONALITY = {
  blinky: { x: 21, y: 11 },
  pinky: { x: 21, y: 12 },
  inky: { x: 21, y: 12 },
  clyde: { x: 21, y: 12 },
};
const BASE_AUDIO_GAIN = 0.25;
const ANALYTICS_EVENT_NAME = "pacman:analytics";
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

const GHOST_MODE_SCHEDULE_BY_LEVEL = [
  GHOST_MODE_SCHEDULE,
  GHOST_MODE_SCHEDULE,
  GHOST_MODE_SCHEDULE,
  [
    { mode: "scatter", durationMs: 5000 },
    { mode: "chase", durationMs: 20000 },
    { mode: "scatter", durationMs: 5000 },
    { mode: "chase", durationMs: 20000 },
    { mode: "scatter", durationMs: 5000 },
    { mode: "chase", durationMs: 20000 },
    { mode: "scatter", durationMs: 5000 },
    { mode: "chase", durationMs: Infinity },
  ],
  [
    { mode: "scatter", durationMs: 5000 },
    { mode: "chase", durationMs: 20000 },
    { mode: "scatter", durationMs: 5000 },
    { mode: "chase", durationMs: 20000 },
    { mode: "scatter", durationMs: 5000 },
    { mode: "chase", durationMs: Infinity },
  ],
  [
    { mode: "scatter", durationMs: 5000 },
    { mode: "chase", durationMs: 20000 },
    { mode: "scatter", durationMs: 5000 },
    { mode: "chase", durationMs: 1033000 },
    { mode: "scatter", durationMs: 17 },
    { mode: "chase", durationMs: Infinity },
  ],
];

const CUTSCENES_BY_LEVEL = {
  2: {
    title: "Act 1",
    subtitle: "Blinky chases Pac-Man",
    durationMs: 4400,
    tone: "amber",
  },
  5: {
    title: "Act 2",
    subtitle: "Blinky slows, Pac-Man flips momentum",
    durationMs: 4600,
    tone: "cyan",
  },
  9: {
    title: "Act 3",
    subtitle: "Fast chase finale",
    durationMs: 4800,
    tone: "rose",
  },
};

const ATTRACT_DEMO_INPUTS = [
  { frame: 4, action: "right" },
  { frame: 40, action: "right" },
  { frame: 72, action: "up" },
  { frame: 118, action: "left" },
  { frame: 190, action: "left" },
  { frame: 242, action: "down" },
  { frame: 310, action: "right" },
  { frame: 378, action: "right" },
  { frame: 430, action: "down" },
  { frame: 480, action: "left" },
  { frame: 548, action: "left" },
  { frame: 606, action: "up" },
  { frame: 660, action: "right" },
];

const CHALLENGE_MODES = {
  CLASSIC: "classic",
  TIME_ATTACK: "time-attack",
  NO_POWER: "no-power",
  ONE_LIFE: "one-life",
};

const COLOR_PALETTES = {
  classic: {
    background: "black",
    wallOuter: "#342DCA",
    wallInner: "black",
    pellet: "#FEB897",
    powerPellet: "#F7FF8A",
    textPrimary: "white",
    textHigh: "#FFE16A",
    textAccent: "#B8D8FF",
    textMode: "#78F7FF",
    textFruit: "#FFC95A",
    toastBonus: "#78F7FF",
    popupGhost: "#78F7FF",
    popupFruit: "#FFE16A",
    overlayTitle: "#FFDE00",
    overlaySubtitle: "#DDE7FF",
  },
  colorblind: {
    background: "#05080f",
    wallOuter: "#1E50FF",
    wallInner: "#09121D",
    pellet: "#FFDEA6",
    powerPellet: "#F5FF7B",
    textPrimary: "#F3F7FF",
    textHigh: "#FFE178",
    textAccent: "#ADD4FF",
    textMode: "#7EEBFF",
    textFruit: "#FFD089",
    toastBonus: "#84F2FF",
    popupGhost: "#84F2FF",
    popupFruit: "#FFE178",
    overlayTitle: "#FFE178",
    overlaySubtitle: "#E4EFFF",
  },
  "high-contrast": {
    background: "#000000",
    wallOuter: "#4E6BFF",
    wallInner: "#000000",
    pellet: "#FFFFFF",
    powerPellet: "#FFFFFF",
    textPrimary: "#FFFFFF",
    textHigh: "#FFFF66",
    textAccent: "#CFE1FF",
    textMode: "#7CFFFF",
    textFruit: "#FFD700",
    toastBonus: "#7CFFFF",
    popupGhost: "#7CFFFF",
    popupFruit: "#FFFF66",
    overlayTitle: "#FFFF66",
    overlaySubtitle: "#FFFFFF",
  },
};

const GHOST_DEFINITIONS = [
  {
    id: "blinky",
    displayName: "Blinky",
    spriteIndex: 0,
    scatterTile: { x: 42, y: 1 },
    startInHouse: false,
    releaseDotThreshold: 0,
    forceReleaseMs: 0,
    spawnTile: { x: 21, y: 11 },
  },
  {
    id: "pinky",
    displayName: "Pinky",
    spriteIndex: 1,
    scatterTile: { x: 1, y: 1 },
    startInHouse: true,
    releaseDotThreshold: 0,
    forceReleaseMs: 700,
    spawnTile: { x: 20, y: 13 },
  },
  {
    id: "inky",
    displayName: "Inky",
    spriteIndex: 2,
    scatterTile: { x: 42, y: 29 },
    startInHouse: true,
    releaseDotThreshold: 6,
    forceReleaseMs: 1800,
    spawnTile: { x: 21, y: 13 },
  },
  {
    id: "clyde",
    displayName: "Clyde",
    spriteIndex: 3,
    scatterTile: { x: 1, y: 29 },
    startInHouse: true,
    releaseDotThreshold: 14,
    forceReleaseMs: 3200,
    spawnTile: { x: 22, y: 13 },
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
  sfxVolume: 78,
  musicVolume: 40,
  musicEnabled: true,
  hapticsEnabled: false,
  mobileInputMode: "buttons",
  challengeMode: CHALLENGE_MODES.CLASSIC,
  paletteMode: "classic",
  reducedMotion: false,
  largeHud: false,
  oneHandedMode: false,
  simDebugEnabled: false,
  simPaused: false,
  gamepadMap: { ...DEFAULT_GAMEPAD_MAP },
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

const MUSIC_SEQUENCE = [
  { frequency: 262, duration: 0.18, volume: 0.08, wave: "triangle" },
  { frequency: 330, duration: 0.18, volume: 0.08, wave: "triangle" },
  { frequency: 392, duration: 0.18, volume: 0.08, wave: "triangle" },
  { frequency: 523, duration: 0.2, volume: 0.09, wave: "triangle" },
  { frequency: 392, duration: 0.18, volume: 0.08, wave: "triangle" },
  { frequency: 330, duration: 0.18, volume: 0.08, wave: "triangle" },
];

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
let phaseMessageSecondary = "";
let roundStartAt = 0;
let frightenedUntil = 0;
let ghostEatChain = 0;
let ghostGlobalMode = "scatter";
let lastGhostGlobalMode = "scatter";
let currentLevelTuning = null;
let currentGhostModeSchedule = GHOST_MODE_SCHEDULE;
let dotsEatenThisRound = 0;
let remainingFoodCount = 0;
let initialFoodCount = 0;
let levelsClearedThisRun = 0;
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
let stickMaxRadius = STICK_MAX_RADIUS;
let pendingRebindAction = null;
let settings = loadSettings();
let arcadeViewEnabled = false;
let audioContext = null;
let audioMasterGain = null;
let audioSfxGain = null;
let audioMusicGain = null;
let deferredInstallPrompt = null;
let swRegistration = null;
let swUpdateReady = false;
let gamepadButtonsState = [];
let challengeTimeRemainingMs = CHALLENGE_TIME_ATTACK_SECONDS * 1000;
let attractModeActive = false;
let attractTriggeredThisIdleWindow = false;
let lastUserIntentAt = performance.now();
let challengeModeBeforeAttract = null;
let activeCutscene = null;
let simulationFrame = 0;
let activeRunSeed = 1;
let runRandomState = 1;
let replayCurrentRun = null;
let replayLastRun = null;
let replayPlayback = null;
let runStartedAtMs = 0;
let activeRunIsDaily = false;
let activeRunIsReplay = false;
let runResultCommitted = false;
let simStepRequests = 0;
let musicLastStepAt = 0;
let musicStepIndex = 0;
let musicDuckingUntil = 0;
let replayCodec = null;
let framePacingMonitor = null;
let framePacingSnapshot = null;
let nextPerfGuardrailToastAt = 0;
let dailyChallengeState = loadDailyChallengeState();
let leaderboardState = loadLeaderboardState();

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
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
  [1,2,1,0,0,1,2,1,1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1,1,2,1,0,0,1,2,1],
  [1,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,2,1,1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,1,2,1,1,1,2,1,1,2,1,2,1,1,2,1],
  [1,2,2,1,2,1,2,1,1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1,1,2,1,2,1,2,2,1],
  [1,1,1,1,2,1,2,1,1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1,1,2,1,2,1,1,1,1],
  [0,0,0,0,2,0,0,0,0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0,0,0,0,2,0,0,0,0],
  [1,1,1,1,2,1,2,1,1,1,1,1,1,1,2,1,1,0,1,1,1,0,1,1,1,1,0,1,1,2,1,1,1,1,1,1,1,2,1,2,1,1,1,1],
  [1,2,2,2,2,1,2,1,1,1,1,1,1,1,2,1,1,0,1,1,1,0,1,1,1,1,0,1,1,2,1,1,1,1,1,1,1,2,1,2,2,2,2,1],
  [1,2,1,0,0,1,2,1,1,2,2,2,2,2,2,1,1,0,1,1,1,0,1,1,1,1,0,1,1,2,2,2,2,2,2,1,1,2,1,0,0,1,2,1],
  [1,2,1,2,2,1,2,1,1,2,1,1,1,1,2,1,1,0,1,1,1,0,1,1,1,1,0,1,1,2,1,1,1,1,2,1,1,2,1,2,2,1,2,1],
  [1,2,1,2,2,1,2,1,1,2,2,2,2,2,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,2,2,2,2,2,1,1,2,1,2,2,1,2,1],
  [1,2,2,2,2,1,2,1,1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1,1,2,1,2,2,2,2,1],
  [0,0,0,0,2,0,0,0,0,0,0,0,0,1,2,1,1,0,1,1,1,0,1,1,1,1,0,1,1,2,1,0,0,0,0,0,0,0,0,2,0,0,0,0],
  [1,2,1,1,1,1,2,1,1,1,1,1,1,1,2,1,1,0,1,1,1,0,1,1,1,1,0,1,1,2,1,1,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,1,1,2,2,2,2,2,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,2,2,2,2,2,1,1,2,2,2,2,2,2,1],
  [1,2,1,2,2,1,2,1,1,2,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,2,1,1,2,1,2,2,1,2,1],
  [1,2,1,0,0,1,2,1,1,2,2,2,2,2,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,2,2,2,2,2,1,1,2,1,0,0,1,2,1],
  [1,2,2,2,2,1,2,1,1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,2,1,2,2,2,2,1],
  [1,2,1,1,2,1,2,1,1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,2,1,2,1,1,2,1],
  [1,2,1,2,2,1,2,1,1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,2,1,2,2,1,2,1],
  [1,2,2,2,2,2,2,1,1,2,2,2,2,2,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,2,2,2,2,2,1,1,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,2,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,1,1,2,2,2,2,2,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,2,2,2,2,2,1,1,2,2,2,2,2,2,1],
  [1,2,1,2,2,1,2,1,1,2,1,1,2,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,2,1,2,1,1,2,1,2,2,1,2,1],
  [1,2,2,0,0,1,2,1,1,2,2,2,1,2,2,2,2,0,0,0,0,0,0,0,0,0,0,2,2,2,2,2,1,2,2,1,1,2,1,0,0,2,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,2,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,2,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

const wingConnectorRows = [4, 11, 17, 23, 29];
for (let i = 0; i < wingConnectorRows.length; i++) {
  const row = wingConnectorRows[i];
  classicMap[row][7] = 2;
  classicMap[row][8] = 2;
  classicMap[row][35] = 2;
  classicMap[row][36] = 2;
}

const horizontalTunnelRows = [8, 15, 27];
for (let i = 0; i < horizontalTunnelRows.length; i++) {
  const row = horizontalTunnelRows[i];
  const lastColumn = classicMap[row].length - 1;
  const tunnelDepth = 4;
  classicMap[row][0] = 0;
  classicMap[row][lastColumn] = 0;

  for (let x = 1; x <= tunnelDepth; x++) {
    classicMap[row][x] = 2;
    classicMap[row][lastColumn - x] = 2;
  }
}

for (let y = 18; y <= 26; y++) {
  classicMap[y][21] = 2;
  classicMap[y][22] = 2;
}

const mapLastColumn = classicMap[0].length - 1;
const pacmanStart = { x: 21, y: 23 };
classicMap[1][1] = 4;
classicMap[1][mapLastColumn - 1] = 4;
classicMap[26][1] = 4;
classicMap[26][mapLastColumn - 1] = 4;
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

function getGameStorage() {
  if (typeof GameStorage === "object" && GameStorage) {
    return GameStorage;
  }
  return null;
}

function getReplayTools() {
  if (typeof ReplayTools === "object" && ReplayTools) {
    return ReplayTools;
  }
  return null;
}

function getPerfGuardrails() {
  if (typeof PerfGuardrails === "object" && PerfGuardrails) {
    return PerfGuardrails;
  }
  return null;
}

function hashSeed(value) {
  const raw = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(raw) || raw === 0) {
    return 123456789;
  }
  return Math.abs(raw) % 2147483647 || 123456789;
}

function setRunRandomSeed(seed) {
  runRandomState = hashSeed(seed);
}

function randomFloat() {
  runRandomState = (runRandomState * 48271) % 2147483647;
  return (runRandomState - 1) / 2147483646;
}

function randomIndex(length) {
  if (!Number.isFinite(length) || length <= 1) return 0;
  return Math.floor(randomFloat() * length);
}

function createRunSeed() {
  return hashSeed(Date.now() + Math.floor(performance.now()));
}

function createReplayCodec() {
  const replayTools = getReplayTools();
  if (!replayTools || typeof replayTools.createReplayCodec !== "function") {
    return null;
  }

  return replayTools.createReplayCodec({
    hashSeed,
    challengeModes: CHALLENGE_MODES,
    defaultChallengeMode: CHALLENGE_MODES.CLASSIC,
    nowMs: Date.now,
  });
}

function getReplayCodec() {
  if (!replayCodec) {
    replayCodec = createReplayCodec();
  }
  return replayCodec;
}

function createFramePacingMonitor() {
  const perf = getPerfGuardrails();
  if (!perf || typeof perf.createFramePacingMonitor !== "function") {
    return null;
  }

  return perf.createFramePacingMonitor({
    ...PERF_GUARDRAIL_CONFIG,
    onBreach: (result) => {
      if (lastUpdateNow < nextPerfGuardrailToastAt) return;
      nextPerfGuardrailToastAt = lastUpdateNow + PERF_GUARDRAIL_CONFIG.breachCooldownMs;
      trackAnalyticsEvent("perf_guardrail_breach", {
        sampleCount: result.sampleCount,
        p95Ms: Number(result.p95Ms.toFixed(2)),
        p99Ms: Number(result.p99Ms.toFixed(2)),
        slowRatio: Number((result.slowRatio * 100).toFixed(2)),
        severeRatio: Number((result.severeRatio * 100).toFixed(2)),
        reasons: result.reasons,
      });
      addHudToast("Performance dip detected", getCurrentPalette().textMode, 1000);
    },
  });
}

function getFramePacingMonitor() {
  if (!framePacingMonitor) {
    framePacingMonitor = createFramePacingMonitor();
  }
  return framePacingMonitor;
}

function getCurrentPalette() {
  return COLOR_PALETTES[settings.paletteMode] || COLOR_PALETTES.classic;
}

function trackAnalyticsEvent(eventName, detail = {}) {
  const payload = {
    event: String(eventName || "unknown"),
    detail,
    timestamp: new Date().toISOString(),
  };

  try {
    window.dispatchEvent(new CustomEvent(ANALYTICS_EVENT_NAME, { detail: payload }));
  } catch (error) {
    // Ignore analytics dispatch failures.
  }

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push(payload);
  }
}

function noteUserIntent() {
  lastUserIntentAt = lastUpdateNow || performance.now();
  attractTriggeredThisIdleWindow = false;

  if (isReplayRunning()) {
    replayPlayback = null;
    activeRunIsReplay = false;
    renderReplayButton();
    addHudToast("Replay canceled", getCurrentPalette().textMode, 900);
  }

  if (attractModeActive) {
    attractModeActive = false;
    if (challengeModeBeforeAttract) {
      settings.challengeMode = challengeModeBeforeAttract;
      challengeModeBeforeAttract = null;
      renderSettingsUi();
    }
    replayPlayback = null;
    setPhase(GAME_PHASE_START, { message: "Press Start", secondary: "Demo stopped" });
    prepareRound();
  }
}

function getGhostModeScheduleForLevel(levelNumber) {
  const safe = Math.max(1, Number.parseInt(levelNumber, 10) || 1);
  const index = Math.min(GHOST_MODE_SCHEDULE_BY_LEVEL.length - 1, safe - 1);
  return GHOST_MODE_SCHEDULE_BY_LEVEL[index];
}

function getCruiseElroyThresholds(levelNumber, totalDots) {
  const safeLevel = Math.max(1, Number.parseInt(levelNumber, 10) || 1);
  const safeDots = Math.max(1, Number.parseInt(totalDots, 10) || 1);

  let phase1 = Math.floor(safeDots * 0.24);
  let phase2 = Math.floor(safeDots * 0.12);

  if (safeLevel >= 3) {
    phase1 = Math.floor(safeDots * 0.32);
    phase2 = Math.floor(safeDots * 0.16);
  }
  if (safeLevel >= 7) {
    phase1 = Math.floor(safeDots * 0.38);
    phase2 = Math.floor(safeDots * 0.2);
  }

  return {
    phase1: Math.max(12, phase1),
    phase2: Math.max(6, phase2),
  };
}

function getCruiseElroyPhase(remainingDots, thresholds) {
  const safeRemaining = Math.max(0, Number.parseInt(remainingDots, 10) || 0);
  if (!thresholds) return 0;
  if (safeRemaining <= thresholds.phase2) return 2;
  if (safeRemaining <= thresholds.phase1) return 1;
  return 0;
}

function getFrightenedTurnLimit() {
  if (!currentLevelTuning) return 6;
  return Math.max(1, Number.parseInt(currentLevelTuning.frightenedTurnLimit, 10) || 6);
}

function isReplayRunning() {
  return Boolean(replayPlayback);
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
  const requestedChallengeMode = raw && raw.challengeMode;
  const challengeMode =
    Object.values(CHALLENGE_MODES).includes(requestedChallengeMode)
      ? requestedChallengeMode
      : CHALLENGE_MODES.CLASSIC;

  const requestedPaletteMode = raw && raw.paletteMode;
  const paletteMode = Object.prototype.hasOwnProperty.call(
    COLOR_PALETTES,
    requestedPaletteMode
  )
    ? requestedPaletteMode
    : "classic";

  const safe = {
    muted: Boolean(raw && raw.muted),
    volume: Number.isFinite(Number(raw && raw.volume))
      ? Math.max(0, Math.min(100, Number(raw.volume)))
      : DEFAULT_SETTINGS.volume,
    sfxVolume: Number.isFinite(Number(raw && raw.sfxVolume))
      ? Math.max(0, Math.min(100, Number(raw.sfxVolume)))
      : DEFAULT_SETTINGS.sfxVolume,
    musicVolume: Number.isFinite(Number(raw && raw.musicVolume))
      ? Math.max(0, Math.min(100, Number(raw.musicVolume)))
      : DEFAULT_SETTINGS.musicVolume,
    musicEnabled:
      typeof (raw && raw.musicEnabled) === "boolean"
        ? raw.musicEnabled
        : DEFAULT_SETTINGS.musicEnabled,
    hapticsEnabled:
      typeof (raw && raw.hapticsEnabled) === "boolean"
        ? raw.hapticsEnabled
        : DEFAULT_SETTINGS.hapticsEnabled,
    mobileInputMode:
      raw && raw.mobileInputMode === "stick" ? "stick" : "buttons",
    challengeMode,
    paletteMode,
    reducedMotion: Boolean(raw && raw.reducedMotion),
    largeHud: Boolean(raw && raw.largeHud),
    oneHandedMode: Boolean(raw && raw.oneHandedMode),
    simDebugEnabled: Boolean(raw && raw.simDebugEnabled),
    simPaused: Boolean(raw && raw.simPaused),
    gamepadMap: { ...DEFAULT_GAMEPAD_MAP },
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

  const incomingMap = raw && raw.gamepadMap ? raw.gamepadMap : {};
  const gamepadMapKeys = Object.keys(DEFAULT_GAMEPAD_MAP);
  for (let i = 0; i < gamepadMapKeys.length; i++) {
    const key = gamepadMapKeys[i];
    const parsed = Number.parseInt(incomingMap[key], 10);
    if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 17) {
      safe.gamepadMap[key] = parsed;
    }
  }

  return safe;
}

function loadSettings() {
  const storage = getGameStorage();
  if (storage && typeof storage.loadValidatedSettings === "function") {
    return storage.loadValidatedSettings({
      storage: localStorage,
      key: SETTINGS_STORAGE_KEY,
      defaults: DEFAULT_SETTINGS,
      validate: validateSettings,
    });
  }

  return validateSettings(DEFAULT_SETTINGS);
}

function persistSettings() {
  const storage = getGameStorage();
  if (storage && typeof storage.persistSettings === "function") {
    storage.persistSettings({
      storage: localStorage,
      key: SETTINGS_STORAGE_KEY,
      settings,
    });
  }
}

function readHighScoreFromStorage() {
  const storage = getGameStorage();
  if (storage && typeof storage.readHighScore === "function") {
    return storage.readHighScore({
      storage: localStorage,
      key: HIGH_SCORE_STORAGE_KEY,
    });
  }
  return 0;
}

function persistHighScore() {
  const storage = getGameStorage();
  if (storage && typeof storage.persistHighScore === "function") {
    storage.persistHighScore({
      storage: localStorage,
      key: HIGH_SCORE_STORAGE_KEY,
      highScore,
    });
  }
}

function loadDailyChallengeState() {
  const storage = getGameStorage();
  if (storage && typeof storage.loadDailyState === "function") {
    return storage.loadDailyState({
      storage: localStorage,
      key: DAILY_CHALLENGE_STORAGE_KEY,
      maxHistory: 30,
    });
  }

  return {
    streak: 0,
    lastPlayedDate: "",
    lastCompletedDate: "",
    history: [],
  };
}

function persistDailyChallengeState() {
  const storage = getGameStorage();
  if (storage && typeof storage.persistDailyState === "function") {
    storage.persistDailyState({
      storage: localStorage,
      key: DAILY_CHALLENGE_STORAGE_KEY,
      state: dailyChallengeState,
    });
  }
}

function loadLeaderboardState() {
  const storage = getGameStorage();
  if (storage && typeof storage.loadLeaderboardState === "function") {
    return storage.loadLeaderboardState({
      storage: localStorage,
      key: LEADERBOARD_STORAGE_KEY,
    });
  }

  return { entries: {} };
}

function persistLeaderboardState() {
  const storage = getGameStorage();
  if (storage && typeof storage.persistLeaderboardState === "function") {
    storage.persistLeaderboardState({
      storage: localStorage,
      key: LEADERBOARD_STORAGE_KEY,
      state: leaderboardState,
    });
  }
}

function getTodayDailyKey() {
  const storage = getGameStorage();
  if (storage && typeof storage.getTodayKey === "function") {
    return storage.getTodayKey(new Date());
  }
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function computeDailySeed(dateKey) {
  return hashSeed(String(dateKey).replaceAll("-", ""));
}

function addLeaderboardResult({ mode, seed, scoreValue, durationMs, completed, dateKey }) {
  if (!leaderboardState || typeof leaderboardState !== "object") {
    leaderboardState = { entries: {} };
  }
  if (!leaderboardState.entries || typeof leaderboardState.entries !== "object") {
    leaderboardState.entries = {};
  }

  const normalizedMode = mode || CHALLENGE_MODES.CLASSIC;
  const normalizedSeed = Number.parseInt(seed, 10) || 0;
  const key = `${normalizedMode}:${normalizedSeed}`;
  const existing = leaderboardState.entries[key] || {
    mode: normalizedMode,
    seed: normalizedSeed,
    bestScore: 0,
    bestTimeMs: Infinity,
    completedRuns: 0,
    runs: 0,
    lastPlayed: "",
  };

  existing.runs += 1;
  if (completed) {
    existing.completedRuns += 1;
  }
  existing.bestScore = Math.max(existing.bestScore, Math.max(0, Number.parseInt(scoreValue, 10) || 0));
  if (Number.isFinite(durationMs) && durationMs > 0) {
    existing.bestTimeMs = Math.min(existing.bestTimeMs, durationMs);
  }
  existing.lastPlayed = dateKey || getTodayDailyKey();

  leaderboardState.entries[key] = existing;
  persistLeaderboardState();
}

function addDailyHistoryEntry({ dateKey, seed, scoreValue, completed }) {
  if (!dailyChallengeState || typeof dailyChallengeState !== "object") {
    dailyChallengeState = loadDailyChallengeState();
  }
  const safeDate = dateKey || getTodayDailyKey();
  const history = Array.isArray(dailyChallengeState.history) ? dailyChallengeState.history : [];

  const previousIndex = history.findIndex((entry) => entry && entry.date === safeDate);
  const nextEntry = {
    date: safeDate,
    seed,
    score: Math.max(0, Number.parseInt(scoreValue, 10) || 0),
    completed: Boolean(completed),
  };

  if (previousIndex >= 0) {
    history[previousIndex] = nextEntry;
  } else {
    history.push(nextEntry);
  }

  history.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  dailyChallengeState.history = history.slice(-30);
  dailyChallengeState.lastPlayedDate = safeDate;

  const yesterday = new Date(`${safeDate}T00:00:00`);
  yesterday.setDate(yesterday.getDate() - 1);
  const y = yesterday.getFullYear();
  const m = String(yesterday.getMonth() + 1).padStart(2, "0");
  const d = String(yesterday.getDate()).padStart(2, "0");
  const yesterdayKey = `${y}-${m}-${d}`;

  if (nextEntry.completed) {
    if (dailyChallengeState.lastCompletedDate === yesterdayKey) {
      dailyChallengeState.streak += 1;
    } else if (dailyChallengeState.lastCompletedDate !== safeDate) {
      dailyChallengeState.streak = 1;
    }
    dailyChallengeState.lastCompletedDate = safeDate;
  } else if (dailyChallengeState.lastCompletedDate && dailyChallengeState.lastCompletedDate < yesterdayKey) {
    dailyChallengeState.streak = 0;
  }

  persistDailyChallengeState();
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

function loadArcadeViewPreference() {
  try {
    return localStorage.getItem(ARCADE_VIEW_STORAGE_KEY) === "1";
  } catch (error) {
    return false;
  }
}

function persistArcadeViewPreference(enabled) {
  try {
    localStorage.setItem(ARCADE_VIEW_STORAGE_KEY, enabled ? "1" : "0");
  } catch (error) {
    // Ignore storage failures.
  }
}

function canUseArcadeView() {
  return (
    window.innerWidth >= 980 &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches
  );
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

function renderUpdateButton() {
  if (!updateAppButton) return;
  if (swUpdateReady) {
    updateAppButton.classList.remove("hidden");
  } else {
    updateAppButton.classList.add("hidden");
  }
}

function renderReplayButton() {
  if (!replayLastButton) return;
  const replayAvailable = Boolean(replayLastRun && Array.isArray(replayLastRun.events));
  replayLastButton.disabled = !replayAvailable || isReplayRunning();
  replayLastButton.textContent = isReplayRunning() ? "Replaying..." : "Replay";
}

function renderReplayStatus(message) {
  if (!replayStatus) return;
  if (message) {
    replayStatus.textContent = message;
    return;
  }

  if (replayLastRun && Array.isArray(replayLastRun.events)) {
    replayStatus.textContent =
      `Last replay: ${replayLastRun.events.length} inputs · seed ${replayLastRun.seed}`;
  } else {
    replayStatus.textContent = "No replay imported.";
  }
}

function renderSeedStatus(message, options = {}) {
  const shouldSyncInput = options.syncInput !== false;
  if (runSeedInput && shouldSyncInput) {
    runSeedInput.value = String(activeRunSeed);
  }
  if (!seedStatus) return;
  seedStatus.textContent = message || `Active seed: ${activeRunSeed}`;
}

function previewRunSeedStatus() {
  if (!runSeedInput) return;
  const raw = runSeedInput.value.trim();
  if (!raw) {
    renderSeedStatus(undefined, { syncInput: false });
    return;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    renderSeedStatus("Seed must be a positive integer.", { syncInput: false });
    return;
  }

  const normalized = hashSeed(parsed);
  if (normalized === activeRunSeed) {
    renderSeedStatus(undefined, { syncInput: false });
    return;
  }

  renderSeedStatus(`Pending seed: ${normalized} (apply to restart).`, { syncInput: false });
}

function getFramePacingStatusText() {
  if (!framePacingSnapshot || !Number.isFinite(framePacingSnapshot.sampleCount)) {
    return "Frame pacing: warming up.";
  }

  if (framePacingSnapshot.sampleCount < PERF_GUARDRAIL_CONFIG.minSamples) {
    return `Frame pacing: sampling ${framePacingSnapshot.sampleCount}/${PERF_GUARDRAIL_CONFIG.minSamples}`;
  }

  const p95 = Number(framePacingSnapshot.p95Ms || 0).toFixed(1);
  const slowPct = Number((Number(framePacingSnapshot.slowRatio || 0) * 100).toFixed(1));
  const status = framePacingSnapshot.pass ? "OK" : "WARN";
  return `Frame pacing ${status} · p95 ${p95}ms · slow ${slowPct}%`;
}

function renderSimDebugStatus(message) {
  if (simDebugEnabledToggle) {
    simDebugEnabledToggle.checked = Boolean(settings.simDebugEnabled);
  }
  if (simPauseButton) {
    simPauseButton.disabled = !settings.simDebugEnabled;
    simPauseButton.textContent = settings.simPaused ? "Resume Sim" : "Pause Sim";
  }
  if (simStepButton) {
    simStepButton.disabled = !settings.simDebugEnabled;
  }
  if (simDebugStatus) {
    if (message) {
      simDebugStatus.textContent = message;
    } else if (!settings.simDebugEnabled) {
      simDebugStatus.textContent = `Realtime simulation mode. ${getFramePacingStatusText()}`;
    } else if (settings.simPaused) {
      simDebugStatus.textContent = `Paused at frame ${simulationFrame}. ${getFramePacingStatusText()}`;
    } else {
      simDebugStatus.textContent = `Running deterministic mode · frame ${simulationFrame}. ${getFramePacingStatusText()}`;
    }
  }
}

function formatDurationShort(durationMs) {
  if (!Number.isFinite(durationMs) || durationMs <= 0) return "--";
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function renderDailyStatus() {
  if (!dailyStatus) return;
  const todayKey = getTodayDailyKey();
  const todaySeed = computeDailySeed(todayKey);
  const completedToday = dailyChallengeState.lastCompletedDate === todayKey;
  const playedToday = dailyChallengeState.lastPlayedDate === todayKey;
  const streak = Math.max(0, Number.parseInt(dailyChallengeState.streak, 10) || 0);

  let statusLine = `Today (${todayKey}) seed ${todaySeed}`;
  if (completedToday) {
    statusLine += " · completed";
  } else if (playedToday) {
    statusLine += " · attempted";
  }

  dailyStatus.textContent = `${statusLine}\nStreak: ${streak} day${streak === 1 ? "" : "s"}`;

  if (dailyChallengeButton) {
    dailyChallengeButton.textContent = completedToday ? "Daily Done" : "Daily";
    dailyChallengeButton.setAttribute("aria-pressed", String(completedToday));
  }
}

function renderLeaderboard() {
  if (!leaderboardOutput) return;

  const entries = Object.values((leaderboardState && leaderboardState.entries) || {});
  if (entries.length === 0) {
    leaderboardOutput.textContent = "No scores yet.";
    return;
  }

  entries.sort((a, b) => {
    if (b.bestScore !== a.bestScore) return b.bestScore - a.bestScore;
    return (a.bestTimeMs || Infinity) - (b.bestTimeMs || Infinity);
  });

  const lines = [];
  const top = entries.slice(0, 8);
  for (let i = 0; i < top.length; i++) {
    const entry = top[i];
    lines.push(
      `${i + 1}. ${entry.mode} · seed ${entry.seed} · score ${entry.bestScore} · best ${formatDurationShort(entry.bestTimeMs)} · runs ${entry.runs}`
    );
  }
  leaderboardOutput.textContent = lines.join("\n");
}

function applyAccessibilitySettings() {
  document.body.classList.toggle("reduced-motion", settings.reducedMotion);
  document.body.classList.toggle("large-hud", settings.largeHud);
  document.body.classList.toggle("one-handed", settings.oneHandedMode);

  const coarsePointer = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  const landscapeMobile = coarsePointer && window.innerWidth > window.innerHeight;
  document.body.classList.toggle("landscape-mobile", landscapeMobile);
}

function renderArcadeViewButton() {
  if (!arcadeViewToggleButton) return;

  const canUse = canUseArcadeView();
  arcadeViewToggleButton.classList.toggle("hidden", !canUse);

  document.body.classList.toggle("arcade-view", canUse && arcadeViewEnabled);

  arcadeViewToggleButton.textContent = arcadeViewEnabled ? "Exit Arcade" : "Arcade View";
  arcadeViewToggleButton.setAttribute("aria-pressed", String(arcadeViewEnabled));
}

function setArcadeViewEnabled(enabled, options = {}) {
  const shouldPersist = options.persist !== false;
  const nextEnabled = Boolean(enabled) && canUseArcadeView();

  if (arcadeViewEnabled === nextEnabled && document.body.classList.contains("arcade-view") === nextEnabled) {
    if (shouldPersist) persistArcadeViewPreference(nextEnabled);
    renderArcadeViewButton();
    return;
  }

  arcadeViewEnabled = nextEnabled;
  document.body.classList.toggle("arcade-view", arcadeViewEnabled);
  renderArcadeViewButton();

  if (shouldPersist) {
    persistArcadeViewPreference(arcadeViewEnabled);
  }

  resizeCanvasToFitViewport();
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
  if (sfxVolumeControl) {
    sfxVolumeControl.value = String(settings.sfxVolume);
  }
  if (musicVolumeControl) {
    musicVolumeControl.value = String(settings.musicVolume);
  }
  if (musicEnabledToggle) {
    musicEnabledToggle.checked = Boolean(settings.musicEnabled);
  }
  if (hapticsEnabledToggle) {
    hapticsEnabledToggle.checked = Boolean(settings.hapticsEnabled);
  }
  if (mobileInputModeSelect) {
    mobileInputModeSelect.value = settings.mobileInputMode;
  }
  if (challengeModeSelect) {
    challengeModeSelect.value = settings.challengeMode;
  }
  if (paletteModeSelect) {
    paletteModeSelect.value = settings.paletteMode;
  }
  if (reducedMotionToggle) {
    reducedMotionToggle.checked = Boolean(settings.reducedMotion);
  }
  if (largeHudToggle) {
    largeHudToggle.checked = Boolean(settings.largeHud);
  }
  if (oneHandedModeToggle) {
    oneHandedModeToggle.checked = Boolean(settings.oneHandedMode);
  }
  if (gamepadStartInput) {
    gamepadStartInput.value = String(settings.gamepadMap.start);
  }
  if (gamepadPauseInput) {
    gamepadPauseInput.value = String(settings.gamepadMap.pause);
  }
  if (gamepadRestartInput) {
    gamepadRestartInput.value = String(settings.gamepadMap.restart);
  }
  if (gamepadMuteInput) {
    gamepadMuteInput.value = String(settings.gamepadMap.mute);
  }
  renderKeybindButtons();
  if (keybindHelp) {
    keybindHelp.textContent = pendingRebindAction
      ? `Press a key for ${pendingRebindAction}. Esc to cancel.`
      : "Click a keybind, then press a key.";
  }
  applyAccessibilitySettings();
  renderSeedStatus();
  renderSimDebugStatus();
  renderReplayStatus();
  renderDailyStatus();
  renderLeaderboard();
}

function applyGamepadMapFromInputs() {
  const pairs = [
    [gamepadStartInput, "start"],
    [gamepadPauseInput, "pause"],
    [gamepadRestartInput, "restart"],
    [gamepadMuteInput, "mute"],
  ];

  for (let i = 0; i < pairs.length; i++) {
    const input = pairs[i][0];
    const key = pairs[i][1];
    if (!input) continue;
    const parsed = Number.parseInt(input.value, 10);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 17) {
      input.value = String(settings.gamepadMap[key]);
      continue;
    }
    settings.gamepadMap[key] = parsed;
  }

  persistSettings();
}

function applyRunSeedFromInput() {
  if (!runSeedInput) return;
  const parsed = Number.parseInt(runSeedInput.value.trim(), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    renderSeedStatus("Seed must be a positive integer.", { syncInput: false });
    return;
  }
  startNewGame({ seed: hashSeed(parsed) });
  renderSeedStatus(`Applied seed: ${activeRunSeed}`);
}

function copyCurrentSeed() {
  const text = String(activeRunSeed);
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    navigator.clipboard.writeText(text)
      .then(() => renderSeedStatus("Seed copied to clipboard."))
      .catch(() => renderSeedStatus(`Active seed: ${activeRunSeed}`));
    return;
  }
  renderSeedStatus(`Active seed: ${activeRunSeed}`);
}

function setSimulationPaused(nextPaused) {
  settings.simPaused = Boolean(nextPaused);
  persistSettings();
  renderSimDebugStatus();
}

function requestSimulationStep() {
  if (!settings.simDebugEnabled) return;
  if (!settings.simPaused) {
    settings.simPaused = true;
  }
  simStepRequests += 1;
  persistSettings();
  renderSimDebugStatus(`Stepping from frame ${simulationFrame}.`);
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

function parseCssLength(rawValue) {
  const parsedValue = Number.parseFloat(rawValue);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function getVisibleElementHeight(element) {
  if (!element) return 0;
  const style = window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden") return 0;
  return element.getBoundingClientRect().height;
}

function measureCanvasShellOverhead() {
  const canvasShell = document.querySelector(".canvas-shell");
  if (!canvasShell) return 0;

  const shellStyle = window.getComputedStyle(canvasShell);
  let overheadHeight =
    parseCssLength(shellStyle.paddingTop) +
    parseCssLength(shellStyle.paddingBottom) +
    parseCssLength(shellStyle.borderTopWidth) +
    parseCssLength(shellStyle.borderBottomWidth);

  if (
    touchControlsRoot &&
    !touchControlsRoot.classList.contains("hidden") &&
    window.getComputedStyle(touchControlsRoot).display !== "none"
  ) {
    const touchStyle = window.getComputedStyle(touchControlsRoot);
    overheadHeight +=
      getVisibleElementHeight(touchControlsRoot) +
      parseCssLength(touchStyle.marginTop) +
      parseCssLength(touchStyle.marginBottom);
  }

  if (
    virtualStickRoot &&
    !virtualStickRoot.classList.contains("hidden") &&
    window.getComputedStyle(virtualStickRoot).display !== "none"
  ) {
    const stickStyle = window.getComputedStyle(virtualStickRoot);
    overheadHeight +=
      getVisibleElementHeight(virtualStickRoot) +
      parseCssLength(stickStyle.marginTop) +
      parseCssLength(stickStyle.marginBottom);
  }

  return overheadHeight;
}

function measureNonCanvasUiHeight() {
  const bodyStyle = window.getComputedStyle(document.body);
  const bodyPaddingHeight =
    parseCssLength(bodyStyle.paddingTop) + parseCssLength(bodyStyle.paddingBottom);
  const bodyGap = parseCssLength(bodyStyle.rowGap || bodyStyle.gap);
  const topLevelGapHeight = bodyGap * 2;

  const gameShell = document.querySelector(".game-shell");
  const gameShellStyle = gameShell ? window.getComputedStyle(gameShell) : null;
  const gameShellGapHeight = gameShellStyle
    ? parseCssLength(gameShellStyle.rowGap || gameShellStyle.gap)
    : 0;

  const headerHeight = getVisibleElementHeight(document.querySelector(".site-header"));
  const settingsHeight = getVisibleElementHeight(settingsPanel);
  const footerHeight = getVisibleElementHeight(document.querySelector(".site-footer"));

  return (
    bodyPaddingHeight +
    topLevelGapHeight +
    headerHeight +
    settingsHeight +
    footerHeight +
    gameShellGapHeight +
    measureCanvasShellOverhead() +
    12
  );
}

function getCanvasMaxWidth() {
  const gameShell = document.querySelector(".game-shell");
  const canvasShell = document.querySelector(".canvas-shell");
  const shellStyle = canvasShell ? window.getComputedStyle(canvasShell) : null;
  const shellHorizontalChrome = shellStyle
    ? parseCssLength(shellStyle.paddingLeft) +
      parseCssLength(shellStyle.paddingRight) +
      parseCssLength(shellStyle.borderLeftWidth) +
      parseCssLength(shellStyle.borderRightWidth)
    : 0;

  const fallbackWidth = Math.max(280, window.innerWidth - 24);
  const gameShellWidth = gameShell ? gameShell.clientWidth : fallbackWidth;
  return Math.max(280, gameShellWidth - shellHorizontalChrome);
}

function resizeCanvasToFitViewport() {
  const { rows, cols } = validateMapRectangular();
  dpr = window.devicePixelRatio || 1;

  logicalW = cols * oneBlockSize;
  logicalH = (rows + HUD_ROWS) * oneBlockSize;

  const availW = getCanvasMaxWidth();
  const availH = Math.max(220, window.innerHeight - measureNonCanvasUiHeight());
  const coarsePointer = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  const arcadeScaleActive = arcadeViewEnabled && canUseArcadeView();
  const maxScale = arcadeScaleActive ? 1.65 : (coarsePointer ? 1 : 1.12);

  renderScale = Math.min(availW / logicalW, availH / logicalH, maxScale);

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
  return Math.round(safe * 20) / 20;
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
    const x = Math.floor(randomFloat() * (maxX - minX + 1)) + minX;
    const y = Math.floor(randomFloat() * (maxY - minY + 1)) + minY;

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
    return reachable[randomIndex(reachable.length)];
  }

  return candidates[randomIndex(candidates.length)];
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
    audioSfxGain = audioContext.createGain();
    audioMusicGain = audioContext.createGain();
    audioSfxGain.connect(audioMasterGain);
    audioMusicGain.connect(audioMasterGain);
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
  if (!audioMasterGain || !audioContext || !audioSfxGain || !audioMusicGain) return;
  const volumeScale = Math.max(0, Math.min(1, settings.volume / 100));
  const targetGain = settings.muted ? 0 : BASE_AUDIO_GAIN * volumeScale;
  audioMasterGain.gain.setValueAtTime(targetGain, audioContext.currentTime);

  const sfxScale = Math.max(0, Math.min(1, settings.sfxVolume / 100));
  const musicScale = Math.max(0, Math.min(1, settings.musicVolume / 100));
  const duckingScale = lastUpdateNow < musicDuckingUntil ? 0.35 : 1;
  audioSfxGain.gain.setValueAtTime(sfxScale, audioContext.currentTime);
  audioMusicGain.gain.setValueAtTime(settings.musicEnabled ? musicScale * duckingScale : 0, audioContext.currentTime);
}

function playTone({ frequency, duration, volume, wave, offset, channel }) {
  if (settings.muted) return;
  const ctx = ensureAudioContextReady();
  if (!ctx || !audioMasterGain || !audioSfxGain || !audioMusicGain) return;

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
  gain.connect(channel === "music" ? audioMusicGain : audioSfxGain);
  osc.start(startTime);
  osc.stop(endTime + 0.01);
}

function playGameSfx(type) {
  const pattern = SFX_LIBRARY[type];
  if (!Array.isArray(pattern)) return;
  musicDuckingUntil = Math.max(musicDuckingUntil, lastUpdateNow + 200);
  applyAudioSettings();
  for (let i = 0; i < pattern.length; i++) {
    playTone({ ...pattern[i], channel: "sfx" });
  }

  triggerHapticFeedback(type);
}

function updateBackgroundMusic() {
  if (!settings.musicEnabled || settings.muted) return;
  if (phase !== GAME_PHASE_PLAYING && phase !== GAME_PHASE_READY) return;
  if (!audioContext || !audioMusicGain) return;
  if (lastUpdateNow - musicLastStepAt < MUSIC_STEP_INTERVAL_MS) return;

  musicLastStepAt = lastUpdateNow;
  const note = MUSIC_SEQUENCE[musicStepIndex % MUSIC_SEQUENCE.length];
  musicStepIndex = (musicStepIndex + 1) % MUSIC_SEQUENCE.length;
  if (note) {
    playTone({ ...note, channel: "music" });
  }
}

function triggerHapticFeedback(type) {
  if (!settings.hapticsEnabled) return;
  if (typeof navigator.vibrate !== "function") return;

  if (type === "pellet") {
    return;
  }
  if (type === "death") {
    navigator.vibrate([28, 20, 28]);
    return;
  }
  if (type === "powerPellet" || type === "ghostEaten") {
    navigator.vibrate([12, 14, 12]);
    return;
  }
  navigator.vibrate(10);
}

function addHudToast(text, color = getCurrentPalette().textHigh, durationMs = 1400) {
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
  if (!attractModeActive) {
    syncHighScore();
  }

  const allowBonusLives =
    settings.challengeMode !== CHALLENGE_MODES.ONE_LIFE && !attractModeActive;
  if (!allowBonusLives) return;

  const utils = getGameplayUtils();
  while (
    utils &&
    typeof utils.shouldAwardBonusLife === "function" &&
    utils.shouldAwardBonusLife(score, nextBonusLifeScore)
  ) {
    lives++;
    nextBonusLifeScore = utils.nextBonusLifeMilestone(nextBonusLifeScore, BONUS_LIFE_STEP);
    addHudToast("1UP!", getCurrentPalette().toastBonus, 1800);
    playGameSfx("extraLife");
  }

  if (!utils && score >= nextBonusLifeScore) {
    lives++;
    nextBonusLifeScore += BONUS_LIFE_STEP;
    addHudToast("1UP!", getCurrentPalette().toastBonus, 1800);
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
    pacmanSpeedMultiplier: 1 + (safeLevel - 1) * 0.014,
    ghostSpeedMultiplier: 1 + (safeLevel - 1) * 0.022,
    frightenedDurationMs: Math.max(2200, 6800 - (safeLevel - 1) * 420),
    fruitSpawnDelayMs: Math.max(5000, 12000 - (safeLevel - 1) * 350),
    fruitVisibleMs: Math.max(4200, 10000 - (safeLevel - 1) * 220),
    frightenedTurnLimit: Math.max(1, 7 - Math.floor((safeLevel - 1) / 2)),
    blinkyElroyPhase1Multiplier: 1.03 + Math.min(0.05, (safeLevel - 1) * 0.005),
    blinkyElroyPhase2Multiplier: 1.08 + Math.min(0.09, (safeLevel - 1) * 0.006),
  };
}

function applyLevelTuning(levelNumber) {
  currentLevelTuning = getLevelTuning(levelNumber);
  currentGhostModeSchedule = getGhostModeScheduleForLevel(levelNumber);
  fps = 60;
}

function setPhase(nextPhase, options = {}) {
  phase = nextPhase;
  phaseMessage = options.message || "";
  phaseMessageSecondary = options.secondary || "";
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

function getGhostHouseExitTargetForPersonality(personality) {
  if (
    personality &&
    Object.prototype.hasOwnProperty.call(
      GHOST_HOUSE_EXIT_BY_PERSONALITY,
      personality
    )
  ) {
    return tileToPixel(GHOST_HOUSE_EXIT_BY_PERSONALITY[personality]);
  }

  return getGhostHouseExitTarget();
}

function getGhostHomeTarget() {
  return tileToPixel(GHOST_HOME_TILE);
}

function canReleaseGhostFromHouse(ghost) {
  if (!ghost || !ghost.houseState) return false;

  const utils = getGameplayUtils();
  const elapsed = Math.max(0, lastUpdateNow - roundStartAt);
  if (utils && typeof utils.shouldReleaseGhostFromHouse === "function") {
    const shouldRelease = utils.shouldReleaseGhostFromHouse({
      dotsEatenThisRound,
      releaseDotThreshold: ghost.houseState.releaseDotThreshold,
      elapsedMs: elapsed,
      forceReleaseMs: ghost.houseState.forceReleaseMs,
    });
    if (shouldRelease) return true;
    return elapsed >= 12000;
  }

  return elapsed >= 12000 || (
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
      pacman.getMapY() * oneBlockSize,
      randomFloat
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
    ghostGlobalMode = utils.computeScatterChaseMode(elapsed, currentGhostModeSchedule);
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

function updateCruiseElroyState() {
  const thresholds = getCruiseElroyThresholds(level, initialFoodCount);
  const phaseLevel = getCruiseElroyPhase(remainingFoodCount, thresholds);
  const phase1Scale =
    currentLevelTuning && Number.isFinite(currentLevelTuning.blinkyElroyPhase1Multiplier)
      ? currentLevelTuning.blinkyElroyPhase1Multiplier
      : 1.05;
  const phase2Scale =
    currentLevelTuning && Number.isFinite(currentLevelTuning.blinkyElroyPhase2Multiplier)
      ? currentLevelTuning.blinkyElroyPhase2Multiplier
      : 1.12;

  for (let i = 0; i < ghosts.length; i++) {
    const ghost = ghosts[i];
    if (!ghost || !Number.isFinite(ghost.baseCruiseSpeed)) continue;

    let speedScale = 1;
    if (
      ghost.personality === "blinky" &&
      !ghost.isEaten() &&
      !ghost.isFrightened() &&
      phaseLevel > 0
    ) {
      speedScale = phaseLevel >= 2 ? phase2Scale : phase1Scale;
    }

    ghost.setLevelSpeed(quantizeSpeed(ghost.baseCruiseSpeed * speedScale));
  }
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
  addPointPopup(
    fruit.x,
    fruit.y,
    `${fruit.spec.points}`,
    getCurrentPalette().popupFruit,
    1100
  );
  playGameSfx("fruit");
}

function snapshotCollisionRect(source) {
  if (!source) return null;

  const x = Number(source.x);
  const y = Number(source.y);
  const width = Number(source.width);
  const height = Number(source.height);

  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return null;
  }

  return { x, y, width, height };
}

function rectsOverlap(rectA, rectB) {
  if (!rectA || !rectB) return false;

  return (
    rectA.x < rectB.x + rectB.width &&
    rectA.x + rectA.width > rectB.x &&
    rectA.y < rectB.y + rectB.height &&
    rectA.y + rectA.height > rectB.y
  );
}

function getCollidingGhostIndices(options = {}) {
  const colliding = { dangerous: [], frightened: [] };
  if (!pacman) return colliding;

  const utils = getGameplayUtils();
  const overlapFn =
    utils && typeof utils.rectsOverlap === "function"
      ? utils.rectsOverlap
      : rectsOverlap;
  const canCheckSweptCollision =
    utils && typeof utils.didRectsCollideDuringStep === "function";
  const currentPacmanRect = snapshotCollisionRect(pacman);
  const previousPacmanRect = snapshotCollisionRect(options.previousPacmanRect);
  const previousGhostRects = Array.isArray(options.previousGhostRects)
    ? options.previousGhostRects
    : [];
  const pacX = pacman.getMapX();
  const pacY = pacman.getMapY();

  for (let i = 0; i < ghosts.length; i++) {
    const ghost = ghosts[i];
    if (!ghost) continue;
    if (ghost.isEaten()) continue;

    const currentGhostRect = snapshotCollisionRect(ghost);
    let collided = false;

    if (currentPacmanRect && currentGhostRect) {
      collided = overlapFn(currentPacmanRect, currentGhostRect);
    }

    if (!collided && ghost.getMapX() === pacX && ghost.getMapY() === pacY) {
      collided = true;
    }

    if (
      !collided &&
      canCheckSweptCollision &&
      currentPacmanRect &&
      currentGhostRect &&
      previousPacmanRect
    ) {
      const previousGhostRect = snapshotCollisionRect(previousGhostRects[i]);
      if (previousGhostRect) {
        collided = utils.didRectsCollideDuringStep({
          previousRectA: previousPacmanRect,
          currentRectA: currentPacmanRect,
          previousRectB: previousGhostRect,
          currentRectB: currentGhostRect,
        });
      }
    }

    if (!collided) continue;

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
    addPointPopup(
      ghost.getMapX(),
      ghost.getMapY(),
      `${points}`,
      getCurrentPalette().popupGhost,
      1200
    );
    ghostEatChain =
      utils && typeof utils.nextGhostEatChain === "function"
        ? utils.nextGhostEatChain(ghostEatChain, 6)
        : Math.min(ghostEatChain + 1, 6);

    ghost.setEatenMode();
    playGameSfx("ghostEaten");
  }
}

function createNewPacman() {
  const baseSpeed = oneBlockSize / 16;
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
      quantizeSpeed((pacman.speed * 0.86) * currentLevelTuning.ghostSpeedMultiplier),
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

    ghost.baseCruiseSpeed = ghost.baseSpeed;
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

function beginReplayCapture(seed) {
  replayCurrentRun = {
    seed,
    challengeMode: settings.challengeMode,
    events: [],
    startedAt: Date.now(),
  };
}

function sanitizeReplayPayload(payload) {
  const codec = getReplayCodec();
  if (codec && typeof codec.sanitize === "function") {
    return codec.sanitize(payload);
  }
  return null;
}

function encodeReplayToString(replayData) {
  const codec = getReplayCodec();
  if (codec && typeof codec.encode === "function") {
    return codec.encode(replayData);
  }
  return "";
}

function decodeReplayFromString(encoded) {
  const codec = getReplayCodec();
  if (codec && typeof codec.decode === "function") {
    return codec.decode(encoded);
  }
  return null;
}

function parseReplayFromUrlHash() {
  const codec = getReplayCodec();
  if (codec && typeof codec.parseHash === "function") {
    return codec.parseHash(window.location.hash, REPLAY_HASH_PREFIX);
  }
  return null;
}

function exportReplayToFile() {
  if (!replayLastRun) {
    renderReplayStatus("No replay available to export.");
    return;
  }
  const payload = JSON.stringify(replayLastRun, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `pacman-replay-${Date.now()}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  renderReplayStatus("Replay exported.");
}

function copyReplayShareLink() {
  if (!replayLastRun) {
    renderReplayStatus("No replay available to share.");
    return;
  }
  const encoded = encodeReplayToString(replayLastRun);
  if (!encoded) {
    renderReplayStatus("Could not encode replay.");
    return;
  }
  const shareUrl = `${window.location.origin}${window.location.pathname}${REPLAY_HASH_PREFIX}${encoded}`;
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    navigator.clipboard.writeText(shareUrl)
      .then(() => renderReplayStatus("Replay link copied to clipboard."))
      .catch(() => renderReplayStatus("Clipboard unavailable. Copy URL manually from address bar."));
  } else {
    renderReplayStatus("Clipboard unavailable. Copy URL manually from address bar.");
  }
}

function importReplayPayload(payload) {
  const sanitized = sanitizeReplayPayload(payload);
  if (!sanitized || !Array.isArray(sanitized.events)) {
    renderReplayStatus("Invalid replay payload.");
    return false;
  }
  replayLastRun = sanitized;
  renderReplayButton();
  renderReplayStatus(`Replay imported (${sanitized.events.length} inputs).`);
  return true;
}

function handleReplayFileSelection(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || "{}"));
      importReplayPayload(parsed);
    } catch (error) {
      renderReplayStatus("Replay file parse failed.");
    }
  };
  reader.readAsText(file);
}

function recordReplayAction(action) {
  if (!replayCurrentRun || isReplayRunning()) return;
  replayCurrentRun.events.push({
    frame: simulationFrame,
    action,
  });
}

function finalizeReplayCapture(metadata = {}) {
  if (!replayCurrentRun) return;
  replayLastRun = {
    ...replayCurrentRun,
    endedAt: Date.now(),
    score,
    level,
    ...metadata,
  };
  replayCurrentRun = null;
  renderReplayButton();
  renderReplayStatus();
}

function startReplayLastRun() {
  if (!replayLastRun || !Array.isArray(replayLastRun.events)) return;

  replayPlayback = {
    seed: replayLastRun.seed,
    challengeMode: replayLastRun.challengeMode || CHALLENGE_MODES.CLASSIC,
    events: replayLastRun.events.slice().sort((a, b) => a.frame - b.frame),
    cursor: 0,
  };
  settings.challengeMode = replayPlayback.challengeMode;
  persistSettings();
  renderSettingsUi();
  startNewGame({ replay: true, seed: replayPlayback.seed, skipCapture: true });
  renderReplayButton();
  renderReplayStatus(`Replay started (${replayPlayback.events.length} inputs).`);
}

function applyReplayEventsForFrame() {
  if (!replayPlayback || !Array.isArray(replayPlayback.events)) return;

  while (
    replayPlayback.cursor < replayPlayback.events.length &&
    replayPlayback.events[replayPlayback.cursor].frame <= simulationFrame
  ) {
    const entry = replayPlayback.events[replayPlayback.cursor];
    replayPlayback.cursor += 1;
    if (!entry || typeof entry.action !== "string") continue;
    handleAction(entry.action, { source: "replay", record: false });
  }
}

function maybeBeginAttractMode() {
  if (phase !== GAME_PHASE_START || attractModeActive || attractTriggeredThisIdleWindow) return;
  if (lastUpdateNow - lastUserIntentAt < ATTRACT_IDLE_MS) return;

  attractTriggeredThisIdleWindow = true;
  attractModeActive = true;
  challengeModeBeforeAttract = settings.challengeMode;
  settings.challengeMode = CHALLENGE_MODES.CLASSIC;
  renderSettingsUi();
  replayPlayback = {
    seed: 20260211,
    challengeMode: CHALLENGE_MODES.CLASSIC,
    events: ATTRACT_DEMO_INPUTS.map((entry) => ({ ...entry })),
    cursor: 0,
  };
  startNewGame({ replay: true, seed: replayPlayback.seed, skipCapture: true, attract: true });
  trackAnalyticsEvent("attract_mode_started");
}

function startDailyChallenge() {
  const dateKey = getTodayDailyKey();
  const dailySeed = computeDailySeed(dateKey);
  settings.challengeMode = CHALLENGE_MODES.CLASSIC;
  persistSettings();
  renderSettingsUi();
  startNewGame({ seed: dailySeed, daily: true });
  addHudToast(`Daily seed ${dailySeed}`, getCurrentPalette().textMode, 1300);
  trackAnalyticsEvent("daily_challenge_started", { date: dateKey, seed: dailySeed });
}

function getCurrentRunDurationMs() {
  if (!Number.isFinite(runStartedAtMs) || runStartedAtMs <= 0) return 0;
  return Math.max(0, Date.now() - runStartedAtMs);
}

function finalizeRunResult(options = {}) {
  if (runResultCommitted) return;
  if (!Number.isFinite(runStartedAtMs) || runStartedAtMs <= 0) {
    runResultCommitted = true;
    return;
  }
  if (attractModeActive || activeRunIsReplay) {
    runResultCommitted = true;
    return;
  }

  const completed = Boolean(options.completed);
  const dateKey = getTodayDailyKey();
  const durationMs = getCurrentRunDurationMs();
  addLeaderboardResult({
    mode: settings.challengeMode,
    seed: activeRunSeed,
    scoreValue: score,
    durationMs,
    completed,
    dateKey,
  });

  if (activeRunIsDaily) {
    addDailyHistoryEntry({
      dateKey,
      seed: activeRunSeed,
      scoreValue: score,
      completed,
    });
  }

  renderDailyStatus();
  renderLeaderboard();
  runResultCommitted = true;
}

function startNewGame(options = {}) {
  attractModeActive = Boolean(options.attract);
  if (!attractModeActive) {
    challengeModeBeforeAttract = null;
  }
  if (!options.replay) {
    replayPlayback = null;
  }

  if (!options.skipFinalizeResult) {
    finalizeRunResult({ completed: levelsClearedThisRun > 0 });
  }

  const replaySeed = options.seed;
  const requestedSeed = Number.isFinite(replaySeed) ? replaySeed : createRunSeed();
  activeRunSeed = requestedSeed;
  activeRunIsDaily = Boolean(options.daily);
  activeRunIsReplay = Boolean(options.replay);
  runResultCommitted = false;
  runStartedAtMs = Date.now();
  levelsClearedThisRun = 0;
  musicStepIndex = 0;
  musicLastStepAt = 0;
  setRunRandomSeed(activeRunSeed);

  if (!options.skipCapture) {
    finalizeReplayCapture({ reason: "new-game" });
    beginReplayCapture(activeRunSeed);
  }

  challengeTimeRemainingMs = CHALLENGE_TIME_ATTACK_SECONDS * 1000;
  simulationFrame = 0;
  const pacingMonitor = getFramePacingMonitor();
  if (pacingMonitor && typeof pacingMonitor.reset === "function") {
    pacingMonitor.reset();
  }
  framePacingSnapshot = null;
  nextPerfGuardrailToastAt = 0;
  disposeActors();
  score = 0;
  lives =
    settings.challengeMode === CHALLENGE_MODES.ONE_LIFE
      ? 1
      : STARTING_LIVES;
  level = START_LEVEL;
  nextBonusLifeScore = BONUS_LIFE_STEP;
  applyLevelTuning(level);
  resetMap();
  prepareRound();
  setPhase(GAME_PHASE_READY, {
    durationMs: ROUND_READY_MS,
    message: "READY!",
    secondary:
      settings.challengeMode === CHALLENGE_MODES.CLASSIC
        ? ""
        : `Mode: ${settings.challengeMode.replace("-", " ")}`,
  });
  renderSeedStatus();
  renderReplayButton();
  renderDailyStatus();
}

function startNextLevel() {
  level += 1;
  applyLevelTuning(level);
  if (settings.challengeMode === CHALLENGE_MODES.TIME_ATTACK) {
    challengeTimeRemainingMs += 18000;
  }
  resetMap();
  prepareRound();
  setPhase(GAME_PHASE_READY, {
    durationMs: ROUND_READY_MS,
    message: "READY!",
    secondary: settings.challengeMode === CHALLENGE_MODES.TIME_ATTACK ? "Time bonus +18s" : "",
  });
}

function restartCurrentRun() {
  const keepDailyRun = activeRunIsDaily && settings.challengeMode === CHALLENGE_MODES.CLASSIC;
  startNewGame({ seed: activeRunSeed, daily: keepDailyRun });
  playGameSfx("ui");
}

function shouldHotApplyChallengeMode() {
  if (isReplayRunning() || attractModeActive) return false;
  return (
    phase === GAME_PHASE_READY ||
    phase === GAME_PHASE_PLAYING ||
    phase === GAME_PHASE_PAUSED ||
    phase === GAME_PHASE_DYING ||
    phase === GAME_PHASE_INTERMISSION ||
    phase === GAME_PHASE_CUTSCENE
  );
}

function applyChallengeModeSetting(nextMode) {
  settings.challengeMode = Object.values(CHALLENGE_MODES).includes(nextMode)
    ? nextMode
    : CHALLENGE_MODES.CLASSIC;
  persistSettings();
  renderSettingsUi();

  if (shouldHotApplyChallengeMode()) {
    const keepDailyRun = activeRunIsDaily && settings.challengeMode === CHALLENGE_MODES.CLASSIC;
    startNewGame({
      seed: activeRunSeed,
      daily: keepDailyRun,
      skipFinalizeResult: true,
    });
    addHudToast(`Mode applied: ${settings.challengeMode}`, getCurrentPalette().textMode, 1200);
    return;
  }

  addHudToast(`Mode: ${settings.challengeMode}`, getCurrentPalette().textMode, 1100);
}

function onLevelComplete() {
  levelsClearedThisRun += 1;
  if (!attractModeActive) {
    syncHighScore();
  }
  playGameSfx("levelClear");
  setPhase(GAME_PHASE_INTERMISSION, {
    durationMs: INTERMISSION_MS,
    message: "STAGE CLEAR!",
    secondary: "Preparing next scene...",
  });
}

function startCutscene(levelNumber) {
  const spec = CUTSCENES_BY_LEVEL[levelNumber];
  if (!spec) {
    activeCutscene = null;
    startNextLevel();
    return;
  }

  activeCutscene = {
    ...spec,
    startedAt: lastUpdateNow,
  };
  setPhase(GAME_PHASE_CUTSCENE, {
    durationMs: spec.durationMs,
    message: spec.title,
    secondary: "Press Start to skip",
  });
}

function skipCutscene() {
  if (phase !== GAME_PHASE_CUTSCENE) return;
  activeCutscene = null;
  phaseUntil = 0;
  startNextLevel();
}

function onGhostCollision() {
  lives = Math.max(0, lives - 1);
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

  if (settings.oneHandedMode) {
    if (normalized === "j") return "left";
    if (normalized === "i") return "up";
    if (normalized === "l") return "right";
    if (normalized === "k") return "down";
    if (normalized === "h") return "pause";
    if (normalized === "u") return "start";
    if (normalized === "o") return "restart";
  }

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

function handleAction(action, options = {}) {
  const source = options.source || "user";
  const shouldRecord = options.record !== false && source !== "replay";
  const isUserAction = source !== "replay";

  if (isUserAction) {
    noteUserIntent();
  }

  if (shouldRecord) {
    recordReplayAction(action);
  }

  if (phase === GAME_PHASE_CUTSCENE && action === "start") {
    skipCutscene();
    return;
  }

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
    triggerHapticFeedback("ui");
    if (phase === GAME_PHASE_START || phase === GAME_PHASE_GAMEOVER) {
      startNewGame();
    } else if (phase === GAME_PHASE_PAUSED) {
      setPaused(false);
    } else if (phase === GAME_PHASE_CUTSCENE) {
      skipCutscene();
    }
  }
}

function clearSwipeState() {
  swipeStartX = null;
  swipeStartY = null;
}

function onCanvasTouchStart(event) {
  if (settings.mobileInputMode !== "buttons" || settings.oneHandedMode) return;
  if (!event.touches || event.touches.length === 0) return;
  primeAudioContext();
  swipeStartX = event.touches[0].clientX;
  swipeStartY = event.touches[0].clientY;
}

function onCanvasTouchMove(event) {
  if (settings.mobileInputMode !== "buttons" || settings.oneHandedMode) return;
  if (swipeStartX === null || swipeStartY === null) return;
  event.preventDefault();
}

function onCanvasTouchEnd(event) {
  if (settings.mobileInputMode !== "buttons" || settings.oneHandedMode) return;
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
    handleAction(dx > 0 ? "right" : "left", { source: "touch" });
  } else {
    handleAction(dy > 0 ? "down" : "up", { source: "touch" });
  }
}

function updateMobileControlSizing() {
  const coarsePointer = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  const root = document.documentElement;
  if (!root) return;

  if (!coarsePointer) {
    root.style.removeProperty("--control-size");
    root.style.removeProperty("--stick-size");
    return;
  }

  const shortEdge = Math.max(300, Math.min(window.innerWidth, window.innerHeight));
  const controlSize = Math.max(50, Math.min(78, Math.round(shortEdge * 0.16)));
  const stickSize = Math.max(122, Math.min(170, Math.round(controlSize * 2.15)));
  root.style.setProperty("--control-size", `${controlSize}px`);
  root.style.setProperty("--stick-size", `${stickSize}px`);
}

function updateMobileInputPresentation() {
  const coarsePointer = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  const forceStick = settings.oneHandedMode;
  const useStick = settings.mobileInputMode === "stick" || forceStick;
  updateMobileControlSizing();

  if (touchControlsRoot) {
    const showButtons = coarsePointer && !useStick;
    touchControlsRoot.classList.toggle("hidden", !showButtons);
  }

  if (virtualStickRoot) {
    const showStick = coarsePointer && useStick;
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
    handleAction(dx > 0 ? "right" : "left", { source: "touch" });
  } else {
    handleAction(dy > 0 ? "down" : "up", { source: "touch" });
  }
}

function onStickPointerDown(event) {
  if (settings.mobileInputMode !== "stick" && !settings.oneHandedMode) return;
  if (!stickBase) return;

  primeAudioContext();
  stickPointerId = event.pointerId;
  stickBase.setPointerCapture(stickPointerId);

  const rect = stickBase.getBoundingClientRect();
  stickCenterX = rect.left + rect.width / 2;
  stickCenterY = rect.top + rect.height / 2;
  const baseDiameter = Math.min(rect.width, rect.height);
  const knobDiameter = stickKnob
    ? Math.min(stickKnob.offsetWidth, stickKnob.offsetHeight)
    : 0;
  const computedRadius = (baseDiameter - knobDiameter) / 2;
  stickMaxRadius =
    Number.isFinite(computedRadius) && computedRadius > 0
      ? computedRadius
      : STICK_MAX_RADIUS;

  onStickPointerMove(event);
}

function onStickPointerMove(event) {
  if (stickPointerId !== event.pointerId) return;
  if (!stickKnob) return;

  const rawDx = event.clientX - stickCenterX;
  const rawDy = event.clientY - stickCenterY;
  const magnitude = Math.hypot(rawDx, rawDy);
  const clampScale = magnitude > stickMaxRadius ? stickMaxRadius / magnitude : 1;
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
  stickMaxRadius = STICK_MAX_RADIUS;
  resetStickKnob();
}

function pollGamepadInput() {
  if (isReplayRunning()) return;
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

  if (justPressed(settings.gamepadMap.start)) {
    handleAction("start");
  }
  if (justPressed(settings.gamepadMap.restart)) {
    handleAction("restart");
  }
  if (justPressed(settings.gamepadMap.mute)) {
    handleAction("mute");
  }
  if (justPressed(settings.gamepadMap.pause)) {
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
      if (left) handleAction("left", { source: "gamepad" });
      if (right) handleAction("right", { source: "gamepad" });
    } else {
      if (up) handleAction("up", { source: "gamepad" });
      if (down) handleAction("down", { source: "gamepad" });
    }
  }
}

function registerPwaHandlers() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("./service-worker.js")
        .then((registration) => {
          swRegistration = registration;

          function markUpdateReady() {
            if (!registration.waiting) return;
            swUpdateReady = true;
            renderUpdateButton();
            addHudToast("Update ready", getCurrentPalette().textMode, 1600);
            trackAnalyticsEvent("sw_update_ready");
          }

          markUpdateReady();
          registration.addEventListener("updatefound", () => {
            const installing = registration.installing;
            if (!installing) return;
            installing.addEventListener("statechange", () => {
              if (installing.state === "installed" && navigator.serviceWorker.controller) {
                markUpdateReady();
              }
            });
          });
        })
        .catch(() => {
          // Service worker registration can fail in unsupported/private contexts.
        });
    });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!swUpdateReady) return;
      swUpdateReady = false;
      renderUpdateButton();
      window.location.reload();
    });
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    renderInstallButton();
    trackAnalyticsEvent("install_prompt_ready");
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    renderInstallButton();
    addHudToast("App installed", getCurrentPalette().toastBonus, 1500);
    trackAnalyticsEvent("app_installed");
  });
}

function handleInstallApp() {
  if (!deferredInstallPrompt) return;
  trackAnalyticsEvent("install_prompt_opened");
  deferredInstallPrompt.prompt();
  deferredInstallPrompt.userChoice
    .then((choice) => {
      trackAnalyticsEvent("install_prompt_result", {
        outcome: choice && choice.outcome ? choice.outcome : "unknown",
      });
    })
    .finally(() => {
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
      if (attractModeActive) {
        attractModeActive = false;
        attractTriggeredThisIdleWindow = false;
        lastUserIntentAt = lastUpdateNow;
        if (challengeModeBeforeAttract) {
          settings.challengeMode = challengeModeBeforeAttract;
          challengeModeBeforeAttract = null;
          renderSettingsUi();
        }
        replayPlayback = null;
        renderReplayButton();
        prepareRound();
        setPhase(GAME_PHASE_START, { message: "Press Start", secondary: "Demo ended" });
        return;
      }
      if (!attractModeActive) {
        syncHighScore();
      }
      finalizeRunResult({ completed: levelsClearedThisRun > 0 });
      finalizeReplayCapture({ reason: "game-over" });
      replayPlayback = null;
      renderReplayButton();
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
    if (Object.prototype.hasOwnProperty.call(CUTSCENES_BY_LEVEL, level)) {
      startCutscene(level);
    } else {
      startNextLevel();
    }
    return;
  }

  if (phase === GAME_PHASE_CUTSCENE) {
    activeCutscene = null;
    startNextLevel();
  }
}

function updatePopups() {
  pointPopups = pointPopups.filter((popup) => lastUpdateNow < popup.expiresAt);
  hudToasts = hudToasts.filter((toast) => lastUpdateNow < toast.expiresAt);
}

function updateGameplay() {
  if (!pacman) return;

  const previousPacmanRect = snapshotCollisionRect(pacman);
  const previousGhostRects = new Array(ghosts.length);
  for (let i = 0; i < ghosts.length; i++) {
    previousGhostRects[i] = snapshotCollisionRect(ghosts[i]);
  }

  pacman.moveProcess();
  const eatResult = pacman.eat();

  if (eatResult && eatResult.atePellet) {
    remainingFoodCount = Math.max(0, remainingFoodCount - 1);
    dotsEatenThisRound += 1;
  }

  if (eatResult && eatResult.atePowerPellet) {
    if (settings.challengeMode !== CHALLENGE_MODES.NO_POWER) {
      activateFrightenedMode(currentLevelTuning.frightenedDurationMs);
    } else {
      playGameSfx("pellet");
      addHudToast("No power in this mode", getCurrentPalette().textMode, 900);
    }
  }

  if (!isGhostFrightened() && ghostEatChain !== 0) {
    ghostEatChain = 0;
  }

  updateGhostGlobalMode();
  updateCruiseElroyState();
  updateFruitState();
  tryConsumeFruit();
  updateGhosts();

  const colliding = getCollidingGhostIndices({
    previousPacmanRect,
    previousGhostRects,
  });
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
  const stepDebugEnabled = settings.simDebugEnabled;
  const stepDebugPaused = stepDebugEnabled && settings.simPaused;
  if (stepDebugPaused && simStepRequests <= 0) {
    return;
  }
  if (stepDebugPaused && simStepRequests > 0) {
    simStepRequests -= 1;
  }

  simulationFrame += 1;
  maybeBeginAttractMode();
  applyReplayEventsForFrame();
  pollGamepadInput();
  updatePhaseTransitions();
  updatePopups();
  updateBackgroundMusic();
  applyAudioSettings();

  if (phase === GAME_PHASE_PLAYING && settings.challengeMode === CHALLENGE_MODES.TIME_ATTACK) {
    challengeTimeRemainingMs = Math.max(0, challengeTimeRemainingMs - FRAME_STEP_MS);
    if (challengeTimeRemainingMs <= 0) {
      lives = 0;
      onGhostCollision();
      return;
    }
  }

  if (phase === GAME_PHASE_PLAYING) {
    updateGameplay();
  }

  if (stepDebugEnabled && simulationFrame % 8 === 0) {
    renderSimDebugStatus();
  }
}

function drawWalls() {
  const palette = getCurrentPalette();
  for (let i = 0; i < wallTiles.length; i++) {
    const tile = wallTiles[i];
    const x = tile.x;
    const y = tile.y;

    createRect(
      x * oneBlockSize,
      y * oneBlockSize,
      oneBlockSize,
      oneBlockSize,
      palette.wallOuter
    );

    const wallSpaceWidth = oneBlockSize / 1.6;
    const wallOffset = (oneBlockSize - wallSpaceWidth) / 2;
    const wallInnerColor = palette.wallInner;

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
  const palette = getCurrentPalette();
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
        isPowerPellet ? palette.powerPellet : palette.pellet
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
  const palette = getCurrentPalette();
  const hudScale = settings.largeHud ? 1.18 : 1;
  canvasContext.font = `${Math.round(20 * hudScale)}px Emulogic`;
  canvasContext.fillStyle = palette.textPrimary;
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
  const palette = getCurrentPalette();
  const hudScale = settings.largeHud ? 1.18 : 1;
  const hudY = oneBlockSize * (map.length + 1);
  const hudY2 = oneBlockSize * (map.length + 1.8);

  canvasContext.font = `${Math.round(20 * hudScale)}px Emulogic`;
  canvasContext.fillStyle = palette.textPrimary;
  canvasContext.fillText(`Score: ${score}`, 0, hudY);

  canvasContext.font = `${Math.round(16 * hudScale)}px Emulogic`;
  canvasContext.fillStyle = palette.textHigh;
  canvasContext.fillText(`High: ${highScore}`, 0, hudY2);

  canvasContext.fillStyle = palette.textAccent;
  canvasContext.fillText(`Level: ${level}`, 220, hudY);

  canvasContext.fillStyle = palette.textMode;
  canvasContext.fillText(`Mode: ${getCurrentGhostModeLabel()}`, 220, hudY2);

  canvasContext.fillStyle = palette.textFruit;
  canvasContext.fillText(`Fruit: ${fruit.spec.name}`, 390, hudY2);

  if (isGhostFrightened()) {
    const remainingMs = Math.max(0, frightenedUntil - lastUpdateNow);
    const seconds = Math.ceil(remainingMs / 1000);
    canvasContext.fillStyle = palette.textMode;
    canvasContext.fillText(`Fright: ${seconds}s`, 390, hudY);
  }

  if (settings.challengeMode === CHALLENGE_MODES.TIME_ATTACK) {
    const timeLeft = Math.max(0, Math.ceil(challengeTimeRemainingMs / 1000));
    canvasContext.fillStyle = palette.textHigh;
    canvasContext.fillText(`Time: ${timeLeft}s`, 560, hudY);
  } else if (settings.challengeMode !== CHALLENGE_MODES.CLASSIC) {
    canvasContext.fillStyle = palette.textHigh;
    canvasContext.fillText(`Challenge: ${settings.challengeMode}`, 560, hudY);
  }

  if (attractModeActive) {
    canvasContext.fillStyle = palette.textMode;
    canvasContext.fillText("DEMO", 560, hudY2);
  }

  if (isReplayRunning()) {
    canvasContext.fillStyle = palette.textMode;
    canvasContext.fillText("REPLAY", 690, hudY2);
  }

  if (settings.simDebugEnabled) {
    canvasContext.fillStyle = palette.textAccent;
    canvasContext.fillText(`Seed: ${activeRunSeed}`, 560, hudY2 + oneBlockSize * 0.8);
    canvasContext.fillText(`Frame: ${simulationFrame}`, 760, hudY2 + oneBlockSize * 0.8);
  }
}

function drawPointPopups() {
  for (let i = 0; i < pointPopups.length; i++) {
    const popup = pointPopups[i];
    const life = (popup.expiresAt - lastUpdateNow) / (popup.expiresAt - popup.createdAt);
    const yOffset = settings.reducedMotion ? 0 : (1 - life) * oneBlockSize;

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
  const palette = getCurrentPalette();
  canvasContext.fillStyle = "rgba(0, 0, 0, 0.58)";
  canvasContext.fillRect(0, 0, logicalW, logicalH);

  canvasContext.textAlign = "center";
  canvasContext.font = "24px Emulogic";
  canvasContext.fillStyle = palette.overlayTitle;
  canvasContext.fillText(title, logicalW / 2, logicalH / 2 - 12);

  if (subtitle) {
    canvasContext.font = "12px Emulogic";
    canvasContext.fillStyle = palette.overlaySubtitle;
    canvasContext.fillText(subtitle, logicalW / 2, logicalH / 2 + oneBlockSize);
  }

  canvasContext.textAlign = "start";
}

function drawReadyMessage() {
  const palette = getCurrentPalette();
  canvasContext.textAlign = "center";
  canvasContext.font = "22px Emulogic";
  canvasContext.fillStyle = palette.overlayTitle;
  canvasContext.fillText("READY!", logicalW / 2, logicalH / 2);
  canvasContext.textAlign = "start";
}

function drawCutscene() {
  if (!activeCutscene) return;

  const elapsed = Math.max(0, lastUpdateNow - activeCutscene.startedAt);
  const progress = Math.min(1, elapsed / Math.max(1, activeCutscene.durationMs));
  const tone = activeCutscene.tone || "amber";
  const palette = getCurrentPalette();

  let accent = "#FFB46E";
  if (tone === "cyan") accent = "#7CF7D4";
  if (tone === "rose") accent = "#FF8CA8";

  canvasContext.save();
  canvasContext.fillStyle = "rgba(0, 0, 0, 0.7)";
  canvasContext.fillRect(0, 0, logicalW, logicalH);

  canvasContext.textAlign = "center";
  canvasContext.fillStyle = accent;
  canvasContext.font = "24px Emulogic";
  canvasContext.fillText(activeCutscene.title, logicalW / 2, logicalH * 0.36);

  canvasContext.fillStyle = palette.overlaySubtitle;
  canvasContext.font = "12px Emulogic";
  canvasContext.fillText(activeCutscene.subtitle, logicalW / 2, logicalH * 0.44);
  canvasContext.fillText("Press Start to skip", logicalW / 2, logicalH * 0.52);

  const laneY = logicalH * 0.68;
  const pacX = oneBlockSize + progress * (logicalW - oneBlockSize * 4);
  const ghostX = logicalW - oneBlockSize * 2 - progress * (logicalW - oneBlockSize * 4);
  const oscillate = settings.reducedMotion ? 0 : Math.sin(elapsed / 160) * 5;

  canvasContext.fillStyle = "#FDE047";
  canvasContext.beginPath();
  canvasContext.arc(pacX, laneY + oscillate, oneBlockSize * 0.45, 0, 2 * Math.PI);
  canvasContext.fill();

  canvasContext.fillStyle = accent;
  canvasContext.beginPath();
  canvasContext.arc(ghostX, laneY - oscillate, oneBlockSize * 0.43, 0, 2 * Math.PI);
  canvasContext.fill();
  canvasContext.restore();
}

function drawPhaseOverlay() {
  if (phase === GAME_PHASE_CUTSCENE) {
    drawCutscene();
    return;
  }

  if (phase === GAME_PHASE_PAUSED) {
    drawOverlay("PAUSED", "Press pause key or button to continue");
    return;
  }

  if (phase === GAME_PHASE_START) {
    const subtitle = attractModeActive
      ? "Demo running - press Start to play"
      : "Press Start, Enter, or gamepad Start";
    drawOverlay("PAC-MAN", subtitle);
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
  const palette = getCurrentPalette();
  canvasContext.clearRect(0, 0, logicalW, logicalH);
  createRect(0, 0, logicalW, logicalH, palette.background);

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

  const pacingMonitor = getFramePacingMonitor();
  if (pacingMonitor && typeof pacingMonitor.push === "function") {
    framePacingSnapshot = pacingMonitor.push(delta, now);
  }

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
      if (settings.mobileInputMode !== "buttons" || settings.oneHandedMode) return;
      event.preventDefault();
      primeAudioContext();
      const directionName = event.currentTarget.dataset.direction;
      if (!directionName) return;
      handleAction(directionName, { source: "touch" });
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

  if (replayLastButton) {
    replayLastButton.addEventListener("click", () => {
      primeAudioContext();
      noteUserIntent();
      startReplayLastRun();
    });
  }

  if (dailyChallengeButton) {
    dailyChallengeButton.addEventListener("click", () => {
      primeAudioContext();
      noteUserIntent();
      startDailyChallenge();
    });
  }

  if (muteToggleButton) {
    muteToggleButton.addEventListener("click", () => {
      primeAudioContext();
      handleAction("mute");
    });
  }

  if (replayExportButton) {
    replayExportButton.addEventListener("click", () => {
      exportReplayToFile();
    });
  }

  if (replayShareButton) {
    replayShareButton.addEventListener("click", () => {
      copyReplayShareLink();
    });
  }

  if (replayImportButton) {
    replayImportButton.addEventListener("click", () => {
      if (replayFileInput) {
        replayFileInput.click();
      }
    });
  }

  if (replayFileInput) {
    replayFileInput.addEventListener("change", (event) => {
      const file = event.target.files && event.target.files[0] ? event.target.files[0] : null;
      handleReplayFileSelection(file);
      event.target.value = "";
    });
  }

  if (installAppButton) {
    installAppButton.addEventListener("click", () => {
      primeAudioContext();
      noteUserIntent();
      handleInstallApp();
    });
  }

  if (updateAppButton) {
    updateAppButton.addEventListener("click", () => {
      if (!swRegistration || !swRegistration.waiting) return;
      swRegistration.waiting.postMessage({ type: "SKIP_WAITING" });
      trackAnalyticsEvent("sw_update_clicked");
    });
  }

  if (arcadeViewToggleButton) {
    arcadeViewToggleButton.addEventListener("click", () => {
      setArcadeViewEnabled(!arcadeViewEnabled);
    });
  }

  if (volumeControl) {
    volumeControl.addEventListener("input", (event) => {
      settings.volume = Number(event.target.value);
      applyAudioSettings();
      persistSettings();
    });
  }

  if (sfxVolumeControl) {
    sfxVolumeControl.addEventListener("input", (event) => {
      settings.sfxVolume = Number(event.target.value);
      applyAudioSettings();
      persistSettings();
    });
  }

  if (musicVolumeControl) {
    musicVolumeControl.addEventListener("input", (event) => {
      settings.musicVolume = Number(event.target.value);
      applyAudioSettings();
      persistSettings();
    });
  }

  if (musicEnabledToggle) {
    musicEnabledToggle.addEventListener("change", (event) => {
      settings.musicEnabled = Boolean(event.target.checked);
      applyAudioSettings();
      persistSettings();
      renderSettingsUi();
    });
  }

  if (hapticsEnabledToggle) {
    hapticsEnabledToggle.addEventListener("change", (event) => {
      settings.hapticsEnabled = Boolean(event.target.checked);
      persistSettings();
    });
  }

  if (mobileInputModeSelect) {
    mobileInputModeSelect.addEventListener("change", (event) => {
      settings.mobileInputMode = event.target.value === "stick" ? "stick" : "buttons";
      persistSettings();
      updateMobileInputPresentation();
      resetStickKnob();
      resizeCanvasToFitViewport();
    });
  }

  if (challengeModeSelect) {
    challengeModeSelect.addEventListener("change", (event) => {
      applyChallengeModeSetting(event.target.value);
    });
  }

  if (paletteModeSelect) {
    paletteModeSelect.addEventListener("change", (event) => {
      const nextPalette = event.target.value;
      settings.paletteMode = Object.prototype.hasOwnProperty.call(COLOR_PALETTES, nextPalette)
        ? nextPalette
        : "classic";
      persistSettings();
      renderSettingsUi();
    });
  }

  if (reducedMotionToggle) {
    reducedMotionToggle.addEventListener("change", (event) => {
      settings.reducedMotion = Boolean(event.target.checked);
      persistSettings();
      applyAccessibilitySettings();
    });
  }

  if (largeHudToggle) {
    largeHudToggle.addEventListener("change", (event) => {
      settings.largeHud = Boolean(event.target.checked);
      persistSettings();
      applyAccessibilitySettings();
    });
  }

  if (oneHandedModeToggle) {
    oneHandedModeToggle.addEventListener("change", (event) => {
      settings.oneHandedMode = Boolean(event.target.checked);
      persistSettings();
      updateMobileInputPresentation();
      applyAccessibilitySettings();
      resizeCanvasToFitViewport();
    });
  }

  if (runSeedInput) {
    runSeedInput.addEventListener("input", () => {
      previewRunSeedStatus();
    });
    runSeedInput.addEventListener("change", () => {
      previewRunSeedStatus();
    });
    runSeedInput.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      noteUserIntent();
      applyRunSeedFromInput();
    });
  }

  if (applySeedButton) {
    applySeedButton.addEventListener("click", () => {
      noteUserIntent();
      applyRunSeedFromInput();
    });
  }

  if (copySeedButton) {
    copySeedButton.addEventListener("click", () => {
      copyCurrentSeed();
    });
  }

  if (simDebugEnabledToggle) {
    simDebugEnabledToggle.addEventListener("change", (event) => {
      settings.simDebugEnabled = Boolean(event.target.checked);
      if (!settings.simDebugEnabled) {
        settings.simPaused = false;
        simStepRequests = 0;
      }
      persistSettings();
      renderSimDebugStatus();
    });
  }

  if (simPauseButton) {
    simPauseButton.addEventListener("click", () => {
      if (!settings.simDebugEnabled) return;
      setSimulationPaused(!settings.simPaused);
    });
  }

  if (simStepButton) {
    simStepButton.addEventListener("click", () => {
      requestSimulationStep();
    });
  }

  const gamepadMappingInputs = [
    gamepadStartInput,
    gamepadPauseInput,
    gamepadRestartInput,
    gamepadMuteInput,
  ];
  for (let i = 0; i < gamepadMappingInputs.length; i++) {
    const input = gamepadMappingInputs[i];
    if (!input) continue;
    input.addEventListener("change", () => {
      applyGamepadMapFromInputs();
      renderSettingsUi();
    });
  }

  if (settingsPanel) {
    settingsPanel.addEventListener("toggle", () => {
      resizeCanvasToFitViewport();
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
    if (!pendingRebindAction) {
      noteUserIntent();
    }

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
    updateMobileInputPresentation();
    renderArcadeViewButton();
    resizeCanvasToFitViewport();
  });

  window.addEventListener("pointerdown", () => {
    noteUserIntent();
  }, { passive: true });

  window.addEventListener("hashchange", () => {
    const replayFromHash = parseReplayFromUrlHash();
    if (replayFromHash) {
      importReplayPayload(replayFromHash);
    }
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
  activeRunSeed = createRunSeed();
  setRunRandomSeed(activeRunSeed);
  runStartedAtMs = 0;
  runResultCommitted = true;
  highScore = readHighScoreFromStorage();
  syncHighScore();

  const replayFromHash = parseReplayFromUrlHash();
  if (replayFromHash) {
    replayLastRun = replayFromHash;
    renderReplayStatus(`Replay loaded from URL (${replayFromHash.events.length} inputs).`);
  }

  arcadeViewEnabled = loadArcadeViewPreference() && canUseArcadeView();
  document.body.classList.toggle("arcade-view", arcadeViewEnabled);

  resetMap();
  applyLevelTuning(level);
  prepareRound();

  updateMobileInputPresentation();
  resizeCanvasToFitViewport();
  renderStartButton();
  renderPauseButton();
  renderMuteButton();
  renderInstallButton();
  renderUpdateButton();
  renderReplayButton();
  renderArcadeViewButton();
  renderSettingsUi();
  applyAudioSettings();
  registerPwaHandlers();
  wireUiEvents();

  setPhase(GAME_PHASE_START, { message: "Press Start" });
  animationFrameId = window.requestAnimationFrame(gameLoop);
}

boot();
