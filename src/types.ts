// MIRROR OF shared/compass/types.ts - must stay in sync.
// The published MCP package is self-contained and cannot depend on the
// monorepo-local shared/ directory at runtime. Tests compare this mirror with
// the canonical shared file so drift fails before publish.

// Public diet values: the contract `Diet` enum and metadata
// `supported_enums.diets`. Religious-diet values do not imply public
// certification restaurant response facts.
export const COMPASS_DIETS = [
  "strict_vegan",
  "vegan_options",
  "vegetarian",
  "pescatarian",
  "halal",
  "kosher",
  "low_fodmap",
] as const;

export type CompassPublicDiet = (typeof COMPASS_DIETS)[number];

/**
 * Retired diet values. Still accepted so older clients do not error, but never
 * assessed and never listed in the tool schemas or descriptions.
 */
export const COMPASS_RETIRED_DIETS = ["gluten_free"] as const;

/** Every diet value a request may send. */
export const COMPASS_ACCEPTED_DIETS = [...COMPASS_DIETS, ...COMPASS_RETIRED_DIETS] as const;

export type CompassDiet = (typeof COMPASS_ACCEPTED_DIETS)[number];

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
  fully_vegan_only?: boolean;
  exclude_cross_contamination?: boolean;
  dietary_rules?: string[];
}

export interface CompassSearchPlaceApi {
  country_code: string;
  region?: string;
  city?: string;
  radius_m?: number;
}

export interface CompassSearchRequestApi {
  query: string;
  dish?: string;
  user_profile?: CompassUserProfileApi;
  location?: {
    lat: number;
    lng: number;
    radius_m?: number;
  };
  place?: CompassSearchPlaceApi;
  limit?: number;
  include_evidence?: boolean;
  include_cuisine_matches?: boolean;
  client_ref?: string;
}

export interface CompassEnrichPlaceApi {
  country_code: string;
  region: string;
  city: string;
}

export interface CompassEnrichRequestApi {
  compass_id?: string;
  name?: string;
  address?: string;
  google_place_id?: string;
  dish?: string;
  user_profile?: CompassUserProfileApi;
  place?: CompassEnrichPlaceApi;
  client_ref?: string;
}

export interface CompassDecisionRequestApi {
  compass_id?: string;
  google_place_id?: string;
  user_profile: CompassUserProfileApi & { diet: CompassDiet };
  client_ref?: string;
}

export type CompassMode = "fast" | "rich";
