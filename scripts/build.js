const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const output = path.join(root, "dist");
const scripts = [...fs.readFileSync(path.join(root, "index.html"), "utf8").matchAll(/<script src="([^"]+)"/g)].map((match) => match[1]);
const worker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");
const assetsLiteral = worker.match(/const STATIC_ASSETS = (\[[\s\S]*?\]);/)[1];
const assets = vm.runInNewContext(assetsLiteral);
for (const script of scripts) {
  if (!assets.includes(`./${script}`)) throw new Error(`Missing offline script: ${script}`);
}
for (const asset of assets) {
  if (!fs.existsSync(path.join(root, asset))) throw new Error(`Missing offline asset: ${asset}`);
}
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
const files = new Set([...assets.filter((asset) => asset !== "./"), "service-worker.js", "CNAME", "LICENSE", "fonts/OFL.txt"]);
for (const file of files) {
  const destination = path.join(output, file);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(path.join(root, file), destination);
}
console.log(`Static site built in dist/ (${scripts.length} runtime scripts, ${files.size} files).`);
