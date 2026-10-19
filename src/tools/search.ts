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
      'Search restaurants by natural-language query. Pass an explicit dish in dish, and the destination as place (country_code, region, city) or location (lat, lng), not both. Compass covers the 50 US states and DC and returns vegan_dining for the vegan dishes relevant to the request, not a complete menu. Price, hours, and ingredient exclusions are unsupported. Restaurant-name queries also return named_match. Religious and medical diets do not establish a supported vegan verdict.',
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
