import { useCallback, useState } from "react";
import type { Feedback } from "@reloop-sdk/core";
import { useReloop } from "./context.js";

type Status = "idle" | "submitting" | "success" | "error";

export function useFeedback() {
  const client = useReloop();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<Error | null>(null);

  const submit = useCallback(
    async (feedback: Feedback) => {
      setStatus("submitting");
      setError(null);
      try {
        await client.submit(feedback);
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
