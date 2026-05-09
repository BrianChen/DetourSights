/**
 * add-places.js
 *
 * Adds new places to the database and seed file. For each entry it:
 *   1. Derives a URL-safe slug from the name
 *   2. Updates existing place with API data if slug already exists, creates new if not
 *   3. Looks up the destination by name to get its ID and location bias
 *   4. Calls Google Places Text Search API → address, lat/lng, phone, website, priceLevel,
 *      openingHours, reservable, accessibilityOptions
 *   5. Maps Google priceLevel → our enum (FREE / BUDGET / MODERATE / EXPENSIVE / VERY_EXPENSIVE)
 *   6. Writes the Place row to the database
 *   7. Appends the entry to prisma/seed.js and updates the count comment
 *
 * Usage:
 *   node lib/scripts/places/add-places.js
 *   node lib/scripts/places/add-places.js --dry-run   # log only, no DB writes
 *
 * Input: lib/scripts/places/places-to-add.json
 *   [{ "name": "The High Line", "destination": "New York" }]
 *
 * Required env vars (.env):
 *   DATABASE_URL
 *   GOOGLE_MAPS_API_KEY
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Slug ─────────────────────────────────────────────────────────────────────

/**
 * Converts a place name to a URL-safe slug.
 * Examples: "The High Line" → "the-high-line", "Café du Monde" → "cafe-du-monde"
 *
 * @param {string} name
 * @returns {string}
 */
