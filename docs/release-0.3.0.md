EXECUTOR_TEMPLATE_V1_REQUIRED

# Compass MCP 0.3.0 Release

**Date:** 2026-05-05
**Branch:** `codex/feat/port-b1-schema-sync-0.3.0`
**Package:** `@compass-food/mcp@0.3.0`

## TASK

Release `@compass-food/mcp@0.3.0` by porting the post-PR #527 B1 schema sync from the Compass monorepo into the public publish source. This unblocks B7 (Day 11 MCP registry submissions) which depends on `npx -y @compass-food/mcp@0.3.0` resolving to a B1-hardened package.

The previously published `0.2.2` already fixed the legacy `vegan_strict`/`vegan_friendly` diet aliases, but did not yet contain the full B1 hardening (canonical-only enums, strict validation, drift guard, `compass_id` enrich support).

## DONE CONDITION

- `npm view @compass-food/mcp@0.3.0 version` returns `0.3.0`.
- The published artifact contains canonical `COMPASS_DIETS`, `COMPASS_CONFIDENCES`, `COMPASS_DECISIONS`, `COMPASS_RISK_FLAGS`, `COMPASS_EVIDENCE_TIERS`, and `COMPASS_EVIDENCE_TYPES` enums.
- The published artifact does not contain legacy `vegan_strict`, `vegan_friendly`, or `omnivore` tokens.
- Repo PR is merged.
- Release report is committed.

## Context Protocol

Context Protocol: completed.

Canonical files checked:

- `src/types.ts` — new local mirror of the canonical Compass enums.
- `src/schemas/input.ts` — hardened MCP zod and JSON Schema inputs.
- `src/schemas/output.ts` — canonical confidence/evidence/risk enums.
- `src/index.ts` — MCP server version handshake.
- `tests/schemas/input.test.ts` — drift guard with inline canonical constants.
- `tests/tools/decide-fit.test.ts`, `tests/tools/enrich.test.ts`, `tests/tools/search.test.ts`, `tests/integration/staging.test.ts` — updated tool tests.
- `package.json` — version bump and metadata preservation.
- `CHANGELOG.md`, `RELEASE_NOTES.md` — 0.3.0 entries.

Hidden dependencies checked:

- `compass-food/VeganMapAI:shared/compass/types.ts` defines the canonical `COMPASS_DIETS` and related enums; `src/types.ts` is a byte-for-byte mirror.
- `compass-food/VeganMapAI:shared/reasonCodes.ts` defines the 30 canonical reason codes.
- `compass-food/VeganMapAI:daas/api/validators/compassDecisionRequest.ts` validates `user_profile.diet` with `z.enum(COMPASS_DIETS)`.

Upstream source: monorepo PR #527 (`fix(compass-mcp): sync schemas to canonical contract`), commit `cc9aa22941bd60b8420eb0b96011daaa5498a434` and later.

## Changes

- Added `src/types.ts` as a self-contained mirror of the canonical Compass enums so the published npm package no longer depends on monorepo-local `shared/`.
- Replaced `src/schemas/input.ts` with the post-#527 hardened version: `.strict()` on every object, bounded text and array limits, null-byte rejection, optional `radius_m` with documented default `5000`, direct `compass_id` lookup on `compass_enrich_restaurant`, rejection of stale request fields.
- Replaced `src/schemas/output.ts` to import canonical confidence/evidence/risk/decision enums from `src/types.ts`.
- Bumped MCP server version handshake to `0.3.0` in `src/index.ts`.
- Added `tests/schemas/input.test.ts` drift guard, adapted for the public repo with inline `EXPECTED_*` canonical constants (the monorepo equivalent reads from `shared/compass/types.ts`, which the public repo does not have). The inline constants must stay in sync with the canonical source until canonical-source unification.
- Updated tool tests (`decide-fit`, `enrich`, `search`, `integration/staging`) to match the post-#527 contract; `enrich.test.ts` now covers direct `compass_id` lookup.
- Bumped `package.json` from `0.2.2` to `0.3.0` and aligned the `description` to the monorepo phrasing. Preserved public-only fields verbatim: `repository`, `homepage`, `bugs`, `publishConfig.access`, `keywords`, `files`, `engines`.
- Regenerated `package-lock.json` via `npm install` after the version bump.
- Updated `CHANGELOG.md` with a `0.3.0 — 2026-05-05` entry summarizing the B1 schema sync and referencing monorepo PR #527.
- Updated `RELEASE_NOTES.md` to lead with `v0.3.0` and preserve the historical `v0.2.0` notes.
- Added this release report.

## Public-only files preserved

- `.github/workflows/ci.yml`
- `.gitignore`
- `.npmignore`
- `LICENSE` (one-line public drift retained intentionally; recon noted "do not rewrite")
- `package.json` `repository`, `homepage`, `bugs`, `publishConfig.access` fields
- `docs/release-0.2.2.md`
- Older `RELEASE_NOTES.md` `v0.2.0` block, preserved below the new `v0.3.0` block

## README merge

The monorepo README (157 lines, broader install instructions including Codex CLI and per-tool examples with `mode`) was used as the base because it is more useful to developers reading the package on npmjs.com. The public README's "Privacy" section was new in the public source and has been preserved. Public-only links (`compassfoodtechnologies.com/signup`, `support@compassfoodtechnologies.com`) are also preserved.

## Verification

Local gates run before PR (see executor report `docs/agent-reports/compass-mcp-port-and-reconcile-2026-05-05.md` in the monorepo for full transcript):

- `npm install`
- `npm run build`
- `npm test`
- `npm pack --dry-run`

`npm pack --dry-run` output should list `dist/` artifacts and not include `tests/`, `src/`, or other dev-only paths.

## Manual publish (post-merge)

After this PR is merged to `compass-food/compass-mcp:main`:

1. Confirm `NPM_AUTOMATION_TOKEN` validity and ownership (see recon Q5).
2. Clone the public repo to a clean directory and check out `main` at the merge SHA.
3. `npm install`
4. `npm run build`
5. `npm publish --access public --userconfig=.npmrc.publish` (mirroring the `0.2.1` and `0.2.2` manual publish pattern documented in `docs/agent-reports/npm-mcp-publish-0.2.1-2026-05-03.md`).
6. Verify with `npm view @compass-food/mcp@0.3.0 version`.
7. Inspect the published tarball: it must contain `strict_vegan` in `dist/schemas/input.js` and must not contain `vegan_strict`.
8. Tag the public repo: `git tag v0.3.0 && git push origin v0.3.0`.

## Reference

- Upstream source PR: monorepo PR #527 — `fix(compass-mcp): sync schemas to canonical contract`.
- Recon report: `docs/agent-reports/compass-mcp-publishing-recon-2026-05-05.md` (monorepo).
- Decisions document: `docs/knowledge/decisions/launch-product-decisions-2026-05-05.md` D5.1–D5.5 (monorepo).
