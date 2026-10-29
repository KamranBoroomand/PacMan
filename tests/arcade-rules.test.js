const test = require('node:test');
const assert = require('node:assert/strict');
const Maze = require('../scripts/maze');
const utils = require('../scripts/gameplay-utils');
const Replay = require('../scripts/replay-tools');
const {createEngine} = require('./helpers/engine');
const ids = Object.keys(Maze.registry);

test('arcade targeting retains out-of-board targets and the upward overflow quirk', () => {
  assert.deepEqual(utils.computeBlinkyTargetTile({x:3,y:5}), {x:3,y:5});
  for(const [direction, target] of [[4,{x:5,y:1}],[2,{x:-3,y:1}],[1,{x:1,y:5}],[3,{x:-3,y:-3}]]) {
    assert.deepEqual(utils.computePinkyTargetTile({x:1,y:1},direction,{maxX:2,maxY:2}),target);
  }
  assert.deepEqual(utils.computeInkyTargetTile({x:1,y:1},3,{x:6,y:4}),{x:-8,y:-6});
  assert.deepEqual(utils.computeClydeTargetTile({x:0,y:0},{x:8,y:0},{x:-3,y:34}),{x:0,y:0});
  assert.deepEqual(utils.computeClydeTargetTile({x:0,y:0},{x:5,y:5},{x:-3,y:34}),{x:-3,y:34});
});

test('arcade wave schedule has the long third chase and single-frame fourth scatter', () => {
  for(const level of [1,2,4,5,21]) {
    const s=utils.getGhostModeScheduleForLevel(level);
    assert.equal(s[0].durationMs,level<5?7000:5000);
    assert.equal(s[5].durationMs,level===1?20000:level<5?1033000:1037000);
    assert.equal(s[6].durationMs,level===1?5000:1000/60);
  }
  assert.equal(utils.getLevelTuning(19).frightenedDurationMs,0);
});

test('map registry exposes distinct boards, complete metadata, and arcade pellet counts', () => {
  const layouts=new Set();
  for(const id of ids) {
    const d=Maze.createDefinition(id,777);assert.ok(Maze.validate(d.grid,d));
    assert.notEqual(d.grid[d.start.y][d.start.x],1);
    assert.notEqual(d.grid[d.home.y][d.home.x],1);
    layouts.add(JSON.stringify(d.grid));
  }
  assert.equal(layouts.size,4);
  const a=Maze.createDefinition('original-arcade');
  assert.equal(a.pellets.length,240);assert.equal(a.powerPellets.length,4);
  assert.deepEqual(a.tunnels,[{y:14,left:0,right:27}]);
});

test('procedural seeds reproduce, vary and pass connectivity for 1000 candidates', () => {
  const layouts=new Set();
  for(let seed=1;seed<=1000;seed++) {
    const d=Maze.createDefinition('procedural',seed);
    assert.ok(Maze.validate(d.grid,d));
    layouts.add(JSON.stringify(d.grid));
  }
  assert.equal(layouts.size,1000);
  assert.deepEqual(Maze.createDefinition('procedural',77).grid,Maze.createDefinition('procedural',77).grid);
  for(const seed of [0,-1,1.2,2147483647,'12oops',NaN]) assert.throws(()=>Maze.createDefinition('procedural',seed));
});

for(const id of ids) test(`${id}: modes, settings, pellet completion and level reset`, () => {
  const e=createEngine();
  e.run(`settings.mapId='${id}';settings.challengeMode='no-power';persistSettings();settings=loadSettings();startNewGame({seed:777})`);
  assert.equal(e.state().mapId,id);
  assert.ok(e.state().map.every(row=>!row.includes(4)));
  e.run('for(let y=0;y<map.length;y++) for(let x=0;x<map[0].length;x++) if(map[y][x]===2) {pacman.x=x*oneBlockSize;pacman.y=y*oneBlockSize;pacman.eat();remainingFoodCount--;}');
  assert.equal(e.run('remainingFoodCount'),0);
  e.run('onLevelComplete()');e.advance(91);
  assert.equal(e.state().level,2);
  e.run('settings.challengeMode="one-life";startNewGame({seed:777});addScore(20000)');
  assert.equal(e.state().lives,1);e.run('onGhostCollision()');e.advance(67);
  assert.equal(e.state().phase,'gameover');
  e.run('restartCurrentRun()');assert.equal(e.state().lives,1);
  assert.equal(e.state().seed,777);
  e.run('settings.challengeMode="classic";startNewGame({seed:777});addScore(10000)');
  assert.equal(e.state().lives,4);
  e.run('settings.challengeMode="time-attack";startNewGame({seed:777});startNextLevel()');
  assert.equal(e.state().challengeTimeRemainingMs,138000);
});

