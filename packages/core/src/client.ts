import type {
  Feedback,
  FeedbackUser,
  IngestPayload,
  ReloopClient,
  ReloopOptions,
} from "./types.js";

const isBrowser = typeof window !== "undefined";

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
    identify() {},
    async submit() {},
  };
}

export function createClient(options: ReloopOptions): ReloopClient {
  if (!options.apiKey) throw new ReloopError("apiKey is required");
  if (!options.endpoint) throw new ReloopError("endpoint is required");

  const ingestUrl = `${options.endpoint.replace(/\/+$/, "")}/api/ingest`;
  let user: FeedbackUser | undefined = options.user;

  async function send(feedback: Feedback): Promise<void> {
    const payload: IngestPayload = { user, item: feedback };
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
          body: JSON.stringify(payload),
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
  }

  return {
    identify(next: FeedbackUser) {
      user = next;
    },
    async submit(feedback: Feedback) {
      await send({
        ...feedback,
        url:
          feedback.url ?? (isBrowser ? window.location.href : undefined),
      });
    },
  };
}
