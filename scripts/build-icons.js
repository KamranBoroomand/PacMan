const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("@playwright/test");

async function buildIcons() {
  const root = path.resolve(__dirname, "..");
  const source = fs.readFileSync(path.join(root, "images/maze-icon.svg"), "utf8");
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    for (const size of [192, 512]) {
      const encoded = await page.evaluate(async ({ source, size }) => {
        const url = URL.createObjectURL(new Blob([source], { type: "image/svg+xml" }));
        try {
          const artwork = new Image();
          artwork.src = url;
          await artwork.decode();
          const canvas = document.createElement("canvas");
          canvas.width = canvas.height = size;
          canvas.getContext("2d").drawImage(artwork, 0, 0, size, size);
          return canvas.toDataURL("image/png").split(",")[1];
        } finally { URL.revokeObjectURL(url); }
      }, { source, size });
      fs.writeFileSync(path.join(root, `images/icon-${size}.png`), Buffer.from(encoded, "base64"));
    }
  } finally { await browser.close(); }
}

buildIcons().catch((error) => { console.error(error.message); process.exitCode = 1; });
