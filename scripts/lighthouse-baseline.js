#!/usr/bin/env node

const { spawn, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const SHOULD_RUN = process.env.LIGHTHOUSE_RUN === "1";
const PORT = Number.parseInt(process.env.LIGHTHOUSE_PORT || "4173", 10);
const URL = `http://127.0.0.1:${PORT}/`;
const SKIP_SERVER = process.env.LIGHTHOUSE_SKIP_SERVER === "1";
const OUTPUT_DIR = path.resolve(".artifacts");
const REPORT_PATH = path.join(OUTPUT_DIR, "lighthouse-report.json");

if (!SHOULD_RUN) {
  console.log("Skipping Lighthouse baseline. Set LIGHTHOUSE_RUN=1 to run it.");
  process.exit(0);
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

let server = null;
let serverStartError = null;

function startServer() {
  if (SKIP_SERVER) {
    return;
  }

  server = spawn("python3", ["-m", "http.server", String(PORT)], {
    stdio: "ignore",
  });

  server.once("error", (error) => {
    serverStartError = error;
  });
}

function killServer() {
  if (SKIP_SERVER || !server || server.killed) {
    return;
  }

  if (server.exitCode === null) {
    server.kill("SIGTERM");
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServerReady(maxTries = 25) {
  for (let attempt = 0; attempt < maxTries; attempt += 1) {
    if (serverStartError) {
      throw new Error(`Failed to start static server: ${serverStartError.message}`);
    }

    if (server && server.exitCode !== null && server.exitCode !== 0) {
      throw new Error(
        `Static server exited early with code ${server.exitCode}. Check port ${PORT} availability.`
      );
    }

    const response = spawnSync("curl", ["-fsS", URL], {
      stdio: "ignore",
    });
    if (response.status === 0) {
      return;
    }
    await wait(250);
  }
  if (SKIP_SERVER) {
    throw new Error(
      `Static server was not reachable at ${URL}. Start a server first or unset LIGHTHOUSE_SKIP_SERVER.`
    );
  }

  throw new Error(`Static server was not reachable at ${URL}`);
}

function parseMetric(audits, id) {
  const metric = audits && audits[id];
  if (!metric || !Number.isFinite(metric.numericValue)) {
    return Infinity;
  }
  return metric.numericValue;
}

async function run() {
  try {
    startServer();
    await waitForServerReady();

    const runResult = spawnSync(
      "npx",
      [
        "--yes",
        "lighthouse",
        URL,
        "--quiet",
        "--chrome-flags=--headless=new",
        "--output=json",
        `--output-path=${REPORT_PATH}`,
      ],
      { stdio: "inherit" }
    );
    if (runResult.status !== 0) {
      throw new Error("Lighthouse command failed.");
    }

    const report = JSON.parse(fs.readFileSync(REPORT_PATH, "utf8"));
    const performanceScore = Number(
      report &&
        report.categories &&
        report.categories.performance &&
        report.categories.performance.score
    );
    const audits = report && report.audits ? report.audits : {};
    const fcp = parseMetric(audits, "first-contentful-paint");
    const lcp = parseMetric(audits, "largest-contentful-paint");
    const tti = parseMetric(audits, "interactive");

    const failures = [];
    if (!Number.isFinite(performanceScore) || performanceScore < 0.7) {
      failures.push(`performance score ${performanceScore} < 0.7`);
    }
    if (fcp > 2200) {
      failures.push(`FCP ${Math.round(fcp)}ms > 2200ms`);
    }
    if (lcp > 3200) {
      failures.push(`LCP ${Math.round(lcp)}ms > 3200ms`);
    }
    if (tti > 5200) {
      failures.push(`TTI ${Math.round(tti)}ms > 5200ms`);
    }

    console.log(
      `Lighthouse baseline: score=${performanceScore.toFixed(2)} fcp=${Math.round(
        fcp
      )}ms lcp=${Math.round(lcp)}ms tti=${Math.round(tti)}ms`
    );

    if (failures.length > 0) {
      throw new Error(`Baseline failed: ${failures.join("; ")}`);
    }
  } finally {
    killServer();
  }
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
