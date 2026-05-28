import type { ReloopClient, ReloopItem, ReloopOptions } from "./types.js";

export class ReloopError extends Error {
  status?: number;
  body?: string;
  constructor(message: string, status?: number, body?: string) {
    super(message);
    this.name = "ReloopError";
    this.status = status;
    this.body = body;
  }
}

export function createNoopClient(): ReloopClient {
  return {
    async submit() {
      throw new ReloopError(
        "reloop not configured — apiKey/endpoint missing",
      );
    },
  };
}

export function createClient(options: ReloopOptions): ReloopClient {
  if (!options.apiKey) throw new ReloopError("apiKey is required");
  if (!options.endpoint) throw new ReloopError("endpoint is required");

  const ingestUrl = `${options.endpoint.replace(/\/+$/, "")}/api/ingest`;

  return {
    async submit(item: ReloopItem): Promise<void> {
      let lastError: Error | undefined;

      // Retry transient network failures once; never retry 4xx/5xx.
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const res = await fetch(ingestUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${options.apiKey}`,
            },
            body: JSON.stringify(item),
            keepalive: true,
          });
          if (!res.ok) {
            const body = await res.text().catch(() => "");
            throw new ReloopError(
              `request failed with status ${res.status}`,
              res.status,
              body,
            );
          }
          return;
        } catch (err) {
          if (err instanceof ReloopError) throw err;
          lastError = err as Error;
        }
      }
      throw new ReloopError(
        `network error: ${lastError?.message ?? "unknown"}`,
      );
    },
  };
}
