/**
 * import-scribekit-results.js
 *
 * Reads a ScribeKit JSON output file and imports each result as a new Place
 * (with AI-generated content) into the database.
 *
 * Skips results where:
 *   - The destination is not found in the DB (warns)
 *   - The place already exists in the DB (silent)
 *
 * Usage:
 *   node lib/scripts/places/import-scribekit-results.js <path-to-json>
 *
 * Example:
 *   node lib/scripts/places/import-scribekit-results.js lib/scripts/places/scribe-kit-content.json
 *
 * Required env vars (.env):
 *   DATABASE_URL
 */

import { readFileSync } from 'fs';
import { PrismaClient } from '@prisma/client';
import { toSlug } from '../../utils/slug.js';
import 'dotenv/config';

const prisma = new PrismaClient();

const PRICE_LEVEL_MAP = {
  PRICE_LEVEL_FREE:           'FREE',
  PRICE_LEVEL_INEXPENSIVE:    'BUDGET',
  PRICE_LEVEL_MODERATE:       'MODERATE',
  PRICE_LEVEL_EXPENSIVE:      'EXPENSIVE',
  PRICE_LEVEL_VERY_EXPENSIVE: 'VERY_EXPENSIVE',
};

function mapPriceLevel(priceLevel) {
  return priceLevel ? (PRICE_LEVEL_MAP[priceLevel] ?? null) : null;
}

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error('Usage: node import-scribekit-results.js <path-to-json>');
    process.exit(1);
  }

  const results = JSON.parse(readFileSync(inputPath, 'utf-8'));
  console.log(`Loaded ${results.length} results from ${inputPath}\n`);

  const [allMoods, allCategories] = await Promise.all([
    prisma.mood.findMany({ select: { id: true, slug: true } }),
    prisma.category.findMany({ select: { id: true, slug: true } }),
  ]);
  const moodMap     = Object.fromEntries(allMoods.map(m => [m.slug, m.id]));
  const categoryMap = Object.fromEntries(allCategories.map(c => [c.slug, c.id]));

  let added = 0, skipped = 0, errored = 0;

  for (const result of results) {
    const label = `${result.placeName} (${result.destinationName})`;

    try {
      const destSlug    = toSlug(result.destinationName);
      const destination = await prisma.destination.findUnique({
        where:  { slug: destSlug },
        select: { id: true },
      });
      if (!destination) {
        console.warn(`  skipped: ${label} — destination not found`);
        skipped++;
        continue;
      }

      const placeSlug = toSlug(result.placeName);
      const existing  = await prisma.place.findUnique({
        where:  { destinationId_slug: { destinationId: destination.id, slug: placeSlug } },
        select: { id: true },
      });
      if (existing) {
        console.log(`  skipped: ${label} — already exists`);
        skipped++;
        continue;
      }

      const editorial   = result.editorialContent;
      const moodIds     = (editorial.moods     ?? []).map(s => moodMap[s]).filter(Boolean);
      const categoryIds = (editorial.categories ?? []).map(s => categoryMap[s]).filter(Boolean);

      await prisma.$transaction(async (tx) => {
        const place = await tx.place.create({
          data: {
            name:                 result.placeName,
            slug:                 placeSlug,
            destinationId:        destination.id,
            address:              result.address              ?? null,
            latitude:             result.latitude             ?? null,
            longitude:            result.longitude            ?? null,
            phone:                result.phone                ?? null,
            website:              result.website              ?? null,
            openingHours:         result.openingHours         ?? null,
            accessibilityOptions: result.accessibilityOptions ?? null,
            priceRange:           mapPriceLevel(result.priceLevel),
          },
          select: { id: true },
        });

        await tx.placeAiGenData.create({
          data: {
            placeId:                        place.id,
            tagline:                        editorial.tagline,
            taglineConfidence:              editorial.taglineConfidence              ?? null,
            description:                    editorial.description,
            descriptionConfidence:          editorial.descriptionConfidence          ?? null,
            whyVisit:                       editorial.whyVisit                       ?? [],
            whyVisitConfidence:             editorial.whyVisitConfidence             ?? null,
            neighbourhood:                  editorial.neighbourhood                  ?? null,
            neighbourhoodConfidence:        editorial.neighbourhoodConfidence        ?? null,
            visitDuration:                  editorial.visitDuration                  ?? null,
            visitDurationConfidence:        editorial.visitDurationConfidence        ?? null,
            bookingRequired:                editorial.bookingRequired                ?? null,
            bookingRequiredConfidence:      editorial.bookingRequiredConfidence      ?? null,
            bookInAdvanceWarning:           editorial.bookInAdvanceWarning           ?? null,
            bookInAdvanceWarningConfidence: editorial.bookInAdvanceWarningConfidence ?? null,
            dressCode:                      editorial.dressCode                      ?? null,
            dressCodeConfidence:            editorial.dressCodeConfidence            ?? null,
            localTips:                      editorial.localTips                      ?? [],
            localTipsConfidence:            editorial.localTipsConfidence            ?? null,
            whatToBring:                    editorial.whatToBring                    ?? [],
            whatToBringConfidence:          editorial.whatToBringConfidence          ?? null,
            indoorOutdoor:                  editorial.indoorOutdoor                  ?? null,
            indoorOutdoorConfidence:        editorial.indoorOutdoorConfidence        ?? null,
            weatherDependent:               editorial.weatherDependent               ?? null,
            weatherDependentConfidence:     editorial.weatherDependentConfidence     ?? null,
            moodsConfidence:                editorial.moodsConfidence                ?? null,
            generatedAt:                    new Date(result.generatedAt),
            modelVersion:                   null,
          },
        });

        if (moodIds.length > 0) {
          await tx.placeMood.createMany({
            data: moodIds.map(moodId => ({ placeId: place.id, moodId })),
          });
        }

        if (categoryIds.length > 0) {
          await tx.placeCategory.createMany({
            data: categoryIds.map(categoryId => ({ placeId: place.id, categoryId })),
          });
        }

        if (Array.isArray(editorial.seasonalTips) && editorial.seasonalTips.length > 0) {
          await tx.seasonalTipAiGen.createMany({
            data: editorial.seasonalTips.map(tip => ({
              placeId: place.id,
              label:   tip.label,
              reason:  tip.reason,
              avoid:   tip.avoid,
            })),
          });
        }
      });

      console.log(`  ✓ ${label}`);
      added++;
    } catch (err) {
      console.error(`  ✗ ${label}: ${err.message}`);
      errored++;
    }
  }

  console.log(`\nDone. added=${added} skipped=${skipped} errored=${errored}`);
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
