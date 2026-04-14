/**
 * add-destinations.js
 *
 * Adds new destinations to the database. For each destination it:
 *   1. Generates a URL-safe slug from the name
 *   2. Skips if a destination with that slug already exists
 *   3. Generates a travel description via Google Gemini 2.5 Flash
 *   4. Geocodes the destination via Google Maps API (lat, lng, viewport, bounds)
 *   5. Writes the Destination row to the database
 *
 * After running this script, run get-images.js to fetch and upload images
 * for the newly added destinations.
 *
 * Usage:
 *   node lib/scripts/add-destinations.js
 *   node lib/scripts/add-destinations.js --dry-run   # log only, no DB writes
 *
 * Input:
 *   Edit lib/scripts/destinations-to-add.json before running:
 *   [{ "name": "Bangkok", "country": "Thailand" }, ...]
 *
 * Required env vars (.env):
 *   DATABASE_URL
 *   GEMINI_API_KEY       (from aistudio.google.com — free tier)
 *   GOOGLE_MAPS_API_KEY
 *
 * Gemini free tier: 15 requests/minute, 1,500 requests/day.
 * This script caps at 50 destinations per run and adds a 4s delay between
 * calls to stay safely under the 15 RPM limit.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

const MAX_DESTINATIONS_PER_RUN = 50;
const GEMINI_DELAY_MS = 4_000; // 4s between calls → max 15 RPM

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Slug ─────────────────────────────────────────────────────────────────────

/**
 * Converts a destination name to a URL-safe slug.
 * Strips accents, lowercases, and replaces non-alphanumeric characters with hyphens.
 * Examples: "Medellín" → "medellin", "New York" → "new-york"
 *
 * @param {string} name
 * @returns {string}
 */
function toSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')                  // decompose accents: é → e + combining accent
    .replace(/[\u0300-\u036f]/g, '')   // strip combining accent characters
    .replace(/[^a-z0-9]+/g, '-')      // non-alphanumeric runs → hyphen
    .replace(/^-|-$/g, '');            // trim leading/trailing hyphens
}

// ─── Gemini ───────────────────────────────────────────────────────────────────

/**
 * Generates a 90-150 word travel description for a destination using
 * Google Gemini 2.5 Flash (free tier, no npm dependency — plain fetch).
 *
 * @param {string} name
 * @param {string} country
 * @returns {Promise<string>}
 */
async function generateDescription(name, country) {
  const prompt = `Write a vivid travel description for ${name}, ${country}. Research what it's known for — its culture, history, landmarks, cuisine, nightlife, and unique character. Write 90-150 words in an engaging, narrative style. Use em dashes (—) for emphasis. Be specific: name actual landmarks, neighbourhoods, dishes, or experiences. No bullet points or markdown. Return only the description text, nothing else.

Match this style and length exactly:

Example 1 — Tokyo, Japan:
"Tokyo is one of the most captivating cities on earth — a seamless blend of ancient Shinto shrines and dazzling neon technology that somehow feels perfectly balanced. It is the world's largest metropolitan area, yet it runs with extraordinary precision and courtesy. Visitors fall in love with the incredible diversity of food (from Michelin-starred omakase to 500-yen ramen), the obsessive craftsmanship found in every craft and shop, and the way centuries-old neighbourhoods like Yanaka sit quietly next to hypermodern districts like Shibuya."

Example 2 — Marrakech, Morocco:
"Marrakech is a full sensory assault in the best possible way — a medieval medina of labyrinthine souks, the smell of cumin and rose water, the sound of Gnawa musicians, and the sight of snake charmers and acrobats in the vast Djemaa el-Fna square. The city's riads — traditional courtyard houses converted into boutique guesthouses — offer an extraordinary contrast to the chaos outside: cool tiles, orange trees, and rooftop terraces overlooking a sea of minarets. Morocco's red city rewards those who get lost in its alleys, bargain for leather goods in the tanneries, and stay long enough to appreciate its layers."

Now write the description for ${name}, ${country}:`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.candidates[0].content.parts[0].text.trim();
}

// ─── Geocoding ────────────────────────────────────────────────────────────────

/**
 * Geocodes a destination using the Google Maps Geocoding API.
 * Returns latitude, longitude, viewport, and bounds, or null if not found.
 *
 * @param {string} name
 * @param {string} country
 * @returns {Promise<{ latitude: number, longitude: number, viewport: object, bounds: object } | null>}
 */