function toSlug(name) {
  return name
    .toLowerCase()
    .replace(/œ/g, 'oe').replace(/æ/g, 'ae').replace(/ø/g, 'o').replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ─── Price level ──────────────────────────────────────────────────────────────

const PRICE_LEVEL_MAP = {
  PRICE_LEVEL_FREE:            'FREE',
  PRICE_LEVEL_INEXPENSIVE:     'BUDGET',
  PRICE_LEVEL_MODERATE:        'MODERATE',
  PRICE_LEVEL_EXPENSIVE:       'EXPENSIVE',
  PRICE_LEVEL_VERY_EXPENSIVE:  'VERY_EXPENSIVE',
};

// ─── Google Places ────────────────────────────────────────────────────────────

/**
 * Calls Google Places Text Search API for a place name, biased toward the
 * destination's viewport. Returns the top result's factual fields.
 *
 * @param {string} name
 * @param {string} destName
 * @param {{ latitude: number, longitude: number, viewport: object | null }} destination
 * @returns {Promise<{ address: string|null, latitude: number|null, longitude: number|null, phone: string|null, website: string|null, priceRange: string|null, openingHours: object|null, reservable: boolean|null, accessibilityOptions: object|null }>}
 */
async function searchPlace(name, destName, destination) {
  const body = { textQuery: `${name}, ${destName}` };

  if (destination.viewport) {
    body.locationBias = {
      rectangle: {
        low:  { latitude: destination.viewport.southwest.lat, longitude: destination.viewport.southwest.lng },
        high: { latitude: destination.viewport.northeast.lat, longitude: destination.viewport.northeast.lng },
      },
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  let res;
  try {
    res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask': 'places.formattedAddress,places.location,places.internationalPhoneNumber,places.websiteUri,places.priceLevel,places.regularOpeningHours,places.reservable,places.accessibilityOptions',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    throw new Error(`Google Places request failed: ${err.message}`);
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Places error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const place = data.places?.[0];
  if (!place) return null;

  // Strip live fields from opening hours before storing
  let openingHours = null;
  if (place.regularOpeningHours) {
    const { openNow, nextOpenTime, ...stable } = place.regularOpeningHours;
    openingHours = stable;
  }

  return {
    address:             place.formattedAddress ?? null,
    latitude:            place.location?.latitude ?? null,
    longitude:           place.location?.longitude ?? null,
    phone:               place.internationalPhoneNumber ?? null,
    website:             place.websiteUri ?? null,
    priceRange:          PRICE_LEVEL_MAP[place.priceLevel] ?? null,
    openingHours,
    reservable:          place.reservable ?? null,
    accessibilityOptions: place.accessibilityOptions ?? null,
  };
}

// ─── Seed file ────────────────────────────────────────────────────────────────

const SEED_PATH = join(__dirname, '../../..', 'prisma/seed.js');

/**
 * Appends a place entry to prisma/seed.js and increments the count comment.
 *
 * @param {{ name: string, slug: string, destSlug: string, address: string|null, lat: number|null, lng: number|null, price: string|null }} p
 */
function updateSeedFile(p) {
  let seed = readFileSync(SEED_PATH, 'utf-8');

  const escape = (s) => (s ? s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") : null);

  const addrPart  = p.address  ? `address: '${escape(p.address)}', `  : '';
  const latPart   = p.lat      ? `lat: ${p.lat}, `                    : '';
  const lngPart   = p.lng      ? `lng: ${p.lng}, `                    : '';
  const pricePart = p.price    ? `price: '${p.price}'`                : '';

  const entry =
    `    { name: '${escape(p.name)}', slug: '${p.slug}', dest: '${p.destSlug}', cats: [], ` +
    `${addrPart}${latPart}${lngPart}${pricePart} },\n`;

  // Insert before the closing ]; of placesData (identified by the for-loop that follows)
  seed = seed.replace(
    /^  \];\n\n  for \(const p of placesData\)/m,
    `${entry}  ];\n\n  for (const p of placesData)`,
  );

  // Increment the count in the header comment
  seed = seed.replace(
    /\/\/ ─── Places \((\d+)\)/,
    (_, n) => `// ─── Places (${parseInt(n) + 1})`,
  );

  writeFileSync(SEED_PATH, seed, 'utf-8');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.GOOGLE_MAPS_API_KEY) throw new Error('Missing GOOGLE_MAPS_API_KEY in .env');
  if (DRY_RUN) console.log('--- DRY RUN: no database writes ---\n');

  const inputPath = join(__dirname, 'places-to-add.json');
  const input = JSON.parse(readFileSync(inputPath, 'utf-8'));

  if (!Array.isArray(input) || input.length === 0) {
    console.log('No places found in places-to-add.json.');
    return;
  }

  console.log(`Processing ${input.length} place(s)...\n`);

  let added = 0, updated = 0, skipped = 0, failed = 0;

  for (let i = 0; i < input.length; i++) {
    const { name, destination: destName } = input[i];

    if (!name || !destName) {
      console.warn(`  [skip] Entry ${i + 1} missing name or destination — skipping`);
      skipped++;
      continue;
    }

    const slug = toSlug(name);
    console.log(`  [${i + 1}/${input.length}] ${name} → slug: ${slug}`);

    const existing = await prisma.place.findUnique({ where: { slug } });
    if (existing) console.log(`    [exists] Found in DB (id: ${existing.id}) — will update with API data`);

    try {
      // ── Look up destination ────────────────────────────────────────────────
      const dest = await prisma.destination.findFirst({
        where: { name: { equals: destName, mode: 'insensitive' } },
        select: { id: true, name: true, slug: true, latitude: true, longitude: true, viewport: true },
      });

      if (!dest) throw new Error(`Destination not found: "${destName}"`);
      console.log(`    [destination] ✓ ${destName} (id: ${dest.id})`);

      // ── Google Places ─────────────────────────────────────────────────────
      console.log('    [places api] Searching...');
      const result = await searchPlace(name, dest.name, dest);

      if (!result) {
        console.warn('    [places api] ⚠ No result found — skipping');
        skipped++;
        continue;
      }

      console.log(`    [places api] ✓ address:       ${result.address}`);
      console.log(`    [places api]   coords:        ${result.latitude}, ${result.longitude}`);
      console.log(`    [places api]   phone:         ${result.phone ?? '—'}`);
      console.log(`    [places api]   website:       ${result.website ?? '—'}`);
      console.log(`    [places api]   price:         ${result.priceRange ?? '—'}`);
      console.log(`    [places api]   opening hours: ${result.openingHours ? '✓' : '—'}`);
      console.log(`    [places api]   reservable:    ${result.reservable ?? '—'}`);
      console.log(`    [places api]   accessibility: ${result.accessibilityOptions ? '✓' : '—'}`);

      // ── DB write ──────────────────────────────────────────────────────────
      const apiData = {
        address:              result.address,
        latitude:             result.latitude,
        longitude:            result.longitude,
        phone:                result.phone,
        website:              result.website,
        priceRange:           result.priceRange,
        openingHours:         result.openingHours,
        reservable:           result.reservable,
        accessibilityOptions: result.accessibilityOptions,
      };

      if (!DRY_RUN) {
        const place = await prisma.place.upsert({
          where:  { slug },
          update: apiData,
          create: { name, slug, destinationId: dest.id, ...apiData },
        });

        if (existing) {
          console.log(`    [db] ✓ Updated place id: ${place.id}`);
          updated++;
        } else {
          console.log(`    [db] ✓ Created place id: ${place.id}`);
          updateSeedFile({
            name,
            slug,
            destSlug: dest.slug,
            address:  result.address,
            lat:      result.latitude,
            lng:      result.longitude,
            price:    result.priceRange,
          });
          console.log(`    [seed] ✓ Appended to prisma/seed.js`);
          added++;
        }
      } else {
        console.log(existing ? '    [db]   [dry] Would update place row' : '    [db]   [dry] Would create place row');
        if (!existing) console.log('    [seed] [dry] Would append to prisma/seed.js');
        existing ? updated++ : added++;
      }
    } catch (err) {
      console.error(`    ✗ Failed: ${err.message}\n`);
      failed++;
    }
  }

  console.log(`Done. added=${added} updated=${updated} skipped=${skipped} failed=${failed}`);
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
