/**
 * cleanup-duplicate-destinations.js
 *
 * Deletes the stale duplicate destination rows (slugs ending in -2) that were
 * created before seed.js deduplication was fixed. Cascades to DestinationImage.
 *
 * Usage:
 *   node lib/scripts/cleanup-duplicate-destinations.js --dry-run
 *   node lib/scripts/cleanup-duplicate-destinations.js
 */

import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

const DUPLICATE_SLUGS = [
  'bogota-2',
  'havana-2',
  'lisbon-2',
  'mexico-city-2',
  'tbilisi-2',
];

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  if (DRY_RUN) console.log('--- DRY RUN: no deletions ---\n');

  const destinations = await prisma.destination.findMany({
    where: { slug: { in: DUPLICATE_SLUGS } },
    include: { _count: { select: { places: true, images: true } } },
  });

  if (destinations.length === 0) {
    console.log('No duplicate destinations found — already clean.');
    return;
  }

  console.log(`Found ${destinations.length} duplicate destination(s):\n`);
  for (const d of destinations) {
    console.log(`  ${d.name} (${d.slug}) — ${d._count.places} places, ${d._count.images} images`);
  }

  if (destinations.some(d => d._count.places > 0)) {
    console.log('\n⚠ One or more duplicates have linked places. Aborting — resolve manually first.');
    process.exit(1);
  }

  if (!DRY_RUN) {
    const result = await prisma.destination.deleteMany({
      where: { slug: { in: DUPLICATE_SLUGS } },
    });
    console.log(`\nDeleted ${result.count} destination(s) (images cascaded).`);
  } else {
    console.log('\n[dry] Would delete the above destinations and their images.');
  }
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
