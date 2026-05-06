#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { resolveApiKey, resolveBaseUrl } from "./auth.js";
import { CompassClient } from "./client.js";
import { decideFitTool } from "./tools/decide-fit.js";
import { enrichTool } from "./tools/enrich.js";
import { searchTool } from "./tools/search.js";

const apiKey = resolveApiKey();
const baseUrl = resolveBaseUrl();
const client = new CompassClient({ apiKey, baseUrl });

const server = new Server(
  { name: "compass-mcp", version: "0.3.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [searchTool.definition, enrichTool.definition, decideFitTool.definition],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "compass_search":
      return searchTool.handler(client, request.params.arguments);
    case "compass_enrich_restaurant":
      return enrichTool.handler(client, request.params.arguments);
    case "compass_decide_fit":
      return decideFitTool.handler(client, request.params.arguments);
    default:
      throw new Error(`Unknown tool: ${request.params.name}`);
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
