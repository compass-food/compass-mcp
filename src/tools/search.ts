import type { CompassClient } from "../client.js";
import {
  SearchInputSchema,
  type SearchInput,
  searchInputJsonSchema,
} from "../schemas/input.js";
import { searchOutputJsonSchema } from "../schemas/output.js";
import { handleTool, readOnlyToolAnnotations, type ToolDefinition, type ToolResult } from "./types.js";

export interface SearchClient {
  search(body: unknown, options?: { mode?: "fast" | "rich" }): Promise<unknown>;
}

export const searchTool = {
  definition: {
    name: "compass_search",
    title: "Search restaurants",
    description:
      'Search restaurants by natural-language dietary query. Returns ranked results with VeganScore, evidence, and confidence. Conservative: returns "unknown" when evidence is insufficient and does not return certification/free-from facts.',
    inputSchema: searchInputJsonSchema,
    outputSchema: searchOutputJsonSchema,
    annotations: readOnlyToolAnnotations("Search restaurants"),
  } satisfies ToolDefinition,

  handler(client: CompassClient | SearchClient, args: unknown): Promise<ToolResult> {
    return handleTool<SearchInput>(
      () => SearchInputSchema.parse(args),
      ({ mode, ...body }) => client.search(body, { mode }),
    );
  },
};
