#!/usr/bin/env node
// Self-contained check of the built MCP tool list. Runs in the public publish
// repo, where the monorepo-backed unit tests cannot run, and against an
// unpacked tarball: node scripts/check-package.mjs [path-to-package-root]
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const root = resolve(process.argv[2] ?? ".");
const load = (file) => import(pathToFileURL(resolve(root, "dist", file)).href);

const { searchTool } = await load("tools/search.js");
const { enrichTool } = await load("tools/enrich.js");
const { decideFitTool } = await load("tools/decide-fit.js");
const tools = [searchTool.definition, enrichTool.definition, decideFitTool.definition];

const failures = [];
const names = tools.map((tool) => tool.name).join(",");
if (names !== "compass_search,compass_enrich_restaurant,compass_decide_fit") {
  failures.push(`unexpected tool list: ${names}`);
}

const serialized = JSON.stringify(tools);
if (/\/v1\/refresh|recommended_refresh/i.test(serialized)) {
  failures.push("tool metadata mentions the retired Refresh route");
}

const disclaimer = "Compass is not an allergen or safety service.";
if (!serialized.includes(disclaimer)) {
  failures.push("disclaimer missing from tool metadata");
}
const banned = serialized.split(disclaimer).join("").match(/\ballerg\w*|gluten|celiac|coeliac/gi);
if (banned) {
  failures.push(`banned vocabulary outside the disclaimer: ${[...new Set(banned)].join(", ")}`);
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exit(1);
}
console.log(`OK ${tools.length} tools: ${names}; only the disclaimer names allergens.`);
