#!/usr/bin/env node
/* eslint-disable node/no-process-env */
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const DIST_DIR_NAME = process.env.WEB_DIST_DIR || 'dist';
const DIST_DIR = path.resolve(__dirname, '..', DIST_DIR_NAME);
const ICONS_DIR = path.join(DIST_DIR, 'icons');
const CUSTOM_ICONS_DIR = path.resolve(
  __dirname,
  '..',
  'src',
  'assets',
  'pwa-icons',
);

const HEAD_MARKER_START = '<!-- SOMNIA_PWA_SEO_HEAD_START -->';
const HEAD_MARKER_END = '<!-- SOMNIA_PWA_SEO_HEAD_END -->';
const SW_MARKER_START = '<!-- SOMNIA_PWA_SW_START -->';
const SW_MARKER_END = '<!-- SOMNIA_PWA_SW_END -->';

const FALLBACK_SITE_URL = 'http://localhost:8081';
const FALLBACK_NAME = 'Универ - социальная сеть для студента';
const FALLBACK_SHORT_NAME = 'Универ';
const FALLBACK_DESCRIPTION =
  'Универ - социальная сеть для студента и сообществ.';
const FALLBACK_THEME_COLOR = '#04184F';

const SITEMAP_PATHS = [
  '/',
  '/sign-in',
  '/sign-up',
  '/feed',
  '/search',
  '/create',
  '/profile',
];

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

function createPngBuffer(width, height, pixelAt) {
  const rowSize = width * 4 + 1;
  const raw = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y += 1) {
    const rowStart = y * rowSize;
    raw[rowStart] = 0;
    for (let x = 0; x < width; x += 1) {
      const [r, g, b, a] = pixelAt(x, y);
      const pixelStart = rowStart + 1 + x * 4;
      raw[pixelStart] = r;
      raw[pixelStart + 1] = g;
      raw[pixelStart + 2] = b;
      raw[pixelStart + 3] = a;
    }
  }

  const signature = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function isInside(x, y, left, right, top, bottom) {
  return x >= left && x <= right && y >= top && y <= bottom;
}

function getIconPixel(size, x, y, isMaskable) {
  const t = y / Math.max(1, size - 1);
  const baseR = Math.round(6 + 20 * t);
  const baseG = Math.round(18 + 60 * t);
  const baseB = Math.round(74 + 140 * t);

  const logoLeft = Math.round(size * (isMaskable ? 0.18 : 0.24));
  const logoRight = Math.round(size * (isMaskable ? 0.82 : 0.76));
  const logoTop = Math.round(size * 0.18);
  const logoMid = Math.round(size * 0.5);
  const logoBottom = Math.round(size * 0.82);
  const stroke = Math.max(2, Math.round(size * 0.12));
  const halfStroke = Math.floor(stroke / 2);

  const inTop = isInside(x, y, logoLeft, logoRight, logoTop, logoTop + stroke);
  const inMiddle = isInside(
    x,
    y,
    logoLeft,
    logoRight,
    logoMid - halfStroke,
    logoMid + halfStroke,
  );
  const inBottom = isInside(
    x,
    y,
    logoLeft,
    logoRight,
    logoBottom - stroke,
    logoBottom,
  );
  const inLeft = isInside(x, y, logoLeft, logoLeft + stroke, logoTop, logoMid);
  const inRight = isInside(
    x,
    y,
    logoRight - stroke,
    logoRight,
    logoMid,
    logoBottom,
  );

  if (inTop || inMiddle || inBottom || inLeft || inRight) {
    return [246, 250, 255, 255];
  }

  return [baseR, baseG, baseB, 255];
}

function normalizeSiteUrl(rawUrl) {
  try {
    const normalizedUrl = new URL(rawUrl);
    normalizedUrl.hash = '';
    normalizedUrl.search = '';
    return normalizedUrl.toString().replace(/\/$/, '');
  } catch {
    return FALLBACK_SITE_URL;
  }
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function copyFileIfExists(sourcePath, targetPath) {
  if (!fs.existsSync(sourcePath)) {
    return false;
  }

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(sourcePath, targetPath);
  return true;
}

function updateViewportMeta(html) {
  const viewportRegex = /<meta name="viewport" content="([^"]*)"\s*\/?>/i;
  const match = html.match(viewportRegex);

  if (!match) {
    return html;
  }

  const content = match[1];
  const parts = content
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !part.startsWith('viewport-fit='));

  const nextMeta = `<meta name="viewport" content="${parts.join(', ')}" />`;
  return html.replace(viewportRegex, nextMeta);
}

function injectBetweenMarkers(html, startMarker, endMarker, section, closeTag) {
  if (html.includes(startMarker) && html.includes(endMarker)) {
    const markerRegex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, 'm');
    return html.replace(markerRegex, section);
  }

  return html.replace(closeTag, `${section}\n${closeTag}`);
}

