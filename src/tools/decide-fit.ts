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
      'Conservative fit decision for a restaurant against a user dietary profile. Returns "fit", "not_fit", or "unknown" with reason codes, evidence, and user wording. Returns "unknown" rather than overclaiming.',
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
