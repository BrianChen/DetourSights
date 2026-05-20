import { createAgent, providerStrategy } from "langchain";
import { ChatAnthropic } from "@langchain/anthropic";
import { z } from "zod";
import { Context } from '../context';
import { EDITORIAL_PROMPT } from '../prompts/editorial'

const EditorialOutput = z.object({
  // Content
  tagline: z.string(),
  description: z.string(),
  whyVisit: z.array(z.string()),
  neighbourhood: z.string().nullable(),
  localTips: z.array(z.string()),
  whatToBring: z.array(z.string()),

  // Practical — enums match DB
  visitDuration: z.enum(["UNDER_1_HOUR", "ONE_TO_TWO_HOURS", "TWO_TO_FOUR_HOURS", "HALF_DAY", "FULL_DAY"]).nullable(),
  bookingRequired: z.boolean().nullable(),
  bookInAdvanceWarning: z.string().nullable(),
  dressCode: z.string().nullable(),
  indoorOutdoor: z.enum(["INDOOR", "OUTDOOR", "BOTH"]).nullable(),
  weatherDependent: z.boolean().nullable(),

  // Classification — slugs match DB
  moods: z.array(z.enum([
    "adventurous", "relaxing", "cultural", "foodie",
    "off-the-beaten-path", "romantic", "family-friendly",
  ])),
  categories: z.array(z.enum([
    "sights-and-landmarks", "nature-outdoors", "food-and-drink",
    "nightlife", "shopping", "arts-and-entertainment",
    "activities-and-experiences", "neighborhoods",
  ])),

  // Seasonal
  seasonalTips: z.array(z.object({
    label: z.string(),
    reason: z.string(),
    avoid: z.boolean(),
  })).nullable(),

  // Confidence levels
  taglineConfidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
  descriptionConfidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
  whyVisitConfidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
  neighbourhoodConfidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
  visitDurationConfidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
  bookingRequiredConfidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
  bookInAdvanceWarningConfidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
  dressCodeConfidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
  localTipsConfidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
  whatToBringConfidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
  indoorOutdoorConfidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
  weatherDependentConfidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
  moodsConfidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
});

const editorialAgent = createAgent({
  model: new ChatAnthropic({
    model: "claude-sonnet-4-6",
    maxTokens: 4096,
    maxRetries: 2,
  }),
  systemPrompt: EDITORIAL_PROMPT,
  contextSchema: Context,
  responseFormat: providerStrategy(EditorialOutput),
});

export const editorialNode = async (state: any, config: any) => {
  console.log("  [editorial] starting...");
  console.log('  state: ', state);
  console.log('  config: ', config);

  const result = await editorialAgent.invoke({
    messages: [{
      role: "user",
      content: `Write editorial content using these research notes:\n\n${state.researchNotes}`,
    }],
  }, config);

  console.log(`  what editoral llm read: `, result.messages);
  console.log(`  [editoral] done`)
  console.log(`  editorialContent: `, result.structuredResponse);

  return {
    editorialContent: result.structuredResponse,
  };
};