import { createClient, type FeedbackType, type ReloopClient } from "@reloop-sdk/core";

export interface WidgetConfig {
  apiKey: string;
  endpoint: string;
  title?: string;
  position?: "bottom-right" | "bottom-left";
}

const TYPES: FeedbackType[] = ["bug", "idea", "praise"];

/** Mounts the floating feedback widget and returns the underlying client. */
export function mountWidget(config: WidgetConfig): ReloopClient {
  const client = createClient({
    apiKey: config.apiKey,
    endpoint: config.endpoint,
  });

  const root = document.createElement("div");
  root.style.cssText = `position:fixed;bottom:20px;${
    config.position === "bottom-left" ? "left:20px" : "right:20px"
  };z-index:2147483000;font:14px system-ui,sans-serif`;

  let open = false;
  let type: FeedbackType = "idea";

  function render() {
    root.innerHTML = "";
    if (open) {
      const panel = document.createElement("form");
      panel.style.cssText =
        "width:300px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin-bottom:12px;box-shadow:0 10px 30px rgba(0,0,0,.12)";
      panel.innerHTML = `<strong style="display:block;margin-bottom:10px">${
        config.title ?? "Send feedback"
      }</strong>
        <div data-tabs style="display:flex;gap:6px;margin-bottom:10px"></div>
        <textarea name="message" rows="4" placeholder="Tell us what's on your mind…"
          style="width:100%;box-sizing:border-box;border-radius:8px;border:1px solid #e5e7eb;padding:8px;resize:vertical"></textarea>
        <button type="submit" style="margin-top:10px;width:100%;padding:8px 0;border-radius:8px;border:none;background:#2563eb;color:#fff;cursor:pointer">Send</button>`;

      const tabs = panel.querySelector("[data-tabs]") as HTMLElement;
      for (const t of TYPES) {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = t;
        b.style.cssText = `flex:1;padding:6px 0;border-radius:8px;border:1px solid #e5e7eb;text-transform:capitalize;cursor:pointer;${
          type === t ? "background:#111827;color:#fff" : "background:#fff;color:#111827"
        }`;
        b.onclick = () => {
          type = t;
          render();
        };
        tabs.appendChild(b);
      }

      panel.onsubmit = async (e) => {
        e.preventDefault();
        const ta = panel.querySelector("textarea") as HTMLTextAreaElement;
        if (!ta.value.trim()) return;
        await client.submit({ type, message: ta.value });
        panel.innerHTML =
          '<p>Thanks for the feedback! 🙌</p><button type="button" data-close>Close</button>';
        (panel.querySelector("[data-close]") as HTMLButtonElement).onclick = () => {
          open = false;
          render();
        };
      };
      root.appendChild(panel);
    }

    const launcher = document.createElement("button");
    launcher.type = "button";
    launcher.textContent = "💬 Feedback";
    launcher.style.cssText =
      "padding:10px 16px;border-radius:999px;border:none;background:#111827;color:#fff;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.18)";
    launcher.onclick = () => {
      open = !open;
      render();
    };
    root.appendChild(launcher);
  }

  render();
  document.body.appendChild(root);
  return client;
}