test('living ghosts use Euclidean decisions even where shortest paths disagree', () => {
  const map=[[1,1,1,1,1],[1,0,1,0,1],[1,0,1,0,1],[1,0,0,0,1],[1,1,1,1,1]];
  assert.equal(utils.pickGhostDirection({map,candidates:[{direction:3,x:1,y:1},{direction:4,x:2,y:3}],targetTile:{x:3,y:1},currentDirection:4,personality:'inky'}),3);
});

test('ghost decisions prohibit reversal and honor forced changes and unlimited frightened turning', () => {
  const e=createEngine();e.run('startNewGame({seed:5});map=Array.from({length:9},()=>Array(9).fill(0));ghosts[0].x=80;ghosts[0].y=80;ghosts[0].direction=4');
  assert.notEqual(e.run('ghosts[0].calculateNewDirection(map,0,4)'),2);
  e.run('ghosts[0].pendingReverse=true;ghosts[0].target={x:0,y:80};ghosts[0].changeDirectionIfPossible()');
  assert.equal(e.run('ghosts[0].direction'),2);
  e.run('ghosts[0].setState("frightened");ghosts[0].frightenedTurnsRemaining=0');
  const choices=e.run('JSON.stringify(Array.from({length:100},()=>ghosts[0].calculateNewDirection(map,0,0)))');
  assert.ok(new Set(JSON.parse(choices)).size>1);
  e.run('ghosts[0].pendingReverse=false;ghosts[0].setFrightenedMode(false)');
  assert.equal(e.run('ghosts[0].pendingReverse'),false);
});

test('house personal counters, post-death counters and inactivity releases follow their priority', () => {
  const e=createEngine();e.run('settings.mapId="original-arcade";startNewGame({seed:5})');
  assert.equal(e.run('canReleaseGhostFromHouse(ghosts[1])'),true);
  e.run('ghosts[1].setInHouse(false);ghosts[2].houseDots=29');
  assert.equal(e.run('canReleaseGhostFromHouse(ghosts[2])'),false);
  e.run('ghosts[2].houseDots=30');assert.equal(e.run('canReleaseGhostFromHouse(ghosts[2])'),true);
  e.run('ghosts[2].setInHouse(false);ghosts[3].houseDots=59');assert.equal(e.run('canReleaseGhostFromHouse(ghosts[3])'),false);
  e.run('lastUpdateNow=4000');assert.equal(e.run('canReleaseGhostFromHouse(ghosts[3])'),true);
  e.run('houseGlobalCounter=true;houseGlobalDots=7;ghosts[1].setInHouse(true)');
  assert.equal(e.run('canReleaseGhostFromHouse(ghosts[1])'),true);
});

test('Elroy uses the arcade thresholds, speeds and chase target during scatter', () => {
  const e=createEngine();e.run('settings.mapId="original-arcade";startNewGame({seed:5});ghosts.forEach(g=>g.setInHouse(false));remainingFoodCount=20;updateCruiseElroyState()');
  assert.equal(e.run('ghosts[0].elroyPhase'),1);
  assert.equal(e.run('JSON.stringify(getGhostTargetForPersonality(ghosts[0]))'),e.run('JSON.stringify({x:pacman.x,y:pacman.y})'));
  const speed=e.run('ghosts[0].speed');e.run('remainingFoodCount=10;updateCruiseElroyState()');
  assert.equal(e.run('ghosts[0].elroyPhase'),2);assert.ok(e.run('ghosts[0].speed')>speed);
});

test('current replay imports require map, exact seed, digest and terminal frame', () => {
  const payload={schemaVersion:4,rulesetVersion:Replay.RULESET_VERSION,mapId:'procedural',seed:77,challengeMode:'classic',events:[],finalFrame:120,stateHash:'12345678'};
  assert.equal(Replay.sanitizeReplayPayload(payload).seed,77);
  for(const patch of [{mapId:'missing'},{seed:'77x'},{finalFrame:undefined},{stateHash:undefined},{rulesetVersion:'old'}]) assert.equal(Replay.sanitizeReplayPayload({...payload,...patch}),null);
});

test('map and mode records survive reload without coalescing', () => {
  const e=createEngine();e.run('settings.mapId="remix";startNewGame({seed:77});addScore(100);finalizeRunResult();settings.mapId="procedural";startNewGame({seed:77});addScore(200);finalizeRunResult();leaderboardState=loadLeaderboardState()');
  assert.equal(e.run('Object.keys(leaderboardState.entries).length'),2);
  assert.equal(e.run('new Set(Object.values(leaderboardState.entries).map(e=>e.mapId)).size'),2);
});
