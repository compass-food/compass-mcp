import { ProblemDetailsSchema } from "./schemas/output.js";

export interface CompassClientOptions {
  apiKey: string;
  baseUrl: string;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
}

export interface RequestOptions {
  mode?: "fast" | "rich";
}

export class CompassApiError extends Error {
  readonly problem: unknown;
  readonly status: number;
  readonly retryAfter?: string;

  constructor(message: string, status: number, problem: unknown, retryAfter?: string) {
    super(message);
    this.name = "CompassApiError";
    this.problem = problem;
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

const RETRY_DELAYS_MS = [100, 500, 2000];

async function defaultSleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number): boolean {
  return status >= 500 && status <= 599;
}

export class CompassClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(options: CompassClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.sleep = options.sleep ?? defaultSleep;
  }

  async search(body: unknown, options: RequestOptions = {}): Promise<unknown> {
    return this.post("/v1/search", body, options);
  }

  async enrichRestaurant(body: unknown): Promise<unknown> {
    return this.post("/v1/enrich/restaurant", body);
  }

  async decideFit(body: unknown, options: RequestOptions = {}): Promise<unknown> {
    return this.post("/v1/decision/restaurant-fit", body, options);
  }

  async post(path: string, body: unknown, options: RequestOptions = {}): Promise<unknown> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Compass-API-Key": this.apiKey,
    };

    if (options.mode) {
      headers["X-Compass-Mode"] = options.mode;
    }

    let lastError: unknown;
    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
      try {
        const response = await this.fetchImpl(url, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });

        if (response.ok) {
          return response.json();
        }

        const retryAfter = response.headers.get("retry-after") ?? undefined;
        const problem = await parseProblem(response);
        if (response.status === 429 || !isRetryableStatus(response.status) || attempt === RETRY_DELAYS_MS.length) {
          throw new CompassApiError(problemTitle(problem), response.status, problem, retryAfter);
        }
      } catch (error) {
        if (error instanceof CompassApiError) {
          throw error;
        }

        lastError = error;
        if (attempt === RETRY_DELAYS_MS.length) {
          throw error;
        }
      }

      await this.sleep(RETRY_DELAYS_MS[attempt] ?? RETRY_DELAYS_MS.at(-1) ?? 2000);
    }

    throw lastError instanceof Error ? lastError : new Error("Compass API request failed");
  }
}

async function parseProblem(response: Response): Promise<unknown> {
  const fallback = {
    type: `/errors/http-${response.status}`,
    title: response.statusText || "Compass API error",
    status: response.status,
  };

  try {
    const parsed = await response.json();
    const result = ProblemDetailsSchema.safeParse(parsed);
    return result.success ? result.data : { ...fallback, detail: JSON.stringify(parsed) };
  } catch {
    return fallback;
  }
}

function problemTitle(problem: unknown): string {
  const result = ProblemDetailsSchema.safeParse(problem);
  return result.success ? result.data.title : "Compass API error";
}
