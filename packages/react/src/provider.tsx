import { useMemo, type ReactNode } from "react";
import { createClient, createNoopClient, type ReloopClient, type ReloopOptions } from "@reloop-sdk/core";
import { ReloopContext } from "./context.js";

export interface ReloopProviderProps extends Partial<ReloopOptions> {
  /** Pass a pre-built client instead of options. */
  client?: ReloopClient;
  children: ReactNode;
}

export function ReloopProvider({ client, children, ...options }: ReloopProviderProps) {
  const value = useMemo<ReloopClient>(() => {
    if (client) return client;
    if (!options.apiKey || !options.endpoint) {
      const missing = [
        !options.apiKey && "apiKey",
        !options.endpoint && "endpoint",
      ]
        .filter(Boolean)
        .join(" and ");
      console.warn(
        `[reloop] ${missing} missing — feedback will not be sent. Pass it to <ReloopProvider> via props or env vars.`,
      );
      return createNoopClient();
    }
    return createClient(options as ReloopOptions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, options.apiKey, options.endpoint]);

  return <ReloopContext.Provider value={value}>{children}</ReloopContext.Provider>;
}
