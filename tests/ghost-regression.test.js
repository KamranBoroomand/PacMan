const test = require("node:test");
const assert = require("node:assert/strict");
const Maze = require("../scripts/maze");
const {createEngine}=require("./helpers/engine");

for(const id of Object.keys(Maze.registry)) test(`${id} house release travels to its map exit`, () => {
  const e=createEngine();e.run(`settings.mapId="${id}";startNewGame({seed:777})`);
  const start=e.run('ghosts[1].x+","+ghosts[1].y');
  e.run('ghosts[1].releaseFromHouse()');
  assert.equal(e.run('ghosts[1].x+","+ghosts[1].y'),start);
  e.run('for(let i=0;i<300&&ghosts[1].isInHouse();i++) ghosts[1].moveProcess()');
  assert.equal(e.run('ghosts[1].isInHouse()'),false);
  assert.equal(e.run('ghosts[1].direction'),2);
  assert.equal(e.run('ghosts[1].y'),Maze.createDefinition(id,777).exit.y*20);
});

test("Remix retains its three paired horizontal tunnels",()=>{
  assert.deepEqual(Maze.createDefinition('remix').tunnels.map(t=>t.y),[8,15,27]);
});
