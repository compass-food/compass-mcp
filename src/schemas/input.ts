import { z } from "zod";

const DietSchema = z.enum([
  "vegan_strict",
  "vegan_friendly",
  "vegetarian",
  "pescatarian",
  "omnivore",
]);

const AllergenSchema = z.enum([
  "peanut",
  "tree_nut",
  "dairy",
  "egg",
  "soy",
  "gluten",
  "shellfish",
  "fish",
  "sesame",
]);

export const ModeSchema = z.enum(["fast", "rich"]).default("rich");

export const SearchInputSchema = z.object({
  query: z.string().min(1).describe("Natural language query, e.g. 'strict vegan ramen in Brooklyn under $20'"),
  user_profile: z
    .object({
      diet: DietSchema.optional(),
      allergens: z.array(AllergenSchema).optional(),
      exclude_cross_contamination: z.boolean().optional(),
    })
    .optional(),
  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
      radius_m: z.number().int().positive().max(50000),
    })
    .optional(),
  limit: z.number().int().positive().max(20).default(10),
  mode: ModeSchema,
});

export const EnrichInputSchema = z
  .object({
    name: z.string().min(1).describe("Restaurant name"),
    address: z.string().optional().describe("Street address (improves match)"),
    google_place_id: z.string().optional().describe("Google Place ID (highest match confidence)"),
  })
  .refine((data) => !!data.address || !!data.google_place_id, {
    message: "Either address or google_place_id is required",
  });

export const DecideFitInputSchema = z.object({
  compass_id: z.string().min(1).describe("Compass restaurant ID, obtained from compass_search or compass_enrich_restaurant"),
  user_profile: z.object({
    diet: DietSchema,
    allergens: z.array(z.string()).optional(),
    exclude_cross_contamination: z.boolean().default(true),
    dietary_rules: z.array(z.string()).optional(),
  }),
  mode: ModeSchema,
});

export type SearchInput = z.infer<typeof SearchInputSchema>;
export type EnrichInput = z.infer<typeof EnrichInputSchema>;
export type DecideFitInput = z.infer<typeof DecideFitInputSchema>;

export const searchInputJsonSchema = {
  type: "object",
  properties: {
    query: {
      type: "string",
      description: "Natural language query, e.g. 'strict vegan ramen in Brooklyn under $20'",
    },
    user_profile: {
      type: "object",
      properties: {
        diet: {
          type: "string",
          enum: ["vegan_strict", "vegan_friendly", "vegetarian", "pescatarian", "omnivore"],
        },
        allergens: {
          type: "array",
          items: {
            type: "string",
            enum: ["peanut", "tree_nut", "dairy", "egg", "soy", "gluten", "shellfish", "fish", "sesame"],
          },
        },
        exclude_cross_contamination: { type: "boolean" },
      },
      additionalProperties: false,
    },
    location: {
      type: "object",
      properties: {
        lat: { type: "number" },
        lng: { type: "number" },
        radius_m: { type: "integer", minimum: 1, maximum: 50000 },
      },
      required: ["lat", "lng", "radius_m"],
      additionalProperties: false,
    },
    limit: { type: "integer", minimum: 1, maximum: 20, default: 10 },
    mode: { type: "string", enum: ["fast", "rich"], default: "rich" },
  },
  required: ["query"],
  additionalProperties: false,
} as const;

export const enrichInputJsonSchema = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 1, description: "Restaurant name" },
    address: { type: "string", description: "Street address (improves match)" },
    google_place_id: { type: "string", description: "Google Place ID (highest match confidence)" },
  },
  required: ["name"],
  additionalProperties: false,
} as const;

export const decideFitInputJsonSchema = {
  type: "object",
  properties: {
    compass_id: {
      type: "string",
      minLength: 1,
      description: "Compass restaurant ID, obtained from compass_search or compass_enrich_restaurant",
    },
    user_profile: {
      type: "object",
      properties: {
        diet: {
          type: "string",
          enum: ["vegan_strict", "vegan_friendly", "vegetarian", "pescatarian", "omnivore"],
        },
        allergens: { type: "array", items: { type: "string" } },
        exclude_cross_contamination: { type: "boolean", default: true },
        dietary_rules: { type: "array", items: { type: "string" } },
      },
      required: ["diet"],
      additionalProperties: false,
    },
    mode: { type: "string", enum: ["fast", "rich"], default: "rich" },
  },
  required: ["compass_id", "user_profile"],
  additionalProperties: false,
} as const;
