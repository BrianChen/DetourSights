/**
 * generate-place-content.js
 *
 * Single-place adapter around the ScribeKit CLI. Takes one place, spawns
 * ScribeKit as a subprocess, returns the generated content.
 *
 * ScribeKit lives in a separate repo (~/src/ScribeKit) and uses its own .env
 * for API credentials. We spawn it with cwd set to its own directory so it
 * picks up its own env correctly.
 */

import 'dotenv/config';
import { spawn } from 'child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

export async function generatePlaceContent(place) {
  if (!process.env.SCRIBEKIT_DIR) {
    throw new Error('Missing SCRIBEKIT_DIR env var — add it to .env (path to ScribeKit repo checkout)');
  }
  if (!place.placeName || !place.destinationName || !place.country) {
    throw new Error(
      `generatePlaceContent requires placeName, destinationName, and country. Got: ${JSON.stringify(place)}`
    );
  }

  const scribekitDir = process.env.SCRIBEKIT_DIR;

  const workDir    = mkdtempSync(join(tmpdir(), 'gen-place-content-'));
  const inputPath  = join(workDir, 'input.json');
  const outputPath = join(workDir, 'output.json');
  writeFileSync(inputPath, JSON.stringify([place]));

  try {
    await new Promise((resolve, reject) => {
      const child = spawn(
        'npx',
        ['tsx', 'src/cli.ts', 'generate', '-i', inputPath, '-o', outputPath],
        { cwd: scribekitDir, stdio: 'inherit' },
      );
      child.on('exit', code => {
        if (code === 0) resolve();
        else reject(new Error(`ScribeKit exited with code ${code}`));
      });
      child.on('error', err => reject(new Error(`Failed to spawn ScribeKit: ${err.message}`)));
    });

    const results = JSON.parse(readFileSync(outputPath, 'utf-8'));
    if (!Array.isArray(results) || results.length === 0) {
      throw new Error('ScribeKit produced empty result array');
    }

    const result = results[0];
    if (!result.editorialContent) {
      throw new Error('ScribeKit result missing editorialContent');
    }

    if (result.errors?.length) {
      console.warn(`  ⚠ ScribeKit warnings for ${place.placeName}: ${result.errors.join('; ')}`);
    }
    if (result.confidence === 'LOW') {
      console.warn(`  ⚠ ScribeKit low-confidence result for ${place.placeName}`);
    }

    rmSync(workDir, { recursive: true, force: true });
    return result;
  } catch (err) {
    console.error(
      `  ✗ generatePlaceContent failed for ${place.placeName}. Temp dir preserved for debugging: ${workDir}`
    );
    throw err;
  }
}
