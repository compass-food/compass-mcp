# v0.3.1

Smithery quality metadata release. This version keeps the same Compass REST behavior while making the MCP server easier for registries and clients to inspect, score, and present.

## What's new

- Added descriptions for all tool parameters, including nested profile, allergen preference, and location fields.
- Added structured `outputSchema` metadata for all three tools.
- Added MCP annotations marking the tools as read-only, non-destructive, idempotent open-world lookups.
- Deferred API key resolution until tool-call time so clients can list and inspect tools before a key is configured.
- Added metadata tests that validate the tool definitions against the MCP SDK schema.

## Tools

- `compass_search` - natural-language restaurant dietary search.
- `compass_enrich_restaurant` - restaurant matching and enrichment.
- `compass_decide_fit` - conservative dietary fit decisions with reason codes.

## Links

- GitHub: https://github.com/compass-food/compass-mcp
- npm: https://www.npmjs.com/package/@compass-food/mcp
- API docs: https://api.compassfoodtechnologies.com/openapi
- Sandbox keys: https://compassfoodtechnologies.com

## Previous releases

# v0.3.0

B1 schema sync release. The published MCP package now mirrors the canonical Compass DaaS contract end-to-end, with strict input validation and a drift guard that fails the build before any future regression can ship.

## What's new

- Self-contained canonical types at `src/types.ts` (diets, decisions, confidences, risk flags, evidence tiers/types) so the npm package no longer depends on monorepo-local `shared/`.
- Hardened input validation: `.strict()` on every object schema, bounded text limits, null-byte rejection, and rejection of stale request fields.
- `compass_search` `location.radius_m` is now optional with a documented default of `5000`.
- `compass_enrich_restaurant` accepts a direct `compass_id` lookup in addition to `name` plus `address` or `google_place_id`.
- Output shapes (`confidence`, `evidence`, `risk_flags`, `decision`, `evidence.tier`/`type`) use the canonical enums.
- New drift guard at `tests/schemas/input.test.ts` with inline canonical constants.

## Tools

- `compass_search` — natural-language restaurant dietary search.
- `compass_enrich_restaurant` — restaurant matching and enrichment, now with direct `compass_id` lookup.
- `compass_decide_fit` — dietary fit decisions with reason codes.

## Links

- GitHub: https://github.com/compass-food/compass-mcp
- npm: https://www.npmjs.com/package/@compass-food/mcp
- API docs: https://api.compassfoodtechnologies.com/openapi
- Sandbox keys: https://compassfoodtechnologies.com

## Previous releases

# v0.2.0

Initial public release of the Compass DaaS MCP server.

## Features

- `compass_search` for natural-language restaurant dietary search.
- `compass_enrich_restaurant` for restaurant matching and enrichment.
- `compass_decide_fit` for dietary fit decisions with reason codes.
- Score explanation fields are surfaced in tool responses when available from the Compass API.

## Links

- GitHub: https://github.com/compass-food/compass-mcp
- npm: https://www.npmjs.com/package/@compass-food/mcp
- API docs: https://api.compassfoodtechnologies.com/openapi
- Sandbox keys: https://compassfoodtechnologies.com
