import { useState } from "react";
import {
  ReloopProvider,
  FeedbackWidget,
  useFeedback,
  type FeedbackType,
} from "@reloop-sdk/react";

const apiKey = import.meta.env.VITE_RELOOP_KEY ?? "";
// Empty endpoint -> same origin, so the Vite proxy forwards /api to :8787.
const endpoint = import.meta.env.VITE_RELOOP_ENDPOINT || window.location.origin;

type MetaRow = { key: string; value: string };

function CustomForm() {
  const { submit, status, error, reset } = useFeedback();
  const [type, setType] = useState<FeedbackType>("idea");
  const [message, setMessage] = useState("");
  const [metaRows, setMetaRows] = useState<MetaRow[]>([
    { key: "feature", value: "" },
  ]);

  function updateRow(i: number, patch: Partial<MetaRow>) {
    setMetaRows((rows) => rows.map((r, j) => (i === j ? { ...r, ...patch } : r)));
  }
  function addRow() {
    setMetaRows((rows) => [...rows, { key: "", value: "" }]);
  }
  function removeRow(i: number) {
    setMetaRows((rows) => rows.filter((_, j) => i !== j));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    const customMeta: Record<string, string> = {};
    for (const { key, value } of metaRows) {
      const k = key.trim();
      if (k) customMeta[k] = value;
    }
    await submit({
      type,
      message,
      meta: {
        source: "react-demo",
        form: "custom",
        pathname: window.location.pathname,
        viewport: { w: window.innerWidth, h: window.innerHeight },
        locale: navigator.language,
        submittedAt: new Date().toISOString(),
        ...customMeta,
      },
    });
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
      <fieldset
        style={{
          marginTop: 12,
          padding: 8,
          border: "1px solid #e5e7eb",
          borderRadius: 6,
        }}
      >
        <legend style={{ padding: "0 4px", fontSize: 12, color: "#6b7280" }}>
          Custom meta
        </legend>
        {metaRows.map((row, i) => (
          <div
            key={i}
            style={{ display: "flex", gap: 6, marginBottom: 6 }}
          >
            <input
              value={row.key}
              onChange={(e) => updateRow(i, { key: e.target.value })}
              placeholder="key"
              style={{ flex: 1, padding: 6 }}
            />
            <input
              value={row.value}
              onChange={(e) => updateRow(i, { value: e.target.value })}
              placeholder="value"
              style={{ flex: 2, padding: 6 }}
            />
            <button
              type="button"
              onClick={() => removeRow(i)}
              aria-label="Remove row"
              style={{ padding: "0 10px" }}
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addRow}
          style={{ padding: "4px 10px", fontSize: 12 }}
        >
          + Add field
        </button>
      </fieldset>
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
