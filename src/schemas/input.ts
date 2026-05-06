import { z } from "zod";
import {
  COMPASS_DIETS,
  type CompassDecisionRequestApi,
  type CompassEnrichRequestApi,
  type CompassSearchRequestApi,
} from "../types.js";

const TEXT_MAX = 500;
const PROFILE_ITEM_MAX = 64;
const PROFILE_LIST_MAX = 20;
const SEARCH_LIMIT_MAX = 50;
const SEARCH_RADIUS_MAX_M = 50_000;

const dietError = `diet must be one of: ${COMPASS_DIETS.join(", ")}`;

export const DietSchema = z.enum(COMPASS_DIETS, {
  errorMap: () => ({ message: dietError }),
});

const BoundedTextSchema = z
  .string()
  .trim()
  .min(1)
  .max(TEXT_MAX)
  .refine((value) => !value.includes("\0"), "field must not contain null bytes");

const ProfileStringSchema = z
  .string()
  .trim()
  .min(1)
  .max(PROFILE_ITEM_MAX)
  .refine((value) => !value.includes("\0"), "profile values must not contain null bytes");

const UserProfileSchema = z
  .object({
    diet: DietSchema.optional(),
    allergens: z.array(ProfileStringSchema).max(PROFILE_LIST_MAX).optional(),
    exclude_cross_contamination: z.boolean().optional(),
    dietary_rules: z.array(ProfileStringSchema).max(PROFILE_LIST_MAX).optional(),
  })
  .strict();

export const ModeSchema = z.enum(["fast", "rich"]).default("rich");

const LocationSchema = z
  .object({
    lat: z.number().gte(-90).lte(90),
    lng: z.number().gte(-180).lte(180),
    radius_m: z.number().int().min(1).max(SEARCH_RADIUS_MAX_M).optional(),
  })
  .strict();

export const SearchInputSchema = z
  .object({
    query: BoundedTextSchema.describe("Natural language query, e.g. 'strict vegan ramen in Brooklyn under $20'"),
    user_profile: UserProfileSchema.optional(),
    location: LocationSchema.optional(),
    limit: z.number().int().min(1).max(SEARCH_LIMIT_MAX).default(10),
    include_evidence: z.boolean().optional(),
    mode: ModeSchema,
  })
  .strict();

export const EnrichInputSchema = z
  .object({
    compass_id: BoundedTextSchema.optional().describe("Compass restaurant ID for direct lookup"),
    name: BoundedTextSchema.optional().describe("Restaurant name"),
    address: BoundedTextSchema.optional().describe("Street address (improves match)"),
    google_place_id: BoundedTextSchema.optional().describe("Google Place ID (highest match confidence)"),
  })
  .strict()
  .refine((data) => Boolean(data.compass_id || (data.name && (data.address || data.google_place_id))), {
    message: "Provide compass_id, or name plus address or google_place_id",
    path: ["compass_id"],
  });

export const DecideFitInputSchema = z
  .object({
    compass_id: BoundedTextSchema.describe("Compass restaurant ID, obtained from compass_search or compass_enrich_restaurant"),
    user_profile: UserProfileSchema.extend({
      diet: DietSchema,
      exclude_cross_contamination: z.boolean().default(true),
    }).strict(),
    mode: ModeSchema,
  })
  .strict();

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
          enum: COMPASS_DIETS,
        },
        allergens: {
          type: "array",
          items: {
            type: "string",
            minLength: 1,
            maxLength: PROFILE_ITEM_MAX,
          },
          maxItems: PROFILE_LIST_MAX,
        },
        exclude_cross_contamination: { type: "boolean" },
        dietary_rules: {
          type: "array",
          items: { type: "string", minLength: 1, maxLength: PROFILE_ITEM_MAX },
          maxItems: PROFILE_LIST_MAX,
        },
      },
      additionalProperties: false,
    },
    location: {
      type: "object",
      properties: {
        lat: { type: "number" },
        lng: { type: "number" },
        radius_m: { type: "integer", minimum: 1, maximum: SEARCH_RADIUS_MAX_M, default: 5000 },
      },
      required: ["lat", "lng"],
      additionalProperties: false,
    },
    limit: { type: "integer", minimum: 1, maximum: SEARCH_LIMIT_MAX, default: 10 },
    include_evidence: { type: "boolean", default: true },
    mode: { type: "string", enum: ["fast", "rich"], default: "rich" },
  },
  required: ["query"],
  additionalProperties: false,
} as const;

export const enrichInputJsonSchema = {
  type: "object",
  anyOf: [{ required: ["compass_id"] }, { required: ["name", "address"] }, { required: ["name", "google_place_id"] }],
  properties: {
    compass_id: {
      type: "string",
      minLength: 1,
      maxLength: TEXT_MAX,
      description: "Compass restaurant ID for direct lookup",
    },
    name: { type: "string", minLength: 1, maxLength: TEXT_MAX, description: "Restaurant name" },
    address: { type: "string", minLength: 1, maxLength: TEXT_MAX, description: "Street address (improves match)" },
    google_place_id: {
      type: "string",
      minLength: 1,
      maxLength: TEXT_MAX,
      description: "Google Place ID (highest match confidence)",
    },
  },
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
          enum: COMPASS_DIETS,
        },
        allergens: {
          type: "array",
          items: { type: "string", minLength: 1, maxLength: PROFILE_ITEM_MAX },
          maxItems: PROFILE_LIST_MAX,
        },
        exclude_cross_contamination: { type: "boolean", default: true },
        dietary_rules: {
          type: "array",
          items: { type: "string", minLength: 1, maxLength: PROFILE_ITEM_MAX },
          maxItems: PROFILE_LIST_MAX,
        },
      },
      required: ["diet"],
      additionalProperties: false,
    },
    mode: { type: "string", enum: ["fast", "rich"], default: "rich" },
  },
  required: ["compass_id", "user_profile"],
  additionalProperties: false,
} as const;

const _searchInputTypeCheck: Omit<SearchInput, "mode"> extends CompassSearchRequestApi ? true : never = true;
const _enrichInputTypeCheck: EnrichInput extends CompassEnrichRequestApi ? true : never = true;
const _decisionInputTypeCheck: Omit<DecideFitInput, "mode"> extends CompassDecisionRequestApi ? true : never = true;
void _searchInputTypeCheck;
void _enrichInputTypeCheck;
void _decisionInputTypeCheck;
