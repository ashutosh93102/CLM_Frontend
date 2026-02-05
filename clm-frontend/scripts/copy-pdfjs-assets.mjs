import { mkdir, cp, stat } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'node_modules', 'pdfjs-dist');
const DEST = path.join(ROOT, 'public', 'pdfjs');

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function copyDir(dirName) {
  const srcDir = path.join(SRC, dirName);
  const destDir = path.join(DEST, dirName);

  if (!(await exists(srcDir))) {
    // pdfjs-dist not installed yet or path changed
    return;
  }

  await mkdir(DEST, { recursive: true });

  // Node 20 supports fs.cp
  await cp(srcDir, destDir, { recursive: true, force: true });
}

async function main() {
  await copyDir('standard_fonts');
  await copyDir('cmaps');
}

main().catch((err) => {
  console.error('[copy-pdfjs-assets] failed:', err);
  process.exitCode = 0; // don’t hard-fail installs; PDF rendering will still work with warnings
});
