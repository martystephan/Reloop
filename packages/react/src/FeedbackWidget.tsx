import { useState } from "react";
import type { FeedbackType } from "@reloop/core";
import { useFeedback } from "./useFeedback.js";

export interface FeedbackWidgetProps {
  /** Heading shown at the top of the panel. */
  title?: string;
  /** Where the launcher button sits. Default "bottom-right". */
  position?: "bottom-right" | "bottom-left";
}

const TYPES: FeedbackType[] = ["bug", "idea", "praise"];

export function FeedbackWidget({
  title = "Send feedback",
  position = "bottom-right",
}: FeedbackWidgetProps) {
  const { submit, status, reset } = useFeedback();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("idea");
  const [message, setMessage] = useState("");

  const side = position === "bottom-right" ? { right: 20 } : { left: 20 };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    await submit({ type, message });
    setMessage("");
  }

  return (
    <div style={{ position: "fixed", bottom: 20, ...side, zIndex: 2147483000 }}>
      {open && (
        <form
          onSubmit={onSubmit}
          style={{
            width: 300,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
            font: "14px system-ui, sans-serif",
          }}
        >
          <strong style={{ display: "block", marginBottom: 10 }}>{title}</strong>
          {status === "success" ? (
            <div>
              <p>Thanks for the feedback! 🙌</p>
              <button type="button" onClick={() => { reset(); setOpen(false); }}>
                Close
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                {TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    style={{
                      flex: 1,
                      padding: "6px 0",
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      background: type === t ? "#111827" : "#fff",
                      color: type === t ? "#fff" : "#111827",
                      cursor: "pointer",
                      textTransform: "capitalize",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what's on your mind…"
                rows={4}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  padding: 8,
                  resize: "vertical",
                }}
              />
              <button
                type="submit"
                disabled={status === "submitting"}
                style={{
                  marginTop: 10,
                  width: "100%",
                  padding: "8px 0",
                  borderRadius: 8,
                  border: "none",
                  background: "#2563eb",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                {status === "submitting" ? "Sending…" : "Send"}
              </button>
            </>
          )}
        </form>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          padding: "10px 16px",
          borderRadius: 999,
          border: "none",
          background: "#111827",
          color: "#fff",
          cursor: "pointer",
          boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
        }}
      >
        💬 Feedback
      </button>
    </div>
  );
}
