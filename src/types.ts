// MIRROR OF shared/compass/types.ts - must stay in sync.
// The published MCP package is self-contained and cannot depend on the
// monorepo-local shared/ directory at runtime. Tests compare this mirror with
// the canonical shared file so drift fails before publish.

export const COMPASS_DIETS = [
  "strict_vegan",
  "vegetarian",
  "pescatarian",
  "gluten_free",
  "halal",
  "kosher",
  "low_fodmap",
  "nut_free",
  "dairy_free",
  "egg_free",
  "shellfish_free",
] as const;

export type CompassDiet = (typeof COMPASS_DIETS)[number];

export const COMPASS_DECISIONS = ["fit", "not_fit", "unknown"] as const;
export type CompassDecision = (typeof COMPASS_DECISIONS)[number];

export const COMPASS_CONFIDENCES = ["high", "medium", "low"] as const;
export type CompassConfidence = (typeof COMPASS_CONFIDENCES)[number];

export const COMPASS_RISK_FLAGS = [
  "cross_contamination_risk",
  "limited_evidence",
  "stale_data",
  "third_party_unverified",
  "user_report_only",
  "language_barrier",
] as const;

export type CompassRiskFlag = (typeof COMPASS_RISK_FLAGS)[number];

export const COMPASS_EVIDENCE_TIERS = ["A", "B"] as const;
export type CompassEvidenceTier = (typeof COMPASS_EVIDENCE_TIERS)[number];

export const COMPASS_EVIDENCE_TYPES = [
  "menu_item",
  "review_signal",
  "external_source",
  "user_report",
  "restaurant_declared",
] as const;

export type CompassEvidenceType = (typeof COMPASS_EVIDENCE_TYPES)[number];

export interface CompassUserProfileApi {
  diet?: CompassDiet;
  allergens?: string[];
  exclude_cross_contamination?: boolean;
  dietary_rules?: string[];
}

export interface CompassSearchRequestApi {
  query: string;
  user_profile?: CompassUserProfileApi;
  location?: {
    lat: number;
    lng: number;
    radius_m?: number;
  };
  limit?: number;
  include_evidence?: boolean;
}

export interface CompassEnrichRequestApi {
  compass_id?: string;
  name?: string;
  address?: string;
  google_place_id?: string;
}

export interface CompassDecisionRequestApi {
  compass_id: string;
  user_profile: CompassUserProfileApi & { diet: CompassDiet };
}

export type CompassMode = "fast" | "rich";
