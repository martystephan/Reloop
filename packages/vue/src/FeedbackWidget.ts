import { defineComponent, h, ref } from "vue";
import type { FeedbackType } from "@reloop/core";
import { useFeedback } from "./useFeedback.js";

const TYPES: FeedbackType[] = ["bug", "idea", "praise"];

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

    return () => {
      const side =
        props.position === "bottom-left" ? { left: "20px" } : { right: "20px" };

      const panel = open.value
        ? h(
            "form",
            {
              onSubmit,
              style: {
                width: "300px",
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "12px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                font: "14px system-ui, sans-serif",
              },
            },
            [
              h("strong", { style: { display: "block", marginBottom: "10px" } }, props.title),
              status.value === "success"
                ? h("div", [
                    h("p", "Thanks for the feedback! 🙌"),
                    h(
                      "button",
                      {
                        type: "button",
                        onClick: () => {
                          reset();
                          open.value = false;
                        },
                      },
                      "Close",
                    ),
                  ])
                : h("div", [
                    h(
                      "div",
                      { style: { display: "flex", gap: "6px", marginBottom: "10px" } },
                      TYPES.map((t) =>
                        h(
                          "button",
                          {
                            key: t,
                            type: "button",
                            onClick: () => (type.value = t),
                            style: {
                              flex: "1",
                              padding: "6px 0",
                              borderRadius: "8px",
                              border: "1px solid #e5e7eb",
                              textTransform: "capitalize",
                              cursor: "pointer",
                              background: type.value === t ? "#111827" : "#fff",
                              color: type.value === t ? "#fff" : "#111827",
                            },
                          },
                          t,
                        ),
                      ),
                    ),
                    h("textarea", {
                      rows: 4,
                      placeholder: "Tell us what's on your mind…",
                      value: message.value,
                      onInput: (e: Event) =>
                        (message.value = (e.target as HTMLTextAreaElement).value),
                      style: {
                        width: "100%",
                        boxSizing: "border-box",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        padding: "8px",
                        resize: "vertical",
                      },
                    }),
                    h(
                      "button",
                      {
                        type: "submit",
                        disabled: status.value === "submitting",
                        style: {
                          marginTop: "10px",
                          width: "100%",
                          padding: "8px 0",
                          borderRadius: "8px",
                          border: "none",
                          background: "#2563eb",
                          color: "#fff",
                          cursor: "pointer",
                        },
                      },
                      status.value === "submitting" ? "Sending…" : "Send",
                    ),
                  ]),
            ],
          )
        : null;

      return h(
        "div",
        {
          style: {
            position: "fixed",
            bottom: "20px",
            zIndex: 2147483000,
            ...side,
          },
        },
        [
          panel,
          h(
            "button",
            {
              type: "button",
              onClick: () => (open.value = !open.value),
              style: {
                padding: "10px 16px",
                borderRadius: "999px",
                border: "none",
                background: "#111827",
                color: "#fff",
                cursor: "pointer",
                boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
              },
            },
            "💬 Feedback",
          ),
        ],
      );
    };
  },
});
