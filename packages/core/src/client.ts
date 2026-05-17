import type {
  Feedback,
  FeedbackUser,
  IngestPayload,
  ReloopClient,
  ReloopOptions,
} from "./types.js";

const isBrowser = typeof window !== "undefined";

export function createClient(options: ReloopOptions): ReloopClient {
  if (!options.apiKey) throw new Error("[reloop] apiKey is required");
  if (!options.endpoint) throw new Error("[reloop] endpoint is required");

  const flushInterval = options.flushInterval ?? 3000;
  const batchSize = options.batchSize ?? 10;
  const maxRetries = options.maxRetries ?? 3;
  const ingestUrl = `${options.endpoint.replace(/\/+$/, "")}/api/ingest`;

  let queue: Feedback[] = [];
  let user: FeedbackUser | undefined = options.user;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function scheduleFlush() {
    if (timer) return;
    timer = setTimeout(() => {
      timer = undefined;
      void flush();
    }, flushInterval);
  }

  async function send(payload: IngestPayload, attempt = 0): Promise<void> {
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
      // 4xx (bad key / validation) is not retryable — drop it.
      if (!res.ok && res.status >= 500 && attempt < maxRetries) {
        throw new Error(`server ${res.status}`);
      }
    } catch (err) {
      if (attempt < maxRetries) {
        const backoff = 2 ** attempt * 500;
        await new Promise((r) => setTimeout(r, backoff));
        return send(payload, attempt + 1);
      }
      if (typeof console !== "undefined") {
        console.warn("[reloop] dropped feedback batch:", err);
      }
    }
  }

  async function flush(): Promise<void> {
    if (queue.length === 0) return;
    const batch = queue.slice(0, batchSize);
    queue = queue.slice(batchSize);
    await send({ user, items: batch });
    if (queue.length > 0) await flush();
  }

  // Best-effort delivery when the page is closing.
  if (isBrowser) {
    window.addEventListener("pagehide", () => {
      if (queue.length === 0) return;
      const payload: IngestPayload = { user, items: queue };
      queue = [];
      const body = JSON.stringify(payload);
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          ingestUrl,
          new Blob([body], { type: "application/json" }),
        );
      }
    });
  }

  return {
    identify(next: FeedbackUser) {
      user = next;
    },
    async submit(feedback: Feedback) {
      queue.push({
        ...feedback,
        url:
          feedback.url ??
          (isBrowser ? window.location.href : undefined),
      });
      if (queue.length >= batchSize) {
        await flush();
      } else {
        scheduleFlush();
      }
    },
    flush,
  };
}
