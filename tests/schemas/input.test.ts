// Public-repo equivalent of the monorepo cross-file drift guard at
// compass-food/VeganMapAI:compass-mcp/tests/schemas/input.test.ts.
//
// The monorepo test imports COMPASS_DIETS from shared/compass/types.ts to
// catch drift between the published MCP package and the canonical Compass
// API contract. The public repo cannot reach shared/, so this test inlines
// the canonical contract as EXPECTED_* constants.
//
// IMPORTANT: these constants must stay byte-for-byte identical to the
// canonical source-of-truth at compass-food/VeganMapAI:shared/compass/types.ts
// (and shared/reasonCodes.ts) until canonical-source unification is decided.
// If the canonical contract changes, update this file and src/types.ts in
// the same release.
import { describe, expect, it } from "vitest";
import {
  DecideFitInputSchema,
  SearchInputSchema,
  decideFitInputJsonSchema,
  searchInputJsonSchema,
} from "../../src/schemas/input.js";
import {
  COMPASS_CONFIDENCES,
  COMPASS_DECISIONS,
  COMPASS_DIETS,
  COMPASS_EVIDENCE_TIERS,
  COMPASS_EVIDENCE_TYPES,
  COMPASS_RISK_FLAGS,
} from "../../src/types.js";

const EXPECTED_DIETS = [
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

const EXPECTED_DECISIONS = ["fit", "not_fit", "unknown"] as const;

const EXPECTED_CONFIDENCES = ["high", "medium", "low"] as const;

const EXPECTED_RISK_FLAGS = [
  "cross_contamination_risk",
  "limited_evidence",
  "stale_data",
  "third_party_unverified",
  "user_report_only",
  "language_barrier",
] as const;

const EXPECTED_EVIDENCE_TIERS = ["A", "B"] as const;

const EXPECTED_EVIDENCE_TYPES = [
  "menu_item",
  "review_signal",
  "external_source",
  "user_report",
  "restaurant_declared",
] as const;

const deprecatedDietCases = [
  { label: "swapped strict vegan token", value: ["vegan", "strict"].join("_") },
  { label: "friendly vegan token", value: ["vegan", "friendly"].join("_") },
  { label: "removed general diet token", value: ["omni", "vore"].join("") },
] as const;

describe("canonical Compass input schemas", () => {
  it("keeps the local diet mirror aligned with the canonical Compass contract", () => {
    expect(COMPASS_DIETS).toEqual(EXPECTED_DIETS);
  });

  it("keeps the local decision mirror aligned with the canonical Compass contract", () => {
    expect(COMPASS_DECISIONS).toEqual(EXPECTED_DECISIONS);
  });

  it("keeps the local confidence mirror aligned with the canonical Compass contract", () => {
    expect(COMPASS_CONFIDENCES).toEqual(EXPECTED_CONFIDENCES);
  });

  it("keeps the local risk-flag mirror aligned with the canonical Compass contract", () => {
    expect(COMPASS_RISK_FLAGS).toEqual(EXPECTED_RISK_FLAGS);
  });

  it("keeps the local evidence-tier mirror aligned with the canonical Compass contract", () => {
    expect(COMPASS_EVIDENCE_TIERS).toEqual(EXPECTED_EVIDENCE_TIERS);
  });

  it("keeps the local evidence-type mirror aligned with the canonical Compass contract", () => {
    expect(COMPASS_EVIDENCE_TYPES).toEqual(EXPECTED_EVIDENCE_TYPES);
  });

  it("exposes every canonical diet value in MCP JSON schemas", () => {
    expect(searchInputJsonSchema.properties.user_profile.properties.diet.enum).toEqual(COMPASS_DIETS);
    expect(decideFitInputJsonSchema.properties.user_profile.properties.diet.enum).toEqual(COMPASS_DIETS);
  });

  it.each(COMPASS_DIETS)("accepts canonical diet value %s", (diet) => {
    expect(() =>
      SearchInputSchema.parse({
        query: "dinner near me",
        user_profile: { diet },
      }),
    ).not.toThrow();

    expect(() =>
      DecideFitInputSchema.parse({
        compass_id: "rest_xyz789",
        user_profile: { diet },
      }),
    ).not.toThrow();
  });

  it.each(deprecatedDietCases)("rejects deprecated diet alias: $label", ({ value }) => {
    const result = DecideFitInputSchema.safeParse({
      compass_id: "rest_xyz789",
      user_profile: { diet: value },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message).join("\n")).toContain("diet must be one of");
      expect(result.error.issues.map((issue) => issue.message).join("\n")).toContain("strict_vegan");
    }
  });

  it("rejects stale request field names instead of stripping them", () => {
    const staleRestaurantField = ["restaurant", "id"].join("_");
    const staleProfileField = ["dietary", "profile"].join("_");

    expect(
      DecideFitInputSchema.safeParse({
        [staleRestaurantField]: "rest_xyz789",
        user_profile: { diet: "strict_vegan" },
      }).success,
    ).toBe(false);

    expect(
      DecideFitInputSchema.safeParse({
        compass_id: "rest_xyz789",
        [staleProfileField]: { diet: "strict_vegan" },
      }).success,
    ).toBe(false);
  });
});
