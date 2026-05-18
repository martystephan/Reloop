import { useMemo, type ReactNode } from "react";
import { createClient, type ReloopClient, type ReloopOptions } from "@reloop-sdk/core";
import { ReloopContext } from "./context.js";

export interface ReloopProviderProps extends Partial<ReloopOptions> {
  /** Pass a pre-built client instead of options. */
  client?: ReloopClient;
  children: ReactNode;
}

export function ReloopProvider({ client, children, ...options }: ReloopProviderProps) {
  const value = useMemo<ReloopClient>(() => {
    if (client) return client;
    return createClient(options as ReloopOptions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, options.apiKey, options.endpoint]);

  return <ReloopContext.Provider value={value}>{children}</ReloopContext.Provider>;
}
