import { z } from "zod";

// input at the start of a run
// stored in context which cant be changed during the run
export const Context = z.object({
  placeName: z.string(),
  destinationName: z.string(),
  country: z.string(),
  address: z.string().nullable(),
  latitude: z.number().nullable(),    // place or destination coord
  longitude: z.number().nullable(),   // place or destination coord
  reservable: z.boolean().nullable(),
  openingHours: z.object({
    weekdayDescriptions: z.array(z.string()),
  }).nullable(),
});