import { ref } from "vue";
import type { Feedback } from "@reloop-sdk/core";
import { useReloop } from "./plugin.js";

type Status = "idle" | "submitting" | "success" | "error";

export function useFeedback() {
  const client = useReloop();
  const status = ref<Status>("idle");
  const error = ref<Error | null>(null);

  async function submit(feedback: Feedback) {
    status.value = "submitting";
    error.value = null;
    try {
      await client.submit(feedback);
      status.value = "success";
    } catch (e) {
      error.value = e as Error;
      status.value = "error";
    }
  }

  function reset() {
    status.value = "idle";
    error.value = null;
  }

  return { submit, reset, status, error };
}
