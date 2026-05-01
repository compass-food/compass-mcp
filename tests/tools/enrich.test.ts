import { describe, expect, it, vi } from "vitest";
import { EnrichInputSchema } from "../../src/schemas/input.js";
import { enrichTool } from "../../src/tools/enrich.js";

describe("compass_enrich_restaurant", () => {
  it("validates name with address", () => {
    expect(
      EnrichInputSchema.parse({
        name: "Buddha Bodai",
        address: "5 Mott St, New York, NY",
      }),
    ).toEqual({
      name: "Buddha Bodai",
      address: "5 Mott St, New York, NY",
    });
  });

  it("requires address or google_place_id", () => {
    expect(() => EnrichInputSchema.parse({ name: "Buddha Bodai" })).toThrow("Either address or google_place_id is required");
  });

  it("calls /v1/enrich/restaurant payload unchanged", async () => {
    const client = {
      enrichRestaurant: vi.fn().mockResolvedValue({ matched: false, candidates: [] }),
    };

    const result = await enrichTool.handler(client, {
      name: "Buddha Bodai",
      google_place_id: "place_123",
    });

    expect(client.enrichRestaurant).toHaveBeenCalledWith({
      name: "Buddha Bodai",
      google_place_id: "place_123",
    });
    expect(result.structuredContent).toEqual({ matched: false, candidates: [] });
  });
});
