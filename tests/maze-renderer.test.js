const test = require("node:test");
const assert = require("node:assert/strict");
const { createMazeRenderer } = require("../scripts/maze-renderer");

test("cached walls invalidate for maze, palette, and display scale changes", () => {
  let painted = 0;
  let draws = 0;
  const renderer = createMazeRenderer({drawImage() { draws++; }}, () => ({getContext: () => ({setTransform() {}, fillRect() { painted++; }})}));
  const map = [[1,1],[0,1]];
  const palette = {wallOuter: "blue", wallInner:"black"};
  renderer.draw(map, palette, 20, 1);
  const first = painted;
  renderer.draw(map, palette, 20, 1);
  assert.equal(painted, first);
  renderer.draw(map, {...palette,wallOuter:"white"}, 20, 1);
  assert.ok(painted > first);
  const second = painted;
  renderer.draw(map, palette, 20, 2);
  assert.ok(painted > second);
  const third = painted;
  renderer.draw([[1]], palette, 20, 2);
  assert.ok(painted > third);
  assert.equal(draws, 5);
});
