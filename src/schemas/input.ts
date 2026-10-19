import { z } from "zod";
import {
  COMPASS_ACCEPTED_DIETS,
  COMPASS_DIETS,
  type CompassDiet,
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

export const DietSchema = z
  .string()
  .refine(
    (value): value is CompassDiet => (COMPASS_ACCEPTED_DIETS as readonly string[]).includes(value),
    { message: dietError },
  );

const BoundedTextSchema = z
  .string()
  .trim()
  .min(1)
  .max(TEXT_MAX)
  .refine((value) => !value.includes("\0"), "field must not contain null bytes");

const DishSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .refine((value) => !value.includes("\0"), "dish must not contain null bytes");

const ClientRefSchema = z
  .string()
  .max(256)
  .refine((value) => !value.includes("\0"), "client_ref must not contain null bytes");

const CallerGooglePlaceIdSchema = z
  .string()
  .max(TEXT_MAX)
  .refine((value) => !value.includes("\0"), "field must not contain null bytes")
  .refine((value) => value.trim().length > 0, "field must not be empty");

const ProfileStringSchema = z
  .string()
  .trim()
  .min(1)
  .max(PROFILE_ITEM_MAX)
  .refine((value) => !value.includes("\0"), "profile values must not contain null bytes");

const UserProfileSchema = z
  .object({
    diet: DietSchema.optional().describe("Dietary preference to evaluate against Compass evidence"),
    fully_vegan_only: z
      .boolean()
      .optional()
      .describe("When true, judge only whether the restaurant is listed as fully vegan. Search infers true from wording such as \"fully vegan\" or \"100% vegan\"; an explicit value always wins."),
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

const PlaceSchema = z
  .object({
    country_code: z
      .string()
      .regex(/^[A-Za-z]{2}$/)
      .describe("ISO 3166-1 alpha-2 country code, e.g. US or FR. Non-US is outside coverage"),
    region: z.string().trim().min(1).max(64).optional().describe("US state code or name, e.g. ID or Idaho. Required with city"),
    city: z.string().trim().min(1).max(120).optional().describe("City or town name. Requires region"),
    radius_m: z
      .number()
      .int()
      .min(1)
      .max(SEARCH_RADIUS_MAX_M)
      .optional()
      .describe("Search radius around the city in meters; defaults to 50000"),
  })
  .strict()
  .refine((place) => place.city === undefined || place.region !== undefined, {
    message: "place.region is required when place.city is given",
  });

export const SearchInputSchema = z
  .object({
    query: BoundedTextSchema.describe("Natural language query, e.g. 'vegan ramen in Brooklyn'"),
    dish: DishSchema.optional().describe(
      "Explicit dish selector, maximum 120 characters. Without a diet, Compass uses vegan_options and reports that in query_interpretation. A price, hours, or ingredient restriction in dish, or in query alongside dish, is rejected as unsupported_query_constraint."
    ),
    user_profile: UserProfileSchema.optional().describe("Optional dietary profile for per-result fit guidance"),
    location: LocationSchema.optional().describe("Optional coordinate radius filter for location-aware search"),
    place: PlaceSchema.optional().describe(
      "Destination as country_code, region (US state), and city. Use instead of location when you know the city and state but not coordinates"
    ),
    limit: z.number().int().min(1).max(SEARCH_LIMIT_MAX).default(10).describe("Maximum number of results to return"),
    include_evidence: z.boolean().optional().describe("Whether to include evidence snippets when available"),
    include_cuisine_matches: z
      .boolean()
      .optional()
      .describe("Dish queries only: also list restaurants of the dish's cuisine without the dish, marked cuisine_only"),
    client_ref: ClientRefSchema.optional().describe(
      "Optional caller correlation value. Echoed verbatim, including an empty string. Not stored"
    ),
    mode: ModeSchema,
  })
  .strict()
  .refine((request) => !(request.location && request.place), {
    message: "Send location or place, not both",
    path: ["place"],
  });

const EnrichPlaceSchema = z
  .object({
    country_code: z
      .string()
      .regex(/^[A-Za-z]{2}$/)
      .describe("ISO 3166-1 alpha-2 country code. Non-US is outside coverage"),
    region: z.string().trim().min(1).max(64).describe("US state code or name"),
    city: z.string().trim().min(1).max(120).describe("City name"),
  })
  .strict();

export const EnrichInputSchema = z
  .object({
    compass_id: BoundedTextSchema.optional().describe("Compass restaurant ID for direct lookup"),
    name: BoundedTextSchema.optional().describe("Restaurant name"),
    address: BoundedTextSchema.optional().describe("Street address (improves match)"),
    google_place_id: CallerGooglePlaceIdSchema.optional().describe(
      "Caller-supplied Google Place ID. Echoed verbatim. Do not send it with compass_id"
    ),
    dish: DishSchema.optional().describe("Explicit dish selector, maximum 120 characters"),
    user_profile: UserProfileSchema.optional().describe("Optional dietary profile. Same diets as Search"),
    place: EnrichPlaceSchema.optional().describe(
      "Name plus place, with country_code, region, and city. Do not combine with address or an exact identifier"
    ),
    client_ref: ClientRefSchema.optional().describe(
      "Optional caller correlation value. Echoed verbatim, including an empty string. Not stored"
    ),
  })
  .strict()
  .superRefine((value, ctx) => {
    const exactCount = [value.compass_id, value.google_place_id].filter(Boolean).length;
    if (exactCount > 1) {
      ctx.addIssue({
        code: "custom",
        message: "Send one exact identifier, not both compass_id and google_place_id",
        path: ["compass_id"],
      });
      return;
    }
    if (value.place) {
      if (value.address || value.compass_id || value.google_place_id) {
        ctx.addIssue({
          code: "custom",
          message: "name plus place cannot include address or an exact identifier",
          path: ["place"],
        });
      }
      if (!value.name) {
        ctx.addIssue({
          code: "custom",
          message: "name is required with place",
          path: ["name"],
        });
      }
      return;
    }
    const hasFuzzyLookup = Boolean(value.name && (value.address || value.google_place_id));
    if (!value.compass_id && !hasFuzzyLookup) {
      ctx.addIssue({
        code: "custom",
        message: "Provide compass_id, name plus address or google_place_id, or name plus place",
        path: ["compass_id"],
      });
    }
  });

export const DecideFitInputSchema = z
  .object({
    compass_id: BoundedTextSchema.optional().describe(
      "Compass restaurant ID, obtained from compass_search or compass_enrich_restaurant"
    ),
    google_place_id: CallerGooglePlaceIdSchema.optional().describe(
      "Caller-supplied Google Place ID. Send exactly one of compass_id or google_place_id"
    ),
    client_ref: ClientRefSchema.optional().describe(
      "Optional caller correlation value. Echoed verbatim, including an empty string. Not stored"
    ),
    user_profile: UserProfileSchema.extend({
      diet: DietSchema,
      exclude_cross_contamination: z.boolean().default(false),
    }).strict(),
    mode: ModeSchema,
  })
  .strict()
  .refine((value) => (value.compass_id !== undefined) !== (value.google_place_id !== undefined), {
    message: "Provide exactly one of compass_id or google_place_id",
  });

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
      description: "Natural language query, e.g. 'vegan ramen in Brooklyn'. Price, hours, and ingredient exclusions are not supported constraints",
    },
    dish: {
      type: "string",
      minLength: 1,
      maxLength: 120,
      description:
        "Explicit dish selector, maximum 120 characters. Without a diet, Compass uses vegan_options and reports that in query_interpretation. A price, hours, or ingredient restriction in dish, or in query alongside dish, is rejected as unsupported_query_constraint.",
    },
    user_profile: {
      type: "object",
      description: "Optional dietary profile for per-result fit guidance",
      properties: {
        diet: {
          type: "string",
          enum: COMPASS_DIETS,
          description:
            "Preference input. vegan_options is an alias of strict_vegan: a vegan meal is available, judged from dishes. Set fully_vegan_only to judge only fully vegan restaurants. vegetarian is judged only from vegan evidence. pescatarian, halal, kosher, and low_fodmap are accepted but always return unknown with reason code DIET_NOT_SUPPORTED.",
        },
        fully_vegan_only: {
          type: "boolean",
          description: "When true, judge only whether the restaurant is listed as fully vegan. Search infers true from wording such as \"fully vegan\" or \"100% vegan\"; an explicit value always wins.",
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
    place: {
      type: "object",
      description:
        "Destination as country_code, region (US state), and city. Use instead of location when you know the city and state but not coordinates",
      properties: {
        country_code: {
          type: "string",
          pattern: "^[A-Za-z]{2}$",
          description: "ISO 3166-1 alpha-2 country code, e.g. US or FR. Non-US is outside coverage",
        },
        region: { type: "string", minLength: 1, maxLength: 64, description: "US state code or name, e.g. ID or Idaho. Required with city" },
        city: { type: "string", minLength: 1, maxLength: 120, description: "City or town name. Requires region" },
        radius_m: {
          type: "integer",
          minimum: 1,
          maximum: SEARCH_RADIUS_MAX_M,
          default: 50000,
          description: "Search radius around the city in meters; defaults to 50000",
        },
      },
      required: ["country_code"],
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
    include_cuisine_matches: {
      type: "boolean",
      description: "Dish queries only: also list restaurants of the dish's cuisine without the dish, marked cuisine_only",
    },
    client_ref: {
      type: "string",
      maxLength: 256,
      description: "Optional caller correlation value. Echoed verbatim, including an empty string. Not stored",
    },
    mode: {
      type: "string",
      enum: ["fast", "rich"],
      default: "rich",
      description: "Search response mode sent as X-Compass-Mode; rich (default) includes fuller evidence and reasoning",
    },
  },
  required: ["query"],
  additionalProperties: false,
} as const;

export const enrichInputJsonSchema = {
  type: "object",
  description:
    "Provide compass_id, name plus address or google_place_id, or name plus place. Send one exact identifier, not both compass_id and google_place_id.",
  anyOf: [
    { required: ["compass_id"] },
    { required: ["name", "address"] },
    { required: ["name", "google_place_id"] },
    { required: ["name", "place"] },
  ],
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
      description: "Caller-supplied Google Place ID. Do not send it with compass_id",
    },
    dish: {
      type: "string",
      minLength: 1,
      maxLength: 120,
      description: "Explicit dish selector, maximum 120 characters",
    },
    user_profile: {
      type: "object",
      description: "Optional dietary profile. Same diets as Search",
      properties: {
        diet: { type: "string", enum: COMPASS_DIETS },
        fully_vegan_only: { type: "boolean" },
        exclude_cross_contamination: { type: "boolean" },
        dietary_rules: {
          type: "array",
          items: { type: "string", minLength: 1, maxLength: PROFILE_ITEM_MAX },
          maxItems: PROFILE_LIST_MAX,
        },
      },
      additionalProperties: false,
    },
    place: {
      type: "object",
      description: "Name plus place. Requires country_code, region, and city. Do not combine with address or an exact identifier",
      properties: {
        country_code: { type: "string", pattern: "^[A-Za-z]{2}$" },
        region: { type: "string", minLength: 1, maxLength: 64 },
        city: { type: "string", minLength: 1, maxLength: 120 },
      },
      required: ["country_code", "region", "city"],
      additionalProperties: false,
    },
    client_ref: {
      type: "string",
      maxLength: 256,
      description: "Optional caller correlation value. Echoed verbatim, including an empty string. Not stored",
    },
  },
  additionalProperties: false,
} as const;

export const decideFitInputJsonSchema = {
  type: "object",
  description: "Provide exactly one of compass_id or google_place_id.",
  oneOf: [
    { required: ["compass_id"], not: { required: ["google_place_id"] } },
    { required: ["google_place_id"], not: { required: ["compass_id"] } },
  ],
  properties: {
    compass_id: {
      type: "string",
      minLength: 1,
      maxLength: TEXT_MAX,
      description: "Compass restaurant ID, obtained from compass_search or compass_enrich_restaurant",
    },
    google_place_id: {
      type: "string",
      minLength: 1,
      maxLength: TEXT_MAX,
      description: "Caller-supplied Google Place ID. Send exactly one of compass_id or google_place_id",
    },
    client_ref: {
      type: "string",
      maxLength: 256,
      description: "Optional caller correlation value. Echoed verbatim, including an empty string. Not stored",
    },
    user_profile: {
      type: "object",
      description: "Required dietary profile for the restaurant fit decision",
      properties: {
        diet: {
          type: "string",
          enum: COMPASS_DIETS,
          description:
            "Preference input. Compass judges strict_vegan (and its alias vegan_options) from dishes, and vegetarian only from vegan evidence. pescatarian, halal, kosher, and low_fodmap are accepted but always return unknown with reason code DIET_NOT_SUPPORTED.",
        },
        fully_vegan_only: {
          type: "boolean",
          description: "When true, judge only whether the restaurant is listed as fully vegan. Search infers true from wording such as \"fully vegan\" or \"100% vegan\"; an explicit value always wins.",
        },
        exclude_cross_contamination: {
          type: "boolean",
          default: false,
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
      description: "Credit-cost selector sent as X-Compass-Mode: fast or rich (default)",
    },
  },
  required: ["user_profile"],
  additionalProperties: false,
} as const;

const _searchInputTypeCheck: Omit<SearchInput, "mode"> extends CompassSearchRequestApi ? true : never = true;
const _enrichInputTypeCheck: EnrichInput extends CompassEnrichRequestApi ? true : never = true;
const _decisionInputTypeCheck: Omit<DecideFitInput, "mode"> extends CompassDecisionRequestApi ? true : never = true;
void _searchInputTypeCheck;
void _enrichInputTypeCheck;
void _decisionInputTypeCheck;
