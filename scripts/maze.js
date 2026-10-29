(function (scope) {
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



const arcadeRows = [
"############################",
"#............##............#",
"#.####.#####.##.#####.####.#",
"#o####.#####.##.#####.####o#",
"#.####.#####.##.#####.####.#",
"#..........................#",
"#.####.##.########.##.####.#",
"#.####.##.########.##.####.#",
"#......##....##....##......#",
"######.##### ## #####.######",
"     #.##### ## #####.#     ",
"     #.##          ##.#     ",
"     #.## ###--### ##.#     ",
"######.## #      # ##.######",
"      .   #      #   .      ",
"######.## #      # ##.######",
"     #.## ######## ##.#     ",
"     #.##          ##.#     ",
"     #.## ######## ##.#     ",
"######.## ######## ##.######",
"#............##............#",
"#.####.#####.##.#####.####.#",
"#.####.#####.##.#####.####.#",
"#o..##.......  .......##..o#",
"###.##.##.########.##.##.###",
"###.##.##.########.##.##.###",
"#......##....##....##......#",
"#.##########.##.##########.#",
"#.##########.##.##########.#",
"#..........................#",
"############################",
];
function arcadeMap() {
  return arcadeRows.map((row, y) => [...row].map((cell, x) => {
    if (cell === '#') return 1;
    if (cell === '.') return 2;
    if (cell === 'o') return 4;
    if (cell === '-') return 3;
    // The black margins beside the pen are outside the maze, not paths.
    if (y >= 9 && y <= 19 && y !== 14 && (x < 5 || x > 22)) return 1;
    return 0;
  }));
}
function seededMaze(seed, labyrinth = false) {
  const random = GameplayRandom(seed);
  const width = labyrinth ? 35 : 29, height = 31;
  const grid = Array.from({ length: height }, () => Array(width).fill(1));
  const stack = [{ x: 1, y: 1 }]; grid[1][1] = 2;
  while (stack.length) {
    const tile = stack[stack.length - 1];
    const options = [[0,-2],[-2,0],[0,2],[2,0]].filter(([dx,dy]) =>
      tile.x+dx > 0 && tile.x+dx < width-1 && tile.y+dy > 0 && tile.y+dy < height-1 && grid[tile.y+dy][tile.x+dx] === 1);
    if (!options.length) { stack.pop(); continue; }
    const [dx,dy] = options[Math.floor(random()*options.length)];
    grid[tile.y+dy/2][tile.x+dx/2] = 2;
    grid[tile.y+dy][tile.x+dx] = 2;
    stack.push({ x: tile.x+dx, y: tile.y+dy });
  }
  // Braid every dead end: living ghosts never need a normal reversal.
  for (let y=1;y<height-1;y++) for(let x=1;x<width-1;x++) {
    if(grid[y][x]===1) continue;
    const deltas=[[0,-1],[-1,0],[0,1],[1,0]];
    if(deltas.filter(([dx,dy])=>grid[y+dy][x+dx]!==1).length!==1) continue;
    const choices=deltas.filter(([dx,dy])=>x+2*dx>0&&x+2*dx<width-1&&y+2*dy>0&&y+2*dy<height-1&&grid[y+dy][x+dx]===1&&grid[y+2*dy][x+2*dx]!==1);
    if(choices.length) {const [dx,dy]=choices[Math.floor(random()*choices.length)];grid[y+dy][x+dx]=2;}
  }
  for(const y of [3,27]) { grid[y][1]=4;grid[y][width-2]=4; }
  // A clear ring connects the house to the generated corridor network.
  const cx=Math.floor(width/2);
  for(let y=11;y<=17;y++) for(let x=cx-4;x<=cx+4;x++) grid[y][x]=2;
  for(let y=12;y<=16;y++) for(let x=cx-3;x<=cx+3;x++) grid[y][x]=(y===12||y===16||x===cx-3||x===cx+3)?1:0;
  grid[12][cx]=3;
  grid[23][cx]=0;
  if(grid[23][cx-1]===1 && grid[23][cx+1]===1) grid[23][cx-1]=2;
  return grid;
}
function labyrinthMap() {
  const grid=Array.from({length:31},()=>Array(35).fill(1));
  function line(x1,y1,x2,y2) {
    for(let y=y1;y<=y2;y++) for(let x=x1;x<=x2;x++) grid[y][x]=2;
  }
  // Three circuits link at staggered crossings around a protected central pen.
  for(const [left,top,right,bottom] of [[1,1,33,29],[7,5,27,25],[13,9,21,21]]) {
    line(left,top,right,top);line(left,bottom,right,bottom);
    line(left,top,left,bottom);line(right,top,right,bottom);
  }
  line(17,1,17,9);line(1,17,13,17);line(21,17,33,17);line(17,21,17,29);
  line(13,11,21,11);line(13,17,21,17);
  for(let y=13;y<=15;y++) for(let x=15;x<=19;x++) grid[y][x]=0;
  grid[12][17]=3;
  grid[23][17]=0;
  for(const y of [3,27]) {grid[y][1]=4;grid[y][33]=4;}
  return grid;
}
function GameplayRandom(seed) {
  let state=seed;
  return () => { state=state*48271%2147483647;return (state-1)/2147483646; };
}
const registry = Object.freeze({
  'original-arcade': { name:'Original Arcade', width:28, height:31, start:{x:13,y:23}, home:{x:13,y:14}, exit:{x:13,y:11}, restrictedTurns:[{x:12,y:11},{x:15,y:11},{x:12,y:23},{x:15,y:23}], create:arcadeMap },
  remix: { name:'Remix', width:44, height:31, start:pacmanStart, home:{x:21,y:13}, exit:{x:21,y:8}, restrictedTurns:[], create:()=>classicMap.map(row=>row.slice()) },
  labyrinth: { name:'Labyrinth', width:35, height:31, start:{x:17,y:23}, home:{x:17,y:14}, exit:{x:17,y:11}, restrictedTurns:[], create:labyrinthMap },
  procedural: { name:'Procedural', width:29, height:31, start:{x:14,y:23}, home:{x:14,y:14}, exit:{x:14,y:11}, restrictedTurns:[], create:seed=>seededMaze(seed) },
});
function validate(grid, metadata) {
  if(grid.length!==metadata.height||grid.some(row=>row.length!==metadata.width)) throw Error('Invalid map dimensions');
  const seen=new Set(), queue=[metadata.start];
  for(let i=0;i<queue.length;i++) {
    const {x,y}=queue[i], key=x+','+y;
    if(seen.has(key)||!grid[y]||grid[y][x]===undefined||grid[y][x]===1||grid[y][x]===3) continue;
    seen.add(key);
    queue.push({x:x-1,y},{x:x+1,y},{x,y:y-1},{x,y:y+1});
    if(x===0&&grid[y][grid[0].length-1]!==1) queue.push({x:grid[0].length-1,y});
    if(x===grid[0].length-1&&grid[y][0]!==1) queue.push({x:0,y});
  }
  for(let y=0;y<grid.length;y++) for(let x=0;x<grid[y].length;x++) if((grid[y][x]===2||grid[y][x]===4)&&!seen.has(x+','+y)) throw Error('Unreachable pellet '+x+','+y);
  if(!seen.has(metadata.start.x+','+metadata.start.y)) throw Error('Unsafe player spawn');
  for(let y=0;y<grid.length;y++) {
    if((grid[y][0]!==1)!==(grid[y][grid[0].length-1]!==1)) throw Error('Unpaired tunnel');
    if(y===0||y===grid.length-1) {if(grid[y].some(cell=>cell!==1)) throw Error('Open vertical boundary');}
  }
  if(!seen.has(metadata.exit.x+','+metadata.exit.y)) throw Error('Unreachable house exit');
  return true;
}
function createDefinition(id='remix',seed=1) {
  if(!registry[id]) throw Error('Unknown map');
  if(!Number.isSafeInteger(seed)||seed<1||seed>2147483646) throw Error('Seed must be an integer from 1 to 2147483646');
  const metadata=registry[id];
  let grid, attempts=0;
  for (;attempts<32;attempts++) {
    const candidateSeed=((seed-1+attempts*104729)%2147483646)+1;
    grid=metadata.create(candidateSeed);
    try { validate(grid,metadata);break; }
    catch(error) { if(id!=="procedural") throw error; }
  }
  if(attempts===32) { grid=metadata.create(1);validate(grid,metadata); }
  const scatterTargets=id==='original-arcade'
    ? {blinky:{x:25,y:-3},pinky:{x:2,y:-3},inky:{x:27,y:31},clyde:{x:0,y:31}}
    : {blinky:{x:metadata.width+1,y:-3},pinky:{x:-3,y:-3},inky:{x:metadata.width+1,y:metadata.height+1},clyde:{x:-3,y:metadata.height+1}};
  const ghostSpawns={blinky:metadata.exit,pinky:{x:metadata.home.x-1,y:metadata.home.y},inky:metadata.home,clyde:{x:metadata.home.x+1,y:metadata.home.y}};
  return { ...metadata,id,grid,scatterTargets,ghostSpawns,generationAttempts:attempts+1,
    tunnels:grid.flatMap((row,y)=>row[0]!==1&&row[row.length-1]!==1?[{y,left:0,right:row.length-1}]:[]),
    pellets:grid.flatMap((row,y)=>row.flatMap((cell,x)=>cell===2?[{x,y}]:[])),
    powerPellets:grid.flatMap((row,y)=>row.flatMap((cell,x)=>cell===4?[{x,y}]:[])),
    constraints:{ reachablePellets:true, pairedTunnels:true },
  };
}
const api = { registry, createDefinition, validate, createMap: () => classicMap.map(row=>row.slice()), start:pacmanStart };
if (typeof module !== "undefined" && module.exports) module.exports = api;
scope.Maze = api;
})(globalThis);
