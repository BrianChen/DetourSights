/**
 * get-place-images.js
 *
 * Fetches 1 cover image per place from Unsplash, uploads it to Cloudinary,
 * and saves the Cloudinary URL to the coverImageUrl field on the Place row.
 *
 * Usage:
 *   node lib/scripts/images/get-place-images.js
 *   node lib/scripts/images/get-place-images.js --dry-run     # fetch + log, no DB writes
 *   node lib/scripts/images/get-place-images.js --slug eiffel-tower  # single place
 *
 * Required env vars (.env):
 *   DATABASE_URL
 *   UNSPLASH_ACCESS_KEY
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 *
 * Unsplash free tier: 50 requests/hour.
 * This script waits 75s between requests to stay within the limit.
 * Places that already have a coverImageUrl are skipped (safe to re-run).
 */

import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import 'dotenv/config';

const prisma = new PrismaClient();

// 75s between Unsplash searches → stays within the 50 req/hour free tier limit.
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
 * Searches Unsplash for a photo matching a place name + destination context.
 * Returns the best result, or null if none found.
 *
 * @param {string} placeName - e.g. "Eiffel Tower"
 * @param {string} destinationName - e.g. "Paris" — added to query for context
 * @returns {Promise<{ unsplashId: string, url: string, altText: string, photographer: string, photographerUrl: string, sourceUrl: string } | null>}
 */
async function searchUnsplash(placeName, destinationName) {
  const url = new URL('https://api.unsplash.com/search/photos');
  url.searchParams.set('query', `${placeName} ${destinationName}`);
  url.searchParams.set('per_page', 1);
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
  if (!data.results.length) return null;

  const photo = data.results[0];
  return {
    unsplashId:      photo.id,
    // Use the regular size (1080px wide) — good balance of quality vs upload time
    url:             photo.urls.regular,
    altText:         photo.alt_description || photo.description || `${placeName} photo`,
    photographer:    photo.user.name,
    photographerUrl: `${photo.user.links.html}?utm_source=detoursights&utm_medium=referral`,
    // Required Unsplash attribution link
    sourceUrl:       `${photo.links.html}?utm_source=detoursights&utm_medium=referral`,
  };
}

// ─── Cloudinary ───────────────────────────────────────────────────────────────

/**
 * Uploads an image URL to Cloudinary under the places/ folder.
 * Uses the Unsplash photo ID as the public_id to prevent duplicate uploads.
 *
 * @param {string} imageUrl - Remote image URL to upload
 * @param {string} placeSlug - Used for folder organisation
 * @param {string} unsplashId - Used as the Cloudinary public_id
 * @returns {Promise<string>} Cloudinary secure URL
 */
async function uploadToCloudinary(imageUrl, placeSlug, unsplashId) {
  const result = await cloudinary.uploader.upload(imageUrl, {
    folder:        `DetourSights/places/${placeSlug}`,
    public_id:     unsplashId,
    overwrite:     false, // skip if already uploaded
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
  const places = await prisma.place.findMany({
    where,
    orderBy: { name: 'asc' },
    include: { destination: { select: { name: true } } },
  });

  if (places.length === 0) {
    console.log(ONLY_SLUG ? `No place found with slug "${ONLY_SLUG}"` : 'No places found.');
    return;
  }

  console.log(`Processing ${places.length} place(s)...\n`);
  let processed = 0, skipped = 0, failed = 0;

  for (const place of places) {
    // Skip if already has a cover image (safe to re-run)
    if (place.coverImageUrl) {
      console.log(`  [skip] ${place.name} — already has cover image`);
      skipped++;
      continue;
    }

    console.log(`  [fetch] ${place.name} (${place.destination.name})`);

    try {
      const photo = await searchUnsplash(place.name, place.destination.name);

      if (!photo) {
        console.log(`    ⚠ No Unsplash results for "${place.name}"`);
        failed++;
        await sleep(RATE_LIMIT_MS);
        continue;
      }

      console.log(`    found: ${photo.unsplashId} — © ${photo.photographer}`);

      if (!DRY_RUN) {
        const cloudinaryUrl = await uploadToCloudinary(photo.url, place.slug, photo.unsplashId);

        await prisma.place.update({
          where: { id: place.id },
          data:  { coverImageUrl: cloudinaryUrl },
        });

        console.log(`    ✓ saved: ${cloudinaryUrl}`);
      } else {
        console.log(`    [dry] would upload: ${photo.url}`);
      }

      console.log('    ✓ done\n');
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
