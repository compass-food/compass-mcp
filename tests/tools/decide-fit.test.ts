import { describe, expect, it, vi } from "vitest";
import { DecideFitInputSchema } from "../../src/schemas/input.js";
import { decideFitTool } from "../../src/tools/decide-fit.js";

describe("compass_decide_fit", () => {
  it("validates the locked decision input schema", () => {
    const parsed = DecideFitInputSchema.parse({
      compass_id: "rest_xyz789",
      user_profile: {
        diet: "vegan_strict",
      },
    });

    expect(parsed.mode).toBe("rich");
    expect(parsed.user_profile.exclude_cross_contamination).toBe(true);
  });

  it("requires compass_id and user_profile.diet", () => {
    expect(() => DecideFitInputSchema.parse({ compass_id: "" })).toThrow();
  });

  it("calls /v1/decision/restaurant-fit payload with mode removed into request options", async () => {
    const client = {
      decideFit: vi.fn().mockResolvedValue({
        decision: "unknown",
        confidence: 0.4,
        reason_codes: [],
        evidence: [],
      }),
    };

    const result = await decideFitTool.handler(client, {
      compass_id: "rest_xyz789",
      user_profile: {
        diet: "vegan_strict",
        exclude_cross_contamination: true,
      },
      mode: "fast",
    });

    expect(client.decideFit).toHaveBeenCalledWith(
      {
        compass_id: "rest_xyz789",
        user_profile: {
          diet: "vegan_strict",
          exclude_cross_contamination: true,
        },
      },
      { mode: "fast" },
    );
    expect(result.isError).toBeUndefined();
  });
});
