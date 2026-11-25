import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function runNodeScript(relativeScriptPath, args = []) {
  const scriptPath = path.resolve(rootDir, relativeScriptPath);
  if (!fs.existsSync(scriptPath)) {
    throw new Error(`Required build tool script not found: ${scriptPath}`);
  }
  execFileSync(process.execPath, [scriptPath, ...args], {
    cwd: rootDir,
    stdio: 'inherit',
  });
}

const ssrTmpDir = path.join(rootDir, '.ssr-tmp');

try {
  runNodeScript('node_modules/typescript/bin/tsc', ['-b']);
  runNodeScript('node_modules/vite/bin/vite.js', ['build']);
  runNodeScript('node_modules/vite/bin/vite.js', [
    'build',
    '--ssr',
    'src/entry-server.tsx',
    '--outDir',
    '.ssr-tmp',
  ]);
  runNodeScript('scripts/prerender-seo.mjs');
} finally {
  fs.rmSync(ssrTmpDir, { recursive: true, force: true });
}
