/**
 * populate-place-descriptions.js
 *
 * Generates and saves a 4-sentence description for every Place that currently
 * has no description. Uses Google Gemini 2.5 Flash (plain fetch, no SDK).
 *
 * Free-tier limits for gemini-2.5-flash:
 *   - 5 requests/minute  → use 13 s delay between calls
 *   - 20 requests/day    → script is idempotent; run again tomorrow for the rest
 *
 * Transient per-minute 429s are retried once after the suggested delay.
 * Daily-quota 429s abort the run early (no point continuing).
 *
 * Usage:
 *   node lib/scripts/places/populate-place-descriptions.js
 *   node lib/scripts/places/populate-place-descriptions.js --dry-run
 *
 * Required env vars (.env):
 *   DATABASE_URL
 *   GEMINI_API_KEY
 */

import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

const GEMINI_DELAY_MS = 13_000; // 13 s → ~4.6 RPM, safely under 5 RPM limit
const DAILY_QUOTA_ID  = 'GenerateRequestsPerDayPerProjectPerModel-FreeTier';

const args   = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

// ─── Gemini ───────────────────────────────────────────────────────────────────

/**
 * Calls Gemini and returns the text response.
 * On a per-minute 429, waits the suggested retry delay and tries once more.
 * On a per-day 429, throws an error with isDailyLimit=true so the caller can abort.
 *
 * @param {string} prompt
 * @returns {Promise<string>}
 */
async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const body = JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] });

  async function attempt() {
    const res = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (res.ok) {
      const data = await res.json();
      return data.candidates[0].content.parts[0].text.trim();
    }

    const text = await res.text();
    if (res.status !== 429) throw new Error(`Gemini error ${res.status}: ${text}`);

    // Parse the 429 to decide whether it's a daily or per-minute limit.
    let parsed;
    try { parsed = JSON.parse(text); } catch { throw new Error(`Gemini 429: ${text}`); }

    const violation = parsed?.error?.details?.find((d) => d['@type']?.endsWith('QuotaFailure'))
      ?.violations?.[0];
    const retryDelaySec = parseInt(
      parsed?.error?.details?.find((d) => d['@type']?.endsWith('RetryInfo'))?.retryDelay ?? '0',
      10
    );

    if (violation?.quotaId === DAILY_QUOTA_ID) {
      const err = new Error('Daily Gemini quota reached. Re-run tomorrow.');
      err.isDailyLimit = true;
      throw err;
    }

    // Per-minute limit — wait and retry once.
    const waitMs = (retryDelaySec + 2) * 1_000; // add 2 s buffer
    console.log(`\n  ⏳ rate limited — waiting ${retryDelaySec + 2} s before retry...`);
    await sleep(waitMs);
    return attempt(); // single retry
  }

  return attempt();
}

/**
 * Generates a 4-sentence description for a place.
 *
 * @param {{ name: string, destination: { name: string, country: string }, categories: Array }} place
 * @returns {Promise<string>}
 */
async function generateDescription(place) {
  const categoryNames = place.categories.map((c) => c.category.name).join(', ') || 'attraction';
  const { name: destName, country } = place.destination;

  const prompt = `Write a 4-sentence description of "${place.name}", a ${categoryNames} in ${destName}, ${country}. Cover what it is, what makes it special or worth visiting, the atmosphere or experience, and one practical detail (best time to go, a tip, or what to order/see). Be specific and vivid — name signature items, notable features, or local context. No bullet points or markdown. Return only the description text, nothing else.

Example — Gelato di San Crispino, Rome:
"Widely regarded as Rome's finest gelato, San Crispino has been churning out intensely flavoured, preservative-free scoops near the Trevi Fountain since 1993. Unlike flashier competitors, it serves all flavours in cups rather than cones — a strict house rule to preserve the texture. The honey and whisky flavour is the signature, though seasonal specials like cinnamon or hazelnut cream are equally worth the queue. Arrive early in the evening to beat the crowds that inevitably spill out onto Via della Panetteria."

Now write the description for "${place.name}" in ${destName}, ${country}:`;

  return callGemini(prompt);
}

// ─── Sleep ────────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.GEMINI_API_KEY) throw new Error('Missing GEMINI_API_KEY in .env');
  if (DRY_RUN) console.log('--- DRY RUN: no database writes ---\n');

  const places = await prisma.place.findMany({
    where: { OR: [{ description: null }, { description: '' }] },
    include: {
      destination: { select: { name: true, country: true } },
      categories: { include: { category: { select: { name: true } } } },
    },
    orderBy: { id: 'asc' },
  });

  if (places.length === 0) {
    console.log('All places already have descriptions. Nothing to do.');
    return;
  }

  console.log(`Found ${places.length} place(s) without a description.`);
  console.log(`At 1 request per ~13 s, today's 20-request quota covers ~20 places.\n`);

  let successCount = 0;
  let errorCount   = 0;

  for (let i = 0; i < places.length; i++) {
    const place = places[i];
    const label = `[${i + 1}/${places.length}] ${place.name} (${place.destination.name}, ${place.destination.country})`;
    process.stdout.write(`${label} ... `);

    try {
      const description = await generateDescription(place);

      if (DRY_RUN) {
        console.log('\n  → ' + description + '\n');
      } else {
        await prisma.place.update({ where: { id: place.id }, data: { description } });
        console.log('✓');
      }
      successCount++;
    } catch (err) {
      if (err.isDailyLimit) {
        console.error(`\n\n⛔  ${err.message}`);
        console.log(`   ${successCount} description(s) saved so far. Run again tomorrow for the rest.\n`);
        break;
      }
      console.error(`✗  ${err.message}`);
      errorCount++;
    }

    if (i < places.length - 1) await sleep(GEMINI_DELAY_MS);
  }

  console.log(`\nDone. ${successCount} updated, ${errorCount} failed.`);
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
