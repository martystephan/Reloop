import { createContext, useContext } from "react";
import type { ReloopClient } from "@reloop/core";

export const ReloopContext = createContext<ReloopClient | null>(null);

export function useReloop(): ReloopClient {
  const client = useContext(ReloopContext);
  if (!client) {
    throw new Error("useReloop must be used within a <ReloopProvider>");
  }
  return client;
}
