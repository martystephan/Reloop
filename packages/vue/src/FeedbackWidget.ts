import { defineComponent, h, ref } from "vue";
import type { FeedbackType } from "@reloop-sdk/core";
import { useFeedback } from "./useFeedback.js";

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

const STYLES = `
  @keyframes reloop-pop {
    from { opacity: 0; transform: translateY(8px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .reloop-panel { animation: reloop-pop 160ms cubic-bezier(0.16, 1, 0.3, 1); }
  .reloop-field:focus { outline: none; border-color: ${ACCENT}; box-shadow: 0 0 0 3px rgba(37,99,235,0.15); }
  .reloop-send:hover:not(:disabled) { background: #1d4ed8; }
  .reloop-send:disabled { opacity: 0.6; cursor: default; }
`;

export const FeedbackWidget = defineComponent({
  name: "ReloopFeedbackWidget",
  props: {
    title: { type: String, default: "Send feedback" },
    position: { type: String, default: "bottom-right" },
  },
  setup(props) {
    const { submit, status, reset } = useFeedback();
    const open = ref(false);
    const type = ref<FeedbackType>("idea");
    const message = ref("");

    async function onSubmit(e: Event) {
      e.preventDefault();
      if (!message.value.trim()) return;
      await submit({ type: type.value, message: message.value });
      message.value = "";
    }

    function close() {
      reset();
      open.value = false;
    }

    return () => {
      const side =
        props.position === "bottom-left" ? { left: "20px" } : { right: "20px" };

      const header = h(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
          },
        },
        [
          h(
            "strong",
            { style: { fontSize: "15px", color: INK } },
            props.title,
          ),
          h(
            "button",
            {
              type: "button",
              "aria-label": "Close",
              onClick: close,
              style: {
                border: "none",
                background: "transparent",
                color: MUTED,
                cursor: "pointer",
                fontSize: "18px",
                lineHeight: "1",
                padding: "4px",
              },
            },
            "×",
          ),
        ],
      );

      const body =
        status.value === "success"
          ? h("div", { style: { textAlign: "center", padding: "24px 0" } }, [
              h(
                "p",
                { style: { margin: "0 0 16px", color: INK } },
                "Thanks for the feedback!",
              ),
              h(
                "button",
                {
                  type: "button",
                  onClick: close,
                  style: {
                    padding: "8px 20px",
                    borderRadius: "8px",
                    border: `1px solid ${BORDER}`,
                    background: "#fff",
                    color: INK,
                    cursor: "pointer",
                  },
                },
                "Close",
              ),
            ])
          : h("div", [
              h(
                "div",
                { style: { display: "flex", gap: "8px", marginBottom: "12px" } },
                TYPES.map((t) => {
                  const active = type.value === t.value;
                  return h(
                    "button",
                    {
                      key: t.value,
                      type: "button",
                      onClick: () => (type.value = t.value),
                      style: {
                        flex: "1",
                        padding: "8px 0",
                        fontSize: "13px",
                        borderRadius: "10px",
                        border: `1px solid ${active ? INK : BORDER}`,
                        background: active ? INK : "#fff",
                        color: active ? "#fff" : INK,
                        cursor: "pointer",
                        transition: "background 120ms, border-color 120ms",
                      },
                    },
                    t.label,
                  );
                }),
              ),
              h("textarea", {
                class: "reloop-field",
                rows: 4,
                placeholder: "Tell us what's on your mind…",
                value: message.value,
                onInput: (e: Event) =>
                  (message.value = (e.target as HTMLTextAreaElement).value),
                style: {
                  width: "100%",
                  boxSizing: "border-box",
                  borderRadius: "10px",
                  border: `1px solid ${BORDER}`,
                  padding: "10px",
                  resize: "vertical",
                  font: FONT,
                  color: INK,
                  transition: "border-color 120ms, box-shadow 120ms",
                },
              }),
              status.value === "error"
                ? h(
                    "p",
                    {
                      style: {
                        margin: "8px 0 0",
                        color: "#dc2626",
                        fontSize: "13px",
                      },
                    },
                    "Something went wrong. Please try again.",
                  )
                : null,
              h(
                "button",
                {
                  class: "reloop-send",
                  type: "submit",
                  disabled:
                    status.value === "submitting" || !message.value.trim(),
                  style: {
                    marginTop: "12px",
                    width: "100%",
                    padding: "10px 0",
                    borderRadius: "10px",
                    border: "none",
                    background: ACCENT,
                    color: "#fff",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "background 120ms, opacity 120ms",
                  },
                },
                status.value === "submitting" ? "Sending…" : "Send",
              ),
            ]);

      const panel = open.value
        ? h(
            "form",
            {
              class: "reloop-panel",
              onSubmit,
              style: {
                width: "320px",
                background: "#fff",
                border: `1px solid ${BORDER}`,
                borderRadius: "16px",
                padding: "20px",
                marginBottom: "12px",
                boxShadow: "0 12px 40px rgba(0,0,0,0.16)",
              },
            },
            [header, body],
          )
        : null;

      return h(
        "div",
        {
          style: {
            position: "fixed",
            bottom: "20px",
            zIndex: 2147483000,
            font: FONT,
            ...side,
          },
        },
        [
          h("style", STYLES),
          panel,
          h(
            "button",
            {
              type: "button",
              onClick: () => (open.value = !open.value),
              style: {
                padding: "11px 18px",
                borderRadius: "999px",
                border: "none",
                background: INK,
                color: "#fff",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
                transition: "transform 120ms",
              },
            },
            "Feedback",
          ),
        ],
      );
    };
  },
});
