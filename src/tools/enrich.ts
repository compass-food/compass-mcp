import type { CompassClient } from "../client.js";
import {
  EnrichInputSchema,
  type EnrichInput,
  enrichInputJsonSchema,
} from "../schemas/input.js";
import { handleTool, type ToolDefinition, type ToolResult } from "./types.js";

export interface EnrichClient {
  enrichRestaurant(body: unknown): Promise<unknown>;
}

export const enrichTool = {
  definition: {
    name: "compass_enrich_restaurant",
    description:
      'Match a restaurant by name and address, then return Compass enrichment data including VeganScore, dietary profile, and evidence. Returns "matched: false" with candidates if confidence is below threshold.',
    inputSchema: enrichInputJsonSchema,
  } satisfies ToolDefinition,

  handler(client: CompassClient | EnrichClient, args: unknown): Promise<ToolResult> {
    return handleTool<EnrichInput>(
      () => EnrichInputSchema.parse(args),
      (body) => client.enrichRestaurant(body),
    );
  },
};