async function geocode(name, country) {
  const query = encodeURIComponent(`${name}, ${country}`);
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${process.env.GOOGLE_MAPS_API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google Maps error: ${res.status}`);

  const data = await res.json();
  if (data.status !== 'OK' || !data.results?.length) return null;

  const { location, viewport, bounds } = data.results[0].geometry;
  return {
    latitude: location.lat,
    longitude: location.lng,
    viewport: viewport ?? null,
    bounds: bounds ?? null,
  };
}

// ─── Sleep ────────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.GOOGLE_MAPS_API_KEY) throw new Error('Missing GOOGLE_MAPS_API_KEY in .env');

  if (DRY_RUN) console.log('--- DRY RUN: no database writes ---\n');

  const inputPath = join(__dirname, 'destinations-to-add.json');
  const input = JSON.parse(readFileSync(inputPath, 'utf-8'));

  if (!Array.isArray(input) || input.length === 0) {
    console.log('No destinations found in destinations-to-add.json.');
    return;
  }

  if (input.length > MAX_DESTINATIONS_PER_RUN) {
    console.warn(`⚠  Input has ${input.length} destinations but limit is ${MAX_DESTINATIONS_PER_RUN} per run (Gemini daily quota).`);
    console.warn(`   Processing first ${MAX_DESTINATIONS_PER_RUN} only.\n`);
    input.splice(MAX_DESTINATIONS_PER_RUN);
  }

  console.log(`Processing ${input.length} destination(s)...\n`);

  let added = 0, skipped = 0, failed = 0, geminiCalls = 0;

  for (let i = 0; i < input.length; i++) {
    const { name, country, description: providedDescription } = input[i];

    if (!name || !country) {
      console.warn(`  [skip] Entry ${i + 1} missing name or country — skipping`);
      skipped++;
      continue;
    }

    const slug = toSlug(name);
    console.log(`  [${i + 1}/${input.length}] ${name} (${country}) → slug: ${slug}`);

    // ── Skip check ──────────────────────────────────────────────────────────
    const existing = await prisma.destination.findUnique({ where: { slug } });
    if (existing) {
      console.log(`    [skip] Already exists in DB (id: ${existing.id})\n`);
      skipped++;
      continue;
    }

    try {
      // ── Description: use provided or generate via Gemini ───────────────────
      let description;
      if (providedDescription) {
        description = providedDescription.trim();
        console.log(`    [description] ✓ Using provided description (${description.split(' ').length} words)`);
      } else {
        if (!process.env.GEMINI_API_KEY) throw new Error('Missing GEMINI_API_KEY in .env — required for destinations without a description');
        console.log('    [gemini] Generating description...');
        description = await generateDescription(name, country);
        geminiCalls++;
        console.log(`    [gemini] ✓ ${description.split(' ').length} words`);
        if (DRY_RUN) console.log(`    [gemini] Preview: "${description.slice(0, 100)}..."`);
      }

      // ── Google Maps: geocode ───────────────────────────────────────────────
      console.log('    [geocode] Fetching coordinates...');
      const coords = await geocode(name, country);
      if (coords) {
        console.log(`    [geocode] ✓ ${coords.latitude}, ${coords.longitude}`);
      } else {
        console.warn('    [geocode] ⚠ No result — destination will be saved without coordinates');
      }

      // ── DB write ───────────────────────────────────────────────────────────
      if (!DRY_RUN) {
        const dest = await prisma.destination.create({
          data: {
            name,
            country,
            slug,
            description,
            latitude: coords?.latitude ?? null,
            longitude: coords?.longitude ?? null,
            viewport: coords?.viewport ?? null,
            bounds: coords?.bounds ?? null,
          },
        });
        console.log(`    [db] ✓ Created destination id: ${dest.id}`);
      } else {
        console.log('    [db] [dry] Would create destination row');
      }

      console.log('    ✓ Done\n');
      added++;
    } catch (err) {
      console.error(`    ✗ Failed: ${err.message}\n`);
      failed++;
    }

    // Delay between destinations to respect Gemini 15 RPM limit
    if (i < input.length - 1) await sleep(GEMINI_DELAY_MS);
  }

  console.log(`\nDone. added=${added} skipped=${skipped} failed=${failed}`);
  console.log(`Gemini API calls used this run: ${geminiCalls}`);
  if (!DRY_RUN && added > 0) {
    console.log('\nNext step: run get-images.js to fetch images for the new destinations.');
  }
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
