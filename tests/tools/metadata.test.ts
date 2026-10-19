import { describe, expect, it } from "vitest";
import { ListToolsResultSchema } from "@modelcontextprotocol/sdk/types.js";
import { decideFitTool } from "../../src/tools/decide-fit.js";
import { enrichTool } from "../../src/tools/enrich.js";
import { searchTool } from "../../src/tools/search.js";

const tools = [searchTool.definition, enrichTool.definition, decideFitTool.definition] as const;

describe("tool metadata", () => {
  it("keeps tool definitions valid for the MCP SDK list-tools result", () => {
    expect(ListToolsResultSchema.safeParse({ tools }).success).toBe(true);
  });

  it("exposes no Refresh tool and no refresh-recommended marker", () => {
    expect(tools.map((tool) => tool.name)).toEqual([
      "compass_search",
      "compass_enrich_restaurant",
      "compass_decide_fit",
    ]);
    const serialized = JSON.stringify(tools);
    expect(serialized).not.toMatch(/\/v1\/refresh/);
    expect(serialized).not.toMatch(/recommended_refresh/);
  });

  it("lists no allergen or gluten vocabulary except the plain disclaimer", () => {
    const disclaimer = "Compass is not an allergen or safety service.";
    const serialized = JSON.stringify(tools);
    const hits = serialized.match(/\ballerg|gluten|celiac|coeliac/gi) ?? [];
    const disclaimers = serialized.split(disclaimer).length - 1;
    expect(disclaimers).toBeGreaterThan(0);
    expect(hits).toHaveLength(disclaimers);
    expect(serialized.split(disclaimer).join("")).not.toMatch(/\ballerg|gluten|celiac|coeliac/i);
  });

  it("marks Compass tools as read-only open-world lookups", () => {
    for (const tool of tools) {
      expect(tool.annotations).toEqual({
        title: expect.any(String),
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      });
    }
  });
});
