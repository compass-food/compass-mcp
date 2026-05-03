EXECUTOR_TEMPLATE_V1_REQUIRED

# Compass MCP 0.2.2 Release

**Date:** 2026-05-03
**Branch:** `codex/fix/compass-mcp-enum-mismatch-2026-05-03`
**Package:** `@compass-food/mcp@0.2.2`

## TASK

Release `@compass-food/mcp@0.2.2` to fix the `compass_decide_fit`
`user_profile.diet` enum mismatch found by the 2026-05-03 MCP smoke test.

The published `0.2.1` package accepted legacy diet values such as
`vegan_strict`, while the Compass DaaS API validates against the shared
`COMPASS_DIETS` contract:

- `strict_vegan`
- `vegetarian`
- `pescatarian`
- `gluten_free`
- `halal`
- `kosher`
- `low_fodmap`
- `nut_free`
- `dairy_free`
- `egg_free`
- `shellfish_free`

## DONE CONDITION

- `npm view @compass-food/mcp@0.2.2 version` returns `0.2.2`.
- The published artifact contains `strict_vegan`.
- The published artifact does not contain `vegan_strict`.
- Repo PR is merged.
- Release report is committed.

## Context Protocol

Context Protocol: completed.

Canonical files checked:

- `src/schemas/input.ts` — MCP zod and JSON Schema inputs.
- `src/tools/decide-fit.ts` — tool handler forwards parsed payload to the API.
- `src/client.ts` — `decideFit()` posts to `/v1/decision/restaurant-fit`.
- `src/index.ts` — MCP server version handshake.
- `package.json` and `package-lock.json` — npm package version.

Hidden dependencies checked:

- `origin/main:shared/compass/types.ts` in `compass-food/VeganMapAI` defines
  `COMPASS_DIETS`.
- `origin/main:daas/api/validators/compassDecisionRequest.ts` validates
  `user_profile.diet` with `z.enum(COMPASS_DIETS)`.
- `origin/main:daas/api/router.ts` routes `POST /v1/decision/restaurant-fit`.
- `origin/main:daas/api/endpoints/decideFit.ts` contains strict-vegan decision
  logic.

## Changes

- Replaced legacy `vegan_strict` with API-canonical `strict_vegan`.
- Removed API-invalid diet values `vegan_friendly` and `omnivore`.
- Added the remaining API-supported `COMPASS_DIETS` values to both zod parsing
  and MCP JSON Schemas.
- Updated tests to use `strict_vegan`.
- Added a regression test proving `vegan_strict` is rejected.
- Bumped package and MCP server versions from `0.2.1` to `0.2.2`.
- Added this release report.

## Applied Improvement

The task asked for the `compass_decide_fit` mismatch, but the same shared
`DietSchema` also powers `compass_search`. I aligned the shared schema with the
full API enum so both tools now reject the same invalid values and accept the
same valid values as the backend contract.

## Verification

Completed before PR:

- `npm run build` passed.
- `npm test` passed: 6 files passed, 1 skipped; 20 tests passed, 3 skipped.
- `npm pack --dry-run --json` confirmed package `@compass-food/mcp@0.2.2`
  contains the rebuilt `dist/` files.
- Local `dist/` inspection confirmed `strict_vegan` is present in the compiled
  schemas and `vegan_strict` is absent from compiled artifacts.

Post-merge steps:

- Publish with `npm publish --access public`.
- Verify `npm view @compass-food/mcp@0.2.2 version`.
- Inspect the published artifact for `strict_vegan` and absence of
  `vegan_strict`.
