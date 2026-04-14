/**
 * export-images.js
 *
 * Dumps all destination image data from the database into
 * prisma/data/destination-images.json. Run this once on the machine
 * that has the populated database to capture the Cloudinary URLs.
 *
 * Usage:
 *   node lib/scripts/export-images.js
 */

import { PrismaClient } from '@prisma/client';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const prisma = new PrismaClient();
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '../../prisma/data/destination-images.json');

async function main() {
  const destinations = await prisma.destination.findMany({
    where: { images: { some: {} } }, // only destinations that have images
    select: {
      slug: true,
      coverImageUrl: true,
      images: {
        orderBy: { position: 'asc' },
        select: {
          isCover: true,
          position: true,
          image: {
            select: {
              url: true,
              altText: true,
              photographer: true,
              photographerUrl: true,
              sourceUrl: true,
            },
          },
        },
      },
    },
    orderBy: { slug: 'asc' },
  });

  const output = {};
  for (const dest of destinations) {
    output[dest.slug] = {
      coverImageUrl: dest.coverImageUrl,
      images: dest.images.map(({ isCover, position, image }) => ({
        url: image.url,
        altText: image.altText,
        photographer: image.photographer,
        photographerUrl: image.photographerUrl,
        sourceUrl: image.sourceUrl,
        isCover,
        position,
      })),
    };
  }

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

  console.log(`Exported ${destinations.length} destinations to prisma/data/destination-images.json`);
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
