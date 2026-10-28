(function (scope) {
  function polygon(context, points, color) {
    context.fillStyle = color;
    context.beginPath();
    points.forEach(([x, y], index) => index ? context.lineTo(x, y) : context.moveTo(x, y));
    context.closePath();
    context.fill();
  }

  function drawPlayer(context, actor) {
    context.save();
    context.translate(actor.x + actor.width / 2, actor.y + actor.height / 2);
    context.rotate(actor.direction * Math.PI / 2);
    context.scale(actor.width, actor.height);
    context.translate(-0.5, -0.5);
    polygon(context, [[0.94,0.5],[0.26,0.08],[0.08,0.3],[0.3,0.5],[0.08,0.7],[0.26,0.92]], "#FFE279");
    const inset = actor.currentFrame % 3 * 0.025;
    polygon(context, [[0.7,0.5],[0.35+inset,0.3],[0.43+inset,0.5],[0.35+inset,0.7]], "#FFF6CF");
    context.restore();
  }

  function drawRival(context, actor, flashing = false) {
    const identities = {
      blinky: { color: "#FF6B6B", marks: 1 },
      pinky: { color: "#F5A0DA", marks: 2 },
      inky: { color: "#6FE3EF", marks: 3 },
      clyde: { color: "#FFB869", marks: 4 },
    };
    const identity = identities[actor.personality] || identities.blinky;
    context.save();
    context.translate(actor.x, actor.y);
    context.scale(actor.width, actor.height);
    if (actor.isInHouse()) context.globalAlpha = 0.65;
    if (actor.isEaten()) {
      context.strokeStyle = "#E8F7FF";
      context.lineWidth = 0.09;
      context.strokeRect(0.34, 0.34, 0.32, 0.32);
      context.fillStyle = "#7CF7D4";
      context.fillRect(0.44, 0.44, 0.12, 0.12);
    } else {
      const frightened = actor.isFrightened();
      const color = frightened ? (flashing ? "#F4F4F4" : "#4578FF") : identity.color;
      polygon(context, [[0.22,0.08],[0.78,0.08],[0.96,0.5],[0.78,0.92],[0.22,0.92],[0.04,0.5]], color);
      context.fillStyle = "#08131D";
      context.fillRect(0.2, 0.32, 0.6, 0.22);
      const offsetX = actor.direction === 4 ? 0.07 : actor.direction === 2 ? -0.07 : 0;
      const offsetY = actor.direction === 1 ? 0.035 : actor.direction === 3 ? -0.035 : 0;
      context.fillStyle = frightened ? "#FFE279" : "#FFFFFF";
      context.fillRect(0.37 + offsetX, 0.36 + offsetY, 0.26, 0.13);
      context.fillStyle = "#08131D";
      const marks = frightened ? 2 : identity.marks;
      for (let index = 0; index < marks; index++) {
        context.fillRect(0.5 - marks * 0.06 + index * 0.12, 0.68, 0.07, 0.1);
      }
    }
    context.restore();
  }

  const api = { drawPlayer, drawRival };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  scope.ActorArt = api;
})(globalThis);
