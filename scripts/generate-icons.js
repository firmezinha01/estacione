// Pure Node.js PNG generator with zlib
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, drawFn) {
  // RGBA buffer with 1 filter byte per row
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: RGBA (6)
  ihdr[10] = 0; // Compression method: deflate
  ihdr[11] = 0; // Filter method
  ihdr[12] = 0; // Interlace method: no

  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(12 + len);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const crc = crc32(buf.subarray(4, 8 + len));
  buf.writeInt32BE(crc, 8 + len);
  return buf;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let j = 0; j < 8; j++) {
      c = (c >>> 1) ^ (-(c & 1) & 0xedb88320);
    }
  }
  return (c ^ 0xffffffff) | 0;
}

// Draw parking icon
function drawParkingIcon(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const r = w / 2;
  const dist = Math.hypot(x - cx, y - cy);

  // Background rounded squircle / gradient
  const cornerR = w * 0.22;
  const nx = Math.abs(x - cx);
  const ny = Math.abs(y - cy);
  const maxD = w * 0.45;

  let inBox = false;
  if (nx <= maxD && ny <= maxD) {
    if (nx > maxD - cornerR && ny > maxD - cornerR) {
      const cDist = Math.hypot(nx - (maxD - cornerR), ny - (maxD - cornerR));
      if (cDist <= cornerR) inBox = true;
    } else {
      inBox = true;
    }
  }

  if (!inBox) {
    return [0, 0, 0, 0];
  }

  // Dark blue / indigo gradient background
  const t = y / h;
  const bgR = Math.round(15 + 10 * t);
  const bgG = Math.round(23 + 25 * t);
  const bgB = Math.round(42 + 90 * t);

  // Draw Letter "P"
  // Stem: x in [0.35, 0.45] * w, y in [0.25, 0.75] * h
  const isStem = x >= w * 0.35 && x <= w * 0.45 && y >= h * 0.25 && y <= h * 0.75;
  // Loop outer: cx=0.45*w, cy=0.40*h, rx=0.22*w, ry=0.18*h
  const dxP = (x - w * 0.45) / (w * 0.22);
  const dyP = (y - w * 0.40) / (h * 0.17);
  const inOuterLoop = (dxP * dxP + dyP * dyP <= 1.0) && x >= w * 0.45;
  
  // Loop inner hole
  const dxIn = (x - w * 0.45) / (w * 0.12);
  const dyIn = (y - w * 0.40) / (h * 0.08);
  const inInnerHole = (dxIn * dxIn + dyIn * dyIn < 1.0) && x >= w * 0.45;

  // Car or ticket accent at bottom right (cyan dot / badge)
  const isAccent = Math.hypot(x - w * 0.70, y - h * 0.70) <= w * 0.10;

  if (isAccent) {
    return [16, 185, 129, 255]; // Emerald badge
  }

  if ((isStem || inOuterLoop) && !inInnerHole) {
    return [248, 250, 252, 255]; // White 'P'
  }

  // Subtle border glow
  const borderMargin = w * 0.02;
  return [bgR, bgG, bgB, 255];
}

const iconsDir = path.resolve('public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 192x192
const p192 = createPNG(192, 192, drawParkingIcon);
fs.writeFileSync(path.join(iconsDir, 'icon-192x192.png'), p192);

// 512x512
const p512 = createPNG(512, 512, drawParkingIcon);
fs.writeFileSync(path.join(iconsDir, 'icon-512x512.png'), p512);

// Apple touch icon
fs.writeFileSync(path.resolve('public', 'apple-touch-icon.png'), p192);

// Favicon
fs.writeFileSync(path.resolve('public', 'favicon.ico'), createPNG(64, 64, drawParkingIcon));

console.log('✅ Generated icons successfully!');
