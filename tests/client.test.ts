import { describe, expect, it, vi } from "vitest";
import { CompassApiError, CompassClient } from "../src/client.js";

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

describe("CompassClient", () => {
  it("posts to the requested endpoint with API key and mode headers", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    const client = new CompassClient({
      apiKey: "cmp_test_123",
      baseUrl: "https://api.example.com/",
      fetchImpl,
      sleep: async () => undefined,
    });

    await expect(client.search({ query: "vegan ramen" }, { mode: "fast" })).resolves.toEqual({ ok: true });

    expect(fetchImpl).toHaveBeenCalledWith("https://api.example.com/v1/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Compass-API-Key": "cmp_test_123",
        "X-Compass-Mode": "fast",
      },
      body: JSON.stringify({ query: "vegan ramen" }),
    });
  });

  it("retries transient 5xx responses with configured backoff", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ title: "Upstream unavailable", status: 503 }, 503))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    const sleep = vi.fn().mockResolvedValue(undefined);
    const client = new CompassClient({
      apiKey: "cmp_test_123",
      baseUrl: "https://api.example.com",
      fetchImpl,
      sleep,
    });

    await expect(client.decideFit({ compass_id: "rest_1" }, { mode: "rich" })).resolves.toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(100);
  });

  it("does not retry 429 responses and preserves retry-after", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(
        {
          type: "/errors/rate-limit-exceeded",
          title: "Rate limit exceeded",
          status: 429,
          detail: "Try again later.",
          compass_request_id: "req_123",
        },
        429,
        { "retry-after": "30" },
      ),
    );
    const client = new CompassClient({
      apiKey: "cmp_test_123",
      baseUrl: "https://api.example.com",
      fetchImpl,
      sleep: async () => undefined,
    });

    await expect(client.enrichRestaurant({ name: "Buddha Bodai", address: "5 Mott St" })).rejects.toMatchObject({
      status: 429,
      retryAfter: "30",
    } satisfies Partial<CompassApiError>);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
