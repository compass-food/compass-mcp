import { z } from "zod";
import { CompassApiError } from "../client.js";
import { ProblemDetailsSchema } from "../schemas/output.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export type ToolResult = CallToolResult;

export interface ToolDefinition {
  name: string;
  title: string;
  description: string;
  inputSchema: object;
  outputSchema: object;
  annotations: {
    title: string;
    readOnlyHint: boolean;
    destructiveHint: boolean;
    idempotentHint: boolean;
    openWorldHint: boolean;
  };
}

export function readOnlyToolAnnotations(title: string): ToolDefinition["annotations"] {
  return {
    title,
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  };
}

export function successResult(data: unknown): ToolResult {
  const result: ToolResult = {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };

  if (isRecord(data)) {
    result.structuredContent = data;
  }

  return result;
}

export function validationErrorResult(error: z.ZodError): ToolResult {
  const details = error.issues.map((issue) => `${issue.path.join(".") || "input"}: ${issue.message}`).join("\n");
  return {
    isError: true,
    content: [{ type: "text", text: `Invalid Compass tool input:\n\n${details}` }],
  };
}

export function apiErrorResult(error: CompassApiError): ToolResult {
  const parsed = ProblemDetailsSchema.safeParse(error.problem);
  const title = parsed.success ? parsed.data.title : error.message;
  const detail = parsed.success ? parsed.data.detail : undefined;
  const requestId = parsed.success ? parsed.data.compass_request_id : undefined;
  const retryAfter = error.retryAfter ? `\n\nRetry after: ${error.retryAfter}` : "";

  return {
    isError: true,
    content: [
      {
        type: "text",
        text: `Compass API error: ${title}\n\nDetails: ${detail ?? "No additional details provided."}\n\nRequest ID: ${requestId ?? "unavailable"}${retryAfter}`,
      },
    ],
  };
}

export function unknownErrorResult(error: unknown): ToolResult {
  const message = error instanceof Error ? error.message : "Unknown error";
  return {
    isError: true,
    content: [{ type: "text", text: `Compass request failed: ${message}` }],
  };
}

export async function handleTool<TInput>(
  parse: () => TInput,
  call: (input: TInput) => Promise<unknown>,
): Promise<ToolResult> {
  try {
    const input = parse();
    const data = await call(input);
    return successResult(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationErrorResult(error);
    }
    if (error instanceof CompassApiError) {
      return apiErrorResult(error);
    }
    return unknownErrorResult(error);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
