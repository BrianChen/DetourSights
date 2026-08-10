/**
 * orchestrator.js
 *
 * Daily place ingestion driver. Called by Cowork's Scheduled Task with a JSON
 * array of places. Processes each place end-to-end sequentially.
 *
 * Currently wires up Tasks 1 (generatePlaceContent), 2 (pickImagesForPlace),
 * and 3 (uploadToCloudinary). DB save will be added as Task 4 lands.
 *
 * Usage:
 *   node --env-file=.env lib/scripts/places/orchestrator.js \
 *     --places '[{"placeName":"...","destinationName":"...","country":"..."}]'
 */

import 'dotenv/config';
import { toSlug }               from '../../utils/slug.js';
import { generatePlaceContent } from './generate-place-content.js';
import { pickImagesForPlace }   from './ai-image-picker.js';
import { uploadToCloudinary }   from './cloudinary-upload.js';

function parseArgs() {
  const args = process.argv.slice(2);
  const idx = args.indexOf('--places');
  if (idx === -1 || !args[idx + 1]) {
    throw new Error('Usage: orchestrator.js --places <JSON-array>');
  }
  const parsed = JSON.parse(args[idx + 1]);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('--places must be a non-empty JSON array');
  }
  return parsed;
}

async function main() {
  const places = parseArgs();
  console.log(`Orchestrator: processing ${places.length} place(s)\n`);

  for (const place of places) {
    // if place already exisit in db then skip

    const label = `${place.placeName} (${place.destinationName})`;
    try {
      console.log(`→ ${label}: generating content...`);
      const scribekitResult = await generatePlaceContent(place);
      console.log(`  ✓ content: "${scribekitResult.editorialContent.tagline}"`);

      console.log(`→ ${label}: picking images...`);
      const { cover, gallery } = await pickImagesForPlace(place);
      console.log(`  ✓ images: cover=${cover ? cover.id : 'none'}, gallery=${gallery.length}`);

      console.log(`→ ${label}: uploading to Cloudinary...`);
      const destinationSlug = toSlug(place.destinationName);
      const placeSlug       = toSlug(place.placeName);
      const uploadedCover = cover
        ? await uploadToCloudinary(cover, { destinationSlug, placeSlug })
        : null;
      const uploadedGallery = [];
      for (const photo of gallery) {
        uploadedGallery.push(await uploadToCloudinary(photo, { destinationSlug, placeSlug }));
      }
      console.log(`  ✓ uploaded: cover=${uploadedCover ? 'yes' : 'no'}, gallery=${uploadedGallery.length}`);
    } catch (err) {
      console.error(`  ✗ ${label}: ${err.message}`);
    }
  }
}

main().catch(err => {
  console.error('Orchestrator fatal error:', err);
  process.exit(1);
});
