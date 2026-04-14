/**
 * load-images.js
 *
 * Reads prisma/data/destination-images.json and populates the Image and
 * DestinationImage tables. Safe to re-run — skips destinations that already
 * have images.
 *
 * Usage:
 *   node lib/scripts/load-images.js
 *   node lib/scripts/load-images.js --dry-run
 *   node lib/scripts/load-images.js --slug tokyo
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const prisma = new PrismaClient();
const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, '../../prisma/data/destination-images.json');

const args = process.argv.slice(2);
const DRY_RUN   = args.includes('--dry-run');
const slugIndex = args.indexOf('--slug');
const ONLY_SLUG = slugIndex !== -1 ? args[slugIndex + 1] : null;

async function main() {
  if (DRY_RUN) console.log('--- DRY RUN: no database writes ---\n');

  const data = JSON.parse(readFileSync(DATA_PATH, 'utf-8'));
  const slugs = ONLY_SLUG ? [ONLY_SLUG] : Object.keys(data);

  let loaded = 0, skipped = 0, missing = 0;

  for (const slug of slugs) {
    const entry = data[slug];
    if (!entry) {
      console.log(`  [warn] "${slug}" not found in JSON`);
      missing++;
      continue;
    }

    const destination = await prisma.destination.findUnique({
      where: { slug },
      include: { images: { take: 1 } },
    });

    if (!destination) {
      console.log(`  [warn] destination "${slug}" not in database — run db:seed first`);
      missing++;
      continue;
    }

    if (destination.images.length > 0) {
      console.log(`  [skip] ${slug} — already has images`);
      skipped++;
      continue;
    }

    console.log(`  [load] ${slug} — ${entry.images.length} images`);

    if (!DRY_RUN) {
      for (const img of entry.images) {
        const image = await prisma.image.create({
          data: {
            url:            img.url,
            altText:        img.altText,
            photographer:   img.photographer,
            photographerUrl: img.photographerUrl,
            sourceUrl:      img.sourceUrl,
          },
        });

        await prisma.destinationImage.create({
          data: {
            destinationId: destination.id,
            imageId:       image.id,
            isCover:       img.isCover,
            position:      img.position,
          },
        });
      }

      await prisma.destination.update({
        where: { id: destination.id },
        data:  { coverImageUrl: entry.coverImageUrl },
      });
    }

    loaded++;
  }

  console.log(`\nDone. loaded=${loaded} skipped=${skipped} missing=${missing}`);
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
