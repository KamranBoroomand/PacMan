(function (scope) {
  function createMazeRenderer(context, createCanvas) {
    let layer = null;
    let previousMap = null;
    let previousStyle = "";

    return {
      draw(map, palette, blockSize, pixelScale) {
        const width = map[0].length * blockSize;
        const height = map.length * blockSize;
        const style = `${palette.wallOuter}/${palette.wallInner}/${pixelScale}`;
        if (!layer || previousMap !== map || previousStyle !== style) {
          if (!layer) layer = createCanvas();
          layer.width = Math.ceil(width * pixelScale);
          layer.height = Math.ceil(height * pixelScale);
          const painter = layer.getContext("2d");
          painter.setTransform(pixelScale, 0, 0, pixelScale, 0, 0);
          const inner = blockSize / 1.6;
          const offset = (blockSize - inner) / 2;
          for (let y = 0; y < map.length; y++) {
            for (let x = 0; x < map[y].length; x++) {
              if (map[y][x] === 3) {
                painter.fillStyle = "#F5A0DA";
                painter.fillRect(x * blockSize, (y + .4) * blockSize, blockSize, blockSize * .15);
              }
              if (map[y][x] !== 1) continue;
              painter.fillStyle = palette.wallOuter;
              painter.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
              painter.fillStyle = palette.wallInner;
              if (map[y][x - 1] === 1) painter.fillRect(x * blockSize, y * blockSize + offset, inner + offset, inner);
              if (map[y][x + 1] === 1) painter.fillRect(x * blockSize + offset, y * blockSize + offset, inner + offset, inner);
              if (map[y + 1]?.[x] === 1) painter.fillRect(x * blockSize + offset, y * blockSize + offset, inner, inner + offset);
              if (map[y - 1]?.[x] === 1) painter.fillRect(x * blockSize + offset, y * blockSize, inner, inner + offset);
            }
          }
          previousMap = map;
          previousStyle = style;
        }
        context.drawImage(layer, 0, 0, width, height);
      },
    };
  }
  const api = { createMazeRenderer };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  scope.MazeRenderer = api;
})(globalThis);
