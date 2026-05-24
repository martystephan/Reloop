import { mountWidget, type WidgetConfig } from "./widget.js";

export { mountWidget };

/**
 * Auto-init from the loading <script> tag:
 *
 *   <script src="https://cdn/reloop.global.js"
 *           data-reloop-key="rl_pub_..."
 *           data-reloop-endpoint="https://feedback.example.com"
 *           data-reloop-position="bottom-right"></script>
 */
function autoInit() {
  const script =
    document.currentScript ??
    document.querySelector<HTMLScriptElement>("script[data-reloop-key]");
  if (!script) return;

  const apiKey = script.getAttribute("data-reloop-key");
  const endpoint = script.getAttribute("data-reloop-endpoint");
  if (!apiKey || !endpoint) {
    const missing = [!apiKey && "data-reloop-key", !endpoint && "data-reloop-endpoint"]
      .filter(Boolean)
      .join(" and ");
    console.warn(
      `[reloop] ${missing} missing on <script> — widget will not mount.`,
    );
    return;
  }

  const config: WidgetConfig = {
    apiKey,
    endpoint,
    title: script.getAttribute("data-reloop-title") ?? undefined,
    position:
      (script.getAttribute("data-reloop-position") as WidgetConfig["position"]) ??
      "bottom-right",
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => mountWidget(config));
  } else {
    mountWidget(config);
  }
}

autoInit();
