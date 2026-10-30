const test = require("node:test");
const assert = require("node:assert/strict");
const { createEngine } = require("./helpers/engine");

function playingEngine() {
  const engine = createEngine();
  engine.run("startNewGame({seed: 777});");
  engine.advance(110);
  assert.equal(engine.state().phase, "playing");
  return engine;
}

test("pause freezes frightened, fruit, mode, animation, and challenge timers", () => {
  const e = playingEngine();
  e.run("activateFrightenedMode(6000); spawnFruit(); setPaused(true)");
  const before = e.state();
  const animation = e.run("pacman.currentFrame");
  e.advance(1200);
  const after = e.state();
  assert.equal(after.time, before.time);
  assert.equal(after.frightenedUntil, before.frightenedUntil);
  assert.deepEqual(after.fruit, before.fruit);
  assert.deepEqual(after.ghosts, before.ghosts);
  assert.equal(after.ghostModeElapsedMs, before.ghostModeElapsedMs);
  assert.equal(after.runDurationMs, before.runDurationMs);
  assert.equal(e.run("pacman.currentFrame"), animation);
  e.run("setPaused(false)");
  e.advance(1);
  assert.ok(e.state().time > before.time);
  assert.ok(e.run("isGhostFrightened()"));
});

test("debug pause freezes the logical clock and one requested step advances it once", () => {
  const e = playingEngine();
  e.run("settings.simDebugEnabled = true; settings.simPaused = true;");
  const before = e.state();
  e.advance(500);
  assert.deepEqual(e.state(), before);
  e.run("simStepRequests = 1");
  e.advance(10);
  assert.equal(e.state().frame, before.frame + 1);
});

test("ready and death transitions preserve their remaining duration across pause", () => {
  const e = createEngine();
  e.run("startNewGame({seed: 4}); setPaused(true)");
  e.advance(200);
  e.run("setPaused(false)");
  e.advance(100);
  assert.equal(e.state().phase, "ready");
  e.advance(10);
  assert.equal(e.state().phase, "playing");
  e.run("onGhostCollision(); setPaused(true)");
  e.advance(200);
  e.run("setPaused(false)");
  e.advance(60);
  assert.equal(e.state().phase, "dying");
  e.advance(10);
  assert.equal(e.state().phase, "ready");
});

test("same seed and recorded inputs reproduce full simulation state including pause", () => {
  const e = playingEngine();
  e.run('handleAction("left")'); e.advance(50);
  e.run('handleAction("pause")'); e.advance(90);
  e.run('handleAction("pause")'); e.advance(1);
  e.run('handleAction("up")'); e.advance(120);
  const expected = e.state();
  e.run("replayLastRun = sanitizeReplayPayload({...replayCurrentRun, finalFrame:simulationFrame, stateHash:SimulationClock.hashState(getSimulationSnapshot())}); startReplayLastRun()");
  e.advance(expected.frame);
  assert.deepEqual(e.state(), expected);
});

test("frightened expiration resumes the remaining scatter schedule", () => {
  const e = playingEngine();
  e.run("activateFrightenedMode(1000)");
  const before = e.state().ghostModeElapsedMs;
  e.advance(30);
  assert.equal(e.state().ghostModeElapsedMs, before);
  e.advance(31);
  assert.ok(e.state().ghostModeElapsedMs > before);
});

test("maze completion and final life loss reach their next phases", () => {
  const e = playingEngine();
  e.run("remainingFoodCount = 0"); e.advance(1);
  assert.equal(e.state().phase, "intermission");
  e.advance(91);
  assert.equal(e.state().phase, "ready");
  assert.equal(e.state().level, 2);
  e.run("lives = 1; onGhostCollision()"); e.advance(67);
  assert.equal(e.state().phase, "gameover");
  assert.equal(e.run("Object.keys(leaderboardState.entries).length"), 1);
});

test("buffered turns survive blocked intersections without snapping position", () => {
  const e = playingEngine();
  e.run("pacman.x=421; pacman.y=460; pacman.direction=4; pacman.nextDirection=3; map[22][21]=1; pacman.changeDirectionIfPossible()");
  assert.equal(e.run("pacman.x"), 421);
  assert.equal(e.run("pacman.direction"), 4);
  assert.equal(e.run("pacman.nextDirection"), 3);
});

