const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function createEngine() {
  const noop = () => {};
  const context2d = new Proxy({ measureText: (text) => ({width: text.length * 8}) }, { get: (object, key) => object[key] || noop });
  const storage = new Map();
  const sandbox = {
    console,
    performance: { now: () => 0 },
    document: {
      hidden: false,
      createElement: () => ({ getContext: () => context2d }),
      getElementById: (id) => id === "canvas" ? { getContext: () => context2d } : null,
      querySelectorAll: () => [],
      body: { classList: { toggle: noop } },
    },
    navigator: { getGamepads: () => [] },
    localStorage: { getItem: (key) => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) },
    matchMedia: () => ({ matches: false }),
    dispatchEvent: noop,
    CustomEvent: class {},
  };
  sandbox.window = sandbox;
  const context = vm.createContext(sandbox);
  for (const name of ["gameplay-utils", "game-storage", "replay-tools", "perf-guardrails", "simulation-clock", "game-config", "maze-renderer", "audio", "maze", "pacman", "ghost", "game"]) {
    const code = fs.readFileSync(path.resolve(__dirname, `../../scripts/${name}.js`), "utf8");
    vm.runInContext(name === "game" ? code.replace(/boot\(\);\s*$/, "") : code, context);
  }
  return {
    run: (code) => vm.runInContext(code, context),
    state: () => JSON.parse(vm.runInContext("JSON.stringify(getSimulationSnapshot())", context)),
    advance: (ticks) => vm.runInContext(`for(let i=0;i<${ticks};i++) update()`, context),
  };
}
module.exports = { createEngine };
