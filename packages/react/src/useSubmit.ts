import { useCallback, useState } from "react";
import type { ReloopItem } from "@reloop-sdk/core";
import { useReloop } from "./context.js";

type Status = "idle" | "submitting" | "success" | "error";

export function useSubmit() {
  const client = useReloop();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<Error | null>(null);

  const submit = useCallback(
    async (item: ReloopItem) => {
      setStatus("submitting");
      setError(null);
      try {
        await client.submit(item);
        setStatus("success");
      } catch (e) {
        setError(e as Error);
        setStatus("error");
      }
    },
    [client],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
  }, []);

  return { submit, reset, status, error, isSubmitting: status === "submitting" };
}