test("all pellets are reachable from the player spawn including wrap tunnels", () => {
  const e = createEngine();
  const map = e.state().map;
  const seen = new Set();
  const queue = [[21, 23]];
  while (queue.length) {
    const [x,y] = queue.shift();
    const key = `${x},${y}`;
    if (!map[y] || map[y][x] === 1 || seen.has(key)) continue;
    seen.add(key);
    for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      queue.push([(x+dx+map[0].length)%map[0].length,y+dy]);
    }
  }
  for (let y=0;y<map.length;y++) for (let x=0;x<map[y].length;x++) {
    if ([2,4].includes(map[y][x])) assert.ok(seen.has(`${x},${y}`), `unreachable pellet ${x},${y}`);
  }
});

test("D-pad horizontal directions work with neutral analog axes", () => {
  const e = playingEngine();
  e.run('navigator.getGamepads = () => [{ axes: [0,0], buttons: Array.from({length:16}, (_,i) => ({pressed:i===14})) }]');
  e.advance(1);
  assert.equal(e.run("pacman.nextDirection"), 2);
});

test("one-life and no-power rules retain their distinct behavior", () => {
  const e = createEngine();
  e.run('settings.challengeMode="one-life"; startNewGame({seed:4}); addScore(10000)');
  assert.equal(e.state().lives, 1);
  e.run('settings.challengeMode="no-power"; startNewGame({seed:4})');
  e.advance(110);
  e.run('pacman.x=20;pacman.y=20;pacman.direction=2;pacman.nextDirection=2');
  e.advance(1);
  assert.equal(e.state().score, 10);
  assert.equal(e.run("isGhostFrightened()"), false);
});

test("time attack uses playing time and freezes during pause", () => {
  const e = createEngine();
  e.run('settings.challengeMode="time-attack"; startNewGame({seed:4})');
  e.advance(100);
  assert.equal(e.state().challengeTimeRemainingMs, 120000);
  e.advance(10);
  e.run("setPaused(true)");
  const before = e.state().challengeTimeRemainingMs;
  e.advance(1000);
  assert.equal(e.state().challengeTimeRemainingMs, before);
  e.run("setPaused(false);challengeTimeRemainingMs=1");
  e.advance(1);
  assert.equal(e.state().phase, "dying");
  assert.equal(e.state().lives, 0);
});

test("replaying a completed run preserves both terminal state and stored records", () => {
  const e = playingEngine();
  e.run("while (phase !== GAME_PHASE_GAMEOVER && simulationFrame < 10000) update()");
  assert.equal(e.state().phase, "gameover");
  const expected = e.state();
  const record = e.run("JSON.stringify(leaderboardState)");
  e.run("startReplayLastRun()");
  e.advance(expected.frame);
  assert.deepEqual(e.state(), expected);
  assert.equal(e.run("JSON.stringify(leaderboardState)"), record);
});

test("recordings stop at their final frame and verify the state digest", () => {
  const e = playingEngine();
  e.run('handleAction("down")'); e.advance(60);
  const expected = e.state();
  e.run('replayLastRun = {...replayCurrentRun, finalFrame: simulationFrame, stateHash: SimulationClock.hashState(getSimulationSnapshot())}; startReplayLastRun()');
  e.advance(expected.frame + 120);
  assert.deepEqual(e.state(), expected);
  assert.equal(e.run('replayPlayback.completed'), true);
  assert.equal(e.run('replayPlayback.verified'), true);
  e.run('handleAction("right")'); e.advance(1);
  assert.equal(e.state().frame, expected.frame + 1);
});

test("focus loss clears touch gestures and pauses exactly once", () => {
  const e = playingEngine();
  e.run('swipeStartX=12; swipeStartY=34; stickPointerId=5; pauseForFocusLoss(); pauseForFocusLoss()');
  assert.equal(e.run('swipeStartX'), null);
  assert.equal(e.run('stickPointerId'), null);
  assert.equal(e.state().phase, 'paused');
});

test("first-run reduced motion follows the system preference", () => {
  const e = createEngine();
  e.run('window.matchMedia=()=>({matches:true});settings=loadSettings()');
  assert.equal(e.run('settings.reducedMotion'), true);
});
