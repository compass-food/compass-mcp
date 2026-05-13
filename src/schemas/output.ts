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

export const EvidenceSchema = z
  .object({
    evidence_id: z.string().optional(),
    type: z.enum(COMPASS_EVIDENCE_TYPES).optional(),
    source: z.string().optional(),
    fetched_at: z.string().optional(),
    excerpt: z.string().optional(),
    weight: z.enum(["primary", "supporting"]).optional(),
    tier: z.enum(COMPASS_EVIDENCE_TIERS).optional(),
    paraphrase_method: z.enum(["automatic", "manual", "none"]).optional(),
  })
  .passthrough();

export const SourceFreshnessSchema = z
  .object({
    oldest_signal_age_days: z.number().optional(),
    newest_signal_age_days: z.number().optional(),
    recommended_refresh: z.boolean().optional(),
  })
  .passthrough();

export const DecisionFieldsSchema = z
  .object({
    decision: z.enum(COMPASS_DECISIONS),
    confidence: z.enum(COMPASS_CONFIDENCES),
    reason_codes: z.array(z.string()),
    evidence: z.array(EvidenceSchema),
    source_freshness: SourceFreshnessSchema.optional(),
    risk_flags: z.array(z.enum(COMPASS_RISK_FLAGS)).optional(),
    recommended_user_text: z.string().optional(),
    verification_required: z.boolean().optional(),
    compass_request_id: z.string().optional(),
  })
  .passthrough();

export const RestaurantSchema = z
  .object({
    compass_id: z.string(),
    name: z.string().optional(),
    coordinates: z
      .object({
        lat: z.number(),
        lng: z.number(),
      })
      .optional(),
  })
  .passthrough();

export const SearchResponseSchema = z
  .object({
    compass_request_id: z.string().optional(),
    results: z.array(z.unknown()),
  })
  .passthrough();

export const EnrichResponseSchema = z
  .object({
    matched: z.boolean(),
    compass_id: z.string().nullable().optional(),
  })
  .passthrough();

export const DecisionResponseSchema = DecisionFieldsSchema.extend({
  compass_id: z.string(),
});

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
    fetched_at: { type: "string", description: "When Compass fetched or observed the evidence, when available" },
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
  description: "Age and refresh guidance for the evidence behind a result",
  properties: {
    oldest_signal_age_days: { type: "number", description: "Age in days of the oldest supporting signal" },
    newest_signal_age_days: { type: "number", description: "Age in days of the newest supporting signal" },
    recommended_refresh: { type: "boolean", description: "Whether Compass recommends refreshing the evidence" },
  },
  additionalProperties: true,
} as const;

const dietaryProfileJsonSchema = {
  type: "object",
  description:
    "Public restaurant dietary facts supported by launch evidence. Compass does not expose allergen-safe or certification claims.",
  properties: {
    fully_vegan: { type: ["boolean", "null"], description: "Whether the restaurant appears fully vegan" },
    vegan_friendly: { type: ["boolean", "null"], description: "Whether the restaurant has vegan-friendly evidence" },
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
    reason_codes: {
      type: "array",
      description: "Compass public reason codes explaining the decision",
      items: { type: "string" },
    },
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

const restaurantJsonSchema = {
  type: "object",
  description: "Compass restaurant result",
  properties: {
    compass_id: { type: "string", description: "Stable Compass restaurant ID" },
    name: { type: ["string", "null"], description: "Restaurant name" },
    address: { type: "object", description: "Restaurant address, when available", additionalProperties: true },
    coordinates: {
      type: "object",
      description: "Restaurant coordinates, when available",
      properties: {
        lat: { type: ["number", "null"], description: "Latitude" },
        lng: { type: ["number", "null"], description: "Longitude" },
      },
      additionalProperties: true,
    },
    vegan_score: veganScoreJsonSchema,
    dietary_profile: dietaryProfileJsonSchema,
    cuisine_types: {
      type: "array",
      description: "Cuisine labels associated with the restaurant",
      items: { type: "string" },
    },
    evidence: {
      type: "array",
      description: "Evidence available for this restaurant result",
      items: evidenceJsonSchema,
    },
    source_freshness: sourceFreshnessJsonSchema,
    distance_m: {
      type: "number",
      minimum: 0,
      description: "Distance in meters from the requested location, when location is supplied",
    },
    match_for_profile: matchForProfileJsonSchema,
    last_evaluated_at: {
      type: ["string", "null"],
      description: "When Compass last evaluated this restaurant for scoring and decision freshness",
    },
  },
  additionalProperties: true,
} as const;

export const searchOutputJsonSchema = {
  type: "object",
  description: "Compass restaurant search response",
  properties: {
    compass_request_id: { type: "string", description: "Compass request identifier for support and tracing" },
    results: {
      type: "array",
      description: "Ranked Compass restaurant results",
      items: restaurantJsonSchema,
    },
    query_interpretation: {
      type: "object",
      description: "Best-effort interpretation of the submitted search query",
      additionalProperties: true,
    },
  },
  required: ["results"],
  additionalProperties: true,
} as const;

export const enrichOutputJsonSchema = {
  type: "object",
  description: "Compass restaurant enrichment response",
  properties: {
    matched: {
      type: "boolean",
      description: "Whether Compass confidently matched the submitted restaurant",
    },
    compass_id: {
      type: ["string", "null"],
      description: "Stable Compass restaurant ID for the matched restaurant, when matched",
    },
    restaurant: restaurantJsonSchema,
    candidates: {
      type: "array",
      description: "Candidate matches returned when confidence is below threshold",
      items: restaurantJsonSchema,
    },
    confidence: { type: "string", enum: COMPASS_CONFIDENCES, description: "Match confidence when available" },
    vegan_score: veganScoreJsonSchema,
    dietary_profile: dietaryProfileJsonSchema,
    evidence: { type: "array", description: "Evidence for the enrichment result", items: evidenceJsonSchema },
  },
  required: ["matched"],
  additionalProperties: true,
} as const;

export const decideFitOutputJsonSchema = {
  type: "object",
  description: "Compass conservative restaurant dietary fit decision",
  properties: {
    compass_id: { type: "string", description: "Stable Compass restaurant ID" },
    decision: {
      type: "string",
      enum: COMPASS_DECISIONS,
      description: "Conservative decision for the submitted profile",
    },
    confidence: { type: "string", enum: COMPASS_CONFIDENCES, description: "Decision confidence" },
    reason_codes: {
      type: "array",
      description: "Compass public reason codes explaining the decision",
      items: { type: "string" },
    },
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
  },
  required: ["compass_id", "decision", "confidence", "reason_codes", "evidence"],
  additionalProperties: true,
} as const;
