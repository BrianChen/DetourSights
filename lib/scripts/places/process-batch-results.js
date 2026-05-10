/**
 * process-batch-results.js
 *
 * Polls an existing Anthropic Batch API job and writes results to the database.
 * Use this when generate-place-content.js submitted a batch but the process was
 * killed before results could be processed.
 *
 * Usage:
 *   node lib/scripts/places/process-batch-results.js <batchId>
 *
 * The input file (places-to-generate.json) must still contain the same entries
 * that were submitted — it is used to rebuild the customId → placeId mapping.
 *
 * Required env vars (.env):
 *   DATABASE_URL
 *   ANTHROPIC_API_KEY
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaClient } from '@prisma/client';
import { toSlug } from '../../utils/slug.js';
import 'dotenv/config';

const prisma = new PrismaClient();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const __dirname = dirname(fileURLToPath(import.meta.url));

const MODEL = 'claude-sonnet-4-6';
const POLL_INTERVAL_MS = 15_000;

const VALID_MOODS = new Set(['adventurous','relaxing','cultural','foodie','off-the-beaten-path','romantic','family-friendly']);
const VALID_CATEGORIES = new Set(['sights-and-landmarks','nature-outdoors','food-and-drink','nightlife','shopping','arts-and-entertainment','activities-and-experiences','neighborhoods']);
const VALID_INDOOR_OUTDOOR = new Set(['INDOOR','OUTDOOR','BOTH']);
const VALID_CONFIDENCE = new Set(['HIGH','MEDIUM','LOW']);
const VALID_VISIT_DURATION = new Set(['UNDER_1_HOUR','ONE_TO_TWO_HOURS','TWO_TO_FOUR_HOURS','HALF_DAY','FULL_DAY']);

function parseAndValidate(raw) {
  let data;
  try {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
    data = JSON.parse(cleaned);
  } catch {
    throw new Error(`JSON parse failed: ${raw.slice(0, 200)}`);
  }

  if (!data.tagline || !data.description) throw new Error('Missing tagline or description');
  if (!Array.isArray(data.whyVisit) || data.whyVisit.length === 0) throw new Error('Missing whyVisit');
  if (!Array.isArray(data.localTips) || data.localTips.length === 0) throw new Error('Missing localTips');
  if (!VALID_INDOOR_OUTDOOR.has(data.indoorOutdoor)) throw new Error(`Invalid indoorOutdoor: ${data.indoorOutdoor}`);
  if (typeof data.bookingRequired !== 'boolean') throw new Error(`bookingRequired must be boolean`);
  if (typeof data.weatherDependent !== 'boolean') throw new Error(`weatherDependent must be boolean`);
  if (!VALID_VISIT_DURATION.has(data.visitDuration)) throw new Error(`Invalid visitDuration: ${data.visitDuration}`);

  for (const key of ['taglineConfidence','descriptionConfidence','whyVisitConfidence','visitDurationConfidence','bookingRequiredConfidence','localTipsConfidence','indoorOutdoorConfidence','weatherDependentConfidence','moodsConfidence']) {
    if (data[key] != null && !VALID_CONFIDENCE.has(data[key])) throw new Error(`Invalid ${key}: ${data[key]}`);
  }

  data.moods = (data.moods ?? []).filter(s => VALID_MOODS.has(s));
  data.categories = (data.categories ?? []).filter(s => VALID_CATEGORIES.has(s));
  if (data.categories.length === 0) throw new Error('No valid categories after filtering');

  return data;
}

async function writeToDb(placeId, data, moodMap, categoryMap) {
  const moodIds     = data.moods.map(s => moodMap[s]).filter(Boolean);
  const categoryIds = data.categories.map(s => categoryMap[s]).filter(Boolean);

  await prisma.$transaction(async tx => {
    await tx.placeAiGenData.upsert({
      where:  { placeId },
      update: {
        tagline:                        data.tagline,
        taglineConfidence:              data.taglineConfidence              ?? null,
        description:                    data.description,
        descriptionConfidence:          data.descriptionConfidence          ?? null,
        whyVisit:                       data.whyVisit                       ?? [],
        whyVisitConfidence:             data.whyVisitConfidence             ?? null,
        neighbourhood:                  data.neighbourhood                  ?? null,
        neighbourhoodConfidence:        data.neighbourhoodConfidence        ?? null,
        visitDuration:                  data.visitDuration,
        visitDurationConfidence:        data.visitDurationConfidence        ?? null,
        bookingRequired:                data.bookingRequired,
        bookingRequiredConfidence:      data.bookingRequiredConfidence      ?? null,
        bookInAdvanceWarning:           data.bookInAdvanceWarning           ?? null,
        bookInAdvanceWarningConfidence: data.bookInAdvanceWarningConfidence ?? null,
        dressCode:                      data.dressCode                      ?? null,
        dressCodeConfidence:            data.dressCodeConfidence            ?? null,
        localTips:                      data.localTips                      ?? [],
        localTipsConfidence:            data.localTipsConfidence            ?? null,
        whatToBring:                    data.whatToBring                    ?? [],
        whatToBringConfidence:          data.whatToBringConfidence          ?? null,
        indoorOutdoor:                  data.indoorOutdoor,
        indoorOutdoorConfidence:        data.indoorOutdoorConfidence        ?? null,
        weatherDependent:               data.weatherDependent,
        weatherDependentConfidence:     data.weatherDependentConfidence     ?? null,
        moodsConfidence:                data.moodsConfidence                ?? null,
        generatedAt:                    new Date(),
        modelVersion:                   MODEL,
      },
      create: {
        placeId,
        tagline:                        data.tagline,
        taglineConfidence:              data.taglineConfidence              ?? null,
        description:                    data.description,
        descriptionConfidence:          data.descriptionConfidence          ?? null,
        whyVisit:                       data.whyVisit                       ?? [],
        whyVisitConfidence:             data.whyVisitConfidence             ?? null,
        neighbourhood:                  data.neighbourhood                  ?? null,
        neighbourhoodConfidence:        data.neighbourhoodConfidence        ?? null,
        visitDuration:                  data.visitDuration,
        visitDurationConfidence:        data.visitDurationConfidence        ?? null,
        bookingRequired:                data.bookingRequired,
        bookingRequiredConfidence:      data.bookingRequiredConfidence      ?? null,
        bookInAdvanceWarning:           data.bookInAdvanceWarning           ?? null,
        bookInAdvanceWarningConfidence: data.bookInAdvanceWarningConfidence ?? null,
        dressCode:                      data.dressCode                      ?? null,
        dressCodeConfidence:            data.dressCodeConfidence            ?? null,
        localTips:                      data.localTips                      ?? [],
        localTipsConfidence:            data.localTipsConfidence            ?? null,
        whatToBring:                    data.whatToBring                    ?? [],
        whatToBringConfidence:          data.whatToBringConfidence          ?? null,
        indoorOutdoor:                  data.indoorOutdoor,
        indoorOutdoorConfidence:        data.indoorOutdoorConfidence        ?? null,
        weatherDependent:               data.weatherDependent,
        weatherDependentConfidence:     data.weatherDependentConfidence     ?? null,
        moodsConfidence:                data.moodsConfidence                ?? null,
        generatedAt:                    new Date(),
        modelVersion:                   MODEL,
      },
    });

    await tx.seasonalTipAiGen.deleteMany({ where: { placeId } });
    if (Array.isArray(data.seasonalTips) && data.seasonalTips.length > 0) {
      await tx.seasonalTipAiGen.createMany({
        data: data.seasonalTips.map(tip => ({
          placeId,
          label:  tip.label,
          reason: tip.reason,
          avoid:  tip.avoid ?? false,
        })),
      });
    }

    await tx.placeMood.deleteMany({ where: { placeId } });
    if (moodIds.length > 0) {
      await tx.placeMood.createMany({ data: moodIds.map(moodId => ({ placeId, moodId })) });
    }

    await tx.placeCategory.deleteMany({ where: { placeId } });
    if (categoryIds.length > 0) {
      await tx.placeCategory.createMany({ data: categoryIds.map(categoryId => ({ placeId, categoryId })) });
    }
  });
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  const batchId = process.argv[2];
  if (!batchId) {
    console.error('Usage: node process-batch-results.js <batchId>');
    process.exit(1);
  }

  if (!process.env.ANTHROPIC_API_KEY) throw new Error('Missing ANTHROPIC_API_KEY in .env');

  // Rebuild requestMeta from input file
  const inputPath = join(__dirname, 'places-to-generate.json');
  const input = JSON.parse(readFileSync(inputPath, 'utf-8'));

  const [allMoods, allCategories] = await Promise.all([
    prisma.mood.findMany({ select: { id: true, slug: true } }),
    prisma.category.findMany({ select: { id: true, slug: true } }),
  ]);
  const moodMap     = Object.fromEntries(allMoods.map(m => [m.slug, m.id]));
  const categoryMap = Object.fromEntries(allCategories.map(c => [c.slug, c.id]));

  console.log(`Building requestMeta from ${input.length} entries...`);
  const requestMeta = {};

  for (const { name, destination: destName } of input) {
    if (!name || !destName) continue;
    const slug     = toSlug(name);
    const destSlug = toSlug(destName);
    const customId = `${destSlug}--${slug}`;

    try {
      const dest = await prisma.destination.findUnique({
        where:  { slug: destSlug },
        select: { id: true, name: true },
      });
      if (!dest) continue;

      const place = await prisma.place.findUnique({
        where:  { destinationId_slug: { destinationId: dest.id, slug } },
        select: { id: true },
      });
      if (!place) continue;

      requestMeta[customId] = { placeId: place.id, name, destName };
    } catch {
      // skip
    }
  }

  console.log(`Mapped ${Object.keys(requestMeta).length} entries.\n`);

  // Poll until batch completes
  let batch = await anthropic.beta.messages.batches.retrieve(batchId);
  console.log(`Batch ${batchId} — status: ${batch.processing_status}`);
  console.log('Polling for completion...\n');

  while (batch.processing_status !== 'ended') {
    await sleep(POLL_INTERVAL_MS);
    batch = await anthropic.beta.messages.batches.retrieve(batchId);
    const { processing, succeeded, errored, canceled, expired } = batch.request_counts;
    console.log(`  [${batch.processing_status}] processing=${processing} succeeded=${succeeded} errored=${errored} canceled=${canceled} expired=${expired}`);
  }

  console.log('\nBatch complete. Processing results...\n');

  let generated = 0, failed = 0, unknown = 0;

  for await (const result of await anthropic.beta.messages.batches.results(batchId)) {
    const meta = requestMeta[result.custom_id];
    const label = meta ? `${meta.name} (${meta.destName})` : result.custom_id;

    if (result.result.type !== 'succeeded') {
      console.error(`  ✗ ${label}: batch result type="${result.result.type}"`);
      failed++;
      continue;
    }

    if (!meta) {
      console.warn(`  [unknown] custom_id not in requestMeta: ${result.custom_id}`);
      unknown++;
      continue;
    }

    try {
      const raw  = result.result.message.content[0].text.trim();
      const data = parseAndValidate(raw);
      await writeToDb(meta.placeId, data, moodMap, categoryMap);
      console.log(`  ✓ ${label} — ${data.categories.join(', ')}`);
      generated++;
    } catch (err) {
      console.error(`  ✗ ${label}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone. generated=${generated} failed=${failed} unknown=${unknown}`);
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
