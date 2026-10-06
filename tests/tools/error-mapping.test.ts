import { describe, expect, it, vi } from "vitest";
import { MISSING_API_KEY_MESSAGE } from "../../src/auth.js";
import { CompassApiError } from "../../src/client.js";
import { decideFitInputJsonSchema, DecideFitInputSchema } from "../../src/schemas/input.js";
import { searchTool } from "../../src/tools/search.js";
import { apiErrorResult, unknownErrorResult } from "../../src/tools/types.js";

describe("tool error mapping", () => {
  it("maps validation errors to MCP error results", async () => {
    const result = await searchTool.handler({ search: vi.fn() }, { query: "", limit: 50 });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain("Invalid Compass tool input");
  });

  it("maps RFC 7807 API errors to MCP error results", async () => {
    const client = {
      search: vi.fn().mockRejectedValue(
        new CompassApiError(
          "Bad request",
          400,
          {
            type: "/errors/invalid-request",
            title: "Invalid request",
            status: 400,
            detail: "Query is required.",
            compass_request_id: "req_abc",
          },
        ),
      ),
    };

    const result = await searchTool.handler(client, { query: "vegan ramen" });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain("Query is required.");
    expect(result.content[0]?.text).toContain("Compass API error: Invalid request");
    expect(result.content[0]?.text).toContain("Request ID: req_abc");
  });

  it("returns the missing-key signpost without an extra wrapper", () => {
    const result = unknownErrorResult(new Error(MISSING_API_KEY_MESSAGE));
    expect(result.content[0]?.text).toBe(MISSING_API_KEY_MESSAGE);
    expect(result.content[0]?.text).not.toContain("Compass request failed:");
  });

  it("keeps an expired-key recovery URL in the API message", () => {
    const result = apiErrorResult(
      new CompassApiError("Key expired", 403, {
        type: "/errors/provisional-key-expired",
        title: "Sandbox key expired",
        status: 403,
        detail: "This sandbox key expired. Request a new confirmation link.",
        recoveryUrl: "https://compassfoodtechnologies.com/signup/recover",
      }),
    );
    expect(result.content[0]?.text).toContain("This sandbox key expired. Request a new confirmation link.");
    expect(result.content[0]?.text).toContain("https://compassfoodtechnologies.com/signup/recover");
  });

  it("advertises a false cross-contamination default and can forward a strict vegan fit", () => {
    const parsed = DecideFitInputSchema.parse({
      compass_id: "rest_xyz789",
      user_profile: { diet: "strict_vegan" },
    });
    expect(parsed.user_profile.exclude_cross_contamination).toBe(false);
    expect(
      decideFitInputJsonSchema.properties.user_profile.properties.exclude_cross_contamination.default,
    ).toBe(false);
  });
});
