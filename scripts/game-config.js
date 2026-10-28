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

const HUD_ROWS = 0;
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
const REPLAY_SCHEMA_VERSION = 3;
const SETTINGS_TRANSFER_SCHEMA_VERSION = 1;
const SCORE_ANNOUNCEMENT_STEP = 100;
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
const SETTINGS_TRANSFER_KEYS = Object.freeze([
  "muted",
  "volume",
  "sfxVolume",
  "musicVolume",
  "musicEnabled",
  "hapticsEnabled",
  "mobileInputMode",
  "paletteMode",
  "reducedMotion",
  "largeHud",
  "oneHandedMode",
  "debugOverlay",
  "gamepadMap",
  "keybinds",
]);
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
    scatterTile: { x: 42, y: 1 },
    startInHouse: false,
    releaseDotThreshold: 0,
    forceReleaseMs: 0,
    spawnTile: { x: 21, y: 11 },
  },
  {
    id: "pinky",
    displayName: "Pinky",
    scatterTile: { x: 1, y: 1 },
    startInHouse: true,
    releaseDotThreshold: 0,
    forceReleaseMs: 700,
    spawnTile: { x: 20, y: 13 },
  },
  {
    id: "inky",
    displayName: "Inky",
    scatterTile: { x: 42, y: 29 },
    startInHouse: true,
    releaseDotThreshold: 6,
    forceReleaseMs: 1800,
    spawnTile: { x: 21, y: 13 },
  },
  {
    id: "clyde",
    displayName: "Clyde",
    scatterTile: { x: 1, y: 29 },
    startInHouse: true,
    releaseDotThreshold: 14,
    forceReleaseMs: 3200,
    spawnTile: { x: 22, y: 13 },
  },
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
  debugOverlay: false,
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
