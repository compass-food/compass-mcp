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
    diet: DietSchema.optional().describe("Dietary preference to evaluate against Compass evidence"),
    allergens: z
      .array(ProfileStringSchema)
      .max(PROFILE_LIST_MAX)
      .optional()
      .describe("Allergens or ingredients the user wants to avoid; handled conservatively as user preferences"),
    exclude_cross_contamination: z
      .boolean()
      .optional()
      .describe("When true, treat unknown or shared-prep cross-contamination evidence conservatively"),
    dietary_rules: z
      .array(ProfileStringSchema)
      .max(PROFILE_LIST_MAX)
      .optional()
      .describe("Additional short user dietary rules or avoidances"),
  })
  .strict();

export const ModeSchema = z.enum(["fast", "rich"]).default("rich").describe("Response detail mode");

const LocationSchema = z
  .object({
    lat: z.number().gte(-90).lte(90).describe("Latitude for radius filtering"),
    lng: z.number().gte(-180).lte(180).describe("Longitude for radius filtering"),
    radius_m: z
      .number()
      .int()
      .min(1)
      .max(SEARCH_RADIUS_MAX_M)
      .optional()
      .describe("Search radius in meters; defaults to 5000 when omitted"),
  })
  .strict();

export const SearchInputSchema = z
  .object({
    query: BoundedTextSchema.describe("Natural language query, e.g. 'strict vegan ramen in Brooklyn under $20'"),
    user_profile: UserProfileSchema.optional().describe("Optional dietary profile for per-result fit guidance"),
    location: LocationSchema.optional().describe("Optional coordinate radius filter for location-aware search"),
    limit: z.number().int().min(1).max(SEARCH_LIMIT_MAX).default(10).describe("Maximum number of results to return"),
    include_evidence: z.boolean().optional().describe("Whether to include evidence snippets when available"),
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
      minLength: 1,
      maxLength: TEXT_MAX,
      description: "Natural language query, e.g. 'strict vegan ramen in Brooklyn under $20'",
    },
    user_profile: {
      type: "object",
      description: "Optional dietary profile for per-result fit guidance",
      properties: {
        diet: {
          type: "string",
          enum: COMPASS_DIETS,
          description:
            "Preference input. Safety-sensitive and religious-diet values are conservative signals, not public certification/free-from restaurant facts.",
        },
        allergens: {
          type: "array",
          description: "Allergens or ingredients the user wants to avoid; handled conservatively as user preferences",
          items: {
            type: "string",
            minLength: 1,
            maxLength: PROFILE_ITEM_MAX,
          },
          maxItems: PROFILE_LIST_MAX,
        },
        exclude_cross_contamination: {
          type: "boolean",
          description: "When true, treat unknown or shared-prep cross-contamination evidence conservatively",
        },
        dietary_rules: {
          type: "array",
          description: "Additional short user dietary rules or avoidances",
          items: { type: "string", minLength: 1, maxLength: PROFILE_ITEM_MAX },
          maxItems: PROFILE_LIST_MAX,
        },
      },
      additionalProperties: false,
    },
    location: {
      type: "object",
      description: "Optional coordinate radius filter for location-aware search",
      properties: {
        lat: { type: "number", minimum: -90, maximum: 90, description: "Latitude for radius filtering" },
        lng: { type: "number", minimum: -180, maximum: 180, description: "Longitude for radius filtering" },
        radius_m: {
          type: "integer",
          minimum: 1,
          maximum: SEARCH_RADIUS_MAX_M,
          default: 5000,
          description: "Search radius in meters; defaults to 5000 when omitted",
        },
      },
      required: ["lat", "lng"],
      additionalProperties: false,
    },
    limit: {
      type: "integer",
      minimum: 1,
      maximum: SEARCH_LIMIT_MAX,
      default: 10,
      description: "Maximum number of restaurants to return",
    },
    include_evidence: {
      type: "boolean",
      default: true,
      description: "Whether to include evidence snippets when available",
    },
    mode: {
      type: "string",
      enum: ["fast", "rich"],
      default: "rich",
      description: "Response detail mode; rich includes fuller evidence and reasoning",
    },
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
      description: "Required dietary profile for the restaurant fit decision",
      properties: {
        diet: {
          type: "string",
          enum: COMPASS_DIETS,
          description:
            "Preference input. Safety-sensitive and religious-diet values are conservative signals, not public certification/free-from restaurant facts.",
        },
        allergens: {
          type: "array",
          description: "Allergens or ingredients the user wants to avoid; handled conservatively as user preferences",
          items: { type: "string", minLength: 1, maxLength: PROFILE_ITEM_MAX },
          maxItems: PROFILE_LIST_MAX,
        },
        exclude_cross_contamination: {
          type: "boolean",
          default: true,
          description: "When true, treat unknown or shared-prep cross-contamination evidence conservatively",
        },
        dietary_rules: {
          type: "array",
          description: "Additional short user dietary rules or avoidances",
          items: { type: "string", minLength: 1, maxLength: PROFILE_ITEM_MAX },
          maxItems: PROFILE_LIST_MAX,
        },
      },
      required: ["diet"],
      additionalProperties: false,
    },
    mode: {
      type: "string",
      enum: ["fast", "rich"],
      default: "rich",
      description: "Response detail mode; rich includes fuller evidence and reasoning",
    },
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
