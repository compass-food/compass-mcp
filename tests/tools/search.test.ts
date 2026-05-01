import { describe, expect, it, vi } from "vitest";
import { SearchInputSchema } from "../../src/schemas/input.js";
import { searchTool } from "../../src/tools/search.js";

describe("compass_search", () => {
  it("validates the locked input schema", () => {
    const parsed = SearchInputSchema.parse({
      query: "strict vegan ramen in Brooklyn",
      user_profile: {
        diet: "vegan_strict",
        allergens: ["peanut"],
        exclude_cross_contamination: true,
      },
      location: { lat: 40.7, lng: -73.9, radius_m: 5000 },
    });

    expect(parsed.limit).toBe(10);
    expect(parsed.mode).toBe("rich");
  });

  it("rejects invalid limits and radius", () => {
    expect(() =>
      SearchInputSchema.parse({
        query: "vegan tacos",
        limit: 50,
        location: { lat: 40.7, lng: -73.9, radius_m: 100000 },
      }),
    ).toThrow();
  });

  it("calls /v1/search payload with mode removed into request options", async () => {
    const client = {
      search: vi.fn().mockResolvedValue({ results: [] }),
    };

    const result = await searchTool.handler(client, {
      query: "vegan ramen",
      mode: "fast",
      limit: 5,
    });

    expect(client.search).toHaveBeenCalledWith({ query: "vegan ramen", limit: 5 }, { mode: "fast" });
    expect(result.isError).toBeUndefined();
    expect(result.structuredContent).toEqual({ results: [] });
  });
});
