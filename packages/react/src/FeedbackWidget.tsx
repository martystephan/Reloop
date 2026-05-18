import { useState } from "react";
import type { FeedbackType } from "@reloop-sdk/core";
import { useFeedback } from "./useFeedback.js";

export interface FeedbackWidgetProps {
  /** Heading shown at the top of the panel. */
  title?: string;
  /** Where the launcher button sits. Default "bottom-right". */
  position?: "bottom-right" | "bottom-left";
}

const TYPES: { value: FeedbackType; label: string }[] = [
  { value: "bug", label: "Bug" },
  { value: "idea", label: "Idea" },
  { value: "praise", label: "Praise" },
];

const FONT =
  "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
const BORDER = "#e5e7eb";
const INK = "#111827";
const MUTED = "#6b7280";
const ACCENT = "#2563eb";

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

  function close() {
    reset();
    setOpen(false);
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        ...side,
        zIndex: 2147483000,
        font: FONT,
      }}
    >
      <style>{`
        @keyframes reloop-pop {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .reloop-panel { animation: reloop-pop 160ms cubic-bezier(0.16, 1, 0.3, 1); }
        .reloop-field:focus { outline: none; border-color: ${ACCENT}; box-shadow: 0 0 0 3px rgba(37,99,235,0.15); }
        .reloop-send:hover:not(:disabled) { background: #1d4ed8; }
        .reloop-send:disabled { opacity: 0.6; cursor: default; }
      `}</style>

      {open && (
        <form
          className="reloop-panel"
          onSubmit={onSubmit}
          style={{
            width: 320,
            background: "#fff",
            border: `1px solid ${BORDER}`,
            borderRadius: 16,
            padding: 20,
            marginBottom: 12,
            boxShadow: "0 12px 40px rgba(0,0,0,0.16)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <strong style={{ fontSize: 15, color: INK }}>{title}</strong>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              style={{
                border: "none",
                background: "transparent",
                color: MUTED,
                cursor: "pointer",
                fontSize: 18,
                lineHeight: 1,
                padding: 4,
              }}
            >
              ×
            </button>
          </div>

          {status === "success" ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <p style={{ margin: "0 0 16px", color: INK }}>
                Thanks for the feedback!
              </p>
              <button
                type="button"
                onClick={close}
                style={{
                  padding: "8px 20px",
                  borderRadius: 8,
                  border: `1px solid ${BORDER}`,
                  background: "#fff",
                  color: INK,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                {TYPES.map((t) => {
                  const active = type === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      style={{
                        flex: 1,
                        padding: "8px 0",
                        fontSize: 13,
                        borderRadius: 10,
                        border: `1px solid ${active ? INK : BORDER}`,
                        background: active ? INK : "#fff",
                        color: active ? "#fff" : INK,
                        cursor: "pointer",
                        transition: "background 120ms, border-color 120ms",
                      }}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>

              <textarea
                className="reloop-field"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what's on your mind…"
                rows={4}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  borderRadius: 10,
                  border: `1px solid ${BORDER}`,
                  padding: 10,
                  resize: "vertical",
                  font: FONT,
                  color: INK,
                  transition: "border-color 120ms, box-shadow 120ms",
                }}
              />

              {status === "error" && (
                <p
                  style={{ margin: "8px 0 0", color: "#dc2626", fontSize: 13 }}
                >
                  Something went wrong. Please try again.
                </p>
              )}

              <button
                className="reloop-send"
                type="submit"
                disabled={status === "submitting" || !message.trim()}
                style={{
                  marginTop: 12,
                  width: "100%",
                  padding: "10px 0",
                  borderRadius: 10,
                  border: "none",
                  background: ACCENT,
                  color: "#fff",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background 120ms, opacity 120ms",
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
          padding: "11px 18px",
          borderRadius: 999,
          border: "none",
          background: INK,
          color: "#fff",
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
          transition: "transform 120ms",
        }}
      >
        Feedback
      </button>
    </div>
  );
}
