// scripts/generate-icons.js
// Run: node scripts/generate-icons.js
import sharp from "sharp";
import pngToIco from "png-to-ico";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function makeSvg(size) {
  const iconSize = Math.round(size * 0.55);
  const pad = Math.round((size - iconSize) / 2);
  const scale = iconSize / 32;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" fill="#0F6E56"/>
    <g transform="translate(${pad},${pad}) scale(${scale})">
      <rect x="2" y="4" width="20" height="6" rx="3" fill="white" opacity="0.28"/>
      <rect x="7" y="13" width="20" height="6" rx="3" fill="white" opacity="0.64"/>
      <rect x="12" y="22" width="20" height="6" rx="3" fill="white"/>
    </g>
  </svg>`;
}

function makeSplashSvg(w, h) {
  const logoSize = Math.round(Math.min(w, h) * 0.20);
  const padX = Math.round((w - logoSize) / 2);
  const padY = Math.round((h - logoSize) / 2);
  const scale = logoSize / 32;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <rect width="${w}" height="${h}" fill="#0F6E56"/>
    <g transform="translate(${padX},${padY}) scale(${scale})">
      <rect x="2" y="4" width="20" height="6" rx="3" fill="white" opacity="0.28"/>
      <rect x="7" y="13" width="20" height="6" rx="3" fill="white" opacity="0.64"/>
      <rect x="12" y="22" width="20" height="6" rx="3" fill="white"/>
    </g>
  </svg>`;
}

const icons = [
  { file: "public/icons/icon-72x72.png", size: 72 },
  { file: "public/icons/icon-96x96.png", size: 96 },
  { file: "public/icons/icon-128x128.png", size: 128 },
  { file: "public/icons/icon-144x144.png", size: 144 },
  { file: "public/icons/icon-152x152.png", size: 152 },
  { file: "public/icons/icon-192x192.png", size: 192 },
  { file: "public/icons/icon-384x384.png", size: 384 },
  { file: "public/icons/icon-512x512.png", size: 512 },
  { file: "public/icons/apple-touch-icon.png", size: 180 },
  { file: "public/favicon-16x16.png", size: 16 },
  { file: "public/favicon-32x32.png", size: 32 },
];

const splashScreens = [
  { file: "public/splash/iphone-se.png", w: 640, h: 1136 },
  { file: "public/splash/iphone-8.png", w: 750, h: 1334 },
  { file: "public/splash/iphone-8-plus.png", w: 1242, h: 2208 },
  { file: "public/splash/iphone-x.png", w: 1125, h: 2436 },
  { file: "public/splash/iphone-xr.png", w: 828, h: 1792 },
  { file: "public/splash/iphone-xs-max.png", w: 1242, h: 2688 },
  { file: "public/splash/iphone-12-mini.png", w: 1080, h: 2340 },
];

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function main() {
  await ensureDir(path.join(root, "public/icons"));
  await ensureDir(path.join(root, "public/splash"));

  // Generate regular icons
  for (const { file, size } of icons) {
    const outPath = path.join(root, file);
    const svg = Buffer.from(makeSvg(size));
    await sharp(svg).png().toFile(outPath);
    console.log(`✓ ${file}`);
  }

  // Generate favicon.ico (multi-size: 16 + 32)
  const ico16 = path.join(root, "public/favicon-16x16.png");
  const ico32 = path.join(root, "public/favicon-32x32.png");
  const icoBuffer = await pngToIco([ico16, ico32]);
  await fs.writeFile(path.join(root, "public/favicon.ico"), icoBuffer);
  console.log("✓ public/favicon.ico");

  // Generate splash screens
  for (const { file, w, h } of splashScreens) {
    const outPath = path.join(root, file);
    const svg = Buffer.from(makeSplashSvg(w, h));
    await sharp(svg).png().toFile(outPath);
    console.log(`✓ ${file}`);
  }

  console.log("\nAll icons generated successfully!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
