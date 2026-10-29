const {test,expect}=require('./fixtures');
const path=require('node:path');
const fs=require('node:fs');
const {createEngine}=require('../helpers/engine');
const {hashState}=require('../../scripts/simulation-clock');
const ids=['original-arcade','remix','labyrinth','procedural'];
test.use({video:{mode:'on',size:{width:960,height:720}}});

for(const mapId of ids) test(`${mapId} supports every mode and deterministic browser gameplay`,async({page},info)=>{
  await page.goto('/');
  await page.waitForFunction(()=>!!window.__PACMAN_DIAGNOSTICS__);
  await page.evaluate(()=>window.advanceTime(0));
  const layouts=[];
  for(const mode of ['classic','time-attack','no-power','one-life']) {
    await page.selectOption('#map-select',mapId);
    await page.selectOption('#challenge-mode',mode);
    const initial=await page.evaluate(()=>{startNewGame({seed:777});window.advanceTime(2000);return getSimulationSnapshot();});
    expect(initial.mapId).toBe(mapId);expect(initial.mode).toBe(mode);
    expect(initial.lives).toBe(mode==='one-life'?1:3);
    if(mode==='no-power') expect(initial.map.flat().includes(4)).toBe(false);
    await page.locator('#canvas').focus();
    for(const key of ['ArrowLeft','ArrowUp','ArrowRight','ArrowDown']) {
      await page.keyboard.press(key);
      await page.evaluate(()=>window.advanceTime(350));
    }
    const played=await page.evaluate(()=>getSimulationSnapshot());
    expect(played.score).toBeGreaterThan(0);
    expect(played.ghosts.some((g,i)=>g.x!==initial.ghosts[i].x||g.y!==initial.ghosts[i].y)).toBe(true);
    await expect(page.locator('[data-hud=mode]')).toContainText(mode==='classic'?'Standard':mode==='time-attack'?'Time attack':mode==='no-power'?'No power':'One life');
    if(mode==='time-attack') {
      expect(played.challengeTimeRemainingMs).toBeLessThan(120000);
      await page.locator('#pause-toggle').click();await page.evaluate(()=>window.advanceTime(1000/60));
      const time=await page.evaluate(()=>challengeTimeRemainingMs);
      await page.evaluate(()=>window.advanceTime(5000));
      expect(await page.evaluate(()=>challengeTimeRemainingMs)).toBe(time);
    }
    if(mode==='classic') {
      const directory=path.resolve('.artifacts/arcade-review',info.project.name);
      fs.mkdirSync(directory,{recursive:true});
      await page.screenshot({path:path.join(directory,`${mapId}.png`),fullPage:true});
      const evidence=await page.evaluate(()=>JSON.parse(render_game_to_text()));
      fs.writeFileSync(path.join(directory,`${mapId}.json`),JSON.stringify(evidence,null,2));
    }
    const replay=await page.evaluate(()=>window.__PACMAN_DIAGNOSTICS__.exportReplay());
    const expected=await page.evaluate(()=>window.__PACMAN_DIAGNOSTICS__.getStateHash());
    const e=createEngine();e.run(`settings.mapId=${JSON.stringify(mapId)};settings.challengeMode=${JSON.stringify(mode)};startNewGame({seed:777})`);
    e.run(`replayLastRun=${JSON.stringify(replay)};startReplayLastRun()`);e.advance(replay.finalFrame);
    expect(hashState(e.state())).toBe(expected);
    const verification=await page.evaluate(replay=>{const api=window.__PACMAN_DIAGNOSTICS__;api.importReplay(replay);api.startReplay();window.advanceTime((replay.finalFrame+1)*1000/60);return {hash:api.getStateHash(),verified:replayPlayback.verified};},replay);
    expect(verification).toEqual({hash:expected,verified:true});
    layouts.push(initial.map);
  }
  await page.reload();await page.waitForFunction(()=>!!window.__PACMAN_DIAGNOSTICS__);
  await expect(page.locator('#map-select')).toHaveValue(mapId);
  await expect(page.locator('#challenge-mode')).toHaveValue('one-life');
});

test('seed controls procedural geometry and rejects malformed input; daily uses UTC identity',async({page})=>{
  await page.goto('/');await page.waitForFunction(()=>!!window.__PACMAN_DIAGNOSTICS__);
  await page.evaluate(()=>window.advanceTime(0));
  await page.selectOption('#map-select','procedural');
  await page.locator('#settings-panel > summary').click();
  const input=page.locator('#run-seed-input');
  const geometry=[];
  for(const seed of ['77','77','78']) {
    await input.fill(seed);await page.locator('#apply-seed').click();
    geometry.push(await page.evaluate(()=>JSON.stringify(map)));
    await expect(page.locator('#seed-status')).toContainText(seed);
  }
  expect(geometry[0]).toBe(geometry[1]);expect(geometry[1]).not.toBe(geometry[2]);
  for(const seed of ['0','2147483647','1.5']) {
    await input.fill(seed);await page.locator('#apply-seed').click();
    expect(await page.evaluate(()=>activeRunSeed)).toBe(78);
    await expect(page.locator('#seed-status')).toContainText('Seed must');
  }
  await page.locator('#daily-challenge').click();
  const daily=await page.evaluate(()=>({date:activeDailyDate,expected:new Date().toISOString().slice(0,10),map:activeMap.id,seed:activeRunSeed}));
  expect(daily.date).toBe(daily.expected);expect(daily.map).toBe('procedural');
  await page.locator('#restart-game').click();
  expect(await page.evaluate(()=>activeRunSeed)).toBe(daily.seed);
});

test('source sprites reach the canvas and ghost debug leaves simulation unchanged',async({page})=>{
  await page.addInitScript(() => {
    window.drawnSpriteSources=[];
    const original=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage=function(source,...args) {if(source.src)window.drawnSpriteSources.push(source.src);return original.call(this,source,...args);};
  });
  await page.goto('/');await page.waitForFunction(()=>!!window.__PACMAN_DIAGNOSTICS__);
  const result=await page.evaluate(async()=>{

    await Promise.all(['images/ghost.png','images/animations.gif'].map(src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=resolve;img.onerror=reject;img.src=src;})));
    window.advanceTime(0);startNewGame({seed:77});window.advanceTime(2100);
    const before=window.__PACMAN_DIAGNOSTICS__.getStateHash();settings.debugOverlay=true;draw();
    const after=window.__PACMAN_DIAGNOSTICS__.getStateHash();

    return {sources:window.drawnSpriteSources,before,after};
  });
  expect(result.sources.some(src=>src.endsWith('animations.gif'))).toBe(true);
  expect(result.sources.some(src=>src.endsWith('ghost.png'))).toBe(true);
  expect(result.before).toBe(result.after);
});
