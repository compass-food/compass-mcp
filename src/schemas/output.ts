import { z } from "zod";
import {
  COMPASS_CONFIDENCES,
  COMPASS_DECISIONS,
  COMPASS_EVIDENCE_TIERS,
  COMPASS_EVIDENCE_TYPES,
  COMPASS_RISK_FLAGS,
} from "../types.js";

export const ProblemDetailsSchema = z
  .object({
    type: z.string(),
    title: z.string(),
    status: z.number().int(),
    detail: z.string().optional(),
    compass_request_id: z.string().optional(),
  })
  .passthrough();

// Output schemas describe the API contract (daas/api/contracts/openapi.v1.json)
// but stay permissive: MCP clients validate structuredContent against them, so
// every object allows additional properties and `required` lists only fields
// present on every response shape of that tool. A stricter schema turns an
// additive API change into a client-side error.

const nullableString = { type: ["string", "null"] } as const;

const addressJsonSchema = {
  type: "object",
  description: "Stored address. Fields Compass does not hold are null.",
  properties: {
    street: nullableString,
    city: nullableString,
    state: nullableString,
    postal_code: nullableString,
    country: nullableString,
  },
  additionalProperties: true,
} as const;

const coordinatesJsonSchema = {
  type: "object",
  description: "Restaurant coordinates, when available",
  properties: {
    lat: { type: ["number", "null"], description: "Latitude" },
    lng: { type: ["number", "null"], description: "Longitude" },
  },
  additionalProperties: true,
} as const;

const coverageJsonSchema = {
  type: "object",
  description:
    "Geography of the request relative to the 50 US states and Washington, DC. Branch on status; note is explanatory only.",
  properties: {
    status: { type: "string", enum: ["in_coverage", "out_of_coverage", "coverage_unknown"] },
    covered_geography: { type: "string", enum: ["US"] },
    interpreted_location: { type: "string", description: "Present only when a location was resolved from local data" },
    note: { type: "string", description: "Human explanation. Do not branch on this text." },
  },
  additionalProperties: true,
} as const;

const reasonCodesJsonSchema = {
  type: "array",
  description:
    "Compass public reason codes explaining the result. Values come from the ReasonCode enum in the Compass OpenAPI contract and GET /v1/metadata.",
  items: { type: "string" },
} as const;

const clientRefJsonSchema = {
  type: "string",
  maxLength: 256,
  description: "Echo of the caller's client_ref. Omitted when the request omits it.",
} as const;

const googlePlaceIdEchoJsonSchema = {
  type: "string",
  description: "Echo of the caller-supplied Google Place ID. Not a value read from Compass records.",
} as const;

const resolutionJsonSchema = {
  type: "object",
  description:
    "Present only when an exact google_place_id did not select one restaurant. unresolved: no stored mapping. ambiguous: more than one eligible restaurant.",
  properties: {
    status: { type: "string", enum: ["unresolved", "ambiguous"] },
    compass_ids: {
      type: "array",
      items: { type: "string" },
      description: "Every eligible restaurant ID when status is ambiguous",
    },
  },
  additionalProperties: true,
} as const;

const evidenceJsonSchema = {
  type: "object",
  description: "Evidence item supporting a score, enrichment, or decision. Evidence may be omitted in fast responses.",
  properties: {
    evidence_id: { type: "string", description: "Stable evidence identifier when available" },
    type: {
      type: "string",
      enum: COMPASS_EVIDENCE_TYPES,
      description: "Evidence source category",
    },
    source: { type: "string", description: "Evidence source URL or source label" },
    excerpt: { type: "string", description: "Short source excerpt or paraphrase, when available" },
    weight: { type: "string", enum: ["primary", "supporting"], description: "Relative evidence weight" },
    tier: { type: "string", enum: COMPASS_EVIDENCE_TIERS, description: "Compass evidence tier" },
    paraphrase_method: {
      type: "string",
      enum: ["automatic", "manual", "none"],
      description: "How the evidence excerpt was normalized",
    },
  },
  additionalProperties: true,
} as const;

const sourceFreshnessJsonSchema = {
  type: "object",
  description:
    "Age of the evidence behind a result. Compare oldest_signal_age_days when a caller needs an age check. last_evaluated_at stays separate.",
  properties: {
    oldest_signal_age_days: {
      type: "integer",
      minimum: 0,
      description: "Age in days of the oldest supporting signal",
    },
    newest_signal_age_days: {
      type: "integer",
      minimum: 0,
      description: "Age in days of the newest supporting signal",
    },
  },
  additionalProperties: true,
} as const;

const matchingDishJsonSchema = {
  type: "object",
  description: "A collected-menu dish matching the requested dish",
  properties: {
    name: { type: "string" },
    category: nullableString,
    match_type: { type: "string", enum: ["exact", "variant"] },
    is_vegan: { type: "boolean" },
  },
  additionalProperties: true,
} as const;

