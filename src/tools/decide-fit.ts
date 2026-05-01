import type { CompassClient } from "../client.js";
import {
  DecideFitInputSchema,
  type DecideFitInput,
  decideFitInputJsonSchema,
} from "../schemas/input.js";
import { handleTool, type ToolDefinition, type ToolResult } from "./types.js";

export interface DecideFitClient {
  decideFit(body: unknown, options?: { mode?: "fast" | "rich" }): Promise<unknown>;
}

export const decideFitTool = {
  definition: {
    name: "compass_decide_fit",
    description:
      'Conservative fit decision for a restaurant against a user dietary profile. Returns "fit", "not_fit", or "unknown" with reason codes, evidence, and user wording. Returns "unknown" rather than overclaiming.',
    inputSchema: decideFitInputJsonSchema,
  } satisfies ToolDefinition,

  handler(client: CompassClient | DecideFitClient, args: unknown): Promise<ToolResult> {
    return handleTool<DecideFitInput>(
      () => DecideFitInputSchema.parse(args),
      ({ mode, ...body }) => client.decideFit(body, { mode }),
    );
  },
};
