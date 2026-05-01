# Compass DaaS MCP

The explainable dietary decision layer for AI agents.

Compass DaaS helps agents search restaurants, enrich restaurant records, and make dietary fit decisions with evidence, confidence, and conservative user-facing wording.

## Quick Start

```bash
npx -y @compass-food/mcp@latest
```

Get a Sandbox API key at [compassfoodtechnologies.com](https://compassfoodtechnologies.com), then set:

```bash
export COMPASS_API_KEY=cmp_test_...
```

API docs: [api.compassfoodtechnologies.com/openapi](https://api.compassfoodtechnologies.com/openapi)

## Claude Desktop

Add Compass to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "compass": {
      "command": "npx",
      "args": ["-y", "@compass-food/mcp"],
      "env": {
        "COMPASS_API_KEY": "your_key_here"
      }
    }
  }
}
```

## Cursor

Add Compass to Cursor MCP settings (`~/.cursor/mcp.json` globally, or `.cursor/mcp.json` in a workspace):

```json
{
  "mcpServers": {
    "compass": {
      "command": "npx",
      "args": ["-y", "@compass-food/mcp"],
      "env": {
        "COMPASS_API_KEY": "your_key_here"
      }
    }
  }
}
```

## Tools And Outputs

- `compass_search` - Search restaurants by natural-language dietary query and return ranked results with evidence and confidence.
- `compass_enrich_restaurant` - Match a restaurant by name and address, then return Compass enrichment data.
- `compass_decide_fit` - Decide whether a restaurant is likely suitable, likely not suitable, or unknown for a dietary profile.
- Score explanations - Search, enrichment, and decision responses include reason codes and evidence-backed explanation fields when available.

## API Key Resolution

Compass MCP checks:

1. `COMPASS_API_KEY`
2. `~/.compass/config.json`

Example config:

```json
{
  "api_key": "cmp_test_...",
  "base_url": "https://api.compassfoodtechnologies.com"
}
```

## Links

- Site: [compassfoodtechnologies.com](https://compassfoodtechnologies.com)
- API docs: [api.compassfoodtechnologies.com/openapi](https://api.compassfoodtechnologies.com/openapi)
- Source: [github.com/compass-food/compass-mcp](https://github.com/compass-food/compass-mcp)
- npm: [npmjs.com/package/@compass-food/mcp](https://www.npmjs.com/package/@compass-food/mcp)

## License

MIT