const veganDishJsonSchema = {
  type: "object",
  description: "A vegan dish from the collected menu",
  properties: {
    name: { type: "string" },
    category: nullableString,
    match_type: {
      type: "string",
      enum: ["exact", "variant", "not_requested"],
      description: "How the dish relates to the requested dish; not_requested when no dish was asked for",
    },
    evidence_id: { type: "string" },
    vegan_basis: { type: "string", enum: ["validated_menu_classification"] },
  },
  additionalProperties: true,
} as const;

const veganDiningJsonSchema = {
  type: "object",
  description:
    "Vegan dishes relevant to the request, at most five. Not a complete menu. Counts describe the full supported set.",
  properties: {
    dishes_availability: { type: "string", enum: ["yes", "unknown"] },
    vegan_dish_count: {
      type: ["integer", "null"],
      minimum: 0,
      description: "Every eligible vegan food dish on the collected menu, not only matched_dishes",
    },
    matching_dish_count: { type: ["integer", "null"], minimum: 0 },
    matched_dishes: { type: "array", maxItems: 5, items: veganDishJsonSchema },
    truncated: { type: "boolean" },
    menu_collected_at: {
      type: ["string", "null"],
      description:
        "Date the menu text behind these dishes was collected (ISO 8601 UTC). Not a claim that the menu is current or verified. Null when no date is tied to that exact menu text.",
    },
    menu_collected_at_status: {
      type: "string",
      enum: ["known", "unknown"],
      description: "known when menu_collected_at is set, otherwise unknown",
    },
    match_status: { type: "string", enum: ["matched", "no_supported_match", "evidence_unavailable"] },
  },
  additionalProperties: true,
} as const;

const foodFactJsonSchema = { type: "string", enum: ["yes", "no", "unknown"] } as const;

const dietaryProfileJsonSchema = {
  type: "object",
  description:
    "Public restaurant dietary facts supported by launch evidence. Compass does not expose certification claims. Compass is not an allergen or safety service.",
  properties: {
    fully_vegan: { type: ["boolean", "null"], description: "Whether the restaurant appears fully vegan" },
    vegan_friendly: { type: ["boolean", "null"], description: "Whether the restaurant has vegan-friendly evidence" },
    food_availability: {
      type: "object",
      description: "Derived yes/no/unknown offerings per axis. Omitted when not derived; read that as unknown.",
      properties: {
        fish: foodFactJsonSchema,
        shellfish: foodFactJsonSchema,
        meat: foodFactJsonSchema,
        vegan_options: foodFactJsonSchema,
        vegetarian_options: foodFactJsonSchema,
        pescatarian_options: foodFactJsonSchema,
      },
      additionalProperties: true,
    },
  },
  additionalProperties: true,
} as const;

const veganScoreDimensionJsonSchema = {
  type: "object",
  properties: {
    score: { type: ["number", "null"], minimum: 0, maximum: 100 },
    weight: { type: "number", minimum: 0, maximum: 1 },
    confidence: { type: "string", enum: COMPASS_CONFIDENCES },
    evidence_ids: { type: "array", items: { type: "string" } },
  },
  additionalProperties: true,
} as const;

const veganScoreJsonSchema = {
  type: "object",
  description: "Deterministic Compass VeganScore summary",
  properties: {
    overall: {
      type: ["number", "null"],
      minimum: 0,
      maximum: 100,
      description: "Overall VeganScore from 0 to 100 when available",
    },
    scoring_version: { type: ["string", "null"], description: "Scoring model version" },
    dimensions: {
      type: "object",
      description: "Per-dimension scores, when available",
      properties: {
        D1_vegan_coverage: veganScoreDimensionJsonSchema,
        D2_vegan_quality: veganScoreDimensionJsonSchema,
        D3_ingredient_clarity: veganScoreDimensionJsonSchema,
        D4_cross_contamination: {
          ...veganScoreDimensionJsonSchema,
          description: "Contact with animal products during preparation",
        },
        D5_staff_knowledge: veganScoreDimensionJsonSchema,
        D6_restaurant_quality: veganScoreDimensionJsonSchema,
      },
      additionalProperties: true,
    },
    reasoning: { type: "string", description: "Short score reasoning when available" },
  },
  additionalProperties: true,
} as const;

