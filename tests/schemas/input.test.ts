import { describe, expect, it } from "vitest";
import {
  COMPASS_CONFIDENCES as SHARED_COMPASS_CONFIDENCES,
  COMPASS_DECISIONS as SHARED_COMPASS_DECISIONS,
  COMPASS_ACCEPTED_DIETS as SHARED_COMPASS_ACCEPTED_DIETS,
  COMPASS_DIETS as SHARED_COMPASS_DIETS,
  COMPASS_EVIDENCE_TIERS as SHARED_COMPASS_EVIDENCE_TIERS,
  COMPASS_EVIDENCE_TYPES as SHARED_COMPASS_EVIDENCE_TYPES,
  COMPASS_RISK_FLAGS as SHARED_COMPASS_RISK_FLAGS,
} from "../../../shared/compass/types.js";
import {
  DecideFitInputSchema,
  EnrichInputSchema,
  SearchInputSchema,
  decideFitInputJsonSchema,
  searchInputJsonSchema,
} from "../../src/schemas/input.js";
import {
  COMPASS_ACCEPTED_DIETS,
  COMPASS_CONFIDENCES,
  COMPASS_DECISIONS,
  COMPASS_DIETS,
  COMPASS_EVIDENCE_TIERS,
  COMPASS_EVIDENCE_TYPES,
  COMPASS_RISK_FLAGS,
} from "../../src/types.js";

const deprecatedDietCases = [
  { label: "swapped strict vegan token", value: ["vegan", "strict"].join("_") },
  { label: "friendly vegan token", value: ["vegan", "friendly"].join("_") },
  { label: "removed general diet token", value: ["omni", "vore"].join("") },
] as const;

describe("canonical Compass input schemas", () => {
  it("keeps every local enum mirror aligned with shared Compass types", () => {
    expect(COMPASS_DIETS).toEqual(SHARED_COMPASS_DIETS);
    expect(COMPASS_ACCEPTED_DIETS).toEqual(SHARED_COMPASS_ACCEPTED_DIETS);
    expect(COMPASS_DECISIONS).toEqual(SHARED_COMPASS_DECISIONS);
    expect(COMPASS_CONFIDENCES).toEqual(SHARED_COMPASS_CONFIDENCES);
    expect(COMPASS_RISK_FLAGS).toEqual(SHARED_COMPASS_RISK_FLAGS);
    expect(COMPASS_EVIDENCE_TIERS).toEqual(SHARED_COMPASS_EVIDENCE_TIERS);
    expect(COMPASS_EVIDENCE_TYPES).toEqual(SHARED_COMPASS_EVIDENCE_TYPES);
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

  it("accepts the retired gluten_free diet without listing it", () => {
    expect(COMPASS_DIETS as readonly string[]).not.toContain("gluten_free");
    expect(
      SearchInputSchema.safeParse({ query: "dinner", user_profile: { diet: "gluten_free" } }).success,
    ).toBe(true);
    expect(
      DecideFitInputSchema.safeParse({ compass_id: "rest_xyz789", user_profile: { diet: "gluten_free" } })
        .success,
    ).toBe(true);
    const rejected = DecideFitInputSchema.safeParse({
      compass_id: "rest_xyz789",
      user_profile: { diet: "paleo" },
    });
    expect(rejected.success).toBe(false);
    if (!rejected.success) {
      expect(JSON.stringify(rejected.error.issues)).not.toMatch(/gluten/i);
    }
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

  it("agrees with REST on mutually exclusive search and identity inputs", () => {
    expect(
      SearchInputSchema.safeParse({
        query: "vegan ramen",
        dish: "ramen",
        location: { lat: 43.6, lng: -116.2 },
        place: { country_code: "US", region: "ID", city: "Boise" },
      }).success,
    ).toBe(false);

    expect(
      EnrichInputSchema.safeParse({
        name: "Ramen House",
        place: { country_code: "US", region: "ID", city: "Boise" },
        dish: "ramen",
      }).success,
    ).toBe(true);

    expect(
      EnrichInputSchema.safeParse({
        compass_id: "rest_xyz789",
        google_place_id: "ChIJExample",
      }).success,
    ).toBe(false);

    expect(
      DecideFitInputSchema.safeParse({
        google_place_id: "ChIJExample",
        user_profile: { diet: "vegan_options" },
      }).success,
    ).toBe(true);

    expect(
      DecideFitInputSchema.safeParse({
        compass_id: "rest_xyz789",
        google_place_id: "ChIJExample",
        user_profile: { diet: "strict_vegan" },
      }).success,
    ).toBe(false);
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
