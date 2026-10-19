# Compass DaaS MCP

[![Smithery badge](https://smithery.ai/badge/compassfoodtech/compass-mcp)](https://smithery.ai/servers/compassfoodtech/compass-mcp)

MCP server for Compass DaaS. It exposes three read-only restaurant tools (search, enrich, decide fit) over the Model Context Protocol and calls the Compass REST API with your API key. Coverage is the 50 US states and Washington, DC.

Compass is not an allergen or safety service.

> This package replaces `@compass-food/mcp`, which is no longer updated. Change `@compass-food/mcp` to `@compassfoodtech/mcp` in your MCP client config.

## Quick Start

```bash
npx -y @compassfoodtech/mcp
```

Set `COMPASS_API_KEY` before starting the server:

```bash
export COMPASS_API_KEY="<paste the key from signup>"
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
      "args": ["-y", "@compassfoodtech/mcp"],
      "env": {
        "COMPASS_API_KEY": "<paste the key from signup>"
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
      "args": ["-y", "@compassfoodtech/mcp"],
      "env": {
        "COMPASS_API_KEY": "<paste the key from signup>"
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
args = ["-y", "@compassfoodtech/mcp"]

[mcp_servers.compass.env]
COMPASS_API_KEY = "<paste the key from signup>"
```

### Get an API key

[Sign up](https://compassfoodtechnologies.com/signup?src=mcp) — a working sandbox key is saved immediately, with 250 credits for 72 hours. Confirming email raises the shared free allowance to 1,000 credits per month.

## Tools

### `compass_search`

Wraps `POST /v1/search`.
The `mode` tool argument is sent to the REST API as the `X-Compass-Mode` header.
Pass a dish in `dish` and the destination as `place` or `location`, not both. Each result carries `vegan_dining` (up to five relevant vegan dishes and `menu_collected_at`). A dish query with no restaurant that has the dish returns `result_status: "no_match"` and, when one exists within 50 km, `nearest_match`. Set `include_cuisine_matches` to also list same-cuisine restaurants without the dish, marked `cuisine_only`.

```json
{
  "query": "ramen",
  "dish": "ramen",
  "place": { "country_code": "US", "region": "NY", "city": "Brooklyn" },
  "user_profile": { "diet": "strict_vegan" },
  "limit": 5
}
```

```json
{
  "query": "vegan ramen in Brooklyn",
  "user_profile": {
    "diet": "strict_vegan",
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
Use `compass_id` or `google_place_id` for an exact lookup (one of them, not both), `name` plus `address`, or `name` plus `place`. `matched` is true only when `identity_status` is `resolved`; otherwise `match_candidates` lists possible restaurants.

```json
{
  "name": "Buddha Bodai",
  "address": "5 Mott St, New York, NY"
}
```

```json
{
  "name": "Blossom",
  "place": { "country_code": "US", "region": "NY", "city": "New York" },
  "dish": "seitan"
}
```

### `compass_decide_fit`

Wraps `POST /v1/decision/restaurant-fit`.
The `mode` tool argument is sent to the REST API as the `X-Compass-Mode` header.
Send exactly one of `compass_id` or `google_place_id`. `vegan_options` is an alias of `strict_vegan`; set `fully_vegan_only` to accept only fully vegan restaurants. `vegetarian` is judged from vegan evidence; other accepted diets return `unknown` with `DIET_NOT_SUPPORTED`.
`exclude_cross_contamination` defaults to false. Send true when unknown shared-prep evidence should return `unknown`.
When a `google_place_id` maps to no restaurant or to several, the response has `resolution` and `coverage` instead of a decision.

```json
{
  "compass_id": "rest_xyz789",
  "user_profile": {
    "diet": "strict_vegan"
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
  "api_key": "<paste the key from signup>",
  "base_url": "https://api.compassfoodtechnologies.com"
}
```

## Privacy

This package sends tool calls only to the configured Compass API base URL. It does not send secondary usage data.

## Links

- Site: https://compassfoodtechnologies.com
- Signup: https://compassfoodtechnologies.com/signup?src=mcp
- Support: support@compassfoodtechnologies.com
- License: MIT
