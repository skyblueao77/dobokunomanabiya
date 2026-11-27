import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(rootDir, 'dist');
const assetsDir = path.join(distDir, 'assets');

const BUDGETS = {
  entryJsGzipMaxBytes: 115 * 1024, // 115 KiB gzip max for initial entry JS
  courseShellRawMaxBytes: 15 * 1024, // 15 KiB raw max per multi-chapter shell chunk
  swPrecacheTotalMaxBytes: 450 * 1024, // 450 KiB raw max for total SW precache
};

function fail(message) {
  console.error(`[budget-check] FAILED: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(assetsDir)) {
  fail('dist/assets directory not found. Run `npm run build` first.');
}

const assetFiles = fs.readdirSync(assetsDir);

// 1. Entry JS gzip budget
const entryJsFile = assetFiles.find((f) => /^index-[^.]+\.js$/.test(f));
if (!entryJsFile) {
  fail('Could not locate entry JS chunk in dist/assets/');
}
const entryJsBuf = fs.readFileSync(path.join(assetsDir, entryJsFile));
const entryJsGzip = zlib.gzipSync(entryJsBuf).length;
console.log(
  `[budget-check] Entry JS (${entryJsFile}): raw=${(entryJsBuf.length / 1024).toFixed(1)} KiB, gzip=${(entryJsGzip / 1024).toFixed(1)} KiB (limit ${(BUDGETS.entryJsGzipMaxBytes / 1024).toFixed(0)} KiB)`
);
if (entryJsGzip > BUDGETS.entryJsGzipMaxBytes) {
  fail(`Entry JS gzip size ${entryJsGzip} exceeds budget ${BUDGETS.entryJsGzipMaxBytes}`);
}

// 2. Course shell chunk raw budgets (verifies chapter-level lazy splitting stays intact)
for (const prefix of [
  'GeomechanicsCourseModule',
  'LinearProgrammingCourseModule',
  'NonlinearProgrammingCourseModule',
]) {
  const file = assetFiles.find((f) => f.startsWith(`${prefix}-`) && f.endsWith('.js'));
  if (!file) {
    fail(`Missing course shell chunk for ${prefix}`);
  }
  const size = fs.statSync(path.join(assetsDir, file)).size;
  console.log(
    `[budget-check] Course shell (${file}): ${(size / 1024).toFixed(1)} KiB (limit ${(BUDGETS.courseShellRawMaxBytes / 1024).toFixed(0)} KiB)`
  );
  if (size > BUDGETS.courseShellRawMaxBytes) {
    fail(`Course shell ${file} (${size} B) exceeds budget ${BUDGETS.courseShellRawMaxBytes} B`);
  }
}

// 3. Service Worker precache budget & unused OGP exclusion
const swPath = path.join(distDir, 'sw.js');
if (!fs.existsSync(swPath)) {
  fail('dist/sw.js not found');
}
const swText = fs.readFileSync(swPath, 'utf8');
if (swText.includes('og-image.png')) {
  fail('dist/sw.js must not precache unused og-image.png');
}
const precachedUrls = [...swText.matchAll(/\{url:"([^"]+)"/g)].map((m) => m[1]);
let totalPrecacheBytes = 0;
for (const relUrl of precachedUrls) {
  const fullPath = path.join(distDir, relUrl.replace(/^\/+/, ''));
  if (fs.existsSync(fullPath)) {
    totalPrecacheBytes += fs.statSync(fullPath).size;
  }
}
console.log(
  `[budget-check] SW precache: ${precachedUrls.length} entries, ${(totalPrecacheBytes / 1024).toFixed(1)} KiB (limit ${(BUDGETS.swPrecacheTotalMaxBytes / 1024).toFixed(0)} KiB)`
);
if (totalPrecacheBytes > BUDGETS.swPrecacheTotalMaxBytes) {
  fail(
    `SW precache total (${totalPrecacheBytes} B) exceeds budget ${BUDGETS.swPrecacheTotalMaxBytes} B`
  );
}

console.log('[budget-check] All bundle & PWA precache budgets passed!');
