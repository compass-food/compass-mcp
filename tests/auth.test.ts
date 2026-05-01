import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_BASE_URL,
  MISSING_API_KEY_MESSAGE,
  redactApiKey,
  resolveApiKey,
  resolveBaseUrl,
} from "../src/auth.js";

function tempHome(): string {
  return mkdtempSync(join(tmpdir(), "compass-mcp-auth-"));
}

function writeConfig(homeDir: string, content: object): void {
  const dir = join(homeDir, ".compass");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "config.json"), JSON.stringify(content), "utf8");
}

describe("auth resolution", () => {
  it("uses COMPASS_API_KEY before config file", () => {
    const homeDir = tempHome();
    writeConfig(homeDir, { api_key: "cmp_test_from_config" });

    expect(resolveApiKey({ env: { COMPASS_API_KEY: "cmp_test_from_env" }, homeDir })).toBe("cmp_test_from_env");
  });

  it("falls back to ~/.compass/config.json", () => {
    const homeDir = tempHome();
    writeConfig(homeDir, { api_key: "cmp_test_from_config" });

    expect(resolveApiKey({ env: {}, homeDir })).toBe("cmp_test_from_config");
  });

  it("throws the required missing-key message", () => {
    expect(() => resolveApiKey({ env: {}, homeDir: tempHome() })).toThrow(MISSING_API_KEY_MESSAGE);
  });

  it("resolves base URL from env, config, then default", () => {
    const homeDir = tempHome();
    writeConfig(homeDir, { base_url: "https://staging.example.com/" });

    expect(resolveBaseUrl({ env: { COMPASS_BASE_URL: "https://env.example.com/" }, homeDir })).toBe("https://env.example.com");
    expect(resolveBaseUrl({ env: {}, homeDir })).toBe("https://staging.example.com");
    expect(resolveBaseUrl({ env: {}, homeDir: tempHome() })).toBe(DEFAULT_BASE_URL);
  });

  it("redacts API keys without exposing the full value", () => {
    expect(redactApiKey("cmp_test_abcdef123456")).toBe("cmp_...3456");
    expect(redactApiKey("short")).toBe("****");
  });
});
