# Changelog

## 0.3.0 - 2026-05-05
- Port the post-PR #527 B1 schema sync from the Compass monorepo so the published MCP package matches the canonical Compass DaaS contract.
- Add `src/types.ts` as a self-contained mirror of the canonical Compass enums (diets, decisions, confidences, risk flags, evidence tiers/types) so the npm package no longer relies on monorepo-local `shared/`.
- Harden input validation: `.strict()` on every object schema, bounded text limits, null-byte rejection, and rejection of stale request field names.
- Make `location.radius_m` optional on `compass_search` with a documented JSON Schema default of `5000`.
- Allow direct `compass_id` lookup on `compass_enrich_restaurant` in addition to `name` plus `address` or `google_place_id`.
- Replace numeric/legacy output shapes with canonical `confidence`, `evidence`, `risk_flags`, `decision`, and `evidence.tier`/`type` enums imported from `src/types.ts`.
- Add `tests/schemas/input.test.ts` drift guard with inline canonical constants so any future regression on the canonical contract fails before publish. Note: must stay in sync with monorepo `shared/compass/types.ts` until canonical-source unification.
- Bump MCP server identification version to `0.3.0`.

## 0.2.2 - 2026-05-03
- Fix `compass_decide_fit` and `compass_search` diet enum values to match the Compass DaaS API `COMPASS_DIETS` contract.
- Replace legacy `vegan_strict` with `strict_vegan`.
- Remove API-invalid diet values `vegan_friendly` and `omnivore`; add the API-supported dietary rule values `gluten_free`, `halal`, `kosher`, `low_fodmap`, `nut_free`, `dairy_free`, `egg_free`, and `shellfish_free`.
- Bump MCP server identification version to `0.2.2`.

## 0.2.1 - 2026-05-02
- Add `license: MIT` field to `package.json` so npm metadata correctly reflects the existing MIT LICENSE file.
- Bump MCP server identification version in `src/index.ts` from `0.2.0` to `0.2.1` to match the package version.
- No functional changes.
