import { useState } from "react";
import {
  ReloopProvider,
  FeedbackWidget,
  useFeedback,
  type FeedbackType,
} from "@reloop/react";

const apiKey = import.meta.env.VITE_RELOOP_KEY ?? "";
// Empty endpoint -> same origin, so the Vite proxy forwards /api to :8787.
const endpoint = import.meta.env.VITE_RELOOP_ENDPOINT || window.location.origin;

function CustomForm() {
  const { submit, status, error, reset } = useFeedback();
  const [type, setType] = useState<FeedbackType>("idea");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    await submit({ type, message, meta: { source: "react-demo" } });
    setMessage("");
  }

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: 420 }}>
      <h2>Custom form (useFeedback)</h2>
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        {(["bug", "idea", "praise", "rating"] as FeedbackType[]).map((t) => (
          <button
            type="button"
            key={t}
            onClick={() => setType(t)}
            style={{
              padding: "6px 10px",
              textTransform: "capitalize",
              background: type === t ? "#111827" : "#fff",
              color: type === t ? "#fff" : "#111827",
              border: "1px solid #ccc",
              borderRadius: 6,
            }}
          >
            {t}
          </button>
        ))}
      </div>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        placeholder="Type some feedback…"
        style={{ width: "100%", padding: 8 }}
      />
      <div style={{ marginTop: 8 }}>
        <button type="submit" disabled={status === "submitting"}>
          {status === "submitting" ? "Sending…" : "Submit"}
        </button>{" "}
        {status === "success" && (
          <span style={{ color: "green" }}>
            Sent ✓{" "}
            <button type="button" onClick={reset}>
              reset
            </button>
          </span>
        )}
        {status === "error" && (
          <span style={{ color: "crimson" }}>Error: {error?.message}</span>
        )}
      </div>
    </form>
  );
}

export function App() {
  if (!apiKey) {
    return (
      <div style={{ padding: 32 }}>
        <h1>Reloop React Demo</h1>
        <p style={{ color: "crimson" }}>
          No API key set. Copy <code>.env.example</code> to <code>.env</code>,
          create a key in the dashboard (Project → API Keys) and put it in{" "}
          <code>VITE_RELOOP_KEY</code>, then restart <code>pnpm dev</code>.
        </p>
      </div>
    );
  }

  return (
    <ReloopProvider
      apiKey={apiKey}
      endpoint={endpoint}
      user={{ id: "demo-user" }}
    >
      <div style={{ padding: 32 }}>
        <h1>Reloop React Demo</h1>
        <p>
          Endpoint: <code>{endpoint}</code>. Submit below or use the floating
          widget — then check the dashboard’s Feedback tab.
        </p>
        <CustomForm />
      </div>
      <FeedbackWidget title="Demo feedback" />
    </ReloopProvider>
  );
}
