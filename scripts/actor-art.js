(function (scope) {
  const player = typeof Image === 'function' ? new Image() : null;
  const sheet = typeof Image === 'function' ? new Image() : null;
  if (player) player.src = 'images/animations.gif';
  if (sheet) sheet.src = 'images/ghost.png';
  const crops = { blinky:[0,0], pinky:[0,120], inky:[175,120], clyde:[175,0] };
  const variants = new Map();
  function ghostSprite(personality, frightened, flashing, eaten, direction) {
    if (!sheet || !sheet.complete || !sheet.naturalWidth) return null;
    const key = [personality,frightened,flashing,eaten,direction].join(':');
    if (variants.has(key)) return variants.get(key);
    const canvas = document.createElement('canvas'); canvas.width=canvas.height=16;
    const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
    const [x,y]=crops[personality]||crops.blinky;
    ctx.drawImage(sheet,x,y,125,116,0,0,16,16);
    const pixels=ctx.getImageData(0,0,16,16);
    for(let i=0;i<pixels.data.length;i+=4) {
      const d=pixels.data;
      const white=d[i]>230&&d[i+1]>230&&d[i+2]>230;
      const pupil=d[i]<30&&d[i+1]>100&&d[i+2]>180;
      if(eaten && !white && !pupil) d[i+3]=0;
      else if(frightened && d[i+3] && !white && !pupil) {
        d[i]=flashing?255:33;d[i+1]=flashing?255:33;d[i+2]=255;
      }
      if(pupil) {d[i]=255;d[i+1]=255;d[i+2]=255;}
    }
    ctx.putImageData(pixels,0,0);
    const dx=direction===4?1:direction===2?-1:0;
    const dy=direction===1?1:direction===3?-1:0;
    ctx.fillStyle=frightened?'#FEB897':'#009DFF';
    ctx.fillRect(5+dx,7+dy,2,2);ctx.fillRect(11+dx,7+dy,2,2);
    variants.set(key,canvas);return canvas;
  }
  function drawPlayer(context, actor) {
    if(!player||!player.complete||!player.naturalWidth) return;
    context.save();context.imageSmoothingEnabled=false;
    context.translate(actor.x+actor.width/2,actor.y+actor.height/2);
    context.rotate(actor.direction*Math.PI/2);
    context.drawImage(player,(actor.currentFrame-1)*20,0,20,20,-actor.width/2,-actor.height/2,actor.width,actor.height);
    context.restore();
  }
  function drawRival(context, actor, flashing=false) {
    const sprite=ghostSprite(actor.personality,actor.isFrightened(),flashing,actor.isEaten(),actor.direction);
    if(!sprite) return;
    context.save();context.imageSmoothingEnabled=false;
    const size=actor.width*1.2, x=actor.x-actor.width*.1,y=actor.y-actor.height*.1;
    const frame = typeof lastUpdateNow === 'number' ? Math.floor(lastUpdateNow / 140) % 2 : 0;
    if (frame && !actor.isEaten()) {
      context.drawImage(sprite,0,0,16,14,x,y,size,size*14/16);
      context.save();context.translate(x+size,y+size*14/16);context.scale(-1,1);
      context.drawImage(sprite,0,14,16,2,0,0,size,size*2/16);context.restore();
    } else context.drawImage(sprite,x,y,size,size);
    context.restore();
  }
  const api={drawPlayer,drawRival};
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  scope.ActorArt=api;
})(globalThis);
