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

  it("validates direct compass_id lookup", () => {
    expect(
      EnrichInputSchema.parse({
        compass_id: "rest_xyz789",
      }),
    ).toEqual({
      compass_id: "rest_xyz789",
    });
  });

  it("requires address or google_place_id", () => {
    expect(() => EnrichInputSchema.parse({ name: "Buddha Bodai" })).toThrow(
      "Provide compass_id, or name plus address or google_place_id",
    );
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