const matchForProfileJsonSchema = {
  type: "object",
  description: "Dietary fit guidance for the submitted user profile",
  properties: {
    decision: {
      type: "string",
      enum: COMPASS_DECISIONS,
      description: "Conservative decision: fit, not_fit, or unknown",
    },
    confidence: { type: "string", enum: COMPASS_CONFIDENCES, description: "Decision confidence" },
    reason_codes: reasonCodesJsonSchema,
    risk_flags: {
      type: "array",
      description: "Risk flags that should be surfaced to the user",
      items: { type: "string", enum: COMPASS_RISK_FLAGS },
    },
    verification_required: {
      type: "boolean",
      description: "True when the user should verify with the restaurant before relying on the result",
    },
    recommended_user_text: { type: "string", description: "Conservative user-facing wording" },
  },
  additionalProperties: true,
} as const;

const restaurantProperties = {
  compass_id: { type: "string", description: "Stable Compass restaurant ID" },
  name: { type: ["string", "null"], description: "Restaurant name" },
  address: addressJsonSchema,
  coordinates: coordinatesJsonSchema,
  vegan_score: veganScoreJsonSchema,
  dietary_profile: dietaryProfileJsonSchema,
  cuisine_types: {
    type: "array",
    description: "Cuisine labels associated with the restaurant",
    items: { type: "string" },
  },
  services: {
    type: "object",
    description: "Service flags such as takeout or delivery, when available",
    additionalProperties: { type: "boolean" },
  },
  evidence: {
    type: "array",
    description: "Evidence available for this restaurant result",
    items: evidenceJsonSchema,
  },
  vegan_dining: veganDiningJsonSchema,
  source_freshness: sourceFreshnessJsonSchema,
  last_verified_at: { type: ["string", "null"] },
  last_evaluated_at: {
    type: ["string", "null"],
    description: "When Compass last evaluated this restaurant for scoring and decision freshness",
  },
} as const;

const restaurantJsonSchema = {
  type: "object",
  description: "Compass restaurant record",
  properties: restaurantProperties,
  additionalProperties: true,
} as const;

const searchResultJsonSchema = {
  type: "object",
  description: "Compass restaurant search result",
  properties: {
    ...restaurantProperties,
    distance_m: {
      type: "number",
      minimum: 0,
      description: "Distance in meters from the requested location, when location is supplied",
    },
    match_for_profile: matchForProfileJsonSchema,
    dish_match: {
      type: "object",
      description:
        "Dish queries only. match_type dish: the collected menu has the requested dish (a vegan version for vegan profiles). cuisine_only: listed only because include_cuisine_matches was set; never a dish match.",
      properties: {
        requested_dish: { type: "string" },
        match_type: { type: "string", enum: ["dish", "cuisine_only"] },
        dishes: { type: "array", maxItems: 5, items: matchingDishJsonSchema },
      },
      additionalProperties: true,
    },
  },
  additionalProperties: true,
} as const;

export const searchOutputJsonSchema = {
  type: "object",
  description: "Compass restaurant search response",
  properties: {
    compass_request_id: { type: "string", description: "Compass request identifier for support and tracing" },
    client_ref: clientRefJsonSchema,
    coverage: coverageJsonSchema,
    results: {
      type: "array",
      description: "Ranked Compass restaurant results",
      items: searchResultJsonSchema,
    },
    result_status: {
      type: "string",
      enum: ["matched", "no_match", "no_supported_match", "out_of_coverage"],
      description:
        "out_of_coverage is geography. A dish query with no restaurant that has the dish is no_match. Any other empty result inside US geography is no_supported_match",
    },
    total_results: { type: "integer", minimum: 0 },
    nearest_match: {
      type: ["object", "null"],
      description:
        "Dish queries with no_match only: the nearest US restaurant with the dish within 50 km of the request point, or null. Never part of results.",
      properties: {
        compass_id: { type: "string" },
        name: nullableString,
        address: addressJsonSchema,
        coordinates: coordinatesJsonSchema,
        matching_dishes: { type: "array", maxItems: 5, items: matchingDishJsonSchema },
        distance_km: { type: "number", minimum: 0, maximum: 50 },
      },
      additionalProperties: true,
    },
    nearest_match_note: { type: "string", description: "Why nearest_match is null" },
    query_interpretation: {
      type: "object",
      description: "Best-effort interpretation of the submitted search query",
      properties: {
        diet_inferred: { type: ["string", "null"] },
        cuisine_inferred: { type: ["string", "null"] },
        dish_inferred: nullableString,
        intent_inferred: { type: "string", enum: ["named", "dish", "cuisine", "general"] },
        target_inferred: nullableString,
        location_inferred: { type: "string" },
        neighborhood_inferred: { type: "string" },
        radius_m: { type: "integer" },
        radius_m_inferred: { type: "boolean" },
        radius_m_text_ignored: { type: "boolean" },
        dish_source: { type: "string", enum: ["explicit", "query"] },
        ignored_query_terms: {
          type: "array",
          maxItems: 8,
          items: { type: "string" },
          description: "Dish or cuisine phrases in the query overridden by an explicit dish",
        },
      },
      additionalProperties: true,
    },
    named_match: {
      type: "object",
      description:
        "Restaurant-name identity. Omitted unless the query names a restaurant. Distinct from dietary match_for_profile. lookup_incomplete is not an absence claim.",
      properties: {
        status: {
          type: "string",
          enum: ["confident", "ambiguous", "no_confident_match", "lookup_incomplete"],
        },
        target: { type: "string" },
        match_method: { type: "string", enum: ["normalized_name", "normalized_slug"] },
        compass_ids: { type: "array", items: { type: "string" } },
        alternatives: {
          type: "array",
          description: "Labeled alternatives when status is ambiguous. Order is not a selection.",
          items: {
            type: "object",
            properties: {
              compass_id: { type: "string" },
              name: { type: "string" },
              reason: { type: "string" },
            },
            additionalProperties: true,
          },
        },
      },
      required: ["status", "target", "compass_ids"],
      additionalProperties: true,
    },
    location_disambiguation: {
      type: "object",
      description: "Present when a place name matched both a US place and a foreign place and Compass kept the US one",
      additionalProperties: true,
    },
    ai_generated: { type: "boolean" },
    human_review_recommended: { type: "boolean" },
    metadata: { type: "object", description: "Search execution metadata", additionalProperties: true },
  },
  required: ["results"],
  additionalProperties: true,
} as const;

