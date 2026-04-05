import { writeFileSync } from "fs";
import { deflateSync } from "zlib";

function hexToRgb(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function fillRect(pixels, size, x, y, w, h, r, g, b) {
  for (let row = y; row < Math.min(y + h, size); row++) {
    for (let col = x; col < Math.min(x + w, size); col++) {
      const i = (row * size + col) * 4;
      pixels[i] = r; pixels[i+1] = g; pixels[i+2] = b; pixels[i+3] = 255;
    }
  }
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeB = Buffer.from(type, "ascii");
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[n] = c;
  }
  let c = 0xFFFFFFFF;
  for (const b of Buffer.concat([typeB, data])) c = table[(c ^ b) & 0xFF] ^ (c >>> 8);
  const crcB = Buffer.alloc(4);
  crcB.writeInt32BE((c ^ 0xFFFFFFFF) | 0, 0);
  return Buffer.concat([len, typeB, data, crcB]);
}

function createPNG(size, bgHex, fgHex) {
  const { r: br, g: bg, b: bb } = hexToRgb(bgHex);
  const { r: fr, g: fg, b: fb } = hexToRgb(fgHex);

  const pixels = new Uint8Array(size * size * 4);
  // Fill background
  for (let i = 0; i < size * size; i++) {
    pixels[i*4]=br; pixels[i*4+1]=bg; pixels[i*4+2]=bb; pixels[i*4+3]=255;
  }

  // Draw "S" shape
  const m = Math.floor(size * 0.22);
  const bw = size - m * 2;
  const bh = Math.floor(bw * 0.14);
  fillRect(pixels, size, m, m,                                    bw, bh, fr, fg, fb); // top bar
  fillRect(pixels, size, m, Math.floor(size/2)-Math.floor(bh/2), bw, bh, fr, fg, fb); // mid bar
  fillRect(pixels, size, m, size-m-bh,                            bw, bh, fr, fg, fb); // bot bar
  fillRect(pixels, size, m, m,                   bh, Math.floor(size*0.28), fr, fg, fb); // left-top
  fillRect(pixels, size, m+bw-bh, Math.floor(size/2), bh, Math.floor(size*0.28), fr, fg, fb); // right-bot

  // Build raw scanlines (filter byte 0 per row, RGB)
  const raw = Buffer.alloc(size * (1 + size * 3));
  for (let y = 0; y < size; y++) {
    raw[y * (1 + size * 3)] = 0;
    for (let x = 0; x < size; x++) {
      const s = (y * size + x) * 4;
      const d = y * (1 + size * 3) + 1 + x * 3;
      raw[d] = pixels[s]; raw[d+1] = pixels[s+1]; raw[d+2] = pixels[s+2];
    }
  }

  const comp = deflateSync(raw, { level: 6 });
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2;

  return Buffer.concat([sig, makeChunk("IHDR", ihdr), makeChunk("IDAT", comp), makeChunk("IEND", Buffer.alloc(0))]);
}

writeFileSync("public/icons/icon-192.png", createPNG(192, "#0F6E56", "#ffffff"));
writeFileSync("public/icons/icon-512.png", createPNG(512, "#0F6E56", "#ffffff"));
console.log("✓ Generated public/icons/icon-192.png and icon-512.png");
