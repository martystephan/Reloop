import type { App, InjectionKey } from "vue";
import { inject } from "vue";
import { createClient, type ReloopClient, type ReloopOptions } from "@reloop/core";

export const ReloopKey: InjectionKey<ReloopClient> = Symbol("reloop");

export interface ReloopPluginOptions extends Partial<ReloopOptions> {
  client?: ReloopClient;
}

export const ReloopPlugin = {
  install(app: App, options: ReloopPluginOptions) {
    const client = options.client ?? createClient(options as ReloopOptions);
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