export const enrichOutputJsonSchema = {
  type: "object",
  description: "Compass restaurant enrichment response",
  properties: {
    compass_request_id: { type: "string", description: "Compass request identifier for support and tracing" },
    client_ref: clientRefJsonSchema,
    google_place_id: googlePlaceIdEchoJsonSchema,
    matched: {
      type: "boolean",
      description: "True only when identity_status is resolved",
    },
    identity_status: {
      type: "string",
      enum: ["resolved", "no_confident_match", "ambiguous", "lookup_incomplete"],
      description: "Identity outcome. A non-US place is no_confident_match with coverage out_of_coverage",
    },
    match_confidence: { type: "number", minimum: 0, maximum: 1, description: "Identity match confidence" },
    compass_id: {
      type: ["string", "null"],
      description: "Stable Compass restaurant ID for the matched restaurant, when matched",
    },
    restaurant: { ...restaurantJsonSchema, description: "Matched restaurant, including vegan_dining" },
    match_candidates: {
      type: "array",
      maxItems: 5,
      description: "Unmatched only: possible restaurants. Not a confirmed identity.",
      items: {
        type: "object",
        properties: {
          compass_id: { type: "string" },
          name: { type: "string" },
          match_score: { type: "number", minimum: 0, maximum: 1 },
          address: addressJsonSchema,
        },
        additionalProperties: true,
      },
    },
    coverage: coverageJsonSchema,
    resolution: resolutionJsonSchema,
    evidence: { type: "array", description: "Evidence for the enrichment result", items: evidenceJsonSchema },
    ai_generated: { type: "boolean" },
  },
  required: ["matched"],
  additionalProperties: true,
} as const;

export const decideFitOutputJsonSchema = {
  type: "object",
  description:
    "Compass conservative restaurant dietary fit decision. When a google_place_id does not select one restaurant, the response has resolution and coverage instead of a decision.",
  properties: {
    compass_request_id: { type: "string", description: "Compass request identifier for support and tracing" },
    client_ref: clientRefJsonSchema,
    google_place_id: googlePlaceIdEchoJsonSchema,
    compass_id: { type: "string", description: "Stable Compass restaurant ID" },
    resolution: resolutionJsonSchema,
    coverage: coverageJsonSchema,
    decision: {
      type: "string",
      enum: COMPASS_DECISIONS,
      description: "Conservative decision for the submitted profile",
    },
    confidence: { type: "string", enum: COMPASS_CONFIDENCES, description: "Decision confidence" },
    reason_codes: reasonCodesJsonSchema,
    evidence: { type: "array", description: "Evidence supporting the decision", items: evidenceJsonSchema },
    source_freshness: sourceFreshnessJsonSchema,
    risk_flags: {
      type: "array",
      description: "Risk flags that should be surfaced to the user",
      items: { type: "string", enum: COMPASS_RISK_FLAGS },
    },
    recommended_user_text: { type: "string", description: "Conservative user-facing wording" },
    verification_required: {
      type: "boolean",
      description: "True when the user should verify with the restaurant before relying on the result",
    },
    last_evaluated_at: {
      type: ["string", "null"],
      description: "When Compass last evaluated this restaurant for decision freshness",
    },
    ai_generated: { type: "boolean" },
    human_review_recommended: { type: "boolean" },
  },
  additionalProperties: true,
} as const;