function main() {
  if (!fs.existsSync(DIST_DIR)) {
    console.log(`[postexport-web] dist not found at ${DIST_DIR}, skipping.`);
    return;
  }

  const siteUrl = normalizeSiteUrl(
    process.env.EXPO_PUBLIC_WEBAPP_URL || FALLBACK_SITE_URL,
  );
  const appName = process.env.EXPO_PUBLIC_PWA_NAME || FALLBACK_NAME;
  const shortName =
    process.env.EXPO_PUBLIC_PWA_SHORT_NAME || FALLBACK_SHORT_NAME;
  const description =
    process.env.EXPO_PUBLIC_PWA_DESCRIPTION || FALLBACK_DESCRIPTION;
  const themeColor =
    process.env.EXPO_PUBLIC_PWA_THEME_COLOR || FALLBACK_THEME_COLOR;
  const today = new Date().toISOString().slice(0, 10);

  fs.mkdirSync(ICONS_DIR, { recursive: true });

  const favicon32 = createPngBuffer(32, 32, (x, y) =>
    getIconPixel(32, x, y, false),
  );
  const appleTouch180 = createPngBuffer(180, 180, (x, y) =>
    getIconPixel(180, x, y, true),
  );
  const pwa192 = createPngBuffer(192, 192, (x, y) =>
    getIconPixel(192, x, y, false),
  );
  const pwa512 = createPngBuffer(512, 512, (x, y) =>
    getIconPixel(512, x, y, false),
  );
  const pwaMaskable512 = createPngBuffer(512, 512, (x, y) =>
    getIconPixel(512, x, y, true),
  );

  const iconFiles = [
    {
      filename: 'favicon-32.png',
      generatedBuffer: favicon32,
    },
    {
      filename: 'apple-touch-icon-180.png',
      generatedBuffer: appleTouch180,
    },
    {
      filename: 'pwa-192.png',
      generatedBuffer: pwa192,
    },
    {
      filename: 'pwa-512.png',
      generatedBuffer: pwa512,
    },
    {
      filename: 'pwa-maskable-512.png',
      generatedBuffer: pwaMaskable512,
    },
  ];

  iconFiles.forEach(({ filename, generatedBuffer }) => {
    const customIconPath = path.join(CUSTOM_ICONS_DIR, filename);
    const distIconPath = path.join(ICONS_DIR, filename);
    const wasCopied = copyFileIfExists(customIconPath, distIconPath);

    if (!wasCopied) {
      writeFile(distIconPath, generatedBuffer);
    }
  });

  const manifest = {
    id: '/',
    name: appName,
    short_name: shortName,
    description,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: themeColor,
    theme_color: themeColor,
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/pwa-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/pwa-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/pwa-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };

  writeFile(
    path.join(DIST_DIR, 'manifest.webmanifest'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );

  const robotsTxt = `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`;
  writeFile(path.join(DIST_DIR, 'robots.txt'), robotsTxt);

  const sitemapEntries = SITEMAP_PATHS.map((routePath) => {
    return [
      '  <url>',
      `    <loc>${siteUrl}${routePath}</loc>`,
      `    <lastmod>${today}</lastmod>`,
      '  </url>',
    ].join('\n');
  }).join('\n');

  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    sitemapEntries,
    '</urlset>',
    '',
  ].join('\n');
  writeFile(path.join(DIST_DIR, 'sitemap.xml'), sitemap);

  const swCode = `self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
`;
  writeFile(path.join(DIST_DIR, 'sw.js'), swCode);

  const indexPath = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.log(
      `[postexport-web] index.html not found at ${indexPath}, skipping.`,
    );
    return;
  }

  let html = fs.readFileSync(indexPath, 'utf8');
  html = updateViewportMeta(html);
  html = html.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${escapeHtml(appName)}</title>`,
  );

  const escapedName = escapeHtml(appName);
  const escapedDescription = escapeHtml(description);
  const escapedCanonical = `${siteUrl}/`;
  const escapedThemeColor = escapeHtml(themeColor);

  const headSection = [
    HEAD_MARKER_START,
    `    <meta name="description" content="${escapedDescription}" />`,
    '    <meta name="robots" content="index,follow,max-image-preview:large" />',
    `    <link rel="canonical" href="${escapedCanonical}" />`,
    `    <meta name="theme-color" content="${escapedThemeColor}" />`,
    '    <meta name="mobile-web-app-capable" content="yes" />',
    '    <meta name="apple-mobile-web-app-capable" content="yes" />',
    '    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />',
    `    <meta name="apple-mobile-web-app-title" content="${escapedName}" />`,
    '    <meta name="format-detection" content="telephone=no" />',
    '    <link rel="manifest" href="/manifest.webmanifest" />',
    '    <link rel="icon" href="/icons/favicon-32.png" sizes="32x32" type="image/png" />',
    '    <link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png" />',
    `    <meta property="og:title" content="${escapedName}" />`,
    `    <meta property="og:description" content="${escapedDescription}" />`,
    '    <meta property="og:type" content="website" />',
    `    <meta property="og:url" content="${escapedCanonical}" />`,
    '    <meta property="og:image" content="/icons/pwa-512.png" />',
    '    <meta name="twitter:card" content="summary_large_image" />',
    `    <meta name="twitter:title" content="${escapedName}" />`,
    `    <meta name="twitter:description" content="${escapedDescription}" />`,
    '    <meta name="twitter:image" content="/icons/pwa-512.png" />',
    HEAD_MARKER_END,
  ].join('\n');

  html = injectBetweenMarkers(
    html,
    HEAD_MARKER_START,
    HEAD_MARKER_END,
    headSection,
    '</head>',
  );

  const swSection = [
    SW_MARKER_START,
    '  <script>',
    '    if ("serviceWorker" in navigator) {',
    '      const canRegisterSW =',
    '        window.location.protocol === "https:" ||',
    '        window.location.hostname === "localhost";',
    '      if (canRegisterSW) {',
    '        window.addEventListener("load", () => {',
    '          navigator.serviceWorker.register("/sw.js").catch(() => undefined);',
    '        });',
    '      }',
    '    }',
    '  </script>',
    SW_MARKER_END,
  ].join('\n');

  html = injectBetweenMarkers(
    html,
    SW_MARKER_START,
    SW_MARKER_END,
    swSection,
    '</body>',
  );

  fs.writeFileSync(indexPath, html);
  console.log('[postexport-web] PWA and SEO assets generated successfully.');
}

main();
