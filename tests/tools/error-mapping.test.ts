import { describe, expect, it, vi } from "vitest";
import { CompassApiError } from "../../src/client.js";
import { searchTool } from "../../src/tools/search.js";

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
    expect(result.content[0]?.text).toContain("Compass API error: Invalid request");
    expect(result.content[0]?.text).toContain("Request ID: req_abc");
  });
});
