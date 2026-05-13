import type { CompassClient } from "../client.js";
import {
  EnrichInputSchema,
  type EnrichInput,
  enrichInputJsonSchema,
} from "../schemas/input.js";
import { enrichOutputJsonSchema } from "../schemas/output.js";
import { handleTool, readOnlyToolAnnotations, type ToolDefinition, type ToolResult } from "./types.js";

export interface EnrichClient {
  enrichRestaurant(body: unknown): Promise<unknown>;
}

export const enrichTool = {
  definition: {
    name: "compass_enrich_restaurant",
    title: "Enrich restaurant",
    description:
      'Match a restaurant by name and address, then return Compass enrichment data including VeganScore, vegan dietary profile, and evidence. Does not return certification/free-from facts. Returns "matched: false" with candidates if confidence is below threshold.',
    inputSchema: enrichInputJsonSchema,
    outputSchema: enrichOutputJsonSchema,
    annotations: readOnlyToolAnnotations("Enrich restaurant"),
  } satisfies ToolDefinition,

  handler(client: CompassClient | EnrichClient, args: unknown): Promise<ToolResult> {
    return handleTool<EnrichInput>(
      () => EnrichInputSchema.parse(args),
      (body) => client.enrichRestaurant(body),
    );
  },
};
