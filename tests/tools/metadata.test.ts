import { describe, expect, it } from "vitest";
import { ListToolsResultSchema } from "@modelcontextprotocol/sdk/types.js";
import { decideFitTool } from "../../src/tools/decide-fit.js";
import { enrichTool } from "../../src/tools/enrich.js";
import { searchTool } from "../../src/tools/search.js";

const tools = [searchTool.definition, enrichTool.definition, decideFitTool.definition] as const;

function expectPropertyDescriptions(schema: object, path = "input"): void {
  const properties = "properties" in schema ? schema.properties : undefined;
  if (!properties || typeof properties !== "object") {
    return;
  }

  for (const [name, property] of Object.entries(properties)) {
    expect(property, `${path}.${name}`).toMatchObject({
      description: expect.any(String),
    });

    if (property && typeof property === "object" && "properties" in property) {
      expectPropertyDescriptions(property, `${path}.${name}`);
    }
  }
}

describe("tool metadata", () => {
  it("describes every tool parameter for MCP registries", () => {
    for (const tool of tools) {
      expectPropertyDescriptions(tool.inputSchema, tool.name);
    }
  });

  it("declares structured output schemas for every tool", () => {
    for (const tool of tools) {
      expect(tool.outputSchema).toMatchObject({
        type: "object",
        description: expect.any(String),
        properties: expect.any(Object),
      });
    }
  });

  it("keeps tool definitions valid for the MCP SDK list-tools result", () => {
    expect(ListToolsResultSchema.safeParse({ tools }).success).toBe(true);
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
