#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-bitwise */

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const WIDTH = 393;
const HEIGHT = 852;
const OUT_DIR = path.resolve(__dirname, '..', 'src', 'assets', 'backgrounds');

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let j = 0; j < 8; j += 1) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    crc = crcTable[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32BE(data.length, 0);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer]);
}

function writePng(filename, pixels) {
  const rowSize = WIDTH * 4 + 1;
  const raw = Buffer.alloc(rowSize * HEIGHT);

  for (let y = 0; y < HEIGHT; y += 1) {
    const rowStart = y * rowSize;
    raw[rowStart] = 0;
    for (let x = 0; x < WIDTH; x += 1) {
      const src = pixels[y * WIDTH + x];
      const pixelStart = rowStart + 1 + x * 4;
      raw[pixelStart] = src[0];
      raw[pixelStart + 1] = src[1];
      raw[pixelStart + 2] = src[2];
      raw[pixelStart + 3] = 255;
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(WIDTH, 0);
  header.writeUInt32BE(HEIGHT, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  fs.writeFileSync(
    path.join(OUT_DIR, filename),
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      pngChunk('IHDR', header),
      pngChunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
      pngChunk('IEND', Buffer.alloc(0)),
    ]),
  );
}

function hex(value) {
  return [
    Number.parseInt(value.slice(1, 3), 16),
    Number.parseInt(value.slice(3, 5), 16),
    Number.parseInt(value.slice(5, 7), 16),
  ];
}

function clamp(value, min = 0, max = 255) {
  return Math.max(min, Math.min(max, value));
}

function mix(a, b, t) {
  return a.map((channel, index) => channel + (b[index] - channel) * t);
}

function smoothstep(edge0, edge1, value) {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function noise(x, y, seed) {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 37.719) * 43758.5453;
  return n - Math.floor(n);
}

function createCanvas(baseAt) {
  const pixels = new Array(WIDTH * HEIGHT);

  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const n = noise(x, y, 6) - 0.5;
      pixels[y * WIDTH + x] = baseAt(x, y).map((channel) =>
        clamp(Math.round(channel + n * 5)),
      );
    }
  }

  return pixels;
}

function blendPixel(pixels, x, y, color, alpha) {
  const ix = Math.round(x);
  const iy = Math.round(y);

  if (ix < 0 || ix >= WIDTH || iy < 0 || iy >= HEIGHT || alpha <= 0) {
    return;
  }

  const index = iy * WIDTH + ix;
  pixels[index] = pixels[index].map((channel, channelIndex) =>
    clamp(Math.round(channel * (1 - alpha) + color[channelIndex] * alpha)),
  );
}

function addRadial(pixels, centerX, centerY, radius, color, opacity) {
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const alpha = (1 - smoothstep(0, radius, distance)) * opacity;
      blendPixel(pixels, x, y, color, alpha);
    }
  }
}

function drawLine(pixels, x1, y1, x2, y2, color, alpha, width = 1) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const steps = Math.max(Math.abs(dx), Math.abs(dy)) * 2;

  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const x = x1 + dx * t;
    const y = y1 + dy * t;

    for (let oy = -width; oy <= width; oy += 1) {
      for (let ox = -width; ox <= width; ox += 1) {
        const falloff =
          1 - Math.min(1, Math.sqrt(ox * ox + oy * oy) / (width + 0.75));
        blendPixel(pixels, x + ox, y + oy, color, alpha * falloff);
      }
    }
  }
}

function drawCircle(pixels, cx, cy, radius, color, alpha) {
  for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y += 1) {
    for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= radius) {
        blendPixel(
          pixels,
          x,
          y,
          color,
          alpha * (1 - smoothstep(radius - 1, radius, distance)),
        );
      }
    }
  }
}

function drawGrid(pixels, color, alpha, step, angleOffset = 0) {
  for (let x = -HEIGHT; x < WIDTH + HEIGHT; x += step) {
    drawLine(pixels, x, 0, x + angleOffset, HEIGHT, color, alpha, 0.45);
  }

  for (let y = 0; y < HEIGHT; y += step) {
    drawLine(pixels, 0, y, WIDTH, y + angleOffset * 0.12, color, alpha, 0.35);
  }
}

