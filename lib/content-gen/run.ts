import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { join, dirname } from "path";
import { PrismaClient } from "@prisma/client";
import { graph } from "./graph";
import "dotenv/config";

const __dirname = dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");

async function persistToDb(
  placeName: string,
  destinationName: string,
  editorial: Record<string, any>,
) {
  const destination = await prisma.destination.findFirst({
    where: { name: destinationName },
  });
  if (!destination) throw new Error(`Destination "${destinationName}" not found`);

  const place = await prisma.place.findFirst({
    where: { destinationId: destination.id, name: placeName },
  });
  if (!place) throw new Error(`Place "${placeName}" not found in ${destinationName}`);

  const {
    moods,
    categories,
    seasonalTips,
    ...aiGenFields
  } = editorial;

  await prisma.$transaction(async (tx) => {
    await tx.placeAiGenData.upsert({
      where: { placeId: place.id },
      create: {
        placeId: place.id,
        ...aiGenFields,
        generatedAt: new Date(),
      },
      update: {
        ...aiGenFields,
        generatedAt: new Date(),
      },
    });

    // Sync moods
    await tx.placeMood.deleteMany({ where: { placeId: place.id } });
    if (moods?.length) {
      const moodRecords = await tx.mood.findMany({
        where: { slug: { in: moods } },
      });
      await tx.placeMood.createMany({
        data: moodRecords.map((m: { id: number }) => ({
          placeId: place.id,
          moodId: m.id,
        })),
      });
    }

    // Sync categories
    await tx.placeCategory.deleteMany({ where: { placeId: place.id } });
    if (categories?.length) {
      const categoryRecords = await tx.category.findMany({
        where: { slug: { in: categories } },
      });
      await tx.placeCategory.createMany({
        data: categoryRecords.map((c: { id: number }) => ({
          placeId: place.id,
          categoryId: c.id,
        })),
      });
    }

    // Sync seasonal tips
    await tx.seasonalTipAiGen.deleteMany({ where: { placeId: place.id } });
    if (seasonalTips?.length) {
      await tx.seasonalTipAiGen.createMany({
        data: seasonalTips.map((tip: { label: string; reason: string; avoid: boolean }) => ({
          placeId: place.id,
          label: tip.label,
          reason: tip.reason,
          avoid: tip.avoid,
        })),
      });
    }
  });

  console.log(`  Saved to DB: PlaceAiGenData, ${moods?.length ?? 0} moods, ${categories?.length ?? 0} categories, ${seasonalTips?.length ?? 0} seasonal tips`);
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY && !DRY_RUN) {
    throw new Error("Missing ANTHROPIC_API_KEY in .env");
  }
  if (DRY_RUN) console.log("--- DRY RUN: no API calls, no DB writes ---\n");

  const inputPath = join(__dirname, "add-place-ai.json");
  const place = JSON.parse(readFileSync(inputPath, "utf-8"));

  if (!place.placeName || !place.destinationName) {
    console.error("JSON must include placeName and destinationName.");
    process.exit(1);
  }

  console.log(`Processing: ${place.placeName} (${place.destinationName})...\n`);

  if (DRY_RUN) {
    console.log(`[dry] Would invoke graph for ${place.placeName} (${place.destinationName})`);
    return;
  }

  const contextSchema = { thread_id: `${place.placeName}--${place.destinationName}`, ...place };
  console.log('Context: ', contextSchema);

  const result = await graph.invoke(
    {},
    { configurable: { thread_id: `${place.placeName}--${place.destinationName}`, ...place } }
  );

  if (result.errors.length > 0) {
    console.error(`\nErrors: ${result.errors.join("\n")}`);
  }

  if (result.editorialContent) {
    const output = {
      placeName: place.placeName,
      destinationName: place.destinationName,
      researchNotes: result.researchNotes,
      researchSources: result.researchSources,
      editorialContent: result.editorialContent,
      generatedAt: new Date().toISOString(),
    };
    const outputPath = join(__dirname, "last-run-output.json");
    writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`  Output written to ${outputPath}`);

    await persistToDb(place.placeName, place.destinationName, result.editorialContent);
  } else {
    console.log("No editorial content generated — skipping DB write.");
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});