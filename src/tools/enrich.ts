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
      'Match a restaurant by compass_id, name plus address or Google Place ID, or name plus place. Returns vegan_dining for the vegan dishes relevant to the request, not a complete menu. Send one exact identifier, not both compass_id and google_place_id. matched is true only when identity_status is resolved.',
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
