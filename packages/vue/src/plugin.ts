import type { App, InjectionKey } from "vue";
import { inject } from "vue";
import { createClient, createNoopClient, type ReloopClient, type ReloopOptions } from "@reloop-sdk/core";

export const ReloopKey: InjectionKey<ReloopClient> = Symbol("reloop");

export interface ReloopPluginOptions extends Partial<ReloopOptions> {
  client?: ReloopClient;
}

export const ReloopPlugin = {
  install(app: App, options: ReloopPluginOptions) {
    let client: ReloopClient;
    if (options.client) {
      client = options.client;
    } else if (options.apiKey && options.endpoint) {
      client = createClient(options as ReloopOptions);
    } else {
      const missing = [
        !options.apiKey && "apiKey",
        !options.endpoint && "endpoint",
      ]
        .filter(Boolean)
        .join(" and ");
      console.warn(
        `[reloop] ${missing} missing — feedback will not be sent. Pass it to app.use(ReloopPlugin, ...).`,
      );
      client = createNoopClient();
    }
    app.provide(ReloopKey, client);
    app.config.globalProperties.$reloop = client;
  },
};

export function useReloop(): ReloopClient {
  const client = inject(ReloopKey);
  if (!client) {
    throw new Error("useReloop requires app.use(ReloopPlugin, ...)");
  }
  return client;
}
