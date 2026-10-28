const { test, expect } = require("./fixtures");

async function prepare(page) {
  await page.goto("/");
  await page.waitForFunction(() => Boolean(window.__PACMAN_DIAGNOSTICS__));
  await page.evaluate(() => {
    window.advanceTime(0);
    startNewGame({ seed: 777 });
    window.advanceTime(2000);
  });
}

test("pause preserves power and movement, and steering does not resume", async ({ page }) => {
  await prepare(page);
  const before = await page.evaluate(() => {
    activateFrightenedMode(6000);
    handleAction("pause"); window.advanceTime(1000 / 60);
    return window.__PACMAN_DIAGNOSTICS__.getSimulationSnapshot();
  });
  await page.locator("#canvas").focus();
  await page.keyboard.press("ArrowLeft");
  const after = await page.evaluate(() => {
    window.advanceTime(10000);
    return window.__PACMAN_DIAGNOSTICS__.getSimulationSnapshot();
  });
  expect(after.phase).toBe("paused");
  expect(after.time).toBe(before.time);
  expect(after.pacman).toEqual(before.pacman);
  expect(after.frightenedUntil).toBe(before.frightenedUntil);
  await page.locator("#pause-toggle").click();
  await page.evaluate(() => window.advanceTime(1000 / 60));
  await expect(page.locator("[data-hud=phase]")).toHaveText("In play");
});

test("replay reconstructs the state hash in a fresh session", async ({ page }) => {
  await prepare(page);
  const capture = await page.evaluate(() => {
    handleAction("left"); window.advanceTime(400);
    handleAction("up"); window.advanceTime(300);
    handleAction("pause"); window.advanceTime(500);
    handleAction("pause"); window.advanceTime(300);
    return { replay: window.__PACMAN_DIAGNOSTICS__.exportReplay(), hash: window.__PACMAN_DIAGNOSTICS__.getStateHash() };
  });
  await page.reload();
  await page.waitForFunction(() => Boolean(window.__PACMAN_DIAGNOSTICS__));
  const hash = await page.evaluate(({ replay }) => {
    window.advanceTime(0);
    const api = window.__PACMAN_DIAGNOSTICS__;
    api.importReplay(replay); api.startReplay();
    window.advanceTime(replay.finalFrame * 1000 / 60);
    return api.getStateHash();
  }, capture);
  expect(hash).toBe(capture.hash);
});

test("form controls keep native keyboard handling", async ({ page }) => {
  await prepare(page);
  await page.locator("#settings-panel > summary").click();
  const input = page.locator("#run-seed-input");
  await input.fill("123");
  await input.press("ArrowLeft");
  await input.press("Home");
  const state = await page.evaluate(() => window.__PACMAN_DIAGNOSTICS__.getSimulationSnapshot());
  expect(state.pacman.nextDirection).toBe(4);
  await expect(input).toHaveValue("123");
  await page.locator("#pause-toggle").focus();
  await page.keyboard.press("Enter");
  await page.evaluate(() => window.advanceTime(1000 / 60));
  await expect(page.locator("#pause-toggle")).toHaveText("Resume");
});

test("manual stepping never contributes synthetic performance samples", async ({ page }) => {
  await prepare(page);
  const counts = await page.evaluate(() => {
    const api = window.__PACMAN_DIAGNOSTICS__;
    const before = api.getFramePacingSnapshot()?.sampleCount || 0;
    window.advanceTime(6000);
    return [before, api.getFramePacingSnapshot()?.sampleCount || 0];
  });
  expect(counts[1]).toBe(counts[0]);
});

test("desktop and narrow HUDs fit without horizontal overflow", async ({ page }) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({width, height: 900});
    await prepare(page);
    const metrics = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth,
      fields: [...document.querySelectorAll(".scoreboard dd")].map(node => ({ visible: node.clientWidth, content: node.scrollWidth })) }));
    expect(metrics.scroll).toBeLessThanOrEqual(metrics.width);
    for (const field of metrics.fields) expect(field.content).toBeLessThanOrEqual(field.visible);
  }
});

