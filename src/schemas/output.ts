import { z } from "zod";

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
    source_type: z.string().optional(),
    source_url: z.string().optional(),
    observed_at: z.string().optional(),
    text: z.string().optional(),
  })
  .passthrough();

export const SourceFreshnessSchema = z
  .object({
    latest_observed_at: z.string().nullable().optional(),
    stale: z.boolean().optional(),
  })
  .passthrough();

export const DecisionFieldsSchema = z
  .object({
    decision: z.enum(["fit", "not_fit", "unknown"]),
    confidence: z.number(),
    reason_codes: z.array(z.string()),
    evidence: z.array(EvidenceSchema),
    source_freshness: SourceFreshnessSchema.optional(),
    risk_flags: z.array(z.string()).optional(),
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
