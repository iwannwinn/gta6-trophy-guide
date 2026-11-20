// Leonida Platinum — the hand-in program for gta6-trophy-guide-01 (Node 22,
// standard library only). It copies this repository's app/ and screenshots/
// into the output directory and writes /output/dossier.json with the kit's
// vendored library, so the scorer and the judge read exactly what was built.
// vendor/makefun-frontend.ts is the kit's copy and stays untouched: the gate
// rebuilds the dossier with its own copy and compares the two byte for byte.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// The repository root is the folder this file lives in; the output folder is
// /output in the grader, or MAKEFUN_OUTPUT_DIR when set for a local run.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's own caps, as the kit's gate states them: at most 4 screenshots
// and 256 KiB each, at most 993 files and 48 MiB under app/, and the dossier
// itself at most 160 KiB of text. main.ts refuses an entry the scorer would.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

function copyInto(destination, sourceName) {
  const source = join(repoRoot, sourceName);
  if (!existsSync(source)) return;
  mkdirSync(join(destination, sourceName), { recursive: true });
  cpSync(source, join(destination, sourceName), { recursive: true });
}

mkdirSync(outDir, { recursive: true });
copyInto(outDir, 'app');
copyInto(outDir, 'screenshots');

writeFileSync(join(outDir, 'dossier.json'), buildDossier(outDir, DOSSIER_CAPS));
