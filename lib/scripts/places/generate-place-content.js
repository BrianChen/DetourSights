/**
 * generate-place-content.js
 *
 * Generates AI editorial content for places using Claude's Batch API (50% cheaper
 * than synchronous calls) and writes results to the database.
 *
 * Flow:
 *   1. Look up each entry's destination by slug and place by composite key (destinationId, placeSlug)
 *   2. Build prompts and submit all requests as a single batch
 *   3. Poll until the batch completes (up to 24 hours; typically a few minutes)
 *   4. Parse each result and write to PlaceAiGenData, SeasonalTipAiGen,
 *      PlaceMood, and PlaceCategory in a single transaction per place
 *
 * Usage:
 *   node lib/scripts/places/generate-place-content.js
 *   node lib/scripts/places/generate-place-content.js --dry-run   # no API calls, no DB writes
 *
 * Input: lib/scripts/places/places-to-generate.json
 *   [{ "name": "Eiffel Tower", "destination": "Paris" }]
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

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const MODEL          = 'claude-sonnet-4-6';
const POLL_INTERVAL_MS = 10_000;

// ─── Prompt ───────────────────────────────────────────────────────────────────

function buildPrompt({ name, destinationName, country, address, placeLat, placeLng, destLat, destLng, reservable, openingHours }) {
  const usePlaceCoords = placeLat != null && placeLng != null;
  const lat = usePlaceCoords ? placeLat : destLat;
  const lng = usePlaceCoords ? placeLng : destLng;
  const coordsLabel = usePlaceCoords ? 'Place coordinates' : 'Destination coordinates (place coordinates unavailable)';

  const lines = [
    address                               ? `Address: ${address}`                                            : null,
    lat != null && lng != null            ? `${coordsLabel}: ${lat}, ${lng}`                                 : null,
    reservable != null                    ? `Reservable (from Google Places): ${reservable}`                 : null,
    openingHours?.weekdayDescriptions?.length
      ? `Opening hours (from Google Places, may be inaccurate — use as a guide only):\n${openingHours.weekdayDescriptions.map(l => `  ${l}`).join('\n')}` : null,
  ].filter(Boolean).join('\n');

  return `You are a professional travel writer with deep knowledge of the places you cover. Your writing is warm, specific, and opinionated — authoritative but never stuffy. You write like someone who genuinely loves travel and wants the reader to have a great experience, not like someone filing copy for a guidebook. You mention real details, real names, real context.

Before generating any content, take a moment to recall everything you know about this place — its history, reputation, what makes it distinctive, common visitor experiences, and any notable details or local knowledge. Use that research to inform every field you generate. Specific, accurate details are always better than generic observations.

If you are uncertain about a specific detail, reflect that with a lower confidence level rather than inventing specifics.

Generate content for the following place and return it as valid JSON with no markdown formatting or code fences.

Place: ${name}
Destination: ${destinationName}, ${country}
${lines}

Available category slugs (select one or more that apply):
  sights-and-landmarks, nature-outdoors, food-and-drink, nightlife,
  shopping, arts-and-entertainment, activities-and-experiences, neighborhoods

Available mood slugs (use only these): adventurous, relaxing, cultural,
foodie, off-the-beaten-path, romantic, family-friendly

Available indoorOutdoor values: INDOOR, OUTDOOR, BOTH

Available visitDuration values: UNDER_1_HOUR, ONE_TO_TWO_HOURS, TWO_TO_FOUR_HOURS, HALF_DAY, FULL_DAY

Confidence guidance — use this for every *Confidence field:
  HIGH   — well-known place with abundant reliable information; you are certain this is accurate
  MEDIUM — reasonable confidence but some details may be imprecise or based on limited information
  LOW    — limited knowledge of this specific place; content may be generic or uncertain

Return this exact JSON structure:
{
  "tagline": "string — 1 punchy sentence under 15 words. Lead with what makes this place distinctive. No superlatives, no rhetorical questions.",
  "taglineConfidence": "HIGH | MEDIUM | LOW",
  "description": "string — 2-3 paragraphs separated by \\n\\n. Para 1: what it is and why it matters — write for someone who knows nothing about it, no obscure references or comparisons. Para 2: the experience — what you actually do and see there. Para 3: practical context and insider angle.",
  "descriptionConfidence": "HIGH | MEDIUM | LOW",
  "whyVisit": ["string", "string", "string"],
  "whyVisitConfidence": "HIGH | MEDIUM | LOW",
  "neighbourhood": "string — the specific neighbourhood or district within the city where this place is located.",
  "neighbourhoodConfidence": "HIGH | MEDIUM | LOW",
  "seasonalTips": [{ "label": "string", "reason": "string", "avoid": boolean }] or null,
  "visitDuration": "exactly one of: UNDER_1_HOUR, ONE_TO_TWO_HOURS, TWO_TO_FOUR_HOURS, HALF_DAY, FULL_DAY",
  "visitDurationConfidence": "HIGH | MEDIUM | LOW",
  "bookingRequired": boolean — whether booking is practically necessary to visit. Note: the reservable flag above indicates the venue accepts reservations, but that does not mean booking is required. Use your own knowledge — reservable can be inaccurate or null. Set true only if failing to book ahead would meaningfully affect the visit (e.g. sold out, long queues, timed entry).,
  "bookingRequiredConfidence": "HIGH | MEDIUM | LOW",
  "bookInAdvanceWarning": "string or null — must be null if bookingRequired is false. Only set when bookingRequired is true. Keep to 1 sentence, 150 characters max. Do not include website names, domain names, or URLs — if referring to the official booking channel, just say 'the official website'.",
  "bookInAdvanceWarningConfidence": "HIGH | MEDIUM | LOW",
  "dressCode": "string or null — only set if there is a strict or notable dress code (e.g. religious sites, formal restaurants). Default to null.",
  "dressCodeConfidence": "HIGH | MEDIUM | LOW",
  "localTips": ["string", "string", "string", "string"],
  "localTipsConfidence": "HIGH | MEDIUM | LOW",
  "whatToBring": ["string"] or null,
  "whatToBringConfidence": "HIGH | MEDIUM | LOW",
  "indoorOutdoor": "INDOOR | OUTDOOR | BOTH",
  "indoorOutdoorConfidence": "HIGH | MEDIUM | LOW",
  "weatherDependent": boolean,
  "weatherDependentConfidence": "HIGH | MEDIUM | LOW",
  "moods": ["slug1", "slug2"],
  "moodsConfidence": "HIGH | MEDIUM | LOW",
  "categories": ["slug1", "slug2"]
}

Field instructions:
  whyVisit       — 3 punchy reasons to visit. Specific but accessible — avoid references that only make sense to people who already know the place well.
  neighbourhood  — the specific neighbourhood or district within the city where this place is located.
  visitDuration  — pick the single best fit: UNDER_1_HOUR (<1 hr), ONE_TO_TWO_HOURS (1–2 hrs), TWO_TO_FOUR_HOURS (2–4 hrs), HALF_DAY (~3–5 hrs), FULL_DAY (5+ hrs). Use the typical/recommended visit length, not the maximum possible.
  seasonalTips   — null for indoor venues (bars, restaurants, shops, museums) where seasons don't meaningfully change the experience. Only set when timing genuinely affects the visit (weather, crowds, events, closures). Each tip: label (month, season, or time of day), reason (why it matters), avoid (false = best time, true = time to avoid).
  localTips      — 4 tips drawing on well-known local knowledge and popular visitor tips specific to this place.
  whatToBring    — null for restaurants, bars, shops, smaller venues, and indoor landmarks. Only set for larger attractions, parks, outdoor experiences, and activities where preparation matters.
  moods          — only include moods that genuinely apply. Every mood listed should have a clear reason.
  categories     — select one or more from the available category slugs above. Every category listed should clearly apply to this place.`;
}

// ─── Validation ───────────────────────────────────────────────────────────────

const VALID_CONFIDENCE       = new Set(['HIGH', 'MEDIUM', 'LOW']);
const VALID_INDOOR_OUTDOOR   = new Set(['INDOOR', 'OUTDOOR', 'BOTH']);
const VALID_VISIT_DURATION   = new Set(['UNDER_1_HOUR', 'ONE_TO_TWO_HOURS', 'TWO_TO_FOUR_HOURS', 'HALF_DAY', 'FULL_DAY']);
const VALID_MOOD_SLUGS     = new Set(['adventurous', 'relaxing', 'cultural', 'foodie', 'off-the-beaten-path', 'romantic', 'family-friendly']);
const VALID_CATEGORY_SLUGS = new Set(['sights-and-landmarks', 'nature-outdoors', 'food-and-drink', 'nightlife', 'shopping', 'arts-and-entertainment', 'activities-and-experiences', 'neighborhoods']);

function validateConfidence(val, field) {
  if (val != null && !VALID_CONFIDENCE.has(val)) throw new Error(`Invalid confidence for ${field}: ${val}`);
}

function parseAndValidate(raw) {
  const d = JSON.parse(raw);

  if (!d.tagline)                                              throw new Error('Missing tagline');
  if (!d.description)                                         throw new Error('Missing description');
  if (!Array.isArray(d.whyVisit)  || d.whyVisit.length  < 1) throw new Error('Missing whyVisit');
  if (!Array.isArray(d.localTips) || d.localTips.length < 1) throw new Error('Missing localTips');
  if (!VALID_INDOOR_OUTDOOR.has(d.indoorOutdoor))             throw new Error(`Invalid indoorOutdoor: ${d.indoorOutdoor}`);
  if (!VALID_VISIT_DURATION.has(d.visitDuration))             throw new Error(`Invalid visitDuration: ${d.visitDuration}`);
  if (typeof d.bookingRequired  !== 'boolean')                throw new Error('bookingRequired must be boolean');
  if (typeof d.weatherDependent !== 'boolean')                throw new Error('weatherDependent must be boolean');
  if (!d.bookingRequired && d.bookInAdvanceWarning != null)   d.bookInAdvanceWarning = null;

  for (const field of ['taglineConfidence', 'descriptionConfidence', 'whyVisitConfidence', 'neighbourhoodConfidence', 'visitDurationConfidence', 'bookingRequiredConfidence', 'bookInAdvanceWarningConfidence', 'dressCodeConfidence', 'localTipsConfidence', 'whatToBringConfidence', 'indoorOutdoorConfidence', 'weatherDependentConfidence', 'moodsConfidence']) {
    validateConfidence(d[field], field);
  }

  const moods      = Array.isArray(d.moods)      ? d.moods.filter(s      => VALID_MOOD_SLUGS.has(s))     : [];
  const categories = Array.isArray(d.categories) ? d.categories.filter(s => VALID_CATEGORY_SLUGS.has(s)) : [];
  if (categories.length === 0) throw new Error('No valid categories returned');

  return { ...d, moods, categories };
}

// ─── DB write ─────────────────────────────────────────────────────────────────

async function writeToDb(placeId, data, moodMap, categoryMap) {
  const moodIds     = data.moods.map(slug      => moodMap[slug]).filter(Boolean);
  const categoryIds = data.categories.map(slug => categoryMap[slug]).filter(Boolean);

  await prisma.$transaction(async (tx) => {
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

// ─── Sleep ────────────────────────────────────────────────────────────────────

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.ANTHROPIC_API_KEY && !DRY_RUN) throw new Error('Missing ANTHROPIC_API_KEY in .env');
  if (DRY_RUN) console.log('--- DRY RUN: no API calls, no DB writes ---\n');

  const inputPath = join(__dirname, 'places-to-generate.json');
  const input = JSON.parse(readFileSync(inputPath, 'utf-8'));

  if (!Array.isArray(input) || input.length === 0) {
    console.log('No entries in places-to-generate.json.');
    return;
  }

  console.log(`Processing ${input.length} place(s)...\n`);

  const [allMoods, allCategories] = await Promise.all([
    prisma.mood.findMany({ select: { id: true, slug: true } }),
    prisma.category.findMany({ select: { id: true, slug: true } }),
  ]);
  const moodMap     = Object.fromEntries(allMoods.map(m     => [m.slug, m.id]));
  const categoryMap = Object.fromEntries(allCategories.map(c => [c.slug, c.id]));

  // ── Phase 1: DB lookups + build batch requests ─────────────────────────────

  const batchRequests = [];
  // Maps custom_id → { placeId, name, destName } for result processing
  const requestMeta = {};
  let skipped = 0;

  for (let i = 0; i < input.length; i++) {
    const { name, destination: destName } = input[i];

    if (!name || !destName) {
      console.warn(`  [skip] Entry ${i + 1} missing name or destination`);
      skipped++;
      continue;
    }

    const slug = toSlug(name);
    const destSlug = toSlug(destName);
    const customId = `${destSlug}--${slug}`;

    try {
      const dest = await prisma.destination.findUnique({
        where:  { slug: destSlug },
        select: { id: true, name: true, country: true, latitude: true, longitude: true },
      });
      if (!dest) throw new Error(`Destination not found: "${destName}" (slug: "${destSlug}")`);

      const place = await prisma.place.findUnique({
        where:  { destinationId_slug: { destinationId: dest.id, slug } },
        select: { id: true, address: true, latitude: true, longitude: true, reservable: true, openingHours: true },
      });
      if (!place) throw new Error(`Place not found in DB (slug: "${slug}" in "${dest.name}") — run add-places.js first`);

      const prompt = buildPrompt({
        name,
        destinationName: dest.name,
        country:         dest.country,
        address:         place.address,
        placeLat:        place.latitude,
        placeLng:        place.longitude,
        destLat:         dest.latitude,
        destLng:         dest.longitude,
        reservable:      place.reservable,
        openingHours:    place.openingHours,
      });

      batchRequests.push({
        custom_id: customId,
        params: {
          model:      MODEL,
          max_tokens: 2048,
          messages:   [{ role: 'user', content: prompt }],
        },
      });

      requestMeta[customId] = { placeId: place.id, name, destName };
      console.log(`  [ready] ${name} (${destName})`);
    } catch (err) {
      console.error(`  [skip] ${name} (${destName}): ${err.message}`);
      skipped++;
    }
  }

  if (batchRequests.length === 0) {
    console.log('\nNo requests to submit.');
    return;
  }

  if (DRY_RUN) {
    console.log(`\n[dry] Would submit ${batchRequests.length} request(s) to Batch API. skipped=${skipped}`);
    return;
  }

  // ── Phase 2: Submit batch ──────────────────────────────────────────────────

  console.log(`\nSubmitting batch of ${batchRequests.length} request(s)...`);
  let batch = await anthropic.beta.messages.batches.create({ requests: batchRequests });
  console.log(`Batch submitted: ${batch.id}`);
  console.log('Polling for completion (this typically takes a few minutes)...\n');

  // ── Phase 3: Poll until complete ───────────────────────────────────────────

  while (batch.processing_status !== 'ended') {
    await sleep(POLL_INTERVAL_MS);
    batch = await anthropic.beta.messages.batches.retrieve(batch.id);
    const { succeeded, errored, canceled, expired } = batch.request_counts;
    console.log(`  [${batch.processing_status}] succeeded=${succeeded} errored=${errored} canceled=${canceled} expired=${expired}`);
  }

  console.log('\nBatch complete. Processing results...\n');

  // ── Phase 4: Parse results + write to DB ───────────────────────────────────

  let generated = 0, failed = 0;

  for await (const result of await anthropic.beta.messages.batches.results(batch.id)) {
    const meta = requestMeta[result.custom_id];
    const label = meta ? `${meta.name} (${meta.destName})` : result.custom_id;

    if (result.result.type !== 'succeeded') {
      console.error(`  ✗ ${label}: batch result type="${result.result.type}"`);
      failed++;
      continue;
    }

    try {
      const raw  = result.result.message.content[0].text.trim();
      const data = parseAndValidate(raw);
      console.log(`  [claude] ✓ ${label}`);
      console.log(`           tagline:    "${data.tagline}"`);
      console.log(`           categories: ${data.categories.join(', ')}`);
      console.log(`           moods:      ${data.moods.join(', ')}`);

      await writeToDb(meta.placeId, data, moodMap, categoryMap);
      console.log('           [db] ✓ written\n');
      generated++;
    } catch (err) {
      console.error(`  ✗ ${label}: ${err.message}\n`);
      failed++;
    }
  }

  console.log(`Done. generated=${generated} skipped=${skipped} failed=${failed}`);
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
