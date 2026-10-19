import type { CompassClient } from "../client.js";
import {
  DecideFitInputSchema,
  type DecideFitInput,
  decideFitInputJsonSchema,
} from "../schemas/input.js";
import { decideFitOutputJsonSchema } from "../schemas/output.js";
import { handleTool, readOnlyToolAnnotations, type ToolDefinition, type ToolResult } from "./types.js";

export interface DecideFitClient {
  decideFit(body: unknown, options?: { mode?: "fast" | "rich" }): Promise<unknown>;
}

export const decideFitTool = {
  definition: {
    name: "compass_decide_fit",
    title: "Decide restaurant fit",
    description:
      'Conservative fit decision for one restaurant against a user dietary profile. Send exactly one of compass_id or google_place_id, plus an optional client_ref. Returns "fit", "not_fit", or "unknown". Compass judges strict_vegan (and its alias vegan_options) and vegetarian; other accepted diets always return unknown with DIET_NOT_SUPPORTED. source_freshness has signal ages only.',
    inputSchema: decideFitInputJsonSchema,
    outputSchema: decideFitOutputJsonSchema,
    annotations: readOnlyToolAnnotations("Decide restaurant fit"),
  } satisfies ToolDefinition,

  handler(client: CompassClient | DecideFitClient, args: unknown): Promise<ToolResult> {
    return handleTool<DecideFitInput>(
      () => DecideFitInputSchema.parse(args),
      ({ mode, ...body }) => client.decideFit(body, { mode }),
    );
  },
};
