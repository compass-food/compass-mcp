import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export const DEFAULT_BASE_URL = "https://api.compassfoodtechnologies.com";

export const MISSING_API_KEY_MESSAGE = `Compass MCP requires an API key.

Get a free Sandbox key (no credit card required):
  https://compassfoodtechnologies.com/signup

Then set it:
  export COMPASS_API_KEY=cmp_test_...

Or save to ~/.compass/config.json:
  { "api_key": "cmp_test_..." }`;

export interface CompassConfig {
  api_key?: string;
  base_url?: string;
}

export interface AuthOptions {
  env?: NodeJS.ProcessEnv;
  homeDir?: string;
}

function configPath(homeDir: string): string {
  return join(homeDir, ".compass", "config.json");
}

function readConfig(homeDir: string): CompassConfig {
  const path = configPath(homeDir);
  if (!existsSync(path)) {
    return {};
  }

  const raw = readFileSync(path, "utf8");
  const parsed = JSON.parse(raw) as CompassConfig;
  return parsed && typeof parsed === "object" ? parsed : {};
}

function normalize(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function redactApiKey(apiKey: string): string {
  if (apiKey.length <= 8) {
    return "****";
  }
  return `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`;
}

export function isLikelyCompassApiKey(apiKey: string): boolean {
  return /^(cmp|cpk)_(test|live|sk|pk)?_?[A-Za-z0-9._-]+$/.test(apiKey);
}

export function resolveApiKey(options: AuthOptions = {}): string {
  const env = options.env ?? process.env;
  const homeDir = options.homeDir ?? homedir();
  const envKey = normalize(env.COMPASS_API_KEY);
  if (envKey) {
    return envKey;
  }

  const configKey = normalize(readConfig(homeDir).api_key);
  if (configKey) {
    return configKey;
  }

  throw new Error(MISSING_API_KEY_MESSAGE);
}

export function resolveBaseUrl(options: AuthOptions = {}): string {
  const env = options.env ?? process.env;
  const homeDir = options.homeDir ?? homedir();
  const envBaseUrl = normalize(env.COMPASS_BASE_URL);
  if (envBaseUrl) {
    return envBaseUrl.replace(/\/+$/, "");
  }

  const configBaseUrl = normalize(readConfig(homeDir).base_url);
  if (configBaseUrl) {
    return configBaseUrl.replace(/\/+$/, "");
  }

  return DEFAULT_BASE_URL;
}
