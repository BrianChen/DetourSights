/**
 * import-place-content.js
 *
 * Takes AI-generated JSON content for a single place and writes it to the database.
 * Use this after manually generating content via the prompt in docs/ai-content-generation-example.txt.
 *
 * Usage:
 *   node lib/scripts/places/import-place-content.js --slug <place-slug> --file <path-to-json>
 *   node lib/scripts/places/import-place-content.js --slug central-park --file output.json
 *   node lib/scripts/places/import-place-content.js --slug central-park --file output.json --dry-run
 *
 * The JSON file should be the raw output from the AI — the script strips markdown
 * code fences if present before parsing.
 *
 * Required env vars (.env):
 *   DATABASE_URL
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import 'dotenv/config';

const prisma = new PrismaClient();

const VALID_INDOOR_OUTDOOR = ['INDOOR', 'OUTDOOR', 'BOTH'];

// ─── Args ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const slugIndex = args.indexOf('--slug');
const fileIndex = args.indexOf('--file');

if (slugIndex === -1 || fileIndex === -1) {
  console.error('Usage: node import-place-content.js --slug <place-slug> --file <path-to-json>');
  process.exit(1);
}

const placeSlug = args[slugIndex + 1];
const filePath  = args[fileIndex + 1];

if (!placeSlug || !filePath) {
  console.error('Both --slug and --file values are required.');
  process.exit(1);
}

// ─── Parse ────────────────────────────────────────────────────────────────────

function parseJson(filePath) {
  let raw;
  try {
    raw = readFileSync(filePath, 'utf-8').trim();
  } catch {
    throw new Error(`Could not read file: ${filePath}`);
  }

  // Strip markdown code fences if AI wrapped the JSON in ```json ... ```
  raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('Failed to parse JSON. Make sure the file contains valid JSON output from the AI.');
  }
}

// ─── Validate ─────────────────────────────────────────────────────────────────

function validate(data) {
  const errors = [];

  if (typeof data !== 'object' || data === null) errors.push('Root value must be an object');
  if (data.tagline !== undefined && typeof data.tagline !== 'string') errors.push('tagline must be a string');
  if (data.description !== undefined && typeof data.description !== 'string') errors.push('description must be a string');
  if (data.whyVisit !== undefined && !Array.isArray(data.whyVisit)) errors.push('whyVisit must be an array');
  if (data.localTips !== undefined && !Array.isArray(data.localTips)) errors.push('localTips must be an array');
  if (data.whatToBring !== undefined && !Array.isArray(data.whatToBring)) errors.push('whatToBring must be an array');
  if (data.moods !== undefined && !Array.isArray(data.moods)) errors.push('moods must be an array');
  if (data.indoorOutdoor !== undefined && data.indoorOutdoor !== null && !VALID_INDOOR_OUTDOOR.includes(data.indoorOutdoor)) {
    errors.push(`indoorOutdoor must be one of: ${VALID_INDOOR_OUTDOOR.join(', ')}`);
  }
  if (data.bookingRequired !== undefined && data.bookingRequired !== null && typeof data.bookingRequired !== 'boolean') {
    errors.push('bookingRequired must be a boolean or null');
  }
  if (data.weatherDependent !== undefined && data.weatherDependent !== null && typeof data.weatherDependent !== 'boolean') {
    errors.push('weatherDependent must be a boolean or null');
  }

  return errors;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (DRY_RUN) console.log('--- DRY RUN: no database writes ---\n');

  // Parse and validate JSON
  const data = parseJson(filePath);
  const errors = validate(data);
  if (errors.length > 0) {
    console.error('Validation errors:');
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  // Find place
  const place = await prisma.place.findUnique({
    where: { slug: placeSlug },
    include: { destination: { select: { name: true, country: true } } },
  });

  if (!place) {
    console.error(`No place found with slug: "${placeSlug}"`);
    process.exit(1);
  }

  console.log(`Place:  ${place.name} (${place.destination.name}, ${place.destination.country})`);
  console.log(`Slug:   ${place.slug}`);
  console.log(`File:   ${filePath}\n`);

  // Resolve mood slugs to IDs
  let moodIds = [];
  if (Array.isArray(data.moods) && data.moods.length > 0) {
    const moods = await prisma.mood.findMany({ where: { slug: { in: data.moods } } });
    const foundSlugs = moods.map((m) => m.slug);
    const unknownSlugs = data.moods.filter((s) => !foundSlugs.includes(s));
    if (unknownSlugs.length > 0) {
      console.warn(`  ⚠ Unknown mood slugs (skipped): ${unknownSlugs.join(', ')}`);
    }
    moodIds = moods.map((m) => m.id);
  }

  // Build place update payload — only include fields present in the JSON
  const updateData = {};
  const textFields = [
    'tagline', 'description', 'neighbourhood', 'bestTimeToVisit',
    'howLongToSpend', 'bookInAdvanceWarning', 'dressCode',
    'historyBackground', 'whatToExpect',
  ];
  const arrayFields = ['whyVisit', 'localTips', 'whatToBring'];
  const boolFields  = ['bookingRequired', 'weatherDependent'];

  for (const field of textFields) {
    if (field in data) updateData[field] = data[field];
  }
  for (const field of arrayFields) {
    if (field in data) updateData[field] = data[field].filter(Boolean);
  }
  for (const field of boolFields) {
    if (field in data) updateData[field] = data[field];
  }
  if ('indoorOutdoor' in data) updateData.indoorOutdoor = data.indoorOutdoor;

  // Preview
  console.log('Fields to update:');
  for (const [key, value] of Object.entries(updateData)) {
    const preview = Array.isArray(value)
      ? `[${value.length} items]`
      : typeof value === 'string'
        ? `"${value.slice(0, 80)}${value.length > 80 ? '…' : ''}"`
        : value;
    console.log(`  ${key}: ${preview}`);
  }
  if (moodIds.length > 0) {
    console.log(`  moods: [${data.moods.join(', ')}]`);
  }

  if (DRY_RUN) {
    console.log('\nDry run complete — no changes written.');
    return;
  }

  // Write to DB
  await prisma.place.update({
    where: { id: place.id },
    data: updateData,
  });

  // Upsert mood associations
  if (moodIds.length > 0) {
    await prisma.placeMood.deleteMany({ where: { placeId: place.id } });
    await prisma.placeMood.createMany({
      data: moodIds.map((moodId) => ({ placeId: place.id, moodId })),
    });
  }

  console.log(`\n✓ ${place.name} updated successfully.`);
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
