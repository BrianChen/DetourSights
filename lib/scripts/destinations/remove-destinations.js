/**
 * remove-destinations.js
 *
 * Removes destinations (and all their places) from the database and Cloudinary.
 * Edit SLUGS_TO_REMOVE before each run.
 *
 * Usage:
 *   node lib/scripts/destinations/remove-destinations.js --dry-run
 *   node lib/scripts/destinations/remove-destinations.js
 *
 * Required env vars (.env):
 *   DATABASE_URL
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 *
 */

import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import 'dotenv/config';

// ─── Edit this list before each run ──────────────────────────────────────────

const SLUGS_TO_REMOVE = [
  'beirut',
];

// ─────────────────────────────────────────────────────────────────────────────

const prisma = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

async function deleteCloudinaryFolder(prefix) {
  try {
    const result = await cloudinary.api.delete_resources_by_prefix(prefix);
    const deleted = Object.keys(result.deleted ?? {}).length;
    console.log(`  Cloudinary: deleted ${deleted} asset(s) under ${prefix}`);
  } catch (err) {
    if (err?.error?.http_code === 404) {
      console.log(`  Cloudinary: no assets found under ${prefix} (skipped)`);
    } else {
      throw err;
    }
  }

  try {
    await cloudinary.api.delete_folder(prefix);
    console.log(`  Cloudinary: deleted folder ${prefix}`);
  } catch (err) {
    if (err?.error?.message?.includes("Can't find folder")) {
      // Folder never existed — not an error
    } else {
      throw err;
    }
  }
}

async function removeDestination(slug) {
  console.log(`\n── ${slug} ──`);

  const destination = await prisma.destination.findUnique({
    where: { slug },
    include: { places: { select: { id: true, slug: true, name: true } } },
  });

  if (!destination) {
    console.log(`  Not found in DB — skipping`);
    return;
  }

  const placeIds = destination.places.map((p) => p.id);
  const placeSlugs = destination.places.map((p) => p.slug);

  console.log(`  Destination: ${destination.name} (${destination.country})`);
  console.log(`  Places (${placeIds.length}): ${destination.places.map((p) => p.name).join(', ') || 'none'}`);

  if (DRY_RUN) return;

  // 1. Delete place children that don't cascade
  if (placeIds.length > 0) {
    await prisma.placeCategory.deleteMany({ where: { placeId: { in: placeIds } } });
    await prisma.placeMood.deleteMany({ where: { placeId: { in: placeIds } } });
    await prisma.review.deleteMany({ where: { placeId: { in: placeIds } } });
    await prisma.photo.deleteMany({ where: { placeId: { in: placeIds } } });
    // Place.deleteMany cascades: PlaceAiGenData, FeaturedPlace, SeasonalTipAiGen (place-level)
    await prisma.place.deleteMany({ where: { id: { in: placeIds } } });
    console.log(`  DB: deleted ${placeIds.length} place(s) and their children`);
  }

  // 2. Delete destination — cascades: DestinationImage+Image, FeaturedDestination, SeasonalTipAiGen (dest-level)
  await prisma.destination.delete({ where: { slug } });
  console.log(`  DB: deleted destination`);

  // 3. Cloudinary — destination folder
  await deleteCloudinaryFolder(`DetourSights/destinations/${slug}`);

  // 4. Cloudinary — each place folder
  for (const placeSlug of placeSlugs) {
    await deleteCloudinaryFolder(`DetourSights/places/${placeSlug}`);
  }

  console.log(`  ✓ Done`);
}

async function main() {
  if (SLUGS_TO_REMOVE.length === 0) {
    console.error('SLUGS_TO_REMOVE is empty. Edit the list at the top of this script.');
    process.exit(1);
  }

  if (DRY_RUN) {
    console.log('─── DRY RUN — no changes will be made ───\n');
  } else {
    console.log(`Removing ${SLUGS_TO_REMOVE.length} destination(s)...\n`);
  }

  for (const slug of SLUGS_TO_REMOVE) {
    await removeDestination(slug);
  }

  if (DRY_RUN) {
    console.log('\n─── Dry run complete. Run without --dry-run to apply. ───');
  } else {
    console.log('\n─── Done. ───');
  }
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
