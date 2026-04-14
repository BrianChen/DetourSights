/**
 * get-images.js
 *
 * Fetches 10 images per destination from Unsplash, uploads them to Cloudinary,
 * and inserts Image + DestinationImage rows into the database.
 *
 * Usage:
 *   node lib/scripts/get-images.js
 *   node lib/scripts/get-images.js --dry-run      # fetch + log, no DB writes
 *   node lib/scripts/get-images.js --slug tokyo   # single destination
 *
 * Required env vars (.env):
 *   DATABASE_URL
 *   UNSPLASH_ACCESS_KEY
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 *
 * Unsplash free tier: 50 requests/hour.
 * This script fetches 1 request per destination and waits 75s between each,
 * so 92 destinations ≈ ~115 minutes and stays within the hourly limit.
 * Destinations that already have images are skipped (safe to re-run).
 */

import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import 'dotenv/config';

const prisma = new PrismaClient();

const IMAGES_PER_DESTINATION = 10;
// 75s between Unsplash searches → stays within the 50 req/hour free tier limit.
// Apply for Unsplash production access to raise this to 5,000 req/hour.
const RATE_LIMIT_MS = 75_000;

// ─── Config ──────────────────────────────────────────────────────────────────

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const args = process.argv.slice(2);
const DRY_RUN   = args.includes('--dry-run');
const slugIndex = args.indexOf('--slug');
const ONLY_SLUG = slugIndex !== -1 ? args[slugIndex + 1] : null;

// ─── Unsplash ─────────────────────────────────────────────────────────────────

/**
 * Searches Unsplash for travel photos matching a destination name.
 * Returns up to `count` results, each with url, attribution, and alt text.
 *
 * @param {string} query - Destination name (e.g. "Tokyo")
 * @param {number} count - Number of photos to return (max 30 per page)
 * @returns {Promise<Array<{ unsplashId: string, url: string, altText: string, photographer: string, photographerUrl: string, sourceUrl: string }>>}
 */
async function searchUnsplash(query, count = IMAGES_PER_DESTINATION) {
  const url = new URL('https://api.unsplash.com/search/photos');
  url.searchParams.set('query', `${query} travel`);
  url.searchParams.set('per_page', count);
  url.searchParams.set('orientation', 'landscape');
  url.searchParams.set('content_filter', 'high');

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Unsplash error ${res.status}: ${text}`);
  }

  const data = await res.json();

  return data.results.map(photo => ({
    unsplashId:     photo.id,
    // Use the regular size (1080px wide) — good balance of quality vs upload time
    url:            photo.urls.regular,
    altText:        photo.alt_description || photo.description || `${query} travel photo`,
    photographer:   photo.user.name,
    photographerUrl: `${photo.user.links.html}?utm_source=detoursights&utm_medium=referral`,
    // Required Unsplash attribution link
    sourceUrl:      `${photo.links.html}?utm_source=detoursights&utm_medium=referral`,
  }));
}

// ─── Cloudinary ───────────────────────────────────────────────────────────────

/**
 * Uploads an image URL to Cloudinary under the destinations/ folder.
 * Uses the Unsplash photo ID as the public_id to prevent duplicate uploads.
 *
 * @param {string} imageUrl - Remote image URL to upload
 * @param {string} destinationSlug - Used for folder organisation
 * @param {string} unsplashId - Used as the Cloudinary public_id
 * @returns {Promise<string>} Cloudinary secure URL
 */
async function uploadToCloudinary(imageUrl, destinationSlug, unsplashId) {
  const result = await cloudinary.uploader.upload(imageUrl, {
    folder:    `DetourSights/destinations/${destinationSlug}`,
    public_id: unsplashId,
    overwrite: false, // skip if already uploaded
    resource_type: 'image',
  });
  return result.secure_url;
}

// ─── Sleep helper ─────────────────────────────────────────────────────────────

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.UNSPLASH_ACCESS_KEY) throw new Error('Missing UNSPLASH_ACCESS_KEY in .env');
  if (!process.env.CLOUDINARY_CLOUD_NAME) throw new Error('Missing CLOUDINARY_CLOUD_NAME in .env');

  if (DRY_RUN) console.log('--- DRY RUN: no database writes ---\n');

  const where = ONLY_SLUG ? { slug: ONLY_SLUG } : {};
  const destinations = await prisma.destination.findMany({
    where,
    orderBy: { name: 'asc' },
    include: { images: { take: 1 } }, // used to skip already-processed destinations
  });

  if (destinations.length === 0) {
    console.log(ONLY_SLUG ? `No destination found with slug "${ONLY_SLUG}"` : 'No destinations found.');
    return;
  }

  console.log(`Processing ${destinations.length} destination(s)...\n`);
  let processed = 0, skipped = 0, failed = 0;

  for (const dest of destinations) {
    // Skip if already has images (safe to re-run)
    if (dest.images.length > 0) {
      console.log(`  [skip] ${dest.name} — already has images`);
      skipped++;
      continue;
    }

    console.log(`  [fetch] ${dest.name} (${dest.slug})`);

    try {
      const photos = await searchUnsplash(dest.name);

      if (photos.length === 0) {
        console.log(`    ⚠ No Unsplash results for "${dest.name}"`);
        failed++;
        await sleep(RATE_LIMIT_MS);
        continue;
      }

      console.log(`    found ${photos.length} photos`);

      if (!DRY_RUN) {
        let coverUrl = null;

        for (let i = 0; i < photos.length; i++) {
          const photo = photos[i];
          console.log(`    uploading ${i + 1}/${photos.length}: ${photo.unsplashId}`);

          const cloudinaryUrl = await uploadToCloudinary(photo.url, dest.slug, photo.unsplashId);

          // Insert into Image (shared metadata), then into DestinationImage (join).
          const image = await prisma.image.create({
            data: {
              url:            cloudinaryUrl,
              altText:        photo.altText,
              photographer:   photo.photographer,
              photographerUrl: photo.photographerUrl,
              sourceUrl:      photo.sourceUrl,
            },
          });

          await prisma.destinationImage.create({
            data: {
              destinationId: dest.id,
              imageId:       image.id,
              isCover:       i === 0, // first result becomes the cover
              position:      i,
            },
          });

          if (i === 0) coverUrl = cloudinaryUrl;
        }

        // Also set coverImageUrl on the Destination row for quick single-field access without a join
        await prisma.destination.update({
          where: { id: dest.id },
          data:  { coverImageUrl: coverUrl },
        });
      } else {
        photos.forEach((p, i) =>
          console.log(`    [dry] ${i === 0 ? '[cover] ' : ''}${p.url} — © ${p.photographer}`)
        );
      }

      console.log(`    ✓ done\n`);
      processed++;
    } catch (err) {
      console.error(`    ✗ failed: ${err.message}\n`);
      failed++;
    }

    await sleep(RATE_LIMIT_MS);
  }

  console.log(`\nDone. processed=${processed} skipped=${skipped} failed=${failed}`);
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
