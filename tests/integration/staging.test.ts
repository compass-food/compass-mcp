import { describe, expect, it } from "vitest";
import { resolveApiKey, resolveBaseUrl } from "../../src/auth.js";
import { CompassClient } from "../../src/client.js";

const runStaging = process.env.RUN_COMPASS_STAGING_TESTS === "1" && !!process.env.COMPASS_API_KEY;
const integrationIt = runStaging ? it : it.skip;

describe("staging API integration", () => {
  integrationIt("compass_search returns a staging response when Day 2 close is merged and a key is available", async () => {
    const client = new CompassClient({
      apiKey: resolveApiKey(),
      baseUrl: resolveBaseUrl({
        env: {
          ...process.env,
          COMPASS_BASE_URL: process.env.COMPASS_BASE_URL ?? "https://api.compassfoodtechnologies.com",
        },
      }),
    });

    const response = await client.search(
      {
        query: "vegan ramen in Brooklyn",
        limit: 3,
      },
      { mode: "fast" },
    );

    expect(response).toBeTruthy();
  });

  it.skip("compass_enrich_restaurant staging integration TODO: enable after Day 5 /v1/enrich/restaurant ships", () => {
    expect(true).toBe(true);
  });

  it.skip("compass_decide_fit staging integration TODO: enable after Day 5 /v1/decision/restaurant-fit ships", () => {
    expect(true).toBe(true);
  });
});