function makeApplicationBackground() {
  const top = hex('#04184F');
  const mid = hex('#07579D');
  const bottom = hex('#0D8695');
  const pixels = createCanvas((x, y) => {
    const vertical = y / (HEIGHT - 1);
    const horizontal = x / (WIDTH - 1);
    const base =
      vertical < 0.62
        ? mix(top, mid, smoothstep(0, 0.62, vertical))
        : mix(mid, bottom, smoothstep(0.62, 1, vertical));
    return mix(
      base,
      hex('#031033'),
      smoothstep(0.15, 0.95, vertical) * (1 - horizontal) * 0.35,
    );
  });

  addRadial(pixels, WIDTH * 0.95, HEIGHT * 0.82, 310, hex('#1FD1B2'), 0.25);
  addRadial(pixels, WIDTH * 0.08, HEIGHT * 0.1, 250, hex('#0C3B88'), 0.34);
  addRadial(pixels, WIDTH * 0.78, HEIGHT * 0.18, 160, hex('#F2C14E'), 0.045);
  drawGrid(pixels, hex('#F6FBFF'), 0.018, 44, -80);
  drawLine(pixels, -40, 608, 120, 548, hex('#DCEEFF'), 0.09, 0.6);
  drawLine(pixels, 120, 548, 255, 598, hex('#DCEEFF'), 0.09, 0.6);
  drawLine(pixels, 255, 598, 430, 502, hex('#DCEEFF'), 0.09, 0.6);
  drawLine(pixels, -30, 702, 140, 690, hex('#8BE8D7'), 0.08, 0.5);
  drawLine(pixels, 140, 690, 312, 730, hex('#8BE8D7'), 0.08, 0.5);
  drawCircle(pixels, 120, 548, 3.4, hex('#F7FBFF'), 0.48);
  drawCircle(pixels, 255, 598, 3.4, hex('#F7FBFF'), 0.42);

  return pixels;
}

function makeAuthBackground() {
  const top = hex('#0A5EA8');
  const mid = hex('#07336F');
  const bottom = hex('#020C2D');
  const pixels = createCanvas((x, y) => {
    const vertical = y / (HEIGHT - 1);
    const base =
      vertical < 0.38
        ? mix(top, mid, smoothstep(0, 0.38, vertical))
        : mix(mid, bottom, smoothstep(0.38, 1, vertical));
    return mix(base, hex('#10183C'), smoothstep(0, 1, x / WIDTH) * 0.12);
  });

  addRadial(pixels, WIDTH * 0.12, HEIGHT * 0.02, 260, hex('#6EE7D8'), 0.22);
  addRadial(pixels, WIDTH * 0.92, HEIGHT * 0.22, 230, hex('#2B8CFF'), 0.17);
  addRadial(pixels, WIDTH * 0.55, HEIGHT * 0.82, 250, hex('#084E80'), 0.18);
  drawGrid(pixels, hex('#F7FBFF'), 0.015, 48, 68);
  drawLine(pixels, 28, 186, 138, 142, hex('#F7FBFF'), 0.07, 0.55);
  drawLine(pixels, 138, 142, 315, 190, hex('#F7FBFF'), 0.07, 0.55);
  drawLine(pixels, 72, 642, 188, 600, hex('#8BE8D7'), 0.07, 0.5);
  drawLine(pixels, 188, 600, 338, 650, hex('#8BE8D7'), 0.07, 0.5);

  return pixels;
}

function makeOnboardingBackground() {
  const top = hex('#118AD0');
  const mid = hex('#065698');
  const bottom = hex('#020D31');
  const pixels = createCanvas((x, y) => {
    const vertical = y / (HEIGHT - 1);
    const base =
      vertical < 0.44
        ? mix(top, mid, smoothstep(0, 0.44, vertical))
        : mix(mid, bottom, smoothstep(0.44, 1, vertical));
    return mix(base, hex('#FFFFFF'), smoothstep(0, 0.32, 1 - vertical) * 0.06);
  });

  addRadial(pixels, WIDTH * 0.86, HEIGHT * 0.08, 290, hex('#76EAD9'), 0.25);
  addRadial(pixels, WIDTH * 0.05, HEIGHT * 0.42, 260, hex('#0B6BD3'), 0.24);
  addRadial(pixels, WIDTH * 0.68, HEIGHT * 0.76, 230, hex('#F2C14E'), 0.055);
  drawGrid(pixels, hex('#F7FBFF'), 0.018, 42, -46);
  drawLine(pixels, -20, 456, 88, 418, hex('#EAF7FF'), 0.11, 0.55);
  drawLine(pixels, 88, 418, 196, 468, hex('#EAF7FF'), 0.11, 0.55);
  drawLine(pixels, 196, 468, 405, 404, hex('#EAF7FF'), 0.11, 0.55);
  drawLine(pixels, 42, 566, 156, 538, hex('#8BE8D7'), 0.11, 0.5);
  drawLine(pixels, 156, 538, 295, 588, hex('#8BE8D7'), 0.11, 0.5);
  drawCircle(pixels, 88, 418, 6, hex('#F7FBFF'), 0.58);
  drawCircle(pixels, 196, 468, 4.8, hex('#F7FBFF'), 0.44);
  drawCircle(pixels, 156, 538, 4.2, hex('#8BE8D7'), 0.5);

  return pixels;
}

writePng('application-bg.png', makeApplicationBackground());
writePng('onboarding-auth.png', makeAuthBackground());
writePng('onboarding-main.png', makeOnboardingBackground());
