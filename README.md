# Compass DaaS MCP

MCP server for Compass DaaS. It exposes three restaurant dietary decision tools over the Model Context Protocol and calls the Compass REST API with your API key.

## Quick Start

```bash
npx -y @compass-food/mcp
```

Set `COMPASS_API_KEY` before starting the server:

```bash
export COMPASS_API_KEY=cmp_test_your_sandbox_key
```

For staging or local testing, set:

```bash
export COMPASS_BASE_URL=https://daas-api-veganmapai-1a8b7.a.run.app
```

## Install

### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "compass": {
      "command": "npx",
      "args": ["-y", "@compass-food/mcp"],
      "env": {
        "COMPASS_API_KEY": "cmp_test_your_sandbox_key"
      }
    }
  }
}
```

### Cursor

Add to Cursor MCP settings (`~/.cursor/mcp.json` globally, or `.cursor/mcp.json` in a workspace):

```json
{
  "mcpServers": {
    "compass": {
      "command": "npx",
      "args": ["-y", "@compass-food/mcp"],
      "env": {
        "COMPASS_API_KEY": "cmp_test_your_sandbox_key"
      }
    }
  }
}
```

### Codex CLI

Edit `~/.codex/config.toml`:

```toml
[mcp_servers.compass]
command = "npx"
args = ["-y", "@compass-food/mcp"]

[mcp_servers.compass.env]
COMPASS_API_KEY = "cmp_test_your_sandbox_key"
```

### Get an API key

[Sign up free](https://compassfoodtechnologies.com/signup) — 1,000 Compass credits/month, no credit card required.

## Tools

### `compass_search`

Wraps `POST /v1/search`.
The `mode` tool argument is sent to the REST API as the `X-Compass-Mode` header.

```json
{
  "query": "strict vegan ramen in Brooklyn under $20",
  "user_profile": {
    "diet": "strict_vegan",
    "allergens": ["peanut"],
    "exclude_cross_contamination": true
  },
  "location": {
    "lat": 40.6782,
    "lng": -73.9442,
    "radius_m": 5000
  },
  "limit": 10,
  "mode": "rich"
}
```

### `compass_enrich_restaurant`

Wraps `POST /v1/enrich/restaurant`.
Use `compass_id` for direct lookup, or `name` plus `address` or `google_place_id` for fuzzy match.

```json
{
  "name": "Buddha Bodai",
  "address": "5 Mott St, New York, NY"
}
```

### `compass_decide_fit`

Wraps `POST /v1/decision/restaurant-fit`.
The `mode` tool argument is sent to the REST API as the `X-Compass-Mode` header.

```json
{
  "compass_id": "rest_xyz789",
  "user_profile": {
    "diet": "strict_vegan",
    "exclude_cross_contamination": true
  },
  "mode": "rich"
}
```

## API Key Resolution

The server checks:

1. `COMPASS_API_KEY`
2. `~/.compass/config.json`

Config file:

```json
{
  "api_key": "cmp_live_abc123",
  "base_url": "https://api.compassfoodtechnologies.com"
}
```

## Privacy

This package sends tool calls only to the configured Compass API base URL. It does not send secondary usage data.

## Links

- Site: https://compassfoodtechnologies.com
- Signup: https://compassfoodtechnologies.com/signup
- API docs: https://api.compassfoodtechnologies.com/openapi
- Source: https://github.com/compass-food/compass-mcp
- npm: https://www.npmjs.com/package/@compass-food/mcp
- Support: support@compassfoodtechnologies.com

## License

MIT