test("simulation hash agrees with the Node reference engine", async ({ page }) => {
  const { createEngine } = require("../helpers/engine");
  const { hashState } = require("../../scripts/simulation-clock");
  const fixture = [{action:"down",ticks:210},{action:"right",ticks:80},{action:"pause",ticks:90},{action:"pause",ticks:1},{action:"up",ticks:400}];
  const engine = createEngine();
  engine.run("startNewGame({seed:777})");
  for (const entry of fixture) {
    engine.run(`handleAction("${entry.action}")`);
    engine.advance(entry.ticks);
  }
  await page.goto("/");
  await page.waitForFunction(() => Boolean(window.__PACMAN_DIAGNOSTICS__));
  const hash = await page.evaluate((inputs) => {
    window.advanceTime(0); startNewGame({seed:777});
    for (const entry of inputs) { handleAction(entry.action); window.advanceTime(entry.ticks * 1000 / 60); }
    return window.__PACMAN_DIAGNOSTICS__.getStateHash();
  }, fixture);
  expect(hash).toBe(hashState(engine.state()));
});

test("visibility transitions clear gestures and require an explicit resume", async ({ page }) => {
  await prepare(page);
  const before = await page.evaluate(() => {
    swipeStartX = 100; swipeStartY = 200;
    Object.defineProperty(document, "hidden", {configurable:true, value:true});
    document.dispatchEvent(new Event("visibilitychange"));
    return window.__PACMAN_DIAGNOSTICS__.getSimulationSnapshot();
  });
  await page.evaluate(() => window.advanceTime(10000));
  const after = await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {configurable:true, value:false});
    document.dispatchEvent(new Event("visibilitychange"));
    return { state: window.__PACMAN_DIAGNOSTICS__.getSimulationSnapshot(), swipe: swipeStartX };
  });
  expect(after.state.time).toBe(before.time);
  expect(after.state.phase).toBe("paused");
  expect(after.swipe).toBeNull();
  await page.locator("#pause-toggle").click();
  await page.evaluate(() => window.advanceTime(1000 / 60));
  await expect(page.locator("[data-hud=phase]")).toHaveText("In play");
});

test("replay interface stops at its recorded end and reports verification", async ({ page }) => {
  await prepare(page);
  const frame = await page.evaluate(() => {
    const api = window.__PACMAN_DIAGNOSTICS__;
    handleAction("down"); window.advanceTime(600);
    const capture = api.exportReplay();
    api.importReplay(capture); api.startReplay();
    window.advanceTime((capture.finalFrame + 60) * 1000 / 60);
    return {actual:api.getSimulationSnapshot().frame, expected:capture.finalFrame};
  });
  expect(frame.actual).toBe(frame.expected);
  await expect(page.locator("#replay-last")).toHaveText("Replay again");
  await page.locator("#settings-panel > summary").click();
  await expect(page.locator("#replay-status")).toHaveText("Replay complete. State verified.");
  await expect(page.locator("#start-game")).toBeEnabled();
  await page.locator("#start-game").click();
  await page.evaluate(() => window.advanceTime(2000));
  await expect(page.locator("[data-hud=phase]")).toHaveText("In play");
});

test("level clear and cutscene skip advance without losing the session", async ({ page }) => {
  await prepare(page);
  const transition = await page.evaluate(() => {
    remainingFoodCount = 1;
    map[pacman.getMapY()][pacman.getMapX()] = 2;
    window.advanceTime(1000 / 60);
    return phase;
  });
  expect(transition).toBe("intermission");
  await page.evaluate(() => window.advanceTime(1600));
  await expect(page.locator("[data-hud=level]")).toHaveText("2");
  await page.evaluate(() => {
    window.advanceTime(1900);
    remainingFoodCount = 1;
    map[pacman.getMapY()][pacman.getMapX()] = 2;
    window.advanceTime(1700);
  });
  await expect(page.locator("#start-game")).toHaveText("Skip scene");
  await page.locator("#start-game").click();
  await page.evaluate(() => window.advanceTime(1000 / 60));
  await expect(page.locator("[data-hud=level]")).toHaveText("3");
});

test("session notices remain readable above the maze", async ({ page }) => {
  await prepare(page);
  await page.evaluate(() => { addHudToast("1UP!", undefined, 1000); window.advanceTime(0); });
  await expect(page.locator("[data-hud=notice]")).toHaveText("1UP!");
  await expect(page.locator("[data-hud=notice]")).toBeVisible();
});
