import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { AjvJsonSchemaValidator } from "@modelcontextprotocol/sdk/validation/ajv";
import {
  decideFitInputJsonSchema,
  enrichInputJsonSchema,
  searchInputJsonSchema,
} from "../../src/schemas/input.js";
import {
  decideFitOutputJsonSchema,
  enrichOutputJsonSchema,
  searchOutputJsonSchema,
} from "../../src/schemas/output.js";
import { COMPASS_DIETS } from "../../src/types.js";

// The served API contract. MCP tool schemas must expose every contract field
// and must accept every documented response shape, because MCP clients
// validate structuredContent against outputSchema.
type Schema = {
  properties?: Record<string, Schema>;
  required?: string[];
  allOf?: Schema[];
  oneOf?: Schema[];
  enum?: string[];
  example?: unknown;
  "x-examples"?: Record<string, { value: unknown }>;
};

const contract = JSON.parse(
  readFileSync(new URL("../../../daas/api/contracts/openapi.v1.json", import.meta.url), "utf8"),
) as { info: { version: string }; components: { schemas: Record<string, Schema> } };
const schemas = contract.components.schemas;

function propertyNames(name: string): string[] {
  const schema = schemas[name] as Schema;
  const parts = schema.allOf ?? [schema];
  return parts.flatMap((part) => {
    const ref = (part as { $ref?: string }).$ref;
    return ref ? propertyNames(ref.split("/").at(-1) as string) : Object.keys(part.properties ?? {});
  });
}

function requiredIn(name: string): string[] {
  return schemas[name]?.required ?? [];
}

const validator = new AjvJsonSchemaValidator();
function expectValid(schema: object, payload: unknown): void {
  const result = validator.getValidator(schema as never)(payload);
  expect(result.errorMessage).toBeUndefined();
  expect(result.valid).toBe(true);
}

const coverage = { status: "in_coverage", covered_geography: "US" };
const address = { street: null, city: "Portland", state: "OR", postal_code: null, country: "US" };

describe("MCP tool schemas match API contract", () => {
  it("is checked against contract 1.22.0 or newer", () => {
    const [major, minor] = contract.info.version.split(".").map(Number);
    expect(major === 1 && (minor ?? 0) >= 22).toBe(true);
  });

  it("lists exactly the contract diets", () => {
    expect([...COMPASS_DIETS]).toEqual(schemas.Diet?.enum);
  });

  it.each([
    ["SearchRequest", searchInputJsonSchema],
    ["EnrichRequest", enrichInputJsonSchema],
    ["DecisionRequest", decideFitInputJsonSchema],
  ] as const)("exposes every %s field and nothing else but mode", (name, schema) => {
    const mcp = Object.keys(schema.properties).filter((key) => key !== "mode").sort();
    expect(mcp).toEqual(propertyNames(name).sort());
  });

  it.each([
    ["SearchResponse", [searchOutputJsonSchema], ["SearchResponse"]],
    ["Enrich", [enrichOutputJsonSchema], ["EnrichResponseMatched", "EnrichResponseUnmatched"]],
    ["Decide", [decideFitOutputJsonSchema], ["DecisionResponse", "DecisionIdentifierOutcome"]],
  ] as const)("%s output describes every contract field", (_label, [schema], contractNames) => {
    const mcp = Object.keys(schema.properties);
    for (const name of contractNames) {
      expect(mcp).toEqual(expect.arrayContaining(propertyNames(name)));
    }
  });

  it("search results describe every restaurant field", () => {
    const item = searchOutputJsonSchema.properties.results.items;
    expect(Object.keys(item.properties)).toEqual(expect.arrayContaining(propertyNames("SearchResult")));
    const restaurant = enrichOutputJsonSchema.properties.restaurant;
    expect(Object.keys(restaurant.properties)).toEqual(expect.arrayContaining(propertyNames("EnrichRestaurant")));
  });

  it("requires only fields every documented response shape carries", () => {
    const cases = [
      [searchOutputJsonSchema, ["SearchResponse"]],
      [enrichOutputJsonSchema, ["EnrichResponseMatched", "EnrichResponseUnmatched"]],
      [decideFitOutputJsonSchema, ["DecisionResponse", "DecisionIdentifierOutcome"]],
    ] as const;
    for (const [schema, names] of cases) {
      const required = (schema as { required?: readonly string[] }).required ?? [];
      for (const name of names) {
        expect(requiredIn(name)).toEqual(expect.arrayContaining([...required]));
      }
    }
  });

  it("accepts the contract response examples", () => {
    expectValid(searchOutputJsonSchema, schemas.SearchResponse?.example);
    for (const example of Object.values(schemas.EnrichResponseMatched?.["x-examples"] ?? {})) {
      expectValid(enrichOutputJsonSchema, example.value);
    }
    for (const example of Object.values(schemas.DecisionResponse?.["x-examples"] ?? {})) {
      expectValid(decideFitOutputJsonSchema, example.value);
    }
  });

  it("accepts a Decide identifier outcome, which has no decision", () => {
    expectValid(decideFitOutputJsonSchema, {
      compass_request_id: "req_1",
      google_place_id: "ChIJ-unmapped",
      resolution: { status: "ambiguous", compass_ids: ["a", "b"] },
      coverage: { ...coverage, status: "coverage_unknown" },
      ai_generated: true,
    });
  });

  it("accepts an unmatched Enrich response with match candidates", () => {
    expectValid(enrichOutputJsonSchema, {
      compass_request_id: "req_2",
      matched: false,
      identity_status: "ambiguous",
      match_confidence: 0.4,
      compass_id: null,
      match_candidates: [{ compass_id: "a", name: "Blossom", match_score: 0.4, address }],
      coverage,
      ai_generated: true,
    });
  });

  it("accepts a no_match dish Search with nearest_match and dish blocks", () => {
    expectValid(searchOutputJsonSchema, {
      compass_request_id: "req_3",
      client_ref: "",
      coverage,
      results: [],
      result_status: "no_match",
      total_results: 0,
      nearest_match: {
        compass_id: "a",
        name: null,
        address,
        coordinates: { lat: 45.5, lng: -122.6 },
        matching_dishes: [{ name: "Tofu pho", category: null, match_type: "variant", is_vegan: true }],
        distance_km: 12.5,
      },
      query_interpretation: { diet_inferred: null, dish_inferred: "pho", dish_source: "explicit" },
      ai_generated: true,
    });
  });

  it("accepts additive fields the contract may add later", () => {
    expectValid(searchOutputJsonSchema, {
      results: [],
      named_match: { status: "confident", target: "Blossom", compass_ids: ["a"], future_field: 1 },
      future_field: true,
    });
  });
});
