# Changelog

## 0.2.2 - 2026-05-03
- Fix `compass_decide_fit` and `compass_search` diet enum values to match the Compass DaaS API `COMPASS_DIETS` contract.
- Replace legacy `vegan_strict` with `strict_vegan`.
- Remove API-invalid diet values `vegan_friendly` and `omnivore`; add the API-supported dietary rule values `gluten_free`, `halal`, `kosher`, `low_fodmap`, `nut_free`, `dairy_free`, `egg_free`, and `shellfish_free`.
- Bump MCP server identification version to `0.2.2`.

## 0.2.1 - 2026-05-02
- Add `license: MIT` field to `package.json` so npm metadata correctly reflects the existing MIT LICENSE file.
- Bump MCP server identification version in `src/index.ts` from `0.2.0` to `0.2.1` to match the package version.
- No functional changes.
