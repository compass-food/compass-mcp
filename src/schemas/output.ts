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
