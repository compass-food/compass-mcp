import type { CompassClient } from "../client.js";
import {
  SearchInputSchema,
  type SearchInput,
  searchInputJsonSchema,
} from "../schemas/input.js";
import { handleTool, type ToolDefinition, type ToolResult } from "./types.js";

export interface SearchClient {
  search(body: unknown, options?: { mode?: "fast" | "rich" }): Promise<unknown>;
}

export const searchTool = {
  definition: {
    name: "compass_search",
    description:
      'Search restaurants by natural-language dietary query. Returns ranked results with VeganScore, evidence, and confidence. Conservative: returns "unknown" when evidence is insufficient.',
    inputSchema: searchInputJsonSchema,
  } satisfies ToolDefinition,

  handler(client: CompassClient | SearchClient, args: unknown): Promise<ToolResult> {
    return handleTool<SearchInput>(
      () => SearchInputSchema.parse(args),
      ({ mode, ...body }) => client.search(body, { mode }),
    );
  },
};
